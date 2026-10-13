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

async function loadSummary(key, refresh = false) {
  summaryMem[key] = { status: "loading", refresh };
  let failed = "";
  try {
    const res = await fetch(`${PUSH_SERVER}/summary?r=${encodeURIComponent(key)}${refresh ? "&refresh=1" : ""}`, {
      signal: window.AbortSignal && AbortSignal.timeout ? AbortSignal.timeout(75000) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { code: data.code, detail: data.detail });
    writeSummaryStore(key, { people: data.people, relations: data.relations || [], places: data.places || [], story: data.story, songs: data.songs });
    delete summaryMem[key];
  } catch (e) {
    failed = e.name === "TimeoutError" ? "시간이 너무 오래 걸렸어요." : e.message || "불러오지 못했어요.";
    // 새로 만들기가 실패하면 보던 요약은 그대로 두고 알려만 줌
    if (refresh) { delete summaryMem[key]; showToast(`요약을 새로 만들지 못했어요. ${failed}`); }
    else summaryMem[key] = { status: "error", error: failed, code: e.code, detail: e.detail };
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
        return `<a class="sum-chip" target="_blank" rel="noopener" href="${src.url(c)}">${multiBook ? `${esc(c.book.name)} ` : ""}${c.chap}${chapUnit(c.book)}</a>`;
      }).join("")}</span>
    </div>`).join("");
}

// ── 인물 관계도 (SVG) ──
const REL_COLOR = { family: "var(--accent)", ally: "#3b82c4", conflict: "var(--warn)", other: "var(--muted)", rename: "#c48a1e" };
const REL_NAME = { family: "가족", ally: "동역·도움", conflict: "대립", other: "기타", rename: "이름이 바뀜" };

// 이름 상자 크기 (13px 굵은 글씨 기준)
const rgBox = (name) => ({ hw: Math.max(26, (name.length * 13 + 16) / 2), hh: 14 });
const rgLabelW = (label) => label.length * 11.5 + 8;

// 서로 이어진 사람끼리 묶음(연결 요소)으로 나눔. 큰 묶음부터
function relationGroups(names, rels) {
  const adj = Object.fromEntries(names.map((n) => [n, new Set()]));
  rels.forEach((r) => { adj[r.from].add(r.to); adj[r.to].add(r.from); });
  const seen = new Set(), groups = [];
  for (const n of names) {
    if (seen.has(n)) continue;
    const g = [], stack = [n];
    seen.add(n);
    while (stack.length) {
      const x = stack.pop();
      g.push(x);
      adj[x].forEach((y) => { if (!seen.has(y)) { seen.add(y); stack.push(y); } });
    }
    groups.push(g.sort((a, b) => names.indexOf(a) - names.indexOf(b)));
  }
  return groups.sort((a, b) => b.length - a.length);
}

// 한 묶음 배치: 이어진 사람끼리 당기고(용수철) 모두 서로 밀어내는(반발) 방식을 몇백 번 되풀이. 무작위 없이 늘 같은 결과
function layoutGroup(names, rels) {
  const n = names.length;
  const pos = {};
  if (n === 1) { pos[names[0]] = { x: 0, y: 0 }; return pos; }
  const r0 = 50 + 22 * n;
  names.forEach((name, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    pos[name] = { x: r0 * Math.cos(a), y: r0 * Math.sin(a) * 1.25 };
  });
  // 같은 두 사람 사이 선은 하나로 보고, 이름표가 길면 더 멀리 떨어뜨림
  const springs = {};
  rels.forEach((r) => {
    const k = [r.from, r.to].sort().join("|");
    const s = springs[k] || (springs[k] = { a: r.from, b: r.to, label: 0 });
    s.label = Math.max(s.label, rgLabelW(r.label));
  });
  const ITER = 400;
  for (let it = 0; it < ITER; it++) {
    const t = 1 - it / ITER;
    const f = Object.fromEntries(names.map((x) => [x, { x: 0, y: 0 }]));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const A = pos[names[i]], B = pos[names[j]];
      let dx = B.x - A.x, dy = B.y - A.y;
      const d = Math.hypot(dx, dy) || 0.01;
      dx /= d; dy /= d;
      const push = 42000 / (d * d);
      f[names[i]].x -= dx * push; f[names[i]].y -= dy * push;
      f[names[j]].x += dx * push; f[names[j]].y += dy * push;
    }
    Object.values(springs).forEach((s) => {
      const A = pos[s.a], B = pos[s.b];
      const dx = B.x - A.x, dy = B.y - A.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const want = rgBox(s.a).hw + rgBox(s.b).hw + s.label * 0.9 + 44;
      const pull = (d - want) * 0.06;
      f[s.a].x += (dx / d) * pull; f[s.a].y += (dy / d) * pull;
      f[s.b].x -= (dx / d) * pull; f[s.b].y -= (dy / d) * pull;
    });
    names.forEach((x) => {
      // 가운데로 살짝 모으고, 휴대폰 화면에 맞게 가로를 더 좁힘
      f[x].x -= pos[x].x * 0.016; f[x].y -= pos[x].y * 0.012;
      const len = Math.hypot(f[x].x, f[x].y), cap = 18 * t + 0.5;
      const k = len > cap ? cap / len : 1;
      pos[x].x += f[x].x * k; pos[x].y += f[x].y * k;
    });
  }
  // 상자끼리 겹치면 마지막으로 떼어 놓음
  for (let it = 0; it < 60; it++) {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const A = pos[names[i]], B = pos[names[j]], a = rgBox(names[i]), b = rgBox(names[j]);
      const ox = a.hw + b.hw + 10 - Math.abs(B.x - A.x), oy = a.hh + b.hh + 10 - Math.abs(B.y - A.y);
      if (ox > 0 && oy > 0) {
        if (ox < oy) { const s = (B.x >= A.x ? 1 : -1) * ox / 2; A.x -= s; B.x += s; }
        else { const s = (B.y >= A.y ? 1 : -1) * oy / 2; A.y -= s; B.y += s; }
      }
    }
  }
  return pos;
}

function relationGraphHtml(people, relations) {
  const used = new Set();
  relations.forEach((r) => { used.add(r.from); used.add(r.to); });
  const names = people.map((p) => p.name).filter((n) => used.has(n));
  const rels = relations.filter((r) => names.includes(r.from) && names.includes(r.to));
  if (names.length < 2 || !rels.length) return `<p class="muted small">이번 분량에는 인물 사이의 관계가 뚜렷하게 나오지 않아요.</p>`;

  // 묶음마다 따로 배치한 뒤, 폭 360 안에서 왼쪽부터 채우고 넘치면 다음 줄로
  const W = 360, PAD = 12, GAP = 26, MAXW = W - PAD * 2;
  const pos = {};
  const rows = [];
  let row = null;
  relationGroups(names, rels).forEach((g) => {
    const p = layoutGroup(g, rels.filter((r) => g.includes(r.from)));
    const span = () => {
      const xs = g.map((x) => [p[x].x - rgBox(x).hw, p[x].x + rgBox(x).hw]).flat();
      return [Math.min(...xs), Math.max(...xs)];
    };
    // 폭이 넘치면 가로 간격만 줄이고, 그 때문에 겹친 상자는 세로로 떼어 놓음
    let [x0, x1] = span();
    if (x1 - x0 > MAXW) {
      const cx = (x0 + x1) / 2, maxHw = Math.max(...g.map((x) => rgBox(x).hw));
      const k = (MAXW - maxHw * 2) / Math.max(1, (x1 - x0) - maxHw * 2);
      g.forEach((x) => { p[x].x = cx + (p[x].x - cx) * k; });
      for (let it = 0; it < 80; it++) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
        const A = p[g[i]], B = p[g[j]], a = rgBox(g[i]), b = rgBox(g[j]);
        const ox = a.hw + b.hw + 8 - Math.abs(B.x - A.x), oy = a.hh + b.hh + 12 - Math.abs(B.y - A.y);
        if (ox > 0 && oy > 0) { const s = (B.y >= A.y ? 1 : -1) * oy / 2; A.y -= s; B.y += s; }
      }
      [x0, x1] = span();
    }
    const ys = g.map((x) => [p[x].y - rgBox(x).hh, p[x].y + rgBox(x).hh]).flat();
    const y0 = Math.min(...ys), gw = x1 - x0, gh = Math.max(...ys) - y0 + 18; // 이름표 자리
    if (!row || row.w + GAP + gw > MAXW) { row = { groups: [], w: -GAP, h: 0 }; rows.push(row); }
    row.groups.push({ g, p, x0, y0, gw, gh });
    row.w += GAP + gw; row.h = Math.max(row.h, gh);
  });
  let y = PAD + 9;
  rows.forEach((r) => {
    let x = PAD + (MAXW - r.w) / 2; // 줄마다 가운데 정렬
    r.groups.forEach(({ g, p, x0, y0, gw, gh }) => {
      const dy = (r.h - gh) / 2;
      g.forEach((n) => { pos[n] = { x: p[n].x - x0 + x, y: p[n].y - y0 + y + dy, ...rgBox(n) }; });
      x += gw + GAP;
    });
    y += r.h + GAP;
  });
  const VW = W, VH = y - GAP + PAD;

  // 중심에서 상대 방향으로 상자 가장자리까지 나온 점
  const edgePoint = (from, to) => {
    const dx = to.x - from.x, dy = to.y - from.y;
    const t = Math.min(dx ? from.hw / Math.abs(dx) : Infinity, dy ? from.hh / Math.abs(dy) : Infinity);
    return { x: from.x + dx * t, y: from.y + dy * t };
  };
  const pairTotal = {}, pairCount = {};
  rels.forEach((r) => { const k = [r.from, r.to].sort().join("|"); pairTotal[k] = (pairTotal[k] || 0) + 1; });
  const edges = rels.map((r) => {
    const k = [r.from, r.to].sort().join("|");
    const idx = pairCount[k] = (pairCount[k] || 0) + 1;
    const a = pos[r.from], b = pos[r.to];
    const p1 = edgePoint(a, b), p2 = edgePoint(b, a);
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
    // 같은 두 사람 사이에 관계가 둘이면 양쪽으로 휘어 나눔
    const bend = pairTotal[k] > 1 ? (idx === 1 ? -1 : 1) * 22 * (r.from < r.to ? 1 : -1) : 0;
    const nx = -(p2.y - p1.y) / len, ny = (p2.x - p1.x) / len;
    const qx = mx + nx * bend * 2, qy = my + ny * bend * 2;
    const lx = 0.25 * p1.x + 0.5 * qx + 0.25 * p2.x, ly = 0.25 * p1.y + 0.5 * qy + 0.25 * p2.y;
    return { r, p1, p2, qx, qy, lx, ly, ax: lx, ay: ly, w: rgLabelW(r.label), h: 15 };
  });
  // 이름표끼리, 이름표와 이름 상자가 겹치면 조금씩 밀어냄(원래 자리에서 40px 넘게는 안 감)
  for (let it = 0; it < 150; it++) {
    for (let i = 0; i < edges.length; i++) {
      const A = edges[i];
      for (let j = i + 1; j < edges.length; j++) {
        const B = edges[j];
        const ox = (A.w + B.w) / 2 + 6 - Math.abs(B.lx - A.lx), oy = (A.h + B.h) / 2 + 3 - Math.abs(B.ly - A.ly);
        if (ox > 0 && oy > 0) {
          if (oy <= ox) { const s = (B.ly >= A.ly ? 1 : -1) * oy / 2; A.ly -= s; B.ly += s; }
          else { const s = (B.lx >= A.lx ? 1 : -1) * ox / 2; A.lx -= s; B.lx += s; }
        }
      }
      Object.values(pos).forEach((P) => {
        const ox = A.w / 2 + P.hw + 2 - Math.abs(A.lx - P.x), oy = A.h / 2 + P.hh + 2 - Math.abs(A.ly - P.y);
        if (ox > 0 && oy > 0) {
          if (oy <= ox) A.ly += (A.ly >= P.y ? 1 : -1) * oy;
          else A.lx += (A.lx >= P.x ? 1 : -1) * ox;
        }
      });
      const dx = A.lx - A.ax, dy = A.ly - A.ay, d = Math.hypot(dx, dy);
      if (d > 40) { A.lx = A.ax + (dx / d) * 40; A.ly = A.ay + (dy / d) * 40; }
    }
  }
  const lines = edges.map((e) => {
    const color = REL_COLOR[e.r.kind] || REL_COLOR.other;
    return `<path d="M${e.p1.x.toFixed(1)} ${e.p1.y.toFixed(1)} Q${e.qx.toFixed(1)} ${e.qy.toFixed(1)} ${e.p2.x.toFixed(1)} ${e.p2.y.toFixed(1)}"
      fill="none" stroke="${color}" stroke-width="2" ${e.r.kind === "conflict" ? 'stroke-dasharray="5 4"' : ""}
      ${e.r.directed ? `marker-end="url(#rg-arrow-${e.r.kind in REL_COLOR ? e.r.kind : "other"})"` : ""}/>`;
  }).join("");
  const labels = edges.map((e) => {
    const color = REL_COLOR[e.r.kind] || REL_COLOR.other;
    return `<text x="${e.lx.toFixed(1)}" y="${(e.ly + 4).toFixed(1)}" text-anchor="middle" class="rg-label" fill="${color}">${esc(e.r.label)}</text>`;
  }).join("");
  const nodes = names.map((name) => {
    const p = pos[name];
    return `<g class="rg-node"><rect x="${(p.x - p.hw).toFixed(1)}" y="${(p.y - p.hh).toFixed(1)}" width="${(p.hw * 2).toFixed(1)}" height="${p.hh * 2}" rx="10"/>
      <text x="${p.x.toFixed(1)}" y="${(p.y + 5).toFixed(1)}" text-anchor="middle">${esc(name)}</text></g>`;
  }).join("");
  const markers = Object.keys(REL_COLOR).map((k) => `<marker id="rg-arrow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${REL_COLOR[k]}"/></marker>`).join("");
  const kinds = [...new Set(rels.map((r) => r.kind))].filter((k) => REL_COLOR[k]);
  return `
    <svg class="rg" viewBox="0 0 ${VW.toFixed(0)} ${VH.toFixed(0)}" role="img" aria-label="등장 인물 관계도: ${esc(rels.map((r) => `${r.from}은(는) ${r.to}의 ${r.label}`).join(", "))}">
      <defs>${markers}</defs>${lines}${nodes}${labels}
    </svg>
    <p class="rg-legend">${kinds.map((k) => `<span><i style="background:${REL_COLOR[k]}"></i>${REL_NAME[k]}</span>`).join("")}<em>화살표는 "A는 B의 ○○"에서 B를 가리켜요</em></p>`;
}

function songLink(s) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.title} ${s.artist}`)}`;
}

// ── 미리 써 둔 장별 요약 (data/summary/<책 코드>.json) ──
// 그날 분량의 모든 장이 파일에 있으면 그걸 합쳐서 보여 주고, 하나라도 없으면 서버(Gemini) 요약으로 넘어감
const staticBooks = {}; // 책 코드 → { status: "loading" | "ok" | "none", data }

function loadStaticBook(code) {
  staticBooks[code] = { status: "loading" };
  fetch(`data/summary/${code}.json`, { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => { staticBooks[code] = data && data.chapters ? { status: "ok", data } : { status: "none" }; })
    .catch(() => { staticBooks[code] = { status: "none" }; })
    .then(() => { if (sheetTab === "summary") renderReaderSheet(); });
}

// "loading" | null(파일에 없는 장이 있음) | 합친 결과
function staticDaySummary(day) {
  const codes = [...new Set(day.map((i) => CHAPTERS[i].book.code))];
  codes.forEach((code) => { if (!staticBooks[code]) loadStaticBook(code); });
  if (codes.some((code) => staticBooks[code].status === "loading")) return "loading";
  const chapters = day.map((i) => {
    const { book, chap } = CHAPTERS[i];
    const file = staticBooks[book.code];
    const data = file.status === "ok" && file.data.chapters[chap];
    return data ? { book, chap, data } : null;
  });
  if (chapters.some((c) => !c)) return null;
  const books = Object.fromEntries(codes.map((code) => [code, staticBooks[code].data]));
  return composeDay(chapters, books);
}

function staticSummaryHtml(s) {
  const flow = s.flowMode === "story"
    ? s.flow.map((f) => `${s.flow.length > 1 ? `<p class="sum-ref">${esc(f.ref)}</p>` : ""}<p class="sum-story">${esc(f.text)}</p>`).join("")
    : `<ol class="sum-lines">${s.flow.map((f) => `<li><b>${esc(f.ref)}</b><span>${esc(f.text)}</span></li>`).join("")}</ol>`;
  const events = s.events.length ? `
    <section class="tool-card sum-card">
      <h3 class="label">${s.eventsTitle}</h3>
      <ol class="sum-events">${s.events.map((e) => `
        <li><div><b>${esc(e.title)}</b><small>${esc(e.ref)}</small></div><p>${esc(e.text)}</p></li>`).join("")}</ol>
    </section>` : "";
  const places = s.places.length ? `
    <section class="tool-card sum-card">
      <h3 class="label">주요 지역</h3>
      <ul class="sum-places">${s.places.map((p) => `
        <li><b>📍 ${esc(p.name)}</b>${p.where ? `<span>${esc(p.where)}</span>` : ""}
          ${p.whats.map((w) => `<p><small>${esc(w.ref)}</small>${esc(w.text)}</p>`).join("")}</li>`).join("")}</ul>
    </section>` : "";
  const songs = s.songs.length ? `
    <section class="tool-card sum-card">
      <h3 class="label">이 책과 어울리는 찬양</h3>
      <ul class="sum-songs">${s.songs.map((song) => `
        <li>
          <div><b>${esc(song.title)}</b><span>${esc(song.artist)}</span></div>
          ${song.why ? `<p>${esc(song.why)}</p>` : ""}
          <a class="btn ghost small" target="_blank" rel="noopener" href="${songLink(song)}">▶ 유튜브에서 찾기</a>
        </li>`).join("")}</ul>
    </section>` : "";
  return `
    <section class="tool-card sum-card">
      <h3 class="label">${s.flowMode === "story" ? "오늘의 이야기" : "한눈에 보기"}</h3>
      ${flow}
    </section>
    ${events}
    <section class="tool-card sum-card">
      <h3 class="label">주요 등장 인물</h3>
      ${s.people.length ? `<ul class="sum-people">${s.people.map((p) => `<li><b>${esc(p.display)}${p.where ? `<small>${esc(p.where)}</small>` : ""}</b>${p.role ? `<span>${esc(p.role)}</span>` : ""}</li>`).join("")}</ul>`
        : `<p class="muted small">이번 분량에는 이야기 속 인물이 따로 나오지 않아요.</p>`}
    </section>
    ${s.people.length ? `
    <section class="tool-card sum-card">
      <h3 class="label">등장 인물 관계도</h3>
      ${relationGraphHtml(s.graphPeople, s.rels)}
    </section>` : ""}
    ${places}
    ${songs}`;
}

// 요약 탭 그리기 (reader.js의 renderReaderSheet에서 부름)
function renderSummaryTab(body, day) {
  setSheetTitle(READER_TABS);
  const pre = staticDaySummary(day);
  if (pre === "loading") {
    body.innerHTML = `<div class="sum-head"><small>Day ${viewingDay + 1}</small><b>${esc(describeChapters(day))}</b></div>
      <div class="sum-state"><div class="sum-spin" aria-hidden="true"></div><p>요약을 불러오고 있어요…</p></div>`;
    return;
  }
  if (pre) {
    body.innerHTML = `<div class="sum-headrow"><div class="sum-head"><small>Day ${viewingDay + 1}</small><b>${esc(describeChapters(day))}</b></div></div>
      ${staticSummaryHtml(pre)}
      <section class="tool-card sum-card">
        <h3 class="label">주석 참고 링크</h3>
        ${commentaryHtml(day)}
        <p class="muted small hint">검색 결과로 연결돼요. 본문을 읽은 뒤 궁금한 장의 해설을 찾아볼 때 쓰세요.</p>
      </section>
      <p class="muted small hint ai-note">🤖 AI 작성 · 연구용 성경 해설과 인물·지명을 대조했지만, 틀린 곳이 있을 수 있어요. 본문을 읽기 전에 흐름을 잡는 용도로 봐 주세요.</p>`;
    return;
  }
  const key0 = summaryRanges(day);
  const busy = (summaryMem[key0] || {}).refresh;
  const head = `<div class="sum-headrow"><div class="sum-head"><small>Day ${viewingDay + 1}</small><b>${esc(describeChapters(day))}</b></div>
    ${day.length <= SUMMARY_MAX_CHAPTERS && PUSH_SERVER && readSummaryStore()[key0]
      ? `<button class="sum-refresh ${busy ? "spin" : ""}" data-sum-refresh="${esc(key0)}" ${busy ? "disabled" : ""} aria-label="요약 새로 만들기" title="요약 새로 만들기">↻</button>` : ""}</div>`;
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
        ${st.detail ? `<p class="muted small sum-detail">${esc(st.detail)}</p>` : ""}
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
