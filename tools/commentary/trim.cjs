// 사용: node trim.cjs <책> [한도=500]  — 한도 넘는 story에서 인용(")이 없는 가운데 문장 중 가장 긴 것부터 뺌. 뺀 뒤 핵심이 빠졌는지 꼭 다시 읽을 것
const fs=require("fs");const [code,lim="500"]=process.argv.slice(2);const LIM=+lim;
const f=`C:/Users/sam04/Desktop/daily-bible-reading/data/summary/${code}.json`;const d=JSON.parse(fs.readFileSync(f,"utf8"));
for(const [k,c] of Object.entries(d.chapters)){ if(!c.story||c.story.length<=LIM) continue;
  let s=c.story.match(/[^.?!]+[.?!]["”]?\s*/g).map(x=>x.trim());
  while(s.join(" ").length>LIM){ let bi=-1; for(let i=1;i<s.length-1;i++) if(!s[i].includes('"')&&(bi<0||s[i].length>s[bi].length)) bi=i; if(bi<0) break; console.log(code,k,"뺌:",s[bi].slice(0,50)); s.splice(bi,1); }
  c.story=s.join(" "); }
fs.writeFileSync(f,JSON.stringify(d));
