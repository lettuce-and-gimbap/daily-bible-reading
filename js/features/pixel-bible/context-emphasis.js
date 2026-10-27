import {OBJECT_CATALOG} from './object-catalog.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Emphasize known concrete context words, never inject source text as HTML.
export function contextTerms(choice){
 const text=[choice?.text,choice?.detailText].filter(Boolean).join(' ');
 const terms=[...Object.values(OBJECT_CATALOG).map(o=>o.name).filter(n=>n.length>=2),'속죄','구속','긍휼','세마포','거룩','회개','조상의 유산','기업 무를 자','우림과 둠밈','가죽띠','로뎀나무','포도원','거짓 증언','금 사슬','이삭','겉옷','기름','흉패','에봇','희년','할례','언약','방주','도장','물매','성벽','율법책'];
 // Include short contextual phrases as well as names. This lets the passage
 // view point to the action/claim that supports a line, rather than one noun.
 const phrases=[...text.matchAll(/[가-힣A-Za-z0-9]{2,}(?:의|은|는|이|가|을|를|에|에서|으로|에게|와|과)\s+[가-힣A-Za-z0-9]{2,}(?:\s+[가-힣A-Za-z0-9]{2,})?/gu)].map(m=>m[0]);
 return [...new Set([...phrases,...terms])].filter(t=>text.includes(t)).sort((a,b)=>b.length-a.length).slice(0,8);
}
export function emphasizedContext(text,terms=[]){
 let out='',at=0;const pattern=terms.length?new RegExp(terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g'):null;
 if(!pattern)return escape(text);
 for(const m of String(text).matchAll(pattern)){out+=escape(text.slice(at,m.index))+`<mark><strong>${escape(m[0])}</strong></mark>`;at=m.index+m[0].length;}
 return out+escape(text.slice(at));
}
export function emphasizePassage(root,terms){
 if(!terms.length)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())if(!walker.currentNode.parentElement.closest('button,script,style,mark'))nodes.push(walker.currentNode);
 for(const n of nodes){const html=emphasizedContext(n.textContent,terms);if(!html.includes('<mark>'))continue;const fragment=document.createElement('span');fragment.innerHTML=html;n.replaceWith(fragment);}
}
