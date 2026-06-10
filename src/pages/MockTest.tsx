import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import MockRunner from '@/components/MockRunner';
import { Card, SectionTitle, Pill } from '@/components/ui';
import { FileText, Clock, Target, Play, Rocket, BookOpen, Calculator } from 'lucide-react';
import { benchmarkBaseline } from '@/lib/evaluation';
import { selectMockQuestions } from '@/lib/adaptive';
import type { Question, MockSettings } from '@/lib/types';
import { createNovelTestSession, fetchRagQuestions } from '@/lib/ragClient';

const RW_COUNT = 54;
const MATH_COUNT = 44;
const TOTAL_MOCK = RW_COUNT + MATH_COUNT;
const DEFAULT_SETTINGS: MockSettings = { difficultyFilter: {}, globalDifficulty: ['easy', 'medium', 'hard'] };

export default function MockTest() {
  const { attempts, user, mockSettings } = useStore();
  const remoteEnabled = useStore((s) => s.remoteEnabled);
  const baseline = benchmarkBaseline(attempts);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState('');
  const [storedRag, setStoredRag] = useState<Question[]>([]);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (!remoteEnabled) return;
    fetchRagQuestions().then(setStoredRag).catch(() => {});
  }, [remoteEnabled]);

  const start = () => {
    setError('');
    const seenIds = new Set(attempts.map((a) => a.questionId));
    const settings = mockSettings ?? DEFAULT_SETTINGS;

    const ragRW = storedRag.filter((q) => q.section === 'Reading & Writing' && !seenIds.has(q.id));
    const ragMath = storedRag.filter((q) => q.section === 'Math' && !seenIds.has(q.id));
    const staticAll = selectMockQuestions(attempts, TOTAL_MOCK, settings, storedRag);
    const staticRW = staticAll.filter((q) => q.section === 'Reading & Writing' && !seenIds.has(q.id));
    const staticMath = staticAll.filter((q) => q.section === 'Math' && !seenIds.has(q.id));

    const merge = (rag: Question[], fallback: Question[], target: number): Question[] => {
      const used = new Set(rag.map((q) => q.id));
      return [...rag, ...fallback.filter((q) => !used.has(q.id))].sort(() => Math.random() - 0.5).slice(0, target);
    };

    const finalRW = merge(ragRW, staticRW, RW_COUNT);
    const finalMath = merge(ragMath, staticMath, MATH_COUNT);
    if (!finalRW.length && !finalMath.length) {
      setError('No questions available — check your question bank.');
      return;
    }
    setQuestions([...finalRW, ...finalMath]);

    if (remoteEnabled && user?.email && !generatingRef.current) {
      generatingRef.current = true;
      void createNovelTestSession({
        email: user.email, mode: 'mock', count: TOTAL_MOCK,
        attempts, fallbackQuestions: [...staticRW, ...staticMath],
      })
        .then((newQs) => setStoredRag((prev) => {
          const ex = new Set(prev.map((q) => q.id));
          return [...prev, ...newQs.filter((q) => !ex.has(q.id))];
        }))
        .catch(() => {})
        .finally(() => { generatingRef.current = false; });
    }
  };

  if (questions) return <MockRunner questions={questions} />;

  const rwPool = storedRag.filter((q) => q.section === 'Reading & Writing').length;
  const mathPool = storedRag.filter((q) => q.section === 'Math').length;

  return (
    <div className="space-y-6">
      <SectionTitle title="Daily Mock Test" subtitle="Full-length timed SAT simulation — as close to test day as it gets." />

      {baseline !== null && (
        <Pill tone="success">
          <Rocket size={12} /> Baseline {baseline} — today's mock will update your projected score.
        </Pill>
      )}

      <Card className="text-center py-10">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
          <FileText size={30} />
        </div>
        <h2 className="font-display text-2xl font-bold">Full-Length SAT Simulation</h2>
        <p className="mx-auto mt-2 max-w-md text-muted text-sm">
          RAG-grounded + LLM-generated novel questions adapted to your weak areas.
          Timed exactly like the digital SAT. Complete per-question analysis at the end.
        </p>
        <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoCard icon={<BookOpen size={17} />} label="Reading & Writing" value={String(RW_COUNT)} sub="64 min" />
          <InfoCard icon={<Calculator size={17} />} label="Math" value={String(MATH_COUNT)} sub="70 min" />
          <InfoCard icon={<Clock size={17} />} label="Total time" value="~134 min" sub="2 sections" />
          <InfoCard icon={<Target size={17} />} label="Score range" value="400–1600" sub="SAT scale" />
        </div>
        {remoteEnabled && (
          <div className="mx-auto mt-4 flex items-center justify-center gap-6 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${rwPool >= 10 ? 'bg-success' : 'bg-warning'}`} />
              R&W pool: {rwPool} ready
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${mathPool >= 10 ? 'bg-success' : 'bg-warning'}`} />
              Math pool: {mathPool} ready
            </span>
          </div>
        )}
        <button className="btn-primary mt-8 px-10 py-3.5 text-base" onClick={start}>
          <Play size={18} /> Begin Today's Mock Test
        </button>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <p className="mt-4 text-xs text-muted">Put your phone on silent · Find a quiet space · Treat it like test day</p>
      </Card>

      <Card>
        <SectionTitle title="How the mock works" subtitle="Not a quiz — a full SAT training session" />
        <div className="grid gap-4 sm:grid-cols-3 mt-2">
          {[
            { icon: '🎯', title: 'Adaptive questions', desc: 'Your weakest topics get more slots. Difficulty adjusts to your current mastery level.' },
            { icon: '📚', title: 'Novel every session', desc: 'Questions from your RAG library + freshly generated by GPT-4o and Claude — nothing repeats.' },
            { icon: '📊', title: 'Deep post-exam review', desc: 'Every question analyzed: correct answer, trap explanation, fast SAT strategy, time data.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-brand-500/5 border border-brand-500/15 p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold text-sm">{f.title}</div>
              <p className="text-xs text-muted mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function InfoCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border surface p-4">
      <div className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-600">{icon}</div>
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="text-[10px] text-muted/60 mt-0.5">{sub}</div>
    </div>
  );
}
