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
 const defaultPalette=[{id:'default-yellow',name:'노랑',tag:'기본',color:legacyColor}];
 function readPalette(){try{const saved=JSON.parse(localStorage.getItem(paletteKey));if(Array.isArray(saved)&&saved.some(p=>p&&p.id&&p.name&&p.tag&&validColor(p.color)))return saved.filter(p=>p&&p.id&&p.name&&p.tag&&validColor(p.color));}catch(_){}return defaultPalette.slice();}
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
  if(!parts.length)return;const body=modal('선택한 구 · 하이라이트와 메모');body.innerHTML=`<p class="study-dock-quote"></p><label>색상 분류 <select data-phrase-palette>${palette.map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.tag)}</option>`).join('')}</select></label><label>이 구에 남길 메모<textarea rows="5" placeholder="선택한 구에 대해 메모하세요"></textarea></label><div class="inline"><button type="button" class="btn primary" data-phrase-save>하이라이트·메모 저장</button><button type="button" class="btn ghost" data-phrase-delete>메모와 하이라이트 삭제</button></div>`;
  body.querySelector('p').textContent=parts.map(p=>p.el.dataset.studyText.slice(p.start,p.end)).join(' / ');const first=parts[0],existing=(records[first.el.dataset.studySegment]?.ranges||[]).slice().reverse().find(r=>r.hash===fingerprint(first.el.dataset.studyText)&&r.start===first.start&&r.end===first.end);body.querySelector('textarea').value=existing?.note||'';body.querySelector('[data-phrase-palette]').value=existing?.paletteId&&palette.some(p=>p.id===existing.paletteId)?existing.paletteId:selectedPalette().id;
  window.getSelection()?.removeAllRanges();closeTip();body.querySelector('[data-phrase-delete]').hidden=!existing;body.querySelector('[data-phrase-delete]').onclick=()=>{for(const {el,start,end}of parts){const key=el.dataset.studySegment,hash=fingerprint(el.dataset.studyText);records[key]={...records[key],ranges:(records[key]?.ranges||[]).filter(r=>!(r.hash===hash&&r.start===start&&r.end===end))};}if(save()){for(const {el}of parts){renderSegment(el);paint(el.closest('.vp-row'));}body.closest('dialog').close();}};body.querySelector('[data-phrase-save]').onclick=()=>{const p=palette.find(x=>x.id===body.querySelector('[data-phrase-palette]').value)||selectedPalette();applyPalette(p.id);for(const {el,start,end}of parts){const key=el.dataset.studySegment,hash=fingerprint(el.dataset.studyText),ranges=(records[key]?.ranges||[]).filter(r=>r.hash===hash&&!(r.start===start&&r.end===end));ranges.push({start,end,color:p.color,hash,note:body.querySelector('textarea').value,paletteId:p.id,paletteName:p.name,tag:p.tag});records[key]={...records[key],ranges};}
   if(save()){for(const {el}of parts){renderSegment(el);paint(el.closest('.vp-row'));const root=el.closest('[data-study-root]');if(root)dockSelections.delete(root);}body.closest('dialog').close();}
  };
 }
 document.addEventListener('click',e=>{const mark=e.target.closest('mark.study-mark');if(!mark||!window.getSelection()?.isCollapsed)return;const el=mark.closest('[data-study-segment]');if(!el)return;e.preventDefault();e.stopPropagation();openPhraseNote([{el,start:Number(mark.dataset.studyStart),end:Number(mark.dataset.studyEnd)}]);},true);
 document.addEventListener('keydown',e=>{if(e.target.matches('mark.study-mark')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click();}});
 function paint(row){
  if(row.nextElementSibling?.classList.contains('study-note'))row.nextElementSibling.remove();const entry=records[row.dataset.studyKey]||{},notes=entry.note?[entry.note]:[];
  row.querySelectorAll('[data-study-segment]').forEach(el=>{for(const r of records[el.dataset.studySegment]?.ranges||[])if(r.note&&r.hash===fingerprint(el.dataset.studyText))notes.push(`${r.paletteName||'하이라이트'}${r.tag?` · ${r.tag}`:''}\n${el.dataset.studyText.slice(r.start,r.end)}\n${r.note}`);});
  if(notes.length){const note=document.createElement('button');note.type='button';note.className='study-note';note.textContent='메모 보기 · 삭제';note.onclick=e=>{e.preventDefault();e.stopPropagation();const body=modal('구절 메모');const p=document.createElement('p');p.textContent=[...new Set(notes)].join('\n\n');body.append(p);const remove=document.createElement('button');remove.type='button';remove.className='btn danger';remove.textContent='이 메모와 하이라이트 삭제';body.append(remove);remove.onclick=()=>{for(const el of row.querySelectorAll('[data-study-segment]')){const key=el.dataset.studySegment,hash=fingerprint(el.dataset.studyText);records[key]={...records[key],ranges:(records[key]?.ranges||[]).filter(r=>!(r.hash===hash&&r.note))};}delete records[row.dataset.studyKey]?.note;if(save()){row.querySelectorAll('[data-study-segment]').forEach(renderSegment);paint(row);body.closest('dialog').close();}};};row.after(note);}
 }
 function settingsHtml(){return `<section class="card"><h3>형광펜 팔레트</h3><p class="muted small">색마다 이름과 용도를 붙여 선택한 구절을 분류할 수 있어요.</p><div data-palette-list>${palette.map(p=>`<div class="highlight-palette-row" data-palette-row="${esc(p.id)}"><input aria-label="색 이름" data-palette-name value="${esc(p.name)}" maxlength="20"><input aria-label="분류 이름" data-palette-tag value="${esc(p.tag)}" maxlength="24"><input aria-label="색상" data-palette-color type="color" value="${esc(p.color)}"><button type="button" class="btn text" data-palette-default>기본 색으로</button><button type="button" class="btn text" data-palette-delete>삭제</button></div>`).join('')}</div><div class="highlight-palette-add"><input data-new-palette-name placeholder="색 이름 (예: 노랑)" maxlength="20"><input data-new-palette-tag placeholder="분류 (예: 인물)" maxlength="24"><input data-new-palette-color type="color" value="${esc(currentColor())}"><button class="btn" type="button" data-palette-add>색 추가</button></div><label>직접 입력 HEX <input data-highlight-hex value="${esc(currentColor())}" maxlength="7" size="8"></label> <label>RGB <input data-highlight-rgb placeholder="255, 228, 155" size="14" aria-label="형광펜 RGB 값"></label><button class="btn" type="button" data-highlight-eyedropper ${'EyeDropper' in window?'':'hidden'}>화면에서 색 추출</button><p class="muted small" data-highlight-status>저장한 팔레트는 하이라이트 메뉴에서 선택할 수 있어요.</p></section>`;}
 function bindSettings(root){const status=root.querySelector('[data-highlight-status]'),hex=root.querySelector('[data-highlight-hex]'),rgb=root.querySelector('[data-highlight-rgb]');if(!status||!hex||!rgb)return;
  const persistPalette=()=>{localStorage.setItem(paletteKey,JSON.stringify(palette));if(typeof persist==='function')persist();};
  root.querySelectorAll('[data-palette-row]').forEach(row=>{const id=row.dataset.paletteRow,find=()=>palette.find(p=>p.id===id);row.querySelector('[data-palette-name]').onchange=e=>{const p=find();if(p){p.name=e.target.value.trim()||'색';persistPalette();}};row.querySelector('[data-palette-tag]').onchange=e=>{const p=find();if(p){p.tag=e.target.value.trim()||'분류 없음';persistPalette();}};row.querySelector('[data-palette-color]').onchange=e=>{const p=find();if(p){p.color=e.target.value;persistPalette();if(localStorage.getItem(paletteSelectionKey)===id)setColor(p.color);}};row.querySelector('[data-palette-default]').onclick=()=>{const p=find();if(p){applyPalette(id);status.textContent=`${p.name} · ${p.tag} 색을 기본으로 설정했어요.`;}};row.querySelector('[data-palette-delete]').onclick=()=>{if(palette.length<2){status.textContent='팔레트에는 색을 하나 이상 남겨야 해요.';return;}palette=palette.filter(p=>p.id!==id);if(localStorage.getItem(paletteSelectionKey)===id)applyPalette(palette[0].id);persistPalette();root.innerHTML=window.ScriptureStudy.settingsHtml();bindSettings(root);};});
  root.querySelector('[data-palette-add]').onclick=()=>{const name=root.querySelector('[data-new-palette-name]').value.trim(),tag=root.querySelector('[data-new-palette-tag]').value.trim(),color=root.querySelector('[data-new-palette-color]').value;if(!name||!tag){status.textContent='색 이름과 분류를 모두 입력해 주세요.';return;}palette.push({id:`p-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,tag,color});persistPalette();root.innerHTML=window.ScriptureStudy.settingsHtml();bindSettings(root);};
  hex.onchange=()=>{if(!validColor(hex.value)){status.textContent='예: #FFE49B 형식으로 입력해 주세요.';return;}const p=selectedPalette();p.color=hex.value;setColor(hex.value);persistPalette();status.textContent='선택한 팔레트 색상을 수정했어요.';};rgb.value=[1,3,5].map(i=>parseInt(currentColor().slice(i,i+2),16)).join(', ');rgb.onchange=()=>{const values=rgb.value.split(',').map(x=>x.trim());if(values.length!==3||values.some(x=>!/^\d{1,3}$/.test(x)||Number(x)>255)){status.textContent='RGB는 0~255 숫자 세 개를 쉼표로 구분해 주세요.';return;}hex.value='#'+values.map(x=>Number(x).toString(16).padStart(2,'0')).join('');hex.dispatchEvent(new Event('change'));};
  root.querySelector('[data-highlight-eyedropper]')?.addEventListener('click',async()=>{try{const result=await new EyeDropper().open();hex.value=result.sRGBHex;hex.dispatchEvent(new Event('change'));}catch(_){status.textContent='색 추출을 취소했어요.';}});
 }
 return {mount,glossaryHtml,currentColor,setColor,settingsHtml,bindSettings};
})();
