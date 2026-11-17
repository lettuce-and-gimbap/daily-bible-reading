(() => {
  "use strict";

  const MAX_BYTES = 12000;
  const encoder = new TextEncoder();

  function mount(host, request) {
    const card = document.createElement("details");
    card.className = "card training-notes";
    card.innerHTML = `
      <summary>관리자 보충 노트 편집</summary>
      <p class="muted">저장하면 선택한 과의 교재 정리와 퀴즈에 반영돼요.</p>
      <form class="practice-setup">
        <div class="inline wrap">
          <label>학기<select name="semester"><option value="1">1학기</option><option value="2">2학기</option></select></label>
          <label>과<select name="lesson">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}과</option>`).join("")}</select></label>
        </div>
        <label>Markdown 또는 텍스트 파일<input name="file" type="file" accept=".md,.txt,text/plain,text/markdown"></label>
        <label>공개할 노트<textarea name="text" rows="9" placeholder="예: 은혜 언약: 하나님이 타락한 죄인에게 그리스도 안에서 구원의 은혜를 주시는 언약"></textarea></label>
        <p class="muted small">개념: 설명 또는 **핵심어**를 포함한 문장에서 단답 문제를 만듭니다. 퀴즈에만 넣을 문항은 두 줄에 Q: 질문, A: 답 순서로 입력하세요. 개인 간증이나 기도 제목은 학습자에게 공개할 내용만 입력하세요.</p>
        <div class="inline wrap"><button class="btn secondary" type="button" data-preview>추가될 문제 확인</button>
          <button class="btn primary" type="submit">저장하고 반영</button></div>
        <p class="muted small" data-note-size></p>
        <p class="status" role="status" hidden></p>
        <section data-note-preview hidden aria-label="노트 퀴즈 미리보기"></section>
      </form>`;
    host.prepend(card);
    const form = card.querySelector("form");
    const { semester, lesson, text, file } = form.elements;
    const status = card.querySelector("[role=status]");
    const preview = card.querySelector("[data-note-preview]");
    const counter = card.querySelector("[data-note-size]");
    let revision = 0;
    let savedText = "";
    let previousTerm = "1";
    let previousLesson = "1";
    let loaded = false;
    let busy = false;
    const loadTarget = () => ({ semester: Number(semester.value), lesson: Number(lesson.value) });

    function report(message, bad = false) {
      status.textContent = message;
      status.classList.toggle("error", bad);
      status.hidden = false;
    }
    function setBusy(value) {
      busy = value;
      form.querySelectorAll("button, select, textarea, input").forEach((control) => {
        control.disabled = value || (!loaded && !["semester", "lesson"].includes(control.name));
      });
    }
    function updateLength() {
      const size = encoder.encode(text.value).byteLength;
      counter.textContent = `${size.toLocaleString()} / ${MAX_BYTES.toLocaleString()} 바이트`;
      return size;
    }
    function showPreview(questions) {
      preview.hidden = false;
      preview.replaceChildren();
      const heading = document.createElement("h3");
      heading.textContent = `노트 문제 ${questions.length}개`;
      preview.append(heading);
      const list = document.createElement("ol");
      for (const question of questions) {
        const row = document.createElement("li");
        const prompt = document.createElement("p");
        prompt.textContent = question.prompt;
        const answer = document.createElement("p");
        answer.className = "muted small";
        answer.textContent = `답: ${question.accepted[0]}`;
        row.append(prompt, answer);
        list.append(row);
      }
      if (questions.length) preview.append(list);
    }
    async function load() {
      loaded = false;
      revision = 0;
      savedText = "";
      text.value = "";
      file.value = "";
      preview.hidden = true;
      report("노트를 불러오는 중이에요…");
      setBusy(true);
      try {
        const data = await request("load", loadTarget(), "POST");
        revision = data.revision;
        previousTerm = semester.value;
        previousLesson = lesson.value;
        text.value = savedText = data.text;
        loaded = true;
        if (data.questions.length) showPreview(data.questions);
        report(data.text ? "저장된 노트를 불러왔어요." : "이 과에 등록된 노트가 없어요.");
      } catch (error) { report(error.message, true); }
      finally { updateLength(); setBusy(false); }
    }
    function changeLesson() {
      if (text.value !== savedText && !confirm("저장하지 않은 노트를 두고 다른 과로 이동할까요?")) {
        semester.value = previousTerm;
        lesson.value = previousLesson;
        return;
      }
      load();
    }
    async function process(action) {
      if (!loaded || busy) return;
      if (updateLength() > MAX_BYTES) return report("노트가 12 KB를 넘어요. 내용을 줄여 주세요.", true);
      if (action === "save" && !text.value.trim() && savedText && !confirm("이 과의 보충 노트와 여기서 만든 문제를 지울까요?")) return;
      setBusy(true);
      try {
        const data = await request(action, { ...loadTarget(), text: text.value, revision }, "POST");
        showPreview(data.questions);
        if (action === "save") {
          revision = data.revision;
          savedText = text.value;
          report(`교재 정리와 문제 ${data.questions.length}개가 반영됐어요.`);
        } else report("저장하면 아래 문제가 반영돼요.");
      } catch (error) { report(error.message, true); }
      finally { setBusy(false); }
    }

    card.addEventListener("toggle", () => { if (card.open && !loaded && !busy) load(); });
    semester.addEventListener("change", changeLesson);
    lesson.addEventListener("change", changeLesson);
    text.addEventListener("input", () => { updateLength(); preview.hidden = true; });
    file.addEventListener("change", async () => {
      const chosen = file.files?.[0];
      if (!chosen) return;
      if (!/\.(?:md|txt)$/iu.test(chosen.name) || chosen.size > MAX_BYTES) {
        report("12 KB 이내의 .md 또는 .txt 파일을 선택해 주세요.", true);
        return;
      }
      setBusy(true);
      try {
        text.value = new TextDecoder("utf-8", { fatal: true }).decode(await chosen.arrayBuffer());
        updateLength();
        preview.hidden = true;
        report("파일 내용을 불러왔어요. 저장하면 반영됩니다.");
      } catch { report("UTF-8 형식으로 저장한 텍스트 파일을 선택해 주세요.", true); }
      finally { setBusy(false); }
    });
    card.querySelector("[data-preview]").addEventListener("click", () => process("preview"));
    form.addEventListener("submit", (event) => { event.preventDefault(); process("save"); });
    setBusy(false);
  }

  window.TrainingNotes = { mount };
})();
