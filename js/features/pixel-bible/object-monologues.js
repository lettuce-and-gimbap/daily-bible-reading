import {objectBehavior} from './object-behavior.js';
import {parseReference} from './references.js';
// 본문 사실을 근거로 쓴 1인칭 창작 독백. 사건의 목적과 감정은 짧게, 근거 전문은 상세에 둔다.
export const OBJECT_MONOLOGUES=[
 ['엘리야','1ki',19,['tree'],'열왕기상 19:3–5','sad',['여기까지 도망쳤는데도 두려움이 가시지 않는구나. 더 버틸 힘이 없어.','이 나무 그늘에라도 몸을 누이자. 이제는 한 걸음도 뗄 힘이 없구나.','주님, 제 힘으로는 더 못 가겠습니다. 이 광야에서 제 지친 마음을 들어 주세요.']],
 ['엘리야','1ki',19,['water','bread','bench','bed'],'열왕기상 19:5–8','gentle',['다 끝났다고 여긴 내 곁에 떡과 물을 놓아 주셨구나.','나를 버리지 않으셨구나. 이 음식을 먹고 다시 일어나 보자.']],
 ['이세벨','1ki',21,['seal','signet','letter','pen','ink'],'열왕기상 21:8–14','angry',['나봇을 없애야 포도원을 빼앗지. 왕의 도장으로 장로들을 움직이겠어.','거짓 증인 둘을 세워 나봇을 죽게 하자. 포도원은 왕의 것이 될 거야.']],
 ['아합','1ki',21,['vine','vineyard','tree'],'열왕기상 21:1–4','angry',['궁 옆의 이 포도원이 갖고 싶은데, 나봇은 어째서 땅을 내놓지 않는가.','돈도 다른 땅도 싫다니. 거절당한 생각에 밥맛까지 사라지는군.']],
 ['나봇','1ki',21,['vine','vineyard','grapes','tree'],'열왕기상 21:1–3','determined',['왕이 원해도 이 포도원만은 내줄 수 없어. 조상에게서 받은 기업이니까.','더 좋은 땅보다 내가 지켜 온 이 유산이 소중해.']],
 ['야곱','gen',28,['stone','bed'],'창세기 28:10–15','worried',['낯선 곳에서 밤을 맞았구나. 오늘은 2돌을 베고 몸을 누여야겠어.','집을 떠나 혼자 누우니 앞날이 두렵구나.']],
 ['리브가','gen',24,['well','water','pitcher'],'창세기 24:18–20','gentle',['먼 길 온 낙타들도 목이 마르겠지. 다 마실 때까지 내가 물을 길어 주자.','팔은 고되지만 빈 물통을 보고 그냥 돌아설 수는 없겠어.']],
 ['룻','rut',2,['field','barley','grain'],'룻기 2:2–18','determined',['한 줌이라도 더 주워야 어머니와 저녁을 먹을 수 있어.','낯선 밭에서 쫓겨날까 떨렸는데, 여기서 이삭을 주워도 된다니 다행이야.']],
 ['보아스','rut',2,['field','barley','grain'],'룻기 2:8–16','gentle',['룻이 빈손으로 돌아가게 둘 수는 없지. 일꾼들에게 이삭을 남겨 두라 해야겠군.','낯선 땅까지 와서 시어머니를 돌보다니. 내 밭에서는 안심하고 일하게 해 주자.']],
 ['모세','exo',3,['bush'],'출애굽기 3:2–12','worried',['불 속에서도 나무가 사라지지 않다니. 저기서 나를 부르시는구나.','내가 누구이기에 바로 앞에 서겠습니까? 함께하신다는 말씀을 붙들겠습니다.']],
 ['다윗','1sa',17,['stone','sling'],'사무엘상 17:40–47','determined',['갑옷은 내 몸에 익지 않아. 이 물매와 돌을 들고 여호와를 의지하자.','저 사람이 하나님의 군대를 모욕하게 둘 수 없어. 내가 나아가겠어.']],
 ['다윗','1sa',16,['lyre','harp'],'사무엘상 16:23','gentle',['왕의 괴로운 숨이 조금이라도 잦아들면 좋겠구나. 수금 줄을 조심히 뜯자.']],
 ['요셉','gen',37,['cloak','robe'],'창세기 37:3–4','worried',['아버지가 주신 옷인데, 형들은 나를 볼 때마다 얼굴을 돌리는구나.']],
 ['엘리사','2ki',2,['cloak'],'열왕기하 2:13–14','determined',['스승은 떠나셨고 겉옷만 내 손에 남았구나. 여호와여, 저와도 함께해 주십시오.']],
 ['선지자 제자의 아내','2ki',4,['oil','olive-oil','jar'],'열왕기하 4:1–7','worried',['빚 때문에 아들들마저 빼앗길 수는 없어. 말씀하신 대로 빈 그릇에 부어 보자.']],
 ['요시야','2ki',22,['scroll','book'],'열왕기하 22:10–13','sad',['이 말씀을 어기며 살아왔구나. 옷을 찢을 만큼 두렵고 부끄럽다.']],
 ['바룩','jer',36,['scroll','book','pen'],'예레미야 36:4–8','determined',['백성이 경고를 듣고 돌아오면 좋겠어. 불러 주는 말씀을 빠짐없이 적자.']],
 ['요나','jnh',4,['tree','gourd'],'요나 4:6–11','angry',['이 그늘이 사라지니 견딜 수가 없구나. 내가 아끼던 넝쿨인데.']],
 ['삭개오','luk',19,['tree','fig-tree'],'누가복음 19:3–6','determined',['사람들 틈에선 예수님이 보이지 않아. 나무에 올라서라도 뵙고 싶어.']],
 ['사마리아 여자','jhn',4,['water','well','jar'],'요한복음 4:9–15','surprised',['늘 물을 길으러 왔는데, 다시 목마르지 않을 물을 주신다니. 그 물을 얻고 싶어.']],
 ['히스기야','2ki',19,['letter','scroll'],'열왕기하 19:14–19','worried',['이 편지는 우리를 겁주지만, 주님 앞에 펼쳐 놓겠습니다. 이 성을 구해 주십시오.']],
 ['한나','1sa',1,['bench','altar'],'사무엘상 1:9–18','sad',['말로 다 꺼낼 수 없는 서러움이 쌓였구나. 주님, 제 간구를 들어 주세요.']],
 ['베드로','luk',5,['net','boat'],'누가복음 5:4–11','worried',['밤새 그물질해도 빈손이었지. 그래도 주님 말씀에 다시 그물을 내리자.']],
 ['다니엘','dan',6,['house','window','bench'],'다니엘 6:10–11','determined',['기도하면 사자 굴에 던져진다 해도, 늘 하던 감사를 멈출 수는 없어.']],
];
const everyday={
 tree:[['햇볕에 지친 몸을 이 그늘에서 잠깐 쉬게 하자.','gentle'],['가지 끝의 열매가 잘 익었는지 손을 뻗어 보자.','neutral']],
 water:[['갈증 때문에 목이 타는구나. 물 한 모금 마시고 힘을 내자.','gentle'],['내가 마신 뒤에는 다른 이에게도 물을 나눠 주자.','gentle']],
 well:[['빈 물동이를 채워야겠어. 줄이 미끄러지지 않게 단단히 잡자.','determined']],
 bench:[['지친 다리에 잠깐 쉼을 주자. 숨을 고르고 다시 일어나야지.','gentle']],
 bed:[['오늘은 몸이 무겁구나. 이 자리에 누워 잠시 눈을 붙이자.','gentle']],
 field:[['이삭을 허투루 버릴 수 없지. 오늘 먹을 양식을 부지런히 모으자.','determined']],
 scroll:[['흘려듣고 잊지 않도록 이 글을 마음에 새겨야겠어.','determined']],
 cloth:[['풀어진 옷자락을 여미자. 다시 길을 나서려면 채비를 해야지.','neutral']],
 wear:[['몸에 잘 맞게 고쳐 입자. 맡은 일을 할 준비가 필요하겠어.','neutral']],
 food:[['허기진 몸에 힘이 돌아오는구나. 이 양식을 감사히 먹자.','gentle']],
 oil:[['이 귀한 기름을 쏟지 않도록 조심해서 따라야겠어.','determined']],
 instrument:[['마음에 쌓인 말을 이 가락에 실어 보자.','gentle']],
 rope:[['풀려 버리면 위험하겠어. 매듭을 단단히 묶어 두자.','determined']],
 weapon:[['손이 떨리지 않게 자세를 잡자. 겨눈 곳을 끝까지 보아야겠어.','determined']],
 cooking:[['함께 먹을 이들을 생각하니 서둘러 준비하고 싶구나.','gentle']],
 table:[['빈손으로 돌아갈 이가 없도록 함께 먹을 자리를 차리자.','gentle']],
 animal:[['내 움직임에 놀라지 않도록 천천히 다가가야겠어.','gentle']],
 building:[['이 벽 아래서 잠깐 숨을 돌리자. 다시 나설 힘을 모아야지.','gentle']],
 altar:[['제단 앞에 내놓을 것을 준비하자. 이 자리를 허투루 대할 수는 없어.','determined']],
 stone:[['손에 쥐니 제법 무겁구나. 다치지 않게 조심해서 옮기자.','neutral']],
 tool:[['헐거워진 곳을 고쳐야겠어. 내 손으로 맡은 일을 마무리하자.','determined']],
 treasure:[['작은 것 하나도 잃지 않도록 손안의 것을 차례로 세어 보자.','neutral']],
 basket:[['필요한 것을 담아 두자. 빈손으로 길을 나설 수는 없지.','determined']],
 net:[['이 찢어진 곳을 기워야 다시 그물을 펼 수 있겠어.','determined']],
 lamp:[['불이 꺼지면 앞이 보이지 않겠지. 심지를 조심히 다듬자.','neutral']],
 bush:[['발걸음을 멈추게 하는구나. 조금 더 가까이 가서 보자.','surprised']],
 boat:[['흔들리는 배에서 균형을 잡자. 건너편에 무사히 닿고 싶구나.','worried']],
 cart:[['고삐를 놓치지 않게 잡자. 덜컹거려도 몸을 단단히 지탱해야지.','determined']],
 chest:[['맡겨 둔 것이 빠지지 않았는지 차례로 확인해야겠어.','neutral']],
 symbol:[['이것을 보니 내가 마음에 두었던 일이 다시 떠오르는구나.','neutral']],
};
export function objectMonologue(n,kind,chapters=[],{random=Math.random}={}){
 if(n?.creature)return null;
 const own=chapters.filter(c=>!n?.refs?.length||n.refs.includes(`${c.name||c.code} ${c.chap}${c.code==='psa'?'편':'장'}`));
 const specific=OBJECT_MONOLOGUES.find(([name,code,chap,kinds])=>(n?.name===name||(name==='예수'&&n?.name==='예수님'))&&kinds.includes(kind)&&own.some(c=>c.code===code&&Number(c.chap)===chap));
 if(specific){const [,,,,ref,emotion,lines]=specific;return {text:lines[Math.floor(random()*lines.length)],ref,emotion,origin:'object-authored'};}
 const category=objectBehavior(kind).category,lines=everyday[category]||everyday.tool;
 const [text,emotion]=lines[Math.floor(random()*lines.length)];return {text,emotion,origin:'object-daily'};
}
