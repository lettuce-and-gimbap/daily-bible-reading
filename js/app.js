let state = loadState();

// 갓피아의 로그인 버튼은 top.location을 바꿔 이 앱 탭 전체를 로그인 페이지로 보내 버린다.
// 최상위 이동만 막고 나머지(스크립트, 새 창, 오디오 등)는 허용한다.
const GODPIA_SANDBOX =
  'sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"';
const app = document.getElementById("app");

// 현재 읽고 있는 장 (계획 순서 기준 인덱스가 아니라 전체 장 일련번호)
let currentChapter = null;
let viewingDay = null; // 오늘 통독 화면에서 보고 있는 Day 번호(0부터)

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function persist() {
  saveState(state);
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
  // 오늘 하루 분량을 이미 채웠으면 남은 분량은 내일부터 계산
  const todayQuotaMet = seq.filter((i) => state.read[i] === today).length >= plan.perDay;
  return {
    seq, days, readCount, total: seq.length, currentDay, finished,
    expectedDone, doneDays, diff: doneDays - expectedDone,
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
}
window.addEventListener("hashchange", route);

/* ---------- 계획 만들기 ---------- */

function renderSetup(existing) {
  const p = existing || { startIdx: 0, perDay: 5, startDate: todayStr(), range: "rev" };
  const startBook = CHAPTERS[p.startIdx].book;
  app.innerHTML = `
    <section class="card setup">
      <h1>통독 계획 만들기</h1>
      <p class="muted">시작할 장을 고르면 매일 정해진 분량만큼 나눠 계획을 세워 드립니다.</p>
      <div class="form-grid">
        <label>시작 권
          <select id="s-book">${BOOKS.map((b) => `<option value="${b.code}" ${b === startBook ? "selected" : ""}>${b.name}</option>`).join("")}</select>
        </label>
        <label>시작 장
          <select id="s-chap"></select>
        </label>
        <label>하루 분량 (장)
          <input id="s-per" type="number" min="1" max="30" value="${p.perDay}">
        </label>
        <label>시작일
          <input id="s-date" type="date" value="${p.startDate}">
        </label>
      </div>
      <fieldset class="range">
        <legend>통독 범위</legend>
        <label><input type="radio" name="s-range" value="rev" ${p.range === "rev" ? "checked" : ""}> 시작 장부터 요한계시록 22장까지</label>
        <label><input type="radio" name="s-range" value="full" ${p.range === "full" ? "checked" : ""}> 성경 전체 1독 (끝나면 창세기부터 이어서 시작 장 전까지)</label>
      </fieldset>
      <p class="preview" id="s-preview"></p>
      <div class="actions">
        ${existing ? `<button class="btn ghost" id="s-cancel">취소</button>` : ""}
        <button class="btn primary" id="s-save">${existing ? "계획 변경하기" : "통독 시작하기"}</button>
      </div>
      ${existing ? `<p class="muted small">계획을 바꿔도 이미 읽은 장의 기록은 그대로 유지됩니다.</p>` : ""}
    </section>`;

  const bookSel = app.querySelector("#s-book");
  const chapSel = app.querySelector("#s-chap");
  const fillChaps = (selected) => {
    const b = BOOKS.find((x) => x.code === bookSel.value);
    chapSel.innerHTML = Array.from({ length: b.chapters }, (_, i) =>
      `<option value="${i + 1}" ${i + 1 === selected ? "selected" : ""}>${i + 1}장</option>`).join("");
  };
  const read = () => ({
    startIdx: chapterIndex(bookSel.value, Number(chapSel.value)),
    perDay: Math.min(30, Math.max(1, Number(app.querySelector("#s-per").value) || 5)),
    startDate: app.querySelector("#s-date").value || todayStr(),
    range: app.querySelector("input[name=s-range]:checked").value,
  });
  const preview = () => {
    const plan = read();
    const days = planDays(plan);
    const seq = planSequence(plan);
    const last = CHAPTERS[seq[seq.length - 1]];
    app.querySelector("#s-preview").innerHTML =
      `총 <b>${seq.length}장</b>을 하루 ${plan.perDay}장씩 <b>${days.length}일</b> 동안 읽습니다. ` +
      `마지막 분량은 ${esc(last.book.name)} ${last.chap}장, 예상 완료일은 <b>${addDays(plan.startDate, days.length - 1)}</b>입니다.`;
  };
  fillChaps(CHAPTERS[p.startIdx].chap);
  bookSel.addEventListener("change", () => { fillChaps(1); preview(); });
  app.querySelectorAll("select, input").forEach((el) => el.addEventListener("input", preview));
  preview();

  app.querySelector("#s-save").addEventListener("click", () => {
    state.plan = read();
    viewingDay = null;
    currentChapter = null;
    persist();
    location.hash = "#today";
    route();
  });
  const cancel = app.querySelector("#s-cancel");
  if (cancel) cancel.addEventListener("click", () => { location.hash = "#stats"; });
}

/* ---------- 오늘 통독 (갓피아 화면을 꽉 채우는 읽기 모드) ---------- */

let sheetTab = null; // 열린 패널 탭: "day" | "table" | "stats" | null
let toastTimer;

const $ = (s) => app.querySelector(s);

function versionOptions(selected) {
  return VERSIONS.map((v) => `<option value="${v.code}" ${v.code === selected ? "selected" : ""}>${v.name}</option>`).join("");
}

function sheetShell(tabs) {
  return `
    <div class="sheet-backdrop" id="sheet-bg" hidden></div>
    <aside class="sheet" id="sheet" hidden>
      <div class="sheet-head">
        ${tabs.length > 1
          ? `<div class="seg sheet-tabs">${tabs.map(([k, label]) => `<button data-tab="${k}">${label}</button>`).join("")}</div>`
          : `<h2>${tabs[0][1]}</h2>`}
        <button class="tool" id="sheet-close" aria-label="닫기">✕</button>
      </div>
      <div class="sheet-body" id="sheet-body"></div>
    </aside>
    <div class="toast" id="toast" hidden></div>`;
}

function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

function openSheet(tab) {
  sheetTab = tab;
  $("#sheet").hidden = false;
  $("#sheet-bg").hidden = false;
  document.body.classList.add("sheet-open");
  if (location.hash === "#qt") renderQtSheet();
  else renderReaderSheet();
}

function closeSheet() {
  sheetTab = null;
  const s = $("#sheet");
  if (!s) return;
  s.hidden = true;
  $("#sheet-bg").hidden = true;
  document.body.classList.remove("sheet-open");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sheetTab) closeSheet();
});

function bindSheetChrome() {
  $("#sheet-close").addEventListener("click", closeSheet);
  $("#sheet-bg").addEventListener("click", closeSheet);
  app.querySelectorAll(".sheet-tabs button").forEach((b) =>
    b.addEventListener("click", () => openSheet(b.dataset.tab)));
}

function renderToday() {
  if (!state.plan) return renderSetup();
  document.body.classList.add("full");
  if (!$(".rd.reading")) buildReader();
  refreshReader();
}

function buildReader() {
  sheetTab = null;
  app.innerHTML = `
    <div class="rd reading">
      <div class="rd-bar rd-top">
        <button class="tool labeled" data-open="table">📖<span>통독표</span></button>
        <button class="rd-info" data-open="day" id="r-info" title="오늘 분량 보기"></button>
        <div class="rd-ver">
          <div class="seg" role="group" aria-label="보기 방식">
            <button data-mode="one">한권</button><button data-mode="two">두권</button>
          </div>
          <select id="r-ver" aria-label="역본"></select>
          <select id="r-ver2" aria-label="비교 역본"></select>
        </div>
      </div>
      <iframe id="r-frame" class="rd-frame" title="갓피아 성경 본문" ${GODPIA_SANDBOX}></iframe>
      <div class="rd-bar rd-bottom">
        <button class="tool" id="r-prev" aria-label="이전 장">‹</button>
        <div class="rd-dots" id="r-dots"></div>
        <button class="tool" id="r-next" aria-label="다음 장">›</button>
        <button class="btn primary" id="r-check"></button>
        <button class="tool labeled" data-open="stats">📊<span>현황</span></button>
      </div>
    </div>
    ${sheetShell([["day", "오늘 분량"], ["table", "통독표"], ["stats", "현황"]])}`;

  bindSheetChrome();
  app.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => openSheet(b.dataset.open)));

  app.querySelectorAll(".rd-ver .seg button").forEach((b) =>
    b.addEventListener("click", () => {
      state.settings.mode = b.dataset.mode;
      if (state.settings.mode === "two" && state.settings.ver2 === state.settings.ver) {
        state.settings.ver2 = VERSIONS.find((v) => v.code !== state.settings.ver).code;
      }
      persist();
      refreshReader();
    }));
  $("#r-ver").addEventListener("change", (e) => { state.settings.ver = e.target.value; persist(); refreshReader(); });
  $("#r-ver2").addEventListener("change", (e) => { state.settings.ver2 = e.target.value; persist(); refreshReader(); });

  const move = (delta) => {
    const seq = planSequence(state.plan);
    const pos = seq.indexOf(currentChapter) + delta;
    if (pos < 0 || pos >= seq.length) return;
    currentChapter = seq[pos];
    viewingDay = Math.floor(pos / state.plan.perDay);
    refreshReader();
  };
  $("#r-prev").addEventListener("click", () => move(-1));
  $("#r-next").addEventListener("click", () => move(1));

  $("#r-dots").addEventListener("click", (e) => {
    const b = e.target.closest("[data-idx]");
    if (!b) return;
    currentChapter = Number(b.dataset.idx);
    refreshReader();
  });

  $("#r-check").addEventListener("click", () => {
    const pr = progress();
    const day = pr.days[viewingDay];
    if (state.read[currentChapter]) {
      delete state.read[currentChapter];
    } else {
      state.read[currentChapter] = todayStr();
      const nextUnread = day.find((i) => !state.read[i]);
      if (nextUnread !== undefined) currentChapter = nextUnread;
      else showToast(`🎉 Day ${viewingDay + 1} 분량을 모두 읽었어요!`);
    }
    persist();
    refreshReader();
  });

  // 패널 안의 버튼들 (패널 내용은 다시 그려지므로 위임으로 처리)
  const body = $("#sheet-body");
  body.addEventListener("click", async (e) => {
    const t = e.target.closest("button, [data-day], [data-chap]");
    if (!t) return;
    if (t.dataset.chap !== undefined) {
      const seq = planSequence(state.plan);
      currentChapter = Number(t.dataset.chap);
      viewingDay = Math.floor(seq.indexOf(currentChapter) / state.plan.perDay);
      closeSheet();
      refreshReader();
    } else if (t.dataset.day !== undefined) {
      viewingDay = Number(t.dataset.day);
      currentChapter = null;
      if (sheetTab === "table") closeSheet();
      refreshReader();
    } else if (t.id === "r-upto-btn") {
      const pr = progress();
      const first = pr.seq.findIndex((i) => !state.read[i]);
      const endPos = pr.seq.indexOf(Number($("#r-upto").value));
      const targets = pr.seq.slice(first, endPos + 1).filter((i) => !state.read[i]);
      if (!targets.length || !confirm(`${describeChapters(targets)}을(를) 오늘 읽은 것으로 체크할까요?`)) return;
      targets.forEach((i) => { state.read[i] = todayStr(); });
      persist();
      currentChapter = null;
      viewingDay = null;
      refreshReader();
      showToast(`${targets.length}장을 읽음으로 체크했어요.`);
    } else if (t.id === "d-copy") {
      const day = progress().days[viewingDay];
      const text = `성경 통독 Day ${viewingDay + 1}: ${describeChapters(day)}`;
      try {
        await navigator.clipboard.writeText(text);
        showToast("복사했어요. 투두메이트에 붙여넣어 보세요.");
      } catch (err) {
        prompt("아래 내용을 복사하세요", text);
      }
    }
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

function refreshReader() {
  const pr = progress();
  if (viewingDay === null || viewingDay >= pr.days.length) viewingDay = pr.currentDay;
  const day = pr.days[viewingDay];
  if (currentChapter === null || !day.includes(currentChapter)) {
    currentChapter = day.find((i) => !state.read[i]) ?? day[0];
  }
  const c = CHAPTERS[currentChapter];
  const s = state.settings;
  const url = godpiaReadUrl(c.book.code, c.chap, s.ver, s.mode === "two" ? s.ver2 : "");
  const frame = $("#r-frame");
  if (frame.dataset.url !== url) {
    frame.dataset.url = url;
    frame.src = url;
  }

  const dayDone = day.filter((i) => state.read[i]).length;
  $("#r-info").innerHTML = `
    <small>Day ${viewingDay + 1}/${pr.days.length}${viewingDay === pr.currentDay ? " · 오늘 차례" : ""} · ${esc(describeChapters(day))}</small>
    <b>${esc(c.book.name)} ${c.chap}장</b>
    <span class="mini-bar"><span style="width:${(dayDone / day.length) * 100}%"></span></span>`;

  app.querySelectorAll(".rd-ver .seg button").forEach((b) => b.classList.toggle("on", b.dataset.mode === s.mode));
  $("#r-ver").innerHTML = versionOptions(s.ver);
  $("#r-ver2").innerHTML = versionOptions(s.ver2);
  $("#r-ver2").hidden = s.mode !== "two";

  $("#r-dots").innerHTML = day.map((i) => {
    const ch = CHAPTERS[i];
    return `<button class="dot ${state.read[i] ? "done" : ""} ${i === currentChapter ? "active" : ""}" data-idx="${i}"
      title="${esc(ch.book.name)} ${ch.chap}장${state.read[i] ? " (읽음)" : ""}">${ch.chap}</button>`;
  }).join("");

  const seqPos = pr.seq.indexOf(currentChapter);
  $("#r-prev").disabled = seqPos <= 0;
  $("#r-next").disabled = seqPos >= pr.seq.length - 1;

  const check = $("#r-check");
  const isRead = !!state.read[currentChapter];
  check.innerHTML = isRead ? "읽음 취소" : "✓ 읽었어요";
  check.classList.toggle("ghost", isRead);
  check.classList.toggle("primary", !isRead);

  if (sheetTab) renderReaderSheet();
}

function kpisHtml(pr) {
  const dates = new Set(Object.values(state.read));
  const pct = Math.round((pr.readCount / pr.total) * 100);
  return `
    <div class="kpis">
      <div><b>${pct}%</b><span>진행률</span></div>
      <div><b>${pr.readCount}</b><span>읽은 장 / ${pr.total}</span></div>
      <div><b>${pr.doneDays}</b><span>완료한 Day / ${pr.days.length}</span></div>
      <div><b>${streak(dates)}일</b><span>연속 통독</span></div>
      <div><b class="${pr.diff < 0 ? "warn-text" : ""}">${pr.diff === 0 ? "계획대로" : pr.diff > 0 ? `+${pr.diff}일` : `${pr.diff}일`}</b><span>계획 대비</span></div>
      <div><b>${pr.finished ? "완료" : pr.projectedEnd}</b><span>예상 완료일 (계획 ${pr.plannedEnd})</span></div>
    </div>`;
}

function renderReaderSheet() {
  const pr = progress();
  const body = $("#sheet-body");
  app.querySelectorAll(".sheet-tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === sheetTab));

  if (sheetTab === "day") {
    const day = pr.days[viewingDay];
    const first = pr.seq.findIndex((i) => !state.read[i]);
    const uptoOpts = first === -1 ? [] : pr.seq.slice(first, first + state.plan.perDay * 3);
    const c = CHAPTERS[currentChapter];
    const s = state.settings;
    body.innerHTML = `
      <div class="day-head">
        <button class="icon-btn" data-day="${viewingDay - 1}" ${viewingDay === 0 ? "disabled" : ""} aria-label="이전 날">‹</button>
        <div class="day-title">
          <div class="eyebrow">Day ${viewingDay + 1} / ${pr.days.length} · 계획일 ${addDays(state.plan.startDate, viewingDay)}</div>
          <h2>${esc(describeChapters(day))}</h2>
        </div>
        <button class="icon-btn" data-day="${viewingDay + 1}" ${viewingDay === pr.days.length - 1 ? "disabled" : ""} aria-label="다음 날">›</button>
      </div>
      <div class="chips">
        ${day.map((i) => `<button class="chip ${state.read[i] ? "done" : ""} ${i === currentChapter ? "active" : ""}" data-chap="${i}">
          ${state.read[i] ? "✓ " : ""}${esc(CHAPTERS[i].book.name)} ${CHAPTERS[i].chap}장</button>`).join("")}
      </div>
      ${uptoOpts.length ? `
      <div class="catchup">
        <span class="muted small">갓피아에서 옆으로 넘기며 읽었다면</span>
        <select id="r-upto">${uptoOpts.map((i) => `<option value="${i}" ${i === currentChapter ? "selected" : ""}>${esc(CHAPTERS[i].book.name)} ${CHAPTERS[i].chap}장</option>`).join("")}</select>
        <button class="btn ghost small" id="r-upto-btn">까지 한 번에 체크</button>
      </div>` : ""}
      <div class="actions left">
        <button class="btn ghost small" id="d-copy">📋 오늘 분량 복사</button>
        <a class="btn ghost small" target="_blank" rel="noopener"
          href="${godpiaReadUrl(c.book.code, c.chap, s.ver, s.mode === "two" ? s.ver2 : "")}">갓피아 새 창으로 열기 ↗</a>
      </div>
      <h2 class="sheet-sub">오늘의 통독 메모</h2>
      <textarea id="d-note" rows="4" placeholder="마음에 남은 말씀이나 기도제목을 적어 보세요.">${esc(state.dayNotes[todayStr()] || "")}</textarea>
      <p class="muted small" id="d-note-status">입력하면 자동 저장됩니다.</p>
      <p class="muted small">갓피아 로그인(메모·형광펜 등)은 새 창으로 열어서 이용해 주세요.</p>`;
  } else if (sheetTab === "table") {
    body.innerHTML = `
      <p class="muted small">Day를 누르면 그날 분량으로 이동합니다. 하루 ${state.plan.perDay}장 · ${state.plan.startDate} 시작</p>
      <div class="ttable">
        ${pr.days.map((d, n) => {
          const done = d.filter((i) => state.read[i]).length;
          const cls = [done === d.length ? "done" : done ? "part" : "", n === viewingDay ? "viewing" : "", n === pr.currentDay ? "current" : ""].join(" ");
          return `<button class="trow ${cls}" data-day="${n}">
            <span class="t-day">Day ${n + 1}</span>
            <span class="t-date">${addDays(state.plan.startDate, n).slice(5).replace("-", "/")}</span>
            <span class="t-range">${esc(describeChapters(d))}</span>
            <span class="t-st">${done === d.length ? "✓" : done ? `${done}/${d.length}` : n === pr.currentDay ? "오늘" : ""}</span>
          </button>`;
        }).join("")}
      </div>`;
    const row = body.querySelector(".trow.viewing");
    if (row) row.scrollIntoView({ block: "center" });
  } else if (sheetTab === "stats") {
    const pct = Math.round((pr.readCount / pr.total) * 100);
    body.innerHTML = `
      <p class="muted small">${esc(describeChapters([pr.seq[0]]))}부터 ${state.plan.range === "full" ? "성경 전체 1독" : "요한계시록까지"} · 하루 ${state.plan.perDay}장</p>
      <div class="bar big"><span style="width:${pct}%"></span></div>
      ${kpisHtml(pr)}
      <div class="actions left">
        <a class="btn primary small" href="#stats">달력 · 권별 진행 · 기록 전체 보기</a>
      </div>`;
  }
}

/* ---------- 현황·기록 ---------- */

function renderStats() {
  if (!state.plan) return renderSetup();
  const pr = progress();
  const byDate = readDates();
  const dates = new Set(Object.keys(byDate));
  const pct = Math.round((pr.readCount / pr.total) * 100);
  const inPlan = new Set(pr.seq);

  // 최근 20주 달력 (일요일 시작)
  const today = parseDate(todayStr());
  const gridStart = new Date(today);
  gridStart.setDate(gridStart.getDate() - today.getDay() - 7 * 19);
  const cells = [];
  for (let d = new Date(gridStart); d <= today; d.setDate(d.getDate() + 1)) {
    const ds = todayStr(d);
    const n = (byDate[ds] || []).length;
    const lvl = n === 0 ? 0 : n < state.plan.perDay ? 1 : n < state.plan.perDay * 2 ? 2 : 3;
    cells.push(`<i class="l${lvl}" title="${ds} · ${n}장"></i>`);
  }

  const logDates = [...new Set([...dates, ...Object.keys(state.dayNotes)])].sort().reverse();

  app.innerHTML = `
    <section class="card">
      <div class="stats-head">
        <h1>나의 통독 현황</h1>
        <button class="btn ghost small" id="st-edit">계획 변경</button>
      </div>
      <p class="muted">${esc(describeChapters([pr.seq[0]]))}부터 ${state.plan.range === "full" ? "성경 전체 1독" : "요한계시록까지"} ·
        하루 ${state.plan.perDay}장 · ${state.plan.startDate} 시작</p>
      <div class="bar big"><span style="width:${pct}%"></span></div>
      ${kpisHtml(pr)}
    </section>

    <section class="card">
      <h2>통독 달력 <span class="muted small">최근 20주</span></h2>
      <div class="heat">${cells.join("")}</div>
      <div class="legend muted small">적음 <i class="l1"></i><i class="l2"></i><i class="l3"></i> 많음</div>
    </section>

    <section class="card">
      <h2>권별 진행</h2>
      <div class="books">
        ${BOOKS.map((b) => {
          const start = chapterIndex(b.code, 1);
          let inP = 0, done = 0;
          for (let i = start; i < start + b.chapters; i++) {
            if (inPlan.has(i)) { inP++; if (state.read[i]) done++; }
          }
          if (!inP) return "";
          const p = Math.round((done / inP) * 100);
          return `<div class="book ${p === 100 ? "full" : ""}" title="${b.name} ${done}/${inP}장">
            <span>${b.name}</span><em>${done}/${inP}</em><div class="bar thin"><span style="width:${p}%"></span></div></div>`;
        }).join("")}
      </div>
    </section>

    <section class="card">
      <h2>날짜별 기록</h2>
      ${logDates.length === 0 ? `<p class="muted">아직 기록이 없습니다. <a href="#today">오늘 통독</a>에서 첫 장을 읽어 보세요.</p>` : `
      <ul class="log">
        ${logDates.map((d) => `
          <li>
            <div class="log-date">${d}<span>${(byDate[d] || []).length}장</span></div>
            <div>
              ${byDate[d] ? `<div>${esc(describeChapters(byDate[d]))}</div>` : ""}
              ${state.dayNotes[d] ? `<blockquote>${esc(state.dayNotes[d])}</blockquote>` : ""}
            </div>
          </li>`).join("")}
      </ul>`}
    </section>

    <section class="card">
      <h2>백업 · 초기화</h2>
      <p class="muted small">기록은 이 기기의 브라우저에만 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우기 전에 백업 파일을 받아 두세요.</p>
      <div class="actions left">
        <button class="btn ghost small" id="st-export">백업 파일 받기</button>
        <label class="btn ghost small">백업 파일 불러오기<input type="file" id="st-import" accept="application/json" hidden></label>
        <button class="btn danger small" id="st-reset">모든 기록 초기화</button>
      </div>
    </section>`;

  app.querySelector("#st-edit").addEventListener("click", () => renderSetup(state.plan));
  app.querySelector("#st-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `통독기록-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  app.querySelector("#st-import").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (typeof data !== "object" || !("read" in data)) throw new Error();
      if (!confirm("현재 기록을 백업 파일 내용으로 바꿀까요?")) return;
      state = { ...defaultState(), ...data };
      persist();
      route();
    } catch (err) {
      alert("올바른 백업 파일이 아닙니다.");
    }
  });
  app.querySelector("#st-reset").addEventListener("click", () => {
    if (!confirm("통독 계획과 모든 기록(QT 노트 포함)을 삭제할까요? 되돌릴 수 없습니다.")) return;
    state = defaultState();
    persist();
    location.hash = "#today";
    route();
  });
}

/* ---------- 오늘의 QT (꽉 찬 화면) ---------- */

let qtDate = todayStr();

function renderQt() {
  document.body.classList.add("full");
  sheetTab = null;
  const url = godpiaQtUrl(qtDate);
  const isToday = qtDate === todayStr();

  app.innerHTML = `
    <div class="rd qt">
      <div class="rd-bar rd-top">
        <button class="tool" id="q-prev" aria-label="전날">‹</button>
        <div class="qt-date">
          <input type="date" id="q-date" value="${qtDate}" max="${todayStr()}" aria-label="QT 날짜">
          ${isToday ? `<span class="pill good">오늘</span>` : `<button class="btn ghost small" id="q-today">오늘로</button>`}
        </div>
        <button class="tool" id="q-next" ${isToday ? "disabled" : ""} aria-label="다음날">›</button>
        <a class="tool labeled push" href="${url}" target="_blank" rel="noopener">↗<span>새 창</span></a>
      </div>
      <iframe class="rd-frame" title="갓피아 오늘의 QT" src="${url}" ${GODPIA_SANDBOX}></iframe>
      <div class="rd-bar rd-bottom">
        <button class="tool labeled" data-open="note">📝<span>묵상 노트</span></button>
        <span class="muted small qt-streak" id="q-streak"></span>
        <button class="btn primary push" id="q-done"></button>
      </div>
    </div>
    ${sheetShell([["note", "묵상 노트 · QT 기록"]])}`;

  bindSheetChrome();
  $("[data-open=note]").addEventListener("click", () => openSheet("note"));

  const setDate = (d) => { qtDate = d > todayStr() ? todayStr() : d; renderQt(); };
  $("#q-prev").addEventListener("click", () => setDate(addDays(qtDate, -1)));
  $("#q-next").addEventListener("click", () => setDate(addDays(qtDate, 1)));
  $("#q-date").addEventListener("change", (e) => e.target.value && setDate(e.target.value));
  const todayBtn = $("#q-today");
  if (todayBtn) todayBtn.addEventListener("click", () => setDate(todayStr()));

  $("#q-done").addEventListener("click", () => {
    const entry = state.qt[qtDate] || { done: false, note: "" };
    saveQt({ done: !entry.done });
    refreshQtBar();
    if (!entry.done) showToast("오늘의 QT 완료! 🙏");
  });

  const body = $("#sheet-body");
  body.addEventListener("click", (e) => {
    const a = e.target.closest("[data-qt]");
    if (!a) return;
    e.preventDefault();
    closeSheet();
    setDate(a.dataset.qt);
  });
  let t;
  body.addEventListener("input", (e) => {
    if (e.target.id !== "q-note") return;
    clearTimeout(t);
    t = setTimeout(() => {
      saveQt({ note: e.target.value });
      const st = $("#q-status");
      if (st) st.textContent = "저장됨 ✓";
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
  const entry = state.qt[qtDate] || { done: false };
  const doneDates = new Set(Object.keys(state.qt).filter((d) => state.qt[d].done));
  const btn = $("#q-done");
  btn.textContent = entry.done ? "✓ QT 완료 (취소)" : "QT 완료 체크";
  btn.classList.toggle("ghost", entry.done);
  btn.classList.toggle("primary", !entry.done);
  $("#q-streak").textContent = `연속 ${streak(doneDates)}일 · 누적 ${doneDates.size}일`;
}

function renderQtSheet() {
  const entry = state.qt[qtDate] || { done: false, note: "" };
  const history = Object.keys(state.qt).filter((d) => state.qt[d].done || state.qt[d].note).sort().reverse().slice(0, 30);
  $("#sheet-body").innerHTML = `
    <h2 class="sheet-sub">${qtDate} 묵상 노트</h2>
    <textarea id="q-note" rows="7" placeholder="관찰 · 느낌 · 적용 · 기도를 적어 보세요.">${esc(entry.note)}</textarea>
    <p class="muted small" id="q-status">입력하면 자동 저장됩니다.</p>
    ${history.length ? `
      <h2 class="sheet-sub">최근 QT 기록</h2>
      <ul class="log">
        ${history.map((d) => `
          <li>
            <div class="log-date"><a href="#qt" data-qt="${d}">${d}</a><span>${state.qt[d].done ? "완료" : "메모"}</span></div>
            <div>${state.qt[d].note ? `<blockquote>${esc(state.qt[d].note)}</blockquote>` : `<span class="muted">메모 없음</span>`}</div>
          </li>`).join("")}
      </ul>` : ""}`;
}

route();
