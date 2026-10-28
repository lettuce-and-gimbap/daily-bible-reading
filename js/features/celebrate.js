// 그날 분량을 다 읽으면 하찮은 양이 3초 동안 축하해 주고 사라짐
// 그림은 알림과 같은 픽셀 양(tools/notify-art/art.js). 이름이 겹치지 않게 함수 안에서 renderCard만 꺼내 씀

let sheepArt = null;
function loadSheepArt() {
  if (!sheepArt) {
    sheepArt = fetch("tools/notify-art/art.js?v=sheep-soft-face2-20261028").then((r) => r.text())
      .then((src) => new Function(`${src}\nreturn { renderCard };`)())
      .catch((e) => { sheepArt = null; throw e; });
  }
  return sheepArt;
}

const CHEER_LINES = ["오늘 분량 끝!", "다 읽음 ㅎㅎ", "오늘도 해냄!", "참 잘했어요"];

async function celebrateDay(dayIdx) {
  let svg = "";
  try {
    const { renderCard } = await loadSheepArt();
    const ctx = document.createElement("canvas").getContext("2d");
    const measure = (text, fs) => { ctx.font = `700 ${fs}px "Noto Sans KR", "Malgun Gothic", sans-serif`; return ctx.measureText(text).width; };
    svg = renderCard({ tier: "done", pose: "cheer", say: CHEER_LINES[Math.floor(Math.random() * CHEER_LINES.length)] }, measure)
      .replace('width="720" height="360"', 'width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
  } catch (e) { /* 그림을 못 불러오면 글로만 */ }
  document.querySelector(".cheer-pop")?.remove();
  const pop = document.createElement("div");
  pop.className = "cheer-pop";
  pop.setAttribute("role", "status");
  pop.innerHTML = `<div class="cheer-card">${svg || "<p class=\"cheer-fallback\">🐑 오늘 분량 끝!</p>"}
    <p class="cheer-sub">Day ${dayIdx + 1} 분량을 모두 읽었어요</p></div>`;
  document.body.append(pop);
  const close = () => { pop.classList.add("bye"); setTimeout(() => pop.remove(), 350); };
  pop.addEventListener("click", close);
  setTimeout(close, 3000);
}
