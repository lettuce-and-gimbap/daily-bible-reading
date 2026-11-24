import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('실제 성경 권만 검사하고 관계와 절 표기가 유효하다', () => {
  const run = spawnSync(process.execPath, ['tools/commentary/check.mjs'], { encoding: 'utf8', maxBuffer: 10_000_000 });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /1189장 검사 · 오류 0/);
});
test('존재하지 않는 권 코드 입력은 오류로 남는다', () => {
  const run = spawnSync(process.execPath, ['tools/commentary/check.mjs', 'nah'], { encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.match(run.stdout, /모르는 책 코드/);
});
test('다른 장에 근거한 관계는 현재 장 구절과 설명을 유지한다', () => {
  const book = JSON.parse(readFileSync('data/summary/rut.json', 'utf8'));
  const rel = book.chapters['1'].rels.find(r => r.from === '말론' && r.to === '룻');
  assert.equal(rel.verses, '4-5');
  assert.match(rel.note, /4:10/);
});
