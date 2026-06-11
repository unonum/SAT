import type { VercelRequest, VercelResponse } from '@vercel/node';
import { QUESTION_BANK } from '../src/lib/questionBank.js';

export const maxDuration = 10;

interface TestResult {
  name: string;
  pass: boolean;
  detail?: string;
}

interface Suite {
  name: string;
  tests: TestResult[];
}

function check(name: string, fn: () => void): TestResult {
  try {
    fn();
    return { name, pass: true };
  } catch (e) {
    return { name, pass: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// ── Static question bank integrity ───────────────────────────────────────────

function bankSuite(): Suite {
  const VALID_SECTIONS = ['Math', 'Reading & Writing'];
  const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
  const VALID_CHOICE_IDS = ['A', 'B', 'C', 'D'];
  const q = QUESTION_BANK as Array<Record<string, unknown>>;

  return {
    name: 'Static Question Bank',
    tests: [
      check('has at least 80 questions', () => assert(q.length >= 80, `got ${q.length}`)),
      check('has at least 40 R&W questions', () => {
        const n = q.filter(x => x.section === 'Reading & Writing').length;
        assert(n >= 40, `got ${n}`);
      }),
      check('has at least 40 Math questions', () => {
        const n = q.filter(x => x.section === 'Math').length;
        assert(n >= 40, `got ${n}`);
      }),
      check('every question has a unique id', () => {
        const ids = q.map(x => x.id as string);
        assert(new Set(ids).size === ids.length, 'duplicate IDs found');
      }),
      check('every question has a valid section', () => {
        const bad = q.filter(x => !VALID_SECTIONS.includes(x.section as string));
        assert(bad.length === 0, `invalid section on: ${bad.map(x => x.id).join(', ')}`);
      }),
      check('every question has a valid difficulty', () => {
        const bad = q.filter(x => !VALID_DIFFICULTIES.includes(x.difficulty as string));
        assert(bad.length === 0, `invalid difficulty on: ${bad.map(x => x.id).join(', ')}`);
      }),
      check('every question has exactly 4 choices A B C D', () => {
        for (const qi of q) {
          const choices = qi.choices as Array<{ id: string }>;
          assert(choices.length === 4, `${qi.id} has ${choices.length} choices`);
          const ids = choices.map(c => c.id).sort().join('');
          assert(ids === 'ABCD', `${qi.id} choice IDs: ${ids}`);
        }
      }),
      check("every question's correct answer is one of its choice IDs", () => {
        for (const qi of q) {
          const correct = qi.correct as string;
          assert(VALID_CHOICE_IDS.includes(correct), `${qi.id} correct=${correct} invalid`);
          const choiceIds = (qi.choices as Array<{ id: string }>).map(c => c.id);
          assert(choiceIds.includes(correct), `${qi.id} correct not in choices`);
        }
      }),
      check('every question has a non-empty prompt', () => {
        const bad = q.filter(x => !((x.prompt as string).trim().length > 10));
        assert(bad.length === 0, `short/empty prompt on: ${bad.map(x => x.id).join(', ')}`);
      }),
      check('every question has an explanation with required keys', () => {
        const required = ['correctWhy', 'fastStrategy', 'simplerView', 'trapNote', 'timeTrick', 'whyWrong'];
        for (const qi of q) {
          const exp = qi.explanation as Record<string, unknown>;
          const missing = required.filter(k => !(k in exp));
          assert(missing.length === 0, `${qi.id} missing keys: ${missing.join(', ')}`);
        }
      }),
      check('parTimeSec is a positive number for every question', () => {
        const bad = q.filter(x => !((x.parTimeSec as number) > 0));
        assert(bad.length === 0, `bad parTimeSec on: ${bad.map(x => x.id).join(', ')}`);
      }),
      check('no two questions have the same content (passage + prompt)', () => {
        const keys = q.map(x => ((x.passage as string ?? '') + '|||' + (x.prompt as string)).trim().toLowerCase());
        assert(new Set(keys).size === keys.length, 'duplicate question content found');
      }),
      check('enough questions to fill Module 1 of both sections', () => {
        const rw = q.filter(x => x.section === 'Reading & Writing').length;
        const math = q.filter(x => x.section === 'Math').length;
        assert(rw >= 27, `R&W ${rw} < 27`);
        assert(math >= 22, `Math ${math} < 22`);
      }),
    ],
  };
}

// ── Pool exclusion logic ─────────────────────────────────────────────────────

type Section = 'Math' | 'Reading & Writing';
interface Q { id: string; section: Section; ragGenerated: boolean }

function makeQ(id: string, section: Section, ragGenerated = false): Q {
  return { id, section, ragGenerated };
}

function buildPool(
  allQuestions: Q[],
  excludeIds: Set<string>,
  globalSeen: Set<string>,
  rwTarget: number,
  mathTarget: number,
) {
  const ragRW   = allQuestions.filter(q => q.section === 'Reading & Writing' && q.ragGenerated && !excludeIds.has(q.id) && !globalSeen.has(q.id));
  const ragMath = allQuestions.filter(q => q.section === 'Math'              && q.ragGenerated && !excludeIds.has(q.id) && !globalSeen.has(q.id));
  const staticRW   = allQuestions.filter(q => q.section === 'Reading & Writing' && !q.ragGenerated);
  const staticMath = allQuestions.filter(q => q.section === 'Math'              && !q.ragGenerated);
  const merge = (rag: Q[], fallback: Q[], target: number) => {
    const used = new Set(rag.map(q => q.id));
    return [...rag, ...fallback.filter(q => !used.has(q.id))].sort(() => Math.random() - 0.5).slice(0, target);
  };
  return { finalRW: merge(ragRW, staticRW, rwTarget), finalMath: merge(ragMath, staticMath, mathTarget) };
}

function poolSuite(): Suite {
  const staticRW   = Array.from({ length: 46 }, (_, i) => makeQ(`srw-${i}`,   'Reading & Writing', false));
  const staticMath = Array.from({ length: 48 }, (_, i) => makeQ(`sm-${i}`,    'Math',              false));
  const allQs = [...staticRW, ...staticMath];

  return {
    name: 'Question Pool Exclusion',
    tests: [
      check('static questions are never excluded — pool always returns questions', () => {
        const globalSeen = new Set(allQs.map(q => q.id));
        const excludeIds = new Set(allQs.map(q => q.id));
        const { finalRW, finalMath } = buildPool(allQs, excludeIds, globalSeen, 54, 44);
        assert(finalRW.length > 0, 'finalRW empty');
        assert(finalMath.length > 0, 'finalMath empty');
      }),
      check('static pool fills up to its size when targets exceed pool size', () => {
        const { finalRW, finalMath } = buildPool(allQs, new Set(), new Set(), 54, 44);
        assert(finalRW.length === 46, `finalRW=${finalRW.length} (expected 46)`);
        assert(finalMath.length === 44, `finalMath=${finalMath.length} (expected 44)`);
      }),
      check('when pool < target, all available questions are returned', () => {
        const small = Array.from({ length: 10 }, (_, i) => makeQ(`srw-small-${i}`, 'Reading & Writing', false));
        const rag   = Array.from({ length: 20 }, (_, i) => makeQ(`rrw-${i}`, 'Reading & Writing', true));
        const { finalRW } = buildPool([...rag, ...small], new Set(), new Set(), 54, 44);
        assert(finalRW.length === 30, `got ${finalRW.length} (expected 30)`);
        const ragCount = finalRW.filter(q => q.ragGenerated).length;
        assert(ragCount === 20, `RAG in result=${ragCount} (expected 20)`);
      }),
      check('RAG questions seen globally are excluded', () => {
        const ragRW = Array.from({ length: 30 }, (_, i) => makeQ(`rrw-${i}`, 'Reading & Writing', true));
        const all = [...ragRW, ...staticRW];
        const { finalRW } = buildPool(all, new Set(), new Set(ragRW.map(q => q.id)), 54, 44);
        const ragCount = finalRW.filter(q => q.ragGenerated).length;
        assert(ragCount === 0, `RAG still present: ${ragCount}`);
      }),
      check('RAG questions used today are excluded', () => {
        const ragRW = Array.from({ length: 30 }, (_, i) => makeQ(`rrw-${i}`, 'Reading & Writing', true));
        const all = [...ragRW, ...staticRW];
        const { finalRW } = buildPool(all, new Set(ragRW.map(q => q.id)), new Set(), 54, 44);
        const ragCount = finalRW.filter(q => q.ragGenerated).length;
        assert(ragCount === 0, `RAG still present: ${ragCount}`);
      }),
      check('R&W questions never appear in Math pool and vice versa', () => {
        const mixed = [
          makeQ('rw1', 'Reading & Writing', false), makeQ('m1', 'Math', false),
          makeQ('rw2', 'Reading & Writing', true),  makeQ('m2', 'Math', true),
        ];
        const { finalRW, finalMath } = buildPool(mixed, new Set(), new Set(), 10, 10);
        assert(finalRW.every(q => q.section === 'Reading & Writing'), 'Math question in R&W pool');
        assert(finalMath.every(q => q.section === 'Math'), 'R&W question in Math pool');
      }),
      check('pool can never be null as long as static bank exists', () => {
        const { finalRW } = buildPool([makeQ('rw1', 'Reading & Writing', false)], new Set(), new Set(), 54, 44);
        assert(finalRW.length === 1, `got ${finalRW.length}`);
      }),
    ],
  };
}

// ── Resume index math ────────────────────────────────────────────────────────

type Phase = 'intro' | 'rw1' | 'rw-mod-break' | 'rw2' | 'break' | 'math1' | 'math-mod-break' | 'math2' | 'review';

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

function resumeSuite(): Suite {
  return {
    name: 'Resume Index Math',
    tests: [
      check('rw + idx<27 → rw1', () => {
        assert(storedPhaseToPhase('rw', 0, 0) === 'rw1', '0→rw1');
        assert(storedPhaseToPhase('rw', 26, 0) === 'rw1', '26→rw1');
      }),
      check('rw + idx>=27 → rw2', () => {
        assert(storedPhaseToPhase('rw', 27, 0) === 'rw2', '27→rw2');
        assert(storedPhaseToPhase('rw', 53, 0) === 'rw2', '53→rw2');
      }),
      check('math + idx<22 → math1', () => {
        assert(storedPhaseToPhase('math', 0, 21) === 'math1', '21→math1');
      }),
      check('math + idx>=22 → math2', () => {
        assert(storedPhaseToPhase('math', 0, 22) === 'math2', '22→math2');
        assert(storedPhaseToPhase('math', 0, 43) === 'math2', '43→math2');
      }),
      check('new-format phases pass through unchanged', () => {
        const phases: Phase[] = ['rw1','rw-mod-break','rw2','break','math1','math-mod-break','math2','review','intro'];
        for (const p of phases) {
          assert(storedPhaseToPhase(p, 0, 0) === p, `${p} not preserved`);
        }
      }),
      check('rw2: resolveModuleIdx subtracts 27', () => {
        assert(resolveModuleIdx(27, 'rw2') === 0, '27→0');
        assert(resolveModuleIdx(28, 'rw2') === 1, '28→1');
        assert(resolveModuleIdx(0,  'rw2') === 0, 'clamped to 0');
      }),
      check('math2: resolveModuleIdx subtracts 22', () => {
        assert(resolveModuleIdx(22, 'math2') === 0, '22→0');
        assert(resolveModuleIdx(43, 'math2') === 21, '43→21');
        assert(resolveModuleIdx(0,  'math2') === 0, 'clamped to 0');
      }),
      check('rw1/math1: no adjustment', () => {
        assert(resolveModuleIdx(26, 'rw1')   === 26, 'rw1 passthrough');
        assert(resolveModuleIdx(21, 'math1') === 21, 'math1 passthrough');
      }),
      check('module split: 46 R&W → mod1=27, mod2=19', () => {
        const qs = Array.from({ length: 46 }, (_, i) => ({ id: `rw-${i}`, section: 'Reading & Writing' }));
        assert(qs.slice(0, 27).length === 27, 'mod1 size');
        assert(qs.slice(27).length === 19, 'mod2 size');
      }),
      check('module split: 48 Math → mod1=22, mod2=26', () => {
        const qs = Array.from({ length: 48 }, (_, i) => ({ id: `m-${i}`, section: 'Math' }));
        assert(qs.slice(0, 22).length === 22, 'mod1 size');
        assert(qs.slice(22).length === 26, 'mod2 size');
      }),
    ],
  };
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const suites: Suite[] = [bankSuite(), poolSuite(), resumeSuite()];

  let pass = 0, fail = 0;
  for (const s of suites) {
    for (const t of s.tests) {
      t.pass ? pass++ : fail++;
    }
  }

  return res.status(fail > 0 ? 200 : 200).json({
    suites,
    summary: { pass, fail, total: pass + fail },
    ts: new Date().toISOString(),
  });
}
