# 픽셀 월드 음식 친구 동작 참고

2026-10-27 검토. 자료의 도안은 복사하지 않고, 동작 원리와 프레임 구성만 참고했다.

- [ArtStation — Roll Animation Tutorial](https://www.artstation.com/artwork/LRGv4l): 구르기 동작의 회전 연속성과 둥근 물체가 바닥을 따라 구르는 축을 참고했다.
- [Lospec — Pixel Art Animation Tutorials](https://lospec.com/pixel-art-tutorials/tags/animation): 픽셀 애니메이션의 실루엣 가독성과 프레임 간 형태 일관성을 참고했다. 김밥의 16개 회전 샘플에 고정 팔레트와 동일한 얼굴 배치를 유지한다.
- [Sandro Maglione — Pixel Art Character Animations Guide](https://www.sandromaglione.com/articles/pixel-art-character-animations-guide): 스프라이트 주기의 읽기 쉬운 자세 변화와 캐릭터 실루엣을 참고했다.

적용한 구성은 둥근 김밥 단면과 16단계 회전이다. 좌우 이동은 단면 평면에서 굴리고, 상하 이동은 별도 축으로 앞·뒤 면이 넘어가며 옆면이 보이는 프레임을 사용한다. 위쪽 경로는 아래 가장자리에서 위로, 아래쪽 경로는 위 가장자리에서 아래로 넘어간다. 각 프레임은 최근접 픽셀로 직접 계산해 색이 섞이거나 가장자리가 흐려지지 않게 하고, 바닥 그림자는 수평으로 유지한다. 회전은 월드 이동 거리로부터 계산한다.
