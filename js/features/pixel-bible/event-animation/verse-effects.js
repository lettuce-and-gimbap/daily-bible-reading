import {drawCreature} from '../creature-art.js';
import {CREATURES} from '../creatures.js';
import {drawWorldObject} from '../art.js';
export const VERSE_EFFECTS=new Set(['star-guide','gifts','detour','dove-descend','kingdoms','cast-net','remote-room','waterline','rooster-call','anoint-head','roof-descent','ear-tongue','temple-fall','spirit-light','flight','leaf-growth','tomb-seal']);
export function drawVerseEffects(c,sample,layout){
 const {plan,index,progress}=sample;if(!VERSE_EFFECTS.has(plan.effect))return;
 const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);},prop=(kind,x,y)=>drawWorldObject(c,{kind,x:Math.round(x),y:Math.round(y)},1,0),p=Math.min(1,(index+progress)/5);
 if(plan.effect==='roof-descent'){const xx=layout.prop.x,yy=layout.prop.y;r(xx-160,78,320,9,'#a48a65');r(xx-40,78,80,9,'#344849');for(const dx of [-40,40])r(xx+dx,85,2,Math.max(0,yy-85),'#c9b996');}
 if(plan.effect==='anoint-head'&&index>=2&&index<=3){const target=layout.positions[1];for(let i=0;i<4;i++)r(target.x-7+i*3,target.y-83+((Math.floor(progress*16)+i*5)%20),2,3,'#e3c887');}
 if(plan.effect==='rooster-call'){c.save();c.translate(510,235);c.scale(2,2);drawCreature(c,CREATURES.rooster,0,0,{frame:0,direction:'left'});c.restore();if(index>=3)for(let i=0;i<3;i++)r(527+i*9,180-i*9,3,5,'#eed39b');}
 if(plan.effect==='remote-room'){r(430,75,3,170,'#dac59b');c.fillStyle='#233d47';c.font='13px DungGeunMo,monospace';c.textAlign='center';c.fillText(plan.remoteLabel||'다른 장소',555,70);}
 if(plan.effect==='ear-tongue'){
  const target=layout.positions[1];
  if(target){
   const handX=target.x-13,handY=target.y-49;
   if(index>=2&&index<=3){r(handX,handY,9,7,'#e3bd91');r(target.x-18,target.y-56,5,10,'#e6c69a');}
   if(index>=4){r(handX+8,handY+12,8,6,'#e3bd91');r(target.x-4,target.y-43,7,3,'#a96d69');}
   if(index===3||index===5){r(target.x-24,target.y-65,3,3,'#f3d38b');r(target.x+18,target.y-62,3,3,'#f3d38b');}
  }
 }
 if(plan.effect==='temple-fall'){
  const xx=layout.lead.x;
  r(xx-72,107,144,72,'#b59b72');r(xx-62,96,124,12,'#c9b487');
  for(let i=0;i<5;i++)r(xx-54+i*25,120,12,46,'#d5c39b');
  if(index>=3){const fall=Math.round(Math.min(1,(index-3+progress)/2)*34);for(let i=0;i<4;i++)r(xx-58+i*38,170+fall+(i%2)*4,25,9,'#a89579');r(xx-76,183+fall,152,3,'#c6bca0');}
 }
 if(plan.effect==='spirit-light'&&index>=3){
  const who=layout.lead;for(let i=0;i<7;i++){const xx=who.x-18+i*6;r(xx,who.y-118+(i%2)*6,2,32,'#eadb9f');}
  if(index>=4)for(let i=0;i<5;i++)r(who.x-24+i*12,who.y-126-(i%2)*5,3,3,'#f1dfa5');
 }
 if(plan.effect==='flight'&&index>=2){
  r(0,246,720,3,'#bcae83');for(let i=0;i<5;i++){const xx=layout.lead.x-68+i*34;r(xx,225-(i%2)*8,16,2,'#d7c890');}
 }
 if(plan.effect==='leaf-growth'&&index>=3){
  const tree=layout.prop||layout.lead,xx=tree.x,yy=tree.y-47;
  for(const [dx,dy]of [[-17,0],[-8,-8],[2,-12],[13,-6],[20,2]])r(xx+dx,yy+dy,7,6,'#8eae75');
 }
 if(plan.effect==='tomb-seal'){
  const xx=layout.lead.x+66,yy=173;r(xx-24,yy-45,50,51,'#9d9275');r(xx-17,yy-37,36,43,'#263a3c');
  const close=Math.min(1,Math.max(0,(index-3+progress)/2));prop('stone',xx+35-close*34,yy+3);
 }
 if(plan.effect==='waterline'){const who=layout.lead;r(who.x-38,241,76,59,'#4f899e');for(let i=0;i<4;i++)r(who.x-35+i*22,244+i%2*5,16,2,'#b5d7d9');}
 if(plan.effect==='star-guide'){prop('star',220+p*240,76);if(index>=4)for(let i=0;i<3;i++)r(450+i*9,85+i%2*8,3,3,'#eddaa1');}
 if(plan.effect==='gifts'&&index>=3){prop('perfume',385,235);prop('myrrh',420,235);}
 if(plan.effect==='detour'){r(300,251,100,3,'#c6b37c');r(398,215,3,39,'#c6b37c');r(398,213,80,3,'#c6b37c');if(index>=3)for(let i=0;i<4;i++)r(401+i*16,216,5,3,'#e7d89f');}
 if(plan.effect==='dove-descend'){const xx=layout.lead.x,yy=65+p*80;prop('dove',xx,yy);r(xx-10,yy-3+(Math.floor(sample.elapsed*4)%2)*5,20,2,'#e9ebdf');}
 if(plan.effect==='kingdoms'&&index>=2){for(let i=0;i<5;i++){r(225+i*54,90,35,40+i%2*12,'#a48f70');r(232+i*54,79,20,14,'#b5a07d');r(235+i*54,108,10,22,'#3b5255');}}
 if(plan.effect==='cast-net'&&index>=3){const n=Math.min(1,(index-3+progress)/2);c.strokeStyle='#cbb997';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(325+i*16,220);c.lineTo(330+i*18,230+n*30);c.stroke();c.beginPath();c.moveTo(325,220+i*n*8);c.lineTo(410,220+i*n*8);c.stroke();}}
}
