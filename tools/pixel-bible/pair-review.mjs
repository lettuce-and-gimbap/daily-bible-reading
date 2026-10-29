// 기존 pair-dialogue(PAIR_DIALOGUE) 항목을 본문과 대조해 고치고 검토 기록(docs/existing-pair-dialogue-review.json)을 갱신한다.
//   node tools/pixel-bible/pair-review.mjs todo <book> [장|장-장]   검토 대기 항목과 해당 절의 개역개정·쉬운성경(출력만)
//   node tools/pixel-bible/pair-review.mjs apply <patch.json>      {"<id>":{"result":"유지: …"|"수정: …","lines":[..],"replyLines":[..],"detail":"..","lineDetails":[..]}}
//   node tools/pixel-bible/pair-review.mjs status                  권별 남은 수
// 원문 md는 저장소 밖(BIBLE_MD)에서 읽기만 하고 저장소에 쓰지 않는다. 역본 원문 문자열은 어디에도 복사하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dataFile=path.join(root,'js/features/pixel-bible/pair-dialogue.js');
const ledgerFile=path.join(root,'docs/existing-pair-dialogue-review.json');
const sourceDir=process.env.BIBLE_MD||'C:/Users/sam04/OneDrive/Desktop/소명/교회/주석/원문_md';
const SOURCES='비공개 개역개정·쉬운성경 및 호크마 참고 정리';
const BANNED=/안녕하세요|안녕하십니까|반갑습니다/;
const readLedger=()=>JSON.parse(fs.readFileSync(ledgerFile,'utf8'));

function verseNumbers(ref){
 const tail=ref.includes(':')?ref.slice(ref.indexOf(':')+1):'';
 const wanted=new Set();
 for(const part of tail.split(/\s*,\s*/)){
  const m=part.match(/^(\d+)(?:\s*[-–]\s*(\d+))?/);if(!m)continue;
  const a=+m[1],b=+(m[2]||m[1]);for(let v=a;v<=b&&v<a+14;v++)wanted.add(v);
 }
 return wanted;
}
function verseText(prefix,code,chapter,ref){
 const file=fs.existsSync(sourceDir)&&fs.readdirSync(sourceDir).find(n=>n.startsWith(prefix+'_')&&n.includes(`_${code}_`));
 if(!file)return '';
 const text=fs.readFileSync(path.join(sourceDir,file),'utf8').replace(/\r\n/g,'\n');
 const unit=code==='psa'?'편':'장',start=text.indexOf(`\n## ${chapter}${unit}\n`);if(start<0)return '';
 const end=text.indexOf('\n## ',start+4),body=text.slice(start,end<0?undefined:end);
 const wanted=verseNumbers(ref);
 return body.split('\n').filter(s=>{const m=s.match(/^(\d+)(?:-(\d+))? /);if(!m)return false;for(let v=+m[1];v<=+(m[2]||m[1]);v++)if(wanted.has(v))return true;return false;}).join(' ');
}
async function load(){
 const mod=await import(pathToFileURL(dataFile).href+'?t='+Date.now());
 return mod.PAIR_DIALOGUE;
}
function inRange(chapter,range){
 if(!range)return true;const [a,b]=range.split('-').map(Number);return chapter>=a&&chapter<=(b||a);
}
async function todo(book,range){
 const entries=await load(),ledger=readLedger(),byId=new Map(entries.map(e=>[e.id,e]));
 let count=0;
 for(const row of ledger.entries){
  if(row.status!=='pending')continue;
  const [code,chap]=row.chapter.split('.');
  if(code!==book||!inRange(Number(chap),range))continue;
  const e=byId.get(row.id);if(!e){console.log(`ID없음 ${row.id}`);continue;}
  count++;
  console.log(`## ${e.id} | ${e.speaker} → ${e.target} | ${e.ref}`);
  console.log(`  LINES ${JSON.stringify(e.lines)}`);
  console.log(`  REPLY ${JSON.stringify(e.replyLines)}`);
  if(e.lineDetails)console.log(`  LINEDETAILS ${e.lineDetails.length}개`);
  console.log(`  DETAIL ${e.detail||''}`);
  const gae=verseText('개역개정4판',code,Number(chap),e.ref),easy=verseText('쉬운성경',code,Number(chap),e.ref);
  if(gae)console.log(`  개역개정 ${gae.slice(0,700)}`);
  if(easy)console.log(`  쉬운성경 ${easy.slice(0,500)}`);
 }
 console.log(`-- ${book} 대기 ${count}개`);
}
// 객체 하나(중괄호 균형, 문자열 안 중괄호 무시)의 시작·끝 위치를 찾는다.
function entryRange(src,id){
 const at=src.search(new RegExp(`["']?id["']?\\s*:\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`));
 if(at<0)return null;
 let start=src.lastIndexOf('{',at),depth=0,inStr=false,i=start;
 for(;i<src.length;i++){
  const c=src[i];
  if(inStr){if(c==='\\')i++;else if(c==='"')inStr=false;continue;}
  if(c==='"')inStr=true;else if(c==='{')depth++;else if(c==='}'){depth--;if(!depth)return [start,i+1];}
 }
 return null;
}
const pretty=entry=>JSON.stringify(entry,null,2).split('\n').map((l,i)=>i?'  '+l:l).join('\n');
// 여러 도우미가 동시에 apply해도 서로의 수정을 덮지 않도록 잠금 파일로 한 번에 하나씩 처리한다.
const lockFile=path.join(root,'docs/.pair-review.lock');
function withLock(fn){
 const deadline=Date.now()+120000;
 for(;;){
  try{fs.closeSync(fs.openSync(lockFile,'wx'));break;}catch(e){
   if(e.code!=='EEXIST')throw e;
   try{if(Date.now()-fs.statSync(lockFile).mtimeMs>60000)fs.unlinkSync(lockFile);}catch(_){}
   if(Date.now()>deadline)throw new Error('잠금 대기 시간 초과');
   Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,200);
  }
 }
 return Promise.resolve().then(fn).finally(()=>{try{fs.unlinkSync(lockFile);}catch(_){}});
}
async function apply(file){return withLock(()=>applyLocked(file));}
async function applyLocked(file){
 const patch=JSON.parse(fs.readFileSync(file,'utf8')),entries=await load(),byId=new Map(entries.map(e=>[e.id,e]));
 const ledger=readLedger(),rows=new Map(ledger.entries.map(r=>[r.id,r]));
 let src=fs.readFileSync(dataFile,'utf8');const crlf=src.includes('\r\n');if(crlf)src=src.replace(/\r\n/g,'\n');
 let changed=0,kept=0;
 for(const [id,p] of Object.entries(patch)){
  const row=rows.get(id),entry=byId.get(id);
  if(!row||!entry)throw new Error(`알 수 없는 id ${id}`);
  if(!/^(유지|수정): /.test(p.result||''))throw new Error(`${id}: result는 "유지: …" 또는 "수정: …"`);
  const next={...entry};
  for(const k of ['lines','replyLines','detail','lineDetails','ref'])if(p[k]!==undefined)next[k]=p[k];
  for(const k of ['lines','replyLines'])if(!Array.isArray(next[k])||!next[k].length||next[k].some(s=>typeof s!=='string'||[...s].length<8||[...s].length>140))throw new Error(`${id}: ${k} 형식/길이(8~140자)`);
  if(next.lines.length!==next.replyLines.length)throw new Error(`${id}: lines와 replyLines 개수가 다름`);
  if([...next.lines,...next.replyLines].some(s=>BANNED.test(s)))throw new Error(`${id}: 빈 인사 금지`);
  if(next.lineDetails&&next.lineDetails.length!==next.lines.length)throw new Error(`${id}: lineDetails 개수(${next.lineDetails.length})가 lines(${next.lines.length})와 다름 — lineDetails도 함께 주세요`);
  if(!next.detail||!/[.。다요]$/.test(next.detail.trim()))throw new Error(`${id}: detail은 문장으로 끝나야 함`);
  const range=entryRange(src,id);if(!range)throw new Error(`${id}: 소스에서 위치를 못 찾음`);
  if(JSON.stringify(next)!==JSON.stringify(entry)){src=src.slice(0,range[0])+pretty(next)+src.slice(range[1]);changed++;}else kept++;
  row.status='source-reviewed';row.sources=SOURCES;row.result=p.result;
 }
 ledger.reviewed=ledger.entries.filter(r=>r.status!=='pending').length;ledger.pending=ledger.entries.length-ledger.reviewed;
 fs.writeFileSync(dataFile,crlf?src.replace(/\n/g,'\r\n'):src);
 fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2)+'\n');
 console.log(`반영 ${Object.keys(patch).length}개 (내용 수정 ${changed}, 유지 ${kept}) · 남은 대기 ${ledger.pending}`);
}
async function status(){
 const ledger=readLedger(),c={};
 for(const r of ledger.entries)if(r.status==='pending'){const b=r.chapter.split('.')[0];c[b]=(c[b]||0)+1;}
 console.log(`대기 ${ledger.pending}/${ledger.total}`,JSON.stringify(c));
}
const [cmd,...args]=process.argv.slice(2);
if(cmd==='todo')await todo(args[0],args[1]);
else if(cmd==='apply')await apply(args[0]);
else if(cmd==='status')await status();
else console.log('사용법: todo <book> [장-장] | apply <patch.json> | status');
