import type { Question, TopicId } from './types';

export async function ingestFile(
  filename: string,
  filetype: string,
  base64data: string
): Promise<{ ok: boolean; chunks: number }> {
  return ingestFileWithProgress(filename, filetype, base64data);
}

export function ingestFileWithProgress(
  filename: string,
  filetype: string,
  base64data: string,
  onProgress?: (pct: number) => void
): Promise<{ ok: boolean; chunks: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/rag-ingest');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        // Upload phase: 0–90%, server processing: 90–100%
        onProgress(Math.round((e.loaded / e.total) * 90));
      }
    });

    xhr.upload.addEventListener('load', () => {
      onProgress?.(90);
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error((err as { error?: string }).error ?? `Server error ${xhr.status}`));
        } catch {
          reject(new Error(`Server error ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.send(JSON.stringify({ filename, filetype, data: base64data }));
  });
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
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error?: string }).error ?? 'Generation failed');
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
