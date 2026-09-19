// QT 화면: 갓피아 "날마다 솟는 샘물"을 꽉 채워 띄우고, 날짜 이동·QT 완료·묵상 노트

let qtDate = todayStr();

function renderQt() {
  document.body.classList.add("full");
  const url = godpiaQtUrl(qtDate);
  const isToday = qtDate === todayStr();

  app.innerHTML = `
    <div class="rd qt">
      <div class="rd-top">
        <div class="rd-row">
          <button class="icon-btn" id="q-prev" aria-label="전날">‹</button>
          <label class="rd-title qt-title">
            <small>날마다 솟는 샘물 ${isToday ? `<em class="badge">오늘</em>` : ""}</small>
            <b>${prettyDate(qtDate)}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></b>
            <input type="date" id="q-date" value="${qtDate}" max="${todayStr()}" aria-label="QT 날짜 고르기">
          </label>
          <button class="icon-btn" id="q-next" ${isToday ? "disabled" : ""} aria-label="다음날">›</button>
          ${isToday ? "" : `<button class="chip-btn" id="q-today">오늘</button>`}
          <a class="chip-btn" href="${url}" target="_blank" rel="noopener" aria-label="갓피아 새 창으로 열기">↗</a>
        </div>
      </div>
      <div class="rd-clip"><iframe class="rd-frame" title="갓피아 오늘의 QT" src="${url}" ${GODPIA_SANDBOX}></iframe>${pasteFabHtml()}</div>
      <div class="rd-bottom" id="q-bottom"></div>
    </div>
    ${sheetShell()}`;

  bindSheetChrome(renderQtSheet);
  $("#paste-fab").addEventListener("click", () => quickPasteVerses("qt"));

  const setDate = (d) => { qtDate = d > todayStr() ? todayStr() : d; renderQt(); };
  $("#q-prev").addEventListener("click", () => setDate(addDays(qtDate, -1)));
  $("#q-next").addEventListener("click", () => setDate(addDays(qtDate, 1)));
  $("#q-date").addEventListener("change", (e) => e.target.value && setDate(e.target.value));
  $("#q-date").addEventListener("click", (e) => { try { e.target.showPicker(); } catch (err) { /* 지원 안 하면 기본 동작 */ } });
  const todayBtn = $("#q-today");
  if (todayBtn) todayBtn.addEventListener("click", () => setDate(todayStr()));

  $("#q-bottom").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "q-note") return openSheet("note", renderQtSheet);
    if (b.id === "q-done") {
      const wasDone = !!(state.qt[qtDate] && state.qt[qtDate].done);
      saveQt({ done: !wasDone });
      if (!wasDone) showToast("QT 완료! 오늘도 말씀과 함께 🙏");
      refreshQtBar();
    }
  });

  const body = $("#sheet-body");
  body.addEventListener("click", (e) => {
    if (e.target.closest("#q-paste")) return pasteVerses($("#q-note-text"), null);
    const a = e.target.closest("[data-qt]");
    if (!a) return;
    e.preventDefault();
    closeSheet();
    setDate(a.dataset.qt);
  });
  let t;
  body.addEventListener("input", (e) => {
    if (e.target.id !== "q-note-text") return;
    clearTimeout(t);
    t = setTimeout(() => {
      saveQt({ note: e.target.value });
      const st = $("#q-status");
      if (st) st.textContent = "저장됨 ✓";
      refreshQtBar();
    }, 400);
  });

  refreshQtBar();
}

function saveQt(patch) {
  const next = { ...(state.qt[qtDate] || { done: false, note: "" }), ...patch };
  if (!next.done && !next.note.trim()) delete state.qt[qtDate];
  else state.qt[qtDate] = next;
  persist();
}

function refreshQtBar() {
  const entry = state.qt[qtDate] || { done: false, note: "" };
  const s = streak(qtDoneDates());
  $("#q-bottom").innerHTML = `
    <button class="chip-btn tall" id="q-note">📝 묵상 노트${entry.note.trim() ? `<i class="dot-mark"></i>` : ""}</button>
    <div class="rd-main">
      ${entry.done
        ? `<button class="btn soft big" id="q-done">✓ QT 완료 · 취소하기</button>`
        : `<button class="btn primary big" id="q-done">🙏 QT 완료하기</button>`}
    </div>
    <span class="streak" title="QT 연속 일수">🔥 <b>${s}</b>일</span>`;
}

function renderQtSheet() {
  setSheetTitle(null, "묵상 노트");
  const entry = state.qt[qtDate] || { done: false, note: "" };
  const history = Object.keys(state.qt).filter((d) => d !== qtDate && (state.qt[d].done || state.qt[d].note)).sort().reverse().slice(0, 20);
  $("#sheet-body").innerHTML = `
    <section class="tool-card">
      <h3 class="label">${prettyDate(qtDate)}</h3>
      <textarea id="q-note-text" rows="8" placeholder="관찰 · 느낌 · 적용 · 기도를 적어 보세요.">${esc(entry.note)}</textarea>
      <div class="inline between">
        <button class="btn soft small" id="q-paste">📋 복사한 구절 붙여넣기</button>
        <span class="muted small" id="q-status">자동 저장돼요</span>
      </div>
      <p class="muted small hint">QT 본문을 <b>길게 눌러 선택 → 복사</b>한 뒤 버튼을 누르면 인용으로 넣어 드려요.
        노트는 이 기기에 저장되고, <a href="#stats">현황 → 기록 내보내기</a>에서 엑셀·텍스트로 받을 수 있어요.</p>
    </section>
    ${history.length ? `
      <h3 class="label">지난 QT</h3>
      <ul class="timeline">
        ${history.map((d) => `
          <li>
            <a href="#qt" data-qt="${d}" class="tl-date">${prettyDate(d)}</a>
            ${state.qt[d].done ? `<span class="badge good">완료</span>` : ""}
            ${state.qt[d].note ? `<p class="note">${esc(state.qt[d].note)}</p>` : ""}
          </li>`).join("")}
      </ul>` : ""}`;
}
