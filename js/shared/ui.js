// 여러 화면이 함께 쓰는 패널(아래/옆에서 열리는 시트)과 토스트 알림

let sheetTab = null; // 열린 패널: "table" | "tools" | "view" | "note" | null
let toastTimer;

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
