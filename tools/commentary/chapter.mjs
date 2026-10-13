// 한 장의 주석 쪽(OCR)을 시리즈별로 보여 줌. 요약을 쓰기 전에 사실 확인용으로 읽는다(옮겨 적지 않음).
//   node tools/commentary/chapter.mjs rut 1        (장 0 = 서론)
import { loadBook, chapterText } from "./pages.mjs";

const [code, chapArg] = process.argv.slice(2);
if (!code) { console.log("사용법: node tools/commentary/chapter.mjs <책 코드> <장>"); process.exit(1); }
const chap = Number(chapArg || 0);
const series = loadBook(code);
if (!series.length) { console.log("OCR 결과가 없어요. 먼저 node tools/commentary/ocr.mjs"); process.exit(1); }
for (const s of chapterText(series, chap)) {
  console.log(`\n##### ${s.series} — ${s.pages.map((p) => p.page).join(", ") || "해당 쪽 없음"}`);
  for (const p of s.pages) console.log(`\n=== p.${p.page} [${p.chaps.join(",")}장]\n${p.text}`);
}
