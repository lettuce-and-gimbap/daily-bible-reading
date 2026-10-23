import fs from 'node:fs';
import {CREATURES,chapterCreatures} from '../../js/features/pixel-bible/creatures.js';
const root=new URL('../../',import.meta.url),books={};let mentions=0,chapters=0;
for(const file of fs.readdirSync(new URL('data/summary/',root)).filter(f=>f.endsWith('.json')).sort()){
 const raw=JSON.parse(fs.readFileSync(new URL('data/summary/'+file,root)));const code=file.replace('.json','');
 books[code]={};for(const [chap,data]of Object.entries(raw.chapters)){
  const entries=chapterCreatures({code,name:raw.name||raw.book||code,chap:Number(chap),data});chapters++;
  if(entries.length){books[code][chap]=entries.map(p=>({id:p.creature.id,refs:p.creatureRefs}));mentions+=entries.length;}
 }
}
const output={schema:1,scope:'Creatures mentioned in existing public chapter summaries, including figurative references. This is not an exhaustive inventory of the biblical text. Speech is disabled except reviewed Genesis 3 snake and Numbers 22 donkey passages.',stats:{books:Object.keys(books).length,chapters,definitions:Object.keys(CREATURES).length,mentions},definitions:CREATURES,books};
const text=JSON.stringify(output,null,2)+'\n',path=new URL('data/pixel-bible/creatures.json',root);
if(process.argv.includes('--check')){if(fs.readFileSync(path,'utf8')!==text)throw Error('Creature catalog is stale');}else fs.writeFileSync(path,text);
console.log(JSON.stringify(output.stats));
