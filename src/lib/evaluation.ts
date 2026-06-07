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

/** Deterministic shuffle (mulberry32) so each test has a stable, distinct order. */
function seededOrder(seed: number): Question[] {
  let a = seed >>> 0;
  const rand = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [...QUESTION_BANK];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Build the fixed question set for an evaluation test (full-length). */
export function buildEvalTest(id: 1 | 2 | 3): Question[] {
  return seededOrder(id * 99991 + 7);
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
