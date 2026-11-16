CREATE TABLE IF NOT EXISTS training_invites (
  code_hash TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS training_invites_expiry ON training_invites(expires);

CREATE TABLE IF NOT EXISTS training_readers (
  device_hash TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'revoked')),
  requested_at INTEGER NOT NULL,
  approved_at INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS training_readers_status ON training_readers(status, updated_at DESC);
