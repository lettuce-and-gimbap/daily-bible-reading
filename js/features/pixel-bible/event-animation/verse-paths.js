// One source-pixel step at a time; explicit paths override generic walking travel.
export function verseWaypoint(plan,name,index,progress){return sampleVersePoint(plan.waypoints?.[name],index,progress);}
export function sampleVersePoint(points,index,progress){
 if(!points)return null;
 const from=points[Math.max(0,index-1)],to=points[index],amount=Math.min(1,Math.max(0,Math.floor(progress*16)/16));
 return {x:Math.round(from.x+(to.x-from.x)*amount),y:Math.round(from.y+(to.y-from.y)*amount)};
}
