---
# 묶음 4 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs water-depth-foam
  - node tools/unity.mjs water-depth-foam
  - node tools/shots.mjs water-depth-foam
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/water-depth-foam/**
  - Assets/Shaders/water-depth-foam.meta
  - web/src/specimens/water-depth-foam/**
  - web/src/shots/water-depth-foam/**
  - tools/textures/water-depth-foam-noise.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: water-depth-foam

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/force-field-intersection/` 와 `web/src/specimens/force-field-intersection/meta.ts` (깊이 무대). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "8. water-depth-foam" 카드와 7절 결정 표.

## 표본별

- ID `water-depth-foam`, 파일과 셰이더 이름 `WaterDepthFoam`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (깊이 기반 물가 거품, 그룹 C, 순서 1).
- 무대와 혼합: 깊이 무대, `mesh: 'plane'` (수면 높이에 누워 상자, 공, 바닥을 가른다), `blend: 'alpha'`, `requires: ['depth']`. 래퍼는 역장 샘플의 깊이 무대 구조를 따른다. 깊이 무대 입력에는 조명 필드가 없으니 하늘빛과 반짝임은 프레넬(`viewWS`, `normalWS`)과 색으로 근사한다.
- 효과의 핵심: `depthDelta` 로 물가 거품 띠(노이즈로 끊고 시간에 따라 일렁이게)와, 얕은 곳에서 깊은 곳으로 가는 색과 투명도 그라데이션을 만든다. 표면 잔물결은 반복 노이즈 두 장을 서로 다른 방향으로 흘려 밝기나 법선을 흔든다. 얕은 색, 깊은 색, 깊이 범위, 거품 폭, 거품 색, 흐름 속도를 조절 값으로 둔다.
- 텍스처: 필요하면 `tools/textures/water-depth-foam-noise.mjs` 에 반복 노이즈를 만든다 (데이터라 `linear`, `repeat`, 128 이하, 32KB 이하, 래퍼 기본값 `"linearGrey"`).
- 파도: Unity 기본 Plane 은 정점 간격이 1 이라 정점으로 미는 파도(Gerstner)는 거칠다. 이 표본은 정점을 움직이지 않는다. 촘촘한 메시와 파도는 `adaptIdeas` 와 가이드 9절 요청으로 남긴다. 흐름 방향을 글로 쓸 때는 기본 Plane 의 UV 방향(가이드 4절)을 따른다.
- `depthDelta` 는 카메라 시선 방향의 거리 차이다. 수직 깊이가 아니라서 내려다보는 각도에 따라 거품 띠 폭과 깊이 색이 변한다. 이 점을 해설이나 `mistakes` 에 정확히 쓴다.
- 단계 보기 후보: 깊이 차이를 색으로, 깊이 색 그라데이션, 거품 띠, 최종.
- 효과 끄기 후보: 깊이를 쓰지 않아 물체와 만나는 곳이 칼로 자른 듯 딱딱하게 끊기고 물속이 한 색으로 막힌 모습 (Depth Texture 를 켜지 않았을 때와 같은 증상).
- C# 스크립트: 없다.
- XR: 모바일 XR 용 URP 에셋은 Depth Texture 가 꺼져 있다. `unity.pitfalls` 에 적는다.
- `inspiredBy`: 카드에서 확인된 `Sea of Thieves (2018)` (Rare, 깊이 비교 거품)을 가이드 5절 형식으로 넣는다. 수업 자료는 XR 01 Lake Shader 의 다음 단계("Step 8"), 10 MR Portal 의 Caustics, 3D 05 Terrain Island 처럼 링크 없이 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs water-depth-foam` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
