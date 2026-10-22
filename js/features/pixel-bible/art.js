// 큰 도트의 귀여운 SD 비율. 작은 얼굴과 보이는 목으로 몸통 길이를 살린다.
import { APPEARANCES, appearanceFor } from "./appearance.js";
export const CHARACTER_STYLES = Object.fromEntries(['elijah','elisha','jezebel','ahab','naboth','micaiah','jehoshaphat','benhadad','ahaziah','angel','ruth','boaz'].map(k=>[k,APPEARANCES[k]]));
export const characterStyle = appearanceFor;
export function drawPixelCharacter(ctx, style, x, y, { scale = 3, walk = 0, action = "", facing = 1, time = 0, hanging = false } = {}) {
  // 24×38 base sprite: head occupies 16×16; neck and longer torso remain visible.
  ctx.save();ctx.translate(Math.round(x-12*scale),Math.round(y-36*scale));ctx.scale(scale,scale);
  if(hanging){ctx.translate(12,1);ctx.rotate(Math.sin(time*7)*.14);ctx.translate(-12,-1);}
  const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const outline="#302f35", skin="#f2d5af", blush="#eb9da2", hair=style.hood?style.coat:style.hair;
  const resting = action === "bench";
  const step=Math.round(walk*1.5), look=facing<0?-1:0;
  r(5,37,14,1,"#183a3933");
  // 무릎과 팔이 교대로 움직이고 무게중심은 허리 위에 둔다.
  const leg=(x,dy)=>{r(x,31,4,5,outline);r(x+1,32,2,3,skin);r(x-1,35+dy,5,2,outline);r(x,35+dy,3,1,"#a77d57");};
  leg(7,step);leg(14,-step);
  if(style.mantle||style.royal||style.shawl){r(7,19,10,2,outline);r(4,21,16,10,outline);r(5,22,14,8,style.coat);r(5,27,3,4,"#302f3522");}
  // 어깨에서 허리와 옷자락으로 이어지는 실루엣.
  r(9,19,6,1,outline);r(7,20,10,1,outline);r(6,21,12,3,outline);r(7,24,10,4,outline);r(6,28,12,5,outline);
  r(10,19,4,1,style.coat);
  r(8,20,8,4,style.coat);r(8,24,8,5,style.coat);r(7,29,10,3,style.coat);
  r(9,23,2,6,"#ffffff22");r(15,24,1,7,"#302f3522");
  // 턱의 가로선 아래 좁은 목과 양옆의 빈 공간으로 머리/몸을 구분한다.
  // 피부색 가슴판 대신 V자 옷깃을 써서 목이 넓어 보이지 않게 한다.
  r(10,17,1,2,outline);r(13,17,1,2,outline);
  r(11,16,2,2,skin);r(11,18,2,1,"#c49476");
  r(10,19,1,1,"#f4e7c5");r(13,19,1,1,"#f4e7c5");r(11,20,2,1,"#f4e7c5");
  const arm=(x,dy)=>{r(x,21+dy,4,4,outline);r(x+1,22+dy,2,2,style.coat);r(x,25+dy,3,4,outline);r(x+1,25+dy,2,3,skin);};
  arm(4,hanging?2:-step);arm(17,hanging?2:step);
  if(style.apron){r(9,24,6,7,'#e9d4aa');r(8,24,8,1,'#705642');}
  if(style.vest){r(7,20,3,5,'#69583f');r(14,20,3,5,'#69583f');}
  if(style.sash){r(14,21,2,11,style.sash);r(13,23,1,3,style.sash);}
  if(style.belt){r(7,26,10,2,'#58412d');r(11,26,2,2,'#c4a768');}
  if(style.fur){for(let i=0;i<5;i++){r(7+i*2,22+i%2,1,2,'#614f39');r(8+i*2,29-i%2,1,2,'#d4b68b');}}
  if(style.trim){r(7,21,1,5,style.trim);r(16,21,1,5,style.trim);r(7,31,10,1,style.trim);}
  if(style.pattern){for(let i=0;i<3;i++)r(8+i*3,23,1,8,['#7b8d7c','#b96c75','#cfac68'][i]);}
  // 16도트 머리와 10도트 얼굴: 둥근 턱이 짧은 목과 어깨에 바로 이어진다.
  ctx.save();ctx.translate(0,1);
  // 뒤 머리 → 닫힌 얼굴 윤곽 → 얼굴 → 앞머리 → 표정 순서로 겹친다.
  r(9,1,6,1,outline);r(7,2,10,1,outline);r(5,3,14,2,outline);r(4,5,16,8,outline);r(5,13,14,2,outline);r(8,15,8,1,outline);
  r(8,3,8,1,hair);r(6,4,12,2,hair);r(5,6,14,7,hair);r(6,13,12,1,hair);
  r(7,6,10,7,outline);r(8,13,8,1,outline);r(9,14,6,1,outline);
  r(8,6,8,1,skin);r(7,7,10,5,skin);r(8,12,8,2,skin);r(10,14,4,1,skin);
  // 눈 옆에는 피부 한 칸을 남겨 옆머리와 눈이 붙지 않게 한다.
  r(7,6,3,1,hair);r(7,7,1,1,hair);r(15,6,2,1,hair);r(6,7,1,5,hair);r(17,7,1,5,hair);
  r(8,4,4,1,"#ffffff33");
  if(style.bald){r(8,3,8,3,skin);r(7,5,10,2,skin);r(7,7,1,1,skin);}
  r(9+look,9,1,2,outline);r(14+look,9,1,2,outline);
  r(8,11,1,1,blush);r(15,11,1,1,blush);r(11,12,2,1,"#a37363");
  if(style.eyeliner){r(9+look,8,2,1,outline);r(14+look,8,2,1,outline);}
  if(style.updo){r(9,-2,6,3,outline);r(10,-1,4,2,hair);r(13,0,2,1,'#d8b66a');}
  if(style.crown){r(7,1,10,2,outline);r(8,1,8,1,style.trim||'#d9b568');for(const x of [7,11,15])r(x,-1,2,2,'#d9b568');r(11,1,2,1,'#a95e64');}
  if(style.turban){r(7,2,10,3,style.coat);r(6,5,12,1,'#e4d9ba');r(8,3,8,1,'#b0b8c4');r(11,2,2,4,style.trim||'#c4a768');}
  if(style.headband){r(6,5,12,1,'#e7d7b7');r(17,6,2,4,'#e7d7b7');}
  if(style.jewels){r(5,12,1,2,'#e0ba67');r(18,12,1,2,'#e0ba67');r(10,21,4,1,'#e0ba67');}
  // 수염은 입 아래와 턱 끝에만 둔다. 가로로 입을 덮는 띠를 만들지 않는다.
  if(style.beard){r(8,13,1,1,style.beard);r(15,13,1,1,style.beard);r(10,14,4,1,style.beard);}
  if(style.halo){r(8,-2,8,1,"#f4c65c");r(6,-1,2,1,"#f4c65c");r(16,-1,2,1,"#f4c65c");r(14,21,2,10,"#c97f75");}
  ctx.restore();
  if(style.staff){for(let i=0;i<16;i++)r(-2+Math.floor(i/3),-7+i*2,2,3,outline);for(let i=0;i<15;i++)r(-1+Math.floor(i/3),-6+i*2,1,2,"#b78a5a");r(-4,-9,5,2,outline);r(-3,-8,3,1,"#b78a5a");}
  if(style.scroll){r(18,25,5,7,outline);r(19,26,3,5,'#eee0ad');r(18,25,5,1,'#b39362');r(18,31,5,1,'#b39362');}
  if(style.grapes){r(-2,27,6,6,'#745e40');r(-1,26,4,1,'#68a06b');r(-1,27,2,2,'#80679e');r(1,28,2,2,'#937db0');r(0,30,2,1,'#80679e');}
  if(style.grain){r(19,24,1,10,'#987c48');r(17,24,2,4,'#e5c574');r(20,23,2,4,'#e5c574');}
  if(style.net){for(let i=0;i<3;i++){r(18+i*2,25,1,9,'#b9b49c');r(18,26+i*3,6,1,'#b9b49c');}}
  if(style.lyre){r(18,25,1,8,'#c09b61');r(23,25,1,8,'#c09b61');r(18,32,6,2,'#c09b61');r(19,25,4,1,'#c09b61');r(20,26,1,5,'#e1d3a3');r(22,26,1,5,'#e1d3a3');}
  if(style.glow){r(-1,6,2,2,'#f8dc85');r(25,3,2,2,'#f8dc85');r(0,26,1,3,'#f8dc85');r(26,25,1,3,'#f8dc85');}
  if(action==="field"){r(20,22,1,9,"#b78a5a");r(19,21,3,3,"#f5d371");r(18,23,2,2,"#e1b95f");}
  if(action==="water"){r(19,20,3,5,outline);r(19,20,3,1,"#87bfd1");r(19,21,2,3,"#bf8767");}
  if(style.chariot && action==="ascend") {
    r(-3,21,26,2,"#e4ab4c");r(-3,18,2,5,outline);r(21,18,2,5,outline);r(1,23,5,5,outline);r(14,23,5,5,outline);r(2,24,3,3,"#d9a64c");r(15,24,3,3,"#d9a64c");
    for(let i=0;i<3;i++){r(-5-i,19+(i%2),2,4,"#ef9b46");r(-6-i,21,2,2,"#ffe19a");}
  }
  ctx.restore();
}
export function drawWorldObject(c,o,tile=24) {
  const x=o.x*tile,y=o.y*tile;
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(3,3);
  const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};const O="#393e3c";
  r(-7,4,15,2,"#193b3533");
  if(o.kind==="field") {
    r(-12,-3,25,10,O);r(-11,-2,23,8,"#a68258");
    for(let i=0;i<5;i++){const p=-9+i*5;r(p,-9,1,12,"#795e40");r(p-1,-10,3,6,"#e4b95f");r(p-2,-9,1,3,"#f7dc8d");r(p+2,-7,1,3,"#f7dc8d");}
  } else if(o.kind==="tree") {
    r(-2,-7,5,12,O);r(-1,-7,3,11,"#a18159");r(-7,-22,14,2,O);r(-10,-20,20,3,O);r(-12,-17,24,9,O);r(-10,-8,20,3,O);r(-6,-5,12,1,O);
    r(-7,-20,14,2,"#61946c");r(-9,-18,18,3,"#61946c");r(-11,-15,22,7,"#54865f");r(-9,-8,18,2,"#54865f");r(-7,-18,7,3,"#80ac77");r(-9,-14,5,3,"#80ac77");r(4,-8,4,2,"#427454");
  } else if(o.kind==="bench") {
    r(-9,-4,18,5,O);r(-8,-3,16,3,"#d1ad78");r(-7,1,2,5,O);r(5,1,2,5,O);r(-8,-10,2,6,O);r(6,-10,2,6,O);r(-7,-10,14,3,O);r(-6,-9,12,1,"#d1ad78");
  } else if(o.kind==="water") {
    r(-3,-11,6,2,O);r(-4,-9,8,2,O);r(-5,-7,10,10,O);r(-3,3,6,1,O);r(-3,-8,6,1,"#729fb5");r(-4,-6,8,8,"#be886b");r(-3,-5,2,5,"#e5af86");r(-2,-10,4,1,"#84bdce");
  }
  c.restore();
}

export function drawWorldBackground(c) {
  const TILE = 24;
  c.fillStyle="#6f995f";c.fillRect(0,0,960,480);
  for(let y=0;y<20;y++)for(let x=0;x<40;x++) {
    const h=(x*37+y*83)%19;c.fillStyle=h<8?"#759f62":"#6c955b";c.fillRect(x*TILE,y*TILE,TILE,TILE);
    if(h<5){c.fillStyle="#9ab56d";c.fillRect(x*TILE+7,y*TILE+14,3,3);}
  }
  c.fillStyle="#b9b082";c.fillRect(0,216,960,48);c.fillRect(408,100,48,300);
  c.fillStyle="#c9bc8b";for(let x=0;x<960;x+=35)c.fillRect(x,229,18,6);
  c.fillStyle="#467f8e";c.fillRect(0,420,960,60);c.fillStyle="#71a9a6";for(let x=12;x<960;x+=56)c.fillRect(x,440+(x%3)*6,26,3);
  c.fillStyle="#8c9570";c.fillRect(0,408,960,12);
  // 먼 언덕과 돌집
  c.fillStyle="#4a7758";c.fillRect(0,0,960,48);c.fillRect(0,48,300,24);c.fillRect(750,48,210,24);
  for(const x of [110,700,800]){c.fillStyle="#d0bd8a";c.fillRect(x,50,78,55);c.fillStyle="#b09e70";c.fillRect(x-6,44,90,12);c.fillStyle="#4a4e3b";c.fillRect(x+29,74,20,31);c.fillRect(x+8,65,12,12);}
  c.fillStyle="#e6c789";c.fillRect(65,100,4,40);c.fillRect(55,100,28,14);
}

export function drawDesignBoard(c) {
  const W=1200,H=1380;c.canvas.width=W;c.canvas.height=H;c.imageSmoothingEnabled=false;
  c.fillStyle="#f3ecdb";c.fillRect(0,0,W,H);
  c.fillStyle="#16343c";c.fillRect(0,0,W,108);
  c.fillStyle="#f6d894";c.font="bold 30px monospace";c.fillText("PIXEL BIBLE / DESIGN BOARD",38,48);
  c.fillStyle="#d7e0c3";c.font="16px sans-serif";c.fillText("큰 도트 · 길이를 살린 몸통 · 점눈과 볼터치 · 실제 월드와 같은 원본 그림",38,82);
  const entries=Object.entries(CHARACTER_STYLES);
  entries.forEach(([key,style],i)=>{
    const x=30+(i%6)*195, row=Math.floor(i/6)*260;
    c.save();c.translate(0,row);
    c.fillStyle=i%2?"#e6ddca":"#d9e0ce";c.fillRect(x,130,170,245);
    drawPixelCharacter(c,style,x+85,325,{scale:4,action:key==="ruth"?"field":""});
    c.fillStyle="#263e3d";c.textAlign="center";c.font="bold 18px sans-serif";c.fillText(style.name,x+85,350);
    c.font="11px monospace";c.fillText("24 × 38 / 4x preview",x+85,368);c.restore();
  });
  c.save();c.translate(0,300);
  c.textAlign="left";c.fillStyle="#294842";c.font="bold 20px sans-serif";c.fillText("오브제 · 캐릭터와 같은 굵기의 도트",36,416);
  const obs=[["field","보리밭 / 이삭 줍기"],["water","물항아리 / 물 마시기"],["bench","쉬는 자리 / 휴식"],["tree","나무 / 길 막기"]];
  obs.forEach(([kind,label],i)=>{
    const x=30+i*292;c.fillStyle="#e1e5d4";c.fillRect(x,440,264,213);
    c.save();c.translate(x+132,570);c.scale(1.8,1.8);drawWorldObject(c,{kind,x:0,y:0});c.restore();
    c.fillStyle="#294842";c.textAlign="center";c.font="16px sans-serif";c.fillText(label,x+132,632);
  });
  c.textAlign="left";c.font="bold 20px sans-serif";c.fillText("걷기 원화와 지형 조합",36,700);
  for(let i=0;i<3;i++){
    const x=40+i*124;c.fillStyle="#e3ddcc";c.fillRect(x,728,110,160);
    drawPixelCharacter(c,CHARACTER_STYLES.ruth,x+55,856,{scale:3,walk:[-1,0,1][i]});
  }
  c.font="14px sans-serif";c.fillStyle="#294842";c.fillText("왼발 → 대기 → 오른발",54,916);
  const bg=document.createElement("canvas");bg.width=960;bg.height=480;drawWorldBackground(bg.getContext("2d"));
  c.drawImage(bg,450,728,720,240);
  c.font="14px sans-serif";c.fillText("풀밭 · 흙길 · 물가 · 돌집 (상상 공간)",450,995);
  c.font="12px sans-serif";c.fillStyle="#5d6d61";c.fillText("본문 근거와 창작 복식을 구분합니다. 관리자 개발 체험 · 정식 버전 유지.",36,1020);c.restore();
}
