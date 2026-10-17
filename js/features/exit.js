// 뒤로가기 흐름. 기록은 [처음 페이지(GUARD)] → [본문(ROOT)] → [다른 화면(APPSUB)] 순으로 쌓임
//  · 다른 화면(QT·관리·통독 안의 요약·메모·갓피아)에서 뒤로 가기 → 본문으로 돌아옴
//  · 본문에서 뒤로 가기 → 항상 양이 울상으로 붙잡음(GUARD로 돌아가는 순간). 한 번 더 누르면 종료, ✕로 닫으면 계속 사용
const EXIT_GUARD = "appGuard";
const EXIT_ROOT = "appRoot";
const EXIT_SUB = "appSub";
const HOME = "#today";
let exitOpen = false;

// 본문을 기록의 맨 위에 다시 올림 (양 창을 닫은 뒤 등)
function pushRoot() {
  try { history.pushState({ [EXIT_ROOT]: 1 }, "", HOME); } catch (e) { /* 기록을 못 쓰면 그냥 둠 */ }
}

function showExitSheep() {
  if (exitOpen) return;
  exitOpen = true;
  const close = () => {
    pop.classList.add("bye");
    setTimeout(() => pop.remove(), 300);
    exitOpen = false;
    pushRoot(); // 계속 쓰는 중이므로 본문을 다시 쌓아 둠
  };
  const pop = document.createElement("div");
  pop.className = "exit-pop";
  pop.setAttribute("role", "alertdialog");
  pop.setAttribute("aria-label", "앱 종료 확인");
  pop.innerHTML = `<div class="exit-card"><button class="icon-btn exit-x" aria-label="닫기">✕</button>
    <div class="exit-art"><p class="muted small">🐑 …</p></div>
    <p class="exit-msg">뒤로가기를 한 번 더 누르면 앱이 닫혀요.<br><span class="muted small">계속 보려면 ✕ 를 눌러 주세요</span></p></div>`;
  pop.addEventListener("click", (e) => { if (e.target === pop || e.target.closest(".exit-x")) close(); });
  document.body.append(pop);
  loadSheepArt().then(({ renderCard }) => {
    const ctx = document.createElement("canvas").getContext("2d");
    const measure = (text, fs) => { ctx.font = `700 ${fs}px "Noto Sans KR", "Malgun Gothic", sans-serif`; return ctx.measureText(text).width; };
    const svg = renderCard({ tier: "night", pose: "sob", say: "ㄱ..가게..?" }, measure)
      .replace('width="720" height="360"', 'width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
    pop.querySelector(".exit-art").innerHTML = svg;
  }).catch(() => { pop.querySelector(".exit-art").innerHTML = `<p class="exit-fallback">😭 ㄱ..가게..?</p>`; });
}

// 본문으로 돌아옴: 통독 안의 다른 화면이 열려 있으면 본문 탭으로 바꿈
function goHome() {
  if (location.hash !== HOME) { history.replaceState(history.state, "", HOME); route(); return; }
  if (document.querySelector(".rd.reading") && sheetTab !== "verses") openSheet("verses", renderReaderSheet);
}

// 처음 열 때: 지금 페이지를 양이 붙잡는 자리로 두고, 그 위에 본문을 쌓음
// (이미 쌓여 있으면, 즉 새로고침이면 건드리지 않음)
try {
  const st = history.state || {};
  if (!st[EXIT_GUARD] && !st[EXIT_ROOT]) {
    const link = location.hash.startsWith("#link=");
    if (!link && location.hash !== HOME) history.replaceState(history.state, "", HOME);
    history.replaceState({ [EXIT_GUARD]: 1 }, "", location.href);
    history.pushState({ [EXIT_ROOT]: 1 }, "", location.href);
  }
} catch (e) { /* 무시 */ }

window.addEventListener("popstate", (e) => {
  const st = e.state || {};
  if (st[EXIT_GUARD]) { showExitSheep(); return; }   // 본문에서 뒤로 → 양
  if (st[EXIT_ROOT]) { goHome(); return; }            // 다른 화면에서 뒤로 → 본문
  if (st[EXIT_SUB]) {                                 // 본문이 아닌 기록으로 돌아옴 → 본문으로
    history.replaceState({ [EXIT_ROOT]: 1 }, "", HOME);
    route();
    return;
  }
  // 메뉴 링크로 새로 옮겨 간 기록: 다음 뒤로 가기에서 본문으로 돌아오도록 표시만 함
  try { history.replaceState({ [EXIT_SUB]: 1 }, "", location.href); } catch (err) { /* 무시 */ }
});
