// 관계도(data/summary rels)마다 관계에 맞는 조우 대화를 data/pixel-bible/relation-talk/<book>.json에 둔다.
//   node tools/pixel-bible/relation-talk.mjs todo <book> [ch|ch-ch] [--all]   작성할 관계와 근거 절(개역개정, 출력만)
//   node tools/pixel-bible/relation-talk.mjs apply <patch.json>               {"book":{"ch|from|to":[[a,b],...]}} 병합
//   node tools/pixel-bible/relation-talk.mjs check [book...]                  형식·길이·누락 검사
// 원문 md는 저장소 밖(BIBLE_MD 또는 기본 주석 폴더)에서 읽기만 하고 저장소에 쓰지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'../..');
const summaryDir=path.join(root,'data/summary'),talkDir=path.join(root,'data/pixel-bible/relation-talk');
const sourceDir=process.env.BIBLE_MD||'C:/Users/sam04/OneDrive/Desktop/소명/교회/주석/원문_md';
const LINE={min:12,max:80};
const BANNED=/안녕하세요|안녕하십니까|반갑습니다/;
const readJson=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const talkFile=code=>path.join(talkDir,`${code}.json`);
const loadTalk=code=>fs.existsSync(talkFile(code))?readJson(talkFile(code)):{book:code,talk:{}};
function saveTalk(data){
 fs.mkdirSync(talkDir,{recursive:true});
 const keys=Object.keys(data.talk).sort((a,b)=>Number(a.split('|')[0])-Number(b.split('|')[0])||a.localeCompare(b));
 const body=keys.map(k=>`    ${JSON.stringify(k)}: ${JSON.stringify(data.talk[k])}`).join(',\n');
 fs.writeFileSync(talkFile(data.book),`{\n  "book": ${JSON.stringify(data.book)},\n  "talk": {\n${body}\n  }\n}\n`);
}
const relKey=(ch,r)=>`${ch}|${r.from}|${r.to}`;
// 하나님은 월드 인물로 세우지 않으므로 하나님과의 관계선은 대화 대상이 아니다(chapter-dialogue.js와 같은 기준).
const DIVINE=/^(하나님|여호와|성령|주님)$/;
const speakable=r=>!DIVINE.test(r.from)&&!DIVINE.test(r.to);
async function pairIndex(){
 const {PAIR_DIALOGUE}=await import(new URL('../../js/features/pixel-bible/pair-dialogue.js',import.meta.url));
 const map=new Map();for(const p of PAIR_DIALOGUE)map.set(`${p.chapter}|${p.speaker}|${p.target}`,p);return map;
}
function verseText(code,ch,verses){
 const file=fs.existsSync(sourceDir)&&fs.readdirSync(sourceDir).find(n=>n.startsWith('개역개정4판_')&&n.includes(`_${code}_`));
 if(!file||!verses||verses==='표제')return '';
 const text=fs.readFileSync(path.join(sourceDir,file),'utf8');
 const start=text.indexOf(`\n## ${ch}${code==='psa'?'편':'장'}`);if(start<0)return '';
 const end=text.indexOf('\n## ',start+4),body=text.slice(start,end<0?undefined:end);
 const wanted=new Set();for(const part of verses.split(/,\s*/)){const [a,b]=part.split('-').map(Number);for(let v=a;v<=(b||a)&&v<a+6;v++)wanted.add(v);}
 // "3-5 본문"처럼 여러 절이 한 줄로 합쳐진 줄은 그 범위의 어느 절이든 원하면 보여 준다.
 return body.split(/\r?\n/).filter(s=>{const m=s.match(/^(\d+)(?:-(\d+))? /);if(!m)return false;for(let v=+m[1];v<=+(m[2]||m[1]);v++)if(wanted.has(v))return true;return false;}).join(' ').slice(0,420);
}
function inRange(ch,range){if(!range)return true;const [a,b]=range.split('-').map(Number);return ch>=a&&ch<=(b||a);}

async function todo(code,range,all){
 const book=readJson(path.join(summaryDir,`${code}.json`)),talk=loadTalk(code).talk,pairs=await pairIndex();
 for(const [ch,c] of Object.entries(book.chapters)){
  if(!inRange(Number(ch),range)||!(c.rels||[]).length)continue;
  const roles=Object.fromEntries((c.people||[]).map(p=>[p.name,p.role||'']));
  const rows=c.rels.filter(r=>speakable(r)&&(all||!talk[relKey(ch,r)]));if(!rows.length)continue;
  console.log(`## ${code} ${ch} — ${c.line||''}`);
  for(const r of rows){
   const p=pairs.get(`${code}.${ch}|${r.from}|${r.to}`)||pairs.get(`${code}.${ch}|${r.to}|${r.from}`);
   console.log(`KEY ${relKey(ch,r)} | ${r.from}(${roles[r.from]||''}) → ${r.to}(${roles[r.to]||''}) | ${r.label||''}/${r.kind||''} | ${r.verses||''}절`);
   if(r.note)console.log(`  NOTE ${r.note}`);
   const v=verseText(code,ch,r.verses);if(v)console.log(`  VERSE ${v}`);
   if(p)console.log(`  HAS ${p.speaker}: ${p.lines?.[0]||''} / ${p.target}: ${p.replyLines?.[0]||''}`);
   if(talk[relKey(ch,r)])console.log(`  TALK ${JSON.stringify(talk[relKey(ch,r)])}`);
  }
 }
}
function apply(file){
 const patch=readJson(file);
 for(const [code,entries] of Object.entries(patch)){
  const data=loadTalk(code);
  for(const [k,v] of Object.entries(entries)){if(v===null)delete data.talk[k];else data.talk[k]=v;}
  saveTalk(data);console.log(`${code}: ${Object.keys(entries).length}개 반영 (총 ${Object.keys(data.talk).length})`);
 }
}
async function check(only){
 const pairs=await pairIndex();let errors=0,missing=0,total=0;
 const codes=fs.readdirSync(summaryDir).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5)).filter(c=>!only.length||only.includes(c));
 for(const code of codes){
  const book=readJson(path.join(summaryDir,`${code}.json`)),talk=loadTalk(code).talk,valid=new Set();let miss=0;
  for(const [ch,c] of Object.entries(book.chapters))for(const r of (c.rels||[]).filter(speakable)){
   const k=relKey(ch,r);valid.add(k);total++;
   if(!talk[k]&&!pairs.has(`${code}.${ch}|${r.from}|${r.to}`)&&!pairs.has(`${code}.${ch}|${r.to}|${r.from}`))miss++;
  }
  for(const [k,v] of Object.entries(talk)){
   const bad=m=>{errors++;console.log(`오류 ${code} ${k}: ${m}`);};
   if(!valid.has(k)){bad('관계도에 없는 키');continue;}
   if(!Array.isArray(v)||!v.length||v.length>3){bad('대화는 1~3쌍');continue;}
   v.forEach((pair,i)=>{
    if(!Array.isArray(pair)||pair.length!==2)return bad(`${i}번 쌍 형식`);
    pair.forEach(s=>{const n=[...String(s)].length;if(n<LINE.min||n>LINE.max)bad(`${i}번 ${n}자 (${LINE.min}~${LINE.max}): ${s}`);if(BANNED.test(s))bad(`어색한 인사: ${s}`);});
   });
  }
  missing+=miss;if(only.length)console.log(`${code}: 미작성 ${miss}`);
 }
 console.log(`관계 ${total}개, 미작성 ${missing}개, 오류 ${errors}개`);
 if(errors)process.exitCode=1;
}

const [cmd,...args]=process.argv.slice(2);
if(cmd==='todo')await todo(args[0],args.find((a,i)=>i>0&&/^\d/.test(a)),args.includes('--all'));
else if(cmd==='apply')apply(args[0]);
else if(cmd==='check')await check(args);
else console.log('사용법: todo <book> [ch-ch] [--all] | apply <patch.json> | check [book...]');
