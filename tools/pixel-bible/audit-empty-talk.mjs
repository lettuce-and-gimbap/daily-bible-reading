import fs from 'node:fs';
import {buildWorldModel} from '../../js/features/pixel-bible/world.js';
import {buildChapterDialogue} from '../../js/features/pixel-bible/chapter-dialogue.js';
import {loveBoothExchange} from '../../js/features/pixel-bible/relationship-lines.js';
const codes='gen exo lev num deu jos jdg rut 1sa 2sa 1ki 2ki 1ch 2ch ezr neh est job psa pro ecc sng isa jer lam ezk dan hos jol amo oba jnh mic nam hab zep hag zec mal'.split(' '),bad=[];let checked=0;
for(const code of codes){const book=JSON.parse(fs.readFileSync(`data/summary/${code}.json`));let talk={};try{talk=JSON.parse(fs.readFileSync(`data/pixel-bible/relation-talk/${code}.json`)).talk}catch{}for(const [ch,data] of Object.entries(book.chapters)){const d={...data,rels:(data.rels||[]).map(r=>({...r,talk:talk[`${ch}|${r.from}|${r.to}`]}))};const chapters=[{code,name:code,chap:Number(ch),data:d}],m=buildWorldModel(chapters),ctx=buildChapterDialogue(chapters);for(const r of m.relations){const a=m.cast.find(n=>n.name===r.from),b=m.cast.find(n=>n.name===r.to);if(!a||!b||a===b)continue;checked++;if(loveBoothExchange(a,b,ctx.relations).mode==='awkward')bad.push({code,ch,from:a.name,to:b.name,rel:r});}}}
console.log(JSON.stringify({books:codes.length,visibleRelationships:checked,awkwardLinkedPairs:bad.length},null,2));
if(bad.length){console.log(bad.map(({code,ch,from,to})=>({code,ch,from,to})));process.exitCode=1;}
