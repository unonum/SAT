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
type Choice = { id: 'A' | 'B' | 'C' | 'D'; text: string };
type ClientQuestion = {
  id: string;
  topic: string;
  subtopic: string;
  section: Section;
  difficulty: Difficulty;
  passage?: string;
  prompt: string;
  choices: Choice[];
  correct: Choice['id'];
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

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function trigrams(text: string): Set<string> {
  const value = `  ${normalize(text)}  `;
  const grams = new Set<string>();
  for (let i = 0; i <= value.length - 3; i++) grams.add(value.slice(i, i + 3));
  return grams;
}

function semanticSimilarity(a: string, b: string): number {
  const left = trigrams(a);
  const right = trigrams(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const gram of left) if (right.has(gram)) intersection++;
  return intersection / (left.size + right.size - intersection);
}

function isStrictlyNovel(prompt: string, priorPrompts: string[]): boolean {
  const normalized = normalize(prompt);
  if (!normalized) return false;
  return !priorPrompts.some((prior) => {
    const other = normalize(prior);
    return normalized === other || normalized.includes(other) || other.includes(normalized) || semanticSimilarity(prompt, prior) >= 0.5;
  });
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
  const allowed = requestedTopics.length
    ? TOPICS.filter((topic) => requestedTopics.includes(topic.id))
    : TOPICS;
  const topics = allowed.length ? allowed : TOPICS;
  return Array.from({ length: count }, (_, index) => {
    const topic = topics[index % topics.length];
    return { ...topic, difficulty: masteryDifficulty(topic.id, attempts) };
  });
}

function rowToQuestion(row: RagQuestionRow): ClientQuestion | null {
  try {
    return {
      id: row.id,
      topic: row.topic,
      subtopic: row.subtopic,
      section: row.section as Section,
      difficulty: row.difficulty as Difficulty,
      passage: row.passage ?? undefined,
      prompt: row.prompt,
      choices: JSON.parse(row.choices) as Choice[],
      correct: row.correct as Choice['id'],
      parTimeSec: row.par_time_sec,
      explanation: JSON.parse(row.explanation) as Record<string, unknown>,
      ragGenerated: true,
      sourceChunk: row.source_chunk ?? undefined,
    };
  } catch {
    return null;
  }
}

function parseGeneratedQuestions(text: string): ClientQuestion[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  try {
    return JSON.parse(text.slice(start, end + 1)) as ClientQuestion[];
  } catch {
    return [];
  }
}

async function loadAttemptedIds(email: string): Promise<Set<string>> {
  if (!email) return new Set();
  const result = await getClient().execute({
    sql: 'SELECT DISTINCT question_id FROM attempts WHERE user_email = ?',
    args: [email.toLowerCase()],
  });
  return new Set(result.rows.map((row) => String(row.question_id)));
}

async function ensureExposureSchema(): Promise<void> {
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
}

async function loadExposedIds(email: string): Promise<Set<string>> {
  if (!email) return new Set();
  const result = await getClient().execute({
    sql: 'SELECT question_id FROM question_exposures WHERE user_email = ?',
    args: [email.toLowerCase()],
  });
  return new Set(result.rows.map((row) => String(row.question_id)));
}

async function saveExposures(email: string, mode: string, questions: ClientQuestion[]): Promise<void> {
  if (!email || !questions.length) return;
  const now = Date.now();
  await getClient().batch(questions.map((question) => ({
    sql: `INSERT OR IGNORE INTO question_exposures (user_email, question_id, mode, exposed_at)
          VALUES (?, ?, ?, ?)`,
    args: [email.toLowerCase(), question.id, mode, now],
  })), 'write');
}

async function generateForSlots(slots: Slot[], avoidPrompts: string[]): Promise<ClientQuestion[]> {
  if (!slots.length) return [];
  const chunks = await fetchAllChunks().catch(() => []);

  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const uniqueSpecs = [...new Map(slots.map((slot) => [`${slot.topic}:${slot.difficulty}`, slot])).values()];
  const queryEmbeddings = chunks.length
    ? await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: uniqueSpecs.map((slot) => `SAT ${slot.section} ${slot.topic} ${slot.difficulty} question concepts and examples`),
      })
    : null;

  const contexts = uniqueSpecs.map((slot, index) => {
    const embedding = queryEmbeddings?.data[index].embedding;
    const relevant = embedding
      ? chunks
          .map((chunk) => ({ ...chunk, score: cosineSimilarity(embedding, chunk.embedding) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)
      : [];
    return {
      key: `${slot.topic}:${slot.difficulty}`,
      sourceChunk: relevant[0]?.id ?? null,
      text: relevant.length
        ? relevant.map((chunk) => chunk.content).join('\n---\n')
        : `General SAT ${slot.section} knowledge for ${slot.topic} at ${slot.difficulty} difficulty.`,
    };
  });

  const requested = slots.map((slot, index) => ({ index, ...slot }));
  const prompt = `You are an expert SAT assessment writer. Create exactly ${slots.length} original questions matching REQUESTS in order.
Use the retrieved VECTOR_CONTEXT as the first and primary conceptual grounding. If a context explicitly says general SAT knowledge, use standard SAT conventions. Invent new values, scenarios, passages, wording, distractors, and reasoning paths. Never copy source wording.
STRICT NOVELTY: none may duplicate or closely resemble another generated question or any item in AVOID_PROMPTS. Change the underlying setup, not merely names or numbers.
Return only a JSON array. Each item must contain: topic, subtopic, section, difficulty, passage (string or null), prompt, choices (A-D), correct, parTimeSec, explanation with correctWhy, fastStrategy, simplerView, trapNote, timeTrick, whyWrong.
REQUESTS=${JSON.stringify(requested)}
VECTOR_CONTEXT=${JSON.stringify(contexts)}
AVOID_PROMPTS=${JSON.stringify(avoidPrompts.slice(-120))}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.95,
  }).catch(async () => openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.95,
  }));

  const raw = response.choices[0]?.message?.content ?? '';
  const parsed = parseGeneratedQuestions(raw);
  const now = Date.now();
  const accepted: ClientQuestion[] = [];
  const seen = [...avoidPrompts];

  for (let index = 0; index < parsed.length && accepted.length < slots.length; index++) {
    const question = parsed[index];
    const slot = slots[accepted.length];
    if (!question?.prompt || !Array.isArray(question.choices) || question.choices.length !== 4 || !isStrictlyNovel(question.prompt, seen)) continue;
    const context = contexts.find((item) => item.key === `${slot.topic}:${slot.difficulty}`);
    const complete: ClientQuestion = {
      ...question,
      id: `rag-${slot.topic}-${now}-${accepted.length}-${Math.random().toString(36).slice(2, 8)}`,
      topic: slot.topic,
      section: slot.section,
      difficulty: slot.difficulty,
      subtopic: question.subtopic || slot.topic,
      passage: question.passage || undefined,
      parTimeSec: Number(question.parTimeSec) || 60,
      ragGenerated: true,
      sourceChunk: context?.sourceChunk ?? undefined,
    };
    accepted.push(complete);
    seen.push(complete.prompt);

    await upsertRagQuestion({
      id: complete.id,
      topic: complete.topic,
      subtopic: complete.subtopic,
      section: complete.section,
      difficulty: complete.difficulty,
      passage: complete.passage ?? null,
      prompt: complete.prompt,
      choices: JSON.stringify(complete.choices),
      correct: complete.correct,
      par_time_sec: complete.parTimeSec,
      explanation: JSON.stringify(complete.explanation),
      source_chunk: complete.sourceChunk ?? null,
      created_at: now,
    });
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
    await Promise.all([ensureRagSchema(), ensureExposureSchema()]).catch(() => undefined);
    const {
      email = '', mode = 'practice', count = 8, topics = [], attempts = [],
      avoidPrompts = [], fallbackQuestions = [],
    } = req.body ?? {};
    const requestedCount = Math.max(1, Math.min(30, Number(count) || 8));
    const attemptSummaries = (Array.isArray(attempts) ? attempts : []) as AttemptSummary[];
    const [attemptedIds, exposedIds] = await Promise.all([
      loadAttemptedIds(String(email)).catch(() => new Set<string>()),
      loadExposedIds(String(email)).catch(() => new Set<string>()),
    ]);
    for (const questionId of exposedIds) attemptedIds.add(questionId);
    for (const attempt of attemptSummaries) attemptedIds.add(attempt.questionId);

    const slots = buildSlots(requestedCount, Array.isArray(topics) ? topics : [], attemptSummaries);
    const storedRows = await fetchRagQuestions().catch(() => []);
    const stored = storedRows.map(rowToQuestion).filter((question): question is ClientQuestion => question !== null);
    const priorPrompts = [
      ...(Array.isArray(avoidPrompts) ? avoidPrompts : []).filter(Boolean).map(String),
      ...stored.filter((question) => attemptedIds.has(question.id)).map((question) => question.prompt),
    ].slice(-300);
    const selected: ClientQuestion[] = [];
    const missingSlots: Slot[] = [];

    for (const slot of slots) {
      const candidate = stored.find((question) =>
        !attemptedIds.has(question.id) &&
        !selected.some((picked) => picked.id === question.id) &&
        question.topic === slot.topic &&
        question.difficulty === slot.difficulty &&
        isStrictlyNovel(question.prompt, [...priorPrompts, ...selected.map((picked) => picked.prompt)])
      );
      if (candidate) selected.push(candidate);
      else missingSlots.push(slot);
    }


    if (missingSlots.length) {
      const generated = await generateForSlots(missingSlots, [...priorPrompts, ...selected.map((question) => question.prompt)]).catch(() => []);
      selected.push(...generated);
      missingSlots.splice(0, generated.length);
    }

    const fallback = (Array.isArray(fallbackQuestions) ? fallbackQuestions : []) as ClientQuestion[];
    for (const slot of missingSlots) {
      const candidate = fallback.find((question) =>
        !attemptedIds.has(question.id) &&
        !selected.some((picked) => picked.id === question.id) &&
        question.topic === slot.topic &&
        isStrictlyNovel(question.prompt, [...priorPrompts, ...selected.map((picked) => picked.prompt)])
      );
      if (candidate) selected.push(candidate);
    }

    if (!selected.length) return res.status(503).json({ error: 'No novel questions are currently available' });
    const finalQuestions = selected.slice(0, requestedCount);
    await saveExposures(String(email), String(mode), finalQuestions).catch(() => undefined);
    return res.status(200).json({
      sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      mode,
      questions: finalQuestions,
      source: selected.every((question) => question.ragGenerated) ? 'vector-rag' : 'hybrid-fallback',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
}
