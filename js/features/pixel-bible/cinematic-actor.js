import {characterStyle} from './art.js';
// Dedicated event actors: articulated limbs and layered costumes in source pixels.
export function drawEventActor(ctx,person,index,{x,y,time=0,pose='speak',face=1,closeup=false,emotion='resolve',progress=0,prop=null}={}){
 const s=characterStyle(person.name,index,person.role,person.refs||[],false),c=ctx;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const ink='#302d35',skin='#e5bd97',light='#f8d7ac',shade='#bb896c',hair=s.hair||'#46372e',coat=s.coat||'#64758a';
 const beat=Math.floor(time*8)/8,phase=Math.min(1,progress*1.8),reach=['pour','strike','shoot','offer'].includes(pose)?Math.sin(phase*Math.PI/2):0;
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(face,1);
 if(pose==='lie'){c.translate(0,-25);c.rotate(-Math.PI/2);c.translate(0,40);}
 if(pose==='kneel')c.translate(0,17);
 if(pose==='walk')c.translate(Math.round(progress*35),-Math.round(Math.abs(Math.sin(time*5))*2));
 const limb=(a,b,width,color)=>{c.strokeStyle=ink;c.lineWidth=width+3;c.lineCap='square';c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.strokeStyle=color;c.lineWidth=width;c.stroke();};
 r(-13,0,28,3,'#172e3c44');
 if(pose==='kneel'){limb([-5,-35],[-12,-16],6,'#574d49');limb([-12,-16],[5,-15],6,'#574d49');limb([5,-35],[14,-17],6,'#574d49');r(3,-17,15,5,'#382e2a');}else{limb([-5,-35],[-7,-4],6,'#574d49');limb([5,-35],[8,-4],6,'#574d49');r(-11,-4,10,4,'#382e2a');r(3,-4,12,4,'#382e2a');}
 limb([-12,-70],[-16,-51],6,coat);limb([-16,-51],[-12,-36],5,skin);
 r(-13,-74,27,43,ink);r(-11,-72,23,39,coat);r(-9,-71,3,37,'#ffffff18');r(7,-67,4,33,'#00000022');
 for(let k=0;k<4;k++)r(-7+k*5,-50,1,16,'#00000018');
 r(-12,-44,25,3,'#5c4432');r(-1,-45,4,5,'#d6b76c');
 if(s.mantle||s.royal||s.shawl){r(-17,-74,8,40,ink);r(-15,-72,5,37,coat);r(-15,-72,2,36,'#bdab7c');}
 r(-4,-81,8,9,shade);r(-3,-81,5,7,skin);
 r(-12,-105,24,24,ink);r(-11,-108,21,7,hair);r(-14,-101,5,18,hair);r(-9,-102,19,18,skin);r(-7,-101,14,14,light);r(8,-96,4,7,skin);
 r(-10,-106,20,5,hair);r(-11,-101,5,7,hair);r(-10,-105,5,2,'#ffffff20');r(1,-104,6,2,'#ffffff18');
 const sad=['sorrow','fear'].includes(emotion);if(emotion==='surprise'){r(-6,-98,4,1,ink);r(3,-98,4,1,ink);} r(-5,-96,4,1,ink);r(3,-96,4,1,ink);r(-4,-94,2,3,ink);r(4,-94,2,3,ink);r(-3,-94,1,1,'#fff');r(5,-94,1,1,'#fff');r(0,-91,2,3,shade);r(-3,-85,7,1,shade);
 if(Math.floor(time*3)%2&&!sad)r(-2,-86,5,2,'#754e48');
 if(s.beard){r(-7,-85,15,6,s.beard);r(-4,-80,8,4,s.beard);}
 if(s.crown){r(-13,-111,26,5,'#d0a447');for(let k=0;k<3;k++)r(-12+k*10,-116,5,7,'#e5ca77');r(-1,-110,3,3,'#a94747');}
 if(s.turban){r(-13,-109,26,7,'#e8dbbb');r(-10,-111,20,3,'#fff1cb');}
 limb([11,-70],[18+reach*6,-56-reach*16],6,coat);limb([18+reach*6,-56-reach*16],[16+reach*20,-40-reach*35],5,skin);r(13+reach*20,-43-reach*35,7,7,light);
 if(pose==='refuse'){limb([12,-70],[22,-65],5,coat);limb([22,-65],[24,-82],5,skin);r(21,-88,7,8,light);}
 if(pose==='tear'){limb([-12,-70],[-4-progress*10,-59],5,skin);limb([12,-70],[4+progress*10,-59],5,skin);r(-1,-70,2,Math.round(progress*28),skin);}
 if(pose==='strike'&&prop==='cloak'){r(30,-78,14,24,s.coat||'#967351');r(31,-77,2,23,'#d2bc86');}
 if(pose==='pour'){r(28,-79,9,14,'#b1804e');r(29,-81,7,3,'#e2c995');}
 if(pose==='read'){r(-11,-60,23,16,'#e8d6a5');r(-10,-61,21,2,'#b59b61');for(let j=0;j<3;j++)r(-8,-56+j*3,16,1,'#887350');}
 if(pose==='shoot'){limb([15,-64],[37,-70],4,skin);c.strokeStyle='#c7a474';c.lineWidth=2;c.beginPath();c.arc(36,-68,17,-1.4,1.4);c.stroke();r(18,-69,progress>.65?Math.round(progress*60):28,1,'#e2d1a3');}
 if(pose==='kneel'){limb([-12,-36],[-3,-61],4,skin);}
 c.restore();
}
