import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {objectContextSpeech,speechView} from '../js/features/pixel-bible/speech-view.js';
import {OBJECT_MONOLOGUES,objectMonologue} from '../js/features/pixel-bible/object-monologues.js';
import {personalLines} from '../js/features/pixel-bible/personal-lines.js';
import {buildChapterDialogue} from '../js/features/pixel-bible/chapter-dialogue.js';
import {PAIR_DIALOGUE} from '../js/features/pixel-bible/pair-dialogue.js';
import {PENTATEUCH_DIALOGUE_ROWS} from '../js/features/pixel-bible/old-testament/law.js';
import {objectLinesFor} from '../js/features/pixel-bible/object-scenes.js';
import {ELIJAH_SCENES} from '../js/features/pixel-bible/scenes.js';
import {TWO_KINGS_DIALOGUE_ROWS} from '../js/features/pixel-bible/2ki-dialogue.js';
import {OLD_TESTAMENT_CODES,OLD_TESTAMENT_DIALOGUE_ROWS} from '../js/features/pixel-bible/ot-dialogue.js';
import {speechContext} from '../js/features/pixel-bible/speech-context.js';
import {NEW_TESTAMENT_DIALOGUE_ROWS} from '../js/features/pixel-bible/nt-dialogue.js';

test('엘리야의 나무 독백은 현재 장의 공포와 탈진을 담고 긴 근거는 상세에 남긴다',()=>{
 const n={name:'엘리야',refs:['열왕기상 19장']},chapters=[{code:'1ki',name:'열왕기상',chap:19}],evidence={text:'광야의 로뎀나무 아래에서 지쳐 눕는 장면의 상세 맥락.',ref:'열왕기상 19:3–8'};
 const line=speechView(objectContextSpeech('나무',evidence,{speaker:n,kind:'tree',chapters,random:()=>0}));
 assert.match(line.text,/두려움/);assert.match(line.text,/버틸 힘/);assert.equal(line.emotion,'sad');assert.equal(line.detailText,evidence.text);
 assert.equal(line.ref,'열왕기상 19:3–5');
 const other=objectMonologue(n,'tree',[{code:'1ki',name:'열왕기상',chap:18}],{random:()=>0});assert.equal(other.origin,'object-daily');assert.doesNotMatch(other.text,/도망쳤|버틸 힘/);
 const scene=ELIJAH_SCENES.find(s=>s.id==='rest-elijah');assert.ok(objectLinesFor(scene,'엘리야').some(t=>t.includes('두려움')),'장면 경로도 해설 대신 동일한 인물 목소리를 사용');
});

test('이세벨의 독백·관계·인장 대사에는 나봇 제거와 포도원 강탈의 의도가 함께 있다',()=>{
 const chapters=[{code:'1ki',name:'열왕기상',chap:21,data:{people:[{name:'이세벨',role:'아합의 아내'}]}}],context=buildChapterDialogue(chapters);
 const n={...context.people[0],refs:['열왕기상 21장']};
 for(const line of personalLines(n,chapters,context)){assert.match(line.text,/나봇/);assert.match(line.text,/없애|죽|증인/);}
 const pair=PAIR_DIALOGUE.find(p=>p.speaker==='이세벨'&&p.target==='아합'&&p.chapter==='1ki.21');assert.ok(pair.lines.some(t=>/나봇.*없애/.test(t)));
 const line=objectMonologue(n,'seal',chapters,{random:()=>0});assert.match(line.text,/나봇.*없애/);assert.match(line.text,/포도원/);
});

test('짧은 두 문장은 의도까지 보이고 긴 해설은 첫 문장만 보인다',()=>{
 const full='나봇을 없애야 포도원을 빼앗지. 왕의 도장으로 장로들을 움직이겠어.';
 assert.equal(speechView({text:full}).text,full);
 const long='나는 오늘 이 길을 가야겠어. '+'본문 사건을 자세하게 설명합니다. '.repeat(30);assert.equal(speechView({text:long}).text,'나는 오늘 이 길을 가야겠어.');assert.equal(speechView({text:long}).detailText,long.trim());
 for(const row of OBJECT_MONOLOGUES)for(const text of row[6])assert.ok([...text].length<=64,text);
});

test('열왕기하 인물 대사는 사건·인물별로 갈리고 뒤 장의 후보도 잘리지 않는다',()=>{
 const chapters=[{code:'2ki',name:'열왕기하',chap:9},{code:'2ki',name:'열왕기하',chap:10}];
 const context={people:TWO_KINGS_DIALOGUE_ROWS.filter(r=>[9,10].includes(r[0])).map(([chap,name])=>({name,code:'2ki',chap,role:'왕'})),relations:[]};
 const jehu=personalLines({name:'예후',role:'왕',refs:[]},chapters,context);
 assert.equal(jehu.length,4);
 assert.ok(jehu.some(l=>l.ref==='열왕기하 9:1-13'&&/기름|이스르엘/.test(l.text)));
 assert.ok(jehu.some(l=>l.ref==='열왕기하 10:1-11'&&/아합|금송아지/.test(l.text)));
 assert.ok(jehu.every(l=>!['내 결정에 여러 사람의 삶이 달려 있구나. 이 일을 어찌 풀어야 할까.','사람들이 어떤 대답을 기다리는지 먼저 들어야겠군.','오늘도 내가 결정해야 할 일이 쌓였구나.'].includes(l.text)));
 const keys=new Set();
 for(const [chap,name,verses,lines,emotion] of TWO_KINGS_DIALOGUE_ROWS){
  const key=`${chap}:${name}`;assert.ok(!keys.has(key),`duplicate ${key}`);keys.add(key);
  assert.ok(lines.length>=1&&lines.length<=5&&lines.every(line=>line.length<=64),key);
  const local={people:[{name,code:'2ki',chap,role:'기록된 사건 인물'}],relations:[]};
  const output=personalLines({name,role:'기록된 사건 인물',refs:[]},[{code:'2ki',name:'열왕기하',chap}],local);
  assert.ok(output.length>=1,key);assert.ok(output.every(line=>line.ref?.startsWith('열왕기하 ')),key);
  assert.ok(['neutral','joy','sad','worried','angry','surprised','determined','gentle'].includes(emotion),key);
 }
 assert.deepEqual([...new Set(TWO_KINGS_DIALOGUE_ROWS.map(row=>row[0]))].sort((a,b)=>a-b),Array.from({length:25},(_,i)=>i+1));
 const allLines=TWO_KINGS_DIALOGUE_ROWS.flatMap(row=>row[3]);assert.equal(new Set(allLines).size,allLines.length,'열왕기하 개별 발화가 서로 구분되어야 한다');
 const unknown={name:'기록되지 않은 왕',role:'왕',refs:[]},unknownContext={people:[{name:unknown.name,code:'2ki',chap:3,role:'왕'}],relations:[]};
 assert.deepEqual(personalLines(unknown,[{code:'2ki',name:'열왕기하',chap:3}],unknownContext),[],'근거가 없는 열왕기하 인물에게 역할 공통 문구를 붙이지 않는다');
});

test('구약 전권의 개별 대사는 실제 장별 인물 색인에 붙고 역할 공통 독백으로 대체되지 않는다',()=>{
 const covered=new Set(OLD_TESTAMENT_DIALOGUE_ROWS.map(row=>row[0]));covered.add('2ki');
 assert.equal(covered.size,39);for(const code of OLD_TESTAMENT_CODES)assert.ok(covered.has(code),code);
 const allLines=[...OLD_TESTAMENT_DIALOGUE_ROWS.flatMap(row=>row[4]),...TWO_KINGS_DIALOGUE_ROWS.flatMap(row=>row[3])];
 const repeatedLitany=new Set(['여호와는 선하시도다. 그의 인자하심이 영원하도다.']);
 const uniqueLines=allLines.filter(line=>!repeatedLitany.has(line));
 assert.equal(new Set(uniqueLines).size,uniqueLines.length,'의도된 회중 후렴 외에 구약 전용 발화가 겹치지 않아야 한다');
 for(const [code,chap,name,ref] of OLD_TESTAMENT_DIALOGUE_ROWS){
  if(name==='내레이션'||name==='시인'||name.includes('회중'))continue;
  const book=JSON.parse(readFileSync(new URL(`../data/summary/${code}.json`,import.meta.url),'utf8'));
  const indexed=book.chapters?.[String(chap)]?.people||[];
  const members=String(name).split(/(?:과|와|·)/).map(part=>part.trim()).filter(Boolean);
  assert.ok(indexed.some(p=>p.name===name)||members.every(member=>indexed.some(p=>p.name===member||p.name.startsWith(`${member} `)||member.startsWith(`${p.name} `))),`${code}.${chap} ${name}이 본문 인물 색인에 있어야 한다`);
 }
 for(const [chap,name] of TWO_KINGS_DIALOGUE_ROWS){
  const book=JSON.parse(readFileSync(new URL('../data/summary/2ki.json',import.meta.url),'utf8'));
  assert.ok((book.chapters?.[String(chap)]?.people||[]).some(p=>p.name===name),`2ki.${chap} ${name}이 본문 인물 색인에 있어야 한다`);
 }
 const unknown={name:'기록되지 않은 왕',role:'왕',refs:[]},context={people:[{name:unknown.name,code:'2ki',chap:3,role:'왕'}],relations:[]};
 assert.deepEqual(personalLines(unknown,[{code:'2ki',name:'열왕기하',chap:3}],context),[]);
});

test('구약 인물·상황 발화 묶음은 한 개부터 허용하고 다섯 개를 넘기지 않는다',()=>{
 for(const row of OLD_TESTAMENT_DIALOGUE_ROWS){
  if(row[2]==='내레이션')assert.equal(row[4].length,0,`${row[0]} ${row[1]}장 사건 서술은 인물 발화로 만들지 않는다`);
  else assert.ok(row[4].length>=1,`${row[0]} ${row[1]}장 ${row[2]}에는 핵심 발화가 있어야 한다`);
  assert.ok(row[4].length<=5,`${row[0]} ${row[1]}장 ${row[2]} 발화는 최대 다섯 개다`);
 }
});

test('범용 역할 독백만 비활성화하고 인물별 사건 독백은 유지한다',()=>{
 const generic={name:'이름 없는 왕',role:'왕',refs:[]};
 const context={people:[{name:generic.name,code:'gen',chap:99,role:'왕'}],relations:[]};
 assert.deepEqual(personalLines(generic,[{code:'gen',name:'창세기',chap:99}],context),[]);
 const cain={name:'가인',role:'농부',refs:[]},chapters=[{code:'gen',name:'창세기',chap:4}];
 const authored=personalLines(cain,chapters,{people:[{name:'가인',code:'gen',chap:4,role:'농부'}],relations:[]});
 assert.ok(authored.length>=3&&authored.length<=5);assert.ok(authored.every(line=>line.origin==='authored'));
});

test('창세기 대사의 개별 참조는 각 문장의 실제 사건 범위와 일치한다',()=>{
 const genesisRows=OLD_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='gen');
 const find=(chap,name)=>genesisRows.find(row=>row[1]===chap&&row[2]===name);
 assert.deepEqual(find(2,'아담')[6],['15','16-17','21-23']);
 assert.deepEqual(find(3,'아담')[6],['8','9-10','11-12','17-24']);
 assert.deepEqual(find(3,'하와')[6],['13','1-6','16']);
 assert.deepEqual(find(4,'가인')[6],['3-5','6-8','10-14','15-16']);
 assert.deepEqual(find(6,'노아')[6],['8-12','14-16','19-22']);
 assert.deepEqual(find(8,'노아')[6],['6-9','10-11','15-20']);
 assert.deepEqual(find(9,'노아')[6],['20-21','22-23','24-26']);
 assert.deepEqual(find(12,'아브람')[6],['1-4','6-7','10-13']);
 const output=personalLines({name:'가인',role:'농부',refs:[]},[{code:'gen',name:'창세기',chap:4}],{people:[{name:'가인',code:'gen',chap:4,role:'농부'}],relations:[]});
 assert.deepEqual(output.map(line=>line.ref),['창세기 4:3-5','창세기 4:6-8','창세기 4:10-14','창세기 4:15-16']);
 assert.ok(output.every(line=>line.detailText),'발화마다 해당 사건의 설명을 제공한다');
 for(const line of output)assert.equal(speechContext(line,[{code:'gen',chap:4,data:{events:[{verses:'3-9',text:'같은 범위의 다른 사건 설명입니다.'}]}}]),line.detailText,'각 발화의 설명이 장의 일반 사건 설명보다 우선한다');
 const genesis=JSON.parse(readFileSync(new URL('../data/summary/gen.json',import.meta.url),'utf8'));
 const noah=personalLines({name:'노아',role:'의인',refs:[]},[{code:'gen',name:'창세기',chap:6}],{people:[{name:'노아',code:'gen',chap:6,role:'의인'}],relations:[]});
 assert.equal(noah.length,3);assert.deepEqual(noah.map(line=>line.ref),['창세기 6:8-12','창세기 6:14-16','창세기 6:19-22']);
 for(const line of noah){const verses=line.ref.split(':')[1],bounds=verses.split('-').map(Number);assert.ok(genesis.chapters['6'].events.some(event=>{const nums=event.verses.match(/\d+/g).map(Number);return bounds[0]<=nums.at(-1)&&bounds.at(-1)>=nums[0]}),line.ref);assert.ok(speechContext(line,[{code:'gen',chap:6,data:genesis.chapters['6']}]),line.ref+' 설명이 본문 사건에서 생성되어야 한다')}
 const findGenesis=(chap,name)=>genesisRows.find(row=>row[1]===chap&&row[2]===name);
 assert.equal(findGenesis(29,'라헬'),undefined,'라헬의 자녀 간청은 창세기 30장 사건');
 assert.deepEqual(genesisRows.find(row=>row[1]===30&&row[2]==='라헬'&&row[3]==='1-15')[6],['1','3-4','5-8','14-15']);
 assert.deepEqual(findGenesis(37,'요셉')[6],['5-8','9-11','18-24']);
 assert.deepEqual(findGenesis(42,'르우벤')[6],['22']);
 assert.ok(genesisRows.length>=51);
 for(const row of genesisRows){
  assert.ok(row[6]&&row[6].length===row[4].length,`${row[1]} ${row[2]} 발화마다 절 참조`);
  const intervals=String(row[3]).split(',').map(part=>{const [start,end=start]=part.trim().split('-').map(Number);return [start,end||start]});
  for(const ref of row[6])for(const part of ref.split(',')){const [from,to=from]=part.trim().split('-').map(Number);assert.ok(intervals.some(([start,end])=>from>=start&&Number(to||from)<=end),`${row[1]} ${row[2]} ${ref}는 행 범위 ${row[3]} 안에 있어야 함`);}
  assert.ok((genesis.chapters[String(row[1])]?.people||[]).some(person=>person.name===row[2]),`${row[1]}장 인물 색인에 ${row[2]}가 있어야 함`);
 }
 assert.deepEqual(findGenesis(13,'아브람')[6],['1-4','5-8','9','14-17','18']);
 assert.deepEqual(findGenesis(13,'롯')[6],['10','10-11','11-13']);
 const isaac=findGenesis(22,'이삭');assert.deepEqual(isaac[6],['6-7','7-8','9-13']);
 assert.equal(isaac[7].length,isaac[4].length);assert.match(isaac[7][2],/속마음을 직접 설명하지 않아요/);
});

test('출애굽기 발화는 각 문장마다 장 안의 개별 절 참조를 가진다',()=>{
 const rows=PENTATEUCH_DIALOGUE_ROWS.filter(row=>row[0]==='exo');assert.ok(rows.length>=42);
 for(const row of rows){
  const intervals=String(row[3]).split(',').map(part=>{const [start,end=start]=part.trim().split('-').map(Number);return [start,end||start]});
  assert.equal(row[7]?.length,row[4].length,`${row[1]}장 ${row[2]} 줄 참조`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.split('-').map(Number);assert(intervals.some(([low,high])=>start>=low&&end<=high),`${row[1]}장 ${row[2]} ${ref} 범위 밖`);}
 }
});

test('레위기에서 확인한 각 개인 발화는 문장별 본문 범위를 갖고 비발화 사건은 음성 대사로 만들지 않는다',()=>{
 const rows=PENTATEUCH_DIALOGUE_ROWS.filter(row=>row[0]==='lev');assert.ok(rows.length>=9);
 for(const row of rows){
  const intervals=String(row[3]).split(',').map(part=>{const [start,end=start]=part.trim().split('-').map(Number);return [start,end||start]});
  assert.equal(row[7]?.length,row[4].length,`${row[1]}장 ${row[2]} 줄 참조`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.split('-').map(Number);assert(intervals.some(([low,high])=>start>=low&&end<=high),`${row[1]}장 ${row[2]} ${ref} 범위 밖`);}
 }
 assert(!rows.some(row=>row[2]==='모독한 사람'),'기록되지 않은 대사를 무명 인물에게 붙이지 않음');
});

test('민수기 인물 발화 49묶음은 문장별 구절 범위에 연결되고 실제 말하지 않은 나무꾼은 제외한다',()=>{
 const rows=PENTATEUCH_DIALOGUE_ROWS.filter(row=>row[0]==='num');assert.equal(rows.length,49);
 for(const row of rows){
  const intervals=String(row[3]).split(',').map(part=>{const [start,end=start]=part.trim().split('-').map(Number);return [start,end||start]});
  assert.equal(row[7]?.length,row[4].length,`${row[1]}장 ${row[2]} 줄 참조`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.split('-').map(Number);assert(intervals.some(([low,high])=>start>=low&&end<=high),`${row[1]}장 ${row[2]} ${ref} 범위 밖`);}
 }
 assert(!rows.some(row=>row[2]==='안식일에 나무한 사람'));
});

test('신명기에서 확인한 인물 발화 29묶음은 각각 문장별 절 참조를 갖는다',()=>{
 const rows=PENTATEUCH_DIALOGUE_ROWS.filter(row=>row[0]==='deu');assert.equal(rows.length,29);
 const intervals=value=>String(value).split(',').map(part=>{const [start,end=start]=part.trim().split('-').map(Number);return [start,end||start]});
 for(const row of rows){
  assert.equal(row[7]?.length,row[4].length,`${row[1]}장 ${row[2]} 줄 참조`);
  for(const ref of row[7])for(const [start,end] of intervals(ref))assert(intervals(row[3]).some(([low,high])=>start>=low&&end<=high),`${row[1]}장 ${row[2]} ${ref} 범위 밖`);
 }
 assert(!rows.some(row=>['발람','아말렉'].includes(row[2])),'본문에서 직접 발화하지 않는 인물의 회고 문장을 제거함');
});

test('전도서 12장 전체는 장별 발화와 본문 근거·상황 설명을 빠짐없이 연결한다',()=>{
 const rows=OLD_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='ecc');
 assert.deepEqual([...new Set(rows.map(row=>row[1]))].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i+1));
 for(const row of rows){
  assert.equal(row[6]?.length,row[4].length,`전도서 ${row[1]}장 발화별 절 참조`);
  assert.equal(row[7]?.length,row[4].length,`전도서 ${row[1]}장 발화별 상황 설명`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=Number(row[3].split('-').at(-1)),`전도서 ${row[1]}장 ${ref} 범위`);}
 }
});

test('아가 8장 전체의 화자 전환은 인물별 색인과 절·상황 설명에 연결한다',()=>{
 const rows=OLD_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='sng');
 assert.deepEqual([...new Set(rows.map(row=>row[1]))].sort((a,b)=>a-b),Array.from({length:8},(_,i)=>i+1));
 for(const row of rows){
  assert.ok(row[4].length>=1&&row[4].length<=5,`아가 ${row[1]}장 발화 수`);
  assert.equal(row[6]?.length,row[4].length,`아가 ${row[1]}장 발화별 절 참조`);
  assert.equal(row[7]?.length,row[4].length,`아가 ${row[1]}장 발화별 상황 설명`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=Number(row[3].split('-').at(-1)),`아가 ${row[1]}장 ${ref} 범위`);}
 }
});

test('이사야 1–5장 발화는 직접 말씀과 선지자 음성을 구분해 절 근거에 연결한다',()=>{
 const rows=OLD_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=1&&row[1]<=5);
 assert.deepEqual([...new Set(rows.map(row=>row[1]))].sort((a,b)=>a-b),[1,2,3,4,5]);
 for(const row of rows){
  assert.equal(row[6]?.length,row[4].length,`이사야 ${row[1]}장 발화별 절 참조`);
  assert.equal(row[7]?.length,row[4].length,`이사야 ${row[1]}장 발화별 상황 설명`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=Number(row[3].split('-').at(-1)),`이사야 ${row[1]}장 ${ref} 범위`);}
 }
});

test('이사야 6–12장 소명·표징·남은 자의 발화는 장별 본문 근거를 갖는다',()=>{
 const rows=OLD_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=6&&row[1]<=12);
 assert.deepEqual([...new Set(rows.map(row=>row[1]))].sort((a,b)=>a-b),[6,7,8,9,10,11,12]);
 for(const row of rows){
  assert.equal(row[6]?.length,row[4].length,`이사야 ${row[1]}장 발화별 절 참조`);
  assert.equal(row[7]?.length,row[4].length,`이사야 ${row[1]}장 발화별 상황 설명`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=Number(row[3].split('-').at(-1)),`이사야 ${row[1]}장 ${ref} 범위`);}
 }
});

import {MAJOR_PROPHETS_DIALOGUE_ROWS} from '../js/features/pixel-bible/old-testament/major-prophets.js';
import {MINOR_PROPHETS_DIALOGUE_ROWS} from '../js/features/pixel-bible/old-testament/minor-prophets.js';

test('이사야 13–20장의 바벨론·모압·애굽 예언은 화자와 시적 의인화를 본문에 맞게 구분한다',()=>{
 const isaiah=JSON.parse(readFileSync(new URL('../data/summary/isa.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=13&&row[1]<=20);
 assert.ok(rows.some(row=>row[1]===17&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===20&&row[2]==='하나님'&&row[7].includes('2-4')));
 assert.ok(!rows.some(row=>row[1]===20&&row[2]==='이사야'),'표징 행동을 실제 발화로 꾸미지 않는다');
 assert.ok(!rows.some(row=>row[1]===18&&row[2]==='구스의 사신들'),'사절의 예언적 장면을 사신의 직접 대사로 만들지 않는다');
 assert.ok(!rows.some(row=>row[1]===19&&row[2]==='바로의 모사들'),'모사들이 직접 하지 않은 말을 귀속하지 않는다');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='죽은 왕들'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`이사야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.ok(isaiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`이사야 ${row[1]} ${row[2]} 색인`);
  assert.equal(row[8].length,row[4].length,`이사야 ${row[1]} ${row[2]} 설명`);
 }
});

test('이사야 21–27장의 파수꾼 문답·시온 경고·회복 노래는 실제 화자와 예언을 구분한다',()=>{
 const isaiah=JSON.parse(readFileSync(new URL('../data/summary/isa.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=21&&row[1]<=27);
 assert.ok(rows.some(row=>row[1]===21&&row[2]==='파수꾼'&&row[7].includes('11-12')));
 assert.ok(rows.some(row=>row[1]===22&&row[2]==='하나님'));
 assert.ok(!rows.some(row=>row[1]===22&&row[2]==='셉나'),'셉나에게 전한 예언을 그의 독백으로 오인하지 않는다');
 assert.ok(!rows.some(row=>row[1]===27&&row[2]==='리워야단'),'시적 괴수를 인물로 다루지 않는다');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`이사야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`이사야 ${row[1]} ${row[2]} 설명`);
  assert.ok(isaiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`이사야 ${row[1]} ${row[2]} 색인`);
 }
});

test('이사야 28–35장의 책망·애굽 의존 경고·시온 회복은 본문 화자와 인용을 나눈다',()=>{
 const isaiah=JSON.parse(readFileSync(new URL('../data/summary/isa.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=28&&row[1]<=35);
 assert.ok(rows.some(row=>row[1]===28&&row[2]==='예루살렘 지도자들'));
 assert.ok(rows.some(row=>row[1]===30&&row[2]==='패역한 자식들'));
 assert.ok(!rows.some(row=>row[1]===31&&row[2]==='애굽으로 내려가는 자들'),'예언자의 경고를 동맹 사절들의 대화로 오인하지 않는다');
 assert.ok(!rows.some(row=>row[1]===34&&row[2]==='에돔'),'에돔에게 내린 예언을 에돔의 독백으로 만들지 않는다');
 assert.ok(rows.some(row=>row[1]===35&&row[2]==='이사야'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`이사야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`이사야 ${row[1]} ${row[2]} 설명`);
  assert.ok(isaiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`이사야 ${row[1]} ${row[2]} 색인`);
 }
});

test('이사야 36–39장에서는 협박의 전달 경로와 히스기야의 기도·회복 대화를 나눈다',()=>{
 const isaiah=JSON.parse(readFileSync(new URL('../data/summary/isa.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=36&&row[1]<=39);
 assert.ok(rows.some(row=>row[1]===36&&row[2]==='엘리아김'));
 assert.ok(rows.some(row=>row[1]===37&&row[2]==='산헤립'&&row[8][0].includes('사자')));
 assert.ok(rows.some(row=>row[1]===37&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===38&&row[2]==='히스기야'&&row[7].includes('9-20')));
 assert.ok(!rows.some(row=>row[1]===39&&row[2]==='므로닥발라단'),'사절을 보냈다는 기록만으로 왕의 대사를 만들지 않는다');
 assert.ok(rows.some(row=>row[1]===39&&row[2]==='이사야'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`이사야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`이사야 ${row[1]} ${row[2]} 설명`);
  assert.ok(isaiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`이사야 ${row[1]} ${row[2]} 색인`);
 }
});

test('이사야 40–45장의 위로·종의 노래·고레스 예언은 말씀하시는 이와 대상자를 구별한다',()=>{
 const isaiah=JSON.parse(readFileSync(new URL('../data/summary/isa.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=40&&row[1]<=45);
 assert.ok(rows.some(row=>row[1]===40&&row[2]==='외치는 자의 소리'));
 assert.ok(rows.some(row=>row[1]===41&&row[2]==='섬들'));
 assert.ok(rows.some(row=>row[1]===42&&row[2]==='하나님'));
 assert.ok(!rows.some(row=>row[1]===42&&row[2]==='여호와의 종'),'종의 사명을 묘사한 예언을 종의 대사로 만들지 않는다');
 assert.ok(rows.some(row=>row[1]===44&&row[2]==='우상 만드는 자'));
 assert.ok(!rows.some(row=>row[1]===45&&row[2]==='고레스'),'고레스에게 전한 하나님의 말씀을 고레스의 발언으로 바꾸지 않는다');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`이사야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`이사야 ${row[1]} ${row[2]} 설명`);
  assert.ok(isaiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`이사야 ${row[1]} ${row[2]} 색인`);
 }
});

test('이사야 46–50장의 우상 심판·귀환 약속·종의 탄식은 화자와 문장별 근거를 갖는다',()=>{
 const isaiah=JSON.parse(readFileSync(new URL('../data/summary/isa.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=46&&row[1]<=50);
 assert.ok(rows.some(row=>row[1]===46&&row[2]==='하나님'&&row[7].includes('3-4')));
 assert.ok(rows.some(row=>row[1]===47&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===48&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===49&&row[2]==='시온'&&row[7][0]==='14'));
 assert.ok(rows.some(row=>row[1]===49&&row[2]==='여호와의 종'&&row[7].includes('1-3')));
 assert.ok(rows.some(row=>row[1]===50&&row[2]==='여호와의 종'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`이사야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`이사야 ${row[1]} ${row[2]} 설명`);
  assert.ok(isaiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`이사야 ${row[1]} ${row[2]} 색인`);
 }
});

test('이사야 51–55장의 시온 위로와 종의 노래는 공동체 고백·하나님의 말씀을 구별한다',()=>{
 const isaiah=JSON.parse(readFileSync(new URL('../data/summary/isa.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=51&&row[1]<=55);
 assert.ok(rows.some(row=>row[1]===51&&row[2]==='속량받은 자들'));
 assert.ok(rows.some(row=>row[1]===52&&row[2]==='좋은 소식을 전하는 자'));
 assert.ok(rows.some(row=>row[1]===53&&row[2]==='우리'));
 assert.ok(!rows.some(row=>row[1]===53&&row[2]==='여호와의 종'),'종에 대한 공동체의 노래를 종의 직접 발언으로 만들지 않는다');
 assert.ok(rows.some(row=>row[1]===54&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===55&&row[2]==='하나님'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`이사야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`이사야 ${row[1]} ${row[2]} 설명`);
  assert.ok(isaiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`이사야 ${row[1]} ${row[2]} 색인`);
 }
});

test('이사야 56–60장의 포용·정의·시온 회복은 실제 화자와 문장별 설명에 연결한다',()=>{
 const isaiah=JSON.parse(readFileSync(new URL('../data/summary/isa.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=56&&row[1]<=60);
 assert.ok(rows.some(row=>row[1]===56&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===57&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===58&&row[2]==='유다 백성'));
 assert.ok(rows.some(row=>row[1]===59&&row[2]==='유다 백성'));
 assert.ok(rows.some(row=>row[1]===60&&row[2]==='시온'));
 assert.ok(!rows.some(row=>row[1]===60&&row[2]==='나라들과 왕들'),'시온의 예언적 묘사를 열방의 실제 발언으로 바꾸지 않는다');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`이사야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`이사야 ${row[1]} ${row[2]} 설명`);
  assert.ok(isaiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`이사야 ${row[1]} ${row[2]} 색인`);
 }
});

test('이사야 61–66장의 복음 선포·공동체 탄원·새 창조를 화자별로 분리한다',()=>{
 const isaiah=JSON.parse(readFileSync(new URL('../data/summary/isa.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='isa'&&row[1]>=61&&row[1]<=66);
 assert.ok(rows.some(row=>row[1]===61&&row[2]==='기름 부음받은 이'));
 assert.ok(!rows.some(row=>row[1]===63&&row[2]==='붉은 옷의 용사'),'여호와 자신을 묘사하는 환상 칭호를 별도 인물의 독백으로 중복 등록하지 않는다');
 assert.ok(isaiah.chapters['63'].rels.some(relation=>relation.from==='하나님'&&relation.to==='에돔'&&relation.verses==='1-3'));
 assert.ok(rows.some(row=>row[1]===63&&row[2]==='이스라엘'));
 assert.ok(rows.some(row=>row[1]===64&&row[2]==='이스라엘'));
 assert.ok(rows.some(row=>row[1]===65&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===66&&row[2]==='하나님'));
 assert.ok(!rows.some(row=>row[1]===65&&row[2]==='패역한 백성'),'하나님이 백성에 관해 하시는 말씀을 백성의 직접 발화로 바꾸지 않는다');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`이사야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`이사야 ${row[1]} ${row[2]} 설명`);
  assert.ok(isaiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`이사야 ${row[1]} ${row[2]} 색인`);
 }
});

test('예레미야 1–3장의 소명·언약 고발·회개 초청은 실제 응답 순서에 연결한다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=1&&row[1]<=3);
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='예레미야'&&row[7].includes('6')));
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='하나님'&&row[7].includes('14-16')));
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='하나님'&&row[7].includes('10-13')));
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='배역한 이스라엘'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
 }
});

test('예레미야 4–5장의 심판 경고와 선지자 탄식은 공동체 화자와 구별한다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=4&&row[1]<=5);
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='예레미야'&&row[7].includes('19-20')));
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='예레미야'));
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='하나님'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
 }
});

test('예레미야 6–10장의 성전 설교·애가·우상 비판은 발화자와 응답을 나눈다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=6&&row[1]<=10);
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='예레미야'));
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='예레미야'));
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='예레미야'));
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='곡하는 부녀'));
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='하나님'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
 }
});

test('예레미야 11–15장의 언약 고발·선지자의 탄원·하나님의 응답을 나눠 기록한다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=11&&row[1]<=15);
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='아나돗 사람들'));
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='예레미야'));
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='유다 백성'));
 assert.ok(rows.some(row=>row[1]===15&&row[2]==='하나님'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
 }
});

test('예레미야 16–20장의 표징 행동·공동체 응답·선지자 탄식을 구별한다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=16&&row[1]<=20);
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===17&&row[2]==='예레미야'));
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='이스라엘 족속'));
 assert.ok(rows.some(row=>row[1]===19&&row[2]==='예레미야'));
 assert.ok(rows.some(row=>row[1]===20&&row[2]==='예레미야'&&row[7].includes('14-18')));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
 }
});

test('예레미야 21–25장의 왕궁 경고·목자 예언·칠십 년 말씀은 화자별로 나뉜다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=21&&row[1]<=25);
 assert.ok(rows.some(row=>row[1]===21&&row[2]==='시드기야'));
 assert.ok(rows.some(row=>row[1]===22&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===23&&row[2]==='예레미야'));
 assert.ok(rows.some(row=>row[1]===24&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===25&&row[2]==='하나님'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
 }
});

test('예레미야 26–30장의 성전 재판·멍에 대결·포로 편지와 회복 약속을 구분한다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=26&&row[1]<=30);
 assert.ok(rows.some(row=>row[1]===26&&row[2]==='고관들'));
 assert.ok(rows.some(row=>row[1]===27&&row[2]==='예레미야'));
 assert.ok(rows.some(row=>row[1]===28&&row[2]==='하나냐'));
 assert.ok(rows.some(row=>row[1]===29&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===30&&row[2]==='하나님'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
 }
});

test('예레미야 31–35장의 새 언약·밭 매입·노예 해방·레갑 순종을 화자별로 정리한다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=31&&row[1]<=35);
 assert.ok(rows.some(row=>row[1]===31&&row[2]==='라헬'));
 assert.ok(rows.some(row=>row[1]===31&&row[2]==='에브라임'));
 assert.ok(rows.some(row=>row[1]===32&&row[2]==='예레미야'));
 assert.ok(rows.some(row=>row[1]===33&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===34&&row[2]==='시드기야'));
 assert.ok(rows.some(row=>row[1]===35&&row[2]==='레갑 족속'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
 }
});

test('예레미야 36–40장의 두루마리·감옥 대화·성 함락 뒤 지시를 실제 화자와 절에 연결한다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=36&&row[1]<=40);
 assert.ok(rows.some(row=>row[1]===36&&row[2]==='여호야김'&&row[7].includes('21-24')));
 assert.ok(rows.some(row=>row[1]===36&&row[2]==='바룩'&&row[7].includes('17-18')));
 assert.ok(rows.some(row=>row[1]===37&&row[2]==='이리야'));
 assert.ok(rows.some(row=>row[1]===38&&row[2]==='에벳멜렉'&&row[7].includes('8-9')));
 assert.ok(rows.some(row=>row[1]===38&&row[2]==='시드기야'&&row[7].includes('19')));
 assert.ok(rows.some(row=>row[1]===39&&row[2]==='느부갓네살'));
 assert.ok(rows.some(row=>row[1]===40&&row[2]==='요하난'&&row[7].includes('15')));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=([32,21,28,18,16][row[1]-36]),`예레미야 ${row[1]}장 ${ref} 범위`);}
 }
});

test('예레미야 41–45장의 남은 자·애굽행 논쟁·바룩의 탄식을 본문 순서에 맞춘다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=41&&row[1]<=45);
 assert.ok(rows.some(row=>row[1]===41&&row[2]==='살아남은 열 명'&&row[7].includes('8')));
 assert.ok(rows.some(row=>row[1]===42&&row[2]==='남은 백성'&&row[7].includes('5-6')));
 assert.ok(rows.some(row=>row[1]===42&&row[2]==='하나님'&&row[7].includes('10-12')));
 assert.ok(rows.some(row=>row[1]===43&&row[2]==='아사랴와 요하난 및 오만한 자들'));
 assert.ok(rows.some(row=>row[1]===44&&row[2]==='유다 여인들'));
 assert.ok(rows.some(row=>row[1]===45&&row[2]==='바룩'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=({41:18,42:22,43:13,44:30,45:5}[row[1]]),`예레미야 ${row[1]}장 ${ref} 범위`);}
 }
});

test('예레미야 46–50장의 열방 심판과 포로 귀환은 시적 인용과 실제 공동체 발화를 구분한다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=46&&row[1]<=50);
 assert.ok(rows.some(row=>row[1]===46&&row[2]==='애굽 군대'));
 assert.ok(rows.some(row=>row[1]===46&&row[2]==='하나님'&&row[7].includes('27-28')));
 assert.ok(rows.some(row=>row[1]===47&&row[2]==='예레미야'));
 assert.ok(!rows.some(row=>row[1]===47&&row[2]==='블레셋'),'블레셋 심판을 블레셋의 직접 대사로 둔갑시키지 않는다');
 assert.ok(rows.some(row=>row[1]===48&&row[7].includes('47')));
 assert.ok(rows.some(row=>row[1]===49&&row[7].includes('34-39')));
 assert.ok(rows.some(row=>row[1]===50&&row[2]==='이스라엘과 유다'&&row[7].includes('4-5')));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=({46:28,47:7,48:47,49:39,50:46}[row[1]]),`예레미야 ${row[1]}장 ${ref} 범위`);}
 }
});

test('예레미야 51–52장은 바벨론 심판·포로 공동체의 탄원과 역사 서술을 구별한다',()=>{
 const jeremiah=JSON.parse(readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jer'&&row[1]>=51&&row[1]<=52);
 assert.ok(rows.some(row=>row[1]===51&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===51&&row[2]==='이스라엘'&&row[7].includes('9')));
 assert.ok(rows.some(row=>row[1]===51&&row[2]==='예레미야'&&row[7].includes('59-61')));
 assert.ok(!rows.some(row=>row[1]===52),'예레미야 52장은 요약 역사 서술이므로 기록되지 않은 대사를 추가하지 않는다');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`예레미야 ${row[1]} ${row[2]} 설명`);
  assert.ok(jeremiah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`예레미야 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=64,`예레미야 ${row[1]}장 ${ref} 범위`);}
 }
});

test('예레미야애가 1–5장의 시온 애가·공동체 회개·회복 탄원을 시적 화자에 맞춘다',()=>{
 const lamentations=JSON.parse(readFileSync(new URL('../data/summary/lam.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='lam'&&row[1]>=1&&row[1]<=5);
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='예루살렘(시온)'&&row[7].includes('18-22')));
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='딸 시온'&&row[7].includes('20-22')));
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='고난 당한 사람'&&row[7].includes('21-24')));
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='하나님'&&row[7].includes('57')));
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='시온의 아들들'));
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='유다 백성'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`애가 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`애가 ${row[1]} ${row[2]} 설명`);
  assert.ok(lamentations.chapters[String(row[1])].people.some(person=>person.name===row[2]),`애가 ${row[1]} ${row[2]} 색인`);
  const max={1:22,2:22,3:66,4:22,5:22}[row[1]];
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=max,`애가 ${row[1]}장 ${ref} 범위`);}
 }
});

test('에스겔 1–5장의 환상 서술과 직접 말씀·표징 대화를 구분한다',()=>{
 const ezekiel=JSON.parse(readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='ezk'&&row[1]>=1&&row[1]<=5);
 assert.equal(rows.some(row=>row[1]===1),false,'에스겔 1장은 환상 묘사만 있고 발화 내용은 없어 독백으로 꾸미지 않는다');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='하나님'&&row[7].includes('16-21')));
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='에스겔'&&row[7].includes('14')));
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='하나님'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 설명`);
  assert.ok(ezekiel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`에스겔 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=({1:28,2:10,3:27,4:17,5:17}[row[1]]),`에스겔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('에스겔 6–10장의 우상 환상·파수와 심판 장면은 말씀과 환상 행동을 구분한다',()=>{
 const ezekiel=JSON.parse(readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='ezk'&&row[1]>=6&&row[1]<=10);
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='장로 칠십 명'&&row[7].includes('12')));
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='에스겔'&&row[7].includes('8')));
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='베옷 입은 서기관'));
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='하나님'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 설명`);
  assert.ok(ezekiel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`에스겔 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=({6:14,7:27,8:18,9:11,10:22}[row[1]]),`에스겔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('에스겔 11–15장의 성읍 고관·거짓 예언·포로 회복 말씀을 구별한다',()=>{
 const ezekiel=JSON.parse(readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='ezk'&&row[1]>=11&&row[1]<=15);
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='성전 동문 고관들'&&row[7].includes('3')));
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='에스겔'&&row[7].includes('13')));
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='반역하는 족속'));
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='거짓 선지자들'&&row[7].includes('10')));
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='하나님'&&row[7].includes('12-20')));
 assert.ok(rows.some(row=>row[1]===15&&row[2]==='하나님'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 설명`);
  assert.ok(ezekiel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`에스겔 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=({11:25,12:28,13:23,14:23,15:8}[row[1]]),`에스겔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('에스겔 16–20장의 언약 비유·개인 책임·애가와 elders response를 나눈다',()=>{
 const ezekiel=JSON.parse(readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='ezk'&&row[1]>=16&&row[1]<=20);
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='하나님'&&row[7].includes('60-63')));
 assert.ok(rows.some(row=>row[1]===17&&row[2]==='하나님'&&row[7].includes('22-24')));
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='이스라엘 족속'&&row[7].includes('2')));
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='하나님'&&row[7].includes('21-32')));
 assert.ok(rows.some(row=>row[1]===19&&row[2]==='에스겔'));
 assert.ok(rows.some(row=>row[1]===20&&row[2]==='하나님'&&row[7].includes('33-44')));
 assert.ok(rows.some(row=>row[1]===20&&row[2]==='에스겔'&&row[7].includes('49')));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 설명`);
  assert.ok(ezekiel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`에스겔 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=({16:63,17:24,18:32,19:14,20:49}[row[1]]),`에스겔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('에스겔 21–25장의 칼·성읍 심판·아내의 표징과 열방 신탁을 실제 화자에 연결한다',()=>{
 const ezekiel=JSON.parse(readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='ezk'&&row[1]>=21&&row[1]<=25);
 assert.ok(rows.some(row=>row[1]===21&&row[2]==='하나님'&&row[7].includes('18-27')));
 assert.ok(rows.some(row=>row[1]===21&&row[2]==='에스겔'));
 assert.ok(rows.some(row=>row[1]===22&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===23&&row[2]==='하나님'));
 assert.ok(!rows.some(row=>row[1]===23&&row[2]==='오홀리바(예루살렘)'),'비유 속 도시를 실제 발화자로 만들지 않는다');
 assert.ok(rows.some(row=>row[1]===24&&row[2]==='포로 백성'&&row[7].includes('19')));
 assert.ok(rows.some(row=>row[1]===25&&row[2]==='암몬'&&row[7].includes('3')));
 assert.ok(rows.some(row=>row[1]===25&&row[2]==='모압과 세일'));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 설명`);
  assert.ok(ezekiel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`에스겔 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=({21:32,22:31,23:49,24:27,25:17}[row[1]]),`에스겔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('에스겔 26–30장의 두로·애굽 신탁은 인용된 자랑과 하나님의 예언을 구분한다',()=>{
 const ezekiel=JSON.parse(readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='ezk'&&row[1]>=26&&row[1]<=30);
 assert.ok(rows.some(row=>row[1]===26&&row[2]==='두로'&&row[7].includes('2')));
 assert.ok(rows.some(row=>row[1]===26&&row[2]==='바다의 왕들'));
 assert.ok(rows.some(row=>row[1]===27&&row[2]==='뱃사람들'&&row[7].includes('28-32')));
 assert.ok(rows.some(row=>row[1]===27&&row[2]==='무역하는 나라들'&&row[7].includes('33-36')));
 assert.ok(rows.some(row=>row[1]===28&&row[2]==='두로 왕'&&row[7].includes('2-5')));
 assert.ok(rows.some(row=>row[1]===28&&row[2]==='하나님'&&row[7].includes('20-26')));
 assert.ok(rows.some(row=>row[1]===29&&row[2]==='바로'&&row[7].includes('3,9')));
 assert.ok(rows.some(row=>row[1]===29&&row[2]==='하나님'&&row[7].includes('17-20')));
 assert.ok(rows.some(row=>row[1]===30&&row[2]==='하나님'&&row[7].includes('24-26')));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(ezekiel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`에스겔 ${row[1]} ${row[2]} 색인`);
  const maxVerse={26:21,27:36,28:26,29:21,30:26}[row[1]];
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse,`에스겔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('에스겔 31–35장의 제국 애가·파수꾼·목자 약속은 비유 화자와 직접 발화를 구분한다',()=>{
 const ezekiel=JSON.parse(readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='ezk'&&row[1]>=31&&row[1]<=35);
 for(let chapter=31;chapter<=35;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`에스겔 ${chapter}장 발화·응답 검토`);
 assert.ok(rows.some(row=>row[1]===31&&row[2]==='하나님'));
 assert.ok(rows.some(row=>row[1]===32&&row[2]==='하나님'&&row[7].includes('17-21')));
 assert.ok(rows.some(row=>row[1]===33&&row[2]==='도망한 자'&&row[7].includes('21')));
 assert.ok(rows.some(row=>row[1]===33&&row[2]==='포로 백성'));
 assert.ok(rows.some(row=>row[1]===34&&row[2]==='하나님'&&row[7].includes('23-24')));
 assert.ok(rows.some(row=>row[1]===35&&row[2]==='세일산(에돔)'&&row[7].includes('10')));
 assert.ok(!rows.some(row=>row[1]===34&&row[2]==='이스라엘 목자들'),'비유의 수신자인 목자들에게 창작 발화를 붙이지 않는다');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(ezekiel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`에스겔 ${row[1]} ${row[2]} 색인`);
  const maxVerse={31:18,32:32,33:33,34:31,35:15}[row[1]];
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse,`에스겔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('에스겔 36–40장의 회복 약속·마른 뼈 환상·곡의 예언·성전 환상은 직접 발화만 인물에 연결한다',()=>{
 const ezekiel=JSON.parse(readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='ezk'&&row[1]>=36&&row[1]<=40);
 for(let chapter=36;chapter<=40;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`에스겔 ${chapter}장 발화·응답 검토`);
 assert.ok(rows.some(row=>row[1]===36&&row[2]==='원수 나라들'&&row[7].includes('2')));
 assert.ok(rows.some(row=>row[1]===37&&row[2]==='에스겔'&&row[7].includes('9-10')));
 assert.ok(rows.some(row=>row[1]===37&&row[2]==='하나님'&&row[7].includes('24-28')));
 assert.ok(rows.some(row=>row[1]===38&&row[2]==='곡'&&row[7].includes('10-12')));
 assert.ok(rows.some(row=>row[1]===38&&row[2]==='스바·드단·다시스 상인들'&&row[7].includes('13')));
 assert.ok(!rows.some(row=>row[1]===38&&row[2]==='연합한 나라들'),'곡의 침략 의도를 동맹군의 발언으로 돌리지 않는다');
 assert.ok(rows.some(row=>row[1]===39&&row[2]==='하나님'&&row[7].includes('17-20')));
 assert.ok(!rows.some(row=>row[1]===39&&row[2]==='이스라엘 족속'),'무기 소각과 매장은 사건 서술이지 백성의 직접 발언이 아니다');
 assert.ok(rows.some(row=>row[1]===40&&row[2]==='놋 같은 사람'&&row[7].includes('4')));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(ezekiel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`에스겔 ${row[1]} ${row[2]} 색인`);
  const maxVerse={36:38,37:28,38:23,39:29,40:49}[row[1]];
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse,`에스겔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('에스겔 41–45장은 성전 측량 서술과 실제 지시·예배 말씀을 구분한다',()=>{
 const ezekiel=JSON.parse(readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='ezk'&&row[1]>=41&&row[1]<=45);
 assert.ok(rows.some(row=>row[1]===41&&row[2]==='측량하는 사람'&&row[7].includes('4')));
 assert.ok(!rows.some(row=>row[1]===42),'성전 방과 경계의 측량은 발화가 아닌 환상 서술이다');
 assert.ok(rows.some(row=>row[1]===43&&row[2]==='하나님'&&row[7].includes('6-9')));
 assert.ok(rows.some(row=>row[1]===43&&row[2]==='하나님'&&row[7].includes('18-27')));
 assert.ok(rows.some(row=>row[1]===44&&row[2]==='하나님'&&row[7].includes('10-14')));
 assert.ok(rows.some(row=>row[1]===45&&row[2]==='하나님'&&row[7].includes('9-12')));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(ezekiel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`에스겔 ${row[1]} ${row[2]} 색인`);
  const maxVerse={41:26,42:20,43:27,44:31,45:25}[row[1]];
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse,`에스겔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('에스겔 46–48장의 예배·생명수·땅 분배 환상은 발화와 환상 서술을 구별한다',()=>{
 const ezekiel=JSON.parse(readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='ezk'&&row[1]>=46&&row[1]<=48);
 assert.ok(rows.some(row=>row[1]===46&&row[2]==='하나님'&&row[7].includes('16-18')));
 assert.ok(rows.some(row=>row[1]===46&&row[2]==='측량하는 사람'&&row[7].includes('24')));
 assert.ok(rows.some(row=>row[1]===47&&row[2]==='측량하는 사람'&&row[7].includes('6')));
 assert.ok(rows.some(row=>row[1]===47&&row[2]==='하나님'&&row[7].includes('22-23')));
 assert.ok(!rows.some(row=>row[1]===47&&row[2]==='어부들'),'강가 어부는 환상 속 미래 장면이지 발화자가 아니다');
 assert.ok(rows.some(row=>row[1]===48&&row[2]==='하나님'&&row[7].includes('23-29')));
 assert.ok(!rows.some(row=>row[1]===48&&row[2]==='열두 지파'),'문 이름과 땅 분배의 서술을 지파들의 대사로 꾸미지 않는다');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`에스겔 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(ezekiel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`에스겔 ${row[1]} ${row[2]} 색인`);
  const maxVerse={46:24,47:23,48:35}[row[1]];
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse,`에스겔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('다니엘 1–6장의 궁정 문답·신앙 고백·왕의 변화를 본문 화자에 연결한다',()=>{
 const daniel=JSON.parse(readFileSync(new URL('../data/summary/dan.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='dan'&&row[1]>=1&&row[1]<=6);
 for(let chapter=1;chapter<=6;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`다니엘 ${chapter}장 발화 검토`);
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='아스부나스'&&row[7].includes('10')));
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='바벨론 지혜자들'&&row[7].includes('10-11')));
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='아리옥'&&row[7].includes('25')));
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='사드락·메삭·아벳느고'&&row[7].includes('16-18')));
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='거룩한 순찰자'));
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='하나님'&&row[7].includes('31-32')));
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='왕비'&&row[7].includes('10-12')));
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='다니엘'&&row[7].includes('25-28')));
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='총리와 고관들'&&row[7].includes('6-8')));
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='다니엘'&&row[7].includes('21-22')));
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`다니엘 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`다니엘 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(daniel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`다니엘 ${row[1]} ${row[2]} 색인`);
  const maxVerse={1:21,2:49,3:30,4:37,5:31,6:28}[row[1]];
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse,`다니엘 ${row[1]}장 ${ref} 범위`);}
 }
});

test('다니엘 7–12장의 환상 문답과 예언 해석을 실제 발화자 및 장별 근거에 연결한다',()=>{
 const daniel=JSON.parse(readFileSync(new URL('../data/summary/dan.json',import.meta.url),'utf8'));
 const rows=MAJOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='dan'&&row[1]>=7&&row[1]<=12);
 const maxVerse={7:28,8:27,9:27,10:21,11:45,12:13};
 for(let chapter=7;chapter<=12;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`다니엘 ${chapter}장 발화 검토`);
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='천사'&&row[7].includes('23-27')));
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='가브리엘'&&row[7].includes('20-26')));
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='다니엘'&&row[7].includes('15-19')));
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='가브리엘'&&row[7].includes('24-27')));
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='다니엘'&&row[7].includes('16-17')));
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='천사'&&row[7].includes('21-35')));
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='한 천사'&&row[7].includes('6')));
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='다니엘'&&row[7].includes('8')));
 assert.ok(!rows.some(row=>row[1]===12&&row[2]==='미가엘'),'미가엘의 등장은 서술이며 직접 발화가 아니다');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`다니엘 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`다니엘 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`다니엘 ${row[1]} ${row[2]} 발화 수`);
  assert.ok(daniel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`다니엘 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`다니엘 ${row[1]}장 ${ref} 범위`);}
 }
});

test('호세아 1–14장의 언약 심판·회개·회복을 화자별로 나누고 모든 발화에 절 근거를 둔다',()=>{
 const hosea=JSON.parse(readFileSync(new URL('../data/summary/hos.json',import.meta.url),'utf8'));
 const rows=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='hos');
 const maxVerse={1:11,2:23,3:5,4:19,5:15,6:11,7:16,8:14,9:17,10:15,11:12,12:14,13:16,14:9};
 for(let chapter=1;chapter<=14;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`호세아 ${chapter}장 발화 검토`);
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='하나님'&&row[7].includes('4-5')),'이스르엘 심판은 하나님의 말씀');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='호세아'&&row[7].includes('2-3')),'호세아가 값을 치르고 아내에게 한 말');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='이스라엘 백성'&&row[7].includes('1-3')));
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='하나님'&&row[7].includes('4-6')),'인애와 제사 대조는 하나님의 책망');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='하나님'&&row[7].includes('8-11')),'에브라임을 놓지 못하는 긍휼은 하나님의 발화');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='이스라엘'&&row[7].includes('3')),'14장 고백은 백성의 응답');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`호세아 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`호세아 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`호세아 ${row[1]} ${row[2]} 발화 수`);
  assert.ok(hosea.chapters[String(row[1])].people.some(person=>person.name===row[2]),`호세아 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`호세아 ${row[1]}장 ${ref} 범위`);}
 }
});

test('요엘 1–3장의 재앙 애가·회개 촉구·회복 약속은 선지자와 하나님의 발화를 구별한다',()=>{
 const joel=JSON.parse(readFileSync(new URL('../data/summary/jol.json',import.meta.url),'utf8'));
 const rows=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jol');
 const maxVerse={1:20,2:32,3:21};
 for(let chapter=1;chapter<=3;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`요엘 ${chapter}장 발화 검토`);
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='요엘'&&row[7].includes('19-20')),'요엘 자신의 탄식만 선지자에게 연결');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='하나님'&&row[7].includes('12-14')),'마음을 찢으라는 말씀의 화자');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='요엘'&&row[7].includes('15-17')),'공동체 소집과 제사장 중보');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='하나님'&&row[7].includes('28-32')),'영 부으심과 구원 약속');
 assert.ok(!rows.some(row=>row[1]===3&&row[2]==='유다와 예루살렘'),'열국 심판을 유다의 대사로 돌리지 않는다');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`요엘 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`요엘 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`요엘 ${row[1]} ${row[2]} 발화 수`);
  assert.ok(joel.chapters[String(row[1])].people.some(person=>person.name===row[2]),`요엘 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`요엘 ${row[1]}장 ${ref} 범위`);}
 }
});

test('아모스 1–9장의 열방 심판·사회 정의 고발·환상 문답은 화자와 구절을 구별한다',()=>{
 const amos=JSON.parse(readFileSync(new URL('../data/summary/amo.json',import.meta.url),'utf8'));
 const rows=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='amo');
 const maxVerse={1:15,2:16,3:15,4:13,5:27,6:14,7:17,8:14,9:15};
 for(let chapter=1;chapter<=9;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`아모스 ${chapter}장 발화 검토`);
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='하나님'&&row[7].includes('6-8')),'이스라엘의 약자 착취는 하나님의 고발');
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='하나님'&&row[7].includes('21-24')),'정의와 예배의 관계');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='아모스'&&row[7].includes('2')),'환상 속 중보 기도');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='아마샤'&&row[7].includes('10-13')),'아마샤의 고발과 추방 명령');
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='탐욕스러운 상인들'&&row[7].includes('4-6')),'상인의 착취 계획은 인용 발화');
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='하나님'&&row[7].includes('11-15')),'심판 뒤 회복 약속');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`아모스 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`아모스 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`아모스 ${row[1]} ${row[2]} 발화 수`);
  assert.ok(amos.chapters[String(row[1])].people.some(person=>person.name===row[2]),`아모스 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`아모스 ${row[1]}장 ${ref} 범위`);}
 }
});

test('오바댜와 요나의 예언·선원 대화·니느웨 회개·요나와 하나님의 문답을 본문에 맞춘다',()=>{
 const obadiah=JSON.parse(readFileSync(new URL('../data/summary/oba.json',import.meta.url),'utf8'));
 const jonah=JSON.parse(readFileSync(new URL('../data/summary/jnh.json',import.meta.url),'utf8'));
 const obaRows=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='oba');
 const jonahRows=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='jnh');
 assert.ok(obaRows.some(row=>row[2]==='하나님'&&row[7].includes('10-15')));
 assert.ok(obaRows.some(row=>row[2]==='에돔'&&row[7].includes('3')),'에돔의 교만은 본문에 인용된 속말');
 assert.ok(!obaRows.some(row=>row[2]==='에돔'&&row[7].includes('10-15')),'예언자의 책망을 에돔의 1인칭 말로 바꾸지 않는다');
 const jonahChapters={1:17,2:10,3:10,4:11};
 for(let chapter=1;chapter<=4;chapter++)assert.ok(jonahRows.some(row=>row[1]===chapter),`요나 ${chapter}장 발화 검토`);
 assert.ok(jonahRows.some(row=>row[1]===1&&row[2]==='선장'&&row[7].includes('6')));
 assert.ok(jonahRows.some(row=>row[1]===1&&row[2]==='사공들'&&row[7].includes('14')),'선원들은 요나를 던지기 전에 기도함');
 assert.ok(jonahRows.some(row=>row[1]===2&&row[2]==='요나'&&row[7].includes('8-9')));
 assert.ok(jonahRows.some(row=>row[1]===3&&row[2]==='니느웨 왕'&&row[7].includes('7-8')));
 assert.ok(jonahRows.some(row=>row[1]===4&&row[2]==='하나님'&&row[7].includes('10-11')));
 assert.ok(!jonah.chapters['2'].people.some(person=>person.name==='큰 물고기'),'동물은 인물 화자 색인에 넣지 않는다');
 for(const [book,rows,data,maxByChapter] of [['오바댜',obaRows,obadiah,{1:21}],['요나',jonahRows,jonah,jonahChapters]])for(const row of rows){
  assert.equal(row[7].length,row[4].length,`${book} ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`${book} ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`${book} ${row[1]} ${row[2]} 발화 수`);
  assert.ok(data.chapters[String(row[1])].people.some(person=>person.name===row[2]),`${book} ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxByChapter[row[1]],`${book} ${row[1]}장 ${ref} 범위`);}
 }
});

test('미가 1–7장의 지도자 고발·언약 문답·시온 회복을 선지자·백성·하나님별로 구분한다',()=>{
 const micah=JSON.parse(readFileSync(new URL('../data/summary/mic.json',import.meta.url),'utf8'));
 const rows=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='mic');
 const maxVerse={1:16,2:13,3:12,4:13,5:15,6:16,7:20};
 for(let chapter=1;chapter<=7;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`미가 ${chapter}장 발화 검토`);
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='하나님'&&row[7].includes('12-13')),'남은 자의 모음과 인도');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='하나님'&&row[7].includes('5-7')),'거짓 예언자 심판');
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='민족들'&&row[7].includes('2')),'열방이 말씀을 배우겠다는 환상 속 발화');
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='하나님'&&row[7].includes('1-6')),'베들레헴 통치자 예언은 하나님의 말씀');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='이스라엘 백성'&&row[7].includes('6-7')));
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='미가'&&row[7].includes('8')),'미가가 언약 질문에 답함');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='원수'&&row[7].includes('10')));
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='하나님'&&row[7].includes('15')),'출애굽처럼 행하겠다는 하나님의 응답');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`미가 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`미가 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`미가 ${row[1]} ${row[2]} 발화 수`);
  assert.ok(micah.chapters[String(row[1])].people.some(person=>person.name===row[2]),`미가 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`미가 ${row[1]}장 ${ref} 범위`);}
 }
});

test('나훔 1–3장의 니느웨 심판과 유다 회복을 하나님의 말씀·선지자의 애가로 나눈다',()=>{
 const nahum=JSON.parse(readFileSync(new URL('../data/summary/nam.json',import.meta.url),'utf8'));
 const rows=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='nam');
 const maxVerse={1:15,2:13,3:19};
 for(let chapter=1;chapter<=3;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`나훔 ${chapter}장 발화 검토`);
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='하나님'&&row[7].includes('2-8')),'심판과 피난처를 함께 말하는 하나님의 성품');
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='나훔'&&row[7].includes('15')),'유다를 향한 평화 소식');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='하나님'&&row[7].includes('13')),'니느웨에 대한 하나님의 직접 선언');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='나훔'&&row[7].includes('14-19')),'앗수르 왕에게 전하는 조롱의 애가');
 assert.ok(!rows.some(row=>row[2]==='앗수르 왕'),'애가 속 왕의 몰락을 왕의 1인칭 대사로 만들지 않는다');
 for(const row of rows){
  assert.equal(row[7].length,row[4].length,`나훔 ${row[1]} ${row[2]} 문장별 근거`);
  assert.equal(row[8].length,row[4].length,`나훔 ${row[1]} ${row[2]} 상황 설명`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`나훔 ${row[1]} ${row[2]} 발화 수`);
  assert.ok(nahum.chapters[String(row[1])].people.some(person=>person.name===row[2]),`나훔 ${row[1]} ${row[2]} 색인`);
  for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`나훔 ${row[1]}장 ${ref} 범위`);}
 }
});

test('하박국·스바냐·학개의 질문과 예언 응답은 장별 실제 화자와 근거를 갖는다',()=>{
 const maxByBook={hab:{1:17,2:20,3:19},zep:{1:18,2:15,3:20},hag:{1:15,2:23},zec:{1:21,2:13,3:10,4:14,5:11,6:15,7:14,8:23,9:17,10:12,11:17,12:14,13:9,14:21},mal:{1:14,2:17,3:18,4:6}};
 for(const [book,maxVerse] of Object.entries(maxByBook)){
  const summary=JSON.parse(readFileSync(new URL(`../data/summary/${book}.json`,import.meta.url),'utf8'));
  const rows=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]===book&&row[6]>=(book==='mal'?1981:1928));
  for(let chapter=1;chapter<=Object.keys(maxVerse).length;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`${book} ${chapter}장 발화 검토`);
  for(const row of rows){
   assert.equal(row[7].length,row[4].length,`${book} ${row[1]} ${row[2]} 문장별 근거`);
   assert.equal(row[8].length,row[4].length,`${book} ${row[1]} ${row[2]} 상황 설명`);
   assert.ok(row[4].length>=1&&row[4].length<=5,`${book} ${row[1]} ${row[2]} 발화 수`);
   assert.ok(summary.chapters[String(row[1])].people.some(person=>person.name===row[2]),`${book} ${row[1]} ${row[2]} 색인`);
   for(const ref of row[7])for(const part of ref.split(',')){const [start,end=start]=part.replace(/^\d+:/,'').trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`${book} ${row[1]}장 ${ref} 범위`);}
  }
 }
 const hab=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='hab');
 assert.ok(hab.some(row=>row[1]===1&&row[2]==='하박국'&&row[7].includes('12-17')),'갈대아를 세우신 응답에 대한 하박국의 재질문');
 assert.ok(hab.some(row=>row[1]===2&&row[2]==='약탈당한 나라들'&&row[7].includes('6-8')),'제국에 대한 조롱 노래');
 const hag=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='hag');
 assert.ok(hag.some(row=>row[1]===2&&row[2]==='학개'&&row[7].includes('12-13')),'학개가 제사장들에게 한 율법 문답');
 assert.ok(hag.some(row=>row[1]===2&&row[2]==='제사장들'&&row[7].includes('12-13')),'제사장들의 정결 판정 답변');
 const zech=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='zec'&&row[6]>=1945);
 assert.ok(zech.some(row=>row[1]===1&&row[2]==='여호와의 천사'&&row[7].includes('12')),'스가랴 환상 속 중보 탄원');
 assert.ok(zech.some(row=>row[1]===3&&row[2]==='하나님'&&row[7].includes('4')),'여호수아의 죄악을 제거하시는 하나님');
 assert.ok(zech.some(row=>row[1]===7&&row[2]==='사레셀과 레겜멜렉'&&row[7].includes('2-3')),'금식 질문을 실제 사절에게 연결');
 assert.ok(zech.some(row=>row[1]===8&&row[2]==='이방 백성 열 명'&&row[7].includes('23')),'열방이 함께 여호와를 찾음');
 assert.ok(zech.some(row=>row[1]===9&&row[2]==='하나님'&&row[7].includes('9-10')),'겸손한 왕과 평화의 통치');
 assert.ok(zech.some(row=>row[1]===11&&row[2]==='스가랴'&&row[7].includes('12-13')),'은 삼십을 받은 목자 표징');
 assert.ok(zech.some(row=>row[1]===12&&row[2]==='다윗의 족속'&&row[7].includes('10-14')),'찔린 이를 바라보는 공동체의 애통');
 assert.ok(zech.some(row=>row[1]===14&&row[2]==='하나님'&&row[7].includes('20-21')),'거룩함이 일상 전체로 확장되는 결말');
 const mal=MINOR_PROPHETS_DIALOGUE_ROWS.filter(row=>row[0]==='mal'&&row[6]>=1981);
 assert.ok(mal.some(row=>row[1]===1&&row[2]==='하나님'&&row[7].includes('2-5')),'하나님의 사랑을 되묻는 공동체에 대한 응답');
 assert.ok(mal.some(row=>row[1]===2&&row[2]==='남편들'&&row[7].includes('13-14')),'언약을 저버린 남편의 질문');
 assert.ok(mal.some(row=>row[1]===2&&row[2]==='하나님'&&row[7].includes('14-16')),'배우자에 대한 언약 파기를 책망');
 assert.ok(mal.some(row=>row[1]===3&&row[2]==='여호와를 경외하는 자들'&&row[7].includes('16')),'서로 격려하는 경외자들');
 assert.ok(mal.some(row=>row[1]===4&&row[2]==='하나님'&&row[7].includes('4-6')),'모세의 율법과 엘리야의 약속');
});

test('마태복음 1–12장의 시작 사건·산상 설교·갈릴리 사역은 화자와 본문 근거를 구분한다',()=>{
 const matthew=JSON.parse(readFileSync(new URL('../data/summary/mat.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='mat'&&row[1]<=12);
 const maxVerse={1:25,2:23,3:17,4:25,5:48,6:34,7:29,8:34,9:38,10:42,11:30,12:50};
 for(let chapter=1;chapter<=12;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`마태복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`마태복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`마태복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(matthew.chapters[String(row[1])].people.some(person=>person.name===row[2]),`마태복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`마태복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='헤롯'&&row[6].includes('16')),'헤롯의 살해 명령을 박사 대사와 분리');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='예수'&&row[6].includes('15')),'요한의 질문에 대한 예수의 답');
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='마귀'&&row[6].includes('9')),'세 번째 시험의 발화자');
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='예수'&&row[6].includes('43-48')),'원수 사랑의 문맥');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='예수'&&row[6].includes('19-24')),'재물과 두 주인을 섬길 수 없다는 가르침');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='예수'&&row[6].includes('15-23')),'거짓 예언자를 열매로 분별');
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='나병환자'&&row[6].includes('2')),'나병환자의 요청');
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='혈루증 여인'&&row[6].includes('20-21')),'혈루증 여인의 믿음');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='예수'&&row[6].includes('16-20')),'파송 제자들에게 주신 박해 중의 지침');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='요한의 제자들'&&row[6].includes('2-3')),'감옥에서 보낸 세례 요한의 질문');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='바리새인'&&row[6].includes('24')),'바알세불 비난의 화자');
});

test('마태복음 13–15장의 비유·표적·이방 여인 문답은 실제 화자와 문장별 근거를 갖는다',()=>{
 const matthew=JSON.parse(readFileSync(new URL('../data/summary/mat.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='mat'&&row[1]>=13&&row[1]<=15);
 const maxVerse={13:58,14:36,15:39};
 for(let chapter=13;chapter<=15;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`마태복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`마태복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`마태복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(matthew.chapters[String(row[1])].people.some(person=>person.name===row[2]),`마태복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`마태복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='제자들'&&row[6].includes('36')),'가라지 비유의 설명 요청');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='헤로디아의 딸'&&row[6].includes('8')),'헤롯의 추측과 딸의 요청을 구분');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='베드로'&&row[6].includes('30')),'물에 빠진 베드로의 구조 요청');
 assert.ok(rows.some(row=>row[1]===15&&row[2]==='가나안 여인'&&row[6].includes('27-28')),'가나안 여인의 믿음의 응답');
 assert.ok(rows.some(row=>row[1]===15&&row[2]==='예수'&&row[6].includes('32-38')),'굶주린 무리를 불쌍히 여기신 예수의 말씀');
});

test('마태복음 16–19장의 제자 고백·변화산·공동체 교훈·부자 청년 문답을 실제 화자와 연결한다',()=>{
 const matthew=JSON.parse(readFileSync(new URL('../data/summary/mat.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='mat'&&row[1]>=16&&row[1]<=19);
 const maxVerse={16:28,17:27,18:35,19:30};
 for(let chapter=16;chapter<=19;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`마태복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`마태복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`마태복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(matthew.chapters[String(row[1])].people.some(person=>person.name===row[2]),`마태복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`마태복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='베드로'&&row[6].includes('22')),'수난 예고에 반대한 베드로의 말');
 assert.ok(rows.some(row=>row[1]===17&&row[2]==='아이의 아버지'&&row[6].includes('15-16')),'아들을 위한 아버지의 간청');
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='무자비한 종'&&row[6].includes('28')),'탕감받고도 동료를 옥에 가둔 종');
 assert.ok(rows.some(row=>row[1]===19&&row[2]==='바리새인'&&row[6].includes('7')),'이혼 증서에 관한 바리새인의 반문');
});

test('마태복음 20–23장의 예루살렘 입성·논쟁·성전 책망은 본문 속 화자와 근거를 갖는다',()=>{
 const matthew=JSON.parse(readFileSync(new URL('../data/summary/mat.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='mat'&&row[1]>=20&&row[1]<=23);
 const maxVerse={20:34,21:46,22:46,23:39};
 for(let chapter=20;chapter<=23;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`마태복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`마태복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`마태복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(matthew.chapters[String(row[1])].people.some(person=>person.name===row[2]),`마태복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`마태복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===20&&row[2]==='품꾼들'&&row[6].includes('11-12')),'늦게 온 일꾼의 동일 품삯에 대한 불평');
 assert.ok(rows.some(row=>row[1]===21&&row[2]==='대제사장과 장로들'&&row[6].includes('23')),'예수의 권위에 대한 질문');
 assert.ok(rows.some(row=>row[1]===22&&row[2]==='사두개인'&&row[6].includes('23-28')),'부활을 부정한 이들의 가상 문답');
 assert.ok(rows.some(row=>row[1]===23&&row[2]==='예수'&&row[6].includes('37-39')),'예루살렘을 향한 탄식');
});

test('마태복음 24–28장의 종말 교훈·수난·부활은 직접 발화와 서술을 구분한다',()=>{
 const matthew=JSON.parse(readFileSync(new URL('../data/summary/mat.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='mat'&&row[1]>=24&&row[1]<=28);
 const maxVerse={24:51,25:46,26:75,27:66,28:20};
 for(let chapter=24;chapter<=28;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`마태복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`마태복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`마태복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(matthew.chapters[String(row[1])].people.some(person=>person.name===row[2]),`마태복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`마태복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===24&&row[2]==='제자들'&&row[6].includes('3')),'성전 파괴와 임함의 징조를 묻는 제자들');
 assert.ok(rows.some(row=>row[1]===25&&row[2]==='게으른 종'&&row[6].includes('24-25')),'달란트를 감춘 종의 변명');
 assert.ok(rows.some(row=>row[1]===26&&row[2]==='가룟 유다'&&row[6].includes('49')),'입맞춤으로 예수를 넘기는 유다');
 assert.ok(rows.some(row=>row[1]===27&&row[2]==='빌라도의 아내'&&row[6].includes('19')),'빌라도에게 보낸 아내의 경고');
 assert.ok(rows.some(row=>row[1]===28&&row[2]==='주의 천사'&&row[6].includes('5-6')),'여인들에게 전한 부활 소식');
 assert.ok(rows.some(row=>row[1]===28&&row[2]==='예수'&&row[6].includes('19')),'모든 민족을 제자 삼으라는 명령');
});

test('마가복음 1–4장의 갈릴리 사역·안식일 논쟁·비유와 풍랑은 화자별 본문 근거를 갖는다',()=>{
 const mark=JSON.parse(readFileSync(new URL('../data/summary/mrk.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='mrk'&&row[1]>=1&&row[1]<=4);
 const maxVerse={1:45,2:28,3:35,4:41};
 for(let chapter=1;chapter<=4;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`마가복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`마가복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`마가복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(mark.chapters[String(row[1])].people.some(person=>person.name===row[2]),`마가복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`마가복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='세례 요한'&&row[6].includes('7-8')),'오실 이를 예고하는 세례 요한');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='서기관'&&row[6].includes('6-7')),'죄 사함 권세를 의심한 서기관');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='예수'&&row[6].includes('33-35')),'하나님 뜻을 행하는 이를 가족으로 부르심');
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='제자들'&&row[6].includes('38')),'풍랑 속 제자들의 두려운 질문');
});

test('마가복음 5–8장의 치유·헤롯의 잔치·이방 여인의 간구·베드로의 고백은 화자와 절 근거를 갖는다',()=>{
 const mark=JSON.parse(readFileSync(new URL('../data/summary/mrk.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='mrk'&&row[1]>=5&&row[1]<=8);
 const maxVerse={5:43,6:56,7:37,8:38};
 for(let chapter=5;chapter<=8;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`마가복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`마가복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`마가복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(mark.chapters[String(row[1])].people.some(person=>person.name===row[2]),`마가복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`마가복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='야이로'&&row[6].includes('22-23')),'딸을 살려 달라는 회당장 야이로의 간구');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='헤로디아의 딸'&&row[6].includes('25')),'헤로디아의 요구가 딸의 입으로 전달됨');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='수로보니게 여인'&&row[6].includes('28')),'딸을 위해 예수께 답한 이방 여인');
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='벳새다 맹인'&&row[6].includes('24')),'치유 도중 아직 흐릿하게 보인다는 응답');
});

test('마가복음 9–12장의 제자 훈련·예루살렘 입성·성전 논쟁은 실제 화자와 구절에 연결한다',()=>{
 const mark=JSON.parse(readFileSync(new URL('../data/summary/mrk.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='mrk'&&row[1]>=9&&row[1]<=12);
 const maxVerse={9:50,10:52,11:33,12:44};
 for(let chapter=9;chapter<=12;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`마가복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`마가복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`마가복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(mark.chapters[String(row[1])].people.some(person=>person.name===row[2]),`마가복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`마가복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='하나님'&&row[6].includes('7')),'변화산에서 들린 아들에 대한 아버지의 음성');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='재물이 많은 사람'&&row[6].includes('20')),'재물이 많은 사람의 계명 응답');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='대제사장과 서기관'&&row[6].includes('28')),'성전에서 권위를 따진 지도자들');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='사두개인'&&row[6].includes('18-23')),'부활을 부정하는 사두개인 문답');
});

test('마가복음 13–16장의 종말 교훈·수난·부활 증언을 화자와 본문 전승에 맞게 나눈다',()=>{
 const mark=JSON.parse(readFileSync(new URL('../data/summary/mrk.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='mrk'&&row[1]>=13&&row[1]<=16);
 const maxVerse={13:37,14:72,15:47,16:20};
 for(let chapter=13;chapter<=16;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`마가복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`마가복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`마가복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(mark.chapters[String(row[1])].people.some(person=>person.name===row[2]),`마가복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`마가복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='제자들'&&row[6].includes('3-4')),'마지막 때의 징조를 묻는 네 제자');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='가룟 유다'&&row[6].includes('45')),'입맞춤으로 예수를 가리킨 유다');
 assert.ok(rows.some(row=>row[1]===15&&row[2]==='무리'&&row[6].includes('13-14')),'빌라도 앞에서 십자가형을 외친 무리');
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='흰옷 입은 청년'&&row[6].includes('7')),'여인들에게 베드로를 포함해 전하라 한 천사적 사자');
});

test('누가복음 1–4장의 수태고지·탄생 증언·광야 시험·나사렛 회당을 실제 화자와 연결한다',()=>{
 const luke=JSON.parse(readFileSync(new URL('../data/summary/luk.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='luk'&&row[1]>=1&&row[1]<=4);
 const maxVerse={1:80,2:52,3:38,4:44};
 for(let chapter=1;chapter<=4;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`누가복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`누가복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`누가복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(luke.chapters[String(row[1])].people.some(person=>person.name===row[2]),`누가복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`누가복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='마리아'&&row[6].includes('46-55')),'마리아의 찬양');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='주의 사자'&&row[6].includes('10-12')),'목자들에게 전한 천사의 좋은 소식');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='군인'&&row[6].includes('14')),'군인에게 한 요한의 구체적 권면');
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='마귀'&&row[6].includes('9-11')),'성전 꼭대기에서 한 마귀의 시험');
});

test('누가복음 5–8장의 부르심·평지 설교·백부장 문답·갈릴리 표적은 화자와 절 근거를 갖는다',()=>{
 const luke=JSON.parse(readFileSync(new URL('../data/summary/luk.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='luk'&&row[1]>=5&&row[1]<=8);
 const maxVerse={5:39,6:49,7:50,8:56};
 for(let chapter=5;chapter<=8;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`누가복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`누가복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`누가복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(luke.chapters[String(row[1])].people.some(person=>person.name===row[2]),`누가복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`누가복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='나병환자'&&row[6].includes('12')),'깨끗하게 해 달라는 나병환자의 간구');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='예수'&&row[6].includes('27-38')),'원수 사랑과 자비를 가르치신 예수');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='백부장'&&row[6].includes('6-7')),'말씀만으로 종을 낫게 해 달라는 백부장');
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='야이로'&&row[6].includes('41-42')),'딸을 살려 달라고 간청한 야이로');
});

test('누가복음 9–12장의 제자 파송·선한 사마리아인·기도 교훈·깨어 있는 청지기를 화자와 연결한다',()=>{
 const luke=JSON.parse(readFileSync(new URL('../data/summary/luk.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='luk'&&row[1]>=9&&row[1]<=12);
 const maxVerse={9:62,10:42,11:54,12:59};
 for(let chapter=9;chapter<=12;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`누가복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`누가복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`누가복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(luke.chapters[String(row[1])].people.some(person=>person.name===row[2]),`누가복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`누가복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='베드로'&&row[6].includes('20')),'그리스도라고 고백한 베드로');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='사마리아 사람'&&row[6].includes('33-35')),'강도 만난 이를 돌본 사마리아 사람');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='제자들'&&row[6].includes('1')),'기도를 가르쳐 달라는 제자');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='어리석은 부자'&&row[6].includes('17-19')),'곳간을 더 크게 지으려는 부자의 독백');
});

test('누가복음 13–16장의 안식일 치유·잔치 비유·두 아들·청지기와 나사로를 실제 화자에 연결한다',()=>{
 const luke=JSON.parse(readFileSync(new URL('../data/summary/luk.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='luk'&&row[1]>=13&&row[1]<=16);
 const maxVerse={13:35,14:35,15:32,16:31};
 for(let chapter=13;chapter<=16;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`누가복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`누가복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`누가복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(luke.chapters[String(row[1])].people.some(person=>person.name===row[2]),`누가복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`누가복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='포도원지기'&&row[6].includes('8-9')),'열매를 기다려 달라는 포도원지기');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='핑계한 자들'&&row[6].includes('18-20')),'잔치 초대를 거절한 이들의 핑계');
 assert.ok(rows.some(row=>row[1]===15&&row[2]==='맏아들'&&row[6].includes('29-30')),'동생의 귀환을 불평한 맏아들');
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='아브라함'&&row[6].includes('29')),'모세와 선지자의 말씀을 들으라는 아브라함');
});

test('누가복음 17–20장의 나병환자·기도 비유·삭개오·성전 논쟁은 화자와 구절이 맞는다',()=>{
 const luke=JSON.parse(readFileSync(new URL('../data/summary/luk.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='luk'&&row[1]>=17&&row[1]<=20);
 const maxVerse={17:37,18:43,19:48,20:47};
 for(let chapter=17;chapter<=20;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`누가복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`누가복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`누가복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(luke.chapters[String(row[1])].people.some(person=>person.name===row[2]),`누가복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`누가복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===17&&row[2]==='사도들'&&row[6].includes('5')),'믿음을 더해 달라는 사도들');
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='과부'&&row[6].includes('3-5')),'재판장에게 호소한 과부');
 assert.ok(rows.some(row=>row[1]===19&&row[2]==='삭개오'&&row[6].includes('8')),'재산을 나누고 갚겠다는 삭개오');
 assert.ok(rows.some(row=>row[1]===20&&row[2]==='사두개인'&&row[6].includes('28-33')),'부활을 부정하는 사두개인들의 질문');
});

test('누가복음 21–24장의 성전 예언·수난·십자가·부활 증언을 장별 화자에 연결한다',()=>{
 const luke=JSON.parse(readFileSync(new URL('../data/summary/luk.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='luk'&&row[1]>=21&&row[1]<=24);
 const maxVerse={21:38,22:71,23:56,24:53};
 for(let chapter=21;chapter<=24;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`누가복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`누가복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`누가복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(luke.chapters[String(row[1])].people.some(person=>person.name===row[2]),`누가복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`누가복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===21&&row[2]==='제자들'&&row[6].includes('7')),'성전 무너짐의 때와 징조를 묻는 제자들');
 assert.ok(rows.some(row=>row[1]===22&&row[2]==='베드로'&&row[6].includes('57-60')),'예수를 세 번 부인한 베드로');
 assert.ok(rows.some(row=>row[1]===23&&row[2]==='빌라도'&&row[6].includes('22')),'예수에게서 죽일 죄를 찾지 못한 빌라도');
 assert.ok(rows.some(row=>row[1]===24&&row[2]==='천사들'&&row[6].includes('5-7')),'부활을 전한 두 천사');
});

test('요한복음 1–4장의 세례 요한 증언·가나 표적·니고데모·사마리아 대화를 실제 화자에 연결한다',()=>{
 const john=JSON.parse(readFileSync(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='jhn'&&row[1]>=1&&row[1]<=4);
 const maxVerse={1:51,2:25,3:36,4:54};
 for(let chapter=1;chapter<=4;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`요한복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`요한복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`요한복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(john.chapters[String(row[1])].people.some(person=>person.name===row[2]),`요한복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`요한복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='요한'&&row[6].includes('29-37')),'하나님의 어린 양을 증언한 요한');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='예수'&&row[6].includes('16')),'성전을 장사하는 집으로 만들지 말라는 예수');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='니고데모'&&row[6].includes('4')),'거듭남을 묻는 니고데모');
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='사마리아 여자'&&row[6].includes('28-30')),'마을에 그리스도를 전한 사마리아 여자');
});

test('요한복음 5–8장의 안식일 논쟁·생명의 떡·초막절 논쟁·세상의 빛을 화자와 연결한다',()=>{
 const john=JSON.parse(readFileSync(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='jhn'&&row[1]>=5&&row[1]<=8);
 const maxVerse={5:47,6:71,7:53,8:59};
 for(let chapter=5;chapter<=8;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`요한복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`요한복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`요한복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(john.chapters[String(row[1])].people.some(person=>person.name===row[2]),`요한복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`요한복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='서른여덟 해 된 병자'&&row[6].includes('7')),'도움을 청한 베데스다 병자');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='시몬 베드로'&&row[6].includes('68-69')),'떠나지 않겠다고 고백한 베드로');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='니고데모'&&row[6].includes('50-52')),'공정한 심문을 요구한 니고데모');
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='간음 중에 잡힌 여자'&&row[6].includes('11')),'정죄받지 않고 떠난 여자');
});

test('요한복음 9–12장의 맹인 치유·선한 목자·나사로의 부활·예루살렘 입성을 장면 화자에 연결한다',()=>{
 const john=JSON.parse(readFileSync(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='jhn'&&row[1]>=9&&row[1]<=12);
 const maxVerse={9:41,10:42,11:57,12:50};
 for(let chapter=9;chapter<=12;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`요한복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`요한복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`요한복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(john.chapters[String(row[1])].people.some(person=>person.name===row[2]),`요한복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`요한복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='맹인의 부모'&&row[6].includes('20')),'치유된 아들이 태어날 때부터 맹인이었다고 증언한 부모');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='예수'&&row[6].includes('27-30')),'양들을 지키는 선한 목자의 증언');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='마르다'&&row[6].includes('27')),'그리스도이심을 고백한 마르다');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='헬라인들'&&row[6].includes('21')),'예수를 뵙고자 요청한 헬라인들');
});

test('요한복음 13–16장의 발 씻김·고별 교훈·포도나무 비유·보혜사 약속을 장면 화자에 연결한다',()=>{
 const john=JSON.parse(readFileSync(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='jhn'&&row[1]>=13&&row[1]<=16);
 const maxVerse={13:38,14:31,15:27,16:33};
 for(let chapter=13;chapter<=16;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`요한복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`요한복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`요한복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(john.chapters[String(row[1])].people.some(person=>person.name===row[2]),`요한복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`요한복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='시몬 베드로'&&row[6].includes('36-37')),'목숨을 내놓겠다고 한 베드로');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='빌립'&&row[6].includes('8')),'아버지를 보여 달라고 한 빌립');
 assert.ok(rows.some(row=>row[1]===15&&row[2]==='예수'&&row[6].includes('26-27')),'성령과 제자들의 증언 약속');
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='제자들'&&row[6].includes('29-30')),'예수를 믿는다고 고백한 제자들');
});

test('요한복음 17–21장의 중보 기도·재판·십자가·부활·베드로 회복을 화자에 연결한다',()=>{
 const john=JSON.parse(readFileSync(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='jhn'&&row[1]>=17&&row[1]<=21);
 const maxVerse={17:26,18:40,19:42,20:31,21:25};
 for(let chapter=17;chapter<=21;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`요한복음 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`요한복음 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`요한복음 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(john.chapters[String(row[1])].people.some(person=>person.name===row[2]),`요한복음 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`요한복음 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===17&&row[2]==='예수'&&row[6].includes('20-23')),'믿는 이들의 하나 됨을 구하신 예수');
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='문 지키는 여종'&&row[6].includes('17')),'베드로에게 예수의 제자인지 묻는 여종');
 assert.ok(rows.some(row=>row[1]===19&&row[2]==='대제사장들'&&row[6].includes('15')),'가이사 외에는 왕이 없다고 한 대제사장들');
 assert.ok(rows.some(row=>row[1]===20&&row[2]==='막달라 마리아'&&row[6].includes('18')),'부활하신 예수를 보았다고 전한 마리아');
 assert.ok(rows.some(row=>row[1]===21&&row[2]==='시몬 베드로'&&row[6].includes('15-17')),'사랑을 고백하고 양을 맡은 베드로');
});

test('사도행전 1–4장의 승천·성령 강림·치유·공회 심문을 실제 발화자와 절에 연결한다',()=>{
 const acts=JSON.parse(readFileSync(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='act'&&row[1]>=1&&row[1]<=4);
 const maxVerse={1:26,2:47,3:26,4:37};
 for(let chapter=1;chapter<=4;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`사도행전 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`사도행전 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`사도행전 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(acts.chapters[String(row[1])].people.some(person=>person.name===row[2]),`사도행전 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`사도행전 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='예수'&&row[6].includes('7-8')),'땅끝까지 증인이 되라는 예수의 명령');
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='천사들'&&row[6].includes('10-11')),'예수의 다시 오심을 알린 두 사람');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='베드로'&&row[6].includes('38-40')),'회개와 세례를 권한 베드로');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='베드로'&&row[6].includes('17-26')),'치유 뒤 회개를 촉구한 베드로');
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='공회'&&row[6].includes('15-18')),'복음 전파를 금한 공회');
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='믿는 무리'&&row[6].includes('29-30')),'위협 뒤 담대함을 구한 공동체');
 assert.ok(!rows.some(row=>row[1]===3&&row[2]==='못 걷는 사람'),'행동과 찬양만 기록된 사람에게 임의 대사를 만들지 않음');
});

test('사도행전 5–8장의 공동체 갈등·스데반 증언·사마리아와 에티오피아 선교를 실제 화자에 연결한다',()=>{
 const acts=JSON.parse(readFileSync(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='act'&&row[1]>=5&&row[1]<=8);
 const maxVerse={5:42,6:15,7:60,8:40};
 for(let chapter=5;chapter<=8;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`사도행전 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`사도행전 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`사도행전 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(acts.chapters[String(row[1])].people.some(person=>person.name===row[2]),`사도행전 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`사도행전 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='삽비라'&&row[6].includes('8')),'삽비라가 베드로의 질문에 직접 답함');
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='가말리엘'&&row[6].includes('38-39')),'가말리엘이 공회에 자제를 권함');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='헬라파 유대인'&&row[6].includes('1')),'구제에서 소외된 과부들에 대한 불평');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='스데반'&&row[6].includes('51-60')),'스데반의 고발과 마지막 기도');
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='빌립'&&row[6].includes('35')),'이사야 말씀에서 예수를 전한 빌립');
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='에디오피아 내시'&&row[6].includes('34, 36')),'내시의 질문과 세례 요청');
 assert.ok(!rows.some(row=>row[1]===8&&row[2]==='간다게'),'언급만 된 여왕을 장면 화자로 만들지 않음');
});

test('사도행전 9–12장의 사울 회심·고넬료 사건·이방 선교·베드로 석방을 본문 화자와 연결한다',()=>{
 const acts=JSON.parse(readFileSync(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='act'&&row[1]>=9&&row[1]<=12);
 const maxVerse={9:43,10:48,11:30,12:25};
 for(let chapter=9;chapter<=12;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`사도행전 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`사도행전 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`사도행전 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(acts.chapters[String(row[1])].people.some(person=>person.name===row[2]),`사도행전 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`사도행전 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='예수'&&row[6].includes('4-6')),'박해자 사울을 부르신 예수');
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='아나니아'&&row[6].includes('13-14')),'사울에 대한 두려움을 밝힌 아나니아');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='성령'&&row[6].includes('19-20')),'베드로에게 이방인 사절과 가라고 하신 성령');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='고넬료가 보낸 사람들'&&row[6].includes('22')),'고넬료의 초청을 전한 사절');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='할례자들'&&row[6].includes('2-3')),'이방인과 식사한 베드로를 비난한 할례자들');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='아가보'&&row[6].includes('28')),'흉년을 예고한 아가보');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='로데'&&row[6].includes('14')),'베드로의 음성을 알아들은 로데');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='두로와 시돈 사람들'&&row[6].includes('22')),'헤롯을 신격화한 군중');
 assert.ok(!rows.some(row=>row[1]===9&&row[2]==='다비다'),'선행과 부활 행동만 서술된 다비다는 대사 화자에서 제외');
});

test('사도행전 13–16장의 선교 설교·루스드라 우상숭배·예루살렘 회의·빌립보 전도를 본문 화자와 연결한다',()=>{
 const acts=JSON.parse(readFileSync(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='act'&&row[1]>=13&&row[1]<=16);
 const maxVerse={13:52,14:28,15:41,16:40};
 for(let chapter=13;chapter<=16;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`사도행전 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`사도행전 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`사도행전 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(acts.chapters[String(row[1])].people.some(person=>person.name===row[2]),`사도행전 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`사도행전 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='성령'&&row[6].includes('2')),'바나바와 사울을 따로 세우신 성령');
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='바울'&&row[6].includes('38-41')),'죄 사함과 믿음으로 얻는 의를 선포한 바울');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='루스드라 무리'&&row[6].includes('11-13')),'바나바와 바울을 신으로 오해한 군중');
 assert.ok(rows.some(row=>row[1]===15&&row[2]==='베드로'&&row[6].includes('7-11')),'이방인 구원을 증언한 베드로');
 assert.ok(rows.some(row=>row[1]===15&&row[2]==='바나바'&&row[6].includes('37')),'마가를 동행시키려는 바나바');
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='루디아'&&row[6].includes('15')),'바울 일행을 집에 초대한 루디아');
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='간수'&&row[6].includes('30')),'구원의 길을 묻는 빌립보 간수');
 assert.ok(!rows.some(row=>row[1]===13&&row[2]==='요한'),'선교 일행으로 동행만 한 요한 마가는 직접 발화가 없어 제외');
});

test('사도행전 17–20장의 아테네 설교·고린도 재판·에베소 소요·밀레도 고별을 본문 화자에 연결한다',()=>{
 const acts=JSON.parse(readFileSync(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='act'&&row[1]>=17&&row[1]<=20);
 const maxVerse={17:34,18:28,19:41,20:38};
 for(let chapter=17;chapter<=20;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`사도행전 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`사도행전 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`사도행전 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(acts.chapters[String(row[1])].people.some(person=>person.name===row[2]),`사도행전 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`사도행전 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===17&&row[2]==='아테네 철학자들'&&row[6].includes('19-20')),'새 가르침의 뜻을 묻는 철학자들');
 assert.ok(rows.some(row=>row[1]===17&&row[2]==='바울'&&row[6].includes('30-31')),'회개와 부활하신 심판자를 전한 바울');
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='예수'&&row[6].includes('9-10')),'고린도에서 두려워하지 말라고 격려하신 예수');
 assert.ok(rows.some(row=>row[1]===19&&row[2]==='데메드리오'&&row[6].includes('25-27')),'생업과 아데미 신전을 내세운 데메드리오');
 assert.ok(rows.some(row=>row[1]===19&&row[2]==='서기장'&&row[6].includes('35-40')),'에베소 소요를 진정시킨 서기장');
 assert.ok(rows.some(row=>row[1]===20&&row[2]==='바울'&&row[6].includes('22-24')),'환난을 알면서 예루살렘으로 가는 바울');
 assert.ok(rows.some(row=>row[1]===20&&row[2]==='바울'&&row[6].includes('32-35')&&row[4].some(line=>line.includes('주는 것이 받는 것보다 복되다'))),'예수의 말씀을 인용하는 바울');assert.ok(!rows.some(row=>row[1]===20&&row[2]==='예수'),'인용된 예수는 현장 화자가 아님');
 assert.ok(!rows.some(row=>row[1]===20&&row[2]==='유두고'),'떨어진 뒤 회복된 유두고는 직접 말하지 않아 제외');
});

test('사도행전 21–24장의 예루살렘 체포·바울의 증언·공회와 총독 심문을 실제 화자와 근거에 연결한다',()=>{
 const acts=JSON.parse(readFileSync(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='act'&&row[1]>=21&&row[1]<=24);
 const maxVerse={21:40,22:30,23:35,24:27};
 for(let chapter=21;chapter<=24;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`사도행전 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`사도행전 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`사도행전 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(acts.chapters[String(row[1])].people.some(person=>person.name===row[2]),`사도행전 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`사도행전 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===21&&row[2]==='아가보'&&row[6].includes('11')),'바울의 결박을 예고한 아가보');
 assert.ok(rows.some(row=>row[1]===21&&row[2]==='야고보'&&row[6].includes('23-25')),'예루살렘 소문을 풀 방안을 권한 야고보');
 assert.ok(rows.some(row=>row[1]===22&&row[2]==='예수'&&row[6].includes('18')),'바울에게 예루살렘을 떠나라고 한 예수');
 assert.ok(rows.some(row=>row[1]===22&&row[2]==='아나니아'&&row[6].includes('13-16')),'바울의 회심 뒤 증언 사명을 알린 아나니아');
 assert.ok(rows.some(row=>row[1]===23&&row[2]==='예수'&&row[6].includes('11')),'로마에서도 증언할 바울을 격려한 예수');
 assert.ok(rows.some(row=>row[1]===23&&row[2]==='암살 결의자들'&&row[6].includes('14-15')&&row[6].includes('21')),'바울을 죽이려 모의한 이들');
 assert.ok(rows.some(row=>row[1]===24&&row[2]==='더둘로'&&row[6].includes('5-8')),'벨릭스 앞에서 바울을 고발한 더둘로');
 assert.ok(rows.some(row=>row[1]===24&&row[2]==='벨릭스'&&row[6].includes('25-27')),'바울을 미루어 심문한 벨릭스');
});

test('사도행전 25–28장의 황제 상소·아그립바 증언·난파·로마 도착을 실제 화자와 근거에 연결한다',()=>{
 const acts=JSON.parse(readFileSync(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='act'&&row[1]>=25&&row[1]<=28);
 const maxVerse={25:27,26:32,27:44,28:31};
 for(let chapter=25;chapter<=28;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`사도행전 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`사도행전 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`사도행전 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(acts.chapters[String(row[1])].people.some(person=>person.name===row[2]),`사도행전 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`사도행전 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===25&&row[2]==='바울'&&row[6].includes('10-12')),'황제에게 상소한 바울');
 assert.ok(rows.some(row=>row[1]===25&&row[2]==='베스도'&&row[6].includes('24-27')),'죄목 없이 황제에게 보낼 수 없다고 한 베스도');
 assert.ok(rows.some(row=>row[1]===26&&row[2]==='예수'&&row[6].includes('16-18')),'이방 사람에게 보냄을 받은 바울의 사명');
 assert.ok(rows.some(row=>row[1]===26&&row[2]==='아그립바'&&row[6].includes('28')),'바울의 증언에 응답한 아그립바');
 assert.ok(rows.some(row=>row[1]===27&&row[2]==='하나님의 사자'&&row[6].includes('23-24')),'난파 중 생명을 약속한 천사');
 assert.ok(rows.some(row=>row[1]===27&&row[2]==='바울'&&row[6].includes('33-34')),'굶주린 승객들에게 음식을 권한 바울');
 assert.ok(rows.some(row=>row[1]===28&&row[2]==='멜리데 원주민'&&row[6].includes('4')),'독사에 물린 바울을 오해한 원주민들');
 assert.ok(rows.some(row=>row[1]===28&&row[2]==='로마 유대인들'&&row[6].includes('21-22')),'바울의 사상을 직접 듣고 싶어 한 로마 유대인들');
 assert.ok(!rows.some(row=>row[2]==='이사야'),'인용된 선지자를 로마 현장 발화자로 만들지 않음');
});

test('로마서 1–4장의 복음·하나님의 공의·믿음으로 얻는 의를 바울의 문맥별 논증과 절에 연결한다',()=>{
 const romans=JSON.parse(readFileSync(new URL('../data/summary/rom.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='rom'&&row[1]>=1&&row[1]<=4);
 const maxVerse={1:32,2:29,3:31,4:25};
 for(let chapter=1;chapter<=4;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`로마서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`로마서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`로마서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(romans.chapters[String(row[1])].people.some(person=>person.name===row[2]),`로마서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`로마서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='바울'&&row[6].includes('16-17')),'복음을 구원하시는 하나님의 능력으로 선포한 바울');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='바울'&&row[6].includes('4-11')),'하나님의 인자와 공평한 심판을 설명한 바울');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='바울'&&row[6].includes('25-28')),'그리스도의 속량과 믿음으로 얻는 의를 설명한 바울');
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='바울'&&row[6].includes('18-22')),'약속을 신뢰한 아브라함을 예로 든 바울');
 assert.ok(!rows.some(row=>row[1]===4&&['아브라함','다윗','사라'].includes(row[2])),'인용되는 믿음의 선조들을 로마서 현장 화자로 만들지 않음');
});

test('로마서 5–8장의 은혜·새 생명·율법과 죄의 갈등·성령과 확신을 바울의 논증에 연결한다',()=>{
 const romans=JSON.parse(readFileSync(new URL('../data/summary/rom.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='rom'&&row[1]>=5&&row[1]<=8);
 const maxVerse={5:21,6:23,7:25,8:39};
 for(let chapter=5;chapter<=8;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`로마서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`로마서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`로마서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(romans.chapters[String(row[1])].people.some(person=>person.name===row[2]),`로마서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`로마서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='바울'&&row[6].includes('6-11')),'죄인일 때 죽으신 그리스도의 사랑');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='바울'&&row[6].includes('12-14')),'은혜 아래서 의의 도구로 살라는 권면');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='바울'&&row[6].includes('14-23')),'내면의 죄와 율법 갈등을 고백하는 바울');
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='바울'&&row[6].includes('28-39')),'부르신 자를 붙드시며 끊을 수 없는 하나님의 사랑');
});

test('로마서 9–12장의 이스라엘과 이방인·구원의 들음·남은 자·새 삶의 권면을 바울의 문맥에 연결한다',()=>{
 const romans=JSON.parse(readFileSync(new URL('../data/summary/rom.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='rom'&&row[1]>=9&&row[1]<=12);
 const maxVerse={9:33,10:21,11:36,12:21};
 for(let chapter=9;chapter<=12;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`로마서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`로마서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`로마서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(romans.chapters[String(row[1])].people.some(person=>person.name===row[2]),`로마서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`로마서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='바울'&&row[6].includes('14-18')),'하나님의 긍휼과 주권을 설명한 바울');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='바울'&&row[6].includes('14-17')),'복음 선포와 믿음의 들음을 잇는 바울');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='바울'&&row[6].includes('11-24')),'이방 신자에게 원가지를 자랑하지 말라 한 바울');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='바울'&&row[6].includes('20-21')),'선으로 악을 이기라고 권한 바울');
 assert.ok(!rows.some(row=>row[1]===9&&['아브라함','이삭','리브가','야곱','에서','모세','바로'].includes(row[2])),'구약 인용 인물들을 로마서 현장 화자로 만들지 않음');
});

test('로마서 13–16장의 권세·양심·상호 환대·선교 계획·마지막 문안을 문맥과 실제 화자에 연결한다',()=>{
 const romans=JSON.parse(readFileSync(new URL('../data/summary/rom.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='rom'&&row[1]>=13&&row[1]<=16);
 const maxVerse={13:14,14:23,15:33,16:27};
 for(let chapter=13;chapter<=16;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`로마서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`로마서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`로마서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(romans.chapters[String(row[1])].people.some(person=>person.name===row[2]),`로마서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`로마서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='바울'&&row[6].includes('1-7')),'양심을 따라 권세를 대하고 의무를 다하라는 가르침');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='바울'&&row[6].includes('13-18')),'음식 선택으로 형제를 넘어뜨리지 말라는 권면');
 assert.ok(rows.some(row=>row[1]===15&&row[2]==='바울'&&row[6].includes('30-33')),'예루살렘 사역을 두고 기도를 부탁한 바울');
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='더디오'&&row[6].includes('22')),'편지를 기록하며 문안한 더디오');
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='가이오'&&row[6].includes('23')),'온 교회를 돌보며 문안한 가이오');
 assert.ok(!rows.some(row=>row[1]===16&&['뵈뵈','브리스가','아굴라'].includes(row[2])),'문안만 받은 인물의 말을 임의로 만들지 않음');
});

test('고린도전서 1–4장의 분쟁·십자가·성령의 지혜·교회 지도자 비유를 바울의 논증에 연결한다',()=>{
 const corinthians=JSON.parse(readFileSync(new URL('../data/summary/1co.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='1co'&&row[1]>=1&&row[1]<=4);
 const maxVerse={1:31,2:16,3:23,4:21};
 for(let chapter=1;chapter<=4;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`고린도전서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`고린도전서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`고린도전서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(corinthians.chapters[String(row[1])].people.some(person=>person.name===row[2]),`고린도전서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`고린도전서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='바울'&&row[6].includes('10-16')),'파벌을 그친 공동체를 권한 바울');
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='바울'&&row[6].includes('17-25')),'십자가를 하나님의 능력으로 전한 바울');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='바울'&&row[6].includes('10-13')),'성령으로 하나님의 지혜를 아는 바울');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='바울'&&row[6].includes('13-15')),'각 사람의 공적이 시험받는다고 한 바울');
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='바울'&&row[6].includes('18-21')),'고린도에 갈 때의 교정을 미리 알린 바울');
 assert.ok(!rows.some(row=>row[1]===3&&['아볼로','게바'].includes(row[2])),'파벌 이름으로 언급된 사역자들을 발화자로 꾸미지 않음');
});

test('고린도전서 5–8장의 교회 징계·형제 간 분쟁·결혼과 독신·양심과 자유를 바울의 문맥에 연결한다',()=>{
 const corinthians=JSON.parse(readFileSync(new URL('../data/summary/1co.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='1co'&&row[1]>=5&&row[1]<=8);
 const maxVerse={5:13,6:20,7:40,8:13};
 for(let chapter=5;chapter<=8;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`고린도전서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`고린도전서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`고린도전서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(corinthians.chapters[String(row[1])].people.some(person=>person.name===row[2]),`고린도전서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`고린도전서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='바울'&&row[6].includes('9-13')),'교회 안팎의 징계를 구별한 바울');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='바울'&&row[6].includes('18-20')),'몸을 성령의 전으로 설명한 바울');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='바울'&&row[6].includes('10-16')),'결혼한 이들의 분리와 믿지 않는 배우자 문제를 다룬 바울');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='바울'&&row[6].includes('36-40')),'결혼과 독신의 선택을 각자의 형편에 두는 바울');
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='바울'&&row[6].includes('11-13')),'형제를 위해 자유를 제한하겠다는 바울');
});

test('고린도전서 9–12장의 사도적 권리·광야의 경고·성찬·은사와 한 몸을 근거 절에 연결한다',()=>{
 const corinthians=JSON.parse(readFileSync(new URL('../data/summary/1co.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='1co'&&row[1]>=9&&row[1]<=12);
 const maxVerse={9:27,10:33,11:34,12:31};
 for(let chapter=9;chapter<=12;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`고린도전서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`고린도전서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`고린도전서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(corinthians.chapters[String(row[1])].people.some(person=>person.name===row[2]),`고린도전서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`고린도전서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='바울'&&row[6].includes('4-18')),'복음에 장애가 되지 않도록 사도 권리를 내려놓은 바울');
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='바울'&&row[6].includes('19-23')),'복음을 위해 여러 사람의 종이 된 바울');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='바울'&&row[6].includes('6-12')),'광야의 실패를 우상숭배와 시험에 대한 경고로 든 바울');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='바울'&&row[6].includes('23-33')),'자유보다 덕과 이웃의 유익을 구하라는 바울');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='예수'&&row[6].includes('24')&&row[6].includes('25')),'성찬에서 몸과 새 언약의 잔을 주신 예수');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='바울'&&row[6].includes('17-22')),'가난한 이를 부끄럽게 한 공동 식사를 책망한 바울');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='바울'&&row[6].includes('4-11')),'공동의 유익을 위해 은사를 나누시는 한 성령을 설명한 바울');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='바울'&&row[6].includes('15-26')),'약해 보이는 지체를 귀히 여기고 함께 돌보라는 바울');
 assert.ok(!rows.some(row=>row[1]===10&&['모세','우리 조상들'].includes(row[2])),'광야 사건의 인용 인물들을 고린도 현장 화자로 만들지 않음');
});

test('고린도전서 13–16장의 사랑·예배 질서·부활 소망·구제와 동역자 문안을 본문 절에 연결한다',()=>{
 const corinthians=JSON.parse(readFileSync(new URL('../data/summary/1co.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='1co'&&row[1]>=13&&row[1]<=16);
 const maxVerse={13:13,14:40,15:58,16:24};
 for(let chapter=13;chapter<=16;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`고린도전서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`고린도전서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`고린도전서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(corinthians.chapters[String(row[1])].people.some(person=>person.name===row[2]),`고린도전서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`고린도전서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===13&&row[6].includes('8-12')),'부분적 은사와 온전한 앎의 소망을 구분함');
 assert.ok(rows.some(row=>row[1]===14&&row[6].includes('26-33')),'은사 발화를 교회의 덕과 질서에 맞추라는 바울');
 assert.ok(rows.some(row=>row[1]===14&&row[6].includes('34-40')),'예배 중 발언 규정과 11장 문맥을 함께 살피도록 함');
 assert.ok(rows.some(row=>row[1]===15&&row[6].includes('35-44')),'씨앗의 비유로 부활 몸을 설명한 바울');
 assert.ok(rows.some(row=>row[1]===15&&row[6].includes('50-57')),'마지막 나팔과 죽음의 패배를 선포한 바울');
 assert.ok(rows.some(row=>row[1]===16&&row[6].includes('1-4')),'형편에 따라 예루살렘 성도 구제를 준비하라는 바울');
 assert.ok(rows.some(row=>row[1]===16&&row[6].includes('19-24')),'아시아 교회의 문안과 바울의 친필 인사를 전함');
 assert.ok(!rows.some(row=>row[1]===15&&['게바','열두 제자','오백여 형제','야고보'].includes(row[2])),'부활 목격 증언을 인용된 현장 발화로 꾸미지 않음');
});

test('고린도후서 1–4장의 환난 중 위로·용서와 회복·새 언약·질그릇의 복음을 바울의 편지 문맥에 연결한다',()=>{
 const corinthians=JSON.parse(readFileSync(new URL('../data/summary/2co.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='2co'&&row[1]>=1&&row[1]<=4);
 const maxVerse={1:24,2:17,3:18,4:18};
 for(let chapter=1;chapter<=4;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`고린도후서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`고린도후서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`고린도후서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(corinthians.chapters[String(row[1])].people.some(person=>person.name===row[2]),`고린도후서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`고린도후서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[6].includes('8-11')),'아시아의 환난에서 하나님과 성도들의 기도를 의지한 바울');
 assert.ok(rows.some(row=>row[1]===1&&row[6].includes('23-24')),'고린도 교회를 지배하지 않고 기쁨을 돕겠다는 바울');
 assert.ok(rows.some(row=>row[1]===2&&row[6].includes('5-11')),'징계 뒤 용서하고 위로하라고 권한 바울');
 assert.ok(rows.some(row=>row[1]===3&&row[6].includes('7-12')),'옛 언약의 영광을 인정하며 새 언약의 소망을 설명한 바울');
 assert.ok(rows.some(row=>row[1]===4&&row[6].includes('7')),'복음의 능력이 하나님께 있음을 밝힌 바울');
 assert.ok(rows.some(row=>row[1]===4&&row[6].includes('13-18')),'부활 소망으로 낙심하지 않는 바울');
 assert.ok(!rows.some(row=>row[2]==='디모데'||row[2]==='디도'),'동역자가 언급되었다는 이유만으로 편지 발화자로 만들지 않음');
});

test('고린도후서 5–8장의 화목·복음 사역·회개 뒤 회복·자원하는 구제를 본문과 문맥에 연결한다',()=>{
 const corinthians=JSON.parse(readFileSync(new URL('../data/summary/2co.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='2co'&&row[1]>=5&&row[1]<=8);
 const maxVerse={5:21,6:18,7:16,8:24};
 for(let chapter=5;chapter<=8;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`고린도후서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`고린도후서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`고린도후서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(corinthians.chapters[String(row[1])].people.some(person=>person.name===row[2]),`고린도후서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`고린도후서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===5&&row[6].includes('17-19')&&row[6].includes('20-21')),'새 창조와 화목의 직분을 전한 바울');
 assert.ok(rows.some(row=>row[1]===6&&row[6].includes('14-18')),'신앙 타협을 경계하되 믿지 않는 이웃과의 단절로 확대하지 않음');
 assert.ok(rows.some(row=>row[1]===7&&row[6].includes('8-12')),'고린도 교회의 회개와 바로잡음을 보고한 바울');
 assert.ok(rows.some(row=>row[1]===8&&row[6].includes('13-15')),'있는 대로 자원해 나누는 공평한 구제를 권한 바울');
 assert.ok(rows.some(row=>row[1]===8&&row[6].includes('16-24')),'구제 연보를 신뢰받는 대표들과 투명하게 전달함');
 assert.ok(!rows.some(row=>row[1]===8&&['디도','마게도냐 교회들','예루살렘 성도'].includes(row[2])),'언급된 동역자와 수혜자에게 임의 대사를 만들지 않음');
});

test('고린도후서 9–12장의 자원하는 연보·사도 권위의 목적·약함의 자랑과 주님의 응답을 구별한다',()=>{
 const corinthians=JSON.parse(readFileSync(new URL('../data/summary/2co.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='2co'&&row[1]>=9&&row[1]<=12);
 const maxVerse={9:15,10:18,11:33,12:21};
 for(let chapter=9;chapter<=12;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`고린도후서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`고린도후서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`고린도후서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(corinthians.chapters[String(row[1])].people.some(person=>person.name===row[2]),`고린도후서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`고린도후서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='바울'&&row[6].includes('6-7')),'억지나 인색함이 아니라 기쁜 마음으로 나누라는 바울');
 assert.ok(rows.some(row=>row[1]===10&&row[6].includes('1-2')),'그리스도의 온유와 관용으로 권면하는 바울');
 assert.ok(rows.some(row=>row[1]===11&&row[6].includes('28-33')),'교회를 향한 염려와 자기 약함을 말한 바울');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='바울'&&row[6].includes('9-10')),'약함 가운데 그리스도의 능력을 의지한 바울');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='예수'&&row[6].includes('9')),'바울의 간구에 답하신 주님의 말씀을 직접 화자로 분리');
 assert.ok(!rows.some(row=>row[1]===12&&row[2]==='셋째 하늘에 간 사람'),'바울의 환상을 별도 인물의 현장 발화로 만들지 않음');
});

test('고린도후서 13장과 갈라디아서 1–4장의 복음·이방인 환대·칭의·약속의 자녀를 바울의 논증과 절에 연결한다',()=>{
 const corinthians=JSON.parse(readFileSync(new URL('../data/summary/2co.json',import.meta.url),'utf8'));
 const galatians=JSON.parse(readFileSync(new URL('../data/summary/gal.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>(row[0]==='2co'&&row[1]===13)||(row[0]==='gal'&&row[1]>=1&&row[1]<=4));
 const maxVerse={2:14,1:24,2:21,3:29,4:31};
 for(const [book,start,end] of [['2co',13,13],['gal',1,4]])for(let chapter=start;chapter<=end;chapter++)assert.ok(rows.some(row=>row[0]===book&&row[1]===chapter),`${book} ${chapter}장`);
 for(const row of rows){
  const summary=row[0]==='2co'?corinthians:galatians;
  assert.equal(row[6].length,row[4].length,`${row[0]} ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`${row[0]} ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(summary.chapters[String(row[1])].people.some(person=>person.name===row[2]),`${row[0]} ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[0]==='2co'?2:row[1]],`${row[0]} ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[0]==='2co'&&row[1]===13&&row[6].includes('5-7')),'믿음 안에 있는지 자신을 살피라는 바울');
 assert.ok(rows.some(row=>row[0]==='gal'&&row[1]===1&&row[6].includes('13-17')),'교회 박해자에서 이방인의 사도로 부름받은 바울');
 assert.ok(rows.some(row=>row[0]==='gal'&&row[1]===2&&row[6].includes('11-13')&&row[6].includes('14-16')),'이방인 식탁에서 물러난 게바를 책망한 바울');
 assert.ok(rows.some(row=>row[0]==='gal'&&row[1]===3&&row[6].includes('26-29')),'그리스도 안에서 한 몸이 된 약속의 상속자');
 assert.ok(rows.some(row=>row[0]==='gal'&&row[1]===4&&row[6].includes('22-31')),'하갈과 사라를 언약의 비유로 사용한 논증을 현실의 추방 명령으로 읽지 않음');
 assert.ok(!rows.some(row=>row[0]==='gal'&&['아브라함','하갈','사라','이삭','이스마엘','게바','야고보','요한'].includes(row[2])),'편지에서 인용·회고되는 인물을 현재 현장 대사로 만들지 않음');
});

test('갈라디아서 5–6장과 에베소서 1–4장의 자유·성령의 열매·새 창조·한 몸의 삶을 절별 근거에 연결한다',()=>{
 const galatians=JSON.parse(readFileSync(new URL('../data/summary/gal.json',import.meta.url),'utf8'));
 const ephesians=JSON.parse(readFileSync(new URL('../data/summary/eph.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>(row[0]==='gal'&&row[1]>=5&&row[1]<=6)||(row[0]==='eph'&&row[1]>=1&&row[1]<=4));
 const maxVerse={5:26,6:18,1:23,2:22,3:21,4:32};
 for(const [book,start,end] of [['gal',5,6],['eph',1,4]])for(let chapter=start;chapter<=end;chapter++)assert.ok(rows.some(row=>row[0]===book&&row[1]===chapter),`${book} ${chapter}장`);
 for(const row of rows){
  const summary=row[0]==='gal'?galatians:ephesians;
  assert.equal(row[6].length,row[4].length,`${row[0]} ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`${row[0]} ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(summary.chapters[String(row[1])].people.some(person=>person.name===row[2]),`${row[0]} ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`${row[0]} ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[0]==='gal'&&row[1]===5&&row[6].includes('13-15')),'자유를 이웃 사랑과 섬김으로 쓰라는 바울');
 assert.ok(rows.some(row=>row[0]==='gal'&&row[1]===6&&row[6].includes('1-5')),'온유한 회복과 서로 짐을 나누되 각자 책임도 지라는 권면');
 assert.ok(rows.some(row=>row[0]==='eph'&&row[1]===1&&row[6].includes('1-6')),'그리스도 안에서 택하시고 자녀 삼으신 은혜');
 assert.ok(rows.some(row=>row[0]==='eph'&&row[1]===2&&row[6].includes('1-10')),'은혜로 받는 구원과 선한 일의 열매를 구별함');
 assert.ok(rows.some(row=>row[0]==='eph'&&row[1]===3&&row[6].includes('14-19')),'에베소 교회를 위한 바울의 기도');
 assert.ok(rows.some(row=>row[0]==='eph'&&row[1]===4&&row[6].includes('17-29')),'새 사람의 공동체 윤리를 구체적 행동에 연결함');
 assert.ok(!rows.some(row=>row[0]==='eph'&&['에베소 성도들','이방인들','이스라엘'].includes(row[2])),'편지의 수신자를 대답하지 않은 현장 화자로 만들지 않음');
});

test('에베소서 5–6장과 빌립보서 1–4장의 관계 권면·영적 싸움·동역과 기쁨을 본문 범위에 연결한다',()=>{
 const ephesians=JSON.parse(readFileSync(new URL('../data/summary/eph.json',import.meta.url),'utf8'));
 const philippians=JSON.parse(readFileSync(new URL('../data/summary/php.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>(row[0]==='eph'&&row[1]>=5&&row[1]<=6)||(row[0]==='php'&&row[1]>=1&&row[1]<=4));
 const maxVerse={5:33,6:24,1:30,2:30,3:21,4:23};
 for(const [book,start,end] of [['eph',5,6],['php',1,4]])for(let chapter=start;chapter<=end;chapter++)assert.ok(rows.some(row=>row[0]===book&&row[1]===chapter),`${book} ${chapter}장`);
 for(const row of rows){
  const summary=row[0]==='eph'?ephesians:philippians;
  assert.equal(row[6].length,row[4].length,`${row[0]} ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`${row[0]} ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(summary.chapters[String(row[1])].people.some(person=>person.name===row[2]),`${row[0]} ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`${row[0]} ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[0]==='eph'&&row[1]===5&&row[6].includes('21-24')),'그리스도 안에서 서로 복종하는 권면과 아내·남편 지시를 함께 둠');
 assert.ok(rows.some(row=>row[0]==='eph'&&row[1]===6&&row[6].includes('5-7')),'노예제 본문을 당시 관계에 한정하고 오늘의 착취 정당화로 삼지 않음');
 assert.ok(rows.some(row=>row[0]==='eph'&&row[1]===6&&row[6].includes('19-24')),'복음을 담대히 전하게 기도해 달라 하고 두기고를 보낸 바울');
 assert.ok(rows.some(row=>row[0]==='php'&&row[1]===2&&row[6].includes('19-30')),'디모데와 에바브로디도를 복음의 동역자로 소개함');
 assert.ok(rows.some(row=>row[0]==='php'&&row[1]===4&&row[6].includes('1-3')),'유오디아와 순두게에게 화해를 권하고 동역자에게 도움을 부탁함');
 assert.ok(rows.some(row=>row[0]==='php'&&row[1]===4&&row[6].includes('10-13')),'자족과 그리스도의 능력은 모든 형편을 견디는 비결임');
 assert.ok(!rows.some(row=>row[0]==='php'&&['디모데','에바브로디도','유오디아','순두게'].includes(row[2])),'언급된 동역자에게 기록되지 않은 말을 만들지 않음');
});

test('골로새서 1–4장의 그리스도의 우월성·복음의 소망·새 사람·공정한 관계와 동역자 문안을 연결한다',()=>{
 const colossians=JSON.parse(readFileSync(new URL('../data/summary/col.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='col'&&row[1]>=1&&row[1]<=4);
 const maxVerse={1:29,2:23,3:25,4:18};
 for(let chapter=1;chapter<=4;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`골로새서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`골로새서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`골로새서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(colossians.chapters[String(row[1])].people.some(person=>person.name===row[2]),`골로새서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`골로새서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[6].includes('15-18')),'그리스도를 창조주이자 교회의 머리로 선포함');
 assert.ok(rows.some(row=>row[1]===1&&row[6].includes('19-23')),'십자가의 피로 이룬 화평과 화목을 설명함');
 assert.ok(rows.some(row=>row[1]===2&&row[6].includes('15-17')),'음식과 절기를 두고 성도를 정죄하지 말라 함');
 assert.ok(rows.some(row=>row[1]===3&&row[6].includes('18-25')),'가정 지시와 노예제 언급을 역사 맥락에 두고 착취 정당화로 쓰지 않음');
 assert.ok(rows.some(row=>row[1]===4&&row[6].includes('7-9')),'두기고와 오네시모를 신실한 형제로 보내 소식과 위로를 전함');
 assert.ok(!rows.some(row=>row[2]==='에바브라'||row[2]==='두기고'||row[2]==='오네시모'),'보고된 동역자와 편지 인사를 임의의 대사로 확장하지 않음');
});

test('데살로니가전서 1–5장의 선교 동역·고난 중 믿음·죽은 자의 소망·깨어 있는 공동체를 본문에 연결한다',()=>{
 const thessalonians=JSON.parse(readFileSync(new URL('../data/summary/1th.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='1th'&&row[1]>=1&&row[1]<=5);
 const maxVerse={1:10,2:20,3:13,4:18,5:28};
 for(let chapter=1;chapter<=5;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`데살로니가전서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`데살로니가전서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`데살로니가전서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(thessalonians.chapters[String(row[1])].people.some(person=>person.name===row[2]),`데살로니가전서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`데살로니가전서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[6].includes('5-6')),'환난 가운데 성령의 기쁨으로 말씀을 받은 교회');
 assert.ok(rows.some(row=>row[1]===2&&row[6].includes('7-12')),'어머니와 아버지처럼 교회를 돌본 바울');
 assert.ok(rows.some(row=>row[1]===2&&row[6].includes('14-16')),'특정 선교 반대자에 대한 문장을 모든 유대인에 대한 집단 비난으로 확대하지 않음');
 assert.ok(rows.some(row=>row[1]===3&&row[6].includes('6-8')),'디모데의 보고가 바울 일행에게 준 위로');
 assert.ok(rows.some(row=>row[1]===4&&row[6].includes('13-14')&&row[6].includes('15-18')),'죽은 성도와 살아 있는 성도의 소망을 남은 이들의 위로로 전함');
 assert.ok(rows.some(row=>row[1]===5&&row[6].includes('12-15')),'지도자 존중과 약한 이 돌봄·악을 선으로 갚으라는 권면');
 assert.ok(!rows.some(row=>['디모데','유대인들','자는 자들','천사장'].includes(row[2])),'보고된 동역자·집단·예언 장면의 인물을 현재 발화자로 만들지 않음');
});

test('데살로니가후서 1–3장의 박해받는 성도의 위로·재림 소문에 대한 경계·공동체의 노동과 형제 권면을 연결한다',()=>{
 const thessalonians=JSON.parse(readFileSync(new URL('../data/summary/2th.json',import.meta.url),'utf8'));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='2th'&&row[1]>=1&&row[1]<=3);
 const maxVerse={1:12,2:17,3:18};
 for(let chapter=1;chapter<=3;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`데살로니가후서 ${chapter}장`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`데살로니가후서 ${row[1]}장 ${row[2]} 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`데살로니가후서 ${row[1]}장 ${row[2]} 발화 수`);
  assert.ok(thessalonians.chapters[String(row[1])].people.some(person=>person.name===row[2]),`데살로니가후서 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=maxVerse[row[1]],`데살로니가후서 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[6].includes('6-7')),'박해받는 이의 안식과 하나님의 공의를 말하되 복수의 명령으로 만들지 않음');
 assert.ok(rows.some(row=>row[1]===2&&row[6].includes('1-5')),'주의 날이 이미 왔다는 소문에 흔들리지 말라고 함');
 assert.ok(rows.some(row=>row[1]===2&&row[6].includes('8-12')),'불법한 자에 관한 본문을 현대 인물이나 날짜 단정에 사용하지 않음');
 assert.ok(rows.some(row=>row[1]===3&&row[6].includes('6-10')),'일할 수 있으면서 거부하는 경우를 공동체 노동 문맥에 한정함');
 assert.ok(rows.some(row=>row[1]===3&&row[6].includes('11-15')),'바로잡을 때 원수 아닌 형제로 권면함');
 assert.ok(!rows.some(row=>['실루아노','디모데','불법의 사람','막는 자'].includes(row[2])),'인사·예언·배경에 등장한 인물을 편지 화자로 만들지 않음');
});

test('디모데전서 5–6장·디모데후서 1–4장·디도서 1–3장의 목회 권면을 실제 화자와 본문 범위에 연결한다',()=>{
 const books={
  '1ti':{chapters:[5,6],max:{5:25,6:21}},
  '2ti':{chapters:[1,2,3,4],max:{1:18,2:26,3:17,4:22}},
  tit:{chapters:[1,2,3],max:{1:16,2:15,3:15}}
 };
 for(const [book,{chapters,max}] of Object.entries(books)){
  const summary=JSON.parse(readFileSync(new URL(`../data/summary/${book}.json`,import.meta.url),'utf8'));
  const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]===book&&chapters.includes(row[1]));
  for(const chapter of chapters)assert.ok(rows.some(row=>row[1]===chapter),`${book} ${chapter}장 발화`);
  for(const row of rows){
   assert.equal(row[6].length,row[4].length,`${book} ${row[1]}장 발화별 근거`);
   assert.ok(row[4].length>=1&&row[4].length<=5,`${book} ${row[1]}장 발화 수`);
   assert.ok(summary.chapters[String(row[1])].people.some(person=>person.name===row[2]),`${book} ${row[1]}장 ${row[2]} 색인`);
   for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=max[row[1]],`${book} ${row[1]}장 ${ref} 범위`);}
  }
 }
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>(row[0]==='1ti'&&row[1]>=5)||row[0]==='2ti'||row[0]==='tit');
 assert.ok(rows.some(row=>row[0]==='1ti'&&row[1]===5&&row[6].includes('17-21')),'장로 존중과 증거에 근거한 공정한 책망을 함께 다룸');
 assert.ok(rows.some(row=>row[0]==='1ti'&&row[1]===6&&row[6].includes('17-19')),'부한 자에게 재물 대신 하나님께 소망을 두고 나누라고 권함');
 assert.ok(rows.some(row=>row[0]==='2ti'&&row[1]===1&&row[6].includes('8-10')),'옥중의 바울이 디모데에게 복음 고난을 부끄러워 말라 권함');
 assert.ok(rows.some(row=>row[0]==='2ti'&&row[1]===3&&row[6].includes('6-9')),'거짓 교사들의 유인 행위를 여성 일반의 특성으로 확대하지 않음');
 assert.ok(rows.some(row=>row[0]==='2ti'&&row[1]===4&&row[6].includes('14-18')),'재판 때 홀로 선 바울 곁에 주께서 힘 주신 일을 고백함');
 assert.ok(rows.some(row=>row[0]==='tit'&&row[1]===1&&row[6].includes('10-14')),'그레데인에 대한 인용을 모든 주민에 대한 일반화 근거로 삼지 않음');
 assert.ok(rows.some(row=>row[0]==='tit'&&row[1]===2&&row[6].includes('9-10')),'노예제와 가정 지시를 역사 맥락에 두고 착취 정당화로 삼지 않음');
 assert.ok(rows.some(row=>row[0]==='tit'&&row[1]===3&&row[6].includes('3-7')),'구원은 공로가 아니라 긍휼과 성령의 새롭게 하심으로 온다고 설명함');
 assert.ok(!rows.some(row=>row[2]!=='바울'),'편지에서 언급만 된 이들을 장면 발화자로 만들지 않음');
});

test('빌레몬서와 히브리서 1–8장의 실제 인용 발화는 화자·절 근거가 분명하고 관계 설명을 덧붙인다',()=>{
 const books={phm:{chapters:[1],max:{1:25}},heb:{chapters:[1,2,3,4,5,6,7,8,9,10,11,12,13],max:{1:14,2:18,3:19,4:16,5:14,6:20,7:28,8:13,9:28,10:39,11:40,12:29,13:25}}};
 for(const [book,{chapters,max}] of Object.entries(books)){
  const summary=JSON.parse(readFileSync(new URL(`../data/summary/${book}.json`,import.meta.url),'utf8'));
  const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]===book&&chapters.includes(row[1]));
  for(const chapter of chapters)assert.ok(rows.some(row=>row[1]===chapter),`${book} ${chapter}장 발화`);
  for(const row of rows){
   assert.equal(row[6].length,row[4].length,`${book} ${row[1]}장 발화별 근거`);
   assert.ok(row[4].length>=1&&row[4].length<=5,`${book} ${row[1]}장 발화 수`);
   assert.ok(summary.chapters[String(row[1])].people.some(person=>person.name===row[2]),`${book} ${row[1]}장 ${row[2]} 색인`);
   for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=max[row[1]],`${book} ${row[1]}장 ${ref} 범위`);}
  }
 }
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='heb');
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='하나님'&&row[6].includes('8-9')),'아들에게 하신 하나님의 시편 인용을 하나님 발화로 표기함');
 assert.ok(rows.some(row=>row[1]===2&&row[2]==='예수'&&row[6].includes('12')),'예수께 적용한 형제들 앞의 시편 고백을 직접 인용함');
 assert.ok(rows.some(row=>row[1]===3&&row[2]==='성령'&&row[6].includes('7-9')),'시편 95편 인용을 성령의 경고로 연결함');
 assert.ok(rows.some(row=>row[1]===4&&row[2]==='하나님'&&row[6].includes('7-9')),'오늘 마음을 완고하게 하지 말라는 시편 인용을 반영함');
 assert.ok(rows.some(row=>row[1]===8&&row[2]==='하나님'&&row[6].includes('11-12')),'새 언약 약속을 하나님이 하시는 말씀으로 표시함');
 assert.ok(rows.some(row=>row[1]===9&&row[2]==='모세'&&row[6].includes('20')),'언약의 피를 선언한 모세의 실제 말을 분리함');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='예수'&&row[6].includes('7-9')),'하나님의 뜻을 행하러 왔다는 시편의 그리스도 발화를 연결함');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='하나님'&&row[6].includes('16-17')),'새 언약과 죄 사함에 관한 하나님의 직접 인용을 구분함');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='하나님'&&row[6].includes('18')),'이삭에 관한 약속을 주신 하나님의 말씀만 남김');
 assert.ok(rows.some(row=>row[1]===12&&row[2]==='하나님'&&row[6].includes('5-6')),'아들들을 권면하는 하나님의 징계 말씀을 인용함');
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='하나님'&&row[6].includes('5-6')),'떠나지 않겠다는 약속을 실제 인용으로 연결함');
 const philemon=NEW_TESTAMENT_DIALOGUE_ROWS.find(row=>row[0]==='phm'&&row[1]===1);
 assert.ok(philemon[4][1].includes('법적 해방을 직접 말하지 않습니다'),'오네시모를 형제로 맞으라는 호소와 본문에 명시되지 않은 해방을 구별함');
 assert.ok(!rows.some(row=>['조상들','형제들','거룩한 형제들','하나님의 백성','멜기세덱','아브라함','성도들'].includes(row[2])),'서술 대상이나 회고된 인물을 실제 발화자로 만들지 않음');
});

test('야고보서 1–5장과 베드로전서 1–2장의 믿음·행함·공동체 권면을 장별로 구별한다',()=>{
 const books={jas:{chapters:[1,2,3,4,5],max:{1:27,2:26,3:18,4:17,5:20}},'1pe':{chapters:[1,2],max:{1:25,2:25}}};
 for(const [book,{chapters,max}] of Object.entries(books)){
  const summary=JSON.parse(readFileSync(new URL(`../data/summary/${book}.json`,import.meta.url),'utf8'));
  const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]===book&&chapters.includes(row[1]));
  for(const chapter of chapters)assert.ok(rows.some(row=>row[1]===chapter),`${book} ${chapter}장 발화`);
  for(const row of rows){
   assert.equal(row[6].length,row[4].length,`${book} ${row[1]}장 발화별 근거`);
   assert.ok(row[4].length>=1&&row[4].length<=5,`${book} ${row[1]}장 발화 수`);
   assert.ok(summary.chapters[String(row[1])].people.some(person=>person.name===row[2]),`${book} ${row[1]}장 ${row[2]} 색인`);
   for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=max[row[1]],`${book} ${row[1]}장 ${ref} 범위`);}
  }
 }
 const james=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='jas');
 assert.ok(james.some(row=>row[1]===1&&row[6].includes('19-27')),'말씀을 행하고 취약한 이웃을 돌보는 경건');
 assert.ok(james.some(row=>row[1]===2&&row[6].includes('18-26')&&row[4][3].includes('공로가 아니라')),'행함은 구원의 공로가 아니라 살아 있는 믿음의 열매라고 구분함');
 assert.ok(james.some(row=>row[1]===5&&row[6].includes('1-6')&&row[4][0].includes('착취')),'품삯을 빼앗은 부자에 대한 고발을 모든 부자에 대한 정죄로 넓히지 않음');
 assert.ok(james.some(row=>row[1]===5&&row[6].includes('7-12')&&row[4][1].includes('죄 탓')),'고난을 개인의 죄 탓으로 단정하지 않음');
 const firstPeter=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='1pe'&&row[1]<=2);
 assert.ok(firstPeter.some(row=>row[1]===1&&row[6].includes('10-12')),'예언자들의 연구를 현재 발화와 구분함');
 assert.ok(firstPeter.some(row=>row[1]===2&&row[6].includes('18-25')&&row[4][4].includes('노예제를 정당화')),'당시 종의 고난 권면을 노예제·학대 정당화로 사용하지 않음');
});

test('베드로전서 3–5장과 베드로후서 1–3장의 고난·목양·재림 소망을 실제 편지 화자와 절에 연결한다',()=>{
 const books={'1pe':{chapters:[3,4,5],max:{3:22,4:19,5:14}},'2pe':{chapters:[1,2,3],max:{1:21,2:22,3:18}}};
 for(const [book,{chapters,max}] of Object.entries(books)){
  const summary=JSON.parse(readFileSync(new URL(`../data/summary/${book}.json`,import.meta.url),'utf8'));
  const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]===book&&chapters.includes(row[1]));
  for(const chapter of chapters)assert.ok(rows.some(row=>row[1]===chapter),`${book} ${chapter}장 발화`);
  for(const row of rows){
   assert.equal(row[6].length,row[4].length,`${book} ${row[1]}장 발화별 근거`);
   assert.ok(row[4].length>=1&&row[4].length<=5,`${book} ${row[1]}장 발화 수`);
   assert.ok(summary.chapters[String(row[1])].people.some(person=>person.name===row[2]),`${book} ${row[1]}장 ${row[2]} 색인`);
   for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=max[row[1]],`${book} ${row[1]}장 ${ref} 범위`);}
  }
 }
 const firstPeter=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='1pe');
 assert.ok(firstPeter.some(row=>row[1]===3&&row[6].includes('1-7')&&row[4][0].includes('생명의 은혜')),'남편에게도 아내를 동등한 은혜의 상속자로 존중하라 권함');
 assert.ok(firstPeter.some(row=>row[1]===3&&row[6].includes('13-17')),'소망의 이유를 온유와 존중으로 설명하고 선한 양심을 지킴');
 assert.ok(firstPeter.some(row=>row[1]===4&&row[6].includes('12-16')),'악행의 결과와 그리스도인이라는 이유의 고난을 구분함');
 assert.ok(firstPeter.some(row=>row[1]===5&&row[6].includes('1-4')&&row[4][0].includes('지배')),'장로의 권위를 지배가 아닌 돌봄과 본으로 규정함');
 const secondPeter=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='2pe');
 assert.ok(secondPeter.some(row=>row[1]===1&&row[2]==='하나님'&&row[6].includes('17-18')),'변화산의 하늘 음성을 베드로의 증언과 다른 화자로 둠');
 assert.ok(secondPeter.some(row=>row[1]===2&&row[6].includes('15-16')&&row[4][2].includes('나귀')),'발람과 나귀 사건은 서술하되 발람을 현재 화자로 만들지 않음');
 assert.ok(secondPeter.some(row=>row[1]===3&&row[6].includes('8-10')&&row[4][1].includes('날짜 계산')),'주의 오래 참으심과 재림 시점 계산을 구분함');
 assert.ok(!secondPeter.some(row=>['발람','롯','노아','조롱하는 자들'].includes(row[2])),'회고되거나 인용된 인물을 임의의 현재 화자로 만들지 않음');
});

test('요한서신과 유다서의 형제 사랑·진리 분별·공동체 보호를 서신 화자와 장별 근거에 연결한다',()=>{
 const books={'1jn':{chapters:[1,2,3,4,5],max:{1:10,2:29,3:24,4:21,5:21}},'2jn':{chapters:[1],max:{1:13}},'3jn':{chapters:[1],max:{1:15}},jud:{chapters:[1],max:{1:25}}};
 for(const [book,{chapters,max}] of Object.entries(books)){
  const summary=JSON.parse(readFileSync(new URL(`../data/summary/${book}.json`,import.meta.url),'utf8'));
  const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]===book&&chapters.includes(row[1]));
  for(const chapter of chapters)assert.ok(rows.some(row=>row[1]===chapter),`${book} ${chapter}장 발화`);
  for(const row of rows){
   assert.equal(row[6].length,row[4].length,`${book} ${row[1]}장 발화별 근거`);
   assert.ok(row[4].length>=1&&row[4].length<=5,`${book} ${row[1]}장 발화 수`);
   assert.ok(summary.chapters[String(row[1])].people.some(person=>person.name===row[2]),`${book} ${row[1]}장 ${row[2]} 색인`);
   for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=max[row[1]],`${book} ${row[1]}장 ${ref} 범위`);}
  }
 }
 const firstJohn=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='1jn');
 assert.ok(firstJohn.some(row=>row[1]===1&&row[6].includes('8-10')),'죄가 없다고 부인하지 말고 자백하라는 빛의 교제를 말함');
 assert.ok(firstJohn.some(row=>row[1]===3&&row[6].includes('17-18')),'궁핍한 형제를 돕는 행함으로 사랑을 보이라고 권함');
 assert.ok(firstJohn.some(row=>row[1]===4&&row[6].includes('17-21')),'하나님 사랑과 눈에 보이는 형제 사랑을 떼어놓지 않음');
 assert.ok(firstJohn.some(row=>row[1]===5&&row[6].includes('14-17')&&row[4][3].includes('성급히 타인에게 판결')),'사망에 이르는 죄에 대한 어려운 구절을 함부로 정죄에 이용하지 않음');
 const thirdJohn=NEW_TESTAMENT_DIALOGUE_ROWS.find(row=>row[0]==='3jn'&&row[1]===1);
 assert.ok(thirdJohn[4][2].includes('디오드레베')&&thirdJohn[4][3].includes('발화자가 아닙니다'),'디오드레베의 행동과 데메드리오 언급을 구별함');
 const jude=NEW_TESTAMENT_DIALOGUE_ROWS.find(row=>row[0]==='jud'&&row[1]===1);
 assert.ok(jude[4][2].includes('미가엘')&&jude[4][2].includes('인용'),'미가엘의 과거 발화를 현재 장면과 구별함');
 assert.ok(!['가만히 들어온 자들','미가엘','마귀','가인·발람·고라','에녹','야고보'].includes(jude[2]),'인용되거나 회고된 사람을 유다서의 현재 화자로 만들지 않음');
});

test('요한계시록 1–22장의 모든 장면 발화는 장별 색인과 실제 절 범위를 벗어나지 않는다',()=>{
 const summary=JSON.parse(readFileSync(new URL('../data/summary/rev.json',import.meta.url),'utf8'));
 const progress=JSON.parse(readFileSync(new URL('../data/pixel-bible/verse-events/progress.json',import.meta.url),'utf8'));
 const max=Object.fromEntries(progress.chapters.filter(item=>item.code==='rev').map(item=>[item.chapter,item.expected]));
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='rev');
 for(let chapter=1;chapter<=22;chapter++)assert.ok(rows.some(row=>row[1]===chapter),`요한계시록 ${chapter}장 발화`);
 for(const row of rows){
  assert.equal(row[6].length,row[4].length,`요한계시록 ${row[1]}장 발화별 근거`);
  assert.ok(row[4].length>=1&&row[4].length<=5,`요한계시록 ${row[1]}장 발화 수`);
  assert.ok(summary.chapters[String(row[1])].people.some(person=>person.name===row[2]),`요한계시록 ${row[1]}장 ${row[2]} 색인`);
  for(const ref of row[6])for(const part of ref.split(',')){const [start,end=start]=part.trim().split('-').map(Number);assert.ok(start>=1&&end<=max[row[1]],`요한계시록 ${row[1]}장 ${ref} 범위`);}
 }
 assert.ok(rows.some(row=>row[1]===1&&row[2]==='하나님'&&row[6].includes('8')),'알파와 오메가 선언을 하나님 발화로 구분함');
 assert.ok(rows.some(row=>row[1]===2&&row[4][1].includes('일부 대적자')),'서머나의 지역적 반대를 모든 유대인에게 일반화하지 않음');
 assert.ok(rows.some(row=>row[1]===2&&row[6].includes('18-25')&&row[4][3].includes('이세벨')),'두아디라의 구체적 거짓 가르침과 회개 요청을 담음');
 assert.ok(rows.some(row=>row[1]===3&&row[6].includes('1-6')),'사데 교회의 깨어남·회개·신실한 남은 자를 연결함');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='네 생물'&&row[6].length===4),'네 생물의 네 차례 "오라"를 인을 뗀 순서대로 나눔');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='순교한 영혼들'&&row[6].includes('9-10')),'순교자들의 탄원을 복수 선동이 아닌 하나님의 심판을 구하는 기도로 둠');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='하나님'&&row[6].includes('11')),'순교자들의 탄원에 대한 흰옷과 쉼의 응답을 하나님 발화로 분리함');
 assert.ok(rows.some(row=>row[1]===6&&row[2]==='하나님'&&row[4][0].startsWith('잠시 더 쉬어라')),'하나님의 답을 서술 요약이 아닌 직접 권면으로 표시함');
 assert.ok(rows.some(row=>row[1]===7&&row[2]==='인을 가진 천사'&&row[6].includes('2-3')),'인침이 끝날 때까지 재앙을 멈추라는 천사의 명령을 반영함');
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='힘 있는 천사'&&row[6][0]==='2'),'두루마리를 펼 자격을 묻는 힘 있는 천사의 발화를 반영함');
 assert.ok(rows.some(row=>row[1]===5&&row[2]==='네 생물'&&row[6][0]==='14'),'네 생물의 아멘 응답을 피조물 전체의 찬양과 구분함');
 assert.ok(rows.some(row=>row[1]===10&&row[2]==='힘센 천사'&&row[6].includes('11')),'작은 두루마리를 먹은 요한에게 다시 예언하라는 천사의 명령을 연결함');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='측량을 명하신 이'&&row[6].includes('1-2')),'성전 측량 명령과 두 증인 예언을 분리함');
 assert.ok(rows.some(row=>row[1]===11&&row[2]==='땅에 사는 자들'&&row[6][0]==='10'),'두 증인의 시체를 본 행위 서술을 사람들의 실제 축하 발화와 구분함');
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='땅에 사는 자들'&&row[6].includes('4')),'짐승을 경배하는 땅의 무리 발화를 장면에 맞춤');
 assert.ok(rows.some(row=>row[1]===13&&row[2]==='땅에서 올라온 짐승'&&row[6][0]==='11-14'&&row[4][0].includes('우상을 만들라고')),'둘째 짐승의 우상 제작 명령을 실제 발화로 구분함');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='성전에서 나온 천사'&&row[6].includes('15'))&&rows.some(row=>row[1]===14&&row[2]==='불을 다스리는 천사'&&row[6].includes('18')),'곡식과 포도 추수의 서로 다른 천사 발화를 나눔');
 assert.ok(rows.some(row=>row[1]===14&&row[2]==='하늘의 음성'&&row[6].includes('13')),'주 안에서 죽는 자의 복을 선포한 음성과 성령의 응답을 구분함');
 assert.ok(rows.some(row=>row[1]===16&&row[2]==='성전의 음성'&&row[6].includes('1')&&row[6].includes('17')),'대접을 쏟으라는 명령과 끝났다는 선언을 미상의 음성으로 남김');
 assert.ok(rows.some(row=>row[1]===17&&row[2]==='대접을 가진 천사'&&row[6].includes('9-14')&&row[4][3].includes('어린양')),'짐승의 머리와 뿔의 해석, 어린양의 승리를 천사의 설명에 포함함');
 assert.ok(rows.some(row=>row[1]===17&&row[2]==='대접을 가진 천사'&&row[6].includes('15-18')&&row[4][4].includes('큰 성')),'물과 음녀의 상징을 본문 설명의 범위에 맞춤');
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='하늘의 음성'&&row[6].includes('4')),'바벨론에서 나오라는 경고를 애통하는 왕·상인의 말과 분리함');
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='하늘의 음성'&&row[6].includes('20')),'바벨론의 심판을 두고 하늘에 기뻐하라는 명령을 추가함');
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='바벨론'&&row[6][0]==='7'&&row[4][0].includes('과부')),'바벨론의 자기 과시를 하늘의 심판 명령과 분리함');
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='땅의 상인들'&&row[6].includes('14')),'상인들의 애도에 바벨론의 사라진 사치품에 대한 한탄을 반영함');
 assert.ok(rows.some(row=>row[1]===18&&row[2]==='힘센 천사'&&row[6].includes('22-24')),'바벨론의 침묵과 그 안에서 죽임당한 이들의 피를 천사의 선포에 연결함');
 assert.ok(rows.some(row=>row[1]===19&&row[2]==='보좌의 음성'&&row[6].includes('5')),'보좌에서 난 찬양 권면을 하늘 무리의 찬송과 분리함');
 assert.ok(rows.some(row=>row[1]===19&&row[2]==='천사'&&row[6].includes('9')&&row[4][0].includes('참된 말씀')),'혼인 잔치의 복과 하나님의 참말씀이라는 확증을 천사의 발화에 담음');
 assert.ok(rows.some(row=>row[1]===19&&row[2]==='천사'&&row[6].includes('10')&&row[4][1].includes('예언의 영')),'천사의 경배 거부와 예수 증언의 설명을 보존함');
 assert.ok(rows.some(row=>row[1]===21&&row[2]==='하나님'&&row[6].includes('3-4')&&row[4][0].includes('눈물')),'새 창조와 눈물을 씻으시는 보좌의 음성을 하나님께 귀속함');
});
