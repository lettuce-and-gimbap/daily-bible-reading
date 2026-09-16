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

/* ---------- 오늘 통독 ---------- */

function renderToday() {
  if (!state.plan) return renderSetup();
  const pr = progress();
  if (viewingDay === null || viewingDay >= pr.days.length) viewingDay = pr.currentDay;
  const day = pr.days[viewingDay];
  if (currentChapter === null || !day.includes(currentChapter)) {
    currentChapter = day.find((i) => !state.read[i]) ?? day[0];
  }
  const dayDone = day.every((i) => state.read[i]);
  const plannedDate = addDays(state.plan.startDate, viewingDay);
  const pct = Math.round((pr.readCount / pr.total) * 100);

  let status;
  if (pr.finished) status = `<span class="pill good">통독 완료!</span>`;
  else if (pr.diff >= 0) status = `<span class="pill good">계획대로 진행 중${pr.diff > 0 ? ` · ${pr.diff}일 앞섬` : ""}</span>`;
  else status = `<span class="pill warn">${-pr.diff}일 분량 밀림</span>`;

  app.innerHTML = `
    <section class="card day-card">
      <div class="day-head">
        <button class="icon-btn" id="d-prev" ${viewingDay === 0 ? "disabled" : ""} aria-label="이전 날 분량">‹</button>
        <div class="day-title">
          <div class="eyebrow">Day ${viewingDay + 1} / ${pr.days.length} · 계획일 ${plannedDate}${viewingDay === pr.currentDay ? " · <b>오늘 읽을 차례</b>" : ""}</div>
          <h1>${esc(describeChapters(day))}</h1>
        </div>
        <button class="icon-btn" id="d-next" ${viewingDay === pr.days.length - 1 ? "disabled" : ""} aria-label="다음 날 분량">›</button>
      </div>
      <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
      <div class="day-meta"><span>전체 ${pr.readCount} / ${pr.total}장 (${pct}%)</span>${status}</div>
      <div class="copy-row"><button class="btn ghost small" id="d-copy" title="투두메이트 같은 할 일 앱에 붙여넣기">📋 오늘 분량 복사</button></div>
      <div class="chips">
        ${day.map((i) => {
          const c = CHAPTERS[i];
          return `<button class="chip ${state.read[i] ? "done" : ""} ${i === currentChapter ? "active" : ""}" data-idx="${i}">
            ${state.read[i] ? "✓ " : ""}${esc(c.book.name)} ${c.chap}장</button>`;
        }).join("")}
      </div>
      ${dayDone ? `<div class="done-banner">🎉 Day ${viewingDay + 1} 분량을 모두 읽었어요.
        ${viewingDay < pr.days.length - 1 ? `<button class="btn small primary" id="d-go-next">다음 분량 보기</button>` : ""}</div>` : ""}
    </section>

    <section class="card reader">
      <div class="reader-bar">
        <div class="seg" role="group" aria-label="보기 방식">
          <button data-mode="one" class="${state.settings.mode === "one" ? "on" : ""}">한권보기</button>
          <button data-mode="two" class="${state.settings.mode === "two" ? "on" : ""}">두권보기</button>
        </div>
        <label class="ver">역본
          <select id="r-ver">${VERSIONS.map((v) => `<option value="${v.code}" ${v.code === state.settings.ver ? "selected" : ""}>${v.name}</option>`).join("")}</select>
        </label>
        <label class="ver ${state.settings.mode === "two" ? "" : "hidden"}" id="r-ver2-wrap">비교
          <select id="r-ver2">${VERSIONS.map((v) => `<option value="${v.code}" ${v.code === state.settings.ver2 ? "selected" : ""}>${v.name}</option>`).join("")}</select>
        </label>
      </div>
      <div class="reader-nav">
        <button class="btn ghost small" id="r-prev">‹ 이전 장</button>
        <strong id="r-title"></strong>
        <button class="btn ghost small" id="r-next">다음 장 ›</button>
      </div>
      <div class="frame-wrap"><iframe id="r-frame" title="갓피아 성경 본문" ${GODPIA_SANDBOX}></iframe></div>
      <div class="reader-foot">
        <a class="btn ghost small" id="r-open" target="_blank" rel="noopener">갓피아에서 새 창으로 열기 ↗</a>
        <button class="btn primary" id="r-check"></button>
      </div>
      <div class="catchup">
        <span class="muted small">갓피아 안에서 옆으로 넘기며 읽었다면</span>
        <select id="r-upto"></select>
        <button class="btn ghost small" id="r-upto-btn">까지 한 번에 읽음 체크</button>
      </div>
      <p class="muted small login-note">갓피아 로그인(메모·형광펜 등)은 <b>갓피아에서 새 창으로 열기</b>로 이용해 주세요.</p>
    </section>

    <section class="card">
      <h2>오늘의 통독 메모</h2>
      <textarea id="d-note" rows="3" placeholder="마음에 남은 말씀이나 기도제목을 적어 보세요.">${esc(state.dayNotes[todayStr()] || "")}</textarea>
      <p class="muted small" id="d-note-status">입력하면 자동 저장됩니다.</p>
    </section>`;

  app.querySelector("#d-prev").addEventListener("click", () => { viewingDay--; currentChapter = null; renderToday(); });
  app.querySelector("#d-next").addEventListener("click", () => { viewingDay++; currentChapter = null; renderToday(); });
  const goNext = app.querySelector("#d-go-next");
  if (goNext) goNext.addEventListener("click", () => { viewingDay++; currentChapter = null; renderToday(); });

  app.querySelectorAll(".chip").forEach((b) =>
    b.addEventListener("click", () => { currentChapter = Number(b.dataset.idx); renderToday(); }));

  app.querySelectorAll(".seg button").forEach((b) =>
    b.addEventListener("click", () => {
      state.settings.mode = b.dataset.mode;
      if (state.settings.mode === "two" && state.settings.ver2 === state.settings.ver) {
        state.settings.ver2 = VERSIONS.find((v) => v.code !== state.settings.ver).code;
      }
      persist();
      renderToday();
    }));
  app.querySelector("#r-ver").addEventListener("change", (e) => { state.settings.ver = e.target.value; persist(); renderToday(); });
  app.querySelector("#r-ver2").addEventListener("change", (e) => { state.settings.ver2 = e.target.value; persist(); renderToday(); });

  // 이전/다음 장은 계획 순서를 따라 이동 (날짜 경계를 넘으면 해당 Day로 전환)
  const seqPos = pr.seq.indexOf(currentChapter);
  const move = (delta) => {
    const next = pr.seq[seqPos + delta];
    if (next === undefined) return;
    currentChapter = next;
    viewingDay = Math.floor((seqPos + delta) / state.plan.perDay);
    renderToday();
  };
  app.querySelector("#r-prev").disabled = seqPos <= 0;
  app.querySelector("#r-next").disabled = seqPos >= pr.seq.length - 1;
  app.querySelector("#r-prev").addEventListener("click", () => move(-1));
  app.querySelector("#r-next").addEventListener("click", () => move(1));

  const c = CHAPTERS[currentChapter];
  const ver2 = state.settings.mode === "two" ? state.settings.ver2 : "";
  const url = godpiaReadUrl(c.book.code, c.chap, state.settings.ver, ver2);
  app.querySelector("#r-title").textContent = `${c.book.name} ${c.chap}장`;
  app.querySelector("#r-frame").src = url;
  app.querySelector("#r-open").href = url;

  const checkBtn = app.querySelector("#r-check");
  const isRead = !!state.read[currentChapter];
  checkBtn.textContent = isRead ? `✓ ${state.read[currentChapter]} 읽음 (취소)` : "읽었어요 · 다음 장으로";
  checkBtn.classList.toggle("ghost", isRead);
  checkBtn.classList.toggle("primary", !isRead);
  checkBtn.addEventListener("click", () => {
    if (state.read[currentChapter]) {
      delete state.read[currentChapter];
    } else {
      state.read[currentChapter] = todayStr();
      const nextUnread = day.find((i) => !state.read[i]);
      if (nextUnread !== undefined) currentChapter = nextUnread;
    }
    persist();
    renderToday();
  });

  // 갓피아 iframe 안의 장 이동은 브라우저 보안(교차 출처 제한)상 감지할 수 없어서,
  // 읽은 마지막 장을 골라 그 앞의 안 읽은 장을 한 번에 체크하게 한다.
  const firstUnreadPos = pr.seq.findIndex((i) => !state.read[i]);
  const upto = app.querySelector("#r-upto");
  const catchup = app.querySelector(".catchup");
  if (firstUnreadPos === -1) {
    catchup.classList.add("hidden");
  } else {
    const opts = pr.seq.slice(firstUnreadPos, firstUnreadPos + state.plan.perDay * 3);
    upto.innerHTML = opts.map((i) => {
      const ch = CHAPTERS[i];
      return `<option value="${i}" ${i === currentChapter ? "selected" : ""}>${esc(ch.book.name)} ${ch.chap}장</option>`;
    }).join("");
    app.querySelector("#r-upto-btn").addEventListener("click", () => {
      const endPos = pr.seq.indexOf(Number(upto.value));
      const targets = pr.seq.slice(firstUnreadPos, endPos + 1).filter((i) => !state.read[i]);
      if (!confirm(`${describeChapters(targets)}을(를) 오늘 읽은 것으로 체크할까요?`)) return;
      targets.forEach((i) => { state.read[i] = todayStr(); });
      persist();
      currentChapter = null;
      viewingDay = null;
      renderToday();
    });
  }

  const copyBtn = app.querySelector("#d-copy");
  copyBtn.addEventListener("click", async () => {
    const text = `성경 통독 Day ${viewingDay + 1}: ${describeChapters(day)}`;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "복사됨 ✓";
    } catch (e) {
      prompt("아래 내용을 복사하세요", text);
    }
  });

  const note = app.querySelector("#d-note");
  let t;
  note.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const v = note.value.trim();
      if (v) state.dayNotes[todayStr()] = note.value;
      else delete state.dayNotes[todayStr()];
      persist();
      app.querySelector("#d-note-status").textContent = "저장됨 ✓";
    }, 400);
  });
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
      <div class="kpis">
        <div><b>${pct}%</b><span>진행률</span></div>
        <div><b>${pr.readCount}</b><span>읽은 장 / ${pr.total}</span></div>
        <div><b>${pr.doneDays}</b><span>완료한 Day / ${pr.days.length}</span></div>
        <div><b>${streak(dates)}일</b><span>연속 통독</span></div>
        <div><b class="${pr.diff < 0 ? "warn-text" : ""}">${pr.diff === 0 ? "계획대로" : pr.diff > 0 ? `+${pr.diff}일` : `${pr.diff}일`}</b><span>계획 대비</span></div>
        <div><b>${pr.finished ? "완료" : pr.projectedEnd}</b><span>예상 완료일 (계획 ${pr.plannedEnd})</span></div>
      </div>
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

/* ---------- 오늘의 QT ---------- */

let qtDate = todayStr();

function renderQt() {
  const entry = state.qt[qtDate] || { done: false, note: "" };
  const url = godpiaQtUrl(qtDate);
  const qtDates = new Set(Object.keys(state.qt).filter((d) => state.qt[d].done));
  const history = Object.keys(state.qt).filter((d) => state.qt[d].done || state.qt[d].note).sort().reverse().slice(0, 30);

  app.innerHTML = `
    <section class="card qt-head">
      <div>
        <div class="eyebrow">갓피아 · 날마다 솟는 샘물</div>
        <h1>${qtDate === todayStr() ? "오늘의 QT" : `${qtDate} QT`}</h1>
        <p class="muted small">QT 연속 ${streak(qtDates)}일 · 누적 ${qtDates.size}일</p>
      </div>
      <a class="btn primary" href="${url}" target="_blank" rel="noopener">갓피아 QT 바로 열기 ↗</a>
    </section>

    <section class="card reader">
      <div class="reader-nav">
        <button class="btn ghost small" id="q-prev">‹ 전날</button>
        <div class="qt-date">
          <input type="date" id="q-date" value="${qtDate}" max="${todayStr()}">
          ${qtDate !== todayStr() ? `<button class="btn ghost small" id="q-today">오늘</button>` : ""}
        </div>
        <button class="btn ghost small" id="q-next" ${qtDate >= todayStr() ? "disabled" : ""}>다음날 ›</button>
      </div>
      <div class="frame-wrap tall"><iframe title="갓피아 오늘의 QT" src="${url}" ${GODPIA_SANDBOX}></iframe></div>
      <p class="muted small login-note">갓피아 로그인이 필요한 기능은 위의 <b>갓피아 QT 바로 열기</b>로 새 창에서 이용해 주세요.</p>
    </section>

    <section class="card">
      <h2>나의 묵상 노트</h2>
      <textarea id="q-note" rows="5" placeholder="관찰 · 느낌 · 적용 · 기도를 적어 보세요.">${esc(entry.note)}</textarea>
      <div class="actions">
        <span class="muted small" id="q-status"></span>
        <button class="btn ${entry.done ? "ghost" : "primary"}" id="q-done">${entry.done ? "✓ QT 완료 (취소)" : "QT 완료 체크"}</button>
      </div>
    </section>

    ${history.length ? `
    <section class="card">
      <h2>최근 QT 기록</h2>
      <ul class="log">
        ${history.map((d) => `
          <li>
            <div class="log-date"><a href="#qt" data-qt="${d}">${d}</a><span>${state.qt[d].done ? "완료" : "메모"}</span></div>
            <div>${state.qt[d].note ? `<blockquote>${esc(state.qt[d].note)}</blockquote>` : `<span class="muted">메모 없음</span>`}</div>
          </li>`).join("")}
      </ul>
    </section>` : ""}`;

  const setDate = (d) => { qtDate = d > todayStr() ? todayStr() : d; renderQt(); };
  app.querySelector("#q-prev").addEventListener("click", () => setDate(addDays(qtDate, -1)));
  app.querySelector("#q-next").addEventListener("click", () => setDate(addDays(qtDate, 1)));
  app.querySelector("#q-date").addEventListener("change", (e) => e.target.value && setDate(e.target.value));
  const todayBtn = app.querySelector("#q-today");
  if (todayBtn) todayBtn.addEventListener("click", () => setDate(todayStr()));
  app.querySelectorAll("[data-qt]").forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); setDate(a.dataset.qt); }));

  const save = (patch) => {
    const next = { ...(state.qt[qtDate] || { done: false, note: "" }), ...patch };
    if (!next.done && !next.note.trim()) delete state.qt[qtDate];
    else state.qt[qtDate] = next;
    persist();
  };
  let t;
  app.querySelector("#q-note").addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => { save({ note: e.target.value }); app.querySelector("#q-status").textContent = "저장됨 ✓"; }, 400);
  });
  app.querySelector("#q-done").addEventListener("click", () => {
    save({ done: !entry.done, note: app.querySelector("#q-note").value });
    renderQt();
  });
}

route();
