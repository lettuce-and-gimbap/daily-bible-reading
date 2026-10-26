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
  assert.ok(lines.length>=2&&lines.every(line=>line.length<=64),key);
  const local={people:[{name,code:'2ki',chap,role:'기록된 사건 인물'}],relations:[]};
  const output=personalLines({name,role:'기록된 사건 인물',refs:[]},[{code:'2ki',name:'열왕기하',chap}],local);
  assert.ok(output.length>=1,key);assert.ok(output.every(line=>line.ref?.startsWith('열왕기하 ')),key);
  assert.ok(['neutral','joy','sad','worried','angry','surprised','determined','gentle'].includes(emotion),key);
 }
 assert.ok(TWO_KINGS_DIALOGUE_ROWS.length>=160);
 const allLines=TWO_KINGS_DIALOGUE_ROWS.flatMap(row=>row[3]);assert.equal(new Set(allLines).size,allLines.length,'열왕기하 개별 발화가 서로 구분되어야 한다');
 const unknown={name:'기록되지 않은 왕',role:'왕',refs:[]},unknownContext={people:[{name:unknown.name,code:'2ki',chap:3,role:'왕'}],relations:[]};
 assert.deepEqual(personalLines(unknown,[{code:'2ki',name:'열왕기하',chap:3}],unknownContext),[],'근거가 없는 열왕기하 인물에게 역할 공통 문구를 붙이지 않는다');
});

test('구약 전권의 개별 대사는 실제 장별 인물 색인에 붙고 역할 공통 독백으로 대체되지 않는다',()=>{
 const covered=new Set(OLD_TESTAMENT_DIALOGUE_ROWS.map(row=>row[0]));covered.add('2ki');
 assert.equal(covered.size,39);for(const code of OLD_TESTAMENT_CODES)assert.ok(covered.has(code),code);
 const allLines=[...OLD_TESTAMENT_DIALOGUE_ROWS.flatMap(row=>row[4]),...TWO_KINGS_DIALOGUE_ROWS.flatMap(row=>row[3])];
 assert.equal(new Set(allLines).size,allLines.length,'구약 전용 발화가 서로 겹치지 않아야 한다');
 for(const [code,chap,name,ref] of OLD_TESTAMENT_DIALOGUE_ROWS){
  const book=JSON.parse(readFileSync(new URL(`../data/summary/${code}.json`,import.meta.url),'utf8'));
  assert.ok((book.chapters?.[String(chap)]?.people||[]).some(p=>p.name===name),`${code}.${chap} ${name}이 본문 인물 색인에 있어야 한다`);
 }
 for(const [chap,name] of TWO_KINGS_DIALOGUE_ROWS){
  const book=JSON.parse(readFileSync(new URL('../data/summary/2ki.json',import.meta.url),'utf8'));
  assert.ok((book.chapters?.[String(chap)]?.people||[]).some(p=>p.name===name),`2ki.${chap} ${name}이 본문 인물 색인에 있어야 한다`);
 }
 const unknown={name:'기록되지 않은 왕',role:'왕',refs:[]},context={people:[{name:unknown.name,code:'2ki',chap:3,role:'왕'}],relations:[]};
 assert.deepEqual(personalLines(unknown,[{code:'2ki',name:'열왕기하',chap:3}],context),[]);
});

test('범용 역할 독백만 비활성화하고 인물별 사건 독백은 유지한다',()=>{
 const generic={name:'이름 없는 왕',role:'왕',refs:[]};
 const context={people:[{name:generic.name,code:'gen',chap:99,role:'왕'}],relations:[]};
 assert.deepEqual(personalLines(generic,[{code:'gen',name:'창세기',chap:99}],context),[]);
 const cain={name:'가인',role:'농부',refs:[]},chapters=[{code:'gen',name:'창세기',chap:4}];
 const authored=personalLines(cain,chapters,{people:[{name:'가인',code:'gen',chap:4,role:'농부'}],relations:[]});
 assert.equal(authored.length,2);assert.ok(authored.every(line=>line.origin==='authored'));
});

test('창세기 대사의 개별 참조는 각 문장의 실제 사건 범위와 일치한다',()=>{
 const genesisRows=OLD_TESTAMENT_DIALOGUE_ROWS.filter(row=>row[0]==='gen');
 const find=(chap,name)=>genesisRows.find(row=>row[1]===chap&&row[2]===name);
 assert.deepEqual(find(2,'아담')[6],['15-17','23-24']);
 assert.deepEqual(find(3,'아담')[6],['8-10','11-12']);
 assert.deepEqual(find(3,'하와')[6],['13','16']);
 assert.deepEqual(find(4,'가인')[6],['3-7','9']);
 assert.deepEqual(find(6,'노아')[6],['8-12','14-16','19-21']);
 assert.deepEqual(find(8,'노아')[6],['6-12','13-22']);
 assert.deepEqual(find(9,'노아')[6],['20-21','22-23']);
 assert.deepEqual(find(12,'아브람')[6],['1-4','10-13']);
 const output=personalLines({name:'가인',role:'농부',refs:[]},[{code:'gen',name:'창세기',chap:4}],{people:[{name:'가인',code:'gen',chap:4,role:'농부'}],relations:[]});
 assert.deepEqual(output.map(line=>line.ref),['창세기 4:3-7','창세기 4:9']);
 assert.ok(output.every(line=>!line.detailText),'다른 인물 관계 설명을 발화에 임의로 붙이지 않는다');
 const genesis=JSON.parse(readFileSync(new URL('../data/summary/gen.json',import.meta.url),'utf8'));
 const noah=personalLines({name:'노아',role:'의인',refs:[]},[{code:'gen',name:'창세기',chap:6}],{people:[{name:'노아',code:'gen',chap:6,role:'의인'}],relations:[]});
 assert.equal(noah.length,3);assert.deepEqual(noah.map(line=>line.ref),['창세기 6:8-12','창세기 6:14-16','창세기 6:19-21']);
 for(const line of noah){const verses=line.ref.split(':')[1],bounds=verses.split('-').map(Number);assert.ok(genesis.chapters['6'].events.some(event=>{const nums=event.verses.match(/\d+/g).map(Number);return bounds[0]>=nums[0]&&bounds.at(-1)<=nums.at(-1)}),line.ref);assert.ok(speechContext(line,[{code:'gen',chap:6,data:genesis.chapters['6']}]),line.ref+' 설명이 본문 사건에서 생성되어야 한다')}
 const findGenesis=(chap,name)=>genesisRows.find(row=>row[1]===chap&&row[2]===name);
 assert.equal(findGenesis(29,'라헬'),undefined,'라헬의 자녀 간청은 창세기 30장 사건');
 assert.deepEqual(genesisRows.find(row=>row[1]===30&&row[2]==='라헬'&&row[3]==='1-2')[6],['1','1-2']);
 assert.deepEqual(findGenesis(37,'요셉')[6],['5-11','23-24']);
 assert.deepEqual(findGenesis(42,'르우벤')[6],['21-22','21-22']);
 assert.equal(genesisRows.length,51);
 for(const row of genesisRows){
  assert.ok(row[6]&&row[6].length===row[4].length,`${row[1]} ${row[2]} 발화마다 절 참조`);
  const [start,end]=row[3].split('-').map(Number);
  for(const ref of row[6]){const [from,to='']=ref.split('-').map(Number);assert.ok(from>=start&&Number(to||from)<=end,`${row[1]} ${row[2]} ${ref}는 행 범위 ${row[3]} 안에 있어야 함`);}
  assert.ok((genesis.chapters[String(row[1])]?.people||[]).some(person=>person.name===row[2]),`${row[1]}장 인물 색인에 ${row[2]}가 있어야 함`);
 }
 assert.deepEqual(findGenesis(13,'아브람')[6],['8-9','8-9']);
 assert.deepEqual(findGenesis(13,'롯')[6],['10-11','12-13']);
});

test('출애굽기 대사 42묶음은 문장마다 장 안의 개별 절 참조를 가진다',()=>{
 const rows=PENTATEUCH_DIALOGUE_ROWS.filter(row=>row[0]==='exo');assert.equal(rows.length,42);
 for(const row of rows){
  const [low,high]=row[3].split('-').map(Number);
  assert.equal(row[7]?.length,row[4].length,`${row[1]}장 ${row[2]} 줄 참조`);
  for(const ref of row[7]){const [start,end=start]=ref.split('-').map(Number);assert(start>=low&&end<=high,`${row[1]}장 ${row[2]} ${ref} 범위 밖`);}
 }
});

test('레위기에서 확인한 각 개인 발화는 문장별 본문 범위를 갖고 비발화 사건은 음성 대사로 만들지 않는다',()=>{
 const rows=PENTATEUCH_DIALOGUE_ROWS.filter(row=>row[0]==='lev');assert.equal(rows.length,9);
 for(const row of rows){
  const [low,high]=row[3].split('-').map(Number);
  assert.equal(row[7]?.length,row[4].length,`${row[1]}장 ${row[2]} 줄 참조`);
  for(const ref of row[7]){const [start,end=start]=ref.split('-').map(Number);assert(start>=low&&end<=high,`${row[1]}장 ${row[2]} ${ref} 범위 밖`);}
 }
 assert(!rows.some(row=>row[2]==='모독한 사람'),'기록되지 않은 대사를 무명 인물에게 붙이지 않음');
});
