import {drawPixelCharacter,characterStyle} from './art.js';
import {wardrobeDetails} from './wardrobe.js';

const LABELS={down:'정면',left:'왼쪽',up:'후면',right:'오른쪽'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderPersonPreview(person){
 const dataUrl=drawPreview(person).toDataURL();
 return `<section class="pb-person-model" data-person-model data-name="${esc(person.name)}" data-role="${esc(person.role||'')}" data-refs="${esc(JSON.stringify(person.refs||[]))}" data-creature="${person.creature?'true':'false'}" aria-label="${esc(person.name)} 캐릭터 방향 보기"><div class="pb-person-model-stage" tabindex="0" role="group" aria-label="캐릭터 몸을 잡고 상하좌우로 끌어 움직여 보세요"><img data-model-image src="${dataUrl}" alt="${esc(person.name)} 픽셀 캐릭터 정면"><button class="pb-person-garment" type="button" data-garment-info aria-label="의복 특징 설명 보기" hidden>의복 특징</button><span class="pb-person-model-name">${esc(person.name)}</span></div><p class="pb-person-model-hint">캐릭터를 끌어 움직이거나 화살표를 눌러 방향을 살펴보세요.</p><div class="pb-person-model-controls" role="group" aria-label="캐릭터 방향"><button class="pb-button" type="button" data-model-face="up" aria-label="뒤쪽 보기">↑<small>뒤</small></button><button class="pb-button" type="button" data-model-face="left" aria-label="왼쪽 보기">←<small>왼쪽</small></button><button class="pb-button" type="button" data-model-center>앞</button><button class="pb-button" type="button" data-model-face="right" aria-label="오른쪽 보기">→<small>오른쪽</small></button><button class="pb-button" type="button" data-model-face="down" aria-label="정면 보기">↓<small>앞</small></button></div><p class="pb-person-garment-note" data-garment-note hidden></p></section>`;
}
function drawPreview(person,position={x:0,y:0},direction='down',walkFrame=0){
 const character=document.createElement('canvas');character.width=224;character.height=224;
 const c=character.getContext('2d');c.imageSmoothingEnabled=false;
 const style=characterStyle(person.name,0,person.role||'',person.refs||[],person.creature||false);
 drawPixelCharacter(c,style,112+position.x,184+position.y,{scale:3,direction,walkFrame,time:0});
 return character;
}
export function bindPersonPreview(root){
 for(const box of root.querySelectorAll('[data-person-model]')){
  const stage=box.querySelector('.pb-person-model-stage'),image=box.querySelector('[data-model-image]'),garment=box.querySelector('[data-garment-info]'),note=box.querySelector('[data-garment-note]');
  const refs=JSON.parse(box.dataset.refs||'[]'),person={name:box.dataset.name,role:box.dataset.role,refs,creature:box.dataset.creature==='true'};
  let position={x:0,y:0},direction='down',drag=null;
  const update=(walkFrame=0)=>{
   const style=characterStyle(person.name,0,person.role,person.refs,person.creature),details=wardrobeDetails(style,person.name,person.refs);
   const pixels=drawPreview(person,position,direction,walkFrame);box._characterPixels=pixels;
   image.src=pixels.toDataURL();image.alt=`${person.name} 픽셀 캐릭터 ${LABELS[direction]}`;
   box.querySelectorAll('[data-model-face]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.modelFace===direction)));
   garment.hidden=!details.length;garment.textContent=details.length?`${details[0].label} · 자세히`:'';
   box._garmentDetails=details;
  };
  const setDirectionFrom=(dx,dy)=>{if(Math.abs(dx)+Math.abs(dy)<2)return;if(Math.abs(dx)>=Math.abs(dy))direction=dx<0?'left':'right';else direction=dy<0?'up':'down';};
  const inCharacter=(e)=>{
   const rect=image.getBoundingClientRect();if(!rect.width||!rect.height)return false;
   const x=Math.floor((e.clientX-rect.left)*224/rect.width),y=Math.floor((e.clientY-rect.top)*224/rect.height);
   if(x<0||y<0||x>=224||y>=224)return false;
   return box._characterPixels.getContext('2d').getImageData(x,y,1,1).data[3]>24;
  };
  stage.addEventListener('pointerdown',e=>{
   if(e.target.closest('button')||!inCharacter(e))return;
   drag={id:e.pointerId,x:e.clientX,y:e.clientY,origin:{...position},distance:0};
   stage.setPointerCapture?.(e.pointerId);e.preventDefault();
  });
  stage.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId)return;
   const rect=image.getBoundingClientRect(),factor=224/Math.max(1,rect.width),dx=(e.clientX-drag.x)*factor,dy=(e.clientY-drag.y)*factor;
   position={x:Math.max(-58,Math.min(58,drag.origin.x+dx)),y:Math.max(-28,Math.min(28,drag.origin.y+dy))};
   drag.distance=Math.hypot(dx,dy);setDirectionFrom(dx,dy);
   update(Math.floor(drag.distance/7)%4||1);
  });
  const finish=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;update();};
  stage.addEventListener('pointerup',finish);stage.addEventListener('pointercancel',finish);
  stage.addEventListener('keydown',e=>{
   const delta={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[e.key];if(!delta)return;
   e.preventDefault();position={x:Math.max(-58,Math.min(58,position.x+delta[0])),y:Math.max(-28,Math.min(28,position.y+delta[1]))};setDirectionFrom(...delta);update(1);
  });
  box.querySelectorAll('[data-model-face]').forEach(button=>button.onclick=()=>{direction=button.dataset.modelFace;update();});
  const center=box.querySelector('[data-model-center]');center.setAttribute('aria-label','캐릭터를 가운데로 옮기고 정면 보기');center.onclick=()=>{position={x:0,y:0};direction='down';update();};
  garment.onclick=()=>{const detail=box._garmentDetails?.[0];if(!detail)return;note.hidden=false;note.innerHTML=`<b>${esc(detail.label)}</b><br>${esc(detail.text)}<small>${esc(detail.ref)}</small>`;};
  update();
 }
}
