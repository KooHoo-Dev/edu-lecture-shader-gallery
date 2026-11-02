---
# 묶음 4 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs water-depth-foam
  - node tools/unity.mjs water-depth-foam
  - node tools/shots.mjs water-depth-foam
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/water-depth-foam/**
  - Assets/Shaders/water-depth-foam.meta
  - web/src/specimens/water-depth-foam/**
  - web/src/shots/water-depth-foam/**
  - tools/textures/water-depth-foam-noise.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: water-depth-foam 리뷰 반영

`water-depth-foam` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. depthDelta 계산, 혼합과 정렬, 안개 pitfall, linearGrey 기본값, 흐름 방향, 단계 4개, 효과 끄기는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 가이드에 리뷰에서 나온 규칙이 들어갔다. 읽고 따른다: 3-4절 텍스처 반복을 range 로 노출, 4절 XR 의 화면 중심(uv 0.5 는 눈 정면이 아님)과 래퍼의 distanceAttenuation 주석, 5절 `steps` 의 마지막 단계와 `unity.graph` 의 Custom Function 형식과 `thumbnail` 의 쓰임, 6절 머티리얼 기본값과 공유 머티리얼 제한기의 `static`, 7절 포화된 빨강의 정의와 느린 맥동.
- 링크 쿼리 `t=<초>` 로 웹 무대 시간을 멈춘 채 찍을 수 있다 (가이드 8절). `live.mjs` 는 한 번에 `--query` 하나만 받는다.
- 가이드 4절의 Depth Priming 설명을 바로잡았다 (프라이밍은 두 번째 패스를 ZTest Equal 로 덮어써 사라지게 한다. 자기 겹침은 Deferred 순서와 여러 렌더러·서브메시에서 생긴다). `depthDelta` 정의는 눈 깊이 차로 고쳤다. '그대로 넣기' 프롬프트는 이제 linear·point 텍스처에 Compression None 단계를, Depth 설정에 Depth Texture Mode 안내를 자동으로 넣는다.

## 필수

1. **각도 설명이 반대**: `mistakes` 2 의 "카메라를 낮추면 거품 띠가 넓어지고" 는 대부분 반대다. 바다 쪽에서 물가를 보면 낮게 볼수록 depthDelta 가 커져 띠가 좁아지고, 해변에서 바다를 보면 시선이 물가 경사에 가까워질수록 거품이 사라진다. 수직 벽만 월드 폭이 넓어지지만 화면에서는 눌려 좁아진다. "낮게 볼수록 열린 물은 탁해지고 완만한 물가의 띠는 좁아진다" 처럼 고치고 `_FoamWidth` hint 와 맞춘다. 가이드 4절의 새 `depthDelta` 정의(눈 깊이 차)를 따른다.
2. **압축**: 노이즈 텍스처의 Compression None 이 setup 에 없다. 이제 '그대로 넣기' 프롬프트는 자동으로 넣지만 `unity.setup` 2 에도 적는다. core 가 한 텍셀 차이에 ×10 을 곱해 법선을 만들고 반짝임에 pow 500 을 써서, 기본 압축(BC1, ASTC)이면 가까운 수면의 물결과 반짝임이 각져 보일 수 있다 (`flow-map-liquid` 처럼 적는다).

## 권장

3. `core.hlsl` 의 고정 `128.0` 대신 CBUFFER 에 있는 `_NoiseTex_TexelSize.x` 를 쓴다. 다른 크기의 노이즈로 바꿔도 물결 세기가 같게.
4. `mistakes` 1 의 "거품이 전혀 없다" 는 Render Graph 경로(6.3 기본)에서 확인되지 않았다. 증상을 "한 색으로 막히거나 엉뚱한 곳에 거품" 으로 넓힌다.
5. `clear-pool` 프리셋의 "잠긴 상자 면이 또렷이" 는 Unity 촬영(바닥 무늬 안 보임, 상자 희미)과 맞지 않는다. "밝고 옅은 물빛" 처럼 고친다.
6. pitfalls 보강: 물빛도 조명을 받지 않아 밤이나 그늘에서 그대로다. 큰 수면은 중심점으로 투명 정렬되어 물 위의 반투명 파티클이 물에 덮일 수 있다 (Sorting Priority 로 조정).
7. `mistakes` 3 의 "화면에 붙어 있다" 는 "엉뚱한 곳에 생기고 카메라를 따라 바뀐다" 가 정확하다.
8. `_RippleStrength` hint 의 "0 이면 반짝임이 한 점으로 모인다" 는 그 점이 무대의 공 뒤에 가려 보이지 않는다. 화면에서 보이는 대로 쓴다.

## 끝내기 전에

1. `node tools/check.mjs water-depth-foam` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 단계, 프리셋 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
