// Login-free, device-scoped access to private training materials.
import { trainingPractice } from "./training-practice.js";

const practiceAction = (path) => path.match(/\/practice\/(catalog|start|grade)$/)?.[1];
export const TRAINING_ADMIN_ID = "buucksoo";
const INVITE_TTL_MS = 5 * 60 * 1000;
const MAX_INVITE_REQUESTS = 100;
const MATERIALS = {
  westminster: { title: "웨스트민스터 신도게요서 (미주)", key: "training:westminster", bit: 1 },
  discipleship: { title: "제자반 1학기 교재 이론정리", key: "training:discipleship", bit: 2 },
};
const materialList = (mask) => Object.entries(MATERIALS)
  .filter(([, item]) => mask & item.bit)
  .map(([id, { title }]) => ({ id, title }));

// Limit actual streamed bytes, including requests without Content-Length.
export async function readTrainingBody(request) {
  if (!request.body) return {};
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    const value = JSON.parse(text + decoder.decode());
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

export async function trainingRateAllowed(env, key) {
  return (await env.TRAINING_LIMIT.limit({ key })).success;
}

export async function trainingPublic(pathname, request, env, json) {
  const now = Date.now();
  if (request.method !== "POST") return json({ error: "지원하지 않는 요청이에요" }, 405);
  const body = await readTrainingBody(request);
  if (!body) return json({ error: "요청 형식 또는 크기가 올바르지 않아요" }, 400);

  if (pathname === "/training/request") {
    const invite = typeof body.invite === "string" ? body.invite : "";
    const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!/^[a-f0-9]{64}$/.test(invite) || !/^[a-f0-9]{64}$/.test(deviceToken) || !label || label.length > 40 || /[\p{Cc}\p{Cf}]/u.test(label)) {
      return json({ error: "QR을 다시 스캔하고 이름이나 호칭을 입력해 주세요" }, 400);
    }
    const db = env.DB;
    const deviceHash = await sha(deviceToken);
    const existing = await db.prepare("SELECT status FROM training_readers WHERE device_hash = ?").bind(deviceHash).first();
    if (existing && existing.status !== "revoked") return json({ status: existing.status });
    const inviteHash = await sha(invite);
    const validInvite = await db.prepare("SELECT expires, request_count FROM training_invites WHERE code_hash = ?").bind(inviteHash).first();
    if (!validInvite || validInvite.expires <= now) return json({ error: "QR 사용 시간이 끝났어요. 관리자에게 새 QR을 받아 주세요" }, 410);
    if (validInvite.request_count >= MAX_INVITE_REQUESTS) return json({ error: "이 QR로 접수할 수 있는 인원이 모두 찼어요" }, 429);
    const [saved] = await db.batch([
      db.prepare(`INSERT INTO training_readers (device_hash, label, status, requested_at, approved_at, updated_at, material_mask)
        SELECT ?, ?, 'pending', ?, NULL, ?, 0 FROM training_invites
        WHERE code_hash = ? AND expires > ? AND request_count < ?
        ON CONFLICT(device_hash) DO UPDATE SET label = excluded.label, status = 'pending',
          requested_at = excluded.requested_at, approved_at = NULL, updated_at = excluded.updated_at, material_mask = 0
        WHERE training_readers.status = 'revoked'`).bind(deviceHash, label, now, now, inviteHash, now, MAX_INVITE_REQUESTS),
      db.prepare("UPDATE training_invites SET request_count = request_count + 1 WHERE code_hash = ? AND changes() = 1").bind(inviteHash),
    ]);
    const latest = await db.prepare("SELECT status FROM training_readers WHERE device_hash = ?").bind(deviceHash).first();
    if (!saved.meta?.changes && (!latest || latest.status === "revoked")) return json({ error: "QR을 갱신해 주세요" }, 409);
    return json({ status: latest?.status || "unregistered" });
  }

  const action = practiceAction(pathname);
  if (pathname === "/training/status" || pathname === "/training/content" || action) {
    const token = typeof body.deviceToken === "string" ? body.deviceToken : "";
    if (!/^[a-f0-9]{64}$/.test(token)) return json({ error: "이 기기에서 다시 접근 요청을 해 주세요" }, 401);
    const hash = await sha(token);
    if (pathname !== "/training/status" && !await trainingRateAllowed(env, `reader:${hash}`)) {
      return json({ error: "요청이 많아요. 잠시 후 다시 열어 주세요" }, 429);
    }
    const reader = await env.DB.prepare("SELECT status, material_mask FROM training_readers WHERE device_hash = ?").bind(hash).first();
    if (!reader || reader.status !== "approved") return json({ status: reader?.status || "unregistered", error: "관리자 승인이 필요해요" }, 403);
    if (pathname === "/training/status") return json({ status: "approved", materials: materialList(reader.material_mask) });
    if (action) return trainingPractice(action, env, json, body, reader.material_mask);

    return readMaterial(env, json, body, reader.material_mask);
  }
  return json({ error: "not found" }, 404);
}

export async function trainingAdmin(pathname, request, env, json, uid, body, now = Date.now()) {
  if (uid !== TRAINING_ADMIN_ID) return json({ error: "관리자만 사용할 수 있어요" }, 403);
  const action = practiceAction(pathname);
  if (action && request.method === "POST") return trainingPractice(action, env, json, body, 3);
  if (pathname === "/account/training/library" && request.method === "GET") {
    return json({ materials: materialList(3) });
  }
  if (pathname === "/account/training/content" && request.method === "POST") {
    return readMaterial(env, json, body, 3);
  }
  const db = env.DB;

  if (pathname === "/account/training/invite" && request.method === "POST") {
    const code = hex(crypto.getRandomValues(new Uint8Array(32)));
    const expires = now + INVITE_TTL_MS;
    await db.prepare("DELETE FROM training_invites WHERE expires <= ?").bind(now).run();
    await db.prepare("INSERT INTO training_invites (code_hash, created_at, expires, request_count) VALUES (?, ?, ?, 0)").bind(await sha(code), now, expires).run();
    return json({ code, expires });
  }
  if (pathname === "/account/training/readers" && request.method === "GET") {
    const rows = await db.prepare("SELECT device_hash AS id, label, status, material_mask, requested_at AS requestedAt, approved_at AS approvedAt FROM training_readers ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, updated_at DESC LIMIT 500").all();
    return json({ materials: materialList(3), readers: rows.results.map(({ material_mask, ...row }) => ({
      ...row, materials: materialList(material_mask).map(({ id }) => id),
    })) });
  }
  if (["/account/training/approve", "/account/training/scope"].includes(pathname) && request.method === "POST") {
    const id = String(body.deviceId || "");
    if (!/^[a-f0-9]{64}$/.test(id)) return json({ error: "승인 요청을 찾을 수 없어요" }, 400);
    if (!Array.isArray(body.materials) || !body.materials.length || body.materials.length > 2
      || !body.materials.every((item) => typeof item === "string" && Object.hasOwn(MATERIALS, item))) {
      return json({ error: "열람을 허용할 자료를 선택해 주세요" }, 400);
    }
    const mask = body.materials.reduce((value, id) => value | MATERIALS[id].bit, 0);
    const expected = pathname.endsWith("/approve") ? "pending" : "approved";
    const result = await db.prepare(`UPDATE training_readers SET status = 'approved',
      approved_at = COALESCE(approved_at, ?), updated_at = ?, material_mask = ?
      WHERE device_hash = ? AND status = ?`).bind(now, now, mask, id, expected).run();
    if (!result.meta?.changes) return json({ error: "명단이 바뀌었어요. 새로고침해 주세요" }, 409);
    return json({ ok: true });
  }
  if (pathname === "/account/training/revoke" && request.method === "POST") {
    const id = String(body.deviceId || "");
    if (!/^[a-f0-9]{64}$/.test(id)) return json({ error: "훈련생 기기를 찾을 수 없어요" }, 400);
    const result = await db.prepare("UPDATE training_readers SET status = 'revoked', material_mask = 0, updated_at = ? WHERE device_hash = ? AND status = 'approved'").bind(now, id).run();
    if (!result.meta?.changes) return json({ error: "승인된 기기가 없어요. 목록을 새로고침해 주세요" }, 404);
    return json({ ok: true });
  }
  if (pathname === "/account/training/remove" && request.method === "POST") {
    const id = String(body.deviceId || "");
    if (!/^[a-f0-9]{64}$/.test(id)) return json({ error: "훈련생 기기를 찾을 수 없어요" }, 400);
    await db.prepare("DELETE FROM training_readers WHERE device_hash = ?").bind(id).run();
    return json({ ok: true });
  }
  return json({ error: "not found" }, 404);
}

async function readMaterial(env, json, { item: itemId, section: index }, mask) {
  const item = typeof itemId === "string" && Object.hasOwn(MATERIALS, itemId) && MATERIALS[itemId];
  if (!item || !(mask & item.bit)) return json({ error: "이 자료의 열람 권한이 없어요" }, 403);
  const content = await env.SUBS.get(item.key);
  if (content === null) return json({ error: "자료를 아직 서버에 등록하지 않았어요" }, 404);
  const sections = splitSections(content, item.title);
  if (index === undefined) {
    return json({
      id: itemId,
      title: item.title,
      sections: sections.map(({ title }) => title),
    });
  }
  if (!Number.isInteger(index) || index < 0 || index >= sections.length) return json({ error: "해당 단원을 찾을 수 없어요" }, 404);
  const section = sections[index];
  return json({ section: index, content: section.content });
}

function splitSections(markdown, title) {
  const blocks = markdown.replace(/^\uFEFF/, "").replace(/\r/g, "").split(/^##\s+([^\n]+)\n?/m);
  if (blocks.length === 1) return [{ title, content: blocks[0] }];
  const sections = [];
  for (let i = 1; i < blocks.length; i += 2) {
    sections.push({ title: blocks[i], content: blocks[i + 1].trim() });
  }
  const last = sections.at(-1);
  const notes = last.content.match(/^미[ \t]*주[ \t]*$/m);
  if (notes) {
    const content = last.content.slice(notes.index + notes[0].length).trim();
    last.content = last.content.slice(0, notes.index).trim();
    sections.push({ title: "미주", content });
  }
  return sections;
}

async function sha(value) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}
function hex(bytes) { return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join(""); }
