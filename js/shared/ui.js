// 여러 화면이 함께 쓰는 패널(아래/옆에서 열리는 시트)과 토스트 알림

let sheetTab = null; // 열린 패널: "table" | "tools" | "view" | "note" | null
let toastTimer;
let onSheetChange = null; // 패널이 열리거나 닫힐 때 화면이 따로 할 일 (통독 화면의 탭 표시)

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

// 패널(본문·요약·메모 등)별로 마지막에 머문 스크롤 위치를 기억해, 다른 탭·화면에 갔다 와도 그 자리로 돌아옴
const sheetScroll = {};
let sheetScrollOn = false; // 복원하는 동안은 끄고, 끝나면 켜서 이후 스크롤을 기록
let sheetScrollRun = 0;

function sheetKeyOf(tab) {
  const where = location.hash === "#qt"
    ? "qt:" + (typeof qtDate !== "undefined" ? qtDate : "")
    : "r:" + (typeof currentChapter !== "undefined" ? currentChapter : "") + ":" + (typeof viewingDay !== "undefined" ? viewingDay : "");
  return where + "|" + tab;
}

// 본문은 서버에서 받아 와 늦게 그려지므로, 내용이 충분히 길어질 때까지 잠깐 기다리며 위치를 맞춤
function restoreSheetScroll(key) {
  const body = $("#sheet-body");
  const want = sheetScroll[key] || 0;
  const run = ++sheetScrollRun;
  let tries = 0;
  const tick = () => {
    if (run !== sheetScrollRun) return;
    body.scrollTop = want;
    if (!want || Math.abs(body.scrollTop - want) < 2 || ++tries > 40) { sheetScrollOn = true; return; }
    setTimeout(tick, 100);
  };
  tick();
}

document.addEventListener("scroll", (e) => {
  if (e.target && e.target.id === "sheet-body" && sheetScrollOn && sheetTab) sheetScroll[sheetKeyOf(sheetTab)] = e.target.scrollTop;
}, true);

// 탭 전환 슬라이드: 통독·QT 탭 순서에 따라 내용이 좌우에서 밀려 들어옴 (닫히는 탭은 그 자리에서 기억만 함)
const TAB_ORDER = { reader: ["summary", "verses", "tools", "godpia"], qt: ["read", "note", "relations", "godpia"] };
const lastTabBy = { reader: "verses", qt: "read" };
function rememberTab(group, tab) {
  const order = TAB_ORDER[group];
  if (!order || !order.includes(tab)) return;
  const prev = lastTabBy[group];
  lastTabBy[group] = tab;
  if (prev && prev !== tab) lastSlide = order.indexOf(tab) > order.indexOf(prev) ? "slide-l" : "slide-r";
}
let lastSlide = "";
function slideGroupOf(renderFn) {
  if (typeof renderReaderSheet === "function" && renderFn === renderReaderSheet) return "reader";
  if (typeof renderQtSheet === "function" && renderFn === renderQtSheet) return "qt";
  return null;
}

function openSheet(tab, renderFn) {
  const key = sheetKeyOf(tab);
  sheetScrollOn = false;
  const group = slideGroupOf(renderFn);
  const dir = group ? (rememberTab(group, tab), lastSlide) : "";
  lastSlide = "";
  sheetTab = tab;
  $("#sheet").hidden = false;
  $("#sheet-bg").hidden = false;
  document.body.classList.add("sheet-open");
  renderFn();
  if (dir) {
    const body = $("#sheet-body");
    body.classList.remove("slide-l", "slide-r");
    void body.offsetWidth;
    body.classList.add(dir);
  }
  restoreSheetScroll(key);
  if (onSheetChange) onSheetChange();
}

function closeSheet() {
  sheetTab = null;
  if (!$("#sheet")) return;
  $("#sheet").hidden = true;
  $("#sheet-bg").hidden = true;
  document.body.classList.remove("sheet-open");
  if (onSheetChange) onSheetChange();
}

function setSheetTitle(tabs, title) {
  $("#sheet-title").innerHTML = tabs
    ? `<div class="seg">${tabs.map(([k, label]) => `<button data-tab="${k}" class="${k === sheetTab ? "on" : ""}">${label}</button>`).join("")}</div>`
    : `<h2>${title}</h2>`;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sheetTab) closeSheet();
});

// action을 주면 알림 옆에 버튼(예: "메모 보기")이 붙고, 누를 시간을 주려고 조금 더 오래 보여 줌
function showToast(msg, action) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  if (action) {
    const b = document.createElement("button");
    b.className = "toast-action";
    b.textContent = action.label;
    b.addEventListener("click", () => { t.hidden = true; action.onClick(); });
    t.append(b);
  }
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, action ? 4500 : 2600);
}

// 읽기 화면(갓피아 위)에 떠 있는 붙여넣기 버튼
function pasteFabHtml() {
  return `<button class="paste-fab" id="paste-fab" aria-label="복사한 구절을 메모에 붙여넣기">📋 붙여넣기</button>`;
}

// 클립보드로 복사. 실패(권한 없음 등)하면 직접 복사할 수 있게 내용을 보여 줌
async function copyText(text, successMsg) {
  if (!text.trim()) {
    showToast("복사할 내용이 없어요");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg);
  } catch (e) {
    prompt("아래 내용을 복사하세요", text);
  }
}

// ── 구절 목록 글씨 크기 (50%~200%, 구절 선택 패널과 메모 구절 고르기에 함께 씀) ──
function fzScale() {
  const v = Number(state.settings.fz);
  return v >= 0.5 && v <= 2 ? v : 1;
}
function fzControl() {
  return `<span class="fz" role="group" aria-label="글씨 크기">
    <button type="button" class="fz-btn" data-fz="-1" aria-label="글씨 작게" ${fzScale() <= 0.5 ? "disabled" : ""}>가<small>−</small></button>
    <b>${Math.round(fzScale() * 100)}%</b>
    <button type="button" class="fz-btn" data-fz="1" aria-label="글씨 크게" ${fzScale() >= 2 ? "disabled" : ""}>가<small>+</small></button>
  </span>`;
}
// 다시 그리지 않고 그 자리에서 크기만 바꿈 (스크롤 위치 유지)
function fzStep(root, dir) {
  const v = Math.min(2, Math.max(0.5, Math.round((fzScale() + dir * 0.1) * 10) / 10));
  state.settings.fz = v;
  persist();
  root.style.setProperty("--fz", v);
  root.querySelectorAll(".fz").forEach((g) => {
    g.querySelector("b").textContent = `${Math.round(v * 100)}%`;
    g.querySelector('[data-fz="-1"]').disabled = v <= 0.5;
    g.querySelector('[data-fz="1"]').disabled = v >= 2;
  });
}

// 위 로고 옆의 연속 일수: 통독 화면에서는 "목표를 채운 날" 연속, QT 화면에서는 QT를 마친 날 연속
// (통독 목표를 못 채운 날은 끊김. 오늘 아직 안 읽었어도 어제까지 이어졌으면 그대로 보임)
function updateStreakChip() {
  const el = document.getElementById("streak-chip");
  if (!el) return;
  const r = (location.hash || "#today").slice(1);
  let n = null, today = false, tip = "";
  if (r === "qt") {
    const days = qtCountDates();
    n = qtStreak(days); today = days.has(todayStr());
    tip = `QT 연속 ${n}일`;
  } else if (r !== "stats" && r !== "table" && state.plan) {
    const days = readGoalDates();
    n = streak(days); today = days.has(readingDateStr());
    tip = `통독 연속 ${n}일 (하루 목표 분량을 채운 날만 셈)`;
  }
  el.hidden = n === null;
  if (n === null) return;
  el.classList.toggle("on", today);
  el.classList.toggle("qt", r === "qt");
  el.title = tip;
  el.querySelector("b").textContent = n;
}
