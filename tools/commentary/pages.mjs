// OCR 텍스트(권별)를 쪽으로 나누고, 쪽 머리글("룻기 2장", "룻기 2•3장", "시편 23편")로 어느 장인지 붙인다.
// 머리글이 없는 쪽(각주만 있는 쪽 등)은 앞쪽의 장을 이어받는다. 첫 머리글 전 쪽은 서론(0장).
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { OCR_CACHE } from "./ocr.mjs";

const require = createRequire(import.meta.url);
export const { BOOKS } = require("../../js/core/bible.js");

export function bookByCode(code) {
  return BOOKS.find((b) => b.code === code);
}

// 머리글 후보: 쪽 처음 세 줄과 마지막 줄 중 짧은 줄에서 "N장" / "N•M장" / "N편"
const HEAD = /(\d{1,3})\s*(?:[•·・.,~\-]\s*(\d{1,3}))?\s*[장편]/;

// 본문이 시작하는 쪽: 첫머리에 책 이름만 있는 줄(OCR 오타 한 글자까지)이 있고 서론·개론 쪽이 아님
function isBookStart(p, bookName) {
  const head = p.lines.slice(0, 3);
  if (head.some((l) => /서\s*[론문]|개\s*[론관]/.test(l))) return false;
  return head.some((l) => {
    const t = l.replace(/[\s\d|]/g, "");
    if (!t || t.length > bookName.length + 1) return false;
    const hit = [...bookName].filter((ch) => t.includes(ch)).length;
    return hit >= Math.max(1, bookName.length - 1);
  });
}

export function splitPages(text, maxChap, bookName = "") {
  const pages = [];
  let cur = null;
  let last = [0];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^=== p\.(\d+)/);
    if (m) { cur = { page: Number(m[1]), lines: [] }; pages.push(cur); continue; }
    if (cur && line.trim()) cur.lines.push(line.trim());
  }
  for (const p of pages) {
    const cands = [...p.lines.slice(0, 3), p.lines[p.lines.length - 1] || ""].filter((l) => l.length <= 24);
    let chaps = null;
    for (const l of cands) {
      const h = l.match(HEAD);
      if (!h) continue;
      const a = Number(h[1]), b = Number(h[2] || h[1]);
      if (a < 1 || b < a || b > maxChap || b - a > 3) continue;
      // 장은 앞으로만 나아감. 앞쪽보다 작거나 너무 건너뛰면 OCR이 숫자를 잘못 읽은 것("1장"→"17장")
      if (last[0] > 0 && (a < last[0] || a > last[last.length - 1] + 3)) continue;
      chaps = []; for (let c = a; c <= b; c++) chaps.push(c);
      break;
    }
    if (!chaps && last.length === 1 && last[0] === 0 && bookName && isBookStart(p, bookName)) chaps = [1];
    p.chaps = chaps || last;
    last = p.chaps;
    p.text = p.lines.join("\n");
  }
  return pages;
}

// 그 권의 OCR 파일들(시리즈별) → [{ series, pages }]
export function loadBook(code) {
  const book = bookByCode(code);
  if (!book) throw new Error(`모르는 책 코드: ${code}`);
  const num = String(book.index + 1).padStart(2, "0");
  if (!existsSync(OCR_CACHE)) return [];
  return readdirSync(OCR_CACHE)
    .filter((f) => f.endsWith(`_${num}.txt`))
    .map((f) => ({ series: f.replace(`_${num}.txt`, ""), pages: splitPages(readFileSync(join(OCR_CACHE, f), "utf8"), book.chapters, book.name) }));
}

// 그 장 쪽들의 글 (시리즈마다)
// 머리글을 못 읽어 그 장 쪽이 비면 앞뒤 장 쪽을 대신 씀
export function chapterText(series, chap) {
  return series.map((s) => {
    let pages = s.pages.filter((p) => p.chaps.includes(chap));
    if (!pages.length && chap > 0) pages = s.pages.filter((p) => p.chaps.includes(chap - 1) || p.chaps.includes(chap + 1));
    if (!pages.length && chap > 0) {
      // 머리글을 여러 장 연달아 못 읽은 경우: 이 장보다 뒤 장이 처음 나오는 쪽과 그 앞 두 쪽
      const i = s.pages.findIndex((p) => p.chaps[0] > chap);
      if (i > 0) pages = s.pages.slice(Math.max(0, i - 2), i + 1);
    }
    return { series: s.series, pages };
  });
}

// 띄어쓰기를 무시하고 찾음. 3글자 이상 이름은 OCR 오타 한 글자까지 봐 줌
export function findName(hay, name) {
  const h = hay.replace(/\s+/g, ""), n = name.replace(/\s+/g, "");
  if (h.includes(n)) return "exact";
  if (n.length >= 3) {
    for (let i = 0; i + n.length <= h.length; i++) {
      let diff = 0;
      for (let j = 0; j < n.length && diff <= 1; j++) if (h[i + j] !== n[j]) diff++;
      if (diff <= 1) return "fuzzy";
    }
  }
  return null;
}
