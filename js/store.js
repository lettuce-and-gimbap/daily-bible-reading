// 브라우저 localStorage에 계획/기록 저장
const STORE_KEY = "daily5-bible-v1";

function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(str, n) {
  const d = parseDate(str);
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

function defaultState() {
  return {
    plan: null, // { startIdx, perDay, startDate, range: "rev" | "full" }
    read: {}, // { 장일련번호: "YYYY-MM-DD" }
    dayNotes: {}, // { "YYYY-MM-DD": "통독 메모" }
    qt: {}, // { "YYYY-MM-DD": { done: bool, note: string } }
    settings: { mode: "one", ver: "gae", ver2: "niv" },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    const base = defaultState();
    return { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) } };
  } catch (e) {
    return defaultState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    alert("기록을 저장하지 못했습니다. 브라우저의 저장소 설정을 확인해 주세요.");
  }
}

// 계획에 포함되는 장 일련번호 순서
function planSequence(plan) {
  const seq = [];
  const end = TOTAL_CHAPTERS;
  for (let i = plan.startIdx; i < end; i++) seq.push(i);
  if (plan.range === "full") for (let i = 0; i < plan.startIdx; i++) seq.push(i);
  return seq;
}

function planDays(plan) {
  const seq = planSequence(plan);
  const days = [];
  for (let i = 0; i < seq.length; i += plan.perDay) days.push(seq.slice(i, i + plan.perDay));
  return days;
}
