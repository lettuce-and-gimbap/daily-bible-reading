// 대조용 원문은 저장소 밖에 두고, 절 번호만 검사한다. 해석이나 사실 검증을 대신하지 않는다.
// 사용: node tools/commentary/reference-audit.mjs "<원문_md 폴더>"
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BOOKS } from './pages.mjs';

export function parseReference(text) {
  const headings = [...text.matchAll(/^##\s+(\d{1,3})장\s*$/gm)];
  const chapters = new Map();
  for (let i = 0; i < headings.length; i++) {
    const chapter = Number(headings[i][1]);
    if (chapters.has(chapter)) throw new Error(`중복 장 ${chapter}`);
    const body = text.slice(headings[i].index + headings[i][0].length, headings[i + 1]?.index ?? text.length);
    const verses = [...body.matchAll(/^(\d{1,3})\s+/gm)].map(m => Number(m[1]));
    const complete = verses.length > 0 && !verses.some((v, n) => v !== n + 1);
    chapters.set(chapter, { max: verses.at(-1) || 0, complete });
  }
  return chapters;
}
export function validateVerseRef(verseRef, max) {
  if (verseRef === '표제') return true;
  const v = String(verseRef || '').replace(/^표제, /, '');
  if (!/^\d{1,3}(?:-\d{1,3})?(?:, \d{1,3}(?:-\d{1,3})?)*$/.test(v)) return false;
  return v.split(', ').every(part => { const [a, z = a] = part.split('-').map(Number); return a >= 1 && a <= z && z <= max; });
}
export function auditReferences(folder) {
  const files = readdirSync(folder), issues = [], missing = [], partial = [];
  const countsSource = readFileSync(new URL('../../js/core/versecounts.js', import.meta.url), 'utf8');
  const countsMatch = countsSource.match(/const VERSE_COUNTS\s*=\s*\[([^\]]+)\]/);
  if (!countsMatch) throw new Error('갓피아 기준 절 수를 읽지 못했습니다');
  const verseCounts = countsMatch[1].split(',').map(Number);
  if (verseCounts.length !== BOOKS.reduce((n, b) => n + b.chapters, 0) || verseCounts.some(n => !Number.isInteger(n) || n < 1)) throw new Error('절 수 배열이 올바르지 않습니다');
  let chapters = 0, events = 0, relations = 0;
  let offset = 0;
  for (const b of BOOKS) {
    const start = offset; offset += b.chapters;
    const matches = files.filter(f => f.startsWith('개역개정4판_') && f.includes(`_${b.code}_`) && f.endsWith('.md'));
    if (matches.length !== 1) { missing.push(`${b.code}: 파일 ${matches.length}개`); continue; }
    let ref;
    try { ref = parseReference(readFileSync(join(folder, matches[0]), 'utf8')); }
    catch (e) { issues.push(`${b.code}: ${e.message}`); continue; }
    if (ref.size !== b.chapters || [...ref.keys()].some((n, i) => n !== i + 1)) { issues.push(`${b.code}: 장 구성 ${ref.size}/${b.chapters}`); continue; }
    const data = JSON.parse(readFileSync(new URL(`../../data/summary/${b.code}.json`, import.meta.url), 'utf8'));
    for (const [chapter, info] of ref) {
      chapters++;
      const max = info.complete ? info.max : verseCounts[start + chapter - 1];
      if (!info.complete) partial.push(`${b.code} ${chapter}: 원문 누락; 갓피아 기준 기존 절 수 ${max}로 범위만 대조`);
      const c = data.chapters[chapter];
      if (!c) { issues.push(`${b.code} ${chapter}: 요약 누락`); continue; }
      for (const e of c.events || []) { events++; if (!validateVerseRef(e.verses, max)) issues.push(`${b.code} ${chapter}: 사건 ${e.verses}, 마지막 절 ${max}`); }
      for (const r of c.rels || []) if (r.note) { relations++; if (!validateVerseRef(r.verses, max)) issues.push(`${b.code} ${chapter}: 관계 ${r.verses}, 마지막 절 ${max}`); }
    }
  }
  return { books: BOOKS.length - missing.length, chapters, events, relations, missing, issues, partial };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const folder = process.argv[2] || process.env.BIBLE_REFERENCE_DIR;
  if (!folder) { console.error('원문 폴더 경로를 인자 또는 BIBLE_REFERENCE_DIR로 지정하세요.'); process.exitCode = 2; }
  else try {
    const result = auditReferences(folder);
    console.log(`개역개정 4판 로컬 원문: ${result.books}권 · ${result.chapters}장 · 사건 ${result.events}건 · 관계 ${result.relations}건의 절 범위 검사`);
    for (const issue of [...result.missing, ...result.issues]) console.log(`  ✗ ${issue}`);
    for (const issue of result.partial) console.log(`  △ ${issue}`);
    console.log(`미확인 ${result.missing.length}권 · 범위/형식 문제 ${result.issues.length}건`);
    console.log(`원문이 불완전하여 별도 절 수로만 대조한 장 ${result.partial.length}개`);
    console.log('주의: 절 범위 확인은 본문 내용이나 신학적 해석의 정확성을 검증하지 않습니다.');
    if (result.missing.length || result.issues.length) process.exitCode = 1;
  } catch (e) { console.error(`원문 확인 실패: ${e.message}`); process.exitCode = 2; }
}
