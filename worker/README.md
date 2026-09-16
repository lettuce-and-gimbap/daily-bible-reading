# 리마인드 알림 서버 (Cloudflare Worker)

매일 **한국시간 18시 · 21시 · 23시**에, 그날 통독을 마치지 않은 사람에게만 푸시 알림을 보냅니다.
Cloudflare 무료 플랜으로 충분합니다.

## 동작 방식
1. 앱(현황 → 🔔 저녁 리마인드 → 알림 켜기)이 브라우저 푸시 구독을 만들어 이 서버에 등록합니다.
2. 앱은 기록이 바뀔 때마다 "오늘 통독을 마쳤는지"만 서버에 알립니다. (읽은 장·메모 같은 기록은 보내지 않습니다.)
3. 크론 시간이 되면 서버는 오늘 마치지 않은 구독에만 **내용 없는 푸시**를 보냅니다.
4. 휴대폰의 서비스 워커(`sw.js`)가 시간대(18/21/23시)에 맞는 문구를 골라 알림을 띄웁니다.

## 처음 배포하기 (한 번만)
아래 명령은 모두 이 `worker` 폴더에서 실행합니다. Node.js가 필요합니다.

1. [Cloudflare](https://dash.cloudflare.com/sign-up)에 가입합니다(무료).
2. 로그인합니다. 브라우저가 열리면 허용을 누르세요.
   ```bash
   npx wrangler login
   ```
3. 구독을 저장할 KV를 만듭니다. 출력되는 `id`를 `wrangler.toml`의 `PUT_KV_NAMESPACE_ID_HERE` 자리에 넣습니다.
   ```bash
   npx wrangler kv namespace create SUBS
   ```
4. VAPID 키를 만듭니다. 두 값이 출력됩니다.
   ```bash
   node scripts/gen-vapid.mjs
   ```
5. 출력된 값을 비밀 값으로 등록합니다. 명령을 실행하면 값을 붙여넣으라고 나옵니다.
   ```bash
   npx wrangler secret put VAPID_PUBLIC_KEY
   ```
   ```bash
   npx wrangler secret put VAPID_PRIVATE_KEY
   ```
   비공개 키(`VAPID_PRIVATE_KEY`)는 저장소에 절대 올리지 마세요.
6. 배포합니다. 마지막에 `https://daily-bible-reminder.<아이디>.workers.dev` 주소가 나옵니다.
   ```bash
   npx wrangler deploy
   ```
7. 저장소 루트의 `js/config.js`에 그 주소를 넣고 커밋·푸시합니다.
   ```js
   const PUSH_SERVER = "https://daily-bible-reminder.<아이디>.workers.dev";
   ```

## 휴대폰에서 켜기
- **아이폰(iOS 16.4 이상)**: Safari로 사이트 열기 → 공유 버튼 → **홈 화면에 추가** → 홈 화면 아이콘으로 열기 → 현황 → **알림 켜기**.
  홈 화면 앱은 Safari와 저장 공간이 따로라서, 기존 기록은 백업 파일로 옮겨야 합니다.
- **안드로이드(크롬)**: 사이트에서 바로 켤 수 있지만, 홈 화면에 추가해 두면 앱처럼 쓰기 편합니다.
- 켠 뒤 **테스트 알림 받기**로 바로 확인할 수 있습니다.

## 운영 메모
- 알림 시간은 `wrangler.toml`의 `crons`(UTC 기준)에서 바꿉니다.
- 알림 문구는 저장소 루트 `sw.js`의 `MESSAGES`에서 바꿉니다. 서버를 다시 배포할 필요는 없습니다.
- 크론 실행 기록은 Cloudflare 대시보드 → Workers → daily-bible-reminder → Logs에서 볼 수 있습니다.
- 만료된 구독(앱 삭제, 알림 해제 등)은 보내는 중에 자동으로 지워집니다.
