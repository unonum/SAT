import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { STUDENT_EMAILS, displayName } from '@/lib/auth';
import { computeAllMastery, estimateScore } from '@/lib/adaptive';
import { generateWeeklyReport, MISTAKE_LABELS } from '@/lib/tutor';
import { TOPIC_MAP, TOPICS } from '@/lib/topics';
import { Card, SectionTitle, Pill, Stat, MasteryBar, ProgressRing, EmptyState } from '@/components/ui';
import { masteryColor, relativeDate, formatTime } from '@/lib/utils';
import type { UserData, MistakeCategory, TopicId } from '@/lib/types';
import {
  Users, Target, TrendingUp, AlertTriangle, Crown, Flame, Clock,
  CheckCircle2, ChevronDown, Trophy, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';

interface StudentView {
  email: string;
  name: string;
  data: UserData;
  score: ReturnType<typeof estimateScore>;
  mastery: ReturnType<typeof computeAllMastery>;
  accuracy: number;
  totalMin: number;
  weakest: { topic: TopicId; mastery: number }[];
  report: ReturnType<typeof generateWeeklyReport>;
  lastActive: number | null;
}

export default function TeamDashboard() {
  const profiles = useStore((s) => s.profiles);
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  const students: StudentView[] = useMemo(() => {
    return STUDENT_EMAILS.filter((e) => profiles[e]).map((email) => {
      const data = profiles[email];
      const attempts = data.attempts;
      const mastery = computeAllMastery(attempts);
      const score = estimateScore(attempts);
      const accuracy = attempts.length
        ? Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100)
        : 0;
      const totalMin = Math.round(attempts.reduce((s, a) => s + a.timeSec, 0) / 60);
      const weakest = [...mastery]
        .filter((m) => m.attempts > 0)
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, 3)
        .map((m) => ({ topic: m.topic, mastery: m.mastery }));
      const lastWeek = data.daily.length > 6 ? data.daily[data.daily.length - 7].scoreEstimate : score.total - 30;
      const report = generateWeeklyReport(attempts, mastery, score.total, lastWeek);
      const lastActive = attempts.length ? attempts[attempts.length - 1].ts : null;
      return { email, name: displayName(email), data, score, mastery, accuracy, totalMin, weakest, report, lastActive };
    });
  }, [profiles]);

  if (students.length === 0) {
    return <EmptyState title="No students yet" hint="Student profiles will appear here once they exist." />;
  }

  const anySample = students.some((s) => s.data.seeded);

  // Cross-student comparison per topic (where each lags)
  const compareData = TOPICS.map((t) => {
    const row: Record<string, number | string> = { topic: t.name.split(' ')[0] };
    students.forEach((s) => {
      row[s.name] = s.mastery.find((m) => m.topic === t.id)?.mastery ?? 0;
    });
    return row;
  });
  const barColors = ['#3563ff', '#a855f7'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-brand-500 text-white shadow-glow-violet">
          <Crown size={22} />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-xl font-extrabold">Master Dashboard</h1>
          <p className="text-sm text-muted">Admin view · monitoring {students.length} students</p>
        </div>
        {anySample && (
          <Pill tone="warning"><AlertTriangle size={12} /> Sample data shown for students with no synced activity</Pill>
        )}
      </div>

      {/* Student summary cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        {students.map((s, i) => (
          <motion.div
            key={s.email}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="h-full">
              {/* Top row */}
              <div className="flex items-center gap-4 mb-5">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-white font-display font-extrabold text-lg shadow-soft">
                  {s.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg">{s.name}</h3>
                    {s.data.seeded ? <Pill tone="muted">Sample</Pill> : <Pill tone="success">Live</Pill>}
                  </div>
                  <div className="text-xs text-muted truncate">{s.email}</div>
                </div>
                <ProgressRing
                  value={Math.min(100, Math.round(((s.score.total - 400) / ((s.data.user?.targetScore ?? 1450) - 400)) * 100))}
                  size={64}
                  stroke={6}
                  label={<span className="text-sm">{s.score.total}</span>}
                  color="#3563ff"
                />
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-2 mb-5 text-center">
                <Mini label="Target gap" value={`${Math.max(0, (s.data.user?.targetScore ?? 1450) - s.score.total)}`} tone="text-warning" />
                <Mini label="Accuracy" value={`${s.accuracy}%`} tone="text-success" />
                <Mini label="Questions" value={String(s.data.attempts.length)} tone="" />
                <Mini label="Streak" value={`${s.data.gamification.streak}🔥`} tone="text-orange-500" />
              </div>

              {/* Where they lag */}
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Where they lag most</div>
              <div className="space-y-2.5 mb-4">
                {s.weakest.map((w) => (
                  <div key={w.topic}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{TOPIC_MAP[w.topic].name}</span>
                      <span className="font-semibold" style={{ color: masteryColor(w.mastery) }}>{w.mastery}%</span>
                    </div>
                    <MasteryBar value={w.mastery} height={6} />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1.5"><AlertTriangle size={12} /> Top issue: {s.report.topMistake}</span>
                <span className="flex items-center gap-1.5"><Activity size={12} /> {s.lastActive ? relativeDate(s.lastActive) : 'never'}</span>
              </div>

              <button
                onClick={() => setOpenEmail(openEmail === s.email ? null : s.email)}
                className="btn-ghost w-full mt-4 py-2 text-sm"
              >
                {openEmail === s.email ? 'Hide details' : 'View full breakdown'}
                <ChevronDown size={15} className={openEmail === s.email ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>

              {openEmail === s.email && <StudentDetail s={s} />}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Comparison chart */}
      <Card>
        <SectionTitle title="Mastery comparison" subtitle="Side-by-side skill mastery — spot exactly who needs help where" />
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={compareData} margin={{ left: -10, top: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
            <XAxis dataKey="topic" tick={{ fontSize: 11 }} stroke="#94a3b8" interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
            {students.map((s, i) => (
              <Bar key={s.email} dataKey={s.name} radius={[6, 6, 0, 0]} fill={barColors[i % barColors.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-5 mt-2 text-sm">
          {students.map((s, i) => (
            <span key={s.email} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ background: barColors[i % barColors.length] }} /> {s.name}
            </span>
          ))}
        </div>
      </Card>

      {/* Class-wide insights */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Stat label="Combined questions" value={students.reduce((a, s) => a + s.data.attempts.length, 0)} icon={<CheckCircle2 size={20} />} accent="brand" />
        <Stat label="Avg estimated score" value={Math.round(students.reduce((a, s) => a + s.score.total, 0) / students.length)} icon={<Target size={20} />} accent="accent" />
        <Stat label="Shared weak area" value={<span className="text-base">{sharedWeakness(students)}</span>} icon={<AlertTriangle size={20} />} accent="warning" />
      </div>
    </div>
  );
}

function StudentDetail({ s }: { s: StudentView }) {
  const mistakeCounts: Record<string, number> = {};
  s.data.attempts.filter((a) => !a.correct && a.mistakeCategory).forEach((a) => {
    mistakeCounts[a.mistakeCategory!] = (mistakeCounts[a.mistakeCategory!] || 0) + 1;
  });
  const mistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-4 border-t border-[rgb(var(--border))] pt-4 space-y-4"
    >
      {/* Full mastery */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-muted mb-2">All skill areas</div>
        <div className="space-y-2">
          {[...s.mastery].sort((a, b) => a.mastery - b.mastery).map((m) => (
            <div key={m.topic} className="flex items-center gap-3">
              <span className="text-sm w-40 shrink-0">{TOPIC_MAP[m.topic].name}</span>
              <div className="flex-1"><MasteryBar value={m.mastery} height={6} /></div>
              <span className="text-xs font-semibold w-10 text-right" style={{ color: masteryColor(m.mastery) }}>{m.mastery}%</span>
              <span className="text-xs text-muted w-12 text-right flex items-center justify-end gap-1"><Clock size={10} />{m.attempts ? formatTime(m.avgTimeSec) : '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mistake breakdown + report */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Mistake patterns</div>
          {mistakes.length ? (
            <div className="space-y-1.5">
              {mistakes.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span>{MISTAKE_LABELS[k as MistakeCategory]}</span>
                  <Pill tone="danger">{v}</Pill>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted">No mistakes logged.</p>}
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-muted mb-2">AI recommendation</div>
          <div className="rounded-xl bg-brand-500/5 border border-brand-500/15 p-3 text-sm space-y-1.5">
            <div className="flex items-center gap-1.5"><TrendingUp size={14} className="text-success" /> Focus next: <b>{s.report.focusNextWeek}</b></div>
            <div className="flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500" /> Strongest: <b>{s.report.strongest[0] ?? '—'}</b></div>
            <p className="text-muted text-xs pt-1">{s.report.parentAction}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] py-2">
      <div className={`font-display font-bold ${tone}`}>{value}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}

function sharedWeakness(students: StudentView[]): string {
  const totals: Record<string, number> = {};
  students.forEach((s) =>
    s.mastery.forEach((m) => {
      totals[m.topic] = (totals[m.topic] ?? 0) + m.mastery;
    })
  );
  const sorted = Object.entries(totals).sort((a, b) => a[1] - b[1]);
  return sorted.length ? TOPIC_MAP[sorted[0][0] as TopicId].name : '—';
}
