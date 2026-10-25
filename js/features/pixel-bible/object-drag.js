import {BOUNDS} from './camera.js';
import {OBJECT_CATALOG} from './object-catalog.js';
export const isBoat=object=>object?.kind==='boat'||OBJECT_CATALOG[object?.kind]?.family==='boat';
// 인물과 이동 경로를 막지 않는 빈 칸으로만 옮긴다.
export function canMoveObject(object, position, objects, npcs, {waterAt=()=>false}={}) {
 const {x,y}=position;
 return Number.isInteger(x)&&Number.isInteger(y)&&x>=BOUNDS.minX&&x<=BOUNDS.maxX&&y>=BOUNDS.minY&&y<=BOUNDS.maxY
  && (!waterAt(x,y)||isBoat(object))
  && !objects.some(o=>o!==object&&Math.hypot(o.x-x,o.y-y)<1.1)
  && !npcs.some(n=>Math.hypot(n.x-x,n.y-y)<1||n.path?.some(p=>p.x===x&&p.y===y));
}
