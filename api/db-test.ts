import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const url = process.env.TURSO_DATABASE_URL!;
  const authToken = process.env.TURSO_AUTH_TOKEN!;
  const report: Record<string, unknown> = {};

  const db = createClient({ url, authToken });

  // Step 1: ping
  try {
    await db.execute('SELECT 1');
    report.step1_ping = 'ok';
  } catch (e) { return res.status(500).json({ failed_at: 'ping', error: String(e), report }); }

  // Step 2: create attempts table
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY, user_email TEXT NOT NULL, question_id TEXT NOT NULL,
      topic TEXT NOT NULL, difficulty TEXT NOT NULL, selected TEXT,
      correct INTEGER NOT NULL, time_sec INTEGER NOT NULL, confidence TEXT,
      mistake_category TEXT, retried INTEGER DEFAULT 0, mode TEXT, ts INTEGER NOT NULL
    )`);
    report.step2_attempts_table = 'ok';
  } catch (e) { return res.status(500).json({ failed_at: 'create_attempts', error: String(e), report }); }

  // Step 3: create rag_chunks table
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS rag_chunks (
      id TEXT PRIMARY KEY, source_name TEXT NOT NULL, source_type TEXT NOT NULL,
      chunk_index INTEGER NOT NULL, content TEXT NOT NULL,
      embedding TEXT NOT NULL, created_at INTEGER NOT NULL
    )`);
    report.step3_rag_chunks_table = 'ok';
  } catch (e) { return res.status(500).json({ failed_at: 'create_rag_chunks', error: String(e), report }); }

  // Step 4: insert a test chunk via db.batch
  const testId = `test-${Date.now()}`;
  try {
    await db.batch([{
      sql: `INSERT OR REPLACE INTO rag_chunks (id, source_name, source_type, chunk_index, content, embedding, created_at) VALUES (?,?,?,?,?,?,?)`,
      args: [testId, '__test__', 'text', 0, 'hello', JSON.stringify([0.1, 0.2]), Date.now()],
    }], 'write');
    report.step4_batch_insert = 'ok';
  } catch (e) { return res.status(500).json({ failed_at: 'batch_insert', error: String(e), report }); }

  // Step 5: read it back
  try {
    const r = await db.execute({ sql: `SELECT id FROM rag_chunks WHERE id = ?`, args: [testId] });
    report.step5_read_back = r.rows.length === 1 ? 'ok' : 'row_missing';
    await db.execute({ sql: `DELETE FROM rag_chunks WHERE id = ?`, args: [testId] });
  } catch (e) { return res.status(500).json({ failed_at: 'read_back', error: String(e), report }); }

  // Step 6: OpenAI embed
  try {
    const OpenAI = (await import('openai')).default;
    const emb = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).embeddings.create({
      model: 'text-embedding-3-small', input: 'test',
    });
    report.step6_openai = `ok dims=${emb.data[0].embedding.length}`;
  } catch (e) { return res.status(500).json({ failed_at: 'openai_embed', error: String(e), report }); }

  return res.status(200).json({ ok: true, report });
}
