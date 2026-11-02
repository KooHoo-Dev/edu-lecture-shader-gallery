---
# 묶음 2 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs hologram-scanline-glitch
  - node tools/unity.mjs hologram-scanline-glitch
  - node tools/shots.mjs hologram-scanline-glitch
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/hologram-scanline-glitch/**
  - Assets/Shaders/hologram-scanline-glitch.meta
  - web/src/specimens/hologram-scanline-glitch/**
  - web/src/shots/hologram-scanline-glitch/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: hologram-scanline-glitch

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/force-field-intersection/` 와 `web/src/specimens/force-field-intersection/meta.ts` (투명 메시의 참고). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "14. hologram-scanline-glitch" 카드와 7절 결정 표.

## 표본별

- ID `hologram-scanline-glitch`, 파일과 셰이더 이름 `HologramScanlineGlitch`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (홀로그램, 그룹 D, 순서 3).
- 무대와 혼합: 메시 무대, 투명 더하기(`blend: 'additive'`). 투명 메시는 기준 샘플이 없으니 가이드 4절 "알파의 뜻" 아래 안내대로 역장 래퍼에서 깊이 관련 줄을 빼고 메시 입력으로 바꾼다. 정점을 미므로 `stage.vertex: true`.
- 효과의 핵심: 프레넬 테두리, 월드 y 로 흐르는 스캔라인(`positionWS`), 양자화한 시간으로 가로 띠를 옆으로 미는 정점 글리치, 깜빡임. 색, 스캔라인 간격과 속도, 글리치 세기, 깜빡임 세기를 조절 값으로 둔다.
- 안전: 물체 전체가 깜빡이므로 가이드 7절을 따른다. 반복 깜빡임은 2Hz 이하, 이벤트는 `flashes: true`, C# 은 초당 3회 제한.
- 정점 밀도: Unity 기본 구는 웹 구보다 정점이 성기다. 글리치 띠 폭이 Unity 구의 정점 간격보다 넓어야 두 화면이 같아 보인다. 웹 화면과 Unity 촬영을 비교해 보고에 적는다.
- 단계 보기 후보: 프레넬, 스캔라인, 글리치 띠 마스크, 최종.
- 효과 끄기 후보: 흔한 실수 하나. 예를 들어 스캔라인을 UV 로 계산해 메시 이음매에서 끊기고 물체 방향을 따라 도는 모습.
- C# 스크립트: 전송이 끊기는 순간처럼 글리치 세기를 잠깐 올리는 작은 컨트롤러. 이벤트와 연결하고 가이드 6절을 따른다.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 3D 07 External Assets 의 `Holographic` 처럼 링크 없이 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs hologram-scanline-glitch` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
