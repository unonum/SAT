/**
 * QA: MockRunner — resume index math, module splitting, phase mapping.
 *
 * These tests guard against regressions in the exact bugs that caused
 * blank screens and wrong question positions during resume.
 */
import { describe, it, expect } from 'vitest';
import type { Question } from '@/lib/types';

// ── Helpers extracted from MockRunner (keep in sync) ────────────────────────

type Phase =
  | 'intro' | 'rw1' | 'rw-mod-break' | 'rw2'
  | 'break' | 'math1' | 'math-mod-break' | 'math2' | 'review';

function storedPhaseToPhase(stored: string, rwIdx: number, mathIdx: number): Phase {
  if (stored === 'rw') return rwIdx >= 27 ? 'rw2' : 'rw1';
  if (stored === 'math') return mathIdx >= 22 ? 'math2' : 'math1';
  const valid: Phase[] = ['intro','rw1','rw-mod-break','rw2','break','math1','math-mod-break','math2','review'];
  return valid.includes(stored as Phase) ? (stored as Phase) : 'intro';
}

function resolveModuleIdx(storedIdx: number, phase: Phase): number {
  if (phase === 'rw2')   return Math.max(0, storedIdx - 27);
  if (phase === 'math2') return Math.max(0, storedIdx - 22);
  return storedIdx;
}

function makeQuestion(id: string, section: 'Math' | 'Reading & Writing'): Question {
  return {
    id,
    topic: 'algebra' as never,
    subtopic: 'test',
    section,
    difficulty: 'easy',
    prompt: `Question ${id}`,
    choices: [
      { id: 'A', text: 'A' }, { id: 'B', text: 'B' },
      { id: 'C', text: 'C' }, { id: 'D', text: 'D' },
    ],
    correct: 'A',
    parTimeSec: 60,
    explanation: {
      correctWhy: '', fastStrategy: '', simplerView: '',
      trapNote: '', timeTrick: '', whyWrong: {},
    },
  };
}

function makePool(rwCount: number, mathCount: number): Question[] {
  const rw   = Array.from({ length: rwCount },   (_, i) => makeQuestion(`rw-${i}`,   'Reading & Writing'));
  const math = Array.from({ length: mathCount }, (_, i) => makeQuestion(`math-${i}`, 'Math'));
  return [...rw, ...math];
}

// ── Phase mapping ────────────────────────────────────────────────────────────

describe('storedPhaseToPhase', () => {
  it('maps rw + idx<27 → rw1', () => {
    expect(storedPhaseToPhase('rw', 0, 0)).toBe('rw1');
    expect(storedPhaseToPhase('rw', 2, 0)).toBe('rw1');
    expect(storedPhaseToPhase('rw', 26, 0)).toBe('rw1');
  });

  it('maps rw + idx>=27 → rw2', () => {
    expect(storedPhaseToPhase('rw', 27, 0)).toBe('rw2');
    expect(storedPhaseToPhase('rw', 28, 0)).toBe('rw2');
    expect(storedPhaseToPhase('rw', 53, 0)).toBe('rw2');
  });

  it('maps math + idx<22 → math1', () => {
    expect(storedPhaseToPhase('math', 0, 0)).toBe('math1');
    expect(storedPhaseToPhase('math', 0, 21)).toBe('math1');
  });

  it('maps math + idx>=22 → math2', () => {
    expect(storedPhaseToPhase('math', 0, 22)).toBe('math2');
    expect(storedPhaseToPhase('math', 0, 43)).toBe('math2');
  });

  it('passes through new-format phases unchanged', () => {
    for (const p of ['rw1','rw-mod-break','rw2','break','math1','math-mod-break','math2','review','intro'] as Phase[]) {
      expect(storedPhaseToPhase(p, 0, 0)).toBe(p);
    }
  });
});

// ── Module index offset (the resume blank-screen bug) ────────────────────────

describe('resolveModuleIdx — resume index offset', () => {
  it('rw1: no adjustment needed', () => {
    expect(resolveModuleIdx(0, 'rw1')).toBe(0);
    expect(resolveModuleIdx(2, 'rw1')).toBe(2);
    expect(resolveModuleIdx(26, 'rw1')).toBe(26);
  });

  it('rw2: subtracts 27 so the index is within rwMod2 bounds', () => {
    // DB stores absolute index 27 → module-relative 0 (first question of mod2)
    expect(resolveModuleIdx(27, 'rw2')).toBe(0);
    // DB stores 28 → module-relative 1
    expect(resolveModuleIdx(28, 'rw2')).toBe(1);
    // "Resume from Question 3 of Module 2" = stored 29 → relative 2
    expect(resolveModuleIdx(29, 'rw2')).toBe(2);
    // Never goes negative
    expect(resolveModuleIdx(0, 'rw2')).toBe(0);
  });

  it('math1: no adjustment', () => {
    expect(resolveModuleIdx(0,  'math1')).toBe(0);
    expect(resolveModuleIdx(21, 'math1')).toBe(21);
  });

  it('math2: subtracts 22', () => {
    expect(resolveModuleIdx(22, 'math2')).toBe(0);
    expect(resolveModuleIdx(23, 'math2')).toBe(1);
    expect(resolveModuleIdx(43, 'math2')).toBe(21);
    expect(resolveModuleIdx(0,  'math2')).toBe(0); // clamped
  });
});

// ── Module splitting ─────────────────────────────────────────────────────────

describe('module splitting', () => {
  it('full pool: 54 R&W and 44 Math split into correct sizes', () => {
    const qs = makePool(54, 44);
    const rwQs   = qs.filter(q => q.section === 'Reading & Writing');
    const mathQs = qs.filter(q => q.section === 'Math');
    expect(rwQs.slice(0, 27).length).toBe(27);  // mod1
    expect(rwQs.slice(27).length).toBe(27);       // mod2
    expect(mathQs.slice(0, 22).length).toBe(22); // mod1
    expect(mathQs.slice(22).length).toBe(22);    // mod2
  });

  it('static-only pool (46 R&W, 48 Math): mod2 is shorter but non-empty', () => {
    const qs = makePool(46, 48);
    const rwQs   = qs.filter(q => q.section === 'Reading & Writing');
    const mathQs = qs.filter(q => q.section === 'Math');
    expect(rwQs.slice(0, 27).length).toBe(27);   // mod1 full
    expect(rwQs.slice(27).length).toBe(19);       // mod2 has 19 — shorter but valid
    expect(mathQs.slice(0, 22).length).toBe(22);
    expect(mathQs.slice(22).length).toBe(26);
  });

  it('very thin pool (30 R&W, 30 Math): mod2 may be empty — phase should skip', () => {
    const qs = makePool(30, 30);
    const rwQs = qs.filter(q => q.section === 'Reading & Writing');
    // mod1 uses 27, mod2 has 3
    expect(rwQs.slice(27).length).toBe(3);
    // mod2 is non-zero here, so no skip needed
  });

  it('empty pool section: mod1 and mod2 are both empty', () => {
    const qs = makePool(0, 44); // no R&W questions at all
    const rwQs = qs.filter(q => q.section === 'Reading & Writing');
    expect(rwQs.slice(0, 27).length).toBe(0);
    expect(rwQs.slice(27).length).toBe(0);
    // Both modules empty → useEffect should skip both to 'break'
  });
});

// ── Resume index produces a valid question ───────────────────────────────────

describe('resume: stored index always resolves to a real question', () => {
  const qs = makePool(46, 48);
  const rwQs   = qs.filter(q => q.section === 'Reading & Writing');
  const mathQs = qs.filter(q => q.section === 'Math');
  const rwMod1   = rwQs.slice(0, 27);
  const rwMod2   = rwQs.slice(27);
  const mathMod1 = mathQs.slice(0, 22);
  const mathMod2 = mathQs.slice(22);

  const modFor = (phase: Phase) =>
    phase === 'rw1' ? rwMod1 : phase === 'rw2' ? rwMod2 :
    phase === 'math1' ? mathMod1 : mathMod2;

  // Simulate what MockRunner does on mount: storedPhaseToPhase + resolveModuleIdx
  function simulateResume(storedPhase: string, storedRwIdx: number, storedMathIdx: number) {
    const phase = storedPhaseToPhase(storedPhase, storedRwIdx, storedMathIdx);
    const idx = storedPhase === 'rw' || storedPhase === 'rw1' || storedPhase === 'rw2'
      ? resolveModuleIdx(storedRwIdx, phase)
      : resolveModuleIdx(storedMathIdx, phase);
    const mod = modFor(phase as Phase);
    return mod[idx];
  }

  it('rw1 resume at question 3 (stored rw_idx=2) → valid question', () => {
    expect(simulateResume('rw', 2, 0)).toBeDefined();
  });

  it('rw2 resume at first question (stored rw_idx=27) → valid question', () => {
    expect(simulateResume('rw', 27, 0)).toBeDefined();
  });

  it('rw2 resume at question 5 (stored rw_idx=31) → valid question', () => {
    expect(simulateResume('rw', 31, 0)).toBeDefined();
  });

  it('math1 resume at question 10 (stored math_idx=9) → valid question', () => {
    expect(simulateResume('math', 0, 9)).toBeDefined();
  });

  it('math2 resume at question 2 (stored math_idx=23) → valid question', () => {
    expect(simulateResume('math', 0, 23)).toBeDefined();
  });

  it('old format rw_idx=2 (absolute, pre-module-refactor) maps correctly', () => {
    // Old sessions stored rw_idx as absolute 0-53, new sessions same convention
    expect(simulateResume('rw', 2, 0)).toBeDefined();
  });
});
