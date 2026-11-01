import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {collectionDetails} from '../js/features/pixel-bible/collection-details.js';
const data=JSON.parse(fs.readFileSync('data/pixel-bible/discovery-routes.json'));
test('전체 신원의 권별 장수·첫 등장·발견 경로가 같은 출연 자료와 일치한다',()=>{
 assert.equal(data.chapters,1189);
 for(const [id,profile]of Object.entries(data.profiles)){
  const record={identity:{id},refs:data.routes[id]},d=collectionDetails(record,data.profiles);
  assert.equal(d.refs.length,data.routes[id].length,id);
  assert.equal(d.books.reduce((n,b)=>n+b.chapters.length,0),data.routes[id].length,id);
  assert.equal(d.firstAppearance,data.routes[id][0],id);
  for(const role of d.roles)assert.ok(d.matches(role.ref),`${id} ${role.ref}`);
 }
});
test('이름이 같아도 다른 신원의 장소를 가져오지 않고 오래된 잘못된 만남 기록을 제외한다',()=>{
 const profiles={a:{appearances:[{book:'창세기',code:'gen',chapter:12,role:'여행자'}]},b:{appearances:[{book:'출애굽기',code:'exo',chapter:2,role:'다른 인물'}]}};
 const d=collectionDetails({name:'같은 이름',identity:{id:'a'},refs:['출애굽기 2장','창세기 12장'],firstRef:'출애굽기 2장'},profiles);
 assert.deepEqual(d.refs,['창세기 12장']);assert.equal(d.firstEncounter,'창세기 12장');assert.equal(d.roles[0].text,'여행자');
 assert.equal(collectionDetails({name:'같은 이름',identity:{id:'missing'}},profiles).known,false);
});
