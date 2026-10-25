import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {verseClipsForScene} from '../js/features/pixel-bible/verse-playback.js';
import {EVENT_ACTIONS,sampleEvent} from '../js/features/pixel-bible/event-animation/timeline.js';
import {EFFECTS} from '../js/features/pixel-bible/event-animation/effects.js';
import {VERSE_EFFECTS} from '../js/features/pixel-bible/event-animation/verse-effects.js';
import {buildWorldModel} from '../js/features/pixel-bible/world.js';
const data=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/mat.json')),summary=JSON.parse(fs.readFileSync('data/summary/mat.json'));
test('절별로 직접 작성한 273개 연출은 1–9장 번호에 빈틈이나 중복이 없다',()=>{
 assert.equal(data.scenes.length,273);for(const [chapter,count]of [[1,25],[2,23],[3,17],[4,25],[5,48],[6,34],[7,29],[8,34],[9,38]])assert.deepEqual(data.scenes.filter(s=>s.chapter===chapter).map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));
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
 const p=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/progress.json'));assert.equal(p.expected,7957);assert.equal(p.authored,273);assert.equal(p.pending,7684);assert.ok(p.chapters.filter(c=>c.code!=='mat'||c.chapter>9).every(c=>c.authored===0));
});
test('작성한 273절 모두 실제 월드의 사건 진입점에서 접근할 수 있다',()=>{
 const events=JSON.parse(fs.readFileSync('data/pixel-bible/events/mat.json'));
 for(let chapter=1;chapter<=9;chapter++){
  const c={code:'mat',chap:chapter,name:'마태복음',data:{...summary.chapters[chapter],people:[...summary.chapters[chapter].people,...(data.additionalPeople[chapter]||[])],verseClips:data.scenes.filter(s=>s.chapter===chapter),eventScenes:[...events.scenes,...events.restoredScenes].filter(s=>s.chapter===chapter)}};
  const found=new Set(buildWorldModel([c]).scenes.flatMap(s=>s.verseClips.map(v=>v.id)));
  for(const s of c.data.verseClips)assert.ok(found.has(s.id),s.id);
 }
});
test('병자가 침상을 든 뒤 걷는 동안 물건을 다시 바닥으로 내려놓지 않는다',()=>{
 const s=data.scenes.find(s=>s.chapter===9&&s.verseNumbers[0]===7),cast=s.actors.map(name=>({name}));assert.equal(s.animation.propPortable,true);
 for(const t of [5,6.5,8.2])assert.equal(sampleEvent(s,cast,t).states[0].held,true);
});
