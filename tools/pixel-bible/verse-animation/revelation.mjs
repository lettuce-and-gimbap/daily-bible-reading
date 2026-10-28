import fs from 'node:fs';
import {EVENT_ACTIONS} from '../../../js/features/pixel-bible/event-animation/timeline.js';

const summary=JSON.parse(fs.readFileSync(new URL('../../../data/summary/rev.json',import.meta.url),'utf8'));
const counts={1:20,2:29,3:22,4:11,5:14,6:17,7:17,8:13,9:21,10:11,11:19,12:17,13:18,14:20,15:8,16:21,17:18,18:24,19:21,20:15,21:27,22:21};
const rules=[
 [/교회|촛대|별|등불|회개|이기는/,['write','read','listen','warn','turn','bless'],'vision-record'],
 [/보좌|어린양|두루마리|봉인|인|책/,['bow','look','receive','open','show','bless'],'vision-praise'],
 [/나팔|향|기도|제단|재앙|대접/,['blow','kneel','pour','look','startle','wait'],'vision-incense'],
 [/용|여자|아이|미가엘|하늘|싸우/,['look','startle','hide','signal','strike','stand'],'vision-battle'],
 [/짐승|표|우상|이름|숫자|거짓/,['show','warn','turn','refuse','stand','wait'],'vision-warning'],
 [/바벨론|음녀|무너|심판|피/,['look','mourn','point','fall','scatter','wait'],'vision-rider'],
 [/어린양|혼인|왕|백마|승리/,['look','bow','open','march','raise-hands','stand'],'vision-rider'],
 [/천년|사탄|죽은|생명책|불못|심판/,['bind','release','gather','read','judge','wait'],'vision-bind'],
 [/새 하늘|새 땅|예루살렘|성|생명수|나무|보석/,['look','show','measure','open','gather','bless'],'vision-city'],
 [/오라|오심|속히|아멘|은혜|예언/,['listen','write','read','look','pray','bless'],'vision-record']
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
  const rule=rules.find(([pattern])=>pattern.test(`${event.title} ${text}`))||[/./,['look','listen','write','show','pray','wait'],'vision-record'];
  const actors=['요한'];
  for(const person of content.people||[])if(text.includes(person.name)&&!actors.includes(person.name)&&actors.length<5)actors.push(person.name);
  if(/교회|성도|사람들/.test(text)&&!actors.includes('7 교회'))actors.push('7 교회');
  if(/어린양|그리스도/.test(text)&&!actors.includes('어린양'))actors.push('어린양');
  return{verse,title:`${event.title} · ${phrase.slice(0,18)||`${verse}절`}`,study:`${text} 환상의 상징과 요한의 반응을 구별해 편지와 표정, 몸짓으로 보여 줘요.`,actors:actors.slice(0,5),setting:/18|19|20|21|22/.test(chapter)?'vision':'vision',prop:/두루마리|책|기록/.test(text)?'scroll':/촛대|등불/.test(text)?'lamp':'scroll',actions:rule[1].map(a=>EVENT_ACTIONS.includes(a)?a:'stand'),motif:rule[2],emotion:/재앙|심판|두려|용|짐승|무너/.test(text)?'worried':/생명수|새 하늘|은혜|기쁨|어린양/.test(text)?'gentle':'awe'};
 });
 additionalPeople[chapter]=['요한','7 교회','어린양'].map(name=>({name,role:'요한계시록의 환상·편지에 등장하는 인물과 공동체',refs:[`요한계시록 ${chapter}장`]}));
}
export{chapters,additionalPeople};
