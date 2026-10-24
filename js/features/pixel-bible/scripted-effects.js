import {objectPresentation,heldObject} from './object-response.js';
import {drawWorldObject} from './art.js';
export function drawScriptedEffect(c,n,p,x,y,time=0){
 if(!p.scripted)return false;
 const beat=p.eventBeat,t=p.eventProgress,dir=n.direction==='left'?-1:1,o=n.usingObject;
 const r=(xx,yy,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(xx),Math.round(yy),Math.round(w),Math.round(h));};
 const prop=(kind,xx,yy,scale=1,tilt=0)=>drawWorldObject(c,{kind,x:xx/24,y:yy/24},24,{scale,tilt,held:true});
 const aux=kind=>(n.eventObjects||[]).find(o=>o.kind===kind);
 const water=aux('water-supply'),wx=(water||o).x*24,wy=(water||o).y*24;
 const hand={x:x+dir*(16+(p.handX||0)*2),y:y+(p.handY-36)*2};
 const stream=(from,to,color,count=6)=>{for(let i=0;i<count;i++){const a=(i+.5)/count;r(from.x+(to.x-from.x)*a,from.y+(to.y-from.y)*a,2,4,color);}};
 if(p.actual==='mantle-river'){
  const split=beat>=4?Math.min(1,(beat-3)/2):0;
  for(const side of [-1,1]){r(wx+side*(16+split*32)-(side<0?50:0),wy-7,50,24,'#4e9eae');for(let i=0;i<5;i++)r(wx+side*(20+split*30)+i*side*7,wy-9+i%2*3,7,3,'#acdce0');}
  if(split)r(wx-12,wy-4,24,20,'#c5b783');

 }
 if(['salt-source','flour-pot'].includes(p.actual)&&beat>=3){
  const target=p.actual==='salt-source'?{x:wx,y:wy-14}:aux('pot')?{x:aux('pot').x*24,y:aux('pot').y*24-22}:{x:o.x*24+24,y:o.y*24-14};
  if(beat<=5)stream(hand,target,p.actual==='salt-source'?'#fff9e6':'#e8d6a4');
  if(beat>=5)for(let i=0;i<5;i++)r(target.x-15+i*7,target.y+4+i%2,5,2,'#b3dcd4');
 }
 if(p.actual==='oil-many'){
  const jars=(n.eventObjects||[]).filter(p=>p.kind==='jar');
  jars.forEach((jar,i)=>{if(beat>=4+i)r(jar.x*24-4,jar.y*24-30,8,2,'#dbb95f');});
  const target=jars[Math.min(jars.length-1,Math.max(0,beat-3))];
  if(target&&beat>=3&&beat<=5)stream(hand,{x:target.x*24,y:target.y*24-33},'#d8b655');
 }
 if(p.actual==='axe-float'){
  const ax=aux('axe')||water||o,axX=ax.x*24,axY=ax.y*24;
  r(axX-33,axY-9,66,20,'#559aa7');for(let i=0;i<4;i++)r(axX-28+i*15,axY+1,8,2,'#a2d4d5');
  if(beat>=3){const flight=Math.min(1,(beat-3)/2),sx=x+dir*22,sy=y-20;prop('rod',sx+(axX-sx)*flight,sy+(axY-3-sy)*flight-Math.sin(flight*Math.PI)*16,objectPresentation('rod').scale,flight*1.2);}
  if(beat>=4)prop('axe',axX,axY+Math.max(0,6-beat)*6,objectPresentation('axe').scale,Math.PI/2);
 }
 if(p.actual==='fig-paste'){
  const bed=aux('bed')||o,bx=bed.x*24,by=bed.y*24;
  if(beat>=3){prop('fig-poultice',bx+8,by-22,objectPresentation('fig-poultice').scale);if(beat<=5){r(bx-2,by-24,16,4,'#efd2ab');r(bx+6,by-23,5,5,'#b09360');}}
 }
 if(p.actual==='anoint-head'&&beat>=3&&beat<=5){const other=n.eventPartner;const to=other?{x:other.x*24,y:other.y*24-64}:{x:x+dir*30,y:y-48};stream(hand,to,'#c9a96c');}
 if(p.actual==='feet-basin'&&beat>=2&&beat<=5){
  const other=n.eventPartner,to=other?{x:other.x*24,y:other.y*24-3}:{x:o.x*24,y:o.y*24};
  stream({x:o.x*24,y:o.y*24-6},to,'#a5d9df',4);r(to.x-10,to.y,20,3,'#c5e3e2');
  if(beat>=4){r(to.x-11,to.y-6,22,6,'#e5ddc3');r(to.x-6,to.y-5,3,5,'#b9b19a');}
 }
 if(p.actual==='chain-open'){
  const gap=beat>=3?(beat-2)*4:0;for(const side of [-1,1])for(let i=0;i<3;i++){r(x+side*(8+gap+i*7)-2,y-24+i*5,6,2,'#a5b9b7');r(x+side*(8+gap+i*7)-2,y-22+i*5,2,4,'#657c80');}

 }
 if(p.actual==='net-catch'){
  const cast=beat<3?0:beat===3?1:beat===4?2:beat===5?1:0,xx=x+dir*(26+cast*23),yy=y-8+cast*5;
  prop('net',xx,yy,objectPresentation('net').scale);
  if(beat>=5)for(let i=0;i<3;i++)prop('fish',xx-10+i*12,yy+5+i%2*5,.45,i%2?.2:-.2);
 }
 if(p.actual==='reed-float'&&beat>=3)prop('reed-basket',wx,wy-4+(beat%2),objectPresentation('reed-basket').scale);
 if(p.actual==='tablet-write'&&beat>=2){const board=heldObject(n,time),bx=board?board.x*24:o.x*24,by=board?board.y*24:o.y*24;prop('pen',bx+dir*(3+beat%2*3),by-10,.75,.5);for(let i=0;i<Math.min(4,beat-1);i++)r(bx-5,by-20+i*4,9,1,'#675044');}
 return true;
}
