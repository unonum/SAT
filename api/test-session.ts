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

export const config = { maxDuration: 300, api: { bodyParser: { sizeLimit: '4mb' } } };

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
type Pattern = { id: string; text: string; embedding: number[]; sourceChunk: string | null };
type GeneratedItem = { slot: Slot; question: ClientQuestion; embedding: number[] };

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
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DUPLICATE_THRESHOLD = 0.84;
const MAX_GENERATION_ROUNDS = 3;
const GENERATION_BATCH_SIZE = 4;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function wordSet(text: string): Set<string> {
  return new Set(normalize(text).split(/\s+/).filter((word) => word.length > 2));
}

function lexicalSimilarity(a: string, b: string): number {
  const left = wordSet(a);
  const right = wordSet(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const word of left) if (right.has(word)) intersection++;
  return intersection / Math.max(left.size, right.size);
}

function isLexicallyNovel(text: string, priorTexts: string[]): boolean {
  const normalized = normalize(text);
  if (!normalized) return false;
  return !priorTexts.some((prior) => {
    const other = normalize(prior);
    return normalized === other || normalized.includes(other) || other.includes(normalized) || lexicalSimilarity(text, prior) >= 0.72;
  });
}

function questionText(question: Pick<ClientQuestion, 'passage' | 'prompt' | 'choices'>): string {
  return [question.passage ?? '', question.prompt, ...question.choices.map((choice) => choice.text)].join('\n');
}

function rowText(row: RagQuestionRow): string {
  let choices: Choice[] = [];
  try { choices = JSON.parse(row.choices) as Choice[]; } catch { choices = []; }
  return [row.passage ?? '', row.prompt, ...choices.map((choice) => choice.text)].join('\n');
}

function masteryDifficulty(topic: string, attempts: AttemptSummary[]): Difficulty {
  const recent = attempts.filter((attempt) => attempt.topic === topic).sort((a, b) => b.ts - a.ts).slice(0, 8);
  if (!recent.length) return 'easy';
  const accuracy = recent.filter((attempt) => attempt.correct).length / recent.length;
  if (accuracy >= 0.8) return 'hard';
  if (accuracy >= 0.5) return 'medium';
  return 'easy';
}

function buildSlots(count: number, requestedTopics: string[], attempts: AttemptSummary[]): Slot[] {
  const allowed = requestedTopics.length ? TOPICS.filter((topic) => requestedTopics.includes(topic.id)) : TOPICS;
  const topics = allowed.length ? allowed : TOPICS;
  return Array.from({ length: count }, (_, index) => {
    const topic = topics[index % topics.length];
    return { ...topic, difficulty: masteryDifficulty(topic.id, attempts) };
  });
}

function parseGeneratedQuestions(text: string): ClientQuestion[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  try { return JSON.parse(text.slice(start, end + 1)) as ClientQuestion[]; } catch { return []; }
}

function isValidQuestion(question: ClientQuestion | undefined): question is ClientQuestion {
  if (!question?.prompt || !question.subtopic || !VALID_SECTIONS.has(question.section) || !VALID_DIFFICULTIES.has(question.difficulty)) return false;
  if (!Array.isArray(question.choices) || question.choices.length !== 4) return false;
  const ids = question.choices.map((choice) => choice.id);
  return ids.join('') === 'ABCD' && ids.includes(question.correct) && question.choices.every((choice) => Boolean(choice.text?.trim()));
}

async function ensureNoveltySchema(): Promise<void> {
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS question_exposures (
      user_email TEXT NOT NULL,
      question_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      exposed_at INTEGER NOT NULL,
      PRIMARY KEY (user_email, question_id)
    )
  `);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_question_exposures_user ON question_exposures(user_email, exposed_at)');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS rag_question_vectors (
      question_id TEXT PRIMARY KEY,
      embedding TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
}

async function loadStudentQuestionIds(email: string): Promise<Set<string>> {
  if (!email) return new Set();
  const db = getClient();
  const [attempted, exposed] = await Promise.all([
    db.execute({ sql: 'SELECT DISTINCT question_id FROM attempts WHERE user_email = ?', args: [email.toLowerCase()] }),
    db.execute({ sql: 'SELECT question_id FROM question_exposures WHERE user_email = ?', args: [email.toLowerCase()] }),
  ]);
  return new Set([...attempted.rows, ...exposed.rows].map((row) => String(row.question_id)));
}

async function saveExposures(email: string, mode: string, questions: ClientQuestion[]): Promise<void> {
  if (!email || !questions.length) return;
  const now = Date.now();
  await getClient().batch(questions.map((question) => ({
    sql: `INSERT OR IGNORE INTO question_exposures (user_email, question_id, mode, exposed_at) VALUES (?, ?, ?, ?)`,
    args: [email.toLowerCase(), question.id, mode, now],
  })), 'write');
}

async function embedTexts(openai: InstanceType<(typeof import('openai'))['default']>, texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const output: number[][] = [];
  for (let index = 0; index < texts.length; index += 64) {
    const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: texts.slice(index, index + 64) });
    output.push(...response.data.map((item) => item.embedding));
  }
  return output;
}

async function loadQuestionPatterns(
  openai: InstanceType<(typeof import('openai'))['default']>,
  rows: RagQuestionRow[]
): Promise<Pattern[]> {
  if (!rows.length) return [];
  const db = getClient();
  const ids = rows.map((row) => row.id);
  const vectors = new Map<string, number[]>();
  for (let index = 0; index < ids.length; index += 200) {
    const page = ids.slice(index, index + 200);
    const result = await db.execute({
      sql: `SELECT question_id, embedding FROM rag_question_vectors WHERE question_id IN (${page.map(() => '?').join(',')})`,
      args: page,
    });
    for (const row of result.rows) vectors.set(String(row.question_id), JSON.parse(String(row.embedding)) as number[]);
  }

  const missing = rows.filter((row) => !vectors.has(row.id));
  if (missing.length) {
    const embeddings = await embedTexts(openai, missing.map(rowText));
    const now = Date.now();
    await db.batch(missing.map((row, index) => ({
      sql: 'INSERT OR REPLACE INTO rag_question_vectors (question_id, embedding, created_at) VALUES (?, ?, ?)',
      args: [row.id, JSON.stringify(embeddings[index]), now],
    })), 'write');
    missing.forEach((row, index) => vectors.set(row.id, embeddings[index]));
  }

  return rows.flatMap((row) => {
    const embedding = vectors.get(row.id);
    return embedding ? [{ id: row.id, text: rowText(row), embedding, sourceChunk: row.source_chunk }] : [];
  });
}

function mostRelevant<T extends { embedding: number[] }>(items: T[], query: number[], count: number): T[] {
  return items
    .map((item) => ({ item, score: cosineSimilarity(query, item.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ item }) => item);
}

async function generateBatch(
  openai: InstanceType<(typeof import('openai'))['default']>,
  slots: Slot[],
  patternSets: Pattern[][],
  sourceContexts: Array<{ id: string; content: string }[]>,
  forbiddenTexts: string[],
  forbiddenEmbeddings: number[][]
): Promise<GeneratedItem[]> {
  const requests = slots.map((slot, index) => ({
    position: index,
    ...slot,
    questionPatterns: patternSets[index].map((pattern) => pattern.text),
    sourceConcepts: sourceContexts[index].map((context) => context.content),
  }));
  const prompt = `You are an expert SAT item writer. Create exactly ${slots.length} NEW questions in the same order as REQUESTS.

The vector database examples are PATTERNS ONLY. Infer the tested skill, structure, difficulty, distractor logic, and reasoning depth. Do not reuse their wording, names, numbers, passages, answer choices, equations, scenarios, or surface setup. Each output must require a materially different solution path or reading context.

STRICT NOVELTY RULES:
- Every question must be newly authored now; never return a database question.
- Do not make a variant by merely changing names, values, nouns, or answer order.
- Questions in this response must differ from one another in setup and reasoning path.
- Avoid every item summarized in FORBIDDEN_EXAMPLES.
- Return only a valid JSON array with no markdown.

Each item must contain: topic, subtopic, section, difficulty, passage (string or null), prompt, choices exactly [{id:"A",text:"..."},...,{id:"D",text:"..."}], correct, parTimeSec, and explanation containing correctWhy, fastStrategy, simplerView, trapNote, timeTrick, whyWrong.

REQUESTS=${JSON.stringify(requests)}
FORBIDDEN_EXAMPLES=${JSON.stringify(forbiddenTexts.slice(-80))}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 1,
  });
  const parsed = parseGeneratedQuestions(response.choices[0]?.message?.content ?? '').slice(0, slots.length);
  const validEntries = parsed
    .map((question, slotIndex) => ({ question, slotIndex }))
    .filter((entry): entry is { question: ClientQuestion; slotIndex: number } => isValidQuestion(entry.question));
  const candidateEmbeddings = await embedTexts(openai, validEntries.map(({ question }) => questionText(question)));
  const accepted: GeneratedItem[] = [];
  const acceptedTexts: string[] = [];
  const acceptedEmbeddings: number[][] = [];

  for (let index = 0; index < validEntries.length; index++) {
    const { question: candidate, slotIndex } = validEntries[index];
    const embedding = candidateEmbeddings[index];
    const slot = slots[slotIndex];
    const text = questionText(candidate);
    const patternTexts = patternSets[slotIndex]?.map((pattern) => pattern.text) ?? [];
    const comparisons = [...forbiddenEmbeddings, ...acceptedEmbeddings, ...(patternSets[slotIndex]?.map((pattern) => pattern.embedding) ?? [])];
    const embeddingDuplicate = comparisons.some((prior) => cosineSimilarity(embedding, prior) >= EMBEDDING_DUPLICATE_THRESHOLD);
    if (!slot || !isLexicallyNovel(text, [...forbiddenTexts, ...acceptedTexts, ...patternTexts]) || embeddingDuplicate) continue;

    accepted.push({
      slot,
      question: {
        ...candidate,
        id: '',
        topic: slot.topic,
        section: slot.section,
        difficulty: slot.difficulty,
        ragGenerated: true,
        sourceChunk: sourceContexts[slotIndex]?.[0]?.id ?? patternSets[slotIndex]?.[0]?.sourceChunk ?? undefined,
      },
      embedding,
    });
    acceptedTexts.push(text);
    acceptedEmbeddings.push(embedding);
  }
  return accepted;
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
    const { email = '', mode = 'practice', count = 8, topics = [], attempts = [], avoidPrompts = [], fallbackQuestions = [] } = req.body ?? {};
    const requestedCount = Math.max(1, Math.min(30, Number(count) || 8));
    const attemptSummaries = (Array.isArray(attempts) ? attempts : []) as AttemptSummary[];
    const slots = buildSlots(requestedCount, Array.isArray(topics) ? topics : [], attemptSummaries);
    const studentIds = await loadStudentQuestionIds(String(email)).catch(() => new Set<string>());
    for (const attempt of attemptSummaries) studentIds.add(attempt.questionId);

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const [questionRows, chunks] = await Promise.all([fetchRagQuestions(), fetchAllChunks()]);
    const patterns = await loadQuestionPatterns(openai, questionRows);
    const exposedPatternTexts = questionRows.filter((row) => studentIds.has(row.id)).map(rowText);
    const clientAvoidPrompts = (Array.isArray(avoidPrompts) ? avoidPrompts : []).filter(Boolean).map(String);
    const forbiddenTexts = [...clientAvoidPrompts, ...exposedPatternTexts];
    const forbiddenEmbeddings = await embedTexts(openai, forbiddenTexts);

    const queryTexts = slots.map((slot) => `SAT ${slot.section} ${slot.topic} ${slot.difficulty} question pattern and reasoning`);
    const queryEmbeddings = await embedTexts(openai, queryTexts);
    const patternSets = slots.map((slot, index) => mostRelevant(
      patterns.filter((pattern) => {
        const row = questionRows.find((question) => question.id === pattern.id);
        return row?.topic === slot.topic && row?.difficulty === slot.difficulty;
      }),
      queryEmbeddings[index],
      3
    ));
    const sourceContexts = slots.map((_, index) => mostRelevant(chunks, queryEmbeddings[index], 3));

    const generated: GeneratedItem[] = [];
    let pendingSlots = [...slots];
    for (let round = 0; round < MAX_GENERATION_ROUNDS && pendingSlots.length; round++) {
      const nextPending: Slot[] = [];
      for (let start = 0; start < pendingSlots.length; start += GENERATION_BATCH_SIZE) {
        const batch = pendingSlots.slice(start, start + GENERATION_BATCH_SIZE);
        const originalIndexes = batch.map((slot) => slots.findIndex((candidate) => candidate === slot));
        const accepted = await generateBatch(
          openai,
          batch,
          originalIndexes.map((index) => patternSets[index]),
          originalIndexes.map((index) => sourceContexts[index]),
          [...forbiddenTexts, ...generated.map(({ question }) => questionText(question))],
          [...forbiddenEmbeddings, ...generated.map(({ embedding }) => embedding)]
        ).catch(() => []);
        generated.push(...accepted);
        const acceptedSlots = new Set(accepted.map((item) => item.slot));
        nextPending.push(...batch.filter((slot) => !acceptedSlots.has(slot)));
      }
      pendingSlots = nextPending;
    }

    const now = Date.now();
    const finalQuestions: ClientQuestion[] = [];
    for (let index = 0; index < generated.length && finalQuestions.length < requestedCount; index++) {
      const item = generated[index];
      const question = { ...item.question, id: `rag-${item.question.topic}-${now}-${index}-${Math.random().toString(36).slice(2, 8)}` };
      await upsertRagQuestion({
        id: question.id,
        topic: question.topic,
        subtopic: question.subtopic,
        section: question.section,
        difficulty: question.difficulty,
        passage: question.passage ?? null,
        prompt: question.prompt,
        choices: JSON.stringify(question.choices),
        correct: question.correct,
        par_time_sec: Number(question.parTimeSec) || 60,
        explanation: JSON.stringify(question.explanation ?? {}),
        source_chunk: question.sourceChunk ?? null,
        created_at: now,
      });
      await getClient().execute({
        sql: 'INSERT OR REPLACE INTO rag_question_vectors (question_id, embedding, created_at) VALUES (?, ?, ?)',
        args: [question.id, JSON.stringify(item.embedding), now],
      });
      finalQuestions.push(question);
    }

    // Static questions are an emergency availability fallback only; generated questions are always preferred.
    const fallback = ((Array.isArray(fallbackQuestions) ? fallbackQuestions : []) as ClientQuestion[])
      .filter((question) => !studentIds.has(question.id) && !finalQuestions.some((item) => item.id === question.id));
    const fallbackEmbeddings = await embedTexts(openai, fallback.map(questionText));
    const acceptedEmbeddings = generated.map(({ embedding }) => embedding);
    for (let index = 0; index < fallback.length; index++) {
      if (finalQuestions.length >= requestedCount) break;
      const question = fallback[index];
      const embedding = fallbackEmbeddings[index];
      const text = questionText(question);
      const duplicate = [...forbiddenEmbeddings, ...acceptedEmbeddings]
        .some((prior) => cosineSimilarity(embedding, prior) >= EMBEDDING_DUPLICATE_THRESHOLD);
      if (duplicate || !isLexicallyNovel(text, [...forbiddenTexts, ...finalQuestions.map(questionText)])) continue;
      finalQuestions.push(question);
      acceptedEmbeddings.push(embedding);
    }

    if (!finalQuestions.length) return res.status(503).json({ error: 'No novel questions are currently available' });
    await saveExposures(String(email), String(mode), finalQuestions);
    return res.status(200).json({
      sessionId: `session-${now}-${Math.random().toString(36).slice(2, 8)}`,
      mode,
      questions: finalQuestions,
      source: finalQuestions.every((question) => question.ragGenerated) ? 'vector-pattern-llm' : 'vector-pattern-llm-with-static-fallback',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/test-session]', error);
    return res.status(500).json({ error: message });
  }
}
