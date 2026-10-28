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
 for(const scene of model.scenes||[])if(scene.actors.includes(person.name)&&person.refs.some(raw=>{const r=parseReference(raw);return r?.code===scene.code&&r.chapter===scene.chapter;}))stories.push({text:short(scene.study),ref:scene.ref});
 for(const r of relations)if(r.note)stories.push({text:r.note,ref:r.ref});
 return {key:discoveryKey(person),name:person.name,identity:person.identity,roles:person.role?[short(person.role)]:[],refs:person.refs||[],relations,stories:[...new Map(stories.filter(s=>parseReference(s.ref)?.verses?.length).map(s=>[s.ref+'|'+s.text,s])).values()]};
}
export function mergeDiscovery(previous,snapshot,date=kstDate()){
 const unique=(a,b,key)=>[...new Map([...a,...b].map(x=>[key(x),x])).values()];
 return {...snapshot,roles:[...new Set([...(previous?.roles||[]),...snapshot.roles])],refs:[...new Set([...(previous?.refs||[]),...snapshot.refs])],relations:unique(previous?.relations||[],snapshot.relations,r=>r.key+'|'+r.label+'|'+r.ref),stories:unique(previous?.stories||[],snapshot.stories,s=>s.ref+'|'+s.text),days:[...new Set([...(previous?.days||[]),date])],read:previous?.read||[],favorite:!!previous?.favorite,firstSeen:previous?.firstSeen||date};
}
export const storyKey=story=>story.ref+'|'+story.text;
export function learningStage(record,records){
 if(!record)return 0;
 const read=(record.read||[]).length,neighbor=!record.relations.length||record.relations.some(r=>records[r.key]);
 return read>=2&&record.days.length>=2&&neighbor?4:read>=1&&neighbor?3:read>=1?2:1;
}
export function markStoryRead(record,story){const id=storyKey(story);if(!record.stories.some(s=>storyKey(s)===id))return record;return {...record,read:[...new Set([...record.read,id])]};}
export function loadDiscoveries(storage){try{const raw=JSON.parse(storage.getItem(DISCOVERY_KEY)||'{}');if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
 const moved=[['unresolved:아브람','person:아브라함','아브라함'],['unresolved:사래','person:사라','사라'],['unresolved:르우엘:exo','person:midianite-priest-jethro','이드로'],['unresolved:이드로:exo','person:midianite-priest-jethro','이드로'],['person:이드로','person:midianite-priest-jethro','이드로']];
 for(const [oldKey,key,name]of moved)if(raw[oldKey]){const old=raw[oldKey],current=raw[key]||{};raw[key]={...old,...current,key,name,roles:[...new Set([...(old.roles||[]),...(current.roles||[])])],refs:[...new Set([...(old.refs||[]),...(current.refs||[])])],relations:[...new Map([...(old.relations||[]),...(current.relations||[])].map(x=>[x.key+'|'+x.label+'|'+x.ref,x])).values()],stories:[...new Map([...(old.stories||[]),...(current.stories||[])].map(x=>[x.ref+'|'+x.text,x])).values()],days:[...new Set([...(old.days||[]),...(current.days||[])])],read:[...new Set([...(old.read||[]),...(current.read||[])])],favorite:!!(old.favorite||current.favorite),firstSeen:[old.firstSeen,current.firstSeen].filter(Boolean).sort()[0]};delete raw[oldKey];}
 return raw;}catch(_){return {};}}

export function learningNext(record,records){
 if(!record)return '월드에서 인물을 눌러 첫 만남을 기록해요.';
 if(!record.read.length)return record.stories.length?'이야기 하나를 읽고 관련 구절을 살펴보세요.':'다른 본문에서 다시 만나 이야기를 모아 보세요.';
 if(record.relations.length&&!record.relations.some(r=>records[r.key]))return '한 다리 주변 인물 중 1명을 월드에서 만나 보세요.';
 if(record.read.length<2)return record.stories.length<2?'다른 본문에서 다시 만나 새 이야기를 모아 보세요.':'아직 읽지 않은 이야기를 하나 더 읽어 보세요.';
 if(record.days.length<2)return '다른 날 다시 만나면 깊이 알아가기 단계가 열려요. (한국 시간 기준)';
 return '깊이 알아가기 완료! 다른 본문에서도 만나 관계와 이야기를 계속 모아 보세요.';
}
