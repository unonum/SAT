import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { computeAllMastery, estimateScore } from '@/lib/adaptive';
import { generateDailyFeedback } from '@/lib/tutor';
import { todayStr, levelFromXp, BADGES } from '@/lib/gamification';
import { TOPIC_MAP } from '@/lib/topics';
import { Card, Stat, ProgressRing, MasteryBar, Pill, SectionTitle } from '@/components/ui';
import { masteryLabel, relativeDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Trophy, Target, Flame, CheckCircle2, Brain, Dumbbell,
  AlertTriangle, ArrowRight, Sparkles, TrendingUp, FileText,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const fd = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
});

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

  const todayMockAttempts = todayAttempts.filter((a) => a.mode === 'mock');
  const mockDoneToday = todayMockAttempts.length > 0;
  const mockAcc = mockDoneToday
    ? Math.round((todayMockAttempts.filter((a) => a.correct).length / todayMockAttempts.length) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Daily AI Coach banner */}
      <motion.div {...fd(0)}>
        <div className="relative overflow-hidden rounded-3xl p-px bg-gradient-brand shadow-glow-lg">
          <div className="relative rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 p-6 sm:p-7">
            {/* Background decoration */}
            <div className="absolute right-0 top-0 h-full w-1/3 opacity-10"
              style={{ background: 'radial-gradient(circle at 80% 50%, white, transparent)' }} />
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Sparkles size={22} className="text-yellow-300 animate-bounce-subtle" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Your daily AI coach</div>
                <p className="font-medium text-white leading-relaxed">{feedback.message}</p>
                <p className="mt-1.5 text-sm text-white/75">→ {feedback.nextStep}</p>
                <Link to="/app/practice" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 hover:bg-white/90 hover:scale-[1.02] transition-all shadow-lg">
                  Start today's practice <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Estimated SAT score', value: score.total, sub: `Math ${score.math} · RW ${score.rw}`, icon: <Target size={20} />, accent: 'brand' as const, delay: 0.05 },
          { label: 'Points to target', value: gap > 0 ? `${gap} pts` : '🎯 On target!', sub: `Goal ${user?.targetScore ?? 1450}`, icon: <TrendingUp size={20} />, accent: gap > 100 ? 'warning' as const : 'success' as const, delay: 0.1 },
          { label: 'Day streak', value: `${gamification.streak} 🔥`, sub: 'Keep it going!', icon: <Flame size={20} />, accent: 'warning' as const, delay: 0.15 },
          { label: 'Level', value: lvl.level, sub: `${gamification.xp} XP`, icon: <Trophy size={20} />, accent: 'violet' as const, delay: 0.2 },
        ].map((s) => (
          <motion.div key={s.label} {...fd(s.delay)}>
            <Stat label={s.label} value={s.value} sub={s.sub} icon={s.icon} accent={s.accent} />
          </motion.div>
        ))}
      </div>

      {/* Daily mock CTA */}
      <motion.div {...fd(0.12)}>
        {mockDoneToday ? (
          <div className="flex items-center gap-4 rounded-2xl border border-success/30 bg-success/5 px-5 py-4">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">Today's mock test complete!</p>
              <p className="text-xs text-muted mt-0.5">{todayMockAttempts.length} questions · {mockAcc}% accuracy</p>
            </div>
            <Link to="/app/mock" className="text-xs font-semibold text-success hover:underline shrink-0">View results →</Link>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/8 to-accent-500/8 px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow">
                <FileText size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Complete today's mock test</p>
                <p className="text-xs text-muted mt-0.5">98 questions · 134 min · Full SAT simulation with analysis</p>
              </div>
              <Link to="/app/mock" className="btn-primary px-4 py-2 text-sm shrink-0">
                Start now <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score chart */}
        <motion.div {...fd(0.15)} className="lg:col-span-2">
          <Card>
            <SectionTitle title="Score projection" subtitle="Estimated SAT score over recent practice" />
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="sc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3563ff" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#3563ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis domain={[400, 1600]} tick={{ fontSize: 11 }} stroke="#94a3b8" width={42} />
                  <Tooltip
                    contentStyle={{ borderRadius: 14, border: '1px solid rgba(53,99,255,0.2)', fontSize: 12, backdropFilter: 'blur(8px)', background: 'rgba(11,15,30,0.85)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#3563ff" strokeWidth={3} fill="url(#sc)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-[240px] place-items-center text-center">
                <div>
                  <div className="text-4xl mb-3">📈</div>
                  <p className="text-sm text-muted">Practice a few days to see your score trend</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Today snapshot */}
        <motion.div {...fd(0.2)}>
          <Card className="h-full flex flex-col">
            <SectionTitle title="Today" />
            <div className="flex-1 flex flex-col items-center justify-center py-3 gap-5">
              <ProgressRing value={todayAcc} size={128} label={`${todayAcc}%`} sublabel="accuracy today" />
              <div className="w-full space-y-2.5 text-sm">
                <TRow label="Questions" value={String(todayAttempts.length)} icon="📝" />
                <TRow label="Time spent" value={`${Math.round(todayAttempts.reduce((s, a) => s + a.timeSec, 0) / 60)}m`} icon="⏱️" />
                <TRow label="XP earned" value={`+${todayAttempts.reduce((s, a) => s + (a.correct ? 12 : 4), 0)}`} icon="✨" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Weak topics + quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div {...fd(0.25)} className="lg:col-span-2">
          <Card>
            <SectionTitle
              title="Topics needing attention"
              subtitle="Adaptive engine loads these first"
              action={<Link to="/app/weakness" className="text-sm font-semibold text-brand-600 hover:text-brand-500 transition-colors">View all →</Link>}
            />
            {weakest.length ? (
              <div className="space-y-4">
                {weakest.map((m) => (
                  <div key={m.topic}>
                    <div className="mb-2 flex items-center justify-between text-sm">
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
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-sm text-muted">Complete your diagnostic to see weak areas</p>
                <Link to="/assessment" className="btn-primary mt-3 px-5 py-2 text-sm inline-flex">Start diagnostic</Link>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div {...fd(0.3)}>
          <Card>
            <SectionTitle title="Jump back in" />
            <div className="space-y-2">
              {[
                { to: '/app/practice', icon: <Dumbbell size={17} />, label: 'Daily adaptive practice', grad: 'from-brand-500 to-brand-600' },
                { to: '/app/weakness', icon: <Target size={17} />, label: 'Weakness repair mode', grad: 'from-warning to-orange-500' },
                { to: '/app/mock', icon: <Brain size={17} />, label: 'Full mock test', grad: 'from-violet-500 to-brand-500' },
                { to: '/app/errors', icon: <AlertTriangle size={17} />, label: 'Review error log', grad: 'from-danger to-orange-500' },
              ].map((a) => (
                <Link key={a.to} to={a.to} className="group flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] p-3 text-sm font-medium hover:border-brand-400 hover:bg-brand-500/5 transition-all">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${a.grad} text-white shadow-soft`}>{a.icon}</span>
                  <span className="flex-1">{a.label}</span>
                  <ArrowRight size={15} className="text-muted group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Badges + recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div {...fd(0.35)}>
          <Card>
            <SectionTitle title="Badges" subtitle={`${gamification.badges.length} / ${Object.keys(BADGES).length} unlocked`} />
            <div className="flex flex-wrap gap-3">
              {Object.entries(BADGES).map(([id, b]) => {
                const earned = gamification.badges.includes(id);
                return (
                  <div
                    key={id}
                    title={b.desc}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all duration-200 cursor-default',
                      earned
                        ? 'border-brand-500/30 bg-brand-500/8 hover:shadow-glow hover:scale-105'
                        : 'border-[rgb(var(--border))] opacity-30 grayscale'
                    )}
                    style={{ width: 84 }}
                  >
                    <span className="text-2xl leading-none">{b.icon}</span>
                    <span className="text-[10px] font-semibold leading-tight">{b.name}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div {...fd(0.4)}>
          <Card>
            <SectionTitle title="Recent activity" />
            {attempts.length ? (
              <div className="space-y-1.5">
                {[...attempts].slice(-7).reverse().map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-sm">
                    <span className="text-base">{a.correct ? '✅' : '❌'}</span>
                    <span className="flex-1 truncate font-medium">{TOPIC_MAP[a.topic].name}</span>
                    <span className="text-xs text-muted shrink-0">{relativeDate(a.ts)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🌱</div>
                <p className="text-sm text-muted">No activity yet — start practicing!</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function TRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center justify-between px-1">
      <span className="flex items-center gap-2 text-muted">{icon} {label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(' ');
}
