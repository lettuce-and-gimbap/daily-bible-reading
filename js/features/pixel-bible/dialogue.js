import { personalLines } from './personal-lines.js';
import { speechView } from './speech-view.js';
import { buildChapterDialogue, occurrenceMatches } from './chapter-dialogue.js';
import { SOLO_DIALOGUE } from './solo-dialogue.js';
import { PAIR_DIALOGUE } from './pair-dialogue.js';
import { relationshipLines } from './relationship-lines.js';
import { characterStyle } from './art.js';

export { SOLO_DIALOGUE, PAIR_DIALOGUE };
export const DIALOGUE_SOURCE_STATUS = { bible:'existing-summary-and-verse-references', hokma:'partially-reviewed-uploaded-hokma-notes', wording:'original-imagined-dialogue' };
export const ambientSpeechAllowed=(interactionLines,enabled=true)=>enabled&&interactionLines.length===0;
// 인물별 독백은 상징 대사다. 특정 장의 현재 심경을 복원했다는 뜻이 아니다.
export function dialogueCandidates(npcs,chapters,contexts=buildChapterDialogue(chapters)) {
 // 관계 대사는 두 인물이 서로 8칸 이내에 있을 때만 후보가 된다.
 // 세계의 대화 이동기가 이 후보를 받아 서로 마주 볼 자리로 안내한다.
 const available=npcs.filter(n=>!n.path?.length&&!n.task&&!n.encounter);
 const candidates=available.flatMap(n=>personalLines(n,chapters,contexts)).filter(line=>line.kind!=='pair'&&!line.target);
 const humans=available.filter(n=>!n.creature);
 const authoredLines=new Map(available.map(n=>[`${n.name}:${n.identity?.id||''}`,candidates.filter(c=>c.speaker===n&&['authored','chapter-role'].includes(c.origin))]));
 const chapterSet=new Set(chapters.map(c=>`${c.code}.${c.chap}`));
 for(const entry of PAIR_DIALOGUE){
  if(!chapterSet.has(entry.chapter))continue;
  for(const a of humans.filter(n=>characterStyle(n.name,0,n.role||'',n.refs||[]).name===entry.speaker)){
   const b=humans.find(n=>n!==a&&characterStyle(n.name,0,n.role||'',n.refs||[]).name===entry.target&&Math.hypot(n.x-a.x,n.y-a.y)<=8);
   if(b)entry.lines.forEach((text,i)=>candidates.push({id:`${entry.id}:${i}`,speaker:a,target:b,text,ref:entry.ref,detailText:entry.detail||'',kind:'pair',origin:'authored-pair'}));
  }
 }
 for(const relation of contexts.relations){
  const a=humans.find(n=>occurrenceMatches(n,relation.from)),b=humans.find(n=>occurrenceMatches(n,relation.to));
  if(!a||!b||a===b||Math.hypot(a.x-b.x,a.y-b.y)>8)continue;
  const lines=relationshipLines(a,b,relation,authoredLines);
  for(const line of lines)if(!candidates.some(c=>c.kind==='pair'&&c.speaker===line.speaker&&c.target===line.target))candidates.push({...line,origin:'chapter-relation'});
 }
 return candidates;

}

// 한 전역 슬롯만 소유한다. 종료를 실제 관측한 시점부터 다음 3초를 센다.
export class SpeechDirector {
 constructor({now=0,random=Math.random,duration=5000,gap=3000}={}){this.random=random;this.duration=duration;this.gap=gap;this.nextAt=now+gap;this.current=null;this.lastId=null;this.lastSpeaker=null;}
 interrupt(choice,now){return this.start(choice,now);}
 start(choice,now){this.current={...speechView(choice),started:now,until:now+this.duration};this.lastId=choice.id;this.lastSpeaker=choice.speaker;return this.current;}
 dismiss(now){this.current=null;this.nextAt=now+this.gap;}
 tick(now,candidates,enabled=true){
  if(!enabled){this.dismiss(now);return null;}
  if(this.current){if(now<this.current.until)return this.current;this.dismiss(now);return null;}
  if(now<this.nextAt)return null;
  this.nextAt=now+this.gap;
  if(!candidates.length)return null;
  let pool=candidates.filter(c=>c.id!==this.lastId);if(!pool.length)pool=candidates;
  const pairs=pool.filter(c=>c.kind==='pair'),solos=pool.filter(c=>c.kind!=='pair');
  pool=pairs.length?pairs:solos;
  const other=pool.filter(c=>c.speaker!==this.lastSpeaker);if(other.length)pool=other;
  const choice=pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))];
  return this.start(choice,now);
 }
}
