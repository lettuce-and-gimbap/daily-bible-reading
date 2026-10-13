// 사용: node fix.cjs <책> <장> "<c를 고치는 JS 코드>"   예: node fix.cjs gen 35 "c.people.push({name:'하나님',role:'..',weight:2})"
const fs = require("fs");
const { execFileSync } = require("child_process");
const repo = "C:/Users/sam04/Desktop/daily-bible-reading";
const [code, chap, expr] = process.argv.slice(2);
const f = `${repo}/data/summary/${code}.json`;
const d = JSON.parse(fs.readFileSync(f, "utf8"));
const c = d.chapters[chap];
new Function("c", "d", expr)(c, d);
fs.writeFileSync(f, JSON.stringify(d));
execFileSync("node", ["tools/commentary/format.mjs", code], { cwd: repo, stdio: "ignore" });
console.log("ok");
