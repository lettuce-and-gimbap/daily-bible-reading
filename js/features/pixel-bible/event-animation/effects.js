import {drawWorldObject} from '../art.js';
export const EFFECTS=new Set('transfiguration ascension baptism feed-many roof-lower pentecost vision-eat vision-harvest vision-water vision-door vision-swarm vision-bowls vision-bind fall-rise anoint-feet storm-calm net-catch water-wine wash-feet rise resurrection garment-touch anoint bread-share veil-dark empty-tomb water-rescue capture pour-water five-stones float-basket two-offerings flock bars crown arrow none shadow transfer receive build flood recede bird altar-flame rainbow cover journey light covenant feast shelter fire prayer release coins water tears family refuse vision oil roll speech bury pit stack reveal symbol bush-fire snake water-strike divide restore cloud lamp garment smoke cloth fragments veil arrange powder blossom sign clash rope lots collapse jar-break grain shoe food music sling projectile cloth-cut letter boat whirlwind axe treasure touch water-strike burial potsherd clay cloth-decay sink city joined storm wither scroll idol well signal snare boat-break scepter horse heal tear transfer light'.split(' '));
export function drawEffects(c,sample,layout){
 const {plan,index,progress,effectProgress:p,elapsed}=sample,effect=plan.effect;
 const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.max(0,Math.round(w)),Math.max(0,Math.round(h)));};
 const prop=(kind,x,y)=>drawWorldObject(c,{kind,x,y},1,0),x=layout.prop.x,y=layout.prop.y;
 if(['illustration','instruction','vision'].includes(plan.mode)){r(18,35,224,23,'#233d47');c.fillStyle='#f6e4b7';c.font='12px DungGeunMo,monospace';c.textAlign='left';c.fillText(plan.mode==='instruction'?'규례 설명 · 동작은 예시':plan.mode==='vision'?'꿈 · 환상의 상징 장면':'본문을 설명하는 상징 장면',24,50);}
 const spark=(col)=>{if(index<3)return;for(let i=0;i<10;i++)r(x-18+i*7%37,y-60+(i*11+elapsed*10)%50,2,3,col);};
 switch(effect){
 case 'transfiguration':if(index>=2){for(const dx of [-40,-27,27,40])r(layout.lead.x+dx,layout.lead.y-110,3,90,'#efe3ae');}break;
 case 'ascension':if(index>=2){const yy=155-Math.round(p*95);for(let i=0;i<5;i++)r(x-55+i*20,yy+i%2*8,40,17,'#dce1d3');}break;
 case 'baptism':if(index>=2){const target=layout.positions.find((_,i)=>i!==layout.leadIndex)||layout.lead;for(let i=0;i<6;i++)r(target.x-15+i*6,target.y-12+(i%2)*4,4,2,'#bbdfdf');if(index===3)for(let i=0;i<4;i++)r(target.x-5+i*4,target.y-65+i*10,2,4,'#a6d3de');}break;
 case 'feed-many':if(index>=3){for(let i=0;i<(index===3?3:8);i++)prop('bread',x-60+(i%4)*38,y+8+Math.floor(i/4)*17);if(index>=4)for(let i=0;i<(plan.basketCount||12);i++)prop('basket',x-105+(i%6)*40,y+35+Math.floor(i/6)*18);}break;
 case 'roof-lower':{r(x-80,80,160,9,'#9b8665');r(x-27,80,54,9,'#344849');const yy=95+Math.round(Math.min(1,(index+progress)/4)*130);c.strokeStyle='#c6ae7b';c.lineWidth=2;for(const dx of [-25,25]){c.beginPath();c.moveTo(x+dx,84);c.lineTo(x+dx,yy);c.stroke();}prop('mat',x,yy);break;}
 case 'pentecost':if(index>=2){const positions=layout.positions.length?layout.positions:[{x:300,y:235},{x:420,y:235}];for(const who of positions){r(who.x-3,who.y-125,6,10,'#edb35f');r(who.x-1,who.y-129,2,10,'#f4dd8b');}for(let i=0;i<6;i++)r(220+i*48,88+(i%2)*9,25,2,'#c4d3ce');}break;
 case 'vision-eat':if(index>=2){const hand=layout.lead.hand;prop('scroll',index>=3?hand.x:x,index>=3?hand.y:y-30);if(index>=4)r(x-15,y-70,30,3,'#e6c77e');}break;
 case 'vision-harvest':if(index>=2){for(let i=0;i<8;i++){const xx=x-80+i*22;r(xx,y-32,2,30,'#b6a15d');r(xx-3,y-34,7,9,'#d9bd6f');}if(index>=3)prop('sickle',x-35+p*70,y-30);if(index>=4)for(let i=0;i<3;i++)prop('grain',x-25+i*25,y+5);}break;
 case 'vision-water':{r(x-50,130,100,170,'#649aa4');for(let i=0;i<7;i++)r(x-34+(i%2)*20,140+(i*23+Math.floor(elapsed*7))%145,30,2,'#bedbd1');for(const dx of [-95,95]){prop('tree',x+dx,230);if(index>=3)for(let i=0;i<3;i++)prop('fruit',x+dx-12+i*12,185+(i%2)*8);}break;}
 case 'vision-door':{r(x-25,120,50,115,'#b49c73');r(x-20,125,40,110,'#354c4c');if(index<3)r(x-20,125,40,110,'#88765c');else r(x-20-p*18,125,Math.max(3,40-p*37),110,'#88765c');break;}
 case 'vision-swarm':if(index>=2)for(let i=0;i<12;i++){const xx=x-70+i*13,yy=130+(i%3)*13+Math.floor(Math.sin(elapsed*3+i)*3);r(xx,yy,5,3,'#595949');r(xx-2,yy-2,2,2,'#b2a475');r(xx+5,yy-2,2,2,'#b2a475');}break;
 case 'vision-bowls':if(index>=3)for(let i=0;i<7;i++)r(x-15+i*5,y-65+i*7,2,5,'#bda278');break;
 case 'vision-bind':if(index>=3){prop('snake',x,y);for(let i=0;i<5;i++)r(x-20+i*10,y-12,7,2,'#a9b4b0');}break;
 case 'storm-calm':if(index<4){for(let i=0;i<20;i++)r(i*41%720,240+Math.sin(elapsed*6+i)*8,22,3,'#d0e2da');for(let i=0;i<25;i++)r(i*67%720,(i*31+elapsed*40)%220,2,6,'#a3c9cd');}else for(let i=0;i<15;i++)r(i*53%720,250+i%3*15,30,2,'#a7ced2');break;
 case 'net-catch':if(index>=3){const n=index===3?progress:1;c.strokeStyle='#c1b69a';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x-40+i*20*n,y-20);c.lineTo(x-25+i*14*n,y+25);c.stroke();c.beginPath();c.moveTo(x-40,y-12+i*8);c.lineTo(x+45,y-12+i*8);c.stroke();}if(index>=4)for(let i=0;i<5;i++)prop('fish',x-20+i*12,y+15-Math.round(p*16));}break;
 case 'water-wine':if(index>=3){prop('cup',x+30,y);r(x+27,y-7,5,3,index>=4?'#996370':'#8fc3cd');}break;
 case 'wash-feet':if(index>=3){const target=layout.positions.find((_,i)=>i!==layout.leadIndex)||layout.lead;prop('basin',target.x-22,target.y-3);for(let i=0;i<5;i++)r(target.x-30+i*4,target.y-18+i*3,2,3,'#a2d3d9');}break;
 case 'fall-rise':case 'rise':case 'resurrection':if(index>=4){const target=layout.positions.find((_,i)=>i!==layout.leadIndex)||layout.lead;for(let i=0;i<4;i++)r(target.x-30+i*18,target.y-78,2,6,'#ebd89b');}break;
 case 'garment-touch':if(index>=3&&index<=4){const target=layout.positions.find((_,i)=>i!==layout.leadIndex)||layout.lead;r(target.x-25,target.y-26,4,4,'#e6d19c');r(target.x-30,target.y-21,3,3,'#e6d19c');}break;
 case 'anoint-feet':if(index>=3&&index<=4){const target=layout.positions.find((_,i)=>i!==layout.leadIndex)||layout.lead;for(let i=0;i<4;i++)r(target.x-15+i*2,target.y-25+i*4,2,4,'#dfc277');}break;
 case 'anoint':if(index>=3&&index<=4){const target=layout.positions.find((_,i)=>i!==layout.leadIndex)||layout.lead;for(let i=0;i<5;i++)r(target.x-5,target.y-100+i*5,2,4,'#dfc277');}break;
 case 'bread-share':if(index>=3){prop('bread',x-8,y-10);prop('bread',x+17,y-10);prop('cup',x+42,y);}break;
 case 'veil-dark':if(index>=3){r(0,0,720,300,'#15273988');r(x-18,55,15,100,'#bfb397');r(x+4,55,15,100,'#bfb397');r(x-2,60,4,90,'#293a40');}break;
 case 'empty-tomb':if(index>=2){r(x-10,y-31,21,31,'#334b47');prop('stone',x+38+p*23,y);}break;
 case 'water-rescue':if(index>=2){const target=layout.positions.find((_,i)=>i!==layout.leadIndex)||layout.lead;for(let i=0;i<4;i++)r(target.x-18+i*12,target.y+5-Math.round(Math.sin(elapsed*5+i)*3),8,2,'#d0e6df');}break;
 case 'capture':if(index>=4)prop('rope',x,y);break;
 case 'five-stones':for(let i=0;i<5;i++)if(index<3||i>Math.floor(p*5))prop('stone',x+15+i*18,y+12+i%2*5);break;
 case 'float-basket':if(index>=3)prop('reed-basket',x+p*38,y+8);break;
 case 'two-offerings':if(index>=2){prop('fruit',layout.lead.x+38,y);const target=layout.positions.find((p,i)=>i!==layout.leadIndex);if(target)prop('sheep',target.x-55,y);}break;
 case 'divide':{const gap=p*70;r(x-gap,224,gap*2,76,'#b9ae87');r(x-gap-3,224,3,76,'#bbdfdc');r(x+gap,224,3,76,'#bbdfdc');break;}
 case 'restore':r(0,224,720,76,'#4f899e');for(let i=0;i<18;i++)r((i*49+elapsed*8)%720,238+i%3*20,19,2,'#a7ced2');break;
 case 'flood':case 'storm':r(0,285-p*65,720,15+p*65,'#4e819c');if(index<5)for(let i=0;i<28;i++)r((i*73)%720,(i*47+elapsed*36)%220,2,7,'#b4d2d8');break;
 case 'recede':r(0,224+p*57,720,76-p*57,'#4e819c');break;
 case 'bird':if(index>=2){const bx=x+Math.min(150,p*160),by=y-100-p*55;prop('dove',bx,by);if(index<5)r(bx-9,by-7+(Math.floor(elapsed*5)%2)*4,19,2,'#e4e6d5');}break;
 case 'altar-flame':case 'fire':case 'bush-fire':if(index>=3){for(let i=0;i<6;i++){r(x-15+i*6,y-24-(i%2)*8,5,22,'#d48148');r(x-12+i*6,y-20-(Math.floor(elapsed*4+i)%3)*4,3,14,'#efcf76');}}break;
 case 'rainbow':if(index>=2)for(let j=0;j<4;j++){c.strokeStyle=['#d29185','#dfbe74','#8cb79f','#879fc6'][j];c.lineWidth=3;c.beginPath();c.arc(x,190,80-j*5,Math.PI,2*Math.PI);c.stroke();}break;
 case 'powder':spark('#f2e7c9');break;
 case 'pour-water':case 'oil':if(index>=3&&index<=4){const hand=layout.lead.hand;for(let i=0;i<8;i++)r(hand.x+8+i*.8,hand.y-4+i*4,2,4,effect==='oil'?'#ddba67':'#8fc9d4');}if(plan.motif==='oil')for(let i=0;i<4;i++){prop('jar',x+20+i*25,y);r(x+15+i*25,y-8,10,Math.round(p*6),'#dfbe69');}break;
 case 'coins':if(index>=3)for(let i=0;i<6;i++)prop('coin',x+(i%3)*9,y-Math.floor(i/3)*4);break;
 case 'tears':if(index>=3){const who=layout.lead;r(who.x-4,who.y-73+(Math.floor(elapsed*6)%9),2,3,'#a9d5d9');}break;
 case 'family':case 'light':case 'heal':case 'release':if(index>=4){for(let i=0;i<4;i++)r(x-28+i*18,y-75,2,4,'#e3cf8e');}break;
 case 'vision':if(index>=2){r(x-60,45,120,68,'#d1cdb477');prop(plan.motif==='dream'?'ladder':'cloud',x,100);prop('star',x+35,62);}break;
 case 'snake':if(index>=3&&index<=4)prop('snake',x,y);break;
 case 'water-strike':if(index>=3){for(let i=0;i<5;i++)r(x+i*5,y-22+i*3,3,4,'#8dc2cd');r(x,y,55*p,3,'#8dc2cd');}break;
 case 'cloud':if(index>=2)for(let i=0;i<5;i++)r(x-75+i*31,50+i%2*10,54,22,'#d0d5c7aa');break;
 case 'lamp':if(index>=3){r(x-3,y-27,5,8,'#f6db89');r(x-1,y-30,2,9,'#f6db89');}break;
 case 'smoke':if(index>=3)for(let i=0;i<6;i++)r(x-5+i%2*5,y-35-i*9-(elapsed*3%5),7,5,'#d9d3c3aa');break;
 case 'fragments':case 'jar-break':case 'collapse':case 'boat-break':if(index>=3){for(let i=0;i<8;i++)r(x+(i-4)*10*p,y-18+Math.abs(i-4)*p*3,7,5,'#9d8a68');}break;
 case 'blossom':if(index>=3){for(let i=0;i<5;i++){r(x-3+i%2*7,y-20-i*5,5,3,'#81a16b');r(x-2+i%2*7,y-22-i*5,3,2,'#efdbc0');}}break;
 case 'sign':if(index>=3)prop('bronze-snake',x,y-35);break;
 case 'rope':{const py=index<3?y-55:y-55+p*40;c.strokeStyle='#c2a376';c.lineWidth=2;c.beginPath();c.moveTo(x,py-65);c.lineTo(x,py);c.stroke();if(index>=3)prop('basket',x,py);break;}
 case 'lots':if(index>=3)for(let i=0;i<4;i++)r(x-12+i*7,y-5-i%2*3,4,4,'#d4cab0');break;
 case 'grain':case 'stack':case 'build':if(index>=3)for(let i=0;i<Math.ceil(p*5);i++)prop(effect==='build'?'brick':'grain',x+i%3*24,y-Math.floor(i/3)*14);break;
 case 'food':case 'feast':if(index>=3){prop('bread',x,y);prop('cup',x+28,y);}break;
 case 'music':if(index>=2&&index<=4){c.fillStyle='#f0d38a';c.font='16px DungGeunMo,monospace';c.fillText('♪',x+30,115-Math.floor(elapsed*6)%25);c.fillText('♫',x-35,125-Math.floor(elapsed*6)%30);}break;
 case 'sling':case 'projectile':case 'arrow':if(index>=(effect==='projectile'?2:4)){const flight=index===4?progress:index>4?1:0;const tx=layout.lead.x+30+flight*140,ty=layout.lead.y-57;prop(effect==='arrow'?'arrow':'stone',Math.min(650,tx),ty);}break;
 case 'letter':case 'scroll':case 'covenant':if(index>=3){prop('scroll',x,y);}break;
 case 'boat':if(index>=2)prop('boat',x,y+20);break;
 case 'whirlwind':if(index>=2)for(let i=0;i<9;i++)r(x-28+i%3*12,y-30-i*12,60-i*4,2,'#e2d9b7');break;
 case 'axe':if(index>=3)prop('axe',x+48,y+43-p*42);break;
 case 'treasure':if(index>=3){prop('treasure-chest',x,y);prop('gold',x+20,y-15);}break;
 case 'symbol':if(index>=2){r(x-50,60,100,70,'#d4d6bf77');prop(plan.prop,x,111);}break;
 case 'reveal':if(index>=3){prop('cup',x,y-15);for(let i=0;i<3;i++)r(x-25+i*25,y-42,2,5,'#ead59b');}break;
 case 'bury':if(index>=4)r(x-17,y-5,35,7,'#8f8269');break;
 case 'city':if(index>=3){r(x-20,y-7,40,6,'#bb8b66');for(let i=0;i<4;i++)r(x-18+i*11,y-15,6,8,'#bb8b66');}break;
 case 'joined':if(index>=3){r(x-15+p*10,y-27,3,27,'#b48d60');r(x+15-p*15,y-27,3,27,'#b48d60');}break;
 case 'wither':if(index>=4){r(x-25,y-90,50,10,'#a39460');r(x-20,y-85,40,15,'#a39460');}break;
 case 'scepter':if(index>=3)prop('staff',x,y-45);break;
 case 'horse':if(index>=3)prop('horse',x,y);break;
 case 'crown':if(index>=3)prop('crown',layout.lead.x,layout.lead.y-100);break;
 case 'flock':if(index>=2){prop('sheep',x+35,y+5);prop('sheep',x+75,y+7);}break;
 case 'bars':for(let i=0;i<6;i++)r(layout.lead.x-30+i*12,layout.lead.y-110,3,110,'#6c726e');break;
 case 'well':if(index>=3)prop('well',x,y);break;
 case 'snare':if(index>=3){r(layout.lead.x+4,layout.lead.y-110,4,55,'#7f6849');}break;
 case 'burial':if(index>=3)prop('tomb',x,y);break;
 case 'tear':case 'cloth-cut':if(index>=3){r(x-10,y-18,5,20,'#bba27c');r(x+2,y-14,6,14,'#bba27c');}break;
 case 'sink':if(index>=3)prop('scroll',x,y-25+p*55);break;
 case 'clay':if(index>=2){r(x-16,y-9,32,10,'#b88969');r(x-12,y-14+(index===4?6:0),24,7,'#c5a078');}break;
 case 'cloth-decay':if(index>=4)for(let i=0;i<5;i++)r(x-15+i*7,y-10+i%2*5,4,5,'#8d8168');break;
 default:break;
 }
}
