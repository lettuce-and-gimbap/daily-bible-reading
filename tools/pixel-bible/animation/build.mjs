import fs from 'node:fs';
import crypto from 'node:crypto';
import {ANIMATION_MOTIFS} from '../../../js/features/pixel-bible/event-animation/motifs.js';
import {OBJECT_CATALOG} from '../../../js/features/pixel-bible/object-catalog.js';
const testament=process.argv.includes('--nt')?'nt':'ot',suffix=testament==='nt'?'-nt':'';
const root='data/pixel-bible/events/',plans=JSON.parse(fs.readFileSync('tools/pixel-bible/animation/book-plans'+suffix+'.json')),
 corrections=JSON.parse(fs.readFileSync('tools/pixel-bible/animation/corrections'+suffix+'.json'));
const overridesFile='tools/pixel-bible/animation/stage-overrides'+suffix+'.json',overrides=fs.existsSync(overridesFile)?JSON.parse(fs.readFileSync(overridesFile)):{};
const durations=[1,1.2,1.5,1.8,1.5,1.2];
const previous=fs.existsSync('data/pixel-bible/animation-review'+suffix+'.json')?JSON.parse(fs.readFileSync('data/pixel-bible/animation-review'+suffix+'.json')):{};
const rendererFiles=['pixel-event.js','art.js','directions.js',...['motifs','timeline','stage','effects','rig'].map(n=>'event-animation/'+n+'.js')];
const rendererSha256=crypto.createHash('sha256').update(rendererFiles.map(p=>fs.readFileSync('js/features/pixel-bible/'+p,'utf8')).join('\n')).digest('hex');
const reviews=[];
for(const [book,line]of Object.entries(plans)){
 const file=root+book+'.json',data=JSON.parse(fs.readFileSync(file)),summary=JSON.parse(fs.readFileSync('data/summary/'+book+'.json'));
 const entries=line.split(/\s+/).filter(Boolean);if(entries.length!==data.scenes.length)throw Error(book+' plan count');
 let corrected=0;
 for(const [index,scene]of data.scenes.entries()){
  const patch=corrections[book]?.[index];
  if(patch){for(const name of patch.actors||scene.actors)if(!summary.chapters[scene.chapter].people.some(p=>p.name===name))throw Error(`${scene.id}: missing ${name}`);Object.assign(scene,patch);corrected++;}
  if(!OBJECT_CATALOG[scene.object])throw Error(scene.id+' bad object '+scene.object);
  const [motif,leadIndex='0']=entries[index].split('@'),template=ANIMATION_MOTIFS[motif];if(!template)throw Error('unknown '+motif);
  const lead=scene.actors[Number(leadIndex)];if(!lead)throw Error(scene.id+' invalid lead');
  // Actions explicitly assigned to another actor are preserved when a source-checked rule enhances the scene.
  scene.animation={version:2,motif,lead,target:scene.actors.find(n=>n!==lead)||null,mode:book==='rev'?'vision':['symbolic','parable','genealogy'].includes(motif)||testament==='nt'&&!['mat','mrk','luk','jhn','act'].includes(book)?'illustration':book==='lev'&&[0,1,2,8].includes(index)?'instruction':['dream','vision','vision-record'].includes(motif)?'vision':'reconstruction',
   setting:template.setting,effect:template.effect,emotion:template.emotion,prop:scene.object,
   beats:template.actions.map((action,i)=>({action,duration:durations[i],actor:lead})),duration:durations.reduce((a,b)=>a+b,0),
   support:motif==='two-offerings'?{actor:scene.actors[1],actions:['inspect','gather','lift','place','bow','wait']}:null,
   ref:scene.ref,source:'본문 기반 재구성 · 세부 자세와 시간은 창작',...(overrides[book]?.[index]||{})};
 }
 const animations=[];const serialized=JSON.stringify(data,(key,value)=>key==='animation'?(animations.push(value),'__ANIMATION_'+(animations.length-1)+'__'):value,2).replace(/"__ANIMATION_(\d+)__"/g,(_,i)=>JSON.stringify(animations[Number(i)]));
 fs.writeFileSync(file,serialized+'\n');
 const payloadSha256=crypto.createHash('sha256').update(serialized+'\n').digest('hex');
 const old=previous.books?.find(b=>b.code===book),unchanged=previous.rendererSha256===rendererSha256&&old?.payloadSha256===payloadSha256;
 reviews.push({code:book,payloadSha256,scenes:data.scenes.length,corrected,planned:data.scenes.length,modes:data.scenes.reduce((o,s)=>(o[s.animation.mode]=(o[s.animation.mode]||0)+1,o),{}),status:unchanged?old.status:'authored-awaiting-browser-review',...(unchanged&&old.browser?{browser:old.browser}:{})});
 console.log(book,`교정 ${corrected} · 연출 ${data.scenes.length}`);
}
fs.writeFileSync('data/pixel-bible/animation-review'+suffix+'.json',JSON.stringify({version:2,rendererSha256,scope:'현재 등록된 '+(testament==='nt'?'신약':'구약')+' 사건. 모든 성경 사건을 망라한다는 뜻이 아님.',books:reviews},null,2)+'\n');
