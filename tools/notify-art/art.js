// 리마인드 알림 그림(720×360) — 말랑한 클레이 3D 느낌의 하찮은 양이 포즈를 취하는 SVG를 만든다.
// 양: 몽글몽글한 털 뭉치 한 덩이 + 앞에 붙은 베이지 얼굴 + 가느다란 막대 팔다리. 눈은 늘 ^^ 아니면 vv.
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

// 클레이 느낌 그라데이션 (renderCard가 <defs>에 넣음)
const SHEEP_DEFS =
  `<radialGradient id="wool" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#F1EEF6"/><stop offset="1" stop-color="#CFC9DC"/></radialGradient>` +
  `<radialGradient id="face" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="#FBE3C6"/><stop offset="0.6" stop-color="#EEC79C"/><stop offset="1" stop-color="#D9A878"/></radialGradient>` +
  `<radialGradient id="shine" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
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

// 표정: e = "^^" 또는 "vv" + 덧붙이는 것들(쉼표로): smile, o, open, blush, sweat, tears, tint, anger, glow, bubble
function faceMarks(spec) {
  const [eyes, ...extra] = spec.split(",");
  const has = (k) => extra.includes(k);
  const eye = (x) => eyes === "vv"
    ? line(`M${x - 4.6},-1.5 Q${x},3.5 ${x + 4.6},-1.5`, C.ink, 2.3)
    : line(`M${x - 4.6},1.8 Q${x},-4 ${x + 4.6},1.8`, C.ink, 2.3);
  let s = "";
  if (has("tint")) s += ell(0, -12, 30, 12, "#8FA2F0", 'opacity="0.45"') + line("M-12,-22 L-12,-14 M0,-24 L0,-16 M12,-22 L12,-14", "#6275D0", 1.8, 'opacity="0.7"');
  if (has("glow")) s += ell(0, 14, 26, 14, "#BFEFFF", 'opacity="0.3"');
  s += eye(-10) + eye(10);
  if (has("blush")) s += ell(-19, 7, 6, 3.2, C.blush, 'opacity="0.6"') + ell(19, 7, 6, 3.2, C.blush, 'opacity="0.6"');
  if (has("o")) s += ell(0, 11, 3, 3.8, C.ink);
  else if (has("open")) s += `<path d="M-5,8 Q0,16 5,8Z" fill="${C.ink}"/>`;
  else if (!has("none")) s += line("M-3,9 Q0,11.5 3,9", C.ink, 1.8);
  if (has("tears")) s += line("M-10,4 Q-12,16 -10,26", C.tear, 4, 'opacity="0.85"') + line("M10,4 Q12,16 10,26", C.tear, 4, 'opacity="0.85"');
  if (has("sweat")) s += sweatDrop(28, -22, 0.7);
  if (has("anger")) s += anger(26, -30, 0.45);
  if (has("bubble")) s += circle(8, 14, 6, "#DDF2FF", 'stroke="#9CCDEE" stroke-width="1.2" opacity="0.9"');
  return s;
}

// 얼굴 한 덩어리: 귀 + 베이지 얼굴 + 이마 털 + 표정 (얼굴 가운데 = 0,0)
function face(x, y, { rot = 0, s = 1, expr = "^^" } = {}) {
  const ear = (side) => g(`translate(${side * 31},-4) rotate(${side * 28})`, ell(side * 9, 0, 14, 7, "url(#face)"));
  return g(`translate(${x},${y}) rotate(${rot}) scale(${s})`,
    ear(-1) + ear(1) + `<ellipse cx="0" cy="2" rx="31" ry="25" fill="url(#face)"/>` +
    `<path d="${puff(28, 11, 7, 0.28, 0.2)}" transform="translate(0,-20)" fill="url(#wool)"/>` +
    ell(-10, -6, 9, 4, "url(#shine)", 'opacity="0.6"') + faceMarks(expr));
}

// 양 한 마리(팔다리 뺀 몸): 털 뭉치 + 얼굴. rx/ry로 서 있는 공 모양 ↔ 엎드린 납작 모양
function sheep({ rx = 60, ry = 56, fx = 0, fy = -14, frot = 0, expr = "^^", flip = false } = {}) {
  const wool = `<path d="${puff(rx, ry, Math.round((rx + ry) / 10), 0.14)}" fill="url(#wool)"${flip ? ' transform="rotate(180)"' : ""}/>` +
    ell(-rx * 0.32, -ry * 0.42, rx * 0.3, ry * 0.18, "url(#shine)", 'opacity="0.8"');
  return wool + face(fx, fy, { rot: frot, expr });
}

// 막대 팔다리: 점 2~3개(가운데는 굽는 곳), 끝 6px은 진한 발굽
function limb(pts, { w = 10, tip = true } = {}) {
  const [a, b, c] = pts;
  const end = c || b, from = c ? b : a;
  const d = c ? `M${a[0]},${a[1]} Q${b[0]},${b[1]} ${c[0]},${c[1]}` : `M${a[0]},${a[1]} L${b[0]},${b[1]}`;
  const len = Math.hypot(end[0] - from[0], end[1] - from[1]) || 1;
  const hx = end[0] - ((end[0] - from[0]) / len) * 6, hy = end[1] - ((end[1] - from[1]) / len) * 6;
  return line(d, C.limb, w) + line(d, C.limbLt, w * 0.35, 'opacity="0.8" transform="translate(-1,-1)"') +
    (tip ? line(`M${f(hx)},${f(hy)} L${end[0]},${end[1]}`, C.tip, w) : "");
}
function hoofAt(x, y, r = 7) { return circle(x, y, r, C.tip) + circle(x - r * 0.3, y - r * 0.35, r * 0.35, "#fff", 'opacity="0.3"'); }
function bigHoof(x, y, r = 15) { return circle(x, y, r, C.tip) + line(`M${x},${y - r * 0.8} L${x},${y + r * 0.2}`, "#7A5033", 2.5) + ell(x - r * 0.35, y - r * 0.4, r * 0.3, r * 0.18, "#fff", 'opacity="0.35"'); }

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
  // 쉿 🤫
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
  lamp: () => shadow(0, 92) + legs() + sheep({ expr: "^^,o,sweat" }) + limb([[-52, 4], [-76, -30], [-38, -38]]) +
    limb([[52, 4], [76, 16], [88, 14]]) + g("translate(116,10) scale(0.8)", lamp(0, 0, "tiny")),
  // 피켓 시위 (말풍선 대신 피켓에 글씨)
  sign: (say) => shadow(0, 92) + legs() + sheep({ expr: "^^" }) +
    limb([[-52, 4], [-78, 0], [-90, -14]], { tip: false }) + limb([[52, 4], [78, 0], [90, -14]], { tip: false }) +
    signBoard(say, 0, 22, 196, 90) + hoofAt(-90, -18) + hoofAt(88, -24),
  // 만세 🙌 (폴짝)
  cheer: () => shadow(0, 100, 44, 7) + confetti() + g("translate(0,-12)", limb([[-22, 48], [-40, 66], [-32, 86]]) +
    limb([[22, 48], [40, 66], [32, 86]]) + sheep({ expr: "^^,open,blush" }) + limb([[-52, 0], [-72, -30], [-80, -66]]) + limb([[52, 0], [72, -30], [80, -66]])),
  // 찻잔 홀짝 ☕
  sip: () => shadow(0, 92) + legs() + limb([[-52, 4], [-40, 30], [-14, 26]]) + sheep({ expr: "vv,none" }) +
    limb([[52, 4], [58, 20], [22, 8]]) + cup(10, 0, 0.8, -14),
  // 확성기 📣
  megaphone: () => shadow(0, 92) + legs() + hip(1) + sheep({ expr: "^^,none" }) +
    g("translate(-26,-2) scale(-0.8,0.8) rotate(-6)", megaphone(0, 0, 0)) + limb([[-52, 4], [-50, 26], [-30, 6]]),
  // 발라당 기절 (막대 다리 넷이 하늘로)
  faint: () => shadow(0, 76, 120, 9) +
    limb([[-44, 0], [-50, -60]]) + limb([[-18, -6], [-16, -66]]) + limb([[20, -6], [24, -66]]) + limb([[46, 0], [54, -58]]) +
    sheep({ rx: 90, ry: 44, fx: -66, fy: 18, frot: -24, expr: "^^,tears,o", flip: true }) + orbit(-70, -30),
  // 이불 속에서 빼꼼
  hide: () => shadow(20, 100, 150, 11) + ell(-110, 40, 56, 22, "#fff", `stroke="${C.ol}" stroke-width="${OW}"`) +
    face(-100, 16, { expr: "^^,blush", rot: -8, s: 1.2 }) + blanket() + hoofAt(-74, 36) + hoofAt(-56, 32),
  // 기지개 하아암
  stretch: () => shadow(0, 92) + legs() + limb([[-52, 0], [-56, -40], [-44, -84]]) + limb([[52, 0], [56, -40], [44, -84]]) +
    sheep({ expr: "vv,o", frot: -6 }) + ell(-18, -16, 2, 3, C.tear),
};

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
  const fs = 34;
  const w = Math.max(116, measure(text, fs) + 60), h = 70;
  const bx = Math.min(x, 720 - w - 16);
  const cx = Math.max(bx + 30, Math.min(bx + w - 30, tail[0] + 28));
  return `<g filter="url(#bs)"><rect x="${bx}" y="${y}" width="${w}" height="${h}" rx="30" fill="url(#bub)"/>` +
    `<path d="M${cx - 22},${y + h - 6} Q${cx - 10},${y + h + 10} ${tail[0]},${tail[1]} Q${cx + 8},${y + h + 8} ${cx + 20},${y + h - 6}Z" fill="#F4F3F7"/></g>` +
    `<text x="${bx + w / 2}" y="${y + h / 2 + fs * 0.36}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#3B3538" font-family="Noto Sans KR, Malgun Gothic, sans-serif">${esc(text)}</text>`;
}

// 포즈마다 양 위치(가운데 x, 몸통 y, 크기)와 말풍선 꼬리 끝
const PLACE = {
  lounge: [280, 232, 1.3, [236, 150]], phone: [290, 236, 1.3, [236, 156]], faint: [290, 234, 1.3, [220, 176]],
  hide: [290, 226, 1.0, [230, 170]], peek: [240, 214, 1.25, [262, 118]], sleep: [240, 212, 1.3, [262, 116]],
  cheer: [236, 212, 1.3, [262, 110]], stretch: [236, 214, 1.3, [262, 112]], pray: [240, 214, 1.35, [262, 118]],
  lamp: [220, 214, 1.3, [252, 118]], sign: [240, 214, 1.3, [262, 118]],
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
