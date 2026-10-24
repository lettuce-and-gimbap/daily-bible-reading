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
 // Animals were the same height as the human sprites and shared one generic body.
 // Keep the ground anchor, but give each body type a compact, distinct silhouette.
 const animalScale={
  sheep:.66,donkey:.68,horse:.72,camel:.72,calf:.69,ox:.72,goat:.64,deer:.65,
  lion:.68,bear:.70,wolf:.66,fox:.62,dog:.62,pig:.62,
  dove:.54,raven:.56,quail:.52,eagle:.64,sparrow:.48,rooster:.58,
  fish:.62,'great-fish':.68,snake:.64,locust:.48,bee:.46,ant:.42,frog:.54
 }[d.id]||.62;
 c.scale(animalScale,animalScale);
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
  const shape={dove:[-11,-18,19,15],raven:[-12,-19,22,16],quail:[-10,-17,18,14],eagle:[-15,-21,26,17],sparrow:[-9,-16,16,12],rooster:[-12,-19,20,15]}[d.id]||[-10,-18,18,14];
  r(...shape,d.id==='raven'?'#343b48':d.id==='eagle'?'#6e5a43':color);
  r(shape[0]+3,shape[1]+shape[3]-4,shape[2]-6,3,d.id==='raven'?'#414654':d.id==='eagle'?'#b59a71':'#f0e5c8');
  const headX=d.id==='eagle'?8:d.id==='sparrow'?4:5,headY=d.id==='eagle'?-27:d.id==='sparrow'?-24:-26;
  r(headX,headY+down,10,10,color);r(headX+2,headY+2+down,6,6,color);
  const beak=d.id==='dove'?'#d08e83':d.id==='raven'?'#30333c':'#c49c59';
  r(headX+9,headY+4+down,d.id==='eagle'?7:5,3,beak);
  if(d.id==='eagle'){r(headX+13,headY+6+down,3,2,'#9b7145');r(headX+7,headY+3+down,2,2,'#f5d88b');}
  else {r(headX+6,headY+3+down,2,2,d.id==='raven'?'#f2d387':O);}
  r(shape[0]+5,-15+(hanging?step*2:step),shape[2]-9,7,d.id==='raven'?'#252a34':d.id==='eagle'?'#8c7355':d.id==='quail'?'#795f46':d.id==='sparrow'?'#9a7957':'#b9b6a0');
  if(d.id==='dove'){r(shape[0]+2,-13,5,5,'#fff8e7');r(-14,-13,4,3,color);}
  if(d.id==='raven'){r(-15,-14,5,5,'#343b48');r(-13,-13,2,2,'#596071');}
  if(d.id==='quail'){r(-6,-22,5,4,'#e0c49b');r(-8,-18,3,2,'#f0dfc2');r(-4,-17,3,2,'#f0dfc2');}
  if(d.id==='eagle'){r(-13,-17,10,4,'#594735');r(-13,-13,8,5,'#594735');r(-3,-10,3,4,'#d6bd82');}
  if(d.id==='sparrow'){r(-8,-12,6,2,'#795e43');r(-6,-10,4,2,'#e7d5b3');}
  if(d.id==='rooster'){r(5,-31+down,3,7,'#b9564e');r(8,-30+down,3,6,'#c26458');r(11,-28+down,3,4,'#b9564e');r(-17,-18,5,4,'#8f6350');r(-16,-14,5,4,'#8f6350');}
  for(const xx of [-4,4]){r(xx,-3,1,5,'#a17c4f');r(xx-1,-1+step,4,1,'#a17c4f');}
 }else{
  const yy=rest?3:0,front=direction==='down',back=direction==='up';
  if(front||back){
   const bodyWidth=['ox','bear','lion'].includes(d.id)?20:['horse','deer','fox','wolf'].includes(d.id)?15:17;
   r(-bodyWidth/2,-18+yy,bodyWidth,14,color);r(-bodyWidth/2+2,-17+yy,bodyWidth-4,11,color);
   r(-6,-5+yy,4,6-step,dark);r(2,-5+yy,4,6+step,dark);
   if(d.id==='sheep'){
    for(const [xx,yy2]of [[-8,-20],[-3,-22],[3,-22],[8,-20],[-7,-14],[0,-15],[7,-14]])r(xx,yy2+yy,6,6,light);
   }else if(d.id==='camel'){
    r(-9,-25+yy,7,9,color);r(-6,-29+yy,7,8,color);r(4,-25+yy,8,9,color);r(7,-29+yy,7,8,color);
   }else if(d.id==='deer'){
    r(-8,-20+yy,3,7,color);r(6,-20+yy,3,7,color);r(-6,-14+yy,12,4,'#f0e5c8');
   }else if(d.id==='lion'){
    r(-11,-37+yy,22,22,'#93683f');r(-9,-35+yy,18,19,'#c49552');r(-7,-15+yy,14,5,'#93683f');
   }else if(d.id==='bear'){
    r(-10,-33+yy,7,8,'#6b5544');r(3,-33+yy,7,8,'#6b5544');
   }else if(d.id==='wolf'){
    r(-9,-38+yy,7,12,color);r(3,-38+yy,7,12,color);r(-7,-37+yy,3,7,light);r(5,-37+yy,3,7,light);
   }else if(d.id==='fox'){
    r(-10,-39+yy,8,14,color);r(3,-39+yy,8,14,color);r(-8,-36+yy,4,8,'#f2e5c5');r(5,-36+yy,4,8,'#f2e5c5');r(-5,-17+yy,10,7,'#f2e5c5');
   }else if(d.id==='dog'){
    r(-12,-31+yy,7,13,color);r(5,-31+yy,7,13,color);r(-10,-20+yy,20,4,'#b47a57');r(-2,-19+yy,4,3,'#e6c66f');
   }else if(d.id==='pig'){
    r(-10,-38+yy,8,12,color);r(3,-38+yy,8,12,color);r(-6,-34+yy,12,12,color);r(-5,-24+yy,10,6,'#e2b5a9');r(-3,-22+yy,2,2,O);r(2,-22+yy,2,2,O);
   }else if(d.id==='goat'||d.id==='ox'||d.id==='calf'){
    r(-10,-32+yy,4,12,light);r(6,-32+yy,4,12,light);r(-5,-17+yy,10,5,'#f0e5c8');
    if(d.id==='goat'){r(-6,-37+yy,3,10,'#e6d7b8');r(4,-37+yy,3,10,'#e6d7b8');r(-2,-17+yy,4,6,color);}
   }
   if(d.id==='donkey'||d.id==='horse'){
    r(-8,-39+yy,5,d.id==='horse'?17:19,color);r(3,-39+yy,5,d.id==='horse'?17:19,color);
    if(d.id==='horse'){r(-9,-24+yy,18,8,'#624c3e');r(-7,-17+yy,14,5,'#f0e5c8');}
   }
   if(d.id==='deer'){
    for(const xx of [-6,5]){r(xx,-42+yy,2,13,'#9a754e');r(xx-4,-39+yy,4,2,'#9a754e');r(xx+1,-36+yy,4,2,'#9a754e');}
   }
   if(front){
    r(-5,-30+yy,2,2,O);r(3,-30+yy,2,2,O);
    if(d.id==='lion'||d.id==='bear'){r(-3,-24+yy,6,4,'#f0dfc0');r(-1,-25+yy,2,2,O);}
    else if(d.id==='pig'){}else if(d.id==='horse'||d.id==='donkey'){r(-2,-24+yy,4,3,'#d9c19f');r(-1,-23+yy,2,1,O);}
    else if(d.id==='wolf'||d.id==='fox'){r(-3,-25+yy,6,5,'#f0e5c8');r(-1,-26+yy,2,2,O);}
    else {r(-3,-24+yy,6,3,'#f0e5c8');r(-1,-23+yy,2,1,O);}
    if(d.id==='deer'){r(-4,-21+yy,2,2,'#b97e75');r(3,-21+yy,2,2,'#b97e75');}
   }else{
    r(-6,-33+yy,12,9,dark);r(-3,-31+yy,6,5,color);
    if(d.id==='sheep')for(const xx of [-8,-3,2,7])r(xx,-19+yy,3,3,'#fff6dd');
    if(d.id==='horse'||d.id==='donkey')r(-2,-27+yy,4,13,'#624c3e');
   }
   if(d.id==='sheep'){r(-10,-29+yy,5,10,light);r(5,-29+yy,5,10,light);}
   if(d.id==='camel')r(-4,-18+yy,8,3,'#e3c99c');
   if(d.id==='ox'||d.id==='calf'){r(-7,-15+yy,14,3,'#e9dfc5');r(-2,-12+yy,4,2,'#a78668');}
   if(d.id==='goat')r(-2,-18+yy,4,5,light);
   c.restore();return;
  }
  const tailLift=rest?2:step;
  const body={horse:[-16,-22,32,17],camel:[-17,-22,34,16],ox:[-17,-23,34,18],calf:[-15,-22,30,17],bear:[-16,-23,32,20],lion:[-16,-22,32,17],deer:[-15,-21,29,14],fox:[-15,-21,29,14],wolf:[-17,-21,34,15],pig:[-14,-21,28,16],sheep:[-15,-21,30,17]}[d.id]||[-15,-21,30,16];
  r(...body,color);r(body[0]+3,body[1]+body[3]-3,body[2]-6,3,light);
  for(const [i,xx]of [-12,-5,5,11].entries()){
   const lift=rest?2:(i%2?step:-step);r(xx,-6+yy,3,6-lift,dark);r(xx+1,-5+yy,1,4-lift,color);
  }
  r(-20,-19+yy,4,8,color);r(-22,-13+yy,3,4,color);
  if(d.id==='fox'){r(-25,-20+yy,8,7,color);r(-24,-18+yy,5,3,'#f2e5c5');}
  else if(d.id==='sheep'){for(let i=0;i<6;i++)r(-14+i*5,-24+yy,6,7,light);}
  else if(d.id==='camel'){r(-12,-30+yy,9,12,color);r(2,-29+yy,9,11,color);r(-10,-31+yy,6,5,'#ead7ae');r(4,-30+yy,6,5,'#ead7ae');}
  else if(d.id==='lion'){r(-11,-22+yy,8,6,'#93683f');r(-4,-25+yy,5,6,'#93683f');}
  const hx=8,hy=-28+down+yy;
  if(d.id==='lion')r(hx-5,hy-4,16,18,'#93683f');
  if(d.id==='bear'){r(hx-2,hy-2,14,15,'#6b5544');r(hx+1,hy+5,10,7,'#b59778');}
  if(d.id==='fox'){r(hx-2,hy-4,5,11,color);r(hx+6,hy-4,5,11,color);r(hx+4,hy+7,9,5,'#f2e5c5');}
  if(d.id==='wolf'){r(hx-2,hy-5,5,12,color);r(hx+6,hy-5,5,12,color);r(hx+8,hy+6,9,5,'#e4d8c0');}
  if(d.id==='donkey'||d.id==='horse'){r(hx-1,hy-12,4,14,color);r(hx+5,hy-11,4,13,color);r(hx+3,hy+7,10,5,'#d9c19f');}
  else {r(hx,hy,11,13,color);r(hx+7,hy+7,7,5,'#f0e5c8');}
  if(d.id==='pig'){r(hx+9,hy+7,7,6,'#e2b5a9');r(hx+11,hy+9,1,2,O);r(hx+14,hy+9,1,2,O);}
  else {r(hx+2,hy+4,2,2,O);r(hx+8,hy+4,2,2,O);r(hx+11,hy+8,2,1,O);}
  if(d.id==='deer'){r(hx-1,hy-13,2,12,light);r(hx+8,hy-13,2,12,light);for(const xx of [hx-4,hx+7])r(xx,hy-13,4,2,light);}
  if(d.id==='goat'){r(hx+4,hy+12,3,6,light);r(hx-2,hy-8,2,7,light);r(hx+8,hy-8,2,7,light);}
  if(d.id==='horse'){r(hx-4,hy-7,4,16,'#624c3e');r(-19,-19+yy,3,14,'#624c3e');}
  if(d.id==='donkey'){r(-3,-24+yy,4,15,color);r(-19,-20+yy,3,13,color);}
  if(d.id==='camel'){r(-10,-27+yy,14,9,color);r(5,-28+yy,4,14,color);}
  if(d.id==='ox'||d.id==='calf'){r(hx-2,hy-7,3,9,light);r(hx+9,hy-7,3,9,light);r(hx+8,hy+9,4,3,'#b78e74');}
  if(d.id==='sheep')r(hx-4,hy-2,17,15,'#ece2c3');
  if(d.id==='frog'){r(hx+10,hy-3,4,5,color);r(hx+11,hy-2,2,2,light);}
 }
 c.restore();
}
