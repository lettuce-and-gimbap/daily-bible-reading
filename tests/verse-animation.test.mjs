import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {verseClipsForScene} from '../js/features/pixel-bible/verse-playback.js';
import {EVENT_ACTIONS,sampleEvent} from '../js/features/pixel-bible/event-animation/timeline.js';
import {EFFECTS} from '../js/features/pixel-bible/event-animation/effects.js';
import {VERSE_EFFECTS} from '../js/features/pixel-bible/event-animation/verse-effects.js';
import {buildWorldModel} from '../js/features/pixel-bible/world.js';
const data=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/mat.json')),summary=JSON.parse(fs.readFileSync('data/summary/mat.json'));
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
 const p=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/progress.json'));assert.equal(p.expected,7957);assert.equal(p.authored,1881);assert.equal(p.contentClips,1874);assert.equal(p.textualNotices,7);assert.equal(p.pending,6076);assert.ok(p.chapters.filter(c=>!['mat','mrk','luk'].includes(c.code)||c.code==='luk'&&c.chapter>2).every(c=>c.authored===0));
});
test('작성한 1071절 모두 실제 월드의 사건 진입점에서 접근할 수 있다',()=>{
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
 const p=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/progress.json'));assert.equal(p.contentClips,1874);assert.equal(p.textualNotices,7);
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
