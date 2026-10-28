// 사용자 계정 · 기록 동기화 (D1, 표는 schema.sql)
// - 아이디·비밀번호로 가입/로그인 → 토큰을 기기에 저장, 서버엔 토큰의 해시만 둠
// - 기록(state JSON)은 사용자마다 한 덩어리로 저장. 합치기(merge)는 앱이 하고 서버는 마지막 것을 보관
// - 연결 코드(QR): 로그인한 기기가 10분짜리 일회용 코드를 만들면 새 기기는 비밀번호 없이 그 코드로 로그인

import { feedback } from './feedback.js';

const ID_RE = /^[a-z0-9_]{3,20}$/;
const MAX_DATA_BYTES = 4_000_000; // UTF-8 JSON 4MB per account
const MAX_REMINDER_DB_BYTES = 1_000_000;
const ADMIN_IDS = new Set(["buucksoo"]);
const REMINDER_MESSAGE_KEY = "admin:reminder-messages";
const LINK_MS = 10 * 60 * 1000;
const FAIL_LIMIT = 8, FAIL_LOCK_MS = 15 * 60 * 1000;

export async function account(pathname, request, env, json) {
  const db = env.DB;
  const body = request.method === "GET" ? {} : await request.json().catch(() => ({}));
  const now = Date.now();

  if (pathname === "/account/signup") {
    const id = String(body.id || "").trim().toLowerCase(), pw = String(body.pw || "");
    if (!ID_RE.test(id)) return json({ error: "아이디는 영어 소문자·숫자·_ 로 3~20자예요" }, 400);
    if (pw.length < 6) return json({ error: "비밀번호는 6자 이상으로 해 주세요" }, 400);
    if (await db.prepare("SELECT 1 FROM users WHERE id = ?").bind(id).first()) return json({ error: "이미 있는 아이디예요" }, 409);
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    await db.prepare("INSERT INTO users (id, pw_hash, salt, created) VALUES (?, ?, ?, ?)").bind(id, await pwHash(pw, salt), salt, now).run();
    return json({ id, token: await newSession(db, id, now) });
  }

  if (pathname === "/account/login") {
    const id = String(body.id || "").trim().toLowerCase(), pw = String(body.pw || "");
    const fail = await db.prepare("SELECT count, until FROM login_fails WHERE key = ?").bind(id).first();
    if (fail && fail.count >= FAIL_LIMIT && fail.until > now) return json({ error: "비밀번호를 여러 번 틀려서 15분 동안 잠겼어요" }, 429);
    const user = await db.prepare("SELECT pw_hash, salt FROM users WHERE id = ?").bind(id).first();
    if (!user || (await pwHash(pw, user.salt)) !== user.pw_hash) {
      const count = fail && fail.until > now ? fail.count + 1 : 1;
      await db.prepare("INSERT OR REPLACE INTO login_fails (key, count, until) VALUES (?, ?, ?)").bind(id, count, now + FAIL_LOCK_MS).run();
      return json({ error: "아이디나 비밀번호가 맞지 않아요" }, 401);
    }
    await db.prepare("DELETE FROM login_fails WHERE key = ?").bind(id).run();
    return json({ id, token: await newSession(db, id, now) });
  }

  if (pathname === "/account/claim") { // 연결 코드로 로그인
    const code = String(body.code || "").trim().toUpperCase();
    const link = await db.prepare("SELECT user_id, expires FROM links WHERE code = ?").bind(code).first();
    await db.prepare("DELETE FROM links WHERE code = ? OR expires < ?").bind(code, now).run();
    if (!link || link.expires < now) return json({ error: "코드가 없거나 시간이 지났어요. 새로 만들어 주세요" }, 404);
    return json({ id: link.user_id, token: await newSession(db, link.user_id, now) });
  }

  // 여기부터는 로그인한 기기만
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const session = token && await db.prepare("SELECT user_id, last FROM sessions WHERE token_hash = ?").bind(await sha(token)).first();
  if (!session) return json({ error: "로그인이 필요해요" }, 401);
  const uid = session.user_id;
  if (now - session.last > 3600_000) await db.prepare("UPDATE sessions SET last = ? WHERE token_hash = ?").bind(now, await sha(token)).run();
  if (pathname === "/account/admin/reminder-messages") {
    if (!ADMIN_IDS.has(String(uid).toLowerCase())) return json({ error: "관리자만 수정할 수 있어요" }, 403);
    if (request.method === "GET") {
      const saved = await env.SUBS.get(REMINDER_MESSAGE_KEY, "json");
      return json(saved || { messages: null, updated: 0 });
    }
    if (request.method !== "PUT") return json({ error: "지원하지 않는 요청" }, 405);
    if (body.messages === null) {
      await env.SUBS.delete(REMINDER_MESSAGE_KEY);
      return json({ ok: true, messages: null, updated: Date.now() });
    }
    const text = JSON.stringify(body.messages);
    if (new TextEncoder().encode(text).byteLength > MAX_REMINDER_DB_BYTES || !validReminderMessages(body.messages)) {
      return json({ error: "알림 문구 DB 형식이 맞지 않거나 1MB를 넘어요" }, 400);
    }
    const updated = Date.now();
    await env.SUBS.put(REMINDER_MESSAGE_KEY, JSON.stringify({ messages: body.messages, updated }));
    return json({ ok: true, updated });
  }
  if (pathname === '/account/feedback' || pathname === '/account/feedback/audio' || pathname === '/account/feedback/read') return feedback(pathname, request, db, uid, body, json);
  if (pathname === "/account/data" && request.method === "GET") {
    const row = await db.prepare("SELECT json, updated FROM user_data WHERE user_id = ?").bind(uid).first();
    return json({ id: uid, data: row ? JSON.parse(row.json) : null, updated: row ? row.updated : 0 });
  }
  if (pathname === "/account/data") {
    const text = JSON.stringify(body.data || null);
    if (!body.data || new TextEncoder().encode(text).byteLength > MAX_DATA_BYTES) return json({ error: "기록이 비었거나 너무 커요" }, 400);
    await db.prepare("INSERT OR REPLACE INTO user_data (user_id, json, updated) VALUES (?, ?, ?)").bind(uid, text, now).run();
    return json({ ok: true, updated: now });
  }
  if (pathname === "/account/link") {
    const code = linkCode();
    await db.prepare("INSERT INTO links (code, user_id, expires) VALUES (?, ?, ?)").bind(code, uid, now + LINK_MS).run();
    return json({ code, expires: now + LINK_MS });
  }
  if (pathname === "/account/logout") {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha(token)).run();
    return json({ ok: true });
  }
  if (pathname === "/account/password") {
    const pw = String(body.pw || "");
    if (pw.length < 6) return json({ error: "비밀번호는 6자 이상으로 해 주세요" }, 400);
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    await db.prepare("UPDATE users SET pw_hash = ?, salt = ? WHERE id = ?").bind(await pwHash(pw, salt), salt, uid).run();
    return json({ ok: true });
  }
  return json({ error: "not found" }, 404);
}

export function validReminderMessages(messages) {
  const tiers = ["morning", "afternoon", "evening", "night", "last", "done"];
  if (!messages || typeof messages !== "object" || Array.isArray(messages)
    || tiers.some((tier) => !Array.isArray(messages[tier]))
    || Object.keys(messages).some((key) => !tiers.includes(key))) return false;
  return tiers.every((tier) => messages[tier].length <= 200 && messages[tier].every((row) => {
    if (!Array.isArray(row) || row.length < 3 || row.length > 6) return false;
    if (![0, 1, 2].every((i) => typeof row[i] === "string")) return false;
    if (row.some((cell) => cell !== undefined && typeof cell !== "string")) return false;
    if (row[0].length > 120 || row[1].length > 600 || row[2].length > 40
      || (row[3] || "").length > 120 || (row[4] || "").length > 40) return false;
    return row[5] === undefined || /^icons\/notify\/(morning|afternoon|evening|night|last|done)-\d+\.jpg$/.test(row[5]);
  }));
}

async function newSession(db, id, now) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await db.prepare("INSERT INTO sessions (token_hash, user_id, created, last) VALUES (?, ?, ?, ?)").bind(await sha(token), id, now, now).run();
  return token;
}

// 헷갈리는 글자(0/O, 1/I)를 뺀 8자리 코드
function linkCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...crypto.getRandomValues(new Uint8Array(8))].map((b) => abc[b % abc.length]).join("");
}

async function pwHash(pw, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 100000 }, key, 256);
  return hex(new Uint8Array(bits));
}
async function sha(text) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))));
}
function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
