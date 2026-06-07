import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client';
import { ensureSchema, ensureRagSchema, upsertChunkBatch, listSources } from './_lib/turso';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  const report: Record<string, unknown> = {
    env: {
      TURSO_DATABASE_URL: tursoUrl ? `${tursoUrl.slice(0, 24)}…` : 'NOT SET',
      TURSO_AUTH_TOKEN: tursoToken ? `${tursoToken.slice(0, 12)}…` : 'NOT SET',
      OPENAI_API_KEY: openaiKey ? `${openaiKey.slice(0, 10)}…` : 'NOT SET',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'set' : 'NOT SET',
    },
  };

  // ── 1. Raw ping ────────────────────────────────────────────────────────────
  try {
    const db = createClient({ url: tursoUrl!, authToken: tursoToken! });
    const r = await db.execute('SELECT 1 AS ok');
    report.ping = { ok: true, rows: r.rows };
  } catch (e: unknown) {
    report.ping = { ok: false, error: String(e) };
    return res.status(500).json({ ok: false, step: 'ping', report });
  }

  // ── 2. ensureSchema (attempts table) ──────────────────────────────────────
  try {
    await ensureSchema();
    report.ensureSchema = { ok: true };
  } catch (e: unknown) {
    report.ensureSchema = { ok: false, error: String(e) };
    return res.status(500).json({ ok: false, step: 'ensureSchema', report });
  }

  // ── 3. ensureRagSchema (rag tables) ───────────────────────────────────────
  try {
    await ensureRagSchema();
    report.ensureRagSchema = { ok: true };
  } catch (e: unknown) {
    report.ensureRagSchema = { ok: false, error: String(e) };
    return res.status(500).json({ ok: false, step: 'ensureRagSchema', report });
  }

  // ── 4. Write a test chunk ─────────────────────────────────────────────────
  const testId = `test-chunk-${Date.now()}`;
  try {
    await upsertChunkBatch([{
      id: testId,
      source_name: '__test__',
      source_type: 'text',
      chunk_index: 0,
      content: 'diagnostic test chunk',
      embedding: new Array(1536).fill(0.01),
      created_at: Date.now(),
    }]);
    report.writeChunk = { ok: true, id: testId };
  } catch (e: unknown) {
    report.writeChunk = { ok: false, error: String(e) };
    return res.status(500).json({ ok: false, step: 'writeChunk', report });
  }

  // ── 5. List sources ───────────────────────────────────────────────────────
  try {
    const sources = await listSources();
    report.listSources = { ok: true, count: sources.length, sources };
  } catch (e: unknown) {
    report.listSources = { ok: false, error: String(e) };
  }

  // ── 6. OpenAI embed test ──────────────────────────────────────────────────
  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: openaiKey });
    const emb = await openai.embeddings.create({ model: 'text-embedding-3-small', input: 'ping' });
    report.openai = { ok: true, dims: emb.data[0].embedding.length };
  } catch (e: unknown) {
    report.openai = { ok: false, error: String(e) };
  }

  // ── Cleanup test chunk ────────────────────────────────────────────────────
  try {
    const db = createClient({ url: tursoUrl!, authToken: tursoToken! });
    await db.execute({ sql: `DELETE FROM rag_chunks WHERE id = ?`, args: [testId] });
  } catch { /* best-effort */ }

  return res.status(200).json({ ok: true, report });
}
