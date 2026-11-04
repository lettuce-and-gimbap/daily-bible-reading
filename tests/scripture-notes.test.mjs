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
 assert.doesNotMatch(render('신뢰하라',{...current,edition:'saenew'}),/chron-2-20-trust/);
 assert.match(render('믿으니',{code:'gen',chapter:15,lo:6,hi:6,edition:'gae'}),/context-gen-15-6/);
 assert.doesNotMatch(render('믿으니',{code:'gen',chapter:15,lo:5,hi:5,edition:'gae'}),/context-gen-15-6/);
 assert.match(render('마음을 돌리셨습니다',{code:'exo',chapter:32,lo:14,hi:14,edition:'easy'}),/context-exo-32-14/);
 assert.doesNotMatch(render('마음을 돌리셨습니다',{code:'exo',chapter:32,lo:14,hi:14,edition:'niv'}),/context-exo-32-14/);
 assert.match(render('에녹이 하나님과 동행하더니',{code:'gen',chapter:5,lo:24,hi:24,edition:'gae'}),/context-gen-5-24/);
 assert.match(render('저를 남겨 두어',{code:'gen',chapter:44,lo:33,hi:33,edition:'easy'}),/context-gen-44-33/);
 assert.doesNotMatch(render('휘장',{code:'exo',chapter:26,lo:32,hi:32,edition:'gae'}),/context-exo-26-33/);
 assert.match(render('휘장',{code:'exo',chapter:26,lo:33,hi:33,edition:'gae'}),/context-exo-26-33/);
 assert.match(render('동물들을 다스려라',{code:'gen',chapter:1,lo:28,hi:28,edition:'easy'}),/context-gen-1-28/);
 assert.match(render('남자가 혼자 있는 것이 좋지 않으니, 그를 도울 짝',{code:'gen',chapter:2,lo:18,hi:18,edition:'easy'}),/context-gen-2-18/);
 assert.doesNotMatch(render('그를 도울 짝',{code:'gen',chapter:2,lo:17,hi:17,edition:'easy'}),/context-gen-2-18/);
 assert.match(render('여호와께서는 모세와 대면하여 말씀하시며',{code:'exo',chapter:33,lo:11,hi:11,edition:'gae'}),/context-exo-33-11/);
 assert.match(render('새 수레',{code:'1ch',chapter:13,lo:7,hi:7,edition:'gae'}),/chron-1-13-cart/);
 assert.doesNotMatch(render('새 수레',{code:'1ch',chapter:13,lo:6,hi:8,edition:'gae'}),/chron-1-13-cart/);
 assert.equal(render('<script>',current),'&lt;script&gt;');
});
test('합쳐진 역본 절은 행 번호가 한 절이어도 문맥 각주를 적용하지 않는다',()=>{
 const document={addEventListener(){},createTreeWalker(){return {nextNode(){return false}}}};
 const localStorage={getItem(){return null},setItem(){}};
 const env={window:{ScriptureNotesData:ctx.window.ScriptureNotesData},document,localStorage,NodeFilter:{SHOW_TEXT:4},CHAPTERS:[{book:{code:'2ch'},chap:20}],console};
 vm.runInNewContext(fs.readFileSync('js/features/scripture-study.js','utf8'),env);
 const segment={dataset:{edition:'easy',studyLabel:'20-21'},textContent:'여호와를 믿으시오',hasAttribute(name){return name==='data-study-label'},innerHTML:''};
 const row={dataset:{},querySelector(s){return s==='.vp-num'?{textContent:'20'}:null},querySelectorAll(s){return s==='.study-version'?[segment]:[]},nextElementSibling:null};
 const root={dataset:{},querySelectorAll(s){return s==='.vp-row'?[row]:[]},querySelector(){return null}};
 env.window.ScriptureStudy.mount(root,['0:gae:easy:20']);
 assert.doesNotMatch(segment.innerHTML,/chron-2-20-trust/);
 segment.dataset.studyLabel='20';env.window.ScriptureStudy.mount(root,['0:gae:easy:20']);
 assert.match(segment.innerHTML,/chron-2-20-trust/);
});
test('문맥 각주는 근거 절과 범위 및 별칭을 갖는다',()=>{
 const notes=ctx.window.ScriptureNotesData.contextualTerms;assert.equal(notes.length,3070);
 const ids=new Set([...terms,...passages].map(n=>n.id));
 for(const n of notes){assert(!ids.has(n.id));ids.add(n.id);assert(n.aliases.length&&n.refs.length&&n.locations.length&&n.summary);for(const l of n.locations){assert(['gen','exo','lev','num','deu','jos','jdg','rut','1sa','2sa','1ki','2ki','1ch','2ch','ezr','neh','est','job','psa','pro','ecc','sng','isa','jer','lam','ezk','dan','hos','jol','amo','oba','jnh','mic','nam','hab','zep','hag','zec','mal','mat','mrk','luk','jhn','act','rom','1co','2co','gal','eph','php','col','1th','2th','1ti','2ti','tit','phm','heb','jas','1pe','2pe','1jn','2jn','3jn','jud','rev'].includes(l.code));assert(l.chapter>0&&l.lo>0&&l.hi>=l.lo);}for(const ref of n.refs){const m=ref.match(/^(.+?) (\d+):(\d+)(?:[-–](\d+))?$/);assert(m,ref);const book=books.find(b=>b.name===m[1]);assert(book&&Number(m[2])<=book.chapters,ref);assert(Number(m[3])>0&&Number(m[4]||m[3])>=Number(m[3]),ref);}for(const link of n.sourceLinks||[])assert.equal(new URL(link.url).protocol,'https:');} for(const [code,count] of [['gen',50],['exo',40],['1ch',29],['2ch',36]]){const chapters=new Set(notes.flatMap(n=>n.locations).filter(l=>l.code===code).map(l=>l.chapter));assert.equal(chapters.size,count);}
});

test('모세오경 문맥 각주는 연결 절 자체를 근거에 포함한다',()=>{
 for(const n of ctx.window.ScriptureNotesData.contextualTerms.filter(n=>/^context-(gen|exo|lev|num|deu|jos|jdg|rut|1sa|2sa|1ki|2ki|1ch|2ch|ezr|neh|est|job|psa|pro|ecc|sng|isa|jer|lam|ezk|dan|hos|jol|amo|oba|jnh|mic|nam|hab|zep|hag|zec|mal|mat|mrk|luk|jhn|act|rom|1co|2co|gal|eph|php|col|1th|2th|1ti|2ti|tit|phm|heb|jas|1pe|2pe|1jn|2jn|3jn|jud|rev)-/.test(n.id))){const l=n.locations[0],name={gen:'창세기',exo:'출애굽기',lev:'레위기',num:'민수기',deu:'신명기',jos:'여호수아',jdg:'사사기',rut:'룻기','1sa':'사무엘상','2sa':'사무엘하','1ki':'열왕기상','2ki':'열왕기하','1ch':'역대상','2ch':'역대하',ezr:'에스라',neh:'느헤미야',est:'에스더',job:'욥기',psa:'시편',pro:'잠언',ecc:'전도서',sng:'아가',isa:'이사야',jer:'예레미야',lam:'예레미야애가',ezk:'에스겔',dan:'다니엘',hos:'호세아',jol:'요엘',amo:'아모스',oba:'오바댜',jnh:'요나',mic:'미가',nam:'나훔',hab:'하박국',zep:'스바냐',hag:'학개',zec:'스가랴',mal:'말라기',mat:'마태복음',mrk:'마가복음',luk:'누가복음',jhn:'요한복음',act:'사도행전',rom:'로마서','1co':'고린도전서','2co':'고린도후서',gal:'갈라디아서',eph:'에베소서',php:'빌립보서',col:'골로새서','1th':'데살로니가전서','2th':'데살로니가후서','1ti':'디모데전서','2ti':'디모데후서',tit:'디도서',phm:'빌레몬서',heb:'히브리서',jas:'야고보서','1pe':'베드로전서','2pe':'베드로후서','1jn':'요한일서','2jn':'요한이서','3jn':'요한삼서',jud:'유다서',rev:'요한계시록'}[l.code];assert(n.refs.some(ref=>{const m=ref.match(/^(.+?) (\d+):(\d+)(?:[-–](\d+))?$/);return m&&m[1]===name&&Number(m[2])===l.chapter&&Number(m[3])<=l.lo&&Number(m[4]||m[3])>=l.hi;}),n.id);}
});
