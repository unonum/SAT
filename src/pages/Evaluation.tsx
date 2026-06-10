import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import QuestionRunner from '@/components/QuestionRunner';
import { Card, SectionTitle, Pill } from '@/components/ui';
import {
  EVAL_TESTS, evalSummary, evalSessions, evalTestSize,
  benchmarkProgress, benchmarkBaseline, type EvalTestDef,
} from '@/lib/evaluation';
import { relativeDate } from '@/lib/utils';
import {
  ClipboardCheck, Clock, ListChecks, Play, TrendingUp, History,
  Database, Trophy, ArrowLeft, Target, Rocket, CheckCircle2, Lock,
  ShieldCheck, Loader2,
} from 'lucide-react';
import type { Question } from '@/lib/types';
import { computeTopicMastery } from '@/lib/adaptive';
import { TOPICS } from '@/lib/topics';
import { createNovelTestSession } from '@/lib/ragClient';
import { buildEvalTest } from '@/lib/evaluation';

export default function Evaluation() {
  const attempts = useStore((s) => s.attempts);
  const user = useStore((s) => s.user);
  const remoteEnabled = useStore((s) => s.remoteEnabled);
  const [active, setActive] = useState<{ def: EvalTestDef; questions: Question[] } | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const startEvaluation = async (def: EvalTestDef) => {
    setLoadingId(def.id);
    setError('');
    try {
      let questions: Question[];
      if (remoteEnabled && user?.email) {
        try {
          questions = await createNovelTestSession({
            email: user.email, mode: def.mode, count: evalTestSize(def.id),
            attempts, fallbackQuestions: buildEvalTest(def.id),
          });
        } catch {
          questions = buildEvalTest(def.id);
        }
      } else {
        questions = buildEvalTest(def.id);
      }
      if (!questions.length) questions = buildEvalTest(def.id);
      setActive({ def, questions });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the evaluation');
    } finally {
      setLoadingId(null);
    }
  };

  if (active) {
    return (
      <div>
        <button className="btn-ghost mb-4 text-sm" onClick={() => setActive(null)}>
          <ArrowLeft size={15} /> Back to evaluations
        </button>
        <QuestionRunner
          questions={active.questions}
          mode={active.def.mode}
          title={active.def.name}
          timed
        />
      </div>
    );
  }

  const bench = benchmarkProgress(attempts);
  const baseline = benchmarkBaseline(attempts);
  const nextTest = EVAL_TESTS.find((t) => !attempts.some((a) => a.mode === t.mode));

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Benchmark Evaluations"
        subtitle="Three full-length, non-overlapping tests that set your baseline. Finish all three to unlock the rest of your training."
      />

      {/* Gamified benchmark banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl p-6 text-white shadow-glow-violet ${
          bench.complete
            ? 'bg-gradient-to-br from-emerald-500 to-brand-600'
            : 'bg-gradient-to-br from-violet-600 to-brand-600'
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20">
            {bench.complete ? <Rocket size={28} /> : <Target size={28} />}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-display text-xl font-extrabold">
              {bench.complete ? 'Benchmark complete — training unlocked!' : 'Set your baseline'}
            </div>
            <p className="text-sm text-white/85">
              {bench.complete
                ? <>Your baseline is <b>{baseline}</b>. Daily Practice & Mock Tests now build on this analysis to push you higher.</>
                : nextTest
                ? <>Next up: <b>{nextTest.name}</b>. Complete all three to reveal your dashboard and personalized plan.</>
                : 'Keep going!'}
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-extrabold">{bench.done}/{bench.total}</div>
            <div className="text-xs text-white/80">tests done</div>
          </div>
        </div>
        {/* progress track */}
        <div className="mt-4 flex gap-2">
          {EVAL_TESTS.map((t) => {
            const taken = attempts.some((a) => a.mode === t.mode);
            return (
              <div key={t.id} className="flex-1">
                <div className={`h-2 rounded-full ${taken ? 'bg-white' : 'bg-white/25'}`} />
                <div className="mt-1 flex items-center gap-1 text-[11px] text-white/85">
                  {taken ? <CheckCircle2 size={11} /> : <Lock size={11} />} Test {t.id}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="flex items-center gap-2">
        <Pill tone={remoteEnabled ? 'success' : 'muted'}>
          <Database size={12} /> {remoteEnabled ? 'Synced to database' : 'Local mode'}
        </Pill>
        <span className="text-xs text-muted">Strict per-student novelty · vector-grounded generation · history persists across devices.</span>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {EVAL_TESTS.map((def, i) => {
          const summary = evalSummary(attempts, def.mode);
          const taken = summary.sittings > 0;
          return (
            <motion.div
              key={def.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Card className="h-full flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-brand-500 text-white shadow-soft">
                    <ClipboardCheck size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold">{def.name}</h3>
                    {taken
                      ? <Pill tone="success">Taken {summary.sittings}×</Pill>
                      : <Pill tone="muted">Not taken yet</Pill>}
                  </div>
                </div>

                <p className="text-sm text-muted mb-4 flex-1">{def.blurb}</p>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <Mini icon={<ListChecks size={14} />} label="Questions" value={String(evalTestSize(def.id))} />
                  <Mini icon={<Clock size={14} />} label="Timed" value="Yes" />
                  <Mini icon={<Trophy size={14} />} label="Best" value={summary.bestScore ? String(summary.bestScore) : '—'} />
                </div>

                {taken && summary.lastSession && (
                  <div className="mb-4 rounded-xl border border-[rgb(var(--border))] surface p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted text-xs">Last sitting</span>
                      <span className="text-xs text-muted">{relativeDate(summary.lastSession.finishedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-display text-xl font-extrabold">{summary.lastSession.score}</span>
                      <span className="text-sm text-muted">{summary.lastSession.accuracy}% acc</span>
                    </div>
                    {summary.delta !== null && summary.sittings > 1 && (
                      <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${summary.delta >= 0 ? 'text-success' : 'text-danger'}`}>
                        <TrendingUp size={12} className={summary.delta >= 0 ? '' : 'rotate-180'} />
                        {summary.delta >= 0 ? '+' : ''}{summary.delta} since first sitting
                      </div>
                    )}
                  </div>
                )}

                {taken ? (
                  <LockedResults attempts={attempts} def={def} summary={summary} />
                ) : (
                  <button
                    className="btn-primary w-full py-2.5"
                    onClick={() => void startEvaluation(def)}
                    disabled={loadingId !== null}
                  >
                    {loadingId === def.id ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    {loadingId === def.id ? 'Building novel evaluation…' : 'Start evaluation'}
                  </button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* History across all evaluations */}
      <EvalHistory />
    </div>
  );
}

function LockedResults({
  attempts,
  def,
  summary,
}: {
  attempts: import('@/lib/types').Attempt[];
  def: EvalTestDef;
  summary: ReturnType<typeof evalSummary>;
}) {
  const session = summary.lastSession;
  // Per-topic mastery from evaluation attempts only
  const evalAttempts = attempts.filter((a) => a.mode === def.mode);
  const topicMasteries = TOPICS.map((t) => ({
    ...computeTopicMastery(t.id, evalAttempts),
    name: t.name,
  }));

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3 text-sm">
        <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400 mb-1">
          <ShieldCheck size={16} /> Benchmark locked — yardstick only
        </div>
        <p className="text-amber-700/80 dark:text-amber-400/80 text-xs">
          These scores are your permanent baseline. Only practice &amp; mock tests improve your dashboard.
        </p>
      </div>

      {session && (
        <div className="rounded-xl border surface p-3 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs">Score</span>
            <span className="font-display text-xl font-extrabold">{session.score}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs">Accuracy</span>
            <span className="font-semibold">{session.accuracy}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs">Taken</span>
            <span className="text-muted text-xs">{relativeDate(session.finishedAt)}</span>
          </div>
          <div className="border-t border-[rgb(var(--border))] pt-2">
            <div className="text-xs font-semibold text-muted mb-1.5">Per-topic mastery</div>
            <div className="space-y-1">
              {topicMasteries.filter((tm) => tm.attempts > 0).map((tm) => (
                <div key={tm.topic} className="flex items-center gap-2 text-xs">
                  <span className="w-36 truncate text-muted">{tm.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-1.5 rounded-full bg-brand-500"
                      style={{ width: `${tm.mastery}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-semibold">{tm.mastery}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EvalHistory() {
  const attempts = useStore((s) => s.attempts);
  const rows = EVAL_TESTS.flatMap((def) =>
    evalSessions(attempts, def.mode).map((s) => ({ name: def.name, ...s }))
  ).sort((a, b) => b.finishedAt - a.finishedAt);

  if (!rows.length) return null;

  return (
    <Card>
      <SectionTitle title="Evaluation history" subtitle="Every sitting, reconstructed from your synced attempts" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted">
            <tr className="text-left border-b border-[rgb(var(--border))]">
              <th className="py-2 pr-3 font-semibold">Test</th>
              <th className="py-2 px-3 font-semibold">When</th>
              <th className="py-2 px-3 font-semibold text-right">Questions</th>
              <th className="py-2 px-3 font-semibold text-right">Accuracy</th>
              <th className="py-2 pl-3 font-semibold text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-[rgb(var(--border))]/50">
                <td className="py-2 pr-3 font-medium flex items-center gap-1.5"><History size={13} className="text-muted" />{r.name}</td>
                <td className="py-2 px-3 text-muted">{relativeDate(r.finishedAt)}</td>
                <td className="py-2 px-3 text-right">{r.correct}/{r.total}</td>
                <td className="py-2 px-3 text-right">{r.accuracy}%</td>
                <td className="py-2 pl-3 text-right font-display font-bold">{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border surface p-2">
      <div className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-lg bg-brand-500/10 text-brand-600">{icon}</div>
      <div className="font-display text-sm font-bold">{value}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}
