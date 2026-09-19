// 통독 화면: 갓피아 성경을 꽉 채워 띄우고, 장 이동·읽음 체크·통독표·보기 설정·메모 패널을 붙임

let currentChapter = null; // 지금 보고 있는 장 (전체 장 일련번호)
let viewingDay = null; // 지금 보고 있는 Day (0부터)

function renderToday() {
  if (!state.plan) return renderSetup();
  document.body.classList.add("full");
  if (!$(".rd.reading")) buildReader();
  refreshReader();
}

function buildReader() {
  app.innerHTML = `
    <div class="rd reading">
      <div class="rd-top">
        <div class="rd-row">
          <button class="chip-btn" data-open="table" aria-label="통독표 열기">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>통독표
          </button>
          <div class="rd-title" id="r-title"></div>
          <button class="chip-btn" data-open="view" id="r-view" aria-label="역본·보기 설정"></button>
        </div>
        <div class="steps" id="r-steps"></div>
      </div>
      <div class="rd-clip"><iframe id="r-frame" class="rd-frame" title="갓피아 성경 본문" ${GODPIA_SANDBOX}></iframe>${pasteFabHtml()}</div>
      <div class="rd-bottom" id="r-bottom"></div>
    </div>
    ${sheetShell()}`;

  bindSheetChrome(renderReaderSheet);
  $("#paste-fab").addEventListener("click", () => quickPasteVerses("reading"));
  app.querySelectorAll("[data-open]").forEach((b) =>
    b.addEventListener("click", () => openSheet(b.dataset.open, renderReaderSheet)));

  // 장을 직접 고르면 갓피아 안에서 옆으로 넘겨 둔 상태여도 그 장으로 다시 불러옴
  $("#r-steps").addEventListener("click", (e) => {
    const b = e.target.closest("[data-idx]");
    if (b) { currentChapter = Number(b.dataset.idx); refreshReader(true); }
  });
  $("#r-title").addEventListener("click", (e) => {
    if (!e.target.closest("#r-behind")) return;
    const pr = progress();
    viewingDay = pr.currentDay;
    currentChapter = null;
    refreshReader(true);
  });

  $("#r-bottom").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const pr = progress();
    const day = pr.days[viewingDay];
    const pos = pr.seq.indexOf(currentChapter);
    const goTo = (p) => {
      if (p < 0 || p >= pr.seq.length) return;
      currentChapter = pr.seq[p];
      viewingDay = Math.floor(p / state.plan.perDay);
    };
    let reload = true;
    if (b.id === "r-prev") goTo(pos - 1);
    else if (b.id === "r-next") goTo(pos + 1);
    else if (b.id === "r-nextday") { viewingDay = Math.min(viewingDay + 1, pr.days.length - 1); currentChapter = null; }
    else if (b.id === "r-undo") { delete state.read[currentChapter]; reload = false; }
    else if (b.id === "r-check") {
      state.read[currentChapter] = todayStr();
      const nextUnread = day.find((i) => !state.read[i]);
      if (nextUnread !== undefined) currentChapter = nextUnread;
      else { reload = false; showToast(`🎉 Day ${viewingDay + 1} 분량을 모두 읽었어요!`); }
    }
    persist();
    refreshReader(reload);
  });

  // 패널 내용은 다시 그려지므로 위임으로 처리
  const body = $("#sheet-body");
  body.addEventListener("click", async (e) => {
    const t = e.target.closest("button, [data-day], [data-chap]");
    if (!t) return;
    let reload = false;
    if (t.dataset.chap !== undefined) {
      const seq = planSequence(state.plan);
      currentChapter = Number(t.dataset.chap);
      viewingDay = Math.floor(seq.indexOf(currentChapter) / state.plan.perDay);
      closeSheet();
      reload = true;
    } else if (t.dataset.day !== undefined) {
      // 통독표에서 Day를 고르면 그 Day의 (안 읽은 첫) 장으로 갓피아 화면을 옮김
      viewingDay = Number(t.dataset.day);
      currentChapter = null;
      if (sheetTab === "table") closeSheet();
      reload = true;
    } else if (t.id === "d-paste") {
      pasteVerses($("#d-note"), CHAPTERS[currentChapter]);
      return;
    } else if (t.dataset.mode) {
      state.settings.mode = t.dataset.mode;
      if (state.settings.mode === "two" && state.settings.ver2 === state.settings.ver) {
        state.settings.ver2 = VERSIONS.find((v) => v.code !== state.settings.ver).code;
      }
    } else if (t.dataset.ver) {
      state.settings.ver = t.dataset.ver;
      if (state.settings.ver2 === t.dataset.ver) state.settings.ver2 = VERSIONS.find((v) => v.code !== t.dataset.ver).code;
    } else if (t.dataset.ver2) {
      state.settings.ver2 = t.dataset.ver2;
    } else if (t.id === "r-upto-btn") {
      const pr = progress();
      const first = pr.seq.findIndex((i) => !state.read[i]);
      const endPos = pr.seq.indexOf(Number($("#r-upto").value));
      const targets = pr.seq.slice(first, endPos + 1).filter((i) => !state.read[i]);
      if (!targets.length || !confirm(`${describeChapters(targets)}을(를) 오늘 읽은 것으로 체크할까요?`)) return;
      targets.forEach((i) => { state.read[i] = todayStr(); });
      currentChapter = null;
      viewingDay = null;
      showToast(`${targets.length}장을 읽음으로 체크했어요.`);
    } else if (t.id === "d-copy") {
      const text = `성경 통독 Day ${viewingDay + 1}: ${describeChapters(progress().days[viewingDay])}`;
      try {
        await navigator.clipboard.writeText(text);
        showToast("복사했어요. 투두메이트에 붙여넣어 보세요.");
      } catch (err) {
        prompt("아래 내용을 복사하세요", text);
      }
      return;
    } else {
      return;
    }
    persist();
    refreshReader(reload);
  });

  let noteTimer;
  body.addEventListener("input", (e) => {
    if (e.target.id !== "d-note") return;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => {
      if (e.target.value.trim()) state.dayNotes[todayStr()] = e.target.value;
      else delete state.dayNotes[todayStr()];
      persist();
      const st = $("#d-note-status");
      if (st) st.textContent = "저장됨 ✓";
    }, 400);
  });
}

// reload=true면 주소가 같아도 갓피아 화면을 다시 불러옴 (갓피아 안에서 넘겨 둔 장을 되돌림)
function refreshReader(reload = false) {
  const pr = progress();
  // 처음 열면 통독표 날짜 기준 오늘 Day를 보여 줌
  if (viewingDay === null || viewingDay >= pr.days.length) viewingDay = pr.todayDay;
  const day = pr.days[viewingDay];
  if (currentChapter === null || !day.includes(currentChapter)) {
    currentChapter = day.find((i) => !state.read[i]) ?? day[0];
  }
  const c = CHAPTERS[currentChapter];
  const s = state.settings;
  const url = readerUrl(currentChapter);
  const frame = $("#r-frame");
  if (reload || frame.dataset.url !== url) {
    frame.dataset.url = url;
    frame.src = url;
  }

  const dayRead = day.filter((i) => state.read[i]).length;
  const dayDone = dayRead === day.length;
  const isToday = viewingDay === pr.todayDay;
  $("#r-title").innerHTML = `
    <small>Day ${viewingDay + 1} <span class="dim">/ ${pr.days.length}</span>
      ${dayDone ? `<em class="badge good">완료</em>` : isToday ? `<em class="badge">오늘</em>` : ""}
      ${pr.behindDays > 0 && viewingDay !== pr.currentDay
        ? `<button class="badge warn" id="r-behind" title="가장 먼저 밀린 분량으로 이동">${pr.behindDays}일 밀림 ›</button>` : ""}</small>
    <b>${esc(describeChapters(day))}</b>`;

  $("#r-view").innerHTML = `<span>${s.mode === "two" ? `${versionName(s.ver)} · ${versionName(s.ver2)}` : versionName(s.ver)}</span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;

  let prevBook = null;
  $("#r-steps").innerHTML = `
    <div class="steps-track">
      ${day.map((i) => {
        const ch = CHAPTERS[i];
        const showBook = ch.book !== prevBook;
        prevBook = ch.book;
        return `<button class="step-pill ${state.read[i] ? "done" : ""} ${i === currentChapter ? "active" : ""}" data-idx="${i}"
          aria-label="${esc(chapLabel(i))}${state.read[i] ? " 읽음" : ""}">
          ${state.read[i] ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>` : ""}
          ${showBook && day.some((j) => CHAPTERS[j].book !== ch.book) ? `<span class="bk">${esc(ch.book.name)}</span>` : ""}${ch.chap}</button>`;
      }).join("")}
    </div>
    <span class="steps-count"><b>${dayRead}</b>/${day.length}</span>`;

  const pos = pr.seq.indexOf(currentChapter);
  const isRead = !!state.read[currentChapter];
  let main;
  if (!isRead) {
    main = `<button class="btn primary big" id="r-check">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>${c.chap}장 읽었어요</button>`;
  } else if (dayDone && viewingDay < pr.days.length - 1) {
    main = `<button class="btn primary big" id="r-nextday">🎉 완료! 다음 분량 읽기</button>
      <button class="btn text" id="r-undo">취소</button>`;
  } else {
    main = `<button class="btn soft big" id="r-undo">✓ 읽음 · 취소하기</button>`;
  }
  $("#r-bottom").innerHTML = `
    <button class="icon-btn" id="r-prev" ${pos <= 0 ? "disabled" : ""} aria-label="이전 장">‹</button>
    <div class="rd-main">${main}</div>
    <button class="icon-btn" id="r-next" ${pos >= pr.seq.length - 1 ? "disabled" : ""} aria-label="다음 장">›</button>`;

  if (sheetTab) renderReaderSheet();
}

function renderReaderSheet() {
  const pr = progress();
  const body = $("#sheet-body");
  const s = state.settings;

  if (sheetTab === "view") {
    setSheetTitle(null, "보기 설정");
    const chips = (attr, selected, disabled) => VERSIONS.map((v) =>
      `<button class="opt ${v.code === selected ? "on" : ""}" data-${attr}="${v.code}" ${v.code === disabled ? "disabled" : ""}>${v.name}</button>`).join("");
    body.innerHTML = `
      <h3 class="label">보기 방식</h3>
      <div class="opts two">
        <button class="opt big ${s.mode === "one" ? "on" : ""}" data-mode="one"><b>한권 보기</b><span>한 역본만 읽어요</span></button>
        <button class="opt big ${s.mode === "two" ? "on" : ""}" data-mode="two"><b>두권 보기</b><span>두 역본을 나란히 읽어요</span></button>
      </div>
      <h3 class="label">${s.mode === "two" ? "첫 번째 역본" : "역본"}</h3>
      <div class="opts">${chips("ver", s.ver)}</div>
      ${s.mode === "two" ? `<h3 class="label">함께 볼 역본</h3><div class="opts">${chips("ver2", s.ver2, s.ver)}</div>` : ""}`;
    return;
  }

  setSheetTitle([["table", "통독표"], ["tools", "메모 · 도구"]]);

  if (sheetTab === "table") {
    body.innerHTML = `
      <div class="table-sum">
        <div class="bar"><span style="width:${pr.pct}%"></span></div>
        <p><b>${pr.pct}%</b> · ${pr.readCount}/${pr.total}장 · Day ${pr.doneDays}/${pr.days.length} 완료</p>
      </div>
      <div class="ttable">
        ${pr.days.map((d, n) => {
          const done = d.filter((i) => state.read[i]).length;
          const cls = [done === d.length ? "done" : done ? "part" : "", n === viewingDay ? "viewing" : "", n === pr.todayDay ? "current" : "", n < pr.todayDay && done < d.length ? "late" : ""].join(" ");
          const st = done === d.length
            ? `<svg viewBox="0 0 24 24" aria-label="완료"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`
            : done ? `${done}/${d.length}` : n === pr.todayDay ? "오늘" : n < pr.todayDay ? "밀림" : "";
          return `<button class="trow ${cls}" data-day="${n}">
            <span class="t-day">Day ${n + 1}</span>
            <span class="t-range">${esc(describeChapters(d))}<small>${prettyDate(addDays(state.plan.startDate, n))}</small></span>
            <span class="t-st">${st}</span>
          </button>`;
        }).join("")}
      </div>`;
    const row = body.querySelector(".trow.viewing");
    if (row) row.scrollIntoView({ block: "center" });
    return;
  }

  // 메모 · 도구
  const day = pr.days[viewingDay];
  const first = pr.seq.findIndex((i) => !state.read[i]);
  const uptoOpts = first === -1 ? [] : pr.seq.slice(first, first + state.plan.perDay * 3);
  const c = CHAPTERS[currentChapter];
  body.innerHTML = `
    <section class="tool-card">
      <h3 class="label">몰아서 체크</h3>
      ${uptoOpts.length ? `
        <p class="muted small">갓피아 화면에서 옆으로 넘기며 읽었다면, 마지막으로 읽은 장을 골라 주세요.</p>
        <div class="inline">
          <select id="r-upto">${uptoOpts.map((i) => `<option value="${i}" ${i === currentChapter ? "selected" : ""}>${esc(chapLabel(i))}</option>`).join("")}</select>
          <button class="btn primary small" id="r-upto-btn">까지 읽음</button>
        </div>` : `<p class="muted small">모든 장을 읽었어요.</p>`}
    </section>
    <section class="tool-card">
      <h3 class="label">오늘의 통독 메모</h3>
      <textarea id="d-note" rows="5" placeholder="마음에 남은 말씀이나 기도제목을 적어 보세요.">${esc(state.dayNotes[todayStr()] || "")}</textarea>
      <div class="inline between">
        <button class="btn soft small" id="d-paste">📋 복사한 구절 붙여넣기</button>
        <span class="muted small" id="d-note-status">자동 저장돼요</span>
      </div>
      <p class="muted small hint">갓피아 화면에서 구절을 <b>길게 눌러 선택 → 복사</b>한 뒤 위 버튼을 누르면, ${esc(c.book.name)} ${c.chap}장 몇 절인지 붙여서 메모에 넣어 드려요.</p>
    </section>
    <section class="tool-card godpia-card">
      <h3 class="label">갓피아 형광펜 · 메모 · 좋아요</h3>
      <p class="muted small">이 기능은 <b>갓피아 계정</b>에 저장돼서, 앱 안의 갓피아 화면에서는 로그인이 되지 않아 눌러도 반응이 없어요.
        아래 버튼으로 <b>갓피아를 새 창에서 열고 로그인</b>하면 같은 장에서 바로 쓸 수 있어요.</p>
      <a class="btn soft small" target="_blank" rel="noopener" href="${readerUrl(currentChapter)}">✍️ ${esc(chapLabel(currentChapter))} 갓피아에서 열기 ↗</a>
    </section>
    <section class="tool-card">
      <h3 class="label">바로가기</h3>
      <div class="inline wrap">
        <button class="btn ghost small" id="d-copy">📋 Day ${viewingDay + 1} 분량 복사</button>
        <a class="btn ghost small" href="#stats">📥 기록 내보내기</a>
      </div>
      <p class="muted small">이 메모는 이 기기에 저장되고, 현황 → 기록 내보내기에서 엑셀·텍스트로 받을 수 있어요.</p>
    </section>`;
}
