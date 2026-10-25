import {twoKingsMonologues} from './2ki-dialogue.js';
import {newTestamentMonologues} from './nt-dialogue.js';
import {oldTestamentMonologues} from './ot-dialogue.js';
// 본문 사건을 짧게 풀어 쓴 창작 대사. 성경의 직접 인용이 아니다.
// 이름뿐 아니라 책/장과 역할을 확인해 동명이인과 행위 주체를 구분한다.
const scenes=[
 ['1ki',19,'엘리야','열왕기상 19:4–18',[
  ['로뎀나무 그늘까지 왔지만 마음은 무너지는구나. 주님, 저는 더 버틸 힘이 없습니다.','sad'],
  ['다 끝났다고 여긴 내 곁에 떡과 물을 놓아 주셨구나. 다시 일어날 힘을 주시는군.','determined'],
  ['혼자 남았다고 여겼는데 칠천 명을 지켜 두셨구나. 내가 혼자 싸우는 게 아니었어.','surprised']]],
 ['1ki',21,'이세벨','열왕기상 21:7–14',[
  ['나봇을 없애야 포도원을 빼앗지. 왕의 도장으로 장로들을 움직이겠어.','angry'],
  ['나봇이 저주했다고 거짓 증언하게 하자. 그를 죽게 하면 포도원은 왕의 것이 되겠지.','determined'],
  ['증인 둘만 앞세우면 나봇을 몰아세울 수 있어. 내 계획에 장로들도 따르게 하자.','angry']]],
 ['1ki',21,'아합','열왕기상 21:1–4',[
  ['궁 곁 나봇의 포도원을 채소밭으로 갖고 싶군. 거절당하니 더 탐이 나는구나.','determined'],
  ['더 좋은 땅도 값도 주겠다는데 거절하다니. 생각할수록 분해서 밥도 먹기 싫군.','angry'],
  ['조상의 유산이라며 거절하다니. 왕인 내가 저 포도원 하나도 얻지 못하는가.','worried']]],
 ['1ki',21,'나봇','열왕기상 21:1–3',[
  ['조상에게 받은 포도원을 왕에게 넘길 수는 없어.','determined'],
  ['이 포도원은 내 조상의 유산이야.','neutral'],
  ['값을 받더라도 조상의 유산을 내줄 수는 없지.','determined']]],
 ['2ki',2,'엘리사','열왕기하 2:9–14',[
  ['스승 없이 이 길을 이어가야 한다니 두렵구나. 사명을 이을 영감을 구했지.','determined'],
  ['겉옷만 내 손에 남았구나. 스승과 함께하신 여호와여, 저와도 함께해 주십시오.','determined'],
  ['엘리야의 하나님 여호와는 어디 계십니까?','worried']]],
 ['rut',2,'룻','룻기 2:2–18',[
  ['낯선 밭에서 쫓겨날까 두렵지만 어머니와 먹을 양식이 필요해. 이삭을 주우러 가자.','determined'],
  ['보아스가 이 밭에 머물러도 된다고 했어. 모압 여자인 내게도 자리를 내주셨구나.','gentle'],
  ['어머니가 기다리실 거야. 주운 보리를 떨어서 함께 먹을 양식을 가져가자.','joy']]],
 ['exo',3,'모세','출애굽기 3:2–12',[
  ['떨기나무에 불이 붙었는데 타 없어지지 않는구나.','surprised'],
  ['거룩한 땅이라 하시니 신을 벗어야겠어.','determined'],
  ['내가 누구이기에 바로에게 가겠습니까?','worried']]],
 ['1sa',17,'다윗','사무엘상 17:40–47',[
  ['갑옷은 익숙하지 않아. 손에 익은 물매와 이 돌을 들고 나아가겠어.','determined'],
  ['하나님의 군대를 모욕하는 소리를 듣고만 있을 수는 없어. 내가 저 사람에게 가겠어.','determined'],
  ['이 싸움은 여호와께 속한 것이야.','determined']]],
 ['jhn',4,'예수','요한복음 4:7–24',[
  ['길을 걸어 목이 마르구나. 이 여인에게 물을 좀 달라고 하자.','gentle'],
  ['내가 주는 물은 영생하도록 솟아나는 샘물이 되지.','gentle'],
  ['사마리아에서도 아버지께 예배할 때가 오고 있어.','determined']]],
 ['jhn',4,'사마리아 여자','요한복음 4:9–29',[
  ['유대인이신데 어찌 내게 물을 달라 하실까?','surprised'],
  ['그 물을 주시면 다시 물 길으러 오지 않아도 될까요?','worried'],
  ['물동이는 두고 마을 사람들에게 알리러 가야겠어.','joy']]],
 ['luk',19,'삭개오','누가복음 19:3–9',[
  ['예수님을 꼭 뵙고 싶은데 사람들이 앞을 가리는구나. 나무에 올라서라도 보자.','determined'],
  ['예수님이 오늘 내 집에 머무르신다니!','joy'],
  ['재산 절반을 가난한 이들에게 주어야겠어.','determined']]],
 ['gen',6,'노아','창세기 6:14–22',[
  ['우리 식구와 생물들이 홍수를 피할 방주를 지어야겠어. 말씀하신 나무를 준비하자.','determined'],
  ['방주 안팎에 역청을 칠해야겠어.','determined'],
  ['말씀하신 대로 가족과 생물들의 먹이를 준비하자.','determined']]],
];
export function chapterMonologues(n,occurrences){
 const out=[],sceneKeys=new Set();
 for(const [code,chap,name,ref,lines] of scenes)if((n.name===name||(name==='예수'&&n.name==='예수님'))&&occurrences.some(p=>p.code===code&&p.chap===chap)){
  sceneKeys.add(`${code}.${chap}`);
  for(const [text,emotion]of lines)out.push({text,ref,emotion});
 }
 const remaining=occurrences.filter(p=>!sceneKeys.has(`${p.code}.${p.chap}`));
 return [...out,...newTestamentMonologues(n,remaining),...oldTestamentMonologues(n,remaining),...twoKingsMonologues(n,remaining)];
}
