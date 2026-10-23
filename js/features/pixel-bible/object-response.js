import {OBJECT_CATALOG} from './object-catalog.js';
import {interactionPose} from './interaction-motion.js';
const SCALES={tree:4.4,plant:3.6,building:3.8,boat:3.2,field:3,well:3,bench:2.8,seat:2.8,bush:2.8,altar:2.7,stone:2.1,water:1.9,oil:1.5,vessel:1.7,scroll:1.8,book:1.8,food:1.5,instrument:1.7,weapon:1.7,tool:1.6,cloth:1.9,treasure:1.3,animal:2.6};
export function objectPresentation(kind){
 const d=OBJECT_CATALOG[kind]||{action:kind,family:kind};
 const category=d.family||d.action;
 let scale=SCALES[kind]||SCALES[category]||SCALES[d.action]||2;
 if(['cup','flask','oil','perfume','coin','pearl','seed','mustard','salt','pen','nail'].includes(kind))scale=1.2;
 if(['palm','cedar','ark-noah','tower'].includes(kind))scale=4;
 return {scale,category,portable:['vessel','book','food','instrument','weapon','tool','cloth','treasure','net','basket'].includes(category)||['water','oil','scroll','stone'].includes(kind)};
}
// 그리는 위치만 가까이 맞춘다. 저장된 좌표와 이동 경로는 바꾸지 않는다.
export function interactionAnchor(n,tile=24){
 if(!n.usingObject||!n.interaction)return {x:n.x*tile,y:n.y*tile};
 const o=n.usingObject,dx=n.x-o.x,dy=n.y-o.y;
 if(['bench','boat'].includes(n.interaction.category))return {x:o.x*tile+(dx?Math.sign(dx)*8:0),y:o.y*tile+5};
 if(n.objectAction==='zacchaeus-tree')return {x:o.x*tile+12,y:o.y*tile-12};
 const near=objectPresentation(o.kind).portable?18:23;
 if(Math.abs(dx)>=Math.abs(dy))return {x:o.x*tile+(dx<0?-near:near),y:o.y*tile+3};
 return {x:o.x*tile,y:o.y*tile+(dy<0?-12:14)};
}
export function objectInteractionFrame(o,npcs,time,reduced=false){
 const base=objectPresentation(o.kind),n=npcs.find(n=>n.usingObject===o&&n.interaction);
 if(!n)return {...base,active:false,dx:0,dy:0,tilt:0,open:0};
 const pose=interactionPose(n.interaction,time-(n.interactionStart||0),reduced),use=pose.phase===1||pose.phase===2;
 const direction=n.x<o.x?-1:1,beat=reduced?0:pose.phase===1?-1:pose.phase===2?1:0;
 const portable=base.portable;
 return {...base,active:true,phase:pose.phase,gesture:pose.gesture,pose,actor:n,direction,
  dx:portable&&use?direction*3:0,dy:portable&&use?-3:pose.prop==='boat'?beat:0,
  squash:pose.prop==='bench'&&use?.035:0,
  tilt:pose.gesture==='pour'&&use?direction*.32:portable?beat*.045:0,
  open:['read','unroll','spread','mend','fold'].includes(pose.gesture)&&use?.22:0,beat,use};
}
export function drawObjectResponse(c,o,frame,tile=24){
 if(!frame?.active)return;
 const x=o.x*tile,y=o.y*tile,s=frame.scale,b=frame.beat;
 const rect=(xx,yy,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x+xx),Math.round(y+yy),w,h);};
 c.save();
 const category=frame.pose.prop;
 if(['water','well','oil'].includes(category)){
  const blue=category==='oil'?'#e3c066':'#91d5e3';
  if(category==='well'){
   const rope=18+frame.phase*4;
   rect(-s,-18*s,1.5,rope, '#bda178');rect(-3*s,-18*s+rope,6*s,4*s,'#956c48');
  }
  rect(-3*s,-6*s,6*s,1.5,blue);
  if(frame.use){rect((-2+b)*s,(-8+b)*s,2,2,'#e7fbff');
   if(['pour','fill','scoop','wash','bucket','rope'].includes(frame.gesture)){
    for(let i=0;i<3;i++)rect((4+i%2)*s,(-7+i*3+frame.phase)*s,2,3,blue);
   }
  }
 } else if(category==='field'&&frame.use){
  // 사용 지점의 이삭이 기울고 옆에 작은 묶음이 모인다.
  rect((frame.direction*8+b)*s,-5*s,2*s,6*s,'#cfab62');rect((frame.direction*8-2)*s,-6*s,6*s,2*s,'#f0d087');
 } else if(category==='tree'){
  if(frame.use){rect((5+b)*s,-18*s,2*s,s,'#a0c087');rect((-6-b)*s,-14*s,s,2*s,'#8db276');}
 } else if(category==='scroll'||category==='book'){
  if(frame.use){rect(-4*s,-8*s,8*s,1,'#a7905e');if(frame.gesture==='write')rect((frame.phase-2)*s,-6*s,3*s,1,'#70563e');}
 } else if(category==='boat'){
  for(let i=0;i<2;i++)rect((-9+i*12+b)*s,5*s,7*s,2,'#8fced2');
 } else if(category==='instrument'&&frame.use){
  for(let i=0;i<2;i++)rect((7+i*4)*s,(-15-i*3+b)*s,2,3,'#f5df91');
 } else if(category==='food'&&frame.use){
  for(let i=0;i<3;i++)rect((-3+i*3+b)*s,(-4-i%2)*s,2,2,'#ecd59a');
 } else if(category==='animal'&&frame.use){
  rect((7+b)*s,-7*s,2,4,'#dfc593');
 } else if(frame.use){
  // 단단한 물건은 변형 대신 손이 닿는 지점을 밝게 표시한다.
  rect(frame.direction*5*s,-6*s,2,2,'#e2cf99');
 }
 c.restore();
}
