import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseReference} from '../js/features/pixel-bible/references.js';
import {BOOKS} from '../js/core/bible.js';
const entries=JSON.parse(fs.readFileSync('data/pixel-bible/reviewed-people.json')).entries;
const profiles=JSON.parse(fs.readFileSync('data/pixel-bible/discovery-routes.json')).profiles;
test('본문 대조 소개는 실제 도감 신원에 연결되고 모든 사실에 근거 구절이 있다',()=>{
 assert.ok(Object.keys(entries).length>=62);
 for(const [id,entry]of Object.entries(entries)){
  assert.equal(profiles[id].name,entry.name);assert.deepEqual(profiles[id].review,entry);
  assert.ok(entry.intro&&entry.note);assert.ok(entry.facts.length>=1);
  assert.deepEqual(entry.reviewedRefs,[...new Set(entry.facts.map(fact=>fact.ref))]);
  for(const fact of entry.facts){assert.ok(fact.text);assert.ok(parseReference(fact.ref)?.verses?.length);}
 }
 assert.match(entries['person:enoch'].note,/가인의 아들 에녹.*다른/);
 assert.match(entries['person:노아'].note,/수종.*확정/);
});
test('창세기부터 말라기까지 본문 대조한 도감 항목과 다음 범위를 기록한다',()=>{
 const progress=JSON.parse(fs.readFileSync('data/pixel-bible/review-progress.json'));
 assert.equal(progress.reviewedIdentities,Object.keys(entries).length);
 assert.equal(progress.totalIdentities,Object.keys(profiles).length);
 for(const round of progress.rounds){const {code,chapter:throughChapter}=round.firstAppearanceThrough;for(const [id,profile]of Object.entries(profiles))if(profile.appearances.some(a=>a.code===code&&a.chapter<=throughChapter))assert.ok(entries[id],id);}
 const order=new Map(BOOKS.map((book,index)=>[book.code,index]));let next;
 for(const [id,profile]of Object.entries(profiles).filter(([id])=>!entries[id]))for(const appearance of profile.appearances){if(!next||order.get(appearance.code)<order.get(next.code)||order.get(appearance.code)===order.get(next.code)&&appearance.chapter<next.chapter)next=appearance;}
 assert.deepEqual(progress.nextFirstAppearance,{code:next.code,chapter:next.chapter});
 assert.equal(progress.rounds.reduce((sum,r)=>sum+r.newEntries,0),1451);
 assert.equal(Object.keys(entries).length,1459);
 assert.match(entries['person:라헬'].note,/동기를 단정하지/);
 assert.match(entries['group:라반의 아들들'].note,/이름을 제시하지 않아요/);
 assert.match(entries['person:야곱'].note,/속임을 정당화하지 않아요/);
});
test('동명이인·이름 없는 인물·역본 차이는 검토 소개에서 구분한다',()=>{
 assert.notDeepEqual(entries['person:enoch'],entries['unresolved:에녹(가인의 아들)']);
 assert.match(entries['unresolved:에녹(가인의 아들)'].note,/므두셀라.*구분/);
 assert.match(entries['person:lamech-cainite'].note,/노아의 아버지 라멕.*다른/);
 assert.match(entries['unresolved:아브라함의 종'].note,/이름을 밝히지/);
 assert.match(entries['unresolved:리브가의 유모'].note,/창세기 24장/);
 assert.match(entries['unresolved:아훗삿'].note,/왕의 친구.*쉬운성경.*비서/);
 assert.match(entries['unresolved:아비멜렉'].note,/같은 개인이라고 단정하지/);
});
