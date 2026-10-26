import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {sampleEvent} from '../js/features/pixel-bible/event-animation/timeline.js';
const data=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/luk.json'));
test('누가복음 1장 80절의 번호와 찬가 경계가 원문 범위와 맞는다',()=>{
 assert.deepEqual(data.scenes.filter(s=>s.chapter===1).map(s=>s.verseNumbers[0]),Array.from({length:80},(_,i)=>i+1));
 const get=v=>data.scenes[v-1];assert.match(get(48).study,/여러 세대/);assert.match(get(49).title,/큰일/);assert.match(get(55).title,/아브라함/);assert.match(get(56).title,/집으로/);assert.match(get(57).title,/탄생/);
 for(const scene of data.scenes)for(const t of [0,3,8.2,30])for(const state of sampleEvent(scene,scene.actors.map(name=>({name})),t).states)assert.ok(state.pose.eventArms.flat().every(Number.isFinite),scene.id);
});
