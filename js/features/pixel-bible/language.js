// 괄호 속 동명이인 설명을 제외하고 실제 이름의 마지막 받침으로 조사 선택.
export function objectPhrase(value) {
 const text=String(value);const name=text.replace(/\s*\([^)]*\)\s*$/,'').trim();
 const code=name.codePointAt(name.length-1);const final=code>=0xac00&&code<=0xd7a3?(code-0xac00)%28:0;
 return text+(final?'을':'를');
}
export function movementDirection(dx,dy,previous='down'){
 if(!dx&&!dy)return previous;
 return Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
}
