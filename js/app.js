let state = loadState();

// 갓피아의 로그인 버튼은 top.location을 바꿔 이 앱 탭 전체를 로그인 페이지로 보내 버린다.
// 최상위 이동만 막고 나머지(스크립트, 새 창, 오디오 등)는 허용한다.
const GODPIA_SANDBOX =
  'sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"';

const app = document.getElementById("app");
const $ = (s) => app.querySelector(s);

let currentChapter = null; // 지금 보고 있는 장 (전체 장 일련번호)
let viewingDay = null; // 지금 보고 있는 Day (0부터)
let sheetTab = null; // 열린 패널: "table" | "tools" | "view" | "note" | null
let toastTimer;
let qtDate = todayStr();
let calMonth = todayStr().slice(0, 7); // 현황 달력에 보이는 달 "YYYY-MM"

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function prettyDate(str) {
  const d = parseDate(str);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`;
}

function chapLabel(i) {
  return `${CHAPTERS[i].book.name} ${CHAPTERS[i].chap}장`;
}

function versionName(code) {
  return (VERSIONS.find((v) => v.code === code) || VERSIONS[0]).name;
}

// 설정된 역본으로 해당 장의 갓피아 주소 (원어는 구약/신약에 맞춰 자동 전환)
function readerUrl(idx) {
  const { book, chap } = CHAPTERS[idx];
  const s = state.settings;
  return godpiaReadUrl(book.code, chap, versionFor(s.ver, book), s.mode === "two" ? versionFor(s.ver2, book) : "");
}

function persist() {
  saveState(state);
  queueReminderSync();
}

/* ---------- 계산 ---------- */

function progress() {
  const plan = state.plan;
  const seq = planSequence(plan);
  const days = planDays(plan);
  const readCount = seq.filter((i) => state.read[i]).length;
  let currentDay = days.findIndex((d) => d.some((i) => !state.read[i]));
  const finished = currentDay === -1;
  if (finished) currentDay = days.length - 1;
  const today = todayStr();
  const elapsed = Math.max(0, daysBetween(plan.startDate, today));
  // 어제까지 끝냈어야 하는 Day 수 (오늘 분량은 오늘 안에만 읽으면 밀린 것이 아님)
  const expectedDone = Math.min(days.length, elapsed);
  const doneDays = days.filter((d) => d.every((i) => state.read[i])).length;
  const remainingDays = days.length - doneDays;
  const readToday = seq.filter((i) => state.read[i] === today).length;
  // 오늘 하루 분량을 이미 채웠으면 남은 분량은 내일부터 계산
  const todayQuotaMet = readToday >= plan.perDay;
  // 통독표 날짜 기준으로 오늘 읽을 Day (시작 전이면 Day 1, 계획이 끝났으면 마지막 Day)
  const todayDay = Math.min(days.length - 1, Math.max(0, daysBetween(plan.startDate, today)));
  const dayComplete = (d) => d.every((i) => state.read[i]);
  const behindDays = days.slice(0, todayDay).filter((d) => !dayComplete(d)).length;
  // 알림 기준: 오늘 분량(하루 장 수)을 채웠거나, 통독표상 오늘 Day까지 다 읽었으면 완료
  const dailyDone = finished || todayQuotaMet || (behindDays === 0 && dayComplete(days[todayDay]));
  return {
    seq, days, readCount, total: seq.length, currentDay, finished, readToday, todayDay, behindDays, dailyDone,
    doneDays, diff: doneDays - expectedDone,
    pct: Math.round((readCount / seq.length) * 100),
    plannedEnd: addDays(plan.startDate, days.length - 1),
    projectedEnd: finished ? null : addDays(today, remainingDays - (todayQuotaMet ? 0 : 1)),
  };
}

function readDates() {
  const byDate = {};
  for (const [idx, date] of Object.entries(state.read)) {
    (byDate[date] = byDate[date] || []).push(Number(idx));
  }
  return byDate;
}

function qtDoneDates() {
  return new Set(Object.keys(state.qt).filter((d) => state.qt[d].done));
}

function streak(dateSet) {
  let d = todayStr();
  if (!dateSet.has(d)) d = addDays(d, -1);
  let n = 0;
  while (dateSet.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

// 알림용 오늘 요약: 서버에는 done/paused만, 서비스 워커는 분량·연속 일수로 문구를 채움
function reminderSnapshot() {
  const date = todayStr();
  if (!state.plan) return { date, done: false, paused: true, portion: "", streak: 0 };
  const pr = progress();
  const day = pr.days[pr.behindDays > 0 ? pr.currentDay : pr.todayDay];
  return {
    date,
    done: pr.dailyDone,
    paused: pr.finished,
    portion: describeChapters(day),
    streak: streak(new Set(Object.values(state.read))),
  };
}

/* ---------- 라우팅 ---------- */

function route() {
  const r = (location.hash || "#today").slice(1);
  document.body.classList.remove("full", "sheet-open");
  sheetTab = null;
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.route === r));
  if (r === "stats") renderStats();
  else if (r === "qt") renderQt();
  else renderToday();
  window.scrollTo(0, 0);
  queueReminderSync();
}
window.addEventListener("hashchange", route);

/* ---------- 공통: 패널 · 알림 ---------- */

function sheetShell() {
  return `
    <div class="sheet-backdrop" id="sheet-bg" hidden></div>
    <aside class="sheet" id="sheet" hidden>
      <div class="sheet-grip"></div>
      <div class="sheet-head">
        <div id="sheet-title"></div>
        <button class="icon-btn" id="sheet-close" aria-label="닫기">✕</button>
      </div>
      <div class="sheet-body" id="sheet-body"></div>
    </aside>
    <div class="toast" id="toast" hidden></div>`;
}

function bindSheetChrome(renderFn) {
  $("#sheet-close").addEventListener("click", closeSheet);
  $("#sheet-bg").addEventListener("click", closeSheet);
  $("#sheet-title").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (b) openSheet(b.dataset.tab, renderFn);
  });
}

function openSheet(tab, renderFn) {
  sheetTab = tab;
  $("#sheet").hidden = false;
  $("#sheet-bg").hidden = false;
  document.body.classList.add("sheet-open");
  renderFn();
}

function closeSheet() {
  sheetTab = null;
  if (!$("#sheet")) return;
  $("#sheet").hidden = true;
  $("#sheet-bg").hidden = true;
  document.body.classList.remove("sheet-open");
}

function setSheetTitle(tabs, title) {
  $("#sheet-title").innerHTML = tabs
    ? `<div class="seg">${tabs.map(([k, label]) => `<button data-tab="${k}" class="${k === sheetTab ? "on" : ""}">${label}</button>`).join("")}</div>`
    : `<h2>${title}</h2>`;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sheetTab) closeSheet();
});

function showToast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ---------- 계획 만들기 ---------- */

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

/* ---------- 통독 (갓피아 화면을 꽉 채우는 읽기 모드) ---------- */

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
      <div class="rd-clip"><iframe id="r-frame" class="rd-frame" title="갓피아 성경 본문" ${GODPIA_SANDBOX}></iframe></div>
      <div class="rd-bottom" id="r-bottom"></div>
    </div>
    ${sheetShell()}`;

  bindSheetChrome(renderReaderSheet);
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

/* ---------- 구절 붙여넣기 ---------- */

// 갓피아에서 복사한 구절을 메모 양식으로 바꿈
//   민수기 18:10          ← 첫 줄: 권 장:절 (여러 절이면 18:10-11)
//   10 지극히 거룩하게…   ← 다음 줄부터: 절 번호 + 공백 한 칸 + 구절
// 복사할 때 절 번호와 본문 사이가 붙거나(10지극히), 여러 칸·탭이거나, 줄이 나뉘어도(10↵지극히) 한 칸으로 맞춤
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
  const body = lines.map((l) => {
    const m = l.match(/^(\d{1,3})\s*(?=[^\d\s])(.*)$/);
    if (!m) return l.replace(/\s+/g, " ");
    verses.push(Number(m[1]));
    return `${m[1]} ${m[2].trim().replace(/\s+/g, " ")}`;
  });
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

/* ---------- QT (꽉 찬 화면) ---------- */

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
      <div class="rd-clip"><iframe class="rd-frame" title="갓피아 오늘의 QT" src="${url}" ${GODPIA_SANDBOX}></iframe></div>
      <div class="rd-bottom" id="q-bottom"></div>
    </div>
    ${sheetShell()}`;

  bindSheetChrome(renderQtSheet);

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

/* ---------- 현황 (통독 + QT 한눈에) ---------- */

function ring(pct) {
  const r = 34, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 80 80" aria-hidden="true">
    <circle cx="40" cy="40" r="${r}" class="ring-bg"/>
    <circle cx="40" cy="40" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/>
  </svg>`;
}

function renderStats() {
  const today = todayStr();
  const byDate = readDates();
  const qtDates = qtDoneDates();
  const pr = state.plan ? progress() : null;
  const perDay = state.plan ? state.plan.perDay : 5;
  const thisMonth = today.slice(0, 7);
  const qtMonth = [...qtDates].filter((d) => d.startsWith(thisMonth)).length;
  const todayQt = !!(state.qt[today] && state.qt[today].done);

  const readCard = pr ? `
    <article class="card hero read">
      <header><span class="tag">📖 통독</span><a class="link" href="#today">이어 읽기 ›</a></header>
      <div class="hero-main">
        <div class="ring-wrap">${ring(pr.pct)}<span><b>${pr.pct}</b>%</span></div>
        <div>
          <p class="hero-status">${pr.finished ? "통독을 마쳤어요 🎉" : pr.readToday >= perDay ? "오늘 분량 완료 ✓" : `오늘 <b>${pr.readToday}</b>/${perDay}장`}</p>
          <p class="muted small">${esc(chapLabel(state.plan.startIdx))} → ${esc(chapLabel(state.plan.endIdx))}</p>
          <p class="muted small">${pr.readCount}/${pr.total}장 · Day ${pr.doneDays}/${pr.days.length}</p>
        </div>
      </div>
      <ul class="mini">
        <li><b>${streak(new Set(Object.keys(byDate)))}일</b><span>연속</span></li>
        <li><b class="${pr.diff < 0 ? "warn-text" : ""}">${pr.diff === 0 ? "계획대로" : pr.diff > 0 ? `+${pr.diff}일` : `${pr.diff}일`}</b><span>계획 대비</span></li>
        <li><b>${pr.finished ? "완료" : prettyDate(pr.projectedEnd).replace(/ \(.\)/, "")}</b><span>마칠 예정</span></li>
      </ul>
    </article>` : `
    <article class="card hero read empty">
      <header><span class="tag">📖 통독</span></header>
      <p class="hero-status">아직 통독 계획이 없어요</p>
      <a class="btn primary small" href="#today">계획 만들기</a>
    </article>`;

  const qtCard = `
    <article class="card hero qt">
      <header><span class="tag">🙏 QT</span><a class="link" href="#qt">QT 하기 ›</a></header>
      <div class="hero-main">
        <div class="qt-today ${todayQt ? "done" : ""}">${todayQt
          ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`
          : `<span>🙏</span>`}</div>
        <div>
          <p class="hero-status">${todayQt ? "오늘 QT 완료 ✓" : "오늘 QT를 아직 안 했어요"}</p>
          <p class="muted small">${prettyDate(today)}</p>
        </div>
      </div>
      <ul class="mini">
        <li><b>${streak(qtDates)}일</b><span>연속</span></li>
        <li><b>${qtMonth}일</b><span>이번 달</span></li>
        <li><b>${qtDates.size}일</b><span>누적</span></li>
      </ul>
    </article>`;

  // 달력
  const [cy, cm] = calMonth.split("-").map(Number);
  const firstDay = new Date(cy, cm - 1, 1);
  const daysInMonth = new Date(cy, cm, 0).getDate();
  let cells = "";
  for (let i = 0; i < firstDay.getDay(); i++) cells += `<div class="cell blank"></div>`;
  let monthRead = 0, monthQt = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calMonth}-${String(d).padStart(2, "0")}`;
    const n = (byDate[ds] || []).length;
    const q = qtDates.has(ds);
    if (n) monthRead++;
    if (q) monthQt++;
    const readCls = n === 0 ? "" : n >= perDay ? "full" : "part";
    cells += `<div class="cell ${ds === today ? "today" : ""} ${ds > today ? "future" : ""}" title="${ds}${n ? ` · 통독 ${n}장` : ""}${q ? " · QT 완료" : ""}">
      <span class="d">${d}</span>
      <span class="marks"><i class="m-read ${readCls}"></i><i class="m-qt ${q ? "on" : ""}"></i></span>
    </div>`;
  }

  // 날짜별 기록 (통독 + 메모 + QT)
  const logDates = [...new Set([...Object.keys(byDate), ...Object.keys(state.dayNotes), ...Object.keys(state.qt)])].sort().reverse().slice(0, 40);

  app.innerHTML = `
    <section class="hero-row">${readCard}${qtCard}</section>

    ${reminderCardHtml()}

    <section class="card">
      <div class="cal-head">
        <button class="icon-btn" id="cal-prev" aria-label="이전 달">‹</button>
        <h2>${cy}년 ${cm}월</h2>
        <button class="icon-btn" id="cal-next" aria-label="다음 달" ${calMonth >= thisMonth ? "disabled" : ""}>›</button>
      </div>
      <div class="cal">
        ${WEEK.map((w) => `<div class="wk">${w}</div>`).join("")}
        ${cells}
      </div>
      <div class="cal-foot">
        <span class="legend"><i class="m-read full"></i>통독 완료 <i class="m-read part"></i>일부 <i class="m-qt on"></i>QT</span>
        <span class="muted small">이 달 통독 <b>${monthRead}</b>일 · QT <b>${monthQt}</b>일</span>
      </div>
    </section>

    <section class="card">
      <h2>최근 기록</h2>
      ${logDates.length === 0 ? `<p class="muted">아직 기록이 없어요. 오늘 첫 장을 읽거나 QT를 해 보세요.</p>` : `
      <ul class="timeline">
        ${logDates.map((d) => `
          <li>
            <span class="tl-date">${prettyDate(d)}</span>
            ${byDate[d] ? `<p class="tl-row"><span class="tag sm">📖</span>${esc(describeChapters(byDate[d]))} <span class="muted">(${byDate[d].length}장)</span></p>` : ""}
            ${state.dayNotes[d] ? `<p class="note">${esc(state.dayNotes[d])}</p>` : ""}
            ${state.qt[d] ? `<p class="tl-row"><span class="tag sm qt">🙏</span>${state.qt[d].done ? "QT 완료" : "QT 메모"}</p>` : ""}
            ${state.qt[d] && state.qt[d].note ? `<p class="note qt">${esc(state.qt[d].note)}</p>` : ""}
          </li>`).join("")}
      </ul>`}
    </section>

    ${pr ? `
    <section class="card">
      <details>
        <summary><h2>권별 진행</h2></summary>
        <div class="books">
          ${(() => {
            const inPlan = new Set(pr.seq);
            return BOOKS.map((b) => {
              const start = chapterIndex(b.code, 1);
              let inP = 0, done = 0;
              for (let i = start; i < start + b.chapters; i++) {
                if (inPlan.has(i)) { inP++; if (state.read[i]) done++; }
              }
              if (!inP) return "";
              const p = Math.round((done / inP) * 100);
              return `<div class="book ${p === 100 ? "full" : ""}"><span>${b.name}</span><em>${done}/${inP}</em>
                <div class="bar thin"><span style="width:${p}%"></span></div></div>`;
            }).join("");
          })()}
        </div>
      </details>
    </section>` : ""}

    ${exportCardHtml()}

    <section class="card">
      <h2>계획 · 데이터</h2>
      ${state.plan ? `<p class="muted small">${esc(chapLabel(state.plan.startIdx))} → ${esc(chapLabel(state.plan.endIdx))} · 하루 ${state.plan.perDay}장 · ${prettyDate(state.plan.startDate)} 시작</p>` : ""}
      <div class="inline wrap">
        ${state.plan ? `<button class="btn ghost small" id="st-edit">계획 바꾸기</button>` : ""}
        <button class="btn ghost small" id="st-export">백업 파일 받기</button>
        <label class="btn ghost small">백업 불러오기<input type="file" id="st-import" accept="application/json" hidden></label>
        <button class="btn danger small" id="st-reset">모든 기록 초기화</button>
      </div>
      <p class="muted small">통독 메모·묵상 노트를 포함한 모든 기록은 <b>이 기기의 이 브라우저(또는 홈 화면 앱)</b>에만 저장돼요. 서버나 갓피아 계정으로는 보내지 않아요. 기기를 바꾸기 전에 백업 파일을 받아 두세요.</p>
    </section>`;

  bindReminderCard();
  bindExportCard();

  const shiftMonth = (n) => {
    const d = new Date(cy, cm - 1 + n, 1);
    calMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    renderStats();
  };
  $("#cal-prev").addEventListener("click", () => shiftMonth(-1));
  $("#cal-next").addEventListener("click", () => shiftMonth(1));
  const edit = $("#st-edit");
  if (edit) edit.addEventListener("click", () => renderSetup(state.plan));
  $("#st-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `통독기록-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $("#st-import").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (typeof data !== "object" || !("read" in data)) throw new Error();
      if (!confirm("현재 기록을 백업 파일 내용으로 바꿀까요?")) return;
      state = { ...defaultState(), ...data, plan: normalizePlan(data.plan), settings: normalizeSettings({ ...defaultState().settings, ...(data.settings || {}) }) };
      persist();
      route();
    } catch (err) {
      alert("올바른 백업 파일이 아니에요.");
    }
  });
  $("#st-reset").addEventListener("click", () => {
    if (!confirm("통독 계획과 모든 기록(QT 노트 포함)을 삭제할까요? 되돌릴 수 없어요.")) return;
    state = defaultState();
    persist();
    location.hash = "#today";
    route();
  });
}

route();
