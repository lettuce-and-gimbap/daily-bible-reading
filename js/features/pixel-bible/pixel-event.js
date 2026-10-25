import {characterStyle,drawPixelCharacter,drawWorldObject} from './art.js';
import {directionFor} from './cinematic-scenes.js';
import {eventRoutine,scriptedPose} from './scripted-events.js';
export const EVENT_STEPS=['상황','준비','준비','다가가기','행동','행동','행동','결과','결과','반응','반응','마무리'];
// A single twelve-beat action; the final pose stays still instead of restarting.
export function pixelEventFrame(scene,person,index,seconds){
 const d=directionFor(scene),beat=Math.min(11,Math.floor(Math.max(0,seconds)*1.5)),active=index===d.lead;
 const routine=eventRoutine(scene,person);
 let pose=routine?scriptedPose(routine,Math.min(5.6,Math.max(0,seconds-1))):null;
 if(!pose&&active&&beat>=2){const reach=[0,0,0,1,3,5,7,5,3,1,0,0][beat];pose={bodyX:0,bodyY:0,hand:reach?1:0,handY:26-Math.floor(reach/2),handX:reach,phase:Math.min(3,Math.floor(beat/3)),within:0};
 if(d.pose==='lie')pose={...pose,lie:true,recline:1};
 if(d.pose==='kneel')pose={...pose,bend:2,bodyY:2,handY:25};
 if(d.pose==='shoot')pose={...pose,archery:true,phase:beat<5?0:beat<7?1:beat<9?2:3};
 if(d.pose==='read')pose={...pose,hand:1,handY:24,handX:2};
 if(d.pose==='strike')pose={...pose,handY:[27,27,25,22,18,17,29,30,27,27,27,27][beat]};
 }
 return {beat,label:EVENT_STEPS[beat],pose,active,walkFrame:beat===3?1:0,expression:beat>=8?(d.emotion==='joy'?'happy':d.emotion==='sorrow'?'sad':d.emotion==='fear'?'surprised':'neutral'):'neutral'};
}
export function mountPixelEvent(host,scene,actors,{portrait=false}={}){
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=300;canvas.style.cssText='width:100%;max-height:42vh;image-rendering:pixelated;object-fit:contain';canvas.setAttribute('aria-label',scene.title+' 픽셀 사건 재생');host.prepend(canvas);
 const c=canvas.getContext('2d');let frame,disposed=false,start=performance.now(),paused=false,pauseAt=0;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 function draw(now){if(disposed||!canvas.isConnected)return;const elapsed=((paused?pauseAt:now)-start)/1000,progress=Math.min(1,elapsed/6),d=directionFor(scene),people=actors.filter(Boolean);
 r(0,0,720,300,'#80956e');r(0,200,720,100,'#b4aa7f');for(let i=0;i<22;i++)r(i*37%720,205+i%5*18,7,3,'#d0c499');
 if(['chamber','court','temple'].includes(d.setting)){r(0,0,720,200,'#9c9078');for(let j=0;j<7;j++)for(let i=0;i<15;i++)r(i*51+j%2*25,j*29,48,26,'#a79c85');r(310,35,100,90,'#617b7a');}
 const river=['river','spring','valley'].includes(d.setting);if(river){r(0,215,720,85,'#528b9d');for(let i=0;i<25;i++)r((i*32+Math.floor(elapsed*4))%720,230+i%4*17,17,2,'#a3c9cb');if(d.effect==='divide'){const gap=progress*85;r(360-gap,215,gap*2,85,'#b4aa7f');}}
 if(!portrait&&scene.object)drawWorldObject(c,{kind:scene.object,x:360,y:215},1,0);
 people.forEach((n,i)=>{const state=pixelEventFrame(scene,n,i,elapsed),x=people.length===1?280:160+i*400/Math.max(1,people.length-1),y=215;
 c.save();if(portrait){c.translate(x,290);c.scale(2,2);c.translate(-x,-y);}
 drawPixelCharacter(c,characterStyle(n.name,i,n.role,n.refs||[],n.creature||false),x,y,{scale:portrait?3:3,direction:portrait?'down':i%2?'left':'right',interaction:state.pose,walkFrame:state.walkFrame,expression:state.expression});c.restore();
 c.fillStyle='#fff3cd';c.font='14px DungGeunMo,monospace';c.textAlign='center';c.fillText(n.name,x,280);
 });
 if(!portrait){if(['salt','flour','oil'].includes(d.effect)&&elapsed>=2&&elapsed<5)for(let i=0;i<9;i++)r(330+i%3*6,155+(elapsed*12+i*5)%50,3,3,d.effect==='oil'?'#dfbe67':'#f2e7c9');if(d.effect==='axe')drawWorldObject(c,{kind:'axe',x:400,y:255-progress*35},1,0);c.fillStyle='#fff3cd';c.font='13px DungGeunMo,monospace';c.textAlign='left';c.fillText(EVENT_STEPS[Math.min(11,Math.floor(elapsed*1.5))],12,22);}
 frame=requestAnimationFrame(draw);}
 frame=requestAnimationFrame(draw);const dispose=()=>{disposed=true;cancelAnimationFrame(frame);canvas.remove();};dispose.setPaused=value=>{if(value===paused)return;if(value)pauseAt=performance.now();else start+=performance.now()-pauseAt;paused=value;};return dispose;
}
