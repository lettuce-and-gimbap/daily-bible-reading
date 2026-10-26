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

test('민수기 사건 범위는 기준 1,288절을 누락·중복 없이 덮는다',()=>{
 const data=JSON.parse(readFileSync('data/summary/num.json','utf8'));
 const verseCounts=[54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13];
 assert.equal(Object.keys(data.chapters).length,36);
 assert.equal(verseCounts.reduce((sum,count)=>sum+count,0),1288);
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
 assert.equal(covered,1288);
});

test('신명기 사건 범위는 기준 959절을 누락·중복 없이 덮는다',()=>{
 const data=JSON.parse(readFileSync('data/summary/deu.json','utf8'));
 const verseCounts=[46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12];
 assert.equal(Object.keys(data.chapters).length,34);
 assert.equal(verseCounts.reduce((sum,count)=>sum+count,0),959);
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
 assert.equal(covered,959);
});

test('여호수아 사건 범위는 기준 658절을 누락·중복 없이 덮는다',()=>{
 const data=JSON.parse(readFileSync('data/summary/jos.json','utf8'));
 const verseCounts=[18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33];
 assert.equal(Object.keys(data.chapters).length,24);
 assert.equal(verseCounts.reduce((sum,count)=>sum+count,0),658);
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
 assert.equal(covered,658);
});

test('사사기 사건 범위는 기준 618절을 누락·중복 없이 덮는다',()=>{
 const data=JSON.parse(readFileSync('data/summary/jdg.json','utf8'));
 const verseCounts=[36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25];
 assert.equal(Object.keys(data.chapters).length,21);
 assert.equal(verseCounts.reduce((sum,count)=>sum+count,0),618);
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
 assert.equal(covered,618);
});
