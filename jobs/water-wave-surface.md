---
# 묶음 6 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs water-wave-surface
  - node tools/unity.mjs water-wave-surface
  - node tools/shots.mjs water-wave-surface
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/water-wave-surface/**
  - Assets/Shaders/water-wave-surface.meta
  - web/src/specimens/water-wave-surface/**
  - web/src/shots/water-wave-surface/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: water-wave-surface

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/flow-map-liquid/` 와 `web/src/specimens/flow-map-liquid/meta.ts` (메시 무대 평면. 정점을 미는 것은 `wind-sway-foliage`, 수면 색과 반짝임은 `water-depth-foam` 도 참고). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "25. water-wave-surface" 카드와 7절 결정 표.

## 표본별

- ID `water-wave-surface`, 파일과 셰이더 이름 `WaterWaveSurface`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (물결 수면, 그룹 C, 순서 1, 난이도 1).
- **가장 기본이 되는 물이다 (★1).** 수강생이 물 셰이더를 처음 만들 때 보는 표본이다. 개념은 사인파 합 정점 파도, 도함수로 구한 법선, 프레넬, 반사광 네 가지로 줄이고 해설을 쉽게 쓴다. 깊이 거품은 `water-depth-foam` 이 이어받는다는 것을 `related` 와 해설에서 잇는다.
- 무대와 혼합: 메시 무대 `mesh: 'plane'` (누운 평면, 돌지 않는다), `blend: 'alpha'` (내려다보는 곳은 아래 바닥이 비치고 비스듬한 먼 곳은 불투명해지게 프레넬로 알파를 정한다). 투명 메시 래퍼는 가이드 4절 "알파의 뜻" 을 따른다. 정점을 미므로 `stage.vertex: true`.
- 효과의 핵심: 방향과 파장이 다른 사인파 2~3 개를 더해 높이를 만든다 (GPU Gems 1장의 사인파 합). 조절 값이 많아지지 않게 첫 파도의 높이, 파장, 속도, 방향(각도)만 두고 나머지 파도는 각도와 파장을 일정 비율로 바꿔 자동으로 만든다. 법선은 같은 식의 x, z 도함수로 `normalize(float3(-dh/dx, 1, -dh/dz))` 처럼 구한다. 픽셀 단계에서 위치의 xz 로 다시 계산하면 성긴 메시에서도 음영이 매끈하다 (sgVertex 는 위치만 바꾸므로 법선은 sgEffect 에서 구한다). 색은 프레넬로 물빛(깊은 색)과 하늘빛을 섞고, 주 광원 Blinn-Phong 반사광을 더한다. 물빛, 하늘빛, 반사광 세기와 날카로움을 조절 값으로 둔다. 잔잔한 호수, 거친 바다, 만화풍 같은 프리셋.
- 정점 밀도: 웹 평면은 64×64 칸이고 Unity 기본 Plane 은 10×10 칸이라 Unity 에서는 정점 간격이 훨씬 넓다 (무대에서 0.3 m). 파장의 최솟값을 Unity 정점 간격의 4 배 이상으로 두어 Unity 촬영에서도 각지지 않게 하고, 웹 화면과 Unity 촬영의 실루엣 차이를 보고에 적는다. 넓은 물에는 촘촘한 메시가 필요하다는 것을 `unity.pitfalls` 에 적는다. 파도를 오브젝트 공간과 월드 공간 중 어디서 계산했는지, 평면 크기를 바꾸면 파도가 어떻게 되는지 해설에 적는다.
- 반사광 확인: 무대 광원은 카메라 뒤 위쪽에 있다. 반사광이 화면에서 보이는지 웹과 Unity 촬영 모두 직접 보고, 보이지 않으면 기본값(날카로움, 파도 높이)을 조정하거나 글을 화면에 맞춘다. 반사광은 고정 방향이 아니라 씬의 주 광원(`GetMainLight`, 가이드의 3인자 규칙)을 따른다.
- 텍스처: 쓰지 않는다. 잔물결용 법선맵 두 장을 흘리는 방법(수업 XR 01 Lake Shader 의 방식)은 `prompt.adaptIdeas` 에 둔다.
- 단계 보기 후보: 파도 높이(회색), 파도 법선, 프레넬, 반사광, 최종 중에서 고른다. 마지막 단계가 최종 화면과 같으면 넣지 않는다 (가이드).
- 효과 끄기 후보: 정점은 출렁이는데 법선을 다시 계산하지 않아 조명과 하늘빛이 평평한 판처럼 고른 모습. 수강생이 가장 자주 하는 실수다.
- C# 스크립트: 없다.
- `inspiredBy`: 카드에서 확인된 Uru: Ages Beyond Myst (2003, Cyan Worlds) 를 가이드 5절 형식으로 넣는다. 빌린 것은 사인파 합 파도와 도함수 법선, 링크는 GPU Gems 1장. 수업 자료는 XR 01 Lake Shader(Step1~7), 3D 05 Terrain Island 처럼 링크 없이 이름만 언급한다. `references` 에 GPU Gems 1장과 Catlike Coding Waves 튜토리얼(카드의 URL)을 넣는다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs water-wave-surface` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
