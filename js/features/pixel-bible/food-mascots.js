const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};

function face(c,eyeX=27,eyeY=31){
 r(c,eyeX,eyeY,3,4,'#302f35');r(c,eyeX+10,eyeY,3,4,'#302f35');
 r(c,eyeX,eyeY,1,1,'#fff9e8');r(c,eyeX+10,eyeY,1,1,'#fff9e8');
 r(c,eyeX+4,eyeY+5,1,2,'#955c51');r(c,eyeX+8,eyeY+5,1,2,'#955c51');r(c,eyeX+5,eyeY+7,3,1,'#955c51');
 r(c,eyeX-4,eyeY+4,3,2,'#f2a0a0');r(c,eyeX+14,eyeY+4,3,2,'#f2a0a0');
}
// Stepped, rounded lobes with a toasted crease, rather than pointed spikes.
function kernel(c,x,y){
 r(c,x+3,y,7,2,'#493b32');r(c,x,y+3,13,8,'#493b32');r(c,x+2,y+1,9,12,'#493b32');
 r(c,x+4,y+2,5,2,'#fffbe4');r(c,x+2,y+4,9,6,'#fff1c8');r(c,x+4,y+3,5,8,'#fff6d9');
 r(c,x+2,y+6,3,3,'#f1d49b');r(c,x+8,y+7,3,3,'#dfad68');r(c,x+6,y+8,2,3,'#bd7944');r(c,x+5,y+3,2,2,'#fffef1');
}

export function drawFoodMascot(c,name,frame=0,direction='down'){
 c.save();c.imageSmoothingEnabled=false;
 const step=frame%4, lift=step===1?1:step===3?-1:0;
 if(name==='상추'){
  // Layered, scalloped leaves frame a small face; the lower leaf forms a tunic.
  r(c,24,47+lift,7,7,'#294634');r(c,34,47-lift,7,7,'#294634');
  r(c,25,49+lift,5,3,'#6da354');r(c,35,49-lift,5,3,'#6da354');
  r(c,22,32,20,17,'#294634');r(c,24,34,16,12,'#70b957');r(c,27,37,10,9,'#9bd774');
  r(c,17,35+lift,7,10,'#294634');r(c,19,37+lift,4,6,'#9bd774');r(c,40,35-lift,7,10,'#294634');r(c,41,37-lift,4,6,'#9bd774');
  // Individual leaf lobes, bright veins, and darker folds make it read as lettuce.
  r(c,26,6,12,2,'#294634');r(c,21,8,22,3,'#294634');r(c,17,11,30,4,'#294634');r(c,14,15,36,12,'#294634');r(c,17,26,30,7,'#294634');r(c,21,31,22,3,'#294634');
  r(c,27,8,10,3,'#69b94f');r(c,22,11,20,4,'#79c95d');r(c,18,15,28,11,'#58a94c');r(c,20,25,24,5,'#77c65a');
  r(c,17,16,4,5,'#7ecb5e');r(c,45,17,3,6,'#86d066');r(c,20,27,5,3,'#92d467');r(c,39,27,5,3,'#8bd062');
  r(c,31,14,2,13,'#9ad77a');r(c,25,18,5,2,'#8bce69');r(c,35,20,5,2,'#85c963');
  face(c,26,20);
 }else{
  // A caramel-striped popcorn tub with fluffy kernels and small bouncing legs.
  r(c,22,31+lift,22,20,'#302f35');r(c,24,33+lift,18,16,'#c84f55');r(c,23,45+lift,20,4,'#fff0ce');r(c,25,35+lift,4,13,'#f3e6c7');r(c,33,35+lift,4,13,'#f3e6c7');
  r(c,24,49+lift,7,6,'#302f35');r(c,35,49-lift,7,6,'#302f35');
  r(c,25,50+lift,5,3,'#f2d6a7');r(c,36,50-lift,5,3,'#f2d6a7');
  r(c,17,35+lift,7,10,'#302f35');r(c,19,37+lift,4,6,'#f2d6a7');r(c,42,35-lift,7,10,'#302f35');r(c,43,37-lift,4,6,'#f2d6a7');
  kernel(c,17,17);kernel(c,35,16);kernel(c,23,8);kernel(c,32,7);kernel(c,26,16);
  r(c,23,24,20,8,'#fff1c8');
  face(c,27,22);
 }
 if(direction==='left'||direction==='right'){
  // A side glance distinguishes profile without changing the mascot silhouette.
  r(c,32,20,4,4,'#fff0cf');r(c,34,21,2,3,'#302f35');
 }
 if(direction==='up'){
  r(c,20,19,24,9,name==='상추'?'#397c47':'#f2dfb9');r(c,27,13,10,8,name==='상추'?'#5aa94d':'#ffeec7');
 }
 c.restore();
}
