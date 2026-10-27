export const GIMBAP_FRAME_SIZE=64;
export const gimbapRollAngle=frame=>((Math.trunc(frame)%4)+4)%4*Math.PI/2;
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};

// 64×64 source-pixel mascot: seasoned seaweed/rice cross-section head, apron,
// boots, and a quarter-turn roll cycle. Rotation is stepped by whole pixels.
export function drawGimbap(c,frame=0,{rolling=false}={}){
 c.save();
 if(rolling){c.translate(32,34);c.rotate(gimbapRollAngle(frame));c.translate(-32,-34);}
 rect(c,17,53,30,3,'#263b36');rect(c,20,51,24,2,'#405044');
 rect(c,22,46,8,7,'#302f35');rect(c,34,46,8,7,'#302f35');
 rect(c,23,47,6,4,'#70533e');rect(c,35,47,6,4,'#70533e');
 rect(c,24,35,6,13,'#36424a');rect(c,34,35,6,13,'#36424a');
 rect(c,22,32,20,16,'#302f35');rect(c,24,33,16,13,'#71513c');
 rect(c,25,35,14,9,'#8a6548');rect(c,28,37,8,5,'#684b39');rect(c,29,38,6,1,'#b08a5d');
 rect(c,20,31,24,4,'#302f35');rect(c,23,32,18,2,'#a28a61');
 rect(c,17,32,6,12,'#302f35');rect(c,18,34,4,8,'#9a6c4e');rect(c,15,42,5,4,'#302f35');rect(c,16,42,3,3,'#e0b28b');
 rect(c,41,32,6,12,'#302f35');rect(c,42,34,4,8,'#9a6c4e');rect(c,45,42,5,4,'#302f35');rect(c,46,42,3,3,'#e0b28b');
 // Gimbap-head: nori shell, rice, egg, carrot, cucumber, and a small face.
 rect(c,25,5,14,2,'#302f35');rect(c,22,7,20,2,'#302f35');rect(c,20,9,24,3,'#302f35');rect(c,19,12,26,10,'#302f35');rect(c,21,22,22,3,'#302f35');rect(c,24,25,16,2,'#302f35');
 rect(c,25,7,14,2,'#173c35');rect(c,22,9,20,3,'#215543');rect(c,21,12,22,9,'#efe6cd');rect(c,23,21,18,3,'#f5edda');rect(c,26,24,12,1,'#173c35');
 rect(c,25,11,5,3,'#e4a249');rect(c,31,10,5,4,'#e3bf4f');rect(c,37,12,4,4,'#759d63');rect(c,26,16,4,4,'#cf7355');rect(c,32,15,6,5,'#e2bd50');rect(c,38,17,3,3,'#6f9961');
 rect(c,28,18,2,3,'#302f35');rect(c,36,18,2,3,'#302f35');rect(c,30,22,6,1,'#985b51');
 rect(c,22,12,2,5,'#3b7558');rect(c,40,10,2,3,'#3b7558');rect(c,27,8,3,1,'#60906b');
 c.restore();
}
