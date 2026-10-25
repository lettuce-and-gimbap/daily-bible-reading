// 요약 탭의 인물 관계도 SVG, 상세 보기, 가족/관계 설명 렌더링
// ── 인물 관계도 (SVG) ──
const REL_COLOR = { family: "var(--accent)", ally: "#3b82c4", conflict: "var(--warn)", other: "var(--muted)", rename: "#c48a1e" };
let summaryBook = ""; // 지금 보는 요약의 권 코드
const REL_NAME = { family: "가족", ally: "동역·도움", conflict: "대립", other: "기타", rename: "이름이 바뀜" };

// 이름 상자 크기 (13px 굵은 글씨 기준)
const rgBoxCache=new WeakMap();
const rgBox = (name, rels=[]) => {
  let cache=rgBoxCache.get(rels);if(!cache){cache=new Map();const neighbors=new Map();for(const r of rels)for(const [a,b]of [[r.from,r.to],[r.to,r.from]]){if(!neighbors.has(a))neighbors.set(a,new Set());neighbors.get(a).add(b);}for(const [n,peers]of neighbors){const boost=Math.min(12,peers.size*2);cache.set(n,{hw:Math.max(26,(n.length*13+16)/2)+boost,hh:14+Math.min(6,peers.size*1.5)});}rgBoxCache.set(rels,cache);}
  return cache.get(name)||{hw:Math.max(26,(name.length*13+16)/2),hh:14};
};
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
      const want = rgBox(s.a,rels).hw + rgBox(s.b,rels).hw + s.label * 0.9 + 44;
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
      const A = pos[names[i]], B = pos[names[j]], a = rgBox(names[i],rels), b = rgBox(names[j],rels);
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
  const neighbors = new Map(names.map((name) => [name, new Set()]));
  edges.forEach(({ r }) => { neighbors.get(r.from)?.add(r.to); neighbors.get(r.to)?.add(r.from); });
  const degrees = new Map([...neighbors].map(([name, set]) => [name, set.size]));
  const maxDegree = Math.max(0, ...degrees.values());
  const hubThreshold = maxDegree>=2&&[...degrees.values()].some(d=>d<maxDegree)?maxDegree:Infinity;
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
    const degree = degrees.get(name) || 0;
    const hub = degree >= hubThreshold;
    return `<g class="rg-node${hub ? " hub" : ""}" ${live ? `data-node="${esc(name)}"` : ""}><title>${esc(name)} · 연결 인물 ${degree}명</title><rect x="${(p.x - p.hw).toFixed(1)}" y="${(p.y - p.hh).toFixed(1)}" width="${(p.hw * 2).toFixed(1)}" height="${p.hh * 2}" rx="10"/>
      <text x="${p.x.toFixed(1)}" y="${(p.y + 5).toFixed(1)}" text-anchor="middle">${esc(name)}</text></g>`;
  }).join("");
  const markers = Object.keys(REL_COLOR).map((k) => `<marker id="rg-arrow-${k}${live ? "-live" : ""}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${REL_COLOR[k]}"/></marker>`).join("");
  const body = `<defs>${markers}</defs>${lines}${nodes}${labels}`;
  return live ? body.replace(/url\(#rg-arrow-(\w+)\)/g, "url(#rg-arrow-$1-live)") : body;
}

// 화면에 그린 관계도 정보. 꾹 누르면 이걸로 상세 창을 다시 그림
const rgModels = {};
let rgSeq = 0;

function relationGraphCore(people, relations, opts = {}) {
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
      const xs = g.map((x) => [p[x].x - rgBox(x,rels).hw, p[x].x + rgBox(x,rels).hw]).flat();
      return [Math.min(...xs), Math.max(...xs)];
    };
    // 폭이 넘치면 가로 간격만 줄이고, 그 때문에 겹친 상자는 세로로 떼어 놓음
    let [x0, x1] = span();
    if (x1 - x0 > MAXW) {
      const cx = (x0 + x1) / 2, maxHw = Math.max(...g.map((x) => rgBox(x,rels).hw));
      const k = (MAXW - maxHw * 2) / Math.max(1, (x1 - x0) - maxHw * 2);
      g.forEach((x) => { p[x].x = cx + (p[x].x - cx) * k; });
      for (let it = 0; it < 80; it++) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
        const A = p[g[i]], B = p[g[j]], a = rgBox(g[i],rels), b = rgBox(g[j],rels);
        const ox = a.hw + b.hw + 8 - Math.abs(B.x - A.x), oy = a.hh + b.hh + 12 - Math.abs(B.y - A.y);
        if (ox > 0 && oy > 0) { const s = (B.y >= A.y ? 1 : -1) * oy / 2; A.y -= s; B.y += s; }
      }
      [x0, x1] = span();
    }
    const ys = g.map((x) => [p[x].y - rgBox(x,rels).hh, p[x].y + rgBox(x,rels).hh]).flat();
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
      g.forEach((n) => { pos[n] = { x: p[n].x - x0 + x, y: p[n].y - y0 + y + dy, ...rgBox(n,rels) }; });
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
  rgModels[id] = { names, rels, pos, roles: Object.fromEntries(people.map((p) => [p.name, p.role || ""])), people, familyDetail: !!opts.familyDetail, VW, VH };
  Object.keys(rgModels).slice(0, -20).forEach((k) => delete rgModels[k]); // 오래된 것은 버림
  const kinds = [...new Set(rels.map((r) => r.kind))].filter((k) => REL_COLOR[k]);
  return `
    <button type="button" class="btn ghost small" data-rg-pdf="${id}">관계도 · 설명 PDF 다운로드</button>
    <p class="rg-hint">연결된 인물이 많을수록 이름 상자가 커져요. 꾹 눌러 자세히 볼 수 있어요.</p>
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
  if (!opts.kin) return relationGraphCore(people, visibleRelations, opts);
  const groups = opts.all ? KIN_GROUPS_ALL : KIN_GROUPS_MAIN;
  const panes = groups.map(([label, keep], i) => {
    const selected = relations.filter(keep);
    return `<div class="kin-pane" data-kinpane="${i}"${i ? " hidden" : ""}>${selected.length ? relationGraphCore(people, selected, opts) : `<p class="muted small kin-empty">이 분량에는 ‘${esc(label)}’ 관계가 없어요.</p>`}</div>`;
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
  const admin = typeof isAdmin === "function" && isAdmin();
  const kin = admin && kinBooks.has(summaryBook);
  // 혈연 설명과 가까운 관계 팝업은 모든 권에서 공통으로 보여 준다.
  // 관계 데이터에 family 관계가 있을 때만 실제 내용이 생기므로, 신약에도 같은 UI를 적용할 수 있다.
  return { kin, all: !!state.settings.graphAll, familyDetail: true };
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
      : `<small>${esc(n.ref)}</small>`}<p>${summaryMarkdown(n.text)}</p><div class="rg-orig" hidden></div></li>`).join("")}</ul>`
    : `<p class="muted small">이 관계를 풀어 줄 구절 설명은 아직 준비 중이에요.</p>`;
  const relLine = (r) => `<b>${esc(r.from)}</b><span class="rg-arrow">${r.directed ? "→" : "↔"}</span><b>${esc(r.to)}</b>
    <em style="color:${REL_COLOR[r.kind] || REL_COLOR.other}">${esc(r.label)}</em><span class="rg-kind">${REL_NAME[r.kind] || ""}</span>`;
  const familyLinksHtml = (name) => {
    if (!m.familyDetail) return "";
    const direct = m.rels.map((r, i) => ({ r, i })).filter(({ r }) => r.kind === "family" && (r.from === name || r.to === name));
    if (!direct.length) return "";
    const parentOf = (r) => r.from === name && /^(?:맏|첫|첫째|둘째|셋째|넷째|막내|아들|딸|자녀)/.test(r.label || "");
    const parents = direct.filter(({ r }) => parentOf(r)).map(({ r }) => {
      const other = r.to;
      const mother = /어머니|모친|엄마/.test(r.note || "") || /학깃|밧세바|아비가일|아히노암|마아가/.test(other);
      return `${other}(${mother ? "모" : "부"})`;
    });
    const childWord = direct.find(({ r }) => parentOf(r))?.r.label || "자녀";
    const summary = parents.length > 1 ? `<p class="rg-family-summary">${parents.join("과 ")}의 ${esc(childWord)}이에요.</p>` : "";
    return `<section class="rg-family"><b>혈연 관계</b>${summary}<div class="rg-family-links">${direct.map(({ r, i }) => {
      const other = r.from === name ? r.to : r.from;
      return `<button type="button" data-family-node="${esc(other)}" data-family-edge="${i}">${esc(other)} <span>${esc(r.label || "가족")}</span></button>`;
    }).join("")}</div><small>이름을 누르면 가까운 혈연 관계를 간단히 볼 수 있어요.</small></section>`;
  };
  const familyMini = (name) => {
    const family = m.rels.filter((r) => r.kind === "family");
    const links = new Map([[name, 0]]), queue = [name];
    while (queue.length) {
      const cur = queue.shift(), depth = links.get(cur);
      if (depth >= 2) continue;
      family.forEach((r) => {
        if (r.from !== cur && r.to !== cur) return;
        const other = r.from === cur ? r.to : r.from;
        if (!links.has(other)) { links.set(other, depth + 1); queue.push(other); }
      });
    }
    const edges = family.filter((r) => links.has(r.from) && links.has(r.to) && Math.max(links.get(r.from), links.get(r.to)) <= 2);
    const people = [...links.keys()].filter((n) => n !== name).slice(0, 5);
    const bioRel = family.find((r) => r.from === name || r.to === name);
    const bioText = [m.roles[name], bioRel && bioRel.note].filter(Boolean).join(" ").replace(/\s+/g, " ");
    const bio = bioText ? `<p>${esc(bioText.length > 150 ? `${bioText.slice(0, 147)}…` : bioText)}</p>` : "";
    return `<div class="rg-mini-pop" role="dialog" aria-label="${esc(name)}의 가까운 혈연 관계"><button type="button" class="rg-mini-close" data-family-close aria-label="닫기">✕</button><b>${esc(name)}의 가까운 혈연 관계</b>${bio}<div class="rg-mini-graph"><span class="rg-mini-node focus">${esc(name)}</span>${edges.slice(0, 8).map((r) => `<span class="rg-mini-edge"><i>${esc(r.from)}</i><em>${esc(r.label || "가족")}</em><i>${esc(r.to)}</i></span>`).join("")}</div>${people.length ? `<small>연결 인물: ${people.map((n) => esc(n)).join(", ")}</small>` : ""}</div>`;
  };
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
    detail.innerHTML = `<div class="rg-person"><b>${esc(name)}</b>${m.roles[name] ? `<span>${summaryMarkdown(m.roles[name])}</span>` : ""}
        ${groups.size > 1 ? `<button type="button" class="rg-nsort" data-nsort aria-label="연결된 사람 순서 바꾸기">연결된 사람 가나다 ${nodeAsc ? "▲" : "▼"}</button>` : ""}</div>
      ${familyLinksHtml(name)}
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
    const familyNode = e.target.closest("[data-family-node]");
    if (familyNode && m.familyDetail) {
      const detailBox = e.target.closest(".rg-detail");
      detailBox.querySelector(".rg-mini-pop")?.remove();
      const familyBox = detailBox.querySelector(".rg-family");
      if (familyBox) familyBox.insertAdjacentHTML("afterend", familyMini(familyNode.dataset.familyNode));
      return;
    }
    if (e.target.closest("[data-family-close]")) return e.target.closest(".rg-mini-pop").remove();
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

