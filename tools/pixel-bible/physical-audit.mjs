import fs from 'node:fs';
import {resolveIdentity} from '../../js/features/pixel-bible/identity.js';
import {appearanceFor} from '../../js/features/pixel-bible/appearance.js';
import {PHYSICAL_TRAITS} from '../../js/features/pixel-bible/physical-traits.js';
import {chapterPeople} from '../../js/features/pixel-bible/chapter-people.js';
import {BOOKS} from '../../js/core/bible.js';
const byCode=new Map(BOOKS.map(b=>[b.code,b.name])),people=new Map();
for(const file of fs.readdirSync('data/summary').filter(f=>f.endsWith('.json'))){const d=JSON.parse(fs.readFileSync('data/summary/'+file));for(const [chap,c]of Object.entries(d.chapters||{}))for(const p of chapterPeople(c,{code:d.book,chap:Number(chap)})){const name=typeof p==='string'?p:p.name;if(!name)continue;const role=p.role||'',identity=resolveIdentity(name,{code:d.book,chapter:Number(chap),role}),key=identity.id;if(!people.has(key))people.set(key,{id:key,name,kind:identity.kind,occurrences:[],traits:new Set()});const row=people.get(key),ref=`${byCode.get(d.book)} ${chap}장`,style=appearanceFor(name,0,role,[ref]);row.occurrences.push(`${d.book}.${chap}`);if(style.physicalEvidence)row.traits.add(style.physicalEvidence);}}
const rows=[...people.values()].map(p=>({...p,occurrences:[...new Set(p.occurrences)],traits:[...p.traits],status:p.traits.size?'contextual-traits':p.kind==='person'?'existing-or-designed-appearance':'group-or-unresolved'}));
fs.writeFileSync('data/pixel-bible/physical-audit.json',JSON.stringify({date:'2026-10-24',rules:PHYSICAL_TRAITS.length,entries:rows},null,2)+'\n');console.log(JSON.stringify({entries:rows.length,people:rows.filter(r=>r.kind==='person').length,withTraits:rows.filter(r=>r.traits.length).length,rules:PHYSICAL_TRAITS.length}));
