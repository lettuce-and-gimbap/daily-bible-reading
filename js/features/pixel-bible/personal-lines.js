import { chapterMonologues } from './context-monologues.js';
import {majorFor,occurrenceMatches} from './chapter-dialogue.js';
import {SOLO_DIALOGUE} from './solo-dialogue.js';
import {characterStyle} from './art.js';
const scopes={'바로':'exo.5','다리오':'dan.6','벤하닷':'1ki.20','요나단':'1sa.18','스가랴':'zec.4','아하시야':'2ki.1'};
// 본문 밖의 추상적인 공통 교훈을 덧붙이지 않고 현재 장의 역할·관계를 사용한다.
export function personalLines(n,chapters,context){
 const occurrences=context.people.filter(p=>occurrenceMatches(n,p));
 const style=characterStyle(n.name,0,n.role||'',n.refs||[]);
 const sources=new Set(chapters.map(c=>`${c.code}.${c.chap}`));
 const authored=majorFor(n,context)||(style.key!=='generic'&&(!scopes[style.name]||sources.has(scopes[style.name]))?SOLO_DIALOGUE[style.name]:null);
 const lines=[];
 const add=(text,ref,origin,emotion)=>{if(text&&!lines.some(l=>l.text===text))lines.push({text,ref,origin,emotion});};
 const currentLines=chapterMonologues(n,occurrences);
 for(const line of currentLines)add(line.text,line.ref,'authored',line.emotion);
 if(authored&&!currentLines.length)authored.lines.forEach(text=>add(text,authored.ref,'authored'));
 const ref=occurrences[0]?.ref||n.refs?.[0]||'';
 // 현재 장의 실제 역할과 관계를 독백 옆 참고 구절로 연결한다.
 const relation=context.relations.find(r=>occurrenceMatches(n,r.from)||occurrenceMatches(n,r.to));
 if(relation?.text) add(relation.text,relation.ref,'relationship-context');
 for(const p of occurrences){
  if(p.role)add(`${n.name}: ${p.role.replace(/[.。]$/,'')}.`,p.ref,'chapter-role');
 }
 for(const r of context.relations.filter(r=>occurrenceMatches(n,r.from)||occurrenceMatches(n,r.to)))add(r.text,r.ref,'relationship-context');
 // 이름만 기록된 인물은 허구의 업적이나 내면을 만들어 넣지 않는다.
 const detail=occurrences[0]?.role?.replace(/[.。]$/,'');
 if(lines.length<3&&detail){
  add(`${ref}에 기록된 ${n.name}의 역할: ${detail}.`,ref,'chapter-role');
  add(`${n.name}에 관한 기록: ${detail}.`,ref,'chapter-role');
 }
 if(lines.length<3)add(`${ref}에 ${n.name}의 이름이 기록되어 있다.`,ref,'chapter-role');
 if(lines.length<3)add(`${n.name}의 행적은 ${ref}에서 살펴볼 수 있다.`,ref,'chapter-role');
 return lines.slice(0,5).map((line,i)=>({...line,id:`personal:${n.identity?.id||n.name}:${ref}:${i}`,speaker:n,kind:line.origin==='authored'?'solo':'context'}));
}
