import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureRagSchema, upsertChunk, listSources } from './_lib/turso';

// Raise the body-parser limit so base64-encoded files don't hit a 413.
export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

async function extractText(filetype: string, buffer: Buffer): Promise<string> {
  if (filetype === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'image'].includes(filetype)) {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp', image: 'image/png',
    };
    const mime = mimeMap[filetype] ?? 'image/png';
    const base64 = buffer.toString('base64');
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mime};base64,${base64}` },
            },
            {
              type: 'text',
              text: 'Extract all text from this image exactly as written. If there are math equations, write them out in plain text.',
            },
          ],
        },
      ],
    });
    return resp.choices[0]?.message?.content ?? '';
  }

  if (['xlsx', 'xls', 'excel'].includes(filetype)) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const parts: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });
      parts.push(`Sheet: ${sheetName}`);
      for (const row of rows as unknown[][]) {
        if (Array.isArray(row) && row.length > 0) {
          parts.push(row.map((c) => (c != null ? String(c) : '')).join('\t'));
        }
      }
    }
    return parts.join('\n');
  }

  // text | markdown | default
  return buffer.toString('utf-8');
}

function chunkText(text: string, size = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end).trim());
    start += size - overlap;
  }
  return chunks.filter((c) => c.length > 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await ensureRagSchema();
  } catch (schemaErr: unknown) {
    const msg = schemaErr instanceof Error ? schemaErr.message : String(schemaErr);
    console.error('[rag-ingest] schema init failed:', msg);
    return res.status(500).json({ error: `DB init failed: ${msg}` });
  }

  // GET ?list=true — return list of sources
  if (req.method === 'GET') {
    if (req.query.list === 'true') {
      const sources = await listSources();
      return res.status(200).json({ sources });
    }
    return res.status(400).json({ error: 'Unknown GET request' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, filetype, data: base64data } = req.body ?? {};
  if (!filename || !filetype || !base64data) {
    return res.status(400).json({ error: 'filename, filetype, and data are required' });
  }

  try {
    const buffer = Buffer.from(base64data, 'base64');
    const text = await extractText(filetype, buffer);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from the file' });
    }

    const chunks = chunkText(text);
    const now = Date.now();

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Embed in batches of 20
    let chunkCount = 0;
    for (let i = 0; i < chunks.length; i += 20) {
      const batch = chunks.slice(i, i + 20);
      const embResp = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });
      for (let j = 0; j < batch.length; j++) {
        const globalIdx = i + j;
        await upsertChunk({
          id: `chunk-${filename}-${globalIdx}-${now}`,
          source_name: filename,
          source_type: filetype,
          chunk_index: globalIdx,
          content: batch[j],
          embedding: embResp.data[j].embedding,
          created_at: now,
        });
        chunkCount++;
      }
    }

    return res.status(200).json({ ok: true, chunks: chunkCount, source: filename });
  } catch (err: unknown) {
    console.error('rag-ingest error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
