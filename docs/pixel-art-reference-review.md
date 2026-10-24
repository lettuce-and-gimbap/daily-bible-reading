# 외부 픽셀아트 조사 기록

후속 156종 직접·유사 대상 설계 검토는 [전종 조사표](object-animation-study.md)를 참고한다. 아래는 1차 조사 당시의 상태다.

156종에 대해 itch.io에서 영문 오브젝트명 + pixel art animation 검색을 수행했다. 검색 결과 수집은 개별 애니메이션 검토 완료를 뜻하지 않는다. 대표 이미지 140종을 비교했으며 무관한 결과는 아래에 명시했다. 외부 그림은 저장소에 복제하지 않았고, 원본 도안과 코드로 재구성했다.

공통 모션 근거: [SLYNYRD Pixelblog 8](https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation) 본문과 GIF의 핵심 자세 확인. 준비/완전 신장 자세만으로 행동이 읽혀야 하며 과도한 중간 프레임은 힘을 줄일 수 있다는 설명을 적용했다. [Lospec animation 목록](https://lospec.com/pixel-art-tutorials/tags/animation)은 소재별 추가 조사용 목록이며 연결된 모든 튜토리얼을 읽었다는 뜻은 아니다.

외부 원본과 검색 인덱스는 `/workspace/pixel-art-research/`에 보관한다. `references.sqlite3`는 검색 가능한 참고 DB이며 모델의 영구 학습이 아니다.

|물건|검색·시각 자료 판정|조정 기준|
|---|---|---|
|보리밭 (field)|[대표 이미지에서 관련 형태 확인](https://mutterpixel-studio.itch.io/corn-field-pixel-art-asset-pack)|덩어리의 높이·이삭 실루엣을 유지하고 수확할 때 손이 이삭 끝까지 도달한다.|
|물항아리 (water)|[대표 이미지에서 관련 형태 확인](https://nawa-charith.itch.io/seamless-water-tile-pixel-art)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|쉬는 자리 (bench)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=bench%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|나무 (tree)|[대표 이미지에서 관련 형태 확인](https://mmorwynn.itch.io/pixel-tree-generator-aseprite)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|우물 (well)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=well%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|돌 (stone)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=stone%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|떨기나무 (bush)|[대표 이미지에서 관련 형태 확인](https://phoenix1291.itch.io/20-bush-pack1)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|배 (boat)|[대표 이미지에서 관련 형태 확인](https://comshadow.itch.io/flying-boat-pixel-art-tileset-pack)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|두루마리 (scroll)|[대표 이미지에서 관련 형태 확인](https://elthen.itch.io/2d-pixel-art-guardian-scroll-sprites)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|기름병 (oil)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=oil%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|노아의 방주 (ark-noah)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=ark%20noah%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|언약궤 (ark-covenant)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=ark%20covenant%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|제단 (altar)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=altar%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|분향단 (incense-altar)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=incense%20altar%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|성막 (tabernacle)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=tabernacle%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|장막 (tent)|[대표 이미지에서 관련 형태 확인](https://comshadow.itch.io/mystic-fortune-teller-tent-topdown-pixel-art-tileset)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|성전 (temple)|[대표 이미지에서 관련 형태 확인](https://bubbabba.itch.io/jungle-ruins)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|성문 (gate)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=gate%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|성벽 (wall)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=wall%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|망대 (tower)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=tower%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|집 (house)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=house%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|왕궁 (palace)|[대표 이미지에서 관련 형태 확인](https://yygameca.itch.io/celestial-palace-pixel-art-scene-pack)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|구유 (stable)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=stable%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|무덤 (tomb)|[대표 이미지에서 관련 형태 확인](https://ankousse26.itch.io/stone-tomb-pixel-art)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|지팡이 (staff)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=staff%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|막대기 (rod)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=rod%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|물매 (sling)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=sling%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|칼 (sword)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=sword%20pixel%20art%20animation)|겨냥·당김·발사 또는 준비·베기·회복을 분리한다.|
|창 (spear)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=spear%20pixel%20art%20animation)|겨냥·당김·발사 또는 준비·베기·회복을 분리한다.|
|단창 (javelin)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=javelin%20pixel%20art%20animation)|겨냥·당김·발사 또는 준비·베기·회복을 분리한다.|
|활 (bow)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=bow%20pixel%20art%20animation)|겨냥·당김·발사 또는 준비·베기·회복을 분리한다.|
|화살 (arrow)|[대표 이미지에서 관련 형태 확인](https://peaveepeanut.itch.io/bow-and-arrow-fantasy-sprites)|겨냥·당김·발사 또는 준비·베기·회복을 분리한다.|
|방패 (shield)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=shield%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|투구 (helmet)|[대표 이미지에서 관련 형태 확인](https://free-game-assets.itch.io/helmet-pixel-art-game-icons)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|갑옷 (armor)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=armor%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|병거 (chariot)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=chariot%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|바퀴 (wheel)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=wheel%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|쇠사슬 (chain)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=chain%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|차꼬 (fetter)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=fetter%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|밧줄 (rope)|[대표 이미지에서 관련 형태 확인](https://stationsupply.itch.io/crafting-resources-icons-48px)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|닻 (anchor)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=anchor%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|돛 (sail)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=sail%20pixel%20art%20animation)|고정점과 늘어진 끝을 구분한다. 접힘과 지연된 끝자락으로 천임을 보여준다.|
|노 (oar)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=oar%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|그물 (net)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=net%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|낚시 (hook)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=hook%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|바구니 (basket)|[대표 이미지에서 관련 형태 확인](https://theholocl.itch.io/cozy-village-item-bread-basket-free)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|항아리 (jar)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=jar%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|솥 (pot)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=pot%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|대접 (bowl)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=bowl%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|잔 (cup)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=cup%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|주전자 (pitcher)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=pitcher%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|대야 (basin)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=basin%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|등잔 (lamp)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=lamp%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|등잔대 (lampstand)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=lampstand%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|횃불 (torch)|[대표 이미지에서 관련 형태 확인](https://mythichub.itch.io/pixel-art-dungeon-props-torch-chest)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|초 (candle)|[대표 이미지에서 관련 형태 확인](https://gabestones.itch.io/candles)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|향로 (censer)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=censer%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|향 (incense)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=incense%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|몰약 (myrrh)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=myrrh%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|향유 (perfume)|[대표 이미지에서 관련 형태 확인](https://infinite-art-solutions.itch.io/perfume-shop-icon-pack)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|떡 (bread)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=bread%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|보리떡 (barley-bread)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=barley%20bread%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|만나 (manna)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=manna%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|메추라기 (quail)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=quail%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|물고기 (fish)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=fish%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|곡식 (grain)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=grain%20pixel%20art%20animation)|덩어리의 높이·이삭 실루엣을 유지하고 수확할 때 손이 이삭 끝까지 도달한다.|
|밀 (wheat)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=wheat%20pixel%20art%20animation)|덩어리의 높이·이삭 실루엣을 유지하고 수확할 때 손이 이삭 끝까지 도달한다.|
|보리 (barley)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=barley%20pixel%20art%20animation)|덩어리의 높이·이삭 실루엣을 유지하고 수확할 때 손이 이삭 끝까지 도달한다.|
|씨앗 (seed)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=seed%20pixel%20art%20animation)|덩어리의 높이·이삭 실루엣을 유지하고 수확할 때 손이 이삭 끝까지 도달한다.|
|가루 (flour)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=flour%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|반죽 (dough)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=dough%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|누룩 (leaven)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=leaven%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|소금 (salt)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=salt%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|꿀 (honey)|[대표 이미지에서 관련 형태 확인](https://medievalmore.itch.io/100-pixel-art-resource-icons-9)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|젖 (milk)|[대표 이미지에서 관련 형태 확인](https://ignite-marketplace.itch.io/10-retro-pixel-art-milk-carton)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|물 (water-supply)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=water%20supply%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|포도주 (wine)|[대표 이미지에서 관련 형태 확인](https://pierraffy.itch.io/wine-pixel-art)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|기름 (olive-oil)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=olive%20oil%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|포도 (grapes)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=grapes%20pixel%20art%20animation)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|포도원 (vineyard)|[대표 이미지에서 관련 형태 확인](https://comshadow.itch.io/orchard-and-vineyard-topdown-pixel-art-tileset)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|포도나무 (vine)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=vine%20pixel%20art%20animation)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|무화과나무 (fig-tree)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=fig%20tree%20pixel%20art%20animation)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|무화과 (fig)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=fig%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|감람나무 (olive-tree)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=olive%20tree%20pixel%20art%20animation)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|종려나무 (palm)|[대표 이미지에서 관련 형태 확인](https://mutterpixel-studio.itch.io/a-collection-of-32x32-palm-trees-perfect-for-tropical-island)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|백향목 (cedar)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=cedar%20pixel%20art%20animation)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|우슬초 (hyssop)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=hyssop%20pixel%20art%20animation)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|갈대 (reed)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=reed%20pixel%20art%20animation)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|백합 (lily)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=lily%20pixel%20art%20animation)|줄기는 고정하고 잎·가지·열매가 변형된다. 물건 전체를 들썩이지 않는다.|
|겨자씨 (mustard)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=mustard%20pixel%20art%20animation)|덩어리의 높이·이삭 실루엣을 유지하고 수확할 때 손이 이삭 끝까지 도달한다.|
|열매 (fruit)|[대표 이미지에서 관련 형태 확인](https://mardlihabibi.itch.io/lumina-pixel-plants)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|상 (table)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=table%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|침상 (bed)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=bed%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|자리 (mat)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=mat%20pixel%20art%20animation)|고정점과 늘어진 끝을 구분한다. 접힘과 지연된 끝자락으로 천임을 보여준다.|
|보좌 (throne)|[대표 이미지에서 관련 형태 확인](https://mutterpixel-studio.itch.io/castle-throne-room-pixel-art-asset-pack)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|발판 (footstool)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=footstool%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|겉옷 (cloak)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=cloak%20pixel%20art%20animation)|고정점과 늘어진 끝을 구분한다. 접힘과 지연된 끝자락으로 천임을 보여준다.|
|옷 (robe)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=robe%20pixel%20art%20animation)|고정점과 늘어진 끝을 구분한다. 접힘과 지연된 끝자락으로 천임을 보여준다.|
|베옷 (sackcloth)|[대표 이미지에서 관련 형태 확인](https://najjar320.itch.io/sackcloth-32x32-pixel-art-sacks)|고정점과 늘어진 끝을 구분한다. 접힘과 지연된 끝자락으로 천임을 보여준다.|
|에봇 (ephod)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=ephod%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|흉패 (breastplate)|[대표 이미지에서 관련 형태 확인](https://pixel-prismor.itch.io/leather-armorarmor)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|왕관 (crown)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=crown%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|신발 (sandal)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=sandal%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|띠 (belt)|[대표 이미지에서 관련 형태 확인](https://free-game-assets.itch.io/free-belt-rpg-pixel-art-icons)|고정점과 늘어진 끝을 구분한다. 접힘과 지연된 끝자락으로 천임을 보여준다.|
|수건 (towel)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=towel%20pixel%20art%20animation)|고정점과 늘어진 끝을 구분한다. 접힘과 지연된 끝자락으로 천임을 보여준다.|
|휘장 (veil)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=veil%20pixel%20art%20animation)|고정점과 늘어진 끝을 구분한다. 접힘과 지연된 끝자락으로 천임을 보여준다.|
|커튼 (curtain)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=curtain%20pixel%20art%20animation)|고정점과 늘어진 끝을 구분한다. 접힘과 지연된 끝자락으로 천임을 보여준다.|
|세마포 (linen)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=linen%20pixel%20art%20animation)|고정점과 늘어진 끝을 구분한다. 접힘과 지연된 끝자락으로 천임을 보여준다.|
|돌판 (tablet)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=tablet%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|책 (book)|[대표 이미지에서 관련 형태 확인](https://heondu.itch.io/pixel-book-animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|편지 (letter)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=letter%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|인장 (seal)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=seal%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|반지 (signet)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=signet%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|먹 (ink)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=ink%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|붓 (pen)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=pen%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|동전 (coin)|[대표 이미지에서 관련 형태 확인](https://astaxrwas-here.itch.io/pixel-art-coin-animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|은 (silver)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=silver%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|금 (gold)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=gold%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|진주 (pearl)|[대표 이미지에서 관련 형태 확인](https://tmecat.itch.io/mystic-pearl-orb-animated-pixel-asset)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|보석 (jewel)|[대표 이미지에서 관련 형태 확인](https://aelw.itch.io/moonlit-alchemy-icons)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|보물상자 (treasure-chest)|[대표 이미지에서 관련 형태 확인](https://chrisppop.itch.io/colorful-treasure-chests)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|돈주머니 (moneybag)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=moneybag%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|수금 (lyre)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=lyre%20pixel%20art%20animation)|악기는 지지하는 손과 연주하는 손의 역할을 나눈다.|
|거문고 (harp)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=harp%20pixel%20art%20animation)|악기는 지지하는 손과 연주하는 손의 역할을 나눈다.|
|소고 (tambourine)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=tambourine%20pixel%20art%20animation)|악기는 지지하는 손과 연주하는 손의 역할을 나눈다.|
|나팔 (trumpet)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=trumpet%20pixel%20art%20animation)|악기는 지지하는 손과 연주하는 손의 역할을 나눈다.|
|피리 (flute)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=flute%20pixel%20art%20animation)|악기는 지지하는 손과 연주하는 손의 역할을 나눈다.|
|제금 (cymbal)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=cymbal%20pixel%20art%20animation)|악기는 지지하는 손과 연주하는 손의 역할을 나눈다.|
|맷돌 (millstone)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=millstone%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|쟁기 (plow)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=plow%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|낫 (sickle)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=sickle%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|도끼 (axe)|[대표 이미지에서 관련 형태 확인](https://finnywinny4.itch.io/axe-animation-pixel-art-character)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|망치 (hammer)|[대표 이미지에서 관련 형태 확인](https://penusbmic.itch.io/pixel-art-tutorial-shotgun-hammer-attack)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|못 (nail)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=nail%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|열쇠 (key)|[대표 이미지에서 관련 형태 확인](https://bacon10bit.itch.io/key-animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|저울 (scale)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=scale%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|멍에 (yoke)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=yoke%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|십자가 (cross)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=cross%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|물두멍 (laver)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=laver%20pixel%20art%20animation)|입구·손잡이·주둥이를 구분한다. 따르기는 몸통 이동이 아닌 입구 기울기와 액체 흐름으로 읽힌다.|
|화덕 (oven)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=oven%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|벽돌 (brick)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=brick%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|돌기둥 (stone-pillar)|[대표 이미지에서 관련 형태 확인](https://firemagestudio.itch.io/stone-pillar-pixel-art-pack)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|사다리 (ladder)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=ladder%20pixel%20art%20animation)|손잡이와 작업부를 구분한다. 준비 자세와 접촉 자세의 각도 차이를 크게 두고 반동 뒤 회복한다.|
|무지개 (rainbow)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=rainbow%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|별 (star)|[대표 이미지에서 관련 형태 확인](https://pixel-salvaje.itch.io/free-falling-star-animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|구름 (cloud)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=cloud%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|불 (fire)|[대표 이미지에서 관련 형태 확인](https://free-game-assets.itch.io/fire-pixel-art-animation-sprites)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|양 (sheep)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=sheep%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|나귀 (donkey)|[대표 이미지에서 관련 형태 확인](https://mardlihabibi.itch.io/lumina-pixel-animals-pack)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|말 (horse)|[대표 이미지에서 관련 형태 확인](https://mutterpixel-studio.itch.io/animated-horse-pack-6-pixel-mounts)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|비둘기 (dove)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=dove%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|까마귀 (raven)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=raven%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|뱀 (snake)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=snake%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|놋뱀 (bronze-snake)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=bronze%20snake%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|사자 (lion)|[대표 이미지에서 관련 형태 확인](https://fleuffstudios.itch.io/wild-animals-pixel-art-attack)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|
|송아지 (calf)|[결과가 무관하거나 해당 물건의 시각 근거 부족 — 공통 원칙만 적용](https://itch.io/search?q=calf%20pixel%20art%20animation)|실루엣을 보존하고 고정된 부분과 움직이는 부분을 분리한다. 상징·구조물은 전체를 휘두르는 동작을 적용하지 않는다.|

## 밧줄 직접 참고

[Donitz — Godot Pixel Rope](https://donitz.itch.io/godot-pixel-rope)와 [프로젝트 설명 및 예시](https://github.com/Donitzo/godot-pixel-rope)를 확인했다. 사각 조각을 나열하는 대신 픽셀 단위로 연결된 가닥을 그리는 원칙, 고정점과 늘어진 구간을 구분하는 표현을 참고했다. 해당 프로젝트의 물리 엔진이나 에셋을 복제한 것은 아니다. 이번 구현은 손 위치에 연결되는 자체 도안이며 감기·묶기·당기기별로 늘어진 끝의 형태를 나눈다.

## 적용 및 검증 범위

- 큰 작업 동작: 손의 수평 이동, 몸의 무게 이동, 도구 각도를 함께 바꾸고 뚜렷한 핵심 자세를 유지한다.
- 조용한 동작: 마시기·읽기·휴식은 기존의 작은 움직임과 멈춤을 유지한다.
- 밧줄: 연결 가닥·코일·매듭·늘어뜨리기·장력으로 구분한다.
- 망치·도끼·낫: 접촉 대상과 접촉 순간의 결과를 표현한다. 성경 사건이 아닌 일상 동작 연출이다.
- 인물·물건 연결: 팔꿈치부터 손까지 연결된 도트를 유지하고, 손 소품 위치에 같은 수평 이동을 적용한다. 악기는 잡는 지점을 낮춰 얼굴 가림을 줄인다.
- 156종의 모든 행동·사방향·시간 샘플은 렌더링 오류 검사를 수행한다. 이는 모든 행동의 미적 완성도나 각 물건의 외부 애니메이션 확보를 보증하지 않는다.
