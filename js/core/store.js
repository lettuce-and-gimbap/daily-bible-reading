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
    settings: { mode: "one", ver: "gae", ver2: "niv", ver3: "easy", readingCutoff: 0 },
    readingHabits: { rule: 2, lateDays: [], cutoffUses: [], pending: null },
  };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseDate(value);
  return todayStr(date) === value;
}

function normalizePlan(plan) {
  if (!isRecord(plan)) return null;
  // 예전 형식(range: "rev" | "full")으로 저장된 계획을 끝 장(endIdx) 형식으로 바꿈
  if (plan.endIdx === undefined) {
    const last = TOTAL_CHAPTERS - 1;
    const endIdx = plan.range === "full" && plan.startIdx > 0 ? plan.startIdx - 1 : last;
    const { range, ...rest } = plan;
    plan = { ...rest, endIdx, pace: "perDay" };
  }
  const validIndex = (n) => Number.isInteger(n) && n >= 0 && n < TOTAL_CHAPTERS;
  if (!validIndex(plan.startIdx) || !validIndex(plan.endIdx)
    || !Number.isInteger(plan.perDay) || plan.perDay < 1 || plan.perDay > TOTAL_CHAPTERS
    || !isValidDateString(plan.startDate)
    || !["perDay", "date"].includes(plan.pace)) return null;
  if (plan.pace === "date" && (!isValidDateString(plan.targetDate) || plan.targetDate < plan.startDate)) return null;
  return plan;
}

function normalizeReadMap(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([idx, date]) =>
    /^\d+$/.test(idx) && Number(idx) < TOTAL_CHAPTERS && isValidDateString(date)));
}

function normalizeStringMap(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === "string"));
}

function normalizeRecordMap(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, item]) => isRecord(item)));
}

function normalizeReadingHabits(value) {
  const v = isRecord(value) ? value : {};
  // rule 2부터는 설정 변경 횟수가 아니라, 바꾼 마감 시간 안에 실제로 읽은 날만 센다.
  // 이전 규칙의 기록은 새 기준과 섞지 않고 한 번 모두 초기화한다.
  if (v.rule !== 2) return { rule: 2, lateDays: [], cutoffUses: [], pending: null };
  const pending = isRecord(v.pending) && isValidDateString(v.pending.date)
    && Number.isInteger(v.pending.hour) && v.pending.hour >= 1 && v.pending.hour <= 5
    ? { date: v.pending.date, hour: v.pending.hour }
    : null;
  return {
    rule: 2,
    lateDays: [...new Set((Array.isArray(v.lateDays) ? v.lateDays : []).filter(isValidDateString))].slice(-60),
    cutoffUses: [...new Set((Array.isArray(v.cutoffUses) ? v.cutoffUses : []).filter(isValidDateString))].slice(-60),
    pending,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    if (!isRecord(s)) return defaultState();
    const base = defaultState();
    return {
      ...base,
      ...s,
      plan: normalizePlan(s.plan),
      read: normalizeReadMap(s.read),
      dayNotes: normalizeStringMap(s.dayNotes),
      qt: normalizeRecordMap(s.qt),
      readingHabits: normalizeReadingHabits(s.readingHabits),
      settings: normalizeSettings({ ...base.settings, ...(isRecord(s.settings) ? s.settings : {}) }),
    };
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

// 저장된 역본이 바뀌거나 중복됐으면 공개 DB의 서로 다른 역본으로 정리한다.
function normalizeSettings(settings) {
  const valid = (code) => VERSIONS.some((v) => v.code === code);
  const ver = valid(settings.ver) ? settings.ver : "gae";
  const ver2 = valid(settings.ver2) && settings.ver2 !== ver
    ? settings.ver2
    : ["niv", "saenew", "gae"].find((code) => code !== ver);
  const ver3 = valid(settings.ver3) && ![ver, ver2].includes(settings.ver3)
    ? settings.ver3
    : VERSIONS.find((v) => ![ver, ver2].includes(v.code)).code;
  const theme = ["light", "dark"].includes(settings.theme) ? settings.theme : "auto"; // 화면 모드: 기기 설정 따르기 / 밝게 / 어둡게
  const cutoff = Number(settings.readingCutoff);
  const readingCutoff = Number.isInteger(cutoff) && cutoff >= 0 && cutoff <= 5 ? cutoff : 0;
  return { ...settings, mode: ["one", "two", "three"].includes(settings.mode) ? settings.mode : "one", ver, ver2, ver3, theme, readingCutoff };
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

// 시편 119편(176절)은 길어서 그날은 이 한 편만 읽음. 바로 앞날은 하루 장 수보다 짧을 수 있음
const SOLO_CHAPTERS = new Set([chapterIndex("psa", 119)]);

function planDays(plan) {
  const days = [];
  let cur = [];
  for (const i of planSequence(plan)) {
    if (SOLO_CHAPTERS.has(i)) {
      if (cur.length) days.push(cur);
      days.push([i]);
      cur = [];
      continue;
    }
    cur.push(i);
    if (cur.length === plan.perDay) { days.push(cur); cur = []; }
  }
  if (cur.length) days.push(cur);
  return days;
}

// 읽은 기록에 맞춰 다시 짠 Day 목록 (덜 읽거나 더 읽은 날이 있어도 그다음부터 하루 장 수씩 새로 나눔)
//   · 어제까지 읽은 마지막 장까지는 "지난 Day": 같은 날 읽은 장끼리 한 Day, 건너뛰어 안 읽은 장은 따로(밀림)
//   · 그다음 장부터는 하루 장 수씩 앞으로 나눈 Day. 첫 Day가 오늘 읽을 분량이고 날짜는 오늘부터 하루씩
//   · 오늘 읽은 장은 지난 Day로 치지 않음 → 오늘 안에 분량이 갑자기 바뀌지 않음
// → { days, dates(Day마다 날짜, 건너뛴 Day는 null), headCount(지난 Day 수) }
function planDaysFor(plan, read, today) {
  const seq = planSequence(plan);
  let pastLast = -1;
  seq.forEach((i, p) => { if (read[i] && read[i] < today) pastLast = p; });

  const days = [], dates = [];
  let cur = [], curKey = null;
  const flush = () => {
    if (cur.length) { days.push(cur); dates.push(curKey === "skip" ? null : curKey); }
    cur = []; curKey = null;
  };
  for (let p = 0; p <= pastLast; p++) {
    const i = seq[p];
    const key = read[i] || "skip";
    if (SOLO_CHAPTERS.has(i)) { flush(); cur = [i]; curKey = key; flush(); continue; }
    if (key !== curKey || (key === "skip" && cur.length === plan.perDay)) flush();
    curKey = key;
    cur.push(i);
  }
  flush();
  const headCount = days.length;

  const base = today > plan.startDate ? today : plan.startDate;
  cur = [];
  const tailDays = [];
  for (const i of seq.slice(pastLast + 1)) {
    if (SOLO_CHAPTERS.has(i)) {
      if (cur.length) tailDays.push(cur);
      tailDays.push([i]);
      cur = [];
      continue;
    }
    cur.push(i);
    if (cur.length === plan.perDay) { tailDays.push(cur); cur = []; }
  }
  if (cur.length) tailDays.push(cur);
  tailDays.forEach((d, k) => { days.push(d); dates.push(addDays(base, k)); });
  return { days, dates, headCount };
}

// 장이 들어 있는 Day 번호(0부터). 하루 장 수로 나누면 시편 119편처럼 혼자 읽는 날에서 어긋나서 직접 찾음
function dayOfChapter(days, idx) {
  return Math.max(0, days.findIndex((d) => d.includes(idx)));
}
