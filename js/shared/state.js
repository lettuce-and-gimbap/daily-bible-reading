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
  return `${CHAPTERS[i].book.name} ${CHAPTERS[i].chap}장`;
}

function versionName(code) {
  return (VERSIONS.find((v) => v.code === code) || VERSIONS[0]).name;
}

// 저장할 때마다 알림 서버에도 오늘 완료 여부를 알림 (features/reminder.js)
function persist() {
  saveState(state);
  queueReminderSync();
}

/* ---------- 진행 계산 ---------- */

function progress() {
  const plan = state.plan;
  const seq = planSequence(plan);
  const days = planDays(plan);
  const readCount = seq.filter((i) => state.read[i]).length;
  let currentDay = days.findIndex((d) => d.some((i) => !state.read[i]));
  const finished = currentDay === -1;
  if (finished) currentDay = days.length - 1;
  const today = todayStr();
  const elapsed = Math.max(0, daysBetween(plan.startDate, today));
  // 어제까지 끝냈어야 하는 Day 수 (오늘 분량은 오늘 안에만 읽으면 밀린 것이 아님)
  const expectedDone = Math.min(days.length, elapsed);
  const doneDays = days.filter((d) => d.every((i) => state.read[i])).length;
  const remainingDays = days.length - doneDays;
  const readToday = seq.filter((i) => state.read[i] === today).length;
  // 오늘 하루 분량을 이미 채웠으면 남은 분량은 내일부터 계산
  const todayQuotaMet = readToday >= plan.perDay;
  // 통독표 날짜 기준으로 오늘 읽을 Day (시작 전이면 Day 1, 계획이 끝났으면 마지막 Day)
  const todayDay = Math.min(days.length - 1, Math.max(0, daysBetween(plan.startDate, today)));
  const dayComplete = (d) => d.every((i) => state.read[i]);
  const behindDays = days.slice(0, todayDay).filter((d) => !dayComplete(d)).length;
  // 알림 기준: 오늘 분량(하루 장 수)을 채웠거나, 통독표상 오늘 Day까지 다 읽었으면 완료
  const dailyDone = finished || todayQuotaMet || (behindDays === 0 && dayComplete(days[todayDay]));
  return {
    seq, days, readCount, total: seq.length, currentDay, finished, readToday, todayDay, behindDays, dailyDone,
    doneDays, diff: doneDays - expectedDone,
    pct: Math.round((readCount / seq.length) * 100),
    plannedEnd: addDays(plan.startDate, days.length - 1),
    projectedEnd: finished ? null : addDays(today, remainingDays - (todayQuotaMet ? 0 : 1)),
  };
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

function streak(dateSet) {
  let d = todayStr();
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
  const date = todayStr();
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
