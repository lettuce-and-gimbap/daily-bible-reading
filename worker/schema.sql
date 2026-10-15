-- 사용자 계정 · 기록 동기화 표 (npx wrangler d1 execute daily-bible-users --remote --file=schema.sql)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,          -- 아이디(소문자)
  pw_hash TEXT NOT NULL,        -- PBKDF2-SHA256 결과(hex)
  salt TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,  -- 로그인 토큰의 SHA-256 (토큰 원문은 기기에만 있음)
  user_id TEXT NOT NULL,
  created INTEGER NOT NULL,
  last INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT PRIMARY KEY,
  json TEXT NOT NULL,           -- 앱 기록 전체(state)
  updated INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS links (
  code TEXT PRIMARY KEY,        -- QR·연결 코드 (10분짜리, 한 번 쓰면 사라짐)
  user_id TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS login_fails (
  key TEXT PRIMARY KEY,         -- 아이디별 로그인 실패 횟수 (비밀번호 마구 넣기 막기)
  count INTEGER NOT NULL,
  until INTEGER NOT NULL
);
