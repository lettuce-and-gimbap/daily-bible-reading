// 한 가지만 고르는 버튼 묶음(.seg, .opts)과 상단 메뉴(.tabs)에 슬라이드 막대를 붙임: 고른 칸으로 막대가 밀려 감
// 여러 개를 함께 고르는 묶음(.on이 둘 이상)은 막대 없이 그대로 둠

const SLIDE_SEL = ".seg, .opts, .tabs";

function syncSlide(box) {
  if (!box || !box.isConnected) return;
  const cls = box.classList.contains("tabs") ? "active" : "on";
  const items = [...box.children].filter((el) => el.tagName === "BUTTON" || el.tagName === "A");
  const ons = items.filter((el) => el.classList.contains(cls));
  let thumb = box.querySelector(":scope > .slide-thumb");
  if (ons.length !== 1) {
    if (box.classList.contains("sl-active")) box.classList.remove("sl-active"); // 같은 값으로 다시 쓰면 변화 기록이 생겨 무한 반복이 됨
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
  if (!box.classList.contains("sl-active")) box.classList.add("sl-active");
  const on = ons[0], b = box.getBoundingClientRect(), r = on.getBoundingClientRect();
  thumb.style.width = `${r.width}px`;
  thumb.style.height = `${r.height}px`;
  // 가로로 밀리는 줄(예: 관계도 장 고르기)에서도 맞도록 스크롤 위치를 더함
  thumb.style.transform = `translate(${r.left - b.left + box.scrollLeft - box.clientLeft}px, ${r.top - b.top + box.scrollTop - box.clientTop}px)`;
  if (thumb.style.transition === "none") { void thumb.offsetWidth; thumb.style.transition = ""; }
}

function syncAllSlides(root = document) {
  root.querySelectorAll(SLIDE_SEL).forEach((box) => syncSlide(box));
}

// 버튼의 .on(메뉴의 .active)이 바뀌면 그 묶음을 다시 맞춤. 누른 뒤 어떤 순서로 바뀌어도 잡히도록 변화 자체를 봄
new MutationObserver((muts) => {
  const boxes = new Set();
  muts.forEach((m) => {
    if (m.type === "attributes") {
      const box = m.target.closest && m.target.closest(SLIDE_SEL);
      if (box) boxes.add(box);
    } else {
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches && n.matches(SLIDE_SEL)) boxes.add(n);
        if (n.querySelectorAll) n.querySelectorAll(SLIDE_SEL).forEach((b) => boxes.add(b));
      });
    }
  });
  boxes.forEach((b) => syncSlide(b));
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

window.addEventListener("resize", () => syncAllSlides());
