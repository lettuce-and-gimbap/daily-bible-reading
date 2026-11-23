import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('예레미야애가 다섯 장의 해설과 관계가 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/lam.json','utf8'));
 const study=JSON.parse(fs.readFileSync('data/summary/lam-study.json','utf8'));
 assert.equal(Object.keys(study).length,5);
 for(let n=1;n<=5;n++){
  assert(study[n]?.heading&&study[n].paragraphs.length&&study[n].sources?.length,`${n}장`);
  for(const r of data.chapters[n].rels){assert(data.chapters[n].people.some(p=>p.name===r.from));assert(data.chapters[n].people.some(p=>p.name===r.to));}
 }
});
test('예레미야애가의 실제 사진과 출처가 요약에서 표시된다',()=>{
 const code=fs.readFileSync('js/features/summary.js','utf8');
 const a=code.indexOf('function staticDaySummary('),b=code.indexOf('\n// 관계도에 그릴 장',a);
 const fa=code.indexOf('function chapterStudyFigure('),fb=code.indexOf('\nfunction wisdomPlaceHtml(',fa);
 assert(a>=0&&b>a&&fa>=0&&fb>fa);
 const book=JSON.parse(fs.readFileSync('data/summary/lam.json','utf8'));
 const ctx={CHAPTERS:[{book:{code:'lam',name:'예레미야애가'},chap:1}],staticBooks:{lam:{status:'ok',data:book}},state:{settings:{}},currentChapter:0,composeDay:()=>({}),chapUnit:()=> '장',wisdomData:name=>JSON.parse(fs.readFileSync(`data/summary/${name}.json`,'utf8')),esc:String,wisdomSourceLink:s=>s.url};
 vm.createContext(ctx);vm.runInContext(code.slice(a,b)+'\n'+code.slice(fa,fb),ctx);
 const result=ctx.staticDaySummary([0]);assert.equal(result.wisdomStudy.length,1);
 const html=ctx.chapterStudyFigure('lam',result.wisdomStudy[0].note.figures[0]);
 assert.match(html,/img\/lam-study\/jerusalem-1931\.jpg/);assert.match(html,/loc\.gov/);
 const bytes=fs.readFileSync('img/lam-study/jerusalem-1931.jpg');assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);
});
