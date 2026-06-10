import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ensureMockSchema, upsertMockSession, getMockSession, listMockSessions,
  listMockSessionsByDate,
  type MockSessionRow,
} from './_lib/turso.js';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await ensureMockSchema();

    if (req.method === 'GET') {
      const email = String(req.query.email ?? '');
      const date = req.query.date ? String(req.query.date) : undefined;
      const id = req.query.id ? String(req.query.id) : undefined;
      if (!email) return res.status(400).json({ error: 'email required' });

      if (date && req.query.all === 'true') {
        // All attempts for a specific date (multi-attempt support)
        const sessions = await listMockSessionsByDate(email, date);
        return res.status(200).json({ sessions });
      }

      if (date || id) {
        // Full session with questions_json — by id or latest for date
        const session = await getMockSession(email, (date ?? id)!);
        return res.status(200).json({ session });
      }
      // Summary list (no questions_json)
      const sessions = await listMockSessions(email);
      return res.status(200).json({ sessions });
    }

    if (req.method === 'POST') {
      const body = req.body as Partial<MockSessionRow>;
      if (!body.id || !body.user_email || !body.date) {
        return res.status(400).json({ error: 'id, user_email, date required' });
      }
      await upsertMockSession({
        id: body.id,
        user_email: body.user_email,
        date: body.date,
        status: body.status ?? 'in-progress',
        questions_json: body.questions_json ?? '[]',
        answers_json: body.answers_json ?? '{}',
        phase: body.phase ?? 'rw',
        rw_idx: body.rw_idx ?? 0,
        math_idx: body.math_idx ?? 0,
        rw_started_at: body.rw_started_at ?? null,
        math_started_at: body.math_started_at ?? null,
        started_at: body.started_at ?? Date.now(),
        completed_at: body.completed_at ?? null,
        rw_correct: body.rw_correct ?? 0,
        rw_total: body.rw_total ?? 0,
        math_correct: body.math_correct ?? 0,
        math_total: body.math_total ?? 0,
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[mock-sessions]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
