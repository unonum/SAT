import type { Attempt, PracticeMode, Question } from './types';
import { QUESTION_BANK } from './questionBank';
import { estimateScore } from './adaptive';

/**
 * Three fixed, full-length evaluation tests. Each is a deterministic
 * full-coverage simulation built from the question bank with a per-test
 * seeded ordering, so a test is identical every time it is taken (a stable
 * instrument for measuring progress across sittings).
 *
 * Every answer is recorded through the normal attempt pipeline, which syncs
 * to the database — so evaluation history is never lost and is fully
 * reconstructable for analysis (by filtering attempts on the test's mode).
 */

export interface EvalTestDef {
  id: 1 | 2 | 3;
  mode: Extract<PracticeMode, 'evaluation-1' | 'evaluation-2' | 'evaluation-3'>;
  name: string;
  blurb: string;
}

export const EVAL_TESTS: EvalTestDef[] = [
  { id: 1, mode: 'evaluation-1', name: 'Evaluation Test 1', blurb: 'Baseline full-length simulation across all 8 skill areas.' },
  { id: 2, mode: 'evaluation-2', name: 'Evaluation Test 2', blurb: 'Second full-length sitting — measure your movement vs. Test 1.' },
  { id: 3, mode: 'evaluation-3', name: 'Evaluation Test 3', blurb: 'Final full-length checkpoint before test day.' },
];

export const EVAL_MODES = EVAL_TESTS.map((t) => t.mode);

export function isEvalMode(mode: PracticeMode | string | null | undefined): boolean {
  return !!mode && (EVAL_MODES as string[]).includes(mode);
}

/**
 * Partition the question bank into 3 disjoint evaluation tests with NO repeated
 * questions across tests. Within each topic the questions are dealt out
 * round-robin (1st → Test 1, 2nd → Test 2, 3rd → Test 3, …), so every test
 * gets broad coverage across all skill areas and no question is ever reused.
 * This makes the three tests a complete, non-overlapping initial assessment.
 */
function partitionBank(): Record<1 | 2 | 3, Question[]> {
  const byTopic = new Map<string, Question[]>();
  for (const q of QUESTION_BANK) {
    (byTopic.get(q.topic) ?? byTopic.set(q.topic, []).get(q.topic)!).push(q);
  }
  const out: Record<1 | 2 | 3, Question[]> = { 1: [], 2: [], 3: [] };
  for (const [, qs] of byTopic) {
    const sorted = [...qs].sort((a, b) => a.id.localeCompare(b.id));
    sorted.forEach((q, i) => {
      const test = ((i % 3) + 1) as 1 | 2 | 3;
      out[test].push(q);
    });
  }
  return out;
}

const PARTITION = partitionBank();

/** Build the fixed, non-overlapping question set for an evaluation test. */
export function buildEvalTest(id: 1 | 2 | 3): Question[] {
  // order by section then topic for a coherent test flow
  return [...PARTITION[id]].sort((a, b) =>
    a.section === b.section ? a.topic.localeCompare(b.topic) : a.section.localeCompare(b.section)
  );
}

/** Number of questions in a given evaluation test. */
export function evalTestSize(id: 1 | 2 | 3): number {
  return PARTITION[id].length;
}

export interface EvalSession {
  startedAt: number;
  finishedAt: number;
  total: number;
  correct: number;
  accuracy: number;
  score: number;
}

/**
 * Group a user's attempts for one evaluation test into discrete sittings.
 * A new sitting starts when there is a gap > 6h between consecutive attempts.
 */
export function evalSessions(attempts: Attempt[], mode: PracticeMode): EvalSession[] {
  const GAP = 6 * 3600 * 1000;
  const mine = attempts.filter((a) => a.mode === mode).sort((a, b) => a.ts - b.ts);
  if (!mine.length) return [];

  const groups: Attempt[][] = [];
  let cur: Attempt[] = [];
  for (const a of mine) {
    if (cur.length && a.ts - cur[cur.length - 1].ts > GAP) {
      groups.push(cur);
      cur = [];
    }
    cur.push(a);
  }
  if (cur.length) groups.push(cur);

  return groups.map((g) => {
    const correct = g.filter((a) => a.correct).length;
    return {
      startedAt: g[0].ts,
      finishedAt: g[g.length - 1].ts,
      total: g.length,
      correct,
      accuracy: Math.round((correct / g.length) * 100),
      score: estimateScore(g).total,
    };
  });
}

export interface EvalSummary {
  mode: PracticeMode;
  sittings: number;
  lastSession: EvalSession | null;
  bestScore: number | null;
  firstScore: number | null;
  delta: number | null;
}

/** How many of the 3 benchmark tests have at least one completed sitting. */
export function benchmarkProgress(attempts: Attempt[]): { done: number; total: number; complete: boolean } {
  const done = EVAL_TESTS.filter((t) => attempts.some((a) => a.mode === t.mode)).length;
  return { done, total: EVAL_TESTS.length, complete: done >= EVAL_TESTS.length };
}

/** True once all 3 evaluation benchmark tests have been attempted. */
export function evaluationsComplete(attempts: Attempt[]): boolean {
  return benchmarkProgress(attempts).complete;
}

/** Baseline benchmark score = average of each test's first-sitting score. */
export function benchmarkBaseline(attempts: Attempt[]): number | null {
  const firsts = EVAL_TESTS
    .map((t) => evalSessions(attempts, t.mode)[0]?.score)
    .filter((s): s is number => typeof s === 'number');
  if (!firsts.length) return null;
  return Math.round(firsts.reduce((a, b) => a + b, 0) / firsts.length);
}

export function evalSummary(attempts: Attempt[], mode: PracticeMode): EvalSummary {
  const sessions = evalSessions(attempts, mode);
  if (!sessions.length) {
    return { mode, sittings: 0, lastSession: null, bestScore: null, firstScore: null, delta: null };
  }
  const scores = sessions.map((s) => s.score);
  const first = scores[0];
  const last = sessions[sessions.length - 1].score;
  return {
    mode,
    sittings: sessions.length,
    lastSession: sessions[sessions.length - 1],
    bestScore: Math.max(...scores),
    firstScore: first,
    delta: last - first,
  };
}
