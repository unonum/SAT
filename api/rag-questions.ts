import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureRagSchema, fetchRagQuestions, deleteRagQuestion } from './_lib/turso';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await ensureRagSchema();

  if (req.method === 'GET') {
    const topic = req.query.topic as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    const rows = await fetchRagQuestions({ topic, difficulty });
    return res.status(200).json({ rows });
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string | undefined;
    if (!id) return res.status(400).json({ error: 'id is required' });
    await deleteRagQuestion(id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
