import {castKey} from './cast-state.js';
import {recommendedCast} from './exposure.js';
import {parseReference} from './references.js';
export const discoveryKey=p=>p.identity?.kind==='person'?p.identity.id:castKey(p);
export const DISCOVERY_KEY='pixel-bible-discoveries:v1';
export const kstDate=(date=new Date())=>new Date(date.getTime()+9*3600000).toISOString().slice(0,10);
const mentions=(text,name)=>new RegExp('(^|[\\s,·(“‘])'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=[은는이가을를와과의에께]|\\s|[.,!?“”‘’]|$)','u').test(String(text||''));
export function importanceFor(model,person){
 const peers=recommendedCast(model,person),refs=(person.refs||[]).map(parseReference).filter(Boolean);
 const events=(model.events||[]).filter(e=>{const ref=parseReference(e.ref);return ref&&refs.some(r=>r.code===ref.code&&r.chapter===ref.chapter)&&(e.actors?.includes(person.name)||mentions(e.text,person.name));});
 return {connections:peers.length,events:events.length,score:peers.length*2+Math.min(4,events.length)+Math.min(2,Math.max(0,(person.weight||1)-1))};
}
export function prominentKeys(model){return new Set(model.cast.filter(p=>!p.creature).map(p=>({key:castKey(p),...importanceFor(model,p)})).filter(p=>p.score>=3).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key)).slice(0,3).map(p=>p.key));}
const short=text=>{const raw=String(text||'').replace(/\s+/g,' ').trim(),brief=(raw.match(/[^.!?。]+[.!?。]*/gu)||[]).slice(0,2).join('').trim();return brief.length<=240?brief:brief.slice(0,237).replace(/\s+\S*$/u,'')+'…';};
export function discoverySnapshot(person,model){
 const peers=recommendedCast(model,person),relations=[];
 for(const {person:other}of peers)for(const r of model.relations.filter(r=>(r.from===person.name&&r.to===other.name||r.to===person.name&&r.from===other.name)&&(!r.sourceRef||person.refs.includes(r.sourceRef)&&other.refs.includes(r.sourceRef))))relations.push({key:discoveryKey(other),name:other.name,label:r.label||'본문 관계',kind:r.kind||'other',from:r.from,to:r.to,note:short(r.note),ref:r.ref||r.sourceRef});
 const stories=(model.events||[]).filter(e=>mentions(e.text,person.name)&&person.refs.some(raw=>{const a=parseReference(raw),b=parseReference(e.ref);return a&&b&&a.code===b.code&&a.chapter===b.chapter;})).map(e=>({text:short(e.text),ref:e.ref}));
 for(const r of relations)if(r.note)stories.push({text:r.note,ref:r.ref});
 return {key:discoveryKey(person),name:person.name,identity:person.identity,roles:person.role?[short(person.role)]:[],refs:person.refs||[],relations,stories:[...new Map(stories.filter(s=>parseReference(s.ref)?.verses?.length).map(s=>[s.ref+'|'+s.text,s])).values()]};
}
export function mergeDiscovery(previous,snapshot,date=kstDate()){
 const unique=(a,b,key)=>[...new Map([...a,...b].map(x=>[key(x),x])).values()];
 return {...snapshot,roles:[...new Set([...(previous?.roles||[]),...snapshot.roles])],refs:[...new Set([...(previous?.refs||[]),...snapshot.refs])],relations:unique(previous?.relations||[],snapshot.relations,r=>r.key+'|'+r.label+'|'+r.ref),stories:unique(previous?.stories||[],snapshot.stories,s=>s.ref+'|'+s.text),days:[...new Set([...(previous?.days||[]),date])],read:previous?.read||[],firstSeen:previous?.firstSeen||date};
}
export const storyKey=story=>story.ref+'|'+story.text;
export function learningStage(record,records){
 if(!record)return 0;
 const read=(record.read||[]).length,neighbor=!record.relations.length||record.relations.some(r=>records[r.key]);
 return read>=2&&record.days.length>=2&&neighbor?4:read>=1&&neighbor?3:read>=1?2:1;
}
export function markStoryRead(record,story){const id=storyKey(story);if(!record.stories.some(s=>storyKey(s)===id))return record;return {...record,read:[...new Set([...record.read,id])]};}
export function loadDiscoveries(storage){try{const raw=JSON.parse(storage.getItem(DISCOVERY_KEY)||'{}');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};}catch(_){return {};}}
