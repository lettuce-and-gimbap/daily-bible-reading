import {mountPixelEvent} from './pixel-event.js';
import {sceneVerses} from './scripted-events.js';
export function verseClipsForScene(scene,clips=[],selectedVerses=[]){
 const range=new Set(sceneVerses(scene)),selected=new Set(selectedVerses);
 return clips.filter(c=>c.code===scene.code&&c.chapter===scene.chapter&&c.verseNumbers.some(v=>range.has(v)&&(!selected.size||selected.has(v)))).sort((a,b)=>a.verseNumbers[0]-b.verseNumbers[0]);
}
export function mountScenePlayback(host,scene,cast,{clips=[],onChange=()=>{}}={}){
 const root=document.createElement('div');root.className='pb-event-playback';host.prepend(root);
 let player=null,paused=false,disposed=false,select,description,previous,next;
 const entries=[scene,...clips];
 function show(index){
  if(disposed)return;player?.();const current=entries[index];
  const actors=current.actors.map(name=>cast.find(p=>p.name===name)||{name,role:'본문 등장 인물',refs:[current.ref]});
  player=mountPixelEvent(root,current,actors);player.setPaused(paused);
  if(select){select.value=String(index);description.textContent=index?`${current.ref} · ${current.study}`:'전체 장면';previous.disabled=index<=0;next.disabled=index>=entries.length-1;}
  onChange({scene:current,isVerse:index>0});
 }
 if(clips.length){
  const nav=document.createElement('div');nav.className='pb-verse-playback-controls';nav.setAttribute('role','group');nav.setAttribute('aria-label','절별 애니메이션 선택');
  const label=document.createElement('label');label.textContent='재생 범위 ';select=document.createElement('select');select.setAttribute('aria-label','재생할 절');
  entries.forEach((c,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=i?`${c.ref} · ${c.title}`:'전체 장면';select.append(option);});label.append(select);
  previous=document.createElement('button');previous.type='button';previous.className='pb-button';previous.textContent='이전';previous.setAttribute('aria-label','이전 절 연출');
  next=document.createElement('button');next.type='button';next.className='pb-button';next.textContent='다음';next.setAttribute('aria-label','다음 절 연출');
  nav.append(previous,label,next);root.append(nav);description=document.createElement('p');description.className='pb-verse-playback-description';description.setAttribute('aria-live','polite');root.append(description);
  nav.addEventListener('click',e=>e.stopPropagation());select.onchange=()=>show(Number(select.value));previous.onclick=()=>show(Math.max(0,Number(select.value)-1));next.onclick=()=>show(Math.min(entries.length-1,Number(select.value)+1));
 }
 show(0);
 const dispose=()=>{if(disposed)return;disposed=true;player?.();root.remove();};dispose.setPaused=value=>{paused=value;player?.setPaused(value);};return dispose;
}
