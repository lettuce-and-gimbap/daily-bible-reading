// 뒤로가기로 앱을 나갈 때: 바로 나가지 않고 양이 울상으로 붙잡음. 한 번 더 누르면 종료, X로 닫으면 계속 사용
// 방법: 앱을 처음 열 때 지금 화면을 "첫 화면"으로 표시하고, 그 위에 가짜 한 칸(guard)을 쌓아 둠.
//   뒤로가기 → guard에서 첫 화면으로 돌아오는 순간 울상 창을 띄움. 그 상태에서 한 번 더 누르면 브라우저가 앱을 나감.
//   X로 닫으면 다시 guard를 쌓아 둠.
const EXIT_FIRST = "appEntry";
const EXIT_GUARD = "appGuard";
let exitOpen = false;

// 첫 화면에 있을 때만 guard를 쌓음 (이미 guard 위라면 그대로)
function armExitGuard() {
  try {
    if (history.state && history.state[EXIT_FIRST]) history.pushState({ [EXIT_GUARD]: 1 }, "", location.href);
  } catch (e) { /* 기록을 못 쓰면 그냥 둠 */ }
}

function showExitSheep() {
  if (exitOpen) return;
  exitOpen = true;
  const close = () => {
    pop.classList.add("bye");
    setTimeout(() => pop.remove(), 300);
    exitOpen = false;
    armExitGuard(); // 계속 쓰는 중이므로 다음 뒤로가기도 다시 붙잡음
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

// 앱을 열 때 한 번: 지금 화면을 첫 화면으로 표시하고 그 위에 guard를 쌓음.
// 이미 guard 위에 있으면(새로고침·다시 불러오기) 기록을 건드리지 않음 → 기록이 겹쳐 쌓이지 않게
try {
  const st = history.state || {};
  if (!st[EXIT_GUARD]) {
    history.replaceState({ ...st, [EXIT_FIRST]: 1 }, "", location.href);
    armExitGuard();
  }
} catch (e) { /* 무시 */ }

window.addEventListener("popstate", (e) => {
  if (e.state && e.state[EXIT_FIRST]) showExitSheep();
});
// 브라우저는 사용자가 누르지 않은 상태에서 쌓은 기록을 뒤로가기에서 건너뛰기도 해서,
// 첫 화면에 있을 때 사용자가 누르는 순간마다 guard를 다시 쌓아 둠 (매 뒤로가기마다 양이 나오게)
document.addEventListener("pointerdown", armExitGuard, true);
document.addEventListener("keydown", armExitGuard, true);
