export const GIMBAP_FRAME_SIZE=64;
export const GIMBAP_ROLL_FRAMES=16;
export const gimbapRollAngle=frame=>((frame%GIMBAP_ROLL_FRAMES)+GIMBAP_ROLL_FRAMES)%GIMBAP_ROLL_FRAMES*Math.PI*2/GIMBAP_ROLL_FRAMES;
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};

// The silhouette tucks into a compact roll, then opens slightly between
// contacts. Sixteen nearest-neighbour poses keep the spin readable at 2×.
export function drawGimbap(c,frame=0,{rolling=false}={}){
 c.save();c.imageSmoothingEnabled=false;
 if(rolling){
  const phase=((frame%GIMBAP_ROLL_FRAMES)+GIMBAP_ROLL_FRAMES)%GIMBAP_ROLL_FRAMES;
  const contact=phase===0||phase===8;
  c.translate(32,33);c.rotate(gimbapRollAngle(phase));c.scale(contact?1.12:.94,contact?.78:1.03);c.translate(-32,-33);
 }
 // Ground shadow and boots.
 rect(c,15,54,34,2,'#263b36');rect(c,19,52,27,2,'#405044');
 if(rolling){
  // Tucked limbs follow the body instead of sticking out like a spinning pinwheel.
  rect(c,21,43,10,5,'#302f35');rect(c,22,44,7,3,'#70533e');
  rect(c,33,43,10,5,'#302f35');rect(c,35,44,7,3,'#70533e');
  rect(c,15,35,9,7,'#302f35');rect(c,17,36,6,4,'#9a6c4e');
  rect(c,40,35,9,7,'#302f35');rect(c,41,36,6,4,'#9a6c4e');
 }else{
  rect(c,22,46,8,7,'#302f35');rect(c,34,46,8,7,'#302f35');
  rect(c,23,47,6,4,'#70533e');rect(c,35,47,6,4,'#70533e');
  rect(c,24,35,6,13,'#36424a');rect(c,34,35,6,13,'#36424a');
  rect(c,22,32,20,16,'#302f35');rect(c,24,33,16,13,'#71513c');
  rect(c,25,35,14,9,'#8a6548');rect(c,28,37,8,5,'#684b39');rect(c,29,38,6,1,'#b08a5d');
  rect(c,20,31,24,4,'#302f35');rect(c,23,32,18,2,'#a28a61');
  rect(c,17,32,6,12,'#302f35');rect(c,18,34,4,8,'#9a6c4e');rect(c,15,42,5,4,'#302f35');rect(c,16,42,3,3,'#e0b28b');
  rect(c,41,32,6,12,'#302f35');rect(c,42,34,4,8,'#9a6c4e');rect(c,45,42,5,4,'#302f35');rect(c,46,42,3,3,'#e0b28b');
 }
 // Nori shell, rice rim, and a richer cross-section: egg, carrot, spinach,
 // cucumber, pickled radish, sesame specks, and soft rice highlights.
 rect(c,25,5,14,2,'#302f35');rect(c,22,7,20,2,'#302f35');rect(c,20,9,24,3,'#302f35');rect(c,19,12,26,10,'#302f35');rect(c,21,22,22,3,'#302f35');rect(c,24,25,16,2,'#302f35');
 rect(c,25,7,14,2,'#173c35');rect(c,22,9,20,3,'#215543');rect(c,21,12,22,9,'#efe6cd');rect(c,23,21,18,3,'#f5edda');rect(c,26,24,12,1,'#173c35');
 rect(c,25,11,5,3,'#e4a249');rect(c,31,10,5,4,'#e3bf4f');rect(c,37,12,4,4,'#759d63');rect(c,26,16,4,4,'#cf7355');rect(c,32,15,6,5,'#e2bd50');rect(c,38,17,3,3,'#6f9961');
 rect(c,24,14,1,4,'#fff8e5');rect(c,40,13,1,3,'#d5c9ad');rect(c,28,13,1,1,'#fff9e8');rect(c,35,12,1,1,'#fff7de');
 // Friendly face stays legible through the roll cycle.
 rect(c,28,18,2,3,'#302f35');rect(c,36,18,2,3,'#302f35');rect(c,30,22,6,1,'#985b51');
 rect(c,22,12,2,5,'#3b7558');rect(c,40,10,2,3,'#3b7558');rect(c,27,8,3,1,'#60906b');
 if(rolling){rect(c,24,27,16,2,'#302f35');rect(c,26,28,12,2,'#71513c');}
 c.restore();
}
