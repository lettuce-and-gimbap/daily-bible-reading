import { buildChapterDialogue, majorFor, occurrenceMatches } from './chapter-dialogue.js';
import { SOLO_DIALOGUE } from './solo-dialogue.js';
import { PAIR_DIALOGUE } from './pair-dialogue.js';
import { characterStyle } from './art.js';

export { SOLO_DIALOGUE, PAIR_DIALOGUE };
export const DIALOGUE_SOURCE_STATUS = { bible:'existing-summary-and-verse-references', hokma:'not-reviewed-source-unavailable', wording:'original-imagined-dialogue' };
const ordinary=['천천히 주변을 살펴볼까.','잠깐 숨을 고르고 다시 걸어 보자.','오늘은 어떤 길을 걷게 될까.'];
// 인물별 독백은 상징 대사다. 특정 장의 현재 심경을 복원했다는 뜻이 아니다.
export function dialogueCandidates(npcs,chapters,contexts=buildChapterDialogue(chapters)) {
 const available=npcs.filter(n=>!n.path?.length&&!n.task);
 const sources=new Set(chapters.map(c=>`${c.code}.${c.chap}`));
 const profiles=new Map(available.map(n=>[n,characterStyle(n.name,0,n.role||'',n.refs||[])]));
 const candidates=[];
 const exactScopes={'바로':'exo.5','다리오':'dan.6','벤하닷':'1ki.20','요나단':'1sa.18','스가랴':'zec.4','아하시야':'2ki.1'};
 for(const n of available){
  const p=profiles.get(n),major=majorFor(n,contexts);
  const solo=major||(p.key==='generic'||(exactScopes[p.name]&&!sources.has(exactScopes[p.name]))?null:SOLO_DIALOGUE[p.name]);
  const occurrences=contexts.people.filter(c=>occurrenceMatches(n,c)&&c.text);
  if(solo){for(const [i,text] of solo.lines.entries())candidates.push({id:`solo:${n.identity?.id||n.name}:${solo.ref}:${i}`,speaker:n,text,ref:solo.ref,kind:'solo',origin:'authored'});}
  else if(occurrences.length){for(const c of occurrences)candidates.push({id:`chapter:${n.identity?.id||n.name}:${c.code}.${c.chap}`,speaker:n,text:c.text,ref:c.ref,kind:'context',origin:'chapter-role'});}
  else ordinary.forEach((text,i)=>candidates.push({id:`ordinary:${n.identity?.id||n.name}:${i}`,speaker:n,text,ref:'',kind:'ordinary'}));
 }

 for(const entry of PAIR_DIALOGUE){
  if(!sources.has(entry.chapter))continue;
  for(const a of available.filter(n=>profiles.get(n).name===entry.speaker&&profiles.get(n).key!=='generic')){
   const b=available.find(n=>n!==a&&profiles.get(n).name===entry.target&&profiles.get(n).key!=='generic'&&Math.hypot(n.x-a.x,n.y-a.y)<=3);
   if(b)entry.lines.forEach((text,i)=>candidates.push({id:`${entry.id}:${i}`,speaker:a,target:b,text,ref:entry.ref,kind:'pair'}));
  }
 }
 // 개인 전용 대사가 없는 관계도 현재 본문 해설로 연결한다. 역방향은 같은 해설이며 실제 발언이 아니다.
 for(const r of contexts.relations){
  for(const [from,to] of [[r.from,r.to],[r.to,r.from]]){
   const a=available.find(n=>occurrenceMatches(n,from)),b=available.find(n=>occurrenceMatches(n,to));
   if(!a||!b||a===b||Math.hypot(a.x-b.x,a.y-b.y)>3)continue;
   if(candidates.some(c=>c.kind==='pair'&&c.speaker===a&&c.target===b))continue;
   candidates.push({id:`relation:${from.code}.${from.chap}:${from.identity.id}:${to.identity.id}`,speaker:a,target:b,text:r.text,ref:r.ref,kind:'pair',origin:'chapter-relation'});
  }
 }
 return candidates;
}

// 한 전역 슬롯만 소유한다. 종료를 실제 관측한 시점부터 다음 3초를 센다.
export class SpeechDirector {
 constructor({now=0,random=Math.random,duration=5000,gap=3000}={}){this.random=random;this.duration=duration;this.gap=gap;this.nextAt=now+gap;this.current=null;this.lastId=null;this.lastSpeaker=null;}
 start(choice,now){this.current={...choice,started:now,until:now+this.duration};this.lastId=choice.id;this.lastSpeaker=choice.speaker;return this.current;}
 dismiss(now){this.current=null;this.nextAt=now+this.gap;}
 tick(now,candidates,enabled=true){
  if(!enabled){this.dismiss(now);return null;}
  if(this.current){if(now<this.current.until)return this.current;this.dismiss(now);return null;}
  if(now<this.nextAt)return null;
  this.nextAt=now+this.gap;
  if(!candidates.length||this.random()>=.85)return null;
  let pool=candidates.filter(c=>c.id!==this.lastId);if(!pool.length)pool=candidates;
  const pairs=pool.filter(c=>c.kind==='pair'),solos=pool.filter(c=>c.kind!=='pair');
  pool=pairs.length&&(!solos.length||this.random()<.7)?pairs:solos.length?solos:pairs;
  const other=pool.filter(c=>c.speaker!==this.lastSpeaker);if(other.length)pool=other;
  const choice=pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))];
  return this.start(choice,now);
 }
}
