---
# 묶음 6 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs fire-noise-flame
  - node tools/unity.mjs fire-noise-flame
  - node tools/shots.mjs fire-noise-flame
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/fire-noise-flame/**
  - Assets/Shaders/fire-noise-flame.meta
  - web/src/specimens/fire-noise-flame/**
  - web/src/shots/fire-noise-flame/**
  - tools/textures/fire-noise-flame-noise.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: fire-noise-flame 리뷰 반영

`fire-noise-flame` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 텍스처의 이음매와 세로 결, 임포트 설정, 래퍼(태그, Blend, 큐, CBUFFER, XR 매크로, `Cull Off`), 모양 마스크, 단계 1~4 구성, 효과 끄기(마스크를 뺀 사각형 판), 색과 안전 규칙은 리뷰에서 문제가 없었으니 바꾸지 않는다. 이 표본은 갤러리에서 가장 기본이 되는 불(★1)이다. 글은 처음 불 셰이더를 만드는 수강생 눈높이로 쓴다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 무대에 촘촘한 평면 `grid` 가 생겼다 (가이드 4절): Unity Plane 과 같은 10 × 10 크기와 UV 방향에 100 × 100 칸(정점 간격 0.1), y = 0.3 에 크기 1 로 놓여 화면 아래쪽을 호수처럼 덮는다. 웹과 Unity 촬영이 같은 것을 UV 격자로 확인했다.
- `stage.backlit: true` 면 해가 카메라 맞은편 높이 15도에 있다 (가이드 4절). 기본 해는 카메라 뒤 위쪽이라 평평한 수면의 반사광이 카메라로 오지 않는다.
- 메시 무대 `SgInput` 에 정점 색 `color` 가 생겼다 (웹은 흰색, 가이드 4절). 파티클의 Start Color 와 Color over Lifetime 을 받으려면 래퍼에서 `COLOR` 를 넘기고 core 에서 곱한다.
- 가이드에 리뷰에서 나온 규칙이 들어갔다: 3-4절 흐르는 층의 화면 속도 = 오프셋 속도 ÷ 반복 횟수와 움직임 확인 방법(`t=` 두 장), 4절 빛 받는 투명 메시의 `_SURFACE_TYPE_TRANSPARENT` 와 `ZWrite Off` 메시 안의 그리는 순서, 10절 `frac` 정밀도 문구.
- 값 조절 패널은 이제 한글 이름 옆에 속성 이름(`_WaveHeight` 등)을 함께 보여 준다. `label` 에 영문을 따로 넣지 않는다.

## 필수

1. **두 층이 화면에서 거의 같은 속도로 흐른다 (표본의 핵심 결함).** B 층은 UV 를 2 배로 반복한 뒤 오프셋 속도 1.3 을 더해, 화면 속도가 0.65/크기로 A 층(0.6/크기)과 8% 밖에 다르지 않다. 리뷰가 셰이더 식을 그대로 계산해 보니 0.5 초 뒤 무늬를 위로 옮겨 겹친 상관이 0.987 이라 한 층만 흘린 것과 거의 같다. 수강생에게는 "속도가 다른 두 층을 곱하면 끓는다" 가 보이지 않는다. B 층의 화면 속도를 A 의 약 2 배로 하거나 방향을 다르게 하고, 주석에 "화면 속도 = 오프셋 속도 ÷ 반복 횟수" 를 적는다 (가이드 3-4절). 2단계 본문, `goals`, 실수 3, `unity.graph`, core 주석의 "두 배쯤 빠르게" 를 함께 고친다. `live.mjs` 로 2단계와 최종 화면을 `t=1.3` 과 `t=1.8` 두 장씩 찍어 무늬가 단순히 위로 옮겨지지 않고 모양이 바뀌는 것을 확인한다.
2. **Particle System 넣는 단계.** 지금 setup 대로 하면 기본 파티클(초당 10개, 수명 5초, Cone 반지름 1)이 같은 불꽃 약 50개를 흩어 하얗게 뜨고, 정점 알파를 읽지 않아 툭 나타나고 툭 사라진다. setup 은 Quad 하나에 넣는 방법만 남긴다. 이제 메시 무대에 정점 색 `color` 가 있으니 래퍼에서 `COLOR` 를 넘기고 core 에서 색과 알파에 곱해 파티클의 Start Color, Color over Lifetime 이 먹게 한다 (웹은 흰색이라 화면은 그대로다). 파티클로 쓰는 방법은 `unity.pitfalls` 와 `prompt.adaptIdeas` 에 두고, 확인할 수 없는 메뉴나 값은 단정하지 않는다.
3. **`unity.graph` 를 코드와 맞춘다:** B 층 속도 식(지금 글의 "1.3 배" 는 코드와 다르다), 깎기 전 값으로 구한 heat 와 두 `smoothstep` 으로 색을 고르는 식(글대로 깎은 알파로 고르면 속이 거의 노랑이 된다), 너울(`_Wobble`)과 B 층의 가로 오프셋, Unlit 그래프로 만든다는 말.

## 권장

4. 텍스처의 가로줄 평균이 0.46~0.69 로 달라 A 층이 흐를 때 불 넓이가 ±5% (촛불 프리셋 ±12%, 3.3 초 주기)로 오르내린다. 가장 큰 층의 줄 평균을 맞추거나 세로 칸 수를 늘려 맥동을 줄인다.
5. `unity.pitfalls` 에 정렬과 과드로우를 한 구절 넣는다: 더하기 혼합은 불꽃끼리만 순서와 상관없고, 알파 혼합 연기나 유리와 섞이면 중심 거리 정렬로 앞뒤가 뒤바뀔 수 있다. 빈 곳도 Quad 전체를 그려 모바일과 XR 에서 비용이 든다.
6. 문장 고치기: pitfalls 의 "티가 나지 않지만" → "정렬 문제가 생기지 않지만", 실수 4 의 "Bloom 이 없으면 1 에서 잘린다" 는 톤매핑이 있으면 눌린다는 pitfalls 와 맞추기, `meta.ts` 의 "알파를 1 로 두면 효과 끄기 화면처럼" 은 실제로 가장자리 색의 빨간 사각형이다, `inspiredBy.learned` 는 JangaFX 분석 글을 근거로 한 말로 바꾸기.
7. ★1 가독성: pitfalls 의 `"gray"` 기본값 항목(실수 5 와 중복)은 빼고, 실수 3 의 C# 오프셋 누적 설명은 줄인다.

## 끝내기 전에

1. `node tools/check.mjs fire-noise-flame` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 2단계를 `t=1.3` 과 `t=1.8` 로 한 장씩 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
