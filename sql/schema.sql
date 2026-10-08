CREATE TABLE IF NOT EXISTS reviews (
  id             SERIAL PRIMARY KEY,
  repo_full_name TEXT NOT NULL,
  pr_number      INTEGER NOT NULL,
  head_sha       TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'completed', 'failed')),
  summary        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS findings (
  id                SERIAL PRIMARY KEY,
  review_id         INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  file              TEXT NOT NULL,
  line              INTEGER NOT NULL,
  severity          TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  category          TEXT NOT NULL,
  message           TEXT NOT NULL,
  suggestion        TEXT,
  github_comment_id BIGINT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);