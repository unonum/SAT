import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Card, Pill } from '@/components/ui';
import { cn, formatTime } from '@/lib/utils';
import { TOPIC_MAP } from '@/lib/topics';
import { Timer, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

// Digital SAT section time limits (seconds)
const RW_SECS = 64 * 60;   // 64 min total for Reading & Writing
const MATH_SECS = 70 * 60; // 70 min total for Math
const BREAK_SECS = 5 * 60; // 5-min optional break

type Phase = 'intro' | 'rw' | 'break' | 'math' | 'review';
type ChoiceId = 'A' | 'B' | 'C' | 'D';
interface AnswerRecord { selected: ChoiceId | null; timeSec: number; }

function estimateSection(correct: number, total: number): number {
  if (!total) return 200;
  return Math.round(200 + (correct / total) * 600);
}

interface Props { questions: Question[] }

export default function MockRunner({ questions }: Props) {
  const { recordAttempt, finishSession } = useStore();

  const rwQs = questions.filter((q) => q.section === 'Reading & Writing');
  const mathQs = questions.filter((q) => q.section === 'Math');

  const [phase, setPhase] = useState<Phase>('intro');
  const [rwIdx, setRwIdx] = useState(0);
  const [mathIdx, setMathIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [pending, setPending] = useState<ChoiceId | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [qStart, setQStart] = useState(Date.now());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Initialize section timer when phase changes
  useEffect(() => {
    if (phase === 'rw') { setTimer(RW_SECS); setQStart(Date.now()); }
    else if (phase === 'math') { setTimer(MATH_SECS); setQStart(Date.now()); }
    else if (phase === 'break') setTimer(BREAK_SECS);
    else setTimer(null);
  }, [phase]);

  // Tick timer down 1s at a time
  useEffect(() => {
    if (timer === null || timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // Handle timer expiry
  useEffect(() => {
    if (timer !== 0) return;
    if (phase === 'rw') {
      rwQs.forEach((q) => {
        if (!answers[q.id])
          recordAttempt({ question: q, selected: null, timeSec: 60, confidence: 'medium', mode: 'mock' });
      });
      setPhase('break');
    } else if (phase === 'break') {
      setPhase('math');
    } else if (phase === 'math') {
      mathQs.forEach((q) => {
        if (!answers[q.id])
          recordAttempt({ question: q, selected: null, timeSec: 60, confidence: 'medium', mode: 'mock' });
      });
      finishSession('mock', 0);
      setPhase('review');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  const recordAnswer = useCallback(
    (q: Question, selected: ChoiceId | null) => {
      const timeSec = (Date.now() - qStart) / 1000;
      setAnswers((prev) => ({ ...prev, [q.id]: { selected, timeSec } }));
      recordAttempt({ question: q, selected, timeSec, confidence: 'medium', mode: 'mock' });
      setQStart(Date.now());
    },
    [qStart, recordAttempt]
  );

  const advance = useCallback(() => {
    const q = phase === 'rw' ? rwQs[rwIdx] : phase === 'math' ? mathQs[mathIdx] : null;
    if (!q) return;
    recordAnswer(q, pending);
    setPending(null);
    if (phase === 'rw') {
      if (rwIdx + 1 >= rwQs.length) setPhase('break');
      else setRwIdx((i) => i + 1);
    } else if (phase === 'math') {
      if (mathIdx + 1 >= mathQs.length) { finishSession('mock', 0); setPhase('review'); }
      else setMathIdx((i) => i + 1);
    }
  }, [phase, rwIdx, mathIdx, rwQs, mathQs, pending, recordAnswer, finishSession]);

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
                ['🎯', 'Treat every question as if it counts on test day'],
              ] as [string, string][]).map(([icon, text]) => (
                <div key={text} className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-2.5">
                  <span>{icon}</span><span className="text-white/80">{text}</span>
                </div>
              ))}
            </div>
            <button
              className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-accent-500 py-4 font-bold text-white text-base shadow-glow hover:opacity-90 transition-opacity"
              onClick={() => setPhase('rw')}
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
          <p className="text-muted mt-1 text-sm">{rwQs.length} questions answered</p>
          <div className="mt-5 inline-block rounded-2xl bg-brand-500/10 border border-brand-500/20 px-8 py-5">
            <div className="font-display text-3xl font-extrabold text-brand-600">{rwCorrect} / {rwQs.length}</div>
            <div className="text-xs text-muted mt-1">correct (revealed at end)</div>
          </div>
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
    const rwCorrect = rwQs.filter((q) => answers[q.id]?.selected === q.correct).length;
    const mathCorrect = mathQs.filter((q) => answers[q.id]?.selected === q.correct).length;
    const rwScore = estimateSection(rwCorrect, rwQs.length);
    const mathScore = estimateSection(mathCorrect, mathQs.length);
    const total = rwScore + mathScore;
    const totalQ = rwQs.length + mathQs.length;
    const totalCorrect = rwCorrect + mathCorrect;

    return (
      <div className="space-y-6 mx-auto max-w-3xl pb-12">
        {/* Score header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 p-8 text-white text-center shadow-glow-lg">
            <div className="text-5xl mb-3">🎓</div>
            <h2 className="font-display text-3xl font-extrabold">Mock Test Complete!</h2>
            <p className="text-white/60 text-sm mt-1">{totalCorrect} of {totalQ} questions correct</p>
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

        {/* Per-question review by section */}
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
                      transition={{ delay: i * 0.015 }}
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
        </div>
      </div>
    );
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
      {/* Header: section label, progress, timer */}
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

      {/* Dot navigator */}
      <div className="flex flex-wrap gap-1 mt-3 justify-center">
        {sectionQs.map((sq, i) => (
          <div key={sq.id} className={cn('h-1.5 rounded-full transition-all',
            i < idx ? 'bg-brand-400 w-3' :
            i === idx ? 'bg-brand-500 w-4' :
            'bg-slate-300 dark:bg-slate-700 w-1.5'
          )} />
        ))}
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
