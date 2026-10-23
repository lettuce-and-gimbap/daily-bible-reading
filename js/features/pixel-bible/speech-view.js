import {OBJECT_CATALOG} from './object-catalog.js';
// Keep complete context for opt-in reading, never send a chapter essay into a bubble.
import {objectMonologue} from './object-monologues.js';
export const BUBBLE_LIMIT = 64;
export function objectContextSpeech(label,evidence,{speaker=null,kind=null,chapters=[],random=Math.random}={}){
  const voice=objectMonologue(speaker,kind||Object.values(OBJECT_CATALOG).find(d=>d.name===label)?.id||'tool',chapters,{random});
  if(!voice)return null;
  return {...voice,detailText:evidence?.text||'',ref:voice.ref||evidence?.ref||''};
}
export function speechView(choice) {
  const full=String(choice.text||'').trim();
  const first=full.match(/^.*?[.!?。](?:\s|$)/u)?.[0]?.trim()||full;
  const sentences=full.match(/[^.!?。]+[.!?。]?(?:\s|$)/gu)||[];
 let text=[...full].length<=BUBBLE_LIMIT&&sentences.length<=2?full:first;
  if([...text].length>BUBBLE_LIMIT){
    const head=[...text].slice(0,BUBBLE_LIMIT-1).join('');
    const boundary=head.lastIndexOf(' ');
    text=(boundary>40?head.slice(0,boundary):head)+'…';
  }
  return {...choice,text,detailText:choice.detailText||(text!==full?full:'')};
}
