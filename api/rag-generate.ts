import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ensureRagSchema,
  fetchAllChunks,
  fetchRagQuestions,
  upsertRagQuestion,
  cosineSimilarity,
  type RagQuestionRow,
} from './_lib/turso.js';
import { checkRateLimit, pruneRateLimitStore } from './_lib/rateLimit.js';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

function wordOverlap(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  let overlap = 0;
  for (const w of setA) {
    if (setB.has(w)) overlap++;
  }
  const maxSize = Math.max(setA.size, setB.size);
  return maxSize === 0 ? 0 : overlap / maxSize;
}

function deduplicateQuestions(questions: RawQuestion[]): RawQuestion[] {
  const unique: RawQuestion[] = [];
  for (const q of questions) {
    const isDupe = unique.some((u) => wordOverlap(u.prompt ?? '', q.prompt ?? '') > 0.8);
    if (!isDupe) unique.push(q);
  }
  return unique;
}

interface RawQuestion {
  id?: string;
  topic?: string;
  subtopic?: string;
  section?: string;
  difficulty?: string;
  passage?: string | null;
  prompt?: string;
  choices?: Array<{ id: string; text: string }>;
  correct?: string;
  parTimeSec?: number;
  explanation?: {
    correctWhy?: string;
    fastStrategy?: string;
    simplerView?: string;
    trapNote?: string;
    timeTrick?: string;
    whyWrong?: Record<string, string>;
  };
  sourceChunk?: string | null;
}

function parseQuestionsFromText(text: string): RawQuestion[] {
  // Try to extract JSON array from the response
  const trimmed = text.trim();
  // Look for JSON array
  const startIdx = trimmed.indexOf('[');
  const endIdx = trimmed.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1) return [];
  try {
    return JSON.parse(trimmed.slice(startIdx, endIdx + 1)) as RawQuestion[];
  } catch {
    return [];
  }
}

async function generateWithOpenAI(
  topic: string,
  difficulty: string,
  count: number,
  section: string,
  contextText: string,
  existingCount = 0
): Promise<RawQuestion[]> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = buildSystemPrompt(topic, difficulty, count, section, contextText, existingCount);

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-2024-11-20',
    messages: [{ role: 'user', content: systemPrompt }],
    temperature: 0.8,
  });

  const content = resp.choices[0]?.message?.content ?? '';
  return parseQuestionsFromText(content);
}

async function generateWithAnthropic(
  topic: string,
  difficulty: string,
  count: number,
  section: string,
  contextText: string,
  existingCount = 0
): Promise<RawQuestion[]> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = buildSystemPrompt(topic, difficulty, count, section, contextText, existingCount);

  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-6-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: systemPrompt }],
  });

  const content = resp.content[0]?.type === 'text' ? resp.content[0].text : '';
  return parseQuestionsFromText(content);
}

function buildSystemPrompt(
  topic: string,
  difficulty: string,
  count: number,
  section: string,
  contextText: string,
  existingCount: number
): string {
  const ts = Date.now();
  const noveltyNote = existingCount > 0
    ? `IMPORTANT: There are already ${existingCount} questions for this topic/difficulty in the database. Generate completely NEW questions that test DIFFERENT concepts, scenarios, or passages — do not repeat or rephrase existing ones.`
    : '';
  return `You are an expert SAT question writer. Generate exactly ${count} novel, non-repetitive SAT-style questions for the topic "${topic}" at "${difficulty}" difficulty for the "${section}" section. Use the provided context material to inform the questions but create original content. ${noveltyNote}

CRITICAL RULES:
1. Return ONLY valid JSON array, no markdown, no explanation.
2. SELF-CONTAINED (MANDATORY): Every question must be fully answerable from ONLY the text in "prompt" and "passage". NEVER reference a table, graph, chart, figure, or data that is not written out in the "passage" field. If the question needs data, include the complete data as plain text in "passage". If no data is needed, set passage to null. Questions that say "the table shows..." without including that table in passage are INVALID.
Each question must follow this exact schema:
{
  "id": "rag-${topic}-${ts}-0",
  "topic": "${topic}",
  "subtopic": "specific subtopic",
  "section": "${section}",
  "difficulty": "${difficulty}",
  "passage": "optional passage text or null",
  "prompt": "the question prompt",
  "choices": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],
  "correct": "A",
  "parTimeSec": 60,
  "explanation": {
    "correctWhy": "...",
    "fastStrategy": "...",
    "simplerView": "...",
    "trapNote": "...",
    "timeTrick": "...",
    "whyWrong": {"A":"...","B":"...","C":"...","D":"..."}
  },
  "sourceChunk": null
}

Context material:
${contextText}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await ensureRagSchema();

  const { topic, difficulty, count = 5, section = 'Math' } = req.body ?? {};
  if (!topic || !difficulty) {
    return res.status(400).json({ error: 'topic and difficulty are required' });
  }

  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY env var is not set' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY env var is not set' });

  // Rate limit: max 20 generation requests per IP per minute (admin tool)
  pruneRateLimitStore();
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(`rag-generate:${ip}`, 20, 60_000)) {
    return res.status(429).json({ error: 'Too many requests — please wait before generating more.' });
  }

  try {
    // Fetch all chunks and find top 5 by cosine similarity
    const allChunks = await fetchAllChunks();

    let contextText = '';
    let topChunkId: string | null = null;

    if (allChunks.length > 0) {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const queryString = `SAT ${topic} ${difficulty} questions ${section}`;
      const embResp = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: [queryString],
      });
      const queryEmbedding = embResp.data[0].embedding;

      const scored = allChunks.map((c) => ({
        ...c,
        score: cosineSimilarity(queryEmbedding, c.embedding),
      }));
      scored.sort((a, b) => b.score - a.score);
      const top5 = scored.slice(0, 5);
      contextText = top5.map((c) => c.content).join('\n\n---\n\n');
      topChunkId = top5[0]?.id ?? null;
    } else {
      contextText = `General SAT content for ${topic} at ${difficulty} level.`;
    }

    // Load existing questions for this topic to avoid regenerating duplicates
    const existing = await fetchRagQuestions({ topic, difficulty });
    const existingPrompts = existing.map((q) => q.prompt);

    // Generate from both models in parallel
    const [openaiQuestions, anthropicQuestions] = await Promise.allSettled([
      generateWithOpenAI(topic, difficulty, count, section, contextText, existing.length),
      generateWithAnthropic(topic, difficulty, count, section, contextText, existing.length),
    ]);

    const rawAll: RawQuestion[] = [];
    if (openaiQuestions.status === 'fulfilled') rawAll.push(...openaiQuestions.value);
    if (anthropicQuestions.status === 'fulfilled') rawAll.push(...anthropicQuestions.value);

    // Deduplicate within batch AND against existing DB questions
    const dedupedBatch = deduplicateQuestions(rawAll);
    const deduped = dedupedBatch.filter(
      (q) => q.prompt && !existingPrompts.some((ep) => wordOverlap(ep, q.prompt!) > 0.7)
    );
    const now = Date.now();

    const saved: RagQuestionRow[] = [];
    for (let i = 0; i < deduped.length; i++) {
      const raw = deduped[i];
      if (!raw.prompt || !raw.choices || !raw.correct) continue;

      const row: RagQuestionRow = {
        id: `rag-${topic}-${now}-${i}`,
        topic: raw.topic ?? topic,
        subtopic: raw.subtopic ?? topic,
        section: raw.section ?? section,
        difficulty: raw.difficulty ?? difficulty,
        passage: raw.passage ?? null,
        prompt: raw.prompt,
        choices: typeof raw.choices === 'string' ? raw.choices : JSON.stringify(raw.choices),
        correct: raw.correct,
        par_time_sec: raw.parTimeSec ?? 60,
        explanation:
          typeof raw.explanation === 'string'
            ? raw.explanation
            : JSON.stringify(raw.explanation ?? {}),
        source_chunk: raw.sourceChunk ?? topChunkId,
        created_at: now,
      };

      await upsertRagQuestion(row);
      saved.push(row);
    }

    return res.status(200).json({ ok: true, questions: saved, count: saved.length });
  } catch (err: unknown) {
    console.error('rag-generate error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
