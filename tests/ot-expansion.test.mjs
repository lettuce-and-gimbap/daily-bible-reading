import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {OBJECT_CATALOG} from '../js/features/pixel-bible/object-catalog.js';import {buildWorldModel} from '../js/features/pixel-bible/world.js';import {scopeChapterSummary} from '../js/features/pixel-bible/qt-scope.js';import {objectLinesFor} from '../js/features/pixel-bible/object-scenes.js';
const root='data/pixel-bible/events/',review=JSON.parse(fs.readFileSync(root+'review.json'));
test('구약 39권 929장의 대조 기록과 권별 장면·추가 언급이 유효하다',()=>{assert.equal(review.books.length,39);assert.equal(review.chapters.length,929);assert.equal(review.books.find(b=>b.code==='jdg').scenes,50);const ids=new Set();let scenes=0;for(const book of review.books){const data=JSON.parse(fs.readFileSync(root+book.code+'.json'));const summary=JSON.parse(fs.readFileSync('data/summary/'+book.code+'.json'));for(const s of data.scenes){assert(!ids.has(s.id));ids.add(s.id);scenes++;assert(OBJECT_CATALOG[s.object],s.object);assert(s.actors.length>0&&s.actors.length<=4);assert(s.verseNumbers.length>0);const people=summary.chapters[s.chapter].people;for(const actor of s.actors)assert(people.some(p=>p.name===actor),s.id+actor);if(s.narrationOnly)assert.equal(Object.keys(s.actorLines).length,0);else for(const [actor,lines]of Object.entries(s.actorLines)){assert.deepEqual(objectLinesFor(s,actor),lines);assert(lines.every(l=>l.length<=100));}}for(const [ch,people]of Object.entries(data.additionalPeople)){assert(summary.chapters[ch]);for(const p of people){assert(p.mentionVerses.length);assert(!summary.chapters[ch].people.some(x=>x.name===p.name));}}}assert(scenes>=600);});
test('구약 사건 검수는 배우·소품 근거를 분리하고 원문 절 누락을 다른 역본과 구분한다',()=>{
 const c=review.coverageSummary;assert.equal(c.eventsReviewed,3533);assert.equal(c.sourceMatchedSceneCandidates,710);assert.equal(c.scenesInFiles,862);assert.equal(c.curatedSupplementalScenes,148);assert.equal(review.curatedSceneReview.books.reduce((n,b)=>n+b.scenesAdded,0),148);assert.equal(c.classification['source-confirmed-actor-and-object'],667);assert.equal(c.classification['source-confirmed-actor-only'],1000);assert.equal(c.classification['source-confirmed-object-only'],629);assert.equal(c.classification['no-source-confirmed-actor-or-object'],1227);assert.equal(c.classification['source-edition-gap'],9);assert.equal(c.classification['referenced-person-not-scene-actor'],1);assert(!JSON.parse(fs.readFileSync(root+'deu.json')).scenes.some(s=>s.id==='ot-deu-23-0'));const omitted=review.chapters.flatMap(ch=>ch.skipped.filter(s=>s.reason==='referenced-person-not-scene-actor'));assert.equal(omitted.length,1);assert.equal(omitted[0].actor,'발람');
 const gaps=review.chapters.flatMap(ch=>ch.skipped.filter(s=>s.reason==='source-edition-gap').map(s=>({code:ch.code,chapter:ch.chapter,...s})));assert.equal(gaps.length,9);for(const gap of gaps){assert.deepEqual(gap.supportedByEditions,['easy','han','hyun','saenew']);assert.ok(gap.missingVerseNumbers.gae.length>0);assert.deepEqual(Object.keys(gap.missingVerseNumbers),['gae']);}
});
test('권별 새 장면은 현재 장·QT 절 범위에서만 열린다',()=>{const code='gen',book=JSON.parse(fs.readFileSync('data/summary/gen.json')),extras=JSON.parse(fs.readFileSync(root+'gen.json'));const scene=extras.scenes.find(s=>s.id.startsWith('ot-voice'));const c={code,name:'창세기',chap:scene.chapter,data:{...book.chapters[scene.chapter],eventScenes:extras.scenes.filter(s=>s.chapter===scene.chapter)}};assert(buildWorldModel([c]).scenes.some(s=>s.id===scene.id));const excluded={...c,verses:[999],data:scopeChapterSummary(c.data,[999])};assert(!buildWorldModel([excluded]).scenes.some(s=>s.id===scene.id));});
test('사사기 누락 사건을 보강하고 양털 표징을 전용 오브젝트로 연결한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jdg.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-jdg-extra-'));
 assert.equal(added.length,24);
 for(const title of ['보김의 울음','옷니엘의 구원','드보라와 바락의 출전','적진에서 들은 꿈','기드온이 구한 양털의 표징','들릴라의 배신과 삼손의 실명','기브아의 밤과 아침','베냐민 지파와의 내전'])assert(added.some(s=>s.title===title),title);
 const fleece=added.find(s=>s.object==='fleece');assert.equal(fleece.animation.motif,'fleece-sign');assert(OBJECT_CATALOG.fleece);
 const indexed=JSON.parse(fs.readFileSync('data/pixel-bible/objects/jdg.json'));assert(indexed.chapters['6'].some(o=>o.id==='fleece'&&o.refs.includes(fleece.ref)));
});

test('룻기의 가족 상실·귀향·타작마당 약속·오벳 탄생 누락을 장면으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'rut.json')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/rut.json'));
 assert.equal(data.scenes.length,12);for(const id of ['ot-rut-extra-01','ot-rut-extra-02','ot-rut-extra-03','ot-rut-extra-04'])assert(data.scenes.some(s=>s.id===id));
 const threshing=data.scenes.find(s=>s.id==='ot-voice-15');assert.deepEqual(threshing.actors,['룻','보아스']);assert.equal(threshing.ref,'룻기 3:6-13');assert.equal(threshing.actorLines.보아스.length,1);
 for(const s of data.scenes.filter(x=>x.id.startsWith('ot-rut-extra-')))assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)));
});

test('사무엘상의 빠진 서사 장면과 양방향 이별·중재 대화를 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1sa.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-1sa-extra-'));assert.equal(added.length,35);
 for(const title of ['한나의 간절한 기도','빼앗긴 언약궤','다곤 신전의 궤','야베스를 구한 사울','골리앗의 도전과 다윗의 도착','아비아달의 피신','불탄 시글락과 무너진 마음'])assert(added.some(s=>s.title===title),title);
 for(const id of ['ot-1sa-20-3','ot-1sa-25-6']){const s=data.scenes.find(x=>x.id===id);assert.equal(s.actors.length,2);assert.equal(Object.keys(s.actorLines).length,2);for(const actor of s.actors)assert.equal(s.actorLines[actor].length,1);}
});

test('사무엘하의 언약·반란·화해 흐름과 므비보셋 양방향 장면을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2sa.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-2sa-extra-'));assert.equal(added.length,26);
 for(const title of ['시온 산성을 차지한 다윗','다윗의 왕위를 잇는 약속','왕의 권력 아래 놓인 밧세바','압살롬의 반역과 다윗의 피신','압살롬의 죽음을 듣고 우는 다윗','기브온의 요구와 리스바의 애곡'])assert(added.some(s=>s.title===title),title);
 const scene=data.scenes.find(s=>s.id==='ot-voice-20');assert.equal(scene.ref,'사무엘하 9:1-13');assert.deepEqual(scene.actors,['다윗','므비보셋']);assert.equal(Object.keys(scene.actorLines).length,2);
});

test('열왕기상에 빠진 왕위 위기·지혜 재판·예언 사건과 엘리야·엘리사 상호 장면을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ki.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-1ki-extra-'));assert.equal(added.length,29);
 for(const title of ['아도니야의 왕위 찬탈 시도','아이의 어머니를 가려낸 재판','벧엘과 단의 금송아지','과부의 아들이 살아나다','나봇의 포도원을 거절함','미가야가 본 전쟁의 환상'])assert(added.some(s=>s.title===title),title);
 const scene=data.scenes.find(s=>s.id==='ot-voice-22');assert.deepEqual(scene.actors,['엘리야','엘리사']);assert.equal(Object.keys(scene.actorLines).length,2);assert(OBJECT_CATALOG.idol);
});

test('역대상의 빠진 왕권·전쟁·예배 조직 사건과 중요한 계보 흐름을 장면으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ch.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-1ch-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/1ch.json'));assert.equal(added.length,30);
 for(const title of ['야베스의 기도','다윗과 요압이 시온 산성을 차지하다','웃사가 언약궤에 손을 뻗다','미갈이 다윗의 춤을 업신여기다','예루살렘 위에서 멈춘 심판의 칼','제사장 반열을 제비로 정하다','솔로몬이 온 이스라엘 앞에서 왕이 되다'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);assert(s.verseNumbers.length>0);}
});
