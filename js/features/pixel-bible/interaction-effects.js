import {drawWorldObject} from './art.js';
// 일시적인 결과만 그린다. 저장된 배치와 배경은 바꾸지 않는다.
export function drawInteractionEffects(c,n,pose,x,y,time){
 if(!pose||!n.usingObject)return;
 const o=n.usingObject,phase=pose.phase,use=phase===1||phase===2,dir=n.direction==='left'?-1:1;
 const r=(xx,yy,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(xx),Math.round(yy),w,h);};
 const prop=(kind,xx,yy,scale=.6,tilt=0)=>drawWorldObject(c,{kind,x:xx/24,y:yy/24},24,{scale,tilt,held:true});
 const actual=pose.actual||pose.gesture;
 if(['nock','aim','shoot','draw','three-arrows'].includes(actual)&&['arrow','bow'].includes(o.kind)){
  if(use){
   const bx=x+dir*18,by=y+(pose.handY-36)*2,stretch=['draw','shoot','three-arrows'].includes(actual)?5:1;
   for(let i=0;i<7;i++)r(bx+dir*(7-Math.abs(3-i)*2),by-15+i*5,2,5,'#b49262');
   r(bx-dir*stretch,by-15,1,31,'#e9dcb1');
   if(phase!==2||!['shoot','three-arrows'].includes(actual))prop('arrow',bx,by+1,.7,dir*Math.PI/2);
   else for(let i=0;i<(actual==='three-arrows'?3:1);i++)prop('arrow',bx+dir*(12+pose.within*130+i*15),by+i*5,.7,dir*Math.PI/2);
  }
 }
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
