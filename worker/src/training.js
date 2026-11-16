// Login-free, device-scoped access to private training materials.
const ADMIN_ID = "buucksoo";
const INVITE_TTL_MS = 5 * 60 * 1000;
const MAX_INVITE_REQUESTS = 100;
const MATERIALS = {
  westminster: { title: "웨스트민스터 신도게요서 (미주)", key: "training:westminster" },
  discipleship: { title: "제자반 1학기 교재 이론정리", key: "training:discipleship" },
};

export async function trainingPublic(pathname, request, env, json) {
  const now = Date.now();
  if (request.method !== "POST") return json({ error: "지원하지 않는 요청이에요" }, 405);
  const body = await request.json().catch(() => ({}));

  if (pathname === "/training/request") {
    const invite = String(body.invite || "");
    const deviceToken = String(body.deviceToken || "");
    const label = String(body.label || "").trim().slice(0, 40);
    if (!/^[a-f0-9]{64}$/i.test(invite) || !/^[a-f0-9]{64}$/i.test(deviceToken) || !label) {
      return json({ error: "QR을 다시 스캔하고 이름이나 호칭을 입력해 주세요" }, 400);
    }
    const db = env.DB;
    const deviceHash = await sha(deviceToken);
    const existing = await db.prepare("SELECT status FROM training_readers WHERE device_hash = ?").bind(deviceHash).first();
    if (existing?.status === "approved") return json({ status: "approved" });
    const inviteHash = await sha(invite);
    const validInvite = await db.prepare("SELECT expires, request_count FROM training_invites WHERE code_hash = ?").bind(inviteHash).first();
    if (!validInvite || validInvite.expires <= now) return json({ error: "QR 사용 시간이 끝났어요. 관리자에게 새 QR을 받아 주세요" }, 410);
    if (validInvite.request_count >= MAX_INVITE_REQUESTS) return json({ error: "이 QR로 접수할 수 있는 인원이 모두 찼어요" }, 429);
    await db.batch([
      db.prepare("INSERT INTO training_readers (device_hash, label, status, requested_at, approved_at, updated_at) VALUES (?, ?, 'pending', ?, NULL, ?) ON CONFLICT(device_hash) DO UPDATE SET label = excluded.label, status = 'pending', requested_at = excluded.requested_at, approved_at = NULL, updated_at = excluded.updated_at").bind(deviceHash, label, now, now),
      db.prepare("UPDATE training_invites SET request_count = request_count + 1 WHERE code_hash = ? AND expires > ? AND request_count < ?").bind(inviteHash, now, MAX_INVITE_REQUESTS),
    ]);
    const latest = await db.prepare("SELECT status FROM training_readers WHERE device_hash = ?").bind(deviceHash).first();
    return json({ status: latest?.status || "pending" });
  }

  if (pathname === "/training/status" || pathname === "/training/content") {
    const token = String(body.deviceToken || "");
    if (!/^[a-f0-9]{64}$/i.test(token)) return json({ error: "이 기기에서 다시 접근 요청을 해 주세요" }, 401);
    const reader = await env.DB.prepare("SELECT status FROM training_readers WHERE device_hash = ?").bind(await sha(token)).first();
    if (!reader || reader.status !== "approved") return json({ status: reader?.status || "unregistered", error: "관리자 승인이 필요해요" }, 403);
    if (pathname === "/training/status") return json({ status: "approved", materials: Object.entries(MATERIALS).map(([id, item]) => ({ id, title: item.title })) });

    const itemId = String(body.item || "");
    const item = MATERIALS[itemId];
    if (!item) return json({ error: "자료를 찾을 수 없어요" }, 404);
    const content = await env.SUBS.get(item.key);
    if (content === null) return json({ error: "자료를 아직 서버에 등록하지 않았어요" }, 404);
    return json({ id: itemId, title: item.title, content });
  }
  return json({ error: "not found" }, 404);
}

export async function trainingAdmin(pathname, request, env, json, uid, body, now = Date.now()) {
  if (String(uid).toLowerCase() !== ADMIN_ID) return json({ error: "관리자만 사용할 수 있어요" }, 403);
  const db = env.DB;

  if (pathname === "/account/training/invite" && request.method === "POST") {
    const code = hex(crypto.getRandomValues(new Uint8Array(32)));
    const expires = now + INVITE_TTL_MS;
    await db.prepare("DELETE FROM training_invites WHERE expires <= ?").bind(now).run();
    await db.prepare("INSERT INTO training_invites (code_hash, created_at, expires, request_count) VALUES (?, ?, ?, 0)").bind(await sha(code), now, expires).run();
    return json({ code, expires });
  }
  if (pathname === "/account/training/readers" && request.method === "GET") {
    const rows = await db.prepare("SELECT device_hash AS id, label, status, requested_at AS requestedAt, approved_at AS approvedAt, updated_at AS updatedAt FROM training_readers ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, updated_at DESC LIMIT 500").all();
    return json({ readers: rows.results || [] });
  }
  if (pathname === "/account/training/approve" && request.method === "POST") {
    const id = String(body.deviceId || "");
    if (!/^[a-f0-9]{64}$/.test(id)) return json({ error: "승인 요청을 찾을 수 없어요" }, 400);
    const result = await db.prepare("UPDATE training_readers SET status = 'approved', approved_at = ?, updated_at = ? WHERE device_hash = ? AND status = 'pending'").bind(now, now, id).run();
    if (!result.meta?.changes) return json({ error: "대기 중인 요청이 없어요. 목록을 새로고침해 주세요" }, 404);
    return json({ ok: true });
  }
  if (pathname === "/account/training/revoke" && request.method === "POST") {
    const id = String(body.deviceId || "");
    if (!/^[a-f0-9]{64}$/.test(id)) return json({ error: "훈련생 기기를 찾을 수 없어요" }, 400);
    const result = await db.prepare("UPDATE training_readers SET status = 'revoked', updated_at = ? WHERE device_hash = ? AND status = 'approved'").bind(now, id).run();
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

async function sha(value) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}
function hex(bytes) { return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join(""); }
