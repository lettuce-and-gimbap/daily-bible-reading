import {drawEventActor} from './cinematic-actor.js';
import {drawWorldObject} from './art.js';
import {directionFor,sceneBeat} from './cinematic-scenes.js';
export function renderCinematic(c,scene,actors,seconds=0,{portrait=false}={}){
 const d=directionFor(scene),p=sceneBeat(seconds),t=Math.floor(seconds*8)/8;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 c.clearRect(0,0,720,300);r(0,0,720,300,'#b2a080');
 const inside=['chamber','court','temple'].includes(d.setting);
 r(0,0,720,220,inside?'#6b6965':'#8fabb0');
 if(inside){for(let j=0;j<8;j++)for(let i=0;i<15;i++)r(i*52+(j%2)*26,j*27,49,24,j%2?'#77716a':'#80786e');r(70,25,32,195,'#b8a47f');r(610,25,32,195,'#b8a47f');r(290,30,140,120,'#353f48');r(294,34,132,112,'#759399');r(352,34,7,112,'#c2ae85');}
 else{for(let i=0;i<10;i++){r(i*90,120+(i%3)*12,100,100,'#71877b');r(i*90+20,100+(i%3)*12,60,20,'#71877b');}r(0,205,720,15,'#819078');}
 if(['gate','ruins'].includes(d.setting)){r(0,30,210,190,'#847b69');r(510,30,210,190,'#847b69');for(let i=0;i<10;i++){r(i*75,30,40,15,'#a6987e');}r(210,60,300,160,'#4e5351');}
 if(d.setting==='stairs'){for(let i=0;i<6;i++)r(400+i*30,220-i*22,220-i*30,22,'#a39277');}
 const river=['river','spring','valley'].includes(d.setting);if(river){r(0,232,720,68,'#457e95');for(let i=0;i<28;i++)r((i*31+t*7)%720,240+i%4*16,19,2,'#91c5c8');}
 const people=actors.filter(Boolean);
 if(portrait){c.save();c.translate(0,-70);c.scale(2,2);people.slice(0,2).forEach((n,i)=>drawEventActor(c,n,i,{x:110+i*140,y:190,time:t,face:i?-1:1,emotion:d.emotion,progress:p}));c.restore();return;}
 if(scene.object&&!['cloak','arrow','oil'].includes(scene.object)){c.save();c.translate(390,215);c.scale(1.8,1.8);drawWorldObject(c,{kind:scene.object,x:0,y:0},1,0);c.restore();}
 people.forEach((n,i)=>{const x=d.pose==='lie'&&i===d.lead?390:people.length===1?290:165+i*390/Math.max(1,people.length-1);c.save();c.translate(x,d.pose==='lie'?220:235);const scale=d.pose==='lie'?1:1.65;c.scale(scale,scale);drawEventActor(c,n,i,{x:0,y:0,time:t,pose:i===d.lead?d.pose:'speak',emotion:i===d.lead?d.emotion:'resolve',face:i%2?-1:1,progress:p,prop:scene.object});c.restore();c.fillStyle='#fff3cd';c.font='13px monospace';c.textAlign='center';c.fillText(n.name,x,285);});
 const particles=(color,count=12)=>{for(let i=0;i<count;i++)r(350+(i%4)*9,155+(i*7+p*70)%65,3,4,color);};
 switch(d.effect){
 case 'divide':{const gap=Math.round(p*85);r(360-gap,232,gap*2,68,'#b7a17b');r(355-gap,232,5,68,'#c8dddd');r(360+gap,232,5,68,'#c8dddd');break;}
 case 'oil':for(let i=0;i<5;i++){r(390+i*27,200,17,23,'#a97045');r(393+i*27,204,11,Math.round(p*16),'#d8ae53');}particles('#dbb75c');break;
 case 'anoint':r(550,101,3,Math.round(p*28),'#e2bf5b');break;
 case 'salt':case 'flour':particles('#eee1ba');break;
 case 'axe':r(420,250-Math.round(p*29),15,8,'#b5c5c7');r(426,255-Math.round(p*29),4,22,'#8d613e');break;
 case 'fire':case 'burn':for(let i=0;i<12;i++){r(i*62,190-Math.round(Math.sin(t*4+i)*8),15,30,'#d57438');r(i*62+3,198,8,22,'#f1c567');}break;
 case 'coins':for(let i=0;i<8;i++)r(345+i*9,215-Math.round(p*10)*(i%2),6,4,'#ddc16a');break;
 case 'arrow':r(350+Math.round(p*230),150,45,2,'#dfcba3');break;
 case 'ground-arrows':for(let i=0;i<3;i++)r(345+i*15,214,2,28,'#bd9463');break;
 case 'shadow':r(430-Math.round(p*85),218,95,6,'#3d474955');break;
 case 'music':for(let i=0;i<4;i++){c.fillStyle='#f1d386';c.font='18px serif';c.fillText('♪',370+i*25,140-(t*15+i*10)%60);}break;
 case 'tears':r(305,134+(t*8)%25,2,4,'#a3d5df');break;
 case 'break':r(390,210,12,9,'#917554');r(410,216,8,6,'#917554');break;
 case 'crown':r(550,96,26,6,'#dfc071');break;
 case 'fig':r(548,168,13,8,'#99835e');break;
 case 'wash':for(let i=0;i<7;i++)r(530+i*6,238+Math.sin(t*3+i)*3,4,2,'#d7e5cf');break;
 case 'letter':case 'scroll':case 'covenant':case 'plan':r(350,211,75,3,'#e9d8ad');break;
 case 'tear':r(312,163,3,27,'#e4c2a0');break;
 case 'cloak':case 'robe':r(362,198,38,22,'#9c795e');r(367,202,4,18,'#c9b488');break;
 default:break;
 }
}
export function mountCinematic(host,scene,actors,{portrait=false}={}){
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=300;canvas.setAttribute('aria-label',scene.title+' 사건 애니메이션');canvas.style.cssText='width:100%;max-height:48vh;object-fit:contain;image-rendering:pixelated;background:#253943';host.prepend(canvas);
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;let frame,closed=false,start=performance.now();
 function draw(now){if(closed||!canvas.isConnected)return;renderCinematic(c,scene,actors,(now-start)/1000,{portrait});frame=requestAnimationFrame(draw);}
 frame=requestAnimationFrame(draw);return ()=>{closed=true;cancelAnimationFrame(frame);canvas.remove();};
}
