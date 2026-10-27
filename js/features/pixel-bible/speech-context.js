import {parseReference} from './references.js';
// Explain only this exchange. A chapter summary is never a substitute for context.
export function speechContext(choice,chapters=[]){
 if(!choice||['object-daily','daily','general'].includes(choice.origin))return '';
 if(choice.lineDetail)return String(choice.lineDetail).trim();
 const ref=parseReference(choice.ref),chapter=chapters.find(c=>c.code===ref?.code&&Number(c.chap)===ref?.chapter);
 const names=[choice.speaker?.name,choice.target?.name].filter(Boolean);
 const sentences=t=>String(t||'').split(/(?<=[.!?。]|다\.|요\.)\s+/u).map(s=>s.trim()).filter(s=>s&&s.length<=180);
 const detail=String(choice.detailText||'').trim(),story=String(chapter?.data?.story||'').trim();
 const candidates=[];
 if(detail&&detail!==story&&detail!==String(chapter?.data?.line||'').trim()&&detail.length<=400)candidates.push(...sentences(detail));
 for(const e of chapter?.data?.events||[]){
  const nums=String(e.verses||'').match(/\d+/g)?.map(Number)||[],lo=nums[0],hi=nums[nums.length-1];
  const text=String(e.text||'');
  if(ref?.verses?.length&&lo&&ref.verses.some(v=>v>=lo&&v<=hi))candidates.push(...sentences(text));
 }
 const unique=[...new Set(candidates)].filter(s=>s!==choice.text&&!/상상 독백|창작.*동작/.test(s));
 unique.sort((a,b)=>names.filter(n=>b.includes(n)).length-names.filter(n=>a.includes(n)).length);
 const selected=[];let length=0;
 for(const s of unique){if(length+s.length>240)continue;selected.push(s);length+=s.length;if(selected.length===2)break;}
 return selected.join(' ');
}
