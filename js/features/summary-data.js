// 미리 써 둔 장별 요약(data/summary/<책 코드>.json)을 하루 분량만큼 합침
// 장 수가 1장이든 10장이든 같은 규칙으로 합치므로, 사람마다 시작 장·하루 장 수가 달라도 그대로 맞음.
// 서식은 tools/commentary/README.md 참고. 이 파일은 브라우저와 검사 스크립트(node)가 같이 씀.

const SUMMARY_LIMITS = { people: 8, rels: 10, places: 6, events: 12 };

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

  // 인물: 이름이 같으면 한 사람. 비중(1~3)을 더해 큰 순서, 같으면 먼저 나온 순서
  const people = new Map();
  chapters.forEach((c, ci) => (c.data.people || []).forEach((p, pi) => {
    const w = p.weight || 1;
    const cur = people.get(p.name);
    if (!cur) people.set(p.name, { name: p.name, role: p.role, score: w, best: w, order: ci * 100 + pi });
    else {
      cur.score += w;
      if (w > cur.best) { cur.best = w; cur.role = p.role; } // 가장 비중이 큰 장의 역할 설명을 씀
    }
  }));
  const topPeople = [...people.values()].sort((a, b) => b.score - a.score || a.order - b.order).slice(0, SUMMARY_LIMITS.people);
  const shown = new Set(topPeople.map((p) => p.name));
  // 화면에는 처음 등장한 순서로
  topPeople.sort((a, b) => a.order - b.order);

  // 관계: 보이는 인물끼리만. 같은 두 사람·같은 이름표면 하나로 합치고 비중을 더함
  const rels = new Map();
  chapters.forEach((c, ci) => (c.data.rels || []).forEach((r, ri) => {
    if (!shown.has(r.from) || !shown.has(r.to)) return;
    const key = `${r.from}|${r.to}|${r.label}`;
    const cur = rels.get(key);
    if (cur) cur.score += r.weight || 1;
    else rels.set(key, { from: r.from, to: r.to, label: r.label, kind: r.kind, directed: !!r.directed, score: r.weight || 1, order: ci * 100 + ri });
  }));
  // 같은 두 사람 사이는 2개까지(여러 장에 걸쳐 관계가 바뀌면 선이 겹쳐서 읽기 어려움). 나중 장의 관계가 앞서면 뒤를 남김
  const perPair = {};
  const topRels = [...rels.values()].sort((a, b) => b.score - a.score || b.order - a.order)
    .filter((r) => {
      const k = [r.from, r.to].sort().join("|");
      perPair[k] = (perPair[k] || 0) + 1;
      return perPair[k] <= 2;
    }).slice(0, SUMMARY_LIMITS.rels);

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
  return { flowMode, flow, events, eventsTitle: hasStory ? "주요 사건" : "주요 내용", people: topPeople, rels: topRels, places: topPlaces, songs, mainBook };
}

if (typeof module !== "undefined") module.exports = { composeDay, eventsPerChapter, SUMMARY_LIMITS };
