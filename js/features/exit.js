// 뒤로 가기 · 종료 확인 (참고: dailymath 의 dashboard.js 방식)
//  · 크롬은 화면을 누르지 않은 채 pushState 하면 그 칸을 뒤로 가기에서 건너뛴다.
//    그래서 칸은 화면을 누르는 순간(pointerup·click)에만 쌓고, 바닥 위로 EXIT_KEEP 칸을 미리 채워 둔다.
//  · popstate 안에서는 절대 쌓지 않는다. 칸 번호는 history.state.appIdx 로 안다.
//  · 본문이 아닌 화면에서 뒤로 가기 → 본문으로. 본문에서 뒤로 가기 → 종료 확인 창
//    (종료 버튼은 화면 어디든 매번 랜덤 위치, ✕ 는 크게. 양이 ✕ 를 가리키며 붙잡음)
const EXIT_KEEP = 2;
const HOME = "#today";
let exitDepth = 0; // 우리가 쌓은 칸 수 (바닥 위)
let exitOpen = false;
let exiting = false;
let navClickAt = 0; // 메뉴 링크를 누른 시각(링크로 옮겨 가는 기록과 뒤로 가기를 구분)
let awayFromHome = false; // 본문이 아닌 화면으로 링크를 눌러 옮겨 갔는지

// 양이 붙잡는 말 (구질구질하게, 번갈아 나옴)
const EXIT_LINES = [
  "나 이렇게 가면 안 돼…ㅠ",
  "X 말고 나 좀 봐줘 ㅠㅠ",
  "다 잘못했어… 제발 조금만",
  "그 손가락 치우면 나 울어…",
  "같이 본 화면 아직 안 끝났잖아",
  "하찮은 거 아는데 조금만 더…",
  "밤새 생각날 것 같아 ㅜㅜ",
  "한 번만 쳐다봐 줄래? 응?",
  "나 버리는 거지… 알았어 ㅠ",
  "마지막으로, 조금만 더 있어줘…",
];

// 화면을 누를 때만 칸을 채움 (크롬이 사용자 동작으로 인정하는 순간)
function topUp() {
  if (exiting) return;
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

// 종료 버튼: 화면 전체에서 매번 다른 위치
function placeQuit(btn) {
  const w = window.innerWidth, h = window.innerHeight;
  const bw = btn.offsetWidth || 110, bh = btn.offsetHeight || 46;
  const left = 10 + Math.random() * Math.max(0, w - bw - 20);
  const top = 10 + Math.random() * Math.max(0, h - bh - 20);
  btn.style.left = `${Math.round(left)}px`;
  btn.style.top = `${Math.round(top)}px`;
}

function showExitSheep() {
  if (exitOpen) return;
  exitOpen = true;
  let lineIdx = Math.floor(Math.random() * EXIT_LINES.length);
  let timer = null;
  const close = () => {
    clearInterval(timer);
    pop.classList.add("bye");
    setTimeout(() => pop.remove(), 300);
    exitOpen = false;
    topUp(); // 계속 쓰는 중이므로 칸을 다시 채움 (화면 누름 = 사용자 동작)
  };
  const quit = () => {
    clearInterval(timer);
    pop.remove();
    exitOpen = false;
    exiting = true;
    if (exitDepth > 0) history.go(-exitDepth); // 바닥 칸으로 — 그 아래는 앱 밖이다
    try { window.close(); } catch (e) { /* 설치 앱이 아니면 무시 */ }
  };
  const pop = document.createElement("div");
  pop.className = "exit-pop";
  pop.setAttribute("role", "alertdialog");
  pop.setAttribute("aria-label", "종료 확인");
  pop.innerHTML = `<div class="exit-card">
      <button class="exit-x" aria-label="닫기">✕</button>
      <span class="exit-finger" aria-hidden="true">👉</span>
      <div class="exit-art"><p class="muted small">🐑 …</p></div>
      <p class="exit-msg">그냥 종료하시겠습니까?</p>
    </div>
    <button class="exit-quit">종료</button>`;
  pop.addEventListener("click", (e) => {
    if (e.target.closest(".exit-x") || e.target === pop) close();
    else if (e.target.closest(".exit-quit")) quit();
  });
  document.body.append(pop);
  const quitBtn = pop.querySelector(".exit-quit");
  placeQuit(quitBtn);
  const draw = () => {
    loadSheepArt().then(({ renderCard }) => {
      const ctx = document.createElement("canvas").getContext("2d");
      const measure = (text, fs) => { ctx.font = `700 ${fs}px "Noto Sans KR", "Malgun Gothic", sans-serif`; return ctx.measureText(text).width; };
      const svg = renderCard({ tier: "night", pose: "sob", say: EXIT_LINES[lineIdx] }, measure)
        .replace('width="720" height="360"', 'width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
      const art = pop.querySelector(".exit-art");
      if (art) art.innerHTML = svg;
    }).catch(() => {
      const art = pop.querySelector(".exit-art");
      if (art) art.innerHTML = `<p class="exit-fallback">😭</p><p class="muted small">${EXIT_LINES[lineIdx]}</p>`;
    });
  };
  draw();
  // 번갈아 가며 말하기
  timer = setInterval(() => { lineIdx = (lineIdx + 1) % EXIT_LINES.length; draw(); }, 3200);
}

// 화면을 누를 때마다 칸 채우기 (popstate 안에서는 하지 않음)
window.addEventListener("pointerup", topUp, { passive: true });
window.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("a[href^='#']");
  if (a) { navClickAt = Date.now(); awayFromHome = a.getAttribute("href") !== HOME; }
  topUp();
}, { passive: true });

// 처음 열면 통독 본문이 보이도록 (주소가 QT·관리여도 본문으로). 연결 코드(#link=)는 그대로 둠
try {
  if (!location.hash.startsWith("#link=") && location.hash !== HOME) history.replaceState(history.state, "", HOME);
} catch (err) { /* 무시 */ }

window.addEventListener("popstate", (e) => {
  if (exiting) { if (exitDepth > 0) history.back(); return; }
  if (exitOpen) return; // 종료 창이 떠 있는 동안은 그대로 둠
  const st = e.state || {};
  // 메뉴 링크로 새로 옮겨 간 기록은 뒤로 가기가 아니므로 그대로 둠
  if (st.appIdx === undefined && Date.now() - navClickAt < 800) return;
  // 화면이 바뀐 뒤에 판단해야 하므로 잠시 뒤에 봄
  setTimeout(() => {
    if (st.appIdx !== undefined) exitDepth = st.appIdx;
    const away = awayFromHome;
    awayFromHome = false;
    if (away || !isHome()) { goHome(); return; }   // 다른 화면 → 본문
    showExitSheep();                               // 본문에서 뒤로 → 종료 확인
  }, 30);
});
