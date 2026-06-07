import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getClient, ensureSchema } from './_lib/turso';

// Single endpoint for the attempts history:
//   GET    /api/attempts?email=x            -> rows for one user
//   GET    /api/attempts?emails=a,b,c        -> rows for several users
//   POST   /api/attempts  { email, attempts } -> upsert (one or many)
//   PATCH  /api/attempts  { id, retried }    -> mark retried

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await ensureSchema();
    const db = getClient();

    if (req.method === 'GET') {
      const { email, emails } = req.query;
      const list = emails
        ? String(emails).split(',').map((e) => e.trim().toLowerCase())
        : email
        ? [String(email).trim().toLowerCase()]
        : [];
      if (list.length === 0) return res.status(400).json({ error: 'email or emails required' });

      const placeholders = list.map(() => '?').join(',');
      const result = await db.execute({
        sql: `SELECT * FROM attempts WHERE user_email IN (${placeholders}) ORDER BY ts ASC`,
        args: list,
      });
      return res.status(200).json({ rows: result.rows });
    }

    if (req.method === 'POST') {
      const { email, attempts } = req.body ?? {};
      if (!email || !Array.isArray(attempts)) {
        return res.status(400).json({ error: 'email and attempts[] required' });
      }
      const e = String(email).trim().toLowerCase();
      if (attempts.length === 0) return res.status(200).json({ inserted: 0 });

      const stmts = attempts.map((a: any) => ({
        sql: `INSERT OR REPLACE INTO attempts
          (id, user_email, question_id, topic, difficulty, selected, correct, time_sec, confidence, mistake_category, retried, mode, ts)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          a.id, e, a.question_id, a.topic, a.difficulty, a.selected ?? null,
          a.correct ? 1 : 0, Math.round(a.time_sec ?? 0), a.confidence ?? null,
          a.mistake_category ?? null, a.retried ? 1 : 0, a.mode ?? null, a.ts,
        ],
      }));
      // libSQL batch has a statement limit; chunk into groups of 100
      for (let i = 0; i < stmts.length; i += 100) {
        await db.batch(stmts.slice(i, i + 100), 'write');
      }
      return res.status(200).json({ inserted: attempts.length });
    }

    if (req.method === 'PATCH') {
      const { id, retried } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'id required' });
      await db.execute({
        sql: `UPDATE attempts SET retried = ? WHERE id = ?`,
        args: [retried ? 1 : 0, id],
      });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[api/attempts]', err);
    return res.status(500).json({ error: err?.message ?? 'Server error' });
  }
}
