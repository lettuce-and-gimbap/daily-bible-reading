// 장 데이터를 짧게 보기 (검증·보강할 때): node tools/commentary/show.cjs <책> <장> [<장>...]
const path = require("path");
const [book, ...chaps] = process.argv.slice(2);
const d = require(path.join(__dirname, "../../data/summary", `${book}.json`));
const all = d.chapters || d;
for (const c of chaps) {
  const x = all[c];
  console.log(`## ${book} ${c} [${x.type}]\nLINE ${x.line}\nSTORY ${x.story}`);
  (x.events || []).forEach((e, i) => console.log(`E${i} ${e.verses} ${e.title} | ${e.text}`));
  (x.rels || []).forEach((r) => console.log(`R ${r.from}>${r.to} (${r.label}) ${r.verses || ""} | ${r.note || ""}`));
  (x.places || []).forEach((p) => console.log(`P ${p.where} | ${p.what}`));
}
