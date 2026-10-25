// 한 역본에서는 병합 범위를 한 줄로 두고, 비교할 때는 절 번호별 칸을 맞춘다.
function alignVerseRows(lists) {
  const span = (entry) => {
    const match = String(entry.label).match(/^(\d+)(?:[-–](\d+))?/);
    return [Number(match[1]), Number(match[2] || match[1])];
  };
  if (lists.length === 1) return lists[0].map((entry) => {
    const [a, b] = span(entry);
    return { a, b, label: entry.label, cells: [entry] };
  });
  const numbers = new Set();
  for (const list of lists) for (const entry of list) {
    const [a, b] = span(entry);
    for (let number = a; number <= b; number++) numbers.add(number);
  }
  return [...numbers].sort((a, b) => a - b).map((number) => ({
    a: number, b: number, label: String(number),
    cells: lists.map((list) => list.find((entry) => span(entry)[0] === number) || null),
  }));
}

if (typeof module !== 'undefined') module.exports = { alignVerseRows };
