// 갓피아 성경 본문을 글자(텍스트)만 뽑아 줌 — 화면 캡처를 읽는 것보다 토큰이 훨씬 적게 듦
//   node tools/commentary/bibletext.mjs <책 코드> <장 또는 장-장> [역본,역본]   예: node tools/commentary/bibletext.mjs 2sa 15-17 han,easy
//   역본 코드: gae(개역개정4판) han(개역한글) easy(쉬운성경) niv saenew(새번역) hyun(현대인) — 앱의 알림 서버(/bible)가 갓피아에서 받아 옴
//   옵션: --plain  절 번호와 본문만 한 줄씩(역본 표시 없음, 한 역본일 때 가장 짧음)
//         --save   받은 글을 tools/commentary/.bible-cache/<책>-<장>-<역본>.txt 로도 저장(저장소 밖 취급: .gitignore, 커밋 금지)
// 갓피아 본문은 저작권이 있으니 요약을 쓰기 위한 사실 확인용으로만 읽고, 문장을 그대로 옮기지 않는다.
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { BOOKS, VERSIONS, versionFor } = require("../../js/core/bible.js");
const SERVER = process.env.BIBLE_SERVER || "https://daily-bible-reminder.gimbap-lettuce.workers.dev";
const CACHE = join(dirname(fileURLToPath(import.meta.url)), ".bible-cache");

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const [code, range = "1", vers = "han"] = args;
const book = BOOKS.find((b) => b.code === code);
if (!book) { console.log("사용법: node tools/commentary/bibletext.mjs <책 코드> <장|장-장> [역본,역본] (--plain --save)"); process.exit(1); }
const [from, to] = range.split("-").map(Number);
const list = vers.split(",");
const name = (c) => (VERSIONS.find((v) => v.code === c) || {}).name || c;

// <li datasec=".." datavver=".."><span class="bible-read-no">1</span><span class="bible-read-cont">본문</span></li> → [{ver, no, text}]
export function parseVerses(html) {
  return html.split(/<li\b/i).slice(1).map((chunk) => {
    const ver = (chunk.match(/data(?:vver|ver)="([^"]*)"/i) || [])[1] || "";
    const no = ((chunk.match(/class="bible-read-no"[^>]*>([\s\S]*?)<\/span>/) || [])[1] || "").replace(/<[^>]*>/g, "").trim();
    const text = ((chunk.match(/class="bible-read-cont[^"]*"[^>]*>([\s\S]*?)<\/span>\s*(?:<\/li>|$)/) || [])[1] || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    return { ver, no, text };
  }).filter((v) => /^\d/.test(v.no) && v.text);
}

async function chapter(chap) {
  const [first, second] = list.map((c) => versionFor(c, book));
  const p = new URLSearchParams({ ver: first, vol: book.code, chap: String(chap) });
  if (second && second !== first) p.set("ver2", second);
  const res = await fetch(`${SERVER}/bible?${p}`);
  if (!res.ok) throw new Error(`${book.name} ${chap}장 응답 ${res.status}`);
  return parseVerses(await res.text());
}

for (let c = from; c <= (to || from); c++) {
  const verses = await chapter(c);
  const first = versionFor(list[0], book);
  const lines = [`## ${book.name} ${c}${book.code === "psa" ? "편" : "장"} (${list.map(name).join(" · ")})`];
  if (flags.has("--plain")) verses.forEach((v) => lines.push(`${v.no} ${v.text}`));
  else {
    // 같은 절 번호의 역본들을 묶어서: "1 [개역한글] … / [쉬운성경] …"
    const byNo = new Map();
    verses.forEach((v) => { if (!byNo.has(v.no)) byNo.set(v.no, []); byNo.get(v.no).push(v); });
    for (const [no, vs] of byNo) {
      lines.push(vs.length === 1 ? `${no} ${vs[0].text}` : `${no} ` + vs.map((v) => `[${name(list[v.ver === first || !v.ver ? 0 : 1] || v.ver)}] ${v.text}`).join("  "));
    }
  }
  const out = lines.join("\n");
  console.log(out + "\n");
  if (flags.has("--save")) {
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(join(CACHE, `${book.code}-${c}-${list.join("+")}.txt`), out);
  }
  await new Promise((r) => setTimeout(r, 300)); // 서버에 부담 주지 않게
}
