import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NEW_TESTAMENT_CODES,NEW_TESTAMENT_DIALOGUE_ROWS,newTestamentMonologues} from '../js/features/pixel-bible/nt-dialogue.js';
import {chapterMonologues} from '../js/features/pixel-bible/context-monologues.js';

const books=['mat','mrk','luk','jhn','act','rom','1co','2co','gal','eph','php','col','1th','2th','1ti','2ti','tit','phm','heb','jas','1pe','2pe','1jn','2jn','3jn','jud','rev'];

test('신약 27권의 모든 장에 본문 인물 색인과 연결된 개별 발화가 있다',()=>{
 const coverage=new Map();
 for(const [code,chapter,name,verses,lines] of NEW_TESTAMENT_DIALOGUE_ROWS){
  assert.equal(NEW_TESTAMENT_CODES.has(code),true,`${code}.${chapter} is a New Testament book`);
  const summary=JSON.parse(fs.readFileSync(new URL(`../data/summary/${code}.json`,import.meta.url)));
  const people=summary.chapters[String(chapter)]?.people?.map(person=>person.name)||[];
  assert.ok(people.includes(name),`${code}.${chapter} ${name} must match the chapter person index`);
  assert.match(verses,/^\d+(?:-\d+)?$/);
  assert.equal(lines.length,2,`${code}.${chapter} has two concise lines`);
  assert.ok(lines.every(line=>line.length<=110),`${code}.${chapter} has bubble-sized lines`);
  coverage.set(`${code}.${chapter}`,true);
 }
 for(const code of books){
  const chapters=Object.keys(JSON.parse(fs.readFileSync(new URL(`../data/summary/${code}.json`,import.meta.url))).chapters);
  for(const chapter of chapters) assert.ok(coverage.has(`${code}.${chapter}`),`${code}.${chapter} is covered`);
 }
});

test('신약 발화는 중복 없이 해당 인물과 장에만 나온다',()=>{
 const lines=NEW_TESTAMENT_DIALOGUE_ROWS.flatMap(row=>row[4]);
 assert.equal(new Set(lines).size,lines.length,'dialogue lines should be distinct');
 const linesForJesus=newTestamentMonologues({name:'예수'},[{code:'mat',chap:5}]);
 assert.equal(linesForJesus.length,2);
 assert.ok(linesForJesus.every(line=>line.ref==='마태복음 5:1-16'));
 assert.deepEqual(newTestamentMonologues({name:'예수'},[{code:'luk',chap:5}]),[]);
 const integrated=chapterMonologues({name:'예수'},[{code:'mat',chap:5}]);
 assert.equal(integrated.length,2,'chapter-specific lines are exposed through the existing dialogue path');
});
