import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {OBJECT_CATALOG} from '../js/features/pixel-bible/object-catalog.js';import {buildWorldModel} from '../js/features/pixel-bible/world.js';import {scopeChapterSummary} from '../js/features/pixel-bible/qt-scope.js';import {objectLinesFor} from '../js/features/pixel-bible/object-scenes.js';
const root='data/pixel-bible/events/',review=JSON.parse(fs.readFileSync(root+'review.json'));
test('구약 39권 929장의 대조 기록과 권별 장면·추가 언급이 유효하다',()=>{assert.equal(review.books.length,39);assert.equal(review.chapters.length,929);assert.equal(review.books.find(b=>b.code==='jdg').scenes,80);assert.equal(review.books.find(b=>b.code==='rut').scenes,13);assert.equal(review.books.find(b=>b.code==='1sa').scenes,143);assert.equal(review.books.find(b=>b.code==='2sa').scenes,114);const ids=new Set();let scenes=0;for(const book of review.books){const data=JSON.parse(fs.readFileSync(root+book.code+'.json'));const summary=JSON.parse(fs.readFileSync('data/summary/'+book.code+'.json'));for(const s of data.scenes){assert(!ids.has(s.id));ids.add(s.id);scenes++;assert(OBJECT_CATALOG[s.object],s.object);assert(s.actors.length>0&&s.actors.length<=4);assert(s.verseNumbers.length>0);const people=summary.chapters[s.chapter].people;for(const actor of s.actors)assert(people.some(p=>p.name===actor),s.id+actor);if(s.narrationOnly)assert.equal(Object.keys(s.actorLines).length,0);else for(const [actor,lines]of Object.entries(s.actorLines)){assert.deepEqual(objectLinesFor(s,actor),lines);assert(lines.every(l=>l.length<=100));}}for(const [ch,people]of Object.entries(data.additionalPeople)){assert(summary.chapters[ch]);for(const p of people){assert(p.mentionVerses.length);assert(!summary.chapters[ch].people.some(x=>x.name===p.name));}}}assert(scenes>=600);});
test('구약 사건 검수는 배우·소품 근거를 분리하고 원문 절 누락을 다른 역본과 구분한다',()=>{
 const c=review.coverageSummary;assert.equal(c.eventsReviewed,3533);assert.equal(c.sourceMatchedSceneCandidates,710);assert.equal(c.scenesInFiles,1865);assert.equal(c.curatedSupplementalScenes,1150);assert.equal(review.curatedSceneReview.books.reduce((n,b)=>n+b.scenesAdded,0),1107);assert.equal(c.classification['source-confirmed-actor-and-object'],667);assert.equal(c.classification['source-confirmed-actor-only'],1000);assert.equal(c.classification['source-confirmed-object-only'],629);assert.equal(c.classification['no-source-confirmed-actor-or-object'],1227);assert.equal(c.classification['source-edition-gap'],9);assert.equal(c.classification['referenced-person-not-scene-actor'],1);assert(!JSON.parse(fs.readFileSync(root+'deu.json')).scenes.some(s=>s.id==='ot-deu-23-0'));const omitted=review.chapters.flatMap(ch=>ch.skipped.filter(s=>s.reason==='referenced-person-not-scene-actor'));assert.equal(omitted.length,1);assert.equal(omitted[0].actor,'발람');
 const gaps=review.chapters.flatMap(ch=>ch.skipped.filter(s=>s.reason==='source-edition-gap').map(s=>({code:ch.code,chapter:ch.chapter,...s})));assert.equal(gaps.length,9);for(const gap of gaps){assert.deepEqual(gap.supportedByEditions,['easy','han','hyun','saenew']);assert.ok(gap.missingVerseNumbers.gae.length>0);assert.deepEqual(Object.keys(gap.missingVerseNumbers),['gae']);}
});
test('레위기 27장 859절이 모두 장면 참조에 포함되고 율례의 핵심 구간을 구분한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'lev.json')),covered=new Set(data.scenes.flatMap(s=>s.verseNumbers.map(v=>`${s.chapter}:${v}`)));
 assert.equal(data.scenes.length,94);assert.equal(covered.size,859);
 for(let ch=1;ch<=27;ch++){const verses=JSON.parse(fs.readFileSync('docs/ot-verse-review-progress.json')).books.lev.reviewedVerses.filter(v=>v.startsWith(`${ch}:`));for(const v of verses)assert(covered.has(v),v);}
 for(const ref of ['레위기 12:3','레위기 16:23-34','레위기 23:33-44','레위기 25:8-22','레위기 24:1-9'])assert(data.scenes.some(s=>s.ref===ref),ref);
});
test('민수기 36장 1,288절을 장면 범위로 모두 덮고 광야 여정의 전환 사건을 나눈다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'num.json')),covered=new Set(data.scenes.flatMap(s=>s.verseNumbers.map(v=>`${s.chapter}:${v}`)));
 assert.equal(data.scenes.length,124);assert.equal(covered.size,1288);
 for(let ch=1;ch<=36;ch++){const verses=JSON.parse(fs.readFileSync('docs/ot-verse-review-progress.json')).books.num.reviewedVerses.filter(v=>v.startsWith(`${ch}:`));for(const v of verses)assert(covered.has(v),v);}
 for(const ref of ['민수기 10:1-10','민수기 13:1-16','민수기 21:4-7','민수기 22:22-35','민수기 27:1-11','민수기 35:9-15'])assert(data.scenes.some(s=>s.ref===ref),ref);
});
test('신명기 34장 959절을 모두 장면화하고 제공 원문에서 빠진 역본 절을 별도로 기록한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'deu.json')),covered=new Set(data.scenes.flatMap(s=>s.verseNumbers.map(v=>`${s.chapter}:${v}`))),progress=JSON.parse(fs.readFileSync('docs/ot-verse-review-progress.json'));
 assert.equal(data.scenes.length,125);assert.equal(covered.size,959);
 for(let ch=1;ch<=34;ch++){const verses=progress.books.deu.reviewedVerses.filter(v=>v.startsWith(`${ch}:`));for(const v of verses)assert(covered.has(v),v);}
 for(const ref of ['신명기 4:41-49','신명기 6:1-5','신명기 15:7-11','신명기 28:45-57','신명기 32:36-43'])assert(data.scenes.some(s=>s.ref===ref),ref);
 assert.deepEqual(progress.books.deu.sourceEditionGaps.gae,['6:18','6:19','15:4','15:5','30:9','30:10']);assert.deepEqual(progress.books.deu.fullCoverageBy,['easy','han','saenew']);
});
test('여호수아 24장 658절의 장면 참조를 빠짐없이 덮고 역본별 원자료 누락을 기록한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jos.json')),covered=new Set(data.scenes.flatMap(s=>s.verseNumbers.map(v=>`${s.chapter}:${v}`))),progress=JSON.parse(fs.readFileSync('docs/ot-verse-review-progress.json'));
 assert.equal(data.scenes.length,79);assert.equal(covered.size,658);assert.equal(progress.books.jos.reviewedCount,658);assert.equal(progress.books.jos.remainingCount,0);
 for(let ch=1;ch<=24;ch++)for(const ref of progress.books.jos.reviewedVerses.filter(v=>v.startsWith(`${ch}:`)))assert(covered.has(ref),ref);
 for(const ref of ['여호수아 2:1-7','여호수아 6:15-21','여호수아 8:24-29','여호수아 9:16-21','여호수아 22:21-29','여호수아 24:14-18'])assert(data.scenes.some(s=>s.ref===ref),ref);
 assert.deepEqual(progress.books.jos.sourceEditionGaps.hyun,['2:24']);assert.equal(progress.books.jos.sourceEditionGaps.niv.length,17);assert.deepEqual(progress.books.jos.fullCoverageBy,['gae','easy','han','saenew']);
});
test('사사기 21장 618절을 빠짐없이 덮고 드보라의 노래를 네 연으로 나눠 표현한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jdg.json')),covered=new Set(data.scenes.flatMap(s=>s.verseNumbers.map(v=>`${s.chapter}:${v}`))),progress=JSON.parse(fs.readFileSync('docs/ot-verse-review-progress.json'));
 assert.equal(data.scenes.length,80);assert.equal(covered.size,618);assert.equal(progress.books.jdg.reviewedCount,618);assert.equal(progress.books.jdg.remainingCount,0);
 for(let ch=1;ch<=21;ch++)for(const ref of progress.books.jdg.reviewedVerses.filter(v=>v.startsWith(`${ch}:`)))assert(covered.has(ref),ref);
 const song=data.scenes.filter(s=>s.chapter===5);assert.deepEqual(song.map(s=>s.ref),['사사기 5:1-11','사사기 5:12-18','사사기 5:19-23','사사기 5:24-31']);assert(song.every(s=>s.animation.mode==='illustration'));
 assert.deepEqual(progress.books.jdg.sourceEditionGaps.easy,['20:22','20:23']);assert.equal(progress.books.jdg.sourceEditionGaps.niv.length,16);assert.deepEqual(progress.books.jdg.fullCoverageBy,['gae','han','hyun','saenew']);
 for(const s of data.scenes.filter(s=>s.id.startsWith('ot-jdg-review-')))assert(JSON.parse(fs.readFileSync('data/pixel-bible/objects/jdg.json')).chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);
});
test('룻기 4장 족보 장면까지 85절을 덮고 NIV 추출의 누락 행을 남긴다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'rut.json')),covered=new Set(data.scenes.flatMap(s=>s.verseNumbers.map(v=>`${s.chapter}:${v}`))),progress=JSON.parse(fs.readFileSync('docs/ot-verse-review-progress.json'));
 assert.equal(data.scenes.length,13);assert.equal(covered.size,85);assert.equal(progress.books.rut.reviewedCount,85);assert.equal(progress.books.rut.remainingCount,0);
 for(let ch=1;ch<=4;ch++)for(const ref of progress.books.rut.reviewedVerses.filter(v=>v.startsWith(`${ch}:`)))assert(covered.has(ref),ref);
 const genealogy=data.scenes.find(s=>s.ref==='룻기 4:18-22');assert(genealogy);assert.equal(genealogy.animation.motif,'genealogy');assert.equal(genealogy.animation.mode,'illustration');
 assert.deepEqual(progress.books.rut.sourceEditionGaps.niv,['4:7']);assert.deepEqual(progress.books.rut.fullCoverageBy,['gae','easy','han','hyun','saenew']);
});
test('사무엘상 31장 810절을 모든 장면 참조로 덮고 역본별 행 결손을 구분한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1sa.json')),covered=new Set(data.scenes.flatMap(s=>s.verseNumbers.map(v=>`${s.chapter}:${v}`))),progress=JSON.parse(fs.readFileSync('docs/ot-verse-review-progress.json'));
 assert.equal(data.scenes.length,143);assert.equal(covered.size,810);assert.equal(progress.books['1sa'].reviewedCount,810);assert.equal(progress.books['1sa'].remainingCount,0);
 for(let ch=1;ch<=31;ch++)for(const ref of progress.books['1sa'].reviewedVerses.filter(v=>v.startsWith(`${ch}:`)))assert(covered.has(ref),ref);
 for(const ref of ['사무엘상 1:1-8','사무엘상 4:19-22','사무엘상 16:6-10','사무엘상 25:32-35','사무엘상 28:15-19'])assert(data.scenes.some(s=>s.ref===ref),ref);
 assert.equal(progress.books['1sa'].sourceEditionGaps.han.length,1);assert.equal(progress.books['1sa'].sourceEditionGaps.hyun.length,2);assert.equal(progress.books['1sa'].sourceEditionGaps.niv.length,20);assert.deepEqual(progress.books['1sa'].fullCoverageBy,['gae','easy','saenew']);
 for(const s of data.scenes.filter(x=>x.id.startsWith('ot-1sa-review-')))assert(JSON.parse(fs.readFileSync('data/pixel-bible/objects/1sa.json')).chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);
});
test('사무엘하 24장 695절을 모두 덮고 다윗의 노래를 시적 단락으로 분리한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2sa.json')),covered=new Set(data.scenes.flatMap(s=>s.verseNumbers.map(v=>`${s.chapter}:${v}`))),progress=JSON.parse(fs.readFileSync('docs/ot-verse-review-progress.json'));
 assert.equal(data.scenes.length,114);assert.equal(covered.size,695);assert.equal(progress.books['2sa'].reviewedCount,695);assert.equal(progress.books['2sa'].remainingCount,0);
 for(let ch=1;ch<=24;ch++)for(const ref of progress.books['2sa'].reviewedVerses.filter(v=>v.startsWith(`${ch}:`)))assert(covered.has(ref),ref);
 const song=data.scenes.filter(s=>s.chapter===22);assert.equal(song.length,7);assert(song.every(s=>s.animation.mode==='illustration'));assert.equal(song.filter(s=>s.id.startsWith('ot-2sa-review-')).length,6);
 for(const ref of ['사무엘하 1:19-27','사무엘하 13:15-19','사무엘하 22:8-20','사무엘하 23:24-39'])assert(data.scenes.some(s=>s.ref===ref),ref);
 assert.equal(progress.books['2sa'].sourceEditionGaps.easy.length,2);assert.equal(progress.books['2sa'].sourceEditionGaps.hyun.length,2);assert.equal(progress.books['2sa'].sourceEditionGaps.niv.length,17);assert.deepEqual(progress.books['2sa'].fullCoverageBy,['gae','han','saenew']);
 for(const s of data.scenes.filter(x=>x.id.startsWith('ot-2sa-review-')))assert(JSON.parse(fs.readFileSync('data/pixel-bible/objects/2sa.json')).chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);
});
test('권별 새 장면은 현재 장·QT 절 범위에서만 열린다',()=>{const code='gen',book=JSON.parse(fs.readFileSync('data/summary/gen.json')),extras=JSON.parse(fs.readFileSync(root+'gen.json'));const scene=extras.scenes.find(s=>s.id.startsWith('ot-voice'));const c={code,name:'창세기',chap:scene.chapter,data:{...book.chapters[scene.chapter],eventScenes:extras.scenes.filter(s=>s.chapter===scene.chapter)}};assert(buildWorldModel([c]).scenes.some(s=>s.id===scene.id));const excluded={...c,verses:[999],data:scopeChapterSummary(c.data,[999])};assert(!buildWorldModel([excluded]).scenes.some(s=>s.id===scene.id));});
test('사사기 누락 사건을 보강하고 양털 표징을 전용 오브젝트로 연결한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jdg.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-jdg-extra-'));
 assert.equal(added.length,24);
 for(const title of ['보김의 울음','옷니엘의 구원','드보라와 바락의 출전','적진에서 들은 꿈','기드온이 구한 양털의 표징','들릴라의 압박과 삼손의 비밀 노출','기브아의 밤과 아침','베냐민 지파와의 내전'])assert(added.some(s=>s.title===title),title);
 const fleece=added.find(s=>s.object==='fleece');assert.equal(fleece.animation.motif,'fleece-sign');assert(OBJECT_CATALOG.fleece);
 const indexed=JSON.parse(fs.readFileSync('data/pixel-bible/objects/jdg.json'));assert(indexed.chapters['6'].some(o=>o.id==='fleece'&&o.refs.includes(fleece.ref)));
});

test('룻기의 가족 상실·귀향·타작마당 약속·오벳 탄생 누락을 장면으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'rut.json')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/rut.json'));
 assert.equal(data.scenes.length,13);for(const id of ['ot-rut-extra-01','ot-rut-extra-02','ot-rut-extra-03','ot-rut-extra-04'])assert(data.scenes.some(s=>s.id===id));
 const threshing=data.scenes.find(s=>s.id==='ot-voice-15');assert.deepEqual(threshing.actors,['룻','보아스']);assert.equal(threshing.ref,'룻기 3:6-13');assert.equal(threshing.actorLines.보아스.length,1);
 for(const s of data.scenes.filter(x=>x.id.startsWith('ot-rut-extra-')))assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)));
});

test('사무엘상의 빠진 서사 장면과 양방향 이별·중재 대화를 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1sa.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-1sa-extra-'));assert.equal(added.length,41);
 for(const title of ['한나의 간절한 기도','빼앗긴 언약궤','다곤 신전의 궤','야베스를 구한 사울','골리앗의 도전과 다윗의 도착','아비아달의 피신','불탄 시글락과 무너진 마음'])assert(added.some(s=>s.title===title),title);
 for(const id of ['ot-1sa-20-3','ot-1sa-25-6']){const s=data.scenes.find(x=>x.id===id);assert.equal(s.actors.length,2);assert.equal(Object.keys(s.actorLines).length,2);for(const actor of s.actors)assert.equal(s.actorLines[actor].length,1);}
});

test('사무엘하의 언약·반란·화해 흐름과 므비보셋 양방향 장면을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2sa.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-2sa-extra-'));assert.equal(added.length,35);
 for(const title of ['시온 산성을 차지한 다윗','다윗의 왕위를 잇는 약속','왕의 권력 아래 놓인 밧세바','압살롬의 반역과 다윗의 피신','압살롬의 죽음을 듣고 우는 다윗','기브온 사람들의 보응 요구','리스바의 애도와 사울 집안의 장례'])assert(added.some(s=>s.title===title),title);
 const scene=data.scenes.find(s=>s.id==='ot-voice-20');assert.equal(scene.ref,'사무엘하 9:1-13');assert.deepEqual(scene.actors,['다윗','므비보셋']);assert.equal(Object.keys(scene.actorLines).length,2);
});

test('열왕기상에 빠진 왕위 위기·지혜 재판·예언 사건과 엘리야·엘리사 상호 장면을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ki.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-1ki-extra-'));assert.equal(added.length,39);
 for(const title of ['아도니야의 왕위 찬탈 시도','아이의 어머니를 가려낸 재판','벧엘과 단의 금송아지','과부의 아들이 살아나다','나봇의 포도원을 거절함','미가야가 본 전쟁의 환상'])assert(added.some(s=>s.title===title),title);
 const scene=data.scenes.find(s=>s.id==='ot-voice-22');assert.deepEqual(scene.actors,['엘리야','엘리사']);assert.equal(Object.keys(scene.actorLines).length,2);assert(OBJECT_CATALOG.idol);
});

test('역대상의 빠진 왕권·전쟁·예배 조직 사건과 중요한 계보 흐름을 장면으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ch.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-1ch-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/1ch.json'));assert.equal(added.length,38);
 for(const title of ['야베스의 기도','다윗과 요압이 시온 산성을 차지하다','웃사가 언약궤에 손을 뻗다','미갈이 다윗의 춤을 업신여기다','예루살렘 위에서 멈춘 심판의 칼','제사장 반열을 제비로 정하다','솔로몬이 온 이스라엘 앞에서 왕이 되다'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);assert(s.verseNumbers.length>0);}
});

test('역대하의 성전 봉헌·왕권 위기·개혁과 포로 전후 사건의 누락을 장면으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2ch.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-2ch-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2ch.json'));assert.equal(added.length,53);
 for(const title of ['지혜와 지식을 구한 솔로몬','모리아산에 세워지는 성전','언약궤를 성전으로 모시다','미가야가 아합의 전쟁을 경고하다','예후의 책망 뒤 재판관을 세우다','닫힌 성전 문을 열고 정결하게 하다','예루살렘 함락과 포로 생활'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);assert(s.verseNumbers.length>0);}
});

test('에스라의 귀환·재건·율법 교육·공동체 회복에서 빠진 사건을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'ezr.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-ezr-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/ezr.json'));assert.equal(added.length,13);
 for(const title of ['귀환자들이 집안별로 예루살렘에 모이다','기초 앞에서 터진 울음과 함성','닷드내가 재건 이유를 묻다','율법을 연구하고 가르치려는 에스라','큰비 속에 모여 결단한 회중'])assert(added.some(s=>s.title===title),title);
 for(const s of added)assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);const prayer=data.scenes.find(s=>s.id==='ot-voice-30');assert.equal(prayer.ref,'에스라 9:5-15');assert.equal(prayer.verseNumbers.length,11);
});

test('느헤미야의 성벽 재건·공동체 회복·예배 개혁에서 빠진 핵심 사건을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'neh.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-neh-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/neh.json'));assert.equal(added.length,19);
 for(const title of ['왕이 허락한 예루살렘 재건','밤중에 무너진 성벽을 살피다','한 손으로 일하고 한 손으로 지키다','빚으로 땅과 자녀를 잃는 백성','초막절을 함께 지키는 기쁨','금식하며 죄를 고백하는 회중','안식일에 닫아 건 성문'])assert(added.some(s=>s.title===title),title);
 for(const s of added)assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);const prayer=data.scenes.find(s=>s.id==='ot-neh-1-2');assert.equal(prayer.ref,'느헤미야 1:5-11');
});

test('에스더서의 왕후 교체·하만의 음모·중재·부림절 제정에서 빠진 사건을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'est.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-est-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/est.json'));assert.equal(added.length,16);
 for(const title of ['수산 궁의 잔치와 와스디의 거절','왕후로 선택된 에스더','모르드개가 왕을 해치려는 음모를 알리다','왕의 기록을 읽고 모르드개의 공을 찾다','에스더가 민족을 위해 간청하다','쉬는 날과 부림절을 정하다'])assert(added.some(s=>s.title===title),title);
 for(const s of added)assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);
});

test('욥기의 논쟁·엘리후의 답변·폭풍 속 질문과 회복을 상징 장면으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'job.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-job-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/job.json'));assert.equal(added.length,29);
 for(const title of ['재앙 뒤에도 하나님을 예배한 욥','일곱 날을 말없이 함께한 세 친구','엘리바스의 충고와 욥의 응답','대속자가 살아 계시리라는 욥의 희망','자신의 삶을 내놓는 욥의 맹세','폭풍 속에서 욥에게 물으시는 하나님','친구들을 위해 기도한 욥','회복된 욥과 다시 이어진 가족의 삶'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);assert(s.narrationOnly);}
 assert(added.filter(s=>[38,40].includes(s.chapter)).every(s=>!s.actors.includes('하나님')));
});

test('시편의 출애굽·광야·다윗 언약 회고를 사건과 시적 상징으로 나눠 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'psa.json')),added=data.scenes.filter(s=>['구원하신 하나님을 노래한 다윗' ,'광야의 행진과 성소로 향하는 찬양' ,'무너진 성소를 바라보는 아삽의 탄식' ,'광야에서 반복된 불신과 돌보심' ,'구원을 잊은 반역과 실로의 상실' ,'다윗과 맺은 왕위의 언약' ,'땅에 던져진 왕관을 탄식하다' ,'앞서 애굽으로 보내진 요셉' ,'출애굽 뒤 광야의 돌보심과 땅의 선물' ,'홍해 앞의 불신과 모세의 중보' ,'가나안에서의 반역과 비느하스의 개입' ,'출애굽 때 바다와 요단이 물러서다'].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/psa.json'));assert.equal(added.length,12);
 for(const title of ['구원하신 하나님을 노래한 다윗','무너진 성소를 바라보는 아삽의 탄식','앞서 애굽으로 보내진 요셉','출애굽 뒤 광야의 돌보심과 땅의 선물','출애굽 때 바다와 요단이 물러서다'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});

test('잠언의 개미·젊은이·게으른 밭 비유와 히스기야 시대 편집 기록을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'pro.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-pro-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/pro.json'));assert.equal(added.length,4);
 for(const title of ['개미에게서 배우는 부지런함','해 질 녘에 덫에 걸린 젊은이','게으른 이의 밭에 자란 가시와 잡초','히스기야의 신하들이 솔로몬의 잠언을 모으다'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);assert.equal(s.animation.mode,'illustration');}
});

test('아가의 계절 초대·밤의 찾음·동산 비유를 노래의 화자와 상징으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'sng.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-sng-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/sng.json'));assert.equal(added.length,8);
 for(const title of ['봄을 알리며 함께 가자고 부르다','밤중에 일어나 사랑하는 이를 찾다','잠근 동산을 열어 초대하다','문 앞에서 늦고 밤거리에서 찾다','사랑하는 이가 동산으로 돌아오다','들로 나가 포도밭을 살피자고 청하다'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert.equal(s.animation.mode,'illustration');assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('이사야의 소명과 히스기야 시대에 빠진 사건·응답 장면을 보강하고 예언은 상징으로 유지한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'isa.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-isa-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/isa.json'));assert.equal(added.length,12);
 for(const title of ['이사야의 부르심에 응답하다','임마누엘의 징조를 전하다','랍사게가 성벽 앞에서 백성에게 외치다','히스기야가 편지를 펴고 기도하다','병든 히스기야에게 전해진 회복의 표징','이사야가 바빌론 사절 방문의 의미를 묻다'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
 assert.equal(added.find(s=>s.title==='임마누엘의 징조를 전하다').animation.mode,'illustration');assert.equal(added.find(s=>s.title==='회복 뒤에 부른 히스기야의 노래').animation.mode,'illustration');
});


test('예레미야의 성전 설교·박해·포로 권면·애굽행과 남은 자 사건을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jer.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-jer-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/jer.json'));assert.equal(added.length,16);
 for(const title of ['예레미야를 부르신 소명','성전 문에서 돌이키라고 외치다','왕이 두루마리를 불태우다','미스바의 순례자들이 살해되다','애굽으로 가지 말라는 말씀을 거부하다'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('예레미야애가의 공동체 탄식과 희망을 비그래픽한 상징 장면으로 나눈다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'lam.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-lam-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/lam.json'));assert.equal(added.length,10);
 for(const title of ['홀로 남은 시온의 탄식','아이들의 굶주림을 보고 우는 시인','아침마다 새로워지는 희망을 붙들다','다시 돌아오게 해 달라는 마지막 간구'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert.equal(s.animation.mode,'illustration');assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('에스겔의 상징 행동·포로 소식·회복 환상을 사건별로 구분한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'ezk.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-ezk-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/ezk.json'));assert.equal(added.length,18);
 for(const title of ['그발 강가에서 본 하나님의 영광','포로 행장을 꾸려 떠날 준비를 하다','예루살렘 함락 소식을 전하는 도망자','마른 뼈들이 살아나는 환상','성전에서 흘러나와 바다를 살리는 강'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert.equal(s.animation.mode,'illustration');assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('다니엘서의 왕궁 시험·불 가운데의 구원·환상 해석을 누락 사건으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'dan.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-dan-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/dan.json'));assert.equal(added.length,8);
 for(const title of ['왕의 음식 대신 시험을 청하다','불 가운데서 보호받은 세 친구','큰 나무의 꿈을 해석하다','숫양과 숫염소의 환상을 보다'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert.equal(s.animation.mode,'illustration');assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('hos 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'hos.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-hos-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/hos.json'));assert.equal(added.length,4);
 for(const title of ["호세아가 고멜과 혼인하라는 부름을 받다","자녀들의 이름이 심판의 표징이 되다","호세아가 고멜을 다시 데려오다","돌아오라는 마지막 부름과 치유의 약속"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('jol 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jol.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-jol-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/jol.json'));assert.equal(added.length,6);
 for(const title of ["메뚜기 재앙에 농부와 포도원 일꾼이 탄식하다","메마른 들판에서 하나님께 부르짖다","나팔을 불어 여호와의 날을 알리다","돌아온 백성에게 햇수의 회복을 약속하다","모든 사람에게 영을 부으시리라 약속하다","열국을 심판하고 백성의 피난처가 되다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('amo 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'amo.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-amo-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/amo.json'));assert.equal(added.length,11);
 for(const title of ["다메섹과 가사에 대한 심판 선언","사자의 포효처럼 임박한 말씀을 전하다","거듭된 재앙에도 돌아오지 않은 백성","악을 버리고 성문에서 정의를 세우라","정의를 물처럼 흐르게 하라고 외치다","상아 침상에 누운 지도자들을 꾸짖다","메뚜기와 불의 환상 뒤에 긍휼을 구하다","다림줄 환상과 벧엘의 제사장 아마샤","저울을 속이는 상인과 말씀의 기근","제단 곁에서 본 피할 수 없는 심판","다윗의 무너진 장막을 다시 세우다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('jnh 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jnh.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-jnh-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/jnh.json'));assert.equal(added.length,6);
 for(const title of ["제비가 요나에게 떨어지다","선원들이 바다에 요나를 내리다","큰 물고기 뱃속에서 드린 기도","두 번째 부름을 받고 니느웨로 가다","니느웨 왕과 백성이 돌이키다","요나의 분노와 하나님의 마지막 질문"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('mic 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'mic.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-mic-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/mic.json'));assert.equal(added.length,8);
 for(const title of ["탐욕스러운 이들이 밭과 집을 빼앗다","남은 자를 모아 한 떼로 세우다","백성의 살을 뜯는 지도자들을 꾸짖다","시온으로 모여드는 민족과 돌아오는 사람들","베들레헴에서 나올 다스릴 이를 약속하다","하나님이 베푸신 일을 기억하며 대답하다","원수 앞에서도 구원을 기다리다","죄를 용서하고 다시 세우시는 하나님을 노래하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('oba 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'oba.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-oba-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/oba.json'));assert.equal(added.length,5);
 for(const title of ["에돔의 보물과 동맹이 무너지다","형제의 재난을 외면한 에돔을 책망하다","모든 민족에게 행한 대로 돌아오다","시온에서 구원자들이 다스리다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('nam 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'nam.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-nam-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/nam.json'));assert.equal(added.length,5);
 for(const title of ["니느웨를 향한 경고와 심판의 권능","유다의 멍에를 꺾고 평화를 알리다","니느웨 성을 향해 진군하는 군대","사자의 굴이 비게 되리라","피의 성 니느웨의 몰락을 애도하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('hab 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'hab.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-hab-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/hab.json'));assert.equal(added.length,6);
 for(const title of ["폭력이 그치지 않는 현실을 묻다","갈대아의 위협을 이해할 수 없어 묻다","교만한 탐욕과 믿음의 삶","탐욕과 폭력에 대한 다섯 경고","진노 중에도 긍휼을 구하는 기도","그럴지라도 주 안에서 기뻐하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('zep 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'zep.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-zep-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/zep.json'));assert.equal(added.length,7);
 for(const title of ["우상 숭배와 안일한 지도자들을 깨우다","여호와의 큰 날을 앞두고 찾으라","겸손과 공의를 구하라고 부르다","주변 민족의 교만을 낮추다","패역한 성과 타락한 지도자들을 책망하다","쫓겨난 이들을 모으고 수치를 돌이키다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('hag 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'hag.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-hag-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/hag.json'));assert.equal(added.length,5);
 for(const title of ["자기 집만 돌보는 백성에게 성전을 세우라 하다","스룹바벨과 여호수아가 백성을 이끌다","작아 보이는 성전을 굳세게 세우라 하다","부정과 복에 관한 제사장들의 답","스룹바벨을 인장 반지처럼 세우다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('mal 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'mal.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-mal-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/mal.json'));assert.equal(added.length,6);
 for(const title of ["멸시받는 제물과 하나님의 이름을 책망하다","레위와 맺은 언약을 되새기다","형제와 아내에게 신실하라고 촉구하다","온전한 십일조와 돌봄을 회복하라 하다","여호와를 경외하는 이들의 이름을 기록하다","모세의 율법과 엘리야의 약속으로 맺다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('zec 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'zec.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-zec-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/zec.json'));assert.equal(added.length,17);
 for(const title of ["말 탄 이들이 땅의 형편을 보고하다","네 뿔과 네 대장장이의 환상","바벨론을 떠나 시온으로 나오라 하다","더러운 옷을 벗고 새 옷을 입은 여호수아","순금 등잔대와 감람나무를 보다","날아가는 두루마리와 저주의 환상","에바에 담겨 시날로 옮겨지는 악","네 병거가 사방으로 나가다","금식이 누구를 위한 것인지 묻다","노인과 아이들이 함께 사는 예루살렘","겸손한 왕이 나귀를 타고 오다","목자 없는 양 떼를 모으다","은총과 연합의 막대기를 꺾다","찔린 이를 바라보며 애통하다","죄와 더러움을 씻는 샘을 열다","감람산과 생수의 날을 그리다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('deu 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'deu.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-deu-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/deu.json'));assert.equal(added.length,16);
 for(const title of ["정탐꾼의 보고와 백성의 두려움을 회고하다","뒤늦은 출정이 실패하다","시혼의 땅을 지나 정복하다","옥의 바산을 차지하고 땅을 나누다","호렙에서 받은 말씀을 다음 세대에 전하다","백성이 두려워 중재를 부탁하다","금송아지 앞에서 돌판을 깨고 중보하다","새 돌판과 언약궤를 마련하다","율법을 돌에 기록하고 에발 산에 제단을 세우다","모압에서 언약을 새롭게 하다","생명과 죽음 앞에서 생명을 택하라 하다","여호수아를 후계자로 세우다","칠 년마다 율법을 낭독하라 명하다","모세가 노래를 전하고 백성에게 기억시키다","비스가 산에서 땅을 바라보고 모세가 죽다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('ecc 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'ecc.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-ecc-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/ecc.json'));assert.equal(added.length,11);
 for(const title of ["즐거움과 큰일을 시험한 전도자","때를 따라 일하시는 일을 바라보다","학대받는 이의 눈물과 홀로 있는 사람","지혜로운 소년과 늙고 둔한 왕","수고 가운데 자기 몫을 기뻐하다","악인이 오래 사는 현실과 늦은 심판을 보다","가난한 지혜자가 큰 성을 구하다","아침에 씨를 뿌리고 저녁에도 손을 거두지 않다","노년이 오기 전에 창조주를 기억하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('lev 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'lev.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-lev-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/lev.json'));assert.equal(added.length,6);
 for(const title of ["번제 제물을 드리는 절차를 가르치다","속죄일에 두 염소를 세우다","하나님의 이름을 모독한 사건을 판결하다","순종의 복과 불순종의 결과를 경고하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('시편 표제의 역사적 배경과 포로·회복 노래의 사건을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'psa.json')),added=data.scenes.filter(s=>['아비멜렉 앞에서 미친 체한 다윗의 노래', '도엑의 고발과 아히멜렉의 죽음을 탄식하다', '십 사람들이 사울에게 밀고한 뒤 드린 기도', '가드에서 붙잡힌 다윗의 두려움과 신뢰', '굴에 숨어 아침을 기다리는 다윗', '집을 지키는 사울의 사람들을 피해 기도하다', '에돔과의 전쟁 가운데 도움을 구하다', '유다 광야에서 하나님을 찾는 다윗', '광야에서 길을 잃은 이들이 돌아오다', '갇힌 이들과 병든 이들이 구원을 경험하다', '바다의 폭풍 속에서 선원들이 부르짖다', '다윗이 언약궤를 모시고 시온을 바라보다', '출애굽과 가나안 왕들을 기억하다', '창조부터 포로의 비천함까지 인자를 노래하다', '바벨론 강가에서 예루살렘을 기억하다'].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/psa.json'));assert.equal(added.length,15);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-gen-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,95);
 for(const title of ["동산에서 쫓겨나 생명나무 길이 막히다","하나님과 동행한 에녹이 사라지다","노아가 방주와 생명 보존의 지시를 받다","아브람과 맺은 언약을 표징으로 보이다","광야의 샘에서 하갈을 만나 약속하다","야곱의 가족이 떠나고 라반이 뒤쫓다","애굽에서 다시 만난 야곱과 요셉","야곱이 에브라임과 므낫세를 축복하다","요셉과 형제들이 야곱을 막벨라에 장사하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('exo 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'exo.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-exo-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/exo.json'));assert.equal(added.length,19);
 for(const title of ["십브라와 부아가 왕의 명령을 거역하다","요게벳이 아기를 갈대 상자에 두다","미디안으로 도망한 모세가 십보라와 살다","개구리 떼가 애굽 땅을 덮다","이와 파리 떼 앞에서 바로가 굴복과 거부를 반복하다","애굽의 가축에 돌림병이 퍼지다","우박과 불이 내려 농작물을 치다","메뚜기 떼가 남은 작물을 삼키다","짙은 어둠 속에서 마지막 협상을 거부하다","처음 난 것에 닥칠 마지막 재앙을 알리다","유월절 양과 피의 표징을 준비하다","첫째 재앙 뒤 이스라엘이 애굽을 떠나다","요셉의 뼈를 들고 구름과 불의 인도를 받다","하늘에서 만나와 메추라기를 거두다","여섯째 날의 갑절과 만나 항아리를 보관하다","이드로가 모세에게 재판을 나누라고 권하다","시내 산 앞에서 언약을 받고 산이 진동하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('num 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'num.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-num-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/num.json'));assert.equal(added.length,15);
 for(const title of ["아론이 백성 위에 제사장의 복을 선언하다","시내 광야에서 유월절을 지키다","정탐꾼들이 에스골의 포도송이를 가져오다","모세가 백성의 용서를 간구하다","엘르아살이 붉은 암송아지의 재를 마련하다","새 세대의 수를 세어 땅을 나눌 준비를 하다","슬로브핫의 딸들이 기업을 청하다","르우벤과 갓 자손이 요단 동편 땅을 청하다","광야 여정을 돌아보며 진영을 기록하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});




test('1ki 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ki.json')),added=data.scenes.filter(s=>s.title==='솔로몬이 열두 관장을 세워 나라를 돌보다'),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/1ki.json'));assert.equal(added.length,1);
 for(const title of ["솔로몬이 열두 관장을 세워 나라를 돌보다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});






test('창세기의 창조·가족·귀환 사건을 보강하고 본문 범위와 상징 방식을 연결한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),ids=['ot-gen-extra-1-0','ot-gen-extra-2-0'],objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json')),added=ids.map(id=>data.scenes.find(s=>s.id===id));assert(added.every(Boolean));
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('jos 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jos.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-jos-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/jos.json'));assert.equal(added.length,13);
 for(const title of ["여호수아가 백성을 이끌고 요단을 건널 준비를 하다","여호수아가 기브온을 구하고 남부 연합을 물리치다","여호수아가 북쪽 연합군과 맞서다","악사가 갈렙에게 샘물을 청하다","슬로브핫의 딸들이 기업을 받고 경계를 확인하다","이스라엘이 도피성을 구별하다","여호수아가 장로들에게 언약을 지키라고 당부하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('exo 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'exo.json')),ids=['ot-exo-extra-36-0','ot-exo-extra-37-0'],added=ids.map(id=>data.scenes.find(s=>s.id===id)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/exo.json'));assert(added.every(Boolean));
 for(const title of ["브살렐과 오홀리압이 성막을 만들다","브살렐이 언약궤와 성소 기구를 만들다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('jos 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jos.json')),ids=['ot-jos-extra-12-0','ot-jos-extra-13-0','ot-jos-extra-14-0','ot-jos-extra-16-0','ot-jos-extra-19-0','ot-jos-extra-21-0'],added=ids.map(id=>data.scenes.find(s=>s.id===id)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/jos.json'));assert(added.every(Boolean));
 for(const title of ["요단 동편과 가나안에서 패한 왕들을 기록하다","여호수아가 지파별 땅을 나누기 시작하다","갈렙이 약속받은 헤브론을 요청하다","에브라임 지파의 기업 경계를 정하다","여호수아에게 딤낫 세라를 기업으로 주다","레위 지파가 이스라엘 여러 지파에서 성읍을 받다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('num 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'num.json')),ids=['ot-num-extra-34-0','ot-num-extra-35-0','ot-num-extra-35-1','ot-num-extra-36-0'],added=ids.map(id=>data.scenes.find(s=>s.id===id)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/num.json'));assert(added.every(Boolean));
 for(const title of ["엘르아살과 여호수아가 땅을 나눌 지도자를 세우다","도피성을 세워 실수로 사람을 죽인 이를 보호하다","살인 사건의 재판과 피의 보복 금지를 정하다","슬로브핫의 딸들이 지파의 기업을 지키는 결정을 받다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('num 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'num.json')),added=data.scenes.filter(s=>s.id==='ot-num-extra-15-0'),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/num.json'));assert.equal(added.length,1);
 for(const title of ["안식일에 나무를 한 사람이 모세 앞에 서다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('deu 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'deu.json')),added=data.scenes.filter(s=>s.title==='모세가 죽기 전에 이스라엘 지파들을 축복하다'),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/deu.json'));assert.equal(added.length,1);
 for(const title of ["모세가 죽기 전에 이스라엘 지파들을 축복하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),ids=['ot-gen-extra-11-0','ot-gen-extra-11-1'],added=ids.map(id=>data.scenes.find(s=>s.id===id)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert(added.every(Boolean));
 for(const title of ["시날 평지 사람들이 성과 탑을 쌓다","하나님이 언어를 뒤섞어 사람들을 흩으시다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('lev 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'lev.json')),ids=['ot-lev-extra-6-0','ot-lev-extra-14-0'],added=ids.map(id=>data.scenes.find(s=>s.id===id)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/lev.json'));assert(added.every(Boolean));
 for(const title of ["아론이 제단의 불을 꺼지지 않게 지키다","제사장이 정결해진 사람을 위한 두 새의 예식을 행하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});




test('neh 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'neh.json')),added=data.scenes.filter(s=>s.title==='느헤미야가 총독의 몫을 받지 않고 백성을 먹이다'),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/neh.json'));assert.equal(added.length,1);
 for(const title of ["느헤미야가 총독의 몫을 받지 않고 백성을 먹이다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});










test('열왕기하 후속 장면은 기존 사건과 겹치지 않는 절 범위에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2ki.json')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2ki.json'));
 const expected=[
  ['ot-2ki-extra-23-2','열왕기하 23:29-30','요시야가 므깃도에서 죽고 여호아하스가 왕이 되다'],
  ['ot-2ki-extra-17-1','열왕기하 17:24-41','앗수르가 이주민을 옮기고 사마리아에 혼합 예배가 자리잡다'],
  ['ot-2ki-extra-23-3','열왕기하 23:26-27','요시야의 개혁 뒤에도 심판 선언이 남다'],
  ['ot-2ki-extra-1-0','열왕기하 1:1-8','아하시야가 바알세붑에게 묻고 엘리야의 말을 듣다'],
  ['ot-2ki-extra-1-1','열왕기하 1:13-18','셋째 오십부장이 엘리야에게 자비를 구하다'],
  ['ot-2ki-extra-7-0','열왕기하 7:3-11','네 나병 환자가 비어 있는 아람 진영을 발견하다'],
  ['ot-2ki-extra-7-1','열왕기하 7:12-20','사마리아 백성이 아람 진영에서 양식을 얻다'],
  ['ot-2ki-extra-8-0','열왕기하 8:7-15','하사엘이 벤하닷을 죽이고 아람 왕이 되다'],
  ['ot-2ki-extra-10-0','열왕기하 10:12-28','예후가 바알 신전을 없애고 숭배를 끊다'],
  ['ot-2ki-extra-18-0','열왕기하 18:17-35','랍사게가 예루살렘 백성에게 항복을 요구하다'],
  ['ot-2ki-extra-21-0','열왕기하 21:10-18','선지자들이 므낫세의 죄와 유다의 심판을 전하다'],
  ['ot-2ki-extra-21-1','열왕기하 21:19-26','아몬이 살해되고 요시야가 왕으로 세워지다'],
  ['ot-2ki-extra-24-1','열왕기하 24:1-9','바벨론에 굴복한 여호야김과 첫 침공']
 ];

 const expectedMore=[
  ['열왕기하 3:21-27','모압 왕의 맏아들이 죽고 연합군이 물러나다'],
  ['열왕기하 4:8-17','수넴 여인이 엘리사를 대접하고 아들을 약속받다'],
  ['열왕기하 4:18-28','수넴 여인이 죽은 아들을 안고 엘리사를 찾아가다'],
  ['열왕기하 4:32-37','엘리사가 수넴 여인의 아들을 살리다'],
  ['열왕기하 5:8-19','나아만이 요단에서 씻고 나음을 얻다'],
  ['열왕기하 6:18-23','엘리사가 아람 군대를 사마리아로 이끌다'],
  ['열왕기하 8:16-29','유다의 여호람과 아하시야가 왕위에 오르고 동맹을 맺다'],
  ['열왕기하 10:29-36','예후가 우상숭배를 남긴 채 왕위를 이어가다'],
  ['열왕기하 13:20-25','엘리사의 무덤에서 죽은 사람이 살아나다'],
  ['열왕기하 14:15-22','아마샤가 패하고 예루살렘 성벽이 무너지다'],
  ['열왕기하 14:23-29','여로보암 2세가 북이스라엘 영토를 회복하다'],
  ['열왕기하 15:1-7','아사랴가 오랜 통치를 마치고 왕위를 요담에게 넘기다'],
  ['열왕기하 15:8-16','북이스라엘 왕들이 연이어 살해되고 바뀌다'],
  ['열왕기하 16:5-9','르신과 베가가 예루살렘을 공격하다'],
  ['열왕기하 18:1-8','히스기야가 우상을 없애고 하나님을 의지하다'],
  ['열왕기하 20:1-6','히스기야가 기도하고 생명을 연장받다'],
  ['열왕기하 20:8-11','해 그림자가 뒤로 물러나는 표징을 보이다'],
  ['열왕기하 22:11-20','훌다가 율법책을 들은 요시야에게 심판과 자비를 전하다'],
  ['열왕기하 25:18-26','그달리야가 살해되고 남은 백성이 이집트로 달아나다']
 ];
 for(const [ref,title] of expectedMore){const s=data.scenes.find(x=>x.ref===ref&&x.title===title);assert(s,ref+' '+title);assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}

 for(const [id,ref,title] of expected){const s=data.scenes.find(x=>x.id===id);assert(s,id);assert.equal(s.ref,ref);assert.equal(s.title,title);assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),id);}
});


test('1ki 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ki.json')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/1ki.json'));
 const expected=[['열왕기상 1:1-4','아비삭이 늙은 다윗을 돌보다'],['열왕기상 9:10-14','솔로몬이 히람에게 갈릴리 성읍을 주다'],['열왕기상 9:15-24','솔로몬이 성읍을 세우고 이방인을 노역에 동원하다'],['열왕기상 15:1-8','아비얌이 죽고 아사가 유다 왕이 되다'],['열왕기상 15:25-34','나답이 살해되고 바아사가 북이스라엘 왕이 되다'],['열왕기상 16:1-7','예후가 바아사 집안의 심판을 예고하다'],['열왕기상 17:1','엘리야가 가뭄을 선포하다']];
 for(const [ref,title] of expected){const s=data.scenes.find(x=>x.ref===ref&&x.title===title);assert(s,ref);assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});

test('장별 검수 장면 수가 권별 실제 사건 파일과 일치한다',()=>{
 for(const row of review.chapters){
  const data=JSON.parse(fs.readFileSync(root+row.code+'.json'));
  assert.equal(row.scenes,data.scenes.filter(scene=>scene.chapter===row.chapter).length,`${row.code} ${row.chapter}`);
 }
});


test('1ch 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ch.json')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/1ch.json'));
 const expected=[['역대상 12:19-22','므낫세 지파의 용사들이 다윗에게 합류하다'],['역대상 12:23-37','온 지파의 군대가 다윗을 왕으로 세우러 모이다'],['역대상 16:8-36','다윗과 아삽이 언약궤 앞에서 감사 찬양을 드리다'],['역대상 18:1-8','다윗이 여러 나라를 이기고 영토를 넓히다'],['역대상 21:1-13','다윗이 인구 조사를 명하고 죄를 고백하다']];
 for(const [ref,title] of expected){const s=data.scenes.find(x=>x.ref===ref&&x.title===title);assert(s,ref);assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('2ch 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2ch.json')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2ch.json'));
 const expected=[['역대하 9:5-12','스바 여왕이 솔로몬의 지혜를 인정하고 예물을 주다'],['역대하 9:13-28','솔로몬의 재물과 교역이 크게 늘다'],['역대하 10:1-5','르호보암이 백성의 요구를 듣기 전에 사흘을 기다리다'],['역대하 11:1-4','스마야가 르호보암에게 북쪽 지파와 싸우지 말라 전하다'],['역대하 17:1-6','여호사밧이 유다의 성읍을 다지고 하나님을 찾다'],['역대하 17:11-19','블레셋과 아라비아가 여호사밧에게 예물을 바치다'],['역대하 18:1-11','여호사밧과 아합이 전쟁을 의논하고 거짓 예언을 듣다'],['역대하 21:1-11','여호람이 형제들을 죽이고 유다를 우상숭배로 이끌다'],['역대하 22:5-9','아하시야가 요람과 함께 전쟁에 나갔다가 죽다'],['역대하 24:23-27','아람의 침략 뒤 요아스가 신하들에게 살해되다'],['역대하 26:21-23','나병으로 별궁에 머물던 웃시야가 죽고 요담이 왕이 되다'],['역대하 35:20-27','느고의 경고를 듣지 않은 요시야가 므깃도에서 죽다'],['역대하 36:1-10','여호아하스와 여호야김·여호야긴이 차례로 왕위에서 밀려나다'],['역대하 36:11-14','시드기야가 하나님께 반역하고 성전 지도자들이 죄를 더하다']];
 for(const [ref,title] of expected){const s=data.scenes.find(x=>x.ref===ref&&x.title===title);assert(s,ref);assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('1sa 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1sa.json')),titles=["길갈에서 다시 세워진 왕권","두려워 말고 여호와를 섬기라","블레셋 약탈대의 진출","사울의 변명과 아각의 처분","사울의 의심과 신하들의 침묵","블레셋 진영 앞에서 두려워하는 사울"],added=data.scenes.filter(s=>titles.includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/1sa.json'));assert.equal(added.length,6);
 for(const title of titles)assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('2sa 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2sa.json')),titles=["왕궁의 쇠락과 므비보셋의 사고","왕국의 질서를 세운 다윗","아히도벨의 마지막","압살롬을 살리라는 다윗의 명령","바르실래의 배웅과 귀환을 둘러싼 다툼","아마사의 지체와 요압의 추격","다윗의 마지막 말과 의로운 통치의 이상"],added=data.scenes.filter(s=>titles.includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2sa.json'));assert.equal(added.length,7);
 for(const title of titles)assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('1ki 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ki.json')),titles=["성전 건축을 위한 부역과 준비","성전 내부를 완성하다"],added=data.scenes.filter(s=>titles.includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/1ki.json'));assert.equal(added.length,2);
 for(const title of titles)assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('1ch 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ch.json')),titles=["다윗의 공정한 통치와 왕실 직무자들","아람 군대와의 재대결","레위 가문의 성전 봉사 직무"],added=data.scenes.filter(s=>titles.includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/1ch.json'));assert.equal(added.length,3);
 for(const title of titles)assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('ezr 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'ezr.json')),titles=["귀환을 준비하는 족장과 성전 봉사자들","다리오가 성전 공사를 보호하다"],added=data.scenes.filter(s=>titles.includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/ezr.json'));assert.equal(added.length,2);
 for(const title of titles)assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('est 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'est.json')),titles=["새 왕후를 찾으라는 조서","모르드개의 애도와 에스더의 결단"],added=data.scenes.filter(s=>titles.includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/est.json'));assert.equal(added.length,2);
 for(const title of titles)assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('neh 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'neh.json')),titles=["무너진 성벽 앞에서 애도하다"],added=data.scenes.filter(s=>titles.includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/neh.json'));assert.equal(added.length,1);
 for(const title of titles)assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('job 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'job.json')),titles=["평온했던 욥의 집과 자녀들을 위한 제사"],added=data.scenes.filter(s=>titles.includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/job.json'));assert.equal(added.length,1);
 for(const title of titles)assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});

test('요나 1장의 바다에 던짐과 큰 물고기 장면은 서로 다른 절 범위로 나뉜다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jnh.json')),sailors=data.scenes.find(s=>s.ref==='요나 1:13-16'),fish=data.scenes.find(s=>s.ref==='요나 1:17'),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/jnh.json'));
 assert(sailors);assert(fish);assert.deepEqual(fish.actors,['요나']);assert.equal(fish.object,'fish');assert.equal(fish.animation.motif,'fish-swallow');assert(objects.chapters['1'].some(o=>o.id==='fish'&&o.refs.includes(fish.ref)));
});


test('2sa 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2sa.json')),titles=["그술로 달아난 압살롬과 다윗의 그리움","리스바의 애도와 사울 집안의 장례"],added=data.scenes.filter(s=>titles.includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2sa.json'));assert.equal(added.length,2);
 for(const title of titles)assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('겹쳐 있던 구약 사건 범위를 인접한 장면으로 나누고 원문 절을 보존한다',()=>{
 const groups=[['1sa',[['사무엘상 10:17-24','사무엘상 10:25-27'],['사무엘상 24:3','사무엘상 24:4-7'],['사무엘상 30:1-5','사무엘상 30:6']]],['1ch',[['역대상 29:10-19','역대상 29:20-25']]],['2sa',[['사무엘하 13:23-29','사무엘하 13:30-36','사무엘하 13:37-39'],['사무엘하 21:1-6','사무엘하 21:7-9','사무엘하 21:10-14']]],['2ki',[['열왕기하 2:7-8','열왕기하 2:9-10','열왕기하 2:11-12','열왕기하 2:13-14','열왕기하 2:15-18','열왕기하 2:19-22','열왕기하 2:23-25'],['열왕기하 3:13-14','열왕기하 3:15-17','열왕기하 3:18-20'],['열왕기하 5:20-21','열왕기하 5:22-25','열왕기하 5:26-27'],['열왕기하 6:1-4','열왕기하 6:5-7'],['열왕기하 9:1-6','열왕기하 9:7-10','열왕기하 9:11-13'],['열왕기하 11:4-11','열왕기하 11:12'],['열왕기하 12:4-8','열왕기하 12:9-16'],['열왕기하 13:10-14','열왕기하 13:15-17','열왕기하 13:18-19'],['열왕기하 14:8-10','열왕기하 14:11-14'],['열왕기하 15:17-18','열왕기하 15:19-20','열왕기하 15:21-26'],['열왕기하 16:10-11','열왕기하 16:12-13','열왕기하 16:14-16'],['열왕기하 19:8-13','열왕기하 19:14-19'],['열왕기하 22:8-9','열왕기하 22:10','열왕기하 22:11-20'],['열왕기하 25:8-10','열왕기하 25:11-17']]]];
 for(const [code,sets] of groups){const scenes=JSON.parse(fs.readFileSync(root+code+'.json')).scenes;for(const refs of sets){const ranges=refs.map(ref=>{const s=scenes.find(x=>x.ref===ref);assert(s,code+' '+ref);const m=ref.match(/:(\d+)(?:-(\d+))?/);return [+m[1],+(m[2]||m[1])];}).sort((a,b)=>a[0]-b[0]);for(let i=1;i<ranges.length;i++)assert(ranges[i][0]>ranges[i-1][1],code+' overlap '+refs.join(' / '));}}
});


test('2ki 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2ki.json')),titles=["엘리사를 조롱한 벧엘의 아이들","아침에 골짜기에 가득 찬 물","게하시에게 임한 나병","세 번만 친 왕에게 남은 승리","베가의 반란과 브가히야의 죽음"],added=data.scenes.filter(s=>titles.includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2ki.json'));assert.equal(added.length,5);
 for(const title of ["엘리사를 조롱한 벧엘의 아이들","아침에 골짜기에 가득 찬 물","게하시에게 임한 나병","세 번만 친 왕에게 남은 승리","베가의 반란과 브가히야의 죽음"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('사사기·이사야·아모스의 복합 장면은 인접 범위를 침범하지 않는다',()=>{
 const groups=[['jdg','ot-jdg-extra-14','ot-jdg-extra-15'],['isa','ot-isa-extra-22-0','ot-isa-22-2'],['amo','ot-amo-8-0','ot-amo-extra-8-0'],['amo','ot-amo-extra-9-0','ot-amo-9-1'],['hab','ot-animation-hab-1','ot-hab-extra-2-0'],['nam','ot-nam-extra-1-0','ot-animation-nam-1'],['lam','ot-lam-extra-4-1','ot-lam-4-3']];
 for(const [code,left,right]of groups){const scenes=JSON.parse(fs.readFileSync(root+code+'.json')).scenes,a=scenes.find(s=>s.id===left),b=scenes.find(s=>s.id===right);assert(a);assert(b);assert.equal(a.verseNumbers.at(-1)+1,b.verseNumbers[0]);assert.equal(a.animation.ref,a.ref);assert.equal(b.animation.ref,b.ref);}
 const scene=JSON.parse(fs.readFileSync(root+'jdg.json')).scenes.find(s=>s.id==='ot-jdg-extra-14');assert.equal(scene.animation.lead,'들릴라');
});


test('요엘의 성회 소집과 기도 및 시편의 반역 회고와 다윗 선택은 절을 빠짐없이 연결한다',()=>{
 for(const [code,left,right]of [['jol','ot-jol-1-2','ot-jol-extra-1-1'],['psa','ot-psa-extra-05','ot-psa-78-3']]){const scenes=JSON.parse(fs.readFileSync(root+code+'.json')).scenes,a=scenes.find(s=>s.id===left),b=scenes.find(s=>s.id===right);assert(a);assert(b);assert.equal(a.verseNumbers.at(-1)+1,b.verseNumbers[0]);assert.equal(a.animation.ref,a.ref);assert.equal(b.animation.ref,b.ref);}
});


test('num 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'num.json')),added=data.scenes.filter(s=>["밤새 울며 애굽 귀환을 요구하다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/num.json'));assert.equal(added.length,1);
 for(const title of ["밤새 울며 애굽 귀환을 요구하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('2ch 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2ch.json')),added=data.scenes.filter(s=>["연합군의 침입 소식에 금식을 선포하다","성전의 금 기구와 금 입힌 문을 마련하다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2ch.json'));assert.equal(added.length,2);
 for(const title of ["연합군의 침입 소식에 금식을 선포하다","성전의 금 기구와 금 입힌 문을 마련하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('민수기와 역대하의 분리 장면이 기존 복합 범위의 모든 절을 한 번씩 보존한다',()=>{
 for(const [code,chapter,start,end]of [['num',14,1,25],['2ch',4,1,22],['2ch',20,1,20]]){const scenes=JSON.parse(fs.readFileSync(root+code+'.json')).scenes.filter(s=>s.chapter===chapter&&!s.id.startsWith('ot-voice-')&&s.verseNumbers[0]>=start&&s.verseNumbers.at(-1)<=end);const counts=new Map();for(const scene of scenes)for(const verse of scene.verseNumbers)counts.set(verse,(counts.get(verse)||0)+1);for(let verse=start;verse<=end;verse++)assert.equal(counts.get(verse),1,code+' '+chapter+':'+verse);}
});


test('ecc 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'ecc.json')),added=data.scenes.filter(s=>["억압당하는 가난한 자와 땅의 소산","하나님을 경외하라는 마지막 권면"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/ecc.json'));assert.equal(added.length,2);
 for(const title of ["억압당하는 가난한 자와 땅의 소산","하나님을 경외하라는 마지막 권면"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('zec 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'zec.json')),added=data.scenes.filter(s=>["감람나무의 뜻을 다시 묻다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/zec.json'));assert.equal(added.length,1);
 for(const title of ["감람나무의 뜻을 다시 묻다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});

test('전도서와 스가랴의 분리 장면은 지혜·환상 본문의 전체 범위를 중복 없이 보존한다',()=>{
 for(const [code,chapter,start,end]of [['ecc',5,8,20],['ecc',12,1,14],['zec',4,1,14]]){const scenes=JSON.parse(fs.readFileSync(root+code+'.json')).scenes.filter(s=>s.chapter===chapter&&!s.id.startsWith('ot-voice-')&&s.verseNumbers[0]>=start&&s.verseNumbers.at(-1)<=end);const counts=new Map();for(const scene of scenes){assert(['illustration','vision'].includes(scene.animation.mode));for(const verse of scene.verseNumbers)counts.set(verse,(counts.get(verse)||0)+1);}for(let verse=start;verse<=end;verse++)assert.equal(counts.get(verse),1,code+' '+chapter+':'+verse);}
});


test('zep 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'zep.json')),added=data.scenes.filter(s=>["정결한 입술과 겸손한 남은 자"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/zep.json'));assert.equal(added.length,1);
 for(const title of ["정결한 입술과 겸손한 남은 자"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('oba 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'oba.json')),added=data.scenes.filter(s=>["에돔을 향한 심판의 소식이 전해지다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/oba.json'));assert.equal(added.length,1);
 for(const title of ["에돔을 향한 심판의 소식이 전해지다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('psa 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'psa.json')),added=data.scenes.filter(s=>["애굽에서 번성한 백성이 미움을 받다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/psa.json'));assert.equal(added.length,1);
 for(const title of ["애굽에서 번성한 백성이 미움을 받다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('스바냐·오바댜·시편의 분리 장면은 기존 복합 범위의 절을 모두 보존한다',()=>{for(const [code,ch,start,end]of [['zep',3,9,20],['oba',1,1,9],['psa',105,24,45]]){const scenes=JSON.parse(fs.readFileSync(root+code+'.json')).scenes.filter(s=>s.chapter===ch&&!s.id.startsWith('ot-voice-')&&s.verseNumbers[0]>=start&&s.verseNumbers.at(-1)<=end);const counts=new Map();for(const scene of scenes)for(const verse of scene.verseNumbers)counts.set(verse,(counts.get(verse)||0)+1);for(let verse=start;verse<=end;verse++)assert.equal(counts.get(verse),1,code+' '+ch+':'+verse);}});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["하늘을 두어 물과 물을 나누다","뭍과 바다가 나뉘고 식물이 자라다","광명체가 낮과 밤의 때를 나누다","물속 생물과 하늘의 새가 번성하다","땅의 생물과 사람에게 생명과 책임을 주다","창조를 마치고 안식의 날을 구별하다","땅을 적시는 물과 동산 이야기의 시작"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,7);
 for(const title of ["하늘을 두어 물과 물을 나누다","뭍과 바다가 나뉘고 식물이 자라다","광명체가 낮과 밤의 때를 나누다","물속 생물과 하늘의 새가 번성하다","땅의 생물과 사람에게 생명과 책임을 주다","창조를 마치고 안식의 날을 구별하다","땅을 적시는 물과 동산 이야기의 시작"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('창세기 1–2장의 도입 장면은 모든 절을 연결하고 안식을 수면으로 연출하지 않는다',()=>{const data=JSON.parse(fs.readFileSync(root+'gen.json'));for(const [chapter,end]of [[1,31],[2,25]]){const scenes=data.scenes.filter(s=>s.chapter===chapter&&!s.id.startsWith('ot-voice-'));for(let v=1;v<=end;v++)assert.equal(scenes.filter(s=>s.verseNumbers.includes(v)).length,1,'gen '+chapter+':'+v);}const s=data.scenes.find(s=>s.ref==='창세기 2:1-3');assert.equal(s.animation.mode,'illustration');assert(!s.animation.beats.some(b=>['sleep','lie'].includes(b.action)));});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["뱀의 유혹 뒤 열매를 먹고 몸을 가리다","불순종 뒤 삶의 고통과 죽음이 선고되다","아벨이 죽고 가인이 떠도는 삶을 선고받다","셋이 태어나고 하나님의 이름을 부르다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,4);
 for(const title of ["뱀의 유혹 뒤 열매를 먹고 몸을 가리다","불순종 뒤 삶의 고통과 죽음이 선고되다","아벨이 죽고 가인이 떠도는 삶을 선고받다","셋이 태어나고 하나님의 이름을 부르다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('창세기 3–4장의 유혹·선고·가인의 추방·셋의 출생이 절 누락 없이 연결된다',()=>{const d=JSON.parse(fs.readFileSync(root+'gen.json'));for(const [chapter,end]of [[3,24],[4,26]])for(let v=1;v<=end;v++)assert.equal(d.scenes.filter(s=>s.chapter===chapter&&!s.id.startsWith('ot-voice-')&&s.verseNumbers.includes(v)).length,1,'gen '+chapter+':'+v);assert.deepEqual(d.scenes.find(s=>s.id==='ot-gen-3-1').actors,['아담','하와']);});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["아담에서 야렛까지 이어지는 계보","므두셀라에서 라멕으로 이어지는 세대","노아의 이름에 위로를 기대하다","사람의 번성과 네피림에 관한 기록","폭력의 세상에서 노아가 은혜를 입다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,5);
 for(const title of ["아담에서 야렛까지 이어지는 계보","므두셀라에서 라멕으로 이어지는 세대","노아의 이름에 위로를 기대하다","사람의 번성과 네피림에 관한 기록","폭력의 세상에서 노아가 은혜를 입다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('창세기 5–6장 계보와 홍수 준비는 모든 절을 보존하고 에녹을 회오리로 재현하지 않는다',()=>{const d=JSON.parse(fs.readFileSync(root+'gen.json'));for(const [chapter,end]of [[5,32],[6,22]])for(let v=1;v<=end;v++)assert.equal(d.scenes.filter(s=>s.chapter===chapter&&!s.id.startsWith('ot-voice-')&&s.verseNumbers.includes(v)).length,1,'gen '+chapter+':'+v);const a=d.scenes.find(s=>s.id==='ot-gen-extra-5-0').animation;assert.equal(a.mode,'illustration');assert.notEqual(a.effect,'whirlwind');assert.notEqual(a.setting,'water');});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["가족과 생물이 방주에 들어가다","마른 땅을 확인하고 방주에서 나오다","생명의 존엄과 번성의 책임을 듣다","노아가 아들들에 관한 말을 남기다","에서가 야곱을 달려와 끌어안다","요셉이 정체를 밝히고 형들을 끌어안다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,6);
 for(const title of ["가족과 생물이 방주에 들어가다","마른 땅을 확인하고 방주에서 나오다","생명의 존엄과 번성의 책임을 듣다","노아가 아들들에 관한 말을 남기다","에서가 야곱을 달려와 끌어안다","요셉이 정체를 밝히고 형들을 끌어안다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["목자들의 다툼 뒤 아브람과 롯이 갈라서다","에서가 음식과 장자의 명분을 바꾸다","리브가가 야곱의 변장을 준비하다","에서가 돌아와 잃은 축복을 두고 울다","리브가가 야곱을 피신시키려 하다","라반의 속임 뒤 야곱이 레아와 라헬을 맞다","레아가 아들들의 이름에 마음을 담다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,7);
 for(const title of ["목자들의 다툼 뒤 아브람과 롯이 갈라서다","에서가 음식과 장자의 명분을 바꾸다","리브가가 야곱의 변장을 준비하다","에서가 돌아와 잃은 축복을 두고 울다","리브가가 야곱을 피신시키려 하다","라반의 속임 뒤 야곱이 레아와 라헬을 맞다","레아가 아들들의 이름에 마음을 담다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('창세기 가족 서사의 분리·장자권·축복 갈등·혼인이 빠짐없이 이어진다',()=>{const d=JSON.parse(fs.readFileSync(root+'gen.json'));for(const [chapter,start,end]of [[13,1,18],[25,19,34],[27,1,46],[29,1,35]])for(let v=start;v<=end;v++)assert.equal(d.scenes.filter(s=>s.chapter===chapter&&!s.id.startsWith('ot-voice-')&&s.verseNumbers.includes(v)).length,1,'gen '+chapter+':'+v);});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["요셉이 관원장들의 근심을 묻고 꿈을 듣다","꿈의 해석이 이루어져도 요셉은 잊히다","요셉이 풍년과 흉년을 해석하고 비축을 제안하다","유다가 베냐민 대신 종으로 남겠다고 간청하다","야곱이 브엘세바에서 약속을 듣고 애굽으로 떠나다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,5);
 for(const title of ["요셉이 관원장들의 근심을 묻고 꿈을 듣다","꿈의 해석이 이루어져도 요셉은 잊히다","요셉이 풍년과 흉년을 해석하고 비축을 제안하다","유다가 베냐민 대신 종으로 남겠다고 간청하다","야곱이 브엘세바에서 약속을 듣고 애굽으로 떠나다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('요셉의 꿈 해석과 유다의 간청이 기존 장면 사이에 누락 없이 이어진다',()=>{const d=JSON.parse(fs.readFileSync(root+'gen.json'));for(const [chapter,end]of [[40,23],[41,57],[44,34]])for(let v=1;v<=end;v++)assert.equal(d.scenes.filter(s=>s.chapter===chapter&&!s.id.startsWith('ot-voice-')&&s.verseNumbers.includes(v)).length,1,'gen '+chapter+':'+v);const a=d.scenes.find(s=>s.ref==='창세기 44:18-34');assert.equal(a.animation.lead,'유다');assert.equal(a.animation.target,'요셉');});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["노아의 아들들에게서 여러 민족이 퍼지다", "셈의 계보가 데라와 아브람에게 이어지다", "기근 속에 사래를 누이라고 말하다", "전쟁 중 롯이 사로잡히고 아브람이 뒤쫓다", "아브람이 소돔 왕의 재물을 사양하다", "아브람이 아브라함으로 불리고 언약을 듣다", "언약의 표로 할례를 명하시다", "사라의 아들과 이스마엘의 복을 약속하다", "아브라함이 소돔을 위해 거듭 간구하다", "에서의 후손과 에돔의 족장들을 기록하다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,10);
 for(const title of ["노아의 아들들에게서 여러 민족이 퍼지다","셈의 계보가 데라와 아브람에게 이어지다","기근 속에 사래를 누이라고 말하다","전쟁 중 롯이 사로잡히고 아브람이 뒤쫓다","아브람이 소돔 왕의 재물을 사양하다","아브람이 아브라함으로 불리고 언약을 듣다","언약의 표로 할례를 명하시다","사라의 아들과 이스마엘의 복을 약속하다","아브라함이 소돔을 위해 거듭 간구하다","에서의 후손과 에돔의 족장들을 기록하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["롯과 가족이 소돔을 떠나 소알로 피하다", "롯의 딸들이 모압과 암몬의 조상이 되다", "아비멜렉이 꿈에서 경고를 듣고 사라를 돌려보내다",  "약속의 아들 이삭이 태어나 사라가 웃다", "약속을 다시 듣고 나홀의 집안 소식을 받다", "사라를 막벨라에 장사하고 매장지를 확정하다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,6);
 for(const title of ["롯과 가족이 소돔을 떠나 소알로 피하다","롯의 딸들이 모압과 암몬의 조상이 되다","아비멜렉이 꿈에서 경고를 듣고 사라를 돌려보내다","약속의 아들 이삭이 태어나 사라가 웃다","약속을 다시 듣고 나홀의 집안 소식을 받다","사라를 막벨라에 장사하고 매장지를 확정하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["이스마엘의 열두 지도자와 계보", "흉년 속 이삭이 그랄에 머물라는 약속을 듣다", "야곱이 길을 지켜 주시면 섬기겠다고 서원하다", "합환채를 두고 레아와 라헬이 흥정하다", "야곱이 라헬과 레아의 동의를 얻어 고향으로 떠나다", "야곱이 에서의 귀환 소식을 듣고 두려워하다", "야곱이 밤새 씨름하고 이스라엘이라는 이름을 받다", "디나의 피해 뒤 하몰과 세겜이 혼인을 요구하다", "시므온과 레위의 보복 뒤 야곱이 아들들을 책망하다", "라헬이 베냐민을 낳고 죽어 야곱이 묘비를 세우다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,10);
 for(const title of ["이스마엘의 열두 지도자와 계보","흉년 속 이삭이 그랄에 머물라는 약속을 듣다","야곱이 길을 지켜 주시면 섬기겠다고 서원하다","합환채를 두고 레아와 라헬이 흥정하다","야곱이 라헬과 레아의 동의를 얻어 고향으로 떠나다","야곱이 에서의 귀환 소식을 듣고 두려워하다","야곱이 밤새 씨름하고 이스라엘이라는 이름을 받다","디나의 피해 뒤 하몰과 세겜이 혼인을 요구하다","시므온과 레위의 보복 뒤 야곱이 아들들을 책망하다","라헬이 베냐민을 낳고 죽어 야곱이 묘비를 세우다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["요셉이 형들을 시험하고 시므온을 남기다", "돌아온 형들이 자루의 돈과 야곱의 걱정을 전하다", "유다가 베냐민의 안전을 책임지고 출발을 설득하다", "요셉이 형제들을 맞아 베냐민과 식탁을 나누다", "야곱이 요셉의 생존 소식에 기운을 되찾다", "야곱의 가족이 바로에게 인사하고 고센에 정착하다", "요셉이 기근 중 종자와 세금 규정을 세우다", "야곱이 요셉에게 조상 묘지에 묻히겠다는 맹세를 받다", "야곱이 르우벤·시므온·레위와 유다의 앞날을 말하다", "야곱이 아들들을 축복하고 조상 묘지에 묻히길 부탁하다"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,10);
 for(const title of ["요셉이 형들을 시험하고 시므온을 남기다","돌아온 형들이 자루의 돈과 야곱의 걱정을 전하다","유다가 베냐민의 안전을 책임지고 출발을 설득하다","요셉이 형제들을 맞아 베냐민과 식탁을 나누다","야곱이 요셉의 생존 소식에 기운을 되찾다","야곱의 가족이 바로에게 인사하고 고센에 정착하다","요셉이 기근 중 종자와 세금 규정을 세우다","야곱이 요셉에게 조상 묘지에 묻히겠다는 맹세를 받다","야곱이 르우벤·시므온·레위와 유다의 앞날을 말하다","야곱이 아들들을 축복하고 조상 묘지에 묻히길 부탁하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>["세 방문객이 소돔을 향하고 아브라함이 배웅하다", "유다의 집안에 아들들이 태어나고 다말이 기다리다", "다말이 증거를 내보이고 쌍둥이를 낳다", "야곱의 아들들과 손자들이 애굽으로 내려간 명단"].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,4);
 for(const title of ["세 방문객이 소돔을 향하고 아브라함이 배웅하다","유다의 집안에 아들들이 태어나고 다말이 기다리다","다말이 증거를 내보이고 쌍둥이를 낳다","야곱의 아들들과 손자들이 애굽으로 내려간 명단"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>['사라를 막벨라에 장사하고 매장지를 확정하다'].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,1);
 for(const title of ["사라를 막벨라에 장사하고 매장지를 확정하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>['사라를 애도하고 매장할 땅을 요청하다','감옥에서도 요셉에게 일을 맡기다'].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,2);
 for(const title of ["사라를 애도하고 매장할 땅을 요청하다","감옥에서도 요셉에게 일을 맡기다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>['라반이 야곱의 장막들을 수색하다','야곱이 라반에게 지난 수고를 항변하다','야곱과 라반이 돌무더기 앞에서 경계를 약속하다','라반이 딸들과 손자들에게 작별을 고하다'].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,4);
 for(const title of ["라반이 야곱의 장막들을 수색하다","야곱이 라반에게 지난 수고를 항변하다","야곱과 라반이 돌무더기 앞에서 경계를 약속하다","라반이 딸들과 손자들에게 작별을 고하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});
