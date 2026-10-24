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
