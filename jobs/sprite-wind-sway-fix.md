---
# 묶음 8 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 4
verify:
  - node tools/check.mjs sprite-wind-sway
  - node tools/unity.mjs sprite-wind-sway
  - node tools/shots.mjs sprite-wind-sway
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/sprite-wind-sway/**
  - Assets/Shaders/sprite-wind-sway.meta
  - web/src/specimens/sprite-wind-sway/**
  - web/src/shots/sprite-wind-sway/**
  - tools/textures/sprite-wind-sway-grass.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: sprite-wind-sway 리뷰 반영

`sprite-wind-sway` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 래퍼의 정점 순서(UnityFlipSprite → 월드 → 밀기 전 positionWS → sgVertex → TransformWorldToHClip, 두 패스 공유), 선형 uv.y 마스크와 월드 x 위상, 픽셀 단계 휨(`ddx` 비율, 0 나누기 막기, 0~1 밖 알파 0), 풀 텍스처, 세 덤불 층, 효과 끄기, 밀기 이벤트와 C# `GrassPush2D`, 빈 `inspiredBy` 는 바꾸지 않는다. 리뷰에서 웹과 Unity 가 같게 흔들리고 뿌리가 고정됨을 확인했다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- `meta.shotQuality`(0.4~0.75, 기본 0.75)가 생겼다: 화면을 덮는 잔무늬가 WebP 로 줄지 않는 표본만 내장 촬영 품질을 낮춘다 (가이드 7절 용량 기준).
- 가이드 7절: 화면 전체 정지 무늬의 대비 규칙은 단계 보기 화면에도 적용한다. 비율은 종이 색까지 곱한 최종 색으로 재고 8비트 여유(예: 0.61)를 둔다. 화면 공간 격자의 가장자리는 `fwidth` 대신 칸 크기로 계산한 값으로 부드럽게 한다 (분기 안의 `fwidth` 는 Unity 경고).
- 가이드 3-4절: 스프라이트 정점 표본은 값이 월드 유닛이라 `unity.setup` 에 Pixels Per Unit(무대 = 텍스처 높이 / 2)을 적는다. 래퍼 예시에 `UnityFlipSprite` 와 밀기 전 `o.positionWS` 가 들어갔다.
- 가이드 4절 `cameraPosOS`: 직교 카메라에서는 시선이 카메라 정면 축과 나란하므로 `positionOS - cameraPosOS` 시선이 틀린다. 래퍼에서 `unity_OrthoParams.w > 0.5` 면 정면 축으로 바꾸거나 `unity.pitfalls` 에 적는다.

## 필수

1. `unity.setup` 2단계에 Pixels Per Unit 64 (텍스처 높이 128 이 2 유닛)를 넣는다. 기본값 100 이면 덤불이 0.96×1.28 유닛으로 작아져 같은 값이 약 1.56 배 세게 보이고, 좌우 여백이 0.22 유닛으로 줄어 폭풍과 밀기가 겹치면 바깥 잎이 사각형 가장자리에서 잘린다. Scale 에 관한 pitfall 에 PPU 도 같은 영향이라고 덧붙인다.

## 권장

2. 썸네일과 폭풍 글: 돌풍이 쏠림까지 곱해 폭풍 세기가 0.44~1.56 사이에서 바뀌므로 "늘 깊이 누운" 은 보장되지 않는다. `thumbnail: 'pushed'` 로 바꾸고 폭풍 look 에서 "늘" 을 빼고 "돌풍이 약할 때는 덜 눕는다" 로 고친다.
3. `_Lean` hint 의 "음수면 왼쪽(바람)" 을 "쏠림만 바뀌고 돌풍은 늘 오른쪽으로 흐른다" 로 고친다.
4. `adaptIdeas` 의 "`Shader.SetGlobalFloat` 한 줄로" 를 고친다 (`_WindStrength` 는 머티리얼 속성이라 전역 값이 덮지 못한다). "전역 바람 값을 하나 두어 날씨에 따라 바꾸고 싶다" 로.
5. `unity.graph`: Shader Graph 의 Fragment Position(World) 은 민 뒤 위치라 위상과 폭 비율이 래퍼와 다르다. 밀기 전 x 는 Custom Interpolator 로 넘기라고 적는다. pitfall 의 "돌린 스프라이트" 에 "휨은 돌리지 않은 스프라이트 전제" 를 덧붙인다. `offNote` 에 "재생하면" 을 넣고, 웹 무대에는 땅이 없으니 "땅 위를 미끄러진다" 보다 "뿌리째 떠다닌다" 로. references 에 UUM-15015 이슈 URL 을 더한다.

## 끝내기 전에

1. `node tools/check.mjs sprite-wind-sway` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 밀기, 효과 끄기 burst 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
