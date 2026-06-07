import type { Attempt } from './types';

/**
 * Client-side data-access layer. The browser never touches Turso directly —
 * it calls the /api/attempts serverless endpoint, which holds the Turso
 * credentials server-side.
 *
 * Remote sync is on by default; set VITE_REMOTE_DB=false to force local-only.
 * Every function fails soft (no-op / empty) so the app keeps working if the
 * API is unavailable (e.g. plain `vite` dev without serverless functions).
 */

export const isRemoteEnabled = import.meta.env.VITE_REMOTE_DB !== 'false';

const API = '/api/attempts';

interface AttemptRow {
  id: string;
  user_email: string;
  question_id: string;
  topic: string;
  difficulty: string;
  selected: string | null;
  correct: number | boolean;
  time_sec: number;
  confidence: string | null;
  mistake_category: string | null;
  retried: number | boolean | null;
  mode: string | null;
  ts: number;
}

function toPayload(a: Attempt) {
  return {
    id: a.id,
    question_id: a.questionId,
    topic: a.topic,
    difficulty: a.difficulty,
    selected: a.selected,
    correct: a.correct,
    time_sec: Math.round(a.timeSec),
    confidence: a.confidence,
    mistake_category: a.mistakeCategory ?? null,
    retried: a.retried ?? false,
    mode: a.mode,
    ts: a.ts,
  };
}

function fromRow(r: AttemptRow): Attempt {
  return {
    id: r.id,
    questionId: r.question_id,
    topic: r.topic as Attempt['topic'],
    difficulty: r.difficulty as Attempt['difficulty'],
    selected: (r.selected as Attempt['selected']) ?? null,
    correct: Boolean(r.correct),
    timeSec: r.time_sec,
    confidence: (r.confidence as Attempt['confidence']) ?? 'medium',
    mistakeCategory: (r.mistake_category as Attempt['mistakeCategory']) ?? undefined,
    retried: r.retried ? true : undefined,
    mode: (r.mode as Attempt['mode']) ?? 'daily-adaptive',
    ts: r.ts,
  };
}

const PENDING_KEY = 't1450-pending-attempts';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface PendingEntry { email: string; payload: ReturnType<typeof toPayload> }

function readPending(): PendingEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]');
  } catch {
    return [];
  }
}
function writePending(items: PendingEntry[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(items));
  } catch {
    /* storage full / unavailable */
  }
}
function enqueuePending(email: string, payloads: ReturnType<typeof toPayload>[]) {
  const items = readPending();
  for (const payload of payloads) items.push({ email, payload });
  // keep the queue bounded so a long outage can't blow up storage
  writePending(items.slice(-2000));
}

/** POST a batch with retry. Returns true on success, false after exhausting retries. */
async function postWithRetry(body: unknown, attempts = 4): Promise<boolean> {
  if (!isRemoteEnabled) return false;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) return true;
      // 4xx (bad request) won't be fixed by retrying
      if (res.status >= 400 && res.status < 500) {
        console.warn('[db] write rejected:', res.status);
        return false;
      }
    } catch (e) {
      console.warn(`[db] write attempt ${i + 1} failed:`, e);
    }
    if (i < attempts - 1) await sleep(500 * 2 ** i); // 0.5s, 1s, 2s
  }
  return false;
}

/** Replay any attempts that previously failed to sync. Safe to call often. */
export async function flushPending(): Promise<void> {
  if (!isRemoteEnabled) return;
  const items = readPending();
  if (!items.length) return;
  // group by email and upsert in one request per user (idempotent by id)
  const byEmail = new Map<string, ReturnType<typeof toPayload>[]>();
  for (const it of items) (byEmail.get(it.email) ?? byEmail.set(it.email, []).get(it.email)!).push(it.payload);

  const stillFailing: PendingEntry[] = [];
  for (const [email, payloads] of byEmail) {
    const ok = await postWithRetry({ email, attempts: payloads });
    if (!ok) for (const payload of payloads) stillFailing.push({ email, payload });
  }
  writePending(stillFailing);
}

/** Write a single attempt. Guaranteed-delivery: queues locally if the network fails. */
export async function pushAttempt(email: string, attempt: Attempt): Promise<void> {
  if (!isRemoteEnabled) return;
  const payload = toPayload(attempt);
  const ok = await postWithRetry({ email, attempts: [payload] });
  if (ok) {
    // opportunistically drain anything that was waiting
    if (readPending().length) void flushPending();
  } else {
    enqueuePending(email, [payload]);
  }
}

/** Bulk upload (used for seeding demo history into the DB). */
export async function pushAttemptsBulk(email: string, attempts: Attempt[]): Promise<void> {
  if (attempts.length === 0 || !isRemoteEnabled) return;
  const payloads = attempts.map(toPayload);
  const ok = await postWithRetry({ email, attempts: payloads });
  if (!ok) enqueuePending(email, payloads);
}

/** Mark an attempt as retried. */
export async function markRetried(id: string): Promise<void> {
  if (!isRemoteEnabled) return;
  try {
    await fetch(API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, retried: true }),
    });
  } catch {
    /* ignore */
  }
}

async function get(params: string): Promise<AttemptRow[]> {
  if (!isRemoteEnabled) return [];
  try {
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.rows ?? []) as AttemptRow[];
  } catch {
    return [];
  }
}

/** Fetch one user's full attempt history (chronological). */
export async function fetchAttempts(email: string): Promise<Attempt[]> {
  const rows = await get(`email=${encodeURIComponent(email)}`);
  return rows.map(fromRow);
}

/** Fetch history for several users at once (Master Dashboard). */
export async function fetchAttemptsForUsers(emails: string[]): Promise<Record<string, Attempt[]>> {
  const out: Record<string, Attempt[]> = {};
  if (emails.length === 0) return out;
  const rows = await get(`emails=${encodeURIComponent(emails.join(','))}`);
  for (const r of rows) (out[r.user_email] ??= []).push(fromRow(r));
  return out;
}
