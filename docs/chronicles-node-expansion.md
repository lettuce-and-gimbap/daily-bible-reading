# 역대상·하 노드 대상 데이터 확장

기존 왕실 중심 정리를 UI 노드로 옮길 수 있도록 확장했다. 앱 화면을 새로 표시하는 변경은 아니며, 인물·관계 데이터와 연결 규칙을 준비한 것이다.

## 반영 범위

- 노드 341개: 인물 324, 집단 16, 신적 발화 대상 1. 서술자는 개인 노드로 생성하지 않았다.
- 관계 332개. 기존 발화 109행의 노드 연결을 모두 제공했다.
- 기존 23명의 왕 평가는 chronicles-guide.json의 ruler ID를 참조한다. 같은 내용을 두 파일에서 따로 편집하지 않는다.
- 확인이 필요한 관계·동일인 판정 8건은 별도로 남겼다.
- 모든 계보 이름을 전수 전사한 완성 가계도는 아니다. 선별한 계보의 실제 연결과 왕실·발화 연결을 우선 확장했다.

## 확장한 가지

1. 아담–이스라엘과 유다–다윗의 줄기, 열두 지파의 조상 및 선택한 방계.
2. 다윗의 자녀와 어머니들, 다윗의 자매와 스루야·아비가일의 자녀.
3. 다윗 왕실의 혈통과 별도로 저장한 왕위 계승선, 아달랴·여호사브앗·여호야다의 보호·후견 관계.
4. 포로 이후 여고냐·브다야·스룹바벨 가계의 명확한 부분.
5. 레위 세 갈래와 아론 제사장 계보, 헤만·아삽·에단의 찬양 계열.
6. 사울–요나단–므립바알 계열과 후손, 여이엘 가문·베냐민 방계.
7. 북이스라엘 왕, 에돔의 여덟 왕, 주변국의 주요 왕과 성전 기술자 후람아비.
8. 선지자·제사장·집단 발화 대상과 왕에 대한 메시지·조언·거부 관계.

## 관계 유형

| 유형 | 개수 | 의미 |
|---|---|---|
| `parent_child` | 267 | 본문 계보의 부모→자녀 방향. 모든 세대가 생략 없이 생물학적으로 직접 연결된다는 보증은 아님 |
| `marriage` | 5 | 혼인 관계 |
| `sibling` | 2 | 형제자매 관계; 양방향 의미 |
| `royal_succession` | 29 | 왕위 계승; 혈연 아님 |
| `grandparent_descendant` | 2 | 명시된 조부모·손자녀 관계 |
| `protects` | 1 | 보호 행동 |
| `guides` | 1 | 후견·가르침 |
| `message_to` | 22 | 말씀·경고 전달; 전달자의 주장이 곧 하나님의 승인이라는 뜻은 아님 |
| `advises` | 2 | 사람의 조언; 권위·내용은 사건별 구분 |
| `rejects_warning` | 1 | 책망을 거절한 행위 |

## 자료를 사용할 때

- `node.id`로 연결한다. 이름은 표시용이며 동명이인 결합 키로 쓰지 않는다.
- `disambiguation`은 이름이 같은 노드에 붙는 문맥 배지다. 제사장 계보의 반복 이름은 세대별 ID를 사용했다.
- 다윗 자녀 목록의 엘리사마·엘리벨렛 반복은 출현별로 나누되, 실제로 별개 인물이라는 최종 판정을 한 것은 아니다. `identityStatus`를 보존한다.
- `sourceNames`는 이 두 권의 해당 문맥에서 확인한 역본 표기 대응이다. 예: 밧수아/밧세바, 그핫/고핫, 갈미/가르미, 아갈/아간. 다른 곳의 같은 이름을 자동 병합하는 규칙이 아니다.
- `parent_child`는 본문 계보의 부모→자녀 방향이다. 성경 족보에서 생략 세대가 있을 가능성까지 없다고 보증하지 않는다.
- `royal_succession`을 부모 간선으로 변환하지 않는다. 특히 사울→다윗, 아달랴→요아스, 요시야 이후 왕들에 적용한다.
- 므낫세 기도·내레이션·편지·대언의 직접 인용 여부는 `speakerLinks.sourceNote`와 기존 발화 검토를 함께 확인한다.
- 말씀 전달 관계가 있다고 전달자의 모든 주장이 하나님의 승인이라는 뜻은 아니다. 거짓 예언·인간적 조언과 반응을 구분한다.
- 장소나 족속을 모두 개인으로 바꾸지 않도록, 이번에는 관계가 명확한 인물·집단과 신적 발화 대상을 우선 수록했다.

## 별도 검토 항목

- 아들 표현과 왕위 계승 표현이 다름; 두 시드기야 이름을 자동 병합하지 않음 (역대상 3:15-16, 역대하 36:10)
- 마아가/미가야 표기와 왕대비·어머니 호칭의 세대 문제 (역대하 11:20, 역대하 13:2, 역대하 15:16)
- 살룸과 여호아하스의 동일시를 두 권의 직접 개명 기록으로 확정할 수 없음 (역대상 3:15, 역대하 36:1-4)
- 후손 배열·여섯 명의 묶음 범위가 두 역본에서 다르게 풀림 (역대상 3:21-22)
- 슬로밋의 누이 관계 표현과 연결 범위를 표시할 필요 (역대상 3:19)
- 동일 이름만으로 제사장 계보의 힐기야와 요시야 시대 인물을 자동 병합하지 않음 (역대상 6:13, 역대하 34:14)
- 불과 디글랏빌레셀의 동일시는 두 권 외의 역사 자료를 대조할 때 검토. 이 데이터에서 이름만으로 병합하지 않음 (역대상 5:26, 역대하 28:20)
- 엘리사마·엘리벨렛의 반복은 출현별 노드로 보존. 실제로 별개인 두 사람인지 자동 판정하지 않음 (역대상 3:6, 역대상 3:8)

## 대조와 검사

근거는 역대상·하의 개역개정 4판·쉬운성경 보관 자료다. 관계 범위와 반복 이름을 확인하며 인칭대명사의 선행 구절도 근거 범위에 포함했다. 원문 사본은 공개 파일에 포함하지 않는다. 다른 권으로 모호한 관계를 덮어쓰지 않았다.

전산 검사는 고유 ID, 연결 대상 존재, 두 권 안의 근거 형식, 서술자 분리, 발화 109행 연결, 왕 평가 23건 참조, 친자 계보 순환 여부를 확인한다. 구조 검사 통과가 모든 해석 문제의 해결을 뜻하지는 않는다.

## 전체 노드 목록

| ID | 표시 이름 | 유형·역할 | 근거 |
|---|---|---|---|
| `ancestor-1` | 아담 | person /  | 역대상 1:1-34 |
| `ancestor-2` | 셋 | person /  | 역대상 1:1-34 |
| `ancestor-3` | 에노스 | person /  | 역대상 1:1-34 |
| `ancestor-4` | 게난 | person /  | 역대상 1:1-34 |
| `ancestor-5` | 마할랄렐 | person /  | 역대상 1:1-34 |
| `ancestor-6` | 야렛 | person /  | 역대상 1:1-34 |
| `ancestor-7` | 에녹 | person /  | 역대상 1:1-34 |
| `ancestor-8` | 므두셀라 | person /  | 역대상 1:1-34 |
| `ancestor-9` | 라멕 | person /  | 역대상 1:1-34 |
| `ancestor-10` | 노아 | person /  | 역대상 1:1-34 |
| `ancestor-11` | 셈 | person /  | 역대상 1:1-34 |
| `ancestor-12` | 아르박삿 | person /  | 역대상 1:1-34 |
| `ancestor-13` | 셀라 | person /  | 역대상 1:1-34 |
| `ancestor-14` | 에벨 | person /  | 역대상 1:1-34 |
| `ancestor-15` | 벨렉 | person /  | 역대상 1:1-34 |
| `ancestor-16` | 르우 | person /  | 역대상 1:1-34 |
| `ancestor-17` | 스룩 | person /  | 역대상 1:1-34 |
| `ancestor-18` | 나홀 | person /  | 역대상 1:1-34 |
| `ancestor-19` | 데라 | person /  | 역대상 1:1-34 |
| `ancestor-20` | 아브라함 | person /  | 역대상 1:1-34 |
| `ancestor-21` | 이삭 | person /  | 역대상 1:1-34 |
| `ancestor-22` | 이스라엘 | person / 찬양 담당자의 계보 | 역대상 1:1-34 · 역대상 6:38 |
| `ancestor-23` | 유다 | person / 지파의 조상 | 역대상 2:4-15 · 역대상 2:1-2 |
| `ancestor-24` | 베레스 | person /  | 역대상 2:4-15 |
| `ancestor-25` | 헤스론 | person /  | 역대상 2:4-15 |
| `ancestor-26` | 람 | person /  | 역대상 2:4-15 |
| `ancestor-27` | 암미나답 | person /  | 역대상 2:4-15 |
| `ancestor-28` | 나손 | person /  | 역대상 2:4-15 |
| `ancestor-29` | 살마 | person /  | 역대상 2:4-15 |
| `ancestor-30` | 보아스 | person /  | 역대상 2:4-15 |
| `ancestor-31` | 오벳 | person /  | 역대상 2:4-15 |
| `ancestor-32` | 이새 | person /  | 역대상 2:4-15 |
| `ancestor-33` | 다윗 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 2:4-15 · 역대상 14:2 · 역대상 17:1 · 역대상 28:1-21 · 역대상 29:10-20 · 역대상 21:1-24 · 역대상 12:16-17 · 역대상 14:8-17 · 역대상 16:7-36 · 역대상 19:1-5 · 역대상 13:1-14 · 역대상 15:1-29 · 역대상 17:16-27 · 역대상 22:5-19 · 역대상 11:5-6 · 역대상 11:15-19 · 역대상 23:25-27 |
| `ruler-saul` | 사울 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 9:39 · 역대상 10:4 |
| `ruler-solomon` | 솔로몬 | person / 통치자 · 다윗의 아들 · 본문 기반 발화의 표시 대상 | 역대상 3:5 · 역대하 6:1-42 · 역대하 1:7-12 · 역대하 8:11 |
| `ruler-rehoboam` | 르호보암 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 3:10 · 역대하 10:6-14 |
| `ruler-abijah` | 아비야 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 3:10 · 역대하 13:4-12 |
| `ruler-asa` | 아사 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 3:10 · 역대하 14:7-11 · 역대하 16:2-3 |
| `ruler-jehoshaphat` | 여호사밧 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 3:10 · 역대하 17:7-9 · 역대하 19:6-11 · 역대하 18:3-7 · 역대하 20:5-12 · 역대하 20:20 |
| `ruler-jehoram-judah` | 여호람 | person / 통치자 | 역대상 3:11 |
| `ruler-ahaziah-judah` | 아하시야 | person / 통치자 | 역대상 3:11 |
| `ruler-athaliah` | 아달랴 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대하 21:6 · 역대하 23:13 |
| `ruler-joash-judah` | 요아스 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 3:11 · 역대하 24:5-6 |
| `ruler-amaziah` | 아마샤 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 3:12 · 역대하 25:9 · 역대하 25:15-19 |
| `ruler-uzziah` | 웃시야 | person / 통치자 | 역대상 3:12 |
| `ruler-jotham` | 요담 | person / 통치자 | 역대상 3:12 |
| `ruler-ahaz` | 아하스 | person / 통치자 | 역대상 3:13 |
| `ruler-hezekiah` | 히스기야 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 3:13 · 역대하 29:5-11 · 역대하 29:31 · 역대하 30:1-9 · 역대하 30:18-20 · 역대하 30:22 · 역대하 32:6-8 · 역대하 31:9-11 |
| `ruler-manasseh` | 므낫세 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 3:13 · 역대하 33:12-13 |
| `ruler-amon` | 아몬 | person / 통치자 | 역대상 3:14 |
| `ruler-josiah` | 요시야 | person / 통치자 · 본문 기반 발화의 표시 대상 | 역대상 3:14-15 · 역대하 34:14-28 · 역대하 34:20-21 · 역대하 34:29-33 · 역대하 35:3-6 · 역대하 35:23 |
| `ruler-jehoahaz` | 여호아하스 | person / 통치자 | 역대하 36:1-4 · 역대하 36:1 |
| `ruler-jehoiakim` | 여호야김 | person / 통치자 | 역대상 3:15-16 · 역대상 3:15 |
| `ruler-jehoiachin` | 여호야긴 | person / 통치자 | 역대상 3:16-17 |
| `ruler-zedekiah` | 시드기야 | person / 통치자 | 역대상 3:15 |
| `tribe-ancestor-1` | 르우벤 | person / 지파의 조상 | 역대상 2:1-2 |
| `tribe-ancestor-2` | 시므온 | person / 지파의 조상 | 역대상 2:1-2 |
| `tribe-ancestor-3` | 레위 | person / 지파의 조상 · 찬양 담당자의 계보 | 역대상 2:1-2 · 역대상 6:38 · 역대상 6:43 · 역대상 6:47 |
| `tribe-ancestor-5` | 잇사갈 | person / 지파의 조상 | 역대상 2:1-2 |
| `tribe-ancestor-6` | 스불론 | person / 지파의 조상 | 역대상 2:1-2 |
| `tribe-ancestor-7` | 단 | person / 지파의 조상 | 역대상 2:1-2 |
| `tribe-ancestor-8` | 요셉 | person / 지파의 조상 | 역대상 2:1-2 |
| `tribe-ancestor-9` | 베냐민 | person / 지파의 조상 | 역대상 2:1-2 |
| `tribe-ancestor-10` | 납달리 | person / 지파의 조상 | 역대상 2:1-2 |
| `tribe-ancestor-11` | 갓 | person / 지파의 조상 | 역대상 2:1-2 |
| `tribe-ancestor-12` | 아셀 | person / 지파의 조상 | 역대상 2:1-2 |
| `ishmael` | 이스마엘 | person /  | 역대상 1:28 |
| `esau` | 에서 | person /  | 역대상 1:34 |
| `judah-son-에르` | 에르 | person /  | 역대상 2:3-4 |
| `judah-son-오난` | 오난 | person /  | 역대상 2:3-4 |
| `judah-son-셀라` | 셀라 | person /  | 역대상 2:3-4 |
| `judah-son-세라` | 세라 | person /  | 역대상 2:3-4 |
| `hamul` | 하물 | person /  | 역대상 2:5 |
| `hezron-son-여라므엘` | 여라므엘 | person /  | 역대상 2:9 |
| `hezron-son-글루배` | 글루배 | person /  | 역대상 2:9 |
| `jesse-son-엘리압` | 엘리압 | person /  | 역대상 2:13-15 |
| `jesse-son-아비나답` | 아비나답 | person /  | 역대상 2:13-15 |
| `jesse-son-시므아` | 시므아 | person /  | 역대상 2:13-15 |
| `jesse-son-느다넬` | 느다넬 | person /  | 역대상 2:13-15 |
| `jesse-son-랏대` | 랏대 | person /  | 역대상 2:13-15 |
| `jesse-son-오셈` | 오셈 | person /  | 역대상 2:13-15 |
| `david-son-암논` | 암논 | person /  | 역대상 3:1 |
| `david-wife-아히노암` | 아히노암 | person / 다윗 자녀의 어머니 | 역대상 3:1 |
| `david-son-다니엘` | 다니엘 | person /  | 역대상 3:1 |
| `david-wife-아비가일` | 아비가일 | person / 다윗 자녀의 어머니 | 역대상 3:1 |
| `david-son-압살롬` | 압살롬 | person /  | 역대상 3:2 |
| `david-wife-마아가` | 마아가 | person / 다윗 자녀의 어머니 | 역대상 3:2 |
| `david-son-아도니야` | 아도니야 | person /  | 역대상 3:2 |
| `david-wife-학깃` | 학깃 | person / 다윗 자녀의 어머니 | 역대상 3:2 |
| `david-son-스바댜` | 스바댜 | person /  | 역대상 3:3 |
| `david-wife-아비달` | 아비달 | person / 다윗 자녀의 어머니 | 역대상 3:3 |
| `david-son-이드르암` | 이드르암 | person /  | 역대상 3:3 |
| `david-wife-에글라` | 에글라 | person / 다윗 자녀의 어머니 | 역대상 3:3 |
| `bathshua` | 밧수아 | person / 암미엘의 딸 | 역대상 3:5 |
| `ammiel-bathshua` | 암미엘 | person /  | 역대상 3:5 |
| `david-jerusalem-son-시므아` | 시므아 | person / 다윗의 아들 | 역대상 3:5 |
| `david-jerusalem-son-소밥` | 소밥 | person / 다윗의 아들 | 역대상 3:5 |
| `david-jerusalem-son-나단` | 나단 | person / 다윗의 아들 | 역대상 3:5 |
| `david-son-6-입할` | 입할 | person /  | 역대상 3:6 |
| `david-son-6-엘리사마` | 엘리사마 | person /  | 역대상 3:6 |
| `david-son-6-엘리벨렛` | 엘리벨렛 | person /  | 역대상 3:6 |
| `david-son-7-노가` | 노가 | person /  | 역대상 3:7 |
| `david-son-7-네벡` | 네벡 | person /  | 역대상 3:7 |
| `david-son-7-야비아` | 야비아 | person /  | 역대상 3:7 |
| `david-son-8-엘리사마` | 엘리사마 | person /  | 역대상 3:8 |
| `david-son-8-엘랴다` | 엘랴다 | person /  | 역대상 3:8 |
| `david-son-8-엘리벨렛` | 엘리벨렛 | person /  | 역대상 3:8 |
| `tamar-david` | 다말 | person / 다윗의 딸 | 역대상 3:9 |
| `zeruiah` | 스루야 | person / 다윗의 자매 | 역대상 2:16 |
| `abigail-sister-david` | 아비가일 | person / 다윗의 자매 | 역대상 2:16-17 |
| `zeruiah-son-아비새` | 아비새 | person /  | 역대상 2:16 |
| `zeruiah-son-요압` | 요압 | person /  | 역대상 2:16 |
| `zeruiah-son-아사헬` | 아사헬 | person /  | 역대상 2:16 |
| `amasa` | 아마사 | person /  | 역대상 2:17 |
| `jether-amasa` | 예델 | person / 이스마엘 사람 | 역대상 2:17 |
| `johanan-josiah` | 요하난 | person /  | 역대상 3:15 |
| `shallum-josiah` | 살룸 | person /  | 역대상 3:15 |
| `omri` | 오므리 | person / 북이스라엘 왕실 | 역대하 22:2 |
| `jehoshabeath` | 여호사브앗 | person / 요아스를 보호한 왕녀 | 역대하 22:11 |
| `jehoiada` | 여호야다 | person / 제사장 · 본문 기반 발화의 표시 대상 | 역대하 22:11 · 역대하 23:3-7 · 역대하 23:14-20 |
| `exile-son-스알디엘` | 스알디엘 | person /  | 역대상 3:17-18 |
| `exile-son-말기람` | 말기람 | person /  | 역대상 3:17-18 |
| `exile-son-브다야` | 브다야 | person /  | 역대상 3:17-18 |
| `exile-son-세낫살` | 세낫살 | person /  | 역대상 3:17-18 |
| `exile-son-여가먀` | 여가먀 | person /  | 역대상 3:17-18 |
| `exile-son-호사마` | 호사마 | person /  | 역대상 3:17-18 |
| `exile-son-느다뱌` | 느다뱌 | person /  | 역대상 3:17-18 |
| `pedaiah-son-스룹바벨` | 스룹바벨 | person /  | 역대상 3:19 |
| `pedaiah-son-시므이` | 시므이 | person /  | 역대상 3:19 |
| `zerubbabel-son-므술람` | 므술람 | person /  | 역대상 3:19 |
| `zerubbabel-son-하나냐` | 하나냐 | person /  | 역대상 3:19 |
| `zerubbabel-son-하수바` | 하수바 | person /  | 역대상 3:20 |
| `zerubbabel-son-오헬` | 오헬 | person /  | 역대상 3:20 |
| `zerubbabel-son-베레갸` | 베레갸 | person /  | 역대상 3:20 |
| `zerubbabel-son-하사댜` | 하사댜 | person /  | 역대상 3:20 |
| `zerubbabel-son-유삽헤셋` | 유삽헤셋 | person /  | 역대상 3:20 |
| `gershon` | 게르손 | person / 찬양 담당자의 계보 | 역대상 6:1 · 역대상 6:43 |
| `kohath` | 그핫 | person / 찬양 담당자의 계보 | 역대상 6:1 · 역대상 6:38 |
| `merari` | 므라리 | person / 찬양 담당자의 계보 | 역대상 6:1 · 역대상 6:47 |
| `kohath-son-아므람` | 아므람 | person /  | 역대상 6:2 |
| `kohath-son-이스할` | 이스할 | person / 찬양 담당자의 계보 | 역대상 6:2 · 역대상 6:38 |
| `kohath-son-헤브론` | 헤브론 | person /  | 역대상 6:2 |
| `kohath-son-웃시엘` | 웃시엘 | person /  | 역대상 6:2 |
| `amram-child-아론` | 아론 | person /  | 역대상 6:3 |
| `amram-child-모세` | 모세 | person /  | 역대상 6:3 |
| `amram-child-미리암` | 미리암 | person /  | 역대상 6:3 |
| `aaron-son-나답` | 나답 | person /  | 역대상 6:3 |
| `aaron-son-아비후` | 아비후 | person /  | 역대상 6:3 |
| `aaron-son-엘르아살` | 엘르아살 | person /  | 역대상 6:3 |
| `aaron-son-이다말` | 이다말 | person /  | 역대상 6:3 |
| `priest-line-1` | 비느하스 | person / 아론 계열 제사장 계보 | 역대상 6:4 |
| `priest-line-2` | 아비수아 | person / 아론 계열 제사장 계보 | 역대상 6:4 |
| `priest-line-3` | 북기 | person / 아론 계열 제사장 계보 | 역대상 6:5 |
| `priest-line-4` | 웃시 | person / 아론 계열 제사장 계보 | 역대상 6:5 |
| `priest-line-5` | 스라히야 | person / 아론 계열 제사장 계보 | 역대상 6:6 |
| `priest-line-6` | 므라욧 | person / 아론 계열 제사장 계보 | 역대상 6:6 |
| `priest-line-7` | 아마랴 | person / 아론 계열 제사장 계보 | 역대상 6:7 |
| `priest-line-8` | 아히둡 | person / 아론 계열 제사장 계보 | 역대상 6:7 |
| `priest-line-9` | 사독 | person / 아론 계열 제사장 계보 | 역대상 6:8 |
| `priest-line-10` | 아히마아스 | person / 아론 계열 제사장 계보 | 역대상 6:8 |
| `priest-line-11` | 아사랴 | person / 아론 계열 제사장 계보 | 역대상 6:9 |
| `priest-line-12` | 요하난 | person / 아론 계열 제사장 계보 | 역대상 6:9 |
| `priest-line-13` | 아사랴 | person / 아론 계열 제사장 계보 | 역대상 6:10 |
| `priest-line-14` | 아마랴 | person / 아론 계열 제사장 계보 | 역대상 6:11 |
| `priest-line-15` | 아히둡 | person / 아론 계열 제사장 계보 | 역대상 6:11 |
| `priest-line-16` | 사독 | person / 아론 계열 제사장 계보 | 역대상 6:12 |
| `priest-line-17` | 살룸 | person / 아론 계열 제사장 계보 | 역대상 6:12 |
| `priest-line-18` | 힐기야 | person / 아론 계열 제사장 계보 | 역대상 6:13 |
| `priest-line-19` | 아사랴 | person / 아론 계열 제사장 계보 | 역대상 6:13 |
| `priest-line-20` | 스라야 | person / 아론 계열 제사장 계보 | 역대상 6:14 |
| `priest-line-21` | 여호사닥 | person / 아론 계열 제사장 계보 | 역대상 6:14 |
| `music-heman-0` | 헤만 | person / 찬양 담당 | 역대상 6:33 |
| `music-heman-1` | 요엘 | person / 찬양 담당자의 계보 | 역대상 6:33 |
| `music-heman-2` | 사무엘 | person / 찬양 담당자의 계보 | 역대상 6:34 |
| `music-heman-3` | 엘가나 | person / 찬양 담당자의 계보 | 역대상 6:34 |
| `music-heman-4` | 여로함 | person / 찬양 담당자의 계보 | 역대상 6:34 |
| `music-heman-5` | 엘리엘 | person / 찬양 담당자의 계보 | 역대상 6:34 |
| `music-heman-6` | 도아 | person / 찬양 담당자의 계보 | 역대상 6:35 |
| `music-heman-7` | 숩 | person / 찬양 담당자의 계보 | 역대상 6:35 |
| `music-heman-8` | 엘가나 | person / 찬양 담당자의 계보 | 역대상 6:35 |
| `music-heman-9` | 마핫 | person / 찬양 담당자의 계보 | 역대상 6:35 |
| `music-heman-10` | 아마새 | person / 찬양 담당자의 계보 | 역대상 6:36 |
| `music-heman-11` | 엘가나 | person / 찬양 담당자의 계보 | 역대상 6:36 |
| `music-heman-12` | 요엘 | person / 찬양 담당자의 계보 | 역대상 6:36 |
| `music-heman-13` | 아사랴 | person / 찬양 담당자의 계보 | 역대상 6:36 |
| `music-heman-14` | 스바냐 | person / 찬양 담당자의 계보 | 역대상 6:37 |
| `music-heman-15` | 다핫 | person / 찬양 담당자의 계보 | 역대상 6:37 |
| `music-heman-16` | 앗실 | person / 찬양 담당자의 계보 | 역대상 6:37 |
| `music-heman-17` | 에비아삽 | person / 찬양 담당자의 계보 | 역대상 6:37 |
| `music-heman-18` | 고라 | person / 찬양 담당자의 계보 | 역대상 6:38 |
| `music-asaph-0` | 아삽 | person / 찬양 담당 | 역대상 6:39 |
| `music-asaph-1` | 베레갸 | person / 찬양 담당자의 계보 | 역대상 6:39 |
| `music-asaph-2` | 시므아 | person / 찬양 담당자의 계보 | 역대상 6:40 |
| `music-asaph-3` | 미가엘 | person / 찬양 담당자의 계보 | 역대상 6:40 |
| `music-asaph-4` | 바아세야 | person / 찬양 담당자의 계보 | 역대상 6:40 |
| `music-asaph-5` | 말기야 | person / 찬양 담당자의 계보 | 역대상 6:41 |
| `music-asaph-6` | 에드니 | person / 찬양 담당자의 계보 | 역대상 6:41 |
| `music-asaph-7` | 세라 | person / 찬양 담당자의 계보 | 역대상 6:41 |
| `music-asaph-8` | 아다야 | person / 찬양 담당자의 계보 | 역대상 6:42 |
| `music-asaph-9` | 에단 | person / 찬양 담당자의 계보 | 역대상 6:42 |
| `music-asaph-10` | 심마 | person / 찬양 담당자의 계보 | 역대상 6:42 |
| `music-asaph-11` | 시므이 | person / 찬양 담당자의 계보 | 역대상 6:43 |
| `music-asaph-12` | 야핫 | person / 찬양 담당자의 계보 | 역대상 6:43 |
| `music-ethan-0` | 에단 | person / 찬양 담당 | 역대상 6:44 |
| `music-ethan-1` | 기시 | person / 찬양 담당자의 계보 | 역대상 6:44 |
| `music-ethan-2` | 압디 | person / 찬양 담당자의 계보 | 역대상 6:44 |
| `music-ethan-3` | 말룩 | person / 찬양 담당자의 계보 | 역대상 6:45 |
| `music-ethan-4` | 하사뱌 | person / 찬양 담당자의 계보 | 역대상 6:45 |
| `music-ethan-5` | 아마시야 | person / 찬양 담당자의 계보 | 역대상 6:45 |
| `music-ethan-6` | 힐기야 | person / 찬양 담당자의 계보 | 역대상 6:46 |
| `music-ethan-7` | 암시 | person / 찬양 담당자의 계보 | 역대상 6:46 |
| `music-ethan-8` | 바니 | person / 찬양 담당자의 계보 | 역대상 6:46 |
| `music-ethan-9` | 세멜 | person / 찬양 담당자의 계보 | 역대상 6:47 |
| `music-ethan-10` | 말리 | person / 찬양 담당자의 계보 | 역대상 6:47 |
| `music-ethan-11` | 무시 | person / 찬양 담당자의 계보 | 역대상 6:47 |
| `jeiel-gibeon` | 여이엘 | person / 기브온의 조상 | 역대상 9:35 |
| `maacah-jeiel` | 마아가 | person / 여이엘의 아내 | 역대상 9:35 |
| `jeiel-son-압돈` | 압돈 | person /  | 역대상 9:36-37 |
| `jeiel-son-술` | 술 | person /  | 역대상 9:36-37 |
| `jeiel-son-기스` | 기스 | person /  | 역대상 9:36-37 |
| `jeiel-son-바알` | 바알 | person /  | 역대상 9:36-37 |
| `jeiel-son-넬` | 넬 | person /  | 역대상 9:36-37 |
| `jeiel-son-나답` | 나답 | person /  | 역대상 9:36-37 |
| `jeiel-son-그돌` | 그돌 | person /  | 역대상 9:36-37 |
| `jeiel-son-아히오` | 아히오 | person /  | 역대상 9:36-37 |
| `jeiel-son-스가랴` | 스가랴 | person /  | 역대상 9:36-37 |
| `jeiel-son-미글롯` | 미글롯 | person /  | 역대상 9:36-37 |
| `shimeam` | 시므암 | person /  | 역대상 9:38 |
| `kish-saul-father` | 기스 | person /  | 역대상 9:39 |
| `saul-son-요나단` | 요나단 | person /  | 역대상 9:39 |
| `saul-son-말기수아` | 말기수아 | person /  | 역대상 9:39 |
| `saul-son-아비나답` | 아비나답 | person /  | 역대상 9:39 |
| `saul-son-에스바알` | 에스바알 | person /  | 역대상 9:39 |
| `saul-descendant-0` | 므립바알 | person /  | 역대상 9:40 |
| `saul-descendant-1` | 미가 | person /  | 역대상 9:40 |
| `micah-son-비돈` | 비돈 | person /  | 역대상 9:41 |
| `micah-son-멜렉` | 멜렉 | person /  | 역대상 9:41 |
| `micah-son-다레아` | 다레아 | person /  | 역대상 9:41 |
| `micah-son-아하스` | 아하스 | person /  | 역대상 9:41 |
| `saul-yarah-0` | 야라 | person /  | 역대상 9:42 |
| `saul-yarah-1` | 알레멧 | person /  | 역대상 9:42 |
| `yarah-son-아스마웻` | 아스마웻 | person /  | 역대상 9:42 |
| `yarah-son-시므리` | 시므리 | person /  | 역대상 9:42 |
| `saul-later-0` | 모사 | person /  | 역대상 9:42-44 |
| `saul-later-1` | 비느아 | person /  | 역대상 9:42-44 |
| `saul-later-2` | 르바야 | person /  | 역대상 9:42-44 |
| `saul-later-3` | 엘르아사 | person /  | 역대상 9:42-44 |
| `saul-later-4` | 아셀 | person /  | 역대상 9:42-44 |
| `azel-son-아스리감` | 아스리감 | person /  | 역대상 9:44 |
| `azel-son-보그루` | 보그루 | person /  | 역대상 9:44 |
| `azel-son-이스마엘` | 이스마엘 | person /  | 역대상 9:44 |
| `azel-son-스아랴` | 스아랴 | person /  | 역대상 9:44 |
| `azel-son-오바댜` | 오바댜 | person /  | 역대상 9:44 |
| `azel-son-하난` | 하난 | person /  | 역대상 9:44 |
| `benjamin-son-벨라` | 벨라 | person /  | 역대상 8:1-2 |
| `benjamin-son-아스벨` | 아스벨 | person /  | 역대상 8:1-2 |
| `benjamin-son-아하라` | 아하라 | person /  | 역대상 8:1-2 |
| `benjamin-son-노하` | 노하 | person /  | 역대상 8:1-2 |
| `benjamin-son-라바` | 라바 | person /  | 역대상 8:1-2 |
| `speaker-764ed3d6a850` | 나단 | person / 본문 기반 발화의 표시 대상 | 역대상 17:2 · 역대상 17:4-15 |
| `speaker-7fd690f13fe9` | 레위인들 | group / 본문 기반 발화의 표시 대상 | 역대하 29:18-19 |
| `speaker-86c809d044bf` | 산헤립의 신하들 | group / 본문 기반 발화의 표시 대상 | 역대하 32:9-19 |
| `speaker-573377fda096` | 산헤립 | person / 본문 기반 발화의 표시 대상 | 역대하 32:17 |
| `speaker-bb9dd5ec1562` | 갓 | person / 본문 기반 발화의 표시 대상 | 역대상 21:9-12 |
| `speaker-aa3160f42963` | 오르난 | person / 본문 기반 발화의 표시 대상 | 역대상 21:20-24 |
| `speaker-ee3890c9c57f` | 후람 | person / 본문 기반 발화의 표시 대상 | 역대하 2:11-16 |
| `speaker-8eb069dfdbf4` | 스바 여왕 | person / 본문 기반 발화의 표시 대상 | 역대하 9:1-12 |
| `speaker-cc1c83ff9a99` | 스마야 | person / 본문 기반 발화의 표시 대상 | 역대하 11:2-4 · 역대하 12:5-8 |
| `speaker-8c96697bf125` | 예후(하나니의 아들) | person / 본문 기반 발화의 표시 대상 | 역대하 19:2-3 |
| `speaker-b417e70cca86` | 아마새 | person / 본문 기반 발화의 표시 대상 | 역대상 12:18 |
| `speaker-68da5de3bdc3` | 하나님 | divine / 본문 기반 발화의 표시 대상 | 역대상 14:10-16 · 역대하 1:7-12 · 역대하 7:11-22 |
| `speaker-2899bff57529` | 암몬 방백들 | group / 본문 기반 발화의 표시 대상 | 역대상 19:2-4 |
| `speaker-f449aed2fc3a` | 이스라엘 자손 | group / 본문 기반 발화의 표시 대상 | 역대하 10:3-5 · 역대하 10:16 |
| `speaker-63fd6bffbb26` | 노인들 | group / 본문 기반 발화의 표시 대상 | 역대하 10:6-7 |
| `speaker-56fcb2ca30e8` | 젊은이들 | group / 본문 기반 발화의 표시 대상 | 역대하 10:8-11 |
| `speaker-dab99ab8c0e9` | 르호보암과 유다 지도자들 | group / 본문 기반 발화의 표시 대상 | 역대하 12:6 |
| `speaker-be9a32a1e08a` | 유다 사람들 | group / 본문 기반 발화의 표시 대상 | 역대하 13:14-15 |
| `speaker-e86897d91729` | 아사랴(오뎃의 아들) | person / 본문 기반 발화의 표시 대상 | 역대하 15:1-7 |
| `speaker-134b92563d2b` | 아사와 유다 백성 | group / 본문 기반 발화의 표시 대상 | 역대하 15:12-15 |
| `speaker-df954b6da099` | 하나니 | person / 본문 기반 발화의 표시 대상 | 역대하 16:7-9 |
| `speaker-8feeb19cd546` | 아합 | person / 본문 기반 발화의 표시 대상 | 역대하 18:3-8 · 역대하 18:14-17 · 역대하 18:25-29 · 역대하 18:33-34 |
| `speaker-53129c7102e9` | 시드기야(그나아나의 아들) | person / 본문 기반 발화의 표시 대상 | 역대하 18:10-11 · 역대하 18:23-24 |
| `speaker-091d5414fc94` | 미가야 | person / 본문 기반 발화의 표시 대상 | 역대하 18:12-27 · 역대하 18:23-27 |
| `speaker-8c1e262e5036` | 아람 왕 | person / 본문 기반 발화의 표시 대상 | 역대하 18:30 |
| `speaker-80d700dc5437` | 야하시엘 | person / 본문 기반 발화의 표시 대상 | 역대하 20:14-17 |
| `speaker-db64681a2887` | 노래하는 이들 | group / 본문 기반 발화의 표시 대상 | 역대하 20:21-22 |
| `speaker-7095292ad371` | 엘리에셀 | person / 본문 기반 발화의 표시 대상 | 역대하 20:37 |
| `speaker-dcf8be7f7f02` | 엘리야 | person / 본문 기반 발화의 표시 대상 | 역대하 21:12-15 |
| `speaker-f4eec7d2fddd` | 스가랴(여호야다의 아들) | person / 본문 기반 발화의 표시 대상 | 역대하 24:20-22 |
| `speaker-7dfc17869a36` | 하나님의 사람 | person / 본문 기반 발화의 표시 대상 | 역대하 25:7-9 |
| `speaker-a5f75648f8a1` | 힐기야 | person / 본문 기반 발화의 표시 대상 | 역대하 34:14-15 |
| `speaker-519e604ab70c` | 사반 | person / 본문 기반 발화의 표시 대상 | 역대하 34:16-18 |
| `speaker-a660b4acd25b` | 훌다 | person / 본문 기반 발화의 표시 대상 | 역대하 34:23-28 |
| `speaker-cec91ce17c4d` | 느고 | person / 본문 기반 발화의 표시 대상 | 역대하 35:21 |
| `speaker-a2729a65bcfa` | 고레스 | person / 본문 기반 발화의 표시 대상 | 역대하 36:22-23 |
| `speaker-e47eabb30635` | 요아스(여호아하스의 아들) | person / 본문 기반 발화의 표시 대상 | 역대하 25:18-19 |
| `speaker-7064d1ca3d67` | 아사랴(제사장) | person / 본문 기반 발화의 표시 대상 | 역대하 26:18 |
| `speaker-40bef680a590` | 오뎃 | person / 본문 기반 발화의 표시 대상 | 역대하 28:9-11 |
| `speaker-16f754821564` | 에브라임 지도자들 | group / 본문 기반 발화의 표시 대상 | 역대하 28:12-13 |
| `speaker-d046cc19c594` | 아사랴(대제사장) | person / 본문 기반 발화의 표시 대상 | 역대하 31:10 |
| `speaker-abe5cd9d72a2` | 야베스 | person / 본문 기반 발화의 표시 대상 | 역대상 4:9-10 |
| `speaker-3ed3b36dc38e` | 이스라엘 장로들 | group / 본문 기반 발화의 표시 대상 | 역대상 11:1-3 |
| `speaker-6603398b960e` | 여부스 사람 | group / 본문 기반 발화의 표시 대상 | 역대상 11:4-6 |
| `speaker-5b882696ea4a` | 레위인들 | group / 본문 기반 발화의 표시 대상 | 역대하 5:11-14 |
| `speaker-3621ab40ee51` | 이스라엘 자손 | group / 본문 기반 발화의 표시 대상 | 역대하 7:1-10 |
| `judah-assembly-24` | 유다 백성 | group / 스가랴의 경고를 들은 백성 | 역대하 24:20 |
| `unnamed-prophet-amaziah-idols` | 선지자(아마샤 우상숭배 경고) | person / 이름이 기록되지 않은 선지자 | 역대하 25:15-16 |
| `carmi-achar-father` | 갈미 | person / 아갈의 아버지 | 역대상 2:7 |
| `achar` | 아갈 | person / 진멸할 물건과 관련해 범죄한 인물 | 역대상 2:7 |
| `tamar-judah` | 다말 | person / 유다의 며느리, 베레스·세라의 어머니 | 역대상 2:4 |
| `north-jeroboam` | 여로보암 | person / 북이스라엘 왕; 유다의 동명이인과 구분 | 역대하 10:2-4 |
| `north-baasha` | 바아사 | person / 북이스라엘 왕; 유다의 동명이인과 구분 | 역대하 16:1 |
| `north-ahaziah-israel` | 아하시야 | person / 북이스라엘 왕; 유다의 동명이인과 구분 | 역대하 20:35 |
| `north-jehoram-israel` | 여호람 | person / 북이스라엘 왕; 유다의 동명이인과 구분 | 역대하 22:5 |
| `north-jehu-king` | 예후 | person / 북이스라엘 왕; 유다의 동명이인과 구분 | 역대하 22:7 |
| `north-pekah` | 베가 | person / 북이스라엘 왕; 유다의 동명이인과 구분 | 역대하 28:6 |
| `jehoahaz-israel` | 여호아하스 | person / 북왕국 요아스의 아버지 | 역대하 25:17 |
| `foreign-hadadezer` | 하닷에셀 | person / 주변국 통치자; 이 두 권의 개별 사건으로 전체 생애의 선악을 확정하지 않음 | 역대상 18:3 |
| `foreign-nahash` | 나하스 | person / 주변국 통치자; 이 두 권의 개별 사건으로 전체 생애의 선악을 확정하지 않음 | 역대상 19:1 |
| `foreign-hanun` | 하눈 | person / 주변국 통치자; 이 두 권의 개별 사건으로 전체 생애의 선악을 확정하지 않음 | 역대상 19:2 |
| `foreign-shishak` | 시삭 | person / 주변국 통치자; 이 두 권의 개별 사건으로 전체 생애의 선악을 확정하지 않음 | 역대하 12:2 |
| `foreign-benhadad` | 벤하닷 | person / 주변국 통치자; 이 두 권의 개별 사건으로 전체 생애의 선악을 확정하지 않음 | 역대하 16:2 |
| `foreign-pul` | 불 | person / 주변국 통치자; 이 두 권의 개별 사건으로 전체 생애의 선악을 확정하지 않음 | 역대상 5:26 |
| `foreign-tiglath` | 디글랏빌레셀 | person / 주변국 통치자; 이 두 권의 개별 사건으로 전체 생애의 선악을 확정하지 않음 | 역대상 5:26 |
| `foreign-nebuchadnezzar` | 느부갓네살 | person / 주변국 통치자; 이 두 권의 개별 사건으로 전체 생애의 선악을 확정하지 않음 | 역대하 36:6 |
| `huram-craftsman` | 후람아비 | person / 성전 기술자; 두로 왕 후람과 분리 | 역대하 4:16 |
| `edom-bela` | 벨라 | person / 에돔 왕; 후계 관계와 친자 관계를 구별 | 역대상 1:43 |
| `edom-jobab` | 요밥 | person / 에돔 왕; 후계 관계와 친자 관계를 구별 | 역대상 1:44 |
| `edom-husham` | 후삼 | person / 에돔 왕; 후계 관계와 친자 관계를 구별 | 역대상 1:45 |
| `edom-hadad-bedad` | 하닷 | person / 에돔 왕; 후계 관계와 친자 관계를 구별 | 역대상 1:46 |
| `edom-samlah` | 사믈라 | person / 에돔 왕; 후계 관계와 친자 관계를 구별 | 역대상 1:47 |
| `edom-shaul` | 사울 | person / 에돔 왕; 후계 관계와 친자 관계를 구별 | 역대상 1:48 |
| `edom-baalhanan` | 바알하난 | person / 에돔 왕; 후계 관계와 친자 관계를 구별 | 역대상 1:49 |
| `edom-hadad-pai` | 하닷 | person / 에돔 왕; 후계 관계와 친자 관계를 구별 | 역대상 1:50 |
| `edom-father-beor` | 브올 | person / 에돔 왕의 아버지 | 역대상 1:43 |
| `edom-father-zerah` | 세라 | person / 에돔 왕의 아버지 | 역대상 1:44 |
| `edom-father-bedad` | 브닷 | person / 에돔 왕의 아버지 | 역대상 1:46 |
| `edom-father-achbor` | 악볼 | person / 에돔 왕의 아버지 | 역대상 1:49 |
| `mehetabel` | 므헤다벨 | person / 에돔 마지막 하닷의 아내 | 역대상 1:50 |
| `matred` | 마드렛 | person / 므헤다벨의 부모 | 역대상 1:50 |
| `mezahab` | 메사합 | person / 므헤다벨의 조부모 | 역대상 1:50 |
