import {personalLines} from './personal-lines.js';
import {opposedDirections} from './conversation.js';
import {relationshipLines} from './relationship-lines.js';

const key=n=>`${n.name}:${n.identity?.id||''}`;
export const GENERAL_GREETING_CHANCE=1/3;
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
  // Unknown relationships get a brief everyday greeting, never an invented
  // biblical conflict. Spatial buckets keep crowded casts from an all-pairs scan.
  if(!this.active.length){
   const humans=npcs.filter(n=>!n.creature&&!deny.has(n)&&!n.encounter&&!n.usingObject&&!n.task);
   const cells=new Map();for(const n of humans){const cell=`${Math.round(n.x)},${Math.round(n.y)}`;if(!cells.has(cell))cells.set(cell,[]);cells.get(cell).push(n);}
   let started=false;
   for(const a of humans){
    if(started)break;
    for(const [dx,dy]of [[1,0],[0,1]]){
     for(const b of cells.get(`${Math.round(a.x)+dx},${Math.round(a.y)+dy}`)||[]){
      if(!beside(a,b))continue;
      const id=[key(a),key(b)].sort().join('|'),state=this.contacts.get(id)||{};
      if(state.greeted||state.touching)continue;state.greeted=true;this.contacts.set(id,state);
      if(this.random()>=GENERAL_GREETING_CHANCE)continue;
      if(Math.abs(a.y-b.y)<.12)b.y=a.y;else b.x=a.x;
      const directions=opposedDirections(a,b);if(!directions)continue;
      for(const [i,n]of [a,b].entries()){n.path=[];n.idle=6;n.direction=directions[i];n.encounter=true;}
      const variant=this.random()<.5?0:1;
      const greetings=[
       ['여기서 만나니 반갑네요. 잘 지내셨어요?','네, 덕분에 잘 지내요. 다시 이야기 나눠 기뻐요.'],
       ['오늘은 어떤 일을 하고 계세요?','맡은 일을 살피고 있어요. 당신은 잘 지내셨나요?'],
      ][variant];
      const lines=[{speaker:a,target:b,text:greetings[0],origin:'general',kind:'pair'},{speaker:b,target:a,text:greetings[1],origin:'general',kind:'pair'}];
      this.active.push({id,people:[a,b],lines,started:now,until:now+5800});this.nextGreeting=now;started=true;break;
     }if(started)break;
    }
   }
  }
  // Return one timed exchange; the view positions each speaker's line separately.
  return this.active.filter(s=>now>=s.started&&now<s.until).map(s=>({
   ...s.lines[0],session:s.id,slot:0,started:s.started,until:s.until,pairLines:s.lines,
  }));
 }
}
