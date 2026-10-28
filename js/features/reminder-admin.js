// 관리자 리마인드 DB 검토·수정 화면. 저장된 변경은 Worker KV에 공유한다.
let reminderAdminTimer = 0;
let reminderAdminArtScript = null;

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

function reminderAdminLoadArt() {
  if (window.ReminderArt?.renderCard) return Promise.resolve(window.ReminderArt);
  if (reminderAdminArtScript) return reminderAdminArtScript;
  reminderAdminArtScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "tools/notify-art/art.js?v=reminder-bubble-editor-1";
    script.onload = () => window.ReminderArt?.renderCard ? resolve(window.ReminderArt) : reject(new Error("양 그림 렌더러를 찾지 못했어요."));
    script.onerror = () => reject(new Error("양 그림 렌더러를 불러오지 못했어요."));
    document.head.append(script);
  });
  return reminderAdminArtScript;
}

function reminderAdminSvgUrl(art, entry, pose, say) {
  const context = document.createElement("canvas").getContext("2d");
  const measure = (text, size) => {
    context.font = `900 ${size}px 'Noto Sans KR', 'Malgun Gothic', sans-serif`;
    return context.measureText(text, size).width;
  };
  const svg = art.renderCard({ tier: entry.tier, pose, say }, measure);
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}

function reminderAdminJpegData(svgUrl) {
  return new Promise((resolve, reject) => {
    const source = new Image();
    source.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 360;
      canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("말풍선 그림을 이미지로 만들지 못했어요."));
        blob.arrayBuffer().then((buffer) => {
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
          resolve(btoa(binary));
        }, reject);
      }, "image/jpeg", 0.9);
    };
    source.onerror = () => reject(new Error("말풍선 미리보기 이미지를 읽지 못했어요."));
    source.src = svgUrl;
  });
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
    say: row[3] || "",
    pose: row[2],
  }));
  let position = Math.floor(Math.random() * entries.length);
  let order = [];
  let history = [];
  let playing = true;
  let dirty = false;
  let artRenderer = null;
  let previewUrl = "";
  const artUpdates = new Map();
  const artDeletes = new Set();
  const artNeedsRender = new Set();
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
      <label>그림 말풍선 문구<input data-reminder-say maxlength="60" placeholder="그림 안에 표시할 짧은 문구"></label>
      <label>사용할 양 그림<select data-reminder-image></select></label>
      <p class="muted small">말풍선을 수정하면 그림을 다시 만들어 이후 알림에 적용해요.</p>
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
  const say = root.querySelector("[data-reminder-say]");
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
    say.value = current[3] || "";
    const assetValue = current[5]
      ? assets.find((asset) => asset.src === current[5])?.value || `${entry.tier}:${entry.index}`
      : `${entry.tier}:${entry.index}`;
    imageSelect.value = assetValue;
    const asset = assets.find((candidate) => candidate.value === imageSelect.value) || assets[0];
    image.src = current[5] || asset.src;
    image.alt = `${entry.tier} 알림 ${entry.index + 1}의 양 그림`;
    imageText.textContent = current[3] ? `그림 속 말풍선: ${current[3]}` : "그림 속 말풍선 없음";
    caption.textContent = `DB 위치: ${entry.tier} ${entry.index + 1} · 포즈 ${current[2]}${current[4] ? ` · 조건 ${current[4]}` : ""}`;
    count.textContent = `${String(position + 1).padStart(3, "0")} / ${entries.length} · ${entry.tier}`;
  }
  function nextRandom() {
    if (!order.length) shuffledOrder();
    showEntry(order.pop() ?? (position + 1) % entries.length);
  }
  function markTextDirty() {
    const row = entries[position].row;
    row[0] = title.value;
    row[1] = body.value;
    dirty = true;
    status.textContent = "수정 내용이 있어요. 저장하거나 JSON으로 내보내 주세요.";
  }
  function markBubbleDirty() {
    const entry = entries[position];
    const row = entry.row;
    const asset = assets.find((candidate) => candidate.value === imageSelect.value) || assets[0];
    const key = `${entry.tier}:${entry.index}`;
    row[2] = asset.pose;
    row[3] = say.value;
    row[5] = `${PUSH_SERVER}/reminder-art/${entry.tier}/${entry.index}.jpg?v=${Date.now()}`;
    artDeletes.delete(key);
    artNeedsRender.add(key);
    dirty = true;
    status.textContent = "말풍선을 다시 그렸어요. 저장하면 이후 알림에 적용돼요.";
    imageText.textContent = say.value ? `그림 속 말풍선: ${say.value}` : "그림 속 말풍선 없음";
    if (artRenderer) {
      const nextUrl = reminderAdminSvgUrl(artRenderer, entry, asset.pose, say.value);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = nextUrl;
      image.src = previewUrl;
    }
  }
  function chooseAsset() {
    const entry = entries[position];
    const row = entry.row;
    const asset = assets.find((candidate) => candidate.value === imageSelect.value) || assets[0];
    const key = `${entry.tier}:${entry.index}`;
    const hadCustomArt = row[5]?.startsWith(`${PUSH_SERVER}/reminder-art/${entry.tier}/${entry.index}.jpg`);
    row[2] = asset.pose;
    row[3] = asset.say;
    say.value = asset.say;
    row[5] = asset.src;
    artUpdates.delete(key);
    artNeedsRender.delete(key);
    if (hadCustomArt && !asset.src.startsWith(`${PUSH_SERVER}/reminder-art/${entry.tier}/${entry.index}.jpg`)) artDeletes.add(key);
    else artDeletes.delete(key);
    dirty = true;
    status.textContent = "그림과 말풍선을 선택했어요. 저장을 눌러 반영해 주세요.";
    image.src = asset.src;
    imageText.textContent = asset.say ? `그림 속 말풍선: ${asset.say}` : "그림 속 말풍선 없음";
  }
  title.addEventListener("input", markTextDirty);
  body.addEventListener("input", markTextDirty);
  say.addEventListener("input", markBubbleDirty);
  imageSelect.addEventListener("change", chooseAsset);
  reminderAdminLoadArt().then((renderer) => { artRenderer = renderer; say.disabled = false; }).catch((error) => {
    status.textContent = `${error.message} 말풍선 문구를 바꿀 수 없어요.`;
    say.disabled = true;
  });
  say.disabled = true;
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
      if (artNeedsRender.size) artRenderer = artRenderer || await reminderAdminLoadArt();
      button.textContent = "그림 만드는 중…";
      for (const key of artNeedsRender) {
        const entry = entries.find((item) => `${item.tier}:${item.index}` === key);
        if (!entry) continue;
        const svgUrl = reminderAdminSvgUrl(artRenderer, entry, entry.row[2], entry.row[3] || "");
        try { artUpdates.set(key, await reminderAdminJpegData(svgUrl)); }
        finally { URL.revokeObjectURL(svgUrl); }
      }
      const version = Date.now();
      for (const key of artNeedsRender) {
        const entry = entries.find((item) => `${item.tier}:${item.index}` === key);
        if (entry) entry.row[5] = `${PUSH_SERVER}/reminder-art/${entry.tier}/${entry.index}.jpg?v=${version}`;
      }
      const result = await accountApi("admin/reminder-messages", {
        messages: data,
        art: Object.fromEntries(artUpdates),
        artDeletes: [...artDeletes],
      }, "PUT");
      await idbPut("reminder-messages", data);
      await idbPut("reminder-messages-fetched", Date.now());
      artUpdates.clear();
      artDeletes.clear();
      artNeedsRender.clear();
      dirty = false;
      status.textContent = `저장 완료 · ${new Date(result.updated).toLocaleString()}부터 모든 사용자의 이후 알림에 반영돼요.`;
    } catch (error) {
      status.textContent = `저장하지 못했어요: ${error.message}`;
    } finally { button.disabled = false; button.textContent = "수정본 저장"; }
  });
  root.querySelector("[data-reminder-export]").addEventListener("click", async () => {
    try {
      if (artNeedsRender.size) artRenderer = artRenderer || await reminderAdminLoadArt();
      for (const key of artNeedsRender) {
        const entry = entries.find((item) => `${item.tier}:${item.index}` === key);
        if (!entry) continue;
        const svgUrl = reminderAdminSvgUrl(artRenderer, entry, entry.row[2], entry.row[3] || "");
        try { artUpdates.set(key, await reminderAdminJpegData(svgUrl)); }
        finally { URL.revokeObjectURL(svgUrl); }
      }
      const blob = new Blob([JSON.stringify({ messages: data, art: Object.fromEntries(artUpdates), artDeletes: [...artDeletes] }, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = "reminder-messages.json"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { status.textContent = `내보내지 못했어요: ${error.message}`; }
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
    if (!event.target.matches("[data-reminder-title], [data-reminder-body], [data-reminder-say], [data-reminder-image]")) return;
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
