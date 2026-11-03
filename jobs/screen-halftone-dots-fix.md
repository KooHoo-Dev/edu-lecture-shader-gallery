---
# 묶음 8 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 6
verify:
  - node tools/check.mjs screen-halftone-dots
  - node tools/unity.mjs screen-halftone-dots
  - node tools/shots.mjs screen-halftone-dots
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/screen-halftone-dots/**
  - Assets/Shaders/screen-halftone-dots.meta
  - web/src/specimens/screen-halftone-dots/**
  - web/src/shots/screen-halftone-dots/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: screen-halftone-dots 리뷰 반영

`screen-halftone-dots` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 선형 휘도 덮임과 `sqrt` 반지름, 칸 중심 한 번 읽기, 화면비 보정 정사각 칸, CMYK 각도 `#define` 고정, 모드 셋, `time` 을 쓰지 않는 것, 효과 끄기(선형 반지름), 래퍼 구조, 빈 `inspiredBy` 는 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- `meta.shotQuality`(0.4~0.75, 기본 0.75)가 생겼다: 화면을 덮는 잔무늬가 WebP 로 줄지 않는 표본만 내장 촬영 품질을 낮춘다 (가이드 7절 용량 기준).
- 가이드 7절: 화면 전체 정지 무늬의 대비 규칙은 단계 보기 화면에도 적용한다. 비율은 종이 색까지 곱한 최종 색으로 재고 8비트 여유(예: 0.61)를 둔다. 화면 공간 격자의 가장자리는 `fwidth` 대신 칸 크기로 계산한 값으로 부드럽게 한다 (분기 안의 `fwidth` 는 Unity 경고).
- 가이드 3-4절: 스프라이트 정점 표본은 값이 월드 유닛이라 `unity.setup` 에 Pixels Per Unit(무대 = 텍스처 높이 / 2)을 적는다. 래퍼 예시에 `UnityFlipSprite` 와 밀기 전 `o.positionWS` 가 들어갔다.
- 가이드 4절 `cameraPosOS`: 직교 카메라에서는 시선이 카메라 정면 축과 나란하므로 `positionOS - cameraPosOS` 시선이 틀린다. 래퍼에서 `unity_OrthoParams.w > 0.5` 면 정면 축으로 바꾸거나 `unity.pitfalls` 에 적는다.

## 필수

1. **용량 (병합 차단).** 촬영이 default 64KB, comic-cmyk 86KB 로 표본당 gzip 45KB 기준의 3배를 넘는다. 웹 무대를 720×405 WebP 로 재 보니 줄 수 60 은 품질 0.75 에서 66KB, 30 은 40KB, 품질 0.5 에서 40 줄 37KB, 30 줄 30KB 였다. 기본 `_Rows` 를 36 으로 낮추고(1080p 에서 칸 30px), `captures` 와 `thumbnail` 을 빼고(기본 촬영 한 장), `shotQuality: 0.5` 를 둔다. 줄 수 hint 와 글의 칸 크기 숫자를 새 기본값에 맞춘다.
2. **Unity 경고 7개를 없앤다.** 다른 표본은 모두 경고 0 이다. `halftoneInkFilter` 의 모드 분기 안에서 `fwidth` 와 화면 읽기를 써서 난 경고로 보인다. 점 가장자리 폭은 `fwidth(d)` 대신 분기 밖에서 구한 해석값(화면비를 보정한 칸 좌표에서 한 픽셀은 `_Rows × texelSize.y` 칸)으로 바꾼다. 화면 읽기는 분기 밖에서 한 번 하거나 LOD 0 으로 읽는다. 검증의 `unity.mjs` 출력에서 경고 0 을 확인한다.
3. **단계 보기도 대비 규칙을 지킨다.** 단계 3 이 흰 종이에 검정 점(대비 100%)인 화면 전체 정지 점 격자다 (CMYK 단계도 하한 없이 순수 잉크를 겹친다). 단계 3 출력에 하한을 건다 (`lerp(1, 0.6, mask)` 처럼 점을 연한 회색으로, 또는 최종과 같은 잉크 하한을 거쳐). 단계 1 의 칸 경계 검정↔노랑도 어둡게 낮춘다. 본문의 "흰 종이에 검은 점" 을 고친다.

## 권장

4. 하한을 종이를 곱한 뒤의 비율 `L(종이 × 잉크) ≥ (1 - s) × L(종이)` 로 걸고 작은 여유(0.61)를 둔다. 지금은 0.597~0.599 로 8비트에서 60% 아래로 내려가고, 색이 강한 종이·잉크 조합은 0.57 까지 내려간다.
5. 글 정확도: 단계 1 본문과 core 173행 주석의 꼭짓점 설명 (45도에서 칸 좌표 (0,0) 은 마름모의 아래 꼭짓점, (1,1) 이 위, 빨강이 오른쪽), "하늘처럼 이미 밝은 칸 색은 그대로" (무대 하늘의 선형 밝기 0.379 는 하한 0.6 아래라 흰색 쪽으로 오른다. 그대로 남는 것은 선형 0.6 이상 하이라이트뿐이고 기본값에서 색이 옅어진다고 솔직히 적는다), `unity.verify` 의 "밝은 하늘에는 작은 점" (이 무대 하늘은 칸의 2/3 크기 점, 작은 점은 공의 밝은 윗부분), core 56행 "선형 밝기를 써야 멀리서 본 밝기가 원본과 맞는다" (잉크 세기 1 일 때만).
6. 3 픽셀 하한을 `smoothstep(3, 4, 칸 픽셀)` 로 (지금 `smoothstep(2, 3)` 이라 2.3px 칸에서 무늬가 26% 남는다).

## 끝내기 전에

1. `node tools/check.mjs screen-halftone-dots` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본(줄 수 36), 단계 3, 효과 끄기, CMYK 프리셋 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
