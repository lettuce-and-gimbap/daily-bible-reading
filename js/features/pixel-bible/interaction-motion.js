import {OBJECT_CATALOG} from './object-catalog.js';
// 네 단계(준비→사용→사용→복귀)의 동작 원형. 이름별 변형은 원형과 별도로 계산한다.
export const INTERACTION_MOTIONS={
 bench:[['sit','바로 앉아 쉬기'],['feet','앉아 발 흔들기'],['rest','몸 기대 쉬기'],['lap','무릎에 손 모으기']],
 water:[['scoop','물을 떠 올리기'],['drink','잔을 들어 마시기'],['pour','조심히 물 붓기'],['wash','손 씻기']],
 field:[['gather','숙여 이삭 줍기'],['bundle','이삭 묶기'],['inspect','이삭 살피기'],['harvest','팔 뻗어 거두기']],
 tree:[['shade','그늘에서 쉬기'],['leaves','잎 살펴보기'],['fruit','열매 살피기'],['trunk','나무에 손 대기']],
 well:[['bucket','두레박 내리기'],['rope','줄 끌어 올리기'],['scoop','길어 온 물 받기'],['pour','물동이 채우기']],
 stone:[['pick','무릎 굽혀 돌 고르기'],['turn','돌 돌려 살피기'],['stack','돌 쌓기'],['place','돌 내려놓기']],
 bush:[['observe','몸 숙여 살펴보기'],['kneel','무릎 꿇기'],['hands','두 손 모으기'],['lean','가까이 살펴보기']],
 boat:[['row','노 젓기'],['balance','앉아 균형 잡기'],['look','먼 곳 바라보기'],['rope','밧줄 정리하기']],
 scroll:[['read','펼쳐 읽기'],['unroll','두루마리 펼치기'],['write','무릎 위에 적기'],['point','글을 짚으며 읽기']],
 oil:[['pour','기름 따르기'],['hold','병 받쳐 들기'],['cap','마개 열고 닫기'],['fill','그릇 채우기']],
 instrument:[['strum','줄 뜯기'],['tap','박자 맞추기'],['blow','악기 들어 불기'],['play','두 손으로 연주하기']],
 weapon:[['hold','무기 살피기'],['practice','천천히 자세 잡기'],['polish','무기 닦기'],['lower','무기 내려놓기']],
 cloth:[['fold','천 접기'],['smooth','천 펴기'],['hold','천 받쳐 들기'],['wrap','천 정리하기']],
 food:[['share','먹을 것 나누기'],['hold','양식 받아 들기'],['prepare','양식 준비하기'],['eat','한 입 먹기']],
 animal:[['watch','조용히 지켜보기'],['care','곁에 낮게 앉기'],['feed','먹이 살피기'],['guide','천천히 손 내밀기']],
 building:[['look','입구 바라보기'],['inspect','벽 살피기'],['rest','곁에서 쉬기'],['point','먼 곳 짚어보기']],
 altar:[['kneel','곁에서 무릎 굽히기'],['arrange','주변 정리하기'],['observe','두 손 모아 서기'],['bow','고개 숙이기']],
 treasure:[['count','차례로 세기'],['inspect','빛에 비추어 살피기'],['hold','두 손으로 받치기'],['place','조심히 내려놓기']],
 net:[['spread','그물 펴기'],['mend','그물 손질하기'],['fold','그물 접기'],['cast','그물 뻗기']],
 tool:[['inspect','도구 살피기'],['use','천천히 작업하기'],['wipe','도구 닦기'],['place','도구 내려놓기']],
};
const definition=(kind)=>OBJECT_CATALOG[kind]||{action:kind,family:''};
export function interactionRoutine(n,kind){
 const def=definition(kind),category=INTERACTION_MOTIONS[def.family]?def.family:def.action;
 const variants=INTERACTION_MOTIONS[category]||INTERACTION_MOTIONS.tool;
 const key=(n.identity?.id||n.name||'reader')+':'+kind;
 const seed=[...key].reduce((s,c)=>s*31+c.codePointAt(0),7)>>>0;
 let index=seed%variants.length;
 if(n.objectAction==='zacchaeus-tree')return {id:'tree:climb',category:'tree',gesture:'climb',label:'나무에 올라 바라보기',variant:seed%3,period:2.4,phase:0};
 const special={'widow-oil':'pour','david-stones':'pick','baruch-scroll':'write','josiah-scroll':'read','aaron-manna':'pour','ethiopian-scroll':'point'}[n.objectAction];
 if(special){const match=variants.findIndex(v=>v[0]===special);if(match>=0)index=match;}
 if(kind==='pen')index=2;
 if(category==='instrument')index=['trumpet','flute'].includes(kind)?2:['tambourine','cymbal'].includes(kind)?1:0;
 return {id:`${category}:${variants[index][0]}`,category,gesture:variants[index][0],label:variants[index][1],variant:seed%3,period:2.4+(seed%4)*.2,phase:(seed%4)/4};
}
export function interactionPose(routine,time=0,reduced=false){
 const phase=reduced?1:Math.floor((time/routine.period+routine.phase)*4+1e-9)%4;
 const use=phase===1||phase===2,reach=phase===1?1:phase===2?2:0;
 const {category,gesture,variant}=routine;
 const sit=category==='bench'||category==='boat'||gesture==='write';
 const bend=['gather','pick','place','kneel','care','prepare','bow'].includes(gesture)?reach:['bundle','harvest','stack'].includes(gesture)?reach*.5:0;
 const handY=gesture==='drink'?(phase===2?18:24):gesture==='scoop'?(phase===2?24:29):gesture==='wash'?(phase===2?27:29):gesture==='pour'?(phase===2?28:23):gesture==='fill'?29:gesture==='cap'?(phase===2?22:25):gesture==='blow'?17:gesture==='lap'?27:gesture==='inspect'?21:gesture==='bundle'?26:gesture==='hold'?25:bend?28:24;
 return {phase,sit,bend,handY,hand:use?1+variant%2:0,reach,prop:category,gesture,variant,bodyY:bend?reach*2:gesture==='rest'&&use?1:0,bodyX:bend?reach:gesture==='rest'&&use?-1:0,legSwing:gesture==='feet'&&use?(phase===1?1:-1):0,climb:gesture==='climb'?reach*3:0};
}
// 한글 안내는 도안/문서 검토용이며 월드 하단 설명으로 띄우지 않는다.
export const INTERACTION_MOTION_COUNT=Object.values(INTERACTION_MOTIONS).reduce((s,v)=>s+v.length,0);
