import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { scoreHistory } from '@/lib/history';
import { STUDENT_EMAILS, displayName } from '@/lib/auth';
import { computeAllMastery, estimateScore } from '@/lib/adaptive';
import { generateWeeklyReport, MISTAKE_LABELS } from '@/lib/tutor';
import { TOPIC_MAP, TOPICS } from '@/lib/topics';
import { Card, SectionTitle, Pill, Stat, MasteryBar, ProgressRing } from '@/components/ui';
import { masteryColor, relativeDate, formatTime } from '@/lib/utils';
import type { UserData, MistakeCategory, TopicId } from '@/lib/types';
import {
  Users, Target, TrendingUp, AlertTriangle, Crown, Flame, Clock,
  CheckCircle2, ChevronDown, Trophy, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
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
  const remoteEnabled = useStore((s) => s.remoteEnabled);
  const hydrateStudents = useStore((s) => s.hydrateStudents);
  const [openEmail, setOpenEmail] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Pull latest history from the DB whenever the admin opens this view.
  useEffect(() => {
    if (remoteEnabled) void hydrateStudents();
  }, [remoteEnabled, hydrateStudents]);

  const students: StudentView[] = useMemo(() => {
    return STUDENT_EMAILS.map((email) => {
      const data: UserData = profiles[email] ?? {
        user: { name: displayName(email), email, role: 'student', targetScore: 1450, studyHoursPerDay: 1, createdAt: Date.now() },
        hasDiagnostic: false,
        attempts: [],
        gamification: { xp: 0, level: 1, streak: 0, lastActiveDate: null, badges: [] },
        daily: [],
      };
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

  const totalAttempts = students.reduce((a, s) => a + s.data.attempts.length, 0);

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
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={remoteEnabled ? 'success' : 'muted'}>
            <span className={`h-2 w-2 rounded-full ${remoteEnabled ? 'bg-success' : 'bg-slate-400'}`} />
            {remoteEnabled ? 'DB connected' : 'Local mode'}
          </Pill>
          {remoteEnabled && (
            <button
              className="btn-ghost px-3 py-1.5 text-xs"
              disabled={syncing}
              onClick={async () => { setSyncing(true); await hydrateStudents(); setSyncing(false); }}
            >
              {syncing ? 'Syncing…' : 'Refresh'}
            </button>
          )}
        </div>
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
                    {s.data.attempts.length > 0
                      ? <Pill tone="success">Live</Pill>
                      : <Pill tone="muted">No activity yet</Pill>}
                    {(() => {
                      const days = inactiveDays(s.lastActive);
                      return days !== null && days >= 3
                        ? <Pill tone="danger"><AlertTriangle size={11} /> Inactive {days}d</Pill>
                        : null;
                    })()}
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

              {/* Score trend sparkline */}
              <ScoreSparkline attempts={s.data.attempts} color={barColors[i % barColors.length]} />

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

      {/* Historical progress */}
      <Card>
        <SectionTitle title="Historical progress" subtitle="Estimated SAT score over time — see exactly what improved and when" />
        <HistoryChart students={students} colors={barColors} />
      </Card>

      {/* Class-wide insights */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Stat label="Combined questions" value={totalAttempts} icon={<CheckCircle2 size={20} />} accent="brand" />
        <Stat label="Avg estimated score" value={Math.round(students.reduce((a, s) => a + s.score.total, 0) / students.length)} icon={<Target size={20} />} accent="accent" />
        <Stat label="Shared weak area" value={<span className="text-base">{sharedWeakness(students)}</span>} icon={<AlertTriangle size={20} />} accent="warning" />
      </div>

      {/* Deep analytics (real data) */}
      {totalAttempts > 0 && <ClassAnalytics students={students} colors={barColors} />}
    </div>
  );
}

/** Whole days since last activity (null if never active). */
function inactiveDays(lastActive: number | null): number | null {
  if (!lastActive) return null;
  return Math.floor((Date.now() - lastActive) / 86400000);
}

/** Compact score-over-time sparkline for a student card. */
function ScoreSparkline({ attempts, color }: { attempts: StudentView['data']['attempts']; color: string }) {
  const series = scoreHistory(attempts);
  if (series.length < 2) {
    return (
      <div className="mb-4 rounded-xl border border-dashed border-[rgb(var(--border))] py-3 text-center text-xs text-muted">
        Score trend appears after 2+ active days
      </div>
    );
  }
  const first = series[0].score;
  const last = series[series.length - 1].score;
  const delta = last - first;
  const up = delta >= 0;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-bold uppercase tracking-wide text-muted">Score trend</span>
        <span className={`flex items-center gap-1 font-semibold ${up ? 'text-success' : 'text-danger'}`}>
          <TrendingUp size={12} className={up ? '' : 'rotate-180'} />
          {up ? '+' : ''}{delta} ({first}→{last})
        </span>
      </div>
      <ResponsiveContainer width="100%" height={44}>
        <LineChart data={series} margin={{ top: 4, bottom: 4, left: 2, right: 2 }}>
          <Tooltip
            contentStyle={{ borderRadius: 10, fontSize: 11, padding: '4px 8px' }}
            labelFormatter={(l) => `Day ${l}`}
            formatter={(v) => [v as number, 'Score']}
          />
          <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Difficulty performance, mistake distribution, pace & engagement — all from real attempts. */
function ClassAnalytics({ students, colors }: { students: StudentView[]; colors: string[] }) {
  const DIFFS: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

  // Accuracy by difficulty, per student
  const diffData = DIFFS.map((d) => {
    const row: Record<string, number | string> = { difficulty: d[0].toUpperCase() + d.slice(1) };
    students.forEach((s) => {
      const subset = s.data.attempts.filter((a) => a.difficulty === d);
      row[s.name] = subset.length ? Math.round((subset.filter((a) => a.correct).length / subset.length) * 100) : 0;
    });
    return row;
  });

  // Mistake distribution (class-wide)
  const mistakeCounts: Record<string, number> = {};
  let totalMistakes = 0;
  students.forEach((s) =>
    s.data.attempts.filter((a) => !a.correct && a.mistakeCategory).forEach((a) => {
      mistakeCounts[a.mistakeCategory!] = (mistakeCounts[a.mistakeCategory!] || 0) + 1;
      totalMistakes++;
    })
  );
  const mistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]);

  // Engagement: questions in the last 7 days, per student
  const weekAgo = Date.now() - 7 * 86400000;

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Accuracy by difficulty */}
        <Card>
          <SectionTitle title="Accuracy by difficulty" subtitle="Who holds up as questions get harder" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={diffData} margin={{ left: -10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'rgba(148,163,184,0.08)' }} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {students.map((s, i) => (
                <Bar key={s.email} dataKey={s.name} radius={[6, 6, 0, 0]} fill={colors[i % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Mistake distribution */}
        <Card>
          <SectionTitle title="Why answers are missed" subtitle="Class-wide mistake breakdown" />
          {totalMistakes === 0 ? (
            <p className="text-sm text-muted">No mistakes logged yet.</p>
          ) : (
            <div className="space-y-3 mt-1">
              {mistakes.map(([k, v]) => {
                const pct = Math.round((v / totalMistakes) * 100);
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{MISTAKE_LABELS[k as MistakeCategory]}</span>
                      <span className="text-muted">{v} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-500/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Pace & engagement table */}
      <Card>
        <SectionTitle title="Pace & engagement" subtitle="Effort and speed over the last 7 days — straight from logged attempts" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted">
              <tr className="text-left border-b border-[rgb(var(--border))]">
                <th className="py-2 pr-3 font-semibold">Student</th>
                <th className="py-2 px-3 font-semibold text-right">Total Qs</th>
                <th className="py-2 px-3 font-semibold text-right">Last 7d</th>
                <th className="py-2 px-3 font-semibold text-right">Accuracy</th>
                <th className="py-2 px-3 font-semibold text-right">Avg time/Q</th>
                <th className="py-2 px-3 font-semibold text-right">Time on task</th>
                <th className="py-2 pl-3 font-semibold">Last active</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const total = s.data.attempts.length;
                const last7 = s.data.attempts.filter((a) => a.ts >= weekAgo).length;
                const avg = total ? Math.round(s.data.attempts.reduce((x, a) => x + a.timeSec, 0) / total) : 0;
                return (
                  <tr key={s.email} className="border-b border-[rgb(var(--border))]/50">
                    <td className="py-2 pr-3 font-medium">{s.name}</td>
                    <td className="py-2 px-3 text-right">{total}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={last7 === 0 ? 'text-danger font-semibold' : ''}>{last7}</span>
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: masteryColor(s.accuracy) }}>{s.accuracy}%</td>
                    <td className="py-2 px-3 text-right">{total ? formatTime(avg) : '—'}</td>
                    <td className="py-2 px-3 text-right">{s.totalMin}m</td>
                    <td className="py-2 pl-3 text-muted">{s.lastActive ? relativeDate(s.lastActive) : 'never'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
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

      {/* Minute details — per-attempt activity log */}
      <AttemptLog s={s} />
    </motion.div>
  );
}

const MODE_LABELS: Record<string, string> = {
  diagnostic: 'Diagnostic',
  'daily-adaptive': 'Daily',
  topic: 'Topic',
  timed: 'Timed drill',
  speed: 'Speed',
  weakness: 'Weakness',
  mock: 'Mock test',
  'error-review': 'Error review',
  bootcamp: 'Bootcamp',
  revision: 'Revision',
};

function AttemptLog({ s }: { s: StudentView }) {
  const [mode, setMode] = useState<string>('all');
  const [limit, setLimit] = useState(20);

  const modes = useMemo(() => {
    const set = new Set(s.data.attempts.map((a) => a.mode).filter(Boolean) as string[]);
    return ['all', ...Array.from(set)];
  }, [s.data.attempts]);

  const rows = useMemo(() => {
    return [...s.data.attempts]
      .filter((a) => mode === 'all' || a.mode === mode)
      .sort((a, b) => b.ts - a.ts);
  }, [s.data.attempts, mode]);

  const shown = rows.slice(0, limit);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-xs font-bold uppercase tracking-wide text-muted">
          Attempt-by-attempt log <span className="text-muted/70">({rows.length})</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setLimit(20); }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                mode === m ? 'bg-brand-500 text-white' : 'surface border text-muted hover:text-fg'
              }`}
            >
              {m === 'all' ? 'All' : MODE_LABELS[m] ?? m}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted">No attempts in this view yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
          <table className="w-full text-xs">
            <thead className="surface text-muted">
              <tr className="text-left">
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold">Topic</th>
                <th className="px-3 py-2 font-semibold">Diff.</th>
                <th className="px-3 py-2 font-semibold">Mode</th>
                <th className="px-3 py-2 font-semibold text-center">Result</th>
                <th className="px-3 py-2 font-semibold text-right">Time</th>
                <th className="px-3 py-2 font-semibold">Mistake</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id} className="border-t border-[rgb(var(--border))]">
                  <td className="px-3 py-2 whitespace-nowrap text-muted">{relativeDate(a.ts)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{TOPIC_MAP[a.topic]?.name ?? a.topic}</td>
                  <td className="px-3 py-2 capitalize text-muted">{a.difficulty}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted">{MODE_LABELS[a.mode ?? ''] ?? a.mode ?? '—'}</td>
                  <td className="px-3 py-2 text-center">
                    {a.correct
                      ? <span className="text-success font-bold">✓</span>
                      : <span className="text-danger font-bold">✗</span>}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{formatTime(a.timeSec)}</td>
                  <td className="px-3 py-2 text-muted">
                    {a.correct ? '—' : MISTAKE_LABELS[a.mistakeCategory as MistakeCategory] ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > limit && (
        <button onClick={() => setLimit((n) => n + 20)} className="btn-ghost mt-2 w-full py-1.5 text-xs">
          Show more ({rows.length - limit} remaining)
        </button>
      )}
    </div>
  );
}

function HistoryChart({ students, colors }: { students: StudentView[]; colors: string[] }) {
  // merge each student's daily score series by date
  const byDate = new Map<string, Record<string, number | string>>();
  students.forEach((s) => {
    scoreHistory(s.data.attempts).forEach((pt) => {
      const row = byDate.get(pt.date) ?? { date: pt.date };
      row[s.name] = pt.score;
      byDate.set(pt.date, row);
    });
  });
  const data = Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (data.length < 2) {
    return <div className="grid h-[260px] place-items-center text-sm text-muted">Not enough history yet — progress will plot as students practice.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ left: -10, right: 10, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis domain={[400, 1600]} tick={{ fontSize: 11 }} stroke="#94a3b8" width={44} />
        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Legend />
        {students.map((s, i) => (
          <Line
            key={s.email}
            type="monotone"
            dataKey={s.name}
            stroke={colors[i % colors.length]}
            strokeWidth={2.5}
            dot={{ r: 2 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
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
