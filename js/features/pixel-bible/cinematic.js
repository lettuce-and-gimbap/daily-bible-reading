import {drawEventActor} from './cinematic-actor.js';
import {characterStyle,drawWorldObject} from './art.js';
// Event-stage animation uses an independent canvas and human proportions.
export function mountCinematic(host,scene,actors){
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=300;canvas.setAttribute('aria-label',scene.title+' 사건 애니메이션');canvas.style.cssText='width:100%;max-height:42vh;object-fit:contain;image-rendering:pixelated;background:#253943';host.prepend(canvas);
 const c=canvas.getContext('2d');let frame,closed=false,start=performance.now();
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const story=scene.title+' '+scene.lines.join(' ');
 const pose=scene.object==='bed'&&actors.length===1?'lie':/무릎|기도|간청/.test(story)?'kneel':/활|화살/.test(story)?'shoot':/치자|치다|겉옷/.test(story)?'strike':/붓|기름|소금|가루/.test(story)?'pour':'speak';
 function draw(now){if(closed||!canvas.isConnected)return;const t=Math.floor((now-start)/125)/8;c.clearRect(0,0,720,300);
 rect(0,0,720,220,'#728987');rect(0,220,720,80,'#b5a882');
 const water=/요단|물|강|도끼/.test(scene.title+' '+scene.lines.join(' '));
 if(water){rect(0,236,720,64,'#487f95');for(let i=0;i<18;i++)rect((i*47+t*12)%720,246+i%3*15,22,2,'#a9d0cc');}
 actors.filter(Boolean).forEach((n,i)=>{const x=actors.length===1?300:150+i*420/Math.max(1,actors.length-1),y=218,side=i%2?-1:1,beat=Math.sin(t*3+i),skin='#e4bd92',coat=['#70668a','#97744f','#628473','#9a5850'][i%4];
 drawEventActor(c,n,i,{x,y,time:t,pose,face:i%2?-1:1});
 c.fillStyle='#fff3cd';c.font='14px monospace';c.textAlign='center';c.fillText(n.name,x,275);
 });
 if(scene.object){c.save();c.translate(390,220);c.scale(.8,.8);drawWorldObject(c,{kind:scene.object,x:0,y:0},1,Math.floor(t*2)%4);c.restore();}
 if(water&&/갈라/.test(story)){const gap=Math.round(Math.min(1,t/3)*90);rect(360-gap,236,gap*2,64,'#b5a882');}
 frame=requestAnimationFrame(draw);}
 frame=requestAnimationFrame(draw);return ()=>{closed=true;cancelAnimationFrame(frame);canvas.remove();};
}
