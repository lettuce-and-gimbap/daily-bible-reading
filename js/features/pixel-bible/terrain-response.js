import {backgroundFor} from './backgrounds.js';
import {WORLD} from './camera.js';
const TILE=WORLD.tile;
const riverMotif=m=>['river','garden','newcity'].includes(m);
// Keep the collision geometry aligned with the pixel-art river and the road
// painted over it. The crossing is dry because the road itself is walkable.
export function riverLeftAt(m,py){
 const y=150+Math.floor((py-150)/8)*8;
 return WORLD.width*(m==='garden'?.24:m==='newcity'?.68:.72)+Math.sin(y/140)*WORLD.width*.065;
}
function roadAt(m,px,py){
 if(px<80||px>=WORLD.width-80)return false;
 const x=80+Math.floor((px-80)/12)*12;
 const top=WORLD.height*.52+Math.sin(x/(m==='mountains'?170:310))*WORLD.height*.065;
 return px<x+14&&py>=top&&py<top+30;
}
// Match the water shapes drawn by biome-art and landscape, in world pixels.
export function waterAt(key,x,y){
 const m=backgroundFor(key).motif,w=WORLD.width,h=WORLD.height,px=x*TILE,py=y*TILE;
 const inPool=(cx,cy,rx,ry)=>((px-cx)/rx)**2+((py-cy)/ry)**2<1;
 if(['lake','galilee'].includes(m))return py>=h-126||inPool(w*(m==='lake'?.2:.83),h*.7,w*.22,h*.25);
 if(m==='pasture')return inPool(w*.22,h*.7,100,56);
 if(m==='stars')return inPool(w*.75,h*.73,130,70);
 if(riverMotif(m)&&py>=150&&py<h-80){
  if(roadAt(m,px,py))return false;
  const left=riverLeftAt(m,py);return px>=left&&px<left+82;
 }
 return false;
}
export function dryLanding(key,from,blocked){
 const ox=Math.round(from.x),oy=Math.round(from.y);let closest=null,closestDistance=Infinity;
 for(let radius=1;radius<80;radius++){
  const ring=[];
  for(let dx=-radius;dx<=radius;dx++)ring.push({x:ox+dx,y:oy-radius},{x:ox+dx,y:oy+radius});
  for(let dy=-radius+1;dy<radius;dy++)ring.push({x:ox-radius,y:oy+dy},{x:ox+radius,y:oy+dy});
  ring.sort((a,b)=>Math.hypot(a.x-ox,a.y-oy)-Math.hypot(b.x-ox,b.y-oy));
  for(const p of ring){
   const distance=Math.hypot(p.x-ox,p.y-oy);
   if(distance>=closestDistance)continue;
   if(!waterAt(key,p.x,p.y)&&!blocked(p.x,p.y)){closest=p;closestDistance=distance;}
  }
  // Every point outside this square is at least `radius + 1` away.
  if(closest&&closestDistance<=radius+1)return closest;
 }
 return closest;
}
