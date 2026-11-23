import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('전도서와 아가의 장별 도해가 안전한 경로에 연결된다',()=>{
 const code=fs.readFileSync('js/features/summary.js','utf8');
 const start=code.indexOf('function chapterStudyFigure('),end=code.indexOf('\nfunction wisdomPlaceHtml(',start);
 assert(start>=0&&end>start);
 const ctx={esc:String,wisdomSourceLink:s=>`<a href="${s.url}">${s.label}</a>`};
 vm.createContext(ctx);vm.runInContext(code.slice(start,end),ctx);
 for(const [book,chapter,id] of [['ecc',3,'seasons'],['sng',4,'garden-spring']]){
  const data=JSON.parse(fs.readFileSync(`data/summary/${book}-study.json`,'utf8'));
  const html=ctx.chapterStudyFigure(book,data[String(chapter)].figures[0]);
  assert(html.includes(`img/${book}-study/${id}.svg`));assert(fs.existsSync(`img/${book}-study/${id}.svg`));
 }
});

test('전도서와 아가를 읽는 날에 각 장의 심화해설을 불러온다',()=>{
 const code=fs.readFileSync('js/features/summary.js','utf8');
 const start=code.indexOf('function staticDaySummary('),end=code.indexOf('\n// 관계도에 그릴 장',start);
 assert(start>=0&&end>start);
 const books={ecc:{chapters:{3:{}}},sng:{chapters:{4:{}}}};
 const context={CHAPTERS:[{book:{code:'ecc',name:'전도서'},chap:3},{book:{code:'sng',name:'아가'},chap:4}],
  staticBooks:{ecc:{status:'ok',data:books.ecc},sng:{status:'ok',data:books.sng}},
  state:{settings:{}},currentChapter:0,composeDay:()=>({}),chapUnit:()=> '장',
  wisdomData:name=>JSON.parse(fs.readFileSync(`data/summary/${name}.json`,'utf8'))};
 vm.createContext(context);vm.runInContext(code.slice(start,end),context);
 const result=context.staticDaySummary([0,1]);
 assert.equal(result.wisdomStudy.length,2);
 assert.equal(result.wisdomStudy[0].ref,'전도서 3장');assert.equal(result.wisdomStudy[1].ref,'아가 4장');
});
