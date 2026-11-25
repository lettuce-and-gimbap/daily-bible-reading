import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const require=createRequire(import.meta.url), bible=require('../js/core/bible.js');
const counts=JSON.parse(fs.readFileSync('js/core/versecounts.js','utf8').match(/const VERSE_COUNTS\s*=\s*(\[[^\]]+\])/)[1]);
const codes=['1sa','2sa','1ki','2ki'];
test('네 권의 기존 해설이 실제 절 범위와 사진에 연결된다',()=>{
 for(const code of codes){const book=bible.BOOKS.find(b=>b.code===code);const d=JSON.parse(fs.readFileSync(`data/verse-study/${code}-existing.json`));const chapters=new Set();
  for(const n of d.passages){assert.equal(n.code,code);assert(n.id&&n.title&&n.summary&&n.detail&&n.sourceNote);assert(n.chapter>=1&&n.chapter<=book.chapters);assert(n.lo>=1&&n.hi>=n.lo&&n.hi<=counts[bible.chapterIndex(code,n.chapter)]);assert(n.refs.length);chapters.add(n.chapter);for(const im of n.images||[]){assert(/^img\/real-reference\//.test(im.url));assert(fs.existsSync(im.url));assert.equal(new URL(im.pageUrl).protocol,'https:');}for(const s of n.sourceLinks||[])assert.equal(new URL(s.url).protocol,'https:');}
  assert.equal(chapters.size,book.chapters,`${code}의 연결된 장 수`);
 }
});
test('추가 절별 주석의 출처와 범위가 유효하다',()=>{
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync('js/features/scripture-notes-data.js','utf8'),ctx);
 const old=ctx.window.ScriptureNotesData;
 const ids=new Set([...old.terms,...old.passages,...old.contextualTerms].map(n=>n.id));
 for(const code of codes){const book=bible.BOOKS.find(b=>b.code===code);
  for(const suffix of ['', '-existing']){const d=JSON.parse(fs.readFileSync(`data/verse-study/${code}${suffix}.json`));
   for(const n of d.passages){assert(!ids.has(n.id),n.id);ids.add(n.id);assert.equal(n.code,code);assert(n.title&&n.category&&n.summary&&n.sourceNote);assert(n.chapter>=1&&n.chapter<=book.chapters);assert(n.lo>=1&&n.hi>=n.lo&&n.hi<=counts[bible.chapterIndex(code,n.chapter)]);assert(n.refs?.length);for(const ref of n.refs){const m=ref.match(/^(.+?) (\d+):(\d+)(?:[-–](\d+))?$/);assert(m,`${n.id}: ${ref}`);const rb=bible.BOOKS.find(b=>b.name===m[1]);assert(rb&&Number(m[2])<=rb.chapters,ref);assert(Number(m[3])>=1&&Number(m[4]||m[3])<=counts[bible.chapterIndex(rb.code,Number(m[2]))],ref);}if(n.lens)assert(Array.isArray(n.wcf));for(const s of n.sourceLinks||[])assert.equal(new URL(s.url).protocol,'https:');for(const im of n.images||[])assert(/^https:\/\//.test(im.url)||/^img\/real-reference\//.test(im.url));}
  }
 }
});
test('비동기 주석을 불러와 해당 절에만 붙인다',async()=>{
 const data={terms:[],passages:[],sources:{}};const document={addEventListener(){},createElement(){return {children:[],append(v){this.children.push(v)}}}};
 const localStorage={getItem(){return null},setItem(){}};let calls=0;
 const notes=[{id:'test-1',code:'1sa',chapter:1,lo:2,hi:2,title:'시험',category:'해설',summary:'설명',refs:['사무엘상 1:2']}];
 const env={window:{ScriptureNotesData:data},document,localStorage,CHAPTERS:[{book:{code:'1sa'},chap:1}],console,fetch:async url=>({ok:true,json:async()=>({passages:url.includes('-existing')?notes:[]})})};
 vm.runInNewContext(fs.readFileSync('js/features/scripture-study.js','utf8'),env);
 let links=[];const rows=[1,2,3].map(v=>({dataset:{},nextElementSibling:null,querySelector(s){if(s==='.vp-num')return {textContent:String(v)};if(s==='.vp-txt')return {append(x){links.push([v,x])}};return null},querySelectorAll(){return []}}));
 const root={dataset:{},isConnected:true,querySelectorAll(s){return s==='.vp-row'?rows:[]},querySelector(){return null}};
 env.window.ScriptureStudy.mount(root,['0:gae:1','0:gae:2','0:gae:3']);await new Promise(resolve=>setTimeout(resolve,20));
 assert.equal(links.length,1);assert.equal(links[0][0],2);assert.equal(links[0][1].children[0].textContent,'주석 · 시험');
});
test('실물 사진은 안전한 경로와 출처·이용 조건을 표시한다',()=>{
 const code=fs.readFileSync('js/features/scripture-study.js','utf8');
 const a=code.indexOf(' function studyFigureHtml('),b=code.indexOf(' function showTerm(',a);
 const ctx={esc:s=>String(s)};vm.createContext(ctx);vm.runInContext(code.slice(a,b),ctx);
 const html=ctx.studyFigureHtml({url:'img/real-reference/group-1/photo.jpg',caption:'자료',credit:'저작자 https://creativecommons.org/licenses/by/4.0/',pageUrl:'https://example.org/source'});
 assert.match(html,/img\/real-reference\/group-1\/photo.jpg/);assert.match(html,/원본 ↗/);assert.match(html,/이용 조건 ↗/);
 assert.equal(ctx.studyFigureHtml({url:'img/real-reference/../../secret.jpg'}),'');
});
test('실물 사진의 기관 자료 링크를 절별 주석에 보존한다',()=>{
 const figures=JSON.parse(fs.readFileSync('data/summary/real-figures.json','utf8'));
 for(const code of codes){const data=JSON.parse(fs.readFileSync(`data/verse-study/${code}-existing.json`));
  for(const note of data.passages.filter(n=>n.id.startsWith('real-photo-'))){
   const f=(figures[code]?.[note.chapter]||[]).find(x=>x.src===note.images[0]?.url);assert(f,note.id);
   for(const ref of f.references||[])assert(note.sourceLinks.some(s=>s.url===ref.url),`${note.id}: ${ref.url}`);
  }
 }
});
test('재생성 도구는 감수한 절별 주석을 덮어쓰지 않는다',()=>{
 const dir=fs.mkdtempSync(join(tmpdir(),'verse-study-guard-')), file=join(dir,'1sa-existing.json');
 try {fs.writeFileSync(file,'수동 감수');const run=spawnSync(process.execPath,['tools/commentary/link-existing-verse-notes.cjs',dir],{encoding:'utf8'});assert.notEqual(run.status,0);assert.match(run.stderr,/덮어쓸 수 없습니다/);assert.equal(fs.readFileSync(file,'utf8'),'수동 감수');}
 finally {fs.unlinkSync(file);fs.rmdirSync(dir);}
});
