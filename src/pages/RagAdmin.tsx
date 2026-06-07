import { useState, useEffect, useRef } from 'react';
import { SectionTitle, Card, Pill } from '@/components/ui';
import {
  Upload, Loader2, CheckCircle2, XCircle, Trash2, ChevronDown, ChevronUp,
  RefreshCw, Database,
} from 'lucide-react';
import { ingestFileWithProgress, generateRagQuestions, fetchRagQuestions, deleteRagQuestion, listSources } from '@/lib/ragClient';
import type { Question } from '@/lib/types';
import { TOPICS } from '@/lib/topics';

type Tab = 'upload' | 'generate' | 'library';

interface FileEntry {
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  message?: string;
  chunks?: number;
  progress?: number; // 0–100
}

interface Source {
  source_name: string;
  source_type: string;
  chunk_count: number;
  created_at: number;
}

interface GenerateState {
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  section: 'Math' | 'Reading & Writing';
  loading: boolean;
  preview: Question[];
  error?: string;
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: 'pdf', jpg: 'image', jpeg: 'image', png: 'image',
    gif: 'image', webp: 'image', xlsx: 'excel', xls: 'excel',
    txt: 'text', md: 'markdown',
  };
  return map[ext] ?? 'text';
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is data:mime;base64,BASE64DATA
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Upload Tab ────────────────────────────────────────────────────────────────

function UploadTab() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSources = () => {
    setLoadingSources(true);
    listSources()
      .then(setSources)
      .finally(() => setLoadingSources(false));
  };

  useEffect(() => { loadSources(); }, []);

  const addFiles = (incoming: File[]) => {
    const entries: FileEntry[] = incoming.map((f) => ({ file: f, status: 'pending' }));
    setFiles((prev) => [...prev, ...entries]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleUpload = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;
      setFiles((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], status: 'processing', progress: 0, message: 'Reading file…' };
        return next;
      });
      try {
        const filetype = getFileType(files[i].file.name);
        const isPdf = filetype === 'pdf';
        // For PDFs: client-side extraction, no need to base64 the whole file
        const base64 = isPdf ? '' : await readAsBase64(files[i].file);
        setFiles((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], progress: 2, message: isPdf ? 'Extracting text from PDF…' : 'Uploading…' };
          return next;
        });
        const result = await ingestFileWithProgress(
          files[i].file.name,
          filetype,
          base64,
          (pct) => {
            setFiles((prev) => {
              const next = [...prev];
              const msg = pct < 20
                ? 'Extracting text from PDF…'
                : pct < 90
                ? `Uploading… ${pct}%`
                : 'Embedding & storing on server…';
              next[i] = { ...next[i], progress: pct, message: msg };
              return next;
            });
          },
          files[i].file
        );
        setFiles((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: 'done', progress: 100, chunks: result.chunks, message: `✓ ${result.chunks} chunks indexed` };
          return next;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setFiles((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: 'error', progress: undefined, message: msg };
          return next;
        });
      }
    }
    loadSources();
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? 'border-brand-500 bg-brand-500/5' : 'border-[rgb(var(--border))] hover:border-brand-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <Upload className="mx-auto mb-3 text-muted" size={32} />
        <p className="font-medium">Drag & drop files here or click to browse</p>
        <p className="text-xs text-muted mt-1">Accepted: .pdf .jpg .jpeg .png .xlsx .xls .txt .md</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.txt,.md,.webp,.gif"
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <Card>
          <div className="space-y-2">
            {files.map((entry, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-3 text-sm">
                  {entry.status === 'pending' && <div className="h-4 w-4 rounded-full bg-slate-300 flex-shrink-0" />}
                  {entry.status === 'processing' && <Loader2 size={16} className="animate-spin text-brand-500 flex-shrink-0" />}
                  {entry.status === 'done' && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />}
                  {entry.status === 'error' && <XCircle size={16} className="text-red-500 flex-shrink-0" />}
                  <span className="font-medium truncate max-w-xs">{entry.file.name}</span>
                  <span className="text-muted text-xs flex-shrink-0">
                    ({entry.file.size >= 1024 * 1024
                      ? `${(entry.file.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${(entry.file.size / 1024).toFixed(0)} KB`})
                  </span>
                  {entry.message && (
                    <span className={`text-xs ml-auto flex-shrink-0 ${entry.status === 'error' ? 'text-red-500' : 'text-muted'}`}>
                      {entry.message}
                    </span>
                  )}
                </div>
                {entry.status === 'processing' && entry.progress !== undefined && (
                  <div className="ml-7 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          entry.progress >= 90 ? 'bg-amber-400 animate-pulse' : 'bg-brand-500'
                        }`}
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted w-8 text-right">{entry.progress}%</span>
                  </div>
                )}
                {entry.status === 'done' && (
                  <div className="ml-7">
                    <div className="flex-1 h-1.5 rounded-full bg-green-200 dark:bg-green-900">
                      <div className="h-full w-full rounded-full bg-green-500" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {pendingCount > 0 && (
            <button className="btn-primary mt-4" onClick={handleUpload}>
              <Upload size={14} /> Upload & Index ({pendingCount} file{pendingCount > 1 ? 's' : ''})
            </button>
          )}
        </Card>
      )}

      {/* Sources list */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Indexed Sources</h3>
          <button onClick={loadSources} className="btn-ghost text-xs gap-1">
            <RefreshCw size={12} className={loadingSources ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
        {sources.length === 0 ? (
          <p className="text-muted text-sm">No sources indexed yet.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.source_name} className="flex items-center gap-3 text-sm border rounded-xl px-3 py-2 surface">
                <Database size={14} className="text-muted" />
                <span className="font-medium truncate">{s.source_name}</span>
                <Pill tone="muted">{s.source_type}</Pill>
                <span className="ml-auto text-xs text-muted">{s.chunk_count} chunks</span>
                <span className="text-xs text-muted">{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Generate Tab ──────────────────────────────────────────────────────────────

function GenerateTab() {
  const [states, setStates] = useState<Record<string, GenerateState>>(() =>
    Object.fromEntries(
      TOPICS.map((t) => [
        t.id,
        { topicId: t.id, difficulty: 'medium', count: 5, section: t.section, loading: false, preview: [] },
      ])
    )
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [ragCounts, setRagCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchRagQuestions().then((qs) => {
      const counts: Record<string, number> = {};
      for (const q of qs) {
        counts[q.topic] = (counts[q.topic] ?? 0) + 1;
      }
      setRagCounts(counts);
    }).catch(() => {});
  }, []);

  const updateState = (topicId: string, patch: Partial<GenerateState>) => {
    setStates((prev) => ({ ...prev, [topicId]: { ...prev[topicId], ...patch } }));
  };

  const handleGenerate = async (topicId: string) => {
    const s = states[topicId];
    updateState(topicId, { loading: true, error: undefined, preview: [] });
    try {
      const qs = await generateRagQuestions(topicId, s.difficulty, s.count, s.section);
      updateState(topicId, { loading: false, preview: qs });
      setExpanded((prev) => ({ ...prev, [topicId]: true }));
      setRagCounts((prev) => ({ ...prev, [topicId]: (prev[topicId] ?? 0) + qs.length }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateState(topicId, { loading: false, error: msg });
    }
  };

  return (
    <div className="space-y-4">
      {TOPICS.map((topic) => {
        const s = states[topic.id];
        const isExpanded = expanded[topic.id];
        return (
          <Card key={topic.id} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold">{topic.name}</h3>
                <p className="text-xs text-muted">{topic.section}</p>
                {(ragCounts[topic.id] ?? 0) > 0 && (
                  <Pill tone="brand" className="mt-1">{ragCounts[topic.id]} RAG questions in library</Pill>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Difficulty */}
                <select
                  className="text-xs border rounded-lg px-2 py-1 bg-transparent"
                  value={s.difficulty}
                  onChange={(e) => updateState(topic.id, { difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                {/* Section */}
                <select
                  className="text-xs border rounded-lg px-2 py-1 bg-transparent"
                  value={s.section}
                  onChange={(e) => updateState(topic.id, { section: e.target.value as 'Math' | 'Reading & Writing' })}
                >
                  <option value="Math">Math</option>
                  <option value="Reading & Writing">Reading & Writing</option>
                </select>
                {/* Count slider */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted">Count:</span>
                  <input
                    type="range" min={1} max={10} step={1}
                    value={s.count}
                    onChange={(e) => updateState(topic.id, { count: Number(e.target.value) })}
                    className="w-20"
                  />
                  <span className="w-4 text-center">{s.count}</span>
                </div>
                {/* Generate button */}
                <button
                  className="btn-primary text-xs gap-1"
                  onClick={() => handleGenerate(topic.id)}
                  disabled={s.loading}
                >
                  {s.loading ? (
                    <><Loader2 size={12} className="animate-spin" /> Generating…</>
                  ) : (
                    'Generate Questions'
                  )}
                </button>
              </div>
            </div>

            {s.loading && (
              <p className="text-xs text-muted animate-pulse">
                Querying knowledge base… generating with GPT-4o + Claude…
              </p>
            )}

            {s.error && (
              <Pill tone="danger">{s.error}</Pill>
            )}

            {s.preview.length > 0 && (
              <div>
                <button
                  className="btn-ghost text-xs gap-1 mb-2"
                  onClick={() => setExpanded((prev) => ({ ...prev, [topic.id]: !isExpanded }))}
                >
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {s.preview.length} questions generated
                  {isExpanded ? ' — click to hide' : ' — click to preview'}
                </button>
                {isExpanded && (
                  <div className="space-y-2 mt-2">
                    {s.preview.map((q) => (
                      <div key={q.id} className="text-xs border rounded-xl p-3 surface">
                        <p className="font-medium">{q.prompt}</p>
                        <div className="mt-1 flex gap-2 flex-wrap">
                          {q.choices.map((c) => (
                            <span
                              key={c.id}
                              className={`px-1.5 py-0.5 rounded ${c.id === q.correct ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'text-muted'}`}
                            >
                              {c.id}: {c.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted">Questions saved to library automatically.</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── Library Tab ───────────────────────────────────────────────────────────────

function LibraryTab() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchRagQuestions(filterTopic || undefined, filterDiff || undefined)
      .then(setQuestions)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterTopic, filterDiff]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this RAG question?')) return;
    setDeleting(id);
    try {
      await deleteRagQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <select
          className="text-xs border rounded-lg px-2 py-1 bg-transparent"
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
        >
          <option value="">All Topics</option>
          {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select
          className="text-xs border rounded-lg px-2 py-1 bg-transparent"
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value)}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button className="btn-ghost text-xs gap-1" onClick={load}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-muted" size={24} />
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <p className="text-muted text-sm text-center py-6">No RAG questions found. Generate some in the Generate tab.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted border-b border-[rgb(var(--border))]">
                <th className="pb-2 pr-3">ID</th>
                <th className="pb-2 pr-3">Topic</th>
                <th className="pb-2 pr-3">Difficulty</th>
                <th className="pb-2 pr-3 max-w-[250px]">Prompt</th>
                <th className="pb-2 pr-3">Source Chunk</th>
                <th className="pb-2 pr-3">Created</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-[rgb(var(--border))] last:border-0">
                  <td className="py-2 pr-3 font-mono text-[10px] text-muted max-w-[100px] truncate">{q.id}</td>
                  <td className="py-2 pr-3">{q.topic}</td>
                  <td className="py-2 pr-3 capitalize">{q.difficulty}</td>
                  <td className="py-2 pr-3 max-w-[250px] truncate">{q.prompt}</td>
                  <td className="py-2 pr-3 font-mono text-[10px] text-muted truncate max-w-[80px]">
                    {q.sourceChunk ?? '—'}
                  </td>
                  <td className="py-2 pr-3 text-muted whitespace-nowrap">
                    {/* created_at not on Question type, approximate */}
                    {q.id.match(/\d{13}/)
                      ? new Date(parseInt(q.id.match(/\d{13}/)![0])).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="py-2">
                    <button
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(q.id)}
                      disabled={deleting === q.id}
                    >
                      {deleting === q.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RagAdmin() {
  const [tab, setTab] = useState<Tab>('upload');

  return (
    <div className="space-y-6">
      <SectionTitle title="Question Ingestion" subtitle="Upload source material, generate RAG questions, and manage the library." />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[rgb(var(--border))]">
        {(['upload', 'generate', 'library'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'upload' && <UploadTab />}
      {tab === 'generate' && <GenerateTab />}
      {tab === 'library' && <LibraryTab />}
    </div>
  );
}
