import {UNIQUE_INTERACTIONS} from '../../js/features/pixel-bible/unique-interactions.js';
import {INTERACTION_MOTIONS,INTERACTION_MOTION_COUNT,interactionOptions,interactionRoutine} from '../../js/features/pixel-bible/interaction-motion.js';
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
write('../interaction-motions.json',{schema:1,scope:`${INTERACTION_MOTION_COUNT} reusable motion prototypes; at least six outcomes per catalog object, selected across repeated visits. 100 appearance profiles on 156 objects. Explicit biblical actions are chapter- and identity-scoped. Daily motions are creative.`,prototypes:INTERACTION_MOTIONS,options:Object.fromEntries(Object.keys(OBJECT_CATALOG).map(kind=>[kind,interactionOptions(kind)])),unique:UNIQUE_INTERACTIONS,characters:bindings});
