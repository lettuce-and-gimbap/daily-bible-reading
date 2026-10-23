import {sceneDecorations} from '../../js/features/pixel-bible/landscape.js';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {BACKGROUNDS,BACKGROUND_CONTEXTS,defaultBackground} from '../../js/features/pixel-bible/backgrounds.js';
const {BOOKS}=createRequire(import.meta.url)('../../js/core/bible.js');
const chapters={};let matched=0,total=0;
for(const book of BOOKS){
 const raw=JSON.parse(fs.readFileSync(new URL(`../../data/summary/${book.code}.json`,import.meta.url)));
 chapters[book.code]={};for(const num of Object.keys(raw.chapters)){
  const key=defaultBackground([{code:book.code,chap:Number(num)}]);chapters[book.code][num]=key;total++;if(key!=='meadow')matched++;
 }
}
const out={schema:1,scope:'20 illustrative terrain designs, with explicit chapter matches for described settings and meadow fallback. Not geographic reconstructions. No private commentary source text.',stats:{designs:Object.keys(BACKGROUNDS).length,books:BOOKS.length,chapters:total,chaptersWithContext:matched},definitions:BACKGROUNDS,decorations:Object.fromEntries(Object.keys(BACKGROUNDS).map(key=>[key,sceneDecorations(key)])),rules:BACKGROUND_CONTEXTS,chapters};
const text=JSON.stringify(out,null,2)+'\n',file=new URL('../../data/pixel-bible/backgrounds.json',import.meta.url);
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==text)throw Error('Stale background catalog');}else fs.writeFileSync(file,text);
console.log(JSON.stringify(out.stats));
