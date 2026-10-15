// 그 장 주석에서 성경 본문 줄을 빼고 해설 줄만 남겨 보여 줌 (내용 검증·보강용, 토큰 절약)
//   node tools/commentary/notes.mjs <책 코드> <장>
// 해설은 현대어("~다.", "~이다", "~었다")로 쓰이고 본문은 개역개정 옛말("~니라", "~더라", "~하되")이라 줄 끝말로 가름.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
// 장 범위(예: 1-6)도 됨. 여러 장이 같은 쪽을 나눠 쓰므로 같은 줄은 한 번만. --strict면 해설로 보이는 줄만
const [book, range, flag] = process.argv.slice(2);
if (!book || !range) { console.log("사용법: node tools/commentary/notes.mjs <책 코드> <장 또는 장-장> [--strict]"); process.exit(1); }
const [lo, hi] = range.split("-").map(Number);
let raw = "";
for (let c = lo; c <= (hi || lo); c++) raw += execFileSync("node", [join(dirname(fileURLToPath(import.meta.url)), "chapter.mjs"), book, String(c)], { encoding: "utf8", maxBuffer: 1 << 26 });
const seen = new Set();
const MODERN = /(다\.|다,|이다|었다|였다|한다|된다|있다|없다|는다|준다|낸다|킨다|진다|뜻한다|의미|가리킨다|것이다|때문이다|보여|강조|암시|상징|예표|해석|저자|본문|당시|문맥|히브리어|헬라어|즉|곧,|참조|비교)/;
const BIBLE = /(니라|더라|하되|이르되|하니|하매|하시니|노라|도다|하리라|하라)\s*$/;
let out = [], series = "";
for (const line of raw.split("\n")) {
  const t = line.trim();
  if (t.startsWith("#####")) { series = t; out.push(`\n${t}`); continue; }
  if (!t || t.startsWith("===") || t.length < 12 || seen.has(t)) continue;
  seen.add(t);
  if (flag === "--strict" && !MODERN.test(t)) continue;
  if (/^[a-z]\s/.test(t) || /^[\d\s:;,.~\-]+$/.test(t)) continue; // 난외 참조
  if (BIBLE.test(t) && !MODERN.test(t)) continue;
  if (!MODERN.test(t) && /\d{1,3}[가-힣]/.test(t)) continue; // 절 번호가 붙은 본문 줄
  out.push(t);
}
console.log(out.join("\n"));
