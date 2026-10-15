// 이미 쓴 관계(rels)에 구절 풀이를 붙임 — 관계도 상세 창에서 "이 관계가 생긴 장면"으로 보여 줌
// 사용: node tools/commentary/addnote.cjs <묶음 파일.json>
// 입력: { "gen 22": [[from, to, 절, 풀이, (같은 두 사람 관계가 둘이면 label)]], ... }
//   절은 "2" 또는 "1-3", 풀이는 90자 이내 쉬운 말(새번역 문장을 옮기지 말고 뜻을 풀어 씀)
//   이름 바뀜(renames)의 from→to와 같으면 그쪽에 붙음
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "../..");
const batch = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const books = {};
let added = 0, missed = 0;
for (const [key, notes] of Object.entries(batch)) {
  const [code, chap] = key.split(" ");
  const file = path.join(root, "data/summary", `${code}.json`);
  const d = books[code] || (books[code] = JSON.parse(fs.readFileSync(file, "utf8")));
  const c = d.chapters[chap];
  if (!c) { console.log(`✗ ${key} 장 없음`); missed += notes.length; continue; }
  for (const [from, to, verses, note, label] of notes) {
    const hits = (c.rels || []).filter((r) => r.from === from && r.to === to && (!label || r.label === label));
    const rn = (c.renames || []).find((r) => r.from === from && r.to === to);
    if (hits.length === 1) { hits[0].verses = String(verses); hits[0].note = note; added++; }
    else if (!hits.length && rn) { rn.note = note; added++; }
    else { console.log(`✗ ${key} ${from}→${to} ${hits.length ? "관계가 여럿 (label을 넣어 주세요)" : "관계 없음"}`); missed++; }
  }
}
for (const [code, d] of Object.entries(books)) {
  fs.writeFileSync(path.join(root, "data/summary", `${code}.json`), JSON.stringify(d));
  execFileSync("node", [path.join(__dirname, "format.mjs"), code]);
}
console.log(`구절 풀이 ${added}개 붙임${missed ? ` · 못 붙임 ${missed}개` : ""}`);
