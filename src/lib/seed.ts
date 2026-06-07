import type { Attempt, DailyStat, TopicId, UserData, Gamification } from './types';
import { QUESTION_BANK } from './questionBank';
import { TOPICS } from './topics';
import { classifyMistake, estimateScore } from './adaptive';
import { xpForAttempt, evaluateBadges } from './gamification';
import { computeAllMastery } from './adaptive';

type Skill = Record<TopicId, number>; // 0..1 probability of getting a topic right

interface SeedConfig {
  name: string;
  email: string;
  targetScore: number;
  studyHoursPerDay: number;
  skill: Skill;
  days: number;
  perDayMin: number;
  perDayMax: number;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Build a realistic profile of past activity for a student. */
export function buildSeedProfile(cfg: SeedConfig): UserData {
  const attempts: Attempt[] = [];
  const now = Date.now();
  const DAY = 86400000;

  for (let d = cfg.days - 1; d >= 0; d--) {
    const dayStart = now - d * DAY;
    const n = Math.round(rand(cfg.perDayMin, cfg.perDayMax));
    for (let i = 0; i < n; i++) {
      const topic = pick(TOPICS).id;
      const candidates = QUESTION_BANK.filter((q) => q.topic === topic);
      if (!candidates.length) continue;
      const q = pick(candidates);

      // probability adjusted by difficulty
      const diffPenalty = q.difficulty === 'hard' ? 0.18 : q.difficulty === 'medium' ? 0.06 : 0;
      // mild upward drift over time (improvement trend)
      const drift = ((cfg.days - d) / cfg.days) * 0.08;
      const p = Math.max(0.05, Math.min(0.97, cfg.skill[topic] - diffPenalty + drift));
      const correct = Math.random() < p;

      const selected = correct
        ? q.correct
        : pick(q.choices.map((c) => c.id).filter((id) => id !== q.correct));

      const timeSec = correct
        ? Math.round(q.parTimeSec * rand(0.7, 1.15))
        : Math.round(q.parTimeSec * rand(1.2, 2.1));

      const ts = dayStart + Math.round(rand(0, DAY * 0.6));

      attempts.push({
        id: `seed-${cfg.email}-${d}-${i}`,
        questionId: q.id,
        topic: q.topic,
        difficulty: q.difficulty,
        selected,
        correct,
        timeSec,
        confidence: pick(['low', 'medium', 'high'] as const),
        ts,
        mode: i === 0 && d === cfg.days - 1 ? 'diagnostic' : 'daily-adaptive',
        mistakeCategory: correct ? undefined : classifyMistake(q, selected, timeSec),
      });
    }
  }

  attempts.sort((a, b) => a.ts - b.ts);

  // Daily stats (cumulative score estimate)
  const dailyMap = new Map<string, DailyStat>();
  const running: Attempt[] = [];
  for (const a of attempts) {
    running.push(a);
    const date = new Date(a.ts).toISOString().slice(0, 10);
    const score = estimateScore(running).total;
    const cur = dailyMap.get(date) ?? { date, questions: 0, correct: 0, timeSec: 0, scoreEstimate: score };
    cur.questions += 1;
    cur.correct += a.correct ? 1 : 0;
    cur.timeSec += a.timeSec;
    cur.scoreEstimate = score;
    dailyMap.set(date, cur);
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Streak: consecutive days up to today present in daily
  let streak = 0;
  for (let d = 0; ; d++) {
    const date = new Date(now - d * DAY).toISOString().slice(0, 10);
    if (dailyMap.has(date)) streak++;
    else break;
  }

  const xp = attempts.reduce((s, a) => s + xpForAttempt(a), 0);
  const mastery = computeAllMastery(attempts);
  let gamification: Gamification = {
    xp,
    level: 1,
    streak,
    lastActiveDate: new Date(now).toISOString().slice(0, 10),
    badges: [],
  };
  gamification.badges = evaluateBadges(gamification, attempts, mastery);

  return {
    user: {
      name: cfg.name,
      email: cfg.email,
      role: 'student',
      targetScore: cfg.targetScore,
      studyHoursPerDay: cfg.studyHoursPerDay,
      createdAt: now - cfg.days * DAY,
    },
    hasDiagnostic: true,
    attempts,
    daily,
    gamification,
    seeded: true,
  };
}

/** The two students the admin oversees, with distinct strength profiles. */
export function seedStudentProfiles(): Record<string, UserData> {
  const tejasvi = buildSeedProfile({
    name: 'Tejasvi',
    email: 'nameistejasvi@gmail.com',
    targetScore: 1500,
    studyHoursPerDay: 1.5,
    days: 10,
    perDayMin: 5,
    perDayMax: 8,
    skill: {
      algebra: 0.9,
      'advanced-math': 0.82,
      'problem-solving-data': 0.86,
      'geometry-trig': 0.72,
      'reading-comprehension': 0.55,
      'vocabulary-in-context': 0.5,
      grammar: 0.45,
      'rhetoric-expression': 0.6,
    },
  });

  const nagtej = buildSeedProfile({
    name: 'Nagtej',
    email: 'nameisnagtej@gmail.com',
    targetScore: 1400,
    studyHoursPerDay: 1,
    days: 9,
    perDayMin: 4,
    perDayMax: 7,
    skill: {
      algebra: 0.55,
      'advanced-math': 0.4,
      'problem-solving-data': 0.6,
      'geometry-trig': 0.35,
      'reading-comprehension': 0.8,
      'vocabulary-in-context': 0.76,
      grammar: 0.85,
      'rhetoric-expression': 0.7,
    },
  });

  return {
    'nameistejasvi@gmail.com': tejasvi,
    'nameisnagtej@gmail.com': nagtej,
  };
}
