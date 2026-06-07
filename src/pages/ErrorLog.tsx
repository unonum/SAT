import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { getQuestion } from '@/lib/questionBank';
import { TOPIC_MAP } from '@/lib/topics';
import { MISTAKE_LABELS, explainQuestion } from '@/lib/tutor';
import QuestionRunner from '@/components/QuestionRunner';
import { Card, SectionTitle, Pill, EmptyState } from '@/components/ui';
import { formatTime, relativeDate } from '@/lib/utils';
import type { MistakeCategory, Question } from '@/lib/types';
import { ChevronDown, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';

export default function ErrorLog() {
  const { attempts } = useStore();
  const errors = useMemo(() => [...attempts].filter((a) => !a.correct).reverse(), [attempts]);
  const [filter, setFilter] = useState<MistakeCategory | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [retry, setRetry] = useState<Question[] | null>(null);

  if (retry) {
    return <QuestionRunner questions={retry} mode="error-review" title="Error Review Mode" />;
  }

  if (errors.length === 0) {
    return <EmptyState title="No errors logged" hint="Every wrong answer is captured here with a full breakdown. Keep practicing!" />;
  }

  const filtered = filter === 'all' ? errors : errors.filter((a) => a.mistakeCategory === filter);
  const categories = Array.from(new Set(errors.map((a) => a.mistakeCategory).filter(Boolean))) as MistakeCategory[];

  const startReview = () => {
    const qs = filtered.map((a) => getQuestion(a.questionId)).filter(Boolean) as Question[];
    // de-dupe
    const seen = new Set<string>();
    const unique = qs.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)));
    if (unique.length) setRetry(unique.slice(0, 8));
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Smart Error Log"
        subtitle="Every mistake, categorized, with the fix attached."
        action={
          <button className="btn-primary px-4 py-2 text-sm" onClick={startReview}>
            <RotateCcw size={15} /> Re-attempt errors
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`chip ${filter === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-500/10 text-muted'}`}
        >
          All ({errors.length})
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`chip ${filter === c ? 'bg-brand-600 text-white' : 'bg-slate-500/10 text-muted'}`}
          >
            {MISTAKE_LABELS[c]} ({errors.filter((a) => a.mistakeCategory === c).length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((a) => {
          const q = getQuestion(a.questionId);
          if (!q) return null;
          const open = openId === a.id;
          const tutor = open ? explainQuestion(q, a.selected) : null;
          return (
            <Card key={a.id} className="p-0 overflow-hidden">
              <button
                className="flex w-full items-start gap-3 p-4 text-left"
                onClick={() => setOpenId(open ? null : a.id)}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Pill tone="brand">{TOPIC_MAP[q.topic].name}</Pill>
                    <Pill tone="muted">{q.subtopic}</Pill>
                    <Pill tone={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>{q.difficulty}</Pill>
                    {a.mistakeCategory && <Pill tone="danger">{MISTAKE_LABELS[a.mistakeCategory]}</Pill>}
                    {a.retried && <Pill tone="success"><CheckCircle2 size={12} /> retried</Pill>}
                  </div>
                  <p className="text-sm font-medium line-clamp-2">{q.prompt}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                    <span>Your answer: <b className="text-danger">{a.selected ?? 'skipped'}</b></span>
                    <span>Correct: <b className="text-success">{q.correct}</b></span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {formatTime(a.timeSec)}</span>
                    <span>{relativeDate(a.ts)}</span>
                  </div>
                </div>
                <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && tutor && (
                <div className="border-t surface bg-slate-50/50 dark:bg-slate-800/30 p-4 text-sm space-y-2.5 animate-fade-up">
                  <Block t="Why your answer was wrong" v={tutor.whySelectedWrong} />
                  <Block t="Why the correct answer is right" v={tutor.whyCorrect} />
                  <Block t="Fastest strategy" v={tutor.fastStrategy} />
                  <Block t="Time-saving trick" v={tutor.timeTrick} />
                  <div className="rounded-lg bg-brand-500/10 p-3 text-brand-700 dark:text-brand-200">
                    <b>Improvement tip:</b> {tutor.improvementTip}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Block({ t, v }: { t: string; v: string }) {
  return (
    <div>
      <span className="font-semibold">{t}: </span>
      <span className="text-muted">{v}</span>
    </div>
  );
}
