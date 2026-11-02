import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/shared/error-log.js', import.meta.url), 'utf8');

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _data: data,
  };
}

// 브라우저 전역(window, document, location)을 흉내 내서 파일을 실행
function loadInBrowser(storage) {
  const listeners = {};
  const sandbox = {
    window: {
      localStorage: storage,
      addEventListener: (type, fn) => { listeners[type] = fn; },
    },
    document: { querySelector: () => ({ src: 'http://x/js/main.js?v=10.10.3' }) },
    location: { hash: '#today', pathname: '/' },
    console,
  };
  sandbox.window.document = sandbox.document;
  vm.runInNewContext(source, sandbox);
  return { listeners, api: sandbox.window.ErrorLog };
}

test('오류가 나면 기기 저장소에 최근 기록으로 남는다', () => {
  const storage = memoryStorage();
  const { listeners, api } = loadInBrowser(storage);
  listeners.error({ error: new Error('boom'), filename: 'a.js', lineno: 12 });
  listeners.unhandledrejection({ reason: 'nope' });
  const rows = api.recent();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].kind, 'error');
  assert.equal(rows[0].message, 'boom');
  assert.equal(rows[0].where, 'a.js:12');
  assert.equal(rows[0].version, '10.10.3');
  assert.equal(rows[1].kind, 'rejection');
  assert.equal(rows[1].message, 'nope');
});

test('기록은 최대 개수를 넘지 않고 오래된 것부터 빠진다', () => {
  const storage = memoryStorage();
  const { listeners, api } = loadInBrowser(storage);
  for (let i = 0; i < 40; i++) listeners.error({ message: `e${i}` });
  const rows = api.recent();
  assert.equal(rows.length, 30);
  assert.equal(rows[0].message, 'e10');
  assert.equal(rows.at(-1).message, 'e39');
});

test('저장이 깨져 있어도 앱이 멈추지 않고 빈 기록으로 본다', () => {
  const storage = memoryStorage({ errorLog: '{not json' });
  storage.setItem = () => { throw new Error('quota'); };
  const { listeners, api } = loadInBrowser(storage);
  assert.equal(api.recent().length, 0);
  assert.doesNotThrow(() => listeners.error({ message: 'x' }));
});

test('긴 메시지는 잘라서 저장한다', () => {
  const storage = memoryStorage();
  const { listeners, api } = loadInBrowser(storage);
  listeners.error({ message: '가'.repeat(1000) });
  assert.equal(api.recent()[0].message.length, 300);
});
