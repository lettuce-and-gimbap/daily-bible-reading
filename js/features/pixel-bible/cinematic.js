// Event-stage animation uses an independent canvas and human proportions.
export function mountCinematic(host,scene,actors){
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=300;canvas.setAttribute('aria-label',scene.title+' 사건 애니메이션');canvas.style.cssText='width:100%;max-height:42vh;object-fit:contain;image-rendering:pixelated;background:#253943';host.prepend(canvas);
 const c=canvas.getContext('2d');let frame,closed=false,start=performance.now();
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 function draw(now){if(closed||!canvas.isConnected)return;const t=Math.floor((now-start)/125)/8;c.clearRect(0,0,720,300);
 rect(0,0,720,220,'#728987');rect(0,220,720,80,'#b5a882');
 const water=/요단|물|강|도끼/.test(scene.title+' '+scene.lines.join(' '));
 if(water){rect(0,236,720,64,'#487f95');for(let i=0;i<18;i++)rect((i*47+t*12)%720,246+i%3*15,22,2,'#a9d0cc');}
 actors.filter(Boolean).forEach((n,i)=>{const x=actors.length===1?360:100+i*520/Math.max(1,actors.length-1),y=218,side=i%2?-1:1,beat=Math.sin(t*3+i),skin='#e4bd92',coat=['#70668a','#97744f','#628473','#9a5850'][i%4];
 rect(x-18,y-3,38,5,'#304d4d');
 // Legs, tunic, neck, head, brows and mouth have separate articulated layers.
 rect(x-10,y-53,8,49,'#403c40');rect(x+3,y-53,8,49,'#403c40');rect(x-13,y-4,12,5,'#493c32');rect(x+2,y-4,13,5,'#493c32');
 rect(x-16,y-112,33,65,coat);rect(x-16,y-65,33,5,'#d0ac64');rect(x-4,y-123,9,13,skin);
 rect(x-14,y-157,29,35,'#403630');rect(x-11,y-151,23,28,skin);rect(x-13,y-158,27,8,'#473b32');
 rect(x-7,y-140,3,3,'#302f35');rect(x+5,y-140,3,3,'#302f35');rect(x-3,y-130,8,Math.floor(t*3)%2?2:1,'#875b4f');
 const handY=y-87+Math.round(beat*12);rect(x-22,y-108,8,28,coat);rect(x-22,handY,8,18,skin);rect(x+15,y-108,8,30,coat);rect(x+15+side*4,handY-8,8,20,skin);
 c.fillStyle='#fff3cd';c.font='14px monospace';c.textAlign='center';c.fillText(n.name,x,275);
 });
 frame=requestAnimationFrame(draw);}
 frame=requestAnimationFrame(draw);return ()=>{closed=true;cancelAnimationFrame(frame);canvas.remove();};
}
