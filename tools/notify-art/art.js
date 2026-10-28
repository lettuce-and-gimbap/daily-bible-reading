// 리마인드 알림 그림(720×360) — 힘이 빠졌지만 작게 웃는 픽셀 양의 SVG를 만든다.
// 무거운 눈꺼풀, 아래로 향한 시선, 비대칭의 작은 미소와 축 처진 몸짓으로 체념 섞인 다정함을 표현한다.
// build.mjs가 이 파일을 헤드리스 크롬 페이지에 넣어 JPG로 굽는다. (브라우저에서 돌아가는 코드)

const C = {
  ol: "rgba(70,50,60,0.28)", ink: "#3A3036", limb: "#DDAA7B", limbLt: "#F4D3AC", tip: "#A06F48",
  blush: "#F7A1A8", white: "#FFFFFF", tear: "#7CC4F7", sweat: "#9AD6FF", book: "#8A5A3C", gold: "#F2C14E",
};
const OW = 2; // 소품 테두리 (아주 옅게)

// ---------- 기본 부품 ----------
const f = (n) => Math.round(n * 10) / 10;
const circle = (x, y, r, fill, extra = "") => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const ell = (x, y, rx, ry, fill, extra = "") => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const line = (d, color, w, extra = "") => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const g = (tf, inner) => `<g transform="${tf}">${inner}</g>`;
const px = (x, y, w, h, fill, extra = "") => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" shape-rendering="crispEdges" ${extra}/>`;

// 그림자 필터 (renderCard가 <defs>에 넣음)
const SHEEP_DEFS =
  `<filter id="soft" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#3A2A40" flood-opacity="0.18"/></filter>`;

// 몽글몽글 구름 모양 외곽선 (타원 둘레에 n개 볼록)
function puff(rx, ry, n = 11, bump = 0.16, phase = 0.3) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + phase;
    pts.push([Math.cos(a) * rx, Math.sin(a) * ry]);
  }
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    d += ` Q${f(mx * (1 + bump * 1.9))},${f(my * (1 + bump * 1.9))} ${f(x2)},${f(y2)}`;
  }
  return d + "Z";
}

// 표정: 짧은 곡선 눈 모양 + 덧붙이는 것들: blush, sweat, tears, tint, glow, bubble, pout
function faceMarks(spec) {
  const [eyes, ...extra] = spec.split(",");
  const has = (k) => extra.includes(k);
  let s = "";
  if (has("tint")) s += ell(0, -12, 30, 12, "#8FA2F0", 'opacity="0.45"') + line("M-12,-22 L-12,-14 M0,-24 L0,-16 M12,-22 L12,-14", "#6275D0", 1.8, 'opacity="0.7"');
  if (has("glow")) s += ell(0, 14, 26, 14, "#BFEFFF", 'opacity="0.3"');
  // 눈동자·흰자·점 없이 이모티콘처럼 짧은 곡선 두 개만 쓴다.
  // 감정 차이는 곡선의 방향과 얼굴 기울기로 표현한다.
  const eyesByMood = {
    side: ["M-17,1 Q-10,-5 -3,1", "M5,0 Q11,-4 17,0"],
    roll: ["M-17,2 Q-10,-4 -3,1", "M4,1 Q10,-5 17,2"],
    squint: ["M-17,1 Q-10,-2 -3,1", "M3,1 Q10,-2 17,1"],
    down: ["M-17,-1 Q-10,5 -3,0", "M3,0 Q10,5 17,-1"],
    sad: ["M-17,2 Q-10,-5 -3,1", "M3,1 Q10,-5 17,2"],
    closed: ["M-17,0 Q-10,6 -3,0", "M3,0 Q10,6 17,0"],
    "^^": ["M-17,1 Q-10,-6 -3,1", "M3,1 Q10,-6 17,1"],
    vv: ["M-17,-1 Q-10,6 -3,-1", "M3,-1 Q10,6 17,-1"],
  };
  const eyeCurves = eyesByMood[eyes] || eyesByMood["^^"];
  const eyeWidth = eyes === "squint" ? 3.5 : 2.8;
  s += line(eyeCurves[0], "#594A43", eyeWidth) + line(eyeCurves[1], "#594A43", eyeWidth);
  if (has("blush")) s += ell(-19, 7, 6, 3.2, C.blush, 'opacity="0.6"') + ell(19, 7, 6, 3.2, C.blush, 'opacity="0.6"');
  // 입은 물결·지그재그 대신 짧은 선이나 작은 한 번의 미소 곡선으로 그린다.
  if (has("pout")) s += line("M-5,14 L0,12 L5,14", "#594A43", 2.8);
  else if (has("smirk")) s += line("M-4,14 L5,11", "#594A43", 2.8);
  else if (has("tremble")) s += line("M-5,13 L5,13", "#594A43", 2.6);
  else if (has("open") || has("o")) s += ell(0, 13, 3.5, 4.5, "#80566A");
  else if (has("flat")) s += line("M-7,13 L7,13", "#594A43", 3);
  else s += line("M-4,12 Q0,16 4,12", "#594A43", 2.8);
  if (has("tears")) s += line("M-10,4 Q-12,16 -10,26", C.tear, 4, 'opacity="0.85"') + line("M10,4 Q12,16 10,26", C.tear, 4, 'opacity="0.85"');
  if (has("sweat")) s += sweatDrop(28, -22, 0.7);
  // 표정 효과 중 'anger' 표시는 불필요하게 화난 인상을 주므로 양 그림에는 적용하지 않는다.
  if (has("bubble")) s += circle(8, 14, 6, "#DDF2FF", 'stroke="#9CCDEE" stroke-width="1.2" opacity="0.9"');
  return s;
}

// 얼굴 한 덩어리: 귀 + 베이지 얼굴 + 이마 털 + 표정 (얼굴 가운데 = 0,0)
function face(x, y, { rot = 0, s = 1, expr = "^^" } = {}) {
  const widths = [24, 38, 48, 52, 48, 38, 24], shades = ["#D8AE8B", "#E8C7A7", "#E8C7A7", "#E8C7A7", "#E8C7A7", "#DDB997", "#D8AE8B"];
  const head = widths.map((w, i) => px(-w / 2, -18 + i * 6, w, 6, shades[i])).join("");
  const woolFringe = px(-18, -23, 12, 6, "#F1EEF4") + px(-6, -26, 12, 9, "#F1EEF4") + px(6, -23, 12, 6, "#F1EEF4");
  const ears = px(-34, -3, 8, 8, "#D8AE8B") + px(-31, 0, 8, 5, "#E8C7A7") +
    px(26, -3, 8, 8, "#D8AE8B") + px(23, 0, 8, 5, "#E8C7A7");
  return g(`translate(${x},${y}) rotate(${rot}) scale(${s})`, ears + head + woolFringe + faceMarks(expr));
}

// 양 한 마리(팔다리 뺀 몸): 털 뭉치 + 얼굴. rx/ry로 서 있는 공 모양 ↔ 엎드린 납작 모양
function sheep({ rx = 60, ry = 56, fx = 0, fy = -14, frot = 0, expr = "^^", flip = false } = {}) {
  const cell = 8;
  let wool = "";
  for (let y = -ry; y < ry; y += cell) for (let x = -rx; x < rx; x += cell) {
    const nx = (x + cell / 2) / rx, ny = (y + cell / 2) / ry, d = nx * nx + ny * ny;
    const edgeNoise = ((Math.floor((x + rx) / cell) * 7 + Math.floor((y + ry) / cell) * 11) % 5) * 0.025;
    if (d > 1 + edgeNoise) continue;
    const shade = ny > 0.48 ? "#D8D5DF" : ny > 0.05 ? "#E6E3EB" : "#F1EEF4";
    const fleck = (Math.floor((x + rx) / cell) * 3 + Math.floor((y + ry) / cell) * 5) % 11 === 0;
    wool += px(x, y, cell, cell, fleck && ny < 0.35 ? "#FFFFFF" : shade);
  }
  if (flip) wool = g("rotate(180)", wool);
  return wool + face(fx, fy, { rot: frot + 2, expr });
}

// 막대 팔다리: 점 2~3개(가운데는 굽는 곳), 끝 6px은 진한 발굽
function limb(pts, { w = 10, tip = true } = {}) {
  const [a, b, c] = pts;
  const end = c || b, start = a, count = Math.max(2, Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1]) / 7));
  let out = "";
  for (let i = 0; i <= count; i++) {
    const t = i / count, u = 1 - t;
    const x = c ? u * u * a[0] + 2 * u * t * b[0] + t * t * c[0] : a[0] + t * (b[0] - a[0]);
    const y = c ? u * u * a[1] + 2 * u * t * b[1] + t * t * c[1] : a[1] + t * (b[1] - a[1]);
    const size = Math.max(6, w * 0.72), hoof = tip && i >= count - 1;
    out += px(x - size / 2, y - size / 2, size, size, hoof ? C.tip : C.limb);
    if (!hoof && i % 3 === 0) out += px(x - size * 0.22, y - size * 0.32, size * 0.38, size * 0.28, C.limbLt, 'opacity="0.72"');
  }
  return out;
}
function hoofAt(x, y, r = 7) { return circle(x, y, r, C.tip) + circle(x - r * 0.3, y - r * 0.35, r * 0.35, "#fff", 'opacity="0.3"'); }
function bigHoof(x, y, r = 15) { return circle(x, y, r, C.tip); }

// ---------- 효과 ----------
function sweatDrop(x, y, s = 1) {
  return g(`translate(${x},${y}) scale(${s})`,
    `<path d="M0,-12 Q9,2 6,8 Q0,14 -6,8 Q-9,2 0,-12Z" fill="${C.sweat}" stroke="${C.ol}" stroke-width="2.5"/>` + ell(-2, 4, 2, 3, "#fff", 'opacity="0.7"'));
}
function anger(x, y, s = 1) {
  const arm = (r) => g(`rotate(${r})`, line("M4,-14 Q4,-4 14,-4", "#E5484D", 5));
  return g(`translate(${x},${y}) scale(${s})`, arm(0) + arm(90) + arm(180) + arm(270));
}
function sparkle(x, y, s = 1, color = "#FFF4B8") {
  return g(`translate(${x},${y}) scale(${s})`, `<path d="M0,-14 Q2,-2 14,0 Q2,2 0,14 Q-2,2 -14,0 Q-2,-2 0,-14Z" fill="${color}"/>`);
}
function zzz(x, y) {
  const t = (dx, dy, sz, o) => `<text x="${x + dx}" y="${y + dy}" font-size="${sz}" font-weight="700" fill="#8C80B0" stroke="#fff" stroke-width="3" paint-order="stroke" opacity="${o}" font-family="Noto Sans KR, Malgun Gothic, sans-serif">Z</text>`;
  return t(0, 0, 26, 1) + t(24, -26, 34, 0.95) + t(52, -58, 44, 0.9);
}
function motionLines(x, y, n = 3, len = 40, gap = 16, color = "#fff") {
  let s = "";
  for (let i = 0; i < n; i++) s += line(`M${x},${y + i * gap} L${x - len + i * 8},${y + i * gap}`, color, 5, 'opacity="0.85"');
  return s;
}
function tapMarks(x, y) {
  return line(`M${x - 18},${y - 6} Q${x - 24},${y + 4} ${x - 18},${y + 14}`, "#fff", 4) +
    line(`M${x + 18},${y - 6} Q${x + 24},${y + 4} ${x + 18},${y + 14}`, "#fff", 4);
}
function shadow(x, y, rx = 70, ry = 10) { return ell(x, y, rx, ry, "#000", 'opacity="0.13"'); }

// ---------- 소품 ----------
function bible(x, y, w = 70, h = 90, rot = 0, open = false) {
  if (open) {
    const half = (side) => `<path d="M0,0 Q${side * w * 0.25},-10 ${side * w * 0.5},-4 L${side * w * 0.5},${h * 0.55} Q${side * w * 0.25},${h * 0.5} 0,${h * 0.6}Z" fill="#FFFDF5" stroke="${C.ol}" stroke-width="3.5"/>` +
      line(`M${side * 8},10 L${side * w * 0.4},8 M${side * 8},20 L${side * w * 0.4},18 M${side * 8},30 L${side * w * 0.4},28`, "#B8AFA0", 2.5);
    return g(`translate(${x},${y}) rotate(${rot})`,
      `<path d="M${-w * 0.55},-2 L${w * 0.55},-2 L${w * 0.55},${h * 0.62} L${-w * 0.55},${h * 0.62}Z" fill="${C.book}" stroke="${C.ol}" stroke-width="3.5"/>` + half(-1) + half(1));
  }
  return g(`translate(${x},${y}) rotate(${rot})`,
    `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" fill="${C.book}" stroke="${C.ol}" stroke-width="${OW}"/>` +
    `<rect x="${w / 2 - 9}" y="${-h / 2 + 5}" width="5" height="${h - 10}" fill="#FFF6DD"/>` +
    line(`M${-4},${-h * 0.25} L${-4},${h * 0.18} M${-4 - w * 0.17},${-h * 0.1} L${-4 + w * 0.17},${-h * 0.1}`, C.gold, 5) +
    `<path d="M${w * 0.1},${h / 2} l0,16 l6,-5 l6,5 l0,-16" fill="#D8433F" stroke="${C.ol}" stroke-width="2.5"/>`);
}
function cup(x, y, s = 1, rot = 0) {
  return g(`translate(${x},${y}) rotate(${rot}) scale(${s})`,
    `<path d="M-16,-14 L16,-14 L13,12 Q0,18 -13,12Z" fill="#fff" stroke="${C.ol}" stroke-width="3.5"/>` +
    `<path d="M16,-8 Q27,-6 24,4 Q22,10 14,8" fill="none" stroke="${C.ol}" stroke-width="3.5"/>` +
    ell(0, -14, 16, 4, "#8A5A3C", `stroke="${C.ol}" stroke-width="2.5"`) +
    line("M-6,-24 Q-11,-32 -6,-40 Q-1,-48 -6,-56 M6,-26 Q1,-34 6,-42", "#fff", 3, 'opacity="0.8"'));
}
function phone(x, y, rot = 0) {
  return g(`translate(${x},${y}) rotate(${rot})`,
    `<rect x="-17" y="-28" width="34" height="56" rx="7" fill="#2B2230" stroke="${C.ol}" stroke-width="3"/>` +
    `<rect x="-13" y="-23" width="26" height="44" rx="3" fill="#9FE3FF"/>` +
    `<path d="M-4,-8 L6,-1 L-4,6Z" fill="#FF4D6D"/>`);
}
function lamp(x, y, flame = "tiny") {
  const fl = flame === "tiny"
    ? `<path d="M22,-12 Q26,-22 22,-30 Q18,-22 22,-12Z" fill="#FFB347" stroke="${C.ol}" stroke-width="2"/>` +
      line("M22,-36 Q16,-46 22,-56 Q28,-66 20,-76", "#BBB", 3, 'opacity="0.8"')
    : `<path d="M22,-10 Q36,-34 22,-56 Q8,-34 22,-10Z" fill="#FFB347" stroke="${C.ol}" stroke-width="2.5"/>`;
  return g(`translate(${x},${y})`,
    fl + `<path d="M-30,-4 Q-26,14 0,16 Q26,14 30,-8 L22,-10 Q20,-2 0,-2 Q-20,-2 -24,-8Z" fill="#C8763A" stroke="${C.ol}" stroke-width="3.5"/>` +
    `<path d="M-30,-4 Q-44,-8 -40,4 Q-36,12 -26,8" fill="none" stroke="${C.ol}" stroke-width="3.5"/>`);
}
function megaphone(x, y, rot = 0) {
  return g(`translate(${x},${y}) rotate(${rot})`,
    `<path d="M0,-12 L70,-38 L70,38 L0,12Z" fill="#FF6B5B" stroke="${C.ol}" stroke-width="${OW}" stroke-linejoin="round"/>` +
    ell(70, 0, 10, 38, "#FFD2C9", `stroke="${C.ol}" stroke-width="${OW}"`) +
    `<rect x="-14" y="-12" width="16" height="24" rx="4" fill="#fff" stroke="${C.ol}" stroke-width="3.5"/>` +
    line("M92,-40 Q104,-48 110,-60 M96,0 L122,0 M92,40 Q104,48 110,60", "#fff", 5));
}
function signBoard(text, x, y, w = 190, h = 92) {
  const lines = String(text).split("\n");
  const fs = lines.length > 1 ? 27 : 32;
  const txt = lines.map((l, i) => `<text x="0" y="${(i - (lines.length - 1) / 2) * fs * 1.15 + fs * 0.36}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${C.ink}" font-family="Noto Sans KR, Malgun Gothic, sans-serif">${esc(l)}</text>`).join("");
  return g(`translate(${x},${y}) rotate(-3)`,
    `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#FFF8E6" stroke="${C.ol}" stroke-width="${OW}"/>` +
    `<rect x="${-w / 2 + 7}" y="${-h / 2 + 7}" width="${w - 14}" height="${h - 14}" rx="4" fill="none" stroke="#E8C98A" stroke-width="2.5" stroke-dasharray="6 5"/>` + txt);
}
function blanket() {
  return `<path d="M-86,96 Q-96,44 -70,38 Q-40,30 -10,26 Q60,-30 130,4 Q180,34 170,96Z" fill="#8FB8F2" stroke="${C.ol}" stroke-width="${OW}"/>` +
    line("M-60,90 L-30,40 M0,92 L40,10 M60,94 L100,10 M120,94 L150,30", "#B6D1F8", 6) +
    line("M-80,66 L160,56", "#B6D1F8", 6, 'opacity="0.7"');
}

// ---------- 포즈 ----------
// 서 있는 양: 털 뭉치 가운데 (0,0) rx60 ry56, 얼굴 (0,-14), 팔 뿌리 (±52,4), 다리 뿌리 (±22,50), 발 y≈88
const legs = () => limb([[-22, 48], [-24, 88]]) + limb([[22, 48], [24, 88]]);
const hang = (side) => limb([[side * 52, 4], [side * 64, 22], [side * 64, 40]]);
const hip = (side) => limb([[side * 52, 4], [side * 84, 22], [side * 54, 30]]);

const POSES = {
  shush: () => shadow(0, 92) + legs() + hang(-1) + sheep({ expr: "vv,none" }) + limb([[52, 4], [44, 26], [6, -4]]),
  // 헉 😱 (눈은 여전히 ^^)
  shock: () => shadow(0, 92) + limb([[-22, 48], [-8, 70], [-26, 88]]) + limb([[22, 48], [8, 70], [26, 88]]) +
    sheep({ expr: "^^,o,tint,sweat" }) + limb([[-52, 4], [-78, -18], [-33, -14]]) + limb([[52, 4], [78, -18], [33, -14]]) +
    line("M-84,-10 Q-90,6 -84,22 M-94,-6 Q-100,8 -94,24", "#fff", 3) + line("M84,-10 Q90,6 84,22 M94,-6 Q100,8 94,24", "#fff", 3),
  // 다리 꼬고 앉아 찻잔
  crosslegs: () => shadow(0, 104, 70) + stool(0, 66) + limb([[-20, 48], [-30, 70], [-30, 100]]) + hang(-1) +
    sheep({ expr: "vv,blush", frot: -6 }) + limb([[20, 48], [-6, 60], [-50, 56]]) +
    limb([[52, 4], [74, -4], [62, -24]]) + cup(64, -36, 0.8, 4),
  // 엎드려 머리 괴고 빤히
  lounge: () => shadow(0, 70, 120, 9) + limb([[64, 52], [112, 64]]) +
    sheep({ rx: 92, ry: 42, fx: -62, fy: -10, frot: -14, expr: "vv" }) + limb([[50, 36], [92, -14], [112, 60]]) +
    limb([[-40, 50], [-84, 64], [-92, 6]]) + tapMarks(114, 62),
  // 너. 👉
  point: () => shadow(0, 92) + legs() + hip(-1) + sheep({ expr: "^^,anger" }) + limb([[52, 4], [60, 0]], { tip: false, w: 11 }) + bigHoof(66, -2),
  // 팔짱 끼고 발 까딱
  armscross: () => shadow(0, 92) + limb([[-22, 48], [-24, 88]]) + limb([[22, 48], [42, 84]]) + sheep({ expr: "vv" }) +
    limb([[-52, 4], [-14, 40], [34, 16]]) + limb([[52, 4], [12, 44], [-34, 20]]) + tapMarks(44, 88),
  // 무릎 꿇고 기도
  pray: () => shadow(0, 80, 70) + limb([[-22, 48], [-34, 66]]) + limb([[22, 48], [34, 66]]) + sheep({ expr: "vv,blush" }) +
    limb([[-52, 4], [-34, 30], [-3, 14]]) + limb([[52, 4], [34, 30], [3, 14]]) +
    sparkle(-86, -60, 0.9) + sparkle(84, -52, 0.6) + sparkle(-100, 10, 0.5),
  // 주저앉아 성경 펴 놓고 꾸벅
  sleep: () => shadow(0, 92, 90) + g("rotate(10)", limb([[-22, 48], [-44, 80]]) + limb([[22, 48], [44, 80]]) +
    sheep({ expr: "vv,none,bubble", frot: 14 }) + bible(0, 50, 86, 56, -6, true) +
    limb([[-52, 4], [-58, 30], [-38, 54]]) + limb([[52, 4], [58, 30], [38, 54]])) + zzz(-120, -30),
  // 헐레벌떡 (성경 들고)
  run: () => shadow(0, 94, 70) + motionLines(150, -30, 3, 50, 20) + dust(90, 90) + dust(116, 82, 0.7) +
    g("rotate(-10)", limb([[-22, 48], [-54, 66], [-64, 60]]) + limb([[22, 48], [42, 70], [58, 90]]) +
      limb([[-52, 4], [-72, -8], [-86, -30]]) + sheep({ expr: "^^,o,sweat" }) + limb([[52, 4], [70, 20], [74, -4]]) + bible(84, -10, 34, 46, 14)),
  // 이마 짚음 🤦
  facepalm: () => shadow(0, 92) + legs() + hang(-1) + sheep({ expr: "^^,sweat", frot: 8 }) + limb([[52, 4], [66, -30], [12, -28]]),
  // 성경 뒤에서 빼꼼
  peek: () => shadow(0, 104, 90) + g("translate(0,-34)", sheep({ expr: "^^" })) + bible(0, 44, 170, 124) +
    hoofAt(-46, -16) + hoofAt(46, -16) +
    `<text x="-4" y="90" text-anchor="middle" font-size="18" font-weight="900" fill="${C.gold}" font-family="Noto Sans KR, Malgun Gothic, sans-serif">HOLY BIBLE</text>`,
  // 엎드려 폰 보며 뒷발 까딱
  phone: () => shadow(0, 70, 120, 9) + limb([[62, 20], [84, -20], [72, -48]]) + limb([[76, 24], [108, -10], [100, -44]]) +
    sheep({ rx: 92, ry: 42, fx: -62, fy: -8, frot: 6, expr: "^^,glow" }) + phone(-66, 44, -10) +
    limb([[-40, 40], [-60, 56], [-76, 50]]) + limb([[-86, 30], [-98, 50], [-82, 56]]),
  // 기름 떨어진 등불
  sign: (say) => shadow(0, 92) + legs() + sheep({ expr: "^^" }) +
    limb([[-52, 4], [-78, 0], [-90, -14]], { tip: false }) + limb([[52, 4], [78, 0], [90, -14]], { tip: false }) +
    signBoard(say, 0, 22, 196, 90) + hoofAt(-90, -18) + hoofAt(88, -24),
  // 반가운 마음은 있지만 기운은 없어, 한쪽 손만 조심스럽게 든다.
  cheer: () => shadow(0, 92) + legs() + hang(-1) + sheep({ expr: "^^,blush", frot: 3 }) +
    limb([[52, 4], [66, 18], [72, 0]]),
  // 찻잔 홀짝 ☕
  sideeye: () => shadow(0, 92) + legs() + sheep({ expr: "side,flat" }) +
    limb([[-52, 4], [-20, 32], [34, 18]]) + limb([[52, 4], [18, 34], [-34, 20]]) + tapMarks(42, 88) +
    line("M-91,-26 L-76,-34 M-96,-12 L-78,-15", "#E56B62", 3),
  // 눈을 한 바퀴 굴리고 한숨 쉬는 과장된 리액션.
  eye_roll: () => shadow(0, 92) + legs() + sheep({ expr: "roll,pout" }) +
    limb([[-52, 4], [-18, 34], [34, 18]]) + limb([[52, 4], [18, 34], [-34, 20]]) +
    line("M-38,-54 Q-24,-76 -2,-70 M2,-70 Q24,-76 38,-54", "#9C91B8", 3) +
    bubbleText("하…", 70, -62),
  // 꾹 참다가 한 번 발을 구르는 모습.
  stomp: () => shadow(0, 95) + limb([[-22, 48], [-22, 88]]) + limb([[22, 48], [58, 70], [60, 88]]) +
    sheep({ expr: "squint,pout", frot: -7 }) + hip(-1) +
    limb([[52, 4], [72, 18], [70, 40]]) + line("M42,91 L31,101 M56,94 L53,108 M70,91 L80,101", "#E5A34B", 4),
  // 짝짝짝 박수는 치지만 눈은 전혀 웃지 않는다.
  nope: () => shadow(0, 92) + legs() + sheep({ expr: "squint,flat", frot: 10, flip: true }) +
    limb([[-52, 4], [-36, -18], [-28, -18]]) + limb([[52, 4], [36, -18], [28, -18]]) +
    line("M-91,-28 L-105,-38 M-96,-12 L-112,-12 M91,-28 L105,-38 M96,-12 L112,-12", "#E56B62", 4),
  // 콧대를 세우고 내려다보는 듯한 '그걸 아직도 안 했어?' 표정.
  condescend: () => shadow(0, 92) + legs() + sheep({ expr: "down,smirk", frot: -10 }) +
    hip(-1) + limb([[52, 4], [76, 18], [88, 12]]) + line("M-99,-42 L-80,-48 M-100,-28 L-82,-31", "#D9C9B5", 3),
  // 한쪽 눈썹만 올린 채 여유롭게 미소 짓는다.
  fingerwag: () => shadow(0, 92) + legs() + sheep({ expr: "squint,flat" }) + hang(-1) +
    limb([[52, 4], [66, -12], [82, -38]], { w: 9 }),
  // 두 앞발을 모아 오늘 분량을 꼭 부탁한다.
  pleading: () => shadow(0, 92) + legs() + sheep({ expr: "sad,pout,blush" }) +
    limb([[-52, 4], [-34, 28], [0, 10]]) + limb([[52, 4], [34, 28], [0, 10]]) +
    sparkle(-82, -45, 0.55) + sparkle(82, -45, 0.55),
  // 무릎을 꿇고 두 손을 모아 간절하게 빈다.
  kneel: () => shadow(0, 88, 90) + limb([[-22, 48], [-42, 74], [-20, 88]]) + limb([[22, 48], [42, 74], [60, 88]]) +
    sheep({ expr: "sad,pout", frot: -4 }) + limb([[-52, 4], [-35, 28], [0, 9]]) + limb([[52, 4], [35, 28], [0, 9]]) +
    sparkle(-78, -52, 0.45) + sparkle(76, -42, 0.4),
  // 성경을 놓칠까 봐 품에 꼭 안고 있다.
  clutchbook: () => shadow(0, 92) + legs() + sheep({ expr: "closed,blush" }) +
    limb([[-52, 4], [-20, 22], [-5, 60]]) + limb([[52, 4], [20, 22], [5, 60]]) +
    g("translate(0,45) rotate(-5)", bible(0, 0, 58, 70)),
  // 답장이 올까 화면만 바라보다가 폰을 꼭 쥔 모습.
  phonewait: () => shadow(0, 92) + legs() + sheep({ expr: "down,sad" }) +
    limb([[-52, 4], [-34, 24], [-10, 34]]) + limb([[52, 4], [42, 24], [35, 40]]) + phone(42, 44, -4) +
    bubbleText("…", 94, -48),
  // 두 앞발로 작은 하트를 만들어 읽어 달라고 한다.
  heartplease: () => shadow(0, 92) + legs() + sheep({ expr: "closed,blush" }) +
    limb([[-52, 4], [-34, 28], [-4, 5]]) + limb([[52, 4], [34, 28], [4, 5]]) +
    `<path d="M0,18 C-18,3 -25,-4 -18,-12 C-11,-19 -3,-12 0,-7 C5,-16 15,-18 20,-10 C26,-1 14,9 0,18Z" fill="#F28BA6" stroke="${C.ol}" stroke-width="2"/>`,
  // 한 발을 내딛고 팔을 길게 뻗어 붙잡는다.
  reach: () => shadow(0, 96) + limb([[-22, 48], [-36, 72], [-48, 88]]) + limb([[22, 48], [34, 70], [48, 88]]) +
    sheep({ expr: "sad,pout", frot: -8 }) + hang(-1) + limb([[52, 4], [78, -2], [104, -18]]) +
    line("M110,-28 L121,-32 M112,-18 L126,-18 M108,-8 L120,-4", "#FFFFFF", 3),
  // 눈물을 흘리며 성경을 내밀듯 두 팔로 꼭 받친다.
  tearful: () => shadow(0, 92) + legs() + sheep({ expr: "sad,tears,pout" }) +
    limb([[-52, 4], [-36, 30], [-8, 39]]) + limb([[52, 4], [36, 30], [8, 39]]) +
    g("translate(0,56) rotate(-3)", bible(0, 0, 54, 64)),
  // 양이 발목에 매달리듯 아래에서 양털을 붙잡고 애원한다.
  cling: () => shadow(0, 92) + sheep({ expr: "sad,tears,pout", rx: 60, ry: 48, fy: -20 }) +
    limb([[-42, 22], [-60, 48], [-34, 54]]) + limb([[42, 22], [60, 48], [34, 54]]) +
    legs() + bubbleText("한 장만…", 82, -57) + sparkle(-86, -38, 0.4),
  // 돌아서 가려는 듯하다가 마지막으로 고개만 돌려 바라본다.
  lastlook: () => shadow(0, 92) + legs() + sheep({ expr: "sad,blush", frot: 20 }) +
    limb([[-52, 4], [-75, 24], [-70, 42]]) + limb([[52, 4], [65, 24], [52, 42]]) +
    line("M-105,-42 Q-124,-24 -111,-9 M-116,-42 L-106,-48", "#FFFFFF", 3),
  // 양을 끌어안듯 다리를 감싸며 가지 말라고 매달린다.
  offerbook: () => shadow(0, 92) + legs() + sheep({ expr: "sad,blush" }) +
    limb([[-52, 4], [-67, 24], [-76, 34]]) + limb([[52, 4], [77, 18], [86, 6]]) +
    bible(96, -4, 42, 54, 12),
  // 축 처진 양, 늦은 답장과 소소한 부탁을 표현하는 추가 포즈.
  droop: () => shadow(0,92) + legs() + sheep({expr:"vv,flat",frot:12}) + hang(-1) + hang(1),
  slump: () => shadow(0,92) + legs() + g("rotate(15)", sheep({expr:"closed,flat"}) + hang(-1) + hang(1)),
  lean: () => shadow(0,92) + legs() + sheep({expr:"side,flat",frot:-15}) + hip(-1) + hang(1),
  sighing: () => shadow(0,92) + legs() + sheep({expr:"vv,flat"}) + hang(-1) + hang(1) + sighCloud(85,-35),
  waiting: () => shadow(0,100,80) + stool(0,66) + legs() + sheep({expr:"side,flat"}) + hang(-1) + hang(1),
  dozing: () => shadow(0,92) + legs() + sheep({expr:"closed,flat",frot:20}) + hang(-1) + hang(1) + zzz(60,-20),
  embarrassed: () => shadow(0,92) + legs() + sheep({expr:"vv,blush,sweat"}) + limb([[-52,4],[-60,-12],[-36,-24]]) + hang(1),
  wave_small: () => shadow(0,92) + legs() + sheep({expr:"vv,blush"}) + hang(-1) + limb([[52,4],[65,0],[68,-20]]),
  wave_tired: () => shadow(0,92) + legs() + sheep({expr:"closed,flat",frot:8}) + hang(-1) + limb([[52,4],[64,20],[76,16]]),
  arms_open: () => shadow(0,92) + legs() + sheep({expr:"^^,blush"}) + limb([[-52,4],[-75,4],[-92,-8]]) + limb([[52,4],[75,4],[92,-8]]),
  shoulders_up: () => shadow(0,92) + legs() + sheep({expr:"side,flat"}) + limb([[-52,4],[-77,-6],[-72,-24]]) + limb([[52,4],[77,-6],[72,-24]]),
  hands_behind: () => shadow(0,92) + legs() + limb([[-52,4],[-70,20],[-55,42]]) + limb([[52,4],[70,20],[55,42]]) + sheep({expr:"vv,blush"}),
  book_overhead: () => shadow(0,92) + legs() + sheep({expr:"^^,o"}) + limb([[-52,4],[-70,-30],[-42,-64]]) + limb([[52,4],[70,-30],[42,-64]]) + bible(0,-74,56,42),
  book_on_head: () => shadow(0,92) + legs() + sheep({expr:"vv,flat"}) + hang(-1) + hang(1) + bible(0,-61,68,28,-3),
  reading_seated: () => shadow(0,100,80) + stool(0,66) + legs() + sheep({expr:"closed"}) + bible(0,50,82,54,0,true) + limb([[-52,4],[-50,30],[-35,50]]) + limb([[52,4],[50,30],[35,50]]),
  book_rest: () => shadow(0,92) + legs() + sheep({expr:"vv,flat",frot:8}) + hang(-1) + limb([[52,4],[70,20],[80,38]]) + bible(91,43,40,52,12),
  head_tilt: () => shadow(0,92) + legs() + sheep({expr:"side,pout",frot:22}) + hang(-1) + hip(1),
  foot_tap: () => shadow(0,92) + limb([[-22,48],[-24,88]]) + limb([[22,48],[45,84]]) + sheep({expr:"side,flat"}) + hip(-1) + hip(1) + tapMarks(46,88),
  crawl: () => shadow(0,75,110) + sheep({rx:85,ry:40,fx:-55,fy:-5,expr:"sad,pout"}) + limb([[-50,30],[-80,55],[-95,54]]) + limb([[45,30],[80,54],[98,54]]),
  tiny_bow: () => shadow(0,92) + legs() + g("rotate(18)",sheep({expr:"closed,blush"}) + limb([[-52,4],[-30,30],[-5,35]]) + limb([[52,4],[30,30],[5,35]])),
};

function bubbleText(text, x, y) {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-size="22" font-weight="900" fill="#8C80A6" stroke="#fff" stroke-width="4" paint-order="stroke" font-family="Noto Sans KR, Malgun Gothic, sans-serif">${text}</text>`;
}
function sighCloud(x, y) {
  return bubbleText("후…", x, y) + ell(x - 23, y + 7, 5, 4, "#FFFFFF", 'opacity="0.8"') + ell(x - 36, y + 12, 3, 2.5, "#FFFFFF", 'opacity="0.65"');
}

function stool(x, y) {
  return g(`translate(${x},${y})`,
    `<rect x="-52" y="-8" width="104" height="18" rx="6" fill="#C98B55" stroke="${C.ol}" stroke-width="${OW}"/>` +
    line("M-40,10 L-46,44 M40,10 L46,44 M0,10 L0,44", C.ol, 9) + line("M-40,10 L-46,44 M40,10 L46,44 M0,10 L0,44", "#B07440", 5));
}
function dust(x, y, s = 1) {
  return g(`translate(${x},${y}) scale(${s})`, circle(0, 0, 12, "#fff", 'opacity="0.8"') + circle(14, -6, 9, "#fff", 'opacity="0.8"') + circle(-12, -4, 8, "#fff", 'opacity="0.8"'));
}
function confetti() {
  const cols = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#C77DFF"];
  let s = "";
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, r = 130 + (i % 4) * 22;
    const x = Math.cos(a) * r, y = -60 + Math.sin(a) * r * 0.6;
    s += `<rect x="${f(x)}" y="${f(y)}" width="10" height="16" rx="2" fill="${cols[i % 5]}" transform="rotate(${i * 37} ${f(x)} ${f(y)})"/>`;
  }
  return s;
}
function orbit(x, y) {
  return ell(x, y, 46, 14, "none", `stroke="#fff" stroke-width="3" stroke-dasharray="6 8" opacity="0.8"`) +
    sparkle(x - 40, y - 2, 0.8, "#FFE066") + sparkle(x + 30, y + 10, 0.6, "#FFE066") + sparkle(x + 8, y - 14, 0.5, "#FFE066");
}

// ---------- 배경·말풍선 ----------
const THEMES = {
  morning: ["#E2F8EF", "#BCE2F7", "sun"],
  afternoon: ["#FFF4CC", "#FFD6A6", "sun"],
  evening: ["#FFE6CC", "#FFBBAA", "sunset"],
  night: ["#CDD3F6", "#98A1DD", "moon"],
  last: ["#FBCFDC", "#C7A8EE", "clock"],
  done: ["#DAF6D4", "#A9E5CD", "stars"],
};

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function backdrop(tier) {
  const [a, b, deco] = THEMES[tier] || THEMES.evening;
  let s = `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
    `<rect width="720" height="360" fill="url(#bg)"/>`;
  const dots = [[70, 60, 34], [150, 300, 44], [420, 250, 38], [560, 70, 30], [660, 170, 52], [520, 320, 36], [30, 220, 26], [360, 40, 20]];
  s += dots.map(([x, y, r]) => circle(x, y, r, "#fff", 'opacity="0.13"')).join("");
  if (deco === "sun") s += circle(640, 290, 46, "#FFF3B0", 'opacity="0.55"') + circle(640, 290, 30, "#FFF8D6", 'opacity="0.8"');
  if (deco === "sunset") s += circle(640, 330, 70, "#FFE0A3", 'opacity="0.45"');
  if (deco === "moon") s += `<path d="M646,236 A46,46 0 1 0 690,300 A36,36 0 1 1 646,236Z" fill="#FFF3C4" opacity="0.9"/>` +
    [[560, 200], [610, 320], [470, 300], [690, 220]].map(([x, y]) => sparkle(x, y, 0.5, "#FFF3C4")).join("");
  if (deco === "clock") s += g("translate(640,290)", circle(0, 0, 44, "#fff", 'opacity="0.2"') + circle(0, 0, 36, "none", 'stroke="#fff" stroke-width="4" opacity="0.7"') +
    line("M0,0 L-6,-22 M0,0 L-2,-30", "#fff", 5, 'opacity="0.8"'));
  if (deco === "stars") s += [[560, 260], [640, 300], [690, 230], [600, 200]].map(([x, y], i) => sparkle(x, y, 0.8 - i * 0.1, "#FFFBD0")).join("");
  return s;
}

// 말풍선: 폭은 measure(글자)로 계산. tail = 꼬리 끝 좌표
function bubble(text, x, y, tail, measure) {
  const maxLineWidth = 400;
  const lines = [];
  for (const sourceLine of String(text).split("\n")) {
    let line = "";
    for (const character of sourceLine) {
      const next = line + character;
      if (line && measure(next, 30) > maxLineWidth) { lines.push(line); line = character; }
      else line = next;
    }
    lines.push(line);
  }
  const fs = lines.length > 1 ? 30 : 34;
  const textWidth = Math.max(...lines.map((line) => measure(line, fs)));
  const w = Math.max(116, textWidth + 60), h = Math.max(70, lines.length * fs * 1.15 + 24);
  const bx = Math.min(x, 720 - w - 16);
  const cx = Math.max(bx + 30, Math.min(bx + w - 30, tail[0] + 28));
  return `<g filter="url(#bs)"><rect x="${bx}" y="${y}" width="${w}" height="${h}" rx="30" fill="url(#bub)"/>` +
    `<path d="M${cx - 22},${y + h - 6} Q${cx - 10},${y + h + 10} ${tail[0]},${tail[1]} Q${cx + 8},${y + h + 8} ${cx + 20},${y + h - 6}Z" fill="#F4F3F7"/></g>` +
    `<text text-anchor="middle" font-size="${fs}" font-weight="700" fill="#3B3538" font-family="Noto Sans KR, Malgun Gothic, sans-serif">${lines.map((line, index) => `<tspan x="${bx + w / 2}" y="${y + h / 2 + (index - (lines.length - 1) / 2) * fs * 1.12 + fs * 0.36}">${esc(line)}</tspan>`).join("")}</text>`;
}

// 포즈마다 양 위치(가운데 x, 몸통 y, 크기)와 말풍선 꼬리 끝
const PLACE = {
  sob: [240, 214, 1.3, [262, 118]],
  lounge: [280, 232, 1.3, [236, 150]], phone: [290, 236, 1.3, [236, 156]], faint: [290, 234, 1.3, [220, 176]],
  hide: [290, 226, 1.0, [230, 170]], peek: [240, 214, 1.25, [262, 118]], sleep: [240, 212, 1.3, [262, 116]],
  cheer: [236, 212, 1.3, [262, 110]], stretch: [236, 214, 1.3, [262, 112]], pray: [240, 214, 1.35, [262, 118]],
  lamp: [220, 214, 1.3, [252, 118]], sign: [240, 214, 1.3, [262, 118]],
  sideeye: [240, 214, 1.3, [262, 118]], eye_roll: [240, 214, 1.3, [262, 118]],
  stomp: [240, 214, 1.25, [262, 118]], slowclap: [240, 214, 1.3, [262, 118]],
  ugh: [240, 214, 1.3, [262, 118]], shrug: [240, 214, 1.3, [262, 118]], nope: [240, 214, 1.3, [262, 118]],
  condescend: [240, 214, 1.3, [262, 118]], smirk: [240, 214, 1.3, [262, 118]], fingerwag: [240, 214, 1.3, [262, 118]],
  pleading: [240, 214, 1.3, [262, 118]], kneel: [240, 214, 1.3, [262, 118]], clutchbook: [240, 214, 1.3, [262, 118]],
  phonewait: [240, 214, 1.3, [262, 118]], heartplease: [240, 214, 1.3, [262, 118]], reach: [240, 214, 1.3, [262, 118]],
  tearful: [240, 214, 1.3, [262, 118]], cling: [240, 214, 1.3, [262, 118]], lastlook: [240, 214, 1.3, [262, 118]],
  beg: [240, 214, 1.3, [262, 118]], offerbook: [240, 214, 1.3, [262, 118]], wait: [240, 214, 1.3, [262, 118]],
};

function renderCard({ tier, pose, say }, measure) {
  const [x, y, s, tail] = PLACE[pose] || [236, 208, 1.4, [258, 116]];
  const sheep = POSES[pose] ? POSES[pose](say) : POSES.shush(say);
  const withBubble = pose !== "sign" && say;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="360" viewBox="0 0 720 360">` +
    `<defs>${SHEEP_DEFS}<linearGradient id="bub" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#ECEAF1"/></linearGradient><filter id="bs" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-opacity="0.18"/></filter></defs>` +
    backdrop(tier) + `<g filter="url(#soft)">${g(`translate(${x},${y}) scale(${s})`, sheep)}</g>` +
    (withBubble ? bubble(say, 296, 24, tail, measure) : "") + `</svg>`;
}

if (typeof module !== "undefined") module.exports = { renderCard, POSES };
if (typeof window !== "undefined") window.ReminderArt = { renderCard, POSES };
