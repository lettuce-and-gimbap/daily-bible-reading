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
 assert.equal(total,1432)
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

test('솔로몬의 즉위는 솔로몬이 왕위를 받고 다윗이 다시 대관하지 않는다',()=>{
 const s=books.find(([code])=>code==='1ch')[1].scenes.find(s=>s.id==='ot-1ch-extra-29');
 assert.equal(s.animation.lead,'솔로몬');assert(s.animation.beats.every(b=>b.actor==='솔로몬'));assert.equal(s.animation.beats.at(-1).action,'sit');
});
test('성전 봉헌의 제사장은 나팔을 불고 영광의 구름 앞에서 봉사를 멈춘다',()=>{
 const scenes=books.find(([code])=>code==='2ch')[1].scenes,a=scenes.find(s=>s.id==='ot-2ch-5-2'),b=scenes.find(s=>s.id==='ot-2ch-5-3');
 assert.equal(a.animation.prop,'trumpet');assert(a.animation.beats.some(x=>x.action==='blow'));assert.equal(b.animation.setting,'courtyard');assert(b.animation.beats.some(x=>x.action==='halt'));assert.equal(b.animation.beats.at(-1).action,'kneel');
});
test('구약 장면의 공유 절은 찬양과 구름이 동시 발생하는 성전 봉헌 연결에만 남는다',()=>{
 const overlaps=[];for(const [code,data]of books)for(let ch=1;ch<=150;ch++){const scenes=data.scenes.filter(s=>s.chapter===ch&&!s.id.startsWith('ot-voice-'));for(let i=0;i<scenes.length;i++)for(let j=i+1;j<scenes.length;j++){const a=scenes[i],b=scenes[j];if(a.verseNumbers.some(v=>b.verseNumbers.includes(v)))overlaps.push([code,...[a.id,b.id].sort()]);}}
 assert.deepEqual(overlaps,[['2ch','ot-2ch-5-2','ot-2ch-5-3']]);
});

test('찬양을 맡기는 다윗과 연주하는 아삽의 동작을 구분한다',()=>{
 const scenes=books.find(([c])=>c==='1ch')[1].scenes;for(const id of ['ot-1ch-16-1','ot-1ch-extra-17']){const a=scenes.find(s=>s.id===id).animation;assert.equal(a.lead,'아삽');assert.equal(a.prop,'cymbal');assert(a.beats.some(b=>b.action==='strike'));assert(!a.beats.some(b=>b.action==='strum'));}
});
test('왕후 선발 명령은 왕의 재대관을 연출하지 않고 유다의 기름 부음은 다윗을 향한다',()=>{
 const a=books.find(([c])=>c==='est')[1].scenes.find(s=>s.id==='ot-est-extra-2-0').animation;assert.equal(a.motif,'decree');assert(!a.beats.some(b=>b.action==='wear'));assert(a.beats.some(b=>b.action==='signal'));
 const b=books.find(([c])=>c==='2sa')[1].scenes.find(s=>s.id==='ot-2sa-2-1').animation;assert.equal(b.lead,'유다 사람들');assert.equal(b.target,'다윗');assert(b.beats.every(x=>x.actor==='유다 사람들'));
});

test('이다말은 게르손·므라리 운반을 감독하며 짐을 직접 메지 않는다',()=>{
 const scenes=books.find(([c])=>c==='num')[1].scenes;for(const id of ['ot-num-4-1','ot-num-4-2']){const a=scenes.find(s=>s.id===id).animation;assert.equal(a.lead,'이다말');assert.equal(a.motif,'instruct');assert(a.beats.some(b=>b.action==='signal'));assert(!a.beats.some(b=>b.action==='carry'));}
});
test('열두 돌은 열두 사람이 메고 언약궤는 다윗 대신 레위인들이 멘다',()=>{
 const a=books.find(([c])=>c==='jos')[1].scenes.find(s=>s.id==='ot-jos-4-0').animation;assert.equal(a.lead,'열두 사람');assert(a.beats.some(b=>b.action==='carry'));
 const scenes=books.find(([c])=>c==='1ch')[1].scenes;for(const id of ['ot-1ch-15-0','ot-voice-25']){const a=scenes.find(s=>s.id===id).animation;assert.equal(a.lead,'레위인들');assert(a.beats.filter(b=>b.action==='carry').every(b=>b.actor==='레위인들'));}
});

test('창세기 창조·에덴 장면에 모세의 떨기나무와 신 벗기 동작이 연결되지 않는다',()=>{
 const scenes=books.find(([c])=>c==='gen')[1].scenes;for(const id of ['ot-gen-extra-1-0','ot-gen-extra-2-0']){const a=scenes.find(s=>s.id===id).animation;assert.equal(a.mode,'illustration');assert.notEqual(a.effect,'bush-fire');assert(!a.beats.some(b=>b.action==='remove-shoe'));}
 const a=scenes.find(s=>s.id==='ot-gen-extra-2-0').animation;assert.equal(a.lead,'아담');assert.equal(a.setting,'garden');assert(a.beats.some(b=>b.action==='sleep'));
});

test('창세기 동작은 해당 장면에 실제 등록된 배우에게만 배정된다',()=>{
 const data=books.find(([code])=>code==='gen')[1];
 for(const scene of data.scenes)for(const beat of scene.animation.beats)if(beat.actor)assert(scene.actors.includes(beat.actor),scene.id+': '+beat.actor);
});
