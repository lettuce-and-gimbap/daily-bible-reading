// 시작점: 주소의 #today / #qt / #stats에 맞는 화면을 그림
// 스크립트 순서는 index.html 참고 (core → shared → features → main)

function route() {
  const r = (location.hash || "#today").slice(1);
  document.body.classList.remove("full", "sheet-open");
  sheetTab = null;
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.route === r));
  if (r === "stats") renderStats();
  else if (r === "qt") renderQt();
  else renderToday();
  window.scrollTo(0, 0);
  queueReminderSync();
}
window.addEventListener("hashchange", route);

route();
