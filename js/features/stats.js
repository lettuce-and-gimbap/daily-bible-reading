// 관리 화면: 통독·QT 요약 카드, 달력(날짜를 누르면 그날 기록), 통독표, 권별 진행(누르면 읽은 기간·복사한 구절), 계정·알림·백업

let calMonth = todayStr().slice(0, 7); // 달력에 보이는 달 "YYYY-MM"
let calSel = todayStr(); // 달력에서 고른 날
let readMode = "read"; // 읽은 기록 보기: "read" 통독 · "qt" QT (섞지 않고 따로)
let bookSel = null; // 권별 진행에서 고른 권 코드
let glanceMode = "read"; // 통독 현황 한눈에 보기: "read" 통독 · "qt" QT 본문 범위 (따로 전환)
let qtBookSel = null; // QT 모드에서 고른 권 코드
const qtCoverMap = {}; // QT 날짜 → { ref: 본문 범위, idx: 다룬 장 번호들 } (한 번 받으면 다시 받지 않음)

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
  const qtDates = qtCountDates();
  const pr = state.plan ? progress() : null;
  const perDay = state.plan ? state.plan.perDay : 5;
  const thisMonth = today.slice(0, 7);
  const qtMonth = [...qtDates].filter((d) => d.startsWith(thisMonth)).length;
  const todayQt = !!(state.qt[today] && state.qt[today].done);
  const cutoff = Number(state.settings.readingCutoff || 0);
  const cutoffText = cutoff === 0 ? "자정" : `새벽 ${cutoff}시`;
  const habits = readingHabitCounts();
  const habitAdvice = habits.late >= 4 || habits.uses >= 4;

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
      <ul class="kpis">
        <li><i>🔥</i><b>${streak(readGoalDates())}일</b><span>연속으로 채운 날</span></li>
        <li class="kpi-plan ${pr.diff < 0 ? "behind" : pr.diff > 0 ? "ahead" : ""}"><i>${pr.diff < 0 ? "⚠️" : pr.diff > 0 ? "⚡" : "✅"}</i><b>${pr.diff === 0 ? "계획대로" : pr.diff > 0 ? `${pr.diff}일 앞섬` : `${-pr.diff}일 밀림`}</b><span>계획 대비</span></li>
        <li><i>🏁</i><b>${pr.finished ? "완료" : prettyDate(pr.projectedEnd).replace(/ \(.\)/, "")}</b><span>${pr.finished ? "통독을 마침" : `마칠 예정 · D-${Math.max(0, daysBetween(readingDateStr(), pr.projectedEnd))}`}</span></li>
      </ul>
      <div class="pbar" aria-label="통독 진행 ${pr.pct}%"><span style="width:${pr.pct}%"></span></div>
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
        <div class="qt-today ${todayQt && !isSundayStr(today) ? "done" : ""}">${todayQt && !isSundayStr(today)
          ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`
          : `<span>🙏</span>`}</div>
        <div>
          <p class="hero-status">${isQtSunday(today) ? "주일에는 QT가 없어요. 은혜로운 주일 되세요 😊" : todayQt ? "오늘 QT 완료 ✓" : "오늘 QT를 아직 안 했어요"}</p>
          <p class="muted small">${prettyDate(today)}</p>
        </div>
      </div>
      <ul class="mini">
        <li><b>${qtStreak(qtDates)}일</b><span>연속</span></li>
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
    ${changelogCardHtml()}
    <section class="card theme-card">
      <h3 class="label">화면 모드</h3>
      <div class="seg wide">
        ${[["auto", "기기 설정"], ["light", "밝게"], ["dark", "어둡게"]].map(([v, l]) => `<button class="${themeNow === v ? "on" : ""}" data-theme-set="${v}">${l}</button>`).join("")}
      </div>
    </section>
    <section class="card cutoff-card">
      <div class="cutoff-head"><div><h3 class="label">통독 하루 마감</h3><p class="muted small">마감 전 새벽에 읽으면 전날 통독으로 기록해요.</p></div><b id="cutoff-value">${cutoffText}</b></div>
      <input type="range" id="reading-cutoff" min="0" max="5" step="1" value="${cutoff}" aria-label="통독 하루 마감 시간">
      <div class="cutoff-ticks" aria-hidden="true">${["자정", "1시", "2시", "3시", "4시", "5시"].map((x) => `<span>${x}</span>`).join("")}</div>
      <p class="muted small" id="cutoff-preview">현재 기준으로 통독 날짜는 <b>${prettyDate(readingDateStr())}</b>예요. 과거 기록은 바뀌지 않아요.</p>
      <p class="muted small">마감 활용은 시간을 바꾼 그 통독 날짜에, 하루 분량을 자정부터 선택한 새벽 시각 사이에 모두 읽었을 때만 1회로 세요. 다음 회차는 마감 시간을 다시 바꾼 뒤에 셀 수 있어요.</p>
      ${habitAdvice ? `<p class="cutoff-advice">🌙 최근 30일 동안 새벽 통독 ${habits.late}일 · 새벽 마감 활용 ${habits.uses}일이었어요. 가능하다면 몸과 말씀 묵상을 위해 조금 일찍 읽어 보아도 좋아요.</p>` : ""}
    </section>
    <section class="hero-row">${readCard}${qtCard}</section>

    ${glanceCardHtml()}

    <section class="card">
      <div class="cal-head">
        <button class="icon-btn" id="cal-prev" aria-label="이전 달">‹</button>
        <h2>${cy}년 ${cm}월</h2>
        <button class="icon-btn" id="cal-next" aria-label="다음 달" ${calMonth >= thisMonth ? "disabled" : ""}>›</button>
      </div>
      <div class="seg wide read-mode" role="group" aria-label="읽은 기록 보기">
        ${[["read", "📖 통독"], ["qt", "🙏 QT"]].map(([v, l]) => `<button class="${readMode === v ? "on" : ""}" data-rmode="${v}">${l}</button>`).join("")}
      </div>
      <div class="cal mode-${readMode}">
        ${WEEK.map((w) => `<div class="wk">${w}</div>`).join("")}
        ${cells}
      </div>
      <div class="cal-foot">
        <span class="legend"><i class="m-read full"></i>통독 완료 <i class="m-read part"></i>일부 <i class="m-qt on"></i>QT</span>
        <span class="muted small">이 달 통독 <b>${monthRead}</b>일 · QT <b>${monthQt}</b>일</span>
      </div>
      <div class="day-detail" id="day-detail">${dayDetailHtml(calSel, byDate, copiedBySource(readMode), readMode)}</div>
    </section>

    ${pr ? planTableCardHtml(pr) : ""}

    ${accountCardHtml()}
    ${feedbackCardHtml()}

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
  bindFeedbackCard();
  bindReminderCard();
  bindExportCard();

  document.querySelectorAll("[data-theme-set]").forEach((b) => b.addEventListener("click", () => {
    state.settings.theme = b.dataset.themeSet;
    applyTheme();
    persist();
    // 다시 그리지 않고 .on만 바꿔서 슬라이드 막대가 밀려 가게 함
    b.parentElement.querySelectorAll("[data-theme-set]").forEach((x) => x.classList.toggle("on", x === b));
  }));

  const cutoffInput = $("#reading-cutoff");
  cutoffInput.addEventListener("input", () => {
    const h = Number(cutoffInput.value);
    $("#cutoff-value").textContent = h === 0 ? "자정" : `새벽 ${h}시`;
  });
  cutoffInput.addEventListener("change", () => {
    if (changeReadingCutoff(cutoffInput.value)) persist();
    renderStats();
  });

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
    $("#day-detail").innerHTML = dayDetailHtml(calSel, byDate, copiedBySource(readMode), readMode);
  });
  app.querySelectorAll("[data-rmode]").forEach((b) => b.addEventListener("click", () => {
    readMode = b.dataset.rmode;
    renderStats();
  }));
  bindGlanceCard();
  const books = $("#glance-card");
  if (books) books.addEventListener("click", (e) => {
    const b = e.target.closest("[data-book]");
    if (!b) return;
    bookSel = bookSel === b.dataset.book ? null : b.dataset.book;
    books.querySelectorAll(".book").forEach((x) => x.classList.toggle("sel", x.dataset.book === bookSel));
    $("#book-detail").innerHTML = bookSel ? bookDetailHtml(bookSel, copiedBySource(glanceMode)) : "";
  });
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
      state = { ...defaultState(), ...data, plan: normalizePlan(data.plan), readingHabits: normalizeReadingHabits(data.readingHabits), settings: normalizeSettings({ ...defaultState().settings, ...(data.settings || {}) }) };
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
// 통독표: Day를 칸으로 늘어놓은 지도. 칸 색이 상태를 보여 주고, 칸을 누르면 아래에 그 날 분량이 나옴
let planSel = null; // 아래에 보여 줄 Day(0부터)
function planTableCardHtml(pr) {
  if (planSel === null || planSel >= pr.days.length) planSel = Math.min(Math.max(0, pr.todayDay), pr.days.length - 1);
  const cells = pr.days.map((d, n) => {
    const done = d.filter((i) => state.read[i]).length;
    const st = done === d.length ? "done" : done ? "part" : n < pr.todayDay ? "late" : n === pr.todayDay ? "today" : "";
    return `<button class="tcell ${st} ${n === planSel ? "sel" : ""}" data-tcell="${n}" aria-label="Day ${n + 1}">${n + 1}</button>`;
  }).join("");
  return `<section class="card" id="ptable-card">
    <div class="ptable-head"><h2>통독표</h2>
      <span class="muted small"><b>${pr.pct}%</b> · ${pr.readCount}/${pr.total}장 · Day ${pr.doneDays}/${pr.days.length} 완료</span></div>
    <div class="tlegend"><span><i class="done"></i>다 읽음</span><span><i class="part"></i>일부</span><span><i class="late"></i>밀림</span><span><i class="today"></i>오늘</span><span><i></i>남은 날</span></div>
    <div class="tgrid" id="tgrid">${cells}</div>
    <div class="tdetail" id="tdetail">${planDetailHtml(pr, planSel)}</div>
  </section>`;
}
function planDetailHtml(pr, n) {
  const d = pr.days[n];
  if (!d) return "";
  const done = d.filter((i) => state.read[i]).length;
  const date = pr.dayDates[n];
  return `<div class="td-head"><b>Day ${n + 1}</b><span class="muted small">${date ? prettyDate(date) : "건너뜀"}</span><em>${done}/${d.length}장</em></div>
    <p class="td-range">${esc(describeChapters(d))}</p>
    <button class="btn small" data-tgo="${n}">이 날 읽으러 가기</button>`;
}

// 칸을 고르면 아래 내용만 바꾸고, 읽으러 가기는 그 Day로 이동
document.addEventListener("click", (e) => {
  const c = e.target.closest && e.target.closest("#ptable-card [data-tcell]");
  if (c && state.plan) {
    planSel = Number(c.dataset.tcell);
    document.querySelectorAll("#tgrid .tcell").forEach((x) => x.classList.toggle("sel", x === c));
    document.querySelector("#tdetail").innerHTML = planDetailHtml(progress(), planSel);
    return;
  }
  const go = e.target.closest && e.target.closest("#tdetail [data-tgo]");
  if (!go) return;
  viewingDay = Number(go.dataset.tgo);
  currentChapter = null;
  freeChapter = null;
  location.hash = "#today";
});

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
// src: "reading" | "qt" 이면 그 출처만, 없으면 전부. 출처 없는 옛 기록은 통독으로 봄
function copiedByDate(src) {
  const out = {};
  const add = (d, idx, nums) => {
    const day = (out[d] = out[d] || {});
    const set = (day[idx] = day[idx] || new Set());
    nums.forEach((n) => set.add(n));
  };
  const want = (x) => !src || (x || "reading") === src;
  (state.copies || []).forEach((c) => { if (want(c.src)) add(c.d, c.i, parseVerseList(c.v)); });
  const scan = (d, text) => String(text || "").split("\n").forEach((line) => {
    const m = line.trim().match(COPY_REF_LINE);
    if (!m) return;
    const b = BOOKS.find((x) => x.name === m[1]);
    if (b && +m[2] >= 1 && +m[2] <= b.chapters) add(d, chapterIndex(b.code, +m[2]), parseVerseList(m[3]));
  });
  if (!src || src === "reading") Object.entries(state.dayNotes).forEach(([d, t]) => scan(d, t));
  if (!src || src === "qt") Object.entries(state.qt).forEach(([d, q]) => scan(d, q && q.note));
  return out;
}
function copiedBySource(mode) { return copiedByDate(mode === "qt" ? "qt" : "reading"); }
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

// 복사한 절 칩 (누르면 그 절을 개역개정4판·쉬운성경으로 보여 줌)
function copyChipsHtml(map) {
  return Object.entries(map).sort((a, b) => a[0] - b[0]).flatMap(([i, set]) => {
    const c = CHAPTERS[i];
    return [...set].sort((a, b) => a - b).map((n) =>
      `<button type="button" class="cv-chip" data-vref="${i}:${n}">${esc(c.book.name)} ${c.chap}:${n}</button>`);
  }).join("");
}

// 절 팝업: 개역개정4판과 쉬운성경을 나란히
async function showVersePop(i, n) {
  document.querySelector(".cv-pop")?.remove();
  const c = CHAPTERS[i];
  const pop = document.createElement("div");
  pop.className = "cl-pop cv-pop";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "복사한 절");
  pop.innerHTML = `<div class="cl-card cv-card">
    <div class="cl-head"><h3>${esc(c.book.name)} ${c.chap}${c.book.code === "psa" ? "편" : "장"}:${n}</h3><button class="icon-btn" data-vclose aria-label="닫기">✕</button></div>
    <div class="cl-body cv-body"><p class="muted small">본문을 불러오는 중…</p></div></div>`;
  pop.addEventListener("click", (e) => { if (e.target === pop || e.target.closest("[data-vclose]")) pop.remove(); });
  document.body.append(pop);
  const body = pop.querySelector(".cv-body");
  try {
    const hit = (await chapterVerses(i, "gae", "easy")).filter((v) => v.label === String(n));
    if (!hit.length) { body.innerHTML = `<p class="muted small">이 절을 본문에서 찾지 못했어요.</p>`; return; }
    body.innerHTML = ["gae", "easy"].map((code) => {
      const v = hit.find((x) => x.ver === versionFor(code, c.book)) || (hit.length === 2 ? hit[code === "gae" ? 0 : 1] : null);
      const name = (VERSIONS.find((x) => x.code === code) || {}).name || code;
      return `<div class="cv-row"><small>${esc(name)}</small><p>${v ? esc(v.text) : "이 역본에는 이 절이 없어요."}</p></div>`;
    }).join("");
  } catch (e) {
    body.innerHTML = `<p class="muted small">본문을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>`;
  }
}
document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("[data-vref]");
  if (!t) return;
  const [i, n] = t.dataset.vref.split(":").map(Number);
  showVersePop(i, n);
});

// ── 달력에서 고른 날 ──
function dayDetailHtml(d, byDate, copied, mode = "read") {
  const q = state.qt[d];
  const cp = copied[d] ? copyChipsHtml(copied[d]) : "";
  const rows = mode === "qt" ? [
    q ? `<p class="tl-row"><span class="tag sm qt">🙏</span>${q.done ? "QT 완료" : "QT 메모"}</p>` : "",
    qtHasText(q) ? `<p class="note qt">${esc(qtTextOf(q))}</p>` : "",
  ].join("") : [
    byDate[d] ? `<p class="tl-row"><span class="tag sm">📖</span>${esc(describeChapters(byDate[d]))} <span class="muted">(${byDate[d].length}장)</span></p>` : "",
    state.dayNotes[d] ? `<p class="note">${esc(state.dayNotes[d])}</p>` : "",
    cp ? `<p class="tl-row"><span class="tag sm">📋</span>복사한 구절</p><div class="cv-chips">${cp}</div>` : "",
  ].join("");
  return `<h3>${prettyDate(d)}</h3>${rows || `<p class="muted small">이 날은 ${mode === "qt" ? "QT" : "통독"} 기록이 없어요.</p>`}`;
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
      ? `<li><b>${prettyDate(d)}</b><div class="cv-chips">${copyChipsHtml(mine)}</div></li>` : "";
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
let glanceOpen = true;

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

// 성경 전체 고리 그래프: 구약(색 1)·신약(색 2)을 나눠 읽은 장 수를 보여 줌
function glanceRingHtml(otN, ntN, read) {
  const r = 52, c = 2 * Math.PI * r;
  const lenOt = (otN / TOTAL_CHAPTERS) * c, lenNt = (ntN / TOTAL_CHAPTERS) * c;
  return `<svg class="gring" viewBox="0 0 140 140" role="img" aria-label="성경 전체 ${TOTAL_CHAPTERS}장 중 ${read}장">
      <circle class="gring-bg" cx="70" cy="70" r="${r}"/>
      <circle class="gring-ot" cx="70" cy="70" r="${r}" stroke-dasharray="${lenOt} ${c - lenOt}"/>
      <circle class="gring-nt" cx="70" cy="70" r="${r}" stroke-dasharray="${lenNt} ${c - lenNt}" stroke-dashoffset="${-lenOt}"/>
      <text x="70" y="68" text-anchor="middle" class="gring-pct">${glancePct(read, TOTAL_CHAPTERS)}%</text>
      <text x="70" y="88" text-anchor="middle" class="gring-sub">${read.toLocaleString()} / ${TOTAL_CHAPTERS.toLocaleString()}장</text>
    </svg>`;
}

function glanceSideHtml(cls, label, n, total) {
  return `<li><i class="${cls}"></i><span><b>${label}</b> ${n.toLocaleString()} / ${total.toLocaleString()}장</span><em>${glancePct(n, total)}%</em></li>`;
}

// 통독 · QT 전환 막대. 누른 쪽만 다시 그림
function glanceSwitchHtml() {
  return `<div class="seg wide" role="group" aria-label="통독 현황 보기 방식">
    ${[["read", "📖 통독"], ["qt", "🙏 QT"]].map(([v, l]) => `<button class="${glanceMode === v ? "on" : ""}" data-gmode="${v}">${l}</button>`).join("")}
  </div>`;
}

function glanceBodyHtml(g = glanceStats()) {
  return `${glanceSwitchHtml()}${glanceMode === "qt" ? `<div id="glance-qt"><p class="muted small">QT 본문 범위를 모으는 중…</p></div>` : glanceReadHtml(g)}`;
}

function glanceReadHtml(g) {
  const pr = state.plan ? progress() : null;
  const read = g.otRead + g.ntRead;
  return `<div class="glance-top">
      <div class="gring-wrap">${glanceRingHtml(g.otRead, g.ntRead, read)}</div>
      <ul class="gring-legend">
        ${glanceSideHtml("ot", "구약", g.otRead, g.otTotal)}
        ${glanceSideHtml("nt", "신약", g.ntRead, g.ntTotal)}
        ${glanceSideHtml("rest", "아직 안 읽음", TOTAL_CHAPTERS - read, TOTAL_CHAPTERS)}
      </ul>
    </div>
    ${pr ? `<div id="book-detail">${bookSel ? bookDetailHtml(bookSel, copiedBySource(glanceMode)) : ""}</div>
    <h3 class="gl-group">권별 진행 <span class="muted small">권을 누르면 위에 읽은 기간과 복사한 구절이 나와요</span></h3>
    <div class="books">${booksGridHtml(pr, copiedByDate())}</div>` : ""}
    <p class="muted small">원 전체가 성경 전체예요. 구약과 신약을 색으로 나눠 보여 줘요.</p>`;
}

// QT 날짜마다 본문 범위(ref)와 그 범위가 걸치는 장 번호를 한 번만 받아 둠
async function loadQtCover(dates) {
  await Promise.all(dates.filter((d) => !qtCoverMap[d]).map(async (d) => {
    const ref = await qtPassageRef(d);
    if (ref) qtCoverMap[d] = { ref, idx: qtRanges(ref).map((r) => r.idx) };
  }));
}

async function fillGlanceQt() {
  const dates = [...qtCountDates()];
  await loadQtCover(dates);
  renderGlanceQt();
}

// 통독 표와 같은 모양: 위에 고리·구약/신약 합계, 아래에 권별 칸. 권을 누르면 날짜별 본문 범위
function renderGlanceQt() {
  const box = $("#glance-qt");
  if (!box || glanceMode !== "qt") return;
  const dates = [...qtCountDates()].sort();
  const covered = new Set(dates.flatMap((d) => qtCoverMap[d]?.idx || []));
  const perBook = BOOKS.map((b) => {
    const start = chapterIndex(b.code, 1);
    let n = 0;
    for (let i = start; i < start + b.chapters; i++) if (covered.has(i)) n++;
    const ds = dates.filter((d) => (qtCoverMap[d]?.idx || []).some((i) => i >= start && i < start + b.chapters));
    return { b, n, ds };
  }).filter((x) => x.n);
  const sumOf = (test) => perBook.filter((x) => x.b.testament === test).reduce((a, x) => a + x.n, 0);
  const otN = sumOf("OT"), ntN = sumOf("NT"), read = otN + ntN;
  const otTotal = BOOKS.filter((b) => b.testament === "OT").reduce((a, b) => a + b.chapters, 0);
  const ntTotal = TOTAL_CHAPTERS - otTotal;
  const monthPrefix = todayStr().slice(0, 7);
  const monthQt = dates.filter((d) => d.startsWith(monthPrefix)).length;
  const sel = perBook.find((x) => x.b.code === qtBookSel);
  box.innerHTML = `<p class="muted small">QT 본문 범위에 한 번이라도 든 장을 세어요. 전체 ${dates.length}일 · 이 달 ${monthQt}일 · 연속 ${qtStreak(qtCountDates())}일</p>
    <div class="glance-top">
      <div class="gring-wrap">${glanceRingHtml(otN, ntN, read)}</div>
      <ul class="gring-legend">
        ${glanceSideHtml("ot", "구약", otN, otTotal)}
        ${glanceSideHtml("nt", "신약", ntN, ntTotal)}
        ${glanceSideHtml("rest", "아직 안 다룸", TOTAL_CHAPTERS - read, TOTAL_CHAPTERS)}
      </ul>
    </div>
    <div id="qt-book-detail">${sel ? `<div class="book-detail"><h3>${sel.b.name} <span class="muted small">QT ${sel.ds.length}일 · ${sel.n}${chapUnit(sel.b)}</span></h3>
      <ul class="bd-list">${sel.ds.map((d) => `<li><b>${prettyDate(d)}</b> <span class="qt-ref">${esc(qtCoverMap[d].ref)}</span></li>`).join("")}</ul></div>` : ""}</div>
    <h3 class="gl-group">권별 QT <span class="muted small">권을 누르면 날짜별 QT 본문이 나와요</span></h3>
    ${perBook.length ? `<div class="books">${perBook.map((x) => {
      const p = Math.round((x.n / x.b.chapters) * 100);
      return `<button class="book qbook ${p === 100 ? "full" : ""} ${x.b.code === qtBookSel ? "sel" : ""}" data-qbook="${x.b.code}"><span>${x.b.name}</span><em>${x.n}/${x.b.chapters}</em>
        <div class="bar thin"><span style="width:${p}%"></span></div></button>`;
    }).join("")}</div>` : `<p class="muted small">아직 QT 본문 범위가 모이지 않았어요.</p>`}`;
}

function redrawGlanceBody() {
  const body = $("#glance-body");
  if (!body || body.hidden) return;
  body.innerHTML = glanceBodyHtml(); // 열 때만 그림(장 칸이 1,189개라서)
  if (glanceMode === "qt") fillGlanceQt();
}

function bindGlanceCard() {
  const t = $("#glance-toggle");
  if (!t) return;
  t.addEventListener("click", () => {
    glanceOpen = !glanceOpen;
    t.setAttribute("aria-expanded", String(glanceOpen));
    const body = $("#glance-body");
    body.hidden = !glanceOpen;
    if (glanceOpen && !body.innerHTML.trim()) redrawGlanceBody();
  });
  if (glanceOpen && glanceMode === "qt") fillGlanceQt();
  $("#glance-card").addEventListener("click", (e) => {
    const m = e.target.closest("[data-gmode]");
    if (m) {
      glanceMode = m.dataset.gmode;
      redrawGlanceBody();
      return;
    }
    const q = e.target.closest("[data-qbook]");
    if (!q) return;
    qtBookSel = qtBookSel === q.dataset.qbook ? null : q.dataset.qbook;
    renderGlanceQt();
  });
}
