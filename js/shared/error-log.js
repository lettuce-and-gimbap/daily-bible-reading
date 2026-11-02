// 화면에서 생긴 자바스크립트 오류를 이 기기에 최근 기록으로 남김 (서버로는 보내지 않음)
// 기록은 최대 MAX_ENTRIES개만 두고, 저장이 막혀 있으면(사생활 보호 모드 등) 조용히 건너뜀
(function () {
  const KEY = 'errorLog';
  const MAX_ENTRIES = 30;
  const MAX_TEXT = 300;

  const clip = (value) => String(value ?? '').slice(0, MAX_TEXT);

  // 기록 한 줄: 언제, 어느 화면, 무슨 오류인지. 개인 기록 내용은 넣지 않음
  function makeEntry(kind, reason, where, version) {
    return {
      at: new Date().toISOString(),
      kind,
      message: clip(reason && reason.message ? reason.message : reason),
      where: clip(where),
      route: clip(typeof location !== 'undefined' ? location.hash || location.pathname : ''),
      version: clip(version),
    };
  }

  // 목록 맨 뒤에 붙이고, 넘치면 오래된 것부터 뺌
  function appendEntry(list, entry, max = MAX_ENTRIES) {
    const next = [...list, entry];
    return next.length > max ? next.slice(next.length - max) : next;
  }

  function read(storage) {
    try {
      const parsed = JSON.parse(storage.getItem(KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function write(storage, list) {
    try {
      storage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      /* 저장소를 쓸 수 없으면 기록만 포기 */
    }
  }

  function create(storage, version) {
    function record(kind, reason, where) {
      write(storage, appendEntry(read(storage), makeEntry(kind, reason, where, version)));
    }
    return {
      recent: () => read(storage),
      clear: () => { try { storage.removeItem(KEY); } catch (e) { /* 무시 */ } },
      record,
    };
  }

  const api = { create, appendEntry, makeEntry, MAX_ENTRIES };
  if (typeof window !== 'undefined' && window.localStorage) {
    const version = (document.querySelector('script[src*="main.js"]')?.src.match(/v=([\d.]+)/) || [])[1] || '';
    const log = create(window.localStorage, version);
    window.addEventListener('error', (e) => log.record('error', e.error || e.message, e.filename ? `${e.filename}:${e.lineno}` : ''));
    window.addEventListener('unhandledrejection', (e) => log.record('rejection', e.reason, ''));
    window.ErrorLog = { recent: log.recent, clear: log.clear };
  }
  if (typeof module !== 'undefined') module.exports = api;
})();
