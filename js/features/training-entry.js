// 자료실이 발급한 기기 토큰이나 관리자 세션이 유효할 때 자료실 입구를 표시한다.
(() => {
  const entry = document.getElementById("training-entry");
  if (!entry) return;

  const deviceKey = "daily-training-device-v1";
  const refreshInterval = 60_000;
  let identity = "";
  let request = null;
  let checkedAt = 0;

  function credentials() {
    const saved = loadAccount();
    if (saved?.id === "buucksoo" && typeof saved.token === "string" && saved.token) {
      return { token: saved.token, owner: true };
    }
    try {
      const token = localStorage.getItem(deviceKey);
      return token ? { token, owner: false } : null;
    } catch {
      return null;
    }
  }

  async function refresh(force = false) {
    const access = credentials();
    const nextIdentity = access ? `${access.owner}:${access.token}` : "";
    if (identity !== nextIdentity) {
      request?.abort();
      request = null;
      identity = nextIdentity;
      checkedAt = 0;
      entry.hidden = true;
    }
    if (!access || request || (!force && Date.now() - checkedAt < refreshInterval)) return;

    const pending = new AbortController();
    request = pending;
    checkedAt = Date.now();
    const timeout = setTimeout(() => pending.abort(), 5_000);
    try {
      const result = access.owner
        ? await fetch(`${PUSH_SERVER}/account/training/library`, {
            headers: { Authorization: `Bearer ${access.token}` },
            cache: "no-store", signal: pending.signal,
          })
        : await fetch(`${PUSH_SERVER}/training/status`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceToken: access.token }),
            cache: "no-store", signal: pending.signal,
          });
      if (request !== pending) return;
      if (result.status === 401 || result.status === 403) {
        entry.hidden = true;
        return;
      }
      if (!result.ok) return;
      const data = await result.json();
      if (request !== pending) return;
      entry.href = access.owner ? "training.html?preview=1" : "training.html";
      entry.hidden = !data.materials?.length;
    } catch {
      // 일시적인 네트워크 오류가 나면 앞서 확인한 상태를 유지하며 다음에 재확인한다.
    } finally {
      clearTimeout(timeout);
      if (request === pending) request = null;
    }
  }

  window.refreshTrainingEntry = refresh;
  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === ACCOUNT_KEY || event.key === deviceKey) refresh(true);
  });
  window.addEventListener("pageshow", (event) => { if (event.persisted) refresh(true); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(true); });
  setInterval(() => { if (!document.hidden) refresh(); }, refreshInterval);
})();
