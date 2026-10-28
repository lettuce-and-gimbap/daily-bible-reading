// 사용자 계정 · 기록 동기화 (D1, 표는 schema.sql)
// - 아이디·비밀번호로 가입/로그인 → 토큰을 기기에 저장, 서버엔 토큰의 해시만 둠
// - 기록(state JSON)은 사용자마다 한 덩어리로 저장. 합치기(merge)는 앱이 하고 서버는 마지막 것을 보관
// - 연결 코드(QR): 로그인한 기기가 10분짜리 일회용 코드를 만들면 새 기기는 비밀번호 없이 그 코드로 로그인

import { feedback } from './feedback.js';

const ID_RE = /^[a-z0-9_]{3,20}$/;
const MAX_DATA_BYTES = 4_000_000; // UTF-8 JSON 4MB per account
const MAX_REMINDER_DB_BYTES = 1_000_000;
const MAX_REMINDER_ART_BYTES = 512_000;
const MAX_REMINDER_ART_TOTAL_BYTES = 3_000_000;
const ADMIN_IDS = new Set(["buucksoo"]);
const REMINDER_MESSAGE_KEY = "admin:reminder-messages";
export const REMINDER_MESSAGES_API_VERSION = 2;
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
      const saved = await env.SUBS.get(REMINDER_MESSAGE_KEY, "json");
      for (const rows of Object.values(saved?.messages || {})) {
        for (const row of rows) {
          const art = typeof row[5] === "string" && row[5].match(/\/reminder-art\/(morning|afternoon|evening|night|last|done)\/(\d+)\.jpg/);
          if (art) await env.SUBS.delete(`${REMINDER_MESSAGE_KEY.replace("messages", "art")}:${art[1]}:${art[2]}`);
        }
      }
      await env.SUBS.delete(REMINDER_MESSAGE_KEY);
      return json({ ok: true, messages: null, updated: Date.now() });
    }
    // JSON serializes omitted optional array slots as null. Normalize only optional slots.
    if (body.messages && typeof body.messages === "object") {
      for (const rows of Object.values(body.messages)) {
        if (!Array.isArray(rows)) continue;
        for (const row of rows) {
          if (!Array.isArray(row)) continue;
          for (let index = 3; index < row.length; index++) {
            if (row[index] == null) row[index] = "";
          }
        }
      }
    }
    const text = JSON.stringify(body.messages);
    const messageBytes = new TextEncoder().encode(text).byteLength;
    if (messageBytes > MAX_REMINDER_DB_BYTES) {
      return json({ error: `알림 문구 DB가 1MB 제한을 넘어요 (${messageBytes}바이트)` }, 413);
    }
    const messageIssue = reminderMessagesValidationIssue(body.messages);
    if (messageIssue) return json({ error: `알림 문구 DB 검증 실패: ${messageIssue}` }, 400);
    const art = body.art || {};
    const artDeletes = body.artDeletes || [];
    if (!validReminderArtwork(art, body.messages) || !Array.isArray(artDeletes)
      || artDeletes.length > 200 || artDeletes.some((key) => !/^(morning|afternoon|evening|night|last|done):\d+$/.test(key))) {
      return json({ error: "말풍선 이미지 데이터 형식이 맞지 않아요" }, 400);
    }
    for (const [key, base64] of Object.entries(art)) {
      const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
      await env.SUBS.put(`${REMINDER_MESSAGE_KEY.replace("messages", "art")}:${key}`, bytes.buffer);
    }
    for (const key of artDeletes) await env.SUBS.delete(`${REMINDER_MESSAGE_KEY.replace("messages", "art")}:${key}`);
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
  return reminderMessagesValidationIssue(messages) === null;
}

function reminderMessagesValidationIssue(messages) {
  const tiers = ["morning", "afternoon", "evening", "night", "last", "done"];
  if (!messages || typeof messages !== "object" || Array.isArray(messages)
    || tiers.some((tier) => !Array.isArray(messages[tier]))
    || Object.keys(messages).some((key) => !tiers.includes(key))) return "시간대별 문구 DB 구조가 올바르지 않아요.";
  for (const tier of tiers) {
    if (messages[tier].length > 200) return `${tier} 항목이 200개를 넘어요.`;
    for (const [index, row] of messages[tier].entries()) {
      if (!Array.isArray(row) || row.length < 3 || row.length > 6) return `${tier} ${index + 1}번 항목의 배열 형식이 올바르지 않아요.`;
      if (![0, 1, 2].every((i) => typeof row[i] === "string")) return `${tier} ${index + 1}번 항목에 제목·본문·포즈 문자열이 빠졌어요.`;
      if (row.some((cell) => cell !== undefined && typeof cell !== "string")) return `${tier} ${index + 1}번 항목에 문자열이 아닌 값이 있어요.`;
      if (row[0].length > 120 || row[1].length > 600 || row[2].length > 40
        || (row[3] || "").length > 120 || (row[4] || "").length > 40) return `${tier} ${index + 1}번 항목의 글자 수 제한을 넘어요.`;
      if (row[5] !== undefined
        && !/^icons\/notify\/(morning|afternoon|evening|night|last|done)-\d+\.jpg$/.test(row[5])
        && !/^https:\/\/daily-bible-reminder\.gimbap-lettuce\.workers\.dev\/reminder-art\/(morning|afternoon|evening|night|last|done)\/\d+\.jpg\?v=\d+$/.test(row[5])) {
        return `${tier} ${index + 1}번 항목의 그림 경로가 올바르지 않아요.`;
      }
    }
  }
  return null;
}

function validReminderArtwork(art, messages) {
  if (!art || typeof art !== "object" || Array.isArray(art)) return false;
  const entries = Object.entries(art);
  if (entries.length > 200) return false;
  let totalBytes = 0;
  return entries.every(([key, base64]) => {
    const match = key.match(/^(morning|afternoon|evening|night|last|done):(\d+)$/);
    if (!match || typeof base64 !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) return false;
    const [, tier, rawIndex] = match;
    const row = messages[tier][Number(rawIndex)];
    if (!row || !row[5]?.includes(`/reminder-art/${tier}/${rawIndex}.jpg`)) return false;
    const size = Math.floor(base64.length * 3 / 4);
    totalBytes += size;
    if (size > MAX_REMINDER_ART_BYTES || totalBytes > MAX_REMINDER_ART_TOTAL_BYTES) return false;
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8
      && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  });
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
