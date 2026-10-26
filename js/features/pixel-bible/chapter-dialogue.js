import { chapterPeople } from './chapter-people.js';
import { resolveIdentity } from './identity.js';
import { MAJOR_DIALOGUE } from './major-dialogue.js';
import { PAIR_DIALOGUE } from './pair-dialogue.js';

export { MAJOR_DIALOGUE };
export function matchesMajor(entry,name,code,role='',chapter=0) {
 return entry.name===name&&entry.books.includes(code)&&(!entry.chapterRules?.[code]||entry.chapterRules[code].includes(Number(chapter)))&&(!entry.chapters||entry.chapters.includes(`${code}.${chapter}`))&&(entry.rolePattern==='*'||new RegExp(entry.rolePattern).test(role));
}
// 역할과 관계 자료는 발언으로 둔갑시키지 않고 본문 해설로 표시한다.
export function buildChapterDialogue(chapters) {
 const people=[],relations=[];
 for(const c of chapters){
  const ref=`${c.name||c.code} ${c.chap}${c.code==='psa'?'편':'장'}`;
  for(const p of chapterPeople(c.data,c)){
   if(/^(하나님|여호와|성령|주님)$/.test(p.name))continue;
   const identity=resolveIdentity(p.name,{code:c.code,chapter:c.chap,role:p.role||''});
   people.push({name:p.name,code:c.code,chap:c.chap,identity,role:p.role||'',ref,text:p.role?`이 장의 ${p.name}: ${p.role.replace(/[.。]$/,'')}.`:''});
  }
  for(const r of c.data?.rels||[]){
   const from=people.find(p=>p.code===c.code&&p.chap===c.chap&&p.name===r.from),to=people.find(p=>p.code===c.code&&p.chap===c.chap&&p.name===r.to);
   if(!from||!to)continue;
   relations.push({from,to,label:r.label||'',kind:r.kind||'other',verses:r.verses||'',text:r.note||`${r.from} → ${r.to}: ${r.label||'본문에서 관련된 인물'}.`,ref:`${c.name||c.code} ${c.chap}${r.verses?':'+r.verses:''}`});
  }
 }
 // A scripted, source-linked exchange itself establishes a valid interaction
 // edge when the chapter's general relationship index omits the pair.
 for(const entry of PAIR_DIALOGUE){
  const [code,chapter]=entry.chapter.split('.');
  const from=people.find(p=>p.code===code&&p.chap===Number(chapter)&&p.name===entry.speaker);
  const to=people.find(p=>p.code===code&&p.chap===Number(chapter)&&p.name===entry.target);
  if(!from||!to||relations.some(r=>r.from===from&&r.to===to||r.from===to&&r.to===from))continue;
  relations.push({from,to,text:entry.detail||`${entry.speaker}와 ${entry.target}의 본문 대화.`,ref:entry.ref,scriptedPair:true});
 }
 return {people,relations};
}
export function occurrenceMatches(n,p) {
 return n.name===p.name&&(!n.identity||n.identity.id===p.identity.id);
}
export function majorFor(n,contexts) {
 const occurrences=contexts.people.filter(p=>occurrenceMatches(n,p));
 for(const p of occurrences){const entry=MAJOR_DIALOGUE.find(e=>matchesMajor(e,n.name,p.code,p.role,p.chap));if(entry)return entry;}
 return null;
}
