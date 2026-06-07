import { useState, useEffect, useMemo } from 'react';
import type { Question, PracticeMode } from '@/lib/types';
import { useStore } from '@/lib/store';
import { computeTopicMastery } from '@/lib/adaptive';
import { explainQuestion } from '@/lib/tutor';
import { TOPIC_MAP } from '@/lib/topics';
import { Card, Pill, ProgressRing } from '@/components/ui';
import { cn, formatTime } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  Zap,
  Brain,
  AlertTriangle,
  Timer,
  ArrowRight,
  Trophy,
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
    const t = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

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

  if (done) {
    const correct = results.filter(Boolean).length;
    const acc = Math.round((correct / questions.length) * 100);
    return (
      <div className="mx-auto max-w-xl animate-pop">
        <Card className="text-center py-8">
          <div className="text-5xl mb-2">{acc >= 80 ? '🎉' : acc >= 50 ? '💪' : '🌱'}</div>
          <h2 className="font-display text-2xl font-bold">Session complete!</h2>
          <p className="text-muted mt-1">{title}</p>
          <div className="my-6 flex items-center justify-center gap-8">
            <ProgressRing value={acc} size={120} label={`${acc}%`} sublabel="accuracy" />
            <div className="text-left space-y-2">
              <div className="text-sm">
                <span className="font-display text-2xl font-bold">{correct}</span>
                <span className="text-muted"> / {questions.length} correct</span>
              </div>
              <div className="text-sm text-muted">Mode: {mode.replace(/-/g, ' ')}</div>
            </div>
          </div>
          {newBadges.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold mb-2">🏅 New badges unlocked!</div>
              <div className="flex flex-wrap justify-center gap-2">
                {newBadges.map((b) => (
                  <Pill key={b} tone="warning">
                    {BADGES[b]?.icon} {BADGES[b]?.name}
                  </Pill>
                ))}
              </div>
            </div>
          )}
          <a href="#/app" className="btn-primary px-6 py-2.5">
            Back to dashboard <ArrowRight size={16} />
          </a>
        </Card>
      </div>
    );
  }

  const isCorrect = selected === q.correct;
  const tutor = revealed ? explainQuestion(q, selected, mastery) : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span className="font-semibold">{title}</span>
            <span>
              Question {idx + 1} / {questions.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
              style={{ width: `${((idx + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        {timed && (
          <span
            className={cn(
              'chip tabular-nums',
              elapsed > q.parTimeSec ? 'bg-danger/10 text-danger' : 'bg-slate-500/10 text-muted'
            )}
          >
            <Timer size={14} /> {formatTime(elapsed)}
          </span>
        )}
      </div>

      <Card className="animate-fade-up">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Pill tone="brand">{TOPIC_MAP[q.topic].name}</Pill>
          <Pill tone="muted">{q.subtopic}</Pill>
          <Pill
            tone={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}
          >
            {q.difficulty}
          </Pill>
          <span className="ml-auto chip bg-slate-500/10 text-muted">
            <Clock size={13} /> ~{q.parTimeSec}s
          </span>
        </div>

        {q.passage && (
          <div className="mb-4 rounded-xl border-l-4 border-brand-400 bg-slate-50 dark:bg-slate-800/50 p-4 text-sm leading-relaxed">
            {q.passage}
          </div>
        )}

        <p className="text-lg font-medium leading-relaxed mb-5">{q.prompt}</p>

        <div className="space-y-2.5">
          {q.choices.map((c) => {
            const chosen = selected === c.id;
            const correctChoice = c.id === q.correct;
            let state = 'idle';
            if (revealed) {
              if (correctChoice) state = 'correct';
              else if (chosen) state = 'wrong';
            } else if (chosen) state = 'chosen';

            return (
              <button
                key={c.id}
                disabled={revealed}
                onClick={() => setSelected(c.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all',
                  state === 'idle' && 'surface hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/5',
                  state === 'chosen' && 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-500',
                  state === 'correct' && 'border-success bg-success/10',
                  state === 'wrong' && 'border-danger bg-danger/10'
                )}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-lg font-bold text-xs',
                    state === 'correct' && 'bg-success text-white',
                    state === 'wrong' && 'bg-danger text-white',
                    (state === 'chosen' || state === 'idle') && 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  {c.id}
                </span>
                <span className="flex-1">{c.text}</span>
                {revealed && correctChoice && <CheckCircle2 size={18} className="text-success" />}
                {revealed && state === 'wrong' && <XCircle size={18} className="text-danger" />}
              </button>
            );
          })}
        </div>

        {!revealed && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Confidence:</span>
              {(['low', 'medium', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setConfidence(lvl)}
                  className={cn(
                    'chip capitalize',
                    confidence === lvl ? 'bg-brand-600 text-white' : 'bg-slate-500/10 text-muted'
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <button className="btn-primary px-6 py-2.5" onClick={submit} disabled={selected === null}>
              Submit
            </button>
          </div>
        )}
      </Card>

      {/* AI Tutor explanation */}
      {revealed && tutor && (
        <Card className="mt-4 animate-fade-up border-brand-200 dark:border-brand-900">
          <div className="flex items-center gap-2 mb-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <Brain size={18} />
            </div>
            <div>
              <div className="font-display font-bold">AI SAT Tutor</div>
              <div className="text-xs text-muted">{tutor.headline}</div>
            </div>
            <Pill tone={isCorrect ? 'success' : 'danger'} className="ml-auto">
              {isCorrect ? 'Correct' : 'Let’s review'}
            </Pill>
          </div>

          <div className="space-y-3 text-sm">
            {!isCorrect && (
              <TutorBlock icon={<XCircle size={16} className="text-danger" />} title="Why your answer missed">
                {tutor.whySelectedWrong}
              </TutorBlock>
            )}
            <TutorBlock icon={<CheckCircle2 size={16} className="text-success" />} title="Why the answer is right">
              {tutor.whyCorrect}
            </TutorBlock>
            <TutorBlock icon={<Zap size={16} className="text-brand-500" />} title="Fastest SAT strategy">
              {tutor.fastStrategy}
            </TutorBlock>
            <TutorBlock icon={<Lightbulb size={16} className="text-warning" />} title="A simpler way to see it">
              {tutor.simplerView}
            </TutorBlock>
            <TutorBlock icon={<AlertTriangle size={16} className="text-orange-500" />} title="Trap to avoid">
              {tutor.trapNote}
            </TutorBlock>
            <TutorBlock icon={<Clock size={16} className="text-accent-600" />} title="Time-saving trick">
              {tutor.timeTrick}
            </TutorBlock>
            <div className="rounded-xl bg-gradient-to-r from-brand-500/10 to-accent-500/10 p-3.5 flex gap-2.5">
              <Trophy size={18} className="text-brand-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Your improvement tip</div>
                <p className="text-muted mt-0.5">{tutor.improvementTip}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button className="btn-primary px-6 py-2.5" onClick={next}>
              {idx + 1 >= questions.length ? 'Finish session' : 'Next question'} <ArrowRight size={16} />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

function TutorBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="font-semibold">{title}</div>
        <p className="text-muted mt-0.5 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
