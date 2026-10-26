import {PAIR_DIALOGUE} from './pair-dialogue.js';

const sameName=(a,b)=>a===b||['예수','예수님'].includes(a)&&['예수','예수님'].includes(b);
function contextualLine(speaker,relation){
 if(relation.from.code==='neh'&&relation.from.chap===3){
  if(speaker.name==='하눈')return '골짜기 문은 세웠어. 샘문 쪽은 어떻게 됐어?';
  if(speaker.name==='살룬')return '샘문도 수리했어. 이제 함께 성벽을 이어가자.';
 }
 return null;
}
function relationshipFallback(a,b,relation,index){
 const basis=`${relation.label||''} ${relation.text||''}`;
 const family=relation.kind==='family'||/형제|자매|아들|딸|아버지|어머니|아내|남편|부부|족보|후손|자손|친척|배필|손자|할아버지/.test(basis);
 const conflict=!family&&(relation.kind==='conflict'||/대적|원수|죽였|죽이|위협|배신|싸우|억압|속였|빼앗|저주/.test(basis));
 if(family)return [
  [`${b.name}, 우리가 가족으로 이어져 있다는 걸 잊지 않겠다.`,`우리 사이의 가족 관계와 함께 겪은 일을 마음에 두고 있다.`][index],
  [`${a.name}, 나도 우리 사이의 정을 소중히 여기겠다.`,`우리 집안에 있었던 일을 기억하며 서로를 생각하겠다.`][index],
 ];
 if(conflict)return [
  [`${b.name}, 우리 사이에 있었던 일을 가볍게 여기지 않겠다.`,`그날 네가 한 선택이 남긴 것을 아직 기억하고 있다.`][index],
  [`${a.name}, 그 일의 무게를 나도 잊지 않고 있다.`,`우리 사이에 있었던 일을 외면하지 않겠다.`][index],
 ];
 if(relation.kind==='ally')return [
  [`${b.name}, 네가 내 곁에서 함께해 준 일을 기억하고 있어.`,`우리가 함께 감당한 일을 잊지 않고 있다.`][index],
  [`${a.name}, 나도 그때 우리가 함께한 일을 기억하고 있어.`,`함께 나눈 약속과 네가 보여 준 마음을 잊지 않겠다.`][index],
 ];
 return [
  [`${b.name}, 우리가 이 사건으로 이어져 있다는 걸 기억하고 있어.`,`각자 맡은 일이 달라도 그때의 연결을 잊지 않겠다.`][index],
  [`${a.name}, 나도 우리가 서로의 일에 연결되어 있음을 기억한다.`,`그 사건에서 우리가 맡았던 일을 함께 기억하자.`][index],
 ];
}
const identityKey=n=>`${n.name}:${n.identity?.id||''}`;
export function relationshipLines(a,b,relation,_chapterLines,{random=Math.random}={}){
 const chapter=`${relation.from.code}.${relation.from.chap}`;
 const forward=PAIR_DIALOGUE.find(p=>p.chapter===chapter&&sameName(p.speaker,a.name)&&sameName(p.target,b.name));
 const reverse=PAIR_DIALOGUE.find(p=>p.chapter===chapter&&sameName(p.speaker,b.name)&&sameName(p.target,a.name));
 // Pick one shared variant for both speakers. Independent random picks made
 // otherwise related lines sound like two unrelated monologues.
 const variants=Math.max(forward?.lines?.length||0,reverse?.lines?.length||0,forward?.replyLines?.length||0,reverse?.replyLines?.length||0);
 const index=variants?Math.min(variants-1,Math.floor(random()*variants)):0;
 const choose=(entry,reply=false)=>reply?(entry?.replyLines?.[index]||entry?.replyLines?.[0]):(entry?.lines?.[index]||entry?.lines?.[0]);
 const contextualA=contextualLine(a,relation),contextualB=contextualLine(b,relation);
 const fallbackA=relationshipFallback(a,b,relation,index),fallbackB=relationshipFallback(b,a,relation,index);
 const generated=!forward&&!reverse&&!contextualA&&!contextualB;
 const textA=forward?choose(forward):reverse?choose(reverse,true):contextualA||fallbackA[0];
 const textB=reverse?choose(reverse):forward?choose(forward,true):contextualB||fallbackB[0];
 return [
  {speaker:a,target:b,text:textA,entry:forward||reverse,ref:(forward||reverse)?.ref||relation.ref},
  {speaker:b,target:a,text:textB,entry:reverse||forward,ref:(reverse||forward)?.ref||relation.ref},
 ].map(({speaker,target,text,entry,ref})=>({
  id:`relationship:${identityKey(speaker)}:${chapter}`,speaker,target,text,
  ref,detailText:[relation.text,entry?.detail,generated?'관계와 사건 설명을 바탕으로 구성한 짧은 창작 상호작용입니다.':null].filter(Boolean).join(' ') + ` (${relation.ref})`,kind:'pair',origin:generated?'chapter-relation':'authored',pairIndex:index,
 }));
}

export function loveBoothExchange(a,b,relations){
 const relation=relations.find(r=>[r.from.name,r.to.name].includes(a.name)&&[r.from.name,r.to.name].includes(b.name));
 const lines=relation?relationshipLines(a,b,relation,null):[];
 if(lines.length===2)return {relation,lines,mode:'special'};
 if(relation)return {relation,lines:[],mode:'pending'};
 return {relation:null,mode:'awkward',lines:[
  {speaker:a,target:b,text:'어… 안녕하세요.',kind:'pair'},
  {speaker:b,target:a,text:'응… 안녕하세요.',kind:'pair'},
 ]};
}
