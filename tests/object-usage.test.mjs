import test from 'node:test';
import assert from 'node:assert/strict';
import {interactionOptions,interactionPose,interactionRoutine} from '../js/features/pixel-bible/interaction-motion.js';
import {objectPresentation,interactionAnchor,heldObject} from '../js/features/pixel-bible/object-response.js';
import {objectBehavior} from '../js/features/pixel-bible/object-behavior.js';
import {drawFaceExpression,EXPRESSIONS} from '../js/features/pixel-bible/expression.js';

test('침상 동작은 눕고, 활 동작은 장전·겨냥·발사·회수 단계가 구분된다',()=>{
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
  const prep=interactionPose(routine,1.2),active=interactionPose(routine,2.2);
  const bowAction=['nock','aim','draw','shoot','retrieve'].includes(gesture);
  assert.equal(prep.archery,bowAction);assert.equal(prep.gesture,bowAction?'shoot':gesture);
  if(bowAction)assert.equal(prep.archeryAction,gesture);
  assert.ok(prep.handY>=13&&prep.handY<=30);assert.ok(active.handY>=13&&active.handY<=30);
  if(gesture==='shoot')assert.equal(active.shot,true);
  if(gesture==='retrieve')assert.equal(active.kneel,true);
 }
 const ladder=interactionPose({category:'tool',kind:'ladder',gesture:'climb-ladder',period:4,phase:0},2.2);
 assert.equal(ladder.climb,4);assert.equal(ladder.bodyY,-3);
 assert.notDeepEqual(interactionOptions('well'),interactionOptions('cup'));
 assert.ok(interactionOptions('oven').some(([id])=>id==='take-bread'));
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

test('휴대 소품은 바닥에서 집고 같은 위치로 내려놓으며 고정 구조물은 기울이지 않는다',async()=>{
 const {heldObject,objectInteractionFrame}=await import('../js/features/pixel-bible/object-response.js');
 const n={name:'룻',x:9,y:10,direction:'right',usingObject:{kind:'oil',x:10,y:10},interactionStart:0,interaction:{kind:'oil',category:'oil',gesture:'pour',variant:0,phase:0,period:4}};
 const first=heldObject(n,0),last=heldObject(n,3.9999);
 assert.equal(first.x,10);assert.equal(first.y,10);assert.equal(last.x,10);assert.equal(last.y,10);
 for(const kind of ['well','basin','laver','table']){
  n.usingObject={kind,x:10,y:10};n.interaction={...n.interaction,kind,gesture:kind==='table'?'spread':'pour'};
  assert.equal(objectInteractionFrame(n.usingObject,[n],2.4).tilt,0,kind);
 }
});

test('마시기는 입 높이에서 잠시 멈추고 일어나기·착용은 완료 상태를 유지한다',async()=>{
 const {interactionPose}=await import('../js/features/pixel-bible/interaction-motion.js');
 const drink={kind:'water',category:'water',gesture:'drink',period:4,phase:0,variant:0};
 assert.equal(interactionPose(drink,2.1).handY,16);assert.equal(interactionPose(drink,2.5).handY,16);
 const rise={...drink,kind:'bed',category:'bed',gesture:'rise'};
 assert.ok(interactionPose(rise,1).recline>interactionPose(rise,3).recline);
 assert.equal(interactionPose(rise,5).lie,false);
 const wear={...drink,kind:'cloak',category:'cloth',gesture:'wear'};
 assert.equal(interactionPose(wear,5).wearing,true);
 for(const gesture of ['aim','draw','nock'])assert.equal(interactionPose({...drink,kind:'bow',gesture},2).shot,false);
 assert.equal(interactionPose({...drink,kind:'bow',gesture:'shoot'},2).shot,true);
});
