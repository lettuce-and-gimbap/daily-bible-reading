// Connected, integer-pixel strands; no overlapping square beads.
export function pixelRope(r,points,{width=2,shade='#765839',color='#c7a675',light='#e5cc9a'}={}){
 const pixels=[];
 for(let i=1;i<points.length;i++){
  let [x,y]=points[i-1].map(Math.round);const [tx,ty]=points[i].map(Math.round),dx=Math.abs(tx-x),dy=-Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1;let error=dx+dy;
  for(;;){pixels.push([x,y]);if(x===tx&&y===ty)break;const e=2*error;if(e>=dy){error+=dy;x+=sx;}if(e<=dx){error+=dx;y+=sy;}}
 }
 for(const [x,y]of pixels)r(x-1,y-1,width+2,width+2,shade);
 for(const [x,y]of pixels)r(x,y,width,width,color);
 for(let i=0;i<pixels.length;i+=6){const [x,y]=pixels[i];r(x,y,1,1,light);}
}
export function ropeLoop(cx,cy,rx,ry){return Array.from({length:33},(_,i)=>{const a=i*Math.PI/16;return [cx+Math.cos(a)*rx,cy+Math.sin(a)*ry];});}
