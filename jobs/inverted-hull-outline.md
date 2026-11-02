---
# 묶음 1 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다. 앱의 외곽선 패스(stage.outline)를 처음 쓰는 표본이다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs inverted-hull-outline
  - node tools/unity.mjs inverted-hull-outline
  - node tools/shots.mjs inverted-hull-outline
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/inverted-hull-outline/**
  - Assets/Shaders/inverted-hull-outline.meta
  - web/src/specimens/inverted-hull-outline/**
  - web/src/shots/inverted-hull-outline/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: inverted-hull-outline

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다. 특히 4절 "외곽선 패스 (`stage.outline`)" 와 3-4절 정점 변형.
2. 같은 무대(메시)의 기준 샘플 `Assets/Shaders/dissolve-edge-glow/` 와 `web/src/specimens/dissolve-edge-glow/meta.ts`. 같은 무대의 완성 표본 `fresnel-rim-glow` 도 참고한다.
3. `docs/shader-selection.md` 의 "6. inverted-hull-outline" 카드와 7절 결정 표.

## 표본별

- ID `inverted-hull-outline`, 파일과 셰이더 이름 `InvertedHullOutline`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (껍데기 외곽선, 그룹 B, 순서 2).
- 무대와 혼합: 메시 무대, 본체는 불투명(`blend: 'cutout'`, 알파는 항상 1), `stage.outline: true`. 외곽선이 잘 보이는 메시를 고른다.
- 효과의 핵심: 외곽선 패스가 정점을 법선 방향으로 밀어 부풀린 껍데기를 `Cull Front` 로 그린다. 외곽선 두께와 색, 본체 기본 색을 조절 값으로 둔다. 본체는 기본 색에 조명을 곱한 단순한 음영이면 된다.
- 두께 보정: 카메라 거리와 상관없이 화면에서 같은 두께로 보이게 하는 클립 공간 보정은 `sgVertex` 입력(오브젝트 공간 위치, 법선, UV, 시간)만으로는 웹과 Unity 를 같게 만들 수 없다. 이번에는 오브젝트 공간 두께로 하고, 클립 공간 보정은 해설과 변형 예시에서 다룬다.
- 단계 보기 후보: 본체만, 부풀린 껍데기를 앞면까지 그린 모습(왜 `Cull Front` 인지), 최종. 단계는 블록마다 `SG_STEP` 으로 낼 수 있는 것으로 정한다.
- 효과 끄기 후보: `core.hlsl` 로 재현할 수 있는 흔한 실수 하나. 예를 들어 하드 에지 메시에서 법선이 갈라져 모서리 외곽선이 끊기는 문제처럼 수업에서 자주 만나는 것을 고르고, 무대 메시에서 실제로 보이는지 확인한다.
- C# 스크립트: 선택이나 타깃 표시처럼 외곽선을 켜고 끄는 작은 컨트롤러. `renderer.material` 복사본을 쓰고 가이드 6절을 따른다. 번쩍이는 연출은 넣지 않는다.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 3D 14 Animation 의 `SimpleUnlitToon` 처럼 링크 없이 이름만 언급한다. 같은 2패스 구성이라는 점과 이 표본이 더하는 것(두께, 선택 표시)을 적는다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`, `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs inverted-hull-outline` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
