// QT 화면: 갓피아 "날마다 솟는 샘물"의 본문·질문·해설·기도를 받아 앱이 직접 보여 주고(worker/의 /qt + /bible),
// 갓피아 화면은 "갓피아" 탭을 누를 때만 팝업으로 띄움. 날짜 이동·QT 완료·묵상 노트

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
          <span class="q-check" id="q-check"></span>
        </div>
        <div class="seg rd-seg" id="q-tabs">${QT_TABS.map(([k, label]) => `<button data-qtab="${k}">${label}</button>`).join("")}</div>
      </div>
      <div class="rd-clip"><div class="qt-read" id="q-read"><div id="q-content"><p class="muted small">본문 불러오는 중…</p></div></div>
        <div class="qp-fixed" id="q-selbar" hidden>
          <span class="vp-n">절을 눌러 고르세요</span>
          <button class="btn text small" data-qa="all">전체</button>
          <button class="btn text small" data-qa="clear">해제</button>
          <button class="btn soft small" data-qa="copy">📋 복사</button>
          <button class="btn primary small" data-qa="paste">노트에 붙이기</button>
        </div>${pasteFabHtml()}${sheetShell()}</div>
    </div>`;
  onSheetChange = syncQtTabs;
  $("#q-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-qtab]");
    if (!b) return;
    if (b.dataset.qtab === "read") { rememberTab("qt", "read"); closeSheet(); }
    else openSheet(b.dataset.qtab, renderQtSheet);
  });
  syncQtTabs();
  fillQtRead(qtDate);
  bindQtContent();

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

  // 우상단 읽음 스위치 (통독과 같은 모양): 켜면 QT 완료, 끄면 취소
  $("#q-check").addEventListener("click", (e) => {
    const b = e.target.closest("#q-done");
    if (!b || b.disabled) return;
    const wasDone = !!(state.qt[qtDate] && state.qt[qtDate].done);
    b.classList.toggle("on");
    b.setAttribute("aria-checked", String(b.classList.contains("on")));
    b.disabled = true;
    setTimeout(() => {
      saveQt({ done: !wasDone });
      if (!wasDone) showToast("QT 완료! 오늘도 말씀과 함께 🙏");
      refreshQtBar();
    }, 170);
  });

  const body = $("#sheet-body");
  body.addEventListener("click", (e) => {
    if (e.target.closest("#q-copy-note")) return copyText(qtTextOf(qtCurrentFromDom()), "묵상 노트를 복사했어요");
    const a = e.target.closest("[data-qt]");
    if (!a) return;
    e.preventDefault();
    closeSheet();
    setDate(a.dataset.qt);
  });
  const timers = {};
  body.addEventListener("input", (e) => {
    const el = e.target;
    const key = el.dataset && el.dataset.akey !== undefined ? `a${el.dataset.akey}` : (el.id.match(/^q-(observe|reflect|note)$/) || [])[0];
    if (!key) return;
    clearTimeout(timers[key]);
    timers[key] = setTimeout(() => saveQtFromTextarea(el), 400);
  });

  refreshQtBar();
}

// QT 기록: 질문마다 쓴 답(answers) + 구절·기도 메모(note).
// 예전에 쓴 "내용 관찰·연구"(observe) · "묵상·느낀 점"(reflect) 칸은 글이 있으면 그대로 보여 줌
const QT_LEGACY = [["observe", "내용 관찰 · 연구"], ["reflect", "묵상 · 느낀 점"]];
const qtEmpty = () => ({ done: false, note: "", observe: "", reflect: "", answers: {} });
const keyOrder = (a, b) => { const [a1, a2] = a.split(".").map(Number), [b1, b2] = b.split(".").map(Number); return a1 - b1 || a2 - b2; };
// 글이 있는 답만 질문 순서대로: [[키, { s: 섹션 이름, q: 질문, a: 내 답 }]]
const qtAnswers = (q) => Object.entries((q && q.answers) || {}).filter(([, v]) => v && String(v.a || "").trim()).sort((x, y) => keyOrder(x[0], y[0]));
const qtHasText = (q) => !!q && (["note", "observe", "reflect"].some((k) => String(q[k] || "").trim()) || qtAnswers(q).length > 0);

// 칸 이름을 붙여 하나로 합친 글 (복사·내보내기·기록 보기용). 빈 칸은 뺌
function qtTextOf(q) {
  if (!q) return "";
  const parts = qtAnswers(q).map(([, v]) => `[${v.s || "묵상"}] ${v.q}\n${String(v.a).trim()}`);
  QT_LEGACY.forEach(([k, label]) => { if (String(q[k] || "").trim()) parts.push(`[${label}]\n${String(q[k]).trim()}`); });
  if (String(q.note || "").trim()) parts.push(`[구절 · 기도 메모]\n${String(q.note).trim()}`);
  return parts.join("\n\n");
}

// 화면에 쓰고 있는 내용까지 반영한 기록 (아직 저장 전인 마지막 글자도 복사되게)
function qtCurrentFromDom() {
  const cur = { ...qtEmpty(), ...(state.qt[qtDate] || {}) };
  const answers = { ...(cur.answers || {}) };
  document.querySelectorAll("textarea[data-akey]").forEach((el) => {
    if (el.value.trim()) answers[el.dataset.akey] = { s: el.dataset.s, q: el.dataset.q, a: el.value };
    else delete answers[el.dataset.akey];
  });
  ["observe", "reflect", "note"].forEach((k) => { const el = $(`#q-${k}`); if (el) cur[k] = el.value; });
  return { ...cur, answers };
}

// 칸 하나 저장 (질문 아래 칸 · 묵상 노트 탭의 칸 공통)
function saveQtFromTextarea(el) {
  if (el.dataset.akey !== undefined) saveQtAnswer(el.dataset.akey, el.dataset.s, el.dataset.q, el.value);
  else saveQtField(el.id.replace(/^q-/, ""), el.value);
}

function saveQtAnswer(key, s, q, a) {
  const answers = { ...((state.qt[qtDate] || {}).answers || {}) };
  if (a.trim()) answers[key] = { s, q, a }; else delete answers[key];
  saveQt({ answers });
  qtSaved();
}

// 다른 탭에서 고친 답을 본문 · 묵상 화면의 질문 아래 칸에도 반영 (쓰는 중인 칸은 건드리지 않음)
function refreshQtAnswerBoxes() {
  const answers = (state.qt[qtDate] || {}).answers || {};
  document.querySelectorAll("#q-content textarea[data-akey]").forEach((el) => {
    const v = answers[el.dataset.akey] ? answers[el.dataset.akey].a : "";
    if (document.activeElement !== el && el.value !== v) el.value = v;
  });
}

function qtSaved() {
  ["#q-status", "#qr-status"].forEach((id) => { const st = $(id); if (st) st.textContent = "저장됨 ✓"; });
  refreshQtBar();
}

// 묵상 노트 저장 (직접 쓸 때와 구절을 지울 때 함께 씀)
function saveQtNote(value) { saveQtField("note", value); }

function saveQtField(field, value) {
  saveQt({ [field]: value });
  qtSaved();
}

function saveQt(patch) {
  const next = { ...qtEmpty(), ...(state.qt[qtDate] || {}), ...patch };
  if (!next.done && !qtHasText(next)) delete state.qt[qtDate];
  else state.qt[qtDate] = next;
  persist();
}

function refreshQtBar() {
  syncQtTabs();
  const done = !!(state.qt[qtDate] || {}).done;
  const box = $("#q-check");
  if (box) box.innerHTML = `<button class="read-switch ${done ? "on" : ""}" id="q-done" role="switch" aria-checked="${done}"
      title="${done ? "QT 완료 취소" : "QT를 마쳤어요"}">
      <span class="rs-label">${done ? "더 읽을래요" : "읽었어요"}</span>
      <span class="rs-track" aria-hidden="true"><span class="rs-knob"></span></span>
    </button>`;
  if (typeof updateStreakChip === "function") updateStreakChip();
}

const QT_TABS = [["read", "본문 · 묵상"], ["note", "묵상 노트"], ["godpia", "갓피아"]];

function syncQtTabs() {
  refreshQtAnswerBoxes();
  document.querySelectorAll("#q-tabs [data-qtab]").forEach((b) => {
    b.classList.toggle("on", b.dataset.qtab === (sheetTab || "read"));
  });
}

// 본문(역본 1~2개, 절을 눌러 골라 노트에 붙임) + 갓피아의 질문(질문마다 바로 아래에 내 답 칸) · 길잡이 · 기도
async function fillQtRead(date) {
  const box = $("#q-content");
  let d;
  try { d = await qtInfo(date); } catch (e) { d = null; }
  if (date !== qtDate || !box.isConnected) return;
  if (!d || !d.ref) {
    box.innerHTML = `<p class="muted small">QT를 불러오지 못했어요. 인터넷 연결을 확인하거나 <b>갓피아</b> 탭에서 보세요.</p>`;
    return;
  }
  const answers = (state.qt[qtDate] || {}).answers || {};
  box.innerHTML = `<header class="qt-head"><small>${esc(d.ref)}</small><h2>${esc(d.title || "")}</h2></header>
    <div class="qt-passage" id="q-passage"></div>
    ${(d.sections || []).map((s, si) => `<section class="qt-sec"><h3>${esc(s.name)}</h3>
      ${s.qs.length ? `<ol>${s.qs.map((q, qi) => {
        const text = q.replace(/^\d+\.\s*/, "");
        return `<li><span class="qt-q">${esc(text)}</span>
          <textarea class="qt-ans" data-akey="${si}.${qi}" data-s="${esc(s.name)}" data-q="${esc(text)}" rows="3" placeholder="여기에 적어 보세요">${esc((answers[`${si}.${qi}`] || {}).a || "")}</textarea></li>`;
      }).join("")}</ol>` : ""}
      ${s.text ? s.text.split("\n").map((p) => `<p>${esc(p)}</p>`).join("") : ""}</section>`).join("")}
    <p class="muted small qt-src">본문·묵상 자료: 갓피아 날마다 솟는 샘물 · <span id="qr-status">질문 아래에 쓴 글은 자동 저장되고 묵상 노트 탭에 모여요</span></p>`;
  paintQtPassage(date, d);
}

// 본문 칸: 그날 QT 범위의 절만 보여 주고, 절을 눌러 골라서 복사하거나 묵상 노트에 붙임
let qtPassage = { rows: [] };
async function paintQtPassage(date, d) {
  const box = $("#q-passage");
  if (!box) return;
  const vers = pickVersions();
  const vname = (c) => (VERSIONS.find((v) => v.code === c) || {}).name || c;
  box.style.setProperty("--fz", fzScale());
  box.innerHTML = `<div class="vp-zoom"><span class="muted small">글씨 크기</span>${fzControl()}</div>
    <div class="opts vp-vers">${VERSIONS.map((v) => `<button class="opt ${vers.includes(v.code) ? "on" : ""}" data-pv="${v.code}">${v.name}</button>`).join("")}</div>
    <div class="qp-body"><p class="muted small">본문 불러오는 중…</p></div>`;
  qtPassage = { rows: [], d };
  const bar = $("#q-selbar");
  if (bar) bar.hidden = true;
  try {
    const ranges = qtRanges(d.ref);
    const parts = await Promise.all(ranges.map((r) => versePairs(r.idx, (n) => n >= r.lo && n <= r.hi, vers)));
    if (date !== qtDate || !box.isConnected) return;
    const rows = parts.flatMap((p, k) => p.map((r) => ({ idx: ranges[k].idx, ...r })));
    qtPassage = { rows, d };
    const names = vers.map(vname);
    box.querySelector(".qp-body").innerHTML = `<div class="vp-list">${rows.map((r, i) => `
        <label class="vp-row">
          <input type="checkbox" class="sr-only" data-ri="${i}">
          <span class="vp-num">${esc(r.label)}</span>
          <span class="vp-txt">${esc(r.texts[0])}${r.texts[1] ? `<small><i>${esc(names[1] || "")}</i> ${esc(r.texts[1])}</small>` : ""}</span>
        </label>`).join("")}</div>`;
    $("#q-selbar").hidden = false;
    qtPassageCount();
  } catch (e) {
    if ($("#q-selbar")) $("#q-selbar").hidden = true;
    box.querySelector(".qp-body").innerHTML = `<p class="muted small">본문을 불러오지 못했어요. <b>갓피아</b> 탭에서 볼 수 있어요.</p>`;
  }
}

function qtPassageCount() {
  const bar = $("#q-selbar");
  if (!bar) return;
  const n = $("#q-passage").querySelectorAll("input[data-ri]:checked").length;
  bar.querySelector(".vp-n").textContent = n ? `${n}절 선택` : "절을 눌러 고르세요";
  bar.querySelectorAll('[data-qa="copy"], [data-qa="paste"]').forEach((b) => { b.disabled = !n; });
}

// 고른 절 → 장마다 "권 장:절 / 역본1 줄들 / --- / 역본2 줄들" 양식 (장이 둘이면 빈 줄로 나눔)
function qtPassageQuote() {
  const picked = [...$("#q-passage").querySelectorAll("input[data-ri]:checked")].map((c) => qtPassage.rows[Number(c.dataset.ri)]);
  const byChap = new Map();
  picked.forEach((r) => byChap.set(r.idx, [...(byChap.get(r.idx) || []), r]));
  return [...byChap].map(([idx, rows]) => {
    const nums = rows.flatMap((r) => { const [a, b] = labelSpan(r.label); return Array.from({ length: b - a + 1 }, (_, k) => a + k); });
    const g1 = rows.map((r) => `${r.label} ${r.texts[0]}`);
    const g2 = rows.filter((r) => r.texts[1]).map((r) => `${r.label} ${r.texts[1]}`);
    return { idx, text: `${versesRef(CHAPTERS[idx], nums)}\n${g1.join("\n")}${g2.length ? `\n${VERSION_DIVIDER}\n${g2.join("\n")}` : ""}` };
  });
}

// 본문 · 묵상 화면(#q-content) 안의 눌림·입력을 모아 처리 (화면 안쪽만 바뀌어도 한 번만 연결)
function bindQtContent() {
  const content = $("#q-content");
  const clip = $(".rd-clip"); // 본문 · 묵상 화면과 아래에 고정된 절 선택 막대가 모두 들어 있음
  clip.addEventListener("change", (e) => { if (e.target.closest("input[data-ri]")) qtPassageCount(); });
  clip.addEventListener("click", (e) => {
    const box = $("#q-passage");
    if (!box) return;
    const fz = e.target.closest("[data-fz]");
    if (fz) return fzStep(box, Number(fz.dataset.fz));
    const pv = e.target.closest("[data-pv]");
    if (pv) { // 역본 고르기: 최대 2개, 먼저 고른 게 위에 나옴
      const now = pickVersions();
      const next = now.includes(pv.dataset.pv) ? now.filter((c) => c !== pv.dataset.pv) : [...now, pv.dataset.pv].slice(-2);
      if (!next.length) return;
      state.settings.pick = next;
      persist();
      return paintQtPassage(qtDate, qtPassage.d);
    }
    const act = (e.target.closest("[data-qa]") || {}).dataset;
    if (!act) return;
    if (act.qa === "all" || act.qa === "clear") {
      box.querySelectorAll("input[data-ri]").forEach((c) => { c.checked = act.qa === "all"; });
      return qtPassageCount();
    }
    const quotes = qtPassageQuote();
    if (!quotes.length) return;
    if (act.qa === "copy") {
      quotes.forEach((q) => logCopied(q.idx, q.text.split("\n")[0]));
      return copyText(quotes.map((q) => q.text).join("\n\n"), `${quotes[0].text.split("\n")[0]} 복사했어요`);
    }
    insertQuote("qt", quotes.map((q) => q.text).join("\n\n"));
    box.querySelectorAll("input[data-ri]").forEach((c) => { c.checked = false; });
    qtPassageCount();
  });
  const timers = {};
  content.addEventListener("input", (e) => {
    const el = e.target;
    if (!el.matches || !el.matches("textarea[data-akey]")) {
      return;
    }
    el.style.height = "auto"; // 쓴 만큼 칸이 늘어남
    el.style.height = `${Math.min(el.scrollHeight + 2, 420)}px`;
    clearTimeout(timers[el.dataset.akey]);
    timers[el.dataset.akey] = setTimeout(() => saveQtAnswer(el.dataset.akey, el.dataset.s, el.dataset.q, el.value), 400);
  });
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
    setSheetTitle(null, `갓피아 <a class="chip-btn" href="${godpiaQtUrl(qtDate)}" target="_blank" rel="noopener" aria-label="새 창으로 열기">↗</a>`);
    $("#sheet-body").innerHTML = `<div class="sheet-frame"><iframe class="rd-frame" title="갓피아 오늘의 QT" src="${godpiaQtUrl(qtDate)}" ${GODPIA_SANDBOX}></iframe></div>`;
    return;
  }
  setSheetTitle(null, "묵상 노트");
  const entry = state.qt[qtDate] || qtEmpty();
  const history = Object.keys(state.qt).filter((d) => d !== qtDate && (state.qt[d].done || qtHasText(state.qt[d]))).sort().reverse().slice(0, 20);
  const answers = qtAnswers(entry);
  $("#sheet-body").innerHTML = `
    <section class="tool-card">
      <h3 class="label">${prettyDate(qtDate)}</h3>
      ${answers.length ? answers.map(([k, v]) => `
        <label class="qt-field">
          <b>${esc(v.q)}</b><small>${esc(v.s || "")}</small>
          <textarea class="qt-ans" data-akey="${k}" data-s="${esc(v.s || "")}" data-q="${esc(v.q)}" rows="4">${esc(v.a)}</textarea>
        </label>`).join("") : `<p class="muted small">본문 · 묵상 화면의 질문 아래 칸에 쓴 글이 여기에 모여요.</p>`}
      ${QT_LEGACY.filter(([k]) => String(entry[k] || "").trim()).map(([k, label]) => `
        <label class="qt-field">
          <b>${label}</b><small>예전에 쓴 글</small>
          <textarea id="q-${k}" rows="5">${esc(entry[k])}</textarea>
        </label>`).join("")}
      <label class="qt-field">
        <b>구절 · 기도 메모</b><small>붙여넣은 구절과 기도제목을 적어 두세요</small>
        <textarea id="q-note" rows="5" placeholder="구절과 기도제목">${esc(entry.note || "")}</textarea>
      </label>
      <div class="mp" id="q-note-picker"></div>
      <div class="inline between">
        <button class="btn soft small" id="q-copy-note">📋 노트 전체 복사</button>
        <span class="muted small" id="q-status">자동 저장돼요</span>
      </div>
      <p class="muted small hint">본문 · 묵상 화면에서 <b>절을 눌러 골라 "노트에 붙이기"</b>를 하면 위 구절 · 기도 메모 칸에 붙어요. 다 쓰면 <b>노트 전체 복사</b>로 질문별 답과 메모를 한꺼번에 다른 곳에 옮겨 보세요.
        노트는 이 기기에 저장되고, <a href="#stats">관리 → 기록 내보내기</a>에서 엑셀·텍스트로 받을 수 있어요.</p>
    </section>
    ${history.length ? `
      <h3 class="label">지난 QT</h3>
      <ul class="timeline">
        ${history.map((d) => `
          <li>
            <a href="#qt" data-qt="${d}" class="tl-date">${prettyDate(d)}</a>
            ${state.qt[d].done ? `<span class="badge good">완료</span>` : ""}
            ${qtHasText(state.qt[d]) ? `<p class="note">${esc(qtTextOf(state.qt[d]))}</p>` : ""}
          </li>`).join("")}
      </ul>` : ""}`;
  memoPickMount($("#q-note-picker"), $("#q-note"), saveQtNote, renderQtSheet);
}
