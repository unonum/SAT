/**
 * Hourly cron job — generates ~10 fresh SAT questions per run.
 * Cycles through all 24 topic/difficulty combinations using the current UTC hour.
 * Run every hour via cron-job.org: schedule "0 * * * *"
 * After 24 hours: all topics and difficulties are covered (~240 new questions/day).
 *
 * Each run completes in ~20s (two LLM calls in parallel), well within cron-job.org's 30s timeout.
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

export const maxDuration = 60;

// 24 batches — one per hour of the day
const BATCHES: Array<{ topic: string; section: string; difficulty: string }> = [
  { topic: 'algebra',               section: 'Math',               difficulty: 'easy'   },
  { topic: 'algebra',               section: 'Math',               difficulty: 'medium' },
  { topic: 'algebra',               section: 'Math',               difficulty: 'hard'   },
  { topic: 'advanced-math',         section: 'Math',               difficulty: 'easy'   },
  { topic: 'advanced-math',         section: 'Math',               difficulty: 'medium' },
  { topic: 'advanced-math',         section: 'Math',               difficulty: 'hard'   },
  { topic: 'problem-solving-data',  section: 'Math',               difficulty: 'easy'   },
  { topic: 'problem-solving-data',  section: 'Math',               difficulty: 'medium' },
  { topic: 'problem-solving-data',  section: 'Math',               difficulty: 'hard'   },
  { topic: 'geometry-trig',         section: 'Math',               difficulty: 'easy'   },
  { topic: 'geometry-trig',         section: 'Math',               difficulty: 'medium' },
  { topic: 'geometry-trig',         section: 'Math',               difficulty: 'hard'   },
  { topic: 'reading-comprehension', section: 'Reading & Writing',  difficulty: 'easy'   },
  { topic: 'reading-comprehension', section: 'Reading & Writing',  difficulty: 'medium' },
  { topic: 'reading-comprehension', section: 'Reading & Writing',  difficulty: 'hard'   },
  { topic: 'vocabulary-in-context', section: 'Reading & Writing',  difficulty: 'easy'   },
  { topic: 'vocabulary-in-context', section: 'Reading & Writing',  difficulty: 'medium' },
  { topic: 'vocabulary-in-context', section: 'Reading & Writing',  difficulty: 'hard'   },
  { topic: 'grammar',               section: 'Reading & Writing',  difficulty: 'easy'   },
  { topic: 'grammar',               section: 'Reading & Writing',  difficulty: 'medium' },
  { topic: 'grammar',               section: 'Reading & Writing',  difficulty: 'hard'   },
  { topic: 'rhetoric-expression',   section: 'Reading & Writing',  difficulty: 'easy'   },
  { topic: 'rhetoric-expression',   section: 'Reading & Writing',  difficulty: 'medium' },
  { topic: 'rhetoric-expression',   section: 'Reading & Writing',  difficulty: 'hard'   },
];

// Use gpt-4o-mini for cron (fast, ~3s per call vs ~15s for gpt-4o)
const COUNT_PER_BATCH = 8;

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

// Single fast model for cron (gpt-4o-mini: ~3s vs gpt-4o ~15s)
async function generateQuestions(
  topic: string, difficulty: string, count: number, section: string,
  contextText: string, existingCount: number,
): Promise<RawQuestion[]> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(topic, difficulty, count, section, contextText, existingCount) }],
    temperature: 0.8,
  });
  return parseQuestionsFromText(resp.choices[0]?.message?.content ?? '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Optional secret check
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const valid =
      req.headers['authorization'] === `Bearer ${cronSecret}` ||
      req.query.secret === cronSecret;
    if (!valid) return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN ||
      !process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Missing required env vars' });
  }

  // Pick which batch to run based on current UTC hour (cycles every 24 hours)
  const hourIndex = req.query.batch
    ? Number(req.query.batch) % BATCHES.length
    : new Date().getUTCHours() % BATCHES.length;

  const { topic, section, difficulty } = BATCHES[hourIndex];

  try {
    await ensureRagSchema();

    // Skip chunk lookup if no PDFs have been uploaded — saves ~2s per run
    let contextText = `General SAT content for ${topic} at ${difficulty} level.`;
    let topChunkId: string | null = null;

    const allChunks = await fetchAllChunks();
    if (allChunks.length > 0) {
      // Use gpt-4o-mini for embeddings lookup too (same key, cheaper)
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

    const raw = await generateQuestions(topic, difficulty, COUNT_PER_BATCH, section, contextText, existing.length);

    const novel = dedup(raw).filter(
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
      } as RagQuestionRow);
      saved++;
    }

    console.log(`[cron-generate] batch ${hourIndex} (${topic}/${difficulty}): saved ${saved}/${raw.length}`);
    return res.status(200).json({ ok: true, batch: hourIndex, topic, difficulty, saved, total: raw.length });

  } catch (err) {
    console.error('[cron-generate] error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
