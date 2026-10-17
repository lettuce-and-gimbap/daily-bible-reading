// 앱 나가기: 관리 탭의 "앱 나가기" 버튼을 누르면 울상인 양이 붙잡음.
// "계속 볼래요"를 누르면 그대로 쓰고, "나갈래요"를 누르면 창을 닮. (뒤로가기 가로채기는 쓰지 않음)
let exitOpen = false;

function showExitSheep() {
  if (exitOpen) return;
  exitOpen = true;
  const close = () => {
    pop.classList.add("bye");
    setTimeout(() => pop.remove(), 300);
    exitOpen = false;
  };
  const pop = document.createElement("div");
  pop.className = "exit-pop";
  pop.setAttribute("role", "alertdialog");
  pop.setAttribute("aria-label", "앱 나가기 확인");
  pop.innerHTML = `<div class="exit-card"><button class="icon-btn exit-x" aria-label="닫기">✕</button>
    <div class="exit-art"><p class="muted small">🐑 …</p></div>
    <p class="exit-msg">정말 나갈 거예요?</p>
    <div class="exit-actions"><button class="btn ghost small" data-exit="stay">계속 볼래요</button><button class="btn small" data-exit="leave">나갈래요</button></div></div>`;
  pop.addEventListener("click", (e) => {
    if (e.target === pop || e.target.closest(".exit-x") || e.target.closest("[data-exit=stay]")) return close();
    if (e.target.closest("[data-exit=leave]")) {
      close();
      window.close(); // 스크립트로 열린 창이면 닫힘
      history.back(); // 아니면 이전 화면으로
    }
  });
  document.body.append(pop);
  loadSheepArt().then(({ renderCard }) => {
    const ctx = document.createElement("canvas").getContext("2d");
    const measure = (text, fs) => { ctx.font = `700 ${fs}px "Noto Sans KR", "Malgun Gothic", sans-serif`; return ctx.measureText(text).width; };
    const svg = renderCard({ tier: "night", pose: "sob", say: "ㄱ..가게..?" }, measure)
      .replace('width="720" height="360"', 'width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
    pop.querySelector(".exit-art").innerHTML = svg;
  }).catch(() => { pop.querySelector(".exit-art").innerHTML = `<p class="exit-fallback">😭 ㄱ..가게..?</p>`; });
}

document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#app-exit")) showExitSheep(); });
