import { drawFaceExpression } from './expression.js';
// 정면은 기존 도안, 측면/후면은 별도의 도트 실루엣. 좌측은 측면 원화의 반전.
export function drawDirectionalCharacter(c,s,x,y,{scale=3,direction='up',step=0,action='',pose=null,expression='neutral'}={}) {
 c.save();c.translate(Math.round(x-12*scale),Math.round(y-36*scale));c.scale(scale,scale);
 if(direction==='left'){c.translate(24,0);c.scale(-1,1);}
 const r=(x,y,w,h,color)=>{c.fillStyle=color;const upper=pose&&y<31;c.fillRect(x+(upper?pose.bodyX:0),y+(upper?pose.bodyY:0),w,h);};
 const O='#302f35',skin='#f2d5af',hair=s.hood?s.coat:s.hair;
 const side=direction!=='up',bob=step?1:0;
 r(5,37,14,1,'#183a3933');
 const leg=(x,shift,back)=>{r(x,30,4,5,O);r(x+1,31,2,3,back?'#d0b28e':skin);r(x+shift,35-Math.abs(shift),5,2,O);r(x+shift+1,35-Math.abs(shift),3,1,pose?.barefeet?skin:s.sandal?'#d2b47d':'#a77d57');};
 if(pose?.sit){
  if(side){r(9,30,12,3,O);r(10,31,10,1,s.coat);r(18,32,3,4+pose.legSwing,O);r(18,35+pose.legSwing,6,2,O);r(19,35+pose.legSwing,4,1,'#a77d57');}
  else{r(7,31,11,3,O);r(8,33,3,3,O);r(15,33+pose.legSwing,3,3,O);r(7,35,5,2,O);r(14,35+pose.legSwing,5,2,O);}
 }else if(pose?.bend){r(7,32,6,3,O);r(14,32,5,3,O);r(7,35,6,2,O);r(15,35,6,2,O);}
 else if(side){leg(9,-step*2,true);leg(12,pose?.kick?4:step*2,false);}else{leg(7,step,false);leg(14,-step,false);}
 // 얼굴/옷 부분의 1도트 상하 이동, 발은 바닥을 딛는 별도 좌표.
 c.save();c.translate(0,-bob);
 if(side){
  // 멀리 있는 팔과 소품 뒤로 몸통을 그린다.
  r(8-step,22,3,7,O);r(9-step,24,1,4,skin);
  r(9,19,7,2,O);r(8,21,10,10,O);r(9,22,8,8,s.coat);r(8,30,10,3,O);r(9,30,8,2,s.coat);
  if(s.mantle||s.royal||s.shawl){r(7,21,3,11,O);r(8,22,2,9,s.coat);}
  if(s.plate){r(14,23,3,6,'#a6b6b5');r(15,23,1,5,'#d1dcd1');}
  if(s.apron)r(16,24,1,7,'#e9d4aa');
  if(s.vest)r(14,22,2,4,'#69583f');
  if(s.belt)r(10,27,7,1,'#58412d');
  if(s.sash)r(14,22,2,9,s.sash);
  if(s.pattern)r(15,23,1,7,s.accent||'#cfac68');
  if(pose?.archery){
   // 앞손은 활을 지지하고 뒷손은 시위와 함께 몸쪽으로 당긴다.
   const draw=pose.phase===1?4:pose.phase===2?1:2;
   r(13,22,4,4,O);r(14,23,3,2,s.coat);r(16,24,8,3,O);r(17,24,7,2,skin);
   r(11,23,4,3,O);r(13-draw,24,7,3,O);r(14-draw,24,6,2,skin);
  }else if(pose?.hand){const yy=pose.handY,hx=pose.handX||0;
   const hr=(xx,yy,w,h,col)=>{c.fillStyle=col;c.fillRect(xx+pose.bodyX,yy+pose.bodyY,w,h);};
   hr(14,Math.min(23,yy),3,Math.abs(yy-23)+2,O);
   hr(12,22,4,4,O);hr(13,23,2,2,s.coat);
   hr(14+Math.min(0,hx),yy,6+Math.abs(hx),3,O);hr(16+hx,yy,4,2,skin);
  }else{r(11+step,22,4,4,O);r(12+step,23,2,2,s.coat);r(12+step,26,3,4,O);r(13+step,26,1,3,skin);}
  // 뒤통수에서 코끝으로 이어지고 눈 하나와 귀를 구분한다.
  r(8,5,8,1,O);r(6,6,12,2,O);r(5,8,14,8,O);r(7,16,11,3,O);r(10,19,5,1,O);
  r(8,6,8,1,hair);r(7,7,10,3,hair);r(6,10,11,6,hair);r(8,16,5,2,hair);
  r(13,10,5,6,skin);r(14,16,3,2,skin);r(18,12,2,2,O);r(18,12,1,1,skin);
  r(12,12,2,2,skin);drawFaceExpression(r,expression,{side:true});r(17,15,1,1,'#eb9da2');
  if(s.beard)r(15,17,2,1,s.beard);
  if(s.eyeliner)r(16,11,2,1,O);
  if(s.bald){r(9,6,7,2,skin);r(8,8,9,3,skin);}
  if(s.longHair){r(6,14,4,8,O);r(7,14,2,7,hair);}
 }else{
  r(8,19,8,2,O);r(6,21,12,10,O);r(7,22,10,9,s.coat);r(6,31,12,2,O);r(7,31,10,1,s.coat);
  if(s.mantle||s.royal||s.shawl){r(5,21,14,11,O);r(6,22,12,9,s.coat);r(7,25,1,6,'#ffffff22');r(16,25,1,6,'#302f3522');}
  if(s.belt)r(7,27,10,1,'#58412d');if(s.sash)r(14,22,2,9,s.sash);
  if(s.trim)r(7,31,10,1,s.trim);
  const arm=(x,d)=>{r(x,22+d,4,4,O);r(x+1,23+d,2,2,s.coat);r(x,26+d,3,3,O);r(x+1,26+d,1,2,skin);};arm(4,pose?.hand?-1-(pose.phase===2?1:0):-step);arm(17,pose?.hand?-1:step);
  r(9,5,6,1,O);r(7,6,10,1,O);r(5,7,14,2,O);r(4,9,16,8,O);r(5,17,14,2,O);r(8,19,8,1,O);
  r(8,7,8,1,hair);r(6,8,12,2,hair);r(5,10,14,6,hair);r(6,16,12,2,hair);r(9,18,6,1,hair);
  r(8,9,4,1,'#ffffff22');
  if(s.bald){r(8,7,8,2,skin);r(6,9,12,4,skin);r(7,13,10,1,skin);}
  if(s.longHair){r(6,16,12,7,O);r(7,16,10,6,hair);r(10,18,1,4,'#ffffff22');}
 }
 // 방향에 맞춘 장식: 얼굴을 덮지 않고 머리의 윗부분에만 둔다.
 if(s.updo){r(9,2,6,3,O);r(10,3,4,2,hair);r(13,4,2,1,'#d8b66a');}
 if(s.crown){r(7,5,10,2,O);r(8,5,8,1,s.trim||'#d9b568');for(const x of [7,11,15])r(x,3,2,2,'#d9b568');}
 if(s.helmet){r(7,7,12,3,'#9bacae');r(6,10,2,6,'#7b9099');r(9,7,6,1,'#d4dbca');}
 if(s.turban){r(7,6,10,3,s.coat);r(6,9,12,1,'#e4d9ba');r(8,7,8,1,'#b0b8c4');}
 if(s.headband){r(6,9,12,1,'#e7d7b7');r(side?7:15,10,2,4,'#e7d7b7');}
 if(s.jewels){r(side?12:5,16,1,2,'#e0ba67');if(!side)r(18,16,1,2,'#e0ba67');}
 if(s.halo){r(8,2,8,1,'#f4c65c');r(6,3,2,1,'#f4c65c');r(16,3,2,1,'#f4c65c');}
 if(s.fur){for(let i=0;i<4;i++)r(9+i*2,24+i%2,1,2,'#614f39');}
 if(s.staff){r(side?19:3,8,1,27,'#b78a5a');r(side?18:2,8,1,27,O);r(side?17:1,6,4,2,'#b78a5a');}
 if(s.scroll){r(18,26,4,6,O);r(19,27,2,4,'#eee0ad');}
 if(s.grain){r(19,25,1,9,'#987c48');r(18,24,3,4,'#e5c574');}
 if(s.grapes){r(2,28,5,5,'#745e40');r(3,28,2,2,'#937db0');}
 if(s.tambourine){r(18,26,5,6,O);r(19,27,3,4,'#e0c18c');}
 if(s.net){for(let i=0;i<3;i++){r(18+i*2,26,1,7,'#b9b49c');r(18,27+i*2,5,1,'#b9b49c');}}
 if(s.lyre){r(18,26,1,7,'#c09b61');r(22,26,1,7,'#c09b61');r(18,32,5,1,'#c09b61');r(20,27,1,5,'#e1d3a3');}
 if(s.glow){r(2,13,1,2,'#f8dc85');r(22,17,1,2,'#f8dc85');}
 if(!pose&&action==='water'){r(17,16,3,4,O);r(17,16,2,1,'#87bfd1');}
 if(!pose&&action==='field'){r(19,24,1,8,'#b78a5a');r(18,23,3,3,'#e5c574');}
 if(pose?.hand&&!pose.heldObject&&!['tear-garment','water-wine','staff-snake','five-stones','glean-bundle'].includes(pose.actual)){
  const px=side?19:14,py=pose.handY-1;
  if(['water','well','oil'].includes(pose.prop)){r(px,py,4,5,O);r(px+1,py+1,2,3,pose.prop==='oil'?'#d9bd58':'#8abbd0');}
    if(pose.prop==='cooking'){r(18,pose.handY-3,1,9,'#b99a6f');r(17,pose.handY+4,3,2,'#b99a6f');}
  if(pose.prop==='field'){r(px,py,1,8,'#987c48');r(px-2,py,5,3,'#e5c574');}
  if(pose.prop==='scroll'){r(px-3,py,7,7,O);r(px-2,py+1,5,5,'#eee0b2');r(px-1,py+2,3,1,'#94805a');}
  if(pose.prop==='stone'){r(px-2,py,5,4,O);r(px-1,py,3,3,'#a5aaa2');}
  if(pose.prop==='boat'){r(px,py-3,2,14,'#a17c50');r(px-1,py+9,4,4,'#b99263');}
  if(pose.prop==='instrument'){r(px-3,py,8,7,O);r(px-2,py+1,6,5,'#c1a36b');r(px,py,1,7,'#eee0b2');}
 }
  if(pose?.hand&&pose.gesture==='pour'&&pose.phase===2){r(19,28,1,2,'#8abbd0');r(20,31,1,2,'#8abbd0');}
  if(pose?.hand&&['bucket','rope'].includes(pose.gesture)){r(18,21,1,12,'#b9945d');r(16,31,5,4,'#9c774a');}
 c.restore();c.restore();
}
