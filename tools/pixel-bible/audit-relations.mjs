// 관계선(rels) 전수 점검: 방향·가족 역할·수 표기 문제를 찾는다.
//   node tools/pixel-bible/audit-relations.mjs            요약 + 의심 목록
//   node tools/pixel-bible/audit-relations.mjs --json     의심 목록을 JSON으로 출력
// 약속: 방향 있는 관계의 label은 from 인물의 역할이다. (야발 —아들→ 라멕 = 야발은 라멕의 아들)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=path.join(root,'data/summary');

// 한쪽 인물의 역할만 말하는 가족 호칭(방향이 필요하다). 양쪽 같은 호칭(형제·자매·부부…)은 제외한다.
const ROLE=/^(?:첫째|둘째|셋째|넷째|맏|막내|큰|작은|친|양|이복|외|의붓|시|처)?\s*(아들|딸|아버지|어머니|아빠|남편|아내|형|동생|누이|누나|오빠|언니|조카|손자|손녀|며느리|사위|장인|장모|시아버지|시어머니|시누이|후손|자손|양아들|양딸|생질|외삼촌|삼촌|숙부|이모|고모|할아버지|할머니|증손|조상)/;
const SYMMETRIC=/(형제|자매|남매|부부|쌍둥이|사촌|친척|친족|동서|약혼)/;
const DIGIT=/(?<![\d.:\-–~,/A-Za-z가-힣])[1-9]\s?(?:사람|손|왕|선지자|제자|천사|형제|아들|딸|친구|여인|용사|목자|종|아이|군사|사도|교회|역본|잔|마리|곳|지파|족속|제사장|장로)/;

const rows=[];
for(const f of fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort()){
  const book=f.replace('.json','');
  const j=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
  for(const [ch,v] of Object.entries(j.chapters||{}))
    (v.rels||[]).forEach((r,i)=>rows.push({book,ch,i,...r}));
}

const issues=[];
const add=(code,r,msg)=>issues.push({code,id:`${r.book}.${r.ch}.${r.i}`,from:r.from,label:r.label,to:r.to,directed:!!r.directed,msg});

const byChapter=new Map();
for(const r of rows){
  const key=`${r.book}.${r.ch}`;
  if(!byChapter.has(key))byChapter.set(key,[]);
  byChapter.get(key).push(r);
  if(!r.from||!r.to||!r.label)add('MISSING',r,'필수 항목 없음');
  if(r.from===r.to)add('SELF',r,'자기 자신을 잇는 관계');
  const role=ROLE.test(r.label)&&!SYMMETRIC.test(r.label);
  if(role&&!r.directed)add('NO_DIRECTION',r,'가족 역할인데 방향이 없음');
  if(DIGIT.test(r.label)||DIGIT.test(r.note||''))add('DIGIT',r,'우리말 수 관형사가 숫자로 바뀐 듯함');
  // 설명이 "to의 <역할>이에요" 꼴로 from을 부모로 말하는데 label이 자녀 역할이면 방향이 뒤집힌 것이다.
  if(r.directed&&/^(아들|딸|맏아들|둘째 아들|막내아들|양아들|손자|손녀|며느리|사위)$/.test(r.label)&&r.note){
    const m=r.note.match(new RegExp(`${r.to}[은는이가]?\\s*${r.from}의\\s*(아들|딸|손자|손녀|며느리|사위)`));
    if(m)add('REVERSED',r,`설명은 ${r.to}를 ${r.from}의 ${m[1]}로 말함`);
  }
  if(r.directed&&/^(아버지|어머니|할아버지|할머니|시아버지|장인)$/.test(r.label)&&r.note){
    const m=r.note.match(new RegExp(`${r.to}[은는이가]?\\s*${r.from}의\\s*(아버지|어머니|아빠|할아버지|할머니|시아버지|장인)`));
    if(m)add('REVERSED',r,`설명은 ${r.to}를 ${r.from}의 ${m[1]}로 말함`);
  }
}
// 같은 장에서 A→B, B→A가 같은 비대칭 역할이면 한쪽이 틀렸다.
for(const list of byChapter.values())
  for(const a of list){
    if(!a.directed||!ROLE.test(a.label)||SYMMETRIC.test(a.label))continue;
    for(const b of list)
      if(b!==a&&b.directed&&b.from===a.to&&b.to===a.from&&b.label===a.label)
        add('MUTUAL_SAME_ROLE',a,`${a.to} → ${a.from}도 같은 역할 "${b.label}"`);
  }

const count={};for(const x of issues)count[x.code]=(count[x.code]||0)+1;
if(process.argv.includes('--json')){console.log(JSON.stringify(issues,null,1));process.exit(0);}
console.log(`관계 ${rows.length}건, 서술어 ${new Set(rows.map(r=>r.label)).size}종, 의심 ${issues.length}건`,count);
for(const x of issues)console.log(`${x.code}\t${x.id}\t${x.from} —${x.label}${x.directed?'→':'—'} ${x.to}\t${x.msg}`);
process.exitCode=issues.some(x=>x.code==='MISSING'||x.code==='SELF')?1:0;
