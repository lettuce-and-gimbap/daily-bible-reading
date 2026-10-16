// 미리 써 둔 장별 요약(data/summary/<책 코드>.json)을 하루 분량만큼 합침
// 장 수가 1장이든 10장이든 같은 규칙으로 합치므로, 사람마다 시작 장·하루 장 수가 달라도 그대로 맞음.
// 서식은 tools/commentary/README.md 참고. 이 파일은 브라우저와 검사 스크립트(node)가 같이 씀.
// 인물 이름은 그 장 본문이 부르는 대로 쓰고(아브람/아브라함, 사울/바울), 이름이 바뀌는 장이 그날 분량에 있으면
// 장의 renames로 두 이름을 잇는다(관계도에 "사울 → 바울" 화살표와 바뀐 계기).

const SUMMARY_LIMITS = { graphPeople: 16, rels: 30, places: 6, events: 12 };

// 하루 장 수에 따라 장마다 보여 줄 사건 수
function eventsPerChapter(n) {
  return n <= 2 ? 4 : n <= 4 ? 3 : 2;
}

// chapters: [{ book: {code, name}, chap, data }] (data = 그 장의 요약 한 덩어리)
// books: { 책 코드: 책 파일 전체 } (찬양을 권마다 고르므로)
function composeDay(chapters, books) {
  const n = chapters.length;
  const multiBook = new Set(chapters.map((c) => c.book.code)).size > 1;
  const unit = (c) => (c.book.code === "psa" ? "편" : "장");
  const ref = (c, verses) => `${multiBook ? `${c.book.name} ` : ""}${c.chap}${verses ? `:${verses}` : unit(c)}`;

  // 흐름: 1~2장은 장마다 이야기, 3장 이상은 장마다 한 줄 요약
  const flow = chapters.map((c) => ({ ref: `${c.book.name} ${c.chap}${unit(c)}`, text: n <= 2 ? c.data.story : c.data.line }));
  const flowMode = n <= 2 ? "story" : "lines";

  // 주요 사건: 장 순서대로, 장마다 앞에서부터 몇 개씩
  const per = eventsPerChapter(n);
  const events = chapters.flatMap((c) => (c.data.events || []).slice(0, per)
    .map((e) => ({ title: e.title, text: e.text, ref: ref(c, e.verses) }))).slice(0, SUMMARY_LIMITS.events);

  // 인물: 그날 모든 장의 인물을 모음. 이름이 같으면 한 사람, 비중(1~3)을 더함. 나오는 장을 기록
  const people = new Map();
  chapters.forEach((c, ci) => (c.data.people || []).forEach((p, pi) => {
    const w = p.weight || 1;
    const cur = people.get(p.name);
    const tag = multiBook ? `${c.book.name} ${c.chap}` : String(c.chap);
    if (!cur) people.set(p.name, { name: p.name, role: p.role, score: w, best: w, order: ci * 100 + pi, chaps: [tag] });
    else {
      cur.score += w;
      if (!cur.chaps.includes(tag)) cur.chaps.push(tag);
      if (w > cur.best) { cur.best = w; cur.role = p.role; } // 가장 비중이 큰 장의 역할 설명을 씀
    }
  }));

  // 이름이 바뀐 사람: 그날 분량 안에서 바뀐 경우만 (장의 renames)
  const renames = chapters.flatMap((c) => (c.data.renames || []).map((r) => ({ ...r, ref: ref(c, r.verses), src: { book: c.book.code, chap: c.chap, verses: r.verses } })));
  renames.forEach((r) => {
    if (!people.has(r.from)) {
      const to = people.get(r.to);
      people.set(r.from, { name: r.from, role: `나중에 ${r.to}`, score: to ? to.score : 1, best: 1, order: to ? to.order - 0.5 : 0, chaps: to ? [...to.chaps] : [] });
    }
  });

  // 목록: 모든 인물을 처음 나온 순서로. 이름이 바뀐 사람은 "옛 이름 → 새 이름" 한 줄로
  const merged = new Set(renames.map((r) => r.from));
  const list = [...people.values()].filter((p) => !merged.has(p.name)).map((p) => {
    const r = renames.find((x) => x.to === p.name);
    if (!r) return { ...p, display: p.name };
    const old = people.get(r.from);
    const chaps = [...new Set([...(old ? old.chaps : []), ...p.chaps])];
    return { ...p, display: `${r.from} → ${r.to}`, order: Math.min(p.order, old ? old.order : p.order), chaps };
  }).sort((a, b) => a.order - b.order);
  const showChaps = n > 1;
  list.forEach((p) => { p.where = showChaps ? `${p.chaps.join("·")}${multiBook ? "" : unit(chapters[0])}` : ""; });

  // 관계도에 그릴 인물: 비중 큰 순서로 몇 명. 이름이 바뀐 사람은 두 이름 다
  const ranked = [...people.values()].sort((a, b) => b.score - a.score || a.order - b.order);
  const shown = new Set();
  for (const p of ranked) {
    if (shown.size >= SUMMARY_LIMITS.graphPeople) break;
    shown.add(p.name);
    renames.forEach((r) => { if (r.from === p.name) shown.add(r.to); if (r.to === p.name) shown.add(r.from); });
  }
  const graphPeople = [...people.values()].filter((p) => shown.has(p.name)).sort((a, b) => a.order - b.order);

  // 관계: 그릴 인물끼리만. 같은 두 사람·같은 이름표면 하나로 합치고 비중을 더함
  // 관계마다 그 관계가 드러난 구절 풀이(note)를 장마다 모음(관계도 상세 창에서 보여 줌)
  const rels = new Map();
  chapters.forEach((c, ci) => (c.data.rels || []).forEach((r, ri) => {
    if (!shown.has(r.from) || !shown.has(r.to)) return;
    const key = `${r.from}|${r.to}|${r.label}`;
    const note = r.note ? { ref: ref(c, r.verses), text: r.note, src: { book: c.book.code, chap: c.chap, verses: r.verses } } : null;
    const cur = rels.get(key);
    if (cur) {
      cur.score += r.weight || 1;
      if (note && cur.notes.length < 3 && !cur.notes.some((x) => x.text === note.text)) cur.notes.push(note);
    } else rels.set(key, { from: r.from, to: r.to, label: r.label, kind: r.kind, directed: !!r.directed, score: r.weight || 1, order: ci * 100 + ri, notes: note ? [note] : [] });
  }));
  // 같은 두 사람 사이는 3개까지(여러 장에 걸쳐 관계가 바뀌면 선이 겹쳐서 읽기 어려움). 나중 장의 관계가 앞서면 뒤를 남김
  const perPair = {};
  const topRels = [...rels.values()].sort((a, b) => b.score - a.score || b.order - a.order)
    .filter((r) => {
      const k = [r.from, r.to].sort().join("|");
      perPair[k] = (perPair[k] || 0) + 1;
      return perPair[k] <= 3;
    }).slice(0, SUMMARY_LIMITS.rels);
  // 이름이 바뀐 화살표는 늘 그림 (옛 이름 → 새 이름, 이름표는 바뀐 계기)
  renames.forEach((r) => topRels.unshift({ from: r.from, to: r.to, label: r.why, kind: "rename", directed: true, score: 99, order: -1,
    notes: [{ ref: r.ref, src: r.src, text: r.note || `${r.from}의 이름이 ${r.to}(으)로 바뀌었어요. 계기: ${r.why}.` }] }));

  // 지역: 이름이 같으면 하나로. 위치 설명은 처음 것, 일어난 일은 장마다 다르면 이어 붙임(2개까지)
  const places = new Map();
  chapters.forEach((c, ci) => (c.data.places || []).forEach((p, pi) => {
    const cur = places.get(p.name);
    const what = { ref: ref(c), text: p.what };
    if (!cur) places.set(p.name, { name: p.name, where: p.where, whats: [what], score: p.weight || 1, order: ci * 100 + pi });
    else {
      cur.score += p.weight || 1;
      if (cur.whats.length < 2 && !cur.whats.some((x) => x.text === p.what)) cur.whats.push(what);
    }
  }));
  const topPlaces = [...places.values()].sort((a, b) => b.score - a.score || a.order - b.order).slice(0, SUMMARY_LIMITS.places)
    .sort((a, b) => a.order - b.order);

  // 찬양: 이 분량에서 장이 가장 많은 권의 곡
  const count = {};
  chapters.forEach((c) => { count[c.book.code] = (count[c.book.code] || 0) + 1; });
  const mainBook = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  const songs = (books[mainBook] && books[mainBook].songs) || [];

  // 이야기 장이 하나도 없으면(시·율법·서신) "주요 사건" 대신 "주요 내용"
  const hasStory = chapters.some((c) => c.data.type === "story");
  return {
    flowMode, flow, events, eventsTitle: hasStory ? "주요 사건" : "주요 내용",
    people: list, graphPeople, rels: topRels, renames, places: topPlaces, songs, mainBook,
  };
}

if (typeof module !== "undefined") module.exports = { composeDay, eventsPerChapter, SUMMARY_LIMITS };
