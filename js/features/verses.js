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

// ── 일부만 복사해도 온전한 절로 ──
// 갓피아 장 본문을 서버(worker/의 /bible)로 받아, 복사한 글이 본문의 어디에 있는지 찾고
// 걸친 절을 통째로 돌려줌. 예) " 행하지 아니하리라↵13그러면 누구나 다 이 일에 관" → 13절(개역) + 13절(새번역) 전체
// 서버가 없거나, 못 찾거나, 여러 곳에 똑같이 나오면 null → 복사한 그대로 붙임
const chapterVerseCache = {};

async function chapterVerses(idx) {
  const qs = readerUrl(idx).split("?")[1]; // 지금 보기 설정(역본·두권)과 같은 본문
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
  const lines = text.replace(/ /g, " ").split("\n").map((l) => l.trim()).filter(Boolean)
    .filter((l) => !/^\S+ \d{1,3}장$/.test(l));
  const whole = squash(lines.join(""));
  if (!whole) return null;

  let from = stream.indexOf(whole), to;
  if (from >= 0) {
    if (stream.indexOf(whole, from + 1) >= 0) return null; // 같은 글이 여러 곳 → 어느 절인지 모름
    to = from + whole.length;
  } else {
    // 통째로 안 맞으면(다른 글자가 섞여 복사된 경우) 줄마다 차례로 찾아 처음~끝을 잡음
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

// 지금 장에서 먼저 찾고, 갓피아 안에서 옆으로 넘겨 읽는 중일 수 있어 앞뒤 장도 찾아봄
async function expandToFullVerses(text) {
  if (!PUSH_SERVER || currentChapter === null) return null;
  for (const d of [0, 1, -1, 2, -2]) {
    const idx = currentChapter + d;
    if (idx < 0 || idx >= TOTAL_CHAPTERS) continue;
    let verses;
    try {
      verses = await chapterVerses(idx);
    } catch (e) {
      return null; // 서버·네트워크 문제면 더 찾지 않음
    }
    const hit = findCopiedVerses(verses, text);
    if (hit) return { idx, text: hit.map((v) => `${v.label} ${v.text}`).join("\n") };
  }
  return null;
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
    showToast("갓피아에서 구절을 길게 눌러 복사한 뒤 눌러 주세요");
    return;
  }
  if (target === "qt") {
    const quote = formatVerses(text, null);
    saveQt({ note: appendQuote((state.qt[qtDate] || {}).note, quote) });
    refreshQtBar();
    if (sheetTab) renderQtSheet();
    showToast("📝 묵상 노트에 붙였어요", { label: "노트 보기", onClick: () => openSheet("note", renderQtSheet) });
    return;
  }
  const two = state.settings.mode === "two";
  const full = await expandToFullVerses(text);
  const quote = full ? formatVerses(full.text, CHAPTERS[full.idx], two) : formatVerses(text, CHAPTERS[currentChapter], two);
  const today = todayStr();
  state.dayNotes[today] = appendQuote(dayNoteBase(state.dayNotes[today]), quote);
  persist();
  if (sheetTab) renderReaderSheet();
  showToast(`📝 ${quote.split("\n")[0]} · 오늘 메모에 붙였어요`, { label: "메모 보기", onClick: () => openSheet("tools", renderReaderSheet) });
}
