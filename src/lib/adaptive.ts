import type { Attempt, Difficulty, Question, TopicId, TopicMastery } from './types';
import { QUESTION_BANK } from './questionBank';
import { TOPICS, MATH_TOPICS, RW_TOPICS } from './topics';

const DIFF_WEIGHT: Record<Difficulty, number> = { easy: 0.5, medium: 0.75, hard: 1 };

/**
 * Mastery Score =
 *   Accuracy × 40% + Time Efficiency × 20% + Difficulty Weight × 20%
 *   + Consistency × 10% + Recent Improvement × 10%
 * All components normalized to 0-100.
 */
export function computeTopicMastery(topic: TopicId, attempts: Attempt[]): TopicMastery {
  const ta = attempts.filter((a) => a.topic === topic).sort((a, b) => a.ts - b.ts);
  if (ta.length === 0) {
    return { topic, mastery: 0, accuracy: 0, avgTimeSec: 0, attempts: 0, trend: 0, status: 'repair' };
  }

  const correctCount = ta.filter((a) => a.correct).length;
  const accuracy = (correctCount / ta.length) * 100;

  // Time efficiency: compare to par time of each question (capped).
  const timeScores = ta.map((a) => {
    const q = QUESTION_BANK.find((x) => x.id === a.questionId);
    const par = q?.parTimeSec ?? 60;
    const ratio = par / Math.max(a.timeSec, 1);
    return Math.max(0, Math.min(1, ratio)); // 1 if at/under par
  });
  const timeEfficiency = (timeScores.reduce((s, v) => s + v, 0) / ta.length) * 100;

  // Difficulty weight: average difficulty of *correctly* answered questions.
  const correctDiffs = ta.filter((a) => a.correct).map((a) => DIFF_WEIGHT[a.difficulty]);
  const difficultyWeight = correctDiffs.length
    ? (correctDiffs.reduce((s, v) => s + v, 0) / correctDiffs.length) * 100
    : 0;

  // Consistency: inverse of variance in correctness over a rolling window.
  const window = ta.slice(-6).map((a) => (a.correct ? 1 : 0) as number);
  const mean = window.reduce((s, v) => s + v, 0) / window.length;
  const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length;
  const consistency = (1 - variance * 4) * 100; // variance 0.25 (max) -> 0
  const consistencyClamped = Math.max(0, Math.min(100, consistency));

  // Recent improvement: accuracy of recent half vs earlier half.
  const half = Math.floor(ta.length / 2);
  let trend = 0;
  if (ta.length >= 4) {
    const earlier = ta.slice(0, half);
    const recent = ta.slice(half);
    const ea = earlier.filter((a) => a.correct).length / earlier.length;
    const ra = recent.filter((a) => a.correct).length / recent.length;
    trend = (ra - ea) * 100;
  }
  const improvementScore = Math.max(0, Math.min(100, 50 + trend)); // centered at 50

  const mastery = Math.round(
    accuracy * 0.4 +
      timeEfficiency * 0.2 +
      difficultyWeight * 0.2 +
      consistencyClamped * 0.1 +
      improvementScore * 0.1
  );

  const avgTimeSec = Math.round(ta.reduce((s, a) => s + a.timeSec, 0) / ta.length);

  let status: TopicMastery['status'] = 'repair';
  if (mastery >= 85) status = 'mastered';
  else if (mastery >= 70) status = 'proficient';
  else if (mastery >= 50) status = 'developing';

  return {
    topic,
    mastery: Math.max(0, Math.min(100, mastery)),
    accuracy: Math.round(accuracy),
    avgTimeSec,
    attempts: ta.length,
    trend: Math.round(trend),
    status,
  };
}

export function computeAllMastery(attempts: Attempt[]): TopicMastery[] {
  return TOPICS.map((t) => computeTopicMastery(t.id, attempts));
}

/**
 * Adaptive selection: weight topics inversely to mastery so weak topics get
 * far more questions. Topics never attempted get a baseline weight so the
 * student still sees breadth. Difficulty is matched to current mastery.
 */
export function selectAdaptiveQuestions(
  attempts: Attempt[],
  count: number,
  opts: { topics?: TopicId[]; mode?: 'balanced' | 'weakness' } = {}
): Question[] {
  const mastery = computeAllMastery(attempts);
  const pool = opts.topics ? opts.topics : TOPICS.map((t) => t.id);

  // Weight: weaker topics weigh more. Weakness mode squares the gap.
  const weights = pool.map((topic) => {
    const m = mastery.find((x) => x.topic === topic)!;
    const gap = Math.max(5, 100 - m.mastery); // never zero
    const w = opts.mode === 'weakness' ? gap * gap : gap;
    return { topic, weight: w, mastery: m.mastery };
  });

  const recentIds = new Set(attempts.slice(-12).map((a) => a.questionId));
  const selected: Question[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const topic = weightedPick(weights);
    const m = weights.find((w) => w.topic === topic)!.mastery;
    const targetDiff = masteryToDifficulty(m);
    const q = pickQuestion(topic, targetDiff, usedIds, recentIds);
    if (q) {
      selected.push(q);
      usedIds.add(q.id);
    }
  }
  return selected;
}

function masteryToDifficulty(mastery: number): Difficulty {
  if (mastery < 50) return 'easy'; // concept repair mode — ease in
  if (mastery < 75) return 'medium';
  return 'hard';
}

function weightedPick(weights: { topic: TopicId; weight: number }[]): TopicId {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.topic;
  }
  return weights[0].topic;
}

function pickQuestion(
  topic: TopicId,
  preferred: Difficulty,
  used: Set<string>,
  recent: Set<string>
): Question | undefined {
  const inTopic = QUESTION_BANK.filter((q) => q.topic === topic && !used.has(q.id));
  if (inTopic.length === 0) {
    // fall back to any unused question
    return QUESTION_BANK.find((q) => !used.has(q.id));
  }
  const fresh = inTopic.filter((q) => !recent.has(q.id));
  const candidates = fresh.length ? fresh : inTopic;
  const byDiff = candidates.filter((q) => q.difficulty === preferred);
  const finalPool = byDiff.length ? byDiff : candidates;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/** Estimate an SAT score (400-1600) from section mastery. */
export function estimateScore(attempts: Attempt[]): {
  total: number;
  math: number;
  rw: number;
} {
  const sectionScore = (topics: TopicId[]) => {
    const ms = topics.map((t) => computeTopicMastery(t, attempts));
    const attempted = ms.filter((m) => m.attempts > 0);
    if (attempted.length === 0) return 500; // baseline before any data
    const avg = attempted.reduce((s, m) => s + m.mastery, 0) / attempted.length;
    // Map mastery 0-100 -> 200-800 section score.
    return Math.round(200 + (avg / 100) * 600);
  };
  const math = sectionScore(MATH_TOPICS as TopicId[]);
  const rw = sectionScore(RW_TOPICS as TopicId[]);
  return { total: math + rw, math, rw };
}

/** Auto-classify the likely mistake category for a wrong answer. */
export function classifyMistake(q: Question, selected: string | null, timeSec: number): Attempt['mistakeCategory'] {
  if (selected === null) return 'guessing';
  if (timeSec > q.parTimeSec * 1.8) return 'time-pressure';
  if (timeSec < q.parTimeSec * 0.4) return 'misread';
  if (q.section === 'Math') {
    return q.difficulty === 'hard' ? 'concept-gap' : 'calculation';
  }
  if (q.topic === 'grammar') return 'grammar-rule';
  return 'trap-answer';
}
