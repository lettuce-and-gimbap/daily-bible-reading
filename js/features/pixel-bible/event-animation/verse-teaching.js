import {drawCreature} from '../creature-art.js';
import {CREATURES} from '../creatures.js';
import {characterStyle,drawPixelCharacter} from '../art.js';
export const TEACHING_DIAGRAMS=new Set('camel-needle donkey-pair son-variants vineyard cornerstone cup-clean tomb-contrast hen-gather gnat-camel temple-fall broken-tie glory-cloud cosmic-dark gather-call flood-memory grinding bridesmaids closed-door talents flock-separate care cross-sign three-crosses burial-cloth empty-tomb'.split(' '));
export function drawVerseTeaching(c,kind,s,{r,prop,text,phase}){
 if(!TEACHING_DIAGRAMS.has(kind))return false;
 const {index,progress}=s,diag=s.plan.diagram;
 const animal=(id,x,y,scale=2,frame=0)=>{c.save();c.translate(x,y);c.scale(scale,scale);drawCreature(c,CREATURES[id],0,0,{frame,direction:'right'});c.restore();};
 const person=(name,x,y,scale=1.5,pose=null)=>drawPixelCharacter(c,characterStyle(name,0,'',[]),x,y,{scale,direction:'right',interaction:pose});
 if(kind==='camel-needle'){animal('camel',280,211,2.5);r(449,100,5,117,'#c3c9b9');r(445,100,13,24,'#dbe1d4');r(449,105,5,13,'#55706a');text('바늘구멍',451,239,12);}
 if(kind==='gnat-camel'){prop('cup',260,205,2);r(250,132,24,3,'#cbb990');r(261,117,3,3,'#344b4b');if(index>=3)animal('camel',460,211,2.4);}
 if(kind==='donkey-pair'){animal('donkey',285,213,2.8);animal('donkey',435,213,1.8);r(290,215,145,2,'#c6b792');}
 if(kind==='son-variants'){
  for(let i=0;i<2;i++){const y=128+i*72,go=diag.patterns?.[i]==='no-go';text(i?'쉬운성경':'개역개정',165,y,13);r(225,y+12,285,4,'#bdad85');prop('vine',550,y+20,.9);person('비유 속 아들',280+(go?Math.round(phase*200):0),y+15,1.1);text(go?'거절 → 돌이킴 → 감':'응답 → 가지 않음',385,y-25,12);}
 }
 if(kind==='vineyard'){for(let i=0;i<6;i++)prop('vine',230+i%3*110,155+Math.floor(i/3)*65);r(190,218,350,6,'#b5a17a');prop('tower',555,210,.7);}
 if(kind==='cornerstone'){for(let row=0;row<3;row++)for(let col=0;col<6;col++)r(235+col*42,199-row*24,38,20,row===0&&col===0?'#eed19a':'#9b9b88');if(index<3)r(235,199,38,20,'#55706a');else r(235,199,38,20,'#eed19a');}
 if(kind==='cup-clean'){prop('cup',280,209,3);prop('bowl',460,209,3);for(let i=0;i<5;i++)if(index<4){r(260+i*9,159+i%2*12,7,5,'#6b6852');r(435+i*11,190+i%2*4,7,4,'#6b6852');}if(index>=4)for(let i=0;i<5;i++)r(260+i*43,125+i%2*12,4,4,'#f4dfa1');}
 if(kind==='tomb-contrast'){prop('tomb',280,215,1.8);r(243,153,74,5,'#eee6cd');r(247,157,11,48,'#eee6cd');prop('tomb',460,215,1.8);r(443,163,35,42,'#293f42');text('겉모습',280,238,12);text('드러난 안쪽',460,238,12);}
 if(kind==='hen-gather'){animal('rooster',355,192,2.8);for(let i=0;i<5;i++){const dx=(i-2)*27*(index>=4?1+progress:1);animal('rooster',355+dx,218,1);}if(index>=2&&index<4){r(300,165,34,7,'#c69f74');r(377,165,34,7,'#c69f74');}}
 if(kind==='temple-fall'){if(index<4)prop('temple',360,215,1.3);else for(let i=0;i<20;i++)r(240+i%10*25,188+Math.floor(i/10)*20,20,15,'#baae8b');}
 if(kind==='broken-tie'){person('갈라선 사람',250-Math.round(phase*35),217);person('배반당한 사람',470+Math.round(phase*35),217);r(280,165,160,3,'#c5b785');if(index>=3)r(340,158,40,18,'#718c7a');}
 if(kind==='glory-cloud'){prop('cloud',360,142,3);if(index>=2){person('예수',360,204,2);for(let i=0;i<9;i++)r(280+i*20,100+i%2*9,4,6,'#f2dfa7');}}
 if(kind==='cosmic-dark'){r(190,90,340,135,'#344858');r(243,108,29,29,index<2?'#efd492':'#48545b');r(448,110,23,23,index<3?'#d5ddc9':'#48545b');for(let i=0;i<11;i++)r(210+i*28,110+i%3*23+(index>=3?Math.round(progress*35):0),3,3,index<5?'#cbd4c6':'#48545b');}
 if(kind==='gather-call'){prop('trumpet',360,167,2);for(let i=0;i<8;i++){const a=i*Math.PI/4,dist=130-phase*65;r(358+Math.cos(a)*dist,166+Math.sin(a)*dist*.5,7,7,'#e6d09a');}}
 if(kind==='flood-memory'){prop('boat',360,192,1.5);if(index>=2){r(200,204,320,23,'#679cac');for(let i=0;i<8;i++)r(205+i*41,209+i%2*7,22,2,'#b9d5d1');}}
 if(kind==='grinding'){prop('millstone',360,205,2.6);const a=Math.floor(phase*12)*Math.PI/6;r(358+Math.cos(a)*26,176+Math.sin(a)*9,6,6,'#d7c494');person('함께 일하는 사람',250,212);person('함께 일하는 사람',470,212);}
 if(kind==='bridesmaids'){for(let i=0;i<10;i++){const x=195+i%5*80,y=145+Math.floor(i/5)*75;prop('lamp',x,y,1.1);if(i<5||index<3)r(x-2,y-24,4,7,'#f4d889');else r(x-2,y-24,4,4,'#526a64');}text('다섯',145,145,12);text('다섯',145,220,12);}
 if(kind==='closed-door'){r(295,87,130,140,'#ac9670');r(305,97,110,130,'#2c4448');const closed=index<3?0:index===3?progress:1;r(305,97,110*closed,130,'#bd9c6c');if(closed===1)r(395,161,6,6,'#e2c488');}
 if(kind==='talents'){const nums=diag.counts||[5,2,1];for(let j=0;j<nums.length;j++){const x=235+j*125;for(let i=0;i<Math.min(nums[j],10);i++)prop('coin',x+(i%3-1)*19,190-Math.floor(i/3)*19,.8);text(String(nums[j]),x,225,15);}}
 if(kind==='flock-separate'){for(let i=0;i<3;i++){animal('sheep',310+i%2*38-Math.round(phase*100),180+i*20,1.5);animal('goat',410+i%2*38+Math.round(phase*100),180+i*20,1.5);}r(358,100,3,135,'#c0b18a');}
 if(kind==='care'){const items=['bread','cup','cloak','bed'];for(let i=0;i<4;i++)prop(items[i],240+i*85,190,items[i]==='bed'?.55:1.4);if(index>=3)for(let i=0;i<4;i++)r(235+i*85,215,10,3,'#ecd296');}
 if(kind==='cross-sign'||kind==='three-crosses'){const xs=kind==='three-crosses'?[235,360,485]:[360];for(const x of xs){prop('cross',x,222,1.7);r(x-10,141,20,14,'#cfb58d');r(x-9,155,18,37,'#b9ac8c');r(x-32,154,64,7,'#cfb58d');}if(kind==='cross-sign'){r(310,86,100,25,'#c5ae83');text('유대인의 왕 예수',360,104,12,'#233d47');}}
 if(kind==='burial-cloth'){r(260,160,210,46,'#e4dfca');r(269,165,192,5,'#c7cbb8');for(let i=0;i<6;i++)r(275+i*31,172,3,29,'#b4bdac');if(index>=3)r(265,190,200,12,'#eee7d2');}
 if(kind==='empty-tomb'){prop('tomb',360,217,2.5);r(333,152,55,57,'#2d4345');r(337,198,47,5,'#e5deca');prop('stone',465,223,1.5);if(index>=3)for(let i=0;i<4;i++)r(334+i*15,133,3,5,'#ead79f');}
 return true;
}
