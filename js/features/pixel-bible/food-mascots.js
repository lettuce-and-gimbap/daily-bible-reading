const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};

function face(c,eyeX=27,eyeY=31){r(c,eyeX,eyeY,2,3,'#302f35');r(c,eyeX+10,eyeY,2,3,'#302f35');r(c,eyeX+4,eyeY+7,5,1,'#955c51');r(c,eyeX-3,eyeY+5,2,2,'#e99b9b');r(c,eyeX+13,eyeY+5,2,2,'#e99b9b');}

export function drawFoodMascot(c,name,frame=0,direction='down'){
 c.save();c.imageSmoothingEnabled=false;
 const step=frame%4, lift=step===1?1:step===3?-1:0;
 if(name==='상추'){
  // Layered, scalloped leaves frame a small face; the lower leaf forms a tunic.
  // Individual leaf lobes, bright veins, and darker folds make it read as lettuce.
  r(c,26,6,12,2,'#294634');r(c,21,8,22,3,'#294634');r(c,17,11,30,4,'#294634');r(c,14,15,36,12,'#294634');r(c,17,26,30,7,'#294634');r(c,21,31,22,3,'#294634');
  r(c,27,8,10,3,'#69b94f');r(c,22,11,20,4,'#79c95d');r(c,18,15,28,11,'#58a94c');r(c,20,25,24,5,'#77c65a');
  r(c,17,16,4,5,'#7ecb5e');r(c,45,17,3,6,'#86d066');r(c,20,27,5,3,'#92d467');r(c,39,27,5,3,'#8bd062');
  r(c,31,14,2,13,'#9ad77a');r(c,25,18,5,2,'#8bce69');r(c,35,20,5,2,'#85c963');
  face(c,26,20);
 }else{
  // A caramel-striped popcorn tub with fluffy kernels and small bouncing legs.
  r(c,22,31+lift,22,20,'#302f35');r(c,24,33+lift,18,16,'#c84f55');r(c,23,45+lift,20,4,'#fff0ce');r(c,25,35+lift,4,13,'#f3e6c7');r(c,33,35+lift,4,13,'#f3e6c7');
  // Popcorn puffs with distinct butter highlights and caramel ribbons.
  r(c,22,16,7,14,'#302f35');r(c,35,15,8,15,'#302f35');r(c,27,10,9,19,'#302f35');r(c,17,21,9,11,'#302f35');r(c,39,21,9,11,'#302f35');r(c,24,14,7,14,'#fff0c9');r(c,36,13,6,15,'#ffefc4');r(c,29,8,7,19,'#fff5d5');r(c,19,23,7,7,'#f5dfae');r(c,41,23,6,7,'#f6e2b7');
  r(c,25,16,2,4,'#eacb8e');r(c,37,17,2,4,'#e9ca88');r(c,30,10,2,5,'#fffbe7');r(c,20,24,2,3,'#fff8dd');
  r(c,28,28,2,4,'#b66a38');r(c,33,28,2,4,'#b66a38');r(c,23,31,3,2,'#c97a3e');r(c,39,31,3,2,'#c97a3e');
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
