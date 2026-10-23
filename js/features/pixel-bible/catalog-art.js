import {garmentColor} from './garments.js';
// 계열별 재사용 도안 안에서도 형태가 다른 물건은 별도 실루엣으로 그린다.
export function drawCatalogDetail(r,id,family,O){
 const wood='#a78255',gold='#d8b75f',metal='#aab6b4',paper='#eee0b3',dark='#5d665f';
 const line=(x,y,w,h,c=wood)=>r(x,y,w,h,c);


 if(['cloak','robe','linen','sackcloth','ephod','armor','helmet','sandal','breastplate'].includes(id)){
  const cloth=garmentColor(id);
  if(id==='cloak'){
   line(-5,-22,10,5,O);line(-9,-17,18,8,O);line(-12,-9,24,14,O);
   line(-4,-21,8,4,cloth);line(-8,-16,16,8,cloth);line(-11,-8,22,12,cloth);line(-1,-16,2,20,paper);line(-4,-19,8,2,dark);
  }else if(id==='helmet'){
   line(-6,-18,12,2,O);line(-10,-16,20,14,O);line(-9,-15,18,11,metal);line(-6,-14,11,2,paper);line(-9,-4,4,9,metal);line(5,-4,4,9,metal);line(-2,-23,4,6,gold);
  }else if(id==='sandal'){
   for(const x of [-9,2]){line(x,-9,7,14,wood);line(x,-7,7,2,gold);line(x+2,-6,2,10,gold);}
  }else if(id==='breastplate'){
   line(-9,-17,18,20,O);line(-8,-16,16,18,gold);for(let y=0;y<4;y++)for(let x=0;x<3;x++)line(-6+x*4,-13+y*4,3,3,['#9b6e78','#87a19e','#d4bf74'][(x+y)%3]);
  }else{
   line(-5,-22,10,3,O);line(-13,-19,26,8,O);line(-9,-11,18,16,O);
   line(-4,-21,8,3,cloth);line(-12,-18,24,6,cloth);line(-8,-12,16,16,cloth);line(-3,-21,6,4,paper);line(-6,-10,1,13,'#ffffff33');line(-8,1,16,2,paper);
   if(id==='sackcloth')for(let y=-14;y<2;y+=4)line(-7,y,14,1,wood);
   if(id==='armor')for(let y=-12;y<2;y+=4)line(-6,y,12,1,metal);
  }
  return true;
 }
 if(['table','bed','throne','footstool'].includes(id)){
  if(id==='table'){
   line(-13,-8,26,4,O);line(-12,-7,24,2,wood);line(-11,-4,3,10,wood);line(8,-4,3,10,wood);line(-10,-7,20,1,paper);
  }else if(id==='bed'){
   line(-14,-9,28,11,O);line(-13,-8,26,8,paper);line(-5,-7,17,7,'#839d9a');line(-13,-11,6,5,'#f3ebd0');
   line(-15,-14,2,19,wood);line(13,-7,2,12,wood);line(-13,1,26,2,wood);
  }else if(id==='throne'){
   line(-10,-25,20,25,O);line(-8,-23,16,21,gold);line(-6,-20,12,15,'#94707e');line(-12,-7,24,7,gold);line(-10,0,3,6,wood);line(7,0,3,6,wood);line(-2,-28,4,5,gold);
  }else {line(-8,-3,16,4,wood);line(-6,1,2,4,O);line(4,1,2,4,O);}
  return true;
 }
 if(['lamp','lampstand','torch','candle','censer','pot','pitcher'].includes(id)){
  if(id==='pot'){
   line(-9,-7,18,11,O);line(-8,-6,16,9,dark);line(-11,-6,3,4,O);line(8,-6,3,4,O);line(-8,-9,16,2,metal);line(-2,-11,4,2,O);
  }else if(id==='pitcher'){
   line(-5,-15,8,4,wood);line(-6,-11,12,15,wood);line(-4,-9,2,10,paper);line(5,-10,5,9,O);line(6,-8,2,5,'#f3efdf');line(-7,-15,4,2,paper);
  }else if(id==='censer'){
   line(-7,-7,14,10,gold);line(-5,-11,10,4,gold);line(-2,-15,4,4,metal);for(const x of [-6,5])line(x,-21,1,15,metal);
  }else{
   if(id==='lampstand'){line(-1,-24,2,28,gold);line(-8,3,16,2,gold);for(const x of [-9,-5,4,8]){line(x,-20,1,16,gold);line(Math.min(x,0),-5,Math.abs(x)+1,1,gold);line(x-1,-25,3,5,'#e9bd58');}}
   else if(id==='torch'){line(-1,-14,2,19,wood);line(-4,-21,8,9,'#cf8c47');}
   else if(id==='candle'){line(-2,-15,4,19,paper);line(-5,3,10,2,gold);}
   else{line(-7,-4,14,7,wood);line(-4,-7,11,4,gold);line(5,-9,5,5,gold);}
   line(id==='lamp'?6:-1,id==='lamp'?-14:-23,3,7,'#edb65b');line(id==='lamp'?7:0,id==='lamp'?-16:-25,1,6,'#fff0a6');
  }
  return true;
 }
 if(['bow','arrow','sword','spear','javelin','staff','rod','cross','bronze-snake','pen','oar'].includes(id)){
  if(id==='bow'){for(let i=0;i<6;i++){line(-6+Math.floor(i/2),-23+i*4,2,5);line(6-Math.floor(i/2),-23+i*4,1,5,'#d8cba3');}line(-4,-3,3,3);}
  else if(id==='arrow'){line(-1,-24,2,28);line(-3,-24,6,3,metal);line(-4,0,4,4,paper);}
  else if(id==='cross'){line(-2,-26,4,31);line(-11,-18,22,4);}
  else if(id==='staff'){line(-1,-25,2,30);line(-5,-27,6,2);line(-6,-25,2,4);}
  else if(id==='pen'){line(-1,-19,2,24,dark);line(-4,-26,6,8,paper);line(-2,-24,1,8,dark);}
  else if(id==='bronze-snake'){line(-1,-26,2,31);for(let i=0;i<4;i++)line(i%2?-5:0,-23+i*5,6,2,'#c7985a');line(1,-26,7,3,'#c7985a');}
  else if(id==='rod'||id==='oar'){line(-1,-24,2,28);if(id==='oar')line(-3,-3,6,8);}
  else{line(-2,-26,4,21,metal);line(-1,-29,2,3,paper);line(-6,-5,12,2,gold);line(-1,-3,2,8,wood);if(id==='spear'||id==='javelin'){line(-1,-22,2,27,wood);line(-4,-27,8,5,metal);}}
  return true;
 }
 if(family==='instrument'){
  if(['trumpet','flute'].includes(id)){line(-12,-9,24,3,id==='trumpet'?gold:wood);if(id==='trumpet'){line(9,-13,4,11,gold);line(-6,-4,14,3,gold);}else for(let i=0;i<4;i++)line(-6+i*4,-9,1,1,O);}
  else if(['tambourine','cymbal'].includes(id)){line(-7,-15,14,17,O);line(-5,-13,10,13,gold);line(-3,-11,6,9,id==='tambourine'?paper:wood);}
  else{line(-7,-22,2,26,gold);line(5,-22,2,26,gold);line(-7,-23,14,2,gold);line(-7,2,14,3,gold);for(let i=0;i<4;i++)line(-4+i*3,-19,1,20,paper);}
  return true;
 }
 if(['tablet','book','letter'].includes(id)){
  if(id==='tablet'){line(-10,-19,9,22,dark);line(1,-19,9,22,dark);line(-9,-21,7,2,dark);line(2,-21,7,2,dark);for(let i=0;i<4;i++){line(-8,-15+i*4,5,1,paper);line(3,-15+i*4,5,1,paper);}}
  else if(id==='letter'){line(-11,-12,22,16,O);line(-10,-11,20,14,paper);for(let i=0;i<5;i++){line(-9+i*2,-10+i,2,1,wood);line(7-i*2,-10+i,2,1,wood);}line(-2,-4,4,3,'#af6254');}
  else{line(-11,-18,22,23,O);line(-10,-17,9,20,paper);line(1,-17,9,20,paper);line(-1,-17,2,20,wood);for(let i=0;i<4;i++){line(-8,-13+i*4,5,1,wood);line(3,-13+i*4,5,1,wood);}}
  return true;
 }
 if(['ark-covenant','treasure-chest','basket','moneybag','stable'].includes(id)){
  if(id==='moneybag'){line(-6,-12,12,16,wood);line(-4,-19,8,7,paper);line(-5,-12,10,2,dark);line(-2,-5,4,5,gold);}
  else{line(-11,-10,22,14,O);line(-10,-9,20,12,id==='ark-covenant'?gold:wood);line(-12,-13,24,4,id==='ark-covenant'?gold:paper);if(id==='ark-covenant'){line(-16,-7,32,2,wood);line(-8,-20,3,7,gold);line(5,-20,3,7,gold);line(-5,-19,10,2,gold);}else for(let i=0;i<4;i++)line(-8+i*5,-8,1,10,dark);}
  return true;
 }
 if(['temple','tabernacle','tent','wall','gate','tower','palace'].includes(id)){
  if(id==='tent'||id==='tabernacle'){for(let i=0;i<9;i++)line(-i,-24+i*2,i*2+1,2,paper);line(-9,-6,18,11,wood);line(-2,-10,5,15,O);}
  else if(id==='wall'){line(-15,-19,30,23,wood);for(let row=0;row<4;row++){line(-15,-18+row*6,30,1,paper);for(let col=0;col<4;col++)line(-12+col*8+(row%2)*3,-18+row*6,1,6,paper);}}
  else if(id==='gate'){line(-13,-22,26,27,wood);line(-7,-16,14,21,O);line(-5,-19,10,3,O);}
  else if(id==='tower'){line(-7,-28,14,33,wood);line(-9,-29,18,3,dark);for(const x of [-8,-1,6])line(x,-33,3,4,wood);line(-2,-9,4,14,O);}
  else{line(-14,-25,28,4,paper);line(-11,-28,22,3,wood);line(-15,2,30,3,paper);for(const x of [-12,-4,4,10]){line(x,-20,3,22,paper);line(x+1,-19,1,20,wood);}line(-14,-22,28,2,wood);}
  return true;
 }
 if(['coin','silver','gold','pearl','jewel','signet','crown'].includes(id)){
  if(id==='crown'){line(-10,-7,20,11,gold);for(const x of [-10,-2,6])line(x,-16,4,10,gold);line(-2,-3,4,3,'#ab6568');}
  else if(id==='signet'){line(-6,-13,12,16,gold);line(-4,-11,8,12,'#f3efdf');line(-3,-16,6,5,'#b16b65');}
  else{const color=id==='silver'?metal:id==='pearl'?paper:gold;line(-6,-13,12,14,color);line(-8,-10,16,8,color);line(-3,-11,6,10,'#ffffff44');if(id!=='pearl')line(-1,-9,2,7,wood);}
  return true;
 }
 if(['axe','hammer','sickle','key','ladder','scale','shield','yoke','plow','nail','hook','wheel','chain','fetter','rope','anchor'].includes(id)){
  if(id==='ladder'){line(-8,-28,2,32);line(6,-28,2,32);for(let i=0;i<6;i++)line(-6,-25+i*5,12,2);}
  else if(id==='shield'){line(-9,-22,18,20,metal);line(-6,-2,12,4,metal);line(-1,-20,2,21,gold);line(-8,-13,16,2,gold);}
  else if(id==='axe'||id==='hammer'){line(-1,-22,2,27);line(-8,-25,16,7,metal);if(id==='axe')line(4,-24,5,11,metal);}
  else if(id==='sickle'){line(-6,-23,13,3,metal);line(5,-20,3,7,metal);line(2,-13,5,3,metal);line(1,-10,2,15);}
  else if(id==='scale'){line(-1,-23,2,28);line(-12,-21,24,2,metal);for(const x of [-9,8]){line(x,-19,1,10,metal);line(x-4,-9,9,3,gold);}}
  else if(id==='key'){line(-4,-21,8,8,gold);line(-2,-19,4,4,'#f3efdf');line(-1,-13,2,17,gold);line(1,0,5,2,gold);}
  else if(['wheel','chain','fetter','rope'].includes(id)){for(let j=0;j<3;j++){line(-7+j*5,-20+j*5,7,7,metal);line(-5+j*5,-18+j*5,3,3,'#f3efdf');}}
  else if(id==='anchor'){line(-1,-25,2,27,metal);line(-8,-17,16,2,metal);line(-10,-5,3,7,metal);line(7,-5,3,7,metal);line(-8,0,16,3,metal);}
  else if(id==='nail'||id==='hook'){line(-1,-17,2,22,metal);line(-5,-18,10,2,metal);if(id==='hook')line(0,1,5,3,metal);}
  else{line(-12,-10,24,3);line(-9,-22,3,16);line(7,-22,3,16);line(-10,-23,20,3);}
  return true;
 }
 if(['rainbow','star','cloud'].includes(id)){
  if(id==='cloud'){line(-13,-10,26,12,paper);line(-9,-15,11,5,paper);line(2,-18,7,8,paper);}
  else if(id==='star'){line(-3,-23,6,28,gold);line(-12,-14,24,6,gold);line(-8,-20,16,17,gold);}
  else for(const [i,color] of ['#b66d67','#d4ab62','#78966b'].entries()){line(-12+i*3,-12,2,13,color);line(10-i*3,-12,2,13,color);line(-10+i*3,-17+i*3,20-i*6,2,color);}
  return true;
 }

 if(id==='ark-noah'){
  line(-15,-6,30,7,wood);line(-12,1,24,4,wood);line(-10,-20,20,14,paper);line(-12,-23,24,3,wood);for(let i=0;i<5;i++)line(-8+i*4,-16,2,3,O);return true;
 }
 if(['seed','mustard','manna','salt','flour','leaven'].includes(id)){
  line(-11,0,22,3,wood);for(let i=0;i<10;i++)line(-8+(i*7)%17,-2-Math.floor(i/3)*2,2,2,id==='seed'||id==='mustard'?gold:paper);return true;
 }
 if(['grapes','fig','fruit'].includes(id)){
  if(id==='grapes'){for(let i=0;i<5;i++)line(-5+(i%2)*5,-15+i*3,5,5,'#8f719e');line(-4,-20,9,3,'#6c8c56');}
  else{line(-7,-12,14,14,id==='fig'?'#a28e65':'#b97762');line(-4,-15,8,3,'#6c8c56');line(0,-18,2,4,wood);}
  return true;
 }
 if(['hyssop','reed','lily','palm','cedar'].includes(id)){
  if(id==='palm'){line(-2,-27,4,32,wood);for(let i=0;i<3;i++){line(-13+i*3,-29+i*3,26-i*6,3,'#66865d');}}
  else if(id==='cedar'){line(-2,-20,4,25,wood);for(let i=0;i<4;i++)line(-4-i*3,-26+i*6,8+i*6,4,'#58765b');}
  else{for(const x of [-5,0,5]){line(x,-23+Math.abs(x),1,28-Math.abs(x),'#6c8c56');line(x-3,-18+Math.abs(x),4,2,'#789a66');}if(id==='lily'){line(-4,-26,9,5,paper);line(-2,-29,5,3,paper);}}
  return true;
 }
 return false;
}
