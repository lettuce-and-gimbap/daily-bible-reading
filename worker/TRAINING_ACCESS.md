# 훈련 자료 접근 관리

훈련 자료 본문은 공개 Pages 파일에 두지 않고 Worker KV의 `training:` 키로 보관합니다. `training.html`은 자료 본문을 포함하지 않는 공개 입구입니다. 훈련생은 관리자 화면의 5분짜리 동적 QR로 접근을 요청하고, `buucksoo` 관리자가 기기별 요청을 승인해야 Worker가 자료를 반환합니다.

## 준비 및 배포

새 환경을 구성하거나 DB를 초기화한 경우 Worker 폴더에서 실행합니다.

```powershell
npx wrangler d1 execute daily-bible-users --remote --file training-schema.sql
npx wrangler kv key put training:westminster --binding SUBS --remote --path "<웨스트민스터 Markdown 경로>"
npx wrangler kv key put training:discipleship --binding SUBS --remote --path "<제자반 이론정리 Markdown 경로>"
npx wrangler deploy
```

원문 파일과 변환한 Markdown은 GitHub 저장소에 추가하지 마세요. Markdown 내용을 갱신할 때만 해당 KV 키에 다시 업로드합니다.

## 이용

1. Bible-reading 앱에 `buucksoo` 계정으로 로그인한 뒤 **관리 → 계정·설정 → 훈련 자료 QR · 훈련생 권한 관리**를 엽니다.
2. **동적 훈련생 QR 만들기**를 누르면 새 QR이 생성됩니다. QR은 5분 후 만료되고, 관리자 화면이 열려 있으면 만료 시 새 QR로 자동 교체됩니다.
3. 훈련생은 카메라로 QR을 스캔하고 호칭을 제출합니다. 계정 로그인은 필요하지 않습니다.
4. 관리자가 대기 명단에서 해당 기기를 승인하면 자료가 열립니다. 승인된 명단에서 권한을 회수할 수 있습니다.

권한은 브라우저별로 발급되므로 훈련생이 다른 브라우저나 기기로 바꾸면 다시 승인해야 합니다. 이미 화면에 전달된 자료의 복사나 사진 촬영까지 막지는 못합니다.
