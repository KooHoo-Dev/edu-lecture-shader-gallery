---
# 묶음 3 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs ui-sdf-shape
  - node tools/unity.mjs ui-sdf-shape
  - node tools/shots.mjs ui-sdf-shape
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/ui-sdf-shape/**
  - Assets/Shaders/ui-sdf-shape.meta
  - web/src/specimens/ui-sdf-shape/**
  - web/src/shots/ui-sdf-shape/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: ui-sdf-shape

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/sprite-outline-hit-flash/` 와 `web/src/specimens/sprite-outline-hit-flash/meta.ts` (스프라이트). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "19. ui-sdf-shape" 카드와 7절 결정 표.

## 표본별

- ID `ui-sdf-shape`, 파일과 셰이더 이름 `UiSdfShape`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (SDF 도형, 그룹 F, 순서 1).
- 무대와 혼합: 스프라이트 무대, `stage.ui: true`, `blend: 'alpha'`. **첫 UI 표본이다.** 래퍼는 가이드 4절 "UI 래퍼" 를 따라 Unity UI/Default 구조를 HLSLPROGRAM 으로 옮긴다. 다음 UI 표본이 이 래퍼를 복사하므로 주석을 충실히 단다.
- 효과의 핵심: 거리장으로 둥근 사각형, 원, 링 진행 바를 그리고 채움과 윤곽을 따로 낸다. `fwidth` 로 해상도와 상관없이 가장자리를 매끈하게 한다. 도형 고르기, 모서리 반경, 윤곽 두께, 채움 색, 윤곽 색, 링 채움 양, 종횡비를 조절 값으로 둔다. 정점 색을 곱한다.
- 텍스처: 쓰지 않는다. `_MainTex` 는 UI 래퍼 규칙상 속성으로 두되 도형 계산에는 쓰지 않는다. 미리보기의 기본 스프라이트 그림은 화면에 나오지 않게 한다.
- 단계 보기 후보: 거리 값을 색으로 본 것, 채움, 윤곽, 최종.
- 효과 끄기 후보: 흔한 실수 하나. 예를 들어 `fwidth` 없이 `step` 으로 잘라 가장자리가 계단처럼 깨지는 모습, 또는 종횡비 보정이 없어 원이 찌그러지는 모습.
- C# 스크립트: 링 진행 값(체력, 쿨타임)을 넘기는 작은 컴포넌트. UGUI Image 에서 `material` 복사본을 쓰는 법과 함께 가이드 6절을 따른다.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 2D 09 UGUI Basic Component, 10 Inventory And TradeSystem, 15 Mini Defence HUD 처럼 이름만 언급한다. UI 갤러리는 공개 사이트 https://koohoo-dev.github.io/UIGallery/ 로 링크해도 된다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs ui-sdf-shape` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
