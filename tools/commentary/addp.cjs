// 이미 쓴 장에 빠진 인물(과 관계)을 덧붙임. 이미 있는 이름은 건너뜀
// 입력: { "gen 22": { "p": [[이름, 역할, 비중]], "r": [[from, to, "f>", label, 비중]] } }
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const repo = "C:/Users/sam04/Desktop/daily-bible-reading";
const KIND = { f: "family", a: "ally", c: "conflict", o: "other" };
const src = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const books = new Set();
let added = 0;
for (const [key, v] of Object.entries(src)) {
  const [code, chap] = key.split(" ");
  const f = path.join(repo, "data/summary", `${code}.json`);
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  const c = d.chapters[chap];
  if (!c) { console.log(`없는 장: ${key}`); continue; }
  const have = new Set(c.people.map((p) => p.name));
  for (const [name, role, weight] of v.p || []) if (!have.has(name)) { c.people.push({ name, role, weight }); have.add(name); added++; }
  for (const [from, to, k, label, weight] of v.r || []) c.rels.push({ from, to, label, kind: KIND[k[0]], directed: k[1] === ">", weight });
  fs.writeFileSync(f, JSON.stringify(d));
  books.add(code);
}
execFileSync("node", ["tools/commentary/format.mjs", ...books], { cwd: repo, stdio: "ignore" });
let out = "";
try { out = execFileSync("node", ["tools/commentary/check.mjs", ...books], { cwd: repo, encoding: "utf8" }); } catch (e) { out = e.stdout; }
console.log(`인물 ${added}명 추가`);
console.log(out.split("\n").filter((l) => l.includes("✗") || l.includes("검사")).join("\n"));
