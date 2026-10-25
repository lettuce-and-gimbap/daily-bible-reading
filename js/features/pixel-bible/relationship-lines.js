import {PAIR_DIALOGUE} from './pair-dialogue.js';
import {parseReference} from './references.js';

const sameName=(a,b)=>a===b||['예수','예수님'].includes(a)&&['예수','예수님'].includes(b);
function contextualLine(speaker,relation){
 if(relation.from.code==='neh'&&relation.from.chap===3){
  if(speaker.name==='하눈')return '골짜기 문을 세웠어. 성벽도 이어서 수리해야겠어.';
  if(speaker.name==='살룬')return '샘문을 수리했어. 문짝과 빗장도 튼튼히 달았지.';
 }
 return null;
}
const identityKey=n=>`${n.name}:${n.identity?.id||''}`;
export function relationshipLines(a,b,relation,chapterLines,{random=Math.random}={}){
 return [a,b].map((speaker,i)=>{
  const target=i?a:b,chapter=`${relation.from.code}.${relation.from.chap}`;
  const authored=PAIR_DIALOGUE.find(p=>p.chapter===chapter&&sameName(p.speaker,speaker.name)&&sameName(p.target,target.name));
  const own=(chapterLines.get(identityKey(speaker))||[]).filter(l=>l.ref&&parseReference(l.ref)?.code===relation.from.code&&parseReference(l.ref)?.chapter===relation.from.chap);
  const ownLine=own.length?own[Math.floor(random()*own.length)]:null;
  const text=authored?authored.lines[Math.floor(random()*authored.lines.length)]:ownLine?.text||contextualLine(speaker,relation);
  if(!text)return null;
  return {id:`relationship:${identityKey(speaker)}:${chapter}`,speaker,target,text,
   ref:authored?.ref||ownLine?.ref||relation.ref,
   detailText:[relation.text,authored?.detail].filter(Boolean).join(' ') + ` (${relation.ref})`,kind:'pair'};
 }).filter(Boolean);
}
