// 현황 화면: 통독·QT 요약 카드, 월간 달력, 최근 기록, 권별 진행, 계획·백업

let calMonth = todayStr().slice(0, 7); // 현황 달력에 보이는 달 "YYYY-MM"

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
