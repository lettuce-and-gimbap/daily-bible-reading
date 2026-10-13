// 오늘 분량 미리 보기: 주요 등장 인물 · 쉬운 말로 푼 이야기 · 어울리는 찬양
// 요약은 알림 서버(worker/의 /summary)가 만들어 주고, 같은 분량은 서버와 이 기기에 저장해 두고 다시 씀

const SUMMARY_STORE = "daily5-summary-v1";
const SUMMARY_MAX_CHAPTERS = 30; // 서버가 한 번에 요약하는 최대 장 수
const SUMMARY_KEEP = 60; // 이 기기에 남겨 둘 요약 개수
const summaryMem = {}; // 분량 → { status: "loading" | "error", error, code }

function readSummaryStore() {
  try { return JSON.parse(localStorage.getItem(SUMMARY_STORE)) || {}; } catch (e) { return {}; }
}

function writeSummaryStore(key, data) {
  try {
    const all = readSummaryStore();
    delete all[key];
    all[key] = data; // 새로 넣은 것이 맨 뒤
    Object.keys(all).slice(0, Math.max(0, Object.keys(all).length - SUMMARY_KEEP)).forEach((k) => delete all[k]);
    localStorage.setItem(SUMMARY_STORE, JSON.stringify(all));
  } catch (e) { /* 저장 공간이 없어도 그냥 보여 주기만 함 */ }
}

// 그날 장 목록 → 서버가 알아듣는 분량 표기 ("num.12-16,num.17-17")
function summaryRanges(day) {
  const segs = [];
  day.forEach((i) => {
    const { book, chap } = CHAPTERS[i];
    const last = segs[segs.length - 1];
    if (last && last.code === book.code && last.hi + 1 === chap) last.hi = chap;
    else segs.push({ code: book.code, lo: chap, hi: chap });
  });
  return segs.map((s) => `${s.code}.${s.lo}-${s.hi}`).join(",");
}

async function loadSummary(key) {
  summaryMem[key] = { status: "loading" };
  try {
    const res = await fetch(`${PUSH_SERVER}/summary?r=${encodeURIComponent(key)}`, {
      signal: window.AbortSignal && AbortSignal.timeout ? AbortSignal.timeout(120000) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { code: data.code });
    writeSummaryStore(key, { people: data.people, story: data.story, songs: data.songs });
    delete summaryMem[key];
  } catch (e) {
    summaryMem[key] = { status: "error", error: e.name === "TimeoutError" ? "시간이 너무 오래 걸렸어요." : e.message || "불러오지 못했어요.", code: e.code };
  }
  if (sheetTab === "summary") renderReaderSheet(); // 그 사이 다른 탭으로 옮겼으면 건드리지 않음
}

function songLink(s) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.title} ${s.artist}`)}`;
}

// 요약 탭 그리기 (reader.js의 renderReaderSheet에서 부름)
function renderSummaryTab(body, day) {
  setSheetTitle(READER_TABS);
  const head = `<div class="sum-head"><small>Day ${viewingDay + 1}</small><b>${esc(describeChapters(day))}</b></div>`;
  if (day.length > SUMMARY_MAX_CHAPTERS) {
    body.innerHTML = `${head}<p class="muted small">하루 분량이 ${SUMMARY_MAX_CHAPTERS}장을 넘어서 요약을 만들 수 없어요.</p>`;
    return;
  }
  if (!PUSH_SERVER) {
    body.innerHTML = `${head}<p class="muted small">요약은 알림 서버가 필요해요. js/core/config.js에 서버 주소를 넣어 주세요.</p>`;
    return;
  }

  const key = summaryRanges(day);
  const data = readSummaryStore()[key];
  if (data) {
    body.innerHTML = `${head}
      <section class="tool-card sum-card">
        <h3 class="label">주요 등장 인물</h3>
        <ul class="sum-people">${data.people.map((p) => `<li><b>${esc(p.name)}</b>${p.role ? `<span>${esc(p.role)}</span>` : ""}</li>`).join("")}</ul>
      </section>
      <section class="tool-card sum-card">
        <h3 class="label">오늘의 이야기</h3>
        ${data.story.map((p) => `<p class="sum-story">${esc(p)}</p>`).join("")}
      </section>
      <section class="tool-card sum-card">
        <h3 class="label">오늘 말씀과 어울리는 찬양</h3>
        <ul class="sum-songs">${data.songs.map((s) => `
          <li>
            <div><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div>
            ${s.why ? `<p>${esc(s.why)}</p>` : ""}
            <a class="btn ghost small" target="_blank" rel="noopener" href="${songLink(s)}">▶ 유튜브에서 찾기</a>
          </li>`).join("")}</ul>
      </section>
      <p class="muted small hint">AI가 정리한 요약이에요. 본문을 읽기 전에 흐름을 잡는 용도로만 봐 주세요. 찬양은 제목이 다를 수 있어 검색으로 연결해요.</p>`;
    return;
  }

  const st = summaryMem[key];
  if (st && st.status === "error") {
    body.innerHTML = `${head}
      <div class="sum-state">
        <p>${esc(st.error)}</p>
        ${st.code === "not_configured" ? "" : `<button class="btn soft small" data-sum-retry="${esc(key)}">다시 시도</button>`}
      </div>`;
    return;
  }
  if (!st) loadSummary(key);
  body.innerHTML = `${head}
    <div class="sum-state"><div class="sum-spin" aria-hidden="true"></div>
      <p>오늘 분량을 정리하고 있어요…</p>
      <p class="muted small">처음 만드는 분량은 10~30초쯤 걸려요. 한 번 만들면 다음부터는 바로 보여요.</p></div>`;
}
