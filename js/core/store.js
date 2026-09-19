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
    plan: null, // { startIdx, endIdx, perDay, startDate, pace: "perDay" | "date", targetDate }
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
    return { ...base, ...s, plan: normalizePlan(s.plan), settings: normalizeSettings({ ...base.settings, ...(s.settings || {}) }) };
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

// 갓피아에서 없어진 역본(예: 쉬운성경)이 저장돼 있으면 창세기 1장으로 튕기므로 지원하는 역본으로 바꿈
function normalizeSettings(settings) {
  const valid = (code) => VERSIONS.some((v) => v.code === code);
  const ver = valid(settings.ver) ? settings.ver : "gae";
  const ver2 = valid(settings.ver2) && settings.ver2 !== ver
    ? settings.ver2
    : ["niv", "saenew", "gae"].find((code) => code !== ver);
  return { ...settings, mode: settings.mode === "two" ? "two" : "one", ver, ver2 };
}

// 예전 형식(range: "rev" | "full")으로 저장된 계획을 끝 장(endIdx) 형식으로 바꿈
function normalizePlan(plan) {
  if (!plan || plan.endIdx !== undefined) return plan;
  const last = TOTAL_CHAPTERS - 1;
  const endIdx = plan.range === "full" && plan.startIdx > 0 ? plan.startIdx - 1 : last;
  const { range, ...rest } = plan;
  return { ...rest, endIdx, pace: "perDay" };
}

// 계획에 포함되는 장 일련번호 순서. 끝 장이 시작 장보다 앞이면 요한계시록 다음 창세기로 이어 읽음
function planSequence(plan) {
  const seq = [];
  if (plan.endIdx >= plan.startIdx) {
    for (let i = plan.startIdx; i <= plan.endIdx; i++) seq.push(i);
  } else {
    for (let i = plan.startIdx; i < TOTAL_CHAPTERS; i++) seq.push(i);
    for (let i = 0; i <= plan.endIdx; i++) seq.push(i);
  }
  return seq;
}

function planDays(plan) {
  const seq = planSequence(plan);
  const days = [];
  for (let i = 0; i < seq.length; i += plan.perDay) days.push(seq.slice(i, i + plan.perDay));
  return days;
}
