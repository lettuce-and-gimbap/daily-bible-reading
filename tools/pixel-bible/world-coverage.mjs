import fs from 'node:fs';
import {createRequire} from 'node:module';
import {buildWorldModel,visibleWorldCast} from '../../js/features/pixel-bible/world.js';
import {buildChapterDialogue} from '../../js/features/pixel-bible/chapter-dialogue.js';
import {dialogueCandidates} from '../../js/features/pixel-bible/dialogue.js';
import {chapterPeople} from '../../js/features/pixel-bible/chapter-people.js';
const {BOOKS}=createRequire(import.meta.url)('../../js/core/bible.js');
let chapters=0,people=0,relations=0,large=0;
for(const book of BOOKS){
 const raw=JSON.parse(fs.readFileSync(new URL(`../../data/summary/${book.code}.json`,import.meta.url)));
 for(const [chap,data] of Object.entries(raw.chapters)){
  const input=[{code:book.code,name:book.name,chap:Number(chap),data}],model=buildWorldModel(input),context=buildChapterDialogue(input);
  chapters++;if(model.cast.length>10)large++;
  for(const p of chapterPeople(data)){
   const index=model.cast.findIndex(n=>n.name===p.name);if(index<0)throw Error(`Missing cast ${book.code}.${chap}: ${p.name}`);
   const visible=visibleWorldCast(model,index);if(visible[0].name!==p.name)throw Error('Focus missing');
   const npc={...visible[0],x:10,y:8,path:[]};
   if(!dialogueCandidates([npc],input,context).length)throw Error(`Missing speech ${book.code}.${chap}: ${p.name}`);
   people++;
  }
  for(const r of context.relations){
   const a=model.cast.find(n=>n.name===r.from.name&&n.identity?.id===r.from.identity.id),b=model.cast.find(n=>n.name===r.to.name&&n.identity?.id===r.to.identity.id);
   if(!a||!b)throw Error(`Missing relation endpoint ${book.code}.${chap}`);
   if(a===b)continue;
   const candidates=dialogueCandidates([{...a,x:10,y:8,path:[]},{...b,x:12,y:8,path:[]}],input,context);
   if(!candidates.some(c=>c.target&&c.ref.startsWith(book.name+' '+chap)))throw Error(`Missing interaction ${book.code}.${chap}: ${a.name}/${b.name}`);
   relations++;
  }
 }
}
if(chapters!==1189)throw Error('Incomplete canon');
console.log(JSON.stringify({books:BOOKS.length,chapters,characterOccurrences:people,interactions:relations,chaptersOverTenPeople:large}));
