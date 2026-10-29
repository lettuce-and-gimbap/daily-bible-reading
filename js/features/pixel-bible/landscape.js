import {drawBiomeGround,drawBiomePaths,drawBiomeLandmarks} from './biome-art.js';
import {drawWorldObject} from './art.js';
import {backgroundFor} from './backgrounds.js';
// 지형은 전체 지도 좌표로 한 번만 구성한다. 중심은 보행 공간, 큰 경관은 가장자리다.
export function drawWholeBackground(c,key,width=1920,height=1080,{decorations=true,hour=12,elevation=null,cloud=0}={}){
 const p=backgroundFor(key),m=p.motif;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const hash=(x,y)=>(Math.imul(x+17,374761393)^Math.imul(y+31,668265263))>>>0;
 const horizon=156;
 r(0,0,width,horizon,p.sky||p.hill);r(0,horizon,width,height-horizon,p.ground);
 for(let y=horizon;y<height;y+=24)for(let x=0;x<width;x+=24){
  const h=hash(x/24,y/24);if((h>>>7)%7<2){c.globalAlpha=.35;r(x,y,24,24,p.tile[(h>>>9)%2]);c.globalAlpha=1;}
  if(h%5===0){r(x+4,y+14,2,4,p.speck);r(x+8,y+11,2,5,p.speck);}
  if(h%23===0){r(x+16,y+9,2,2,p.pathLight);r(x+15,y+10,4,1,p.pathLight);}
 }
 // A compact pixel sun/moon follows the local KST hour across the sky band.
 const h=((hour%24)+24)%24,night=elevation!==null?elevation<=0:(h<6||h>=18);
 const progress=night?(h>=18?1-(h-18)/12:(6-h)/12):(h-6)/12;
 const cx=width*(.04+.92*progress),cy=elevation!==null?Math.max(20,Math.min(136,138-Math.max(-12,elevation)*5.5)):112-Math.sin(progress*Math.PI)*76;
 c.save();c.globalAlpha=.18;c.fillStyle=night?'#d8e4f2':'#ffe2a1';c.fillRect(cx-20,cy-20,40,40);c.globalAlpha=.35;c.fillRect(cx-14,cy-25,28,50);c.globalAlpha=1;
 if(night){c.fillStyle='#dbe5ef';c.beginPath();c.arc(cx,cy,11,0,Math.PI*2);c.fill();c.fillStyle=p.sky||p.hill;c.beginPath();c.arc(cx+6,cy-4,9,0,Math.PI*2);c.fill();}
 else {c.fillStyle=h<8||h>=16?'#efb16c':'#ffe18a';c.fillRect(cx-8,cy-11,16,22);c.fillRect(cx-11,cy-8,22,16);c.fillStyle='#fff0ba';c.fillRect(cx-4,cy-6,8,12);}
 c.restore();
 // 中央広場から分岐する道。縮小時にも一つの지형として読める輪郭。
 const roadY=height*.55,roadX=width*.5;
 drawBiomeGround(c,p,width,height);drawBiomePaths(c,p,width,height);
 const stone=(x,y,s=1)=>{r(x-9*s,y-8*s,18*s,9*s,p.hill);r(x-6*s,y-11*s,11*s,5*s,p.roof);r(x-5*s,y-10*s,5*s,2*s,p.bank);};
 const tree=(x,y,type='leaf')=>{
  r(x-3,y-18,6,23,p.roof);
  if(type==='palm'){for(let i=0;i<4;i++)r(x-35+i*5,y-48+i*7,70-i*10,5,p.hill);}
  else {r(x-22,y-53,44,9,p.hill);r(x-30,y-44,60,23,p.hill);r(x-22,y-21,44,8,p.hill);r(x-19,y-46,24,7,p.tile[0]);r(x-26,y-35,13,8,p.speck);}
 };
 const house=(x,y,s=1)=>{r(x-27*s,y-44*s,54*s,45*s,p.house);r(x-32*s,y-51*s,64*s,9*s,p.roof);r(x-6*s,y-22*s,12*s,23*s,p.hill);r(x-20*s,y-33*s,7*s,8*s,p.hill);r(x+13*s,y-33*s,7*s,8*s,p.hill);r(x-28*s,y-3*s,56*s,3*s,p.bank);};
 const tent=(x,y)=>{for(let i=0;i<12;i++)r(x-i*3,y-62+i*4,Math.max(2,i*6),4,p.house);r(x-36,y-14,72,20,p.roof);r(x-7,y-29,14,35,p.hill);r(x-40,y+5,80,2,p.pathLight);};
 const wall=(y,ruined=false)=>{
  r(80,y,width-160,38,p.roof);for(let x=80;x<width-80;x+=34){if(!ruined||hash(x,1)%3)r(x,y-13,20,13,p.house);r(x+8,y+9,20,2,p.house);r(x+4,y+26,22,2,p.house);}
  for(const x of [180,width/2,width-180]){r(x-27,y-36,54,74,p.house);r(x-32,y-43,64,9,p.roof);r(x-8,y+4,16,34,p.hill);}
 };
 // 언덕과 강은 외곽에 한 번 배치해 반복 타일의 이음매를 없앤다.
 const ridgeCount=['sinai','mountains'].includes(m)?9:m==='dunes'?5:0;
 for(let i=0;i<ridgeCount;i++){
  const x=i*width/(ridgeCount-1),top=16+hash(i,3)%40;
  for(let yy=top;yy<100;yy+=6){const half=(yy-top)*(m==='sinai'||m==='mountains'?1.1:2)+9;r(x-half,yy,half*2,6,i%2?p.hill:p.roof);}
 }
 const water=['lake','galilee'].includes(m);
 if(water)r(0,height-126,width,126,p.water);
 if(water){
  for(let x=0;x<width;x+=24)r(x,height-136-(hash(x,2)%3)*4,24,12,p.bank);
  for(let y=height-108;y<height;y+=24)for(let x=14;x<width;x+=64)r(x+(y%17),y,22+(hash(x,y)%18),2,p.wave);
  if(['river','garden','newcity'].includes(m)){
   for(let y=140;y<height-120;y+=12){const x=width-70+Math.round(Math.sin(y/130)*12);r(x,y,width-x,12,p.water);if(y%36===8)r(x+8,y,28,2,p.wave);}
  }
 }else if(['dunes','sinai','mountains','ruins'].includes(m))for(let x=32;x<width;x+=96){stone(x,height-68,1+hash(x,3)%2);r(x-9,height-29,28,2,p.pathLight);}
 for(let i=0;i<15;i++){
  const x=100+i*(width-200)/14,y=135+hash(i,8)%24;
  if(m==='camp')tent(x,y);
  else if(m==='dunes')stone(x,y,1.5);
  else if(m==='village'&&i%3===0)house(x,y);
  else if(['city','babylon','temple','newcity','ruins'].includes(m))house(x,y,m==='babylon'?1.3:1);
  else if(['sinai','mountains'].includes(m))stone(x,y,2+hash(i,2)%3);
  else tree(x,y,m==='river'?'palm':'leaf');
 }
 if(['city','babylon','temple','newcity','ruins'].includes(m))wall(102,m==='ruins');
 if(m==='temple'){
  const x=width/2;r(x-110,40,220,15,p.house);r(x-95,55,190,90,p.roof);for(let dx=-85;dx<=85;dx+=34)r(x+dx,55,12,95,p.house);r(x-115,145,230,9,p.house);
 }
 if(m==='sinai'){
  const x=width*.56;for(let y=8;y<130;y+=5){const half=(y+15)*1.1;r(x-half,y,half*2,5,p.hill);}
  for(let i=0;i<7;i++)r(x-75+i*23,30+i%2*8,34,8,'#b5b5a6');
 }
 if(m==='newcity'){
  for(let i=0;i<12;i++)r(150+i*(width-300)/11,86,5,6,['#ecd391','#8cb9bb','#bf9bb7'][i%3]);
  for(const x of [50,width-38])for(let y=260;y<height-200;y+=140)tree(x,y);
 }
 for(let y=240;y<height-170;y+=112)for(const x of [36,width-36]){
  if(['harvest','vineyard','pasture','garden','village','galilee'].includes(m)){
   if(m==='harvest'){for(let i=0;i<5;i++){r(x-20+i*8,y-30,2,35,p.roof);r(x-22+i*8,y-29,6,12,'#d5bc70');}}
   else if(m==='vineyard'){r(x-26,y-20,52,3,p.roof);for(let i=0;i<4;i++){r(x-22+i*14,y-30,3,38,p.roof);r(x-24+i*14,y-24,12,6,p.hill);r(x-20+i*14,y-14,4,6,'#91759a');}}
   else tree(x,y);
  }else stone(x,y,2);
 }

 if(m==='harvest'||m==='vineyard'){
  // 낮은 밭 무늬는 보행 가능한 땅의 일부다. 길은 중앙에 남긴다.
  for(const left of [150,width*.62])for(let row=0;row<5;row++){
   const y=height-255+row*18;r(left-8,y+8,width*.25,2,p.path);
   for(let x=left;x<left+width*.24;x+=19){
    if(m==='harvest'){r(x,y,1,9,p.roof);r(x-2,y,5,4,'#d1b16b');r(x-1,y-2,3,4,'#e6c57d');}
    else {r(x-4,y,9,3,p.hill);r(x,y+2,2,3,'#8d7490');}
   }
  }
 }
 if(m==='garden'){
  for(let i=0;i<80;i++){const x=100+hash(i,21)%(width-200),y=190+hash(i,22)%(height-370);if(Math.abs(x-roadX)<130||Math.abs(y-roadY)<50)continue;r(x,y,2,2,['#d3bf83','#c69a8e','#91b4ac'][i%3]);r(x-1,y+2,4,1,p.speck);}
  for(let i=0;i<4;i++)r(width*.25+i*width*.17,height-100,8,100,p.wave);
 }
 if(m==='temple'||m==='city'||m==='newcity'){
  for(let y=roadY-25;y<roadY+60;y+=17)for(let x=roadX-85;x<roadX+85;x+=25){r(x,y,19,1,p.roof);r(x,y,1,12,p.roof);}
 }
 if(m==='galilee')for(let i=0;i<5;i++){const x=width*.2+i*width*.15,y=height-67;r(x-25,y,50,7,p.roof);r(x-20,y+7,40,5,p.roof);r(x,y-30,2,30,p.house);r(x+2,y-30,20,21,p.house);}
 if(m==='pasture')for(let i=0;i<8;i++){const x=70+i*(width-140)/7,y=height-155;r(x-9,y-9,18,11,'#e2dec6');r(x+7,y-13,7,8,p.hill);r(x-6,y+2,2,5,p.hill);r(x+5,y+2,2,5,p.hill);}
 if(m==='stars')for(let i=0;i<36;i++){const x=hash(i,7)%width,y=hash(i,9)%75;r(x,y,2,2,p.pathLight);}
 drawBiomeLandmarks(c,p,width,height);
 if(decorations)for(const o of sceneDecorations(key))drawWorldObject(c,o,24);
}

// 고정 경관은 사용자 배치와 분리하고 깊이 정렬·충돌에 참여시킨다.
export function sceneDecorations(key){
 const m=backgroundFor(key).motif,props=[];
 const put=(kind,x,y)=>props.push({kind,x,y,scenery:true});
 const layouts={
 village:[['house',13,12],['house',66,15],['well',22,30],['tree',14,28],['tree',65,32],['basket',25,33]],
 dunes:[['stone',14,16],['stone',61,29],['bush',20,34]],
 lake:[['boat',19,34],['net',27,31],['reed',15,28],['tree',66,17]],
 galilee:[['boat',62,32],['net',57,28],['house',16,15],['basket',54,26]],
 mountains:[['stone',14,15],['stone',20,21],['stone',64,30],['bush',60,15]],
 sinai:[['stone',16,18],['stone',61,17],['altar',24,31]],
 river:[['palm',18,17],['reed',58,28],['stone',20,34]],
 garden:[['fig-tree',17,18],['fruit',21,24],['olive-tree',63,29]],
 harvest:[['house',18,12],['basket',24,31],['millstone',63,29]],
 vineyard:[['house',65,13],['grapes',19,31],['basket',24,28]],
 pasture:[['tree',16,16],['well',62,30],['bush',19,32]],
 camp:[['tent',19,18],['tent',60,19],['tent',22,30],['tent',58,32]],
 city:[['house',16,17],['house',65,18],['house',19,31],['well',62,32]],
 babylon:[['palm',18,25],['palm',61,25],['house',16,13],['house',65,13]],
 ruins:[['stone-pillar',18,20],['stone',22,32],['stone-pillar',63,29]],
 temple:[['altar',24,25],['basin',57,24],['lampstand',23,31]],
 newcity:[['olive-tree',24,17],['fruit',58,27],['olive-tree',63,34]],
 sunset:[['tree',18,18],['tree',62,30],['barley',22,31]],
 stars:[['house',18,14],['lamp',23,26],['house',63,15],['lamp',60,31]],
 };
 for(const [kind,x,y]of layouts[m]||layouts.village)put(kind,x,y);
 const patches={
 village:['house','tree','basket','well'], garden:['fig-tree','fruit','lily','olive-tree'],
 dunes:['stone','bush'], mountains:['stone','bush'], sinai:['stone'],
 river:['palm','reed','bush'],lake:['reed','tree','net'],galilee:['net','basket','house','boat'],
 camp:['tent','basket','jar'],harvest:['barley','basket','millstone'],vineyard:['vine','grapes','basket'],
 pasture:['bush','sheep','tree'],city:['house','jar','basket'],babylon:['palm','house','stone-pillar'],
 ruins:['stone','stone-pillar'],temple:['stone-pillar','lampstand'],newcity:['olive-tree','fruit','lily'],
 sunset:['barley','tree','bush'],stars:['house','lamp','tree']};
 const kinds=patches[m]||patches.village;
 // Irregular peripheral clusters leave the central roaming area open.
 for(let i=0;i<14;i++){
  const right=i%2,band=Math.floor(i/2),x=right?57+(band*7%16):8+(band*9%17),y=10+(band*11%27);
  if(!props.some(o=>Math.hypot(o.x-x,o.y-y)<2.8))put(kinds[i%kinds.length],x,y);
 }

 if(m==='harvest')for(const x of [15,21,59,65])put('field',x,21);
 if(m==='pasture')for(const [x,y]of [[16,19],[20,32],[59,32],[64,20]])put('sheep',x,y);
 if(m==='garden'||m==='newcity')for(const [x,y]of [[24,11],[56,11],[22,31],[58,31]])put(m==='garden'?'fig-tree':'olive-tree',x,y);
 if(m==='galilee'||m==='lake')for(const x of [19,61])put('net',x,34);
 if(m==='camp'){put('tabernacle',40,9);put('well',63,20);}
 if(m==='city'||m==='babylon'||m==='temple'){put('house',13,23);put('house',67,23);put('well',60,33);}
 // 같은 분위기(motif)를 쓰는 뒤쪽 배경 20종은 이름에 맞는 소품을 더해 앞선 배경과 경관이 겹치지 않게 한다.
 const variants={
  'olive-grove':[['olive-tree',12,26],['olive-tree',68,22],['stone',60,10]],
  'date-garden':[['palm',12,26],['palm',68,24],['fruit',55,12]],
  'palm-oasis':[['palm',12,24],['palm',66,26],['reed',20,36]],
  'spring-river':[['reed',14,22],['stone',66,24],['lily',58,36]],
  'terraced-valley':[['stone',12,28],['vine',66,12],['basket',60,36]],
  'cedar-ridge':[['cedar',12,26],['cedar',68,22],['stone',55,34]],
  'red-canyon':[['stone',10,24],['stone',70,20],['stone',64,36]],
  'moonlit-shore':[['reed',12,36],['boat',66,36],['lamp',58,12]],
  'barley-dusk':[['barley',12,26],['barley',68,24],['sickle',58,36]],
  'stone-ravine':[['stone-pillar',12,26],['stone',68,24],['stone',58,36]],
  'island-cove':[['boat',14,38],['net',66,38],['basket',60,12]],
  'high-desert':[['stone',10,26],['bush',70,22],['stone',56,36]],
  'acacia-camp':[['tent',12,26],['tree',68,22],['basket',58,36]],
  'walled-quarter':[['wall',12,26],['wall',68,22],['tower',58,10]],
  'vineyard-twilight':[['vine',12,26],['vine',68,22],['lamp',58,36]],
  'temple-court':[['stone-pillar',12,26],['stone-pillar',68,22],['censer',58,36]],
  'shepherd-meadow':[['sheep',12,26],['sheep',68,22],['staff',58,36]],
  'blue-night-lake':[['reed',12,26],['lamp',68,22],['boat',58,36]],
  'eastern-palace':[['stone-pillar',12,26],['palm',68,22],['lamp',58,36]],
  'river-of-life':[['olive-tree',12,26],['lily',68,22],['fruit',58,36]],
 };
 for(const [kind,x,y] of variants[key]||[])put(kind,x,y);
 if(key==='nile'){put('reed',54,18);put('basket',55,19);}
 if(key==='river')put('stone',54,19);
 return props.sort((a,b)=>a.y-b.y);
}
