import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('이사야 66장에 심화해설과 유효한 관계 연결이 있다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/isa.json','utf8'));
 const study=JSON.parse(fs.readFileSync('data/summary/isa-study.json','utf8'));
 assert.equal(Object.keys(study).length,66);
 for(let n=1;n<=66;n++){
  assert(study[n]?.heading&&study[n].paragraphs.length&&study[n].sources?.length,`이사야 ${n}장`);
  for(const r of data.chapters[n].rels){assert(data.chapters[n].people.some(p=>p.name===r.from));assert(data.chapters[n].people.some(p=>p.name===r.to));}
 }
});
test('이사야 장별 해설과 도해를 요약에서 불러온다',()=>{
 const code=fs.readFileSync('js/features/summary.js','utf8');
 const a=code.indexOf('function staticDaySummary('),b=code.indexOf('\n// 관계도에 그릴 장',a);
 const fa=code.indexOf('function chapterStudyFigure('),fb=code.indexOf('\nfunction wisdomPlaceHtml(',fa);
 assert(a>=0&&b>a&&fa>=0&&fb>fa);
 const book=JSON.parse(fs.readFileSync('data/summary/isa.json','utf8'));
 const ctx={CHAPTERS:[{book:{code:'isa',name:'이사야'},chap:6}],staticBooks:{isa:{status:'ok',data:book}},state:{settings:{}},currentChapter:0,composeDay:()=>({}),chapUnit:()=> '장',wisdomData:name=>JSON.parse(fs.readFileSync(`data/summary/${name}.json`,'utf8')),esc:String,wisdomSourceLink:s=>s.url};
 vm.createContext(ctx);vm.runInContext(code.slice(a,b)+'\n'+code.slice(fa,fb),ctx);
 const result=ctx.staticDaySummary([0]);assert.equal(result.wisdomStudy.length,1);
 const html=ctx.chapterStudyFigure('isa',result.wisdomStudy[0].note.figures[0]);assert.match(html,/img\/isa-study\/temple-vision\.svg/);
 assert(fs.existsSync('img/isa-study/sennacherib-prism.svg'));
});
