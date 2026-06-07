import { useMemo, useState } from 'react';
import { QUESTION_BANK } from '@/lib/questionBank';
import { TOPICS, TOPIC_MAP } from '@/lib/topics';
import { useStore } from '@/lib/store';
import { Card, SectionTitle, Pill, Stat } from '@/components/ui';
import type { Question } from '@/lib/types';
import { Database, Search, Eye, BarChart3, CheckCircle2 } from 'lucide-react';

export default function Admin() {
  const { attempts } = useStore();
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState<string>('all');
  const [preview, setPreview] = useState<Question | null>(null);

  const filtered = useMemo(
    () =>
      QUESTION_BANK.filter(
        (q) =>
          (topic === 'all' || q.topic === topic) &&
          (q.prompt.toLowerCase().includes(search.toLowerCase()) ||
            q.subtopic.toLowerCase().includes(search.toLowerCase()))
      ),
    [search, topic]
  );

  // per-question stats
  const stats = (qid: string) => {
    const a = attempts.filter((x) => x.questionId === qid);
    if (!a.length) return null;
    return Math.round((a.filter((x) => x.correct).length / a.length) * 100);
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Question Bank Admin" subtitle="Manage and inspect the SAT question library." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total questions" value={QUESTION_BANK.length} icon={<Database size={20} />} />
        <Stat label="Skill areas" value={TOPICS.length} accent="accent" icon={<BarChart3 size={20} />} />
        <Stat label="Total attempts logged" value={attempts.length} accent="success" icon={<CheckCircle2 size={20} />} />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-3 text-muted" />
            <input
              className="input pl-10"
              placeholder="Search questions or subtopics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-auto" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="all">All topics</option>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b surface text-left text-xs uppercase text-muted">
                <th className="pb-2 pr-3">ID</th>
                <th className="pb-2 pr-3">Topic</th>
                <th className="pb-2 pr-3">Subtopic</th>
                <th className="pb-2 pr-3">Difficulty</th>
                <th className="pb-2 pr-3">Correct rate</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => {
                const rate = stats(q.id);
                return (
                  <tr key={q.id} className="border-b surface/50 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 pr-3 font-mono text-xs">{q.id}</td>
                    <td className="py-2.5 pr-3">{TOPIC_MAP[q.topic].name}</td>
                    <td className="py-2.5 pr-3 text-muted">{q.subtopic}</td>
                    <td className="py-2.5 pr-3">
                      <Pill tone={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>
                        {q.difficulty}
                      </Pill>
                    </td>
                    <td className="py-2.5 pr-3">{rate === null ? <span className="text-muted">—</span> : `${rate}%`}</td>
                    <td className="py-2.5">
                      <button className="btn-ghost h-8 px-2 text-xs" onClick={() => setPreview(q)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setPreview(null)}>
          <Card className="max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-pop" >
            <div onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold">Question preview — {preview.id}</h3>
              <button className="btn-ghost h-8 px-3 text-xs" onClick={() => setPreview(null)}>Close</button>
            </div>
            {preview.passage && <div className="mb-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">{preview.passage}</div>}
            <p className="font-medium mb-3">{preview.prompt}</p>
            <div className="space-y-1.5 mb-4">
              {preview.choices.map((c) => (
                <div key={c.id} className={`rounded-lg border surface p-2.5 text-sm ${c.id === preview.correct ? 'border-success bg-success/10' : ''}`}>
                  <b>{c.id}.</b> {c.text} {c.id === preview.correct && <span className="text-success text-xs">✓ correct</span>}
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-brand-500/5 p-3 text-sm space-y-1.5">
              <div><b>Why correct:</b> {preview.explanation.correctWhy}</div>
              <div><b>Strategy:</b> {preview.explanation.fastStrategy}</div>
              <div><b>Trap note:</b> {preview.explanation.trapNote}</div>
            </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
