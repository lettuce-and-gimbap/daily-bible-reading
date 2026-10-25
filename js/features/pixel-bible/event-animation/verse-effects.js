import {drawCreature} from '../creature-art.js';
import {CREATURES} from '../creatures.js';
import {drawWorldObject} from '../art.js';
export const VERSE_EFFECTS=new Set(['star-guide','gifts','detour','dove-descend','kingdoms','cast-net','remote-room','waterline','rooster-call','anoint-head','roof-descent']);
export function drawVerseEffects(c,sample,layout){
 const {plan,index,progress}=sample;if(!VERSE_EFFECTS.has(plan.effect))return;
 const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);},prop=(kind,x,y)=>drawWorldObject(c,{kind,x:Math.round(x),y:Math.round(y)},1,0),p=Math.min(1,(index+progress)/5);
 if(plan.effect==='roof-descent'){const xx=layout.prop.x,yy=layout.prop.y;r(xx-160,78,320,9,'#a48a65');r(xx-40,78,80,9,'#344849');for(const dx of [-40,40])r(xx+dx,85,2,Math.max(0,yy-85),'#c9b996');}
 if(plan.effect==='anoint-head'&&index>=2&&index<=3){const target=layout.positions[1];for(let i=0;i<4;i++)r(target.x-7+i*3,target.y-83+((Math.floor(progress*16)+i*5)%20),2,3,'#e3c887');}
 if(plan.effect==='rooster-call'){c.save();c.translate(510,235);c.scale(2,2);drawCreature(c,CREATURES.rooster,0,0,{frame:0,direction:'left'});c.restore();if(index>=3)for(let i=0;i<3;i++)r(527+i*9,180-i*9,3,5,'#eed39b');}
 if(plan.effect==='remote-room'){r(430,75,3,170,'#dac59b');c.fillStyle='#233d47';c.font='13px DungGeunMo,monospace';c.textAlign='center';c.fillText(plan.remoteLabel||'다른 장소',555,70);}
 if(plan.effect==='waterline'){const who=layout.lead;r(who.x-38,241,76,59,'#4f899e');for(let i=0;i<4;i++)r(who.x-35+i*22,244+i%2*5,16,2,'#b5d7d9');}
 if(plan.effect==='star-guide'){prop('star',220+p*240,76);if(index>=4)for(let i=0;i<3;i++)r(450+i*9,85+i%2*8,3,3,'#eddaa1');}
 if(plan.effect==='gifts'&&index>=3){prop('perfume',385,235);prop('myrrh',420,235);}
 if(plan.effect==='detour'){r(300,251,100,3,'#c6b37c');r(398,215,3,39,'#c6b37c');r(398,213,80,3,'#c6b37c');if(index>=3)for(let i=0;i<4;i++)r(401+i*16,216,5,3,'#e7d89f');}
 if(plan.effect==='dove-descend'){const xx=layout.lead.x,yy=65+p*80;prop('dove',xx,yy);r(xx-10,yy-3+(Math.floor(sample.elapsed*4)%2)*5,20,2,'#e9ebdf');}
 if(plan.effect==='kingdoms'&&index>=2){for(let i=0;i<5;i++){r(225+i*54,90,35,40+i%2*12,'#a48f70');r(232+i*54,79,20,14,'#b5a07d');r(235+i*54,108,10,22,'#3b5255');}}
 if(plan.effect==='cast-net'&&index>=3){const n=Math.min(1,(index-3+progress)/2);c.strokeStyle='#cbb997';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(325+i*16,220);c.lineTo(330+i*18,230+n*30);c.stroke();c.beginPath();c.moveTo(325,220+i*n*8);c.lineTo(410,220+i*n*8);c.stroke();}}
}
