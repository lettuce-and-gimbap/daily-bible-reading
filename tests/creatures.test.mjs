import test from 'node:test';
import assert from 'node:assert/strict';
import {CREATURES,chapterCreatures,creatureForName,creatureSpeech,creatureCanUse,creatureRoutine} from '../js/features/pixel-bible/creatures.js';
import {buildWorldModel} from '../js/features/pixel-bible/world.js';
import {personalLines} from '../js/features/pixel-bible/personal-lines.js';
import {dialogueCandidates} from '../js/features/pixel-bible/dialogue.js';
import {characterMotion} from '../js/features/pixel-bible/motion.js';
import {interactionPose} from '../js/features/pixel-bible/interaction-motion.js';
import {heldObject} from '../js/features/pixel-bible/object-response.js';

test('현재 장의 동식물은 생물 신원으로 명단에 포함하고 일반 인물·상징을 보존한다',async()=>{
 const c={code:'gen',name:'창세기',chap:24,data:{people:[{name:'리브가',role:'이삭의 아내'},{name:'낙타',role:'물을 마시는 동물'}],events:[{title:'우물',text:'리브가가 낙타에게 물을 주고, 감람나무 곁에 섰다.',verses:'19-20'}]}};
 const model=buildWorldModel([c]);const camel=model.cast.find(n=>n.name==='낙타'),tree=model.cast.find(n=>n.name==='감람나무');
 assert.equal(camel.identity.kind,'animal');assert.equal(tree.identity.kind,'plant');assert.equal(model.cast.filter(n=>n.name==='낙타').length,1);
 assert.ok(camel.refs.includes('창세기 24장'));
 assert.equal(creatureForName('어린 양','보좌에 계신 그리스도의 상징','rev'),null);
 assert.equal(chapterCreatures({code:'rev',chap:5,data:{story:'어린 양이 보좌 앞에 있다.'}}).some(n=>n.creature.id==='sheep'),false);
 assert.equal(creatureForName('모세'),null);
 assert.equal(creatureForName('사자','왕이 보낸 사신'),null);
 assert.equal(creatureForName('말','하나님의 말씀'),null);
 assert.equal(creatureForName('소','호세아가 사신을 보낸 애굽 왕'),null);
 const {resolveIdentity}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(resolveIdentity('소',{code:'2ki',chapter:17,role:'호세아가 사신을 보낸 애굽 왕'}).id,'person:egyptian-king-so');
});

test('말이 없는 생물은 클릭·자동·관계 대사를 만들지 않으며 발화는 기록된 장에서만 허용한다',()=>{
 for(const d of Object.values(CREATURES)){
  const n={name:d.name,creature:d,refs:['창세기 1장'],x:10,y:10,path:[]};
  assert.deepEqual(personalLines(n,[{code:'gen',name:'창세기',chap:1}],{people:[],relations:[]}),[]);
  assert.deepEqual(dialogueCandidates([n],[{code:'gen',name:'창세기',chap:1}],{people:[],relations:[]}),[]);
 }
 for(const [id,code,name,chap]of [['snake','gen','창세기',3],['donkey','num','민수기',22]]){
  const n={name:CREATURES[id].name,creature:CREATURES[id],refs:[`${name} ${chap}장`]};
  assert.equal(creatureSpeech(n,[{code,name,chap}]).length,2);
  assert.equal(creatureSpeech(n,[{code,name,chap:chap+1}]).length,0);
 }
});

test('식물은 고정되고 동물은 종별 속도·용도별 행동을 사용하며 물건을 인간처럼 들지 않는다',()=>{
 const sheep={name:'양',creature:CREATURES.sheep},plant={name:'백합',creature:CREATURES.lily},bird={name:'비둘기',creature:CREATURES.dove};
 assert.equal(characterMotion(plant).speed,0);assert.notEqual(characterMotion(sheep).speed,characterMotion(bird).speed);
 assert.ok(creatureCanUse(sheep,'field'));assert.ok(creatureCanUse(sheep,'water'));assert.equal(creatureCanUse(sheep,'bow'),false);assert.equal(creatureCanUse(plant,'bed'),false);
 const routine=creatureRoutine(sheep,'water');assert.equal(routine.creatureAction,'drink');assert.equal(interactionPose(routine,1).hand,0);
 assert.equal(heldObject({...sheep,usingObject:{kind:'water'},interaction:routine},1),null);
});
