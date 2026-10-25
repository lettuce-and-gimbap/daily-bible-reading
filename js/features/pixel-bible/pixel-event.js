import {characterStyle,drawPixelCharacter,drawWorldObject} from './art.js';
import {objectPresentation} from './object-response.js';
import {OBJECT_CATALOG} from './object-catalog.js';
import {sampleEvent,eventPlan} from './event-animation/timeline.js';
import {drawStage} from './event-animation/stage.js';
import {drawEffects} from './event-animation/effects.js';
export const EVENT_STEPS=['상황','준비','행동','결과','반응','마무리'];
const caption=name=>String(name).replace(/\s*\([^)]*의 (?:아들|딸|아내|남편)\)/g,'');
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export function pixelEventFrame(scene,person,index,seconds){const state=sampleEvent(scene,[person],seconds).states[0];return {...state,beat:sampleEvent(scene,[person],seconds).index,label:sampleEvent(scene,[person],seconds).label};}
export function eventLayout(sample){
 const {plan,states}=sample,n=states.length,leadIndex=states.findIndex(s=>s.active),lead=states[leadIndex]||states[0];
 const positions=states.map((s,i)=>{let x=n===1?305:180+i*360/Math.max(1,n-1);if(n===2)x=i===leadIndex?300:450;
 if(['flood','recede','bird-release'].includes(plan.motif))x=360;
 x=clamp(x+s.travel,85,640);const y=['flood','recede','bird-release'].includes(plan.motif)?155:235;
 return {x,y,direction:s.direction,hand:{x:x+(s.direction==='left'?12-s.hand.x:s.hand.x-12)*3,y:y+(s.hand.y-36)*3+10}};});
 return {positions,lead:positions[leadIndex>=0?leadIndex:0]||{x:300,y:235},prop:{x:360,y:235},leadIndex:leadIndex>=0?leadIndex:0};
}
function drawProp(c,kind,position,{angle=0}={}){
 if(!kind||!OBJECT_CATALOG[kind])return;
 c.save();c.translate(Math.round(position.x),Math.round(position.y));c.rotate(angle);
 drawWorldObject(c,{kind,x:0,y:0},1,0);c.restore();
}
export function renderPixelEvent(c,scene,actors,seconds=0,{portrait=false,reduced=false}={}){
 const people=actors.filter(Boolean),plan=eventPlan(scene),total=plan.beats.reduce((n,b)=>n+b.duration,0),elapsed=reduced?total:Math.min(total,Math.max(0,seconds));
 const sample=sampleEvent(scene,people,elapsed,{portrait,reduced}),layout=eventLayout(sample),kind=sample.plan.prop||scene.object,profile=objectPresentation(kind);
 c.save();c.imageSmoothingEnabled=false;drawStage(c,sample.plan.setting,elapsed);
 if(portrait){
  // Original sprite heads and shoulders: crop at source resolution, never redraw a different person.
  sample.states.slice(0,2).forEach((state,i)=>{const x=i?520:200;c.save();c.beginPath();c.rect(i?370:30,25,320,245);c.clip();drawPixelCharacter(c,characterStyle(state.person.name,i,state.person.role,state.person.refs||[],state.person.creature||false),x,285,{scale:7,direction:i?'left':'right',expression:state.expression});c.restore();c.fillStyle='#fff3cd';c.textAlign='center';c.font='16px DungGeunMo,monospace';c.fillText(caption(state.person.name),x,288);});c.restore();return sample;
 }
 const leadState=sample.states[layout.leadIndex],leadPos=layout.positions[layout.leadIndex];
 const portable=profile.portable&&sample.plan.mode!=='illustration';
 let propPosition={...layout.prop},propAngle=0;
 if(portable&&leadState?.held){const amount=leadState.previousHeld?1:sample.progress;propPosition={x:layout.prop.x+(leadPos.hand.x-layout.prop.x)*amount,y:layout.prop.y+(leadPos.hand.y-layout.prop.y)*amount};propAngle=leadState.toolAngle||0;}
 else if(portable&&sample.plan.effect==='transfer'&&sample.index>=4&&sample.states.length>1){const target=layout.positions.find((p,i)=>i!==layout.leadIndex),amount=sample.index===4?sample.progress:1;propPosition={x:leadPos.hand.x+(target.hand.x-leadPos.hand.x)*amount,y:leadPos.hand.y+(target.hand.y-leadPos.hand.y)*amount};}
 else if(portable&&leadState?.previousHeld&&!leadState.held){const amount=sample.progress;propPosition={x:leadPos.hand.x+(layout.prop.x-leadPos.hand.x)*amount,y:leadPos.hand.y+(layout.prop.y-leadPos.hand.y)*amount};}

 // Fixed objects remain on the ground at the same scale throughout the event.
 if(!portable)drawProp(c,kind,propPosition);
 const supporting=(scene.requiresObjects||[]).filter(k=>k!==kind).map((k,i)=>({kind:k,x:k==='bed'?(layout.positions.find((_,j)=>j!==layout.leadIndex)?.x||455):405+i*45,y:235}));
 for(const o of supporting)drawProp(c,o.kind,o);
 sample.states.forEach((state,i)=>{
  const n=state.person,pos=layout.positions[i];let x=pos.x,y=pos.y;
  if(state.pose.lie){const bed=kind==='bed'?layout.prop:supporting.find(o=>o.kind==='bed');x=bed?bed.x+8:pos.x;y=bed?bed.y+36:pos.y+16;}
  drawPixelCharacter(c,characterStyle(n.name,i,n.role,n.refs||[],n.creature||false),x,y,{scale:3,direction:state.direction,interaction:state.pose,walkFrame:state.walkFrame,expression:state.expression});
  c.fillStyle='#fff3cd';c.textAlign='center';c.font='13px DungGeunMo,monospace';c.fillText(caption(n.name),pos.x,288);
 });
 if(portable&&!(['sling','arrow'].includes(sample.plan.effect)&&sample.index>=4))drawProp(c,kind,propPosition,{angle:propAngle});
 drawEffects(c,sample,layout);
 c.fillStyle='#233d47';c.fillRect(8,7,Math.min(300,sample.label.length*14+24),23);c.fillStyle='#fff0c6';c.font='13px DungGeunMo,monospace';c.textAlign='left';c.fillText(sample.label,17,23);
 // A six-segment progress bar distinguishes preparation from outcome without a flashing overlay.
 for(let i=0;i<sample.plan.beats.length;i++){c.fillStyle=i<=sample.index?'#d8bc75':'#425c5e';c.fillRect(535+i*27,14,23,5);}
 c.restore();return sample;
}
export function mountPixelEvent(host,scene,actors,{portrait=false}={}){
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=300;canvas.style.cssText='display:block;width:100%;max-height:48vh;image-rendering:pixelated;object-fit:contain';canvas.setAttribute('aria-label',scene.title+' 픽셀 사건 재생');host.prepend(canvas);
 const c=canvas.getContext('2d'),reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;let frame,disposed=false,start=performance.now(),paused=false,pauseAt=0;
 function draw(now){if(disposed||!canvas.isConnected)return;renderPixelEvent(c,scene,actors,((paused?pauseAt:now)-start)/1000,{portrait,reduced});frame=requestAnimationFrame(draw);}
 frame=requestAnimationFrame(draw);const dispose=()=>{disposed=true;cancelAnimationFrame(frame);canvas.remove();};dispose.setPaused=value=>{if(value===paused)return;if(value)pauseAt=performance.now();else start+=performance.now()-pauseAt;paused=value;};return dispose;
}
