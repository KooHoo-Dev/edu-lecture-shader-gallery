---
# 묶음 5 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs screen-shockwave-distortion
  - node tools/unity.mjs screen-shockwave-distortion
  - node tools/shots.mjs screen-shockwave-distortion
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/screen-shockwave-distortion/**
  - Assets/Shaders/screen-shockwave-distortion.meta
  - web/src/specimens/screen-shockwave-distortion/**
  - web/src/shots/screen-shockwave-distortion/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: screen-shockwave-distortion

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/screen-transition-wipe/` 와 `web/src/specimens/screen-transition-wipe/meta.ts` (전체 화면). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "13. screen-shockwave-distortion" 카드와 7절 결정 표.

## 표본별

- ID `screen-shockwave-distortion`, 파일과 셰이더 이름 `ScreenShockwaveDistortion`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (충격파 왜곡, 그룹 D, 순서 2).
- 무대: 전체 화면. 내장 Full Screen Pass Renderer Feature 에 머티리얼을 넣는 방식만 쓴다 (선정 문서 7절 결정 11). `sgSource(uv)` 를 밀린 좌표로 읽는다.
- 효과의 핵심: 중심에서 퍼지는 고리 마스크(`abs(거리 - 반경) < 폭` 을 부드럽게), 고리 안에서 바깥 방향으로 uv 를 밀기, 반경이 커질수록 약해지는 감쇠, 화면비 보정. 중심, 반경(진행), 고리 폭, 세기, 색수차를 조절 값으로 둔다. 열기 아지랑이 프리셋(노이즈로 위로 흔들리는 약한 왜곡)도 둔다.
- 이벤트: 폭발 한 번. 반경을 0 에서 키우며 세기를 줄이는 트랙. 가이드 5절 이벤트 규칙(더하기용 전용 값, 0 에서 시작해 0 으로 끝남)을 지킨다. 넓은 면이 크게 일렁이므로 가이드 7절을 보고 `flashes` 여부를 정한다 (밝기 번쩍임이 아니면 false 여도 된다. 이유를 보고에 적는다).
- C# 스크립트: 월드 위치에서 충격파를 시작하는 컨트롤러. `Camera.WorldToViewportPoint` 로 화면 중심을 구해 넘기고 반경과 세기를 시간에 따라 움직인다. 머티리얼 에셋을 직접 고치므로 `OnDisable` 에서 되돌린다 (가이드 6절, 전환 샘플 참고). 여러 개가 겹치면 어떻게 하는지 해설에 적는다.
- XR: 화면 전체 왜곡은 멀미를 부를 수 있고 눈마다 uv 가 따로라 중심을 눈마다 계산해야 한다. `unity.pitfalls` 에 적는다.
- 단계 보기 후보: 중심 거리, 고리 마스크, 밀기 방향, 최종.
- 효과 끄기 후보: 화면비 보정을 빼 고리가 가로로 늘어난 타원이 되는 실수, 또는 감쇠 없이 화면 끝까지 같은 세기로 찢어지는 실수.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 3D 의 HeatDepthFixed(FORGE3D), 2D 15 Mini Defence 의 폭발 연출처럼 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs screen-shockwave-distortion` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
