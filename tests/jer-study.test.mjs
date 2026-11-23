import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('예레미야 52장에 심화해설과 유효한 관계 연결이 있다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/jer.json','utf8'));
 const study=JSON.parse(fs.readFileSync('data/summary/jer-study.json','utf8'));
 assert.equal(Object.keys(study).length,52);
 for(let n=1;n<=52;n++){
  assert(study[n]?.heading&&study[n].paragraphs.length&&study[n].sources?.length,`예레미야 ${n}장`);
  for(const r of data.chapters[n].rels){assert(data.chapters[n].people.some(p=>p.name===r.from));assert(data.chapters[n].people.some(p=>p.name===r.to));}
 }
});
test('예레미야 장별 해설과 도해를 요약에서 불러온다',()=>{
 const code=fs.readFileSync('js/features/summary.js','utf8');
 const a=code.indexOf('function staticDaySummary('),b=code.indexOf('\n// 관계도에 그릴 장',a);
 const fa=code.indexOf('function chapterStudyFigure('),fb=code.indexOf('\nfunction wisdomPlaceHtml(',fa);
 assert(a>=0&&b>a&&fa>=0&&fb>fa);
 const book=JSON.parse(fs.readFileSync('data/summary/jer.json','utf8'));
 const ctx={CHAPTERS:[{book:{code:'jer',name:'예레미야'},chap:36}],staticBooks:{jer:{status:'ok',data:book}},state:{settings:{}},currentChapter:0,composeDay:()=>({}),chapUnit:()=> '장',wisdomData:name=>JSON.parse(fs.readFileSync(`data/summary/${name}.json`,'utf8')),esc:String,wisdomSourceLink:s=>s.url};
 vm.createContext(ctx);vm.runInContext(code.slice(a,b)+'\n'+code.slice(fa,fb),ctx);
 const result=ctx.staticDaySummary([0]);assert.equal(result.wisdomStudy.length,1);
 const html=ctx.chapterStudyFigure('jer',result.wisdomStudy[0].note.figures[0]);assert.match(html,/img\/jer-study\/scroll-reading\.svg/);
 assert(fs.existsSync('img/jer-study/jerusalem-chronicle.svg'));
});
