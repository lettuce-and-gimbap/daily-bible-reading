// 시작점: 주소의 #today / #table / #qt / #stats에 맞는 화면을 그림
// 스크립트 순서는 index.html 참고 (core → shared → features → main)

function route() {
  const r = (location.hash || "#today").slice(1);
  document.body.classList.remove("full", "sheet-open");
  sheetTab = null;
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.route === r));
  if (r === "stats") renderStats();
  else if (r === "qt") renderQt();
  else if (r === "table") { history.replaceState(history.state, "", "#stats"); return route(); } // 통독표는 관리 화면 안으로 옮김
  else renderToday();
  window.scrollTo(0, 0);
  queueReminderSync();
  updateStreakChip();
  updateAdminBadge();
}
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#link=")) route(); });

applyTheme();
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

// 나갔다 돌아오면 브라우저가 예전 화면(예전 버전)을 그대로 보여 줄 수 있어서, 새 버전이 올라왔으면 새로 불러옴
async function refreshIfNewVersion() {
  try {
    const html = await (await fetch(`index.html?check=${Date.now()}`, { cache: "no-store" })).text();
    const latest = (html.match(/js\/main\.js\?v=([\d.]+)/) || [])[1];
    const current = (document.querySelector('script[src*="main.js"]').src.match(/v=([\d.]+)/) || [])[1];
    if (latest && current && latest !== current) location.reload(); // 기록을 바꾸지 않고 같은 자리에서 새로 불러옴
  } catch (e) { /* 오프라인이면 그대로 둠 */ }
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && document.visibilityState === "visible" && window.__appLoadedAt && Date.now() - window.__appLoadedAt > 3000) refreshIfNewVersion(); });
window.__appLoadedAt = Date.now();
// 처음 여는 순간에는 확인하지 않음(열자마자 새로고침되면 뒤로 가기 칸이 다시 쌓여야 해서). 나갔다가 돌아올 때만 확인
window.addEventListener("pageshow", (e) => { if (e.persisted) refreshIfNewVersion(); });
