# 기존 pair-dialogue 본문 대조 규칙

`js/features/pixel-bible/pair-dialogue.js`의 대사는 본문 사건을 바탕으로 한 가상 대화다. 검토 대기 항목을 본문과 대조해 고친다.

```bash
node tools/pixel-bible/pair-review.mjs todo <book> [장-장]   # 대기 항목 + 개역개정·쉬운성경 해당 절(출력만)
node tools/pixel-bible/pair-review.mjs apply <patch.json>    # 반영 + 검토 기록 갱신
node tools/pixel-bible/pair-review.mjs status
```

패치 형식: `{"<id>":{"result":"유지: …"|"수정: …","lines":[..],"replyLines":[..],"detail":"..."}}`
- `lines[i]`는 speaker의 말, `replyLines[i]`는 target의 답이다. 개수는 같아야 한다.
- 한 줄은 8~140자다. 항목마다 보통 2쌍을 둔다.
- 고치지 않아도 검토했으면 `"유지: 이유"`와 `result`만 적고 나머지 필드는 생략해도 된다.
- `lineDetails`가 있는 항목은 lines를 바꿀 때 lineDetails도 같은 개수로 함께 준다.

## 대조 기준 (이 순서로 확인)
1. **누가 말했나**: speaker와 target이 본문의 실제 화자·청자인가. 하나님의 선언이나 서술자의 말을 다른 사람의 말로 둔갑시키지 않았나. 화자를 바꿔야 하면 detail에 "재구성"임을 밝힌다.
2. **무슨 말이었나**: 본문에 있는 말과 사건 순서가 맞나. 본문에 없는 답이나 결과를 지어내지 않았나. 기록이 없는 반응은 서술로 두거나 detail에 "본문에 기록되지 않아 재구성"이라고 적는다.
3. **사실 확인**: 인명, 지명, 숫자, 시대(연대 순서), 관계(부자·형제·왕과 신하)가 맞나. 숫자는 한글로 쓴다("한 마리", "열흘").
4. **관계에 맞는 말투**: 왕과 신하는 존대·명령, 부모와 자녀, 선지자와 왕 등. 어색한 인사("안녕하세요")는 쓰지 않는다.
5. **쉬운 말**: 짧은 구어체로. 개역개정 문장을 길게 그대로 옮기지 않는다.
6. 이미 정확한 대사는 그대로 둔다("유지").

신학 관점은 장로교 합동 개혁주의다. 본문이 말하는 범위를 넘어 해석을 얹지 않는다.

## 주의
- git 커밋 금지. 다른 도우미의 항목은 건드리지 않는다. apply는 잠금이 있어 동시에 써도 된다.
- 패치 JSON은 Write 도구로 scratchpad에 쓴다(heredoc 금지). python은 쓰지 않고 node만 쓴다.
- 토큰을 아낀다. 파일 전체를 읽지 말고 `todo` 출력(본문 포함)만 본다. 장면이 불분명할 때만 해당 장 호크마 md를 grep한다.
