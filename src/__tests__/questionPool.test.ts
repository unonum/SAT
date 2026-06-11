/**
 * QA: Question pool building — exclusion logic, section filtering, pool exhaustion.
 *
 * Guards against the "blank mock test" and "not enough questions" regressions.
 */
import { describe, it, expect } from 'vitest';
import type { Question } from '@/lib/types';

function makeQ(id: string, section: 'Math' | 'Reading & Writing', ragGenerated = false): Question {
  return {
    id, topic: 'algebra' as never, subtopic: 'test', section,
    difficulty: 'medium', prompt: `Q ${id}`,
    choices: [
      { id: 'A', text: 'A' }, { id: 'B', text: 'B' },
      { id: 'C', text: 'C' }, { id: 'D', text: 'D' },
    ],
    correct: 'A', parTimeSec: 60,
    explanation: { correctWhy:'', fastStrategy:'', simplerView:'', trapNote:'', timeTrick:'', whyWrong:{} },
    ragGenerated,
  };
}

// Mirrors the logic in MockTest.tsx buildQuestions (static pool path)
function buildPool(
  allQuestions: Question[],
  excludeIds: Set<string>,
  globalSeen: Set<string>,
  rwTarget: number,
  mathTarget: number,
) {
  // RAG: exclude today + globalSeen
  const ragRW   = allQuestions.filter(q => q.section === 'Reading & Writing' && q.ragGenerated && !excludeIds.has(q.id) && !globalSeen.has(q.id));
  const ragMath = allQuestions.filter(q => q.section === 'Math'              && q.ragGenerated && !excludeIds.has(q.id) && !globalSeen.has(q.id));

  // Static: NO exclusion (emergency fallback must always be available)
  const staticRW   = allQuestions.filter(q => q.section === 'Reading & Writing' && !q.ragGenerated);
  const staticMath = allQuestions.filter(q => q.section === 'Math'              && !q.ragGenerated);

  const merge = (rag: Question[], fallback: Question[], target: number) => {
    const used = new Set(rag.map(q => q.id));
    return [...rag, ...fallback.filter(q => !used.has(q.id))].sort(() => Math.random() - 0.5).slice(0, target);
  };

  return {
    finalRW:   merge(ragRW,   staticRW,   rwTarget),
    finalMath: merge(ragMath, staticMath, mathTarget),
  };
}

// ── Static pool is never excluded ───────────────────────────────────────────

describe('static pool exclusion', () => {
  const staticRW   = Array.from({ length: 46 }, (_, i) => makeQ(`srw-${i}`,   'Reading & Writing', false));
  const staticMath = Array.from({ length: 48 }, (_, i) => makeQ(`sm-${i}`,    'Math',              false));
  const allQs = [...staticRW, ...staticMath];

  it('static questions are never excluded — pool always returns questions', () => {
    // Even if ALL static IDs are in globalSeen and excludeIds, static pool ignores them
    const globalSeen = new Set(allQs.map(q => q.id));
    const excludeIds = new Set(allQs.map(q => q.id));
    const { finalRW, finalMath } = buildPool(allQs, excludeIds, globalSeen, 54, 44);
    expect(finalRW.length).toBeGreaterThan(0);
    expect(finalMath.length).toBeGreaterThan(0);
  });

  it('static pool fills up to its size even when targets exceed pool size', () => {
    const { finalRW, finalMath } = buildPool(allQs, new Set(), new Set(), 54, 44);
    // 46 static R&W < 54 target: returns all 46
    expect(finalRW.length).toBe(46);
    // 48 static Math < 44 target: returns 44 (sliced)
    expect(finalMath.length).toBe(44);
  });

  it('RAG questions are merged with static and pool returns up to target', () => {
    const ragRW = Array.from({ length: 20 }, (_, i) => makeQ(`rrw-${i}`, 'Reading & Writing', true));
    const all   = [...staticRW, ...staticMath, ...ragRW];
    // 20 RAG + 46 static = 66 total R&W; target 54 → returns exactly 54
    const { finalRW } = buildPool(all, new Set(), new Set(), 54, 44);
    expect(finalRW.length).toBe(54);
    // All returned questions are R&W (no cross-section contamination)
    expect(finalRW.every(q => q.section === 'Reading & Writing')).toBe(true);
  });

  it('when pool < target, all available questions are returned (including all RAG)', () => {
    // 20 RAG + 10 static = 30 total < target 54 → returns all 30
    const smallStatic = Array.from({ length: 10 }, (_, i) => makeQ(`srw-small-${i}`, 'Reading & Writing', false));
    const ragRW = Array.from({ length: 20 }, (_, i) => makeQ(`rrw-${i}`, 'Reading & Writing', true));
    const all = [...ragRW, ...smallStatic];
    const { finalRW } = buildPool(all, new Set(), new Set(), 54, 44);
    expect(finalRW.length).toBe(30); // all 30 returned (pool < target)
    const ragInResult = finalRW.filter(q => q.ragGenerated).length;
    expect(ragInResult).toBe(20); // all 20 RAG included when pool ≤ target
  });
});

// ── RAG questions are properly excluded ──────────────────────────────────────

describe('RAG question exclusion', () => {
  const ragRW = Array.from({ length: 30 }, (_, i) => makeQ(`rrw-${i}`, 'Reading & Writing', true));
  const staticRW = Array.from({ length: 46 }, (_, i) => makeQ(`srw-${i}`, 'Reading & Writing', false));
  const all = [...ragRW, ...staticRW];

  it('RAG questions seen globally are excluded', () => {
    const globalSeen = new Set(ragRW.map(q => q.id));
    const { finalRW } = buildPool(all, new Set(), globalSeen, 54, 44);
    const ragInResult = finalRW.filter(q => q.ragGenerated).length;
    expect(ragInResult).toBe(0); // all RAG excluded
  });

  it('RAG questions used today are excluded', () => {
    const excludeIds = new Set(ragRW.map(q => q.id));
    const { finalRW } = buildPool(all, excludeIds, new Set(), 54, 44);
    const ragInResult = finalRW.filter(q => q.ragGenerated).length;
    expect(ragInResult).toBe(0);
  });

  it('fresh RAG questions are included in pool (not filtered out)', () => {
    // 30 RAG + 46 static = 76 total > target 54 — pool is sliced, but RAG is in candidate set
    const { finalRW } = buildPool(all, new Set(), new Set(), 54, 44);
    expect(finalRW.length).toBe(54);
    // At least some RAG appear (they are not excluded from the fresh pool)
    const ragInResult = finalRW.filter(q => q.ragGenerated).length;
    expect(ragInResult).toBeGreaterThan(0);
  });
});

// ── Section filtering ────────────────────────────────────────────────────────

describe('section filtering', () => {
  it('R&W questions never appear in Math pool and vice versa', () => {
    const mixed = [
      makeQ('rw1', 'Reading & Writing', false),
      makeQ('m1',  'Math',              false),
      makeQ('rw2', 'Reading & Writing', true),
      makeQ('m2',  'Math',              true),
    ];
    const { finalRW, finalMath } = buildPool(mixed, new Set(), new Set(), 10, 10);
    expect(finalRW.every(q => q.section === 'Reading & Writing')).toBe(true);
    expect(finalMath.every(q => q.section === 'Math')).toBe(true);
  });

  it('returns empty arrays when section has no questions', () => {
    const onlyMath = Array.from({ length: 44 }, (_, i) => makeQ(`m-${i}`, 'Math', false));
    const { finalRW, finalMath } = buildPool(onlyMath, new Set(), new Set(), 54, 44);
    expect(finalRW.length).toBe(0);
    expect(finalMath.length).toBe(44);
  });
});

// ── Pool size thresholds ─────────────────────────────────────────────────────

describe('pool size thresholds', () => {
  it('94 static questions always produce a non-null pool', () => {
    const qs = [
      ...Array.from({ length: 46 }, (_, i) => makeQ(`srw-${i}`, 'Reading & Writing', false)),
      ...Array.from({ length: 48 }, (_, i) => makeQ(`sm-${i}`,  'Math',              false)),
    ];
    const { finalRW, finalMath } = buildPool(qs, new Set(), new Set(qs.map(q=>q.id)), 54, 44);
    // Static never excluded → always returns questions
    expect(finalRW.length + finalMath.length).toBeGreaterThan(0);
  });

  it('pool can never be null as long as static bank exists', () => {
    const qs = [makeQ('rw1', 'Reading & Writing', false)];
    const { finalRW } = buildPool(qs, new Set(), new Set(), 54, 44);
    expect(finalRW.length).toBe(1); // at minimum 1
  });
});
