# 156종 개별 애니메이션 실제 렌더링 전수 검토

검토 범위: 156종, 1228개 행동, 사방향·시간 샘플 162,096프레임. 수치 오류·렌더링 예외 0건, 넓힌 검토 캔버스 경계 잘림 0종.

128×96 축소 화면의 시간 샘플 해시를 비교해 132종에서 동작이 같은 후보를 찾았다. 이는 중복 확정이나 결함 수가 아니다. 미세한 손 움직임이 축소 과정에서 사라질 수 있고 관찰·대기처럼 자세를 공유해도 되는 행동이 있다. 제품 화면의 미적 완성도 합격 판정으로 사용하지 않는다.

## 화면 검토 및 이번 수정

- 13개 전종 비교 화면을 확인했다. 정면·측면 확대 비교는 밧줄·물·망치·악기·쟁기·그물 및 상태 변화가 있는 대상에 수행했다. 모든 행동을 실기기에서 동영상으로 재생 확인한 것은 아니다.
- 동물 오브젝트 10종: 옛 직사각형 도안 대신 현재 동물 캐릭터 렌더러로 연결.
- 돌기둥·무덤: 납작한 돌 도안 대신 기둥과 입구가 있는 별도 실루엣으로 수정.
- 검토 도구: 큰 대상이 검사 캔버스에 잘리지 않도록 영역 확대. 행동별 화면 지문과 프레임 변화 수를 기록.

## 남은 주요 개선 대상

|계열|확인 내용|필요한 작업|
|---|---|---|
|반죽·가루·누룩|주무르기·누르기·나누기의 핵심 자세가 유사|반죽 자체의 압축·분리 결과 구분|
|의복·장신구|고쳐 입기·접기·매기·손질이 공통 자세에 의존|부위별 손 접촉과 접힌 상태 구분|
|노·쟁기·멍에|정방향/역방향 사용의 화면 구분이 약함|접촉점 유지 및 진행 방향·반동 구분|
|악기|연주 종류가 손 위치·박자 차이로 충분히 구분되지 않음|줄별 뜯기, 양손 연주, 유지음 타이밍 분리|
|인장·열쇠·저울|누르기/굴리기, 잠그기/열기, 균형 조절이 유사|작업 대상과 완료 상태 표현|
|식물·구조물·상징|관찰 자세 공유가 많음|관찰·대기는 공유 허용, 작업 행동만 구분 강화|

## 전종 결과

|대상|행동 수|화면 중복 후보 그룹|판정|
|---|---|---|
|보리밭 (field)|8|sort · tie|동작 구분 추가 검토|
|물항아리 (water)|10|drink · sip / close · cap|동작 구분 추가 검토|
|쉬는 자리 (bench)|6|sit · lap · stretch|동작 구분 추가 검토|
|나무 (tree)|10|leaves · trunk|동작 구분 추가 검토|
|우물 (well)|9|scoop · pour / wash · rinse|동작 구분 추가 검토|
|돌 (stone)|8|pick · place / turn · brush · measure|동작 구분 추가 검토|
|떨기나무 (bush)|8|observe · leaves · trunk / lean · step-back · shade|동작 구분 추가 검토|
|배 (boat)|9|grip · repair · wipe|동작 구분 추가 검토|
|두루마리 (scroll)|8|point · offer|동작 구분 추가 검토|
|기름병 (oil)|7|없음|샘플 비교상 중복 후보 없음|
|노아의 방주 (ark-noah)|9|grip · repair · wipe|동작 구분 추가 검토|
|언약궤 (ark-covenant)|6|observe · look / bow · kneel|동작 구분 추가 검토|
|제단 (altar)|6|kneel · bow|동작 구분 추가 검토|
|분향단 (incense-altar)|6|kneel · bow|동작 구분 추가 검토|
|성막 (tabernacle)|6|look · inspect|동작 구분 추가 검토|
|장막 (tent)|6|look · inspect|동작 구분 추가 검토|
|성전 (temple)|6|look · inspect|동작 구분 추가 검토|
|성문 (gate)|6|look · inspect|동작 구분 추가 검토|
|성벽 (wall)|6|look · inspect|동작 구분 추가 검토|
|망대 (tower)|6|look · inspect / knock · measure|동작 구분 추가 검토|
|집 (house)|6|look · inspect|동작 구분 추가 검토|
|왕궁 (palace)|6|look · inspect|동작 구분 추가 검토|
|구유 (stable)|6|없음|샘플 비교상 중복 후보 없음|
|무덤 (tomb)|6|look · inspect / hands · point|독립 실루엣 수정|
|지팡이 (staff)|9|lean-staff · brace / grip · turn|동작 구분 추가 검토|
|막대기 (rod)|9|lean-staff · brace / grip · turn|동작 구분 추가 검토|
|물매 (sling)|10|sling · load-sling · sling-low / tie · sort · grip|동작 구분 추가 검토|
|칼 (sword)|9|guard · brace|동작 구분 추가 검토|
|창 (spear)|9|guard · brace|동작 구분 추가 검토|
|단창 (javelin)|9|guard · brace|동작 구분 추가 검토|
|활 (bow)|9|unstring · tie|동작 구분 추가 검토|
|화살 (arrow)|9|fletch · count · tie|동작 구분 추가 검토|
|방패 (shield)|8|guard · brace / turn · grip|동작 구분 추가 검토|
|투구 (helmet)|10|smooth · fold / tie · measure · brush|동작 구분 추가 검토|
|갑옷 (armor)|9|smooth · fold / tie · measure · brush|동작 구분 추가 검토|
|병거 (chariot)|8|repair · grip · wipe|동작 구분 추가 검토|
|바퀴 (wheel)|8|grip · repair · wipe · measure · brush|동작 구분 추가 검토|
|쇠사슬 (chain)|10|coil · sort · grip|동작 구분 추가 검토|
|차꼬 (fetter)|10|coil · sort · grip|동작 구분 추가 검토|
|밧줄 (rope)|10|coil · sort|동작 구분 추가 검토|
|닻 (anchor)|8|grip · turn · repair · wipe · measure · brush|동작 구분 추가 검토|
|돛 (sail)|8|tie · measure · brush|동작 구분 추가 검토|
|노 (oar)|10|row · back-row · reins / measure · brush · grip · turn|동작 구분 추가 검토|
|그물 (net)|10|tie · sort · grip|동작 구분 추가 검토|
|낚시 (hook)|10|untie · coil · sort · grip|동작 구분 추가 검토|
|바구니 (basket)|9|sort · count · cover · close|동작 구분 추가 검토|
|항아리 (jar)|8|hold · carry|동작 구분 추가 검토|
|솥 (pot)|6|없음|샘플 비교상 중복 후보 없음|
|대접 (bowl)|10|drink · sip|동작 구분 추가 검토|
|잔 (cup)|8|drink · sip|동작 구분 추가 검토|
|주전자 (pitcher)|7|없음|샘플 비교상 중복 후보 없음|
|대야 (basin)|6|wash · rinse / pour · scoop|동작 구분 추가 검토|
|등잔 (lamp)|7|tend · trim · fan / shield · hold|동작 구분 추가 검토|
|등잔대 (lampstand)|7|tend · trim / shield · hold|동작 구분 추가 검토|
|횃불 (torch)|7|tend · trim · fan / shield · hold|동작 구분 추가 검토|
|초 (candle)|7|tend · trim · fan / shield · hold|동작 구분 추가 검토|
|향로 (censer)|8|cap · close|동작 구분 추가 검토|
|향 (incense)|8|cap · close|동작 구분 추가 검토|
|몰약 (myrrh)|7|없음|샘플 비교상 중복 후보 없음|
|향유 (perfume)|7|없음|샘플 비교상 중복 후보 없음|
|떡 (bread)|8|share · break · offer · serve|동작 구분 추가 검토|
|보리떡 (barley-bread)|8|share · break · offer · serve|동작 구분 추가 검토|
|만나 (manna)|8|share · break · offer · serve|동작 구분 추가 검토|
|메추라기 (quail)|6|없음|동물 도안 연결 수정|
|물고기 (fish)|6|없음|동물 도안 연결 수정|
|곡식 (grain)|8|sort · tie|동작 구분 추가 검토|
|밀 (wheat)|8|sort · tie|동작 구분 추가 검토|
|보리 (barley)|8|sort · tie|동작 구분 추가 검토|
|씨앗 (seed)|9|sow · sprinkle / count · sort / gather · place / offer · share|동작 구분 추가 검토|
|가루 (flour)|8|knead · press · divide / cover · roll|동작 구분 추가 검토|
|반죽 (dough)|8|knead · press · divide / cover · roll|동작 구분 추가 검토|
|누룩 (leaven)|8|knead · press · divide / cover · roll|동작 구분 추가 검토|
|소금 (salt)|8|offer · share|동작 구분 추가 검토|
|꿀 (honey)|6|없음|샘플 비교상 중복 후보 없음|
|젖 (milk)|7|없음|샘플 비교상 중복 후보 없음|
|물 (water-supply)|7|wash · rinse|동작 구분 추가 검토|
|포도주 (wine)|7|없음|샘플 비교상 중복 후보 없음|
|기름 (olive-oil)|7|없음|샘플 비교상 중복 후보 없음|
|포도 (grapes)|7|gather · place|동작 구분 추가 검토|
|포도원 (vineyard)|7|gather · place|동작 구분 추가 검토|
|포도나무 (vine)|10|leaves · trunk|동작 구분 추가 검토|
|무화과나무 (fig-tree)|10|leaves · trunk|동작 구분 추가 검토|
|무화과 (fig)|8|share · break · offer · serve|동작 구분 추가 검토|
|감람나무 (olive-tree)|10|leaves · trunk|동작 구분 추가 검토|
|종려나무 (palm)|7|leaves · trunk|동작 구분 추가 검토|
|백향목 (cedar)|6|shade · step-back / leaves · trunk · inspect · look|동작 구분 추가 검토|
|우슬초 (hyssop)|8|observe · leaves · trunk / lean · step-back · shade|동작 구분 추가 검토|
|갈대 (reed)|8|observe · leaves · trunk / lean · step-back · shade|동작 구분 추가 검토|
|백합 (lily)|8|observe · leaves · trunk / lean · step-back · shade|동작 구분 추가 검토|
|겨자씨 (mustard)|9|sow · sprinkle / count · sort / gather · place / offer · share|동작 구분 추가 검토|
|열매 (fruit)|8|share · break · offer · serve|동작 구분 추가 검토|
|상 (table)|10|serve · share / lap · feet · stretch|동작 구분 추가 검토|
|침상 (bed)|9|lie · sleep · tuck · smooth|동작 구분 추가 검토|
|자리 (mat)|9|lie · sleep · tuck|동작 구분 추가 검토|
|보좌 (throne)|6|sit · lap · stretch|동작 구분 추가 검토|
|발판 (footstool)|6|sit · lap · stretch|동작 구분 추가 검토|
|겉옷 (cloak)|9|smooth · fold / tie · measure · brush|동작 구분 추가 검토|
|옷 (robe)|9|smooth · fold / tie · measure · brush|동작 구분 추가 검토|
|베옷 (sackcloth)|9|smooth · fold / tie · measure · brush|동작 구분 추가 검토|
|에봇 (ephod)|9|smooth · fold / tie · measure · brush|동작 구분 추가 검토|
|흉패 (breastplate)|10|smooth · fold / tie · measure · brush|동작 구분 추가 검토|
|왕관 (crown)|10|smooth · fold / tie · measure · brush|동작 구분 추가 검토|
|신발 (sandal)|9|tie · measure · brush|동작 구분 추가 검토|
|띠 (belt)|10|smooth · fold / tie · measure · brush|동작 구분 추가 검토|
|수건 (towel)|9|fold · smooth / hold · stretch / tie · measure · brush|동작 구분 추가 검토|
|휘장 (veil)|8|tie · measure · brush|동작 구분 추가 검토|
|커튼 (curtain)|8|tie · measure · brush|동작 구분 추가 검토|
|세마포 (linen)|9|smooth · fold / tie · measure · brush|동작 구분 추가 검토|
|돌판 (tablet)|8|point · offer|동작 구분 추가 검토|
|책 (book)|8|point · offer|동작 구분 추가 검토|
|편지 (letter)|8|point · offer|동작 구분 추가 검토|
|인장 (seal)|9|stamp · roll-seal / turn · brush|동작 구분 추가 검토|
|반지 (signet)|9|stamp · roll-seal / turn · brush|동작 구분 추가 검토|
|먹 (ink)|7|없음|샘플 비교상 중복 후보 없음|
|붓 (pen)|7|없음|샘플 비교상 중복 후보 없음|
|동전 (coin)|7|count · sort|동작 구분 추가 검토|
|은 (silver)|7|count · sort|동작 구분 추가 검토|
|금 (gold)|7|count · sort|동작 구분 추가 검토|
|진주 (pearl)|7|count · sort|동작 구분 추가 검토|
|보석 (jewel)|7|count · sort|동작 구분 추가 검토|
|보물상자 (treasure-chest)|7|close · sort · count · cover|동작 구분 추가 검토|
|돈주머니 (moneybag)|9|sort · count · cover · close|동작 구분 추가 검토|
|수금 (lyre)|9|strum · play · pluck|동작 구분 추가 검토|
|거문고 (harp)|9|strum · play · pluck|동작 구분 추가 검토|
|소고 (tambourine)|9|tap · beat / shake · raise|동작 구분 추가 검토|
|나팔 (trumpet)|9|blow · long-blow · rehearse|동작 구분 추가 검토|
|피리 (flute)|9|blow · long-blow · rehearse|동작 구분 추가 검토|
|제금 (cymbal)|9|tap · beat / shake · raise|동작 구분 추가 검토|
|맷돌 (millstone)|9|feed-grain · gather-flour / brush · wipe · measure · turn|동작 구분 추가 검토|
|쟁기 (plow)|9|push · pull / grip · repair · wipe · measure · brush · turn|동작 구분 추가 검토|
|낫 (sickle)|10|measure · brush · grip · turn|동작 구분 추가 검토|
|도끼 (axe)|10|measure · brush · grip · turn|동작 구분 추가 검토|
|망치 (hammer)|10|measure · brush · grip · turn|동작 구분 추가 검토|
|못 (nail)|9|use · wipe / measure · turn · brush|동작 구분 추가 검토|
|열쇠 (key)|9|unlock · turn-key / turn · brush|동작 구분 추가 검토|
|저울 (scale)|8|balance · remove-weight / count · sort / wipe · polish|동작 구분 추가 검토|
|멍에 (yoke)|9|push · pull / grip · repair · wipe · measure · brush · turn|동작 구분 추가 검토|
|십자가 (cross)|6|look · observe / point · hands|동작 구분 추가 검토|
|물두멍 (laver)|6|wash · rinse / pour · scoop|동작 구분 추가 검토|
|화덕 (oven)|8|없음|샘플 비교상 중복 후보 없음|
|벽돌 (brick)|8|pick · place / turn · brush · measure|동작 구분 추가 검토|
|돌기둥 (stone-pillar)|6|look · inspect / hands · point|독립 실루엣 수정|
|사다리 (ladder)|8|grip · repair · wipe · measure · brush · turn|동작 구분 추가 검토|
|무지개 (rainbow)|6|look · observe / point · hands|동작 구분 추가 검토|
|별 (star)|6|look · observe / point · hands|동작 구분 추가 검토|
|구름 (cloud)|6|look · observe / point · hands|동작 구분 추가 검토|
|불 (fire)|6|없음|샘플 비교상 중복 후보 없음|
|양 (sheep)|6|없음|동물 도안 연결 수정|
|나귀 (donkey)|6|없음|동물 도안 연결 수정|
|말 (horse)|6|없음|동물 도안 연결 수정|
|비둘기 (dove)|6|없음|동물 도안 연결 수정|
|까마귀 (raven)|6|없음|동물 도안 연결 수정|
|뱀 (snake)|6|없음|동물 도안 연결 수정|
|놋뱀 (bronze-snake)|6|look · observe / point · hands|동작 구분 추가 검토|
|사자 (lion)|6|없음|동물 도안 연결 수정|
|송아지 (calf)|6|없음|동물 도안 연결 수정|
