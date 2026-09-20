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
