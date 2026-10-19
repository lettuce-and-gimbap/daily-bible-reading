// 앱 전체가 함께 쓰는 상태와 작은 도우미
// state: 계획·읽은 장·메모·QT·설정 (localStorage에 저장, core/store.js 참고)

let state = loadState();

const app = document.getElementById("app");
const $ = (s) => app.querySelector(s);

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function prettyDate(str) {
  const d = parseDate(str);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`;
}

function chapLabel(i) {
  return `${CHAPTERS[i].book.name} ${CHAPTERS[i].chap}${chapUnit(CHAPTERS[i].book)}`;
}

function versionName(code) {
  return (VERSIONS.find((v) => v.code === code) || VERSIONS[0]).name;
}

// 화면 모드(관리 탭에서 고름): auto면 기기 설정을 따르고, light/dark면 css의 data-theme으로 강제
function applyTheme() {
  const t = (state.settings || {}).theme;
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

// 통독 날짜는 사용자가 정한 새벽 마감 시각 전까지 전날로 본다. 기본값 0은 자정 마감이다.
function readingDateStr(now = new Date()) {
  const cutoff = Number((state.settings || {}).readingCutoff) || 0;
  const d = new Date(now);
  if (cutoff > 0 && d.getHours() < cutoff) d.setDate(d.getDate() - 1);
  return todayStr(d);
}

function readingHabitCounts(now = new Date()) {
  const habits = normalizeReadingHabits(state.readingHabits);
  const since = new Date(now.getTime() - 30 * 86400000);
  const sinceDate = todayStr(since);
  return {
    late: habits.lateDays.filter((d) => d >= sinceDate).length,
    changes: habits.cutoffChanges.filter((x) => new Date(x) >= since).length,
  };
}

function markChapterRead(idx, now = new Date()) {
  state.read[idx] = readingDateStr(now);
  state.readingHabits = normalizeReadingHabits(state.readingHabits);
  if (now.getHours() < 6) {
    const actualDate = todayStr(now);
    if (!state.readingHabits.lateDays.includes(actualDate)) state.readingHabits.lateDays.push(actualDate);
  }
}

function changeReadingCutoff(hour, now = new Date()) {
  const next = Math.max(0, Math.min(5, Number(hour) || 0));
  if (next === Number(state.settings.readingCutoff || 0)) return false;
  state.settings.readingCutoff = next;
  state.readingHabits = normalizeReadingHabits(state.readingHabits);
  state.readingHabits.cutoffChanges.push(now.toISOString());
  state.readingHabits = normalizeReadingHabits(state.readingHabits);
  return true;
}

// 저장할 때마다 알림 서버에도 오늘 완료 여부를 알림 (features/reminder.js)
function persist() {
  saveState(state);
  queueReminderSync();
  if (typeof queueAccountSync === "function") queueAccountSync(); // 로그인했으면 서버에도 (features/account.js)
  if (typeof updateStreakChip === "function") updateStreakChip();
}

/* ---------- 진행 계산 ---------- */

function progress() {
  const plan = state.plan;
  const seq = planSequence(plan);
  const today = readingDateStr();
  // 읽은 기록에 맞춰 다시 짠 Day (core/store.js planDaysFor)
  const { days, dates: dayDates, headCount } = planDaysFor(plan, state.read, today);
  const readCount = seq.filter((i) => state.read[i]).length;
  let currentDay = days.findIndex((d) => d.some((i) => !state.read[i]));
  const finished = currentDay === -1;
  if (finished) currentDay = days.length - 1;
  const doneDays = days.filter((d) => d.every((i) => state.read[i])).length;
  const remainingDays = days.length - doneDays;
  const readToday = seq.filter((i) => state.read[i] === today).length;
  // 오늘 하루 분량을 이미 채웠으면 남은 분량은 내일부터 계산
  const todayQuotaMet = readToday >= plan.perDay;
  // 오늘 읽을 Day = 어제까지 읽은 곳 다음의 첫 Day (계획이 끝났으면 마지막 Day)
  const todayDay = Math.min(days.length - 1, headCount);
  const dayComplete = (d) => d.every((i) => state.read[i]);
  // 밀림 = 건너뛰어 안 읽고 지나간 장이 있는 Day
  const behindDays = days.slice(0, todayDay).filter((d) => !dayComplete(d)).length;
  // 알림 기준: 오늘 분량(하루 장 수)을 채웠거나, 오늘 Day까지 다 읽었으면 완료
  const dailyDone = finished || todayQuotaMet || (behindDays === 0 && dayComplete(days[todayDay]));
  // 계획 대비: 처음 계획대로 어제까지 읽었어야 할 장 수와 실제로 읽은 장 수의 차이를 하루 분량으로 환산
  const elapsed = Math.max(0, daysBetween(plan.startDate, today));
  const expected = Math.min(seq.length, elapsed * plan.perDay);
  const readBefore = seq.filter((i) => state.read[i] && state.read[i] < today).length;
  return {
    seq, days, dayDates, readCount, total: seq.length, currentDay, finished, readToday, todayDay, behindDays, dailyDone,
    doneDays, diff: Math.floor((readBefore - expected) / plan.perDay),
    pct: Math.round((readCount / seq.length) * 100),
    plannedEnd: addDays(plan.startDate, planDays(plan).length - 1),
    projectedEnd: finished ? null : addDays(today, remainingDays - (todayQuotaMet ? 0 : 1)),
  };
}

// 통독 목표를 채운 날짜들 (연속 읽은 일 수에 셈)
// 그날 읽은 장 수가 그날의 목표 분량 이상이어야 함. 목표는 계획을 세울 때 정한 하루 장 수이고,
// 시편 119편처럼 혼자 읽는 날이나 계획 끝의 남은 분량처럼 짧게 나뉜 Day는 그 Day의 크기가 목표임.
// 목표보다 더 읽은 날은 괜찮고, 덜 읽은 날은 세지 않음. 계획이 없으면 읽은 날을 모두 셈
function readGoalDates() {
  const byDate = readDates();
  if (!state.plan) return new Set(Object.keys(byDate));
  const out = new Set();
  Object.entries(byDate).forEach(([d, list]) => {
    // 그 날짜 아침 기준으로 짠 Day 중 첫 Day(= 그날 읽기로 한 분량)의 크기
    const { days, headCount } = planDaysFor(state.plan, state.read, d);
    const goal = (days[headCount] || []).length || 1;
    if (list.length >= goal) out.add(d);
  });
  return out;
}

function readDates() {
  const byDate = {};
  for (const [idx, date] of Object.entries(state.read)) {
    (byDate[date] = byDate[date] || []).push(Number(idx));
  }
  return byDate;
}

function qtDoneDates() {
  return new Set(Object.keys(state.qt).filter((d) => state.qt[d].done));
}

// QT는 월~토(주 6일) 기준: 일요일은 세지 않고, 연속 계산도 일요일을 건너뜀
function isSundayStr(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}
function qtCountDates() {
  return new Set([...qtDoneDates()].filter((d) => !isSundayStr(d)));
}
function qtStreak(dateSet) {
  const prev = (x) => { let y = addDays(x, -1); while (isSundayStr(y)) y = addDays(y, -1); return y; };
  let d = todayStr();
  if (isSundayStr(d) || !dateSet.has(d)) d = prev(d);
  let n = 0;
  while (dateSet.has(d)) { n++; d = prev(d); }
  return n;
}

function streak(dateSet) {
  let d = readingDateStr();
  if (!dateSet.has(d)) d = addDays(d, -1);
  let n = 0;
  while (dateSet.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

// 알림용 오늘 요약: 서버에는 done/paused만, 서비스 워커는 분량·연속 일수로 문구를 채움
function reminderSnapshot() {
  const date = readingDateStr();
  if (!state.plan) return { date, done: false, paused: true, portion: "", streak: 0 };
  const pr = progress();
  const day = pr.days[pr.behindDays > 0 ? pr.currentDay : pr.todayDay];
  return {
    date,
    done: pr.dailyDone,
    paused: pr.finished,
    portion: describeChapters(day),
    streak: streak(new Set(Object.values(state.read))),
  };
}
