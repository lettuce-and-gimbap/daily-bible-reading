import {chapterObjects} from './object-catalog.js';
// 생물의 몸짓은 창작 연출이며, 상징적 존재를 실제 동물로 바꾸지 않는다.
const rows=[
 ['sheep','양','animal','grazer','#ece2c3'],['donkey','나귀','animal','grazer','#999b94'],['horse','말','animal','grazer','#a87d55'],['camel','낙타','animal','grazer','#c7a773'],['calf','송아지','animal','grazer','#b8845a'],['ox','소','animal','grazer','#a17e5f'],['goat','염소','animal','grazer','#d9cbb0'],['deer','사슴','animal','grazer','#ba946e'],
 ['lion','사자','animal','predator','#c7a366'],['bear','곰','animal','predator','#84674f'],['wolf','이리','animal','predator','#929b98'],['fox','여우','animal','predator','#c98252'],['dog','개','animal','predator','#bd9a74'],['pig','돼지','animal','grazer','#cba399'],
 ['dove','비둘기','animal','bird','#eee8d9'],['raven','까마귀','animal','bird','#454b59'],['quail','메추라기','animal','bird','#a38e72'],['eagle','독수리','animal','bird','#8c7860'],['sparrow','참새','animal','bird','#b39771'],['rooster','닭','animal','bird','#c19261'],
 ['fish','물고기','animal','fish','#7db3b9'],['great-fish','큰 물고기','animal','fish','#658f9f'],['snake','뱀','animal','snake','#7e9a63'],['locust','메뚜기','animal','insect','#8da56c'],['bee','벌','animal','insect','#d9b55b'],['ant','개미','animal','insect','#8d6452'],['frog','개구리','animal','hopper','#79a26c'],
 ['tree','나무','plant','tree','#719363'],['fig-tree','무화과나무','plant','tree','#72955f'],['olive-tree','감람나무','plant','tree','#8eaa79'],['palm','종려나무','plant','palm','#769764'],['cedar','백향목','plant','tree','#577e63'],['vine','포도나무','plant','vine','#7d9b63'],['bush','떨기나무','plant','shrub','#8a9d68'],['hyssop','우슬초','plant','shrub','#8da56e'],['reed','갈대','plant','grass','#b6b07a'],['lily','백합','plant','flower','#f2e8cb'],['wheat','밀','plant','grass','#d5bc70'],['barley','보리','plant','grass','#ddc77e'],['gourd','박넝쿨','plant','vine','#8ca466'],['mustard-plant','겨자나무','plant','shrub','#8ba56b']
];
export const CREATURES=Object.fromEntries(rows.map(([id,name,kind,body,color])=>[id,{id,name,kind,body,color}]));
const aliases={'발람의 나귀':'donkey','암나귀':'donkey','어린 나귀':'donkey','양 떼':'sheep','암양':'sheep','수양':'sheep','어린 양':'sheep','암소':'ox','수소':'ox','숫염소':'goat','어린 염소':'goat','수탉':'rooster','닭':'rooster','암탉':'rooster','늑대':'wolf','박넝쿨':'gourd'};
export function creatureForName(name,role='',code=''){
 // 열왕기하 17장의 소(So)는 호세아가 사신을 보낸 애굽 왕이지 황소가 아니다.
 if(name==='소'&&/왕|애굽|바로/.test(role))return null;
 if(name==='사자'&&/천사|사신|전령|보낸|보냄|전하러|전하는/.test(role))return null;
 if(name==='말'&&/말씀|발언|이야기|언어/.test(role))return null;
 if(/상징|표상|그리스도|보좌|일곱.*뿔/.test(role)||code==='rev'&&name==='어린 양')return null;
 const id=aliases[name]||Object.keys(CREATURES).find(k=>CREATURES[k].name===name);
 return CREATURES[id]||null;
}
const explicit={camel:/낙타/u,ox:/(?:암소|수소|소 떼|황소)/u,goat:/염소/u,deer:/사슴/u,bear:/곰(?:이|을|은|과|에게|의|들|\s|[.,]|$)/u,wolf:/이리 (?:떼|가운데)|이리가|늑대/u,fox:/여우/u,dog:/(?<![가-힣])개(?!의치)(?:가|를|들은|들이|에게|의|처럼|와|$)/u,pig:/돼지/u,eagle:/독수리/u,sparrow:/참새/u,rooster:/수탉|암탉|닭(?:이|을|은|의|\s|$)/u,'great-fish':/큰 물고기/u,locust:/메뚜기/u,bee:/벌 떼|꿀벌/u,ant:/개미/u,frog:/개구리/u,gourd:/박넝쿨/u,'mustard-plant':/겨자나무|겨자.*나무/u};
export function chapterCreatures(c){
 const found=new Map();
 const add=(id,refs)=>{const d=CREATURES[id];if(!d)return;found.set(id,{name:d.name,weight:1,creature:d,role:`이 본문에 언급된 ${d.kind==='animal'?'동물':'식물'} · ${d.name}`,creatureRefs:refs});};
 for(const item of chapterObjects(c))if(CREATURES[item.id]&&!(item.id==='calf'&&item.evidence.every(e=>/송아지처럼/.test(e.text))))add(item.id,item.refs);
 for(const [id,pattern]of Object.entries(explicit)){
  const events=(c.data?.events||[]).filter(e=>{
   const text=`${e.title||''} ${e.text||''}`;
   // 한국어 수량 표현의 '일곱 개를'이 '개' 동물로 오인되지 않게 한다.
   const evidence=id==='dog'?text.replace(/(?:한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|\d+)\s*개(?=[가를은의와에게])/gu,''):text;
   return pattern.test(evidence);
  });
  if(events.length)add(id,events.map(e=>`${c.name||c.code} ${c.chap}${e.verses?':'+e.verses:''}`));
  else {
   const story=c.data?.story||'';
   const evidence=id==='dog'?story.replace(/(?:한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|\d+)\s*개(?=[가를은의와에게])/gu,''):story;
   if(pattern.test(evidence))add(id,[`${c.name||c.code} ${c.chap}`]);
  }
 }
 // Hebrews 9–10 discuss sacrificial oxen and goats as theological examples;
 // they are not living animals in the depicted letter scene.
 if(c.code==='heb'&&[9,10].includes(Number(c.chap))){found.delete('ox');found.delete('goat');}
 // James 3 uses the fig tree as a rhetorical example, not as a present plant.
 if(c.code==='jas'&&Number(c.chap)===3)found.delete('fig-tree');
 // 1 Peter uses a lamb for Christ and a lion as an image for the devil.
 if(c.code==='1pe'&&[1,2,5].includes(Number(c.chap)))found.delete('sheep');
 if(c.code==='1pe'&&Number(c.chap)===5)found.delete('lion');
 // 계시록의 어린 양은 인간형 동물/양 떼로 생성하지 않는다.
 if(c.code==='rev'&&!/양 떼|양을 먹/.test(c.data?.story||''))found.delete('sheep');
 return [...found.values()];
}
export function creatureSpeech(n,chapters=[]){
 const has=(code,chap)=>chapters.some(c=>c.code===code&&Number(c.chap)===chap&&n.refs?.includes(`${c.name||c.code} ${chap}${code==='psa'?'편':'장'}`));
 let texts=[],ref='';
 if(n.creature?.id==='snake'&&has('gen',3)){texts=['동산의 나무 열매를 먹지 말라고 하셨느냐?','그 열매를 먹어도 죽지 않는다고 말하마.'];ref='창세기 3:1–5';}
 if(n.creature?.id==='donkey'&&has('num',22)){texts=['내가 무엇을 했기에 세 번이나 때리십니까?','내가 언제 주인님께 이렇게 한 적이 있었습니까?'];ref='민수기 22:28–30';}
 return texts.map((text,i)=>({id:`creature:${n.creature.id}:${i}`,speaker:n,text,ref,kind:'solo',origin:'biblical-creature-speech',detailText:'이 장에서 발화가 기록된 생물의 말을 짧게 재구성했습니다. 다른 장의 같은 종에는 이 대사를 적용하지 않습니다.'}));
}
const diets={grazer:new Set(['field','grain','wheat','barley','water','well','tree','vine','fig-tree']),bird:new Set(['field','grain','wheat','barley','seed','water','tree','palm','cedar','basket']),predator:new Set(['water','well','tree','stone','bench']),fish:new Set(['water','water-supply','well']),snake:new Set(['tree','stone','bush']),insect:new Set(['tree','field','lily','hyssop','reed','vine']),hopper:new Set(['water','well','reed','stone'])};
export function creatureCanUse(n,kind){return !!n.creature&&n.creature.kind==='animal'&&!!diets[n.creature.body]?.has(kind);}
export function creatureRoutine(n,kind,visit=0){
 const d=n.creature,water=['water','well','water-supply'].includes(kind);
 const options=d.body==='fish'?['swim','circle','dive']:water?['drink','sip','rest']:['grazer','bird'].includes(d.body)&&['field','grain','wheat','barley','seed'].includes(kind)?['graze','peck','rest']:['sniff','rest','look'];
 const gesture=options[visit%options.length];return {id:`creature:${d.id}:${gesture}`,category:water?'water':'animal',kind,gesture,creatureAction:gesture,variant:0,period:3,phase:0};
}
