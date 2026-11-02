---
# 묶음 2 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs scroll-distort-energy
  - node tools/unity.mjs scroll-distort-energy
  - node tools/shots.mjs scroll-distort-energy
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/scroll-distort-energy/**
  - Assets/Shaders/scroll-distort-energy.meta
  - web/src/specimens/scroll-distort-energy/**
  - web/src/shots/scroll-distort-energy/**
  - tools/textures/scroll-distort-energy-noise.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: scroll-distort-energy

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/force-field-intersection/` 와 `web/src/specimens/force-field-intersection/meta.ts` (투명 메시의 참고). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "15. scroll-distort-energy" 카드와 7절 결정 표.

## 표본별

- ID `scroll-distort-energy`, 파일과 셰이더 이름 `ScrollDistortEnergy`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (스크롤·왜곡 에너지, 그룹 D, 순서 4).
- 무대와 혼합: 메시 무대 `cylinder`, 투명 더하기(`blend: 'additive'`). 투명 메시는 기준 샘플이 없으니 가이드 4절 안내대로 역장 래퍼에서 깊이 관련 줄을 빼고 메시 입력으로 바꾼다. 원통 안쪽도 보이게 하려면 `Cull Off` 와 `stage.doubleSided`.
- 텍스처: 직접 만든다. `tools/textures/scroll-distort-energy-noise.mjs` 에 반복되는 회색 노이즈나 줄무늬(데이터라 `linear`, `repeat`, 128 정도). 두 레이어와 왜곡에 같은 텍스처를 크기와 속도만 달리해 쓴다.
- 효과의 핵심: 반대 방향으로 흐르는 두 레이어, 노이즈로 UV 를 흔드는 왜곡, 원통 끝으로 갈수록 사라지는 알파 마스크, 1 을 넘는 HDR 색. 색, 속도, 왜곡 세기, 끝단 마스크를 조절 값으로 둔다.
- 단계 보기 후보: 레이어 하나, 두 레이어 겹침, 왜곡, 끝단 마스크, 최종 중에서 고른다.
- 효과 끄기 후보: 흔한 실수 하나. 예를 들어 끝단 마스크가 없어 원통 경계가 칼로 자른 듯 끊기는 모습, 또는 왜곡 없이 두 레이어가 기계적으로 미끄러지는 모습.
- C# 스크립트: 없다.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 3D 07 External Assets 의 FORGE3D `Additive`, 2D 의 MagicArsenal 처럼 링크 없이 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs scroll-distort-energy` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
