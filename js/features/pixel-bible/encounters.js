import {personalLines} from './personal-lines.js';
import {opposedDirections} from './conversation.js';
import {relationshipLines} from './relationship-lines.js';

const key=n=>`${n.name}:${n.identity?.id||''}`;
export function beside(a,b){
 const dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);
 return Math.abs(dx-1)<.18&&dy<.12||Math.abs(dy-1)<.18&&dx<.12;
}
// Keep one paired exchange active at a time; ambient speech pauses until it ends.
// One encounter per arrival; staying beside someone must not restart it every frame.
export class EncounterDirector {
 constructor(chapters,context,{random=Math.random,maxActive=1}={}){
  this.chapters=chapters;this.context=context;this.random=random;this.maxActive=1;this.active=[];this.contacts=new Map();this.nextGreeting=0;
 }
 clear(){for(const s of this.active)for(const n of s.people)n.encounter=false;this.active=[];}
 cancel(person){this.active=this.active.filter(s=>{if(!s.people.includes(person))return true;for(const n of s.people)n.encounter=false;return false;});}
 lines(a,b,relation){
  const chapterLines=new Map([a,b].map(n=>[key(n),personalLines(n,this.chapters,this.context).filter(line=>['authored','chapter-role'].includes(line.origin))]));
  return relationshipLines(a,b,relation,chapterLines,{random:this.random});
 }
 tick(now,npcs,{enabled=true,excluded=[]}={}){
  const deny=new Set(excluded.filter(Boolean));
  this.active=this.active.filter(s=>{
   const keep=enabled&&now<s.until&&s.people.every(n=>npcs.includes(n)&&!deny.has(n))&&beside(...s.people);
   if(!keep)for(const n of s.people){n.encounter=false;n.idle=.15;}
   return keep;
  });
  if(!enabled){for(const state of this.contacts.values())state.touching=false;return [];}
  const map=new Map(npcs.map(n=>[key(n),n])),seen=new Set();
  for(const [id,state]of this.contacts){if(state.greeted){const names=id.split('|'),a=map.get(names[0]),b=map.get(names[1]);if(!a||!b||!beside(a,b))state.greeted=false;}}
  const busy=new Set(this.active.flatMap(s=>s.people));
  for(const relation of this.context.relations){
   const a=map.get(key(relation.from)),b=map.get(key(relation.to));
   if(!a||!b||a===b||a.creature||b.creature)continue;
   const id=[key(a),key(b)].sort().join('|');if(seen.has(id))continue;seen.add(id);
   const state=this.contacts.get(id)||{touching:false};this.contacts.set(id,state);
   const touching=beside(a,b)&&!deny.has(a)&&!deny.has(b);
   if(!touching){state.touching=false;continue;}
   if(state.touching||busy.has(a)||busy.has(b)||this.active.length>=this.maxActive)continue;
   const lines=this.lines(a,b,relation);
   if(!lines.length)continue;
   state.touching=true;
   // Tiny walking interpolation differences are aligned on the shared axis.
   if(Math.abs(a.y-b.y)<.12){b.y=a.y;b.x=a.x+Math.sign(b.x-a.x);}else{b.x=a.x;b.y=a.y+Math.sign(b.y-a.y);}
   const directions=opposedDirections(a,b);
   [a,b].forEach((n,i)=>{n.path=[];n.task=null;n.action='';n.usingObject=null;n.interaction=null;n.objectScene=null;n.objectEvidence=null;n.encounter=true;n.idle=6;n.direction=directions[i];busy.add(n);});
   const session={id,people:[a,b],lines,started:now,until:now+5800};this.active.push(session);
  }
  // Unscripted proximity never invents a greeting. The relationship stage is
  // reserved for documented pair dialogue; unpaired characters stay in ambient motion.
  // Return one timed exchange; the view positions each speaker's line separately.
  return this.active.filter(s=>now>=s.started&&now<s.until).map(s=>({
   ...s.lines[0],session:s.id,slot:0,started:s.started,until:s.until,pairLines:s.lines,
  }));
 }
}
