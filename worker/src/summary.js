// 오늘 분량 미리 보기: 통독할 장들을 Google Gemini에게 요약시켜 앱에 돌려줌
// - 주요 등장 인물 · 인물 관계도 / 중학생에게 말하듯 쉬운 이야기(2문단, 600자 이내) / 어울리는 찬양 / 주요 지역
// - 같은 분량은 KV에 저장해 두고 모든 사람이 나눠 쓰므로, 처음 한 번만 API 비용이 든다.
// - 필요한 설정: npx wrangler secret put GEMINI_API_KEY (worker/README.md 참고) — Google AI Studio 무료 키로 됨
//   선택: SUMMARY_MODEL(기본 gemini-3.8-flash), SUMMARY_DAILY_CAP(하루에 새로 만드는 최대 개수, 기본 200)

// 앱의 js/core/bible.js 와 같은 순서·장 수 ("코드:이름:장 수")
const BOOK_TABLE = (
  "gen:창세기:50 exo:출애굽기:40 lev:레위기:27 num:민수기:36 deu:신명기:34 jos:여호수아:24 jdg:사사기:21 " +
  "rut:룻기:4 1sa:사무엘상:31 2sa:사무엘하:24 1ki:열왕기상:22 2ki:열왕기하:25 1ch:역대상:29 2ch:역대하:36 " +
  "ezr:에스라:10 neh:느헤미야:13 est:에스더:10 job:욥기:42 psa:시편:150 pro:잠언:31 ecc:전도서:12 sng:아가:8 " +
  "isa:이사야:66 jer:예레미야:52 lam:예레미야애가:5 ezk:에스겔:48 dan:다니엘:12 hos:호세아:14 jol:요엘:3 " +
  "amo:아모스:9 oba:오바댜:1 jnh:요나:4 mic:미가:7 nam:나훔:3 hab:하박국:3 zep:스바냐:3 hag:학개:2 zec:스가랴:14 " +
  "mal:말라기:4 mat:마태복음:28 mrk:마가복음:16 luk:누가복음:24 jhn:요한복음:21 act:사도행전:28 rom:로마서:16 " +
  "1co:고린도전서:16 2co:고린도후서:13 gal:갈라디아서:6 eph:에베소서:6 php:빌립보서:4 col:골로새서:4 1th:데살로니가전서:5 " +
  "2th:데살로니가후서:3 1ti:디모데전서:6 2ti:디모데후서:4 tit:디도서:3 phm:빌레몬서:1 heb:히브리서:13 jas:야고보서:5 " +
  "1pe:베드로전서:5 2pe:베드로후서:3 1jn:요한일서:5 2jn:요한이서:1 3jn:요한삼서:1 jud:유다서:1 rev:요한계시록:22")
  .split(" ").filter(Boolean).map((s) => { const [code, name, n] = s.split(":"); return { code, name, chapters: Number(n) }; });
const BOOK_BY_CODE = Object.fromEntries(BOOK_TABLE.map((b) => [b.code, b]));

const MAX_CHAPTERS = 30; // 한 번에 요약할 최대 장 수
const STORY_LIMIT = 600;
const DEFAULT_MODEL = "gemini-3.8-flash";

// "num.12-16,num.17" → { key, label, count } (잘못된 값이면 null)
export function parseRanges(raw) {
  if (typeof raw !== "string" || raw.length > 300) return null;
  const segs = [];
  let count = 0;
  for (const part of raw.split(",")) {
    const m = part.match(/^([0-9a-z]{3})\.(\d{1,3})(?:-(\d{1,3}))?$/);
    const book = m && BOOK_BY_CODE[m[1]];
    if (!book) return null;
    const lo = Number(m[2]), hi = Number(m[3] || m[2]);
    if (lo < 1 || hi < lo || hi > book.chapters) return null;
    count += hi - lo + 1;
    segs.push({ code: book.code, name: book.name, lo, hi });
  }
  if (!segs.length || count > MAX_CHAPTERS) return null;
  const label = segs.map((s) => `${s.name} ${s.lo === s.hi ? s.lo : `${s.lo}–${s.hi}`}장`).join(", ");
  return { key: segs.map((s) => `${s.code}.${s.lo}-${s.hi}`).join(","), label, count };
}

const SYSTEM = `너는 성경 통독 앱의 도우미야. 오늘 읽을 성경 분량을 읽기 전에 훑어볼 수 있게 요약해 준다.

규칙
- 해석의 관점: 대한예수교장로회(합동) 측 교단의 입장에서, 칼뱅주의 개혁신학의 틀로 본문을 이해하고 설명한다. 본문에 없는 신학적 주장은 덧붙이지 않고, 개혁신학과 어긋나는 해석(예: 번영신학식 적용)은 피한다. 교파마다 해석이 갈리는 부분은 개혁신학의 일반적인 이해를 따르되, 다른 교파를 비판하거나 논쟁하는 말투는 쓰지 않는다. 학자·책 이름이나 인용문은 지어내지 않는다.
- 성경에 실제로 나오는 내용만 쓴다. 확실하지 않은 내용은 지어내지 말고 뺀다. 여러 장이면 분량 전체를 한 번에 요약한다.
- people: 이번 분량에 실제로 나오는 주요 인물 3~8명. name은 개역개정 표기(같은 사람을 두 번 쓰지 않는다), role은 20자 안쪽으로 이번 분량에서 한 일.
- relations: people끼리의 관계도에 쓸 관계 4~10개. 성경에 실제로 나오는 관계만 쓴다. from과 to는 people의 name과 글자까지 똑같아야 한다. label은 10자 안쪽으로 "from은 to의 ○○"처럼 읽히게 쓴다(예: from 아론, to 모세, label 형 → "아론은 모세의 형"). kind는 family(가족·친척), ally(돕거나 함께함·스승과 제자), conflict(대립·반역·갈등), other 중 하나. 위 문장처럼 방향이 있는 관계면 directed를 true, 서로 같은 관계(형제, 동역자, 갈등)면 false.
- places: 이번 분량의 주요 지역 2~5곳. name은 개역개정 표기, note는 25자 안쪽으로 이곳에서 일어난 일이나 위치 설명.
- story: 정확히 2문단. 두 문단을 합쳐 공백 포함 520자 안쪽(절대 600자를 넘지 않는다). 중학교 2학년에게 이야기해 주듯 쉬운 입말(해요체)로 쓴다. 어려운 한자어는 풀어 쓴다(예: 언약 → 하나님과 한 약속, 성막 → 하나님을 만나는 천막, 제사장 → 하나님 앞에서 사람들을 대신하는 사람). 1문단은 무슨 일이 있었는지 흐름, 2문단은 이 분량에서 하나님은 어떤 분이고 사람들은 어떻게 반응했는지. 훈계하거나 설교하는 말투는 피한다.
- songs: 이 분량의 분위기·주제와 어울리는 찬양 2곡. 새찬송가·통일찬송가 곡은 빼고, 한국 교회에서 실제로 널리 불리는 CCM·워십 곡(예수전도단, 마커스, 어노인팅, 제이어스, 소망, 이천 등)만 고른다. 제목과 아티스트가 확실하지 않은 곡은 쓰지 말고 확실한 다른 곡을 고른다. why는 40자 안쪽으로 왜 어울리는지.
- 이모지와 마크다운 기호는 쓰지 않는다.`;

// Gemini 응답 스키마 (OpenAPI 형식 일부만 지원해서 additionalProperties는 쓰지 않음)
const SCHEMA = {
  type: "OBJECT",
  properties: {
    people: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, role: { type: "STRING" } }, required: ["name", "role"] } },
    relations: { type: "ARRAY", items: { type: "OBJECT", properties: { from: { type: "STRING" }, to: { type: "STRING" }, label: { type: "STRING" }, kind: { type: "STRING", enum: ["family", "ally", "conflict", "other"] }, directed: { type: "BOOLEAN" } }, required: ["from", "to", "label", "kind", "directed"] } },
    places: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, note: { type: "STRING" } }, required: ["name", "note"] } },
    story: { type: "ARRAY", items: { type: "STRING" } },
    songs: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, artist: { type: "STRING" }, why: { type: "STRING" } }, required: ["title", "artist", "why"] } },
  },
  required: ["people", "relations", "places", "story", "songs"],
};

const clip = (v, n) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

// 문단 합계가 limit자를 넘으면 문장 단위로 잘라 맞춤
export function fitStory(paras, limit = STORY_LIMIT) {
  const out = [];
  let used = 0;
  for (const p of paras) {
    let text = p.trim();
    if (used + text.length > limit) {
      const room = limit - used;
      const cut = text.slice(0, Math.max(0, room));
      const end = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("요."), cut.lastIndexOf("다."));
      text = end > 0 ? cut.slice(0, end + 1) : "";
    }
    if (text) { out.push(text); used += text.length; }
  }
  return out;
}

// 모델이 돌려준 값을 앱이 쓰는 모양으로 정리. 쓸 수 없으면 null
export function cleanSummary(raw) {
  if (!raw || typeof raw !== "object") return null;
  const seenName = new Set();
  const people = (Array.isArray(raw.people) ? raw.people : [])
    .map((p) => ({ name: clip(p && p.name, 20), role: clip(p && p.role, 40) }))
    .filter((p) => p.name && !seenName.has(p.name) && seenName.add(p.name)).slice(0, 8);
  // 관계는 people에 있는 이름끼리만 (그래야 관계도에 그릴 수 있음)
  const KINDS = ["family", "ally", "conflict", "other"];
  const seenRel = new Set();
  const relations = (Array.isArray(raw.relations) ? raw.relations : [])
    .map((r) => ({ from: clip(r && r.from, 20), to: clip(r && r.to, 20), label: clip(r && r.label, 14),
      kind: KINDS.includes(r && r.kind) ? r.kind : "other", directed: !!(r && r.directed) }))
    .filter((r) => r.label && r.from !== r.to && seenName.has(r.from) && seenName.has(r.to)
      && !seenRel.has(`${r.from}|${r.to}|${r.label}`) && seenRel.add(`${r.from}|${r.to}|${r.label}`)).slice(0, 12);
  const places = (Array.isArray(raw.places) ? raw.places : [])
    .map((p) => ({ name: clip(p && p.name, 20), note: clip(p && p.note, 50) })).filter((p) => p.name).slice(0, 6);
  const story = (Array.isArray(raw.story) ? raw.story : []).map((s) => clip(s, 700)).filter(Boolean);
  const songs = (Array.isArray(raw.songs) ? raw.songs : [])
    .map((s) => ({ title: clip(s && s.title, 60), artist: clip(s && s.artist, 40), why: clip(s && s.why, 80) }))
    .filter((s) => s.title && s.artist).slice(0, 3);
  if (people.length < 1 || story.length < 1 || songs.length < 1) return null;
  return { people, relations, places, story, songs };
}

const storyLength = (story) => story.reduce((n, p) => n + p.length, 0);
const storyOk = (r) => r.story.length === 2 && storyLength(r.story) <= STORY_LIMIT;

async function askModel(env, label, count, feedback) {
  const model = env.SUMMARY_MODEL || DEFAULT_MODEL;
  const generationConfig = { responseMimeType: "application/json", responseSchema: SCHEMA, maxOutputTokens: 8000, temperature: 0.7 };
  const body = (config) => JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: `이번 분량: ${label} (총 ${count}장)` + (feedback ? `\n\n${feedback}` : "") }] }],
    generationConfig: config,
  });
  const call = (config) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: body(config),
    signal: AbortSignal.timeout(90000),
  });
  // 2.5 flash는 생각 시간을 끌 수 있어 끄고 시도. 모델이 그 설정을 받지 않으면(400) 설정 없이 다시 보냄
  let res = /2\.5.*flash/.test(model) ? await call({ ...generationConfig, thinkingConfig: { thinkingBudget: 0 } }) : await call(generationConfig);
  if (res.status === 400 && /2\.5.*flash/.test(model)) res = await call(generationConfig);
  if (res.status === 429 || res.status === 503) throw new SummaryError("요약 서버가 바빠요. 잠시 뒤 다시 시도해 주세요.", 503);
  if (!res.ok) {
    console.log("gemini error", res.status, (await res.text()).slice(0, 300));
    throw new SummaryError("요약을 만들지 못했어요.", 502);
  }
  const data = await res.json();
  const text = ((data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [])
    .map((p) => p.text || "").join("");
  if (!text) {
    console.log("gemini empty", JSON.stringify({ finish: data.candidates && data.candidates[0] && data.candidates[0].finishReason, block: data.promptFeedback }));
    return null;
  }
  try {
    return cleanSummary(JSON.parse(text));
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    try { return m ? cleanSummary(JSON.parse(m[0])) : null; } catch { return null; }
  }
}

class SummaryError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export async function generate(env, label, count) {
  let r = await askModel(env, label, count);
  if (!r || !storyOk(r)) {
    const why = !r ? "형식이 맞지 않았어" : r.story.length !== 2 ? "story가 2문단이 아니었어" : `story가 ${storyLength(r.story)}자로 600자를 넘었어`;
    const retry = await askModel(env, label, count, `지난 답은 ${why}. 규칙을 다시 지켜서 처음부터 다시 써 줘.`);
    if (retry) r = retry;
  }
  if (!r) throw new SummaryError("요약을 만들지 못했어요.", 502);
  if (r.story.length > 2) r.story = [r.story[0], r.story.slice(1).join(" ")];
  if (storyLength(r.story) > STORY_LIMIT) r.story = fitStory(r.story);
  if (!r.story.length) throw new SummaryError("요약을 만들지 못했어요.", 502);
  return r;
}

// GET /summary?r=num.12-16
export async function dailySummary(url, env, json, originOk, today) {
  const parsed = parseRanges(url.searchParams.get("r"));
  if (!parsed) return json({ error: "잘못된 분량" }, 400);
  const cacheKey = `sum:v3:${parsed.key}`;
  const hit = await env.SUBS.get(cacheKey, "json");
  // refresh=1: 저장된 요약을 버리고 새로 만듦. 연타로 비용이 새지 않게 1분 안에 다시 요청하면 저장본을 돌려줌
  const freshKey = `sumfresh:${parsed.key}`;
  const refresh = url.searchParams.get("refresh") === "1";
  if (hit && (!refresh || await env.SUBS.get(freshKey))) return json({ ...hit, label: parsed.label, cached: true });

  if (!env.GEMINI_API_KEY) return json({ error: "요약 기능이 아직 켜지지 않았어요. (서버에 GEMINI_API_KEY 등록 필요)", code: "not_configured" }, 503);
  if (!originOk) return json({ error: "허용되지 않은 주소" }, 403);

  // 하루에 새로 만들 수 있는 개수 제한 (비용 보호)
  const capKey = `sumcap:${today}`;
  const used = Number(await env.SUBS.get(capKey)) || 0;
  if (used >= (Number(env.SUMMARY_DAILY_CAP) || 200)) return json({ error: "오늘 새로 만들 수 있는 요약을 다 썼어요. 내일 다시 시도해 주세요.", code: "cap" }, 429);
  await env.SUBS.put(capKey, String(used + 1), { expirationTtl: 172800 });

  try {
    const summary = await generate(env, parsed.label, parsed.count);
    await env.SUBS.put(cacheKey, JSON.stringify(summary));
    if (refresh) await env.SUBS.put(freshKey, "1", { expirationTtl: 60 });
    return json({ ...summary, label: parsed.label, cached: false });
  } catch (e) {
    if (e instanceof SummaryError) return json({ error: e.message }, e.status);
    console.log("summary failed", String(e && e.message || e));
    return json({ error: "요약을 만들지 못했어요." }, 502);
  }
}
