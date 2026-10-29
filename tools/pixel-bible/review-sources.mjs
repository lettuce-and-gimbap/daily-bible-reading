// 로컬 참고 자료의 참조 범위를 확인한다. 원문은 출력 파일이나 Git에 복제하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { SOLO_DIALOGUE } from '../../js/features/pixel-bible/solo-dialogue.js';
import { MAJOR_DIALOGUE } from '../../js/features/pixel-bible/major-dialogue.js';
import { PAIR_DIALOGUE } from '../../js/features/pixel-bible/pair-dialogue.js';
import { OBJECT_SCENES } from '../../js/features/pixel-bible/object-scenes.js';
import { ALL_SCENES } from '../../js/features/pixel-bible/scenes.js';
import { parseReference } from '../../js/features/pixel-bible/references.js';
const root=process.env.PIXEL_REFERENCE_ROOT || process.argv[2];
if(!root) throw Error('주석 폴더 경로를 인수 또는 PIXEL_REFERENCE_ROOT로 지정해 주세요.');
const groups={solo:Object.entries(SOLO_DIALOGUE).map(([id,e])=>({id,...e})),major:MAJOR_DIALOGUE,pair:PAIR_DIALOGUE,object:OBJECT_SCENES,scene:ALL_SCENES};
const cache=new Map();
const read=p=>{if(!cache.has(p))cache.set(p,fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));return cache.get(p);};
const chapter=(text,ch)=>text.split(new RegExp('^## '+ch+'(?:장|편)[ \\t]*\\r?$','m'))[1]?.split(/\n## /)[0]||'';
const bibleFiles=fs.readdirSync(path.join(root,'원문_md')),hokmaFiles=fs.readdirSync(path.join(root,'호크마_md'));
const results=[];
// 저장소 밖 원문 md에 절이 빠져 있는 곳. 해당 항목은 오류 대신 기록에 sourceGap으로 남긴다(원문 md를 보강하면 이 목록도 지운다).
const KNOWN_SOURCE_GAPS=new Set(['개역개정4판 예레미야 32:2–5']);
for(const [group,entries] of Object.entries(groups))for(const e of entries){
 const ref=parseReference(e.ref);if(!ref)throw Error('잘못된 참조 '+group+':'+e.id+' '+e.ref);
 const sourceGaps=[];
 const bible=[['개역개정4판',['개역개정4판','개역개정']],['쉬운성경',['쉬운성경']]].map(([ver,prefixes])=>{
  const name=bibleFiles.find(n=>prefixes.some(prefix=>n.startsWith(prefix+'_'))&&n.includes('_'+ref.code+'_'));if(!name)throw Error('원문 없음 '+ver+' '+ref.code);
  const text=chapter(read(path.join(root,'원문_md',name)),ref.chapter);
  const rows=text.split(/\r?\n/).filter(s=>/^\d+ /.test(s)&&(!ref.verses||ref.verses.includes(parseInt(s))));
  const missing=(ref.verses||[]).filter(v=>!rows.some(s=>parseInt(s)===v));if(!rows.length||missing.length){if(rows.length&&KNOWN_SOURCE_GAPS.has(ver+' '+e.ref))sourceGaps.push({version:ver,missing});else throw Error('절 누락 '+e.ref+' '+name+' '+missing);}
  return {name,rows,digest:createHash('sha256').update(rows.join('\n')).digest('hex')};
 });
 const book=e.ref.split(' ')[0];const hk=hokmaFiles.map(name=>({name,text:name.includes('_'+book+'.md')||name.includes('_'+book+'_')?chapter(read(path.join(root,'호크마_md',name)),ref.chapter):''})).find(v=>v.text.trim());
 if(!hk)throw Error('호크마 장 없음 '+e.ref);
 results.push({group,id:e.id,ref:e.ref,bible:bible.map(({name,digest})=>({file:name,sha256:digest})),hokma:{file:hk.name,chapter:ref.chapter,sha256:createHash('sha256').update(hk.text).digest('hex')},...(sourceGaps.length?{sourceGap:sourceGaps}:{})});
 if(process.argv.includes('--preview') && group===process.argv[process.argv.indexOf('--preview')+1]){
  const index=entries.indexOf(e),start=Number(process.argv[process.argv.indexOf('--preview')+2]||0),end=Number(process.argv[process.argv.indexOf('--preview')+3]||entries.length);
  if(index>=start&&index<end){const trim=(s,n)=>s.replace(/\s+/g,' ').slice(0,n);console.log(e.id+' '+e.ref+' | 개역:'+trim(bible[0].rows[0],65)+' | 쉬운:'+trim(bible[1].rows.at(-1),65)+' | 주석:'+trim(hk.text,85));}
 }
}
if(!process.argv.includes('--preview')){
 const out={date:'2026-10-23',scope:'Reference availability and hashes only, not a machine judgment of theological correctness. Semantic corrections and remaining limits are documented in docs/pixel-bible-content-review.md. No source text is embedded.',counts:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length])),entries:results};
 fs.writeFileSync(new URL('../../data/pixel-bible/reference-review.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(out.counts);
}
