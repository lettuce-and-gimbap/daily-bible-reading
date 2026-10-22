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
  aaron: profile("#d9c7a0","#6b5142",{"name": "아론", "headband": true, "sash": "#937caa", "trim": "#c9a75e"},"출애굽기 28:4, 39–40 · 제사장의 의복·관·띠.","제사장 의복을 단순화했으며 흉패와 에봇의 세부 재현은 아직 없어요."),
  miriam: profile("#ae748d","#514235",{"name": "미리암", "hood": true, "tambourine": true},"출애굽기 15:20 · 손에 소고를 들고 나옴.","소고 외의 의복과 머릿수건은 창작이에요."),
  joshua: profile("#738e7d","#584337",{"name": "여호수아", "sash": "#b88452", "headband": true},"여호수아 1:1–2 · 모세를 이어 백성을 이끄는 역할.","띠와 머리띠는 지도자를 구별하기 위한 창작이에요."),
  samuel: profile("#a99a7d","#7b6652",{"name": "사무엘", "mantle": true, "trim": "#d6c194"},"사무엘상 2:19 · 어머니가 해마다 작은 겉옷을 지어 줌.","겉옷은 유년기 기록의 상징이며 색과 현재 모습은 창작이에요."),
  solomon: profile("#b59766","#503c32",{"name": "솔로몬", "crown": true, "royal": true, "trim": "#e5c575"},"열왕기상 10:18 · 큰 상아 보좌를 금으로 입힘.","금빛 왕복과 왕관은 왕의 신분을 나타낸 창작이며 외모 기록은 아니에요."),
  esther: profile("#8d719d","#42333d",{"name": "에스더", "crown": true, "royal": true, "trim": "#dfc283"},"에스더 5:1 · 왕후의 예복을 입고 나아감.","예복의 색과 왕관 모양은 창작이에요."),
  mordecai: profile("#617eae","#5d4c41",{"name": "모르드개", "crown": true, "royal": true, "mantle": true, "trim": "#e2c475"},"에스더 8:15 · 푸르고 흰 조복, 금관, 자색 겉옷.","특정 시점의 복식을 인물 상징으로 단순화했어요."),
  daniel: profile("#93749c","#544234",{"name": "다니엘", "sash": "#d4b56e", "mantle": true},"다니엘 5:29 · 자주색 옷과 금 사슬을 받음.","특정 시점의 복식을 상징으로 사용했으며 띠는 금 사슬의 정확한 재현이 아니에요."),
  ezekiel: profile("#82948c","#61513d",{"name": "에스겔", "scroll": true, "sash": "#a16c64"},"에스겔 3:1–3 · 두루마리를 먹는 환상.","두루마리는 환상의 상징 소품이며 평소 소지품을 뜻하지 않아요."),
  jeremiah: profile("#9c8973","#62503f",{"name": "예레미야", "scroll": true, "mantle": true, "trim": "#b6c4b2"},"예레미야 36:4 · 바룩에게 말씀을 두루마리에 기록하게 함.","두루마리는 기록 사역의 상징이고 옷은 창작이에요."),
  isaiah: profile("#8b929f","#715746",{"name": "이사야", "scroll": true, "sash": "#b88a6a"},"이사야 30:8 · 서판과 책에 기록하라는 명령.","기록 역할을 두루마리로 상징했으며 외형은 창작이에요."),
  ezra: profile("#a49476","#64513f",{"name": "에스라", "scroll": true, "headband": true},"느헤미야 8:2–3 · 율법책을 가져와 읽음.","율법책을 작은 두루마리로 단순화했으며 의복은 창작이에요."),
  nehemiah: profile("#7d8d9d","#5d4d40",{"name": "느헤미야", "vest": true, "belt": true},"느헤미야 2:17–18 · 성벽 재건을 권함.","작업 조끼와 허리띠는 재건 역할의 창작 표현이에요."),
  paul: profile("#9a7a64","#64513f",{"name": "바울", "scroll": true, "sash": "#7396a4"},"로마서 1:1, 7 · 바울이 로마의 성도들에게 보낸 편지.","서신 사역을 두루마리로 상징하며 대머리 등 외모 전승은 반영하지 않았어요."),
  barnabas: profile("#8b9c77","#63543f",{"name": "바나바", "mantle": true, "trim": "#d3b77c"},"사도행전 4:36–37 · 위로의 아들로 불리며 밭을 팔아 드림.","겉옷과 색은 창작이며 외모 기록이 아니에요."),
  timothy: profile("#789c9f","#51483e",{"name": "디모데", "scroll": true, "vest": true},"디모데전서 4:12–13 · 젊음과 읽기·가르침에 대한 권면.","수염 없는 모습과 조끼는 젊은 동역자를 표현한 창작이에요."),
  lydia: profile("#996eaa","#493c37",{"name": "루디아", "shawl": true, "sash": "#b58bc3"},"사도행전 16:14 · 자주색 옷감 장사.","자주색 숄은 직업의 상징이며 실제 입었던 옷의 기록은 아니에요."),
  dorcas: profile("#a47f8e","#59453a",{"name": "다비다", "apron": true, "hood": true},"사도행전 9:36, 39 · 선행을 베풀며 속옷과 겉옷을 지음.","앞치마는 바느질 역할의 창작 표현이에요."),
  noah: profile("#9d8d6b","#aba18b",{"name": "노아", "beard": "#aba18b", "vest": true, "belt": true},"창세기 6:14 · 방주를 만들라는 명령.","목공 조끼·흰 수염은 창작이며 외모 기록이 아니에요."),
  abraham: profile("#a98772","#a6a08b",{"name": "아브라함", "beard": "#a6a08b", "mantle": true, "staff": true},"창세기 12:4–5 · 부름을 따라 떠남.","지팡이와 여행 차림·흰 수염은 창작이에요."),
  sarah: profile("#b78e94","#a49a88",{"name": "사라", "hood": true, "shawl": true},"창세기 18:11 · 아브라함과 사라가 나이 많음.","회색 머리와 숄 색은 창작이에요."),
  isaac: profile("#ad9871","#715940",{"name": "이삭", "vest": true, "sash": "#799f9c"},"창세기 26:18 · 아버지 때 팠던 우물을 다시 팜.","조끼와 띠는 다른 인물과 구분하기 위한 창작이에요."),
  rebekah: profile("#8e9eaf","#5f4939",{"name": "리브가", "hood": true, "jewels": true},"창세기 24:22, 47 · 코걸이와 팔찌를 받음.","현재 귀 장식은 일반 창작 장식이며 코걸이·팔찌의 정확한 재현은 아니에요."),
  jacob: profile("#a99382","#5e4839",{"name": "야곱", "staff": true, "sash": "#8d839f"},"창세기 32:10 · 지팡이만 가지고 요단을 건넜음을 회고함.","지팡이 외에 옷과 색은 창작이에요."),
  esau: profile("#ad7861","#a76b45",{"name": "에서", "fur": true, "belt": true, "beard": "#a76b45"},"창세기 25:25 · 붉고 털옷 같은 모습으로 태어남.","출생 기록을 붉은 갈색과 털 질감으로 상징하며 성인 복식은 창작이에요."),
  samson: profile("#a48a66","#493a30",{"name": "삼손", "longHair": true, "belt": true, "headband": true},"사사기 16:13, 17 · 머리털 일곱 가닥, 삭도를 대지 않은 머리.","긴 머리를 단순화했으며 일곱 가닥의 세부 표현은 생략했어요."),
  hannah: profile("#9e829d","#564338",{"name": "한나", "hood": true, "shawl": true, "trim": "#c6bba4"},"사무엘상 1:10–11 · 성전에서 간절히 기도함.","기도 인물의 의복과 색은 창작이에요."),
  deborah: profile("#799a92","#51483d",{"name": "드보라", "shawl": true, "sash": "#d1af6f"},"사사기 4:4–5 · 선지자이며 종려나무 아래에서 재판함.","숄과 띠는 창작이며 외모 기록이 아니에요."),
  gideon: profile("#9c9367","#64503a",{"name": "기드온", "vest": true, "belt": true, "headband": true},"사사기 6:11 · 포도주 틀에서 밀을 타작함.","작업 조끼와 머리띠는 창작이에요."),
  job: profile("#8f8b82","#928778",{"name": "욥", "mantle": true, "beard": "#928778"},"욥기 1:20 · 겉옷을 찢고 머리털을 밂.","평상시를 나타낸 상징 디자인으로, 고난 당시 삭발·찢어진 옷 장면은 아직 별도 구현하지 않았어요."),
};
const NAMES = {'예수':'jesus','예수님':'jesus','그리스도':'jesus','모세':'moses','엘리야':'elijah','엘리사':'elisha','이세벨':'jezebel','아합':'ahab','여호사밧':'jehoshaphat','벤하닷':'benhadad','나봇':'naboth','미가야':'micaiah','아하시야':'ahaziah','천사':'angel','룻':'ruth','보아스':'boaz','나오미':'naomi','세례 요한':'john','요셉':'joseph','다윗':'david','베드로':'peter','일꾼':'worker'};
export function appearanceFor(name, index=0, role='', refs=[]) {
  let key=NAMES[name] || Object.keys(APPEARANCES).find(k=>APPEARANCES[k].name===name) || (name.startsWith('아하시야(')?'ahaziah':null);
  // 같은 이름이라는 이유로 신약의 요셉에게 창세기의 옷을 입히지 않는다.
  if(key==='joseph' && ((refs.length && !refs.some(r=>r.startsWith('창세기 '))) || /마리아|아리마대/.test(role)))key=null;
  if(key) return {...visualVariation(name),...APPEARANCES[key],key,design:APPEARANCES[key].design+' 기록되지 않은 머리·수염·색과 작은 옷깃 무늬는 창작이에요.'};
  // 기록이 없는 인물은 역할에 맞는 실루엣을 쓰고 창작임을 명시한다.
  const seed=[...name].reduce((h,c)=>(Math.imul(h,31)+c.codePointAt(0))>>>0,0);
  const colors=['#a87373','#7396ae','#a78db9','#bc995e','#709a83','#747caa','#9c846c','#869c9e','#bd8f9b','#8d9970','#a99d80','#8c7c99'];
  return {...visualVariation(name),key:'generic',name,coat:colors[seed%colors.length],hair:['#604b39','#433d37','#95816b'][seed%3],
    ...(role.includes('왕')?{royal:true,crown:true}:role.includes('선지자')?{mantle:true,scroll:true}:role.includes('제사장')?{headband:true,sash:'#8b9ebc'}:{vest:seed%2===0,headband:seed%3===0}),
    evidence:'외모를 확정할 본문·주석 근거를 아직 등록하지 않았어요.',design:'의복과 소품은 역할을 구별하기 위한 창작 디자인이에요.'};
}

// 등장 순서와 무관하게 머리·옷깃·옷자락의 작은 창작 차이를 유지한다.
function visualVariation(name) {
  let a=2166136261,b=5381;for(const c of name){a=Math.imul(a^c.codePointAt(0),16777619)>>>0;b=(Math.imul(b,33)^c.codePointAt(0))>>>0;}
  return {fringe:a%4,collar:b%3,hem:a%3,accent:['#d8b987','#9cb4a2','#bda0a9','#a2b0c5','#c8bb9a'][b%5]};
}
