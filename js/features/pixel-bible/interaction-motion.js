import {uniqueInteraction} from './unique-interactions.js';
import {objectBehavior} from './object-behavior.js';
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
 cooking:[['stir','솥 안을 천천히 젓기'],['warm','불기운 살피기'],['serve','음식 떠내기'],['inspect','익는 상태 살피기']],
 table:[['arrange','상 위 정리하기'],['serve','상에 양식 놓기'],['wipe','상 닦기'],['inspect','상 위 살펴보기']],
 bed:[['sit','침상 가장자리 앉기'],['rest','침상 곁에서 쉬기'],['smooth','자리 펴기'],['kneel','자리 곁에 무릎 굽히기']],
 chest:[['open','뚜껑 열어 살피기'],['inspect','함 살펴보기'],['place','함 곁 정리하기'],['close','뚜껑 닫기']],
 lamp:[['tend','등불 살피기'],['shield','손으로 바람 가리기'],['inspect','등잔 심지 살피기'],['hold','불빛 곁에 손 모으기']],
 wear:[['inspect','의복과 장식 살피기'],['smooth','의복 매무새 정리하기'],['hold','두 손으로 받치기'],['polish','장식 닦기']],
 cart:[['reins','고삐 잡기'],['inspect','바퀴 살피기'],['sit','병거에 앉기'],['balance','발판 딛고 균형 잡기']],
 basket:[['fill','바구니에 담기'],['inspect','내용물 살피기'],['hold','바구니 받치기'],['place','바구니 내려놓기']],
 symbol:[['look','표징 바라보기'],['point','손 들어 가리키기'],['observe','조용히 살펴보기'],['hands','두 손 모아 바라보기']],
};
// 일상 동작은 본문 장면과 구분하며, 매 방문 선택을 바꿀 수 있다.
const extra={
 bench:[['stretch','앉아 기지개 켜기'],['rise','앉았다 일어나기']],
 water:[['offer','그릇 내밀기'],['cap','마개 열고 닫기']],
 field:[['sow','씨앗 뿌리기'],['thresh','이삭 털어 모으기']],
 tree:[['shake','나무 흔들기'],['kick','줄기 툭 차기'],['bonk','열매 떨어져 머리에 콩']],
 well:[['drink','길어 온 물 마시기'],['wash','길어 온 물로 씻기']],
 stone:[['balance','돌 균형 잡기'],['skip','작은 돌 튕기기']],
 bush:[['leaves','잎을 살피기'],['step-back','뒤로 물러나 바라보기']],
 boat:[['reins','밧줄 당기기'],['wave','배 밖으로 손 흔들기']],
 scroll:[['roll','다시 말아 묶기'],['trace','글줄 따라가기']],
 oil:[['offer','병 건네듯 내밀기'],['wipe','병 입구 닦기']],
 instrument:[['tune','줄과 악기 조율하기'],['bow','연주를 마치고 인사하기']],
 weapon:[['aim','겨냥하기'],['draw','준비 자세 잡기']],
 cloth:[['stretch','천 양끝 펴기'],['shake-cloth','천을 털기']],
 food:[['break','작게 떼어 나누기'],['offer','양식 내밀기']],
 animal:[['pet','동물 쓰다듬기'],['step-back','한 걸음 물러서기']],
 building:[['knock','입구 두드리기'],['measure','너비 가늠하기']],
 altar:[['hands','손 모아 서기'],['step-back','물러나 예를 갖추기']],
 treasure:[['sort','크기 따라 나누기'],['polish','표면 닦기']],
 net:[['shake-net','그물 털기'],['tie','그물 매듭 묶기']],
 tool:[['measure','길이 가늠하기'],['repair','손잡이 손질하기']],
 cooking:[['fan','불 앞에 부채질하기'],['taste','조금 떠서 맛보기']],
 table:[['spread','상에 천 펴기'],['share','상에 양식 나누기']],
 bed:[['stretch','앉아 몸 펴기'],['rise','자리에서 일어나기']],
 chest:[['sort','함 안을 정리하기'],['count','함의 물건 세어 보기']],
 lamp:[['trim','심지 정리하기'],['warm','불빛 곁에서 손 녹이기']],
 wear:[['wear','착용하기'],['remove','벗어 정리하기']],
 cart:[['repair','바퀴 손질하기'],['wave','병거에서 손 흔들기']],
 basket:[['sort','내용물 고르기'],['offer','바구니 내밀기']],
 symbol:[['bow','고개 숙여 바라보기'],['step-back','물러서 바라보기']],
};
for(const [category,values] of Object.entries(extra))INTERACTION_MOTIONS[category].push(...values);
export function interactionOptions(kind){
 if(kind==='ark-covenant')return [['observe','곁에서 바라보기'],['bow','고개 숙이기'],['hands','손 모으기'],['look','멀리서 살펴보기'],['step-back','물러서기'],['kneel','곁에 무릎 굽히기']];
 if(['basin','laver'].includes(kind))return [['wash','손 씻기'],['rinse','물로 헹구기'],['fill','물 채우기'],['pour','물을 떠 옮기기'],['scoop','물 떠 보기'],['wipe','가장자리 닦기']];
 if(kind==='pen')return [['write','글 쓰기'],['dip','붓끝 적시기'],['trace','선 따라 긋기'],['wipe','붓 닦기'],['inspect','붓끝 살피기'],['place','붓 내려놓기']];
 if(['tambourine','cymbal'].includes(kind))return [['tap','손으로 두드리기'],['shake','악기 흔들기'],['beat','박자 두드리기'],['raise','들어 올려 울리기'],['wipe','테두리 닦기'],['bow','연주 마치고 인사하기']];
 if(['arrow','bow'].includes(kind))return [['nock','화살 메기기'],['aim','활 겨냥하기'],['shoot','화살 쏘기'],['retrieve','화살 거두기'],['fletch','깃 살피기'],['draw','활시위 당기기']];
 if(['cloak','robe','sackcloth','linen','ephod','armor','helmet','crown','sandal','belt','breastplate'].includes(kind))return [['wear','입고 매무새 살피기'],['remove','벗어 손에 받치기'],['smooth','매무새 정리하기'],['fold','접어 정리하기'],['shake-cloth','털어서 펴기'],['offer','두 손으로 내밀기']];
 if(['trumpet','flute'].includes(kind))return [['blow','짧게 불기'],['long-blow','길게 불기'],['rehearse','박자 맞춰 불기'],['wipe','입구 닦기'],['tune','악기 살피기'],['bow','연주를 마치고 인사하기']];
 if(['lyre','harp'].includes(kind))return [['strum','줄 뜯기'],['play','양손 연주하기'],['pluck','한 줄씩 튕기기'],['tune','줄 조율하기'],['wipe','악기 닦기'],['bow','연주 마치고 인사하기']];
 return INTERACTION_MOTIONS[objectBehavior(kind).category]||INTERACTION_MOTIONS.tool;
}
export function interactionRoutine(n,kind,visit=0){
 const category=objectBehavior(kind).category;
 const variants=interactionOptions(kind);
 const key=(n.identity?.id||n.name||'reader')+':'+kind;
 const seed=[...key].reduce((s,c)=>s*31+c.codePointAt(0),7)>>>0;
 let index=(seed+visit)%variants.length;
 const unique=uniqueInteraction(n,kind);
 if(unique)return {id:unique.id,category,kind,gesture:unique.gesture,label:unique.ref,unique:true,ref:unique.ref,variant:seed%3,outcome:0,period:3.6,phase:0};
 if(kind==='ark-covenant')return {id:`bush:${variants[index][0]}`,category:'bush',kind,gesture:variants[index][0],label:variants[index][1],variant:seed%3,outcome:index,period:3,phase:0};
 if(n.objectAction==='zacchaeus-tree')return {id:'tree:climb',category:'tree',gesture:'climb',label:'나무에 올라 바라보기',variant:seed%3,period:2.4,phase:0};
 const special={'widow-oil':'pour','david-stones':'pick','baruch-scroll':'write','josiah-scroll':'read','aaron-manna':'pour','ethiopian-scroll':'point'}[n.objectAction];
 if(special){const match=variants.findIndex(v=>v[0]===special);if(match>=0)index=match;}





 return {id:`${category}:${variants[index][0]}`,category,kind,outcome:index,gesture:variants[index][0],label:variants[index][1],variant:seed%3,period:2.4+(seed%4)*.2,phase:(seed%4)/4};
}
export function interactionPose(routine,time=0,reduced=false){
 const phase=reduced?1:Math.floor((time/routine.period+routine.phase)*4+1e-9)%4;
 const use=phase===1||phase===2,reach=phase===1?1:phase===2?2:0;
 const {category,variant,outcome=0}=routine;
 const actual=routine.gesture;
 const aliases={'five-stones':'pick','glean-bundle':'gather','fill-vessels':'pour','fill-manna':'fill','offer-water':'pour','write-scroll':'write','read-prophet':'read','explain-scroll':'point','soothe-lyre':'strum','instruct-reapers':'point','unshoe':'kneel','staff-snake':'place','strike-water':'use','cast-mantle':'cast','mantle-water':'use','tear-garment':'stretch','calm-waves':'hands','water-wine':'point','break-share':'break','wear-pattern':'wear','three-arrows':'shoot','long-blow':'blow','rehearse':'blow','pluck':'strum'};
 const gesture=aliases[actual]||actual;
 const within=reduced?.5:((time/routine.period+routine.phase)*4)%1;
 const sit=category==='bench'||category==='boat'||(category==='bed'&&['sit','rest'].includes(gesture))||(category==='cart'&&gesture==='sit')||gesture==='write';
 const bend=['gather','pick','place','kneel','care','prepare','bow','fill'].includes(gesture)?reach:['bundle','harvest','stack'].includes(gesture)?reach*.5:0;
 const handY=['wear','remove'].includes(gesture)?(phase===1?17:phase===2?23:25):gesture==='trim'?(use?20:24):['point','shield','tend'].includes(gesture)?(use?18:24):['strum','tap','play','use','wipe','polish','smooth','mend','stir'].includes(gesture)?(phase===1?24:26):gesture==='eat'?(phase===2?18:25):gesture==='drink'?(phase===2?18:24):gesture==='scoop'?(phase===2?24:29):gesture==='wash'?(phase===2?27:29):gesture==='pour'?(phase===2?28:23):gesture==='fill'?29:gesture==='cap'?(phase===2?22:25):['leaves','fruit','trunk'].includes(gesture)?(use?19:24):['blow','aim','shoot','draw','nock'].includes(gesture)?18:['arrange','serve','smooth','fill','reins'].includes(gesture)?(phase===2?27:25):gesture==='lap'?27:gesture==='inspect'?21:gesture==='bundle'?26:gesture==='hold'?25:bend?28:24;
 const wearing=['wear','wear-pattern'].includes(actual)?use:actual==='remove'?phase===0:false;
 return {phase,within:Math.floor(within*6)/6,actual,outfit:routine.kind,wearing,barefeet:actual==='unshoe'&&use,unique:routine.unique,sit,bend,handY:handY+(use&&!routine.unique?outcome%3-1:0),hand:actual==='lie-stone'?0:use?1+variant%2:0,reach,prop:category,gesture,variant,bodyY:bend?reach*2:gesture==='rest'&&use?1:0,bodyX:use&&!routine.unique&&outcome>=3?1:bend?reach:['strum','tap','play','use','wipe','polish','smooth','mend','stir'].includes(gesture)&&use?(phase===1?-1:1):gesture==='rest'&&use?-1:0,legSwing:gesture==='feet'&&use?(phase===1?1:-1):0,kick:gesture==='kick'&&phase===2,climb:gesture==='climb'?reach*3:0};
}
// 한글 안내는 도안/문서 검토용이며 월드 하단 설명으로 띄우지 않는다.
export const INTERACTION_MOTION_COUNT=Object.values(INTERACTION_MOTIONS).reduce((s,v)=>s+v.length,0);
