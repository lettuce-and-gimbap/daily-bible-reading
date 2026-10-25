import {characterStyle} from './art.js';
// Dedicated event actors: articulated limbs and layered costumes in source pixels.
export function drawEventActor(ctx,person,index,{x,y,time=0,pose='speak',face=1,closeup=false}={}){
 const s=characterStyle(person.name,index,person.role,person.refs||[],false),c=ctx;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const ink='#302d35',skin='#e5bd97',light='#f8d7ac',shade='#bb896c',hair=s.hair||'#46372e',coat=s.coat||'#64758a';
 const beat=Math.floor(time*8)/8,phase=Math.min(1,(time%8)/4),reach=['pour','strike','shoot','offer'].includes(pose)?Math.sin(phase*Math.PI):0;
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(face,1);
 if(pose==='lie'){c.translate(0,-25);c.rotate(-Math.PI/2);c.translate(0,40);}
 if(pose==='kneel')c.translate(0,17);
 const limb=(a,b,width,color)=>{c.strokeStyle=ink;c.lineWidth=width+3;c.lineCap='square';c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.strokeStyle=color;c.lineWidth=width;c.stroke();};
 r(-13,0,28,3,'#172e3c44');
 limb([-5,-35],[-7,-4],6,'#574d49');limb([5,-35],[8,-4],6,'#574d49');r(-11,-4,10,4,'#382e2a');r(3,-4,12,4,'#382e2a');
 limb([-12,-70],[-16,-51],6,coat);limb([-16,-51],[-12,-36],5,skin);
 r(-13,-74,27,43,ink);r(-11,-72,23,39,coat);r(-9,-71,3,37,'#ffffff18');r(7,-67,4,33,'#00000022');
 for(let k=0;k<4;k++)r(-7+k*5,-50,1,16,'#00000018');
 r(-12,-44,25,3,'#5c4432');r(-1,-45,4,5,'#d6b76c');
 if(s.mantle||s.royal||s.shawl){r(-17,-74,8,40,ink);r(-15,-72,5,37,coat);r(-15,-72,2,36,'#bdab7c');}
 r(-4,-81,8,9,shade);r(-3,-81,5,7,skin);
 r(-12,-105,24,24,ink);r(-11,-108,21,7,hair);r(-14,-101,5,18,hair);r(-9,-102,19,18,skin);r(-7,-101,14,14,light);r(8,-96,4,7,skin);
 r(-10,-106,20,5,hair);r(-11,-101,5,7,hair);r(-10,-105,5,2,'#ffffff20');r(1,-104,6,2,'#ffffff18');
 const sad=['kneel','lie'].includes(pose);r(-5,-96,4,1,ink);r(3,-96,4,1,ink);r(-4,-94,2,3,ink);r(4,-94,2,3,ink);r(-3,-94,1,1,'#fff');r(5,-94,1,1,'#fff');r(0,-91,2,3,shade);r(-3,-85,7,1,shade);
 if(Math.floor(time*3)%2&&!sad)r(-2,-86,5,2,'#754e48');
 if(s.beard){r(-7,-85,15,6,s.beard);r(-4,-80,8,4,s.beard);}
 if(s.crown){r(-13,-111,26,5,'#d0a447');for(let k=0;k<3;k++)r(-12+k*10,-116,5,7,'#e5ca77');r(-1,-110,3,3,'#a94747');}
 if(s.turban){r(-13,-109,26,7,'#e8dbbb');r(-10,-111,20,3,'#fff1cb');}
 limb([11,-70],[18+reach*6,-56-reach*16],6,coat);limb([18+reach*6,-56-reach*16],[16+reach*20,-40-reach*35],5,skin);r(13+reach*20,-43-reach*35,7,7,light);
 if(pose==='kneel'){limb([-12,-36],[-3,-61],4,skin);}
 c.restore();
}
