// 갓피아에서 복사한 구절을 메모 양식으로 붙여넣기 (통독 메모 · QT 묵상 노트 공통)

// 갓피아에서 복사한 구절을 메모 양식으로 바꿈
//   민수기 18:10          ← 첫 줄: 권 장:절 (여러 절이면 18:10-11)
//   10 지극히 거룩하게…   ← 다음 줄부터: 절 번호 + 공백 한 칸 + 구절
// 복사할 때 절 번호와 본문 사이가 붙거나(10지극히), 여러 칸·탭이거나, 줄이 나뉘어도(10↵지극히) 한 칸으로 맞춤
//
// 두권 보기에서 복사하면 갓피아는 "1 개역개정 / 1 새번역 / 2 개역개정 / 2 새번역 …"처럼 절마다 번갈아 나오므로,
// 같은 절 번호가 n번째로 나온 줄을 n번째 역본으로 보고 역본별로 모아 이어 씀:
//   1 (개역개정) 2 (개역개정) 3 (개역개정) 1 (새번역) 2 (새번역) 3 (새번역)
// 번호 없는 줄(한 절이 여러 줄로 복사된 경우)은 바로 앞 줄과 같은 역본에 붙임
// 현대인의성경처럼 짧은 절을 "10-11"로 묶어 보여주는 역본도 있어서, 절 번호 칸은 "10"뿐 아니라 "10-11"도 통째로 인식함
// (판별은 앞의 첫 번호로 하므로, 개역개정엔 있고 그 역본엔 없는 가운데 번호는 묶음에 자연히 포함됨)
//
// 휴대폰에서 길게 눌러 선택하면 절 번호 칸은 빠지고 본문 글자부터 선택되므로, 첫 줄에 번호가 없으면 추정해 붙임:
//   두권 보기 — 다음 번호 n이 한 번만 나오면 첫 줄은 n절의 첫 번째 역본, 두 번 나오면 (n-1)절의 두 번째 역본
//   한권 보기 — 첫 줄은 (n-1)절
function formatVerses(text, chapter, twoVersions = false) {
  const raw = text.replace(/\r/g, "").replace(/ /g, " ").split("\n").map((l) => l.trim()).filter(Boolean)
    .filter((l) => !/^\S+ \d{1,3}장$/.test(l)); // 함께 선택된 "민수기 28장" 같은 제목 줄은 뺌
  const lines = [];
  for (let i = 0; i < raw.length; i++) {
    // 절 번호(또는 "10-11"처럼 묶인 번호)만 있는 줄은 다음 줄 본문과 합침
    if (/^\d{1,3}(-\d{1,3})?$/.test(raw[i]) && raw[i + 1] && !/^\d/.test(raw[i + 1])) {
      lines.push(`${raw[i]} ${raw[i + 1]}`);
      i++;
    } else {
      lines.push(raw[i]);
    }
  }

  // 절 번호 칸: "10", 또는 일부 역본이 짧은 절을 묶어 보여주는 "10-11"
  const VERSE = /^(\d{1,3}(?:-\d{1,3})?)\s*(?=[^\d\s])(.*)$/;
  const keyOf = (label) => Number(label.match(/^\d+/)[0]); // 역본 판별은 묶음이어도 앞 번호 하나로
  const spanOf = (label) => {
    const m = label.match(/^(\d+)(?:-(\d+))?$/);
    return m[2] ? [Number(m[1]), Number(m[2])] : [Number(m[1]), Number(m[1])];
  };
  const keys = lines.map((l) => (l.match(VERSE) || [])[1]).filter(Boolean).map(keyOf);
  const count = (n) => keys.filter((x) => x === n).length;
  const seen = {}; // 절 번호 → 지금까지 나온 횟수
  let group = 0;

  // 첫 줄에 번호가 없으면 몇 절(몇 번째 역본)인지 추정
  let leadLabel = null;
  if (lines.length && !VERSE.test(lines[0]) && keys.length) {
    const n = keys[0];
    const two = twoVersions || keys.some((x) => count(x) > 1);
    if (two && count(n) === 1) {
      leadLabel = String(n); // 첫 번째 역본의 n절 → 다음 줄 n은 두 번째 역본
    } else if (two && n > 1) {
      leadLabel = String(n - 1); // 두 번째 역본의 (n-1)절
      seen[n - 1] = 1;
      group = 1;
    } else if (!two && n > 1) {
      leadLabel = String(n - 1);
    }
  }

  const verses = [];
  const groups = []; // groups[k] = k번째 역본의 줄들
  const add = (g, line) => (groups[g] = groups[g] || []).push(line);
  lines.forEach((l, i) => {
    const m = i === 0 && leadLabel !== null ? [null, leadLabel, l] : l.match(VERSE);
    if (m) {
      const label = m[1];
      const n = keyOf(label);
      if (!(i === 0 && group === 1)) group = seen[n] = n in seen ? seen[n] + 1 : 0;
      verses.push(...spanOf(label));
      add(group, `${label} ${m[2].trim().replace(/\s+/g, " ")}`);
    } else {
      add(group, l.replace(/\s+/g, " "));
    }
  });

  const body = groups.filter(Boolean).flat();
  if (!chapter) return body.join("\n");
  const lo = Math.min(...verses), hi = Math.max(...verses);
  const ref = verses.length
    ? `${chapter.book.name} ${chapter.chap}:${lo === hi ? lo : `${lo}-${hi}`}`
    : `${chapter.book.name} ${chapter.chap}장`;
  return `${ref}\n${body.join("\n")}`;
}

// ── 일부만 복사해도 온전한 절로 (어디서 복사했든 붙일 역본으로) ──
// 예) " 행하지 아니하리라↵13그러면 누구나 다 이 일에 관" → 신명기 17:13 개역개정 + 쉬운성경 전체
// 붙이는 역본은 config.js의 QUOTE_VERSIONS. 순서:
//   1) 복사한 글에 "신명기 17:13"이 있으면 그 절
//   2) 몇 장인지 짐작 가는 곳("신명기 17장" 제목 줄, 통독 화면에서 보고 있는 장)의 갓피아 본문과 맞대어 봄
//   3) 못 찾으면 줄마다 본문 검색(worker/의 /search)으로 장을 찾고, 그 장의 갓피아 본문과 맞대어 절을 정확히 잡음
// 서버가 없거나 끝내 못 찾으면 null → 복사한 그대로 붙임
const chapterVerseCache = {};

// 한 장 본문을 갓피아에서 받아 [{label: "13", text: "…"}] (두 역본이면 갓피아 화면 순서대로 번갈아)
async function chapterVerses(idx, ver, ver2) {
  const { book, chap } = CHAPTERS[idx];
  const p = new URLSearchParams({ ver: versionFor(ver, book), vol: book.code, chap: String(chap) });
  if (ver2 && ver2 !== ver) p.set("ver2", versionFor(ver2, book));
  const qs = p.toString();
  if (!chapterVerseCache[qs]) {
    chapterVerseCache[qs] = fetch(`${PUSH_SERVER}/bible?${qs}`)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((html) => [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("li[datasec]")]
        .map((li) => ({
          label: ((li.querySelector(".bible-read-no") || {}).textContent || "").trim(),
          text: ((li.querySelector(".bible-read-cont") || {}).textContent || "").replace(/\s+/g, " ").trim(),
        }))
        .filter((v) => /^\d/.test(v.label) && v.text))
      .catch((e) => { delete chapterVerseCache[qs]; throw e; });
  }
  return chapterVerseCache[qs];
}

// "10-11" → [10, 11], "13" → [13, 13]
function labelSpan(label) {
  const m = label.match(/^(\d+)(?:-(\d+))?/);
  return [Number(m[1]), Number(m[2] || m[1])];
}

function copiedLines(text) {
  return text.replace(/ /g, " ").split("\n").map((l) => l.trim()).filter(Boolean)
    .filter((l) => !/^\S+ \d{1,3}장$/.test(l)); // 함께 선택된 "민수기 28장" 같은 제목 줄은 뺌
}

// 본문 순서(두권 보기면 개역 1 → 새번역 1 → 개역 2 …) 그대로 이어 붙인 글에서 복사한 범위를 찾아 걸친 절들을 돌려줌
// 공백·줄바꿈은 복사 방식마다 달라서 모두 빼고 비교함
function findCopiedVerses(verses, text) {
  const squash = (s) => s.replace(/\s+/g, "");
  let stream = "";
  const starts = [], ends = [];
  verses.forEach((v) => {
    starts.push(stream.length);
    stream += squash(v.label + v.text);
    ends.push(stream.length);
  });
  const lines = copiedLines(text);
  const whole = squash(lines.join(""));
  if (!whole) return null;

  let from = stream.indexOf(whole), to;
  if (from >= 0) {
    if (stream.indexOf(whole, from + 1) >= 0) return null; // 같은 글이 여러 곳 → 어느 절인지 모름
    to = from + whole.length;
  } else {
    // 통째로 안 맞으면(다른 글자가 섞였거나 다른 역본 줄이 섞인 경우) 줄마다 차례로 찾아 처음~끝을 잡음
    let cursor = 0;
    lines.map(squash).filter((q) => q.length >= 4).forEach((q) => {
      const i = stream.indexOf(q, cursor);
      if (i < 0) return;
      if (from < 0) from = i;
      to = cursor = i + q.length;
    });
    if (from < 0) return null;
  }
  const first = ends.findIndex((e) => e > from);
  let last = ends.findIndex((e) => e >= to);
  // 끝에 다음 절 번호만 딸려 왔으면("…아니하리라↵14") 그 절은 뺌
  if (last > first && to - starts[last] <= squash(verses[last].label).length) last--;
  return verses.slice(first, last + 1);
}

// 복사한 글 속 "신명기 17:13", "신명기 17:12-13", "신명기 17장 13절", "신명기 17장"
function refsInText(text) {
  const refs = [];
  BOOKS.forEach((b) => {
    const re = new RegExp(`${b.name}\\s*(\\d{1,3})(?:\\s*(?::|장)\\s*(?:(\\d{1,3})(?:\\s*[-~–]\\s*(\\d{1,3}))?)?)?`, "g");
    for (const m of text.matchAll(re)) {
      const chap = Number(m[1]);
      if (chap < 1 || chap > b.chapters) continue;
      const lo = m[2] ? Number(m[2]) : null;
      refs.push({ idx: chapterIndex(b.code, chap), lo, hi: lo && Number(m[3] || m[2]) });
    }
  });
  return refs;
}

// 홀리바이블 검색 역본 → 같은 역본의 갓피아 코드 (공동번역·KJV·NASB는 갓피아에 없음)
const SEARCH_TO_GODPIA = { GAE: "gae", SAENEW: "saenew", HDB: "hyun", RHV: "han", NIV: "niv" };

// 검색 사이트가 EUC-KR(CP949) 검색어만 알아들어서 직접 인코딩함.
// 브라우저엔 CP949 인코더가 없고 디코더만 있으므로, 두 바이트 조합을 모두 디코딩해 거꾸로 찾는 표를 한 번 만든다.
let cp949Table = null;
function cp949Encode(str) {
  if (!cp949Table) {
    cp949Table = new Map();
    const dec = new TextDecoder("euc-kr");
    const hex = (n) => "%" + n.toString(16).toUpperCase();
    for (let lead = 0x81; lead <= 0xfe; lead++) {
      for (let trail = 0x41; trail <= 0xfe; trail++) {
        const ch = dec.decode(new Uint8Array([lead, trail]));
        if (ch.length === 1 && ch !== "�" && !cp949Table.has(ch)) cp949Table.set(ch, hex(lead) + hex(trail));
      }
    }
  }
  return [...str].map((ch) => (/[A-Za-z0-9]/.test(ch) ? ch : cp949Table.get(ch) || "+")).join("");
}

async function searchLine(line) {
  // 숫자(절 번호)·문장부호가 섞이면 검색이 안 되므로 글자만 남기고, 검색창 길이에 맞춰 낱말 단위로 자름
  let q = line.replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
  while (q.length > 60) q = q.replace(/\s*\S+$/, "");
  if (q.replace(/\s/g, "").length < 2) return { hits: [] };
  const lang = /[가-힣]/.test(q) ? "ko" : "en";
  try {
    const res = await fetch(`${PUSH_SERVER}/search?lang=${lang}&q=${cp949Encode(q)}`);
    return res.ok ? await res.json() : { hits: [] };
  } catch (e) {
    return { hits: [] };
  }
}

async function locateCopied(text, nearIdx) {
  const refs = refsInText(text);
  const exact = refs.find((r) => r.lo);
  if (exact) return exact;

  const matchIn = async (idx, pairs) => {
    for (const [a, b] of pairs) {
      const hit = findCopiedVerses(await chapterVerses(idx, a, b), text);
      if (hit) {
        const spans = hit.map((v) => labelSpan(v.label));
        return { idx, lo: Math.min(...spans.map((s) => s[0])), hi: Math.max(...spans.map((s) => s[1])) };
      }
    }
    return null;
  };
  const quotePair = [QUOTE_VERSIONS[0], QUOTE_VERSIONS[1]];

  // 짐작 가는 장부터: 제목 줄의 장, 통독 화면에서 보고 있는 장(그 화면의 역본으로도 대조)
  const s = state.settings;
  const guesses = refs.map((r) => [r.idx, [quotePair]]);
  if (nearIdx !== null && nearIdx !== undefined) {
    guesses.push([nearIdx, [quotePair, [s.ver, s.mode === "two" ? s.ver2 : ""]]]);
  }
  for (const [idx, pairs] of guesses) {
    const loc = await matchIn(idx, pairs);
    if (loc) return loc;
  }

  // 본문 검색: 줄마다(역본이 섞여 있을 수 있어서) 따로 찾고, 여러 줄이 함께 가리키는 장부터 대조
  const lines = copiedLines(text).map((l) => l.replace(/^\d{1,3}(-\d{1,3})?\s*/, ""))
    .filter((l) => l.replace(/\s/g, "").length >= 4).slice(0, 6);
  const results = await Promise.all(lines.map(searchLine));
  const score = new Map(); // 장 → 그 장을 가리킨 줄 수 (먼저 나온 장이 관련도 높음)
  results.forEach((r) => new Set(r.hits.map(([vl, cn]) => chapterIndex(BOOKS[vl - 1].code, cn)))
    .forEach((idx) => score.set(idx, (score.get(idx) || 0) + 1)));
  const ranked = [...score].sort((a, b) => b[1] - a[1]).map(([idx]) => idx);
  if (!ranked.length) return null;

  const found = [...new Set(results.map((r) => SEARCH_TO_GODPIA[r.ver]).filter(Boolean))];
  const pairs = [quotePair];
  if (found.length) pairs.push([found[0], found[1] || QUOTE_VERSIONS[1]]);
  for (const idx of ranked.slice(0, 3)) {
    const loc = await matchIn(idx, pairs);
    if (loc) return loc;
  }

  // 본문을 맞대어 보지 못한 경우(공동번역·KJV처럼 갓피아에 없는 역본 등): 검색 결과의 절 번호를 그대로 씀
  // 한 줄에 같은 장의 절이 여럿 걸리면 애매하므로, 딱 하나만 걸린 줄들을 우선함
  const idx = ranked[0];
  const perLine = results.map((r) => r.hits.filter(([vl, cn]) => chapterIndex(BOOKS[vl - 1].code, cn) === idx).map((h) => h[2]))
    .filter((v) => v.length);
  const sure = perLine.filter((v) => v.length === 1).map((v) => v[0]);
  const nums = sure.length ? sure : [perLine[0][0]];
  return { idx, lo: Math.min(...nums), hi: Math.max(...nums) };
}

// 복사한 글 → 붙일 역본으로 된 온전한 절 (못 찾으면 null)
async function expandToFullVerses(text, nearIdx) {
  if (!PUSH_SERVER) return null;
  try {
    const loc = await locateCopied(text, nearIdx);
    if (!loc) return null;
    const picked = (await chapterVerses(loc.idx, QUOTE_VERSIONS[0], QUOTE_VERSIONS[1])).filter((v) => {
      const [a, b] = labelSpan(v.label);
      return a <= loc.hi && b >= loc.lo;
    });
    if (!picked.length) return null;
    return formatVerses(picked.map((v) => `${v.label} ${v.text}`).join("\n"), CHAPTERS[loc.idx], QUOTE_VERSIONS.length > 1);
  } catch (e) {
    return null; // 서버·네트워크 문제
  }
}

async function readClipboardText() {
  try {
    return (await navigator.clipboard.readText()) || "";
  } catch (e) {
    return ""; // 권한 거부·미지원
  }
}

// 메모 끝에 구절을 덧붙임 (앞 내용과는 빈 줄 하나로 구분)
function appendQuote(note, quote) {
  const base = (note || "").replace(/\s+$/, "");
  return (base ? `${base}\n\n` : "") + quote + "\n";
}

// 오늘의 통독 메모가 비어 있으면 "[민수기 12-16장]"처럼 오늘 읽는 범위를 맨 앞에 넣어 시작함
function dayNoteBase(existing) {
  if (existing && existing.trim()) return existing;
  const pr = progress();
  const day = pr.days[pr.todayDay];
  return day ? `[${describeChapters(day)}]\n\n` : "";
}

// 읽기 화면에 떠 있는 "📋 붙여넣기" 버튼: 패널을 열지 않고 바로 오늘 메모 끝에 붙임
// (갓피아 화면은 다른 사이트라 복사한 순간을 앱이 알 수 없어서, 버튼을 항상 띄워 둔다)
async function quickPasteVerses(target) {
  const text = await readClipboardText();
  if (!text.trim()) {
    showToast("성경 구절을 길게 눌러 복사한 뒤 눌러 주세요");
    return;
  }
  if (PUSH_SERVER) showToast("🔎 구절 찾는 중…");
  const full = await expandToFullVerses(text, target === "qt" ? null : currentChapter);
  if (target === "qt") {
    const quote = full || formatVerses(text, null);
    saveQt({ note: appendQuote((state.qt[qtDate] || {}).note, quote) });
    refreshQtBar();
    if (sheetTab) renderQtSheet();
    showToast("📝 묵상 노트에 붙였어요", { label: "노트 보기", onClick: () => openSheet("note", renderQtSheet) });
    return;
  }
  const quote = full || formatVerses(text, CHAPTERS[currentChapter], state.settings.mode === "two");
  const today = todayStr();
  state.dayNotes[today] = appendQuote(dayNoteBase(state.dayNotes[today]), quote);
  persist();
  if (sheetTab) renderReaderSheet();
  showToast(`📝 ${quote.split("\n")[0]} · 오늘 메모에 붙였어요`, { label: "메모 보기", onClick: () => openSheet("tools", renderReaderSheet) });
}
