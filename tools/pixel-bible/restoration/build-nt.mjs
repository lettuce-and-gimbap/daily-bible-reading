// Restore every public chapter-summary unit without exporting private source text.
import fs from 'node:fs';
import {ANIMATION_MOTIFS} from '../../../js/features/pixel-bible/event-animation/motifs.js';
import {chapterObjects} from '../../../js/features/pixel-bible/object-catalog.js';
const root='data/pixel-bible/events/', plans=JSON.parse(fs.readFileSync('tools/pixel-bible/restoration/chapter-plans-nt.json'));
const books=Object.keys(JSON.parse(fs.readFileSync('tools/pixel-bible/animation/book-plans-nt.json')));
const castPlans=JSON.parse(fs.readFileSync('tools/pixel-bible/restoration/cast-nt.json'));
const durations=[1,1.2,1.5,1.8,1.5,1.2];
const numbers=raw=>String(raw).split(',').flatMap(part=>{const m=part.trim().match(/^(\d+)(?:[-–—](\d+))?$/);if(!m)throw Error('Invalid verses '+raw);return Array.from({length:Number(m[2]||m[1])-Number(m[1])+1},(_,i)=>Number(m[1])+i);});
const divinity=/^(하나님|여호와|성령|주님|어린 양)$/;
const explicitProps={rev:{'6.2':'scale','6.3':'horse','7.1':'seal','11.0':'reed','12.2':'scene-marker','17.1':'scene-marker','21.3':'scene-marker'},luk:{'2.0':'stable'},jhn:{'9.1':'water-supply'}};
const props={baptism:'water-supply','feed-many':'bread','roof-lower':'mat',pentecost:'scene-marker',reveal:'scene-marker',wither:'fig-tree','vision-eat':'scroll','vision-harvest':'sickle','vision-water':'scene-marker'};
const manifest=[];
for(const code of books){
 const file=root+code+'.json',data=JSON.parse(fs.readFileSync(file)),summary=JSON.parse(fs.readFileSync('data/summary/'+code+'.json'));
 data.restoredScenes=[];
 for(const [chapter,c]of Object.entries(summary.chapters)){
  const tokens=plans[code]?.[chapter]?.split(' ');if(tokens&&tokens.length!==c.events.length)throw Error(code+chapter+' plan count');
  const units=c.events.map((event,i)=>({...event,unitId:`${code}.${chapter}.${i}`,motif:tokens?.[i]||'symbolic'}));
  // John 7:53 is a chapter boundary unit absent from the earlier summary index.
  if(code==='jhn'&&chapter==='7')units.push({title:'집으로 돌아간 사람들',verses:'53',text:'모였던 사람들이 각자 집으로 돌아가요. 다음 장의 성전 장면과 이어지는 짧은 전환이에요.',unitId:'jhn.7.boundary53',motif:'depart'});
  if(code==='rev'&&chapter==='12')units.push({title:'바닷가에 선 용',verses:'18',text:'용이 바닷가에 선 뒤 바다에서 올라오는 짐승의 환상으로 이어져요. 이 연결 구절은 쉬운성경 12장 18절, 개역개정 13장 1절에 배치되어 있어요.',unitId:'rev.12.boundary18',motif:'vision-record',sourceRanges:{gae:{chapter:13,verses:[1]},easy:{chapter:12,verses:[18]}}});
  for(const [i,event]of units.entries()){
   const verseNumbers=numbers(event.verses),ref=`${data.scenes[0].ref.split(' ')[0]} ${chapter}:${event.verses}`;
   const old=data.scenes.find(s=>s.chapter===Number(chapter)&&s.title===event.title&&verseNumbers.every(v=>s.verseNumbers.includes(v)));
   if(old){old.sourceUnits=[...new Set([...(old.sourceUnits||[]),event.unitId])];manifest.push({unit:event.unitId,code,chapter:Number(chapter),verses:event.verses,scene:old.id,restored:false});continue;}
   const text=event.title+' '+event.text,epistle=!['mat','mrk','luk','jhn','act','rev'].includes(code);
   // Named historical references in a sermon are not actors standing in that scene.
   let mode=code==='rev'?'vision':epistle||['symbolic','parable','genealogy'].includes(event.motif)||code==='act'&&chapter==='7'?'illustration':'reconstruction';
   let actors=mode==='illustration'?[]:(c.people||[]).filter(p=>!divinity.test(p.name)&&text.includes(p.name)).map(p=>p.name).slice(0,3);
   if(code==='rev')actors=(c.people||[]).some(p=>p.name==='요한')?['요한']:[];
   // When a summary has no explicit participant, show an explanatory diagram, never invent one.
   if(castPlans[code]?.[chapter+'.'+i])actors=castPlans[code][chapter+'.'+i].actors;
   if(!actors.length&&mode==='reconstruction')mode='illustration';
   if(mode==='reconstruction'&&['heal-rise','raise-dead'].includes(event.motif)&&actors.length<2)mode='illustration';
   const candidates=chapterObjects({code,chap:Number(chapter),name:summary.name,data:{events:[event],people:c.people}});
   let object=explicitProps[code]?.[chapter+'.'+i]||props[event.motif]||candidates.find(o=>!['nail','horse','sandal','oar','silver','gold'].includes(o.id))?.id||'scene-marker';
   if(mode==='illustration'&&object==='scene-marker')object='scene-marker';
   const motif=['수로보니게 여인','왕의 신하의 아들','백부장의 믿음'].includes(event.title)?'petition':event.title==='엠마오로 가는 길'?'emmaus':['변화산','변형되심'].includes(event.title)?'transfiguration':event.title==='목자들과 천군'?'announce':code==='jhn'&&chapter==='9'&&event.title==='바리새인의 심문'?'report':event.title==='땅끝까지 증인'||event.title==='승천'?'ascension':event.motif,template=ANIMATION_MOTIFS[motif];if(!template)throw Error('Unknown motif '+motif);
   if(['변화산','변형되심'].includes(event.title))actors=['예수','모세','엘리야'].filter(n=>(c.people||[]).some(p=>p.name===n));
   const lead=motif==='petition'?(actors.find(n=>n!=='예수')||actors[0]||null):actors[0]||null,id=`nt-restored-${code}-${chapter}-${i}`;
   const scene={...(event.sourceRanges?{sourceRanges:event.sourceRanges}:{}),id,code,chapter:Number(chapter),title:event.title,actors,object,ref,verseNumbers,sourceUnits:[event.unitId],actions:{},lines:[event.text.match(/^.*?[.!?。](?:\s|$)/)?.[0]?.trim()||event.text],study:event.text,actorLines:{},narrationOnly:true,
    ...(event.title==='엠마오로 가는 길'?{requiresObjects:['table']}:{}),objectNote:object==='scene-marker'?'본문 장면을 여는 안내 표지예요. 성경 속 물건으로 재현한 것이 아니에요.':mode==='illustration'?'가르침을 이해하기 위한 상징 그림이에요. 실제 사건의 행동으로 재현하지 않아요.':'본문 요약에 나온 대상을 공통 픽셀 그림으로 보여 줘요. 세부 자세와 시간은 창작이에요.',
    animation:{version:2,motif,lead,target:actors.find(n=>n!==lead)||null,mode,setting:template.setting,effect:template.effect,emotion:template.emotion,prop:object,beats:template.actions.map((action,k)=>({action,duration:durations[k],actor:lead})),duration:8.2,...(event.motif==='feed-many'?{basketCount:(code==='mat'&&chapter==='15'||code==='mrk'&&chapter==='8')?7:12}:{}),...(['달리다굼','딸과 혈루증 여인'].includes(event.title)?{portrayals:{[actors[1]]:{scale:0.7,hideBeard:true}}}:{}),...(code==='luk'&&chapter==='2'&&i===0?{portrayals:{예수:{scale:0.5,hideBeard:true,lie:true}}}:{}),ref,source:'장별 본문 요약 기반 · 원문 인용 및 창작 발화 없음'}};
   // A narrated summary is not character dialogue and must not enter random speech.
   data.restoredScenes.push(scene);manifest.push({unit:event.unitId,code,chapter:Number(chapter),verses:event.verses,scene:id,restored:true});
  }
 }
 const animations=[];fs.writeFileSync(file,JSON.stringify(data,(k,v)=>k==='animation'?(animations.push(v),'__A_'+(animations.length-1)+'__'):v,2).replace(/"__A_(\d+)__"/g,(_,i)=>JSON.stringify(animations[Number(i)]))+'\n');
 console.log(code,'existing',data.scenes.length,'restored',data.restoredScenes.length);
}
fs.writeFileSync('data/pixel-bible/events/coverage-nt.json',JSON.stringify({scope:'신약 27권 장별 공개 요약의 사건·가르침 단위와 요한복음 7:53 연결. 개별 절의 모든 미세 행동을 독립 애니메이션으로 제작했다는 뜻은 아님.',units:manifest},null,2)+'\n');
