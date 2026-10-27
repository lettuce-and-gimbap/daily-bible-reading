import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryKey,discoverySnapshot,mergeDiscovery,learningStage,markStoryRead,importanceFor,prominentKeys,kstDate,loadDiscoveries,DISCOVERY_KEY} from '../js/features/pixel-bible/discovery.js';
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
