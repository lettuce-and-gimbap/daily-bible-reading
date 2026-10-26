import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {sampleEvent,EVENT_ACTIONS} from '../js/features/pixel-bible/event-animation/timeline.js';
import {EFFECTS} from '../js/features/pixel-bible/event-animation/effects.js';
import {VERSE_EFFECTS} from '../js/features/pixel-bible/event-animation/verse-effects.js';
import {buildWorldModel} from '../js/features/pixel-bible/world.js';
import {loadVerseBook,VERSE_BOOKS} from '../js/features/pixel-bible/verse-data.js';
const data=JSON.parse(fs.readFileSync('data/pixel-bible/verse-events/mrk.json')),summary=JSON.parse(fs.readFileSync('data/summary/mrk.json')),events=JSON.parse(fs.readFileSync('data/pixel-bible/events/mrk.json'));
test('마가복음 1–15장 658절은 누락 없이 작성되고 실제 월드에서 선택된다',()=>{
 assert.equal(data.scenes.length,658);
 for(const [chapter,count]of [[1,45],[2,28],[3,35],[4,41],[5,43],[6,56],[7,37],[8,38],[9,50],[10,52],[11,33],[12,44],[13,37],[14,72],[15,47]]){
 const clips=data.scenes.filter(s=>s.chapter===chapter);assert.deepEqual(clips.map(s=>s.verseNumbers[0]),Array.from({length:count},(_,i)=>i+1));
 const people=[...summary.chapters[chapter].people,...(data.additionalPeople[chapter]||[])];
 const c={code:'mrk',chap:chapter,name:'마가복음',data:{...summary.chapters[chapter],people,verseClips:clips,eventScenes:[...events.scenes,...events.restoredScenes].filter(s=>s.chapter===chapter)}};
 const ids=new Set(buildWorldModel([c]).scenes.flatMap(s=>s.verseClips.map(v=>v.id)));for(const clip of clips){assert.ok(ids.has(clip.id),clip.id);for(const name of clip.actors)assert.ok(people.some(p=>p.name===name));assert.equal(clip.animation.beats.length,6);assert.ok(EFFECTS.has(clip.animation.effect)||VERSE_EFFECTS.has(clip.animation.effect));for(const b of clip.animation.beats)assert.ok(EVENT_ACTIONS.includes(b.action));const cast=clip.actors.map(name=>({name}));for(const t of [0,2,4,8.2,30])for(const s of sampleEvent(clip,cast,t).states)assert.ok(s.pose.eventArms.flat().every(Number.isFinite));}
 }
});
test('마가복음 13장의 성전 예고·환난 경고·깨어 있음 비유를 절별 장면으로 구성한다',()=>{
 const get=v=>data.scenes.find(s=>s.chapter===13&&s.verseNumbers[0]===v);
 assert.deepEqual(data.scenes.filter(s=>s.chapter===13).map(s=>s.verseNumbers[0]),Array.from({length:37},(_,i)=>i+1));
 assert.equal(get(2).animation.effect,'temple-fall');
 assert.equal(get(8).animation.diagram.kind,'comparison');
 assert.equal(get(24).animation.diagram.kind,'cosmic-dark');
 assert.equal(get(26).animation.diagram.kind,'glory-cloud');
 assert.equal(get(27).animation.diagram.kind,'gather-call');
 assert.equal(get(34).actors.includes('문지기'),true);
 assert.ok(get(17).study.includes('고통은 묘사하지 않아요'));
});
test('마가복음 14장의 향유·식탁·겟세마네·심문·베드로 부인을 장면별로 구별한다',()=>{
 const get=v=>data.scenes.find(s=>s.chapter===14&&s.verseNumbers[0]===v);
 assert.deepEqual(data.scenes.filter(s=>s.chapter===14).map(s=>s.verseNumbers[0]),Array.from({length:72},(_,i)=>i+1));
 assert.equal(get(3).animation.effect,'anoint-head');assert.equal(get(22).animation.effect,'bread-share');
 assert.equal(get(36).actors.includes('하나님'),false);assert.equal(get(46).animation.effect,'capture');
 assert.equal(get(68).animation.effect,'rooster-call');assert.equal(get(72).animation.effect,'rooster-call');
 assert.ok(get(65).study.includes('화면 밖'));
});
test('마가복음 15장의 재판·십자가·장례를 다루고 빈 본문 절은 안내로 남긴다',()=>{
 const get=v=>data.scenes.find(s=>s.chapter===15&&s.verseNumbers[0]===v);
 assert.deepEqual(data.scenes.filter(s=>s.chapter===15).map(s=>s.verseNumbers[0]),Array.from({length:47},(_,i)=>i+1));
 assert.equal(get(15).animation.mode,'reconstruction');assert.equal(get(21).animation.prop,'cross');
 assert.equal(get(28).textualNotice,true);assert.equal(get(28).animation.diagram.kind,'edition-note');
 assert.equal(get(33).animation.diagram.kind,'cosmic-dark');assert.equal(get(38).animation.effect,'veil-dark');
 assert.equal(get(46).animation.effect,'tomb-seal');assert.ok(get(25).study.includes('신체 손상은 보이지 않게'));
});
test('마가복음의 배 비유·군대 귀신·전도 지침·귀먹은 사람은 본문별 도식과 동작을 쓴다',()=>{
 const get=(ch,v)=>data.scenes.find(s=>s.chapter===ch&&s.verseNumbers[0]===v);
 assert.equal(get(5,3).animation.diagram.kind,'broken-chain');
 assert.equal(get(5,11).animation.diagram.kind,'herd');assert.equal(get(5,13).animation.diagram.kind,'herd-water');
 assert.equal(get(6,8).animation.diagram.kind,'travel-kit');assert.equal(get(6,40).animation.diagram.kind,'seated-groups');
 assert.equal(get(7,10).animation.diagram.kind,'scroll-command');assert.equal(get(7,33).animation.effect,'ear-tongue');
 assert.equal(get(7,16).editionVariant,true);assert.equal(get(7,16).textualNotice,undefined);
 assert.equal(get(6,14).editionVariant,true);
});
test('마가복음 8–10장의 표징·변화산·아이 축복·바디매오 사건을 구별한다',()=>{
 const get=(ch,v)=>data.scenes.find(s=>s.chapter===ch&&s.verseNumbers[0]===v);
 assert.equal(get(8,6).animation.effect,'bread-share');assert.equal(get(8,25).animation.effect,'heal');
 assert.equal(get(9,3).animation.effect,'transfiguration');assert.equal(get(9,27).animation.effect,'heal');
 assert.equal(get(9,44).textualNotice,true);assert.equal(get(9,46).textualNotice,true);
 assert.equal(get(10,25).animation.diagram.kind,'camel-needle');assert.equal(get(10,50).animation.prop,'cloak');assert.equal(get(10,52).animation.effect,'heal');
});
test('마가복음 11–12장은 입성·성전 정화·포도원 비유·논쟁·과부의 헌금을 절별로 구성한다',()=>{
 const get=(ch,v)=>data.scenes.find(s=>s.chapter===ch&&s.verseNumbers[0]===v);
 assert.equal(get(11,4).animation.prop,'donkey');assert.equal(get(11,15).animation.prop,'table');
 assert.equal(get(11,17).animation.diagram.kind,'promise');assert.equal(get(11,23).animation.diagram.kind,'comparison');
 assert.equal(get(11,26).textualNotice,true);
 assert.equal(get(12,1).animation.diagram.kind,'vineyard');assert.equal(get(12,10).animation.diagram.kind,'cornerstone');
 assert.equal(get(12,16).animation.prop,'coin');assert.equal(get(12,42).animation.prop,'coin');
 assert.ok(get(12,42).study.includes('두 렙돈'));assert.equal(get(12,44).animation.beats.length,6);
});
test('네 운반자·지붕 내리기·상을 들고 나가기의 단계가 다르다',()=>{
 const get=v=>data.scenes.find(s=>s.chapter===2&&s.verseNumbers[0]===v);
 assert.equal(get(3).animation.portrayals['네 사람'].copies,4);assert.equal(get(4).animation.portrayals['네 사람'].copies,4);
 assert.equal(get(4).animation.effect,'roof-descent');assert.equal(get(4).animation.propPath[0].y,95);assert.equal(get(4).animation.propPath.at(-1).y,235);
 assert.ok(!get(11).animation.beats.some(b=>b.action==='walk'));
 assert.equal(get(12).animation.propPortable,true);for(const t of [6,8.2])assert.equal(sampleEvent(get(12),[{name:'중풍병자'},{name:'무리'}],t).states[0].held,true);
 assert.ok(data.scenes.find(s=>s.chapter===3&&s.verseNumbers[0]===1).study.includes('어느 손인지 쓰지 않아요'));
});
test('작성되지 않은 권은 요청하지 않고 같은 권의 동시 요청은 한 번만 읽는다',async()=>{
 assert.deepEqual(VERSE_BOOKS,['mat','mrk']);let calls=0;const fetcher=async url=>{calls++;assert.ok(url.pathname.endsWith('/mrk.json'));return {ok:true,json:async()=>data};};
 assert.equal(await loadVerseBook('luk',fetcher),null);assert.equal(calls,0);
 const [a,b]=await Promise.all([loadVerseBook('mrk',fetcher),loadVerseBook('mrk',fetcher)]);assert.equal(a,data);assert.equal(a,b);assert.equal(calls,1);
});
