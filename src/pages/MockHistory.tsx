import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card, SectionTitle } from '@/components/ui';
import { MockReview } from '@/components/MockRunner';
import type { StoredSession } from '@/components/MockRunner';
import type { Question } from '@/lib/types';
import { ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, RotateCcw, Trophy } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE ?? '';

interface SessionSummary extends Omit<StoredSession, 'answers_json'> {
  user_email: string;
  date: string;
  status: string;
  answers_json: string;
  rw_correct: number;
  rw_total: number;
  math_correct: number;
  math_total: number;
  completed_at: number | null;
}

interface DateGroup {
  date: string;
  sessions: SessionSummary[];
  bestSession: SessionSummary | null; // latest fully completed = grading target
}

function estimateScore(correct: number, total: number) {
  if (total === 0) return 0;
  return Math.round(200 + (correct / total) * 600);
}

function sessionScore(s: SessionSummary) {
  const total = s.rw_total + s.math_total;
  if (total === 0) return 0;
  return estimateScore(s.rw_correct + s.math_correct, total);
}

function groupByDate(sessions: SessionSummary[]): DateGroup[] {
  const map = new Map<string, SessionSummary[]>();
  for (const s of sessions) {
    (map.get(s.date) ?? map.set(s.date, []).get(s.date)!).push(s);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, slist]) => {
      // Sort within day by started_at ascending (attempt 1, 2, 3)
      const sorted = [...slist].sort((a, b) => (a.started_at ?? 0) - (b.started_at ?? 0));
      // Best = latest completed (most recent attempt is the definitive score)
      const completed = sorted.filter((s) => s.status === 'complete');
      const bestSession = completed.length > 0 ? completed[completed.length - 1] : null;
      return { date, sessions: sorted, bestSession };
    });
}

export default function MockHistory() {
  const { user } = useStore();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewExpanded, setReviewExpanded] = useState<string | null>(null);
  const [detailMap, setDetailMap] = useState<Record<string, { session: SessionSummary; questions: Question[] }>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetch(`${API}/api/mock-sessions?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.email]);

  const loadDetail = async (session: SessionSummary) => {
    if (expandedId === session.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(session.id);
    if (detailMap[session.id]) return;
    setDetailLoading(session.id);
    try {
      const r = await fetch(`${API}/api/mock-sessions?email=${encodeURIComponent(user!.email)}&id=${session.id}`);
      const d = await r.json();
      const full = d.session as (SessionSummary & { questions_json: string }) | null;
      if (full) {
        const questions: Question[] = JSON.parse(full.questions_json || '[]');
        setDetailMap((prev) => ({ ...prev, [session.id]: { session: full, questions } }));
      }
    } catch { /* ignore */ }
    finally { setDetailLoading(null); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionTitle title="Mock Test History" subtitle="All past full-length SAT simulations, grouped by day." />
        <Card><p className="text-muted text-sm text-center py-8">Loading sessions…</p></Card>
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="space-y-6">
        <SectionTitle title="Mock Test History" subtitle="All past full-length SAT simulations, grouped by day." />
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold">No mock tests yet</p>
            <p className="text-muted text-sm mt-1">Complete your first full-length SAT simulation to see history here.</p>
            <a href="/app/mock" className="btn-primary inline-flex mt-4">Start Today's Mock</a>
          </div>
        </Card>
      </div>
    );
  }

  const groups = groupByDate(sessions);

  return (
    <div className="space-y-6">
      <SectionTitle title="Mock Test History" subtitle="All past full-length SAT simulations. Latest completed attempt = official daily score." />

      <div className="space-y-4">
        {groups.map((group) => {
          const isDateOpen = expandedDate === group.date;
          const bestScore = group.bestSession ? sessionScore(group.bestSession) : null;
          const bestPct = group.bestSession
            ? Math.round(((group.bestSession.rw_correct + group.bestSession.math_correct) / Math.max(1, group.bestSession.rw_total + group.bestSession.math_total)) * 100)
            : 0;

          return (
            <Card key={group.date} className="overflow-hidden">
              {/* Date header row */}
              <button className="w-full text-left" onClick={() => setExpandedDate(isDateOpen ? null : group.date)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex-none rounded-xl p-2.5 ${group.bestSession ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {group.bestSession ? <CheckCircle size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{group.date}</div>
                      <div className="text-xs text-muted mt-0.5">
                        {group.sessions.length} attempt{group.sessions.length !== 1 ? 's' : ''}
                        {group.bestSession && ' · Latest completed = grading'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-none">
                    {bestScore ? (
                      <div className="text-center">
                        <div className="text-xs text-muted flex items-center gap-1"><Trophy size={10} /> Best</div>
                        <div className={`font-bold text-lg ${bestPct >= 70 ? 'text-success' : bestPct >= 50 ? 'text-warning' : 'text-danger'}`}>
                          {bestScore}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">In progress</span>
                    )}
                    {isDateOpen ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </div>
                </div>
              </button>

              {/* Attempts list for this date */}
              {isDateOpen && (
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  {group.sessions.map((s, attemptIdx) => {
                    const total = s.rw_correct + s.math_correct;
                    const totalQ = s.rw_total + s.math_total;
                    const pct = totalQ > 0 ? Math.round((total / totalQ) * 100) : 0;
                    const score = estimateScore(total, totalQ);
                    const isComplete = s.status === 'complete';
                    const isOpen = expandedId === s.id;
                    const isGraded = group.bestSession?.id === s.id;

                    return (
                      <div key={s.id} className={`rounded-xl border ${isGraded ? 'border-success/30 bg-success/5' : 'border-white/10'} overflow-hidden`}>
                        <button className="w-full text-left px-4 py-3" onClick={() => loadDetail(s)}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`flex-none rounded-lg p-1.5 ${isComplete ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                {isComplete ? <CheckCircle size={14} /> : <RotateCcw size={14} />}
                              </div>
                              <div>
                                <div className="font-medium text-sm flex items-center gap-2">
                                  Attempt {attemptIdx + 1}
                                  {isGraded && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-success/15 text-success px-2 py-0.5 rounded-full font-semibold">
                                      <Trophy size={9} /> Official score
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted">
                                  {isComplete
                                    ? `R&W ${s.rw_correct}/${s.rw_total} · Math ${s.math_correct}/${s.math_total}`
                                    : `In progress · phase: ${s.phase}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-none">
                              {isComplete && totalQ > 0 ? (
                                <span className={`font-bold text-base ${pct >= 70 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-danger'}`}>
                                  {score} <span className="text-xs font-normal text-muted">({pct}%)</span>
                                </span>
                              ) : null}
                              {isOpen ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                            </div>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-white/10 px-4 py-4">
                            {detailLoading === s.id ? (
                              <p className="text-sm text-muted text-center py-4">Loading questions…</p>
                            ) : detailMap[s.id] && detailMap[s.id].questions.length > 0 ? (
                              <MockReview
                                rwQs={detailMap[s.id].questions.filter((q) => q.section === 'Reading & Writing')}
                                mathQs={detailMap[s.id].questions.filter((q) => q.section === 'Math')}
                                answers={JSON.parse(detailMap[s.id].session.answers_json || '{}')}
                                expandedId={reviewExpanded}
                                setExpandedId={setReviewExpanded}
                              />
                            ) : detailMap[s.id] ? (
                              <div className="text-center py-4 text-sm text-muted">
                                <AlertCircle size={18} className="mx-auto mb-2" />
                                Question details not available for this session.
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
