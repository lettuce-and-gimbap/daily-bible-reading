import {parseReference} from './references.js';
// All detail sections share the same identity and chapter evidence.
export function collectionDetails(record,profiles={}){
 const profile=profiles[record.identity?.id];
 if(!profile)return {known:false,books:[],roles:[],refs:[],firstEncounter:null,firstAppearance:null};
 const appearances=profile.appearances||[],valid=new Set(appearances.map(a=>`${a.code}.${a.chapter}`));
 const matches=raw=>{const r=parseReference(raw);return !!r&&valid.has(`${r.code}.${r.chapter}`);};
 const refs=[...new Set((record.refs||[]).filter(matches))];
 const books=new Map();for(const a of appearances){if(!books.has(a.code))books.set(a.code,{code:a.code,name:a.book,chapters:new Set()});books.get(a.code).chapters.add(a.chapter);}
 const ordered=[...books.values()].map(b=>({...b,chapters:[...b.chapters].sort((a,b)=>a-b)}));
 ordered.sort((a,b)=>b.chapters.length-a.chapters.length);
 const roles=[...new Map(appearances.filter(a=>a.role).map(a=>[a.role,{text:a.role,ref:`${a.book} ${a.chapter}장`}])).values()];
 return {known:true,books:ordered,roles,refs,firstEncounter:matches(record.firstRef)?record.firstRef:refs[0]||null,firstAppearance:appearances[0]?`${appearances[0].book} ${appearances[0].chapter}장`:null,matches};
}
