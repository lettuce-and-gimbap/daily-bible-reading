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
  const ranges=verses.split(',').map(value=>value.trim());
  assert.ok(ranges.every(range=>/^\d+(?:-\d+)?$/.test(range)),`${code}.${chapter} has valid verse bounds`);
  assert.ok(lines.length>=1,`${code}.${chapter} has a concise contextual line`);
  if(lineRefs){
   assert.equal(lineRefs.length,lines.length,`${code}.${chapter} gives each line its own reference`);
   for(const ref of lineRefs){
    for(const part of ref.split(',').map(value=>value.trim())){
     assert.match(part,/^\d+(?:-\d+)?$/);
     const [lineStart,lineEnd= lineStart]=part.split('-').map(Number);
     assert.ok(ranges.some(range=>{const [start,end=start]=range.split('-').map(Number);return lineStart>=start&&lineEnd<=end;}),`${code}.${chapter} line reference stays inside its chapter range`);
    }
   }
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
 const lines=NEW_TESTAMENT_DIALOGUE_ROWS.flatMap(row=>row[4].map(line=>`${row[0]}.${row[1]}:${row[2]}:${line}`));
 assert.equal(new Set(lines).size,lines.length,'the same speaker should not have duplicate lines in the same chapter');
 const linesForJesus=newTestamentMonologues({name:'예수'},[{code:'mat',chap:5}]);
 assert.equal(linesForJesus.length,5);
 assert.ok(linesForJesus.every(line=>line.ref.startsWith('마태복음 5:')));
 assert.deepEqual(newTestamentMonologues({name:'예수'},[{code:'luk',chap:5}]).map(line=>line.ref),['누가복음 5:4,10','누가복음 5:13-14','누가복음 5:20,24','누가복음 5:31-32']);
 const integrated=chapterMonologues({name:'예수'},[{code:'mat',chap:5}]);
 assert.equal(integrated.length,5,'chapter-specific lines are exposed through the existing dialogue path');
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

test('누가복음 각 장의 새 발화도 문장별 근거 범위를 갖는다',()=>{
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='luk');
 assert.equal(new Set(rows.map(row=>row[1])).size,24);
 assert.ok(rows.every(row=>row[6]?.length===row[4].length));
 for(const row of rows){
  const [,,name,,texts,,refs]=row;
  const lines=newTestamentMonologues({name},[{code:'luk',chap:row[1]}]);
  assert.ok(lines.length>=texts.length);
  for(const ref of refs)assert.ok(lines.some(line=>line.ref===`누가복음 ${row[1]}:${ref}`),`luk.${row[1]} ${name}: ${ref}`);
 }
});

test('로마서 16장 발화는 바울의 논증 문맥과 개별 구절을 가리킨다',()=>{
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='rom');
 assert.equal(new Set(rows.map(row=>row[1])).size,16);
 assert.ok(rows.every(row=>row[6]?.length===row[4].length));
 for(const row of rows){
  const [,,name,,texts,,refs]=row;
  const lines=newTestamentMonologues({name},[{code:'rom',chap:row[1]}]);
  assert.ok(lines.length>=texts.length);
  for(const ref of refs)assert.ok(lines.some(line=>line.ref===`로마서 ${row[1]}:${ref}`),`rom.${row[1]} ${name}: ${ref}`);
 }
});

test('사도행전 각 장의 발화는 사건 속 화자와 문장별 구절에 연결된다',()=>{
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='act');
 assert.equal(new Set(rows.map(row=>row[1])).size,28);
 assert.ok(rows.every(row=>row[6]?.length===row[4].length));
 for(const row of rows){
  const [,,name,,texts,,refs]=row;
  const lines=newTestamentMonologues({name},[{code:'act',chap:row[1]}]);
  assert.ok(lines.length>=texts.length);
  for(const ref of refs)assert.ok(lines.some(line=>line.ref===`사도행전 ${row[1]}:${ref}`),`act.${row[1]} ${name}: ${ref}`);
 }
});

test('요한복음 각 장의 발화는 말한 인물과 문장별 구절에 연결된다',()=>{
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='jhn');
 assert.equal(new Set(rows.map(row=>row[1])).size,21);
 assert.ok(rows.every(row=>row[6]?.length===row[4].length));
 for(const row of rows){
  const [,,name,,texts,,refs]=row;
  const lines=newTestamentMonologues({name},[{code:'jhn',chap:row[1]}]);
  assert.ok(lines.length>=texts.length);
  for(const ref of refs)assert.ok(lines.some(line=>line.ref===`요한복음 ${row[1]}:${ref}`),`jhn.${row[1]} ${name}: ${ref}`);
 }
});

test('요한계시록 22장 모두의 발화는 문장별 환상·선포 구절에 연결된다',()=>{
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='rev');
 assert.equal(new Set(rows.map(row=>row[1])).size,22);
 assert.ok(rows.every(row=>row[6]?.length===row[4].length));
 for(const row of rows){
  const [,,name,,texts,,refs]=row;
  const lines=newTestamentMonologues({name},[{code:'rev',chap:row[1]}]);
  assert.ok(lines.length>=texts.length);
  for(const ref of refs)assert.ok(lines.some(line=>line.ref===`요한계시록 ${row[1]}:${ref}`),`rev.${row[1]} ${name}: ${ref}`);
 }
});

test('요한계시록 1–5장의 증언·환상·찬양을 실제 화자에게 나눈다',()=>{
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='rev'&&row[1]<=5);
 const row=(chapter,name)=>rows.find(item=>item[1]===chapter&&item[2]===name);
 assert.deepEqual(row(1,'요한')[6],['9-10','11']);
 assert.deepEqual(row(1,'예수')[6],['17-18','19']);
 assert.deepEqual(row(4,'네 생물')[6],['8']);
 assert.deepEqual(row(4,'이십사 장로')[6],['10-11']);
 assert.deepEqual(row(5,'장로 중 한 사람')[6],['5']);
 assert.deepEqual(row(5,'힘 있는 천사')[6],['2']);
 assert.deepEqual(row(5,'수많은 천사')[6],['11-12']);
 assert.deepEqual(row(5,'네 생물')[6],['14']);
 assert.deepEqual(row(5,'모든 피조물')[6],['13']);
});

test('요한계시록 6–22장의 직접 발화와 목격 서술을 화자별로 나눈다',()=>{
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='rev');
 const row=(chapter,name)=>rows.find(item=>item[1]===chapter&&item[2]===name);
 assert.deepEqual(row(6,'순교한 영혼들')[6],['9-10']);
 assert.deepEqual(row(6,'땅의 임금들')[6],['16-17']);
 assert.deepEqual(row(7,'큰 무리')[6],['10']);
 assert.deepEqual(row(7,'모든 천사')[6],['12']);
 assert.deepEqual(row(8,'독수리')[6],['13']);
 assert.deepEqual(row(9,'제단의 음성')[6],['14']);
 assert.deepEqual(row(10,'하늘의 음성')[6],['4','8']);
 assert.equal(row(11,'두 증인'),undefined,'행동 서술을 증인들의 직접 대사로 만들지 않는다');
 assert.deepEqual(row(12,'하늘의 큰 음성')[6],['10','11-12']);
 assert.deepEqual(row(13,'땅에 사는 자들')[6],['4']);
 assert.deepEqual(row(14,'셋째 천사')[6],['9-11']);
 assert.deepEqual(row(14,'성령')[6],['13']);
 assert.deepEqual(row(15,'짐승을 이긴 자들')[6],['3-4']);
 assert.deepEqual(row(16,'물을 차지한 천사')[6],['5-6']);
 assert.deepEqual(row(17,'대접을 가진 천사')[6],['1','2','7-8','9-14','15-18']);
 assert.deepEqual(row(18,'하늘의 음성')[6],['4','6','7-8','20']);
 assert.deepEqual(row(18,'바벨론')[6],['7']);
 assert.deepEqual(row(18,'힘센 천사')[6],['21','22-24']);
 assert.deepEqual(row(19,'천사')[6],['9','10','17-18']);
 assert.deepEqual(row(18,'땅의 왕들')[6],['9-10']);
 assert.deepEqual(row(18,'선장과 선원들')[6],['18-19']);
 assert.deepEqual(row(19,'이십사 장로와 네 생물')[6],['4']);
 assert.deepEqual(row(20,'요한')[6],['1-4','11-15']);
 assert.deepEqual(row(21,'천사')[6],['9']);
 assert.deepEqual(row(22,'성령')[6],['17']);
 assert.deepEqual(row(22,'신부')[6],['17']);
 assert.equal(row(22,'목마른 자'),undefined,'초대받는 이를 발화자로 만들지 않는다');
 assert.deepEqual(row(22,'예수')[6],['7','12-13','14-15','16','20']);
});

test('마태·마가·누가복음의 주요 대면 문답은 장면의 두 화자와 구절에 맞게 연결된다',()=>{
 const cases=[
  ['mat.3','세례 요한','예수'],['mat.4','예수','마귀'],['mat.14','베드로','예수'],
  ['mat.15','가나안 여인','예수'],['mat.16','베드로','예수'],['mat.19','부자 청년','예수'],
  ['mat.26','가룟 유다','예수'],['mat.27','빌라도','예수'],
  ['mrk.5','군대 귀신 들린 사람','예수'],['mrk.6','헤롯','헤로디아의 딸'],
  ['mrk.7','수로보니게 여인','예수'],['mrk.8','예수','베드로'],
  ['mrk.9','예수','아이의 아버지'],['mrk.10','바디매오','예수'],['mrk.15','빌라도','예수'],
  ['luk.1','마리아','가브리엘'],['luk.5','시몬','예수'],['luk.8','야이로','예수'],
  ['luk.10','율법교사','예수'],['luk.15','맏아들','아버지'],['luk.16','부자','아브라함'],
  ['luk.17','열 명의 나병환자','예수'],['luk.19','삭개오','예수'],
  ['luk.23','회개한 강도','예수'],['luk.24','예수','글로바'],
  ['jhn.1','나다나엘','예수'],['jhn.3','니고데모','예수'],['jhn.4','사마리아 여자','예수'],
  ['jhn.9','날 때부터 맹인 된 사람','바리새인'],['jhn.13','시몬 베드로','예수'],['jhn.20','도마','예수'],['jhn.21','예수','시몬 베드로'],
  ['act.9','아나니아','사울'],['act.10','고넬료','베드로'],['act.16','간수','바울'],['act.26','아그립바','바울']
 ];
 for(const [chapter,speaker,target] of cases){
  const entry=PAIR_DIALOGUE.find(pair=>pair.chapter===chapter&&pair.speaker===speaker&&pair.target===target);
  assert.ok(entry,`${chapter}: ${speaker} ↔ ${target}`);
  const bookName=chapter.startsWith('mat.')?'마태복음 ':chapter.startsWith('mrk.')?'마가복음 ':chapter.startsWith('luk.')?'누가복음 ':chapter.startsWith('jhn.')?'요한복음 ':'사도행전 ';
  assert.ok(entry.ref.startsWith(bookName));
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
 const luk=JSON.parse(fs.readFileSync(new URL('../data/summary/luk.json',import.meta.url)));
 const absentLuke={1:['데오빌로'],2:['가이사 아구스도'],3:['아담'],4:['엘리야','엘리사'],7:['세례 요한'],11:['요나'],13:['빌라도','헤롯'],16:['모세'],17:['노아','롯','롯의 처'],20:['세례 요한','다윗'],22:['사탄']};
 for(const [chapter,names] of Object.entries(absentLuke)){
  const cast=chapterPeople(luk.chapters[chapter],{code:'luk',chap:Number(chapter)}).map(person=>person.name);
  for(const name of names)assert.ok(!cast.includes(name),`luk.${chapter} reference ${name} is not staged as a scene character`);
 }
});
