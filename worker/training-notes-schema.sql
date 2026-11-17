CREATE TABLE IF NOT EXISTS lesson_notes (
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
  lesson INTEGER NOT NULL CHECK (lesson BETWEEN 1 AND 12),
  raw_text TEXT NOT NULL,
  published_text TEXT NOT NULL,
  questions_json TEXT NOT NULL,
  revision INTEGER NOT NULL,
  PRIMARY KEY (semester, lesson)
);
