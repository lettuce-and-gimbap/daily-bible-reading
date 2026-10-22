import { drawPixelCharacter, characterStyle, drawWorldObject, drawWorldBackground, drawDesignBoard } from "./art.js";
// 관리자 개발 체험: 엔진/외부 이미지 없이 재사용하는 경량 Canvas 월드.
// 이 모듈과 본문 JSON은 입장 시에만 로드된다. 본문 장 이동에는 연결하지 않는다.
const books = new Map();
const TILE = 24, WIDTH = 960, HEIGHT = 480;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const OBJECTS = { field: "보리밭", water: "물항아리", bench: "쉬는 자리", tree: "나무" };
const RUTH_SCENES = [
  { id: "glean", title: "룻의 이삭 줍기", actors: ["룻"], object: "field", ref: "룻기 2:2–3", lines: ["룻이 밭으로 나가 추수하는 사람들 뒤에서 이삭을 줍습니다.", "그곳은 보아스에게 속한 밭이었습니다."] },
  { id: "greet", title: "보아스와 일꾼들의 인사", actors: ["보아스", "일꾼"], object: "field", ref: "룻기 2:4", lines: ["보아스가 추수하는 일꾼들에게 여호와께서 함께하시기를 빕니다.", "일꾼들도 여호와께서 보아스에게 복 주시기를 빕니다."] },
  { id: "water", title: "룻을 돌보는 보아스", actors: ["룻", "보아스"], object: "water", ref: "룻기 2:8–9", lines: ["보아스는 룻에게 다른 밭으로 가지 말고 이곳에 머물라고 말합니다.", "목이 마르면 일꾼들이 길어 온 물을 마셔도 된다고 배려합니다."] },
];

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
      if (!people.has(person.name)) people.set(person.name, { ...person, refs: [] });
      const p = people.get(person.name);
      p.refs.push(reference); p.weight = Math.max(p.weight || 1, person.weight || 1);
    }
    for (const r of data.rels || []) relations.push({ ...r, ref: `${name} ${chap}:${r.verses || ""}` });
    for (const e of data.events || []) events.push({ ...e, ref: `${name} ${chap}:${e.verses || ""}` });
  }
  const ruth = chapters.some((c) => c.code === "rut" && c.chap === 2 && c.data);
  if (ruth && !people.has("일꾼")) people.set("일꾼", { name: "일꾼", role: "보아스의 밭에서 추수하는 일꾼", weight: 1, refs: ["룻기 2:4"] });
  const cast = [...people.values()].sort((a, b) => (b.weight || 1) - (a.weight || 1)).slice(0, 10);
  if (!cast.length) cast.push({ name: "읽는 사람", role: "본문을 함께 살펴보는 안내 캐릭터 (창작)", refs: [], weight: 1 });
  return { cast, relations, events, scenes: ruth ? RUTH_SCENES : [], title: chapters.map((c) => `${c.name} ${c.chap}`).join(" · "), key: chapters.map((c) => `${c.code}.${c.chap}`).join("-") };
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
  const model = buildWorldModel(requested.map((c) => ({ ...c, data: byCode[c.code].chapters[c.chap] })));
  if (requested.some((c) => !byCode[c.code].chapters[c.chap])) throw new Error("본문 자료가 아직 준비되지 않았어요");
  shell.querySelector(".pb-load").remove();
  shell.insertAdjacentHTML("beforeend", `<div class="pb-world-toolbar"><span class="pb-scene-name">${noPlan ? "체험 본문 · " : "오늘 분량 · "}${esc(model.title)}</span><button class="pb-button" data-action="fullscreen">가로 전체화면</button><button class="pb-button" data-action="sound" aria-pressed="false">음성 꺼짐</button><button class="pb-button" data-action="pause" aria-pressed="false">일시정지</button><button class="pb-button" data-action="design">디자인 도안</button></div>
    <div class="pb-world-stage"><canvas width="960" height="480" tabindex="0" aria-label="픽셀 월드. 인물을 선택하고 이동할 곳 또는 오브제를 누르세요. 방향키로 이동할 수도 있어요."></canvas><div class="pb-roster" aria-label="인물 선택">${model.cast.map((p, i) => `<button class="pb-button" data-person="${i}" aria-pressed="${i === 0}">${esc(p.name)}</button>`).join("")}</div><div class="pb-event" hidden><div class="pb-event-card" role="status"></div></div>
    <div class="pb-rotate"><span class="pb-phone" aria-hidden="true">▯ ↻ ▭</span><strong>가로로 펼치는<br>PIXEL BIBLE</strong><p>기기를 가로로 돌려 주세요.<br>화면 회전 잠금이 켜져 있다면 해제해 주세요.</p><button class="pb-button" data-action="fullscreen">가로 화면으로 입장</button></div></div>
    <div class="pb-world-toolbar" aria-label="오브제 배치">${Object.entries(OBJECTS).map(([key, label]) => `<button class="pb-button" data-place="${key}" aria-pressed="false">＋ ${label}</button>`).join("")}<button class="pb-button" data-action="cancel-place" hidden>배치 취소</button><button class="pb-button" data-action="reset">배치 초기화</button>${model.scenes.length ? `<button class="pb-button" data-action="scene">본문 장면 보기</button>` : `<button class="pb-button" data-action="demo">룻기 2장 체험</button>`}</div>
    <div class="pb-world-info" role="status" aria-live="polite"><p>인물 → 땅을 누르면 이동, 인물 → 오브제를 누르면 사용해요. 배치와 일상 동작은 창작이며 실제 지리를 재현하지 않습니다.</p></div>`);
  const abort = new AbortController(), signal = abort.signal;
  const canvas = shell.querySelector("canvas"), ctx = canvas.getContext("2d");
  const info = shell.querySelector(".pb-world-info");
  const overlay = shell.querySelector(".pb-event"), eventCard = shell.querySelector(".pb-event-card");
  const storageKey = `pixel-bible-layout:${model.key}`;
  const defaults = () => [{ kind: "field", x: 28, y: 9 }, { kind: "water", x: 21, y: 12 }, { kind: "bench", x: 12, y: 12 }, { kind: "tree", x: 7, y: 8 }, { kind: "tree", x: 33, y: 13 }];
  let objects = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved) && saved.length <= 16 && saved.every((o) => OBJECTS[o.kind] && Number.isInteger(o.x) && Number.isInteger(o.y) && o.x >= 2 && o.x <= 37 && o.y >= 5 && o.y <= 15) && new Set(saved.map((o) => `${o.x},${o.y}`)).size === saved.length) objects = saved;
  } catch (_) {}
  const npcs = model.cast.map((p, i) => ({ ...p, x: 9 + (i % 5) * 4, y: 6 + Math.floor(i / 5) * 7, path: [], idle: 1 + i * .4, action: "", task: null }));
  let selected = 0, placing = null, paused = false, sound = false, disposed = false, frame = 0, last = 0, time = 0;
  let activeEvent = null, pendingEvent = null, eventIndex = 0, lastTalk = -10, conversation = null, cinematicTime = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const blocked = (x, y) => x < 2 || x > 37 || y < 5 || y > 15 || objects.some((o) => o.kind !== "field" && o.x === x && o.y === y);
  const say = (text) => { info.innerHTML = `<p>${esc(text)}</p>`; };
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(objects)); } catch (_) { say("배치는 이번 입장 동안 유지돼요. 기기 저장 공간을 확인해 주세요."); } };
  const cell = (p) => ({ x: Math.round(p.x), y: Math.round(p.y) });
  const adjacent = (o, n) => [[o.x-1,o.y],[o.x+1,o.y],[o.x,o.y+1],[o.x,o.y-1]].map(([x,y]) => ({x,y})).filter((p) => !blocked(p.x,p.y)).sort((a,b) => Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y));
  function select(i) {
    selected = i;
    shell.querySelectorAll("[data-person]").forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.person) === i));
    const n = npcs[i]; say(`${n.name} · ${n.role || "본문 속 인물"}${n.refs.length ? ` (${n.refs.join(", ")})` : ""}. 다른 인물을 누르면 관계를 살펴보고, 땅을 누르면 이동해요.`);
  }
  function move(n, goal, task = null) {
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
    routes.forEach(({n,p}) => move(n,p,o));
    pendingEvent = { scene, actors, o };
    say(`${scene.title} · 인물들이 ${OBJECTS[o.kind]}으로 모이고 있어요. (${scene.ref})`);
  }
  function interact(n,o) {
    const scene = model.scenes.find((s) => s.object === o.kind && s.actors.includes(n.name) && sceneActors(s).every(Boolean));
    if (scene) return queueScene(scene,o);
    if (toObject(n,o)) say(`${n.name} → ${OBJECTS[o.kind]} · 일상 동작 (창작)`);
    else say("가는 길이 막혀 있어요. 다른 오브제나 빈 곳을 선택해 주세요.");
  }
  function coordinates(e) {
    const r = canvas.getBoundingClientRect(), scale = Math.min(r.width/WIDTH,r.height/HEIGHT);
    return { x: (e.clientX-r.left-(r.width-WIDTH*scale)/2)/scale/TILE, y: (e.clientY-r.top-(r.height-HEIGHT*scale)/2)/scale/TILE };
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (!options.admin() || activeEvent || window.innerHeight >= window.innerWidth) return;
    const p = coordinates(e), x = Math.round(p.x), y = Math.round(p.y);
    if (placing) {
      if (blocked(x,y) || objects.some((o) => o.x===x && o.y===y) || npcs.some((n) => Math.hypot(n.x-x,n.y-y)<1)) return say("나무·인물과 겹치지 않는 빈 땅을 골라 주세요.");
      if (objects.length >= 16) return say("이번 월드에는 오브제를 16개까지 놓을 수 있어요.");
      objects.push({kind:placing,x,y}); save(); placing = null; syncPlacement(); say("오브제를 놓았어요. 인물을 선택해 사용해 보세요."); return;
    }
    const hit = npcs.findIndex((n) => Math.abs(n.x-p.x)<1.3 && p.y-n.y<.6 && p.y-n.y>-3);
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
    if (!options.admin()) return;
    const b=e.target.closest("button"); if(!b) return;
    if (b.dataset.person!==undefined) { select(Number(b.dataset.person)); return; }
    if (b.dataset.place) {
      if(activeEvent) return;
      placing=b.dataset.place; syncPlacement(); say(`${OBJECTS[placing]}을 놓을 빈 땅을 누르세요.`); return;
    }
    const action=b.dataset.action;
    if(action==="design" && !shell.querySelector(".pb-design")) {
      const board=document.createElement("section");board.className="pb-design";board.setAttribute("aria-label","픽셀 캐릭터와 지형 디자인 도안");
      board.innerHTML='<header><b>실제 캐릭터 · 지형 도안</b><button class="pb-button" data-action="close-design">도안 닫기 ✕</button></header><canvas aria-label="예수님, 모세, 엘리야, 룻, 보아스, 일꾼과 보리밭, 물항아리, 쉬는 자리, 나무"></canvas>';
      shell.append(board);drawDesignBoard(board.querySelector("canvas").getContext("2d"));board.querySelector("button").focus();
    }
    if(action==="close-design") shell.querySelector(".pb-design")?.remove();
    if(action==="cancel-place") { placing=null; syncPlacement(); }
    if(action==="fullscreen") options.landscape();
    if(action==="pause") { paused=!paused; b.setAttribute("aria-pressed",paused); b.textContent=paused?"계속하기":"일시정지"; if(paused && sound) speechSynthesis.cancel(); }
    if(action==="sound") {
      if(!("speechSynthesis" in window)) return say("이 브라우저에서는 음성 합성을 지원하지 않아요. 자막으로 장면을 볼 수 있어요.");
      sound=!sound; b.setAttribute("aria-pressed",sound); b.textContent=sound?"음성 켜짐":"음성 꺼짐";
      if(!sound) speechSynthesis.cancel(); else if(activeEvent) showLine();
    }
    if(action==="reset") {
      endEvent(); objects=defaults(); npcs.forEach((n,i)=>{n.path=[];n.task=null;n.x=9+(i%5)*4;n.y=6+Math.floor(i/5)*7;});save();say("이 월드의 오브제 배치를 처음으로 되돌렸어요.");
    }
    if(action==="scene" && !activeEvent) {
      const scene=model.scenes[eventIndex++%model.scenes.length], o=objects.find((o)=>o.kind===scene.object);
      if(o) queueScene(scene,o); else say(`${OBJECTS[scene.object]}을 먼저 배치해 주세요.`);
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
      if(n.path.length) {
        const p=n.path[0],dx=p.x-n.x,dy=p.y-n.y,d=Math.hypot(dx,dy),step=dt*2.8;
        if (Math.abs(dx) > .1) n.facing = dx > 0 ? 1 : -1;
        if(blocked(p.x,p.y)) { n.path=[];n.task=null;continue; }
        if(d<=step) { n.x=p.x;n.y=p.y;n.path.shift(); }
        else { n.x+=dx/d*step;n.y+=dy/d*step; }
      } else if(n.task) {
        const target=n.task;
        n.action=target.kind;n.task=null;n.idle=7;
        if(target.kind==="bench") { n.x=target.x;n.y=target.y; }
      } else if((n.idle-=dt)<=0 && !pendingEvent?.actors.includes(n)) {
        n.action="";n.idle=3+Math.random()*5;
        if(!reduced) {const p={x:Math.max(2,Math.min(37,Math.round(n.x+(Math.random()-.5)*10))),y:Math.max(5,Math.min(15,Math.round(n.y+(Math.random()-.5)*6)))};if(!blocked(p.x,p.y))move(n,p);}
      }
    }
    if(pendingEvent && pendingEvent.actors.every((n)=>!n.path.length && Math.hypot(n.x-pendingEvent.o.x,n.y-pendingEvent.o.y)<=1.5)) beginEvent(pendingEvent.scene);
    if(time-lastTalk>10) {
      lastTalk=time;
      const r=model.relations.find((r)=>{
        const a=npcs.find((n)=>n.name===r.from),b=npcs.find((n)=>n.name===r.to);
        return a&&b&&Math.hypot(a.x-b.x,a.y-b.y)<3;
      });
      if(r) {
        const a=npcs.find((n)=>n.name===r.from),b=npcs.find((n)=>n.name===r.to);
        a.facing=a.x<b.x?1:-1;b.facing=-a.facing;a.idle=b.idle=3;
        if (!pendingEvent) { a.path=[]; b.path=[]; }
        conversation={text:`${r.from} · ${r.to}: ${r.label}`,until:time+3};say(`${r.from} ↔ ${r.to} · ${r.label}. ${r.note || ""} (${r.ref})`);
      }
    }
  }
  // 배경은 한 번 그리고 매 프레임 재사용한다.
  const background=document.createElement("canvas");background.width=WIDTH;background.height=HEIGHT;
  drawWorldBackground(background.getContext("2d"));
  function draw() {
    ctx.imageSmoothingEnabled=false;ctx.save();
    if(activeEvent && !reduced) {
      const actors=sceneActors(activeEvent.scene),zoom=1+Math.min(.2,cinematicTime*.07);
      const x=actors.reduce((s,n)=>s+n.x*TILE,0)/actors.length,y=actors.reduce((s,n)=>s+n.y*TILE,0)/actors.length;
      ctx.translate(WIDTH/2,HEIGHT/2);ctx.scale(zoom,zoom);ctx.translate(-Math.max(400,Math.min(560,x)),-Math.max(220,Math.min(260,y)));
    }
    ctx.drawImage(background,0,0);
    const items=[...objects.map((o)=>({y:o.y,draw:()=>drawObject(ctx,o)})),...npcs.map((n,i)=>({y:n.y,draw:()=>drawNpc(ctx,n,i,time+cinematicTime,i===selected,activeEvent?.scene.actors.includes(n.name))}))].sort((a,b)=>a.y-b.y);
    items.forEach((item)=>item.draw());
    ctx.restore();
    if(conversation?.until>time) {ctx.font="14px sans-serif";ctx.textAlign="center";ctx.fillStyle="#112d36e8";ctx.fillRect(260,75,440,28);ctx.fillStyle="#fff0c2";ctx.fillText(conversation.text,480,94);}
    if(placing) {ctx.fillStyle="#102e38d9";ctx.fillRect(300,410,360,28);ctx.fillStyle="#ffe5a2";ctx.font="14px sans-serif";ctx.textAlign="center";ctx.fillText(`${OBJECTS[placing]} · 빈 땅을 눌러 배치`,480,430);}
  }
  shell.closest("dialog")?.addEventListener("cancel",(e)=>{
    const board=shell.querySelector(".pb-design");if(board){e.preventDefault();board.remove();shell.querySelector('[data-action="design"]').focus();}
  },{signal});
  const canRun=()=>!disposed&&!document.hidden&&window.innerWidth>window.innerHeight&&options.admin();
  function tick(stamp) {
    if(disposed)return;
    if(!options.admin()) {say("관리자 로그인이 필요해요. 창을 닫고 다시 로그인해 주세요.");return;}
    const dt=Math.min(.05,(stamp-last)/1000||0);last=stamp;
    if(!paused) {
      if(!activeEvent) update(dt);
      else {
        cinematicTime+=dt;activeEvent.elapsed+=dt;
        if(activeEvent.elapsed>4.5 && (!sound || !speechSynthesis.speaking || activeEvent.elapsed>12)) { if(++activeEvent.step>=activeEvent.scene.lines.length) endEvent(); else showLine(); }
      }
    }
    draw();
    if(canRun())frame=requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame);last=0;
    if(document.hidden || window.innerWidth<=window.innerHeight) {if(sound)speechSynthesis.cancel();return;}
    if(canRun())frame=requestAnimationFrame(tick);
  }
  document.addEventListener("visibilitychange",resume,{signal});window.addEventListener("resize",resume,{signal});
  function cleanup() {if(disposed)return;disposed=true;abort.abort();cancelAnimationFrame(frame);if(sound)speechSynthesis.cancel();}
  select(0);draw();resume();
  return ()=>{cleanup();replacement?.();};
}

function drawObject(c,o) { drawWorldObject(c,o); }
function drawNpc(c,n,index,time,selected,acting) {
  const x=Math.round(n.x*TILE),y=Math.round(n.y*TILE);
  if(selected){c.strokeStyle="#ffe7a2";c.lineWidth=2;c.strokeRect(x-35,y-75,70,88);}
  drawPixelCharacter(c,characterStyle(n.name,index),x,y+(acting?Math.round(Math.sin(time*4)*2):0),{walk:n.path.length||acting?Math.sin(time*12):0,action:n.action,time,facing:n.facing||1});
  if(acting){c.fillStyle="#ffe189";c.fillRect(x-2,y-87,4,7);c.fillRect(x-2,y-78,4,3);}
  c.font="12px sans-serif";c.textAlign="center";const w=c.measureText(n.name).width+12;c.fillStyle="#12303bd9";c.fillRect(x-w/2,y+17,w,18);c.fillStyle="#fff1c9";c.fillText(n.name,x,y+30);
}
