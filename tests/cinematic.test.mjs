import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGS_SCENES} from '../js/features/pixel-bible/2ki-scenes.js';
import {KINGS_DIRECTION,sceneBeat} from '../js/features/pixel-bible/cinematic-scenes.js';
import {renderCinematic} from '../js/features/pixel-bible/cinematic.js';
test('열왕기하 60장면에 명시한 연출이 있으며 모든 프레임과 초상화가 유효한 좌표로 그려진다',()=>{
 const numbers=args=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v));};
 const ctx=new Proxy({},{get:(_,key)=>key==='measureText'?()=>({width:10}):(...args)=>numbers(args),set:()=>true});
 assert.equal(KINGS_SCENES.length,60);
 for(const scene of KINGS_SCENES){assert.ok(KINGS_DIRECTION[scene.id],scene.id);const actors=scene.actors.map(name=>({name,refs:[scene.ref]}));for(const second of [0,1,3,6,9])renderCinematic(ctx,scene,actors,second);renderCinematic(ctx,scene,actors,2,{portrait:true});}
 assert.equal(sceneBeat(10),1);assert.equal(sceneBeat(-1),0);
});
test('행동 주체를 지정해 상대 인물에게 같은 동작을 적용하지 않는다',()=>{
 for(const d of Object.values(KINGS_DIRECTION))assert.ok([0,1].includes(d.lead));assert.equal(KINGS_DIRECTION['2ki-review-33'].lead,1);
 assert.equal(KINGS_DIRECTION['2ki-review-33'].pose,'shoot');assert.equal(KINGS_DIRECTION['2ki-review-34'].pose,'strike');
 assert.equal(KINGS_DIRECTION['2ki-review-3'].effect,'divide');assert.equal(KINGS_DIRECTION['2ki-review-18'].effect,'axe');
});
