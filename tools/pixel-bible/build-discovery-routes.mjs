import fs from 'node:fs';
import {createRequire} from 'node:module';
import {buildWorldModel} from '../../js/features/pixel-bible/world.js';
const {BOOKS}=createRequire(import.meta.url)('../../js/core/bible.js');
const routes={},profiles={};let chapters=0;
for(const book of BOOKS){const raw=JSON.parse(fs.readFileSync(`data/summary/${book.code}.json`));for(const [chapter,data]of Object.entries(raw.chapters)){
 chapters++;const model=buildWorldModel([{code:book.code,name:book.name,chap:Number(chapter),data}]);
 for(const p of model.cast){if(p.worldMascot||p.creature)continue;const id=p.identity?.id;if(!id)continue;(routes[id]||(routes[id]=[])).push(`${book.name} ${chapter}장`);
 const profile=profiles[id]||(profiles[id]={name:p.name,appearances:[]});profile.appearances.push({code:book.code,book:book.name,chapter:Number(chapter),role:p.role||''});}
}}
for(const id in routes)routes[id]=[...new Set(routes[id])];
fs.writeFileSync('data/pixel-bible/discovery-routes.json',JSON.stringify({chapters,routes,profiles})+'\n');
console.log(`${chapters} chapters, ${Object.keys(routes).length} identities, ${Object.values(routes).reduce((n,r)=>n+r.length,0)} routes`);
