import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('노트 UI의 구절을 숫자 9절로 오인하지 않는다',()=>{
 const context=vm.createContext({document:{addEventListener(){},documentElement:{}},MutationObserver:class{observe(){}}});
 vm.runInContext(fs.readFileSync('js/core/explanation-numbers.js','utf8'),context);
 const format=context.formatExplanationNumbers;
 for(const text of ['구절 골라 복사 · 지우기','위 구절 · 기도 메모 칸','아직 표시한 구절이 없어요.','구절을 바로 넣을 수 있어요.','역대상 16장 9절'])assert.equal(format(text),text);
 assert.equal(format('세 명'), '3명');
});
