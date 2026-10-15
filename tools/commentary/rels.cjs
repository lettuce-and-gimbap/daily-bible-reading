// 장마다 관계 목록 보기 (구절 풀이 쓰기용): node tools/commentary/rels.cjs <책> [시작장] [끝장]
const fs = require("fs"), path = require("path");
const [code, a = 1, b = 999] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/summary", `${code}.json`), "utf8"));
for (const k of Object.keys(d.chapters).map(Number).sort((x, y) => x - y)) {
  if (k < +a || k > +b) continue;
  const c = d.chapters[k];
  const rs = (c.rels || []).map((r) => `${r.from}>${r.to}:${r.label}${r.note ? "✓" : ""}`);
  const rn = (c.renames || []).map((r) => `[${r.from}>${r.to}:${r.verses}]`);
  console.log(`${k} | ${[...rs, ...rn].join(" / ")}`);
}
