# 픽셀 월드 음식 친구 동작 참고

2026-10-27 검토. 자료의 도안은 복사하지 않고, 동작 원리와 프레임 구성만 참고했다.

- [ArtStation — Roll Animation Tutorial](https://www.artstation.com/artwork/LRGv4l): 구르기 동작의 회전 연속성과 몸을 말아 중심을 작게 보이게 하는 흐름을 참고했다. 김밥은 접촉 프레임에서 몸을 압축하고 팔다리를 몸 가까이 모은다.
- [Lospec — Pixel Art Animation Tutorials](https://lospec.com/pixel-art-tutorials/tags/animation): 픽셀 애니메이션의 실루엣 가독성과 프레임 간 형태 일관성을 참고했다. 김밥의 16개 회전 샘플에 고정 팔레트와 동일한 얼굴 배치를 유지한다.
- [Sandro Maglione — Pixel Art Character Animations Guide](https://www.sandromaglione.com/articles/pixel-art-character-animations-guide): 스프라이트 주기의 읽기 쉬운 자세 변화와 캐릭터 실루엣을 참고했다.

적용한 구성은 16단계 회전, 접촉 시 가로 압축, 공중 구간의 가벼운 늘림, 안쪽으로 접는 팔·다리다. 회전은 월드 이동 거리로부터 계산해 프레임이 튀지 않게 한다.
