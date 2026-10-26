import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {OBJECT_CATALOG} from '../js/features/pixel-bible/object-catalog.js';import {buildWorldModel} from '../js/features/pixel-bible/world.js';import {scopeChapterSummary} from '../js/features/pixel-bible/qt-scope.js';import {objectLinesFor} from '../js/features/pixel-bible/object-scenes.js';
const root='data/pixel-bible/events/',review=JSON.parse(fs.readFileSync(root+'review.json'));
test('구약 39권 929장의 대조 기록과 권별 장면·추가 언급이 유효하다',()=>{assert.equal(review.books.length,39);assert.equal(review.chapters.length,929);assert.equal(review.books.find(b=>b.code==='jdg').scenes,50);const ids=new Set();let scenes=0;for(const book of review.books){const data=JSON.parse(fs.readFileSync(root+book.code+'.json'));const summary=JSON.parse(fs.readFileSync('data/summary/'+book.code+'.json'));for(const s of data.scenes){assert(!ids.has(s.id));ids.add(s.id);scenes++;assert(OBJECT_CATALOG[s.object],s.object);assert(s.actors.length>0&&s.actors.length<=4);assert(s.verseNumbers.length>0);const people=summary.chapters[s.chapter].people;for(const actor of s.actors)assert(people.some(p=>p.name===actor),s.id+actor);if(s.narrationOnly)assert.equal(Object.keys(s.actorLines).length,0);else for(const [actor,lines]of Object.entries(s.actorLines)){assert.deepEqual(objectLinesFor(s,actor),lines);assert(lines.every(l=>l.length<=100));}}for(const [ch,people]of Object.entries(data.additionalPeople)){assert(summary.chapters[ch]);for(const p of people){assert(p.mentionVerses.length);assert(!summary.chapters[ch].people.some(x=>x.name===p.name));}}}assert(scenes>=600);});
test('구약 사건 검수는 배우·소품 근거를 분리하고 원문 절 누락을 다른 역본과 구분한다',()=>{
 const c=review.coverageSummary;assert.equal(c.eventsReviewed,3533);assert.equal(c.sourceMatchedSceneCandidates,710);assert.equal(c.scenesInFiles,1005);assert.equal(c.curatedSupplementalScenes,291);assert.equal(review.curatedSceneReview.books.reduce((n,b)=>n+b.scenesAdded,0),291);assert.equal(c.classification['source-confirmed-actor-and-object'],667);assert.equal(c.classification['source-confirmed-actor-only'],1000);assert.equal(c.classification['source-confirmed-object-only'],629);assert.equal(c.classification['no-source-confirmed-actor-or-object'],1227);assert.equal(c.classification['source-edition-gap'],9);assert.equal(c.classification['referenced-person-not-scene-actor'],1);assert(!JSON.parse(fs.readFileSync(root+'deu.json')).scenes.some(s=>s.id==='ot-deu-23-0'));const omitted=review.chapters.flatMap(ch=>ch.skipped.filter(s=>s.reason==='referenced-person-not-scene-actor'));assert.equal(omitted.length,1);assert.equal(omitted[0].actor,'발람');
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

test('역대하의 성전 봉헌·왕권 위기·개혁과 포로 전후 사건의 누락을 장면으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2ch.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-2ch-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2ch.json'));assert.equal(added.length,37);
 for(const title of ['지혜와 지식을 구한 솔로몬','모리아산에 세워지는 성전','언약궤를 성전으로 모시다','미가야가 아합의 전쟁을 경고하다','예후의 책망 뒤 재판관을 세우다','닫힌 성전 문을 열고 정결하게 하다','예루살렘 함락과 포로 생활'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);assert(s.verseNumbers.length>0);}
});

test('에스라의 귀환·재건·율법 교육·공동체 회복에서 빠진 사건을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'ezr.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-ezr-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/ezr.json'));assert.equal(added.length,11);
 for(const title of ['귀환자들이 집안별로 예루살렘에 모이다','기초 앞에서 터진 울음과 함성','닷드내가 재건 이유를 묻다','율법을 연구하고 가르치려는 에스라','큰비 속에 모여 결단한 회중'])assert(added.some(s=>s.title===title),title);
 for(const s of added)assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);const prayer=data.scenes.find(s=>s.id==='ot-voice-30');assert.equal(prayer.ref,'에스라 9:5-15');assert.equal(prayer.verseNumbers.length,11);
});

test('느헤미야의 성벽 재건·공동체 회복·예배 개혁에서 빠진 핵심 사건을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'neh.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-neh-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/neh.json'));assert.equal(added.length,17);
 for(const title of ['왕이 허락한 예루살렘 재건','밤중에 무너진 성벽을 살피다','한 손으로 일하고 한 손으로 지키다','빚으로 땅과 자녀를 잃는 백성','초막절을 함께 지키는 기쁨','금식하며 죄를 고백하는 회중','안식일에 닫아 건 성문'])assert(added.some(s=>s.title===title),title);
 for(const s of added)assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);const prayer=data.scenes.find(s=>s.id==='ot-neh-1-2');assert.equal(prayer.ref,'느헤미야 1:5-11');
});

test('에스더서의 왕후 교체·하만의 음모·중재·부림절 제정에서 빠진 사건을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'est.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-est-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/est.json'));assert.equal(added.length,14);
 for(const title of ['수산 궁의 잔치와 와스디의 거절','왕후로 선택된 에스더','모르드개가 왕을 해치려는 음모를 알리다','왕의 기록을 읽고 모르드개의 공을 찾다','에스더가 민족을 위해 간청하다','쉬는 날과 부림절을 정하다'])assert(added.some(s=>s.title===title),title);
 for(const s of added)assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);
});

test('욥기의 논쟁·엘리후의 답변·폭풍 속 질문과 회복을 상징 장면으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'job.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-job-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/job.json'));assert.equal(added.length,28);
 for(const title of ['재앙 뒤에도 하나님을 예배한 욥','일곱 날을 말없이 함께한 세 친구','엘리바스의 충고와 욥의 응답','대속자가 살아 계시리라는 욥의 희망','자신의 삶을 내놓는 욥의 맹세','폭풍 속에서 욥에게 물으시는 하나님','친구들을 위해 기도한 욥','회복된 욥과 다시 이어진 가족의 삶'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);assert(s.narrationOnly);}
 assert(added.filter(s=>[38,40].includes(s.chapter)).every(s=>!s.actors.includes('하나님')));
});

test('시편의 출애굽·광야·다윗 언약 회고를 사건과 시적 상징으로 나눠 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'psa.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-psa-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/psa.json'));assert.equal(added.length,12);
 for(const title of ['구원하신 하나님을 노래한 다윗','무너진 성소를 바라보는 아삽의 탄식','앞서 애굽으로 보내진 요셉','모세와 아론을 통한 출애굽과 광야의 돌보심','출애굽 때 바다와 요단이 물러서다'])assert(added.some(s=>s.title===title),title);
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
