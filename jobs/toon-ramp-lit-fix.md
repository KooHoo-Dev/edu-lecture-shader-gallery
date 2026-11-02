---
# 묶음 1 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과를 main 에 먼저 합쳐 앱 수정(촬영 회전 등)과 함께 고친다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs toon-ramp-lit
  - node tools/unity.mjs toon-ramp-lit
  - node tools/shots.mjs toon-ramp-lit
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/toon-ramp-lit/**
  - Assets/Shaders/toon-ramp-lit.meta
  - web/src/specimens/toon-ramp-lit/**
  - web/src/shots/toon-ramp-lit/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: toon-ramp-lit 리뷰 반영

`toon-ramp-lit` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 표본의 나머지 구조와 동작은 바꾸지 않는다.

## 필수

1. **효과 끄기가 기본 화면과 거의 같다.** 지금 `SG_OFF` 는 띠 경계가 조금 밀리고 1~2픽셀 색 줄이 생길 뿐이다. 진짜 흔한 실수이면서 한눈에 보이는 것으로 바꾼다: 조명이 끝난 최종 색(`_BaseColor.rgb * i.lighting`)을 채널마다 띠로 끊는 것(Lit 결과에 Posterize). 그늘이 검게 떨어지고 빛 쪽 색이 덩어리로 깨지며 그늘 색 슬라이더가 먹지 않는다. `offNote` 와 해당 mistakes 항목의 증상 설명을 화면에 맞춘다. `node tools/live.mjs` 로 기본과 효과 끄기를 찍어 차이가 분명한지 본다.
2. **"빛이 뒤쪽까지 감싼다"는 글이 화면과 맞지 않는다** (그늘 넓이 hint, storybook 프리셋 look, `core.hlsl` 주석). 첫 경계는 `dot = s + (1 - s) / N` 이고 (s 는 그늘 넓이, N 은 띠 수) 지금 범위에서는 명암선(dot = 0)을 넘지 않는다. "경계가 명암선 쪽으로 내려가 빛 면이 넓어진다" 처럼 사실대로 고친다. 넘게 하더라도 Unity 에서는 물체가 자기 뒤에 드리운 그림자가 그 띠를 자른다는 점을 Unity pitfalls 에 적거나, `_ShadeShift` 최소값을 -0.25 정도로 올린다. 둘 중 하나를 고르고 보고에 적는다.
3. **램프 텍스처 안내** (mistakes 의 램프 텍스처 항목). 이 래퍼에는 `SG_TEX` 정의가 없으니 그대로 따르면 컴파일이 안 된다. `SAMPLE_TEXTURE2D(_RampTex, sampler_RampTex, float2(level, 0.5))` 로 쓰라고 하거나 가이드 3-4절의 세 줄(`TEXTURE2D`, `SAMPLER`, `#define SG_TEX`)을 적는다. "Point 필터로 칼같이" 는 계단 경계 실수를 다시 부르므로 그 점을 함께 적는다.
4. **4단계 body**: 그늘 색은 `_ShadeColor` 혼자가 아니라 `_BaseColor × _ShadeColor` 다. 고친다.

## 권장

5. **주광원 처리** (`ToonRampLit.shader` Forward 패스). 기준 샘플을 이렇게 고쳤으니 같게 맞춘다:

   ```hlsl
   Light light = GetMainLight(TransformWorldToShadowCoord(v.positionWS), v.positionWS, half4(1, 1, 1, 1));
   float3 lightColor = light.color * light.distanceAttenuation * light.shadowAttenuation;
   ```

   인자 하나짜리는 그림자 거리 페이드를 하지 않고, `distanceAttenuation` 은 광원 Culling Mask 에서 빠진 물체에 0 이다. 받는 그림자를 감쇠로 읽는 부분이 이 변경과 맞는지 확인한다.
6. **받는 그림자는 지금 갤러리 화면 어디에도 안 보인다** (무대에 그림자를 드리울 물체가 없다). 2단계 body 처럼 받는 그림자를 말하는 문장에는 "(Unity 에서)" 를 붙인다.
7. **사소한 것**: Unity pitfalls 의 Intensity 설명은 "빛 색의 가장 큰 채널 × Intensity" 로, 광원이 Baked 면 물체 전체가 그늘 색이 된다는 점을 더한다. 구를 "몸" 이라고 부르는 곳은 "공" 이나 "표면" 으로. `unity.verify` 는 가이드대로 한 문장으로. 계단 경계 mistakes 의 "1 픽셀" 은 "1~2 픽셀" 로. `unity.graph` 에 Blackboard 에 `_MAIN_LIGHT_SHADOWS` 계열 키워드를 넣어야 그림자 감쇠가 1 이 아니라는 점을 더한다.

## 끝내기 전에

1. `node tools/check.mjs toon-ramp-lit` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 바꾼 단계를 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것, 2번에서 고른 방법, 직접 확인하지 못한 것을 적는다.
