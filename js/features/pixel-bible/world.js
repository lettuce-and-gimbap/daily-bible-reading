import {createBgm} from './bgm.js';
import {enhanceScene,eventRoutine} from './scripted-events.js';
import {RECIPE_KEY,recipeKey,loadRecipeUnlocks,recipeLocked,recipeAssembled,requiredObjectsNearby} from './recipe-locks.js';
import {waterAt,dryLanding} from './terrain-response.js';
import {discoveryKey,importanceFor,prominentKeys,discoverySnapshot,mergeDiscovery,learningStage,learningNext,markStoryRead,loadDiscoveries,storyKey,DISCOVERY_KEY} from './discovery.js';
import '../../shared/daylight.js';
import {physiqueFor} from './physique.js';
import {contextTerms,emphasizedContext,emphasizePassage} from './context-emphasis.js';
const displayPersonName=name=>name.replace(/\s*[（(][^()（）]*의\s*(?:아들|딸|아내|남편)[^()（）]*[)）]/g,'').trim();
import {speechContext} from './speech-context.js';
import {creatureCanUse} from './creatures.js';
import {EncounterDirector} from './encounters.js';
import {drawInteractionEffects} from './interaction-effects.js';
import {objectContextSpeech} from './speech-view.js';
import {grabOffset,grabbedOrigin} from './grab.js';
import { majorCast, recommendedCast, exposureStorageKey } from './exposure.js';
import { fitLayout } from './layout.js';
import { drawWholeBackground, sceneDecorations } from './landscape.js';
import { speechEmotion } from './expression.js';
import { WORLD, BOUNDS, homeCamera, cameraView, constrainCamera, toWorld, zoomAt, pinchCamera, edgePan } from './camera.js';
import { canMoveObject } from './object-drag.js';
import { objectPresentation, interactionApproaches, heldObject, interactionAnchor, objectWorn, objectInteractionFrame, drawObjectResponse } from './object-response.js';
import { castKey, reconcileCast } from './cast-state.js';
import { OBJECT_CATALOG, objectsForChapters } from './object-catalog.js';
import { interactionRoutine, interactionPose } from './interaction-motion.js';
import { WORLD_OBJECTS, OBJECT_SCENES, objectLinesFor, removeObjects, rankObjectVisits, objectVisitKey } from './object-scenes.js';
import { personalLines } from './personal-lines.js';
import { characterMotion, motionPose, hangingPose } from './motion.js';
import { relationshipLinks, drawRelationshipLinks } from './relationship-overlay.js';
import { chapterPeople } from './chapter-people.js';
import { opposedDirections, planConversation } from './conversation.js';
import { parseReference } from './references.js';
import { scopeChapterSummary } from './qt-scope.js';
import { buildChapterDialogue, occurrenceMatches } from './chapter-dialogue.js';
import { dialogueCandidates, SpeechDirector } from './dialogue.js';
import { objectPhrase, movementDirection } from './language.js';
import { resolveIdentity } from './identity.js';
import { BACKGROUNDS, defaultBackground, backgroundStorageKey } from './backgrounds.js';
import { drawPixelCharacter, hitWorldObject, characterStyle, drawWorldObject, drawDesignBoard } from "./art.js";
import { renderPersonPreview } from "./collection-preview.js";
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
export function clientToCanvasPoint(clientX,clientY,rect,width,height) {
  if(!rect?.width||!rect?.height)return {x:0,y:0};
  const x=(clientX-rect.left)*width/rect.width,y=(clientY-rect.top)*height/rect.height;
  return {x:Math.max(0,Math.min(width-1,x)),y:Math.max(0,Math.min(height-1,y))};
}
export function touchSlopPixels(canvasWidth,cssWidth,cssSlop=12) {
  if(!cssWidth)return cssSlop;
  return cssSlop*Math.max(1,canvasWidth/cssWidth);
}

const eventBooks=new Map();
async function enrichBook(code,data){

 if(!eventBooks.has(code))eventBooks.set(code,fetch(new URL(`../../../data/pixel-bible/events/${code}.json`,import.meta.url)).then(r=>r.ok?r.json():null).catch(()=>null));
 const extra=await eventBooks.get(code);if(!extra)return data;
 const chapters=Object.fromEntries(Object.entries(data.chapters).map(([number,c])=>{const names=new Set((c.people||[]).map(p=>p.name));return [number,{...c,people:[...(c.people||[]),...(extra.additionalPeople?.[number]||[]).filter(p=>!names.has(p.name))],eventScenes:(extra.scenes||[]).filter(s=>s.chapter===Number(number))}];}));return {...data,chapters};
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
      const identity=resolveIdentity(person.name,{code,chapter:chap,role:person.role||''});
      const personKey=`${person.name}:${identity.id}`;
      if (!people.has(personKey)) people.set(personKey, { ...person, identity, refs: [] });
      const p = people.get(personKey);
      p.refs.push(reference); p.weight = Math.max(p.weight || 1, person.weight || 1);
    }
    for (const r of data.rels || []) relations.push({ ...r, sourceRef: reference, ref: `${name} ${chap}:${r.verses || ""}` });
    for (const e of data.events || []) events.push({ ...e, ref: `${name} ${chap}:${e.verses || ""}` });
  }
  const ruth = chapters.some((c) => c.code === "rut" && c.chap === 2 && c.data);
  if (ruth && ![...people.values()].some(p=>p.name==="일꾼")) people.set("일꾼", { name: "일꾼", role: "보아스의 밭에서 추수하는 일꾼", weight: 1, refs: ["룻기 2:4"] });
  const cast = [...people.values()].sort((a, b) => (b.weight || 1) - (a.weight || 1));
  if (!cast.length) cast.push({ name: "읽는 사람", role: "본문을 함께 살펴보는 안내 캐릭터 (창작)", refs: [], weight: 1 });
  const dedicated=scenesForChapters(chapters);
  const extraScenes=chapters.flatMap(c=>(c.data?.eventScenes||[]).filter(s=>(!c.verses?.length||c.verses.some(v=>s.verseNumbers.includes(v)))&&s.actors.every(name=>cast.some(p=>p.name===name))&&!dedicated.some(d=>d.code===s.code&&d.chapter===s.chapter&&d.ref===s.ref)));
  return { cast, relations, events, scenes: [...OBJECT_SCENES.filter(s=>chapters.some(c=>c.code===s.code&&c.chap===s.chapter&&c.data)), ...dedicated,...extraScenes].map(s=>enhanceScene(s,cast)), title: chapters.map((c) => `${c.name} ${c.chap}`).join(" · "), key: chapters.map((c) => `${c.code}.${c.chap}`).join("-") };
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
  if (requested.some((c) => !byCode[c.code].chapters[c.chap])) throw new Error("본문 자료가 아직 준비되지 않았어요");
  shell.querySelector(".pb-load").remove();
  shell.classList.add('pb-ready');
  if(!shell.querySelector('.pb-view-button')) shell.querySelector('.pb-world-head').insertAdjacentHTML('beforeend','<button class="pb-button pb-view-button" data-action="fullscreen">⛶ 화면 확대</button>');
  const objectChoice=(id,name)=>`<button class="pb-button pb-object-choice" data-place="${esc(id)}" aria-pressed="false" aria-label="${esc(name)} 배치. 한 번 터치, 1초 누르면 설명"><span class="pb-object-art"><canvas width="80" height="72" data-object-icon="${esc(id)}" aria-hidden="true"></canvas><svg class="pb-object-progress" viewBox="0 0 80 72" aria-hidden="true"><path d="M2 2H78V70H2Z"/></svg></span><span class="pb-object-choice-name">${esc(name)}</span></button>`;
  const chapterObjectButtons=chapterProps.map(item=>objectChoice(item.id,item.name)).join('');
  const commonObjectButtons=Object.entries(WORLD_OBJECTS).filter(([key])=>!chapterProps.some(item=>item.id===key)).map(([key,name])=>objectChoice(key,name)).join('');
  shell.insertAdjacentHTML("beforeend", `<div class="pb-world-stage"><canvas width="960" height="480" tabindex="0" aria-label="픽셀 월드. 인물을 누르면 대사와 선택 표시, 빈 땅을 누르면 선택 해제. 캐릭터를 끌어 옮기거나 선택 후 방향키로 걸어갈 수 있어요."></canvas><div class="pb-speech" role="status" aria-live="polite" aria-atomic="true" hidden><b class="pb-speech-speaker"></b><p></p><button type="button" class="pb-speech-reference" data-action="speech-details">자세히 보기</button><button type="button" class="pb-speech-reference" data-action="passage" hidden></button></div><div class="pb-event" hidden><div class="pb-event-card" role="status"></div></div></div>
    <button class="pb-button pb-side-toggle pb-toggle-left" data-action="toggle-left" aria-controls="pb-left-panel" aria-expanded="false">인물 ▸</button>
    <aside class="pb-side pb-side-left" id="pb-left-panel" hidden aria-label="인물·생물 선택과 외형 근거"><button class="pb-button" data-action="collection">발견 도감 · 알아가기</button><p class="pb-help">인물을 누르면 도감에 기록돼요. 은은한 발밑 빛은 현재 분량의 주요 인물이에요.</p><h3>분량 전체 인물·생물 · ${model.cast.length}명/집단</h3><p class="pb-help">주요·전체 인물을 고르거나 개별 표시를 바꿀 수 있어요. 이름을 누르면 해당 인물을 찾아가요.</p><div class="pb-world-toolbar"><button class="pb-button" data-cast-mode="major">주요 인물</button><button class="pb-button" data-cast-mode="all">전체 인물</button><button class="pb-button" data-cast-mode="animals">동물만</button><button class="pb-button" data-cast-mode="plants">식물만</button><button class="pb-button" data-cast-mode="none">모두 숨기기</button></div><p class="pb-cast-count"></p><div class="pb-recommendations" hidden></div><div class="pb-roster">${model.cast.map((p,i)=>`<div class="pb-roster-row"><button class="pb-button" data-cast-person="${i}" data-person="${visibleCast.indexOf(p)}" aria-pressed="${p===visibleCast[0]}">${esc(displayPersonName(p.name))}${p.creature?` <small>· ${p.creature.kind==='plant'?'식물':'동물'}</small>`:''}</button><button class="pb-button pb-person-toggle" data-toggle-person="${i}" aria-pressed="true" aria-label="${esc(displayPersonName(p.name))} 표시 전환">표시 중</button></div>`).join('')}</div><div class="pb-person-details"></div></aside>
    <button class="pb-button pb-side-toggle pb-toggle-right" data-action="toggle-right" aria-controls="pb-right-panel" aria-expanded="false">◂ 도구 · 조합</button>
    <aside class="pb-side pb-side-right" id="pb-right-panel" hidden aria-label="도구와 조합식"><p class="pb-scene-name">${noPlan?'체험 본문 · ':`${esc(options.scopeLabel||'통독 분량')} · `}${esc(model.title)}</p><div class="pb-world-toolbar"><button class="pb-button" data-action="relationships" aria-pressed="false">관계선 꺼짐</button><button class="pb-button" data-action="pause" aria-pressed="false">일시정지</button><button class="pb-button" data-action="bgm" aria-pressed="false" aria-label="배경음악 켜기">♫ 음악 OFF</button></div>
    <h3>배경 바꾸기</h3><p class="pb-help">상상 지형이에요. 실제 사건 장소를 뜻하지 않아요.</p><p class="pb-background-note pb-help"></p><div class="pb-world-toolbar pb-backgrounds">${Object.entries(BACKGROUNDS).map(([key,p])=>`<button class="pb-button" data-background="${key}" aria-pressed="false">${esc(displayPersonName(p.name))}</button>`).join('')}</div>
    <h3>본문 오브젝트</h3><p class="pb-help">가볍게 터치하면 배치돼요. 그림을 1초 꾹 누르면 테두리가 한 바퀴 돌고 설명이 열려요. 배치한 오브젝트는 0.4초 꾹 눌러 옮길 수 있어요.</p><p class="pb-help">${chapterProps.length?'현재 분량의 물건·공간·상징이에요. 구절 범위는 사건 설명의 범위예요.':'현재 요약에서 확인된 물건이 없어요. 공통 오브젝트로 꾸밀 수 있어요.'}</p><div class="pb-world-toolbar"><div class="pb-object-grid">${chapterObjectButtons}</div></div><details><summary>공통 오브젝트</summary><div class="pb-world-toolbar"><div class="pb-object-grid">${commonObjectButtons}</div></div></details><section class="pb-object-detail" data-object-detail hidden aria-live="polite"></section><div class="pb-world-toolbar"><button class="pb-button" data-action="cancel-place" hidden>배치 취소</button><button class="pb-button" data-action="remove-object" aria-pressed="false">개별 철거</button><button class="pb-button" data-action="reset">오브젝트 전체 철거</button></div>
    <h3>조합식</h3><p class="pb-help">아래 조합을 누르면 필요한 인물들이 모여요. 캐릭터를 집어 오브젝트 옆에 내려놓아도 돼요.</p><div class="pb-recipes"></div>
    ${model.scenes.length?'<button class="pb-button" data-action="scene">다음 본문 장면 모아 보기</button>':'<button class="pb-button" data-action="demo">룻기 2장 체험으로 이동</button>'}</aside>
    <div class="pb-camera-controls" aria-label="월드 시점"><button class="pb-button" data-action="camera-home">중앙으로</button><button class="pb-button" data-action="cancel-place" hidden>배치 취소</button></div>

    <div class="pb-world-info" role="status" aria-live="polite" hidden></div>
    <div class="pb-rotate"><span class="pb-phone" aria-hidden="true">▯ ↻ ▭</span><strong>가로로 펼치는<br>PIXEL BIBLE</strong><p>기기를 가로로 돌려 주세요.<br>화면 회전 잠금이 켜져 있다면 해제해 주세요.</p><button class="pb-button" data-action="fullscreen">가로 화면으로 입장</button></div>`);
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
  const canvas = shell.querySelector(".pb-world-stage > canvas"), ctx = canvas.getContext("2d");
  const camera={...homeCamera(),...options.camera};
  const view=()=>cameraView(canvas.width,canvas.height,camera);
  const info = shell.querySelector(".pb-world-info");
  const overlay = shell.querySelector(".pb-event"), eventCard = shell.querySelector(".pb-event-card");
  const speechElement=shell.querySelector('.pb-speech');
  const speech=new SpeechDirector({now:performance.now()-3000});let shownSpeech=null,speechWidth=0,speechHeight=0,pendingTalk=null;
  const encounters=new EncounterDirector(chapterData,dialogueContext,{maxActive:1});let encounterLines=[];const encounterBubbles=new Map();
  function cancelTalk(){if(pendingTalk){pendingTalk.plan.mover.path=[];pendingTalk=null;}}
  function hideSpeech(){if(shownSpeech?.speaker)shownSpeech.speaker.expression='neutral';cancelTalk();speech.dismiss(performance.now());speechElement.hidden=true;shownSpeech=null;}
  function faceEachOther(a,b){const directions=opposedDirections(a,b);if(!directions)return false;[a.direction,b.direction]=directions;a.idle=b.idle=6;return true;}
  function updateSpeech(now){
    const enabled=!paused&&!activeEvent&&!pendingEvent&&!drag?.active&&!objectHold?.active&&!placing&&!removing&&!shell.querySelector('.pb-design,.pb-scripture');
    const ready=!speech.current&&!pendingTalk&&now>=speech.nextAt;
    let current=null;
    if(!enabled){cancelTalk();speech.tick(now,[],false);}
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
        speechElement.querySelector('[data-action="speech-details"]').hidden=!speechContext(current,chapterData);
        const link=speechElement.querySelector('[data-action="passage"]');
        link.textContent=current.ref||'';link.hidden=!parseReference(current.ref)?.verses?.length;link.setAttribute('aria-label',`${current.ref||''} 성경 본문 보기`);
        speechWidth=speechElement.offsetWidth;speechHeight=speechElement.offsetHeight;
      }
    }
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
    const explanation=speechContext(choice,chapterData);if(!explanation)return;
    hideSpeech();
    shell.querySelector('.pb-scripture')?.remove();
    const panel=document.createElement('section');panel.className='pb-scripture';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','대사 쉽게 이해하기');
    panel.innerHTML='<header><b>대사 쉽게 이해하기</b><button class="pb-button" data-action="close-scripture">닫기 ✕</button></header><div class="pb-scripture-body"><p class="pb-detail-line"></p><section class="pb-detail-context"><h3>이런 상황이에요</h3><p></p></section><button class="pb-button" data-action="detail-passage">관련 구절 보기</button></div>';
    panel.querySelector('.pb-detail-line').textContent=choice.text;
    panel.querySelector('.pb-detail-context p').innerHTML=emphasizedContext(explanation,contextTerms({...choice,detailText:explanation}));
    const link=panel.querySelector('[data-action="detail-passage"]');link.hidden=!parsed?.verses?.length;link.dataset.reference=reference||'';link.dataset.terms=JSON.stringify(contextTerms({...choice,detailText:explanation}));link.textContent=reference?reference+' · 관련 구절 보기':'관련 구절 보기';
    shell.append(panel);panel.querySelector('button').focus();
  }
  function updateEncounters(now){
    const enabled=!paused&&!activeEvent&&!pendingEvent&&!shell.querySelector('.pb-design,.pb-scripture')&&!document.hidden;
    const excluded=[drag?.active?drag.n:null];
    encounterLines=encounters.tick(now,npcs,{enabled,excluded});
    if(pendingTalk&&[pendingTalk.choice.speaker,pendingTalk.choice.target].some(n=>n.encounter))cancelTalk();
    const ids=new Set(encounterLines.map(l=>l.session+':'+l.slot));
    for(const [id,el]of encounterBubbles)if(!ids.has(id)){el.remove();encounterBubbles.delete(id);}
    for(const line of encounterLines){
      const id=line.session+':'+line.slot;let el=encounterBubbles.get(id);
      if(!el){
        el=document.createElement('div');el.className='pb-speech pb-encounter';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
        el.innerHTML='<div class="pb-encounter-lines"></div><button class="pb-speech-reference" data-action="encounter-details">자세히 보기</button><button class="pb-speech-reference" data-action="encounter-passage"></button>';
        el.dataset.encounter=id;
        el.querySelector('.pb-encounter-lines').innerHTML=(line.pairLines||[line]).map(part=>`<section class="pb-encounter-line"><b class="pb-speech-speaker">${esc(displayPersonName(part.speaker.name))}</b><p></p></section>`).join('');
        [...el.querySelectorAll('.pb-encounter-line p')].forEach((p,i)=>{p.textContent=(line.pairLines||[line])[i].text;});
        el.querySelector('[data-action="encounter-details"]').hidden=!speechContext(line,chapterData);
        const link=el.querySelector('[data-action="encounter-passage"]');link.textContent=line.ref||'';link.hidden=!parseReference(line.ref)?.verses?.length;link.dataset.reference=line.ref||'';link.dataset.terms=JSON.stringify(contextTerms(line));
        shell.querySelector('.pb-world-stage').append(el);encounterBubbles.set(id,el);
      }
    }
  }
  function positionEncounters(){
    const r=canvas.getBoundingClientRect(),v=view();
    const placed=[];
    for(const line of encounterLines){
      const el=encounterBubbles.get(line.session+':'+line.slot);if(!el)continue;
      const pair=line.pairLines||[line];
      const onScreen=pair.every(part=>{const a=interactionAnchor(part.speaker,TILE),x=a.x*v.scale+v.x,y=a.y*v.scale+v.y;return x>=0&&x<=canvas.width&&y>=0&&y<=canvas.height;});
      if(!onScreen){el.style.visibility='hidden';continue;}
      const anchor={...line.speaker,x:pair.reduce((sum,part)=>sum+part.speaker.x,0)/pair.length,y:pair.reduce((sum,part)=>sum+part.speaker.y,0)/pair.length};
      const box=placeAboveHead(el,anchor,r,v,el.offsetWidth,el.offsetHeight,placed);
      if(box)placed.push(box);
    }
  }
  function placeAboveHead(el,n,r,v,width,height,placed=[]){
    const anchor=interactionAnchor(n,TILE);
    const x=(anchor.x*v.scale+v.x)*r.width/canvas.width;
    const y=((anchor.y-72*physiqueFor(n.name,n.role,n.refs).height)*v.scale+v.y)*r.height/canvas.height;
    const left=Math.max(4,Math.min(r.width-width-4,x-width/2));
    const top=Math.max(4,y-height-8),gap=8;
    let safeTop=top;
    // Keep every bubble above its speaker; move it upward by whole bubble heights
    // until it no longer covers another active bubble.
    while(placed.some(box=>left<box.right+gap&&left+width>box.left-gap&&safeTop<box.bottom+gap&&safeTop+height>box.top-gap))safeTop-=height+gap;
    const overlap=placed.some(box=>left<box.right+gap&&left+width>box.left-gap&&safeTop<box.bottom+gap&&safeTop+height>box.top-gap);
    el.style.left=`${Math.round(left)}px`;el.style.top=`${Math.round(safeTop)}px`;
    el.style.setProperty('--pb-tail',`${Math.max(12,Math.min(width-12,x-left))}px`);
    el.dataset.below='false';delete el.dataset.side;
    el.style.visibility=x<0||x>r.width||y<0||y>r.height||safeTop<0||overlap?'hidden':'';
    return {left,right:left+width,top:safeTop,bottom:safeTop+height};
  }
  function positionSpeech(){
    if(!shownSpeech||speechElement.hidden)return;
    placeAboveHead(speechElement,shownSpeech.speaker,canvas.getBoundingClientRect(),view(),speechElement.offsetWidth,speechElement.offsetHeight);
  }
  let backgroundKey=defaultBackground(requested);
  try{const saved=localStorage.getItem(backgroundStorageKey(model.key));if(Object.hasOwn(BACKGROUNDS,saved))backgroundKey=saved;}catch(_){}
  let terrain=sceneDecorations(backgroundKey);
  const storageKey = `pixel-bible-layout:${model.key}`;
  const defaults = () => [{ kind: "field", x: 48, y: 27 }, { kind: "water", x: 43, y: 25 }, { kind: "bench", x: 35, y: 25 }, { kind: "tree", x: 26, y: 21 }, { kind: "tree", x: 54, y: 24 }];
  let objects = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if(Array.isArray(saved))objects=fitLayout(saved,OBJECTS);
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
  reconcileCast(npcs,model.cast.filter(p=>exposed.has(castKey(p))),castCache,()=>null);
  let drag=null, objectHold=null, suppressClick=false, toastTimer=null;
  let showRelationships=!!options.showRelationships;
  let removing=false,objectSpeech=null,autoObjectAt=2;
  const objectCooldown=new Map(),visitorCooldown=new Map();
  let selected = -1, placing = null, paused = false, sound = false, disposed = false, frame = 0, last = 0, time = 0;
  let activeEvent = null, pendingEvent = null, eventIndex = 0, cinematicTime = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let blockedCells=new Set();
  const indexObjects=()=>{blockedCells=new Set([...objects,...terrain].filter(o=>(OBJECT_CATALOG[o.kind]?.action||o.kind)!=='field'&&!['lily','fruit','net'].includes(o.kind)).map(o=>`${o.x},${o.y}`));};
  indexObjects();
  const blocked = (x,y)=>x<BOUNDS.minX||x>BOUNDS.maxX||y<BOUNDS.minY||y>BOUNDS.maxY||waterAt(backgroundKey,x,y)||blockedCells.has(`${x},${y}`);
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
      const on=exposed.has(castKey(p));return `<button class="pb-button" data-add-person="${model.cast.indexOf(p)}" aria-disabled="${on}" data-unavailable-reason="이미 표시 중인 인물이에요: ${esc(displayPersonName(p.name))}.">${on?'✓':'＋'} ${esc(displayPersonName(p.name))} <small>${esc(label)}</small></button>`;
    }).join(''):'<p class="pb-help">현재 분량의 관계도에 연결된 추가 인물이 없어요.</p>');
  }
  function syncExposure(){
    shell.querySelector('.pb-cast-count').textContent=`표시 중 ${npcs.length} / 전체 ${model.cast.length}명·집단`;
    shell.querySelectorAll('[data-cast-person]').forEach(b=>{
      const person=model.cast[Number(b.dataset.castPerson)],i=npcs.findIndex(n=>castKey(n)===castKey(person));
      b.dataset.person=String(i);b.setAttribute('aria-pressed',i>=0&&i===selected);
    });
    shell.querySelectorAll('[data-toggle-person]').forEach(b=>{const on=exposed.has(castKey(model.cast[Number(b.dataset.togglePerson)]));b.setAttribute('aria-pressed',on);b.textContent=on?'표시 중':'숨김';});
    for(const b of shell.querySelectorAll('[data-cast-mode]')){
      const list=b.dataset.castMode==='all'?model.cast:b.dataset.castMode==='major'?majorCast(model):b.dataset.castMode==='animals'?model.cast.filter(p=>p.creature?.kind==='animal'):b.dataset.castMode==='plants'?model.cast.filter(p=>p.creature?.kind==='plant'):[];
      b.setAttribute('aria-pressed',list.length===npcs.length&&list.every(p=>exposed.has(castKey(p))));
    }
  }
  function applyExposure(){
    const old=npcs[selected];
    reconcileCast(npcs,model.cast.filter(p=>exposed.has(castKey(p))),castCache,()=>null);
    clearTerrainOverlap();
    if((speech.current&&[speech.current.speaker,speech.current.target].filter(Boolean).some(n=>!npcs.includes(n)))||
       (pendingTalk&&[pendingTalk.choice.speaker,pendingTalk.choice.target].some(n=>!npcs.includes(n))))hideSpeech();
    if(objectSpeech&&!npcs.includes(objectSpeech.speaker))objectSpeech=null;
    if(pendingEvent?.actors.some(n=>!npcs.includes(n)))pendingEvent=null;
    if(activeEvent&&sceneActors(activeEvent.scene).some(n=>!n))endEvent();
    selected=old?npcs.indexOf(old):-1;syncExposure();renderRecipes();draw();
    try{localStorage.setItem(exposureStorageKey(model.key),JSON.stringify([...exposed]));}catch(_){}
  }
  function togglePanel(side,open) {
    const panel=shell.querySelector(`#pb-${side}-panel`), button=shell.querySelector(`[data-action="toggle-${side}"]`);
    const show=open??panel.hidden;panel.hidden=!show;button.setAttribute('aria-expanded',show);
    button.textContent=side==='left'?(show?'인물 ◂':'인물 ▸'):(show?'도구 · 조합 ▸':'◂ 도구 · 조합');
  }
  const recipeUnlocks=loadRecipeUnlocks(localStorage);let hideRecipes=true;
  const dailyDone=()=>!!options.dailyReadingDone?.();
  const isRecipeLocked=scene=>recipeLocked(scene,{discovered:recipeUnlocks,dailyDone:dailyDone(),hide:hideRecipes});
  function renderRecipes() {
    const container=shell.querySelector('.pb-recipes');
    container.innerHTML=`<button class="pb-button" data-action="recipe-lock" aria-pressed="${hideRecipes}">${hideRecipes?'🔒 조합식 해금':'🔓 오늘의 조합식 보기'}</button><p class="pb-help">오늘 통독을 마치면 잠금을 풀 수 있어요. 직접 인물과 물건을 가까이 배치해 발견한 조합은 계속 열려요.</p>`+model.scenes.map((scene,i)=>{
      if(isRecipeLocked(scene))return `<article class="pb-recipe pb-recipe-mystery"><b>🔒 숨겨진 본문 장면</b><div class="pb-recipe-layout" aria-label="물음표 인물들을 물음표 오브젝트의 가까운 칸에 배치">${scene.actors.map(()=>'<span class="pb-mystery-person" aria-label="알 수 없는 인물">?</span>').join('')}${Array.from({length:1+(scene.requiresObjects?.length||0)},()=>'<span class="pb-mystery-object" aria-label="알 수 없는 오브젝트">?</span>').join('')}</div><small>각 인물을 물건 가까이 모아 보세요.</small></article>`;
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
    speech.interrupt(lines[Math.floor(Math.random()*lines.length)],performance.now());
    updateSpeech(performance.now());positionSpeech();
  }
  function select(i, speakOnSelect=false) {
    selected = i;
    shell.querySelectorAll("[data-person]").forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.person) >= 0 && Number(b.dataset.person) === i));
    const n=npcs[i];
    if(!n){shell.querySelector('.pb-person-details').innerHTML='<p>인물을 선택하면 특징과 관계를 볼 수 있어요.</p>';renderRecipes();return;}
    if(speakOnSelect){
      discover(n);
      const v=view(),anchor=interactionAnchor(n,TILE),sx=anchor.x*v.scale+v.x,sy=anchor.y*v.scale+v.y;
      if(sx<60||sx>canvas.width-60||sy<100||sy>canvas.height-60){camera.x=n.x*TILE;camera.y=n.y*TILE-36;constrainCamera(camera,canvas.width,canvas.height);syncCamera();}
      requestPersonal(n);
    }
    renderRecommendations(n);
    const style=characterStyle(n.name,i,n.role,n.refs,n.creature||false);
    shell.querySelector('.pb-person-details').innerHTML=`<h3>${esc(displayPersonName(n.name))}</h3><button class="pb-button" data-action="person-collection">발견 도감에서 보기</button><p class="pb-help">현재 분량: 연결 ${importanceFor(model,n).connections}명 · 관련 사건 ${importanceFor(model,n).events}개</p><p>${esc(n.role||'본문 속 인물')}</p><p>${esc(n.refs.join(', '))}</p><p class="pb-help">${esc(n.motion.evidence)}</p><p class="pb-help">${n.creature?(n.creature.kind==='plant'?'본문 속 식물':'본문 속 동물'):n.identity?.kind==='group'?'집단을 대표하는 상징 캐릭터':n.identity?.kind==='unresolved'?'인물 신원 추가 검토 중':n.identity?.kind==='spiritual'?'본문 속 존재의 상징 표현':'본문 인물'} · ${esc(n.identity?.id||'체험용 인물')}</p><h4>외형 근거</h4><p>${esc(style.physicalEvidence||'현재 본문에서 확정하지 않은 외모는 창작으로 표현해요.')}</p><p>${esc(style.physique?.evidence||'생물 고유 체형')}</p><p>${esc(style.wardrobeLabel||'생물 고유 외형')}</p><p>${esc(style.evidence)}</p><p class="pb-help">${esc(style.design)}</p><small>확인된 본문 특징과 창작 디자인을 구분해 표시해요.</small><p class="pb-help">캐릭터를 누른 채 끌면 집어 들 수 있어요. 빈 땅을 누르면 선택을 해제하고 자유롭게 거닐어요. 방향키로 직접 걸어갈 수도 있어요.</p>`;
    renderRecipes();if(!speakOnSelect)clearInfo();
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
      body.innerHTML=`<button class="pb-button" data-action="collection">← 발견한 인물 전체</button><h2>${esc(displayPersonName(record.name))}</h2>${renderPersonPreview({...record,role:record.roles?.[0]||'',creature:false})}<button class="pb-button" data-discovery-favorite="${esc(key)}" aria-pressed="${!!record.favorite}">${record.favorite?'★ 관심 인물 해제':'☆ 관심 인물 등록'}</button><p class="pb-help" role="status">${esc(learningNext(record,discoveries))}</p><progress max="4" value="${stage}" aria-label="알아가기 ${stage}단계"></progress><p>알아가기 ${stage}/4 · ${['','첫 만남','이야기 듣기','관계 알아가기','깊이 알아가기'][stage]}</p><p>이야기 읽기 ${record.read.length}개 · 만난 날 ${record.days.length}일 · 주변 인물 발견 ${neighbors.filter(r=>discoveries[r.key]).length}/${neighbors.length}</p><p class="pb-help">이야기 하나 읽기 → 주변 인물 만나기(관계 기록이 없으면 생략) → 다른 날 다시 만나고 이야기 두 개 읽기로 진행해요. 성경 본문은 단계와 관계없이 언제든 읽을 수 있어요.</p><h3>인물 소개</h3>${record.roles.map(role=>`<p>${esc(role)}</p>`).join('')}<h3>주요 등장 권</h3><p>${mainBooks.map(esc).join(' · ')||'현재 발견한 본문부터 확인해요.'}</p><small>앱 요약에서 확인된 등장 장 수 기준이에요. 실제 성경 발화량을 뜻하지 않아요.</small><h3>지금까지 만난 본문</h3><p>${record.refs.map(esc).join(' · ')}</p><h3>계보 · 가족 관계</h3>${family.length?family.map(relationHtml).join(''):'<p>지금까지 만난 본문에는 확인된 가족 관계가 없어요.</p>'}<h3>한 다리 주변 인물</h3>${neighbors.length?neighbors.map(relationHtml).join(''):'<p>현재 분량에 확인된 주변 인물이 없어요.</p>'}<h3>더 알아가는 이야기</h3><p class="pb-help">본문을 읽으며 만나는 사건들이 모여요. 실제 성경 발언이나 원문 인용이 아닌 짧은 상황 설명이에요.</p>${record.stories.slice(0,count).map((story,i)=>`<article class="pb-discovery-story"><p>${esc(story.text)}</p><small>${esc(story.ref)}</small><button class="pb-button" data-story="${i}" data-discovery-owner="${esc(key)}">${record.read.includes(storyKey(story))?'다시 읽기':'이야기 읽고 관련 구절 보기'}</button></article>`).join('')}${record.stories.length>count?(stage===4?`<button class="pb-button" data-more-stories="${esc(key)}" data-story-limit="${storyLimit+20}">이야기 더 보기 · ${record.stories.length-count}개 남음</button>`:`<p>다음 알아가기 단계에서 이야기 ${record.stories.length-count}개를 더 정리해 보여 드려요.</p>`):''}${!record.stories.length?'<p>현재 분량에서 확인된 사건 설명이 아직 없어요. 다른 본문에서 다시 만나면 내용이 더해져요.</p>':''}`;
      bindPersonPreview(body);
    }
    shell.append(panel);panel.querySelector('button').focus();
  }
  function move(n, goal, task = null) {
    if(n.creature?.kind==='plant')return false;
    encounters.cancel(n);
    if(pendingTalk||speech.current?.speaker===n||speech.current?.target===n)hideSpeech();
    const path = findPath(cell(n), goal, blocked);
    if (!path) return false;
    n.path = path; n.task = task; n.usingObject=null;n.interaction=null;n.objectScene=null;n.objectAction=null;n.objectEvidence=null;n.action = ""; n.idle = 5;
    return true;
  }
  function toObject(n, o) {
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
  function showLine() {
    const ev = activeEvent;
    ev.elapsed = 0;
    eventCard.innerHTML = `<b>${esc(ev.scene.title)}</b><p>${esc(ev.scene.lines[ev.step])}</p><small>${esc(ev.scene.ref)} · 본문 뜻풀이</small>${ev.scene.study?`<details><summary>본문과 주석 해설</summary><p>${esc(ev.scene.study)}</p><p>${esc(ev.scene.objectNote || "")}</p></details>`:""}<div><button class="pb-button" data-action="next">${ev.step === ev.scene.lines.length-1 ? "장면 마치기" : "다음"}</button> <button class="pb-button" data-action="skip">건너뛰기</button></div>`;
    speak(ev.scene.lines[ev.step]);
  }
  function beginEvent(scene) {
    recipeUnlocks.add(recipeKey(scene));try{localStorage.setItem(RECIPE_KEY,JSON.stringify([...recipeUnlocks]));}catch(_){}
    activeEvent = { scene, object:pendingEvent?.o, step: 0, elapsed: 0 }; cinematicTime = 0; pendingEvent = null;
    sceneActors(scene).forEach((n) => { n.path=[];n.task=null;n.eventRoutine=eventRoutine(scene,n);n.eventObjects=objects.filter(o=>(scene.requiresObjects||[]).includes(o.kind)&&Math.hypot(o.x-activeEvent.object.x,o.y-activeEvent.object.y)<=3.5);n.eventPartner=sceneActors(scene).find(other=>other.name===scene.eventMotion?.target)||sceneActors(scene).find(other=>other!==n);n.action=scene.actions ? (scene.actions[n.name] || "") : scene.object;n.usingObject=n.action?(n.action===scene.object?activeEvent.object:n.eventObjects.find(o=>o.kind===n.action)||activeEvent.object):null;n.objectAction=scene.id;n.interaction=n.action?interactionRoutine(n,n.action):null;n.interactionStart=time; });
    if(activeEvent.object){camera.x=activeEvent.object.x*TILE;camera.y=activeEvent.object.y*TILE-36;constrainCamera(camera,canvas.width,canvas.height);syncCamera();}
    clearInfo();overlay.hidden = false; renderRecipes();showLine();
  }
  function endEvent() { if(activeEvent)sceneActors(activeEvent.scene).filter(Boolean).forEach(n=>{n.action="";n.usingObject=null;n.interaction=null;n.objectAction=null;n.eventRoutine=null;n.eventObjects=null;n.eventPartner=null;n.idle=5;}); activeEvent = null; pendingEvent = null; overlay.hidden = true; if (sound) speechSynthesis.cancel(); }
  function discoverPlacedRecipe(object){
    if(activeEvent||pendingEvent)return;for(const scene of model.scenes){if(!isRecipeLocked(scene)||![scene.object,...(scene.requiresObjects||[])].includes(object.kind))continue;const center=objects.find(o=>o.kind===scene.object&&recipeAssembled(scene,npcs,o,objects));if(center){queueScene(scene,center);return;}}
  }
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
    if (scene) return queueScene(scene,o);
    clearInfo();
    if (!toObject(n,o)) say("가는 길이 막혀 있어요. 다른 오브젝트나 빈 곳을 선택해 주세요.");
  }
  function coordinates(e) {
    const r=canvas.getBoundingClientRect(),v=view();
    return {x:((e.clientX-r.left)*canvas.width/r.width-v.x)/v.scale/TILE,y:((e.clientY-r.top)*canvas.height/r.height-v.y)/v.scale/TILE};
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
      if(objectHold!==held||disposed||!options.allowed()||activeEvent||document.hidden||window.innerWidth<=window.innerHeight)return;
      held.active=true;suppressClick=true;canvas.dataset.dragging='true';
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
    const under=document.elementFromPoint(e.clientX,e.clientY),p=objectLanding(held);
    if(!cancel&&options.allowed()&&under===canvas&&canMoveObject(held.o,p,[...objects,...terrain],npcs)){
      Object.assign(held.o,p);save();renderRecipes();clearInfo();discoverPlacedRecipe(held.o);
    }else if(!cancel)say('다른 물건·인물·이동 경로와 겹치지 않는 빈 땅에 놓아 주세요.');
    draw();
  }
  const pointers=new Map();let pinch=null,pan=null,gestureActive=false;
  const pixelPoint=e=>clientToCanvasPoint(e.clientX,e.clientY,canvas.getBoundingClientRect(),canvas.width,canvas.height);
  const pair=()=>[...pointers.values()].slice(0,2);
  const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  function syncCamera(){
    canvas.dataset.cameraX=String(Math.round(camera.x));canvas.dataset.cameraY=String(Math.round(camera.y));canvas.dataset.zoom=String(camera.zoom);
  }

  canvas.addEventListener('wheel',e=>{e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);zoomAt(camera,camera.zoom*Math.exp(-delta*.0015),pixelPoint(e),canvas.width,canvas.height);syncCamera();draw();},{signal,passive:false});
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0||!options.allowed())return;
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
      const rect=canvas.getBoundingClientRect();pan={id:e.pointerId,start:point,last:point,active:false,slop:touchSlopPixels(canvas.width,rect.width)};
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
    if(!options.allowed()||activeEvent||placing||removing||e.button!==0||window.innerHeight>=window.innerWidth)return;
    const touch=e.pointerType==='touch',point=coordinates(e),index=hitPerson(point,touch),object=hitPlacedObject(point,touch);
    if(object&&(index<0||npcs.some(n=>n.usingObject===object&&heldObject(n,time,reduced))||object.y*TILE>interactionAnchor(npcs[index],TILE).y)){beginObjectHold(object,e,point);return;}
    if(index<0)return;
    select(index);const n=npcs[index];

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
    if(!drag.active&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6){hideSpeech();drag.active=true;pendingEvent=null;drag.n.path=[];drag.n.task=null;drag.n.action='';drag.n.usingObject=null;drag.n.interaction=null;canvas.dataset.dragging='true';say(`${objectPhrase(drag.n.name)} 집어 들었어요. 빈 땅이나 오브젝트에 내려놓아 보세요.`);}
    if(drag.active){e.preventDefault();drag.vx=drag.vx*.65+(e.clientX-drag.lastX)*.35;drag.lastX=e.clientX;drag.p=coordinates(e);draw();}
  },{signal});
  function finishDrag(e,cancel=false) {
    if(!drag||e.pointerId!==drag.id)return;
    const held=drag;drag=null;delete canvas.dataset.dragging;
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(!held.active){if(!cancel)requestPersonal(held.n);suppressClick=true;return;}
    suppressClick=true;
    const n=held.n,p=coordinates(e),under=document.elementFromPoint(e.clientX,e.clientY);
    if(cancel||!options.allowed()||under?.closest('.pb-side,.pb-world-head,.pb-side-toggle,.pb-camera-controls')){n.x=held.from.x;n.y=held.from.y;n.idle=5;Object.assign(camera,held.fromCamera);syncCamera();draw();return;}
    held.p=p;const origin=grabbedOrigin(held);
    const landing={x:Math.max(BOUNDS.minX,Math.min(BOUNDS.maxX,Math.round(origin.x))),y:Math.max(BOUNDS.minY,Math.min(BOUNDS.maxY,Math.round(origin.y)))};
    const obj=objects.find(o=>Math.hypot(o.x-landing.x,o.y-landing.y)<1.6||Math.hypot(o.x-p.x,o.y-p.y)<1.3);
    if(obj){
      const spot=adjacent(obj,landing)[0];
      if(spot){n.x=spot.x;n.y=spot.y;n.idle=8;keepInView(n);interact(n,obj);updateEncounters(performance.now());draw();return;}
    }
    if(!n.creature&&waterAt(backgroundKey,landing.x,landing.y)){const safe=dryLanding(backgroundKey,landing,blocked);if(safe){n.x=landing.x;n.y=landing.y;n.path=[];n.task=null;n.usingObject=null;n.waterEscape={elapsed:0,safe};say('첨벙! 잠시 뒤 물가로 올라와요.');draw();return;}}
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
    if (!options.allowed() || activeEvent || window.innerHeight >= window.innerWidth) return;
    const p = coordinates(e), x = Math.round(p.x), y = Math.round(p.y);
    if(removing){
      const object=objects.map(o=>({o,d:Math.hypot(o.x-p.x,o.y-p.y)})).filter(v=>v.d<1.8).sort((a,b)=>a.d-b.d)[0]?.o;
      if(object)demolish(o=>o===object);else say('철거할 오브젝트의 밑부분을 눌러 주세요.');
      return;
    }
    if (placing) {
      if (blocked(x,y) || objects.some((o) => o.x===x && o.y===y) || npcs.some((n) => Math.hypot(n.x-x,n.y-y)<1)) return say("나무·인물과 겹치지 않는 빈 땅을 골라 주세요.");
    const addedObject={kind:placing,x,y};objects.push(addedObject); save(); renderRecipes(); placing = null; autoObjectAt=Math.min(autoObjectAt,time+.5);syncPlacement();discoverPlacedRecipe(addedObject); say("오브젝트를 놓았어요. 0.4초 꾹 누르면 위치를 옮길 수 있어요."); return;
    }
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
    if (o) {if(n)interact(n,o);return;}
    // 배경 클릭은 이동 명령이 아니다. 기존 자연 이동을 유지하며 선택만 해제한다.
    if(n)n.idle=Math.min(n.idle,1);
    select(-1);draw();
  }, {signal});
  canvas.addEventListener("keydown", (e) => {
    if (drag||objectHold) return;
    if (!options.allowed() || activeEvent || window.innerHeight >= window.innerWidth) return;
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
  shell.addEventListener("click", async (e) => {
    if (drag?.active||objectHold?.active) return;
    if (!options.allowed()) return;
    const b=e.target.closest("button"); if(!b) return;
    if(b.dataset.action==='recipe-lock'){if(hideRecipes&&!dailyDone()){say('오늘 통독을 마치거나 직접 조합을 발견하면 열 수 있어요.');return;}hideRecipes=!hideRecipes;renderRecipes();return;}
    if (b.dataset.recipe!==undefined) { const scene=model.scenes[Number(b.dataset.recipe)],o=objects.find(o=>o.kind===scene.object);if(!scene)return;if(isRecipeLocked(scene)){say('아직 잠긴 조합이에요. 직접 배치해 발견해 보세요.');return;}if(activeEvent){say('장면이 진행 중이에요. 끝난 뒤 다시 눌러 주세요.');return;}if(!o||scene.actors.some(name=>!npcs.some(n=>n.name===name))){say(b.dataset.unavailableReason||'필요한 인물과 오브젝트를 먼저 준비해 주세요.');return;}queueScene(scene,o);return; }
    if (b.dataset.commonRecipe) {const o=objects.find(o=>o.kind===b.dataset.commonRecipe),n=npcs[selected];if(activeEvent||!o||!n||n.creature&&!creatureCanUse(n,b.dataset.commonRecipe)){say(b.dataset.unavailableReason||'필요한 인물과 오브젝트를 먼저 준비해 주세요.');return;}pendingEvent=null;clearInfo();if(!toObject(n,o))say('오브젝트 주변의 길과 설 자리를 비워 주세요.');return;}
    if (b.dataset.background && Object.hasOwn(BACKGROUNDS,b.dataset.background)) {
      backgroundKey=b.dataset.background;terrain=sceneDecorations(backgroundKey).filter(o=>!objects.some(p=>Math.hypot(p.x-o.x,p.y-o.y)<2.5));indexObjects();clearTerrainOverlap();paintBackground();syncBackground();draw();
      try{localStorage.setItem(backgroundStorageKey(model.key),backgroundKey);}catch(_){}
      say(`${BACKGROUNDS[backgroundKey].name} · 상상 지형`);return;
    }
    if(b.dataset.castMode){
      if(drag||objectHold)return;
      exposed=new Set((b.dataset.castMode==='all'?model.cast:b.dataset.castMode==='major'?majorCast(model):b.dataset.castMode==='animals'?model.cast.filter(p=>p.creature?.kind==='animal'):b.dataset.castMode==='plants'?model.cast.filter(p=>p.creature?.kind==='plant'):[]).map(castKey));applyExposure();shell.querySelector('.pb-recommendations').hidden=true;return;
    }
    if(b.dataset.togglePerson!==undefined||b.dataset.addPerson!==undefined){
      if(drag||objectHold)return;
      const person=model.cast[Number(b.dataset.togglePerson??b.dataset.addPerson)],key=castKey(person);
      if(b.dataset.addPerson!==undefined&&exposed.has(key)){say(`이미 표시 중인 인물이에요: ${person.name}.`);return;}
      if(b.dataset.addPerson!==undefined)exposed.add(key);else if(exposed.has(key))exposed.delete(key);else exposed.add(key);
      applyExposure();renderRecommendations(b.dataset.addPerson!==undefined&&recommendationPerson?recommendationPerson:person);return;
    }
    if (b.dataset.castPerson!==undefined) {
      const person=model.cast[Number(b.dataset.castPerson)],key=castKey(person);
      if(!exposed.has(key)){exposed.add(key);applyExposure();}
      const index=npcs.findIndex(n=>castKey(n)===key);
      if(expandedCast===key){expandedCast=null;shell.querySelector('.pb-recommendations').hidden=true;shell.querySelector('.pb-person-details').hidden=true;b.setAttribute('aria-expanded','false');return;}
      expandedCast=key;shell.querySelectorAll('[data-cast-person]').forEach(el=>el.setAttribute('aria-expanded',el===b));
      shell.querySelector('.pb-person-details').hidden=false;if(index>=0)select(index,true);return;
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
    if(action==='bgm'){try{const on=await bgm.setEnabled(!bgm.enabled);b.setAttribute('aria-pressed',on);b.textContent=on?'♫ 음악 ON':'♫ 음악 OFF';b.setAttribute('aria-label',on?'배경음악 끄기':'배경음악 켜기');}catch(error){say(error.message);}return;}
    if(action==='camera-home'){Object.assign(camera,homeCamera());constrainCamera(camera,canvas.width,canvas.height);syncCamera();draw();return;}
    if(action==='relationships'){
      showRelationships=!showRelationships;syncRelationships();draw();return;
    }
    if(b.dataset.moreStories!==undefined){openCollection(b.dataset.moreStories,Number(b.dataset.storyLimit));return;}
    if(b.dataset.discoveryFavorite!==undefined){const key=b.dataset.discoveryFavorite;if(discoveries[key]){discoveries[key].favorite=!discoveries[key].favorite;saveDiscoveries();openCollection(key);}return;}
    if(b.dataset.discovery!==undefined){openCollection(b.dataset.discovery);return;}
    if(b.dataset.story!==undefined){const key=b.dataset.discoveryOwner,record=discoveries[key],story=record?.stories[Number(b.dataset.story)];if(story){discoveries[key]=markStoryRead(record,story);saveDiscoveries();await openSpeechPassage(story.ref,contextTerms({text:story.text}));shell.querySelector('.pb-scripture header')?.insertAdjacentHTML('afterbegin',`<button class="pb-button" data-discovery="${esc(key)}">도감으로</button>`);}return;}
    if(action==='collection'){openCollection();return;}
    if(action==='person-collection'){const person=npcs[selected];if(person){discover(person);openCollection(discoveryKey(person));}return;}
    if(action==='encounter-details'){const id=b.closest('[data-encounter]').dataset.encounter;openSpeechDetails(encounterLines.find(l=>l.session+':'+l.slot===id));return;}
    if(action==='encounter-passage'){await openSpeechPassage(b.dataset.reference,b.dataset.terms?JSON.parse(b.dataset.terms):contextTerms(shownSpeech));return;}
    if(action==='speech-details'){openSpeechDetails();return;}
    if(action==='detail-passage'){await openSpeechPassage(b.dataset.reference,b.dataset.terms?JSON.parse(b.dataset.terms):contextTerms(shownSpeech));return;}
    if(action==='passage'){await openSpeechPassage();return;}
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
      shell.querySelector('.pb-view-button').textContent=expand?'⛶ 화면 복원':'⛶ 화면 확대';
      if(expand){togglePanel('left',false);togglePanel('right',false);options.landscape();say('양옆 버튼으로 인물과 조합 도구를 펼칠 수 있어요.');}
      else if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
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
    const idle=npcs.filter(n=>n.creature?.kind!=='plant'&&!n.encounter&&!n.path.length&&!n.task&&!n.action&&speech.current?.speaker!==n&&speech.current?.target!==n);
    const pairs=objects.filter(o=>!npcs.some(n=>n.task===o||n.usingObject===o)).flatMap(o=>{
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
  function update(dt) {
    time+=dt;autoObjects();
    for(const n of npcs) {
      if(n.waterEscape){const state=n.waterEscape;state.elapsed+=dt;n.direction='down';n.stride+=dt*8;if(state.elapsed>=5){n.x=state.safe.x;n.y=state.safe.y;n.waterEscape=null;n.idle=3;say('휴! 물가로 올라와 숨을 고르고 있어요.');}continue;}
      if(n.creature?.kind==='plant'){n.path=[];n.task=null;continue;}
      if(drag?.active && drag.n===n)continue;
      if(n.encounter){n.idle=6;continue;}
      const talk=pendingTalk?.choice||speech.current;
      if(talk?.target&&(n===talk.speaker||n===talk.target)&&!n.path.length){n.idle=6;continue;}
      if(talk?.speaker===n&&!n.path.length){n.idle=1;continue;}
      if(n.path.length) {
        const p=n.path[0],dx=p.x-n.x,dy=p.y-n.y,d=Math.hypot(dx,dy),step=dt*n.motion.speed*motionPose(n.motion,n.stride,true,time).speed;
        n.direction=movementDirection(dx,dy,n.direction);
        n.stride+=(Math.min(d,step));
        if(blocked(p.x,p.y)) { n.path=[];n.task=null;continue; }
        if(d<=step) { n.x=p.x;n.y=p.y;n.path.shift(); }
        else { n.x+=dx/d*step;n.y+=dy/d*step; }
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
        if(['bench','throne','footstool'].includes(target.kind)) { n.x=target.x;n.y=target.y;n.direction="right"; }
      } else if((n.idle-=dt)<=0 && !pendingEvent?.actors.includes(n)) {
        n.action="";n.usingObject=null;n.interaction=null;n.idle=3+Math.random()*5;
        if(!reduced&&!pendingTalk&&n.creature?.body!=='fish') {const far=Math.random()<.2;const p={x:far?BOUNDS.minX+Math.floor(Math.random()*(BOUNDS.maxX-BOUNDS.minX+1)):Math.max(BOUNDS.minX,Math.min(BOUNDS.maxX,Math.round(n.x+(Math.random()-.5)*16))),y:far?BOUNDS.minY+Math.floor(Math.random()*(BOUNDS.maxY-BOUNDS.minY+1)):Math.max(BOUNDS.minY,Math.min(BOUNDS.maxY,Math.round(n.y+(Math.random()-.5)*12)))};if(!blocked(p.x,p.y))move(n,p);}
      }
    }
    if(pendingEvent && pendingEvent.actors.every((n)=>!n.path.length && Math.hypot(n.x-pendingEvent.o.x,n.y-pendingEvent.o.y)<=1.5)) beginEvent(pendingEvent.scene);
  }

  // 배경은 한 번 그리고 매 프레임 재사용한다.
  const background=document.createElement("canvas");background.width=WORLD.width;background.height=WORLD.height;
  function syncBackground(){shell.querySelectorAll('[data-background]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.background===backgroundKey));const ref=BACKGROUNDS[backgroundKey].ref;shell.querySelector('.pb-background-note').textContent=ref?`본문 모티브 · ${ref}`:'자유롭게 꾸미는 기본 상상 지형';}
  function paintBackground(){
    const c=background.getContext('2d');
    drawWholeBackground(c,backgroundKey,WORLD.width,WORLD.height,{decorations:false});
  }
  paintBackground();syncBackground();
  function draw() {
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    const v=view();
    ctx.imageSmoothingEnabled=false;ctx.save();ctx.setTransform(v.scale,0,0,v.scale,v.x,v.y);ctx.save();
    ctx.drawImage(background,0,0);
    const light=globalThis.KstLight.at();
    const visible=(x,y)=>x*TILE>-v.x/v.scale-140&&x*TILE<(canvas.width-v.x)/v.scale+140&&y*TILE>-v.y/v.scale-140&&y*TILE<(canvas.height-v.y)/v.scale+140;
    const items=[...terrain.filter(o=>visible(o.x,o.y)).map(o=>({y:o.y,draw:()=>drawWorldObject(ctx,o,TILE)})),...objects.filter(o=>(!objectHold?.active||objectHold.o!==o)&&!npcs.some(n=>n.eventRoutine?.gesture==='axe-float'&&n.eventObjects?.includes(o)&&o.kind==='axe')&&visible(o.x,o.y)).map((o)=>({y:o.y,draw:()=>drawObject(ctx,o,objectInteractionFrame(o,npcs,time+cinematicTime,reduced))})),...npcs.filter(n=>(!drag?.active||drag.n!==n)&&visible(n.x,n.y)).map((n)=>({y:interactionAnchor(n,TILE).y/TILE,draw:()=>drawNpc(ctx,n,npcs.indexOf(n),time+cinematicTime,npcs.indexOf(n)===selected,activeEvent?.scene.actors.includes(n.name),reduced)}))].sort((a,b)=>a.y-b.y);
    items.forEach((item)=>item.draw());
    if(drag?.active)drawLifted(ctx,drag,time,reduced);
    if(objectHold?.active){
      const p=objectLanding(objectHold),valid=canMoveObject(objectHold.o,p,[...objects,...terrain],npcs);
      ctx.fillStyle=valid?'#79c99566':'#e17e7866';ctx.fillRect((p.x-.6)*TILE,(p.y-.4)*TILE,1.2*TILE,.8*TILE);
      ctx.save();ctx.globalAlpha=.8;drawWorldObject(ctx,{...objectHold.o,...grabbedOrigin(objectHold)},TILE,objectHold.frame);ctx.restore();
    }
    for(const n of npcs.filter(n=>n.waterEscape)){const x=n.x*TILE,y=n.y*TILE;ctx.fillStyle='#6ab5c5';for(let j=0;j<3;j++){const step=Math.floor(n.waterEscape.elapsed*5)%3;ctx.fillRect(x-18+j*12,y-6-(j===step?12:0),9,3);}ctx.fillStyle='#d9f4ee';ctx.fillRect(x-19,y-1,38,3);}
    if(light.alpha){ctx.save();ctx.globalAlpha=light.alpha;ctx.fillStyle=light.shade;ctx.fillRect(0,0,WORLD.width,WORLD.height);ctx.restore();}
    const talkingRelations=model.relations.filter(r=>encounterLines.some(l=>l.origin!=='general'&&l.target&&((l.speaker.name===r.from&&l.target.name===r.to)||(l.speaker.name===r.to&&l.target.name===r.from))));
    if(showRelationships||talkingRelations.length)drawRelationshipLinks(ctx,relationshipLinks(showRelationships?model.relations:talkingRelations,npcs,drag));
    ctx.restore();
    if(placing) {ctx.setTransform(1,0,0,1,0,0);const dpr=canvas.width/canvas.getBoundingClientRect().width;ctx.fillStyle='#102e38ed';const w=Math.min(400*dpr,canvas.width-20*dpr);ctx.fillRect((canvas.width-w)/2,canvas.height-104*dpr,w,30*dpr);ctx.fillStyle='#ffe5a2';ctx.font=`${14*dpr}px "DungGeunMo", monospace`;ctx.textAlign='center';ctx.fillText(`${OBJECTS[placing]} · 빈 땅을 눌러 배치`,canvas.width/2,canvas.height-84*dpr);}
    ctx.restore();positionSpeech();positionEncounters();
    shell.dataset.kstLight=globalThis.KstLight.at().key;
  }
  shell.closest("dialog")?.addEventListener("cancel",(e)=>{
    const scripture=shell.querySelector('.pb-scripture');if(scripture){e.preventDefault();scripture.remove();canvas.focus();return;}
    const board=shell.querySelector(".pb-design");if(board){e.preventDefault();board.remove();shell.querySelector('[data-action="design"]').focus();}
  },{signal});
  const fitCanvas=()=>{
    const r=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(r.width*ratio));canvas.height=Math.max(1,Math.round(r.height*ratio));constrainCamera(camera,canvas.width,canvas.height);syncCamera();if(shownSpeech){speechWidth=speechElement.offsetWidth;speechHeight=speechElement.offsetHeight;}draw();
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
  const canRun=()=>!disposed&&!document.hidden&&window.innerWidth>window.innerHeight&&options.allowed();
  function tick(stamp) {
    if(disposed)return;
    if(!options.allowed()) {say("월드를 다시 열어 주세요.");return;}
    const dt=Math.min(.05,(stamp-last)/1000||0);last=stamp;
    if(!paused&&!shell.querySelector('.pb-scripture')) {
      if(!activeEvent) update(dt);
      else {
        cinematicTime+=dt;activeEvent.elapsed+=dt;
        if(activeEvent.elapsed>Math.max(4.5,activeEvent.scene.lines[activeEvent.step].length*.09) && (!sound || !speechSynthesis.speaking || activeEvent.elapsed>45)) { if(++activeEvent.step>=activeEvent.scene.lines.length) endEvent(); else showLine(); }
      }
    }
    followDraggedCharacter(dt);
    updateEncounters(performance.now());updateSpeech(performance.now());draw();
    if(canRun())frame=requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame);last=0;
    if(document.hidden || window.innerWidth<=window.innerHeight) {hideSpeech();encounters.clear();updateEncounters(performance.now());if(objectHold)finishObjectHold({pointerId:objectHold.id,clientX:0,clientY:0},true);if(drag)finishDrag({pointerId:drag.id,clientX:0,clientY:0},true);if(sound)speechSynthesis.cancel();return;}
    if(canRun())frame=requestAnimationFrame(tick);
  }
  document.addEventListener("visibilitychange",resume,{signal});window.addEventListener("resize",resume,{signal});
  function cleanup() {if(disposed)return;disposed=true;bgm.dispose();encounters.clear();for(const el of encounterBubbles.values())el.remove();if(objectHold){clearTimeout(objectHold.timer);objectHold=null;}hideSpeech();abort.abort();clearTimeout(toastTimer);resizeObserver.disconnect();cancelAnimationFrame(frame);if(sound)speechSynthesis.cancel();}
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
  if(!Object.hasOwn(WORLD_OBJECTS,o.kind)&&OBJECT_CATALOG[o.kind]){
    c.save();c.font='10px "DungGeunMo", monospace';c.textAlign='center';const name=OBJECT_CATALOG[o.kind].name,w=c.measureText(name).width+8;
    c.fillStyle='#12303bd9';c.fillRect(o.x*TILE-w/2,o.y*TILE+15,w,15);c.fillStyle='#fff1c9';c.fillText(name,o.x*TILE,o.y*TILE+26);c.restore();
  }
}
function drawNpc(c,n,index,time,selected,acting,reduced=false) {
  const pose=motionPose(n.motion,n.stride,!!n.path.length,time);
  let actionPose=n.usingObject&&n.interaction?interactionPose(n.interaction,time-(n.interactionStart||0),reduced):null;
  if(n.creature?.kind==='plant'&&!actionPose)actionPose={phase:reduced?0:Math.floor(time*1.5)%4,bodyX:0,bodyY:0,hand:0,creatureAction:'sway'};
  const held=heldObject(n,time,reduced,TILE);
  if((held||actionPose?.wearing)&&actionPose)actionPose={...actionPose,heldObject:true};
  const rise=(n.objectAction==='zacchaeus-tree'||actionPose?.actual==='climb')&&n.usingObject?36+(actionPose?.climb||0):0;
  const anchor=interactionAnchor(n,TILE);
  const x=Math.round(anchor.x)+pose.x,y=Math.round(anchor.y)+pose.y-rise;
  if(n.prominent){c.save();c.globalAlpha=reduced?.6:.45+.15*Math.sin(time*2);c.fillStyle='#f6d782';c.beginPath();c.ellipse(x,y+4,23,7,0,0,Math.PI*2);c.fill();c.strokeStyle='#fff0b3';c.lineWidth=2;c.stroke();c.restore();}
  c.save();c.translate(x,y-28);c.rotate(pose.tilt);c.translate(-x,-y+28);
  drawPixelCharacter(c,characterStyle(n.name,index,n.role,n.refs,n.creature||false),x,y+(acting&&!actionPose?.lie&&!actionPose?.scripted?Math.round(Math.sin(time*4)*2):0),{scale:2,walkFrame:n.path.length?Math.floor((n.stride||0)*2)%4:n.creature?.body==='fish'&&!reduced?Math.floor(time*3)%4:n.usingObject&&!reduced&&!actionPose?.scripted?Math.floor(time*2)%4:0,action:n.action,interaction:actionPose,time:reduced?0:time,direction:n.direction||"down",expression:actionPose?.actual==='bonk'&&actionPose.phase===2&&actionPose.within>=.65?'surprised':n.expression||"neutral",selected});
  if(held){drawWorldObject(c,held,TILE,held.frame);drawObjectResponse(c,n.usingObject,objectInteractionFrame(n.usingObject,[n],time,reduced),TILE);}
  const shape=n.creature?{width:1,height:1}:physiqueFor(n.name,n.role,n.refs);
  c.save();c.translate(x,y);c.scale(shape.width,shape.height);c.translate(-x,-y);
  drawInteractionEffects(c,n,actionPose,x,y,time);c.restore();
  c.restore();
  if(acting){c.fillStyle="#ffe189";c.fillRect(x-2,y-131,4,7);c.fillRect(x-2,y-122,4,3);}
  c.font='12px "DungGeunMo", monospace';c.textAlign="center";const w=c.measureText(displayPersonName(n.name)).width+12;c.fillStyle="#12303bd9";c.fillRect(x-w/2,y+17,w,18);c.fillStyle="#fff1c9";c.fillText(displayPersonName(n.name),x,y+30);
}

function drawLifted(c,drag,time,reduced=false) {
  const origin=grabbedOrigin(drag),x=origin.x*TILE,y=origin.y*TILE;
  const lift=hangingPose(drag.n.motion,time,drag.vx,reduced),angle=lift.angle;
  c.fillStyle='#18352b55';c.fillRect(x-19,y+8,38,8);
  // 집은 픽셀 자체를 회전 중심으로 삼아 대롱거려도 커서와 떨어지지 않는다.
  c.save();c.translate(drag.p.x*TILE,drag.p.y*TILE);c.rotate(angle);c.translate(-drag.p.x*TILE,-drag.p.y*TILE);
  drawPixelCharacter(c,characterStyle(drag.n.name,drag.index,drag.n.role,drag.n.refs,drag.n.creature||false),x,y,{scale:2,direction:'down',walkFrame:0,interaction:lift.pose,expression:lift.expression,selected:true});
  c.restore();c.fillStyle='#fff0bf';c.font='13px "DungGeunMo", monospace';c.textAlign='center';c.fillText(displayPersonName(drag.n.name),x,y+28);
}
