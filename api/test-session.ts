import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  cosineSimilarity,
  ensureRagSchema,
  fetchAllChunks,
  fetchRagQuestions,
  getClient,
  upsertRagQuestion,
  type RagQuestionRow,
} from './_lib/turso.js';

export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: '4mb' } } };

type Difficulty = 'easy' | 'medium' | 'hard';
type Section = 'Math' | 'Reading & Writing';
type ChoiceId = 'A' | 'B' | 'C' | 'D';
type Choice = { id: ChoiceId; text: string };
type ClientQuestion = {
  id: string;
  topic: string;
  subtopic: string;
  section: Section;
  difficulty: Difficulty;
  passage?: string;
  prompt: string;
  choices: Choice[];
  correct: ChoiceId;
  parTimeSec: number;
  explanation: Record<string, unknown>;
  ragGenerated?: boolean;
  sourceChunk?: string;
};
type AttemptSummary = { questionId: string; topic: string; difficulty: Difficulty; correct: boolean; ts: number };
type Slot = { topic: string; section: Section; difficulty: Difficulty };

const TOPICS: Array<{ id: string; section: Section }> = [
  { id: 'algebra', section: 'Math' },
  { id: 'advanced-math', section: 'Math' },
  { id: 'problem-solving-data', section: 'Math' },
  { id: 'geometry-trig', section: 'Math' },
  { id: 'reading-comprehension', section: 'Reading & Writing' },
  { id: 'vocabulary-in-context', section: 'Reading & Writing' },
  { id: 'grammar', section: 'Reading & Writing' },
  { id: 'rhetoric-expression', section: 'Reading & Writing' },
];
const VALID_DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard']);
const VALID_SECTIONS = new Set<Section>(['Math', 'Reading & Writing']);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function lexicalOverlap(a: string, b: string): number {
  const wa = new Set(normalize(a).split(/\s+/).filter((w) => w.length > 2));
  const wb = new Set(normalize(b).split(/\s+/).filter((w) => w.length > 2));
  if (!wa.size || !wb.size) return 0;
  let n = 0;
  for (const w of wa) if (wb.has(w)) n++;
  return n / Math.max(wa.size, wb.size);
}

function isNovel(prompt: string, existing: string[]): boolean {
  return !existing.some((e) => lexicalOverlap(e, prompt) >= 0.68);
}

function masteryDifficulty(topic: string, attempts: AttemptSummary[]): Difficulty {
  const recent = attempts.filter((a) => a.topic === topic).sort((a, b) => b.ts - a.ts).slice(0, 8);
  if (!recent.length) return 'easy';
  const acc = recent.filter((a) => a.correct).length / recent.length;
  if (acc >= 0.8) return 'hard';
  if (acc >= 0.5) return 'medium';
  return 'easy';
}

function buildSlots(count: number, requestedTopics: string[], attempts: AttemptSummary[]): Slot[] {
  const allowed = requestedTopics.length ? TOPICS.filter((t) => requestedTopics.includes(t.id)) : TOPICS;
  const topics = allowed.length ? allowed : TOPICS;
  return Array.from({ length: count }, (_, i) => {
    const t = topics[i % topics.length];
    return { ...t, difficulty: masteryDifficulty(t.id, attempts) };
  });
}

function parseQuestions(text: string): ClientQuestion[] {
  const s = text.indexOf('['), e = text.lastIndexOf(']');
  if (s < 0 || e <= s) return [];
  try { return JSON.parse(text.slice(s, e + 1)) as ClientQuestion[]; } catch { return []; }
}

function isValid(q: ClientQuestion | undefined): q is ClientQuestion {
  if (!q?.prompt || !q.subtopic || !VALID_SECTIONS.has(q.section) || !VALID_DIFFICULTIES.has(q.difficulty)) return false;
  if (!Array.isArray(q.choices) || q.choices.length !== 4) return false;
  const ids = q.choices.map((c) => c.id);
  return ids.join('') === 'ABCD' && ids.includes(q.correct) && q.choices.every((c) => Boolean(c.text?.trim()));
}

async function ensureNoveltySchema(): Promise<void> {
  const db = getClient();
  await db.execute(`CREATE TABLE IF NOT EXISTS question_exposures (
    user_email TEXT NOT NULL, question_id TEXT NOT NULL, mode TEXT NOT NULL,
    exposed_at INTEGER NOT NULL, PRIMARY KEY (user_email, question_id)
  )`);
}

async function loadSeenIds(email: string, attempts: AttemptSummary[]): Promise<Set<string>> {
  const ids = new Set(attempts.map((a) => a.questionId));
  if (!email) return ids;
  try {
    const db = getClient();
    const [att, exp] = await Promise.all([
      db.execute({ sql: 'SELECT DISTINCT question_id FROM attempts WHERE user_email = ?', args: [email.toLowerCase()] }),
      db.execute({ sql: 'SELECT question_id FROM question_exposures WHERE user_email = ?', args: [email.toLowerCase()] }),
    ]);
    for (const r of [...att.rows, ...exp.rows]) ids.add(String(r.question_id));
  } catch { /* best-effort */ }
  return ids;
}

async function saveExposures(email: string, mode: string, questions: ClientQuestion[]): Promise<void> {
  if (!email || !questions.length) return;
  const now = Date.now();
  try {
    await getClient().batch(questions.map((q) => ({
      sql: `INSERT OR IGNORE INTO question_exposures (user_email, question_id, mode, exposed_at) VALUES (?, ?, ?, ?)`,
      args: [email.toLowerCase(), q.id, mode, now],
    })), 'write');
  } catch { /* best-effort */ }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await ensureRagSchema();
    await ensureNoveltySchema();

    const {
      email = '', mode = 'practice', count = 8, topics = [],
      attempts = [], avoidPrompts = [], fallbackQuestions = [],
    } = req.body ?? {};

    const requestedCount = Math.max(1, Math.min(20, Number(count) || 8));
    const attemptSummaries = (Array.isArray(attempts) ? attempts : []) as AttemptSummary[];
    const slots = buildSlots(requestedCount, Array.isArray(topics) ? topics : [], attemptSummaries);
    const seenIds = await loadSeenIds(String(email), attemptSummaries);

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ── 1. Fetch stored RAG questions unseen by this student ──────────────
    const [storedRows, chunks] = await Promise.all([fetchRagQuestions(), fetchAllChunks()]);
    const unseenStored = storedRows.filter((r) => !seenIds.has(r.id));

    // ── 2. Embed a single combined query for RAG context retrieval ─────────
    const queryText = `SAT ${slots.map((s) => `${s.section} ${s.topic} ${s.difficulty}`).join(', ')} questions`;
    let contextText = `General SAT content for these topics.`;
    let topChunkId: string | null = null;

    if (chunks.length > 0) {
      const embResp = await openai.embeddings.create({ model: 'text-embedding-3-small', input: [queryText] });
      const qv = embResp.data[0].embedding;
      const scored = chunks.map((c) => ({ ...c, score: cosineSimilarity(qv, c.embedding) }))
        .sort((a, b) => b.score - a.score);
      const top8 = scored.slice(0, 8);
      contextText = top8.map((c) => c.content).join('\n\n---\n\n');
      topChunkId = top8[0]?.id ?? null;
    }

    // ── 3. Build forbidden prompts list (stored + client avoids) ──────────
    const clientAvoid = (Array.isArray(avoidPrompts) ? avoidPrompts : []).filter(Boolean).map(String);
    const storedPrompts = storedRows.map((r) => r.prompt);
    const forbiddenPrompts = [...new Set([...clientAvoid, ...storedPrompts])];

    // ── 4. Generate all slots in a SINGLE LLM call ────────────────────────
    const now = Date.now();
    const slotDescriptions = slots.map((s, i) => ({
      index: i,
      topic: s.topic,
      section: s.section,
      difficulty: s.difficulty,
    }));

    const prompt = `You are an expert SAT item writer. Generate exactly ${slots.length} brand-new SAT questions — one per slot below.

SLOTS:
${JSON.stringify(slotDescriptions, null, 2)}

CONTEXT MATERIAL (use to inspire questions — do NOT copy verbatim):
${contextText.slice(0, 6000)}

STRICT RULES:
- Return ONLY a valid JSON array — no markdown fences, no explanation.
- Every question must be entirely original — different wording, scenario, numbers, and reasoning path from all FORBIDDEN examples.
- Each object must have: topic, subtopic, section, difficulty, passage (string|null), prompt, choices (exactly [{id:"A",...},{id:"B",...},{id:"C",...},{id:"D",...}]), correct, parTimeSec, explanation (with correctWhy, fastStrategy, simplerView, trapNote, timeTrick, whyWrong).

FORBIDDEN PROMPTS (do not reuse or paraphrase):
${forbiddenPrompts.slice(-60).map((p, i) => `${i + 1}. ${p.slice(0, 120)}`).join('\n')}`;

    // Call OpenAI and Anthropic in parallel for more variety
    const [oaiResult, anthropicResult] = await Promise.allSettled([
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
      }).then((r) => parseQuestions(r.choices[0]?.message?.content ?? '')),

      (async () => {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const r = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        });
        const text = r.content[0]?.type === 'text' ? r.content[0].text : '';
        return parseQuestions(text);
      })(),
    ]);

    const allGenerated: ClientQuestion[] = [];
    if (oaiResult.status === 'fulfilled') allGenerated.push(...oaiResult.value);
    if (anthropicResult.status === 'fulfilled') allGenerated.push(...anthropicResult.value);

    // ── 5. Deduplicate and validate ────────────────────────────────────────
    const acceptedPrompts: string[] = [...forbiddenPrompts];
    const finalQuestions: ClientQuestion[] = [];

    for (const q of allGenerated) {
      if (finalQuestions.length >= requestedCount) break;
      if (!isValid(q)) continue;
      if (!isNovel(q.prompt, acceptedPrompts)) continue;
      const slot = slots[finalQuestions.length] ?? slots[slots.length - 1];
      const id = `rag-${slot.topic}-${now}-${finalQuestions.length}-${Math.random().toString(36).slice(2, 7)}`;
      const question: ClientQuestion = {
        ...q,
        id,
        topic: slot.topic,
        section: slot.section,
        difficulty: slot.difficulty,
        ragGenerated: true,
        sourceChunk: topChunkId ?? undefined,
      };
      finalQuestions.push(question);
      acceptedPrompts.push(q.prompt);
    }

    // ── 6. Save generated questions to DB ─────────────────────────────────
    for (const q of finalQuestions) {
      const row: RagQuestionRow = {
        id: q.id,
        topic: q.topic,
        subtopic: q.subtopic,
        section: q.section,
        difficulty: q.difficulty,
        passage: q.passage ?? null,
        prompt: q.prompt,
        choices: JSON.stringify(q.choices),
        correct: q.correct,
        par_time_sec: Number(q.parTimeSec) || 60,
        explanation: JSON.stringify(q.explanation ?? {}),
        source_chunk: q.sourceChunk ?? null,
        created_at: now,
      };
      await upsertRagQuestion(row);
    }

    // ── 7. Fill remaining slots from unseen stored questions ──────────────
    const acceptedIds = new Set(finalQuestions.map((q) => q.id));
    const acceptedFinalPrompts = finalQuestions.map((q) => q.prompt);

    for (const row of unseenStored) {
      if (finalQuestions.length >= requestedCount) break;
      if (acceptedIds.has(row.id)) continue;
      if (!isNovel(row.prompt, [...forbiddenPrompts, ...acceptedFinalPrompts])) continue;
      let choices: Choice[] = [];
      try { choices = JSON.parse(row.choices) as Choice[]; } catch { continue; }
      finalQuestions.push({
        id: row.id,
        topic: row.topic,
        subtopic: row.subtopic,
        section: row.section as Section,
        difficulty: row.difficulty as Difficulty,
        passage: row.passage ?? undefined,
        prompt: row.prompt,
        choices,
        correct: row.correct as ChoiceId,
        parTimeSec: row.par_time_sec,
        explanation: typeof row.explanation === 'string'
          ? (JSON.parse(row.explanation) as Record<string, unknown>)
          : (row.explanation as Record<string, unknown>),
        ragGenerated: true,
        sourceChunk: row.source_chunk ?? undefined,
      });
      acceptedFinalPrompts.push(row.prompt);
    }

    // ── 8. Fallback to client-supplied static questions ───────────────────
    if (finalQuestions.length < requestedCount) {
      const fallbackSeenIds = new Set(finalQuestions.map((q) => q.id));
      const fallback = (Array.isArray(fallbackQuestions) ? fallbackQuestions : []) as ClientQuestion[];
      for (const q of fallback) {
        if (finalQuestions.length >= requestedCount) break;
        if (seenIds.has(q.id) || fallbackSeenIds.has(q.id)) continue;
        if (!isNovel(q.prompt, acceptedFinalPrompts)) continue;
        finalQuestions.push(q);
        acceptedFinalPrompts.push(q.prompt);
      }
    }

    if (!finalQuestions.length) {
      return res.status(503).json({ error: 'No novel questions available — please try again' });
    }

    await saveExposures(String(email), String(mode), finalQuestions);

    return res.status(200).json({
      sessionId: `session-${now}-${Math.random().toString(36).slice(2, 8)}`,
      mode,
      questions: finalQuestions.slice(0, requestedCount),
      source: finalQuestions.some((q) => q.ragGenerated) ? 'rag-llm' : 'static-fallback',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/test-session]', error);
    return res.status(500).json({ error: message });
  }
}
