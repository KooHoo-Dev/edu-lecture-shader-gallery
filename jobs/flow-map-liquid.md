---
# 묶음 2 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs flow-map-liquid
  - node tools/unity.mjs flow-map-liquid
  - node tools/shots.mjs flow-map-liquid
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/flow-map-liquid/**
  - Assets/Shaders/flow-map-liquid.meta
  - web/src/specimens/flow-map-liquid/**
  - web/src/shots/flow-map-liquid/**
  - tools/textures/flow-map-liquid-flow.mjs
  - tools/textures/flow-map-liquid-pattern.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: flow-map-liquid

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/dissolve-edge-glow/` 와 `web/src/specimens/dissolve-edge-glow/meta.ts` (메시). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "10. flow-map-liquid" 카드와 7절 결정 표.

## 표본별

- ID `flow-map-liquid`, 파일과 셰이더 이름 `FlowMapLiquid`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (플로 맵 액체, 그룹 C, 순서 3).
- 무대와 혼합: 메시 무대 `plane` (누운 평면, 돌지 않는다), 불투명(`blend: 'cutout'`, 알파는 항상 1).
- 텍스처: 직접 만든다. 플로 맵은 `tools/textures/flow-map-liquid-flow.mjs` (RG 에 흐름 방향, 데이터라 `linear`, `repeat`), 흘려 보낼 무늬는 `tools/textures/flow-map-liquid-pattern.mjs` (색, `repeat`). 둘 다 128 정도. 소용돌이나 굽이치는 강처럼 흐름이 한눈에 보이는 플로 맵으로 만든다.
- 효과의 핵심: `frac(time)` 위상 두 벌을 반 주기 어긋나게 두고 삼각파 가중치로 섞어 반복 끊김을 숨긴다. 흐름 세기, 속도, 무늬 크기, 색 두 가지(용암, 물 같은 프리셋)를 조절 값으로 둔다. 위상에 노이즈를 더해 끊김이 한 번에 몰리지 않게 한다.
- 방향 확인: 흐름 방향은 UV 공간이다. Unity `Plane` 과 웹 평면의 UV 방향이 다를 수 있으니 웹 화면과 Unity 촬영에서 흐름 방향이 같은지 보고에 적는다.
- 단계 보기 후보: 플로 맵을 색으로 본 것, 위상 하나만(늘어나다 튀는 모습), 두 위상을 섞은 결과, 최종.
- 효과 끄기 후보: 위상 하나만 써서 일정 주기마다 무늬가 원래대로 튀는 실수.
- C# 스크립트: 없다.
- `inspiredBy`: 카드에서 확인된 Portal 2, Left 4 Dead 2 를 가이드 5절 형식으로 넣는다. 수업 자료는 XR 01 Lake Shader Step6, 3D 05 Terrain Island 처럼 링크 없이 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs flow-map-liquid` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
