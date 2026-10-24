import {heldObject,objectPresentation} from './object-response.js';
// Original 2D feedback: change the worked part, never replace the object's identity.
export function drawWorkResult(c,n,p,x,y,time){
 if(!p||n.creature||!n.usingObject||p.unique)return;
 const o=n.usingObject,g=p.actual,use=p.phase===1||p.phase===2;if(!use)return;
 const held=heldObject(n,time),s=objectPresentation(o.kind).scale,ox=held?held.x*24:o.x*24,oy=held?held.y*24:o.y*24;
 const step=Math.floor(p.within*4),dir=n.direction==='left'?-1:1;
 const r=(xx,yy,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(xx),Math.round(yy),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
 if(['cap','close'].includes(g)&&['oil','olive-oil','jar','pitcher','perfume','myrrh','honey','milk','wine','cup','bowl'].includes(o.kind)){
  const lift=(g==='cap'?step:3-step)*3;r(ox-3*s,oy-15*s-lift,6*s,2*s,'#9b7951');
 }
 if(['gather','harvest','thresh','bundle'].includes(g)&&['field','grain','wheat','barley'].includes(o.kind)){
  const tx=x+dir*25;for(let i=0;i<5;i++){r(tx+i*3, y-17-i%2*3,1,20,'#bd9d59');r(tx-1+i*3,y-20-i%2*3,3,6,'#e3cb7d');}
  r(tx-1,y-6,16,2,'#866445');
 }
 if(['sow','plant-staff'].includes(g)&&['field','grain','wheat','barley','seed','mustard'].includes(o.kind)){
  for(let i=0;i<=step;i++){r(x+dir*(20+i*8),y+6,6,2,'#806643');r(x+dir*(23+i*8),y+3,1,3,'#8da663');}
 }
 if(['turn','grind'].includes(g)&&['wheel','millstone'].includes(o.kind)){
  const cy=oy-9*s;for(let i=0;i<4;i++){const a=(i+step/4)*Math.PI/2;for(let j=1;j<9;j++)r(ox+Math.cos(a)*j*s,cy+Math.sin(a)*j*s*.45,2,1,'#d4bc8d');}
 }
 if(['open','close','push','pull'].includes(g)&&['gate','house','palace'].includes(o.kind)){
  const w=(g==='close'?step+1:4-step)*3;r(ox-7*s,oy-14*s,w,18*s,'#78583c');r(ox-6*s+w-3,oy-8*s,2,2,'#d6bb72');
 }
 if(['fill','scoop'].includes(g)&&['basin','laver','well','water','water-supply','jar','bowl'].includes(o.kind)){
  r(ox-5*s,oy-(4+step)*s,10*s,1,'#abd8da');
 }
 if(['warm','tend','fan','trim'].includes(g)&&['fire','oven','lamp','lampstand','candle','torch'].includes(o.kind)){
  const fy=oy-(o.kind==='fire'?8:17)*s;for(let i=0;i<3;i++)r(ox-3+i*3,fy-step*2-i%2*3,2,5+i%2*3,i===1?'#ffe6a0':'#d99b50');
 }
}
