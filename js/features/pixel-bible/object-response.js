import {objectBehavior} from './object-behavior.js';
import {OBJECT_CATALOG} from './object-catalog.js';
import {interactionPose} from './interaction-motion.js';
const SCALES={tree:4.4,plant:3.6,building:3.8,boat:3.2,field:3,well:3,bench:2.8,seat:2.8,bush:2.8,altar:2.7,stone:2.1,water:1.9,oil:1.5,vessel:1.7,scroll:1.8,book:1.8,food:1.5,instrument:1.7,lamp:1.5,chest:2.8,tent:3.8,cart:3.2,wear:1.7,staff:1.5,shield:1.7,basket:1.8,symbol:2.8,crop:3,weapon:1.7,tool:1.6,cloth:1.9,treasure:1.3,animal:2.6};
export function objectPresentation(kind){
 const d=OBJECT_CATALOG[kind]||{action:kind,family:kind};
 const category=d.family||d.action;
 let scale=SCALES[kind]||SCALES[category]||SCALES[d.action]||2;
 if(kind==='mat')scale=2.4;
 if(['cloak','robe','linen','sackcloth','ephod','armor'].includes(kind))scale=.95;
 if(['helmet','crown','breastplate','sandal','belt','signet'].includes(kind))scale=.8;
 if(['cup','flask','oil','perfume','coin','pearl','seed','mustard','salt','pen','nail'].includes(kind))scale=1.2;
 if(['palm','cedar','ark-noah','tower'].includes(kind))scale=4;
 return {scale,category,portable:objectBehavior(kind).carry};
}
// 큰 식물 뒤로 접근하지 않는다. 경로와 드롭 모두 같은 접근 규칙을 쓴다.
export function interactionApproaches(o){
 const profile=objectPresentation(o.kind);
 const offsets=profile.portable?[[-1,0],[1,0]]:objectBehavior(o.kind).frontOnly?[[-1,0],[1,0],[0,1]]:[[-1,0],[1,0],[0,1],[0,-1]];
 return offsets.map(([dx,dy])=>({x:o.x+dx,y:o.y+dy}));
}
// 그리는 위치만 가까이 맞춘다. 저장된 좌표와 이동 경로는 바꾸지 않는다.
export function interactionAnchor(n,tile=24){
 if(n.creature?.kind==='plant'||!n.usingObject||!n.interaction)return {x:n.x*tile,y:n.y*tile};
 const o=n.usingObject,dx=n.x-o.x,dy=n.y-o.y;
 if(n.interaction.category==='bed')return {x:o.x*tile,y:o.y*tile+14};
 if(n.interaction.gesture==='lie-stone')return {x:o.x*tile-38,y:o.y*tile+16};
 if(['bench','boat'].includes(n.interaction.category))return {x:o.x*tile+(dx?Math.sign(dx)*8:0),y:o.y*tile+5};
 if(n.objectAction==='zacchaeus-tree')return {x:o.x*tile+12,y:o.y*tile-12};
 const profile=objectPresentation(o.kind);
 // 수관 바깥에서 손을 뻗는다. 정면에서는 나무보다 앞에 그린다.
 if(!profile.portable&&objectBehavior(o.kind).frontOnly){
  const side=Math.abs(dx)>=Math.abs(dy);
  return {x:o.x*tile+(side?(dx<0?-1:1)*Math.round(profile.scale*12+12):0),y:o.y*tile+(side?8:24)};
 }
 const near=profile.portable?18:23;
 if(Math.abs(dx)>=Math.abs(dy))return {x:o.x*tile+(dx<0?-near:near),y:o.y*tile+3};
 return {x:o.x*tile,y:o.y*tile+(dy<0?-12:14)};
}
export function objectInteractionFrame(o,npcs,time,reduced=false){
 const base=objectPresentation(o.kind),n=npcs.find(n=>n.usingObject===o&&n.interaction);
 if(!n)return {...base,active:false,dx:0,dy:0,tilt:0,open:0};
 const pose=interactionPose(n.interaction,time-(n.interactionStart||0),reduced),use=pose.phase===1||pose.phase===2;
 const direction=n.x<o.x?-1:1,beat=reduced?0:pose.phase===1?-1:pose.phase===2?1:0;
 const portable=base.portable;
 return {...base,liquidColor:pose.actual==='water-wine'&&use?'#965e83':null,active:true,time,reduced,phase:pose.phase,gesture:pose.gesture,pose,actor:n,direction,
  dx:portable&&use?direction*3:0,dy:portable&&use?-3:pose.prop==='boat'?beat:0,
  squash:['bench','bed'].includes(pose.prop)&&use?.035:0,
  tilt:pose.prop==='tree'&&['shake','kick','bonk'].includes(pose.gesture)&&use?beat*.045:pose.gesture==='pour'&&use?direction*.32:pose.prop==='animal'?beat*.025:portable?beat*.045:0,
  open:['read','unroll','spread','mend','fold'].includes(pose.gesture)&&use?.22:0,
  lid:pose.prop==='chest'&&pose.gesture==='open'&&use?1:0,beat,use};
}
// 배치된 휴대 소품 자체를 집어 든다. 내려놓는 단계에서는 바닥에 다시 표시한다.
export function heldObject(n,time,reduced=false,tile=24){
 const o=n.usingObject;if(n.creature||!o||!n.interaction)return null;
 const p=interactionPose(n.interaction,time-(n.interactionStart||0),reduced);
 if(['rope','hook'].includes(o.kind)||(['write','trace','dip'].includes(p.actual)&&['pen','ink'].includes(o.kind))||!objectBehavior(o.kind).carry||!p.hand||p.wearing||(['arrow','bow'].includes(o.kind)&&p.archery)||['lie-stone','five-stones','water-wine','tear-garment'].includes(p.actual)||(['cast-mantle','break-share'].includes(p.actual)&&[1,2].includes(p.phase))||(['shoot','three-arrows','staff-snake','cast-mantle'].includes(p.actual)&&p.phase===2))return null;
 const a=interactionAnchor(n,tile),dir=n.direction==='left'?-1:1;
 const side=n.direction==='left'||n.direction==='right';
 const beat=p.phase===1?-1:1;
 const tilt=['swing','thrust'].includes(p.gesture)?dir*(p.phase===1?-.9:.9):p.gesture==='drink'&&p.phase===2?-dir*.9:p.gesture==='pour'&&p.phase===2?dir*.8:
  ['practice','use','wipe','polish','tap','strum','play','mend','cast','reins','swing','thrust','row','back-row','stamp','roll-seal','unlock','turn-key'].includes(p.gesture)?dir*beat*.2:
  p.gesture==='blow'?-dir*.12:0;
 return {kind:o.kind,x:(a.x+(side?dir*14:8)+p.bodyX*2)/tile,y:(a.y+(p.handY-36)*2+p.bodyY*2+5)/tile,
  frame:{scale:Math.min(objectPresentation(o.kind).scale,['cloak','robe','linen','sackcloth','ephod','armor'].includes(o.kind)?.65:.85),tilt,held:true,
   open:['read','unroll','spread'].includes(p.gesture)?(p.phase===2?.25:.1):0,
   squash:['fold','smooth','wrap'].includes(p.gesture)&&p.phase===2?.3:0,bite:p.gesture==='eat'&&p.phase===2},pose:p};
}
export function objectWorn(n,time,reduced=false){if(!n?.interaction)return false;const p=interactionPose(n.interaction,time-(n.interactionStart||0),reduced);return (p.hand&&['rope','hook'].includes(n.usingObject?.kind))||(p.hand&&['pen','ink'].includes(n.usingObject?.kind)&&['write','trace','dip'].includes(p.actual))||p.wearing||(p.hand&&['arrow','bow'].includes(n.usingObject?.kind)&&p.archery)||(['cast-mantle','break-share'].includes(p.actual)&&[1,2].includes(p.phase))||(['shoot','three-arrows','staff-snake','cast-mantle'].includes(p.actual)&&p.phase===2);}
export function drawObjectResponse(c,o,frame,tile=24){
 if(!frame?.active)return;
 const held=heldObject(frame.actor,frame.time,frame.reduced,tile);
 const x=held?held.x*tile:o.x*tile,y=held?held.y*tile:o.y*tile,s=held?held.frame.scale:frame.scale,b=frame.beat;
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
  if(frame.gesture==='feed'){rect(frame.direction*8*s,-4*s,3,2,'#d9c47c');rect(frame.direction*7*s,-2*s,2,2,'#d9c47c');}
  if(['care','guide'].includes(frame.gesture))rect((frame.direction*5+b)*s,-10*s,4,2,'#f2d5af');
 } else if(category==='lamp'){
  if(frame.use){rect(-s,(-13+b)*s,2*s,3*s,'#f3d877');rect(0,-12*s,s,2*s,'#e89e54');}
 } else if(category==='chest'&&frame.use){
  rect(-8*s,-14*s,16*s,2*s,'#c4a46f');rect(-7*s,-11*s,14*s,2*s,'#463b32');
 } else if(category==='cloth'||category==='wear'){
  if(frame.use){rect((-4+b)*s,-6*s,8*s,1,'#f3e4c2');rect((3-b)*s,-5*s,1,3*s,'#b79e83');}
 } else if(category==='net'&&frame.use){
  for(let i=0;i<3;i++){rect((-7+i*5+b)*s,-9*s,1,9*s,'#d4c4a0');rect(-7*s,(-8+i*3)*s,15*s,1,'#d4c4a0');}
 } else if(['tool','weapon','treasure','basket'].includes(category)&&frame.use){
  rect((frame.direction*3+b)*s,-8*s,2,2,'#f6e3b2');rect((frame.direction*3-b)*s,-3*s,2,1,'#d4bd8e');
 } else if(category==='cooking'&&frame.use){
  // 솥과 화덕은 들어 마시지 않는다. 손의 젓기와 증기를 같은 박자로 그린다.
  rect((b*3)*s,-10*s,1.5,9*s,'#b99a6f');
  for(let i=0;i<2;i++)rect((-3+i*5+b)*s,(-13-i*4-frame.phase)*s,2,3,'#eee2c9');
 } else if(category==='table'&&frame.use){
  // 닦을 때는 천, 차릴 때는 상 위 그릇/양식이 손을 따라 움직인다.
  if(frame.gesture==='wipe')rect((-4+b*3)*s,-5*s,7*s,2,'#e9dbc0');
  else {rect((-5+b)*s,-6*s,5*s,2*s,'#d9bf83');rect((3-b)*s,-6*s,4*s,2,'#eee2bd');}
 } else if(category==='bed'&&frame.use){
  rect((-7+b)*s,-3*s,14*s,2,'#c6ceb2');rect((-6+b)*s,-2*s,12*s,1,'#edf0d3');
 } else if(category==='cart'&&frame.use){
  rect((-5+b)*s,-6*s,10*s,1,'#c3a77b');
  rect(-8*s,2*s,2*s,1,'#e0c793');rect(6*s,(1+b)*s,2*s,1,'#e0c793');
 } else if(['building','symbol'].includes(category)&&frame.use){
  rect(frame.direction*6*s,-5*s,3,2,'#ddc994');
 } else if(frame.use){
  // 단단한 물건은 변형 대신 손이 닿는 지점을 밝게 표시한다.
  rect(frame.direction*5*s,-6*s,2,2,'#e2cf99');
 }
 c.restore();
}
