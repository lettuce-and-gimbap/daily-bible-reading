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
 document.addEventListener('click',e=>{const term=e.target.closest('[data-study-term]');if(!term)return;e.preventDefault();e.stopPropagation();const g=glossary[term.dataset.studyTerm];if(!g)return;const body=modal(term.dataset.studyTerm);body.innerHTML=`<p>${esc(g.text)}</p><small>참고: ${esc(g.ref)}</small>`;},true);
 document.addEventListener('keydown',e=>{if(e.target.matches('[data-study-term]')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click();}});
 function mount(root,keys){
  const rows=[...root.querySelectorAll('.vp-row')];if(!rows.length)return;
  rows.forEach((row,i)=>{row.dataset.studyKey=keys[i];paint(row);});
  root.querySelector('.study-toolbar')?.remove();const bar=document.createElement('div');bar.className='study-toolbar';bar.innerHTML='<span>절 선택 후 형광펜·메모</span><button data-study-color="yellow">노랑</button><button data-study-color="green">초록</button><button data-study-color="pink">분홍</button><button data-study-color="">표시 지우기</button><button data-study-note>메모</button><small aria-live="polite">이 기기에 자동 저장돼요.</small>';root.querySelector('.vp-list').before(bar);
  bar.onclick=e=>{const b=e.target.closest('button');if(!b)return;const selected=rows.filter(r=>r.querySelector('input').checked);if(!selected.length){bar.querySelector('small').textContent='먼저 표시할 절을 선택해 주세요.';return;}
   if(b.hasAttribute('data-study-note')){const body=modal('선택한 구절 메모');body.innerHTML='<label>메모<textarea rows="5"></textarea></label><button type="button">저장</button>';body.querySelector('textarea').value=records[selected[0].dataset.studyKey]?.note||'';body.querySelector('button').onclick=()=>{for(const r of selected){const k=r.dataset.studyKey;records[k]={...records[k],note:body.querySelector('textarea').value};}if(save()){selected.forEach(paint);body.closest('dialog').close();}};return;}
   for(const row of selected){const k=row.dataset.studyKey;records[k]={...records[k],color:b.dataset.studyColor};}if(save()){selected.forEach(paint);bar.querySelector('small').textContent='이 기기에 저장했어요.';}
  };
 }
 function paint(row){const entry=records[row.dataset.studyKey]||{};row.dataset.studyColor=entry.color||'';if(row.nextElementSibling?.classList.contains('study-note'))row.nextElementSibling.remove();if(entry.note){const note=document.createElement('button');note.type='button';note.className='study-note';note.textContent='메모 보기';note.onclick=e=>{e.preventDefault();e.stopPropagation();const body=modal('구절 메모');const p=document.createElement('p');p.textContent=entry.note;body.append(p);};row.after(note);}}
 return {mount,glossaryHtml};
})();
