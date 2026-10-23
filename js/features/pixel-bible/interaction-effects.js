import {drawWorldObject} from './art.js';
// 일시적인 결과만 그린다. 저장된 배치와 배경은 바꾸지 않는다.
export function drawInteractionEffects(c,n,pose,x,y,time){
 if(!pose||!n.usingObject)return;
 const o=n.usingObject,phase=pose.phase,use=phase===1||phase===2,dir=n.direction==='left'?-1:1;
 const r=(xx,yy,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(xx),Math.round(yy),w,h);};
 const prop=(kind,xx,yy,scale=.6,tilt=0)=>drawWorldObject(c,{kind,x:xx/24,y:yy/24},24,{scale,tilt,held:true});
 const actual=pose.actual||pose.gesture;
 if(pose.archery){
  if(use){
   const bx=x+dir*18,by=y+(pose.handY-36)*2,stretch=phase===1?8:1;
   for(let i=0;i<7;i++)r(bx+dir*(7-Math.abs(3-i)*2),by-15+i*5,2,5,'#b49262');
   r(bx-dir*stretch,by-15,1,31,'#e9dcb1');
   if(phase!==2)prop('arrow',bx,by+1,.7,dir*Math.PI/2);
   else for(let i=0;i<(actual==='three-arrows'?3:1);i++)prop('arrow',bx+dir*(12+pose.within*130+i*15),by+i*5+(actual==='high-shot'?-pose.within*45:actual==='low-shot'?pose.within*25:0),.7,dir*Math.PI/2+(actual==='high-shot'?-dir*.25:actual==='low-shot'?dir*.2:0));
  }
 }
 if(pose.lie&&['bed','mat'].includes(o.kind)&&!['side-rest','rise'].includes(actual)){
  // 베개는 머리 아래에, 이불은 몸통 아래쪽에만 덮는다.
  r(x-3,y-44,31,22,'#6c8d8e');r(x-3,y-44,31,3,'#c9d4be');r(x+22,y-41,3,18,'#58777b');
 }
 if(o.kind==='rope'&&use){
  const hy=y+(pose.handY-36)*2,rope='#c3a278',shadow='#775b3b';
  const segment=(xx,yy)=>{r(xx,yy,4,4,shadow);r(xx+1,yy,2,3,rope);};
  if(['coil','uncoil'].includes(actual)){
   const loops=actual==='coil'?phase+1:4-phase;
   for(let k=0;k<loops;k++)for(let i=0;i<16;i++){const a=i*Math.PI/8;segment(x+dir*17+Math.round(Math.cos(a)*(9+k*3)),hy+Math.round(Math.sin(a)*6)+k*2);}
  }else if(['tie','untie'].includes(actual)){
   for(let i=0;i<12;i++)segment(x+dir*16+(i%6)*3,hy+Math.round(Math.sin(i*1.5+phase)*4));
   r(x+dir*19,hy-2,5,6,rope);
  }else{
   for(let i=0;i<18;i++)segment(x+dir*(14+i*3),hy+(actual==='lower-rope'?i*3:Math.round(Math.sin(i*.3+phase)*3)));
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
