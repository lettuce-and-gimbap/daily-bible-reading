export const GIMBAP_FRAME_SIZE=64;
export const GIMBAP_ROLL_FRAMES=16;
export const gimbapRollAngle=frame=>((frame%GIMBAP_ROLL_FRAMES)+GIMBAP_ROLL_FRAMES)%GIMBAP_ROLL_FRAMES*Math.PI*2/GIMBAP_ROLL_FRAMES;
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};

function disk(c,cx,cy,rx,ry,color){
 c.fillStyle=color;
 for(let y=Math.ceil(cy-ry);y<=Math.floor(cy+ry);y++){
  const dy=(y-cy)/ry,half=Math.floor(rx*Math.sqrt(Math.max(0,1-dy*dy)));
  c.fillRect(cx-half,y,half*2+1,1);
 }
}

export function rotateGimbapPixels(source,angle){
 const {width,height,data}=source;
 const out=typeof ImageData==='function'?new ImageData(width,height):{width,height,data:new Uint8ClampedArray(width*height*4)};
 const cx=(width-1)/2,cy=(height-1)/2;
 const cos=Math.cos(angle),sin=Math.sin(angle);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const dx=x-cx,dy=y-cy;
  // Inverse-map each destination pixel to the nearest source pixel. This
  // preserves hard pixel edges and binary alpha; Canvas rotate would soften
  // diagonals during intermediate-angle rasterization on some browsers.
  const sx=Math.round(cx+cos*dx+sin*dy),sy=Math.round(cy-sin*dx+cos*dy);
  if(sx<0||sy<0||sx>=width||sy>=height)continue;
  const si=(sy*width+sx)*4,di=(y*width+x)*4;
  out.data[di]=data[si];out.data[di+1]=data[si+1];out.data[di+2]=data[si+2];out.data[di+3]=data[si+3];
 }
 return out;
}

// A round, friendly gimbap slice: seaweed outside, rice ring, colorful filling
// and a tiny face. Rotation is baked with nearest-pixel sampling for crisp roll frames.
export function drawGimbap(c,frame=0,{rolling=false}={}){
 c.save();c.imageSmoothingEnabled=false;
 // Seaweed silhouette and its lighter inner edge.
 disk(c,32,36,22,20,'#20252a');disk(c,32,36,20,18,'#153f37');
 disk(c,31,35,18,17,'#f0e9d8');disk(c,31,34,16,15,'#fff9e9');
 // Rice grains and a few nori highlights add texture without muddy gradients.
 for(const [x,y,w,h,color] of [[21,29,2,1,'#d6d0bd'],[39,27,2,1,'#e2ddcb'],[20,39,2,2,'#e1dccb'],[40,41,2,1,'#d6d0bd'],[26,22,2,1,'#fffef4'],[35,24,2,1,'#fffef4'],[19,34,1,2,'#e4decc'],[42,35,1,2,'#ddd7c6']])rect(c,x,y,w,h,color);
 rect(c,15,28,2,4,'#2d6951');rect(c,47,39,2,4,'#2d6951');rect(c,44,26,2,3,'#387552');
 // Tiny eyes and smile sit on the rice just above the colorful filling.
 rect(c,27,25,2,3,'#302f35');rect(c,36,25,2,3,'#302f35');rect(c,30,30,6,1,'#965b50');
 // Rolled fillings: seasoned burdock, spinach, egg, carrot, cucumber and radish.
 rect(c,27,32,13,5,'#69482e');rect(c,29,33,9,2,'#8b6038');rect(c,30,34,2,1,'#bd8b52');rect(c,35,35,3,1,'#b9854d');
 rect(c,30,36,7,9,'#17834e');rect(c,32,37,2,7,'#36a35a');rect(c,35,38,1,5,'#0f6b43');
 rect(c,23,37,8,9,'#f1b53e');rect(c,24,38,6,6,'#ffd45c');rect(c,25,39,2,1,'#fff0a1');
 rect(c,37,36,9,12,'#e95730');rect(c,39,37,6,9,'#ff9a32');rect(c,40,39,4,2,'#ffc24a');rect(c,39,43,5,2,'#ffb13b');
 rect(c,31,43,7,5,'#edcf54');rect(c,32,44,5,3,'#ffe782');rect(c,21,44,5,4,'#cfad45');
 // A crisp outer rim and two glints keep the circular silhouette readable.
 rect(c,29,17,6,1,'#315d4a');rect(c,18,30,1,5,'#e2dcc9');rect(c,45,45,2,4,'#163d35');
 if(rolling){
  const angle=gimbapRollAngle(Math.trunc(frame));
  const pixels=rotateGimbapPixels(c.getImageData(0,0,GIMBAP_FRAME_SIZE,GIMBAP_FRAME_SIZE),angle);
  c.clearRect(0,0,GIMBAP_FRAME_SIZE,GIMBAP_FRAME_SIZE);c.putImageData(pixels,0,0);
 }
 // Keep the soft ground shadow horizontal; never rotate or filter the sprite.
 rect(c,17,58,30,2,'#263b3670');rect(c,21,57,22,1,'#40504466');
 c.restore();
}
