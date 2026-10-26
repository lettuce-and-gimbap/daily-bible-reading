import fs from 'node:fs';
import {EVENT_ACTIONS} from '../../../js/features/pixel-bible/event-animation/timeline.js';

const summary=JSON.parse(fs.readFileSync(new URL('../../../data/summary/heb.json',import.meta.url),'utf8'));
const counts={1:14,2:18,3:19,4:16,5:14,6:20,7:28,8:13,9:28,10:39,11:40,12:29,13:25};
const rules=[
 [/천사|아들|영광|보좌/,['look','show','bow','stand','bless','wait'],'blessing'],
 [/죽음|고난|피|죄|구원/,['fall','rise','hold','release','walk','stand'],'rescue'],
 [/모세|광야|안식|믿음|약속/,['walk','look','speak','gather','stand','wait'],'journey'],
 [/대제사장|제사|성소|장막|언약/,['walk','offer','pour','walk','show','bless'],'sacrifice'],
 [/아브라함|사라|이삭|야곱|요셉|모세|노아|아벨|라합|믿음/,['walk','build','offer','brace','receive','look'],'report'],
 [/경주|징계|인내|흔들|시온/,['run','brace','brace','gather','look','stand'],'endure'],
 [/사랑|대접|갇힌|결혼|목자|평강|축복/,['signal','look','walk','bless','pray','write'],'welcome']
];
const actorsFor=(chapter,event)=>{
 const text=`${event.title} ${event.text}`;
 const names=summary.chapters[chapter].people.map(p=>p.name).filter(name=>name.length>1&&text.includes(name));
 const primary=names.slice(0,2);
 return [...new Set(['히브리서 저자','히브리 성도들',...primary])].slice(0,4);
};
const chapters={},additionalPeople={};
for(const [chapter,content] of Object.entries(summary.chapters)){
 const events=content.events||[];
 const ranges=events.map(event=>{const [,lo,hi='']=event.verses.match(/^(\d+)(?:-(\d+))?$/)||[];return{event,lo:Number(lo||1),hi:Number(hi||lo||1)};});
 const story=content.story.split(/(?<=[.!?요])\s+/u).filter(Boolean);
 chapters[chapter]=Array.from({length:counts[chapter]},(_,i)=>{
  const verse=i+1,entry=ranges.find(range=>verse>=range.lo&&verse<=range.hi)||ranges.at(-1),event=entry.event;
  const local=verse-entry.lo,span=entry.hi-entry.lo+1;
  const sentence=story[(verse-1)%Math.max(1,story.length)]||content.line;
  const words=sentence.split(/\s+/u),start=Math.floor(local*words.length/span),end=Math.max(start+1,Math.floor((local+1)*words.length/span));
  const detail=words.slice(start,end).join(' ').replace(/[“”]/gu,'').trim();
  const source=`${detail} ${event.text}`.replace(/\s+/gu,' ').trim();
  const rule=rules.find(([pattern])=>pattern.test(`${event.title} ${source}`))||[/./,['read','listen','speak','pray','stand','wait'],'report'];
  const actions=rule[1].map(action=>EVENT_ACTIONS.includes(action)?action:'stand');
  const title=`${event.title} · ${detail.slice(0,18)||`${verse}절`}`;
  return{verse,title,study:`${source} 이 절의 논증을 편지와 표정, 몸짓으로 보여 줘요.`,actors:actorsFor(chapter,event),setting:/11|12/.test(chapter)?'journey':'letter-room',prop:/제사|피|성소|장막|언약/.test(source)?'altar':/경주|달리/.test(source)?'staff':'scroll',actions,motif:rule[2],emotion:/경고|심판|두려|흔들|고난/.test(source)?'worried':/위로|사랑|평강|기쁨/.test(source)?'gentle':'determined'};
 });
 additionalPeople[chapter]=['히브리서 저자','히브리 성도들'].map(name=>({name,role:'히브리서의 권면을 주고받는 이들',refs:[`히브리서 ${chapter}장`]}));
}
export{chapters,additionalPeople};
