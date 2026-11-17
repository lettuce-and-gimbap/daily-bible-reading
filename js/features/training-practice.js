(() => {
  "use strict";

  const typeLabels = { choice: "사지선다", short: "단답식", written: "주관식" };
  const tracks = [
    { key: "term-1", title: "제자훈련 1학기", item: "discipleship", semester: 1 },
    { key: "term-2", title: "제자훈련 2학기", item: "discipleship", semester: 2 },
    { key: "westminster", title: "웨스트민스터 신도게요서", item: "westminster" },
  ];
  const unitOrder = (unit) => Number(unit.title.match(/(?:제\s*|학기\s+)(\d+)[장과]/u)?.[1]) || 0;
  const inTrack = (unit, track) => unit.item === track.item && (track.semester ? unit.semester === track.semester : true);
  const rotationKey = "daily-training-rounds-v3";
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);

  function errorText(element, error) {
    element.textContent = error.message;
    element.hidden = false;
  }

  function readRounds() {
    try { return JSON.parse(localStorage.getItem(rotationKey)) || {}; } catch { return {}; }
  }

  async function open(host, request, back, initial = {}) {
    const panel = document.createElement("section");
    panel.className = "card practice-card";
    host.innerHTML = '<button type="button" class="btn secondary" data-practice-back>‹ 자료 목록</button>';
    host.append(panel);
    host.querySelector("[data-practice-back]").addEventListener("click", back);
    panel.innerHTML = '<h2>문제풀이</h2><p role="status">연습 범위를 불러오는 중이에요…</p>';

    let catalog;
    try { catalog = await request("catalog", {}); }
    catch (error) { panel.innerHTML = '<p class="status error" role="alert"></p>'; errorText(panel.firstChild, error); return; }
    if (!panel.isConnected) return;
    const groups = tracks.map((track) => ({
      ...track,
      units: catalog.units.map((unit, index) => ({ ...unit, index }))
        .filter((unit) => inTrack(unit, track)).sort((a, b) => unitOrder(a) - unitOrder(b)),
    })).filter(({ units }) => units.length);
    let filters = { ...initial };
    let queue = [];
    let responses = [];
    let index = 0;
    let correction = false;
    let ticket = null;

    function showSetup() {
      panel.innerHTML = `
        <h2 tabindex="-1">문제풀이</h2>
        <p class="muted" data-range-count></p>
        <form class="practice-setup">
          <label>범위<select name="range"><option value="">허용된 모든 범위</option>
            ${groups.map(({ key, title, units }) =>
              `<optgroup label="${escape(title)}"><option value="${key}">${escape(title)} 전체</option>
              ${key === "westminster" && units.some(({ supplements }) => supplements) ? '<option value="westminster-supplement">두 판본 비교 문제</option>' : ""}
              ${units.map((unit) => `<option value="unit-${unit.index}">${escape(unit.title)} (${unit.count}문제)</option>`).join("")}</optgroup>`).join("")}
          </select></label>
          <label>문제 유형<select name="type"><option value="">유형 섞기</option>${Object.entries(typeLabels).map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select></label>
          <p class="muted small">주관식은 문항의 핵심 요소를 80% 이상 충족하면 정답으로 처리해요.</p>
          <p class="status error" role="alert" hidden></p>
          <button class="btn" type="submit" ${catalog.total ? "" : "disabled"}>연습 시작</button>
        </form>`;
      const form = panel.querySelector("form");
      const unitIndex = catalog.units.findIndex((unit) => unit.item === filters.item && (
        unit.title === filters.section || (filters.lesson && unit.title.startsWith(filters.lesson))
        || (filters.chapter && unitOrder(unit) === filters.chapter)
      ));
      const track = tracks.find((candidate) => candidate.item === filters.item && candidate.semester === filters.semester);
      form.elements.range.value = filters.supplement ? "westminster-supplement" : unitIndex >= 0 ? `unit-${unitIndex}` : (track?.key || "");
      if (form.elements.range.selectedIndex < 0) form.elements.range.value = "";
      form.elements.type.value = filters.type || "";
      const updateRangeCount = () => {
        const range = form.elements.range.value;
        const group = groups.find(({ key }) => key === range);
        const count = range === "westminster-supplement" ? catalog.units.reduce((total, { supplements }) => total + (supplements || 0), 0)
          : range.startsWith("unit-") ? catalog.units[Number(range.slice(5))].count
          : group ? group.units.reduce((total, { count }) => total + count, 0) : catalog.total;
        panel.querySelector("[data-range-count]").textContent = `선택한 범위 ${count}문항 · 한 회차 최대 10문제`;
      };
      updateRangeCount();
      form.elements.range.addEventListener("change", updateRangeCount);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const range = form.elements.range.value;
        const unit = range.startsWith("unit-") ? catalog.units[Number(range.slice(5))] : null;
        const track = tracks.find(({ key }) => key === range);
        const supplement = range === "westminster-supplement" ? true : undefined;
        filters = { item: unit?.item || track?.item || (supplement ? "westminster" : undefined), section: unit?.title, supplement,
          semester: unit?.semester || track?.semester, type: form.elements.type.value || undefined };
        startRound(form);
      });
    }

    async function startRound(form) {
      const button = form.querySelector("button");
      const status = form.querySelector("[role=alert]");
      button.disabled = true;
      status.hidden = true;
      const key = JSON.stringify(filters);
      const rounds = readRounds();
      const rotation = rounds[key] || 0;
      try {
        const result = await request("start", { ...filters, rotation });
        if (!panel.isConnected) return;
        if (!result.questions.length) throw new Error("이 범위와 유형을 함께 가진 문제가 없어요. 유형이나 범위를 바꿔 주세요.");
        ticket = result.ticket;
        try { localStorage.setItem(rotationKey, JSON.stringify({ ...rounds, [key]: (rotation + 1) % 10000 })); } catch { /* optional */ }
        begin(result.questions, false);
      } catch (error) { errorText(status, error); }
      finally { button.disabled = false; }
    }

    function begin(questions, reviewing) {
      queue = questions;
      responses = [];
      index = 0;
      correction = reviewing;
      showQuestion();
    }

    function showQuestion() {
      const question = queue[index];
      const input = question.type === "choice"
        ? question.choices.map((choice, i) => `<label class="practice-choice"><input type="radio" name="reply" value="${i}" required><span>${escape(choice)}</span></label>`).join("")
        : question.type === "short"
          ? '<label class="practice-text">내 답<input name="reply" required maxlength="130" autocomplete="off"></label>'
          : '<label class="practice-text">내 답<textarea name="reply" rows="5" required maxlength="360" placeholder="핵심을 문장으로 설명해 주세요."></textarea></label>';
      panel.innerHTML = `
        <div class="topline"><h2 tabindex="-1">${correction ? "오답 다시 풀기" : "문제풀이"}</h2><span>${index + 1} / ${queue.length}</span></div>
        <progress aria-label="문제 순서" max="${queue.length}" value="${index + 1}"></progress>
        <p class="muted small">${escape(question.section)} · ${typeLabels[question.type]}</p>
        <form><fieldset class="practice-question"><legend>${escape(question.prompt)}</legend>${input}</fieldset>
          <p class="status error" role="alert" hidden></p><button class="btn" type="submit">정답 확인</button>
        </form>
        <div class="practice-feedback" aria-live="polite"></div>`;
      panel.querySelector("h2").focus();
      panel.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        submitAnswer(event.currentTarget, question);
      });
    }

    async function submitAnswer(form, question) {
      const raw = String(new FormData(form).get("reply") ?? "").trim();
      const status = form.querySelector("[role=alert]");
      if (!raw) return errorText(status, new Error("답을 입력해 주세요."));
      const controls = [...form.querySelectorAll("input, textarea, button")];
      controls.forEach((control) => { control.disabled = true; });
      status.hidden = true;
      try {
        const grade = await request("grade", {
          item: question.item, id: question.id, ticket, reply: question.type === "choice" ? Number(raw) : raw,
        });
        if (!panel.isConnected) return;
        const result = { question, answer: question.type === "choice" ? question.choices[Number(raw)] : raw, ...grade };
        responses.push(result);
        if (question.type === "choice") {
          for (const label of form.querySelectorAll(".practice-choice")) {
            const input = label.querySelector("input");
            if (question.choices[Number(input.value)] === result.modelAnswer) label.classList.add("is-answer");
            else if (input.checked) label.classList.add("is-miss");
          }
        }
        const feedback = panel.querySelector(".practice-feedback");
        feedback.innerHTML = `${reviewHtml(result)}
          <button class="btn" type="button">${index + 1 < queue.length ? "다음 문제" : "결과 보기"}</button>`;
        feedback.querySelector("button").addEventListener("click", () => {
          index++;
          if (index < queue.length) showQuestion();
          else showResults();
        });
        feedback.querySelector("button").focus();
      } catch (error) {
        errorText(status, error);
        controls.forEach((control) => { control.disabled = false; });
      }
    }

    function reviewHtml(result) {
      return `<p class="status${result.correct ? "" : " error"}">${result.correct ? "정답이에요." : "해설에서 근거를 확인해 보세요."}${result.score == null ? "" : ` · 핵심 요소 ${result.score}%`}</p>
        <p><b>내 답</b> ${escape(result.answer)}</p>
        <p><b>${result.rubric ? "모범 답안" : "정답"}</b> ${escape(result.modelAnswer)}</p>
        ${result.rubric ? `<ul class="practice-rubric">${result.rubric.map(({label, matched}) =>
          `<li>${matched ? "확인됨" : "보완할 내용"} · ${escape(label)}</li>`).join("")}</ul>` : ""}
        <p>${escape(result.feedback)}</p><p class="muted small">${escape(result.source)}</p>`;
    }

    function showResults() {
      const misses = responses.filter((result) => !result.correct);
      panel.innerHTML = `
        <h2 tabindex="-1">${correction ? "오답 교정 결과" : "연습 결과"}</h2>
        <p><b>${responses.length - misses.length} / ${responses.length} 정답</b></p>
        ${responses.map((result) => `<details class="practice-result"><summary>${result.correct ? "정답" : "오답"} · ${escape(result.question.prompt)}</summary>${reviewHtml(result)}</details>`).join("")}
        <div class="inline practice-actions">${misses.length ? '<button class="btn" data-retry>틀린 문제만 다시 풀기</button>' : ""}
          <button class="btn secondary" data-setup>범위 선택</button></div>`;
      panel.querySelector("[data-retry]")?.addEventListener("click", () => begin(misses.map(({ question }) => question), true));
      panel.querySelector("[data-setup]").addEventListener("click", () => { showSetup(); panel.querySelector("h2").focus(); });
      panel.querySelector("h2").focus();
    }

    showSetup();
    panel.querySelector("h2").focus();
  }

  window.TrainingPractice = { open };
})();
