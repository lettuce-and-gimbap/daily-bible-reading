# 관계선 본문 대조 규칙

`data/summary/<book>.json`의 장별 `rels`(관계선)를 개역개정 본문과 대조해 고친다.

```bash
node tools/pixel-bible/rel-review.mjs todo <book> [장-장]   # 미검토 관계 + 근거 절(출력만)
node tools/pixel-bible/rel-review.mjs apply <patch.json>    # 수정 반영 + 검토 기록(docs/relation-review/<book>.json)
node tools/pixel-bible/rel-review.mjs status [book]
```

패치: `{"<KEY>":{"result":"유지: 이유"|"수정: 이유"|"삭제: 이유", ...바꿀 필드...}}`
- KEY는 `todo`가 출력한 `book|ch|from|to|label` 그대로다.
- 바꿀 필드: `label`, `directed`, `note`, `kind`, `from`, `to`, `verses`, `weight`. 고치지 않은 필드는 쓰지 않는다. 삭제는 `"delete":true`를 함께 준다.
- 고치지 않아도 검토했으면 `"result":"유지: 이유"`만 적는다(이게 검토 기록이다).

## 대조 기준
1. **방향**: 방향 있는 관계의 label은 `from` 인물의 역할이다(야발 —아들→ 라멕 = 야발은 라멕의 아들). 가족 역할인데 반대로 써 있으면 from/to를 바꾸거나 label을 고친다.
2. **관계 사실**: 두 인물이 본문에서 정말 그 관계인가(부자·형제·왕과 신하·적대·동맹). 본문에 없는 관계는 삭제하거나 근거 있는 표현으로 바꾼다. 해석이 갈리는 친족(삼촌/사촌 등)은 두 표현을 포괄하는 말로 쓴다.
3. **label이 관계를 드러내나**: "관계", "관련"처럼 모호하면 구체적으로. 주어-목적이 모호한 라벨(`끌고 간 왕`)은 `from`이 그 역할인지 확인한다.
4. **note**: 인명·지명·숫자·사건이 본문과 맞나. 숫자는 한글("한 마리", "두 지파", "열두 제자"). 맞는 설명은 그대로 둔다. 고치는 note는 기존 말투(~해요/~이에요, 쉬운 말)를 유지한다.
5. **verses**: 근거 절이 틀렸거나 비었으면 바로잡는다.
6. 하나님·예수님이 한쪽인 관계도 같은 기준이다. 신학 관점은 장로교 합동 개혁주의, 본문이 말하는 범위를 넘어 해석하지 않는다.

## 주의
- git 커밋 금지. 맡은 책만 건드린다. 원문(성경 본문)을 파일·note·기록에 옮겨 적지 않는다. note는 직접 쓴 짧은 설명이다.
- 패치 JSON은 Write 도구로 scratchpad에 쓴다(heredoc·node -e 금지, 따옴표·백슬래시가 깨진다). python은 쓰지 않는다.
- `todo`를 장 단위(예: `1-10`)로 나눠 읽고 장 단위로 apply 한다. 파일 전체를 읽지 말고 `todo` 출력(본문 포함)만 본다. 본문만으로 판단이 안 될 때만 호크마 md를 grep한다.
- 끝나면 `status <book>`이 n/n인지 확인하고, `node tools/pixel-bible/audit-relations.mjs`가 의심 0건인지 본다.
