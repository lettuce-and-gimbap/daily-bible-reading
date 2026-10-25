import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BOOKS} from '../js/core/bible.js';

test('공개 본문 DB는 여섯 역본 모두 창세기부터 요한계시록까지 제공한다',()=>{
 const editions=['gae','easy','niv','han','hyun','saenew'];
 assert.equal(BOOKS.length,66);
 for(const book of BOOKS){
  const data=JSON.parse(fs.readFileSync(`data/scripture/${book.code}.json`,'utf8'));
  assert.equal(data.code,book.code);
  assert.deepEqual(Object.keys(data.editions),editions);
  for(const edition of editions){
   assert.equal(data.editions[edition].length,book.chapters+1,`${edition}/${book.code}`);
   for(let chapter=1;chapter<=book.chapters;chapter++){
    const verses=data.editions[edition][chapter];
    assert.ok(verses.length,`${edition}/${book.code}/${chapter}`);
    let previous=0;
    for(const [verse,text] of verses){
     assert.ok(Number.isInteger(verse)&&verse>previous&&typeof text==='string'&&text.trim(),`${edition}/${book.code}/${chapter}:${verse}`);
     previous=verse;
    }
   }
  }
 }
});
