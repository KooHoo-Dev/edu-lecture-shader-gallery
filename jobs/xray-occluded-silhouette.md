---
# 묶음 4 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs xray-occluded-silhouette
  - node tools/unity.mjs xray-occluded-silhouette
  - node tools/shots.mjs xray-occluded-silhouette
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/xray-occluded-silhouette/**
  - Assets/Shaders/xray-occluded-silhouette.meta
  - web/src/specimens/xray-occluded-silhouette/**
  - web/src/shots/xray-occluded-silhouette/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: xray-occluded-silhouette

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/dissolve-edge-glow/` 와 `web/src/specimens/dissolve-edge-glow/meta.ts` (메시). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "7. xray-occluded-silhouette" 카드와 7절 결정 표.

## 표본별

- ID `xray-occluded-silhouette`, 파일과 셰이더 이름 `XrayOccludedSilhouette`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (가려진 실루엣, 그룹 B, 순서 3).
- 무대와 혼합: 메시 무대, `mesh: 'capsule'` (캐릭터 대신), 본체는 `blend: 'cutout'` (알파 1), `stage.occluded: true`. 무대가 카메라와 물체 사이에 벽을 세워 캡슐의 왼쪽 아래를 가린다. **가이드 4절 "가려진 부분 패스" 를 따른다.** 래퍼는 디졸브의 네 패스 본체에 실루엣 패스(SRPDefaultUnlit, ZTest Greater, ZWrite Off, Blend SrcAlpha OneMinusSrcAlpha)를 더한다. core 를 패스마다 include 하는 방식은 `Assets/Shaders/inverted-hull-outline/` 래퍼를 참고한다.
- 효과의 핵심: 가려진 부분만 단색 실루엣으로 덧그린다. 프레넬(`normalWS`, `viewWS`)로 가장자리를 진하게 해 형태를 읽히게 하고, 본체는 디졸브처럼 `albedo * lighting` 의 평범한 조명이다. 실루엣 색, 불투명도, 테두리 세기와 폭, 본체 색을 조절 값으로 둔다. 아군(파랑)과 적(빨강) 같은 프리셋을 둔다.
- 이벤트: 적을 "발견" 한 순간 실루엣을 잠깐 밝히는 것처럼, 가이드 5절대로 더하기용 전용 값(예: `_Reveal`)을 0 에서 올렸다 0 으로 내린다. C# 도 같은 값을 움직인다.
- C# 스크립트: 발견 펄스나 팀 색을 바꾸는 작은 컴포넌트. `renderer.material` 복사본을 쓰고 가이드 6절을 따른다.
- `unity.pitfalls` 에 가이드 4절의 주의(Depth Priming·깊이 프리패스, 같은 태그 두 패스, 2D Renderer)와 함께 적는다: 투명한 벽(ZWrite Off)은 깊이를 쓰지 않아 그 뒤에서는 실루엣이 생기지 않는다. 캐릭터가 여럿이거나 팀마다 색이 다르면 Render Objects 기능(레이어 마스크, Depth Test Greater, Override Material)으로 같은 효과를 내는 방법을 `adaptIdeas` 에 둔다.
- 단계 보기 후보: 실루엣 단색, 프레넬 테두리, 최종. 단계 번호는 본체와 실루엣 두 패스에 함께 걸리므로 두 쪽에서 모두 말이 되게 한다.
- 효과 끄기 후보: 렌더 상태는 `SG_OFF` 로 바꿀 수 없으니 셰이더 안의 흔한 실수 하나를 고른다. 예: 프레넬 없이 불투명 단색으로 칠해 벽에 구멍이 뚫린 것처럼 보이고 형태가 읽히지 않는 모습, 또는 실루엣이 없어 벽 뒤 캐릭터를 놓치는 모습.
- `inspiredBy`: 카드에서 확인된 `Overwatch (2016)` (Blizzard Entertainment, 벽 너머 아군 윤곽)를 가이드 5절 형식으로 넣는다. 수업 자료는 XR 10 MR Portal 의 PortalMask, XR 11 MR Room 의 Occlusion, 3D 17 FPS Game 처럼 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs xray-occluded-silhouette` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
