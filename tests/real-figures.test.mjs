import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('실제 자료 사진은 출처와 한계를 갖고 실존하는 파일을 가리킨다',()=>{
 const data=JSON.parse(fs.readFileSync('data/summary/real-figures.json','utf8'));let total=0;
 for(const [book,chapters] of Object.entries(data)){
  const summary=JSON.parse(fs.readFileSync(`data/summary/${book}.json`,'utf8'));
  for(const [chapter,figures] of Object.entries(chapters)){
   assert(summary.chapters[chapter],`${book} ${chapter}`);
   for(const f of figures){assert(/^img\/real-reference\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(jpg|jpeg|png)$/.test(f.src));assert(fs.existsSync(f.src));assert(f.label&&f.alt);assert.equal(new URL(f.sourceUrl).protocol,'https:');if(f.licenseUrl)assert.equal(new URL(f.licenseUrl).protocol,'https:');for(const ref of f.references||[])assert.equal(new URL(ref.url).protocol,'https:');const b=fs.readFileSync(f.src);assert((b[0]===0xff&&b[1]===0xd8)||(b[0]===0x89&&b[1]===0x50));total++;}
  }
 }
 assert(total>0);
});
test('요약에서 읽는 장의 실제 사진만 표시하고 경로 이탈을 막는다',()=>{
 const code=fs.readFileSync('js/features/summary.js','utf8');
 const a=code.indexOf('function staticDaySummary('),b=code.indexOf('\n// 관계도에 그릴 장',a),fa=code.indexOf('function chapterStudyFigure('),fb=code.indexOf('\nfunction wisdomPlaceHtml(',fa);
 assert(a>=0&&b>a&&fa>=0&&fb>fa);
 const book=JSON.parse(fs.readFileSync('data/summary/gen.json','utf8'));
 const ctx={CHAPTERS:[{book:{code:'gen',name:'창세기'},chap:41}],staticBooks:{gen:{status:'ok',data:book}},state:{settings:{}},currentChapter:0,composeDay:()=>({}),chapUnit:()=> '장',wisdomData:name=>JSON.parse(fs.readFileSync(`data/summary/${name}.json`,'utf8')),esc:String,wisdomSourceLink:s=>s.url};
 vm.createContext(ctx);vm.runInContext(code.slice(a,b)+'\n'+code.slice(fa,fb),ctx);
 const result=ctx.staticDaySummary([0]);assert(result.wisdomStudy[0].note.realFigures.length>0);
 const html=ctx.chapterStudyFigure('gen',result.wisdomStudy[0].note.realFigures[0]);assert.match(html,/img\/real-reference\//);assert.match(html,/metmuseum\.org/);
 assert.equal(ctx.chapterStudyFigure('gen',{src:'img/real-reference/../../unsafe.jpg',label:'bad'}),'');
});
