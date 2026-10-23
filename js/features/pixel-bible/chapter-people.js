import {chapterCreatures,creatureForName} from './creatures.js';
// 관계도의 끝점도 빠뜨리지 않는다. 이름만 있는 대상은 관계 설명으로 보강한다.
export const isDivine=name=>/^(하나님|여호와|성령|주님)$/.test(name);
export function chapterPeople(data={},context={}) {
 const people=new Map((data.people||[]).filter(p=>p.name&&!isDivine(p.name)).map(p=>[p.name,{...p}]));
 for(const r of data.rels||[])for(const name of [r.from,r.to]){
  if(!name||isDivine(name)||people.has(name))continue;
  people.set(name,{name,weight:1,role:r.note||`${r.from} · ${r.to}: ${r.label||'본문의 관계'}`});
 }
 for(const p of chapterCreatures({...context,data})){if(!people.has(p.name))people.set(p.name,p);else if(creatureForName(p.name,people.get(p.name).role,context.code))Object.assign(people.get(p.name),{creature:p.creature,creatureRefs:p.creatureRefs});}
 return [...people.values()].map(p=>({...p,creature:p.creature||creatureForName(p.name,p.role,context.code)||undefined}));
}
