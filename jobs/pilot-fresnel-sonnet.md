---
# 파일럿 (plan 4-2). pilot-fresnel-opus 와 모델만 다르다.
model: claude-sonnet-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs fresnel-rim-glow
  - node tools/unity.mjs fresnel-rim-glow
  - node tools/shots.mjs fresnel-rim-glow
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/fresnel-rim-glow/**
  - Assets/Shaders/fresnel-rim-glow.meta
  - web/src/specimens/fresnel-rim-glow/**
  - web/src/shots/fresnel-rim-glow/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: fresnel-rim-glow

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 같은 무대(메시)의 기준 샘플 `Assets/Shaders/dissolve-edge-glow/` 와 `web/src/specimens/dissolve-edge-glow/meta.ts`.
3. `docs/shader-selection.md` 의 "2. fresnel-rim-glow" 카드와 7절 결정 표.

## 표본별

- ID `fresnel-rim-glow`, 파일과 셰이더 이름 `FresnelRimGlow`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (프레넬 림 빛, 그룹 A, 순서 2).
- 무대와 혼합: 메시 무대, 불투명(`blend: 'cutout'`, 알파는 항상 1). 기본 메시는 림이 잘 보이는 것으로 고른다.
- 효과의 핵심: 기본 색에 조명을 곱한 표면에 `pow(1 - saturate(dot(N, V)), 지수)` 로 구한 림 빛을 더한다. 림 색, 세기, 지수는 조절 값으로 둔다. 에너지막처럼 투명하게 쓰는 경우는 해설에서 다룬다.
- 단계 보기 후보: `dot(N, V)`, 뒤집은 값, 지수로 좁힌 림, 최종.
- 효과 끄기 후보: 흔한 실수 하나. 예를 들어 정규화하지 않은 시선 방향이나 오브젝트 공간 법선을 써서 림이 틀어지는 모습.
- C# 스크립트: 피격 번쩍임처럼 림을 잠깐 강하게 만드는 작은 컨트롤러. 이벤트와 연결한다. 넓은 영역이 번쩍이면 가이드 7절의 제한을 따른다.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 XRI Starter Assets 의 `Unlit_Fresnel` 처럼 링크 없이 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`, `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs fresnel-rim-glow` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령).
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
