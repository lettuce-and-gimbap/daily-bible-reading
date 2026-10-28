import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const library = JSON.parse(await readFile(new URL('../data/pixel-bible/reference-library.json', import.meta.url), 'utf8'));

test('픽셀 제작 자료실은 기능별 분류와 활용 설명이 모두 갖춰져 있다', () => {
  assert.equal(library.schemaVersion, 1);
  assert.ok(library.categories.length >= 5);
  assert.ok(library.references.length >= 25);
  const categoryIds = new Set(library.categories.map(({ id }) => id));
  const referenceIds = new Set();
  for (const item of library.references) {
    assert.ok(categoryIds.has(item.category), `${item.id} 분류가 존재해야 함`);
    assert.ok(!referenceIds.has(item.id), `${item.id} 중복 ID`);
    referenceIds.add(item.id);
    assert.match(item.url, /^https:\/\//);
    for (const field of ['title', 'summary', 'pixelBibleUse', 'sourceType', 'access', 'license', 'checkedAt']) {
      assert.ok(item[field]?.trim(), `${item.id} ${field} 설명이 필요함`);
    }
    assert.ok(item.tags.length > 0, `${item.id} 검색 태그가 필요함`);
  }
});

test('픽셀 자료실 관리 화면 연결과 검색·외부 링크 안전 속성을 유지한다', async () => {
  const stats = await readFile(new URL('../js/features/stats.js', import.meta.url), 'utf8');
  const account = await readFile(new URL('../js/features/account.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../css/stats.css', import.meta.url), 'utf8');
  const serviceWorker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(stats, /data-stats-page="pixel-library"/);
  assert.match(stats, /isAdminUser\(\) \? `?<button type="button" class="stats-page-link" data-stats-page="pixel-library"/);
  assert.match(stats, /\["pixel-library", "reminder-admin"\]\.includes\(page\) && !isAdminUser\(\)/);
  assert.match(account, /window\.isAdminAccount = isAdmin/);
  assert.match(stats, /data\/pixel-bible\/reference-library\.json/);
  assert.match(stats, /data-reference-search/);
  assert.match(stats, /target="_blank" rel="noopener noreferrer"/);
  assert.match(styles, /\.pixel-reference-library[^\n]*overflow-wrap:anywhere/);
  assert.match(styles, /\.pixel-reference-card h3[^\n]*overflow-wrap:anywhere/);
  assert.match(serviceWorker, /reference-library\\\.json/);
});
