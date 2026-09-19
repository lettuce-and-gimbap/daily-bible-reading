// 통독 계획 만들기·바꾸기 화면: 시작 장, 끝 장, 속도(하루 분량 / 마칠 날짜)

function renderSetup(existing) {
  document.body.classList.remove("full");
  const last = TOTAL_CHAPTERS - 1;
  const p = existing || { startIdx: 0, endIdx: last, perDay: 5, startDate: todayStr(), pace: "perDay" };
  const bookOptions = (sel) => BOOKS.map((b) => `<option value="${b.code}" ${b === sel ? "selected" : ""}>${b.name}</option>`).join("");

  app.innerHTML = `
    <section class="card setup">
      <h1>${existing ? "통독 계획 바꾸기" : "통독 계획 만들기"}</h1>
      <p class="muted">어디서 시작해 어디까지, 어떤 속도로 읽을지 정해 주세요.</p>

      <div class="step">
        <span class="step-no">1</span>
        <div class="step-body">
          <h3>어디서 시작할까요?</h3>
          <div class="pick">
            <select id="s-book" aria-label="시작 권">${bookOptions(CHAPTERS[p.startIdx].book)}</select>
            <select id="s-chap" aria-label="시작 장"></select>
          </div>
        </div>
      </div>

      <div class="step">
        <span class="step-no">2</span>
        <div class="step-body">
          <h3>어디까지 읽을까요?</h3>
          <div class="presets" id="e-presets">
            <button data-preset="book">이 권 끝까지</button>
            <button data-preset="ot">구약 끝 (말라기)</button>
            <button data-preset="rev">요한계시록까지</button>
            <button data-preset="whole">성경 전체 1독</button>
          </div>
          <div class="pick">
            <select id="e-book" aria-label="끝 권">${bookOptions(CHAPTERS[p.endIdx].book)}</select>
            <select id="e-chap" aria-label="끝 장"></select>
          </div>
        </div>
      </div>

      <div class="step">
        <span class="step-no">3</span>
        <div class="step-body">
          <h3>어떤 속도로 읽을까요?</h3>
          <div class="seg wide" id="s-pace">
            <button data-pace="perDay" class="${p.pace !== "date" ? "on" : ""}">하루 분량으로 정하기</button>
            <button data-pace="date" class="${p.pace === "date" ? "on" : ""}">마칠 날짜로 정하기</button>
          </div>
          <div class="pace-row">
            <label>시작일 <input id="s-date" type="date" value="${p.startDate}"></label>
            <label id="per-wrap">하루 <input id="s-per" type="number" min="1" max="150" value="${p.perDay}"> 장</label>
            <label id="date-wrap">마칠 날짜 <input id="s-target" type="date" value="${p.targetDate || addDays(p.startDate, 99)}"></label>
          </div>
        </div>
      </div>

      <div class="preview" id="s-preview"></div>
      <div class="actions">
        ${existing ? `<button class="btn ghost" id="s-cancel">취소</button>` : ""}
        <button class="btn primary" id="s-save">${existing ? "계획 바꾸기" : "통독 시작하기"}</button>
      </div>
      ${existing ? `<p class="muted small center">계획을 바꿔도 이미 읽은 장의 기록은 그대로 남아요.</p>` : ""}
    </section>`;

  const sBook = $("#s-book"), sChap = $("#s-chap"), eBook = $("#e-book"), eChap = $("#e-chap");
  let pace = p.pace === "date" ? "date" : "perDay";

  const fillChaps = (bookSel, chapSel, selected) => {
    const b = BOOKS.find((x) => x.code === bookSel.value);
    chapSel.innerHTML = Array.from({ length: b.chapters }, (_, i) =>
      `<option value="${i + 1}" ${i + 1 === selected ? "selected" : ""}>${i + 1}장</option>`).join("");
  };
  const setEnd = (idx) => {
    eBook.value = CHAPTERS[idx].book.code;
    fillChaps(eBook, eChap, CHAPTERS[idx].chap);
  };
  const startIdx = () => chapterIndex(sBook.value, Number(sChap.value));
  const endIdx = () => chapterIndex(eBook.value, Number(eChap.value));
  const presetIdx = {
    book: () => { const b = CHAPTERS[startIdx()].book; return chapterIndex(b.code, b.chapters); },
    ot: () => 928,
    rev: () => last,
    whole: () => (startIdx() === 0 ? last : startIdx() - 1),
  };

  const read = () => {
    const plan = { startIdx: startIdx(), endIdx: endIdx(), startDate: $("#s-date").value || todayStr(), pace };
    const total = planSequence(plan).length;
    if (pace === "date") {
      plan.targetDate = $("#s-target").value || plan.startDate;
      const days = Math.max(1, daysBetween(plan.startDate, plan.targetDate) + 1);
      plan.perDay = Math.max(1, Math.ceil(total / days));
    } else {
      plan.perDay = Math.min(150, Math.max(1, Number($("#s-per").value) || 5));
    }
    return plan;
  };

  const update = () => {
    const plan = read();
    const seq = planSequence(plan);
    const days = planDays(plan);
    app.querySelectorAll("#s-pace button").forEach((b) => b.classList.toggle("on", b.dataset.pace === pace));
    $("#per-wrap").hidden = pace !== "perDay";
    $("#date-wrap").hidden = pace !== "date";
    app.querySelectorAll("#e-presets button").forEach((b) =>
      b.classList.toggle("on", presetIdx[b.dataset.preset]() === plan.endIdx));
    const wraps = plan.endIdx < plan.startIdx;
    const badDate = pace === "date" && plan.targetDate < plan.startDate;
    $("#s-preview").innerHTML = `
      <div class="route"><b>${esc(chapLabel(plan.startIdx))}</b><span>→</span><b>${esc(chapLabel(plan.endIdx))}</b></div>
      <div class="preview-grid">
        <div><strong>${seq.length}</strong><span>장</span></div>
        <div><strong>${plan.perDay}</strong><span>장 / 하루</span></div>
        <div><strong>${days.length}</strong><span>일</span></div>
      </div>
      <p>${prettyDate(plan.startDate)} 시작 → <b>${prettyDate(addDays(plan.startDate, days.length - 1))}</b>에 마쳐요.</p>
      ${wraps ? `<p class="muted small">요한계시록 22장 다음에 창세기 1장으로 이어서 읽어요.</p>` : ""}
      ${badDate ? `<p class="warn-text small">마칠 날짜가 시작일보다 앞이에요.</p>` : ""}`;
    $("#s-save").disabled = badDate;
  };

  fillChaps(sBook, sChap, CHAPTERS[p.startIdx].chap);
  fillChaps(eBook, eChap, CHAPTERS[p.endIdx].chap);
  sBook.addEventListener("change", () => { fillChaps(sBook, sChap, 1); update(); });
  eBook.addEventListener("change", () => { fillChaps(eBook, eChap, BOOKS.find((b) => b.code === eBook.value).chapters); update(); });
  app.querySelectorAll(".setup select, .setup input").forEach((el) => el.addEventListener("input", update));
  $("#e-presets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-preset]");
    if (!b) return;
    setEnd(presetIdx[b.dataset.preset]());
    update();
  });
  $("#s-pace").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pace]");
    if (!b) return;
    pace = b.dataset.pace;
    update();
  });
  update();

  const cancel = $("#s-cancel");
  if (cancel) cancel.addEventListener("click", route);
  $("#s-save").addEventListener("click", () => {
    state.plan = read();
    viewingDay = null;
    currentChapter = null;
    persist();
    if (location.hash === "#today" || !location.hash) route();
    else location.hash = "#today";
  });
}
