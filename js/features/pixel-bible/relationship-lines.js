import {PAIR_DIALOGUE} from './pair-dialogue.js';

const sameName=(a,b)=>a===b||['예수','예수님'].includes(a)&&['예수','예수님'].includes(b);
function contextualLine(speaker,relation){
 if(relation.from.code==='neh'&&relation.from.chap===3){
  if(speaker.name==='하눈')return '골짜기 문은 세웠어. 샘문 쪽은 어떻게 됐어?';
  if(speaker.name==='살룬')return '샘문도 수리했어. 이제 함께 성벽을 이어가자.';
 }
 return null;
}
const identityKey=n=>`${n.name}:${n.identity?.id||''}`;
export function relationshipLines(a,b,relation,_chapterLines,{random=Math.random}={}){
 const chapter=`${relation.from.code}.${relation.from.chap}`;
 const forward=PAIR_DIALOGUE.find(p=>p.chapter===chapter&&sameName(p.speaker,a.name)&&sameName(p.target,b.name));
 const reverse=PAIR_DIALOGUE.find(p=>p.chapter===chapter&&sameName(p.speaker,b.name)&&sameName(p.target,a.name));
 // Pick one shared variant for both speakers. Independent random picks made
 // otherwise related lines sound like two unrelated monologues.
 const variants=Math.max(forward?.lines?.length||0,reverse?.lines?.length||0,forward?.replyLines?.length||0,reverse?.replyLines?.length||0);
 const index=variants?Math.min(variants-1,Math.floor(random()*variants)):0;
 const choose=(entry,reply=false)=>reply?(entry?.replyLines?.[index]||entry?.replyLines?.[0]):(entry?.lines?.[index]||entry?.lines?.[0]);
 const contextualA=contextualLine(a,relation),contextualB=contextualLine(b,relation);
 const textA=forward?choose(forward):reverse?choose(reverse,true):contextualA;
 const textB=reverse?choose(reverse):forward?choose(forward,true):contextualB;
 // Standalone chapter monologues are intentionally excluded here: without a
 // scripted reply they are not a conversation. The encounter layer can still
 // show its ordinary greeting for people with no paired script.
 if(!textA||!textB)return [];
 return [
  {speaker:a,target:b,text:textA,entry:forward||reverse,ref:(forward||reverse)?.ref||relation.ref},
  {speaker:b,target:a,text:textB,entry:reverse||forward,ref:(reverse||forward)?.ref||relation.ref},
 ].map(({speaker,target,text,entry,ref})=>({
  id:`relationship:${identityKey(speaker)}:${chapter}`,speaker,target,text,
  ref,detailText:[relation.text,entry?.detail].filter(Boolean).join(' ') + ` (${relation.ref})`,kind:'pair',pairIndex:index,
 }));
}
