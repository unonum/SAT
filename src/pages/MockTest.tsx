import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import MockRunner from '@/components/MockRunner';
import type { StoredSession } from '@/components/MockRunner';
import { Card, SectionTitle, Pill } from '@/components/ui';
import {
  FileText, Clock, Target, Play, Rocket, BookOpen, Calculator,
  CheckCircle, RotateCcw, History, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { benchmarkBaseline } from '@/lib/evaluation';
import { selectMockQuestions } from '@/lib/adaptive';
import type { Question, MockSettings } from '@/lib/types';
import { createNovelTestSession, fetchRagQuestions } from '@/lib/ragClient';

const RW_COUNT = 54;
const MATH_COUNT = 44;
const TOTAL_MOCK = RW_COUNT + MATH_COUNT;
const MAX_ATTEMPTS = 3;
// Warn admin if remaining pool after excluding previous-attempt questions is below this
const POOL_WARN_THRESHOLD = 60;
const DEFAULT_SETTINGS: MockSettings = { difficultyFilter: {}, globalDifficulty: ['easy', 'medium', 'hard'] };
const API = import.meta.env.VITE_API_BASE ?? '';

type DaySession = StoredSession & { status: string; date: string; questions_json: string; user_email: string };

// 'checking' → loading; 'none' → no session today; 'resume' → in-progress exists;
// 'retry' → completed < MAX_ATTEMPTS; 'maxed' → all 3 done
type SessionState = 'checking' | 'none' | 'resume' | 'retry' | 'maxed';

export default function MockTest() {
  const { attempts, user, mockSettings } = useStore();
  const remoteEnabled = useStore((s) => s.remoteEnabled);
  const baseline = benchmarkBaseline(attempts);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [storedSession, setStoredSession] = useState<StoredSession | null>(null);
  const [todaySessions, setTodaySessions] = useState<DaySession[]>([]);
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [error, setError] = useState('');
  const [storedRag, setStoredRag] = useState<Question[]>([]);
  const [poolWarning, setPoolWarning] = useState('');
  const generatingRef = useRef(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!remoteEnabled) { setSessionState('none'); return; }
    fetchRagQuestions().then(setStoredRag).catch(() => {});
  }, [remoteEnabled]);

  useEffect(() => {
    if (!remoteEnabled || !user?.email) { setSessionState('none'); return; }
    fetch(`${API}/api/mock-sessions?email=${encodeURIComponent(user.email)}&date=${today}&all=true`)
      .then((r) => r.json())
      .then((d) => {
        const sessions: DaySession[] = d.sessions ?? [];
        setTodaySessions(sessions);

        const completedToday = sessions.filter((s) => s.status === 'complete');
        const inProgress = sessions.find((s) => s.status !== 'complete');

        if (inProgress) {
          // Validate stored questions
          let qs: Question[] = [];
          try { qs = JSON.parse(inProgress.questions_json || '[]'); } catch { /* fall through */ }
          if (Array.isArray(qs) && qs.length >= 2 && qs[0]?.prompt) {
            setStoredRag((prev) => {
              const ex = new Set(prev.map((q) => q.id));
              return [...prev, ...qs.filter((q) => !ex.has(q.id))];
            });
            setStoredSession(inProgress);
            setSessionState('resume');
          } else {
            setSessionState(completedToday.length >= MAX_ATTEMPTS ? 'maxed' : completedToday.length > 0 ? 'retry' : 'none');
          }
          return;
        }

        if (completedToday.length >= MAX_ATTEMPTS) {
          setSessionState('maxed');
        } else if (completedToday.length > 0) {
          setSessionState('retry');
        } else {
          setSessionState('none');
        }
      })
      .catch(() => setSessionState('none'));
  }, [remoteEnabled, user?.email, today]);

  /** IDs of every question used in today's completed attempts. */
  const usedTodayIds = (): Set<string> => {
    const ids = new Set<string>();
    for (const s of todaySessions) {
      if (s.status !== 'complete') continue;
      try {
        const qs: Question[] = JSON.parse(s.questions_json || '[]');
        qs.forEach((q) => ids.add(q.id));
      } catch { /* ignore */ }
    }
    return ids;
  };

  const buildQuestions = (excludeIds: Set<string>): Question[] | null => {
    // excludeIds = question IDs used in *today's* earlier attempts (hard exclude — no repeats same day)
    // globalSeen = all questions the student has ever answered (soft exclude — prefer fresh, but reuse if pool is thin)
    const globalSeen = new Set(attempts.map((a) => a.questionId));
    const settings = mockSettings ?? DEFAULT_SETTINGS;

    // RAG questions: apply both hard (today) and soft (global) exclusion to maximise novelty
    const ragRW = storedRag
      .filter((q) => q.section === 'Reading & Writing' && q.ragGenerated)
      .filter((q) => !excludeIds.has(q.id) && !globalSeen.has(q.id));
    const ragMath = storedRag
      .filter((q) => q.section === 'Math' && q.ragGenerated)
      .filter((q) => !excludeIds.has(q.id) && !globalSeen.has(q.id));

    // Static fallback: only apply hard (today) exclusion — allow reuse of static bank across sessions
    // so the pool never runs dry just because the student took previous mocks
    const staticAll = selectMockQuestions(attempts, TOTAL_MOCK, settings, storedRag);
    const staticRW = staticAll.filter((q) => q.section === 'Reading & Writing' && !excludeIds.has(q.id));
    const staticMath = staticAll.filter((q) => q.section === 'Math' && !excludeIds.has(q.id));

    // Check pool health and warn admin if thin
    const availableRW = new Set([...ragRW, ...staticRW].map((q) => q.id)).size;
    const availableMath = new Set([...ragMath, ...staticMath].map((q) => q.id)).size;
    const totalAvailable = availableRW + availableMath;
    if (totalAvailable < POOL_WARN_THRESHOLD) {
      setPoolWarning(
        `⚠️ Question pool is thin (${totalAvailable} unique questions left after today's attempts). ` +
        `Admin should ingest more questions via the RAG Admin page before attempt ${todaySessions.filter((s) => s.status === 'complete').length + 1}.`
      );
    } else {
      setPoolWarning('');
    }

    // Prefer RAG questions (novel), pad with static fallback
    const merge = (rag: Question[], fallback: Question[], target: number): Question[] => {
      const used = new Set(rag.map((q) => q.id));
      return [...rag, ...fallback.filter((q) => !used.has(q.id))].sort(() => Math.random() - 0.5).slice(0, target);
    };

    const finalRW = merge(ragRW, staticRW, RW_COUNT);
    const finalMath = merge(ragMath, staticMath, MATH_COUNT);
    if (!finalRW.length && !finalMath.length) return null;
    return [...finalRW, ...finalMath];
  };

  const launchBackground = () => {
    if (!remoteEnabled || !user?.email || generatingRef.current) return;
    generatingRef.current = true;
    const staticAll = selectMockQuestions(attempts, TOTAL_MOCK, mockSettings ?? DEFAULT_SETTINGS, storedRag);
    void createNovelTestSession({
      email: user.email, mode: 'mock', count: TOTAL_MOCK,
      attempts, fallbackQuestions: staticAll,
    })
      .then((newQs) => setStoredRag((prev) => {
        const ex = new Set(prev.map((q) => q.id));
        return [...prev, ...newQs.filter((q) => !ex.has(q.id))];
      }))
      .catch(() => {})
      .finally(() => { generatingRef.current = false; });
  };

  const start = () => {
    setError('');
    const excluded = usedTodayIds();
    const qs = buildQuestions(excluded);
    if (!qs) { setError('Not enough unique questions available — admin needs to ingest more into the RAG database.'); return; }
    launchBackground();
    setStoredSession(null); // fresh session, no resume
    setQuestions(qs);
  };

  const resume = () => {
    setError('');
    if (!storedSession) { start(); return; }
    // Use the exact questions from the stored session so indices stay correct
    try {
      const qs: Question[] = JSON.parse((storedSession as unknown as { questions_json: string }).questions_json || '[]');
      if (Array.isArray(qs) && qs.length >= 2) { setQuestions(qs); return; }
    } catch { /* fall through to fresh build */ }
    const excluded = usedTodayIds();
    const qs = buildQuestions(excluded);
    if (!qs) { setError('No questions available — admin needs to ingest more into the RAG database.'); return; }
    setQuestions(qs);
  };

  if (questions) {
    return (
      <MockRunner
        questions={questions}
        email={user?.email}
        date={today}
        session={storedSession}
      />
    );
  }

  const completedCount = todaySessions.filter((s) => s.status === 'complete').length;
  const rwPool = storedRag.filter((q) => q.section === 'Reading & Writing').length;
  const mathPool = storedRag.filter((q) => q.section === 'Math').length;
  const attemptsLeft = MAX_ATTEMPTS - completedCount;

  // ── Maxed out (3 completed) ────────────────────────────────────────────────
  if (sessionState === 'maxed') {
    return (
      <div className="space-y-6">
        <SectionTitle title="Daily Mock Test" subtitle="Full-length timed SAT simulation — as close to test day as it gets." />
        <Card className="text-center py-10">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success">
            <CheckCircle size={30} />
          </div>
          <h2 className="font-display text-2xl font-bold">All 3 Attempts Used Today</h2>
          <p className="mx-auto mt-2 max-w-md text-muted text-sm">
            You've taken all 3 mock attempts for today. Come back tomorrow for fresh tests. Your best score is locked in for today's analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <a href="/app/mock-history" className="btn-primary inline-flex items-center gap-2">
              <History size={16} /> Review All Today's Results
            </a>
          </div>
        </Card>
      </div>
    );
  }

  // ── Resume in-progress ─────────────────────────────────────────────────────
  if (sessionState === 'resume') {
    return (
      <div className="space-y-6">
        <SectionTitle title="Daily Mock Test" subtitle="Full-length timed SAT simulation — as close to test day as it gets." />
        {poolWarning && <PoolWarningBanner msg={poolWarning} />}
        <Card className="text-center py-10">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-warning/15 text-warning">
            <RotateCcw size={30} />
          </div>
          <h2 className="font-display text-2xl font-bold">Resume Attempt {completedCount + 1}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted text-sm">
            You have an incomplete attempt. Pick up right where you left off — your timer continues from where it stopped.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button className="btn-primary inline-flex items-center gap-2" onClick={resume}>
              <RotateCcw size={16} /> Resume from Question {(storedSession?.rw_idx ?? 0) + (storedSession?.math_idx ?? 0) + 1}
            </button>
          </div>
          <p className="mt-4 text-xs text-muted">Phase: {storedSession?.phase?.toUpperCase() ?? 'R&W'} · {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left today</p>
        </Card>
      </div>
    );
  }

  // ── Retry (1 or 2 completed, no in-progress) ──────────────────────────────
  if (sessionState === 'retry') {
    const lastCompleted = todaySessions.find((s) => s.status === 'complete');
    const lastScore = lastCompleted
      ? Math.round(200 + ((lastCompleted.rw_correct + lastCompleted.math_correct) / Math.max(1, lastCompleted.rw_total + lastCompleted.math_total)) * 600)
      : null;

    return (
      <div className="space-y-6">
        <SectionTitle title="Daily Mock Test" subtitle="Full-length timed SAT simulation — as close to test day as it gets." />
        {poolWarning && <PoolWarningBanner msg={poolWarning} />}
        <Card className="text-center py-10">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-500/15 text-brand-500">
            <RefreshCw size={30} />
          </div>
          <h2 className="font-display text-2xl font-bold">
            Attempt {completedCount + 1} of {MAX_ATTEMPTS}
          </h2>
          {lastScore && (
            <p className="mx-auto mt-2 text-sm text-muted">
              Your last score: <span className="font-bold text-foreground">{lastScore}</span> — grading uses your best completed attempt.
            </p>
          )}
          <p className="mx-auto mt-1 max-w-md text-muted text-sm">
            Fresh questions — none repeated from your earlier attempt{completedCount > 1 ? 's' : ''} today.
          </p>
          <div className="mx-auto mt-5 flex items-center justify-center gap-6 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${rwPool >= 10 ? 'bg-success' : 'bg-warning'}`} />
              R&W pool: {rwPool}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${mathPool >= 10 ? 'bg-success' : 'bg-warning'}`} />
              Math pool: {mathPool}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button className="btn-primary inline-flex items-center gap-2" onClick={start}>
              <Play size={16} /> Begin Attempt {completedCount + 1}
            </button>
            <a href="/app/mock-history" className="btn-ghost inline-flex items-center gap-2">
              <History size={16} /> Review Previous
            </a>
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <p className="mt-4 text-xs text-muted">{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left today · Put phone on silent · Treat it like test day</p>
        </Card>
        <AttemptDots completed={completedCount} total={MAX_ATTEMPTS} />
      </div>
    );
  }

  // ── Fresh start ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <SectionTitle title="Daily Mock Test" subtitle="Full-length timed SAT simulation — as close to test day as it gets." />

      {baseline !== null && (
        <Pill tone="success">
          <Rocket size={12} /> Baseline {baseline} — today's mock will update your projected score.
        </Pill>
      )}

      {poolWarning && <PoolWarningBanner msg={poolWarning} />}

      <Card className="text-center py-10">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
          <FileText size={30} />
        </div>
        <h2 className="font-display text-2xl font-bold">Full-Length SAT Simulation</h2>
        <p className="mx-auto mt-2 max-w-md text-muted text-sm">
          RAG-grounded + LLM-generated novel questions adapted to your weak areas.
          Timed exactly like the digital SAT. Up to {MAX_ATTEMPTS} attempts today — graded on your best.
        </p>
        <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoCard icon={<BookOpen size={17} />} label="Reading & Writing" value={String(RW_COUNT)} sub="64 min" />
          <InfoCard icon={<Calculator size={17} />} label="Math" value={String(MATH_COUNT)} sub="70 min" />
          <InfoCard icon={<Clock size={17} />} label="Total time" value="~134 min" sub="2 sections" />
          <InfoCard icon={<Target size={17} />} label="Score range" value="400–1600" sub="SAT scale" />
        </div>
        {remoteEnabled && (
          <div className="mx-auto mt-4 flex items-center justify-center gap-6 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${rwPool >= 10 ? 'bg-success' : 'bg-warning'}`} />
              R&W pool: {rwPool} ready
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${mathPool >= 10 ? 'bg-success' : 'bg-warning'}`} />
              Math pool: {mathPool} ready
            </span>
          </div>
        )}
        <button
          className="btn-primary mt-8 px-10 py-3.5 text-base"
          onClick={start}
          disabled={sessionState === 'checking'}
        >
          <Play size={18} /> {sessionState === 'checking' ? 'Checking…' : "Begin Today's Mock Test"}
        </button>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <p className="mt-4 text-xs text-muted">Put your phone on silent · Find a quiet space · Treat it like test day</p>
      </Card>

      <Card>
        <SectionTitle title="How the mock works" subtitle="Not a quiz — a full SAT training session" />
        <div className="grid gap-4 sm:grid-cols-3 mt-2">
          {[
            { icon: '🎯', title: 'Adaptive questions', desc: 'Your weakest topics get more slots. Difficulty adjusts to your current mastery level.' },
            { icon: '📚', title: 'Novel every attempt', desc: `Up to ${MAX_ATTEMPTS} attempts per day — every attempt gets a completely fresh, non-overlapping question set.` },
            { icon: '📊', title: 'Best score counts', desc: 'All attempts are stored in history. Your highest completed score is used for daily grading and progress tracking.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-brand-500/5 border border-brand-500/15 p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold text-sm">{f.title}</div>
              <p className="text-xs text-muted mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="text-center">
        <a href="/app/mock-history" className="text-xs text-muted hover:text-white transition-colors inline-flex items-center gap-1.5">
          <History size={13} /> View past mock tests
        </a>
      </div>
    </div>
  );
}

function PoolWarningBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold">Pool warning for admin: </span>{msg}
        {' '}<a href="/app/admin/rag" className="underline underline-offset-2 hover:opacity-80">Go to RAG Admin →</a>
      </div>
    </div>
  );
}

function AttemptDots({ completed, total }: { completed: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-3 w-3 rounded-full transition-colors ${i < completed ? 'bg-success' : i === completed ? 'bg-brand-400 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
      ))}
      <span className="text-xs text-muted ml-1">{completed}/{total} today</span>
    </div>
  );
}

function InfoCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border surface p-4">
      <div className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-600">{icon}</div>
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="text-[10px] text-muted/60 mt-0.5">{sub}</div>
    </div>
  );
}
