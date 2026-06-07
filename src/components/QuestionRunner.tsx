import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question, PracticeMode } from '@/lib/types';
import { useStore } from '@/lib/store';
import { computeTopicMastery } from '@/lib/adaptive';
import { explainQuestion } from '@/lib/tutor';
import { TOPIC_MAP } from '@/lib/topics';
import { Card, Pill, ProgressRing } from '@/components/ui';
import { cn, formatTime } from '@/lib/utils';
import {
  CheckCircle2, XCircle, Clock, Lightbulb, Zap, Brain,
  AlertTriangle, Timer, ArrowRight, Trophy,
} from 'lucide-react';
import { BADGES } from '@/lib/gamification';

interface Props {
  questions: Question[];
  mode: PracticeMode;
  title: string;
  timed?: boolean;
  onComplete?: (correct: number, total: number) => void;
}

export default function QuestionRunner({ questions, mode, title, timed, onComplete }: Props) {
  const { recordAttempt, finishSession, attempts } = useStore();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [revealed, setRevealed] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const q = questions[idx];

  useEffect(() => {
    setStartTime(Date.now());
    setElapsed(0);
  }, [idx]);

  useEffect(() => {
    if (!timed) return;
    const t = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 300);
    return () => clearInterval(t);
  }, [timed, startTime]);

  const mastery = useMemo(
    () => (q ? computeTopicMastery(q.topic, attempts) : undefined),
    [q, attempts]
  );

  if (!q) return null;

  const submit = () => {
    const timeSec = (Date.now() - startTime) / 1000;
    recordAttempt({ question: q, selected, timeSec, confidence, mode });
    setResults((r) => [...r, selected === q.correct]);
    setRevealed(true);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      const correct = results.filter(Boolean).length;
      const acc = Math.round((correct / questions.length) * 100);
      const badges = finishSession(mode, acc);
      setNewBadges(badges);
      setDone(true);
      onComplete?.(correct, questions.length);
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setRevealed(false);
    setConfidence('medium');
  };

  /* ─ Done screen ─ */
  if (done) {
    const correct = results.filter(Boolean).length;
    const acc = Math.round((correct / questions.length) * 100);
    const emoji = acc >= 80 ? '🎉' : acc >= 50 ? '💪' : '🌱';
    return (
      <motion.div
        className="mx-auto max-w-xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        <div className="card-glow p-8 text-center rounded-3xl">
          <motion.div
            className="text-6xl mb-3"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {emoji}
          </motion.div>
          <h2 className="font-display text-3xl font-extrabold">Session complete!</h2>
          <p className="text-muted mt-1">{title}</p>

          <div className="my-7 flex items-center justify-center gap-10">
            <ProgressRing value={acc} size={130} label={`${acc}%`} sublabel="accuracy" />
            <div className="text-left space-y-2">
              <div>
                <span className="font-display text-3xl font-extrabold">{correct}</span>
                <span className="text-muted"> / {questions.length}</span>
              </div>
              <div className="text-sm text-muted">correct answers</div>
              <Pill tone={acc >= 80 ? 'success' : acc >= 50 ? 'warning' : 'danger'}>
                {acc >= 80 ? 'Excellent' : acc >= 50 ? 'Good effort' : 'Keep going'}
              </Pill>
            </div>
          </div>

          {newBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-5 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20"
            >
              <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400 mb-2">🏅 New badges unlocked!</div>
              <div className="flex flex-wrap justify-center gap-2">
                {newBadges.map((b) => (
                  <Pill key={b} tone="warning">{BADGES[b]?.icon} {BADGES[b]?.name}</Pill>
                ))}
              </div>
            </motion.div>
          )}

          <a href="/app" className="btn-primary px-7 py-3 inline-flex">
            Back to dashboard <ArrowRight size={16} />
          </a>
        </div>
      </motion.div>
    );
  }

  const isCorrect = selected === q.correct;
  const tutor = revealed ? explainQuestion(q, selected, mastery) : null;

  /* ─ Question ─ */
  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress header */}
      <div className="mb-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span className="font-bold">{title}</span>
            <span>{idx + 1} / {questions.length}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
              animate={{ width: `${((idx + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {/* dot indicators */}
          <div className="flex gap-1 mt-1.5 justify-end">
            {questions.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i < idx ? (results[i] ? 'bg-success w-4' : 'bg-danger w-4') : i === idx ? 'bg-brand-400 w-4' : 'bg-slate-300 dark:bg-slate-700 w-1.5'
                )}
              />
            ))}
          </div>
        </div>
        {timed && (
          <motion.span
            className={cn(
              'chip tabular-nums shrink-0',
              elapsed > q.parTimeSec ? 'bg-danger/15 text-danger border border-danger/25' : 'bg-slate-500/10 text-muted border border-[rgb(var(--border))]'
            )}
            animate={elapsed > q.parTimeSec ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Timer size={13} /> {formatTime(elapsed)}
          </motion.span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card>
            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Pill tone="brand">{TOPIC_MAP[q.topic].name}</Pill>
              <Pill tone="muted">{q.subtopic}</Pill>
              <Pill tone={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>
                {q.difficulty}
              </Pill>
              <span className="ml-auto chip bg-slate-500/10 text-muted border border-[rgb(var(--border))]">
                <Clock size={12} /> ~{q.parTimeSec}s
              </span>
            </div>

            {/* Passage */}
            {q.passage && (
              <div className="mb-5 rounded-2xl border-l-4 border-brand-400 bg-brand-500/5 dark:bg-brand-500/8 p-4 text-sm leading-relaxed">
                {q.passage}
              </div>
            )}

            {/* Prompt */}
            <p className="text-lg font-medium leading-relaxed mb-6">{q.prompt}</p>

            {/* Choices */}
            <div className="space-y-2.5">
              {q.choices.map((c) => {
                const chosen = selected === c.id;
                const correctChoice = c.id === q.correct;
                let state: 'idle' | 'chosen' | 'correct' | 'wrong' = 'idle';
                if (revealed) {
                  if (correctChoice) state = 'correct';
                  else if (chosen) state = 'wrong';
                } else if (chosen) state = 'chosen';

                return (
                  <motion.button
                    key={c.id}
                    disabled={revealed}
                    onClick={() => setSelected(c.id)}
                    whileTap={!revealed ? { scale: 0.985 } : {}}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all duration-200',
                      state === 'idle' && 'border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-brand-400 hover:bg-brand-500/5 choice-idle',
                      state === 'chosen' && 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30 choice-chosen',
                      state === 'correct' && 'border-success bg-success/10 shadow-glow-success',
                      state === 'wrong' && 'border-danger bg-danger/10'
                    )}
                  >
                    <span className={cn(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-lg font-bold text-xs transition-colors',
                      state === 'correct' && 'bg-success text-white',
                      state === 'wrong' && 'bg-danger text-white',
                      (state === 'chosen') && 'bg-brand-500 text-white',
                      state === 'idle' && 'bg-slate-200 dark:bg-slate-700'
                    )}>
                      {c.id}
                    </span>
                    <span className="flex-1">{c.text}</span>
                    <AnimatePresence>
                      {revealed && correctChoice && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                          <CheckCircle2 size={18} className="text-success" />
                        </motion.span>
                      )}
                      {revealed && state === 'wrong' && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <XCircle size={18} className="text-danger" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {/* Confidence + submit */}
            {!revealed && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted text-xs">Confidence:</span>
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setConfidence(lvl)}
                      className={cn(
                        'chip capitalize transition-all',
                        confidence === lvl
                          ? 'bg-gradient-brand text-white border-transparent shadow-glow'
                          : 'bg-slate-500/10 text-muted border border-[rgb(var(--border))] hover:border-brand-400'
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <motion.button
                  className="btn-primary px-7 py-2.5"
                  onClick={submit}
                  disabled={selected === null}
                  whileTap={{ scale: 0.96 }}
                >
                  Submit answer
                </motion.button>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* AI Tutor explanation */}
      <AnimatePresence>
        {revealed && tutor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4"
          >
            <div className="card-glow rounded-3xl p-6">
              {/* Tutor header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                  <Brain size={20} />
                </div>
                <div>
                  <div className="font-display font-bold">AI SAT Tutor</div>
                  <div className="text-xs text-muted italic">{tutor.headline}</div>
                </div>
                <Pill tone={isCorrect ? 'success' : 'danger'} className="ml-auto">
                  {isCorrect ? '✓ Correct!' : "Let’s fix this"}
                </Pill>
              </div>

              <div className="space-y-3 text-sm">
                {!isCorrect && (
                  <TutorBlock icon={<XCircle size={15} className="text-danger" />} title="Why that answer missed" bg="bg-danger/5 border-danger/15">
                    {tutor.whySelectedWrong}
                  </TutorBlock>
                )}
                <TutorBlock icon={<CheckCircle2 size={15} className="text-success" />} title="Why the correct answer wins" bg="bg-success/5 border-success/15">
                  {tutor.whyCorrect}
                </TutorBlock>
                <TutorBlock icon={<Zap size={15} className="text-brand-400" />} title="Fastest SAT strategy" bg="bg-brand-500/5 border-brand-500/15">
                  {tutor.fastStrategy}
                </TutorBlock>
                <TutorBlock icon={<Lightbulb size={15} className="text-warning" />} title="Simpler way to see it" bg="bg-warning/5 border-warning/15">
                  {tutor.simplerView}
                </TutorBlock>
                <TutorBlock icon={<AlertTriangle size={15} className="text-orange-400" />} title="Trap to watch for" bg="bg-orange-500/5 border-orange-500/15">
                  {tutor.trapNote}
                </TutorBlock>
                <TutorBlock icon={<Timer size={15} className="text-accent-500" />} title="Time-saving trick" bg="bg-accent-500/5 border-accent-500/15">
                  {tutor.timeTrick}
                </TutorBlock>
                <div className="rounded-2xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 border border-brand-500/20 p-4 flex gap-3">
                  <Trophy size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Your improvement tip</div>
                    <p className="text-muted mt-0.5 leading-relaxed">{tutor.improvementTip}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <motion.button
                  className="btn-primary px-7 py-2.5"
                  onClick={next}
                  whileTap={{ scale: 0.96 }}
                >
                  {idx + 1 >= questions.length ? 'Finish session' : 'Next question'}
                  <ArrowRight size={15} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TutorBlock({ icon, title, children, bg }: { icon: React.ReactNode; title: string; children: React.ReactNode; bg: string }) {
  return (
    <div className={cn('rounded-xl border p-3.5 flex gap-3', bg)}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="font-semibold mb-0.5">{title}</div>
        <p className="text-muted leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
