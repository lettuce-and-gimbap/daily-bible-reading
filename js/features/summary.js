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
let summaryBook = ""; // 지금 보는 요약의 권 코드
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

// 관계선 그리기 자리: 상자 가장자리에서 시작해 끝나는 곡선, 이름표 자리. iters만큼 이름표 겹침을 밀어냄
function rgEdgeGeom(rels, pos, iters) {
  // 중심에서 상대 방향으로 상자 가장자리까지 나온 점
  const edgePoint = (from, to) => {
    const dx = to.x - from.x, dy = to.y - from.y;
    const t = Math.min(dx ? from.hw / Math.abs(dx) : Infinity, dy ? from.hh / Math.abs(dy) : Infinity);
    return { x: from.x + dx * t, y: from.y + dy * t };
  };
  const pairTotal = {}, pairCount = {};
  rels.forEach((r) => { const k = [r.from, r.to].sort().join("|"); pairTotal[k] = (pairTotal[k] || 0) + 1; });
  const edges = rels.map((r, i) => {
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
    return { i, r, p1, p2, qx, qy, lx, ly, ax: lx, ay: ly, w: rgLabelW(r.label), h: 15 };
  });
  // 이름표끼리, 이름표와 이름 상자가 겹치면 조금씩 밀어냄(원래 자리에서 40px 넘게는 안 감)
  for (let it = 0; it < iters; it++) {
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
  return edges;
}

// 관계도 SVG 안쪽(선·상자·이름표). 상세 창에서는 선과 상자에 번호를 달아 누를 수 있게 함
function rgSvgInner(names, pos, edges, live) {
  const lines = edges.map((e) => {
    const color = REL_COLOR[e.r.kind] || REL_COLOR.other;
    const d = `M${e.p1.x.toFixed(1)} ${e.p1.y.toFixed(1)} Q${e.qx.toFixed(1)} ${e.qy.toFixed(1)} ${e.p2.x.toFixed(1)} ${e.p2.y.toFixed(1)}`;
    return `<g class="rg-edge" ${live ? `data-edge="${e.i}"` : ""}>${live ? `<path class="rg-hit" d="${d}"/>` : ""}<path class="rg-line" d="${d}"
      fill="none" stroke="${color}" stroke-width="2" ${e.r.kind === "conflict" ? 'stroke-dasharray="5 4"' : ""}
      ${e.r.directed ? `marker-end="url(#rg-arrow-${e.r.kind in REL_COLOR ? e.r.kind : "other"})"` : ""}/></g>`;
  }).join("");
  const labels = edges.map((e) => {
    const color = REL_COLOR[e.r.kind] || REL_COLOR.other;
    return `<text ${live ? `data-edge="${e.i}"` : ""} x="${e.lx.toFixed(1)}" y="${(e.ly + 4).toFixed(1)}" text-anchor="middle" class="rg-label" fill="${color}">${esc(e.r.label)}</text>`;
  }).join("");
  const nodes = names.map((name) => {
    const p = pos[name];
    return `<g class="rg-node" ${live ? `data-node="${esc(name)}"` : ""}><rect x="${(p.x - p.hw).toFixed(1)}" y="${(p.y - p.hh).toFixed(1)}" width="${(p.hw * 2).toFixed(1)}" height="${p.hh * 2}" rx="10"/>
      <text x="${p.x.toFixed(1)}" y="${(p.y + 5).toFixed(1)}" text-anchor="middle">${esc(name)}</text></g>`;
  }).join("");
  const markers = Object.keys(REL_COLOR).map((k) => `<marker id="rg-arrow-${k}${live ? "-live" : ""}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${REL_COLOR[k]}"/></marker>`).join("");
  const body = `<defs>${markers}</defs>${lines}${nodes}${labels}`;
  return live ? body.replace(/url\(#rg-arrow-(\w+)\)/g, "url(#rg-arrow-$1-live)") : body;
}

// 화면에 그린 관계도 정보. 꾹 누르면 이걸로 상세 창을 다시 그림
const rgModels = {};
let rgSeq = 0;

function relationGraphCore(people, relations) {
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
  let VW = W, VH = y - GAP + PAD;
  if (names.length >= 6) { // 인물이 많으면 상하좌우에 고루 퍼지게 다시 놓고, 화면 폭에 맞춰 줄임
    rgPreviewLayout(names, rels, pos, 360);
    const b = rgBounds(names, pos);
    names.forEach((nm) => { pos[nm].x += PAD - b.x0; pos[nm].y += PAD - b.y0; });
    VW = b.x1 - b.x0 + PAD * 2; VH = b.y1 - b.y0 + PAD * 2;
  }
  const edges = rgEdgeGeom(rels, pos, 150);

  const id = `rg${++rgSeq}`;
  rgModels[id] = { names, rels, pos, roles: Object.fromEntries(people.map((p) => [p.name, p.role || ""])), VW, VH };
  Object.keys(rgModels).slice(0, -20).forEach((k) => delete rgModels[k]); // 오래된 것은 버림
  const kinds = [...new Set(rels.map((r) => r.kind))].filter((k) => REL_COLOR[k]);
  return `
    <p class="rg-hint">꾹 눌러서 자세한 내용을 확인해보아요</p>
    <div class="rg-wrap" data-rg="${id}" tabindex="0" aria-label="관계도를 꾹 누르면 자세히 볼 수 있어요">
      <svg class="rg" viewBox="0 0 ${VW.toFixed(0)} ${VH.toFixed(0)}" role="img" aria-label="등장 인물 관계도: ${esc(rels.map((r) => `${r.from}은(는) ${r.to}의 ${r.label}`).join(", "))}">
        ${rgSvgInner(names, pos, edges, false)}
      </svg>
      <span class="rg-press" aria-hidden="true"></span>
    </div>
    <p class="rg-legend">${kinds.map((k) => `<span><i style="background:${REL_COLOR[k]}"></i>${REL_NAME[k]}</span>`).join("")}<em>화살표는 "A는 B의 ○○"에서 B를 가리켜요</em></p>`;
}

// 관계도: 관리자용 왕정 역사서 시험에서는 사건 관계와 가족 관계를 층별로 나눠 보여 줌
const KIN_GROUPS_MAIN = [["사건", (r) => r.kind !== "family"], ["가족", (r) => r.kind === "family"]];
const KIN_GROUPS_ALL = [
  ["전체", () => true],
  ["가족·혼인", (r) => r.kind === "family"],
  ["싸움·죽음", (r) => r.kind === "conflict"],
  ["동맹·아는 사이", (r) => r.kind === "ally" || r.kind === "other"],
];
function relationGraphHtml(people, relations, opts = {}) {
  const visibleRelations = opts.kin ? relations : relations.filter((r) => !r.adminOnly);
  if (!opts.kin) return relationGraphCore(people, visibleRelations);
  const groups = opts.all ? KIN_GROUPS_ALL : KIN_GROUPS_MAIN;
  const panes = groups.map(([label, keep], i) => {
    const selected = relations.filter(keep);
    return `<div class="kin-pane" data-kinpane="${i}"${i ? " hidden" : ""}>${selected.length ? relationGraphCore(people, selected) : `<p class="muted small kin-empty">이 분량에는 ‘${esc(label)}’ 관계가 없어요.</p>`}</div>`;
  }).join("");
  return `<div class="kin-wrap">
    <div class="seg wide kin-seg" role="group" aria-label="관계 묶음">
      ${groups.map(([label], i) => `<button type="button" class="${i ? "" : "on"}" data-kinbtn="${i}">${label}</button>`).join("")}
    </div>
    ${panes}
  </div>`;
}
function kinOpts() {
  const kinBooks = new Set(["gen", "exo", "lev", "num", "deu", "jos", "jdg", "rut", "1sa", "2sa", "1ki", "2ki", "1ch", "2ch", "ezr", "neh", "est", "job", "psa", "pro", "ecc", "sng", "isa", "jer", "lam", "ezk", "dan", "hos", "jol", "amo", "oba", "jnh", "mic", "nam", "hab", "zep", "hag", "zec", "mal"]);
  return { kin: typeof isAdmin === "function" && isAdmin() && kinBooks.has(summaryBook), all: !!state.settings.graphAll };
}
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("[data-kinbtn]");
  if (!b) return;
  const wrap = b.closest(".kin-wrap");
  wrap.querySelectorAll("[data-kinbtn]").forEach((x) => x.classList.toggle("on", x === b));
  wrap.querySelectorAll("[data-kinpane]").forEach((x) => { x.hidden = x.dataset.kinpane !== b.dataset.kinbtn; });
});

// ── 관계도 자세히 보기 (꾹 눌러서 여는 창) ──
// 이름 상자를 끌어 옮기고, 선이나 관계 이름을 누르면 두 사람 쪽으로 확대하며 그 관계가 생긴 구절 풀이를 보여 줌.
// 이름 상자를 누르면 그 사람의 관계를 모아 보여 줌. 빈 곳을 끌면 화면 이동, 두 손가락이나 휠로 확대·축소.
const RG_HOLD_MS = 1500;

// 관계도 자세히 보기용 배치: 위아래로만 길게 놓인 배치를 버리고, 화면 비율(ratio=가로/세로) 전체에 인물이 퍼지도록
// 끌어당김(관계가 있는 쌍)과 밀어냄(모든 쌍)으로 다시 놓은 뒤 겹친 상자를 떼어 놓음. 인물이 적으면 그대로 둠
function rgSpread(names, rels, pos, ratio) {
  const n = names.length;
  if (n < 6) return;
  const WW = Math.sqrt(n * 150 * 80 * 2.6 * ratio), HH = WW / ratio;
  const k = 0.9 * Math.sqrt(1 / n);
  const P = {};
  names.forEach((nm, i) => { const a = (i / n) * Math.PI * 2; P[nm] = { x: 0.5 + Math.cos(a) * 0.38, y: 0.5 + Math.sin(a) * 0.38 }; });
  const pairs = rels.map((r) => [r.from, r.to]);
  for (let it = 0; it < 320; it++) {
    const t = 0.08 * (1 - it / 320) + 0.002, D = {};
    names.forEach((nm) => { D[nm] = { x: 0, y: 0 }; });
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = P[names[i]], b = P[names[j]];
      let dx = a.x - b.x, dy = a.y - b.y; const d = Math.max(Math.hypot(dx, dy), 0.001), f = (k * k) / d;
      dx /= d; dy /= d;
      D[names[i]].x += dx * f; D[names[i]].y += dy * f; D[names[j]].x -= dx * f; D[names[j]].y -= dy * f;
    }
    pairs.forEach(([u, v]) => {
      const a = P[u], b = P[v]; let dx = a.x - b.x, dy = a.y - b.y; const d = Math.max(Math.hypot(dx, dy), 0.001), f = (d * d) / k * 0.7;
      dx /= d; dy /= d; D[u].x -= dx * f; D[u].y -= dy * f; D[v].x += dx * f; D[v].y += dy * f;
    });
    names.forEach((nm) => {
      const d = Math.max(Math.hypot(D[nm].x, D[nm].y), 0.0001), m = Math.min(d, t);
      P[nm].x = Math.min(0.97, Math.max(0.03, P[nm].x + (D[nm].x / d) * m + (0.5 - P[nm].x) * 0.004));
      P[nm].y = Math.min(0.97, Math.max(0.03, P[nm].y + (D[nm].y / d) * m + (0.5 - P[nm].y) * 0.004));
    });
  }
  names.forEach((nm) => { pos[nm].x = P[nm].x * WW; pos[nm].y = P[nm].y * HH; });
  for (let it = 0; it < 120; it++) for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const A = pos[names[i]], B = pos[names[j]];
    const ox = A.hw + B.hw + 10 - Math.abs(B.x - A.x), oy = A.hh + B.hh + 14 - Math.abs(B.y - A.y);
    if (ox <= 0 || oy <= 0) continue;
    if (oy < ox) { const s = (B.y >= A.y ? 1 : -1) * oy / 2; A.y -= s; B.y += s; }
    else { const s = (B.x >= A.x ? 1 : -1) * ox / 2; A.x -= s; B.x += s; }
  }
}

// 꾹 누르기 전 미리보기용: 화면 비율 전체에 퍼지게 놓은 뒤, 가로 targetW로 줄이고 겹침을 다시 뗌
function rgBounds(names, pos) {
  const xs = names.flatMap((nm) => [pos[nm].x - pos[nm].hw, pos[nm].x + pos[nm].hw]);
  const ys = names.flatMap((nm) => [pos[nm].y - pos[nm].hh, pos[nm].y + pos[nm].hh]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
function rgPreviewLayout(names, rels, pos, targetW) {
  rgSpread(names, rels, pos, 1.3);
  const b = rgBounds(names, pos), k = targetW / Math.max(1, b.x1 - b.x0);
  names.forEach((nm) => { pos[nm].x *= k; pos[nm].y *= k; });
  const n = names.length;
  for (let it = 0; it < 120; it++) for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const A = pos[names[i]], B = pos[names[j]];
    const ox = A.hw + B.hw + 10 - Math.abs(B.x - A.x), oy = A.hh + B.hh + 14 - Math.abs(B.y - A.y);
    if (ox <= 0 || oy <= 0) continue;
    if (oy < ox) { const s = (B.y >= A.y ? 1 : -1) * oy / 2; A.y -= s; B.y += s; }
    else { const s = (B.x >= A.x ? 1 : -1) * ox / 2; A.x -= s; B.x += s; }
  }
}

function rgOpen(id) {
  const m = rgModels[id];
  if (!m) return;
  const pos = JSON.parse(JSON.stringify(m.pos)); // 창에서 옮겨도 작은 관계도는 그대로
  const full = { x: -10, y: -6, w: m.VW + 20, h: m.VH + 12 };
  let view = { ...full }, sel = null, anim = 0;

  const el = document.createElement("div");
  el.className = "rg-modal";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "관계도 자세히 보기");
  el.innerHTML = `
    <div class="rg-sheet">
      <div class="rg-top">
        <b>관계도 자세히 보기</b>
        <span class="rg-zoom">
          <button type="button" data-z="out" aria-label="작게">−</button>
          <button type="button" data-z="fit" aria-label="전체 보기">전체</button>
          <button type="button" data-z="in" aria-label="크게">+</button>
        </span>
        <button type="button" class="rg-close" aria-label="닫기">✕</button>
      </div>
      <p class="rg-tip">이름을 끌어서 옮기고, 선이나 관계 이름을 누르면 두 사람 사이의 이야기가 나와요.</p>
      <div class="rg-find">
        <div class="rg-find-row">
          <input type="search" class="rg-q" placeholder="인물 이름 찾기" aria-label="인물 이름 찾기" autocomplete="off">
          <button type="button" class="rg-sort" aria-label="가나다 순서 바꾸기">가나다 ▲</button>
        </div>
        <div class="rg-chips" role="listbox" aria-label="인물 목록"></div>
      </div>
      <svg class="rg rg-live"></svg>
      <div class="rg-detail" aria-live="polite"></div>
    </div>`;
  document.body.appendChild(el);
  document.documentElement.classList.add("rg-open");
  const svg = el.querySelector("svg");
  const detail = el.querySelector(".rg-detail");
  { const b = svg.getBoundingClientRect(); rgSpread(m.names, m.rels, pos, b.width / Math.max(1, b.height)); }

  const setView = () => svg.setAttribute("viewBox", `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`);
  const draw = () => {
    svg.innerHTML = rgSvgInner(m.names, pos, rgEdgeGeom(m.rels, pos, 40), true);
    if (sel) {
      svg.classList.add("rg-dim");
      if (sel.edge != null) {
        const r = m.rels[sel.edge];
        svg.querySelectorAll(`[data-edge="${sel.edge}"]`).forEach((x) => x.classList.add("on"));
        [r.from, r.to].forEach((n) => { const g = svg.querySelector(`[data-node="${CSS.escape(n)}"]`); if (g) g.classList.add("on"); });
      } else {
        const g = svg.querySelector(`[data-node="${CSS.escape(sel.node)}"]`); if (g) g.classList.add("on");
        m.rels.forEach((r, i) => {
          if (r.from !== sel.node && r.to !== sel.node) return;
          svg.querySelectorAll(`[data-edge="${i}"]`).forEach((x) => x.classList.add("on"));
          const o = svg.querySelector(`[data-node="${CSS.escape(r.from === sel.node ? r.to : r.from)}"]`); if (o) o.classList.add("on");
        });
      }
    } else svg.classList.remove("rg-dim");
  };
  // 부드럽게 확대·이동
  const flyTo = (target) => {
    cancelAnimationFrame(anim);
    const from = { ...view }, t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 320), e = 1 - Math.pow(1 - t, 3);
      ["x", "y", "w", "h"].forEach((k) => { view[k] = from[k] + (target[k] - from[k]) * e; });
      setView();
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };
  // 상자들이 다 들어오는 화면(가로세로 비율은 창에 맞춤)
  const frame = (list, pad) => {
    const xs = list.flatMap((n) => [pos[n].x - pos[n].hw, pos[n].x + pos[n].hw]);
    const ys = list.flatMap((n) => [pos[n].y - pos[n].hh, pos[n].y + pos[n].hh]);
    let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
    const box = svg.getBoundingClientRect(), ratio = box.height / Math.max(1, box.width);
    let w = Math.max(x1 - x0, 230), h = Math.max(y1 - y0, w * ratio);
    w = Math.max(w, h / ratio);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  };
  const fitAll = () => frame(m.names, 24);

  const noteList = (r) => (r.notes || []).length
    ? `<ul class="rg-notes">${r.notes.map((n, k) => `<li>${n.src && n.src.verses
      ? `<button type="button" class="rg-src" data-src="${k}" aria-expanded="false">${esc(n.ref)} <span>원문 보기 (개역개정·쉬운성경) ▾</span></button>`
      : `<small>${esc(n.ref)}</small>`}<p>${esc(n.text)}</p><div class="rg-orig" hidden></div></li>`).join("")}</ul>`
    : `<p class="muted small">이 관계를 풀어 줄 구절 설명은 아직 준비 중이에요.</p>`;
  const relLine = (r) => `<b>${esc(r.from)}</b><span class="rg-arrow">${r.directed ? "→" : "↔"}</span><b>${esc(r.to)}</b>
    <em style="color:${REL_COLOR[r.kind] || REL_COLOR.other}">${esc(r.label)}</em><span class="rg-kind">${REL_NAME[r.kind] || ""}</span>`;
  const showEdge = (i) => {
    sel = { edge: i };
    const r = m.rels[i];
    // 같은 두 사람 사이의 다른 방향·다른 이름표 관계(쌍방)도 구분선을 두고 이어서 보여 줌
    const pair = m.rels.map((x, k) => ({ x, k })).filter(({ x, k }) => k === i || (x.from === r.from && x.to === r.to) || (x.from === r.to && x.to === r.from));
    detail.innerHTML = pair.map(({ x, k }) => `<section class="rg-dir ${k === i ? "cur" : ""}"><div class="rg-rel">${relLine(x)}</div>${noteList(x)}</section>`).join("");
    draw();
    flyTo(frame([r.from, r.to], 36));
  };
  let nodeAsc = true; // 한 인물의 관계 목록: 연결된 사람 가나다 오름(▲)·내림(▼)차순
  const showNode = (name, center, stay) => {
    sel = { node: name };
    const mine = m.rels.map((r, i) => ({ r, i })).filter(({ r }) => r.from === name || r.to === name);
    // 연결된 사람마다 한 묶음: 쌍방 관계(A→B, B→A)는 한 묶음 안에 구분선으로 나눠 보여 줌
    const groups = new Map();
    mine.forEach((x) => { const o = x.r.from === name ? x.r.to : x.r.from; if (!groups.has(o)) groups.set(o, []); groups.get(o).push(x); });
    const ordered = [...groups.entries()].sort((a, b) => (nodeAsc ? 1 : -1) * a[0].localeCompare(b[0], "ko"));
    detail.innerHTML = `<div class="rg-person"><b>${esc(name)}</b>${m.roles[name] ? `<span>${esc(m.roles[name])}</span>` : ""}
        ${groups.size > 1 ? `<button type="button" class="rg-nsort" data-nsort aria-label="연결된 사람 순서 바꾸기">연결된 사람 가나다 ${nodeAsc ? "▲" : "▼"}</button>` : ""}</div>
      <ul class="rg-rels">${ordered.map(([o, xs]) => `<li class="rg-grp${xs.length > 1 ? " two" : ""}">${xs.length > 1 ? `<small class="rg-grp-h">${esc(o)}와(과) 서로 이어진 관계 ${xs.length}개</small>` : ""}${xs.map(({ r, i }) => `<button type="button" data-pick="${i}">${relLine(r)}</button>`).join("")}</li>`).join("")}</ul>
      <p class="muted small">관계를 누르면 그 장면의 구절 풀이가 나와요.</p>`;
    draw();
    if (stay) return;
    const others = [...new Set(mine.flatMap(({ r }) => [r.from, r.to]))];
    flyTo(center ? frame([name], 60) : frame(others.length ? others : [name], 30)); // 찾기로 고르면 그 사람이 한가운데 크게
  };
  // 찾기: 가나다 오름·내림차순 목록 또는 입력으로 거른 목록에서 고르면 그 인물을 중심으로 확대
  const q = el.querySelector(".rg-q"), chips = el.querySelector(".rg-chips"), sortBtn = el.querySelector(".rg-sort");
  let asc = true;
  const matches = () => {
    const t = q.value.trim().replace(/\s+/g, "");
    return m.names.filter((n) => !t || n.replace(/\s+/g, "").includes(t)).sort((a, b) => (asc ? 1 : -1) * a.localeCompare(b, "ko"));
  };
  const drawChips = () => {
    const list = matches();
    chips.innerHTML = list.length ? list.map((n) => `<button type="button" role="option" data-find="${esc(n)}" class="${sel && sel.node === n ? "on" : ""}">${esc(n)}</button>`).join("") : `<span class="muted small">찾는 인물이 없어요</span>`;
  };
  const findPerson = (n) => { showNode(n, true); drawChips(); };
  q.addEventListener("input", drawChips);
  q.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); const l = matches(); if (l.length) findPerson(l[0]); } });
  sortBtn.addEventListener("click", () => { asc = !asc; sortBtn.textContent = `가나다 ${asc ? "▲" : "▼"}`; drawChips(); });
  const clearSel = () => {
    sel = null;
    detail.innerHTML = `<p class="muted small">선이나 관계 이름을 누르면 그 관계가 생긴 장면과 구절 풀이가 나와요. 이름을 누르면 그 사람의 관계를 모아 볼 수 있어요.</p>`;
    draw();
  };

  // 화면 좌표 → 관계도 좌표
  const toSvg = (cx, cy) => { const p = svg.createSVGPoint(); p.x = cx; p.y = cy; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const pointers = new Map();
  // 한 인물(또는 한 관계)에 집중해 본 상태에서 "움직일 수 있는" 인물: 본인과 직접 연결된 인물. 집중한 게 없으면 모두
  const rgActive = (n) => {
    if (!sel) return true;
    if (sel.edge != null) return m.rels[sel.edge].from === n || m.rels[sel.edge].to === n;
    return n === sel.node || m.rels.some((r) => (r.from === sel.node && r.to === n) || (r.to === sel.node && r.from === n));
  };
  let drag = null; // { node, dx, dy, moved } 또는 { pan, sx, sy, view } 또는 { pinch, d0, view, mid }
  svg.addEventListener("pointerdown", (e) => {
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* 캡처가 안 되는 환경이면 그냥 진행 */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      drag = { pinch: true, d0: Math.hypot(a.x - b.x, a.y - b.y), view: { ...view }, mid: toSvg((a.x + b.x) / 2, (a.y + b.y) / 2) };
      return;
    }
    const nodeEl = e.target.closest("[data-node]"), edgeEl = e.target.closest("[data-edge]");
    const p = toSvg(e.clientX, e.clientY);
    if (nodeEl) { const n = nodeEl.dataset.node; drag = { node: n, locked: !rgActive(n), dx: pos[n].x - p.x, dy: pos[n].y - p.y, sx: e.clientX, sy: e.clientY, moved: false }; }
    else drag = { pan: true, edge: edgeEl ? +edgeEl.dataset.edge : null, sx: e.clientX, sy: e.clientY, view: { ...view }, moved: false };
  });
  svg.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!drag) return;
    if (drag.pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const k = Math.min(4, Math.max(0.25, drag.d0 / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))));
      const v = drag.view;
      view = { w: v.w * k, h: v.h * k, x: drag.mid.x - (drag.mid.x - v.x) * k, y: drag.mid.y - (drag.mid.y - v.y) * k };
      setView();
      return;
    }
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) drag.moved = true;
    if (!drag.moved) return;
    if (drag.node && drag.locked) return; // 집중해 본 인물과 그 직접 연결 인물이 아니면 끌어도 안 움직임(누르면 그 인물로 이동)
    if (drag.node) {
      const p = toSvg(e.clientX, e.clientY);
      pos[drag.node].x = p.x + drag.dx; pos[drag.node].y = p.y + drag.dy;
      draw();
    } else if (drag.pan) {
      const box = svg.getBoundingClientRect(), s = drag.view.w / box.width;
      view.x = drag.view.x - (e.clientX - drag.sx) * s; view.y = drag.view.y - (e.clientY - drag.sy) * s;
      setView();
    }
  });
  const up = (e) => {
    pointers.delete(e.pointerId);
    if (!drag) return;
    if (drag.pinch) { if (!pointers.size) drag = null; return; }
    if (!drag.moved && e.type === "pointerup") {
      if (drag.node) showNode(drag.node);
      else if (drag.edge != null) showEdge(drag.edge);
      else if (sel) { clearSel(); flyTo(fitAll()); }
    }
    drag = null;
  };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", up);
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const k = e.deltaY > 0 ? 1.12 : 1 / 1.12, c = toSvg(e.clientX, e.clientY);
    view = { w: view.w * k, h: view.h * k, x: c.x - (c.x - view.x) * k, y: c.y - (c.y - view.y) * k };
    setView();
  }, { passive: false });

  const close = () => {
    cancelAnimationFrame(anim);
    document.removeEventListener("keydown", onKey);
    document.documentElement.classList.remove("rg-open");
    el.remove();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  el.addEventListener("click", (e) => {
    if (e.target === el || e.target.closest(".rg-close")) return close();
    const z = e.target.closest("[data-z]");
    if (z) {
      if (z.dataset.z === "fit") { sel = null; clearSel(); return flyTo(fitAll()); }
      const k = z.dataset.z === "in" ? 0.75 : 1 / 0.75, cx = view.x + view.w / 2, cy = view.y + view.h / 2;
      return flyTo({ w: view.w * k, h: view.h * k, x: cx - view.w * k / 2, y: cy - view.h * k / 2 });
    }
    if (e.target.closest("[data-nsort]") && sel && sel.node) { nodeAsc = !nodeAsc; return showNode(sel.node, false, true); }
    const find = e.target.closest("[data-find]");
    if (find) return findPerson(find.dataset.find);
    const pick = e.target.closest("[data-pick]");
    if (pick) return showEdge(+pick.dataset.pick);
    const src = e.target.closest("[data-src]");
    if (src && sel && sel.edge !== undefined) rgShowOrig(src, m.rels[sel.edge].notes[+src.dataset.src].src);
  });

  clearSel(); drawChips();
  view = fitAll(); setView();
  el.querySelector(".rg-close").focus();
}

// 구절 풀이의 장·절 버튼 → 그 절의 개역개정4판·쉬운성경 원문을 풀이 아래에 펼침 (다시 누르면 접힘)
async function rgShowOrig(btn, src) {
  const box = btn.parentElement.querySelector(".rg-orig");
  const open = btn.getAttribute("aria-expanded") === "true";
  btn.setAttribute("aria-expanded", String(!open));
  btn.querySelector("span").textContent = open ? "원문 보기 (개역개정·쉬운성경) ▾" : "원문 접기 ▴";
  box.hidden = open;
  if (open || box.dataset.done) return;
  box.innerHTML = `<p class="muted small">본문 불러오는 중…</p>`;
  const idx = CHAPTERS.findIndex((c) => c.book.code === src.book && c.chap === src.chap);
  const want = new Set();
  String(src.verses).split(/,s*/).forEach((p) => { const [a, b] = p.split("-").map(Number); for (let n = a; n <= (b || a); n++) want.add(n); });
  try {
    if (!PUSH_SERVER || idx < 0) throw new Error("no-server");
    const rows = await versePairs(idx, (n) => want.has(n), ["gae", "easy"]);
    if (!rows.length) throw new Error("empty");
    box.innerHTML = versePairsHtml(rows, ["개역개정4판", "쉬운성경"]);
    box.dataset.done = "1";
  } catch (e) {
    box.innerHTML = `<p class="muted small">원문을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.</p>`;
    btn.setAttribute("aria-expanded", "true");
  }
}

// 작은 관계도를 꾹 누르면(1.5초) 상세 창. 누르는 동안 테두리가 차오름. 손가락이 움직이면(스크롤) 취소
(function rgHoldSetup() {
  let hold = null;
  const cancel = () => {
    if (!hold) return;
    clearTimeout(hold.timer);
    hold.wrap.classList.remove("rg-pressing");
    hold = null;
  };
  document.addEventListener("pointerdown", (e) => {
    const wrap = e.target.closest && e.target.closest(".rg-wrap");
    if (!wrap || (e.button && e.button !== 0)) return;
    cancel();
    hold = { wrap, x: e.clientX, y: e.clientY, timer: setTimeout(() => { const id = wrap.dataset.rg; cancel(); rgOpen(id); }, RG_HOLD_MS) };
    wrap.classList.add("rg-pressing");
  });
  document.addEventListener("pointermove", (e) => { if (hold && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 10) cancel(); });
  ["pointerup", "pointercancel", "scroll"].forEach((t) => document.addEventListener(t, cancel, true));
  document.addEventListener("contextmenu", (e) => { if (e.target.closest && e.target.closest(".rg-wrap")) e.preventDefault(); });
  document.addEventListener("keydown", (e) => {
    const wrap = e.target.closest && e.target.closest(".rg-wrap");
    if (wrap && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); rgOpen(wrap.dataset.rg); }
  });
})();

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
  const opts = { all: !!state.settings.graphAll };
  const out = composeDay(chapters, books, opts);
  // 관계도는 장마다 따로도 그릴 수 있게: 장별 결과와, 지금 읽는 장이 이 분량의 몇 번째인지
  out.byChap = chapters.length > 1 ? chapters.map((c) => composeDay([c], books, opts)) : null;
  out.autoIdx = day.indexOf(currentChapter);
  return out;
}

// 관계도에 그릴 장: 장을 골랐으면 그 장, 골라 둔 게 없으면 지금 읽는 장(분량 안에 있을 때), "전체"면 분량 전체
function graphSource(s) {
  const pick = state.settings.graphChap;
  const idx = pick === "all" || pick == null ? -1 : typeof pick === "number" ? pick : s.autoIdx; // 처음엔 분량 전체
  if (!s.byChap || idx == null || idx < 0 || idx >= s.byChap.length) return s;
  return s.byChap[idx];
}
function chapChipsHtml(s) {
  if (!s.byChap) return "";
  const cur = graphSource(s) === s ? -1 : s.byChap.indexOf(graphSource(s));
  return `<div class="seg rg-chap" role="group" aria-label="관계도로 볼 장">
    <button type="button" data-gchap="all" class="${cur < 0 ? "on" : ""}">분량 전체</button>
    ${s.flow.map((f, i) => `<button type="button" data-gchap="${i}" class="${cur === i ? "on" : ""}">${esc(f.ref)}</button>`).join("")}
  </div>`;
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
    ${s.people.length ? `
    <section class="tool-card sum-card">
      <div class="rg-head">
        <h3 class="label">등장 인물 관계도</h3>
        <button type="button" class="read-switch rg-switch ${state.settings.graphAll ? "on" : ""}" data-gdetail="${state.settings.graphAll ? "main" : "all"}" role="switch" aria-checked="${!!state.settings.graphAll}">
          <span class="rs-label">${state.settings.graphAll ? "전체 인물" : "주요 인물"}</span>
          <span class="rs-track" aria-hidden="true"><span class="rs-knob"></span></span>
        </button>
      </div>
      ${chapChipsHtml(s)}
      ${(() => { const g = graphSource(s); return relationGraphHtml(g.graphPeople, g.rels, kinOpts()); })()}
    </section>` : ""}
    <section class="tool-card sum-card">
      <h3 class="label">주요 등장 인물</h3>
      ${s.people.length ? `${peopleBlockHtml(s.people)}`
        : `<p class="muted small">이번 분량에는 이야기 속 인물이 따로 나오지 않아요.</p>`}
    </section>

    ${places}
    ${songs}`;
}

// 주요 등장 인물: 중요도(비중 점수) 순으로 보여 주고, 찾기 칸으로 이름을 바로 걸러 냄
function peopleBlockHtml(people, labelOf) {
  const sorted = [...people].sort((a, b) => (b.score || 0) - (a.score || 0) || (a.order || 0) - (b.order || 0));
  return `<input type="search" class="sum-find" placeholder="인물 찾기" aria-label="인물 찾기" autocomplete="off">
    <ul class="sum-people">${sorted.map((p) => {
      const nm = labelOf ? labelOf(p) : (p.display || p.name);
      return `<li data-name="${esc(nm)}"><b>${esc(nm)}${p.where ? `<small>${esc(p.where)}</small>` : ""}</b>${p.role ? `<span>${esc(p.role)}</span>` : ""}</li>`;
    }).join("")}</ul>`;
}
// 찾기 칸에 적으면 이름이 들어간 인물만 남김
document.addEventListener("input", (e) => {
  if (!e.target.matches || !e.target.matches(".sum-find")) return;
  const q = e.target.value.trim().toLowerCase();
  e.target.closest(".tool-card").querySelectorAll(".sum-people li").forEach((li) => {
    li.hidden = !!q && !li.dataset.name.toLowerCase().includes(q);
  });
});

// 요약 탭 그리기 (reader.js의 renderReaderSheet에서 부름)
function renderSummaryTab(body, day) {
  summaryBook = day && day.length ? CHAPTERS[day[0]].book.code : "";
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
        ${peopleBlockHtml(data.people, (p) => p.name)}
      </section>
      <section class="tool-card sum-card">
        <h3 class="label">등장 인물 관계도</h3>
        ${relationGraphHtml(data.people, data.relations || [], kinOpts())}
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
