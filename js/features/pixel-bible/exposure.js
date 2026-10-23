import {castKey} from './cast-state.js';
export const exposureStorageKey=key=>`pixel-bible-cast:${key}`;
export function majorCast(model){
 const sceneNames=new Set((model.scenes||[]).flatMap(s=>s.actors));
 const degree=new Map();for(const r of model.relations||[])for(const name of [r.from,r.to])degree.set(name,(degree.get(name)||0)+1);
 const major=model.cast.filter(p=>(p.weight||1)>=2||sceneNames.has(p.name)||(degree.get(p.name)||0)>=2);
 return major.length?major:model.cast.slice(0,Math.min(6,model.cast.length));
}
export function recommendedCast(model,person){
 const links=model.relations.filter(r=>(r.from===person.name||r.to===person.name)&&(!r.sourceRef||person.refs?.includes(r.sourceRef)));
 const recommendations=new Map();
 for(const r of links){const name=r.from===person.name?r.to:r.from;
  for(const p of model.cast.filter(p=>p.name===name&&castKey(p)!==castKey(person)&&(!r.sourceRef||p.refs?.includes(r.sourceRef)))){
   if(!recommendations.has(castKey(p)))recommendations.set(castKey(p),{person:p,label:r.label||'본문 관계',ref:r.ref||r.sourceRef||''});
  }
 }
 return [...recommendations.values()];
}
