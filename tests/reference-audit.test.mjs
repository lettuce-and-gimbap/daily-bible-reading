import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { parseReference, validateVerseRef } from '../tools/commentary/reference-audit.mjs';
import { findName } from '../tools/commentary/pages.mjs';
const require = createRequire(import.meta.url);
const { composeDay } = require('../js/features/summary-data.js');
test('원문에서 빠진 절을 보완된 본문으로 잘못 취급하지 않는다', () => {
 const refs = parseReference('## 1장\n\n1 예시\n\n3 예시\n');
 assert.equal(refs.get(1).complete, false);
 assert.equal(validateVerseRef('2-4', 3), false);
 assert.equal(validateVerseRef('1, 3', 3), true);
 assert.equal(validateVerseRef('표제', 3), true);
});
test('빈 이름은 본문에 일치하지 않는다', () => assert.equal(findName('예시', ''), null));
test('여러 장을 읽어도 주요 사건 전체를 다시 볼 수 있다', () => {
 const events = Array.from({length: 8}, (_, i) => ({ title:`사건${i}`, text:'내용', verses:String(i+1) }));
 const b={code:'gen',name:'창세기'}, data={events,people:[],rels:[],places:[],line:'요약',story:'이야기'};
 const out=composeDay([{book:b,chap:1,data}],{gen:{songs:[]}});
 assert.equal(out.events.length, 4); assert.equal(out.allEvents.length,8);
 assert.equal(out.allEvents[7].title,'사건7');
 assert.match(readFileSync('js/features/summary.js','utf8'), /전체 \$\{s\.allEvents\.length\}개 보기/);
});
