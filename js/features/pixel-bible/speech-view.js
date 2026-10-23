// Keep complete context for opt-in reading, never send a chapter essay into a bubble.
import {objectPhrase} from './language.js';
export const BUBBLE_LIMIT = 64;
export function objectContextSpeech(label,evidence){
  return {text:`${objectPhrase(label||'물건')} 살펴보자.`,detailText:evidence.text,ref:evidence.ref};
}
export function speechView(choice) {
  const full=String(choice.text||'').trim();
  const first=full.match(/^.*?[.!?。](?:\s|$)/u)?.[0]?.trim()||full;
  let text=first;
  if([...text].length>BUBBLE_LIMIT){
    const head=[...text].slice(0,BUBBLE_LIMIT-1).join('');
    const boundary=head.lastIndexOf(' ');
    text=(boundary>40?head.slice(0,boundary):head)+'…';
  }
  return {...choice,text,detailText:choice.detailText||(text!==full?full:'')};
}
