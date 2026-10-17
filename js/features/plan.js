// 벅수의 계획: 관리자(PLAN_ADMIN_IDS)가 적는 메모. 읽기는 모든 사용자, 쓰기는 관리자가 로그인한 기기에서만 (서버: worker/src/plan.js)
let planCache = null; // { body, updated }

async function fetchPlan() {
  const res = await fetch(`${PUSH_SERVER}/plan`, { cache: "no-cache" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `서버 응답 ${res.status}`);
  return data;
}

function planTime(t) {
  if (!t) return "아직 적은 내용이 없어요";
  const d = new Date(t);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} 수정`;
}

async function openPlan() {
  document.querySelector(".plan-pop")?.remove();
  const pop = document.createElement("div");
  pop.className = "cl-pop plan-pop";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "벅수의 계획");
  const admin = isAdmin();
  pop.innerHTML = `<div class="cl-card plan-card">
    <div class="cl-head"><h3>📋 벅수의 계획 <small class="plan-time"></small></h3><button class="icon-btn" data-plan="close" aria-label="닫기">✕</button></div>
    <div class="cl-body plan-body"><p class="muted small">불러오는 중…</p></div></div>`;
  pop.addEventListener("click", (e) => { if (e.target === pop || e.target.closest("[data-plan=close]")) pop.remove(); });
  document.body.append(pop);
  const body = pop.querySelector(".plan-body"), time = pop.querySelector(".plan-time");
  const show = (data) => {
    planCache = data;
    time.textContent = planTime(data.updated);
    if (!admin) {
      body.innerHTML = data.body ? `<div class="plan-text">${esc(data.body)}</div>` : `<p class="muted small">아직 적은 내용이 없어요.</p>`;
      return;
    }
    body.innerHTML = `<textarea class="plan-edit" aria-label="벅수의 계획 내용">${esc(data.body || "")}</textarea>
      <div class="plan-actions"><span class="muted small plan-msg"></span><button class="btn small" data-plan="save">저장</button></div>`;
    const msg = body.querySelector(".plan-msg");
    body.querySelector("[data-plan=save]").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true; msg.textContent = "저장하는 중…";
      try {
        const res = await fetch(`${PUSH_SERVER}/plan`, {
          method: "PUT",
          headers: { "content-type": "application/json", Authorization: `Bearer ${account.token}` },
          body: JSON.stringify({ body: body.querySelector(".plan-edit").value }),
        });
        const data2 = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data2.error || `서버 응답 ${res.status}`);
        planCache = data2;
        time.textContent = planTime(data2.updated);
        msg.textContent = "저장했어요";
      } catch (err) { msg.textContent = `저장하지 못했어요: ${err.message}`; }
      btn.disabled = false;
    });
  };
  try {
    show(await fetchPlan());
  } catch (err) {
    body.innerHTML = `<p class="muted small">계획을 불러오지 못했어요 (${esc(err.message)}).</p>`;
  }
}
