import { opposedDirections, planConversation } from './conversation.js';
import { parseReference } from './references.js';
import { buildChapterDialogue } from './chapter-dialogue.js';
import { dialogueCandidates, SpeechDirector } from './dialogue.js';
import { objectPhrase, movementDirection } from './language.js';
import { resolveIdentity } from './identity.js';
import { BACKGROUNDS } from './backgrounds.js';
import { drawPixelCharacter, characterStyle, drawWorldObject, drawWorldBackground, drawDesignBoard } from "./art.js";
// 관리자 개발 체험: 엔진/외부 이미지 없이 재사용하는 경량 Canvas 월드.
// 이 모듈과 본문 JSON은 입장 시에만 로드된다. 본문 장 이동에는 연결하지 않는다.
const books = new Map();
const TILE = 24, WIDTH = 960, HEIGHT = 480;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const OBJECTS = { field: "보리밭", water: "물항아리", bench: "쉬는 자리", tree: "나무" };
export const RUTH_SCENES = [
  { id: "glean", title: "룻의 이삭 줍기", actors: ["룻"], object: "field", ref: "룻기 2:2–3", lines: ["룻이 밭으로 나가 추수하는 사람들 뒤에서 이삭을 줍습니다.", "그곳은 보아스에게 속한 밭이었습니다."] },
  { id: "greet", title: "보아스와 일꾼들의 인사", actors: ["보아스", "일꾼"], object: "field", ref: "룻기 2:4", lines: ["보아스가 추수하는 일꾼들에게 여호와께서 함께하시기를 빕니다.", "일꾼들도 여호와께서 보아스에게 복 주시기를 빕니다."] },
  { id: "water", title: "룻을 돌보는 보아스", actors: ["룻", "보아스"], object: "water", ref: "룻기 2:8–9", lines: ["보아스는 룻에게 다른 밭으로 가지 말고 이곳에 머물라고 말합니다.", "목이 마르면 일꾼들이 길어 온 물을 마셔도 된다고 배려합니다."] },
];

export const ELIJAH_SCENES = [
  {id:'rest-elijah',title:'로뎀나무 아래의 쉼',actors:['엘리야','천사'],object:'tree',ref:'열왕기상 19:4–8',lines:['지친 엘리야가 로뎀나무 아래에 눕습니다. 천사가 그를 깨워 먹으라고 말합니다.','천사는 다시 엘리야를 깨웁니다. 엘리야는 먹고 마신 뒤 먼 길을 갈 힘을 얻습니다.']},
];
const ALL_SCENES=[...RUTH_SCENES,...ELIJAH_SCENES];
export function worldViewport(width,height) {
  const scale=Math.max(width/WIDTH,height/HEIGHT);
  return {scale,x:(width-WIDTH*scale)/2,y:(height-HEIGHT*scale)/2};
}

async function loadBook(code, cachedBook) {
  const existing = cachedBook?.(code);
  if (existing) return existing;
  if (!books.has(code)) {
    books.set(code, fetch(`data/summary/${code}.json`, { cache: "force-cache" }).then(async (r) => {
      if (!r.ok) throw new Error(`본문 자료 ${r.status}`);
      const data = await r.json();
      if (!data.chapters) throw new Error("본문 자료 형식 오류");
      return data;
    }).catch((e) => { books.delete(code); throw e; }));
  }
  return books.get(code);
}

export function buildWorldModel(chapters) {
  const people = new Map(), relations = [], events = [];
  for (const { name, code, chap, data } of chapters) {
    if (!data) continue;
    const reference = `${name} ${chap}${code === "psa" ? "편" : "장"}`;
    for (const person of data.people || []) {
      // 하나님/성령을 무작위 인간 NPC로 그리지 않는다.
      if (/^(하나님|여호와|성령|주님)$/.test(person.name)) continue;
      const identity=resolveIdentity(person.name,{code,chapter:chap,role:person.role||''});
      const personKey=`${person.name}:${identity.id}`;
      if (!people.has(personKey)) people.set(personKey, { ...person, identity, refs: [] });
      const p = people.get(personKey);
      p.refs.push(reference); p.weight = Math.max(p.weight || 1, person.weight || 1);
    }
    for (const r of data.rels || []) relations.push({ ...r, ref: `${name} ${chap}:${r.verses || ""}` });
    for (const e of data.events || []) events.push({ ...e, ref: `${name} ${chap}:${e.verses || ""}` });
  }
  const ruth = chapters.some((c) => c.code === "rut" && c.chap === 2 && c.data);
  if (ruth && ![...people.values()].some(p=>p.name==="일꾼")) people.set("일꾼", { name: "일꾼", role: "보아스의 밭에서 추수하는 일꾼", weight: 1, refs: ["룻기 2:4"] });
  const cast = [...people.values()].sort((a, b) => (b.weight || 1) - (a.weight || 1)).slice(0, 10);
  if (!cast.length) cast.push({ name: "읽는 사람", role: "본문을 함께 살펴보는 안내 캐릭터 (창작)", refs: [], weight: 1 });
  return { cast, relations, events, scenes: [...(ruth ? RUTH_SCENES : []), ...(chapters.some(c=>c.code==="1ki" && c.chap===19 && c.data)?ELIJAH_SCENES:[])], title: chapters.map((c) => `${c.name} ${c.chap}`).join(" · "), key: chapters.map((c) => `${c.code}.${c.chap}`).join("-") };
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
  const chapterData=requested.map((c)=>({...c,data:byCode[c.code].chapters[c.chap]}));
  const model=buildWorldModel(chapterData),dialogueContext=buildChapterDialogue(chapterData);
  if (requested.some((c) => !byCode[c.code].chapters[c.chap])) throw new Error("본문 자료가 아직 준비되지 않았어요");
  shell.querySelector(".pb-load").remove();
  shell.classList.add('pb-ready');
  if(!shell.querySelector('.pb-view-button')) shell.querySelector('.pb-world-head').insertAdjacentHTML('beforeend','<button class="pb-button pb-view-button" data-action="fullscreen">⛶ 화면 확대</button>');
  shell.insertAdjacentHTML("beforeend", `<div class="pb-world-stage"><canvas width="960" height="480" tabindex="0" aria-label="픽셀 월드. 캐릭터를 누르고 끌어 옮길 수 있어요. 선택 후 땅을 누르거나 방향키로 걸어갈 수도 있어요."></canvas><div class="pb-speech" role="status" aria-live="polite" aria-atomic="true" hidden><p></p><button type="button" class="pb-speech-reference" data-action="passage" hidden></button></div><div class="pb-event" hidden><div class="pb-event-card" role="status"></div></div></div>
    <button class="pb-button pb-side-toggle pb-toggle-left" data-action="toggle-left" aria-controls="pb-left-panel" aria-expanded="false">인물 ▸</button>
    <aside class="pb-side pb-side-left" id="pb-left-panel" hidden aria-label="인물 선택과 외형 근거"><h3>함께 있는 인물</h3><div class="pb-roster">${model.cast.map((p,i)=>`<button class="pb-button" data-person="${i}" aria-pressed="${i===0}">${esc(p.name)}</button>`).join('')}</div><div class="pb-person-details"></div></aside>
    <button class="pb-button pb-side-toggle pb-toggle-right" data-action="toggle-right" aria-controls="pb-right-panel" aria-expanded="false">◂ 도구 · 조합</button>
    <aside class="pb-side pb-side-right" id="pb-right-panel" hidden aria-label="도구와 조합식"><p class="pb-scene-name">${noPlan?'체험 본문 · ':'오늘 분량 · '}${esc(model.title)}</p><div class="pb-world-toolbar"><button class="pb-button" data-action="sound" aria-pressed="false">음성 꺼짐</button><button class="pb-button" data-action="pause" aria-pressed="false">일시정지</button><button class="pb-button" data-action="design">디자인 도안</button></div>
    <h3>배경 바꾸기</h3><p class="pb-help">상상 지형이에요. 실제 사건 장소를 뜻하지 않아요.</p><div class="pb-world-toolbar pb-backgrounds">${Object.entries(BACKGROUNDS).map(([key,p])=>`<button class="pb-button" data-background="${key}" aria-pressed="false">${esc(p.name)}</button>`).join('')}</div>
    <h3>오브제 놓기</h3><div class="pb-world-toolbar">${Object.entries(OBJECTS).map(([key,label])=>`<button class="pb-button" data-place="${key}" aria-pressed="false">＋ ${label}</button>`).join('')}<button class="pb-button" data-action="cancel-place" hidden>배치 취소</button><button class="pb-button" data-action="reset">배치 초기화</button></div>
    <h3>조합식</h3><p class="pb-help">아래 조합을 누르면 필요한 인물들이 모여요. 캐릭터를 집어 오브제 옆에 내려놓아도 돼요.</p><div class="pb-recipes"></div>
    ${model.scenes.length?'<button class="pb-button" data-action="scene">다음 본문 장면 모아 보기</button>':'<button class="pb-button" data-action="demo">룻기 2장 체험으로 이동</button>'}</aside>
    <div class="pb-world-info" role="status" aria-live="polite" hidden></div>
    <div class="pb-rotate"><span class="pb-phone" aria-hidden="true">▯ ↻ ▭</span><strong>가로로 펼치는<br>PIXEL BIBLE</strong><p>기기를 가로로 돌려 주세요.<br>화면 회전 잠금이 켜져 있다면 해제해 주세요.</p><button class="pb-button" data-action="fullscreen">가로 화면으로 입장</button></div>`);
  const abort = new AbortController(), signal = abort.signal;
  const canvas = shell.querySelector("canvas"), ctx = canvas.getContext("2d");
  const info = shell.querySelector(".pb-world-info");
  const overlay = shell.querySelector(".pb-event"), eventCard = shell.querySelector(".pb-event-card");
  const speechElement=shell.querySelector('.pb-speech');
  const speech=new SpeechDirector({now:performance.now()});let shownSpeech=null,speechWidth=0,speechHeight=0,pendingTalk=null;
  function cancelTalk(){if(pendingTalk){pendingTalk.plan.mover.path=[];pendingTalk=null;}}
  function hideSpeech(){cancelTalk();speech.dismiss(performance.now());speechElement.hidden=true;shownSpeech=null;}
  function faceEachOther(a,b){const directions=opposedDirections(a,b);if(!directions)return false;[a.direction,b.direction]=directions;a.idle=b.idle=6;return true;}
  function updateSpeech(now){
    const enabled=!paused&&!activeEvent&&!pendingEvent&&!drag?.active&&!placing&&!shell.querySelector('.pb-design,.pb-scripture');
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
      const candidates=ready?dialogueCandidates(npcs,chapterData,dialogueContext):[];
      current=speech.tick(now,candidates,true);
      if(current?.target&&current!==shownSpeech){
        const plan=planConversation(current.speaker,current.target,npcs,blocked,findPath);
        if(!plan){speech.dismiss(now);current=null;}
        else if(plan.route.length){
          pendingTalk={choice:current,plan,deadline:now+6000};speech.current=null;
          plan.mover.path=plan.route;plan.anchor.idle=8;plan.mover.idle=8;current=null;
        }else if(!faceEachOther(current.speaker,current.target)){speech.dismiss(now);current=null;}
      }
    }
    if(current!==shownSpeech){
      shownSpeech=current;speechElement.hidden=!current;
      if(current){
        speechElement.querySelector('p').textContent=current.text;
        const link=speechElement.querySelector('.pb-speech-reference');
        link.textContent=current.ref||'';link.hidden=!parseReference(current.ref);link.setAttribute('aria-label',`${current.ref||''} 성경 본문 보기`);
        speechWidth=speechElement.offsetWidth;speechHeight=speechElement.offsetHeight;
      }
    }
  }
  async function openSpeechPassage(){
    const reference=shownSpeech?.ref,parsed=parseReference(reference);if(!parsed)return;
    hideSpeech();
    const panel=document.createElement('section');panel.className='pb-scripture';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',reference);
    panel.innerHTML='<header><b></b><button class="pb-button" data-action="close-scripture">닫기 ✕</button></header><div class="pb-scripture-body" aria-live="polite">본문을 불러오는 중…</div>';
    panel.querySelector('b').textContent=reference;shell.append(panel);panel.querySelector('button').focus();
    try{if(!options.readPassage)throw new Error('passage-unavailable');const html=await options.readPassage(parsed);if(!panel.isConnected)return;panel.querySelector('.pb-scripture-body').innerHTML=html;}
    catch(_){if(panel.isConnected)panel.querySelector('.pb-scripture-body').textContent='본문을 불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.';}
  }
  function positionSpeech(){
    if(!shownSpeech||speechElement.hidden)return;
    const r=canvas.getBoundingClientRect(),v=worldViewport(canvas.width,canvas.height),n=shownSpeech.speaker;
    const x=(n.x*TILE*v.scale+v.x)*r.width/canvas.width,y=((n.y*TILE-72)*v.scale+v.y)*r.height/canvas.height;
    let left=Math.max(8,Math.min(r.width-speechWidth-8,x-speechWidth/2));
    const topLimit=Math.max(48,shell.querySelector('.pb-world-head').offsetHeight+10),above=y-speechHeight-10;
    const below=above<topLimit;
    const proposed=below?((n.y*TILE+42)*v.scale+v.y)*r.height/canvas.height:above;
    speechElement.dataset.below=String(below);
    let top=Math.max(topLimit,Math.min(r.height-speechHeight-12,proposed));
    if(shownSpeech.target&&shownSpeech.target.x===n.x){
      const right=r.width-x>=speechWidth+48;
      left=Math.max(8,Math.min(r.width-speechWidth-8,right?x+36:x-speechWidth-36));
      top=Math.max(topLimit,Math.min(r.height-speechHeight-12,y));speechElement.dataset.side=right?'right':'left';
    }else delete speechElement.dataset.side;
    speechElement.style.left=`${Math.round(left)}px`;speechElement.style.top=`${Math.round(top)}px`;
    speechElement.style.setProperty('--pb-tail',`${Math.max(14,Math.min(speechWidth-14,x-left))}px`);
  }
  const storageKey = `pixel-bible-layout:${model.key}`;
  const defaults = () => [{ kind: "field", x: 28, y: 9 }, { kind: "water", x: 21, y: 12 }, { kind: "bench", x: 12, y: 12 }, { kind: "tree", x: 7, y: 8 }, { kind: "tree", x: 33, y: 13 }];
  let objects = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved) && saved.length <= 16 && saved.every((o) => OBJECTS[o.kind] && Number.isInteger(o.x) && Number.isInteger(o.y) && o.x >= 2 && o.x <= 37 && o.y >= 5 && o.y <= 15) && new Set(saved.map((o) => `${o.x},${o.y}`)).size === saved.length) objects = saved;
  } catch (_) {}
  const npcs = model.cast.map((p, i) => ({ ...p, x: 9 + (i % 5) * 4, y: 6 + Math.floor(i / 5) * 7, path: [], direction:"down", stride:0, idle: 1 + i * .4, action: "", task: null }));
  let drag=null, suppressClick=false, toastTimer=null;
  let selected = 0, placing = null, paused = false, sound = false, disposed = false, frame = 0, last = 0, time = 0;
  let activeEvent = null, pendingEvent = null, eventIndex = 0, cinematicTime = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const blocked = (x, y) => x < 2 || x > 37 || y < 5 || y > 15 || objects.some((o) => o.kind !== "field" && o.x === x && o.y === y);
  const say = (text) => {
    clearTimeout(toastTimer);info.innerHTML=`<p>${esc(text)}</p>`;info.hidden=false;
    toastTimer=setTimeout(()=>{info.hidden=true;},2000);
  };
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(objects)); } catch (_) { say("배치는 이번 입장 동안 유지돼요. 기기 저장 공간을 확인해 주세요."); } };
  const cell = (p) => ({ x: Math.round(p.x), y: Math.round(p.y) });
  const adjacent = (o, n) => [[o.x-1,o.y],[o.x+1,o.y],[o.x,o.y+1],[o.x,o.y-1]].map(([x,y]) => ({x,y})).filter((p) => !blocked(p.x,p.y)).sort((a,b) => Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y));
  function togglePanel(side,open) {
    const panel=shell.querySelector(`#pb-${side}-panel`), button=shell.querySelector(`[data-action="toggle-${side}"]`);
    const show=open??panel.hidden;panel.hidden=!show;button.setAttribute('aria-expanded',show);
    button.textContent=side==='left'?(show?'인물 ◂':'인물 ▸'):(show?'도구 · 조합 ▸':'◂ 도구 · 조합');
  }
  function renderRecipes() {
    const container=shell.querySelector('.pb-recipes');
    container.innerHTML=model.scenes.map((scene,i)=>{
      const missing=scene.actors.filter(name=>!npcs.some(n=>n.name===name));
      const object=objects.find(o=>o.kind===scene.object);
      const ready=!missing.length&&!!object;
      return `<article class="pb-recipe"><b>${esc(scene.title)}</b><p>${esc(scene.actors.join(' ＋ '))} ＋ ${OBJECTS[scene.object]}</p><small>${esc(scene.ref)}</small><p>${ready?'✓ 조합 가능':missing.length?`필요 인물: ${esc(missing.join(', '))}`:`${objectPhrase(OBJECTS[scene.object])} 먼저 놓아 주세요.`}</p><button class="pb-button" data-recipe="${i}" ${ready?'':'disabled'}>이 조합으로 모으기</button></article>`;
    }).join('') + `<article class="pb-recipe"><b>누구나 사용할 수 있는 조합</b><p>${esc(npcs[selected].name)} ＋ 오브제 → 일상 동작</p><div class="pb-world-toolbar">${[['bench','앉아 쉬기'],['water','물 마시기'],['field','이삭 줍기']].map(([kind,label])=>`<button class="pb-button" data-common-recipe="${kind}" ${objects.some(o=>o.kind===kind)?'':'disabled'}>${OBJECTS[kind]} · ${label}</button>`).join('')}</div><small>일상 동작은 창작이며 본문 사건과 구분해요.</small></article>` + ALL_SCENES.filter(scene=>!model.scenes.includes(scene)).map(scene=>`<article class="pb-recipe pb-locked"><b>🔒 ${esc(scene.title)}</b><p>${esc(scene.actors.join(' ＋ '))} ＋ ${OBJECTS[scene.object]}</p><small>${esc(scene.ref)} 본문에서 열려요.</small></article>`).join('');
  }
  function select(i) {
    selected = i;
    shell.querySelectorAll("[data-person]").forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.person) === i));
    const n=npcs[i], style=characterStyle(n.name,i,n.role,n.refs);
    shell.querySelector('.pb-person-details').innerHTML=`<h3>${esc(n.name)}</h3><p>${esc(n.role||'본문 속 인물')}</p><p>${esc(n.refs.join(', '))}</p><p class="pb-help">${n.identity?.kind==='group'?'집단을 대표하는 상징 캐릭터':n.identity?.kind==='unresolved'?'인물 신원 추가 검토 중':n.identity?.kind==='spiritual'?'본문 속 존재의 상징 표현':'본문 인물'} · ${esc(n.identity?.id||'체험용 인물')}</p><h4>외형 근거</h4><p>${esc(style.evidence)}</p><p class="pb-help">${esc(style.design)}</p><small>확인된 본문 특징과 창작 디자인을 구분해 표시해요.</small><p class="pb-help">캐릭터를 누른 채 끌면 집어 들 수 있어요. 빈 땅을 누르면 걸어가요.</p>`;
    renderRecipes();say(`${n.name} · ${n.role || "본문 속 인물"}${n.refs.length ? ` (${n.refs.join(", ")})` : ""}. 다른 인물을 누르면 관계를 살펴보고, 땅을 누르면 이동해요.`);
  }
  function move(n, goal, task = null) {
    if(pendingTalk||speech.current?.speaker===n||speech.current?.target===n)hideSpeech();
    const path = findPath(cell(n), goal, blocked);
    if (!path) return false;
    n.path = path; n.task = task; n.action = ""; n.idle = 5;
    return true;
  }
  function toObject(n, o) {
    for (const p of adjacent(o,n)) if (move(n,p,o)) return true;
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
    eventCard.innerHTML = `<b>${esc(ev.scene.title)}</b><p>${esc(ev.scene.lines[ev.step])}</p><small>${esc(ev.scene.ref)} · 본문을 풀어 쓴 해설</small><div><button class="pb-button" data-action="next">${ev.step === ev.scene.lines.length-1 ? "장면 마치기" : "다음"}</button> <button class="pb-button" data-action="skip">건너뛰기</button></div>`;
    speak(ev.scene.lines[ev.step]);
  }
  function beginEvent(scene) {
    activeEvent = { scene, step: 0, elapsed: 0 }; cinematicTime = 0; pendingEvent = null;
    sceneActors(scene).forEach((n) => { n.action=scene.object; });
    overlay.hidden = false; showLine();
  }
  function endEvent() { activeEvent = null; pendingEvent = null; overlay.hidden = true; if (sound) speechSynthesis.cancel(); }
  function sceneActors(scene) { return scene.actors.map((name) => npcs.find((n) => n.name === name)); }
  function queueScene(scene, o) {
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
    say(`${scene.title} · 인물들이 ${OBJECTS[o.kind]}으로 모이고 있어요. (${scene.ref})`);
  }
  function interact(n,o) {
    const scene = model.scenes.find((s) => s.object === o.kind && s.actors.includes(n.name) && sceneActors(s).every(Boolean));
    if (scene) return queueScene(scene,o);
    if (toObject(n,o)) say(`${n.name} → ${OBJECTS[o.kind]} · 일상 동작 (창작)`);
    else say("가는 길이 막혀 있어요. 다른 오브제나 빈 곳을 선택해 주세요.");
  }
  function coordinates(e) {
    const r=canvas.getBoundingClientRect(),v=worldViewport(canvas.width,canvas.height);
    return {x:((e.clientX-r.left)*canvas.width/r.width-v.x)/v.scale/TILE,y:((e.clientY-r.top)*canvas.height/r.height-v.y)/v.scale/TILE};
  }
  function hitPerson(p) {
    return npcs.map((n,i)=>({n,i})).filter(({n})=>Math.abs(n.x-p.x)<1.5&&p.y-n.y<.8&&p.y-n.y>-5.2).sort((a,b)=>b.n.y-a.n.y)[0]?.i??-1;
  }
  canvas.addEventListener('pointerdown',(e)=>{
    if (drag) return;
    hideSpeech();suppressClick=false;
    if(!options.admin()||activeEvent||placing||e.button!==0||window.innerHeight>=window.innerWidth)return;
    const index=hitPerson(coordinates(e));if(index<0)return;
    const previous=npcs[selected];select(index);const n=npcs[index];
    const relation=previous!==n&&model.relations.find(r=>r.from===previous.name&&r.to===n.name||r.from===n.name&&r.to===previous.name);
    if(relation)say(`${relation.from} ↔ ${relation.to} · ${relation.label}. ${relation.note||''} (${relation.ref})`);
    drag={n,index,id:e.pointerId,active:false,startX:e.clientX,startY:e.clientY,p:coordinates(e),from:{x:n.x,y:n.y},vx:0,lastX:e.clientX};
    canvas.setPointerCapture(e.pointerId);
  },{signal});
  canvas.addEventListener('pointermove',(e)=>{
    if(!drag||e.pointerId!==drag.id)return;
    if(!drag.active&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6){drag.active=true;pendingEvent=null;drag.n.path=[];drag.n.task=null;drag.n.action='';canvas.dataset.dragging='true';say(`${objectPhrase(drag.n.name)} 집어 들었어요. 빈 땅이나 오브제에 내려놓아 보세요.`);}
    if(drag.active){e.preventDefault();drag.vx=drag.vx*.65+(e.clientX-drag.lastX)*.35;drag.lastX=e.clientX;drag.p=coordinates(e);draw();}
  },{signal});
  function finishDrag(e,cancel=false) {
    if(!drag||e.pointerId!==drag.id)return;
    const held=drag;drag=null;delete canvas.dataset.dragging;
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(!held.active){suppressClick=true;return;}
    suppressClick=true;
    const n=held.n,p=coordinates(e),under=document.elementFromPoint(e.clientX,e.clientY);
    if(cancel||!options.admin()||under?.closest('.pb-side,.pb-world-head,.pb-side-toggle')){n.x=held.from.x;n.y=held.from.y;n.idle=5;draw();return;}
    const landing={x:Math.max(2,Math.min(37,Math.round(p.x))),y:Math.max(5,Math.min(15,Math.round(p.y+3)))};
    const obj=objects.find(o=>Math.hypot(o.x-landing.x,o.y-landing.y)<1.6||Math.hypot(o.x-p.x,o.y-p.y)<1.3);
    if(obj){
      const spot=adjacent(obj,landing).find(s=>!npcs.some(other=>other!==n&&Math.hypot(other.x-s.x,other.y-s.y)<.6));
      if(spot){n.x=spot.x;n.y=spot.y;n.idle=8;interact(n,obj);draw();return;}
    }
    if(blocked(landing.x,landing.y)||npcs.some(other=>other!==n&&Math.hypot(other.x-landing.x,other.y-landing.y)<.6)){
      n.x=held.from.x;n.y=held.from.y;say('여기는 다른 인물이나 오브제와 겹쳐요. 빈 땅에 내려놓아 주세요.');
    }else{n.x=landing.x;n.y=landing.y;n.idle=8;say(`${objectPhrase(n.name)} 내려놓았어요. 다시 집거나 땅을 눌러 걸어가게 할 수 있어요.`);}
    draw();
  }
  canvas.addEventListener('pointerup',e=>finishDrag(e),{signal});
  canvas.addEventListener('pointercancel',e=>finishDrag(e,true),{signal});
  canvas.addEventListener('lostpointercapture',e=>{if(drag)finishDrag(e,true);},{signal});
  canvas.addEventListener("pointerup", (e) => {
    if (drag) return;
    if(suppressClick){suppressClick=false;return;}
    if (!options.admin() || activeEvent || window.innerHeight >= window.innerWidth) return;
    const p = coordinates(e), x = Math.round(p.x), y = Math.round(p.y);
    if (placing) {
      if (blocked(x,y) || objects.some((o) => o.x===x && o.y===y) || npcs.some((n) => Math.hypot(n.x-x,n.y-y)<1)) return say("나무·인물과 겹치지 않는 빈 땅을 골라 주세요.");
      if (objects.length >= 16) return say("이번 월드에는 오브제를 16개까지 놓을 수 있어요.");
      objects.push({kind:placing,x,y}); save(); renderRecipes(); placing = null; syncPlacement(); say("오브제를 놓았어요. 인물을 선택해 사용해 보세요."); return;
    }
    const hit=hitPerson(p);
    if (hit >= 0) {
      if (hit !== selected) {
        const a=npcs[selected], b=npcs[hit];
        const r=model.relations.find((r) => r.from===a.name && r.to===b.name || r.from===b.name && r.to===a.name);
        select(hit);
        if (r) say(`${r.from} ↔ ${r.to} · ${r.label}. ${r.note || ""} (${r.ref})`);
      } else select(hit);
      return;
    }
    const o=objects.find((o) => Math.abs(o.x-p.x)<1.1 && Math.abs(o.y-p.y)<1.1);
    pendingEvent=null;
    if (o) interact(npcs[selected],o);
    else if (!blocked(x,y) && move(npcs[selected],{x,y})) say(`${npcs[selected].name} 이동 중 · 목적지에 도착하면 다시 주변을 거닐어요.`);
  }, {signal});
  canvas.addEventListener("keydown", (e) => {
    if (drag) return;
    if (!options.admin() || activeEvent || window.innerHeight >= window.innerWidth) return;
    const delta={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];
    const n=npcs[selected];
    if (delta) { e.preventDefault(); pendingEvent=null; const p=cell(n); p.x+=delta[0];p.y+=delta[1]; if (!blocked(p.x,p.y)) move(n,p); }
    if (e.key==="Enter") { e.preventDefault(); const o=[...objects].sort((a,b)=>Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y))[0]; if(o) interact(n,o); }
  }, {signal});
  function syncPlacement() {
    shell.querySelectorAll("[data-place]").forEach((b)=>b.setAttribute("aria-pressed",b.dataset.place===placing));
    shell.querySelector('[data-action="cancel-place"]').hidden=!placing;
  }
  shell.addEventListener("click", async (e) => {
    if (drag?.active) return;
    if (!options.admin()) return;
    const b=e.target.closest("button"); if(!b) return;
    if (b.dataset.recipe!==undefined) { const scene=model.scenes[Number(b.dataset.recipe)],o=objects.find(o=>o.kind===scene.object);if(o&&!activeEvent)queueScene(scene,o);return; }
    if (b.dataset.commonRecipe) {const o=objects.find(o=>o.kind===b.dataset.commonRecipe);if(o&&!activeEvent){pendingEvent=null;if(toObject(npcs[selected],o))say(`${npcs[selected].name} · ${OBJECTS[o.kind]} 사용 (창작 일상 동작)`);}return;}
    if (b.dataset.background && Object.hasOwn(BACKGROUNDS,b.dataset.background)) {
      backgroundKey=b.dataset.background;drawWorldBackground(background.getContext('2d'),backgroundKey);syncBackground();draw();
      try{localStorage.setItem('pixel-bible-background',backgroundKey);}catch(_){}
      say(`${BACKGROUNDS[backgroundKey].name} · 상상 지형`);return;
    }
    if (b.dataset.person!==undefined) { select(Number(b.dataset.person)); return; }
    if (b.dataset.place) {
      if(activeEvent) return;
      placing=b.dataset.place; syncPlacement(); say(`${objectPhrase(OBJECTS[placing])} 놓을 빈 땅을 누르세요.`); return;
    }
    const action=b.dataset.action;
    if(action==='passage'){await openSpeechPassage();return;}
    if(action==='close-scripture'){shell.querySelector('.pb-scripture')?.remove();canvas.focus();return;}
    if(action==="design" && !shell.querySelector(".pb-design")) {
      const board=document.createElement("section");board.className="pb-design";board.setAttribute("aria-label","픽셀 캐릭터와 지형 디자인 도안");
      board.innerHTML='<header><b>실제 캐릭터 · 지형 도안</b><button class="pb-button" data-action="close-design">도안 닫기 ✕</button></header><canvas aria-label="전용 캐릭터 100종과 보리밭, 물항아리, 쉬는 자리, 나무"></canvas>';
      shell.append(board);drawDesignBoard(board.querySelector("canvas").getContext("2d"));board.querySelector("button").focus();
    }
    if(action==="close-design") {shell.querySelector(".pb-design")?.remove();shell.querySelector('[data-action="design"]').focus();}
    if(action==="cancel-place") { placing=null; syncPlacement(); }
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
    if(action==="reset") {
      endEvent(); objects=defaults(); npcs.forEach((n,i)=>{n.path=[];n.task=null;n.x=9+(i%5)*4;n.y=6+Math.floor(i/5)*7;});save();renderRecipes();say("이 월드의 오브제 배치를 처음으로 되돌렸어요.");
    }
    if(action==="scene" && !activeEvent) {
      const scene=model.scenes[eventIndex++%model.scenes.length], o=objects.find((o)=>o.kind===scene.object);
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
    replacement=await mountPixelWorld(shell,{...options,chapters:[], cachedBook:options.cachedBook});
    return true;
  }
  let replacement=null;
  function update(dt) {
    time+=dt;
    for(const n of npcs) {
      if(drag?.active && drag.n===n)continue;
      const talk=pendingTalk?.choice||speech.current;
      if(talk?.target&&(n===talk.speaker||n===talk.target)&&!n.path.length){n.idle=6;continue;}
      if(n.path.length) {
        const p=n.path[0],dx=p.x-n.x,dy=p.y-n.y,d=Math.hypot(dx,dy),step=dt*2.8;
        n.direction=movementDirection(dx,dy,n.direction);
        n.stride+=(Math.min(d,step));
        if(blocked(p.x,p.y)) { n.path=[];n.task=null;continue; }
        if(d<=step) { n.x=p.x;n.y=p.y;n.path.shift(); }
        else { n.x+=dx/d*step;n.y+=dy/d*step; }
      } else if(n.task) {
        const target=n.task;
        n.direction=movementDirection(target.x-n.x,target.y-n.y,n.direction);
        n.action=target.kind;n.task=null;n.idle=7;
        if(target.kind==="bench") { n.x=target.x;n.y=target.y; }
      } else if((n.idle-=dt)<=0 && !pendingEvent?.actors.includes(n)) {
        n.action="";n.idle=3+Math.random()*5;
        if(!reduced&&!pendingTalk) {const p={x:Math.max(2,Math.min(37,Math.round(n.x+(Math.random()-.5)*10))),y:Math.max(5,Math.min(15,Math.round(n.y+(Math.random()-.5)*6)))};if(!blocked(p.x,p.y))move(n,p);}
      }
    }
    if(pendingEvent && pendingEvent.actors.every((n)=>!n.path.length && Math.hypot(n.x-pendingEvent.o.x,n.y-pendingEvent.o.y)<=1.5)) beginEvent(pendingEvent.scene);
  }

  // 배경은 한 번 그리고 매 프레임 재사용한다.
  const background=document.createElement("canvas");background.width=WIDTH;background.height=HEIGHT;
  let backgroundKey='meadow';
  try{const saved=localStorage.getItem('pixel-bible-background');if(Object.hasOwn(BACKGROUNDS,saved))backgroundKey=saved;}catch(_){}
  function syncBackground(){shell.querySelectorAll('[data-background]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.background===backgroundKey));}
  drawWorldBackground(background.getContext("2d"),backgroundKey);syncBackground();
  function draw() {
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    const v=worldViewport(canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=false;ctx.save();ctx.setTransform(v.scale,0,0,v.scale,v.x,v.y);ctx.save();
    if(activeEvent && !reduced) {
      const actors=sceneActors(activeEvent.scene),zoom=1+Math.min(.2,cinematicTime*.07);
      const x=actors.reduce((s,n)=>s+n.x*TILE,0)/actors.length,y=actors.reduce((s,n)=>s+n.y*TILE,0)/actors.length;
      ctx.translate(WIDTH/2,HEIGHT/2);ctx.scale(zoom,zoom);ctx.translate(-Math.max(400,Math.min(560,x)),-Math.max(220,Math.min(260,y)));
    }
    ctx.drawImage(background,0,0);
    const items=[...objects.map((o)=>({y:o.y,draw:()=>drawObject(ctx,o)})),...npcs.filter(n=>!drag?.active||drag.n!==n).map((n)=>({y:n.y,draw:()=>drawNpc(ctx,n,npcs.indexOf(n),time+cinematicTime,npcs.indexOf(n)===selected,activeEvent?.scene.actors.includes(n.name),reduced)}))].sort((a,b)=>a.y-b.y);
    items.forEach((item)=>item.draw());
    if(drag?.active)drawLifted(ctx,drag,time,selected);
    ctx.restore();
    if(placing) {ctx.fillStyle="#102e38d9";ctx.fillRect(300,410,360,28);ctx.fillStyle="#ffe5a2";ctx.font="14px sans-serif";ctx.textAlign="center";ctx.fillText(`${OBJECTS[placing]} · 빈 땅을 눌러 배치`,480,430);}
    ctx.restore();positionSpeech();
  }
  shell.closest("dialog")?.addEventListener("cancel",(e)=>{
    const scripture=shell.querySelector('.pb-scripture');if(scripture){e.preventDefault();scripture.remove();canvas.focus();return;}
    const board=shell.querySelector(".pb-design");if(board){e.preventDefault();board.remove();shell.querySelector('[data-action="design"]').focus();}
  },{signal});
  const fitCanvas=()=>{
    const r=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(r.width*ratio));canvas.height=Math.max(1,Math.round(r.height*ratio));if(shownSpeech){speechWidth=speechElement.offsetWidth;speechHeight=speechElement.offsetHeight;}draw();
  };
  const resizeObserver=new ResizeObserver(fitCanvas);resizeObserver.observe(canvas);
  const canRun=()=>!disposed&&!document.hidden&&window.innerWidth>window.innerHeight&&options.admin();
  function tick(stamp) {
    if(disposed)return;
    if(!options.admin()) {say("관리자 로그인이 필요해요. 창을 닫고 다시 로그인해 주세요.");return;}
    const dt=Math.min(.05,(stamp-last)/1000||0);last=stamp;
    if(!paused&&!shell.querySelector('.pb-scripture')) {
      if(!activeEvent) update(dt);
      else {
        cinematicTime+=dt;activeEvent.elapsed+=dt;
        if(activeEvent.elapsed>4.5 && (!sound || !speechSynthesis.speaking || activeEvent.elapsed>12)) { if(++activeEvent.step>=activeEvent.scene.lines.length) endEvent(); else showLine(); }
      }
    }
    updateSpeech(performance.now());draw();
    if(canRun())frame=requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame);last=0;
    if(document.hidden || window.innerWidth<=window.innerHeight) {hideSpeech();if(drag)finishDrag({pointerId:drag.id,clientX:0,clientY:0},true);if(sound)speechSynthesis.cancel();return;}
    if(canRun())frame=requestAnimationFrame(tick);
  }
  document.addEventListener("visibilitychange",resume,{signal});window.addEventListener("resize",resume,{signal});
  function cleanup() {if(disposed)return;disposed=true;hideSpeech();abort.abort();clearTimeout(toastTimer);resizeObserver.disconnect();cancelAnimationFrame(frame);if(sound)speechSynthesis.cancel();}
  select(0);fitCanvas();resume();say('캐릭터를 누르고 끌어 옮겨 보세요. 양옆 버튼에서 인물과 조합식을 볼 수 있어요.');
  return ()=>{cleanup();replacement?.();};
}

function drawObject(c,o) { drawWorldObject(c,o); }
function drawNpc(c,n,index,time,selected,acting,reduced=false) {
  const x=Math.round(n.x*TILE),y=Math.round(n.y*TILE);
  drawPixelCharacter(c,characterStyle(n.name,index,n.role,n.refs),x,y+(acting?Math.round(Math.sin(time*4)*2):0),{scale:2,walkFrame:n.path.length?Math.floor((n.stride||0)*2)%4:0,action:n.action,time:reduced?0:time,direction:n.direction||"down",selected});
  if(acting){c.fillStyle="#ffe189";c.fillRect(x-2,y-131,4,7);c.fillRect(x-2,y-122,4,3);}
  c.font="12px sans-serif";c.textAlign="center";const w=c.measureText(n.name).width+12;c.fillStyle="#12303bd9";c.fillRect(x-w/2,y+17,w,18);c.fillStyle="#fff1c9";c.fillText(n.name,x,y+30);
}

function drawLifted(c,drag,time) {
  const x=drag.p.x*TILE,y=drag.p.y*TILE+96;
  const groundY=Math.max(5,Math.min(15,Math.round(drag.p.y+3)))*TILE;
  c.fillStyle='#18352b55';c.fillRect(x-19,groundY+8,38,8);
  c.save();c.translate(x,y-96);c.rotate(Math.max(-.18,Math.min(.18,drag.vx*.006)));c.translate(-x,-y+96);
  drawPixelCharacter(c,characterStyle(drag.n.name,drag.index,drag.n.role,drag.n.refs),x,y,{scale:2,hanging:true,time:performance.now()/1000,walk:Math.sin(performance.now()/160)*1.5,selected:true});
  c.restore();c.fillStyle='#fff0bf';c.font='13px sans-serif';c.textAlign='center';c.fillText(drag.n.name,x,y+28);
}
