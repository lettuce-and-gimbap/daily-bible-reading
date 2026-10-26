import {backgroundFor} from './backgrounds.js';
import {WORLD} from './camera.js';
// Match the water shapes drawn by biome-art and landscape, in world pixels.
export function waterAt(key,x,y){
 const m=backgroundFor(key).motif,w=WORLD.width,h=WORLD.height,px=x*24,py=y*24;
 const inPool=(cx,cy,rx,ry)=>((px-cx)/rx)**2+((py-cy)/ry)**2<1;
 if(['lake','galilee'].includes(m))return py>=h-126||inPool(w*(m==='lake'?.2:.83),h*.7,w*.22,h*.25);
 if(m==='pasture')return inPool(w*.22,h*.7,100,56);
 if(m==='stars')return inPool(w*.75,h*.73,130,70);
 if(['river','garden','newcity'].includes(m)&&py>=150&&py<h-80){const left=w*(m==='garden'?.24:m==='newcity'?.68:.72)+Math.sin(Math.floor((py-150)/8)*8/140+150/140)*w*.065;return px>=left&&px<left+82;}
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
