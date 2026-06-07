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

-- RAG source chunks with embeddings (stored as JSON float array)
CREATE TABLE IF NOT EXISTS rag_chunks (
  id          TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,  -- pdf | image | excel | text | markdown
  chunk_index INTEGER NOT NULL,
  content     TEXT NOT NULL,
  embedding   TEXT NOT NULL,  -- JSON array of floats (text-embedding-3-small, 1536 dims)
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_source ON rag_chunks(source_name);

-- RAG-generated questions stored in DB
CREATE TABLE IF NOT EXISTS rag_questions (
  id           TEXT PRIMARY KEY,
  topic        TEXT NOT NULL,
  subtopic     TEXT NOT NULL,
  section      TEXT NOT NULL,
  difficulty   TEXT NOT NULL,
  passage      TEXT,
  prompt       TEXT NOT NULL,
  choices      TEXT NOT NULL,  -- JSON: [{id,text},...]
  correct      TEXT NOT NULL,  -- A|B|C|D
  par_time_sec INTEGER NOT NULL,
  explanation  TEXT NOT NULL,  -- JSON: {correctWhy,fastStrategy,simplerView,trapNote,timeTrick,whyWrong}
  source_chunk TEXT,           -- chunk id used to generate this
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rag_questions_topic ON rag_questions(topic, difficulty);
