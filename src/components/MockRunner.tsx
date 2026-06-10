import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Card, Pill } from '@/components/ui';
import { cn, formatTime } from '@/lib/utils';
import { TOPIC_MAP } from '@/lib/topics';
import { Timer, ArrowRight, ChevronDown, ChevronUp, WifiOff } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE ?? '';

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (attempt === retries) return res;
    } catch (e) {
      if (attempt === retries) throw e;
    }
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt)); // 500ms, 1s, 2s
  }
  throw new Error('unreachable');
}

const RW_SECS = 64 * 60;
const MATH_SECS = 70 * 60;
const BREAK_SECS = 5 * 60;

type Phase = 'intro' | 'rw' | 'break' | 'math' | 'review';
type ChoiceId = 'A' | 'B' | 'C' | 'D';
interface AnswerRecord { selected: ChoiceId | null; timeSec: number; }

function estimateSection(correct: number, total: number): number {
  if (!total) return 200;
  return Math.round(200 + (correct / total) * 600);
}

function newSessionId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface StoredSession {
  id: string;
  phase: string;
  rw_idx: number;
  math_idx: number;
  answers_json: string;
  rw_started_at: number | null;
  math_started_at: number | null;
  started_at: number;
  rw_correct: number;
  rw_total: number;
  math_correct: number;
  math_total: number;
}

interface Props {
  questions: Question[];
  email?: string;
  date?: string;
  /** Pass an existing in-progress session to resume it */
  session?: StoredSession | null;
}

export default function MockRunner({ questions, email, date, session }: Props) {
  const { recordAttempt, finishSession } = useStore();

  const rwQs = questions.filter((q) => q.section === 'Reading & Writing');
  const mathQs = questions.filter((q) => q.section === 'Math');

  // Session persistence refs (stable across renders)
  const sessionIdRef = useRef<string>(session?.id ?? newSessionId());
  const startedAtRef = useRef<number>(session?.started_at ?? Date.now());
  const rwStartedRef = useRef<number | null>(session?.rw_started_at ?? null);
  const mathStartedRef = useRef<number | null>(session?.math_started_at ?? null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveError, setSaveError] = useState(false);

  // Restore state from session if resuming
  const initPhase = (session?.phase ?? 'intro') as Phase;
  const initAnswers: Record<string, AnswerRecord> = (() => {
    try { return session ? JSON.parse(session.answers_json) : {}; } catch { return {}; }
  })();

  const [phase, setPhase] = useState<Phase>(initPhase === 'review' ? 'review' : initPhase === 'intro' ? 'intro' : initPhase as Phase);
  const [rwIdx, setRwIdx] = useState(session?.rw_idx ?? 0);
  const [mathIdx, setMathIdx] = useState(session?.math_idx ?? 0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(initAnswers);
  const [pending, setPending] = useState<ChoiceId | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [qStart, setQStart] = useState(Date.now());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Persist session to DB (with retry + error indicator) ──────────────────
  const saveSession = useCallback(async (updates: Partial<{
    status: string; phase: string; answers_json: string;
    rw_idx: number; math_idx: number;
    rw_started_at: number; math_started_at: number; started_at: number;
    rw_correct: number; rw_total: number;
    math_correct: number; math_total: number;
    completed_at: number;
  }>) => {
    if (!email || !date || savingRef.current) return;
    savingRef.current = true;
    const payload = JSON.stringify({
      id: sessionIdRef.current,
      user_email: email,
      date,
      started_at: startedAtRef.current,
      rw_started_at: rwStartedRef.current,
      math_started_at: mathStartedRef.current,
      questions_json: JSON.stringify(questions),
      answers_json: JSON.stringify(answers),
      phase,
      rw_idx: rwIdx,
      math_idx: mathIdx,
      rw_correct: 0, rw_total: rwQs.length,
      math_correct: 0, math_total: mathQs.length,
      ...updates,
    });
    try {
      await fetchWithRetry(`${API}/api/mock-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      setSaveError(false);
    } catch (e) {
      console.warn('[MockRunner] save failed after retries', e);
      setSaveError(true);
      // Clear the error indicator after 8s so it doesn't persist forever
      setTimeout(() => setSaveError(false), 8000);
    } finally {
      savingRef.current = false;
    }
  }, [email, date, questions, answers, phase, rwIdx, mathIdx, rwQs.length, mathQs.length]);

  // ── Debounced per-answer save (fires 600ms after last answer) ──────────────
  const debouncedSave = useCallback((updates: Parameters<typeof saveSession>[0]) => {
    if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current);
    pendingSaveRef.current = setTimeout(() => { void saveSession(updates); }, 600);
  }, [saveSession]);

  // ── Section timer initialization ───────────────────────────────────────────
  useEffect(() => {
    if (phase === 'rw') {
      if (!rwStartedRef.current) rwStartedRef.current = Date.now();
      const elapsed = (Date.now() - rwStartedRef.current) / 1000;
      setTimer(Math.round(Math.max(60, RW_SECS - elapsed)));
      setQStart(Date.now());
    } else if (phase === 'math') {
      if (!mathStartedRef.current) {
        mathStartedRef.current = Date.now();
        void saveSession({ phase: 'math', math_started_at: mathStartedRef.current });
      }
      const elapsed = (Date.now() - mathStartedRef.current) / 1000;
      setTimer(Math.round(Math.max(60, MATH_SECS - elapsed)));
      setQStart(Date.now());
    } else if (phase === 'break') {
      setTimer(BREAK_SECS);
    } else {
      setTimer(null);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timer === null || timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // ── Timer expiry ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (timer !== 0) return;
    if (phase === 'rw') {
      rwQs.forEach((q) => {
        if (!answers[q.id]) recordAttempt({ question: q, selected: null, timeSec: 60, confidence: 'medium', mode: 'mock' });
      });
      setPhase('break');
    } else if (phase === 'break') {
      setPhase('math');
    } else if (phase === 'math') {
      mathQs.forEach((q) => {
        if (!answers[q.id]) recordAttempt({ question: q, selected: null, timeSec: 60, confidence: 'medium', mode: 'mock' });
      });
      const newAnswers = { ...answers };
      const rwC = rwQs.filter((q) => newAnswers[q.id]?.selected === q.correct).length;
      const mathC = mathQs.filter((q) => newAnswers[q.id]?.selected === q.correct).length;
      finishSession('mock', 0);
      void saveSession({
        status: 'complete', phase: 'review', answers_json: JSON.stringify(newAnswers),
        rw_correct: rwC, rw_total: rwQs.length,
        math_correct: mathC, math_total: mathQs.length, completed_at: Date.now(),
      });
      setPhase('review');
    }
  }, [timer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Answer & advance ───────────────────────────────────────────────────────
  const advance = useCallback(() => {
    const q = phase === 'rw' ? rwQs[rwIdx] : phase === 'math' ? mathQs[mathIdx] : null;
    if (!q) return;

    const timeSec = (Date.now() - qStart) / 1000;
    const newAnswers = { ...answers, [q.id]: { selected: pending, timeSec } };
    setAnswers(newAnswers);
    recordAttempt({ question: q, selected: pending, timeSec, confidence: 'medium', mode: 'mock' });
    setPending(null);
    setQStart(Date.now());

    if (phase === 'rw') {
      const nextIdx = rwIdx + 1;
      if (nextIdx >= rwQs.length) {
        const rwC = rwQs.filter((q2) => newAnswers[q2.id]?.selected === q2.correct).length;
        // Section end — save immediately (no debounce)
        void saveSession({
          answers_json: JSON.stringify(newAnswers), phase: 'break', rw_idx: nextIdx,
          rw_correct: rwC, rw_total: rwQs.length,
        });
        setPhase('break');
      } else {
        setRwIdx(nextIdx);
        // Per-answer debounced save — no data lost on network blip
        debouncedSave({ answers_json: JSON.stringify(newAnswers), rw_idx: nextIdx });
      }
    } else if (phase === 'math') {
      const nextIdx = mathIdx + 1;
      if (nextIdx >= mathQs.length) {
        const mathC = mathQs.filter((q2) => newAnswers[q2.id]?.selected === q2.correct).length;
        const rwC = rwQs.filter((q2) => newAnswers[q2.id]?.selected === q2.correct).length;
        finishSession('mock', 0);
        // Completion — save immediately (no debounce)
        void saveSession({
          answers_json: JSON.stringify(newAnswers), status: 'complete', phase: 'review',
          math_idx: nextIdx, math_correct: mathC, math_total: mathQs.length,
          rw_correct: rwC, rw_total: rwQs.length, completed_at: Date.now(),
        });
        setPhase('review');
      } else {
        setMathIdx(nextIdx);
        // Per-answer debounced save
        debouncedSave({ answers_json: JSON.stringify(newAnswers), math_idx: nextIdx });
      }
    }
  }, [phase, rwIdx, mathIdx, rwQs, mathQs, pending, answers, qStart, recordAttempt, finishSession, saveSession, debouncedSave]);

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-brand-500/30 p-8 text-white shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📋</div>
              <h2 className="font-display text-2xl font-extrabold">Full-Length SAT Simulation</h2>
              <p className="text-white/60 mt-1 text-sm">Timed · Full-length · Scored like the real exam</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl bg-white/10 p-4 text-center">
                <div className="font-display text-2xl font-bold">{rwQs.length}</div>
                <div className="text-xs text-white/60 mt-0.5">Reading & Writing</div>
                <div className="text-xs text-white/40 mt-0.5">64 min</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-center">
                <div className="font-display text-2xl font-bold">{mathQs.length}</div>
                <div className="text-xs text-white/60 mt-0.5">Math</div>
                <div className="text-xs text-white/40 mt-0.5">70 min</div>
              </div>
            </div>
            <div className="space-y-2 mb-6 text-sm">
              {([
                ['📱', 'Put your phone on silent mode'],
                ['⏱', 'Each section is timed — manage your time carefully'],
                ['🚫', 'No feedback during the exam — just like the real SAT'],
                ['📝', 'Full per-question analysis revealed at the end'],
                ['🔒', 'Progress is saved — you can resume if interrupted'],
              ] as [string, string][]).map(([icon, text]) => (
                <div key={text} className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-2.5">
                  <span>{icon}</span><span className="text-white/80">{text}</span>
                </div>
              ))}
            </div>
            <button
              className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-accent-500 py-4 font-bold text-white text-base shadow-glow hover:opacity-90 transition-opacity"
              onClick={() => {
                const now = Date.now();
                startedAtRef.current = now;
                rwStartedRef.current = now;
                void saveSession({ status: 'in-progress', phase: 'rw', rw_started_at: now, started_at: now });
                setPhase('rw');
              }}
            >
              I'm Ready — Begin Exam →
            </button>
            <a href="/app/mock" className="block text-center mt-3 text-sm text-white/40 hover:text-white/60 transition-colors">
              ← Back to mock hub
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── BREAK ──────────────────────────────────────────────────────────────────
  if (phase === 'break') {
    const rwCorrect = rwQs.filter((q) => answers[q.id]?.selected === q.correct).length;
    return (
      <div className="mx-auto max-w-md text-center py-16 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-6xl mb-4">✅</div>
          <h2 className="font-display text-2xl font-bold">Reading & Writing — Done!</h2>
          <p className="text-muted mt-1 text-sm">{rwQs.length} questions answered · {rwCorrect} correct</p>
          {timer !== null && timer > 0 && (
            <p className="mt-4 text-sm text-muted">
              Optional break: <span className="font-bold tabular-nums">{formatTime(timer)}</span> remaining
            </p>
          )}
          <button className="mt-6 btn-primary px-8 py-3.5 text-base" onClick={() => setPhase('math')}>
            Begin Math Section <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── REVIEW ─────────────────────────────────────────────────────────────────
  if (phase === 'review') {
    return <MockReview rwQs={rwQs} mathQs={mathQs} answers={answers} expandedId={expandedId} setExpandedId={setExpandedId} />;
  }

  // ── ACTIVE TEST ─────────────────────────────────────────────────────────────
  const isRw = phase === 'rw';
  const sectionQs = isRw ? rwQs : mathQs;
  const idx = isRw ? rwIdx : mathIdx;
  const q = sectionQs[idx];
  if (!q) return null;

  const isTimeLow = timer !== null && timer <= 10 * 60;
  const isTimeCritical = timer !== null && timer <= 2 * 60;
  const sectionLabel = isRw ? 'Reading & Writing' : 'Math';

  return (
    <div className="mx-auto max-w-3xl">
      {saveError && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          <WifiOff size={15} className="shrink-0" />
          <span>Progress save failed — retrying. Don't close this tab.</span>
        </div>
      )}
      <div className="mb-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span className="font-bold uppercase tracking-wide">{sectionLabel}</span>
            <span>{idx + 1} / {sectionQs.length}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
              animate={{ width: `${(idx / sectionQs.length) * 100}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>
        {timer !== null && (
          <motion.span
            className={cn(
              'chip tabular-nums shrink-0 font-mono',
              isTimeCritical ? 'bg-danger/15 text-danger border border-danger/25' :
              isTimeLow ? 'bg-warning/15 text-warning border border-warning/25' :
              'bg-slate-500/10 text-muted border border-[rgb(var(--border))]'
            )}
            animate={isTimeCritical ? { scale: [1, 1.04, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Timer size={13} /> {formatTime(timer)}
          </motion.span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
        >
          <Card>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Pill tone="brand">{TOPIC_MAP[q.topic]?.name ?? q.topic}</Pill>
              <Pill tone="muted">{q.subtopic}</Pill>
              <Pill tone={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>{q.difficulty}</Pill>
            </div>
            {q.passage && (
              <div className="mb-5 rounded-2xl border-l-4 border-brand-400 bg-brand-500/5 p-4 text-sm leading-relaxed">{q.passage}</div>
            )}
            <p className="text-lg font-medium leading-relaxed mb-6">{q.prompt}</p>
            <div className="space-y-2.5">
              {q.choices.map((c) => (
                <motion.button
                  key={c.id}
                  onClick={() => setPending(c.id)}
                  whileTap={{ scale: 0.985 }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all duration-200',
                    pending === c.id
                      ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-brand-400 hover:bg-brand-500/5'
                  )}
                >
                  <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg font-bold text-xs transition-colors',
                    pending === c.id ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700'
                  )}>
                    {c.id}
                  </span>
                  <span className="flex-1">{c.text}</span>
                </motion.button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-muted">No answer feedback until the full review</p>
              <motion.button
                className="btn-primary px-7 py-2.5"
                onClick={advance}
                disabled={pending === null}
                whileTap={{ scale: 0.96 }}
              >
                {idx + 1 >= sectionQs.length
                  ? isRw ? 'End Section →' : 'Finish Exam →'
                  : 'Next →'}
              </motion.button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap gap-1 mt-3 justify-center">
        {sectionQs.map((sq, i) => (
          <div key={sq.id} className={cn('h-1.5 rounded-full transition-all',
            i < idx ? 'bg-brand-400 w-3' : i === idx ? 'bg-brand-500 w-4' : 'bg-slate-300 dark:bg-slate-700 w-1.5'
          )} />
        ))}
      </div>
    </div>
  );
}

// ── Shared review component (used by MockRunner and MockHistory) ──────────────
export function MockReview({
  rwQs, mathQs, answers, expandedId, setExpandedId,
}: {
  rwQs: Question[];
  mathQs: Question[];
  answers: Record<string, AnswerRecord>;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  const rwCorrect = rwQs.filter((q) => answers[q.id]?.selected === q.correct).length;
  const mathCorrect = mathQs.filter((q) => answers[q.id]?.selected === q.correct).length;
  const rwScore = estimateSection(rwCorrect, rwQs.length);
  const mathScore = estimateSection(mathCorrect, mathQs.length);
  const total = rwScore + mathScore;
  const totalCorrect = rwCorrect + mathCorrect;
  const totalQ = rwQs.length + mathQs.length;

  return (
    <div className="space-y-6 mx-auto max-w-3xl pb-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 p-8 text-white text-center shadow-glow-lg">
          <div className="text-5xl mb-3">🎓</div>
          <h2 className="font-display text-3xl font-extrabold">Mock Test Complete!</h2>
          <p className="text-white/60 text-sm mt-1">{totalCorrect} of {totalQ} correct</p>
          <div className="mt-6 flex items-center justify-center gap-6 sm:gap-12">
            <SectionScore label="Reading & Writing" score={rwScore} correct={rwCorrect} total={rwQs.length} />
            <div className="text-center">
              <div className="font-display text-5xl sm:text-6xl font-extrabold">{total}</div>
              <div className="text-white/60 text-xs mt-1">Estimated SAT Score</div>
              <div className={`mt-2 inline-block text-xs font-bold px-3 py-1 rounded-full ${total >= 1550 ? 'bg-green-400/30' : total >= 1400 ? 'bg-yellow-400/30' : 'bg-red-400/30'}`}>
                {total >= 1550 ? '🎯 Target reached!' : total >= 1400 ? '🟢 On track for 1550' : total >= 1200 ? '🟡 Keep improving' : '🔴 More practice needed'}
              </div>
            </div>
            <SectionScore label="Math" score={mathScore} correct={mathCorrect} total={mathQs.length} />
          </div>
        </div>
      </motion.div>

      {(['Reading & Writing', 'Math'] as const).map((sec) => {
        const sqs = sec === 'Reading & Writing' ? rwQs : mathQs;
        if (!sqs.length) return null;
        const sc = sqs.filter((q) => answers[q.id]?.selected === q.correct).length;
        return (
          <div key={sec}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-display font-bold text-lg">{sec}</h3>
              <Pill tone={sc / sqs.length >= 0.7 ? 'success' : sc / sqs.length >= 0.5 ? 'warning' : 'danger'}>
                {sc}/{sqs.length} correct
              </Pill>
            </div>
            <div className="space-y-2">
              {sqs.map((q, i) => {
                const ans = answers[q.id];
                const correct = ans?.selected === q.correct;
                const isExp = expandedId === q.id;
                const exp = (typeof q.explanation === 'object' ? q.explanation : {}) as Record<string, string>;
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.012 }}
                    className={cn('rounded-2xl border overflow-hidden', correct ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5')}
                  >
                    <button className="w-full flex items-center gap-3 p-3.5 text-left" onClick={() => setExpandedId(isExp ? null : q.id)}>
                      <span className={cn('grid h-6 w-6 place-items-center rounded-md text-xs font-bold shrink-0', correct ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger')}>
                        {correct ? '✓' : '✗'}
                      </span>
                      <span className="text-xs text-muted font-bold shrink-0 w-6">Q{i + 1}</span>
                      <span className="flex-1 text-sm truncate">{q.prompt.slice(0, 90)}{q.prompt.length > 90 ? '…' : ''}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn('text-xs font-bold', correct ? 'text-success' : 'text-danger')}>
                          {ans?.selected ?? '—'}{!correct && ans?.selected ? ` → ${q.correct}` : ''}
                        </span>
                        <Pill tone="muted" className="hidden sm:inline-flex text-[10px]">{q.difficulty}</Pill>
                        {ans?.timeSec ? <span className="text-xs text-muted tabular-nums">{Math.round(ans.timeSec)}s</span> : null}
                        {isExp ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExp && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[rgb(var(--border))] px-4 py-4 space-y-3 text-sm">
                            {q.passage && (
                              <div className="rounded-xl bg-brand-500/5 border-l-4 border-brand-400 p-3 text-sm leading-relaxed">{q.passage}</div>
                            )}
                            <p className="font-medium leading-relaxed">{q.prompt}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.choices.map((c) => (
                                <div key={c.id} className={cn('rounded-xl p-3 text-xs border flex gap-2',
                                  c.id === q.correct ? 'border-success/40 bg-success/10 font-semibold' :
                                  c.id === ans?.selected && !correct ? 'border-danger/40 bg-danger/10' :
                                  'border-[rgb(var(--border))]'
                                )}>
                                  <span className="font-bold shrink-0">{c.id}.</span><span>{c.text}</span>
                                </div>
                              ))}
                            </div>
                            {exp.correctWhy && (
                              <div className="rounded-xl bg-success/5 border border-success/20 p-3">
                                <div className="text-xs font-bold text-success mb-1">✓ Why the correct answer wins</div>
                                <p className="text-muted leading-relaxed">{exp.correctWhy}</p>
                              </div>
                            )}
                            {!correct && exp.trapNote && (
                              <div className="rounded-xl bg-warning/5 border border-warning/20 p-3">
                                <div className="text-xs font-bold text-warning mb-1">⚠ Trap to watch for</div>
                                <p className="text-muted leading-relaxed">{exp.trapNote}</p>
                              </div>
                            )}
                            {exp.fastStrategy && (
                              <div className="rounded-xl bg-brand-500/5 border border-brand-500/20 p-3">
                                <div className="text-xs font-bold text-brand-600 mb-1">⚡ Fast strategy</div>
                                <p className="text-muted leading-relaxed">{exp.fastStrategy}</p>
                              </div>
                            )}
                            {exp.simplerView && (
                              <div className="rounded-xl bg-accent-500/5 border border-accent-500/20 p-3">
                                <div className="text-xs font-bold text-accent-600 mb-1">💡 Simpler way to see it</div>
                                <p className="text-muted leading-relaxed">{exp.simplerView}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="text-center pt-4">
        <a href="/app/mock" className="btn-primary px-8 py-3 inline-flex">Back to Mock Hub <ArrowRight size={15} /></a>
        <a href="/app/mock-history" className="ml-3 btn-ghost px-6 py-3 inline-flex">View All History</a>
      </div>
    </div>
  );
}

function SectionScore({ label, score, correct, total }: { label: string; score: number; correct: number; total: number }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-bold">{score}</div>
      <div className="text-white/60 text-xs mt-0.5">{label}</div>
      <div className="text-white/40 text-xs">{correct}/{total}</div>
    </div>
  );
}
