import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const selection = [{ dataset: { ri: '0' } }, { dataset: { ri: '1' } }];
function setup() {
  const state = { verseEditions: {} };
  const env = {
    todayStr: () => '2026-11-08', state,
    $: () => ({ querySelectorAll: () => selection }),
    labelSpan: (label) => [Number(label), Number(label)],
    versesRef: (_chapter, nums) => `시험 ${nums.join(',')}`,
    CHAPTERS: [{ book: { code: 'gen' }, chap: 1 }],
    VERSION_DIVIDER: '---', persist() {},
  };
  vm.createContext(env);
  vm.runInContext(fs.readFileSync('js/features/qt.js', 'utf8'), env);
  vm.runInContext("qtPassage = { versions: ['gae', 'easy'], names: ['개역개정', '쉬운성경'], rows: [{ idx: 0, label: '1', texts: ['첫 절', '쉬운 첫 절'] }, { idx: 0, label: '2', texts: ['둘째 절'] }] };", env);
  return env;
}
test('QT 붙이기에서 고른 역본만 넣고 실제 붙인 절만 참조한다', () => {
  const env = setup();
  const first = vm.runInContext("qtPassageQuote(new Set(['gae']))[0].text", env);
  assert.equal(first, '시험 1,2\n1 첫 절\n2 둘째 절');
  const second = vm.runInContext("qtPassageQuote(new Set(['easy']))[0].text", env);
  assert.equal(second, '시험 1\n1 쉬운 첫 절');
  assert.doesNotMatch(second, /---|둘째 절/);
  const both = vm.runInContext("qtPassageQuote(new Set(['gae', 'easy']))[0].text", env);
  assert.equal(both, '시험 1,2\n1 첫 절\n2 둘째 절\n---\n1 쉬운 첫 절');
  assert.equal(env.state.verseEditions['1 쉬운 첫 절'], '쉬운성경');
});
