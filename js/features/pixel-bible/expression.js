// 명시된 감정이 우선이다. 대사 밖으로 장식을 그리지 않아 머리/관 장식과 충돌하지 않는다.
export const EXPRESSIONS=['neutral','joy','sad','worried','angry','surprised','determined','gentle'];
export function speechEmotion(line){
 if(EXPRESSIONS.includes(line.emotion))return line.emotion;
 const text=line.text||'';
 if(/죽이|죽게|없애|거짓 증|멸하|내 뜻대로|빼앗|도장|분노|분해서|어찌 감히/.test(text))return 'angry';
 if(/울|눈물|슬프|죽었|잃었|통곡|불쌍|무너지는|서러|더 버틸 힘|지친 마음/.test(text))return 'sad';
 if(/두렵|도망|죽겠|근심|무섭|혼자 남|갈급/.test(text))return 'worried';
 if(/어찌|놀랍|살아났|일어났|비었/.test(text))return 'surprised';
 if(/기쁘|감사|찬양|구원|노래|나았|살리셨/.test(text))return 'joy';
 if(/돌보|먹이|사랑|쉬|안아|내게로/.test(text))return 'gentle';
 if(/따르|전하|여호와|말씀|명하신|섬기/.test(text))return 'determined';
 return 'neutral';
}
export function drawFaceExpression(r,emotion='neutral',{side=false,look=0,spacing=0,tone='#302f35',soft=false}={}){
 // 표정 픽셀은 얼굴 피부 안쪽에만 둔다. 턱·옆머리·장식을 덮지 않는다.
 const paint=r;
 r=(x,y,w,h,color)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
  const inside=side?(yy>=11&&yy<=15?xx>=14&&xx<=17:yy===16&&xx>=14&&xx<=16):(yy>=8&&yy<=11?xx>=8&&xx<=15:yy>=12&&yy<=13&&xx>=9&&xx<=14);
  if(inside)paint(xx,yy,1,1,color);
 }};
 const ink=tone,mouth='#a37363';
 const xs=side?[16]:[9+look+(spacing===1?1:0),14+look-(spacing===2?1:0)],ey=side?12:9,my=side?16:12,mx=side?16:11;
 for(const x of xs){
  if(['joy','gentle'].includes(emotion)||soft&&emotion==='neutral'){r(x,ey+1,2,1,ink);if(emotion==='joy')r(x,ey,1,1,ink);}
  else {r(x,ey,1,2,ink);if(emotion==='surprised')r(x,ey,side?1:2,2,ink);}
 }
 if(emotion==='angry'||emotion==='determined'){
  xs.forEach((x,i)=>{r(x+(i?-1:0),ey-1,2,1,ink);if(emotion==='angry')r(x+(i?-1:1),ey,1,1,ink);});
 }else if(emotion==='worried'||emotion==='sad')xs.forEach((x,i)=>r(x+(i?0:-1),ey-1,2,1,mouth));
 if(emotion==='surprised')r(mx,my,side?1:2,2,mouth);
 else if(emotion==='joy'){r(mx-1,my,side?2:4,1,mouth);if(!side)r(mx,my+1,2,1,mouth);}
 else if(emotion==='sad'||emotion==='worried'){r(mx,my,side?1:2,1,mouth);if(!side)r(mx-1,my+1,1,1,mouth);}
 else r(mx,my,side?1:2,1,mouth);
}
