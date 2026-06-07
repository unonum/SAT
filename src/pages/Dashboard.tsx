import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { computeAllMastery, estimateScore } from '@/lib/adaptive';
import { generateDailyFeedback } from '@/lib/tutor';
import { todayStr, levelFromXp, BADGES } from '@/lib/gamification';
import { TOPIC_MAP } from '@/lib/topics';
import { Card, Stat, ProgressRing, MasteryBar, Pill, SectionTitle } from '@/components/ui';
import { masteryLabel, relativeDate } from '@/lib/utils';
import {
  Trophy,
  Target,
  Flame,
  CheckCircle2,
  Brain,
  Dumbbell,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function Dashboard() {
  const { attempts, daily, gamification, user } = useStore();
  const mastery = useMemo(() => computeAllMastery(attempts), [attempts]);
  const score = useMemo(() => estimateScore(attempts), [attempts]);
  const today = todayStr();
  const todayAttempts = attempts.filter((a) => new Date(a.ts).toISOString().slice(0, 10) === today);
  const feedback = generateDailyFeedback(todayAttempts, mastery, gamification.streak);
  const lvl = levelFromXp(gamification.xp);

  const weakest = [...mastery].filter((m) => m.attempts > 0).sort((a, b) => a.mastery - b.mastery).slice(0, 3);
  const gap = (user?.targetScore ?? 1450) - score.total;

  const chartData = daily.slice(-10).map((d) => ({
    date: d.date.slice(5),
    score: d.scoreEstimate,
  }));

  const todayAcc = todayAttempts.length
    ? Math.round((todayAttempts.filter((a) => a.correct).length / todayAttempts.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Daily AI feedback banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 p-6 text-white">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/70">Your daily AI coach</div>
            <p className="mt-1 font-medium leading-relaxed">{feedback.message}</p>
            <p className="mt-2 text-sm text-white/80">→ {feedback.nextStep}</p>
            <Link to="/app/practice" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-white/90">
              Start today's practice <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Estimated SAT score" value={score.total} sub={`Math ${score.math} · RW ${score.rw}`} icon={<Target size={20} />} />
        <Stat label="Target gap" value={gap > 0 ? `${gap} pts` : 'On target! 🎯'} sub={`Goal ${user?.targetScore ?? 1450}`} accent={gap > 100 ? 'warning' : 'success'} icon={<TrendingUp size={20} />} />
        <Stat label="Day streak" value={`${gamification.streak} 🔥`} sub={`Best habit you've got`} accent="warning" icon={<Flame size={20} />} />
        <Stat label="Level" value={lvl.level} sub={`${gamification.xp} XP · ${lvl.needed - lvl.into} to next`} accent="accent" icon={<Trophy size={20} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score projection chart */}
        <Card className="lg:col-span-2">
          <SectionTitle title="Score projection" subtitle="Estimated SAT score over your recent practice" />
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="sc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3563ff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3563ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[400, 1600]} tick={{ fontSize: 11 }} stroke="#94a3b8" width={42} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid rgba(148,163,184,0.3)', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="score" stroke="#3563ff" strokeWidth={2.5} fill="url(#sc)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-[240px] place-items-center text-center text-sm text-muted">
              Practice a few days to see your score trend climb 📈
            </div>
          )}
        </Card>

        {/* Today's snapshot */}
        <Card>
          <SectionTitle title="Today" />
          <div className="flex items-center justify-center py-2">
            <ProgressRing value={todayAcc} size={120} label={`${todayAcc}%`} sublabel="accuracy" />
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Row k="Questions" v={String(todayAttempts.length)} icon={<CheckCircle2 size={15} className="text-success" />} />
            <Row k="Time spent" v={`${Math.round(todayAttempts.reduce((s, a) => s + a.timeSec, 0) / 60)} min`} icon={<Flame size={15} className="text-orange-500" />} />
            <Row k="XP earned today" v={`+${todayAttempts.reduce((s, a) => s + (a.correct ? 12 : 4), 0)}`} icon={<Sparkles size={15} className="text-brand-500" />} />
          </div>
        </Card>
      </div>

      {/* Weakest topics + quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Topics needing attention"
            subtitle="Your adaptive engine is loading these first"
            action={<Link to="/app/weakness" className="text-sm font-semibold text-brand-600">View all →</Link>}
          />
          {weakest.length ? (
            <div className="space-y-4">
              {weakest.map((m) => (
                <div key={m.topic}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{TOPIC_MAP[m.topic].name}</span>
                    <Pill tone={m.mastery >= 70 ? 'success' : m.mastery >= 50 ? 'warning' : 'danger'}>
                      {m.mastery}% · {masteryLabel(m.mastery)}
                    </Pill>
                  </div>
                  <MasteryBar value={m.mastery} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Complete your diagnostic to see your weak areas.</p>
          )}
        </Card>

        <Card>
          <SectionTitle title="Jump back in" />
          <div className="space-y-2.5">
            <QuickAction to="/app/practice" icon={<Dumbbell size={18} />} label="Daily adaptive practice" tone="brand" />
            <QuickAction to="/app/weakness" icon={<Target size={18} />} label="Weakness repair mode" tone="warning" />
            <QuickAction to="/app/mock" icon={<Brain size={18} />} label="Full mock test" tone="accent" />
            <QuickAction to="/app/errors" icon={<AlertTriangle size={18} />} label="Review your errors" tone="danger" />
          </div>
        </Card>
      </div>

      {/* Badges + recent */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Badges" subtitle={`${gamification.badges.length} unlocked`} />
          <div className="flex flex-wrap gap-3">
            {Object.entries(BADGES).map(([id, b]) => {
              const earned = gamification.badges.includes(id);
              return (
                <div
                  key={id}
                  title={b.desc}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${
                    earned ? 'surface' : 'opacity-35 grayscale'
                  }`}
                  style={{ width: 88 }}
                >
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-[10px] font-semibold leading-tight">{b.name}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Recent activity" />
          {attempts.length ? (
            <div className="space-y-2">
              {[...attempts].slice(-6).reverse().map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  {a.correct ? (
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                  ) : (
                    <AlertTriangle size={16} className="text-danger shrink-0" />
                  )}
                  <span className="flex-1 truncate">{TOPIC_MAP[a.topic].name}</span>
                  <span className="text-xs text-muted">{relativeDate(a.ts)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No activity yet — start practicing!</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v, icon }: { k: string; v: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted">{icon} {k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}

function QuickAction({ to, icon, label, tone }: { to: string; icon: React.ReactNode; label: string; tone: 'brand' | 'warning' | 'accent' | 'danger' }) {
  const tones = {
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
    warning: 'bg-warning/10 text-warning',
    accent: 'bg-accent-500/10 text-accent-600',
    danger: 'bg-danger/10 text-danger',
  };
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border surface p-3 text-sm font-medium hover:border-brand-400 transition-colors">
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      <ArrowRight size={16} className="text-muted" />
    </Link>
  );
}
