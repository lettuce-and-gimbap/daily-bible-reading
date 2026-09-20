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
//
// 휴대폰에서 길게 눌러 선택하면 절 번호 칸은 빠지고 본문 글자부터 선택되므로, 첫 줄에 번호가 없으면 추정해 붙임:
//   두권 보기 — 다음 번호 n이 한 번만 나오면 첫 줄은 n절의 첫 번째 역본, 두 번 나오면 (n-1)절의 두 번째 역본
//   한권 보기 — 첫 줄은 (n-1)절
function formatVerses(text, chapter, twoVersions = false) {
  const raw = text.replace(/\r/g, "").replace(/ /g, " ").split("\n").map((l) => l.trim()).filter(Boolean)
    .filter((l) => !/^\S+ \d{1,3}장$/.test(l)); // 함께 선택된 "민수기 28장" 같은 제목 줄은 뺌
  const lines = [];
  for (let i = 0; i < raw.length; i++) {
    // 절 번호만 있는 줄은 다음 줄 본문과 합침
    if (/^\d{1,3}$/.test(raw[i]) && raw[i + 1] && !/^\d/.test(raw[i + 1])) {
      lines.push(`${raw[i]} ${raw[i + 1]}`);
      i++;
    } else {
      lines.push(raw[i]);
    }
  }

  const VERSE = /^(\d{1,3})\s*(?=[^\d\s])(.*)$/;
  const nums = lines.map((l) => (l.match(VERSE) || [])[1]).filter(Boolean).map(Number);
  const count = (n) => nums.filter((x) => x === n).length;
  const seen = {}; // 절 번호 → 지금까지 나온 횟수
  let group = 0;

  // 첫 줄에 번호가 없으면 몇 절(몇 번째 역본)인지 추정
  let leadVerse = null;
  if (lines.length && !VERSE.test(lines[0]) && nums.length) {
    const n = nums[0];
    const two = twoVersions || nums.some((x) => count(x) > 1);
    if (two && count(n) === 1) {
      leadVerse = n; // 첫 번째 역본의 n절 → 다음 줄 n은 두 번째 역본
    } else if (two && n > 1) {
      leadVerse = n - 1; // 두 번째 역본의 (n-1)절
      seen[n - 1] = 1;
      group = 1;
    } else if (!two && n > 1) {
      leadVerse = n - 1;
    }
  }

  const verses = [];
  const groups = []; // groups[k] = k번째 역본의 줄들
  const add = (g, line) => (groups[g] = groups[g] || []).push(line);
  lines.forEach((l, i) => {
    const m = i === 0 && leadVerse !== null ? [null, String(leadVerse), l] : l.match(VERSE);
    if (m) {
      const n = Number(m[1]);
      if (!(i === 0 && group === 1)) group = seen[n] = n in seen ? seen[n] + 1 : 0;
      verses.push(n);
      add(group, `${n} ${m[2].trim().replace(/\s+/g, " ")}`);
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
  const chapter = CHAPTERS[currentChapter];
  const quote = formatVerses(text, chapter, state.settings.mode === "two");
  const today = todayStr();
  state.dayNotes[today] = appendQuote(state.dayNotes[today], quote);
  persist();
  if (sheetTab) renderReaderSheet();
  showToast(`📝 ${quote.split("\n")[0]} · 오늘 메모에 붙였어요`, { label: "메모 보기", onClick: () => openSheet("tools", renderReaderSheet) });
}
