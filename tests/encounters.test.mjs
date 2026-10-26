import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EncounterDirector,beside} from '../js/features/pixel-bible/encounters.js';
import {buildChapterDialogue} from '../js/features/pixel-bible/chapter-dialogue.js';
import {ambientSpeechAllowed,manualSpeechAllowed,SpeechDirector} from '../js/features/pixel-bible/dialogue.js';
import {hangingPose,liftedCharacterFrame} from '../js/features/pixel-bible/motion.js';
import {relationshipLines,loveBoothExchange} from '../js/features/pixel-bible/relationship-lines.js';
import {PAIR_DIALOGUE} from '../js/features/pixel-bible/pair-dialogue.js';
import {HISTORY_DIALOGUE_ROWS} from '../js/features/pixel-bible/old-testament/history.js';

function fixture(){
 const chapters=[{code:'1ki',name:'열왕기상',chap:21,data:{people:[{name:'아합',role:'포도원을 원한 왕'},{name:'나봇',role:'유산을 지킨 포도원 주인'}],rels:[{from:'아합',to:'나봇',label:'포도원 요구',verses:'1-4',note:'아합이 포도원을 원했지만 나봇은 조상의 유산을 넘기지 않았어요.'}]}}];
 const context=buildChapterDialogue(chapters);
 const npcs=context.people.map((p,i)=>({...p,refs:[p.ref],x:10+i,y:10,path:[{x:15,y:10}],task:{},action:'tree',usingObject:{}}));
 return {npcs,director:new EncounterDirector(chapters,context,{random:()=>0})};
}

test('옆 칸 조우 즉시 서로 마주보고 각자 사건에 맞는 대사를 한다',()=>{
 const {director,npcs}=fixture();
 const first=director.tick(0,npcs);assert.equal(first.length,1);
 assert.equal(first[0].speaker.name,'아합');assert.match(first[0].text,/포도원/);
 assert.equal(first[0].pairLines.length,2);assert.match(first[0].pairLines[1].text,/유산|조상/);
 assert.equal(npcs[0].direction,'right');assert.equal(npcs[1].direction,'left');
 assert.ok(npcs.every(n=>!n.path.length&&!n.task&&!n.usingObject&&n.encounter));
 const reply=director.tick(800,npcs);assert.equal(reply.length,1);
 assert.equal(reply[0].pairLines.length,2,'두 인물의 문장이 처음부터 한 말풍선에 함께 남는다');
 assert.ok(reply.every(l=>l.until-l.started===5800));
 assert.equal(director.tick(5000,npcs).length,1);
 assert.equal(director.tick(5800,npcs).length,0);
 assert.ok(npcs.every(n=>!n.encounter));
 assert.equal(director.tick(5900,npcs).length,0,'같은 자리에서는 반복하지 않음');
 npcs[1].x=20;director.tick(5901,npcs);npcs[1].x=11;
 assert.equal(director.tick(5902,npcs).length,1,'떠났다가 다시 만나면 시작');
});

test('TV 부스는 관계선이 있는 두 인물에게 관계 유형에 맞는 특수 대화를 제공한다',()=>{
 const a={name:'가상인물A'},b={name:'가상인물B'},relations=[{from:{name:'가상인물A',code:'gen',chap:1},to:{name:'가상인물B'},ref:'창세기 1:1',text:'두 인물이 연결되어 있다.'}];
 const result=loveBoothExchange(a,b,relations);assert.equal(result.mode,'special');assert.equal(result.lines.length,2);assert.ok(result.lines.every(line=>line.origin==='chapter-relation'));
 const unrelated=loveBoothExchange(a,b,[]);assert.equal(unrelated.mode,'awkward');assert.equal(unrelated.lines.length,2);
});

test('창세기부터 여호수아까지 관계도 연결 466개가 모두 양방향 대화 대상이다',()=>{
 let audited=0;
 for(const code of ['gen','exo','lev','num','deu','jos']){
  const data=JSON.parse(fs.readFileSync(`data/summary/${code}.json`));
  const chapters=Object.entries(data.chapters).map(([chap,chapter])=>({code,name:code,chap:Number(chap),data:chapter}));
  const context=buildChapterDialogue(chapters);
  for(const relation of context.relations){
   const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});
   assert.equal(lines.length,2,`${code}.${relation.from.chap} ${relation.from.name} ↔ ${relation.to.name}`);
   assert.ok(lines.every(line=>line.text&&!/어색|안녕하세요/.test(line.text)),'연결 관계가 어색한 인사로 대체되지 않음');
   audited++;
  }
 }
 assert.equal(audited,466);
});

test('사무엘상 관계도 377개가 모두 대화되며 핵심 사건에는 구절에 맞춘 응답을 제공한다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/1sa.json'));
 const chapters=Object.entries(data.chapters).map(([chap,chapter])=>({code:'1sa',name:'사무엘상',chap:Number(chap),data:chapter}));
 const context=buildChapterDialogue(chapters);assert.equal(context.people.length>0,true);
 let audited=0;
 for(const relation of context.relations){
  const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});
  assert.equal(lines.length,2,`${relation.from.chap}장 관계선 양방향 대화`);
  assert.ok(lines.every(line=>line.text&&!/어색|안녕하세요/.test(line.text)));
  audited++;
 }
 assert.equal(audited,377);
 const cases=[['1sa.1','한나','엘가나',/젖을 뗄|서원/,/당신이 좋다고|기다립시다/],['1sa.3','사무엘','엘리',/부르시면|숨기지/,/말씀하옵소서|알려 다오/],['1sa.14','요나단','사울',/꿀/,/맹세/],['1sa.17','다윗','골리앗',/여호와의 이름/,/막대기|새와 들짐승/],['1sa.20','요나단','다윗',/화살|떠나/,/약속|집안/],['1sa.21','다윗','아히멜렉',/빵|무기/,/거룩한 빵|골리앗의 칼/],['1sa.24','다윗','사울',/해치지 않았/,/다윗아|의롭구나/],['1sa.25','아비가일','다윗',/나발의 죄/,/보복하지/],['1sa.22','아비아달','다윗',/에봇|피했습니다/,/내 책임|머물러라/]];
 for(const [chapter,speaker,target,first,reply]of cases){
  const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);
  assert.ok(entry,`${chapter} ${speaker} ↔ ${target}`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>first.test(line)),`${chapter} ${speaker} 발화`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>reply.test(line)),`${chapter} ${target} 응답`);
 }
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='1sa');
 assert.equal(rows.length,32);assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length),'각 발화마다 구절 연결');
});

test('사무엘하의 인간 관계선 385개와 주요 사건의 대화를 모두 확인한다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/2sa.json'));
 const chapters=Object.entries(data.chapters).map(([chap,chapter])=>({code:'2sa',name:'사무엘하',chap:Number(chap),data:chapter}));
 const context=buildChapterDialogue(chapters);let audited=0;
 for(const relation of context.relations){
  const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});
  assert.equal(lines.length,2,`${relation.from.chap}장 관계선 양방향 대화`);
  assert.ok(lines.every(line=>line.text&&!/어색|안녕하세요/.test(line.text)));
  audited++;
 }
 assert.equal(audited,385);
 const cases=[['2sa.1','다윗','아말렉 청년',/기름 부음 받은 왕/,/보상을|왕께서 물으셔서/],['2sa.2','다윗','야베스 길르앗 사람들',/장사해 준/,/기억해|알아주셔서/],['2sa.3','아브넬','다윗',/이스라엘 장로들/,/미갈|언약/],['2sa.3','요압','다윗',/아브넬/,/스루야|악을 행한 자/],['2sa.5','이스라엘 지파들','다윗',/골육|목자/,/헤브론|언약/],['2sa.7','나단','다윗',/집을 세우십니다/,/성전을 짓고|집이 주 앞에/],['2sa.9','다윗','므비보셋',/두려워하지|상에서 먹어라/,/죽은 개|자격/],['2sa.11','다윗','우리아',/집으로 내려가/,/집에 갈 수 없/],['2sa.16','압살롬','후새',/왜 그 친구의 아들을/,/왕 만세/],['2sa.19','시므이','다윗',/죄를 지었습니다/,/죽지 않을/],['2sa.19','다윗','므비보셋',/왜 나와 함께/,/시바가|왕께서 무사히/],['2sa.19','바르실래','다윗',/요단을 건너/,/김함/],['2sa.24','다윗','아라우나',/타작마당|값을 치르지/,/제단을 쌓으십시오/]];
 for(const [chapter,speaker,target,first,reply]of cases){
  const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);
  assert.ok(entry,`${chapter} ${speaker} ↔ ${target}`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>first.test(line)));assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>reply.test(line)));
 }
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='2sa');
 assert.equal(rows.length,25);assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length),'각 발화마다 구절 연결');
 const verseCounts=[27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25];
 for(const row of rows){const base=row[3].match(/\d+/g).map(Number);for(const ref of row[7]){const n=ref.match(/\d+/g).map(Number),end=n[1]||n[0];assert.ok(n[0]>=base[0]&&end<=(base[1]||base[0])&&end<=verseCounts[row[1]-1],`${row[1]} ${ref} 범위 확인`)}}
});

test('열왕기상 인간 관계선 115개와 왕·선지자·가족의 핵심 대화를 확인한다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/1ki.json'));
 const chapters=Object.entries(data.chapters).map(([chap,chapter])=>({code:'1ki',name:'열왕기상',chap:Number(chap),data:chapter}));
 const context=buildChapterDialogue(chapters);let audited=0;
 for(const relation of context.relations){const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});assert.equal(lines.length,2);assert.ok(lines.every(line=>line.text&&!/어색|안녕하세요/.test(line.text)));audited++}
 assert.equal(context.relations.filter(relation=>!relation.scriptedPair).length,115);
 assert.equal(audited,116,'관계도 연결과 별도로 본문 대화 색인이 추가한 연결도 처리');
 const cases=[['1ki.1','밧세바','다윗',/아도니야|솔로몬/,/솔로몬이 왕이|기름 부으/],['1ki.1','나단','다윗',/아도니야가 왕이/,/솔로몬이 왕이/],['1ki.2','밧세바','솔로몬',/아비삭/,/왕위를|아비삭/],['1ki.3','솔로몬','두 여인',/칼을 가져와|아이를 죽이지/,/아이를 죽이지|포기/],['1ki.5','솔로몬','히람',/성전을|백향목/,/백향목|나무를 보내/],['1ki.10','스바 여왕','솔로몬',/질문|소문/,/물어보|찬양/],['1ki.11','아히야','여로보암',/열 지파/,/나라를|열 지파/],['1ki.12','르호보암','노인들',/멍에/,/백성의 종|부드럽게/],['1ki.13','하나님의 사람','늙은 선지자',/먹지도|말씀/,/선지자|여호와께서 말씀/],['1ki.14','아히야','여로보암의 아내',/변장/,/아들이 죽/],['1ki.15','아사','벤하닷',/은과 금/,/조약|이스라엘 왕/],['1ki.16','예후(하나니의 아들)','바아사',/세우셨/,/왕조|여로보암/],['1ki.17','엘리야','사르밧 과부',/빵 한 조각/,/밀가루|먼저/],['1ki.18','엘리야','오바댜',/아합 앞에/,/두려|엘리야시군요/],['1ki.18','아합','엘리야',/괴롭게/,/왕과 왕의 집안/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} ↔ ${target}`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>first.test(line)),`${chapter} first`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>reply.test(line)),`${chapter} reply`)}
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='1ki');assert.equal(rows.length,27);assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length));
 const verseCounts=[53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53];
 for(const row of rows){const base=row[3].match(/\d+/g).map(Number);for(const ref of row[7]){const n=ref.match(/\d+/g).map(Number),end=n[1]||n[0];assert.ok(n[0]>=base[0]&&end<=(base[1]||base[0])&&end<=verseCounts[row[1]-1],`${row[1]} ${ref} 범위 확인`)}}
});

test('열왕기하 관계선 154개가 모두 상호작용 대상이고 중요 사건 대화를 보강했다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/2ki.json'));
 const chapters=Object.entries(data.chapters).map(([chap,chapter])=>({code:'2ki',name:'열왕기하',chap:Number(chap),data:chapter}));
 const context=buildChapterDialogue(chapters);let audited=0;
 for(const relation of context.relations){const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});assert.equal(lines.length,2);assert.ok(lines.every(line=>line.text&&!/어색|안녕하세요/.test(line.text)));audited++}
 assert.equal(context.relations.filter(relation=>!relation.scriptedPair).length,154);assert.equal(audited,156,'관계선 외에 본문 대화 인덱스가 보강한 연결도 대화됨');
 const cases=[['2ki.3','여호사밧','엘리사',/말씀을 물을 선지자/,/엘리야의 손에 물을 붓던/],['2ki.4','엘리사','수넴 여인',/아이를 살리기/,/아이를 구해 달라고/],['2ki.5','엘리사','나아만',/요단강에/,/다메섹의 강/],['2ki.5','나아만의 종들','나아만',/더 어려운 일을/,/요단으로 가서/],['2ki.6','엘리사','엘리사의 사환',/두려워하지/,/불말과 불병거/],['2ki.7','나병 환자 넷','이스라엘 왕',/아람 진영/,/꾀어|진짜로/],['2ki.8','하사엘','엘리사',/벤하닷 왕/,/아람의 왕/],['2ki.9','요람(아합의 아들)','예후',/평화로운 일/,/어머니 이세벨/],['2ki.10','예후','여호나답',/손을 내게/,/손을 잡겠습니다/],['2ki.11','여호야다','요아스',/왕관/,/언약을 맺어/],['2ki.13','엘리사','요아스(여호아하스의 아들)',/구원의 화살/,/세 번/],['2ki.14','아마샤','요아스(여호아하스의 아들)',/대면해 봅시다/,/가시나무/],['2ki.18','엘리아김(힐기야의 아들)','랍사게',/아람 말/,/성벽 위 백성/],['2ki.19','히스기야','이사야',/환난과 책망/,/두려워하지 마십시오/],['2ki.20','히스기야','바벨론 사신들',/보물과 무기고/,/편지와 예물/],['2ki.22','요시야','훌다',/말씀을 여호와께/,/재앙이 임할/],['2ki.23','바로 느고','요시야',/다른 전쟁/,/므깃도 골짜기/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} ↔ ${target}`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>first.test(line)),`${chapter} first`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>reply.test(line)),`${chapter} reply`)}
});

test('동시 조우는 한 쌍만 진행해 자동 말풍선 슬롯과 합쳐 대화 세트를 두 개로 제한한다',()=>{
 const people=['아합','나봇','엘리야','엘리사','모세','아론'];
 const chapters=[{code:'1ki',name:'열왕기상',chap:21,data:{people:people.map(name=>({name,role:'본문 인물'})),rels:[
  {from:'아합',to:'나봇',label:'포도원',verses:'1-4',note:'아합과 나봇의 포도원 이야기.'},
  {from:'엘리야',to:'엘리사',label:'선지자',verses:'19-21',note:'엘리야가 엘리사를 부릅니다.'},
  {from:'모세',to:'아론',label:'형제',verses:'1-5',note:'모세와 아론이 함께합니다.'},
 ]}}];
 const context=buildChapterDialogue(chapters),npcs=context.people.slice(0,6).map((p,i)=>({...p,refs:['열왕기상 21장'],x:10+i,y:10,path:[]}));
 const director=new EncounterDirector(chapters,context,{random:()=>0});
 director.tick(0,npcs);
 assert.equal(director.active.length,1);
 assert.equal(npcs.filter(n=>n.encounter).length,2);
 assert.equal(director.tick(800,npcs).length,1,'한 쌍의 두 문장을 하나의 겹치지 않는 말풍선에 표시');
 assert.equal(director.tick(800,npcs)[0].pairLines.length,2);
});

test('상하 조우·드래그 배제·다시 놓기와 인물 숨기기를 처리한다',()=>{
 const {director,npcs}=fixture();npcs[1].x=10;npcs[1].y=11;
 assert.equal(director.tick(0,npcs,{excluded:[npcs[1]]}).length,0);
 assert.equal(director.tick(1,npcs).length,1);
 assert.equal(npcs[0].direction,'down');assert.equal(npcs[1].direction,'up');
 director.tick(2,[npcs[0]]);assert.ok(npcs.every(n=>!n.encounter));
 assert.equal(beside({x:0,y:0},{x:1,y:1}),false);
 assert.equal(beside({x:0,y:0},{x:0,y:0}),false);
});

test('모든 관계 대사는 짧게 말하고 관계 설명은 자세히 보기용으로 남긴다',()=>{
 const a={name:'하눈',identity:{id:'neh3-hanun'}},b={name:'살룬',identity:{id:'neh3-shallun'}};
 const relation={label:'함께 재건',from:{code:'neh',chap:3},to:{code:'neh',chap:3},text:'하눈은 골짜기 문을 세웠고 살룬은 샘문을 수리했습니다.',ref:'느헤미야 3:13-15'};
 const lines=relationshipLines(a,b,relation,new Map(),{random:()=>0});
 assert.equal(lines.length,2);
 for(const line of lines){
  assert.doesNotMatch(line.text,/\.\.\.|…|이 일의 말씀을 함께 살펴보자/);
  assert.equal(line.detailText,`${relation.text} (${relation.ref})`);
  assert.equal(line.ref,relation.ref);
  assert.ok(!line.text.includes(relation.text));
 }
});

test('명시 대사가 없는 가족·협력·갈등 관계도 관계 성격에 맞는 양방향 창작 특수 대화를 갖는다',()=>{
 const a={name:'아버지'},b={name:'딸'};
 for(const [kind,label,expected]of [['family','아버지와 딸',/가족|정/],['ally','함께 지킨 동료',/함께|곁/],['conflict','맞선 원수',/가볍게|선택/]]){
  const relation={from:{code:'gen',chap:1},to:{code:'gen',chap:1},kind,label,text:'이 장면에서 두 인물의 관계가 드러납니다.',ref:'창세기 1:1'};
  const lines=relationshipLines(a,b,relation,new Map(),{random:()=>0});
  assert.equal(lines.length,2);assert.ok(lines.every(line=>line.origin==='chapter-relation'));
  assert.match(lines[0].text,expected);assert.match(lines[1].detailText,/창작 상호작용/);
 }
});

test('창세기부터 룻기까지 모든 관계도 연결은 양방향 특수 대화 후보를 만든다',()=>{
 const names={gen:'창세기',exo:'출애굽기',lev:'레위기',num:'민수기',deu:'신명기',jos:'여호수아',rut:'룻기'};
 for(const code of Object.keys(names)){
  const summary=JSON.parse(fs.readFileSync(`data/summary/${code}.json`,'utf8'));
  for(const [chapter,data]of Object.entries(summary.chapters)){
   const context=buildChapterDialogue([{code,name:names[code],chap:Number(chapter),data}]);
   for(const relation of context.relations){
    const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});
    assert.equal(lines.length,2,`${code}.${chapter} ${relation.from.name} ↔ ${relation.to.name}`);
    assert.equal(lines[0].target,relation.to);assert.equal(lines[1].target,relation.from);
    assert.ok(lines[0].ref);
    if(lines[0].origin==='chapter-relation')assert.equal(lines[0].ref,relation.ref);
   }
  }
 }
});

test('관계 대화의 두 화자는 같은 대화 후보 번호를 공유하고 서로 응답한다',()=>{
 const a={name:'아합',identity:{id:'ahab'}},b={name:'나봇',identity:{id:'naboth'}};
 const relation={from:{code:'1ki',chap:21},to:{code:'1ki',chap:21},text:'아합은 포도원을 원했고 나봇은 조상의 유산이라며 거절했습니다.',ref:'열왕기상 21:1–3'};
 for(const [random,index] of [[()=>0,0],[()=>.99,1]]){
  const lines=relationshipLines(a,b,relation,new Map(),{random});
  assert.equal(lines.length,2);assert.ok(lines.every(line=>line.pairIndex===index));
  if(index===0){assert.match(lines[0].text,/포도원/);assert.match(lines[1].text,/조상|유산/);}
  else {assert.match(lines[0].text,/값|생각/);assert.match(lines[1].text,/땅|유산/);}
 }
});

test('각 인물별 대사 기록에는 맞물리는 상대 발화가 있거나 명시 응답이 있다',()=>{
 for(const entry of PAIR_DIALOGUE){
  const reverse=PAIR_DIALOGUE.find(other=>other.chapter===entry.chapter&&other.speaker===entry.target&&other.target===entry.speaker);
  assert.ok(reverse||entry.replyLines?.length===entry.lines.length,`${entry.id} (${entry.speaker} → ${entry.target})에 응답이 없음`);
  for(const index of [0,1]){
   const relation={from:{code:entry.chapter.split('.')[0],chap:Number(entry.chapter.split('.')[1])},to:{},text:'같은 장면의 두 인물',ref:entry.ref};
   const lines=relationshipLines({name:entry.speaker},{name:entry.target},relation,new Map(),{random:()=>index?0.99:0});
   assert.equal(lines.length,2,`${entry.id} 대사가 독백으로 분리됨`);
   assert.equal(lines[0].text,entry.lines[index],`${entry.id} 첫 발화 후보가 맞지 않음`);
   assert.equal(lines[1].text,reverse?.lines[index]||entry.replyLines?.[index],`${entry.id} 응답 후보가 맞지 않음`);
   assert.ok(lines.every(line=>line.pairIndex===index));
  }
 }
});

test('창세기 관계 대화는 같은 장의 인물 색인과 사건 범위를 근거로 주고받는다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/gen.json'));
 const genesis=PAIR_DIALOGUE.filter(entry=>entry.chapter.startsWith('gen.'));
 assert.equal(genesis.length,38);
 for(const entry of genesis){
  const chapter=entry.chapter.split('.')[1],people=summary.chapters[chapter].people.map(person=>person.name);
  assert(people.includes(entry.speaker),`${entry.id} speaker is indexed in Genesis ${chapter}`);
  assert(people.includes(entry.target),`${entry.id} target is indexed in Genesis ${chapter}`);
  assert.equal(entry.lines.length,2);assert.equal(entry.replyLines?.length||2,2);
  assert([...entry.lines,...(entry.replyLines||[])].every(line=>line.length<=100),`${entry.id} fits a speech bubble`);
  assert.match(entry.ref,new RegExp(`창세기 ${chapter}:`));
 }
});

test('본문 관계선이 빠져도 창세기 24장의 기록된 종·리브가 대화는 상호작용 경로를 갖는다',()=>{
 const context=buildChapterDialogue([{code:'gen',name:'창세기',chap:24,data:{people:[{name:'아브라함의 종',role:'물을 청한 나그네'},{name:'리브가',role:'물을 길어 준 사람'}],rels:[]}}]);
 const a=context.people.find(p=>p.name==='아브라함의 종'),b=context.people.find(p=>p.name==='리브가');
 const relation=context.relations.find(r=>r.from===a&&r.to===b||r.from===b&&r.to===a);assert.ok(relation);
 const exchange=relationshipLines(a,b,relation,null,{random:()=>0});assert.equal(exchange.length,2);
 assert.match(exchange[0].text,/물/);assert.match(exchange[1].text,/낙타/);
});

test('창세기 무덤 협상·브엘세바 언약·베냐민 보증 대사는 양쪽이 사건에 응답한다',()=>{
 const check=(chapter,from,to,verses,patterns)=>{
  const context=buildChapterDialogue([{code:'gen',name:'창세기',chap:chapter,data:{people:[{name:from,role:'사건 인물'},{name:to,role:'사건 인물'}],rels:[{from,to,label:'사건 대화',verses,note:'본문에서 협상하거나 약속을 나눈 두 사람.'}]}}]);
  const a=context.people.find(p=>p.name===from),b=context.people.find(p=>p.name===to),relation=context.relations[0];
  const lines=relationshipLines(a,b,relation,null,{random:()=>0});assert.equal(lines.length,2,`${chapter}장 양방향 대화`);
  assert.match(lines[0].text,patterns[0]);assert.match(lines[1].text,patterns[1]);
 };
 check(23,'에브론','아브라함','14-16',[/사라를|밭/ ,/굴|400|사라/]);
 check(26,'아비멜렉','이삭','26-31',[/하나님|여호와|맹세/ ,/왜|해치지|평안/]);
 check(43,'유다','야곱','8-14',[/아이|베냐민/ ,/아들|하나님|불쌍/]);
});

test('창세기 34장 디나 사건 뒤 야곱과 시므온·레위의 꾸짖음과 항변이 짝 대화로 이어진다',()=>{
 for(const son of ['시므온','레위']){
  const entry=PAIR_DIALOGUE.find(item=>item.chapter==='gen.34'&&item.speaker==='야곱'&&item.target===son);
  assert.ok(entry,`${son} 대화가 있음`);
  assert.match(entry.ref,/34:30–31/);
  assert.match(entry.lines[0],/위험/);
  assert.match(entry.replyLines[0],/우리 누이/);
 }
});

test('창세기 19장 롯과 두 천사의 피신 대화는 요청과 응답이 이어진다',()=>{
 const entry=PAIR_DIALOGUE.find(item=>item.chapter==='gen.19'&&item.speaker==='롯'&&item.target==='두 천사');
 assert.ok(entry);assert.match(entry.ref,/19:15–22/);
 assert.match(entry.lines[0],/산으로/);assert.match(entry.replyLines[1],/엎지 않겠다/);
});

test('출애굽기 1·5·9·10·14·16·18·19·20·24·32장의 주요 대화는 상대 발화까지 연결된다',()=>{
 const cases=[['exo.1','바로','십브라',/남자아이들을 살려/,/히브리 여인들/],['exo.1','바로','부아',/남자아이들을 살려/,/히브리 여인들/],['exo.2','미리암','바로의 딸',/유모/,/가서 유모/],['exo.5','모세','바로',/광야에서 절기/,/여호와가 누구/],['exo.8','모세','바로',/개구리를 없애/,/내일이다/],['exo.9','바로','모세',/죄를 지었다/,/성 밖으로/],['exo.10','바로','모세',/누구누구/,/젊은이와 늙은이/],['exo.14','이스라엘 자손','모세',/매장지/,/두려워하지/],['exo.16','이스라엘 자손','모세',/고기 가마/,/저녁에는/],['exo.18','이드로','모세',/혼자/,/조언을 따르겠습니다/],['exo.19','모세','이스라엘 자손',/언약을 지키라/,/행하겠습니다/],['exo.20','이스라엘 자손','모세',/죽을까/,/두려워하지/],['exo.24','모세','이스라엘 자손',/말씀과 규례/,/행하겠습니다/],['exo.32','모세','아론',/큰 죄/,/재촉/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} → ${target}`);assert.match(entry.lines[0],first);assert.match(entry.replyLines[0],reply);}
});

test('레위기 10장 모세와 아론은 아들들의 죽음 뒤 제물 처리 문제를 주고받는다',()=>{
 const entry=PAIR_DIALOGUE.find(item=>item.chapter==='lev.10'&&item.speaker==='모세'&&item.target==='아론');
 assert.ok(entry);assert.match(entry.ref,/10:16–20/);assert.match(entry.lines[0],/속죄제물/);assert.match(entry.replyLines[0],/아들들이 죽었는데/);
});

test('민수기 여섯 사건의 인물 간 대화는 갈등·요청·응답을 짝으로 잇는다',()=>{
 const cases=[['num.11','여호수아','모세',/엘닷과 메닷/,/모든 백성에게 영/],['num.13','갈렙','다른 정탐꾼들',/능히 이길/,/우리보다 강/],['num.16','고라','모세',/거룩한데/,/누구를 택하셨는지/],['num.22','발람의 나귀','발람',/세 번이나/,/우습게/],['num.32','갓 자손','모세',/요단을 건너지/,/낙심/],['num.36','길르앗 족장들','모세',/다른 지파 남자/,/같은 지파 안에서/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} → ${target}`);assert.match(entry.lines[0],first);assert.match(entry.replyLines[0],reply);}
});

test('민수기 정탐·반역·에돔·놋뱀·발람·기업·요단 동편 사건의 짝 대화를 연결한다',()=>{
 const cases=[['num.14','이스라엘 자손','여호수아',/애굽으로 돌아가자/,/좋은 땅/],['num.16','다단','모세',/올라가지 않겠습니다/,/나귀 한 마리도/],['num.20','모세','에돔 왕',/큰길로 지나가게/,/지나가지 마라/],['num.21','이스라엘 자손','모세',/뱀을 우리에게서/,/기도하겠습니다/],['num.22','발락','발람',/저주해 주십시오/,/말씀을 넘어설 수 없습니다/],['num.23','발락','발람',/무슨 짓/,/내 입에 주신 말씀/],['num.24','발락','발람',/세 번이나 축복/,/말하지 않았습니까/],['num.27','말라','모세',/이름과 기업/,/너희 말이 옳다/],['num.32','르우벤 자손','모세',/이 땅은 가축/,/낙심하게 하려느냐/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} → ${target}`);assert.match(entry.lines[0],first);assert.match(entry.replyLines[0],reply);}
});

test('신명기 27장에서 레위인의 저주 선포에 이스라엘 백성이 아멘으로 응답한다',()=>{
 const entry=PAIR_DIALOGUE.find(item=>item.chapter==='deu.27'&&item.speaker==='레위 지파'&&item.target==='이스라엘 자손');
 assert.ok(entry);assert.match(entry.ref,/27:14–26/);assert.match(entry.lines[0],/저주/);assert.match(entry.replyLines[0],/아멘/);
});

test('신명기의 시혼 통행 거부와 계명 전달 요청은 상대 발화와 연결된다',()=>{
 const cases=[['deu.2','모세','시혼',/지나가게 해 주십시오/,/지나가지 못한다/],['deu.5','이스라엘 자손','모세',/말씀을 들은 뒤/,/사이에 서서/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry);assert.match(entry.lines[0],first);assert.match(entry.replyLines[0],reply);}
});

test('여호수아 관계도상 주요 대화 상대는 서로 이어지는 사건 기반 상호작용을 갖는다',()=>{
 const cases=[['jos.1','여호수아','르우벤 자손',/형제들이 기업을 얻을 때까지/,/어디든 가겠습니다/],['jos.2','라합','두 정탐꾼',/우리 성 사람들은/,/가족을 지키겠습니다/],['jos.5','여호수아','여호와의 군대 장관',/우리 편입니까/,/여호와의 군대 장관/],['jos.7','여호수아','아간',/숨김없이/,/외투와 은과 금/],['jos.9','여호수아','기브온 사람들',/왜 그렇게 했느냐/,/생명을 잃을까/],['jos.17','요셉 자손','여호수아',/한 몫만 받았습니까/,/산지로 올라가/],['jos.22','비느하스','르우벤 자손',/제단은 여호와께 등을/,/증거로 세웠습니다/],['jos.24','여호수아','이스라엘 자손',/섬길 자를 택하라/,/여호와를 버리고/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} → ${target}`);assert.match(entry.lines[0],first);assert.match(entry.replyLines[0],reply);}
});

test('여호수아의 발화 행은 인물 시점을 유지하고 각 문장에 별도 절 근거를 둔다',()=>{
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='jos');
 assert.equal(rows.length,25);
 assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length), '각 발화에 개별 구절 참조가 있어야 함');
 assert.ok(!rows.some(row=>row[1]===8&&row[2]==='아이 왕'), '말하지 않은 아이 왕에게 독백을 붙이지 않음');
});

test('사사기의 인물 발화 행은 문장별 절 참조를 가지며 침묵한 피해자에게 대사를 붙이지 않는다',()=>{
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='jdg');
 assert.equal(rows.length,23);
 assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length));
 assert.ok(!rows.some(row=>row[1]===19&&row[2]==='레위인의 첩'));
 const verseCounts=[36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25];
 for(const row of rows){
  const chapter=row[1],base=row[3].match(/\d+/g).map(Number),max=verseCounts[chapter-1];
  for(const ref of row[7]){const range=ref.match(/\d+/g).map(Number),start=range[0],end=range[1]||start;assert.ok(start>=base[0]&&end<=(base[1]||base[0]),`${chapter} ${ref} lies inside authored scope`);assert.ok(start>0&&end<=max,`${chapter} ${ref} exists in the chapter`);}
 }
});

test('사사기 핵심 관계 장면은 직접 만남의 요청·응답이 이어진다',()=>{
 const cases=[['jdg.3','에훗','에글론',/비밀한 말씀/,/모두 내 앞에서 물러가라/],['jdg.4','드보라','바락',/다볼 산/,/함께 가면 가겠습니다/],['jdg.4','야엘','시스라',/장막|이리로/,/물을 조금 주시오/],['jdg.11','입다의 딸','입다',/아버지|서원/,/내 딸아/],['jdg.12','에브라임 사람들','입다',/우리를 부르지/,/불렀지만/],['jdg.14','삼손','딤나 여인',/수수께끼의 답/,/당신은 나를 미워/],['jdg.16','들릴라','삼손',/큰 힘|힘의 비밀/,/활줄|머리털/],['jdg.17','레위 소년','미가',/머물 곳/,/제사장/],['jdg.19','노인','레위인',/어디서 왔고/,/에브라임 산지/],['jdg.20','이스라엘 자손','베냐민 지파',/넘겨/,/따르지 않겠다/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} → ${target}`);assert.match(entry.lines[0],first);assert.match(entry.replyLines[0],reply);}
});

test('룻기의 발화 행은 중복 화자를 정리하고 각 문장을 본문 절에 연결한다',()=>{
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='rut');
 assert.equal(rows.length,5);
 assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length));
 for(const [chapter,speaker,target,ref]of [['rut.3','나오미','룻',/3:1–6/],['rut.4','보아스','아무개',/4:3–10/]]){
  const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry);assert.match(entry.ref,ref);assert.equal(entry.replyLines.length,2);
 }
});

test('상호작용 대화 중에는 관계 여부와 상관없이 독백 슬롯을 멈춘다',()=>{
 const {director,npcs}=fixture(),ambient=new SpeechDirector();
 ambient.interrupt({id:'ambient',text:'랜덤 대사',speaker:{}},0);
 const related=director.tick(0,npcs);assert.equal(ambient.tick(1,[],ambientSpeechAllowed(related)),null);assert.equal(ambient.current,null);
 director.clear();director.contacts.clear();director.context={people:[],relations:[]};
 const noEncounter=director.tick(2,npcs);assert.deepEqual(noEncounter,[]);
 assert.equal(ambientSpeechAllowed(noEncounter),true,'발화가 기록되지 않은 근접 상황은 일반 독백을 막지 않음');
 assert.equal(ambientSpeechAllowed([{origin:'chapter-relation'}]),false,'본문 관계 특수 대사는 일반 대화와 겹치지 않음');
 assert.equal(ambientSpeechAllowed([]),true);
 const clicked={text:'선택한 인물의 대사'};
 assert.equal(manualSpeechAllowed(clicked,100,99),true,'사용자가 클릭한 대사는 특수 조우 중에도 유지');
 assert.equal(manualSpeechAllowed(clicked,100,100),false,'수동 대사는 표시 시간이 끝나면 해제');
});

test('매달림은 정면 고정·여섯 도트 자세·인물별 팔다리 움직임을 갖는다',()=>{
 const base={key:'lively',frequency:6,phase:0,swing:.17};
 const poses=Array.from({length:6},(_,i)=>hangingPose(base,i/6));
 assert.ok(poses.every(p=>p.direction==='down'&&p.pose.bodyX===0&&p.pose.bodyY===0));
 assert.equal(new Set(poses.map(p=>JSON.stringify(p.pose))).size,6);
 const limp=poses.map((_,i)=>hangingPose({...base,limp:true},i/6));
 assert.ok(limp.every(p=>p.pose.leftLeg===1&&p.pose.rightLeg===0));
 assert.equal(hangingPose(base,3,0,true).angle,0);
 assert.notDeepEqual(hangingPose({...base,key:'steady'},0).pose,poses[0].pose);
});
test('인물을 집어 들고 움직일 때 디스크리트 팔다리 포즈와 걷기 프레임이 이어진다',()=>{
 const profile={key:'lively',frequency:7,phase:.5,swing:.17,limp:false};
 const frames=Array.from({length:8},(_,i)=>liftedCharacterFrame(profile,i/7,2));
 assert.ok(frames.every(f=>f.motionOnly===false&&f.direction==='down'&&f.interaction.dangling));
 assert.ok(new Set(frames.map(f=>f.walkFrame)).size>1);
 assert.ok(new Set(frames.map(f=>JSON.stringify([f.interaction.leftArm,f.interaction.rightArm,f.interaction.leftLeg,f.interaction.rightLeg]))).size>1);
 assert.equal(liftedCharacterFrame(profile,2,4,true).walkFrame,0);
});
test('본문 근거가 없는 인물 간 자동 인사는 만들지 않는다',()=>{
 const a={name:'가',x:1,y:1,path:[]},b={name:'나',x:2,y:1,path:[]},c={name:'다',x:3,y:1,path:[]};
 const director=new EncounterDirector([],{people:[],relations:[]},{random:()=>0});
 assert.deepEqual(director.tick(0,[a,b,c]),[]);
 assert.deepEqual(director.tick(800,[a,b,c]),[]);
 assert.equal(director.active.length,0);
});
test('관계선만 있어도 그 관계를 반영한 양방향 특수 대화를 한다',()=>{
 const chapters=[{code:'gen',name:'창세기',chap:1,data:{people:[{name:'아담',role:'첫 사람'},{name:'하와',role:'첫 여자'}],rels:[{from:'아담',to:'하와',label:'함께 있음',verses:'1-2',note:'함께 있는 두 사람.'}]}}];
 const context=buildChapterDialogue(chapters),npcs=context.people.map((p,i)=>({...p,refs:[p.ref],x:10+i,y:10,path:[]}));
 const lines=new EncounterDirector(chapters,context,{random:()=>0}).tick(0,npcs);
 assert.equal(lines.length,1);assert.equal(lines[0].origin,'chapter-relation');
 assert.equal(lines[0].pairLines.length,2);assert.match(lines[0].pairLines[0].text,/이어져|연결/);
});
test('기록된 인물 간 상호대사는 확률 제한 없이 실제 조우 때 시작한다',()=>{
 const {director,npcs}=fixture();director.random=()=>.99;
 const lines=director.tick(0,npcs);
 assert.equal(lines.length,1);assert.notEqual(lines[0].origin,'general');
 assert.equal(director.active.length,1);
});
test('말풍선에는 구절 줄을 빼고 자세히 보기에는 해설과 관련 구절을 둔다',()=>{
 const source=fs.readFileSync('js/features/pixel-bible/world.js','utf8');
 assert.doesNotMatch(source,/data-action="passage"/);
 assert.match(source,/data-action="detail-passage"/);
 assert.match(source,/data-action="speech-details">자세히 보기/);
 assert.match(source,/data-action="encounter-details">자세히 보기/);
});
