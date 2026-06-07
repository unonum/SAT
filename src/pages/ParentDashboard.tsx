import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { computeAllMastery, estimateScore } from '@/lib/adaptive';
import { generateWeeklyReport } from '@/lib/tutor';
import { TOPIC_MAP } from '@/lib/topics';
import { Card, SectionTitle, Pill, Stat, MasteryBar } from '@/components/ui';
import { todayStr } from '@/lib/gamification';
import { Users, Target, Clock, Flame, CheckCircle2, AlertTriangle, CalendarX } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ParentDashboard() {
  const { attempts, daily, gamification, user } = useStore();
  const mastery = useMemo(() => computeAllMastery(attempts), [attempts]);
  const score = estimateScore(attempts);
  const lastWeek = daily.length > 6 ? daily[daily.length - 7].scoreEstimate : score.total - 30;
  const report = generateWeeklyReport(attempts, mastery, score.total, lastWeek);

  const totalMin = Math.round(attempts.reduce((s, a) => s + a.timeSec, 0) / 60);
  const acc = attempts.length ? Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100) : 0;

  // last 7 days effort
  const effortData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
    const stat = daily.find((x) => x.date === d);
    return { date: d.slice(5), questions: stat?.questions ?? 0 };
  });
  const missedDays = effortData.filter((d) => d.questions === 0 && d.date !== todayStr().slice(5)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
          <Users size={22} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">Parent / Tutor Dashboard</h1>
          <p className="text-sm text-muted">Progress overview for {user?.name ?? 'your student'}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Estimated SAT" value={score.total} sub={`${report.delta >= 0 ? '+' : ''}${report.delta} this week`} accent={report.delta >= 0 ? 'success' : 'warning'} icon={<Target size={20} />} />
        <Stat label="Total study time" value={`${totalMin}m`} sub={`${attempts.length} questions`} icon={<Clock size={20} />} />
        <Stat label="Accuracy" value={`${acc}%`} accent="accent" icon={<CheckCircle2 size={20} />} />
        <Stat label="Study streak" value={`${gamification.streak} days`} sub={`${missedDays} missed this week`} accent="warning" icon={<Flame size={20} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Daily effort (last 7 days)" subtitle="Questions completed each day" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={effortData} margin={{ left: -20, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
              <Bar dataKey="questions" radius={[8, 8, 0, 0]} fill="#3563ff" />
            </BarChart>
          </ResponsiveContainer>
          {missedDays > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-warning"><CalendarX size={15} /> {missedDays} missed practice day(s) this week.</p>
          )}
        </Card>

        <Card>
          <SectionTitle title="Topic mastery" subtitle="Where support is most needed" />
          <div className="space-y-3">
            {[...mastery].sort((a, b) => a.mastery - b.mastery).slice(0, 5).map((m) => (
              <div key={m.topic}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{TOPIC_MAP[m.topic].name}</span>
                  <span className="font-semibold">{m.mastery}%</span>
                </div>
                <MasteryBar value={m.mastery} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-brand-500/5 to-accent-500/5">
        <SectionTitle title="This week's summary report" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryRow label="Improvement trend" value={`${report.delta >= 0 ? 'Up' : 'Down'} ${Math.abs(report.delta)} pts`} />
          <SummaryRow label="Strongest area" value={report.strongest[0] ?? '—'} />
          <SummaryRow label="Most common mistake" value={report.topMistake} />
          <SummaryRow label="Recommended focus" value={report.focusNextWeek} />
        </div>
        <div className="mt-4 rounded-xl border surface p-4">
          <div className="flex items-center gap-2 font-semibold text-sm"><AlertTriangle size={16} className="text-brand-500" /> Recommended support</div>
          <p className="mt-1 text-sm text-muted">{report.parentAction}</p>
        </div>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border surface p-3 text-sm">
      <span className="text-muted">{label}</span>
      <Pill tone="brand">{value}</Pill>
    </div>
  );
}
