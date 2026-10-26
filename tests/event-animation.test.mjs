import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ANIMATION_MOTIFS,ACTION_LABELS} from '../js/features/pixel-bible/event-animation/motifs.js';
import {EVENT_ACTIONS,sampleEvent,eventPlan} from '../js/features/pixel-bible/event-animation/timeline.js';
import {EFFECTS} from '../js/features/pixel-bible/event-animation/effects.js';
import {eventLayout} from '../js/features/pixel-bible/pixel-event.js';
import {enhanceScene} from '../js/features/pixel-bible/scripted-events.js';
const review=JSON.parse(fs.readFileSync('data/pixel-bible/animation-review.json'));
const books=review.books.map(b=>[b.code,JSON.parse(fs.readFileSync('data/pixel-bible/events/'+b.code+'.json'))]);
test('구약 39권의 모든 등록 사건은 배우·구절에 연결된 개별 동작 순서를 갖는다',()=>{
 assert.equal(books.length,39);let total=0;
 for(const [code,data]of books){assert.ok(data.scenes.length,code+' missing scenes');for(const s of data.scenes){total++;const a=s.animation;assert.equal(a.version,2);assert.equal(a.ref,s.ref);assert.ok(s.actors.includes(a.lead),s.id+' lead');assert.ok(ANIMATION_MOTIFS[a.motif]);assert.equal(a.beats.length,6);assert.ok(a.beats.every(b=>b.duration>0&&EVENT_ACTIONS.includes(b.action)&&ACTION_LABELS[b.action]));assert.ok(EFFECTS.has(a.effect),a.effect);assert.ok(a.duration>=8);if(a.support)assert.ok(s.actors.includes(a.support.actor));}}
 assert.equal(total,1276)
});
test('모든 사건의 단계 전환은 유효한 도트 관절을 가지며 완료 후 동작을 다시 시작하지 않는다',()=>{
 for(const [,data]of books)for(const raw of data.scenes){const cast=raw.actors.map(name=>({name,refs:[raw.ref]})),s=enhanceScene(raw,cast);for(const seconds of [0,.9,1.1,2.3,4.2,6.7,8.2,20]){const result=sampleEvent(s,cast,seconds),layout=eventLayout(result);assert.ok(result.index>=0&&result.index<6);for(const [i,n]of result.states.entries()){assert.ok(Number.isFinite(n.travel));assert.ok(n.pose.eventArms.flat().every(Number.isFinite),s.id);for(const arm of n.pose.eventArms)assert.ok(arm.every(v=>v>=0&&v<=36),s.id+' limb bounds');assert.ok(layout.positions[i].x>=85&&layout.positions[i].x<=640);}}
 assert.deepEqual(sampleEvent(s,cast,20).states,sampleEvent(s,cast,200).states,s.id+' final hold');}
});
test('동일 오브젝트여도 꿈·기름 붓기·돌 굴리기는 서로 다른 사건 동작을 사용한다',()=>{
 const gen=books.find(([b])=>b==='gen')[1].scenes;
 const a=gen.find(s=>s.title==='사닥다리 꿈'),b=gen.find(s=>s.title==='하나님의 집'),d=gen.find(s=>s.title==='우물가의 라헬');
 assert.notDeepEqual(a.animation.beats.map(b=>b.action),b.animation.beats.map(b=>b.action));assert.notDeepEqual(b.animation.beats.map(b=>b.action),d.animation.beats.map(b=>b.action));
});
test('아골 골짜기 장면은 돌을 던지는 백성과 쓰러지는 아간을 따로 연출한다',()=>{
 const scene=books.find(([code])=>code==='jos')[1].scenes.find(s=>s.id==='ot-jos-7-3');
 assert.deepEqual(scene.actors,['이스라엘 자손','아간']);
 assert.equal(scene.animation.lead,'이스라엘 자손');assert.equal(scene.animation.target,'아간');
 assert.equal(scene.animation.effect,'sling');assert.equal(scene.animation.support.actor,'아간');
 const cast=scene.actors.map(name=>({name,refs:[scene.ref]}));
 assert.equal(sampleEvent(scene,cast,4).states[0].action,'windup');assert.equal(sampleEvent(scene,cast,6).states[1].pose.lie,true);
});
test('기브온 사람들의 노동 장면은 상징 대사가 아니라 나무 패기와 물 긷는 동작을 보인다',()=>{
 const scene=books.find(([code])=>code==='jos')[1].scenes.find(s=>s.id==='ot-jos-9-3');
 assert.equal(scene.animation.motif,'woodcut');assert.equal(scene.animation.effect,'woodcut');
 assert.deepEqual(scene.animation.beats.map(b=>b.action),['walk','grasp','windup','strike','scoop','carry']);
 assert.equal(scene.actors[0],'기브온 사람들');
});
test('성경 본문의 행동 주체와 비유·예언의 상징 모드를 구분한다',()=>{
 const gen=books.find(([b])=>b==='gen')[1].scenes;assert.deepEqual(gen.find(s=>s.title==='속은 아버지').actors,['야곱']);assert.equal(gen.find(s=>s.title==='베냐민의 자루 속 은잔').object,'cup');
 for(const b of ['psa','pro','ecc','sng','oba','nam','zep'])for(const s of books.find(([code])=>code===b)[1].scenes)assert.equal(s.animation.mode,'illustration');
 const s=gen.find(s=>s.title==='두 형제의 제물');assert.equal(s.animation.support.actor,'아벨');assert.equal(eventPlan(s).lead,'가인');
});

test('두 번째 배우가 행동 주체여도 두 인물이 서로를 향해 서고 소품 좌표가 방향을 따른다',()=>{
 const scene=books.find(([b])=>b==='1sa')[1].scenes.find(s=>s.title==='막내 다윗'),cast=scene.actors.map(name=>({name}));
 const layout=eventLayout(sampleEvent(scene,cast,0));assert.equal(scene.animation.lead,'사무엘');
 assert.equal(layout.positions[1].direction,'right');assert.equal(layout.positions[0].direction,'left');assert.ok(layout.positions[1].x<layout.positions[0].x);
});
