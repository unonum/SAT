import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client';

/** Temporary diagnostic endpoint — remove after confirming DB connectivity. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const report: Record<string, unknown> = {
    env: {
      TURSO_DATABASE_URL: url ? `${url.slice(0, 20)}…` : 'NOT SET',
      TURSO_AUTH_TOKEN: authToken ? `${authToken.slice(0, 12)}…` : 'NOT SET',
    },
  };

  if (!url || !authToken) {
    return res.status(500).json({ error: 'Missing env vars', report });
  }

  try {
    const db = createClient({ url, authToken });

    const ping = await db.execute('SELECT 1 AS ok');
    report.ping = ping.rows;

    const tables = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
    report.tables = tables.rows.map((r) => r.name);

    const counts: Record<string, number> = {};
    for (const name of ['attempts', 'rag_chunks', 'rag_questions']) {
      const exists = (tables.rows as Array<{ name: unknown }>).some((r) => r.name === name);
      if (exists) {
        const cnt = await db.execute(`SELECT COUNT(*) as c FROM ${name}`);
        counts[name] = cnt.rows[0].c as number;
      } else {
        counts[name] = -1; // -1 = table not yet created
      }
    }
    report.row_counts = counts;

    return res.status(200).json({ ok: true, report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message, report });
  }
}
