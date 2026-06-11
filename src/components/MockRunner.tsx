import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Card, Pill } from '@/components/ui';
import { cn, formatTime } from '@/lib/utils';
import { Timer, ArrowRight, ArrowLeft, BookmarkCheck, Bookmark, ChevronDown, ChevronUp, WifiOff } from 'lucide-react';

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
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
  }
  throw new Error('unreachable');
}

// Real SAT Digital module timings
const RW_MOD_SECS = 32 * 60;   // 32 min per R&W module
const MATH_MOD_SECS = 35 * 60; // 35 min per Math module
const BREAK_SECS = 10 * 60;    // 10-min break between sections

// Phase represents which of the 5 real screens the student is on
type Phase = 'intro' | 'rw1' | 'rw-mod-break' | 'rw2' | 'break' | 'math1' | 'math-mod-break' | 'math2' | 'review';
type ChoiceId = 'A' | 'B' | 'C' | 'D';

interface AnswerRecord { selected: ChoiceId | null; timeSec: number; }

// Persisted phase is coarser (back-compat with existing sessions)
function storedPhaseToPhase(stored: string, rwIdx: number, mathIdx: number): Phase {
  if (stored === 'rw') return rwIdx >= 27 ? 'rw2' : 'rw1';
  if (stored === 'math') return mathIdx >= 22 ? 'math2' : 'math1';
  if (stored === 'rw1' || stored === 'rw-mod-break' || stored === 'rw2' ||
      stored === 'math1' || stored === 'math-mod-break' || stored === 'math2') return stored as Phase;
  return stored as Phase;
}

function phaseToStored(phase: Phase): string {
  // Collapse module phases to coarser for DB storage (back-compat)
  if (phase === 'rw1' || phase === 'rw-mod-break' || phase === 'rw2') return 'rw';
  if (phase === 'math1' || phase === 'math-mod-break' || phase === 'math2') return 'math';
  return phase;
}

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
  session?: StoredSession | null;
}

export default function MockRunner({ questions, email, date, session }: Props) {
  const { recordAttempt, finishSession } = useStore();

  // Split 54 R&W questions into Module 1 (0-26) and Module 2 (27-53)
  const rwQs = questions.filter((q) => q.section === 'Reading & Writing');
  const mathQs = questions.filter((q) => q.section === 'Math');
  const rwMod1 = rwQs.slice(0, 27);
  const rwMod2 = rwQs.slice(27);
  const mathMod1 = mathQs.slice(0, 22);
  const mathMod2 = mathQs.slice(22);

  // Session persistence refs
  const sessionIdRef = useRef<string>(session?.id ?? newSessionId());
  const startedAtRef = useRef<number>(session?.started_at ?? Date.now());
  const rwStartedRef = useRef<number | null>(session?.rw_started_at ?? null);
  const mathStartedRef = useRef<number | null>(session?.math_started_at ?? null);
  // Track per-module start times in memory (rw2 starts after mod-break, math2 same)
  const rw2StartedRef = useRef<number | null>(null);
  const math2StartedRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveError, setSaveError] = useState(false);

  const initPhase = storedPhaseToPhase(session?.phase ?? 'intro', session?.rw_idx ?? 0, session?.math_idx ?? 0);
  const initAnswers: Record<string, AnswerRecord> = (() => {
    try { return session ? JSON.parse(session.answers_json) : {}; } catch { return {}; }
  })();

  const [phase, setPhase] = useState<Phase>(initPhase);
  // Within-module index (0-based within the current module).
  // DB stores rw_idx as absolute (0-53), so subtract 27 when resuming into mod2.
  // Same for math: subtract 22 when resuming into mod2.
  const [rwIdx, setRwIdx] = useState(() => {
    const stored = session?.rw_idx ?? 0;
    const base = initPhase === 'rw2' ? Math.max(0, stored - 27) : stored;
    // Clamp to the active module's bounds — guards against OOB when a fresh
    // buildQuestions() produced fewer questions than the stored index expected.
    const mod = initPhase === 'rw2' ? rwMod2 : rwMod1;
    return mod.length > 0 ? Math.min(base, mod.length - 1) : 0;
  });
  const [mathIdx, setMathIdx] = useState(() => {
    const stored = session?.math_idx ?? 0;
    const base = initPhase === 'math2' ? Math.max(0, stored - 22) : stored;
    const mod = initPhase === 'math2' ? mathMod2 : mathMod1;
    return mod.length > 0 ? Math.min(base, mod.length - 1) : 0;
  });
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(initAnswers);
  // Current selection before confirming navigation
  const [pending, setPending] = useState<ChoiceId | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [qStart, setQStart] = useState(Date.now());
  // Questions marked for review within a module
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  // Review panel open/closed
  const [navOpen, setNavOpen] = useState(false);
  // Post-test review expansion
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Save to DB ─────────────────────────────────────────────────────────────
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
      phase: phaseToStored(phase),
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
      setTimeout(() => setSaveError(false), 8000);
    } finally {
      savingRef.current = false;
    }
  }, [email, date, questions, answers, phase, rwIdx, mathIdx, rwQs.length, mathQs.length]);

  const debouncedSave = useCallback((updates: Parameters<typeof saveSession>[0]) => {
    if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current);
    pendingSaveRef.current = setTimeout(() => { void saveSession(updates); }, 600);
  }, [saveSession]);

  // ── Timer initialization per phase ────────────────────────────────────────
  useEffect(() => {
    const now = Date.now();
    if (phase === 'rw1') {
      if (!rwStartedRef.current) rwStartedRef.current = now;
      const elapsed = (now - rwStartedRef.current) / 1000;
      setTimer(Math.round(Math.max(60, RW_MOD_SECS - elapsed)));
      setQStart(now);
    } else if (phase === 'rw2') {
      if (!rw2StartedRef.current) rw2StartedRef.current = now;
      const elapsed = (now - rw2StartedRef.current) / 1000;
      setTimer(Math.round(Math.max(60, RW_MOD_SECS - elapsed)));
      setQStart(now);
    } else if (phase === 'math1') {
      if (!mathStartedRef.current) {
        mathStartedRef.current = now;
        void saveSession({ phase: 'math', math_started_at: mathStartedRef.current });
      }
      const elapsed = (now - mathStartedRef.current) / 1000;
      setTimer(Math.round(Math.max(60, MATH_MOD_SECS - elapsed)));
      setQStart(now);
    } else if (phase === 'math2') {
      if (!math2StartedRef.current) math2StartedRef.current = now;
      const elapsed = (now - math2StartedRef.current) / 1000;
      setTimer(Math.round(Math.max(60, MATH_MOD_SECS - elapsed)));
      setQStart(now);
    } else if (phase === 'break' || phase === 'rw-mod-break' || phase === 'math-mod-break') {
      setTimer(phase === 'break' ? BREAK_SECS : 0);
    } else {
      setTimer(null);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timer === null || timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // ── Timer expiry ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (timer !== 0) return;
    if (phase === 'rw1') {
      rwMod1.forEach((q) => {
        if (!answers[q.id]) recordAttempt({ question: q, selected: null, timeSec: 60, confidence: 'medium', mode: 'mock' });
      });
      setPhase('rw-mod-break');
    } else if (phase === 'rw2') {
      rwMod2.forEach((q) => {
        if (!answers[q.id]) recordAttempt({ question: q, selected: null, timeSec: 60, confidence: 'medium', mode: 'mock' });
      });
      setPhase('break');
    } else if (phase === 'break') {
      setPhase('math1');
    } else if (phase === 'math1') {
      mathMod1.forEach((q) => {
        if (!answers[q.id]) recordAttempt({ question: q, selected: null, timeSec: 60, confidence: 'medium', mode: 'mock' });
      });
      setPhase('math-mod-break');
    } else if (phase === 'math2') {
      mathMod2.forEach((q) => {
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

  // ── Skip empty modules (pool too small to fill all 4) ─────────────────────
  useEffect(() => {
    const activePhases: Phase[] = ['rw1', 'rw2', 'math1', 'math2'];
    if (!activePhases.includes(phase)) return;
    const modQs = phase === 'rw1' ? rwMod1 : phase === 'rw2' ? rwMod2 : phase === 'math1' ? mathMod1 : mathMod2;
    if (modQs.length > 0) return;
    const next: Phase = phase === 'rw1' ? 'rw-mod-break' : phase === 'rw2' ? 'break' : phase === 'math1' ? 'math-mod-break' : 'review';
    setPhase(next);
  }, [phase, rwMod1.length, rwMod2.length, mathMod1.length, mathMod2.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigate to a specific question within the current module ─────────────
  const goTo = useCallback((targetIdx: number) => {
    // Save pending answer for current question before jumping
    const isRw = phase === 'rw1' || phase === 'rw2';
    const isMath = phase === 'math1' || phase === 'math2';
    if (!isRw && !isMath) return;

    const modQs = phase === 'rw1' ? rwMod1 : phase === 'rw2' ? rwMod2 : phase === 'math1' ? mathMod1 : mathMod2;
    const curIdx = isRw ? rwIdx : mathIdx;
    const curQ = modQs[curIdx];

    if (curQ && pending !== null) {
      const timeSec = (Date.now() - qStart) / 1000;
      const newAnswers = { ...answers, [curQ.id]: { selected: pending, timeSec } };
      setAnswers(newAnswers);
      recordAttempt({ question: curQ, selected: pending, timeSec, confidence: 'medium', mode: 'mock' });
      setPending(null);
      setQStart(Date.now());
      if (isRw) {
        setRwIdx(targetIdx);
        debouncedSave({ answers_json: JSON.stringify(newAnswers), rw_idx: targetIdx });
      } else {
        setMathIdx(targetIdx);
        debouncedSave({ answers_json: JSON.stringify(newAnswers), math_idx: targetIdx });
      }
    } else {
      if (isRw) setRwIdx(targetIdx);
      else setMathIdx(targetIdx);
      setPending(answers[modQs[targetIdx]?.id]?.selected ?? null);
      setQStart(Date.now());
    }
    setNavOpen(false);
  }, [phase, rwIdx, mathIdx, rwMod1, rwMod2, mathMod1, mathMod2, pending, answers, qStart, recordAttempt, debouncedSave]);

  // ── Advance to next question or end module ─────────────────────────────────
  const advance = useCallback(() => {
    const isRw = phase === 'rw1' || phase === 'rw2';
    const modQs = phase === 'rw1' ? rwMod1 : phase === 'rw2' ? rwMod2 : phase === 'math1' ? mathMod1 : mathMod2;
    const curIdx = isRw ? rwIdx : mathIdx;
    const q = modQs[curIdx];
    if (!q) return;

    const timeSec = (Date.now() - qStart) / 1000;
    const newAnswers = { ...answers, [q.id]: { selected: pending, timeSec } };
    setAnswers(newAnswers);
    recordAttempt({ question: q, selected: pending, timeSec, confidence: 'medium', mode: 'mock' });
    setPending(null);
    setQStart(Date.now());

    const nextIdx = curIdx + 1;

    if (phase === 'rw1') {
      if (nextIdx >= rwMod1.length) {
        const rwC = rwMod1.filter((q2) => newAnswers[q2.id]?.selected === q2.correct).length;
        void saveSession({ answers_json: JSON.stringify(newAnswers), phase: 'rw', rw_idx: nextIdx, rw_correct: rwC });
        setPhase('rw-mod-break');
      } else {
        setRwIdx(nextIdx);
        debouncedSave({ answers_json: JSON.stringify(newAnswers), rw_idx: nextIdx });
      }
    } else if (phase === 'rw2') {
      if (nextIdx >= rwMod2.length) {
        const rwC = rwQs.filter((q2) => newAnswers[q2.id]?.selected === q2.correct).length;
        void saveSession({ answers_json: JSON.stringify(newAnswers), phase: 'rw', rw_idx: 27 + nextIdx, rw_correct: rwC });
        setPhase('break');
      } else {
        setRwIdx(nextIdx);
        debouncedSave({ answers_json: JSON.stringify(newAnswers), rw_idx: 27 + nextIdx });
      }
    } else if (phase === 'math1') {
      if (nextIdx >= mathMod1.length) {
        const mathC = mathMod1.filter((q2) => newAnswers[q2.id]?.selected === q2.correct).length;
        void saveSession({ answers_json: JSON.stringify(newAnswers), phase: 'math', math_idx: nextIdx, math_correct: mathC });
        setPhase('math-mod-break');
      } else {
        setMathIdx(nextIdx);
        debouncedSave({ answers_json: JSON.stringify(newAnswers), math_idx: nextIdx });
      }
    } else if (phase === 'math2') {
      if (nextIdx >= mathMod2.length) {
        const mathC = mathQs.filter((q2) => newAnswers[q2.id]?.selected === q2.correct).length;
        const rwC = rwQs.filter((q2) => newAnswers[q2.id]?.selected === q2.correct).length;
        finishSession('mock', 0);
        void saveSession({
          answers_json: JSON.stringify(newAnswers), status: 'complete', phase: 'review',
          math_idx: 22 + nextIdx, math_correct: mathC, math_total: mathQs.length,
          rw_correct: rwC, rw_total: rwQs.length, completed_at: Date.now(),
        });
        setPhase('review');
      } else {
        setMathIdx(nextIdx);
        debouncedSave({ answers_json: JSON.stringify(newAnswers), math_idx: 22 + nextIdx });
      }
    }
  }, [phase, rwIdx, mathIdx, rwMod1, rwMod2, mathMod1, mathMod2, pending, answers, qStart,
      rwQs, mathQs, recordAttempt, finishSession, saveSession, debouncedSave]);

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
              <h2 className="font-display text-2xl font-extrabold">Full-Length SAT Practice Test</h2>
              <p className="text-white/60 mt-1 text-sm">4 modules · Timed · Scored like the real exam</p>
            </div>

            {/* Module breakdown */}
            <div className="space-y-2 mb-6">
              {([
                { label: 'Module 1', section: 'Reading & Writing', q: rwMod1.length, min: 32, color: 'from-blue-600/30 to-blue-500/20', border: 'border-blue-500/30' },
                { label: 'Module 2', section: 'Reading & Writing', q: rwMod2.length, min: 32, color: 'from-blue-600/20 to-blue-500/10', border: 'border-blue-500/20' },
                { label: 'Module 1', section: 'Math', q: mathMod1.length, min: 35, color: 'from-violet-600/30 to-violet-500/20', border: 'border-violet-500/30' },
                { label: 'Module 2', section: 'Math', q: mathMod2.length, min: 35, color: 'from-violet-600/20 to-violet-500/10', border: 'border-violet-500/20' },
              ]).map((m, i) => (
                <div key={i} className={cn('flex items-center justify-between rounded-xl border px-4 py-2.5 bg-gradient-to-r', m.color, m.border)}>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-white/50">{m.label}</span>
                    <span className="ml-2 text-sm text-white/80">{m.section}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{m.q} Q</span>
                    <span className="ml-2 text-xs text-white/50">{m.min} min</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6 text-sm">
              {([
                ['📱', 'Put your phone on silent — 2 hours 14 minutes total'],
                ['⏱', 'Each module has its own timer — manage time per module'],
                ['🔀', 'You can move between questions within a module'],
                ['🔖', 'Mark questions for review and return before submitting'],
                ['🚫', 'No feedback during the exam — results revealed at the end'],
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
                setPhase('rw1');
              }}
            >
              Begin Exam — Section 1, Module 1 →
            </button>
            <a href="/app/mock" className="block text-center mt-3 text-sm text-white/40 hover:text-white/60 transition-colors">
              ← Back to mock hub
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── MODULE BREAK (within R&W or Math section) ─────────────────────────────
  if (phase === 'rw-mod-break' || phase === 'math-mod-break') {
    const isRwBreak = phase === 'rw-mod-break';
    const mod1Qs = isRwBreak ? rwMod1 : mathMod1;
    const mod1Correct = mod1Qs.filter((q) => answers[q.id]?.selected === q.correct).length;
    return (
      <div className="mx-auto max-w-md text-center py-16 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-6xl mb-4">✅</div>
          <h2 className="font-display text-2xl font-bold">
            {isRwBreak ? 'Reading & Writing' : 'Math'} — Module 1 Complete
          </h2>
          <p className="text-muted mt-1 text-sm">
            {mod1Qs.length} questions answered · {mod1Correct} correct
          </p>
          <div className="mt-6 rounded-2xl bg-brand-500/10 border border-brand-500/20 p-4 text-sm text-muted">
            <p className="font-semibold text-foreground mb-1">Starting Module 2</p>
            <p>This module continues the same section. Your timer will reset to {isRwBreak ? '32' : '35'} minutes.</p>
          </div>
          <button
            className="mt-6 btn-primary px-8 py-3.5 text-base"
            onClick={() => {
              const now = Date.now();
              if (isRwBreak) {
                rw2StartedRef.current = now;
                setRwIdx(0);
                setPhase('rw2');
              } else {
                math2StartedRef.current = now;
                setMathIdx(0);
                setPhase('math2');
              }
              setPending(null);
            }}
          >
            Begin Module 2 <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── 10-MINUTE BREAK (between R&W and Math) ────────────────────────────────
  if (phase === 'break') {
    const rwCorrect = rwQs.filter((q) => answers[q.id]?.selected === q.correct).length;
    return (
      <div className="mx-auto max-w-md text-center py-16 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-6xl mb-4">☕</div>
          <h2 className="font-display text-2xl font-bold">Section Break</h2>
          <p className="text-muted mt-1 text-sm">Reading & Writing complete · {rwQs.length} questions · {rwCorrect} correct</p>
          {timer !== null && timer > 0 && (
            <p className="mt-4 text-sm text-muted">
              Break time: <span className="font-bold tabular-nums">{formatTime(timer)}</span> remaining
            </p>
          )}
          <div className="mt-4 rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 text-sm text-muted text-left space-y-1">
            <p className="font-semibold text-foreground">Up next: Math Section</p>
            <p>Module 1: 22 questions · 35 minutes</p>
            <p>Module 2: 22 questions · 35 minutes</p>
          </div>
          <button className="mt-6 btn-primary px-8 py-3.5 text-base" onClick={() => setPhase('math1')}>
            Begin Math Section <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── REVIEW ──────────────────────────────────────────────────────────────────
  if (phase === 'review') {
    return <MockReview rwQs={rwQs} mathQs={mathQs} answers={answers} expandedId={expandedId} setExpandedId={setExpandedId} />;
  }

  // ── ACTIVE TEST (rw1 | rw2 | math1 | math2) ───────────────────────────────
  const isRw = phase === 'rw1' || phase === 'rw2';
  const modNum = phase === 'rw1' || phase === 'math1' ? 1 : 2;
  const sectionLabel = isRw ? 'Reading & Writing' : 'Math';
  const modQs = phase === 'rw1' ? rwMod1 : phase === 'rw2' ? rwMod2 : phase === 'math1' ? mathMod1 : mathMod2;
  const curIdx = isRw ? rwIdx : mathIdx;
  const q = modQs[curIdx];

  // Guard: q may be undefined during a phase transition (useEffect fires after render),
  // or if the restored index is OOB due to a pool mismatch. Show a brief spinner
  // rather than a blank page — the useEffect will advance the phase within one tick.
  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted text-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <span>Loading question…</span>
      </div>
    );
  }

  const isTimeLow = timer !== null && timer <= 5 * 60;
  const isTimeCritical = timer !== null && timer <= 2 * 60;
  const isMarked = markedIds.has(q.id);
  const answeredInMod = modQs.filter((mq) => answers[mq.id]?.selected).length;

  return (
    <div className="mx-auto max-w-3xl">
      {saveError && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          <WifiOff size={15} className="shrink-0" />
          <span>Progress save failed — retrying. Don't close this tab.</span>
        </div>
      )}

      {/* ── Header bar (mirrors real Bluebook layout) ─────────────────────── */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            Section 1{isRw ? '' : ' · Math'} — {sectionLabel}
          </span>
          <span className="text-sm font-semibold">Module {modNum} <span className="text-muted font-normal">· Question {curIdx + 1} of {modQs.length}</span></span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mark for review */}
          <button
            onClick={() => setMarkedIds((s) => { const n = new Set(s); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })}
            className={cn('flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors',
              isMarked
                ? 'border-warning/40 bg-warning/10 text-warning'
                : 'border-[rgb(var(--border))] text-muted hover:border-warning/30 hover:text-warning'
            )}
            title="Mark for review"
          >
            {isMarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
            <span className="hidden sm:inline">{isMarked ? 'Marked' : 'Mark'}</span>
          </button>

          {/* Timer */}
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
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
            animate={{ width: `${((curIdx + 1) / modQs.length) * 100}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>

      {/* ── Question card ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
        >
          <Card>
            {/* No difficulty/topic pills during exam — just like real SAT */}
            {q.passage && (
              <div className="mb-5 rounded-2xl border-l-4 border-brand-400 bg-brand-500/5 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{q.passage}</div>
            )}
            <p className="text-base leading-relaxed mb-6 font-medium">{q.prompt}</p>
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

            {/* Navigation row */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                className="btn-ghost px-4 py-2.5 flex items-center gap-1.5 text-sm disabled:opacity-40"
                onClick={() => goTo(curIdx - 1)}
                disabled={curIdx === 0}
              >
                <ArrowLeft size={15} /> Back
              </button>
              <p className="text-xs text-muted text-center hidden sm:block">No feedback until results</p>
              <motion.button
                className="btn-primary px-7 py-2.5 flex items-center gap-1.5"
                onClick={advance}
                whileTap={{ scale: 0.96 }}
              >
                {curIdx + 1 >= modQs.length
                  ? (phase === 'rw1' ? 'Next Module →' : phase === 'rw2' ? 'End Section →' : phase === 'math1' ? 'Next Module →' : 'Finish Exam →')
                  : 'Next →'}
              </motion.button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* ── Question navigator (collapsible, shows answered/marked status) ─── */}
      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-brand-500/5 transition-colors"
          onClick={() => setNavOpen((o) => !o)}
        >
          <span>Question Navigator <span className="text-muted font-normal">({answeredInMod}/{modQs.length} answered{markedIds.size > 0 ? ` · ${markedIds.size} marked` : ''})</span></span>
          {navOpen ? <ChevronUp size={15} className="text-muted" /> : <ChevronDown size={15} className="text-muted" />}
        </button>
        <AnimatePresence>
          {navOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 grid grid-cols-9 sm:grid-cols-12 gap-1.5 pt-1">
                {modQs.map((mq, i) => {
                  const isAnswered = Boolean(answers[mq.id]?.selected);
                  const isActiveQ = i === curIdx;
                  const isMarkd = markedIds.has(mq.id);
                  return (
                    <button
                      key={mq.id}
                      onClick={() => goTo(i)}
                      className={cn(
                        'h-8 w-full rounded-lg text-xs font-bold border transition-all',
                        isActiveQ ? 'border-brand-500 bg-brand-500 text-white' :
                        isMarkd ? 'border-warning/60 bg-warning/15 text-warning' :
                        isAnswered ? 'border-success/40 bg-success/10 text-success' :
                        'border-[rgb(var(--border))] text-muted hover:border-brand-400'
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 px-4 pb-3 text-xs text-muted">
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-success/20 border border-success/40" /> Answered</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-warning/15 border border-warning/60" /> Marked</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded border border-[rgb(var(--border))]" /> Unanswered</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Shared review component ─────────────────────────────────────────────────
export function MockReview({
  rwQs, mathQs, answers, expandedId, setExpandedId,
}: {
  rwQs: Question[];
  mathQs: Question[];
  answers: Record<string, { selected: ChoiceId | null; timeSec: number }>;
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
          <h2 className="font-display text-3xl font-extrabold">Test Complete!</h2>
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

      {/* Per-module breakdown */}
      {([
        { label: 'Reading & Writing — Module 1', qs: rwQs.slice(0, 27) },
        { label: 'Reading & Writing — Module 2', qs: rwQs.slice(27) },
        { label: 'Math — Module 1', qs: mathQs.slice(0, 22) },
        { label: 'Math — Module 2', qs: mathQs.slice(22) },
      ] as const).map(({ label, qs }) => {
        if (!qs.length) return null;
        const sc = qs.filter((q) => answers[q.id]?.selected === q.correct).length;
        return (
          <div key={label}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-display font-bold text-lg">{label}</h3>
              <Pill tone={sc / qs.length >= 0.7 ? 'success' : sc / qs.length >= 0.5 ? 'warning' : 'danger'}>
                {sc}/{qs.length} correct
              </Pill>
            </div>
            <div className="space-y-2">
              {qs.map((q, i) => {
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
                              <div className="rounded-xl bg-brand-500/5 border-l-4 border-brand-400 p-3 text-sm leading-relaxed whitespace-pre-wrap">{q.passage}</div>
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
