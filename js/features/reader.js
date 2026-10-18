// 통독 화면: 갓피아 성경을 꽉 채워 띄우고, 위 한 줄(장 칸 + 읽음 버튼)로 장 이동·읽음 체크, 통독표·보기 설정·메모 패널을 붙임

let currentChapter = null; // 지금 보고 있는 장 (전체 장 일련번호)
let viewingDay = null; // 지금 보고 있는 Day (0부터)
let freeChapter = null; // 통독 계획 밖의 장을 직접 골라 읽는 중이면 그 장 (권·장 고르기)
let gotoBook = null; // 권·장 고르기 패널에서 고른 권 코드

// tab: "table"이면 통독표 패널을 연 채로 (위 메뉴의 통독표)
function renderToday(tab) {
  if (!state.plan) return renderSetup();
  document.body.classList.add("full");
  if (!$(".rd.reading")) buildReader();
  refreshReader();
  if (tab) openSheet(tab, renderReaderSheet);
  else if ($("#sheet-body .ttable")) closeSheet();
}

// 오늘의 통독 메모 저장 (직접 쓸 때와 구절을 지울 때 함께 씀)
function saveDayNote(value) {
  if (value.trim()) state.dayNotes[todayStr()] = value;
  else delete state.dayNotes[todayStr()];
  persist();
  const st = $("#d-note-status");
  if (st) st.textContent = "저장됨 ✓";
}

function buildReader() {
  sheetTab = null;
  onSheetChange = syncReaderTabs;
  app.innerHTML = `
    <div class="rd reading">
      <div class="rd-top">
        <div class="rd-row">
          <div class="rd-title" id="r-title"></div>
          <div class="steps" id="r-steps"></div>
        </div>
        <div class="rd-nav">
          <div class="seg rd-seg" id="r-tabs">${READER_TABS.map(([k, label]) => `<button data-rtab="${k}">${label}</button>`).join("")}</div>
          <div class="rd-chap" id="r-chap"></div>
        </div>
      </div>
      <div class="rd-clip"><iframe id="r-frame" class="rd-frame" title="갓피아 성경 본문" ${GODPIA_SANDBOX}></iframe>${pasteFabHtml()}${sheetShell()}</div>
    </div>`;

  guardReaderFrame($("#r-frame"));
  bindSheetChrome(renderReaderSheet);
  $("#paste-fab").addEventListener("click", () => quickPasteVerses("reading"));
  // ‹ 사무엘하 3장 › : 통독 순서대로 앞뒤 장 (Day가 바뀌면 따라감). 가운데 장 이름을 누르면 권·장 고르기
  $("#r-chap").addEventListener("click", (e) => {
    if (e.target.closest("#r-goto")) { gotoBook = CHAPTERS[currentChapter].book.code; return openSheet("goto", renderReaderSheet); }
    const b = e.target.closest("[data-step]");
    if (!b) return;
    const pr = progress();
    const step = Number(b.dataset.step);
    if (freeChapter !== null) return goToChapter(currentChapter + step); // 계획 밖에선 성경 순서대로
    const p = pr.seq.indexOf(currentChapter) + step;
    if (p < 0 || p >= pr.seq.length) return;
    goToChapter(pr.seq[p]);
  });
  // 통독표·요약·구절·메모·도구는 화면 위에 늘 보이는 탭으로, 갓피아 원문은 마지막 탭(= 패널을 닫은 상태)으로
  $("#r-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-rtab]");
    if (!b) return;
    if (b.dataset.rtab === "godpia") { rememberTab("reader", "godpia"); closeSheet(); }
    else openSheet(b.dataset.rtab, renderReaderSheet);
  });
  openSheet("verses", renderReaderSheet); // 처음엔 구절 탭

  // 장을 직접 고르면 갓피아 안에서 옆으로 넘겨 둔 상태여도 그 장으로 다시 불러옴
  $("#r-steps").addEventListener("click", (e) => {
    const b = e.target.closest("[data-idx]");
    if (b) { currentChapter = Number(b.dataset.idx); refreshReader(true); openSheet("verses", renderReaderSheet); }
  });
  $("#r-title").addEventListener("click", (e) => {
    if (!e.target.closest("#r-behind")) return;
    const pr = progress();
    viewingDay = pr.currentDay;
    currentChapter = null;
    refreshReader(true);
  });

  // 장 칸 옆 스위치로 읽음 체크(→ 다음 안 읽은 장) · 취소 · 다음 Day
  $("#r-steps").addEventListener("click", (e) => {
    const b = e.target.closest("button[id]");
    if (!b) return;
    const apply = () => {
      const pr = progress();
      const day = pr.days[viewingDay];
      let reload = true;
      if (b.id === "r-nextday") { viewingDay = Math.min(viewingDay + 1, pr.days.length - 1); currentChapter = null; }
      else if (b.id === "r-undo") { delete state.read[currentChapter]; reload = false; }
      else if (b.id === "r-check" && freeChapter !== null) { state.read[currentChapter] = todayStr(); reload = false; }
      else if (b.id === "r-check") {
        state.read[currentChapter] = todayStr();
        const nextUnread = day.find((i) => !state.read[i]);
        if (nextUnread !== undefined) currentChapter = nextUnread;
        else { reload = false; celebrateDay(viewingDay); }
      }
      persist();
      refreshReader(reload);
    };
    if (b.classList.contains("read-switch")) { // 스위치가 옆으로 미끄러지는 모습을 보여 준 뒤 반영
      b.classList.toggle("on");
      b.setAttribute("aria-checked", String(b.classList.contains("on")));
      b.disabled = true;
      setTimeout(apply, 170);
    } else apply();
  });

  // 패널 내용은 다시 그려지므로 위임으로 처리
  const body = $("#sheet-body");
  body.addEventListener("click", async (e) => {
    const t = e.target.closest("button, [data-day], [data-chap]");
    if (!t) return;
    if (t.dataset.sumRefresh) {
      if (!summaryMem[t.dataset.sumRefresh]) { loadSummary(t.dataset.sumRefresh, true); renderReaderSheet(); }
      return;
    }
    if (t.dataset.sumRetry) { delete summaryMem[t.dataset.sumRetry]; renderReaderSheet(); return; }
    let reload = false;
    // 장 고르기 줄을 다시 그려도 옆으로 밀어 둔 자리는 그대로 두기
    const chapRow = t.closest(".rg-chap");
    const chapX = chapRow ? chapRow.scrollLeft : null;
    if (t.dataset.chap !== undefined) {
      currentChapter = Number(t.dataset.chap);
      viewingDay = dayOfChapter(progress().days, currentChapter);
      closeSheet();
      reload = true;
    } else if (t.dataset.day !== undefined) {
      // 통독표에서 Day를 고르면 그 Day의 (안 읽은 첫) 장으로 갓피아 화면을 옮김
      viewingDay = Number(t.dataset.day);
      currentChapter = null;
      if (sheetTab === "table") {
        closeSheet();
        history.replaceState(history.state, "", "#today"); // 위 메뉴 표시도 통독으로
        document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.route === "today"));
      }
      reload = true;
    } else if (t.id === "d-copy-note") {
      copyText($("#d-note").value, "오늘의 통독 메모를 복사했어요");
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
    } else if (t.dataset.gchap !== undefined) { // 관계도: 장별로 보기 (all = 분량 전체)
      state.settings.graphChap = t.dataset.gchap === "all" ? "all" : Number(t.dataset.gchap);
      persist();
      renderReaderSheet();
      const row = document.querySelector(".rg-chap");
      if (row && chapX != null) row.scrollLeft = chapX;
      return;
    } else if (t.dataset.gdetail) { // 관계도: 주요 인물 ↔ 전체 인물
      state.settings.graphAll = t.dataset.gdetail === "all";
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
    noteTimer = setTimeout(() => saveDayNote(e.target.value), 400);
  });
}

// ── 갓피아 안에서 장이 저절로 넘어가는 것 막기 ──
// 갓피아 화면은 다른 사이트라 안쪽의 좌우 스와이프를 직접 끌 수는 없다.
// 대신 앱이 부르지 않은 이동(스와이프로 다음 장, 뒤로 가기 제스처 등)이 일어나면 iframe의 load로 알아채고
// 보던 장으로 곧바로 되돌린다. 상하 스크롤은 페이지 이동이 아니라서 그대로 된다.
let frameLoads = 0;      // 앱이 주소를 넣은 뒤 iframe load가 몇 번 일어났는지 (1번째 = 앱이 부른 것)
let frameLastLoad = 0;   // 직전 load 시각
let frameReverts = 0;    // 지금 장에서 되돌린 횟수 (혹시 모를 무한 되돌리기 방지)
let frameNavFree = false; // 토스트의 '잠시 풀기'를 누르면 다음 장 이동 전까지 갓피아 안 이동 허용

function loadReaderFrame(frame, url, isRevert = false) {
  frameLoads = 0;
  if (!isRevert) { frameReverts = 0; frameNavFree = false; }
  frame.dataset.url = url;
  // 처음엔 src로, 그다음부터는 replace로 넣어 iframe 방문 기록이 쌓이지 않게 함
  // (기록이 쌓이면 화면 가장자리 뒤로 가기 스와이프에 이전 장이 튀어나옴)
  try {
    if (frame.getAttribute("src")) frame.contentWindow.location.replace(url);
    else frame.src = url;
  } catch { frame.src = url; }
}

function guardReaderFrame(frame) {
  frame.addEventListener("load", () => {
    const now = Date.now();
    const sinceLast = now - frameLastLoad;
    frameLastLoad = now;
    frameLoads += 1;
    if (frameLoads === 1 || frameNavFree) return;
    // 갓피아가 열리자마자 스스로 주소를 바꾸는 경우(리디렉트)는 사람이 넘긴 게 아니므로 둠
    if (sinceLast < 1500) return;
    if (frameReverts >= 3) return;
    frameReverts += 1;
    loadReaderFrame(frame, frame.dataset.url, true);
    showToast(`📖 ${chapLabel(currentChapter)}을 끝까지 읽도록 옆 넘기기를 막았어요`, {
      label: "잠시 풀기",
      onClick: () => { frameNavFree = true; },
    });
  });
}

// reload=true면 주소가 같아도 갓피아 화면을 다시 불러옴 (갓피아 안에서 넘겨 둔 장을 되돌림)
function refreshReader(reload = false) {
  const pr = progress();
  // 처음 열면 통독표 날짜 기준 오늘 Day를 보여 줌
  if (viewingDay === null || viewingDay >= pr.days.length) viewingDay = pr.todayDay;
  // 날짜가 바뀌어 Day가 다시 짜였으면 보던 장이 든 Day로 따라감
  else if (freeChapter === null && currentChapter !== null && !pr.days[viewingDay].includes(currentChapter) && pr.seq.includes(currentChapter)) {
    viewingDay = dayOfChapter(pr.days, currentChapter);
  }
  const day = pr.days[viewingDay];
  if (freeChapter !== null && currentChapter !== freeChapter) freeChapter = null; // 다른 데서 장을 옮기면 계획 모드로
  if (freeChapter === null && (currentChapter === null || !day.includes(currentChapter))) {
    currentChapter = day.find((i) => !state.read[i]) ?? day[0];
  }
  const c = CHAPTERS[currentChapter];
  const s = state.settings;
  const url = readerUrl(currentChapter);
  const frame = $("#r-frame");
  if (reload || frame.dataset.url !== url) {
    loadReaderFrame(frame, url);
    prefetchVerses("reading"); // 붙여넣기용 본문 미리 받기
  }

  const dayRead = day.filter((i) => state.read[i]).length;
  const dayDone = dayRead === day.length;
  const isToday = viewingDay === pr.todayDay;
  $("#r-title").innerHTML = `
    <small>Day ${viewingDay + 1} <span class="dim">/ ${pr.days.length}</span>
      ${dayDone ? `<em class="badge good">완료</em>` : isToday ? `<em class="badge">오늘</em>` : ""}
      ${pr.behindDays > 0 && viewingDay !== pr.currentDay
        ? `<button class="badge warn" id="r-behind" title="가장 먼저 밀린 분량으로 이동">${pr.behindDays}일 밀림 ›</button>` : ""}</small>`;
  $("#r-title").title = describeChapters(day);

  const seqPos = pr.seq.indexOf(currentChapter);
  const atStart = freeChapter !== null ? currentChapter <= 0 : seqPos <= 0;
  const atEnd = freeChapter !== null ? currentChapter >= TOTAL_CHAPTERS - 1 : seqPos >= pr.seq.length - 1;
  $("#r-chap").innerHTML = `<button class="chap-arrow" data-step="-1" ${atStart ? "disabled" : ""} aria-label="이전 장">‹</button>
    <button class="chap-name" id="r-goto" aria-label="권·장 골라 이동">${esc(chapLabel(currentChapter))}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
    <button class="chap-arrow" data-step="1" ${atEnd ? "disabled" : ""} aria-label="다음 장">›</button>`;

  const isRead = !!state.read[currentChapter];
  // 읽음 스위치: 안 읽었으면 "읽었어요"(꺼짐), 읽었으면 "더 읽을래요"(켜짐). 누르면 옆으로 미끄러지며 바뀜
  const stepCheck = `${dayDone && viewingDay < pr.days.length - 1 ? `<button class="step-check next" id="r-nextday">다음 ›</button>` : ""}
    <button class="read-switch ${isRead ? "on" : ""}" id="${isRead ? "r-undo" : "r-check"}" role="switch" aria-checked="${isRead}"
      title="${esc(chapLabel(currentChapter))} ${isRead ? "읽음 취소" : "읽음으로 체크하고 다음 장으로"}">
      <span class="rs-label">${isRead ? "더 읽을래요" : "읽었어요"}</span>
      <span class="rs-track" aria-hidden="true"><span class="rs-knob"></span></span>
    </button>`;
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
    ${stepCheck}`;

  if (sheetTab) renderReaderSheet();
}

const READER_TABS = [["summary", "요약"], ["verses", "본문"], ["tools", "메모·도구"], ["godpia", "갓피아"]];

// 열린 탭 표시 (패널이 닫혀 있으면 갓피아 원문)
function syncReaderTabs() {
  document.querySelectorAll("#r-tabs [data-rtab]").forEach((b) => {
    b.classList.toggle("on", b.dataset.rtab === (sheetTab || "godpia"));
  });
}
onSheetChange = syncReaderTabs;

function renderReaderSheet() {
  if (sheetTab === "godpia") return closeSheet();
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

  if (sheetTab === "goto") return renderGotoSheet(body);
  if (sheetTab === "summary") return renderSummaryTab(body, pr.days[viewingDay]);
  setSheetTitle(READER_TABS);
  if (sheetTab === "verses") return mountVersePicker(body, "reading", "reading" + currentChapter, currentChapter);

  if (sheetTab === "table") {
    setSheetTitle(null, "통독표");
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
            <span class="t-range">${esc(describeChapters(d))}<small>${pr.dayDates[n] ? prettyDate(pr.dayDates[n]) : "건너뜀"}</small></span>
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
  body.innerHTML = `
    <section class="tool-card">
      <h3 class="label">오늘의 통독 메모</h3>
      <textarea id="d-note" rows="5" placeholder="마음에 남은 말씀이나 기도제목을 적어 보세요.">${esc(dayNoteBase(state.dayNotes[todayStr()]))}</textarea>
      <div class="inline between">
        <button class="btn soft small" id="d-copy-note">📋 메모 전체 복사</button>
        <span class="muted small" id="d-note-status">자동 저장돼요</span>
      </div>
      <div class="mp" id="d-note-picker"></div>
      <p class="muted small hint">갓피아 화면 위의 <b>📋 붙여넣기</b> 버튼으로 구절을 바로 넣을 수 있어요. 다 쓰면 여기서 <b>메모 전체 복사</b>로 다른 곳에 옮겨 보세요.</p>
    </section>
    <section class="tool-card godpia-card">
      <h3 class="label">갓피아 형광펜 · 메모 · 좋아요</h3>
      <p class="muted small">이 기능은 <b>갓피아 계정</b>에 저장돼서, 앱 안의 갓피아 화면에서는 로그인이 되지 않아 눌러도 반응이 없어요.
        아래 버튼으로 <b>갓피아를 새 창에서 열고 로그인</b>하면 같은 장에서 바로 쓸 수 있어요.</p>
      <a class="btn soft small" target="_blank" rel="noopener" href="${readerUrl(currentChapter)}">✍️ ${esc(chapLabel(currentChapter))} 갓피아에서 열기 ↗</a>
    </section>
`;
  memoPickMount($("#d-note-picker"), $("#d-note"), saveDayNote, renderReaderSheet);
}

// 권·장 골라 이동: 계획 안의 장이면 그 Day로, 밖이면 계획과 따로 그 장만 읽음
function goToChapter(idx) {
  if (idx < 0 || idx >= TOTAL_CHAPTERS) return;
  const pr = progress();
  currentChapter = idx;
  if (pr.seq.includes(idx)) { freeChapter = null; viewingDay = dayOfChapter(pr.days, idx); }
  else freeChapter = idx;
  refreshReader(true);
  openSheet("verses", renderReaderSheet); // 장을 옮기면 늘 본문 탭으로
}

function renderGotoSheet(body) {
  setSheetTitle(null, "권 · 장 고르기");
  const pr = progress();
  const inPlan = new Set(pr.seq);
  const book = BOOKS.find((b) => b.code === gotoBook) || CHAPTERS[currentChapter].book;
  const group = (from, to, label) => `<h3 class="label">${label}</h3><div class="goto-books">${BOOKS.slice(from, to).map((b) =>
    `<button class="${b.code === book.code ? "on" : ""}" data-gbook="${b.code}">${esc(b.name)}</button>`).join("")}</div>`;
  const start = chapterIndex(book.code, 1);
  body.innerHTML = `
    <div class="goto-chaps-wrap">
      <h3 class="label">${esc(book.name)} <span class="muted small">장을 고르세요 · 초록 테두리는 통독 계획 안 · 채운 칸은 읽은 장</span></h3>
      <div class="goto-chaps">${Array.from({ length: book.chapters }, (_, k) => {
        const i = start + k;
        return `<button class="${state.read[i] ? "read" : ""} ${inPlan.has(i) ? "plan" : ""} ${i === currentChapter ? "on" : ""}" data-gchap="${i}">${k + 1}</button>`;
      }).join("")}</div>
    </div>
    ${group(0, 39, "구약")}${group(39, 66, "신약")}`;
  body.onclick = null;
  body.querySelectorAll("[data-gbook]").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation();
    gotoBook = b.dataset.gbook;
    renderGotoSheet(body);
    body.scrollTop = 0;
  }));
  body.querySelectorAll("[data-gchap]").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation();
    closeSheet();
    goToChapter(Number(b.dataset.gchap));
  }));
}
