---
# 묶음 4 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs screen-vignette
  - node tools/unity.mjs screen-vignette
  - node tools/shots.mjs screen-vignette
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/screen-vignette/**
  - Assets/Shaders/screen-vignette.meta
  - web/src/specimens/screen-vignette/**
  - web/src/shots/screen-vignette/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: screen-vignette

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/screen-transition-wipe/` 와 `web/src/specimens/screen-transition-wipe/meta.ts` (전체 화면). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "24. screen-vignette" 카드와 7절 결정 표.

## 표본별

- ID `screen-vignette`, 파일과 셰이더 이름 `ScreenVignette`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (화면 비네트, 그룹 G, 순서 3).
- 무대: 전체 화면. 기준 샘플 `screen-transition-wipe` 처럼 내장 Full Screen Pass Renderer Feature 에 머티리얼을 넣는 방식만 쓴다 (선정 문서 7절 결정 11).
- 효과의 핵심: 화면 중심에서의 거리를 화면비로 보정하고 `smoothstep` 으로 부드러운 가장자리를 만든다. 색(검정, 피격 빨강), 세기, 반경, 부드러움, 원형과 화면 맞춤 사이 비율을 조절 값으로 둔다. 저체력 맥동은 반복이므로 가이드 7절대로 1Hz 이하, 진폭은 작게, 채도 낮은 어두운 빨강으로 한다 (포화된 빨강을 넓게 깜빡이지 않는다).
- 이벤트: 피격 펄스. 더하기용 전용 값(예: `_HitPulse`)을 올렸다 내리고, 화면 넓은 면이 변하므로 `flashes: true`, C# 은 실제 시간으로 초당 3회 제한(가이드 7절).
- C# 스크립트: 체력 비율로 세기를 정하고 피격 때 펄스를 재생하는 컨트롤러. 끄기 옵션(접근성)을 둔다. 머티리얼 에셋을 직접 고치므로 `OnDisable` 에서 원래 값으로 되돌린다 (가이드 6절, 전환 샘플 참고).
- XR: 터널링(이동 중 시야를 좁혀 멀미를 줄임) 프리셋을 둔다. XR 에서는 눈마다 화면 uv 가 따로라 중심이 각 눈의 중심이 되고, 시야각이 기기마다 달라 같은 반경이 다르게 보인다는 점을 `unity.pitfalls` 에 적는다. XRI 의 TunnelingVignetteController 를 대안으로 언급한다.
- 해설: URP Volume 의 내장 Vignette 로 충분한 경우(색과 세기만 바꾸는 정적 비네트)와 이 표본이 필요한 경우(피격 펄스, 체력 연동, 터널링)를 나눠 쓴다 (선정 문서 7절 결정 6).
- 단계 보기 후보: 중심 거리, 화면비 보정, 부드러운 마스크, 색 합성.
- 효과 끄기 후보: 화면비 보정을 빼 가로로 늘어난 타원이 되는 실수, 또는 `smoothstep` 없이 거리를 그대로 써서 가장자리가 딱딱하거나 화면 전체가 어두워지는 실수. 화면에서 분명히 보이는 것을 고른다.
- `inspiredBy`: 카드에서 확인된 `Warhammer 40,000: Space Marine 2 (2024)` (Saber Interactive, 저체력 비네트)를 가이드 5절 형식으로 넣고, 이용자들이 끄기 옵션을 요청했다는 점을 디자인 교훈으로 해설에 쓴다. 수업 자료는 XR 의 XRI TunnelingVignette 샘플, 2D·3D 체력 HUD 처럼 이름만 언급하고 UI 갤러리(https://koohoo-dev.github.io/UIGallery/)의 체력 바로 링크해도 된다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs screen-vignette` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
