/**
 * Nightly cron job — generates fresh SAT questions across all topics.
 * Triggered by Vercel Cron at 00:00 UTC daily (configured in vercel.json).
 * Requires CRON_SECRET env var to prevent unauthorized calls.
 *
 * Per run: 8 topics × 3 difficulties × 2 sections (where applicable) = up to 144 questions.
 * Each batch generates 5 questions from both GPT-4o + Claude → ~10 unique per batch.
 * Total target: ~120 new questions per night.
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

// ── Topic → section mapping ────────────────────────────────────────────────
const BATCHES: Array<{ topic: string; section: string; difficulties: string[] }> = [
  // Math topics
  { topic: 'algebra',              section: 'Math', difficulties: ['easy', 'medium', 'hard'] },
  { topic: 'advanced-math',        section: 'Math', difficulties: ['easy', 'medium', 'hard'] },
  { topic: 'problem-solving-data', section: 'Math', difficulties: ['easy', 'medium', 'hard'] },
  { topic: 'geometry-trig',        section: 'Math', difficulties: ['easy', 'medium', 'hard'] },
  // Reading & Writing topics
  { topic: 'reading-comprehension',  section: 'Reading & Writing', difficulties: ['easy', 'medium', 'hard'] },
  { topic: 'vocabulary-in-context',  section: 'Reading & Writing', difficulties: ['easy', 'medium', 'hard'] },
  { topic: 'grammar',                section: 'Reading & Writing', difficulties: ['easy', 'medium', 'hard'] },
  { topic: 'rhetoric-expression',    section: 'Reading & Writing', difficulties: ['easy', 'medium', 'hard'] },
];

// Questions generated per LLM per batch (2 LLMs → ~10 unique per batch after dedup)
const COUNT_PER_BATCH = 5;

// ── Helpers (duplicated from rag-generate.ts to keep cron self-contained) ──

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
  const noveltyNote = existingCount > 0
    ? `IMPORTANT: There are already ${existingCount} questions for this topic/difficulty. Generate completely NEW questions testing DIFFERENT concepts.`
    : '';
  return `You are an expert SAT question writer. Generate exactly ${count} novel SAT-style questions for topic "${topic}" at "${difficulty}" difficulty for the "${section}" section. ${noveltyNote}

CRITICAL RULES:
1. Return ONLY a valid JSON array — no markdown, no explanation.
2. Every question's "section" field MUST be "${section}".
3. SELF-CONTAINED: Every question must be fully answerable from only "prompt" and "passage". Never reference a graph, chart, table, or figure that isn't reproduced as plain text in "passage". Set passage to null if no external content is needed.

Schema:
{"id":"rag-${topic}-${ts}-0","topic":"${topic}","subtopic":"specific subtopic","section":"${section}","difficulty":"${difficulty}","passage":null,"prompt":"...","choices":[{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],"correct":"A","parTimeSec":60,"explanation":{"correctWhy":"...","fastStrategy":"...","simplerView":"...","trapNote":"...","timeTrick":"...","whyWrong":{"A":"...","B":"...","C":"...","D":"..."}},"sourceChunk":null}

Context material:
${contextText}`;
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

// ── Main handler ────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow Vercel Cron (Authorization header) or explicit secret query param
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'];
    const querySecret = req.query.secret;
    const valid =
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret;
    if (!valid) return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN ||
      !process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Missing required env vars' });
  }

  await ensureRagSchema();

  // Pre-fetch all chunks once (reused for every batch)
  const allChunks = await fetchAllChunks();

  let OpenAI: ConstructorParameters<typeof import('openai').default>[0] extends infer T ? typeof import('openai').default : never;
  let openaiClient: import('openai').default | null = null;
  if (allChunks.length > 0) {
    const OpenAIModule = await import('openai');
    openaiClient = new OpenAIModule.default({ apiKey: process.env.OPENAI_API_KEY });
  }

  const log: Array<{ topic: string; difficulty: string; saved: number; skipped: number }> = [];
  let totalSaved = 0;

  for (const { topic, section, difficulties } of BATCHES) {
    for (const difficulty of difficulties) {
      try {
        // Find top-5 relevant chunks for this topic
        let contextText = `General SAT content for ${topic} at ${difficulty} level.`;
        let topChunkId: string | null = null;

        if (allChunks.length > 0 && openaiClient) {
          const queryEmbedding = (await openaiClient.embeddings.create({
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

        const [oaiResult, anthropicResult] = await Promise.allSettled([
          generateWithOpenAI(topic, difficulty, COUNT_PER_BATCH, section, contextText, existing.length),
          generateWithAnthropic(topic, difficulty, COUNT_PER_BATCH, section, contextText, existing.length),
        ]);

        const raw: RawQuestion[] = [];
        if (oaiResult.status === 'fulfilled') raw.push(...oaiResult.value);
        if (anthropicResult.status === 'fulfilled') raw.push(...anthropicResult.value);

        const dedupedBatch = dedup(raw);
        const novel = dedupedBatch.filter(
          (q) => q.prompt && !existingPrompts.some((ep) => wordOverlap(ep, q.prompt!) > 0.7)
        );

        const now = Date.now();
        let saved = 0;
        for (let i = 0; i < novel.length; i++) {
          const q = novel[i];
          if (!q.prompt || !q.choices || !q.correct) continue;
          const row: RagQuestionRow = {
            id: `rag-${topic}-${now}-${i}`,
            topic: q.topic ?? topic,
            subtopic: q.subtopic ?? topic,
            section: q.section ?? section,
            difficulty: q.difficulty ?? difficulty,
            passage: q.passage ?? null,
            prompt: q.prompt,
            choices: typeof q.choices === 'string' ? q.choices : JSON.stringify(q.choices),
            correct: q.correct,
            par_time_sec: (q.parTimeSec as number) ?? 60,
            explanation: typeof q.explanation === 'string' ? q.explanation : JSON.stringify(q.explanation ?? {}),
            source_chunk: q.sourceChunk ?? topChunkId,
            created_at: now,
          };
          await upsertRagQuestion(row);
          saved++;
          totalSaved++;
        }

        log.push({ topic, difficulty, saved, skipped: raw.length - novel.length });
      } catch (err) {
        console.error(`[cron-generate] ${topic}/${difficulty} failed:`, err);
        log.push({ topic, difficulty, saved: 0, skipped: -1 });
      }
    }
  }

  console.log(`[cron-generate] Done. Total saved: ${totalSaved}`, log);
  return res.status(200).json({ ok: true, totalSaved, log });
}
