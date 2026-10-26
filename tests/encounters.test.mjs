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
 const cases=[['2sa.1','다윗','아말렉 청년',/기름 부음 받은 왕/,/죽여 달라고|제가 사울을 죽였다고/],['2sa.2','다윗','야베스 길르앗 사람들',/장사해 준/,/기억해|알아주셔서/],['2sa.3','아브넬','다윗',/이스라엘 장로들/,/미갈|언약/],['2sa.3','요압','다윗',/아브넬/,/스루야|네가 한 악|악을 행한 자/],['2sa.5','이스라엘 지파들','다윗',/골육|목자/,/헤브론|언약/],['2sa.7','나단','다윗',/집을 세우십니다/,/성전을 짓고|집을 세우신다는 약속/],['2sa.9','다윗','므비보셋',/두려워하지|상에서 먹어라/,/죽은 개|자격/],['2sa.11','다윗','우리아',/집으로 내려가/,/집에 갈 수 없/],['2sa.16','압살롬','후새',/왜 그 친구의 아들을/,/왕 만세/],['2sa.19','시므이','다윗',/죄를 지었습니다/,/죽지 않을/],['2sa.19','다윗','므비보셋',/왜 나와 함께/,/시바가|왕께서 무사히/],['2sa.19','바르실래','다윗',/요단을 건널/,/김함/],['2sa.24','다윗','아라우나',/타작마당|값을 치르지/,/제단을 쌓으십시오/]];
 for(const [chapter,speaker,target,first,reply]of cases){
  const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);
  assert.ok(entry,`${chapter} ${speaker} ↔ ${target}`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>first.test(line)),`${chapter} ${speaker} first line`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>reply.test(line)),`${chapter} ${speaker} reply line`);
 }
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='2sa');
 assert.equal(rows.length,25);assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length),'각 발화마다 구절 연결');
 const verseCounts=[27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25];
 for(const row of rows){const base=row[3].match(/\d+/g).map(Number);for(const ref of row[7]){const n=ref.match(/\d+/g).map(Number),end=n[1]||n[0];assert.ok(n[0]>=base[0]&&end<=(base[1]||base[0])&&end<=verseCounts[row[1]-1],`${row[1]} ${ref} 범위 확인`)}}
});

test('사무엘하의 나단·다윗 책망, 사울 죽음 주장, 요압 항의, 바르실래의 작별을 본문대로 구분한다',()=>{
 const nathan=PAIR_DIALOGUE.find(entry=>entry.chapter==='2sa.12'&&entry.speaker==='나단');
 assert.match(nathan.lines[1],/우리야를 죽이고/);
 const amalekite=PAIR_DIALOGUE.find(entry=>entry.chapter==='2sa.1'&&entry.speaker==='다윗'&&entry.target==='아말렉 청년');
 assert.match(amalekite.ref,/1:6–16/);assert.doesNotMatch(amalekite.replyLines[0],/보상/);assert.match(amalekite.detail,/사무엘상 31장/);
 const joab=PAIR_DIALOGUE.find(entry=>entry.chapter==='2sa.3'&&entry.speaker==='요압');
 assert.match(joab.detail,/직접 한 말로 기록하지 않고/);assert.match(joab.detail,/창작 재구성/);
 const nathanPromise=PAIR_DIALOGUE.find(entry=>entry.chapter==='2sa.7');
 assert.match(nathanPromise.detail,/하나님께 기도한 것이 아니라|나단에게 답한 것이 아니라 하나님께 기도/);
 const barzillai=PAIR_DIALOGUE.find(entry=>entry.chapter==='2sa.19'&&entry.speaker==='바르실래');
 assert.match(barzillai.lines[0],/너무 늙었습니다/);assert.match(barzillai.lines[1],/김함/);
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
 const naboth=PAIR_DIALOGUE.find(entry=>entry.id==='pair-3');assert.equal(naboth.target,'나봇의 성읍 장로들');assert.match(naboth.detail,/편지 내용을 대사로 옮겼고/);
 const jezebelThreat=PAIR_DIALOGUE.find(entry=>entry.id==='pair-9');assert.match(jezebelThreat.detail,/마주 앉아 한 대화가 아니라 사자를 통해/);assert.equal(jezebelThreat.replyLines.length,2);
 assert.equal(PAIR_DIALOGUE.some(entry=>['pair-10','pair-12','pair-13'].includes(entry.id)),false,'기도와 기록된 행동은 인물 간 대사로 만들지 않는다');
 const call=PAIR_DIALOGUE.find(entry=>entry.id==='pair-14'),callReply=PAIR_DIALOGUE.find(entry=>entry.id==='pair-15');assert.match(call.lines[0],/부모님께 입 맞추고/);assert.match(callReply.lines[0],/돌아가라/);
 const baasha=PAIR_DIALOGUE.find(entry=>entry.id==='pair-189');assert.match(baasha.detail,/답변을 기록하지 않습니다/);
 const benhadad=PAIR_DIALOGUE.find(entry=>entry.id==='pair-188');assert.match(benhadad.detail,/사신을 통해/);assert.match(benhadad.detail,/재구성/);
 const verseCounts=[53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53];
 for(const row of rows){const base=row[3].match(/\d+/g).map(Number);for(const ref of row[7]){const n=ref.match(/\d+/g).map(Number),end=n[1]||n[0];assert.ok(n[0]>=base[0]&&end<=(base[1]||base[0])&&end<=verseCounts[row[1]-1],`${row[1]} ${ref} 범위 확인`)}}
});

test('열왕기하 관계선 154개가 모두 상호작용 대상이고 중요 사건 대화를 보강했다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/2ki.json'));
 const chapters=Object.entries(data.chapters).map(([chap,chapter])=>({code:'2ki',name:'열왕기하',chap:Number(chap),data:chapter}));
 const context=buildChapterDialogue(chapters);let audited=0;
 for(const relation of context.relations){const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});assert.equal(lines.length,2);assert.ok(lines.every(line=>line.text&&!/어색|안녕하세요/.test(line.text)));audited++}
 assert.equal(context.relations.filter(relation=>!relation.scriptedPair).length,154);assert.equal(audited,156,'관계선 외에 본문 대화 인덱스가 보강한 연결도 대화됨');
 const cases=[['2ki.3','여호사밧','엘리사',/말씀을 물을 선지자/,/엘리야의 손에 물을 붓던/],['2ki.4','수넴 여인','엘리사',/아들을 달라고 했습니까/,/네 아들을 데려가라/],['2ki.5','엘리사','나아만',/요단강에/,/다메섹의 강/],['2ki.5','나아만의 종들','나아만',/더 어려운 일을/,/요단으로 가서/],['2ki.6','엘리사','엘리사의 사환',/두려워하지/,/불말과 불병거/],['2ki.7','나병 환자 넷','성읍 문지기',/아람 진영/,/왕께 곧 이 소식을/],['2ki.8','엘리사','하사엘',/벤하닷의 병/,/아람의 왕/],['2ki.9','요람(아합의 아들)','예후',/평화로운 일/,/이세벨의 우상 숭배/],['2ki.10','예후','여호나답',/손을 내게/,/손을 잡겠습니다/],['2ki.11','여호야다','요아스',/왕관/,/언약을 맺어/],['2ki.13','엘리사','요아스(여호아하스의 아들)',/구원의 화살/,/세 번/],['2ki.14','아마샤','요아스(여호아하스의 아들)',/대면해 봅시다/,/가시나무/],['2ki.18','엘리아김(힐기야의 아들)','랍사게',/아람 말/,/성벽 위 백성/],['2ki.19','히스기야','이사야',/환난과 책망/,/두려워하지 마십시오/],['2ki.20','히스기야','바벨론 사신들',/보물과 무기고/,/편지와 예물/],['2ki.22','요시야','훌다',/말씀을 여호와께/,/재앙이 임할/],['2ki.23','바로 느고','요시야',/다른 전쟁/,/므깃도 골짜기/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} ↔ ${target}`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>first.test(line)),`${chapter} first`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>reply.test(line)),`${chapter} reply`)}
 const shunammite=PAIR_DIALOGUE.find(entry=>entry.id==='pair-194');assert.match(shunammite.detail,/답은 그 뒤의 행동을/);
 const naaman=PAIR_DIALOGUE.find(entry=>entry.id==='pair-195');assert.match(naaman.detail,/사자를 보내/);
 const lepers=PAIR_DIALOGUE.find(entry=>entry.id==='pair-198');assert.equal(lepers.target,'성읍 문지기');assert.match(lepers.detail,/문지기의 응답은 본문에 직접 기록되지 않아 재구성/);
 const elishaHazael=PAIR_DIALOGUE.find(entry=>entry.id==='pair-199');assert.equal(elishaHazael.speaker,'엘리사');assert.match(elishaHazael.lines[0],/나을 것이라고/);
 const joash=PAIR_DIALOGUE.find(entry=>entry.id==='pair-202');assert.match(joash.detail,/요아스의 답을 기록하지 않으므로/);
 const envoys=PAIR_DIALOGUE.find(entry=>entry.id==='pair-207');assert.match(envoys.detail,/양쪽 발화는 사건을 잇는 창작 재구성/);assert.doesNotMatch(envoys.lines[1],/포로/);
 const necho=PAIR_DIALOGUE.find(entry=>entry.id==='pair-209');assert.match(necho.ref,/역대하 35:20–22/);assert.match(necho.detail,/어떻게 답했는지 직접 싣지 않아/);
});

test('역대상 인간 관계선 130개와 왕위·성전·예배·전쟁의 대화를 보강했다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/1ch.json'));
 const chapters=Object.entries(data.chapters).map(([chap,chapter])=>({code:'1ch',name:'역대상',chap:Number(chap),data:chapter}));
 const context=buildChapterDialogue(chapters);let audited=0;
 for(const relation of context.relations){const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});assert.equal(lines.length,2);assert.ok(lines.every(line=>line.text&&!/어색|안녕하세요/.test(line.text)));audited++}
 assert.equal(audited,130);
 const cases=[['1ch.11','이스라엘 장로들','다윗',/골육|목자/,/언약을 맺고 왕으로 세우/],['1ch.12','아마새','다윗',/평화를 이루러/,/마음도 너희와/],['1ch.15','다윗','사독',/몸을 성별/,/어깨에 메겠습니다/],['1ch.17','다윗','나단',/백향목 궁/,/왕의 자손이 성전을/],['1ch.19','다윗','다윗의 사절들',/여리고에 머물/,/수염이 자란 뒤/],['1ch.19','암몬 방백들','하눈',/정탐꾼/,/모욕한 뒤/],['1ch.19','요압','아비새',/네가 나를 돕고/,/여호와께서 선하게/],['1ch.21','갓','다윗',/세 가지 벌/,/내가 죄를 지었습니다/],['1ch.21','다윗','오르난',/타작마당/,/모두 왕께 드립니다/],['1ch.22','다윗','솔로몬',/성전을 지을 마음/,/재료와 일꾼/],['1ch.28','다윗','이스라엘 지도자들',/내가 성전을/,/솔로몬을 도와/],['1ch.29','이스라엘 지도자들','다윗',/금과 은과 보석/,/기쁘게 드리는 백성/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} ↔ ${target}`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>first.test(line)),`${chapter} first`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>reply.test(line)),`${chapter} reply`)}
 const nathan=PAIR_DIALOGUE.find(entry=>entry.id==='pair-213');assert.match(nathan.detail,/처음 동의와 나중의 예언/);assert.doesNotMatch(nathan.lines[1],/성전을 짓겠다는 뜻을 말했지만/);
 const gad=PAIR_DIALOGUE.find(entry=>entry.id==='pair-217');assert.match(gad.detail,/두 번째 응답은 뒤이은 기도/);
 const leaders=PAIR_DIALOGUE.find(entry=>entry.id==='pair-220');assert.match(leaders.detail,/답변은 기록되지 않았으므로/);assert.doesNotMatch(leaders.lines[1],/내 아들 솔로몬아/);
 const offering=PAIR_DIALOGUE.find(entry=>entry.id==='pair-221');assert.match(offering.detail,/하나님께 찬양과 감사의 기도/);
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='1ch');assert.equal(rows.length,36);assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length));
 const verseCounts=[54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30];
 for(const row of rows){const base=row[3].match(/\d+/g).map(Number);for(const ref of row[7]){const n=ref.match(/\d+/g).map(Number),end=n[1]||n[0];assert.ok(n[0]>=base[0]&&end<=(base[1]||base[0])&&end<=verseCounts[row[1]-1],`${row[1]} ${ref} 범위 확인`)}}
});

test('역대하 인간 관계선 152개와 개혁·전쟁·성전 장면의 대화를 보강했다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/2ch.json'));
 const chapters=Object.entries(data.chapters).map(([chap,chapter])=>({code:'2ch',name:'역대하',chap:Number(chap),data:chapter}));
 const context=buildChapterDialogue(chapters);let audited=0;
 for(const relation of context.relations){const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});assert.equal(lines.length,2);assert.ok(lines.every(line=>line.text&&!/어색|안녕하세요/.test(line.text)));audited++}
 assert.equal(audited,152);
 const cases=[['2ch.2','솔로몬','후람',/여호와의 이름을 위해 집을/,/백향목을|후람\(장인\)/],['2ch.9','스바 여왕','솔로몬',/시험하러/,/질문|하나님/],['2ch.10','르호보암','노인들',/멍에를 가볍게/,/백성을 섬기고/],['2ch.10','르호보암','젊은이들',/어떻게 말하겠/,/더 무겁게/],['2ch.11','스마야','르호보암',/싸우러 올라가지/,/돌아가겠습니다/],['2ch.13','아비야','여로보암',/소금 언약/,/금송아지/],['2ch.15','아사랴(오뎃의 아들)','아사',/여호와와 함께하면/,/우상들을 없애/],['2ch.18','미가야','아합',/목자 없는 양/,/감옥에 가두/],['2ch.19','여호사밧','재판관들',/여호와를 위해 재판/,/판결하겠습니다/],['2ch.20','야하시엘','여호사밧',/전쟁은 여러분의 것이 아니라/,/여호와께 경배|레위 사람들이/],['2ch.21','엘리야','여호람(여호사밧의 아들)',/형제들을 죽였/,/편지가/],['2ch.23','여호야다','요아스',/왕의 아들을/,/왕으로 세움을/],['2ch.24','스가랴(여호야다의 아들)','요아스',/계명을 버립니까/,/돌로 쳐 죽여/],['2ch.25','아마샤','요아스(여호아하스의 아들)',/대면해 봅시다/,/가시나무/],['2ch.28','오뎃','에브라임 지도자들',/노예로 삼지/,/포로들을 풀어/],['2ch.29','히스기야','레위인들',/성소를 깨끗하게/,/성전을 정결하게/],['2ch.30','히스기야','이스라엘과 유다 백성',/유월절을 지키라고/,/편지를 전하겠습니다/],['2ch.32','산헤립의 신하들','히스기야',/건진 신이/,/강하고 담대하라/],['2ch.34','훌다','요시야',/재앙이 예루살렘/,/마음이 부드러워졌습니다/],['2ch.35','느고','요시야',/싸우려는 것이 아닙니다/,/화살에 맞/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} ↔ ${target}`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>first.test(line)),`${chapter} first`);assert.ok([...entry.lines,...(entry.replyLines||[])].some(line=>reply.test(line)),`${chapter} reply`)}
 const oldMen=PAIR_DIALOGUE.find(entry=>entry.id==='pair-224');assert.doesNotMatch(oldMen.lines[1],/전갈로 다스리겠다고/);
 const youngMen=PAIR_DIALOGUE.find(entry=>entry.id==='pair-225');assert.doesNotMatch(youngMen.lines[1],/전갈로 다스리겠다고/);
 const prophet=PAIR_DIALOGUE.find(entry=>entry.id==='pair-232');assert.match(prophet.detail,/여호와께 드린 경배와 찬양/);
 const envoy=PAIR_DIALOGUE.find(entry=>entry.id==='pair-241');assert.match(envoy.detail,/사절들을 통해/);
 const siege=PAIR_DIALOGUE.find(entry=>entry.id==='pair-240');assert.match(siege.detail,/직접 주고받은 대화가 아니라/);
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='2ch');assert.equal(rows.length,38);assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length));
 const verseCounts=[17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23];
 for(const row of rows){const base=row[3].match(/\d+/g).map(Number);for(const ref of row[7]){const n=ref.match(/\d+/g).map(Number),end=n[1]||n[0];assert.ok(n[0]>=base[0]&&end<=(base[1]||base[0])&&end<=verseCounts[row[1]-1],`${row[1]} ${ref} 범위 확인`)}}
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
 for(const [kind,label,expected]of [['family','아버지와 딸',/아버지|딸|함께/],['ally','함께 지킨 동료',/약속|네가|필요/],['conflict','맞선 원수',/피해|해친|맞서|싸움/]]){
  const relation={from:{code:'gen',chap:1},to:{code:'gen',chap:1},kind,label,text:'이 장면에서 두 인물의 관계가 드러납니다.',ref:'창세기 1:1'};
  const lines=relationshipLines(a,b,relation,new Map(),{random:()=>0});
  assert.equal(lines.length,2);assert.ok(lines.every(line=>line.origin==='chapter-relation'));
 assert.match(lines[0].text,expected);assert.match(lines[1].detailText,/창작 상호작용/);
 }
});

test('약한 가족 관계 대사는 기존보다 5배 많은 변형을 쓰고 부모·자녀와 형·동생의 말투를 나눈다',()=>{
 const father={name:'아버지',role:'아버지'},son={name:'아들',role:'아들'};
 const parentLink={from:{...father,code:'gen',chap:1},to:{...son,code:'gen',chap:1},kind:'family',label:'아버지와 아들',text:'아버지는 아들을 가르치고 아들은 아버지의 말을 듣는다.',ref:'창세기 1:1'};
 const parentVariants=Array.from({length:10},(_,i)=>relationshipLines(father,son,parentLink,null,{random:()=>i/10}));
 assert.equal(new Set(parentVariants.map(lines=>lines[0].text)).size,10);
 assert.ok(parentVariants.every(lines=>!/딸아/.test(lines[0].text)&&/아버지/.test(lines[1].text)));
 assert.ok(parentVariants.some(lines=>/아들아/.test(lines[0].text)));
 const older={name:'형',role:'형'},younger={name:'동생',role:'동생'};
 const siblingLink={from:{...older,code:'gen',chap:1},to:{...younger,code:'gen',chap:1},kind:'family',label:'형',text:'형이 동생을 이끌었다.',ref:'창세기 1:1'};
 const siblings=relationshipLines(older,younger,siblingLink,null,{random:()=>0});
 assert.match(siblings[0].text,/동생아/);assert.match(siblings[1].text,/형/);
 const cain={name:'형제A'},abel={name:'형제B'};
 const hostileSibling={from:{...cain,code:'gen',chap:4},to:{...abel,code:'gen',chap:4},kind:'family',label:'형제',text:'형제A는 동생 형제B를 꾸짖었습니다.',ref:'창세기 4:8'};
 const cainAbel=relationshipLines(cain,abel,hostileSibling,null,{random:()=>0});
 assert.match(cainAbel[0].text,/동생아/,'관계 설명에서 연령 순서와 호칭을 읽는다');
 assert.match(cainAbel[1].text,/형/);
 const olderSister={name:'누나',role:'언니'},youngerSister={name:'동생',role:'여동생'};
 const sisters=relationshipLines(youngerSister,olderSister,{from:{...olderSister,code:'gen',chap:1},to:{...youngerSister,code:'gen',chap:1},kind:'family',label:'자매',text:'언니가 동생을 도왔습니다.',ref:'창세기 1:1'},null,{random:()=>0});
 assert.match(sisters[0].text,/언니/,'자매 관계에서는 형 대신 언니 호칭을 쓴다');
});

test('약한 적대 관계 대사도 열 가지 사건 중심 응답을 고르고 서로 질문과 반박을 주고받는다',()=>{
 const a={name:'대적 A'},b={name:'대적 B'},relation={from:{name:a.name,code:'gen',chap:1},to:{name:b.name,code:'gen',chap:1},kind:'conflict',label:'공사를 방해한 대적',text:'한쪽은 공사를 계속하려 하고 다른 쪽은 겁을 주며 막았다.',ref:'에스라 4:1–5'};
 const variants=Array.from({length:10},(_,i)=>relationshipLines(a,b,relation,null,{random:()=>i/10}));
 assert.equal(new Set(variants.map(lines=>lines[0].text)).size,10);
 assert.ok(variants.every(lines=>lines.length===2&&lines.every(line=>line.text.length>15)&&lines[0].text!==lines[1].text));
});

test('가족 갈등 대사는 혈연 호칭을 유지하면서 비난과 응답을 주고받는다',()=>{
 const older={name:'형제A',role:'동생을 해친 맏형'},younger={name:'형제B',role:'피해를 입은 동생'};
 const relation={from:{...older,code:'gen',chap:5},to:{...younger,code:'gen',chap:5},kind:'conflict',label:'죽인 형',text:'형제A가 동생 형제B를 해쳤어요.',ref:'창세기 5:1'};
 const lines=relationshipLines(older,younger,relation,null,{random:()=>0});
 assert.match(lines[0].text,/동생아/);assert.match(lines[1].text,/형,/);
 assert.notEqual(lines[0].text,lines[1].text);
});

test('레위기의 가족 관계 설명에서 형 아론과 조카 엘르아살 호칭을 관계 대사에 반영한다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/lev.json'));
 const chapters=Object.entries(data.chapters).map(([chap,chapter])=>({code:'lev',name:'레위기',chap:Number(chap),data:chapter}));
 const context=buildChapterDialogue(chapters);
 const brother=context.relations.find(item=>item.from.name==='모세'&&item.to.name==='아론'&&item.from.chap===8);
 const brotherLines=relationshipLines(brother.from,brother.to,brother,null,{random:()=>0});
 assert.match(brotherLines[0].text,/형/);
 const uncle=context.relations.find(item=>item.from.name==='모세'&&item.to.name==='엘르아살'&&item.from.chap===10);
 const uncleLines=relationshipLines(uncle.from,uncle.to,uncle,null,{random:()=>0});
 assert.match(uncleLines[0].text,/조카/);
});

test('창세기부터 요한계시록까지 1,189장 관계선은 모두 양방향이며 약한 연결은 10개 변형을 갖는다',()=>{
 let chapterCount=0,edgeCount=0,fallbackCount=0;
 const files=fs.readdirSync('data/summary').filter(file=>file.endsWith('.json'));
 assert.equal(files.length,66);
 for(const file of files){
  const code=file.replace(/\.json$/,''),summary=JSON.parse(fs.readFileSync(`data/summary/${file}`,'utf8'));
  const chapters=Object.entries(summary.chapters||{}).map(([chap,data])=>({code,name:summary.book?.name||code,chap:Number(chap),data}));
  chapterCount+=chapters.length;
  const context=buildChapterDialogue(chapters);
  for(const relation of context.relations){
   edgeCount++;
   const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});
   assert.equal(lines.length,2,`${code}.${relation.from.chap}: ${relation.from.name} ↔ ${relation.to.name}`);
   assert.notEqual(lines[0].text,lines[1].text,`${code}.${relation.from.chap}: 응답이 같은 독백으로 반복되지 않음`);
   assert.ok(lines.every(line=>line.text&&!/우리가 가족으로 이어져 있다는 걸 잊지 않겠다|가족 관계와 함께 겪은 일을 마음에 두고|우리 사이의 정을 소중히 여기겠다|어색한 인사|안녕하세요/.test(line.text)));
   if(lines[0].origin==='chapter-relation'){
    fallbackCount++;
    const variants=new Set(Array.from({length:10},(_,i)=>relationshipLines(relation.from,relation.to,relation,null,{random:()=>i/10})[0].text));
    assert.equal(variants.size,10,`${code}.${relation.from.chap}: 약한 관계 대사 변형 수`);
   }
  }
 }
 assert.equal(chapterCount,1189);assert.equal(edgeCount,3805);assert.ok(fallbackCount>1000);
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
  assert.ok(reverse||entry.replyLines?.length>0,`${entry.id} (${entry.speaker} → ${entry.target})에 응답이 없음`);
  for(const index of [0,1]){
   const relation={from:{code:entry.chapter.split('.')[0],chap:Number(entry.chapter.split('.')[1])},to:{},text:'같은 장면의 두 인물',ref:entry.ref};
   const lines=relationshipLines({name:entry.speaker},{name:entry.target},relation,new Map(),{random:()=>index?0.99:0});
   assert.equal(lines.length,2,`${entry.id} 대사가 독백으로 분리됨`);
   assert.equal(lines[0].text,entry.lines[index],`${entry.id} 첫 발화 후보가 맞지 않음`);
   assert.equal(lines[1].text,reverse?.lines[index]||entry.replyLines?.[index]||entry.replyLines?.[0],`${entry.id} 응답 후보가 맞지 않음`);
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
 const replies=[];
 for(const son of ['시므온','레위']){
  const entry=PAIR_DIALOGUE.find(item=>item.chapter==='gen.34'&&item.speaker==='야곱'&&item.target===son);
  assert.ok(entry,`${son} 대화가 있음`);
  assert.match(entry.ref,/34:30–31/);
  assert.match(entry.lines[0],/위험/);
  assert.match(entry.replyLines[0],/우리 누이|디나/);
  replies.push(entry.replyLines[0]);
 }
 assert.notEqual(replies[0],replies[1],'시므온과 레위의 개별 화면 대사를 구분한다');
});

test('창세기 19장 롯과 두 천사의 피신 대화는 요청과 응답이 이어진다',()=>{
 const entry=PAIR_DIALOGUE.find(item=>item.chapter==='gen.19'&&item.speaker==='롯'&&item.target==='두 천사');
 assert.ok(entry);assert.match(entry.ref,/19:15–22/);
 assert.match(entry.lines[0],/산으로/);assert.match(entry.replyLines[1],/엎지 않겠다/);
});

test('창세기 37장 유다의 요셉 매매 제안과 45장 정체 공개를 서로 다른 장면으로 구분한다',()=>{
 const sale=PAIR_DIALOGUE.find(item=>item.chapter==='gen.37'&&item.speaker==='유다'&&item.target==='요셉');
 assert.ok(sale);assert.match(sale.ref,/37:26–28/);assert.match(sale.lines[0],/죽이고.*상인에게 팔/);assert.match(sale.replyLines[0],/손대지 말고/);assert.match(sale.detail,/42:21.*창작 재구성/);
 const reveal=PAIR_DIALOGUE.find(item=>item.chapter==='gen.45'&&item.speaker==='요셉'&&item.target==='유다');
 assert.ok(reveal);assert.match(reveal.lines[0],/유다 형님.*살아 계십니까/);assert.match(reveal.detail,/대답하지 못했다고 기록/);assert.match(reveal.detail,/직접 인용이 아닙니다/);
 assert.ok(!reveal.replyLines.some(line=>/아버지는 살아 계십니다/.test(line)),'45장에서 조용했던 형들에게 기록되지 않은 답을 직접 인용처럼 붙이지 않음');
});

test('출애굽기 1·5·9·10·14·16·18·19·20·24·32장의 주요 대화는 상대 발화까지 연결된다',()=>{
 const cases=[['exo.1','바로','십브라',/남자아이들을 살려/,/히브리 여인들/],['exo.1','바로','부아',/남자아이들을 살려/,/히브리 여인들/],['exo.2','미리암','바로의 딸',/유모/,/가서 유모/],['exo.5','모세','바로',/광야에서 절기/,/여호와가 누구/],['exo.8','모세','바로',/개구리를 없애/,/내일이다/],['exo.9','바로','모세',/죄를 지었다/,/성 밖으로/],['exo.10','바로','모세',/누구누구/,/젊은이와 늙은이/],['exo.14','이스라엘 자손','모세',/매장지/,/두려워하지/],['exo.16','이스라엘 자손','모세',/고기 가마/,/저녁에는/],['exo.18','이드로','모세',/혼자/,/조언을 따르겠습니다/],['exo.19','모세','이스라엘 자손',/언약을 지키라/,/행하겠습니다/],['exo.20','이스라엘 자손','모세',/죽을까/,/두려워하지/],['exo.24','모세','이스라엘 자손',/말씀과 규례/,/행하겠습니다/],['exo.32','모세','아론',/큰 죄/,/재촉/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} → ${target}`);assert.match(entry.lines[0],first);assert.match(entry.replyLines[0],reply);}
});

test('출애굽기 1장의 산파들은 공동 답변을 유지하되 십브라와 부아의 발화를 똑같이 반복하지 않는다',()=>{
 const shiphrah=PAIR_DIALOGUE.find(entry=>entry.chapter==='exo.1'&&entry.target==='십브라');
 const puah=PAIR_DIALOGUE.find(entry=>entry.chapter==='exo.1'&&entry.target==='부아');
 assert.ok(shiphrah&&puah);
 assert.notEqual(shiphrah.replyLines[1],puah.replyLines[1]);
 assert.ok([shiphrah,puah].every(entry=>/함께 한 대답/.test(entry.detail)));
 assert.ok([shiphrah,puah].every(entry=>entry.replyLines.every(line=>/히브리 여인|아이/.test(line))));
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

test('민수기 16장 모세의 호소를 다단에게 한 말로 오인하지 않고 27장 판결 전달자를 모세로 둔다',()=>{
 const dathan=PAIR_DIALOGUE.find(entry=>entry.chapter==='num.16'&&entry.speaker==='다단');
 assert.ok(dathan);assert.match(dathan.replyLines[0],/여호와여/);assert.match(dathan.detail,/직접 답했다고 기록되지 않습니다/);
 const daughters=PAIR_DIALOGUE.find(entry=>entry.chapter==='num.27'&&entry.speaker==='말라');
 assert.ok(daughters);assert.ok(daughters.replyLines.every(line=>/여호와께서/.test(line)));assert.match(daughters.detail,/모세는 하나님께 받은 결정을 딸들에게 전하는 장면/);
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

test('신명기 31장 계승 대화와 여호수아 14장 갈렙의 헤브론 요청을 구체화한다',()=>{
 const succession=PAIR_DIALOGUE.find(entry=>entry.chapter==='deu.31'&&entry.speaker==='모세'&&entry.target==='여호수아');
 assert.ok(succession);assert.ok(succession.lines.every(line=>/강하고 담대|함께/.test(line)));assert.match(succession.detail,/여호수아의 응답은 본문에 따로 기록되지 않아/);
 const joshua=PAIR_DIALOGUE.find(entry=>entry.chapter==='jos.14'&&entry.speaker==='여호수아');
 const caleb=PAIR_DIALOGUE.find(entry=>entry.chapter==='jos.14'&&entry.speaker==='갈렙');
 assert.ok(joshua&&caleb);assert.ok([...joshua.lines,...caleb.lines].every(line=>/헤브론|산지/.test(line)));
 assert.match(caleb.lines[0],/주십시오/);assert.match(joshua.detail,/기업으로 주었습니다/);
});

test('여호수아의 발화 행은 인물 시점을 유지하고 각 문장에 별도 절 근거를 둔다',()=>{
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='jos');
 assert.equal(rows.length,25);
 assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length), '각 발화에 개별 구절 참조가 있어야 함');
 assert.ok(!rows.some(row=>row[1]===8&&row[2]==='아이 왕'), '말하지 않은 아이 왕에게 독백을 붙이지 않음');
});

test('욥기 42장과 관계선 54개를 모두 사건에 맞는 양방향 대사로 연결한다',()=>{
 const job=PAIR_DIALOGUE.filter(entry=>entry.chapter.startsWith('job.'));
 assert.equal(job.length,54);
 for(const entry of job){
  assert.ok(entry.ref.startsWith('욥기 '));
  assert.equal(entry.lines.length,2);
  assert.ok(entry.replyLines?.length||PAIR_DIALOGUE.some(other=>other.chapter===entry.chapter&&other.speaker===entry.target&&other.target===entry.speaker));
  assert.ok(entry.detail);
 }
 const summaries=JSON.parse(fs.readFileSync(new URL('../data/summary/job.json',import.meta.url),'utf8'));
 const context=buildChapterDialogue(Object.entries(summaries.chapters).map(([chap,data])=>({code:'job',name:'욥기',chap:Number(chap),data})));
 assert.equal(context.relations.length,54);
 for(const relation of context.relations){
  const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});
  assert.ok(lines.every(line=>line.origin==='authored'&&line.ref&&line.detailText),`${relation.ref} 관계 대화 출처`);
 }
 const wife=job.find(entry=>entry.chapter==='job.2'&&entry.speaker==='욥의 아내');
 assert.match(wife.lines[0],/하나님을 욕하고 죽/);assert.match(wife.replyLines[0],/좋은 것을 받았/);
});

test('시편 표제에 연결된 다윗의 역사적 관계는 시적 문답과 사건 배경을 구분한다',()=>{
 const psalms=PAIR_DIALOGUE.filter(entry=>entry.chapter.startsWith('psa.'));
 assert.equal(psalms.length,137);
 for(const entry of psalms){assert.ok(entry.ref.startsWith('시편 '));assert.equal(entry.lines.length,2);assert.ok(entry.detail)}
 const psalmSummary=JSON.parse(fs.readFileSync('data/summary/psa.json'));
 for(const entry of psalms){
  const names=psalmSummary.chapters[Number(entry.chapter.split('.')[1])].people.map(person=>person.name);
  assert.ok(names.includes(entry.speaker),`${entry.id} 화자가 장 인물 색인에 있음`);
  assert.ok(names.includes(entry.target),`${entry.id} 상대가 장 인물 색인에 있음`);
 }
 const psalmContext=buildChapterDialogue(Object.entries(psalmSummary.chapters).map(([chap,data])=>({code:'psa',name:'시편',chap:Number(chap),data})));
 const covered=psalmContext.relations.filter(relation=>psalms.some(entry=>entry.chapter===`psa.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))));
 assert.equal(psalmContext.relations.length,140);assert.equal(covered.length,140);
 assert.ok(!psalmSummary.chapters[114].people.some(person=>person.name==='야곱의 집'));
 assert.ok(!psalmSummary.chapters[118].people.some(person=>person.name==='머릿돌'));
 assert.ok(psalmSummary.chapters[120].people.some(person=>person.name==='거짓말하는 이웃'));
 const absalom=psalms.find(entry=>entry.chapter==='psa.3'&&entry.speaker==='압살롬');
 assert.match(absalom.detail,/실제 발언|직접 발언/);assert.match(absalom.replyLines[0],/방패/);
 const doeg=psalms.find(entry=>entry.chapter==='psa.52'&&entry.target==='사울');
 assert.match(doeg.ref,/사무엘상 22/);assert.match(doeg.detail,/재구성/);
 const mockers=psalms.find(entry=>entry.chapter==='psa.42'&&entry.target==='고라 자손');
 assert.match(mockers.ref,/시편 42:3/);assert.match(mockers.replyLines[0],/하나님을 바라리라/);
 const pharaoh=psalms.find(entry=>entry.chapter==='psa.105'&&entry.target==='요셉');
 assert.match(pharaoh.ref,/창세기 41/);assert.match(pharaoh.detail,/재구성/);
 const exiles=psalms.find(entry=>entry.chapter==='psa.137'&&entry.speaker==='에돔 자손');
 assert.match(exiles.ref,/오바댜/);assert.match(exiles.detail,/직접 발언은 아니며/);
});

test('잠언의 31장 관계 후보는 모두 본문 맥락의 양방향 대화로 연결하고 동물을 인물로 노출하지 않는다',()=>{
 const proverbs=PAIR_DIALOGUE.filter(entry=>entry.chapter.startsWith('pro.'));
 const summary=JSON.parse(fs.readFileSync('data/summary/pro.json'));
 const context=buildChapterDialogue(Object.entries(summary.chapters).map(([chap,data])=>({code:'pro',name:'잠언',chap:Number(chap),data})));
 assert.equal(proverbs.length,56);assert.equal(context.relations.length,56);
 for(const entry of proverbs){
  const names=summary.chapters[Number(entry.chapter.split('.')[1])].people.map(person=>person.name);
  assert.ok(names.includes(entry.speaker),`${entry.id} 화자가 장 인물 색인에 있음`);
  assert.ok(names.includes(entry.target),`${entry.id} 상대가 장 인물 색인에 있음`);
  assert.ok(entry.detail);assert.ok(entry.lines.every(line=>line.length<=100));
 }
 for(const relation of context.relations){
  assert.ok(proverbs.some(entry=>entry.chapter===`pro.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.target===relation.from.name&&entry.speaker===relation.to.name))));
 }
 assert.ok(!summary.chapters[6].people.some(person=>person.name==='개미'));
 assert.ok(!summary.chapters[30].people.some(person=>person.name==='개미와 메뚜기'));
 const proverb7=proverbs.find(entry=>entry.id==='pair-pro-7-seductress-young-man');
 assert.match(proverb7.lines[0],/화목제를 드리고 서원을 갚았/);assert.match(proverb7.replyLines[0],/생명이 위험/);
});

test('전도서의 관계선 18개는 왕·억압받는 이·지혜자·청년의 상황을 반영한 대화로 잇는다',()=>{
 const entries=PAIR_DIALOGUE.filter(entry=>entry.chapter.startsWith('ecc.'));
 const summary=JSON.parse(fs.readFileSync('data/summary/ecc.json'));
 const context=buildChapterDialogue(Object.entries(summary.chapters).map(([chap,data])=>({code:'ecc',name:'전도서',chap:Number(chap),data})));
 assert.equal(entries.length,18);assert.equal(context.relations.length,18);
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`ecc.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.target===relation.from.name&&entry.speaker===relation.to.name))));
 }
 const youngKing=entries.find(entry=>entry.id==='pair-ecc-4-youth-old-king');
 assert.match(youngKing.lines[0],/충고를 듣/);assert.match(youngKing.replyLines[0],/충고를 거부/);
 const shepherd=entries.find(entry=>entry.id==='pair-ecc-12-shepherd-preacher');
 assert.match(shepherd.detail,/신학적 재구성/);
});

test('아가의 8장 관계 후보 23개는 연인·가족·합창대의 서로 응답하는 노래로 연결한다',()=>{
 const entries=PAIR_DIALOGUE.filter(entry=>entry.chapter.startsWith('sng.'));
 const summary=JSON.parse(fs.readFileSync('data/summary/sng.json'));
 const context=buildChapterDialogue(Object.entries(summary.chapters).map(([chap,data])=>({code:'sng',name:'아가',chap:Number(chap),data})));
 assert.equal(entries.length,21);assert.equal(context.relations.length,23);
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`sng.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.target===relation.from.name&&entry.speaker===relation.to.name))));
 }
 for(const entry of entries){
  assert.ok(entry.detail);assert.match(entry.detail,/재구성|극화|노래/);
  const people=summary.chapters[Number(entry.chapter.split('.')[1])].people.map(person=>person.name);
  assert.ok(people.includes(entry.speaker));assert.ok(people.includes(entry.target));
 }
 const brothers=entries.find(entry=>entry.id==='pair-sng-8-brothers-sister');
 assert.match(brothers.lines[0],/어린 누이/);assert.match(brothers.replyLines[0],/굳게 서/);
});

test('이사야 36–39장의 히스기야 위기 대화는 위협·전달·기도·책망 순서에 맞는다',()=>{
 const entries=PAIR_DIALOGUE.filter(entry=>entry.chapter.startsWith('isa.'));
 const summary=JSON.parse(fs.readFileSync('data/summary/isa.json'));
 const context=buildChapterDialogue(Object.entries(summary.chapters).map(([chap,data])=>({code:'isa',name:'이사야',chap:Number(chap),data})));
 const covered=context.relations.filter(relation=>[36,37,38,39].includes(relation.from.chap));
 const passageEntries=entries.filter(entry=>/^isa\.(36|37|38|39)$/.test(entry.chapter));
 assert.equal(covered.length,12);assert.equal(passageEntries.length,11);
 for(const relation of covered){
  assert.ok(passageEntries.some(entry=>entry.chapter===`isa.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.target===relation.from.name&&entry.speaker===relation.to.name))));
 }
 assert.ok(!summary.chapters[37].rels.some(relation=>relation.from==='여호와의 사자'&&relation.to==='산헤립'));
 assert.ok(!summary.chapters[39].people.some(person=>person.name==='히스기야의 자손'));
 const letter=passageEntries.find(entry=>entry.id==='pair-isa-36-sennacherib-hezekiah');
 assert.match(letter.detail,/직접 주고받은 말로 기록된 것은 아닙니다/);
 const rebuke=passageEntries.find(entry=>entry.id==='pair-isa-39-isaiah-hezekiah');
 assert.match(rebuke.replyLines[0],/모든 것을 보았습니다/);
});

test('이사야 1–66장의 관계 대화는 해당 장의 인물과 본문 관계선에 붙어 있다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/isa.json'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'isa',name:'이사야',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 const entries=PAIR_DIALOGUE.filter(entry=>entry.chapter.startsWith('isa.'));
 assert.equal(entries.length,80);
 assert.equal(context.relations.length,81);
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`isa.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 }
 for(const entry of entries){
  const chapter=Number(entry.chapter.slice(4));
  const names=context.people.filter(person=>person.chap===chapter).map(person=>person.name);
  assert.ok(names.includes(entry.speaker)&&names.includes(entry.target),entry.id);
  assert.match(entry.ref,/이사야 \d+/);assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);
 }
 assert.equal(entries.filter(entry=>Number(entry.chapter.slice(4))<=10).length,16);
 assert.equal(entries.filter(entry=>Number(entry.chapter.slice(4))>=11&&Number(entry.chapter.slice(4))<=20).length,15);
 assert.equal(entries.filter(entry=>Number(entry.chapter.slice(4))>=21&&Number(entry.chapter.slice(4))<=35).length,9);
 assert.equal(entries.filter(entry=>Number(entry.chapter.slice(4))>=36&&Number(entry.chapter.slice(4))<=39).length,11);
 assert.equal(entries.filter(entry=>Number(entry.chapter.slice(4))>=40&&Number(entry.chapter.slice(4))<=55).length,18);
 assert.equal(entries.filter(entry=>Number(entry.chapter.slice(4))>=56).length,11);
 assert.equal(entries.some(entry=>entry.speaker==='하나님'||entry.target==='하나님'),false,'인물 상호작용에서 제외된 하나님 단독 관계선은 짝 대사로 넣지 않는다');
 for(const chapter of [4,7,8,9])assert.equal(summary.chapters[chapter].rels.some(relation=>['여호와의 싹','르말리야','마헬살랄하스바스','한 아기'].includes(relation.from)||['여호와의 싹','르말리야','마헬살랄하스바스','한 아기'].includes(relation.to)),false);
});

test('예레미야 1–12장의 인간 관계선은 본문 상황에 맞는 왕복 대사로 연결하고 우상은 인물에서 제외한다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/jer.json'));
 const chapters=Object.entries(summary.chapters).slice(0,12).map(([chap,data])=>({code:'jer',name:'예레미야',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 const entries=PAIR_DIALOGUE.filter(entry=>/^jer\.(?:[1-9]|1[01]|12)$/.test(entry.chapter));
 assert.equal(context.relations.length,17);
 assert.equal(entries.length,17);
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`jer.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 }
 for(const entry of entries){
  const chapter=Number(entry.chapter.slice(4));
  const names=context.people.filter(person=>person.chap===chapter).map(person=>person.name);
  assert.ok(names.includes(entry.speaker)&&names.includes(entry.target),entry.id);
  assert.match(entry.ref,/예레미야 \d+/);assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);
 }
 assert.equal(summary.chapters[7].people.some(person=>person.name==='하늘 여왕'),false);
 assert.equal(summary.chapters[7].rels.some(relation=>relation.from==='하늘 여왕'||relation.to==='하늘 여왕'),false);
 assert.match(entries.find(entry=>entry.id==='pair-jer-11-anathoth-jeremiah').detail,/위협/);
 assert.match(entries.find(entry=>entry.id==='pair-jer-12-family-jeremiah').detail,/기록되지 않습니다/);
});

test('예레미야 13–25장의 심판 경고·왕실·박해 장면은 인물 관계선에 맞게 주고받고 시대 대비는 창작임을 밝힌다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/jer.json'));
 const chapters=Object.entries(summary.chapters).slice(12,25).map(([chap,data])=>({code:'jer',name:'예레미야',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 const entries=PAIR_DIALOGUE.filter(entry=>/^jer\.(?:1[3-9]|2[0-5])$/.test(entry.chapter));
 assert.equal(context.relations.length,17);
 assert.equal(entries.length,16,'예레미야 20장의 같은 쌍을 향한 상반된 두 관계선을 한 대화로 다룬다');
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`jer.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 }
 for(const entry of entries){
  const chapter=Number(entry.chapter.slice(4));
  const names=context.people.filter(person=>person.chap===chapter).map(person=>person.name);
  assert.ok(names.includes(entry.speaker)&&names.includes(entry.target),entry.id);
  assert.match(entry.ref,/예레미야 \d+/);assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);
 }
 assert.match(entries.find(entry=>entry.id==='pair-jer-22-jehoiakim-josiah').detail,/같은 장면에서 대화하지 않으므로/);
 assert.match(entries.find(entry=>entry.id==='pair-jer-20-friends-jeremiah').detail,/직접 대화는 기록되지 않아/);
});

test('예레미야 26–40장의 재판·포로 편지·두루마리·함락 장면은 모든 인간 관계선에 연결한다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/jer.json'));
 const chapters=Object.entries(summary.chapters).slice(25,40).map(([chap,data])=>({code:'jer',name:'예레미야',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 const entries=PAIR_DIALOGUE.filter(entry=>/^jer\.(?:2[6-9]|3\d|40)$/.test(entry.chapter));
 assert.equal(context.relations.length,45);
 assert.equal(entries.length,43,'같은 사건의 반대 방향 관계선은 한 왕복 대화로 묶는다');
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`jer.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 }
 for(const entry of entries){
  const chapter=Number(entry.chapter.slice(4));
  const names=context.people.filter(person=>person.chap===chapter).map(person=>person.name);
  assert.ok(names.includes(entry.speaker)&&names.includes(entry.target),entry.id);
  assert.match(entry.ref,/예레미야 \d+/);assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);
 }
 assert.equal(summary.chapters[26].people.some(person=>person.name==='사반'),false,'이 사건 장면에 등장하지 않는 사반은 월드 인물에서 뺀다');
 assert.match(entries.find(entry=>entry.id==='pair-jer-38-ebedmelech-jeremiah').lines[1],/줄과 낡은 옷/);
 assert.match(entries.find(entry=>entry.id==='pair-jer-40-johanan-gedaliah').replyLines[0],/사실이 아니오/);
});

test('예레미야 41–52장의 암살·이집트 피신·열방 심판·포로 귀환을 대화로 연결하고 우상을 인물에서 뺀다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/jer.json'));
 const chapters=Object.entries(summary.chapters).slice(40,52).map(([chap,data])=>({code:'jer',name:'예레미야',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 const entries=PAIR_DIALOGUE.filter(entry=>/^jer\.(?:4[1-9]|5[0-2])$/.test(entry.chapter));
 assert.equal(context.relations.length,25);
 assert.equal(entries.length,23,'42장과 52장의 상반된 관계 방향을 각각 한 문답으로 합친다');
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`jer.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 }
 for(const entry of entries){
  const chapter=Number(entry.chapter.slice(4));
  const names=context.people.filter(person=>person.chap===chapter).map(person=>person.name);
  assert.ok(names.includes(entry.speaker)&&names.includes(entry.target),entry.id);
  assert.match(entry.ref,/예레미야 \d+/);assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);
 }
 for(const chapter of [44,48]){
  assert.equal(summary.chapters[chapter].people.some(person=>['하늘 여왕','그모스'].includes(person.name)),false);
  assert.equal(summary.chapters[chapter].rels.some(relation=>['하늘 여왕','그모스'].includes(relation.from)||['하늘 여왕','그모스'].includes(relation.to)),false);
 }
 assert.match(entries.find(entry=>entry.id==='pair-jer-42-johanan-jeremiah').detail,/불순종/);
 assert.match(entries.find(entry=>entry.id==='pair-jer-52-evilmerodach-jehoiachin').lines[1],/식탁/);
});

test('예레미야애가 1–5장의 배신·조롱·박해·억압 관계를 탄식의 응답으로 잇고 부재한 조상은 조우에서 뺀다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/lam.json'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'lam',name:'예레미야애가',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 const entries=PAIR_DIALOGUE.filter(entry=>entry.chapter.startsWith('lam.'));
 assert.equal(context.relations.length,8);assert.equal(entries.length,8);
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`lam.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 }
 for(const entry of entries){
  const chapter=Number(entry.chapter.slice(4));const names=context.people.filter(person=>person.chap===chapter).map(person=>person.name);
  assert.ok(names.includes(entry.speaker)&&names.includes(entry.target),entry.id);assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);
 }
 assert.equal(summary.chapters[5].people.some(person=>person.name==='조상들'),false);
 assert.equal(summary.chapters[5].rels.some(relation=>relation.from==='조상들'||relation.to==='조상들'),false);
});

test('에스겔 1–12장은 포로 예언자의 표징·환상·파수꾼 사명을 관계 대사로 연결하고 장면 밖 가족은 뺀다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/ezk.json'));
 const chapters=Object.entries(summary.chapters).slice(0,12).map(([chap,data])=>({code:'ezk',name:'에스겔',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 const entries=PAIR_DIALOGUE.filter(entry=>/^ezk\.(?:[1-9]|1[0-2])$/.test(entry.chapter));
 assert.equal(context.relations.length,8);assert.equal(entries.length,8);
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`ezk.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 }
 for(const entry of entries){
  const chapter=Number(entry.chapter.slice(4));const names=context.people.filter(person=>person.chap===chapter).map(person=>person.name);
  assert.ok(names.includes(entry.speaker)&&names.includes(entry.target),entry.id);assert.match(entry.ref,/에스겔 \d+/);assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);
 }
 assert.equal(summary.chapters[1].people.some(person=>person.name==='부시'),false);
 assert.equal(summary.chapters[1].rels.some(relation=>relation.from==='부시'||relation.to==='부시'),false);
 assert.match(entries.find(entry=>entry.id==='pair-ezk-9-scribe-mourners').detail,/환상 속/);
});

test('에스겔 13–25장의 거짓 예언·왕실 맹세·세대 비유·열방 심판 관계를 본문 장면에 맞춘다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/ezk.json'));
 const chapters=Object.entries(summary.chapters).slice(12,25).map(([chap,data])=>({code:'ezk',name:'에스겔',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 const entries=PAIR_DIALOGUE.filter(entry=>/^ezk\.(?:1[3-9]|2[0-5])$/.test(entry.chapter));
 assert.equal(context.relations.length,25);assert.equal(entries.length,25);
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`ezk.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 }
 for(const entry of entries){
  const chapter=Number(entry.chapter.slice(4));const names=context.people.filter(person=>person.chap===chapter).map(person=>person.name);
  assert.ok(names.includes(entry.speaker)&&names.includes(entry.target),entry.id);assert.match(entry.ref,/에스겔 \d+/);assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);
 }
 assert.match(entries.find(entry=>entry.id==='pair-ezk-23-sisters').detail,/비유/);
 assert.match(entries.find(entry=>entry.id==='pair-ezk-24-wife-ezekiel').detail,/아내의 발언이 없습니다/);
 assert.equal(summary.chapters[19].rels.some(relation=>relation.from.includes('사자 새끼')),false,'비유 속 사자 가족은 동물 간 대화선으로 만들지 않는다');
});

test('에스겔 26–48장의 인간 관계선은 본문 사건에 맞는 양방향 대사를 갖고 상징물은 조우 대상에서 제외한다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/ezk.json'));
 const chapters=Object.entries(summary.chapters).slice(25).map(([chap,data])=>({code:'ezk',name:'에스겔',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 const entries=PAIR_DIALOGUE.filter(entry=>/^ezk\.(?:2[6-9]|3\d|4[0-8])$/.test(entry.chapter));
 assert.equal(chapters.length,23);assert.equal(context.relations.length,30);assert.equal(entries.length,30);
 for(const relation of context.relations){
  assert.ok(entries.some(entry=>entry.chapter===`ezk.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 }
 for(const entry of entries){assert.ok(entry.detail,entry.id);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);assert.match(entry.ref,/에스겔 \d+/);}
 assert.equal(summary.chapters[34].rels.some(relation=>relation.from==='살진 양'),false,'비유 속 양은 대화 상대가 아님');
 assert.equal(summary.chapters[37].rels.some(relation=>relation.to==='마른 뼈들'),false,'환상 속 뼈와 생기는 인물 조우가 아님');
 for(const chapter of [34,37])assert.ok(summary.chapters[chapter].people.every(person=>!['양 떼','살진 양','마른 뼈들','생기'].includes(person.name)),'비인간 상징은 인물 NPC 목록에서 제외');
 assert.match(entries.find(entry=>entry.id==='pair-ezk-37-david-tribes').detail,/실제 동시대 조우는 아닙니다/);
});

test('다니엘 1–12장의 유효한 관계 35개는 포로 궁정·풀무불·사자 굴·환상에 맞는 왕복 대사를 갖는다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/dan.json'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'dan',name:'다니엘',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters),entries=PAIR_DIALOGUE.filter(entry=>/^dan\.\d+$/.test(entry.chapter));
 assert.equal(chapters.length,12);assert.equal(context.relations.length,35);assert.equal(entries.length,35);
 for(const relation of context.relations){assert.ok(entries.some(entry=>entry.chapter===`dan.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);}
 for(const entry of entries){const chapter=Number(entry.chapter.slice(4)),names=context.people.filter(person=>person.chap===chapter).map(person=>person.name);assert.ok(names.includes(entry.speaker)&&names.includes(entry.target),entry.id);assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);assert.match(entry.ref,/다니엘 \d+/);}
 assert.equal(summary.chapters[1].rels.some(relation=>relation.to==='여호야김'),false,'현장에 없는 예루살렘 왕은 왕궁 장면에서 제외');
 assert.equal(summary.chapters[7].rels.some(relation=>['옛적부터 항상 계신 이','작은 뿔'].includes(relation.from)||relation.to==='네 짐승'),false,'환상의 상징 동물과 표상은 NPC 조우선에서 제외');
 assert.match(entries.find(entry=>entry.id==='pair-dan-3-nebuchadnezzar-shadrach').replyLines[0],/답할 필요/);
 assert.match(entries.find(entry=>entry.id==='pair-dan-6-darius-daniel').replyLines[0],/천사/);
});

test('호세아의 가족·정치 관계 9개는 표징 결혼·경고·돌아옴을 구분하고 우상은 인물 조우에서 뺀다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/hos.json'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'hos',name:'호세아',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters),entries=PAIR_DIALOGUE.filter(entry=>/^hos\.\d+$/.test(entry.chapter));
 assert.equal(chapters.length,14);assert.equal(context.relations.length,9);assert.equal(entries.length,9);
 for(const relation of context.relations){assert.ok(entries.some(entry=>entry.chapter===`hos.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);}
 for(const entry of entries){const chapter=Number(entry.chapter.slice(4)),names=context.people.filter(person=>person.chap===chapter).map(person=>person.name);assert.ok(names.includes(entry.speaker)&&names.includes(entry.target),entry.id);assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);assert.match(entry.ref,/호세아 \d+/);}
 for(const chapter of [2,8,9,10,11])assert.ok(summary.chapters[chapter].people.every(person=>!['바알','사마리아의 송아지','벧아웬의 송아지'].includes(person.name)),'우상과 송아지 형상은 사람 NPC가 아님');
 assert.equal(summary.chapters[1].rels.some(relation=>['이스르엘','로루하마','로암미'].includes(relation.from)),false,'어린 자녀가 성인 대사를 말하지 않게 함');
 assert.equal(summary.chapters[12].people.some(person=>['야곱','에서','천사'].includes(person.name)),false,'과거 조상과 천사의 회상을 현재 조우로 만들지 않음');
 assert.match(entries.find(entry=>entry.id==='pair-hos-3-israel-david').detail,/실제 동시대 조우가 아닌/);
});

test('요엘의 3장면은 재앙의 호출·회개 권면·열국 심판을 구분하고 메뚜기 떼를 대화 인물에서 제외한다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/jol.json'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'jol',name:'요엘',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters),entries=PAIR_DIALOGUE.filter(entry=>/^jol\.\d+$/.test(entry.chapter));
 assert.equal(chapters.length,3);assert.equal(context.relations.length,3);assert.equal(entries.length,3);
 for(const relation of context.relations)assert.ok(entries.some(entry=>entry.chapter===`jol.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 for(const chapter of [1,2])assert.ok(summary.chapters[chapter].people.every(person=>!['메뚜기 떼','큰 군대'].includes(person.name)),'재앙과 상징 군대는 NPC가 아님');
 for(const entry of entries)assert.ok(entry.detail&&entry.lines.length===2&&entry.replyLines.length===2);
});


test('오바댜의 에돔·야곱 형제 배신 관계는 하나의 양방향 대화이며 에돔을 개인 에서와 구분한다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/oba.json'));
 const data=summary.chapters['1'];
 const context=buildChapterDialogue([{code:'oba',name:'오바댜',chap:1,data}]);
 const entries=PAIR_DIALOGUE.filter(entry=>entry.chapter==='oba.1');
 assert.equal(context.relations.length,1);assert.equal(entries.length,1);
 assert.equal(context.relations[0].from.name,'에돔');assert.equal(context.relations[0].to.name,'야곱 족속');
 const lines=relationshipLines(context.relations[0].from,context.relations[0].to,context.relations[0],null,{random:()=>0});
 assert.match(lines[0].text,/형제.*환난/);assert.match(lines[1].text,/형제.*쓰러질/);
 assert.match(entries[0].detail,/직접 대화가 아니라/);
 assert.equal(data.people.some(person=>person.name==='에돔(에서)'),false);
});

test('아모스의 사회 책망·예언자 대면·열국 심판 관계 11개를 대화로 잇고 비유 동물을 사람과 구분한다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/amo.json'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'amo',name:'아모스',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters),entries=PAIR_DIALOGUE.filter(entry=>/^amo\.\d+$/.test(entry.chapter));
 assert.equal(chapters.length,9);assert.equal(context.relations.length,11);assert.equal(entries.length,11);
 for(const relation of context.relations)assert.ok(entries.some(entry=>entry.chapter===`amo.${relation.from.chap}`&&((entry.speaker===relation.from.name&&entry.target===relation.to.name)||(entry.speaker===relation.to.name&&entry.target===relation.from.name))),`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
 for(const entry of entries){assert.ok(entry.detail);assert.equal(entry.lines.length,2);assert.equal(entry.replyLines.length,2);assert.match(entry.ref,/아모스 \d+/);}
 assert.ok(summary.chapters[4].people.some(person=>person.name==='사마리아의 부유한 여인들'));
 assert.equal(summary.chapters[4].people.some(person=>person.name==='바산의 암소들'),false,'비유 표현을 동물 NPC 이름으로 쓰지 않는다');
 assert.equal(summary.chapters[7].rels.some(relation=>relation.to==='여로보암'),false,'왕에게 전달된 보고를 현장 조우로 만들지 않는다');
 assert.match(entries.find(entry=>entry.id==='pair-amo-7-amaziah-amos').ref,/7:10–17/);
});

test('에스라의 모든 인간 관계선은 양방향 특수 대화 대상이고 핵심 사건은 본문 대사로 연결된다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/ezr.json'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'ezr',name:'에스라',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 const humanRelations=context.relations.filter(r=>r.from.name!=='하나님'&&r.to.name!=='하나님');
 assert.equal(humanRelations.length,44,'본문 관계선과 대사 데이터가 추가로 보장하는 인간 관계선 수');
 for(const relation of humanRelations){
  const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});
  assert.equal(lines.length,2,`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
  assert.notEqual(lines[0].origin,'general');assert.notEqual(lines[1].origin,'general');
  assert.ok(lines.every(line=>line.ref),`${relation.ref} reference available`);
 }
 const cases=[['ezr.1','고레스','유다와 베냐민 족장들',/성전을 세우도록/,/예루살렘으로 돌아가게/],['ezr.3','예수아','스룹바벨',/제단을 세우고/,/예배/],['ezr.5','닷드내','유다 장로들',/누가 이 성전을/,/하늘과 땅의 하나님/],['ezr.6','다리오','닷드내',/조서를 찾아냈소/,/왕의 조서대로/],['ezr.7','에스라','아닥사스다',/율법을 가르치고/,/에스라여, 너는 가라/],['ezr.8','에스라','잇도',/레위 사람들을 보내/,/세레뱌/],['ezr.10','스가냐','에스라',/아직 소망/,/기도하고 있습니다/]];
 for(const [chapter,speaker,target,first,reply] of cases){
  const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);
  assert.ok(entry,`${chapter} ${speaker} → ${target}`);assert.match(entry.lines[0],first);assert.match(entry.replyLines[0],reply);
 }
 const decree=PAIR_DIALOGUE.find(entry=>entry.id==='pair-250');assert.match(decree.detail,/왕에게 직접 답한 말을 기록하지 않습니다/);
 const request=PAIR_DIALOGUE.find(entry=>entry.id==='pair-251');assert.match(request.detail,/사람을 통한 요청과 응답/);
 const objection=PAIR_DIALOGUE.find(entry=>entry.id==='pair-253');assert.match(objection.detail,/반대자들이 이유를 말한 문장을 싣지 않아/);
});

test('느헤미야의 인간 관계선은 모두 대화 대상으로 이어지고 형제·개혁·성벽 사건의 상대 응답을 확인한다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/neh.json'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'neh',name:'느헤미야',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);
 assert.equal(context.relations.length,52);
 for(const relation of context.relations){
  const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});
  assert.equal(lines.length,2,`${relation.ref} ${relation.from.name} ↔ ${relation.to.name}`);
  assert.ok(lines.every(line=>line.text&&!/어색|안녕하세요/.test(line.text)));
 }
 const cases=[['neh.1','하나니','느헤미야',/예루살렘에 남은 사람들/,/울며/],['neh.2','느헤미야','아닥사스다',/성읍을 다시 세우게/,/필요한 조서/],['neh.5','가난한 백성','느헤미야',/밭과 포도원을 저당/,/이자를 받는 일을 그치고/],['neh.8','에스라','모든 백성',/율법책을 읽겠습니다/,/말씀을 듣고/],['neh.13','엘리아십','도비야',/방을 마련/,/성전 곳간을 비우고/]];
 for(const [chapter,speaker,target,first,reply] of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} → ${target}`);assert.match(entry.lines[0],first);assert.match(entry.replyLines[0],reply);}
 const report=PAIR_DIALOGUE.find(entry=>entry.id==='pair-254');assert.match(report.detail,/하나니에게 답한 말이 아니라 하나님께 드린 기도/);
 const reading=PAIR_DIALOGUE.find(entry=>entry.id==='pair-261');assert.match(reading.detail,/권면은 에스라의 말이 아니라/);
 const nobles=PAIR_DIALOGUE.find(entry=>entry.id==='pair-258');assert.match(nobles.detail,/귀족들에게 한 조치/);
 const elders=PAIR_DIALOGUE.find(entry=>entry.id==='pair-265');assert.match(elders.detail,/두 사람이 나눈 대화를 싣지 않으므로/);
});

test('에스더와 모르드개는 하닥을 통한 두려움·결단의 문답으로 이어진다',()=>{
 const summary=JSON.parse(fs.readFileSync('data/summary/est.json'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'est',name:'에스더',chap:Number(chap),data}));
 const context=buildChapterDialogue(chapters);assert.equal(context.relations.length,47);
 for(const relation of context.relations){const lines=relationshipLines(relation.from,relation.to,relation,null,{random:()=>0});assert.equal(lines.length,2);assert.ok(lines.every(line=>line.ref));}
 const esther=PAIR_DIALOGUE.find(entry=>entry.id==='pair-41'),mordecai=PAIR_DIALOGUE.find(entry=>entry.id==='pair-42');
 assert.match(esther.lines[0],/부름 없이 왕께 나아가면 죽을 수 있어/);assert.match(esther.lines[1],/죽으면 죽으리라/);
 assert.match(mordecai.lines[1],/이때를 위해 왕후/);assert.match(esther.detail,/하닥을 통해/);assert.match(mordecai.detail,/직접 대면이 아니라 전령을 통한 대화/);
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
 const cases=[['jdg.3','에훗','에글론',/비밀한 말씀/,/모두 내 앞에서 물러가라/],['jdg.4','드보라','바락',/다볼 산/,/함께 가면 가겠습니다/],['jdg.4','야엘','시스라',/장막|이리로/,/물을 조금 주시오/],['jdg.11','입다의 딸','입다',/아버지|서원/,/내 딸아/],['jdg.12','에브라임 사람들','입다',/우리를 부르지/,/불렀지만/],['jdg.14','삼손','딤나 여인',/수수께끼의 답/,/당신은 나를 미워/],['jdg.16','들릴라','삼손',/큰 힘|힘의 비밀/,/활줄|머리털/],['jdg.17','레위 소년','미가',/머물 곳/,/제사장/],['jdg.19','노인','레위인',/어디서 왔고/,/에브라임 산지/],['jdg.20','이스라엘 자손','베냐민 지파',/넘겨/,/넘기지 않겠다|싸우겠다/]];
 for(const [chapter,speaker,target,first,reply]of cases){const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry,`${chapter} ${speaker} → ${target}`);assert.match(entry.lines[0],first);assert.match(entry.replyLines[0],reply);}
});

test('사사기 입다의 딸·마노아의 아내 응답을 본문에 맞추고 집단 대사를 창작으로 표시한다',()=>{
 const daughter=PAIR_DIALOGUE.find(entry=>entry.chapter==='jdg.11'&&entry.speaker==='입다의 딸');
 assert.ok(daughter);assert.doesNotMatch(daughter.lines[0],/기뻐합니다/);assert.match(daughter.lines[0],/서원/);
 const wife=PAIR_DIALOGUE.find(entry=>entry.chapter==='jdg.13'&&entry.speaker==='마노아의 아내');
 assert.ok(wife);assert.match(wife.replyLines[0],/여호와께 다시 여쭈어야/);assert.match(wife.detail,/아내에게 한 말이 아니므로/);
 const assembly=PAIR_DIALOGUE.find(entry=>entry.chapter==='jdg.20'&&entry.speaker==='레위인');
 const benjamin=PAIR_DIALOGUE.find(entry=>entry.chapter==='jdg.20'&&entry.target==='베냐민 지파');
 assert.match(assembly.detail,/창작 재구성/);assert.match(benjamin.detail,/창작 재구성/);
 assert.ok(benjamin.replyLines.every(line=>/베냐민 지파는 각 성읍에서 모여/.test(line)===false),'서술문을 인물의 직접 대사로 내보내지 않는다');
});

test('룻기의 발화 행은 중복 화자를 정리하고 각 문장을 본문 절에 연결한다',()=>{
 const rows=HISTORY_DIALOGUE_ROWS.filter(row=>row[0]==='rut');
 assert.equal(rows.length,5);
 assert.ok(rows.every(row=>Array.isArray(row[7])&&row[7].length===row[4].length));
 for(const [chapter,speaker,target,ref]of [['rut.3','나오미','룻',/3:1–6/],['rut.4','보아스','아무개',/4:3–10/]]){
  const entry=PAIR_DIALOGUE.find(item=>item.chapter===chapter&&item.speaker===speaker&&item.target===target);assert.ok(entry);assert.match(entry.ref,ref);assert.equal(entry.replyLines.length,2);
 }
 const vow=PAIR_DIALOGUE.find(item=>item.chapter==='rut.1'&&item.speaker==='룻'&&item.target==='나오미');
 assert.match(vow.detail,/나오미의 답을 기록하지 않아/);
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
 assert.equal(lines[0].pairLines.length,2);assert.match(lines[0].pairLines[0].text,/맡은 몫|부탁할 일|형편/);
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
 assert.match(source,/관련 구절 보기/);assert.doesNotMatch(source,/관련\s*\$\{?\w*verse\w*\}?\s*절/);
});

test('수사 숫자와 지시어 이 일을 구별해 관계 대사의 조사를 지킨다',()=>{
 const a={name:'인물A'},b={name:'인물B'};
 const relation={from:{...a,code:'gen',chap:1},to:b,kind:'conflict',label:'갈등',text:'두 사람이 맞섰다.',ref:'창세기 1:1'};
 const line=relationshipLines(a,b,relation,null,{random:()=>.8})[0].text;
 assert.match(line,/그러나 이 일을 덮지도/);assert.doesNotMatch(line,/\d+일을 덮지도/);
});
