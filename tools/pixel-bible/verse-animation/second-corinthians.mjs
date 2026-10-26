import fs from 'node:fs';
import {EVENT_ACTIONS} from '../../../js/features/pixel-bible/event-animation/timeline.js';

const summary=JSON.parse(fs.readFileSync(new URL('../../../data/summary/2co.json',import.meta.url),'utf8'));
const actionsFor=text=>{
 const rules=[
  [/환난|고난|매 맞|위험|약함|옥살|눈물/,['mourn','fall','turn','pray','stand','bless']],
  [/위로|위안|사랑|용서|회개|근심/,['reach','hold','receive','listen','smile','bless']],
  [/방문|계획|길|마게도냐|드로아|다메섹/,['write','read','point','walk','turn','wait']],
  [/편지|추천서|언약|돌판|수건|기록/,['write','fold','read','show','point','speak']],
  [/빛|보배|질그릇|영광/,['hide','open','light','show','hold','bless']],
  [/장막|몸|생명|죽음|살리/,['lie','rise','stand','walk','look','wait']],
  [/연보|가난|나누|헌금|심|거두|드리|부요/,['gather','count','extend','carry','receive','bless']],
  [/거짓|싸움|자랑|비난|대적|견주/,['startle','brace','signal','speak','turn','stand']],
  [/하늘|환상|가시|기도|간구|낙원/,['kneel','pray','look','reach','hold','wait']],
  [/축도|평안|성령|감사|기쁨/,['stand','bless','point','receive','bow','wait']],
 ];
 const found=rules.find(([pattern])=>pattern.test(text));
 return (found?.[1]||['write','read','speak','listen','pray','bless']).map(action=>EVENT_ACTIONS.includes(action)?action:'stand');
};
const motifFor=text=>/용서|회개|화목|화해/.test(text)?'reconcile':/기도|간구|낙원|하늘/.test(text)?'pray':/축도|평안|감사|기쁨/.test(text)?'blessing':/방문|길|마게도냐|드로아/.test(text)?'journey':/자랑|비난|거짓|판단/.test(text)?'judge':/편지|추천서|기록|언약/.test(text)?'send-letter':'report';
const titlePart=text=>text.replace(/^[\s"“‘]+/u,'').replace(/[.!?。]+$/u,'').slice(0,14);
const chapters={},additionalPeople={};
for(const [chapter,content] of Object.entries(summary.chapters)){
 const expected=content.people?.length; // overwritten by actual count from chapter event ranges below
 const events=content.events||[];
 const count=Math.max(...events.flatMap(event=>{
  const match=event.verses.match(/^(\d+)(?:-(\d+))?$/);return match?[Number(match[2]||match[1])]:[];
 }));
 const eventRanges=events.map(event=>{const [,lo,hi='']=event.verses.match(/^(\d+)(?:-(\d+))?$/)||[];return{event,lo:Number(lo||1),hi:Number(hi||lo||1)};});
 const storyWords=content.story.split(/\s+/u).filter(Boolean);
 const phrases=Array.from({length:count},(_,i)=>{
  const start=Math.floor(i*storyWords.length/count),end=Math.max(start+1,Math.floor((i+1)*storyWords.length/count));
  return storyWords.slice(start,end).join(' ').replace(/[“”]/gu,'').trim();
 });
 chapters[chapter]=Array.from({length:count},(_,i)=>{
  const verse=i+1,range=eventRanges.find(item=>verse>=item.lo&&verse<=item.hi)||eventRanges.at(-1),
   phrase=phrases[i],source=`${phrase} ${range.event.text}`.replace(/\s+/gu,' ').trim(),
   title=`${range.event.title} · ${titlePart(phrase)||`${verse}절`}`;
  return{verse,title,study:`${source} 이 절의 흐름을 편지와 표정, 몸짓으로 보여 줘요.`,actors:['바울','고린도 성도'],setting:'letter-room',prop:/심|거두|연보|가난|부요|헌금/.test(source)?'seed':'letter',actions:actionsFor(source),motif:motifFor(source),emotion:/환난|고난|눈물|근심|약함/.test(source)?'worried':/기쁨|감사|위로|사랑/.test(source)?'gentle':'determined'};
 });
 additionalPeople[chapter]=['바울','고린도 성도'].map(name=>({name,role:'고린도후서의 편지를 주고받는 사람',refs:[`고린도후서 ${chapter}장`]}));
}
export{chapters,additionalPeople};
