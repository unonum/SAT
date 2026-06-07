import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import QuestionRunner from '@/components/QuestionRunner';
import { Card, SectionTitle, Pill } from '@/components/ui';
import { EVAL_TESTS, buildEvalTest, evalSummary, evalSessions, type EvalTestDef } from '@/lib/evaluation';
import { relativeDate } from '@/lib/utils';
import {
  ClipboardCheck, Clock, ListChecks, Play, TrendingUp, History,
  Database, Trophy, ArrowLeft,
} from 'lucide-react';
import type { Question } from '@/lib/types';

export default function Evaluation() {
  const attempts = useStore((s) => s.attempts);
  const remoteEnabled = useStore((s) => s.remoteEnabled);
  const [active, setActive] = useState<{ def: EvalTestDef; questions: Question[] } | null>(null);

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

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Full Evaluations"
        subtitle="Three full-length, timed evaluation tests. Every answer is saved to your history for analysis."
      />

      <div className="flex items-center gap-2">
        <Pill tone={remoteEnabled ? 'success' : 'muted'}>
          <Database size={12} /> {remoteEnabled ? 'Synced to database' : 'Local mode'}
        </Pill>
        <span className="text-xs text-muted">No evaluation history is ever lost — results persist across devices.</span>
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
                  <Mini icon={<ListChecks size={14} />} label="Questions" value="20" />
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

                <button
                  className="btn-primary w-full py-2.5"
                  onClick={() => setActive({ def, questions: buildEvalTest(def.id) })}
                >
                  <Play size={16} /> {taken ? 'Retake test' : 'Start evaluation'}
                </button>
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
