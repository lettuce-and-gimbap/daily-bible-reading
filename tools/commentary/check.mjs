// 장별 요약 파일 검사: 서식·글자 수·관계 이름·대표 이름 + 인물·지명이 그 장 주석(OCR)에 나오는지
//   node tools/commentary/check.mjs            전체
//   node tools/commentary/check.mjs rut 1sa    몇 권만
// 오류(✗)가 있으면 종료 코드 1. 경고(△)는 직접 보고 판단.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { BOOKS, bookByCode, loadBook, chapterText, findName } from "./pages.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const dataDir = join(root, "data/summary");
const require = createRequire(import.meta.url);
const { composeDay } = require("../../js/features/summary-data.js");
const { aliases } = JSON.parse(readFileSync(join(here, "names.json"), "utf8"));
// 대표 이름 → 본문에 나올 수 있는 다른 이름들 (아브라함 → 아브람)
const otherNames = {};
for (const [alt, main] of Object.entries(aliases)) (otherNames[main] = otherNames[main] || []).push(alt.replace(/(.*)/, "").trim());

const TYPES = ["story", "law", "list", "poem", "wisdom", "prophecy", "letter", "vision"];
const KINDS = ["family", "ally", "conflict", "other"];
// 하나님은 본문에 "여호와"·"하나님"·"주" 등으로 나와 글자 대조에서 뺀다
const SKIP_LOOKUP = new Set(["하나님", "예수", "성령"]);
const LIMIT = { line: 80, story: 300, role: 24, label: 10, eventTitle: 18, eventText: 70, where: 30, what: 50, why: 40 };

const only = process.argv.slice(2);
const files = existsSync(dataDir) ? readdirSync(dataDir).filter((f) => f.endsWith(".json")) : [];
let errors = 0, warns = 0, chapters = 0;
const out = [];
const err = (where, msg) => { errors++; out.push(`  ✗ ${where} ${msg}`); };
const warn = (where, msg) => { warns++; out.push(`  △ ${where} ${msg}`); };
const len = (s) => [...String(s || "")].length;

for (const f of files) {
  const code = f.replace(".json", "");
  if (only.length && !only.includes(code)) continue;
  const book = bookByCode(code);
  out.push(`■ ${f}`);
  if (!book) { err("", "모르는 책 코드"); continue; }
  let data;
  try { data = JSON.parse(readFileSync(join(dataDir, f), "utf8")); } catch (e) { err("", `JSON 오류: ${e.message}`); continue; }
  if (data.book !== code) err("", `book 칸이 "${data.book}"`);
  if (!Array.isArray(data.songs) || data.songs.length < 2) warn("songs", "찬양이 2곡 미만");
  (data.songs || []).forEach((s, i) => {
    if (!s.title || !s.artist) err(`songs[${i}]`, "제목·아티스트 없음");
    if (len(s.why) > LIMIT.why) warn(`songs[${i}]`, `why ${len(s.why)}자`);
  });
  const ocr = loadBook(code);
  if (!ocr.length) warn("", "주석 OCR이 없어 이름 대조를 건너뜀");
  const bookText = ocr.flatMap((s) => s.pages.map((p) => p.text)).join("\n");

  for (const [chapKey, c] of Object.entries(data.chapters || {})) {
    const chap = Number(chapKey);
    const at = `${book.name} ${chap}장`;
    chapters++;
    if (!(chap >= 1 && chap <= book.chapters)) { err(at, "없는 장"); continue; }
    if (!TYPES.includes(c.type)) err(at, `type "${c.type}"`);
    if (!c.line || len(c.line) > LIMIT.line) err(at, `line ${len(c.line)}자 (1~${LIMIT.line})`);
    if (!c.story || len(c.story) > LIMIT.story) err(at, `story ${len(c.story)}자 (1~${LIMIT.story})`);
    const events = c.events || [];
    if (events.length < 2 || events.length > 5) warn(at, `사건 ${events.length}개 (2~5)`);
    let lastStart = 0;
    events.forEach((e, i) => {
      const w = `${at} 사건${i + 1}`;
      if (!e.title || len(e.title) > LIMIT.eventTitle) err(w, `title ${len(e.title)}자`);
      if (!e.text || len(e.text) > LIMIT.eventText) err(w, `text ${len(e.text)}자`);
      const m = /^(\d{1,3})(?:-(\d{1,3}))?$/.exec(e.verses || "");
      if (!m) err(w, `verses "${e.verses}" ("1-5" 또는 "7")`);
      else {
        if (m[2] && Number(m[2]) < Number(m[1])) err(w, `verses 거꾸로 "${e.verses}"`);
        if (Number(m[1]) < lastStart) warn(w, "사건이 장 순서대로가 아님");
        lastStart = Number(m[1]);
      }
    });
    const people = c.people || [];
    const names = new Set();
    people.forEach((p) => {
      if (!p.name) return err(at, "이름 없는 인물");
      if (names.has(p.name)) err(at, `인물 중복 "${p.name}"`);
      names.add(p.name);
      if (aliases[p.name]) err(at, `"${p.name}" → 대표 이름 "${aliases[p.name]}"로`);
      if (len(p.role) > LIMIT.role) err(at, `${p.name} role ${len(p.role)}자`);
      if (![1, 2, 3].includes(p.weight)) err(at, `${p.name} weight ${p.weight}`);
    });
    if (c.type === "story" && people.length < 2) warn(at, "이야기 장인데 인물 2명 미만");
    const rels = c.rels || [];
    if (c.type === "story" && people.length >= 3 && rels.length < 3) warn(at, `관계 ${rels.length}개 (이야기 장은 3~6개)`);
    rels.forEach((r) => {
      const w = `${at} 관계 ${r.from}→${r.to}`;
      if (!names.has(r.from) || !names.has(r.to)) err(w, "people에 없는 이름");
      if (r.from === r.to) err(w, "자기 자신");
      if (!r.label || len(r.label) > LIMIT.label) err(w, `label ${len(r.label)}자`);
      if (!KINDS.includes(r.kind)) err(w, `kind "${r.kind}"`);
      if (typeof r.directed !== "boolean") err(w, "directed는 true/false");
      if (![1, 2, 3].includes(r.weight)) err(w, `weight ${r.weight}`);
    });
    (c.places || []).forEach((p) => {
      const w = `${at} 지역 ${p.name}`;
      if (!p.name) return err(at, "이름 없는 지역");
      if (aliases[p.name]) err(w, `→ 대표 이름 "${aliases[p.name]}"로`);
      if (!p.where || len(p.where) > LIMIT.where) err(w, `where ${len(p.where)}자`);
      if (!p.what || len(p.what) > LIMIT.what) err(w, `what ${len(p.what)}자`);
      if (![1, 2, 3].includes(p.weight)) err(w, `weight ${p.weight}`);
    });

    // 주석 대조: 그 장 쪽 → 없으면 같은 권 다른 쪽
    if (ocr.length) {
      const hay = chapterText(ocr, chap).flatMap((s) => s.pages.map((p) => p.text)).join("\n");
      const lookups = [...people.map((p) => ["인물", p.name]), ...(c.places || []).map((p) => ["지역", p.name])];
      for (const [kind, name] of lookups) {
        if (SKIP_LOOKUP.has(name)) continue;
        const hit = [name, ...(otherNames[name] || [])].map((n) => findName(hay, n)).sort((a, b) => (a === "exact" ? -1 : b === "exact" ? 1 : a ? -1 : 1))[0];
        if (hit === "exact") continue;
        if (hit === "fuzzy") { warn(at, `${kind} "${name}" 주석에 비슷한 글자만 있음(OCR 오타일 수 있음)`); continue; }
        warn(at, findName(bookText, name) ? `${kind} "${name}" 이 장 쪽엔 없고 같은 권 다른 쪽에 있음` : `${kind} "${name}" 주석에 없음`);
      }
    }
  }
}

// 합치기 시험: 각 권 처음부터 5장씩 묶어 합쳐 봄(오류가 나지 않는지만)
for (const f of files) {
  const code = f.replace(".json", "");
  if (only.length && !only.includes(code)) continue;
  try {
    const data = JSON.parse(readFileSync(join(dataDir, f), "utf8"));
    const book = bookByCode(code);
    const keys = Object.keys(data.chapters || {}).map(Number).sort((a, b) => a - b);
    for (let i = 0; i < keys.length; i += 5) {
      composeDay(keys.slice(i, i + 5).map((k) => ({ book, chap: k, data: data.chapters[k] })), { [code]: data });
    }
  } catch (e) { err(f, `합치기 실패: ${e.message}`); }
}

console.log(out.join("\n"));
console.log(`\n${chapters}장 검사 · 오류 ${errors} · 경고 ${warns}  (전체 ${BOOKS.reduce((n, b) => n + b.chapters, 0)}장 중)`);
process.exit(errors ? 1 : 0);
