(() => {
  "use strict";
  const API = "https://daily-bible-reminder.gimbap-lettuce.workers.dev";
  const DEVICE_KEY = "daily-training-device-v1";
  const PROGRESS_KEY = "daily-training-progress-v1";
  const READING_POSITION_KEY = "daily-training-reading-position";
  const READING_SIZE_KEY = "daily-training-reading-size";
  const READING_SIZES = { small: "작게", normal: "보통", large: "크게", largest: "아주 크게" };
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
  let readingSize = loadReadingSize();
  let viewRequest = 0;
  const progress = readReadingRecord(PROGRESS_KEY);
  const readingPositions = readReadingRecord(READING_POSITION_KEY);

  if (inviteCode) {
    sessionStorage.setItem("daily-training-invite", inviteCode);
    history.replaceState(history.state, "", location.pathname + location.search);
  }

  function readReadingRecord(key) {
    try {
      const record = JSON.parse(localStorage.getItem(key));
      return record && typeof record === "object" && !Array.isArray(record) ? record : {};
    } catch { return {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch { /* Keep this session's progress in memory. */ }
  }
  function loadReadingSize() {
    try {
      const size = localStorage.getItem(READING_SIZE_KEY);
      if (Object.hasOwn(READING_SIZES, size)) return size;
    } catch { /* Default to the usual reading size. */ }
    return "normal";
  }
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
    const editions = materials.find(({ id }) => id === "westminster")?.editions || [];
    const theory = materials.find(({ id }) => id === "discipleship")?.theory || [];
    const cards = [
      { item: "discipleship", semester: 1, label: "제자훈련 · 1학기", title: "복음과 교리",
        description: "신앙고백부터 재림까지 12과를 읽고 연습하세요.", read: "1학기 이론정리 읽기" },
      { item: "discipleship", semester: 2, label: "제자훈련 · 2학기", title: "제자의 삶",
        description: "순종과 섬김부터 서로 사랑하기까지, 12과를 읽고 연습하세요.", read: "2학기 이론정리 읽기" },
      { item: "westminster", label: "웨스트민스터", title: "신도게요서",
        description: "33장의 교리와 미주를 읽고, 장별로 핵심을 확인하세요.", read: "신도게요서 읽기" },
    ].filter((course) => allowed.has(course.item)).map((course) => {
      const theoryId = theory.find(({ id }) => id === `course-theory-${course.semester}`)?.id;
      const readingId = course.semester ? theoryId || (course.semester === 1 ? course.item : "") : course.item;
      return `
      <article class="card training-course" data-course="${course.semester || course.item}">
        <p class="course-kicker">${esc(course.label)}</p>
        <h2>${esc(course.title)}</h2>
        <p class="muted">${esc(course.description)}</p>
        <div class="course-actions">
          <button class="btn primary" type="button" data-practice-item="${course.item}" data-semester="${course.semester || ""}">문제 풀기</button>
          ${readingId ? `<button class="btn secondary" type="button" data-open-material="${esc(readingId)}">${esc(course.read)}</button>` : ""}
        </div>
        ${course.item === "westminster" && editions.length ? `<details class="training-editions"><summary>보강 자료 2종 읽기</summary>
          ${editions.map(({ id, title }) => `<button class="btn ghost small" type="button" data-open-material="${esc(id)}">${esc(title)}</button>`).join("")}
        </details>` : ""}
      </article>`;
    }).join("");
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

  function openPractice(initial, back = start) {
    ++viewRequest;
    clearInterval(pollTimer);
    currentMaterial = null;
    const request = (action, body) => ownerPreview
      ? call(`/account/training/practice/${action}`, body, { admin: true })
      : call(`/training/practice/${action}`, { ...body, deviceToken });
    window.TrainingPractice.open(app, request, back, initial);
  }

  function readMaterial(item, section) {
    if (ownerPreview) return call("/account/training/content", { item, section }, { admin: true });
    return call("/training/content", { deviceToken, item, section });
  }

  async function openMaterial(id, section) {
    const requestId = ++viewRequest;
    app.innerHTML = `<section class="card">승인과 자료를 확인하고 있어요…</section>`;
    try {
      const material = await readMaterial(id);
      if (requestId !== viewRequest) return;
      currentMaterial = material;
      if (Number.isInteger(section)) await openSection(section);
      else renderReadingToc();
    } catch (error) { if (requestId === viewRequest) showReadError(error); }
  }

  async function openSection(index) {
    const requestId = ++viewRequest;
    app.innerHTML = '<section class="card" role="status">단원을 불러오는 중이에요…</section>';
    try {
      const section = await readMaterial(currentMaterial.id, index);
      if (requestId !== viewRequest) return;
      currentLesson = index;
      readingPositions[currentMaterial.id] = index;
      try { localStorage.setItem(READING_POSITION_KEY, JSON.stringify(readingPositions)); } catch { /* Keep the position in memory. */ }
      renderMaterial(section.content);
    } catch (error) { if (requestId === viewRequest) showReadError(error); }
  }

  function showReadError(error) {
    currentMaterial = null;
    app.innerHTML = `<section class="card"><h2>자료를 열지 못했어요</h2>${message(error.message, true)}<button class="btn secondary" id="back-library">목록으로</button></section>`;
    document.getElementById("back-library").addEventListener("click", start);
  }

  function readingDone() {
    const done = progress[currentMaterial.id];
    return new Set(Array.isArray(done) ? done.filter((index) =>
      Number.isInteger(index) && index >= 0 && index < currentMaterial.sections.length) : []);
  }

  function readingFontControl() {
    return `<label class="reading-font">글자 크기
      <select id="reading-font-size">${Object.entries(READING_SIZES).map(([size, label]) =>
        `<option value="${size}" ${size === readingSize ? "selected" : ""}>${label}</option>`).join("")}</select>
    </label>`;
  }

  function bindReadingFont() {
    const article = app.querySelector(".reading-text");
    const select = app.querySelector("#reading-font-size");
    if (article) article.dataset.readingSize = readingSize;
    select.addEventListener("change", () => {
      const size = select.value;
      if (!Object.hasOwn(READING_SIZES, size)) return;
      readingSize = size;
      if (article) article.dataset.readingSize = size;
      try { localStorage.setItem(READING_SIZE_KEY, size); } catch { /* Keep the selection in memory. */ }
    });
  }

  function tocGroups(titles) {
    const groups = [];
    const numberedTitle = (title) => title.match(/^(?:[12]학기\s*)?(?:제\s*)?(\d+)\s*(장|과)/u);
    titles.forEach((title, index) => {
      const numbered = numberedTitle(title);
      const kind = numbered?.[2] || "";
      const last = groups.at(-1);
      const entry = { title, index, number: numbered?.[1] };
      if (last?.kind === kind && last.entries.length < 6) last.entries.push(entry);
      else groups.push({ kind, entries: [entry] });
    });
    return groups.map(({ kind, entries }) => {
      if (!kind) return { label: groups.length === 1 ? "전체 목차" : "참고 자료", entries };
      const first = entries[0].number;
      const last = entries.at(-1).number;
      return { label: first === last ? `${first}${kind}` : `${first}–${last}${kind}`, entries };
    });
  }

  function renderReadingToc(focusIndex) {
    const units = currentMaterial.sections;
    const done = readingDone();
    const saved = readingPositions[currentMaterial.id];
    const hasPosition = Number.isInteger(saved) && saved >= 0 && saved < units.length;
    const following = hasPosition ? units.findIndex((_, i) => i >= saved && !done.has(i)) : -1;
    const next = following >= 0 ? following : units.findIndex((_, i) => !done.has(i));
    const firstToOpen = focusIndex ?? (next < 0 ? 0 : next);
    const groups = tocGroups(units);
    const unitList = (entries) => `<ul class="reading-unit-list">${entries.map(({ title, index }) => `
      <li><button class="reading-unit" type="button" data-reading-unit="${index}">
        <span>${esc(title)}</span>
        ${done.has(index) ? '<span class="reading-done">완료</span>' : '<span class="reading-next" aria-hidden="true">›</span>'}
      </button></li>`).join("")}</ul>`;
    app.innerHTML = `
      <div class="topline reading-toolbar">
        <button class="back" type="button" id="back-library">‹ 자료 목록</button>
        ${readingFontControl()}
      </div>
      <section class="card reading-toc">
        <h2 tabindex="-1" id="reading-title">${esc(currentMaterial.title)}</h2>
        <div class="topline reading-toc-meta">
          <p class="muted">목차 · ${done.size} / ${units.length}개 읽음</p>
          ${next >= 0 && (hasPosition || done.size) ? `<button class="btn secondary small" type="button" data-reading-unit="${next}">이어 읽기</button>` : ""}
        </div>
        ${groups.length === 1 ? unitList(groups[0].entries) : groups.map(({ label, entries }) => `
          <details class="reading-group" name="training-toc" ${entries.some(({ index }) => index === firstToOpen) ? "open" : ""}>
            <summary>${esc(label)} <span class="muted small">${entries.filter(({ index }) => done.has(index)).length} / ${entries.length}</span></summary>
            ${unitList(entries)}
          </details>`).join("")}
        ${units.length ? "" : '<p class="muted">읽을 단원이 없어요.</p>'}
      </section>`;
    document.getElementById("back-library").addEventListener("click", start);
    app.querySelectorAll("[data-reading-unit]").forEach((button) => button.addEventListener("click", () => {
      openSection(Number(button.dataset.readingUnit));
    }));
    bindReadingFont();
    const returnTo = Number.isInteger(focusIndex) && app.querySelector(`.reading-unit[data-reading-unit="${focusIndex}"]`);
    if (returnTo) returnTo.focus();
    else resetReaderPosition();
  }

  function resetReaderPosition() {
    document.getElementById("reading-title")?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function sectionPractice(section) {
    const { id, practiceItem } = currentMaterial;
    const theorySemester = Number(id.match(/^course-theory-([12])$/u)?.[1]);
    if (theorySemester) {
      const lesson = id === "course-theory-1" && /^보충 이론.*언약신학/u.test(section)
        ? "1"
        : section.match(/^[12]학기\s*(\d+)과/u)?.[1];
      return lesson ? { item: "discipleship", semester: theorySemester, lesson: `${theorySemester}학기 ${lesson}과` } : null;
    }
    if (id === "discipleship") {
      const lesson = THEORY_LESSONS[section.replace(/\s+\(\d+p\)$/u, "")];
      return lesson ? { item: id, semester: 1, lesson: `1학기 ${lesson}과` } : null;
    }
    const chapter = Number(section.match(/^제\s*(\d+)장/u)?.[1]);
    return chapter ? { item: practiceItem || id, section, chapter } : null;
  }

  function markdownInline(text) {
    const pattern = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\*\*\*([^*]+)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_/gu;
    let result = "";
    let end = 0;
    for (const match of text.matchAll(pattern)) {
      const [, label, href, boldItalic, bold, altBold, code, italic, altItalic] = match;
      result += esc(text.slice(end, match.index));
      if (href) {
        try {
          const url = new URL(href);
          result += ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
            ? `<a href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`
            : esc(match[0]);
        } catch { result += esc(match[0]); }
      } else if (boldItalic) result += `<strong><em>${esc(boldItalic)}</em></strong>`;
      else if (bold || altBold) result += `<strong>${markdownInline(bold || altBold)}</strong>`;
      else if (code) result += `<code>${esc(code)}</code>`;
      else result += `<em>${esc(italic || altItalic)}</em>`;
      end = match.index + match[0].length;
    }
    return result + esc(text.slice(end));
  }

  function markdownHtml(markdown, isNotes = false) {
    const lines = String(markdown || "").split(/\r?\n/u);
    let html = "", para = [], list = "", orderedNext = 0, code = false, codeLines = [];
    const inline = markdownInline;
    const closePara = () => { if (para.length) { html += `<p>${inline(para.join(" "))}</p>`; para = []; } };
    const closeList = () => { if (list) { html += `</${list}>`; list = ""; } };
    const cells = (line) => line.trim().replace(/^\||\|$/gu, "").split("|").map((cell) => cell.trim());
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (/^\s*```/.test(line)) { closePara(); closeList(); if (code) { html += `<pre>${esc(codeLines.join("\n"))}</pre>`; codeLines = []; } code = !code; continue; }
      if (code) { codeLines.push(line); continue; }
      const s = line.trim();
      if (!s) { closePara(); closeList(); continue; }
      const heading = s.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        closePara(); closeList();
        const level = Math.min(Math.max(heading[1].length, 3), 6);
        html += `<h${level}>${inline(heading[2])}</h${level}>`;
        continue;
      }
      if (s.startsWith("> ")) {
        closePara(); closeList();
        const quote = [s.slice(2)];
        while (lines[index + 1]?.trimStart().startsWith("> ")) quote.push(lines[++index].trimStart().slice(2));
        html += `<blockquote>${inline(quote.join(" "))}</blockquote>`;
        continue;
      }
      if (s.includes("|") && lines[index + 1]?.includes("|")) {
        const header = cells(s);
        const separator = cells(lines[index + 1]);
        if (header.length === separator.length && separator.every((cell) => /^:?-{3,}:?$/u.test(cell))) {
          closePara(); closeList();
          const rows = [];
          index++;
          while (lines[index + 1]?.trim().includes("|") && cells(lines[index + 1]).length === header.length) {
            rows.push(cells(lines[++index]));
          }
          html += `<div class="reading-table" role="region" aria-label="표" tabindex="0"><table>
            <thead><tr>${header.map((cell) => `<th scope="col">${inline(cell)}</th>`).join("")}</tr></thead>
            <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
          </table></div>`;
          continue;
        }
      }
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
        const number = ordered ? Number(ordered[1]) : 0;
        if (list !== next || (ordered && number !== orderedNext)) {
          closeList();
          list = next;
          html += ordered && number > 1 ? `<ol start="${number}">` : `<${list}>`;
        }
        orderedNext = number + 1;
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
    const done = readingDone();
    const title = units[currentLesson];
    const isNotes = /^(?:미주|각주)(?:$|\s)/u.test(title);
    const practice = sectionPractice(title);
    const appendix = currentMaterial.id === "course-theory-1" && /^1학기\s*1과/u.test(title)
      ? units.findIndex((heading) => /^보충 이론.*언약신학/u.test(heading))
      : -1;
    const last = currentLesson + 1 === units.length;
    app.innerHTML = `
      <div class="topline reading-toolbar">
        <button class="back" id="back-toc" type="button">‹ 목차</button>
        ${readingFontControl()}
      </div>
      <section class="card">
        <article class="lesson-body">
          <p class="muted small reading-source">${esc(currentMaterial.title)} · ${currentLesson + 1} / ${units.length}${done.has(currentLesson) ? " · 읽음" : ""}</p>
          <h2 tabindex="-1" id="reading-title">${esc(title)}</h2>
          ${practice || appendix >= 0 ? `<div class="course-actions">
            ${practice ? '<button class="btn secondary small" id="practice-section" type="button">이 단원 문제 풀기</button>' : ""}
            ${appendix >= 0 ? '<button class="btn ghost small" id="read-appendix" type="button">언약신학 보충 읽기</button>' : ""}
          </div>` : ""}
          <div class="reading-text">${markdownHtml(content, isNotes)}</div>
          <div class="reading-actions">
            ${currentLesson > 0 ? '<button class="btn ghost" type="button" id="previous">‹ 이전 단원</button>' : ""}
            <button class="btn" id="mark-done" type="button">${last ? "완료하고 목차로" : "완료하고 다음 ›"}</button>
          </div>
        </article>
      </section>`;
    bindReadingFont();
    resetReaderPosition();
    document.getElementById("back-toc").addEventListener("click", () => renderReadingToc(currentLesson));
    document.getElementById("read-appendix")?.addEventListener("click", () => openSection(appendix));
    if (practice) {
      const { id } = currentMaterial;
      const index = currentLesson;
      document.getElementById("practice-section").addEventListener("click", () => openPractice({ ...practice, fromReading: true }, () => openMaterial(id, index)));
    }
    document.getElementById("mark-done").addEventListener("click", () => {
      done.add(currentLesson);
      progress[currentMaterial.id] = [...done].sort((a, b) => a - b);
      saveProgress();
      if (last) renderReadingToc(currentLesson);
      else openSection(currentLesson + 1);
    });
    document.getElementById("previous")?.addEventListener("click", () => openSection(currentLesson - 1));
  }

  function renderAdmin() {
    clearInterval(adminTimer);
    app.innerHTML = `<section class="card"><h2>훈련 자료 접근 관리</h2><p class="muted">관리자 계정으로 요청을 승인하고, 승인된 기기의 권한을 회수할 수 있어요.</p><div id="admin-status"></div><div class="qr-layout"><div id="qr-box" class="qr-img" hidden></div><div><button class="btn" id="new-invite">동적 훈련생 QR 만들기</button><p id="invite-countdown" class="muted small">QR은 5분 동안 유효해요.</p><p class="muted small">훈련생은 QR을 스캔해 요청을 제출합니다. QR 자체로 자료가 열리지는 않으며, 아래에서 승인해야 해요.</p></div></div></section><section class="card"><div class="topline"><h2>요청 및 승인된 기기</h2><button class="btn secondary" id="refresh-readers">새로고침</button></div><div id="reader-list" class="muted">명단을 불러오는 중…</div></section><p><a class="back" href="index.html#stats">Bible-reading 앱으로 돌아가기</a></p>`;
    app.insertAdjacentHTML("afterbegin", '<p><a class="btn secondary" href="training.html?preview=1">자료 열기 · 문제풀이</a></p>');
    document.getElementById("new-invite").addEventListener("click", createInvite);
    document.getElementById("refresh-readers").addEventListener("click", loadReaders);
    document.getElementById("reader-list").addEventListener("click", handleReaderAction);
    loadReaders().catch(showAdminError);
    window.TrainingNotes?.mount(app, (action, data, method) => call(`/account/training/notes/${action}`, data, { admin: true, method }));
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
        if (currentMaterial?.id === item && !data.materials?.some(({ id, editions, theory }) =>
          id === item || editions?.some((edition) => edition.id === item) || theory?.some(({ id }) => id === item))) start();
      }).catch(() => { if (currentMaterial?.id === item) start(); });
    }
  });
})();
