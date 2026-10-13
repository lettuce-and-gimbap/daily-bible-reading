// 오늘 분량 미리 보기: 주요 등장 인물 · 인물 관계도 · 쉬운 말로 푼 이야기 · 어울리는 찬양 · 주요 지역 · 주석 참고 링크
// 요약은 알림 서버(worker/의 /summary)가 만들어 주고, 같은 분량은 서버와 이 기기에 저장해 두고 다시 씀

const SUMMARY_STORE = "daily5-summary-v2";
const SUMMARY_MAX_CHAPTERS = 30; // 서버가 한 번에 요약하는 최대 장 수
const SUMMARY_KEEP = 60; // 이 기기에 남겨 둘 요약 개수
const summaryMem = {}; // 분량 → { status: "loading" | "error", error, code }

function readSummaryStore() {
  try { return JSON.parse(localStorage.getItem(SUMMARY_STORE)) || {}; } catch (e) { return {}; }
}

function writeSummaryStore(key, data) {
  try {
    const all = readSummaryStore();
    delete all[key];
    all[key] = data; // 새로 넣은 것이 맨 뒤
    Object.keys(all).slice(0, Math.max(0, Object.keys(all).length - SUMMARY_KEEP)).forEach((k) => delete all[k]);
    localStorage.setItem(SUMMARY_STORE, JSON.stringify(all));
  } catch (e) { /* 저장 공간이 없어도 그냥 보여 주기만 함 */ }
}

// 그날 장 목록 → 서버가 알아듣는 분량 표기 ("num.12-16,num.17-17")
function summaryRanges(day) {
  const segs = [];
  day.forEach((i) => {
    const { book, chap } = CHAPTERS[i];
    const last = segs[segs.length - 1];
    if (last && last.code === book.code && last.hi + 1 === chap) last.hi = chap;
    else segs.push({ code: book.code, lo: chap, hi: chap });
  });
  return segs.map((s) => `${s.code}.${s.lo}-${s.hi}`).join(",");
}

async function loadSummary(key) {
  summaryMem[key] = { status: "loading" };
  try {
    const res = await fetch(`${PUSH_SERVER}/summary?r=${encodeURIComponent(key)}`, {
      signal: window.AbortSignal && AbortSignal.timeout ? AbortSignal.timeout(120000) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { code: data.code });
    writeSummaryStore(key, { people: data.people, relations: data.relations || [], places: data.places || [], story: data.story, songs: data.songs });
    delete summaryMem[key];
  } catch (e) {
    summaryMem[key] = { status: "error", error: e.name === "TimeoutError" ? "시간이 너무 오래 걸렸어요." : e.message || "불러오지 못했어요.", code: e.code };
  }
  if (sheetTab === "summary") renderReaderSheet(); // 그 사이 다른 탭으로 옮겼으면 건드리지 않음
}

// 주석 검색 링크용 영문 책 이름 (BOOKS와 같은 순서)
const BOOK_EN = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalm", "Proverbs", "Ecclesiastes",
  "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
  "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];

// 장마다 열리는 주석 검색 링크. 주석 사이트의 장별 주소는 확인할 수 없어서, 항상 열리는 검색 주소로 연결함
const COMMENTARY_SOURCES = [
  { name: "한글 주석·해설 (구글)", url: (c) => `https://www.google.com/search?q=${encodeURIComponent(`${c.book.name} ${c.chap}장 주석`)}` },
  { name: "한글 주석·해설 (네이버)", url: (c) => `https://search.naver.com/search.naver?query=${encodeURIComponent(`${c.book.name} ${c.chap}장 주석 해설`)}` },
  { name: "호크마 주석", url: (c) => `https://www.google.com/search?q=${encodeURIComponent(`호크마 주석 ${c.book.name} ${c.chap}장`)}` },
  { name: "매튜 헨리 주석", url: (c) => `https://www.google.com/search?q=${encodeURIComponent(`매튜 헨리 주석 ${c.book.name} ${c.chap}장`)}` },
  { name: "영문 주석 (Enduring Word)", url: (c) => `https://www.google.com/search?q=${encodeURIComponent(`site:enduringword.com ${BOOK_EN[c.book.index]} ${c.chap}`)}` },
];

function commentaryHtml(day) {
  const multiBook = new Set(day.map((i) => CHAPTERS[i].book.index)).size > 1;
  return COMMENTARY_SOURCES.map((src) => `
    <div class="sum-links"><b>${src.name}</b>
      <span>${day.map((i) => {
        const c = CHAPTERS[i];
        return `<a class="sum-chip" target="_blank" rel="noopener" href="${src.url(c)}">${multiBook ? `${esc(c.book.name)} ` : ""}${c.chap}장</a>`;
      }).join("")}</span>
    </div>`).join("");
}

// ── 인물 관계도 (SVG) ──
const REL_COLOR = { family: "var(--accent)", ally: "#3b82c4", conflict: "var(--warn)", other: "var(--muted)" };
const REL_NAME = { family: "가족", ally: "동역·도움", conflict: "대립", other: "기타" };

// 이어진 사람끼리 이웃해서 놓이도록 순서를 잡음 (선이 덜 꼬임)
function relationOrder(names, rels) {
  const deg = Object.fromEntries(names.map((n) => [n, 0]));
  rels.forEach((r) => { deg[r.from]++; deg[r.to]++; });
  const left = new Set(names);
  const order = [];
  // 줄기의 끝(관계가 가장 적은 사람)에서 시작해야 이어진 사람들이 한 줄로 나란히 놓임
  let cur = [...names].filter((x) => deg[x] > 0).sort((a, b) => deg[a] - deg[b])[0] ?? names[0];
  while (cur !== undefined) {
    order.push(cur);
    left.delete(cur);
    const next = [...left].map((n) => ({ n, w: rels.filter((r) => (r.from === cur && r.to === n) || (r.to === cur && r.from === n)).length, d: deg[n] }))
      .sort((a, b) => b.w - a.w || b.d - a.d)[0];
    cur = next ? next.n : undefined;
  }
  return order;
}

function relationGraphHtml(people, relations) {
  const used = new Set();
  relations.forEach((r) => { used.add(r.from); used.add(r.to); });
  const names = people.map((p) => p.name).filter((n) => used.has(n));
  if (names.length < 2 || !relations.length) return `<p class="muted small">이번 분량에는 인물 사이의 관계가 뚜렷하게 나오지 않아요.</p>`;

  // 관계가 가장 많은 사람(대개 그날의 중심 인물)은 가운데에 놓고, 나머지는 둘레에 놓음
  const deg = Object.fromEntries(names.map((x) => [x, 0]));
  relations.forEach((r) => { deg[r.from]++; deg[r.to]++; });
  const hub = [...names].sort((a, b) => deg[b] - deg[a])[0];
  const hubCenter = names.length >= 4 && deg[hub] >= 3;
  const ring = relationOrder(names.filter((x) => !(hubCenter && x === hub)), relations.filter((r) => !hubCenter || (r.from !== hub && r.to !== hub)));
  const order = hubCenter ? [hub, ...ring] : ring;
  const n = ring.length;
  const W = 360, H = n <= 3 ? 240 : n <= 5 ? 320 : 380;
  const cx = W / 2, cy = H / 2;
  const rx = n <= 3 ? 110 : 120, ry = H / 2 - 28;
  const pos = {};
  const box = (name, x, y) => ({ x, y, hw: Math.max(26, (name.length * 13 + 16) / 2), hh: 14 });
  ring.forEach((name, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    pos[name] = box(name, cx + rx * Math.cos(a), cy + ry * Math.sin(a));
  });
  if (hubCenter) pos[hub] = box(hub, cx, cy);
  // 중심에서 상대 방향으로 상자 가장자리까지 나온 점
  const edgePoint = (from, to) => {
    const dx = to.x - from.x, dy = to.y - from.y;
    const t = Math.min(dx ? from.hw / Math.abs(dx) : Infinity, dy ? from.hh / Math.abs(dy) : Infinity);
    return { x: from.x + dx * t, y: from.y + dy * t };
  };
  // 같은 두 사람 사이에 관계가 여러 개면 살짝 휘어서 겹치지 않게
  const pairTotal = {}, pairCount = {};
  const drawable = relations.filter((r) => pos[r.from] && pos[r.to]);
  drawable.forEach((r) => { const k = [r.from, r.to].sort().join("|"); pairTotal[k] = (pairTotal[k] || 0) + 1; });
  const edges = drawable.map((r) => {
    const k = [r.from, r.to].sort().join("|");
    const idx = pairCount[k] = (pairCount[k] || 0) + 1;
    const a = pos[r.from], b = pos[r.to];
    const p1 = edgePoint(a, b), p2 = edgePoint(b, a);
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
    const bend = (idx - (pairTotal[k] + 1) / 2) * 24 * (r.from < r.to ? 1 : -1);
    const qx = mx - ((p2.y - p1.y) / len) * bend * 2, qy = my + ((p2.x - p1.x) / len) * bend * 2;
    const lx = 0.25 * p1.x + 0.5 * qx + 0.25 * p2.x, ly = 0.25 * p1.y + 0.5 * qy + 0.25 * p2.y;
    const color = REL_COLOR[r.kind] || REL_COLOR.other;
    return `<g class="rg-edge"><path d="M${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}"
      fill="none" stroke="${color}" stroke-width="2" ${r.kind === "conflict" ? 'stroke-dasharray="5 4"' : ""}
      ${r.directed ? `marker-end="url(#rg-arrow-${r.kind in REL_COLOR ? r.kind : "other"})"` : ""}/>
      <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" class="rg-label" fill="${color}">${esc(r.label)}</text></g>`;
  }).join("");
  const nodes = order.map((name) => {
    const p = pos[name];
    return `<g class="rg-node"><rect x="${(p.x - p.hw).toFixed(1)}" y="${(p.y - p.hh).toFixed(1)}" width="${(p.hw * 2).toFixed(1)}" height="${p.hh * 2}" rx="10"/>
      <text x="${p.x.toFixed(1)}" y="${(p.y + 5).toFixed(1)}" text-anchor="middle">${esc(name)}</text></g>`;
  }).join("");
  const markers = Object.keys(REL_COLOR).map((k) => `<marker id="rg-arrow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${REL_COLOR[k]}"/></marker>`).join("");
  const kinds = [...new Set(relations.map((r) => r.kind))].filter((k) => REL_COLOR[k]);
  return `
    <svg class="rg" viewBox="0 0 ${W} ${H}" role="img" aria-label="등장 인물 관계도: ${esc(relations.map((r) => `${r.from}은(는) ${r.to}의 ${r.label}`).join(", "))}">
      <defs>${markers}</defs>${edges}${nodes}
    </svg>
    <p class="rg-legend">${kinds.map((k) => `<span><i style="background:${REL_COLOR[k]}"></i>${REL_NAME[k]}</span>`).join("")}<em>화살표는 "A는 B의 ○○"에서 B를 가리켜요</em></p>`;
}

function songLink(s) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.title} ${s.artist}`)}`;
}

// 요약 탭 그리기 (reader.js의 renderReaderSheet에서 부름)
function renderSummaryTab(body, day) {
  setSheetTitle(READER_TABS);
  const head = `<div class="sum-head"><small>Day ${viewingDay + 1}</small><b>${esc(describeChapters(day))}</b></div>`;
  if (day.length > SUMMARY_MAX_CHAPTERS) {
    body.innerHTML = `${head}<p class="muted small">하루 분량이 ${SUMMARY_MAX_CHAPTERS}장을 넘어서 요약을 만들 수 없어요.</p>`;
    return;
  }
  if (!PUSH_SERVER) {
    body.innerHTML = `${head}<p class="muted small">요약은 알림 서버가 필요해요. js/core/config.js에 서버 주소를 넣어 주세요.</p>`;
    return;
  }

  const key = summaryRanges(day);
  const data = readSummaryStore()[key];
  if (data) {
    body.innerHTML = `${head}
      <section class="tool-card sum-card">
        <h3 class="label">주요 등장 인물</h3>
        <ul class="sum-people">${data.people.map((p) => `<li><b>${esc(p.name)}</b>${p.role ? `<span>${esc(p.role)}</span>` : ""}</li>`).join("")}</ul>
      </section>
      <section class="tool-card sum-card">
        <h3 class="label">등장 인물 관계도</h3>
        ${relationGraphHtml(data.people, data.relations || [])}
      </section>
      <section class="tool-card sum-card">
        <h3 class="label">오늘의 이야기</h3>
        ${data.story.map((p) => `<p class="sum-story">${esc(p)}</p>`).join("")}
      </section>
      <section class="tool-card sum-card">
        <h3 class="label">오늘 말씀과 어울리는 찬양</h3>
        <ul class="sum-songs">${data.songs.map((s) => `
          <li>
            <div><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div>
            ${s.why ? `<p>${esc(s.why)}</p>` : ""}
            <a class="btn ghost small" target="_blank" rel="noopener" href="${songLink(s)}">▶ 유튜브에서 찾기</a>
          </li>`).join("")}</ul>
      </section>
      ${(data.places || []).length ? `
      <section class="tool-card sum-card">
        <h3 class="label">주요 지역</h3>
        <ul class="sum-places">${data.places.map((p) => `<li><b>📍 ${esc(p.name)}</b>${p.note ? `<span>${esc(p.note)}</span>` : ""}</li>`).join("")}</ul>
      </section>` : ""}
      <section class="tool-card sum-card">
        <h3 class="label">주석 참고 링크</h3>
        ${commentaryHtml(day)}
        <p class="muted small hint">검색 결과로 연결돼요. 본문을 읽은 뒤 궁금한 장의 해설을 찾아볼 때 쓰세요.</p>
      </section>
      <p class="muted small hint">AI가 정리한 요약이에요. 본문을 읽기 전에 흐름을 잡는 용도로만 봐 주세요. 찬양은 제목이 다를 수 있어 검색으로 연결해요.</p>`;
    return;
  }

  const st = summaryMem[key];
  if (st && st.status === "error") {
    body.innerHTML = `${head}
      <div class="sum-state">
        <p>${esc(st.error)}</p>
        ${st.code === "not_configured" ? "" : `<button class="btn soft small" data-sum-retry="${esc(key)}">다시 시도</button>`}
      </div>`;
    return;
  }
  if (!st) loadSummary(key);
  body.innerHTML = `${head}
    <div class="sum-state"><div class="sum-spin" aria-hidden="true"></div>
      <p>오늘 분량을 정리하고 있어요…</p>
      <p class="muted small">처음 만드는 분량은 10~30초쯤 걸려요. 한 번 만들면 다음부터는 바로 보여요.</p></div>`;
}
