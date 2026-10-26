import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NEW_TESTAMENT_CODES,NEW_TESTAMENT_DIALOGUE_ROWS,newTestamentMonologues} from '../js/features/pixel-bible/nt-dialogue.js';
import {chapterMonologues} from '../js/features/pixel-bible/context-monologues.js';
import {PAIR_DIALOGUE} from '../js/features/pixel-bible/pair-dialogue.js';
import {chapterPeople} from '../js/features/pixel-bible/chapter-people.js';

const books=['mat','mrk','luk','jhn','act','rom','1co','2co','gal','eph','php','col','1th','2th','1ti','2ti','tit','phm','heb','jas','1pe','2pe','1jn','2jn','3jn','jud','rev'];

test('신약 27권의 모든 장에 본문 인물 색인과 연결된 개별 발화가 있다',()=>{
 const coverage=new Map();
 for(const [code,chapter,name,verses,lines,_emotion,lineRefs] of NEW_TESTAMENT_DIALOGUE_ROWS){
  assert.equal(NEW_TESTAMENT_CODES.has(code),true,`${code}.${chapter} is a New Testament book`);
  const summary=JSON.parse(fs.readFileSync(new URL(`../data/summary/${code}.json`,import.meta.url)));
  const people=summary.chapters[String(chapter)]?.people?.map(person=>person.name)||[];
  assert.ok(people.includes(name),`${code}.${chapter} ${name} must match the chapter person index`);
  assert.match(verses,/^\d+(?:-\d+)?$/);
  assert.ok(lines.length>=1,`${code}.${chapter} has a concise contextual line`);
  if(lineRefs){
   assert.equal(lineRefs.length,lines.length,`${code}.${chapter} gives each line its own reference`);
   for(const ref of lineRefs){assert.match(ref,/^\d+(?:-\d+)?$/);assert.ok(ref.split('-').every(part=>Number(part)<=Number(verses.split('-').at(-1))),`${code}.${chapter} line reference stays inside its chapter range`);}
  }
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
 assert.equal(linesForJesus.length,3);
 assert.ok(linesForJesus.every(line=>line.ref.startsWith('마태복음 5:')));
 assert.deepEqual(newTestamentMonologues({name:'예수'},[{code:'luk',chap:5}]),[]);
 const integrated=chapterMonologues({name:'예수'},[{code:'mat',chap:5}]);
 assert.equal(integrated.length,3,'chapter-specific lines are exposed through the existing dialogue path');
});

test('마태복음의 발화별 근거가 개별 구절로 유지된다',()=>{
 const joseph=newTestamentMonologues({name:'요셉'},[{code:'mat',chap:1}]);
 assert.deepEqual(joseph.map(line=>line.ref),['마태복음 1:19','마태복음 1:24','마태복음 1:25']);
 const john=newTestamentMonologues({name:'세례 요한'},[{code:'mat',chap:11}]);
 assert.ok(john.every(line=>line.ref.startsWith('마태복음 11:')));
});

test('마가복음 각 장의 새 발화도 문장별 근거 범위를 갖는다',()=>{
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='mrk');
 assert.equal(new Set(rows.map(row=>row[1])).size,16);
 assert.ok(rows.every(row=>row[6]?.length===row[4].length));
 for(const row of rows){
  const [,,name,,texts,,refs]=row;
  const lines=newTestamentMonologues({name},[{code:'mrk',chap:row[1]}]);
  assert.ok(lines.length>=texts.length);
  for(const ref of refs)assert.ok(lines.some(line=>line.ref===`마가복음 ${row[1]}:${ref}`),`mrk.${row[1]} ${name}: ${ref}`);
 }
});

test('마태복음과 마가복음의 주요 대면 문답은 장면의 두 화자와 구절에 맞게 연결된다',()=>{
 const cases=[
  ['mat.3','세례 요한','예수'],['mat.4','예수','마귀'],['mat.14','베드로','예수'],
  ['mat.15','가나안 여인','예수'],['mat.16','베드로','예수'],['mat.19','부자 청년','예수'],
  ['mat.26','가룟 유다','예수'],['mat.27','빌라도','예수'],
  ['mrk.5','군대 귀신 들린 사람','예수'],['mrk.6','헤롯','헤로디아의 딸'],
  ['mrk.7','수로보니게 여인','예수'],['mrk.8','예수','베드로'],
  ['mrk.9','예수','아이의 아버지'],['mrk.10','바디매오','예수'],['mrk.15','빌라도','예수']
 ];
 for(const [chapter,speaker,target] of cases){
  const entry=PAIR_DIALOGUE.find(pair=>pair.chapter===chapter&&pair.speaker===speaker&&pair.target===target);
  assert.ok(entry,`${chapter}: ${speaker} ↔ ${target}`);
  assert.ok(entry.ref.startsWith(chapter.startsWith('mat.')?'마태복음 ':'마가복음 '));
  assert.ok(entry.lines.length>0&&entry.replyLines.length>0);
  assert.ok(entry.lines.every(line=>!/(말했다|대답했다|묻자|보았다|돌아섰다)$/.test(line)),`${chapter} includes spoken lines only`);
 }
 for(const [chapter,speaker,target] of cases){
  const book=JSON.parse(fs.readFileSync(new URL(`../data/summary/${chapter.split('.')[0]}.json`,import.meta.url)));
  const people=book.chapters[chapter.split('.')[1]].people.map(person=>person.name);
  assert.ok(people.includes(speaker),`${chapter} speaker is indexed`);
  assert.ok(people.includes(target),`${chapter} target is indexed`);
 }
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/mat.json',import.meta.url)));
 const absentByReference={1:['아브라함','다윗','다말·라합·룻'],2:['아켈라오'],11:['엘리야'],12:['요나'],16:['사탄'],19:['모세'],21:['스가랴'],22:['가이사','다윗'],23:['선지자들','사가랴'],24:['노아']};
 for(const [chapter,names] of Object.entries(absentByReference)){
  const cast=chapterPeople(summary.chapters[chapter],{code:'mat',chap:Number(chapter)}).map(person=>person.name);
  for(const name of names)assert.ok(!cast.includes(name),`mat.${chapter} reference ${name} is not staged as a scene character`);
 }
 const mrk=JSON.parse(fs.readFileSync(new URL('../data/summary/mrk.json',import.meta.url)));
 const absentMark={2:['다윗'],7:['이사야'],8:['헤롯','사탄'],11:['세례 요한'],12:['다윗'],13:['거짓 그리스도']};
 for(const [chapter,names] of Object.entries(absentMark)){
  const cast=chapterPeople(mrk.chapters[chapter],{code:'mrk',chap:Number(chapter)}).map(person=>person.name);
  for(const name of names)assert.ok(!cast.includes(name),`mrk.${chapter} reference ${name} is not staged as a scene character`);
 }
});
