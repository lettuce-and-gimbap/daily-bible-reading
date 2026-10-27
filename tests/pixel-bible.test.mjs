import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildWorldModel, findPath, clientToCanvasPoint, touchSlopPixels, initialWorldRange } from '../js/features/pixel-bible/world.js';
import {speechView,BUBBLE_LIMIT,objectContextSpeech} from '../js/features/pixel-bible/speech-view.js';
import {scopeChapterSummary} from '../js/features/pixel-bible/qt-scope.js';
import {scenesForChapters} from '../js/features/pixel-bible/scenes.js';
import {isMentionOnlyPerson,mentionOnlyChapterNames} from '../js/features/pixel-bible/mention-only.js';

test('픽셀바이블의 표기 범위는 현재 월드 장을 기본값으로 보여준다',()=>{
 assert.deepEqual(initialWorldRange([{code:'2ki',chap:18}]),{code:'2ki',start:18,end:18});
 assert.deepEqual(initialWorldRange([{code:'psa',chap:47},{code:'psa',chap:48},{code:'psa',chap:49}]),{code:'psa',start:47,end:49});
 assert.deepEqual(initialWorldRange([{code:'2ki',chap:18}],{code:'psa',start:57,end:61}),{code:'psa',start:57,end:61});
});

test('열왕기하 17–21장의 언급 인물 모세는 현장 캐릭터로 나오지 않고 김밥은 한 명만 합류한다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/2ki.json',import.meta.url),'utf8'));
 const eventBook=JSON.parse(fs.readFileSync(new URL('../data/pixel-bible/events/2ki.json',import.meta.url),'utf8'));
 const chapters=[];
 for(let chap=17;chap<=21;chap++){
  const base=summary.chapters[chap],extra=eventBook.additionalPeople?.[String(chap)]||[];
  const names=new Set((base.people||[]).map(p=>p.name));
  chapters.push({code:'2ki',name:'열왕기하',chap,data:{...base,people:[...(base.people||[]),...extra.filter(p=>!names.has(p.name))]}});
 }
 const model=buildWorldModel(chapters);
 assert.equal(model.cast.filter(p=>p.name==='모세').length,0,'모세는 왕하 18:4, 6, 12와 21:8에서 언급될 뿐 해당 장면의 현장 인물이 아니다');
 assert.equal(model.cast.filter(p=>p.name==='김밥').length,1);
 assert.equal(model.cast.filter(p=>p.name==='상추').length,1);
 assert.equal(model.cast.filter(p=>p.name==='카라멜팝콘').length,1);
 assert.ok(model.cast.filter(p=>['김밥','상추','카라멜팝콘'].includes(p.name)).every(p=>p.worldMascot&&p.identity.status==='creative-mascot'));
 assert.equal(model.cast.filter(p=>p.name==='엘리아김(힐기야의 아들)').length,1,'반복 출현하는 엘리아김도 월드에 한 명만 둔다');
 assert.match(summary.chapters[18].story,/모세/,'역사적 언급은 본문 설명에서 유지한다');
});

test('열왕기하에서 요람 표기를 통합하고 그달리야를 찾아온 지휘관은 현장에 둔다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/2ki.json',import.meta.url),'utf8'));
 const chapters=[1,3,8,9].map(chap=>({code:'2ki',name:'열왕기하',chap,data:summary.chapters[chap]}));
 const model=buildWorldModel(chapters);
 assert.equal(model.cast.filter(p=>p.name==='요람(아합의 아들)').length,1);
 assert.equal(model.cast.some(p=>p.name==='여호람(아합의 아들)'),false);
 const end=buildWorldModel([{code:'2ki',name:'열왕기하',chap:25,data:summary.chapters[25]}]);
 assert.ok(end.cast.some(p=>p.name==='요하난'));
 assert.ok(end.cast.some(p=>p.name==='야아사니야'));
});

test('창세기에서 개명 전후의 아브람·아브라함과 사래·사라는 각각 한 인물로 통합한다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/gen.json',import.meta.url),'utf8'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'gen',name:'창세기',chap:Number(chap),data}));
 const model=buildWorldModel(chapters);
 const abraham=model.cast.filter(p=>p.identity?.id==='person:아브라함');
 const sarah=model.cast.filter(p=>p.identity?.id==='person:사라');
 assert.equal(abraham.length,1);
 assert.equal(sarah.length,1);
 assert.ok(abraham[0].refs.some(ref=>ref==='창세기 12장'));
 assert.ok(abraham[0].refs.some(ref=>ref==='창세기 17장'));
 assert.ok(sarah[0].refs.some(ref=>ref==='창세기 16장'));
 assert.ok(sarah[0].refs.some(ref=>ref==='창세기 18장'));
 assert.equal(abraham[0].name,'아브라함');
 assert.equal(sarah[0].name,'사라');
 assert.ok(model.relations.some(r=>r.from==='사라'&&r.to==='아브라함'&&r.label==='아내'),'개명 전 부부 관계도 통합 인물 이름으로 이어진다');
 assert.ok(model.relations.some(r=>r.from==='하나님'&&r.to==='아브라함'&&r.sourceRef==='창세기 12장'),'개명 뒤에도 부르심 관계는 한 인물에 이어진다');
 assert.equal(model.cast.filter(p=>p.name.startsWith('라멕(')).length,1,'족보에만 언급된 셋 계열 라멕은 NPC로 세우지 않는다');
 assert.equal(model.cast.find(p=>p.name.startsWith('라멕(')).name,'라멕(가인 계열)');
 assert.equal(model.cast.filter(p=>p.name.startsWith('바로(')).length,2,'아브라함 시대와 요셉 시대의 서로 다른 바로를 분리한다');
 assert.ok(model.relations.some(r=>r.from==='라멕(가인 계열)'&&r.to==='가인'));
 assert.ok(model.relations.some(r=>r.from==='라멕(셋 계열)'&&r.to==='므두셀라'));
 assert.ok(model.relations.some(r=>r.from==='바로(아브라함 시대)'&&r.to==='아브라함'));
});

test('사도행전에서 박해자 사울이 된 바울은 같은 한 인물로 관계 끝점도 연결한다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'act',name:'사도행전',chap:Number(chap),data}));
 const model=buildWorldModel(chapters),paul=model.cast.filter(p=>p.identity?.id==='person:paul');
 assert.equal(paul.length,1);
 assert.equal(paul[0].name,'바울');
 assert.ok(paul[0].refs.some(ref=>ref==='사도행전 9장'));
 assert.ok(paul[0].refs.some(ref=>ref==='사도행전 13장'));
 assert.ok(model.relations.some(r=>r.from==='바울'||r.to==='바울'));
});

test('창세기에서 이름만 언급된 엘리에셀·롯·하몰은 해당 장면의 인물로 세우지 않는다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/gen.json',import.meta.url),'utf8'));
 const ch15=buildWorldModel([{code:'gen',name:'창세기',chap:15,data:summary.chapters[15]}]);
 const ch18=buildWorldModel([{code:'gen',name:'창세기',chap:18,data:summary.chapters[18]}]);
 const ch33=buildWorldModel([{code:'gen',name:'창세기',chap:33,data:summary.chapters[33]}]);
 const ch19=buildWorldModel([{code:'gen',name:'창세기',chap:19,data:summary.chapters[19]}]);
 assert.ok(!ch15.cast.some(p=>p.name==='엘리에셀'));
 assert.ok(ch15.relations.some(r=>r.from==='엘리에셀'),'관계 설명은 보존한다');
 assert.ok(!ch18.cast.some(p=>p.name==='롯'));
 assert.ok(!ch33.cast.some(p=>p.name==='하몰'));
 assert.ok(ch19.cast.some(p=>p.name==='아브라함'),'19:27에서 실제로 소돔을 바라보므로 등장시킨다');
 const ch11=buildWorldModel([{code:'gen',name:'창세기',chap:11,data:summary.chapters[11]}]);
 const ch22=buildWorldModel([{code:'gen',name:'창세기',chap:22,data:summary.chapters[22]}]);
 assert.ok(!ch11.cast.some(p=>['나홀','하란'].includes(p.name)));
 assert.ok(!ch22.cast.some(p=>p.name==='나홀'));
});

test('역대하의 과거·계보 언급 인물을 현장 캐스트에서 빼고 관계 근거는 보존한다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/2ch.json',import.meta.url),'utf8'));
 const cases={1:['다윗'],3:['다윗','오르난'],6:['다윗','이방인'],10:['아히야'],11:['마아가','마할랏'],13:['미가야(우리엘의 딸)'],21:['아합의 딸'],26:['이사야'],27:['웃시야'],29:['다윗'],36:['예레미야','요시야']};
 for(const [chapter,names] of Object.entries(cases)){
  const model=buildWorldModel([{code:'2ch',name:'역대하',chap:Number(chapter),data:summary.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name),`역대하 ${chapter}장 ${name}은 장면 현장 인물이 아니다`);
 }
 const ch3=buildWorldModel([{code:'2ch',name:'역대하',chap:3,data:summary.chapters[3]}]);
 assert.ok(ch3.relations.some(r=>r.from==='솔로몬'&&r.to==='다윗'),'과거 관계 기록은 현장 출연 여부와 별도로 유지한다');
});

test('역대하 인물의 동명이인·별칭을 통합하고 군사 연합의 구성원을 정확히 표기한다',async()=>{
 const {resolveIdentity,canonicalPersonName}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('마아가',{code:'2ch',chapter:11}).id,resolveIdentity('미가야(우리엘의 딸)',{code:'2ch',chapter:13}).id);
 assert.equal(resolveIdentity('마아가',{code:'1ki',chapter:15}).id,resolveIdentity('마아가',{code:'2ch',chapter:11}).id);
 assert.equal(resolveIdentity('아합의 딸',{code:'2ch',chapter:21}).id,resolveIdentity('아달랴',{code:'2ch',chapter:22}).id);
 assert.equal(resolveIdentity('압돈',{code:'2ch',chapter:34}).id,resolveIdentity('악볼',{code:'2ki',chapter:22}).id);
 assert.notEqual(resolveIdentity('시드기야(그나아나의 아들)',{code:'2ch',chapter:18}).id,resolveIdentity('시드기야',{code:'2ch',chapter:36}).id);
 assert.equal(resolveIdentity('예후(님시의 아들)',{code:'2ch',chapter:22}).id,resolveIdentity('예후',{code:'2ki',chapter:9}).id);
 assert.equal(resolveIdentity('여호사브앗',{code:'2ch',chapter:22}).id,resolveIdentity('여호세바',{code:'2ki',chapter:11}).id);
 assert.equal(resolveIdentity('웃시야',{code:'2ch',chapter:26}).id,resolveIdentity('아사랴',{code:'2ki',chapter:15}).id);
 assert.equal(resolveIdentity('느고',{code:'2ch',chapter:35}).id,resolveIdentity('바로 느고',{code:'2ki',chapter:23}).id);
 assert.notEqual(resolveIdentity('마할랏',{code:'2ch',chapter:11}).id,resolveIdentity('마할랏',{code:'gen',chapter:28}).id);
 assert.equal(canonicalPersonName('미가야(우리엘의 딸)',{code:'2ch',chapter:13}),'마아가');
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/2ch.json',import.meta.url),'utf8'));
 const ch20=buildWorldModel([{code:'2ch',name:'역대하',chap:20,data:summary.chapters[20]}]);
 assert.ok(ch20.cast.some(person=>person.name==='모압과 암몬 연합군'&&/마온/.test(person.role)));
 assert.ok(ch20.relations.some(r=>r.from==='모압과 암몬 연합군'&&r.to==='여호사밧'&&/마온 사람들/.test(r.note)));
});

test('출애굽기에서 르우엘과 이드로는 같은 장인이고 두 시대의 바로는 각각 분리한다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/exo.json',import.meta.url),'utf8'));
 const chapters=Object.entries(summary.chapters).map(([chap,data])=>({code:'exo',name:'출애굽기',chap:Number(chap),data}));
 const model=buildWorldModel(chapters);
 assert.equal(model.cast.filter(p=>p.identity?.id==='person:midianite-priest-jethro').length,1);
 assert.equal(model.cast.find(p=>p.identity?.id==='person:midianite-priest-jethro').name,'이드로');
 assert.ok(model.cast.find(p=>p.identity?.id==='person:midianite-priest-jethro').refs.includes('출애굽기 2장'));
 assert.ok(model.cast.find(p=>p.identity?.id==='person:midianite-priest-jethro').refs.includes('출애굽기 18장'));
 assert.equal(model.cast.filter(p=>p.name.startsWith('바로(')).length,2);
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.notEqual(resolveIdentity('바로',{code:'exo',chapter:1}).id,resolveIdentity('바로',{code:'exo',chapter:3}).id);
 assert.equal(resolveIdentity('아말렉',{code:'exo',chapter:17}).kind,'group');
 assert.equal(resolveIdentity('하나님의 사자',{code:'exo',chapter:14}).kind,'spiritual');
 assert.ok(model.relations.some(r=>r.from==='바로(출애굽 시대)'||r.to==='바로(출애굽 시대)'));
 const ch3=buildWorldModel([{code:'exo',name:'출애굽기',chap:3,data:summary.chapters[3]}]);
 const ch4=buildWorldModel([{code:'exo',name:'출애굽기',chap:4,data:summary.chapters[4]}]);
 assert.ok(!ch3.cast.some(p=>['이드로','바로(출애굽 시대)'].includes(p.name)));
 assert.ok(!ch4.cast.some(p=>p.name==='바로(출애굽 시대)'));
 assert.ok(ch4.cast.some(p=>p.name==='이드로'),'4:18에서 모세와 대화하므로 장인 이드로는 등장한다');
});

test('출애굽기 6장의 족보에만 나온 조상과 후손은 별도 장면 인물로 세우지 않는다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/exo.json',import.meta.url),'utf8'));
 const model=buildWorldModel([{code:'exo',name:'출애굽기',chap:6,data:summary.chapters[6]}]);
 for(const name of ['아므람','요게벳','엘르아살','비느하스','고라'])assert.ok(!model.cast.some(p=>p.name===name),`${name}은 족보의 인물이다`);
 assert.ok(model.cast.some(p=>p.name==='모세'));
 assert.ok(model.cast.some(p=>p.name==='아론'));
});

test('레위기 24장에서 이름만 언급된 모독자의 어머니는 현장 인물로 세우지 않는다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/lev.json',import.meta.url),'utf8'));
 const model=buildWorldModel([{code:'lev',name:'레위기',chap:24,data:summary.chapters[24]}]);
 assert.ok(!model.cast.some(p=>p.name==='슬로밋'));
 assert.ok(model.relations.some(r=>r.to==='슬로밋'),'가족 관계 설명은 남긴다');
 assert.ok(model.cast.some(p=>p.name==='모세'));
});

test('민수기 10·12장에서 관계 설명에만 나오는 르우엘과 구스 여인은 장면 인물로 세우지 않는다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/num.json',import.meta.url),'utf8'));
 const ch10=buildWorldModel([{code:'num',name:'민수기',chap:10,data:summary.chapters[10]}]);
 const ch12=buildWorldModel([{code:'num',name:'민수기',chap:12,data:summary.chapters[12]}]);
 assert.ok(!ch10.cast.some(p=>p.name==='르우엘'));
 assert.ok(ch10.relations.some(r=>r.to==='르우엘'));
 assert.ok(!ch12.cast.some(p=>p.name==='구스 여인'));
 assert.ok(ch12.cast.some(p=>p.name==='모세'));
});

test('신명기 9장에서 금송아지 사건을 회고할 뿐인 아론은 현장 캐릭터로 세우지 않는다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/deu.json',import.meta.url),'utf8'));
 const model=buildWorldModel([{code:'deu',name:'신명기',chap:9,data:summary.chapters[9]}]);
 assert.ok(!model.cast.some(p=>p.name==='아론'));
 assert.ok(model.relations.some(r=>r.from==='아론'&&r.to==='모세'),'역사적 가족 관계 설명은 보존한다');
 assert.ok(model.cast.some(p=>p.name==='모세'));
});

test('여호수아의 군대 장관은 영적 존재이며 과거 모세는 현장 배우가 아니다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/jos.json',import.meta.url),'utf8'));
 const model=buildWorldModel([12,14].map(chap=>({code:'jos',name:'여호수아',chap,data:summary.chapters[chap]})));
 assert.ok(!model.cast.some(p=>p.name==='모세'));
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('여호와의 군대 장관',{code:'jos',chapter:5}).kind,'spiritual');
});

test('벧세메스 밭 주인 여호수아는 눈의 아들 여호수아와 다른 인물이다',async()=>{
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.notEqual(resolveIdentity('여호수아(벧세메스 사람)',{code:'1sa',chapter:6}).id,resolveIdentity('여호수아',{code:'jos',chapter:1}).id);
});

test('사무엘·열왕기 인물의 겹치는 이름은 가족과 본문 표기로 분리한다',async()=>{
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.notEqual(resolveIdentity('아히멜렉',{code:'1sa',chapter:22}).id,resolveIdentity('아히멜렉',{code:'2sa',chapter:8}).id);
 assert.equal(resolveIdentity('아히멜렉',{code:'2sa',chapter:8}).id,resolveIdentity('아히멜렉',{code:'1ch',chapter:24}).id);
 assert.notEqual(resolveIdentity('엘하난',{code:'2sa',chapter:21}).id,resolveIdentity('엘하난(도도의 아들)',{code:'2sa',chapter:23}).id);
 assert.equal(resolveIdentity('요나단',{code:'1sa',chapter:20}).id,resolveIdentity('요나단',{code:'2sa',chapter:1}).id);
 assert.notEqual(resolveIdentity('요나단',{code:'2sa',chapter:21}).id,resolveIdentity('요나단(아비아달의 아들)',{code:'2sa',chapter:17}).id);
 assert.notEqual(resolveIdentity('요나단(시므아의 아들)',{code:'2sa',chapter:21}).id,resolveIdentity('요나단(야센의 아들)',{code:'2sa',chapter:23}).id);
 assert.equal(resolveIdentity('그룹',{code:'2sa',chapter:22}).kind,'spiritual');
});

test('솔로몬과 여디디야는 한 인물이며 사무엘하의 과거 인물은 현재 캐스트에서 빠진다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/2sa.json',import.meta.url),'utf8'));
 const model=buildWorldModel([{code:'2sa',name:'사무엘하',chap:12,data:summary.chapters[12]}]);
 assert.equal(model.cast.filter(p=>p.identity?.id==='person:solomon').length,1);
 assert.equal(model.cast.find(p=>p.identity?.id==='person:solomon').name,'솔로몬');
 assert.ok(!model.cast.some(p=>['우리아','비유 속 부자','비유 속 가난한 사람'].includes(p.name)));
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('솔로몬',{code:'2sa',chapter:12}).id,resolveIdentity('여디디야',{code:'2sa',chapter:12}).id);
});

test('역대기에서 달리 불린 므비보셋·이스보셋·오르난은 해당 인물로 통합한다',async()=>{
 const {resolveIdentity:r}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(r('므립바알',{code:'1ch',chapter:8}).id,r('므비보셋',{code:'2sa',chapter:9}).id);
 assert.equal(r('에스바알',{code:'1ch',chapter:8}).id,r('이스보셋',{code:'2sa',chapter:4}).id);
 assert.equal(r('오르난',{code:'1ch',chapter:21}).id,r('아라우나',{code:'2sa',chapter:24}).id);
 assert.notEqual(r('므비보셋(리스바의 아들)',{code:'2sa',chapter:21}).id,r('므비보셋',{code:'2sa',chapter:9}).id);
});

test('사사기의 여룹바알과 기드온은 한 인물이며 룻 족보 인물은 현장 배우가 아니다',async()=>{
 const jdg=JSON.parse(fs.readFileSync(new URL('../data/summary/jdg.json',import.meta.url),'utf8'));
 const samuel=JSON.parse(fs.readFileSync(new URL('../data/summary/1sa.json',import.meta.url),'utf8'));
 const model=buildWorldModel([...Object.entries(jdg.chapters).map(([chap,data])=>({code:'jdg',name:'사사기',chap:Number(chap),data})),{code:'1sa',name:'사무엘상',chap:12,data:samuel.chapters[12]}]);
 assert.equal(model.cast.filter(p=>p.name==='기드온').length,1);
 assert.ok(model.cast.find(p=>p.name==='기드온').refs.some(ref=>ref==='사사기 6장'));
 assert.ok(model.cast.find(p=>p.name==='기드온').refs.some(ref=>ref==='사사기 8장'));
 const rut=JSON.parse(fs.readFileSync(new URL('../data/summary/rut.json',import.meta.url),'utf8'));
 const ch4=buildWorldModel([{code:'rut',name:'룻기',chap:4,data:rut.chapters[4]}]);
 for(const name of ['베레스','이새','다윗'])assert.ok(!ch4.cast.some(p=>p.name===name));
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('여룹바알',{code:'1sa',chapter:12}).id,resolveIdentity('기드온',{code:'jdg',chapter:6}).id);
});

test('회상·비유에서만 언급된 인물은 월드 명단과 사건 장면 배우에서 제외한다',()=>{
 const examples=[['1co',10,'모세'],['2co',3,'모세'],['exo',13,'요셉'],['jhn',4,'야곱'],['jos',24,'요셉'],['jos',12,'모세'],['jos',14,'모세'],['jdg',8,'아비멜렉'],['jdg',9,'기드온'],['rut',1,'엘리멜렉'],['rut',1,'말론'],['rut',1,'기룐'],['rut',2,'엘리멜렉'],['rut',4,'베레스'],['rut',4,'이새'],['rut',4,'다윗'],['1sa',5,'다곤'],['1sa',5,'다곤의 제사장들'],['1sa',7,'아모리 사람들'],['1sa',12,'모세'],['1sa',12,'아론'],['1sa',12,'시스라'],['1sa',12,'여룹바알'],['1sa',12,'베단'],['1sa',12,'입다'],['1sa',12,'나하스'],['1sa',14,'기스'],['1sa',14,'아히노암'],['1sa',14,'메랍'],['1sa',14,'미갈'],['1sa',21,'골리앗'],['1sa',21,'사울'],['1sa',21,'다윗의 소년들'],['1sa',25,'사무엘'],['1sa',25,'미갈'],['1sa',25,'발디'],['1sa',27,'사울'],['1sa',29,'사울'],['2sa',1,'사울'],['2sa',1,'요나단'],['2sa',3,'암논'],['2sa',3,'압살롬'],['2sa',3,'아도니야'],['2sa',4,'므비보셋'],['2sa',4,'아브넬'],['2sa',5,'솔로몬'],['2sa',6,'사울'],['2sa',7,'다윗의 후손'],['2sa',8,'아비아달'],['2sa',8,'아히둡'],['2sa',8,'아힐룻'],['2sa',9,'요나단'],['2sa',10,'나하스'],['2sa',11,'엘리암'],['2sa',12,'우리아'],['2sa',12,'비유 속 부자'],['2sa',12,'비유 속 가난한 사람'],['2sa',13,'시므아'],['2sa',13,'달매'],['2sa',14,'압살롬의 딸'],['2sa',14,'비유 속 두 아들'],['2sa',14,'여인의 친족들'],['2sa',16,'게라'],['2sa',19,'압살롬'],['2sa',20,'압살롬'],['2sa',20,'다윗의 후궁 열 명'],['2sa',22,'사울'],['2sa',22,'다윗의 후손'],['1ch',4,'유다'],['1ch',4,'갈렙(여분네의 아들)'],['1ch',5,'르우벤'],['1ch',5,'요셉'],['1ch',5,'유다'],['1ch',6,'레위'],['1ch',6,'아론'],['1ch',6,'사독'],['1ch',6,'여호사닥'],['1ch',7,'여호수아'],['1ch',9,'사울'],['1ch',9,'요나단'],['1ch',9,'므립바알'],['1ch',9,'다윗'],['1ch',9,'사무엘'],['1ch',10,'다윗'],['1ch',17,'다윗의 아들'],['1ch',19,'나하스'],['1ch',23,'아론'],['1ch',23,'모세'],['1ch',24,'엘르아살'],['1ch',24,'이다말'],['1ch',29,'사무엘·나단·갓'],['psa',105,'아브라함'],['rom',9,'아브라함'],['luk',16,'아브라함']];
 for(const [code,chapter,name] of examples){
  assert.equal(isMentionOnlyPerson({name},{code,chapter}),true,`${code} ${chapter} ${name}`);
  const summary=JSON.parse(fs.readFileSync(new URL(`../data/summary/${code}.json`,import.meta.url),'utf8'));
  const source=JSON.parse(fs.readFileSync(new URL(`../data/pixel-bible/events/${code}.json`,import.meta.url),'utf8'));
  const base=summary.chapters[chapter];
  const people=[...(base.people||[]),...(source.additionalPeople?.[chapter]||[])];
  assert.ok(people.some(p=>p.name===name),`검토 목록의 인물 기록이 ${code} ${chapter}에 존재해야 함`);
  const eventScenes=[...(source.scenes||[]),...(source.restoredScenes||[])].filter(s=>s.chapter===chapter);
  const model=buildWorldModel([{code,name:code,chap:chapter,data:{...base,people,eventScenes}}]);
  assert.ok(!model.cast.some(p=>p.name===name),`${code} ${chapter} ${name}은 월드 출연자가 아님`);
  assert.ok(model.scenes.every(s=>!s.actors.includes(name)),`${code} ${chapter} ${name}은 장면 배우가 아님`);
  assert.ok(model.scenes.every(s=>(s.verseClips||[]).every(clip=>!clip.actors.includes(name))),`${code} ${chapter} ${name}은 절별 재생에서도 배우가 아님`);
 }
});

test('언급 전용 검토 목록은 존재하는 인물 기록만 가리킨다',()=>{
 for(const [key,names] of Object.entries(mentionOnlyChapterNames)){
  const [code,chapter]=key.split('.');
  const summary=JSON.parse(fs.readFileSync(new URL(`../data/summary/${code}.json`,import.meta.url),'utf8'));
  const recorded=summary.chapters[chapter]?.people||[];
  assert.ok(recorded.length,`${key} 검토 장이 원본 인물 DB에 있어야 함`);
  if(names.includes('*')){
   const model=buildWorldModel([{code,name:code,chap:Number(chapter),data:summary.chapters[chapter]}]);
   for(const person of recorded)assert.ok(!model.cast.some(p=>p.name===person.name),`${key} 족보 인물 ${person.name}이 현재 장면 배우로 나오면 안 됨`);
   continue;
  }
  for(const name of names)assert.ok(recorded.some(p=>p.name===name),`${key} ${name} 검토 항목이 원본 인물 DB에 있어야 함`);
 }
});

test('본문 인물 색인의 언급 표시는 별도 사건 장면 배우 목록에도 적용한다',()=>{
 const mention={name:'언급된 조상',role:'본문에 이름이 언급되는 인물 · 실제 현장 동석 여부는 구절에서 확인해요.'};
 const scene={id:'mention-check',code:'test',chapter:1,title:'과거 이야기',actors:[mention.name],object:'scroll',ref:'시험 1:1',verseNumbers:[1],lines:[],study:'설명',animation:{version:2,mode:'illustration',motif:'symbolic',lead:null,target:null,setting:'vision',effect:'symbol',emotion:'neutral',prop:'scroll',beats:[],duration:1}};
 const model=buildWorldModel([{code:'test',name:'시험',chap:1,data:{people:[mention],eventScenes:[scene]}}]);
 assert.ok(!model.cast.some(person=>person.name===mention.name));
 assert.deepEqual(model.scenes.find(item=>item.id===scene.id).actors,[]);
});

test('김밥은 16프레임으로 선명하게 구르고 음식 친구들은 고유 도안을 쓴다',async()=>{
 const {GIMBAP_FRAME_SIZE,GIMBAP_ROLL_FRAMES,gimbapRollAngle,gimbapRollSign,gimbapRollAxis,advanceGimbapRoll,rotateGimbapPixels}=await import('../js/features/pixel-bible/gimbap-art.js');
 assert.equal(GIMBAP_FRAME_SIZE,64);
 assert.equal(GIMBAP_ROLL_FRAMES,16);
 assert.ok(Math.abs(gimbapRollAngle(1)-Math.PI/8)<1e-10);
 assert.ok(Math.abs(gimbapRollAngle(8)-Math.PI)<1e-10);
 assert.deepEqual(['left','right','up','down'].map(gimbapRollSign),[-1,1,-1,1]);
 assert.deepEqual(['left','right','up','down'].map(gimbapRollAxis),['plane','plane','vertical','vertical']);
 assert.deepEqual(['left','right','up','down'].map(direction=>advanceGimbapRoll(0,.25,direction)),[-2,2,-2,2]);
 const pixels=new Uint8ClampedArray(5*5*4);pixels.set([18,52,86,255],(2*5+3)*4);
 const turned=rotateGimbapPixels({width:5,height:5,data:pixels},Math.PI/2);
 assert.deepEqual([...turned.data.slice((3*5+2)*4,(3*5+2)*4+4)],[18,52,86,255]);
 assert.ok([...turned.data].filter((_,i)=>i%4===3).every(alpha=>alpha===0||alpha===255),'회전 프레임의 픽셀 알파가 흐려지면 안 됨');
 const centerPixels=new Uint8ClampedArray(64*64*4);centerPixels.set([180,90,30,255],(36*64+32)*4);
 const centered=rotateGimbapPixels({width:64,height:64,data:centerPixels},Math.PI/4,32,36);
 assert.deepEqual([...centered.data.slice((36*64+32)*4,(36*64+32)*4+4)],[180,90,30,255],'회전 중심을 김밥의 실제 중심으로 둬 바닥 기준이 출렁이지 않게 한다');
 const mark=new Uint8ClampedArray(64*64*4);mark.set([7,111,203,255],(26*64+44)*4);
 const findMark=image=>{const points=[];for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(image.data[(y*64+x)*4]===7&&image.data[(y*64+x)*4+3]===255)points.push({x,y});return points;};
 const upTumble=findMark(rotateGimbapPixels({width:64,height:64,data:mark},-Math.PI/4,32,36,'vertical'));
 const downTumble=findMark(rotateGimbapPixels({width:64,height:64,data:mark},Math.PI/4,32,36,'vertical'));
 assert.notDeepEqual(upTumble,downTumble,'위쪽·아래쪽 굴림은 서로 반대 방향의 깊이 이동을 보여야 한다');
 const {characterStyle}=await import('../js/features/pixel-bible/art.js');
 assert.equal(characterStyle('김밥',0,'월드의 창작 길동무',[]).gimbap,true);
 assert.equal(characterStyle('상추',0,'월드의 창작 길동무',[]).foodMascot,'상추');
 assert.equal(characterStyle('카라멜팝콘',0,'월드의 창작 길동무',[]).foodMascot,'카라멜팝콘');
 const {drawFoodMascot}=await import('../js/features/pixel-bible/food-mascots.js');
 const ctx={fillStyle:'',save(){},restore(){},fillRect(){}};
 for(const name of ['상추','카라멜팝콘'])for(const direction of ['down','up','left','right'])drawFoodMascot(ctx,name,2,direction);
});

test('QT 절 범위에 맞춰 픽셀 월드의 사건·관계·인물·장면을 좁힌다',()=>{
 const data={people:[{name:'엘리야'},{name:'천사'},{name:'이세벨'}],events:[{title:'위협',verses:'1-4',text:'이세벨이 엘리야를 위협함'},{title:'돌봄',verses:'5-8',text:'천사가 엘리야에게 떡과 물을 줌'}],rels:[{from:'천사',to:'엘리야',verses:'5-8',note:'지친 엘리야를 먹임'}],story:'전체 장 이야기'};
 const scoped=scopeChapterSummary(data,[5,6,7,8]);
 assert.deepEqual(scoped.events.map(e=>e.title),['돌봄']);assert.equal(scoped.rels.length,1);
 assert.deepEqual(scoped.people.map(p=>p.name),['엘리야','천사']);assert.doesNotMatch(scoped.story,/위협|이세벨/);
 assert.equal(scenesForChapters([{code:'1ki',chap:19,data,verses:[4,5,6,7,8]}]).some(s=>s.id==='rest-elijah'),true);
 assert.equal(scenesForChapters([{code:'1ki',chap:19,data,verses:[9,10,11]}]).some(s=>s.id==='rest-elijah'),false);
});

test('물 오브젝트에는 실제로 잔을 입에 대고 마시는 동작이 포함된다',async()=>{
 const {interactionOptions,interactionPose}=await import('../js/features/pixel-bible/interaction-motion.js');
 const options=interactionOptions('water');assert.ok(options.some(([g])=>g==='drink'));assert.ok(options.some(([g])=>g==='sip'));
 const pose=interactionPose({category:'water',kind:'water',gesture:'drink',period:2.4,phase:0,variant:0},1.2);
 assert.equal(pose.gesture,'drink');assert.equal(pose.handY,16);assert.ok(pose.hand>0);
});

test('인물 모션 중에는 프레임마다 얼굴·몸 스프라이트를 바꾸지 않는다',async()=>{
 const {characterSpriteFrame}=await import('../js/features/pixel-bible/character-motion.js');
 const a=characterSpriteFrame({motionOnly:true,walkFrame:1,action:'drink',interaction:{handY:14,bodyX:2},expression:'surprised',baseExpression:'neutral'});
 const b=characterSpriteFrame({motionOnly:true,walkFrame:3,action:'fall',interaction:{headX:-1,bodyY:2},expression:'worried',baseExpression:'neutral'});
 assert.deepEqual(a,{walkFrame:1,action:'',interaction:null,expression:'neutral'});
 assert.deepEqual(b,{walkFrame:3,action:'',interaction:null,expression:'neutral'});
 const {walkingFrame,characterWalkFrame}=await import('../js/features/pixel-bible/character-motion.js');
 assert.deepEqual([0,1,2,3].map(i=>walkingFrame(i/2,true)),[0,1,2,3]);
 assert.equal(walkingFrame(2,true),0);assert.equal(walkingFrame(2,false),0);
 assert.equal(characterWalkFrame({stride:.5,moving:true}),1,'이동 중에는 동작 줄이기 설정과 관계없이 보행 프레임을 유지한다');
 assert.equal(characterWalkFrame({stride:.5,moving:true,actionPose:{sit:true}}),0,'앉거나 상호작용 중에는 걷기 프레임을 적용하지 않는다');
});

test('TV는 사랑을 싣고 부스는 수동 배치 오브젝트로 등록되고 자동 인물 방문에서 제외된다',async()=>{
 const {WORLD_OBJECTS}=await import('../js/features/pixel-bible/object-scenes.js');
 const {OBJECT_CATALOG}=await import('../js/features/pixel-bible/object-catalog.js');
 const {readFile}=await import('node:fs/promises');
 const world=await readFile(new URL('../js/features/pixel-bible/world.js',import.meta.url),'utf8');
 assert.equal(WORLD_OBJECTS['love-booth'],'TV는 사랑을 싣고');assert.ok(OBJECT_CATALOG['love-booth']);
 assert.match(world,/n\.loveBooth=stage[\s\S]{0,120}startLoveBooth\(\)/);
 assert.match(world,/o\.kind!=='love-booth'/);assert.match(world,/camera\.zoom=Math\.max\(camera\.zoom,1\.75\)/);
 assert.match(world,/if\(loveBoothSession\).*speech\.dismiss/);
});

test('인물 독백은 화자 이름을 1인칭 주어로 바꾼다',async()=>{
 const {firstPersonMonologue}=await import('../js/features/pixel-bible/personal-lines.js');
 assert.equal(firstPersonMonologue('예후','예후가 왕이 되었다.'),'내가 왕이 되었어.');
 assert.equal(firstPersonMonologue('이세벨','이세벨은 장로들을 움직이겠어.'),'나는 장로들을 움직이겠어.');
 assert.equal(firstPersonMonologue('다윗','그는 다시 길을 떠났다.'),'나는 다시 길을 떠났어.');
 assert.equal(firstPersonMonologue('여호아하스','아버지 예후의 뒤를 이어 이스라엘 왕이 되었다.'),'내 아버지의 뒤를 이어 내가 이스라엘 왕이 되었어.');
 assert.equal(firstPersonMonologue('예후','예후가 왕이 되었다.'),'내가 왕이 되었어.');
 assert.equal(firstPersonMonologue('동방 박사들','꿈에서 경고를 받은 박사들은 헤롯의 궁을 다시 찾지 않고 귀향길을 바꾸었다.'),'꿈에서 경고를 받은 우리는 헤롯의 궁을 다시 찾지 않고 귀향길을 바꾸었어.');
 assert.equal(firstPersonMonologue('이스라엘 자손','이스라엘 자손은 길을 떠났고 그들은 약속을 기억했다.'),'우리는 길을 떠났고 우리는 약속을 기억했어.');
 assert.equal(firstPersonMonologue('요한','천사가 사탄을 결박하고 순교자들이 다스리는 환상을 보았다.'),'나는 천사가 사탄을 결박하고 순교자들이 다스리는 환상을 보았어.');
 assert.equal(firstPersonMonologue('다르단','군대가 예루살렘 성벽으로 올라간다.'),'나는 군대가 예루살렘 성벽으로 올라가.');
 assert.equal(firstPersonMonologue('다르단','산헤립이 군대를 예루살렘으로 보냈다.'),'나는 산헤립이 군대를 예루살렘으로 보냈어.');
 const {TWO_KINGS_DIALOGUE_ROWS}=await import('../js/features/pixel-bible/2ki-dialogue.js');
 const tartan=TWO_KINGS_DIALOGUE_ROWS.find(row=>row[0]===18&&row[1]==='다르단');
 assert.match(tartan[3][0],/우리를/);assert.match(tartan[3][1],/나는 성벽 앞에서/);
});

test('가족 갈등 대화에서 자녀는 부모에게 존댓말로 답한다',async()=>{
 const {relationshipLines}=await import('../js/features/pixel-bible/relationship-lines.js');
 const father={name:'아버지',role:'아버지'},son={name:'아들',role:'아들'};
 const relation={kind:'family',label:'아버지와 아들',text:'아버지가 아들을 위협하며 다투었다.',ref:'창세기 4:8',from:father,to:son};
 const lines=relationshipLines(son,father,relation,null,{random:()=>0});
 assert.equal(lines[0].speaker,son);
 assert.match(lines[0].text,/아버지, 저는/);
 assert.match(lines[0].text,/말씀드리겠습니다|들어 주십시오/);
 assert.doesNotMatch(lines[0].text,/말해라|들어라|네가 막으면/);
 const {PAIR_DIALOGUE}=await import('../js/features/pixel-bible/pair-dialogue.js');
 const sonToFather=PAIR_DIALOGUE.find(entry=>entry.id==='pair-jer-22-shallum-josiah');
 const violentSon=PAIR_DIALOGUE.find(entry=>entry.id==='pair-ezk-18-violent-son-righteous-father');
 assert.match(sonToFather.lines.join(' '),/아버지, 제가/);
 assert.match(violentSon.lines.join(' '),/아버지께서.*저는.*겠습니다/);
});

test('도감 인물은 쉬운 역할 설명을 보여 주고 열자마자 걷는다',async()=>{
 const {renderPersonPreview,easyPersonDescription}=await import('../js/features/pixel-bible/collection-preview.js?rev=turntable-motion-walk-start-2');
 assert.match(easyPersonDescription('다르단','앗수르의 장수'),/왕의 명령을 받아 군대를 이끌/);
 assert.match(easyPersonDescription('이사야','선지자'),/하나님의 말씀을 전하고/);
 assert.match(easyPersonDescription('요시야','유다 왕'),/나라를 다스리며/);
 assert.match(easyPersonDescription('사신','왕에게 보고한 사신'),/왕에게 보고한 사신으로 나와요/);
 assert.match(renderPersonPreview({name:'다르단'}),/data-model-motion[^>]*>걷기</);
});

test('발화 근거 강조는 구·절 단위의 맥락 표현을 포함한다',async()=>{
 const {contextTerms}=await import('../js/features/pixel-bible/context-emphasis.js');
 const terms=contextTerms({text:'나는 예루살렘 성벽 앞에서 항복을 요구했다.',detailText:'앗수르 군대가 예루살렘으로 올라와 성벽을 둘러쌌다.'});
 assert.ok(terms.some(term=>term.includes('예루살렘')&&term.split(' ').length>1));
});

test('물·나무·밧줄·작업 동작은 각자 다른 8박 핵심 자세를 사용한다',async()=>{
 const {actionTrack,applyActionTrack}=await import('../js/features/pixel-bible/action-tracks.js');
 for(const gesture of ['scoop','pour','drink','sip','wash','rinse','shake','kick','bonk','tie','coil','row','back-row','knead','press','divide','portion','pick','place','sort','measure','repair','wipe','brush','gather','sow','read','open','close','step-back','lean','shade','hold','offer','sling','load-sling','look','observe','inspect','point','hands','sit','lap','stretch','serve','guard','brace','thrust','swing','fletch','count','cover','play','pluck','long-blow','rehearse','balance','remove-weight','polish','smooth','lie','sleep','tuck'])assert.ok(actionTrack(gesture),`${gesture} needs an authored track`);
 const signature=gesture=>Array.from({length:8},(_,phase)=>{
  const pose={actual:gesture,gesture,lie:['lie','sleep','tuck','smooth'].includes(gesture),handY:25,handX:0,bodyX:0,bodyY:0,headX:0,headY:0,headTilt:0};
  applyActionTrack(pose,phase/2);return [pose.handY,pose.handX||0,pose.bodyX||0,pose.bodyY||0,pose.headY||0,pose.headTilt||0].join(',');
 }).join('|');
 for(const [a,b] of [['scoop','pour'],['pour','drink'],['drink','sip'],['wash','rinse'],['shake','kick'],['kick','bonk'],['tie','coil'],['row','back-row'],['row','knead'],['knead','press'],['divide','portion'],['pick','place'],['measure','repair'],['wipe','brush'],['step-back','lean'],['lean','shade'],['hold','offer'],['sling','load-sling'],['look','observe'],['look','inspect'],['point','hands'],['sit','lap'],['lap','stretch'],['offer','serve'],['guard','brace'],['thrust','swing'],['fletch','count'],['cover','close'],['play','pluck'],['blow','long-blow'],['blow','rehearse'],['balance','remove-weight'],['polish','smooth'],['lie','sleep'],['sleep','tuck'],['tuck','smooth']])assert.notEqual(signature(a),signature(b),`${a} and ${b} should not share a motion`);
});

test('본문 재료만 잡혀도 조합식에서 요구하는 기름병 오브젝트를 별도로 준비할 수 있다',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {includeSceneObjects}=await import('../js/features/pixel-bible/world.js');
 const {objectsForChapters}=await import('../js/features/pixel-bible/object-catalog.js');
 const book=JSON.parse(await readFile(new URL('../data/summary/2ki.json',import.meta.url),'utf8'));
 const chapter={code:'2ki',name:'열왕기하',chap:4,data:scopeChapterSummary(book.chapters[4])};
 const scenes=(await import('../js/features/pixel-bible/world.js')).buildWorldModel([chapter]).scenes;
 const choices=includeSceneObjects(objectsForChapters([chapter]),scenes);
 assert.ok(choices.some(item=>item.id==='olive-oil'&&item.name==='기름'));
 const oilJar=choices.find(item=>item.id==='oil');
 assert.equal(oilJar.name,'기름병');assert.ok(oilJar.refs.includes('열왕기하 4:1–7'));
 assert.match(oilJar.description,/빈 그릇/);
});

test('오브젝트 근거가 장 전체 요약이어도 발화로 사용하지 않는다',()=>{
 const evidence={text:'아람과 이스라엘의 전쟁을 설명하는 장 요약. '.repeat(80),ref:'열왕기상 22장'};
 const line=objectContextSpeech('물항아리',evidence,{random:()=>0});
 assert.match(line.text,/갈증|물/);assert.ok(!line.text.includes('살펴보자'));assert.ok(line.text.length<65);
 assert.equal(line.detailText,evidence.text);
 assert.equal(line.ref,evidence.ref);
 assert.equal(speechView(line).detailText,evidence.text);
});

test('긴 해설은 짧은 첫 문장만 말풍선에 표시하고 원문 맥락은 별도로 보존한다',()=>{
 const full='출전 전에 먼저 뜻을 물어봅시다. '+ '긴 사건 설명이 이어집니다. '.repeat(100);
 const view=speechView({text:full,ref:'열왕기상 22:5'});
 assert.equal(view.text,'출전 전에 먼저 뜻을 물어봅시다.');
 assert.equal(view.detailText,full.trim());
 assert.equal(view.ref,'열왕기상 22:5');
 const unbroken='아'.repeat(200);
 assert.ok([...speechView({text:unbroken}).text].length<=BUBBLE_LIMIT);
 assert.equal(speechView({text:unbroken}).detailText,unbroken);
});

test('자동 대사와 클릭 대사는 5초 표시 후 5초 쉰다',async()=>{
 const {SpeechDirector}=await import('../js/features/pixel-bible/dialogue.js');
 const director=new SpeechDirector({now:0,random:()=>0});
 const line={id:'long',speaker:{},text:'장 설명 '.repeat(300)};
 assert.ok(director.tick(5000,[line]).text.length<=BUBBLE_LIMIT);
 assert.equal(director.tick(10000,[line]),null);
 assert.equal(director.tick(14999,[line]),null);
 assert.ok(director.tick(15000,[line]));
 assert.ok(director.interrupt(line,11001).text.length<=BUBBLE_LIMIT);
 assert.equal(director.current.detailText,line.text.trim());
});

test('인물을 함께 모아도 본문 출처를 보존하고 하나님은 인간 NPC로 만들지 않는다', () => {
  const base = { name: '창세기', code: 'gen' };
  const model = buildWorldModel([
    { ...base, chap: 1, data: { people: [{ name: '하나님', weight: 3 }, { name: '아담', weight: 1 }] } },
    { ...base, chap: 2, data: { people: [{ name: '아담', weight: 3 }], rels: [{ from: '하나님', to: '아담', verses: '7', label: '지으심' }] } },
  ]);
  assert.equal(model.cast.filter(p=>p.name==='아담').length, 1);
  assert.deepEqual(model.cast.find(p=>p.name==='아담').refs, ['창세기 1장', '창세기 2장']);
  assert.equal(model.cast.filter(p=>p.name==='김밥').length,1);
  assert.equal(model.relations[0].ref, '창세기 2:7');
  assert.equal(model.scenes.length, 0);
});

test('본문에 없는 룻기 사건을 다른 장의 사건으로 재생하지 않는다', () => {
  const chapter = { name: '룻기', code: 'rut', data: { people: [{ name: '룻' }, { name: '보아스' }] } };
  assert.equal(buildWorldModel([{ ...chapter, chap: 1 }]).scenes.length, 0);
  const model = buildWorldModel([{ ...chapter, chap: 2 }]);
  assert.equal(model.scenes.length, 5);
  assert.ok(model.cast.some((p) => p.name === '일꾼'));
});

test('배치된 오브젝트를 우회하고 갈 수 없는 목적지는 거절한다', () => {
  const bounds = (x, y) => x < 0 || x > 4 || y < 0 || y > 4;
  const blocked = (x, y) => bounds(x, y) || (x === 2 && y < 4);
  const path = findPath({ x: 0, y: 0 }, { x: 4, y: 0 }, blocked);
  assert.ok(path.some((p) => p.y === 4));
  assert.deepEqual(path.at(-1), { x: 4, y: 0 });
  assert.ok(path.every((p) => !blocked(p.x, p.y)));
  assert.equal(findPath({ x: 0, y: 0 }, { x: 4, y: 0 }, (x, y) => bounds(x, y) || x === 2), null);
});

test('배는 물 위에서 놓고 옮길 수 있지만 다른 오브젝트는 물로 옮기지 못한다', async()=>{
 const {canMoveObject}=await import('../js/features/pixel-bible/object-drag.js');
 const wet=(x,y)=>x===4&&y===10;
 assert.equal(canMoveObject({kind:'boat'},{x:4,y:10},[],[],{waterAt:wet}),true);
 assert.equal(canMoveObject({kind:'tree'},{x:4,y:10},[],[],{waterAt:wet}),false);
 assert.equal(canMoveObject({kind:'boat'},{x:4,y:10},[{kind:'tree',x:4,y:10}],[],{waterAt:wet}),false);
});

test('달리기·충돌·물장구 동작은 정해진 확률과 3초 타이밍을 쓴다',async()=>{
 const {shouldRun,runningIntoPerson,runningIntoObject,impactPose,impactSparkles,swimPose,COLLISION_STUN_SECONDS}=await import('../js/features/pixel-bible/collision-motion.js');
 assert.equal(shouldRun(()=>.1),true);assert.equal(shouldRun(()=>.9),false);
 const actor={x:0,y:0},other={x:1,y:0};
 assert.equal(runningIntoPerson(actor,{x:.3,y:0},[actor,other]),other);
 assert.equal(runningIntoPerson(actor,{x:-.3,y:0},[actor,other]),undefined);
 assert.equal(runningIntoObject({x:.3,y:0},[{kind:'bench',x:1,y:0}],actor)?.kind,'bench');
 assert.equal(COLLISION_STUN_SECONDS,3);assert.equal(impactPose(0).fall,true);assert.equal(impactPose(1).sit,true);assert.equal(impactPose(2.95).rising,true);
 assert.ok(impactSparkles(1).every(star=>star.y>=-76&&star.y<=-72));
 assert.notEqual(impactPose(.4).headX,impactPose(.6).headX);assert.notEqual(impactPose(.4).headTilt,impactPose(.6).headTilt);
 const strokes=Array.from({length:8},(_,i)=>swimPose(i/6));
 assert.equal(new Set(strokes.map(p=>JSON.stringify([p.leftArm,p.rightArm,p.bodyY]))).size,8);
 assert.notDeepEqual(strokes[0].leftArm,strokes[0].rightArm);assert.equal(swimPose(0,true).phase,0);
});

test('물 진입 뒤 3초 제자리 허우적거리고 가까운 물가로 헤엄친 다음 2초 숨을 고른다',async()=>{
 const {beginWaterEscape,advanceWaterEscape,advanceWaterEscapes,advanceWaterHuff,rescueWaterEscape,WATER_ESCAPE_SECONDS,WATER_TREAD_SECONDS,WATER_HUFF_SECONDS}=await import('../js/features/pixel-bible/water-escape.js');
 const actor={x:58,y:20,path:[{x:59,y:20}],task:{},running:true,collisionStun:{elapsed:2},usingObject:{kind:'water'},interaction:{gesture:'drink'},action:'drink',boatRide:{},expression:'surprised'};
 beginWaterEscape(actor,{x:56,y:20});
 assert.deepEqual([actor.path.length,actor.task,actor.running,actor.collisionStun,actor.usingObject,actor.interaction,actor.boatRide],[0,null,false,null,null,null,null]);
 for(let i=0;i<Math.floor(WATER_TREAD_SECONDS/.05)-1;i++)assert.equal(advanceWaterEscape(actor,.05),false);
 assert.equal(actor.x,58,'첫 3초는 빠진 위치에서 어푸어푸');assert.equal(actor.waterEscape.phase,'treading');
 assert.equal(advanceWaterEscape(actor,.05),false);assert.equal(actor.waterEscape.phase,'swimming');assert.equal(actor.x,58);
 for(let i=0;i<49;i++)assert.equal(advanceWaterEscape(actor,.05),false);
 assert.ok(actor.x<58&&actor.x>56,'제자리 허우적 이후 가장 가까운 물가를 향해 이동');assert.equal(actor.waterEscape.phase,'swimming');
 for(let i=49;i<Math.floor(WATER_ESCAPE_SECONDS/.05)-1;i++)assert.equal(advanceWaterEscape(actor,.05),false);
 assert.ok(actor.waterEscape);assert.equal(advanceWaterEscape(actor,.05),true);
 assert.deepEqual([actor.x,actor.y,actor.waterEscape],[56,20,null]);assert.equal(advanceWaterEscape(actor,.05),false);
 assert.deepEqual(actor.waterHuff,{elapsed:0,duration:WATER_HUFF_SECONDS});
 for(let i=0;i<Math.floor(WATER_HUFF_SECONDS/.05)-1;i++)assert.equal(advanceWaterHuff(actor,.05),true);
 assert.equal(advanceWaterHuff(actor,.05),false);assert.equal(actor.waterHuff,null);assert.equal(actor.expression,'neutral');
 const swimmer={x:12,y:12},bystander={x:30,y:12,path:[{x:31,y:12}],stride:4,idle:1};beginWaterEscape(swimmer,{x:11,y:12});
 for(let i=0;i<Math.floor((WATER_TREAD_SECONDS+WATER_ESCAPE_SECONDS)/.05);i++)advanceWaterEscapes([swimmer,bystander],.05);
 assert.deepEqual([swimmer.x,swimmer.y,swimmer.waterEscape],[11,12,null]);
 assert.deepEqual(bystander,{x:30,y:12,path:[{x:31,y:12}],stride:4,idle:1});
 const stalled={x:40,y:25};beginWaterEscape(stalled,{x:39,y:25});
 assert.equal(rescueWaterEscape(stalled),true,'RAF가 멈춘 경우에도 별도 감시 타이머가 물가로 복귀시킬 수 있다');
 assert.equal(rescueWaterEscape(stalled),false,'구조 전환은 중복 실행되지 않는다');
});

test('물가에서 숨 고를 때 빨간 빠직 표시를 인물 머리 위에 그린다',async()=>{
 const {readFile}=await import('node:fs/promises');
 const world=await readFile(new URL('../js/features/pixel-bible/world.js',import.meta.url),'utf8');
 const motion=await readFile(new URL('../js/features/pixel-bible/water-escape.js',import.meta.url),'utf8');
 assert.match(motion,/WATER_HUFF_SECONDS=2/);
 assert.match(world,/c\.fillStyle='#8c272b';c\.fillRect\(x\+13,y-88/);
});

test('픽셀 월드 말풍선 본문 터치는 배경으로 전달되지 않아 닫힘을 유발하지 않는다',async()=>{
 const {readFile}=await import('node:fs/promises');
 const css=await readFile(new URL('../css/pixel-bible.css',import.meta.url),'utf8');
 assert.match(css,/\.pb-speech\{[^}]*pointer-events:auto/);
});

test('물 구조 그리기는 월드의 자유 변수를 읽지 않고 지형 색을 전달받는다',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../js/features/pixel-bible/world.js',import.meta.url),'utf8');
 const npcDraw=source.slice(source.lastIndexOf('function drawNpc('));
 assert.match(source,/const waterPalette=BACKGROUNDS\[backgroundKey\]/);
 assert.match(source,/waterPalette\.water,waterPalette\.wave/);
 assert.match(npcDraw,/function drawNpc\([^\n]*water='#528ca0',foam='#a7d4d0'/);
 assert.match(npcDraw,/drawWaterRescue\(c,\{x,y,style,pose:actionPose,time,water,foam,progress:n\.waterEscape\.progress\|\|0,reduced\}\)/);
 assert.doesNotMatch(npcDraw,/backgroundKey/);
});

test('물 구조 타이머는 일반 이동·장면 재생 분기와 분리되어 있고 회전 좌표는 실제 CSS 회전 상태를 따른다',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../js/features/pixel-bible/world.js',import.meta.url),'utf8');
 const entry=await readFile(new URL('../js/features/pixel-bible.js',import.meta.url),'utf8');
 const css=await readFile(new URL('../css/pixel-bible.css',import.meta.url),'utf8');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(source,/const rescued=advanceWaterEscapes\(npcs,dt\);[\s\S]{0,400}if\(!paused/);
 assert.match(source,/const cssLandscape = \(\) => !!shell\.closest\('dialog'\)\?\.classList\.contains\('pb-css-landscape'\)/);
 assert.match(source,/canvas\.height,cssLandscape\(\)/);
 assert.match(entry,/fullscreenTarget\.requestFullscreen\(\{ navigationUI: "hide" \}\)/);
 assert.match(entry,/screen\.orientation\.lock\("landscape"\)/);
 assert.match(entry,/Promise\.race\(\[result, new Promise/);
 assert.doesNotMatch(entry,/await landscapeReady/,'가로 잠금 대기가 월드 로딩을 막으면 안 된다');
 assert.match(entry,/화면을 가로로 돌려 주세요\. 자동 회전이 안 되어도 월드는 입장할 수 있어요/);
 assert.match(entry,/pb-css-landscape/);
 assert.match(entry,/window\.visualViewport/,'iPhone 주소창 크기 변화에 visual viewport 치수를 사용한다');
 assert.match(html,/name="viewport"[^>]*viewport-fit=cover/,'노치 화면의 safe area를 사용한다');
 assert.match(css,/\.pb-world-dialog\.pb-css-landscape[^}]*transform: none/,'대화상자는 회전하지 않아 터치 기준 좌표를 유지한다');
 assert.match(css,/\.pb-world-dialog\.pb-css-landscape > \.pb-shell[^}]*transform: rotate\(90deg\)/,'월드 내부만 회전한다');
 assert.match(css,/\.pb-world-head button[^}]*min-width: 48px; min-height: 48px/,'나가기 버튼의 터치 영역은 최소 48px이다');
 assert.match(css,/\.pb-side-toggle\{min-height:48px/,'도구·인물 토글은 최소 48px 높이이다');
 assert.match(css,/\.pb-side\{top:calc\(106px \+ var\(--pb-safe-top\)\)/,'도구 패널은 상단 안전 여백 아래에 배치한다');
});

test('세로 화면에서도 CSS 회전 월드 애니메이션은 계속 돌고 숨김·종료 때만 멈춘다',async()=>{
 const {worldCanAnimate}=await import('../js/features/pixel-bible/world-loop.js');
 assert.equal(worldCanAnimate({hidden:false,allowed:true,portrait:true}),true);
 assert.equal(worldCanAnimate({hidden:true,allowed:true}),false);
 assert.equal(worldCanAnimate({hidden:false,allowed:false}),false);
 assert.equal(worldCanAnimate({disposed:true,hidden:false,allowed:true}),false);
});

test('상호작용 말풍선은 첫 배치 방향을 유지하며 인물이나 카메라 움직임에 맞춰 함께 이동한다',async()=>{
 const {captureBubblePlacement,pinnedBubblePlacement}=await import('../js/features/pixel-bible/bubble-position.js');
 const pin=captureBubblePlacement(300,240,170,100,'left');
 const moved=pinnedBubblePlacement(pin,305,240,130,90,900,600);
 assert.equal(moved.side,'left');assert.deepEqual([moved.left,moved.top],[175,100]);
 const cameraShifted=pinnedBubblePlacement(pin,355,280,130,90,900,600);
 assert.equal(cameraShifted.side,'left');assert.deepEqual([cameraShifted.left,cameraShifted.top],[225,140]);
});

test('실제 배경의 물 영역에만 인물을 내려놓을 수 있도록 물 타일 경계를 제공한다',async()=>{
 const {waterAt,dryLanding}=await import('../js/features/pixel-bible/terrain-response.js');
 assert.equal(waterAt('lake',16,31),true);assert.equal(waterAt('lake',35,10),false);
 assert.equal(waterAt('pasture',18,31),true);assert.equal(waterAt('pasture',25,14),false);
 const safe=dryLanding('river',{x:58,y:20},(x,y)=>x<4||x>75||y<8||y>38||waterAt('river',x,y));
 assert.ok(safe);assert.equal(waterAt('river',safe.x,safe.y),false);assert.ok(Math.hypot(safe.x-58,safe.y-20)<=Math.SQRT2);
 assert.equal(waterAt('river',55,22),false,'강을 가로지르는 길은 물에 빠지지 않는 다리로 취급한다');
 assert.equal(waterAt('river',55,24),true,'길을 벗어난 강물은 계속 물로 취급한다');
});

test('물가 탈출은 테두리까지의 유클리드 거리가 가장 짧은 마른 칸을 고른다',async()=>{
 const {waterAt,dryLanding}=await import('../js/features/pixel-bible/terrain-response.js');
 const from={x:16,y:31},safe=dryLanding('lake',from,()=>false);let nearest=Infinity;
 for(let y=0;y<80;y++)for(let x=0;x<80;x++)if(!waterAt('lake',x,y))nearest=Math.min(nearest,Math.hypot(x-from.x,y-from.y));
 assert.ok(safe);assert.equal(Math.hypot(safe.x-from.x,safe.y-from.y),nearest);
});

test('물 허우적 모션은 물보라를 그리고 탈출이 진행되면 수면 덮임을 줄인다',async()=>{
 const {drawWaterRescue}=await import('../js/features/pixel-bible/water-rescue-art.js');
 const {swimPose}=await import('../js/features/pixel-bible/collision-motion.js');
 const render=progress=>{const calls=[],ctx={fillStyle:'',save(){},restore(){},fillRect(...rect){calls.push({color:this.fillStyle,rect});}};drawWaterRescue(ctx,{x:100,y:100,style:{coat:'#aabbcc'},pose:swimPose(.3),time:.3,water:'#112233',foam:'#aabbcc',progress});return calls;};
 const immersed=render(0),emerging=render(.5);
 assert.ok(immersed.some(({color,rect})=>color==='#d9f4ee'&&rect[2]<=2),'팔 동작에 맞춘 작은 물방울');
 assert.ok(immersed.filter(c=>c.color==='#112233').length>emerging.filter(c=>c.color==='#112233').length,'물가로 갈수록 몸을 덮는 수면이 줄어듦');
});

test('가로 화면 비율을 늘려도 월드는 균일 배율로 빈 여백 없이 채운다', async () => {
  const {worldViewport}=await import('../js/features/pixel-bible/world.js');
  for(const [w,h] of [[1280,591],[844,390],[1100,700]]) {
    const v=worldViewport(w,h);
    assert.ok(960*v.scale>=w&&480*v.scale>=h);
    const p={x:240,y:312};
    const projected={x:p.x*v.scale+v.x,y:p.y*v.scale+v.y};
    assert.ok(Math.abs((projected.x-v.x)/v.scale-p.x)<.00001);
    assert.ok(Math.abs((projected.y-v.y)/v.scale-p.y)<.00001);
  }
});

test('Safari DPR 캔버스 좌표 변환은 CSS 확대·소수 경계에서도 터치 위치를 보존한다',()=>{
 const rect={left:13.25,top:27.5,width:390.5,height:844.25};
 const point=clientToCanvasPoint(rect.left+rect.width*.5,rect.top+rect.height*.25,rect,781,1689);
 assert.ok(Math.abs(point.x-390.5)<.001);assert.ok(Math.abs(point.y-422.25)<.001);
 assert.deepEqual(clientToCanvasPoint(rect.left-4,rect.top-2,rect,781,1689),{x:0,y:0});
 assert.deepEqual(clientToCanvasPoint(rect.left+rect.width,rect.top+rect.height,rect,781,1689),{x:780,y:1688});
 assert.deepEqual(clientToCanvasPoint(0,0,{left:0,top:0,width:0,height:0},100,100),{x:0,y:0});
});

test('세로 화면에서 CSS로 90도 회전한 월드의 터치를 가로 캔버스 좌표로 되돌린다',()=>{
 const rect={left:0,top:0,right:390,bottom:844,width:390,height:844};
 assert.deepEqual(clientToCanvasPoint(100,200,rect,844,390,true),{x:200,y:290});
});

test('터치 드래그 판정 거리는 기기 픽셀 비율에 관계없이 CSS 기준으로 일정하다',()=>{
 assert.equal(touchSlopPixels(390,390),12);
 assert.equal(touchSlopPixels(780,390),24);
 assert.equal(touchSlopPixels(1170,390),36);
 assert.equal(touchSlopPixels(780,0),12);
});

test('등장 순서와 무관한 인물 외형과 본문·창작 근거를 제공한다', async () => {
  const {appearanceFor}=await import('../js/features/pixel-bible/appearance.js');
  const names=['엘리야','엘리사','이세벨','아합','벤하닷','나봇','미가야','여호사밧','아하시야(아합의 아들)','천사'];
  const styles=names.map((n,i)=>appearanceFor(n,i));
  assert.equal(new Set(styles.map(s=>s.key)).size,names.length);
  assert.equal(styles[0].fur,true);assert.equal(styles[1].bald,true);
  assert.equal(styles[2].eyeliner,true);assert.equal(styles[5].grapes,true);
  for(const [i,name] of names.entries()){
    assert.deepEqual(appearanceFor(name,1),appearanceFor(name,9));
    assert.ok(styles[i].evidence&&styles[i].design);
  }
});

test('로뎀나무 장면은 엘리야의 해당 본문에서만 열린다',()=>{
  const c={name:'열왕기상',code:'1ki',data:{people:[{name:'엘리야'},{name:'천사'}]}};
  assert.equal(buildWorldModel([{...c,chap:20}]).scenes.length,0);
  assert.equal(buildWorldModel([{...c,chap:19}]).scenes[0].id,'rest-elijah');
});

test('확장 외형은 근거와 창작 설명이 있고 이름별 미세 차이가 안정적이다',async()=>{
  const {APPEARANCES,appearanceFor}=await import('../js/features/pixel-bible/appearance.js');
  assert.equal(Object.keys(APPEARANCES).length,100);
  for(const p of Object.values(APPEARANCES)){
    const a=appearanceFor(p.name);assert.ok(a.evidence&&a.design);assert.deepEqual(a,appearanceFor(p.name,99));
  }
  assert.equal(appearanceFor('미리암').tambourine,true);
  assert.equal(appearanceFor('삼손').longHair,true);
  const signatures=new Set(Array.from({length:100},(_,i)=>{const {coat,hair,fringe,collar,hem,accent}=appearanceFor(`미등록 인물 ${i}`);return JSON.stringify([coat,hair,fringe,collar,hem,accent]);}));
  assert.ok(signatures.size>80);
});

test('신약 요셉에게 족장 요셉의 무늬 옷을 자동 적용하지 않는다',async()=>{
 const {appearanceFor}=await import('../js/features/pixel-bible/appearance.js');
 assert.equal(appearanceFor('요셉',0,'', ['창세기 37장']).pattern,true);
 assert.equal(appearanceFor('요셉',0,'마리아의 남편',['마태복음 1장']).pattern,undefined);
});


test('집단과 신적 존재를 분류하고 사울·요셉·빌립의 신원을 문맥으로 구분한다',async()=>{
 const {resolveIdentity:r}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(r('이스라엘 자손').kind,'group');assert.equal(r('하나님').kind,'spiritual');
 assert.equal(r('사울',{code:'act'}).id,r('바울').id);
 assert.notEqual(r('사울',{code:'1sa'}).id,r('바울').id);
 assert.notEqual(r('요셉',{code:'gen'}).id,r('요셉',{code:'mat',role:'마리아의 남편'}).id);
 assert.equal(r('바로',{code:'exo'}).kind,'unresolved');assert.equal(r('마리아').kind,'unresolved');assert.equal(r('요한').status,'ambiguous');
 assert.notEqual(r('빌립',{code:'act',chapter:8}).id,r('빌립',{code:'jhn'}).id);
 assert.equal(r('불',{code:'2ki',chapter:15,role:'은을 받은 앗수르 왕'}).id,'person:assyria-king-pul');
});

test('오브젝트 명칭 불과 사람 이름인 앗수르 왕 불을 혼동하지 않는다',async()=>{
 const {readFile}=await import('node:fs/promises');
 const art=await readFile(new URL('../js/features/pixel-bible/art.js',import.meta.url),'utf8');
 const world=await readFile(new URL('../js/features/pixel-bible/world.js',import.meta.url),'utf8');
 assert.match(art,/originalKind==='fire'[\s\S]{0,300}불은 사람이나 덤불이 아닌 장면 오브젝트/);
 assert.match(world,/name==='불'\?'불 왕':name/);
});

test('같은 이름의 다른 신원을 한 월드 인물로 합치지 않는다',()=>{
 const model=buildWorldModel([{code:'gen',name:'창세기',chap:37,data:{people:[{name:'요셉',role:'야곱의 아들'}]}},{code:'mat',name:'마태복음',chap:1,data:{people:[{name:'요셉',role:'마리아의 남편'}]}}]);
 const josephs=model.cast.filter(p=>p.name==='요셉');assert.equal(josephs.length,2);assert.notEqual(josephs[0].identity.id,josephs[1].identity.id);
});

test('역할명이 달라도 미확정 인물 이름은 월드에서 한 명으로 합치고 등장 장을 모은다',()=>{
 const model=buildWorldModel([
  {code:'gen',name:'창세기',chap:12,data:{people:[{name:'엘리아십',role:'제사장'}]}},
  {code:'neh',name:'느헤미야',chap:3,data:{people:[{name:'엘리아십',role:'성벽을 재건하는 사람'}]}}
 ]);
 const same=model.cast.filter(p=>p.name==='엘리아십');
 assert.equal(same.length,1);assert.deepEqual(same[0].refs,['창세기 12장','느헤미야 3장']);assert.deepEqual(same[0].roles,['제사장','성벽을 재건하는 사람']);
});

test('배경 20종에 공통 이동 영역과 유효한 팔레트가 있다',async()=>{
 const {BACKGROUNDS,backgroundFor}=await import('../js/features/pixel-bible/backgrounds.js');
 assert.equal(Object.keys(BACKGROUNDS).length,20);assert.equal(backgroundFor('invalid'),BACKGROUNDS.meadow);assert.equal(backgroundFor('__proto__'),BACKGROUNDS.meadow);
 for(const p of Object.values(BACKGROUNDS)){assert.ok(p.name);assert.equal(p.tile.length,2);for(const k of ['ground','water','path','hill'])assert.match(p[k],/^#[0-9a-f]{6}$/);}
});

test('픽셀월드 목적격 조사는 받침과 괄호 설명을 구분한다',async()=>{
 const {objectPhrase}=await import('../js/features/pixel-bible/language.js');
 for(const [name,expected] of [['천사','천사를'],['엘리야','엘리야를'],['룻','룻을'],['엘리사','엘리사를'],['보아스','보아스를'],['물항아리','물항아리를'],['보리밭','보리밭을'],['아하시야(아합의 아들)','아하시야(아합의 아들)를']])assert.equal(objectPhrase(name),expected);
});

test('수평·수직 이동 방향과 정지 방향을 보존한다',async()=>{
 const {movementDirection:d}=await import('../js/features/pixel-bible/language.js');
 assert.equal(d(0,-1),'up');assert.equal(d(0,1),'down');assert.equal(d(-1,0),'left');assert.equal(d(1,0),'right');assert.equal(d(0,0,'up'),'up');
});

test('도감 캐릭터는 버튼 없이 밀어서 앞·측면·뒷면·위 시점을 보고 탭으로 동작을 바꾼다',async()=>{
 const {previewDirectionAfterSwipe:turn,previewDirectionFromControl,previewMotionAfterTap,renderPersonPreview}=await import('../js/features/pixel-bible/collection-preview.js');
 assert.equal(turn('down',40,0),'right');assert.equal(turn('right',40,0),'up');
 assert.equal(turn('down',-40,0),'left');assert.equal(turn('left',-40,0),'up');
 assert.equal(turn('down',0,-40),'top');assert.equal(turn('top',0,40),'down');
 assert.equal(turn('down',150,0),'left','긴 가로 쓸기는 여러 시점을 넘긴다');
 assert.equal(turn('left',2,1),'left');
 for(const face of ['up','down','left','right','top'])assert.equal(previewDirectionFromControl(face),face);
 assert.equal(previewDirectionFromControl('invalid'),'down');
 assert.deepEqual([previewMotionAfterTap('stand'),previewMotionAfterTap('walk'),previewMotionAfterTap('run')],['walk','run','stand']);
 const markup=renderPersonPreview({name:'인물'});
 assert.match(markup,/<canvas data-model-canvas/,'시점은 픽셀 스프라이트를 캔버스에서 다시 그린다');
 assert.match(markup,/data-model-motion/,'현재 서기·걷기·달리기 동작을 표시한다');
 assert.doesNotMatch(markup,/data-model-face|pb-person-model-controls/,'방향 선택 버튼을 렌더링하지 않는다');
 const {readFile}=await import('node:fs/promises');const directions=await readFile(new URL('../js/features/pixel-bible/directions.js',import.meta.url),'utf8');
 assert.match(directions,/direction==='top'/,'위에서 내려다보는 픽셀 스프라이트를 별도로 그린다');
});

test('100종의 독백 200개와 확장된 관계 대사를 출처와 구분한다',async()=>{
 const {APPEARANCES}=await import('../js/features/pixel-bible/appearance.js');
 const {SOLO_DIALOGUE,PAIR_DIALOGUE,DIALOGUE_SOURCE_STATUS}=await import('../js/features/pixel-bible/dialogue.js');
 assert.equal(Object.keys(SOLO_DIALOGUE).length,100);
 for(const p of Object.values(APPEARANCES)){const solo=SOLO_DIALOGUE[p.name];assert.ok(solo?.ref);assert.equal(solo.lines.length,2);assert.ok(solo.lines.every(s=>s.length>8&&s.length<100));}
 assert.equal(PAIR_DIALOGUE.length,942);for(const p of PAIR_DIALOGUE){assert.ok(p.speaker&&p.target&&p.ref&&p.chapter);assert.ok(p.lines.length>0);}
 const josiah=PAIR_DIALOGUE.find(p=>p.id==='pair-2ki-21-people-josiah');
 assert.equal(josiah.lines.length,3);assert.equal(josiah.replyLines.length,3);assert.equal(josiah.lineDetails.length,3);
 const {speechContext}=await import('../js/features/pixel-bible/speech-context.js');
 assert.equal(speechContext({lineDetail:josiah.lineDetails[1],ref:josiah.ref}),josiah.lineDetails[1]);
 assert.equal(DIALOGUE_SOURCE_STATUS.hokma,'partially-reviewed-uploaded-hokma-notes');
});

test('말풍선은 한 슬롯에서 5초 표시하고 실제 숨긴 시점부터 5초를 쉰다',async()=>{
 const {SpeechDirector}=await import('../js/features/pixel-bible/dialogue.js');
 const s=new SpeechDirector({now:0,random:()=>0});const a={id:'a',speaker:{name:'가'},kind:'solo'},b={id:'b',speaker:{name:'나'},kind:'solo'};
 assert.equal(s.tick(4999,[a,b]),null);assert.equal(s.tick(5000,[a,b]).id,'a');
 assert.equal(s.tick(9999,[b]).id,'a');assert.equal(s.tick(10000,[b]),null);
 assert.equal(s.tick(14999,[b]),null);assert.equal(s.tick(15000,[a,b]).id,'b');
 // 탭 복귀 등으로 만료를 늦게 관측해도 새로 사라진 순간부터 센다.
 assert.equal(s.tick(25000,[a]),null);assert.equal(s.tick(29999,[a]),null);assert.equal(s.tick(30000,[a]).id,'a');
 assert.equal(s.tick(30100,[a],false),null);assert.equal(s.current,null);
 assert.equal(s.tick(35099,[b]),null);assert.equal(s.tick(35100,[b]).id,'b');
});

test('클릭은 현재 대사를 즉시 교체하고 새 5초 종료 후 5초 뒤 자동 대사를 허용한다',async()=>{
 const {SpeechDirector}=await import('../js/features/pixel-bible/dialogue.js');
 const s=new SpeechDirector({random:()=>0});const a={id:'a',speaker:{},kind:'solo'},b={id:'b',speaker:{},kind:'solo'},c={id:'c',speaker:{},kind:'solo'};
 assert.equal(s.tick(5000,[a]).id,'a');
 assert.equal(s.interrupt(b,6500).id,'b');assert.equal(s.tick(6501,[c]).id,'b');
 assert.equal(s.tick(11499,[c]).id,'b');assert.equal(s.tick(11500,[c]),null);
 assert.equal(s.tick(16499,[c]),null);assert.equal(s.tick(16500,[c]).id,'c');
 // 공백 시간과 같은 인물 재클릭도 즉시 표시하고 5초를 다시 센다.
 s.interrupt(c,16600);assert.equal(s.current.started,16600);assert.equal(s.current.until,21600);
});

test('이세벨의 대상별 대사를 구분하고 거리·현재 본문·이동 상태를 확인한다',async()=>{
 const {dialogueCandidates}=await import('../js/features/pixel-bible/dialogue.js');
 const npc=(name,x)=>({name,x,y:8,path:[],refs:['열왕기상 21장']});
 const people=[npc('이세벨',10),npc('아합',11),npc('나봇',12),npc('나봇의 성읍 장로들',13)];
 const candidates=dialogueCandidates(people,[{code:'1ki',chap:21}]);
 const queen=candidates.filter(c=>c.kind==='pair'&&c.speaker.name==='이세벨');
 assert.equal(queen.filter(c=>c.target.name==='아합').length,2);assert.equal(queen.filter(c=>c.target.name==='나봇의 성읍 장로들').length,2);assert.equal(queen.some(c=>c.target.name==='나봇'),false);
 assert.notEqual(queen[0].text,queen.at(-1).text);
 people[2].x=20;assert.ok(!dialogueCandidates(people,[{code:'1ki',chap:21}]).some(c=>c.kind==='pair'&&c.target.name==='나봇'));
 assert.ok(!dialogueCandidates(people,[{code:'1ki',chap:20}]).some(c=>c.kind==='pair'));
 people[0].path=[{x:11,y:8}];assert.ok(!dialogueCandidates(people,[{code:'1ki',chap:21}]).some(c=>c.speaker.name==='이세벨'));
});

test('전용 외형이 없는 주요 인물도 고유 대사를 선택하며 마리아의 신원을 구분한다',async()=>{
 const {buildChapterDialogue,majorFor,MAJOR_DIALOGUE}=await import('../js/features/pixel-bible/chapter-dialogue.js');
 const {dialogueCandidates}=await import('../js/features/pixel-bible/dialogue.js');
 assert.equal(MAJOR_DIALOGUE.length,100);
 const chapters=[{code:'1sa',name:'사무엘상',chap:26,data:{people:[{name:'아비새',role:'다윗과 함께 간 장수'}]}},{code:'act',name:'사도행전',chap:12,data:{people:[{name:'마리아',role:'마가의 어머니'}]}}];
 const context=buildChapterDialogue(chapters);
 assert.equal(majorFor({name:'마리아'},context).label,'마가의 어머니 마리아');
 assert.equal(majorFor({name:'아비새'},context).label,'아비새');
 assert.ok(dialogueCandidates([{name:'아비새',x:10,y:8,path:[]}],chapters,context).some(c=>c.origin==='authored'&&c.kind==='solo'));
});

test('다른 본문의 인물과 관계도 현재 장에 맞는 창작 대사와 참고 구절로 연결한다',async()=>{
 const {buildChapterDialogue}=await import('../js/features/pixel-bible/chapter-dialogue.js');
 const {dialogueCandidates}=await import('../js/features/pixel-bible/dialogue.js');
 const chapters=[{code:'neh',name:'느헤미야',chap:3,data:{people:[{name:'하눈',role:'성문을 수리한 사람'},{name:'살룬',role:'문과 성벽을 수리한 사람'}],rels:[{from:'하눈',to:'살룬',label:'함께 재건',verses:'13-15',note:'두 사람이 각자 맡은 문과 성벽을 수리했어요.'}]}}];
 const npcs=[{name:'하눈',x:10,y:8,path:[]},{name:'살룬',x:11,y:9,path:[]}],context=buildChapterDialogue(chapters),lines=dialogueCandidates(npcs,chapters,context);
 assert.ok(!lines.some(c=>c.origin==='chapter-role'),'장·상황 근거가 없는 직업군 공통 독백은 자동 재생하지 않는다');
 assert.equal(lines.filter(c=>c.origin==='chapter-relation').length,2);
 assert.ok(!lines.some(c=>c.kind==='ordinary'));
 npcs[1].x=30;assert.ok(!dialogueCandidates(npcs,chapters,context).some(c=>c.target));
});

test('대화는 같은 축에서만 마주보고, 대각선일 때 걸어갈 안전한 자리를 찾는다',async()=>{
 const {opposedDirections,planConversation}=await import('../js/features/pixel-bible/conversation.js');
 const a={x:10,y:8,path:[]},b={x:12,y:9,path:[]};const blocked=(x,y)=>x<2||x>37||y<5||y>15;
 assert.equal(opposedDirections(a,b),null);
 const p=planConversation(a,b,[a,b],blocked,findPath);assert.ok(p?.route.length);assert.ok(opposedDirections(p.anchor,p.destination));
 assert.deepEqual({x:b.x,y:b.y},{x:12,y:9});
 assert.deepEqual(opposedDirections({x:10,y:8},{x:12,y:8}),['right','left']);
 assert.deepEqual(opposedDirections({x:10,y:8},{x:10,y:10}),['down','up']);
 assert.equal(planConversation(a,b,[a,b],()=>true,findPath),null);
 const occupied={x:p.destination.x,y:p.destination.y,path:[]},alternate=planConversation(a,b,[a,b,occupied],blocked,findPath);
 assert.ok(alternate);assert.ok(alternate.destination.x!==occupied.x||alternate.destination.y!==occupied.y);
});

test('말풍선 성경구절은 장과 절 범위를 안전하게 해석한다',async()=>{
 const {parseReference:p}=await import('../js/features/pixel-bible/references.js');
 assert.deepEqual(p('열왕기상 21:5–7'),{code:'1ki',chapter:21,verses:[5,6,7]});
 assert.deepEqual(p('요한계시록 22:1,3-5'),{code:'rev',chapter:22,verses:[1,3,4,5]});
 assert.deepEqual(p('느헤미야 3장'),{code:'neh',chapter:3,verses:null});
 assert.equal(p('열왕기상 99:1'),null);assert.equal(p('본문 없음'),null);assert.equal(p('열왕기상 21:8-3'),null);
});

test('통독에서 보고 있는 Day와 계획 밖 본문을 달력상 오늘보다 우선한다', async () => {
 const {readFile}=await import('node:fs/promises');
 const {runInNewContext}=await import('node:vm');
 const source=await readFile(new URL('../js/features/pixel-bible.js',import.meta.url),'utf8');
 const ctx={document:{addEventListener(){}},state:{plan:{}},freeChapter:null,viewingDay:1,
 CHAPTERS:[{book:{code:'1ki',name:'열왕기상'},chap:19},{book:{code:'2ki',name:'열왕기하'},chap:2},{book:{code:'jhn',name:'요한복음'},chap:3}],
  progress:()=>({days:[[0],[1]],todayDay:0})};
 runInNewContext(source,ctx);
 assert.equal(ctx.pixelBibleTodayChapters()[0].code,'2ki');
 ctx.freeChapter=2;assert.equal(ctx.pixelBibleTodayChapters()[0].code,'jhn');assert.equal(ctx.pixelBibleTodayChapters().length,1);
 ctx.freeChapter=null;ctx.viewingDay=null;assert.equal(ctx.pixelBibleTodayChapters()[0].code,'1ki');
 ctx.state.plan=null;assert.equal(ctx.pixelBibleTodayChapters().length,0);
});

test('기본 월드는 현재 통독 범위를 유지하고 계획 밖 직접 선택은 한 장으로 연다', async () => {
 const {readFile}=await import('node:fs/promises');
 const {runInNewContext}=await import('node:vm');
 const source=await readFile(new URL('../js/features/pixel-bible.js',import.meta.url),'utf8');
 const psalms=Array.from({length:150},(_,i)=>({book:{code:'psa',name:'시편'},chap:i+1}));
 const ctx={document:{addEventListener(){}},state:{plan:{}},freeChapter:59,viewingDay:0,
  CHAPTERS:[...psalms,{book:{code:'pro',name:'잠언'},chap:1}],progress:()=>({days:[],todayDay:0})};
 runInNewContext(source,ctx);
 ctx.freeChapter=null;
 ctx.progress=()=>({days:[[57,58,59]],todayDay:0});ctx.viewingDay=0;
 assert.deepEqual(Array.from(ctx.pixelBibleTodayChapters(),c=>c.chap),[58,59,60]);
 ctx.freeChapter=59;ctx.progress=()=>({days:[[0],[1]],todayDay:0});ctx.viewingDay=1;
 assert.deepEqual(Array.from(ctx.pixelBibleTodayChapters(),c=>c.chap),[60]);
 assert.deepEqual(Array.from(ctx.pixelBibleRangeChapters('psa',57,61),c=>c.chap),[57,58,59,60,61]);
 assert.deepEqual(Array.from(ctx.pixelBibleRangeChapters('psa',57,151),c=>c.chap),Array.from({length:94},(_,i)=>i+57));
 assert.deepEqual(Array.from(ctx.pixelBibleRangeChapters('pro',1,5),c=>c.chap),[1]);
 assert.deepEqual(Array.from(ctx.pixelBibleRangeChapters('mat',1,5),c=>c.chap),[]);
 assert.deepEqual(Array.from(ctx.pixelBibleRangeChapters('psa',3,2)),[]);
 ctx.freeChapter=0;assert.deepEqual(Array.from(ctx.pixelBibleTodayChapters(),c=>c.chap),[1]);
 ctx.freeChapter=149;assert.deepEqual(Array.from(ctx.pixelBibleTodayChapters(),c=>c.chap),[150]);
 ctx.CHAPTERS=[{book:{code:'ob',name:'오바댜'},chap:1}];ctx.freeChapter=0;
 assert.deepEqual(Array.from(ctx.pixelBibleRangeChapters('ob',1,1),c=>c.chap),[1]);
});

test('표기 범위는 인물·오브젝트·사건이 화면 한도를 넘으면 다시 선택하게 한다',async()=>{
 const {rangeIsTooLarge}=await import('../js/features/pixel-bible/world.js');
 assert.equal(rangeIsTooLarge({people:24,objects:36,events:36}),false);
 assert.equal(rangeIsTooLarge({people:25}),true);assert.equal(rangeIsTooLarge({objects:37}),true);assert.equal(rangeIsTooLarge({events:37}),true);
 const {readFile}=await import('node:fs/promises');
 const world=await readFile(new URL('../js/features/pixel-bible/world.js',import.meta.url),'utf8');
 assert.match(world,/<summary>표기 범위 · 장 선택<\/summary>/);assert.match(world,/너무 많아요! 인물·오브젝트·사건이 한 화면에 많아져요/);
});

test('다른 통독 분량은 배경 기본값을 다시 선택하고 수동 배경 저장도 분리한다', async () => {
 const {defaultBackground,backgroundStorageKey,BACKGROUNDS}=await import('../js/features/pixel-bible/backgrounds.js');
 const a=[{code:'rut',chap:2}],b=[{code:'mat',chap:4}];
 assert.notEqual(defaultBackground(a),defaultBackground(b));
 assert.ok(BACKGROUNDS[defaultBackground(a)]);
 assert.equal(defaultBackground(a),defaultBackground([...a]));
 assert.notEqual(backgroundStorageKey('1ki.19'),backgroundStorageKey('2ki.2'));
});

test('10명을 넘는 통독 명단도 모두 동시에 월드에 보존한다',async()=>{
 const {visibleWorldCast}=await import('../js/features/pixel-bible/world.js');
 const data={people:Array.from({length:25},(_,i)=>({name:`인물${i}`,role:'본문 인물',weight:25-i})),rels:[{from:'인물24',to:'인물23',label:'도움',verses:'1'}]};
 const model=buildWorldModel([{code:'gen',name:'창세기',chap:1,data}]);
 assert.equal(model.cast.filter(p=>!p.worldMascot).length,25);
 const visible=visibleWorldCast(model,24);
 assert.equal(visible.filter(p=>!p.worldMascot).length,25);assert.deepEqual(new Set(visible.map(p=>p.name)),new Set(model.cast.map(p=>p.name)));
});

test('관계도에만 있는 상대도 인물과 상호작용에 포함한다',async()=>{
 const {buildChapterDialogue}=await import('../js/features/pixel-bible/chapter-dialogue.js');
 const chapters=[{code:'gen',name:'창세기',chap:1,data:{people:[{name:'갑',role:'돕는 이'}],rels:[{from:'갑',to:'을',label:'도움',note:'갑이 을을 돕는다.',verses:'1'}]}}];
 const model=buildWorldModel(chapters),context=buildChapterDialogue(chapters);
 assert.deepEqual(model.cast.filter(p=>!p.worldMascot).map(p=>p.name),['갑','을']);assert.equal(context.relations.length,1);
});

test('관계선은 현재 머리 위치와 드래그 위치를 따라가고 다른 본문의 동명이인을 연결하지 않는다',async()=>{
 const {relationshipLinks,relationshipFocus,relationshipOpacity}=await import('../js/features/pixel-bible/relationship-overlay.js');
 const a={name:'갑',x:10,y:8,refs:['창세기 1장']},b={name:'을',x:20,y:9,refs:['창세기 1장']};
 const relations=[{from:'갑',to:'을',label:'가족',sourceRef:'창세기 1장'},{from:'갑',to:'을',label:'다른 사람',sourceRef:'창세기 2장'}];
 let links=relationshipLinks(relations,[a,b]);assert.equal(links.length,1);assert.deepEqual(links[0].a,{x:240,y:112});
 a.x=11;links=relationshipLinks(relations,[a,b]);assert.equal(links[0].a.x,264);
 links=relationshipLinks(relations,[a,b],{active:true,n:a,p:{x:15,y:7}});assert.deepEqual(links[0].a,{x:360,y:88});
 assert.equal(relationshipLinks(relations,[a]).length,0);
 const c={name:'병',x:25,y:9,refs:['창세기 1장']},focus=relationshipFocus([...relations,{from:'을',to:'병',label:'친구'}],[a,b,c],a);
 assert.deepEqual([...focus],[a,b]);assert.equal(relationshipLinks([...relations,{from:'을',to:'병',label:'친구'}],[a,b,c],null,a).length,1);
 assert.equal(relationshipOpacity(focus,a),1);assert.equal(relationshipOpacity(focus,b),1);assert.equal(relationshipOpacity(focus,c),.16);
 const objectRelation={from:{name:'갑',ref:'창세기 1장'},to:{name:'을',ref:'창세기 1장'},label:'가족'};
 assert.deepEqual([...relationshipFocus([objectRelation],[a,b,c],a)],[a,b],'사람 객체 형태로 저장된 관계도 연결 인물을 찾는다');
});

test('TV 부스에 들어온 한두 인물은 기존 방향과 무관하게 정면을 본다',async()=>{
 const source=fs.readFileSync('js/features/pixel-bible/world.js','utf8');
 const {faceBoothFront}=await import('../js/features/pixel-bible/love-booth.js');
 const left={direction:'up',idle:0},right={direction:'left',idle:0};
 faceBoothFront([left]);assert.equal(left.direction,'down');
 faceBoothFront([left,right]);assert.equal(left.direction,'down');assert.equal(right.direction,'down');
 assert.match(source,/faceBoothFront\(\[n\]\);keepInView\(n\);startLoveBooth\(\)/);
 assert.match(source,/faceBoothFront\(pair\);cancelTalk\(\);hideSpeech\(\);encounters\.clear\(\)/);
 assert.match(source,/const boothPair=\(\)=>npcs\.filter\(n=>n\.loveBooth===loveBooth\(\)&&!n\.creature\)\.sort\(\(a,b\)=>a\.x-b\.x\)/);
});


test('인물 동작은 관련 본문만 적용하고 치유 후 인물을 절뚝거림으로 고정하지 않는다',async()=>{
 const {characterMotion,motionPose}=await import('../js/features/pixel-bible/motion.js');
 const chapter=(code,name,chap)=>({code,name,chap});
 const jacob={name:'야곱',refs:['창세기 31장','창세기 32장']};
 assert.equal(characterMotion(jacob,[chapter('gen','창세기',31)]).limp,false);
 const limp=characterMotion(jacob,[chapter('gen','창세기',32)]);assert.equal(limp.limp,true);
 assert.notEqual(motionPose(limp,.25,true).speed,motionPose(limp,.75,true).speed);
 assert.equal(characterMotion({name:'야곱',refs:['요한복음 4장']},[chapter('jhn','요한복음',4)]).limp,false);
 assert.equal(characterMotion({name:'므비보셋',refs:['사무엘하 9장']},[chapter('2sa','사무엘하',9)]).limp,true);
 assert.equal(characterMotion({name:'못 걷는 사람',role:'일어나 걸은 이',refs:['사도행전 3장']},[chapter('act','사도행전',3)]).key,'restored');
 const profiles=['모세','엘리야','룻','베드로','삭개오'].map(name=>characterMotion({name,refs:[]}));
 assert.ok(new Set(profiles.map(p=>JSON.stringify([p.swing,p.frequency,p.phase]))).size>=3);
});

test('같은 인물의 같은 클릭 대사를 즉시 다시 표시할 수 있다',async()=>{
 const {SpeechDirector}=await import('../js/features/pixel-bible/dialogue.js');
 const s=new SpeechDirector({random:()=>0});const a={id:'same-line',speaker:{name:'가'},text:'같은 문장',kind:'solo'};
 s.interrupt(a,100);assert.equal(s.current.id,a.id);
 s.interrupt(a,200);assert.equal(s.current.text,a.text);assert.equal(s.current.until,5200);
 assert.equal(s.tick(5200,[]),null);assert.equal(s.nextAt,10200);
});

test('오브젝트 철거는 인물의 위치·경로·방향을 유지하고 삭제한 물건의 작업만 해제한다',async()=>{
 const {removeObjects}=await import('../js/features/pixel-bible/object-scenes.js');
 const a={kind:'tree',x:10,y:8},b={kind:'scroll',x:15,y:9};
 const path=[{x:12,y:8}],n={x:11.25,y:8,path,direction:'right',stride:.4,idle:2,task:a,action:'tree',usingObject:a};
 const other={x:19,y:10,path:[{x:20,y:10}],task:b};
 let result=removeObjects([a,b],[n,other],o=>o===a);
 assert.deepEqual(result.remaining,[b]);assert.equal(n.x,11.25);assert.equal(n.path,path);assert.equal(n.direction,'right');assert.equal(n.task,null);assert.equal(n.usingObject,null);assert.equal(n.stride,.4);assert.equal(other.task,b);
 result=removeObjects(result.remaining,[n,other],()=>true);assert.deepEqual(result.remaining,[]);assert.equal(other.x,19);assert.equal(other.path.length,1);
});

test('성경 물건 조합은 실제 해당 장의 등장인물과 매칭되고 다른 장에서는 열리지 않는다',async()=>{
 const {OBJECT_SCENES,WORLD_OBJECTS}=await import('../js/features/pixel-bible/object-scenes.js');
 const {readFile}=await import('node:fs/promises');
 for(const scene of OBJECT_SCENES){
  assert.ok(WORLD_OBJECTS[scene.object]);assert.ok(scene.ref);assert.equal(scene.lines.length,2);
  const raw=JSON.parse(await readFile(new URL(`../data/summary/${scene.code}.json`,import.meta.url),'utf8'));
  const model=buildWorldModel([{code:scene.code,name:scene.code,chap:scene.chapter,data:raw.chapters[scene.chapter]}]);
  assert.ok(model.scenes.some(s=>s.id===scene.id));for(const name of scene.actors)assert.ok(model.cast.some(p=>p.name===name),`${scene.id}: ${name}`);
  assert.ok(!buildWorldModel([{code:scene.code,name:scene.code,chap:scene.chapter+1,data:{people:[]}}]).scenes.some(s=>s.id===scene.id));
 }
});

test('오브젝트 색인은 장·구절 범위를 보존하고 돌아가다/불순종을 돌/불로 잘못 찾지 않는다',async()=>{
 const {chapterObjects,OBJECT_CATALOG}=await import('../js/features/pixel-bible/object-catalog.js');
 assert.ok(Object.keys(OBJECT_CATALOG).length>=150);
 const items=chapterObjects({code:'gen',name:'창세기',chap:1,data:{people:[{name:'야곱'}],events:[{title:'돌',verses:'3-5',text:'야곱이 돌을 세우고 기름을 부어요.'}],story:'집으로 돌아와 불순종을 뉘우쳤어요.'}});
 assert.ok(items.find(i=>i.id==='stone').refs.includes('창세기 1:3-5'));
 assert.deepEqual(items.find(i=>i.id==='stone').actors,['야곱']);
 const empty=chapterObjects({code:'gen',name:'창세기',chap:1,data:{story:'그는 돌아가며 불순종을 뉘우치고 말을 전했어요.'}});
 assert.ok(!empty.some(i=>['stone','fire','horse'].includes(i.id)));
});

test('전 오브젝트에 단계별 모션이 있고 의자·물·밭은 서로 다른 자세를 사용한다',async()=>{
 const {OBJECT_CATALOG}=await import('../js/features/pixel-bible/object-catalog.js');
 const {interactionRoutine,interactionPose,INTERACTION_MOTION_COUNT}=await import('../js/features/pixel-bible/interaction-motion.js');
 assert.ok(INTERACTION_MOTION_COUNT>=175);
 const n={name:'룻'};
 for(const key of Object.keys(OBJECT_CATALOG)){
  const routine=interactionRoutine(n,key);assert.ok(routine.id&&routine.label);
  const phases=[0,.25,.5,.75].map(t=>interactionPose({...routine,phase:0},t*routine.period));assert.equal(new Set(phases.map(p=>p.phase)).size,4);
 }
 assert.equal(interactionPose(interactionRoutine(n,'bench'),1).sit,true);
 const sip=interactionRoutine({name:'룻'},'water');assert.notEqual(sip.category,interactionRoutine(n,'field').category);
 const {interactionOptions}=await import('../js/features/pixel-bible/interaction-motion.js');assert.ok(interactionOptions('trumpet').some(v=>v[0]==='blow'));assert.ok(interactionOptions('lyre').some(v=>v[0]==='strum'));
 assert.equal(interactionRoutine({name:'바룩',objectAction:'baruch-scroll'},'scroll').gesture,'write');
});

test('보강 장면의 배우는 해당 장에 있고 인사·청취자는 잘못된 오브젝트 동작을 하지 않는다', async () => {
 const {ALL_SCENES,RUTH_SCENES}=await import('../js/features/pixel-bible/scenes.js');
 const {OBJECT_SCENES,objectLinesFor}=await import('../js/features/pixel-bible/object-scenes.js');
 const fs=await import('node:fs/promises');
 for(const scene of [...ALL_SCENES,...OBJECT_SCENES]){
  const book=JSON.parse(await fs.readFile(new URL(`../data/summary/${scene.code}.json`,import.meta.url)));
  const model=buildWorldModel([{code:scene.code,name:scene.code,chap:scene.chapter,data:book.chapters[scene.chapter]}]);
  const rendered=model.scenes.find(s=>s.id===scene.id);assert.ok(rendered,`${scene.id} remains a scene`);
  for(const name of rendered.actors)assert.ok(model.cast.some(p=>p.name===name),`${scene.id}: rendered actor ${name}`);
  assert.ok(scene.lines.length>=2&&scene.ref);
  assert.ok(model.scenes.some(s=>s.id===scene.id));
 }
 assert.deepEqual(RUTH_SCENES.find(s=>s.id==='greet').actions,{});
 const boat=OBJECT_SCENES.find(s=>s.id==='jesus-boat');
 assert.notDeepEqual(objectLinesFor(boat,'예수'),objectLinesFor(boat,'제자들'));
 assert.ok(objectLinesFor(boat,'예수').every(s=>!s.includes('우리가 죽게')));
 const well=OBJECT_SCENES.find(s=>s.id==='samaritan-well');
 assert.notDeepEqual(objectLinesFor(well,'예수'),objectLinesFor(well,'사마리아 여자'));
 const {PAIR_DIALOGUE}=await import('../js/features/pixel-bible/pair-dialogue.js');
 assert.ok(PAIR_DIALOGUE.find(s=>s.id==='pair-32').lines.every(s=>!s.includes('형님')));
});

test('표시 인물이 바뀌어도 기존 인물의 위치·경로·방향·오브젝트 동작과 재등장 상태를 보존한다',async()=>{
 const {castKey,reconcileCast,findSpawnCell}=await import('../js/features/pixel-bible/cast-state.js');
 const path=[{x:14,y:8}],object={kind:'well',x:8,y:9};
 const a={name:'다윗',identity:{id:'person:david'},x:13.4,y:8,path,direction:'left',stride:5,action:'well',usingObject:object,task:null};
 const b={name:'사울',identity:{id:'person:saul-king'},x:16,y:9,path:[],direction:'up'};
 const c={name:'요나단',identity:{id:'person:jonathan'}};
 const current=[a,b],cache=new Map();
 let created=0;
 const create=p=>{created++;return {...p,x:24,y:10,path:[]};};
 const originalArray=current;
 reconcileCast(current,[c,a],cache,create);
 assert.equal(current,originalArray);assert.equal(current[1],a);assert.equal(created,1);
 assert.equal(a.x,13.4);assert.equal(a.path,path);assert.equal(a.direction,'left');assert.equal(a.stride,5);assert.equal(a.usingObject,object);
 reconcileCast(current,[b,a],cache,create);
 assert.equal(current[0],b);assert.equal(b.x,16);assert.equal(b.direction,'up');assert.equal(created,1);
 reconcileCast(current,[c,a],cache,create);assert.equal(created,1);
 assert.notEqual(castKey({name:'사울',identity:{id:'person:paul'}}),castKey(b));
 const occupied=[{x:2,y:5,path:[{x:5,y:5}]}];
 const spawn=findSpawnCell(occupied,(x,y)=>x===4&&y===5,()=>0);
 assert.ok(spawn);assert.ok(Math.hypot(spawn.x-2,spawn.y-5)>=2);assert.notDeepEqual(spawn,{x:4,y:5});assert.notDeepEqual(spawn,{x:5,y:5});
 assert.equal(findSpawnCell([],()=>true),null);
});

test('오브젝트 크기와 반응은 인물 동작에 맞추고 접근 표현은 저장된 위치를 바꾸지 않는다',async()=>{
 const {objectPresentation,interactionAnchor,objectInteractionFrame,drawObjectResponse}=await import('../js/features/pixel-bible/object-response.js');
 const {interactionRoutine}=await import('../js/features/pixel-bible/interaction-motion.js');
 const {OBJECT_CATALOG}=await import('../js/features/pixel-bible/object-catalog.js');
 const {drawWorldObject}=await import('../js/features/pixel-bible/art.js');
 assert.ok(objectPresentation('oil').scale*18<72);
 assert.ok(objectPresentation('tree').scale*27>72);
 assert.ok(objectPresentation('cup').scale<objectPresentation('well').scale);
 const o={kind:'oil',x:12,y:9},path=[{x:11,y:9}],n={name:'선지자 제자의 아내',x:11,y:9,path,usingObject:o,objectAction:'widow-oil',interactionStart:0};
 n.interaction=interactionRoutine(n,'oil');n.interaction.phase=0;
 const anchor=interactionAnchor(n);assert.ok(Math.abs(anchor.x-o.x*24)<24);
 assert.equal(n.x,11);assert.equal(n.y,9);assert.equal(n.path,path);
 const frames=[0,.25,.5,.75].map(t=>objectInteractionFrame(o,[n],t*n.interaction.period));
 assert.equal(new Set(frames.map(f=>f.phase)).size,4);
 assert.ok(frames.some(f=>f.tilt!==0));
 assert.equal(objectInteractionFrame(o,[],0).active,false);
 const still=[0,1,5].map(t=>objectInteractionFrame(o,[n],t,true));
 assert.equal(new Set(still.map(f=>f.phase)).size,1);
 const tree={kind:'tree',x:9,y:9},treeActor={name:'나무꾼',x:8,y:9,usingObject:tree,interactionStart:0};treeActor.interaction=interactionRoutine(treeActor,'tree');
 const treeFrames=[0,.25,.5,.75].map(t=>objectInteractionFrame(tree,[treeActor],t*treeActor.interaction.period));
 assert.ok(treeFrames.every(f=>f.dy===0&&f.tilt===0),'나무의 뿌리 위치는 상호작용 중에도 고정');
 const calls=[];const c={save(){},restore(){},translate(){},rotate(){},scale(x,y){calls.push(['scale',x,y]);},fillRect(...args){calls.push(['rect',...args]);}};
 for(const kind of [...Object.keys(OBJECT_CATALOG),'well','oil','tree','field','bench']){
  const object={kind,x:8,y:9};const npc={name:'룻',x:7,y:9,usingObject:object,interactionStart:0};npc.interaction=interactionRoutine(npc,kind);
  const frame=objectInteractionFrame(object,[npc],1);
  assert.ok(Number.isFinite(frame.scale)&&frame.scale>0);
  drawWorldObject(c,object,24,frame);drawObjectResponse(c,object,frame);
 }
 assert.ok(calls.some(c=>c[0]==='rect'));
});

test('오브젝트 옮기기는 원래 물건은 제외하고 다른 물건·인물·경로와 화면 밖을 거절한다',async()=>{
 const {canMoveObject}=await import('../js/features/pixel-bible/object-drag.js');
 const o={kind:'water',x:8,y:9},other={kind:'tree',x:12,y:9},objects=[o,other];
 const n={x:15,y:9,path:[{x:16,y:9}]};
 assert.equal(canMoveObject(o,{x:8,y:9},objects,[n]),true);
 assert.equal(canMoveObject(o,{x:9,y:8},objects,[n]),true);
 for(const p of [{x:12,y:9},{x:15,y:9},{x:16,y:9},{x:1,y:9},{x:9,y:70},{x:9.5,y:8}])assert.equal(canMoveObject(o,p,objects,[n]),false);
 assert.deepEqual(o,{kind:'water',x:8,y:9});
});

test('짧은 고유 대사를 우선하고 다른 인물 관계 설명을 독백에 섞지 않는다',async()=>{
 const {personalLines}=await import('../js/features/pixel-bible/personal-lines.js');
 const {buildChapterDialogue}=await import('../js/features/pixel-bible/chapter-dialogue.js');
 const chapters=[{code:'rut',name:'룻기',chap:2,data:{people:[{name:'룻',role:'이삭을 줍는 며느리'},{name:'보아스',role:'밭 주인'}],rels:[{from:'보아스',to:'룻',label:'보호',verses:'8-9',note:'보아스는 룻에게 같은 밭에서 일하고 일꾼들이 길어 온 물을 마시도록 허락했습니다.'}]}}];
 const context=buildChapterDialogue(chapters),p=context.people.find(p=>p.name==='룻');
 const lines=personalLines({...p,refs:[p.ref]},chapters,context);
 assert.ok(lines.every(l=>l.origin==='authored'));
 assert.ok(lines.every(l=>l.detailText!==context.relations[0].text));
 assert.ok(lines.every(l=>l.ref.startsWith('룻기 2:')));
 assert.ok(lines.every(l=>!l.text.includes('얽힌 일')));

});

test('카메라는 확대 지점을 보존하고 확대·축소한 화면 좌표를 같은 월드 좌표로 되돌린다',async()=>{
 const {cameraView,toWorld,zoomAt,constrainCamera,WORLD}=await import('../js/features/pixel-bible/camera.js');
 const cam={x:1200,y:800,zoom:1},point={x:640,y:220},width=1280,height=700;
 const anchor=toWorld(point,width,height,cam);zoomAt(cam,1.8,point,width,height);
 const after=toWorld(point,width,height,cam);assert.ok(Math.abs(anchor.x-after.x)<.001&&Math.abs(anchor.y-after.y)<.001);
 const v=cameraView(width,height,cam);const projected={x:anchor.x*v.scale+v.x,y:anchor.y*v.scale+v.y};assert.ok(Math.abs(projected.x-point.x)<.001);
 Object.assign(cam,{x:-1000,y:1e6,zoom:.01});constrainCamera(cam,width,height);assert.ok(cam.x>0&&cam.y<WORLD.height&&cam.zoom>=.4);
});

test('핀치 중심 이동과 가장자리 스크롤은 상하좌우 방향을 반영한다',async()=>{
 const {pinchCamera,toWorld,edgePan}=await import('../js/features/pixel-bible/camera.js');
 const cam={x:1400,y:800,zoom:1},anchor=toWorld({x:600,y:300},1280,700,cam);
 pinchCamera(cam,anchor,2,{x:700,y:400},1280,700);const current=toWorld({x:700,y:400},1280,700,cam);assert.ok(Math.abs(current.x-anchor.x)<.001&&Math.abs(current.y-anchor.y)<.001);
 const rect={left:0,top:0,width:1280,height:700};assert.ok(edgePan({x:1275,y:695},rect,.05,1).x>0);assert.ok(edgePan({x:5,y:5},rect,.05,1).y<0);assert.deepEqual(edgePan({x:640,y:350},rect,.05,1),{x:0,y:0});
});

test('관련 인물이 방문한 물건도 다른 인물이 다음에 사용하도록 차례를 준다',async()=>{
 const {rankObjectVisits,objectVisitKey}=await import('../js/features/pixel-bible/object-scenes.js');
 const o={kind:'ark-covenant',x:11,y:8},a={name:'사무엘'},b={name:'엘리'},objectCooldown=new Map(),visitors=new Map();
 const pairs=[{n:a,o,evidence:{},distance:2},{n:b,o,distance:3}];assert.equal(rankObjectVisits(pairs,0,objectCooldown,visitors)[0].n,a);
 visitors.set(objectVisitKey(a,o),0);objectCooldown.set(o,0);assert.equal(rankObjectVisits(pairs,4,objectCooldown,visitors).length,0);
 assert.equal(rankObjectVisits(pairs,10,objectCooldown,visitors)[0].n,b);
});

test('큰 나무는 뒤쪽 접근을 막고 수관 밖에서 상호작용한다',async()=>{
 const {interactionApproaches,interactionAnchor}=await import('../js/features/pixel-bible/object-response.js');
 const o={kind:'tree',x:10,y:10};
 assert.deepEqual(interactionApproaches(o),[{x:9,y:10},{x:11,y:10},{x:10,y:11}]);
 const n={x:9,y:10,usingObject:o,interaction:{category:'tree'}};
 const left=interactionAnchor(n);assert.ok(left.x<o.x*24-60);assert.equal(left.y,n.y*24,'나무 사용 중에도 발 위치는 접근 타일에 유지한다');
 n.x=10;n.y=11;assert.equal(interactionAnchor(n).y,n.y*24,'큰 오브젝트 정면에서도 인물을 들어 올리지 않는다');
});

test('일반 오브젝트 상호작용의 발 위치는 언제나 접근 타일에 고정한다',async()=>{
 const {interactionAnchor}=await import('../js/features/pixel-bible/object-response.js');
 for(const kind of ['well','tree','field','altar','basket','water']){
  const o={kind,x:10,y:10},n={x:9,y:10,usingObject:o,interaction:{category:'tool',gesture:'inspect'}};
  assert.equal(interactionAnchor(n).y,n.y*24,`${kind} 상호작용의 수직 위치`);
 }
});

test('물항아리는 제자리에 두고 잔을 입으로 올려 마신다',async()=>{
 const {heldObject,drinkingCup}=await import('../js/features/pixel-bible/object-response.js');
 const {interactionPose}=await import('../js/features/pixel-bible/interaction-motion.js');
 const n={direction:'right',usingObject:{kind:'water',x:10,y:10},interaction:{kind:'water',category:'water',gesture:'drink',variant:0,phase:0,period:4},interactionStart:0};
 assert.equal(heldObject(n,2),null);
 const lift=drinkingCup(n,interactionPose(n.interaction,1),100,100),drink=drinkingCup(n,interactionPose(n.interaction,2),100,100);
 assert.equal(drink.kind,'cup');assert.ok(drink.y<lift.y);assert.ok(Math.abs(drink.frame.tilt)<=.25);
});

test('겹쳐 선 인물도 대화할 때만 서로 다른 축 좌표에 자리를 잡는다',async()=>{
 const {planConversation,opposedDirections}=await import('../js/features/pixel-bible/conversation.js');
 const {findPath}=await import('../js/features/pixel-bible/world.js');
 const a={x:5,y:5},b={x:5,y:5},other={x:6,y:6,path:[{x:6,y:5},{x:7,y:5}]};
 const blocked=(x,y)=>x<0||x>10||y<0||y>10;
 const p=planConversation(a,b,[a,b,other],blocked,findPath);
 assert.ok(p);assert.ok(p.route.length);assert.ok(opposedDirections(p.anchor,p.destination));
});

test('현재 장의 사건 대사는 구체적인 물건·행동과 감정을 갖고 다른 장에 섞이지 않는다',async()=>{
 const {chapterMonologues}=await import('../js/features/pixel-bible/context-monologues.js');
 const {speechEmotion}=await import('../js/features/pixel-bible/expression.js');
 const lines=chapterMonologues({name:'엘리야'},[{code:'1ki',chap:19}]);
 assert.equal(lines.length,3);assert.ok(lines.some(l=>l.text.includes('로뎀나무')));
 assert.equal(speechEmotion(lines[0]),'sad');assert.equal(speechEmotion(lines[2]),'surprised');
 assert.equal(chapterMonologues({name:'엘리야'},[{code:'1ki',chap:21}]).length,0);
 assert.equal(speechEmotion({text:'전혀 다른 문장',emotion:'joy'}),'joy');
});

test('다니엘서 인물 독백은 각 장의 포로·왕궁·환상 상황에 맞고 1인칭과 해당 장 참조를 유지한다',async()=>{
 const {chapterMonologues}=await import('../js/features/pixel-bible/context-monologues.js');
 const chapterNames=[1,2,4,5,6,7,8,9,10,11,12];let authored=0;
 for(const chap of chapterNames){const lines=chapterMonologues({name:chap===4?'다니엘(벨드사살)':'다니엘'},[{code:'dan',chap}]);assert.equal(lines.length,2,`다니엘 ${chap}장`);assert.ok(lines.every(line=>line.ref.startsWith(`다니엘 ${chap}:`)));assert.ok(lines.some(line=>/(?:내가|나는|우리|나를|내게|내)/.test(line.text)));authored+=lines.length;}
 assert.equal(chapterMonologues({name:'다니엘'},[{code:'dan',chap:3}]).length,0,'다니엘은 풀무불 사건 현장에 없었다');
 assert.equal(chapterMonologues({name:'사드락'},[{code:'dan',chap:3}]).length,2);
 assert.equal(authored,22);
});

test('호세아와 고멜의 독백은 표징 결혼과 회복 장면에 맞게 1인칭으로 이어진다',async()=>{
 const {chapterMonologues}=await import('../js/features/pixel-bible/context-monologues.js');
 for(const [name,chap]of [['호세아',1],['고멜',1],['호세아',3],['고멜',3]]){const lines=chapterMonologues({name},[{code:'hos',chap}]);assert.equal(lines.length,2);assert.ok(lines.every(line=>line.ref.startsWith(`호세아 ${chap}:`)));assert.ok(lines.some(line=>/(?:내가|나는|내 |내게)/.test(line.text)));}
});

test('요엘의 재앙 경고와 회개 촉구 독백은 해당 장의 1인칭 발화다',async()=>{
 const {chapterMonologues}=await import('../js/features/pixel-bible/context-monologues.js');
 for(const chap of [1,2]){const lines=chapterMonologues({name:'요엘'},[{code:'jol',chap}]);assert.equal(lines.length,2);assert.ok(lines.every(line=>line.ref.startsWith(`요엘 ${chap}:`)));assert.ok(lines.every(line=>/(?:나는|내가)/.test(line.text)));}
});

test('아모스의 독백은 벧엘 제사장과 맞선 소명·심판 장면을 1인칭으로 표현한다',async()=>{
 const {chapterMonologues}=await import('../js/features/pixel-bible/context-monologues.js');
 const lines=chapterMonologues({name:'아모스'},[{code:'amo',chap:7}]);assert.equal(lines.length,2);assert.ok(lines.every(line=>line.ref.startsWith('아모스 7:')));assert.ok(lines.every(line=>/(?:나는|내가)/.test(line.text)));
});

test('156종 모든 물건은 의미에 맞는 동작 계열과 운반·접근 규칙을 갖는다',async()=>{
 const {OBJECT_CATALOG}=await import('../js/features/pixel-bible/object-catalog.js');
 const {objectBehavior}=await import('../js/features/pixel-bible/object-behavior.js');
 const {INTERACTION_MOTIONS,interactionRoutine}=await import('../js/features/pixel-bible/interaction-motion.js');
 const {interactionApproaches,heldObject,objectWorn}=await import('../js/features/pixel-bible/object-response.js');
 for(const kind of Object.keys(OBJECT_CATALOG)){
  const behavior=objectBehavior(kind),routine=interactionRoutine({name:'룻'},kind),o={kind,x:10,y:10};
  assert.ok(INTERACTION_MOTIONS[behavior.category],kind);assert.equal(routine.category,kind==='ark-covenant'?'bush':behavior.category,kind);
  if(behavior.frontOnly)assert.ok(interactionApproaches(o).every(p=>p.y>=o.y),kind);
  const n={name:'룻',x:9,y:10,direction:'right',usingObject:o,interaction:{...routine,phase:0},interactionStart:0};
  assert.equal(!!heldObject(n,routine.period*.3)||objectWorn(n,routine.period*.3),behavior.carry&&!(routine.gesture==='drink'&&kind!=='cup'),kind);
 }
 for(const [kind,category]of Object.entries({table:'table',bed:'bed',temple:'building',tent:'building',crown:'wear',lamp:'lamp',rainbow:'symbol',chariot:'cart',basket:'basket',book:'scroll',trumpet:'instrument'}))assert.equal(objectBehavior(kind).category,category,kind);
 assert.equal(objectBehavior('ark-covenant').carry,false);
});

test('최대 축소는 전체 지형을 담고 지도보다 큰 뷰포트 축은 중앙에 고정한다',async()=>{
 const {WORLD,homeCamera,constrainCamera,cameraView}=await import('../js/features/pixel-bible/camera.js');
 for(const [width,height] of [[1280,700],[844,390],[1920,1080]]){
  const cam=homeCamera();assert.equal(cam.x,WORLD.width/2);assert.equal(cam.y,WORLD.height/2);
  cam.zoom=.001;cam.x=-9999;cam.y=99999;constrainCamera(cam,width,height);
  const v=cameraView(width,height,cam);
  assert.ok(v.x>=-.001&&v.y>=-.001);assert.ok(v.x+WORLD.width*v.scale<=width+.001);assert.ok(v.y+WORLD.height*v.scale<=height+.001);
  assert.equal(cam.x,WORLD.width/2);assert.equal(cam.y,WORLD.height/2);
 }
});

test('주요 인물 선택과 관계 추천은 현재 분량의 신원·출처를 보존한다',async()=>{
 const {majorCast,recommendedCast}=await import('../js/features/pixel-bible/exposure.js');
 const a={name:'갑',weight:3,refs:['창세기 2장']},b={name:'을',weight:1,refs:['창세기 2장']},other={name:'을',weight:1,refs:['열왕기상 1장']};
 const model={cast:[a,b,other],scenes:[],relations:[{from:'갑',to:'을',label:'가족',sourceRef:'창세기 2장'}]};
 assert.deepEqual(majorCast(model),[a]);assert.deepEqual(recommendedCast(model,a).map(r=>r.person),[b]);
});

test('많은 인물의 초기 위치와 옛 월드의 물건도 새 범위 안에 보존한다',async()=>{
 const {castPositions}=await import('../js/features/pixel-bible/world.js');const {BOUNDS}=await import('../js/features/pixel-bible/camera.js');
 const {fitLayout}=await import('../js/features/pixel-bible/layout.js');
 for(const count of [1,25,100,2259]){const positions=castPositions(count);assert.equal(positions.length,count);assert.ok(positions.every(p=>p.x>=BOUNDS.minX&&p.x<=BOUNDS.maxX&&p.y>=BOUNDS.minY&&p.y<=BOUNDS.maxY));}
 const old=[{kind:'stone',x:12,y:12},{kind:'stone',x:110,y:65},{kind:'tree',x:111,y:66}];
 const next=fitLayout(old,{stone:true,tree:true});assert.equal(next.length,3);assert.deepEqual(next[0],old[0]);assert.equal(new Set(next.map(o=>o.x+':'+o.y)).size,3);assert.ok(next.every(o=>o.x<=BOUNDS.maxX&&o.y<=BOUNDS.maxY));
});

test('명시한 본문만 묘사 기반 배경을 고르고 다른 본문은 기본 지형을 쓴다',async()=>{
 const {defaultBackground}=await import('../js/features/pixel-bible/backgrounds.js');
 for(const [code,chap,expected]of [['gen',2,'garden'],['rut',2,'harvest'],['mat',4,'galilee'],['rev',22,'newcity'],['rom',8,'meadow']])assert.equal(defaultBackground([{code,chap}]),expected);
});

test('커서가 잡은 지점은 이동·배율 변환 뒤에도 같은 상대 좌표를 유지한다',async()=>{
 const {grabOffset,grabbedOrigin}=await import('../js/features/pixel-bible/grab.js');
 const start={x:12.2,y:8.6},origin={x:13,y:11},grab=grabOffset(start,origin);
 const held={p:{x:40.5,y:21.3},grab},after=grabbedOrigin(held);
 assert.ok(Math.abs(after.x-held.p.x-(origin.x-start.x))<1e-9);assert.ok(Math.abs(after.y-held.p.y-(origin.y-start.y))<1e-9);
});

test('전체 오브젝트는 같은 인물이 여섯 번 방문하면 여섯 결과를 선택한다',async()=>{
 const {OBJECT_CATALOG}=await import('../js/features/pixel-bible/object-catalog.js');
 const {interactionOptions,interactionRoutine}=await import('../js/features/pixel-bible/interaction-motion.js');
 for(const kind of Object.keys(OBJECT_CATALOG)){
  assert.ok(interactionOptions(kind).length>=6,kind);
  assert.equal(new Set(Array.from({length:6},(_,i)=>interactionRoutine({name:'읽는 사람'},kind,i).id)).size,6,kind);
 }
});

test('옷 입기와 화살 발사는 실제 착용·손 소품·발사 상태가 달라진다',async()=>{
 const {interactionPose}=await import('../js/features/pixel-bible/interaction-motion.js');
 const {heldObject,objectWorn}=await import('../js/features/pixel-bible/object-response.js');
 const n={x:10,y:10,direction:'right',usingObject:{kind:'cloak',x:11,y:10},interaction:{kind:'cloak',category:'cloth',gesture:'wear',variant:0,phase:0,period:4},interactionStart:0};
 assert.equal(interactionPose(n.interaction,0).wearing,false);assert.equal(objectWorn(n,1.1),false);assert.equal(heldObject(n,2.1),null);assert.equal(objectWorn(n,3.1),true);assert.equal(objectWorn(n,4.1),true);
 n.usingObject.kind='arrow';n.interaction={kind:'arrow',category:'weapon',gesture:'shoot',variant:0,phase:0,period:4};
 assert.equal(heldObject(n,1.1),null);assert.equal(objectWorn(n,1.1),true);assert.equal(heldObject(n,2.1),null);assert.equal(objectWorn(n,2.1),true);
});

test('성경 전용 동작은 화자 신원과 해당 장의 물건에만 적용한다',async()=>{
 const {uniqueInteraction}=await import('../js/features/pixel-bible/unique-interactions.js');
 const {interactionRoutine}=await import('../js/features/pixel-bible/interaction-motion.js');
 const n={name:'요나단',readingChapters:[{code:'1sa',chap:20}]};
 assert.equal(uniqueInteraction(n,'arrow').gesture,'three-arrows');assert.equal(interactionRoutine(n,'arrow').unique,true);
 assert.equal(uniqueInteraction({...n,readingChapters:[{code:'1sa',chap:18}]},'arrow'),null);
 assert.equal(uniqueInteraction({...n,name:'다윗'},'arrow'),null);
 assert.equal(uniqueInteraction({name:'요셉',readingChapters:[{code:'mat',chap:1}]},'cloak'),null);
});
