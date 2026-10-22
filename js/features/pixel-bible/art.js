// 큰 도트, 1.5~2등신, 멍한 점눈. 런타임과 디자인 도안에서 같은 그림 함수를 쓴다.
export const CHARACTER_STYLES = {
  jesus: { name: "예수님", coat: "#f6e9c4", hair: "#76503b", beard: "#76503b", halo: true },
  moses: { name: "모세", coat: "#83aebe", hair: "#eee9d1", beard: "#eee9d1", staff: true },
  elijah: { name: "엘리야", coat: "#c68262", hair: "#755037", beard: "#755037", chariot: true },
  ruth: { name: "룻", coat: "#b39ad0", hair: "#65503f", hood: true },
  boaz: { name: "보아스", coat: "#7ba493", hair: "#795a43", beard: "#795a43" },
  worker: { name: "일꾼", coat: "#d4ad65", hair: "#8f6c42", hood: true },
};
export function characterStyle(name, index = 0) {
  const key = /^(예수|예수님|그리스도)$/.test(name) ? "jesus" : name === "모세" ? "moses" : name === "엘리야" ? "elijah" : name === "룻" ? "ruth" : name === "보아스" ? "boaz" : "worker";
  const style = { ...CHARACTER_STYLES[key] };
  if (key === "worker" && name !== "일꾼") style.coat = ["#ba858c", "#83aebe", "#b39ad0", "#d4ad65", "#7ba493"][index % 5];
  return style;
}
export function drawPixelCharacter(ctx, style, x, y, { scale = 3, walk = 0, action = "", facing = 1, time = 0 } = {}) {
  ctx.save();ctx.translate(Math.round(x-10*scale),Math.round(y-26*scale));ctx.scale(scale,scale);
  const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const outline="#302f35", skin="#f2d5af", blush="#eb9da2", hair=style.hood?style.coat:style.hair;
  const resting = action === "bench";
  // 작은 그림자와 짧은 발
  r(3,27,14,2,"#183a3933");
  r(resting?3:5,26+Math.round(walk),resting?6:4,2,outline);r(12,26-Math.round(walk),resting?6:4,2,outline);
  r(5,25+Math.round(walk),4,1,"#8c6952");r(12,25-Math.round(walk),4,1,"#8c6952");
  r(4,16,12,10,outline);r(5,16,10,9,style.coat);r(7,17,6,7,"#f4e7c5");r(5,18,2,6,"#ffffff22");r(13,18,2,7,"#302f3522");
  r(1,17,4,4,outline);r(2,17,3,3,skin);r(15,17,4,4,outline);r(15,17,3,3,skin);
  // 커다란 머리와 굵은 한 도트 외곽선
  r(5,0,10,1,outline);r(3,1,14,1,outline);r(2,2,16,1,outline);r(1,3,18,2,outline);r(0,5,20,9,outline);r(1,14,18,2,outline);r(3,16,14,1,outline);
  r(5,1,10,1,hair);r(3,2,14,2,hair);r(2,4,16,10,hair);r(3,14,14,2,hair);
  r(3,6,14,8,skin);r(4,5,12,1,skin);r(4,14,12,1,skin);
  r(3,6,2,2,hair);r(15,6,2,2,hair);
  const look = facing < 0 ? -1 : 0;
  r(5+look,8,2,3,outline);r(13+look,8,2,3,outline);
  r(3,11,3,2,blush);r(14,11,3,2,blush);r(9,12,3,1,"#77534c");
  r(4,3,4,1,"#ffffff33");
  if(style.beard){r(6,13,8,2,style.beard);r(7,15,6,2,style.beard);r(9,12,3,1,"#77534c");if(style.staff)r(8,17,4,2,style.beard);}
  if(style.halo){r(5,-4,10,1,"#f4c65c");r(3,-3,2,2,"#f4c65c");r(15,-3,2,2,"#f4c65c");r(5,-1,10,1,"#f4c65c");r(12,17,3,8,"#c97f75");}
  if(style.staff){for(let i=0;i<16;i++)r(-4+Math.floor(i/3),-7+i*2,2,3,outline);for(let i=0;i<15;i++)r(-3+Math.floor(i/3),-6+i*2,1,2,"#b78a5a");r(-6,-9,5,2,outline);r(-5,-8,3,1,"#b78a5a");}
  if(action==="field"){r(17,15,1,8,"#b78a5a");r(16,14,3,3,"#f5d371");r(15,16,2,2,"#e1b95f");}
  if(action==="water"){r(16,13,3,4,outline);r(16,13,3,1,"#87bfd1");r(16,14,2,2,"#bf8767");}
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
  const W=1200,H=1040;c.canvas.width=W;c.canvas.height=H;c.imageSmoothingEnabled=false;
  c.fillStyle="#f3ecdb";c.fillRect(0,0,W,H);
  c.fillStyle="#16343c";c.fillRect(0,0,W,108);
  c.fillStyle="#f6d894";c.font="bold 30px monospace";c.fillText("PIXEL BIBLE / DESIGN BOARD",38,48);
  c.fillStyle="#d7e0c3";c.font="16px sans-serif";c.fillText("큰 도트 · 길이를 살린 몸통 · 점눈과 볼터치 · 실제 월드와 같은 원본 그림",38,82);
  const entries=Object.entries(CHARACTER_STYLES);
  entries.forEach(([key,style],i)=>{
    const x=30+i*195;
    c.fillStyle=i%2?"#e6ddca":"#d9e0ce";c.fillRect(x,130,170,245);
    drawPixelCharacter(c,style,x+85,305,{scale:5,action:key==="elijah"?"ascend":key==="ruth"?"field":""});
    c.fillStyle="#263e3d";c.textAlign="center";c.font="bold 18px sans-serif";c.fillText(style.name,x+85,350);
    c.font="11px monospace";c.fillText("20 × 28 / 5x preview",x+85,368);
  });
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
    drawPixelCharacter(c,CHARACTER_STYLES.ruth,x+55,856,{scale:4,walk:[-1,0,1][i]});
  }
  c.font="14px sans-serif";c.fillStyle="#294842";c.fillText("왼발 → 대기 → 오른발",54,916);
  const bg=document.createElement("canvas");bg.width=960;bg.height=480;drawWorldBackground(bg.getContext("2d"));
  c.drawImage(bg,450,728,720,240);
  c.font="14px sans-serif";c.fillText("풀밭 · 흙길 · 물가 · 돌집 (상상 공간)",450,995);
  c.font="12px sans-serif";c.fillStyle="#5d6d61";c.fillText("관리자 개발 체험 · 정식 출시 전 · 본문 사건과 창작 일상 동작을 구분합니다.",36,1020);
}
