// QT 관계도: 그날 QT 본문의 절에 해당하는 관계만 통독 요약의 관계도와 같은 그림으로 보여 줌.
// 꾹 누르면 자세히 보는 창이 뜨고, 관계마다 "나의 묵상" 칸에 자세한 설명을 직접 쓸 수 있음 (state.qt[날짜].relNotes)

// "14, 26" "3-4" "1–3" → [[14,14],[26,26]] 같은 절 범위 목록
function parseVerseSpans(str) {
  return String(str || "").split(/[,，]/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = p.match(/^(\d+)(?:\s*[-~–]\s*(\d+))?$/);
    return m ? [Number(m[1]), Number(m[2] || m[1])] : null;
  }).filter(Boolean);
}
const overlapsPassage = (verses, lo, hi) => parseVerseSpans(verses).some(([a, b]) => a <= hi && b >= lo);

async function renderQtRelations() {
  setSheetTitle(null, "관계도");
  const body = $("#sheet-body");
  body.innerHTML = `<p class="muted small">본문 관계를 불러오는 중…</p>`;
  const date = qtDate;
  let d = null;
  try { d = await qtInfo(date); } catch (e) { d = null; }
  if (sheetTab !== "relations" || date !== qtDate) return;
  const ranges = d && d.ref ? qtRanges(d.ref) : [];
  if (!ranges.length) { body.innerHTML = `<p class="muted small">QT 본문을 불러오지 못해서 관계도를 그릴 수 없어요.</p>`; return; }

  const codes = [...new Set(ranges.map((r) => CHAPTERS[r.idx].book.code))];
  codes.forEach((c) => { if (!staticBooks[c]) loadStaticBook(c); });
  if (codes.some((c) => staticBooks[c].status === "loading")) {
    setTimeout(() => { if (sheetTab === "relations" && date === qtDate) renderQtRelations(); }, 350);
    return;
  }
  const books = Object.fromEntries(codes.map((c) => [c, staticBooks[c].data]));

  // 절 범위에 걸리는 관계만 골라 장별 자료처럼 묶음 (composeDay가 관계도를 만듦)
  const chapters = [];
  ranges.forEach((r) => {
    const { book, chap } = CHAPTERS[r.idx];
    const file = staticBooks[book.code];
    const data = file && file.status === "ok" && file.data.chapters[chap];
    if (!data) return;
    const lo = r.lo || 1, hi = r.hi || 999;
    const kept = (data.rels || []).filter((x) => x.verses && overlapsPassage(x.verses, lo, hi));
    const names = new Set(kept.flatMap((x) => [x.from, x.to]));
    chapters.push({
      book, chap,
      data: { type: "story", line: "", story: "", events: [], places: [], renames: [],
        people: (data.people || []).filter((p) => names.has(p.name)), rels: kept },
    });
  });
  const g = chapters.length ? composeDay(chapters, books, { all: true }) : { graphPeople: [], rels: [] };
  const entry = state.qt[date] || {};
  const notes = entry.relNotes || {};
  const keyOf = (r) => `${r.from}|${r.to}|${r.label}`;

  body.innerHTML = `
    <section class="tool-card sum-card">
      <h3 class="label">${esc(d.ref)} 관계도</h3>
      ${g.rels.length
        ? relationGraphHtml(g.graphPeople, g.rels)
        : `<p class="muted small">이 절에는 인물 사이의 관계가 따로 나오지 않아요.</p>`}
    </section>
    ${g.rels.length ? `
    <section class="tool-card sum-card qt-rels">
      <h3 class="label">관계마다 나의 묵상</h3>
      <p class="muted small hint">관계의 구절 풀이를 읽고, 내 생각을 자세히 적어 두세요. 자동 저장돼요.</p>
      ${g.rels.map((r) => `
        <div class="qt-rel">
          <b>${esc(r.from)} ${r.directed ? "→" : "↔"} ${esc(r.to)} <em>${esc(r.label)}</em></b>
          ${(r.notes || []).map((n) => `<small>${esc(n.ref)}</small><p class="qt-rel-note">${esc(n.text)}</p>`).join("")}
          <textarea class="qt-rel-mine" data-rkey="${esc(keyOf(r))}" rows="4" placeholder="이 관계에서 내가 느낀 점을 자세히 적어 보세요">${esc(notes[keyOf(r)] || "")}</textarea>
        </div>`).join("")}
    </section>` : ""}`;

  // 나의 묵상 저장 (입력할 때마다 기록에 반영)
  body.oninput = (e) => {
    const el = e.target.closest && e.target.closest(".qt-rel-mine");
    if (!el) return;
    const cur = (state.qt[qtDate] || {}).relNotes || {};
    saveQt({ relNotes: { ...cur, [el.dataset.rkey]: el.value } });
    qtSaved();
  };
}
