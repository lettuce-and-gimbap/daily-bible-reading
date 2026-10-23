import {roleMonologues} from './role-monologues.js';
import {creatureSpeech} from './creatures.js';
import { chapterMonologues } from './context-monologues.js';
import {majorFor,occurrenceMatches} from './chapter-dialogue.js';
import {SOLO_DIALOGUE} from './solo-dialogue.js';
import {characterStyle} from './art.js';
const scopes={'바로':'exo.5','다리오':'dan.6','벤하닷':'1ki.20','요나단':'1sa.18','스가랴':'zec.4','아하시야':'2ki.1'};
// 본문 밖의 추상적인 공통 교훈을 덧붙이지 않고 현재 장의 역할·관계를 사용한다.
export function personalLines(n,chapters,context){
 if(n.creature)return creatureSpeech(n,chapters);
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
 if(!lines.length)for(const line of roleMonologues(n,occurrences,relation))add(line.text,line.ref,line.origin,line.emotion);
 const authoredLines=lines.filter(line=>line.origin==='authored');
 return (authoredLines.length?authoredLines:lines).slice(0,5).map((line,i)=>({...line,detailText:line.origin==='authored'?(relation?.text||''):[relation?.text,...occurrences.map(p=>p.role)].filter(Boolean).join(' '),id:`personal:${n.identity?.id||n.name}:${ref}:${i}`,speaker:n,kind:'solo'}));
}
