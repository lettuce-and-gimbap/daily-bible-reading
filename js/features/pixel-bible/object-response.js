import {physiqueFor} from './physique.js';
import {objectBehavior} from './object-behavior.js';
import {OBJECT_CATALOG} from './object-catalog.js';
import {interactionPose} from './interaction-motion.js';
const SCALES={tree:4.4,plant:3.6,building:3.8,boat:3.2,field:3,well:3,bench:2.8,seat:2.8,bush:2.8,altar:2.7,stone:2.1,water:1.9,oil:1.5,vessel:1.7,scroll:1.8,book:1.8,food:1.5,instrument:1.7,lamp:1.5,chest:2.8,tent:3.8,cart:3.2,wear:1.7,staff:1.5,shield:1.7,basket:1.8,symbol:2.8,crop:3,weapon:1.7,tool:1.6,cloth:1.9,treasure:1.3,animal:2.6};
export function objectPresentation(kind){
 const d=OBJECT_CATALOG[kind]||{action:kind,family:kind};
 const category=d.family||d.action;
 let scale=SCALES[kind]||SCALES[category]||SCALES[d.action]||2;
 if(kind==='mat')scale=2.4;
 if(['salt-bowl','flour-bowl','oil-vessel'].includes(kind))scale=1.3;
 if(['fig-poultice','alabaster-jar'].includes(kind))scale=1;
 if(kind==='writing-tablet')scale=1.1;
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
 const direction=n.direction==='left'?-1:n.direction==='right'?1:n.x<o.x?-1:1,beat=reduced?0:pose.phase===1?-1:pose.phase===2?1:0;
 const portable=base.portable;
 return {...base,kind:o.kind,liquidColor:pose.actual==='water-wine'&&use?'#965e83':null,active:true,time,reduced,phase:pose.phase,gesture:pose.gesture,actual:pose.actual,pose,actor:n,direction,
  dx:portable&&use?direction*3:0,dy:portable&&use?-3:pose.prop==='boat'?beat:0,
  squash:['bench','bed'].includes(pose.prop)&&use?.035:0,
  tilt:pose.prop==='tree'&&['shake','kick','bonk'].includes(pose.gesture)&&use?beat*.045:pose.gesture==='pour'&&use&&portable?direction*.32:pose.prop==='animal'?beat*.025:['shake-cloth','spread'].includes(pose.gesture)&&use&&OBJECT_CATALOG[o.kind]?.family==='cloth'?beat*.08:portable?beat*.045:0,
  open:['read','unroll','spread','mend','fold'].includes(pose.gesture)&&use?.22:0,
  clothWave:OBJECT_CATALOG[o.kind]?.family==='cloth'&&['spread','shake-cloth','fold','smooth'].includes(pose.gesture)&&use?Math.floor(pose.within*4)+1:0,
  lid:pose.prop==='chest'&&pose.gesture==='open'&&use?1:0,beat,use};
}
// 배치된 휴대 소품 자체를 집어 든다. 내려놓는 단계에서는 바닥에 다시 표시한다.
export function heldObject(n,time,reduced=false,tile=24){
 const o=n.usingObject;if(n.creature||!o||!n.interaction)return null;
 const p=interactionPose(n.interaction,time-(n.interactionStart||0),reduced);
 if(p.scripted&&(['chain-open','net-catch'].includes(p.actual)||['reed-float','axe-float','fig-paste'].includes(p.actual)&&p.eventBeat>=3))return null;
 if(p.gesture==='drink'&&o.kind!=='cup')return null;
 if(['rope','hook'].includes(o.kind)||(['write','trace','dip'].includes(p.actual)&&['pen','ink'].includes(o.kind))||!objectBehavior(o.kind).carry||p.wearing||(['arrow','bow'].includes(o.kind)&&p.archery)||['lie-stone','five-stones','water-wine','tear-garment'].includes(p.actual)||(['cast-mantle','break-share'].includes(p.actual)&&[1,2].includes(p.phase))||(['shoot','three-arrows','staff-snake','cast-mantle'].includes(p.actual)&&p.phase===2))return null;
 const a=interactionAnchor(n,tile),dir=n.direction==='left'?-1:1;
 const side=n.direction==='left'||n.direction==='right';
 const progress=p.scripted?p.within:reduced?.5:((time-(n.interactionStart||0))/n.interaction.period+n.interaction.phase)*4%1;
 const stepped=Math.floor(progress*8)/8;
 const eased=stepped*stepped*(3-2*stepped),transfer=p.scripted?Math.max(0,Math.min(1,p.eventProgress*4,(1-p.eventProgress)*4)):reduced?1:p.phase===0?eased:p.phase===3?1-eased:1;
 let tx=(a.x+(side?dir*(14+(p.handX||0)*2):8+(p.handX||0)*2)+p.bodyX*2)/tile,ty=(a.y+(p.handY-36)*2+p.bodyY*2+(p.gesture==='drink'?6:OBJECT_CATALOG[o.kind]?.family==='instrument'?18:5))/tile;
 const playing=['lyre','harp','tambourine','cymbal'].includes(o.kind)&&['strum','play','pluck','beat','tap','tune','hold'].includes(p.actual);
 if(playing){tx=(a.x+(side?dir*19:18)+p.bodyX*2)/tile;ty=(a.y-7+p.bodyY*2)/tile;}
 const shape=physiqueFor(n.name,n.role,n.refs);tx=a.x/tile+(tx-a.x/tile)*shape.width;ty=a.y/tile+(ty-a.y/tile)*shape.height;
 const originalScale=objectPresentation(o.kind).scale;
 return {kind:o.kind,x:Math.round((o.x+(tx-o.x)*transfer)*tile)/tile,y:Math.round((o.y+(ty-o.y)*transfer)*tile)/tile,
  frame:{scale:originalScale,clothWave:OBJECT_CATALOG[o.kind]?.family==='cloth'&&['spread','shake-cloth','fold','smooth'].includes(p.gesture)&&[1,2].includes(p.phase)?Math.floor(p.within*4)+1:0,tilt:playing?0:(Number.isFinite(p.toolAngle)?dir*p.toolAngle:heldTilt(p,dir,eased))*transfer,held:true,
   open:['read','unroll','spread'].includes(p.gesture)?(p.phase===2?.25:.1):0,
   squash:['fold','smooth','wrap'].includes(p.gesture)&&p.phase===2?.3:0,bite:p.gesture==='eat'&&p.phase===2},pose:p};
}
// Keep the tool angle continuous across beat boundaries, with eight pixel-art ticks.
function heldTilt(p,dir,f){
 const angles=['swing','thrust'].includes(p.gesture)?[0,-.9,.9,0]:
  p.gesture==='drink'?[0,0,-.55,0]:p.gesture==='pour'?[0,0,.8,0]:
  ['practice','use','wipe','polish','tap','strum','play','mend','cast','reins','row','back-row','stamp','roll-seal','unlock','turn-key'].includes(p.gesture)?[0,-.2,.2,0]:
  p.gesture==='blow'?[0,-.12,-.12,0]:[0,0,0,0];
 return dir*(angles[p.phase]+(angles[(p.phase+1)%4]-angles[p.phase])*f);
}
export function drinkingCup(n,pose,x,y){
 if(pose.gesture!=='drink'||n.usingObject?.kind==='cup')return null;
 const side=n.direction==='left'||n.direction==='right',dir=n.direction==='left'?-1:1;
 const lift=pose.phase===0?pose.within:pose.phase===3?1-pose.within:1;
 const cy=y+(pose.handY-36)*2+6;
 return {kind:'cup',x:(x+(side?dir*13:6))/24,y:(y-12+(cy-(y-12))*lift)/24,frame:{scale:.65,held:true,tilt:pose.phase===2?-dir*.25*Math.sin(Math.PI*pose.within):0}};
}
export function objectWorn(n,time,reduced=false){if(!n?.interaction)return false;const p=interactionPose(n.interaction,time-(n.interactionStart||0),reduced);return (p.scripted&&(['chain-open','net-catch'].includes(p.actual)||['reed-float','axe-float','fig-paste'].includes(p.actual)&&p.eventBeat>=3))||(p.hand&&['rope','hook'].includes(n.usingObject?.kind))||(p.hand&&['pen','ink'].includes(n.usingObject?.kind)&&['write','trace','dip'].includes(p.actual))||p.wearing||(p.hand&&['arrow','bow'].includes(n.usingObject?.kind)&&p.archery)||(['cast-mantle','break-share'].includes(p.actual)&&[1,2].includes(p.phase))||(['shoot','three-arrows','staff-snake','cast-mantle'].includes(p.actual)&&p.phase===2);}
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
  if(frame.actual==='bonk'&&frame.phase===2){rect(7*s,(-12+frame.phase)*s,3*s,3*s,'#d99b53');rect(10*s,(-6+frame.phase)*s,2*s,2*s,'#d99b53');}
  if(frame.gesture==='fruit'&&frame.use){rect((frame.direction*8+b)*s,-11*s,3*s,4*s,'#d99b53');rect((frame.direction*8+1+b)*s,-13*s,1,2,'#71945e');}
 } else if(category==='scroll'||category==='book'){
  if(frame.use){rect(-4*s,-8*s,8*s,1,'#a7905e');if(frame.gesture==='write')rect((frame.phase-2)*s,-6*s,3*s,1,'#70563e');}
 } else if(category==='boat'){
  for(let i=0;i<2;i++)rect((-9+i*12+b)*s,5*s,7*s,2,'#8fced2');
 } else if(category==='instrument'&&frame.use){
  for(let i=0;i<2;i++)rect((7+i*4)*s,(-15-i*3+b)*s,2,3,'#f5df91');
 } else if(category==='food'&&frame.use){
  if(['break','share','offer'].includes(frame.gesture)){
   for(let i=0;i<3;i++)rect((frame.direction*(3+i*3)+b)*s,(-5-i%2)*s,2,2,'#ecd59a');
  }else if(frame.gesture==='eat'){
   rect((-2+b)*s,-4*s,5*s,4*s,'#ecd59a');
   if(frame.phase===2)rect((frame.direction>0?-2:1)*s,-4*s,2*s,2*s,'#806b53');
  }else for(let i=0;i<3;i++)rect((-3+i*3+b)*s,(-4-i%2)*s,2,2,'#ecd59a');
 } else if(category==='animal'&&frame.use){
  rect((7+b)*s,-7*s,2,4,'#dfc593');
  if(frame.gesture==='feed'){rect(frame.direction*8*s,-4*s,3,2,'#d9c47c');rect(frame.direction*7*s,-2*s,2,2,'#d9c47c');}
  if(['care','guide'].includes(frame.gesture))rect((frame.direction*5+b)*s,-10*s,4,2,'#f2d5af');
 } else if(category==='lamp'){
  if(frame.use){const flare=frame.kind==='fire'&&['fan','tend'].includes(frame.gesture)?2:0;rect((-s-flare)*1,(-13+b-flare)*s,(2+flare)*s,(3+flare)*s,'#f3d877');rect(0,(-12-flare)*s,s,(2+flare)*s,'#e89e54');if(frame.kind==='fire'&&frame.gesture==='shield')rect(-5*s,-15*s,2*s,6*s,'#d7c69f');}
 } else if(category==='chest'&&frame.use){
  rect(-8*s,-14*s,16*s,2*s,'#c4a46f');rect(-7*s,-11*s,14*s,2*s,'#463b32');
 } else if(category==='cloth'||category==='wear'){
  if(frame.use){rect((-4+b)*s,-6*s,8*s,1,'#f3e4c2');rect((3-b)*s,-5*s,1,3*s,'#b79e83');}
 } else if(category==='net'&&frame.use){
  for(let i=0;i<3;i++){rect((-7+i*5+b)*s,-9*s,1,9*s,'#d4c4a0');rect(-7*s,(-8+i*3)*s,15*s,1,'#d4c4a0');}
 } else if(['tool','weapon','treasure','basket'].includes(category)&&frame.use){
  rect((frame.direction*3+b)*s,-8*s,2,2,'#f6e3b2');rect((frame.direction*3-b)*s,-3*s,2,1,'#d4bd8e');
 } else if(category==='cooking'&&frame.use){
  // 솥 젓기와 화덕 돌보기·빵 꺼내기를 분리해 물건 쓰임에 맞춘다.
  if(frame.kind==='oven'&&frame.gesture==='fan'){
   for(let i=0;i<3;i++)rect((-7+i*4+b*2)*s,(-12+i*2)*s,3*s,1,'#e5bd70');
   rect(-s,-15*s,2*s,4*s,'#f3d877');
  }else if(frame.kind==='oven'&&frame.gesture==='take-bread'){
   rect((frame.direction*4+b)*s,-9*s,6*s,3*s,'#d49b57');rect((frame.direction*5+b)*s,-10*s,3*s,1,'#f0ca83');
  }else if(frame.gesture==='tend'){
   rect((frame.direction*3+b)*s,-13*s,1.5,12*s,'#b99a6f');
  }else if(frame.gesture==='inspect'){
   for(let i=0;i<2;i++)rect((-3+i*5+b)*s,(-13-i*4-frame.phase)*s,2,3,'#eee2c9');
  }else{
   rect((b*3)*s,-10*s,1.5,9*s,'#b99a6f');
   for(let i=0;i<2;i++)rect((-3+i*5+b)*s,(-13-i*4-frame.phase)*s,2,3,'#eee2c9');
  }
 } else if(category==='table'&&frame.use){
  // 닦을 때는 천, 차릴 때는 상 위 그릇/양식이 손을 따라 움직인다.
  if(frame.gesture==='wipe')rect((-4+b*3)*s,-5*s,7*s,2,'#e9dbc0');
  else {rect((-5+b)*s,-6*s,5*s,2*s,'#d9bf83');rect((3-b)*s,-6*s,4*s,2,'#eee2bd');}
 } else if(category==='bed'&&frame.use){
  if(frame.pose.lie){rect((-8+b)*s,-5*s,7*s,3*s,'#efe5c5');rect((2-b)*s,-4*s,7*s,4*s,'#b4c5bd');}
  else {rect((-7+b)*s,-3*s,14*s,2,'#c6ceb2');rect((-6+b)*s,-2*s,12*s,1,'#edf0d3');}
 } else if(category==='rope'&&frame.use){
  if(['coil','uncoil'].includes(frame.gesture)){
   for(let i=0;i<3;i++)rect((-4+i*3+b)*s,(i%2?2:0)*s,4*s,1,'#c5a16b');
  }else if(['tie','untie'].includes(frame.gesture)){
   rect(-2*s,-7*s,1,10*s,'#b9915c');rect(1*s,-6*s,1,9*s,'#d0ae79');rect(-3*s,-2*s,7*s,1,'#b9915c');
  }else{
   const length=frame.actual==='lower-rope'?20+frame.phase*5:frame.gesture==='pull'?15-frame.phase*2:13;
   rect(-1,-12*s,1,Math.round(length*s),'#b9915c');
   if(frame.actual==='lower-rope'||frame.gesture==='pull')rect(-3*s,(-12+length)*s,5*s,3*s,'#98744d');
  }
 } else if(category==='weapon'&&frame.use){
  if(frame.pose.archery){
   if(frame.phase===1){rect(frame.direction*5*s,-10*s,2*s,8*s,'#d5b776');rect(frame.direction*4*s,-9*s,1,6*s,'#eee0b2');}
   if(frame.pose.shot){
    const rise=frame.actual==='high-shot'?-9:frame.actual==='low-shot'?3:0;
    rect(frame.direction*(9+b*2)*s,(-8+rise)*s,8*s,1,'#d8c38d');rect(frame.direction*(16+b*2)*s,(-9+rise)*s,2*s,1,'#eee4c4');
   }
  }else if(['swing','thrust','practice'].includes(frame.gesture)){
   rect(frame.direction*6*s,-11*s,2*s,8*s,'#c3a56d');rect(frame.direction*5*s,-11*s,4*s,1,'#e4d2a5');
  }else rect(frame.direction*5*s,-6*s,2*s,2,'#f6e3b2');
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
