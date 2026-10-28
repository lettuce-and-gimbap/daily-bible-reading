import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildWorldModel, findPath, clientToCanvasPoint, touchSlopPixels, initialWorldRange } from '../js/features/pixel-bible/world.js';
import {speechView,BUBBLE_LIMIT,objectContextSpeech} from '../js/features/pixel-bible/speech-view.js';
import {scopeChapterSummary} from '../js/features/pixel-bible/qt-scope.js';
import {scenesForChapters} from '../js/features/pixel-bible/scenes.js';
import {isMentionOnlyPerson,mentionOnlyChapterNames} from '../js/features/pixel-bible/mention-only.js';
import {resolveIdentity} from '../js/features/pixel-bible/identity.js';

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

test('에스라의 중복 집단·동명이인을 정리하고 혼인 관계와 귀환 인물을 구분한다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/ezr.json',import.meta.url),'utf8'));
 const ch3=buildWorldModel([{code:'ezr',name:'에스라',chap:3,data:summary.chapters[3]}]);
 assert.ok(!ch3.cast.some(person=>person.name==='이웃 민족'));
 const ch4=buildWorldModel([{code:'ezr',name:'에스라',chap:4,data:summary.chapters[4]}]);
 assert.ok(ch4.cast.some(person=>person.name==='대적들'));
 assert.ok(!ch4.cast.some(person=>person.name==='그 땅 사람들'));
 assert.ok(summary.chapters[4].people.some(person=>person.name==='그 땅 사람들'),'본문 인물 색인의 원래 표기는 보존한다');
 assert.equal(ch4.cast.filter(person=>person.name==='대적들').length,1,'같은 이웃 집단의 제안자·방해자를 한 캐릭터로 병합한다');
 const ch6=buildWorldModel([{code:'ezr',name:'에스라',chap:6,data:summary.chapters[6]}]);
 assert.ok(!ch6.cast.some(person=>['고레스','아닥사스다'].includes(person.name)));
 assert.ok(ch6.cast.some(person=>person.name==='다리오'));
 const ch9=buildWorldModel([{code:'ezr',name:'에스라',chap:9,data:summary.chapters[9]}]);
 assert.ok(!ch9.cast.some(person=>person.name==='백성과 제사장'));
 assert.ok(ch9.relations.some(r=>r.to==='백성과 제사장'),'고발된 집단과 관계 근거는 유지한다');
 const ch10=buildWorldModel([{code:'ezr',name:'에스라',chap:10,data:summary.chapters[10]}]);
 assert.ok(ch10.cast.some(person=>person.name==='이방 아내와 자녀들'));
 assert.ok(ch10.relations.some(r=>r.from==='백성'&&r.to==='이방 아내와 자녀들'&&r.kind==='family'));
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('스가랴(잇도의 아들)',{code:'ezr',chapter:5}).id,resolveIdentity('스가랴(잇도의 손자)',{code:'ezr',chapter:6}).id);
 assert.equal(resolveIdentity('예수아',{code:'ezr',chapter:3}).id,resolveIdentity('여호수아',{code:'hag',chapter:1}).id);
 assert.equal(resolveIdentity('여호수아',{code:'hag',chapter:1}).id,resolveIdentity('예수아',{code:'neh',chapter:12}).id);
 assert.notEqual(resolveIdentity('예수아',{code:'ezr',chapter:3}).id,resolveIdentity('여호수아',{code:'jos',chapter:1}).id);
 assert.notEqual(resolveIdentity('느헤미야(귀환자)',{code:'ezr',chapter:2}).id,resolveIdentity('느헤미야',{code:'neh',chapter:1}).id);
 assert.notEqual(resolveIdentity('모르드개(귀환자)',{code:'ezr',chapter:2}).id,resolveIdentity('모르드개',{code:'est',chapter:2}).id);
});

test('느헤미야에서 과거 조상·언급 인물은 현장 캐스트에서 빼되 근거 관계를 남긴다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/neh.json',import.meta.url),'utf8'));
 const cases={1:['모세'],5:['이전 총독들'],7:['스룹바벨'],9:['아브라함','모세','조상들','선지자들'],11:['아삽'],12:['예수아','스룹바벨'],13:['산발랏']};
 for(const [chapter,names] of Object.entries(cases)){
  const model=buildWorldModel([{code:'neh',name:'느헤미야',chap:Number(chapter),data:summary.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name),`느헤미야 ${chapter}장 ${name}은 그 장면에 없는 인물이다`);
 }
 const ch9=buildWorldModel([{code:'neh',name:'느헤미야',chap:9,data:summary.chapters[9]}]);
 assert.ok(ch9.relations.some(r=>r.from==='하나님'&&r.to==='아브라함'),'과거 언약 관계는 유지한다');
 const ch13=buildWorldModel([{code:'neh',name:'느헤미야',chap:13,data:summary.chapters[13]}]);
 assert.ok(ch13.relations.some(r=>r.from==='엘리아십의 손자(요야다의 아들)'&&r.to==='산발랏'&&r.label==='사위'),'산발랏과의 혼인 관계는 실제 사위 인물에 연결한다');
 assert.ok(ch13.relations.some(r=>r.from==='느헤미야'&&r.to==='엘리아십의 손자(요야다의 아들)'),'쫓겨난 당사자와 느헤미야의 갈등은 직접 연결한다');
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
 const examples=[['1co',10,'모세'],['2co',3,'모세'],['exo',13,'요셉'],['jhn',4,'야곱'],['jos',24,'요셉'],['jos',12,'모세'],['jos',14,'모세'],['jdg',8,'아비멜렉'],['jdg',9,'기드온'],['rut',1,'엘리멜렉'],['rut',1,'말론'],['rut',1,'기룐'],['rut',2,'엘리멜렉'],['rut',4,'베레스'],['rut',4,'이새'],['rut',4,'다윗'],['1sa',5,'다곤'],['1sa',5,'다곤의 제사장들'],['1sa',7,'아모리 사람들'],['1sa',12,'모세'],['1sa',12,'아론'],['1sa',12,'시스라'],['1sa',12,'여룹바알'],['1sa',12,'베단'],['1sa',12,'입다'],['1sa',12,'나하스'],['1sa',14,'기스'],['1sa',14,'아히노암'],['1sa',14,'메랍'],['1sa',14,'미갈'],['1sa',21,'골리앗'],['1sa',21,'사울'],['1sa',21,'다윗의 소년들'],['1sa',25,'사무엘'],['1sa',25,'미갈'],['1sa',25,'발디'],['1sa',27,'사울'],['1sa',29,'사울'],['2sa',1,'사울'],['2sa',1,'요나단'],['2sa',3,'암논'],['2sa',3,'압살롬'],['2sa',3,'아도니야'],['2sa',4,'므비보셋'],['2sa',4,'아브넬'],['2sa',5,'솔로몬'],['2sa',6,'사울'],['2sa',7,'다윗의 후손'],['2sa',8,'아비아달'],['2sa',8,'아히둡'],['2sa',8,'아힐룻'],['2sa',9,'요나단'],['2sa',10,'나하스'],['2sa',11,'엘리암'],['2sa',12,'우리아'],['2sa',12,'비유 속 부자'],['2sa',12,'비유 속 가난한 사람'],['2sa',13,'시므아'],['2sa',13,'달매'],['2sa',14,'압살롬의 딸'],['2sa',14,'비유 속 두 아들'],['2sa',14,'여인의 친족들'],['2sa',16,'게라'],['2sa',19,'압살롬'],['2sa',20,'압살롬'],['2sa',20,'다윗의 후궁 열 명'],['2sa',22,'사울'],['2sa',22,'다윗의 후손'],['1ch',4,'유다'],['1ch',4,'갈렙(여분네의 아들)'],['1ch',5,'르우벤'],['1ch',5,'요셉'],['1ch',5,'유다'],['1ch',6,'레위'],['1ch',6,'아론'],['1ch',6,'사독'],['1ch',6,'여호사닥'],['1ch',7,'여호수아'],['1ch',9,'사울'],['1ch',9,'요나단'],['1ch',9,'므립바알'],['1ch',9,'다윗'],['1ch',9,'사무엘'],['1ch',10,'다윗'],['1ch',17,'다윗의 아들'],['1ch',19,'나하스'],['1ch',23,'아론'],['1ch',23,'모세'],['1ch',24,'엘르아살'],['1ch',24,'이다말'],['1ch',29,'사무엘·나단·갓'],['est',9,'하만'],['psa',105,'아브라함'],['rom',9,'아브라함'],['luk',16,'아브라함']];
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

test('이사야 48장의 회고·일반 범주는 배우에서 빠지고 이사야 51장 조상 부부선은 양방향이다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/isa.json',import.meta.url),'utf8'));
 for(const name of ['갈대아인','악인']){
  assert.ok(isMentionOnlyPerson({name},{code:'isa',chapter:48}),`${name}은 이사야 48장의 현장 배우가 아님`);
 }
 const couple=summary.chapters['51'].rels.find(r=>r.from==='사라'&&r.to==='아브라함');
 assert.ok(couple,'이사야 51장은 아브라함과 사라를 함께 조상으로 제시함');
 assert.equal(couple.directed,false,'부부 관계선을 한쪽 방향으로 표시하지 않음');
});

test('예레미야 1–4장의 계보·연대·예언 비유는 현장 배우에서 빠지고 4장 애곡 관계는 본문 대상을 가리킨다',()=>{
 for(const [chapter,names] of [[1,['힐기야','요시야']],[2,['애굽과 앗수르']],[3,['요시야','마음에 합한 목자']],[4,['북방의 사자','딸 시온']]]){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'jer',chapter}),`${chapter}장 ${name}은 현장 배우가 아님`);
 }
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const lament=summary.chapters['4'].rels.find(r=>r.from==='예레미야');
 assert.equal(lament,undefined,'예레미야 4:19은 애곡이지 백성과 주고받는 상호작용이 아님');
 assert.ok(!buildWorldModel([{code:'jer',name:'예레미야',chap:4,data:summary.chapters['4']}]).cast.some(person=>person.name==='딸 시온'));
});

test('예레미야의 과거 중보자·죄의 원인으로만 나온 인물은 11·15·19장 장면에 세우지 않는다',()=>{
 for(const [chapter,names] of [[11,['조상들']],[15,['모세와 사무엘','므낫세']],[19,['유다 왕들']]]){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'jer',chapter}),`${chapter}장 ${name}은 회고·원인으로만 언급됨`);
 }
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const kings=summary.chapters['19'].people.find(p=>p.name==='유다 왕들');
 assert.match(kings.role,/책임이 있는 통치자/);
 assert.match(summary.chapters['19'].rels.find(r=>r.from==='유다 왕들').note,/모든 왕이 직접 저질렀다고 단정하지 않아요/);
});

test('마태복음 1장의 족보 인물은 요셉의 꿈 장면에 등장시키지 않고 본문 근거를 과장하지 않는다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/mat.json',import.meta.url),'utf8'));
 const chapter=summary.chapters['1'];
 const model=buildWorldModel([{code:'mat',name:'마태복음',chap:1,data:chapter}]);
 for(const name of ['아브라함','다윗','솔로몬','요시야','여고냐','이사야'])assert.ok(!model.cast.some(person=>person.name===name),`${name}은 족보·예언 인용으로만 언급됨`);
 assert.match(chapter.story,/마리아를 드러내지 않으려고/);
 assert.doesNotMatch(chapter.story,/돌에 맞지/);
 assert.match(chapter.rels.find(relation=>relation.from==='마리아'&&relation.to==='요셉').note,/본문은.*직접 말하지 않아요/);
});

test('산상설교의 예화 인물과 비교 대상 집단은 실제 장면 배우로 세우지 않는다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/mat.json',import.meta.url),'utf8'));
 for(const [chapter,names] of [[5,['서기관과 바리새인']],[6,['외식하는 자']],[7,['거짓 선지자','지혜로운 사람','어리석은 사람']],[13,['원수','씨 뿌리는 자','마리아']],[18,['왕','무자비한 종','동료 종']],[21,['악한 농부들']],[22,['왕']],[23,['서기관과 바리새인']],[24,['거짓 그리스도','충성된 종','악한 종']],[25,['슬기 있는 처녀들','미련한 처녀들','신랑','주인','충성된 종들','게으른 종']]]){
  const data=summary.chapters[chapter];
  const model=buildWorldModel([{code:'mat',name:'마태복음',chap:chapter,data}]);
  for(const name of names){
   assert.ok(data.people.some(person=>person.name===name),`${chapter}장 설명에 사용된 ${name} 기록은 보존`);
   assert.ok(isMentionOnlyPerson({name},{code:'mat',chapter}),`${chapter}장 ${name}은 실제 참석자가 아님`);
   assert.ok(!model.cast.some(person=>person.name===name),`${chapter}장 ${name}은 장면 배우가 아님`);
  }
 }
 const chapter9=summary.chapters['9'];
 assert.match(chapter9.rels.find(relation=>relation.from==='관리'&&relation.to==='예수').note,/마태복음 본문에는 이름이나 회당장 직함이 나오지 않아요/);
 assert.doesNotMatch(chapter9.story,/회당장의 딸/);
 const chapter20=summary.chapters['20'];
 assert.equal(isMentionOnlyPerson({name:'세베대의 아들들의 어머니'},{code:'mat',chapter:20}),false,'야고보와 요한의 어머니는 실제로 예수께 청함');
 assert.match(summary.chapters['19'].rels.find(relation=>relation.to==='부자 청년').note,/직접 기록하지 않아요/);
 assert.match(chapter20.rels.find(relation=>relation.from==='야고보'&&relation.to==='요한').note,/마태복음은 이때 이후 두 사람의 생애를 기록하지 않아요/);
});

test('마태복음 28장의 두 여인 모두 천사의 소식을 듣고 부활하신 예수를 만난다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/mat.json',import.meta.url),'utf8'));
 const relations=summary.chapters['28'].rels;
 for(const name of ['막달라 마리아','다른 마리아']){
  assert.ok(relations.some(relation=>relation.from==='주의 천사'&&relation.to===name&&(relation.verses.includes('5-7')||relation.verses.includes('5-8'))));
  assert.ok(relations.some(relation=>relation.from==='예수'&&relation.to===name&&relation.verses==='9-10'));
 }
});

test('마가복음 1·3장의 시몬은 베드로와 같은 제자이며 안드레의 나이는 본문에 없는 정보로 남긴다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/mrk.json',import.meta.url),'utf8'));
 const model=buildWorldModel([1,3].map(chap=>({code:'mrk',name:'마가복음',chap,data:summary.chapters[chap]})));
 const peter=model.cast.filter(person=>person.identity?.id==='person:베드로');
 assert.equal(peter.length,1);
 assert.ok(peter[0].refs.includes('마가복음 1장'));
 assert.ok(peter[0].refs.includes('마가복음 3장'));
 assert.match(summary.chapters['1'].rels.find(relation=>relation.from==='시몬'&&relation.to==='안드레').note,/본문은 둘 가운데 누가 형인지 말하지 않아요/);
 assert.ok(summary.chapters['1'].rels.some(relation=>relation.from==='야고보'&&relation.to==='요한'&&relation.label==='형제'));
 assert.ok(summary.chapters['3'].rels.some(relation=>relation.from==='마리아'&&relation.to==='예수'&&relation.label==='어머니'));
});

test('마가복음 2장의 레위는 마태와 같은 제자이고 4장의 씨 뿌리는 자는 현장 인물이 아니다',()=>{
 const mark=JSON.parse(fs.readFileSync(new URL('../data/summary/mrk.json',import.meta.url),'utf8'));
 const matthew=JSON.parse(fs.readFileSync(new URL('../data/summary/mat.json',import.meta.url),'utf8'));
 const combined=buildWorldModel([
  {code:'mrk',name:'마가복음',chap:2,data:mark.chapters['2']},
  {code:'mat',name:'마태복음',chap:9,data:matthew.chapters['9']}
 ]);
 const levy=combined.cast.filter(person=>person.identity?.id==='person:마태');
 assert.equal(levy.length,1);
 assert.ok(levy[0].refs.includes('마가복음 2장'));
 assert.ok(levy[0].refs.includes('마태복음 9장'));
 const sower=mark.chapters['4'].people.find(person=>person.name==='씨 뿌리는 자');
 assert.ok(sower);
 assert.ok(isMentionOnlyPerson(sower,{code:'mrk',chapter:4}));
 assert.ok(!buildWorldModel([{code:'mrk',name:'마가복음',chap:4,data:mark.chapters['4']}]).cast.some(person=>person.name==='씨 뿌리는 자'));
 for(const chapter of Object.values(mark.chapters).slice(0,5)){
  assert.doesNotMatch(chapter.story,/\d/,'일반 서술의 수량은 한글로 적는다');
  for(const relation of chapter.rels)assert.doesNotMatch(relation.note,/\d/,'관계 설명의 수량은 한글로 적는다');
 }
});

test('마가복음 12장의 악한 농부들은 포도원 비유의 인물이라 현장 출연에서 제외한다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/mrk.json',import.meta.url),'utf8'));
 const farmers=summary.chapters['12'].people.find(person=>person.name==='악한 농부들');
 assert.ok(farmers);
 assert.ok(isMentionOnlyPerson(farmers,{code:'mrk',chapter:12}));
 assert.ok(!buildWorldModel([{code:'mrk',name:'마가복음',chap:12,data:summary.chapters['12']}]).cast.some(person=>person.name==='악한 농부들'));
});

test('마가복음 15–16장의 야고보와 요세의 어머니 마리아를 한 인물로 이어 주고 현장 여인 관계를 보존한다',async()=>{
 const mark=JSON.parse(fs.readFileSync('data/summary/mrk.json','utf8'));
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('야고보와 요세의 어머니 마리아',{code:'mrk',chapter:15}).id,resolveIdentity('야고보의 어머니 마리아',{code:'mrk',chapter:16}).id);
 const ch15=mark.chapters['15'];
 assert.ok(ch15.people.some(person=>person.name==='살로메'));
 assert.ok(ch15.rels.some(relation=>relation.from==='살로메'&&relation.to==='예수'&&relation.verses==='40-41'));
 assert.match(ch15.rels.find(relation=>relation.from==='구레네 사람 시몬').note,/본문이 설명하지는 않아요/);
 assert.doesNotMatch(ch15.rels.find(relation=>relation.from==='막달라 마리아').note,/부활의 첫 증인/);
});

test('누가복음 1장의 요셉은 약혼 관계로만 언급되므로 월드 캐스트에 세우지 않는다',()=>{
 const luke=JSON.parse(fs.readFileSync('data/summary/luk.json','utf8'));
 const model=buildWorldModel([{code:'luk',name:'누가복음',chap:1,data:luke.chapters['1']}]);
 assert.ok(!model.cast.some(person=>person.name==='요셉'));
 assert.ok(luke.chapters['1'].rels.some(relation=>relation.from==='마리아'&&relation.to==='요셉'&&relation.label==='약혼한 사이'),'관계 출처는 해설 DB에 보존한다');
});

test('누가복음 2장은 마리아와 요셉을 약혼 관계로 표기하고 확인되지 않은 황제 선전 설명을 덧붙이지 않는다',()=>{
 const luke=JSON.parse(fs.readFileSync('data/summary/luk.json','utf8'));
 const ch2=luke.chapters['2'];
 const engagement=ch2.rels.find(relation=>relation.from==='마리아'&&relation.to==='요셉');
 assert.equal(engagement.label,'약혼한 사이');
 assert.match(engagement.note,/약혼한 마리아/);
 assert.doesNotMatch(ch2.story,/로마는 황제를 구주라 부르며/);
});

test('누가복음 3장의 연대 표기 인물은 월드에서 제외하고 요한의 옥행에 참여한 헤롯은 남긴다',()=>{
 const luke=JSON.parse(fs.readFileSync('data/summary/luk.json','utf8'));
 const model=buildWorldModel([{code:'luk',name:'누가복음',chap:3,data:luke.chapters['3']}]);
 assert.ok(!model.cast.some(person=>person.name==='빌라도'));
 assert.ok(!model.cast.some(person=>person.name==='헤로디아'));
 assert.ok(model.cast.some(person=>person.name==='헤롯'));
});

test('누가복음 5–6장의 시몬 베드로와 레위는 앞선 복음서의 동일 인물로 잇고 열심당원 시몬과 구분한다',async()=>{
 const luke=JSON.parse(fs.readFileSync('data/summary/luk.json','utf8'));
 const {canonicalPersonName,resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(canonicalPersonName('시몬',{code:'luk',chapter:5}),'베드로');
 assert.equal(resolveIdentity('시몬',{code:'luk',chapter:5}).id,resolveIdentity('베드로',{code:'mrk',chapter:1}).id);
 assert.equal(resolveIdentity('레위',{code:'luk',chapter:5}).id,resolveIdentity('마태',{code:'mat',chapter:10}).id);
 assert.notEqual(resolveIdentity('시몬(열심당원)',{code:'luk',chapter:6}).id,resolveIdentity('시몬 베드로',{code:'luk',chapter:6}).id);
});

test('누가복음 7–12장의 서술·비유 인물을 현장 배우에서 분리하고 실제 질문 대화는 관계로 남긴다',async()=>{
 const luke=JSON.parse(fs.readFileSync(new URL('../data/summary/luk.json',import.meta.url),'utf8'));
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 for(const [chapter,names] of [[8,['구사']],[9,['헤롯']],[10,['강도 만난 사람','제사장','레위인','사마리아 사람']],[11,['한밤중의 친구']],[12,['어리석은 부자','충성된 청지기']]]){
  const model=buildWorldModel([{code:'luk',name:'누가복음',chap:chapter,data:luke.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name),`${chapter}장 ${name}은 현장 출연자가 아님`);
 }
 assert.ok(luke.chapters['7'].people.some(person=>person.name==='요한의 제자들'));
 assert.ok(luke.chapters['7'].rels.some(relation=>relation.from==='예수'&&relation.to==='요한의 제자들'&&relation.verses==='18-23'));
 assert.ok(luke.chapters['7'].rels.some(relation=>relation.from==='예수'&&relation.to==='시몬'&&relation.verses==='40-47'));
 assert.equal(resolveIdentity('막달라 마리아',{code:'luk',chapter:8}).id,resolveIdentity('막달라 마리아',{code:'mrk',chapter:16}).id);
 assert.doesNotMatch(luke.chapters['8'].story, /\d/,'일반 해설의 수량은 한글로 표기한다');
});

test('누가복음 13–18장의 비유 인물은 제외하고 실제로 예수를 만난 이들의 관계는 보존한다',()=>{
 const luke=JSON.parse(fs.readFileSync(new URL('../data/summary/luk.json',import.meta.url),'utf8'));
 const excluded={13:['포도원지기','포도원 주인'],14:['잔치 주인','핑계한 자들','가난한 자들'],15:['아버지','둘째 아들','맏아들'],16:['옳지 않은 청지기','주인','부자','나사로','아브라함'],18:['과부','불의한 재판장','바리새인','세리']};
 for(const [chapter,names] of Object.entries(excluded)){
  const model=buildWorldModel([{code:'luk',name:'누가복음',chap:Number(chapter),data:luke.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name),`${chapter}장 ${name}은 비유 속 인물`);
 }
 assert.ok(luke.chapters['13'].rels.some(relation=>relation.from==='바리새인'&&relation.verses==='31-33'));
 assert.ok(luke.chapters['17'].rels.some(relation=>relation.to==='바리새인'&&relation.verses==='20-21'));
 assert.ok(luke.chapters['18'].rels.some(relation=>relation.to==='어린아이들'&&relation.verses==='15-17'));
});

test('누가복음 19–24장의 비유·예언 대상은 분리하고 부활 장면의 인물 신원과 천사 분류를 바로잡는다',async()=>{
 const luke=JSON.parse(fs.readFileSync(new URL('../data/summary/luk.json',import.meta.url),'utf8'));
 const mark=JSON.parse(fs.readFileSync(new URL('../data/summary/mrk.json',import.meta.url),'utf8'));
 for(const [chapter,names] of [[19,['귀인','충성된 종','악한 종']],[20,['악한 농부들','가이사']],[21,['이방인']]]){
  const model=buildWorldModel([{code:'luk',name:'누가복음',chap:Number(chapter),data:luke.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name),`${chapter}장 ${name}은 예언·비유 대상`);
 }
 const combined=buildWorldModel([
  {code:'luk',name:'누가복음',chap:24,data:luke.chapters['24']},
  {code:'mrk',name:'마가복음',chap:16,data:mark.chapters['16']}
 ]);
 assert.equal(combined.cast.filter(person=>person.identity?.id==='person:mary-mother-of-james-and-joses').length,1);
 assert.equal(combined.cast.find(person=>person.name==='천사들')?.identity?.kind,'spiritual');
 for(const name of ['막달라 마리아','요안나','야고보의 어머니 마리아']){
  assert.ok(luke.chapters['24'].rels.some(relation=>relation.from===name&&relation.to==='열한 제자'));
 }
});

test('예레미야 21–30장의 시대 표기·과거 왕·미래 메시아 인물은 장면 배우에서 분리한다',()=>{
 const chapters=[
  [21,['느부갓네살']],[22,['살룸','요시야','고니야']],[23,['의로운 가지']],
  [24,['시드기야','여고냐','느부갓네살']],[25,['느부갓네살']],[26,['미가','우리야']],
  [27,['느부갓네살']],[28,['시드기야','여고냐']],[30,['다윗 왕','백성의 통치자']],
 ];
 for(const [chapter,names] of chapters){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'jer',chapter}),`${chapter}장 ${name}은 현장 배우가 아님`);
 }
});

test('예레미야 31–40장의 상징·선조·장소 소유자는 빼고 두 이스마엘은 분리한다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 for(const [chapter,names] of [[31,['라헬','에브라임']],[33,['다윗의 의로운 가지','레위인 제사장']],[35,['요나답']],[36,['사반']],[38,['말기야']]]){
  for(const name of names){
   assert.ok(isMentionOnlyPerson({name},{code:'jer',chapter}),`${chapter}장 ${name}은 실제 장면 배우가 아님`);
   const model=buildWorldModel([{code:'jer',name:'예레미야',chap:chapter,data:summary.chapters[String(chapter)]}]);
   assert.ok(!model.cast.some(person=>person.name===name),`${chapter}장 ${name}은 월드 캐스트에서 제외됨`);
  }
 }
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 const AbrahamIshmael=resolveIdentity('이스마엘',{code:'gen',chapter:21,role:'아브라함의 아들'});
 const JeremiahIshmael=resolveIdentity('이스마엘',{code:'jer',chapter:40,role:'느다냐의 아들'});
 assert.notEqual(AbrahamIshmael.id,JeremiahIshmael.id,'그달리야를 노린 왕족은 아브라함의 아들과 다른 인물');
 assert.equal(JeremiahIshmael.canonicalName,'이스마엘(느다냐의 아들)');
 assert.equal(JeremiahIshmael.id,resolveIdentity('이스마엘',{code:'jer',chapter:41,role:'느다냐의 아들'}).id,'예레미야 40–41장의 인물은 한 명으로 이어짐');
});

test('예레미야의 열방 예언·표제 인물은 장면 캐스트에서 빼고 두 스라야를 구분한다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/jer.json',import.meta.url),'utf8'));
 const cases={43:['느부갓네살'],44:['바로 호브라'],45:['여호야김'],46:['바로 느고','느부갓네살','애굽 군대','야곱'],47:['블레셋','바로','북쪽 군대'],48:['모압','모압의 제사장과 고관'],49:['암몬','에돔','다메섹','게달과 하솔','엘람','느부갓네살'],50:['바벨론','벨과 므로닥','이스라엘과 유다','북쪽 나라','느부갓네살'],51:['바벨론','메대 왕들','이스라엘','시드기야']};
 for(const [chapter,names] of Object.entries(cases)){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'jer',chapter}),`${chapter}장 ${name}은 예언의 대상·표제 인물이지 발화 장면 현장 인물이 아님`);
  const model=buildWorldModel([{code:'jer',name:'예레미야',chap:Number(chapter),data:summary.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name),`${chapter}장 ${name}은 월드 캐스트에서 제외됨`);
 }
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 const envoy=resolveIdentity('스라야',{code:'jer',chapter:51,role:'네리야의 아들 병참감'});
 const highPriest=resolveIdentity('스라야',{code:'jer',chapter:52,role:'대제사장'});
 assert.notEqual(envoy.id,highPriest.id,'바벨론에 두루마리를 전한 스라야와 예루살렘 함락 때 죽임당한 대제사장 스라야는 동명이인');
 assert.equal(envoy.canonicalName,'스라야(네리야의 아들)');
 assert.equal(highPriest.canonicalName,'스라야(대제사장)');
 assert.equal(summary.chapters['50'].rels.length,4,'현장 캐스트를 줄여도 예언의 관계 근거는 보존한다');
});

test('예레미야애가의 시온·유다 의인화는 장별 중복 없이 공동체로 합치고 사로잡힌 왕은 시드기야다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/lam.json',import.meta.url),'utf8'));
 const chapters=[1,2,4,5].map(chap=>({code:'lam',name:'예레미야애가',chap,data:summary.chapters[String(chap)]}));
 const model=buildWorldModel(chapters);
 assert.equal(model.cast.filter(person=>person.identity?.id==='group:jerusalem-personified-community').length,1,'1–2장의 시온 의인화는 한 공동체');
 assert.equal(model.cast.find(person=>person.identity?.id==='group:jerusalem-personified-community').name,'예루살렘(시온)');
 assert.equal(model.cast.filter(person=>person.identity?.id==='group:lamentations-judah-survivors').length,1,'4–5장의 생존 공동체는 한 집단');
 assert.ok(!model.cast.some(person=>person.name==='기름 부음 받은 왕'),'함정에 빠진 왕은 회고되는 인물이지 장면 배우가 아님');
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('기름 부음 받은 왕',{code:'lam',chapter:4}).id,resolveIdentity('시드기야',{code:'2ki',chapter:25,role:'유다 왕'}).id);
});

test('에스겔 1–7장의 표제·예언 대상은 현장 배우에서 빼고 환상 속 존재는 동정체를 유지한다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const cases={1:['여호야긴'],2:['이스라엘 자손'],3:['이스라엘 족속','악인과 의인'],4:['이스라엘 족속','유다 족속','예루살렘 주민'],5:['예루살렘','열방'],6:['이스라엘 족속','남은 자'],7:['이스라엘 땅의 백성','선지자와 제사장과 장로','왕과 고관']};
 for(const [chapter,names] of Object.entries(cases)){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'ezk',chapter}),`에스겔 ${chapter}장 ${name}은 장면 밖의 대상`);
  const model=buildWorldModel([{code:'ezk',name:'에스겔',chap:Number(chapter),data:summary.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name));
 }
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('베옷 입은 서기관',{code:'ezk',chapter:9}).id,resolveIdentity('베옷 입은 사람',{code:'ezk',chapter:10}).id,'심판 표를 기록하고 숯불을 흩는 환상 인물은 이어진 장에서 같은 존재');
 assert.equal(resolveIdentity('유다 장로들',{code:'ezk',chapter:8}).id,resolveIdentity('장로 칠십 명',{code:'ezk',chapter:8}).id,'환상에서 나온 장로 묘사는 한 집단으로 묶는다');
 assert.equal(resolveIdentity('시드기야',{code:'ezk',chapter:17}).id,resolveIdentity('기름 부음 받은 왕',{code:'lam',chapter:4}).id,'두루마리·애가의 시드기야는 같은 유다 왕');
 assert.equal(resolveIdentity('여고냐',{code:'jer',chapter:22}).id,resolveIdentity('여호야긴',{code:'ezk',chapter:1}).id,'여고냐와 여호야긴은 같은 포로기 유다 왕');
 assert.equal(resolveIdentity('둘째 사자 새끼',{code:'ezk',chapter:19}).id,resolveIdentity('여호야긴',{code:'ezk',chapter:1}).id,'에스겔 19장의 둘째 사자 비유는 여호야긴을 가리킨다');
});

test('에스겔 11–20장의 예언 대상·비유 인물은 현장 배우에서 분리한다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const cases={11:['예루살렘 주민','포로 된 형제들'],12:['예루살렘의 왕(시드기야)','반역하는 족속'],13:['거짓 선지자들','거짓 여선지자들','이스라엘 백성','의인'],14:['노아','다니엘','욥','남은 아들딸'],15:['예루살렘 주민'],16:['사마리아','소돔','애굽과 앗수르와 갈대아'],17:['바벨론 왕','여호야긴','시드기야','애굽 왕','연한 가지'],18:['이스라엘 족속','의로운 사람','강포한 아들','의로운 손자'],19:['암사자 어머니','첫째 사자 새끼','둘째 사자 새끼','이스라엘 고관들'],20:['조상들','이스라엘 족속']};
 for(const [chapter,names] of Object.entries(cases)){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'ezk',chapter}),`에스겔 ${chapter}장 ${name}은 말씀의 대상·회고·비유 인물`);
  const model=buildWorldModel([{code:'ezk',name:'에스겔',chap:Number(chapter),data:summary.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name));
 }
 const sixteenth=buildWorldModel([{code:'ezk',name:'에스겔',chap:16,data:summary.chapters['16']}]);
 assert.ok(sixteenth.cast.some(person=>person.identity?.id==='group:jerusalem-personified-community'),'예루살렘 의인화는 인간 개인이 아니라 공동체로 표현한다');
});

test('에스겔 21–30장의 국가 심판 예언은 대상 국가·과거 인물을 현장 배우로 만들지 않는다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const cases={21:['바벨론 왕','시드기야','마땅히 얻을 자','암몬'],22:['예루살렘','고관들','선지자들','제사장들','나그네와 고아와 과부'],23:['오홀라(사마리아)','오홀리바(예루살렘)','앗수르 사람들','갈대아 사람들','애굽'],24:['바벨론 왕','예루살렘','포로 백성'],25:['암몬','모압과 세일','에돔','블레셋','유다 족속'],26:['두로','느부갓네살','바다의 왕들'],27:['두로','무역하는 나라들','뱃사람들'],28:['두로 왕','다니엘','시돈','이스라엘'],29:['바로','애굽','이스라엘 족속','느부갓네살'],30:['애굽','바로','구스와 붓과 룻','느부갓네살']};
 for(const [chapter,names] of Object.entries(cases)){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'ezk',chapter}),`에스겔 ${chapter}장 ${name}은 심판 예언의 대상·비유 인물`);
  const model=buildWorldModel([{code:'ezk',name:'에스겔',chap:Number(chapter),data:summary.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name));
 }
});

test('에스겔 31–48장의 상징·회복 예언 인물은 분리하고 실제 전령·성전 안내자는 이어 붙인다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/ezk.json',import.meta.url),'utf8'));
 const cases={31:['바로','앗수르','능한 자'],32:['바로','바벨론 왕','앗수르와 엘람','메섹과 두발과 에돔'],34:['이스라엘 목자들','내 종 다윗'],35:['세일산(에돔)','이스라엘'],36:['이스라엘 족속','원수 나라들','이스라엘 산들'],37:['유다와 요셉','내 종 다윗'],38:['곡','연합한 나라들','이스라엘','스바·드단·다시스 상인들'],39:['곡','이스라엘 족속','사나운 새와 짐승','이방인들'],40:['사독 자손 제사장','이스라엘 족속'],41:['그룹'],42:['제사장들','백성'],43:['이스라엘 족속','사독 자손 제사장'],44:['왕','우상을 따른 레위인','사독 자손 제사장','이방인'],45:['이스라엘의 통치자들','제사장','레위인','이스라엘 족속'],46:['왕(군주)','백성','제사장들'],47:['어부들','타국인','열두 지파'],48:['열두 지파','사독 자손 제사장','레위인','왕(군주)']};
 for(const [chapter,names] of Object.entries(cases)){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'ezk',chapter}),`에스겔 ${chapter}장 ${name}은 비유·예언의 대상이지 현장 배우가 아님`);
  const model=buildWorldModel([{code:'ezk',name:'에스겔',chap:Number(chapter),data:summary.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name));
 }
 const chapter33=buildWorldModel([{code:'ezk',name:'에스겔',chap:33,data:summary.chapters['33']}]);
 assert.ok(chapter33.cast.some(person=>person.name==='도망한 자'),'예루살렘 함락을 알린 실제 전령은 유지한다');
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('놋 같은 사람',{code:'ezk',chapter:40}).id,resolveIdentity('측량하는 사람',{code:'ezk',chapter:48}).id,'성전 환상 안내자는 아홉 장 동안 한 존재');
});

test('다니엘서의 바벨론식 이름은 본명과 통합하고 환상 속 상징·인용 인물은 현장 캐스트에서 분리한다',async()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/dan.json',import.meta.url),'utf8'));
 const cases={1:['느부갓네살','여호야김'],3:['사드락·메삭·아벳느고'],5:['느부갓네살','다리오'],7:['네 짐승','작은 뿔','옛적부터 항상 계신 이','성도들'],8:['숫양','숫염소','작은 뿔'],9:['예레미야','이스라엘 백성','기름 부음 받은 자','다리오'],10:['고레스'],11:['남방 왕','북방 왕','비천한 왕','하나님을 아는 백성','지혜로운 자'],12:['지혜 있는 자','책에 기록된 백성']};
 for(const [chapter,names] of Object.entries(cases)){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'dan',chapter}),`다니엘 ${chapter}장 ${name}은 현장 인물이 아니라 표제·예언·회고의 대상`);
  const model=buildWorldModel([{code:'dan',name:'다니엘',chap:Number(chapter),data:summary.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name));
 }
 const chapters=[1,4].map(chap=>({code:'dan',name:'다니엘',chap,data:summary.chapters[String(chap)]}));
 const model=buildWorldModel(chapters);
 assert.equal(model.cast.filter(person=>person.identity?.id==='person:daniel').length,1,'다니엘과 벨드사살은 같은 인물');
 assert.ok(!model.cast.some(person=>person.name==='벨드사살'));
 const ch3=buildWorldModel([{code:'dan',name:'다니엘',chap:3,data:summary.chapters['3']}]);
 assert.equal(ch3.cast.filter(person=>['사드락','메삭','아벳느고'].includes(person.name)).length,3,'바벨론식 이름을 받은 세 유다 사람은 각각 한 번씩 표시');
 assert.ok(!ch3.cast.some(person=>person.name==='사드락·메삭·아벳느고'),'세 친구 묶음은 개별 인물과 중복되지 않음');
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('가브리엘',{code:'dan',chapter:8}).id,resolveIdentity('가브리엘',{code:'dan',chapter:9}).id);
 assert.equal(resolveIdentity('세마포 입은 이',{code:'dan',chapter:10}).id,resolveIdentity('세마포 입은 이',{code:'dan',chapter:12}).id);
 assert.equal(resolveIdentity('바사 왕국의 군주',{code:'dan',chapter:10}).kind,'spiritual');
 assert.equal(resolveIdentity('헬라 군주',{code:'dan',chapter:10}).kind,'spiritual');
});

test('호세아서의 표징 자녀는 실제 인물로 남기고 오라클 속 왕국·미래 왕은 NPC로 만들지 않는다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/hos.json',import.meta.url),'utf8'));
 const ch1=buildWorldModel([{code:'hos',name:'호세아',chap:1,data:summary.chapters['1']}]);
 for(const name of ['고멜','이스르엘','로루하마','로암미'])assert.ok(ch1.cast.some(person=>person.name===name),`호세아 1장의 실제 가족 ${name}을 유지`);
 const cases={2:['이스라엘','암미','루하마'],3:['이스라엘 자손','다윗'],4:['이스라엘 백성','제사장','에브라임'],5:['에브라임','유다','제사장과 왕족','야렙 왕'],6:['이스라엘 백성','에브라임','유다','제사장 무리'],7:['에브라임','사마리아','애굽과 앗수르','왕들'],8:['이스라엘','에브라임','유다'],9:['이스라엘','에브라임','선지자'],10:['이스라엘','에브라임','사마리아 주민','야렙 왕'],11:['이스라엘','에브라임','앗수르'],12:['에브라임','유다'],13:['에브라임','사마리아','왕'],14:['이스라엘','에브라임','고아','앗수르']};
 for(const [chapter,names] of Object.entries(cases)){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'hos',chapter}));
  const model=buildWorldModel([{code:'hos',name:'호세아',chap:Number(chapter),data:summary.chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name),`호세아 ${chapter}장 ${name}은 예언의 대상이지 현장 인물이 아님`);
 }
 const ch14=buildWorldModel([{code:'hos',name:'호세아',chap:14,data:summary.chapters['14']}]);
 assert.ok(ch14.cast.some(person=>person.name==='호세아'),'회개를 직접 권하는 선지자는 유지');
 assert.ok(summary.chapters['14'].rels.length===4,'관계 근거 자료는 현장 출연 여부와 별도로 보존');
});

test('요엘·아모스의 표제 왕과 예언의 미래 청중은 빼고 아모스 7장의 실제 대립 인물은 남긴다',()=>{
 const joel=JSON.parse(fs.readFileSync(new URL('../data/summary/jol.json',import.meta.url),'utf8'));
 const amos=JSON.parse(fs.readFileSync(new URL('../data/summary/amo.json',import.meta.url),'utf8'));
 for(const [chapter,names] of [[2,['만민']],[3,['열국','두로와 시돈과 블레셋','유다와 예루살렘']]]){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'jol',chapter}));
  const model=buildWorldModel([{code:'jol',name:'요엘',chap:chapter,data:joel.chapters[String(chapter)]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name));
 }
 for(const [chapter,names] of [[1,['웃시야와 여로보암']],[3,['아스돗과 애굽']],[6,['일으키실 나라']],[9,['다윗의 장막','구스와 블레셋과 아람']]]){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'amo',chapter}));
  const model=buildWorldModel([{code:'amo',name:'아모스',chap:chapter,data:amos.chapters[String(chapter)]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name));
 }
 const ch7=buildWorldModel([{code:'amo',name:'아모스',chap:7,data:amos.chapters['7']}]);
 for(const name of ['아모스','아마샤','여로보암'])assert.ok(ch7.cast.some(person=>person.name===name),`아모스 7장의 실제 대립 인물 ${name}은 남긴다`);
});

test('소선지서의 회고·미래 예언 인물은 걸러내고 요나·학개·스가랴 환상 장면은 보존한다',async()=>{
 const summary=Object.fromEntries(['oba','jnh','mic','nam','hag','zec'].map(code=>[code,JSON.parse(fs.readFileSync(new URL(`../data/summary/${code}.json`,import.meta.url),'utf8'))]));
 const cases={oba:{1:['에돔','야곱 족속','이방인','구원자들']},mic:{1:['유다 성읍 사람들'],2:['탐욕스러운 자들','부녀와 어린 자녀','거짓 선지자','야곱의 남은 자'],3:['야곱의 우두머리들','거짓 선지자들','제사장들','백성'],4:['민족들','시온의 백성','저는 자와 쫓겨난 자','많은 이방'],5:['다스릴 자','야곱의 남은 자','이스라엘 재판자','앗수르'],6:['이스라엘 백성','모세와 아론과 미리암','발락','발람','부자들'],7:['지도자와 재판관','원수']},nam:{1:['니느웨 사람들','유다 백성','좋은 소식을 전하는 자'],2:['니느웨 사람들','침공군대','니느웨 여성들','이스라엘 백성','니느웨 왕후'],3:['니느웨 사람들','앗수르 왕','피해를 입은 나라들']},zec:{1:['조상들'],3:['내 종 싹'],7:['조상들','과부와 고아와 나그네'],8:['노인과 아이들','남은 백성','이방 백성 열 명'],9:['시온 주민','겸손한 왕','두로와 시돈과 블레셋','갇힌 자들','헬라 자손'],12:['예루살렘 주민','다윗의 족속','찔린 이','모든 민족','나단과 레위와 시므이 족속'],13:['다윗의 족속과 예루살렘 주민','거짓 선지자','내 목자, 내 짝 된 자','흩어질 양','남은 3분의 1'],14:['예루살렘 백성','열국','거룩한 자들','남은 자들']}};
 for(const [code,chapters] of Object.entries(cases))for(const [chapter,names] of Object.entries(chapters)){
  for(const name of names)assert.ok(isMentionOnlyPerson({name},{code,chapter}),`${code} ${chapter}장 ${name}은 과거·미래/상징 대상`);
  const model=buildWorldModel([{code,name:code,chap:Number(chapter),data:summary[code].chapters[chapter]}]);
  for(const name of names)assert.ok(!model.cast.some(person=>person.name===name));
 }
 const jonah=buildWorldModel([{code:'jnh',name:'요나',chap:4,data:summary.jnh.chapters['4']}]);
 assert.ok(jonah.cast.some(person=>person.name==='요나'));
 assert.equal(jonah.cast.find(person=>person.name==='박넝쿨')?.identity?.kind,'plant','박넝쿨은 사람 DB가 아니라 식물로 분류');
 const fish=buildWorldModel([{code:'jnh',name:'요나',chap:2,data:summary.jnh.chapters['2']}]).cast.find(person=>person.name==='큰 물고기');
 assert.equal(fish?.identity?.kind,'animal','큰 물고기는 사람 DB가 아니라 동물로 분류');
 const hag=buildWorldModel([{code:'hag',name:'학개',chap:1,data:summary.hag.chapters['1']}]);
 for(const name of ['학개','스룹바벨','예수아','남은 백성'])assert.ok(hag.cast.some(person=>person.name===name),`학개 ${name}은 실제 성전 재건 장면에 참여`);
 const zech=buildWorldModel([{code:'zec',name:'스가랴',chap:1,data:summary.zec.chapters['1']}]);
 assert.ok(zech.cast.some(person=>person.name==='대장장이 4명'),'환상에서 뿔을 흩는 장면 존재자는 유지');
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('에돔',{code:'oba',chapter:1,role:'배신한 나라'}).kind,'group','나라 표상은 한 인간처럼 분류하지 않는다');
});

test('욥기의 회상 인물·가정 예시는 월드 배우에서 빠지고 관계 발화자는 본문 화자와 일치한다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/job.json',import.meta.url),'utf8'));
 const events=JSON.parse(fs.readFileSync(new URL('../data/pixel-bible/events/job.json',import.meta.url),'utf8'));
 assert.equal(Object.values(summary.chapters).reduce((total,chapter)=>total+chapter.rels.length,0),91);
 const cases=[['4','영'],['8','욥의 자녀들'],['19','욥의 아내'],['19','형제와 친척'],['19','대속자'],['21','악인'],['24','가난한 자들'],['27','악인'],['29','성문의 사람들'],['30','조롱하는 젊은이들'],['31','종들'],['32','바라겔'],['33','중보자'],['34','지혜 있는 자들'],['35','압제받는 사람들']];
 for(const [chapter,name] of cases){
  assert.ok(isMentionOnlyPerson({name},{code:'job',chapter}));
  const data=summary.chapters[chapter],eventScenes=[...(events.scenes||[]),...(events.restoredScenes||[])].filter(scene=>scene.chapter===Number(chapter));
  const model=buildWorldModel([{code:'job',name:'욥기',chap:Number(chapter),data:{...data,eventScenes}}]);
  assert.ok(!model.cast.some(person=>person.name===name),`욥기 ${chapter}장 ${name}은 현장 배우가 아님`);
  assert.ok(model.scenes.every(scene=>!scene.actors.includes(name)),`욥기 ${chapter}장 ${name}은 장면 배우가 아님`);
 }
 const fifth=summary.chapters['5'].rels;
 assert.ok(fifth.some(edge=>edge.from==='엘리바스'&&edge.to==='욥'&&edge.verses==='8, 17-18'));
 assert.ok(!fifth.some(edge=>edge.from==='하나님'&&edge.to==='욥'));
 for(const chapter of ['10','23'])assert.ok(!summary.chapters[chapter].rels.some(edge=>edge.from==='하나님'&&edge.to==='욥'));
});

test('시편 1–120편의 표제 인물과 회고 인물은 현장 캐스트에서 제외하고 집단 표현을 구분한다',()=>{
 const summary=JSON.parse(fs.readFileSync(new URL('../data/summary/psa.json',import.meta.url),'utf8'));
 const events=JSON.parse(fs.readFileSync(new URL('../data/pixel-bible/events/psa.json',import.meta.url),'utf8'));
 const cases=[['3','압살롬'],['7','구시'],['18','사울'],['34','아비멜렉'],['39','여두둔'],['45','왕의 아들들'],['51','나단'],['51','밧세바'],['52','도엑'],['52','아히멜렉'],['54','십 사람들'],['57','사울'],['59','사울'],['60','요압'],['77','야곱과 요셉의 자손'],['78','에브라임 자손'],['83','시스라'],['88','친구와 사랑하는 자'],['91','천사들'],['103','모세'],['110','멜기세덱'],['114','이스라엘'],['118','건축자들'],['132','다윗'],['132','다윗의 자손'],['133','아론'],['135','바로'],['135','시혼'],['135','옥'],['136','바로'],['136','시혼과 옥'],['137','에돔 자손'],['137','바벨론']];
 for(const [chapter,name] of cases){
  assert.ok(isMentionOnlyPerson({name},{code:'psa',chapter}),`시편 ${chapter}편 ${name}의 범위 표시`);
  const data=summary.chapters[chapter],eventScenes=[...(events.scenes||[]),...(events.restoredScenes||[])].filter(scene=>scene.chapter===Number(chapter));
  const model=buildWorldModel([{code:'psa',name:'시편',chap:Number(chapter),data:{...data,eventScenes}}]);
  assert.ok(!model.cast.some(person=>person.name===name),`시편 ${chapter}편 ${name}은 현장 배우가 아님`);
  assert.ok(model.scenes.every(scene=>!scene.actors.includes(name)),`시편 ${chapter}편 ${name}은 장면 배우가 아님`);
 }
 const reviewed=Object.entries(summary.chapters);
 assert.equal(reviewed.length,150);
 assert.equal(reviewed.reduce((total,[,chapter])=>total+chapter.rels.length,0),432);
 assert.ok(summary.chapters['85'].people.some(person=>person.name==='이스라엘'));
 assert.ok(!summary.chapters['85'].people.some(person=>person.name==='야곱'));
 assert.ok(summary.chapters['85'].rels.some(edge=>edge.from==='하나님'&&edge.to==='이스라엘'));
 assert.ok(summary.chapters['135'].people.some(person=>person.name==='이스라엘'));
 assert.ok(!summary.chapters['135'].people.some(person=>person.name==='야곱'));
 assert.ok(summary.chapters['135'].rels.some(edge=>edge.from==='하나님'&&edge.to==='이스라엘'));
});

test('본문 인물 색인의 언급 표시는 별도 사건 장면 배우 목록에도 적용한다',()=>{
 const mention={name:'언급된 조상',role:'본문에 이름이 언급되는 인물 · 실제 현장 동석 여부는 구절에서 확인해요.'};
 const scene={id:'mention-check',code:'test',chapter:1,title:'과거 이야기',actors:[mention.name],object:'scroll',ref:'시험 1:1',verseNumbers:[1],lines:[],study:'설명',animation:{version:2,mode:'illustration',motif:'symbolic',lead:mention.name,target:mention.name,setting:'vision',effect:'symbol',emotion:'neutral',prop:'scroll',beats:[{action:'look',actor:mention.name}],duration:1}};
 const model=buildWorldModel([{code:'test',name:'시험',chap:1,data:{people:[mention],eventScenes:[scene]}}]);
 assert.ok(!model.cast.some(person=>person.name===mention.name));
 assert.deepEqual(model.scenes.find(item=>item.id===scene.id).actors,[]);
 assert.equal(model.scenes.find(item=>item.id===scene.id).animation.lead,null);
 assert.equal(model.scenes.find(item=>item.id===scene.id).animation.target,null);
 assert.ok(model.scenes.find(item=>item.id===scene.id).animation.beats.every(beat=>beat.actor===null));
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
 assert.equal(PAIR_DIALOGUE.length,940);for(const p of PAIR_DIALOGUE){assert.ok(p.speaker&&p.target&&p.ref&&p.chapter);assert.ok(p.lines.length>0);}
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


test('요한복음 1장의 파견 질문과 바리새인 재질문을 구분하고 실제 관계선을 보존한다',async()=>{
 const summary=JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));
 const chapter=summary.chapters['1'];
 assert.ok(chapter.people.some(p=>p.name==='바리새인'));
 assert.ok(chapter.rels.some(r=>r.from==='제사장과 레위인'&&r.to==='요한'&&r.verses==='19-22'));
 assert.ok(chapter.rels.some(r=>r.from==='바리새인'&&r.to==='요한'&&r.verses==='24-28'));
 assert.ok(chapter.rels.some(r=>r.from==='요한'&&r.to==='안드레'&&r.verses==='35-37'));
 const {NEW_TESTAMENT_DIALOGUE_ROWS}=await import('../js/features/pixel-bible/nt-dialogue.js');
 const rows=NEW_TESTAMENT_DIALOGUE_ROWS.filter(r=>r[0]==='jhn'&&r[1]===1);
 assert.ok(rows.some(r=>r[2]==='바리새인'&&r[6].includes('25')));
 const delegation=rows.find(r=>r[2]==='제사장과 레위인');
 assert.ok(delegation&&delegation[6].every(ref=>ref!=='25'));
});


test('요한복음 2장은 실제 가나 잔치와 성전 논쟁의 행위자 응답을 구체적으로 연결한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));const chapter=summary.chapters['2'];
 assert.ok(chapter.rels.some(r=>r.from==='예수'&&r.to==='하인들'&&r.verses==='7-8'));
 assert.ok(chapter.rels.some(r=>r.from==='연회장'&&r.to==='신랑'&&r.verses==='9-10'));
 assert.ok(chapter.rels.some(r=>r.from==='유대인들'&&r.to==='예수'&&r.verses==='18-20'));
 assert.ok(!chapter.story.includes('큰 망신'));
});


test('요한복음 3장은 회상 속 모세를 현장 캐스트에서 빼고 니고데모 문답 근거를 정확히 둔다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));const chapter=summary.chapters['3'];
 assert.ok(chapter.people.some(p=>p.name==='모세'),'회상된 인물은 색인에는 보존한다');
 assert.ok(chapter.rels.some(r=>r.from==='니고데모'&&r.to==='예수'&&r.verses==='1-10'&&r.note.includes('어떻게 다시 날 수 있느냐')));
 assert.ok(chapter.story.includes('밤에 예수님을 찾아와요.'));assert.ok(!chapter.story.includes('눈을 피하려'));
 const model=buildWorldModel([{code:'jhn',name:'요한복음',chap:3,data:chapter}]);
 assert.ok(!model.cast.some(p=>p.name==='모세'));
});


test('요한복음 4–5장의 역사적 언급 인물은 월드에 세우지 않고 본문 사실을 과장하지 않는다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));
 for(const [chap,name]of [[4,'야곱'],[5,'요한'],[5,'모세']]){const model=buildWorldModel([{code:'jhn',name:'요한복음',chap,data:summary.chapters[String(chap)]}]);assert.ok(!model.cast.some(p=>p.name===name),`jhn.${chap} ${name} is a cited figure`);}
 assert.ok(!summary.chapters['4'].story.includes('사람들 눈을 피'));
 assert.ok(summary.chapters['4'].rels.some(r=>r.from==='왕의 신하'&&r.to==='예수'&&r.verses==='46-50'));
 assert.equal(summary.chapters['5'].rels.filter(r=>['요한','모세'].includes(r.from)&&r.to==='예수').length,0);
});


test('요한복음 8·10장의 회상·비유 인물은 실제 관계 대화 대상으로 만들지 않는다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));
 for(const [chap,names]of [[8,['아브라함','마귀']],[10,['요한','양들','삯꾼','도둑']]]){const model=buildWorldModel([{code:'jhn',name:'요한복음',chap,data:summary.chapters[String(chap)]}]);for(const name of names)assert.ok(!model.cast.some(p=>p.name===name),`jhn.${chap} ${name} only cited / figurative`);}
 assert.ok(!summary.chapters['8'].rels.some(r=>r.from==='유대인들'&&r.to==='아브라함'));
 assert.ok(!summary.chapters['10'].rels.some(r=>['양들','삯꾼','도둑'].includes(r.from)||['양들','삯꾼','도둑'].includes(r.to)));
});


test('요한복음 11–15장의 관계는 실제 자매 대화·요청 전달을 담고 언급 인물은 분리한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));
 const c11=summary.chapters['11'];assert.ok(c11.rels.some(r=>r.from==='예수'&&r.to==='마르다'&&r.verses==='21-27'));assert.ok(c11.rels.some(r=>r.from==='예수'&&r.to==='마리아'&&r.verses==='32-35'));
 const c12=summary.chapters['12'];assert.ok(c12.rels.some(r=>r.from==='빌립'&&r.to==='안드레'&&r.verses==='20-22'));assert.ok(c12.rels.some(r=>r.from==='안드레'&&r.to==='예수'&&r.verses==='21-22'));assert.ok(!c12.rels.find(r=>r.from==='무리'&&r.to==='예수').note.includes('로마를 몰아낼'));
 for(const [chap,names]of [[13,['가룟 시몬','사탄']],[15,['세상']]]){const model=buildWorldModel([{code:'jhn',name:'요한복음',chap,data:summary.chapters[String(chap)]}]);for(const name of names)assert.ok(!model.cast.some(p=>p.name===name),`jhn.${chap} ${name} is not a scene character`);}
 assert.ok(!summary.chapters['13'].rels.some(r=>r.to==='가룟 시몬'||r.from==='사탄'));assert.ok(!summary.chapters['15'].rels.some(r=>r.from==='세상'));
});


test('요한복음 16–21장은 추상 집단·회상 인물과 실제 수난·부활 대면을 구분한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/jhn.json',import.meta.url),'utf8'));
 for(const [chap,names]of [[16,['세상']],[17,['세상','믿을 사람들','멸망의 자식']]]){const model=buildWorldModel([{code:'jhn',name:'요한복음',chap,data:summary.chapters[String(chap)]}]);for(const name of names)assert.ok(!model.cast.some(p=>p.name===name),`jhn.${chap} ${name} is discourse/reference only`);}
 assert.ok(!summary.chapters['16'].rels.some(r=>r.from==='세상'||r.to==='세상'));assert.ok(!summary.chapters['17'].rels.some(r=>r.from==='믿을 사람들'||r.to==='믿을 사람들'));
 assert.ok(summary.chapters['19'].story.includes('히브리어, 라틴어, 그리스어'));assert.ok(summary.chapters['19'].story.includes('아리마대 요셉과 니고데모'));
 const c20=summary.chapters['20'];assert.ok(c20.rels.some(r=>r.from==='막달라 마리아'&&r.to==='예수의 사랑하시는 제자'&&r.verses==='1-2'));assert.ok(c20.rels.some(r=>r.from==='도마'&&r.to==='예수'&&r.verses==='26-29'));
});


test('사도행전 1장은 승천 천사·바사바 후보를 구분하고 수신자와 사망한 유다는 출연시키지 않는다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/act.json',import.meta.url),'utf8'));const chapter=summary.chapters['1'];
 const model=buildWorldModel([{code:'act',name:'사도행전',chap:1,data:chapter}]);
 assert.ok(!model.cast.some(p=>['데오빌로','유다'].includes(p.name)));
 const angel=model.cast.find(p=>p.name==='천사들');assert.equal(angel?.identity?.kind,'spiritual');
 const joseph=model.cast.find(p=>p.name==='요셉 바사바');assert.equal(joseph?.identity?.id,'person:joseph-barsabbas');
 assert.ok(!chapter.rels.some(r=>r.to==='유다'||r.from==='요셉 바사바'&&r.to==='맛디아'));
});


test('사도행전 2–3장은 설교에서 인용된 인물과 승천 뒤의 부재 인물을 월드 캐스트에서 제외한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 for(const [chap,names]of [[2,['요엘','다윗','예수']],[3,['예수','모세','아브라함']]]){const model=buildWorldModel([{code:'act',name:'사도행전',chap,data:summary.chapters[String(chap)]}]);for(const name of names)assert.ok(!model.cast.some(p=>p.name===name),`act.${chap} ${name} cited, not present`);}
 assert.ok(summary.chapters['2'].rels.some(r=>r.from==='베드로'&&r.to==='열한 사도'&&r.verses==='14'));assert.ok(summary.chapters['3'].rels.some(r=>r.from==='베드로'&&r.to==='못 걷는 사람'&&r.verses==='6-7'));
 assert.ok(!summary.chapters['2'].rels.some(r=>['요엘','다윗','예수'].includes(r.from)||['요엘','다윗','예수'].includes(r.to)));assert.ok(!summary.chapters['3'].rels.some(r=>r.from==='베드로'&&r.to==='예수'));
});


test('사도행전 4장의 같은 이름 요한은 공회 고위 가문 인물과 사도 요한으로 분리한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/act.json',import.meta.url),'utf8'));const c=summary.chapters['4'];
 const model=buildWorldModel([{code:'act',name:'사도행전',chap:4,data:c}]);
 assert.ok(!model.cast.some(p=>p.name==='예수'),'증언의 대상인 예수님은 승천 후 현장에 없음');
 const highJohn=model.cast.find(p=>p.name==='요한(대제사장 가문)');assert.equal(highJohn?.identity?.id,'person:john-high-priestly-family-act4');
 const apostle=model.cast.find(p=>p.name==='요한');assert.equal(apostle?.identity?.id,'person:john-apostle');
 assert.ok(c.people.some(p=>p.name==='알렉산더(대제사장 가문)'));
});


test('사도행전 6–8장은 일곱 사람을 빠짐없이 색인하고 설교·신하 배경의 역사 인물을 제외한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const seven=['스데반','빌립','브로고로','니가노르','디몬','바메나','니골라'];for(const name of seven)assert.ok(summary.chapters['6'].people.some(p=>p.name===name),`act.6 ${name}`);
 for(const [chap,names]of [[7,['아브라함','요셉','모세','솔로몬']],[8,['간다게']]]){const model=buildWorldModel([{code:'act',name:'사도행전',chap,data:summary.chapters[String(chap)]}]);for(const name of names)assert.ok(!model.cast.some(p=>p.name===name),`act.${chap} ${name} is recounted, not present`);}
 assert.ok(!summary.chapters['7'].rels.some(r=>r.to==='아브라함'||r.to==='모세'));assert.ok(!summary.chapters['8'].rels.some(r=>r.to==='간다게'));assert.ok(summary.chapters['8'].rels.some(r=>r.from==='빌립'&&r.to==='에디오피아 내시'&&r.verses==='35-38'));
});


test('사도행전 9–12장은 사울의 다메섹 장면과 베드로 탈옥의 출연자를 정확히 나눈다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 for(const [chap,names]of [[9,['대제사장','유다']],[10,['예수']]]){const model=buildWorldModel([{code:'act',name:'사도행전',chap,data:summary.chapters[String(chap)]}]);for(const name of names)assert.ok(!model.cast.some(p=>p.name===name),`act.${chap} ${name} not physically present`);}
 assert.ok(!summary.chapters['9'].rels.some(r=>r.from==='대제사장'&&r.to==='사울'));
 assert.ok(summary.chapters['12'].rels.some(r=>r.from==='헤롯'&&r.to==='베드로를 지킨 군인들'&&r.verses==='19'));
});


test('사도행전 13–16장은 안디옥의 실제 인물을 보강하고 요한 마가를 통합한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const c13=summary.chapters['13'];for(const name of ['시므온 니게르','루기오','마나엔','요한 마가'])assert.ok(c13.people.some(p=>p.name===name),`act.13 ${name}`);
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');const ids=[['act',12,'마가'],['act',13,'요한 마가'],['act',15,'마가']].map(([code,chapter,name])=>resolveIdentity(name,{code,chapter}));assert.equal(new Set(ids.map(x=>x.id)).size,1);
 const cast16=buildWorldModel([{code:'act',name:'사도행전',chap:16,data:summary.chapters['16']}]).cast;assert.ok(!cast16.some(p=>p.name==='마게도냐 사람'));assert.ok(!summary.chapters['16'].rels.some(r=>r.from==='마게도냐 사람'));
 const cast13=buildWorldModel([{code:'act',name:'사도행전',chap:13,data:c13}]).cast;assert.ok(!cast13.some(p=>p.name==='다윗'));
});


test('사도행전 17–20장의 출연 목록은 아테네 토론과 드로아·밀레도 동행자를 정확히 반영한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 for(const name of ['소바더','아리스다고','세군도','가이오','디모데','두기고','드로비모'])assert.ok(summary.chapters['20'].people.some(p=>p.name===name),`act.20 ${name}`);
 const model=buildWorldModel([{code:'act',name:'사도행전',chap:20,data:summary.chapters['20']}]);assert.ok(!model.cast.some(p=>p.name==='예수'));assert.ok(!summary.chapters['20'].rels.some(r=>r.from==='예수'));
 assert.ok(summary.chapters['17'].rels.some(r=>r.from==='바울'&&r.to==='아테네 철학자들'&&r.verses==='18, 22-31'));
});


test('사도행전 21–24장은 인용 인물을 제외하고 천부장 클라우디우스 루시아를 하나로 통합한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 for(const [chap,names]of [[22,['가말리엘','스데반']],[24,['루시아','베스도']]]){const model=buildWorldModel([{code:'act',name:'사도행전',chap,data:summary.chapters[String(chap)]}]);for(const name of names)assert.ok(!model.cast.some(p=>p.name===name),`act.${chap} ${name} is only mentioned`);}
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');const a=resolveIdentity('천부장',{code:'act',chapter:21}),b=resolveIdentity('글라우디오 루시아',{code:'act',chapter:23});assert.equal(a.id,b.id);
 assert.ok(!summary.chapters['22'].rels.some(r=>r.to==='가말리엘'));assert.ok(!summary.chapters['24'].rels.some(r=>r.from==='베스도'||r.from==='루시아'));
});

test('사도행전 21–28장은 장면 별칭과 실제 동행자, 회고 속 인물을 구분한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const events=JSON.parse(await fs.readFile(new URL('../data/pixel-bible/events/act.json',import.meta.url),'utf8'));
 const chapters=Array.from({length:8},(_,i)=>{const chap=21+i;return{code:'act',name:'사도행전',chap,data:{...summary.chapters[String(chap)],eventScenes:[...events.scenes,...events.restoredScenes].filter(s=>s.chapter===chap)}};});
 const models=chapters.map(chapter=>buildWorldModel([chapter]));
 assert.ok(models[0].cast.some(p=>p.name==='글라우디오 루시아'));
 assert.ok(models[0].scenes.some(s=>s.sourceUnits?.includes('act.21.3')&&s.actors.includes('글라우디오 루시아')),'천부장 별칭 때문에 성전 체포 장면이 빠지지 않는다');
 for(const [index,name]of [[4,'예수'],[4,'가이사'],[5,'사탄'],[7,'이사야']])assert.ok(!models[index].cast.some(p=>p.name===name),`${chapters[index].chap}장 ${name}은 해당 장면의 현장 인물이 아니다`);
 assert.ok(models[6].cast.some(p=>p.name==='누가')&&models[7].cast.some(p=>p.name==='누가'),'1인칭 복수 항해 기록의 동행자를 반영한다');
});

test('로마서는 편지의 수신자·인용 인물·비유를 현장 캐릭터와 구분한다',async()=>{
 const fs=await import('node:fs/promises');const summary=JSON.parse(await fs.readFile(new URL('../data/summary/rom.json',import.meta.url),'utf8'));
 for(let chap=1;chap<=16;chap++){
  const model=buildWorldModel([{code:'rom',name:'로마서',chap,data:summary.chapters[String(chap)]}]);
  assert.ok(model.cast.some(p=>p.name==='바울'),`rom.${chap} 저자 바울`);
  assert.ok(!model.cast.some(p=>['예수','하나님','성령','죄','나','우리'].includes(p.name)),`rom.${chap} 인용·개념 인물 제외`);
 }
 const final=buildWorldModel([{code:'rom',name:'로마서',chap:16,data:summary.chapters['16']}]);
 for(const name of ['디모데','누기오','야손','소시바더','더디오','가이오','에라스도','구아도'])assert.ok(final.cast.some(p=>p.name===name),`rom.16 편지 작성·전달 맥락 ${name}`);
 for(const name of ['뵈뵈','브리스가','아굴라','에배네도','안드로니고와 유니아','루포'])assert.ok(!final.cast.some(p=>p.name===name),`rom.16 문안 대상 ${name}은 편지 장면에 부재`);
 const {resolveIdentity,canonicalPersonName}=await import('../js/features/pixel-bible/identity.js');assert.equal(resolveIdentity('브리스가',{code:'rom',chapter:16}).id,resolveIdentity('브리스길라',{code:'act',chapter:18}).id);assert.equal(canonicalPersonName('브리스가',{code:'rom',chapter:16}),'브리스길라');
});

test('고린도전서의 인용 인물은 현장 캐스트에서 빼고 동명이인·합성 이름을 바로잡는다',async()=>{
 const fs=await import('node:fs/promises');const first=JSON.parse(await fs.readFile(new URL('../data/summary/1co.json',import.meta.url),'utf8'));const acts=JSON.parse(await fs.readFile(new URL('../data/summary/act.json',import.meta.url),'utf8'));
 const opening=buildWorldModel([{code:'1co',name:'고린도전서',chap:1,data:first.chapters['1']}]);assert.deepEqual(opening.cast.filter(p=>!p.worldMascot).map(p=>p.name).sort(),['바울','소스데네']);
 assert.deepEqual(first.chapters['1'].people.filter(p=>['그리스보','가이오'].includes(p.name)).map(p=>p.name).sort(),['가이오','그리스보']);
 const closing=buildWorldModel([{code:'1co',name:'고린도전서',chap:16,data:first.chapters['16']}]);for(const name of ['바울','스데바나','브드나도','아가이고'])assert.ok(closing.cast.some(p=>p.name===name),`고린도전서 16장 현재 동역자 ${name}`);
 for(const name of ['디모데','아볼로','아굴라','브리스길라','고린도 성도','예루살렘 성도','예수'])assert.ok(!closing.cast.some(p=>p.name===name),`부재 인물 ${name}`);
 assert.deepEqual(acts.chapters['19'].people.filter(p=>['가이오','아리스다고','가이오와 아리스다고'].includes(p.name)).map(p=>p.name).sort(),['가이오','아리스다고']);
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('그리스보',{code:'act',chapter:18}).id,resolveIdentity('그리스보',{code:'1co',chapter:1}).id);
 assert.equal(resolveIdentity('가이오',{code:'rom',chapter:16}).id,resolveIdentity('가이오',{code:'1co',chapter:1}).id);
 assert.notEqual(resolveIdentity('가이오',{code:'act',chapter:19}).id,resolveIdentity('가이오',{code:'act',chapter:20}).id);
 assert.notEqual(resolveIdentity('소스데네',{code:'act',chapter:18}).id,resolveIdentity('소스데네',{code:'1co',chapter:1}).id);
 assert.equal(resolveIdentity('게바',{code:'1co',chapter:1}).id,resolveIdentity('베드로',{code:'mat',chapter:16}).id);
 assert.ok(!first.chapters['13'].people.some(p=>p.name==='예수')&&!first.chapters['13'].rels.some(r=>r.from==='예수'||r.to==='예수'),'고린도전서 13장에 없는 예수 발화를 만들지 않는다');
});

test('고린도후서 1–13장은 서신 수신자·인용 인물·비유를 현장 캐스트에서 제외한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/2co.json',import.meta.url),'utf8'));
 const absent={1:['고린도 교회','실루아노','예수'],2:['고린도 성도','근심하게 한 자','디도','사탄','예수'],3:['모세','이스라엘 자손','예수'],4:['믿지 않는 자들','이 세상의 신','예수'],5:['고린도 성도','예수'],6:['믿지 않는 자','벨리알','예수'],7:['고린도 성도'],8:['마게도냐 교회들','고린도 성도','칭찬받는 형제','예루살렘 성도','예수'],9:['고린도 성도','마게도냐인들','형제들','예루살렘 성도'],10:['고린도 성도','어떤 사람들','자기를 칭찬하는 자','예수'],11:['고린도 성도','거짓 사도들','하와','아레다 왕의 고관','예수'],12:['셋째 하늘에 간 사람','사탄의 사자','고린도 성도','디도','예수'],13:['고린도 성도','예수']};
 for(let chap=1;chap<=13;chap++){
  const model=buildWorldModel([{code:'2co',name:'고린도후서',chap,data:summary.chapters[String(chap)]}]);
  const names=model.cast.filter(p=>!p.worldMascot).map(p=>p.name);
  for(const name of absent[chap])assert.ok(!names.includes(name),`2co.${chap} ${name} is mentioned, remote, figurative or absent`);
  for(const scene of model.scenes)for(const actor of scene.actors)assert.ok(!absent[chap].includes(actor),`2co.${chap} scene actor ${actor} is absent`);
 }
 assert.ok(buildWorldModel([{code:'2co',name:'고린도후서',chap:1,data:summary.chapters['1']}]).cast.some(p=>p.name==='디모데'));
 assert.ok(buildWorldModel([{code:'2co',name:'고린도후서',chap:7,data:summary.chapters['7']}]).cast.some(p=>p.name==='디도'));
 assert.ok(buildWorldModel([{code:'2co',name:'고린도후서',chap:8,data:summary.chapters['8']}]).cast.some(p=>p.name==='디도'));
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),55);
});

test('갈라디아서의 예루살렘·안디옥 사건은 실제 동석 인물을 유지하고 비유·회고 인물을 가린다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/gal.json',import.meta.url),'utf8'));
 const visit=buildWorldModel([{code:'gal',name:'갈라디아서',chap:1,data:summary.chapters['1']}]).cast.map(p=>p.name);
 for(const name of ['바울','베드로','야고보'])assert.ok(visit.includes(name),`갈라디아서 1장 실제 방문 인물 ${name}`);
 const conflict=buildWorldModel([{code:'gal',name:'갈라디아서',chap:2,data:summary.chapters['2']}]).cast.map(p=>p.name);
 for(const name of ['바울','바나바','디도','베드로','야고보','요한','거짓 형제들'])assert.ok(conflict.includes(name),`갈라디아서 2장 사건 인물 ${name}`);
 assert.ok(summary.chapters['2'].rels.some(r=>r.from==='야고보'&&r.to==='바나바'&&r.verses==='9'));
 assert.equal(summary.chapters['2'].rels.find(r=>r.to==='게바'&&r.from==='바울').label,'공개적으로 책망한 사도');
 for(const [chap,names] of [[3,['아브라함','예수']],[4,['하갈','사라','이스마엘','이삭','예수']],[5,['교란하는 자','예수']],[6,['범죄한 사람','예수']]]){
  const model=buildWorldModel([{code:'gal',name:'갈라디아서',chap,data:summary.chapters[String(chap)]}]);
  for(const name of names)assert.ok(!model.cast.some(p=>p.name===name),`갈라디아서 ${chap}장 ${name}은 인용·비유 인물`);
  for(const scene of model.scenes)for(const actor of scene.actors)assert.ok(!names.includes(actor),`갈라디아서 ${chap}장 장면에서 ${actor} 제외`);
 }
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),31);
});

test('에베소서는 수신 공동체·일반 가정 역할·영적 권세를 사람 NPC로 세우지 않고 편지 전달자 두기고는 유지한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/eph.json',import.meta.url),'utf8'));
 const absent={1:['에베소 성도들','예수'],2:['에베소 성도들','이방인들','이스라엘','공중의 권세 잡은 자','예수'],3:['에베소 성도들','이방인들','통치자들과 권세들','예수'],4:['에베소 성도들','사도와 선지자와 목사와 교사','마귀','예수'],5:['에베소 성도들','아내들','남편들','교회','예수'],6:['자녀들','아비들','종들','상전들','마귀']};
 for(let chap=1;chap<=6;chap++){
  const model=buildWorldModel([{code:'eph',name:'에베소서',chap,data:summary.chapters[String(chap)]}]);
  for(const name of absent[chap])assert.ok(!model.cast.some(p=>p.name===name),`에베소서 ${chap}장 ${name}은 편지 수신자·일반 역할·영적 비유`);
  for(const scene of model.scenes)for(const actor of scene.actors)assert.ok(!absent[chap].includes(actor),`에베소서 ${chap}장 사건 장면 ${actor} 제거`);
 }
 const ending=buildWorldModel([{code:'eph',name:'에베소서',chap:6,data:summary.chapters['6']}]);assert.ok(ending.cast.some(p=>p.name==='두기고'));
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),29);
});

test('빌립보서의 실제 옥중 동역자와 유오디아·순두게 공동사역을 보존하고 추상 대상을 분리한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/php.json',import.meta.url),'utf8'));
 const cast=chap=>buildWorldModel([{code:'php',name:'빌립보서',chap,data:summary.chapters[String(chap)]}]).cast.map(p=>p.name);
 for(const name of ['바울','디모데','시위대'])assert.ok(cast(1).includes(name),`빌립보서 1장 현장 인물 ${name}`);
 assert.ok(!cast(1).includes('투기로 전하는 자들'));
 for(const name of ['디모데','에바브로디도'])assert.ok(cast(2).includes(name),`빌립보서 2장 동역자 ${name}`);
 for(const name of ['유오디아','순두게','글레멘드','에바브로디도'])assert.ok(cast(4).includes(name),`빌립보서 4장 언급된 동역자 ${name}`);
 assert.ok(!cast(3).includes('개들과 행악하는 자들'));
 assert.ok(!cast(3).includes('십자가의 원수들'));
 const four=summary.chapters['4'];
 for(const name of ['유오디아','순두게'])assert.ok(four.rels.some(r=>r.from==='바울'&&r.to===name&&r.verses==='2-3'));
 const pair=four.rels.find(r=>r.from==='유오디아'&&r.to==='순두게');assert.equal(pair.label,'복음 사역 동역자');assert.match(pair.note,/본문이 말하지 않아요/);
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),22);
});

test('골로새서는 서신 수신자와 일반 가정 역할을 분리하고 마가·두기고·오네시모 등 문안 동역자를 식별한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/col.json',import.meta.url),'utf8'));
 const cast=chap=>buildWorldModel([{code:'col',name:'골로새서',chap,data:summary.chapters[String(chap)]}]).cast;
 for(const name of ['바울','디모데','에바브라'])assert.ok(cast(1).some(p=>p.name===name));
 assert.ok(!cast(1).some(p=>p.name==='골로새 성도들'));
 for(const name of ['라오디게아 성도들','거짓 교사들'])assert.ok(!cast(2).some(p=>p.name===name));
 for(const name of ['아내들과 남편들','자녀들과 아비들','종들'])assert.ok(!cast(3).some(p=>p.name===name));
 for(const name of ['두기고','오네시모','아리스다고','요한 마가','에바브라','누가','데마','눔바','아킵보'])assert.ok(cast(4).some(p=>p.name===name),`골로새서 4장 현재 동역자·직접 문안 대상 ${name}`);
 assert.ok(!cast(4).some(p=>p.name==='바나바'));
 assert.equal(resolveIdentity('마가',{code:'col',chapter:4}).id,resolveIdentity('요한 마가',{code:'act',chapter:15}).id);
 assert.equal(cast(4).find(p=>p.name==='요한 마가').name,'요한 마가');
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),20);
});

test('데살로니가전서는 공동 발신자와 실제 선교 동역자를 살리고 미래·비유 집단을 구분한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/1th.json',import.meta.url),'utf8'));
 const cast=chap=>buildWorldModel([{code:'1th',name:'데살로니가전서',chap,data:summary.chapters[String(chap)]}]).cast.map(p=>p.name);
 for(const name of ['바울','실라','디모데'])assert.ok(cast(1).includes(name));
 assert.ok(!cast(1).includes('데살로니가 교회'));
 for(const name of ['유대인들','사탄'])assert.ok(!cast(2).includes(name));
 assert.ok(cast(3).includes('디모데'));
 for(const name of ['자는 자들','천사장'])assert.ok(!cast(4).includes(name));
 for(const name of ['다스리는 자들','게으른 자들'])assert.ok(!cast(5).includes(name));
 assert.equal(resolveIdentity('실라',{code:'act',chapter:15}).id,resolveIdentity('실루아노',{code:'1th',chapter:1}).id);
 assert.equal(resolveIdentity('실루아노',{code:'2co',chapter:1}).id,resolveIdentity('실라',{code:'act',chapter:15}).id);
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),22);
});

test('데살로니가후서의 공동 발신자 외에 수신 공동체·미래 예언 인물·일반 유형은 현장 NPC에서 제외한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/2th.json',import.meta.url),'utf8'));
 const cast=chap=>buildWorldModel([{code:'2th',name:'데살로니가후서',chap,data:summary.chapters[String(chap)]}]).cast.map(p=>p.name);
 for(const name of ['바울','실라','디모데'])assert.ok(cast(1).includes(name));
 for(const name of ['환난 주는 자들','능력의 천사들','예수'])assert.ok(!cast(1).includes(name));
 for(const name of ['불법의 사람','막는 자','멸망하는 자들','사탄','예수'])assert.ok(!cast(2).includes(name));
 for(const name of ['게으른 자들','악한 사람들','악한 자','예수'])assert.ok(!cast(3).includes(name));
 assert.equal(resolveIdentity('실루아노',{code:'2th',chapter:1}).id,resolveIdentity('실라',{code:'act',chapter:15}).id);
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),14);
});

test('디모데전서의 실명 반대자와 안수 관계는 보존하고 교회 직분·비유·과거 인물을 분리한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/1ti.json',import.meta.url),'utf8'));
 const cast=chap=>buildWorldModel([{code:'1ti',name:'디모데전서',chap,data:summary.chapters[String(chap)]}]).cast.map(p=>p.name);
 for(const name of ['바울','디모데','후메내오','알렉산더'])assert.ok(cast(1).includes(name));
 for(const name of ['다른 교훈 가르치는 자들','예수'])assert.ok(!cast(1).includes(name));
 for(const name of ['아담','하와','임금들과 높은 사람들','예수'])assert.ok(!cast(2).includes(name));
 for(const name of ['감독','집사','마귀','예수'])assert.ok(!cast(3).includes(name));
 for(const name of ['귀신','미혹하는 자들'])assert.ok(!cast(4).includes(name));
 assert.ok(cast(4).includes('장로의 회'));
 for(const name of ['참 과부','젊은 과부','장로들','범죄한 자들'])assert.ok(!cast(5).includes(name));
 for(const name of ['종들','부한 자들','본디오 빌라도','예수'])assert.ok(!cast(6).includes(name));
 assert.ok(summary.chapters['1'].rels.some(r=>r.from==='바울'&&r.to==='알렉산더'&&r.verses==='20'));
 assert.equal(resolveIdentity('장로의 회',{code:'1ti',chapter:4}).kind,'group');
 assert.equal(resolveIdentity('귀신',{code:'1ti',chapter:4}).kind,'spiritual');
 assert.equal(resolveIdentity('후메내오',{code:'1ti',chapter:1}).id,resolveIdentity('후메내오',{code:'2ti',chapter:2}).id);
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),28);
});

test('디모데후서의 기억·전언·요청을 현재 동행 인물과 구분하고 마가·오네시보로의 집 신원을 나눈다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/2ti.json',import.meta.url),'utf8'));
 const cast=chap=>buildWorldModel([{code:'2ti',name:'디모데후서',chap,data:summary.chapters[String(chap)]}]).cast.map(p=>p.name);
 for(const name of ['바울','디모데','부겔로','허모게네','오네시보로'])assert.ok(cast(1).includes(name));
 for(const name of ['로이스','유니게'])assert.ok(!cast(1).includes(name));
 for(const name of ['후메내오','빌레도'])assert.ok(cast(2).includes(name));
 for(const name of ['다윗','예수'])assert.ok(!cast(2).includes(name));
 for(const name of ['얀네와 얌브레','모세'])assert.ok(!cast(3).includes(name));
 assert.ok(cast(4).includes('누가'));
 for(const name of ['데마','요한 마가','두기고','알렉산더','브리스가','아굴라','오네시보로의 집'])assert.ok(!cast(4).includes(name),`디모데후서 4장 부재·문안 대상 ${name}`);
 assert.ok(cast(4).includes('바울'));
 assert.equal(resolveIdentity('마가',{code:'2ti',chapter:4}).id,resolveIdentity('요한 마가',{code:'act',chapter:15}).id);
 assert.equal(resolveIdentity('오네시보로',{code:'2ti',chapter:1}).kind,'unresolved');
 assert.equal(resolveIdentity('오네시보로의 집',{code:'2ti',chapter:4}).kind,'group');
 assert.equal(resolveIdentity('브리스가',{code:'2ti',chapter:4}).id,resolveIdentity('브리스길라',{code:'rom',chapter:16}).id);
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),20);
});

test('디도서는 실제 목회 대상 디도와 파송을 도울 선교 동역자를 남기고 일반 직분·미래 파견자를 분리한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/tit.json',import.meta.url),'utf8'));
 const cast=chap=>buildWorldModel([{code:'tit',name:'디도서',chap,data:summary.chapters[String(chap)]}]).cast.map(p=>p.name);
 assert.ok(cast(1).includes('바울'));assert.ok(cast(1).includes('디도'));
 for(const name of ['장로','감독','할례파','그레데인들'])assert.ok(!cast(1).includes(name));
 for(const name of ['늙은 남자와 여자','젊은이들','종들','예수'])assert.ok(!cast(2).includes(name));
 for(const name of ['통치자들','이단에 속한 사람','아데마','두기고','예수'])assert.ok(!cast(3).includes(name));
 for(const name of ['세나','아볼로','바울','디도'])assert.ok(cast(3).includes(name),`디도서 3장 선교 문맥 ${name}`);
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),15);
});

test('빌레몬서는 실제 간구 관계와 집 교회 수신자를 연결하고 추정된 배우자·동역자 별칭을 분리한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/phm.json',import.meta.url),'utf8'));
 const model=buildWorldModel([{code:'phm',name:'빌레몬서',chap:1,data:summary.chapters['1']}]);
 for(const name of ['바울','디모데','빌레몬','오네시모','압비아','아킵보','요한 마가','누가','에바브라','빌레몬의 집 교회'])assert.ok(model.cast.some(p=>p.name===name),`빌레몬서의 직접 인물·수신자 ${name}`);
 assert.ok(!model.cast.some(p=>p.name==='예수'));
 assert.equal(resolveIdentity('마가',{code:'phm',chapter:1}).id,resolveIdentity('요한 마가',{code:'act',chapter:15}).id);
 assert.equal(resolveIdentity('빌레몬의 집 교회',{code:'phm',chapter:1}).kind,'group');
 const pair=summary.chapters['1'].rels.find(r=>r.from==='오네시모'&&r.to==='빌레몬');assert.equal(pair.label,'종을 넘어 사랑받는 형제');
 const apphia=summary.chapters['1'].rels.find(r=>r.from==='빌레몬'&&r.to==='압비아');assert.equal(apphia.kind,'ally');assert.match(apphia.note,/본문은 관계를 명시하지 않아요/);
 assert.ok(summary.chapters['1'].rels.some(r=>r.to==='빌레몬의 집 교회'&&r.verses==='2'));
 assert.equal(summary.chapters['1'].rels.length,6);
});

test('히브리서는 역사적 본문 예시의 인물을 분리하고 비유·제사 표현을 현장 캐릭터와 구분한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/heb.json',import.meta.url),'utf8'));
 const cast=chap=>buildWorldModel([{code:'heb',name:'히브리서',chap,data:summary.chapters[String(chap)]}]).cast;
 assert.ok(!cast(1).some(p=>p.name==='개'),'일곱 개의 구약 인용에서 수량 단위가 개 NPC가 되지 않는다');
 assert.ok(!cast(9).some(p=>['소','염소'].includes(p.name)),'속죄 제사의 짐승은 히브리서 9장 현장 동물이 아니다');
 assert.ok(!cast(10).some(p=>['소','염소'].includes(p.name)),'반복 제사의 짐승은 히브리서 10장 현장 동물이 아니다');
 assert.equal(resolveIdentity('천사들',{code:'heb',chapter:1}).kind,'spiritual');
 assert.equal(resolveIdentity('천만 천사',{code:'heb',chapter:12}).kind,'spiritual');
 assert.equal(resolveIdentity('멜기세덱',{code:'heb',chapter:7}).id,resolveIdentity('멜기세덱',{code:'gen',chapter:14}).id);
 assert.equal(resolveIdentity('에녹',{code:'heb',chapter:11}).id,resolveIdentity('에녹',{code:'gen',chapter:5}).id);
 assert.equal(resolveIdentity('요셉',{code:'heb',chapter:11}).id,resolveIdentity('요셉',{code:'gen',chapter:37}).id);
 const ch7=cast(7).map(p=>p.name);assert.ok(ch7.includes('아브라함'));assert.ok(ch7.includes('멜기세덱'));
 for(const name of ['레위','아론'])assert.ok(!ch7.includes(name),`히브리서 7장의 계보·비교 인물 ${name}은 대면 장면 배우가 아님`);
 const ch11=cast(11).map(p=>p.name);
 for(const name of ['기드온','바락','삼손','입다','다윗','사무엘','에서','요셉의 아들들'])assert.ok(ch11.includes(name),`히브리서 11장의 믿음 선례 인물 ${name}을 개별 색인`);
 assert.ok(!ch11.includes('기드온과 다윗'),'한 인물 이름에 여러 사람이 합쳐져 있지 않다');
 assert.equal(resolveIdentity('요셉의 아들들',{code:'heb',chapter:11}).kind,'group');
 const relations=summary.chapters['11'].rels;
 for(const [from,to,verse]of [['이삭','야곱','20'],['이삭','에서','20'],['야곱','요셉의 아들들','21']])assert.ok(relations.some(r=>r.from===from&&r.to===to&&r.verses===verse),`${from}→${to} 관계는 본문 ${verse}절 근거가 있음`);
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),60);
});

test('야고보서는 편지 저자의 신원을 따로 두고 인용된 조상·선지자와 비유를 실제 출연자에서 분리한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/jas.json',import.meta.url),'utf8'));
 const cast=chap=>buildWorldModel([{code:'jas',name:'야고보서',chap,data:summary.chapters[String(chap)]}]).cast;
 assert.equal(resolveIdentity('야고보',{code:'jas',chapter:1}).id,'person:james-epistle-author');
 assert.equal(resolveIdentity('주 예수 그리스도',{code:'jas',chapter:1}).id,resolveIdentity('예수',{code:'jhn',chapter:1}).id);
 assert.equal(resolveIdentity('부자',{code:'jas',chapter:2}).kind,'group');
 assert.equal(resolveIdentity('고아와 과부',{code:'jas',chapter:1}).kind,'group');
 for(const name of ['아브라함','이삭','라합'])assert.ok(!cast(2).some(p=>p.name===name),`야고보서 2장의 역사적 믿음 예시 ${name}은 현장 인물이 아님`);
 for(const name of ['욥','엘리야'])assert.ok(!cast(5).some(p=>p.name===name),`야고보서 5장의 과거 사례 ${name}은 현장 인물이 아님`);
 assert.ok(cast(5).some(p=>p.name==='야고보'));
 assert.equal(resolveIdentity('야고보',{code:'jas',chapter:1}).id,resolveIdentity('야고보',{code:'jas',chapter:5}).id);
 const ch3=cast(3);assert.ok(!ch3.some(p=>p.name==='무화과나무'),'열매 비유 속 무화과나무는 월드 식물이 아니다');
 const eventBook=JSON.parse(await fs.promises.readFile(new URL('../data/pixel-bible/events/jas.json',import.meta.url),'utf8'));
 const scene=buildWorldModel([{code:'jas',name:'야고보서',chap:2,data:{...summary.chapters['2'],eventScenes:eventBook.scenes.filter(s=>s.chapter===2)}}]).scenes.find(s=>s.id==='ot-jas-2-2');
 assert.deepEqual(scene.actors,[]);assert.equal(scene.animation.lead,null);assert.equal(scene.animation.target,null);assert.ok(scene.animation.beats.every(beat=>beat.actor===null));
 assert.ok(summary.chapters['5'].people.some(p=>p.name==='엘리야'));
 assert.ok(summary.chapters['5'].rels.some(r=>r.from==='엘리야'&&r.to==='하나님'&&r.verses==='17-18'));
 assert.match(summary.chapters['2'].rels.find(r=>r.from==='아브라함'&&r.to==='이삭').note,/이삭은 죽지 않았어요/);
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),22);
});

test('베드로전서는 서신 수신자·구약 예시·비유 동물을 분리하고 실라와 요한 마가를 통합한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/1pe.json',import.meta.url),'utf8'));
 const events=JSON.parse(await fs.promises.readFile(new URL('../data/pixel-bible/events/1pe.json',import.meta.url),'utf8'));
 const model=chap=>buildWorldModel([{code:'1pe',name:'베드로전서',chap,data:{...summary.chapters[String(chap)],eventScenes:events.scenes.filter(s=>s.chapter===chap)}}]);
 for(let chapter=1;chapter<=5;chapter++)assert.ok(!model(chapter).cast.some(p=>p.name==='예수'),`1 Peter ${chapter}: 예수님은 서신의 현장에 계신 인물이 아니라 과거 사역·교리의 대상`);
 for(const name of ['선지자들','흩어진 나그네들'])assert.equal(resolveIdentity(name,{code:'1pe',chapter:1}).kind,'group');
 for(const [chapter,names]of [[1,['선지자들']],[3,['사라','아브라함','노아']],[1,['예수']],[2,['예수']],[3,['예수']],[4,['예수']],[5,['예수']]])for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'1pe',chapter}));
 for(const [chapter,names]of [[1,['양']],[2,['양']],[5,['양','사자']]])for(const name of names)assert.ok(!model(chapter).cast.some(p=>p.name===name),`1 Peter ${chapter} 비유의 ${name}은 동물 NPC가 아님`);
 const closing=model(5).cast.map(p=>p.name);assert.ok(closing.includes('실라'));assert.ok(closing.includes('요한 마가'));
 assert.equal(resolveIdentity('실루아노',{code:'1pe',chapter:5}).id,resolveIdentity('실라',{code:'act',chapter:15}).id);
 assert.equal(resolveIdentity('마가',{code:'1pe',chapter:5}).id,resolveIdentity('요한 마가',{code:'act',chapter:15}).id);
 assert.ok(summary.chapters['5'].rels.some(r=>r.from==='베드로'&&r.to==='마가'&&r.verses==='13'));
});

test('베드로후서는 편지 화자 별칭을 합치고 과거 심판 예시·미래 재림 대상을 현장 캐릭터에서 제외한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/2pe.json',import.meta.url),'utf8'));
 const eventBook=JSON.parse(await fs.promises.readFile(new URL('../data/pixel-bible/events/2pe.json',import.meta.url),'utf8'));
 const cast=chapter=>buildWorldModel([{code:'2pe',name:'베드로후서',chap:chapter,data:{...summary.chapters[String(chapter)],eventScenes:eventBook.scenes.filter(s=>s.chapter===chapter),additionalPeople:eventBook.additionalPeople?.[String(chapter)]||[]}}]).cast;
 assert.equal(resolveIdentity('시몬 베드로',{code:'2pe',chapter:1}).id,resolveIdentity('베드로',{code:'2pe',chapter:2}).id);
 assert.equal(resolveIdentity('발람',{code:'2pe',chapter:2}).id,resolveIdentity('발람',{code:'num',chapter:22}).id);
 assert.equal(resolveIdentity('범죄한 천사들',{code:'2pe',chapter:2}).kind,'spiritual');
 assert.equal(resolveIdentity('거짓 선생들',{code:'2pe',chapter:2}).kind,'group');
 assert.ok(cast(1).some(p=>p.name==='베드로'));assert.ok(!cast(1).some(p=>p.name==='시몬 베드로'));
 assert.ok(!cast(1).some(p=>p.name==='예수'));
 for(const name of ['노아','롯','발람','범죄한 천사들','개','돼지'])assert.ok(!cast(2).some(p=>p.name===name),`베드로후서 2장의 인용·비유 ${name}은 현장에 나오지 않음`);
 for(const name of ['바울','예수'])assert.ok(!cast(3).some(p=>p.name===name),`베드로후서 3장의 인용·예고 인물 ${name}은 현장에 나오지 않음`);
 for(const [chapter,names]of [[1,['예수']],[2,['노아','롯','발람','범죄한 천사들']],[3,['바울','예수']]])for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'2pe',chapter}));
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),13);
});

test('요한일서는 사도 요한의 저자 신원을 고정하고 인용된 형제·그리스도를 현재 장면에서 분리한다',async()=>{
 const summary=JSON.parse(await fs.promises.readFile(new URL('../data/summary/1jn.json',import.meta.url),'utf8'));
 const events=JSON.parse(await fs.promises.readFile(new URL('../data/pixel-bible/events/1jn.json',import.meta.url),'utf8'));
 const cast=chapter=>buildWorldModel([{code:'1jn',name:'요한일서',chap:chapter,data:{...summary.chapters[String(chapter)],eventScenes:events.scenes.filter(s=>s.chapter===chapter)}}]).cast;
 assert.equal(resolveIdentity('요한',{code:'1jn',chapter:1}).id,resolveIdentity('요한',{code:'1jn',chapter:5}).id);
 assert.equal(resolveIdentity('요한',{code:'1jn',chapter:1}).id,resolveIdentity('요한',{code:'jhn',chapter:21,role:'예수께서 사랑하시는 제자'}).id);
 for(let chapter=1;chapter<=5;chapter++)assert.ok(!cast(chapter).some(p=>p.name==='예수'),`요한일서 ${chapter}장의 예수님 언급은 현재 서신 장면의 동석이 아님`);
 for(const name of ['자녀들','하나님의 자녀들','적그리스도','형제를 미워하는 자'])assert.equal(resolveIdentity(name,{code:'1jn',chapter:2}).kind,'group');
 for(const name of ['가인','아벨'])assert.ok(!cast(3).some(p=>p.name===name),'가인과 아벨은 사랑을 설명하는 과거 예시');
 const ch5=buildWorldModel([{code:'1jn',name:'요한일서',chap:5,data:{...summary.chapters['5'],eventScenes:events.scenes.filter(s=>s.chapter===5)}}]);
 assert.deepEqual(ch5.scenes.find(s=>s.id==='ot-1jn-5-1').actors,[]);
 assert.equal(ch5.scenes.find(s=>s.id==='ot-1jn-5-1').animation.lead,null);
 for(const [chapter,names]of [[1,['예수']],[2,['예수']],[3,['가인','아벨','예수']],[4,['예수']],[5,['예수']]])for(const name of names)assert.ok(isMentionOnlyPerson({name},{code:'1jn',chapter}));
 assert.equal(Object.values(summary.chapters).reduce((n,c)=>n+(c.rels||[]).length,0),21);
});
