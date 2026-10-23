import {PAIR_DIALOGUE} from './pair-dialogue.js';
import {parseReference} from './references.js';
import {speechView} from './speech-view.js';

const sameName=(a,b)=>a===b||['예수','예수님'].includes(a)&&['예수','예수님'].includes(b);
const identityKey=n=>`${n.name}:${n.identity?.id||''}`;
function shortFallback(speaker,target,relation){
 const label=relation.label||'';
 if(/형제|자매|아들|딸|아내|남편|어머니|아버지|며느리|부부|동생|누이|조카|후손/.test(label))return `${target.name}, 우리 가족의 이 일을 어떻게 생각해요?`;
 if(/선지자|사도|말씀 전/.test(label))return `${target.name}, 네가 전한 말씀은 무엇이니?`;
 if(/왕|장관|군대|용사/.test(label))return `${target.name}, 이번 일을 어떻게 풀지 의논합시다.`;
 return `${target.name}, 내게 전할 말이 있소?`;
}
export function relationshipLines(a,b,relation,chapterLines,{random=Math.random}={}){
 return [a,b].map((speaker,i)=>{
  const target=i?a:b,chapter=`${relation.from.code}.${relation.from.chap}`;
  const authored=PAIR_DIALOGUE.find(p=>p.chapter===chapter&&sameName(p.speaker,speaker.name)&&sameName(p.target,target.name));
  const own=(chapterLines.get(identityKey(speaker))||[]).filter(l=>l.ref&&parseReference(l.ref)?.code===relation.from.code&&parseReference(l.ref)?.chapter===relation.from.chap);
  const ownLine=own.length?own[Math.floor(random()*own.length)]:null;
  const text=authored?authored.lines[Math.floor(random()*authored.lines.length)]:ownLine?.text||shortFallback(speaker,target,relation);
  return speechView({id:`relationship:${identityKey(speaker)}:${chapter}`,speaker,target,text,
   ref:authored?.ref||ownLine?.ref||relation.ref,
   detailText:[relation.text,authored?.detail].filter(Boolean).join(' ') + ` (${relation.ref})`,kind:'pair'});
 });
}
