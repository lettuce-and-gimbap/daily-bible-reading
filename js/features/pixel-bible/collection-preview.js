import {drawPixelCharacter,characterStyle} from './art.js';
import {wardrobeDetails} from './wardrobe.js';

const LABELS={down:'정면',left:'왼쪽',up:'후면',right:'오른쪽'};
const TURN_ORDER=['down','right','up','left'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function previewDirectionAfterSwipe(direction,dx,dy,minDistance=8){
 if(Math.hypot(dx,dy)<minDistance)return direction;
 if(Math.abs(dx)>=Math.abs(dy)){
  const index=Math.max(0,TURN_ORDER.indexOf(direction));
  // A rightward swipe turns one quarter counterclockwise; a leftward swipe
  // turns clockwise. The four rendered poses are the turntable's viewpoints.
  return TURN_ORDER[(index+(dx>0?1:3))%TURN_ORDER.length];
 }
 return dy<0?'up':'down';
}
export function previewDirectionFromControl(direction){return Object.hasOwn(LABELS,direction)?direction:'down';}
export function renderPersonPreview(person){
 return `<section class="pb-person-model" data-person-model data-name="${esc(person.name)}" data-role="${esc(person.role||'')}" data-refs="${esc(JSON.stringify(person.refs||[]))}" data-creature="${person.creature?'true':'false'}" aria-label="${esc(person.name)} 캐릭터 방향 보기"><div class="pb-person-model-stage" tabindex="0" role="group" aria-label="캐릭터 또는 주변 빈 곳을 상하좌우로 끌어 시점을 돌려 보세요"><canvas data-model-canvas width="224" height="224" role="img" aria-label="${esc(person.name)} 픽셀 캐릭터 정면"></canvas><button class="pb-person-garment" type="button" data-garment-info aria-label="의복 특징 설명 보기" hidden>의복 특징</button><span class="pb-person-model-name">${esc(person.name)}</span></div><p class="pb-person-model-hint" data-model-status aria-live="polite">캐릭터나 주변 빈 곳을 좌우로 밀어 옆면을, 위아래로 밀어 뒤·앞면을 살펴보세요.</p><div class="pb-person-model-controls" role="group" aria-label="캐릭터 방향"><button class="pb-button" type="button" data-model-face="up" aria-label="뒤쪽 보기">↑<small>뒤</small></button><button class="pb-button" type="button" data-model-face="left" aria-label="왼쪽 보기">←<small>왼쪽</small></button><button class="pb-button" type="button" data-model-center>앞</button><button class="pb-button" type="button" data-model-face="right" aria-label="오른쪽 보기">→<small>오른쪽</small></button><button class="pb-button" type="button" data-model-face="down" aria-label="정면 보기">↓<small>앞</small></button></div><p class="pb-person-garment-note" data-garment-note hidden></p></section>`;
}
function drawPreview(character,person,position={x:0,y:0},direction='down',walkFrame=0){
 const c=character.getContext('2d');c.clearRect(0,0,character.width,character.height);c.imageSmoothingEnabled=false;
 const style=characterStyle(person.name,0,person.role||'',person.refs||[],person.creature||false);
 drawPixelCharacter(c,style,112+position.x,184+position.y,{scale:3,direction,walkFrame,time:0});
}
export function bindPersonPreview(root){
 for(const box of root.querySelectorAll('[data-person-model]')){
  const stage=box.querySelector('.pb-person-model-stage'),canvas=box.querySelector('[data-model-canvas]'),garment=box.querySelector('[data-garment-info]'),note=box.querySelector('[data-garment-note]'),status=box.querySelector('[data-model-status]');
  const refs=JSON.parse(box.dataset.refs||'[]'),person={name:box.dataset.name,role:box.dataset.role,refs,creature:box.dataset.creature==='true'};
  let position={x:0,y:0},direction='down',drag=null;
  const update=(walkFrame=0)=>{
   const style=characterStyle(person.name,0,person.role,person.refs,person.creature),details=wardrobeDetails(style,person.name,person.refs);
   drawPreview(canvas,person,position,direction,walkFrame);canvas.setAttribute('aria-label',`${person.name} 픽셀 캐릭터 ${LABELS[direction]}`);
   status.textContent=`현재 방향: ${LABELS[direction]} · 화살표를 누르거나 캐릭터를 밀어 방향을 바꿔 보세요.`;
   box.querySelectorAll('[data-model-face]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.modelFace===direction)));
   garment.hidden=!details.length;garment.textContent=details.length?`${details[0].label} · 자세히`:'';
   box._garmentDetails=details;
  };
  stage.addEventListener('pointerdown',e=>{
   // On touch screens a pixel-exact alpha hit can miss due to fractional CSS
   // scaling. The preview stage itself is a forgiving drag surface.
   if(e.target.closest('button'))return;
   drag={id:e.pointerId,x:e.clientX,y:e.clientY,origin:{...position},direction,distance:0};
   try{stage.setPointerCapture?.(e.pointerId);}catch(_){}e.preventDefault();
  });
  stage.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId)return;
   const rect=canvas.getBoundingClientRect(),factor=224/Math.max(1,rect.width),dx=(e.clientX-drag.x)*factor,dy=(e.clientY-drag.y)*factor;
   position={x:Math.max(-58,Math.min(58,drag.origin.x+dx)),y:Math.max(-28,Math.min(28,drag.origin.y+dy))};
   drag.distance=Math.hypot(dx,dy);direction=previewDirectionAfterSwipe(drag.direction,dx,dy);
   update(Math.floor(drag.distance/7)%4||1);
  });
  const finish=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;update();};
  stage.addEventListener('pointerup',finish);stage.addEventListener('pointercancel',finish);
  stage.addEventListener('keydown',e=>{
   const delta={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[e.key];if(!delta)return;
   e.preventDefault();position={x:Math.max(-58,Math.min(58,position.x+delta[0])),y:Math.max(-28,Math.min(28,position.y+delta[1]))};direction=previewDirectionAfterSwipe(direction,...delta,1);update(1);
  });
  box.addEventListener('click',e=>{
   const face=e.target.closest('[data-model-face]');
   if(face&&box.contains(face)){e.preventDefault();e.stopPropagation();direction=previewDirectionFromControl(face.dataset.modelFace);update();return;}
   const center=e.target.closest('[data-model-center]');
   if(center&&box.contains(center)){e.preventDefault();e.stopPropagation();position={x:0,y:0};direction='down';update();}
  });
  const center=box.querySelector('[data-model-center]');center.setAttribute('aria-label','캐릭터를 가운데로 옮기고 정면 보기');
  garment.onclick=()=>{const detail=box._garmentDetails?.[0];if(!detail)return;note.hidden=false;note.innerHTML=`<b>${esc(detail.label)}</b><br>${esc(detail.text)}<small>${esc(detail.ref)}</small>`;};
  update();
 }
}
