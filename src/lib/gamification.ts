import type { Attempt, Gamification, TopicMastery } from './types';

export const BADGES: Record<string, { name: string; icon: string; desc: string }> = {
  'first-steps':       { name: 'First Steps',       icon: '🎯', desc: 'Completed your diagnostic test' },
  'benchmark-crusher': { name: 'Benchmark Crusher',  icon: '🏆', desc: 'Crushed all 3 benchmark evaluations' },
  'streak-3':          { name: 'On a Roll',           icon: '🔥', desc: '3-day practice streak' },
  'streak-7':          { name: 'Week Warrior',        icon: '⚡', desc: '7-day practice streak' },
  'sharpshooter':      { name: 'Sharpshooter',        icon: '🎖️', desc: '90%+ accuracy in a session' },
  'century':           { name: 'Century',             icon: '💯', desc: 'Answered 100 questions' },
  'topic-master':      { name: 'Topic Master',        icon: '👑', desc: 'Reached 85%+ mastery in a topic' },
  'speed-demon':       { name: 'Speed Demon',         icon: '🚀', desc: 'Beat par time on 10 questions' },
  'comeback':          { name: 'Comeback Kid',        icon: '📈', desc: 'Improved a weak topic by 20%' },
};

export const BENCHMARK_XP = 250; // bonus XP burst for completing all 3 evaluations

export function xpForLevel(level: number): number {
  // increasing XP curve
  return Math.round(100 * Math.pow(level, 1.4));
}

export function levelFromXp(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let acc = 0;
  while (acc + xpForLevel(level) <= xp) {
    acc += xpForLevel(level);
    level++;
  }
  const needed = xpForLevel(level);
  const into = xp - acc;
  return { level, into, needed };
}

export function xpForAttempt(a: Attempt): number {
  let xp = a.correct ? 10 : 4; // effort still rewarded
  const diffBonus = a.difficulty === 'hard' ? 6 : a.difficulty === 'medium' ? 3 : 0;
  return xp + (a.correct ? diffBonus : 0);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function updateStreak(g: Gamification): Gamification {
  const today = todayStr();
  if (g.lastActiveDate === today) return g;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = g.lastActiveDate === yesterday ? g.streak + 1 : 1;
  return { ...g, streak, lastActiveDate: today };
}

export function evaluateBadges(
  g: Gamification,
  attempts: Attempt[],
  mastery: TopicMastery[],
  sessionAccuracy?: number
): string[] {
  const earned = new Set(g.badges);
  if (attempts.some((a) => a.mode === 'diagnostic')) earned.add('first-steps');
  const evalModes: string[] = ['evaluation-1', 'evaluation-2', 'evaluation-3'];
  if (evalModes.every((m) => attempts.some((a) => a.mode === m))) earned.add('benchmark-crusher');
  if (g.streak >= 3) earned.add('streak-3');
  if (g.streak >= 7) earned.add('streak-7');
  if (attempts.length >= 100) earned.add('century');
  if (sessionAccuracy !== undefined && sessionAccuracy >= 90) earned.add('sharpshooter');
  if (mastery.some((m) => m.mastery >= 85)) earned.add('topic-master');
  if (mastery.some((m) => m.trend >= 20)) earned.add('comeback');
  return Array.from(earned);
}
