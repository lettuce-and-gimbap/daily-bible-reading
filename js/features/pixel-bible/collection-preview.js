import {drawPixelCharacter,characterStyle} from './art.js';
import {wardrobeDetails} from './wardrobe.js';

const DIRECTIONS=['down','left','up','right'];
const LABELS={down:'정면',left:'왼쪽',up:'후면',right:'오른쪽'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderPersonPreview(person,identity=person.identity){
 const canvas=document.createElement('canvas');canvas.width=224;canvas.height=224;
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 c.fillStyle='#f4edda';c.fillRect(0,0,224,224);
 c.fillStyle='#d9d0b6';c.fillRect(68,181,88,7);
 const style=characterStyle(person.name,0,person.role||'',person.refs||[],person.creature||false);
 drawPixelCharacter(c,style,112,184,{scale:3,direction:'down',time:0});
 const dataUrl=canvas.toDataURL();
 return `<section class="pb-person-model" data-person-model data-name="${esc(person.name)}" data-role="${esc(person.role||'')}" data-refs="${esc(JSON.stringify(person.refs||[]))}" data-creature="${person.creature?'true':'false'}" data-facing="0" aria-label="${esc(person.name)} 캐릭터 방향 미리보기"><div class="pb-person-model-stage" tabindex="0" role="application" aria-label="좌우로 밀거나 방향키를 눌러 네 방향 외형을 확인하세요"><img data-model-image src="${dataUrl}" alt="${esc(person.name)} 픽셀 캐릭터 정면"><button class="pb-person-garment" type="button" data-garment-info aria-label="의복 특징 설명 보기" hidden>의복 특징</button><span class="pb-person-model-name">${esc(person.name)}</span></div><div class="pb-person-model-controls"><button class="pb-button" type="button" data-model-prev aria-label="왼쪽으로 돌려 보기">←</button><span data-facing-label>정면 · 좌우로 밀어 보기</span><button class="pb-button" type="button" data-model-next aria-label="오른쪽으로 돌려 보기">→</button></div><p class="pb-person-garment-note" data-garment-note hidden></p></section>`;
}
export function bindPersonPreview(root){
 for(const box of root.querySelectorAll('[data-person-model]')){
  const stage=box.querySelector('.pb-person-model-stage'),image=box.querySelector('[data-model-image]'),label=box.querySelector('[data-facing-label]'),garment=box.querySelector('[data-garment-info]'),note=box.querySelector('[data-garment-note]');
  const refs=JSON.parse(box.dataset.refs||'[]'),person={name:box.dataset.name,role:box.dataset.role,refs,creature:box.dataset.creature==='true'};
  let facing=0,startX=null;
  const update=()=>{
   const direction=DIRECTIONS[facing],canvas=document.createElement('canvas');canvas.width=224;canvas.height=224;
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#f4edda';c.fillRect(0,0,224,224);c.fillStyle='#d9d0b6';c.fillRect(68,181,88,7);
   drawPixelCharacter(c,characterStyle(person.name,0,person.role,person.refs,person.creature),112,184,{scale:3,direction,time:0});
   image.src=canvas.toDataURL();image.alt=`${person.name} 픽셀 캐릭터 ${LABELS[direction]}`;label.textContent=`${LABELS[direction]} · 좌우로 밀어 보기`;
   const style=characterStyle(person.name,0,person.role,person.refs,person.creature),details=wardrobeDetails(style,person.name,person.refs);
   garment.hidden=!details.length;garment.textContent=details.length?`${details[0].label} · 자세히`:'';
   garment.dataset.garment=details.length?'true':'false';box._garmentDetails=details;
  };
  box._turn=delta=>{facing=(facing+delta+4)%4;update();};
  box.querySelector('[data-model-prev]').onclick=()=>box._turn(-1);box.querySelector('[data-model-next]').onclick=()=>box._turn(1);
  stage.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;startX=e.clientX;stage.setPointerCapture?.(e.pointerId);});
  stage.addEventListener('pointerup',e=>{if(startX===null)return;const dx=e.clientX-startX;startX=null;if(Math.abs(dx)>24)box._turn(dx<0?1:-1);});
  stage.addEventListener('pointercancel',()=>{startX=null;});
  stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();box._turn(e.key==='ArrowRight'?1:-1);}});
  garment.onclick=()=>{const detail=box._garmentDetails?.[0];if(!detail)return;note.hidden=false;note.innerHTML=`<b>${esc(detail.label)}</b><br>${esc(detail.text)}<small>${esc(detail.ref)}</small>`;};
  update();
 }
}
