// 한 가지만 고르는 버튼 묶음(.seg, .opts)에 슬라이드 막대를 붙임: 버튼을 누르면 막대가 그 버튼까지 밀려 감
// 여러 개를 함께 고르는 묶음(.on이 둘 이상)은 막대 없이 그대로 둠

const SLIDE_SEL = ".seg, .opts";

function syncSlide(box) {
  if (!box || !box.isConnected) return;
  const buttons = [...box.children].filter((el) => el.tagName === "BUTTON");
  const ons = buttons.filter((b) => b.classList.contains("on"));
  let thumb = box.querySelector(":scope > .slide-thumb");
  if (ons.length !== 1) {
    box.classList.remove("sl-active");
    if (thumb) thumb.style.display = "none";
    return;
  }
  if (!thumb) {
    thumb = document.createElement("span");
    thumb.className = "slide-thumb";
    thumb.setAttribute("aria-hidden", "true");
    box.prepend(thumb);
    thumb.style.transition = "none"; // 처음 자리는 밀리지 않고 바로 놓음
  }
  thumb.style.display = "";
  box.classList.add("sl-active");
  const on = ons[0], b = box.getBoundingClientRect(), r = on.getBoundingClientRect();
  thumb.style.width = `${r.width}px`;
  thumb.style.height = `${r.height}px`;
  thumb.style.transform = `translate(${r.left - b.left - box.clientLeft}px, ${r.top - b.top - box.clientTop}px)`;
  if (thumb.style.transition === "none") { void thumb.offsetWidth; thumb.style.transition = ""; }
}

function syncAllSlides(root = document) {
  root.querySelectorAll(SLIDE_SEL).forEach((box) => syncSlide(box));
}

// 누른 뒤 다음 프레임에 맞춤: 각 화면의 클릭 처리가 .on을 바꾼 뒤에 막대를 움직이기 위해서
document.addEventListener("click", (e) => {
  const box = e.target.closest && e.target.closest(".seg > button, .opts > button");
  if (!box) return;
  const group = box.parentElement;
  setTimeout(() => syncSlide(group), 0); // 프레임 대신 타이머: 숨은 창에서도 바로 움직이도록
});

// 화면이 새로 그려질 때(묶음이 새로 생길 때) 자리를 맞춤
new MutationObserver((muts) => {
  muts.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    if (n.matches && n.matches(SLIDE_SEL)) syncSlide(n);
    if (n.querySelectorAll) syncAllSlides(n);
  }));
}).observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener("resize", () => syncAllSlides());
