// data/summary/*.json을 같은 모양으로 정리: 장마다 칸을 나누고, 사건·인물·관계·지역·찬양은 한 개에 한 줄
//   node tools/commentary/format.mjs           전체
//   node tools/commentary/format.mjs rut 1sa   몇 권만
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "../../data/summary");
const ORDER = ["type", "line", "story", "events", "people", "rels", "places"];

export function formatBook(d) {
  const J = JSON.stringify;
  const list = (arr, pad) => `[\n${arr.map((x) => `${pad}  ${J(x)}`).join(",\n")}\n${pad}]`;
  const chap = (c) => {
    const keys = [...ORDER.filter((k) => k in c), ...Object.keys(c).filter((k) => !ORDER.includes(k))];
    return `{\n${keys.map((k) => `      ${J(k)}: ${Array.isArray(c[k]) ? list(c[k], "      ") : J(c[k])}`).join(",\n")}\n    }`;
  };
  const chapters = Object.keys(d.chapters || {}).sort((a, b) => Number(a) - Number(b));
  return `{\n  "book": ${J(d.book)},\n  "songs": ${list(d.songs || [], "  ")},\n  "chapters": {\n${chapters.map((k) => `    ${J(k)}: ${chap(d.chapters[k])}`).join(",\n")}\n  }\n}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const only = process.argv.slice(2);
  for (const f of readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
    if (only.length && !only.includes(f.replace(".json", ""))) continue;
    const file = join(dataDir, f);
    writeFileSync(file, formatBook(JSON.parse(readFileSync(file, "utf8"))));
  }
  console.log("정리 완료");
}
