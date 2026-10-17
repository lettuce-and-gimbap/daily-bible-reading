// 벅수의 계획: 관리자가 쓰는 메모 한 장. 읽기(GET /plan)는 누구나, 쓰기(PUT /plan)는 관리자 계정의 로그인 기기만.
// 저장은 D1의 site_notes 표(key = 'plan'). 표는 schema.sql에 있음.
const PLAN_ADMIN = "buucksoo";
const PLAN_MAX = 20000; // 글자 수 상한

// 표가 아직 없어도 첫 요청에서 스스로 만듦 (IF NOT EXISTS라 여러 번 실행해도 안전)
const PLAN_TABLE = "CREATE TABLE IF NOT EXISTS site_notes (key TEXT PRIMARY KEY, body TEXT NOT NULL, updated INTEGER NOT NULL)";

export async function planNote(request, env, json) {
  await env.DB.prepare(PLAN_TABLE).run();
  if (request.method === "GET") {
    const row = await env.DB.prepare("SELECT body, updated FROM site_notes WHERE key = 'plan'").first();
    return json({ body: row ? row.body : "", updated: row ? row.updated : 0 });
  }
  if (request.method !== "PUT") return json({ error: "not found" }, 404);

  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const session = token && await env.DB.prepare("SELECT user_id FROM sessions WHERE token_hash = ?").bind(await sha(token)).first();
  if (!session) return json({ error: "로그인이 필요해요" }, 401);
  if (session.user_id !== PLAN_ADMIN) return json({ error: "관리자만 쓸 수 있어요" }, 403);

  const body = await request.json().catch(() => null);
  const text = body && typeof body.body === "string" ? body.body : null;
  if (text === null) return json({ error: "잘못된 내용" }, 400);
  if (text.length > PLAN_MAX) return json({ error: `${PLAN_MAX}자까지만 쓸 수 있어요` }, 400);
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO site_notes (key, body, updated) VALUES ('plan', ?, ?) ON CONFLICT(key) DO UPDATE SET body = excluded.body, updated = excluded.updated"
  ).bind(text, now).run();
  return json({ body: text, updated: now });
}

async function sha(text) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}
