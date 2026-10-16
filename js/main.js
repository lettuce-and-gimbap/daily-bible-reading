// 시작점: 주소의 #today / #table / #qt / #stats에 맞는 화면을 그림
// 스크립트 순서는 index.html 참고 (core → shared → features → main)

function route() {
  const r = (location.hash || "#today").slice(1);
  document.body.classList.remove("full", "sheet-open");
  sheetTab = null;
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.route === r));
  if (r === "stats") renderStats();
  else if (r === "qt") renderQt();
  else if (r === "table") { location.replace("#stats"); return; } // 통독표는 관리 화면 안으로 옮김
  else renderToday();
  window.scrollTo(0, 0);
  queueReminderSync();
  updateStreakChip();
}
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#link=")) route(); });

// QR(#link=코드)로 열었으면 먼저 그 코드로 로그인, 로그인돼 있으면 서버 기록과 맞춘 뒤 그림
claimLinkFromHash().then((linked) => { route(); if (!linked) syncAccount(); maybeShowChangelog(); });

// 앱 새로 불러오기: 브라우저에 남은 예전 화면 파일까지 다시 받은 뒤 새로고침 (기록은 이 기기에 그대로 있음)
document.getElementById("app-reload").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  if (btn.classList.contains("spin")) return;
  btn.classList.add("spin");
  const urls = [location.href.split("#")[0], ...[...document.querySelectorAll("script[src], link[rel=stylesheet]")].map((el) => el.src || el.href)];
  await Promise.all([
    ...urls.map((u) => fetch(u, { cache: "reload" }).catch(() => {})),
    new Promise((r) => setTimeout(r, 450)), // 방금 쓴 메모가 저장될 시간
  ]);
  location.reload();
});
