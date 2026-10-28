export const GIMBAP_FRAME_SIZE=64;
export const GIMBAP_ROLL_FRAMES=16;
// World coordinates are measured in 24 px tiles and the mascot is drawn at
// 2× scale. Advance one 16-frame turn per circumference so the sprite sheet's
// frames track the distance travelled instead of spinning several times per
// body length.
const GIMBAP_BODY_RADIUS=21;
const GIMBAP_WORLD_TILE=24;
const GIMBAP_WORLD_DRAW_SCALE=2;
const GIMBAP_FRAMES_PER_WORLD_UNIT=GIMBAP_ROLL_FRAMES/(2*Math.PI*GIMBAP_BODY_RADIUS*GIMBAP_WORLD_DRAW_SCALE/GIMBAP_WORLD_TILE);
export const gimbapRollAngle=frame=>((frame%GIMBAP_ROLL_FRAMES)+GIMBAP_ROLL_FRAMES)%GIMBAP_ROLL_FRAMES*Math.PI*2/GIMBAP_ROLL_FRAMES;
export const gimbapRollFaceVisible=frame=>{
 const phase=((Math.trunc(frame)%GIMBAP_ROLL_FRAMES)+GIMBAP_ROLL_FRAMES)%GIMBAP_ROLL_FRAMES;
 // The supplied sheet turns the cut face away during the back half of a roll.
 // Frames 4 and 12 are edge-on; frames 5–11 show the plain back, without eyes,
 // mouth, or cheek blush appearing on the rear of the roll.
 return phase<4||phase>12;
};
export const gimbapRollSign=direction=>direction==='left'||direction==='up'?-1:1;
export const gimbapRollAxis=direction=>direction==='up'||direction==='down'?'vertical':'plane';
export const advanceGimbapRoll=(phase,distance,direction)=>phase+Math.max(0,distance)*GIMBAP_FRAMES_PER_WORLD_UNIT*gimbapRollSign(direction);
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};

function disk(c,cx,cy,rx,ry,color){
 c.fillStyle=color;
 for(let y=Math.ceil(cy-ry);y<=Math.floor(cy+ry);y++){
  const dy=(y-cy)/ry,half=Math.floor(rx*Math.sqrt(Math.max(0,1-dy*dy)));
  c.fillRect(cx-half,y,half*2+1,1);
 }
}

export function rotateGimbapPixels(source,angle,pivotX=(source.width-1)/2,pivotY=(source.height-1)/2,axis='plane'){
 const {width,height,data}=source;
 const out=typeof ImageData==='function'?new ImageData(width,height):{width,height,data:new Uint8ClampedArray(width*height*4)};
 const cx=pivotX,cy=pivotY;
 const cos=Math.cos(angle),sin=Math.sin(angle);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const dx=x-cx,dy=y-cy;
  // Inverse-map each destination pixel to the nearest source pixel. This
  // preserves hard pixel edges and binary alpha; Canvas rotate would soften
  // diagonals during intermediate-angle rasterization on some browsers.
  let sx,sy;
  if(axis==='vertical'){
   if(Math.abs(cos)<.2)continue;
   // Upward travel tumbles from the lower edge toward the upper edge;
   // downward travel uses the reverse sequence. A small depth projection
   // shifts the fillings across the face, making the travel direction visible.
   sy=Math.round(cy+dy/cos);
   const depthScale=1+.12*sin*((sy-cy)/(height*.32));
   sx=Math.round(cx+dx/depthScale);
  }else{
   sx=Math.round(cx+cos*dx+sin*dy);sy=Math.round(cy-sin*dx+cos*dy);
  }
  if(sx<0||sy<0||sx>=width||sy>=height)continue;
  const si=(sy*width+sx)*4,di=(y*width+x)*4;
  out.data[di]=data[si];out.data[di+1]=data[si+1];out.data[di+2]=data[si+2];out.data[di+3]=data[si+3];
 }
 return out;
}

// A round, friendly gimbap slice: seaweed outside, rice ring, colorful filling
// and a tiny face. Rotation is baked with nearest-pixel sampling for crisp roll frames.
function drawEdgeOnGimbap(c,angle){
 const drift=Math.sin(angle)>0?1:-1;
 disk(c,32,36,22,4,'#20252a');disk(c,32,36,20,2,'#174738');
 rect(c,22+drift,35,8,2,'#f0e9d8');rect(c,30,35,6,2,'#d89c3d');
 rect(c,35-drift,35,7,2,'#e95831');rect(c,28+drift,36,5,1,'#58a45c');
}

export function drawGimbap(c,frame=0,{rolling=false,direction='right'}={}){
 c.save();c.imageSmoothingEnabled=false;
 // Seaweed silhouette and its lighter inner edge.
 disk(c,32,36,21,21,'#20252a');disk(c,32,36,19,19,'#153f37');
 disk(c,31,35,17,17,'#f0e9d8');disk(c,31,34,15,15,'#fff9e9');
 // Rice grains and a few nori highlights add texture without muddy gradients.
 for(const [x,y,w,h,color] of [[21,29,2,1,'#d6d0bd'],[39,27,2,1,'#e2ddcb'],[20,39,2,2,'#e1dccb'],[40,41,2,1,'#d6d0bd'],[26,22,2,1,'#fffef4'],[35,24,2,1,'#fffef4'],[19,34,1,2,'#e4decc'],[42,35,1,2,'#ddd7c6']])rect(c,x,y,w,h,color);
 rect(c,15,28,2,4,'#2d6951');rect(c,47,39,2,4,'#2d6951');rect(c,44,26,2,3,'#387552');
 // The face belongs to the cut front. Hide it while the back of the roll faces
 // the viewer so cheek blush and facial marks never show on the rear frames.
 if(!rolling||gimbapRollFaceVisible(frame)){
  rect(c,25,44,3,4,'#20252a');rect(c,37,44,3,4,'#20252a');
  rect(c,22,48,4,2,'#ed9996');rect(c,40,48,4,2,'#ed9996');rect(c,30,49,6,1,'#965b50');
 }
 // Rolled fillings: seasoned burdock, spinach, egg, carrot, cucumber and radish.
 disk(c,28,29,6,5,'#ef883c');disk(c,35,28,5,5,'#ffdb55');disk(c,31,23,4,3,'#65a94b');disk(c,33,35,5,3,'#e8ba4d');
 rect(c,11,42,5,3,'#20252a');rect(c,48,42,5,3,'#20252a');rect(c,23,55,4,5,'#20252a');rect(c,37,55,4,5,'#20252a');
 // A crisp outer rim and two glints keep the circular silhouette readable.
 rect(c,29,17,6,1,'#315d4a');rect(c,18,30,1,5,'#e2dcc9');rect(c,45,45,2,4,'#163d35');
 if(rolling){
  const angle=gimbapRollAngle(Math.trunc(frame));
  const axis=gimbapRollAxis(direction);
  {
   const pixels=rotateGimbapPixels(c.getImageData(0,0,GIMBAP_FRAME_SIZE,GIMBAP_FRAME_SIZE),angle,32,36,axis);
   c.clearRect(0,0,GIMBAP_FRAME_SIZE,GIMBAP_FRAME_SIZE);c.putImageData(pixels,0,0);
   if(axis==='vertical'){c.globalCompositeOperation='destination-over';disk(c,32,36+Math.sin(angle)*5,21,Math.max(8,21*Math.abs(Math.cos(angle))),'#20252a');c.globalCompositeOperation='source-over';}
  }
 }
 // Keep the shadow horizontal and at a constant baseline; never rotate it.
 rect(c,17,59,30,2,'#263b3670');rect(c,21,58,22,1,'#40504466');
 c.restore();
}
