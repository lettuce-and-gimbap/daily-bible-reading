(() => {
  "use strict";
  const API = "https://daily-bible-reminder.gimbap-lettuce.workers.dev";
  const DEVICE_KEY = "daily-training-device-v1";
  const PROGRESS_KEY = "daily-training-progress-v1";
  const THEORY_LESSONS = { "언약신학, 구원사": 7, "신약 정경 과정": 4, "복음서": 6, "구원 여정 (서정) 과정": 10, "구원론 비교표": 11 };
  const app = document.getElementById("training-app");
  const params = new URLSearchParams(location.search);
  const adminMode = params.get("admin") === "1";
  let ownerPreview = false;
  let inviteCode = (location.hash.match(/^#invite=([a-f0-9]{64})$/i) || [])[1] || sessionStorage.getItem("daily-training-invite") || "";
  let deviceToken = localStorage.getItem(DEVICE_KEY) || "";
  let pollTimer = null;
  let adminTimer = null;
  let inviteExpires = 0;
  let currentMaterial = null;
  let currentLesson = 0;
  let viewRequest = 0;
  let progress = readProgress();

  if (inviteCode) {
    sessionStorage.setItem("daily-training-invite", inviteCode);
    history.replaceState(history.state, "", location.pathname + location.search);
  }

  function readProgress() { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch { return {}; } }
  function saveProgress() { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); }
  function randomToken() { const bytes = crypto.getRandomValues(new Uint8Array(32)); return [...bytes].map((n) => n.toString(16).padStart(2, "0")).join(""); }
  function esc(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
  function dateLabel(value) { return value ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-"; }
  function ownerToken() {
    try {
      const account = JSON.parse(localStorage.getItem("daily5-account") || "null");
      return account?.id === "buucksoo" ? account.token : null;
    } catch { return null; }
  }
  async function call(path, body, { admin = false, method = "POST" } = {}) {
    const headers = { "content-type": "application/json" };
    if (admin) {
      const token = ownerToken();
      if (!token) throw new Error("Bible-reading 앱에서 관리자 계정으로 로그인한 뒤 이 화면을 다시 열어 주세요.");
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.error || `서버 응답 ${response.status}`); error.status = response.status; error.data = data; throw error; }
    return data;
  }
  function message(text, error = false) { return `<p class="status${error ? " error" : ""}" role="status">${esc(text)}</p>`; }

  async function start() {
    const requestId = ++viewRequest;
    clearInterval(pollTimer);
    currentMaterial = null;
    ownerPreview = false;
    if (adminMode) return ownerToken() ? renderAdmin() : renderOwnerError("관리자 계정으로 로그인해 주세요.");
    if (ownerToken() || params.get("preview") === "1") {
      try {
        const data = await call("/account/training/library", null, { admin: true, method: "GET" });
        if (requestId !== viewRequest) return;
        ownerPreview = true;
        return renderLibrary(data.materials);
      } catch (error) {
        if (requestId === viewRequest) renderOwnerError(error.message);
        return;
      }
    }
    if (deviceToken) {
      try {
        const status = await call("/training/status", { deviceToken });
        if (status.status === "approved") return renderLibrary(status.materials || []);
      } catch (error) {
        if (error.data?.status === "pending") return renderPending();
        if (error.data?.status === "revoked") { currentMaterial = null; return renderRequest("승인이 취소된 기기예요. 새 QR로 다시 요청할 수 있어요."); }
        if (error.data?.status === "unregistered") localStorage.removeItem(DEVICE_KEY);
      }
    }
    currentMaterial = null;
    renderRequest(inviteCode ? "관리자에게 요청이 전달되면 이 기기에서 자료를 열 수 있어요." : "자료를 열려면 관리자가 띄운 동적 QR을 스캔해 주세요.");
  }

  function renderOwnerError(text) {
    app.innerHTML = `<section class="card"><h2>관리자 자료실</h2>${message(text, true)}<a class="btn secondary" href="index.html#stats">Bible Reading에서 로그인 확인</a></section>`;
  }

  function renderRequest(note) {
    clearInterval(pollTimer);
    app.innerHTML = `<section class="card"><h2>자료 접근 승인 요청</h2>${message(note, !inviteCode && !deviceToken)}${inviteCode ? `<form id="request-form"><label class="field"><span>이름 또는 관리자에게 알릴 호칭</span><input name="label" maxlength="40" autocomplete="name" required placeholder="예: 홍길동"></label><button class="btn" id="request-submit">관리자에게 승인 요청</button></form>` : `<a class="btn secondary" href="index.html#stats">Bible-reading 앱 열기</a><p class="muted small">관리자가 표시한 QR을 다시 찍으면 요청 화면으로 이동해요. 계정 로그인은 필요하지 않아요.</p>`}</section>`;
    document.getElementById("request-form")?.addEventListener("submit", submitRequest);
  }

  async function submitRequest(event) {
    event.preventDefault();
    const button = document.getElementById("request-submit");
    button.disabled = true;
    deviceToken ||= randomToken();
    localStorage.setItem(DEVICE_KEY, deviceToken);
    try {
      const data = await call("/training/request", { invite: inviteCode, deviceToken, label: new FormData(event.currentTarget).get("label") });
      sessionStorage.removeItem("daily-training-invite");
      inviteCode = "";
      if (data.status === "approved") return start();
      renderPending();
    } catch (error) {
      button.disabled = false;
      const old = app.querySelector(".status");
      if (old) { old.classList.add("error"); old.textContent = error.message; }
    }
  }

  function renderPending() {
    app.innerHTML = `<section class="card"><h2>승인 대기 중</h2>${message("관리자가 이 기기를 승인하면 자동으로 자료 목록이 열려요.")}<button class="btn secondary" id="check-now">승인 상태 확인</button></section>`;
    document.getElementById("check-now").addEventListener("click", checkStatus);
    clearInterval(pollTimer);
    pollTimer = setInterval(checkStatus, 15000);
  }

  async function checkStatus() {
    if (!deviceToken) return;
    try { const data = await call("/training/status", { deviceToken }); if (data.status === "approved") renderLibrary(data.materials || []); }
    catch (error) {
      if (["revoked", "unregistered"].includes(error.data?.status)) start();
    }
  }

  function renderLibrary(materials) {
    clearInterval(pollTimer);
    currentMaterial = null;
    const allowed = new Set(materials.map(({ id }) => id));
    const cards = [
      { item: "discipleship", semester: 1, label: "제자훈련 · 1학기", title: "복음과 교리",
        description: "신앙고백부터 재림까지 12과를 연습하고, 이론정리를 읽을 수 있어요.", read: "이론정리 읽기" },
      { item: "discipleship", semester: 2, label: "제자훈련 · 2학기", title: "제자의 삶",
        description: "순종과 섬김부터 서로 사랑하기까지, 12과를 연습하세요." },
      { item: "westminster", label: "웨스트민스터", title: "신도게요서",
        description: "33장의 교리와 미주를 읽고, 장별로 핵심을 확인하세요.", read: "신도게요서 읽기" },
    ].filter((course) => allowed.has(course.item)).map((course) => `
      <article class="card training-course" data-course="${course.semester || course.item}">
        <p class="course-kicker">${esc(course.label)}</p>
        <h2>${esc(course.title)}</h2>
        <p class="muted">${esc(course.description)}</p>
        <div class="course-actions">
          <button class="btn primary" type="button" data-practice-item="${course.item}" data-semester="${course.semester || ""}">문제 풀기</button>
          ${course.read ? `<button class="btn secondary" type="button" data-open-material="${course.item}">${esc(course.read)}</button>` : ""}
        </div>
      </article>`).join("");
    const header = ownerPreview
      ? '<div class="topline training-library-actions"><a class="btn secondary" href="training.html?admin=1">QR · 열람 권한 관리</a></div>'
      : '<div class="topline training-library-actions"><button class="btn secondary" id="refresh-library">승인 다시 확인</button></div>';
    app.innerHTML = `${header}${cards ? `<section class="training-courses" aria-label="학습 과정">${cards}</section>
      <section class="card practice-intro"><div><h2>섞어 풀기</h2><p class="muted">허용된 여러 범위에서 문제를 골고루 풀어요.</p></div><button class="btn secondary" type="button" id="practice-all">연습 범위 고르기</button></section>`
      : '<section class="card">열 수 있는 자료가 없어요.</section>'}`;
    app.querySelectorAll("[data-open-material]").forEach((button) => button.addEventListener("click", () => openMaterial(button.dataset.openMaterial)));
    document.getElementById("refresh-library")?.addEventListener("click", checkStatus);
    document.getElementById("practice-all")?.addEventListener("click", () => openPractice());
    app.querySelectorAll("[data-practice-item]").forEach((button) => button.addEventListener("click", () => openPractice({
      item: button.dataset.practiceItem,
      semester: Number(button.dataset.semester) || undefined,
    })));
  }

  function openPractice(initial) {
    ++viewRequest;
    clearInterval(pollTimer);
    currentMaterial = null;
    const request = (action, body) => ownerPreview
      ? call(`/account/training/practice/${action}`, body, { admin: true })
      : call(`/training/practice/${action}`, { ...body, deviceToken });
    window.TrainingPractice.open(app, request, start, initial);
  }

  function readMaterial(item, section) {
    if (ownerPreview) return call("/account/training/content", { item, section }, { admin: true });
    return call("/training/content", { deviceToken, item, section });
  }

  async function openMaterial(id) {
    const requestId = ++viewRequest;
    app.innerHTML = `<section class="card">승인과 자료를 확인하고 있어요…</section>`;
    try {
      const material = await readMaterial(id);
      if (requestId !== viewRequest) return;
      currentMaterial = material;
      const next = material.sections.findIndex((_, i) => !(progress[id] || []).includes(i));
      await openSection(next < 0 ? 0 : next);
    } catch (error) { if (requestId === viewRequest) showReadError(error); }
  }

  async function openSection(index) {
    const requestId = ++viewRequest;
    app.innerHTML = '<section class="card" role="status">단원을 불러오는 중이에요…</section>';
    try {
      const section = await readMaterial(currentMaterial.id, index);
      if (requestId !== viewRequest) return;
      currentLesson = index;
      renderMaterial(section.content);
    } catch (error) { if (requestId === viewRequest) showReadError(error); }
  }

  function showReadError(error) {
    currentMaterial = null;
    app.innerHTML = `<section class="card"><h2>자료를 열지 못했어요</h2>${message(error.message, true)}<button class="btn secondary" id="back-library">목록으로</button></section>`;
    document.getElementById("back-library").addEventListener("click", start);
  }

  function markdownHtml(markdown, isNotes = false) {
    const lines = markdown.split("\n"); let html = "", para = [], list = "", code = false, codeLines = [];
    const inline = (text) => esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
    const closePara = () => { if (para.length) { html += `<p>${inline(para.join(" "))}</p>`; para = []; } };
    const closeList = () => { if (list) { html += `</${list}>`; list = ""; } };
    for (const line of lines) {
      if (/^```/.test(line)) { closePara(); closeList(); if (code) { html += `<pre>${esc(codeLines.join("\n"))}</pre>`; codeLines = []; } code = !code; continue; }
      if (code) { codeLines.push(line); continue; }
      const s = line.trim();
      if (!s) { closePara(); closeList(); continue; }
      const heading = s.match(/^(#{1,3})\s+(.+)$/);
      if (heading) { closePara(); closeList(); const n = Math.min(heading[1].length + 1, 4); html += `<h${n}>${inline(heading[2])}</h${n}>`; continue; }
      if (s.startsWith("> ")) { closePara(); closeList(); html += `<blockquote>${inline(s.slice(2))}</blockquote>`; continue; }
      const bullet = s.match(/^[-*+•]\s+(.+)$/);
      const ordered = s.match(/^(\d+)[.)]\s+(.+)$/);
      if (isNotes && ordered) {
        closePara(); closeList();
        html += `<p class="endnote"><b>${esc(ordered[1])})</b> ${inline(ordered[2])}</p>`;
        continue;
      }
      if (/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫]/.test(s)) {
        closePara(); closeList(); html += `<p class="numbered-line">${inline(s)}</p>`; continue;
      }
      if (bullet || ordered) {
        closePara();
        const next = bullet ? "ul" : "ol";
        if (list !== next) { closeList(); list = next; html += `<${list}>`; }
        html += `<li>${inline(bullet ? bullet[1] : ordered[2])}</li>`;
        continue;
      }
      closeList(); para.push(s);
      // Exported PDF lines wrap mid-sentence. Start a new paragraph only at a
      // completed sentence near the original line end or an explicit blank line.
      if (/[.!?。！？](?:\d+\)[.!?]?)?\s*[”’」"']?$/.test(s)) closePara();
    }
    closePara(); closeList(); if (code) html += `<pre>${esc(codeLines.join("\n"))}</pre>`; return html;
  }

  function renderMaterial(content) {
    const units = currentMaterial.sections;
    const done = new Set(progress[currentMaterial.id] || []);
    const isNotes = units[currentLesson] === "미주";
    app.innerHTML = `
      <div class="topline"><a href="#" class="back" id="back-library">‹ 자료 목록</a><span class="muted small">${currentLesson + 1} / ${units.length} · 완료 ${done.size}</span></div>
      <section class="card">
        <p class="muted small reading-source">${esc(currentMaterial.title)}</p>
        <label class="reading-select">단원 <select id="reading-unit">${units.map((title, i) =>
          `<option value="${i}" ${i === currentLesson ? "selected" : ""}>${done.has(i) ? "✓ " : ""}${esc(title)}</option>`).join("")}</select></label>
        <article class="lesson-body">
          <h2>${esc(units[currentLesson])}</h2>
          ${isNotes ? "" : '<button class="btn secondary" id="practice-section">관련 문제 풀기</button>'}
          <div class="reading-text">${markdownHtml(content, isNotes)}</div>
          <div class="inline reading-actions"><button class="btn" id="mark-done">${done.has(currentLesson) ? "완료했어요 ✓" : "이 단위 읽기 완료"}</button>
            <button class="btn secondary" id="previous" ${currentLesson === 0 ? "disabled" : ""}>이전</button>
            <button class="btn secondary" id="next" ${currentLesson === units.length - 1 ? "disabled" : ""}>다음</button>
          </div>
        </article>
      </section>`;
    document.getElementById("back-library").addEventListener("click", (e) => { e.preventDefault(); start(); });
    document.getElementById("reading-unit").addEventListener("change", (event) => openSection(Number(event.target.value)));
    document.getElementById("practice-section")?.addEventListener("click", () => {
      const item = currentMaterial.id;
      const section = units[currentLesson];
      const theoryLesson = THEORY_LESSONS[section.replace(/\s+\(\d+p\)$/u, "")];
      const lesson = item === "discipleship" && theoryLesson ? `1학기 ${theoryLesson}과` : undefined;
      openPractice({ item, section, lesson, semester: item === "discipleship" ? 1 : undefined });
    });
    document.getElementById("mark-done").addEventListener("click", () => {
      done.add(currentLesson);
      progress[currentMaterial.id] = [...done].sort((a, b) => a - b);
      saveProgress();
      if (currentLesson < units.length - 1) openSection(currentLesson + 1);
      else renderMaterial(content);
    });
    document.getElementById("previous").addEventListener("click", () => openSection(currentLesson - 1));
    document.getElementById("next").addEventListener("click", () => openSection(currentLesson + 1));
  }

  function renderAdmin() {
    clearInterval(adminTimer);
    app.innerHTML = `<section class="card"><h2>훈련 자료 접근 관리</h2><p class="muted">관리자 계정으로 요청을 승인하고, 승인된 기기의 권한을 회수할 수 있어요.</p><div id="admin-status"></div><div class="qr-layout"><div id="qr-box" class="qr-img" hidden></div><div><button class="btn" id="new-invite">동적 훈련생 QR 만들기</button><p id="invite-countdown" class="muted small">QR은 5분 동안 유효해요.</p><p class="muted small">훈련생은 QR을 스캔해 요청을 제출합니다. QR 자체로 자료가 열리지는 않으며, 아래에서 승인해야 해요.</p></div></div></section><section class="card"><div class="topline"><h2>요청 및 승인된 기기</h2><button class="btn secondary" id="refresh-readers">새로고침</button></div><div id="reader-list" class="muted">명단을 불러오는 중…</div></section><p><a class="back" href="index.html#stats">Bible-reading 앱으로 돌아가기</a></p>`;
    app.insertAdjacentHTML("afterbegin", '<p><a class="btn secondary" href="training.html?preview=1">자료 열기 · 문제풀이</a></p>');
    document.getElementById("new-invite").addEventListener("click", createInvite);
    document.getElementById("refresh-readers").addEventListener("click", loadReaders);
    document.getElementById("reader-list").addEventListener("click", handleReaderAction);
    loadReaders().catch(showAdminError);
  }

  async function createInvite() {
    const button = document.getElementById("new-invite"); button.disabled = true;
    try {
      const data = await call("/account/training/invite", {}, { admin: true });
      inviteExpires = data.expires;
      const link = `${location.origin}${location.pathname}#invite=${data.code}`;
      const box = document.getElementById("qr-box");
      try {
        const qr = qrcode(0, "M"); qr.addData(link); qr.make(); box.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); box.hidden = false;
      } catch { box.hidden = false; box.textContent = "QR 라이브러리를 불러오지 못했어요."; }
      document.getElementById("invite-countdown").innerHTML = '<span></span><br><input aria-label="훈련생 QR 접속 주소" readonly style="width:min(100%,520px);margin-top:8px;padding:8px;border:1px solid var(--line);border-radius:8px">';
      document.querySelector("#invite-countdown input").value = link;
      updateCountdown();
      clearInterval(adminTimer); adminTimer = setInterval(updateCountdown, 1000);
    } catch (error) { showAdminError(error); }
    finally { button.disabled = false; }
  }

  function updateCountdown() {
    const seconds = Math.max(0, Math.ceil((inviteExpires - Date.now()) / 1000));
    const label = document.querySelector("#invite-countdown span"); if (!label) return clearInterval(adminTimer);
    label.textContent = seconds ? `만료 시각 ${dateLabel(inviteExpires)} · 남은 시간 ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : "QR이 만료됐어요. 새 QR을 만들어 주세요.";
    if (!seconds) { clearInterval(adminTimer); createInvite(); }
  }

  async function loadReaders() {
    const data = await call("/account/training/readers", null, { admin: true, method: "GET" });
    const target = document.getElementById("reader-list"); if (!target) return;
    if (!data.readers.length) { target.innerHTML = `<p class="muted">아직 접근 요청이 없어요.</p>`; return; }
    target.innerHTML = `<ul class="reader-list">${data.readers.map((reader) => {
      const status = { pending: "승인 대기", approved: "승인됨", revoked: "권한 회수" }[reader.status] || reader.status;
      const choices = reader.status === "revoked" ? "" : `<fieldset><legend>열람 허용 자료</legend>${data.materials.map((item) =>
        `<label><input type="checkbox" name="material" value="${esc(item.id)}" ${reader.materials.includes(item.id) ? "checked" : ""}> ${esc(item.title)}</label><br>`).join("")}</fieldset>`;
      const id = esc(reader.id);
      const action = reader.status === "pending"
        ? `<button class="btn" data-action="approve" data-id="${id}">승인</button>`
        : reader.status === "approved"
          ? `<button class="btn secondary" data-action="scope" data-id="${id}">범위 저장</button><button class="btn danger" data-action="revoke" data-id="${id}">권한 회수</button>`
          : "";
      const remove = reader.status !== "approved" ? `<button class="btn secondary" data-action="remove" data-id="${id}">기록 삭제</button>` : "";
      return `<li class="row"><div><p><b>${esc(reader.label)}</b> <span class="label ${reader.status}">${status}</span></p><p class="muted small">요청 ${dateLabel(reader.requestedAt)}${reader.approvedAt ? ` · 승인 ${dateLabel(reader.approvedAt)}` : ""}</p>${choices}</div><div class="row-actions">${action}${remove}</div></li>`;
    }).join("")}</ul>`;
  }

  async function handleReaderAction(event) {
    const button = event.target.closest("[data-action]"); if (!button) return;
    const action = button.dataset.action;
    if (action === "revoke" && !confirm("이 기기의 훈련 자료 접근 권한을 회수할까요?")) return;
    button.disabled = true;
    const materials = [...button.closest("li").querySelectorAll('[name="material"]:checked')].map((input) => input.value);
    try { await call(`/account/training/${action}`, { deviceId: button.dataset.id, materials }, { admin: true }); await loadReaders(); }
    catch (error) { showAdminError(error); button.disabled = false; }
  }

  function showAdminError(error) { const status = document.getElementById("admin-status"); if (status) status.innerHTML = message(error.message, true); else app.insertAdjacentHTML("afterbegin", message(error.message, true)); }

  start();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden || adminMode) return;
    if (ownerPreview) {
      call("/account/training/library", null, { admin: true, method: "GET" }).catch(start);
    } else if (deviceToken && currentMaterial) {
      const item = currentMaterial.id;
      call("/training/status", { deviceToken }).then((data) => {
        if (currentMaterial?.id === item && !data.materials?.some(({ id }) => id === item)) start();
      }).catch(() => { if (currentMaterial?.id === item) start(); });
    }
  });
})();
