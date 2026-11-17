(() => {
  "use strict";

  const labels = { choice: "사지선다", short: "단답식", written: "주관식" };
  const choiceMarks = ["①", "②", "③", "④"];

  function html(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }

  function markdown(value) {
    return String(value ?? "").replace(/\s+/gu, " ").trim()
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/[\\`*_~\[\]]/g, "\\$&");
  }

  function completedRound(responses, date = new Date()) {
    const day = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(date);
    return {
      day,
      items: responses.map(({ question, modelAnswer, feedback, source, rubric }) => {
        const choices = question.type === "choice" ? [...question.choices] : [];
        const correctIndex = choices.indexOf(modelAnswer);
        return {
          section: question.section,
          type: labels[question.type],
          prompt: question.prompt,
          choices,
          model: correctIndex >= 0 ? `${choiceMarks[correctIndex]} ${modelAnswer}` : modelAnswer,
          answerLabel: question.type === "written" ? "모범 답안" : "정답",
          feedback,
          source,
          rubric: rubric?.map(({ label }) => label) || [],
        };
      }),
    };
  }

  function markdownFor(round) {
    const lines = ["# 제자훈련 문제지", "", `${round.day} · ${round.items.length}문항`, ""];
    round.items.forEach((item, index) => {
      lines.push(`### ${index + 1}. ${markdown(item.prompt)}`, "", `${markdown(item.section)} · ${item.type}`, "");
      if (item.choices.length) {
        for (const [choice, label] of item.choices.entries()) lines.push(`- ${choiceMarks[choice]} ${markdown(label)}`);
      } else {
        lines.push("답: ______________________________");
        if (item.type === labels.written) lines.push("", "__________________________________", "", "__________________________________");
      }
      lines.push("");
    });
    lines.push("---", "", "# 정답 및 해설", "");
    round.items.forEach((item, index) => {
      lines.push(`### ${index + 1}. ${item.answerLabel}`, "", markdown(item.model), "");
      if (item.rubric.length) lines.push(`**핵심 요소** ${item.rubric.map(markdown).join(" · ")}`, "");
      if (item.feedback) lines.push(`**해설** ${markdown(item.feedback)}`, "");
      if (item.source) lines.push(`**근거** ${markdown(item.source)}`, "");
    });
    return lines.join("\n");
  }

  function downloadMarkdown(responses) {
    const round = completedRound(responses);
    const blob = new Blob([markdownFor(round)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = url;
    download.download = `제자훈련-문제와-정답-${round.day}.md`;
    document.body.append(download);
    download.click();
    download.remove();
    // Safari may start reading the download after the click handler returns.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function printPreview(panel, responses, back) {
    const round = completedRound(responses);
    const questions = round.items.map((item, index) => `
      <article class="training-sheet-item">
        <h3>${index + 1}. ${html(item.prompt)}</h3>
        <p class="training-sheet-context">${html(item.section)} · ${item.type}</p>
        ${item.choices.length
          ? `<ul class="training-sheet-choices">${item.choices.map((choice, position) => `<li>${choiceMarks[position]} ${html(choice)}</li>`).join("")}</ul>`
          : `<p class="training-sheet-blank">답</p>${item.type === labels.written ? '<p class="training-sheet-blank" aria-hidden="true"></p><p class="training-sheet-blank" aria-hidden="true"></p>' : ""}`}
      </article>`).join("");
    const answers = round.items.map((item, index) => `
      <article class="training-sheet-item">
        <h3>${index + 1}. ${item.answerLabel}</h3>
        <p>${html(item.model)}</p>
        ${item.rubric.length ? `<p><b>핵심 요소</b> ${item.rubric.map(html).join(" · ")}</p>` : ""}
        ${item.feedback ? `<p><b>해설</b> ${html(item.feedback)}</p>` : ""}
        ${item.source ? `<p><b>근거</b> ${html(item.source)}</p>` : ""}
      </article>`).join("");
    panel.innerHTML = `
      <div class="training-export-controls">
        <div class="inline">
          <button class="btn secondary" type="button" data-export-back>‹ 연습 결과</button>
          <button class="btn" type="button" data-export-print>인쇄 · PDF 저장</button>
        </div>
        <p class="muted small">PC·안드로이드는 인쇄 대상에서 <b>PDF 저장</b>을 선택하세요. 아이폰·아이패드는 인쇄 미리보기에서 공유 버튼을 눌러 <b>파일에 저장</b>하세요. 공유 버튼이 보이지 않으면 미리보기를 두 손가락으로 확대하세요.</p>
        <p class="muted small">인쇄 창이 열리지 않으면 이 미리보기에서 브라우저 메뉴의 <b>인쇄</b>를 사용하세요.</p>
      </div>
      <div class="training-round-document">
        <section aria-labelledby="training-sheet-heading">
          <h2 id="training-sheet-heading" tabindex="-1">제자훈련 문제지</h2>
          <p class="training-sheet-context">${round.day} · ${round.items.length}문항</p>
          ${questions}
        </section>
        <section class="training-sheet-answers">
          <h2>정답 및 해설</h2>
          ${answers}
        </section>
      </div>`;
    panel.querySelector("[data-export-back]").addEventListener("click", back);
    panel.querySelector("[data-export-print]").addEventListener("click", () => {
      // Keep the printable document mounted when the mobile print sheet returns.
      window.print?.();
    });
    panel.querySelector("#training-sheet-heading").focus();
  }

  window.TrainingExport = { downloadMarkdown, printPreview };
})();
