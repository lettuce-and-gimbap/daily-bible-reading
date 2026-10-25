// Pixel stage backgrounds are deliberately distinct from the archived humanoid renderer.
export function drawStage(c,setting,time=0){
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const inside=['chamber','court','temple','store'].includes(setting),night=['night','cave'].includes(setting),water=setting==='water';
 r(0,0,720,300,night?'#263a51':inside?'#a09279':'#a6c3c3');r(0,215,720,85,setting==='desert'?'#cfb684':setting==='pasture'||setting==='garden'?'#79986a':'#b9ae87');
 if(inside){for(let y=0;y<210;y+=26)for(let x=-26;x<730;x+=52)r(x+(y/26%2)*26,y,49,23,'#b0a38a');r(320,28,80,100,'#4d6f79');r(325,33,70,90,night?'#344c6c':'#91bac5');r(356,33,5,90,'#b7a47d');if(setting==='court'||setting==='temple'){for(const x of [75,615]){r(x,30,25,185,'#c6b58f');r(x-7,25,39,10,'#e1d0a8');r(x-5,205,35,10,'#e1d0a8');}}}
 else if(setting!=='cave'){for(let i=0;i<9;i++){r(i*92,147+i%3*13,110,68,'#7a9381');r(i*92+19,128+i%3*13,70,20,'#7a9381');}if(!night){r(620,30,28,24,'#f2dda2');r(615,35,38,14,'#f2dda2');}}
 if(water){r(0,224,720,76,'#4f899e');for(let i=0;i<28;i++)r((i*31+Math.floor(time*4))%720,233+i%4*18,18,2,'#a7ced2');}
 if(setting==='road')r(0,225,720,34,'#c6bb94');
 if(setting==='night'){for(let i=0;i<26;i++)r(i*97%720,16+i*23%115,2,2,'#d1ded4');}
 if(setting==='cave'){r(0,0,90,215,'#505b58');r(630,0,90,215,'#505b58');r(0,0,720,50,'#505b58');r(70,45,50,60,'#505b58');r(600,45,50,60,'#505b58');}
 if(setting==='wall'||setting==='gate'){for(let y=90;y<215;y+=22)for(let x=10;x<710;x+=44)r(x+(y%2)*10,y,40,19,'#9a947c');for(let x=10;x<720;x+=60)r(x,77,30,14,'#9a947c');r(300,132,120,83,'#5d5d4d');}
 if(setting==='well'){r(343,185,36,30,'#80776b');r(338,183,46,6,'#b4b29d');r(348,187,26,7,'#3f5257');}
 if(setting==='tent'){r(100,90,60,125,'#97795c');r(160,125,60,90,'#ba9d71');r(220,160,40,55,'#d0b485');r(110,150,25,65,'#4e4e43');}
 if(setting==='ruins'){for(let i=0;i<13;i++)r(40+i*54,194-i%3*7,32,22,'#837f70');}
 if(setting==='pasture'||setting==='garden'){for(let i=0;i<24;i++){const x=i*73%720,y=225+i*17%65;r(x,y,2,6,'#a3bd78');r(x+3,y-2,2,8,'#6c8c56');}}
 for(let i=0;i<20;i++)if(!water)r(i*83%720,222+i*17%70,5,2,'#d2c59b');
}
