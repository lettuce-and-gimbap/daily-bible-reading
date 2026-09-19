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
function formatVerses(text, chapter) {
  const raw = text.replace(/\r/g, "").replace(/ /g, " ").split("\n").map((l) => l.trim()).filter(Boolean);
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
  const verses = [];
  const groups = []; // groups[k] = k번째 역본의 줄들
  const seen = {}; // 절 번호 → 지금까지 나온 횟수
  let group = 0;
  for (const l of lines) {
    const m = l.match(/^(\d{1,3})\s*(?=[^\d\s])(.*)$/);
    if (m) {
      const n = Number(m[1]);
      group = seen[n] = n in seen ? seen[n] + 1 : 0;
      verses.push(n);
      (groups[group] = groups[group] || []).push(`${n} ${m[2].trim().replace(/\s+/g, " ")}`);
    } else {
      (groups[group] = groups[group] || []).push(l.replace(/\s+/g, " "));
    }
  }
  const body = groups.filter(Boolean).flat();
  if (!chapter) return body.join("\n");
  const lo = Math.min(...verses), hi = Math.max(...verses);
  const ref = verses.length
    ? `${chapter.book.name} ${chapter.chap}:${lo === hi ? lo : `${lo}-${hi}`}`
    : `${chapter.book.name} ${chapter.chap}장`;
  return `${ref}\n${body.join("\n")}`;
}

async function pasteVerses(textarea, chapter) {
  if (!textarea) return;
  let text = "";
  try {
    text = await navigator.clipboard.readText();
  } catch (e) { /* 권한 거부·미지원 */ }
  if (!text.trim()) {
    textarea.focus();
    showToast("구절을 길게 눌러 복사한 뒤 다시 눌러 주세요");
    return;
  }
  const quote = formatVerses(text, chapter);
  const v = textarea.value;
  const at = textarea.selectionStart ?? v.length;
  const before = v.slice(0, at), after = v.slice(at);
  const insert = (before && !before.endsWith("\n") ? "\n" : "") + quote + "\n";
  textarea.value = before + insert + after;
  const pos = (before + insert).length;
  textarea.setSelectionRange(pos, pos);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  showToast("구절을 붙여 넣었어요");
}
