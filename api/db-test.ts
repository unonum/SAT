import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client';

/** Diagnostic endpoint — tests Turso + OpenAI + Anthropic connectivity. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const report: Record<string, unknown> = {
    env: {
      TURSO_DATABASE_URL: tursoUrl ? `${tursoUrl.slice(0, 24)}…` : 'NOT SET',
      TURSO_AUTH_TOKEN: tursoToken ? `${tursoToken.slice(0, 12)}…` : 'NOT SET',
      OPENAI_API_KEY: openaiKey ? `${openaiKey.slice(0, 10)}…` : 'NOT SET',
      ANTHROPIC_API_KEY: anthropicKey ? `${anthropicKey.slice(0, 12)}…` : 'NOT SET',
    },
  };

  // ── Turso ──────────────────────────────────────────────────────────────────
  if (tursoUrl && tursoToken) {
    try {
      const db = createClient({ url: tursoUrl, authToken: tursoToken });
      const ping = await db.execute('SELECT 1 AS ok');
      const tables = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
      report.turso = {
        ok: true,
        ping: ping.rows,
        tables: tables.rows.map((r) => r.name),
      };
    } catch (err: unknown) {
      report.turso = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  } else {
    report.turso = { ok: false, error: 'Missing env vars' };
  }

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  if (openaiKey) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: openaiKey });
      // Cheapest possible call — embed a single short string
      const emb = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'ping',
      });
      report.openai = { ok: true, dims: emb.data[0].embedding.length };
    } catch (err: unknown) {
      report.openai = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  } else {
    report.openai = { ok: false, error: 'OPENAI_API_KEY not set' };
  }

  // ── Anthropic ──────────────────────────────────────────────────────────────
  if (anthropicKey) {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8,
        messages: [{ role: 'user', content: 'Say "ok"' }],
      });
      report.anthropic = { ok: true, reply: (msg.content[0] as { text: string }).text };
    } catch (err: unknown) {
      report.anthropic = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  } else {
    report.anthropic = { ok: false, error: 'ANTHROPIC_API_KEY not set' };
  }

  const allOk =
    (report.turso as { ok: boolean }).ok &&
    (report.openai as { ok: boolean }).ok &&
    (report.anthropic as { ok: boolean }).ok;

  return res.status(allOk ? 200 : 500).json({ ok: allOk, report });
}
