import type { Attempt, DailyStat, Gamification } from './types';
import { estimateScore, computeAllMastery } from './adaptive';
import { xpForAttempt, evaluateBadges } from './gamification';

/**
 * Reconstruct daily stats + gamification from a raw, chronological attempt
 * list. Used when hydrating a profile from the database so charts and the
 * score history are rebuilt exactly.
 */
export function rebuildFromAttempts(attempts: Attempt[]): {
  daily: DailyStat[];
  gamification: Gamification;
} {
  const sorted = [...attempts].sort((a, b) => a.ts - b.ts);
  const DAY = 86400000;
  const now = Date.now();

  const dailyMap = new Map<string, DailyStat>();
  const running: Attempt[] = [];
  for (const a of sorted) {
    running.push(a);
    const date = new Date(a.ts).toISOString().slice(0, 10);
    const score = estimateScore(running).total;
    const cur =
      dailyMap.get(date) ?? { date, questions: 0, correct: 0, timeSec: 0, scoreEstimate: score };
    cur.questions += 1;
    cur.correct += a.correct ? 1 : 0;
    cur.timeSec += a.timeSec;
    cur.scoreEstimate = score;
    dailyMap.set(date, cur);
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // trailing-day streak
  let streak = 0;
  for (let d = 0; ; d++) {
    const date = new Date(now - d * DAY).toISOString().slice(0, 10);
    if (dailyMap.has(date)) streak++;
    else break;
  }

  const xp = sorted.reduce((s, a) => s + xpForAttempt(a), 0);
  const mastery = computeAllMastery(sorted);
  const gamification: Gamification = {
    xp,
    level: 1,
    streak,
    lastActiveDate: sorted.length ? new Date(sorted[sorted.length - 1].ts).toISOString().slice(0, 10) : null,
    badges: [],
  };
  gamification.badges = evaluateBadges(gamification, sorted, mastery);

  return { daily, gamification };
}

/**
 * Build a score-over-time series (one point per active day) from attempts.
 * Reconstructs the estimated SAT score as it stood at the end of each day.
 */
export function scoreHistory(attempts: Attempt[]): { date: string; score: number; accuracy: number }[] {
  const sorted = [...attempts].sort((a, b) => a.ts - b.ts);
  const byDay = new Map<string, Attempt[]>();
  for (const a of sorted) {
    const date = new Date(a.ts).toISOString().slice(0, 10);
    (byDay.get(date) ?? byDay.set(date, []).get(date)!).push(a);
  }
  const running: Attempt[] = [];
  const out: { date: string; score: number; accuracy: number }[] = [];
  for (const [date, dayAttempts] of Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    running.push(...dayAttempts);
    const score = estimateScore(running).total;
    const acc = Math.round((running.filter((a) => a.correct).length / running.length) * 100);
    out.push({ date: date.slice(5), score, accuracy: acc });
  }
  return out;
}
