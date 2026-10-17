// 관리 화면: 통독·QT 요약 카드, 달력(날짜를 누르면 그날 기록), 통독표, 권별 진행(누르면 읽은 기간·복사한 구절), 계정·알림·백업

let calMonth = todayStr().slice(0, 7); // 달력에 보이는 달 "YYYY-MM"
let calSel = todayStr(); // 달력에서 고른 날
let bookSel = null; // 권별 진행에서 고른 권 코드

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
        <li><b>${streak(readGoalDates())}일</b><span>연속(목표 채운 날)</span></li>
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
    cells += `<button class="cell ${ds === today ? "today" : ""} ${ds > today ? "future" : ""} ${ds === calSel ? "sel" : ""}" data-date="${ds}" ${ds > today ? "disabled" : ""}
      title="${ds}${n ? ` · 통독 ${n}장` : ""}${q ? " · QT 완료" : ""}">
      <span class="d">${d}</span>
      <span class="marks"><i class="m-read ${readCls}"></i><i class="m-qt ${q ? "on" : ""}"></i></span>
    </button>`;
  }

  const copied = copiedByDate();

  const themeNow = state.settings.theme || "auto";
  app.innerHTML = `
    <section class="card theme-card">
      <h3 class="label">화면 모드</h3>
      <div class="opts">
        ${[["auto", "기기 설정 따르기"], ["light", "밝게"], ["dark", "어둡게"]].map(([v, l]) => `<button class="opt ${themeNow === v ? "on" : ""}" data-theme-set="${v}">${l}</button>`).join("")}
      </div>
    </section>
    <section class="hero-row">${readCard}${qtCard}</section>

    ${glanceCardHtml()}

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
      <div class="day-detail" id="day-detail">${dayDetailHtml(calSel, byDate, copied)}</div>
    </section>

    ${pr ? planTableCardHtml(pr) : ""}

    ${pr ? `
    <section class="card" id="books-card">
      <h2>권별 진행 <span class="muted small">권을 누르면 읽은 기간과 복사한 구절이 나와요</span></h2>
      <div class="books">${booksGridHtml(pr, copied)}</div>
      <div id="book-detail">${bookSel ? bookDetailHtml(bookSel, copied) : ""}</div>
    </section>` : ""}

    ${accountCardHtml()}
    ${changelogCardHtml()}
    ${reminderCardHtml()}

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
      <p class="muted small">로그인하지 않으면 모든 기록은 <b>이 기기의 이 브라우저(또는 홈 화면 앱)</b>에만 저장돼요. 위 <b>계정</b>으로 로그인하면 서버에도 저장돼서 다른 기기에서 이어 할 수 있어요. 백업 파일은 언제든 받아 둘 수 있어요.</p>
    </section>`;

  bindAccountCard();
  bindReminderCard();
  bindExportCard();

  document.querySelectorAll("[data-theme-set]").forEach((b) => b.addEventListener("click", () => {
    state.settings.theme = b.dataset.themeSet;
    applyTheme();
    persist();
    renderStats();
  }));

  const shiftMonth = (n) => {
    const d = new Date(cy, cm - 1 + n, 1);
    calMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    renderStats();
  };
  $("#cal-prev").addEventListener("click", () => shiftMonth(-1));
  $("#cal-next").addEventListener("click", () => shiftMonth(1));
  $(".cal").addEventListener("click", (e) => {
    const c = e.target.closest("[data-date]");
    if (!c || c.disabled) return;
    calSel = c.dataset.date;
    app.querySelectorAll(".cal .cell.sel").forEach((x) => x.classList.remove("sel"));
    c.classList.add("sel");
    $("#day-detail").innerHTML = dayDetailHtml(calSel, byDate, copied);
  });
  bindGlanceCard();
  const books = $("#books-card");
  if (books) books.addEventListener("click", (e) => {
    const b = e.target.closest("[data-book]");
    if (!b) return;
    bookSel = bookSel === b.dataset.book ? null : b.dataset.book;
    books.querySelectorAll(".book").forEach((x) => x.classList.toggle("sel", x.dataset.book === bookSel));
    $("#book-detail").innerHTML = bookSel ? bookDetailHtml(bookSel, copied) : "";
  });
  const table = $("#ptable");
  if (table) {
    table.addEventListener("click", (e) => {
      const r = e.target.closest("[data-day]");
      if (!r) return;
      viewingDay = Number(r.dataset.day);
      currentChapter = null;
      freeChapter = null;
      location.hash = "#today";
    });
    const cur = table.querySelector(".trow.current");
    if (cur) table.scrollTop = cur.offsetTop - table.offsetTop - table.clientHeight / 2;
  }
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

// ── 통독표 (예전엔 통독 화면 패널, 이제 관리 화면 카드) ──
function planTableCardHtml(pr) {
  return `<section class="card" id="ptable-card">
    <div class="ptable-head"><h2>통독표</h2>
      <span class="muted small"><b>${pr.pct}%</b> · ${pr.readCount}/${pr.total}장 · Day ${pr.doneDays}/${pr.days.length} 완료</span></div>
    <div class="bar thin"><span style="width:${pr.pct}%"></span></div>
    <div class="ttable" id="ptable">
      ${pr.days.map((d, n) => {
        const done = d.filter((i) => state.read[i]).length;
        const cls = [done === d.length ? "done" : done ? "part" : "", n === pr.todayDay ? "current" : "", n < pr.todayDay && done < d.length ? "late" : ""].join(" ");
        const st = done === d.length
          ? `<svg viewBox="0 0 24 24" aria-label="완료"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`
          : done ? `${done}/${d.length}` : n === pr.todayDay ? "오늘" : n < pr.todayDay ? "밀림" : "";
        return `<button class="trow ${cls}" data-day="${n}">
          <span class="t-day">Day ${n + 1}</span>
          <span class="t-range">${esc(describeChapters(d))}<small>${pr.dayDates[n] ? prettyDate(pr.dayDates[n]) : "건너뜀"}</small></span>
          <span class="t-st">${st}</span>
        </button>`;
      }).join("")}
    </div>
    <p class="muted small">Day를 누르면 그 분량으로 바로 가요.</p>
  </section>`;
}

// ── 복사·붙여 넣은 구절 모으기 ──
// 구절 패널의 '복사'는 state.copies에 남기고, 메모·노트에 붙인 구절은 메모 안의 "권 장:절" 줄에서 읽어 냄
// → { "YYYY-MM-DD": { 장일련번호: Set(절) } }
const COPY_REF_LINE = new RegExp(`^(${BOOKS.map((b) => b.name).join("|")}) (\\d{1,3}):([\\d,\\- ]+)$`);
function parseVerseList(v) {
  const out = [];
  String(v).split(",").forEach((p) => {
    const [a, b] = p.trim().split("-").map(Number);
    if (a) for (let n = a; n <= (b || a) && n < a + 200; n++) out.push(n);
  });
  return out;
}
function copiedByDate() {
  const out = {};
  const add = (d, idx, nums) => {
    const day = (out[d] = out[d] || {});
    const set = (day[idx] = day[idx] || new Set());
    nums.forEach((n) => set.add(n));
  };
  (state.copies || []).forEach((c) => add(c.d, c.i, parseVerseList(c.v)));
  const scan = (d, text) => String(text || "").split("\n").forEach((line) => {
    const m = line.trim().match(COPY_REF_LINE);
    if (!m) return;
    const b = BOOKS.find((x) => x.name === m[1]);
    if (b && +m[2] >= 1 && +m[2] <= b.chapters) add(d, chapterIndex(b.code, +m[2]), parseVerseList(m[3]));
  });
  Object.entries(state.dayNotes).forEach(([d, t]) => scan(d, t));
  Object.entries(state.qt).forEach(([d, q]) => scan(d, q && q.note));
  return out;
}
// { 장일련번호: Set } → ["창세기 1:1-3,5 · 2:4"]
function copiedText(map) {
  const byBook = {};
  Object.entries(map).sort((a, b) => a[0] - b[0]).forEach(([i, set]) => {
    if (!set.size) return;
    const c = CHAPTERS[i];
    (byBook[c.book.name] = byBook[c.book.name] || []).push(versesRef(c, [...set]).replace(`${c.book.name} `, ""));
  });
  return Object.entries(byBook).map(([name, parts]) => `${name} ${parts.join(" · ")}`);
}

// ── 달력에서 고른 날 ──
function dayDetailHtml(d, byDate, copied) {
  const q = state.qt[d];
  const cp = copied[d] ? copiedText(copied[d]) : [];
  const rows = [
    byDate[d] ? `<p class="tl-row"><span class="tag sm">📖</span>${esc(describeChapters(byDate[d]))} <span class="muted">(${byDate[d].length}장)</span></p>` : "",
    state.dayNotes[d] ? `<p class="note">${esc(state.dayNotes[d])}</p>` : "",
    q ? `<p class="tl-row"><span class="tag sm qt">🙏</span>${q.done ? "QT 완료" : "QT 메모"}</p>` : "",
    qtHasText(q) ? `<p class="note qt">${esc(qtTextOf(q))}</p>` : "",
    cp.length ? `<p class="tl-row"><span class="tag sm">📋</span>복사한 구절: ${cp.map(esc).join(", ")}</p>` : "",
  ].join("");
  return `<h3>${prettyDate(d)}</h3>${rows || `<p class="muted small">이 날은 기록이 없어요.</p>`}`;
}

// ── 권별 진행 ──
function booksGridHtml(pr, copied) {
  const inPlan = new Set(pr.seq);
  const copiedBooks = new Set(Object.values(copied).flatMap((m) => Object.keys(m).map((i) => CHAPTERS[i].book.code)));
  return BOOKS.map((b) => {
    const start = chapterIndex(b.code, 1);
    let inP = 0, done = 0;
    for (let i = start; i < start + b.chapters; i++) {
      if (inPlan.has(i)) { inP++; if (state.read[i]) done++; }
    }
    if (!inP && !copiedBooks.has(b.code)) return "";
    const p = inP ? Math.round((done / inP) * 100) : 0;
    return `<button class="book ${p === 100 ? "full" : ""} ${b.code === bookSel ? "sel" : ""}" data-book="${b.code}"><span>${b.name}</span><em>${done}/${inP}</em>
      <div class="bar thin"><span style="width:${p}%"></span></div></button>`;
  }).join("");
}

function bookDetailHtml(code, copied) {
  const b = BOOKS.find((x) => x.code === code);
  const start = chapterIndex(code, 1), end = start + b.chapters;
  const days = {};
  for (let i = start; i < end; i++) if (state.read[i]) (days[state.read[i]] = days[state.read[i]] || []).push(i);
  const dates = Object.keys(days).sort();
  const readN = dates.reduce((n, d) => n + days[d].length, 0);
  const span = dates.length ? daysBetween(dates[0], dates[dates.length - 1]) + 1 : 0;
  const total = VERSE_COUNTS.slice(start, end).reduce((a, c) => a + c, 0);
  const all = new Set();
  const copyRows = Object.keys(copied).sort().map((d) => {
    const mine = {};
    Object.entries(copied[d]).forEach(([i, set]) => {
      if (i >= start && i < end && set.size) { mine[i] = set; set.forEach((n) => all.add(`${i}:${n}`)); }
    });
    return Object.keys(mine).length
      ? `<li><b>${prettyDate(d)}</b> ${copiedText(mine).map((t) => esc(t.replace(`${b.name} `, ""))).join(", ")}</li>` : "";
  }).join("");
  const ratio = total ? (all.size / total) * 100 : 0;
  return `<div class="book-detail">
    <h3>${b.name} <span class="muted small">${b.chapters}${chapUnit(b)} · ${total.toLocaleString()}절</span></h3>
    <div class="bd-grid">
      <div><span class="muted small">읽은 기간</span><b>${dates.length ? `${prettyDate(dates[0])} ~ ${prettyDate(dates[dates.length - 1])}` : "아직 안 읽었어요"}</b>
        ${dates.length ? `<small class="muted">${span}일 동안 ${readN}${chapUnit(b)} 읽음</small>` : ""}</div>
      <div><span class="muted small">복사한 절</span><b>${all.size.toLocaleString()} / ${total.toLocaleString()}절 (${ratio > 0 && ratio < 10 ? ratio.toFixed(1) : Math.round(ratio)}%)</b>
        <div class="bar thin"><span style="width:${Math.min(100, ratio)}%"></span></div></div>
    </div>
    ${dates.length ? `<details><summary>날짜별로 읽은 장</summary><ul class="bd-list">${dates.map((d) => `<li><b>${prettyDate(d)}</b> ${esc(describeChapters(days[d]))}</li>`).join("")}</ul></details>` : ""}
    ${copyRows ? `<h4>날짜별 복사한 구절</h4><ul class="bd-list">${copyRows}</ul>` : `<p class="muted small">이 권에서 복사한 구절이 아직 없어요.</p>`}
  </div>`;
}


// ── 통독 현황 한눈에 보기 (토글) ──
// 위: 성경 전체(1,189장) 중 읽은 비율을 고리 하나로(구약·신약 색을 나눔)
// 아래: 66권을 구약·신약 순서대로, 권마다 "장 칸 띠"(읽은 장은 색칠) + 읽은 기간(처음 읽은 날 ~ 마지막 읽은 날)
// 띠는 어느 장을 읽었는지 · 건너뛴 곳이 있는지가 한눈에 보이고, 고리는 전체 진도가 한눈에 보임
let glanceOpen = false;

function glanceStats() {
  const perBook = BOOKS.map((b) => {
    const start = chapterIndex(b.code, 1);
    let n = 0, first = null, last = null;
    const cells = [];
    for (let i = start; i < start + b.chapters; i++) {
      const d = state.read[i];
      cells.push(!!d);
      if (d) { n++; if (!first || d < first) first = d; if (!last || d > last) last = d; }
    }
    return { b, n, first, last, cells };
  });
  const sum = (list, f) => list.reduce((a, x) => a + f(x), 0);
  const ot = perBook.filter((x) => x.b.testament === "OT"), nt = perBook.filter((x) => x.b.testament === "NT");
  return {
    perBook, ot, nt,
    otRead: sum(ot, (x) => x.n), ntRead: sum(nt, (x) => x.n),
    otTotal: sum(ot, (x) => x.b.chapters), ntTotal: sum(nt, (x) => x.b.chapters),
  };
}

// "2026-10-03" → "10.3" (올해가 아니거나 withYear면 "2025.12.30"처럼 연도도 붙임)
function shortDate(d, withYear = false) {
  const [y, m, day] = d.split("-").map(Number);
  return `${withYear || y !== Number(todayStr().slice(0, 4)) ? `${y}.` : ""}${m}.${day}`;
}

function glancePct(n, total) {
  const p = total ? (n / total) * 100 : 0;
  return p > 0 && p < 10 ? p.toFixed(1) : String(Math.round(p));
}

function glanceCardHtml() {
  const g = glanceStats();
  const read = g.otRead + g.ntRead;
  return `<section class="card glance" id="glance-card">
    <button class="glance-head" id="glance-toggle" aria-expanded="${glanceOpen}" aria-controls="glance-body">
      <span><b>📊 통독 현황 한눈에 보기</b><small>성경 전체 ${TOTAL_CHAPTERS.toLocaleString()}장 중 <b>${read.toLocaleString()}장 (${glancePct(read, TOTAL_CHAPTERS)}%)</b></small></span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
    </button>
    <div class="glance-body" id="glance-body" ${glanceOpen ? "" : "hidden"}>${glanceOpen ? glanceBodyHtml(g) : ""}</div>
  </section>`;
}

function glanceBodyHtml(g = glanceStats()) {
  const r = 52, c = 2 * Math.PI * r;
  const read = g.otRead + g.ntRead;
  const lenOt = (g.otRead / TOTAL_CHAPTERS) * c, lenNt = (g.ntRead / TOTAL_CHAPTERS) * c;
  const donut = `<svg class="gring" viewBox="0 0 140 140" role="img" aria-label="성경 전체 ${TOTAL_CHAPTERS}장 중 ${read}장 읽음">
      <circle class="gring-bg" cx="70" cy="70" r="${r}"/>
      <circle class="gring-ot" cx="70" cy="70" r="${r}" stroke-dasharray="${lenOt} ${c - lenOt}"/>
      <circle class="gring-nt" cx="70" cy="70" r="${r}" stroke-dasharray="${lenNt} ${c - lenNt}" stroke-dashoffset="${-lenOt}"/>
      <text x="70" y="68" text-anchor="middle" class="gring-pct">${glancePct(read, TOTAL_CHAPTERS)}%</text>
      <text x="70" y="88" text-anchor="middle" class="gring-sub">${read.toLocaleString()} / ${TOTAL_CHAPTERS.toLocaleString()}장</text>
    </svg>`;
  const side = (cls, label, n, total) => `<li><i class="${cls}"></i><span><b>${label}</b> ${n.toLocaleString()} / ${total.toLocaleString()}장</span><em>${glancePct(n, total)}%</em></li>`;

  const row = (x) => {
    const { b, n, first, last, cells } = x;
    const unit = chapUnit(b);
    const done = n === b.chapters;
    const period = n === 0 ? "아직 안 읽었어요"
      : first === last ? shortDate(first) : (() => { const y = first.slice(0, 4) !== last.slice(0, 4); return `${shortDate(first, y)} ~ ${shortDate(last, y)}`; })();
    const days = n && first !== last ? ` · ${daysBetween(first, last) + 1}일` : "";
    return `<li class="gl-row ${n === 0 ? "none" : done ? "full" : ""}">
      <div class="gl-top"><b>${b.name}</b>${done ? `<span class="gl-done">완독</span>` : ""}<em>${n}/${b.chapters}${unit} · ${glancePct(n, b.chapters)}%</em></div>
      <div class="gl-strip" aria-hidden="true">${cells.map((on) => `<i class="${on ? "on" : ""}"></i>`).join("")}</div>
      <div class="gl-period">${period}${days}</div>
    </li>`;
  };
  const group = (label, list, n, total) => `<h3 class="gl-group">${label} <span class="muted small">${n.toLocaleString()} / ${total.toLocaleString()}장 · ${glancePct(n, total)}%</span></h3>
    <ul class="gl-list">${list.map(row).join("")}</ul>`;

  return `<div class="glance-top">
      <div class="gring-wrap">${donut}</div>
      <ul class="gring-legend">
        ${side("ot", "구약", g.otRead, g.otTotal)}
        ${side("nt", "신약", g.ntRead, g.ntTotal)}
        ${side("rest", "아직 안 읽음", TOTAL_CHAPTERS - read, TOTAL_CHAPTERS)}
      </ul>
    </div>
    ${group("구약", g.ot, g.otRead, g.otTotal)}
    ${group("신약", g.nt, g.ntRead, g.ntTotal)}
    <p class="muted small">칸 하나가 한 장(시편은 한 편)이고, 색칠된 칸이 읽은 곳이에요. 읽은 기간은 그 권의 장을 처음 읽은 날부터 마지막으로 읽은 날까지예요.</p>`;
}

function bindGlanceCard() {
  const t = $("#glance-toggle");
  if (!t) return;
  t.addEventListener("click", () => {
    glanceOpen = !glanceOpen;
    t.setAttribute("aria-expanded", String(glanceOpen));
    const body = $("#glance-body");
    body.hidden = !glanceOpen;
    if (glanceOpen && !body.innerHTML.trim()) body.innerHTML = glanceBodyHtml(); // 열 때만 그림(장 칸이 1,189개라서)
  });
}
