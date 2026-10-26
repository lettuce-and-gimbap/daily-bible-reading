import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('창세기 사건 범위는 기준 1,533절을 누락·중복 없이 덮는다',()=>{
 const data=JSON.parse(readFileSync('data/summary/gen.json','utf8'));
 const verseCounts=[31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26];
 assert.equal(Object.keys(data.chapters).length,50);
 assert.equal(verseCounts.reduce((sum,count)=>sum+count,0),1533);
 let covered=0;const missing=[],duplicates=[];
 verseCounts.forEach((count,index)=>{
  const chapter=index+1,seen=new Uint8Array(count+1);
  for(const event of data.chapters[String(chapter)].events||[]){
   const numbers=event.verses.match(/\d+/g)?.map(Number)||[];
   const from=numbers[0],to=numbers[1]||from;
   for(let verse=from;verse<=to;verse++)if(verse>0&&verse<=count)seen[verse]++;
  }
  for(let verse=1;verse<=count;verse++){
   if(!seen[verse])missing.push(`${chapter}:${verse}`);
   else covered++;
   if(seen[verse]>1)duplicates.push(`${chapter}:${verse}`);
  }
 });
 assert.deepEqual(missing,[]);
 assert.deepEqual(duplicates,[]);
 assert.equal(covered,1533);
});

test('출애굽기 사건 범위는 기준 1,213절을 누락·중복 없이 덮는다',()=>{
 const data=JSON.parse(readFileSync('data/summary/exo.json','utf8'));
 const verseCounts=[22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38];
 assert.equal(Object.keys(data.chapters).length,40);
 assert.equal(verseCounts.reduce((sum,count)=>sum+count,0),1213);
 let covered=0;const missing=[],duplicates=[];
 verseCounts.forEach((count,index)=>{
  const chapter=index+1,seen=new Uint8Array(count+1);
  for(const event of data.chapters[String(chapter)].events||[]){
   const numbers=event.verses.match(/\d+/g)?.map(Number)||[];
   const from=numbers[0],to=numbers[1]||from;
   for(let verse=from;verse<=to;verse++)if(verse>0&&verse<=count)seen[verse]++;
  }
  for(let verse=1;verse<=count;verse++){
   if(!seen[verse])missing.push(`${chapter}:${verse}`);
   else covered++;
   if(seen[verse]>1)duplicates.push(`${chapter}:${verse}`);
  }
 });
 assert.deepEqual(missing,[]);
 assert.deepEqual(duplicates,[]);
 assert.equal(covered,1213);
});

test('레위기 사건 범위는 기준 859절을 누락·중복 없이 덮는다',()=>{
 const data=JSON.parse(readFileSync('data/summary/lev.json','utf8'));
 const verseCounts=[17,16,17,35,26,23,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34];
 assert.equal(Object.keys(data.chapters).length,27);
 assert.equal(verseCounts.reduce((sum,count)=>sum+count,0),859);
 let covered=0;const missing=[],duplicates=[];
 verseCounts.forEach((count,index)=>{
  const chapter=index+1,seen=new Uint8Array(count+1);
  for(const event of data.chapters[String(chapter)].events||[]){
   const numbers=event.verses.match(/\d+/g)?.map(Number)||[];
   const from=numbers[0],to=numbers[1]||from;
   for(let verse=from;verse<=to;verse++)if(verse>0&&verse<=count)seen[verse]++;
  }
  for(let verse=1;verse<=count;verse++){
   if(!seen[verse])missing.push(`${chapter}:${verse}`);
   else covered++;
   if(seen[verse]>1)duplicates.push(`${chapter}:${verse}`);
  }
 });
 assert.deepEqual(missing,[]);
 assert.deepEqual(duplicates,[]);
 assert.equal(covered,859);
});
