import test from 'node:test';
import assert from 'node:assert/strict';
import {APPEARANCES,appearanceFor} from '../js/features/pixel-bible/appearance.js';
import {drawWardrobe,WARDROBES,wardrobeDetails} from '../js/features/pixel-bible/wardrobe.js';
test('100개 복식 프로필은 신원과 출처를 유지하고 사방향 장식이 얼굴 영역을 침범하지 않는다',()=>{
 for(const p of Object.values(APPEARANCES)){
  const s=appearanceFor(p.name,0,'',[p.evidence.split(' · ')[0]]);
  assert.ok(WARDROBES[s.wardrobe]);assert.equal(s.evidence,p.evidence);
  for(const direction of ['down','right','up','left'])drawWardrobe((x,y,w,h)=>{
   assert.ok(y>=21&&y+h<=33,`${p.name}: 장식이 얼굴이나 다리에 침범`);
   assert.ok(x>=6&&x+w<=18,`${p.name}: 장식이 몸통 밖으로 나감`);
  },s,direction);
 }
});
test('도감은 본문에서 확인되는 대표 복식에만 출처가 있는 자세히 설명을 제공한다',()=>{
 for(const [name,ref]of [['아론','출애굽기 28:4'],['엘리야','열왕기하 1:8'],['예수님','요한복음 19:23'],['골리앗','사무엘상 17:5–7']]){
  const detail=wardrobeDetails({},name)[0];assert.ok(detail,`${name} 복식 설명 없음`);assert.ok(detail.ref.includes(ref.split(' ').at(-1).split(':')[0]));
 }
 assert.deepEqual(wardrobeDetails({},'나봇'),[],'본문에 복식 설명이 없는 인물에게 의복을 지어내지 않는다');
});
test('기록된 특수 복식은 동명이인에게 전파되지 않으며 흉패는 뒤에서 보이지 않는다',()=>{
 assert.equal(appearanceFor('요셉',0,'마리아의 남편',['마태복음 1장']).pattern,undefined);
 assert.equal(appearanceFor('아론').priestBreastplate,true);
 assert.equal(appearanceFor('엘르아살').priestBreastplate,true);
 assert.equal(appearanceFor('모르드개').mantleColor,'#87628e');
 assert.equal(appearanceFor('다니엘').goldChain,true);
 const dots=[];drawWardrobe((x,y,w,h,color)=>dots.push(color),appearanceFor('아론'),'up');
 assert.ok(!dots.includes('#a75d53'));
});
test('의복 디자인 자료를 기존 대비 두 배 이상으로 확장하고 새 실루엣을 이름에 따라 배정한다',()=>{
 assert.ok(Object.keys(WARDROBES).length>=28);
 const a=appearanceFor('무명 인물 가'),b=appearanceFor('무명 인물 나');
 assert.notEqual(a.wardrobe,b.wardrobe);assert.notEqual(a.coat,b.coat);
});
