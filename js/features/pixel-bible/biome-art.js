// Original pixel terrain: different landforms and routes, not palette swaps.
import {riverLeftAt} from './terrain-response.js';
export function drawBiomeGround(c,p,w,h){
 const r=(x,y,a,b,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(a),Math.round(b));};
 const m=p.motif;
 const pool=(cx,cy,rx,ry)=>{for(let y=-ry;y<ry;y+=8){const half=Math.sqrt(Math.max(0,1-y*y/(ry*ry)))*rx;r(cx-half-12,cy+y,half*2+24,10,p.bank);r(cx-half,cy+y,half*2,8,p.water);}for(let y=cy-ry/2;y<cy+ry/2;y+=24)r(cx-rx/2,y,rx,2,p.wave);};
 const terrace=(x,y,width,levels)=>{for(let i=0;i<levels;i++){r(x+i*12,y+i*15,width-i*20,18,p.hill);r(x+i*12,y+i*15,width-i*20,4,p.bank);for(let xx=x+20+i*12;xx<x+width-i*8;xx+=36)r(xx,y+i*15+7,18,2,p.roof);}};
 if(['lake','galilee'].includes(m)){pool(m==='lake'?w*.2:w*.83,h*.7,w*.22,h*.25);for(let i=0;i<5;i++){const x=(m==='lake'?w*.32:w*.65)+i*5;r(x,h*.7+i*5,80,4,p.roof);}}
 if(['river','garden','newcity'].includes(m))for(let y=150;y<h-80;y+=8){const x=riverLeftAt(m,y);r(x-14,y,110,8,p.bank);r(x,y,82,8,p.water);if(y%32===22)r(x+16,y,30,2,p.wave);}
 if(['mountains','sinai','ruins'].includes(m)){terrace(80,220,w*.23,6);terrace(w*.7,h*.63,w*.24,5);}
 if(['dunes','camp'].includes(m))for(let i=0;i<7;i++){const x=(i%2?w*.7:w*.06),y=190+i*h*.09;for(let k=0;k<6;k++)r(x+k*12,y+k*5,200-k*24,5,k%2?p.tile[0]:p.bank);}
 if(['harvest','vineyard'].includes(m))for(const [x,y]of [[w*.08,h*.3],[w*.6,h*.66]]){r(x-8,y-8,w*.29,h*.18,p.bank);r(x,y,w*.28,h*.16,p.path);for(let yy=y+12;yy<y+h*.16;yy+=18)for(let xx=x+10;xx<x+w*.28;xx+=18){r(xx,yy,2,9,p.roof);r(xx-2,yy,6,4,m==='harvest'?'#d7bd70':p.hill);if(m==='vineyard')r(xx,yy+5,3,4,'#80618a');}}
 if(m==='pasture'){pool(w*.22,h*.7,100,56);r(w*.65,h*.27,w*.22,4,p.roof);for(let x=w*.65;x<w*.87;x+=22)r(x,h*.27-10,3,24,p.roof);}
 if(['city','temple','babylon','newcity'].includes(m))for(const [x,y]of [[w*.08,h*.28],[w*.66,h*.62]]){r(x,y,w*.25,h*.18,p.path);for(let yy=y;yy<y+h*.18;yy+=18)for(let xx=x;xx<x+w*.25;xx+=28){r(xx,yy,24,1,p.roof);r(xx,yy,1,14,p.roof);}}
 if(m==='village')for(const [x,y]of [[w*.13,h*.3],[w*.65,h*.65]]){r(x,y,180,85,p.bank);for(let yy=y+8;yy<y+80;yy+=18)for(let xx=x+10;xx<x+175;xx+=17){r(xx,yy,7,3,p.hill);r(xx+2,yy-3,3,4,p.speck);}}
 if(m==='sunset')for(let i=0;i<5;i++)terrace(60+i*w*.19,240+(i%2)*h*.46,w*.15,3);
 if(m==='stars'){pool(w*.75,h*.73,130,70);for(let i=0;i<8;i++){r(w*.08+i*w*.11,h*.3,6,8,'#dac47e');r(w*.08+i*w*.11-5,h*.3+9,16,2,p.pathLight);}}
}
export function drawBiomePaths(c,p,w,h){
 const r=(x,y,a,b,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(a),Math.round(b));};
 const m=p.motif;
 if(['city','temple','babylon','newcity','village'].includes(m)){
  const cx=w*(m==='babylon'?.6:.5),cy=h*.55;r(80,cy,w-160,36,p.path);r(cx-18,145,36,h-300,p.path);r(cx-90,cy-38,180,112,p.pathLight);
  if(m==='city'||m==='babylon')for(const x of [w*.25,w*.76])r(x,200,22,h*.55,p.path);
 }else if(m==='camp'){
  for(let y=0;y<240;y+=8){const outer=Math.sqrt(Math.max(0,1-(y-120)**2/14400))*260,inner=Math.max(0,outer-26);r(w*.5-outer,h*.5+y-120,outer-inner,8,p.path);r(w*.5+inner,h*.5+y-120,outer-inner,8,p.path);}r(w*.5-14,h*.5,28,h*.35,p.path);
 }else{
  for(let x=80;x<w-80;x+=12){const y=h*.52+Math.sin(x/(m==='mountains'?170:310))*h*.065;r(x,y,14,['dunes','sinai','mountains'].includes(m)?22:30,p.path);if(x%60===20)r(x,y+5,8,2,p.pathLight);}
 }
}
export function drawBiomeLandmarks(c,p,w,h){
 const r=(x,y,a,b,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(a),Math.round(b));};
 const m=p.motif;
 const grove=(x,y)=>{r(x-3,y-22,6,26,p.roof);r(x-21,y-58,42,7,p.hill);r(x-29,y-51,58,24,p.hill);r(x-20,y-28,40,6,p.hill);r(x-19,y-49,20,6,p.speck);r(x+9,y-40,14,5,p.tile[0]);r(x-8,y+4,25,3,p.bank);};
 if(['garden','village','pasture','sunset'].includes(m))for(let i=0;i<(m==='garden'?23:8);i++){const x=i%2?w*.87+(i%3)*22:w*.08+(i%4)*28,y=220+i*27;grove(x,y);if(m==='garden'){r(x-10,y-36,4,4,'#c38c68');r(x+12,y-43,4,4,'#c38c68');}}
 if(m==='babylon')for(const x of [w*.2,w*.8]){r(x-38,200,76,110,'#567e98');r(x-44,190,88,12,p.house);for(let y=215;y<300;y+=18)for(let xx=x-30;xx<x+30;xx+=20)r(xx,y,9,4,'#d6b86d');}
 if(m==='ruins')for(let i=0;i<12;i++){const x=100+i*(w-200)/11,y=h*.75+(i%3)*15;r(x,y,30,18,p.roof);r(x-6,y-5,20,10,p.house);r(x+27,y+10,14,7,p.bank);}
 if(m==='temple')for(const x of [w*.26,w*.74]){r(x-12,220,24,100,p.roof);r(x-20,212,40,12,p.house);r(x-20,320,40,8,p.house);r(x-5,230,4,78,p.pathLight);}
 if(m==='galilee'||m==='lake'){const x=m==='galilee'?w*.7:w*.3,y=h*.65;for(let i=0;i<9;i++){r(x+i*6,y+i*4,90,5,p.roof);r(x+i*6+2,y+i*4,86,1,p.house);}for(let i=0;i<3;i++){r(x+i*28,y-12,4,60,p.roof);r(x+i*28-2,y-14,8,3,p.house);}}
 if(m==='camp')for(let i=0;i<12;i++){const a=i*Math.PI/6,x=w*.5+Math.cos(a)*310,y=h*.5+Math.sin(a)*180;r(x-6,y,12,3,p.bank);r(x-4,y-7,8,7,p.roof);}
 if(m==='newcity')for(let i=0;i<7;i++){const x=w*.68+Math.sin((250+i*84)/140)*w*.065;r(x-10,240+i*84,110,8,p.pathLight);grove(x+130,270+i*84);}
}
