import {INTERACTION_MOTIONS,interactionRoutine} from '../../js/features/pixel-bible/interaction-motion.js';
import {APPEARANCES} from '../../js/features/pixel-bible/appearance.js';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {OBJECT_CATALOG,chapterObjects} from '../../js/features/pixel-bible/object-catalog.js';
const {BOOKS}=createRequire(import.meta.url)('../../js/core/bible.js');
const root=new URL('../../data/pixel-bible/objects/',import.meta.url);let count=0,events=0,withObjects=0;const kinds=new Set();
const write=(name,data)=>{const text=JSON.stringify(data,null,2)+'\n';if(process.argv.includes('--check')){if(fs.readFileSync(new URL(name,root),'utf8').replace(/\r\n/g,'\n')!==text)throw Error('Stale '+name);}else fs.writeFileSync(new URL(name,root),text);};
for(const book of BOOKS){
 const raw=JSON.parse(fs.readFileSync(new URL(`../../data/summary/${book.code}.json`,import.meta.url))),chapters={};
 for(const [chap,data] of Object.entries(raw.chapters)){
  const items=chapterObjects({code:book.code,name:book.name,chap:Number(chap),data});chapters[chap]=items;
  count++;if(items.length)withObjects++;events+=items.length;items.forEach(i=>kinds.add(i.id));
 }
 write(book.code+'.json',{schema:1,book:book.code,chapters});
}
write('catalog.json',{schema:1,scope:'Candidates extracted from existing public chapter/event summaries. Verse ranges are summary scopes, not verified exact verse mentions. Not an exhaustive inventory of the biblical text. Private commentary is excluded.',stats:{books:66,chapters:count,definitions:Object.keys(OBJECT_CATALOG).length,matchedDefinitions:kinds.size,chaptersWithObjects:withObjects,occurrences:events},definitions:OBJECT_CATALOG});
console.log(JSON.stringify({books:66,chapters:count,definitions:Object.keys(OBJECT_CATALOG).length,matchedDefinitions:kinds.size,chaptersWithObjects:withObjects,occurrences:events}));

const bindings=Object.fromEntries(Object.values(APPEARANCES).map(p=>[p.key||p.name,{name:p.name,objects:Object.fromEntries(Object.keys(OBJECT_CATALOG).map(kind=>{const r=interactionRoutine({name:p.name},kind);return [kind,{routine:r.id,variant:r.variant,period:r.period,phase:r.phase}];}))}]));
write('../interaction-motions.json',{schema:1,scope:'116 reusable motion prototypes, four time phases; name-specific bindings for 100 appearance profiles on all 156 catalog objects. Object behavior determines actual props, safe approaches and fixed structures. Motion variants are creative unless a scoped biblical action overrides them.',prototypes:INTERACTION_MOTIONS,characters:bindings});
