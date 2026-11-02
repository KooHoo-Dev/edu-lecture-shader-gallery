---
# 묶음 4 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs surface-wet-snow
  - node tools/unity.mjs surface-wet-snow
  - node tools/shots.mjs surface-wet-snow
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/surface-wet-snow/**
  - Assets/Shaders/surface-wet-snow.meta
  - web/src/specimens/surface-wet-snow/**
  - web/src/shots/surface-wet-snow/**
  - tools/textures/surface-wet-snow-stone.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: surface-wet-snow

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/dissolve-edge-glow/` 와 `web/src/specimens/dissolve-edge-glow/meta.ts` (메시). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "11. surface-wet-snow" 카드와 7절 결정 표.

## 표본별

- ID `surface-wet-snow`, 파일과 셰이더 이름 `SurfaceWetSnow`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (젖음과 눈 쌓임, 그룹 C, 순서 4).
- 무대와 혼합: 메시 무대, `mesh: 'sphere'` (카메라가 큐브 윗면보다 낮아 큐브는 윗면이 안 보인다), 불투명(`blend: 'cutout'`, 알파 1). 메시 무대는 물체가 천천히 돈다. 월드 법선으로 만든 마스크는 돌아도 위쪽에 남는다.
- 텍스처: 직접 만든다. `tools/textures/surface-wet-snow-stone.mjs` 에 반복되는 돌이나 벽돌 바탕(색이라 sRGB, `repeat`, 256 이하, 32KB 이하)을 만들어 젖음과 눈이 얹히는 차이가 보이게 한다.
- 효과의 핵심: `normalWS.y` 로 윗면 마스크를 만들고 노이즈로 경계를 깨며, 양(coverage) 값으로 덮는 정도를 정한다. 모드(select) 두 가지: 젖음(알베도를 어둡게, 하이라이트를 좁고 강하게)과 눈(흰 색, 약간의 반짝임). 하이라이트는 `lightDirWS`, `viewWS`, `normalWS`, `lightColor` 로 core 에서 직접 계산한다 (래퍼는 URP Lit 이 아니다). 모드, 양, 경계 부드러움, 노이즈 크기, 젖음 어둡기, 광택, 눈 색을 조절 값으로 둔다.
- 이벤트: 소나기나 눈발처럼 잠깐 덮는 정도를 올렸다 내리는 연출. 가이드 5절대로 더하기용 전용 값을 움직인다.
- C# 스크립트: 날씨 값(젖음 또는 눈의 양)을 시간에 따라 올리고 내리는 작은 컨트롤러. 한 물체는 `renderer.material` 복사본, 여러 물체를 함께 바꾸려면 머티리얼 에셋을 바꾸고 `OnDisable` 에서 되돌린다는 점을 가이드 6절대로 적는다.
- 효과 끄기 후보: 월드 법선 대신 오브젝트 공간 법선(`normalOS`)을 써서, 물체가 돌면 눈이 옆면과 아래로 돌아가는 실수. 메시 무대가 돌므로 화면에서 분명히 보인다.
- 단계 보기 후보: 윗면 마스크, 노이즈로 깬 마스크, 젖음이나 눈 재질, 최종.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 3D 01 Rendering, 05 Terrain 처럼 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs surface-wet-snow` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
