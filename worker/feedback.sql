CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  audio TEXT NOT NULL DEFAULT '',
  mime TEXT NOT NULL DEFAULT '',
  created INTEGER NOT NULL,
  seen INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS feedback_created ON feedback(created);
CREATE INDEX IF NOT EXISTS feedback_sender ON feedback(user_id, created);
