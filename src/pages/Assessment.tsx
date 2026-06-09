import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { TOPICS } from '@/lib/topics';
import { QUESTION_BANK, questionsByTopic } from '@/lib/questionBank';
import { createNovelTestSession } from '@/lib/ragClient';
import QuestionRunner from '@/components/QuestionRunner';
import { Card } from '@/components/ui';
import { Target, Gauge, Clock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import type { Question } from '@/lib/types';

// Full-coverage diagnostic: for every topic, sample across difficulty so we
// measure both fundamentals (easy/medium) and ceiling (hard). This gives a
// far stronger first mastery signal than a single question per topic.
function buildDiagnostic(): Question[] {
  const order = { easy: 0, medium: 1, hard: 2 } as const;
  const out: Question[] = [];
  for (const t of TOPICS) {
    const qs = [...questionsByTopic(t.id)].sort(
      (a, b) => order[a.difficulty] - order[b.difficulty]
    );
    if (!qs.length) continue;
    // take up to 2 questions spanning the difficulty range (easiest + hardest)
    if (qs.length === 1) out.push(qs[0]);
    else out.push(qs[0], qs[qs.length - 1]);
  }
  return out;
}

export default function Assessment() {
  const navigate = useNavigate();
  const { user, attempts, updateProfile, markDiagnosticDone } = useStore();
  const [phase, setPhase] = useState<'intro' | 'test'>('intro');
  const [target, setTarget] = useState(user?.targetScore ?? 1450);
  const [hours, setHours] = useState(user?.studyHoursPerDay ?? 1);
  const [testDate, setTestDate] = useState(user?.testDate ?? '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const diagnosticSize = buildDiagnostic().length;

  const startDiagnostic = async () => {
    setLoading(true);
    setError('');
    try {
      const generated = await createNovelTestSession({
        email: user?.email ?? '', mode: 'diagnostic', count: diagnosticSize,
        attempts, fallbackQuestions: QUESTION_BANK,
      });
      setQuestions(generated);
      setPhase('test');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the diagnostic');
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'test') {
    return (
      <div className="min-h-screen px-4 py-8">
        <QuestionRunner
          questions={questions}
          mode="diagnostic"
          title="Smart Diagnostic Test"
          timed
          onComplete={() => {
            markDiagnosticDone();
            updateProfile({ targetScore: target, studyHoursPerDay: hours, testDate });
            setTimeout(() => navigate('/app'), 50);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
            <Gauge size={28} />
          </div>
          <h1 className="font-display text-3xl font-extrabold">Let's find your starting point</h1>
          <p className="mt-2 text-muted">
            This {diagnosticSize}-question smart diagnostic covers all 8 SAT skill areas. We'll measure
            your accuracy, timing, and confidence to build your personalized plan.
          </p>
        </div>

        <Card className="space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
              <Target size={16} className="text-brand-500" /> Target SAT score
            </label>
            <input
              type="range"
              min={1000}
              max={1600}
              step={10}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="text-center font-display text-2xl font-bold gradient-text">{target}</div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
              <Clock size={16} className="text-brand-500" /> Study hours per day
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 1, 1.5, 2].map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                    hours === h ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'surface'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 size={16} className="text-brand-500" /> Test date (optional)
            </label>
            <input type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
          </div>

          <button className="btn-primary w-full py-3" onClick={startDiagnostic} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {loading ? 'Building your novel diagnostic…' : 'Start diagnostic'}
          </button>
          {error && <p className="text-center text-sm text-danger">{error}</p>}
          <p className="text-center text-xs text-muted">Takes about 8 minutes · you can pause anytime</p>
        </Card>
      </div>
    </div>
  );
}
