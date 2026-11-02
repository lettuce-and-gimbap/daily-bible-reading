import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryKey,discoverySnapshot,mergeDiscovery,learningStage,markStoryRead,importanceFor,prominentKeys,kstDate,loadDiscoveries,DISCOVERY_KEY} from '../js/features/pixel-bible/discovery.js';
import {resolveIdentity} from '../js/features/pixel-bible/identity.js';
const ruth={name:'룻',identity:{kind:'person',id:'person:ruth'},role:'이삭을 줍는 며느리',refs:['룻기 2장']};
const boaz={name:'보아스',identity:{kind:'person',id:'person:boaz'},role:'밭 주인',refs:['룻기 2장']};
const model={cast:[ruth,boaz],relations:[{from:'룻',to:'보아스',label:'보호받음',kind:'other',sourceRef:'룻기 2장',ref:'룻기 2:8–9',note:'보아스는 룻이 밭에서 안전하게 이삭을 줍도록 도와주었어요.'}],events:[{text:'룻이 이삭을 주워 나오미에게 가져가요.',ref:'룻기 2:17–18'}]};
test('발견은 신원을 구분하고 같은 사람의 이름 표기는 합친다',()=>{
 assert.equal(discoveryKey({...ruth,name:'다른 표기'}),discoveryKey(ruth));
 assert.notEqual(discoveryKey({...ruth,identity:{kind:'person',id:'person:other'}}),discoveryKey(ruth));
 const snapshot=discoverySnapshot(ruth,model);assert.equal(snapshot.relations.length,1);assert.equal(snapshot.relations[0].name,'보아스');assert.equal(snapshot.stories.length,2);
 assert.equal(discoverySnapshot({...ruth,refs:['룻기 1장']},model).stories.length,0);
});
test('반복 클릭은 진행도를 늘리지 않고 읽기·주변 인물·KST 다른 날로 단계를 올린다',()=>{
 let r=mergeDiscovery(null,discoverySnapshot(ruth,model),'2026-10-24');const records={[r.key]:r};assert.equal(learningStage(r,records),1);
 r=mergeDiscovery(r,discoverySnapshot(ruth,model),'2026-10-24');assert.equal(r.days.length,1);assert.equal(r.stories.length,2);
 r=markStoryRead(r,r.stories[0]);r=markStoryRead(r,r.stories[0]);assert.equal(r.read.length,1);assert.equal(learningStage(r,records),2);
 records[discoveryKey(boaz)]={};assert.equal(learningStage(r,records),3);
 r=markStoryRead(r,r.stories[1]);assert.equal(learningStage(r,records),3);
 r=mergeDiscovery(r,discoverySnapshot(ruth,model),'2026-10-25');assert.equal(learningStage(r,records),4);
 assert.equal(kstDate(new Date('2026-10-24T15:01:00Z')),'2026-10-25');
});
test('중요도는 중복 관계를 한 명으로 세고 랜덤 발화량을 사용하지 않는다',()=>{
 const duplicated={...model,relations:[...model.relations,...model.relations]};assert.equal(importanceFor(duplicated,ruth).connections,1);
 assert.ok(importanceFor(model,ruth).score>=3);assert.ok(prominentKeys(model).size<=3);
});
test('다른 날에 만나도 주변 인물 단계는 건너뛰지 않는다',()=>{
 let r=mergeDiscovery(null,discoverySnapshot(ruth,model),'2026-10-24');for(const story of r.stories)r=markStoryRead(r,story);r=mergeDiscovery(r,discoverySnapshot(ruth,model),'2026-10-25');assert.equal(learningStage(r,{}),2);assert.equal(learningStage(r,{[discoveryKey(boaz)]:{}}),4);
});
test('개명 전 아브람·사래의 기존 도감 기록은 통합 인물 기록으로 옮긴다',()=>{
 const storage={getItem:key=>key===DISCOVERY_KEY?JSON.stringify({'unresolved:아브람':{name:'아브람',roles:['부르심'],refs:['창세기 12장'],days:['2026-01-01'],stories:[{ref:'창세기 12:1',text:'떠나라'}],read:['창세기 12:1|떠나라'],favorite:true},'unresolved:사래':{name:'사래',refs:['창세기 16장']},'unresolved:르우엘:exo':{name:'르우엘',refs:['출애굽기 2장']}}):null};
 const records=loadDiscoveries(storage);
 assert.equal(records['unresolved:아브람'],undefined);assert.equal(records['person:아브라함'].name,'아브라함');assert.equal(records['person:아브라함'].favorite,true);assert.equal(records['person:아브라함'].read.length,1);
 assert.equal(records['unresolved:사래'],undefined);assert.equal(records['person:사라'].name,'사라');assert.ok(records['person:사라'].refs.includes('창세기 16장'));
 assert.equal(records['unresolved:르우엘:exo'],undefined);assert.equal(records['person:midianite-priest-jethro'].name,'이드로');assert.ok(records['person:midianite-priest-jethro'].refs.includes('출애굽기 2장'));
});
test('창세기 후반의 분류 정정은 저장된 요셉·형제·애굽 기록을 새 신원으로 합친다',()=>{
 const storage={getItem:key=>key===DISCOVERY_KEY?JSON.stringify({'요셉:group:요셉':{name:'요셉',refs:['창세기 47장'],favorite:true},'요셉의 형들:unresolved:요셉의 형들':{name:'요셉의 형들',refs:['창세기 42장']},'형들:unresolved:형들':{name:'형들',refs:['창세기 50장']},'애굽 사람들:group:애굽 사람들':{name:'애굽 사람들',refs:['창세기 50장']}}):null};
 const records=loadDiscoveries(storage);
 assert.equal(records['요셉:group:요셉'],undefined);assert.equal(records['person:joseph-patriarch'].favorite,true);
 assert.equal(records['요셉의 형들:unresolved:요셉의 형들'],undefined);assert.deepEqual(new Set(records['요셉의 형들:group:joseph-brothers'].refs),new Set(['창세기 42장','창세기 50장']));
 assert.equal(records['애굽 사람들:group:애굽 사람들'],undefined);assert.equal(records['애굽 백성:group:egyptians-joseph-era'].name,'애굽 백성');
});
test('출애굽기의 모세·바로·훌은 역할 문구 때문에 집단으로 분류되지 않는다',()=>{
 assert.equal(resolveIdentity('모세',{code:'exo',chapter:12,role:'유월절을 전하고 백성을 이끎'}).id,'person:모세');
 assert.equal(resolveIdentity('바로',{code:'exo',chapter:12,role:'장자를 잃고 백성을 내보냄'}).id,'person:exodus-pharaoh-deliverance');
 assert.equal(resolveIdentity('훌',{code:'exo',chapter:24,role:'아론과 함께 백성을 맡음'}).id,'person:hur');
 assert.equal(resolveIdentity('아말렉',{code:'exo',chapter:17,role:'이스라엘과 싸움'}).id,'group:amalekites');
 assert.equal(resolveIdentity('아말렉',{code:'exo',chapter:17}).canonicalName,'아말렉 사람들');
});
test('출애굽기 신원 정정은 모세·바로·훌의 기존 도감 기록을 통합한다',()=>{
 const storage={getItem:key=>key===DISCOVERY_KEY?JSON.stringify({'모세:group:모세':{name:'모세',refs:['출애굽기 12장'],favorite:true},'바로:group:바로':{name:'바로',refs:['출애굽기 12장']},'훌:unresolved:훌:exo':{name:'훌',refs:['출애굽기 17장']},'훌:group:훌':{name:'훌',refs:['출애굽기 24장']},'아말렉:group:아말렉':{name:'아말렉',refs:['출애굽기 17장'],favorite:true}}):null};
 const records=loadDiscoveries(storage);
 assert.equal(records['모세:group:모세'],undefined);assert.equal(records['person:모세'].favorite,true);
 assert.equal(records['바로:group:바로'],undefined);assert.equal(records['person:exodus-pharaoh-deliverance'].name,'바로(출애굽 시대)');
 assert.equal(records['훌:unresolved:훌:exo'],undefined);assert.equal(records['훌:group:훌'],undefined);assert.ok(records['person:hur'].refs.includes('출애굽기 17장'));assert.ok(records['person:hur'].refs.includes('출애굽기 24장'));
 assert.equal(records['아말렉:group:아말렉'],undefined);assert.equal(records['아말렉 사람들:group:amalekites'].favorite,true);
});
