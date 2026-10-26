import {creatureForName} from './creatures.js';
import { APPEARANCES } from './appearance.js';
const knownPeople=new Set(Object.values(APPEARANCES).map(p=>p.name).filter(n=>!['천사','일꾼'].includes(n)));
const spiritual=/^(하나님|여호와|성령|주님|천사|사탄|마귀|어린 양)$/;
const group=/자손|백성|사람들|성도|제자들|무리|장로들|제사장들|레위인들|지파|족속|군대|원수들|악인들|의인들/;
// 이름 문자열을 곧 고유 인물로 취급하지 않는다. 모호한 것은 미해결로 남긴다.
export function resolveIdentity(name,{code='',chapter=0,role=''}={}) {
  const id=(kind,key,status='reviewed-rule')=>({kind,id:`${kind}:${key}`,status});
  const creature=creatureForName(name,role,code);if(creature)return id(creature.kind,creature.id);
  if(spiritual.test(name))return id('spiritual',name);
  if(group.test(name)||/^(이스라엘|유다)$/.test(name)&&/백성|지파|나라|왕국/.test(role))return id('group',name);
  if(['예수','예수님','그리스도'].includes(name))return id('person','jesus');
  if(name==='사울') {
    if(code==='act'||/바울/.test(role))return id('person','paul');
    if(['1sa','2sa','1ch'].includes(code)||/이스라엘.*왕|다윗.*왕/.test(role))return id('person','saul-king');
    return id('unresolved',`${name}:${code}`,'ambiguous');
  }
  // 열왕기하 15장의 불은 불꽃이 아니라 은을 받은 앗수르 왕 풀(Pul)이에요.
  if(name==='불'&&code==='2ki'&&/왕|앗수르/.test(role))return id('person','assyria-king-pul','verse-reviewed');
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
