import { createClient, type Client } from '@libsql/client';

// Server-side Turso connection. The auth token is read from env vars and
// never reaches the browser — the SPA only ever talks to /api/*.
let client: Client | null = null;
let schemaReady = false;

export function getClient(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set');
  client = createClient({ url, authToken });
  return client;
}

/** Create the attempts table on first use (idempotent). */
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attempts (
      id               TEXT PRIMARY KEY,
      user_email       TEXT NOT NULL,
      question_id      TEXT NOT NULL,
      topic            TEXT NOT NULL,
      difficulty       TEXT NOT NULL,
      selected         TEXT,
      correct          INTEGER NOT NULL,
      time_sec         INTEGER NOT NULL,
      confidence       TEXT,
      mistake_category TEXT,
      retried          INTEGER DEFAULT 0,
      mode             TEXT,
      ts               INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_email, ts)`);
  schemaReady = true;
}
