---
# 묶음 8 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs interior-room-mapping
  - node tools/unity.mjs interior-room-mapping
  - node tools/shots.mjs interior-room-mapping
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/interior-room-mapping/**
  - Assets/Shaders/interior-room-mapping.meta
  - web/src/specimens/interior-room-mapping/**
  - web/src/shots/interior-room-mapping/**
  - tools/textures/interior-room-mapping-rooms.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: interior-room-mapping 리뷰 반영

`interior-room-mapping` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 방 상자 교차(나가는 평면의 `min`, 0 나누기 막기), `normalOS` 주축 면 기저와 `cameraPosOS` 시선(리뷰에서 네 면과 웹·Unity 일치를 확인), 한 점 투시 아틀라스와 생성기의 역연산, 4px 여백, 칸 해시, 단계 1~4, 효과 끄기(그림을 그대로 붙임), C# `InteriorLightsSchedule`, `inspiredBy` 는 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- `meta.shotQuality`(0.4~0.75, 기본 0.75)가 생겼다: 화면을 덮는 잔무늬가 WebP 로 줄지 않는 표본만 내장 촬영 품질을 낮춘다 (가이드 7절 용량 기준).
- 가이드 7절: 화면 전체 정지 무늬의 대비 규칙은 단계 보기 화면에도 적용한다. 비율은 종이 색까지 곱한 최종 색으로 재고 8비트 여유(예: 0.61)를 둔다. 화면 공간 격자의 가장자리는 `fwidth` 대신 칸 크기로 계산한 값으로 부드럽게 한다 (분기 안의 `fwidth` 는 Unity 경고).
- 가이드 3-4절: 스프라이트 정점 표본은 값이 월드 유닛이라 `unity.setup` 에 Pixels Per Unit(무대 = 텍스처 높이 / 2)을 적는다. 래퍼 예시에 `UnityFlipSprite` 와 밀기 전 `o.positionWS` 가 들어갔다.
- 가이드 4절 `cameraPosOS`: 직교 카메라에서는 시선이 카메라 정면 축과 나란하므로 `positionOS - cameraPosOS` 시선이 틀린다. 래퍼에서 `unity_OrthoParams.w > 0.5` 면 정면 축으로 바꾸거나 `unity.pitfalls` 에 적는다.

## 필수

1. `unity.pitfalls` 의 압축 근거를 고친다: 아틀라스 칸이 128px 경계에 맞고 여백이 4px 라 BC 4×4 블록과 밉은 방 사이에 걸치지 않는다 (Unity 촬영은 압축본인데도 번지지 않았다). "ASTC 6×6 처럼 4 의 배수가 아닌 블록은 칸 경계에 걸쳐 이웃 방 색을 섞는다. BC 도 얇은 선과 넓은 단색면이 뭉개지므로 None 을 권한다" 로 쓴다.
2. 직교 카메라 (가이드 4절의 새 문장): 래퍼에서 `unity_OrthoParams.w > 0.5` 면 `cameraPosOS` 를 정면 축 기준(`positionOS - TransformWorldToObjectDir(GetViewForwardDir(), false)`)으로 바꾼다. 웹 무대는 원근 카메라라 화면은 그대로다. 아이소메트릭 도시 게임에서 쓰인다는 점과 함께 `unity.pitfalls` 에 한 줄 적는다.

## 권장

3. 깊은 방 촬영(`captures` 의 `deep-room`)은 무대 시작 각도(30도)에서 두 면 모두 옆벽만 보여 효과 끄기처럼 납작하다. 촬영을 상점 진열창(큰 창, 얕은 방)으로 바꾸거나 빼고, 깊은 방 프리셋 `look` 에 "정면으로 돌아올 때" 를 덧붙인다.
4. 데모 주석의 "여러 방이 1초 안에 몰려 켜지지 않는다" 를 "한 번에 한두 방씩" 으로 (보이는 방 약 18개에 최고 약 2.4방/초).
5. "큐브맵판은 방 깊이가 상자 비율에 묶인다" 는 근거가 없으니 완화하거나 뺀다. setup 4단계에 X 와 Z 스케일이 다르면 창 수 하나로 두 쌍의 면을 모두 맞출 수 없다는 한 구절을 더한다.

## 끝내기 전에

1. `node tools/check.mjs interior-room-mapping` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 단계 2, 효과 끄기, 바뀐 촬영 하나 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
