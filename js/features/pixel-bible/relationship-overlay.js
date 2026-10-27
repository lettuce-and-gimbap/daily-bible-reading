import {physiqueFor} from './physique.js';
import {grabbedOrigin} from './grab.js';
import { interactionAnchor } from './object-response.js';
function endpoints(r,npcs){
 const a=npcs.find(n=>n.name===r.from&&(!r.sourceRef||n.refs.includes(r.sourceRef)));
 const b=npcs.find(n=>n.name===r.to&&(!r.sourceRef||n.refs.includes(r.sourceRef)));
 return a&&b&&a!==b?[a,b]:null;
}
export function relationshipFocus(relations,npcs,selected){
 if(!selected)return null;
 const focus=new Set([selected]);
 for(const r of relations){const pair=endpoints(r,npcs);if(pair?.includes(selected))for(const person of pair)focus.add(person);}
 return focus;
}
// 매 프레임 현재 위치로 머리 위 연결점을 계산한다. 드래그 좌표도 동일하게 반영한다.
export function relationshipLinks(relations,npcs,drag=null,focusPerson=null) {
 const links=[],seen=new Set();
 const head=n=>{const height=n.creature?1:physiqueFor(n.name,n.role,n.refs).height;return drag?.active&&drag.n===n?{x:grabbedOrigin(drag).x*24,y:grabbedOrigin(drag).y*24-80*height}:{x:interactionAnchor(n).x,y:interactionAnchor(n).y-80*height};};
 for(const r of relations){
  const pair=endpoints(r,npcs);if(!pair)continue;
  const [a,b]=pair;if(focusPerson&&a!==focusPerson&&b!==focusPerson)continue;
  const key=[npcs.indexOf(a),npcs.indexOf(b)].sort((x,y)=>x-y).join(':')+':'+r.label;
  if(seen.has(key))continue;seen.add(key);
  links.push({a:head(a),b:head(b),label:r.label||'관계',ref:r.ref});
 }
 return links;
}
export function drawRelationshipLinks(ctx,links) {
 const labels=[];
 ctx.save();ctx.lineWidth=2;ctx.font='bold 12px "DungGeunMo", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
 for(const [i,l] of links.entries()){
  const top=Math.max(48,Math.min(l.a.y,l.b.y)-14-(i%3)*18),mid=(l.a.x+l.b.x)/2;
  ctx.strokeStyle='#ffe1a4';ctx.shadowColor='#142d37';ctx.shadowBlur=3;
  ctx.beginPath();ctx.moveTo(l.a.x,l.a.y);ctx.lineTo(l.a.x,top);ctx.lineTo(l.b.x,top);ctx.lineTo(l.b.x,l.b.y);ctx.stroke();
  ctx.shadowBlur=0;ctx.fillStyle='#ffe1a4';ctx.fillRect(l.a.x-2,l.a.y-2,4,4);ctx.fillRect(l.b.x-2,l.b.y-2,4,4);
  const text=l.label.length>16?l.label.slice(0,15)+'…':l.label;
  const width=ctx.measureText(text).width+12,left=mid-width/2;
  if(labels.some(box=>Math.abs(box.y-top)<20&&left<box.right+6&&left+width>box.left-6))continue;
  labels.push({left,right:left+width,y:top,width,text,mid});
 }
 for(const box of labels){
  ctx.fillStyle='#102e38ed';ctx.fillRect(box.left,box.y-9,box.width,18);
  ctx.fillStyle='#fff0c4';ctx.fillText(box.text,box.mid,box.y);
 }
 ctx.restore();
}
