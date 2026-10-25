// Cloudflare Worker 주소: 알림·계정 동기화와 비공개 성경 본문(/scripture), 검색 보조(/search), QT(/qt)에 씀.
// 예: "https://daily-bible-reminder.아이디.workers.dev"
const PUSH_SERVER = "https://daily-bible-reminder.gimbap-lettuce.workers.dev";

// 📋 붙여넣기로 메모에 붙일 역본 (어디서 복사했든 이 역본들의 온전한 절로 붙음). 갓피아 역본 코드, 한두 개
// gae 개역개정4판 · easy 쉬운성경 · saenew 새번역 · hyun 현대인의성경 · han 개역한글 · niv NIV
const QUOTE_VERSIONS = ["gae", "easy"];
