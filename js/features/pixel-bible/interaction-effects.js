import {drawScriptedEffect} from './scripted-effects.js';
import {drawWorkResult} from './work-results.js';
import {pixelRope,ropeLoop} from './rope-art.js';
import {heldObject,drinkingCup} from './object-response.js';
import {drawWorldObject} from './art.js';
// 일시적인 결과만 그린다. 저장된 배치와 배경은 바꾸지 않는다.
export function drawInteractionEffects(c,n,pose,x,y,time){
 if(!pose||!n.usingObject||n.creature)return;
 if(drawScriptedEffect(c,n,pose,x,y,time))return;
 const o=n.usingObject,phase=pose.phase,use=phase===1||phase===2,dir=n.direction==='left'?-1:1;
 const r=(xx,yy,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(xx),Math.round(yy),w,h);};
 const prop=(kind,xx,yy,scale=.6,tilt=0)=>drawWorldObject(c,{kind,x:xx/24,y:yy/24},24,{scale,tilt,held:true});
 const actual=pose.actual||pose.gesture;
 drawWorkResult(c,n,pose,x,y,time);
 // Contact/result cues make the work readable from either facing direction.
 if(use&&['write','trace'].includes(actual)){
  prop('letter',x+dir*25,y-10,.65);
  for(let i=0;i<1+Math.floor(pose.within*4);i++)r(x+dir*25-6+i*3,y-15,2,1,'#554a3b');
 }
 if(use&&['sow','sprinkle','feed-grain'].includes(actual)){
  for(let i=0;i<5;i++){const t=(pose.within+i/5)%1;r(x+dir*(12+t*26),y-21+t*t*25,2,2,'#dec480');}
 }
 if(use&&['grind','knead','press'].includes(actual)){
  for(let i=0;i<3;i++)r(x+dir*(17+i*4),y-5-Math.floor(pose.within*3)%2,2,1,'#e7d6ad');
 }
 if(use&&['wash','rinse'].includes(actual)){
  for(let i=0;i<4;i++)r(x+dir*(13+i*3),y-19+((i+Math.floor(pose.within*8))%4)*3,1,2,'#a7dce0');
 }
 if(pose.prop==='boat'&&['row','back-row','lift-oar'].includes(actual)){const angle=Math.sin((phase+pose.within)*Math.PI/2)*.45;prop('oar',x+dir*20,y-12,.9,dir*angle);}
 const cup=drinkingCup(n,pose,x,y);if(cup)drawWorldObject(c,cup,24,cup.frame);
 if(['hammer','axe','sickle'].includes(o.kind)&&['swing','use'].includes(actual)&&use){
  const tx=x+dir*34,ty=y-5;
  if(o.kind==='hammer'){r(tx-13,ty,26,4,'#a98150');r(tx-2,ty-5,3,6,'#aeb8b3');}
  else if(o.kind==='axe'){r(tx-8,ty-4,16,9,'#79583c');r(tx-6,ty-6,12,3,'#c4a375');}
  else for(let i=0;i<6;i++){r(tx-10+i*4,ty-14,1,18,'#93a466');r(tx-11+i*4,ty-17,3,5,'#d5be78');}
  if(phase===2&&pose.within<.5)for(let i=0;i<4;i++)r(tx+dir*(i*4-6),ty-8-i%2*6+Math.floor(pose.within*12),2,2,o.kind==='sickle'?'#d6bd70':'#c4a375');
 }
 if(use&&['lyre','harp','tambourine','cymbal'].includes(o.kind)&&['strum','play','pluck','beat','tap','tune'].includes(actual)){
  const held=heldObject(n,time);if(held){const ix=held.x*24,iy=held.y*24,stroke=[-5,-1,4,1][Math.floor(pose.within*4)%4];
   r(ix+stroke-2,iy-21,7,5,'#302f35');r(ix+stroke-1,iy-21,5,3,'#f2d5af');
   r(ix-11,iy-10,6,4,'#302f35');r(ix-10,iy-10,4,2,'#f2d5af');
  }
 }
 if(pose.archery){
  if(use){
   const bx=x+dir*18,by=y+(pose.handY-36)*2,stretch=phase===1?8:1;
   for(let i=0;i<7;i++)r(bx+dir*(7-Math.abs(3-i)*2),by-15+i*5,2,5,'#b49262');
   r(bx-dir*stretch,by-15,1,31,'#e9dcb1');
   if(!pose.shot)prop('arrow',bx,by+1,.7,dir*Math.PI/2);
   else for(let i=0;i<(actual==='three-arrows'?3:1);i++)prop('arrow',bx+dir*(12+pose.within*130+i*15),by+i*5+(actual==='high-shot'?-pose.within*45:actual==='low-shot'?pose.within*25:0),.7,dir*Math.PI/2+(actual==='high-shot'?-dir*.25:actual==='low-shot'?dir*.2:0));
  }
 }
 if(pose.lie&&['bed','mat'].includes(o.kind)&&!['side-rest','rise'].includes(actual)){
  // 베개는 머리 아래에, 이불은 몸통 아래쪽에만 덮는다.
  r(x-3,y-44,31,22,'#6c8d8e');r(x-3,y-44,31,3,'#c9d4be');r(x+22,y-41,3,18,'#58777b');
 }
 if(o.kind==='rope'&&use){
  const side=n.direction==='left'||n.direction==='right';
  const hx=x+(side?dir*(18+(pose.handX||0)*2):10),hy=y+(pose.handY-36)*2;
  const beat=Math.floor(pose.within*4),pull=['pull','grip','stretch'].includes(actual);
  if(['coil','uncoil','sort','repair'].includes(actual)){
   const winding=actual==='uncoil'?1-pose.within:pose.within;
   for(let k=2;k>=0;k--)pixelRope(r,ropeLoop(hx,hy+k*4,12-k*2,5));
   pixelRope(r,[[hx+12,hy],[hx+20,hy+7],[hx+22+beat*2,hy+18],[hx+30,hy+24+winding*12]]);
  }else if(['tie','untie'].includes(actual)){
   const spread=actual==='untie'?4+beat*4:16-beat*3;
   pixelRope(r,[[hx-spread,hy+16],[hx-5,hy+4],[hx+6,hy-5],[hx+10,hy+3],[hx,hy+9],[hx-7,hy+2],[hx-3,hy-5],[hx+spread,hy+16]]);
  }else{
   const length=actual==='lower-rope'?26+beat*8:50;
   const sag=pull?Math.max(1,10-beat*3):12;
   pixelRope(r,Array.from({length:17},(_,i)=>{const t=i/16;return actual==='lower-rope'?[hx+Math.sin(t*3)*3,hy+t*length]:[hx+dir*t*length,hy+Math.sin(t*Math.PI)*sag];}));
  }
 }
 if(o.kind==='hook'&&use){
  const hx=x+dir*20,hy=y-28,end=actual==='cast-line'?65:actual==='reel'?25:45;
  r(hx,hy-30,2,38,'#98744c');for(let i=0;i<20;i++)r(hx+dir*i*end/20,hy-28+Math.round(i*i*.14),1,2,'#d8cfac');
  r(hx+dir*end,hy+28,3,5,'#aab6b4');
 }
 if(o.kind==='sling'&&use&&['sling','sling-low','spin-sling','load-sling'].includes(actual)){
  const hx=x+dir*15,hy=y-32,t=pose.within,angle=t*Math.PI*2+phase;
  for(let i=0;i<12;i++)r(hx+Math.cos(angle)*i*2,hy+Math.sin(angle)*i*2,2,2,'#c7ae7d');
  if(phase===2&&actual!=='spin-sling')prop('stone',hx+dir*(25+t*100),hy-t*8,.22);
 }
 if(['stamp','roll-seal','lift-seal','write','trace','dip'].includes(actual)&&use){
  prop('letter',x+dir*21,y-9,.65);
  if(['write','trace','dip'].includes(actual))prop('pen',x+dir*(20+pose.within*8),y-15,.5,dir*.5);
  else r(x+dir*21,y-15,5,3,'#ae6553');
 }
 if(['knead','press','portion','feed-grain','gather-flour','sprinkle','grind'].includes(actual)&&use){
  for(let i=0;i<5;i++)r(x+dir*(12+i*4),y-15+(i%2)*3,4,2,'#e8d8a8');
  if(actual==='grind')for(let i=0;i<6;i++){const a=i*Math.PI/3+phase;r(o.x*24+Math.cos(a)*12,o.y*24-8+Math.sin(a)*5,3,2,'#ded4b5');}
 }
 if(['unlock','turn-key'].includes(actual)&&use)prop('key',x+dir*22,y-22,.6,(phase-1)*.8);
 if(['weigh','balance','remove-weight'].includes(actual)&&use){prop('coin',x+dir*12,y-22,.5);prop('stone',x+dir*31,y-22+phase*2,.3);}
 if(actual==='climb-ladder'&&use){r(x-10,y-2,9,3,'#a77d57');r(x+7,y-12,9,3,'#a77d57');}
 if(['shake','kick','bonk','fruit'].includes(actual)&&pose.prop==='tree'&&use){
  for(let i=0;i<3;i++)r(o.x*24-20+i*19,o.y*24-65+(phase===2?pose.within*25:0),4,3,'#afc877');
  if(['bonk','fruit'].includes(actual)&&phase===2){
   const t=pose.within,fx=(o.x*24)*(1-t)+x*t,fy=(o.y*24-90)*(1-t)+(y-63)*t;
   prop('fruit',fx,fy,.45,t*.8);
   if(actual==='bonk'&&t>=.65){for(const [dx,dy]of [[-17,-75],[10,-82],[22,-71]]){r(x+dx,y+dy,5,2,'#ffe195');r(x+dx+2,y+dy-2,1,6,'#ffe195');}}
  }
 }
 if(actual==='staff-snake'&&phase===2){prop('snake',x+dir*(29+pose.within*10),y+1,1.2);}
 if(['strike-water','mantle-water','calm-waves'].includes(actual)&&use){
  const color=actual==='water-wine'?'#9b5f87':'#9dd5dc';
  for(let i=0;i<8;i++)r(o.x*24-28+i*8,o.y*24+4+Math.round(Math.sin(i+pose.within*4)*3),8,3,color);
  if(actual==='strike-water')for(let i=0;i<6;i++)r(o.x*24+6+i*3,o.y*24-10+i*5,3,6,color);
 }
 if(actual==='water-wine'&&use)r(o.x*24-4,o.y*24-19,8,3,'#965f85');
 if(actual==='five-stones'&&use)for(let i=0;i<5;i++)prop('stone',x+dir*(18+i*5),y+3-i%2*4,.3);
 if(actual==='fill-manna'&&use)for(let i=0;i<6;i++)r(o.x*24-5+(i%3)*5,o.y*24-20+i*3,3,3,'#f5e8bc');
 if(actual==='fill-vessels'&&use){for(let i=0;i<3;i++)prop('jar',x+dir*(26+i*15),y+2,.7);for(let i=0;i<4;i++)r(x+dir*23,y-22+i*5,2,3,'#dbbf6a');}
 if(actual==='cast-mantle'&&use)prop('cloak',x+dir*(28+pose.within*35),y-35-pose.within*12,.75,dir*pose.within*.5);
 if(actual==='tear-garment'&&use){r(x-14,y-40,12,21,'#b89875');r(x+4,y-40,12,21,'#b89875');r(x-1,y-40,3,23,'#2f3831');}
 if(['write-scroll','explain-scroll','read-prophet'].includes(actual)&&use){prop('scroll',x+dir*17,y-19,.65);if(actual==='write-scroll'){prop('pen',x+dir*(15+phase*2),y-19,.55,dir*.4);r(x+dir*12,y-27+phase*2,5,1,'#705b42');}}
 if(actual==='soothe-lyre'&&use)for(let i=0;i<3;i++){r(x+dir*(25+i*10),y-45-i*7,3,5,'#e3d6a0');r(x+dir*(25+i*10),y-45-i*7,6,1,'#e3d6a0');}
 if(actual==='break-share'&&use){prop('bread',x-20,y-25,.45);prop('bread',x+20,y-25,.45);}
 if(actual==='glean-bundle'&&use){for(let i=0;i<5;i++){r(x+dir*(17+i*2),y-18-i%2*3,1,17,'#a89052');r(x+dir*(16+i*2),y-20-i%2*3,3,5,'#e4c878');}}
 if(actual==='instruct-reapers'&&use)for(let i=0;i<3;i++)r(o.x*24+dir*(15+i*6),o.y*24-11+i*2,4,7,'#e4c878');
 // 몸짓에 맞춰 천 끝·가루·음표 같은 작은 결과를 더한다.
 if(['shake-cloth','shake-net','shake','thresh','fan'].includes(actual)&&use&&pose.prop!=='tree')for(let i=0;i<4;i++)r(x+dir*(20+i*6),y-20-i%2*7+phase*2,2,2,'#e5d5ad');
 if(['knock','tap','beat','repair'].includes(actual)&&phase===2){r(x+dir*25,y-35,7,2,'#ddc993');r(x+dir*28,y-40,2,10,'#ddc993');}
}
