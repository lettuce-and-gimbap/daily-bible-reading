import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {alignVerseRows}=require('../js/features/verse-alignment.js');
const easy=[{ver:'easy',label:'22-23',text:'합쳐 쓴 본문'},{ver:'easy',label:'24',text:'다음 본문'}];
const gae=[{ver:'gae',label:'22',text:'22절'},{ver:'gae',label:'23',text:'23절'},{ver:'gae',label:'24',text:'24절'}];
const niv=[{ver:'niv',label:'22',text:'Verse 22'},{ver:'niv',label:'23',text:'Verse 23'}];

test('한 역본은 병합 범위와 본문을 한 행에 그대로 보인다',()=>{
 const rows=alignVerseRows([easy]);
 assert.deepEqual(rows.map(row=>row.label),['22-23','24']);
 assert.deepEqual(rows.map(row=>[row.a,row.b]),[[22,23],[24,24]]);
 assert.equal(rows[0].cells[0].text,'합쳐 쓴 본문');
});

test('두세 역본은 첫 절에 병합 본문을 놓고 다음 절 칸을 비운다',()=>{
 for(const lists of [[easy,gae],[easy,gae,niv]]){
  const rows=alignVerseRows(lists);
  assert.deepEqual(rows.map(row=>row.label),['22','23','24']);
  assert.equal(rows[0].cells[0].label,'22-23');
  assert.equal(rows[1].cells[0],null);
  assert.equal(rows[1].cells[1].text,'23절');
  if(lists.length===3) assert.equal(rows[1].cells[2].text,'Verse 23');
 }
});
