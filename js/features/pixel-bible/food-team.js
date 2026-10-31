import {characterStyle,drawPixelCharacter} from './art.js?rev=food-cute-2';

// Seven seconds of continuous poses, sampled at the display refresh rate.
export function startFoodTeam(host,team,{signal,reduced=false}={}){
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label','상추, 김밥, 카라멜팝콘: 우리는 벅수의 최애 음식들!');
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:30;pointer-events:none;background:#10152be8';host.append(canvas);
 const c=canvas.getContext('2d'),start=performance.now(),colors=['#83ef76','#ffd65b','#ff9971'];let frame;
 const stop=()=>{cancelAnimationFrame(frame);canvas.remove();signal?.removeEventListener('abort',stop);};signal?.addEventListener('abort',stop,{once:true});
 const draw=now=>{
  if(signal?.aborted){stop();return;}const t=(now-start)/1000;if(t>7){stop();return;}
  c.clearRect(0,0,960,540);c.fillStyle='#151d38';c.fillRect(0,0,960,540);
  const reveal=Math.min(1,t/2.4),energy=reduced?0:t;
  for(let i=0;i<36;i++){
   const a=i*Math.PI/18+energy*.12;c.fillStyle=colors[i%3];c.globalAlpha=.06+reveal*.12;
   c.beginPath();c.moveTo(480,330);c.lineTo(480+Math.cos(a)*1100,330+Math.sin(a)*1100);c.lineTo(480+Math.cos(a+.055)*1100,330+Math.sin(a+.055)*1100);c.fill();
  }c.globalAlpha=1;
  team.forEach((n,i)=>{
   const delay=i*.28,p=Math.max(0,Math.min(1,(t-delay)/2.4)),ease=1-Math.pow(1-p,3),x=260+i*220+(i-1)*(1-ease)*250,y=352-Math.sin(p*Math.PI)*95;
   // Distinct left lean, upright centre spin, and mirrored right lean.
   const tilt=reduced?0:(i-1)*(.32*ease)+Math.sin(p*Math.PI*2)*(1-p)*.65;
   c.save();c.translate(x,y);c.rotate(tilt);c.scale(1+.1*Math.sin(p*Math.PI),1-.06*Math.sin(p*Math.PI));
   c.shadowColor=colors[i];c.shadowBlur=22*ease;
   drawPixelCharacter(c,characterStyle(n.name,i,n.role,n.refs,false),0,0,{scale:3,walkFrame:Math.floor(t*60)%4,direction:'down',time:t});c.restore();
   for(let k=0;k<16;k++){const a=k*Math.PI/8+energy,r=40+((t*48+k*13)%110);c.globalAlpha=reveal*.6*(1-r/160);c.fillStyle=colors[i];c.fillRect(x+Math.cos(a)*r,y-65+Math.sin(a)*r,4,4);}c.globalAlpha=1;
   c.fillStyle=colors[i];c.font='bold 22px sans-serif';c.textAlign='center';c.fillText(n.name,x,405);
  });
  c.textAlign='center';c.fillStyle='#fff2bc';c.font='bold 34px sans-serif';c.fillText('우리는 벅수의 최애 음식들!',480,112);
  c.fillStyle='#ffffff99';c.font='18px sans-serif';c.fillText('상추  ×  김밥  ×  카라멜팝콘',480,151);
  frame=requestAnimationFrame(draw);
 };frame=requestAnimationFrame(draw);return stop;
}
