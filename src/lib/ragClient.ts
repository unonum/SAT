import type { Question, TopicId } from './types';

/** Extract text from a PDF file in the browser so the binary never crosses the function boundary. */
async function extractPdfTextInBrowser(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  // Point the worker at the bundled worker file served from node_modules
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    parts.push(pageText);
  }
  return parts.join('\n');
}

// Keep each PDF request far below Vercel's fixed 4.5 MB function payload limit.
// This also stays below the API's 600-chunk cap (about 270,000 characters).
const PDF_TEXT_BATCH_CHAR_LIMIT = 200_000;
const MAX_SINGLE_REQUEST_BYTES = 4_000_000;

type IngestResponse = { ok: boolean; chunks: number };

function splitTextIntoBatches(text: string, maxChars = PDF_TEXT_BATCH_CHAR_LIMIT): string[] {
  const batches: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const minimumBreak = start + Math.floor(maxChars * 0.75);
      const newlineBreak = text.lastIndexOf('\n', end);
      const spaceBreak = text.lastIndexOf(' ', end);
      const naturalBreak = Math.max(newlineBreak, spaceBreak);
      if (naturalBreak >= minimumBreak) end = naturalBreak + 1;
    }

    const batch = text.slice(start, end).trim();
    if (batch) batches.push(batch);
    start = end;
  }

  return batches;
}

function createUploadId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function postIngestRequest(
  body: string,
  onUploadProgress?: (fraction: number) => void
): Promise<IngestResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/rag-ingest');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onUploadProgress?.(event.loaded / event.total);
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as IngestResponse);
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(err.error ?? `Server error ${xhr.status}`));
        } catch {
          reject(new Error(`Server error ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
    xhr.send(body);
  });
}

export async function ingestFile(
  filename: string,
  filetype: string,
  base64data: string
): Promise<IngestResponse> {
  return ingestFileWithProgress(filename, filetype, base64data);
}

/** Extract PDFs client-side and send their text in bounded batches below Vercel's payload limit. */
export async function ingestFileWithProgress(
  filename: string,
  filetype: string,
  base64data: string,
  onProgress?: (pct: number) => void,
  originalFile?: File
): Promise<IngestResponse> {
  if (filetype === 'pdf' && originalFile) {
    onProgress?.(5);
    const text = await extractPdfTextInBrowser(originalFile);
    const textBatches = splitTextIntoBatches(text);
    if (textBatches.length === 0) throw new Error('No text could be extracted from the PDF');

    const uploadId = createUploadId();
    const uploadStartedAt = Date.now();
    let chunks = 0;
    onProgress?.(20);

    for (let batchIndex = 0; batchIndex < textBatches.length; batchIndex++) {
      const body = JSON.stringify({
        filename,
        filetype,
        text: textBatches[batchIndex],
        uploadId,
        uploadStartedAt,
        batchIndex,
        totalBatches: textBatches.length,
      });
      const result = await postIngestRequest(body, (fraction) => {
        const completedFraction = (batchIndex + fraction) / textBatches.length;
        onProgress?.(20 + Math.round(completedFraction * 70));
      });
      chunks += result.chunks;
      onProgress?.(20 + Math.round(((batchIndex + 1) / textBatches.length) * 70));
    }

    onProgress?.(100);
    return { ok: true, chunks };
  }

  const body = JSON.stringify({ filename, filetype, data: base64data });
  if (new Blob([body]).size > MAX_SINGLE_REQUEST_BYTES) {
    throw new Error('File is too large to upload directly. Use a PDF or a file smaller than 3 MB.');
  }

  const result = await postIngestRequest(body, (fraction) => {
    onProgress?.(Math.round(fraction * 90));
  });
  onProgress?.(100);
  return result;
}

export async function createNovelTestSession({
  email,
  mode,
  count,
  topics = [],
  attempts,
  fallbackQuestions,
}: {
  email: string;
  mode: string;
  count: number;
  topics?: TopicId[];
  attempts: import('./types').Attempt[];
  fallbackQuestions: Question[];
}): Promise<Question[]> {
  const fallbackById = new Map(fallbackQuestions.map((question) => [question.id, question]));
  const avoidPrompts = attempts
    .map((attempt) => fallbackById.get(attempt.questionId)?.prompt)
    .filter((prompt): prompt is string => Boolean(prompt));
  const response = await fetch('/api/test-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      mode,
      count,
      topics,
      attempts: attempts.map(({ questionId, topic, difficulty, correct, ts, timeSec, confidence, mistakeCategory, retried }) => ({
        questionId, topic, difficulty, correct, ts, timeSec,
        confidence, mistakeCategory: mistakeCategory ?? null, retried: retried ?? false,
      })),
      avoidPrompts,
      fallbackQuestions,
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unable to create a novel test' }));
    throw new Error((error as { error?: string }).error ?? 'Unable to create a novel test');
  }
  const data = await response.json() as { questions: Question[] };
  return data.questions;
}

export async function generateRagQuestions(
  topic: string,
  difficulty: string,
  count: number,
  section: string
): Promise<Question[]> {
  const resp = await fetch('/api/rag-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty, count, section }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => null);
    const msg = (err as { error?: string } | null)?.error ?? `Server error ${resp.status}`;
    throw new Error(msg);
  }
  const data = (await resp.json()) as { questions: RagQuestionRowRaw[] };
  return data.questions.map(rowToQuestion);
}

export async function fetchRagQuestions(topic?: string, difficulty?: string): Promise<Question[]> {
  const params = new URLSearchParams();
  if (topic) params.set('topic', topic);
  if (difficulty) params.set('difficulty', difficulty);
  const resp = await fetch(`/api/rag-questions?${params.toString()}`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error?: string }).error ?? 'Fetch failed');
  }
  const data = (await resp.json()) as { rows: RagQuestionRowRaw[] };
  return data.rows.map(rowToQuestion);
}

/** Deletes all stored questions that reference missing visuals (line graphs, tables, etc.) without a passage. */
export async function purgeBrokenQuestions(): Promise<{ deleted: number; ids: string[] }> {
  const resp = await fetch('/api/rag-questions?purge-broken=true', { method: 'DELETE' });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error?: string }).error ?? 'Purge failed');
  }
  return resp.json() as Promise<{ deleted: number; ids: string[] }>;
}

export async function deleteRagQuestion(id: string): Promise<void> {
  const resp = await fetch(`/api/rag-questions?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error?: string }).error ?? 'Delete failed');
  }
}

export async function listSources(): Promise<
  Array<{ source_name: string; source_type: string; chunk_count: number; created_at: number }>
> {
  const resp = await fetch('/api/rag-ingest?list=true');
  if (!resp.ok) return [];
  const data = (await resp.json()) as { sources: Array<{ source_name: string; source_type: string; chunk_count: number; created_at: number }> };
  return data.sources ?? [];
}

interface RagQuestionRowRaw {
  id: string;
  topic: string;
  subtopic: string;
  section: string;
  difficulty: string;
  passage: string | null;
  prompt: string;
  choices: string;
  correct: string;
  par_time_sec: number;
  explanation: string;
  source_chunk: string | null;
  created_at: number;
}

function rowToQuestion(row: RagQuestionRowRaw): Question {
  let choices: { id: 'A' | 'B' | 'C' | 'D'; text: string }[] = [];
  try {
    choices = typeof row.choices === 'string' ? JSON.parse(row.choices) : row.choices;
  } catch {
    choices = [];
  }

  let explanation = {
    correctWhy: '',
    fastStrategy: '',
    simplerView: '',
    trapNote: '',
    timeTrick: '',
    whyWrong: {} as Partial<Record<'A' | 'B' | 'C' | 'D', string>>,
  };
  try {
    const parsed =
      typeof row.explanation === 'string' ? JSON.parse(row.explanation) : row.explanation;
    explanation = {
      correctWhy: parsed.correctWhy ?? '',
      fastStrategy: parsed.fastStrategy ?? '',
      simplerView: parsed.simplerView ?? '',
      trapNote: parsed.trapNote ?? '',
      timeTrick: parsed.timeTrick ?? '',
      whyWrong: parsed.whyWrong ?? {},
    };
  } catch {
    // keep defaults
  }

  return {
    id: row.id,
    topic: row.topic as TopicId,
    subtopic: row.subtopic,
    section: row.section as 'Math' | 'Reading & Writing',
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    passage: row.passage ?? undefined,
    prompt: row.prompt,
    choices,
    correct: row.correct as 'A' | 'B' | 'C' | 'D',
    parTimeSec: row.par_time_sec,
    explanation,
    ragGenerated: true,
    sourceChunk: row.source_chunk ?? undefined,
  };
}
