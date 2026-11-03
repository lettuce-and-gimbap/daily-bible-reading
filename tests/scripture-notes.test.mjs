import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('js/features/scripture-notes-data.js','utf8'),ctx);
const {terms,passages,sources}=ctx.window.ScriptureNotesData;
const bible=fs.readFileSync('js/core/bible.js','utf8');const books=vm.runInNewContext(bible+';BOOKS',{});
test('curated notes have valid references, unique identities and reviewable sources',()=>{
 assert.equal(terms.length,71);assert.equal(passages.length,5);
 const ids=new Set();for(const t of [...terms,...passages]){assert(!ids.has(t.id));ids.add(t.id);assert(t.title&&t.summary&&t.refs.length);for(const ref of t.refs){const m=ref.match(/^(.+?) (\d+):(\d+)(?:[-–](\d+))?$/);assert(m,ref);const b=books.find(x=>x.name===m[1]);assert(b&&Number(m[2])<=b.chapters,ref);assert(Number(m[3])>0&&Number(m[4]||m[3])>=Number(m[3]),ref);}for(const chapter of t.wcf)assert(chapter>=1&&chapter<=33);}
 for(const x of Object.values(sources))assert(new URL(x.url).protocol==='https:');
});
test('ambiguous terms have contextual restrictions',()=>{
 const adoption=terms.find(t=>t.aliases.includes('양자'));assert(adoption.books.includes('rom'));assert(!adoption.books.includes('est'));
 assert(!terms.some(t=>t.aliases.includes('마지막 날')));
 const son=terms.find(t=>t.title==='인자');assert(son.books.includes('jhn'));assert(!son.books.includes('psa'));
});
test('private sources are not shipped with the reader data',()=>{
 const code=fs.readFileSync('js/features/scripture-notes-data.js','utf8');assert(!/private-reference|sediment:|sqlite|file_0000/.test(code));
 const html=fs.readFileSync('index.html','utf8');assert(html.indexOf('scripture-notes-data.js')<html.indexOf('scripture-study.js'));
});
test('문맥 각주는 정확한 권·장·단일 절에서만 일반 용어보다 우선한다',()=>{
 const document={addEventListener(){}};const localStorage={getItem(){return null},setItem(){}};
 const env={window:{ScriptureNotesData:ctx.window.ScriptureNotesData},document,localStorage,console};
 vm.runInNewContext(fs.readFileSync('js/features/scripture-study.js','utf8'),env);
 const render=env.window.ScriptureStudy.glossaryHtml;
 const current={code:'2ch',chapter:20,lo:20,hi:20,edition:'gae'};
 assert.match(render('여호와를 신뢰하라',current),/data-study-term="chron-2-20-trust"/);
 assert.match(render('여호와를 믿으시오',{...current,edition:'easy'}),/data-study-term="chron-2-20-trust"/);
 assert.doesNotMatch(render('신뢰하라',{...current,chapter:19}),/chron-2-20-trust/);
 assert.doesNotMatch(render('신뢰하라',{...current,lo:19}),/chron-2-20-trust/);
 assert.match(render('새 수레',{code:'1ch',chapter:13,lo:7,hi:7,edition:'gae'}),/chron-1-13-cart/);
 assert.doesNotMatch(render('새 수레',{code:'1ch',chapter:13,lo:6,hi:8,edition:'gae'}),/chron-1-13-cart/);
 assert.equal(render('<script>',current),'&lt;script&gt;');
});
test('문맥 각주는 근거 절과 범위 및 별칭을 갖는다',()=>{
 const notes=ctx.window.ScriptureNotesData.contextualTerms;assert.equal(notes.length,4);
 const ids=new Set([...terms,...passages].map(n=>n.id));
 for(const n of notes){assert(!ids.has(n.id));ids.add(n.id);assert(n.aliases.length&&n.refs.length&&n.locations.length&&n.summary);for(const l of n.locations){assert(['1ch','2ch'].includes(l.code));assert(l.chapter>0&&l.lo>0&&l.hi>=l.lo);}for(const link of n.sourceLinks||[])assert.equal(new URL(link.url).protocol,'https:');}
});
