// 경건생활 리마인드 알림 서버 (Cloudflare Worker)
// - 앱이 푸시 구독과 "오늘 통독 완료 날짜"를 등록/갱신
// - 크론이 5분마다 확인하고, 구독별 지역 시간 07:00~자정 전 무작위 시각에 미완료 알림을 보냄
// - 00:00~06:59에는 발송하지 않음
//   (문구는 앱의 sw.js가 시간대에 맞게 고름 → 암호화된 본문이 필요 없어 VAPID 서명만 하면 됨)

import { dailySummary } from "./summary.js";
import { account } from "./account.js";
import { planNote } from "./plan.js";
import { scriptureChapter } from "./scripture.js";

const ALLOWED_ORIGINS = [
  "https://lettuce-and-gimbap.github.io",
  "http://localhost:8000",
  "http://localhost:8124",
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, authorization",
      Vary: "Origin",
    };
    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, "content-type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const { pathname } = new URL(request.url);

    try {
      if (pathname === "/vapid") return json({ publicKey: env.VAPID_PUBLIC_KEY });
      if (pathname === "/reminder-messages" && request.method === "GET") {
        const saved = await env.SUBS.get("admin:reminder-messages", "json");
        return new Response(JSON.stringify(saved || { messages: null, updated: 0 }), {
          headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" },
        });
      }
      if (pathname === "/plan") return await planNote(request, env, json);
      if (pathname === "/scripture") return await scriptureChapter(request, env, json, cors);
      if (pathname === "/bible") return await bibleChapter(new URL(request.url).searchParams, cors, json);
      if (pathname === "/qt") return await qtPassage(new URL(request.url).searchParams, json);
      if (pathname === "/search") return await searchVerses(new URL(request.url), json);
      if (pathname.startsWith("/account/")) return await account(pathname, request, env, json);
      if (pathname === "/summary") return await dailySummary(new URL(request.url), env, json, !origin || ALLOWED_ORIGINS.includes(origin), kstDate(new Date()));
      if (request.method !== "POST") return json({ error: "not found" }, 404);
      const body = await request.json();

      if (pathname === "/subscribe") {
        const endpoint = body.subscription && body.subscription.endpoint;
        if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) return json({ error: "잘못된 구독 정보" }, 400);
        const id = await sha256hex(endpoint);
        await saveSub(env, id, {
          endpoint,
          doneDate: str(body.doneDate),
          paused: !!body.paused,
          timeZone: normalizeTimeZone(body.timeZone),
        });
        return json({ id });
      }

      const id = typeof body.id === "string" ? body.id : "";
      if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: "잘못된 id" }, 400);
      const rec = await env.SUBS.get(`sub:${id}`, "json");
      if (!rec) return json({ error: "구독을 찾을 수 없어요" }, 404);

      if (pathname === "/status") {
        await saveSub(env, id, {
          ...rec,
          doneDate: str(body.doneDate),
          paused: !!body.paused,
          timeZone: normalizeTimeZone(body.timeZone || rec.timeZone),
        });
        return json({ ok: true });
      }
      if (pathname === "/unsubscribe") {
        await env.SUBS.delete(`sub:${id}`);
        return json({ ok: true });
      }
      if (pathname === "/test") {
        const res = await sendPush(env, rec.endpoint);
        if (res.status === 404 || res.status === 410) {
          await env.SUBS.delete(`sub:${id}`);
          return json({ error: "구독이 만료됐어요. 알림을 다시 켜 주세요." }, 404);
        }
        return json({ ok: res.ok, pushStatus: res.status }, res.ok ? 200 : 502);
      }
      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 400);
    }
  },

  async scheduled(event, env, ctx) {
    const at = new Date(event.scheduledTime);
    ctx.waitUntil(remindRandom(env, at));
  },
};

// 갓피아 한 장 본문(HTML)을 대신 받아 줌
// 갓피아는 다른 사이트에서 읽는 걸 막아 두어서(CORS 헤더 없음) 앱이 직접 못 가져옴.
// 앱은 이걸로 복사한 조각이 어느 절인지 찾아, 일부만 복사해도 온전한 절로 붙여넣는다.
// 쉬운성경(easy)은 갓피아 읽기 화면 목록에선 빠졌지만 이 본문 주소로는 받아진다(2026-09 확인).
const BIBLE_VERSIONS = ["gae", "easy", "niv", "han", "hyun", "saenew", "hebrew", "greek"];

async function bibleChapter(q, cors, json) {
  const ver = q.get("ver") || "";
  const ver2 = q.get("ver2") || "";
  const vol = q.get("vol") || "";
  const chap = Number(q.get("chap"));
  if (!BIBLE_VERSIONS.includes(ver) || (ver2 && !BIBLE_VERSIONS.includes(ver2))
    || !/^[0-9a-z]{2,6}$/.test(vol) || !Number.isInteger(chap) || chap < 1 || chap > 150) {
    return json({ error: "잘못된 요청" }, 400);
  }
  const p = new URLSearchParams({ ver, vol, chap: String(chap) });
  if (ver2) p.set("ver2", ver2);
  const res = await fetch("https://www.godpia.com/read/reading_body.asp?" + p, {
    cf: { cacheTtl: 604800, cacheEverything: true },
  });
  if (!res.ok) return json({ error: `갓피아 응답 ${res.status}` }, 502);
  return new Response(await res.text(), {
    headers: { ...cors, "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=86400" },
  });
}

// 복사한 글 조각이 성경 어디인지 찾음 (다른 사이트에서 복사한 구절용)
// 다국어성경 홀리바이블(holybible.or.kr)의 본문 검색을 씀: 낱말을 모두 포함한 절을 관련도 순으로 10개까지 돌려준다.
// 어느 역본에서 복사했는지 모르므로 여러 역본을 검색해 앞 순서 역본의 결과를 돌려줌.
// 쉬운성경은 이 사이트에 없음 — 쉬운성경 줄은 앱이 같이 복사한 다른 줄로 장을 찾은 뒤 갓피아 본문과 대조한다.
// 이 사이트는 검색어를 EUC-KR(CP949)로만 알아듣는데 워커에는 그 인코더가 없어서,
// 앱이 검색어를 CP949 퍼센트 인코딩("%B9%AB%B9%FD+…")으로 만들어 q에 넣어 보내고 여기선 그대로 넘긴다.
// 결과 페이지도 EUC-KR이지만 필요한 건 링크의 숫자(VL=권&CN=장&PN=절)뿐이라 디코딩하지 않는다.
const SEARCH_VERSIONS_KO = ["GAE", "SAENEW", "HDB", "RHV", "COGNEW"];
const SEARCH_VERSIONS_EN = ["NIV", "KJV", "NASB"];

async function searchVerses(url, json) {
  const query = (url.search.match(/[?&]q=([^&]*)/) || [])[1] || ""; // searchParams는 %XX를 풀어 버리므로 그대로 꺼냄
  if (!/^(?:%[0-9A-F]{2}|[A-Za-z0-9+])+$/.test(query) || query.length > 400) return json({ error: "잘못된 검색어" }, 400);
  const list = url.searchParams.get("lang") === "en" ? SEARCH_VERSIONS_EN : SEARCH_VERSIONS_KO;
  // 느린 사이트라 역본을 한꺼번에 검색하고, 앞 순서 역본의 결과를 씀
  const results = await Promise.all(list.map(async (vr) => {
    try {
      const res = await fetch(`http://www.holybible.or.kr/B_${vr}/cgi/biblesrch.php?VR=${vr}&QR=${query}`, {
        cf: { cacheTtl: 604800, cacheEverything: true },
      });
      if (!res.ok) return [];
      const seen = new Set();
      return [...(await res.text()).matchAll(/VL=(\d+)&amp;CN=(\d+)&amp;PN=(\d+)/g)]
        .map((m) => [Number(m[1]), Number(m[2]), Number(m[3])])
        .filter(([vl]) => vl >= 1 && vl <= 66) // 공동번역의 외경(67~)은 뺌
        .filter((h) => !seen.has(String(h)) && seen.add(String(h)));
    } catch (e) {
      return [];
    }
  }));
  const i = results.findIndex((hits) => hits.length);
  return json(i < 0 ? { ver: null, hits: [] } : { ver: list[i], hits: results[i] });
}

// 그날 갓피아 QT 본문 범위("열왕기상 11:1~8") — 앱이 QT 화면에서 구절 찾을 장을 바로 알 수 있게
async function qtPassage(q, json) {
  const d = q.get("d") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return json({ error: "잘못된 날짜" }, 400);
  const res = await fetch(`https://www.godpia.com/qt/qt.asp?D=${d}`, { cf: { cacheTtl: 3600, cacheEverything: true } });
  const html = res.ok ? await res.text() : "";
  const m = html.match(/fnc_qtBibleContents\("([^"]+)"/);
  return json({ ref: m ? m[1] : null, ...qtParts(html) });
}

// 갓피아 QT 화면에서 제목·탭별 질문·길잡이·기도를 뽑음 (앱이 본문과 함께 직접 보여 줌)
function qtParts(html) {
  const text = (s) => s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ").replace(/\n\s*/g, "\n").trim();
  const title = (html.match(/<div class="title-h5-a">\s*<h5>([\s\S]*?)<\/h5>/) || [])[1];
  const names = {};
  for (const t of html.matchAll(/data-bs-target="#(nav-\d+)"[^>]*>([^<]+)<\/button>/g)) names[t[1]] = t[2].trim();
  const sections = [];
  for (const p of html.matchAll(/<div class="tab-pane[^"]*" id="(nav-\d+)"[^>]*>([\s\S]*?)(?=<div class="tab-pane|<\/div><!--\s*\/\/tab-content)/g)) {
    const qs = [...p[2].matchAll(/<h6[^>]*>([\s\S]*?)<\/h6>/g)].map((h) => text(h[1])).filter(Boolean);
    const body = qs.length ? "" : [...p[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) => text(x[1])).filter(Boolean).join("\n");
    if (qs.length || body) sections.push({ name: names[p[1]] || "", qs, text: body });
  }
  return { title: title ? text(title) : null, sections };
}

// 하루 알림 횟수와 칸: 지역 시간 07:00~24:00의 5분 칸에서 구독·날짜마다 서로 다른 7칸을 정함
const PUSHES_PER_DAY = 7;
const SLOTS_PER_DAY = 288;
const QUIET_HOURS_END_SLOT = (7 * 60) / 5;
const ACTIVE_SLOTS_PER_DAY = SLOTS_PER_DAY - QUIET_HOURS_END_SLOT;

export function daySlots(id, date) {
  const used = new Set();
  const out = [];
  for (let k = 0; out.length < PUSHES_PER_DAY; k++) {
    let s = QUIET_HOURS_END_SLOT + fnv1a(`${id}|${date}|${k}`) % ACTIVE_SLOTS_PER_DAY;
    while (used.has(s)) s = QUIET_HOURS_END_SLOT + (s - QUIET_HOURS_END_SLOT + 1) % ACTIVE_SLOTS_PER_DAY;
    used.add(s);
    out.push(s);
  }
  return out;
}

export function normalizeTimeZone(value) {
  if (typeof value !== "string" || value.length > 64) return "Asia/Seoul";
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }); return value; }
  catch (_) { return "Asia/Seoul"; }
}

export function localClock(date, timeZone = "Asia/Seoul") {
  const zone = normalizeTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

export function isReminderWindowOpen(date, timeZone = "Asia/Seoul") {
  const local = localClock(date, timeZone);
  return local.hour >= 7 && local.hour < 24;
}

function fnv1a(text) {
  let h = 0x811c9dc5;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return h >>> 0;
}

// 5분마다 호출: 지금 칸이 그 구독의 오늘 칸에 들어 있으면 보냄
export async function remindRandom(env, now = new Date()) {
  return remindAll(env, now, (id, meta) => {
    const zone = normalizeTimeZone(meta.timeZone);
    const local = localClock(now, zone);
    const slot = Math.floor((local.hour * 60 + local.minute) / 5);
    return isReminderWindowOpen(now, zone) && slot >= QUIET_HOURS_END_SLOT && daySlots(id, local.date).includes(slot);
  }, "local-time-slot");
}

export async function remindAll(env, now = new Date(), pick = () => true, label = "fixed") {
  const result = { sent: 0, skipped: 0, removed: 0, failed: 0 };
  let cursor;
  do {
    const page = await env.SUBS.list({ prefix: "sub:", cursor });
    for (const key of page.keys) {
      const meta = key.metadata || {};
      const id = key.name.slice(4);
      if (!pick(id, meta, now)) continue;
      const timeZone = normalizeTimeZone(meta.timeZone);
      const localDate = localClock(now, timeZone).date;
      if (meta.paused || meta.doneDate === localDate) { result.skipped++; continue; }
      const rec = await env.SUBS.get(key.name, "json");
      if (!rec) continue;
      if (!rec.timeZone) rec.timeZone = timeZone;
      try {
        const res = await sendPush(env, rec.endpoint);
        if (res.status === 404 || res.status === 410) {
          await env.SUBS.delete(key.name);
          result.removed++;
        } else if (res.ok) {
          result.sent++;
        } else {
          result.failed++;
        }
      } catch (e) {
        result.failed++;
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  console.log(`remind ${today} ${label}`, JSON.stringify(result));
  return result;
}

// 목록 조회만으로 보낼지 판단할 수 있게 완료 날짜를 메타데이터에도 저장
async function saveSub(env, id, rec) {
  rec.timeZone = normalizeTimeZone(rec.timeZone);
  await env.SUBS.put(`sub:${id}`, JSON.stringify(rec), {
    metadata: { doneDate: rec.doneDate, paused: rec.paused, timeZone: rec.timeZone },
  });
}

export async function sendPush(env, endpoint) {
  const jwt = await vapidJwt(env, new URL(endpoint).origin);
  return fetch(endpoint, {
    method: "POST",
    headers: {
      TTL: "3600",
      Urgency: "high",
      Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
      "Content-Length": "0",
    },
  });
}

export async function vapidJwt(env, audience) {
  const enc = new TextEncoder();
  const part = (obj) => b64url(enc.encode(JSON.stringify(obj)));
  const unsigned = `${part({ typ: "JWT", alg: "ES256" })}.${part({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: env.VAPID_SUBJECT,
  })}`;
  const pub = fromB64url(env.VAPID_PUBLIC_KEY); // 0x04 || x(32) || y(32)
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: b64url(pub.slice(1, 33)), y: b64url(pub.slice(33, 65)), d: env.VAPID_PRIVATE_KEY, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned));
  return `${unsigned}.${b64url(new Uint8Array(sig))}`;
}

export function kstDate(d) {
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function str(v) {
  return typeof v === "string" ? v.slice(0, 20) : "";
}

async function sha256hex(text) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
