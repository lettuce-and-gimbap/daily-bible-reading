// 원문 OCR은 이 클라우드에 없다. 확인 가능한 본문과 기존 장별 해설을 근거로 삼고,
// 정확히 기록되지 않은 색/장식/소품은 창작 구분을 유지한다. 주석 대조 시 이 목록에 근거를 추가한다.
const profile = (coat, hair, extra, evidence, design) => ({ coat, hair, ...extra, evidence, design });
export const APPEARANCES = {
  jesus: profile('#f6e9c4','#76503b',{name:'예수님',beard:'#76503b',halo:true,sash:'#c97f75'},'요한복음 19:23 · 통으로 짠 속옷.','후광과 붉은 띠는 인물을 알아보기 위한 상징 표현이에요.'),
  moses: profile('#83aebe','#eee9d1',{name:'모세',beard:'#eee9d1',staff:true,mantle:true},'출애굽기 4:2 · 손에 든 지팡이.','흰 수염과 푸른 겉옷 색은 창작 디자인이에요.'),
  elijah: profile('#a98458','#604938',{name:'엘리야',beard:'#604938',fur:true,belt:true,chariot:true},'열왕기하 1:8 · 털옷과 가죽 허리띠. 열왕기상 19:13, 19 · 겉옷.','털 질감과 허리띠를 살렸어요. 색과 머리 모양은 창작이에요.'),
  elisha: profile('#718b78','#6e5342',{name:'엘리사',beard:'#6e5342',bald:true,mantle:true},'열왕기하 2:13–14 · 엘리야의 겉옷을 집어 듦. 2:23 · 대머리라는 조롱.','넓게 드러난 이마와 물려받은 겉옷으로 구분해요. 색은 창작이에요.'),
  jezebel: profile('#7e467f','#342e39',{name:'이세벨',updo:true,eyeliner:true,jewels:true,trim:'#d7b25c'},'열왕기하 9:30 · 눈을 그리고 머리를 꾸밈.','다른 시점의 기록도 참고한 인물 상징 디자인이에요. 자주색과 장식 모양은 창작이에요.'),
  ahab: profile('#8d4645','#5d4439',{name:'아합',beard:'#5d4439',crown:true,royal:true,trim:'#dab567'},'열왕기상 21:1 · 이스라엘 왕. 22:30 · 전투 때는 변장함.','왕이라는 신분을 왕관·겉옷으로 표시해요. 모든 장면에서 이 차림이었다는 뜻은 아니에요.'),
  jehoshaphat: profile('#4c7298','#644a36',{name:'여호사밧',beard:'#644a36',crown:true,royal:true,trim:'#ede1ac'},'열왕기상 22:30 · 왕복을 입음.','푸른 왕복과 왕관 모양은 창작이에요.'),
  benhadad: profile('#69728b','#624b38',{name:'벤하닷',beard:'#624b38',turban:true,royal:true,trim:'#d8b274'},'열왕기상 20:1 · 아람 왕으로 여러 왕과 군대를 이끎.','머리 두건과 겉옷 장식은 아람 왕을 구별하기 위한 창작이며 복식 고증을 확정한 것은 아니에요.'),
  naboth: profile('#a98260','#66503b',{name:'나봇',beard:'#66503b',vest:true,grapes:true},'열왕기상 21:1–3 · 조상에게서 물려받은 포도원.','포도 바구니는 포도원 주인을 알아보기 위한 상징 소품이에요. 의복 색은 창작이에요.'),
  micaiah: profile('#d7c9a7','#534335',{name:'미가야',beard:'#534335',mantle:true,scroll:true},'열왕기상 22:13–14 · 여호와의 말씀만 전하겠다는 선지자.','수수한 겉옷과 두루마리는 선지자라는 역할을 표현한 창작이에요.'),
  ahaziah: profile('#576280','#614a39',{name:'아하시야',royal:true,crown:true,sash:'#987eae'},'열왕기하 1:2 · 아합의 아들 아하시야 왕.','짧은 왕관과 긴 겉옷은 왕자·왕의 신분을 구별하는 창작이에요.'),
  angel: profile('#eee9cc','#e0cb8e',{name:'천사',glow:true,sash:'#b3d5ce'},'열왕기상 19:5–7 · 엘리야를 깨우는 천사.','빛과 밝은 옷은 하나님의 사자라는 역할의 상징이며 본문에 적힌 외모의 재현은 아니에요.'),
  ruth: profile('#af91bf','#65503f',{name:'룻',hood:true,apron:true,grain:true},'룻기 2:2–3, 17 · 이삭을 줍고 보리를 떪.','작업 앞치마·머릿수건·색은 창작이에요. 작은 보리 묶음으로 알아볼 수 있어요.'),
  boaz: profile('#658a77','#795a43',{name:'보아스',beard:'#795a43',mantle:true,belt:true,trim:'#c9b276'},'룻기 2:1, 4 · 유력한 친족이며 밭에 와 일꾼들과 인사함.','넓은 겉옷과 무늬는 지주라는 역할을 표현한 창작이에요.'),
  naomi: profile('#666a85','#dad2c4',{name:'나오미',hood:true,shawl:true},'룻기 1:12 · 나이 듦을 말함.','회색 머릿수건과 어깨 숄은 창작이에요.'),
  john: profile('#ac8c5c','#59412e',{name:'세례 요한',fur:true,belt:true,beard:'#59412e'},'마태복음 3:4 · 낙타털 옷과 가죽띠.','색과 머리 모양은 창작이에요.'),
  joseph: profile('#bb8c63','#594636',{name:'요셉',pattern:true,sash:'#aa6477'},'창세기 37:3 · 특별한 옷을 입혀 줌.','옷감의 실제 색 배열은 확정하지 않고 무늬로 구별해요.'),
  david: profile('#8a9a69','#6e4b36',{name:'다윗',lyre:true},'사무엘상 16:23 · 수금을 탐.','수금은 인물의 특징을 알아보기 위한 소품이에요.'),
  peter: profile('#839d98','#5a4939',{name:'베드로',beard:'#5a4939',net:true},'마태복음 4:18 · 그물을 던지는 어부.','그물은 인물의 배경을 표현한 소품이에요.'),
  worker: profile('#cfac6a','#8f6c42',{name:'일꾼',headband:true,vest:true},'룻기 2:4 · 밭의 추수하는 일꾼들.','머리띠와 작업 조끼는 창작이에요.'),
};
const NAMES = {'예수':'jesus','예수님':'jesus','그리스도':'jesus','모세':'moses','엘리야':'elijah','엘리사':'elisha','이세벨':'jezebel','아합':'ahab','여호사밧':'jehoshaphat','벤하닷':'benhadad','나봇':'naboth','미가야':'micaiah','아하시야':'ahaziah','천사':'angel','룻':'ruth','보아스':'boaz','나오미':'naomi','세례 요한':'john','요셉':'joseph','다윗':'david','베드로':'peter','일꾼':'worker'};
export function appearanceFor(name, index=0, role='') {
  const key=NAMES[name] || (name.startsWith('아하시야(')?'ahaziah':null);
  if(key) return {...APPEARANCES[key],key};
  // 기록이 없는 인물은 역할에 맞는 실루엣을 쓰고 창작임을 명시한다.
  const seed=[...name].reduce((h,c)=>(Math.imul(h,31)+c.codePointAt(0))>>>0,0);
  const colors=['#a87373','#7396ae','#a78db9','#bc995e','#709a83','#747caa'];
  return {key:'generic',name,coat:colors[seed%colors.length],hair:['#604b39','#433d37','#95816b'][seed%3],
    ...(role.includes('왕')?{royal:true,crown:true}:role.includes('선지자')?{mantle:true,scroll:true}:role.includes('제사장')?{headband:true,sash:'#8b9ebc'}:{vest:seed%2===0,headband:seed%3===0}),
    evidence:'외모를 확정할 본문·주석 근거를 아직 등록하지 않았어요.',design:'의복과 소품은 역할을 구별하기 위한 창작 디자인이에요.'};
}
