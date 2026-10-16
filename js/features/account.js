// 계정 · 여러 기기 동기화 (서버: worker/src/account.js, D1)
// - 아이디·비밀번호로 로그인하면 기록(state)을 서버에 두고 기기마다 맞춤
// - 로그인한 기기에서 연결 코드(QR)를 만들면 새 기기는 비밀번호 없이 그 코드로 로그인
// - 처음 로그인할 때는 이 기기 기록과 계정 기록을 합침(읽은 장·메모·QT 모두 보존)
//   그 뒤로는 바뀐 쪽을 그대로 올리고(dirty), 다른 기기에서 열면 서버 것을 받아 옴. 오프라인에서 바꾼 게 있으면 다시 합침

const ACCOUNT_KEY = "daily5-account"; // { id, token, syncedAt, dirty }
let account = loadAccount();
let accountTimer = null;
let accountBusy = false;

function loadAccount() {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY)) || null; } catch (e) { return null; }
}
function saveAccount() {
  try {
    if (account) localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    else localStorage.removeItem(ACCOUNT_KEY);
  } catch (e) { /* 저장소를 못 쓰면 이번 실행 동안만 로그인 */ }
}

async function accountApi(path, body, method = body ? "POST" : "GET") {
  const res = await fetch(`${PUSH_SERVER}/account/${path}`, {
    method,
    headers: { "content-type": "application/json", ...(account ? { Authorization: `Bearer ${account.token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && account && !["login", "signup", "claim"].includes(path)) {
    account = null; // 다른 기기에서 로그아웃했거나 토큰이 사라짐
    saveAccount();
  }
  if (!res.ok) throw new Error(data.error || `서버 응답 ${res.status}`);
  return data;
}

// 두 기록 합치기: 읽은 장은 모두(먼저 읽은 날짜), 메모는 같으면 하나·다르면 이어 붙임, QT 완료는 어느 쪽이든 완료면 완료
function mergeStates(local, remote) {
  if (!remote) return local;
  const text = (a = "", b = "") => {
    if (!a.trim()) return b;
    if (!b.trim() || a.includes(b)) return a;
    if (b.includes(a)) return b;
    return `${a}\n\n${b}`;
  };
  const read = { ...remote.read };
  Object.entries(local.read || {}).forEach(([k, d]) => { read[k] = read[k] && read[k] < d ? read[k] : d; });
  const dayNotes = { ...remote.dayNotes };
  Object.entries(local.dayNotes || {}).forEach(([k, v]) => { dayNotes[k] = text(v, dayNotes[k]); });
  const qt = { ...remote.qt };
  Object.entries(local.qt || {}).forEach(([k, v]) => {
    const r = qt[k] || { done: false, note: "" };
    const answers = { ...(r.answers || {}) };
    Object.entries(v.answers || {}).forEach(([ak, av]) => { answers[ak] = { ...av, a: text(av.a, (answers[ak] || {}).a) }; });
    qt[k] = { done: !!(v.done || r.done), note: text(v.note, r.note), observe: text(v.observe, r.observe), reflect: text(v.reflect, r.reflect), answers };
  });
  const useLocalPlan = local.plan && (!remote.plan || (local.planAt || 0) >= (remote.planAt || 0));
  return {
    ...remote, ...local, read, dayNotes, qt,
    copies: [...new Map([...(remote.copies || []), ...(local.copies || [])].map((c) => [`${c.d}|${c.i}|${c.v}`, c])).values()],
    plan: useLocalPlan ? local.plan : remote.plan,
    planAt: useLocalPlan ? local.planAt : remote.planAt,
  };
}

function applyRemoteState(next) {
  const base = defaultState();
  state = { ...base, ...next, plan: normalizePlan(next.plan), settings: normalizeSettings({ ...base.settings, ...(next.settings || {}) }) };
  saveState(state);
}

// first: 처음 로그인(무조건 합침). 아니면 이 기기에 안 올린 변경이 있을 때만 합치고, 없으면 서버 것을 그대로 받음
async function syncAccount({ first = false, quiet = true } = {}) {
  if (!account || accountBusy) return;
  accountBusy = true;
  try {
    const remote = await accountApi("data");
    const before = JSON.stringify(state);
    if (first || account.dirty || !remote.data) {
      applyRemoteState(mergeStates(state, remote.data));
      const put = await accountApi("data", { data: state });
      account.syncedAt = put.updated;
    } else if (remote.updated > (account.syncedAt || 0)) {
      applyRemoteState(remote.data);
      account.syncedAt = remote.updated;
    }
    account.dirty = false;
    saveAccount();
    if (JSON.stringify(state) !== before) route(); // 다른 기기 기록이 들어오면 화면 다시 그림
    else if (!quiet) refreshAccountCard();
    if (!quiet) showToast("☁️ 동기화했어요");
  } catch (e) {
    if (!quiet) showToast(`동기화 실패: ${e.message}`);
    refreshAccountCard();
  } finally {
    accountBusy = false;
  }
}

// persist()마다 불림: 표시만 해 두고 3초 모아서 올림
function queueAccountSync() {
  if (!account) return;
  account.dirty = true;
  saveAccount();
  clearTimeout(accountTimer);
  accountTimer = setTimeout(async () => {
    if (accountBusy) return queueAccountSync();
    try {
      const put = await accountApi("data", { data: state });
      account.syncedAt = put.updated;
      account.dirty = false;
      saveAccount();
    } catch (e) { /* 다음에 열 때 다시 합침 */ }
  }, 3000);
}

// 관리자 계정: 아래 아이디로 로그인하면 관리자 권한이 켜짐 (권한은 여기에 하나씩 추가)
const ADMIN_IDS = ["bucksoo"];
function isAdmin() {
  return !!account && ADMIN_IDS.includes(String(account.id).toLowerCase());
}
// 관리자 표시: 좌상단 빈 공간에 성경과 펜을 합친 작은 그림
function updateAdminBadge() {
  const el = document.getElementById("admin-badge");
  if (el) el.hidden = !isAdmin();
}

async function signInWith(path, body) {
  const r = await accountApi(path, body);
  account = { id: r.id, token: r.token, syncedAt: 0, dirty: false };
  saveAccount();
  await syncAccount({ first: true });
  updateAdminBadge();
  showToast(`👋 ${r.id} 계정으로 로그인했어요`);
}

// 주소가 #link=코드 이면 그 코드로 로그인 (QR로 열었을 때)
async function claimLinkFromHash() {
  const m = location.hash.match(/^#link=([A-Za-z0-9]{6,12})$/);
  if (!m) return false;
  history.replaceState(null, "", "#stats");
  try {
    if (account) showToast("이미 로그인돼 있어요");
    else await signInWith("claim", { code: m[1] });
  } catch (e) {
    alert(`연결하지 못했어요: ${e.message}`);
  }
  return true;
}

// ── 관리 화면의 카드 ──
function accountCardHtml() {
  return `<section class="card" id="acct-card">${accountCardInner()}</section>`;
}

function accountCardInner() {
  if (!account) {
    return `
      <h2>계정 · 여러 기기</h2>
      <p class="muted small">로그인하면 기록이 서버에 저장돼서 휴대폰·태블릿·컴퓨터 어디서든 이어서 할 수 있어요.
        <b>지금 이 기기의 기록은 그대로 계정으로 옮겨져요.</b></p>
      <div class="acct-form">
        <input id="acct-id" autocomplete="username" autocapitalize="none" placeholder="아이디 (영어 소문자·숫자)">
        <input id="acct-pw" type="password" autocomplete="current-password" placeholder="비밀번호 (6자 이상)">
        <div class="inline wrap">
          <button class="btn primary small" id="acct-login">로그인</button>
          <button class="btn ghost small" id="acct-signup">새로 가입</button>
        </div>
      </div>
      <p class="muted small"><a href="help.html">📖 로그인 · 기기 옮기기 안내 보기</a></p>
      <details class="acct-more">
        <summary>다른 기기에서 받은 연결 코드가 있어요</summary>
        <div class="inline wrap">
          <input id="acct-code" autocapitalize="characters" placeholder="연결 코드 8자리" maxlength="12">
          <button class="btn soft small" id="acct-claim">코드로 로그인</button>
        </div>
      </details>`;
  }
  const t = account.syncedAt ? new Date(account.syncedAt) : null;
  return `
    <h2>계정 · 여러 기기</h2>
    <p class="acct-who">👤 <b>${esc(account.id)}</b> 로그인됨
      <span class="muted small">${t ? `· 마지막 동기화 ${t.getMonth() + 1}/${t.getDate()} ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}` : "· 동기화 전"}${account.dirty ? " · 올릴 변경 있음" : ""}</span></p>
    <div class="inline wrap">
      <button class="btn primary small" id="acct-link">📱 다른 기기 연결 (QR)</button>
      <button class="btn ghost small" id="acct-sync">☁️ 지금 동기화</button>
      <button class="btn ghost small" id="acct-pwchange">비밀번호 바꾸기</button>
      <button class="btn text small" id="acct-logout">로그아웃</button>
    </div>
    <div id="acct-qr"></div>
    <p class="muted small">기록은 바꿀 때마다 자동으로 서버에 올라가요. 로그아웃해도 이 기기 기록은 그대로 남아요. <a href="help.html">📖 안내 보기</a></p>`;
}

function refreshAccountCard() {
  const card = document.getElementById("acct-card");
  if (card) card.innerHTML = accountCardInner();
}

function bindAccountCard() {
  const card = document.getElementById("acct-card");
  if (!card) return;
  card.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    const val = (id) => (card.querySelector(id) || {}).value || "";
    b.disabled = true;
    try {
      if (b.id === "acct-login" || b.id === "acct-signup") {
        await signInWith(b.id === "acct-login" ? "login" : "signup", { id: val("#acct-id"), pw: val("#acct-pw") });
        return renderStats();
      }
      if (b.id === "acct-claim") {
        await signInWith("claim", { code: val("#acct-code") });
        return renderStats();
      }
      if (b.id === "acct-sync") return await syncAccount({ quiet: false });
      if (b.id === "acct-link") return await showLinkQr(card.querySelector("#acct-qr"));
      if (b.id === "acct-pwchange") {
        const pw = prompt("새 비밀번호 (6자 이상)");
        if (pw) { await accountApi("password", { pw }); showToast("비밀번호를 바꿨어요"); }
        return;
      }
      if (b.id === "acct-logout") {
        if (!confirm("로그아웃할까요? 이 기기 기록은 그대로 남아요.")) return;
        await accountApi("logout", {}).catch(() => {});
        account = null;
        saveAccount();
        refreshAccountCard();
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      b.disabled = false;
    }
  });
}

// 10분짜리 연결 코드를 QR로 (QR 그리는 라이브러리는 이때만 불러옴)
async function showLinkQr(box) {
  const { code } = await accountApi("link", {});
  const url = `${location.origin}${location.pathname}#link=${code}`;
  let svg = "";
  try {
    await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js");
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    svg = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  } catch (e) { /* QR을 못 그려도 코드로 연결 가능 */ }
  box.innerHTML = `<div class="acct-qr">
    ${svg ? `<div class="acct-qr-img">${svg}</div>` : ""}
    <div><p>새 기기 카메라로 QR을 찍거나,<br>새 기기의 <b>관리 → 연결 코드</b>에 입력하세요.</p>
      <p class="acct-code">${code.slice(0, 4)} ${code.slice(4)}</p>
      <p class="muted small">10분 동안 한 번만 쓸 수 있어요.</p></div></div>`;
}

const loadedScripts = {};
function loadScriptOnce(src) {
  if (!loadedScripts[src]) {
    loadedScripts[src] = new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = ok;
      s.onerror = () => { delete loadedScripts[src]; fail(new Error("load")); };
      document.head.append(s);
    });
  }
  return loadedScripts[src];
}

// 앱을 다시 볼 때(다른 기기에서 바꿨을 수 있음) 서버와 맞춤
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") syncAccount();
});
