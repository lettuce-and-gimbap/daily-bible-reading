export function opposedDirections(a,b) {
 if(a.y===b.y&&a.x!==b.x)return a.x<b.x?['right','left']:['left','right'];
 if(a.x===b.x&&a.y!==b.y)return a.y<b.y?['down','up']:['up','down'];
 return null;
}
// 한 명은 기다리고 다른 한 명이 같은 축의 빈 칸으로 걸어간다.
export function planConversation(a,b,npcs,blocked,findPath) {
 const occupied=(x,y)=>npcs.some(n=>n!==a&&n!==b&&(Math.round(n.x)===x&&Math.round(n.y)===y));
 if(opposedDirections(a,b)&&Math.hypot(a.x-b.x,a.y-b.y)<=3&&(a.y===b.y||Math.abs(a.y-b.y)>=3)&&!blocked(a.x,a.y)&&!blocked(b.x,b.y)&&!occupied(a.x,a.y)&&!occupied(b.x,b.y))return {anchor:a,mover:b,destination:{x:b.x,y:b.y},route:[]};
 const plans=[];
 for(const [anchor,mover]of [[a,b],[b,a]]){
  if(!Number.isInteger(anchor.x)||!Number.isInteger(anchor.y)||blocked(anchor.x,anchor.y))continue;
  for(const distance of [2,3,1])for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
   if(dx===0&&distance<3)continue;
   const destination={x:anchor.x+dx*distance,y:anchor.y+dy*distance};
   const deny=(x,y)=>blocked(x,y)||(x===anchor.x&&y===anchor.y);
   if(deny(destination.x,destination.y)||occupied(destination.x,destination.y))continue;
   const route=findPath({x:Math.round(mover.x),y:Math.round(mover.y)},destination,deny);
   if(route)plans.push({anchor,mover,destination,route,score:route.length+(distance===2?0:1)});
  }
 }
 return plans.sort((a,b)=>a.score-b.score)[0]||null;
}
