// Escape first: generated text may use emphasis, but never execute HTML.
function summaryMarkdown(value) {
  return esc(String(value || ""))
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}
let graphPdfLoader;
function loadGraphPdf() {
  if (window.html2pdf) return Promise.resolve();
  if (!graphPdfLoader) graphPdfLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "js/vendor/html2pdf.bundle.min.js";
    script.onload = () => window.html2pdf ? resolve() : reject(new Error("PDF 도구를 불러오지 못했어요."));
    script.onerror = () => reject(new Error("PDF 도구를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요."));
    document.head.append(script);
  }).catch((error) => { graphPdfLoader = null; throw error; });
  return graphPdfLoader;
}
// The summary has one download action above Day; resolve the selected graph on click.
function moveSummaryPdfButton(body) {
  const buttons = [...body.querySelectorAll('[data-rg-pdf]')];
  if (!buttons.length) return;
  const button = buttons.shift();
  buttons.forEach((other) => other.remove());
  button.dataset.rgPdf = "current";
  button.classList.add("sum-pdf-download");
  body.prepend(button);
}
function graphExplanationHtml(rels, people = []) {
  const names = [...new Set([...people.map((p) => p.name), ...rels.flatMap((r) => [r.from, r.to])])]
    .sort((a, b) => a.localeCompare(b, "ko"));
  let first = true;
  return names.map((name) => {
    const mine = rels.filter((r) => r.from === name)
      .sort((a, b) => a.to.localeCompare(b.to, "ko") || a.label.localeCompare(b.label, "ko"));
    if (!mine.length) return "";
    const title = first ? "<h2>3. 관계도 설명</h2>" : "";
    first = false;
    return `<section class="pdf-person-relations">${mine.map((r, i) => `<article class="pdf-item">${i === 0 ? `${title}<h3 class="pdf-person-heading">${esc(name)}</h3>` : ""}<h4>${esc(r.from)} ${r.directed ? "→" : "↔"} ${esc(r.to)} · ${esc(r.label)}</h4>
      ${(r.notes || []).length ? r.notes.map((n) => `<p>${n.ref ? `<small>${esc(n.ref)}</small> · ` : ""}${summaryMarkdown(n.text)}</p>`).join("")
        : `<p><strong>${esc(r.from)}</strong>${r.directed ? "에서" : "와"} <strong>${esc(r.to)}</strong>${r.directed ? " 쪽으로 읽는" : " 사이의"} <strong>${esc(r.label)}</strong> 관계예요.</p>`}
      </article>`).join("")}</section>`;
  }).join("");
}
async function downloadGraphPdf(button) {
  const graph = button.dataset.rgPdf === "current"
    ? [...document.querySelectorAll("#sheet-body [data-rg]")].find((el) => !el.closest("[hidden]"))
    : document.querySelector(`[data-rg="${button.dataset.rgPdf}"]`);
  const model = graph && rgModels[graph.dataset.rg];
  if (!model) return;
  const card = graph.closest(".sum-card") || graph.parentElement;
  const selection = card.querySelector(".rg-chap .on")?.textContent || "";
  const heading = (document.querySelector("#sheet-body .sum-head")?.innerText || card.querySelector("h3")?.textContent || "관계도") + (selection && selection !== "분량 전체" ? ` · ${selection}` : "");
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "PDF 만드는 중…";
  const host = document.createElement("div");
  host.className = "graph-pdf-host";
  const doc = document.createElement("div");
  doc.className = "graph-pdf";
  const people = [...(model.people || model.names.map((name) => ({ name, role: model.roles[name] })))].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  doc.innerHTML = `<h1>관계도 및 설명서</h1><p>${esc(heading).replace(/\n/g, " · ")}</p>
    <h2>1. 인물 설명</h2><div class="pdf-people">${people.map((p) => `<article class="pdf-person"><h3>${esc(p.display || p.name)}</h3><p>${summaryMarkdown(p.role || "이 본문에 등장하는 인물이에요.")}</p></article>`).join("")}</div>
    <section class="pdf-diagram"><h2>2. 관계도</h2><img alt="등장 인물 관계도"><p>화살표는 출발 인물에서 도착 인물 쪽으로 읽어요. 점선은 대립이나 갈등을 나타내요.</p></section>
    ${graphExplanationHtml(model.rels, people)}`;
  host.append(doc);
  document.body.append(host);
  try {
    await loadGraphPdf();
    await document.fonts.ready;
    const svg = graph.querySelector("svg").cloneNode(true);
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    // Standalone SVG images cannot inherit the app theme variables.
    svg.setAttribute("style", "--accent:#2d6a55;--accent-soft:#edf5ef;--warn:#bb4b35;--muted:#536357;--surface:#ffffff;--ink:#18281f");
    svg.setAttribute("width", model.VW);
    svg.setAttribute("height", model.VH);
    svg.insertAdjacentHTML("afterbegin", `<style>text{font-family:sans-serif}.rg-node rect{fill:#edf5ef;stroke:#2d6a55;stroke-width:1.5}.rg-node text{fill:#18281f;font-size:13px;font-weight:700}.rg-label{font-size:11.5px;font-weight:700;paint-order:stroke;stroke:white;stroke-width:4px}</style>`);
    const img = doc.querySelector("img");
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    await img.decode();
    const filename = `${heading.replace(/[\\/:*?"<>|\n]/g, "_").slice(0, 100)}_관계도_설명서.pdf`;
    await html2pdf().set({ margin: 12, filename, image: { type: "jpeg", quality: 0.97 },
      html2canvas: { scale: 2, backgroundColor: "#ffffff", scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], avoid: [".pdf-item", ".pdf-person", ".pdf-diagram", "h2", "h3", "h4"] }
    }).from(doc).save();
  } catch (error) {
    alert(error.message || "PDF를 만들지 못했어요. 다시 시도해 주세요.");
  } finally {
    host.remove();
    button.disabled = false;
    button.textContent = original;
  }
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-rg-pdf]");
  if (button) downloadGraphPdf(button);
});
