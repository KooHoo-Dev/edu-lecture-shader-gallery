---
# 묶음 8 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
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

# 표본 구현: screen-halftone-dots

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/screen-crt-scanline/` 와 `web/src/specimens/screen-crt-scanline/meta.ts` (전체 화면 무대, 화면 공간 무늬와 정지 줄무늬 안전 규칙. C# 은 두지 않는다). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "31. screen-halftone-dots" 카드와 7절 결정 표.

## 표본별

- ID `screen-halftone-dots`, 파일과 셰이더 이름 `ScreenHalftoneDots`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (하프톤 망점, 그룹 G, 순서 5, 난이도 2).
- 무대: 전체 화면, `stage.bright: true`, Requirements 없음, C# 없음, 이벤트 없음. 시간(`time`)을 쓰지 않는다 (점이 움직이지 않는다). 자동 데모는 두지 않는다 (점 크기가 계속 바뀌면 정지 무늬 규칙을 벗어난다. 데모가 없다는 경고는 받아들인다).
- 안전(먼저 읽을 것): 가이드 7절의 정지 줄무늬 규칙과 점 격자 문장. 잉크 = 종이 × (1 - `_InkStrength`), 기본 `_InkStrength` 0.4 로 잉크가 종이의 60% 이상 밝기. 평평한 면에서 점 안과 점 밖의 선형 밝기 비로 확인한다. 신문 흑백처럼 대비가 높은 모양은 프리셋에만 두고 `captures` 는 기본값 기준 촬영으로 한다. 기본 `_Rows` 는 1080p 에서 칸이 15 픽셀 이상이 되게 둔다. `unity.pitfalls` 에 게임 옵션으로 끌 수 있게 하라고 적는다.
- 효과의 핵심: (1) 화면비를 보정한 좌표를 각도만큼 돌리고 `_Rows`(화면 높이를 몇 줄 칸으로 나눌지)로 칸을 나눈다. 칸 크기를 픽셀이 아니라 줄 수로 정해 웹, Unity 촬영, 1080p 에서 같은 모양이 나오게 한다. 칸이 3 픽셀 아래로 내려가면 원본으로 섞는 하한을 코드에 둔다. (2) 칸 중심 한 점에서 화면 색을 읽는다. (3) 선형 밝기로 덮임(잉크 비율)을 구하고 반지름은 덮임의 제곱근에 비례하게 해 점 면적이 덮임과 맞게 한다. (4) `fwidth` 로 원 가장자리를 1 픽셀 부드럽게. 모드 select: 흑백 한 판, 칸 색 점, CMYK 네 판(판 각도 15·75·0·45 고정, 겹친 판이 로제트 무늬). 조절 값: 모드, 줄 수, 각도(`showWhen` 흑백·칸 색), 점 굵기 보정, 잉크 세기, 종이 색, 잉크 색(`showWhen` 흑백).
- 프리셋: 신문 흑백(잉크 거의 검정, 대비 높음, 프리셋으로만), 만화 인쇄 CMYK(크림 종이), 팝아트 큰 점(칸 색, 각도 0, 큰 칸), 은은한 인쇄 질감(CMYK, 촘촘하게, 잉크 약하게).
- 단계 보기 후보: 돌린 칸 격자(칸 안 좌표를 빨강·초록, 화면비와 상관없이 정사각인지), 칸 중심에서 읽은 색(모자이크), 점 마스크(흑백 판). 마지막 단계가 최종 화면과 같으면 넣지 않는다.
- 효과 끄기: 반지름을 밝기에 선형으로 둔 흔한 실수 (`r = 0.5 × (1 - 밝기)`). 면적은 그 제곱이라 중간 톤 잉크가 모자라 화면 전체가 밝고 색이 빠진다. 픽셀마다 샘플하는 실수(물체 경계에서만 점이 잘림)와 sRGB 값으로 덮임을 계산하는 실수는 `mistakes` 에 둔다.
- `unity.pitfalls` 후보: 주입 지점(Bloom·톤 매핑 뒤에 걸려면 After Rendering Post Processing, 순서는 확인하지 않음으로), Screen Space - Overlay 캔버스 UI 는 덮이지 않는다, XR 은 끄기를 권한다, 모바일 비용(샘플 1~4 번), 안전 옵션.
- 용량: 촬영이 화면을 덮는 잔무늬라 16KB 경고를 넘기 쉽다. `captures` 는 두 장 이내.
- `inspiredBy`: 빈 배열 (화면 후처리 대표작 미확인. Hi-Fi RUSH 는 표면 음영이고 근거가 제3자 노트뿐이라 넣지 않는다). 게임명은 어디에도 쓰지 않는다. `references` 는 카드의 Unity Production Ready 후처리(Half Tone), UGUI Shaders 샘플, Gustavson 튜토리얼, Heckel 글, MDN 접근성 문서 중에서 고른다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs screen-halftone-dots` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다. 움직임을 말하는 글("흐른다", "끓듯이")은 `burst` 연속 촬영 시트로 확인한다 (가이드 8절).
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
