// 주석 PDF(스캔본)를 윈도우 내장 한국어 OCR로 읽어 권별 텍스트로 저장한다. 저장소 밖에만 둔다(저작권).
//   node tools/commentary/ocr.mjs [책 번호 …]      예: node tools/commentary/ocr.mjs 8 9
// 환경 변수
//   COMMENTARY_DIR  주석 PDF 폴더 (기본: OneDrive\Desktop\소명\교회\주석)
//   OCR_CACHE       결과 폴더 (기본: %LOCALAPPDATA%\daily-bible-reading\ocr)
//   OCR_JOBS        동시에 처리할 PDF 수 (기본 6)
// 필요: 윈도우 한국어 OCR(한국어 언어 팩), poppler의 pdftoppm (Git Bash에 들어 있음)
// 결과: <OCR_CACHE>/<시리즈>_<번호>.txt — "=== p.<쪽>" 구분 줄 + 그 쪽 글줄. 이미 있으면 건너뜀.
import { readdirSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
export const COMMENTARY_DIR = process.env.COMMENTARY_DIR || join(homedir(), "OneDrive", "Desktop", "소명", "교회", "주석");
export const OCR_CACHE = process.env.OCR_CACHE || join(process.env.LOCALAPPDATA || homedir(), "daily-bible-reading", "ocr");
const JOBS = Number(process.env.OCR_JOBS) || 6;

function run(cmd, args) {
  return new Promise((ok, no) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d; });
    p.on("close", (code) => (code === 0 ? ok() : no(new Error(`${cmd} ${code}: ${err.slice(-400)}`))));
  });
}

// "성경신학_08_룻기.pdf" → { series: "성경신학", num: 8, out: "성경신학_08.txt" }
function listPdfs(only) {
  return readdirSync(COMMENTARY_DIR)
    .map((f) => f.match(/^(.+?)_(\d{2})_.+\.pdf$/))
    .filter(Boolean)
    .map((m) => ({ file: m[0], series: m[1], num: Number(m[2]), out: `${m[1]}_${m[2]}.txt` }))
    .filter((p) => !only.length || only.includes(p.num))
    .sort((a, b) => a.num - b.num || a.series.localeCompare(b.series));
}

async function ocrOne(p) {
  const out = join(OCR_CACHE, p.out);
  if (existsSync(out) && statSync(out).size > 0) return "skip";
  const tmp = join(tmpdir(), "daily-bible-ocr", p.out.replace(".txt", ""));
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  // 150dpi 회색조 JPEG: 본문 글자는 충분히 읽히고 빠름
  await run("pdftoppm", ["-r", "150", "-gray", "-jpeg", "-jpegopt", "quality=88", join(COMMENTARY_DIR, p.file), join(tmp, "p")]);
  await run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(here, "ocr-dir.ps1"), "-Dir", tmp, "-Out", out]);
  rmSync(tmp, { recursive: true, force: true });
  return "done";
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const only = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
  mkdirSync(OCR_CACHE, { recursive: true });
  const queue = listPdfs(only);
  console.log(`PDF ${queue.length}개 → ${OCR_CACHE} (동시 ${JOBS}개)`);
  const started = Date.now();
  let i = 0, finished = 0;
  async function worker() {
    while (i < queue.length) {
      const p = queue[i++];
      const t = Date.now();
      try {
        const r = await ocrOne(p);
        finished++;
        console.log(`[${finished}/${queue.length}] ${p.file} ${r === "skip" ? "이미 있음" : `${Math.round((Date.now() - t) / 1000)}초`}`);
      } catch (e) {
        finished++;
        console.log(`[${finished}/${queue.length}] ${p.file} 실패: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, worker));
  console.log(`끝 (${Math.round((Date.now() - started) / 60000)}분)`);
}
