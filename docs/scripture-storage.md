# 성경 본문 저장·읽기 경로

여섯 역본의 원문 DB와 권별 JSON은 저장소 밖 `/workspace/private-reference/bible`에 보관한다. 앱은 Cloudflare Worker의 `/scripture`에 권·장·역본 최대 세 개를 요청한다. Worker는 비공개 `SUBS` KV에서 해당 권을 읽고 요청한 장의 절만 응답한다. 브라우저가 읽는 장의 텍스트는 해당 사용자에게 전달되므로, 이 방식은 DB 파일의 직접 공개와 일괄 다운로드를 막는 방식이다. KV 업로드·배포가 끝나기 전에는 앱의 기존 `/bible` 중계가 임시로 본문을 공급한다.

`python tools/commentary/export-private-scripture.py`로 66개 권별 파일을 생성한다. `worker/scripts/upload-scripture.sh --check`로 파일 수를 확인하고, Cloudflare 인증 환경에서 `worker/scripts/upload-scripture.sh`로 KV에 업로드한다. 이어 `worker`에서 `npx wrangler deploy`를 실행한다. 각 역본의 창세기 1장과 요한계시록 22장을 Worker `/scripture`에서 조회해 확인한다. 현재 Cloudflare 배포 인증이 없는 환경에서는 서버 업로드·배포를 할 수 없다.

절 번호 전수 대조는 `python tools/commentary/audit-public-verses.py`로 재현할 수 있다. 결과는 [검토 목록](merged-verse-review.md)과 [CSV](scripture-verse-audit.csv)에 있다.

**기존 공개 이력:** 과거 커밋 `2078979`와 `61f001f`에는 권별 원문 JSON이 포함돼 있다. 최신 브랜치에서 파일을 지워도 Git 기록·포크·캐시의 복사본은 사라지지 않는다. 전체 DB를 다시 비공개로 만들려면 기록 재작성 및 원격 캐시 처리까지 별도 진행해야 한다.
