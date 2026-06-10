import { createClient, type Client } from '@libsql/client/http';

let client: Client | null = null;
let schemaReady = false;
let ragSchemaReady = false;
let mockSchemaReady = false;

export function getClient(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set in environment variables');
  if (!authToken) throw new Error('TURSO_AUTH_TOKEN is not set in environment variables');
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

type ChunkRow = {
  id: string; source_name: string; source_type: string;
  chunk_index: number; content: string; embedding: number[]; created_at: number;
};

export async function upsertChunk(chunk: ChunkRow): Promise<void> {
  await upsertChunkBatch([chunk]);
}

export async function upsertChunkBatch(chunks: ChunkRow[]): Promise<void> {
  if (chunks.length === 0) return;
  const db = getClient();
  const stmts = chunks.map((c) => ({
    sql: `INSERT OR REPLACE INTO rag_chunks (id, source_name, source_type, chunk_index, content, embedding, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [c.id, c.source_name, c.source_type, c.chunk_index, c.content, JSON.stringify(c.embedding), c.created_at],
  }));
  for (let i = 0; i < stmts.length; i += 100) {
    await db.batch(stmts.slice(i, i + 100), 'write');
  }
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

// ── Mock Sessions ─────────────────────────────────────────────────────────────

export interface MockSessionRow {
  id: string;
  user_email: string;
  date: string;            // YYYY-MM-DD
  status: string;          // 'in-progress' | 'complete'
  questions_json: string;  // JSON Question[]
  answers_json: string;    // JSON Record<id, {selected, timeSec}>
  phase: string;           // 'rw' | 'break' | 'math' | 'review'
  rw_idx: number;
  math_idx: number;
  rw_started_at: number | null;
  math_started_at: number | null;
  started_at: number;
  completed_at: number | null;
  rw_correct: number;
  rw_total: number;
  math_correct: number;
  math_total: number;
}

export async function ensureMockSchema(): Promise<void> {
  if (mockSchemaReady) return;
  const db = getClient();
  await db.execute(`CREATE TABLE IF NOT EXISTS mock_sessions (
    id               TEXT PRIMARY KEY,
    user_email       TEXT NOT NULL,
    date             TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'in-progress',
    questions_json   TEXT NOT NULL DEFAULT '[]',
    answers_json     TEXT NOT NULL DEFAULT '{}',
    phase            TEXT NOT NULL DEFAULT 'rw',
    rw_idx           INTEGER NOT NULL DEFAULT 0,
    math_idx         INTEGER NOT NULL DEFAULT 0,
    rw_started_at    INTEGER,
    math_started_at  INTEGER,
    started_at       INTEGER NOT NULL,
    completed_at     INTEGER,
    rw_correct       INTEGER NOT NULL DEFAULT 0,
    rw_total         INTEGER NOT NULL DEFAULT 0,
    math_correct     INTEGER NOT NULL DEFAULT 0,
    math_total       INTEGER NOT NULL DEFAULT 0
  )`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_mock_sessions_user ON mock_sessions(user_email, date)`);
  mockSchemaReady = true;
}

function rowToMockSession(row: Record<string, unknown>): MockSessionRow {
  return {
    id: String(row.id ?? ''), user_email: String(row.user_email ?? ''),
    date: String(row.date ?? ''), status: String(row.status ?? 'in-progress'),
    questions_json: String(row.questions_json ?? '[]'),
    answers_json: String(row.answers_json ?? '{}'),
    phase: String(row.phase ?? 'rw'),
    rw_idx: Number(row.rw_idx ?? 0), math_idx: Number(row.math_idx ?? 0),
    rw_started_at: row.rw_started_at != null ? Number(row.rw_started_at) : null,
    math_started_at: row.math_started_at != null ? Number(row.math_started_at) : null,
    started_at: Number(row.started_at ?? 0),
    completed_at: row.completed_at != null ? Number(row.completed_at) : null,
    rw_correct: Number(row.rw_correct ?? 0), rw_total: Number(row.rw_total ?? 0),
    math_correct: Number(row.math_correct ?? 0), math_total: Number(row.math_total ?? 0),
  };
}

export async function upsertMockSession(s: MockSessionRow): Promise<void> {
  const db = getClient();
  await db.execute({
    sql: `INSERT OR REPLACE INTO mock_sessions
      (id,user_email,date,status,questions_json,answers_json,phase,
       rw_idx,math_idx,rw_started_at,math_started_at,started_at,completed_at,
       rw_correct,rw_total,math_correct,math_total)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      s.id, s.user_email.toLowerCase(), s.date, s.status,
      s.questions_json, s.answers_json, s.phase,
      s.rw_idx, s.math_idx, s.rw_started_at ?? null, s.math_started_at ?? null,
      s.started_at, s.completed_at ?? null,
      s.rw_correct, s.rw_total, s.math_correct, s.math_total,
    ],
  });
}

export async function getMockSession(userEmail: string, dateOrId: string): Promise<MockSessionRow | null> {
  const db = getClient();
  // Try as id first (exact), then as date (returns latest for that date)
  const byId = await db.execute({
    sql: `SELECT * FROM mock_sessions WHERE id=? LIMIT 1`,
    args: [dateOrId],
  });
  if (byId.rows.length) return rowToMockSession(byId.rows[0] as Record<string, unknown>);
  const byDate = await db.execute({
    sql: `SELECT * FROM mock_sessions WHERE user_email=? AND date=? ORDER BY started_at DESC LIMIT 1`,
    args: [userEmail.toLowerCase(), dateOrId],
  });
  if (byDate.rows.length) return rowToMockSession(byDate.rows[0] as Record<string, unknown>);
  return null;
}

/** Returns ALL sessions for a specific date (for multi-attempt support), newest first. */
export async function listMockSessionsByDate(userEmail: string, date: string): Promise<MockSessionRow[]> {
  const db = getClient();
  const result = await db.execute({
    sql: `SELECT * FROM mock_sessions WHERE user_email=? AND date=? ORDER BY started_at DESC`,
    args: [userEmail.toLowerCase(), date],
  });
  return result.rows.map((r) => rowToMockSession(r as Record<string, unknown>));
}

/** Returns sessions sorted newest first — questions_json omitted to keep payload small. */
export async function listMockSessions(userEmail: string, limit = 60): Promise<Omit<MockSessionRow, 'questions_json'>[]> {
  const db = getClient();
  const result = await db.execute({
    sql: `SELECT id,user_email,date,status,answers_json,phase,rw_idx,math_idx,
                 rw_started_at,math_started_at,started_at,completed_at,
                 rw_correct,rw_total,math_correct,math_total
          FROM mock_sessions WHERE user_email=? ORDER BY date DESC LIMIT ?`,
    args: [userEmail.toLowerCase(), limit],
  });
  return result.rows.map((r) => {
    const row = rowToMockSession({ ...r as Record<string, unknown>, questions_json: '[]' });
    const { questions_json: _q, ...rest } = row;
    return rest;
  });
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
