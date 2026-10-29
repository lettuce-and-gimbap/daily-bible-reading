// 관계선(data/summary rels)을 개역개정 본문과 대조해 검토하고 기록한다.
//   node tools/pixel-bible/rel-review.mjs todo <book> [ch|ch-ch] [--all]   미검토 관계 + 근거 절(출력만)
//   node tools/pixel-bible/rel-review.mjs apply <patch.json>               수정 반영 + 검토 기록
//   node tools/pixel-bible/rel-review.mjs status [book]                    진행 현황
// 패치: {"<book>|<ch>|<from>|<to>|<label>":{"result":"유지: 이유"|"수정: 이유","label":?,"directed":?,"note":?,"kind":?,"from":?,"to":?,"verses":?,"delete":?}}
// 기록: docs/relation-review-ledger.json (원문은 저장하지 않는다. 원문 md는 저장소 밖에서 읽기만 한다)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'../..');
const summaryDir=path.join(root,'data/summary');
const ledgerDir=path.join(root,'docs/relation-review');
const ledgerFile=code=>path.join(ledgerDir,`${code}.json`);
const sourceDir=process.env.BIBLE_MD||'C:/Users/sam04/OneDrive/Desktop/소명/교회/주석/원문_md';
const key=(code,ch,r)=>`${code}|${ch}|${r.from}|${r.to}|${r.label}`;
const readLedger=code=>fs.existsSync(ledgerFile(code))?JSON.parse(fs.readFileSync(ledgerFile(code),'utf8')):{};
const files=()=>fs.readdirSync(summaryDir).filter(n=>n.endsWith('.json')).map(n=>n.replace('.json',''));

function verseText(code,ch,verses,max=520){
 const file=fs.existsSync(sourceDir)&&fs.readdirSync(sourceDir).find(n=>n.startsWith('개역개정4판_')&&n.includes(`_${code}_`));
 if(!file||!verses||/표제/.test(verses))return '';
 const text=fs.readFileSync(path.join(sourceDir,file),'utf8');
 const start=text.indexOf(`\n## ${ch}장`);if(start<0)return '';
 const end=text.indexOf('\n## ',start+4),body=text.slice(start,end<0?undefined:end);
 const wanted=new Set();
 for(const part of String(verses).split(/,\s*/)){const [a,b]=part.split(/[-–]/).map(Number);if(!a)continue;for(let v=a;v<=(b||a)&&v<a+8;v++)wanted.add(v);}
 return body.split(/\r?\n/).filter(s=>{const m=s.match(/^(\d+)(?:-(\d+))? /);if(!m)return false;for(let v=+m[1];v<=+(m[2]||m[1]);v++)if(wanted.has(v))return true;return false;}).join(' ').slice(0,max);
}
const inRange=(ch,range)=>{if(!range)return true;const [a,b]=range.split('-').map(Number);return ch>=a&&ch<=(b||a);};

function todo(code,range,all){
 const book=JSON.parse(fs.readFileSync(path.join(summaryDir,`${code}.json`),'utf8')),ledger=readLedger(code);
 let shown=0;
 for(const [ch,c] of Object.entries(book.chapters)){
  if(!inRange(Number(ch),range))continue;
  const rows=(c.rels||[]).filter(r=>all||!ledger[key(code,ch,r)]);if(!rows.length)continue;
  console.log(`## ${code} ${ch}`);
  for(const r of rows){
   shown++;
   console.log(`KEY ${key(code,ch,r)} | ${r.kind}${r.directed?' →':' —'} | ${r.verses||''}절`);
   console.log(`  ${r.from} —${r.label}${r.directed?'→':'—'} ${r.to}`);
   if(r.note)console.log(`  NOTE ${r.note}`);
   const v=verseText(code,ch,r.verses);if(v)console.log(`  VERSE ${v}`);
  }
 }
 console.log(`-- ${code} 미검토 ${shown}건`);
}

// 원본 서식을 유지하며 관계 한 개의 JSON 조각만 바꾼다.
function objectSpan(text,from,to,label,ch){
 const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const re=new RegExp(`"from"\\s*:\\s*"${esc(from)}"\\s*,\\s*"to"\\s*:\\s*"${esc(to)}"\\s*,\\s*"label"\\s*:\\s*"${esc(label)}"`,'g');
 // 같은 from|to|label이 여러 장에 있으므로 해당 장 시작 이후의 첫 일치를 쓴다.
 const chap=new RegExp(`"chapters"[\\s\\S]*?"${ch}"\\s*:\\s*\\{`).exec(text);
 re.lastIndex=chap?chap.index+chap[0].length:0;
 const m=re.exec(text);if(!m)return null;
 let s=m.index;while(text[s]!=='{')s--;
 let depth=0,inStr=false,i=s;
 for(;i<text.length;i++){const ch=text[i];
  if(inStr){if(ch==='\\')i++;else if(ch==='"')inStr=false;continue;}
  if(ch==='"')inStr=true;else if(ch==='{')depth++;else if(ch==='}'){depth--;if(depth===0)break;}}
 return [s,i+1];
}
function apply(file){
 const patch=JSON.parse(fs.readFileSync(file,'utf8'));
 const byBook={};for(const [k,v] of Object.entries(patch)){const code=k.split('|')[0];(byBook[code]??=[]).push([k,v]);}
 let edited=0,deleted=0,kept=0,bad=[];
 for(const [code,items] of Object.entries(byBook)){
  const ledger=readLedger(code);const p=path.join(summaryDir,`${code}.json`);let text=fs.readFileSync(p,'utf8');
  const data=JSON.parse(text);
  for(const [k,v] of items){
   const [,ch,from,to,label]=k.split('|');
   const rel=(data.chapters[ch]?.rels||[]).find(r=>r.from===from&&r.to===to&&r.label===label);
   if(!rel){bad.push(k);continue;}
   if(!v.result){bad.push(k+' (result 없음)');continue;}
   const fields=['from','to','label','kind','directed','weight','verses','note'].filter(f=>f in v);
   if(!v.delete&&!fields.length){ledger[k]=v.result;kept++;continue;}
   const span=objectSpan(text,from,to,label,ch);if(!span){bad.push(k+' (위치)');continue;}
   const raw=text.slice(span[0],span[1]);
   if(v.delete){
    let a=span[0],b=span[1];
    const after=/^\s*,/.exec(text.slice(b));
    if(after)b+=after[0].length;
    else{const before=/,\s*$/.exec(text.slice(0,a));if(before)a-=before[0].length;}
    // 줄 전체가 이 객체뿐이면 줄도 지운다.
    const ls=text.lastIndexOf('\n',a-1)+1;if(/^\s*$/.test(text.slice(ls,a)))a=ls;
    const le=text.indexOf('\n',b);if(le>=0&&/^\s*$/.test(text.slice(b,le)))b=le+1;
    text=text.slice(0,a)+text.slice(b);deleted++;ledger[k]=v.result;continue;
   }
   const next={...rel};for(const f of fields)next[f]=v[f];
   const multi=raw.includes('\n');
   let out;
   if(multi){const ind=/\n([ \t]*)"from"/.exec(raw)?.[1]??'';const base=ind.slice(0,Math.max(0,ind.length-2));
    out=JSON.stringify(next,null,2).split('\n').map((x,idx)=>idx?base+x:x).join('\n');}
   else out=JSON.stringify(next);
   text=text.slice(0,span[0])+out+text.slice(span[1]);edited++;
   ledger[key(code,ch,next)]=v.result;if(k!==key(code,ch,next))ledger[k]=v.result;
  }
  JSON.parse(text);fs.writeFileSync(p,text);
  fs.mkdirSync(ledgerDir,{recursive:true});
  fs.writeFileSync(ledgerFile(code),'{\n'+Object.entries(ledger).sort(([x],[y])=>x<y?-1:1).map(([k,v])=>JSON.stringify(k)+':'+JSON.stringify(v)).join(',\n')+'\n}\n');
 }
 console.log(`수정 ${edited}, 삭제 ${deleted}, 유지 ${kept}`+(bad.length?`, 실패 ${bad.length}: ${bad.slice(0,5).join(' / ')}`:''));
}
function status(only){
 let total=0,done=0;
 for(const code of files()){if(only&&code!==only)continue;const ledger=readLedger(code);
  const b=JSON.parse(fs.readFileSync(path.join(summaryDir,`${code}.json`),'utf8'));let t=0,d=0;
  for(const [ch,c] of Object.entries(b.chapters))for(const r of c.rels||[]){t++;if(ledger[key(code,ch,r)])d++;}
  total+=t;done+=d;if(only||d<t)console.log(`${code}\t${d}/${t}`);}
 console.log(`합계 ${done}/${total}`);
}
const [cmd,a,b,c]=process.argv.slice(2);
if(cmd==='todo')todo(a,b&&!b.startsWith('--')?b:null,process.argv.includes('--all'));
else if(cmd==='apply')apply(a);
else if(cmd==='status')status(a);
else console.log('사용법: todo <book> [ch-ch] | apply <patch.json> | status [book]');
