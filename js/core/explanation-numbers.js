// 설명 문구의 한글 수량 표현을 숫자로 바꾼다. 성경 원문 영역은 변환하지 않는다.
(() => {
  const values = new Map();
  const native = ['영','한','두','세','네','다섯','여섯','일곱','여덟','아홉','열','열한','열두','열세','열네','열다섯','열여섯','열일곱','열여덟','열아홉','스무','스물'];
  native.forEach((w,i)=>values.set(w,i<20?i:i===20?20:20));
  const sino=['영','일','이','삼','사','오','육','칠','팔','구'];
  sino.forEach((w,i)=>values.set(w,i));
  for(let n=10;n<100;n+=10) values.set(n===10?'십':`${sino[Math.floor(n/10)]}십`,n);
  for(let n=11;n<20;n++) values.set(`십${sino[n%10]}`,n);
  for(let t=2;t<10;t++)for(let u=1;u<10;u++)values.set(`${sino[t]}십${sino[u]}`,t*10+u);
  const words=[...values.keys()].sort((a,b)=>b.length-a.length);
  const spaced=w=>[...w].join('\\s*');
  const alternatives=words.map(spaced).join('|');
  const units='대\\s*손|단\\s*계|명|사\\s*람|개|번\\s*째|번|년|개월|달|월|일|권|장|절|곳|가지|배|세|쪽|가구|형제|자녀|차례|주|시간|분|초|마리|그루|편|줄|구절|항목|문장|부분|갈래';
  const re=new RegExp(`(^|[^가-힣])(${alternatives})\\s*(${units})(?=[은는이가을를의에와과도만부터까지로]|[^가-힣]|$)`,'g');
  const escapedUnit=/^사\s*람$/;
  function format(text){
    return text.replace(re,(whole,prefix,num,unit)=>{
      const normalized=num.replace(/\s/g,'');let value=values.get(normalized);
      if(value===undefined)return whole;
      if(escapedUnit.test(unit))unit='명';else unit=unit.replace(/\s/g,'');
      return `${prefix}${value}${unit}`;
    });
  }
  const excluded=el=>!el||el.closest('script,style,textarea,input,select,[contenteditable="true"],.study-version,.verse-text,.bible-verse,.scripture-text,[data-scripture-original],.qt-verse,.sum-ref,.rg-ref');
  function visit(root){
    if(root.nodeType===Node.TEXT_NODE){if(root.nodeValue&&!excluded(root.parentElement)){const next=format(root.nodeValue);if(next!==root.nodeValue)root.nodeValue=next;}return;}
    if(root.nodeType!==Node.ELEMENT_NODE&&root!==document)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(visit);
  }
  document.addEventListener('DOMContentLoaded',()=>visit(document.body),{once:true});
  new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(visit))).observe(document.documentElement,{childList:true,subtree:true});
  globalThis.formatExplanationNumbers=format;
})();
