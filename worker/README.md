# 리마인드 알림 서버 (Cloudflare Worker)

매일 **한국시간 9~12시 중 랜덤 한 번, 15~18시 중 랜덤 한 번, 18시 · 21시 · 23시**에, 그날 통독을 마치지 않은 사람에게만 푸시 알림을 보냅니다.
랜덤 시각은 구독 id와 날짜로 정해져 사람마다·날마다 다릅니다(5분 단위).
Cloudflare 무료 플랜으로 충분합니다.

## 동작 방식
1. 앱(현황 → 🔔 저녁 리마인드 → 알림 켜기)이 브라우저 푸시 구독을 만들어 이 서버에 등록합니다.
2. 앱은 기록이 바뀔 때마다 "오늘 통독을 마쳤는지"만 서버에 알립니다. (읽은 장·메모 같은 기록은 보내지 않습니다.)
3. 크론 시간이 되면 서버는 오늘 마치지 않은 구독에만 **내용 없는 푸시**를 보냅니다.
4. 휴대폰의 서비스 워커(`sw.js`)가 시간대(오전/오후/18/21/23시)에 맞는 문구를 골라 알림을 띄웁니다.

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
7. 저장소 루트의 `js/core/config.js`에 그 주소를 넣고 커밋·푸시합니다.
   ```js
   const PUSH_SERVER = "https://daily-bible-reminder.<아이디>.workers.dev";
   ```

## 오늘 분량 요약 켜기 (선택)
앱의 ✨ 요약 패널(주요 등장 인물 · 쉬운 이야기 · 추천 찬양)은 이 서버가 Google Gemini API로 만들어 줍니다. 무료 키로 쓸 수 있고, 이 기능만 별도 설정이 필요합니다.

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 구글 계정으로 로그인해 **Create API key**로 키를 만듭니다(카드 등록 없이 무료 등급 사용).
2. 이 `worker` 폴더에서 비밀 값으로 등록합니다. 키 등록은 다시 배포하지 않아도 바로 적용됩니다. (Windows PowerShell에서 `npx`가 막히면 `npx.cmd`로 실행)
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```
3. 앱에서 ✨를 누르면 처음 한 번 5~20초쯤 걸려 요약이 만들어집니다. 같은 분량은 KV(`sum:v3:…`)에 저장돼 모든 사용자가 나눠 쓰므로 호출은 처음 한 번만 합니다.

- 키를 등록하지 않으면 요약 패널에 "요약 기능이 아직 켜지지 않았어요"가 나오고, 다른 기능에는 영향이 없습니다.
- 모델은 기본 `gemini-3.8-flash`입니다. 바꾸려면 `wrangler.toml`의 `[vars]`에 `SUMMARY_MODEL = "…"`을 넣습니다.
- 무료 등급에는 분당·하루 호출 한도가 있고 Google이 바꿀 수 있습니다. 한도를 넘으면 "요약 서버가 바빠요"가 나오고 다음 날 다시 됩니다.
- 보호 장치: 하루에 새로 만드는 요약은 최대 200개(`SUMMARY_DAILY_CAP`으로 조절)이고, 허용된 사이트 주소에서 온 요청만 새로 만듭니다.
- 한 번에 요약하는 분량은 최대 30장입니다.

## 휴대폰에서 켜기
- **아이폰(iOS 16.4 이상)**: Safari로 사이트 열기 → 공유 버튼 → **홈 화면에 추가** → 홈 화면 아이콘으로 열기 → 현황 → **알림 켜기**.
  홈 화면 앱은 Safari와 저장 공간이 따로라서, 기존 기록은 백업 파일로 옮겨야 합니다.
- **안드로이드(크롬)**: 사이트에서 바로 켤 수 있지만, 홈 화면에 추가해 두면 앱처럼 쓰기 편합니다.
- 켠 뒤 **테스트 알림 받기**로 바로 확인할 수 있습니다.

## 운영 메모
- 알림 시간은 `wrangler.toml`의 `crons`(UTC 기준)에서 바꿉니다. 랜덤 구간을 바꾸면 `src/index.js`의 `RANDOM_WINDOWS`도 같이 맞춰 주세요.
- 알림 문구는 저장소 루트 `sw.js`의 `MESSAGES`에서 바꿉니다. 서버를 다시 배포할 필요는 없습니다.
- 크론 실행 기록은 Cloudflare 대시보드 → Workers → daily-bible-reminder → Logs에서 볼 수 있습니다.
- 만료된 구독(앱 삭제, 알림 해제 등)은 보내는 중에 자동으로 지워집니다.
