import {drawVerseSymbols} from './verse-symbols.js';
import {drawCreature} from '../creature-art.js';
import {CREATURES} from '../creatures.js';
// Animated illustrations, explicitly distinguished from historical reconstructions.
import {drawWorldObject} from '../art.js';
const wrap=(text,width)=>{const lines=[];let line='';for(const ch of text){if(line.length>=width){lines.push(line);line='';}line+=ch;}if(line)lines.push(line);return lines;};
export function drawVerseDiagram(c,scene,sample){
 const {kind,labels,edgeLabels}=scene.animation.diagram,{index,progress}=sample,phase=Math.min(1,(index+progress)/5),shown=Math.min(labels.length,1+Math.floor((index+progress)*labels.length/5));
 const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const prop=(id,x,y,scale=1)=>{c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);drawWorldObject(c,{kind:id,x:0,y:0},1,0);c.restore();};
 const text=(s,x,y,size=15,color='#f6e7be')=>{c.fillStyle=color;c.font=size+'px DungGeunMo,monospace';c.textAlign='center';c.fillText(s,x,y);};
 r(14,12,692,28,'#233d47');text(scene.ref+' · '+scene.title,360,31,15);
 text('본문을 풀어 그린 상징 연출',360,61,12,'#304b50');
 const positions=labels.map((_,i)=>110+i*500/Math.max(1,labels.length-1));
 if(drawVerseSymbols(c,kind,sample,{r,prop,text,phase})){}else if(kind==='lineage'){
  for(let i=0;i<shown;i++){const x=positions[i];if(i){r(positions[i-1]+48,151,(x-positions[i-1]-96)*Math.min(1,phase*labels.length-i+1),3,'#d7c18a');if(edgeLabels)text(edgeLabels[i-1],(positions[i-1]+x)/2,115,12,'#304b50');}r(x-48,124,96,56,'#233d47');r(x-44,128,88,48,i===shown-1?'#6d8a77':'#526a64');for(const [j,line]of wrap(labels[i],7).entries())text(line,x,143+j*16,13);}
 }else if(['house','house-storm','house-fall'].includes(kind)){
  const sand=labels.some(l=>l.includes('모래')),fall=kind==='house-fall'&&index>=4;
  r(220,218,280,22,sand?'#c5af7c':'#778581');for(let i=0;i<9;i++)r(230+i*30,223+i%2*6,12,3,sand?'#dfc895':'#a1aaa0');
  if(!fall)prop('house',360+(kind==='house-storm'&&index===3?Math.floor(progress*4)%2*2:0),219,1.2);
  else for(let i=0;i<16;i++)r(270+i%8*23,192+Math.floor(i/8)*17,17,12,'#ab8c64');
  if(kind!=='house'&&index>=2){for(let i=0;i<30;i++)r(200+i*17,83+(i*31+sample.elapsed*55)%130,2,8,'#a5d3d8');r(180,236,360,5,'#6fabb9');}
 }else if(kind==='door'){
  const narrow=labels.some(s=>s.includes('좁'));r(295,85,130,140,'#9d8766');r(305,95,110,130,'#354b4d');const open=index>=4?1:index===3?progress:0;
  r(305,95,110*(1-open),130,'#bd9c6c');if(narrow){r(295,85,35,140,'#9d8766');r(390,85,35,140,'#9d8766');}if(index>=2&&index<=3)r(431+Math.floor(progress*4)%2*5,143,8,13,'#e4c69b');
  r(310,225,100,15,'#bdaf88');
 }else if(kind==='lamp'||kind==='light'){
  prop('lamp',360,195,2);if(kind==='lamp'&&index<3)prop('basket',360,163-index*8,2);
  const dark=labels.some(s=>s.includes('흐린')||s.includes('더 깊은'));if(index>=2&&!dark)for(let i=0;i<9;i++){const a=i*Math.PI/4;r(358+Math.cos(a)*75,153+Math.sin(a)*55,5,5,'#f7d981');}
  if(dark&&index>=3)r(280,95,160,110,'#233d47bb');
 }else if(kind==='growth'){
  if(index<2)prop('seed',360,210,2);else{const h=.45+phase*.9;prop('tree',360,220,h);if(index>=4)for(let i=0;i<3;i++)prop('fruit',330+i*30,145+i%2*15);}
 }else if(kind==='gift'){
  const food=labels.some(s=>s.includes('生선')||s.includes('생선'))?'fish':labels.some(s=>s.includes('옷'))?'cloak':'bread';
  prop(food,235+Math.round(phase*250),190,2);if(index>=3){r(487,194,60,6,'#dfbf97');r(541,177,6,23,'#dfbf97');}
 }else if(kind==='herd'||kind==='herd-water'){
  const water=kind==='herd-water';if(water){r(180,207,380,35,'#649aa4');r(180,210,380,3,'#a9d1d4');}
  for(let i=0;i<5;i++){const x=230+i*48+(water?phase*65:Math.sin(sample.elapsed+i)*2),y=water?145+Math.max(0,phase-.35)*155+i%2*4:199+i%2*11;if(!water||index<5)drawCreature(c,CREATURES.pig,Math.round(x),Math.round(y),{frame:Math.floor(sample.elapsed*4+i)%4,direction:'right',time:sample.elapsed});}
  if(water&&index>=3)r(180,213,380,30,'#649aa4');
 }else if(kind==='cloth-patch'){
  prop('cloak',360,204,2.5);r(335,126,45,40,'#a4c0aa');if(index>=3){for(let i=0;i<4;i++)r(352+i%2*6,124+i*12,5,12,'#344e55');}
 }else if(kind==='wineskin'){
  for(const x of [270,450]){r(x-7,95,14,26,'#7f604b');r(x-24,118,48,68,'#9b7757');r(x-20,121,40,60,'#c19970');r(x-4,100,8,12,'#d6b58b');}
  if(index>=3){r(263,124,5,57,'#3e4c4d');for(let i=0;i<5;i++)r(267+i*2,181+i*6,3,5,'#98546a');r(434,131,30,42,'#b17b76');}
 }else if(kind==='salt'){
  prop('bowl',360,187,2);if(index>=2)for(let i=0;i<14;i++)r(325+(i*17)%80,190+((i*7+sample.elapsed*18)%40),3,3,'#f2eee1');
 }else if(kind==='rain'){
  r(290,88,28,28,'#f2d78a');prop('cloud',440,113,1.8);if(index>=2)for(let i=0;i<16;i++)r(385+i*8,135+(i*13+sample.elapsed*28)%70,2,7,'#a8d4da');prop('tree',290,220,1.2);prop('tree',465,220,1.2);
 }else if(kind==='bird'){
  prop('dove',245+Math.round(phase*200),130+Math.floor(Math.sin(phase*Math.PI*2)*12),2);for(let i=0;i<7;i++)prop('seed',290+i*25,225);
 }else if(kind==='treasure'){
  prop('treasure-chest',360,200,2);if(index>=2)prop('gold',355,174,1.6);if(labels.some(s=>s.includes('손상'))&&index>=4)for(let i=0;i<8;i++)r(330+i*9,176+i%3*8,5,4,'#63786e');
 }else if(kind==='balance'){
  prop('scale',360,205,3);if(index>=2){prop('stone',290,178+Math.round(Math.sin(phase*Math.PI)*15));prop('stone',430,178-Math.round(Math.sin(phase*Math.PI)*15));}
 }else if(kind==='veil'){
  prop('sheep',360,205,2);if(index>=3){r(330,139,60,38,'#737f80');r(330,130,12,19,'#737f80');r(378,130,12,19,'#737f80');r(339,152,5,5,'#283e45');r(376,152,5,5,'#283e45');r(350,164,22,12,'#bfc6b8');}
 }else if(kind==='heart'||kind==='lament'||kind==='reconcile'){
  for(let j=0;j<2;j++){const x=300+j*120;const offset=kind==='reconcile'?Math.round((1-phase)*35)*(j?1:-1):0;r(x+offset-18,133,36,29,'#b77973');r(x+offset-25,139,50,17,'#b77973');r(x+offset-11,162,22,8,'#b77973');r(x+offset-4,170,8,7,'#b77973');}
  if(kind==='lament'&&index>=2)for(let i=0;i<5;i++)r(310+i*23,183+(i*7+sample.elapsed*12)%26,3,5,'#9fd0db');
  if(kind==='reconcile'&&index>=4)r(340,151,40,4,'#e3cf94');
 }else if(kind==='map'){
  for(let i=0;i<shown;i++){prop('house',positions[i],191);if(i)r(positions[i-1]+35,184,positions[i]-positions[i-1]-70,4,'#d1bb83');}prop('sandal',110+phase*500,223);
 }else if(kind==='separate'){
  prop('grain',275,195,2);prop('grain',445,195,2);if(index>=3){r(355,96,5,116,'#dccb96');for(let i=0;i<5;i++)r(425+i*8,180+i%3*5,4,3,'#8a7e69');}
 }else if(kind==='judgment'||kind==='warning'){
  prop(kind==='judgment'?'scale':'lamp',360,195,2.5);if(index>=3){r(290,108,8,46,'#d7a372');r(293,165,5,6,'#d7a372');r(422,108,8,46,'#d7a372');r(425,165,5,6,'#d7a372');}
 }else if(kind==='comparison'){
  prop('scroll',255,195,2);prop('scroll',465,195,2);r(357,105,5,105,'#ae9e79');if(index>=3)for(let i=0;i<3;i++)r(437+i*14,135+i*12,5,5,'#b8d0a1');
 }else{prop('scroll',260,198,2);if(index>=2){r(300,154,110*phase,4,'#dac58e');prop('star',455,177,2);}}
 if(kind!=='lineage')for(let i=0;i<shown;i++){r(positions[i]-92,232,184,24,'#233d47');text(labels[i],positions[i],249,13);}
 const rows=wrap(scene.study,48);rows.slice(0,2).forEach((line,i)=>text(line,360,277+i*16,13,'#233d47'));
 for(let i=0;i<6;i++)r(535+i*27,46,23,4,i<=index?'#d8bc75':'#607878');
}
