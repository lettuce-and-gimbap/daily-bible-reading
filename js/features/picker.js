// 서버에서 선택한 장의 최대 세 역본을 읽고, 고른 절을 메모·노트에 붙인다.

let pickIdx = null; // 지금 보여 주는 장 (전체 장 일련번호)
let pickSel = new Set(); // 고른 절 번호

// 구절 패널에서 볼 역본(1~3개): 직접 고른 게 있으면 그것, 없으면 보기 설정을 따름
function pickVersions() {
  const s = state.settings;
  const ok = (c) => VERSIONS.some((v) => v.code === c);
  const own = Array.isArray(s.pick) ? [...new Set(s.pick.filter(ok))].slice(0, 3) : [];
  return own.length ? own : [s.ver, ...(s.mode !== "one" ? [s.ver2] : []), ...(s.mode === "three" ? [s.ver3] : [])];
}

// 패널 본문에 그림. target: "reading"(통독 메모) | "qt"(묵상 노트), idx: 처음 보여 줄 장
async function renderVersePicker(body, target, idx) {
  if (idx !== undefined && idx !== null && idx !== pickIdx) { pickIdx = idx; pickSel = new Set(); }
  if (pickIdx === null) return;
  const idx0 = pickIdx;
  const { book, chap } = CHAPTERS[idx0];
  const s = state.settings;
  const picked = pickVersions();
  const ver1 = versionFor(picked[0], book);
  const ver2 = picked[1] && versionFor(picked[1], book) !== ver1 ? versionFor(picked[1], book) : "";
  const ver3 = picked[2] && ![ver1, ver2].includes(versionFor(picked[2], book)) ? versionFor(picked[2], book) : "";
  const vname = (c) => (VERSIONS.find((v) => v.code === c) || {}).name || c;

  body.innerHTML = `<div class="vp" style="--fz:${fzScale()}"><div class="vp-head" ${target === "reading" ? "hidden" : ""}>
      <button class="icon-btn" data-go="-1" ${idx0 <= 0 ? "disabled" : ""} aria-label="이전 장">‹</button>
      <b>${esc(book.name)} ${chap}장</b>
      <button class="icon-btn" data-go="1" ${idx0 >= TOTAL_CHAPTERS - 1 ? "disabled" : ""} aria-label="다음 장">›</button>
    </div>
    <div class="vp-zoom"><span class="muted small">글씨 크기</span>${fzControl()}</div>
    <div class="opts vp-vers">${VERSIONS.map((v) => `<button class="opt ${picked.includes(v.code) ? "on" : ""}" data-pv="${v.code}">${v.name}</button>`).join("")}</div>
    <p class="muted small vp-msg">본문 불러오는 중…</p></div>`;
  const root = body.firstElementChild;
  root.addEventListener("click", (e) => { // 패널 바깥(통독 화면 등)의 클릭 처리로 새어 나가지 않게
    e.stopPropagation();
    const fz = e.target.closest("[data-fz]");
    if (fz) return fzStep(root, Number(fz.dataset.fz));
    const go = e.target.closest("[data-go]");
    if (go) return renderVersePicker(body, target, idx0 + Number(go.dataset.go));
    const pv = e.target.closest("[data-pv]");
    if (pv) { // 역본 고르기: 최대 3개, 먼저 고른 게 위에 나옴
      let next = picked.includes(pv.dataset.pv) ? picked.filter((c) => c !== pv.dataset.pv) : [...picked, pv.dataset.pv].slice(-3);
      if (!next.length) return;
      state.settings.pick = next;
      persist();
      renderVersePicker(body, target);
    }
  });

  let verses;
  try {
    verses = await chapterVerses(idx0, ver1, ver2, ver3);
  } catch (e) {
    if (pickIdx === idx0 && body.firstElementChild === root) {
      root.querySelector(".vp-msg").textContent = "본문을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 열어 주세요.";
    }
    return;
  }
  if (pickIdx !== idx0 || body.firstElementChild !== root) return; // 그새 다른 장·탭으로 옮겼으면 그만

  const verOf = (v) => v.ver || ver1;
  const first = verses.filter((v) => verOf(v) === ver1);
  const second = ver2 ? verses.filter((v) => verOf(v) === ver2) : [];
  const third = ver3 ? verses.filter((v) => verOf(v) === ver3) : [];
  const labels = [...new Set([...first, ...second, ...third].map((v) => labelSpan(v.label)[0]))].sort((a, b) => a - b);
  const rows = labels.map((a) => {
    const primary = first.find((v) => labelSpan(v.label)[0] === a);
    const fallback = [...second, ...third].find((v) => labelSpan(v.label)[0] === a);
    const v = primary || fallback;
    const [, b] = labelSpan(v.label);
    const also = [second, third].flatMap((list) => list.filter((w) => w !== v && labelSpan(w.label)[0] >= a && labelSpan(w.label)[0] <= b));
    return { v, a, b, also, edition: v.ver || ver1 };
  });

  const count = () => root.querySelectorAll("input:checked").length;
  const refresh = () => {
    const n = count();
    root.querySelector(".vp-n").textContent = n ? `${n}절 선택` : "절을 눌러 고르세요";
    root.querySelectorAll(".vp-bar .btn:not(.text)").forEach((b) => { b.disabled = !n; });
  };

  root.insertAdjacentHTML("beforeend", `
    <div class="vp-list">${rows.map((r) => `
      <label class="vp-row">
        <input type="checkbox" class="sr-only" data-a="${r.a}" data-b="${r.b}" ${pickSel.has(r.a) ? "checked" : ""}>
        <span class="vp-num">${esc(r.v.label)}</span>
        <span class="vp-txt">${r.edition !== ver1 ? `<small>${esc(vname(r.edition))}</small>` : ""}<span class="study-version" data-edition="${esc(r.edition)}">${ScriptureStudy.glossaryHtml(r.v.text)}</span>${r.also.map((w) =>
          `<small><i>${esc(vname(w.ver))}</i> <span class="study-version" data-edition="${esc(w.ver)}">${ScriptureStudy.glossaryHtml(w.text)}</span></small>`).join("")}</span>
      </label>`).join("")}</div>
    <div class="vp-bar">
      <span class="vp-n"></span>
      ${target === "reading" ? '<button type="button" class="btn text small" data-study-highlight>하이라이트</button>' : ""}<button class="btn text small" data-act="clear">해제</button>
      <button class="btn primary small" data-act="paste">${target === "qt" ? "노트" : "메모"}에 붙이기</button>
    </div>`);
  root.querySelector(".vp-msg").remove();
  ScriptureStudy.mount(root,rows.map(r=>`${idx0}:${ver1}:${ver2}:${ver3}:${r.v.label}`),{dock:target==="reading"});
  refresh();

  // 고른 절(번호 집합)을 보기 설정 역본마다 모아 "권 장:절 / 역본1 줄들 / --- / 역본2 줄들" 양식으로
  const buildQuote = () => {
    const nums = new Set();
    root.querySelectorAll("input:checked").forEach((c) => {
      for (let n = Number(c.dataset.a); n <= Number(c.dataset.b); n++) nums.add(n);
    });
    const hit = (list) => list.filter((v) => { const [a, b] = labelSpan(v.label); for (let n = a; n <= b; n++) if (nums.has(n)) return true; return false; })
      .map((v) => `${v.label} ${v.text}`);
    const groups = [first, second, third].map(hit).filter((g) => g.length);
    return `${versesRef(CHAPTERS[idx0], [...nums])}\n${groups.map((g) => g.join("\n")).join(`\n${VERSION_DIVIDER}\n`)}`;
  };

  root.addEventListener("change", (e) => {
    const c = e.target.closest("input[data-a]");
    if (!c) return;
    for (let n = Number(c.dataset.a); n <= Number(c.dataset.b); n++) c.checked ? pickSel.add(n) : pickSel.delete(n);
    refresh();
  });
  root.addEventListener("click", (e) => {
    const act = (e.target.closest("[data-act]") || {}).dataset;
    if (!act) return;
    if (act.act === "clear") {
      pickSel = new Set();
      root.querySelectorAll("input:checked").forEach((c) => { c.checked = false; });
      return refresh();
    }
    if (!count()) return;
    const quote = buildQuote();
    pickSel = new Set();
    insertQuote(target, quote);
    renderVersePicker(body, target, idx0);
  });
}

// 패널을 열거나 다시 그릴 때: 보고 있는 장(hint)이 바뀐 경우에만 그 장으로 돌아가고, 아니면 직접 넘겨 둔 장을 유지
let pickHint = null;
function mountVersePicker(body, target, hintKey, hintIdx) {
  const moved = hintKey !== pickHint;
  pickHint = hintKey;
  renderVersePicker(body, target, moved ? hintIdx : undefined);
}
