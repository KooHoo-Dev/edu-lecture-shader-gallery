---
# 묶음 5 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs screen-refraction-glass
  - node tools/unity.mjs screen-refraction-glass
  - node tools/shots.mjs screen-refraction-glass
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/screen-refraction-glass/**
  - Assets/Shaders/screen-refraction-glass.meta
  - web/src/specimens/screen-refraction-glass/**
  - web/src/shots/screen-refraction-glass/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: screen-refraction-glass

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/force-field-intersection/` 와 `web/src/specimens/force-field-intersection/meta.ts` (깊이 무대, 씬 색상). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "4. screen-refraction-glass" 카드와 7절 결정 표.

## 표본별

- ID `screen-refraction-glass`, 파일과 셰이더 이름 `ScreenRefractionGlass`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (씬 컬러 굴절 유리, 그룹 A, 순서 4).
- 무대와 혼합: 깊이 무대, `mesh: 'sphere'` (상자와 공 앞을 덮는 유리 구) 또는 효과가 더 잘 보이는 다른 메시, `blend: 'alpha'`, `requires: ['opaque', 'depth']`. 씬 색상은 가이드 4절대로 `sgSceneColor(uv)` 를 래퍼에 두고 `DeclareOpaqueTexture.hlsl` 을 include 한다. 기준 샘플은 역장(깊이 무대 래퍼)이다.
- 효과의 핵심: `screenUV` 를 법선(`normalWS`, `viewWS` 로 만든 굴절 방향)과 반복 노이즈로 밀어 뒤 장면을 휘어 보인다. 두께(가장자리일수록 더 휨), 색수차(RGB 를 조금씩 다르게 밀기), 유리 색과 프레넬 반사 색을 더한다. 굴절 세기, 노이즈 크기와 흐름, 색수차, 유리 색, 프레넬을 조절 값으로 둔다. 얼음과 물방울 같은 프리셋을 둔다.
- 흔한 문제를 해설과 `mistakes` 에 넣는다: 유리 앞에 있는 물체까지 밀린 자리에서 끌려 들어온다. 민 자리의 깊이(`depthDelta` 와 같은 계산을 밀린 좌표에서 한 번 더)가 유리보다 앞이면 밀지 않은 좌표로 돌아가는 방법을 쓴다. 투명 물체는 Opaque Texture 에 없어 유리 뒤에서 사라진다. 2D Renderer 는 Opaque Texture 를 쓰지 않는다.
- 텍스처: 노이즈가 필요하면 `tools/textures/screen-refraction-glass-noise.mjs` (데이터라 `linear`, `repeat`, 128 이하, 32KB 이하, 래퍼 기본값 `"linearGrey"`). 셰이더 노이즈로 충분하면 만들지 않는다.
- 단계 보기 후보: 굴절 방향, 밀린 화면 좌표, 휜 배경, 최종.
- 효과 끄기 후보: 화면 좌표를 밀지 않고 씬 색상을 그대로 써 유리가 투명한 판처럼 아무것도 휘지 않는 모습, 또는 앞 물체 끌림을 막지 않은 모습. 화면에서 분명한 것을 고른다.
- C# 스크립트: 없다.
- XR: 모바일 XR 용 URP 에셋은 Opaque Texture 가 꺼져 있다. `unity.pitfalls` 에 적는다.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 3D 외부 에셋 FORGE3D 의 HeatDepthFixed, XR 01 Lake Shader 처럼 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs screen-refraction-glass` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
