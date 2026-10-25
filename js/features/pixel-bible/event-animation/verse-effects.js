import {drawWorldObject} from '../art.js';
export const VERSE_EFFECTS=new Set(['star-guide','gifts','detour','dove-descend','kingdoms','cast-net','remote-room']);
export function drawVerseEffects(c,sample,layout){
 const {plan,index,progress}=sample;if(!VERSE_EFFECTS.has(plan.effect))return;
 const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);},prop=(kind,x,y)=>drawWorldObject(c,{kind,x:Math.round(x),y:Math.round(y)},1,0),p=Math.min(1,(index+progress)/5);
 if(plan.effect==='remote-room'){r(430,75,3,170,'#dac59b');c.fillStyle='#233d47';c.font='13px DungGeunMo,monospace';c.textAlign='center';c.fillText('집에 있는 종',555,70);}
 if(plan.effect==='star-guide'){prop('star',220+p*240,76);if(index>=4)for(let i=0;i<3;i++)r(450+i*9,85+i%2*8,3,3,'#eddaa1');}
 if(plan.effect==='gifts'&&index>=3){prop('perfume',385,235);prop('myrrh',420,235);}
 if(plan.effect==='detour'){r(300,251,100,3,'#c6b37c');r(398,215,3,39,'#c6b37c');r(398,213,80,3,'#c6b37c');if(index>=3)for(let i=0;i<4;i++)r(401+i*16,216,5,3,'#e7d89f');}
 if(plan.effect==='dove-descend'){const xx=layout.lead.x,yy=65+p*80;prop('dove',xx,yy);r(xx-10,yy-3+(Math.floor(sample.elapsed*4)%2)*5,20,2,'#e9ebdf');}
 if(plan.effect==='kingdoms'&&index>=2){for(let i=0;i<5;i++){r(225+i*54,90,35,40+i%2*12,'#a48f70');r(232+i*54,79,20,14,'#b5a07d');r(235+i*54,108,10,22,'#3b5255');}}
 if(plan.effect==='cast-net'&&index>=3){const n=Math.min(1,(index-3+progress)/2);c.strokeStyle='#cbb997';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(325+i*16,220);c.lineTo(330+i*18,230+n*30);c.stroke();c.beginPath();c.moveTo(325,220+i*n*8);c.lineTo(410,220+i*n*8);c.stroke();}}
}
