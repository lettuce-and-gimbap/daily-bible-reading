// 메모 안의 붙여넣은 구절을 골라서 복사하거나 한꺼번에 지우기 (통독 메모 · QT 묵상 노트 공통)
// 메모를 빈 줄 기준 덩어리로 나눠 목록으로 보여 줌(상자를 누르면 선택). 덩어리 하나 = 붙여넣은 구절 하나(또는 직접 쓴 글 한 단락)
//   "민수기 18:10\n10 지극히 거룩하게…"  ← 첫 줄이 "권 장:절"이면 구절, 나머지는 직접 쓴 글

const memoPick = { open: false, picked: new Set(), box: null, area: null, save: null, rerender: null };

const MEMO_REF = new RegExp(`^(?:${BOOKS.map((b) => b.name).join("|")}) \\d{1,3}(?::\\d{1,3}(?:-\\d{1,3})?|장)$`);
const MEMO_VERSE_LINE = /^\d{1,3}(?:-\d{1,3})?\s+\S/; // QT 노트는 첫 줄 없이 "10 지극히…"로만 붙음

// 메모 → [{ text, sep, kind: "quote" | "note", label, preview, key }]
// sep은 그 덩어리 뒤의 구분(빈 줄)이라, 일부만 지워도 남은 글의 띄어쓰기는 그대로 둠
function memoBlocks(text) {
  const m = text.match(/^([\s\S]*?)(\s*)$/);
  if (!m[1].trim()) return [];
  const pieces = m[1].split(/(\n[ \t]*\n\s*)/);
  const seen = {};
  const blocks = [];
  for (let i = 0; i < pieces.length; i += 2) {
    const block = pieces[i];
    if (!block.trim()) continue;
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const first = lines[0];
    const isRef = MEMO_REF.test(first);
    const kind = isRef || MEMO_VERSE_LINE.test(first) ? "quote" : "note";
    const shorten = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);
    const label = isRef ? first : shorten(first, 26);
    const preview = lines.slice(1).join(" ");
    const n = seen[block] = (seen[block] || 0) + 1; // 똑같은 글이 두 번 있어도 따로 고를 수 있게
    blocks.push({ text: block, sep: pieces[i + 1] !== undefined ? pieces[i + 1] : m[2], kind, label, preview, key: `${n}#${block}` });
  }
  return blocks;
}

// 지울 덩어리를 뺀 메모 (남은 글끼리의 구분은 원래 것 그대로)
function memoWithout(text, blocks, removeKeys) {
  const rest = blocks.filter((b) => !removeKeys.has(b.key));
  if (!rest.length) return "";
  const trailing = (text.match(/\s*$/) || [""])[0];
  let out = "";
  rest.forEach((b, i) => { out += b.text + (i < rest.length - 1 ? b.sep : trailing); });
  return out;
}

function memoPickMount(box, area, save, rerender) {
  Object.assign(memoPick, { box, area, save, rerender });
  area.addEventListener("input", memoPickDraw); // 글을 고치면 목록도 바로 따라감
  box.addEventListener("click", memoPickClick);
  box.addEventListener("change", (e) => {
    const cb = e.target.closest("input[data-k]");
    if (!cb) return;
    const key = memoBlocks(memoPick.area.value)[Number(cb.dataset.k)]?.key;
    if (key === undefined) return;
    cb.checked ? memoPick.picked.add(key) : memoPick.picked.delete(key);
    memoPickDraw();
  });
  memoPickDraw();
}

// 다시 그려도 목록·화면이 맨 위로 튀지 않게 스크롤 위치를 기억했다가 되돌림
function memoPickDraw() {
  const { box } = memoPick;
  if (!box || !box.isConnected) return;
  const list = box.querySelector(".mp-list");
  const listTop = list ? list.scrollTop : 0;
  const scrollers = [];
  for (let p = box.parentElement; p; p = p.parentElement) if (p.scrollTop) scrollers.push([p, p.scrollTop]);
  const winY = window.scrollY;
  memoPickPaint();
  const list2 = box.querySelector(".mp-list");
  if (list2) list2.scrollTop = listTop;
  scrollers.forEach(([p, t]) => { p.scrollTop = t; });
  if (window.scrollY !== winY) window.scrollTo(0, winY);
}

function memoPickPaint() {
  const { box, area } = memoPick;
  if (!memoPick.open) {
    box.innerHTML = `<button class="btn ghost small" data-mp="toggle">☑️ 구절 골라 복사 · 지우기</button>`;
    return;
  }
  const blocks = memoBlocks(area.value);
  const keys = new Set(blocks.map((b) => b.key));
  memoPick.picked.forEach((k) => { if (!keys.has(k)) memoPick.picked.delete(k); }); // 사라진 글의 선택은 정리
  const n = memoPick.picked.size;
  box.innerHTML = `
    <div class="mp-panel" style="--fz:${fzScale()}">
      <div class="mp-bar">
        <span><b>${blocks.length}</b>개 중 <b>${n}</b>개 선택</span>
        <span class="mp-bar-btns">
          <button class="btn text small" data-mp="all" ${blocks.length ? "" : "disabled"}>전체선택</button>
          <button class="btn text small" data-mp="none" ${n ? "" : "disabled"}>선택해제</button>
        </span>
      </div>
      <div class="mp-zoom"><span class="muted small">글씨 크기</span>${fzControl()}</div>
      ${blocks.length ? `
        <ul class="mp-list">
          ${blocks.map((b, i) => `
            <li><label class="mp-item mp-${b.kind}">
              <input type="checkbox" class="sr-only" data-k="${i}" ${memoPick.picked.has(b.key) ? "checked" : ""}>
              <span class="mp-body"><b>${b.kind === "quote" ? "📖 " : "✏️ "}${esc(b.label)}</b>${b.preview ? `<small>${esc(b.preview)}</small>` : ""}</span>
            </label></li>`).join("")}
        </ul>` : `<p class="muted small">아직 메모가 비어 있어요.</p>`}
      <div class="mp-actions">
        <button class="btn soft small" data-mp="copy" ${n ? "" : "disabled"}>📋 선택 복사</button>
        <button class="btn danger small" data-mp="del" ${n ? "" : "disabled"}>🗑 선택 지우기</button>
        <button class="btn text small" data-mp="toggle">닫기</button>
      </div>
    </div>`;
}

function memoPickClick(e) {
  const fz = e.target.closest("[data-fz]");
  if (fz) return fzStep(memoPick.box.querySelector(".mp-panel"), Number(fz.dataset.fz));
  const b = e.target.closest("[data-mp]");
  if (!b) return;
  const { area, save } = memoPick;
  const blocks = memoBlocks(area.value);
  const act = b.dataset.mp;
  if (act === "toggle") {
    memoPick.open = !memoPick.open;
    if (!memoPick.open) memoPick.picked.clear();
  } else if (act === "all") {
    blocks.forEach((x) => memoPick.picked.add(x.key));
  } else if (act === "none") {
    memoPick.picked.clear();
  } else if (act === "copy") {
    const chosen = blocks.filter((x) => memoPick.picked.has(x.key));
    copyText(chosen.map((x) => x.text.trim()).join("\n\n"), `${chosen.length}개 항목을 복사했어요`);
    return;
  } else if (act === "del") {
    const chosen = blocks.filter((x) => memoPick.picked.has(x.key));
    if (!chosen.length) return;
    const before = area.value;
    const after = memoWithout(before, blocks, memoPick.picked);
    area.value = after;
    save(after);
    memoPick.picked.clear();
    const rerender = memoPick.rerender;
    showToast(`🗑 ${chosen.length}개 항목을 지웠어요`, { label: "되돌리기", onClick: () => { save(before); rerender(); } });
  }
  memoPickDraw();
}
