// 오늘 분량 미리 보기: 주요 등장 인물 · 인물 관계도 · 쉬운 말로 푼 이야기 · 어울리는 찬양 · 주요 지역 · 주석 참고 링크
// 요약은 알림 서버(worker/의 /summary)가 만들어 주고, 같은 분량은 서버와 이 기기에 저장해 두고 다시 씀

const SUMMARY_STORE = "daily5-summary-v2";
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

async function loadSummary(key, refresh = false) {
  summaryMem[key] = { status: "loading", refresh };
  let failed = "";
  try {
    const res = await fetch(`${PUSH_SERVER}/summary?r=${encodeURIComponent(key)}${refresh ? "&refresh=1" : ""}`, {
      signal: window.AbortSignal && AbortSignal.timeout ? AbortSignal.timeout(75000) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { code: data.code, detail: data.detail });
    writeSummaryStore(key, { people: data.people, relations: data.relations || [], places: data.places || [], story: data.story, songs: data.songs });
    delete summaryMem[key];
  } catch (e) {
    failed = e.name === "TimeoutError" ? "시간이 너무 오래 걸렸어요." : e.message || "불러오지 못했어요.";
    // 새로 만들기가 실패하면 보던 요약은 그대로 두고 알려만 줌
    if (refresh) { delete summaryMem[key]; showToast(`요약을 새로 만들지 못했어요. ${failed}`); }
    else summaryMem[key] = { status: "error", error: failed, code: e.code, detail: e.detail };
  }
  if (sheetTab === "summary") renderReaderSheet(); // 그 사이 다른 탭으로 옮겼으면 건드리지 않음
}

// 주석 검색 링크용 영문 책 이름 (BOOKS와 같은 순서)
const BOOK_EN = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalm", "Proverbs", "Ecclesiastes",
  "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
  "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];

// 장마다 열리는 주석 검색 링크. 주석 사이트의 장별 주소는 확인할 수 없어서, 항상 열리는 검색 주소로 연결함
const COMMENTARY_SOURCES = [
  { name: "한글 주석·해설 (구글)", url: (c) => `https://www.google.com/search?q=${encodeURIComponent(`${c.book.name} ${c.chap}장 주석`)}` },
  { name: "한글 주석·해설 (네이버)", url: (c) => `https://search.naver.com/search.naver?query=${encodeURIComponent(`${c.book.name} ${c.chap}장 주석 해설`)}` },
  { name: "호크마 주석", url: (c) => `https://www.google.com/search?q=${encodeURIComponent(`호크마 주석 ${c.book.name} ${c.chap}장`)}` },
  { name: "매튜 헨리 주석", url: (c) => `https://www.google.com/search?q=${encodeURIComponent(`매튜 헨리 주석 ${c.book.name} ${c.chap}장`)}` },
  { name: "영문 주석 (Enduring Word)", url: (c) => `https://www.google.com/search?q=${encodeURIComponent(`site:enduringword.com ${BOOK_EN[c.book.index]} ${c.chap}`)}` },
];

function commentaryHtml(day) {
  const multiBook = new Set(day.map((i) => CHAPTERS[i].book.index)).size > 1;
  return COMMENTARY_SOURCES.map((src) => `
    <div class="sum-links"><b>${src.name}</b>
      <span>${day.map((i) => {
        const c = CHAPTERS[i];
        return `<a class="sum-chip" target="_blank" rel="noopener" href="${src.url(c)}">${multiBook ? `${esc(c.book.name)} ` : ""}${c.chap}${chapUnit(c.book)}</a>`;
      }).join("")}</span>
    </div>`).join("");
}

function songLink(s) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.title} ${s.artist}`)}`;
}

// ── 미리 써 둔 장별 요약 (data/summary/<책 코드>.json) ──
// 그날 분량의 모든 장이 파일에 있으면 그걸 합쳐서 보여 주고, 하나라도 없으면 서버(Gemini) 요약으로 넘어감
const staticBooks = {}; // 책 코드 → { status: "loading" | "ok" | "none", data }

function loadStaticBook(code) {
  staticBooks[code] = { status: "loading" };
  fetch(`data/summary/${code}.json`, { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => { staticBooks[code] = data && data.chapters ? { status: "ok", data } : { status: "none" }; })
    .catch(() => { staticBooks[code] = { status: "none" }; })
    .then(() => { if (sheetTab === "summary") renderReaderSheet(); });
}

// "loading" | null(파일에 없는 장이 있음) | 합친 결과
function staticDaySummary(day) {
  const codes = [...new Set(day.map((i) => CHAPTERS[i].book.code))];
  codes.forEach((code) => { if (!staticBooks[code]) loadStaticBook(code); });
  if (codes.some((code) => staticBooks[code].status === "loading")) return "loading";
  const chapters = day.map((i) => {
    const { book, chap } = CHAPTERS[i];
    const file = staticBooks[book.code];
    const data = file.status === "ok" && file.data.chapters[chap];
    return data ? { book, chap, data } : null;
  });
  if (chapters.some((c) => !c)) return null;
  const books = Object.fromEntries(codes.map((code) => [code, staticBooks[code].data]));
  const opts = { all: !!state.settings.graphAll };
  const out = composeDay(chapters, books, opts);
  // 관계도는 장마다 따로도 그릴 수 있게: 장별 결과와, 지금 읽는 장이 이 분량의 몇 번째인지
  out.byChap = chapters.length > 1 ? chapters.map((c) => composeDay([c], books, opts)) : null;
  out.autoIdx = day.indexOf(currentChapter);
  return out;
}

// 관계도에 그릴 장: 장을 골랐으면 그 장, 골라 둔 게 없으면 지금 읽는 장(분량 안에 있을 때), "전체"면 분량 전체
function graphSource(s) {
  const pick = state.settings.graphChap;
  const idx = pick === "all" || pick == null ? -1 : typeof pick === "number" ? pick : s.autoIdx; // 처음엔 분량 전체
  if (!s.byChap || idx == null || idx < 0 || idx >= s.byChap.length) return s;
  return s.byChap[idx];
}
function chapChipsHtml(s) {
  if (!s.byChap) return "";
  const cur = graphSource(s) === s ? -1 : s.byChap.indexOf(graphSource(s));
  return `<div class="seg rg-chap" role="group" aria-label="관계도로 볼 장">
    <button type="button" data-gchap="all" class="${cur < 0 ? "on" : ""}">분량 전체</button>
    ${s.flow.map((f, i) => `<button type="button" data-gchap="${i}" class="${cur === i ? "on" : ""}">${esc(f.ref)}</button>`).join("")}
  </div>`;
}

function staticSummaryHtml(s) {
  const flow = s.flowMode === "story"
    ? s.flow.map((f) => `${s.flow.length > 1 ? `<p class="sum-ref">${esc(f.ref)}</p>` : ""}<p class="sum-story">${summaryMarkdown(f.text)}</p>`).join("")
    : `<ol class="sum-lines">${s.flow.map((f) => `<li><b>${esc(f.ref)}</b><span>${summaryMarkdown(f.text)}</span></li>`).join("")}</ol>`;
  const events = s.events.length ? `
    <section class="tool-card sum-card">
      <h3 class="label">${s.eventsTitle}</h3>
      <ol class="sum-events">${s.events.map((e) => `
        <li><div><b>${esc(e.title)}</b><small>${esc(e.ref)}</small></div><p>${summaryMarkdown(e.text)}</p></li>`).join("")}</ol>
    </section>` : "";
  const places = s.places.length ? `
    <section class="tool-card sum-card">
      <h3 class="label">주요 지역</h3>
      <ul class="sum-places">${s.places.map((p) => `
        <li><b>📍 ${esc(p.name)}</b>${p.where ? `<span>${esc(p.where)}</span>` : ""}
          ${p.whats.map((w) => `<p><small>${esc(w.ref)}</small>${esc(w.text)}</p>`).join("")}</li>`).join("")}</ul>
    </section>` : "";
  const songs = s.songs.length ? `
    <section class="tool-card sum-card">
      <h3 class="label">이 책과 어울리는 찬양</h3>
      <ul class="sum-songs">${s.songs.map((song) => `
        <li>
          <div><b>${esc(song.title)}</b><span>${esc(song.artist)}</span></div>
          ${song.why ? `<p>${esc(song.why)}</p>` : ""}
          <a class="btn ghost small" target="_blank" rel="noopener" href="${songLink(song)}">▶ 유튜브에서 찾기</a>
        </li>`).join("")}</ul>
    </section>` : "";
  return `
    <section class="tool-card sum-card">
      <h3 class="label">${s.flowMode === "story" ? "오늘의 이야기" : "한눈에 보기"}</h3>
      ${flow}
    </section>
    ${events}
    ${s.people.length ? `
    <section class="tool-card sum-card">
      <div class="rg-head">
        <h3 class="label">등장 인물 관계도</h3>
        <button type="button" class="read-switch rg-switch ${state.settings.graphAll ? "on" : ""}" data-gdetail="${state.settings.graphAll ? "main" : "all"}" role="switch" aria-checked="${!!state.settings.graphAll}">
          <span class="rs-label">${state.settings.graphAll ? "전체 인물" : "주요 인물"}</span>
          <span class="rs-track" aria-hidden="true"><span class="rs-knob"></span></span>
        </button>
      </div>
      ${chapChipsHtml(s)}
      ${(() => { const g = graphSource(s); return relationGraphHtml(g.graphPeople, g.rels, kinOpts()); })()}
    </section>` : ""}
    <section class="tool-card sum-card">
      <h3 class="label">주요 등장 인물</h3>
      ${s.people.length ? `${peopleBlockHtml(s.people)}`
        : `<p class="muted small">이번 분량에는 이야기 속 인물이 따로 나오지 않아요.</p>`}
    </section>

    ${places}
    ${songs}`;
}

// 주요 등장 인물: 중요도(비중 점수) 순으로 보여 주고, 찾기 칸으로 이름을 바로 걸러 냄
function peopleBlockHtml(people, labelOf) {
  const sorted = [...people].sort((a, b) => (b.score || 0) - (a.score || 0) || (a.order || 0) - (b.order || 0));
  return `<input type="search" class="sum-find" placeholder="인물 찾기" aria-label="인물 찾기" autocomplete="off">
    <ul class="sum-people">${sorted.map((p) => {
      const nm = labelOf ? labelOf(p) : (p.display || p.name);
      return `<li data-name="${esc(nm)}"><b>${esc(nm)}${p.where ? `<small>${esc(p.where)}</small>` : ""}</b>${p.role ? `<span>${summaryMarkdown(p.role)}</span>` : ""}</li>`;
    }).join("")}</ul>`;
}
// 찾기 칸에 적으면 이름이 들어간 인물만 남김
document.addEventListener("input", (e) => {
  if (!e.target.matches || !e.target.matches(".sum-find")) return;
  const q = e.target.value.trim().toLowerCase();
  e.target.closest(".tool-card").querySelectorAll(".sum-people li").forEach((li) => {
    li.hidden = !!q && !li.dataset.name.toLowerCase().includes(q);
  });
});

// 요약 탭 그리기 (reader.js의 renderReaderSheet에서 부름)
function renderSummaryTab(body, day) {
  summaryBook = day && day.length ? CHAPTERS[day[0]].book.code : "";
  setSheetTitle(READER_TABS);
  const pre = staticDaySummary(day);
  if (pre === "loading") {
    body.innerHTML = `<div class="sum-head"><small>Day ${viewingDay + 1}</small><b>${esc(describeChapters(day))}</b></div>
      <div class="sum-state"><div class="sum-spin" aria-hidden="true"></div><p>요약을 불러오고 있어요…</p></div>`;
    return;
  }
  if (pre) {
    body.innerHTML = `<div class="sum-headrow"><div class="sum-head"><small>Day ${viewingDay + 1}</small><b>${esc(describeChapters(day))}</b></div></div>
      ${staticSummaryHtml(pre)}
      <section class="tool-card sum-card">
        <h3 class="label">주석 참고 링크</h3>
        ${commentaryHtml(day)}
        <p class="muted small hint">검색 결과로 연결돼요. 본문을 읽은 뒤 궁금한 장의 해설을 찾아볼 때 쓰세요.</p>
      </section>
      <p class="muted small hint ai-note">🤖 AI 작성 · 연구용 성경 해설과 인물·지명을 대조했지만, 틀린 곳이 있을 수 있어요. 본문을 읽기 전에 흐름을 잡는 용도로 봐 주세요.</p>`;
    moveSummaryPdfButton(body);
    return;
  }
  const key0 = summaryRanges(day);
  const busy = (summaryMem[key0] || {}).refresh;
  const head = `<div class="sum-headrow"><div class="sum-head"><small>Day ${viewingDay + 1}</small><b>${esc(describeChapters(day))}</b></div>
    ${day.length <= SUMMARY_MAX_CHAPTERS && PUSH_SERVER && readSummaryStore()[key0]
      ? `<button class="sum-refresh ${busy ? "spin" : ""}" data-sum-refresh="${esc(key0)}" ${busy ? "disabled" : ""} aria-label="요약 새로 만들기" title="요약 새로 만들기">↻</button>` : ""}</div>`;
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
        ${peopleBlockHtml(data.people, (p) => p.name)}
      </section>
      <section class="tool-card sum-card">
        <h3 class="label">등장 인물 관계도</h3>
        ${relationGraphHtml(data.people, data.relations || [], kinOpts())}
      </section>
      <section class="tool-card sum-card">
        <h3 class="label">오늘의 이야기</h3>
        ${data.story.map((p) => `<p class="sum-story">${summaryMarkdown(p)}</p>`).join("")}
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
      ${(data.places || []).length ? `
      <section class="tool-card sum-card">
        <h3 class="label">주요 지역</h3>
        <ul class="sum-places">${data.places.map((p) => `<li><b>📍 ${esc(p.name)}</b>${p.note ? `<span>${esc(p.note)}</span>` : ""}</li>`).join("")}</ul>
      </section>` : ""}
      <section class="tool-card sum-card">
        <h3 class="label">주석 참고 링크</h3>
        ${commentaryHtml(day)}
        <p class="muted small hint">검색 결과로 연결돼요. 본문을 읽은 뒤 궁금한 장의 해설을 찾아볼 때 쓰세요.</p>
      </section>
      <p class="muted small hint">AI가 정리한 요약이에요. 본문을 읽기 전에 흐름을 잡는 용도로만 봐 주세요. 찬양은 제목이 다를 수 있어 검색으로 연결해요.</p>`;
    moveSummaryPdfButton(body);
    return;
  }

  const st = summaryMem[key];
  if (st && st.status === "error") {
    body.innerHTML = `${head}
      <div class="sum-state">
        <p>${esc(st.error)}</p>
        ${st.detail ? `<p class="muted small sum-detail">${esc(st.detail)}</p>` : ""}
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
