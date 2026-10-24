# 156종 개별 애니메이션 설계 검토 — 후속 조사

이 문서는 이전 조사에서 남긴 개별 자료 부족 항목을 직접·유사 대상 참고로 연결해 설계 검토를 마무리한 기록이다. **156종 각각의 완성된 외부 애니메이션을 확보하거나 시청했다는 뜻은 아니다.** 공식 사용 설명, 정지 이미지, 기존 픽셀 GIF 튜토리얼을 구분해 참고했다. 유사 대상의 구조와 작동 원리만 가져오며 마인크래프트의 3D 블록 외형·텍스처·게임 규칙은 복제하지 않는다.

마인크래프트 공식 기사 35개를 확보해 본문 사용 설명을 검토했다. 대상별 대응 기사 64건과 유사 작동 원리 대응을 함께 기록한다. 작화·타이밍의 공통 근거는 [SLYNYRD의 핵심 자세 GIF와 설명](https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation), 밧줄은 [Donitz의 예시와 설명](https://github.com/Donitzo/godot-pixel-rope)이다. Minecraft 공식 기사의 스크린샷은 정지 이미지이며 애니메이션 검토로 세지 않는다.

|대상|직접/유사 참고|핵심 자세·변화|검토 기준|
|---|---|---|---|
|보리밭 (field)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|손이 이삭에 닿음→잘린 이삭이 손에 모임→끈으로 묶임|자르기 전후의 이삭과 묶음이 구분되어야 한다|
|물항아리 (water)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/block-week-water)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|쉬는 자리 (bench)|[유사 구조·쓰임새: bed](https://www.minecraft.net/en-us/article/taking-inventory--bed)|접근→무게 낮추기→앉기/눕기→일어나기|발과 좌면, 누운 머리와 베개의 접촉을 유지한다|
|나무 (tree)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|우물 (well)|[유사 구조·쓰임새: water](https://www.minecraft.net/en-us/article/block-week-water)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|돌 (stone)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/block-week-stone)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|떨기나무 (bush)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|배 (boat)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--boat)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|두루마리 (scroll)|[유사 동작: 핵심 자세·정지 유지](https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation)|받치기→펼치기→글줄 따라가기/쓰기→덮기|펼친 면과 손의 작업이 보이고 얼굴을 가리지 않는다|
|기름병 (oil)|[유사 구조·쓰임새: bowl](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|노아의 방주 (ark-noah)|[유사 구조·쓰임새: boat](https://www.minecraft.net/en-us/article/taking-inventory--boat)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|언약궤 (ark-covenant)|[유사 구조·쓰임새: chest](https://www.minecraft.net/en-us/article/block-week-chest)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|제단 (altar)|[유사 구조·쓰임새: campfire](https://www.minecraft.net/en-us/article/taking-inventory--campfire)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|분향단 (incense-altar)|[유사 구조·쓰임새: campfire](https://www.minecraft.net/en-us/article/taking-inventory--campfire)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|성막 (tabernacle)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|장막 (tent)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|성전 (temple)|[유사 구조·쓰임새: door](https://www.minecraft.net/en-us/article/taking-inventory--door)|접근→손 대기→문/부속만 움직임→원위치|건물 전체는 이동·축소하지 않는다|
|성문 (gate)|[유사 구조·쓰임새: door](https://www.minecraft.net/en-us/article/taking-inventory--door)|접근→손 대기→문/부속만 움직임→원위치|건물 전체는 이동·축소하지 않는다|
|성벽 (wall)|[유사 구조·쓰임새: door](https://www.minecraft.net/en-us/article/taking-inventory--door)|접근→손 대기→문/부속만 움직임→원위치|건물 전체는 이동·축소하지 않는다|
|망대 (tower)|[유사 구조·쓰임새: door](https://www.minecraft.net/en-us/article/taking-inventory--door)|접근→손 대기→문/부속만 움직임→원위치|건물 전체는 이동·축소하지 않는다|
|집 (house)|[유사 구조·쓰임새: door](https://www.minecraft.net/en-us/article/taking-inventory--door)|접근→손 대기→문/부속만 움직임→원위치|건물 전체는 이동·축소하지 않는다|
|왕궁 (palace)|[유사 구조·쓰임새: door](https://www.minecraft.net/en-us/article/taking-inventory--door)|접근→손 대기→문/부속만 움직임→원위치|건물 전체는 이동·축소하지 않는다|
|구유 (stable)|[유사 구조·쓰임새: chest](https://www.minecraft.net/en-us/article/block-week-chest)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|무덤 (tomb)|[유사 구조·쓰임새: stone](https://www.minecraft.net/en-us/article/block-week-stone)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|지팡이 (staff)|[유사 구조·쓰임새: stick](https://www.minecraft.net/en-us/article/taking-inventory--stick)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|막대기 (rod)|[유사 구조·쓰임새: stick](https://www.minecraft.net/en-us/article/taking-inventory--stick)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|물매 (sling)|[유사 구조·쓰임새: bow](https://www.minecraft.net/en-us/article/taking-inventory--bow)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|칼 (sword)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--sword)|준비→겨냥/들기→발사/베기→회수|큰 각도 변화와 진행 방향이 일치해야 한다|
|창 (spear)|[유사 구조·쓰임새: trident](https://www.minecraft.net/en-us/article/taking-inventory--trident)|준비→겨냥/들기→발사/베기→회수|큰 각도 변화와 진행 방향이 일치해야 한다|
|단창 (javelin)|[유사 구조·쓰임새: trident](https://www.minecraft.net/en-us/article/taking-inventory--trident)|준비→겨냥/들기→발사/베기→회수|큰 각도 변화와 진행 방향이 일치해야 한다|
|활 (bow)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--bow)|준비→겨냥/들기→발사/베기→회수|큰 각도 변화와 진행 방향이 일치해야 한다|
|화살 (arrow)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--arrow)|준비→겨냥/들기→발사/베기→회수|큰 각도 변화와 진행 방향이 일치해야 한다|
|방패 (shield)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--shield)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|투구 (helmet)|[유사 구조·쓰임새: boots](https://www.minecraft.net/en-us/article/taking-inventory--boots)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|갑옷 (armor)|[유사 구조·쓰임새: boots](https://www.minecraft.net/en-us/article/taking-inventory--boots)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|병거 (chariot)|[유사 구조·쓰임새: minecart](https://www.minecraft.net/en-us/article/taking-inventory--minecart)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|바퀴 (wheel)|[유사 구조·쓰임새: minecart](https://www.minecraft.net/en-us/article/taking-inventory--minecart)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|쇠사슬 (chain)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|차꼬 (fetter)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|밧줄 (rope)|[동일 재질·픽셀 가닥 예시](https://github.com/Donitzo/godot-pixel-rope)|잡기→느슨한 줄→팽팽한 줄/매듭→코일|가닥이 끊기지 않고 늘어진 구간과 장력이 구분되어야 한다|
|닻 (anchor)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|돛 (sail)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|양끝 잡기→펴기/접기→끝자락 지연→정돈|끝자락만 지연되고 손의 고정점은 유지한다|
|노 (oar)|[유사 구조·쓰임새: stick](https://www.minecraft.net/en-us/article/taking-inventory--stick)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|그물 (net)|[유사 구조·쓰임새: string](https://www.minecraft.net/en-us/article/taking-inventory--string)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|낚시 (hook)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|바구니 (basket)|[유사 구조·쓰임새: chest](https://www.minecraft.net/en-us/article/block-week-chest)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|항아리 (jar)|[유사 구조·쓰임새: bowl](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|솥 (pot)|[유사 구조·쓰임새: bowl](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|대접 (bowl)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|잔 (cup)|[유사 구조·쓰임새: bowl](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|주전자 (pitcher)|[유사 구조·쓰임새: bowl](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|대야 (basin)|[유사 구조·쓰임새: bowl](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|등잔 (lamp)|[유사 구조·쓰임새: lantern](https://www.minecraft.net/en-us/article/taking-inventory--lantern)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|등잔대 (lampstand)|[유사 구조·쓰임새: lantern](https://www.minecraft.net/en-us/article/taking-inventory--lantern)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|횃불 (torch)|[유사 구조·쓰임새: candle](https://www.minecraft.net/en-us/article/taking-inventory--candle)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|초 (candle)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--candle)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|향로 (censer)|[유사 구조·쓰임새: campfire](https://www.minecraft.net/en-us/article/taking-inventory--campfire)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|향 (incense)|[유사 구조·쓰임새: campfire](https://www.minecraft.net/en-us/article/taking-inventory--campfire)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|몰약 (myrrh)|[유사 구조·쓰임새: potion](https://www.minecraft.net/en-us/article/taking-inventory--potion)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|향유 (perfume)|[유사 구조·쓰임새: potion](https://www.minecraft.net/en-us/article/taking-inventory--potion)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|떡 (bread)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--bread)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|보리떡 (barley-bread)|[유사 구조·쓰임새: bread](https://www.minecraft.net/en-us/article/taking-inventory--bread)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|만나 (manna)|[유사 구조·쓰임새: bread](https://www.minecraft.net/en-us/article/taking-inventory--bread)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|메추라기 (quail)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→먹이/물 쪽으로 고개→섭취/반응→휴식|말이 없는 동물은 대사를 만들지 않는다|
|물고기 (fish)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→먹이/물 쪽으로 고개→섭취/반응→휴식|말이 없는 동물은 대사를 만들지 않는다|
|곡식 (grain)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|손이 이삭에 닿음→잘린 이삭이 손에 모임→끈으로 묶임|자르기 전후의 이삭과 묶음이 구분되어야 한다|
|밀 (wheat)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|손이 이삭에 닿음→잘린 이삭이 손에 모임→끈으로 묶임|자르기 전후의 이삭과 묶음이 구분되어야 한다|
|보리 (barley)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|손이 이삭에 닿음→잘린 이삭이 손에 모임→끈으로 묶임|자르기 전후의 이삭과 묶음이 구분되어야 한다|
|씨앗 (seed)|[유사 구조·쓰임새: seeds](https://www.minecraft.net/en-us/article/taking-inventory--seeds)|손이 이삭에 닿음→잘린 이삭이 손에 모임→끈으로 묶임|자르기 전후의 이삭과 묶음이 구분되어야 한다|
|가루 (flour)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|반죽 (dough)|[유사 구조·쓰임새: bread](https://www.minecraft.net/en-us/article/taking-inventory--bread)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|누룩 (leaven)|[유사 구조·쓰임새: bread](https://www.minecraft.net/en-us/article/taking-inventory--bread)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|소금 (salt)|[유사 구조·쓰임새: sugar](https://www.minecraft.net/en-us/article/taking-inventory--sugar)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|꿀 (honey)|[유사 구조·쓰임새: honey-bottle](https://www.minecraft.net/en-us/article/taking-inventory--honey-bottle)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|젖 (milk)|[유사 구조·쓰임새: bowl](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|물 (water-supply)|[유사 구조·쓰임새: water](https://www.minecraft.net/en-us/article/block-week-water)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|포도주 (wine)|[유사 구조·쓰임새: potion](https://www.minecraft.net/en-us/article/taking-inventory--potion)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|기름 (olive-oil)|[유사 구조·쓰임새: bowl](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|포도 (grapes)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|포도원 (vineyard)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|포도나무 (vine)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|무화과나무 (fig-tree)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|무화과 (fig)|[유사 구조·쓰임새: bread](https://www.minecraft.net/en-us/article/taking-inventory--bread)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|감람나무 (olive-tree)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|종려나무 (palm)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|백향목 (cedar)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|우슬초 (hyssop)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|갈대 (reed)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|백합 (lily)|[유사 구조·쓰임새: sweet-berries](https://www.minecraft.net/en-us/article/taking-inventory--sweet-berries)|접근→가지 접촉→잎 흔들림/열매 분리→안정|줄기 위치를 유지하고 끝부분만 반응한다|
|겨자씨 (mustard)|[유사 구조·쓰임새: seeds](https://www.minecraft.net/en-us/article/taking-inventory--seeds)|손이 이삭에 닿음→잘린 이삭이 손에 모임→끈으로 묶임|자르기 전후의 이삭과 묶음이 구분되어야 한다|
|열매 (fruit)|[유사 구조·쓰임새: bread](https://www.minecraft.net/en-us/article/taking-inventory--bread)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|상 (table)|[유사 구조·쓰임새: bed](https://www.minecraft.net/en-us/article/taking-inventory--bed)|접근→무게 낮추기→앉기/눕기→일어나기|발과 좌면, 누운 머리와 베개의 접촉을 유지한다|
|침상 (bed)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--bed)|접근→무게 낮추기→앉기/눕기→일어나기|발과 좌면, 누운 머리와 베개의 접촉을 유지한다|
|자리 (mat)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|양끝 잡기→펴기/접기→끝자락 지연→정돈|끝자락만 지연되고 손의 고정점은 유지한다|
|보좌 (throne)|[유사 구조·쓰임새: bed](https://www.minecraft.net/en-us/article/taking-inventory--bed)|접근→무게 낮추기→앉기/눕기→일어나기|발과 좌면, 누운 머리와 베개의 접촉을 유지한다|
|발판 (footstool)|[유사 구조·쓰임새: bed](https://www.minecraft.net/en-us/article/taking-inventory--bed)|접근→무게 낮추기→앉기/눕기→일어나기|발과 좌면, 누운 머리와 베개의 접촉을 유지한다|
|겉옷 (cloak)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|양끝 잡기→펴기/접기→끝자락 지연→정돈|끝자락만 지연되고 손의 고정점은 유지한다|
|옷 (robe)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|양끝 잡기→펴기/접기→끝자락 지연→정돈|끝자락만 지연되고 손의 고정점은 유지한다|
|베옷 (sackcloth)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|양끝 잡기→펴기/접기→끝자락 지연→정돈|끝자락만 지연되고 손의 고정점은 유지한다|
|에봇 (ephod)|[유사 구조·쓰임새: boots](https://www.minecraft.net/en-us/article/taking-inventory--boots)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|흉패 (breastplate)|[유사 구조·쓰임새: boots](https://www.minecraft.net/en-us/article/taking-inventory--boots)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|왕관 (crown)|[유사 구조·쓰임새: boots](https://www.minecraft.net/en-us/article/taking-inventory--boots)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|신발 (sandal)|[유사 구조·쓰임새: boots](https://www.minecraft.net/en-us/article/taking-inventory--boots)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|띠 (belt)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|양끝 잡기→펴기/접기→끝자락 지연→정돈|끝자락만 지연되고 손의 고정점은 유지한다|
|수건 (towel)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|양끝 잡기→펴기/접기→끝자락 지연→정돈|끝자락만 지연되고 손의 고정점은 유지한다|
|휘장 (veil)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|양끝 잡기→펴기/접기→끝자락 지연→정돈|끝자락만 지연되고 손의 고정점은 유지한다|
|커튼 (curtain)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|양끝 잡기→펴기/접기→끝자락 지연→정돈|끝자락만 지연되고 손의 고정점은 유지한다|
|세마포 (linen)|[유사 구조·쓰임새: wool](https://www.minecraft.net/en-us/article/block-week-wool)|양끝 잡기→펴기/접기→끝자락 지연→정돈|끝자락만 지연되고 손의 고정점은 유지한다|
|돌판 (tablet)|[유사 동작: 핵심 자세·정지 유지](https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation)|받치기→펼치기→글줄 따라가기/쓰기→덮기|펼친 면과 손의 작업이 보이고 얼굴을 가리지 않는다|
|책 (book)|[유사 동작: 핵심 자세·정지 유지](https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation)|받치기→펼치기→글줄 따라가기/쓰기→덮기|펼친 면과 손의 작업이 보이고 얼굴을 가리지 않는다|
|편지 (letter)|[유사 동작: 핵심 자세·정지 유지](https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation)|받치기→펼치기→글줄 따라가기/쓰기→덮기|펼친 면과 손의 작업이 보이고 얼굴을 가리지 않는다|
|인장 (seal)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|반지 (signet)|[유사 구조·쓰임새: boots](https://www.minecraft.net/en-us/article/taking-inventory--boots)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|먹 (ink)|[유사 구조·쓰임새: bowl](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|붓 (pen)|[유사 구조·쓰임새: stick](https://www.minecraft.net/en-us/article/taking-inventory--stick)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|동전 (coin)|[유사 구조·쓰임새: diamond](https://www.minecraft.net/en-us/article/taking-inventory--diamond)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|은 (silver)|[유사 구조·쓰임새: diamond](https://www.minecraft.net/en-us/article/taking-inventory--diamond)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|금 (gold)|[유사 구조·쓰임새: diamond](https://www.minecraft.net/en-us/article/taking-inventory--diamond)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|진주 (pearl)|[유사 구조·쓰임새: diamond](https://www.minecraft.net/en-us/article/taking-inventory--diamond)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|보석 (jewel)|[유사 구조·쓰임새: diamond](https://www.minecraft.net/en-us/article/taking-inventory--diamond)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|보물상자 (treasure-chest)|[유사 구조·쓰임새: chest](https://www.minecraft.net/en-us/article/block-week-chest)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|돈주머니 (moneybag)|[유사 구조·쓰임새: chest](https://www.minecraft.net/en-us/article/block-week-chest)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|수금 (lyre)|[유사 구조·쓰임새: note-block](https://www.minecraft.net/en-us/article/block-week-note-block)|받쳐 들기→손/입 접촉→연주→손 회수|악기를 지지하고 연주하는 부분만 움직인다|
|거문고 (harp)|[유사 구조·쓰임새: note-block](https://www.minecraft.net/en-us/article/block-week-note-block)|받쳐 들기→손/입 접촉→연주→손 회수|악기를 지지하고 연주하는 부분만 움직인다|
|소고 (tambourine)|[유사 구조·쓰임새: note-block](https://www.minecraft.net/en-us/article/block-week-note-block)|받쳐 들기→손/입 접촉→연주→손 회수|악기를 지지하고 연주하는 부분만 움직인다|
|나팔 (trumpet)|[유사 구조·쓰임새: goat-horn](https://www.minecraft.net/en-us/article/taking-inventory--goat-horn)|받쳐 들기→손/입 접촉→연주→손 회수|악기를 지지하고 연주하는 부분만 움직인다|
|피리 (flute)|[유사 구조·쓰임새: note-block](https://www.minecraft.net/en-us/article/block-week-note-block)|받쳐 들기→손/입 접촉→연주→손 회수|악기를 지지하고 연주하는 부분만 움직인다|
|제금 (cymbal)|[유사 구조·쓰임새: note-block](https://www.minecraft.net/en-us/article/block-week-note-block)|받쳐 들기→손/입 접촉→연주→손 회수|악기를 지지하고 연주하는 부분만 움직인다|
|맷돌 (millstone)|[유사 구조·쓰임새: stone](https://www.minecraft.net/en-us/article/block-week-stone)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|쟁기 (plow)|[유사 구조·쓰임새: hoe](https://www.minecraft.net/en-us/article/taking-inventory--hoe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|낫 (sickle)|[유사 구조·쓰임새: shears](https://www.minecraft.net/en-us/article/taking-inventory--shears)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|도끼 (axe)|[동일 대상 사용 설명](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|망치 (hammer)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|못 (nail)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|열쇠 (key)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|저울 (scale)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|멍에 (yoke)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|십자가 (cross)|[유사 구조·쓰임새: stained-glass](https://www.minecraft.net/en-us/article/block-week-stained-glass)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|물두멍 (laver)|[유사 구조·쓰임새: bowl](https://www.minecraft.net/en-us/article/taking-inventory--bowl)|입구 잡기→마개 열기/기울이기→수위·흐름→닫기|마개는 분리되고 액체는 입구에서 시작한다|
|화덕 (oven)|[유사 구조·쓰임새: campfire](https://www.minecraft.net/en-us/article/taking-inventory--campfire)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|벽돌 (brick)|[유사 구조·쓰임새: stone](https://www.minecraft.net/en-us/article/block-week-stone)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|돌기둥 (stone-pillar)|[유사 구조·쓰임새: stone](https://www.minecraft.net/en-us/article/block-week-stone)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|사다리 (ladder)|[유사 구조·쓰임새: axe](https://www.minecraft.net/en-us/article/taking-inventory--axe)|잡기→뒤로 힘 모으기→작업부 접촉→반동|작업부와 접촉 지점이 겹쳐야 한다|
|무지개 (rainbow)|[유사 구조·쓰임새: stained-glass](https://www.minecraft.net/en-us/article/block-week-stained-glass)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|별 (star)|[유사 구조·쓰임새: nether-star](https://www.minecraft.net/en-us/article/taking-inventory--nether-star)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|구름 (cloud)|[유사 구조·쓰임새: stained-glass](https://www.minecraft.net/en-us/article/block-week-stained-glass)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|불 (fire)|[유사 구조·쓰임새: candle](https://www.minecraft.net/en-us/article/taking-inventory--candle)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|양 (sheep)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→먹이/물 쪽으로 고개→섭취/반응→휴식|말이 없는 동물은 대사를 만들지 않는다|
|나귀 (donkey)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→먹이/물 쪽으로 고개→섭취/반응→휴식|말이 없는 동물은 대사를 만들지 않는다|
|말 (horse)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→먹이/물 쪽으로 고개→섭취/반응→휴식|말이 없는 동물은 대사를 만들지 않는다|
|비둘기 (dove)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→먹이/물 쪽으로 고개→섭취/반응→휴식|말이 없는 동물은 대사를 만들지 않는다|
|까마귀 (raven)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→먹이/물 쪽으로 고개→섭취/반응→휴식|말이 없는 동물은 대사를 만들지 않는다|
|뱀 (snake)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→먹이/물 쪽으로 고개→섭취/반응→휴식|말이 없는 동물은 대사를 만들지 않는다|
|놋뱀 (bronze-snake)|[유사 구조·쓰임새: stained-glass](https://www.minecraft.net/en-us/article/block-week-stained-glass)|접근→접촉→사용 결과/변형→정돈|고정된 부분과 작동하는 부분을 나누고 원래 크기를 유지한다|
|사자 (lion)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→먹이/물 쪽으로 고개→섭취/반응→휴식|말이 없는 동물은 대사를 만들지 않는다|
|송아지 (calf)|[유사 구조·쓰임새: wheat](https://www.minecraft.net/en-us/article/taking-inventory--wheat)|접근→먹이/물 쪽으로 고개→섭취/반응→휴식|말이 없는 동물은 대사를 만들지 않는다|
