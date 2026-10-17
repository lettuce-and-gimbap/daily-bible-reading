// 뒤로 가기 · 양 창 (참고: dailymath 의 dashboard.js 방식)
//  · 크롬은 화면을 누르지 않은 채 pushState 하면 그 칸을 뒤로 가기에서 건너뛴다.
//    그래서 칸은 화면을 누르는 순간(pointerup·click)에만 쌓고, 바닥 위로 EXIT_KEEP 칸을 미리 채워 둔다.
//  · popstate 안에서는 절대 쌓지 않는다. 칸 번호는 history.state.appIdx 로 안다.
//  · 본문이 아닌 화면에서 뒤로 가기 → 본문으로. 본문에서 뒤로 가기 → 양 창 (✕ 는 계속, 한 번 더 뒤로 가면 종료)
const EXIT_KEEP = 2;
const HOME = "#today";
let exitDepth = 0; // 우리가 쌓은 칸 수 (바닥 위)
let exitOpen = false;
let navClickAt = 0;
let awayFromHome = false; // 본문이 아닌 화면으로 링크를 눌러 옮겨 갔는지 (뒤로 가면 양이 아니라 본문으로)

// 처음 열면 통독 본문이 보이도록 (주소가 QT·관리여도 본문으로). 연결 코드(#link=)는 그대로 둠
try {
  if (!location.hash.startsWith("#link=") && location.hash !== HOME) history.replaceState(history.state, "", HOME);
} catch (err) { /* 무시 */ } // 메뉴 링크를 누른 시각(링크로 옮겨 가는 기록과 뒤로 가기를 구분)

// 화면을 누를 때만 칸을 채움 (크롬이 사용자 동작으로 인정하는 순간)
function topUp() {
  try {
    while (exitDepth < EXIT_KEEP) {
      exitDepth++;
      history.pushState({ appIdx: exitDepth }, "", location.href);
    }
  } catch (e) { /* 기록을 못 쓰면 그냥 둠 */ }
}

// 지금 화면이 본문(통독 본문)인지
function isHome() {
  if (location.hash !== HOME) return false;
  const reader = document.querySelector(".rd.reading");
  return !reader || sheetTab === "verses";
}

// 본문이 아니면 본문으로. 열린 다른 시트는 본문 탭으로
function goHome() {
  if (location.hash !== HOME) {
    history.replaceState(history.state, "", HOME);
    route();
    return;
  }
  if (document.querySelector(".rd.reading") && sheetTab !== "verses") openSheet("verses", renderReaderSheet);
}

function showExitSheep() {
  if (exitOpen) return;
  exitOpen = true;
  const close = () => {
    pop.classList.add("bye");
    setTimeout(() => pop.remove(), 300);
    exitOpen = false;
    topUp(); // 계속 쓰는 중이므로 칸을 다시 채움 (화면 누름 = 사용자 동작)
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

// 화면을 누를 때마다 칸 채우기 (popstate 안에서는 하지 않음)
window.addEventListener("pointerup", topUp, { passive: true });
window.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("a[href^='#']");
  if (a) { navClickAt = Date.now(); awayFromHome = a.getAttribute("href") !== HOME; }
  topUp();
}, { passive: true });

window.addEventListener("popstate", (e) => {
  const st = e.state || {};
  // 메뉴 링크로 새로 옮겨 간 기록은 뒤로 가기가 아니므로 그대로 둠
  if (st.appIdx === undefined && Date.now() - navClickAt < 800) return;
  // 화면이 바뀐 뒤에 판단해야 하므로 잠시 뒤에 봄
  setTimeout(() => {
    if (st.appIdx !== undefined) exitDepth = st.appIdx;
    const away = awayFromHome;
    awayFromHome = false;
    if (away || !isHome()) { goHome(); return; }   // 다른 화면 → 본문
    showExitSheep();                               // 본문에서 뒤로 → 양
  }, 30);
});
