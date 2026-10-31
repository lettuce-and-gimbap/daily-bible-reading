import {impactPose,swimPose} from './collision-motion.js';
import {drawPixelCharacter,characterStyle} from './art.js';
import {wardrobeDetails} from './wardrobe.js';

const LABELS={down:'정면',left:'왼쪽 측면',up:'뒷면',right:'오른쪽 측면',top:'위에서 보기'};
const TURN_ORDER=['down','right','up','left'];
const MOTIONS=['walk','run','dizzy','swim'];
const MOTION_LABELS={stand:'서 있기',walk:'걷기',run:'뛰기',dizzy:'헤롱헤롱',swim:'물에 빠지기'};
const EXPRESSIONS=['neutral','joy','gentle','worried','surprised','determined','sad'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function easyPersonDescription(name,role=''){
 const text=String(role||'').replace(/^[^·:：]*[·:：]\s*/u,'').trim();
 const last=String(name||'').at(-1)?.charCodeAt(0)-0xac00,hasBatchim=Number.isFinite(last)&&last>=0&&last<=11171&&last%28!==0;
 const descriptions=[
  [/사도|제자/u,'예수님을 따르며 말씀을 배우고, 들은 가르침을 다른 사람에게 전한 사람이에요.'],
  [/선지자|예언자/u,'하나님의 말씀을 전하고, 사람들이 그 말씀에 따라 살도록 일깨운 사람이에요.'],
  [/제사장/u,'성전에서 예배와 제사를 맡고 백성을 섬긴 사람이에요.'],
  [/(?:^|\s)(?:이스라엘|유다|앗수르)?\s*(?:왕|왕비|여왕)(?:이|은|께서|으로)?(?=\s|$|[,.·])/u,'나라를 다스리며 백성과 주변 나라의 일에 책임을 진 사람이에요.'],
  [/장수|군대|군사|장관/u,'왕의 명령을 받아 군대를 이끌거나 나라의 일을 맡은 사람이에요.'],
  [/서기관|기록/u,'글을 읽고 쓰며 왕이나 백성의 중요한 일을 기록한 사람이에요.'],
  [/사사/u,'이스라엘 백성을 이끌고 어려운 일을 해결한 지도자예요.'],
  [/농부|농사|목자|양/u,'농사나 가축을 돌보며 살아간 사람이에요.'],
 ];
 const match=descriptions.find(([pattern])=>pattern.test(text));
 if(match)return match[1];
 if(text)return `이 인물은 이 본문에서 ${text.replace(/[.!?。]+$/u,'')}${hasBatchim?'으로':'로'} 나와요.`;
 return `이 인물은 이 본문에 등장해요. 아래 이야기와 성경 구절을 보며 어떤 일을 했는지 알아볼 수 있어요.`;
}

export function previewDirectionAfterSwipe(direction,dx,dy,minDistance=8){
 if(Math.hypot(dx,dy)<minDistance)return direction;
 if(Math.abs(dx)>=Math.abs(dy)){
  const index=Math.max(0,TURN_ORDER.indexOf(direction==='top'?'down':direction));
  const turns=Math.max(1,Math.floor(Math.abs(dx)/48));
  return TURN_ORDER[(index+(dx>0?turns:-turns)+TURN_ORDER.length*2)%TURN_ORDER.length];
 }
 // A vertical swipe deliberately selects a stable elevated or front view;
 // it no longer moves the sprite out of its frame.
 return dy<0?'top':'down';
}
export function previewDirectionFromControl(direction){return Object.hasOwn(LABELS,direction)?direction:'down';}
export function previewMotionAfterTap(motion){return MOTIONS[(MOTIONS.indexOf(motion)+1)%MOTIONS.length];}

export function renderPersonPreview(person){
 return `<section class="pb-person-model" data-person-model data-name="${esc(person.name)}" data-role="${esc(person.role||'')}" data-refs="${esc(JSON.stringify(person.refs||[]))}" data-creature="${person.creature?'true':'false'}" aria-label="${esc(person.name)} 캐릭터 동작과 시점 보기"><div class="pb-person-model-stage" tabindex="0" role="group" aria-label="캐릭터를 좌우로 밀어 회전하고 위아래로 밀어 위·정면 시점을 보세요. 짧게 누르면 걷기·뛰기·헤롱헤롱·물에 빠지기를 바꿉니다."><canvas data-model-canvas width="288" height="288" role="img" aria-label="${esc(person.name)} 픽셀 캐릭터 정면"></canvas><button class="pb-person-garment" type="button" data-garment-info aria-label="의복 특징 설명 보기" hidden>의복 특징</button><span class="pb-person-model-name">${esc(person.name)}</span><span class="pb-person-model-motion" data-model-motion aria-live="polite">걷기</span></div><div class="pb-model-controls"><button type="button" data-model-direction="down">정면</button><button type="button" data-model-direction="up">뒷면</button><button type="button" data-model-direction="left">왼쪽</button><button type="button" data-model-direction="right">오른쪽</button></div><p class="pb-person-model-hint" data-model-status aria-live="polite">네 방향 버튼 또는 밀기로 시점 변경 · 걷기·뛰기·헤롱헤롱·물에 빠지기 자동 재생</p><p class="pb-person-garment-note" data-garment-note hidden></p></section>`;
}

function drawPreview(canvas,person,direction,walkFrame,expression,time,motion){
 const c=canvas.getContext('2d');if(!c)return;
 c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
 const style=characterStyle(person.name,0,person.role||'',person.refs||[],person.creature||false);
 c.save();c.translate(canvas.width/2,canvas.height-50);
 if(motion==='dizzy')c.rotate(Math.sin(time*5)*.16);
 if(motion==='run')c.translate(0,-Math.abs(Math.sin(time*12))*8);
 const interaction=motion==='swim'?swimPose(time%3,false):motion==='dizzy'?impactPose(time%1,false):null;
 drawPixelCharacter(c,style,0,0,{scale:3,direction,walkFrame,expression,time,interaction});c.restore();
 if(motion==='swim'){c.fillStyle='#69bfd1aa';c.fillRect(12,235,264,20);c.fillStyle='#e0faff';for(let x=16;x<275;x+=24)c.fillRect(x,234+Math.sin(time*5+x)*3,14,2);}

}

export function bindPersonPreview(root){
 const disposers=[];
 for(const box of root.querySelectorAll('[data-person-model]')){
  const stage=box.querySelector('.pb-person-model-stage'),canvas=box.querySelector('[data-model-canvas]'),garment=box.querySelector('[data-garment-info]'),note=box.querySelector('[data-garment-note]'),status=box.querySelector('[data-model-status]'),motionLabel=box.querySelector('[data-model-motion]');
  if(!stage||!canvas||!status||!motionLabel)continue;
  const refs=JSON.parse(box.dataset.refs||'[]'),person={name:box.dataset.name,role:box.dataset.role,refs,creature:box.dataset.creature==='true'};
  let direction='down',motion='walk',drag=null,frame=0,expressionIndex=0,lastStep=0,lastExpression=0,raf=0,disposed=false;
  const startTime=performance.now();
  const garmentDetails=(()=>{const style=characterStyle(person.name,0,person.role,person.refs,person.creature);return wardrobeDetails(style,person.name,person.refs);})();
  let motionBag=[];
  let nextMotion=performance.now()+3200;
  let lastStatus='',lastCanvasLabel='';
  const render=()=>{
   const now=performance.now();
   drawPreview(canvas,person,direction,motion==='stand'?0:frame,EXPRESSIONS[expressionIndex],(now-startTime)/1000,motion);
   const canvasLabel=`${person.name} 픽셀 캐릭터 ${LABELS[direction]} · ${MOTION_LABELS[motion]} · 표정 ${EXPRESSIONS[expressionIndex]}`;
   if(canvasLabel!==lastCanvasLabel){canvas.setAttribute('aria-label',canvasLabel);lastCanvasLabel=canvasLabel;}
   if(motionLabel.textContent!==MOTION_LABELS[motion])motionLabel.textContent=MOTION_LABELS[motion];
   const statusText=`${MOTION_LABELS[motion]} 중 · ${LABELS[direction]} · 표정 ${EXPRESSIONS[expressionIndex]} · 좌우 밀기: 회전, 위 밀기: 위에서 보기, 짧게 누르기: 동작 변경`;
   if(statusText!==lastStatus){status.textContent=statusText;lastStatus=statusText;}
   garment.hidden=!garmentDetails.length;garment.textContent=garmentDetails.length?`${garmentDetails[0].label} · 자세히`:'';box._garmentDetails=garmentDetails;
  };
  const cycleMotion=()=>{motion=previewMotionAfterTap(motion);frame=0;render();};
  const animate=now=>{
   if(disposed||!box.isConnected){if(raf)cancelAnimationFrame(raf);return;}
   if(now>=nextMotion){if(!motionBag.length)motionBag=MOTIONS.filter(m=>m!==motion).sort(()=>Math.random()-.5);motion=motionBag.pop();direction=TURN_ORDER[Math.floor(Math.random()*4)];nextMotion=now+3200;}
   const interval=motion==='run'?95:motion==='walk'?230:500;
   if(now-lastStep>=interval){lastStep=now;if(motion!=='stand')frame=(frame+1)%4;}
   if(now-lastExpression>=1550){lastExpression=now;expressionIndex=(expressionIndex+1)%EXPRESSIONS.length;}
   render();raf=requestAnimationFrame(animate);
  };
  stage.addEventListener('pointerdown',e=>{
   if(e.target.closest('button'))return;
   drag={id:e.pointerId,x:e.clientX,y:e.clientY,direction,distance:0};
   try{stage.setPointerCapture?.(e.pointerId);}catch(_){}e.preventDefault();
  });
  stage.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId)return;
   const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
   drag.distance=Math.max(drag.distance,Math.hypot(dx,dy));
   direction=previewDirectionAfterSwipe(drag.direction,dx,dy,32);render();
  });
  const finish=e=>{
   if(!drag||e.pointerId!==drag.id)return;
   const tapped=drag.distance<12;drag=null;if(tapped)cycleMotion();else render();
  };
  stage.addEventListener('pointerup',finish);stage.addEventListener('pointercancel',finish);
  stage.addEventListener('keydown',e=>{
   if(e.key===' '||e.key==='Enter'){e.preventDefault();cycleMotion();return;}
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
   e.preventDefault();
   const delta={ArrowLeft:[-40,0],ArrowRight:[40,0],ArrowUp:[0,-40],ArrowDown:[0,40]}[e.key];
   direction=previewDirectionAfterSwipe(direction,...delta,8);render();
  });
  box.addEventListener('click',e=>{
   const control=e.target.closest('[data-model-direction]');if(control){direction=control.dataset.modelDirection;render();return;}
   if(e.target.closest('[data-garment-info]')){const detail=box._garmentDetails?.[0];if(!detail)return;note.hidden=false;note.innerHTML=`<b>${esc(detail.label)}</b><br>${esc(detail.text)}<small>${esc(detail.ref)}</small>`;}
  });
  render();raf=requestAnimationFrame(animate);
  const dispose=()=>{disposed=true;if(raf)cancelAnimationFrame(raf);stage.removeEventListener('pointerup',finish);stage.removeEventListener('pointercancel',finish);};
  box._disposePersonPreview=dispose;disposers.push(dispose);
 }
 return ()=>disposers.forEach(dispose=>dispose());
}
