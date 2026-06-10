import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getClient, ensureSchema, ensureMockSchema, ensureRagSchema } from './_lib/turso.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const start = Date.now();
  const checks: Record<string, string> = {};

  try {
    const db = getClient();
    await db.execute('SELECT 1');
    checks.db = 'ok';
  } catch (e) {
    checks.db = `fail: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    await ensureSchema();
    await ensureMockSchema();
    await ensureRagSchema();
    checks.schema = 'ok';
  } catch (e) {
    checks.schema = `fail: ${e instanceof Error ? e.message : String(e)}`;
  }

  checks.openai_key = process.env.OPENAI_API_KEY ? 'set' : 'missing';
  checks.anthropic_key = process.env.ANTHROPIC_API_KEY ? 'set' : 'missing';
  checks.turso_url = process.env.TURSO_DATABASE_URL ? 'set' : 'missing';

  const allOk = Object.values(checks).every((v) => v === 'ok' || v === 'set');
  const latencyMs = Date.now() - start;

  return res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    latencyMs,
    checks,
    ts: new Date().toISOString(),
  });
}
