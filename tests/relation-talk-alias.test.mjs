import test from 'node:test';
import assert from 'node:assert/strict';
import {loveBoothExchange} from '../js/features/pixel-bible/relationship-lines.js';
test('관계선의 정식 이름과 대화의 별칭이 달라도 준비된 발화와 답변을 올바른 순서로 쓴다',()=>{
 const a={name:'라멕(가인 계열)',identity:{id:'lamech-cain'},refs:['창세기 4장']};
 const b={name:'야발',identity:{id:'jabal'},refs:['창세기 4장']};
 const relation={from:{name:'라멕',identity:{id:'lamech-cain'},code:'gen',chap:4,ref:'창세기 4장'},to:{...b,code:'gen',chap:4,ref:'창세기 4장'},ref:'창세기 4:20',talk:[['야발아, 너는 장막에 살며 가축을 치는구나.','아버지, 저는 장막에 살면서 가축을 돌봅니다.']]};
 for(const pair of [[a,b],[b,a]]){
  const exchange=loveBoothExchange(...pair,[relation]);
  assert.equal(exchange.mode,'special');
  assert.equal(exchange.lines[0].speaker,a);
  assert.equal(exchange.lines[1].speaker,b);
  assert.equal(exchange.lines[0].text,relation.talk[0][0]);
  assert.equal(exchange.lines[1].text,relation.talk[0][1]);
 }
});
