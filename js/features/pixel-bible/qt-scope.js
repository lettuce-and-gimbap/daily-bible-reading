// 공개 장 요약의 사건·관계 구절 범위를 QT 본문 선택 절에 맞춰 좁힌다.
function overlaps(reference, verses) {
  if (!Array.isArray(verses) || !verses.length) return true;
  const m = String(reference || '').match(/^(\d+)(?:\s*[-–—]\s*(\d+))?$/);
  if (!m) return false;
  const lo = Number(m[1]), hi = Number(m[2] || m[1]);
  return verses.some(v => v >= lo && v <= hi);
}

export function scopeChapterSummary(data = {}, verses = null) {
  if (!Array.isArray(verses) || !verses.length) return data;
  const events = (data.events || []).filter(e => overlaps(e.verses, verses));
  const rels = (data.rels || []).filter(r => overlaps(r.verses, verses));
  const text = [...events.flatMap(e => [e.title, e.text]), ...rels.flatMap(r => [r.from, r.to, r.label, r.note])].filter(Boolean).join(' ');
  const people = (data.people || []).filter(p => text.includes(p.name));
  const story = events.map(e => [e.title, e.text].filter(Boolean).join(' · ')).join('\n');
  return { ...data, people, events, rels, story, line: events.map(e => e.title).filter(Boolean).join(' · ') };
}
