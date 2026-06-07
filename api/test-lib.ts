import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getClient } from './_lib/turso';

/** Minimal test: does importing _lib/turso crash the function? */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const db = getClient();
    const r = await db.execute('SELECT 1 AS ok');
    return res.status(200).json({ ok: true, rows: r.rows });
  } catch (e: unknown) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
