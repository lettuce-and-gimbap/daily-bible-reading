# 로깅 및 사용자 경험 재생 계획

## 목표

로그를 통해 한 세션에서 다음 세 가지를 시간 순서대로 재구성한다.

1. **사용자 경험**: 사용자가 어떤 화면과 상태를 보고 어떤 주요 행동을 했는가.
2. **내부 작업**: 앱이 저장, 네트워크 요청, 동기화, 생성, 렌더링 과정에서 무엇을 했는가.
3. **눈에 보인 결과**: 화면이 갱신됐는가, 성공·오류·빈 상태가 표시됐는가.

로그는 기능 수행에 필수인 데이터 경로가 아니다. 기록 실패가 읽기·저장·화면 이동을 막아서는 안 된다. 이 계획은 먼저 **기기 내 지원용 재생 기록**을 대상으로 하며, 원격 분석 전송은 별도 제품·개인정보 결정으로 남긴다.

## 현재 구조와 계측 경계

- 단일 페이지 앱은 `js/main.js`의 해시 라우트로 통독, QT, 현황 화면을 전환한다.
- 주요 계획·읽음·메모·QT·표시 설정은 `js/core/store.js`와 `js/shared/state.js`를 통해 `localStorage`에 저장된다. `persist()`는 저장 뒤 알림 상태와 로그인 계정 동기화를 예약한다.
- `js/features/account.js`는 전체 상태를 계정 API와 동기화한다. 이 상태에는 노트와 QT 답변 같은 사적 텍스트가 포함된다.
- Worker(`worker/src/index.js`)는 계정, 알림, 요약, 성경/QT 콘텐츠 등의 서로 다른 API 작업을 처리한다. 일부 요청은 성경 제공처나 Gemini로 이어진다.
- 픽셀 성경 월드는 `js/features/pixel-bible/world.js`에 상호작용과 자체 로컬 저장 지점이 있고, 여러 오류는 현재 `console.warn`만 남긴다.
- 관리자 피드백은 텍스트·음성을 서버로 보낸다. 피드백 내용과 음성은 진단 이벤트에 절대 포함하지 않는다.

따라서 계측은 공통 브라우저 이벤트 모듈, 앱 기능 이벤트, Worker 구조화 로그의 세 층으로 둔다. 기존 업무 데이터 저장 형식과 이벤트 저널을 분리한다.

## 이벤트 분류

이벤트 이름은 `영역.대상.동사` 형태의 안정적인 영문 식별자로 정하고, 번역 가능한 표시 문구를 이벤트 값으로 쓰지 않는다.

| 종류 | 의미 | 예시 |
|---|---|---|
| `experience` | 사용자에게 노출된 상태·행동 | `view.route_changed`, `reader.chapter_opened`, `qt.date_changed`, `pixel_world.entered` |
| `operation` | 앱이 수행한 의미 있는 작업 | `storage.write`, `account.sync`, `content.fetch`, `summary.generate`, `reminder.register` |
| `outcome` | 작업 또는 행동의 관찰 가능한 결과 | `view.rendered`, `save.confirmed`, `request.failed`, `fallback.used`, `toast.shown` |
| `snapshot` | 해당 시점 재생을 위한 제한된 화면 상태 | `view.snapshot` |

기록할 사용자 행동은 화면·패널 이동, 날짜/장 선택, 읽음/QT 완료 변경, 계획·설정 변경, 주요 복사/내보내기 시작, 월드 조작 결과, 알림 및 계정 동작 등이다. 텍스트 입력은 타이핑 단위가 아니라 디바운스된 저장 결과만 남긴다. 드래그는 시작·완료·취소와 대상/결과를 기록하되 포인터 좌표열은 수집하지 않는다. 애니메이션 프레임, 스크롤 좌표, 원시 키 입력은 제외한다.

## 이벤트 봉투와 상관관계

```json
{
  "schema": 1,
  "id": "event-uuid",
  "session_id": "session-uuid",
  "seq": 42,
  "time": "2026-11-02T08:15:30.123Z",
  "type": "operation",
  "name": "storage.write",
  "action_id": "action-uuid",
  "parent_id": "event-uuid-or-null",
  "context": {
    "app_version": "10.3.0",
    "route": "today",
    "view": "reader.verses",
    "locale": "ko-KR",
    "timezone": "Asia/Seoul"
  },
  "data": { "store": "app-state", "result": "ok", "duration_ms": 3 }
}
```

- `session_id`는 탭/실행 인스턴스마다 생성하고 인증 정보에서 파생하지 않는다. `seq`는 세션 안에서 단조 증가한다.
- 사용자가 일으킨 작업은 `action_id`를 만든다. 저장·요청·렌더링·가시 결과가 그 ID를 공유한다. 배경 작업은 자체 작업 ID를 갖고 유발 이벤트를 `parent_id`로 참조한다.
- 시작 이벤트와 종료 이벤트를 기록하는 작업은 `operation_id`, `status`(`started`, `succeeded`, `failed`, `cancelled`), `duration_ms`를 포함한다.
- 이벤트의 `data`는 명시적 허용 목록으로 만든다. 객체 덤프를 통째로 기록하지 않는다.
- 가능한 경우 사용자 로컬 시각과 오프셋 또는 시간대를 남긴다. 정렬 기준은 UTC 시각과 `seq`다.

## 재생 데이터 범위

### 기록할 것

- 라우트, 기능 탭, 패널, 선택된 날짜 및 현재 성경 장(본문 자체는 제외)
- 화면 표시 결과에 영향을 주는 안전한 설정: 테마, 표시 모드, 선택 역본 식별자 등 필요한 범위
- 로딩 상태, 콘텐츠 공급 경로/캐시 여부, UI 결과 코드(예: `loaded`, `empty`, `error`, `retry_prompt`)
- 사용자 행동으로 바뀐 데이터의 **변경 유형과 요약**: 읽음 토글 및 장 ID, QT 완료 여부, 계획 범위·속도, 저장 필드 종류·문자 수
- 주요 오류의 분류 코드, HTTP 상태, 재시도 횟수, 요청 목적과 소요 시간
- 화면 스냅샷: 라우트·뷰·선택 상태·표시 결과·진행 중 작업 ID

### 기록하지 않을 것

- 통독 메모, QT 답변, 관계 노트, 복사한 본문/검색어, 피드백 텍스트와 음성
- 원시 DOM/HTML, 전체 스크린샷, 전체 앱 상태, 네트워크 요청·응답 본문
- 인증 토큰, 계정 식별자, 이메일, 푸시 endpoint, IP, 위치 좌표, URL의 쿼리/해시 원문
- 원시 오류 메시지에 포함될 수 있는 사용자 데이터, 전체 파일 경로, 외부 서비스 키

본문을 사용자가 실제로 보았는지 재생해야 할 필요는 별도로 다룬다. 본문 저장은 저작권·개인정보 및 저장 용량 문제가 있으므로 기본 재생 저널에는 넣지 않는다. 콘텐츠 버전/출처 키로 당시 동일 콘텐츠를 다시 가져올 수 있게 하고, 불가능하면 재생 UI에 그 한계를 분명히 표시한다.

## 제품 영역별 이벤트 목록

### 앱 셸 및 화면

- `app.session.started`, `app.session.ended`(종료는 `pagehide` 등에서 best-effort)
- `view.route_changed`, `view.tab_changed`, `view.panel_opened`, `view.panel_closed`, `view.snapshot`
- `view.render.started`, `view.render.completed`, `view.render.failed`
- `app.update.detected`, `app.reload.started`

### 통독 및 QT

- `plan.created`, `plan.updated`, `plan.cleared`
- `reader.chapter_opened`, `reader.chapter_marked_read`, `reader.chapter_marked_unread`, `reader.day_changed`
- `reader.edition_changed`, `reader.content_load.completed/failed`
- `reader.note.saved`는 `field=day-note`, `length_bucket` 정도만 기록
- `qt.date_changed`, `qt.completed`, `qt.completion_reverted`, `qt.content_load.completed/failed`
- `qt.answer.saved`는 질문 식별자를 꼭 재생에 쓸 때만 안정적인 문항 키로 남기고 답변/질문 문구는 제외

### 현황, 계정, 알림

- `stats.calendar.opened`, `stats.export.started/completed/failed`, `data.import.*`, `data.reset.*`
- `account.sync.started/completed/failed`, `account.login.*`, `account.logout.completed`; 사용자 ID나 토큰은 금지
- `reminder.permission.result`, `reminder.subscription.*`, `reminder.test.*`, `reminder.status_sync.*`
- Worker 발송은 구독 ID 대신 회전 가능한 비식별 키 또는 총계 단위 운영 로그를 사용. 개별 사용자를 재생할 필요가 없는 크론 통계는 집계 로그로 둔다.

### 요약/콘텐츠 요청 및 픽셀 월드

- `summary.requested`, `summary.cache_hit`, `summary.provider_attempt`, `summary.completed/failed`, `summary.fallback_used`; 모델명은 허용된 값만 기록
- 본문/검색/QT Worker 요청은 `content.requested/completed/failed`로 목적·콘텐츠 키·상태·시간을 남기고 검색어 및 본문은 제외
- `pixel_world.entered`, `pixel_world.object_moved`, `pixel_world.object_interaction.completed`, `pixel_world.discovery.unlocked`, `pixel_world.state.saved/failed`
- 월드의 빈번한 움직임은 상태 전이를 묶어 저장하고 위치는 월드 객체의 논리 셀/영역 키로 제한한다. 프레임 단위 좌표는 남기지 않는다.
- 피드백은 재생 저널에 내용이 아니라 `feedback.recording.started/completed`, `feedback.submission.completed/failed`와 글자 수 구간/음성 길이 구간만 남긴다.

## 로그 저장·수명주기 설계

1. `js/shared/`에 작은 `experience-log.js` 모듈을 두고, `emit(name, data, options)`가 허용 목록 검사·ID·순번·메모리 버퍼를 관리한다.
2. 재생 가능한 데이터는 IndexedDB에 순차 저장한다. `localStorage`는 기존 전체 상태를 저장하므로 로그 저널을 여기에 붙이지 않는다. IndexedDB 불가 시 메모리 내 최근 기록으로 축소하고 기능은 계속 동작한다.
3. 세션/사용자 액션 스냅샷은 이벤트와 같은 저널에 둔다. 이벤트는 append-only이며 삭제·내보내기는 세션/기간별로 가능하게 한다.
4. 기본 보존은 최근 7일 또는 최근 5 MB 중 먼저 도달하는 한도처럼 초기 상한을 설정하고 오래된 이벤트부터 제거한다. 실제 값은 기기·지원 요구에 맞춰 사용성 검증 후 확정한다.
5. 지원용 내보내기는 JSONL 또는 버전 지정 ZIP으로 만들고, 내보내기 전에 미리보기/민감정보 검사와 취소 기능을 제공한다. 가져온 로그는 읽기 전용·격리 상태로 재생한다.
6. 기록은 기본적으로 기기 밖으로 나가지 않는다. 원격 전송을 추가하려면 별도의 동의 UI, 수집 목적, 보존기간, 삭제 절차, 접근 통제를 먼저 정한다.

## 재생기 동작

- 세션 타임라인에서 이벤트를 순서대로 보여 주고, 사용자 행동·내부 작업·결과를 구분한다.
- `action_id`로 트리를 접거나 펼쳐 한 행동이 어떤 요청/저장/렌더 결과로 이어졌는지 탐색한다.
- `view.snapshot`부터 시작해 앱 버전과 콘텐츠 키를 기준으로 해당 화면을 재구성한다. 재생 모드는 읽기 전용이며 실제 저장, 네트워크, 알림, 계정 동작을 다시 실행하지 않는다.
- 콘텐츠를 다시 가져올 수 없거나 버전이 달라졌다면 당시 선택/로딩 상태와 결과 코드를 재생하고 “콘텐츠를 동일하게 복원하지 못함”을 표시한다.
- 이벤트 누락, 오래된 스키마, 잘못된 이벤트는 재생을 중단하지 않고 표시 가능한 구간만 재생한다.

## 구현 순서 및 완료 기준

### 0단계: 계약 확정

- 이벤트 스키마, 이름 목록, 금지 필드, 식별자/상관관계 규칙, 보존 한도와 내보내기 형식을 문서화한다.
- 완료 기준: 이벤트별 필드 허용 목록을 코드 리뷰로 확인하고 샘플 민감정보 점검을 통과한다.

### 1단계: 저널 기반 구축

- 세션 ID, 순번, action/operation ID, IndexedDB 저널, 용량 정리, export/delete API를 구현한다.
- `main.js` 라우트, `persist()` 저장 결과, 저장 실패, 기본 화면 스냅샷부터 계측한다.
- 완료 기준: 저장소 불가/용량 초과에서도 앱 동작이 유지되고, 이벤트 순서와 상관관계가 검증된다.

### 2단계: 핵심 여정 계측

- 통독 계획·장 읽음·QT 완료·화면 설정, 본문 로드·패널 결과를 추가한다.
- 계정 동기화/Worker 요청은 민감 데이터 없이 목적·결과·상태·시간만 남긴다.
- 완료 기준: 대표 통독 및 QT 세션을 행동→작업→화면 결과 순으로 재생할 수 있고 노트 내용이 로그에 없다.

### 3단계: 부가 기능과 실패 경로

- 현황/가져오기·내보내기, 알림, 요약 fallback, 픽셀 월드, 피드백 전송 결과를 추가한다.
- 실패, 취소, 오프라인, 권한 거부 및 중복 완료 같은 결과를 명시적으로 계측한다.
- 완료 기준: 각 외부 요청에 결과가 하나 이상 있고 정상·실패·취소 경로를 구별한다.

### 4단계: 재생 UI 및 지원 워크플로

- 읽기 전용 타임라인, action 트레이스, 스냅샷 미리보기, 내보내기 전 민감정보 점검을 만든다.
- 완료 기준: 외부 효과를 재실행하지 않고, 다른 버전/누락 이벤트/콘텐츠 비가용을 설명할 수 있다.

## 검증할 대표 시나리오

1. 앱 실행 → 오늘 통독 화면 표시 → 장 이동 → 읽음 체크 → 다음 장 자동 선택 → 저장 성공 표시
2. QT 날짜 이동 → 본문 요청 실패 → 재시도 또는 오류 안내 → QT 완료 처리
3. 메모 편집 후 저장 → 저널에는 저장 시각/필드/길이만 남고 실제 텍스트는 없음
4. 로그인 동기화 오프라인 실패 후 재시도 성공 → 로컬 저장과 서버 동기화 결과가 구분됨
5. 요약 캐시 miss → 제공자 오류/대체 모델 → 화면 표시 또는 재시도 안내
6. 픽셀 월드에서 오브젝트 이동·상호작용 → 저장 → 재진입 후 상태 복원
7. 저널이 가득 참, IndexedDB 거부, 이벤트 스키마가 낯섦 → 앱 핵심 기능은 정상 동작

## 운영 지표와 알림

원격 운영 로그를 도입하는 경우 사용자 재생 이벤트와 별도 파이프라인에 둔다. 개인정보 없는 집계 중심으로 API 오류율, 응답 시간, 요약 제공자 실패·fallback 비율, 동기화 성공률, 알림 발송 성공·만료 건수를 관찰한다. 사용자 수준 식별자를 포함하지 않는 기본 방식을 우선한다. 로그 자체에서 인증 헤더, URL 쿼리, 요청 본문이 자동 마스킹되는지 확인한다.

## 주요 파일 후보

- 공통 저널: `js/shared/experience-log.js` (신규)
- 화면/세션 연결: `js/main.js`
- 저장 경계: `js/shared/state.js`, `js/core/store.js`
- 통독/QT: `js/features/reader.js`, `js/features/qt.js`
- 계정/알림: `js/features/account.js`, `js/features/reminder.js`
- 픽셀 월드: `js/features/pixel-bible/world.js`
- Worker 구조화 로그: `worker/src/index.js`, `worker/src/summary.js`, 관련 API 모듈
- 재생 설계 문서: `docs/logging-and-replay-plan.md`
