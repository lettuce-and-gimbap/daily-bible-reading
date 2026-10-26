import fs from 'node:fs';
import {EVENT_ACTIONS} from '../../../js/features/pixel-bible/event-animation/timeline.js';

const summary=JSON.parse(fs.readFileSync(new URL('../../../data/summary/jas.json',import.meta.url),'utf8'));
const counts={1:27,2:26,3:18,4:17,5:20};
const rules=[
 [/시험|인내|시련|온전|지혜|구하/,['startle','kneel','pray','wait','stand','bless'],'pray'],
 [/가난|부자|차별|옷|자리|긍휼/,['look','gather','signal','extend','receive','bless'],'welcome'],
 [/행함|믿음|아브라함|라합|행하/,['read','listen','stand','walk','show','bless'],'report'],
 [/혀|말|불|샘|지혜|다툼/,['speak','signal','turn','listen','show','lower'],'counsel'],
 [/정욕|세상|교만|악|마귀|겸손/,['turn','retreat','kneel','pray','resist','stand'],'warn'],
 [/부자|재물|품삯|추수|부르짖/,['count','weigh','gather','extend','pray','wait'],'judge'],
 [/병|기름|기도|엘리야|죄|고백|구원/,['sit','reach','anoint-head','pray','rise','bless'],'pray']
];
const chapters={},additionalPeople={};
for(const [chapter,content] of Object.entries(summary.chapters)){
 const ranges=(content.events||[]).map(event=>{const [,lo,hi='']=event.verses.match(/^(\d+)(?:-(\d+))?$/)||[];return{event,lo:Number(lo||1),hi:Number(hi||lo||1)};});
 const sentences=content.story.split(/(?<=[.!?요])\s+/u).filter(Boolean);
 chapters[chapter]=Array.from({length:counts[chapter]},(_,i)=>{
  const verse=i+1,entry=ranges.find(r=>verse>=r.lo&&verse<=r.hi)||ranges.at(-1),event=entry.event;
  const sentence=sentences[(verse-1)%Math.max(1,sentences.length)]||content.line;
  const words=sentence.split(/\s+/u),local=verse-entry.lo,span=entry.hi-entry.lo+1;
  const start=Math.floor(local*words.length/span),end=Math.max(start+1,Math.floor((local+1)*words.length/span));
  const phrase=words.slice(start,end).join(' ').replace(/[“”]/gu,'').trim();
  const text=`${phrase} ${event.text}`.replace(/\s+/gu,' ').trim();
  const rule=rules.find(([pattern])=>pattern.test(`${event.title} ${text}`))||[/./,['read','speak','listen','walk','pray','bless'],'counsel'];
  const actors=['야고보','흩어진 성도들'];
  for(const person of content.people||[])if(text.includes(person.name)&&!actors.includes(person.name)&&actors.length<4)actors.push(person.name);
  return{verse,title:`${event.title} · ${phrase.slice(0,18)||`${verse}절`}`,study:`${text} 이 권면을 편지와 표정, 몸짓으로 보여 줘요.`,actors,setting:'letter-room',prop:/혀|말|가르침|성경/.test(text)?'scroll':/병|기름/.test(text)?'oil':'scroll',actions:rule[1].map(a=>EVENT_ACTIONS.includes(a)?a:'stand'),motif:rule[2],emotion:/시험|고난|부르짖|병/.test(text)?'worried':/긍휼|사랑|기쁨/.test(text)?'gentle':'determined'};
 });
 additionalPeople[chapter]=actorsFor(chapter);
}
function actorsFor(chapter){return ['야고보','흩어진 성도들'].map(name=>({name,role:'야고보서의 권면을 주고받는 이들',refs:[`야고보서 ${chapter}장`]}));}
export{chapters,additionalPeople};
