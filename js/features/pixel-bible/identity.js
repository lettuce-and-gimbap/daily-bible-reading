import {creatureForName} from './creatures.js?rev=so-king-identity-1';
import { APPEARANCES } from './appearance.js';
const knownPeople=new Set(Object.values(APPEARANCES).map(p=>p.name).filter(n=>!['천사','일꾼'].includes(n)));
const spiritual=/^(하나님|여호와|성령|주님|천사|천사들|천사장|천만 천사|능력의 천사들|하나님의 사자|여호와의 군대 장관|그룹|사탄|마귀|귀신|어린 양|범죄한 천사들)$/;
const group=/자손|백성|사람들|여성들|여인들|여종들|성도|교회|형제들|자매들|조상들|증인들|제자들|무리|장로들|장로의 회|제사장들|레위인들|지파|족속|군대|나라들|원수들|악인들|의인들|권력자들|통치자들|주민들|재판관들|관리들|지도자들|신하들|술객들|기술자들|이방인|아들들|딸들|자들|집/;
export function canonicalPersonName(name,{code='',chapter=0}={}) {
  if(code==='jas'&&name==='주 예수 그리스도')return '예수';
  if(code==='2pe'&&name==='시몬 베드로')return '베드로';
  if(['실라','실루아노'].includes(name))return '실라';
  if(['col','2ti'].includes(code)&&Number(chapter)===4&&name==='마가'||code==='phm'&&Number(chapter)===1&&name==='마가')return '요한 마가';
  if(code==='1pe'&&Number(chapter)===5&&name==='마가')return '요한 마가';
  if(name==='브리스가')return '브리스길라';
  if(name==='게바')return '베드로';
  if(code==='act'&&[21,22].includes(Number(chapter))&&name==='천부장'||code==='act'&&Number(chapter)===23&&name==='글라우디오 루시아')return '글라우디오 루시아';
  if(code==='mrk'&&[1,3].includes(Number(chapter))&&name==='시몬')return '베드로';
  if(code==='mrk'&&Number(chapter)===2&&name==='레위')return '마태';
  if(code==='luk'&&[5,6].includes(Number(chapter))&&['시몬','시몬 베드로'].includes(name))return '베드로';
  if(code==='luk'&&Number(chapter)===5&&name==='레위')return '마태';
  if(name==='막달라인 마리아')return '막달라 마리아';
  if(code==='mrk'&&Number(chapter)===15&&name==='야고보와 요세의 어머니 마리아')return '야고보의 어머니 마리아';
  if(code==='luk'&&Number(chapter)===24&&name==='야고보의 어머니 마리아')return '야고보의 어머니 마리아';
  if(['jer','ezk','2ki','2ch'].includes(code)&&['여호야긴','여고냐','고니야'].includes(name))return '여호야긴(여고냐)';
  if((code==='jer'&&[21,24,27,28,29,32,34,37,38,39,52].includes(Number(chapter))||code==='ezk'&&[12,17,21].includes(Number(chapter))||code==='2ch'&&Number(chapter)===36||code==='2ki'&&[24,25].includes(Number(chapter)))&&name==='시드기야')return '시드기야(유다 왕)';
  if(code==='jer'&&[40,41].includes(Number(chapter))&&name==='이스마엘')return '이스마엘(느다냐의 아들)';
  if(code==='jer'&&Number(chapter)===51&&name==='스라야')return '스라야(네리야의 아들)';
  if(code==='jer'&&Number(chapter)===52&&name==='스라야')return '스라야(대제사장)';
  if(code==='lam'&&[1,2].includes(Number(chapter))&&['예루살렘(시온)','딸 시온'].includes(name)||code==='ezk'&&Number(chapter)===16&&name==='예루살렘')return '예루살렘(시온)';
  if(code==='lam'&&[4,5].includes(Number(chapter))&&['시온의 아들들','유다 백성'].includes(name))return '유다 백성';
  if(code==='lam'&&Number(chapter)===4&&name==='기름 부음 받은 왕')return '시드기야(유다 왕)';
  if(code==='ezk'&&Number(chapter)===8&&['유다 장로들','장로 칠십 명'].includes(name))return '에스겔 앞에 모인 장로들';
  if(code==='ezk'&&[9,10].includes(Number(chapter))&&['베옷 입은 서기관','베옷 입은 사람'].includes(name))return '세마포 입은 사람';
  if(code==='ezk'&&Number(chapter)>=40&&Number(chapter)<=48&&['놋 같은 사람','측량하는 사람'].includes(name))return '성전 환상의 안내자';
  if(code==='dan'&&['다니엘','벨드사살','다니엘(벨드사살)'].includes(name))return '다니엘';
  if(code==='dan'&&name==='가브리엘')return '가브리엘';
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
  if(code==='ezr'&&[5,6].includes(Number(chapter))&&name.startsWith('스가랴(잇도'))return '스가랴(잇도의 계열)';
  if(code==='ezr'&&Number(chapter)===4&&name==='그 땅 사람들')return '대적들';
  if((code==='ezr'&&[2,3,4,5,6].includes(Number(chapter))&&name==='예수아')||(code==='hag'&&[1,2].includes(Number(chapter))&&name==='여호수아')||(code==='zec'&&[3,6].includes(Number(chapter))&&name==='여호수아')||(code==='neh'&&Number(chapter)===12&&name==='예수아'))return '예수아';
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
  if(name==='베드로'||code==='mrk'&&[1,3].includes(Number(chapter))&&name==='시몬')return {...id('person','베드로'),canonicalName:'베드로'};
  if(code==='2pe'&&['베드로','시몬 베드로'].includes(name))return {...id('person','베드로'),canonicalName:'베드로'};
  if(code==='1jn'&&name==='요한')return {...id('person','john-apostle'),canonicalName:'요한'};
  if(code==='jud'&&name==='유다')return {...id('person','jude-letter-author'),canonicalName:'유다'};
  if(code==='jud'&&name==='야고보')return {...id('person','james-brother-of-jude'),canonicalName:'야고보'};
  // The elder who writes 2–3 John is traditionally identified with John;
  // keep the two letter voices together without treating the title as a new person.
  if(['2jn','3jn'].includes(code)&&name==='장로')return {...id('person','john-apostle'),canonicalName:'요한'};
  if(code==='3jn'&&name==='디오드레베')return {...id('person','diotrephes'),canonicalName:'디오드레베'};
  if(code==='3jn'&&name==='데메드리오')return {...id('person','demetrius-third-john'),canonicalName:'데메드리오'};
  if(name==='게바')return {...id('person','베드로'),canonicalName:'베드로'};
  if(['실라','실루아노'].includes(name))return {...id('person','silas'),canonicalName:'실라'};
  if(name==='후메내오'&&['1ti','2ti'].includes(code))return id('person','hymenaeus');
  if(['col','2ti'].includes(code)&&Number(chapter)===4&&name==='마가'||code==='phm'&&Number(chapter)===1&&name==='마가')return {...id('person','john-mark'),canonicalName:'요한 마가'};
  if(code==='1pe'&&Number(chapter)===5&&name==='마가')return {...id('person','john-mark'),canonicalName:'요한 마가'};
  if(code==='2ti'&&Number(chapter)===4&&name==='오네시보로의 집')return {...id('group','onesiphorus-household'),canonicalName:'오네시보로의 집',mergeAliases:true};
  if(['브리스가','브리스길라'].includes(name))return {...id('person','priscilla'),canonicalName:'브리스길라'};
  if(code==='luk'&&[5,6].includes(Number(chapter))&&['시몬','시몬 베드로'].includes(name))return {...id('person','베드로'),canonicalName:'베드로'};
  if(name==='마태'||code==='mrk'&&Number(chapter)===2&&name==='레위')return {...id('person','마태'),canonicalName:'마태'};
  if(code==='luk'&&Number(chapter)===5&&name==='레위')return {...id('person','마태'),canonicalName:'마태'};
  if(['막달라인 마리아','막달라 마리아'].includes(name)||name==='마리아'&&/막달라/.test(role))return {...id('person','mary-magdalene'),canonicalName:'막달라 마리아'};
  if(code==='luk'&&Number(chapter)===24&&name==='야고보의 어머니 마리아'||code==='mrk'&&[15,16].includes(Number(chapter))&&['야고보와 요세의 어머니 마리아','야고보의 어머니 마리아'].includes(name))return {...id('person','mary-mother-of-james-and-joses'),canonicalName:'야고보의 어머니 마리아'};
  if(code==='luk'&&Number(chapter)===24&&name==='천사들')return id('spiritual','luk24-resurrection-angels');
  if(code==='act'&&Number(chapter)===1&&name==='천사들')return id('spiritual','act1-ascension-angels');
  if(code==='act'&&Number(chapter)===1&&['요셉','요셉 바사바'].includes(name))return {...id('person','joseph-barsabbas'),canonicalName:'요셉 바사바'};
  if(code==='act'&&Number(chapter)===4&&name==='요한(대제사장 가문)')return {...id('person','john-high-priestly-family-act4'),canonicalName:'요한(대제사장 가문)'};
  if(code==='act'&&[12,13,15].includes(Number(chapter))&&['마가','요한','요한 마가'].includes(name))return {...id('person','john-mark'),canonicalName:'요한 마가'};
  if(code==='act'&&[21,22].includes(Number(chapter))&&name==='천부장'||code==='act'&&Number(chapter)===23&&name==='글라우디오 루시아')return {...id('person','claudius-lysias'),canonicalName:'글라우디오 루시아'};
  if(name==='그리스보'&&(code==='act'&&Number(chapter)===18||code==='1co'&&Number(chapter)===1))return {...id('person','crispus-of-corinth'),canonicalName:'그리스보'};
  if(name==='소스데네'&&code==='act'&&Number(chapter)===18)return id('person','sosthenes-synagogue-ruler-act18');
  if(name==='소스데네'&&code==='1co'&&Number(chapter)===1)return id('person','sosthenes-letter-sender-1co1');
  if(name==='가이오'&&code==='act'&&Number(chapter)===19)return id('person','gaius-macedonian-act19');
  if(name==='가이오'&&code==='act'&&Number(chapter)===20)return id('person','gaius-derbe-act20');
  if(name==='가이오'&&code==='rom'&&Number(chapter)===16||name==='가이오'&&code==='1co'&&Number(chapter)===1)return id('person','gaius-corinth-host');
  if(name==='가이오'&&code==='3jn')return id('person','gaius-third-john');
  if(spiritual.test(name))return id('spiritual',name);
  if(name==='미가엘')return id('spiritual','michael');
  if(name==='가브리엘')return id('spiritual','gabriel');
  if(code==='dan'&&['거룩한 순찰자','넷째 사람','바사 왕국의 군주','헬라 군주','세마포 입은 이','한 천사','인자 같은 이'].includes(name))return id('spiritual',`daniel-vision:${name}`);
  if(code==='dan'&&['다니엘','벨드사살','다니엘(벨드사살)'].includes(name))return {...id('person','daniel'),canonicalName:'다니엘'};
  if(['jer','ezk','2ki','2ch'].includes(code)&&['여호야긴','여고냐','고니야'].includes(name))return {...id('person','jehoiachin-king-of-judah'),canonicalName:'여호야긴(여고냐)'};
  if((code==='jer'&&[21,24,27,28,29,32,34,37,38,39,52].includes(Number(chapter))||code==='ezk'&&[12,17,21].includes(Number(chapter))||code==='2ch'&&Number(chapter)===36||code==='2ki'&&[24,25].includes(Number(chapter)))&&name==='시드기야')return {...id('person','zedekiah-king-of-judah'),canonicalName:'시드기야(유다 왕)'};
  if(code==='lam'&&[1,2].includes(Number(chapter))&&['예루살렘(시온)','딸 시온'].includes(name)||code==='ezk'&&Number(chapter)===16&&name==='예루살렘')return {...id('group','jerusalem-personified-community'),canonicalName:'예루살렘(시온)',mergeAliases:true};
  if(code==='lam'&&[4,5].includes(Number(chapter))&&['시온의 아들들','유다 백성'].includes(name))return {...id('group','lamentations-judah-survivors'),canonicalName:'유다 백성',mergeAliases:true};
  if(code==='lam'&&Number(chapter)===4&&name==='에돔')return id('group','edom');
  if(code==='lam'&&Number(chapter)===4&&name==='기름 부음 받은 왕')return {...id('person','zedekiah-king-of-judah'),canonicalName:'시드기야(유다 왕)'};
  if(code==='ezk'&&Number(chapter)===8&&['유다 장로들','장로 칠십 명'].includes(name))return {...id('group','ezekiel-elders-in-vision'),canonicalName:'에스겔 앞에 모인 장로들',mergeAliases:true};
  if(code==='ezk'&&[9,10].includes(Number(chapter))&&['베옷 입은 서기관','베옷 입은 사람'].includes(name))return {...id('spiritual','ezekiel-linen-clad-executioner'),canonicalName:'세마포 입은 사람',mergeAliases:true};
  if(code==='ezk'&&Number(chapter)>=40&&Number(chapter)<=48&&['놋 같은 사람','측량하는 사람'].includes(name))return {...id('spiritual','ezekiel-temple-vision-guide'),canonicalName:'성전 환상의 안내자',mergeAliases:true};
  if(code==='ezk'&&Number(chapter)===19&&name==='첫째 사자 새끼')return {...id('person','jehoahaz-king-of-judah'),canonicalName:'여호아하스'};
  if(code==='ezk'&&Number(chapter)===19&&name==='둘째 사자 새끼')return {...id('person','jehoiachin-king-of-judah'),canonicalName:'여호야긴(여고냐)'};
  // Jeremiah 40–41's royal Ishmael is Nethaniah's son, not Abraham's son.
  if(code==='jer'&&[40,41].includes(Number(chapter))&&name==='이스마엘')return {...id('person','ishmael-son-of-nethaniah'),canonicalName:'이스마엘(느다냐의 아들)'};
  if(code==='jer'&&Number(chapter)===51&&name==='스라야')return {...id('person','seraiah-son-of-neriah'),canonicalName:'스라야(네리야의 아들)'};
  if(code==='jer'&&Number(chapter)===52&&name==='스라야')return {...id('person','seraiah-high-priest-jer52'),canonicalName:'스라야(대제사장)'};
  if(code==='ezr'&&Number(chapter)===4&&['그 땅 사람들','대적들'].includes(name))return {...id('group','samaritan-adversaries-ezra4'),canonicalName:'대적들',mergeAliases:true};
  if(code==='jas'&&/^(고아와 과부|부자|부한 자들|가난한 사람|품꾼들|선생들)$/.test(name)||code==='1pe'&&/^(왕과 총독|사환들|주인들|아내들|남편들|흩어진 나그네들)$/.test(name)||code==='2pe'&&name==='거짓 선생들'||code==='1jn'&&/^(자녀들|하나님의 자녀들|적그리스도|형제를 미워하는 자)$/.test(name)||code==='2jn'&&/^(택하심을 받은 부녀|부녀의 자녀들|미혹하는 자)$/.test(name))return id('group',name);
  if(group.test(name)||/^(이스라엘|유다)$/.test(name)&&/백성|지파|나라|왕국/.test(role)||/백성|족속|나라|민족|도성|왕국/.test(role))return id('group',name);
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
  if(code==='ezr'&&Number(chapter)===2&&name==='느헤미야(귀환자)')return {...id('person','nehemiah-returnee-ezra2'),canonicalName:'느헤미야(귀환자)'};
  if(code==='ezr'&&Number(chapter)===2&&name==='모르드개(귀환자)')return {...id('person','mordecai-returnee-ezra2'),canonicalName:'모르드개(귀환자)'};
  if(code==='ezr'&&Number(chapter)===4&&['그 땅 사람들','대적들'].includes(name))return {...id('group','samaritan-adversaries-ezra4'),canonicalName:'대적들',mergeAliases:true};
  if(code==='ezr'&&[5,6].includes(Number(chapter))&&name.startsWith('스가랴(잇도'))return {...id('person','zechariah-prophet-grandson-of-iddo'),canonicalName:'스가랴(잇도의 계열)'};
  if((code==='ezr'&&[2,3,4,5,6].includes(Number(chapter))&&name==='예수아')||(code==='hag'&&[1,2].includes(Number(chapter))&&name==='여호수아')||(code==='zec'&&[3,6].includes(Number(chapter))&&name==='여호수아')||(code==='neh'&&Number(chapter)===12&&name==='예수아'))return {...id('person','jeshua-son-of-jehozadak'),canonicalName:'예수아'};
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
  if(name==='발람'&&['num','2pe','rev','jud'].includes(code))return {...id('person','balaam'),canonicalName:'발람'};
  if(name==='가인')return {...id('person','cain'),canonicalName:'가인'};
  if(name==='고라')return {...id('person','korah'),canonicalName:'고라'};
  if(code==='jas'&&name==='야고보')return {...id('person','james-epistle-author'),canonicalName:'야고보'};
  if(code==='jas'&&name==='주 예수 그리스도')return {...id('person','jesus'),canonicalName:'예수'};
  if(name==='요셉') {
    if(code==='gen'||code==='heb'&&Number(chapter)===11||code==='exo'&&Number(chapter)===13||code==='act'&&Number(chapter)===7||code==='jos'&&Number(chapter)===24)return {...id('person','joseph-patriarch'),canonicalName:'요셉'};
    if(/아리마대/.test(role))return id('person','joseph-arimathea');
    if(/마리아|예수.*아버지|남편/.test(role))return id('person','joseph-mary-husband');
    return id('unresolved',`${name}:${code}`,'ambiguous');
  }
  if(name==='멜기세덱')return {...id('person','melchizedek'),canonicalName:'멜기세덱'};
  if(name==='에녹')return {...id('person','enoch'),canonicalName:'에녹'};
  if(name==='바락')return {...id('person','barak'),canonicalName:'바락'};
  if(name==='입다')return {...id('person','jephthah'),canonicalName:'입다'};
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
