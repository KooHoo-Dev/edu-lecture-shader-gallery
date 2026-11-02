---
# 묶음 1 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs toon-ramp-lit
  - node tools/unity.mjs toon-ramp-lit
  - node tools/shots.mjs toon-ramp-lit
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/toon-ramp-lit/**
  - Assets/Shaders/toon-ramp-lit.meta
  - web/src/specimens/toon-ramp-lit/**
  - web/src/shots/toon-ramp-lit/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: toon-ramp-lit

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 같은 무대(메시)의 기준 샘플 `Assets/Shaders/dissolve-edge-glow/` 와 `web/src/specimens/dissolve-edge-glow/meta.ts`. 같은 무대의 완성 표본 `fresnel-rim-glow` 도 참고한다.
3. `docs/shader-selection.md` 의 "1. toon-ramp-lit" 카드와 7절 결정 표.

## 표본별

- ID `toon-ramp-lit`, 파일과 셰이더 이름 `ToonRampLit`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (램프 툰 조명, 그룹 A, 순서 1).
- 무대와 혼합: 메시 무대, 불투명(`blend: 'cutout'`, 알파는 항상 1). 음영 경계가 잘 보이는 메시를 고른다.
- 효과의 핵심: `dot(N, L)` 을 몇 개의 띠로 끊어 만화풍 음영을 만든다. 띠 수(또는 경계 위치), 경계의 부드러움, 그늘 색(검게 어두워지지 않고 색조가 바뀌게), 기본 색을 조절 값으로 둔다. 램프는 텍스처 없이 셰이더 안에서 계산한다. 램프 텍스처로 바꾸는 방법은 해설과 변형 예시에서 다룬다.
- 받는 그림자: 래퍼가 넘기는 `lightColor` 에는 그림자 감쇠가 곱해져 있다. 받는 그림자도 부드러운 회색이 아니라 같은 띠로 끊겨 보이게 한다. 택한 방법과 한계를 해설에 적는다.
- 단계 보기 후보: `dot(N, L)`, 띠로 끊은 값, 그늘 색을 입힌 결과, 최종.
- 효과 끄기 후보: 흔한 실수 하나. 예를 들어 `smoothstep` 없이 `step` 으로 끊어 경계가 계단처럼 깨지는 모습, 또는 환경광이 섞인 `lighting` 을 띠로 끊어 경계가 밀리는 모습.
- C# 스크립트: 없다. 값을 움직이는 연출이 꼭 필요할 때만 만든다.
- `inspiredBy`: 카드에서 확인된 대표작은 Guilty Gear Xrd 하나다 (GDC 2015 강연, 카드의 URL). 가이드 5절 형식으로 이것만 넣는다. 화면을 확인하지 못한 다른 게임은 넣지 않는다. 수업 자료는 3D 14 Animation 의 `SimpleUnlitToon` 처럼 링크 없이 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`, `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs toon-ramp-lit` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
