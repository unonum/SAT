import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { computeAllMastery, estimateScore } from '@/lib/adaptive';
import { generateWeeklyReport } from '@/lib/tutor';
import { Card, SectionTitle, Pill, Stat } from '@/components/ui';
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Target,
  ShieldCheck,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ProgressReport() {
  const { attempts, daily } = useStore();
  const mastery = useMemo(() => computeAllMastery(attempts), [attempts]);
  const score = estimateScore(attempts);

  // approximate last-week score from older daily stats
  const lastWeekScore = daily.length > 3 ? daily[Math.max(0, daily.length - 7)].scoreEstimate : score.total - 30;
  const report = generateWeeklyReport(attempts, mastery, score.total, lastWeekScore);

  const weekData = daily.slice(-14).map((d) => ({
    date: d.date.slice(5),
    score: d.scoreEstimate,
    accuracy: d.questions ? Math.round((d.correct / d.questions) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      <SectionTitle title="Weekly AI Progress Report" subtitle="Auto-generated analysis of your week." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Estimated score" value={report.scoreNow} icon={<Target size={20} />} />
        <Stat
          label="Change this week"
          value={`${report.delta >= 0 ? '+' : ''}${report.delta}`}
          accent={report.delta >= 0 ? 'success' : 'danger'}
          icon={report.delta >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        />
        <Stat label="Confidence" value={report.confidence} accent="accent" icon={<ShieldCheck size={20} />} />
        <Stat label="Top mistake" value={<span className="text-base">{report.topMistake}</span>} accent="warning" icon={<AlertTriangle size={20} />} />
      </div>

      <Card>
        <SectionTitle title="Score & accuracy trend" subtitle="Last two weeks" />
        {weekData.length > 1 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weekData} margin={{ left: -10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis yAxisId="l" domain={[400, 1600]} tick={{ fontSize: 11 }} stroke="#94a3b8" width={42} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" width={32} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line yAxisId="l" type="monotone" dataKey="score" stroke="#3563ff" strokeWidth={2.5} dot={false} name="Score" />
              <Line yAxisId="r" type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Accuracy %" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-[260px] place-items-center text-sm text-muted">Practice more days to build your trend.</div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Strengths & focus areas" />
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-2 flex items-center gap-2 font-semibold text-success"><Award size={16} /> Strongest topics</div>
              <div className="flex flex-wrap gap-2">
                {report.strongest.length ? report.strongest.map((s) => <Pill key={s} tone="success">{s}</Pill>) : <span className="text-muted">Not enough data</span>}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 font-semibold text-warning"><AlertTriangle size={16} /> Needs work</div>
              <div className="flex flex-wrap gap-2">
                {report.weakest.length ? report.weakest.map((s) => <Pill key={s} tone="warning">{s}</Pill>) : <span className="text-muted">Not enough data</span>}
              </div>
            </div>
            {report.riskAreas.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2 font-semibold text-danger"><AlertTriangle size={16} /> Risk areas (repair mode)</div>
                <div className="flex flex-wrap gap-2">
                  {report.riskAreas.map((s) => <Pill key={s} tone="danger">{s}</Pill>)}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-brand-500/5 to-accent-500/5">
          <div className="flex items-center gap-2 mb-3">
            <LineChartIcon size={18} className="text-brand-500" />
            <h3 className="font-display font-bold">AI summary</h3>
          </div>
          <div className="space-y-3 text-sm">
            <p>
              Your projected score is <b>{report.scoreNow}</b>, a {report.delta >= 0 ? 'gain' : 'dip'} of{' '}
              <b className={report.delta >= 0 ? 'text-success' : 'text-danger'}>{Math.abs(report.delta)} points</b> this week.
            </p>
            <p>
              Your most common mistake type is <b>{report.topMistake}</b>. Next week we'll concentrate on{' '}
              <b>{report.focusNextWeek}</b> to convert that into points.
            </p>
            <div className="rounded-xl border surface p-3">
              <div className="font-semibold mb-1">Suggested parent/tutor action</div>
              <p className="text-muted">{report.parentAction}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
