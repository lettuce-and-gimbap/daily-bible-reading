// 검증·보강 결과 적용: node tools/commentary/patch.cjs <patch.json>
// { "2sa 3": { "line": "…", "story": "…", "events": { "0": "새 설명", "2": { "title": "…", "text": "…" } },
//              "rels": [["아브넬","다윗","새 풀이", "이름표(같은 두 사람 관계가 여럿일 때)"]], "places": { "0": "새 설명" } } }
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const root = path.join(__dirname, "../..");
const batch = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
// 여러 작업자가 같은 권(예: 시편)을 동시에 고칠 수 있어 읽기~쓰기 동안 잠금
const lockFile = path.join(root, "data/summary/.patch.lock");
const t0 = Date.now();
for (;;) {
  try { fs.closeSync(fs.openSync(lockFile, "wx")); break; }
  catch (e) {
    if (Date.now() - t0 > 120000) { try { fs.unlinkSync(lockFile); } catch (_) {} continue; }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
}
process.on("exit", () => { try { fs.unlinkSync(lockFile); } catch (_) {} });
const books = {}; let n = 0; const miss = [];
for (const key in batch) {
  const [code, ch] = key.split(" ");
  const d = books[code] || (books[code] = JSON.parse(fs.readFileSync(path.join(root, "data/summary", `${code}.json`), "utf8")));
  const c = (d.chapters || d)[ch], p = batch[key];
  if (!c) { miss.push(key); continue; }
  if (p.line) { c.line = p.line; n++; }
  if (p.story) { c.story = p.story; n++; }
  for (const [i, v] of Object.entries(p.events || {})) {
    const e = c.events[i];
    if (!e) { miss.push(`${key} E${i}`); continue; }
    Object.assign(e, typeof v === "string" ? { text: v } : v); n++;
  }
  for (const [i, v] of Object.entries(p.places || {})) {
    const pl = c.places[i];
    if (!pl) { miss.push(`${key} P${i}`); continue; }
    Object.assign(pl, typeof v === "string" ? { what: v } : v); n++;
  }
  for (const [from, to, note, label] of p.rels || []) {
    const hit = (c.rels || []).filter((r) => r.from === from && r.to === to && (!label || r.label === label));
    if (hit.length !== 1) { miss.push(`${key} ${from}>${to} (${hit.length})`); continue; }
    hit[0].note = note; n++;
  }
}
for (const code in books) {
  fs.writeFileSync(path.join(root, "data/summary", `${code}.json`), JSON.stringify(books[code]));
  execFileSync("node", [path.join(__dirname, "format.mjs"), code]);
}
console.log(`고침 ${n}곳`); miss.forEach((m) => console.log("✗ " + m));
