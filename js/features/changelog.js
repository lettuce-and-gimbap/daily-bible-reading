// 업데이트 기록: 새 버전을 처음 열 때 바뀐 점을 한 번 알려 주고, 관리 탭에서 지난 기록도 볼 수 있음 (모든 사용자)
// 기록 내용은 data/changelog.json (새 버전마다 맨 앞에 한 덩어리를 추가). 버전은 index.html의 ?v= 값과 같게 맞춘다.
// 번호 규칙: 큰 내용 수정(권 단위 보강, 새 기능 묶음)은 정수가 오르고(9 → 10), 간단한 UI·한두 장 수정은 소수(9.1 → 9.2)로 올림

const CHANGELOG_SEEN_KEY = "daily5-seen-version";
let changelogData = null;

function appVersion() {
  const el = document.querySelector('script[src*="main.js"]');
  const m = el && el.src.match(/v=([\d.]+)/);
  return m ? m[1] : "";
}
const verParts = (v) => String(v).split(".").map((n) => Number(n) || 0);
function verCompare(a, b) { // a가 더 새 버전이면 1
  const x = verParts(a), y = verParts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; }
  return 0;
}
function changelogEnabled() { return true; } // 모든 사용자에게 보임
async function loadChangelog() {
  if (changelogData) return changelogData;
  try {
    const res = await fetch("data/changelog.json", { cache: "no-cache" });
    changelogData = res.ok ? await res.json() : [];
  } catch (e) { changelogData = []; }
  return changelogData;
}

function changelogEntryHtml(en) {
  return `<article class="cl-entry ${en.major ? "major" : ""}">
    <h4><b>v${esc(en.ver)}</b><span>${esc(en.title)}</span>${en.date ? `<time>${esc(en.date.slice(5).replace("-", "/"))}</time>` : ""}</h4>
    <ul>${en.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  </article>`;
}

// since가 있으면 그 뒤에 새로 바뀐 것을 위에 크게, 나머지는 접어서 보여 줌
async function openChangelog(since) {
  const log = await loadChangelog();
  document.querySelector(".cl-pop")?.remove();
  const cur = appVersion();
  const fresh = since ? log.filter((e) => verCompare(e.ver, since) > 0 && verCompare(e.ver, cur) <= 0) : log.slice(0, 1);
  const rest = log.filter((e) => !fresh.includes(e));
  const pop = document.createElement("div");
  pop.className = "cl-pop";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "업데이트 기록");
  pop.innerHTML = `<div class="cl-card">
    <div class="cl-head"><h3>🆕 ${fresh.length ? "새로 바뀐 점" : "업데이트 기록"} <small>현재 v${esc(cur)}</small></h3><button class="icon-btn" data-cl="close" aria-label="닫기">✕</button></div>
    <div class="cl-body">
      ${fresh.length ? fresh.map(changelogEntryHtml).join("") : ""}
      ${rest.length ? `<details ${fresh.length ? "" : "open"}><summary>지난 업데이트 ${rest.length}개</summary>${rest.map(changelogEntryHtml).join("")}</details>` : ""}
      ${log.length ? "" : `<p class="muted small">기록을 불러오지 못했어요.</p>`}
    </div></div>`;
  pop.addEventListener("click", (e) => { if (e.target === pop || e.target.closest("[data-cl=close]")) pop.remove(); });
  document.body.append(pop);
}

// 지금 서버에 올라간 최신 버전 (브라우저가 남겨 둔 옛 화면인지 확인하려고)
async function latestVersion() {
  try {
    const html = await (await fetch(`index.html?check=${Date.now()}`, { cache: "no-store" })).text();
    return (html.match(/js\/main\.js\?v=([\d.]+)/) || [])[1] || "";
  } catch (e) { return ""; }
}

// 앱을 열 때: 최신 화면이고, 이 기기가 본 버전보다 새 버전일 때만 한 번 보여 줌
// 옛 화면(최신이 아님)이면 아무것도 하지 않음 → 새 화면이 다시 불러와질 때 판단
async function maybeShowChangelog() {
  const cur = appVersion();
  if (!cur) return;
  const latest = await latestVersion();
  if (latest && latest !== cur) return;
  let seen = "";
  try { seen = localStorage.getItem(CHANGELOG_SEEN_KEY) || ""; } catch (e) { /* 저장소를 못 쓰면 매번 보임 */ }
  if (seen === cur) return;
  if (seen && verCompare(cur, seen) <= 0) return; // 본 버전보다 낮으면 기록을 낮추지 않음
  try { localStorage.setItem(CHANGELOG_SEEN_KEY, cur); } catch (e) { /* 무시 */ }
  openChangelog(seen || null);
}

function changelogCardHtml() {
  return `<section class="card cl-row">
    <button class="btn ghost" id="cl-open">🆕 업데이트 기록 보기<small class="muted">현재 v${esc(appVersion())}</small></button>
    <button class="btn ghost" id="plan-open">📋 벅수의 계획</button>
  </section>`;
}
document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#cl-open")) openChangelog(null); });
document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#plan-open")) openPlan(); });
