import {creatureForName} from './creatures.js?rev=so-king-identity-1';
import { APPEARANCES } from './appearance.js';
const knownPeople=new Set(Object.values(APPEARANCES).map(p=>p.name).filter(n=>!['천사','일꾼'].includes(n)));
const spiritual=/^(하나님|여호와|성령|주님|천사|하나님의 사자|여호와의 군대 장관|그룹|사탄|마귀|어린 양)$/;
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
  if(code==='2sa'&&Number(chapter)===12&&name==='여디디야')return '솔로몬';
  // The Chronicler's Micaiah is the Maacah named in the family list; the
  // uploaded commentary identifies her as Uriel and Tamar's daughter.
  if(code==='2ch'&&Number(chapter)===13&&name==='미가야(우리엘의 딸)')return '마아가';
  if(code==='2ch'&&Number(chapter)===21&&name==='아합의 딸')return '아달랴';
  if(code==='2ch'&&Number(chapter)===34&&name==='압돈')return '악볼(미가야의 아들)';
  if(code==='2ch'&&Number(chapter)===22&&name==='예후(님시의 아들)')return '예후';
  if(code==='2ch'&&Number(chapter)===22&&name==='여호사브앗')return '여호세바';
  if(code==='2ch'&&Number(chapter)===35&&name==='느고')return '바로 느고';
  if(code==='2ki'&&Number(chapter)===15&&name==='아사랴')return '웃시야';
  if(code==='2ch'&&Number(chapter)===36&&name==='시드기야'||code==='2ki'&&[24,25].includes(Number(chapter))&&name==='시드기야')return '시드기야(유다 왕)';
  if(code==='2ch'&&Number(chapter)===11&&name==='마할랏')return '마할랏(르호보암의 아내)';
  if(code==='gen'&&Number(chapter)===28&&name==='마할랏')return '마할랏(이스마엘의 딸)';
  if((code==='2sa'&&Number(chapter)===8&&name==='아히멜렉')||(code==='1ch'&&Number(chapter)===18&&name==='아비멜렉')||(code==='1ch'&&Number(chapter)===24&&name==='아히멜렉'))return '아히멜렉(아비아달의 아들)';
  if(code==='1sa'&&[21,22].includes(Number(chapter))&&name==='아히멜렉')return '아히멜렉(아비아달의 아버지)';
  if(code==='2sa'&&Number(chapter)===21&&name==='엘하난')return '엘하난(야레오르김의 아들)';
  if(code==='1ch'&&Number(chapter)===8&&name==='에스바알')return '이스보셋';
  if(['므립바알','므비보셋'].includes(name))return '므비보셋';
  if((code==='2sa'&&Number(chapter)===24&&name==='아라우나')||(code==='1ch'&&Number(chapter)===21&&name==='오르난'))return '아라우나(오르난)';
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
  if(code==='2sa'&&Number(chapter)===12&&['솔로몬','여디디야'].includes(name))return {...id('person','solomon'),canonicalName:'솔로몬'};
  if(code==='2ch'&&Number(chapter)===13&&name==='미가야(우리엘의 딸)')return {...id('person','maacah-daughter-of-uriel'),canonicalName:'마아가'};
  if(code==='2ch'&&Number(chapter)===11&&name==='마아가')return {...id('person','maacah-daughter-of-uriel'),canonicalName:'마아가'};
  if(code==='1ki'&&Number(chapter)===15&&name==='마아가')return {...id('person','maacah-daughter-of-uriel'),canonicalName:'마아가'};
  if((code==='2ch'&&Number(chapter)===21&&name==='아합의 딸')||(['2ch','2ki'].includes(code)&&[8,11].includes(Number(chapter))&&name==='아달랴')||(code==='2ch'&&Number(chapter)===22&&name==='아달랴'))return {...id('person','athaliah-daughter-of-omri'),canonicalName:'아달랴'};
  if(code==='2ch'&&Number(chapter)===34&&name==='압돈'||code==='2ki'&&Number(chapter)===22&&name==='악볼')return {...id('person','achbor-son-of-micaiah'),canonicalName:'악볼(미가야의 아들)'};
  if(code==='2ch'&&Number(chapter)===18&&name==='시드기야(그나아나의 아들)'||code==='1ki'&&Number(chapter)===22&&name==='시드기야(그나아나의 아들)')return {...id('person','zedekiah-son-of-chenaanah'),canonicalName:'시드기야(그나아나의 아들)'};
  if(code==='2ch'&&Number(chapter)===36&&name==='시드기야'||code==='2ki'&&[24,25].includes(Number(chapter))&&name==='시드기야')return {...id('person','zedekiah-king-of-judah'),canonicalName:'시드기야(유다 왕)'};
  if((code==='2ch'&&Number(chapter)===22&&name==='예후(님시의 아들)')||(code==='2ki'&&Number(chapter)===9&&name==='예후')||(code==='1ki'&&Number(chapter)===19&&name==='예후'))return {...id('person','jehu-king-of-israel'),canonicalName:'예후'};
  if((code==='2ch'&&Number(chapter)===22&&name==='여호사브앗')||(code==='2ki'&&Number(chapter)===11&&name==='여호세바'))return {...id('person','jehosheba-daughter-of-jehoram'),canonicalName:'여호세바'};
  if((code==='2ch'&&[26,27].includes(Number(chapter))&&name==='웃시야')||(code==='2ki'&&Number(chapter)===15&&name==='아사랴'))return {...id('person','uzziah-azariah-king-of-judah'),canonicalName:'웃시야'};
  if((code==='2ch'&&Number(chapter)===3&&name==='오르난')||(code==='1ch'&&Number(chapter)===21&&name==='오르난')||(code==='2sa'&&Number(chapter)===24&&name==='아라우나'))return {...id('person','jebusite-threshing-floor-owner'),canonicalName:'아라우나(오르난)'};
  if((code==='2ch'&&Number(chapter)===35&&name==='느고')||(code==='2ki'&&Number(chapter)===23&&name==='바로 느고'))return {...id('person','pharaoh-necho-ii'),canonicalName:'느고'};
  if(code==='2ch'&&Number(chapter)===11&&name==='마할랏')return {...id('person','mahalath-wife-of-rehoboam'),canonicalName:'마할랏(르호보암의 아내)'};
  if(code==='gen'&&Number(chapter)===28&&name==='마할랏')return {...id('person','mahalath-daughter-of-ishmael'),canonicalName:'마할랏(이스마엘의 딸)'};
  if((code==='2sa'&&Number(chapter)===8&&name==='아히멜렉')||(code==='1ch'&&Number(chapter)===18&&name==='아비멜렉')||(code==='1ch'&&Number(chapter)===24&&name==='아히멜렉'))return {...id('person','ahimelech-son-of-abiathar'),canonicalName:'아히멜렉(아비아달의 아들)'};
  if(code==='1sa'&&[21,22].includes(Number(chapter))&&name==='아히멜렉')return {...id('person','ahimelech-priest-of-nob'),canonicalName:'아히멜렉(아비아달의 아버지)'};
  if(code==='2sa'&&Number(chapter)===21&&name==='엘하난')return {...id('person','elhanan-son-of-jaare-oregim'),canonicalName:'엘하난(야레오르김의 아들)'};
  if(code==='2sa'&&Number(chapter)===23&&name==='엘하난(도도의 아들)')return {...id('person','elhanan-son-of-dodo'),canonicalName:'엘하난(도도의 아들)'};
  if((name==='므립바알'||name==='므비보셋')&&!(code==='2sa'&&Number(chapter)===21&&/리스바/.test(role)))return {...id('person','mephibosheth-son-of-jonathan'),canonicalName:'므비보셋'};
  if((code==='1ch'&&Number(chapter)===8&&name==='에스바알')||name==='이스보셋')return {...id('person','ishbosheth-son-of-saul'),canonicalName:'이스보셋'};
  if((code==='2sa'&&Number(chapter)===24&&name==='아라우나')||(code==='1ch'&&Number(chapter)===21&&name==='오르난'))return {...id('person','jebusite-threshing-floor-owner'),canonicalName:'아라우나(오르난)'};
  if(name==='요나단'&&['1sa','2sa'].includes(code))return {...id('person','jonathan-son-of-saul'),canonicalName:'요나단'};
  if(code==='2sa'&&name==='요나단(아비아달의 아들)')return id('person','jonathan-son-of-abiathar');
  if(code==='2sa'&&name==='요나단(시므아의 아들)')return id('person','jonathan-son-of-shimea');
  if(code==='2sa'&&name==='요나단(야센의 아들)')return id('person','jonathan-son-of-jashen');
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
