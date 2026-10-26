export function drawWaterRescue(ctx,{x,y,style,pose,time=0,water='#528ca0',foam='#a7d4d0',progress=0,reduced=false}){
 const emerge=Math.max(0,Math.min(1,progress)),surfaceY=y-40+Math.round(emerge*32),motionTime=reduced?0:time;
 ctx.save();
 // A compact pixel-water sheet hides the torso below the waterline without
 // drawing a giant oval over the whole sprite or concealing the face.
 for(let row=0;row<Math.ceil(16*(1-emerge));row++){
  const wobble=reduced?0:Math.round(Math.sin(motionTime*5+row*.55)*1),width=68-Math.abs(7-row)*2,offset=reduced?0:Math.round(Math.sin(motionTime*3+row*.4)*2);
  ctx.fillStyle=water;ctx.fillRect(x-width/2+offset,surfaceY+row*3+wobble,width,3);
 }
 for(const [dx,width]of [[-23,14],[-5,18],[18,12]]){ctx.fillStyle=foam;ctx.fillRect(x+dx,surfaceY-1,width,2);}
 // Alternate the two hands at the waterline so the action reads as struggling.
 for(const [shoulder,arm,side]of [[5,pose?.leftArm,-1],[18,pose?.rightArm,1]])if(arm){
  const ex=x+(shoulder+arm.elbowX-12)*2,ey=surfaceY+Math.min(2,arm.elbowY*1.5);
  const hx=x+(shoulder+arm.handX-12)*2,hy=surfaceY-2-Math.min(8,Math.max(0,arm.handY+9)*.8);
  ctx.fillStyle='#302f35';ctx.fillRect(ex-3,ey-3,7,7);
  ctx.fillStyle=style?.coat||'#8a765b';ctx.fillRect(ex-1,ey-1,3,4);
  ctx.fillStyle='#302f35';ctx.fillRect(Math.min(ex,hx)-2,Math.min(ey,hy)-2,Math.max(4,Math.abs(hx-ex)+4),Math.max(4,Math.abs(hy-ey)+4));
  ctx.fillStyle='#f2d5af';ctx.fillRect(hx-3,hy-2,7,5);
  ctx.fillStyle='#302f35';ctx.fillRect(hx-4,hy-3,9,1);ctx.fillRect(hx-4,hy+2,9,1);
  for(let i=0;i<3;i++){
   const flicker=reduced?0:Math.floor(motionTime*9+i*2)%3;
   ctx.fillStyle=i?foam:'#d9f4ee';ctx.fillRect(hx+side*(6+i*3),surfaceY-2-flicker-i,2,4+flicker+i);
  }
  // Small droplets rise from each hand at the stroke's splash beat.
  if(!reduced&&emerge<.88){
   const beat=Math.floor(motionTime*8+(side>0?2:0))%4;
   if(beat<3){ctx.fillStyle=foam;ctx.fillRect(hx+side*(8+beat*3),surfaceY-7-beat*2,2,3);ctx.fillStyle='#d9f4ee';ctx.fillRect(hx+side*(12+beat*3),surfaceY-4-beat*3,2,2);}
  }
 }
 for(let i=0;i<3;i++){
  const phase=reduced?0:Math.floor(motionTime*5+i*2)%5,dx=[-22,0,22][i];
  ctx.fillStyle=i%2?foam:'#d9f4ee';ctx.fillRect(x+dx,surfaceY-5+phase*2,3,4);
 }
 ctx.restore();
}
