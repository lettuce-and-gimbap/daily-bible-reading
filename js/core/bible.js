// 성경 66권 데이터 (코드는 갓피아 URL 파라미터 vol 값과 동일)
const BOOKS = [
  ["gen", "창세기", 50], ["exo", "출애굽기", 40], ["lev", "레위기", 27], ["num", "민수기", 36],
  ["deu", "신명기", 34], ["jos", "여호수아", 24], ["jdg", "사사기", 21], ["rut", "룻기", 4],
  ["1sa", "사무엘상", 31], ["2sa", "사무엘하", 24], ["1ki", "열왕기상", 22], ["2ki", "열왕기하", 25],
  ["1ch", "역대상", 29], ["2ch", "역대하", 36], ["ezr", "에스라", 10], ["neh", "느헤미야", 13],
  ["est", "에스더", 10], ["job", "욥기", 42], ["psa", "시편", 150], ["pro", "잠언", 31],
  ["ecc", "전도서", 12], ["sng", "아가", 8], ["isa", "이사야", 66], ["jer", "예레미야", 52],
  ["lam", "예레미야애가", 5], ["ezk", "에스겔", 48], ["dan", "다니엘", 12], ["hos", "호세아", 14],
  ["jol", "요엘", 3], ["amo", "아모스", 9], ["oba", "오바댜", 1], ["jnh", "요나", 4],
  ["mic", "미가", 7], ["nam", "나훔", 3], ["hab", "하박국", 3], ["zep", "스바냐", 3],
  ["hag", "학개", 2], ["zec", "스가랴", 14], ["mal", "말라기", 4],
  ["mat", "마태복음", 28], ["mrk", "마가복음", 16], ["luk", "누가복음", 24], ["jhn", "요한복음", 21],
  ["act", "사도행전", 28], ["rom", "로마서", 16], ["1co", "고린도전서", 16], ["2co", "고린도후서", 13],
  ["gal", "갈라디아서", 6], ["eph", "에베소서", 6], ["php", "빌립보서", 4], ["col", "골로새서", 4],
  ["1th", "데살로니가전서", 5], ["2th", "데살로니가후서", 3], ["1ti", "디모데전서", 6], ["2ti", "디모데후서", 4],
  ["tit", "디도서", 3], ["phm", "빌레몬서", 1], ["heb", "히브리서", 13], ["jas", "야고보서", 5],
  ["1pe", "베드로전서", 5], ["2pe", "베드로후서", 3], ["1jn", "요한일서", 5], ["2jn", "요한이서", 1],
  ["3jn", "요한삼서", 1], ["jud", "유다서", 1], ["rev", "요한계시록", 22],
].map(([code, name, chapters], i) => ({ code, name, chapters, index: i, testament: i < 39 ? "OT" : "NT" }));

// 갓피아 성경 읽기에서 제공하는 역본 (순서·이름은 갓피아 화면과 같게)
// 갓피아가 모르는 코드를 보내면 /read/reading.asp로 리다이렉트되어 창세기 1장이 열린다.
// 쉬운성경(easy)은 주소 화면(button 라벨)엔 그대로 나오지만 실제 본문은 로드되지 않고
// 창세기 1장으로 튕기므로(2026-09 재확인) 넣지 않는다.
const VERSIONS = [
  { code: "gae", name: "개역개정4판" },
  { code: "niv", name: "NIV" },
  { code: "han", name: "개역한글" },
  { code: "hyun", name: "현대인의성경" },
  { code: "saenew", name: "새번역" },
  { code: "hebrew", name: "히브리어(구약)" },
  { code: "greek", name: "헬라어(신약)" },
];

// 원어는 구약=히브리어, 신약=헬라어만 있으므로 장에 맞게 바꿔 줌
function versionFor(code, book) {
  if (code === "hebrew" && book.testament === "NT") return "greek";
  if (code === "greek" && book.testament === "OT") return "hebrew";
  return code;
}

// 전체 1,189장을 0부터 시작하는 일련번호로 펼친 목록
const CHAPTERS = [];
BOOKS.forEach((b) => {
  for (let c = 1; c <= b.chapters; c++) CHAPTERS.push({ book: b, chap: c });
});
const TOTAL_CHAPTERS = CHAPTERS.length;

function chapterIndex(bookCode, chap) {
  let idx = 0;
  for (const b of BOOKS) {
    if (b.code === bookCode) return idx + chap - 1;
    idx += b.chapters;
  }
  return -1;
}

function godpiaReadUrl(bookCode, chap, ver, ver2) {
  const p = new URLSearchParams({ ver, vol: bookCode, chap: String(chap) });
  if (ver2) p.set("ver2", ver2);
  return "https://www.godpia.com/read/reading.asp?" + p.toString();
}

function godpiaQtUrl(dateStr) {
  return "https://www.godpia.com/qt/qt.asp" + (dateStr ? "?D=" + dateStr : "");
}

// 장 번호 목록을 "창세기 1–5장, 출애굽기 1장" 형태로 압축
function describeChapters(indices) {
  const sorted = [...indices].sort((a, b) => a - b);
  const parts = [];
  let i = 0;
  while (i < sorted.length) {
    const start = CHAPTERS[sorted[i]];
    let j = i;
    while (
      j + 1 < sorted.length &&
      sorted[j + 1] === sorted[j] + 1 &&
      CHAPTERS[sorted[j + 1]].book === start.book
    ) j++;
    const end = CHAPTERS[sorted[j]];
    parts.push(
      start.chap === end.chap
        ? `${start.book.name} ${start.chap}장`
        : `${start.book.name} ${start.chap}–${end.chap}장`
    );
    i = j + 1;
  }
  return parts.join(", ");
}

if (typeof module !== "undefined") {
  module.exports = { BOOKS, VERSIONS, versionFor, CHAPTERS, TOTAL_CHAPTERS, chapterIndex, godpiaReadUrl, godpiaQtUrl, describeChapters };
}
