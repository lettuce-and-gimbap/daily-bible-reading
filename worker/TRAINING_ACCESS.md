# 훈련 자료 접근 관리

훈련 자료 본문은 공개 Pages 파일에 두지 않고 Worker KV의 `training:` 키로 보관합니다. `training.html`은 자료 본문을 포함하지 않는 공개 입구입니다. 훈련생은 관리자 화면의 5분짜리 동적 QR로 접근을 요청하고, `buucksoo` 관리자가 기기별 요청을 승인해야 Worker가 자료를 반환합니다.

## 준비 및 배포

새 환경을 구성하거나 DB를 초기화한 경우 Worker 폴더에서 실행합니다.

```powershell
npx wrangler d1 execute daily-bible-users --remote --file training-schema.sql
npx wrangler d1 migrations apply DB --remote
npx wrangler kv key put training:westminster --binding SUBS --remote --path "<웨스트민스터 Markdown 경로>"
npx wrangler kv key put training:discipleship --binding SUBS --remote --path "<제자반 이론정리 Markdown 경로>"
npx wrangler deploy
```

원문 파일과 변환한 Markdown은 GitHub 저장소에 추가하지 마세요. Markdown 내용을 갱신할 때만 해당 KV 키에 다시 업로드합니다.

## 이용

1. Bible-reading 앱에 `buucksoo` 계정으로 로그인한 뒤 **관리 → 계정·설정 → 훈련 자료 QR · 훈련생 권한 관리**를 엽니다.
2. **동적 훈련생 QR 만들기**를 누르면 새 QR이 생성됩니다. QR은 5분 후 만료되고, 관리자 화면이 열려 있으면 만료 시 새 QR로 자동 교체됩니다.
3. 훈련생은 카메라로 QR을 스캔하고 호칭을 제출합니다. 계정 로그인은 필요하지 않습니다.
4. 대기 명단에서 열람을 허용할 자료를 선택하고 승인합니다. 승인 후에는 **범위 저장**으로 자료를 변경하거나 **권한 회수**로 해당 브라우저의 접근을 끊을 수 있습니다. 회수한 기록과 대기 요청은 명단에서 삭제할 수 있습니다.

권한은 브라우저별로 발급되므로 훈련생이 다른 브라우저나 기기로 바꾸면 다시 승인해야 합니다. 이미 화면에 전달된 자료의 복사나 사진 촬영까지 막지는 못합니다.

## 편집 및 백업

훈련생 API는 허용된 자료의 제목 목록과 요청한 단원만 반환합니다. 관리자 페이지는 열람 권한을 관리합니다. 원문 수정 및 백업은 KV 접근 권한이 있는 Cloudflare 계정에서 운영합니다. 원문 사본은 개인 저장 폴더에서 관리하고, 변경 시 위의 자료별 업로드 명령으로 갱신합니다. 백업은 Cloudflare 대시보드의 해당 KV 키 또는 로컬 원본에서 받습니다. 훈련생 브라우저에는 D1/KV 관리 자격증명을 전달하지 않습니다.

Cloudflare의 계정 멤버와 API 토큰에도 별도 접근 권한이 있을 수 있습니다. 소유자만 원문을 관리하려면 해당 멤버와 토큰 범위를 소유자 기준으로 관리해야 합니다. 이미 승인된 기기는 마이그레이션 후 기존 두 자료의 열람 권한을 이어받고, 신규 신청은 관리자가 범위를 선택합니다.
