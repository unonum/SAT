-- Target1450 — Turso (libSQL / SQLite) schema
-- The API also creates this automatically on first use (ensureSchema),
-- but you can apply it manually with:
--   turso db shell <your-db> < db/schema.sql

CREATE TABLE IF NOT EXISTS attempts (
  id               TEXT PRIMARY KEY,   -- client-generated attempt id
  user_email       TEXT NOT NULL,      -- which user this attempt belongs to
  question_id      TEXT NOT NULL,
  topic            TEXT NOT NULL,
  difficulty       TEXT NOT NULL,      -- easy | medium | hard
  selected         TEXT,               -- A | B | C | D | null (skipped)
  correct          INTEGER NOT NULL,   -- 0 | 1
  time_sec         INTEGER NOT NULL,
  confidence       TEXT,               -- low | medium | high
  mistake_category TEXT,               -- concept-gap | misread | ... | null
  retried          INTEGER DEFAULT 0,  -- 0 | 1
  mode             TEXT,               -- diagnostic | daily-adaptive | ...
  ts               INTEGER NOT NULL    -- epoch ms; full history is derivable
);

CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts (user_email, ts);
