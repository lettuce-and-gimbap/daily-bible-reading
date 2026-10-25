// User marks contain only reference keys, colors and notes, never a second stored copy of scripture.
window.ScriptureStudy=(()=>{
 const data=window.ScriptureNotesData||{terms:[],sources:{}};
 const glossary=Object.fromEntries([...data.terms,...(data.passages||[])].map(t=>[t.id,t]));
 const aliases=data.terms.flatMap(t=>t.aliases.map(word=>({word,term:t}))).sort((a,b)=>b.word.length-a.word.length);
 const regexEscape=s=>Array.from(s,c=>'.*+?^${}()|[]'.includes(c)||c.charCodeAt(0)===92?String.fromCharCode(92)+c:c).join('');
 const storage='scripture-study:v1';let records={};try{records=JSON.parse(localStorage.getItem(storage))||{};}catch(_){}
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function save(){try{localStorage.setItem(storage,JSON.stringify(records));return true;}catch(_){alert('표시를 저장하지 못했어요. 저장 공간을 확인해 주세요.');return false;}}
 function glossaryHtml(text,context={}){
  const available=aliases.filter(a=>!a.term.books||a.term.books.includes(context.code));if(!available.length)return esc(text);
  const pattern=new RegExp(available.map(a=>regexEscape(a.word)).join('|'),'g');let start=0,out='';
  for(const m of text.matchAll(pattern)){const g=available.find(a=>a.word===m[0]).term;out+=esc(text.slice(start,m.index))+`<span class="study-term" role="button" tabindex="0" data-study-term="${esc(g.id)}" aria-label="${esc(g.title)} 뜻 보기">${esc(m[0])}</span>`;start=m.index+m[0].length;}return out+esc(text.slice(start));
 }
 function showTerm(g){
  const body=modal(g.title);body.innerHTML=`<small>${esc(g.category)} · 직접 정리한 설명</small><p>${esc(g.summary)}</p>${g.detail?`<p>${esc(g.detail)}</p>`:''}${g.caution?`<p class="study-caution"><strong>읽을 때 유의해요</strong><br>${esc(g.caution)}</p>`:''}${g.lens?`<details><summary>개혁주의 관점</summary><p>${esc(g.lens)}</p><small>웨스트민스터 신앙고백 ${g.wcf.map(n=>n+'장').join(' · ')}</small></details>`:''}<p class="study-reference">관련 구절: ${g.refs.map(r=>`<button type="button" data-study-reference="${esc(r)}">${esc(r)}</button>`).join(' ')}</p><details><summary>설명의 기준과 출처</summary><p>두 역본과 제공받은 호크마 참고 자료를 바탕으로 앱에서 정리한 설명이에요. 교단이 발행한 공식 주석은 아니에요. 교리적 설명은 예장합동이 표준으로 삼는 웨스트민스터 신앙고백을 참고해요.</p>${Object.values(data.sources).map(x=>`<p><a target="_blank" rel="noopener noreferrer" href="${esc(x.url)}">${esc(x.label)} ↗</a></p>`).join('')}</details>`;
 }
 document.addEventListener('click',async e=>{
  const button=e.target.closest('[data-study-reference]');if(!button)return;e.preventDefault();const body=button.closest('.study-dialog-body');let output=body.querySelector('.study-reference-verses');if(!output){output=document.createElement('section');output.className='study-reference-verses';output.setAttribute('aria-live','polite');body.append(output);}const request=button.dataset.studyReference;output.dataset.request=request;output.textContent='구절을 불러오는 중이에요…';
  try{const m=request.match(/^(.+?) (\d+):(\d+)(?:[-–](\d+))?$/);if(!m||typeof CHAPTERS==='undefined'||typeof versePairs!=='function')throw Error();const idx=CHAPTERS.findIndex(c=>c.book.name===m[1]&&c.chap===Number(m[2]));if(idx<0)throw Error();const lo=Number(m[3]),hi=Math.min(Number(m[4]||m[3]),lo+5),vers=typeof pickVersions==='function'?pickVersions():['gae','easy'];const rows=await versePairs(idx,n=>n>=lo&&n<=hi,vers);if(output.dataset.request!==request)return;if(!rows.length)throw Error();output.innerHTML=`<h4>${esc(request)}${Number(m[4]||m[3])>hi?' · 앞 6절':''}</h4><small>${vers.map(v=>esc(typeof VERSIONS!=='undefined'?VERSIONS.find(x=>x.code===v)?.name||v:v)).join(' · ')}</small>`+rows.map(r=>`<p><strong>${esc(r.label)}</strong> ${esc(r.texts[0])}${r.texts[1]?`<small>${esc(r.texts[1])}</small>`:''}</p>`).join('');}catch(_){if(output.dataset.request===request)output.textContent='구절을 불러오지 못했어요. 통독·QT의 해당 본문에서 확인하거나 다시 눌러 주세요.';}
 });
 function modal(title){document.querySelector('.study-dialog')?.remove();const d=document.createElement('dialog');d.className='study-dialog';d.setAttribute('aria-label',title);d.innerHTML='<h3></h3><div class="study-dialog-body"></div><button type="button">닫기</button>';d.querySelector('h3').textContent=title;d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());document.body.append(d);d.showModal();return d.querySelector('.study-dialog-body');}
 document.addEventListener('click',e=>{const term=e.target.closest('[data-study-term]');if(!term||e.target.closest('mark.study-mark')||!window.getSelection()?.isCollapsed)return;e.preventDefault();e.stopPropagation();const g=glossary[term.dataset.studyTerm];if(g)showTerm(g);},true);
 document.addEventListener('keydown',e=>{if(e.target.matches('[data-study-term]')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click();}});

 const colorKey='scripture-highlight-color:v1',paletteKey='scripture-highlight-palette:v1',paletteSelectionKey='scripture-highlight-palette-selected:v1';
 const validColor=value=>/^#[0-9a-f]{6}$/i.test(value);
 const legacyColor=(()=>{const v=typeof state!=='undefined'?state.settings.highlightColor:null;const old=localStorage.getItem(colorKey);return validColor(v)?v:validColor(old)?old:'#ffe49b';})();
 const defaultPalette=[{id:'default-yellow',name:'노랑',tag:'기본',color:legacyColor},{id:'default-mint',name:'민트',tag:'인물',color:'#CDEBDD'},{id:'default-sky',name:'하늘',tag:'사건',color:'#CDE8F5'},{id:'default-pink',name:'분홍',tag:'관계',color:'#F6D5E4'},{id:'default-lavender',name:'라벤더',tag:'묵상',color:'#E2D8F4'},{id:'default-peach',name:'살구',tag:'기도',color:'#F8DDC9'},{id:'default-lemon',name:'레몬',tag:'약속',color:'#F7ECAA'},{id:'default-green',name:'연두',tag:'배경',color:'#DFEBC3'}];
 function readPalette(){try{const saved=JSON.parse(localStorage.getItem(paletteKey));if(Array.isArray(saved)&&saved.some(p=>p&&p.id&&p.name&&p.tag&&validColor(p.color))){const valid=saved.filter(p=>p&&p.id&&p.name&&p.tag&&validColor(p.color));if(localStorage.getItem('scripture-highlight-pastels-v1')!=='1'){const merged=[...valid,...defaultPalette.filter(p=>!valid.some(x=>x.id===p.id))];localStorage.setItem(paletteKey,JSON.stringify(merged));localStorage.setItem('scripture-highlight-pastels-v1','1');return merged;}return valid;}}catch(_){}return defaultPalette.slice();}
 const pastelColors=[['크림','#FFF0B8'],['살구','#F8DDC9'],['산호','#F5C7C5'],['분홍','#F6D5E4'],['라벤더','#E2D8F4'],['하늘','#CDE8F5'],['민트','#CDEBDD'],['연두','#DFEBC3'],['레몬','#F7ECAA'],['피치','#F4D1B4'],['블루','#D4E0F5'],['회청','#D8E4E8']];
 let palette=readPalette();
 function selectedPalette(){return palette.find(p=>p.id===localStorage.getItem(paletteSelectionKey))||palette[0]||defaultPalette[0];}
 function currentColor(){const chosen=selectedPalette(),value=typeof state!=='undefined'?state.settings.highlightColor:null;const stored=localStorage.getItem(colorKey);return chosen?.color|| (validColor(value)?value:validColor(stored)?stored:'#ffe49b');}
 function setColor(color){if(!validColor(color))return;localStorage.setItem(colorKey,color);if(typeof state!=='undefined'){state.settings.highlightColor=color;}return color;}
 function paletteOptions(){return palette.map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.tag)}</option>`).join('');}
 function applyPalette(id){const p=palette.find(x=>x.id===id);if(!p)return;localStorage.setItem(paletteSelectionKey,p.id);setColor(p.color);return p;}
 const fingerprint=text=>{let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return (hash>>>0).toString(16);};
 const dockSelections=new WeakMap();
 let pending=[],tip=null,selectionTimer;
 function closeTip(){tip?.remove();tip=null;}
 function renderSegment(segment){
  const text=segment.dataset.studyText,entry=records[segment.dataset.studySegment]||{},hash=fingerprint(text);
  const ranges=(entry.ranges||[]).filter(r=>r.hash===hash&&r.start>=0&&r.end<=text.length&&r.end>r.start&&validColor(r.color));
  segment.innerHTML=glossaryHtml(text,{code:segment.dataset.studyBook});
  // Keep a term's accessible button intact even when a highlight covers only part of it.
  const walker=document.createTreeWalker(segment,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);let offset=0;
  for(const node of nodes){const base=offset,end=base+node.textContent.length;offset=end;const points=[...new Set([base,end,...ranges.flatMap(r=>[r.start,r.end]).filter(n=>n>base&&n<end)])].sort((a,b)=>a-b);const fragment=document.createDocumentFragment();for(let i=0;i<points.length-1;i++){const start=points[i],stop=points[i+1],match=ranges.slice().reverse().find(r=>r.start<=start&&r.end>=stop),part=document.createTextNode(node.textContent.slice(start-base,stop-base));if(match){const mark=document.createElement('mark');mark.className='study-mark';mark.dataset.studyStart=String(match.start);mark.dataset.studyEnd=String(match.end);mark.tabIndex=0;mark.setAttribute('role','note');mark.setAttribute('aria-label','이 구의 하이라이트와 메모 보기');mark.style.background=match.color;mark.style.color=[1,3,5].map((i,n)=>parseInt(match.color.slice(i,i+2),16)*[.299,.587,.114][n]).reduce((a,b)=>a+b,0)>145?'#243c32':'#fffaf1';mark.append(part);fragment.append(mark);}else fragment.append(part);}node.replaceWith(fragment);}

 }
 function selectionParts(){
  const selection=window.getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount)return [];
  const range=selection.getRangeAt(0),parts=[];
  for(const el of document.querySelectorAll('[data-study-segment]')){
   if(!range.intersectsNode(el))continue;
   const offset=(node,index)=>{const before=document.createRange();before.selectNodeContents(el);before.setEnd(node,index);return before.toString().length;};
   const start=el.contains(range.startContainer)?offset(range.startContainer,range.startOffset):0;
   const end=el.contains(range.endContainer)?offset(range.endContainer,range.endOffset):el.textContent.length;
   if(end>start)parts.push({el,start,end});
  }return parts;
 }
 function positionTip(){if(!tip)return;const range=window.getSelection()?.rangeCount?window.getSelection().getRangeAt(0):null;if(!range)return;const rect=range.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight;tip.style.left=Math.max(8,Math.min(vw-tip.offsetWidth-8,rect.left))+'px';tip.style.top=Math.max(8,Math.min(vh-tip.offsetHeight-8,rect.bottom+8))+'px';}
 function offerHighlight(){
  const parts=selectionParts();const owner=parts[0]?.el.closest('[data-study-root]');if(owner)dockSelections.set(owner,parts.filter(p=>owner.contains(p.el)));const dock=parts[0]?.el.closest('[data-study-docked]');if(dock)dockSelections.set(dock,parts.filter(p=>dock.contains(p.el)));if(!parts.length){closeTip();pending=[];return;}pending=parts;closeTip();
  tip=document.createElement('div');tip.className='study-selection-tools';tip.setAttribute('role','toolbar');tip.setAttribute('aria-label','선택한 글 형광펜');tip.innerHTML='<button type="button" data-selection-mark>하이라이트·메모</button><button type="button" data-selection-clear>표시 지우기</button>';
  tip.querySelector('[data-selection-mark]').style.borderBottom='5px solid '+currentColor();
  tip.addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault();});
  tip.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-selection-mark')){const parts=pending.slice();closeTip();pending=[];window.getSelection()?.removeAllRanges();openPhraseNote(parts);return;}for(const {el,start,end}of pending){const key=el.dataset.studySegment,hash=fingerprint(el.dataset.studyText);let ranges=(records[key]?.ranges||[]).filter(r=>r.hash===hash);
    if(b.hasAttribute('data-selection-clear'))ranges=ranges.flatMap(r=>r.end<=start||r.start>=end?[r]:r.note?[]:[...(r.start<start?[{...r,end:start}]:[]),...(r.end>end?[{...r,start:end}]:[])]);
    else {const p=selectedPalette();ranges.push({start,end,color:p.color||currentColor(),hash,paletteId:p.id,paletteName:p.name,tag:p.tag});}
    records[key]={...records[key],ranges};
   }if(save()){for(const part of pending)renderSegment(part.el);window.getSelection()?.removeAllRanges();closeTip();pending=[];}};
  document.body.append(tip);positionTip();
 }
 document.addEventListener('click',e=>{if(e.target.closest('.vp-row')&&!e.target.closest('input')&&selectionParts().length){e.preventDefault();e.stopPropagation();}},true);
 function scheduleSelection(){clearTimeout(selectionTimer);selectionTimer=setTimeout(()=>requestAnimationFrame(offerHighlight),220);}
 document.addEventListener('selectionchange',scheduleSelection);
 // iOS Safari may dispatch selectionchange before its long-press selection is finalized.
 document.addEventListener('pointerup',()=>setTimeout(scheduleSelection,120),true);
 document.addEventListener('touchend',()=>setTimeout(scheduleSelection,160),{capture:true,passive:true});
 document.addEventListener('mouseup',()=>setTimeout(scheduleSelection,60),true);
 document.addEventListener('copy',()=>setTimeout(scheduleSelection,0));
 document.addEventListener('scroll',()=>{if(window.getSelection()?.isCollapsed)closeTip();else positionTip();},true);
 function mount(root,keys,{dock=false}={}){
  root.dataset.studyRoot='true';
  if(dock)root.dataset.studyDocked='true';
  const rows=[...root.querySelectorAll('.vp-row')];
  rows.forEach((row,i)=>{row.dataset.studyKey=keys[i];const [idx]=keys[i].split(':');const context=typeof CHAPTERS!=='undefined'?CHAPTERS[Number(idx)]:null;const span=row.querySelector('.vp-num').textContent.match(/\d+/g)||[];const lo=Number(span[0]),hi=Number(span[1]||span[0]);
   row.querySelector('.study-passage-links')?.remove();const notes=(data.passages||[]).filter(n=>n.code===context?.book.code&&n.chapter===context?.chap&&n.lo<=hi&&n.hi>=lo);if(notes.length){const links=document.createElement('div');links.className='study-passage-links';for(const n of notes){const button=document.createElement('button');button.type='button';button.textContent='주석 · '+n.title;button.onclick=e=>{e.preventDefault();e.stopPropagation();showTerm(n);};links.append(button);}row.querySelector('.vp-txt')?.append(links);}
   row.querySelectorAll('.study-version').forEach(segment=>{segment.dataset.studySegment=`${idx}:${segment.dataset.edition}:${row.querySelector('.vp-num').textContent.trim()}`;segment.dataset.studyText=segment.textContent;segment.dataset.studyBook=typeof CHAPTERS!=='undefined'?CHAPTERS[Number(idx)]?.book?.code||'':'';
    // Keep earlier whole-verse marks visible when moving to text ranges.
    const old=records[keys[i]],colors={yellow:'#fff0a3',green:'#d7efbd',pink:'#f7d0dd'};
    if(old?.color&&!records[segment.dataset.studySegment])records[segment.dataset.studySegment]={ranges:[{start:0,end:segment.textContent.length,color:colors[old.color]||'#fff0a3',hash:fingerprint(segment.textContent)}]};
    renderSegment(segment);
   });paint(row);
  });save();
  root.dataset.studyDocked=String(!!dock);root.querySelector('.study-toolbar')?.remove();root.querySelector('[data-study-highlight]')?.remove();

 }
 function openPhraseNote(parts){
  if(!parts.length)return;
  const first=parts[0],existing=(records[first.el.dataset.studySegment]?.ranges||[]).slice().reverse().find(r=>r.hash===fingerprint(first.el.dataset.studyText)&&r.start===first.start&&r.end===first.end);
  let paletteId=existing?.paletteId&&palette.some(p=>p.id===existing.paletteId)?existing.paletteId:selectedPalette().id;
  let chosenColor=existing?.color||palette.find(p=>p.id===paletteId)?.color||currentColor();
  const body=modal('선택한 구 · 하이라이트와 메모');
  body.innerHTML=`<p class="study-dock-quote"></p><section class="phrase-color-editor"><strong>색상 인덱스</strong><small>색 이름과 용도를 선택하고, 파스텔 색을 고르세요.</small><div class="phrase-palette-list" role="group" aria-label="색상 인덱스">${palette.map(p=>`<button type="button" class="phrase-palette-option ${p.id===paletteId?'selected':''}" data-phrase-index="${esc(p.id)}" aria-pressed="${p.id===paletteId}"><i style="background:${esc(p.color)}"></i><span><b>${esc(p.name)}</b><small>${esc(p.tag)}</small></span></button>`).join('')}</div><strong>하이라이트 색</strong><div class="phrase-pastel-swatches" role="group" aria-label="파스텔 하이라이트 색상">${pastelColors.map(([name,color])=>`<button type="button" data-phrase-color="${color}" class="pastel-swatch ${color.toLowerCase()===chosenColor.toLowerCase()?'selected':''}" style="--swatch:${color}" aria-label="${name}" title="${name}" aria-pressed="${color.toLowerCase()===chosenColor.toLowerCase()}"></button>`).join('')}<label class="phrase-custom-color">직접 선택 <input type="color" data-phrase-custom value="${esc(chosenColor)}" aria-label="원하는 하이라이트 색상"></label></div></section><label>이 구에 남길 메모<textarea rows="5" placeholder="선택한 구에 대해 메모하세요"></textarea></label><div class="inline"><button type="button" class="btn primary" data-phrase-save>하이라이트·메모 저장</button><button type="button" class="btn primary" data-phrase-delete>메모와 하이라이트 삭제</button></div>`;
  body.querySelector('.study-dock-quote').textContent=parts.map(p=>p.el.dataset.studyText.slice(p.start,p.end)).join(' / ');body.querySelector('textarea').value=existing?.note||'';
  const setColor=color=>{if(!validColor(color))return;chosenColor=color;body.querySelectorAll('[data-phrase-color]').forEach(button=>{const active=button.dataset.phraseColor.toLowerCase()===color.toLowerCase();button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});body.querySelector('[data-phrase-custom]').value=color;};
  body.querySelector('[data-phrase-index]').closest('.phrase-palette-list').onclick=e=>{const button=e.target.closest('[data-phrase-index]');if(!button)return;paletteId=button.dataset.phraseIndex;body.querySelectorAll('[data-phrase-index]').forEach(x=>{const active=x===button;x.classList.toggle('selected',active);x.setAttribute('aria-pressed',String(active));});const p=palette.find(x=>x.id===paletteId);if(p)setColor(p.color);};
  body.querySelector('.phrase-pastel-swatches').onclick=e=>{const button=e.target.closest('[data-phrase-color]');if(button)setColor(button.dataset.phraseColor);};body.querySelector('[data-phrase-custom]').oninput=e=>setColor(e.target.value);
  window.getSelection()?.removeAllRanges();closeTip();const remove=body.querySelector('[data-phrase-delete]');remove.hidden=!existing;remove.onclick=()=>{for(const {el,start,end}of parts){const key=el.dataset.studySegment,hash=fingerprint(el.dataset.studyText);records[key]={...records[key],ranges:(records[key]?.ranges||[]).filter(r=>!(r.hash===hash&&r.start===start&&r.end===end))};}if(save()){for(const {el}of parts){renderSegment(el);paint(el.closest('.vp-row'));}body.closest('dialog').close();}};
  body.querySelector('[data-phrase-save]').onclick=()=>{const p=palette.find(x=>x.id===paletteId)||selectedPalette();p.color=chosenColor;localStorage.setItem(paletteKey,JSON.stringify(palette));applyPalette(p.id);for(const {el,start,end}of parts){const key=el.dataset.studySegment,hash=fingerprint(el.dataset.studyText),ranges=(records[key]?.ranges||[]).filter(r=>r.hash===hash&&!(r.start===start&&r.end===end));ranges.push({start,end,color:chosenColor,hash,note:body.querySelector('textarea').value,paletteId:p.id,paletteName:p.name,tag:p.tag});records[key]={...records[key],ranges};}
   if(save()){for(const {el}of parts){renderSegment(el);paint(el.closest('.vp-row'));const root=el.closest('[data-study-root]');if(root)dockSelections.delete(root);}body.closest('dialog').close();}
  };
 }
 document.addEventListener('click',e=>{const mark=e.target.closest('mark.study-mark');if(!mark||!window.getSelection()?.isCollapsed)return;const el=mark.closest('[data-study-segment]');if(!el)return;e.preventDefault();e.stopPropagation();openPhraseNote([{el,start:Number(mark.dataset.studyStart),end:Number(mark.dataset.studyEnd)}]);},true);
 document.addEventListener('keydown',e=>{if(e.target.matches('mark.study-mark')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click();}});
 function paint(row){row.nextElementSibling?.classList.contains('study-note')&&row.nextElementSibling.remove();}
 function savedHighlightItems(){
  const items=[];
  for(const [key,entry] of Object.entries(records)){
   const bits=key.split(':'),idx=Number(bits[0]);if(!Number.isInteger(idx)||!CHAPTERS[idx])continue;
   const rowKey=bits.length>=5,edition=bits[1],label=bits[bits.length-1];
   if(!VERSIONS.some(v=>v.code===edition))continue;
   if(rowKey&&entry?.note)items.push({id:`${key}:legacy`,storageKey:key,idx,edition,label,quote:'',note:entry.note,paletteName:'메모',tag:'메모',legacy:true});
   if(rowKey)continue;
   for(const range of entry?.ranges||[]){if(!range||!Number.isFinite(range.start)||!Number.isFinite(range.end)||range.end<=range.start)continue;
    items.push({id:`${key}:${range.hash}:${range.start}-${range.end}`,storageKey:key,idx,edition,label,quote:'',note:range.note||'',paletteName:range.paletteName||'하이라이트',tag:range.tag||'',range});
   }
  }
  return items.sort((a,b)=>a.idx-b.idx||labelSpan(a.label)[0]-labelSpan(b.label)[0]||a.edition.localeCompare(b.edition));
 }
 const readingTextCache=new Map();
 async function mountReadingHighlights(root,chapterIndexes){
  if(!root)return;const wanted=new Set(chapterIndexes||[]),items=savedHighlightItems().filter(item=>wanted.has(item.idx));
  if(!items.length){root.innerHTML='<section class="reading-highlight-card"><h3>이 분량의 하이라이트</h3><p class="muted small">아직 표시한 구절이 없어요. 본문에서 단어나 구를 선택해 하이라이트를 남겨 보세요.</p></section>';return;}
  root.innerHTML='<section class="reading-highlight-card"><h3>이 분량의 하이라이트</h3><p class="muted small" data-reading-highlight-status>저장한 구절을 불러오는 중…</p><div data-reading-highlight-items></div></section>';
  const grouped=new Map();for(const item of items){const key=`${item.idx}:${item.edition}`;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(item);}
  await Promise.all([...grouped].map(async([key,list])=>{let pending=readingTextCache.get(key);if(!pending){const idx=list[0].idx,edition=list[0].edition;pending=versePairs(idx,()=>true,[edition]);readingTextCache.set(key,pending);}try{const rows=await pending;for(const item of list){const [lo]=labelSpan(item.label),row=rows.find(r=>{const [a,b]=labelSpan(r.label);return a<=lo&&b>=lo;}),text=row?.texts?.[0]||'';item.quote=item.range&&fingerprint(text)===item.range.hash?text.slice(item.range.start,item.range.end):'';}}catch(_){for(const item of list)item.quote='';}}));
  if(!root.isConnected)return;const list=root.querySelector('[data-reading-highlight-items]');if(!list)return;
  list.innerHTML=items.map(item=>{const color=validColor(item.range?.color)?item.range.color:'#d8e9ef',ink=[1,3,5].map((i,n)=>parseInt(color.slice(i,i+2),16)*[.299,.587,.114][n]).reduce((a,b)=>a+b,0)>145?'#243c32':'#fffaf1';return `<article class="reading-highlight-item"><header><strong>${esc(CHAPTERS[item.idx].book.name)} ${CHAPTERS[item.idx].chap}:${esc(item.label)}</strong><span><i style="background:${esc(color)}"></i>${esc(item.paletteName)}${item.tag?` · ${esc(item.tag)}`:''} · ${esc(VERSIONS.find(v=>v.code===item.edition)?.name||item.edition)}</span></header>${item.quote?`<blockquote><mark style="background:${esc(color)};color:${ink}">${esc(item.quote)}</mark></blockquote>`:''}${item.note?`<p>${esc(item.note)}</p>`:''}</article>`;}).join('');
  root.querySelector('[data-reading-highlight-status]')?.remove();
 }
 function highlightLibraryHtml(){return `<section class="card highlight-library" data-highlight-library><h3>하이라이트·메모 찾기</h3><div class="highlight-search-filters"><label>성경 권 <select data-hl-book><option value="">전체 권</option>${BOOKS.map(b=>`<option value="${esc(b.code)}">${esc(b.name)}</option>`).join('')}</select></label><label>역본 <select data-hl-edition><option value="">전체 역본</option>${VERSIONS.map(v=>`<option value="${esc(v.code)}">${esc(v.name)}</option>`).join('')}</select></label><label>색 분류 <select data-hl-tag><option value="">전체 분류</option>${[...new Set([...palette.map(p=>p.tag),...savedHighlightItems().map(i=>i.tag).filter(Boolean)])].map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label><label class="highlight-search-text">문구 찾기 <input type="search" data-hl-query placeholder="본문 문구나 메모 검색"></label></div><p class="muted small" data-hl-status></p><div data-hl-results></div></section>`;}
 function bindHighlightLibrary(root){const section=root.querySelector('[data-highlight-library]');if(!section)return;const book=section.querySelector('[data-hl-book]'),edition=section.querySelector('[data-hl-edition]'),tag=section.querySelector('[data-hl-tag]'),query=section.querySelector('[data-hl-query]'),status=section.querySelector('[data-hl-status]'),results=section.querySelector('[data-hl-results]');let requestId=0,timer;
  const items=savedHighlightItems(),cache=new Map();
  const draw=(matches)=>{results.innerHTML=matches.length?matches.map(item=>`<article class="highlight-search-result" data-hl-item="${esc(item.id)}"><header><strong>${esc(CHAPTERS[item.idx].book.name)} ${CHAPTERS[item.idx].chap}장 ${esc(item.label)}절</strong><span>${esc(VERSIONS.find(v=>v.code===item.edition)?.name||item.edition)} · ${esc(item.paletteName)}${item.tag?` · ${esc(item.tag)}`:''}</span></header>${item.quote?`<p class="highlight-search-quote">${esc(item.quote)}</p>`:''}${item.note?`<p class="highlight-search-note">${esc(item.note)}</p>`:''}<button type="button" class="btn text small" data-hl-delete="${esc(item.id)}">하이라이트·메모 삭제</button></article>`).join(''):'<p class="muted small">조건에 맞는 하이라이트나 메모가 없어요.</p>';};
  const loadText=async(item)=>{const group=`${item.idx}:${item.edition}`;if(!cache.has(group))cache.set(group,versePairs(item.idx,()=>true,[item.edition]).then(rows=>rows));try{const rows=await cache.get(group),[lo]=labelSpan(item.label),row=rows.find(r=>{const [a,b]=labelSpan(r.label);return a<=lo&&b>=lo;});item.quote=row?.texts?.[0]?.slice(item.range?.start||0,item.range?.end||row?.texts?.[0]?.length)||'';}catch(_){item.quote='';item.textLoadFailed=true;}return item;};
  const run=async()=>{const token=++requestId,q=query.value.trim().toLocaleLowerCase(),candidates=items.filter(item=>(!book.value||CHAPTERS[item.idx].book.code===book.value)&&(!edition.value||item.edition===edition.value)&&(!tag.value||item.tag===tag.value));if(!q){status.textContent=`저장된 항목 ${candidates.length}개`;draw(candidates);return;}
   const noteHits=candidates.filter(item=>`${item.note} ${CHAPTERS[item.idx].book.name} ${item.label} ${item.paletteName} ${item.tag}`.toLocaleLowerCase().includes(q));let possible=candidates.filter(item=>!noteHits.includes(item));status.textContent='본문 문구를 확인하는 중…';
   const groups=new Set(possible.map(i=>`${i.idx}:${i.edition}`));if(groups.size>100){status.textContent='검색 범위가 넓어요. 먼저 권이나 역본을 선택해 주세요.';draw(noteHits);return;}
   let cursor=0;const workers=Array.from({length:Math.min(5,groups.size)},async()=>{while(cursor<possible.length){const item=possible[cursor++];await loadText(item);}});await Promise.all(workers);if(token!==requestId)return;const matches=[...noteHits,...possible.filter(item=>item.quote.toLocaleLowerCase().includes(q))].sort((a,b)=>a.idx-b.idx||labelSpan(a.label)[0]-labelSpan(b.label)[0]);status.textContent=`검색 결과 ${matches.length}개${possible.some(item=>item.textLoadFailed)?' · 일부 본문을 불러오지 못했어요':''}`;draw(matches);
  };
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(run,250);};book.onchange=edition.onchange=tag.onchange=schedule;query.oninput=schedule;section.addEventListener('click',e=>{const button=e.target.closest('[data-hl-delete]');if(!button)return;const item=items.find(x=>x.id===button.dataset.hlDelete);if(!item)return;const entry=records[item.storageKey];if(item.legacy){delete entry.note;}else entry.ranges=(entry.ranges||[]).filter(r=>!(r===item.range));if(save()){const at=items.indexOf(item);if(at>=0)items.splice(at,1);run();}});run();
 }
 function settingsContentHtml(){return `${highlightLibraryHtml()}<section class="card"><h3>형광펜 팔레트</h3><p class="muted small">색마다 이름과 용도를 붙여 선택한 구절을 분류할 수 있어요.</p><div data-palette-list>${palette.map(p=>`<div class="highlight-palette-row" data-palette-row="${esc(p.id)}"><label><span>색상 인덱스</span><input aria-label="색상 인덱스 이름" data-palette-name value="${esc(p.name)}" maxlength="20"></label><label><span>분류 / 용도</span><input aria-label="색상 분류" data-palette-tag value="${esc(p.tag)}" maxlength="24"></label><label class="palette-color-field"><span>색</span><input aria-label="팔레트 색상" data-palette-color type="color" value="${esc(p.color)}"></label><button type="button" class="btn text" data-palette-default>기본 색으로</button><button type="button" class="btn text" data-palette-delete>삭제</button></div>`).join('')}</div><div class="highlight-palette-add"><label><span>새 색상 인덱스</span><input data-new-palette-name placeholder="예: 노랑" maxlength="20"></label><label><span>분류 / 용도</span><input data-new-palette-tag placeholder="예: 인물" maxlength="24"></label><label class="palette-color-field"><span>색</span><input data-new-palette-color type="color" value="${esc(currentColor())}"></label><button class="btn" type="button" data-palette-add>인덱스 추가</button></div><label>직접 입력 HEX <input data-highlight-hex value="${esc(currentColor())}" maxlength="7" size="8"></label> <label>RGB <input data-highlight-rgb placeholder="255, 228, 155" size="14" aria-label="형광펜 RGB 값"></label><button class="btn" type="button" data-highlight-eyedropper ${'EyeDropper' in window?'':'hidden'}>화면에서 색 추출</button><p class="muted small" data-highlight-status>저장한 팔레트는 하이라이트 메뉴에서 선택할 수 있어요.</p></section>`;}
 function settingsHtml(){return `<div data-scripture-settings>${settingsContentHtml()}</div>`;}
 function bindSettings(root){const panel=root.querySelector('[data-scripture-settings]')||root,status=panel.querySelector('[data-highlight-status]'),hex=panel.querySelector('[data-highlight-hex]'),rgb=panel.querySelector('[data-highlight-rgb]');if(!status||!hex||!rgb)return;
  const persistPalette=()=>{localStorage.setItem(paletteKey,JSON.stringify(palette));if(typeof persist==='function')persist();};
  panel.querySelectorAll('[data-palette-row]').forEach(row=>{const id=row.dataset.paletteRow,find=()=>palette.find(p=>p.id===id);row.querySelector('[data-palette-name]').onchange=e=>{const p=find();if(p){p.name=e.target.value.trim()||'색';persistPalette();}};row.querySelector('[data-palette-tag]').onchange=e=>{const p=find();if(p){p.tag=e.target.value.trim()||'분류 없음';persistPalette();}};row.querySelector('[data-palette-color]').onchange=e=>{const p=find();if(p){p.color=e.target.value;persistPalette();if(localStorage.getItem(paletteSelectionKey)===id)setColor(p.color);}};row.querySelector('[data-palette-default]').onclick=()=>{const p=find();if(p){applyPalette(id);status.textContent=`${p.name} · ${p.tag} 색을 기본으로 설정했어요.`;}};row.querySelector('[data-palette-delete]').onclick=()=>{if(palette.length<2){status.textContent='팔레트에는 색을 하나 이상 남겨야 해요.';return;}palette=palette.filter(p=>p.id!==id);if(localStorage.getItem(paletteSelectionKey)===id)applyPalette(palette[0].id);persistPalette();panel.innerHTML=settingsContentHtml();bindSettings(panel);};});
  panel.querySelector('[data-palette-add]').onclick=()=>{const name=panel.querySelector('[data-new-palette-name]').value.trim(),tag=panel.querySelector('[data-new-palette-tag]').value.trim(),color=panel.querySelector('[data-new-palette-color]').value;if(!name||!tag){status.textContent='색 이름과 분류를 모두 입력해 주세요.';return;}palette.push({id:`p-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,tag,color});persistPalette();panel.innerHTML=settingsContentHtml();bindSettings(panel);};
  hex.onchange=()=>{if(!validColor(hex.value)){status.textContent='예: #FFE49B 형식으로 입력해 주세요.';return;}const p=selectedPalette();p.color=hex.value;setColor(hex.value);persistPalette();status.textContent='선택한 팔레트 색상을 수정했어요.';};rgb.value=[1,3,5].map(i=>parseInt(currentColor().slice(i,i+2),16)).join(', ');rgb.onchange=()=>{const values=rgb.value.split(',').map(x=>x.trim());if(values.length!==3||values.some(x=>!/^\d{1,3}$/.test(x)||Number(x)>255)){status.textContent='RGB는 0~255 숫자 세 개를 쉼표로 구분해 주세요.';return;}hex.value='#'+values.map(x=>Number(x).toString(16).padStart(2,'0')).join('');hex.dispatchEvent(new Event('change'));};
  panel.querySelector('[data-highlight-eyedropper]')?.addEventListener('click',async()=>{try{const result=await new EyeDropper().open();hex.value=result.sRGBHex;hex.dispatchEvent(new Event('change'));}catch(_){status.textContent='색 추출을 취소했어요.';}});bindHighlightLibrary(panel);
 }
 return {mount,mountReadingHighlights,glossaryHtml,currentColor,setColor,settingsHtml,bindSettings};
})();
