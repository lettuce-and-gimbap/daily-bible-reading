// PIXEL BIBLE 10.0 공개 입구: 로그인 없이도 오늘의 월드를 연다.
// 통독 상태는 읽기만 하고 월드 조작은 메모리 안에서 처리한다.
const PIXEL_BIBLE_NOTICE = "앗, 벅수가 무언가를 개발중이에요! 다 개발되면 보여드릴게요!";
let pixelBibleOpening = false;
let pixelBibleDialog = null;

function pixelBibleBannerHtml() {
  return `<button type="button" class="pb-banner" data-pixel-bible aria-label="PIXEL BIBLE 입장">
    <img src="assets/pixel-bible/banner.webp" alt="가운데 두 팔을 벌린 후광의 예수님, 왼쪽에 지팡이를 왼쪽 위로 든 모세, 오른쪽에 불병거를 타고 올라가는 엘리야" loading="lazy" width="2048" height="683">
    <span class="pb-banner-caption">말씀 속으로, 한 걸음 <b>PIXEL BIBLE</b><small>지금 입장하기</small></span>
  </button>`;
}

function updatePixelBibleEntry() {
  if (typeof document === "undefined" || !document.getElementById) return;
  const entry = document.getElementById("pixel-bible-entry");
  if (entry) entry.hidden = !["", "#today", "#qt"].includes(location.hash);
}
updatePixelBibleEntry();
if (typeof window !== "undefined") window.addEventListener("hashchange", updatePixelBibleEntry);

function pixelBibleModal(contents, world = false) {
  const focus = document.activeElement;
  const dialog = document.createElement("dialog");
  dialog.className = `pb-dialog${world ? " pb-world-dialog" : ""}`;
  dialog.setAttribute("aria-label", world ? "PIXEL BIBLE" : "PIXEL BIBLE 개발 안내");
  dialog.innerHTML = contents;
  document.body.append(dialog);
  pixelBibleDialog = dialog;
  let dispose = () => {};
  const abort = new AbortController();
  const orientationState = { locked: false };
  const syncOrientationFallback = () => {
    if (!world || !dialog.isConnected) return;
    const fallback = window.innerHeight >= window.innerWidth && !orientationState.locked;
    dialog.classList.toggle("pb-css-landscape", fallback);
    const hint = dialog.querySelector(".pb-rotate");
    if (hint) hint.hidden = !fallback;
  };
  if (world) {
    window.addEventListener("resize", syncOrientationFallback, { signal: abort.signal });
    window.addEventListener("orientationchange", syncOrientationFallback, { signal: abort.signal });
    window.visualViewport?.addEventListener("resize", syncOrientationFallback, { signal: abort.signal });
  }
  dialog.addEventListener("close", () => {
    abort.abort(); dispose();
    if (dialog.contains(document.fullscreenElement)) document.exitFullscreen?.().catch(() => {});
    if (world && screen.orientation?.unlock) { try { screen.orientation.unlock(); } catch (_) {} }
    dialog.remove();
    if (pixelBibleDialog === dialog) pixelBibleDialog = null;
    pixelBibleOpening = false;
    if (focus?.isConnected) focus.focus();
  }, { once: true });
  dialog.addEventListener("click", (e) => { if (e.target.closest("[data-pb-close]")) dialog.close(); });
  window.addEventListener("hashchange", () => dialog.close(), { signal: abort.signal });
  dialog.showModal();
  syncOrientationFallback();
  return { dialog, orientationState, syncOrientationFallback, setDispose: (fn) => { dispose = fn; } };
}

function showPixelBibleNotice() {
  if (pixelBibleDialog) return;
  const { dialog } = pixelBibleModal(`<div class="pb-notice"><span class="pb-stars" aria-hidden="true">✦ · ✧ · ✦</span><h2>PIXEL BIBLE</h2><canvas class="pb-notice-text" width="264" height="76" aria-hidden="true"></canvas><p class="pb-sr">${PIXEL_BIBLE_NOTICE}</p><button class="pb-button" data-pb-close autofocus>기다릴게요!</button></div>`);
  const canvas=dialog.querySelector("canvas"),c=canvas.getContext("2d");
  const draw=()=>{if(!dialog.isConnected)return;c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle="#fff1bd";c.font='12px "DungGeunMo", monospace';c.textAlign="center";["앗, 벅수가 무언가를","개발중이에요!","다 개발되면 보여드릴게요!"].forEach((line,i)=>c.fillText(line,132,18+i*23));};
  draw();document.fonts?.load('12px "DungGeunMo"').then(draw).catch(()=>{});
}

function pixelBibleTodayChapters() {
  // 기본 월드는 현재 통독 분량을 그대로 쓰고, 계획 밖 직접 선택은 그 한 장만 쓴다.
  if (freeChapter !== null && CHAPTERS[freeChapter]) {
    const c = CHAPTERS[freeChapter];
    return [{ code: c.book.code, name: c.book.name, chap: c.chap }];
  }
  if (!state.plan) return [];
  const p = progress();
  const day = p.days[viewingDay] || p.days[p.todayDay] || [];
  return day.map((i) => ({ code: CHAPTERS[i].book.code, name: CHAPTERS[i].book.name, chap: CHAPTERS[i].chap }));
}

function pixelBibleRangeBooks() {
  const books = new Map();
  for (const c of CHAPTERS) {
    const row = books.get(c.book.code) || { code: c.book.code, name: c.book.name, chapters: 0 };
    row.chapters = Math.max(row.chapters, c.chap); books.set(c.book.code, row);
  }
  return [...books.values()];
}
function pixelBibleRangeChapters(code, start, end) {
  const from = Number(start), to = Number(end);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) return [];
  return CHAPTERS.filter(c => c.book.code === code && c.chap >= from && c.chap <= to)
    .map(c => ({ code: c.book.code, name: c.book.name, chap: c.chap }));
}
async function completesWithin(action, ms = 900) {
  let timer;
  try {
    const result = Promise.resolve().then(action).then(() => true, () => false);
    return await Promise.race([result, new Promise((resolve) => { timer = setTimeout(() => resolve(false), ms); })]);
  } finally { clearTimeout(timer); }
}

async function pixelBibleLandscape(dialog = pixelBibleDialog, orientationState = null, syncFallback = null) {
  const mobile = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const fullscreenTarget = dialog?.querySelector(".pb-shell");
  let fullscreen = !!document.fullscreenElement, locked = false;
  if (orientationState) orientationState.locked = false;
  const fallback = window.innerHeight >= window.innerWidth;
  dialog?.classList.toggle("pb-css-landscape", fallback);
  const hint = dialog?.querySelector(".pb-rotate");
  if (hint) hint.hidden = !fallback;
  if (mobile && fullscreenTarget && !fullscreen && typeof fullscreenTarget.requestFullscreen === "function") {
    fullscreen = await completesWithin(() => fullscreenTarget.requestFullscreen()) || fullscreen;
  }
  if (mobile && screen.orientation?.lock) {
    locked = await completesWithin(() => screen.orientation.lock("landscape"));
  }
  if (orientationState) orientationState.locked = locked;
  const useFallback = window.innerHeight >= window.innerWidth && !locked;
  dialog?.classList.toggle("pb-css-landscape", useFallback);
  if (hint) hint.hidden = !useFallback;
  syncFallback?.();
  return { fullscreen, locked };
}

async function openPixelBible(scope = {}) {
  if (pixelBibleOpening || pixelBibleDialog) return;
  pixelBibleOpening = true;
  const modal = pixelBibleModal(`<div class="pb-shell"><header class="pb-world-head"><button class="pb-button" data-pb-close aria-label="픽셀 월드 닫기">나가기 ✕</button></header><div class="pb-rotate pb-orientation-hint" role="status" hidden>📱 화면을 가로로 돌려 주세요. 자동 회전이 안 되어도 월드는 입장할 수 있어요.</div><div class="pb-load" role="status">${scope.chapters?'QT 본문에 맞는 월드를 준비하고 있어요…':'오늘의 월드를 준비하고 있어요…'}</div></div>`, true);
  const shell = modal.dialog.querySelector(".pb-shell");
  const landscapeReady = pixelBibleLandscape(modal.dialog, modal.orientationState, modal.syncOrientationFallback);
  landscapeReady.catch(() => {});
  try {
    const chapters = scope.chapters || pixelBibleTodayChapters();
    const world = await import("./pixel-bible/world.js?v=10.9.1&rev=three-second-tread-huff-mark-1");
    if (!modal.dialog.isConnected) return;
    let disposeWorld = () => {};
    const worldOptions = {
      chapters, scopeLabel:scope.chapters?'QT 본문':'통독 분량', allowed: () => true, landscape: () => pixelBibleLandscape(modal.dialog, modal.orientationState, modal.syncOrientationFallback),
      rangeBooks: pixelBibleRangeBooks(),
      onRangeSelect: async (rangeChapters) => {
        if (!rangeChapters.length) return;
        const selectedRange = pixelBibleRangeChapters(rangeChapters[0].code, rangeChapters[0].chap, rangeChapters.at(-1).chap);
        if (!selectedRange.length) return;
        disposeWorld();
        shell.querySelectorAll(':scope > :not(.pb-world-head)').forEach(el => el.remove());
        shell.insertAdjacentHTML('beforeend','<div class="pb-load" role="status">선택한 표기 범위의 월드를 준비하고 있어요…</div>');
        disposeWorld = await world.mountPixelWorld(shell, { ...worldOptions, chapters: selectedRange, scopeLabel:'표기 범위' });
        modal.setDispose(disposeWorld);
      },
      dailyReadingDone:()=>!!state.plan&&progress().dailyDone,
      cachedBook: (code) => staticBooks[code]?.status === "ok" ? staticBooks[code].data : null,
      readPassage: async ({code,chapter,verses}) => {
        const idx=CHAPTERS.findIndex(c=>c.book.code===code&&c.chap===chapter);
        if(idx<0||!PUSH_SERVER)throw new Error('passage-unavailable');
        const wanted=verses?new Set(verses):null;
        const rows=await versePairs(idx,n=>!wanted||wanted.has(n),['gae','easy']);
        if(!rows.length)throw new Error('passage-empty');
        return versePairsHtml(rows,['개역개정4판','쉬운성경']);
      },
    };
    disposeWorld = await world.mountPixelWorld(shell, worldOptions);
    modal.setDispose(disposeWorld);
  } catch (e) {
    if (!modal.dialog.isConnected) return;
    modal.dialog.querySelector(".pb-load").textContent = "월드를 열지 못했어요. 연결 상태를 확인한 뒤 다시 입장해 주세요.";
    console.warn("PIXEL BIBLE 입장 실패", e.name);
  }
}

document.addEventListener("click", (e) => { if (e.target.closest("[data-pixel-bible]")) openPixelBible(); });
document.addEventListener('pixel-bible:qt',e=>{if(Array.isArray(e.detail?.chapters)&&e.detail.chapters.length)openPixelBible({chapters:e.detail.chapters});});
