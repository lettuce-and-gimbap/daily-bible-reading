import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {sampleEvent} from '../js/features/pixel-bible/event-animation/timeline.js';
const data=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/luk.json'));
test('누가복음 1장 80절의 번호와 찬가 경계가 원문 범위와 맞는다',()=>{
 assert.deepEqual(data.scenes.filter(s=>s.chapter===1).map(s=>s.verseNumbers[0]),Array.from({length:80},(_,i)=>i+1));
 const get=v=>data.scenes[v-1];assert.match(get(48).study,/여러 세대/);assert.match(get(49).title,/큰일/);assert.match(get(55).title,/아브라함/);assert.match(get(56).title,/집으로/);assert.match(get(57).title,/탄생/);
 for(const scene of data.scenes)for(const t of [0,3,8.2,30])for(const state of sampleEvent(scene,scene.actors.map(name=>({name})),t).states)assert.ok(state.pose.eventArms.flat().every(Number.isFinite),scene.id);
});

test('누가복음 2장은 52절을 빠짐없이 연결하고 아기와 소년을 구별한다',()=>{
 const scenes=data.scenes.filter(s=>s.chapter===2);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:52},(_,i)=>i+1));
 assert.equal(scenes[27].animation.portrayals.예수.scale,.5);assert.equal(scenes[45].animation.portrayals.예수.scale,.75);
});

test('누가복음 3장은 38절을 연결하고 족보의 역본 차이를 보존한다',()=>{
 const scenes=data.scenes.filter(s=>s.chapter===3);assert.deepEqual(scenes.map(s=>s.verseNumbers[0]),Array.from({length:38},(_,i)=>i+1));
 assert.equal(scenes[21].animation.effect,'dove-descend');assert.equal(scenes[32].editionVariant,true);assert.match(scenes[32].study,/아드민/);
});
test('누가복음에서 인용된 황제·선지자와 과거 심판 인물은 현장 출연자로 만들지 않는다',()=>{
 const get=(chapter,verse)=>data.scenes.find(scene=>scene.chapter===chapter&&scene.verseNumbers[0]===verse);
 assert.equal(get(2,1).actors.includes('가이사 아구스도'),false);
 for(const verse of [18,19,26,27,28,29,30,33])assert.equal(get(7,verse).actors.includes('세례 요한'),false);
 for(const verse of [27,29,32,33,35])for(const name of ['노아','롯','롯의 처'])assert.equal(get(17,verse).actors.includes(name),false);
});
