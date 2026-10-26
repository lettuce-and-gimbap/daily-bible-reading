import {roleMonologues} from './role-monologues.js';
import {creatureSpeech} from './creatures.js';
import { chapterMonologues } from './context-monologues.js';
import {majorFor,occurrenceMatches} from './chapter-dialogue.js';
import {SOLO_DIALOGUE} from './solo-dialogue.js';
import {characterStyle} from './art.js';
import {parseReference} from './references.js';
// 본문 밖의 추상적인 공통 교훈을 덧붙이지 않고 현재 장의 역할·관계를 사용한다.
export function firstPersonMonologue(name,text){
 let line=String(text||'').trim();if(!line)return line;
 const escaped=String(name||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 if(escaped){
  line=line.replace(new RegExp(`아버지\\s+${escaped}의`,'gu'),'내 아버지의').replace(new RegExp(`어머니\\s+${escaped}의`,'gu'),'내 어머니의');
  line=line.replace(new RegExp(`${escaped}(은|는|께서는)`,'gu'),'나는').replace(new RegExp(`${escaped}(이|가|께서)`,'gu'),'내가');
  line=line.replace(new RegExp(`${escaped}의`,'gu'),'내');
 }
 line=line.replace(/^아버지\s+[^\s]+의 뒤를 이어/u,'내 아버지의 뒤를 이어').replace(/^어머니\s+[^\s]+의 뒤를 이어/u,'내 어머니의 뒤를 이어');
 line=line.replace(/^(그녀는|그는|그 사람은|그녀가|그가|그 사람이)/u,match=>/는|은/.test(match)?'나는':'내가');
 if(!/(?:나는|내가|저는|제가)/u.test(line)){
  const kingship=line.match(/^(.*?)(?:(이스라엘|유다)\s+)?왕이 되(?:었|었어|었구나|었다)([.!?]?)$/u);
  if(kingship)line=`${kingship[1]}내가 ${kingship[2]?kingship[2]+' ':''}왕이 되었어${kingship[3]}`;
 }
 return line;
}
export function personalLines(n,chapters,context){
 if(n.creature)return creatureSpeech(n,chapters);
 const occurrences=context.people.filter(p=>occurrenceMatches(n,p));
 const style=characterStyle(n.name,0,n.role||'',n.refs||[]);
 const sources=new Set(chapters.map(c=>`${c.code}.${c.chap}`));
 const includesTwoKings=[...sources].some(source=>source.startsWith('2ki.'));
 const solo=SOLO_DIALOGUE[style.name],soloReference=parseReference(solo?.ref||'');
 const soloAllowed=!!soloReference&&sources.has(`${soloReference.code}.${soloReference.chapter}`);
 const authored=majorFor(n,context)||(style.key!=='generic'&&soloAllowed?solo:null);
 const lines=[];
 const add=(text,ref,origin,emotion)=>{if(text&&!lines.some(l=>l.text===text))lines.push({text,ref,origin,emotion});};
 const currentLines=chapterMonologues(n,occurrences);
 for(const line of currentLines)add(line.text,line.ref,'authored',line.emotion);
 if(authored&&!currentLines.length)authored.lines.forEach(text=>add(text,authored.ref,'authored'));
 const ref=occurrences[0]?.ref||n.refs?.[0]||'';
 // 현재 장의 실제 역할과 관계를 독백 옆 참고 구절로 연결한다.
 const relation=context.relations.find(r=>occurrenceMatches(n,r.from)||occurrenceMatches(n,r.to));
 // 열왕기하 사건 인물은 인물별 기록이 없으면 직업군 공통 독백을 붙이지 않는다.
 if(!lines.length&&!includesTwoKings)for(const line of roleMonologues(n,occurrences,relation))add(line.text,line.ref,line.origin,line.emotion);
 const authoredLines=lines.filter(line=>line.origin==='authored');
 // 여러 장을 읽는 범위에서는 뒤쪽 사건의 인물별 발화도 후보에 남긴다.
 return (authoredLines.length?authoredLines:lines).map((line,i)=>({...line,text:firstPersonMonologue(n.name,line.text),detailText:line.origin==='authored'?(relation?.text||''):[relation?.text,...occurrences.map(p=>p.role)].filter(Boolean).join(' '),id:`personal:${n.identity?.id||n.name}:${line.ref||ref}:${i}`,speaker:n,kind:'solo'}));
}
