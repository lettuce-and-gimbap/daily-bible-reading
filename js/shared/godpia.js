// 앱 안에 갓피아 화면을 띄울 때 쓰는 공통 설정

// 갓피아의 로그인 버튼은 top.location을 바꿔 이 앱 탭 전체를 로그인 페이지로 보내 버린다.
// 최상위 이동만 막고 나머지(스크립트, 새 창, 오디오 등)는 허용한다.
const GODPIA_SANDBOX =
  'sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"';

// 설정된 역본으로 해당 장의 갓피아 주소 (원어는 구약/신약에 맞춰 자동 전환)
function readerUrl(idx) {
  const { book, chap } = CHAPTERS[idx];
  const s = state.settings;
  return godpiaReadUrl(book.code, chap, versionFor(s.ver, book), s.mode === "two" ? versionFor(s.ver2, book) : "");
}
