import test from 'node:test';
import assert from 'node:assert/strict';
import {objectContextSpeech,speechView} from '../js/features/pixel-bible/speech-view.js';
import {OBJECT_MONOLOGUES,objectMonologue} from '../js/features/pixel-bible/object-monologues.js';
import {personalLines} from '../js/features/pixel-bible/personal-lines.js';
import {buildChapterDialogue} from '../js/features/pixel-bible/chapter-dialogue.js';
import {PAIR_DIALOGUE} from '../js/features/pixel-bible/pair-dialogue.js';
import {objectLinesFor} from '../js/features/pixel-bible/object-scenes.js';
import {ELIJAH_SCENES} from '../js/features/pixel-bible/scenes.js';
import {TWO_KINGS_DIALOGUE_ROWS} from '../js/features/pixel-bible/2ki-dialogue.js';

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
