// 인물과 이동 경로를 막지 않는 빈 칸으로만 옮긴다.
export function canMoveObject(object, position, objects, npcs) {
 const {x,y}=position;
 return Number.isInteger(x)&&Number.isInteger(y)&&x>=2&&x<=37&&y>=5&&y<=15
  && !objects.some(o=>o!==object&&Math.hypot(o.x-x,o.y-y)<1.1)
  && !npcs.some(n=>Math.hypot(n.x-x,n.y-y)<1||n.path?.some(p=>p.x===x&&p.y===y));
}
