// QT 화면: 갓피아 "날마다 솟는 샘물"의 본문·질문·해설·기도를 받아 앱이 직접 보여 주고(worker/의 /qt + /bible),
// 갓피아 화면은 "갓피아 원문" 탭을 누를 때만 팝업으로 띄움. 날짜 이동·QT 완료·묵상 노트

let qtDate = todayStr();

function renderQt() {
  sheetTab = null;
  document.body.classList.add("full");
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
        </div>
        <div class="rd-tabs" id="q-tabs">${QT_TABS.map(([k, label]) => `<button data-qtab="${k}">${label}</button>`).join("")}</div>
      </div>
      <div class="rd-clip"><div class="qt-read" id="q-read"><p class="muted small">본문 불러오는 중…</p></div>${pasteFabHtml()}${sheetShell()}</div>
      <div class="rd-bottom" id="q-bottom"></div>
    </div>`;
  onSheetChange = syncQtTabs;
  $("#q-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-qtab]");
    if (!b) return;
    if (b.dataset.qtab === "read") closeSheet();
    else openSheet(b.dataset.qtab, renderQtSheet);
  });
  syncQtTabs();
  fillQtRead(qtDate);

  bindSheetChrome(renderQtSheet);
  $("#paste-fab").addEventListener("click", () => quickPasteVerses("qt"));
  prefetchVerses("qt"); // 그날 QT 본문 장을 미리 받아 둠

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
    if (b.id === "q-done") {
      const wasDone = !!(state.qt[qtDate] && state.qt[qtDate].done);
      saveQt({ done: !wasDone });
      if (!wasDone) showToast("QT 완료! 오늘도 말씀과 함께 🙏");
      refreshQtBar();
    }
  });

  const body = $("#sheet-body");
  body.addEventListener("click", (e) => {
    if (e.target.closest("#q-copy-note")) return copyText($("#q-note-text").value, "묵상 노트를 복사했어요");
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
    t = setTimeout(() => saveQtNote(e.target.value), 400);
  });

  refreshQtBar();
}

// 묵상 노트 저장 (직접 쓸 때와 구절을 지울 때 함께 씀)
function saveQtNote(value) {
  saveQt({ note: value });
  const st = $("#q-status");
  if (st) st.textContent = "저장됨 ✓";
  refreshQtBar();
}

function saveQt(patch) {
  const next = { ...(state.qt[qtDate] || { done: false, note: "" }), ...patch };
  if (!next.done && !next.note.trim()) delete state.qt[qtDate];
  else state.qt[qtDate] = next;
  persist();
}

function refreshQtBar() {
  syncQtTabs();
  const entry = state.qt[qtDate] || { done: false, note: "" };
  const s = streak(qtDoneDates());
  $("#q-bottom").innerHTML = `
    <div class="rd-main">
      ${entry.done
        ? `<button class="btn soft big" id="q-done">✓ QT 완료 · 취소하기</button>`
        : `<button class="btn primary big" id="q-done">🙏 QT 완료하기</button>`}
    </div>
    <span class="streak" title="QT 연속 일수">🔥 <b>${s}</b>일</span>`;
}

const QT_TABS = [["read", "본문 · 묵상"], ["verses", "구절"], ["note", "묵상 노트"], ["godpia", "갓피아 원문"]];

function syncQtTabs() {
  document.querySelectorAll("#q-tabs [data-qtab]").forEach((b) => {
    b.classList.toggle("on", b.dataset.qtab === (sheetTab || "read"));
    if (b.dataset.qtab === "note") b.classList.toggle("has", !!(state.qt[qtDate] || {}).note);
  });
}

// 본문(보기 설정 역본 1~2개 나란히) + 갓피아의 질문·길잡이·기도
async function fillQtRead(date) {
  const box = $("#q-read");
  let d;
  try { d = await qtInfo(date); } catch (e) { d = null; }
  if (date !== qtDate || !box.isConnected) return;
  if (!d || !d.ref) {
    box.innerHTML = `<p class="muted small">QT를 불러오지 못했어요. 인터넷 연결을 확인하거나 <b>갓피아 원문</b> 탭에서 보세요.</p>`;
    return;
  }
  const vers = pickVersions();
  const vname = (c) => (VERSIONS.find((v) => v.code === c) || {}).name || c;
  box.innerHTML = `<header class="qt-head"><small>${esc(d.ref)}</small><h2>${esc(d.title || "")}</h2></header>
    <div class="qt-passage" id="q-passage"><p class="muted small">본문 불러오는 중…</p></div>
    ${(d.sections || []).map((s) => `<section class="qt-sec"><h3>${esc(s.name)}</h3>
      ${s.qs.length ? `<ol>${s.qs.map((q) => `<li>${esc(q.replace(/^\d+\.\s*/, ""))}</li>`).join("")}</ol>` : ""}
      ${s.text ? s.text.split("\n").map((p) => `<p>${esc(p)}</p>`).join("") : ""}</section>`).join("")}
    <p class="muted small qt-src">본문·묵상 자료: 갓피아 날마다 솟는 샘물</p>`;
  try {
    const parts = await Promise.all(qtRanges(d.ref).map((r) => versePairs(r.idx, (n) => n >= r.lo && n <= r.hi, vers)));
    if (date !== qtDate) return;
    $("#q-passage").innerHTML = versePairsHtml(parts.flat(), vers.map(vname));
  } catch (e) {
    $("#q-passage").innerHTML = `<p class="muted small">본문을 불러오지 못했어요. <b>갓피아 원문</b> 탭에서 볼 수 있어요.</p>`;
  }
}

// "열왕기상 15:25~32", "창세기 1:26~2:3" → [{ idx, lo, hi }] (장이 넘어가면 장마다)
function qtRanges(ref) {
  const r = refsInText(ref)[0];
  if (!r) return [];
  const m = ref.match(/(\d+):(\d+)\s*[~-]\s*(\d+):(\d+)/);
  if (!m) return [{ idx: r.idx, lo: r.lo || 1, hi: r.hi || 999 }];
  const c1 = Number(m[1]), c2 = Number(m[3]);
  const out = [];
  for (let c = c1; c <= c2; c++) out.push({ idx: r.idx + (c - c1), lo: c === c1 ? Number(m[2]) : 1, hi: c === c2 ? Number(m[4]) : 999 });
  return out;
}

function renderQtSheet() {
  if (sheetTab === "godpia") { // 갓피아 화면은 필요할 때만 팝업으로
    setSheetTitle(null, `갓피아 원문 <a class="chip-btn" href="${godpiaQtUrl(qtDate)}" target="_blank" rel="noopener" aria-label="새 창으로 열기">↗</a>`);
    $("#sheet-body").innerHTML = `<div class="sheet-frame"><iframe class="rd-frame" title="갓피아 오늘의 QT" src="${godpiaQtUrl(qtDate)}" ${GODPIA_SANDBOX}></iframe></div>`;
    return;
  }
  if (sheetTab === "verses") {
    setSheetTitle(null, "구절 선택");
    return mountQtPicker($("#sheet-body"));
  }
  setSheetTitle(null, "묵상 노트");
  const entry = state.qt[qtDate] || { done: false, note: "" };
  const history = Object.keys(state.qt).filter((d) => d !== qtDate && (state.qt[d].done || state.qt[d].note)).sort().reverse().slice(0, 20);
  $("#sheet-body").innerHTML = `
    <section class="tool-card">
      <h3 class="label">${prettyDate(qtDate)}</h3>
      <textarea id="q-note-text" rows="8" placeholder="관찰 · 느낌 · 적용 · 기도를 적어 보세요.">${esc(entry.note)}</textarea>
      <div class="inline between">
        <button class="btn soft small" id="q-copy-note">📋 노트 전체 복사</button>
        <span class="muted small" id="q-status">자동 저장돼요</span>
      </div>
      <div class="mp" id="q-note-picker"></div>
      <p class="muted small hint">갓피아 화면 위의 <b>📋 붙여넣기</b> 버튼으로 구절을 바로 넣을 수 있어요. 다 쓰면 여기서 <b>노트 전체 복사</b>로 다른 곳에 옮겨 보세요.
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
  memoPickMount($("#q-note-picker"), $("#q-note-text"), saveQtNote, renderQtSheet);
}
