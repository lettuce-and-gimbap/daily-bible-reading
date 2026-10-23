// 동물은 네 발/날개/지느러미/마디, 식물은 고정된 줄기로 그린다.
export function drawCreature(c,d,x,y,{frame=0,direction='down',pose=null,time=0,hanging=false}={}){
 const O='#343c39',color=d.color,light='#ece1c1',dark='#6b705d';
 c.save();c.translate(x,y);
 if(direction==='left'){c.scale(-1,1);}
 const stage=pose?.phase||0,use=stage===1||stage===2,action=pose?.creatureAction;
 const step=[0,1,0,-1][frame%4],rest=action==='rest',down=use&&['drink','sip','graze','peck','sniff'].includes(action)?4:0;
 const r=(x,y,w,h,col=O)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);};
 if(d.kind==='plant'){
  const sway=hanging?step:use?1:0;
  r(-2,-20,4,21,'#987a51');r(-1,-19,1,19,'#c2a16c');
  if(action==='absorb'&&use){for(let i=0;i<3;i++)r(-7+i*6,-3-stage,2,3,'#8bbec7');}
  if(['tree','palm'].includes(d.body)){
   if(d.body==='palm'){for(let i=0;i<4;i++){r(-15+i*3+sway,-33+i*3,30-i*6,3,color);r(-14+i*2,-28+i*3,3,9,color);}}
   else{r(-9+sway,-32,18,3);r(-14+sway,-29,28,17);r(-11+sway,-12,22,3);r(-8+sway,-30,16,3,color);r(-12+sway,-27,24,14,color);r(-8+sway,-13,16,2,color);r(-8+sway,-27,7,4,'#a6bb86');}
   if(d.id==='fig-tree')for(const [xx,yy]of [[-7,-20],[4,-16],[8,-24]])r(xx+sway,yy,3,3,'#b38d9b');
   if(d.id==='olive-tree')for(const xx of [-7,4,9])r(xx+sway,-20+xx%3,2,2,'#5b7051');
  }else if(d.body==='vine'){
   for(let i=0;i<6;i++){r(-12+i*4,-7-i%3*4,6,2,color);r(-10+i*4,-12-i%3*3,5,5,color);}
   if(d.id==='vine')for(let i=0;i<5;i++)r(-3+i%2*3,-13+i*2,3,3,'#8a6f9c');
  }else{
   for(const xx of [-7,0,7]){r(xx+sway,-22+Math.abs(xx),1,23-Math.abs(xx),color);r(xx-3+sway,-14+Math.abs(xx)/2,4,2,color);}
   if(d.body==='flower'){r(-4+sway,-26,9,5,light);r(-2+sway,-28,5,9,light);r(-1+sway,-25,3,3,'#dfbd70');}
   if(d.body==='grass')for(const xx of [-7,0,7]){r(xx-2+sway,-24+Math.abs(xx),5,7,'#ddc27a');r(xx+sway,-24+Math.abs(xx),1,5,light);}
   if(d.body==='shrub'){r(-10+sway,-17,20,13,color);r(-6+sway,-21,12,5,color);}
  }
  c.restore();return;
 }
 if(d.body==='fish'){
  r(-24,0,49,4,'#8abdc5');r(-20,4,40,2,'#a5d0ce');r(-20,-2,14,2,'#d6e7d5');
  const swim=use&&action==='dive'?3:0;
  r(-13,-14+swim,22,2);r(-16,-12+swim,28,10);r(-12,-2+swim,22,2);r(-14,-11+swim,24,8,color);
  r(-21,-14+step,6,14,color);r(-7,-18+swim,8,4,color);r(-5,-10+swim,3,8,'#b9d2c9');r(7,-10+swim,2,2);r(10,-6+swim,3,1);
 }else if(d.body==='snake'){
  for(let i=0;i<8;i++){const yy=-5+Math.round(Math.sin(i+frame)*2);r(-20+i*4,yy,6,5);r(-19+i*4,yy,4,3,color);}
  r(9,-12-down,10,9);r(10,-11-down,8,7,color);r(16,-10-down,1,2);if(use)r(18,-6-down,4,1,'#b77e72');
 }else if(d.body==='insect'){
  for(let i=0;i<3;i++){r(-7+i*6,-9,7,7);r(-6+i*6,-8,5,5,color);r(-6+i*6,-2,1,4+step,color);}
  r(10,-13,1,6);r(13,-13,1,6);r(10,-7,1,1,light);
  if(d.id==='bee'){r(-4,-16+step,5,7,'#d0e3d5');r(2,-16-step,5,7,'#d0e3d5');r(0,-8,2,5,O);}
  if(d.id==='locust'){r(-8,-5,6,2,color);r(-10,-3,2,6,color);}
 }else if(d.body==='hopper'){
  const hop=rest?0:Math.abs(step)*3;
  r(-11,-13-hop,22,11);r(-10,-12-hop,20,9,color);r(-9,-21-hop,20,12);r(-8,-20-hop,18,10,color);
  for(const xx of [-6,6]){r(xx,-24-hop,5,7,color);r(xx+1,-23-hop,3,4,light);r(xx+2,-22-hop,1,2);}
  r(-16,-7-hop,7,6,color);r(9,-7-hop,7,6,color);r(-17,-2,10,2,color);r(8,-2,10,2,color);r(-4,-12-hop,9,1,'#5f7961');
 }else if(d.body==='bird'){
  r(-10,-18,17,15);r(-9,-17,15,13,color);r(3,-25+down,10,10);r(4,-24+down,8,8,color);r(11,-20+down,5,3,'#c49c59');r(9,-23+down,1,2);
  r(-7,-14+(hanging?step*2:step),9,6,d.id==='raven'?'#343b48':'#b9b6a0');r(-14,-12,5,5,color);
  for(const xx of [-4,4]){r(xx,-3,1,5,'#a17c4f');r(xx,-1+step,4,1,'#a17c4f');}
  if(d.id==='eagle'){r(-12,-18,14,4,'#665944');r(-12,-14,10,6,'#665944');r(9,-17+down,5,3,'#b7965a');}
  if(d.id==='rooster')r(5,-28+down,7,3,'#b46c61');
 }else{
  const yy=rest?4:0;
  if(['up','down'].includes(direction)){
   r(-8,-22+yy,16,18);r(-7,-21+yy,14,16,color);r(-7,-5+yy,4,6-step);r(3,-5+yy,4,6+step);
   r(-7,-33+yy,14,14);r(-6,-32+yy,12,12,color);r(-8,-37+yy,3,8,color);r(5,-37+yy,3,8,color);
   if(direction==='down'){r(-4,-29+yy,1,2);r(3,-29+yy,1,2);r(-4,-24+yy,8,3,light);r(-2,-24+yy,1,1);r(1,-24+yy,1,1);}
   else r(-1,-14+yy,2,12,dark);
   if(d.id==='sheep'){r(-9,-22+yy,18,9,light);r(-7,-14+yy,14,8,light);}
   c.restore();return;
  }
  r(-16,-20+yy,27,15);r(-15,-19+yy,25,13,color);r(-13,-19+yy,8,3,'#ffffff25');
  for(const [i,xx]of [-13,-6,4,9].entries()){const lift=rest?3:(i%2?step:-step);r(xx,-6+yy,3,6-lift);r(xx+1,-6+yy,1,4-lift,color);}
  r(-19,-19+yy,3,9,color);r(-20,-12+yy,2,5,color);
  const hx=9,hy=-26+down+yy;
  if(d.id==='lion'){r(hx-4,hy-2,16,19,'#987249');}
  r(hx,hy,11,13);r(hx+1,hy+1,9,11,color);r(hx+8,hy+7,6,5,color);r(hx+7,hy+4,1,2);r(hx+12,hy+8,1,1);
  r(hx+1,hy-4,3,5,color);r(hx+7,hy-3,3,4,color);
  if(d.id==='pig'){r(hx+9,hy+7,6,6,'#d6b1a7');r(hx+10,hy+9,1,2,O);r(hx+13,hy+9,1,2,O);}
  if(d.id==='bear'){r(hx-1,hy-2,4,5,'#6b5544');r(hx+7,hy-2,4,5,'#6b5544');}
  if(d.id==='deer'){for(const xx of [hx,hx+9]){r(xx,hy-10,1,9,light);r(xx-3,hy-9,4,1,light);r(xx-3,hy-12,1,4,light);}}
  if(d.id==='goat')r(hx+9,hy+12,2,4,light);
  if(d.id==='horse'){r(hx,hy-1,3,13,'#63503f');r(-20,-18,3,13,'#63503f');}
  if(['donkey','horse'].includes(d.id)){r(hx,hy-9,3,10,color);r(hx+6,hy-8,3,9,color);r(hx+1,hy-7,1,5,'#d7b79c');}
  if(d.id==='camel'){r(-10,-26+yy,11,7,color);r(7,-25+yy,4,12,color);}
  if(['calf','ox','goat','deer'].includes(d.id)){r(hx-1,hy-6,2,7,'#d9c8a1');r(hx+9,hy-6,2,7,'#d9c8a1');}
  if(d.id==='sheep'){for(let i=0;i<5;i++)r(-14+i*5,-23+yy,5,7,light);r(-16,-18+yy,4,10,light);}
  if(d.id==='frog'){r(11,hy-3,4,5,color);r(12,hy-2,2,2,light);r(13,hy-2,1,1);}
  if(['up','down'].includes(direction)){r(hx+3,hy+4,1,2);}
 }
 c.restore();
}
