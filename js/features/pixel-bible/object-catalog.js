// 공개 장별 요약의 물건 후보를 구절 범위와 함께 색인한다. 주석 원문은 사용/배포하지 않는다.
const rows=[
 ['field','보리밭','crop','field','보리밭|이삭'],['water','물항아리','vessel','water','물항아리|물동이'],['bench','쉬는 자리','seat','bench','의자'],['tree','나무','plant','tree','나무'],['well','우물','well','well','우물'],['stone','돌','stone','stone','돌|돌멩이'],['bush','떨기나무','plant','bush','떨기나무'],['boat','배','boat','boat','배|작은 배'],['scroll','두루마리','book','scroll','두루마리'],['oil','기름병','vessel','oil','기름병'],
 ['ark-noah','노아의 방주','boat','boat','방주'],['ark-covenant','언약궤','chest','scroll','언약궤|법궤|증거궤'],['altar','제단','altar','bush','제단|번제단'],['incense-altar','분향단','altar','oil','분향단'],['tabernacle','성막','tent','scroll','성막'],['tent','장막','tent','bench','장막|천막'],['temple','성전','building','scroll','성전'],['gate','성문','building','stone','성문'],['wall','성벽','building','stone','성벽'],['tower','망대','building','stone','망대'],['house','집','building','bench','집'],['palace','왕궁','building','bench','왕궁'],['stable','구유','chest','bench','구유'],['tomb','무덤','stone','stone','무덤|돌무덤'],
 ['staff','지팡이','staff','stone','지팡이'],['rod','막대기','staff','stone','막대기'],['sling','물매','tool','stone','물매'],['sword','칼','weapon','stone','칼|검'],['spear','창','weapon','stone','창'],['javelin','단창','weapon','stone','단창'],['bow','활','weapon','stone','활'],['arrow','화살','weapon','stone','화살'],['shield','방패','shield','stone','방패'],['helmet','투구','wear','stone','투구'],['armor','갑옷','wear','stone','갑옷'],['chariot','병거','cart','boat','병거|전차'],['wheel','바퀴','tool','stone','바퀴'],['chain','쇠사슬','tool','stone','쇠사슬|사슬'],['fetter','차꼬','tool','stone','차꼬'],['rope','밧줄','tool','well','밧줄|줄'],['anchor','닻','tool','boat','닻'],['sail','돛','cloth','boat','돛'],['oar','노','staff','boat','노'],
 ['net','그물','net','water','그물'],['hook','낚시','tool','water','낚시|낚싯바늘'],['basket','바구니','basket','field','바구니|광주리|소쿠리'],['jar','항아리','vessel','water','항아리'],['pot','솥','vessel','oil','솥|가마솥'],['bowl','대접','vessel','water','대접|그릇'],['cup','잔','vessel','water','잔|술잔'],['pitcher','주전자','vessel','water','주전자'],['basin','대야','vessel','water','대야|물두멍'],['lamp','등잔','lamp','oil','등잔|등불'],['lampstand','등잔대','lamp','oil','등잔대|촛대'],['torch','횃불','lamp','bush','횃불'],['candle','초','lamp','oil','촛불'],['censer','향로','vessel','oil','향로'],['incense','향','basket','oil','향|유향'],['myrrh','몰약','vessel','oil','몰약'],['perfume','향유','vessel','oil','향유|옥합'],
 ['bread','떡','food','field','떡|빵'],['barley-bread','보리떡','food','field','보리떡'],['manna','만나','food','field','만나'],['quail','메추라기','animal','field','메추라기'],['fish','물고기','animal','water','물고기|생선'],['grain','곡식','crop','field','곡식|곡물'],['wheat','밀','crop','field','밀'],['barley','보리','crop','field','보리'],['seed','씨앗','crop','field','씨앗|씨'],['flour','가루','basket','field','가루|밀가루'],['dough','반죽','food','field','반죽'],['leaven','누룩','basket','field','누룩'],['salt','소금','basket','field','소금'],['honey','꿀','vessel','water','꿀'],['milk','젖','vessel','water','젖|우유'],['water-supply','물','vessel','water','물'],['wine','포도주','vessel','water','포도주'],['olive-oil','기름','vessel','oil','기름|감람유'],['grapes','포도','plant','field','포도'],['vineyard','포도원','plant','field','포도원'],['vine','포도나무','plant','tree','포도나무'],['fig-tree','무화과나무','plant','tree','무화과나무|돌무화과나무'],['fig','무화과','food','field','무화과'],['olive-tree','감람나무','plant','tree','감람나무|올리브나무'],['palm','종려나무','plant','tree','종려나무'],['cedar','백향목','plant','tree','백향목'],['hyssop','우슬초','plant','bush','우슬초'],['reed','갈대','plant','bush','갈대'],['lily','백합','plant','bush','백합'],['mustard','겨자씨','crop','field','겨자씨'],['fruit','열매','food','field','열매'],
 ['table','상','seat','bench','상|식탁'],['bed','침상','seat','bench','침상|침대'],['mat','자리','cloth','bench','거적|들것'],['throne','보좌','seat','bench','보좌|왕좌'],['footstool','발판','seat','bench','발판|발등상'],['cloak','겉옷','cloth','bench','겉옷'],['robe','옷','cloth','bench','옷|옷자락'],['sackcloth','베옷','cloth','bench','베옷|굵은 베'],['ephod','에봇','wear','scroll','에봇'],['breastplate','흉패','wear','scroll','흉패'],['crown','왕관','wear','stone','왕관|면류관'],['sandal','신발','wear','bench','신발|신'],['belt','띠','cloth','bench','띠|허리띠'],['towel','수건','cloth','water','수건'],['veil','휘장','cloth','scroll','휘장|수건'],['curtain','커튼','cloth','scroll','커튼'],['linen','세마포','cloth','bench','세마포'],
 ['tablet','돌판','book','scroll','돌판'],['book','책','book','scroll','책|율법책'],['letter','편지','book','scroll','편지|서신'],['seal','인장','tool','scroll','인장|도장'],['signet','반지','wear','scroll','반지'],['ink','먹','vessel','scroll','먹|잉크'],['pen','붓','staff','scroll','붓'],['coin','동전','treasure','stone','동전|데나리온|세겔|드라크마'],['silver','은','treasure','stone','은'],['gold','금','treasure','stone','금'],['pearl','진주','treasure','stone','진주'],['jewel','보석','treasure','stone','보석'],['treasure-chest','보물상자','chest','scroll','보물|보화'],['moneybag','돈주머니','basket','scroll','돈주머니|전대'],
 ['lyre','수금','instrument','scroll','수금|비파'],['harp','거문고','instrument','scroll','거문고'],['tambourine','소고','instrument','field','소고'],['trumpet','나팔','instrument','scroll','나팔'],['flute','피리','instrument','scroll','피리'],['cymbal','제금','instrument','scroll','제금'],['millstone','맷돌','stone','stone','맷돌'],['plow','쟁기','tool','field','쟁기'],['sickle','낫','tool','field','낫'],['axe','도끼','tool','stone','도끼'],['hammer','망치','tool','stone','망치'],['nail','못','tool','stone','못'],['key','열쇠','tool','scroll','열쇠'],['scale','저울','tool','stone','저울'],['yoke','멍에','tool','field','멍에'],['cross','십자가','cross','stone','십자가'],['laver','물두멍','vessel','water','물두멍'],['oven','화덕','altar','field','화덕|풀무'],['brick','벽돌','stone','stone','벽돌'],['stone-pillar','돌기둥','stone','stone','돌기둥|기둥'],['ladder','사다리','tool','tree','사다리'],['rainbow','무지개','symbol','scroll','무지개'],['star','별','symbol','scroll','별'],['cloud','구름','symbol','water','구름'],['fire','불','lamp','bush','불'],['sheep','양','animal','field','양|어린 양'],['donkey','나귀','animal','bench','나귀'],['horse','말','animal','boat','말'],['dove','비둘기','animal','tree','비둘기'],['raven','까마귀','animal','tree','까마귀'],['snake','뱀','animal','stone','뱀'],['bronze-snake','놋뱀','symbol','stone','놋뱀'],['lion','사자','animal','stone','사자'],['calf','송아지','animal','field','송아지'],
];
export const OBJECT_CATALOG=Object.fromEntries(rows.map(([id,name,family,action,aliases])=>[id,{id,name,family,action,aliases:aliases.split('|')} ]));
const patterns=new Map();
function matches(entry,text){
 if(!patterns.has(entry.id))patterns.set(entry.id,new RegExp(`(?<![가-힣])(?:${entry.aliases.join('|')})(?=$|[\\s.,!?·:;()“”‘’]|(?:은|는|이|가|을|를|과|와|도|에|의|로|으로|에서|에게|처럼|보다|만|까지|마다|들|이나|나)(?=$|[\\s.,!?·:;()“”‘’]))`,'u'));
 if(entry.id==='boat'&&/배가 고|배를 채|배가 부/.test(text)&&!/바다|타고|건너|풍랑|호수/.test(text))return false;
 if(entry.id==='sandal'&&!/신발|신을.*벗|신.*발|신 끈/.test(text))return false;
 if(entry.id==='lion'&&!/굴|으르렁|맹수|사자들|사자에게|사자의 입|사자 새끼/.test(text))return false;
 if(entry.id==='horse'&&!/타고|타는|탄 |기병|군마|말들이|말을 타/.test(text))return false;
 return patterns.get(entry.id).test(text);
}
export function chapterObjects(c){
 const result=new Map(),events=c.data?.events||[];
 const add=(entry,text,verses,source)=>{
  if(!matches(entry,text))return;
  const ref=`${c.name||c.code} ${c.chap}${verses?':'+verses:''}`;
  const actors=(c.data?.people||[]).filter(p=>! /^(하나님|여호와|성령|주님)$/.test(p.name)&&text.includes(p.name)).map(p=>p.name);
  if(!result.has(entry.id))result.set(entry.id,{id:entry.id,name:entry.name,action:entry.action,family:entry.family,refs:[],actors:[],evidence:[]});
  const item=result.get(entry.id);if(!item.refs.includes(ref))item.refs.push(ref);
  for(const name of actors)if(!item.actors.includes(name))item.actors.push(name);
  if(!item.evidence.some(e=>e.ref===ref))item.evidence.push({ref,source,actors,text});
 };
 for(const entry of Object.values(OBJECT_CATALOG)){
  for(const e of events)add(entry,`${e.title||''} ${e.text||''}`,e.verses,'event-summary');
  for(const r of c.data?.rels||[])add(entry,r.note||'',r.verses,'relation-summary');
  if(!result.has(entry.id))add(entry,c.data?.story||c.data?.line||'',null,'chapter-summary');
 }
 return [...result.values()];
}
export function objectsForChapters(chapters){
 const map=new Map();for(const c of chapters)for(const item of chapterObjects(c)){
  if(!map.has(item.id))map.set(item.id,{...item,refs:[...item.refs],actors:[...item.actors],evidence:[...item.evidence]});
  else{const old=map.get(item.id);old.refs=[...new Set([...old.refs,...item.refs])];old.actors=[...new Set([...old.actors,...item.actors])];old.evidence.push(...item.evidence);}
 }
 return [...map.values()];
}
