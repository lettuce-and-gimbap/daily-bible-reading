import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseReference} from '../js/features/pixel-bible/references.js';
const entries=JSON.parse(fs.readFileSync('data/pixel-bible/reviewed-people.json')).entries;
const profiles=JSON.parse(fs.readFileSync('data/pixel-bible/discovery-routes.json')).profiles;
test('본문 대조 소개는 실제 도감 신원에 연결되고 모든 사실에 근거 구절이 있다',()=>{
 assert.equal(Object.keys(entries).length,8);
 for(const [id,entry]of Object.entries(entries)){
  assert.equal(profiles[id].name,entry.name);assert.deepEqual(profiles[id].review,entry);
  assert.ok(entry.intro&&entry.note);assert.ok(entry.facts.length>=2);
  for(const fact of entry.facts){assert.ok(fact.text);assert.ok(parseReference(fact.ref)?.verses?.length);}
 }
 assert.match(entries['person:enoch'].note,/가인의 아들 에녹.*다른/);
 assert.match(entries['person:노아'].note,/수종.*확정/);
});
