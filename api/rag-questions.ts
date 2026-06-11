import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureRagSchema, fetchRagQuestions, deleteRagQuestion } from './_lib/turso.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (!process.env.TURSO_DATABASE_URL) return res.status(500).json({ error: 'TURSO_DATABASE_URL env var is not set on the server.' });
    if (!process.env.TURSO_AUTH_TOKEN) return res.status(500).json({ error: 'TURSO_AUTH_TOKEN env var is not set on the server.' });
    await ensureRagSchema();

    if (req.method === 'GET') {
      const topic = req.query.topic as string | undefined;
      const difficulty = req.query.difficulty as string | undefined;
      const rows = await fetchRagQuestions({ topic, difficulty });
      return res.status(200).json({ rows });
    }

    if (req.method === 'DELETE') {
      // ?purge-broken=true — remove all stored questions that reference missing data
      if (req.query['purge-broken'] === 'true') {
        const BROKEN_PATTERNS = [
          /\bthe table\b/i, /\bthe graph\b/i, /\bthe chart\b/i, /\bthe figure\b/i,
          /\bthe diagram\b/i, /\baccording to the\b/i, /\bshown (above|below|in the)\b/i,
          /\bas shown\b/i, /\bbased on the (table|graph|chart|data|figure)\b/i,
          /\bin the (table|graph|chart|figure)\b/i,
          /\bline graph\b/i, /\bbar graph\b/i, /\bbar chart\b/i, /\bpie chart\b/i,
          /\bscatter plot\b/i, /\bhistogram\b/i, /\bvenn diagram\b/i, /\bnumber line\b/i,
          /\bcoordinate plane\b/i, /\bgraphed (above|below|on)\b/i,
          /\bthe plot\b/i, /\bplotted (above|below|on)\b/i,
          /\bthe following (table|graph|chart|figure|diagram|data)\b/i,
        ];
        const all = await fetchRagQuestions();
        const broken = all.filter(
          (q) => !q.passage?.trim() && BROKEN_PATTERNS.some((re) => re.test(q.prompt))
        );
        for (const q of broken) await deleteRagQuestion(q.id);
        return res.status(200).json({ ok: true, deleted: broken.length, ids: broken.map((q) => q.id) });
      }

      const id = req.query.id as string | undefined;
      if (!id) return res.status(400).json({ error: 'id is required' });
      await deleteRagQuestion(id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[rag-questions]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
