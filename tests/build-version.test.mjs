import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// 앱 버전은 index.html의 js/main.js ?v= 값이 기준이다. 변경 기록(changelog)의 맨 앞 버전과,
// 모듈 import·스타일 주소에 붙은 버전 값도 같아야 한다. 어긋나면 이 테스트가 알려 준다.
const root = new URL('../', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), 'utf8');
const SEMVER_Q = /\?v=(\d+\.\d+\.\d+)/g;

const indexHtml = read('index.html');
const mainVersion = indexHtml.match(/js\/main\.js\?v=(\d+\.\d+\.\d+)/)?.[1];

test('index.html의 main.js 버전이 있고 변경 기록의 최신 버전과 같다', () => {
  assert.ok(mainVersion, 'index.html에 js/main.js?v=<버전>이 있어야 함');
  const changelog = JSON.parse(read('data/changelog.json'));
  assert.equal(changelog[0].ver, mainVersion);
});

test('index.html의 스크립트·스타일 버전 기준이 모두 같은 앱 버전이다', () => {
  const found = [...indexHtml.matchAll(SEMVER_Q)].map((m) => m[1]);
  assert.ok(found.length > 0);
  for (const v of found) assert.equal(v, mainVersion);
});

test('js 폴더 안의 모듈 import 버전도 앱 버전과 같다', () => {
  const files = fs.readdirSync(new URL('js/', root), { recursive: true })
    .map(String)
    .filter((p) => p.endsWith('.js') && !p.includes('vendor'));
  const stale = [];
  for (const f of files) {
    for (const m of read(`js/${f.replaceAll('\\', '/')}`).matchAll(SEMVER_Q)) {
      if (m[1] !== mainVersion) stale.push(`${f} ?v=${m[1]}`);
    }
  }
  assert.deepEqual(stale, []);
});
