---
# 묶음 1 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs triplanar-projection
  - node tools/unity.mjs triplanar-projection
  - node tools/shots.mjs triplanar-projection
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/triplanar-projection/**
  - Assets/Shaders/triplanar-projection.meta
  - web/src/specimens/triplanar-projection/**
  - web/src/shots/triplanar-projection/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: triplanar-projection

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다. 특히 3-4절(텍스처)과 4절 무대 표의 `positionWS`, `normalOS`.
2. 같은 무대(메시)의 기준 샘플 `Assets/Shaders/dissolve-edge-glow/` 와 `web/src/specimens/dissolve-edge-glow/meta.ts`. 텍스처를 쓰는 표본은 `sprite-outline-hit-flash` 의 래퍼와 메타를 참고한다.
3. `docs/shader-selection.md` 의 "3. triplanar-projection" 카드와 7절 결정 표.

## 표본별

- ID `triplanar-projection`, 파일과 셰이더 이름 `TriplanarProjection`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (삼평면 투영, 그룹 A, 순서 3).
- 텍스처: 먼저 `node tools/gen-texture.mjs triplanar-tiles` 를 실행한다. `Assets/Shaders/triplanar-projection/TriplanarTiles.png` (128, 반복되는 돌 타일)가 생긴다. 이 PNG 를 `SG_TEX` 로 읽고 `meta.stage.textures` 에 sRGB, 반복으로 적는다. 다른 텍스처는 만들지 않는다.
- 무대와 혼합: 메시 무대, 불투명(`blend: 'cutout'`, 알파는 항상 1). UV 늘어남이 잘 보이는 메시를 고른다 (예: `cube` 나 `cylinder`).
- 효과의 핵심: 세 축 평면으로 텍스처를 세 번 샘플하고 `abs(N)` 의 거듭제곱 가중치를 정규화해 섞는다. 타일 크기, 섞임의 날카로움(거듭제곱)을 조절 값으로 둔다. 월드 공간과 오브젝트 공간을 고르는 값을 둔다. 무대가 돌기 때문에 월드 공간 무늬는 물체 위를 흐르고 오브젝트 공간 무늬는 붙어 있다. 이 차이가 화면에서 보이게 하고 각각 언제 쓰는지 해설한다. 래퍼는 가이드 4절대로 `positionWS`, `normalOS` 를 `SgInput` 과 `Varyings` 에 넣는다. 법선맵 삼평면은 이번 범위가 아니다. 해설과 변형 예시에서만 다룬다.
- 단계 보기 후보: 세 축 가중치를 색으로 본 것, 한 축 투영 하나, 섞은 결과, 최종 조명.
- 효과 끄기 후보: 흔한 실수 하나. 예를 들어 한 축(평면) 투영만 써서 옆면이 길게 늘어나는 모습, 또는 가중치를 정규화하지 않아 모서리가 밝아지는 모습.
- C# 스크립트: 없다.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 3D 07 External Assets 의 `POLYGON_Triplanar` 처럼 링크 없이 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`, `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs triplanar-projection` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 월드와 오브젝트 공간을 각각 찍어 차이를 확인한다. 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
