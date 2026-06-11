import { useMemo, useState, useCallback } from 'react';
import { QUESTION_BANK } from '@/lib/questionBank';
import { TOPICS, TOPIC_MAP } from '@/lib/topics';
import { useStore } from '@/lib/store';
import { Card, SectionTitle, Pill, Stat } from '@/components/ui';
import type { Difficulty, Question, TopicId } from '@/lib/types';
import { Database, Search, Eye, BarChart3, CheckCircle2, Settings, AlertTriangle, ChevronRight, Activity, RefreshCw, FlaskConical, XCircle } from 'lucide-react';
import { computeWeaknessSignals } from '@/lib/weaknessAnalysis';
import { STUDENT_EMAILS, displayName } from '@/lib/auth';

const API = import.meta.env.VITE_API_BASE ?? '';

interface HealthResult {
  status: 'ok' | 'degraded';
  latencyMs: number;
  checks: Record<string, string>;
  ts: string;
}

function HealthTab() {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/health`);
      const d = await r.json() as HealthResult;
      setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error — could not reach /api/health');
    } finally {
      setLoading(false);
    }
  }, []);

  const statusIcon = (val: string) => {
    if (val === 'ok' || val === 'set') return '✅';
    if (val.startsWith('fail') || val === 'missing') return '❌';
    return '⚠️';
  };

  const checkRows: Array<{ key: string; label: string; desc: string }> = [
    { key: 'db',            label: 'Database ping',     desc: 'Turso libSQL SELECT 1' },
    { key: 'schema',        label: 'Schema ready',      desc: 'attempts + mock_sessions + rag tables' },
    { key: 'turso_url',     label: 'TURSO_DATABASE_URL',desc: 'Env var present' },
    { key: 'openai_key',    label: 'OPENAI_API_KEY',    desc: 'Env var present' },
    { key: 'anthropic_key', label: 'ANTHROPIC_API_KEY', desc: 'Env var present' },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle
          title="System Health"
          subtitle="Live check of DB connectivity, schema status, and environment variables."
        />
        <button
          className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          onClick={run}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Checking…' : result ? 'Re-check' : 'Run Health Check'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Overall status banner */}
          <div className={`rounded-xl px-5 py-4 flex items-center justify-between ${
            result.status === 'ok'
              ? 'bg-success/10 border border-success/25'
              : 'bg-danger/10 border border-danger/25'
          }`}>
            <div>
              <div className={`font-bold text-lg ${result.status === 'ok' ? 'text-success' : 'text-danger'}`}>
                {result.status === 'ok' ? '✅ All systems operational' : '❌ System degraded'}
              </div>
              <div className="text-xs text-muted mt-0.5">
                Checked at {new Date(result.ts).toLocaleTimeString()} · {result.latencyMs}ms
              </div>
            </div>
            <div className={`text-3xl font-black ${result.status === 'ok' ? 'text-success' : 'text-danger'}`}>
              {result.status === 'ok' ? '100%' : 'FAIL'}
            </div>
          </div>

          {/* Per-check table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted">
                  <th className="pb-2 pr-4">Check</th>
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Raw value</th>
                </tr>
              </thead>
              <tbody>
                {checkRows.map(({ key, label, desc }) => {
                  const val = result.checks[key] ?? '—';
                  return (
                    <tr key={key} className="border-b border-[rgb(var(--border))]/50">
                      <td className="py-3 pr-4 font-medium">{label}</td>
                      <td className="py-3 pr-4 text-muted text-xs">{desc}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          val === 'ok' || val === 'set'
                            ? 'bg-success/15 text-success'
                            : val === 'missing' || val.startsWith('fail')
                            ? 'bg-danger/15 text-danger'
                            : 'bg-warning/15 text-warning'
                        }`}>
                          {statusIcon(val)} {val === 'ok' || val === 'set' ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs text-muted">{val}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action hints for failures */}
          {result.status !== 'ok' && (
            <div className="rounded-xl border border-warning/25 bg-warning/5 px-4 py-3 space-y-1">
              <div className="text-sm font-semibold text-warning">Remediation hints</div>
              {result.checks.db?.startsWith('fail') && (
                <p className="text-xs text-muted">• DB: Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel environment variables.</p>
              )}
              {result.checks.openai_key === 'missing' && (
                <p className="text-xs text-muted">• OPENAI_API_KEY missing — question generation and embeddings will fail.</p>
              )}
              {result.checks.anthropic_key === 'missing' && (
                <p className="text-xs text-muted">• ANTHROPIC_API_KEY missing — Claude-generated questions will be skipped.</p>
              )}
              {result.checks.schema?.startsWith('fail') && (
                <p className="text-xs text-muted">• Schema creation failed — likely a DB connectivity issue (fix DB first).</p>
              )}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-12 text-muted">
          <Activity size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Click "Run Health Check" to verify all systems.</p>
          <p className="text-xs mt-1 opacity-60">Checks DB, schema tables, and API key env vars live.</p>
        </div>
      )}
    </Card>
  );
}

interface QATest  { name: string; pass: boolean; detail?: string }
interface QASuite { name: string; tests: QATest[] }
interface QAResult { suites: QASuite[]; summary: { pass: number; fail: number; total: number }; ts: string }

function QATab() {
  const [result, setResult] = useState<QAResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch(`${API}/api/qa-checks`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setResult(await r.json() as QAResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">QA Checks</h3>
          <p className="text-xs text-muted mt-0.5">Runs all automated integrity checks against the live question bank and core logic.</p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          <FlaskConical size={15} className={running ? 'animate-spin' : ''} />
          {running ? 'Running…' : 'Run All Checks'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <>
          {/* Summary bar */}
          <div className={`flex items-center gap-3 p-3 rounded-lg mb-5 text-sm font-semibold ${
            result.summary.fail === 0
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {result.summary.fail === 0
              ? <CheckCircle2 size={16} />
              : <XCircle size={16} />}
            {result.summary.pass} / {result.summary.total} passed
            {result.summary.fail > 0 && <span className="ml-1">— {result.summary.fail} failing</span>}
            <span className="ml-auto text-xs font-normal opacity-60">{new Date(result.ts).toLocaleTimeString()}</span>
          </div>

          {/* Suites */}
          <div className="space-y-4">
            {result.suites.map(suite => (
              <div key={suite.name}>
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">{suite.name}</p>
                <div className="divide-y divide-[rgb(var(--border))] rounded-lg border border-[rgb(var(--border))] overflow-hidden">
                  {suite.tests.map(t => (
                    <div key={t.name} className={`flex items-start gap-3 px-3 py-2 text-sm ${
                      t.pass ? '' : 'bg-red-50 dark:bg-red-900/10'
                    }`}>
                      {t.pass
                        ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-500" />
                        : <XCircle     size={14} className="mt-0.5 shrink-0 text-red-500" />}
                      <span className={t.pass ? '' : 'font-medium'}>{t.name}</span>
                      {t.detail && <span className="ml-auto text-xs text-red-600 dark:text-red-400 truncate max-w-xs">{t.detail}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!result && !running && !error && (
        <p className="text-sm text-muted text-center py-8">Click "Run All Checks" to validate the question bank and core logic.</p>
      )}
    </Card>
  );
}

export default function Admin() {
  const { attempts, mockSettings, setMockSettings, profiles } = useStore();
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState<string>('all');
  const [preview, setPreview] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'mock-settings' | 'weaknesses' | 'health' | 'qa'>('questions');
  const [pushedTopic, setPushedTopic] = useState<string | null>(null);

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
      <div className="flex flex-wrap gap-2 border-b border-[rgb(var(--border))]">
        {(['questions', 'mock-settings', 'weaknesses', 'health', 'qa'] as const).map((tab) => (
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
             tab === 'health' ? <><Activity size={14} className="inline mr-1" />System Health</> :
             tab === 'qa' ? <><FlaskConical size={14} className="inline mr-1" />QA Checks</> :
             <><AlertTriangle size={14} className="inline mr-1" />Weakness Report</>}
          </button>
        ))}
      </div>

      {activeTab === 'health' && <HealthTab />}
      {activeTab === 'qa' && <QATab />}

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
                              className={`h-8 px-2 text-xs flex items-center gap-1 rounded-lg border transition-colors ${pushedTopic === sig.topic ? 'border-success/40 bg-success/10 text-success' : 'btn-ghost'}`}
                              onClick={() => {
                                setMockSettings({
                                  difficultyFilter: {
                                    ...mockSettings.difficultyFilter,
                                    [sig.topic]: [sig.difficulty],
                                  },
                                });
                                setPushedTopic(sig.topic);
                                setTimeout(() => setPushedTopic(null), 2500);
                                setActiveTab('mock-settings');
                              }}
                            >
                              <ChevronRight size={12} />
                              {pushedTopic === sig.topic ? '✓ Pushed!' : 'Push to mock'}
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
