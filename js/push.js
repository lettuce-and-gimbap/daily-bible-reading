// 저녁 리마인드 알림 (18시 · 21시 · 23시, 오늘 통독을 마치지 않았을 때만)
// 휴대폰은 앱이 꺼져 있으면 스스로 시간 맞춰 깨어날 수 없어서, 알림 서버(worker/)가 정해진 시간에 푸시를 보낸다.
// 앱은 서버에 "오늘 통독 완료 여부"만 알려 주고, 서비스 워커(sw.js)가 받아서 문구를 골라 보여 준다.

const PUSH_KEY = "daily5-push-v1";
const REMINDER_TIMES = ["18:00", "21:00", "23:00"];
let reminderTimer;

function pushInfo() {
  try { return JSON.parse(localStorage.getItem(PUSH_KEY)) || {}; } catch (e) { return {}; }
}
function savePushInfo(info) {
  try { localStorage.setItem(PUSH_KEY, JSON.stringify(info)); } catch (e) { /* 저장 불가 */ }
}

function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

function pushStatus() {
  if (!("serviceWorker" in navigator)) return "unsupported";
  if (isIOS() && !isStandalone()) return "need-install";
  if (!("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (!PUSH_SERVER) return "no-server";
  if (Notification.permission === "denied") return "denied";
  return pushInfo().id && Notification.permission === "granted" ? "on" : "off";
}

function idbPut(key, val) {
  return new Promise((resolve) => {
    if (!("indexedDB" in window)) return resolve();
    const req = indexedDB.open("daily5", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onerror = () => resolve();
    req.onsuccess = () => {
      const tx = req.result.transaction("kv", "readwrite");
      tx.objectStore("kv").put(val, key);
      tx.oncomplete = tx.onerror = () => resolve();
    };
  });
}

function b64urlToBytes(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

async function api(path, body) {
  const res = await fetch(PUSH_SERVER + path, body === undefined ? {} : {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status });
  return data;
}

// 앱 기록이 바뀔 때마다 서비스 워커용 요약을 저장하고, 서버에 완료 여부를 알림
function queueReminderSync() {
  clearTimeout(reminderTimer);
  reminderTimer = setTimeout(syncReminder, 800);
}

async function syncReminder() {
  const snap = reminderSnapshot();
  await idbPut("reminder", snap);
  const info = pushInfo();
  if (!info.id || !PUSH_SERVER) return;
  const key = `${snap.date}|${snap.done}|${snap.paused}`;
  if (info.synced === key) return;
  try {
    await api("/status", { id: info.id, doneDate: snap.done ? snap.date : "", paused: snap.paused });
    savePushInfo({ ...info, synced: key });
  } catch (e) {
    if (e.status === 404) savePushInfo({}); // 서버에서 구독이 사라짐 → 다시 켜야 함
  }
}

async function enableReminders() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("알림 권한이 허용되지 않았어요.");
  const reg = await navigator.serviceWorker.ready;
  const { publicKey } = await api("/vapid");
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToBytes(publicKey) });
  }
  const snap = reminderSnapshot();
  const { id } = await api("/subscribe", {
    subscription: sub.toJSON(),
    doneDate: snap.done ? snap.date : "",
    paused: snap.paused,
  });
  savePushInfo({ id, synced: `${snap.date}|${snap.done}|${snap.paused}` });
  await idbPut("reminder", snap);
}

async function disableReminders() {
  const info = pushInfo();
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch (e) { /* 이미 해제됨 */ }
  if (info.id) api("/unsubscribe", { id: info.id }).catch(() => {});
  savePushInfo({});
}

function reminderCardHtml() {
  const status = pushStatus();
  const snap = reminderSnapshot();
  const times = REMINDER_TIMES.map((t) => `<span class="time-chip">${t}</span>`).join("");
  let body;
  if (status === "on") {
    body = `
      <p class="remind-state on">✓ 알림이 켜져 있어요</p>
      <p class="muted small">${snap.paused ? "통독 계획이 없거나 끝나서 지금은 알림이 가지 않아요."
        : snap.done ? "오늘 통독을 마쳐서 오늘 저녁엔 알림이 가지 않아요. 👏"
        : "오늘 통독을 아직 마치지 않았어요. 위 시간에 알림이 가요."}</p>
      <div class="inline wrap">
        <button class="btn ghost small" id="rm-test">테스트 알림 받기</button>
        <button class="btn text small" id="rm-off">알림 끄기</button>
      </div>`;
  } else if (status === "off") {
    body = `
      <p class="muted small">오늘 통독을 마치지 않았을 때만 위 시간에 재치 있는 알림으로 챙겨 드려요. 다 읽으면 알림이 가지 않아요.</p>
      <button class="btn primary" id="rm-on">🔔 알림 켜기</button>`;
  } else if (status === "need-install") {
    body = `
      <p class="muted small">아이폰은 <b>홈 화면에 추가한 앱</b>에서만 알림을 받을 수 있어요. (iOS 16.4 이상)</p>
      <ol class="howto">
        <li>Safari 아래쪽 <b>공유 버튼</b>(□↑)을 눌러요</li>
        <li><b>홈 화면에 추가</b>를 눌러요</li>
        <li>홈 화면의 <b>경건생활</b> 아이콘으로 열고, 여기서 알림을 켜요</li>
      </ol>
      <p class="muted small">홈 화면 앱은 Safari와 기록 저장 공간이 따로예요. 기존 기록은 아래 <b>백업 파일 받기 → 불러오기</b>로 옮겨 주세요.</p>`;
  } else if (status === "denied") {
    body = `<p class="muted small">알림이 차단돼 있어요. 휴대폰 <b>설정 → 알림</b>(안드로이드는 브라우저 사이트 설정)에서 이 앱의 알림을 허용한 뒤 다시 열어 주세요.</p>`;
  } else if (status === "no-server") {
    body = `<p class="muted small">알림 서버가 아직 연결되지 않았어요. 저장소의 <b>worker/README.md</b> 순서대로 서버를 배포하고 <b>js/config.js</b>에 주소를 넣으면 켤 수 있어요.</p>`;
  } else {
    body = `<p class="muted small">이 브라우저는 웹 알림을 지원하지 않아요. 크롬(안드로이드)이나 홈 화면에 추가한 Safari 앱(아이폰)에서 열어 주세요.</p>`;
  }
  return `
    <section class="card remind">
      <div class="remind-head">
        <h2>🔔 저녁 리마인드</h2>
        <div class="times">${times}</div>
      </div>
      ${body}
    </section>`;
}

function bindReminderCard() {
  const on = $("#rm-on"), off = $("#rm-off"), test = $("#rm-test");
  if (on) on.addEventListener("click", async () => {
    on.disabled = true;
    on.textContent = "켜는 중…";
    try {
      await enableReminders();
      showStatsToast("알림을 켰어요. 오늘 저녁에 만나요 🙏");
    } catch (e) {
      alert(`알림을 켜지 못했어요.\n${e.message}`);
    }
    renderStats();
  });
  if (off) off.addEventListener("click", async () => {
    if (!confirm("저녁 리마인드 알림을 끌까요?")) return;
    await disableReminders();
    renderStats();
  });
  if (test) test.addEventListener("click", async () => {
    test.disabled = true;
    try {
      await syncReminder();
      await api("/test", { id: pushInfo().id });
      test.textContent = "보냈어요! 잠시 후 도착해요";
    } catch (e) {
      if (e.status === 404) { savePushInfo({}); renderStats(); return; }
      alert(`테스트 알림을 보내지 못했어요.\n${e.message}`);
      test.disabled = false;
    }
  });
}

function showStatsToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* 로컬 파일 등 등록 불가 환경 */ });
}
