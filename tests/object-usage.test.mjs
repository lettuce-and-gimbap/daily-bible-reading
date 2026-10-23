import test from 'node:test';
import assert from 'node:assert/strict';
import {interactionOptions,interactionPose,interactionRoutine} from '../js/features/pixel-bible/interaction-motion.js';
import {objectPresentation,interactionAnchor,heldObject} from '../js/features/pixel-bible/object-response.js';
import {objectBehavior} from '../js/features/pixel-bible/object-behavior.js';
import {drawFaceExpression,EXPRESSIONS} from '../js/features/pixel-bible/expression.js';

test('침상은 베개 쪽에 머리를 놓고 눕고, 화살의 모든 변형은 당기기·발사 자세를 사용한다',()=>{
 for(const kind of ['bed','mat']){
  assert.equal(objectBehavior(kind).carry,false);
  const routine={...interactionRoutine({name:'일꾼'},kind),gesture:'sleep',phase:0};
  for(let phase=0;phase<4;phase++)assert.ok(interactionPose(routine,routine.period*(phase+.1)/4).lie);
  const n={x:9,y:10,usingObject:{kind,x:10,y:10},interaction:routine};
  assert.deepEqual(interactionAnchor(n),{x:240,y:254});
  assert.equal(heldObject(n,routine.period*.3),null);
 }
 for(const kind of ['arrow','bow'])for(const [gesture]of interactionOptions(kind)){
  const routine={category:'weapon',kind,gesture,period:4,phase:0,variant:0};
  for(const time of [1.2,2.2]){const p=interactionPose(routine,time);assert.ok(p.archery);assert.equal(p.gesture,'shoot');assert.equal(p.handY,24);}
 }
 assert.ok(objectPresentation('cloak').scale*27<64,'땅의 겉옷도 인물 전체 높이보다 작다');
});

test('밧줄은 물동이를 드는 동작 대신 감기·풀기·매듭·당기기·내리기를 제공한다',()=>{
 const gestures=interactionOptions('rope').map(([id])=>id);
 for(const id of ['coil','uncoil','tie','untie','pull','lower-rope'])assert.ok(gestures.includes(id));
 const normal=interactionRoutine({name:'라합',readingChapters:[{code:'jos',chap:1}]},'rope');assert.ok(!normal.unique);
 const biblical=interactionRoutine({name:'라합',readingChapters:[{code:'jos',chap:2}]},'rope');
 assert.ok(biblical.unique);assert.equal(biblical.gesture,'lower-rope');
});

test('여덟 표정의 눈·입은 정면과 측면 피부 안쪽에만 그려진다',()=>{
 for(const emotion of EXPRESSIONS)for(const side of [false,true]){
  let count=0;drawFaceExpression((x,y,w,h)=>{
   count++;assert.equal(w,1);assert.equal(h,1);
   assert.ok(side?(y>=11&&y<=15?x>=14&&x<=17:y===16&&x>=14&&x<=16):(y>=8&&y<=11?x>=8&&x<=15:y>=12&&y<=13&&x>=9&&x<=14),`${emotion} ${side}: ${x},${y}`);
  },emotion,{side});assert.ok(count>0);
 }
});
