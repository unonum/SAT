import { useState } from 'react';
import { useStore } from '@/lib/store';
import { selectAdaptiveQuestions } from '@/lib/adaptive';
import { questionsByTopic } from '@/lib/questionBank';
import { TOPICS } from '@/lib/topics';
import QuestionRunner from '@/components/QuestionRunner';
import { Card, SectionTitle, Pill } from '@/components/ui';
import type { PracticeMode, Question, TopicId } from '@/lib/types';
import { Dumbbell, Timer, Zap, Layers, History, Rocket, ArrowRight } from 'lucide-react';

interface ModeDef {
  mode: PracticeMode;
  title: string;
  desc: string;
  icon: React.ReactNode;
  count: number;
  timed?: boolean;
}

const MODES: ModeDef[] = [
  { mode: 'daily-adaptive', title: 'Daily Adaptive', desc: 'AI-picked mix weighted to your weak spots.', icon: <Dumbbell size={20} />, count: 8 },
  { mode: 'timed-drill', title: 'Timed Drill', desc: 'Beat the clock — builds speed and accuracy.', icon: <Timer size={20} />, count: 6, timed: true },
  { mode: 'speed', title: 'Speed Challenge', desc: 'Fast-fire easy/medium questions against time.', icon: <Zap size={20} />, count: 8, timed: true },
  { mode: 'bootcamp', title: 'Target Score Bootcamp', desc: 'Harder questions to push toward your goal.', icon: <Rocket size={20} />, count: 8 },
  { mode: 'revision-7day', title: 'Last 7-Day Revision', desc: 'Revisit recent topics to lock them in.', icon: <History size={20} />, count: 6 },
];

export default function DailyPractice() {
  const { attempts } = useStore();
  const [active, setActive] = useState<{ questions: Question[]; def: ModeDef } | null>(null);
  const [topicMode, setTopicMode] = useState(false);

  const start = (def: ModeDef, topics?: TopicId[]) => {
    let questions: Question[];
    if (topics) {
      questions = topics.flatMap((t) => questionsByTopic(t)).slice(0, def.count);
    } else if (def.mode === 'bootcamp') {
      questions = selectAdaptiveQuestions(attempts, def.count, { mode: 'weakness' });
    } else {
      questions = selectAdaptiveQuestions(attempts, def.count, { mode: 'balanced' });
    }
    setActive({ questions, def });
  };

  if (active) {
    return (
      <QuestionRunner
        questions={active.questions}
        mode={active.def.mode}
        title={active.def.title}
        timed={active.def.timed}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Practice" subtitle="Pick a mode — every question is chosen by your adaptive engine." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.mode}
            onClick={() => start(m)}
            className="card p-5 text-left hover:shadow-glow hover:border-brand-400 transition-all group"
          >
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              {m.icon}
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold">{m.title}</h3>
              {m.timed && <Pill tone="warning">timed</Pill>}
            </div>
            <p className="mt-1 text-sm text-muted">{m.desc}</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted">{m.count} questions</span>
              <span className="flex items-center gap-1 font-semibold text-brand-600 group-hover:gap-2 transition-all">
                Start <ArrowRight size={15} />
              </span>
            </div>
          </button>
        ))}

        <button
          onClick={() => setTopicMode((v) => !v)}
          className="card p-5 text-left hover:shadow-glow hover:border-brand-400 transition-all"
        >
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent-500/10 text-accent-600">
            <Layers size={20} />
          </div>
          <h3 className="font-display font-bold">Topic Practice</h3>
          <p className="mt-1 text-sm text-muted">Drill a specific skill area you choose.</p>
          <div className="mt-3 text-sm font-semibold text-brand-600">Choose topic →</div>
        </button>
      </div>

      {topicMode && (
        <Card>
          <SectionTitle title="Choose a topic" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  start({ mode: 'topic', title: `Topic: ${t.name}`, desc: '', icon: null, count: 99 }, [t.id])
                }
                className="rounded-xl border surface p-3 text-left text-sm hover:border-brand-400 transition-colors"
              >
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted mt-0.5">{t.section}</div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
