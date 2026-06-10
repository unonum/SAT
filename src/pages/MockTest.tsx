import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import QuestionRunner from '@/components/QuestionRunner';
import { Card, SectionTitle, Pill } from '@/components/ui';
import { FileText, Clock, Target, ListChecks, Play, Rocket } from 'lucide-react';
import { benchmarkBaseline } from '@/lib/evaluation';
import { selectMockQuestions } from '@/lib/adaptive';
import type { Question, MockSettings } from '@/lib/types';
import { createNovelTestSession, fetchRagQuestions } from '@/lib/ragClient';

const MOCK_COUNT = 16;

export default function MockTest() {
  const { attempts, user, mockSettings } = useStore();
  const remoteEnabled = useStore((s) => s.remoteEnabled);
  const baseline = benchmarkBaseline(attempts);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState('');

  // Pre-loaded RAG pool — fetched silently on mount
  const [storedRag, setStoredRag] = useState<Question[]>([]);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (!remoteEnabled) return;
    fetchRagQuestions().then(setStoredRag).catch(() => {});
  }, [remoteEnabled]);

  const start = () => {
    setError('');
    const seenIds = new Set(attempts.map((a) => a.questionId));

    // 1. Pick from pre-loaded RAG questions (already in memory — instant)
    const ragUnseen = storedRag.filter((q) => !seenIds.has(q.id));
    const DEFAULT_SETTINGS: MockSettings = { difficultyFilter: {}, globalDifficulty: ['easy', 'medium', 'hard'] };
    const fallback = selectMockQuestions(attempts, MOCK_COUNT, mockSettings ?? DEFAULT_SETTINGS);

    let qs: Question[];
    if (ragUnseen.length >= MOCK_COUNT) {
      qs = ragUnseen.sort(() => Math.random() - 0.5).slice(0, MOCK_COUNT);
    } else if (ragUnseen.length > 0) {
      const fill = fallback.filter((q) => !seenIds.has(q.id) && !ragUnseen.some((r) => r.id === q.id));
      qs = [...ragUnseen, ...fill].slice(0, MOCK_COUNT);
    } else {
      qs = fallback;
    }

    setQuestions(qs);

    // 2. Background: generate fresh questions for next mock (fire & forget)
    if (remoteEnabled && user?.email && !generatingRef.current) {
      generatingRef.current = true;
      void createNovelTestSession({
        email: user.email,
        mode: 'mock',
        count: MOCK_COUNT * 2,
        attempts,
        fallbackQuestions: fallback,
      })
        .then((newQs) =>
          setStoredRag((prev) => {
            const existing = new Set(prev.map((q) => q.id));
            return [...prev, ...newQs.filter((q) => !existing.has(q.id))];
          })
        )
        .catch(() => {})
        .finally(() => { generatingRef.current = false; });
    }
  };

  if (questions) {
    return <QuestionRunner questions={questions} mode="mock" title="Full SAT Mock Test" timed returnTo="/app/mock" />;
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Mock Test" subtitle="A full-length, timed simulation under test conditions." />

      {baseline !== null && (
        <Pill tone="success">
          <Rocket size={12} /> Building on your benchmark baseline of {baseline} — improvements are tracked against it.
        </Pill>
      )}

      <Card className="text-center py-10">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
          <FileText size={30} />
        </div>
        <h2 className="font-display text-2xl font-bold">Full-Length SAT Simulation</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Adaptive, timed, and scored like the real thing. Your result updates your projected score and
          recalibrates your study plan.
        </p>

        <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-4">
          <Info icon={<ListChecks size={18} />} label="Questions" value={String(MOCK_COUNT)} />
          <Info icon={<Clock size={18} />} label="Timed" value="Yes" />
          <Info icon={<Target size={18} />} label="Sections" value="Math + RW" />
        </div>

        <button className="btn-primary mt-8 px-8 py-3.5 text-base" onClick={start}>
          <Play size={18} /> Begin mock test
        </button>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </Card>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border surface p-4">
      <div className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-600">{icon}</div>
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
