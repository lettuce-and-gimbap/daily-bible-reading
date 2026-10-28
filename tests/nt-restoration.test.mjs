import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {ANIMATION_MOTIFS,ACTION_LABELS} from '../js/features/pixel-bible/event-animation/motifs.js';
import {EVENT_ACTIONS,sampleEvent} from '../js/features/pixel-bible/event-animation/timeline.js';
import {EFFECTS} from '../js/features/pixel-bible/event-animation/effects.js';
import {buildWorldModel} from '../js/features/pixel-bible/world.js';
import {recipeAssembled} from '../js/features/pixel-bible/recipe-locks.js';
const coverage=JSON.parse(fs.readFileSync('data/pixel-bible/events/coverage-nt.json'));
const codes=[...new Set(coverage.units.map(u=>u.code))];
const books=Object.fromEntries(codes.map(code=>[code,JSON.parse(fs.readFileSync(`data/pixel-bible/events/${code}.json`))]));
const all=Object.values(books).flatMap(b=>[...b.scenes,...b.restoredScenes]);
test('신약 260장 요약 단위 991개와 두 경계 구절이 모두 살아 있는 장면으로 연결된다',()=>{
 assert.equal(codes.length,27);assert.equal(coverage.units.length,993);assert.equal(new Set(coverage.units.map(u=>u.code+'.'+u.chapter)).size,260);
 assert.equal(new Set(all.map(s=>s.id)).size,all.length);assert.equal(all.length,1018);
 for(const u of coverage.units){const s=all.find(s=>s.id===u.scene);assert.ok(s?.sourceUnits.includes(u.unit),u.unit);}
});
test('복원 장면의 모든 동작·효과·인물은 유효하며 완료된 모션은 반복하지 않는다',()=>{
 for(const [code,data] of Object.entries(books)){
  const summary=JSON.parse(fs.readFileSync(`data/summary/${code}.json`));
  for(const s of data.restoredScenes){
   const a=s.animation;assert.ok(ANIMATION_MOTIFS[a.motif],s.id);assert.ok(EFFECTS.has(a.effect),s.id);assert.equal(a.beats.length,6);
   assert.equal(s.ref,a.ref);assert.ok(s.ref.includes(':'));assert.ok(s.lines.length&&s.lines.every(line=>line.length>0));assert.equal(s.narrationOnly,true);assert.deepEqual(s.actorLines,{});
   for(const n of s.actors)assert.ok(summary.chapters[s.chapter].people.some(p=>p.name===n),s.id+':'+n);
   for(const b of a.beats)assert.ok(EVENT_ACTIONS.includes(b.action)&&ACTION_LABELS[b.action],s.id+':'+b.action);
   const cast=s.actors.map(name=>({name}));for(const time of [0,2.5,4,6,8.2,100])for(const st of sampleEvent(s,cast,time).states)assert.ok(st.pose.eventArms.flat().every(Number.isFinite),s.id);
   assert.deepEqual(sampleEvent(s,cast,20).states,sampleEvent(s,cast,200).states);
  }
 }
});
test('설교에 인용된 조상은 현장 배우가 되지 않고 병자는 치료자와 구분된다',()=>{
 const find=(b,t)=>books[b].restoredScenes.find(s=>s.title===t);
 assert.deepEqual(find('act','베드로의 설교').actors,['베드로']);
 assert.deepEqual(find('jhn','실로암에서 씻음').actors,['날 때부터 맹인 된 사람']);
 assert.deepEqual(find('mrk','달리다굼').actors,['예수','야이로의 딸']);
 assert.equal(find('mat','변화산').animation.motif,'transfiguration');
 assert.equal(find('luk','구유에 누인 아기').animation.portrayals.예수.scale,0.5);
 assert.equal(find('mat','5000명을 먹이심').animation.basketCount,12);
 assert.equal(find('jhn','왕의 신하의 아들').animation.lead,'왕의 신하');assert.equal(find('jhn','왕의 신하의 아들').animation.target,'예수');
});
test('배우 없는 가르침은 거짓 배치 이스터에그로 자동 해금하지 않는다',()=>{
 const s=books.rom.restoredScenes[0];assert.deepEqual(s.actors,[]);assert.equal(s.animation.mode,'illustration');
 assert.equal(recipeAssembled(s,[],{kind:s.object,x:0,y:0},[]),false);
});
test('복원 장면은 실제 통독·QT 구절 필터를 통과하고 다른 분량으로 새지 않는다',()=>{
 const code='mrk',data=books[code],summary=JSON.parse(fs.readFileSync('data/summary/mrk.json'));
 const scene=data.restoredScenes.find(s=>s.title==='지붕을 뚫은 믿음');
 const chapter={code,name:'마가복음',chap:2,verses:[4],data:{...summary.chapters[2],eventScenes:[...data.scenes,...data.restoredScenes].filter(s=>s.chapter===2)}};
 assert.ok(buildWorldModel([chapter]).scenes.some(s=>s.sourceUnits?.includes(scene.sourceUnits[0])));
 assert.ok(!buildWorldModel([{...chapter,verses:[28]}]).scenes.some(s=>s.id===scene.id));
});

test('신약 260장의 모든 연결 단위는 실제 월드 구성에서도 누락되지 않는다',()=>{
 for(const [code,book]of Object.entries(books)){
  const summary=JSON.parse(fs.readFileSync(`data/summary/${code}.json`));
  for(const [chapter,c]of Object.entries(summary.chapters)){
   const eventScenes=[...book.scenes,...book.restoredScenes].filter(s=>s.chapter===Number(chapter));
   const model=buildWorldModel([{code,name:eventScenes[0].ref.split(' ')[0],chap:Number(chapter),data:{...c,eventScenes}}]);
   const found=new Set(model.scenes.flatMap(s=>s.sourceUnits||[]));
   for(const u of coverage.units.filter(u=>u.code===code&&u.chapter===Number(chapter)))assert.ok(found.has(u.unit),u.unit);
  }
 }
});
