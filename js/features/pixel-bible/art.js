import {drawEventArms} from './event-animation/rig.js';
import {drawPhysicalDetails} from './physical-traits.js';
import {drawWardrobe} from './wardrobe.js';
import {drawCreature} from './creature-art.js';
import {creatureForName} from './creatures.js';
import {garmentColor} from './garments.js';
import { drawFaceExpression } from './expression.js';
import { objectPresentation } from './object-response.js';
import { drawCatalogDetail } from './catalog-art.js';
import { OBJECT_CATALOG } from './object-catalog.js';
import { drawDirectionalCharacter } from './directions.js';
import { backgroundFor } from './backgrounds.js';
import { characterSpriteFrame } from './character-motion.js';
// 큰 도트의 귀여운 SD 비율. 작은 얼굴과 보이는 목으로 몸통 길이를 살린다.
import { APPEARANCES, appearanceFor } from "./appearance.js";
import {drawGimbap} from './gimbap-art.js';
import {drawFoodMascot} from './food-mascots.js';
export const CHARACTER_STYLES = Object.fromEntries(Object.entries(APPEARANCES).map(([k,s])=>[k,{...appearanceFor(s.name),...s}]));
export const characterStyle = (name,index,role,refs,creature=null)=>{if(name==='김밥')return {...appearanceFor(name,index,role,refs),gimbap:true,evidence:'PIXEL BIBLE 창작 길동무',design:'세밀한 64×64 도트 김밥 마스코트와 16프레임 구르기'};if(name==='상추'||name==='카라멜팝콘')return {...appearanceFor(name,index,role,refs),foodMascot:name,evidence:'PIXEL BIBLE 창작 길동무',design:`개성 있는 도트 ${name} 마스코트`};const d=creature===false?null:creature||creatureForName(name,role);return d?{...appearanceFor(name,index,role,refs),creature:d,evidence:'현재 본문에 언급된 '+d.name,design:'생물의 신체 특징에 맞춘 창작 픽셀 도안'}:appearanceFor(name,index,role,refs);};
// 네 방향·네 걷기 프레임을 원본 도트로 캐시한다. 실루엣 테두리도 같은 알파에서 만든다.
const spriteCache=new Map();
export function drawPixelCharacter(ctx,style,x,y,options={}) {
 const {scale=3,walk=0,action='',time=0,hanging=false,selected=false}=options;
 const motionOnly=options.motionOnly===true;
 const scaleX=scale*(style.creature?1:style.physique?.width||1),scaleY=scale*(style.creature?1:style.physique?.height||1);
 const renderX=Math.round(x-32*scaleX),renderY=Math.round(y-52*scaleY),renderWidth=Math.round(64*scaleX),renderHeight=Math.round(64*scaleY);
 const direction=hanging?'down':options.interaction?.lie?'down':options.interaction?.archery?(options.direction==='left'?'left':'right'):(options.direction||'down');
 const spriteFrame=characterSpriteFrame({motionOnly,walkFrame:options.walkFrame??(walk>.35?1:walk<-.35?3:0),action,interaction:options.interaction,expression:options.expression,baseExpression:options.baseExpression});
 const frame=spriteFrame.walkFrame;
 const step=[0,1,0,-1][frame%4];
 const pose=spriteFrame.interaction||null;
 const renderAction=OBJECT_CATALOG[spriteFrame.action]?.action||spriteFrame.action;
 let activeStyle=pose?{...style,staff:false,scroll:false,grain:false,grapes:false,net:false,lyre:false,tambourine:false}:style;
 if(pose?.wearing){
  const kind=pose.outfit,headgear=['crown','helmet','sandal','belt','breastplate'].includes(kind);
  activeStyle={...activeStyle,...(!headgear?{coat:garmentColor(kind),mantle:kind==='cloak',pattern:pose.actual==='wear-pattern',trim:'#dacb96'}:{}),
   crown:kind==='helmet'?false:kind==='crown'||activeStyle.crown,turban:['helmet','crown'].includes(kind)?false:activeStyle.turban,helmet:kind==='helmet',belt:kind==='belt'||activeStyle.belt,apron:kind==='ephod'||activeStyle.apron,plate:['armor','breastplate'].includes(kind),fur:kind==='sackcloth'||activeStyle.fur,sandal:kind==='sandal'};
 }
 const expression=spriteFrame.expression||'neutral';
 const rollFrame=options.rolling===true?((Math.floor(options.rollFrame??frame*4)%16)+16)%16:frame;
 const key=JSON.stringify([activeStyle,direction,pose?0:frame,renderAction,pose?{...pose,within:0}:null,expression,activeStyle.gimbap&&options.rolling===true?rollFrame:null]);let sprite=spriteCache.get(key);
 if(!sprite){
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const c=canvas.getContext('2d');
  if(activeStyle.gimbap){drawGimbap(c,rollFrame,{rolling:options.rolling===true&&!pose});}
  else if(activeStyle.foodMascot){drawFoodMascot(c,activeStyle.foodMascot,frame,direction);}
  else if(pose?.lie){c.translate(32,37);c.rotate(-Math.PI/2*(pose.recline??1));c.translate(-32,-37);}
  if(!activeStyle.gimbap&&!activeStyle.foodMascot&&activeStyle.creature)drawCreature(c,activeStyle.creature,32,52,{frame:pose?.dangling?Math.abs((pose.leftLeg||0)+(pose.rightArm||0))%4:frame,direction,pose,time,hanging:hanging||pose?.dangling});
  else if(!activeStyle.gimbap&&!activeStyle.foodMascot&&direction==='down')drawFrontCharacter(c,activeStyle,32,52,{scale:1,walk:pose?0:step,action:renderAction,facing:1,pose,expression});
  else if(!activeStyle.gimbap&&!activeStyle.foodMascot)drawDirectionalCharacter(c,activeStyle,32,52,{scale:1,step:pose?0:step,action:renderAction,direction,pose,expression});
  sprite={canvas};if(spriteCache.size>=4096)spriteCache.delete(spriteCache.keys().next().value);spriteCache.set(key,sprite);
 }
 if(options.hitTest){
  const px=Math.floor((options.hitTest.x-renderX)*64/renderWidth),py=Math.floor((options.hitTest.y-renderY)*64/renderHeight);
  if(px<0||py<0||px>=64||py>=64)return false;
  if(!sprite.pixels)sprite.pixels=sprite.canvas.getContext('2d').getImageData(0,0,64,64).data;
  // One source-dot tolerance covers nearest-neighbor rounding at fractional body scales.
  const padding=Math.max(1,Math.floor(options.hitPadding||0));
  for(let oy=-padding;oy<=padding;oy++)for(let ox=-padding;ox<=padding;ox++){
   const sx=px+ox,sy=py+oy;
   if(sx>=0&&sy>=0&&sx<64&&sy<64&&ox*ox+oy*oy<=padding*padding+1&&sprite.pixels[(sy*64+sx)*4+3]>128)return true;
  }
  return false;
 }
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(hanging){
  const motion=options.motion||{frequency:7,swing:.14,phase:0,key:'gentle'};
  const beat=time*motion.frequency+motion.phase;
  ctx.translate(x,y-33*scale);ctx.rotate(Math.sin(beat)*motion.swing);
  if(motion.key==='lively')ctx.translate(Math.round(Math.sin(beat/2)*scale),Math.round(Math.abs(Math.sin(beat))*scale));
  if(motion.key==='climber')ctx.translate(Math.round(Math.sin(beat)*scale),Math.round(-Math.abs(Math.sin(beat/2))*2*scale));
  if(motion.key==='steady'||motion.limp)ctx.translate(0,Math.round(Math.sin(beat/2)*scale*.5));
  ctx.translate(-x,-y+33*scale);
 }
 // Align the sprite origin to the final canvas pixel grid. Camera zoom can be
 // fractional; snapping only its translation prevents shimmer without changing
 // the sprite's scale, proportions, or source pixels.
 const transform=ctx.getTransform?.();let drawX=renderX,drawY=renderY;
 if(transform){
  const det=transform.a*transform.d-transform.b*transform.c;
  if(Math.abs(det)>1e-9){
   const sx=transform.a*renderX+transform.c*renderY+transform.e,sy=transform.b*renderX+transform.d*renderY+transform.f;
   const dx=Math.round(sx)-sx,dy=Math.round(sy)-sy;
   drawX+=(transform.d*dx-transform.c*dy)/det;drawY+=(-transform.b*dx+transform.a*dy)/det;
  }
 }
 if(selected){
  if(!sprite.outline){
   const mask=document.createElement('canvas');mask.width=64;mask.height=64;const m=mask.getContext('2d');
   const original=sprite.canvas.getContext('2d').getImageData(0,0,64,64), pixels=m.createImageData(64,64);
   for(let y=1;y<63;y++)for(let x=1;x<63;x++){
    if(original.data[(y*64+x)*4+3]>=128)continue;
    let near=false;for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]])if(original.data[((y+dy)*64+x+dx)*4+3]>=128)near=true;
    if(near){const i=(y*64+x)*4;pixels.data[i]=255;pixels.data[i+1]=226;pixels.data[i+2]=135;pixels.data[i+3]=255;}
   }
   m.putImageData(pixels,0,0);sprite.outline=mask;
  }
  const alpha=ctx.globalAlpha;ctx.globalAlpha*=.9;ctx.drawImage(sprite.outline,drawX,drawY,renderWidth,renderHeight);ctx.globalAlpha=alpha;
 }
 ctx.drawImage(sprite.canvas,drawX,drawY,renderWidth,renderHeight);ctx.restore();
}
function drawFrontCharacter(ctx, style, x, y, { scale = 3, walk = 0, action = "", facing = 1, time = 0, hanging = false, pose=null, expression="neutral" } = {}) {
  // 24×38 base sprite: head occupies 16×16; neck and longer torso remain visible.
  ctx.save();ctx.translate(Math.round(x-12*scale),Math.round(y-36*scale));ctx.scale(scale,scale);
  if(hanging){ctx.translate(12,1);ctx.rotate(Math.sin(time*7)*.14);ctx.translate(-12,-1);}
  const r=(x,y,w,h,color)=>{ctx.fillStyle=color;const head=pose&&y<19,torso=pose&&y>=19&&y<31;ctx.fillRect(x+(head?(pose.headX||0):torso?(pose.bodyX||0):0),y+(head?(pose.headY||0):torso?(pose.bodyY||0):0),w,h);};
  const outline="#302f35", skin="#f2d5af", blush="#eb9da2", hair=style.hood?style.coat:style.hair;
  const resting = action === "bench";
  const step=Math.sign(walk), look=facing<0?-1:0;
  r(5,37,14,1,"#183a3933");
  // 무릎과 팔이 교대로 움직이고 무게중심은 허리 위에 둔다.
  const leg=(x,dy)=>{r(x,31,4,5,outline);r(x+1,32,2,3,skin);r(x-1,35+dy,5,2,outline);r(x,35+dy,3,1,pose?.barefeet?skin:style.sandal?"#d2b47d":"#a77d57");};
  if(pose?.eventKneel){r(7,31,10,3,outline);r(8,31,8,2,style.coat);r(7,34,5,2,outline);r(13,34,6,2,outline);r(8,34,3,1,skin);}
  else if(pose?.rising){r(7,31,6,3,outline);r(8,32,4,2,style.coat);r(14,30,5,4,outline);r(15,31,3,2,style.coat);r(6,34,6,2,outline);r(14,34,6,2,outline);}
  else if(pose?.dangling){leg(7,pose.leftLeg);leg(14,pose.rightLeg);}
  else if(pose?.sit){
    r(7,31,11,3,outline);r(8,31,9,1,style.coat);r(8,33,3,3,outline);r(15,33+pose.legSwing,3,3,outline);r(8,35,5,2,outline);r(15,35+pose.legSwing,5,2,outline);
  }else if(pose?.bend){r(6,32,5,3,outline);r(14,32,5,3,outline);r(5,35,6,2,outline);r(14,35,6,2,outline);}
  else{leg(7,step);leg(14,pose?.kick?-3:-step);if(pose?.kick){r(17,32,5,2,outline);r(18,32,3,1,skin);}}
  if(style.mantle||style.royal||style.shawl){r(7,19,10,2,outline);r(4,21,16,10,outline);r(5,22,14,8,style.coat);r(5,27,3,4,"#302f3522");}
  // 어깨에서 허리와 옷자락으로 이어지는 실루엣.
  r(9,19,6,1,outline);r(7,20,10,1,outline);r(6,21,12,3,outline);r(7,24,10,4,outline);r(6,28,12,5,outline);
  r(10,19,4,1,style.coat);
  r(8,20,8,4,style.coat);r(8,24,8,5,style.coat);r(7,29,10,3,style.coat);
  r(9,23,2,6,"#ffffff22");r(15,24,1,7,"#302f3522");
  // 독립된 목 기둥 없이 턱선이 어깨 윗부분에 바로 닿는다.
  // 옷깃 중앙의 한 줄 피부만 남겨 얼굴과 옷의 경계를 표현한다.
  r(10,20,4,1,skin);r(10,21,1,1,"#f4e7c5");r(13,21,1,1,"#f4e7c5");
  const arm=(x,dy)=>{r(x,21+dy,4,4,outline);r(x+1,22+dy,2,2,style.coat);r(x,25+dy,3,4,outline);r(x+1,25+dy,2,3,skin);};
  if(pose?.eventArms)drawEventArms(r,style,pose);
  else if(pose?.dangling){arm(4,pose.leftArm);arm(17,pose.rightArm);}
  else if(pose?.swimming){
    const drawSwimArm=(shoulder,arm)=>{
      const elbowX=shoulder+arm.elbowX,elbowY=21+arm.elbowY,handX=shoulder+arm.handX,handY=21+arm.handY;
      r(shoulder-1,21,5,4,outline);r(shoulder,22,3,2,style.coat);
      r(Math.min(elbowX,handX)-1,Math.min(elbowY,handY)-1,Math.max(3,Math.abs(handX-elbowX)+3),Math.max(3,Math.abs(handY-elbowY)+3),outline);
      r(Math.min(elbowX,handX),Math.min(elbowY,handY),Math.max(1,Math.abs(handX-elbowX)+1),Math.max(1,Math.abs(handY-elbowY)+1),style.coat);
      r(handX,handY,3,2,skin);
    };
    drawSwimArm(5,pose.leftArm);drawSwimArm(18,pose.rightArm);
  }else if(pose?.hand){
    const yy=pose.handY,hx=pose.handX||0;
    const hr=(xx,yy,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(xx+pose.bodyX,yy+pose.bodyY,w,h);};
    for(const [elbow,hand]of [[5,7-Math.max(0,hx)],[18,14+hx]]){
      hr(elbow-1,21,4,4,outline);hr(elbow,22,2,2,style.coat);
      hr(elbow,Math.min(24,yy),2,Math.abs(yy-24)+2,outline);
      hr(Math.min(elbow,hand),yy,Math.abs(hand-elbow)+3,3,outline);
      hr(hand,yy,3,2,skin);
    }
  }else{arm(4,hanging?2:-step);arm(17,hanging?2:step);}
  if(style.plate){r(8,22,8,6,'#a6b6b5');r(9,23,2,4,'#d1dcd1');r(14,23,1,4,'#728d90');}
  if(style.apron){r(9,24,6,7,'#e9d4aa');r(8,24,8,1,'#705642');}
  if(style.vest){r(7,20,3,5,'#69583f');r(14,20,3,5,'#69583f');}
  if(style.sash){r(14,21,2,11,style.sash);r(13,23,1,3,style.sash);}
  if(style.belt){r(7,26,10,2,'#58412d');r(11,26,2,2,'#c4a768');}
  if(style.fur){for(let i=0;i<5;i++){r(7+i*2,22+i%2,1,2,'#614f39');r(8+i*2,29-i%2,1,2,'#d4b68b');}}
  if(style.trim){r(7,21,1,5,style.trim);r(16,21,1,5,style.trim);r(7,31,10,1,style.trim);}
  if(style.pattern){for(let i=0;i<3;i++)r(8+i*3,23,1,8,['#7b8d7c','#b96c75','#cfac68'][i]);}
  if(style.collar===1){r(9,21,1,2,style.accent);r(14,21,1,2,style.accent);}
  if(style.collar===2)r(10,22,4,1,style.accent);
  if(style.hem===1)r(8,31,8,1,style.accent);
  if(style.hem===2){r(8,29,1,3,style.accent);r(15,29,1,3,style.accent);}
  drawWardrobe(r,style,'down');drawPhysicalDetails(r,style);
  // 16도트 머리와 10도트 얼굴: 둥근 턱이 짧은 목과 어깨에 바로 이어진다.
  ctx.save();ctx.translate(12,13);ctx.rotate(pose?.headTilt||0);ctx.translate(-12,-13);ctx.translate(0,4);
  // 뒤 머리 → 닫힌 얼굴 윤곽 → 얼굴 → 앞머리 → 표정 순서로 겹친다.
  r(9,1,6,1,outline);r(7,2,10,1,outline);r(5,3,14,2,outline);r(4,5,16,8,outline);r(5,13,14,2,outline);r(8,15,8,1,outline);
  r(8,3,8,1,hair);r(6,4,12,2,hair);r(5,6,14,7,hair);r(6,13,12,1,hair);
  if(style.longHair){r(4,12,3,7,outline);r(17,12,3,7,outline);r(5,12,2,6,hair);r(17,12,2,6,hair);}
  r(7,6,10,7,outline);r(8,13,8,1,outline);r(9,14,6,1,outline);
  r(8,6,8,1,skin);r(7,7,10,5,skin);r(8,12,8,2,skin);r(10,14,4,1,skin);
  // 눈 옆에는 피부 한 칸을 남겨 옆머리와 눈이 붙지 않게 한다.
  r(7,6,3,1,hair);r(7,7,1,1,hair);r(15,6,2,1,hair);r(6,7,1,5,hair);r(17,7,1,5,hair);
  r(8,4,4,1,"#ffffff33");
  if(!style.bald&&!style.hood){
    if(style.fringe===1)r(10,6,2,1,hair);
    if(style.fringe===2){r(13,6,2,1,hair);r(15,7,1,1,hair);}
    if(style.fringe===3)r(10,5,4,1,"#ffffff22");
  }
  if(style.bald){r(8,3,8,3,skin);r(7,5,10,2,skin);r(7,7,1,1,skin);}
  if(style.hairSheen&&!style.hood&&!style.bald){r(8,4,8,1,'#ffffff44');r(7,5,2,1,'#ffffff22');}
  drawFaceExpression(r,expression,{look,spacing:style.eyeSpacing,tone:style.eyeTone,soft:style.softEyes});
  r(8,11,1,1,style.warmCheeks?'#d38d79':blush);r(15,11,1,1,style.warmCheeks?'#d38d79':blush);
  if(style.eyeliner){r(9+look,8,2,1,outline);r(14+look,8,2,1,outline);}
  if(style.updo){r(9,-2,6,3,outline);r(10,-1,4,2,hair);r(13,0,2,1,'#d8b66a');}
  if(style.crown){r(7,1,10,2,outline);r(8,1,8,1,style.trim||'#d9b568');for(const x of [7,11,15])r(x,-1,2,2,'#d9b568');r(11,1,2,1,'#a95e64');}
  if(style.helmet){r(6,3,12,3,'#9bacae');r(5,6,2,5,'#9bacae');r(17,6,2,5,'#7b9099');r(8,3,6,1,'#d4dbca');}
  if(style.turban){r(7,2,10,3,style.coat);r(6,5,12,1,'#e4d9ba');r(8,3,8,1,'#b0b8c4');r(11,2,2,4,style.trim||'#c4a768');}
  if(style.headband){r(6,5,12,1,'#e7d7b7');r(17,6,2,4,'#e7d7b7');}
  if(style.jewels){r(5,12,1,2,'#e0ba67');r(18,12,1,2,'#e0ba67');}
  // 수염은 입 아래와 턱 끝에만 둔다. 가로로 입을 덮는 띠를 만들지 않는다.
  if(style.beard){r(8,13,1,1,style.beard);r(15,13,1,1,style.beard);r(10,14,4,1,style.beard);}
  if(style.halo){r(8,-2,8,1,"#f4c65c");r(6,-1,2,1,"#f4c65c");r(16,-1,2,1,"#f4c65c");}
  ctx.restore();
  if(style.jewels)r(10,22,4,1,'#e0ba67');
  if(style.tambourine){r(18,24,6,7,outline);r(19,25,4,5,'#c4a068');r(20,26,2,3,'#f1dbad');r(19,24,1,1,'#e6c376');r(22,30,1,1,'#e6c376');}
  if(style.staff){for(let i=0;i<16;i++)r(-2+Math.floor(i/3),-7+i*2,2,3,outline);for(let i=0;i<15;i++)r(-1+Math.floor(i/3),-6+i*2,1,2,"#b78a5a");r(-4,-9,5,2,outline);r(-3,-8,3,1,"#b78a5a");}
  if(style.scroll){r(18,25,5,7,outline);r(19,26,3,5,'#eee0ad');r(18,25,5,1,'#b39362');r(18,31,5,1,'#b39362');}
  if(style.grapes){r(-2,27,6,6,'#745e40');r(-1,26,4,1,'#68a06b');r(-1,27,2,2,'#80679e');r(1,28,2,2,'#937db0');r(0,30,2,1,'#80679e');}
  if(style.grain){r(19,24,1,10,'#987c48');r(17,24,2,4,'#e5c574');r(20,23,2,4,'#e5c574');}
  if(style.net){for(let i=0;i<3;i++){r(18+i*2,25,1,9,'#b9b49c');r(18,26+i*3,6,1,'#b9b49c');}}
  if(style.lyre){r(18,25,1,8,'#c09b61');r(23,25,1,8,'#c09b61');r(18,32,6,2,'#c09b61');r(19,25,4,1,'#c09b61');r(20,26,1,5,'#e1d3a3');r(22,26,1,5,'#e1d3a3');}
  if(style.glow){r(-1,6,2,2,'#f8dc85');r(25,3,2,2,'#f8dc85');r(0,26,1,3,'#f8dc85');r(26,25,1,3,'#f8dc85');}
  if(!pose&&action==="field"){r(20,22,1,9,"#b78a5a");r(19,21,3,3,"#f5d371");r(18,23,2,2,"#e1b95f");}
  if(!pose&&action==="water"){r(19,20,3,5,outline);r(19,20,3,1,"#87bfd1");r(19,21,2,3,"#bf8767");}
  if(style.chariot && action==="ascend") {
    r(-3,21,26,2,"#e4ab4c");r(-3,18,2,5,outline);r(21,18,2,5,outline);r(1,23,5,5,outline);r(14,23,5,5,outline);r(2,24,3,3,"#d9a64c");r(15,24,3,3,"#d9a64c");
    for(let i=0;i<3;i++){r(-5-i,19+(i%2),2,4,"#ef9b46");r(-6-i,21,2,2,"#ffe19a");}
  }
  if(!pose&&(action==='well'||action==='oil')){r(19,20,3,5,outline);r(19,21,2,3,action==='oil'?'#dbc365':'#84bdce');}
  if(!pose&&action==='scroll'){r(6,21,13,8,outline);r(7,22,11,6,'#eee0b2');r(9,23,7,1,'#94805a');r(9,25,6,1,'#94805a');}
  if(!pose&&action==='stone'){r(19,23,4,4,outline);r(20,23,2,3,'#a5aaa2');}
  if(!pose&&action==='bush'){r(1,24,3,2,skin);r(20,24,3,2,skin);}
  if(pose?.hand&&!pose.heldObject&&!['tear-garment','water-wine','staff-snake','five-stones','glean-bundle'].includes(pose.actual)){
    if(['water','well','oil'].includes(pose.prop)){const yy=pose.handY-1;r(15,yy,4,5,outline);r(16,yy+1,2,3,pose.prop==='oil'?'#d9bd58':'#8abbd0');}
    if(pose.prop==='cooking'){r(18,pose.handY-3,1,9,'#b99a6f');r(17,pose.handY+4,3,2,'#b99a6f');}
    if(pose.prop==='field'){r(12,pose.bend?29:24,1,8,'#987c48');r(10,pose.bend?29:24,5,3,'#e5c574');}
    if(pose.prop==='scroll'){const width=pose.gesture==='unroll'?(pose.phase===1?8:14):12;r(7,23,width,7,outline);r(8,24,width-2,5,'#eee0b2');r(10,25,width-6,1,'#94805a');if(pose.gesture==='write')r(16,21+pose.phase,1,6,'#70563e');}
    if(pose.prop==='stone'){r(14,27,5,4,outline);r(15,27,3,3,'#a5aaa2');}
    if(pose.prop==='boat'){r(15,22,2,12,'#a17c50');r(14,32,4,4,'#b99263');}
    if(pose.prop==='instrument'){r(8,24,9,7,outline);r(9,25,7,5,'#c1a36b');r(12,24,1,7,'#eee0b2');}
  }
  if(pose?.hand&&pose.gesture==='pour'&&pose.phase===2){r(19,28,1,2,'#8abbd0');r(20,31,1,2,'#8abbd0');}
  if(pose?.hand&&['bucket','rope'].includes(pose.gesture)){r(18,21,1,12,'#b9945d');r(16,31,5,4,'#9c774a');}
  ctx.restore();
}
export function drawWorldObject(c,o,tile=24,frame=null) {
  const descriptor=OBJECT_CATALOG[o.kind];
  const family=descriptor?.family;
  const originalKind=o.kind;
  if(descriptor&&!['field','water','bench','tree','well','stone','bush','boat','scroll','oil','love-booth'].includes(o.kind))o={...o,kind:['plant','crop'].includes(family)?(family==='crop'?'field':'tree'):['vessel'].includes(family)?descriptor.action:['book'].includes(family)?'scroll':family==='boat'?'boat':family==='stone'?'stone':family==='seat'?'bench':'catalog'};
  const x=o.x*tile,y=o.y*tile;
  c.save();c.translate(Math.round(x+(frame?.dx||0)),Math.round(y+(frame?.dy||0)));c.rotate(frame?.tilt||0);const size=frame?.scale||objectPresentation(originalKind).scale;c.scale(size*(1+(frame?.open||0)),size*(1-(frame?.squash||0)));
  if(frame?.bite){c.beginPath();c.rect(-30,-40,60,40);c.clip();}
  if(OBJECT_CATALOG[originalKind]?.family==='animal'){
   const creature=creatureForName(OBJECT_CATALOG[originalKind].name);
   if(creature){const gesture=frame?.pose?.actual;
    drawCreature(c,creature,0,2,{direction:'right',frame:frame?.active?frame.phase:0,pose:frame?.active?{phase:frame.phase,creatureAction:gesture==='feed'?'graze':gesture==='guide'?'look':'rest'}:null});
    c.restore();return;
   }
  }
  const r=(x,y,w,h,color)=>{c.fillStyle=color;
   if(frame?.clothWave){for(let j=0;j<h;j+=2){const yy=y+j,offset=Math.round(Math.sin(yy*.22+frame.clothWave)*Math.max(0,(yy+22)/15));c.fillRect(x+offset,yy,w,Math.min(2,h-j));}}
   else c.fillRect(x,y-(frame?.lid&&y<=-10?6:0),w,h);
  };const O="#393e3c";
  if(!frame?.held)r(-7,4,15,2,"#193b3533");
  if(originalKind==='love-booth'){
    r(-20,1,40,5,O);r(-18,1,36,3,'#77553e');r(-15,4,4,7,O);r(11,4,4,7,O);r(-13,4,26,2,'#c6a06a');
    r(-11,-20,22,18,O);r(-9,-18,18,14,'#305665');r(-7,-16,14,10,'#f1d891');r(-5,-14,10,2,'#b86c58');r(-4,-10,8,2,'#6f8e7b');
    r(-2,-24,4,4,'#d7b966');r(-1,-23,2,2,'#fff0b3');c.restore();return;
  }
  if(descriptor&&drawCatalogDetail(r,originalKind,family,O,frame)){c.restore();return;}
  if(o.kind==="field") {
    r(-12,-3,25,10,O);r(-11,-2,23,8,"#a68258");
    for(let i=0;i<5;i++){const p=-9+i*5;r(p,-9,1,12,"#795e40");r(p-1,-10,3,6,"#e4b95f");r(p-2,-9,1,3,"#f7dc8d");r(p+2,-7,1,3,"#f7dc8d");}
  } else if(o.kind==="tree") {
    const motion=frame?.pose,phase=motion?.phase||0,active=motion&&["shake","kick","bonk","fruit"].includes(motion.actual);
    const sway=active&&[1,2].includes(phase)?(phase===1?-2:2):0;
    r(-4,-7,9,12,O);r(-3,-7,7,11,"#76583f");r(-2,-6,2,8,"#a18159");r(-7,-1,4,4,O);r(3,-1,4,4,O);r(-6,0,3,2,"#76583f");r(4,0,3,2,"#76583f");
    // 겹친 수관, 잎의 밝은 면, 뿌리와 나무껍질을 작은 픽셀에서도 읽히게 한다.
    r(-7+sway,-23,14,3,O);r(-11+sway,-21,22,4,O);r(-14+sway,-17,28,9,O);r(-12+sway,-9,24,5,O);r(-8+sway,-5,16,3,O);
    r(-6+sway,-22,12,2,"#61946c");r(-10+sway,-19,20,3,"#61946c");r(-13+sway,-16,26,7,"#54865f");r(-11+sway,-9,22,4,"#54865f");r(-7+sway,-6,14,2,"#427454");
    for(const [lx,ly,lw] of [[-9,-20,5],[-3,-21,6],[5,-18,5],[-11,-14,5],[-2,-15,6],[7,-12,4],[-7,-9,5]])r(lx+sway,ly,lw,2,"#80ac77");
    const falling=active&&["kick","bonk","shake","fruit"].includes(motion.actual)&&phase===2;
    if(falling){const drop=Math.floor((motion.within||0)*12);for(const [fx,fy]of [[-6,-12],[5,-15],[8,-9]]){const yy=fy+drop*2;r(fx+sway,yy,3,3,"#d7864d");r(fx+sway+1,yy-1,1,1,"#66844e");}}
    else if(active)for(const [fx,fy]of [[-6,-12],[5,-15],[8,-9]]){r(fx+sway,fy,3,3,"#d7864d");r(fx+sway+1,fy-1,1,1,"#66844e");}
  } else if(o.kind==="bench") {
    r(-9,-4,18,5,O);r(-8,-3,16,3,"#d1ad78");r(-7,1,2,5,O);r(5,1,2,5,O);r(-8,-10,2,6,O);r(6,-10,2,6,O);r(-7,-10,14,3,O);r(-6,-9,12,1,"#d1ad78");
  } else if(o.kind==="water") {
    if(['cup','bowl','basin','pot','laver'].includes(originalKind)){
      const wide=['basin','laver','pot'].includes(originalKind)?9:6;
      r(-wide,-6,wide*2,8,O);r(-wide+1,-5,wide*2-2,6,'#be886b');r(-wide,-7,wide*2,2,'#84bdce');
      if(originalKind==='cup'){r(6,-5,3,5,O);r(6,-4,2,3,'#be886b');}
      if(originalKind==='pot'){r(-11,-4,3,3,O);r(8,-4,3,3,O);}
    }else{r(-3,-11,6,2,O);r(-4,-9,8,2,O);r(-5,-7,10,10,O);r(-3,3,6,1,O);r(-3,-8,6,1,"#729fb5");r(-4,-6,8,8,"#be886b");r(-3,-5,2,5,"#e5af86");r(-2,-10,4,1,frame?.liquidColor||'#84bdce');}
  }  if(o.kind==='well'){
    r(-11,-4,22,11,O);r(-9,-3,18,8,'#aaa38e');r(-7,-2,14,5,'#467f8e');r(-10,-1,4,2,'#7199a0');r(4,0,3,2,'#7199a0');r(-12,-7,24,3,O);r(-10,-6,20,2,'#d0c5a5');
    r(-9,-21,3,15,O);r(6,-21,3,15,O);r(-8,-20,1,13,'#8c6948');r(7,-20,1,13,'#8c6948');r(-11,-22,22,4,O);r(-9,-21,18,2,'#b28b5b');r(-1,-18,2,13,'#d8c08b');r(-3,-9,6,4,O);r(-2,-8,4,2,'#805e46');
  }else if(o.kind==='stone'){
    r(-7,-3,14,8,O);r(-9,0,18,4,O);r(-6,-2,12,6,'#a5aaa2');r(-8,1,16,2,'#858e89');r(-5,-2,7,2,'#c7cbc0');
  }else if(o.kind==='bush'){
    r(-2,-8,4,13,'#765238');r(-9,-14,18,12,O);r(-11,-10,22,7,'#54724b');r(-7,-16,14,5,'#6b8b50');
    for(const [x,y] of [[-6,-13],[1,-17],[5,-9],[-2,-6]]){r(x,y,3,8,'#d77532');r(x+1,y-2,2,6,'#ffd466');}
  }else if(o.kind==='boat'){
    r(-15,-6,30,6,O);r(-13,-1,26,5,O);r(-10,4,20,4,O);r(-7,8,14,2,O);r(-13,-5,26,3,'#b28758');r(-11,-1,22,2,'#89643e');r(-8,3,16,2,'#a87a50');r(-5,6,10,2,'#76543c');
    r(-1,-25,3,20,O);r(2,-23,11,16,O);r(3,-22,9,14,'#eee2bd');r(4,-20,7,10,'#d3c59c');r(0,-3,1,4,'#73553a');r(-8,-4,2,6,'#d8b180');r(7,-4,2,6,'#d8b180');
  }else if(o.kind==='scroll'){
    r(-8,-12,16,16,O);r(-6,-11,12,14,'#efe0b3');r(-9,-13,3,4,'#a77648');r(6,1,3,4,'#a77648');
    for(let i=0;i<4;i++)r(-4,-8+i*3,8-i%2*2,1,'#8c7854');
  }else if(o.kind==='oil'){
    r(-2,-13,4,4,O);r(-4,-9,8,4,O);r(-5,-5,10,10,O);r(-3,-8,6,4,'#ccab51');r(-4,-4,8,8,'#b89145');r(-3,-3,2,5,'#e6cb72');r(-2,-13,4,1,'#e9cf81');
  }

  if(o.kind==='catalog'){
    const seed=[...originalKind].reduce((n,c)=>n+c.charCodeAt(0),0),color=['#ad8e65','#8d9e9a','#c4a76a','#a98b86'][seed%4];
    if(originalKind==='fire'){
      // 불은 사람이나 덤불이 아닌 장면 오브젝트로 그린다.
      r(-12,1,24,4,O);r(-9,-1,18,3,'#73563f');r(-6,-2,12,2,'#b08756');
      r(-7,-12,4,12,'#a54432');r(-5,-17,4,16,'#e17b3e');r(-1,-13,5,13,'#ffd16e');r(3,-19,4,18,'#e87936');r(6,-11,4,11,'#bd4b35');
      r(-3,-8,3,8,'#fff0a4');r(1,-7,3,7,'#fff0a4');r(6,-14,2,6,'#fff0a4');
    }
    else if(originalKind==='idol'){
      r(-10,5,20,4,O);r(-8,3,16,2,'#927341');r(-3,-14,6,17,O);r(-2,-12,4,14,'#d1ae58');r(-6,-10,3,3,'#d1ae58');r(3,-10,3,3,'#d1ae58');r(-6,-8,2,2,O);r(4,-8,2,2,O);r(-7,-6,4,2,'#d1ae58');r(3,-6,4,2,'#d1ae58');r(-2,-19,4,5,O);r(-1,-18,2,3,'#d1ae58');
    }
    else if(originalKind==='fleece'){
      r(-10,-3,20,8,O);r(-9,-5,18,9,'#e9e2d1');r(-7,-9,5,8,'#f5f0e4');r(-2,-11,6,9,'#f5f0e4');r(4,-9,5,8,'#f5f0e4');r(8,-5,2,6,'#ddd4c2');
      r(-6,-2,12,2,'#d5cbb7');
    }
    else if(['building','tent'].includes(family)){r(-10,-20,20,24,O);r(-9,-19,18,22,color);r(-12,-24,24,5,'#987c55');r(-3,-9,6,13,O);}
    else if(family==='weapon'||family==='staff'||family==='cross'){r(-1,-27,2,31,O);r(0,-26,1,29,'#d6cbae');r(-6,-9,13,2,'#b28f4b');if(family==='cross')r(-9,-20,19,3,color);}
    else if(family==='animal'){
      if(originalKind==='fish'){r(-9,-8,17,8,O);r(-8,-7,15,6,'#7ea8ad');r(7,-6,5,5,'#7ea8ad');r(-6,-6,1,1,O);r(-2,-10,5,2,'#517c8d');}
      else if(['dove','raven','quail'].includes(originalKind)){const bird=originalKind==='dove'?'#eee4cb':originalKind==='raven'?'#49515b':color;r(-7,-10,14,11,O);r(-6,-9,12,9,bird);r(4,-15,7,8,bird);r(9,-12,4,2,'#c9a568');r(7,-13,1,1,O);r(-4,1,2,4,'#c9a568');r(3,1,2,4,'#c9a568');}
      else if(originalKind==='snake'){r(-10,1,17,3,'#718b61');r(-8,-2,3,6,'#718b61');r(3,-5,4,8,'#718b61');r(4,-7,7,4,'#718b61');r(9,-6,1,1,O);}
      else{r(-9,-11,18,12,O);r(-8,-10,16,10,color);r(6,-15,7,8,color);r(11,-13,1,1,O);r(-7,1,2,5,O);r(5,1,2,5,O);}
    }
    else if(family==='cloth'||family==='wear'){r(-8,-18,16,23,O);r(-7,-17,14,21,color);r(-7,-13,14,2,'#e2d6b4');r(-5,-17,2,21,'#ffffff33');}
    else if(family==='lamp'||family==='altar'){r(-9,-5,18,10,O);r(-8,-4,16,8,color);r(-4,-13,8,9,'#d89b47');r(-2,-19,5,11,'#f7d576');}
    else if(family==='instrument'){r(-7,-16,14,21,O);r(-6,-15,12,19,color);for(let i=0;i<4;i++)r(-4+i*3,-13,1,16,'#eee0b2');}
    else if(family==='net'){for(let i=-9;i<=9;i+=3){r(i,-16,1,21,color);r(-9,i-6,19,1,color);}}
    else if(family==='cart'){r(-11,-10,22,10,O);r(-10,-9,20,8,color);r(-9,1,5,5,O);r(5,1,5,5,O);}
    else if(family==='symbol'){r(-7,-16,14,14,color);r(-3,-20,6,22,'#e9ce7b');r(-11,-12,22,6,'#e9ce7b');}
    else{r(-8,-8,16,12,O);r(-7,-7,14,10,color);r(-8,-9,16,2,'#d9caa1');if(family==='food'){r(-5,-12,10,4,'#d8b879');r(-3,-13,6,2,'#f0d3a1');}if(family==='treasure'){r(-3,-12,6,6,'#e7c65e');}}
  }
  c.restore();
}

export function drawWorldBackground(c, key="meadow") {
  const palette=backgroundFor(key);
  const TILE = 24;
  c.fillStyle=palette.ground;c.fillRect(0,0,960,480);
  for(let y=0;y<20;y++)for(let x=0;x<40;x++) {
    const h=(x*37+y*83)%19;c.fillStyle=h<8?palette.tile[0]:palette.tile[1];c.fillRect(x*TILE,y*TILE,TILE,TILE);
    if(h<5){c.fillStyle=palette.speck;c.fillRect(x*TILE+7,y*TILE+14,3,3);}
  }
  c.fillStyle=palette.path;c.fillRect(0,216,960,48);c.fillRect(408,100,48,300);
  c.fillStyle=palette.pathLight;for(let x=0;x<960;x+=35)c.fillRect(x,229,18,6);
  c.fillStyle=palette.water;c.fillRect(0,420,960,60);c.fillStyle=palette.wave;for(let x=12;x<960;x+=56)c.fillRect(x,440+(x%3)*6,26,3);
  c.fillStyle=palette.bank;c.fillRect(0,408,960,12);
  // 먼 언덕과 돌집
  c.fillStyle=palette.hill;c.fillRect(0,0,960,48);c.fillRect(0,48,300,24);c.fillRect(750,48,210,24);
  // 장식은 이동 가능한 y>=120 영역 밖에 둬 충돌 그리드와 일치시킨다.
  if(['mountains','dunes','sunset','lake'].includes(palette.motif)){
    for(let i=0;i<8;i++){const x=i*144-40,top=palette.motif==='mountains'?8+(i%3)*14:38+(i%2)*12;c.fillStyle=i%2?palette.roof:palette.hill;for(let y=top;y<96;y+=6){const half=Math.min(90,(y-top)*(palette.motif==='mountains'?1:2)+8);c.fillRect(x-half,y,half*2,6);}}
    if(palette.motif==='sunset'){c.fillStyle='#edd09b';c.fillRect(620,10,42,30);c.fillRect(614,16,54,18);}
    if(palette.motif==='lake'){c.fillStyle=palette.water;c.fillRect(0,48,300,36);c.fillStyle=palette.wave;for(let x=12;x<300;x+=48)c.fillRect(x,65,24,2);}
  }
  if(palette.motif==='stars'){c.fillStyle='#e1d7ab';for(let i=0;i<28;i++)c.fillRect((i*131+17)%960,(i*17)%45,2,2);c.fillRect(620,10,18,18);c.fillStyle=palette.hill;c.fillRect(626,7,15,15);}
  for(const x of (['village','stars'].includes(palette.motif)?[110,700,800]:[800])){c.fillStyle=palette.house;c.fillRect(x,50,78,55);c.fillStyle=palette.roof;c.fillRect(x-6,44,90,12);c.fillStyle="#4a4e3b";c.fillRect(x+29,74,20,31);c.fillRect(x+8,65,12,12);}
  c.fillStyle="#e6c789";c.fillRect(65,100,4,40);c.fillRect(55,100,28,14);
}

export function drawDesignBoard(c) {
  const rows=Math.ceil(Object.keys(CHARACTER_STYLES).length/6);
  const W=1200,H=860+rows*260;c.canvas.width=W;c.canvas.height=H;c.imageSmoothingEnabled=false;
  c.fillStyle="#f3ecdb";c.fillRect(0,0,W,H);
  c.fillStyle="#16343c";c.fillRect(0,0,W,108);
  c.fillStyle="#f6d894";c.font='bold 30px "DungGeunMo", monospace';c.fillText("PIXEL BIBLE / DESIGN BOARD",38,48);
  c.fillStyle="#d7e0c3";c.font='16px "DungGeunMo", monospace';c.fillText("큰 도트 · 길이를 살린 몸통 · 점눈과 볼터치 · 실제 월드와 같은 원본 그림",38,82);
  const entries=Object.entries(CHARACTER_STYLES);
  entries.forEach(([key,style],i)=>{
    const x=30+(i%6)*195, row=Math.floor(i/6)*260;
    c.save();c.translate(0,row);
    c.fillStyle=i%2?"#e6ddca":"#d9e0ce";c.fillRect(x,130,170,245);
    drawPixelCharacter(c,style,x+85,325,{scale:4,action:key==="ruth"?"field":""});
    c.fillStyle="#263e3d";c.textAlign="center";c.font='bold 18px "DungGeunMo", monospace';c.fillText(style.name,x+85,350);
    c.font='11px "DungGeunMo", monospace';c.fillText("24 × 38 / 4x preview",x+85,368);c.restore();
  });
  c.save();c.translate(0,rows*260-220);
  c.textAlign="left";c.fillStyle="#294842";c.font='bold 20px "DungGeunMo", monospace';c.fillText("오브젝트 · 캐릭터와 같은 굵기의 도트",36,416);
  const obs=[["field","보리밭 / 이삭 줍기"],["water","물항아리 / 물 마시기"],["bench","쉬는 자리 / 휴식"],["tree","나무 / 길 막기"]];
  obs.forEach(([kind,label],i)=>{
    const x=30+i*292;c.fillStyle="#e1e5d4";c.fillRect(x,440,264,213);
    c.save();c.translate(x+132,570);c.scale(1.8,1.8);drawWorldObject(c,{kind,x:0,y:0});c.restore();
    c.fillStyle="#294842";c.textAlign="center";c.font='16px "DungGeunMo", monospace';c.fillText(label,x+132,632);
  });
  c.textAlign="left";c.font='bold 20px "DungGeunMo", monospace';c.fillText("걷기 원화와 지형 조합",36,700);
  for(let i=0;i<4;i++){
    const x=30+i*104;c.fillStyle="#e3ddcc";c.fillRect(x,728,98,160);
    drawPixelCharacter(c,CHARACTER_STYLES.ruth,x+49,856,{scale:3,direction:["down","left","right","up"][i],walkFrame:1});
  }
  c.font='14px "DungGeunMo", monospace';c.fillStyle="#294842";c.fillText("정면 · 왼쪽 · 오른쪽 · 후면",54,916);
  const bg=document.createElement("canvas");bg.width=960;bg.height=480;drawWorldBackground(bg.getContext("2d"));
  c.drawImage(bg,450,728,720,240);
  c.font='14px "DungGeunMo", monospace';c.fillText("풀밭 · 흙길 · 물가 · 돌집 (상상 공간)",450,995);
  c.font='12px "DungGeunMo", monospace';c.fillStyle="#5d6d61";c.fillText("본문 근거와 창작 복식을 구분합니다. 관리자 개발 체험 · 정식 버전 유지.",36,1020);c.restore();
}

const objectHitCache=new Map();
export function hitWorldObject(o,point,frame=null,padding=0){
 const key=JSON.stringify([o.kind,frame?.scale,frame?.tilt,frame?.open,frame?.squash,frame?.dx,frame?.dy,frame?.lid,frame?.clothWave]);
 let pixels=objectHitCache.get(key);
 if(!pixels){const c=document.createElement('canvas');c.width=c.height=384;drawWorldObject(c.getContext('2d'),{...o,x:192,y:192},1,frame);pixels=c.getContext('2d').getImageData(0,0,384,384).data;if(objectHitCache.size>256)objectHitCache.clear();objectHitCache.set(key,pixels);}
 const x=Math.floor(point.x-o.x*24+192),y=Math.floor(point.y-o.y*24+192),r=Math.max(0,Math.floor(padding));
 for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){
  const sx=x+ox,sy=y+oy;
  if(sx>=0&&sx<384&&sy>=0&&sy<384&&ox*ox+oy*oy<=r*r+1&&pixels[(sy*384+sx)*4+3]>128)return true;
 }
 return false;
}
