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
 if(['calm-sea','net-catch'].includes(plan.motif))x=330+i*60;
 if(['baptism','revive-fall','heal-rise','wash-feet','anoint-feet','anoint-cloak','water-rescue'].includes(plan.motif)&&n===2)x=i===leadIndex?330:390;
 if(plan.motif==='roof-lower')x=i===leadIndex&&n>1?265:360;
 if(plan.motif==='emmaus')x=i===leadIndex?320:445+(i-1)*105;
 if(plan.motif==='vision-water')x=120+i*75;
 if(plan.motif==='crucifixion'&&i===leadIndex)x=360;
 if(plan.motif==='raise-dead'&&i!==leadIndex)x=360+(sample.index===4?sample.progress:sample.index>4?1:0)*60;
 x=clamp(x+s.travel,85,640);const y=plan.motif==='roof-lower'&&(i!==leadIndex||n===1)?95+Math.round(Math.min(1,(sample.index+sample.progress)/4)*130):plan.motif==='revive-fall'&&i!==leadIndex&&sample.index===0?130+Math.round(sample.progress*105):plan.motif==='anoint-cloak'&&i!==leadIndex?255:['calm-sea','net-catch'].includes(plan.motif)?203:['flood','recede','bird-release'].includes(plan.motif)?155:235;
 const direction=['left','right'].includes(s.direction)?n===2?(i===leadIndex?'right':'left'):x<=360?'right':'left':s.direction;
 return {x,y,direction,hand:{x:x+(direction==='left'?12-s.hand.x:s.hand.x-12)*3,y:y+(s.hand.y-36)*3+10}};});
 return {positions,lead:positions[leadIndex>=0?leadIndex:0]||{x:300,y:235,hand:{x:330,y:190}},prop:{x:360,y:235},leadIndex:leadIndex>=0?leadIndex:0};
}
function drawProp(c,kind,position,{angle=0}={}){
 if(!kind||kind==='scene-marker'||!OBJECT_CATALOG[kind])return;
 c.save();c.translate(Math.round(position.x),Math.round(position.y));c.rotate(angle);
 drawWorldObject(c,{kind,x:0,y:0},1,0);c.restore();
}
// Teaching units have no invented historical actors. Their visual summary is explicit.
function drawExplanation(c,scene,sample){
 c.fillStyle='#233d47';c.fillRect(55,65,610,197);c.strokeStyle='#bdab78';c.lineWidth=2;c.strokeRect(55,65,610,197);
 c.fillStyle='#f7e8c1';c.font='18px DungGeunMo,monospace';c.textAlign='left';
 const lines=(text,max)=>{const rows=[];let row='';for(const char of text){if(row.length>=max){rows.push(row);row='';}row+=char;}if(row)rows.push(row);return rows;};
 let y=95;for(const line of lines(scene.title,30)){c.fillText(line,80,y);y+=22;}
 c.font='14px DungGeunMo,monospace';c.fillStyle='#d1dace';
 const text=scene.study||scene.objectNote||'';const rows=lines(text,41);const size=Math.min(14,Math.max(10,Math.floor(110/Math.max(1,rows.length))));c.font=size+'px DungGeunMo,monospace';
 for(const line of rows){c.fillText(line,80,y+4);y+=size+3;}
 c.fillStyle='#b4c9bd';c.font='12px DungGeunMo,monospace';c.fillText('본문 설명 · 인물의 실제 동작을 재현한 장면은 아니에요',80,250);
}
export function renderPixelEvent(c,scene,actors,seconds=0,{portrait=false,reduced=false}={}){
 const people=actors.filter(Boolean),plan=eventPlan(scene),total=plan.beats.reduce((n,b)=>n+b.duration,0),elapsed=reduced?total:Math.min(total,Math.max(0,seconds));
 const sample=sampleEvent(scene,people,elapsed,{portrait,reduced}),layout=eventLayout(sample),kind=sample.plan.prop||scene.object,profile=objectPresentation(kind);
 c.save();c.imageSmoothingEnabled=false;drawStage(c,sample.plan.setting,elapsed);
 if(!people.length&&plan.mode==='illustration'){drawExplanation(c,scene,sample);for(let i=0;i<6;i++){c.fillStyle=i<=sample.index?'#d8bc75':'#425c5e';c.fillRect(535+i*27,14,23,5);}c.restore();return sample;}
 if(portrait&&people.length){
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
 if(!portable&&plan.motif!=='baptism')drawProp(c,kind,propPosition);
 const supporting=(scene.requiresObjects||[]).filter(k=>k!==kind).map((k,i)=>({kind:k,x:k==='bed'?(layout.positions.find((_,j)=>j!==layout.leadIndex)?.x||455):405+i*45,y:235}));
 for(const o of supporting)drawProp(c,o.kind,o);
 sample.states.forEach((state,i)=>{
  if(state.visible===false)return;
  const n=state.person,pos=layout.positions[i];let x=pos.x,y=pos.y;
  if(state.pose.lie){const bed=kind==='bed'?layout.prop:supporting.find(o=>o.kind==='bed');x=bed?bed.x+8:pos.x;y=bed?bed.y+36:pos.y+16;}
  const portrayal=sample.plan.portrayals?.[n.name]||{};if(portrayal.lie){x=layout.prop.x;y=layout.prop.y-14;}let style=characterStyle(n.name,i,n.role,n.refs||[],n.creature||false);
  if(sample.plan.motif==='vision-robes'&&sample.index>=3)style={...style,coat:'#e8e4d4'};
  drawPixelCharacter(c,portrayal.hideBeard?{...style,beard:false}:style,x,y,{scale:3*(portrayal.scale||1),direction:pos.direction,interaction:portrayal.lie?{...state.pose,lie:true,recline:1}:portrayal.sit?{...state.pose,sit:true}:state.pose,walkFrame:state.walkFrame,expression:state.expression});
  c.fillStyle='#fff3cd';c.textAlign='center';c.font='13px DungGeunMo,monospace';c.fillText(caption(n.name),pos.x,288);
 });
 if(portable&&plan.motif!=='baptism'&&!(['sling','arrow'].includes(sample.plan.effect)&&sample.index>=4))drawProp(c,kind,propPosition,{angle:propAngle});
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
