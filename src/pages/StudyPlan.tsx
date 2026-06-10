import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { computeAllMastery, estimateScore } from '@/lib/adaptive';
import { generateStudyPlan, type StudyTask } from '@/lib/studyPlan';
import { Card, SectionTitle, Pill, ProgressRing } from '@/components/ui';
import { CalendarCheck, Target, Clock, BookOpen, Timer, FileText, RefreshCcw, Lightbulb } from 'lucide-react';

const TASK_ICON: Record<StudyTask['type'], React.ReactNode> = {
  practice: <BookOpen size={15} />,
  review: <RefreshCcw size={15} />,
  drill: <Timer size={15} />,
  mock: <FileText size={15} />,
  strategy: <Lightbulb size={15} />,
};
const TASK_TONE: Record<StudyTask['type'], 'brand' | 'warning' | 'success' | 'danger' | 'muted'> = {
  practice: 'brand',
  review: 'warning',
  drill: 'success',
  mock: 'danger',
  strategy: 'muted',
};

export default function StudyPlan() {
  const { user, attempts } = useStore();
  const mastery = useMemo(() => computeAllMastery(attempts), [attempts]);
  const plan = useMemo(() => generateStudyPlan(user, mastery, 7), [user, mastery]);
  const score = estimateScore(attempts);
  const target = user?.targetScore ?? 1550;
  const progress = Math.min(100, Math.round(((score.total - 400) / (target - 400)) * 100));

  const daysToTest = user?.testDate
    ? Math.max(0, Math.ceil((new Date(user.testDate).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="space-y-6">
      <SectionTitle title="Your Study Plan" subtitle="Auto-rebuilt every day around your weakest topics." />

      {/* Roadmap header */}
      <Card className="flex flex-wrap items-center gap-6">
        <ProgressRing value={progress} size={110} label={`${progress}%`} sublabel="to target" color="#3563ff" />
        <div className="flex-1 min-w-[200px] space-y-2">
          <div className="flex items-center gap-2 text-sm"><Target size={16} className="text-brand-500" /> Current <b>{score.total}</b> → Target <b>{target}</b></div>
          <div className="flex items-center gap-2 text-sm"><Clock size={16} className="text-brand-500" /> {user?.studyHoursPerDay ?? 1}h/day study commitment</div>
          {daysToTest !== null && (
            <div className="flex items-center gap-2 text-sm"><CalendarCheck size={16} className="text-brand-500" /> <b>{daysToTest}</b> days until test day</div>
          )}
        </div>
        <div className="rounded-xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 p-4 text-sm max-w-xs">
          <div className="font-semibold mb-1">Coach's note</div>
          <p className="text-muted">
            We've front-loaded your weakest topics. Hit each day's tasks to stay on the fastest path to {target}.
          </p>
        </div>
      </Card>

      {/* 7-day plan */}
      <div className="grid gap-4 md:grid-cols-2">
        {plan.map((day) => {
          const totalMin = day.tasks.reduce((s, t) => s + t.minutes, 0);
          return (
            <Card key={day.date}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold">{day.label}</h3>
                  <span className="text-xs text-muted">{day.date}</span>
                </div>
                <Pill tone="muted"><Clock size={12} /> {totalMin} min</Pill>
              </div>
              <div className="space-y-2">
                {day.tasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 rounded-xl border surface p-3">
                    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                      TASK_TONE[t.type] === 'brand' ? 'bg-brand-500/10 text-brand-600' :
                      TASK_TONE[t.type] === 'warning' ? 'bg-warning/10 text-warning' :
                      TASK_TONE[t.type] === 'success' ? 'bg-success/10 text-success' :
                      TASK_TONE[t.type] === 'danger' ? 'bg-danger/10 text-danger' :
                      'bg-slate-500/10 text-muted'
                    }`}>
                      {TASK_ICON[t.type]}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{t.title}</span>
                        <span className="text-xs text-muted shrink-0">{t.minutes}m</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{t.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
