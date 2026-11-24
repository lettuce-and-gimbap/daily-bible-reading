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
test('주석이 없으면 미실시 상태를 분명히 표시한다', () => {
  const run = spawnSync(process.execPath, ['tools/commentary/check.mjs', 'gen'], {
    encoding: 'utf8', env: { ...process.env, OCR_CACHE: 'path-that-does-not-exist-for-this-test' }
  });
  assert.equal(run.status, 0);
  assert.match(run.stdout, /주석 OCR이 없는 1권은 인명·지명 주석 대조를 수행하지 않았습니다/);
});
test('본문에 없는 인물을 개수 기준으로 강제하지 않는다', () => {
  const run = spawnSync(process.execPath, ['tools/commentary/check.mjs', 'exo', '2ch', 'est'], {
    encoding: 'utf8', env: { ...process.env, OCR_CACHE: 'path-that-does-not-exist-for-this-test' }
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.doesNotMatch(run.stdout, /인물 2명 미만|관계 2개 \(이야기 장/);
  const exo = JSON.parse(readFileSync('data/summary/exo.json', 'utf8'));
  assert.deepEqual(exo.chapters['37'].people.map(p => p.name), ['브살렐']);
});
test('검토한 욥기·시편·잠언은 다른 교단의 주석 링크 대신 개역개정 본문을 가리킨다', () => {
  for (const file of ['job-study.json', 'pro-study.json', 'psa-study-1.json', 'psa-study-2.json', 'psa-study-3.json']) {
    const source = readFileSync(`data/summary/${file}`, 'utf8');
    assert.doesNotMatch(source, /bible\.usccb\.org/);
    assert.match(source, /bible\.bskorea\.or\.kr\/bible\/NKRV\//);
  }
});
test('다른 장에 근거한 관계는 현재 장 구절과 설명을 유지한다', () => {
  const book = JSON.parse(readFileSync('data/summary/rut.json', 'utf8'));
  const rel = book.chapters['1'].rels.find(r => r.from === '말론' && r.to === '룻');
  assert.equal(rel.verses, '4-5');
  assert.match(rel.note, /4:10/);
});
