import test from 'node:test';
import assert from 'node:assert/strict';
import {scriptureChapter} from '../worker/src/scripture.js';

const cors={'access-control-allow-origin':'https://lettuce-and-gimbap.github.io'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
const book={editions:{
 gae:[null,[[1,'첫 절'],[2,'둘째 절']],[[1,'다음 장']]],
 easy:[null,[[1,'쉬운 첫 절'],[2,'쉬운 둘째 절']]],
 niv:[null,[[1,'First verse'],[2,'Second verse']]],
}};
const env={SUBS:{get:async(key,format)=>{assert.equal(key,'scripture:v1:gen');assert.equal(format,'json');return book;}}};

test('비공개 저장소는 선택한 한 장의 세 역본만 응답한다',async()=>{
 const req=new Request('https://worker.test/scripture?book=gen&chapter=1&ver=gae&ver2=easy&ver3=niv');
 const res=await scriptureChapter(req,env,json,cors);
 assert.equal(res.status,200);
 assert.equal(res.headers.get('cache-control'),'private, no-store');
 const body=await res.json();
 assert.deepEqual(body.rows.map(row=>row.ver),['gae','gae','easy','easy','niv','niv']);
 assert.ok(!JSON.stringify(body).includes('다음 장'));
 assert.equal(body.rows.length,6);
});

test('원문 역본의 띄어쓰기·숫자·동음이의어 표기를 바꾸지 않고 그대로 제공한다',async()=>{
 const source='내가 잘못했습니다. 이 곳에서 떠나 주십시오. 은 삼백 달란트 가량과 금 삼십 달란트 가량을 드리겠습니다.';
 const numberedSource='여로보암 2세는 41년 동안 이스라엘을 다스렸습니다.';
 const sourceBook={editions:{easy:[null,[[14,source],[15,numberedSource]]]}};
 const sourceEnv={SUBS:{get:async()=>sourceBook}};
 const res=await scriptureChapter(new Request('https://worker.test/scripture?book=2ki&chapter=1&ver=easy'),sourceEnv,json,cors);
 assert.equal(res.status,200);
 const body=await res.json();
 assert.deepEqual(body.rows.map(row=>row.text),[source,numberedSource]);
});

test('권 전체나 잘못된 역본은 응답하지 않는다',async()=>{
 for(const query of ['book=gen&chapter=0&ver=gae','book=gen&chapter=1&ver=unknown','book=gen&chapter=1&ver=gae&ver2=easy&ver3=niv&ver4=han']){
  const res=await scriptureChapter(new Request('https://worker.test/scripture?'+query),env,json,cors);
  assert.equal(res.status,400);
 }
});
