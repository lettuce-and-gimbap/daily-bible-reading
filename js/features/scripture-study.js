// User marks contain only reference keys, colors and notes, never a second stored copy of scripture.
window.ScriptureStudy=(()=>{
 const glossary={
  '기업 무를 자':{text:'가난 때문에 팔게 된 친족의 땅 등을 되찾아 주는 가까운 친족을 가리켜요. 여기서 기업은 회사가 아니라 물려받은 몫이나 땅이라는 뜻이에요.',ref:'레위기 25:25'},
  '우림과 둠밈':{text:'대제사장의 흉패에 넣어 두고 하나님의 뜻을 구할 때 사용한 물건이에요. 정확한 모양이나 사용 절차는 본문이 자세히 설명하지 않아요.',ref:'출애굽기 28:30'},
  '희년':{text:'쉰째 해에 자유를 선포하고 자기 소유지와 가족에게 돌아가도록 한 해예요.',ref:'레위기 25:10'},
  '할례':{text:'창세기에서는 하나님과 아브라함의 후손 사이에 맺은 언약을 몸에 표시하는 의식으로 소개해요.',ref:'창세기 17:10'},
  '에봇':{text:'제사장의 의복 가운데 하나예요. 대제사장의 정교한 에봇과 어린 사무엘의 세마포 에봇은 같은 세부 장식으로 단정하면 안 돼요.',ref:'출애굽기 28:4 · 사무엘상 2:18'},
  '흉패':{text:'대제사장이 가슴에 붙이는 의복 장식이에요. 열두 보석에는 이스라엘 열두 지파의 이름을 새겼어요.',ref:'출애굽기 28:15–21'}
 };
 const storage='scripture-study:v1';let records={};try{records=JSON.parse(localStorage.getItem(storage))||{};}catch(_){}
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function save(){try{localStorage.setItem(storage,JSON.stringify(records));return true;}catch(_){alert('표시를 저장하지 못했어요. 저장 공간을 확인해 주세요.');return false;}}
 function glossaryHtml(text){const pattern=new RegExp(Object.keys(glossary).sort((a,b)=>b.length-a.length).join('|'),'g');let start=0,out='';for(const m of text.matchAll(pattern)){out+=esc(text.slice(start,m.index))+`<span class="study-term" role="button" tabindex="0" data-study-term="${esc(m[0])}" aria-label="${esc(m[0])} 뜻 보기">${esc(m[0])}</span>`;start=m.index+m[0].length;}return out+esc(text.slice(start));}
 function modal(title){document.querySelector('.study-dialog')?.remove();const d=document.createElement('dialog');d.className='study-dialog';d.setAttribute('aria-label',title);d.innerHTML='<h3></h3><div class="study-dialog-body"></div><button type="button">닫기</button>';d.querySelector('h3').textContent=title;d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());document.body.append(d);d.showModal();return d.querySelector('.study-dialog-body');}
 document.addEventListener('click',e=>{const term=e.target.closest('[data-study-term]');if(!term||!window.getSelection()?.isCollapsed)return;e.preventDefault();e.stopPropagation();const g=glossary[term.dataset.studyTerm];if(!g)return;const body=modal(term.dataset.studyTerm);body.innerHTML=`<p>${esc(g.text)}</p><small>참고: ${esc(g.ref)}</small>`;},true);
 document.addEventListener('keydown',e=>{if(e.target.matches('[data-study-term]')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click();}});

 const colorKey='scripture-highlight-color:v1';
 const validColor=value=>/^#[0-9a-f]{6}$/i.test(value);
 function currentColor(){const value=typeof state!=='undefined'?state.settings.highlightColor:null;const stored=localStorage.getItem(colorKey);return validColor(value)?value:validColor(stored)?stored:'#ffe49b';}
 function setColor(color){if(!validColor(color))return;localStorage.setItem(colorKey,color);if(typeof state!=='undefined'){state.settings.highlightColor=color;}return color;}
 const fingerprint=text=>{let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return (hash>>>0).toString(16);};
 const dockSelections=new WeakMap();
 let pending=[],tip=null,selectionTimer;
 function closeTip(){tip?.remove();tip=null;}
 function renderSegment(segment){
  const text=segment.dataset.studyText,entry=records[segment.dataset.studySegment]||{},hash=fingerprint(text);
  const ranges=(entry.ranges||[]).filter(r=>r.hash===hash&&r.start>=0&&r.end<=text.length&&r.end>r.start&&validColor(r.color));
  const points=[...new Set([0,text.length,...ranges.flatMap(r=>[r.start,r.end])])].sort((a,b)=>a-b);
  segment.innerHTML=points.slice(0,-1).map((start,i)=>{const end=points[i+1],match=ranges.slice().reverse().find(r=>r.start<=start&&r.end>=end),body=glossaryHtml(text.slice(start,end));return match?`<mark class="study-mark" style="background:${match.color};color:${[1,3,5].map((i,n)=>parseInt(match.color.slice(i,i+2),16)*[.299,.587,.114][n]).reduce((a,b)=>a+b,0)>145?'#243c32':'#fffaf1'}">${body}</mark>`:body;}).join('');
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
 function offerHighlight(){
  const parts=selectionParts();const dock=parts[0]?.el.closest('[data-study-docked]');if(dock){dockSelections.set(dock,parts.filter(p=>dock.contains(p.el)));closeTip();return;}if(!parts.length){closeTip();pending=[];return;}pending=parts;closeTip();
  tip=document.createElement('div');tip.className='study-selection-tools';tip.setAttribute('role','toolbar');tip.setAttribute('aria-label','선택한 글 형광펜');tip.innerHTML='<button type="button" data-selection-mark>형광펜</button><button type="button" data-selection-clear>표시 지우기</button>';
  tip.querySelector('[data-selection-mark]').style.borderBottom='5px solid '+currentColor();
  tip.addEventListener('pointerdown',e=>e.preventDefault());
  tip.onclick=e=>{const b=e.target.closest('button');if(!b)return;for(const {el,start,end}of pending){const key=el.dataset.studySegment,hash=fingerprint(el.dataset.studyText);let ranges=(records[key]?.ranges||[]).filter(r=>r.hash===hash);
    if(b.hasAttribute('data-selection-clear'))ranges=ranges.flatMap(r=>r.end<=start||r.start>=end?[r]:[...(r.start<start?[{...r,end:start}]:[]),...(r.end>end?[{...r,start:end}]:[])]);
    else ranges.push({start,end,color:currentColor(),hash});
    records[key]={...records[key],ranges};
   }if(save()){for(const part of pending)renderSegment(part.el);window.getSelection()?.removeAllRanges();closeTip();pending=[];}};
  document.body.append(tip);const rect=window.getSelection().getRangeAt(0).getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight;
  tip.style.left=Math.max(8,Math.min(vw-tip.offsetWidth-8,rect.left))+'px';tip.style.top=Math.max(8,Math.min(vh-tip.offsetHeight-8,rect.bottom+8))+'px';
 }
 document.addEventListener('click',e=>{if(e.target.closest('.vp-row')&&!e.target.closest('input')&&selectionParts().length){e.preventDefault();e.stopPropagation();}},true);
 document.addEventListener('selectionchange',()=>{clearTimeout(selectionTimer);selectionTimer=setTimeout(offerHighlight,180);});
 document.addEventListener('copy',()=>setTimeout(offerHighlight,0));
 document.addEventListener('scroll',closeTip,true);
 function mount(root,keys,{dock=false}={}){
  if(dock)root.dataset.studyDocked='true';
  const rows=[...root.querySelectorAll('.vp-row')];
  rows.forEach((row,i)=>{row.dataset.studyKey=keys[i];const [idx]=keys[i].split(':');
   row.querySelectorAll('.study-version').forEach(segment=>{segment.dataset.studySegment=`${idx}:${segment.dataset.edition}:${row.querySelector('.vp-num').textContent.trim()}`;segment.dataset.studyText=segment.textContent;
    // Keep earlier whole-verse marks visible when moving to text ranges.
    const old=records[keys[i]],colors={yellow:'#fff0a3',green:'#d7efbd',pink:'#f7d0dd'};
    if(old?.color&&!records[segment.dataset.studySegment])records[segment.dataset.studySegment]={ranges:[{start:0,end:segment.textContent.length,color:colors[old.color]||'#fff0a3',hash:fingerprint(segment.textContent)}]};
    renderSegment(segment);
   });paint(row);
  });save();
  if(dock){mountDock(root,rows);return;}
  root.querySelector('.study-toolbar')?.remove();const bar=document.createElement('div');bar.className='study-toolbar';bar.innerHTML='<span>단어·구를 길게 눌러 선택하면 형광펜을 칠할 수 있어요.</span><button type="button" data-study-note>선택한 절에 메모</button><small aria-live="polite">형광펜 색은 관리에서 바꿔요. 표시는 이 기기에 저장돼요.</small>';root.querySelector('.vp-list')?.before(bar);
  bar.onclick=e=>{if(!e.target.closest('[data-study-note]'))return;const selected=rows.filter(r=>r.querySelector('input').checked);if(!selected.length){bar.querySelector('small').textContent='메모할 절을 먼저 선택해 주세요.';return;}const body=modal('선택한 구절 메모');body.innerHTML='<label>메모<textarea rows="5"></textarea></label><button type="button">저장</button>';body.querySelector('textarea').value=records[selected[0].dataset.studyKey]?.note||'';body.querySelector('button').onclick=()=>{for(const r of selected){const k=r.dataset.studyKey;records[k]={...records[k],note:body.querySelector('textarea').value};}if(save()){selected.forEach(paint);body.closest('dialog').close();}};};
 }
 function mountDock(root,rows){
  root.querySelector('.study-toolbar')?.remove();root.querySelector('.study-dock-editor')?.remove();
  const button=root.querySelector('[data-study-highlight]');if(!button)return;
  button.addEventListener('pointerdown',()=>{const parts=selectionParts().filter(p=>root.contains(p.el));if(parts.length)dockSelections.set(root,parts);});
  root.addEventListener('change',e=>{if(e.target.matches('.vp-row input')){dockSelections.delete(root);root.querySelector('.study-dock-editor')?.remove();}});
  root.querySelector('[data-act="clear"]')?.addEventListener('click',()=>{dockSelections.delete(root);root.querySelector('.study-dock-editor')?.remove();window.getSelection()?.removeAllRanges();});
  button.onclick=()=>{
   let parts=(dockSelections.get(root)||[]).filter(p=>p.el.isConnected);
   if(!parts.length)parts=rows.filter(r=>r.querySelector('input').checked).flatMap(r=>[...r.querySelectorAll('[data-study-segment]')].map(el=>({el,start:0,end:el.dataset.studyText.length})));
   root.querySelector('.study-dock-editor')?.remove();const editor=document.createElement('section');editor.className='study-dock-editor';editor.setAttribute('aria-label','하이라이트와 메모');
   if(!parts.length){editor.innerHTML='<p role="status">단어·구를 선택하거나 표시할 절을 먼저 골라 주세요.</p>';root.querySelector('.vp-bar').after(editor);return;}
   editor.innerHTML='<h3>하이라이트 · 메모</h3><p class="study-dock-quote"></p><label>메모<textarea rows="4" placeholder="선택한 말씀에 메모를 남겨 보세요"></textarea></label><div class="inline"><button type="button" class="btn primary" data-dock-save>하이라이트 저장</button><button type="button" class="btn ghost" data-dock-erase>하이라이트 지우기</button><button type="button" class="btn ghost" data-dock-cancel>닫기</button></div><small role="status">관리에서 고른 색으로 표시하고 이 기기에 저장해요.</small>';
   editor.querySelector('.study-dock-quote').textContent=parts.map(p=>p.el.dataset.studyText.slice(p.start,p.end)).join(' / ');
   const first=parts[0],existing=(records[first.el.dataset.studySegment]?.ranges||[]).slice().reverse().find(r=>r.start===first.start&&r.end===first.end&&r.hash===fingerprint(first.el.dataset.studyText));editor.querySelector('textarea').value=existing?.note||'';
   root.querySelector('.vp-bar').after(editor);window.getSelection()?.removeAllRanges();editor.scrollIntoView({block:'nearest'});
   editor.querySelector('[data-dock-cancel]').onclick=()=>editor.remove();
   editor.querySelector('[data-dock-erase]').onclick=()=>{for(const {el,start,end}of parts){const key=el.dataset.studySegment,ranges=(records[key]?.ranges||[]).flatMap(r=>r.end<=start||r.start>=end?[r]:[...(r.start<start?[{...r,end:start}]:[]),...(r.end>end?[{...r,start:end}]:[])]);records[key]={...records[key],ranges};}if(save()){parts.forEach(p=>renderSegment(p.el));rows.forEach(paint);dockSelections.delete(root);editor.querySelector('small').textContent='선택한 부분의 하이라이트를 지웠어요.';}};
   editor.querySelector('[data-dock-save]').onclick=()=>{
    for(const {el,start,end}of parts){const key=el.dataset.studySegment,hash=fingerprint(el.dataset.studyText),ranges=(records[key]?.ranges||[]).filter(r=>r.hash===hash&&!(r.start===start&&r.end===end));ranges.push({start,end,color:currentColor(),hash,note:editor.querySelector('textarea').value});records[key]={...records[key],ranges};}
    if(save()){parts.forEach(p=>renderSegment(p.el));rows.forEach(paint);dockSelections.delete(root);editor.querySelector('small').textContent='하이라이트와 메모를 저장했어요.';}
   };
  };
 }
 function paint(row){
  if(row.nextElementSibling?.classList.contains('study-note'))row.nextElementSibling.remove();const entry=records[row.dataset.studyKey]||{},notes=entry.note?[entry.note]:[];
  row.querySelectorAll('[data-study-segment]').forEach(el=>{for(const r of records[el.dataset.studySegment]?.ranges||[])if(r.note&&r.hash===fingerprint(el.dataset.studyText))notes.push(el.dataset.studyText.slice(r.start,r.end)+'\n'+r.note);});
  if(notes.length){const note=document.createElement('button');note.type='button';note.className='study-note';note.textContent='메모 보기';note.onclick=e=>{e.preventDefault();e.stopPropagation();const body=modal('구절 메모');const p=document.createElement('p');p.textContent=[...new Set(notes)].join('\n\n');body.append(p);};row.after(note);}
 }
 function settingsHtml(){return `<section class="card"><h3>형광펜 색상</h3><p class="muted small">단어·구를 선택해 표시할 때 쓸 색이에요.</p><label>색상 <input type="color" data-highlight-color value="${esc(currentColor())}"></label> <label>HEX <input data-highlight-hex value="${esc(currentColor())}" maxlength="7" size="8" aria-label="형광펜 HEX 색상"></label><label>RGB <input data-highlight-rgb placeholder="255, 228, 155" size="14" aria-label="형광펜 RGB 값"></label><button class="btn" type="button" data-highlight-eyedropper ${'EyeDropper' in window?'':'hidden'}>화면에서 색 추출</button><p class="muted small" data-highlight-status>색상 선택기에서 색을 고르거나 #RRGGBB 값을 입력하세요.</p></section>`;}
 function bindSettings(root){const color=root.querySelector('[data-highlight-color]'),hex=root.querySelector('[data-highlight-hex]'),status=root.querySelector('[data-highlight-status]');if(!color)return;
  const apply=value=>{if(!validColor(value)){status.textContent='예: #FFE49B 형식으로 입력해 주세요.';return;}setColor(value);color.value=hex.value=value;root.querySelector('[data-highlight-rgb]').value=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)).join(', ');if(typeof persist==='function')persist();status.textContent='형광펜 색상을 저장했어요.';};color.onchange=()=>apply(color.value);hex.onchange=()=>apply(hex.value);const rgb=root.querySelector('[data-highlight-rgb]');rgb.value=[1,3,5].map(i=>parseInt(currentColor().slice(i,i+2),16)).join(', ');rgb.onchange=()=>{const values=rgb.value.split(',').map(x=>x.trim());if(values.length!==3||values.some(x=>!/^\d{1,3}$/.test(x)||Number(x)>255)){status.textContent='RGB는 0~255 숫자 세 개를 쉼표로 구분해 주세요.';return;}apply('#'+values.map(x=>Number(x).toString(16).padStart(2,'0')).join(''));};
  root.querySelector('[data-highlight-eyedropper]')?.addEventListener('click',async()=>{try{const result=await new EyeDropper().open();apply(result.sRGBHex);}catch(_){status.textContent='색 추출을 취소했어요.';}});
 }
 return {mount,glossaryHtml,currentColor,setColor,settingsHtml,bindSettings};
})();
