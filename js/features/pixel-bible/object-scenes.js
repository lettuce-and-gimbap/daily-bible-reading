import {OBJECT_MONOLOGUES,objectMonologue} from './object-monologues.js';
export const WORLD_OBJECTS={field:'보리밭',water:'물항아리',bench:'쉬는 자리',tree:'나무',well:'우물',stone:'돌',bush:'떨기나무',boat:'배',scroll:'두루마리',oil:'기름병'};
export const OBJECT_SCENES=[
 {id:'jacob-stone',code:'gen',chapter:28,title:'베개 삼은 돌',actors:['야곱'],object:'stone',ref:'창세기 28:11–18',lines:['야곱은 돌을 베개 삼아 누웠다가 꿈을 꿉니다.','아침에 그 돌을 기둥으로 세우고 기름을 붓습니다.']},
 {id:'rebekah-well',code:'gen',chapter:24,title:'물을 길어 주는 리브가',actors:['리브가'],object:'well',ref:'창세기 24:18–20',lines:['리브가는 물동이를 내려 물을 마시게 합니다.','낙타들을 위해서도 우물에서 물을 길어 줍니다.']},
 {id:'isaac-well',code:'gen',chapter:26,title:'이삭의 우물',actors:['이삭'],object:'well',ref:'창세기 26:18–22',lines:['이삭의 종들이 우물을 팠지만 다툼이 일어납니다.','다른 곳으로 옮겨 우물을 파고, 다투지 않는 그곳을 르호봇이라 부릅니다.']},
 {id:'moses-bush',code:'exo',chapter:3,title:'떨기나무 앞의 모세',actors:['모세'],object:'bush',ref:'출애굽기 3:2–5',lines:['모세는 불이 붙었지만 사라지지 않는 떨기나무를 바라봅니다.','하나님은 모세를 부르시며 거룩한 땅이니 신을 벗으라고 말씀하십니다.']},
 {id:'aaron-manna',code:'exo',chapter:16,title:'만나를 담은 항아리',actors:['아론'],object:'water',ref:'출애굽기 16:32–34',lines:['모세가 전한 말씀에 따라 아론은 항아리에 만나 한 오멜을 담습니다.','후손들이 광야에서 주신 양식을 기억하도록 간직합니다.']},
 {id:'david-stones',code:'1sa',chapter:17,title:'다섯 개의 매끄러운 돌',actors:['다윗'],object:'stone',ref:'사무엘상 17:40',lines:['다윗은 시내에서 매끄러운 돌 다섯 개를 고릅니다.','돌들을 주머니에 넣고 물매를 들고 나아갑니다.']},
 {id:'widow-water',actions:{"사르밧 과부":"water"},code:'1ki',chapter:17,title:'사르밧의 물과 양식',actors:['사르밧 과부','엘리야'],object:'water',ref:'열왕기상 17:10–16',lines:['엘리야가 사르밧 여인에게 물과 떡을 요청합니다.','여인은 엘리야가 전한 여호와의 말씀대로 준비합니다. 비가 내릴 때까지 가루와 기름이 떨어지지 않으리라는 약속대로 여러 날 양식을 먹습니다.']},
 {id:'widow-oil',code:'2ki',chapter:4,title:'빈 그릇에 붓는 기름',actors:['선지자 제자의 아내'],object:'oil',ref:'열왕기하 4:1–7',lines:['여인은 엘리사의 말을 따라 이웃에게 빈 그릇들을 빌립니다.','두 아들과 문을 닫고 그릇에 기름을 붓습니다. 그릇이 없자 기름이 멈추고, 엘리사는 기름을 팔아 빚을 갚고 남은 것으로 살라고 말합니다.']},
 {id:'josiah-scroll',actions:{},code:'2ki',chapter:22,title:'율법책을 듣는 요시야',actors:['요시야'],object:'scroll',ref:'열왕기하 22:8–13',lines:['힐기야가 성전에서 발견한 율법책을 서기관 사반이 요시야 앞에서 읽습니다.','왕은 옷을 찢고 그 말씀에 관해 여호와께 묻게 합니다.']},
 {id:'baruch-scroll',code:'jer',chapter:36,title:'두루마리에 기록하는 바룩',actors:['바룩'],object:'scroll',ref:'예레미야 36:4–8',lines:['바룩은 예레미야가 불러 주는 여호와의 말씀을 두루마리에 기록합니다.','성전에 갈 수 없는 예레미야의 부탁을 받아, 금식일에 모인 백성에게 말씀을 읽어 줍니다.']},
 {id:'jesus-boat',actions:{},code:'mrk',chapter:4,title:'풍랑 속의 배',actors:['예수','제자들'],object:'boat',ref:'마가복음 4:35–41',lines:['배에 물이 들어오자 제자들이 주무시는 예수님을 깨웁니다.','예수님이 바람과 바다를 꾸짖으시자 아주 잔잔해집니다.']},
 {id:'zacchaeus-tree',code:'luk',chapter:19,title:'나무에 올라간 삭개오',actors:['삭개오'],object:'tree',ref:'누가복음 19:3–6',lines:['삭개오는 예수님을 보려고 앞서 달려가 나무에 올라갑니다.','예수님의 부르심에 급히 내려와 기쁘게 맞아들입니다.']},
 {id:'samaritan-well',actions:{},code:'jhn',chapter:4,title:'우물가에서 나눈 이야기',actors:['예수','사마리아 여자'],object:'well',ref:'요한복음 4:6–15',lines:['우물가에서 예수님이 사마리아 여인에게 물을 달라고 말씀하십니다.','예수님은 자신이 주시는 물이 사람 안에서 영생에 이르는 샘물이 된다고 말씀하십니다.']},
 {id:'ethiopian-scroll',actions:{"빌립":"scroll","에디오피아 내시":"scroll"},code:'act',chapter:8,title:'두루마리를 함께 읽는 빌립',actors:['빌립','에디오피아 내시'],object:'scroll',ref:'사도행전 8:28–35',lines:['에디오피아 내시가 이사야의 글을 읽고 있습니다.','내시가 누구를 가리키는 글인지 묻자, 빌립은 그 이사야의 글에서 시작해 예수님에 관한 복음을 전합니다.']},
];
export function removeObjects(objects,npcs,shouldRemove){
 const removed=objects.filter(shouldRemove);
 for(const n of npcs){
  if(removed.includes(n.task)){n.task=null;n.objectScene=null;n.objectAction=null;n.interaction=null;n.action='';}
  if(removed.includes(n.usingObject)){n.usingObject=null;n.objectScene=null;n.objectAction=null;n.interaction=null;n.action='';}
 }
 return {remaining:objects.filter(o=>!removed.includes(o)),removed};
}

// 자동 상호작용용 창작 발화. 위 장면 설명·성경의 직접 인용과 구분해 관리한다.
export const OBJECT_LINES={
 'jacob-stone':['집을 떠나 홀로 밤을 맞으니 두렵구나. 이 돌을 베고 잠시 누워야겠어.','내가 베었던 이 돌을 세워 이곳을 기억하자.'],
 'rebekah-well':['낙타들을 위해서도 물을 길어 줘야겠어.','물을 충분히 마실 때까지 다시 다녀오자.'],
 'isaac-well':['다툼이 없는 이 우물 곁에서 자리를 넓힐 수 있겠구나.','다시 물을 얻었으니 이곳에서 머물러 보자.'],
 'moses-bush':['불이 붙었는데도 나무가 타 없어지지 않는구나.','거룩한 곳이라 하셨으니 신을 벗어야겠어.'],
 'aaron-manna':['후손들도 이 양식을 기억하도록 항아리에 담아 두자.','광야에서 먹이신 일을 잊지 말아야겠어.'],
 'david-stones':['매끄러운 돌 다섯 개를 골라 주머니에 넣자.','손에 익은 물매와 이 돌들을 가지고 나아가자.'],
 'widow-water':['물과 떡을 구하는 이가 내 앞에 서 있구나.','말씀대로 준비하며 오늘의 양식을 나누자.'],
 'widow-oil':['빈 그릇들을 모았으니 기름을 부어 보자.','아들들이 가져오는 그릇마다 기름을 채워야겠어.'],
 'josiah-scroll':['이 말씀을 어기며 살아왔다니 두렵구나. 주님 앞에서 옷을 찢고 엎드리고 싶어.','우리가 듣게 된 이 말씀에 관해 여호와께 물어야겠어.'],
 'baruch-scroll':['불러 주시는 말씀을 두루마리에 차례로 적어 두자.','이 말씀을 백성이 들을 수 있도록 읽어야겠어.'],
 'jesus-boat':['바람과 파도가 거세져 배에 물이 들어오는구나.','우리를 두렵게 하던 바다가 잔잔해졌구나.'],
 'zacchaeus-tree':['여기 올라가면 지나가시는 예수님을 볼 수 있겠어.','나를 부르시네. 서둘러 내려가 맞이해야겠어.'],
 'samaritan-well':['이 우물물보다 더 깊은 이야기를 듣고 있구나.','목마르지 않을 물이라면 내게도 주셨으면. 날마다 물 길으러 오는 수고가 끝날까.'],
 'ethiopian-scroll':['이 말씀을 함께 읽으며 뜻을 살펴보자.','이 구절이 누구를 말하는지 궁금해하시는구나. 예수님 이야기를 전해 드리자.'],
};

// 두 사람이 등장하는 장면은 화자별 문장을 구분한다.
const ACTOR_OBJECT_LINES = {
 'rest-elijah': {
  '천사':['지쳐 누워 있구나. 일어나 먹어라, 아직 가야 할 길이 멀다.'],
 },
 'widow-water': {
  '엘리야': ['그릇에 물을 조금 가져다 주시오. 떡 한 조각도 부탁하오.', '두려워하지 말고 말씀대로 준비하시오. 비가 올 때까지 가루와 기름이 떨어지지 않으리라고 여호와께서 말씀하셨소.'],
  '사르밧 과부': ['남은 가루와 기름은 조금뿐이지만, 엘리야가 전한 말씀대로 준비하자.', '여호와의 말씀대로 가루와 기름이 떨어지지 않는구나.']
 },
 'jesus-boat': {
  '예수': ['어찌하여 이렇게 두려워하느냐? 아직도 믿음이 없느냐?', '바람아 멎어라. 바다야 잠잠하여라.'],
  '예수님': ['어찌하여 이렇게 두려워하느냐? 아직도 믿음이 없느냐?', '바람아 멎어라. 바다야 잠잠하여라.'],
  '제자들': ['선생님, 배에 물이 들어와 죽을 것 같습니다. 저희를 돌봐 주십시오.', '이분이 누구시기에 바람과 바다까지 순종하는가?']
 },
 'samaritan-well': {
  '예수': ['물을 좀 주시오.', '내가 주는 물은 그 사람 안에서 영생에 이르는 샘물이 될 것이오.'],
  '예수님': ['물을 좀 주시오.', '내가 주는 물은 그 사람 안에서 영생에 이르는 샘물이 될 것이오.'],
  '사마리아 여자': ['유대 사람이신데 어째서 사마리아 여자인 제게 물을 달라고 하십니까?', '다시 목마르지 않을 물이라니, 그 물을 제게도 주십시오.']
 },
 'ethiopian-scroll': {
  '빌립': ['읽고 계신 말씀을 이해하십니까?', '읽고 계신 이 말씀에서 시작해 예수님을 전하겠습니다.'],
  '에디오피아 내시': ['가르쳐 주는 사람이 없으니 어떻게 알겠습니까?', '선지자가 말한 이 사람은 누구입니까?']
 }
};
export function objectLinesFor(scene, name) {
 if(scene.actorLines?.[name]?.length)return scene.actorLines[name];
 const specific=OBJECT_MONOLOGUES.find(([actor,code,chapter,kinds])=>actor===name&&code===scene.code&&chapter===scene.chapter&&kinds.includes(scene.object));
 if(specific)return specific[6];
 return ACTOR_OBJECT_LINES[scene.id]?.[name] || (scene.actors.length === 1 ? OBJECT_LINES[scene.id] : null) || [objectMonologue({name},scene.object,[{code:scene.code,chap:scene.chapter}]).text];

}

export const objectVisitKey=(n,o)=>`${n.identity?.id||n.name}:${o.kind}:${o.x}:${o.y}`;
// 본문 관련 인물을 우선하되, 한 인물이 같은 물건을 연달아 독점하지 않는다.
export function rankObjectVisits(pairs,time,objectCooldown,visitorCooldown){
 return pairs.filter(p=>time-(objectCooldown.get(p.o)??-100)>=5&&time-(visitorCooldown.get(objectVisitKey(p.n,p.o))??-100)>=40)
  .sort((a,b)=>(b.scene?2:b.evidence?1:0)-(a.scene?2:a.evidence?1:0)||a.distance-b.distance);
}
