---
# 묶음 2 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs flow-map-liquid
  - node tools/unity.mjs flow-map-liquid
  - node tools/shots.mjs flow-map-liquid
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/flow-map-liquid/**
  - Assets/Shaders/flow-map-liquid.meta
  - web/src/specimens/flow-map-liquid/**
  - web/src/shots/flow-map-liquid/**
  - tools/textures/flow-map-liquid-flow.mjs
  - tools/textures/flow-map-liquid-pattern.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: flow-map-liquid 리뷰 반영

`flow-map-liquid` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 위상 두 개를 섞는 수학, 플로 맵 디코드, 단계 3개, 효과 끄기, 래퍼의 나머지 부분은 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 웹 `plane` 의 UV 가 Unity 기본 Plane 과 같아졌다 (u 는 −X, v 는 −Z 쪽으로 커진다. 위에서 보면 180도 돌아 있다). 웹과 Unity 에서 UV 를 색으로 칠해 촬영해 확인했다. 그래서 웹 화면의 배치가 구현 때 본 것과 180도 다르다.
- mesh 무대의 `cylinder` 는 웹과 Unity 모두 크기 0.8, 높이 0.8 에 놓여 윗끝까지 화면에 들어온다.
- 단계 보기에서 투명 양면 메시는 그동안만 깊이를 써서 앞면이 보인다 (뒷면이 앞면을 덮던 세로 경계가 없어졌다).
- `tools/check.mjs` 가 1인자 `GetMainLight(TransformWorldToShadowCoord(..))` 와, sRGB 를 끈 텍스처(`linear: true`)의 `"gray"` 기본값을 오류로 잡는다. 지금 이 표본은 check 에 실패한다.
- 가이드에 Plane UV 방향(4절), `linearGrey`(3-4절), 3인자 `GetMainLight`(래퍼 규칙), 속도를 바꾸면 무늬가 튄다는 점과 `frac`(10절), 안개 방침(4절 알파의 뜻 아래)이 들어갔다. 읽고 따른다.

## 필수

1. **그림자 형식**: `.shader` 의 `GetMainLight(TransformWorldToShadowCoord(v.positionWS))` 를 디졸브 래퍼와 같은 `GetMainLight(TransformWorldToShadowCoord(v.positionWS), v.positionWS, half4(1, 1, 1, 1))` 로 바꾼다. 1인자 형식은 그림자 거리 페이드와 Shadowmask 가 빠져, 넓은 강 평면에서 Shadow Max Distance 지점에 그림자가 선을 긋고 끊긴다.
2. **Plane UV 글**: 웹이 이제 Unity 와 같은 UV 다. `node tools/live.mjs` 로 1단계를 다시 찍어 보고 1단계 `body` 의 위치 묘사(어느 쪽이 빠른지, 어느 쪽으로 도는지)를 지금 화면에 맞게 고친다. `tools/textures/flow-map-liquid-flow.mjs` 머리말의 "180도 돌려도 같은 모양" 은 틀렸다. 같은 것은 도는 방향뿐이고 굽이 노이즈 때문에 배치는 중심 대칭으로 바뀐다. `unity.pitfalls` 의 "다를 수 있으니" 는 단정형으로 쓴다: 기본 Plane 은 위에서 볼 때 UV 가 180도 돌아 있다(u→−X, v→−Z). 텍스처 위쪽으로 흐르게 그린 강 맵은 기본 Plane 에서 카메라(−Z) 쪽으로 흐른다. Y 180도 회전이나 Quad 로 맞춘다.
3. **게임명**: `references` 라벨 "Water Flow in Portal 2" 에 게임명이 있다. 게임명은 `inspiredBy` 에만 쓴다 (가이드 7절). "Vlachos: 물 흐름 (SIGGRAPH 2010)" 처럼 바꾼다.
4. **빈 칸 기본값**: `_FlowTex` 기본값 `"gray"` 는 Linear 프로젝트에서 약 0.21 로 읽혀 텍스처 칸이 비면 표면 전체가 대각선으로 흐른다. `"linearGrey"` 로 바꾼다.
5. **PNG 크기**: `FlowMapLiquidFlow.png` 가 32KB 를 넘어 경고가 난다. 흐름은 부드러우므로 64 정도로 줄여도 Bilinear 로 충분한지 화면으로 확인하고 줄인다. 아래 권장 6번을 택하면 B 채널까지 합친 크기로 32KB 이하를 맞춘다.

## 권장

6. **이어 붙인 평면의 이음매**: `flowNoise(i.uv * 7.0)` 는 0~1 에서 반복하지 않아, 평면을 이어 깔면 경계에서 위상이 어긋난다 (가장자리 흐름 0.1~0.22 에서 무늬가 약 0.08 타일 엇나간다). 해시 칸 번호를 7 로 감싸거나, 지금 0 인 플로 맵 B 채널에 반복 노이즈를 담는다. 후자는 ALU 노이즈가 없어져 adaptIdeas 의 모바일 경량화와도 맞는다. `_PatternScale` 의 step 0.5 도 비정수 반복을 허용해 이웃 평면 사이에 이음매를 만든다. 정수 step 으로 하거나 함정으로 적는다. 고친 쪽에 맞춰 `mistakes` 의 이음매 항목 해결책을 완전하게 쓴다.
7. `mistakes` 의 "왼쪽 아래로 미는 흐름" 은 UV 기준이다. "UV 의 (−u, −v) 대각선 쪽" 처럼 UV 로 쓴다 (기본 Plane 에서는 +X, +Z 쪽이 된다).

## 끝내기 전에

1. `node tools/check.mjs flow-map-liquid` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 1단계(플로 맵), 프리셋 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
