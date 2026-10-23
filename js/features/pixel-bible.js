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
  const entry = document.getElementById("pixel-bible-entry");
  if (entry) entry.hidden = !["", "#today"].includes(location.hash);
}

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
  return { dialog, setDispose: (fn) => { dispose = fn; } };
}

function showPixelBibleNotice() {
  if (pixelBibleDialog) return;
  const { dialog } = pixelBibleModal(`<div class="pb-notice"><span class="pb-stars" aria-hidden="true">✦ · ✧ · ✦</span><h2>PIXEL BIBLE</h2><canvas class="pb-notice-text" width="264" height="76" aria-hidden="true"></canvas><p class="pb-sr">${PIXEL_BIBLE_NOTICE}</p><button class="pb-button" data-pb-close autofocus>기다릴게요!</button></div>`);
  const c = dialog.querySelector("canvas").getContext("2d");
  c.fillStyle = "#fff1bd"; c.font = "12px monospace"; c.textAlign = "center";
  ["앗, 벅수가 무언가를", "개발중이에요!", "다 개발되면 보여드릴게요!"].forEach((line, i) => c.fillText(line, 132, 18 + i * 23));
}

function pixelBibleTodayChapters() {
  // 계획 밖에서 고른 장도 통독 화면과 같은 본문을 사용한다.
  if (freeChapter !== null && CHAPTERS[freeChapter]) {
    const c = CHAPTERS[freeChapter];
    return [{ code: c.book.code, name: c.book.name, chap: c.chap }];
  }
  if (!state.plan) return [];
  const p = progress();
  const day = p.days[viewingDay] || p.days[p.todayDay] || [];
  return day.map((i) => ({ code: CHAPTERS[i].book.code, name: CHAPTERS[i].book.name, chap: CHAPTERS[i].chap }));
}

async function pixelBibleLandscape(shell, nativeFullscreen = true) {
  try {
    if (nativeFullscreen && !document.fullscreenElement && shell.requestFullscreen) await shell.requestFullscreen();
    if (!shell.isConnected) return;
    if (screen.orientation?.lock) await screen.orientation.lock("landscape");
  } catch (_) { /* iOS 등 회전 잠금 미지원 기기는 실제 가로 회전을 안내한다. */ }
}

async function openPixelBible() {
  if (pixelBibleOpening || pixelBibleDialog) return;
  pixelBibleOpening = true;
  const modal = pixelBibleModal(`<div class="pb-shell"><header class="pb-world-head"><b>PIXEL BIBLE <small>오늘의 픽셀 월드</small></b><button class="pb-button" data-pb-close aria-label="픽셀 월드 닫기">나가기 ✕</button></header><div class="pb-load" role="status">오늘의 월드를 준비하고 있어요…</div></div>`, true);
  const shell = modal.dialog.querySelector(".pb-shell");
  pixelBibleLandscape(shell, false);
  try {
    const chapters = pixelBibleTodayChapters();
    const world = await import("./pixel-bible/world.js?v=10.2.0");
    if (!modal.dialog.isConnected) return;
    modal.setDispose(await world.mountPixelWorld(shell, {
      chapters, allowed: () => true, landscape: () => pixelBibleLandscape(shell),
      cachedBook: (code) => staticBooks[code]?.status === "ok" ? staticBooks[code].data : null,
      readPassage: async ({code,chapter,verses}) => {
        const idx=CHAPTERS.findIndex(c=>c.book.code===code&&c.chap===chapter);
        if(idx<0||!PUSH_SERVER)throw new Error('passage-unavailable');
        const wanted=verses?new Set(verses):null;
        const rows=await versePairs(idx,n=>!wanted||wanted.has(n),['gae','easy']);
        if(!rows.length)throw new Error('passage-empty');
        return versePairsHtml(rows,['개역개정4판','쉬운성경']);
      },
    }));
  } catch (e) {
    if (!modal.dialog.isConnected) return;
    modal.dialog.querySelector(".pb-load").textContent = "월드를 열지 못했어요. 연결 상태를 확인한 뒤 다시 입장해 주세요.";
    console.warn("PIXEL BIBLE 입장 실패", e.name);
  }
}

document.addEventListener("click", (e) => { if (e.target.closest("[data-pixel-bible]")) openPixelBible(); });
