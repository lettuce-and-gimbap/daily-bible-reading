// 큰 도트의 귀여운 SD 비율. 작은 얼굴과 보이는 목으로 몸통 길이를 살린다.
import { APPEARANCES, appearanceFor } from "./appearance.js";
export const CHARACTER_STYLES = Object.fromEntries(['elijah','elisha','jezebel','ahab','naboth','micaiah','jehoshaphat','benhadad','ahaziah','angel','ruth','boaz'].map(k=>[k,APPEARANCES[k]]));
export const characterStyle = appearanceFor;
export function drawPixelCharacter(ctx, style, x, y, { scale = 3, walk = 0, action = "", facing = 1, time = 0, hanging = false } = {}) {
  // 24×38 base sprite: head occupies 20×17; neck and longer torso remain visible.
  ctx.save();ctx.translate(Math.round(x-12*scale),Math.round(y-36*scale));ctx.scale(scale,scale);
  if(hanging){ctx.translate(12,1);ctx.rotate(Math.sin(time*7)*.14);ctx.translate(-12,-1);}
  const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const outline="#302f35", skin="#f2d5af", blush="#eb9da2", hair=style.hood?style.coat:style.hair;
  const resting = action === "bench";
  // 작은 그림자와 짧은 발
  r(3,37,18,1,"#183a3933");
  r(resting?4:6,36+Math.round(walk),5,2,outline);r(13,36-Math.round(walk),5,2,outline);
  r(6,35+Math.round(walk),4,1,"#8c6952");r(13,35-Math.round(walk),4,1,"#8c6952");
  if(style.mantle||style.royal||style.shawl){r(3,22,18,13,outline);r(4,23,16,11,style.coat);}
  r(5,22,14,13,outline);r(6,22,12,12,style.coat);r(8,24,8,9,"#f4e7c5");r(6,25,2,7,"#ffffff22");r(16,25,2,8,"#302f3522");
  // 목은 얼굴 아래에서 옷깃 위까지 분명히 보인다.
  r(10,19,4,4,skin);r(9,21,6,2,outline);r(10,21,4,1,skin);
  r(2,24,5,5,outline);r(3,24,4,4,skin);r(17,24,5,5,outline);r(17,24,4,4,skin);
  if(style.apron){r(8,25,8,9,'#e9d4aa');r(6,24,12,1,'#705642');}
  if(style.vest){r(6,24,4,9,'#69583f');r(16,24,3,9,'#69583f');}
  if(style.sash){r(16,25,3,9,style.sash);}
  if(style.belt){r(5,29,14,2,'#58412d');r(11,29,3,2,'#c4a768');}
  if(style.fur){for(let i=0;i<6;i++){r(6+i*2,25+i%2,2,2,'#614f39');r(7+i*2,30-i%2,1,2,'#d4b68b');}r(4,23,3,2,style.coat);r(17,23,3,2,style.coat);}
  if(style.trim){r(5,24,1,10,style.trim);r(18,24,1,10,style.trim);r(6,34,12,1,style.trim);}
  if(style.pattern){for(let i=0;i<4;i++)r(6+i*3,25,1,8,['#7b8d7c','#b96c75','#cfac68','#788ca5'][i]);}
  // 얼굴 폭은 유지하되 전체 키를 늘려、頭身을整える.
  r(7,0,10,1,outline);r(5,1,14,1,outline);r(3,2,18,1,outline);r(2,3,20,2,outline);r(1,5,22,9,outline);r(2,14,20,2,outline);r(4,16,16,2,outline);
  r(7,1,10,1,hair);r(5,2,14,2,hair);r(3,4,18,10,hair);r(4,14,16,2,hair);
  r(5,6,14,8,skin);r(6,5,12,1,skin);
  if(style.bald){r(6,2,12,5,skin);r(5,4,14,3,skin);}r(6,14,12,1,skin);
  r(4,7,2,2,hair);r(18,7,2,2,hair);
  const look = facing < 0 ? -1 : 0;
  r(7,8,2,3,outline);r(15,8,2,3,outline);
  if(style.eyeliner){r(6,7,4,1,outline);r(14,7,4,1,outline);r(6,8,1,1,outline);r(17,8,1,1,outline);}
  r(5,11,3,2,blush);r(16,11,3,2,blush);r(11,12,3,1,"#77534c");
  r(6,3,4,1,"#ffffff33");
  if(style.updo){r(7,-3,10,3,outline);r(8,-2,8,2,style.hair);r(11,-3,3,2,'#d8b66a');}
  if(style.crown){r(5,-2,14,3,outline);r(6,-1,12,2,style.trim||'#d9b568');r(5,-4,2,3,'#d9b568');r(11,-5,2,4,'#d9b568');r(17,-4,2,3,'#d9b568');r(11,-1,2,2,'#a95e64');}
  if(style.turban){r(5,0,14,4,style.coat);r(4,3,16,2,'#e4d9ba');r(6,1,12,1,'#b0b8c4');r(11,0,2,6,style.trim||'#c4a768');}
  if(style.headband){r(4,4,16,2,'#e7d7b7');r(18,5,3,5,'#e7d7b7');}
  if(style.jewels){r(3,12,2,3,'#e0ba67');r(19,12,2,3,'#e0ba67');r(10,24,5,1,'#e0ba67');}
  if(style.beard){r(8,13,8,2,style.beard);r(9,15,6,2,style.beard);r(11,12,3,1,"#77534c");if(style.staff)r(10,23,4,2,style.beard);}
  if(style.halo){r(7,-4,10,1,"#f4c65c");r(5,-3,2,2,"#f4c65c");r(17,-3,2,2,"#f4c65c");r(7,-1,10,1,"#f4c65c");r(16,23,3,8,"#c97f75");}
  if(style.staff){for(let i=0;i<16;i++)r(-2+Math.floor(i/3),-7+i*2,2,3,outline);for(let i=0;i<15;i++)r(-1+Math.floor(i/3),-6+i*2,1,2,"#b78a5a");r(-4,-9,5,2,outline);r(-3,-8,3,1,"#b78a5a");}
  if(style.scroll){r(18,25,5,7,outline);r(19,26,3,5,'#eee0ad');r(18,25,5,1,'#b39362');r(18,31,5,1,'#b39362');}
  if(style.grapes){r(-2,27,6,6,'#745e40');r(-1,26,4,1,'#68a06b');r(-1,27,2,2,'#80679e');r(1,28,2,2,'#937db0');r(0,30,2,1,'#80679e');}
  if(style.grain){r(19,24,1,10,'#987c48');r(17,24,2,4,'#e5c574');r(20,23,2,4,'#e5c574');}
  if(style.net){for(let i=0;i<3;i++){r(18+i*2,25,1,9,'#b9b49c');r(18,26+i*3,6,1,'#b9b49c');}}
  if(style.lyre){r(18,25,1,8,'#c09b61');r(23,25,1,8,'#c09b61');r(18,32,6,2,'#c09b61');r(19,25,4,1,'#c09b61');r(20,26,1,5,'#e1d3a3');r(22,26,1,5,'#e1d3a3');}
  if(style.glow){r(-1,6,2,2,'#f8dc85');r(25,3,2,2,'#f8dc85');r(0,26,1,3,'#f8dc85');r(26,25,1,3,'#f8dc85');}
  if(hanging){r(3,25,2,4,skin);r(19,25,2,4,skin);r(7,37,2,2,outline);r(15,37,2,2,outline);}
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
