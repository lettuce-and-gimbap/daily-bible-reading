// 통독 요약에서 여는 역대서 탐색기. 평가·관계·발화는 같은 검토 자료를 읽는다.
let chroniclesDataPromise;
async function openChroniclesGuide() {
  document.querySelector('.chronicles-dialog')?.close();
  const dialog=document.createElement('dialog');dialog.className='chronicles-dialog';dialog.setAttribute('aria-label','역대상·하 왕과 계보');
  dialog.innerHTML='<header class="cg-header"><div><small>역대상 · 역대하</small><h2>왕과 계보</h2></div><button type="button" class="icon-btn" data-cg-close aria-label="닫기">✕</button></header><div class="cg-content"><p>자료를 불러오고 있어요…</p></div>';
  document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.querySelector('[data-cg-close]').onclick=()=>dialog.close();dialog.showModal();
  const body=dialog.querySelector('.cg-content');
  try {
    chroniclesDataPromise ||= Promise.all(['chronicles-guide','chronicles-nodes'].map(async name=>{const r=await fetch(`data/${name}.json`, {cache:'no-cache'});if(!r.ok)throw Error();return r.json();})).catch(e=>{chroniclesDataPromise=null;throw e;});
    const [guide,graph]=await chroniclesDataPromise;if(!dialog.isConnected)return;
    const nodes=new Map(graph.nodes.map(n=>[n.id,n])),rulers=new Map(guide.rulers.map(r=>[r.id,r]));
    let tab='kings',selected='',query='';
    const directions={parent_child:['부모','자녀'],royal_succession:['앞선 왕','다음 왕'],grandparent_descendant:['조부모','후손'],marriage:['배우자','배우자'],sibling:['형제자매','형제자매'],message_to:['말씀을 전한 사람','말씀을 받은 대상'],advises:['조언한 사람','조언한 대상'],protects:['보호한 사람','보호받은 대상'],guides:['이끈 사람','가르침을 받은 대상'],rejects_warning:['경고를 거절한 사람','경고를 거절당한 사람']};
    const labels={parent_child:'계보',marriage:'혼인',sibling:'형제자매',grandparent_descendant:'조부모·후손',royal_succession:'왕위 계승',protects:'보호',guides:'후견·가르침',message_to:'말씀 전달',advises:'조언',rejects_warning:'경고 거부'};
    const button=n=>`<button type="button" class="cg-node" data-cg-node="${esc(n.id)}">${esc(n.label)}<small>${esc(n.disambiguation?.label||n.roles.join(' · ')||n.refs[0])}</small></button>`;
    function detail() {
      const n=nodes.get(selected);if(!n)return '<p class="muted">인물을 선택하면 가족과 관계가 여기에 나타나요.</p>';
      const r=rulers.get(n.rulerRef),related=graph.edges.filter(e=>e.from===n.id||e.to===n.id);
      return `<h3>${esc(n.label)}</h3><p>${esc(n.roles.join(' · '))}</p>${n.identityStatus?`<p class="cg-notice">${esc(n.identityStatus)}</p>`:''}${r?`<p><b>${esc(r.evaluation)}</b></p><p>${esc(r.trajectory)}</p><p>${esc(r.repentance)}</p>`:''}${(n.events||[]).map(e=>`<p><b>${esc(e.assessment)}</b> · ${esc(e.summary)} <small>${esc(e.ref)}</small></p>`).join('')}<small class="cg-refs">근거: ${esc(n.refs.join(' · '))}</small>${n.sourceNames?.length?`<p class="muted small">다른 표기: ${n.sourceNames.map(a=>esc(a.name)).join(' · ')}</p>`:''}<h4>연결된 관계</h4>${related.length?related.map(e=>{const incoming=e.to===n.id,other=nodes.get(incoming?e.from:e.to);return `<div class="cg-relation"><span>${esc(directions[e.type]?.[incoming?0:1]||labels[e.type]||e.type)}</span>${button(other)}<small>${esc(e.refs.join(' · '))}</small>${e.note?`<small>${esc(e.note)}</small>`:''}</div>`;}).join(''):'<p class="muted">현재 검토 자료에 확정 연결이 없어요.</p>'}`;
    }
    function draw() {
      body.innerHTML=`<nav class="cg-tabs" aria-label="역대서 보기">${[['kings','왕의 흐름'],['family','계보'],['voices','말씀과 응답']].map(([id,title])=>`<button type="button" data-cg-tab="${id}" aria-pressed="${tab===id}">${title}</button>`).join('')}</nav><p class="cg-notice">혈통과 왕위 계승은 달라요. 평가와 관계는 역대상·하에 기록된 범위를 기준으로 보여줘요.</p><label class="cg-search">인물 찾기<input type="search" data-cg-search placeholder="예: 므낫세, 아사, 스가랴" value="${esc(query)}"></label><div class="cg-results"></div>`;
      drawResults();
    }
    function drawResults() {
      const results=body.querySelector('.cg-results'),q=query.trim();
      if(tab==='kings')results.innerHTML=guide.rulers.filter(r=>!q||`${r.name} ${r.evaluation}`.includes(q)).map(r=>{const n=graph.nodes.find(n=>n.rulerRef===r.id);return `<article class="cg-king"><h3>${esc(r.name)}</h3><b>${esc(r.evaluation)}</b><p>${esc(r.trajectory)}</p><details><summary>회개·근거 보기</summary><p>${esc(r.repentance)}</p><p class="cg-refs">${esc(r.refs.join(' · '))}</p></details>${button(n)}</article>`;}).join('')||'<p>검색 결과가 없어요.</p>';
      else if(tab==='family')results.innerHTML=`<div class="cg-family"><section class="cg-list" aria-label="인물 목록">${graph.nodes.filter(n=>!q||`${n.label} ${n.roles.join(' ')}`.includes(q)).map(button).join('')||'<p>검색 결과가 없어요.</p>'}</section><section class="cg-detail" tabindex="-1">${detail()}</section></div><details class="cg-pending"><summary>확정하지 않은 관계 ${graph.pendingRelations.length}건</summary>${graph.pendingRelations.map(r=>`<p>${esc(r.reason)}<small class="cg-refs">${esc(r.refs.join(' · '))}</small></p>`).join('')}</details>`;
      else results.innerHTML=guide.dialogueInventory.filter(s=>!q||s.speaker.includes(q)).map(s=>{const link=graph.speakerLinks.find(l=>l.dialogueId===s.id),n=nodes.get(link?.nodeId);return `<article class="cg-voice"><h3>${esc(s.speaker)}</h3><small>${s.book==='1ch'?'역대상':'역대하'} ${s.chapter}:${esc(s.range)}</small><p>${esc(s.sourceNote)}</p>${n?button(n):'<small>서술자 요약 · 인물 노드가 아니에요.</small>'}</article>`;}).join('')||'<p>검색 결과가 없어요.</p>';
    }
    body.addEventListener('input',e=>{if(e.target.matches('[data-cg-search]')){query=e.target.value;drawResults();}});
    body.addEventListener('click',e=>{
      const t=e.target.closest('[data-cg-tab]');if(t){tab=t.dataset.cgTab;query='';draw();return;}
      const n=e.target.closest('[data-cg-node]');if(n){selected=n.dataset.cgNode;tab='family';query='';draw();body.querySelector('.cg-detail').focus({preventScroll:true});body.querySelector('.cg-detail').scrollIntoView({block:'start'});}
    });
    draw();
  } catch {if(dialog.isConnected)body.innerHTML='<p>자료를 불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 열어 주세요.</p>';}
}
document.addEventListener('click',e=>{if(e.target.closest('[data-chronicles-guide]'))openChroniclesGuide();});
