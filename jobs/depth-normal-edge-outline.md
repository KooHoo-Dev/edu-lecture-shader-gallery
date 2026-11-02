---
# 묶음 5 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs depth-normal-edge-outline
  - node tools/unity.mjs depth-normal-edge-outline
  - node tools/shots.mjs depth-normal-edge-outline
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/depth-normal-edge-outline/**
  - Assets/Shaders/depth-normal-edge-outline.meta
  - web/src/specimens/depth-normal-edge-outline/**
  - web/src/shots/depth-normal-edge-outline/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: depth-normal-edge-outline

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/screen-transition-wipe/` 와 `web/src/specimens/screen-transition-wipe/meta.ts` (전체 화면). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "23. depth-normal-edge-outline" 카드와 7절 결정 표.

## 표본별

- ID `depth-normal-edge-outline`, 파일과 셰이더 이름 `DepthNormalEdgeOutline`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (깊이·법선 윤곽선 후처리, 그룹 G, 순서 2).
- 무대: 전체 화면, `requires: ['depth', 'normals']`. **가이드 4절의 `sgSceneDepth(uv)`, `sgSceneNormal(uv)` 와 `i.texelSize` 를 쓴다.** 래퍼는 전환 샘플에 `DeclareDepthTexture.hlsl`, `DeclareNormalsTexture.hlsl` include 와 가이드의 두 함수를 더한다. 수강생은 Full Screen Pass 의 Requirements 에서 Depth 와 Normal 을 켠다.
- 효과의 핵심: Roberts Cross 나 Sobel 로 이웃 픽셀의 깊이 차이와 법선 차이를 재어 윤곽을 만든다. 깊이 차이는 거리에 비례해 커지므로 거리로 나눈 상대 차이를 쓴다. 두께(샘플 간격, 픽셀), 깊이 민감도, 법선 민감도, 선 색, 거리 감쇠, 원래 화면과 섞는 정도를 조절 값으로 둔다. 스케치 룩 프리셋(원래 화면을 종이색으로 바꾸기)을 둔다.
- 해설: 껍데기 외곽선(`inverted-hull-outline`, 오브젝트마다, 비용이 물체 수에 비례)과 비교한다. 후처리 윤곽은 물체 수와 상관없지만 물체마다 색을 달리하기 어렵다. `related` 에 넣는다.
- 함정 후보: 법선은 SSAO 같은 다른 기능이 요청하지 않으면 Requirements 의 Normal 없이는 만들어지지 않는다. 법선 텍스처는 불투명 물체만 들어가 투명 물체에는 선이 없다. 하늘은 깊이가 먼 평면이라 지평선에 선이 생기는지 확인한다. MSAA 와 렌더 스케일에서 두께가 바뀐다.
- 단계 보기 후보: 깊이 윤곽, 법선 윤곽, 합친 윤곽, 최종.
- 효과 끄기 후보: 깊이 차이를 거리로 나누지 않아 먼 바닥이 비스듬한 각도에서 온통 선으로 덮이거나 가까운 접힌 곳이 빠지는 실수.
- C# 스크립트: 없다 (Volume 이나 C# 연동은 `adaptIdeas` 에).
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 3D 14 Animation 의 SimpleUnlitToon 껍데기 외곽선과 비교하는 수업으로 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs depth-normal-edge-outline` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
