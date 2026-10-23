import fs from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {buildChapterDialogue,matchesMajor,MAJOR_DIALOGUE} from '../../js/features/pixel-bible/chapter-dialogue.js';
import {dialogueCandidates} from '../../js/features/pixel-bible/dialogue.js';
const require=createRequire(import.meta.url);const {BOOKS}=require('../../js/core/bible.js');
const root=fileURLToPath(new URL('../../',import.meta.url));
const majorHits=new Set(),stats={books:0,chapters:0,sourceLabelCount:0,characterOccurrences:0,authoredSoloOccurrences:0,chapterRoleOccurrences:0,ordinaryOnlyOccurrences:0,chapterRelationRecords:0,majorSets:MAJOR_DIALOGUE.length,majorSetsWithMatches:0},names=new Set();
const books=[];
for(const b of BOOKS){const raw=JSON.parse(fs.readFileSync(`${root}data/summary/${b.code}.json`));const report={code:b.code,chapters:0,characterOccurrences:0,authoredSoloOccurrences:0,chapterRoleOccurrences:0,ordinaryOnlyOccurrences:0,chapterRelationRecords:0};
 for(const [num,data] of Object.entries(raw.chapters)){
  const chapters=[{code:b.code,name:b.name,chap:Number(num),data}],context=buildChapterDialogue(chapters);report.chapters++;
  for(const p of context.people){names.add(p.name);report.characterOccurrences++;
   const n={name:p.name,identity:p.identity,role:p.role,refs:[p.ref],path:[],x:10,y:8};const lines=dialogueCandidates([n],chapters,context);
   if(!lines.length)throw Error(`No dialogue: ${p.name} ${b.code}.${num}`);
   if(lines.some(l=>l.kind==='solo'))report.authoredSoloOccurrences++;else if(lines.some(l=>l.kind==='context'))report.chapterRoleOccurrences++;else report.ordinaryOnlyOccurrences++;
   for(const entry of MAJOR_DIALOGUE)if(matchesMajor(entry,p.name,b.code,p.role,num))majorHits.add(entry.id);
  }
  report.chapterRelationRecords+=context.relations.length;
 }
 stats.books++;for(const key of ['chapters','characterOccurrences','authoredSoloOccurrences','chapterRoleOccurrences','ordinaryOnlyOccurrences','chapterRelationRecords'])stats[key]+=report[key];books.push(report);
}
stats.sourceLabelCount=names.size;stats.majorSetsWithMatches=majorHits.size;
if(majorHits.size!==MAJOR_DIALOGUE.length)throw Error('Unmatched major dialogue sets: '+MAJOR_DIALOGUE.filter(e=>!majorHits.has(e.id)).map(e=>e.label).join(','));
const output={schema:1,scope:'Counts are summary label occurrences, not unique biblical persons. Authored dialogue is imagined. Chapter role/relation text remains narrator commentary. Partial uploaded-reference review; see docs/pixel-bible-source-review.md.',stats,books};
const text=JSON.stringify(output,null,2)+'\n',file=`${root}data/pixel-bible/dialogue-coverage.json`;
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==text)throw Error('Coverage report is stale');}else fs.writeFileSync(file,text);
console.log(JSON.stringify(stats));
