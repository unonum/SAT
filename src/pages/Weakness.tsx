import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { computeAllMastery } from '@/lib/adaptive';
import { TOPIC_MAP, TOPICS } from '@/lib/topics';
import { MISTAKE_LABELS } from '@/lib/tutor';
import QuestionRunner from '@/components/QuestionRunner';
import { Card, SectionTitle, Pill, MasteryBar, EmptyState } from '@/components/ui';
import { masteryColor, masteryLabel, formatTime } from '@/lib/utils';
import type { Difficulty, MistakeCategory, Question } from '@/lib/types';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Target, Clock, Wrench, Loader2 } from 'lucide-react';
import { createNovelTestSession } from '@/lib/ragClient';
import { QUESTION_BANK } from '@/lib/questionBank';

export default function Weakness() {
  const { attempts, user } = useStore();
  const mastery = useMemo(() => computeAllMastery(attempts), [attempts]);
  const [repair, setRepair] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (repair) {
    return <QuestionRunner questions={repair} mode="weakness-repair" title="Weakness Repair Mode" />;
  }

  if (attempts.length === 0) {
    return <EmptyState title="No data yet" hint="Complete some practice to unlock your weakness analysis." />;
  }

  const radarData = mastery.map((m) => ({ topic: TOPIC_MAP[m.topic].name.split(' ')[0], mastery: m.mastery }));

  // Difficulty performance
  const diffStats = (['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
    const da = attempts.filter((a) => a.difficulty === d);
    const acc = da.length ? Math.round((da.filter((a) => a.correct).length / da.length) * 100) : 0;
    return { difficulty: d, accuracy: acc, count: da.length };
  });

  // Mistake type counts
  const mistakeCounts: Record<string, number> = {};
  attempts.filter((a) => !a.correct && a.mistakeCategory).forEach((a) => {
    mistakeCounts[a.mistakeCategory!] = (mistakeCounts[a.mistakeCategory!] || 0) + 1;
  });
  const mistakeData = Object.entries(mistakeCounts)
    .map(([k, v]) => ({ label: MISTAKE_LABELS[k as MistakeCategory], count: v }))
    .sort((a, b) => b.count - a.count);

  const startRepair = async () => {
    setLoading(true);
    setError('');
    try {
      const topics = [...mastery].sort((a, b) => a.mastery - b.mastery).slice(0, 3).map((item) => item.topic);
      const questions = await createNovelTestSession({
        email: user?.email ?? '', mode: 'weakness-repair', count: 8, topics,
        attempts, fallbackQuestions: QUESTION_BANK,
      });
      setRepair(questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create repair questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-danger">{error}</p>}
      <SectionTitle
        title="Weakness Lab"
        subtitle="Exactly where you're losing points — and how to fix it."
        action={
          <button className="btn-primary px-4 py-2 text-sm" onClick={startRepair} disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Wrench size={15} />}
            {loading ? 'Building novel repair…' : 'Start repair mode'}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mastery radar */}
        <Card>
          <SectionTitle title="Mastery map" subtitle="All 8 skill areas at a glance" />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="rgba(148,163,184,0.25)" />
              <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10 }} />
              <Radar dataKey="mastery" stroke="#3563ff" fill="#3563ff" fillOpacity={0.35} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Difficulty performance */}
        <Card>
          <SectionTitle title="Performance by difficulty" subtitle="Accuracy across easy / medium / hard" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={diffStats} margin={{ left: -15, top: 10 }}>
              <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
              <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                {diffStats.map((d, i) => (
                  <Cell key={i} fill={masteryColor(d.accuracy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Topic heatmap table */}
      <Card>
        <SectionTitle title="Topic-by-topic breakdown" subtitle="Mastery, accuracy, and average time per question" />
        <div className="space-y-3">
          {[...mastery].sort((a, b) => a.mastery - b.mastery).map((m) => {
            const t = TOPIC_MAP[m.topic];
            return (
              <div key={m.topic} className="flex flex-wrap items-center gap-3 rounded-xl border surface p-3">
                <div className="min-w-[160px] flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{t.name}</span>
                    <Pill tone="muted">{t.section}</Pill>
                  </div>
                  <div className="mt-1.5"><MasteryBar value={m.mastery} /></div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-display font-bold" style={{ color: masteryColor(m.mastery) }}>{m.mastery}%</div>
                    <div className="text-[10px] text-muted">{masteryLabel(m.mastery)}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{m.attempts ? `${m.accuracy}%` : '—'}</div>
                    <div className="text-[10px] text-muted">accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold flex items-center gap-1"><Clock size={12} />{m.attempts ? formatTime(m.avgTimeSec) : '—'}</div>
                    <div className="text-[10px] text-muted">avg time</div>
                  </div>
                  <div className="text-center w-12">
                    <div className={`font-semibold ${m.trend > 0 ? 'text-success' : m.trend < 0 ? 'text-danger' : 'text-muted'}`}>
                      {m.trend > 0 ? '+' : ''}{m.trend}%
                    </div>
                    <div className="text-[10px] text-muted">trend</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Mistake patterns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Repeated mistake types" subtitle="What's costing you points most often" />
          {mistakeData.length ? (
            <ResponsiveContainer width="100%" height={Math.max(180, mistakeData.length * 44)}>
              <BarChart data={mistakeData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted">No mistakes logged yet — nice!</p>
          )}
        </Card>

        <Card>
          <SectionTitle title="Urgent attention" subtitle="Mastery below 50% = concept-repair mode" />
          <div className="space-y-2">
            {mastery.filter((m) => m.mastery < 50 && m.attempts > 0).length ? (
              mastery
                .filter((m) => m.mastery < 50 && m.attempts > 0)
                .map((m) => (
                  <div key={m.topic} className="flex items-center justify-between rounded-xl bg-danger/5 border border-danger/20 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Target size={16} className="text-danger" /> {TOPIC_MAP[m.topic].name}
                    </div>
                    <Pill tone="danger">{m.mastery}%</Pill>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted">Nothing critical — all topics above repair threshold. 🎉</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
