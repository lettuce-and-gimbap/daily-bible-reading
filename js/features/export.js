// 기록 내보내기: 통독 범위·통독 메모·QT 완료·묵상 노트를 텍스트(.txt) 또는 엑셀(.xlsx)로 저장
// 엑셀 파일은 필요할 때만 ExcelJS를 불러와 만든다.

const EXCELJS_URL = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
let exportRange = "all";

function exportCardHtml() {
  const today = todayStr();
  return `
    <section class="card export">
      <h2>📥 기록 내보내기</h2>
      <p class="muted small">통독 범위, 통독 메모, QT 완료 여부, 묵상 노트를 날짜별로 모아 파일로 저장해요.</p>
      <div class="export-range">
        <select id="ex-range" aria-label="내보낼 기간">
          <option value="all" ${exportRange === "all" ? "selected" : ""}>전체 기간</option>
          <option value="month" ${exportRange === "month" ? "selected" : ""}>이번 달</option>
          <option value="7" ${exportRange === "7" ? "selected" : ""}>최근 7일</option>
          <option value="30" ${exportRange === "30" ? "selected" : ""}>최근 30일</option>
          <option value="custom" ${exportRange === "custom" ? "selected" : ""}>기간 직접 고르기</option>
        </select>
        <span class="custom-range" ${exportRange === "custom" ? "" : "hidden"}>
          <input type="date" id="ex-from" value="${addDays(today, -29)}" max="${today}" aria-label="시작일">
          <span class="muted">~</span>
          <input type="date" id="ex-to" value="${today}" max="${today}" aria-label="종료일">
        </span>
      </div>
      <div class="inline wrap">
        <button class="btn primary small" id="ex-xlsx">📊 엑셀로 받기 (.xlsx)</button>
        <button class="btn ghost small" id="ex-txt">📄 텍스트로 받기 (.txt)</button>
      </div>
      <p class="muted small" id="ex-status"></p>
    </section>`;
}

function bindExportCard() {
  const range = $("#ex-range");
  range.addEventListener("change", () => {
    exportRange = range.value;
    $(".custom-range").hidden = exportRange !== "custom";
  });
  const status = $("#ex-status");
  const run = async (btn, fn) => {
    const period = exportPeriod();
    const data = collectRecords(period);
    if (!data.days.length) {
      status.textContent = "이 기간에는 남긴 기록이 없어요.";
      return;
    }
    btn.disabled = true;
    status.textContent = "파일을 만드는 중…";
    try {
      await fn(data);
      status.textContent = `${data.days.length}일치 기록을 저장했어요.`;
    } catch (e) {
      status.textContent = `파일을 만들지 못했어요. (${e.message})`;
    }
    btn.disabled = false;
  };
  $("#ex-txt").addEventListener("click", (e) => run(e.currentTarget, exportTxt));
  $("#ex-xlsx").addEventListener("click", (e) => run(e.currentTarget, exportXlsx));
}

function exportPeriod() {
  const today = todayStr();
  if (exportRange === "month") return { from: `${today.slice(0, 7)}-01`, to: today, label: `${Number(today.slice(5, 7))}월` };
  if (exportRange === "7" || exportRange === "30") {
    const n = Number(exportRange);
    return { from: addDays(today, -(n - 1)), to: today, label: `최근 ${n}일` };
  }
  if (exportRange === "custom") {
    let from = $("#ex-from").value || today, to = $("#ex-to").value || today;
    if (from > to) [from, to] = [to, from];
    return { from, to, label: `${from}~${to}` };
  }
  return { from: "0000-00-00", to: "9999-99-99", label: "전체" };
}

// 기간 안의 날짜별 기록 (오래된 날짜부터)
function collectRecords(period) {
  const byDate = readDates();
  const inRange = (d) => d >= period.from && d <= period.to;
  const dates = [...new Set([...Object.keys(byDate), ...Object.keys(state.dayNotes), ...Object.keys(state.qt)])]
    .filter(inRange).sort();
  const days = dates.map((date) => {
    const chapters = (byDate[date] || []).sort((a, b) => a - b);
    const qt = state.qt[date] || null;
    return {
      date,
      pretty: prettyDate(date),
      range: chapters.length ? describeChapters(chapters) : "",
      chapters,
      readNote: (state.dayNotes[date] || "").trim(),
      qtDone: !!(qt && qt.done),
      qtNote: qt ? (qt.note || "").trim() : "",
    };
  });
  const pr = state.plan ? progress() : null;
  return {
    period,
    days,
    summary: {
      plan: state.plan ? `${chapLabel(state.plan.startIdx)} → ${chapLabel(state.plan.endIdx)} · 하루 ${state.plan.perDay}장 · ${state.plan.startDate} 시작` : "계획 없음",
      progress: pr ? `${pr.pct}% (${pr.readCount}/${pr.total}장), Day ${pr.doneDays}/${pr.days.length} 완료` : "-",
      readStreak: streak(new Set(Object.keys(byDate))),
      qtTotal: qtDoneDates().size,
      qtStreak: streak(qtDoneDates()),
      inPeriod: {
        readDays: days.filter((d) => d.chapters.length).length,
        chapters: days.reduce((n, d) => n + d.chapters.length, 0),
        qtDays: days.filter((d) => d.qtDone).length,
      },
    },
  };
}

function exportFileName(data, ext) {
  const p = data.period.label === "전체" ? "전체" : data.period.label.replace(/[~/]/g, "_");
  return `경건생활_기록_${p}_${todayStr()}.${ext}`;
}

async function saveFile(blob, name) {
  // 아이폰 홈 화면 앱처럼 다운로드가 막힌 환경에서는 공유 시트(파일에 저장)로
  const file = new File([blob], name, { type: blob.type });
  if (isStandaloneApp() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function isStandaloneApp() {
  return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

/* ---------- 텍스트 ---------- */

function exportTxt(data) {
  const s = data.summary;
  const indent = (text) => text.split("\n").map((l) => `    ${l}`).join("\n");
  const lines = [
    "경건생활 기록",
    `기간: ${data.period.label}${data.days.length ? ` (${data.days[0].date} ~ ${data.days[data.days.length - 1].date})` : ""}`,
    `내보낸 날: ${prettyDate(todayStr())}`,
    "",
    "[요약]",
    `통독 계획: ${s.plan}`,
    `전체 진행: ${s.progress}`,
    `이 기간: 통독 ${s.inPeriod.readDays}일 · ${s.inPeriod.chapters}장 / QT ${s.inPeriod.qtDays}일`,
    `연속 통독 ${s.readStreak}일 · QT 누적 ${s.qtTotal}일 (연속 ${s.qtStreak}일)`,
    "",
  ];
  for (const d of data.days) {
    lines.push("────────────────────────────", d.pretty.replace(/^(\d+)월/, `${d.date.slice(0, 4)}년 $1월`), "");
    if (d.range) lines.push(`📖 통독: ${d.range} (${d.chapters.length}장)`);
    if (d.readNote) lines.push("   통독 메모:", indent(d.readNote));
    if (d.qtDone || d.qtNote) lines.push(`🙏 QT: ${d.qtDone ? "완료" : "메모만"}`);
    if (d.qtNote) lines.push("   묵상 노트:", indent(d.qtNote));
    lines.push("");
  }
  // 윈도우 메모장에서도 한글이 깨지지 않게 BOM을 붙임
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
  return saveFile(blob, exportFileName(data, "txt"));
}

/* ---------- 엑셀 ---------- */

function loadExcelJS() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = EXCELJS_URL;
    s.onload = () => (window.ExcelJS ? resolve(window.ExcelJS) : reject(new Error("엑셀 도구를 불러오지 못했어요")));
    s.onerror = () => reject(new Error("인터넷 연결을 확인해 주세요"));
    document.head.appendChild(s);
  });
}

async function exportXlsx(data) {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = "경건생활";
  wb.created = new Date();

  const GREEN = "FF2D6A55", GREEN_SOFT = "FFE2EFE9", GOLD_SOFT = "FFF8ECD9", LINE = "FFE6E2D9";
  const styleSheet = (ws, headerColor) => {
    const header = ws.getRow(1);
    header.height = 22;
    header.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerColor } };
      c.alignment = { vertical: "middle", horizontal: "center" };
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.eachRow((row, i) => {
      if (i === 1) return;
      row.eachCell({ includeEmpty: true }, (c) => {
        c.alignment = { vertical: "top", wrapText: true };
        c.border = { bottom: { style: "thin", color: { argb: LINE } } };
      });
    });
    if (ws.rowCount > 1) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
  };

  // 시트 순서는 만든 순서대로: 요약 → 날짜별 기록 → 메모 모아보기 → 읽은 장
  const sum = wb.addWorksheet("요약");

  // 1) 날짜별 기록 (한눈에 보기)
  const all = wb.addWorksheet("날짜별 기록");
  all.columns = [
    { header: "날짜", key: "date", width: 12 },
    { header: "요일", key: "dow", width: 6 },
    { header: "통독 범위", key: "range", width: 28 },
    { header: "읽은 장", key: "count", width: 8 },
    { header: "통독 메모", key: "readNote", width: 48 },
    { header: "QT", key: "qt", width: 8 },
    { header: "QT 묵상 노트", key: "qtNote", width: 48 },
  ];
  for (const d of data.days) {
    const row = all.addRow({
      date: d.date,
      dow: WEEK[parseDate(d.date).getDay()],
      range: d.range,
      count: d.chapters.length || null,
      readNote: d.readNote,
      qt: d.qtDone ? "완료" : d.qtNote ? "메모" : "",
      qtNote: d.qtNote,
    });
    if (d.qtDone) row.getCell("qt").fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD_SOFT } };
    if (d.chapters.length) row.getCell("count").fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_SOFT } };
    row.getCell("count").alignment = { horizontal: "center", vertical: "top" };
    row.getCell("dow").alignment = { horizontal: "center", vertical: "top" };
  }
  styleSheet(all, GREEN);

  // 2) 메모만 모아 보기
  const notes = wb.addWorksheet("메모 모아보기");
  notes.columns = [
    { header: "날짜", key: "date", width: 12 },
    { header: "종류", key: "kind", width: 12 },
    { header: "관련 본문", key: "ref", width: 26 },
    { header: "내용", key: "text", width: 70 },
  ];
  for (const d of data.days) {
    if (d.readNote) notes.addRow({ date: d.date, kind: "통독 메모", ref: d.range, text: d.readNote });
    if (d.qtNote) notes.addRow({ date: d.date, kind: "QT 묵상 노트", ref: "날마다 솟는 샘물", text: d.qtNote });
  }
  styleSheet(notes, "FFC1832A");

  // 3) 읽은 장 목록
  const chaps = wb.addWorksheet("읽은 장");
  chaps.columns = [
    { header: "읽은 날짜", key: "date", width: 12 },
    { header: "권", key: "book", width: 16 },
    { header: "장", key: "chap", width: 6 },
    { header: "구분", key: "t", width: 8 },
  ];
  for (const d of data.days) {
    for (const i of d.chapters) {
      const c = CHAPTERS[i];
      chaps.addRow({ date: d.date, book: c.book.name, chap: c.chap, t: c.book.testament === "OT" ? "구약" : "신약" });
    }
  }
  styleSheet(chaps, GREEN);

  // 4) 요약
  const s = data.summary;
  sum.columns = [{ header: "항목", key: "k", width: 18 }, { header: "내용", key: "v", width: 60 }];
  [
    ["내보낸 날", prettyDate(todayStr())],
    ["기간", data.period.label + (data.days.length ? ` (${data.days[0].date} ~ ${data.days[data.days.length - 1].date})` : "")],
    ["통독 계획", s.plan],
    ["전체 진행", s.progress],
    ["이 기간 통독", `${s.inPeriod.readDays}일 · ${s.inPeriod.chapters}장`],
    ["이 기간 QT", `${s.inPeriod.qtDays}일`],
    ["연속 통독", `${s.readStreak}일`],
    ["QT", `누적 ${s.qtTotal}일 · 연속 ${s.qtStreak}일`],
  ].forEach(([k, v]) => sum.addRow({ k, v }));
  styleSheet(sum, GREEN);
  sum.getColumn("k").font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  return saveFile(blob, exportFileName(data, "xlsx"));
}
