import {majorFor,occurrenceMatches} from './chapter-dialogue.js';
import {SOLO_DIALOGUE} from './solo-dialogue.js';
import {characterStyle} from './art.js';
const scopes={'바로':'exo.5','다리오':'dan.6','벤하닷':'1ki.20','요나단':'1sa.18','스가랴':'zec.4','아하시야':'2ki.1'};
// 자료의 역할로 대사의 어휘를 고르며, 기록되지 않은 구체적 사건은 새로 만들지 않는다.
const voices=[
 [/거짓|모함|탐욕|빼앗|우상|대적|박해|악한|반역/,['내 뜻대로 되지 않는 일이 자꾸 마음에 걸리는군.','사람들이 어떤 말을 하는지 더 들어 봐야겠어.','내가 붙들고 있는 것을 쉽게 내줄 수는 없지.']],
 [/고침|치유|나은|일어나 걸|회복/,['다시 내딛는 이 걸음이 참 새롭구나.','나를 일으켜 준 그 순간을 잊지 말아야지.','오늘 내게 일어난 일을 마음에 새겨 두자.']],
 [/왕|통치|왕비|왕후/,['내 결정이 다른 이들의 삶에도 닿는구나.','곁에서 들려오는 말들을 찬찬히 살펴보자.','이 자리에 앉았다고 모든 것을 아는 건 아니겠지.']],
 [/선지|예언|말씀.*전|전.*말씀/,['전해야 할 말을 쉽게 바꿀 수는 없어.','들은 말씀을 마음속에서 다시 되새겨 보자.','사람들이 듣고 싶어 하는 말만 할 수는 없지.']],
 [/제사장|레위|성전.*섬|예배/,['맡은 일을 가볍게 여기지 말아야겠어.','오늘도 섬길 자리를 찬찬히 살펴보자.','겉모습만 갖추고 마음을 놓치지는 말자.']],
 [/사도|복음|전도|증인|제자/,['듣고 본 것을 잘 기억해 두자.','만나는 이에게 전할 말을 마음에 담아 두자.','배운 것을 내 삶에서도 따라가야겠어.']],
 [/어머니|아버지|아내|남편|아들|딸|형제|누이|가족/,['가족과 함께한 시간을 잠시 떠올려 보자.','가까운 사이라고 마음까지 다 아는 건 아니겠지.','내 곁에 있는 이들의 이야기도 들어 보자.']],
 [/군대|군인|장군|용사|전쟁|싸움/,['앞만 보지 말고 곁에 있는 이들도 살펴야겠어.','다음 걸음을 내딛기 전에 주위를 살펴보자.','힘이 있다고 모든 일이 풀리는 것은 아니겠지.']],
 [/종|일꾼|섬기|추수|농부|목자/,['내 손에 맡겨진 일을 하나씩 해 보자.','잠시 숨을 고르고 다시 일을 살펴봐야겠어.','작은 일이라도 대충 넘기지 말자.']],
 [/가난|고통|병|갇힌|죄수|도망|피신|지친|상처/,['지금은 잠깐 숨을 고르고 싶구나.','내 마음을 들어 줄 이가 곁에 있으면 좋겠어.','오늘의 한 걸음을 천천히 내디뎌 보자.']],
 [/노래|찬양|시인|연주/,['마음에 담긴 이야기를 가락에 실어 보자.','이 순간을 오래 기억할 노래가 있을까.','잠시 멈추고 마음의 소리에 귀를 기울여 보자.']],
];
const neutral=['지금 내 앞에 놓인 일을 찬찬히 살펴보자.','내 곁에 있는 이들의 이야기도 들어 봐야겠어.','지나온 일들을 돌아보며 다음 걸음을 생각하자.'];
export function personalLines(n,chapters,context){
 const occurrences=context.people.filter(p=>occurrenceMatches(n,p));
 const style=characterStyle(n.name,0,n.role||'',n.refs||[]);
 const sources=new Set(chapters.map(c=>`${c.code}.${c.chap}`));
 const authored=majorFor(n,context)||(style.key!=='generic'&&(!scopes[style.name]||sources.has(scopes[style.name]))?SOLO_DIALOGUE[style.name]:null);
 const role=occurrences.map(p=>p.role).join(' ');
 const voice=(voices.find(([pattern])=>pattern.test(role))||[null,neutral])[1];
 const lines=[];
 const add=(text,ref,origin)=>{if(text&&!lines.some(l=>l.text===text))lines.push({text,ref,origin});};
 if(authored)authored.lines.forEach(text=>add(text,authored.ref,'authored'));
 const ref=occurrences[0]?.ref||n.refs?.[0]||'';
 // 현재 장의 실제 역할과 관계를 독백 옆 참고 구절로 연결한다.
 const relation=context.relations.find(r=>occurrenceMatches(n,r.from)||occurrenceMatches(n,r.to));
 if(relation){const other=occurrenceMatches(n,relation.from)?relation.to:relation.from;
  add(`${other.name}… 서로 얽힌 일을 다시 생각하게 되는구나.`,relation.ref,'relationship-variation');}
 for(const text of voice)add(text,ref,'context-variation');
 return lines.slice(0,5).map((line,i)=>({...line,id:`personal:${n.identity?.id||n.name}:${ref}:${i}`,speaker:n,kind:line.origin==='authored'?'solo':'context'}));
}
