import { createClient, type Client } from '@libsql/client';

// Server-side Turso connection. The auth token is read from env vars and
// never reaches the browser — the SPA only ever talks to /api/*.
let client: Client | null = null;
let schemaReady = false;
let ragSchemaReady = false;

export function getClient(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set');
  client = createClient({ url, authToken });
  return client;
}

/** Create the attempts table on first use (idempotent). */
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attempts (
      id               TEXT PRIMARY KEY,
      user_email       TEXT NOT NULL,
      question_id      TEXT NOT NULL,
      topic            TEXT NOT NULL,
      difficulty       TEXT NOT NULL,
      selected         TEXT,
      correct          INTEGER NOT NULL,
      time_sec         INTEGER NOT NULL,
      confidence       TEXT,
      mistake_category TEXT,
      retried          INTEGER DEFAULT 0,
      mode             TEXT,
      ts               INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_email, ts)`);
  schemaReady = true;
}

/** Create the RAG tables on first use (idempotent). */
export async function ensureRagSchema(): Promise<void> {
  if (ragSchemaReady) return;
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id          TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      content     TEXT NOT NULL,
      embedding   TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_rag_chunks_source ON rag_chunks(source_name)`);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS rag_questions (
      id           TEXT PRIMARY KEY,
      topic        TEXT NOT NULL,
      subtopic     TEXT NOT NULL,
      section      TEXT NOT NULL,
      difficulty   TEXT NOT NULL,
      passage      TEXT,
      prompt       TEXT NOT NULL,
      choices      TEXT NOT NULL,
      correct      TEXT NOT NULL,
      par_time_sec INTEGER NOT NULL,
      explanation  TEXT NOT NULL,
      source_chunk TEXT,
      created_at   INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_rag_questions_topic ON rag_questions(topic, difficulty)`);
  ragSchemaReady = true;
}

export interface RagQuestionRow {
  id: string;
  topic: string;
  subtopic: string;
  section: string;
  difficulty: string;
  passage: string | null;
  prompt: string;
  choices: string; // JSON
  correct: string;
  par_time_sec: number;
  explanation: string; // JSON
  source_chunk: string | null;
  created_at: number;
}

export async function upsertChunk(chunk: {
  id: string;
  source_name: string;
  source_type: string;
  chunk_index: number;
  content: string;
  embedding: number[];
  created_at: number;
}): Promise<void> {
  const db = getClient();
  await db.execute({
    sql: `INSERT OR REPLACE INTO rag_chunks (id, source_name, source_type, chunk_index, content, embedding, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      chunk.id,
      chunk.source_name,
      chunk.source_type,
      chunk.chunk_index,
      chunk.content,
      JSON.stringify(chunk.embedding),
      chunk.created_at,
    ],
  });
}

export async function fetchAllChunks(): Promise<Array<{ id: string; content: string; embedding: number[] }>> {
  const db = getClient();
  const result = await db.execute(`SELECT id, content, embedding FROM rag_chunks`);
  return result.rows.map((row) => ({
    id: row.id as string,
    content: row.content as string,
    embedding: JSON.parse(row.embedding as string) as number[],
  }));
}

export async function upsertRagQuestion(q: RagQuestionRow): Promise<void> {
  const db = getClient();
  await db.execute({
    sql: `INSERT OR REPLACE INTO rag_questions
          (id, topic, subtopic, section, difficulty, passage, prompt, choices, correct, par_time_sec, explanation, source_chunk, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      q.id, q.topic, q.subtopic, q.section, q.difficulty, q.passage ?? null,
      q.prompt, q.choices, q.correct, q.par_time_sec, q.explanation,
      q.source_chunk ?? null, q.created_at,
    ],
  });
}

export async function fetchRagQuestions(filters?: { topic?: string; difficulty?: string }): Promise<RagQuestionRow[]> {
  const db = getClient();
  let sql = `SELECT * FROM rag_questions WHERE 1=1`;
  const args: string[] = [];
  if (filters?.topic) { sql += ` AND topic = ?`; args.push(filters.topic); }
  if (filters?.difficulty) { sql += ` AND difficulty = ?`; args.push(filters.difficulty); }
  sql += ` ORDER BY created_at DESC`;
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => ({
    id: row.id as string,
    topic: row.topic as string,
    subtopic: row.subtopic as string,
    section: row.section as string,
    difficulty: row.difficulty as string,
    passage: row.passage as string | null,
    prompt: row.prompt as string,
    choices: row.choices as string,
    correct: row.correct as string,
    par_time_sec: row.par_time_sec as number,
    explanation: row.explanation as string,
    source_chunk: row.source_chunk as string | null,
    created_at: row.created_at as number,
  }));
}

export async function deleteRagQuestion(id: string): Promise<void> {
  const db = getClient();
  await db.execute({ sql: `DELETE FROM rag_questions WHERE id = ?`, args: [id] });
}

export async function listSources(): Promise<Array<{ source_name: string; source_type: string; chunk_count: number; created_at: number }>> {
  const db = getClient();
  const result = await db.execute(`
    SELECT source_name, source_type, COUNT(*) as chunk_count, MIN(created_at) as created_at
    FROM rag_chunks
    GROUP BY source_name, source_type
    ORDER BY created_at DESC
  `);
  return result.rows.map((row) => ({
    source_name: row.source_name as string,
    source_type: row.source_type as string,
    chunk_count: row.chunk_count as number,
    created_at: row.created_at as number,
  }));
}

/** Cosine similarity between two equal-length vectors (pure JS). */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
