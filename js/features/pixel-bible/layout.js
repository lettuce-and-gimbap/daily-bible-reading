import {BOUNDS} from './camera.js';
// 과거 넓은 월드의 바깥 물건도 버리지 않고 가장 가까운 빈 셀에 옮긴다.
export function fitLayout(saved,catalog){
 const used=new Set(),result=[];
 for(const o of saved){
  if(!o||!Object.hasOwn(catalog,o.kind)||!Number.isInteger(o.x)||!Number.isInteger(o.y))continue;
  const x=Math.max(BOUNDS.minX,Math.min(BOUNDS.maxX,o.x)),y=Math.max(BOUNDS.minY,Math.min(BOUNDS.maxY,o.y));
  if(!used.has(`${x},${y}`)){used.add(`${x},${y}`);result.push({...o,x,y});continue;}
  let best=null,d=Infinity;
  for(let yy=BOUNDS.minY;yy<=BOUNDS.maxY;yy++)for(let xx=BOUNDS.minX;xx<=BOUNDS.maxX;xx++){
   if(used.has(`${xx},${yy}`))continue;const distance=Math.abs(xx-x)+Math.abs(yy-y);
   if(distance<d){d=distance;best={x:xx,y:yy};}if(distance===0)break;
  }
  if(best){used.add(`${best.x},${best.y}`);result.push({...o,...best});}
 }
 return result;
}
