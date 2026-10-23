import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorldModel, findPath } from '../js/features/pixel-bible/world.js';

test('인물을 함께 모아도 본문 출처를 보존하고 하나님은 인간 NPC로 만들지 않는다', () => {
  const base = { name: '창세기', code: 'gen' };
  const model = buildWorldModel([
    { ...base, chap: 1, data: { people: [{ name: '하나님', weight: 3 }, { name: '아담', weight: 1 }] } },
    { ...base, chap: 2, data: { people: [{ name: '아담', weight: 3 }], rels: [{ from: '하나님', to: '아담', verses: '7', label: '지으심' }] } },
  ]);
  assert.equal(model.cast.length, 1);
  assert.deepEqual(model.cast[0].refs, ['창세기 1장', '창세기 2장']);
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

test('배치된 오브제를 우회하고 갈 수 없는 목적지는 거절한다', () => {
  const bounds = (x, y) => x < 0 || x > 4 || y < 0 || y > 4;
  const blocked = (x, y) => bounds(x, y) || (x === 2 && y < 4);
  const path = findPath({ x: 0, y: 0 }, { x: 4, y: 0 }, blocked);
  assert.ok(path.some((p) => p.y === 4));
  assert.deepEqual(path.at(-1), { x: 4, y: 0 });
  assert.ok(path.every((p) => !blocked(p.x, p.y)));
  assert.equal(findPath({ x: 0, y: 0 }, { x: 4, y: 0 }, (x, y) => bounds(x, y) || x === 2), null);
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
});

test('같은 이름의 다른 신원을 한 월드 인물로 합치지 않는다',()=>{
 const model=buildWorldModel([{code:'gen',name:'창세기',chap:37,data:{people:[{name:'요셉',role:'야곱의 아들'}]}},{code:'mat',name:'마태복음',chap:1,data:{people:[{name:'요셉',role:'마리아의 남편'}]}}]);
 assert.equal(model.cast.length,2);assert.notEqual(model.cast[0].identity.id,model.cast[1].identity.id);
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

test('100종의 독백 200개와 관계 대사 106개를 직접 작성해 출처와 구분한다',async()=>{
 const {APPEARANCES}=await import('../js/features/pixel-bible/appearance.js');
 const {SOLO_DIALOGUE,PAIR_DIALOGUE,DIALOGUE_SOURCE_STATUS}=await import('../js/features/pixel-bible/dialogue.js');
 assert.equal(Object.keys(SOLO_DIALOGUE).length,100);
 for(const p of Object.values(APPEARANCES)){const solo=SOLO_DIALOGUE[p.name];assert.ok(solo?.ref);assert.equal(solo.lines.length,2);assert.ok(solo.lines.every(s=>s.length>8&&s.length<100));}
 assert.equal(PAIR_DIALOGUE.length,53);for(const p of PAIR_DIALOGUE){assert.ok(p.speaker&&p.target&&p.ref&&p.chapter);assert.equal(p.lines.length,2);}
 assert.equal(DIALOGUE_SOURCE_STATUS.hokma,'partially-reviewed-uploaded-hokma-notes');
});

test('말풍선은 한 슬롯에서 5초 표시하고 실제 숨긴 시점부터 3초를 쉰다',async()=>{
 const {SpeechDirector}=await import('../js/features/pixel-bible/dialogue.js');
 const s=new SpeechDirector({now:0,random:()=>0});const a={id:'a',speaker:{name:'가'},kind:'solo'},b={id:'b',speaker:{name:'나'},kind:'solo'};
 assert.equal(s.tick(2999,[a,b]),null);assert.equal(s.tick(3000,[a,b]).id,'a');
 assert.equal(s.tick(7999,[b]).id,'a');assert.equal(s.tick(8000,[b]),null);
 assert.equal(s.tick(10999,[b]),null);assert.equal(s.tick(11000,[a,b]).id,'b');
 // 탭 복귀 등으로 만료를 늦게 관측해도 새로 사라진 순간부터 센다.
 assert.equal(s.tick(20000,[a]),null);assert.equal(s.tick(22999,[a]),null);assert.equal(s.tick(23000,[a]).id,'a');
 assert.equal(s.tick(23100,[a],false),null);assert.equal(s.current,null);
 assert.equal(s.tick(26099,[b]),null);assert.equal(s.tick(26100,[b]).id,'b');
});

test('클릭은 현재 대사를 즉시 교체하고 새 5초 종료 후 3초 뒤 자동 대사를 허용한다',async()=>{
 const {SpeechDirector}=await import('../js/features/pixel-bible/dialogue.js');
 const s=new SpeechDirector({random:()=>0});const a={id:'a',speaker:{},kind:'solo'},b={id:'b',speaker:{},kind:'solo'},c={id:'c',speaker:{},kind:'solo'};
 assert.equal(s.tick(3000,[a]).id,'a');
 assert.equal(s.interrupt(b,4500).id,'b');assert.equal(s.tick(4501,[c]).id,'b');
 assert.equal(s.tick(9499,[c]).id,'b');assert.equal(s.tick(9500,[c]),null);
 assert.equal(s.tick(12499,[c]),null);assert.equal(s.tick(12500,[c]).id,'c');
 // 공백 시간과 같은 인물 재클릭도 즉시 표시하고 5초를 다시 센다.
 s.interrupt(c,12600);assert.equal(s.current.started,12600);assert.equal(s.current.until,17600);
});

test('이세벨의 대상별 대사를 구분하고 거리·현재 본문·이동 상태를 확인한다',async()=>{
 const {dialogueCandidates}=await import('../js/features/pixel-bible/dialogue.js');
 const npc=(name,x)=>({name,x,y:8,path:[],refs:['열왕기상 21장']});
 const people=[npc('이세벨',10),npc('아합',11),npc('나봇',12)];
 const candidates=dialogueCandidates(people,[{code:'1ki',chap:21}]);
 const queen=candidates.filter(c=>c.kind==='pair'&&c.speaker.name==='이세벨');
 assert.equal(queen.filter(c=>c.target.name==='아합').length,2);assert.equal(queen.filter(c=>c.target.name==='나봇').length,2);
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
 assert.ok(lines.some(c=>c.origin==='chapter-role'&&c.ref==='느헤미야 3장'));
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
 ctx.freeChapter=2;assert.equal(ctx.pixelBibleTodayChapters()[0].code,'jhn');
 ctx.freeChapter=null;ctx.viewingDay=null;assert.equal(ctx.pixelBibleTodayChapters()[0].code,'1ki');
 ctx.state.plan=null;assert.equal(ctx.pixelBibleTodayChapters().length,0);
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
 assert.equal(model.cast.length,25);
 const visible=visibleWorldCast(model,24);
 assert.equal(visible.length,25);assert.deepEqual(new Set(visible.map(p=>p.name)),new Set(model.cast.map(p=>p.name)));
});

test('관계도에만 있는 상대도 인물과 상호작용에 포함한다',async()=>{
 const {buildChapterDialogue}=await import('../js/features/pixel-bible/chapter-dialogue.js');
 const chapters=[{code:'gen',name:'창세기',chap:1,data:{people:[{name:'갑',role:'돕는 이'}],rels:[{from:'갑',to:'을',label:'도움',note:'갑이 을을 돕는다.',verses:'1'}]}}];
 const model=buildWorldModel(chapters),context=buildChapterDialogue(chapters);
 assert.deepEqual(model.cast.map(p=>p.name),['갑','을']);assert.equal(context.relations.length,1);
});

test('관계선은 현재 머리 위치와 드래그 위치를 따라가고 다른 본문의 동명이인을 연결하지 않는다',async()=>{
 const {relationshipLinks}=await import('../js/features/pixel-bible/relationship-overlay.js');
 const a={name:'갑',x:10,y:8,refs:['창세기 1장']},b={name:'을',x:20,y:9,refs:['창세기 1장']};
 const relations=[{from:'갑',to:'을',label:'가족',sourceRef:'창세기 1장'},{from:'갑',to:'을',label:'다른 사람',sourceRef:'창세기 2장'}];
 let links=relationshipLinks(relations,[a,b]);assert.equal(links.length,1);assert.deepEqual(links[0].a,{x:240,y:112});
 a.x=11;links=relationshipLinks(relations,[a,b]);assert.equal(links[0].a.x,264);
 links=relationshipLinks(relations,[a,b],{active:true,n:a,p:{x:15,y:7}});assert.deepEqual(links[0].a,{x:360,y:88});
 assert.equal(relationshipLinks(relations,[a]).length,0);
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
 assert.equal(s.tick(5200,[]),null);assert.equal(s.nextAt,8200);
});

test('오브제 철거는 인물의 위치·경로·방향을 유지하고 삭제한 물건의 작업만 해제한다',async()=>{
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

test('오브제 색인은 장·구절 범위를 보존하고 돌아가다/불순종을 돌/불로 잘못 찾지 않는다',async()=>{
 const {chapterObjects,OBJECT_CATALOG}=await import('../js/features/pixel-bible/object-catalog.js');
 assert.ok(Object.keys(OBJECT_CATALOG).length>=150);
 const items=chapterObjects({code:'gen',name:'창세기',chap:1,data:{people:[{name:'야곱'}],events:[{title:'돌',verses:'3-5',text:'야곱이 돌을 세우고 기름을 부어요.'}],story:'집으로 돌아와 불순종을 뉘우쳤어요.'}});
 assert.ok(items.find(i=>i.id==='stone').refs.includes('창세기 1:3-5'));
 assert.deepEqual(items.find(i=>i.id==='stone').actors,['야곱']);
 const empty=chapterObjects({code:'gen',name:'창세기',chap:1,data:{story:'그는 돌아가며 불순종을 뉘우치고 말을 전했어요.'}});
 assert.ok(!empty.some(i=>['stone','fire','horse'].includes(i.id)));
});

test('전 오브제에 단계별 모션이 있고 의자·물·밭은 서로 다른 자세를 사용한다',async()=>{
 const {OBJECT_CATALOG}=await import('../js/features/pixel-bible/object-catalog.js');
 const {interactionRoutine,interactionPose,INTERACTION_MOTION_COUNT}=await import('../js/features/pixel-bible/interaction-motion.js');
 assert.equal(INTERACTION_MOTION_COUNT,175);
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

test('보강 장면의 배우는 해당 장에 있고 인사·청취자는 잘못된 오브제 동작을 하지 않는다', async () => {
 const {ALL_SCENES,RUTH_SCENES}=await import('../js/features/pixel-bible/scenes.js');
 const {OBJECT_SCENES,objectLinesFor}=await import('../js/features/pixel-bible/object-scenes.js');
 const fs=await import('node:fs/promises');
 for(const scene of [...ALL_SCENES,...OBJECT_SCENES]){
  const book=JSON.parse(await fs.readFile(new URL(`../data/summary/${scene.code}.json`,import.meta.url)));
  const model=buildWorldModel([{code:scene.code,name:scene.code,chap:scene.chapter,data:book.chapters[scene.chapter]}]);
  for(const name of scene.actors)assert.ok(model.cast.some(p=>p.name===name),`${scene.id}: ${name}`);
  assert.ok(scene.lines.length>=2&&scene.ref);
  assert.ok(model.scenes.includes(scene));
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

test('표시 인물이 바뀌어도 기존 인물의 위치·경로·방향·오브제 동작과 재등장 상태를 보존한다',async()=>{
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

test('오브제 크기와 반응은 인물 동작에 맞추고 접근 표현은 저장된 위치를 바꾸지 않는다',async()=>{
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
 const calls=[];const c={save(){},restore(){},translate(){},rotate(){},scale(x,y){calls.push(['scale',x,y]);},fillRect(...args){calls.push(['rect',...args]);}};
 for(const kind of [...Object.keys(OBJECT_CATALOG),'well','oil','tree','field','bench']){
  const object={kind,x:8,y:9};const npc={name:'룻',x:7,y:9,usingObject:object,interactionStart:0};npc.interaction=interactionRoutine(npc,kind);
  const frame=objectInteractionFrame(object,[npc],1);
  assert.ok(Number.isFinite(frame.scale)&&frame.scale>0);
  drawWorldObject(c,object,24,frame);drawObjectResponse(c,object,frame);
 }
 assert.ok(calls.some(c=>c[0]==='rect'));
});

test('오브제 옮기기는 원래 물건은 제외하고 다른 물건·인물·경로와 화면 밖을 거절한다',async()=>{
 const {canMoveObject}=await import('../js/features/pixel-bible/object-drag.js');
 const o={kind:'water',x:8,y:9},other={kind:'tree',x:12,y:9},objects=[o,other];
 const n={x:15,y:9,path:[{x:16,y:9}]};
 assert.equal(canMoveObject(o,{x:8,y:9},objects,[n]),true);
 assert.equal(canMoveObject(o,{x:9,y:8},objects,[n]),true);
 for(const p of [{x:12,y:9},{x:15,y:9},{x:16,y:9},{x:1,y:9},{x:9,y:70},{x:9.5,y:8}])assert.equal(canMoveObject(o,p,objects,[n]),false);
 assert.deepEqual(o,{kind:'water',x:8,y:9});
});

test('모호한 관계 독백 대신 본문의 구체적 관계 설명과 출처를 사용한다',async()=>{
 const {personalLines}=await import('../js/features/pixel-bible/personal-lines.js');
 const {buildChapterDialogue}=await import('../js/features/pixel-bible/chapter-dialogue.js');
 const chapters=[{code:'rut',name:'룻기',chap:2,data:{people:[{name:'룻',role:'이삭을 줍는 며느리'},{name:'보아스',role:'밭 주인'}],rels:[{from:'보아스',to:'룻',label:'보호',verses:'8-9',note:'보아스는 룻에게 같은 밭에서 일하고 일꾼들이 길어 온 물을 마시도록 허락했습니다.'}]}}];
 const context=buildChapterDialogue(chapters),p=context.people.find(p=>p.name==='룻');
 const lines=personalLines({...p,refs:[p.ref]},chapters,context);
 assert.ok(lines.some(l=>l.text===context.relations[0].text&&l.ref==='룻기 2:8-9'));
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
 const left=interactionAnchor(n);assert.ok(left.x<o.x*24-60);assert.ok(left.y>o.y*24);
 n.x=10;n.y=11;assert.ok(interactionAnchor(n).y>=o.y*24+24);
});

test('물병은 손으로 들고 입 높이에서 기울인 뒤 다시 내려놓는다',async()=>{
 const {heldObject}=await import('../js/features/pixel-bible/object-response.js');
 const n={x:9,y:10,direction:'right',usingObject:{kind:'water',x:10,y:10},interactionStart:0,interaction:{category:'water',gesture:'drink',variant:0,phase:0,period:4}};
 assert.equal(heldObject(n,.1),null);
 const lift=heldObject(n,1.1),drink=heldObject(n,2.1);
 assert.equal(lift.kind,'water');assert.ok(drink.y<lift.y);assert.ok(Math.abs(drink.frame.tilt)>.5);
 assert.equal(heldObject(n,3.1),null);
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
  assert.equal(!!heldObject(n,routine.period*.3)||objectWorn(n,routine.period*.3),behavior.carry,kind);
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

test('전체 오브제는 같은 인물이 여섯 번 방문하면 여섯 결과를 선택한다',async()=>{
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
 assert.equal(interactionPose(n.interaction,0).wearing,false);assert.equal(objectWorn(n,1.1),true);assert.equal(heldObject(n,1.1),null);assert.equal(objectWorn(n,3.1),false);
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
