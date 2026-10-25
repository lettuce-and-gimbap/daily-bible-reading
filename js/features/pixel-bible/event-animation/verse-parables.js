import {drawCreature} from '../creature-art.js';
import {CREATURES} from '../creatures.js';
export function drawVerseParables(c,kind,sample,{r,prop,text,phase}){
 const {index,progress}=sample,soil=sample.plan.diagram.soil;
 const stalk=(x,height,color='#cbb36b')=>{r(x,211-height,3,height,color);r(x-4,207-height,11,8,color);};
 if(kind==='seed-ground'){
  r(180,213,360,14,['path'].includes(soil)?'#92978b':'#a58d62');r(180,227,360,4,'#796c53');
  if(['rock','wither'].includes(soil))for(let i=0;i<8;i++)r(205+i*43,218,26,7,'#808c88');
  const planting=index<2;for(let i=0;i<7;i++){if(soil==='path'&&index>=4)break;const x=225+i*41,y=planting?100+Math.round(phase*220)+i%2*8:207;r(x,Math.min(209,y),4,3,soil==='weeds'?'#78916c':'#e2c17c');}
  if(index>=2&&soil!=='path'&&soil!=='mustard-seed'){
   const height=['rock','wither'].includes(soil)?25:25+Math.round(phase*40);
   for(let i=0;i<6;i++)stalk(230+i*44,height,soil==='wither'&&index>=4?'#a29164':'#ccb66f');
   if(soil==='wither'&&index>=4){for(let i=0;i<6;i++)r(230+i*44,190,20,3,'#a29164');r(460,86,23,23,'#f3d891');}
  }
  if(soil==='path'&&index>=3)for(let i=0;i<2;i++)drawCreature(c,CREATURES.sparrow,Math.round(260+i*145),Math.round(index===3?145+progress*60:206),{frame:Math.floor(sample.elapsed*4)%4,direction:'right',pose:{phase:2,creatureAction:'peck'}});
  if(['thorns','weeds','mixed','patient','harvest'].includes(soil)&&index>=2){for(let i=0;i<5;i++){const x=245+i*53,h=soil==='thorns'?35+phase*45:35;r(x,211-h,3,h,'#5e785c');for(let j=0;j<4;j++)r(x-7+j%2*10,214-h+j*10,11,2,'#5e785c');}}
  if(soil==='patient'&&index>=3){r(218,215,265,3,'#e1cf94');r(344,138,6,37,'#e1cf94');r(344,184,6,6,'#e1cf94');}
  if(soil==='harvest'&&index>=4){r(185,139,350,75,'#a3b093');prop('grain',275,211);prop('basket',460,211);for(let i=0;i<5;i++)r(445+i*7,190,3,19,'#6d7f5e');}
  if(soil==='mustard-seed')prop('mustard',360,207,2);
  if(soil==='mustard-tree'&&index>=2){r(190,112,340,101,'#a3b093');const scale=.5+phase;prop('tree',360,214,scale);if(index>=4)drawCreature(c,CREATURES.sparrow,390,153,{frame:Math.floor(sample.elapsed*3)%4,direction:'left'});}
  return true;
 }
 if(kind==='dough-rise'){
  prop('bowl',360,211,3);if(index<3)prop('leaven',270+phase*160,148+phase*45);const h=15+Math.round(phase*35);r(315,199-h,90,h,'#d6c197');r(323,191-h,74,10,'#ead5ad');return true;
 }
 if(kind==='pearl'){
  prop('moneybag',265,205,2);if(index>=2)prop('pearl',455,180,3);if(index>=3){for(let i=0;i<4;i++)prop('coin',280+Math.round(phase*90)+i*13,204);}return true;
 }
 if(kind==='net-sort'){
  r(180,177,360,49,'#6c9ba8');const yy=190-Math.round(phase*35);c.strokeStyle='#d1c39d';c.lineWidth=2;
  for(let i=0;i<7;i++){c.beginPath();c.moveTo(235+i*38,yy);c.lineTo(248+i*32,yy+44);c.stroke();}for(let i=0;i<5;i++){c.beginPath();c.moveTo(235,yy+i*10);c.lineTo(463,yy+i*10);c.stroke();}
  for(let i=0;i<6;i++)prop('fish',263+i*33,yy+22+i%2*10);
  if(index>=4){prop('bowl',260,224,2);prop('basket',460,224,2);prop('fish',260,207);prop('fish',460,207);}return true;
 }
 return false;
}
