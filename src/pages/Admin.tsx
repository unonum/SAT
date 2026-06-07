import { useMemo, useState } from 'react';
import { QUESTION_BANK } from '@/lib/questionBank';
import { TOPICS, TOPIC_MAP } from '@/lib/topics';
import { useStore } from '@/lib/store';
import { Card, SectionTitle, Pill, Stat } from '@/components/ui';
import type { Difficulty, Question, TopicId } from '@/lib/types';
import { Database, Search, Eye, BarChart3, CheckCircle2, Settings, AlertTriangle, ChevronRight } from 'lucide-react';
import { computeWeaknessSignals } from '@/lib/weaknessAnalysis';
import { STUDENT_EMAILS, displayName } from '@/lib/auth';

export default function Admin() {
  const { attempts, mockSettings, setMockSettings, profiles } = useStore();
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState<string>('all');
  const [preview, setPreview] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'mock-settings' | 'weaknesses'>('questions');

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

  // Per-topic question counts by difficulty
  const topicDiffCounts = useMemo(() => {
    const map: Record<string, Record<Difficulty, number>> = {};
    for (const t of TOPICS) {
      map[t.id] = { easy: 0, medium: 0, hard: 0 };
      for (const q of QUESTION_BANK) {
        if (q.topic === t.id) map[t.id][q.difficulty]++;
      }
    }
    return map;
  }, []);

  const toggleDiff = (topicId: TopicId, diff: Difficulty) => {
    const current = mockSettings.difficultyFilter[topicId] ?? ['easy', 'medium', 'hard'];
    const next = current.includes(diff) ? current.filter((d) => d !== diff) : [...current, diff];
    setMockSettings({ difficultyFilter: { ...mockSettings.difficultyFilter, [topicId]: next } });
  };

  const isDiffEnabled = (topicId: TopicId, diff: Difficulty) => {
    const filter = mockSettings.difficultyFilter[topicId];
    if (!filter) return mockSettings.globalDifficulty.includes(diff);
    return filter.includes(diff);
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Question Bank Admin" subtitle="Manage and inspect the SAT question library." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total questions" value={QUESTION_BANK.length} icon={<Database size={20} />} />
        <Stat label="Skill areas" value={TOPICS.length} accent="accent" icon={<BarChart3 size={20} />} />
        <Stat label="Total attempts logged" value={attempts.length} accent="success" icon={<CheckCircle2 size={20} />} />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-[rgb(var(--border))]">
        {(['questions', 'mock-settings', 'weaknesses'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {tab === 'questions' ? <><Database size={14} className="inline mr-1" />Question Bank</> :
             tab === 'mock-settings' ? <><Settings size={14} className="inline mr-1" />Mock Settings</> :
             <><AlertTriangle size={14} className="inline mr-1" />Weakness Report</>}
          </button>
        ))}
      </div>

      {activeTab === 'mock-settings' && (
        <Card>
          <SectionTitle title="Mock Test Difficulty Settings" subtitle="Control which difficulty levels appear per topic in mock tests." />
          <div className="space-y-3 mt-2">
            {TOPICS.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 py-2 border-b border-[rgb(var(--border))]/50 last:border-0">
                <span className="w-52 font-medium text-sm">{t.name}</span>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                    const enabled = isDiffEnabled(t.id, diff);
                    const count = topicDiffCounts[t.id]?.[diff] ?? 0;
                    return (
                      <button
                        key={diff}
                        onClick={() => toggleDiff(t.id, diff)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                          enabled
                            ? diff === 'easy' ? 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300'
                            : diff === 'medium' ? 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/40 dark:border-amber-600 dark:text-amber-300'
                            : 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/40 dark:border-red-600 dark:text-red-300'
                            : 'bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-600'
                        }`}
                      >
                        {diff} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted">
            Toggles apply immediately. Mock tests started after saving will use these filters.
          </div>
        </Card>
      )}

      {activeTab === 'weaknesses' && (
        <Card>
          <SectionTitle title="Student Weakness Report" subtitle="Aggregated wrong-answer patterns across all students." />
          {STUDENT_EMAILS.map((email) => {
            const pd = profiles[email];
            if (!pd) return null;
            const signals = computeWeaknessSignals(pd.attempts);
            if (!signals.length) return (
              <div key={email} className="py-3 border-b border-[rgb(var(--border))]/50">
                <span className="font-semibold">{displayName(email)}</span>
                <span className="ml-2 text-xs text-muted">No wrong answers recorded.</span>
              </div>
            );
            return (
              <div key={email} className="mb-6">
                <h3 className="font-display font-bold mb-2">{displayName(email)}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-muted">
                        <th className="pb-2 pr-3">Topic</th>
                        <th className="pb-2 pr-3">Difficulty</th>
                        <th className="pb-2 pr-3">Misses</th>
                        <th className="pb-2 pr-3">Suggested Training</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {signals.slice(0, 8).map((sig, i) => (
                        <tr key={i} className="border-b border-[rgb(var(--border))]/50">
                          <td className="py-2 pr-3 font-medium">{TOPIC_MAP[sig.topic]?.name ?? sig.topic}</td>
                          <td className="py-2 pr-3">
                            <Pill tone={sig.difficulty === 'hard' ? 'danger' : sig.difficulty === 'medium' ? 'warning' : 'success'}>
                              {sig.difficulty}
                            </Pill>
                          </td>
                          <td className="py-2 pr-3 font-bold text-danger">{sig.count}</td>
                          <td className="py-2 pr-3 text-muted text-xs">{sig.suggestedAction}</td>
                          <td className="py-2">
                            <button
                              className="btn-ghost h-8 px-2 text-xs flex items-center gap-1"
                              onClick={() => setMockSettings({
                                difficultyFilter: {
                                  ...mockSettings.difficultyFilter,
                                  [sig.topic]: [sig.difficulty],
                                },
                              })}
                            >
                              <ChevronRight size={12} /> Push to mock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {activeTab === 'questions' && <Card>
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
      </Card>}

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
