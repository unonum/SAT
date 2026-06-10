import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { QUESTION_BANK } from '@/lib/questionBank';
import { createNovelTestSession, fetchRagQuestions } from '@/lib/ragClient';
import { selectAdaptiveQuestions } from '@/lib/adaptive';
import { TOPICS } from '@/lib/topics';
import QuestionRunner from '@/components/QuestionRunner';
import { Card, SectionTitle, Pill } from '@/components/ui';
import type { PracticeMode, Question, TopicId } from '@/lib/types';
import { Dumbbell, Timer, Zap, Layers, History, Rocket, ArrowRight, X, Sparkles } from 'lucide-react';

interface ModeDef {
  mode: PracticeMode;
  title: string;
  desc: string;
  icon: React.ReactNode;
  count: number;
  timed?: boolean;
  grad: string;
}

const MODES: ModeDef[] = [
  { mode: 'daily-adaptive', title: 'Daily Adaptive', desc: 'AI-picked mix weighted to your weakest topics.', icon: <Dumbbell size={22} />, count: 8, grad: 'from-brand-500 to-brand-600' },
  { mode: 'timed-drill', title: 'Timed Drill', desc: 'Beat the clock — builds speed and accuracy under pressure.', icon: <Timer size={22} />, count: 6, timed: true, grad: 'from-warning to-orange-500' },
  { mode: 'speed', title: 'Speed Challenge', desc: 'Fast-fire easy/medium questions against the clock.', icon: <Zap size={22} />, count: 8, timed: true, grad: 'from-accent-500 to-brand-500' },
  { mode: 'bootcamp', title: 'Target Score Bootcamp', desc: 'Harder questions designed to push toward your goal score.', icon: <Rocket size={22} />, count: 8, grad: 'from-violet-500 to-brand-500' },
  { mode: 'revision-7day', title: 'Last 7-Day Revision', desc: 'Revisit recent topics to cement your progress.', icon: <History size={22} />, count: 6, grad: 'from-success to-accent-500' },
];

function buildStaticQuestions(def: ModeDef, topics: TopicId[] | undefined, attempts: import('@/lib/types').Attempt[]): Question[] {
  const seenIds = new Set(attempts.map((a) => a.questionId));

  if (def.mode === 'speed') {
    return selectAdaptiveQuestions(attempts, def.count, {
      topics,
      difficultyFilter: Object.fromEntries(
        TOPICS.map((t) => [t.id, ['easy', 'medium'] as import('@/lib/types').Difficulty[]])
      ),
    });
  }
  if (def.mode === 'bootcamp') {
    return selectAdaptiveQuestions(attempts, def.count, {
      topics,
      difficultyFilter: Object.fromEntries(
        TOPICS.map((t) => [t.id, ['hard'] as import('@/lib/types').Difficulty[]])
      ),
    });
  }
  if (def.mode === 'revision-7day') {
    return selectAdaptiveQuestions(attempts, def.count, { topics, mode: 'weakness' });
  }
  if (def.mode === 'topic' && topics?.length) {
    const pool = QUESTION_BANK.filter((q) => topics.includes(q.topic) && !seenIds.has(q.id));
    return pool.length >= def.count
      ? pool.sort(() => Math.random() - 0.5).slice(0, def.count)
      : selectAdaptiveQuestions(attempts, def.count, { topics });
  }
  return selectAdaptiveQuestions(attempts, def.count, { topics });
}

export default function DailyPractice() {
  const { attempts, user } = useStore();
  const remoteEnabled = useStore((s) => s.remoteEnabled);
  const [active, setActive] = useState<{ questions: Question[]; def: ModeDef } | null>(null);
  const [topicMode, setTopicMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const start = async (def: ModeDef, topics?: TopicId[]) => {
    setError('');

    // 1. Build questions instantly from static adaptive bank
    const staticQs = buildStaticQuestions(def, topics, attempts);

    // 2. Try to mix in pre-generated RAG questions from DB (fast read, 2s timeout)
    let questions = staticQs;
    if (remoteEnabled) {
      try {
        const seenIds = new Set(attempts.map((a) => a.questionId));
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
        const ragFetch = fetchRagQuestions().then((qs) =>
          qs.filter(
            (q) =>
              !seenIds.has(q.id) &&
              (!topics?.length || topics.includes(q.topic as TopicId))
          )
        );
        const ragQs = await Promise.race([ragFetch, timeout]);
        if (ragQs && ragQs.length > 0) {
          // Blend: up to half from RAG, rest from static
          const ragCount = Math.min(ragQs.length, Math.ceil(def.count / 2));
          const staticNeeded = def.count - ragCount;
          const staticExtra = staticQs.filter((q) => !ragQs.some((r) => r.id === q.id));
          questions = [...ragQs.slice(0, ragCount), ...staticExtra.slice(0, staticNeeded)];
        }
      } catch {
        // stay with static
      }
    }

    // 3. Start the session immediately
    setActive({ questions: questions.length ? questions : staticQs, def });

    // 4. Background: generate novel RAG questions for next session (fire & forget)
    if (remoteEnabled && user?.email) {
      setGenerating(true);
      void createNovelTestSession({
        email: user.email, mode: def.mode, count: def.count * 2,
        topics, attempts, fallbackQuestions: staticQs,
      })
        .catch(() => {})
        .finally(() => setGenerating(false));
    }
  };

  if (active) {
    return <QuestionRunner questions={active.questions} mode={active.def.mode} title={active.def.title} timed={active.def.timed} />;
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Practice" subtitle="Adaptive questions picked for your weak spots — novel questions build in the background from your uploaded materials." />
      {error && <p className="text-sm text-danger">{error}</p>}
      {generating && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Sparkles size={13} className="animate-pulse text-brand-500" />
          Generating novel questions from your study materials for next session…
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m, i) => (
          <motion.button
            key={m.mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => void start(m)}
            className="card p-6 text-left hover:shadow-glow hover:-translate-y-1 hover:border-brand-400/40 transition-all duration-300 group"
          >
            <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${m.grad} text-white shadow-soft`}>
              {m.icon}
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-display font-bold text-base">{m.title}</h3>
              {m.timed && <Pill tone="warning">timed</Pill>}
            </div>
            <p className="text-sm text-muted leading-relaxed">{m.desc}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="chip bg-slate-500/10 text-muted border border-[rgb(var(--border))]">{m.count} questions</span>
              <span className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-300 group-hover:gap-2 transition-all">
                Start <ArrowRight size={14} />
              </span>
            </div>
          </motion.button>
        ))}

        {/* Topic mode card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: MODES.length * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => setTopicMode((v) => !v)}
          className="card p-6 text-left hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
        >
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-violet-500 text-white shadow-soft">
            <Layers size={22} />
          </div>
          <h3 className="font-display font-bold text-base mb-1.5">Topic Practice</h3>
          <p className="text-sm text-muted leading-relaxed">Choose a specific skill area to drill.</p>
          <div className="mt-4 text-sm font-bold text-brand-600 dark:text-brand-300">
            {topicMode ? 'Hide topics ↑' : 'Choose topic →'}
          </div>
        </motion.button>
      </div>

      {topicMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle title="Choose a topic" />
              <button onClick={() => setTopicMode(false)} className="btn-ghost h-8 w-8 p-0"><X size={16} /></button>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {TOPICS.map((t) => (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => void start({ mode: 'topic', title: `Topic: ${t.name}`, desc: '', icon: null, count: 99, grad: '' }, [t.id])}
                  className="rounded-2xl border border-[rgb(var(--border))] p-4 text-left hover:border-brand-400 hover:bg-brand-500/5 hover:shadow-glow transition-all"
                >
                  <div className="font-display font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-muted mt-0.5">{t.section}</div>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
