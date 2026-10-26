import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {verseClipsForScene} from '../js/features/pixel-bible/verse-playback.js';
import {EVENT_ACTIONS,sampleEvent} from '../js/features/pixel-bible/event-animation/timeline.js';
import {EFFECTS} from '../js/features/pixel-bible/event-animation/effects.js';
import {VERSE_EFFECTS} from '../js/features/pixel-bible/event-animation/verse-effects.js';
import {buildWorldModel} from '../js/features/pixel-bible/world.js';
const data=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/mat.json')),summary=JSON.parse(fs.readFileSync('data/summary/mat.json'));
const john=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/jhn.json'));
const john1=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/1jn.json'));
const acts=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/act.json'));
const romans=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/rom.json'));
const corinthians=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/1co.json'));
const secondCorinthians=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/2co.json'));
const hebrews=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/heb.json'));
const galatians=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/gal.json'));
const philippians=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/php.json'));
const ephesians=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/eph.json'));
const colossians=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/col.json'));
const thessalonians1=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/1th.json'));
const thessalonians2=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/2th.json'));
const philemon=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/phm.json'));
const john2=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/2jn.json'));
const john3=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/3jn.json'));
const jude=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/jud.json'));
const peter2=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/2pe.json'));
const peter1=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/1pe.json'));
const titus=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/tit.json'));
const timothy2=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/2ti.json'));
const timothy1=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/1ti.json'));

test('사도행전 1–28장은 역본의 절 번호를 대조해 장면을 구성한다',()=>{
 for(const [chapter,count]of [[1,26],[2,47],[3,26],[4,37],[5,42],[6,15],[7,60],[8,40],[9,43],[10,48],[11,30],[12,25],[13,52],[14,28],[15,41],[16,40],[17,34],[18,28],[19,41],[20,38],[21,40],[22,30],[23,35],[24,27],[25,27],[26,32],[27,44],[28,31]]){const scenes=acts.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
 const variants=acts.scenes.filter(s=>s.chapter===15&&s.editionVariant).map(s=>s.verseNumbers[0]);assert.deepEqual(variants,[25,26]);for(const [chapter,verse]of [[8,37],[15,34],[24,7],[28,29]])assert.ok(acts.scenes.find(s=>s.chapter===chapter&&s.verseNumbers[0]===verse).textualNotice);
});
test('로마서 1–16장은 논증 흐름을 따라 절별 장면을 구성한다',()=>{
 for(const [chapter,count]of [[1,32],[2,29],[3,31],[4,25],[5,21],[6,23],[7,25],[8,39],[9,33],[10,21],[11,36],[12,21],[13,14],[14,23],[15,33],[16,27]]){const scenes=romans.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
 assert.deepEqual(romans.scenes.filter(s=>s.chapter===9&&s.editionVariant).map(s=>s.verseNumbers[0]),[1,2]);
});
test('고린도전서 1–16장은 장별 절 번호와 맞는 설명 장면을 갖는다',()=>{
 for(const [chapter,count]of [[1,31],[2,16],[3,23],[4,21],[5,13],[6,20],[7,40],[8,13],[9,27],[10,33],[11,34],[12,31],[13,13],[14,40],[15,58],[16,24]]){const scenes=corinthians.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('고린도후서 1–13장은 장별 256절 장면을 만들고 본문 흐름에 맞춰 편지·위로·연보 동작을 바꾼다',()=>{
 for(const [chapter,count]of [[1,24],[2,17],[3,18],[4,18],[5,21],[6,18],[7,16],[8,24],[9,15],[10,18],[11,33],[12,21],[13,13]]){
  const scenes=secondCorinthians.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));
  for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);for(const beat of s.animation.beats)assert.ok(EVENT_ACTIONS.includes(beat.action));}
 }
 assert.ok(secondCorinthians.scenes.some(s=>s.object==='seed'));assert.ok(secondCorinthians.scenes.some(s=>s.animation.motif==='reconcile'));
});
test('히브리서 1–13장은 303절을 논증 흐름과 믿음의 본보기별로 장면화한다',()=>{
 for(const [chapter,count]of [[1,14],[2,18],[3,19],[4,16],[5,14],[6,20],[7,28],[8,13],[9,28],[10,39],[11,40],[12,29],[13,25]]){const scenes=hebrews.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);for(const beat of s.animation.beats)assert.ok(EVENT_ACTIONS.includes(beat.action));}}
 assert.ok(hebrews.scenes.some(s=>s.animation.motif==='sacrifice'));assert.ok(hebrews.scenes.some(s=>s.animation.motif==='report'));
});
test('갈라디아서 1–6장은 장별 절 번호와 맞는 설명 장면을 갖는다',()=>{
 for(const [chapter,count]of [[1,24],[2,21],[3,29],[4,31],[5,26],[6,18]]){const scenes=galatians.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('빌립보서 1–4장은 장별 절 번호와 맞는 설명 장면을 갖는다',()=>{
 for(const [chapter,count]of [[1,30],[2,30],[3,21],[4,23]]){const scenes=philippians.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('에베소서 1–6장은 장별 절 번호와 맞는 설명 장면을 갖는다',()=>{
 for(const [chapter,count]of [[1,23],[2,22],[3,21],[4,32],[5,33],[6,24]]){const scenes=ephesians.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('골로새서 1–4장은 장별 절 번호와 맞는 설명 장면을 갖는다',()=>{
 for(const [chapter,count]of [[1,29],[2,23],[3,25],[4,18]]){const scenes=colossians.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('데살로니가전서 1–5장은 장별 절 번호와 맞는 설명 장면을 갖는다',()=>{
 for(const [chapter,count]of [[1,10],[2,20],[3,13],[4,18],[5,28]]){const scenes=thessalonians1.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('데살로니가후서 1–3장은 장별 절 번호와 맞는 설명 장면을 갖는다',()=>{
 for(const [chapter,count]of [[1,12],[2,17],[3,18]]){const scenes=thessalonians2.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('빌레몬서·요한이서·요한삼서·유다서는 장별 절 수대로 장면이 있다',()=>{
 for(const [book,counts]of [[philemon,[[1,25]]],[john2,[[1,13]]],[john3,[[1,15]]],[jude,[[1,25]]]])for(const [chapter,count]of counts){const scenes=book.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('베드로후서 1–3장은 장별 절 수대로 장면이 있다',()=>{
 for(const [chapter,count]of [[1,21],[2,22],[3,18]]){const scenes=peter2.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('베드로전서 1–5장은 장별 절 수대로 장면이 있다',()=>{
 for(const [chapter,count]of [[1,25],[2,25],[3,22],[4,19],[5,14]]){const scenes=peter1.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('디도서 1–3장은 장별 절 수대로 장면이 있다',()=>{
 for(const [chapter,count]of [[1,16],[2,15],[3,15]]){const scenes=titus.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('디모데후서 1–4장은 장별 절 수대로 장면이 있다',()=>{
 for(const [chapter,count]of [[1,18],[2,26],[3,17],[4,22]]){const scenes=timothy2.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('디모데전서 1–6장은 장별 절 수대로 장면이 있다',()=>{
 for(const [chapter,count]of [[1,20],[2,15],[3,16],[4,16],[5,25],[6,21]]){const scenes=timothy1.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('요한일서 5개 장 105절이 빠짐이나 중복 없이 모두 작성됐다',()=>{
 assert.equal(john1.scenes.length,105);
 for(const [chapter,count]of [[1,10],[2,29],[3,24],[4,21],[5,21]])assert.deepEqual(john1.scenes.filter(s=>s.chapter===chapter).map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));
 for(const s of john1.scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}
});
test('요한복음 7–21장은 실제 장별 절 수대로 빈틈없이 장면이 있다',()=>{
 for(const [chapter,count]of [[7,53],[8,59],[9,41],[10,42],[11,57],[12,50],[13,38],[14,31],[15,27],[16,33],[17,26],[18,40],[19,42],[20,31],[21,25]]){const scenes=john.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));for(const s of scenes){assert.ok(s.title&&s.study);assert.equal(s.animation.beats.length,6);}}
});
test('절별로 직접 작성한 1071개 연출은 1–28장 번호에 빈틈이나 중복이 없다',()=>{
 assert.equal(data.scenes.length,1071);for(const [chapter,count]of [[1,25],[2,23],[3,17],[4,25],[5,48],[6,34],[7,29],[8,34],[9,38],[10,42],[11,30],[12,50],[13,58],[14,36],[15,39],[16,28],[17,27],[18,35],[19,30],[20,34],[21,46],[22,46],[23,39],[24,51],[25,46],[26,75],[27,66],[28,20]])assert.deepEqual(data.scenes.filter(s=>s.chapter===chapter).map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));
 for(const s of data.scenes){assert.equal(s.verseNumbers.length,1);assert.ok(s.study&&s.title);assert.equal(s.animation.beats.length,6);for(const n of s.actors)assert.ok([...summary.chapters[s.chapter].people,...(data.additionalPeople[s.chapter]||[])].some(p=>p.name===n));assert.ok(EFFECTS.has(s.animation.effect)||VERSE_EFFECTS.has(s.animation.effect));for(const b of s.animation.beats)assert.ok(EVENT_ACTIONS.includes(b.action));}
});
test('절 선택은 현재 사건 범위와 QT 선택 절을 모두 지킨다',()=>{
 const scene={code:'mat',chapter:3,verseNumbers:[13,14,15,16,17]};assert.deepEqual(verseClipsForScene(scene,data.scenes,[14,16]).map(s=>s.verseNumbers[0]),[14,16]);
 assert.deepEqual(verseClipsForScene({...scene,code:'jhn'},data.scenes),[]);
 const events=JSON.parse(fs.readFileSync('data/pixel-bible/events/mat.json'));
 const c={code:'mat',chap:3,name:'마태복음',verses:[14],data:{...summary.chapters[3],verseClips:data.scenes,eventScenes:[...events.scenes,...events.restoredScenes].filter(s=>s.chapter===3)}};
 for(const scene of buildWorldModel([c]).scenes)for(const clip of scene.verseClips)assert.deepEqual(clip.verseNumbers,[14]);
});
test('족보·비유·실제 사건을 구분하고 그물 버리기와 던지기를 별도로 작성했다',()=>{
 const get=(ch,v)=>data.scenes.find(s=>s.chapter===ch&&s.verseNumbers[0]===v);
 assert.equal(get(1,2).animation.diagram.kind,'lineage');assert.notDeepEqual(get(1,2).animation.diagram.labels,get(1,3).animation.diagram.labels);
 assert.equal(get(2,14).animation.directions.마리아,'right');assert.ok(get(2,14).animation.tracks.마리아.includes('carry'));
 assert.equal(get(3,16).animation.effect,'dove-descend');assert.equal(get(4,18).animation.effect,'cast-net');assert.equal(get(4,20).animation.propFixed,true);
 assert.equal(get(7,25).animation.diagram.kind,'house-storm');assert.equal(get(7,27).animation.diagram.kind,'house-fall');
});
test('주연 외 동작 트랙과 가시성은 절의 순서대로 움직이며 끝에서 반복하지 않는다',()=>{
 const s=data.scenes.find(s=>s.chapter===4&&s.verseNumbers[0]===11),cast=s.actors.map(name=>({name}));assert.equal(sampleEvent(s,cast,0).states[1].visible,true);assert.equal(sampleEvent(s,cast,8.2).states[1].visible,false);
 assert.ok(sampleEvent(s,cast,4).states[1].travel!==0);
 for(const s of data.scenes){const cast=s.actors.map(name=>({name}));for(const t of [0,1,3,5,8.2,40])for(const st of sampleEvent(s,cast,t).states)assert.ok(st.pose.eventArms.flat().every(Number.isFinite));assert.deepEqual(sampleEvent(s,cast,20).states,sampleEvent(s,cast,200).states);}
});
test('미작성 절은 제작 완료 수에 들어가지 않는다',()=>{
 const p=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/progress.json'));assert.equal(p.expected,7957);assert.equal(p.authored,7445);assert.equal(p.contentClips,7433);assert.equal(p.textualNotices,12);assert.equal(p.pending,512);assert.ok(p.chapters.filter(c=>!['mat','mrk','luk','jhn','1jn','act','rom','1co','2co','heb','gal','php','eph','col','1th','2th','phm','2jn','3jn','jud','2pe','1pe','tit','2ti','1ti'].includes(c.code)||c.code==='luk'&&c.chapter>24||c.code==='jhn'&&c.chapter>21||c.code==='act'&&c.chapter>28||c.code==='rom'&&c.chapter>16||c.code==='1co'&&c.chapter>16||c.code==='2co'&&c.chapter>13||c.code==='heb'&&c.chapter>13||c.code==='gal'&&c.chapter>6||c.code==='php'&&c.chapter>4||c.code==='eph'&&c.chapter>6||c.code==='col'&&c.chapter>4||c.code==='1th'&&c.chapter>5||c.code==='2th'&&c.chapter>3||c.code==='phm'&&c.chapter>1||c.code==='1jn'&&c.chapter>5||c.code==='2jn'&&c.chapter>1||c.code==='3jn'&&c.chapter>1||c.code==='jud'&&c.chapter>1||c.code==='2pe'&&c.chapter>3||c.code==='1pe'&&c.chapter>5||c.code==='tit'&&c.chapter>3||c.code==='2ti'&&c.chapter>4||c.code==='1ti'&&c.chapter>6).every(c=>c.authored===0));
});
test('작성한 마태복음 1071절 모두 실제 월드의 사건 진입점에서 접근할 수 있다',()=>{
 const events=JSON.parse(fs.readFileSync('data/pixel-bible/events/mat.json'));
 for(let chapter=1;chapter<=28;chapter++){
  const c={code:'mat',chap:chapter,name:'마태복음',data:{...summary.chapters[chapter],people:[...summary.chapters[chapter].people,...(data.additionalPeople[chapter]||[])],verseClips:data.scenes.filter(s=>s.chapter===chapter),eventScenes:[...events.scenes,...events.restoredScenes].filter(s=>s.chapter===chapter)}};
  const found=new Set(buildWorldModel([c]).scenes.flatMap(s=>s.verseClips.map(v=>v.id)));
  for(const s of c.data.verseClips)assert.ok(found.has(s.id),s.id);
 }
});
test('병자가 침상을 든 뒤 걷는 동안 물건을 다시 바닥으로 내려놓지 않는다',()=>{
 const s=data.scenes.find(s=>s.chapter===9&&s.verseNumbers[0]===7),cast=s.actors.map(name=>({name}));assert.equal(s.animation.propPortable,true);
 for(const t of [5,6.5,8.2])assert.equal(sampleEvent(s,cast,t).states[0].held,true);
});

test('본문이 없는 절과 역본별 배열 차이를 사건으로 단정하지 않는다',()=>{
 const get=(ch,v)=>data.scenes.find(s=>s.chapter===ch&&s.verseNumbers[0]===v);
 assert.deepEqual(data.scenes.filter(s=>s.textualNotice).map(s=>[s.chapter,s.verseNumbers[0]]),[[17,21],[18,11],[23,14]]);
 for(const s of data.scenes.filter(s=>s.textualNotice)){assert.equal(s.animation.diagram.kind,'edition-note');assert.deepEqual(s.actors,[]);}
 assert.equal(get(21,29).editionVariant,true);assert.deepEqual(get(21,29).animation.diagram.patterns,['yes-stay','no-go']);assert.deepEqual(get(21,30).animation.diagram.patterns,['no-go','yes-stay']);
 assert.equal(get(17,27).animation.mode,'illustration');assert.equal(get(28,13).animation.effect,'none');
 const p=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/progress.json'));assert.equal(p.contentClips,7433);assert.equal(p.textualNotices,12);
});
test('물 위 이동·상 뒤집기·나귀 이동을 명시적 경로로 구분한다',async()=>{
 const {eventLayout}=await import('../js/features/pixel-bible/pixel-event.js');
 const {sampleVersePoint}=await import('../js/features/pixel-bible/event-animation/verse-paths.js');
 const get=(ch,v)=>data.scenes.find(s=>s.chapter===ch&&s.verseNumbers[0]===v);
 for(const [ch,v] of [[14,29],[14,30],[14,31],[21,9],[27,60],[28,2]]){const s=get(ch,v),cast=s.actors.map(name=>({name}));for(const t of [0,3,8.2]){const l=eventLayout(sampleEvent(s,cast,t));assert.ok([...l.positions,l.prop].every(p=>[p.x,p.y].every(Number.isFinite)));}}
 assert.deepEqual(get(21,12).animation.propAngles,[0,0,0,.5,1.2,1.57]);
 const ride=get(21,9).animation;assert.deepEqual(ride.propPath,ride.waypoints.예수);
 assert.deepEqual(sampleVersePoint([{x:0,y:0},{x:32,y:16}],1,.5),{x:16,y:8});
 assert.equal(get(15,28).animation.remoteLabel,'다른 곳의 딸');
 assert.equal(get(14,20).animation.diagram.count,12);assert.equal(get(15,37).animation.diagram.count,7);
 assert.equal(get(18,23).animation.mode,'parable');
});
