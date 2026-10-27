import {creatureForName} from './creatures.js?rev=so-king-identity-1';
import { APPEARANCES } from './appearance.js';
const knownPeople=new Set(Object.values(APPEARANCES).map(p=>p.name).filter(n=>!['천사','일꾼'].includes(n)));
const spiritual=/^(하나님|여호와|성령|주님|천사|하나님의 사자|여호와의 군대 장관|사탄|마귀|어린 양)$/;
const group=/자손|백성|사람들|여성들|여인들|여종들|성도|제자들|무리|장로들|제사장들|레위인들|지파|족속|군대|나라들|원수들|악인들|의인들|권력자들|통치자들|주민들|재판관들|관리들|지도자들|신하들|술객들|기술자들|자들/;
export function canonicalPersonName(name,{code='',chapter=0}={}) {
  if(code==='gen'&&name==='아브람')return '아브라함';
  if(code==='gen'&&name==='사래')return '사라';
  if(code==='gen'&&name==='라멕'&&Number(chapter)===4)return '라멕(가인 계열)';
  if(code==='gen'&&name==='라멕'&&Number(chapter)===5)return '라멕(셋 계열)';
  if(code==='gen'&&name==='바로'&&Number(chapter)===12)return '바로(아브라함 시대)';
  if(code==='gen'&&name==='바로'&&Number(chapter)>=40)return '바로(요셉 시대)';
  if(code==='exo'&&['르우엘','이드로'].includes(name))return '이드로';
  if(name==='여룹바알')return '기드온';
  if(code==='exo'&&name==='바로'&&Number(chapter)>=1&&Number(chapter)<=2)return '바로(모세의 출생 시대)';
  if(code==='exo'&&name==='바로'&&Number(chapter)>=3)return '바로(출애굽 시대)';
  if(code==='act'&&name==='사울')return '바울';
  if(code==='1sa'&&name==='여호수아(벧세메스 사람)')return '여호수아(벧세메스 사람)';
  return name;
}
// 이름 문자열을 곧 고유 인물로 취급하지 않는다. 모호한 것은 미해결로 남긴다.
export function resolveIdentity(name,{code='',chapter=0,role=''}={}) {
  const id=(kind,key,status='reviewed-rule')=>({kind,id:`${kind}:${key}`,status});
  const creature=creatureForName(name,role,code);if(creature)return id(creature.kind,creature.id);
  if(spiritual.test(name))return id('spiritual',name);
  if(group.test(name)||/^(이스라엘|유다)$/.test(name)&&/백성|지파|나라|왕국/.test(role))return id('group',name);
  if(['예수','예수님','그리스도'].includes(name))return id('person','jesus');
  // 창세기 17장의 개명 전후 호칭은 동일 인물이다. 월드와 도감은 한
  // 캐릭터로 합치되 본문·발화의 시대별 표기는 그대로 둔다.
  if(code==='gen'&&['아브람','아브라함'].includes(name))return {...id('person','아브라함'),canonicalName:'아브라함'};
  if(code==='gen'&&['사래','사라'].includes(name))return {...id('person','사라'),canonicalName:'사라'};
  if(code==='gen'&&name==='라멕'&&Number(chapter)===4)return {...id('person','lamech-cainite'),canonicalName:'라멕(가인 계열)'};
  if(code==='gen'&&name==='라멕'&&Number(chapter)===5)return {...id('person','lamech-sethite'),canonicalName:'라멕(셋 계열)'};
  if(code==='gen'&&name==='바로'&&Number(chapter)===12)return {...id('person','pharaoh-abraham-era'),canonicalName:'바로(아브라함 시대)'};
  if(code==='gen'&&name==='바로'&&Number(chapter)>=40)return {...id('person','pharaoh-joseph-era'),canonicalName:'바로(요셉 시대)'};
  if(code==='exo'&&['르우엘','이드로'].includes(name))return {...id('person','midianite-priest-jethro'),canonicalName:'이드로'};
  if(['기드온','여룹바알'].includes(name))return {...id('person','gideon-jerubbaal'),canonicalName:'기드온'};
  if(code==='1sa'&&name==='여호수아(벧세메스 사람)')return {...id('person','joshua-bethshemesh'),canonicalName:'여호수아(벧세메스 사람)'};
  if(code==='exo'&&name==='바로'&&Number(chapter)>=1&&Number(chapter)<=2)return {...id('person','exodus-pharaoh-moses-birth'),canonicalName:'바로(모세의 출생 시대)'};
  if(code==='exo'&&name==='바로'&&Number(chapter)>=3)return {...id('person','exodus-pharaoh-deliverance'),canonicalName:'바로(출애굽 시대)'};
  if(code==='exo'&&name==='아말렉'&&Number(chapter)===17)return id('group','amalekites');
  if(name==='사울') {
    if(code==='act'||/바울/.test(role))return {...id('person','paul'),canonicalName:'바울'};
    if(['1sa','2sa','1ch'].includes(code)||/이스라엘.*왕|다윗.*왕/.test(role))return id('person','saul-king');
    return id('unresolved',`${name}:${code}`,'ambiguous');
  }
  // 열왕기하 15장의 불은 불꽃이 아니라 은을 받은 앗수르 왕 풀(Pul)이에요.
  if(name==='불'&&code==='2ki'&&/왕|앗수르/.test(role))return id('person','assyria-king-pul','verse-reviewed');
  // 열왕기하 17장의 소(So)는 애굽 왕이다. 동물 이름과 구별해 한 인물로 유지한다.
  if(name==='소'&&code==='2ki'&&/왕|애굽|바로/.test(role))return id('person','egyptian-king-so','verse-reviewed');
  if(name==='바울')return id('person','paul');
  if(name==='요셉') {
    if(code==='gen')return id('person','joseph-patriarch');
    if(/아리마대/.test(role))return id('person','joseph-arimathea');
    if(/마리아|예수.*아버지|남편/.test(role))return id('person','joseph-mary-husband');
    return id('unresolved',`${name}:${code}`,'ambiguous');
  }
  if(name==='마리아'){
    if(/막달라/.test(role))return id('person','mary-magdalene');
    if(/예수.*어머니|예수.*모친/.test(role))return id('person','mary-jesus-mother');
    if(/마르다|나사로/.test(role))return id('person','mary-bethany');
    return id('unresolved',`${name}:${code}`,'ambiguous');
  }
  if(name==='요한'){
    if(/세례/.test(role))return id('person','john-baptist');
    if(/세베대|사도|예수.*제자/.test(role))return id('person','john-apostle');
    if(/마가/.test(role))return id('person','john-mark');
    return id('unresolved',`${name}:${code}`,'ambiguous');
  }
  if(name==='빌립'){
    if(code==='act'&&Number(chapter)===8||/전도자|일곱.*집사/.test(role))return id('person','philip-evangelist');
    if(/사도|열두.*제자/.test(role)||code==='jhn')return id('person','philip-apostle');
    return id('unresolved',`${name}:${code}`,'ambiguous');
  }
  if(['야고보','유다','스가랴','아하시야','요나단','바로','다리오','벤하닷'].includes(name))return id('unresolved',`${name}:${code}`,'ambiguous');
  if(code==='2ki'&&['시비아','여호앗단','여골리야','여루사','헵시바','므술레멧','여디다','하무달','스비다','야아사니야'].includes(name))return id('person',`2ki:${name}`,'verse-reviewed');
  if(code==='2ki'&&name==='살룸'&&Number(chapter)===22)return id('person','shallum-huldah-husband','verse-reviewed');
  if(code==='2ki'&&name==='요하난'&&Number(chapter)===25)return id('person','johanan-kareah','verse-reviewed');
  if(knownPeople.has(name))return id('person',name,'profile-reviewed');
  // A role change across books does not create a second visual person. Names
  // with known ambiguity are split explicitly above; keep fallback identities
  // stable so repeated appearances merge in the world cast.
  return id('unresolved',name,'needs-review');
}
