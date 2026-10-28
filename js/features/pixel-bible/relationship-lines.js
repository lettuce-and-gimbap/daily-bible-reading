import {resolveIdentity} from './identity.js';
import {PAIR_DIALOGUE} from './pair-dialogue.js';

const sameName=(a,b)=>a===b||['예수','예수님'].includes(a)&&['예수','예수님'].includes(b);
const CHILD_CONFLICT=[
 '아버지, 저는 백성을 다치게 할 선택에는 동의할 수 없습니다. 제가 본 위험과 판단 근거를 먼저 말씀드리겠습니다.',
 '제 선택이 아버지께 걱정을 끼친 것은 압니다. 제가 확인한 사실과 판단 이유를 설명드리고 그 선택의 책임도 지겠습니다.',
 '아버지, 저는 백성을 더는 다치게 해서는 안 된다고 생각합니다. 제가 본 위험을 말씀드리겠습니다.',
 '어머니의 뜻을 가볍게 여기지 않습니다. 백성이 다칠 위험이 있는 선택이라면 피해를 막을 길을 함께 찾아 주십시오.',
 '아버지, 저는 물러서지 않겠습니다. 다만 아버지께서 염려하시는 이유도 듣고, 제 판단을 차분히 설명드리겠습니다.',
 '아버지, 제 행동이 잘못이었다면 바로잡겠습니다. 먼저 제가 책임져야 할 일이 무엇인지 말씀해 주십시오.',
 '어머니, 백성이 입은 피해를 덮고 지나갈 수 없습니다. 누가 무엇을 잃었는지 함께 확인해 주십시오.',
 '아버지, 저는 아버지와 맞서려는 것이 아닙니다. 백성을 지킬 방법을 찾으려는 것이니 제 말을 끝까지 들어 주십시오.',
 '어머니, 제 생각과 어머니의 판단이 다르다는 것을 압니다. 제가 본 사실을 말씀드린 뒤 함께 결정해 주십시오.',
 '아버지, 제 뜻을 꺾으라고만 하지 말고 제가 본 근거를 살펴 주십시오. 선택에 따른 책임은 제가 지겠습니다.',
];
function contextualLine(speaker,relation){
 if(relation.from.code==='neh'&&relation.from.chap===3){
  if(speaker.name==='하눈')return '골짜기 문은 세웠어. 샘문 쪽은 어떻게 됐어?';
  if(speaker.name==='살룬')return '샘문도 수리했어. 이제 함께 성벽을 이어가자.';
 }
 return null;
}
const EXCHANGES={
 parent:[
  ['아들아, 네가 맡은 일을 끝까지 살피되 무엇보다 옳은 길을 택하여라.','아버지, 그 가르침을 따르겠습니다. 다만 제가 감당할 몫도 제게 맡겨 주십시오.'],
  ['딸아, 네 뜻을 듣고 싶구나. 내가 정한 길을 그대로 따르라고만 하진 않겠다.','아버지, 제 마음을 먼저 물어 주셔서 감사합니다. 제가 본 일을 말씀드리겠습니다.'],
  ['내가 살아온 날들에서 배운 것을 네게 전하고 싶다. 네가 직접 판단하되 결과도 책임져라.','아버지, 제 선택을 책임지겠습니다. 잘못을 보시면 숨기지 말고 일러 주십시오.'],
  ['네가 집안의 일을 맡게 되었으니 형제들을 홀로 두지 말고 함께 의논하여라.','아버지, 형제들과 먼저 의논하겠습니다. 혼자 결정하지 않겠습니다.'],
  ['내가 너를 지키려 해도 네 몫까지 대신 살 수는 없다. 이제 네가 직접 걸어야 한다.','아버지, 두려워도 제가 걸어가겠습니다. 필요한 때에는 지혜를 구하겠습니다.'],
  ['네가 반대하는 까닭을 듣겠다. 가족이라는 이유로 네 말을 막지는 않으마.','아버지, 백성이 다칠 위험을 먼저 살펴 주십시오. 제가 걱정하는 까닭과 피해를 막을 방법을 말씀드리겠습니다.'],
  ['네가 내 뜻과 다르게 결정해도, 그 까닭을 내게 숨기지 말아라.','아버지, 숨기지 않겠습니다. 제 판단이 다르다면 근거를 말씀드리겠습니다.'],
  ['네가 맡은 책임을 혼자 지게 하지 않겠다. 네 곁에서 내가 할 몫을 함께 맡으마.','아버지, 제 책임을 함께 나눠 주셔서 힘이 됩니다. 저도 맡은 몫을 다하겠습니다.'],
  ['네가 잘한 일은 네 몫으로 기뻐하마. 잘못한 일은 함께 바로잡자.','아버지, 칭찬만 바라지 않고 잘못도 고치겠습니다. 함께 살펴 주십시오.'],
  ['내가 너를 사랑한다고 해서 네 모든 선택을 옳다 하지는 않겠다. 바른 길을 함께 찾자.','아버지, 듣기 좋은 말보다 바른 말을 해주십시오. 저도 제 생각을 솔직히 말씀드리겠습니다.'],
 ],
 child:[
  ['아버지, 제게 맡겨진 일을 감당하겠습니다. 어디서부터 시작할지 함께 살펴 주십시오.','아들아, 먼저 해야 할 일을 정하고 그 뒤에 네가 책임지고 이어가거라.'],
  ['아버지, 제 마음을 먼저 들어 주십시오. 저도 집안을 걱정하지만 생각은 다를 수 있습니다.','말해 보아라, 딸아. 네가 본 것을 듣고 함께 판단하겠다.'],
  ['아버지, 제게 맡겨진 몫은 제가 직접 정하고 책임지고 싶습니다.','좋다. 네가 맡은 몫은 네가 정하되, 그 선택으로 생기는 책임을 피하지 말고 감당하여라.'],
  ['아버지, 형제들을 혼자 두지 않겠습니다. 함께 의논할 자리를 마련하겠습니다.','그렇게 하여라. 집안의 일은 서로 듣고 뜻을 모아야 한다.'],
  ['아버지, 두렵지만 제 몫을 피하지 않겠습니다. 먼저 제가 할 일을 알려 주십시오.','네가 걸어야 할 길이다. 내가 곁에서 돕되 네 발로 걸어가야 한다.'],
  ['아버지, 백성이 다칠 위험이 있어 반대합니다. 제가 확인한 사실과 염려하는 까닭을 말씀드리겠습니다.','네 말을 막지 않겠다. 누가 어떤 피해를 입을지와 그 근거를 차례로 말해 보아라.'],
  ['아버지, 숨기지 않겠습니다. 제 판단은 다르며 그 이유를 말씀드리겠습니다.','네 생각을 듣겠다. 서로 다른 판단도 근거를 놓고 살펴보자.'],
  ['아버지, 혼자 감당해야 한다고 생각했는데 곁에서 도와주신다니 힘이 됩니다.','아들아, 네 몫을 내가 대신할 순 없어도 함께 책임질 수는 있다.'],
  ['아버지, 잘한 일은 기뻐하고 잘못은 고치겠습니다. 제게도 말할 기회를 주십시오.','그래. 칭찬과 책망 모두 네가 바로 서도록 하려는 것이다.'],
  ['아버지, 듣기 좋은 말만 바라지 않겠습니다. 제게도 솔직히 말해 주십시오.','딸아, 나도 네게 솔직하마. 서로 바른 말을 하며 길을 찾자.'],
 ],
 siblingOlder:[
  ['동생아, 내 말만 따르라는 뜻은 아니다. 네가 본 것을 먼저 들려다오.','형, 제 생각을 말하겠습니다. 형도 제 의견을 가볍게 넘기지 말아 주세요.'],
  ['네가 혼자 책임지게 두지 않겠다. 이번 일은 내가 앞에 서고 너도 곁을 지켜 다오.','형, 돕겠습니다. 하지만 제 몫도 맡겨 주세요. 함께 해내고 싶습니다.'],
  ['동생아, 우리가 다투더라도 밖에서 서로를 버리지는 말자.','형, 저도 형을 외면하지 않겠습니다. 다만 잘못한 일은 서로 말합시다.'],
  ['네가 어리다고 네 판단까지 무시하지 않으마. 네가 본 위험과 그 근거를 말해 보아라.','형, 제가 걱정하는 것은 동생들이 위험을 혼자 떠안는 일입니다. 제게도 지킬 몫을 맡겨 주세요.'],
  ['내가 먼저 나섰다가 잘못을 만들었다면 숨기지 않고 너와 바로잡겠다.','형, 잘못을 인정해 줘서 다행입니다. 저도 제 몫을 피하지 않겠습니다.'],
  ['동생아, 네가 맡은 자리를 지켜라. 내가 필요한 곳에서 힘을 보태겠다.','형, 맡은 일을 하겠습니다. 형도 위험을 혼자 짊어지지 마세요.'],
  ['우리가 같은 집에서 자랐다고 늘 같은 뜻일 수는 없지. 그래도 끝까지 이야기하자.','맞아요, 형. 제 생각이 다르더라도 대화를 끊지 말아 주세요.'],
  ['네가 두려워하는 걸 안다. 그래도 결정은 네가 이해한 뒤 함께 내리자.','형, 제게 설명해 주십시오. 납득하면 책임지고 따르겠습니다.'],
  ['내가 형이라고 해서 네 몫까지 정하지는 않겠다. 네 뜻을 분명히 말해라.','형, 저도 제 뜻을 숨기지 않겠습니다. 함께 결정할 수 있게 들어 주세요.'],
  ['이번에는 네가 앞장서라. 내가 뒤에서 살피며 네가 어려울 때 돕겠다.','형, 믿고 맡겨 주셔서 고맙습니다. 필요하면 바로 도움을 청하겠습니다.'],
 ],
 siblingYounger:[
  ['형, 제 말도 먼저 들어 주세요. 형이 정한 길이라도 제가 본 위험은 말씀드려야겠습니다.','말해 보아라. 네가 본 것을 듣고 내 판단도 다시 살피겠다.'],
  ['형, 혼자 앞에 서지 마세요. 제게도 함께 책임질 몫을 맡겨 주세요.','좋다. 네 몫을 맡기겠다. 위험한 일은 서로 알려 가며 하자.'],
  ['형, 다투더라도 밖에서 서로를 버리지 않겠습니다. 잘못은 집안에서 바로잡읍시다.','나도 너를 외면하지 않겠다. 네가 말하는 잘못은 피하지 않고 듣겠다.'],
  ['형, 제가 어린 동생이라도 제 판단이 늘 틀린 것은 아닙니다. 우리 가족이 감당할 책임을 다르게 보고 있습니다.','네 판단을 무시하지 않겠다. 가족의 책임을 어떻게 나누어야 한다고 생각하는지 설명해 보아라.'],
  ['형, 잘못을 인정한 건 고맙습니다. 저도 제가 한 일을 돌아보겠습니다.','나도 네 몫을 탓하기 전에 내 선택부터 바로잡겠다.'],
  ['형, 맡은 일을 하겠습니다. 형도 위험을 혼자 짊어지지 말고 함께 움직여요.','그래, 서로 형편을 알리며 맡은 자리를 지키자.'],
  ['형, 우리가 같은 뜻은 아니어도 이야기까지 끊지는 말아요.','알겠다. 다른 생각을 들어야 함께 갈 길을 찾을 수 있다.'],
  ['형, 제가 맡아야 할 책임과 그 까닭을 설명해 주세요. 이해하고 제 몫을 다하고 싶습니다.','내가 본 까닭을 말하마. 네가 맡을 몫에 동의하기 어렵다면 다시 의논하자.'],
  ['형, 형이라는 이유로 제 몫을 대신 정하지 마세요. 제 생각도 함께 결정에 넣어 주세요.','옳은 말이다. 네 뜻을 듣고 나서 함께 정하겠다.'],
  ['형, 이번에는 제가 앞에 서겠습니다. 형은 뒤에서 살펴봐 주세요.','네가 앞장서면 내가 곁에서 지키겠다. 위험하면 곧바로 알려라.'],
 ],
 sibling:[
  ['우리가 의견이 달라도 서로 탓하기 전에 각자 확인한 사실부터 나누자. 네 생각은 어때?','나도 피하지 않겠어. 내가 확인한 사실을 말하고 네 설명도 끝까지 듣겠어.'],
  ['내가 네 말을 오해했을지 모르겠다. 네가 어떤 사실을 근거로 판단했는지 직접 듣고 싶어.','내가 확인한 사실과 판단 이유를 말할게. 네가 본 사실도 들려줘. 서로 확인하자.'],
  ['우리 집안의 일을 남에게 맡기기 전에 먼저 둘이 이야기하자.','좋아. 네가 걱정하는 점부터 말해 줘. 나도 숨기지 않을게.'],
  ['네가 맡은 몫은 내가 존중하겠다. 대신 내 몫도 네가 가볍게 보지 말아 줘.','알겠어. 서로 맡은 일을 인정하고 필요한 건 바로 부탁하자.'],
  ['우리 가운데 누군가 잘못했으면 다른 사람은 덮지 말고 함께 바로잡아야 하오.','그래. 감싸기만 하지 말고 잘못을 말해 주는 사이가 되자.'],
  ['네가 어려울 때 먼저 손을 내밀겠다. 나도 힘들면 너에게 숨기지 않겠다.','나도 그러겠다. 서로 짐을 나누되 각자 책임도 다하자.'],
  ['같은 말을 들어도 마음에 남는 뜻은 다를 수 있어. 네가 어떻게 받아들였는지 말해 줘.','나는 그 말을 이렇게 받아들였어. 네 생각과 다른 점을 서로 설명해 보자.'],
  ['이번 결정에 네가 빠져서는 안 돼. 우리 둘 다 영향을 받으니까.','내 의견을 묻는다면 말할게. 네가 결정하기 전에 꼭 들어 줘.'],
  ['지난 일을 다시 들추려는 게 아니야. 같은 잘못이 되풀이되지 않게 짚자는 거야.','그렇다면 피하지 않겠어. 내가 무엇을 고쳐야 하는지 말해 줘.'],
  ['네가 먼저 양보하라고만 하진 않겠다. 서로 한 걸음씩 물러날 수 있는지 보자.','나도 내 주장만 고집하지 않겠다. 네가 지킬 몫도 함께 생각하자.'],
 ],
 couple:[
  ['여보, 우리 가족의 앞날을 정하는 일을 당신 혼자 감당하게 두고 싶지 않아요. 우리가 함께 의논해요.','나도 가족의 앞날을 혼자 정하고 싶지 않아요. 당신 생각을 듣고 내 마음도 말할게요.'],
  ['당신이 걱정하는 걸 알아요. 먼저 무엇이 가장 두려운지 말해 줄래요?','가족이 다칠까 봐 두려워요. 당신과 함께라면 방법을 찾고 싶어요.'],
  ['내 뜻을 강요하지 않을게요. 당신이 본 형편을 듣고 다시 판단하겠어요.','고마워요. 나도 당신의 책임을 가볍게 여기지 않고 함께 살필게요.'],
  ['아이들 앞에서 서로 탓하기보다 먼저 둘이 해결할 일을 정합시다.','좋아요. 서로의 잘못을 인정하고 아이들에게도 같은 말을 전해요.'],
  ['내가 침묵해서 당신을 외롭게 했다면 미안해요. 지금부터는 함께 말해요.','나도 마음을 숨기지 않을게요. 오늘은 서로 끝까지 들어 줍시다.'],
  ['당신의 선택에 동의하지 않아도 당신을 존중하며 이유를 말할게요.','나도 반대만 하지 않고 당신이 걱정하는 것을 먼저 살필게요.'],
  ['이 집의 평안을 당신 혼자 책임지는 것은 아니에요. 내 몫을 나누어 주세요.','당신이 함께 맡아 주면 든든해요. 나도 내가 할 일을 분명히 할게요.'],
  ['당신이 해 온 수고를 당연하게 여기지 않겠어요. 필요한 것을 말해 주세요.','고마워요. 당신의 수고도 알아요. 서로 쉬어 갈 자리를 마련해요.'],
  ['우리 형편이 달라졌으니 예전 방식만 고집하지 말고 새로 의논해요.','맞아요. 당신과 다시 상의하고 우리에게 맞는 길을 정하고 싶어요.'],
  ['내가 옳다는 것을 증명하기보다 우리 둘이 지킬 약속을 먼저 세웁시다.','그 약속을 함께 지켜요. 어려워지면 숨기지 말고 다시 이야기해요.'],
 ],
 conflict:[
  ['네 선택으로 내가 입은 피해를 모른 척할 수는 없다. 무엇을 잃었는지와 네가 그렇게 판단한 까닭을 말해라.','내 판단이 너를 해친 것은 사실이다. 내가 한 행동과 그 까닭을 밝히고 책임을 피하지 않겠다.'],
  ['내게 굴복하라고만 하지 마라. 네가 요구하는 것이 옳은지 먼저 답해라.','네가 따르지 않는다고 해서 물러서진 않겠다. 하지만 내 요구의 근거는 밝히겠다.'],
  ['네 말은 약속과 다르다. 무엇을 믿고 함께하라는 거냐?','내가 약속을 어긴 일은 인정한다. 지금 행동으로 신뢰를 다시 얻겠다.'],
  ['내 재산을 허락 없이 가져가고도 정당하다고 말하느냐? 가져간 재산을 돌려놓을 생각은 없느냐?','네 재산을 가져간 일은 인정한다. 내가 그렇게 한 까닭을 설명하되, 돌려줄 책임도 피하지 않겠다.'],
  ['그 위협으로 나를 물러서게 할 수는 없다. 더는 백성을 해치지 마라.','내가 멈추면 내 뜻을 거스르는 셈이다. 네가 막으면 그 결과도 감당해야 한다.'],
  ['네가 먼저 싸움을 시작했다고 내 행동까지 옳아지는 건 아니다. 여기서 멈추자.','네가 피해자인 척하는 건 받아들일 수 없다. 먼저 네가 한 일부터 답해라.'],
  ['네가 넘기라고 한 사람들을 내놓지 않겠다. 그들은 물건이 아니라 보호받아야 할 사람들이다.','내가 그 사람들을 넘기라고 명령했는데도 숨기겠다는 것이냐? 그들을 감춘 책임을 네가 져야 한다.'],
  ['내게 죄를 씌워 왕의 신임을 얻으려 하지 마라. 네가 꾸민 일을 알고 있다.','네가 무엇을 안다고 말하는지 밝히라. 근거 없이 나를 몰아세우지 마라.'],
  ['오늘은 싸움을 멈추겠다. 그러나 이 일을 덮지도, 네가 내게 입힌 피해에 책임을 묻지 않은 채 지나가지도 않겠다.','나도 싸움은 멈추겠지만, 네가 입힌 피해를 어떻게 바로잡을지 답해야 한다.'],
  ['서로 원수로 만든 일을 끝내려면 네가 먼저 멈춰야 한다. 다음 선택은 네게 달렸다.','나만 물러나라고 하지 마라. 네가 먼저 손을 거두면 나도 더는 맞서지 않겠다.'],
 ],
 ally:[
  ['네가 맡은 자리가 흔들리면 내가 돕겠다. 내 쪽이 어렵다면 너도 와 다오.','약속하겠다. 네가 부르면 가고, 내가 도움이 필요할 때도 숨기지 않겠다.'],
  ['우리가 함께 맡은 책임을 혼자 감당할 수 없다. 네 몫과 내 몫을 지금 나누자.','좋아. 나는 정해진 내 몫을 맡겠다. 진행 상황과 필요한 지원을 서로 바로 알리자.'],
  ['상황이 나빠져도 먼저 서로에게 알리자. 뒤늦게 소식을 듣고 싶지 않다.','그렇게 하겠다. 숨기지 않고 알릴 테니 너도 혼자 결정하지 마라.'],
  ['네가 내 편을 들어 준 일을 당연하게 여기지 않겠다. 다음에는 내가 네 곁에 서겠다.','고맙다. 보답을 바라서 한 일은 아니지만 함께할 수 있어 든든하다.'],
  ['우리 뜻이 같다면 말만 맞추지 말고 실제로 함께 움직이자.','내가 맡은 일을 시작하겠다. 네가 약속한 자리도 지켜 줘.'],
  ['네가 잘못을 지적하면 듣겠다. 내게 필요한 동료는 맞장구만 치는 사람이 아니다.','나도 네게 솔직히 말하겠다. 서로를 세우는 말을 하자.'],
  ['길이 갈라져도 지금 맡은 약속은 끝까지 지키겠다.','나도 약속을 지키겠다. 일이 끝날 때까지 네 곁을 떠나지 않겠다.'],
  ['네가 위험을 감수할 때 나도 같은 무게를 나누겠다.','혼자 영광을 차지하지 말고 함께 책임지자. 네가 앞서면 내가 지키겠다.'],
  ['내가 네 곁에서 도울 수 있는 일을 말해 줘. 함께할 사람이나 물자가 필요하면 무엇이 필요한지도 알려 주겠소.','지금 필요한 도움은 함께할 동료와 쓸 물자요. 그 두 가지를 마련해 주면 맡은 일을 계속할 수 있소.'],
  ['우리가 함께 세운 일을 끝낸 뒤에도 네 공을 지우지 않겠다.','네 수고도 내가 기억하겠다. 우리 이름보다 함께 이룬 일을 지키자.'],
 ],
 other:[
  ['서로 맡은 책임과 진행 상황을 숨기지 말고 나눕시다. 그래야 빠진 일이 없는지 함께 확인할 수 있습니다.','제가 맡은 부분과 끝낸 일을 분명히 말씀드리겠습니다. 필요한 지원도 미리 부탁하겠습니다.'],
  ['혼자 감당하기 어려울 때는 곁에 있는 사람에게 도움을 청해야 하오. 내가 네 곁에서 함께하겠소.','고맙습니다. 지금 필요한 도움은 당신이 곁에 있어 주는 것입니다. 저도 당신이 힘들 때 곁을 지키겠습니다.'],
  ['함께 일하기 전에 서로 원하는 방향을 분명히 말하자. 네가 바라는 것은 무엇이냐?','나는 책임을 나누고 약속을 지키는 협력을 원한다. 네가 바라는 방향도 듣고 조정하자.'],
  ['네 설명만으로는 아직 이해되지 않는다. 어떤 사실을 근거로 판단했는지 알려 다오.','제가 확인한 사실과 판단 이유를 말씀드리겠습니다. 빠진 근거가 있으면 함께 확인합시다.'],
  ['중요한 결정을 혼자 내리지 말고 서로 먼저 상의합시다. 맡을 책임도 결정 전에 나눕시다.','저는 선택의 이유와 제게 맡길 책임을 먼저 묻겠습니다. 함께 정한 몫은 끝까지 감당하겠습니다.'],
  ['네가 시작한 계획을 내가 이어 맡았소. 무엇을 끝냈고 어떤 단계가 남았는지 확인해 주시오.','제가 끝낸 단계와 앞으로 할 일을 순서대로 말씀드리겠습니다. 빠진 부분도 함께 확인하겠습니다.'],
  ['네 일을 대신할 수는 없어도 함께할 사람과 시간을 마련할 수 있소. 어느 도움이 더 필요하오?','함께할 동료가 필요합니다. 제가 할 일과 일정을 정리해 제 몫은 책임지겠습니다.'],
  ['내가 들은 이야기와 네 설명이 다르다. 누가 무엇을 확인했는지 사실부터 맞춰 보자.','제가 직접 확인한 사실을 말씀드리겠습니다. 잘못 전해진 내용은 함께 바로잡읍시다.'],
  ['의견이 어긋난 까닭을 네 탓으로만 돌리고 싶지 않다. 네가 확인한 사실부터 듣겠다.','제가 확인한 사실을 말씀드리겠습니다. 함께 책임질 부분과 각자 바로잡을 부분을 나눕시다.'],
  ['같은 실수를 되풀이하지 않도록 우리가 지킬 약속을 분명히 정하자.','좋습니다. 제가 지킬 일과 당신이 지킬 일을 정하고, 약속한 때에 서로 확인하겠습니다.'],
 ],
};
function kinshipKind(a,b,relation){
 const label=relation.label||'',fromRole=relation.from.role||'',detail=relation.text||'';
 const isParent=r=>/아버지|어머니|부친|모친|아빠|엄마/.test(r);
 const isChild=r=>/아들|딸|자녀|손자|후손/.test(r);
 const sourceParent=isParent(label)||isParent(fromRole),sourceChild=isChild(label)||isChild(fromRole);
 if(sourceParent||sourceChild)return (a.name===relation.from.name?sourceParent:!sourceParent)?'parent':'child';
 const fromKin=`${label} ${fromRole}`;
 const sourceUncle=/삼촌|숙부|고모|이모/.test(fromKin),sourceNephew=/조카/.test(fromKin);
 if(sourceUncle||sourceNephew)return (a.name===relation.from.name?sourceUncle:!sourceUncle)?'uncle':'nephew';
 const elder=/맏|장자|맏형|형(?!제)|오빠|누나|언니/.test(`${label} ${fromRole}`);
 const younger=/동생|아우|둘째|막내/.test(`${label} ${fromRole}`);
 // Relation notes often spell out age order even when the graph label only
 // says "siblings" (for example, "Cain killed his younger brother Abel").
 const sourceNamedOlder=new RegExp(`${relation.from.name}[^.。]{0,64}(?:${relation.to.name}의\\s*(?:형|오빠|누나|언니)|(?:동생|아우)\\s*${relation.to.name})`).test(detail)||new RegExp(`(?:맏형|형|오빠|누나|언니)\\s*${relation.from.name}`).test(detail);
 const sourceNamedYounger=new RegExp(`${relation.from.name}[^.。]{0,64}(?:${relation.to.name}의\\s*(?:동생|아우)|(?:형|오빠|누나|언니)\\s*${relation.to.name})`).test(detail)||new RegExp(`(?:동생|아우)\\s*${relation.from.name}`).test(detail);
 const targetNamedOlder=new RegExp(`${relation.to.name}[^.。]{0,64}(?:${relation.from.name}의\\s*(?:형|오빠|누나|언니)|(?:동생|아우)\\s*${relation.from.name})`).test(detail)||new RegExp(`(?:맏형|형|오빠|누나|언니)\\s*${relation.to.name}`).test(detail);
 const targetNamedYounger=new RegExp(`${relation.to.name}[^.。]{0,64}(?:${relation.from.name}의\\s*(?:동생|아우)|(?:형|오빠|누나|언니)\\s*${relation.from.name})`).test(detail)||new RegExp(`(?:동생|아우)\\s*${relation.to.name}`).test(detail);
 const sourceIsOlder=elder||sourceNamedOlder||targetNamedYounger;
 const sourceIsYounger=younger||sourceNamedYounger||targetNamedOlder;
 if(sourceIsOlder||sourceIsYounger)return (a.name===relation.from.name?sourceIsOlder:!sourceIsOlder)?'siblingOlder':'siblingYounger';
 if(/아내|남편|부부|배필/.test(label+' '+fromRole+' '+relation.to.role))return 'couple';
 return 'sibling';
}
function relationshipFallback(a,b,relation,index){
 const basis=`${relation.label||''} ${relation.text||''} ${relation.from.role||''} ${relation.to.role||''}`;
 const familyBasis=`${relation.label||''} ${relation.from.role||''} ${relation.to.role||''}`;
 const targetName=String(relation.to?.name||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const explicitKinshipInNote=!!targetName&&new RegExp(`(?:형|오빠|누나|언니|동생|아우|조카|삼촌|숙부|고모|이모|아버지|어머니)\\s*${targetName}`).test(relation.text||'');
 const family=relation.kind==='family'||/형제|자매|아들|딸|아버지|어머니|아내|남편|부부|족보|후손|자손|친척|배필|손자|할아버지|형|누이|동생|삼촌|숙부|조카|고모|이모/.test(familyBasis)||explicitKinshipInNote;
 const conflict=relation.kind==='conflict'||/대적|원수|죽였|죽이|위협|배신|싸우|억압|속였|빼앗|저주|모욕/.test(basis);
 const kinship=family?kinshipKind(a,b,relation):'';
 let category='other';
 if(conflict)category='conflict';else if(family)category=kinshipKind(a,b,relation);else if(relation.kind==='ally')category='ally';
 const exchange=EXCHANGES[category]||EXCHANGES.other;
 const pair=exchange[index%exchange.length];
 const isFrom=a.name===relation.from.name;
 const kinshipBasis=`${relation.label||''} ${relation.from.role||''} ${relation.to.role||''}`;
 const childAddress=/딸/.test(kinshipBasis)?'딸아':'아들아';
 const parentAddress=/어머니|모친|엄마/.test(kinshipBasis)?'어머니':'아버지';
 const olderSiblingAddress=/언니/.test(kinshipBasis)?'언니':/누나|누이|자매/.test(kinshipBasis)?'누나':'형';
 const kinshipText=value=>value.replaceAll('아들아',childAddress).replaceAll('딸아',childAddress).replaceAll('아버지',parentAddress).replaceAll('형,',`${olderSiblingAddress},`);
 if(category==='uncle')return EXCHANGES.parent[index%EXCHANGES.parent.length][0].replaceAll('아들아','조카야').replaceAll('딸아','조카야');
 if(category==='nephew')return EXCHANGES.parent[index%EXCHANGES.parent.length][1].replaceAll('아버지','삼촌').replaceAll('아들아','조카').replaceAll('딸아','조카');
 if(category==='conflict'&&family){
  const address=kinship==='parent'?childAddress:kinship==='child'?parentAddress:kinship==='siblingOlder'?'동생아':kinship==='siblingYounger'?olderSiblingAddress:kinship==='uncle'?'조카야':kinship==='nephew'?'삼촌':kinship==='couple'?'여보':b.name;
  if(kinship==='child'){
   const parentIsMother=/어머니|모친|엄마/.test(kinshipBasis);
   const parent=parentIsMother?'어머니':'아버지';
   const line=CHILD_CONFLICT[index%CHILD_CONFLICT.length];
   return parentIsMother?line.replaceAll('아버지',parent):line.replaceAll('어머니',parent);
  }
  const line=isFrom?pair[0]:pair[1];
  return `${address}, ${kinshipText(line)}`;
 }
 if(category==='parent')return kinshipText(pair[0]);
 if(category==='child')return kinshipText(EXCHANGES.parent[index%EXCHANGES.parent.length][1]);
 if(category==='siblingOlder'||category==='siblingYounger')return kinshipText(pair[0]);
 if(category==='conflict'||category==='sibling'||category==='couple'||category==='ally'||category==='other')return isFrom?pair[0]:pair[1];
 return isFrom?pair[0]:pair[1];
}
const identityKey=n=>`${n.name}:${n.identity?.id||''}`;
// 관계도마다 쓴 대화: [relation.from의 말, relation.to의 답]. 장에 쓴 고유 대사보다 앞선다.
function relationTalkLines(a,b,relation,random){
 const talk=Array.isArray(relation.talk)?relation.talk.filter(p=>Array.isArray(p)&&p.length===2):[];
 if(!talk.length)return null;
 const index=Math.min(talk.length-1,Math.floor(random()*talk.length)),[first,reply]=talk[index];
 const aFirst=sameName(a.name,relation.from.name)||!!(a.identity?.id&&a.identity.id===relation.from.identity?.id),chapter=`${relation.from.code}.${relation.from.chap}`;
 // 관계의 출발 인물이 먼저 말하고 상대가 답한다.
 const [speaker,listener]=aFirst?[a,b]:[b,a];
 return [[speaker,listener,first],[listener,speaker,reply]].map(([speaker,target,text])=>({
  id:`relationship:${identityKey(speaker)}:${chapter}`,speaker,target,text,ref:relation.ref,lineDetail:'',
  detailText:`${relation.text||''} 관계와 본문 사건을 바탕으로 구성한 창작 대화입니다. (${relation.ref})`.trim(),
  kind:'pair',origin:'relation-talk',pairIndex:index,special:true,
 }));
}
export function relationshipLines(a,b,relation,_chapterLines,{random=Math.random}={}){
 const authoredTalk=relationTalkLines(a,b,relation,random);if(authoredTalk)return authoredTalk;
 const chapter=`${relation.from.code}.${relation.from.chap}`;
 const matches=(name,person)=>sameName(name,person.name)||!!(person.identity?.id&&resolveIdentity(name,{code:relation.from.code,chapter:relation.from.chap}).id===person.identity.id);
 const forward=PAIR_DIALOGUE.find(p=>p.chapter===chapter&&matches(p.speaker,a)&&matches(p.target,b));
 const reverse=PAIR_DIALOGUE.find(p=>p.chapter===chapter&&matches(p.speaker,b)&&matches(p.target,a));
 // Pick one shared variant for both speakers. Independent random picks made
 // otherwise related lines sound like two unrelated monologues.
 const variants=Math.max(forward?.lines?.length||0,reverse?.lines?.length||0,forward?.replyLines?.length||0,reverse?.replyLines?.length||0,forward||reverse?0:10);
 const index=variants?Math.min(variants-1,Math.floor(random()*variants)):0;
 const choose=(entry,reply=false)=>reply?(entry?.replyLines?.[index]||entry?.replyLines?.[0]):(entry?.lines?.[index]||entry?.lines?.[0]);
 const contextualA=contextualLine(a,relation),contextualB=contextualLine(b,relation);
 const fallbackA=relationshipFallback(a,b,relation,index),fallbackB=relationshipFallback(b,a,relation,index);
 const generated=!forward&&!reverse&&!contextualA&&!contextualB;
 const textA=forward?choose(forward):reverse?choose(reverse,true):contextualA||fallbackA;
 const textB=reverse?choose(reverse):forward?choose(forward,true):contextualB||fallbackB;
 return [
  {speaker:a,target:b,text:textA,entry:forward||reverse,ref:(forward||reverse)?.ref||relation.ref},
  {speaker:b,target:a,text:textB,entry:reverse||forward,ref:(reverse||forward)?.ref||relation.ref},
 ].map(({speaker,target,text,entry,ref})=>({
  id:`relationship:${identityKey(speaker)}:${chapter}`,speaker,target,text,
  ref,lineDetail:entry?.lineDetails?.[index]||'',detailText:[entry?.detail,relation.text,generated?'관계와 사건 설명을 바탕으로 구성한 짧은 창작 상호작용입니다.':null].filter(Boolean).join(' ') + ` (${relation.ref})`,kind:'pair',origin:generated?'chapter-relation':'authored',pairIndex:index,
  // Only an authored exchange or an explicitly event-specific contextual line
  // may be presented as a special interaction. Kinship alone is not dialogue.
  special:!!entry||!!contextualA||!!contextualB,
 }));
}

export function loveBoothExchange(a,b,relations){
 const endpointName=endpoint=>typeof endpoint==='string'?endpoint:endpoint?.name;
 const endpointMatches=(endpoint,person)=>{
  const identity=typeof endpoint==='object'?endpoint.identity?.id:null;
  if(!sameName(endpointName(endpoint),person.name)&&!(identity&&identity===person.identity?.id))return false;
  if(identity&&person.identity?.id&&identity!==person.identity.id)return false;
  const ref=typeof endpoint==='object'?endpoint.ref:null;
  return !ref||(person.refs||[]).some(personRef=>ref===personRef||ref.startsWith(`${personRef}:`));
 };
 const relation=(Array.isArray(relations)?relations:[]).find(r=>(endpointMatches(r.from,a)&&endpointMatches(r.to,b))||(endpointMatches(r.from,b)&&endpointMatches(r.to,a)));
 let lines=[];
 if(relation){
  const normalized={...relation,
   from:typeof relation.from==='string'?{name:relation.from}:relation.from,
   to:typeof relation.to==='string'?{name:relation.to}:relation.to,
  };
  try{lines=relationshipLines(a,b,normalized,null);}catch(_){lines=[];}
 }
 if(lines.length===2&&lines.every(line=>line.special))return {relation,lines,mode:'special'};
 // 관계가 있으면 관계 종류에 맞춘 대화를 쓰고, 어색한 인사는 관계가 없는 두 사람에게만 쓴다.
 if(relation&&lines.length===2)return {relation,lines,mode:'relation'};
 return {relation:relation||null,mode:'awkward',lines:[
  {speaker:a,target:b,text:'어… 안녕하세요.',kind:'pair'},
  {speaker:b,target:a,text:'응… 안녕하세요.',kind:'pair'},
 ]};
}
