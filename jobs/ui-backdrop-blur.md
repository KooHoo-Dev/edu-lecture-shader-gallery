---
# 묶음 5 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs ui-backdrop-blur
  - node tools/unity.mjs ui-backdrop-blur
  - node tools/shots.mjs ui-backdrop-blur
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/ui-backdrop-blur/**
  - Assets/Shaders/ui-backdrop-blur.meta
  - web/src/specimens/ui-backdrop-blur/**
  - web/src/shots/ui-backdrop-blur/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: ui-backdrop-blur

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/ui-sdf-shape/` 와 `web/src/specimens/ui-sdf-shape/meta.ts` (UI 래퍼). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "21. ui-backdrop-blur" 카드와 7절 결정 표.

## 표본별

- ID `ui-backdrop-blur`, 파일과 셰이더 이름 `UiBackdropBlur`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (배경 블러 유리, 그룹 F, 순서 3).
- 무대와 혼합: **깊이 무대**, `mesh: 'quad'` (상자와 공 앞에 선 패널), `stage.ui: true`, `blend: 'alpha'`, `requires: ['opaque']` (깊이 무대 규칙상 `DeclareDepthTexture.hlsl` 도 include 한다). UI 래퍼는 `Assets/Shaders/ui-sdf-shape/UiSdfShape.shader` 를 복사하고(가이드 4절 "UI 래퍼"), 씬 색상은 가이드 4절대로 `sgSceneColor(uv)` 를 래퍼에 둔다. 깊이 무대 입력의 `i.color` 가 Image 정점 색이다 (웹은 1).
- 효과의 핵심: 화면 좌표(`screenUV`) 주변을 여러 번 읽어 흐린 배경을 만든다 (나선 샘플링이나 몇 겹의 원). 흐림 반경, 샘플 수의 질(Low, High 같은 select), 유리 색과 비율, 테두리 빛, 모서리 둥글기(SDF 로 패널 모양 알파)를 조절 값으로 둔다. 텍스트가 읽히는 반투명 패널 프리셋을 둔다.
- 캔버스 제약을 `unity.setup` 과 `unity.pitfalls` 에 정확히 적는다: Screen Space - Overlay 캔버스는 카메라가 장면을 그린 뒤에 그려져 Opaque Texture 를 읽을 수 없다. Screen Space - Camera 나 World Space 캔버스를 쓴다. Opaque Texture 는 불투명 물체만 담아 다른 UI 와 투명 물체는 흐림에 들어가지 않는다. 2D Renderer 는 Opaque Texture 대신 Camera Sorting Layer Texture 를 쓴다. 샘플 수가 비용이라 모바일은 낮은 질을 쓴다.
- 단계 보기 후보: 패널 모양 알파, 흐리기 전 씬 색상, 흐린 씬 색상, 최종.
- 효과 끄기 후보: 흐림 없이 씬 색상만 비추거나 샘플 수가 너무 적어 계단 무늬가 생기는 실수. 화면에서 분명한 것을 고른다.
- C# 스크립트: 없다. 필요하면 패널을 열고 닫을 때 흐림 반경을 바꾸는 예를 `adaptIdeas` 에 둔다.
- XR: 비용이 크고 월드 공간 UI 에서의 쓰임이 불분명하다 (카드 XR ✕). `unity.pitfalls` 에 적는다.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 2D 09 UGUI Basic Component(캔버스 렌더 모드)처럼 이름만 언급하고, UI 갤러리(https://koohoo-dev.github.io/UIGallery/)로 링크해도 된다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs ui-backdrop-blur` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
