import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card, SectionTitle } from '@/components/ui';
import { MockReview } from '@/components/MockRunner';
import type { StoredSession } from '@/components/MockRunner';
import type { Question } from '@/lib/types';
import { ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

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

function estimateScore(correct: number, total: number) {
  if (total === 0) return 0;
  return Math.round(200 + (correct / total) * 600);
}

export default function MockHistory() {
  const { user } = useStore();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewExpanded, setReviewExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ session: SessionSummary; questions: Question[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
    if (expanded === session.id) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(session.id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const r = await fetch(`${API}/api/mock-sessions?email=${encodeURIComponent(user!.email)}&id=${session.id}`);
      const d = await r.json();
      const full = d.session as (SessionSummary & { questions_json: string }) | null;
      if (full) {
        const questions: Question[] = JSON.parse(full.questions_json || '[]');
        setDetail({ session: full, questions });
      }
    } catch { /* ignore */ }
    finally { setDetailLoading(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionTitle title="Mock Test History" subtitle="Review all your past full-length SAT simulations." />
        <Card><p className="text-muted text-sm text-center py-8">Loading sessions…</p></Card>
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="space-y-6">
        <SectionTitle title="Mock Test History" subtitle="Review all your past full-length SAT simulations." />
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

  return (
    <div className="space-y-6">
      <SectionTitle title="Mock Test History" subtitle="Review all your past full-length SAT simulations." />

      <div className="space-y-3">
        {sessions.map((s) => {
          const rwScore = estimateScore(s.rw_correct, s.rw_total);
          const mathScore = estimateScore(s.math_correct, s.math_total);
          const total = s.rw_correct + s.math_correct;
          const totalQ = s.rw_total + s.math_total;
          const totalScore = estimateScore(total, totalQ);
          const pct = totalQ > 0 ? Math.round((total / totalQ) * 100) : 0;
          const isComplete = s.status === 'complete';
          const isOpen = expanded === s.id;

          return (
            <Card key={s.id} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() => loadDetail(s)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex-none rounded-xl p-2.5 ${isComplete ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {isComplete ? <CheckCircle size={18} /> : <RotateCcw size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{s.date}</div>
                      <div className="text-xs text-muted mt-0.5">
                        {isComplete ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={11} className="text-success" /> Completed
                            {s.completed_at && ` · ${new Date(s.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-warning">
                            <Clock size={11} /> In Progress — phase: {s.phase}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-none">
                    {isComplete && totalQ > 0 ? (
                      <>
                        <div className="text-center hidden sm:block">
                          <div className="text-xs text-muted">R&W</div>
                          <div className="font-bold text-sm">{rwScore}</div>
                        </div>
                        <div className="text-center hidden sm:block">
                          <div className="text-xs text-muted">Math</div>
                          <div className="font-bold text-sm">{mathScore}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted">Total</div>
                          <div className={`font-bold text-lg ${pct >= 70 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-danger'}`}>
                            {totalScore}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted">
                        {s.rw_idx + s.math_idx}/{s.rw_total + s.math_total || '?'} answered
                      </div>
                    )}
                    {isOpen ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  {detailLoading ? (
                    <p className="text-sm text-muted text-center py-6">Loading questions…</p>
                  ) : detail?.session.id === s.id && detail.questions.length > 0 ? (
                    <MockReview
                      rwQs={detail.questions.filter((q) => q.section === 'Reading & Writing')}
                      mathQs={detail.questions.filter((q) => q.section === 'Math')}
                      answers={JSON.parse(detail.session.answers_json || '{}')}
                      expandedId={reviewExpanded}
                      setExpandedId={setReviewExpanded}
                    />
                  ) : detail?.session.id === s.id && detail.questions.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted">
                      <AlertCircle size={20} className="mx-auto mb-2" />
                      Question details not available for this session.
                    </div>
                  ) : null}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
