import type { TopicMastery, UserProfile } from './types';
import { TOPIC_MAP } from './topics';

export interface StudyTask {
  id: string;
  title: string;
  detail: string;
  type: 'practice' | 'review' | 'drill' | 'mock' | 'strategy';
  minutes: number;
  topic?: string;
}

export interface DayPlan {
  label: string;
  date: string;
  tasks: StudyTask[];
}

/** Generates a rolling, auto-updating study plan from mastery + profile. */
export function generateStudyPlan(
  user: UserProfile | null,
  mastery: TopicMastery[],
  days = 7
): DayPlan[] {
  const hours = user?.studyHoursPerDay ?? 1;
  const dailyMinutes = Math.round(hours * 60);

  const ranked = [...mastery].sort((a, b) => a.mastery - b.mastery);
  const weak = ranked.filter((m) => m.mastery < 70);

  const plans: DayPlan[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const date = d.toISOString().slice(0, 10);
    const label =
      i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'long' });

    const tasks: StudyTask[] = [];
    let used = 0;

    // Sunday (index 6 of week-ish) -> mock test
    const isMockDay = i === 6;
    if (isMockDay) {
      tasks.push({
        id: `${date}-mock`,
        title: 'Full-length SAT mock test',
        detail: 'Simulate test conditions to track your score under pressure.',
        type: 'mock',
        minutes: Math.min(dailyMinutes, 120),
      });
      plans.push({ label, date, tasks });
      continue;
    }

    // Primary weakness practice
    const focus = weak[i % Math.max(1, weak.length)] ?? ranked[0];
    if (focus) {
      const repair = focus.mastery < 50;
      tasks.push({
        id: `${date}-focus`,
        title: `${repair ? 'Concept repair' : 'Targeted practice'}: ${TOPIC_MAP[focus.topic].name}`,
        detail: repair
          ? `Mastery ${focus.mastery}% — guided lesson + easier questions to rebuild fundamentals.`
          : `Mastery ${focus.mastery}% — adaptive questions to push toward proficiency.`,
        type: repair ? 'review' : 'practice',
        minutes: Math.round(dailyMinutes * 0.45),
        topic: focus.topic,
      });
      used += Math.round(dailyMinutes * 0.45);
    }

    // Timed drill on second weakness
    const second = weak[(i + 1) % Math.max(1, weak.length)];
    if (second && used < dailyMinutes) {
      tasks.push({
        id: `${date}-drill`,
        title: `Timed drill: ${TOPIC_MAP[second.topic].name}`,
        detail: 'Speed work to improve time efficiency under the clock.',
        type: 'drill',
        minutes: Math.round(dailyMinutes * 0.3),
        topic: second.topic,
      });
      used += Math.round(dailyMinutes * 0.3);
    }

    // Error review + strategy
    tasks.push({
      id: `${date}-error`,
      title: 'Error log review',
      detail: 'Re-attempt yesterday’s misses and read the AI explanations.',
      type: 'review',
      minutes: Math.max(10, dailyMinutes - used),
    });

    if (i % 2 === 0) {
      tasks.push({
        id: `${date}-strategy`,
        title: 'Strategy lesson',
        detail: 'Watch a 5-minute SAT strategy module (elimination, timing, traps).',
        type: 'strategy',
        minutes: 5,
      });
    }

    plans.push({ label, date, tasks });
  }
  return plans;
}
