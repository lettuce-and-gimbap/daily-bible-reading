// Source-dot arm rasterizer. Uses the existing sprite palette and head/body artwork.
export function drawEventArms(r,style,pose,{side=false}={}){
 const ink='#302f35',skin='#f2d5af',arms=pose.eventArms;
 function segment(ax,ay,bx,by,width,color){const dx=bx-ax,dy=by-ay,n=Math.max(Math.abs(dx),Math.abs(dy),1);for(let i=0;i<=n;i++)r(Math.round(ax+dx*i/n),Math.round(ay+dy*i/n),width,width,color);}
 const shoulders=side?[[11,23],[14,23]]:[[5,22],[17,22]];
 for(let i=0;i<2;i++){const [sx,sy]=shoulders[i],[ex,ey,hx,hy]=arms[i];segment(sx,sy,ex,ey,3,ink);segment(sx+1,sy+1,ex+1,ey+1,1,style.coat);segment(ex,ey,hx,hy,3,ink);segment(ex+1,ey+1,hx+1,hy+1,1,skin);r(hx+1,hy,2,2,skin);}
}
