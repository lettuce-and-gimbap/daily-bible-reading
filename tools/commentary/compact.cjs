// 작업용: 짧은 형식 묶음 파일을 장별 요약에 합침 (node tools/commentary/compact.cjs <파일.json>)
// 짧은 형식 → data/summary/<책>.json에 장 추가
// 입력: { "gen 1": { t, l, s, e:[[제목,절,설명]], p:[[이름,역할,비중]], r:[[from,to,"f>",label,비중]], g:[[이름,where,what,비중]] } }
// 관계 종류: f 가족, a 동역·도움, c 대립, o 기타 / > 방향 있음, - 서로
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const repo = "C:/Users/sam04/Desktop/daily-bible-reading";
const root = path.join(repo, "data/summary");
const KIND = { f: "family", a: "ally", c: "conflict", o: "other" };
const books = new Set();
for (const file of process.argv.slice(2)) {
  const src = JSON.parse(fs.readFileSync(file, "utf8"));
  const byBook = {};
  for (const [key, c] of Object.entries(src)) {
    const [code, chap] = key.split(" ");
    (byBook[code] = byBook[code] || {})[chap] = {
      type: c.t,
      line: c.l,
      story: c.s,
      events: (c.e || []).map(([title, verses, text]) => ({ title, verses: String(verses), text })),
      people: (c.p || []).map(([name, role, weight]) => ({ name, role, weight })),
      rels: (c.r || []).map(([from, to, k, label, weight]) => ({ from, to, label, kind: KIND[k[0]], directed: k[1] === ">", weight })),
      places: (c.g || []).map(([name, where, what, weight]) => ({ name, where, what, weight })),
      ...(c.n ? { renames: c.n.map(([from, to, verses, why]) => ({ from, to, verses: String(verses), why })) } : {}),
    };
    // 관계에만 쓰고 인물에서 빠뜨린 하나님·예수·성령은 자동으로 넣음
    const ch = byBook[code][chap], have = new Set(ch.people.map((p) => p.name));
    const ROLE = { 하나님: "말씀하시고 이끄시는 분", 예수: "가르치고 일하시는 주", 성령: "함께하시는 성령", "이스라엘 자손": "하나님의 언약 백성" };
    for (const r of ch.rels) for (const n of [r.from, r.to]) if (ROLE[n] && !have.has(n)) { ch.people.push({ name: n, role: ROLE[n], weight: 2 }); have.add(n); }
  }
  for (const [code, chs] of Object.entries(byBook)) {
    const f = path.join(root, `${code}.json`);
    const d = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : { book: code, songs: [], chapters: {} };
    Object.assign(d.chapters, chs);
    for (let i = 0; i < 5; i++) { try { fs.writeFileSync(f, JSON.stringify(d)); break; } catch (e) { if (i === 4) throw e; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500); } }
    books.add(code);
  }
}
for (let i = 0; i < 5; i++) { try { execFileSync("node", ["tools/commentary/format.mjs", ...books], { cwd: repo, stdio: "ignore" }); break; } catch (e) { if (i === 4) throw e; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500); } }
let out = "";
try { out = execFileSync("node", ["tools/commentary/check.mjs", ...books], { cwd: repo, encoding: "utf8" }); }
catch (e) { out = e.stdout; }
console.log(out.split("\n").filter((l) => l.includes("✗") || l.includes("△") || l.includes("검사")).join("\n"));
