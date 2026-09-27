// 리마인드 알림 그림 굽기: sw.js의 MESSAGES를 읽어 메시지마다 icons/notify/<시간대>-<순서>.jpg를 만든다.
// 헤드리스 크롬(또는 엣지)으로 art.js의 SVG를 캔버스에 그려 JPG로 뽑음. 설치할 패키지 없음.
//   node tools/notify-art/build.mjs                  → 전부 굽기
//   node tools/notify-art/build.mjs --sheet 파일.jpg [개수]  → 무작위 예시를 한 장에 모아 보기(굽지 않음)
//   node tools/notify-art/build.mjs --poses 파일.jpg [shush,sign]  → 포즈 모아 보기(이름을 주면 그것만)
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const art = readFileSync(join(here, "art.js"), "utf8");

export function loadMessages() {
  const src = readFileSync(join(root, "sw.js"), "utf8");
  const m = src.match(/const MESSAGES = (\{[\s\S]*?\n\});/);
  if (!m) throw new Error("sw.js에서 MESSAGES를 찾지 못했어요");
  return new Function(`return ${m[1]}`)();
}

function findChrome() {
  const list = [
    process.env.CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium",
  ];
  const hit = list.find((p) => p && existsSync(p));
  if (!hit) throw new Error("크롬을 찾지 못했어요. CHROME 환경 변수로 경로를 알려 주세요.");
  return hit;
}

// jobs: [{tier,pose,say}], sheet: 0이면 한 장씩, n이면 n열로 모은 한 장
function render(jobs, { sheet = 0, label = false } = {}) {
  const page = `<!doctype html><meta charset="utf-8"><body><pre id="out"></pre><script>${art}
const jobs = ${JSON.stringify(jobs)};
const sheet = ${sheet}, label = ${label};
const mctx = document.createElement("canvas").getContext("2d");
const measure = (t, fs) => { mctx.font = "900 " + fs + "px 'Noto Sans KR','Malgun Gothic',sans-serif"; return mctx.measureText(t).width; };
const load = (svg) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no;
  im.src = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); });
(async () => {
  const out = [];
  const imgs = [];
  for (const j of jobs) imgs.push(await load(renderCard(j, measure)));
  if (sheet) {
    const W = 720, H = 360, pad = 16, lh = label ? 92 : 0, rows = Math.ceil(imgs.length / sheet);
    const c = document.createElement("canvas"); c.width = sheet * (W + pad) + pad; c.height = rows * (H + lh + pad) + pad;
    const x = c.getContext("2d"); x.fillStyle = "#f1eef5"; x.fillRect(0, 0, c.width, c.height);
    imgs.forEach((im, i) => {
      const cx = pad + (i % sheet) * (W + pad), cy = pad + Math.floor(i / sheet) * (H + lh + pad);
      if (label) {
        x.fillStyle = "#fff"; x.fillRect(cx, cy, W, lh);
        x.fillStyle = "#222"; x.font = "700 24px 'Noto Sans KR'"; x.fillText(jobs[i].title || jobs[i].pose, cx + 16, cy + 36, W - 32);
        x.fillStyle = "#666"; x.font = "400 18px 'Noto Sans KR'"; x.fillText(jobs[i].body || "", cx + 16, cy + 70, W - 32);
      }
      x.drawImage(im, cx, cy + lh);
    });
    out.push(c.toDataURL("image/jpeg", 0.9));
  } else {
    const c = document.createElement("canvas"); c.width = 720; c.height = 360;
    const x = c.getContext("2d");
    for (const im of imgs) { x.drawImage(im, 0, 0); out.push(c.toDataURL("image/jpeg", 0.86)); }
  }
  document.getElementById("out").textContent = "@@" + JSON.stringify(out) + "@@";
})().catch((e) => { document.getElementById("out").textContent = "@@ERR " + e + "@@"; });
</script>`;
  const dir = join(tmpdir(), "notify-art");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "render.html");
  writeFileSync(file, page);
  const dom = execFileSync(findChrome(), [
    "--headless=new", "--disable-gpu", "--no-first-run", "--allow-file-access-from-files",
    "--virtual-time-budget=30000", `--user-data-dir=${join(dir, "profile")}`, "--dump-dom", pathToFileURL(file).href,
  ], { maxBuffer: 1 << 28, encoding: "utf8" });
  const m = dom.match(/@@([\s\S]*?)@@/);
  if (!m || m[1].startsWith("ERR")) throw new Error("그리기 실패: " + (m ? m[1] : "결과 없음"));
  return JSON.parse(m[1]).map((u) => Buffer.from(u.split(",")[1], "base64"));
}

function allJobs() {
  const msgs = loadMessages();
  const jobs = [];
  for (const [tier, list] of Object.entries(msgs)) {
    list.forEach(([title, body, pose, say], i) => jobs.push({ tier, pose, say, title, body, file: `${tier}-${i}.jpg` }));
  }
  return jobs;
}

const args = process.argv.slice(2);
if (args[0] === "--sheet") {
  const jobs = allJobs().sort(() => Math.random() - 0.5).slice(0, Number(args[2]) || 6)
    .map((j) => ({ ...j, title: j.title.replace("{streak}", "12"), body: j.body.replace(/\{portion\}/g, "시편 23편").replace("{streak}", "12") }));
  writeFileSync(args[1], render(jobs, { sheet: 2, label: true })[0]);
  console.log(jobs.map((j) => `${j.file}  [${j.pose}] ${j.title}`).join("\n"));
} else if (args[0] === "--poses") {
  const { POSES } = await import(pathToFileURL(join(here, "art.js")).href).catch(() => ({}));
  const all = POSES ? Object.keys(POSES) : [...art.matchAll(/^  (\w+): \(/gm)].map((m) => m[1]);
  const names = args[2] ? args[2].split(",") : all; // 일부만: --poses 파일.jpg shush,sign
  const tiers = ["morning", "afternoon", "evening", "night", "last", "done"];
  writeFileSync(args[1], render(names.map((pose, i) => ({ tier: tiers[i % 6], pose, say: pose === "sign" ? "성경 읽어" : pose, title: pose })), { sheet: args[2] ? 2 : 3, label: true })[0]);
  console.log(names.join(", "));
} else {
  const jobs = allJobs();
  const outDir = join(root, "icons/notify");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  render(jobs).forEach((buf, i) => writeFileSync(join(outDir, jobs[i].file), buf));
  console.log(`${jobs.length}장 구움 → icons/notify/`);
}
