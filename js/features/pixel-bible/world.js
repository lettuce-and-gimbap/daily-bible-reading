import {bindOutsidePanelDismiss} from './panel-dismiss.js';
import {loadVerseBook} from './verse-data.js';
import {eventPlan} from './event-animation/timeline.js';
import {mountScenePlayback,verseClipsForScene} from './verse-playback.js';
import {createBgm} from './bgm.js?v=bright3';
import {enhanceScene,eventRoutine} from './scripted-events.js';
import {RECIPE_KEY,recipeKey,loadRecipeUnlocks,recipeLocked,recipeHint,recipeAssembled,requiredObjectsNearby} from './recipe-locks.js';
import {waterAt,dryLanding} from './terrain-response.js';
import {worldCanAnimate} from './world-loop.js';
import {beginWaterEscape,advanceWaterEscapes,advanceWaterHuff,rescueWaterEscape,WATER_ESCAPE_SECONDS} from './water-escape.js';
import {drawWaterRescue} from './water-rescue-art.js';
import {discoveryKey,importanceFor,prominentKeys,discoverySnapshot,mergeDiscovery,learningStage,learningNext,markStoryRead,loadDiscoveries,storyKey,DISCOVERY_KEY} from './discovery.js';
import '../../shared/daylight.js';
import {physiqueFor} from './physique.js';
import {contextTerms,emphasizedContext,emphasizePassage} from './context-emphasis.js';
const displayPersonName=name=>(name==='불'?'불 왕':name).replace(/\s*[（(][^()（）]*의\s*(?:아들|딸|아내|남편)[^()（）]*[)）]/g,'').trim();
import {speechContext} from './speech-context.js';
import {captureBubblePlacement,pinnedBubblePlacement} from './bubble-position.js';
import {creatureCanUse} from './creatures.js?rev=pharaoh-so-classification-1';
import {EncounterDirector} from './encounters.js';
import {drawInteractionEffects} from './interaction-effects.js';
import {objectContextSpeech} from './speech-view.js';
import {grabOffset,grabbedOrigin} from './grab.js';
import { majorCast, recommendedCast, exposureStorageKey } from './exposure.js';
import { fitLayout } from './layout.js';
import { drawWholeBackground, sceneDecorations } from './landscape.js';
import { speechEmotion } from './expression.js';
import { WORLD, BOUNDS, homeCamera, cameraView, constrainCamera, toWorld, zoomAt, pinchCamera, edgePan } from './camera.js';
import { canMoveObject, isBoat } from './object-drag.js';
import { RUN_SPEED, shouldRun, runningIntoPerson, runningIntoObject, impactPose, swimPose, impactSparkles, COLLISION_STUN_SECONDS } from './collision-motion.js';
import { objectPresentation, interactionApproaches, heldObject, interactionAnchor, objectWorn, objectInteractionFrame, drawObjectResponse } from './object-response.js';
import { castKey, reconcileCast } from './cast-state.js';
import { OBJECT_CATALOG, objectsForChapters } from './object-catalog.js';
import { interactionRoutine, interactionPose } from './interaction-motion.js';
import { WORLD_OBJECTS, OBJECT_SCENES, objectLinesFor, removeObjects, rankObjectVisits, objectVisitKey } from './object-scenes.js';
import { characterWalkFrame } from './character-motion.js';
import { advanceGimbapRoll } from './gimbap-art.js?rev=gimbap-backface-2';
import { loveBoothExchange } from './relationship-lines.js?rev=relation-talk-authored-alias-3';
import { faceBoothFront } from './love-booth.js';
import { personalLines } from './personal-lines.js';
import { characterMotion, motionPose, hangingPose, liftedCharacterFrame } from './motion.js';
import { relationshipLinks, relationshipFocus, advanceRelationshipSelection, relationshipOpacity, drawRelationshipLinks } from './relationship-overlay.js?rev=directed-links-2';
import { chapterPeople } from './chapter-people.js?rev=so-king-identity-1';
import { isMentionOnlyPerson, withoutMentionOnlyActors } from './mention-only.js';
import { opposedDirections, planConversation } from './conversation.js';
import { parseReference } from './references.js';
import { scopeChapterSummary } from './qt-scope.js';
import { buildChapterDialogue, occurrenceMatches } from './chapter-dialogue.js';
import { ambientSpeechAllowed, manualSpeechAllowed, dialogueCandidates, SpeechDirector } from './dialogue.js';
import { objectPhrase, movementDirection } from './language.js';
import { resolveIdentity, canonicalPersonName } from './identity.js?rev=person-identity-audit-1';
import { BACKGROUNDS, defaultBackground, backgroundStorageKey } from './backgrounds.js';
import { drawPixelCharacter, hitWorldObject, characterStyle, drawWorldObject, drawDesignBoard } from "./art.js";
import { renderPersonPreview, easyPersonDescription } from "./collection-preview.js?v=turntable-motion-walk-start-2";
import { RUTH_SCENES, ELIJAH_SCENES, ALL_SCENES as REVIEWED_SCENES, scenesForChapters } from './scenes.js';
export { RUTH_SCENES, ELIJAH_SCENES } from './scenes.js';
// 공개 픽셀 월드: 엔진/외부 이미지 없이 재사용하는 경량 Canvas 월드.
// 이 모듈과 본문 JSON은 입장 시에만 로드된다. 본문 장 이동에는 연결하지 않는다.
const books = new Map();
const TILE = 24, WIDTH = 960, HEIGHT = 480;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const OBJECTS = {...WORLD_OBJECTS,...Object.fromEntries(Object.values(OBJECT_CATALOG).map(o=>[o.id,o.name]))};
const ALL_SCENES=[...REVIEWED_SCENES,...OBJECT_SCENES];
export function worldViewport(width,height) {
  const scale=Math.max(width/WIDTH,height/HEIGHT);
  return {scale,x:(width-WIDTH*scale)/2,y:(height-HEIGHT*scale)/2};
}
export function rangeIsTooLarge({people=0,objects=0,events=0}={}) {
  return people>24||objects>36||events>36;
}
export function initialWorldRange(requested,preferred){
  if(preferred)return {...preferred};
  const first=requested?.[0],last=requested?.at(-1);
  if(!first)return {code:'',start:1,end:1};
  return {code:first.code,start:first.chap||1,end:first.code===last?.code?(last.chap||first.chap||1):(first.chap||1)};
}
export function includeSceneObjects(objects,scenes) {
  const available=new Map(objects.map(item=>[item.id,item]));
  for(const scene of scenes){
    for(const kind of [scene.object,...(scene.requiresObjects||[])]){const item=OBJECT_CATALOG[kind];
    if(item&&!available.has(item.id))available.set(item.id,{...item,refs:scene.ref?[scene.ref]:[],actors:[...scene.actors],evidence:[]});}
  }
  return [...available.values()];
}
// Safari can report fractional CSS bounds while the backing canvas is DPR-scaled.
// Clamp edge coordinates so taps on the final pixel row/column still resolve.
export function clientToCanvasPoint(clientX,clientY,rect,width,height,rotated=false) {
  if(!rect?.width||!rect?.height)return {x:0,y:0};
  const x=rotated?(clientY-rect.top)*width/rect.height:(clientX-rect.left)*width/rect.width;
  const y=rotated?(rect.right-clientX)*height/rect.width:(clientY-rect.top)*height/rect.height;
  return {x:Math.max(0,Math.min(width-1,x)),y:Math.max(0,Math.min(height-1,y))};
}
export function touchSlopPixels(canvasWidth,cssWidth,cssSlop=12) {
  if(!cssWidth)return cssSlop;
  return cssSlop*Math.max(1,canvasWidth/cssWidth);
}

const eventBooks=new Map();
const talkBooks=new Map();
// 관계도마다 쓴 조우 대화(relation-talk)를 해당 관계에 붙인다. 파일이 없으면 관계만 그대로 둔다.
async function withRelationTalk(code,data){
 if(!talkBooks.has(code))talkBooks.set(code,fetch(new URL(`../../../data/pixel-bible/relation-talk/${code}.json`,import.meta.url)).then(r=>r.ok?r.json():null).catch(()=>null));
 const talk=(await talkBooks.get(code))?.talk;if(!talk)return data;
 return {...data,chapters:Object.fromEntries(Object.entries(data.chapters).map(([number,c])=>[number,{...c,rels:(c.rels||[]).map(r=>{const lines=talk[`${number}|${r.from}|${r.to}`];return lines?{...r,talk:lines}:r;})}]))};
}
async function enrichBook(code,source){
 const data=await withRelationTalk(code,source);
 if(!eventBooks.has(code))eventBooks.set(code,fetch(new URL(`../../../data/pixel-bible/events/${code}.json`,import.meta.url)).then(r=>r.ok?r.json():null).catch(()=>null));
 const extra=await eventBooks.get(code);if(!extra)return data;
 const verseData=await loadVerseBook(code);
 const chapters=Object.fromEntries(Object.entries(data.chapters).map(([number,c])=>{const names=new Set((c.people||[]).map(p=>p.name));return [number,{...c,people:[...(c.people||[]),...(extra.additionalPeople?.[number]||[]).filter(p=>!names.has(p.name)),...(verseData?.additionalPeople?.[number]||[]).filter(p=>!names.has(p.name)&&!(extra.additionalPeople?.[number]||[]).some(q=>q.name===p.name))],verseClips:(verseData?.scenes||[]).filter(s=>s.chapter===Number(number)),eventScenes:[...(extra.scenes||[]),...(extra.restoredScenes||[])].filter(s=>s.chapter===Number(number))}];}));return {...data,chapters};
}
async function loadBook(code, cachedBook) {
  const existing = cachedBook?.(code);
  if (existing) return enrichBook(code,existing);
  if (!books.has(code)) {
    books.set(code, fetch(`data/summary/${code}.json`, { cache: "force-cache" }).then(async (r) => {
      if (!r.ok) throw new Error(`본문 자료 ${r.status}`);
      const data = await r.json();
      if (!data.chapters) throw new Error("본문 자료 형식 오류");
      return enrichBook(code,data);
    }).catch((e) => { books.delete(code); throw e; }));
  }
  return books.get(code);
}

export function buildWorldModel(chapters) {
  const people = new Map(), relations = [], events = [];
  for (const { name, code, chap, data } of chapters) {
    if (!data) continue;
    const reference = `${name} ${chap}${code === "psa" ? "편" : "장"}`;
    for (const person of chapterPeople(data,{name,code,chap})) {
      // 하나님/성령을 무작위 인간 NPC로 그리지 않는다.
      if (/^(하나님|여호와|성령|주님)$/.test(person.name)) continue;
      // 본문 인물 색인이나 명시 검토 목록에서 현재 장면에 없다고 확인된 인물은
      // 설명·관계 자료에는 남아도 월드 캐릭터로 세우지 않는다.
      if (isMentionOnlyPerson(person,{code,chapter:chap})) continue;
      const identity=resolveIdentity(person.name,{code,chapter:chap,role:person.role||''});
      const personKey=identity.kind==='person'||identity.mergeAliases?identity.id:`${person.name}:${identity.id}`;
      if (!people.has(personKey)) people.set(personKey, { ...person, name:identity.canonicalName||person.name, identity, refs: [], roles: [] });
      const p = people.get(personKey);
      p.refs.push(reference);
      if(person.role&&!p.roles.includes(person.role))p.roles.push(person.role);
      p.weight = Math.max(p.weight || 1, person.weight || 1);
    }
    for (const r of data.rels || []) relations.push({ ...r, from:canonicalPersonName(r.from,{code,chapter:chap}), to:canonicalPersonName(r.to,{code,chapter:chap}), sourceRef: reference, ref: `${name} ${chap}:${r.verses || ""}` });
    for (const e of data.events || []) events.push({ ...e, ref: `${name} ${chap}:${e.verses || ""}` });
  }
  const ruth = chapters.some((c) => c.code === "rut" && c.chap === 2 && c.data);
  if (ruth && ![...people.values()].some(p=>p.name==="일꾼")) people.set("일꾼", { name: "일꾼", role: "보아스의 밭에서 추수하는 일꾼", weight: 1, refs: ["룻기 2:4"] });
  // 음식 친구들은 성경 본문 인물과 분리된 고유 ID의 월드 마스코트다.
  const mascots=[['김밥','굴러 다니는 김밥 친구'],['상추','싱그러운 상추 친구'],['카라멜팝콘','달콤한 카라멜팝콘 친구']];
  for(const [name,role] of mascots)if(![...people.values()].some(p=>p.name===name))people.set(name,{name,role:`월드의 창작 길동무 · ${role}`,weight:1,refs:[],identity:{kind:'person',id:`person:mascot-${name}`,status:'creative-mascot'},worldMascot:true,mascotId:name});
  const cast = [...people.values()].sort((a, b) => (b.weight || 1) - (a.weight || 1));
  if (!cast.length) cast.push({ name: "읽는 사람", role: "본문을 함께 살펴보는 안내 캐릭터 (창작)", refs: [], weight: 1 });
  const sourceScenes=chapters.flatMap(c=>c.data?.eventScenes||[]);
  const mentionOnlyNamesFor=scene=>{
    const chapter=chapters.find(c=>c.code===scene.code&&c.chap===scene.chapter);
    return chapter?chapterPeople(chapter.data,{name:chapter.name,code:chapter.code,chap:chapter.chap}).filter(person=>isMentionOnlyPerson(person,{code:chapter.code,chapter:chapter.chap})).map(person=>person.name):[];
  };
  // A hand-authored scene may replace an identical restored range without losing its index link.
  const filterMentionActors=scene=>withoutMentionOnlyActors(scene,mentionOnlyNamesFor(scene));
  const normalizeScene=scene=>{
    const canonical=name=>name==null?name:canonicalPersonName(name,{code:scene.code,chapter:scene.chapter});
    return {...scene,actors:scene.actors.map(canonical),animation:scene.animation?{...scene.animation,lead:canonical(scene.animation.lead),target:canonical(scene.animation.target),beats:(scene.animation.beats||[]).map(beat=>({...beat,actor:canonical(beat.actor)}))}:scene.animation};
  };
  const dedicated=scenesForChapters(chapters).map(scene=>filterMentionActors(normalizeScene({...scene,sourceUnits:[...new Set([...(scene.sourceUnits||[]),...sourceScenes.filter(s=>s.code===scene.code&&s.chapter===scene.chapter&&s.ref===scene.ref).flatMap(s=>s.sourceUnits||[])])]})));
  const extraScenes=chapters.flatMap(c=>(c.data?.eventScenes||[]).filter(s=>(!c.verses?.length||c.verses.some(v=>s.verseNumbers.includes(v)))&&!dedicated.some(d=>d.code===s.code&&d.chapter===s.chapter&&d.ref===s.ref)).map(normalizeScene).map(filterMentionActors).filter(s=>s.actors.every(name=>cast.some(p=>p.name===name))));
  return { cast, relations, events, scenes: [...OBJECT_SCENES.filter(s=>chapters.some(c=>c.code===s.code&&c.chap===s.chapter&&c.data)), ...dedicated,...extraScenes].map(s=>({...enhanceScene(s,cast),verseClips:chapters.filter(c=>c.code===s.code&&c.chap===s.chapter).flatMap(c=>verseClipsForScene(s,c.data?.verseClips||[],c.verses||[]).map(filterMentionActors))})), title: chapters.map((c) => `${c.name} ${c.chap}`).join(" · "), key: chapters.map((c) => `${c.code}.${c.chap}`).join("-") };
}

// 명단을 교체하지 않고 통독 분량의 모든 인물을 함께 유지한다.
export function visibleWorldCast(model) { return [...model.cast]; }
export function castPositions(count){
 const columns=Math.max(1,Math.ceil(Math.sqrt(count*1.7))),rows=Math.ceil(count/columns);
 const dx=Math.min(4,(BOUNDS.maxX-BOUNDS.minX-2)/Math.max(1,columns-1));
 const dy=Math.min(3,(BOUNDS.maxY-BOUNDS.minY-2)/Math.max(1,rows-1));
 return Array.from({length:count},(_,i)=>({x:Math.max(BOUNDS.minX,Math.min(BOUNDS.maxX,Math.round(WORLD.width/48+(i%columns-(columns-1)/2)*dx+(Math.random()-.5)*3))),y:Math.max(BOUNDS.minY,Math.min(BOUNDS.maxY,Math.round(WORLD.height/48+(Math.floor(i/columns)-(rows-1)/2)*dy+(Math.random()-.5)*3)))}));
}

export function findPath(start, goal, blocked) {
  const key = (p) => `${p.x},${p.y}`;
  const queue = [start], seen = new Map([[key(start), null]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.x === goal.x && p.y === goal.y) {
      const path = []; let at = p;
      while (seen.get(key(at))) { path.unshift(at); at = seen.get(key(at)); }
      return path;
    }
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (!blocked(n.x, n.y) && !seen.has(key(n))) { seen.set(key(n), p); queue.push(n); }
    }
  }
  return null;
}

export async function mountPixelWorld(shell, options) {
  let requested = options.chapters;
  const noPlan = !requested.length;
  if (noPlan) requested = [{ code: "rut", name: "룻기", chap: 2 }];
  const loaded = await Promise.all([...new Set(requested.map((c) => c.code))].map(async (code) => [code, await loadBook(code, options.cachedBook)]));
  if (!shell.isConnected) return () => {};
  const byCode = Object.fromEntries(loaded);
  const chapterData=requested.map((c)=>({...c,data:scopeChapterSummary(byCode[c.code].chapters[c.chap],c.verses)}));
  const model=buildWorldModel(chapterData),dialogueContext=buildChapterDialogue(chapterData);
  const prominent=prominentKeys(model);let discoveries=loadDiscoveries(localStorage);
  const visibleCast=visibleWorldCast(model,options.focusPerson||0);
  const chapterProps=includeSceneObjects(objectsForChapters(chapterData),model.scenes);
  const initialRange=initialWorldRange(requested,options.initialRange);
  const rangeBooks=options.rangeBooks||[];
  const rangeBook=rangeBooks.find(b=>b.code===initialRange.code);
  const rangeForm=rangeBooks.length?`<details class="pb-range"><summary>표기 범위 · 장 선택</summary><p class="pb-help">기본은 한 장이에요. 같은 권에서 시작 장과 끝 장을 골라 인물·오브젝트·사건을 함께 볼 수 있어요.</p><label>성경 <select data-range-book>${rangeBooks.map(b=>`<option value="${esc(b.code)}" ${b.code===initialRange.code?'selected':''}>${esc(b.name)}</option>`).join('')}</select></label><div class="pb-range-inputs"><label>시작 장 <input type="number" data-range-start min="1" max="${rangeBook?.chapters||1}" value="${initialRange.start}" inputmode="numeric"></label><label>끝 장 <input type="number" data-range-end min="1" max="${rangeBook?.chapters||1}" value="${initialRange.end}" inputmode="numeric"></label></div><button class="pb-button" data-action="apply-range">범위 적용</button><p class="pb-range-status" role="status" aria-live="polite"></p></details>`:'';
  if (requested.some((c) => !byCode[c.code].chapters[c.chap])) throw new Error("본문 자료가 아직 준비되지 않았어요");
  shell.querySelector(".pb-load").remove();
  shell.classList.add('pb-ready');

  const objectChoice=(id,name)=>`<button class="pb-button pb-object-choice" data-place="${esc(id)}" aria-pressed="false" aria-label="${esc(name)} 배치. 한 번 터치, 1초 누르면 설명"><span class="pb-object-art"><canvas width="80" height="72" data-object-icon="${esc(id)}" aria-hidden="true"></canvas><svg class="pb-object-progress" viewBox="0 0 80 72" aria-hidden="true"><path d="M2 2H78V70H2Z"/></svg></span><span class="pb-object-choice-name">${esc(name)}</span></button>`;
  const chapterObjectButtons=chapterProps.map(item=>objectChoice(item.id,item.name)).join('');
  const commonObjectButtons=Object.entries(WORLD_OBJECTS).filter(([key])=>!chapterProps.some(item=>item.id===key)).map(([key,name])=>objectChoice(key,name)).join('');
  shell.insertAdjacentHTML("beforeend", `<div class="pb-world-stage"><button class="pb-trash-drop" type="button" hidden aria-label="오브젝트 버리기">🗑️</button><canvas width="960" height="480" tabindex="0" aria-label="픽셀 월드. 인물을 누르면 대사와 선택 표시, 빈 땅을 누르면 선택 해제. 캐릭터를 끌어 옮기거나 선택 후 방향키로 걸어갈 수 있어요."></canvas><div class="pb-speech" role="status" aria-live="polite" aria-atomic="true" hidden><b class="pb-speech-speaker"></b><p></p><button type="button" class="pb-speech-reference" data-action="speech-details">자세히 보기</button></div><div class="pb-event" hidden><div class="pb-event-card" role="status"></div></div></div>
    <button class="pb-button pb-side-toggle pb-toggle-left" data-action="toggle-left" aria-controls="pb-left-panel" aria-expanded="false">인물 ▸</button>
    <aside class="pb-side pb-side-left" id="pb-left-panel" hidden aria-label="인물·생물 선택과 외형 근거"><button class="pb-button" data-action="collection">발견 도감 · 알아가기</button><p class="pb-help">은은한 발밑 빛은 현재 분량의 주요 인물이에요.</p><h3>분량 전체 인물·생물 · ${model.cast.length}명/집단</h3><p class="pb-help">이름 버튼은 함께 표시할 추천 인물 목록을 열고 닫아요. 표시 중/숨김은 옆 버튼으로 따로 바꿔요.</p><div class="pb-world-toolbar"><button class="pb-button" data-cast-mode="major">주요 인물</button><button class="pb-button" data-cast-mode="all">전체 인물</button><button class="pb-button" data-cast-mode="animals">동물만</button><button class="pb-button" data-cast-mode="plants">식물만</button><button class="pb-button" data-cast-mode="none">모두 숨기기</button></div><p class="pb-cast-count"></p><div class="pb-recommendations" hidden></div><div class="pb-roster">${model.cast.map((p,i)=>`<div class="pb-roster-row"><button class="pb-button" data-cast-person="${i}" aria-expanded="false">${esc(displayPersonName(p.name))}${p.creature?` <small>· ${p.creature.kind==='plant'?'식물':'동물'}</small>`:''}</button><button class="pb-button pb-person-toggle" data-toggle-person="${i}" aria-pressed="true" aria-label="${esc(displayPersonName(p.name))} 표시 전환">표시 중</button></div>`).join('')}</div><div class="pb-person-details"></div></aside>
    <button class="pb-button pb-side-toggle pb-toggle-right" data-action="toggle-right" aria-controls="pb-right-panel" aria-expanded="false">◂ 도구 · 조합</button>
    <aside class="pb-side pb-side-right" id="pb-right-panel" hidden aria-label="도구와 조합식"><p class="pb-scene-name">${noPlan?'체험 본문 · ':`${esc(options.scopeLabel||'통독 분량')} 월드 · `}${esc(model.title)}</p>${rangeForm}<div class="pb-world-toolbar"><button class="pb-button" data-action="relationships" aria-pressed="false">관계선 꺼짐</button><button class="pb-button" data-action="pause" aria-pressed="false">일시정지</button><button class="pb-button" data-action="bgm" aria-pressed="false" aria-label="배경음악 켜기">♫ 음악 OFF</button></div>
    <h3>배경 바꾸기</h3><p class="pb-help">상상 지형이에요. 실제 사건 장소를 뜻하지 않아요.</p><p class="pb-background-note pb-help"></p><button class="pb-button" data-action="background-random">랜덤 설정</button> <details class="pb-background-picker"><summary>배경 선택 · 펼치기</summary><div class="pb-world-toolbar pb-backgrounds">${Object.entries(BACKGROUNDS).map(([key,p])=>`<button class="pb-button" data-background="${key}" aria-pressed="false">${esc(displayPersonName(p.name))}</button>`).join('')}</div></details>
    <h3>본문 오브젝트</h3><p class="pb-help">가볍게 터치하면 배치돼요. 그림을 1초 꾹 누르면 테두리가 한 바퀴 돌고 설명이 열려요. 배치한 오브젝트는 0.4초 꾹 눌러 옮길 수 있어요.</p><p class="pb-help">TV는 사랑을 싣고 부스에 인물을 직접 끌어 올리면 두 사람만 대화해요. 다른 인물은 자동으로 부스에 올라가지 않아요.</p><p class="pb-help">${chapterProps.length?'현재 분량의 물건·공간·상징이에요. 구절 범위는 사건 설명의 범위예요.':'현재 요약에서 확인된 물건이 없어요. 공통 오브젝트로 꾸밀 수 있어요.'}</p><div class="pb-world-toolbar"><div class="pb-object-grid">${chapterObjectButtons}</div></div><details><summary>공통 오브젝트</summary><div class="pb-world-toolbar"><div class="pb-object-grid">${commonObjectButtons}</div></div></details><section class="pb-object-detail" data-object-detail hidden aria-live="polite"></section><div class="pb-world-toolbar"><button class="pb-button" data-action="cancel-place" hidden>배치 취소</button><button class="pb-button" data-action="remove-object" aria-pressed="false">개별 철거</button><button class="pb-button" data-action="reset">오브젝트 전체 철거</button></div>
    <h3>조합식</h3><p class="pb-help">아래 조합을 누르면 필요한 인물들이 모여요. 캐릭터를 집어 오브젝트 옆에 내려놓아도 돼요.</p><button class="pb-button" data-action="unlocked-scenes">해금한 장면 모아 보기</button><div class="pb-recipes"></div>
    ${model.scenes.length?'<button class="pb-button" data-action="scene">다음 본문 장면 모아 보기</button>':'<button class="pb-button" data-action="demo">룻기 2장 체험으로 이동</button>'}</aside>
    <div class="pb-world-info" role="status" aria-live="polite" hidden></div>
`);
  const abort = new AbortController(), signal = abort.signal;
  shell.querySelectorAll('canvas[data-object-icon]').forEach(icon=>{const preview=icon.getContext('2d'),source=document.createElement('canvas');
    source.width=source.height=512;const ctx=source.getContext('2d');
    drawWorldObject(ctx,{kind:icon.dataset.objectIcon,x:256,y:300},1);
    const pixels=ctx.getImageData(0,0,512,512).data;let left=512,top=512,right=0,bottom=0;
    for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(pixels[(y*512+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(left>right)return;const w=right-left+1,h=bottom-top+1,fit=Math.min(68/w,60/h);
    preview.imageSmoothingEnabled=false;preview.clearRect(0,0,80,72);
    preview.drawImage(source,left,top,w,h,Math.round((80-w*fit)/2),Math.round((72-h*fit)/2),Math.floor(w*fit),Math.floor(h*fit));});
  const bgm=createBgm();
  const savedMusic=()=>{try{return localStorage.getItem('pixel-bible:bgm-enabled');}catch(_){return null;}};
  const setMusicState=(button,on)=>{button.setAttribute('aria-pressed',String(on));button.textContent=on?'♫ 음악 ON':'♫ 음악 OFF';button.setAttribute('aria-label',on?'배경음악 끄기':'배경음악 켜기');button.dataset.restored='true';};
  const canvas = shell.querySelector(".pb-world-stage > canvas"), ctx = canvas.getContext("2d");
  const camera={...homeCamera(),...options.camera};
  const view=()=>cameraView(canvas.width,canvas.height,camera);
  const info = shell.querySelector(".pb-world-info");
  const overlay = shell.querySelector(".pb-event"), eventCard = shell.querySelector(".pb-event-card");
  const speechElement=shell.querySelector('.pb-speech');
  const speech=new SpeechDirector({now:performance.now()});let shownSpeech=null,speechWidth=0,speechHeight=0,pendingTalk=null,manualSpeechUntil=0;
  const encounters=new EncounterDirector(chapterData,dialogueContext,{maxActive:1});let encounterLines=[];const encounterBubbles=new Map();
  let loveBoothSession=null;
  const loveBooth=()=>objects.find(o=>o.kind==='love-booth');
  const boothSlots=o=>[{x:o.x-1,y:o.y},{x:o.x+1,y:o.y}];
  const boothPair=()=>npcs.filter(n=>n.loveBooth===loveBooth()&&!n.creature).sort((a,b)=>a.x-b.x).slice(0,2);
  const restoreBoothCamera=()=>{if(loveBoothSession?.home){Object.assign(camera,loveBoothSession.home);constrainCamera(camera,canvas.width,canvas.height);syncCamera();}};
  function cancelTalk(){if(pendingTalk){pendingTalk.plan.mover.path=[];pendingTalk=null;}}
  function hideSpeech(){if(shownSpeech?.speaker)shownSpeech.speaker.expression='neutral';manualSpeechUntil=0;cancelTalk();speech.dismiss(performance.now());speechElement.hidden=true;shownSpeech=null;}
  function dismissAllBubbles(){hideSpeech();encounters.clear();encounterLines=[];for(const el of encounterBubbles.values()){el._closePortrait?.();el.remove();}encounterBubbles.clear();}
  function faceEachOther(a,b){const directions=opposedDirections(a,b);if(!directions)return false;[a.direction,b.direction]=directions;a.idle=b.idle=6;return true;}
  function startLoveBooth(){
    if(loveBoothSession)return;
    const stage=loveBooth(),pair=boothPair();if(!stage||pair.length!==2)return;
    const [a,b]=pair,{relation,lines:exchange,mode}=loveBoothExchange(a,b,dialogueContext.relations);
    const special=mode!=='awkward';
    const lines=exchange.map(line=>({...line,origin:'booth',kind:'pair',ref:line.ref||relation?.ref}));
    for(const n of pair){n.path=[];n.task=null;n.action='';n.usingObject=null;n.interaction=null;n.objectScene=null;n.objectEvidence=null;n.encounter=true;n.idle=6;}
    faceBoothFront(pair);cancelTalk();hideSpeech();encounters.clear();
    loveBoothSession={stage,pair,lines,mode:special?'special':'awkward',started:performance.now(),until:performance.now()+5800,home:{...camera}};
    camera.x=((a.x+b.x)/2)*TILE;camera.y=((a.y+b.y)/2)*TILE-28;camera.zoom=Math.max(camera.zoom,1.75);constrainCamera(camera,canvas.width,canvas.height);syncCamera();
    say(special?'두 사람이 무대에서 특별한 이야기를 나눠요.':'두 사람이 잠시 인사한 뒤 무대에서 내려와요.');
  }
  function finishLoveBooth(){
    const session=loveBoothSession;if(!session)return;
    restoreBoothCamera();loveBoothSession=null;
    session.pair.forEach((n,i)=>{
      n.encounter=false;n.loveBooth=null;n.idle=.2;
      if(session.mode==='awkward'){
        const goal={x:Math.max(BOUNDS.minX,Math.min(BOUNDS.maxX,Math.round(n.x)+(i===0?-2:2))),y:Math.round(n.y)+1};
        const route=findPath(cell(n),goal,blocked);if(route?.length)n.path=route;
      }
    });
    updateEncounters(performance.now());draw();
  }
  function updateSpeech(now){
    if(loveBoothSession){if(shownSpeech?.speaker)shownSpeech.speaker.expression='neutral';shownSpeech=null;speech.dismiss(now);speechElement.hidden=true;cancelTalk();return;}
    const enabled=ambientSpeechAllowed(encounterLines,!paused&&!activeEvent&&!pendingEvent&&!drag?.active&&!objectHold?.active&&!placing&&!removing&&!shell.querySelector('.pb-design,.pb-scripture'));
    const manualActive=manualSpeechAllowed(speech.current,manualSpeechUntil,now);
    const ready=!speech.current&&!pendingTalk&&now>=speech.nextAt;
    let current=null;
    if(!enabled&&!manualActive){cancelTalk();speech.tick(now,[],false);}
    else if(pendingTalk){
      const talk=pendingTalk;
      if(now>talk.deadline){cancelTalk();speech.dismiss(now);}
      else if(!talk.plan.mover.path.length){
        pendingTalk=null;
        if(faceEachOther(talk.choice.speaker,talk.choice.target))current=speech.start(talk.choice,now);
        else speech.dismiss(now);
      }
    }else{
      const candidates=ready?(objectSpeech?[objectSpeech]:dialogueCandidates(npcs.filter(n=>!n.encounter),chapterData,dialogueContext)):[];
      if(ready&&objectSpeech)objectSpeech=null;
      current=speech.tick(now,candidates,true);
      if(current?.target&&current!==shownSpeech){
        const plan=planConversation(current.speaker,current.target,npcs,blocked,findPath);
        if(!plan){speech.dismiss(now);current=null;}
        else {
          // 오브젝트에 붙여 그리던 자세를 해제한 뒤 실제 대화 좌표로 이동한다.
          for(const actor of [current.speaker,current.target]){
            actor.usingObject=null;actor.interaction=null;actor.task=null;actor.action='';actor.objectScene=null;actor.objectAction=null;actor.objectEvidence=null;
          }
          if(plan.route.length){
            pendingTalk={choice:current,plan,deadline:now+6000};speech.current=null;
            plan.mover.path=plan.route;plan.anchor.idle=8;plan.mover.idle=8;current=null;
          }else if(!faceEachOther(current.speaker,current.target)){speech.dismiss(now);current=null;}
        }
      }
    }
    if(current!==shownSpeech){
      if(shownSpeech?.speaker)shownSpeech.speaker.expression='neutral';
      shownSpeech=current;speechElement.hidden=!current;
      if(current)current.speaker.expression=speechEmotion(current);
      if(current){
        speechElement.querySelector('.pb-speech-speaker').textContent=displayPersonName(current.speaker.name);
        speechElement.querySelector('p').textContent=current.text;
        speechElement.querySelector('[data-action="speech-details"]').hidden=!speechContext(current,chapterData)&&!parseReference(current.ref)?.verses?.length;
        speechWidth=speechElement.offsetWidth;speechHeight=speechElement.offsetHeight;
      }
    }
    if(!speech.current||now>=manualSpeechUntil)manualSpeechUntil=0;
  }
  async function openSpeechPassage(reference=shownSpeech?.ref,terms=contextTerms(shownSpeech)){
    const parsed=parseReference(reference);if(!parsed)return;
    shell.querySelector('.pb-scripture')?.remove();
    hideSpeech();
    const panel=document.createElement('section');panel.className='pb-scripture';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',reference);
    panel.innerHTML='<header><b></b><button class="pb-button" data-action="close-scripture">닫기 ✕</button></header><div class="pb-scripture-body" aria-live="polite">본문을 불러오는 중…</div>';
    panel.querySelector('b').textContent=reference;shell.append(panel);panel.querySelector('button').focus();
    try{if(!options.readPassage)throw new Error('passage-unavailable');const html=await options.readPassage(parsed);if(!panel.isConnected)return;panel.querySelector('.pb-scripture-body').innerHTML=html;emphasizePassage(panel.querySelector('.pb-scripture-body'),terms);}
    catch(_){if(panel.isConnected)panel.querySelector('.pb-scripture-body').textContent='본문을 불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.';}
  }
  function openSpeechDetails(choice=shownSpeech){
    if(!choice)return;
    const reference=choice.ref,parsed=parseReference(reference);
    const explanation=speechContext(choice,chapterData);if(!explanation&&!parsed?.verses?.length)return;
    hideSpeech();shell.querySelector('.pb-scripture')?.remove();
    const panel=document.createElement('section');panel.className='pb-scripture';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','대사 쉽게 이해하기');
    panel.innerHTML='<header><b>대사 쉽게 이해하기</b><button class="pb-button" data-action="close-scripture">닫기 ✕</button></header><div class="pb-scripture-body"><p class="pb-detail-line"></p><section class="pb-detail-context"><h3>이런 상황이에요</h3><p></p></section><section class="pb-detail-evidence"><h3>발화의 근거</h3><p></p></section><button class="pb-button" data-action="detail-passage">관련 성경 본문 보기</button></div>';
    panel.querySelector('.pb-detail-line').textContent=choice.text;panel.querySelector('.pb-detail-context').hidden=!explanation;
    if(explanation)panel.querySelector('.pb-detail-context p').innerHTML=emphasizedContext(explanation,contextTerms({...choice,detailText:explanation}));
    const evidence=panel.querySelector('.pb-detail-evidence');evidence.hidden=!parsed?.verses?.length;if(parsed?.verses?.length)evidence.querySelector('p').textContent=`이 발화는 ${reference} 본문을 바탕으로 했어요. 아래 본문 전체 보기를 통해 문맥을 확인할 수 있어요.`;
    const link=panel.querySelector('[data-action="detail-passage"]');link.hidden=!parsed?.verses?.length;link.dataset.reference=reference||'';link.dataset.terms=JSON.stringify(contextTerms({...choice,detailText:explanation}));link.textContent=parsed?.verses?.length?`${reference} 본문 전체 보기`:'관련 성경 본문 보기';if(parsed?.verses?.length)link.setAttribute('aria-label',`${reference} 본문 전체 보기`);
    shell.append(panel);panel.querySelector('button').focus();
  }
  function updateEncounters(now){
    const enabled=!loveBoothSession&&!paused&&!activeEvent&&!pendingEvent&&!shell.querySelector('.pb-design,.pb-scripture')&&!document.hidden;
    const excluded=[drag?.active?drag.n:null,...npcs.filter(n=>n.loveBooth)];
    encounterLines=encounters.tick(now,npcs,{enabled,excluded});
    if(pendingTalk&&[pendingTalk.choice.speaker,pendingTalk.choice.target].some(n=>n.encounter))cancelTalk();
    if(loveBoothSession&&now>=loveBoothSession.until)finishLoveBooth();
    if(loveBoothSession)encounterLines=[{...loveBoothSession.lines[0],session:'love-booth',slot:0,pairLines:loveBoothSession.lines,started:loveBoothSession.started,until:loveBoothSession.until}];
    const parts=encounterLines.flatMap(line=>(line.pairLines||[line]).map((part,index)=>({base:line,part,id:`${line.session}:${line.slot}:${index}`})));
    const ids=new Set(parts.map(p=>p.id));
    for(const [id,el]of encounterBubbles)if(!ids.has(id)){el._closePortrait?.();el.remove();encounterBubbles.delete(id);}
    for(const {base,part,id} of parts){
      const line={...base,...part};let el=encounterBubbles.get(id);
      if(!el){
        el=document.createElement('div');el.className=`pb-speech pb-encounter ${line.origin==='general'?'pb-encounter-general':'pb-encounter-related'}${line.origin==='booth'?' pb-encounter-booth':''}`;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
        el.innerHTML='<b class="pb-speech-speaker"></b><p></p><button class="pb-speech-reference" data-action="encounter-details">자세히 보기</button>';
        el.dataset.encounter=id;
        el.querySelector('.pb-speech-speaker').textContent=displayPersonName(line.speaker.name);
        el.querySelector('p').textContent=line.text;
        el.querySelector('[data-action="encounter-details"]').hidden=!speechContext(line,chapterData)&&!parseReference(line.ref)?.verses?.length;
        shell.querySelector('.pb-world-stage').append(el);encounterBubbles.set(id,el);
        el._line=line;
      }
      el._line=line;el.classList.toggle('pb-encounter-related',line.origin!=='general');el.classList.toggle('pb-encounter-general',line.origin==='general');el.classList.toggle('pb-encounter-booth',line.origin==='booth');
      el.querySelector('.pb-speech-speaker').textContent=displayPersonName(line.speaker.name);el.querySelector('p').textContent=line.text;
      const detail=el.querySelector('[data-action="encounter-details"]');detail.hidden=!speechContext(line,chapterData)&&!parseReference(line.ref)?.verses?.length;
    }
  }
  function positionEncounters(){
    const r=canvasLayoutRect(),v=view();
    const placed=[];
    for(const el of encounterBubbles.values()){
      const line=el._line;if(!line)continue;
      const anchor=interactionAnchor(line.speaker,TILE),x=(anchor.x*v.scale+v.x)*r.width/canvas.width,y=(anchor.y*v.scale+v.y)*r.height/canvas.height;
      if(x<0||x>r.width||y<0||y>r.height){el.style.visibility='hidden';continue;}
      const box=placeAboveHead(el,line.speaker,r,v,el.offsetWidth,el.offsetHeight,placed);
      if(box)placed.push(box);
    }
  }
  function placeAboveHead(el,n,r,v,width,height,placed=[]){
    const anchor=interactionAnchor(n,TILE);
    const scale=v.scale*r.width/canvas.width,x=(anchor.x*v.scale+v.x)*r.width/canvas.width,y=(anchor.y*v.scale+v.y)*r.height/canvas.height;
    const body=physiqueFor(n.name,n.role,n.refs),sprite={left:x-22*scale*body.width,right:x+22*scale*body.width,top:y-76*scale*body.height,bottom:y-24*scale*body.height};
    const gap=8,margin=4,characters=npcs.filter(other=>!other.creature||other.creature.kind!=='plant').map(other=>{
      const a=interactionAnchor(other,TILE),ox=(a.x*v.scale+v.x)*r.width/canvas.width,oy=(a.y*v.scale+v.y)*r.height/canvas.height,p=physiqueFor(other.name,other.role,other.refs);
      return {left:ox-22*scale*p.width,right:ox+22*scale*p.width,top:oy-76*scale*p.height,bottom:oy-24*scale*p.height};
    });
    const candidates=[
      {side:'top',left:x-width/2,top:sprite.top-height-gap,cost:0},
      {side:'top',left:x-width/2-30,top:sprite.top-height-gap,cost:1},
      {side:'top',left:x-width/2+30,top:sprite.top-height-gap,cost:1},
      {side:'left',left:sprite.left-width-gap,top:y-height/2,cost:2},
      {side:'right',left:sprite.right+gap,top:y-height/2,cost:2},
      {side:'bottom',left:x-width/2,top:sprite.bottom+gap,cost:3},
      ...placed.flatMap(box=>[{side:'left',left:box.left-width-gap,top:box.top,cost:4},{side:'right',left:box.right+gap,top:box.top,cost:4},{side:'top',left:box.left,top:box.top-height-gap,cost:4},{side:'bottom',left:box.left,top:box.bottom+gap,cost:4}]),
    ];
    let best=null;
    for(const candidate of candidates){
      const left=Math.max(margin,Math.min(r.width-width-margin,candidate.left)),top=Math.max(margin,Math.min(r.height-height-margin,candidate.top));
      const box={left,right:left+width,top,bottom:top+height};
      const overlapArea=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
      const actorOverlap=characters.reduce((sum,rect)=>sum+overlapArea(box,rect),0),bubbleOverlap=placed.reduce((sum,rect)=>sum+overlapArea(box,rect),0);
      const score=candidate.cost+actorOverlap*10+bubbleOverlap*12;
      if(!best||score<best.score)best={...box,score,side:candidate.side};
    }
    el.style.left=`${Math.round(best.left)}px`;el.style.top=`${Math.round(best.top)}px`;
    el.style.setProperty('--pb-tail',`${Math.max(12,Math.min(width-12,x-best.left))}px`);
    el.dataset.below=best.side==='bottom'?'true':'false';if(['left','right'].includes(best.side))el.dataset.side=best.side;else delete el.dataset.side;
    el.style.visibility='';
    return {left:best.left,right:best.right,top:best.top,bottom:best.bottom};
  }
  function positionSpeech(){
    if(!shownSpeech||speechElement.hidden)return;
    const stage=shell.querySelector('.pb-world-stage'),bounds=stage.getBoundingClientRect();
    const occupied=[...encounterBubbles.values()].filter(el=>el.isConnected&&!el.hidden&&el.style.visibility!=='hidden').map(el=>{const r=el.getBoundingClientRect();return {left:r.left-bounds.left,right:r.right-bounds.left,top:r.top-bounds.top,bottom:r.bottom-bounds.top};});
    placeAboveHead(speechElement,shownSpeech.speaker,canvasLayoutRect(),view(),speechElement.offsetWidth,speechElement.offsetHeight,occupied);
  }
  function canvasLayoutRect(){const r=canvas.getBoundingClientRect();return {left:0,top:0,width:canvas.offsetWidth||r.width,height:canvas.offsetHeight||r.height};}
  let backgroundKey=defaultBackground(requested);
  try{const saved=localStorage.getItem(backgroundStorageKey(model.key));if(Object.hasOwn(BACKGROUNDS,saved))backgroundKey=saved;}catch(_){}
  function setBackground(key){
    if(!Object.hasOwn(BACKGROUNDS,key))return;
    backgroundKey=key;terrain=sceneDecorations(backgroundKey).filter(o=>!objects.some(p=>Math.hypot(p.x-o.x,p.y-o.y)<2.5));indexObjects();clearTerrainOverlap();paintBackground();syncBackground();draw();
    try{localStorage.setItem(backgroundStorageKey(model.key),backgroundKey);}catch(_){}
  }
  let terrain=sceneDecorations(backgroundKey);
  const storageKey = `pixel-bible-layout:${model.key}`;
  const defaults = () => [{ kind: "field", x: 48, y: 27 }, { kind: "water", x: 43, y: 25 }, { kind: "bench", x: 35, y: 25 }, { kind: "tree", x: 26, y: 21 }, { kind: "tree", x: 54, y: 24 }, {kind:"love-booth",x:40,y:19}];
  let objects = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if(Array.isArray(saved)){
      objects=fitLayout(saved,OBJECTS);
      if(!objects.some(o=>o.kind==='love-booth')){
        const occupied=new Set([...objects,...terrain].map(o=>`${o.x},${o.y}`));let spot=null;
        for(let radius=0;radius<10&&!spot;radius++)for(let dy=-radius;dy<=radius&&!spot;dy++)for(let dx=-radius;dx<=radius;dx++){
          if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;const x=40+dx,y=19+dy;
          if(x>=BOUNDS.minX&&x<=BOUNDS.maxX&&y>=BOUNDS.minY&&y<=BOUNDS.maxY&&!occupied.has(`${x},${y}`)){spot={x,y};break;}
        }
        if(spot)objects.push({kind:'love-booth',...spot});
      }
    }
  } catch (_) {}
  terrain=terrain.filter(o=>!objects.some(p=>Math.hypot(p.x-o.x,p.y-o.y)<2.5));
  const positions=castPositions(visibleCast.length);
  const npcs = visibleCast.map((p, i) => ({ ...p, readingChapters:dialogueContext.people.filter(o=>occurrenceMatches(p,o)).map(o=>({code:o.code,chap:o.chap})), ...positions[i], prominent:prominent.has(castKey(p)), path: [], direction:"down", stride:0, idle: Math.random()*.4, motion:characterMotion(p,chapterData), action: "", task: null }));
  const castCache = new Map(npcs.map(n => [castKey(n), n]));
  let exposed=new Set(model.cast.map(castKey));
  try{
    const saved=JSON.parse(localStorage.getItem(exposureStorageKey(model.key)));
    if(Array.isArray(saved)&&saved.every(k=>typeof k==='string'))exposed=new Set(saved);
    const creatureMigration=`pixel-bible-creatures:${model.key}:v1`;
    if(!localStorage.getItem(creatureMigration)){
      for(const p of model.cast.filter(p=>p.creature))exposed.add(castKey(p));
      localStorage.setItem(creatureMigration,'done');
      localStorage.setItem(exposureStorageKey(model.key),JSON.stringify([...exposed]));
    }
  }catch(_){}
  const gimbapPerson=model.cast.find(p=>p.mascotId==='김밥');if(gimbapPerson)exposed.add(castKey(gimbapPerson));
  reconcileCast(npcs,model.cast.filter(p=>exposed.has(castKey(p))),castCache,()=>null);
  let drag=null, objectHold=null, suppressClick=false, toastTimer=null;
  let showRelationships=!!options.showRelationships;
  let removing=false,objectSpeech=null,autoObjectAt=2;
  const objectCooldown=new Map(),visitorCooldown=new Map();
  let selected = -1, placing = null, paused = false, sound = false, disposed = false, frame = 0, frameScheduled = false, frameErrorReported = false, last = 0, time = 0;
  let relationshipPrimary=null,relationshipPair=null;
  const waterRescueTimers=new Map();
  let activeEvent = null, pendingEvent = null, eventIndex = 0, cinematicTime = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let blockedCells=new Set();
  const indexObjects=()=>{blockedCells=new Set([...objects,...terrain].filter(o=>(OBJECT_CATALOG[o.kind]?.action||o.kind)!=='field'&&!['lily','fruit','net'].includes(o.kind)).map(o=>`${o.x},${o.y}`));};
  indexObjects();
  const blocked = (x,y)=>x<BOUNDS.minX||x>BOUNDS.maxX||y<BOUNDS.minY||y>BOUNDS.maxY||waterAt(backgroundKey,x,y)||blockedCells.has(`${x},${y}`);
  const boatFloat=(o,t=time)=>isBoat(o)&&waterAt(backgroundKey,o.x,o.y)?Math.round(Math.sin(t*1.7+o.x*.37)*1.4):0;
  function syncBoatFloat(){for(const o of [...objects,...terrain])if(isBoat(o))o.floatY=boatFloat(o);}
  function clearTerrainOverlap(){
    for(const n of npcs)if(!n.usingObject&&blocked(Math.round(n.x),Math.round(n.y))){
      let spot=null;for(let radius=1;radius<8&&!spot;radius++)for(let dy=-radius;dy<=radius&&!spot;dy++)for(let dx=-radius;dx<=radius;dx++){
        const x=Math.round(n.x)+dx,y=Math.round(n.y)+dy;if(!blocked(x,y)){spot={x,y};break;}
      }
      if(spot){Object.assign(n,spot);n.path=[];n.task=null;n.usingObject=null;n.interaction=null;n.action='';}
    }
  }
  clearTerrainOverlap();
  const say = (text) => {
    clearTimeout(toastTimer);info.innerHTML=`<p>${esc(text)}</p>`;info.hidden=false;
    toastTimer=setTimeout(()=>{info.hidden=true;},2000);
  };
  const clearInfo=()=>{clearTimeout(toastTimer);info.hidden=true;};
  function startWaterEscape(n,safe){
    const state=beginWaterEscape(n,safe),old=waterRescueTimers.get(n);if(old)clearTimeout(old);
    const timer=setTimeout(()=>{
      waterRescueTimers.delete(n);
      if(disposed||!npcs.includes(n)||n.waterEscape!==state||!rescueWaterEscape(n))return;
      say('휴우… 씩씩. 잠깐 숨을 고르고 있어요.');
      try{draw();}catch(error){console.warn('물가 화면 복구 중 그리기 오류',error);}
      scheduleFrame();
    },(state.duration+1)*1000);
    waterRescueTimers.set(n,timer);return state;
  }
  const save = () => { indexObjects();try { localStorage.setItem(storageKey, JSON.stringify(objects)); } catch (_) { say("배치는 이번 입장 동안 유지돼요. 기기 저장 공간을 확인해 주세요."); } };
  const cell = (p) => ({ x: Math.round(p.x), y: Math.round(p.y) });
  const adjacent = (o,n) => interactionApproaches(o).filter(p=>!blocked(p.x,p.y)).sort((a,b)=>Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y));
  let recommendationPerson=null,expandedCast=null;
  function renderRecommendations(person){
    recommendationPerson=person;
    const panel=shell.querySelector('.pb-recommendations'),items=recommendedCast(model,person);
    panel.hidden=false;
    shell.querySelector(`[data-toggle-person="${model.cast.findIndex(p=>castKey(p)===castKey(person))}"]`)?.closest('.pb-roster-row')?.after(panel);
    panel.innerHTML=`<h4>${esc(displayPersonName(person.name))} · 함께 표시할 추천 인물</h4>`+(items.length?items.map(({person:p,label})=>{
      const on=exposed.has(castKey(p));return `<button class="pb-button" data-add-person="${model.cast.indexOf(p)}" aria-pressed="${on}" aria-label="${esc(displayPersonName(p.name))} ${on?'숨기기':'표시하기'}">${on?'✓':'＋'} ${esc(displayPersonName(p.name))} <small>${esc(label)}</small></button>`;
    }).join(''):'<p class="pb-help">현재 분량의 관계도에 연결된 추가 인물이 없어요.</p>');
  }
  function syncExposure(){
    shell.querySelector('.pb-cast-count').textContent=`표시 중 ${npcs.length} / 전체 ${model.cast.length}명·집단`;
    shell.querySelectorAll('[data-cast-person]').forEach(b=>{
      const person=model.cast[Number(b.dataset.castPerson)];
      b.setAttribute('aria-expanded',expandedCast===castKey(person)&&recommendationPerson===person);
    });
    shell.querySelectorAll('[data-toggle-person]').forEach(b=>{const on=exposed.has(castKey(model.cast[Number(b.dataset.togglePerson)]));b.setAttribute('aria-pressed',on);b.textContent=on?'표시 중':'숨김';});
    for(const b of shell.querySelectorAll('[data-cast-mode]')){
      const list=b.dataset.castMode==='all'?model.cast:b.dataset.castMode==='major'?majorCast(model):b.dataset.castMode==='animals'?model.cast.filter(p=>p.creature?.kind==='animal'):b.dataset.castMode==='plants'?model.cast.filter(p=>p.creature?.kind==='plant'):[];
      b.setAttribute('aria-pressed',list.length===npcs.length&&list.every(p=>exposed.has(castKey(p))));
    }
  }
  function applyExposure(){
    const old=npcs[selected];
    const permanent=model.cast.filter(p=>p.mascotId==='김밥');
    for(const p of permanent)exposed.add(castKey(p));
    reconcileCast(npcs,model.cast.filter(p=>exposed.has(castKey(p))),castCache,()=>null);
    clearTerrainOverlap();
    if(loveBoothSession&&loveBoothSession.pair.some(person=>!npcs.includes(person)))finishLoveBooth();
    if((speech.current&&[speech.current.speaker,speech.current.target].filter(Boolean).some(n=>!npcs.includes(n)))||
       (pendingTalk&&[pendingTalk.choice.speaker,pendingTalk.choice.target].some(n=>!npcs.includes(n))))hideSpeech();
    if(objectSpeech&&!npcs.includes(objectSpeech.speaker))objectSpeech=null;
    if(pendingEvent?.actors.some(n=>!npcs.includes(n)))pendingEvent=null;
    if(activeEvent&&sceneActors(activeEvent.scene).some(n=>!n))endEvent();
    selected=old?npcs.indexOf(old):-1;
    if(!npcs.includes(relationshipPrimary)){relationshipPrimary=null;relationshipPair=null;}
    else if(relationshipPair?.some(person=>!npcs.includes(person)))relationshipPair=null;
    syncExposure();renderRecipes();draw();
    try{localStorage.setItem(exposureStorageKey(model.key),JSON.stringify([...exposed]));}catch(_){}
  }
  function togglePanel(side,open) {
    const panel=shell.querySelector(`#pb-${side}-panel`), button=shell.querySelector(`[data-action="toggle-${side}"]`);
    const show=open??panel.hidden;panel.hidden=!show;button.setAttribute('aria-expanded',show);
    button.textContent=side==='left'?(show?'인물 ◂':'인물 ▸'):(show?'도구 · 조합 ▸':'◂ 도구 · 조합');
  }
  bindOutsidePanelDismiss(shell,togglePanel,signal);
  function collapsePersonDetails(){
    expandedCast=null;recommendationPerson=null;
    shell.querySelector('.pb-recommendations').hidden=true;
    shell.querySelector('.pb-person-details').hidden=true;
    shell.querySelectorAll('[data-cast-person]').forEach(button=>button.setAttribute('aria-expanded','false'));
    select(-1);draw();
  }
  const recipeUnlocks=loadRecipeUnlocks(localStorage),recipeHintLevels=new Map();let hideRecipes=true;
  const dailyDone=()=>!!options.dailyReadingDone?.();
  const isRecipeLocked=scene=>recipeLocked(scene,{discovered:recipeUnlocks,dailyDone:dailyDone(),hide:hideRecipes});
  function renderRecipes() {
    const container=shell.querySelector('.pb-recipes');
    container.innerHTML=`<button class="pb-button" data-action="recipe-lock" aria-pressed="${hideRecipes}">${hideRecipes?'🔒 조합식 해금':'🔓 오늘의 조합식 보기'}</button><p class="pb-help">오늘 통독을 마치면 잠금을 풀 수 있어요. 직접 인물과 물건을 가까이 배치해 발견한 조합은 계속 열려요.</p>`+model.scenes.map((scene,i)=>{
      if(isRecipeLocked(scene)){
        const hintLevel=recipeHintLevels.get(recipeKey(scene))||0;
        const hints=Array.from({length:hintLevel},(_,j)=>recipeHint(scene,j+1,{objectNames:OBJECTS}));const hint=hintLevel? hints.map((line,j)=>`<p><b>힌트 ${j+1}</b> · ${esc(line)}</p>`).join(''):'<p>힌트는 3단계로 열려요. 본문 범위부터 필요한 물건, 인물 순서로 알려 드려요.</p>';
        return `<article class="pb-recipe pb-recipe-mystery"><b>🔒 숨겨진 본문 장면</b><div class="pb-recipe-layout" aria-label="필요한 인물과 물건의 실루엣">${scene.actors.map(()=>'<span class="pb-mystery-person" aria-label="인물 실루엣">♟</span>').join('')}${Array.from({length:1+(scene.requiresObjects?.length||0)},()=>'<span class="pb-mystery-object" aria-label="오브젝트 실루엣">◈</span>').join('')}</div><div class="pb-help" data-recipe-hint-text role="status">${hint}</div>${hintLevel<3?`<button class="pb-button" data-recipe-hint="${i}">힌트 보기 · ${hintLevel+1}/3</button>`:'<small>힌트를 모두 확인했어요.</small>'}</article>`;
      }
      const missing=scene.actors.filter(name=>!npcs.some(n=>n.name===name));
      const object=objects.find(o=>o.kind===scene.object);
      const ready=!missing.length&&!!object&&requiredObjectsNearby(scene,object,objects);
      const needs=[];if(missing.length)needs.push(`인물 표시: ${missing.join(', ')}`);if(!object)needs.push(`${objectPhrase(OBJECTS[scene.object])} 배치`);
      if(object&&!requiredObjectsNearby(scene,object,objects))needs.push('가까이 놓을 물건: '+(scene.requiresObjects||[]).map(kind=>OBJECTS[kind]).join(' · '));
      const reason=activeEvent?'장면이 진행 중이에요. 끝난 뒤 다시 눌러 주세요.':needs.length?`먼저 준비해 주세요 · ${needs.join(' · ')}`:'조합 가능';
      return `<article class="pb-recipe"><b>${esc(scene.title)}</b><div class="pb-recipe-layout">${scene.actors.map(name=>`<span>${esc(displayPersonName(name))}</span>`).join('')}<span>${esc(OBJECTS[scene.object])}</span>${(scene.requiresObjects||[]).map(kind=>`<span>${esc(OBJECTS[kind])}</span>`).join('')}</div><small>${esc(scene.ref)}</small><p class="pb-help">${esc(scene.objectNote || "")}</p><p>${ready&&!activeEvent?'✓ 조합 가능':esc(reason)}</p><button class="pb-button" data-recipe="${i}" aria-disabled="${ready&&!activeEvent?'false':'true'}" data-unavailable-reason="${esc(reason)}">이 조합으로 모으기</button></article>`;
    }).join('') + `<article class="pb-recipe"><b>누구나 사용할 수 있는 조합</b><p>${esc(npcs[selected]?.name||"인물을 먼저 선택하세요")} ＋ 오브젝트 → 일상 동작</p><div class="pb-world-toolbar">${[['bench','앉아 쉬기'],['water','물 마시기'],['field','이삭 줍기']].map(([kind,label])=>{const reason=activeEvent?'장면이 진행 중이에요. 끝난 뒤 다시 눌러 주세요.':!npcs[selected]?'인물을 먼저 선택해 주세요.':!objects.some(o=>o.kind===kind)?`${objectPhrase(OBJECTS[kind])} 먼저 놓아 주세요.`:npcs[selected].creature&&!creatureCanUse(npcs[selected],kind)?'이 생물은 이 오브젝트를 사용할 수 없어요.':`오브젝트 주변에 설 수 있는 자리를 비워 주세요.`;const ready=!activeEvent&&!!npcs[selected]&&objects.some(o=>o.kind===kind)&&(!npcs[selected].creature||creatureCanUse(npcs[selected],kind));return `<button class="pb-button" data-common-recipe="${kind}" aria-disabled="${ready?'false':'true'}" data-unavailable-reason="${esc(reason)}">${OBJECTS[kind]} · ${label}</button>`;}).join('')}</div><small>일상 동작은 창작이며 본문 사건과 구분해요.</small></article>` + ALL_SCENES.filter(scene=>!model.scenes.some(s=>s.id===scene.id)&&!hideRecipes&&dailyDone()).map(scene=>`<article class="pb-recipe pb-locked"><b>🔒 ${esc(scene.title)}</b><div class="pb-recipe-layout">${scene.actors.map(name=>`<span>${esc(displayPersonName(name))}</span>`).join('')}<span>${esc(OBJECTS[scene.object])}</span>${(scene.requiresObjects||[]).map(kind=>`<span>${esc(OBJECTS[kind])}</span>`).join('')}</div><small>${esc(scene.ref)} 본문에서 열려요.</small></article>`).join('');
  }
  function requestPersonal(n){
    if(!n)return;
    const lines=personalLines(n,chapterData,dialogueContext);
    if(!lines.length){hideSpeech();return;}
    // 클릭 요청은 같은 대사가 연달아 나와도 허용한다.
    cancelTalk();
    const now=performance.now();manualSpeechUntil=now+speech.duration;
    speech.interrupt(lines[Math.floor(Math.random()*lines.length)],now);
    updateSpeech(now);positionSpeech();
  }
  function updateRelationshipSelection(person){
    const next=advanceRelationshipSelection(model.relations,npcs,showRelationships?relationshipPrimary:null,showRelationships?relationshipPair:null,showRelationships?person:null);
    relationshipPrimary=next.primary;relationshipPair=next.pair;
  }
  function select(i, speakOnSelect=false) {
    updateRelationshipSelection(npcs[i]||null);
    selected = i;
    shell.querySelectorAll("[data-person]").forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.person) >= 0 && Number(b.dataset.person) === i));
    const n=npcs[i];
    if(!n){shell.querySelector('.pb-person-details').innerHTML='<p>인물을 선택하면 특징과 관계를 볼 수 있어요.</p>';renderRecipes();draw();return;}
    if(speakOnSelect){
      discover(n);
      const v=view(),anchor=interactionAnchor(n,TILE),sx=anchor.x*v.scale+v.x,sy=anchor.y*v.scale+v.y;
      if(sx<60||sx>canvas.width-60||sy<100||sy>canvas.height-60){camera.x=n.x*TILE;camera.y=n.y*TILE-36;constrainCamera(camera,canvas.width,canvas.height);syncCamera();}
      requestPersonal(n);
    }
    renderRecommendations(n);
    const style=characterStyle(n.name,i,n.role,n.refs,n.creature||false);
    shell.querySelector('.pb-person-details').innerHTML=`<h3>${esc(displayPersonName(n.name))}</h3><button class="pb-button" data-action="person-collection">발견 도감에서 보기</button><p class="pb-help">현재 분량: 연결 ${importanceFor(model,n).connections}명 · 관련 사건 ${importanceFor(model,n).events}개</p><p>${esc(n.role||'본문 속 인물')}</p><p>${esc(n.refs.join(', '))}</p><p class="pb-help">${esc(n.motion.evidence)}</p><p class="pb-help">${n.creature?(n.creature.kind==='plant'?'본문 속 식물':'본문 속 동물'):n.identity?.kind==='group'?'집단을 대표하는 상징 캐릭터':n.identity?.kind==='unresolved'?'인물 신원 추가 검토 중':n.identity?.kind==='spiritual'?'본문 속 존재의 상징 표현':'본문 인물'} · ${esc(n.identity?.id||'체험용 인물')}</p><h4>외형 근거</h4><p>${esc(style.physicalEvidence||'현재 본문에서 확정하지 않은 외모는 창작으로 표현해요.')}</p><p>${esc(style.physique?.evidence||'생물 고유 체형')}</p><p>${esc(style.wardrobeLabel||'생물 고유 외형')}</p><p>${esc(style.evidence)}</p><p class="pb-help">${esc(style.design)}</p><small>확인된 본문 특징과 창작 디자인을 구분해 표시해요.</small><p class="pb-help">캐릭터를 누른 채 끌면 집어 들 수 있어요. 빈 땅을 누르면 선택을 해제하고 자유롭게 거닐어요. 방향키로 직접 걸어갈 수도 있어요.</p>`;
    renderRecipes();if(!speakOnSelect)clearInfo();draw();
  }
  let discoveryIndex=null;
  function saveDiscoveries(){try{localStorage.setItem(DISCOVERY_KEY,JSON.stringify(discoveries));return true;}catch(_){say('도감은 이번 입장 동안 유지돼요. 기기 저장 공간을 확인해 주세요.');return false;}}
  function discover(person){
    if(person.creature||person.name==='읽는 사람')return;
    const key=discoveryKey(person),first=!discoveries[key];discoveries[key]=mergeDiscovery(discoveries[key],discoverySnapshot(person,model));const saved=saveDiscoveries();
    if(first&&saved)say(`${displayPersonName(person.name)} 발견! 도감에서 주변 인물과 이야기를 살펴보세요.`);
  }
  async function openCollection(key=null,storyLimit=20){
    hideSpeech();shell.querySelector('.pb-scripture')?.remove();
    const panel=document.createElement('section');panel.className='pb-scripture pb-collection';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','발견 도감');
    panel.innerHTML='<header><b>발견 도감 · 알아가기</b><button class="pb-button" data-action="close-scripture">닫기 ✕</button></header><div class="pb-scripture-body"></div>';
    shell.append(panel);panel.querySelector('button').focus();const body=panel.querySelector('.pb-scripture-body');body.textContent='도감을 준비하고 있어요…';
    if(!discoveryIndex)discoveryIndex=fetch(new URL('../../../data/pixel-bible/physical-audit.json',import.meta.url)).then(r=>r.ok?r.json():{}).then(d=>d.entries||[]).catch(()=>[]);
    const index=await discoveryIndex;if(!panel.isConnected)return;const record=discoveries[key];
    if(!record){
      const found=Object.values(discoveries).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
      body.innerHTML=`<label>도감 검색 <input type="search" data-discovery-search placeholder="이름으로 찾기"></label><label><input type="checkbox" data-discovery-favorites> 관심 인물만 보기</label><p role="status" data-discovery-count></p><p>발견한 인물 ${found.length}명 · 이 기기에 저장돼요.</p><p>월드에서 인물을 눌러 발견하세요. 같은 이름의 다른 인물은 따로 기록해요.</p><div class="pb-discovery-grid">${found.map(p=>`<button class="pb-button" data-discovery="${esc(p.key)}" data-discovery-name="${esc(p.name)}" data-favorite="${!!p.favorite}"><b>${p.favorite?'★ ':''}${esc(displayPersonName(p.name))}</b><small>${['','첫 만남','이야기 듣기','관계 알아가기','깊이 알아가기'][learningStage(p,discoveries)]}</small></button>`).join('')}</div>${!found.length?'<p>아직 발견한 인물이 없어요. 월드에서 한 사람을 눌러 보세요.</p>':''}<h3>이번 분량에서 만날 인물</h3><p>${model.cast.filter(p=>!p.creature&&!discoveries[discoveryKey(p)]).map(p=>esc(displayPersonName(p.name))).join(' · ')||'이번 분량의 인물을 모두 발견했어요.'}</p>`;
      const filter=()=>{const q=body.querySelector('[data-discovery-search]').value.trim(),favorites=body.querySelector('[data-discovery-favorites]').checked;let shown=0;body.querySelectorAll('[data-discovery-name]').forEach(b=>{b.hidden=!(b.dataset.discoveryName.includes(q)&&(!favorites||b.dataset.favorite==='true'));if(!b.hidden)shown++;});body.querySelector('[data-discovery-count]').textContent=`${shown}명 표시`;};body.querySelector('[data-discovery-search]').oninput=filter;body.querySelector('[data-discovery-favorites]').onchange=filter;filter();
    }else{
      const indexEntry=index.find(p=>p.id===record.identity?.id),counts=new Map();for(const ref of indexEntry?.occurrences||[]){const code=ref.split('.')[0];counts.set(code,(counts.get(code)||0)+1);}
      if(!counts.size)for(const ref of record.refs){const code=parseReference(ref)?.code;if(code)counts.set(code,(counts.get(code)||0)+1);}
      const mainBooks=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([code,count])=>`${typeof BOOKS!=='undefined'?(BOOKS.find(b=>b.code===code)?.name||code):code} · ${count}장`);
      const stage=learningStage(record,discoveries),count=Math.min(record.stories.length,stage===4?storyLimit:stage);
      const neighbors=[...new Map(record.relations.map(r=>[r.key,r])).values()];
      const family=record.relations.filter(r=>r.kind==='family'||/아들|딸|아버지|어머니|남편|아내|형제|자매|친족/.test(r.label));
      const relationHtml=r=>`<article class="pb-discovery-relation"><b>${esc(r.from)} → ${esc(r.to)} · ${esc(r.label)}</b><p>${esc(r.note||'현재 본문에서 연결되는 관계예요.')}</p><small>${esc(r.ref)}</small>${discoveries[r.key]?`<button class="pb-button" data-discovery="${esc(r.key)}">${esc(displayPersonName(r.name))} 도감 보기</button>`:'<small>아직 직접 만나지 않았어요.</small>'}</article>`;
      body.innerHTML=`<button class="pb-button" data-action="collection">← 발견한 인물 전체</button><h2>${esc(displayPersonName(record.name))}</h2>${renderPersonPreview({...record,role:record.roles?.[0]||'',creature:false})}<button class="pb-button" data-discovery-favorite="${esc(key)}" aria-pressed="${!!record.favorite}">${record.favorite?'★ 관심 인물 해제':'☆ 관심 인물 등록'}</button><p class="pb-help" role="status">${esc(learningNext(record,discoveries))}</p><progress max="4" value="${stage}" aria-label="알아가기 ${stage}단계"></progress><p>알아가기 ${stage}/4 · ${['','첫 만남','이야기 듣기','관계 알아가기','깊이 알아가기'][stage]}</p><p>이야기 읽기 ${record.read.length}개 · 만난 날 ${record.days.length}일 · 주변 인물 발견 ${neighbors.filter(r=>discoveries[r.key]).length}/${neighbors.length}</p><p class="pb-help">이야기 하나 읽기 → 주변 인물 만나기(관계 기록이 없으면 생략) → 다른 날 다시 만나고 이야기 2개 읽기로 진행해요. 성경 본문은 단계와 관계없이 언제든 읽을 수 있어요.</p><h3>쉽게 알아보기</h3><p>${esc(easyPersonDescription(record.name,record.roles?.[0]||''))}</p><h3>본문에서 맡은 역할</h3>${record.roles.map(role=>`<p>${esc(role)}</p>`).join('')}<h3>주요 등장 권</h3><p>${mainBooks.map(esc).join(' · ')||'현재 발견한 본문부터 확인해요.'}</p><small>앱 요약에서 확인된 등장 장 수 기준이에요. 실제 성경 발화량을 뜻하지 않아요.</small><h3>지금까지 만난 본문</h3><p>${record.refs.map(esc).join(' · ')}</p><h3>계보 · 가족 관계</h3>${family.length?family.map(relationHtml).join(''):'<p>지금까지 만난 본문에는 확인된 가족 관계가 없어요.</p>'}<h3>한 다리 주변 인물</h3>${neighbors.length?neighbors.map(relationHtml).join(''):'<p>현재 분량에 확인된 주변 인물이 없어요.</p>'}<h3>더 알아가는 이야기</h3><p class="pb-help">본문을 읽으며 만나는 사건들이 모여요. 실제 성경 발언이나 원문 인용이 아닌 짧은 상황 설명이에요.</p>${record.stories.slice(0,count).map((story,i)=>`<article class="pb-discovery-story"><p>${esc(story.text)}</p><small>${esc(story.ref)}</small><button class="pb-button" data-story="${i}" data-discovery-owner="${esc(key)}">${record.read.includes(storyKey(story))?'다시 읽기':'이야기 읽고 관련 구절 보기'}</button></article>`).join('')}${record.stories.length>count?(stage===4?`<button class="pb-button" data-more-stories="${esc(key)}" data-story-limit="${storyLimit+20}">이야기 더 보기 · ${record.stories.length-count}개 남음</button>`:`<p>다음 알아가기 단계에서 이야기 ${record.stories.length-count}개를 더 정리해 보여 드려요.</p>`):''}${!record.stories.length?'<p>현재 분량에서 확인된 사건 설명이 아직 없어요. 다른 본문에서 다시 만나면 내용이 더해져요.</p>':''}`;
      bindPersonPreview(body);
    }
    shell.append(panel);panel.querySelector('button').focus();
  }
  function move(n, goal, task = null, {running=false}={}) {
    if(n.creature?.kind==='plant')return false;
    encounters.cancel(n);
    if(pendingTalk||speech.current?.speaker===n||speech.current?.target===n)hideSpeech();
    const path = findPath(cell(n), goal, blocked);
    if (!path) return false;
    n.path = path; n.task = task; n.usingObject=null;n.interaction=null;n.objectScene=null;n.objectAction=null;n.objectEvidence=null;n.action = ""; n.running=running;n.idle = 5;
    return true;
  }
  function toObject(n, o) {
    if(npcs.some(other=>other!==n&&(other.usingObject===o||other.task===o)))return false;
    if(n.creature&&!creatureCanUse(n,o.kind))return false;
    for (const p of adjacent(o,n)) if (move(n,p,o)) {n.objectEvidence=propEvidence(n,o.kind);return true;}
    return false;
  }
  function speak(text) {
    if (!sound || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = "ko-KR"; u.rate = .9;
    speechSynthesis.speak(u);
  }
  let closeCinematic=null,eventOffer=null;
  const offeredAutomatic=new Set();
  const offerCard=document.createElement('div');offerCard.className='pb-event-offer';offerCard.hidden=true;shell.append(offerCard);
  function offerEvent(scene,o,automatic=false){if(activeEvent||pendingEvent||eventOffer?.scene.id===scene.id||automatic&&offeredAutomatic.has(scene.id))return;if(automatic)offeredAutomatic.add(scene.id);eventOffer={scene,o};offerCard.hidden=false;offerCard.innerHTML=`<b>${esc(scene.title)}</b><button class="pb-button" data-action="watch-event">▶ 사건 보기</button><button class="pb-button" data-action="dismiss-event">나중에</button>`;}

  function showLine() {
    const ev = activeEvent;
    ev.elapsed = 0;
    const runningCanvas=eventCard.querySelector('.pb-event-playback');if(runningCanvas)runningCanvas.remove();
    eventCard.innerHTML = `<b>${esc(ev.scene.title)}</b><p>${esc(ev.scene.lines[ev.step])}</p><small>${esc(ev.scene.ref)} · 본문 뜻풀이</small>${ev.scene.study?`<details><summary>본문과 주석 해설</summary><p>${esc(ev.scene.study)}</p><p>${esc(ev.scene.objectNote || "")}</p></details>`:""}<div class="pb-event-actions"><button class="pb-button" data-action="next">${ev.step === ev.scene.lines.length-1 ? "장면 마치기" : "다음"}</button> <button class="pb-button" data-action="event-pause">${ev.paused?'▶ 계속':'Ⅱ 일시정지'}</button> <button class="pb-button" data-action="skip">닫기</button></div>`;
    if(runningCanvas)eventCard.prepend(runningCanvas);else if(!closeCinematic)closeCinematic=mountScenePlayback(eventCard,ev.scene,model.cast,{clips:ev.scene.verseClips||[],onChange:({isVerse})=>{ev.elapsed=0;ev.manualClip=isVerse;}});
    speak(ev.scene.lines[ev.step]);
  }
  function beginEvent(scene) {
    shell.classList.add('pb-event-playing');
    eventOffer=null;offerCard.hidden=true;hideSpeech();encounters.clear();
    recipeUnlocks.add(recipeKey(scene));try{localStorage.setItem(RECIPE_KEY,JSON.stringify([...recipeUnlocks]));}catch(_){}
    activeEvent = { scene, object:pendingEvent?.o, step: 0, elapsed: 0, home:{...camera} }; cinematicTime = 0; pendingEvent = null;updateEncounters(performance.now());
    sceneActors(scene).forEach((n) => { n.path=[];n.task=null;n.eventRoutine=eventRoutine(scene,n);n.eventObjects=objects.filter(o=>(scene.requiresObjects||[]).includes(o.kind)&&Math.hypot(o.x-activeEvent.object.x,o.y-activeEvent.object.y)<=3.5);n.eventPartner=sceneActors(scene).find(other=>other.name===scene.eventMotion?.target)||sceneActors(scene).find(other=>other!==n);n.action=scene.actions ? (scene.actions[n.name] || "") : scene.object;n.usingObject=n.action?(n.action===scene.object?activeEvent.object:n.eventObjects.find(o=>o.kind===n.action)||activeEvent.object):null;n.objectAction=scene.id;n.interaction=n.action?interactionRoutine(n,n.action):null;n.interactionStart=time; });
    if(activeEvent.object){camera.x=activeEvent.object.x*TILE;camera.y=activeEvent.object.y*TILE-36;constrainCamera(camera,canvas.width,canvas.height);syncCamera();}
    clearInfo();overlay.hidden = false; renderRecipes();showLine();

  }
  function endEvent() {shell.classList.remove('pb-event-playing');if(activeEvent?.home){Object.assign(camera,activeEvent.home);constrainCamera(camera,canvas.width,canvas.height);syncCamera();}closeCinematic?.();closeCinematic=null; if(activeEvent)sceneActors(activeEvent.scene).filter(Boolean).forEach(n=>{n.action="";n.usingObject=null;n.interaction=null;n.objectAction=null;n.eventRoutine=null;n.eventObjects=null;n.eventPartner=null;n.idle=5;}); activeEvent = null; pendingEvent = null; overlay.hidden = true; if (sound) speechSynthesis.cancel(); }
  function discoverPlacedRecipe(object){
    if(activeEvent||pendingEvent)return;
    for(const scene of model.scenes){
      if(!isRecipeLocked(scene)||![scene.object,...(scene.requiresObjects||[])].includes(object.kind))continue;
      const center=objects.find(o=>o.kind===scene.object&&recipeAssembled(scene,npcs,o,objects));
      if(center){offerEvent(scene,center,true);return;}
    }
  }
  // 각 프레임에 확인해, 인물이 걸어 들어와 조합이 완성되는 경우도 놓치지 않는다.
  function checkAssembledRecipes(){
    if(activeEvent||pendingEvent)return new Set();
    const waiting=new Set();
    for(const scene of model.scenes){
      if(!isRecipeLocked(scene))continue;
      const center=objects.find(o=>o.kind===scene.object&&requiredObjectsNearby(scene,o,objects));
      if(!center)continue;
      const actors=scene.actors.map(name=>npcs.find(n=>n.name===name));
      if(actors.some(n=>!n||n.waterEscape||n.waterHuff))continue;
      for(const n of actors)if(Math.hypot(n.x-center.x,n.y-center.y)<=3.5)waiting.add(n);
      if(recipeAssembled(scene,npcs,center,objects)){offerEvent(scene,center,true);return new Set(actors);}
    }
    return waiting;
  }
  function offerEventReady(){const pending=pendingEvent;pendingEvent=null;offerEvent(pending.scene,pending.o);}
  function sceneActors(scene) { return scene.actors.map((name) => npcs.find((n) => n.name === name)); }
  function queueScene(scene, o) {
    if(!requiredObjectsNearby(scene,o,objects)){say('보조 물건도 중심 물건 가까이에 배치해 주세요.');return;}
    const actors = sceneActors(scene);
    if (actors.some((n) => !n)) { say("이번 분량에는 장면에 필요한 인물이 없어요."); return; }
    const reserved = new Set();
    const routes = actors.map((n) => {
      for (const p of adjacent(o,n)) {
        const key = `${p.x},${p.y}`;
        if (!reserved.has(key) && findPath(cell(n),p,blocked)) { reserved.add(key); return {n,p}; }
      }
      return null;
    });
    if (routes.some((r) => !r)) { say("장면으로 가는 길을 비워 주세요."); return; }
    if(paused){paused=false;const button=shell.querySelector('[data-action="pause"]');button.setAttribute('aria-pressed','false');button.textContent='일시정지';}
    routes.forEach(({n,p}) => move(n,p,o));
    pendingEvent = { scene, actors, o };togglePanel("right",false);
    clearInfo();
  }
  function interact(n,o) {
    if(n.creature&&!creatureCanUse(n,o.kind)){clearInfo();return;}
    const candidates=model.scenes.filter(s=>s.object===o.kind&&s.actors.includes(n.name)&&sceneActors(s).every(Boolean));
    const scene=candidates.find(s=>isRecipeLocked(s)&&recipeAssembled(s,npcs,o,objects))||candidates.find(s=>!isRecipeLocked(s));
    if (scene) return offerEvent(scene,o);
    checkAssembledRecipes();if(eventOffer)return;
    if(npcs.some(other=>other!==n&&(other.usingObject===o||other.task===o))){say('다른 인물이 사용 중이에요. 잠시 기다려 주세요.');return;}
    clearInfo();
    if (!toObject(n,o)) say("가는 길이 막혀 있어요. 다른 오브젝트나 빈 곳을 선택해 주세요.");
  }
  const cssLandscape = () => !!shell.closest('dialog')?.classList.contains('pb-css-landscape');
  function coordinates(e) {
    const point=clientToCanvasPoint(e.clientX,e.clientY,canvas.getBoundingClientRect(),canvas.width,canvas.height,cssLandscape()),v=view();
    return {x:(point.x-v.x)/v.scale/TILE,y:(point.y-v.y)/v.scale/TILE};
  }
  function hitPerson(p,touch=false) {
    const point={x:p.x*TILE,y:p.y*TILE};
    return npcs.map((n,i)=>({n,i,anchor:interactionAnchor(n,TILE)})).sort((a,b)=>b.anchor.y-a.anchor.y).find(({n,i,anchor})=>{
      if(Math.abs(anchor.x-point.x)>90||Math.abs(anchor.y-point.y)>150)return false;
      let ip=n.interaction?interactionPose(n.interaction,time-(n.interactionStart||0),reduced):null;
      const rise=(n.objectAction==='zacchaeus-tree'||ip?.actual==='climb')?36+(ip?.climb||0):0;
      const pose=motionPose(n.motion,n.stride,!!n.path.length,time),x=anchor.x+pose.x,y=anchor.y+pose.y-rise;
      const dx=point.x-x,dy=point.y-(y-28),angle=-pose.tilt-(ip?.actual==='lie-stone'&&[1,2].includes(ip.phase)?Math.PI/2:0);
      const local={x:x+dx*Math.cos(angle)-dy*Math.sin(angle),y:y-28+dx*Math.sin(angle)+dy*Math.cos(angle)};
      if(ip&&(heldObject(n,time,reduced)||ip.wearing))ip={...ip,heldObject:true};
      return drawPixelCharacter(null,characterStyle(n.name,i,n.role,n.refs,n.creature||false),x,y,{scale:2,direction:n.direction||'down',walkFrame:n.path.length?Math.floor((n.stride||0)*2)%4:0,interaction:ip,expression:n.expression,hitTest:local,hitPadding:touch?5:0});
    })?.i??-1;
  }
  function hitPlacedObject(p,touch=false) {
    const point={x:p.x*TILE,y:p.y*TILE};
    return [...objects].sort((a,b)=>b.y-a.y).find(o=>{
      const frame=objectInteractionFrame(o,npcs,time+cinematicTime,reduced);if(frame.actor&&objectWorn(frame.actor,time+cinematicTime,reduced))return false;const held=frame.actor&&heldObject(frame.actor,time+cinematicTime,reduced);
      return hitWorldObject(held||o,point,held?.frame||frame,touch?12:0);
    });
  }
  function beginObjectHold(o,e,p) {
    const actor=npcs.find(n=>n.usingObject===o),visual=actor&&heldObject(actor,time+cinematicTime,reduced);
    const origin=visual||o;
    const held={o,frame:visual?.frame,grab:grabOffset(p,origin),id:e.pointerId,startX:e.clientX,startY:e.clientY,p,client:{x:e.clientX,y:e.clientY},active:false};
    objectHold=held;canvas.setPointerCapture(e.pointerId);
    held.timer=setTimeout(()=>{
      if(objectHold!==held||disposed||!options.allowed()||activeEvent||document.hidden)return;
      held.active=true;suppressClick=true;canvas.dataset.dragging='true';shell.querySelector('.pb-trash-drop').hidden=false;
      hideSpeech();
      removeObjects([o],[...castCache.values()],()=>true);
      if(pendingEvent?.o===o)pendingEvent=null;
      if(objectSpeech?.object===o)objectSpeech=null;
      objectCooldown.delete(o);
      say('오브젝트를 집었어요. 빈 땅으로 끌어 옮겨 놓아 주세요.');draw();
    },400);
  }
  function objectLanding(held) {
    const origin=grabbedOrigin(held);return {x:Math.round(origin.x),y:Math.round(origin.y)};
  }
  function finishObjectHold(e,cancel=false) {
    if(!objectHold||objectHold.id!==e.pointerId)return;
    const held=objectHold;if(!cancel)held.p=coordinates(e);objectHold=null;clearTimeout(held.timer);delete canvas.dataset.dragging;
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(!held.active){if(cancel)suppressClick=true;return;}
    suppressClick=true;
    const under=document.elementFromPoint(e.clientX,e.clientY),p=objectLanding(held),trash=shell.querySelector('.pb-trash-drop'),trashRect=trash.getBoundingClientRect();
    if(!cancel&&options.allowed()&&held.active&&e.clientX>=trashRect.left&&e.clientX<=trashRect.right&&e.clientY>=trashRect.top&&e.clientY<=trashRect.bottom){const result=removeObjects(objects,[...castCache.values()],candidate=>candidate===held.o);objects=result.remaining;if(pendingEvent?.o===held.o)pendingEvent=null;if(objectSpeech?.object===held.o)objectSpeech=null;objectCooldown.delete(held.o);save();renderRecipes();say(result.removed.length?'오브젝트를 버렸어요.':'오브젝트를 찾지 못했어요.');draw();return;}
    if(!cancel&&options.allowed()&&under===canvas&&canMoveObject(held.o,p,[...objects,...terrain],npcs,{waterAt:(x,y)=>waterAt(backgroundKey,x,y)})){
      Object.assign(held.o,p);save();renderRecipes();clearInfo();discoverPlacedRecipe(held.o);
    }else if(!cancel)say('다른 물건·인물·이동 경로와 겹치지 않는 빈 땅에 놓아 주세요.');
    draw();
  }
  const pointers=new Map();let pinch=null,pan=null,gestureActive=false;
  const pixelPoint=e=>clientToCanvasPoint(e.clientX,e.clientY,canvas.getBoundingClientRect(),canvas.width,canvas.height,cssLandscape());
  const pair=()=>[...pointers.values()].slice(0,2);
  const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  function syncCamera(){
    canvas.dataset.cameraX=String(Math.round(camera.x));canvas.dataset.cameraY=String(Math.round(camera.y));canvas.dataset.zoom=String(camera.zoom);
  }

  canvas.addEventListener('wheel',e=>{e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);zoomAt(camera,camera.zoom*Math.exp(-delta*.0015),pixelPoint(e),canvas.width,canvas.height);syncCamera();draw();},{signal,passive:false});
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0||!options.allowed()||loveBoothSession)return;
    const point=pixelPoint(e);pointers.set(e.pointerId,point);
    if(pointers.size>=2){
      canvas.setPointerCapture?.(e.pointerId);
      if(objectHold)finishObjectHold({pointerId:objectHold.id,clientX:e.clientX,clientY:e.clientY},true);
      if(drag)finishDrag({pointerId:drag.id,clientX:e.clientX,clientY:e.clientY},true);
      pan=null;gestureActive=true;suppressClick=true;
      const [a,b]=pair(),mid=midpoint(a,b);
      pinch={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:camera.zoom,anchor:toWorld(mid,canvas.width,canvas.height,camera)};
      e.preventDefault();e.stopImmediatePropagation();return;
    }
    if(!placing&&!removing&&!activeEvent&&hitPerson(coordinates(e),e.pointerType==='touch')<0&&!hitPlacedObject(coordinates(e),e.pointerType==='touch')){
      const rect=canvasLayoutRect();pan={id:e.pointerId,start:point,last:point,active:false,slop:touchSlopPixels(canvas.width,rect.width)};
    }
  },{capture:true,signal});
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const point=pixelPoint(e);pointers.set(e.pointerId,point);
    if(pinch&&pointers.size>=2){
      const [a,b]=pair(),mid=midpoint(a,b),ratio=Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance;
      pinchCamera(camera,pinch.anchor,pinch.zoom*ratio,mid,canvas.width,canvas.height);syncCamera();draw();e.preventDefault();e.stopImmediatePropagation();return;
    }
    if(gestureActive){e.stopImmediatePropagation();return;}
    if(pan?.id===e.pointerId){
      // Ignore touch jitter so a tap remains a tap on iOS Safari.
      if(Math.hypot(point.x-pan.start.x,point.y-pan.start.y)>pan.slop)pan.active=true;
      if(pan.active){const v=view();camera.x-=(point.x-pan.last.x)/v.scale;camera.y-=(point.y-pan.last.y)/v.scale;constrainCamera(camera,canvas.width,canvas.height);syncCamera();draw();e.preventDefault();}
      pan.last=point;
    }
    if(drag)drag.client={x:e.clientX,y:e.clientY};
    if(objectHold)objectHold.client={x:e.clientX,y:e.clientY};
  },{capture:true,signal});
  const endGesture=e=>{
    const consume=gestureActive||pan?.active;
    if(consume)suppressClick=true;
    pointers.delete(e.pointerId);
    if(pointers.size<2)pinch=null;
    if(pan?.id===e.pointerId)pan=null;
    if(!pointers.size)gestureActive=false;
    if(consume){e.preventDefault();e.stopImmediatePropagation();if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);}
  };
  canvas.addEventListener('pointerup',endGesture,{capture:true,signal});canvas.addEventListener('pointercancel',endGesture,{capture:true,signal});canvas.addEventListener('lostpointercapture',endGesture,{capture:true,signal});
  function keepInView(n){
    const v=view(),anchor=interactionAnchor(n,TILE),px=anchor.x*v.scale+v.x,py=anchor.y*v.scale+v.y;
    const mx=Math.min(100,canvas.width/4),top=Math.min(150,canvas.height/3),bottom=canvas.height-100;
    camera.x+=(px<mx?px-mx:px>canvas.width-mx?px-(canvas.width-mx):0)/v.scale;
    camera.y+=(py<top?py-top:py>bottom?py-bottom:0)/v.scale;
    constrainCamera(camera,canvas.width,canvas.height);syncCamera();
  }
  function followDraggedCharacter(dt){
    const held=drag?.active?drag:objectHold?.active?objectHold:null;
    if(!held?.client)return;
    const rect=canvas.getBoundingClientRect(),scale=view().scale*rect.width/canvas.width;
    const delta=edgePan(held.client,rect,dt,scale);
    if(!delta.x&&!delta.y)return;
    camera.x+=delta.x;camera.y+=delta.y;constrainCamera(camera,canvas.width,canvas.height);held.p=coordinates({clientX:held.client.x,clientY:held.client.y});syncCamera();
  }
  canvas.addEventListener('pointerdown',(e)=>{
    if (drag||objectHold) return;
    suppressClick=false;
    if(!options.allowed()||activeEvent||placing||removing||e.button!==0)return;
    const touch=e.pointerType==='touch',point=coordinates(e),index=hitPerson(point,touch),object=hitPlacedObject(point,touch);
    if(object&&(index<0||npcs.some(n=>n.usingObject===object&&heldObject(n,time,reduced))||object.y*TILE>interactionAnchor(npcs[index],TILE).y)){beginObjectHold(object,e,point);return;}
    if(index<0)return;
    select(index);const n=npcs[index];
    if(n.waterEscape){suppressClick=true;say('물가로 올라오는 중이에요. 잠시만 기다려 주세요.');return;}

    const anchor=interactionAnchor(n,TILE),pose=motionPose(n.motion,n.stride,!!n.path.length,time);
    const snapshot=n.interaction?interactionPose(n.interaction,time-(n.interactionStart||0),reduced):null;
    const rise=(n.objectAction==='zacchaeus-tree'||snapshot?.actual==='climb')?36+(snapshot?.climb||0):0;
    drag={snapshot,captureAngle:pose.tilt+(snapshot?.actual==='lie-stone'&&[1,2].includes(snapshot.phase)?Math.PI/2:0),expression:n.expression,walkFrame:n.path.length?Math.floor(n.stride*2)%4:0,grab:grabOffset(point,{x:(anchor.x+pose.x)/TILE,y:(anchor.y+pose.y-rise)/TILE}),direction:n.direction,n,index,id:e.pointerId,active:false,startX:e.clientX,startY:e.clientY,p:coordinates(e),from:{x:n.x,y:n.y},fromCamera:{...camera},client:{x:e.clientX,y:e.clientY},vx:0,lastX:e.clientX};
    canvas.setPointerCapture(e.pointerId);
  },{signal});
  canvas.addEventListener('pointermove',(e)=>{
    if(objectHold?.id===e.pointerId){
      if(!objectHold.active&&Math.hypot(e.clientX-objectHold.startX,e.clientY-objectHold.startY)>8){finishObjectHold(e,true);return;}
      if(objectHold.active){e.preventDefault();objectHold.p=coordinates(e);draw();}return;
    }
    if(!drag||e.pointerId!==drag.id)return;
    if(!drag.active&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6){hideSpeech();drag.active=true;pendingEvent=null;drag.n.loveBooth=null;drag.n.path=[];drag.n.task=null;drag.n.action='';drag.n.usingObject=null;drag.n.interaction=null;canvas.dataset.dragging='true';say(`${objectPhrase(drag.n.name)} 집어 들었어요. 빈 땅이나 오브젝트에 내려놓아 보세요.`);}
    if(drag.active){e.preventDefault();drag.vx=drag.vx*.65+(e.clientX-drag.lastX)*.35;drag.lastX=e.clientX;drag.p=coordinates(e);draw();}
  },{signal});
  function finishDrag(e,cancel=false) {
    if(!drag||e.pointerId!==drag.id)return;
    const held=drag;drag=null;delete canvas.dataset.dragging;
    pointers.delete(e.pointerId);if(pointers.size<2)pinch=null;if(pan?.id===e.pointerId)pan=null;if(!pointers.size)gestureActive=false;
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(!held.active){if(!cancel)requestPersonal(held.n);suppressClick=true;return;}
    suppressClick=true;
    const n=held.n,p=coordinates(e),under=document.elementFromPoint(e.clientX,e.clientY);
    if(cancel||!options.allowed()||under?.closest('.pb-side,.pb-world-head,.pb-side-toggle')){n.x=held.from.x;n.y=held.from.y;n.idle=5;Object.assign(camera,held.fromCamera);syncCamera();draw();return;}
    held.p=p;const origin=grabbedOrigin(held);
    const landing={x:Math.max(BOUNDS.minX,Math.min(BOUNDS.maxX,Math.round(origin.x))),y:Math.max(BOUNDS.minY,Math.min(BOUNDS.maxY,Math.round(origin.y)))};
    const obj=objects.find(o=>Math.hypot(o.x-landing.x,o.y-landing.y)<1.6||Math.hypot(o.x-p.x,o.y-p.y)<1.3);
    const stage=loveBooth();
    if(stage&&Math.hypot(stage.x-landing.x,stage.y-landing.y)<2.4){
      const occupied=boothPair(),slot=boothSlots(stage).find(s=>!occupied.some(other=>Math.hypot(other.x-s.x,other.y-s.y)<.2));
      if(!slot){n.x=held.from.x;n.y=held.from.y;n.loveBooth=null;say('무대에는 두 사람까지 올라갈 수 있어요.');draw();return;}
      else{Object.assign(n,slot);n.loveBooth=stage;n.path=[];n.task=null;n.usingObject=null;n.interaction=null;faceBoothFront([n]);keepInView(n);startLoveBooth();updateEncounters(performance.now());draw();return;}
    }
    const boat=[...objects,...terrain].find(o=>isBoat(o)&&waterAt(backgroundKey,o.x,o.y)&&(Math.hypot(o.x-landing.x,o.y-landing.y)<2||Math.hypot(o.x-p.x,o.y-p.y)<1.5));
    n.boatRide=null;
    if(boat){
      n.x=boat.x;n.y=boat.y+1;n.boatRide=boat;n.path=[];n.task=null;n.usingObject=null;n.waterEscape=null;n.idle=8;draw();return;
    }
    if(obj){
      const spot=adjacent(obj,landing)[0];
      if(spot){n.x=spot.x;n.y=spot.y;n.idle=8;keepInView(n);interact(n,obj);updateEncounters(performance.now());draw();return;}
    }
    if(!n.creature&&waterAt(backgroundKey,landing.x,landing.y)){const safe=dryLanding(backgroundKey,landing,blocked);if(safe){n.x=landing.x;n.y=landing.y;startWaterEscape(n,safe);say('첨벙! 잠시 뒤 물가로 올라와요.');draw();return;}}
    if(blocked(landing.x,landing.y)){
      n.x=held.from.x;n.y=held.from.y;say('여기는 오브젝트가 있는 자리예요. 빈 땅에 내려놓아 주세요.');
    }else{n.x=landing.x;n.y=landing.y;n.idle=8;clearInfo();}
    keepInView(n);updateEncounters(performance.now());draw();
  }
  canvas.addEventListener('pointerup',e=>{finishObjectHold(e);finishDrag(e);},{signal});
  canvas.addEventListener('pointercancel',e=>{finishObjectHold(e,true);finishDrag(e,true);},{signal});
  canvas.addEventListener('lostpointercapture',e=>{finishObjectHold(e,true);if(drag)finishDrag(e,true);},{signal});
  canvas.addEventListener('contextmenu',e=>{if(objectHold)e.preventDefault();},{signal});
  canvas.addEventListener("pointerup", (e) => {
    if (drag) return;
    if(suppressClick){suppressClick=false;return;}
    if (!options.allowed() || activeEvent) return;
    const p = coordinates(e), x = Math.round(p.x), y = Math.round(p.y);
    if(removing){
      const object=objects.map(o=>({o,d:Math.hypot(o.x-p.x,o.y-p.y)})).filter(v=>v.d<1.8).sort((a,b)=>a.d-b.d)[0]?.o;
      if(object)demolish(o=>o===object);else say('철거할 오브젝트의 밑부분을 눌러 주세요.');
      return;
    }
    if (placing) {
      const boat=isBoat({kind:placing}),wet=waterAt(backgroundKey,x,y);
      if ((!boat&&wet)||blockedCells.has(`${x},${y}`)||objects.some((o) => Math.hypot(o.x-x,o.y-y)<1.1) || npcs.some((n) => Math.hypot(n.x-x,n.y-y)<1)) return say(boat?'배는 물 위의 빈 곳에 놓아 주세요.':'나무·인물과 겹치지 않는 빈 땅을 골라 주세요.');
    const addedObject={kind:placing,x,y};objects.push(addedObject); save(); renderRecipes(); placing = null; autoObjectAt=Math.min(autoObjectAt,time+.5);syncPlacement();discoverPlacedRecipe(addedObject); say("오브젝트를 놓았어요. 0.4초 꾹 누르면 위치를 옮길 수 있어요."); return;
    }
    shell.querySelector('.pb-trash-drop').hidden=true;
    const hit=hitPerson(p,e.pointerType==='touch');
    if (hit >= 0) {
      if (hit !== selected) {
        select(hit,true);

      } else select(hit,true);
      return;
    }
    const tapTolerance=e.pointerType==='touch'?1.6:1.1;
    const o=objects.find((o) => Math.abs(o.x-p.x)<tapTolerance && Math.abs(o.y-p.y)<tapTolerance);
    pendingEvent=null;
    const n=npcs[selected];
    if (o) {relationshipPrimary=null;relationshipPair=null;if(n)interact(n,o);else draw();return;}
    // 배경 탭은 현재 말풍선을 즉시 닫는다.
    dismissAllBubbles();
    // 배경 클릭은 이동 명령이 아니다. 기존 자연 이동을 유지하며 선택만 해제한다.
    if(n)n.idle=Math.min(n.idle,1);
    select(-1);draw();
  }, {signal});
  canvas.addEventListener("keydown", (e) => {
    if (drag||objectHold) return;
    if (!options.allowed() || activeEvent) return;
    const delta={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];
    const n=npcs[selected];
    if(!n)return;
    if (delta) { e.preventDefault(); pendingEvent=null; const p=cell(n); p.x+=delta[0];p.y+=delta[1]; if (!blocked(p.x,p.y)) move(n,p); }
    if (e.key==="Enter") { e.preventDefault(); const o=[...objects].sort((a,b)=>Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y))[0]; if(o) interact(n,o); }
  }, {signal});
  let objectChoicePress=null,longPressClick=null;
  function stopObjectChoicePress(press,completed=false) {
    if(!press||objectChoicePress!==press)return;
    clearTimeout(press.timer);press.button.classList.remove('is-holding');
    if(completed){press.button.classList.remove('is-details');press.button.blur();longPressClick={button:press.button,id:press.id,until:performance.now()+900};setTimeout(()=>{if(longPressClick?.button===press.button)longPressClick=null;},950);}
    objectChoicePress=null;
  }
  function showObjectDetails(kind) {
    const prop=chapterProps.find(item=>item.id===kind),entry=OBJECT_CATALOG[kind],box=shell.querySelector('[data-object-detail]');
    const name=prop?.name||entry?.name||OBJECTS[kind]||kind;
    const description=prop?.description||entry?.description||prop?.evidence?.[0]?.text||'이 오브젝트는 현재 분량에서 사용할 수 있어요.';
    const refs=[...new Set([...(prop?.descriptionRefs||[]),...(prop?.refs||[]),...(entry?.descriptionRefs||[])])];
    const button=[...shell.querySelectorAll('[data-place]')].find(b=>b.dataset.place===kind);
    if(button){
      const grid=button.closest('.pb-object-grid');
      const row=[...grid.querySelectorAll('.pb-object-choice')].filter(b=>Math.abs(b.offsetTop-button.offsetTop)<3);
      row[row.length-1].after(box);
    }
    box.innerHTML=`<b>${esc(name)}</b><p>${esc(description)}</p>${refs.length?`<small>${esc(refs.join(' · '))}</small>`:''}`;box.hidden=false;box.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  document.addEventListener('pointerdown',e=>{
    const button=e.target.closest('.pb-object-choice');if(!button||!shell.contains(button)||e.button!==0)return;
    if(objectChoicePress)stopObjectChoicePress(objectChoicePress);
    const press={button,id:e.pointerId,x:e.clientX,y:e.clientY,completed:false,timer:0};objectChoicePress=press;
    button.classList.remove('is-details');button.classList.add('is-holding');
    press.timer=setTimeout(()=>{if(objectChoicePress!==press)return;press.completed=true;stopObjectChoicePress(press,true);showObjectDetails(button.dataset.place);},1000);
  },{signal});
  document.addEventListener('pointermove',e=>{const press=objectChoicePress;if(press?.id===e.pointerId&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>10)stopObjectChoicePress(press);},{signal});
  document.addEventListener('pointerup',e=>{if(objectChoicePress?.id===e.pointerId)stopObjectChoicePress(objectChoicePress,objectChoicePress.completed);},{signal});
  document.addEventListener('pointercancel',e=>{if(objectChoicePress?.id===e.pointerId)stopObjectChoicePress(objectChoicePress);if(longPressClick?.id===e.pointerId)longPressClick=null;},{signal});
  function syncPlacement() {
    shell.querySelectorAll("[data-place]").forEach((b)=>b.setAttribute("aria-pressed",b.dataset.place===placing));
    shell.querySelectorAll('[data-action="cancel-place"]').forEach(b=>b.hidden=!placing);
  }
  shell.addEventListener('change',e=>{
    const select=e.target.closest('[data-range-book]');if(!select)return;
    const book=rangeBooks.find(row=>row.code===select.value);if(!book)return;
    for(const input of shell.querySelectorAll('[data-range-start],[data-range-end]')){input.max=String(book.chapters);if(Number(input.value)>book.chapters)input.value=String(book.chapters);}
    shell.querySelector('.pb-range-status').textContent='';
  },{signal});
  shell.addEventListener("click", async (e) => {
    if(!bgm.enabled){
      const music=shell.querySelector('[data-action="bgm"]');
      const clickedMusic=e.target.closest('[data-action="bgm"]');
      if(music&&!music.dataset.restored&&!clickedMusic){music.dataset.restored='true';if(savedMusic()!=='false'){try{setMusicState(music,await bgm.setEnabled(true));}catch(_){}}}
    }
    if (drag?.active||objectHold?.active) return;
    if (!options.allowed()) return;
    const b=e.target.closest("button"); if(!b) return;
    if(b.dataset.action==='apply-range'){
      const status=shell.querySelector('.pb-range-status'),code=shell.querySelector('[data-range-book]').value;
      const start=Number(shell.querySelector('[data-range-start]').value),end=Number(shell.querySelector('[data-range-end]').value);
      const book=rangeBooks.find(row=>row.code===code);
      if(!book||!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end>book.chapters){status.textContent='같은 권 안에서 시작 장과 끝 장을 확인해 주세요.';return;}
      status.textContent='범위의 인물·오브젝트·사건을 살펴보고 있어요…';
      try{
        const data=await loadBook(code,options.cachedBook),candidate=[];
        for(let chap=start;chap<=end;chap++)if(data.chapters[chap])candidate.push({code,name:book.name,chap,data:scopeChapterSummary(data.chapters[chap])});
        if(!candidate.length){status.textContent='선택한 본문을 찾지 못했어요.';return;}
        const candidateModel=buildWorldModel(candidate),props=objectsForChapters(candidate),sceneCount=candidateModel.scenes.length;
        if(rangeIsTooLarge({people:candidateModel.cast.length,objects:props.length,events:sceneCount})){status.textContent='너무 많아요! 인물·오브젝트·사건이 한 화면에 많아져요. 범위를 좁혀 다시 골라 주세요.';return;}
        if(!options.onRangeSelect){status.textContent='이 화면에서는 범위를 바꿀 수 없어요.';return;}
        await options.onRangeSelect(candidate.map(({code,name,chap})=>({code,name,chap})));
      }catch(_){status.textContent='범위 자료를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.';}
      return;
    }
    if(b.dataset.action==='recipe-lock'){if(hideRecipes&&!dailyDone()){say('오늘 통독을 마치거나 직접 조합을 발견하면 열 수 있어요.');return;}hideRecipes=!hideRecipes;renderRecipes();return;}
    if(b.dataset.recipeHint!==undefined){const scene=model.scenes[Number(b.dataset.recipeHint)];if(!scene||!isRecipeLocked(scene))return;const key=recipeKey(scene);recipeHintLevels.set(key,Math.min(3,(recipeHintLevels.get(key)||0)+1));renderRecipes();return;}
    if (b.dataset.recipe!==undefined) { const scene=model.scenes[Number(b.dataset.recipe)],o=objects.find(o=>o.kind===scene.object);if(!scene)return;if(isRecipeLocked(scene)){say('아직 잠긴 조합이에요. 직접 배치해 발견해 보세요.');return;}if(activeEvent){say('장면이 진행 중이에요. 끝난 뒤 다시 눌러 주세요.');return;}if(!o||scene.actors.some(name=>!npcs.some(n=>n.name===name))){say(b.dataset.unavailableReason||'필요한 인물과 오브젝트를 먼저 준비해 주세요.');return;}queueScene(scene,o);return; }
    if (b.dataset.commonRecipe) {const o=objects.find(o=>o.kind===b.dataset.commonRecipe),n=npcs[selected];if(activeEvent||!o||!n||n.creature&&!creatureCanUse(n,b.dataset.commonRecipe)){say(b.dataset.unavailableReason||'필요한 인물과 오브젝트를 먼저 준비해 주세요.');return;}pendingEvent=null;clearInfo();if(!toObject(n,o))say('오브젝트 주변의 길과 설 자리를 비워 주세요.');return;}
    if(b.dataset.action==='background-random'){
      const keys=Object.keys(BACKGROUNDS).filter(key=>key!==backgroundKey),key=keys[Math.floor(Math.random()*keys.length)];
      setBackground(key);say(`${BACKGROUNDS[backgroundKey].name} · 랜덤 상상 지형`);return;
    }
    if (b.dataset.background && Object.hasOwn(BACKGROUNDS,b.dataset.background)) {setBackground(b.dataset.background);say(`${BACKGROUNDS[backgroundKey].name} · 상상 지형`);return;}
    if(b.dataset.castMode){
      if(drag||objectHold)return;
      exposed=new Set((b.dataset.castMode==='all'?model.cast:b.dataset.castMode==='major'?majorCast(model):b.dataset.castMode==='animals'?model.cast.filter(p=>p.creature?.kind==='animal'):b.dataset.castMode==='plants'?model.cast.filter(p=>p.creature?.kind==='plant'):[]).map(castKey));for(const p of model.cast.filter(p=>p.mascotId==='김밥'))exposed.add(castKey(p));recommendationPerson=null;expandedCast=null;applyExposure();shell.querySelector('.pb-recommendations').hidden=true;return;
    }
    if(b.dataset.addPerson!==undefined){
      if(drag||objectHold)return;
      const person=model.cast[Number(b.dataset.addPerson)],key=castKey(person);
      if(person?.mascotId==='김밥'){say('김밥은, 사라지지, 않아요!');return;}
      if(exposed.has(key))exposed.delete(key);else exposed.add(key);
      applyExposure();if(recommendationPerson)renderRecommendations(recommendationPerson);togglePanel('left',true);return;
    }
    if(b.dataset.togglePerson!==undefined){
      if(drag||objectHold)return;
      const person=model.cast[Number(b.dataset.togglePerson)],key=castKey(person);
      if(person?.mascotId==='김밥'){say('김밥은, 사라지지, 않아요!');return;}
      if(exposed.has(key))exposed.delete(key);else exposed.add(key);
      applyExposure();return;
    }
    if (b.dataset.castPerson!==undefined) {
      const person=model.cast[Number(b.dataset.castPerson)],key=castKey(person),panel=shell.querySelector('.pb-recommendations');
      if(recommendationPerson&&castKey(recommendationPerson)===key&&!panel.hidden){panel.hidden=true;recommendationPerson=null;expandedCast=null;}
      else {expandedCast=key;shell.querySelector('.pb-person-details').hidden=true;renderRecommendations(person);}
      syncExposure();togglePanel('left',true);return;
    }
    if (b.dataset.place) {
      if(longPressClick?.button===b&&performance.now()<longPressClick.until){longPressClick=null;return;}
      if(activeEvent) return;
      removing=false;const removeButton=shell.querySelector('[data-action="remove-object"]');removeButton.setAttribute('aria-pressed','false');removeButton.textContent='개별 철거';
      placing=placing===b.dataset.place?null:b.dataset.place;syncPlacement();
      if(placing){togglePanel('right',false);say(`${objectPhrase(OBJECTS[placing])} 놓을 빈 땅을 터치하세요. 배치 취소를 누르면 도구로 돌아가요.`);}else{togglePanel('right',true);clearInfo();}
      return;
    }
    const action=b.dataset.action;
    if(action==='dismiss-event'){eventOffer=null;offerCard.hidden=true;return;}
    if(action==='watch-event'){const offer=eventOffer;if(!offer||!objects.includes(offer.o)||!sceneActors(offer.scene).every(Boolean)){offerCard.hidden=true;eventOffer=null;say('필요한 인물과 오브젝트를 다시 배치해 주세요.');return;}if(!requiredObjectsNearby(offer.scene,offer.o,objects)){say('보조 물건도 가까이에 놓아 주세요.');return;}if(offer.scene.actors.length&&!recipeAssembled(offer.scene,npcs,offer.o,objects)){eventOffer=null;offerCard.hidden=true;queueScene(offer.scene,offer.o);return;}pendingEvent={scene:offer.scene,o:offer.o};beginEvent(offer.scene);return;}
    if(action==='event-pause'&&activeEvent){activeEvent.paused=!activeEvent.paused;if(activeEvent.paused&&sound)speechSynthesis.cancel();closeCinematic?.setPaused?.(activeEvent.paused);b.textContent=activeEvent.paused?'▶ 계속':'Ⅱ 일시정지';return;}

    if(action==='bgm'){try{const on=await bgm.setEnabled(!bgm.enabled);setMusicState(b,on);try{localStorage.setItem('pixel-bible:bgm-enabled',String(on));}catch(_){} }catch(error){say(error.message);}return;}
    if(action==='relationships'){
      showRelationships=!showRelationships;
      relationshipPrimary=showRelationships&&selected>=0?npcs[selected]:null;relationshipPair=null;
      if(showRelationships)say('화살표가 시작하는 인물이 관계 이름에 해당해요. 예: 아들 → 아버지.');
      syncRelationships();draw();return;
    }
    if(b.dataset.replayScene){const scene=ALL_SCENES.find(s=>s.id===b.dataset.replayScene);if(scene&&model.scenes.some(s=>s.id===scene.id)){const o=objects.find(o=>o.kind===scene.object);if(o)queueScene(scene,o);else say(`${objectPhrase(OBJECTS[scene.object])}를 먼저 배치해 주세요.`);}else say('이 장면의 본문을 현재 월드에 포함해 주세요.');return;}
    if(b.dataset.moreStories!==undefined){openCollection(b.dataset.moreStories,Number(b.dataset.storyLimit));return;}
    if(b.dataset.discoveryFavorite!==undefined){const key=b.dataset.discoveryFavorite;if(discoveries[key]){discoveries[key].favorite=!discoveries[key].favorite;saveDiscoveries();openCollection(key);}return;}
    if(b.dataset.discovery!==undefined){openCollection(b.dataset.discovery);return;}
    if(b.dataset.story!==undefined){const key=b.dataset.discoveryOwner,record=discoveries[key],story=record?.stories[Number(b.dataset.story)];if(story){discoveries[key]=markStoryRead(record,story);saveDiscoveries();await openSpeechPassage(story.ref,contextTerms({text:story.text}));shell.querySelector('.pb-scripture header')?.insertAdjacentHTML('afterbegin',`<button class="pb-button" data-discovery="${esc(key)}">도감으로</button>`);}return;}
    if(action==='collection'){openCollection();return;}
    if(action==='person-collection'){const person=npcs[selected];if(person){discover(person);openCollection(discoveryKey(person));}return;}
    if(action==='encounter-details'){openSpeechDetails(b.closest('[data-encounter]')?._line);return;}
    if(action==='speech-details'){openSpeechDetails();return;}
    if(action==='unlocked-scenes'){const unlocked=[...recipeUnlocks].map(key=>{try{return JSON.parse(key)}catch(_){return null}}).filter(Boolean);const rows=unlocked.map(key=>{const scene=ALL_SCENES.find(s=>s.code===key[0]&&s.chapter===key[1]&&s.ref===key[2]&&s.object===key[3]&&s.title===key[5]);return scene?`<article class="pb-recipe"><b>${esc(scene.title)}</b><p>${esc(scene.ref)}</p><p>${esc(scene.study||scene.objectNote||'해금한 장면')}</p><button class="pb-button" data-replay-scene="${esc(scene.id)}">다시 보기</button></article>`:''}).join('');const panel=document.createElement('section');panel.className='pb-scripture pb-collection';panel.innerHTML=`<header><b>해금한 장면</b><button class="pb-button" data-action="close-scripture">닫기 ✕</button></header><div class="pb-scripture-body">${rows||'<p>아직 해금한 장면이 없어요.</p>'}</div>`;shell.append(panel);return;}
    if(action==='detail-passage'){await openSpeechPassage(b.dataset.reference,b.dataset.terms?JSON.parse(b.dataset.terms):contextTerms(shownSpeech));return;}
    if(action==='close-scripture'){shell.querySelector('.pb-scripture')?.remove();canvas.focus();return;}
    if(action==="design" && !shell.querySelector(".pb-design")) {
      const board=document.createElement("section");board.className="pb-design";board.setAttribute("aria-label","픽셀 캐릭터와 지형 디자인 도안");
      board.innerHTML='<header><b>실제 캐릭터 · 지형 도안</b><button class="pb-button" data-action="close-design">도안 닫기 ✕</button></header><canvas aria-label="전용 캐릭터 100종과 보리밭, 물항아리, 쉬는 자리, 나무"></canvas>';
      shell.append(board);await document.fonts?.load('12px "DungGeunMo"');if(!board.isConnected)return;drawDesignBoard(board.querySelector("canvas").getContext("2d"));board.querySelector("button").focus();
    }
    if(action==="close-design") {shell.querySelector(".pb-design")?.remove();shell.querySelector('[data-action="design"]').focus();}
    if(action==="cancel-place") { placing=null; syncPlacement(); togglePanel('right',true); draw(); return; }
    if(action==='toggle-left')togglePanel('left');
    if(action==='toggle-right')togglePanel('right');
    if(action==="fullscreen") {
      const expand=!shell.classList.contains('pb-immersive');shell.classList.toggle('pb-immersive',expand);
      if(expand){togglePanel('left',false);togglePanel('right',false);options.landscape();say('양옆 버튼으로 인물과 조합 도구를 펼칠 수 있어요.');}
    }
    if(action==="pause") { hideSpeech();paused=!paused; b.setAttribute("aria-pressed",paused); b.textContent=paused?"계속하기":"일시정지"; if(paused && sound) speechSynthesis.cancel(); }
    if(action==="sound") {
      if(!("speechSynthesis" in window)) return say("이 브라우저에서는 음성 합성을 지원하지 않아요. 자막으로 장면을 볼 수 있어요.");
      sound=!sound; b.setAttribute("aria-pressed",sound); b.textContent=sound?"음성 켜짐":"음성 꺼짐";
      if(!sound) speechSynthesis.cancel(); else if(activeEvent) showLine();
    }
    if(action==='remove-object'){
      removing=!removing;placing=null;syncPlacement();
      b.setAttribute('aria-pressed',removing);b.textContent=removing?'철거 마치기':'개별 철거';
      if(removing)say('철거할 오브젝트의 밑부분을 누르세요. 인물의 움직임은 유지돼요.');
    }
    if(action==='reset')demolish(()=>true);
    if(action==="scene" && !activeEvent) {
      const available=model.scenes.filter(s=>!isRecipeLocked(s));if(!available.length){say('조합이 잠겨 있어요. 오늘 통독을 마치거나 직접 발견해 보세요.');return;}const scene=available[eventIndex++%available.length], o=objects.find((o)=>o.kind===scene.object);
      if(o) queueScene(scene,o); else say(`${objectPhrase(OBJECTS[scene.object])} 먼저 배치해 주세요.`);
    }
    if(action==="next" && activeEvent) { if(++activeEvent.step>=activeEvent.scene.lines.length) endEvent(); else showLine(); }
    if(action==="skip") endEvent();
    if(action==="demo") {
      b.disabled=true;
      try {
        const dispose=await mountPixelWorldPreview();
        if(dispose) return;
      } catch (_) { b.disabled=false;say("체험 자료를 불러오지 못했어요. 다시 시도해 주세요."); }
    }
  }, {signal});
  // 별도 미니 앱/읽기 기록을 만들지 않고 동일한 화면에서 명시적인 체험 본문으로 전환한다.
  async function mountPixelWorldPreview() {
    await loadBook("rut", options.cachedBook);
    if(!shell.isConnected || disposed) return;
    cleanup();
    shell.querySelectorAll(":scope > :not(.pb-world-head)").forEach((el)=>el.remove());
    shell.insertAdjacentHTML("beforeend",'<div class="pb-load" role="status">룻기 체험을 준비하고 있어요…</div>');
    replacement=await mountPixelWorld(shell,{...options,chapters:[], focusPerson:0, cachedBook:options.cachedBook});
    return true;
  }
  let replacement=null;
  function demolish(predicate){
    const result=removeObjects(objects,npcs,predicate);objects=result.remaining;
    if(pendingEvent&&result.removed.includes(pendingEvent.o))pendingEvent=null;
    if(activeEvent&&result.removed.includes(activeEvent.object))endEvent();
    if(objectSpeech&&result.removed.includes(objectSpeech.object))objectSpeech=null;
    result.removed.forEach(o=>objectCooldown.delete(o));
    save();renderRecipes();draw();say(`${result.removed.length}개 오브젝트를 철거했어요.`);
  }
  function propEvidence(n,kind){
    return chapterProps.find(item=>item.id===kind)?.evidence.find(e=>e.actors.includes(n.name)&&n.refs.some(ref=>{
      const base=ref.replace(/장$|편$/,'');return e.ref===base||e.ref.startsWith(base+':');
    }))||null;
  }
  function autoObjects(){
    if(time<autoObjectAt||pendingEvent||pendingTalk||activeEvent||drag||objectHold||placing||removing)return;
    autoObjectAt=time+3;
    for(const plant of npcs.filter(n=>n.creature?.kind==='plant')){
      const water=objects.find(o=>['water','well','water-supply','basin'].includes(o.kind)&&Math.hypot(o.x-plant.x,o.y-plant.y)<=3);
      plant.usingObject=water||null;plant.interaction=water?{id:'plant:water',category:'water',kind:water.kind,gesture:'absorb',creatureAction:'absorb',variant:0,period:3,phase:0}:null;
    }
    const idle=npcs.filter(n=>n.creature?.kind!=='plant'&&!n.loveBooth&&!n.encounter&&!n.path.length&&!n.task&&!n.action&&speech.current?.speaker!==n&&speech.current?.target!==n);
    const pairs=objects.filter(o=>o.kind!=='love-booth'&&!npcs.some(n=>n.task===o||n.usingObject===o)).flatMap(o=>{
      const specific=model.scenes.filter(s=>!s.narrationOnly&&s.object===o.kind&&sceneActors(s).every(Boolean));
      return idle.filter(n=>!n.creature||creatureCanUse(n,o.kind)).map(n=>({n,o,scene:specific.find(s=>s.actors[(s.id==='samaritan-well'||s.id==='jesus-boat')?1:0]===n.name),evidence:propEvidence(n,o.kind),distance:Math.hypot(o.x-n.x,o.y-n.y)}));
    });
    const chosen=rankObjectVisits(pairs,time,objectCooldown,visitorCooldown)[0];if(!chosen)return;
    if(toObject(chosen.n,chosen.o)){
      visitorCooldown.set(objectVisitKey(chosen.n,chosen.o),time);
      chosen.n.objectScene=chosen.scene||null;
      chosen.n.objectEvidence=chosen.evidence||null;objectCooldown.set(chosen.o,time);
    }
  }
  let nextMeet=10;
  function update(dt) {
    time+=dt;
    syncBoatFloat();
    const waitingForScene=checkAssembledRecipes();
    for(const n of waitingForScene)if(n.path.length&&!n.task){n.path=[];n.running=false;n.idle=6;}
    if(time>=nextMeet&&!activeEvent&&!pendingEvent&&!pendingTalk&&!drag&&!placing){
      nextMeet=time+12;
      for(const relation of dialogueContext.relations){
        const a=npcs.find(n=>n.name===relation.from.name),b=npcs.find(n=>n.name===relation.to.name);
        if(!a||!b||[a,b].some(n=>n.creature||n.loveBooth||n.task||n.usingObject||n.encounter||n.path.length)||Math.hypot(a.x-b.x,a.y-b.y)>7)continue;
        const dest=[{x:Math.round(a.x)+1,y:Math.round(a.y)},{x:Math.round(a.x)-1,y:Math.round(a.y)}].find(p=>!blocked(p.x,p.y));
        if(dest&&move(b,dest)){a.idle=10;break;}
      }
    }
    autoObjects();
    for(const n of npcs) {
      if(n.waterHuff){advanceWaterHuff(n,dt);n.path=[];n.task=null;n.running=false;if(n.waterHuff)continue;}
      if(n.boatRide){
        if(!objects.includes(n.boatRide)&&!terrain.includes(n.boatRide)){
          const safe=dryLanding(backgroundKey,n.boatRide,blocked);n.boatRide=null;
          if(safe)startWaterEscape(n,safe);
        }else{n.x=n.boatRide.x;n.y=n.boatRide.y+1;n.waterEscape=null;n.path=[];n.stride+=dt*2;continue;}
      }
      if(n.waterEscape)continue;
      if(n.collisionStun){
        n.collisionStun.elapsed+=dt;n.path=[];n.task=null;n.running=false;
        if(n.collisionStun.elapsed>=COLLISION_STUN_SECONDS){n.collisionStun=null;n.expression='neutral';n.idle=.3;}
        else continue;
      }
      if(n.creature?.kind==='plant'){n.path=[];n.task=null;continue;}
      if(drag?.active && drag.n===n)continue;
      if(n.loveBooth){n.path=[];n.task=null;n.idle=2;continue;}
      if(n.encounter){n.idle=6;continue;}
      const talk=pendingTalk?.choice||speech.current;
      if(talk?.target&&(n===talk.speaker||n===talk.target)&&!n.path.length){n.idle=6;continue;}
      if(talk?.speaker===n&&!n.path.length){n.idle=1;continue;}
      if(n.path.length) {
        const p=n.path[0],dx=p.x-n.x,dy=p.y-n.y,d=Math.hypot(dx,dy),step=dt*n.motion.speed*motionPose(n.motion,n.stride,true,time).speed*(n.running?RUN_SPEED:1);
        n.direction=movementDirection(dx,dy,n.direction);
        const travel=Math.min(d,step);
        if(n.mascotId==='김밥')n.rollPhase=advanceGimbapRoll(n.rollPhase||0,travel,n.direction);
        n.stride+=travel;
        if(blocked(p.x,p.y)) {
          if(n.running&&!waterAt(backgroundKey,p.x,p.y)&&blockedCells.has(`${p.x},${p.y}`)){n.collisionStun={elapsed:0,kind:'object'};n.expression='surprised';}
          n.path=[];n.task=null;n.running=false;continue;
        }
        const next=d<=step?{x:p.x,y:p.y}:{x:n.x+dx/d*step,y:n.y+dy/d*step};
        if(n.running&&runningIntoPerson(n,next,npcs)){n.collisionStun={elapsed:0,kind:'person'};n.expression='surprised';n.path=[];n.task=null;n.running=false;continue;}
        if(n.running&&runningIntoObject(next,[...objects,...terrain],n)){n.collisionStun={elapsed:0,kind:'object'};n.expression='surprised';n.path=[];n.task=null;n.running=false;continue;}
        n.x=next.x;n.y=next.y;if(d<=step)n.path.shift();
      } else if(n.task) {
        const target=n.task;
        if(!objects.includes(target)){n.task=null;continue;}
        n.direction=movementDirection(target.x-n.x,target.y-n.y,n.direction);
        n.action=target.kind;n.task=null;n.usingObject=target;n.objectAction=n.objectScene?.id||null;
        n.objectVisits??=Object.create(null);const visit=n.objectVisits[target.kind]||0;n.objectVisits[target.kind]=visit+1;
        n.interaction=interactionRoutine(n,target.kind,visit);n.interactionStart=time;n.idle=8;
        if(!n.creature&&!n.objectScene){
          const evidence=n.objectEvidence||{text:n.role||'',ref:n.refs[0]||''};
          objectSpeech={id:`object-ref:${target.kind}:${n.name}`,speaker:n,...objectContextSpeech(OBJECTS[target.kind],evidence,{speaker:n,kind:target.kind,chapters:chapterData}),kind:'solo',object:target};
        }
        n.objectEvidence=null;
        if(n.objectScene){const scene=n.objectScene;n.objectScene=null;
          objectSpeech={id:`object:${scene.id}:${n.name}`,speaker:n,text:objectLinesFor(scene,n.name)[Math.floor(Math.random()*objectLinesFor(scene,n.name).length)],ref:scene.ref,detailText:scene.study||scene.lines.join(' '),kind:'solo',object:target};
        }
        if(['bench','throne','footstool'].includes(target.kind)) { n.x=target.x;n.y=target.y;n.direction="down"; }
      } else if((n.idle-=dt)<=0 && !pendingEvent?.actors.includes(n) && !waitingForScene.has(n)) {
        n.action="";n.usingObject=null;n.interaction=null;n.idle=3+Math.random()*5;
        if(!reduced&&!pendingTalk&&n.creature?.body!=='fish') {const far=Math.random()<.2;const p={x:far?BOUNDS.minX+Math.floor(Math.random()*(BOUNDS.maxX-BOUNDS.minX+1)):Math.max(BOUNDS.minX,Math.min(BOUNDS.maxX,Math.round(n.x+(Math.random()-.5)*16))),y:far?BOUNDS.minY+Math.floor(Math.random()*(BOUNDS.maxY-BOUNDS.minY+1)):Math.max(BOUNDS.minY,Math.min(BOUNDS.maxY,Math.round(n.y+(Math.random()-.5)*12)))};if(!blocked(p.x,p.y))move(n,p,null,{running:shouldRun()});}
      }
    }
    if(pendingEvent && !pendingEvent.ready && pendingEvent.actors.every((n)=>!n.path.length && Math.hypot(n.x-pendingEvent.o.x,n.y-pendingEvent.o.y)<=1.5)){pendingEvent.ready=true;offerEventReady();}
  }

  // 배경은 1번 그리고 매 프레임 재사용한다.
  const background=document.createElement("canvas");background.width=WORLD.width;background.height=WORLD.height;
  function syncBackground(){shell.querySelectorAll('[data-background]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.background===backgroundKey));const ref=BACKGROUNDS[backgroundKey].ref;shell.querySelector('.pb-background-note').textContent=ref?`본문 모티브 · ${ref}`:`${BACKGROUNDS[backgroundKey].name} · 자유롭게 꾸미는 상상 지형`;
    const picker=shell.querySelector('.pb-background-picker');if(picker)picker.querySelector('summary').textContent=`배경 선택 · ${BACKGROUNDS[backgroundKey].name}`;}
  let backgroundHour=-1;
  function paintBackground(){
    const c=background.getContext('2d');
    const light=globalThis.KstLight.at();
    drawWholeBackground(c,backgroundKey,WORLD.width,WORLD.height,{decorations:false,hour:light.localHour,elevation:light.elevation,cloud:Number(getComputedStyle(document.documentElement).getPropertyValue('--weather-cloud'))*100||0});backgroundHour=light.hour;
  }
  paintBackground();syncBackground();
  function draw() {
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    const v=view();
    ctx.imageSmoothingEnabled=false;ctx.save();ctx.setTransform(v.scale,0,0,v.scale,v.x,v.y);ctx.save();
    const light=globalThis.KstLight.at();if(light.hour!==backgroundHour)paintBackground();
    ctx.drawImage(background,0,0);
    const visible=(x,y)=>x*TILE>-v.x/v.scale-140&&x*TILE<(canvas.width-v.x)/v.scale+140&&y*TILE>-v.y/v.scale-140&&y*TILE<(canvas.height-v.y)/v.scale+140;
    const waterPalette=BACKGROUNDS[backgroundKey];
    const relationshipHighlight=showRelationships&&relationshipPrimary?relationshipFocus(model.relations,npcs,relationshipPrimary,relationshipPair):null;
    const items=[...terrain.filter(o=>visible(o.x,o.y)).map(o=>({y:o.y,draw:()=>drawWorldObject(ctx,o,TILE,isBoat(o)?{dy:boatFloat(o,time)}:null)})),...objects.filter(o=>(!objectHold?.active||objectHold.o!==o)&&!npcs.some(n=>n.eventRoutine?.gesture==='axe-float'&&n.eventObjects?.includes(o)&&o.kind==='axe')&&visible(o.x,o.y)).map((o)=>({y:o.y,draw:()=>drawObject(ctx,o,{...objectInteractionFrame(o,npcs,time+cinematicTime,reduced),dy:(objectInteractionFrame(o,npcs,time+cinematicTime,reduced)?.dy||0)+boatFloat(o,time)} )})),...npcs.filter(n=>(!drag?.active||drag.n!==n)&&visible(n.x,n.y)).map((n)=>({y:interactionAnchor(n,TILE).y/TILE,focus:relationshipHighlight?.has(n)||npcs.indexOf(n)===selected,draw:()=>{const alpha=relationshipOpacity(relationshipHighlight,n);ctx.save();ctx.globalAlpha*=alpha;drawNpc(ctx,n,npcs.indexOf(n),time+cinematicTime,npcs.indexOf(n)===selected||!!relationshipHighlight?.has(n),activeEvent?.scene.actors.includes(n.name),reduced,waterPalette.water,waterPalette.wave);ctx.restore();}}))].sort((a,b)=>a.y-b.y||Number(a.focus)-Number(b.focus));
    items.forEach((item)=>item.draw());
    if(drag?.active)drawLifted(ctx,drag,time,reduced);
    if(objectHold?.active){
      const p=objectLanding(objectHold),valid=canMoveObject(objectHold.o,p,[...objects,...terrain],npcs);
      ctx.fillStyle=valid?'#79c99566':'#e17e7866';ctx.fillRect((p.x-.6)*TILE,(p.y-.4)*TILE,1.2*TILE,.8*TILE);
      ctx.save();ctx.globalAlpha=.8;drawWorldObject(ctx,{...objectHold.o,...grabbedOrigin(objectHold)},TILE,objectHold.frame);ctx.restore();
    }
    if(light.alpha){ctx.save();ctx.globalAlpha=light.alpha;ctx.fillStyle=light.shade;ctx.fillRect(0,0,WORLD.width,WORLD.height);ctx.restore();}
    const talkingRelations=model.relations.filter(r=>encounterLines.some(l=>l.origin!=='general'&&l.target&&((l.speaker.name===r.from&&l.target.name===r.to)||(l.speaker.name===r.to&&l.target.name===r.from))));
    if(showRelationships||talkingRelations.length)drawRelationshipLinks(ctx,relationshipLinks(showRelationships?model.relations:talkingRelations,npcs,drag,showRelationships?relationshipPrimary:null,showRelationships?relationshipPair:null));
    ctx.restore();
    if(placing) {ctx.setTransform(1,0,0,1,0,0);const dpr=canvas.width/(canvas.offsetWidth||canvas.getBoundingClientRect().width);ctx.fillStyle='#102e38ed';const w=Math.min(400*dpr,canvas.width-20*dpr);ctx.fillRect((canvas.width-w)/2,canvas.height-104*dpr,w,30*dpr);ctx.fillStyle='#ffe5a2';ctx.font=`${14*dpr}px "DungGeunMo", monospace`;ctx.textAlign='center';ctx.fillText(`${OBJECTS[placing]} · 빈 땅을 눌러 배치`,canvas.width/2,canvas.height-84*dpr);}
    ctx.restore();positionSpeech();positionEncounters();
    shell.dataset.kstLight=globalThis.KstLight.at().key;
  }
  shell.closest("dialog")?.addEventListener("cancel",(e)=>{
    if(activeEvent){e.preventDefault();endEvent();return;}
    const scripture=shell.querySelector('.pb-scripture');if(scripture){e.preventDefault();scripture.remove();canvas.focus();return;}
    const board=shell.querySelector(".pb-design");if(board){e.preventDefault();board.remove();shell.querySelector('[data-action="design"]').focus();}
  },{signal});
  const fitCanvas=()=>{
    const r=canvas.getBoundingClientRect(),width=canvas.offsetWidth||r.width,height=canvas.offsetHeight||r.height,ratio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));constrainCamera(camera,canvas.width,canvas.height);syncCamera();if(shownSpeech){speechWidth=speechElement.offsetWidth;speechHeight=speechElement.offsetHeight;}draw();
  };
  const resizeObserver=new ResizeObserver(fitCanvas);resizeObserver.observe(canvas);
  const refreshCanvas=()=>{
    if(objectHold)finishObjectHold({pointerId:objectHold.id,clientX:objectHold.client?.x??-1,clientY:objectHold.client?.y??-1},true);
    if(drag)finishDrag({pointerId:drag.id,clientX:drag.client?.x??-1,clientY:drag.client?.y??-1},true);
    pointers.clear();pinch=null;pan=null;gestureActive=false;suppressClick=false;fitCanvas();
  };
  window.addEventListener('resize',refreshCanvas,{signal});
  window.addEventListener('orientationchange',refreshCanvas,{signal});
  window.visualViewport?.addEventListener('resize',refreshCanvas,{signal});
  const canRun=()=>worldCanAnimate({disposed,hidden:document.hidden,allowed:options.allowed()});
  const scheduleFrame=()=>{if(canRun()&&!frameScheduled){frameScheduled=true;frame=requestAnimationFrame(tick);}};
  function tick(stamp) {
    frameScheduled=false;
    if(disposed)return;
    if(!options.allowed()) {say("월드를 다시 열어 주세요.");return;}
    try{
      const dt=Math.min(.05,(stamp-last)/1000||0);last=stamp;
      const rescued=advanceWaterEscapes(npcs,dt);
      for(const n of rescued){const timer=waterRescueTimers.get(n);if(timer)clearTimeout(timer);waterRescueTimers.delete(n);}
      for(const n of npcs)if(n.waterEscape){n.direction='down';n.stride+=dt*8;}
      if(rescued.length)say(rescued.length>1?`${rescued.length}명이 물가에서 잠깐 숨을 고르고 있어요.`:'휴우… 씩씩. 물가에서 숨을 고르고 있어요.');
      if(!paused&&!shell.querySelector('.pb-scripture')) {
        if(!activeEvent) update(dt);
        else {
          if(!activeEvent.paused){cinematicTime+=dt;activeEvent.elapsed+=dt;}
          if(!activeEvent.paused&&!activeEvent.manualClip&&activeEvent.elapsed>Math.max(eventPlan(activeEvent.scene).duration||8.2,activeEvent.scene.lines[activeEvent.step].length*.09) && (!sound || !speechSynthesis.speaking || activeEvent.elapsed>45)) { if(++activeEvent.step>=activeEvent.scene.lines.length) endEvent(); else showLine(); }
        }
      }
      followDraggedCharacter(dt);
      updateEncounters(performance.now());updateSpeech(performance.now());draw();
      frameErrorReported=false;
    }catch(error){
      if(!frameErrorReported){frameErrorReported=true;console.warn('PIXEL BIBLE 월드 프레임 복구 시도',error);}
    }finally{
      scheduleFrame();
    }
  }
  function resume() {
    cancelAnimationFrame(frame);frameScheduled=false;last=0;
    if(document.hidden) {hideSpeech();encounters.clear();if(objectHold)finishObjectHold({pointerId:objectHold.id,clientX:0,clientY:0},true);if(drag)finishDrag({pointerId:drag.id,clientX:0,clientY:0},true);if(sound)speechSynthesis.cancel();return;}
    scheduleFrame();
  }
  document.addEventListener("visibilitychange",resume,{signal});window.addEventListener("resize",resume,{signal});
  function cleanup() {if(disposed)return;disposed=true;for(const timer of waterRescueTimers.values())clearTimeout(timer);waterRescueTimers.clear();frameScheduled=false;closeCinematic?.();bgm.dispose();encounters.clear();for(const el of encounterBubbles.values()){el._closePortrait?.();el.remove();}if(objectHold){clearTimeout(objectHold.timer);objectHold=null;}hideSpeech();abort.abort();clearTimeout(toastTimer);resizeObserver.disconnect();cancelAnimationFrame(frame);if(sound)speechSynthesis.cancel();}
  function syncRelationships(){
    const button=shell.querySelector('[data-action="relationships"]');
    button.setAttribute('aria-pressed',showRelationships);button.textContent=showRelationships?'관계선 켜짐':'관계선 꺼짐';
    canvas.dataset.relationships=String(showRelationships);
  }
  if(!reduced)for(const n of npcs){
    if(n.creature?.kind==='plant'||n.creature?.body==='fish')continue;
    for(let attempt=0;attempt<4;attempt++){
      const goal={x:Math.max(BOUNDS.minX,Math.min(BOUNDS.maxX,Math.round(n.x+(Math.random()-.5)*12))),y:Math.max(BOUNDS.minY,Math.min(BOUNDS.maxY,Math.round(n.y+(Math.random()-.5)*10)))};
      if(blocked(goal.x,goal.y))continue;const path=findPath(cell(n),goal,blocked);if(path?.length){n.path=path;n.stride=Math.random()*4;n.direction=movementDirection(path[0].x-n.x,path[0].y-n.y,n.direction);break;}
    }
  }
  document.fonts?.load('12px "DungGeunMo"').then(()=>{if(!disposed)draw();}).catch(()=>{});
  syncExposure();syncCamera();syncRelationships();select(options.speakOnOpen?0:-1,!!options.speakOnOpen);fitCanvas();resume();say('두 손가락 또는 마우스 휠로 확대·축소해요. 양옆에서 인물과 조합식을 고를 수 있어요.');
  return ()=>{cleanup();replacement?.();};
}

function drawObject(c,o,response) {
  if(response?.actor&&(heldObject(response.actor,response.time,response.reduced)||objectWorn(response.actor,response.time,response.reduced)))return;
  drawWorldObject(c,o,TILE,response);
  drawObjectResponse(c,o,response,TILE);
  if(o.kind==='love-booth'){
    c.save();c.font='10px "DungGeunMo", monospace';c.textAlign='center';const name='TV는 사랑을 싣고',w=c.measureText(name).width+10;
    c.fillStyle='#12303bd9';c.fillRect(o.x*TILE-w/2,o.y*TILE+15,w,15);c.fillStyle='#ffe7a0';c.fillText(name,o.x*TILE,o.y*TILE+26);c.restore();
  }
  if(!Object.hasOwn(WORLD_OBJECTS,o.kind)&&OBJECT_CATALOG[o.kind]){
    c.save();c.font='10px "DungGeunMo", monospace';c.textAlign='center';const name=OBJECT_CATALOG[o.kind].name,w=c.measureText(name).width+8;
    c.fillStyle='#12303bd9';c.fillRect(o.x*TILE-w/2,o.y*TILE+15,w,15);c.fillStyle='#fff1c9';c.fillText(name,o.x*TILE,o.y*TILE+26);c.restore();
  }
}
function drawNpc(c,n,index,time,selected,acting,reduced=false,water='#528ca0',foam='#a7d4d0') {
  const pose=n.mascotId==='김밥'?{x:0,y:0,tilt:0,speed:1}:motionPose(n.motion,n.stride,!!n.path.length,time);
  let actionPose=n.collisionStun?impactPose(n.collisionStun.elapsed,reduced):n.waterEscape?swimPose(n.waterEscape.elapsed,reduced):n.boatRide?{sit:true,phase:Math.floor(time*3)%4,legSwing:Math.floor(time*3)%2}:n.usingObject&&n.interaction?interactionPose(n.interaction,time-(n.interactionStart||0),reduced):null;
  if(n.creature?.kind==='plant'&&!actionPose)actionPose={phase:reduced?0:Math.floor(time*1.5)%4,bodyX:0,bodyY:0,hand:0,creatureAction:'sway'};
  const held=heldObject(n,time,reduced,TILE);
  if((held||actionPose?.wearing)&&actionPose)actionPose={...actionPose,heldObject:true};
  const rise=(n.objectAction==='zacchaeus-tree'||actionPose?.actual==='climb')&&n.usingObject?36+(actionPose?.climb||0):0;
  const anchor=interactionAnchor(n,TILE);
  const x=Math.round(anchor.x)+pose.x+(actionPose?.impactX||0),y=Math.round(anchor.y)+pose.y-rise+(actionPose?.impactY||0);
  if(n.prominent){c.save();c.globalAlpha=reduced?.6:.45+.15*Math.sin(time*2);c.fillStyle='#f6d782';c.beginPath();c.ellipse(x,y+4,23,7,0,0,Math.PI*2);c.fill();c.strokeStyle='#fff0b3';c.lineWidth=2;c.stroke();c.restore();}
  if(n.encounter){c.save();c.globalAlpha=reduced?.8:.68+.22*Math.sin(time*7);c.strokeStyle='#f4cf70';c.fillStyle='#f4cf7038';c.lineWidth=2;c.beginPath();c.ellipse(x,y+4,21+Math.round(Math.sin(time*7)),6,0,0,Math.PI*2);c.fill();c.stroke();c.restore();}
  c.save();
  const style=characterStyle(n.name,index,n.role,n.refs,n.creature||false);
  const bob=n.mascotId==='김밥'?0:actionPose&&!reduced&&!n.interaction?Math.round(Math.sin(time*4)*1):n.waterHuff&&!reduced?Math.round(Math.sin(time*9)*1):0;
  const rolling=!!style.gimbap&&!!n.path.length&&!actionPose;
  drawPixelCharacter(c,style,x,y+bob,{scale:2,walkFrame:n.creature?.body==='fish'&&!reduced?Math.floor(time*3)%4:characterWalkFrame({stride:n.stride,moving:!!n.path.length,actionPose}),rolling,rollFrame:n.rollPhase||0,action:n.action,interaction:actionPose,time:reduced?0:time,direction:n.direction||"down",expression:n.expression||"neutral",baseExpression:n.expression||"neutral",motionOnly:!n.creature,selected:selected||!!n.encounter});
  if(n.waterEscape){
    drawWaterRescue(c,{x,y,style,pose:actionPose,time,water,foam,progress:n.waterEscape.progress||0,reduced});
  }
  if(held){drawWorldObject(c,held,TILE,held.frame);drawObjectResponse(c,n.usingObject,objectInteractionFrame(n.usingObject,[n],time,reduced),TILE);}
  const shape=n.creature?{width:1,height:1}:physiqueFor(n.name,n.role,n.refs);
  c.save();c.translate(x,y);c.scale(shape.width,shape.height);c.translate(-x,-y);
  drawInteractionEffects(c,n,actionPose,x,y,time);c.restore();
  if(n.collisionStun){for(const star of impactSparkles(n.collisionStun.elapsed,reduced)){c.fillStyle='#f6d56f';c.fillRect(x+star.x,y+star.y,3,3);c.fillRect(x+star.x-2,y+star.y+1,7,1);}const flap=Math.floor(time*8)%2;c.fillStyle='#f4efe0';c.fillRect(x+19,y-77-flap*2,5,1);c.fillRect(x+22,y-79+flap*2,4,1);c.fillRect(x+26,y-77-flap*2,4,1);}
  if(n.waterHuff){
    const breath=reduced?0:Math.floor(time*5)%3;c.fillStyle='#e8f0e7';c.fillRect(x+17,y-88-breath,3,2);c.fillRect(x+22,y-91-breath,4,2);if(breath===2)c.fillRect(x+28,y-94,3,2);
    // Red pixel “vein pop” marks the short, winded recovery without changing
    // the character's face or body sprite.
    c.fillStyle='#8c272b';c.fillRect(x+13,y-88,8,3);c.fillRect(x+18,y-91,3,8);c.fillRect(x+21,y-91,8,3);c.fillRect(x+26,y-88,3,8);c.fillStyle='#e74a4a';c.fillRect(x+16,y-86,5,2);c.fillRect(x+23,y-89,5,2);
  }
  c.restore();
  if(acting){c.fillStyle="#ffe189";c.fillRect(x-2,y-131,4,7);c.fillRect(x-2,y-122,4,3);}
  c.font='12px "DungGeunMo", monospace';c.textAlign="center";const w=c.measureText(displayPersonName(n.name)).width+12;c.fillStyle="#12303bd9";c.fillRect(x-w/2,y+17,w,18);c.fillStyle="#fff1c9";c.fillText(displayPersonName(n.name),x,y+30);
}

function drawLifted(c,drag,time,reduced=false) {
  const origin=grabbedOrigin(drag),x=origin.x*TILE,y=origin.y*TILE;
  const pose=liftedCharacterFrame(drag.n.motion,time,drag.vx,reduced),sway=reduced?0:Math.round(Math.sin(time*5+(drag.n.motion.phase||0))*2);
  c.fillStyle='#18352b55';c.fillRect(x-19,y+8,38,8);
  // Keep the original pixel sprite rigid: swinging changes placement, never
  // rotates/interpolates the face and body pixels themselves.
  c.save();c.translate(sway,0);
  drawPixelCharacter(c,characterStyle(drag.n.name,drag.index,drag.n.role,drag.n.refs,drag.n.creature||false),x,y,{scale:2,...pose,baseExpression:'neutral',selected:true});
  c.restore();c.fillStyle='#fff0bf';c.font='13px "DungGeunMo", monospace';c.textAlign='center';c.fillText(displayPersonName(drag.n.name),x,y+28);
}
