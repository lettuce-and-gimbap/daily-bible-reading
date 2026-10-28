import {drawVerseTeaching} from './verse-teaching.js';
import {drawCreature} from '../creature-art.js';
import {CREATURES} from '../creatures.js';
import {drawVerseParables} from './verse-parables.js';
// Verse-specific teaching images. These are illustrations, not extra historical events.
export function drawVerseSymbols(c,kind,sample,{r,prop,text,phase}){
 const {index,progress}=sample;if(drawVerseTeaching(c,kind,sample,{r,prop,text,phase})||drawVerseParables(c,kind,sample,{r,prop,text,phase}))return true;
 if(kind==='sky-sign'){
  r(190,97,340,110,'#c59c87');r(190,166,340,41,'#c5ac8c');r(347,142,28,28,'#f0c184');
  if(sample.plan.diagram.labels.some(l=>l.includes('흐린'))&&index>=2){for(let i=0;i<4;i++)r(230+i*70,115+i%2*13,95,25,'#7a8988');}return true;
 }
 if(kind==='edition-note'){
  prop('scroll',360,193,2);r(305,107,110,36,'#233d47');text('본문 표기 안내',360,131,13);return true;
 }
 if(kind==='broken-chain'){
  prop('tomb',220,205,1.7);r(315,184,90,25,'#34474b');
  for(let i=0;i<7;i++){const x=315+i*13,y=188+(i%2)*10;if(index<2||i%3!==Math.floor(progress*3)%3){r(x,y,9,5,'#c2ad7e');r(x+4,y+5,5,6,'#c2ad7e');}else{r(x-3,y+12,5,4,'#a58b65');r(x+8,y-4,4,4,'#a58b65');}}
  if(index>=3){r(330,158,62,3,'#617c77');r(342,151,4,20,'#617c77');r(375,151,4,20,'#617c77');}
  return true;
 }
 if(kind==='travel-kit'){
  prop('staff',235,202,1.8);prop('sandal',315,205,1.5);prop('cloak',390,193,1.25);prop('moneybag',485,197,1.3);
  r(184,219,350,3,'#8f987c');
  if(index>=2){r(445,176,72,52,'#263b40');r(455,184,52,4,'#d77c72');r(455,194,52,4,'#d77c72');r(455,204,52,4,'#d77c72');}
  if(index>=4){text('지팡이 · 신',276,249,12,'#304b50');text('여벌 짐 없이',450,249,12,'#304b50');}
  return true;
 }
 if(kind==='seated-groups'){
  for(let row=0;row<3;row++)for(let col=0;col<8;col++){
   const x=214+col*39+(row%2)*13,y=132+row*38;
   if(index<2&&row*8+col>Math.floor((index+progress)*12))continue;
   r(x-5,y-12,10,10,'#d9bb91');r(x-8,y-1,16,13,'#658173');r(x-7,y+11,5,8,'#3d4d4b');r(x+2,y+11,5,8,'#3d4d4b');
  }
  if(index>=3){r(180,230,360,3,'#d6c58f');text(sample.plan.diagram.labels.some(l=>l.includes('오천'))?'5000명을 나타내는 무리':'백 명씩 · 오십 명씩',360,257,13,'#304b50');}
  return true;
 }
 if(kind==='scroll-command'){
  prop('scroll',360,177,2.2);r(287,224,146,4,'#9c825f');
  if(index>=1){r(306,119,108,28,'#233d47');text('부모를 공경하라',360,138,12);}
  if(index>=3){r(318,158,84,3,'#826f54');r(318,166,84,3,'#826f54');}
  if(index>=4){prop('house',470,214,.7);r(423,198,27,3,'#d7c18a');}
  return true;
 }
 if(kind==='fish-coin'){
  prop('fish',310,188,3);if(index>=2){prop('hook',267,142);r(267,85,2,50,'#cdbb93');}if(index>=4){prop('coin',385+Math.round(progress*20),185,2);prop('temple',495,210,.55);}return true;
 }
 if(kind==='lost-sheep'){
  for(let i=0;i<3;i++)drawCreature(c,CREATURES.sheep,220+i*41,200,{frame:0,direction:'right'});
  const x=470-Math.round(phase*70);drawCreature(c,CREATURES.sheep,x,200,{frame:Math.floor(sample.elapsed*3)%4,direction:'left'});
  if(index>=3){for(let i=0;i<4;i++)r(x-20+i*14,143,3,5,'#ead494');}return true;
 }
 if(kind==='covered-tray'){
  const x=250+Math.round(phase*220);r(x-40,199,80,5,'#9eaaa5');r(x-30,169,60,30,'#c7bca3');r(x-20,162,40,9,'#ded2b8');r(x-4,167,5,31,'#a99e87');return true;
 }
 if(kind==='loaves'){
  const count=sample.plan.diagram.loaves||5;for(let i=0;i<count;i++)if(index>=Math.floor(i/2))prop('bread',240+(i%4)*65,154+Math.floor(i/4)*32);
  if(index>=3)for(let i=0;i<(sample.plan.diagram.fish||3);i++)prop('fish',310+i*75,219);return true;
 }
 if(kind==='baskets'){
  const count=sample.plan.diagram.count||12,visible=Math.min(count,Math.ceil((index+progress+1)/6*count));
  for(let i=0;i<visible;i++){const x=220+i%6*56,y=152+Math.floor(i/6)*55;prop('basket',x,y);prop('bread',x,y-17);}return true;
 }
 if(kind==='pit-guide'){
  r(330,187,95,29,'#3c5352');r(325,182,105,7,'#a48d67');for(let i=0;i<2;i++){const xx=240+i*53+Math.round(phase*80),yy=169+(index>=4?Math.round(progress*25):0);r(xx-6,yy-32,12,12,'#d6ba92');r(xx-8,yy-20,16,20,'#8eaa9a');r(xx-7,yy,5,17,'#434f4a');r(xx+2,yy,5,17,'#434f4a');}return true;
 }
 if(kind==='crumbs'){
  r(265,122,190,7,'#ae8d5f');r(277,129,8,75,'#967b55');r(435,129,8,75,'#967b55');prop('bread',360,120);
  if(index>=2)for(let i=0;i<7;i++)r(340+i*7,139+Math.round(phase*50)+i%2*5,3,2,'#e2c382');return true;
 }
 if(kind==='dust'){
  const offset=index>=2&&index<=4?Math.floor(Math.sin(progress*Math.PI*3)*7):0;prop('sandal',360+offset,190,2);
  if(index>=2&&index<=4)for(let i=0;i<13;i++)r(320+i*7,206+(i%3)*6+Math.floor(progress*4),3,2,'#bda775');
  return true;
 }
 if(kind==='burden'){
  prop('basket',235,165+Math.round(phase*40),2);prop('yoke',395,193,2);
  if(index>=3){for(let i=0;i<5;i++)r(465+i*10,143+i%2*10,3,4,'#ecd69d');r(265,177,90,3,'#d4c18d');}
  return true;
 }
 if(kind==='reed-lamp'){
  prop('reed',270,207,2);r(258,150,24,3,'#c6b984');prop('lamp',450,205,2);
  r(446,152,7,index<3?5:10,'#efd697');if(index>=3)for(let i=0;i<5;i++)r(420+i*13,131+i%2*8,3,3,'#e4ce98');
  return true;
 }
 if(kind==='three-days'){
  prop('fish',235,186,2.5);prop('tomb',485,204,2);
  for(let i=0;i<3;i++){const x=300+i*60;r(x-22,93,44,34,index>=i*2?'#526e6b':'#899c8c');text(String(i+1),x,115,15);}
  const x=300+Math.min(2,Math.floor(index/2))*60;
  if(index%2===0)r(x-7,145,14,14,'#f0d388');else{r(x-7,145,14,14,'#d5e1d2');r(x-2,142,12,12,'#8b9e92');}
  if(index>=4)r(270,183,155,3,'#d8c28b');return true;
 }
 return false;
}
