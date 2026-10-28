// 관리자 리마인드 DB 검토·수정 화면. 저장된 변경은 Worker KV에 공유한다.
let reminderAdminTimer = 0;

function reminderAdminClone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function reminderAdminDefaults() {
  const response = await fetch("sw.js", { cache: "no-cache" });
  if (!response.ok) throw new Error("기본 알림 DB를 불러오지 못했어요.");
  const source = await response.text();
  const match = source.match(/const DEFAULT_MESSAGES = (\{[\s\S]*?\n\});/);
  if (!match) throw new Error("sw.js에서 기본 알림 DB를 찾지 못했어요.");
  return new Function(`return ${match[1]}`)();
}

async function renderReminderAdmin(header) {
  clearTimeout(reminderAdminTimer);
  app.innerHTML = `${header}<section class="card"><p>알림 DB를 불러오는 중…</p></section>`;
  let defaults, saved;
  try {
    defaults = await reminderAdminDefaults();
    saved = await accountApi("admin/reminder-messages");
  } catch (error) {
    app.innerHTML = `${header}<section class="card"><h2>알림 DB를 열지 못했어요</h2><p class="muted">${esc(error.message)}</p><p>관리자 계정으로 로그인하고 Worker를 최신 코드로 배포했는지 확인해 주세요.</p></section>`;
    return;
  }
  let data = reminderAdminClone(saved.messages || defaults);
  const entries = Object.entries(data).flatMap(([tier, rows]) => rows.map((row, index) => ({ tier, index, row })));
  if (!entries.length) return;
  const assets = entries.map(({ tier, index, row }) => ({
    value: `${tier}:${index}`,
    label: `${tier} ${index + 1} · ${row[3] || row[0]}`,
    src: row[5] || `icons/notify/${tier}-${index}.jpg`,
  }));
  let position = Math.floor(Math.random() * entries.length);
  let order = [];
  let history = [];
  let playing = true;
  let dirty = false;
  const root = document.createElement("section");
  root.className = "card reminder-admin";
  root.innerHTML = `
    <div class="reminder-admin-toolbar">
      <p class="muted small">${saved.messages ? "서버에 저장된 알림 DB" : "기본 알림 DB"} · 순서를 섞어 한 항목씩 확인해요.</p>
      <div class="inline wrap">
        <button type="button" class="btn ghost small" data-reminder-prev>← 이전</button>
        <button type="button" class="btn ghost small" data-reminder-next>무작위 다음 →</button>
        <button type="button" class="btn ghost small" data-reminder-play>자동 넘김 멈춤</button>
      </div>
    </div>
    <p class="reminder-admin-count" aria-live="polite"></p>
    <div class="reminder-admin-preview"><img alt="현재 알림에 연결된 양 그림"><p></p></div>
    <div class="reminder-admin-fields">
      <label>알림 제목<input data-reminder-title maxlength="120"></label>
      <label>알림 문구<textarea data-reminder-body rows="4" maxlength="600"></textarea></label>
      <label>사용할 양 그림<select data-reminder-image></select></label>
      <p class="muted small reminder-admin-caption"></p>
    </div>
    <div class="inline wrap reminder-admin-actions">
      <button type="button" class="btn primary small" data-reminder-save>수정본 저장</button>
      <button type="button" class="btn ghost small" data-reminder-export>JSON 내보내기</button>
      <button type="button" class="btn text small" data-reminder-reset>서버 수정본 지우기</button>
    </div>
    <p class="muted small reminder-admin-status" role="status">${saved.messages ? `서버 저장본 · ${new Date(saved.updated).toLocaleString()}` : "기본 문구를 보고 있어요."}</p>`;
  app.append(root);

  const title = root.querySelector("[data-reminder-title]");
  const body = root.querySelector("[data-reminder-body]");
  const imageSelect = root.querySelector("[data-reminder-image]");
  const image = root.querySelector(".reminder-admin-preview img");
  const imageText = root.querySelector(".reminder-admin-preview p");
  const caption = root.querySelector(".reminder-admin-caption");
  const count = root.querySelector(".reminder-admin-count");
  const status = root.querySelector(".reminder-admin-status");
  imageSelect.innerHTML = assets.map((asset) => `<option value="${esc(asset.value)}">${esc(asset.label)}</option>`).join("");

  function shuffledOrder() {
    order = entries.map((_, index) => index).filter((index) => index !== position).sort(() => Math.random() - 0.5);
  }
  function showEntry(nextPosition) {
    if (!root.isConnected) return;
    position = (nextPosition + entries.length) % entries.length;
    const entry = entries[position];
    const current = entry.row;
    title.value = current[0];
    body.value = current[1];
    const assetValue = current[5]
      ? assets.find((asset) => asset.src === current[5])?.value || `${entry.tier}:${entry.index}`
      : `${entry.tier}:${entry.index}`;
    imageSelect.value = assetValue;
    const asset = assets.find((candidate) => candidate.value === imageSelect.value) || assets[0];
    image.src = asset.src;
    image.alt = `${entry.tier} 알림 ${entry.index + 1}의 양 그림`;
    imageText.textContent = current[3] ? `그림 속 말풍선: ${current[3]}` : "그림 속 말풍선 없음";
    caption.textContent = `DB 위치: ${entry.tier} ${entry.index + 1} · 포즈 ${current[2]}${current[4] ? ` · 조건 ${current[4]}` : ""}`;
    count.textContent = `${String(position + 1).padStart(3, "0")} / ${entries.length} · ${entry.tier}`;
  }
  function nextRandom() {
    if (!order.length) shuffledOrder();
    showEntry(order.pop() ?? (position + 1) % entries.length);
  }
  function markDirty() {
    const row = entries[position].row;
    row[0] = title.value;
    row[1] = body.value;
    const [tier, rawIndex] = imageSelect.value.split(":");
    const original = `icons/notify/${tier}-${rawIndex}.jpg`;
    if (tier === entries[position].tier && Number(rawIndex) === entries[position].index) delete row[5];
    else row[5] = original;
    dirty = true;
    status.textContent = "수정 내용이 있어요. 저장하거나 JSON으로 내보내 주세요.";
    const selectedAsset = assets.find((asset) => asset.value === imageSelect.value);
    image.src = selectedAsset?.src || original;
  }
  title.addEventListener("input", markDirty);
  body.addEventListener("input", markDirty);
  imageSelect.addEventListener("change", markDirty);
  const advance = () => { history.push(position); nextRandom(); };
  root.querySelector("[data-reminder-next]").addEventListener("click", advance);
  root.querySelector("[data-reminder-prev]").addEventListener("click", () => {
    showEntry(history.pop() ?? position - 1);
  });
  root.querySelector("[data-reminder-play]").addEventListener("click", (event) => {
    playing = !playing;
    event.currentTarget.textContent = playing ? "자동 넘김 멈춤" : "자동 넘김 시작";
    if (playing) scheduleNext();
    else clearTimeout(reminderAdminTimer);
  });
  root.querySelector("[data-reminder-save]").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const result = await accountApi("admin/reminder-messages", { messages: data }, "PUT");
      await idbPut("reminder-messages", data);
      await idbPut("reminder-messages-fetched", Date.now());
      dirty = false;
      status.textContent = `저장 완료 · ${new Date(result.updated).toLocaleString()}부터 이 앱의 알림에 반영돼요.`;
    } catch (error) {
      status.textContent = `저장하지 못했어요: ${error.message}`;
    } finally { button.disabled = false; }
  });
  root.querySelector("[data-reminder-export]").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "reminder-messages.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  root.querySelector("[data-reminder-reset]").addEventListener("click", async () => {
    if (!confirm("서버 수정본을 지우고 저장소의 기본 알림 DB로 되돌릴까요?")) return;
    try {
      await accountApi("admin/reminder-messages", { messages: null }, "PUT");
      await idbRemove("reminder-messages");
      dirty = false;
      renderStats();
    } catch (error) { status.textContent = `초기화하지 못했어요: ${error.message}`; }
  });
  root.addEventListener("focusin", (event) => {
    if (!event.target.matches("[data-reminder-title], [data-reminder-body], [data-reminder-image]")) return;
    if (!playing) return;
    playing = false;
    clearTimeout(reminderAdminTimer);
    root.querySelector("[data-reminder-play]").textContent = "자동 넘김 시작";
  });
  function scheduleNext() {
    clearTimeout(reminderAdminTimer);
    reminderAdminTimer = setTimeout(() => {
      if (!root.isConnected || !playing) return;
      advance();
      scheduleNext();
    }, 7000);
  }
  showEntry(position);
  scheduleNext();
}
