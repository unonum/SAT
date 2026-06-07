import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { selectMockQuestions } from '@/lib/adaptive';
import QuestionRunner from '@/components/QuestionRunner';
import { Card, SectionTitle, Pill } from '@/components/ui';
import { FileText, Clock, Target, ListChecks, Play, Rocket } from 'lucide-react';
import { benchmarkBaseline } from '@/lib/evaluation';
import type { Question } from '@/lib/types';
import { fetchRagQuestions } from '@/lib/ragClient';

export default function MockTest() {
  const { attempts, mockSettings } = useStore();
  const baseline = benchmarkBaseline(attempts);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [ragPool, setRagPool] = useState<Question[]>([]);

  useEffect(() => {
    fetchRagQuestions()
      .then(setRagPool)
      .catch(() => setRagPool([]));
  }, []);

  const start = () => {
    const qs = selectMockQuestions(attempts, 16, mockSettings, ragPool);
    setQuestions(qs);
  };

  if (questions) {
    return <QuestionRunner questions={questions} mode="mock" title="Full SAT Mock Test" timed />;
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
          <Info icon={<ListChecks size={18} />} label="Questions" value="16" />
          <Info icon={<Clock size={18} />} label="Timed" value="Yes" />
          <Info icon={<Target size={18} />} label="Sections" value="Math + RW" />
        </div>

        <button className="btn-primary mt-8 px-8 py-3.5 text-base" onClick={start}>
          <Play size={18} /> Begin mock test
        </button>
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
