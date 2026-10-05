-- init.sql
-- Runs automatically the first time the Postgres container starts.
-- Docker mounts this via docker-entrypoint-initdb.d — safe to run multiple times
-- because of IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS tasks (
  id         SERIAL PRIMARY KEY,
  title      TEXT    NOT NULL,
  done       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed three example tasks only if the table is empty
INSERT INTO tasks (title, done)
SELECT * FROM (VALUES
  ('Buy groceries', FALSE),
  ('Walk the dog',  FALSE),
  ('Read a book',   TRUE)
) AS seed(title, done)
WHERE NOT EXISTS (SELECT 1 FROM tasks);
