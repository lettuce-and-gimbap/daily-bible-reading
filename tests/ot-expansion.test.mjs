import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {OBJECT_CATALOG} from '../js/features/pixel-bible/object-catalog.js';import {buildWorldModel} from '../js/features/pixel-bible/world.js';import {scopeChapterSummary} from '../js/features/pixel-bible/qt-scope.js';import {objectLinesFor} from '../js/features/pixel-bible/object-scenes.js';
const root='data/pixel-bible/events/',review=JSON.parse(fs.readFileSync(root+'review.json'));
test('구약 39권 929장의 대조 기록과 권별 장면·추가 언급이 유효하다',()=>{assert.equal(review.books.length,39);assert.equal(review.chapters.length,929);assert.equal(review.books.find(b=>b.code==='jdg').scenes,50);const ids=new Set();let scenes=0;for(const book of review.books){const data=JSON.parse(fs.readFileSync(root+book.code+'.json'));const summary=JSON.parse(fs.readFileSync('data/summary/'+book.code+'.json'));for(const s of data.scenes){assert(!ids.has(s.id));ids.add(s.id);scenes++;assert(OBJECT_CATALOG[s.object],s.object);assert(s.actors.length>0&&s.actors.length<=4);assert(s.verseNumbers.length>0);const people=summary.chapters[s.chapter].people;for(const actor of s.actors)assert(people.some(p=>p.name===actor),s.id+actor);if(s.narrationOnly)assert.equal(Object.keys(s.actorLines).length,0);else for(const [actor,lines]of Object.entries(s.actorLines)){assert.deepEqual(objectLinesFor(s,actor),lines);assert(lines.every(l=>l.length<=100));}}for(const [ch,people]of Object.entries(data.additionalPeople)){assert(summary.chapters[ch]);for(const p of people){assert(p.mentionVerses.length);assert(!summary.chapters[ch].people.some(x=>x.name===p.name));}}}assert(scenes>=600);});
test('구약 사건 검수는 배우·소품 근거를 분리하고 원문 절 누락을 다른 역본과 구분한다',()=>{
 const c=review.coverageSummary;assert.equal(c.eventsReviewed,3533);assert.equal(c.sourceMatchedSceneCandidates,710);assert.equal(c.scenesInFiles,1275);assert.equal(c.curatedSupplementalScenes,561);assert.equal(review.curatedSceneReview.books.reduce((n,b)=>n+b.scenesAdded,0),561);assert.equal(c.classification['source-confirmed-actor-and-object'],667);assert.equal(c.classification['source-confirmed-actor-only'],1000);assert.equal(c.classification['source-confirmed-object-only'],629);assert.equal(c.classification['no-source-confirmed-actor-or-object'],1227);assert.equal(c.classification['source-edition-gap'],9);assert.equal(c.classification['referenced-person-not-scene-actor'],1);assert(!JSON.parse(fs.readFileSync(root+'deu.json')).scenes.some(s=>s.id==='ot-deu-23-0'));const omitted=review.chapters.flatMap(ch=>ch.skipped.filter(s=>s.reason==='referenced-person-not-scene-actor'));assert.equal(omitted.length,1);assert.equal(omitted[0].actor,'발람');
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
 const data=JSON.parse(fs.readFileSync(root+'2sa.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-2sa-extra-'));assert.equal(added.length,27);
 for(const title of ['시온 산성을 차지한 다윗','다윗의 왕위를 잇는 약속','왕의 권력 아래 놓인 밧세바','압살롬의 반역과 다윗의 피신','압살롬의 죽음을 듣고 우는 다윗','기브온의 요구와 리스바의 애곡'])assert(added.some(s=>s.title===title),title);
 const scene=data.scenes.find(s=>s.id==='ot-voice-20');assert.equal(scene.ref,'사무엘하 9:1-13');assert.deepEqual(scene.actors,['다윗','므비보셋']);assert.equal(Object.keys(scene.actorLines).length,2);
});

test('열왕기상에 빠진 왕위 위기·지혜 재판·예언 사건과 엘리야·엘리사 상호 장면을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ki.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-1ki-extra-'));assert.equal(added.length,30);
 for(const title of ['아도니야의 왕위 찬탈 시도','아이의 어머니를 가려낸 재판','벧엘과 단의 금송아지','과부의 아들이 살아나다','나봇의 포도원을 거절함','미가야가 본 전쟁의 환상'])assert(added.some(s=>s.title===title),title);
 const scene=data.scenes.find(s=>s.id==='ot-voice-22');assert.deepEqual(scene.actors,['엘리야','엘리사']);assert.equal(Object.keys(scene.actorLines).length,2);assert(OBJECT_CATALOG.idol);
});

test('역대상의 빠진 왕권·전쟁·예배 조직 사건과 중요한 계보 흐름을 장면으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ch.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-1ch-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/1ch.json'));assert.equal(added.length,30);
 for(const title of ['야베스의 기도','다윗과 요압이 시온 산성을 차지하다','웃사가 언약궤에 손을 뻗다','미갈이 다윗의 춤을 업신여기다','예루살렘 위에서 멈춘 심판의 칼','제사장 반열을 제비로 정하다','솔로몬이 온 이스라엘 앞에서 왕이 되다'])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);assert(s.verseNumbers.length>0);}
});

test('역대하의 성전 봉헌·왕권 위기·개혁과 포로 전후 사건의 누락을 장면으로 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2ch.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-2ch-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2ch.json'));assert.equal(added.length,45);
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
 const data=JSON.parse(fs.readFileSync(root+'psa.json')),added=data.scenes.filter(s=>['구원하신 하나님을 노래한 다윗' ,'광야의 행진과 성소로 향하는 찬양' ,'무너진 성소를 바라보는 아삽의 탄식' ,'광야에서 반복된 불신과 돌보심' ,'거듭된 반역과 다윗을 택하심' ,'다윗과 맺은 왕위의 언약' ,'땅에 던져진 왕관을 탄식하다' ,'앞서 애굽으로 보내진 요셉' ,'모세와 아론을 통한 출애굽과 광야의 돌보심' ,'홍해 앞의 불신과 모세의 중보' ,'가나안에서의 반역과 비느하스의 개입' ,'출애굽 때 바다와 요단이 물러서다'].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/psa.json'));assert.equal(added.length,12);
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
 for(const title of ["메뚜기 재앙에 농부와 포도원 일꾼이 탄식하다","제사장과 백성이 성회로 모이다","나팔을 불어 여호와의 날을 알리다","돌아온 백성에게 햇수의 회복을 약속하다","모든 사람에게 영을 부으시리라 약속하다","열국을 심판하고 백성의 피난처가 되다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('amo 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'amo.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-amo-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/amo.json'));assert.equal(added.length,11);
 for(const title of ["다메섹과 가사에 대한 심판 선언","사자의 포효처럼 임박한 말씀을 전하다","거듭된 재앙에도 돌아오지 않은 백성","악을 버리고 성문에서 정의를 세우라","정의를 물처럼 흐르게 하라고 외치다","상아 침상에 누운 지도자들을 꾸짖다","메뚜기와 불의 환상 뒤에 긍휼을 구하다","다림줄 환상과 벧엘의 제사장 아마샤","저울을 속이는 상인과 말씀의 기근","무너지는 제단의 환상과 흩어짐","다윗의 무너진 장막을 다시 세우다"])assert(added.some(s=>s.title===title),title);
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
 const data=JSON.parse(fs.readFileSync(root+'oba.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-oba-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/oba.json'));assert.equal(added.length,4);
 for(const title of ["에돔의 요새와 교만을 낮추다","형제의 재난을 외면한 에돔을 책망하다","모든 민족에게 행한 대로 돌아오다","시온에서 구원자들이 다스리다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('nam 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'nam.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-nam-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/nam.json'));assert.equal(added.length,5);
 for(const title of ["니느웨의 요새가 무너지리라 경고하다","유다의 멍에를 꺾고 평화를 알리다","니느웨 성을 향해 진군하는 군대","사자의 굴이 비게 되리라","피의 성 니느웨의 몰락을 애도하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('hab 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'hab.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-hab-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/hab.json'));assert.equal(added.length,6);
 for(const title of ["폭력이 그치지 않는 현실을 묻다","갈대아의 위협을 이해할 수 없어 묻다","성루에서 답을 기다리다","탐욕과 폭력에 대한 다섯 경고","진노 중에도 긍휼을 구하는 기도","그럴지라도 주 안에서 기뻐하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('zep 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'zep.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-zep-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/zep.json'));assert.equal(added.length,6);
 for(const title of ["우상 숭배와 안일한 지도자들을 깨우다","여호와의 큰 날을 앞두고 찾으라","겸손과 공의를 구하라고 부르다","주변 민족의 교만을 낮추다","패역한 성과 타락한 지도자들을 책망하다","곤고한 남은 자를 모으고 명성을 주다"])assert(added.some(s=>s.title===title),title);
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
 const data=JSON.parse(fs.readFileSync(root+'zec.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-zec-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/zec.json'));assert.equal(added.length,16);
 for(const title of ["말 탄 이들이 땅의 형편을 보고하다","네 뿔과 네 대장장이의 환상","바벨론을 떠나 시온으로 나오라 하다","더러운 옷을 벗고 새 옷을 입은 여호수아","순금 등잔대와 두 감람나무의 환상","날아가는 두루마리와 저주의 환상","에바에 담겨 시날로 옮겨지는 악","네 병거가 사방으로 나가다","금식이 누구를 위한 것인지 묻다","노인과 아이들이 함께 사는 예루살렘","겸손한 왕이 나귀를 타고 오다","목자 없는 양 떼를 모으다","은총과 연합의 막대기를 꺾다","찔린 이를 바라보며 애통하다","죄와 더러움을 씻는 샘을 열다","감람산과 생수의 날을 그리다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('deu 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'deu.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-deu-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/deu.json'));assert.equal(added.length,16);
 for(const title of ["정탐꾼의 보고와 백성의 두려움을 회고하다","뒤늦은 출정이 실패하다","시혼의 땅을 지나 정복하다","옥의 바산을 차지하고 땅을 나누다","호렙에서 받은 말씀을 다음 세대에 전하다","백성이 두려워 중재를 부탁하다","금송아지 앞에서 돌판을 깨고 중보하다","새 돌판과 언약궤를 마련하다","율법을 돌에 기록하고 에발 산에 제단을 세우다","모압에서 언약을 새롭게 하다","생명과 죽음 앞에서 생명을 택하라 하다","여호수아를 후계자로 세우다","칠 년마다 율법을 낭독하라 명하다","모세가 노래를 전하고 백성에게 기억시키다","비스가 산에서 땅을 바라보고 모세가 죽다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('ecc 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'ecc.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-ecc-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/ecc.json'));assert.equal(added.length,9);
 for(const title of ["즐거움과 큰일을 시험한 전도자","때를 따라 일하시는 일을 바라보다","학대받는 이의 눈물과 홀로 있는 사람","지혜로운 소년과 늙고 둔한 왕","재물이 있어도 누리지 못하는 부자","악인이 오래 사는 현실과 늦은 심판을 보다","가난한 지혜자가 큰 성을 구하다","아침에 씨를 뿌리고 저녁에도 손을 거두지 않다","늙음의 비유를 지나 창조주를 기억하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('lev 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'lev.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-lev-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/lev.json'));assert.equal(added.length,7);
 for(const title of ["번제 제물을 드리는 절차를 가르치다","속죄일에 두 염소를 세우다","하나님의 이름을 모독한 사건을 판결하다","순종의 복과 불순종의 결과를 경고하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('시편 표제의 역사적 배경과 포로·회복 노래의 사건을 보강한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'psa.json')),added=data.scenes.filter(s=>['아비멜렉 앞에서 미친 체한 다윗의 노래', '도엑의 고발과 아히멜렉의 죽음을 탄식하다', '십 사람들이 사울에게 밀고한 뒤 드린 기도', '가드에서 붙잡힌 다윗의 두려움과 신뢰', '굴에 숨어 아침을 기다리는 다윗', '집을 지키는 사울의 사람들을 피해 기도하다', '에돔과의 전쟁 가운데 도움을 구하다', '유다 광야에서 하나님을 찾는 다윗', '광야에서 길을 잃은 이들이 돌아오다', '갇힌 이들과 병든 이들이 구원을 경험하다', '바다의 폭풍 속에서 선원들이 부르짖다', '다윗이 언약궤를 모시고 시온을 바라보다', '출애굽과 가나안 왕들을 기억하다', '창조부터 포로의 비천함까지 인자를 노래하다', '바벨론 강가에서 예루살렘을 기억하다'].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/psa.json'));assert.equal(added.length,15);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('gen 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-gen-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json'));assert.equal(added.length,20);
 for(const title of ["동산에서 쫓겨나 생명나무 길이 막히다","하나님과 동행한 에녹이 사라지다","폭력으로 가득한 세상에서 노아가 은혜를 입다","아브람과 맺은 언약을 표징으로 보이다","광야의 샘에서 하갈을 만나 약속하다","라헬이 드라빔을 숨기고 야곱이 라반과 언약하다","애굽에서 다시 만난 야곱과 요셉","야곱이 에브라임과 므낫세를 축복하다","요셉이 형들을 용서하고 야곱을 장사하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('exo 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'exo.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-exo-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/exo.json'));assert.equal(added.length,27);
 for(const title of ["십브라와 부아가 왕의 명령을 거역하다","요게벳이 아기를 갈대 상자에 두다","미디안으로 도망한 모세가 십보라와 살다","개구리 떼가 애굽 땅을 덮다","이와 파리 떼 앞에서 바로가 굴복과 거부를 반복하다","애굽의 가축에 돌림병이 퍼지다","우박과 불이 내려 농작물을 치다","메뚜기 떼가 남은 작물을 삼키다","짙은 어둠 속에서 마지막 협상을 거부하다","처음 난 것에 닥칠 마지막 재앙을 알리다","유월절 양과 피의 표징을 준비하다","첫째 재앙 뒤 이스라엘이 애굽을 떠나다","요셉의 뼈를 들고 구름과 불의 인도를 받다","하늘에서 만나와 메추라기를 거두다","여섯째 날의 갑절과 만나 항아리를 보관하다","이드로가 모세에게 재판을 나누라고 권하다","시내 산 앞에서 언약을 받고 산이 진동하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('num 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'num.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-num-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/num.json'));assert.equal(added.length,14);
 for(const title of ["아론이 백성 위에 제사장의 복을 선언하다","시내 광야에서 유월절을 지키다","정탐꾼들이 에스골의 포도송이를 가져오다","모세와 아론이 엎드려 백성을 위해 간구하다","엘르아살이 붉은 암송아지의 재를 마련하다","새 세대의 수를 세어 땅을 나눌 준비를 하다","슬로브핫의 딸들이 기업을 청하다","르우벤과 갓 자손이 요단 동편 땅을 청하다","광야 여정을 돌아보며 진영을 기록하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('2sa 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2sa.json')),added=data.scenes.filter(s=>s.title==='므비보셋을 왕의 식탁에 초대하다'),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2sa.json'));assert.equal(added.length,1);
 for(const title of ["므비보셋을 왕의 식탁에 초대하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('1ki 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'1ki.json')),added=data.scenes.filter(s=>s.title==='솔로몬이 열두 관장을 세워 나라를 돌보다'),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/1ki.json'));assert.equal(added.length,1);
 for(const title of ["솔로몬이 열두 관장을 세워 나라를 돌보다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('2ki 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2ki.json')),added=data.scenes.filter(s=>['사마리아가 함락되고 백성이 앗수르로 끌려가다','요시야가 우상 숭배의 흔적을 없애다','요시야가 유월절을 회복하다','바벨론이 예루살렘을 포위하고 사람들을 사로잡다'].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2ki.json'));assert.equal(added.length,4);
 for(const title of ["사마리아가 함락되고 백성이 앗수르로 끌려가다","요시야가 우상 숭배의 흔적을 없애다","요시야가 유월절을 회복하다","바벨론이 예루살렘을 포위하고 사람들을 사로잡다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('2ch 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'2ch.json')),added=data.scenes.filter(s=>['성전 봉헌 중 하늘의 불과 영광이 나타나다','미가야가 아합의 패전을 경고하다','여호사밧이 성읍마다 재판관을 세우다','엘리야가 여호람에게 심판의 편지를 보내다','히스기야가 성전을 정결하게 하고 예배를 다시 열다','백성이 십일조와 예물을 넉넉히 가져오다','온 유다가 요시야의 유월절을 지키다','요시야가 므깃도 전투에서 치명상을 입다'].includes(s.title)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/2ch.json'));assert.equal(added.length,8);
 for(const title of ["성전 봉헌 중 하늘의 불과 영광이 나타나다","미가야가 아합의 패전을 경고하다","여호사밧이 성읍마다 재판관을 세우다","엘리야가 여호람에게 심판의 편지를 보내다","히스기야가 성전을 정결하게 하고 예배를 다시 열다","백성이 십일조와 예물을 넉넉히 가져오다","온 유다가 요시야의 유월절을 지키다","요시야가 므깃도 전투에서 치명상을 입다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('창세기의 창조·가족·귀환 사건을 보강하고 본문 범위와 상징 방식을 연결한다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'gen.json')),ids=['ot-gen-extra-1-0','ot-gen-extra-2-0','ot-gen-extra-6-1','ot-gen-extra-16-1','ot-gen-extra-31-1','ot-gen-extra-46-1','ot-gen-extra-48-1','ot-gen-extra-50-1','ot-gen-extra-50-2'],objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/gen.json')),added=ids.map(id=>data.scenes.find(s=>s.id===id));assert(added.every(Boolean));
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('jos 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'jos.json')),added=data.scenes.filter(s=>s.id.startsWith('ot-jos-extra-')),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/jos.json'));assert.equal(added.length,13);
 for(const title of ["여호수아가 백성을 이끌고 요단을 건널 준비를 하다","여호수아가 기브온을 구하고 남부 연합을 물리치다","여호수아가 북쪽 연합군과 맞서다","악사가 갈렙에게 샘물을 청하다","슬로브핫의 딸들이 기업을 받고 경계를 확인하다","이스라엘이 도피성을 구별하다","여호수아가 장로들에게 언약을 지키라고 당부하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});


test('exo 보강 장면이 누락 사건을 다루고 본문 범위·표상 방식에 연결된다',()=>{
 const data=JSON.parse(fs.readFileSync(root+'exo.json')),ids=['ot-exo-extra-1-1','ot-exo-extra-2-2','ot-exo-extra-8-2','ot-exo-extra-9-2','ot-exo-extra-10-2','ot-exo-extra-12-2','ot-exo-extra-16-2','ot-exo-extra-18-1','ot-exo-extra-36-0','ot-exo-extra-37-0'],added=ids.map(id=>data.scenes.find(s=>s.id===id)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/exo.json'));assert(added.every(Boolean));
 for(const title of ["히브리 산파들이 바로의 명령을 거슬러 생명을 지키다","모세가 나일 강에서 건져져 미디안으로 피하다","모세와 아론이 개구리 재앙을 알리다","우박이 애굽 땅을 치고 바로가 다시 거역하다","메뚜기 떼가 애굽의 남은 작물을 먹어 치우다","이스라엘이 유월절을 지키고 애굽을 떠나다","백성이 만나와 메추라기를 받아 먹다","이드로가 모세에게 재판 업무를 나누라고 권하다","브살렐과 오홀리압이 성막을 만들다","브살렐이 언약궤와 성소 기구를 만들다"])assert(added.some(s=>s.title===title),title);
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
 const data=JSON.parse(fs.readFileSync(root+'lev.json')),ids=['ot-lev-extra-6-0','ot-lev-extra-14-0','ot-lev-extra-16-1'],added=ids.map(id=>data.scenes.find(s=>s.id===id)),objects=JSON.parse(fs.readFileSync('data/pixel-bible/objects/lev.json'));assert(added.every(Boolean));
 for(const title of ["아론이 제단의 불을 꺼지지 않게 지키다","제사장이 정결해진 사람을 위한 두 새의 예식을 행하다","아론이 속죄일에 두 염소로 백성의 죄를 속하다"])assert(added.some(s=>s.title===title),title);
 for(const s of added){assert(s.narrationOnly);assert(objects.chapters[String(s.chapter)].some(o=>o.id===s.object&&o.refs.includes(s.ref)),s.id);}
});
