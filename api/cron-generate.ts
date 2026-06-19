/**
 * Hourly cron — generates ~10 fresh SAT questions per run using gpt-4o + Claude.
 * Responds 200 immediately (so cron-job.org doesn't time out at 30s).
 * Vercel keeps the function alive up to maxDuration (300s) to finish generation.
 * Cycles through 24 topic/difficulty combos, one per UTC hour.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ensureRagSchema,
  fetchAllChunks,
  fetchRagQuestions,
  upsertRagQuestion,
  cosineSimilarity,
  type RagQuestionRow,
} from './_lib/turso.js';

export const maxDuration = 300;

const BATCHES: Array<{ topic: string; section: string; difficulty: string }> = [
  { topic: 'algebra',               section: 'Math',              difficulty: 'easy'   },
  { topic: 'algebra',               section: 'Math',              difficulty: 'medium' },
  { topic: 'algebra',               section: 'Math',              difficulty: 'hard'   },
  { topic: 'advanced-math',         section: 'Math',              difficulty: 'easy'   },
  { topic: 'advanced-math',         section: 'Math',              difficulty: 'medium' },
  { topic: 'advanced-math',         section: 'Math',              difficulty: 'hard'   },
  { topic: 'problem-solving-data',  section: 'Math',              difficulty: 'easy'   },
  { topic: 'problem-solving-data',  section: 'Math',              difficulty: 'medium' },
  { topic: 'problem-solving-data',  section: 'Math',              difficulty: 'hard'   },
  { topic: 'geometry-trig',         section: 'Math',              difficulty: 'easy'   },
  { topic: 'geometry-trig',         section: 'Math',              difficulty: 'medium' },
  { topic: 'geometry-trig',         section: 'Math',              difficulty: 'hard'   },
  { topic: 'reading-comprehension', section: 'Reading & Writing', difficulty: 'easy'   },
  { topic: 'reading-comprehension', section: 'Reading & Writing', difficulty: 'medium' },
  { topic: 'reading-comprehension', section: 'Reading & Writing', difficulty: 'hard'   },
  { topic: 'vocabulary-in-context', section: 'Reading & Writing', difficulty: 'easy'   },
  { topic: 'vocabulary-in-context', section: 'Reading & Writing', difficulty: 'medium' },
  { topic: 'vocabulary-in-context', section: 'Reading & Writing', difficulty: 'hard'   },
  { topic: 'grammar',               section: 'Reading & Writing', difficulty: 'easy'   },
  { topic: 'grammar',               section: 'Reading & Writing', difficulty: 'medium' },
  { topic: 'grammar',               section: 'Reading & Writing', difficulty: 'hard'   },
  { topic: 'rhetoric-expression',   section: 'Reading & Writing', difficulty: 'easy'   },
  { topic: 'rhetoric-expression',   section: 'Reading & Writing', difficulty: 'medium' },
  { topic: 'rhetoric-expression',   section: 'Reading & Writing', difficulty: 'hard'   },
];

const COUNT_PER_BATCH = 5;

function wordOverlap(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  let overlap = 0;
  for (const w of setA) if (setB.has(w)) overlap++;
  const maxSize = Math.max(setA.size, setB.size);
  return maxSize === 0 ? 0 : overlap / maxSize;
}

interface RawQuestion {
  topic?: string; subtopic?: string; section?: string; difficulty?: string;
  passage?: string | null; prompt?: string;
  choices?: Array<{ id: string; text: string }>;
  correct?: string; parTimeSec?: number;
  explanation?: Record<string, unknown>;
  sourceChunk?: string | null;
}

function parseQuestionsFromText(text: string): RawQuestion[] {
  const trimmed = text.trim();
  const s = trimmed.indexOf('[');
  const e = trimmed.lastIndexOf(']');
  if (s === -1 || e === -1) return [];
  try { return JSON.parse(trimmed.slice(s, e + 1)) as RawQuestion[]; }
  catch { return []; }
}

function dedup(qs: RawQuestion[]): RawQuestion[] {
  const unique: RawQuestion[] = [];
  for (const q of qs) {
    if (!unique.some((u) => wordOverlap(u.prompt ?? '', q.prompt ?? '') > 0.8)) unique.push(q);
  }
  return unique;
}

function buildPrompt(
  topic: string, difficulty: string, count: number, section: string,
  contextText: string, existingCount: number,
): string {
  const ts = Date.now();
  const isMath = section === 'Math';
  const sectionGuidance = isMath
    ? 'Math questions only: algebra, equations, geometry, data analysis, word problems with numbers. NO grammar, vocabulary, reading passages, or writing skills.'
    : 'Reading & Writing questions only: reading comprehension, vocabulary in context, grammar/usage, rhetorical analysis. NO arithmetic, algebra, or math calculations.';

  const noveltyNote = existingCount > 0
    ? `IMPORTANT: There are already ${existingCount} questions for this topic/difficulty. Generate completely NEW questions testing DIFFERENT concepts, scenarios, and passages.`
    : '';

  return `You are an expert SAT question writer for the Digital SAT. Generate exactly ${count} original SAT-style questions.

TOPIC: ${topic}
DIFFICULTY: ${difficulty}
SECTION: ${section}

SECTION RULE (CRITICAL — violations are discarded):
${sectionGuidance}
Every question's "section" field MUST be exactly "${section}". Questions with the wrong section will be deleted.

${noveltyNote}

OTHER RULES:
1. Return ONLY a valid JSON array — no markdown, no explanation, no preamble.
2. SELF-CONTAINED: Every question must be fully answerable from only "prompt" and "passage". Never reference a graph, chart, table, or figure that isn't fully reproduced as plain text in "passage". Set passage to null if no external content is needed.
3. Each question must have exactly 4 choices (A, B, C, D) with one correct answer.
4. The explanation must be detailed and helpful for a student who got it wrong.

JSON schema (return an array of these):
{
  "topic": "${topic}",
  "subtopic": "specific subtopic within ${topic}",
  "section": "${section}",
  "difficulty": "${difficulty}",
  "passage": null,
  "prompt": "The question stem goes here.",
  "choices": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],
  "correct": "A",
  "parTimeSec": 60,
  "explanation": {
    "correctWhy": "Why the correct answer is right.",
    "fastStrategy": "A quick approach to solve this.",
    "simplerView": "Explain it simply.",
    "trapNote": "Common trap students fall into.",
    "timeTrick": "Time-saving tip.",
    "whyWrong": {"A":"Why A is wrong","B":"Why B is wrong","C":"Why C is wrong","D":"Why D is wrong"}
  },
  "sourceChunk": null
}

Context material:
${contextText}

Generate the JSON array of ${count} questions now (id field is not needed):`;
}

async function generateWithOpenAI(
  topic: string, difficulty: string, count: number, section: string,
  contextText: string, existingCount: number,
): Promise<RawQuestion[]> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-2024-11-20',
    messages: [{ role: 'user', content: buildPrompt(topic, difficulty, count, section, contextText, existingCount) }],
    temperature: 0.8,
  });
  return parseQuestionsFromText(resp.choices[0]?.message?.content ?? '');
}

async function generateWithAnthropic(
  topic: string, difficulty: string, count: number, section: string,
  contextText: string, existingCount: number,
): Promise<RawQuestion[]> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-6-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildPrompt(topic, difficulty, count, section, contextText, existingCount) }],
  });
  const content = resp.content[0]?.type === 'text' ? resp.content[0].text : '';
  return parseQuestionsFromText(content);
}

async function runGeneration(topic: string, section: string, difficulty: string): Promise<void> {
  await ensureRagSchema();

  // Find top-5 relevant chunks (skip if no PDFs uploaded yet)
  let contextText = `General SAT content for ${topic} at ${difficulty} level.`;
  let topChunkId: string | null = null;

  const allChunks = await fetchAllChunks();
  if (allChunks.length > 0) {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const queryEmbedding = (await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: [`SAT ${topic} ${difficulty} questions ${section}`],
    })).data[0].embedding;

    const top5 = allChunks
      .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    contextText = top5.map((c) => c.content).join('\n\n---\n\n');
    topChunkId = top5[0]?.id ?? null;
  }

  const existing = await fetchRagQuestions({ topic, difficulty });
  const existingPrompts = existing.map((q) => q.prompt);

  // Both models in parallel for quality and quantity
  const [oaiResult, anthropicResult] = await Promise.allSettled([
    generateWithOpenAI(topic, difficulty, COUNT_PER_BATCH, section, contextText, existing.length),
    generateWithAnthropic(topic, difficulty, COUNT_PER_BATCH, section, contextText, existing.length),
  ]);

  const raw: RawQuestion[] = [];
  if (oaiResult.status === 'fulfilled') raw.push(...oaiResult.value);
  if (anthropicResult.status === 'fulfilled') raw.push(...anthropicResult.value);

  const dedupedBatch = dedup(raw);

  // Hard filter: discard any question with the wrong section
  const sectionCorrect = dedupedBatch.filter(
    (q) => !q.section || q.section === section
  );

  const novel = sectionCorrect.filter(
    (q) => q.prompt && !existingPrompts.some((ep) => wordOverlap(ep, q.prompt!) > 0.7)
  );

  const now = Date.now();
  let saved = 0;
  for (let i = 0; i < novel.length; i++) {
    const q = novel[i];
    if (!q.prompt || !q.choices || !q.correct) continue;
    await upsertRagQuestion({
      id: `rag-${topic}-${now}-${i}`,
      topic: q.topic ?? topic,
      subtopic: q.subtopic ?? topic,
      section,  // always use the expected section, not what the model returned
      difficulty: q.difficulty ?? difficulty,
      passage: q.passage ?? null,
      prompt: q.prompt,
      choices: typeof q.choices === 'string' ? q.choices : JSON.stringify(q.choices),
      correct: q.correct,
      par_time_sec: (q.parTimeSec as number) ?? 60,
      explanation: typeof q.explanation === 'string' ? q.explanation : JSON.stringify(q.explanation ?? {}),
      source_chunk: q.sourceChunk ?? topChunkId,
      created_at: now,
    } as RagQuestionRow);
    saved++;
  }

  console.log(`[cron-generate] ${topic}/${difficulty}/${section}: generated ${raw.length}, section-filtered ${dedupedBatch.length - sectionCorrect.length}, saved ${saved}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const valid =
      req.headers['authorization'] === `Bearer ${cronSecret}` ||
      req.query.secret === cronSecret;
    if (!valid) return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN ||
      !process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Missing required env vars (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, OPENAI_API_KEY, ANTHROPIC_API_KEY)' });
  }

  // Pick batch by UTC hour — cycles all 24 combos over 24 hours
  const hourIndex = req.query.batch !== undefined
    ? Number(req.query.batch) % BATCHES.length
    : new Date().getUTCHours() % BATCHES.length;

  const { topic, section, difficulty } = BATCHES[hourIndex];

  try {
    await runGeneration(topic, section, difficulty);
    return res.status(200).json({
      ok: true,
      batch: hourIndex,
      topic,
      section,
      difficulty,
      message: `Generation complete`,
    });
  } catch (err) {
    console.error('[cron-generate] error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
