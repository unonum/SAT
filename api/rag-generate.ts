import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ensureRagSchema,
  countChunks,
  fetchAllChunks,
  fetchRagQuestions,
  upsertRagQuestion,
  cosineSimilarity,
  type RagQuestionRow,
} from './_lib/turso.js';
import { checkRateLimit, pruneRateLimitStore } from './_lib/rateLimit.js';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };
export const maxDuration = 300;

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
    const isDupe = unique.some((u) => wordOverlap(u.prompt ?? '', q.prompt ?? '') > 0.9);
    if (!isDupe) unique.push(q);
  }
  return unique;
}

/**
 * A question is invalid if its prompt refers to reading content
 * ("the passage", "the text", "the author", an underlined portion, etc.)
 * but no passage was actually provided. Such questions are unanswerable.
 */
const PASSAGE_REFERENCE = /\b(the passage|the text|the excerpt|the paragraph|the author|the underlined (portion|word|phrase)|the sentence above|the preceding sentence|the following sentence|in context of the passage|in the context of the passage|based on the passage|according to the (passage|text|author)|the author's claim|the narrator|the speaker's)\b/i;

function needsPassageButHasNone(q: RawQuestion): boolean {
  const passage = (q.passage ?? '').trim();
  if (passage.length >= 15) return false; // real passage present
  return PASSAGE_REFERENCE.test(q.prompt ?? '');
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
2. SECTION RULE: Every question's "section" field MUST be "${section}". Do NOT generate Math-style calculation questions for Reading & Writing, and do NOT generate reading/grammar questions for Math.
3. SELF-CONTAINED (MANDATORY): Every question must be fully answerable from ONLY the text in "prompt" and "passage". NEVER reference a line graph, bar chart, scatter plot, pie chart, histogram, coordinate plane, table, figure, diagram, or any visual that is not fully reproduced as plain text in "passage". If the question needs data, include the COMPLETE data as plain text in "passage". If no external content is needed, set passage to null. Questions that mention "the line graph shows..." or "based on the graph..." without including that data in passage are INVALID and will be deleted.
4. PASSAGE REQUIRED WHEN REFERENCED (MANDATORY): If the "prompt" refers to "the passage", "the text", "the excerpt", "the author", "the underlined portion", a quoted word "in context", or any sentence/paragraph the student must read, then the FULL reading passage MUST be provided in the "passage" field. For vocabulary-in-context questions, "passage" must contain the complete sentence(s) showing the word in use. For grammar/editing questions, "passage" must contain the sentence being edited. A prompt that says "In the context of the passage..." or "what does the word X most nearly mean" with passage=null is INVALID and will be discarded. NEVER write a question about a passage without including that passage.
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

  // Validate env vars first — before any DB or AI calls — so the error message is clear
  if (!process.env.TURSO_DATABASE_URL) return res.status(500).json({ error: 'TURSO_DATABASE_URL env var is not set on the server.' });
  if (!process.env.TURSO_AUTH_TOKEN) return res.status(500).json({ error: 'TURSO_AUTH_TOKEN env var is not set on the server.' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY env var is not set on the server.' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY env var is not set on the server.' });

  const { topic, difficulty, count = 5, section = 'Math' } = req.body ?? {};
  if (!topic || !difficulty) {
    return res.status(400).json({ error: 'topic and difficulty are required' });
  }

  // Rate limit: max 20 generation requests per IP per minute (admin tool)
  pruneRateLimitStore();
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(`rag-generate:${ip}`, 20, 60_000)) {
    return res.status(429).json({ error: 'Too many requests — please wait before generating more.' });
  }

  try {
    await ensureRagSchema();

    let contextText = '';
    let topChunkId: string | null = null;

    // countChunks() is cheap (COUNT(*)); only pull full embeddings when chunks exist
    const chunkCount = await countChunks();
    if (chunkCount > 0) {
      const allChunks = await fetchAllChunks();
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

    const existing = await fetchRagQuestions({ topic, difficulty });

    // Request `count` from each model → 2× total buffer after combining both models.
    // This ensures we still hit `count` even when needsPassageButHasNone filters some out.
    const requestCount = count;
    const [openaiQuestions, anthropicQuestions] = await Promise.allSettled([
      generateWithOpenAI(topic, difficulty, requestCount, section, contextText, existing.length),
      generateWithAnthropic(topic, difficulty, requestCount, section, contextText, existing.length),
    ]);

    const rawAll: RawQuestion[] = [];
    if (openaiQuestions.status === 'fulfilled') rawAll.push(...openaiQuestions.value);
    if (anthropicQuestions.status === 'fulfilled') rawAll.push(...anthropicQuestions.value);

    const dedupedBatch = deduplicateQuestions(rawAll);
    const afterBasicFilter = dedupedBatch
      .filter((q) => !q.section || q.section === section)
      .filter((q) => !!q.prompt && !!q.choices && !!q.correct);
    // Drop questions that cite a passage that wasn't provided — unanswerable for students.
    // If ALL questions get dropped by this filter (model consistently failed to include passages),
    // fall back to keeping them anyway so we always save something.
    const afterPassageFilter = afterBasicFilter.filter((q) => !needsPassageButHasNone(q));
    const deduped = (afterPassageFilter.length > 0 ? afterPassageFilter : afterBasicFilter)
      .slice(0, count);
    const now = Date.now();

    const saved: RagQuestionRow[] = [];
    for (let i = 0; i < deduped.length; i++) {
      const raw = deduped[i];
      if (!raw.prompt || !raw.choices || !raw.correct) continue;

      const row: RagQuestionRow = {
        id: `rag-${topic}-${now}-${i}`,
        topic: raw.topic ?? topic,
        subtopic: raw.subtopic ?? topic,
        section,  // always use the requested section, not what the model returned
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
