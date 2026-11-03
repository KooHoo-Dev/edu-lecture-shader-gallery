---
# 묶음 7 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs ground-aoe-indicator
  - node tools/unity.mjs ground-aoe-indicator
  - node tools/shots.mjs ground-aoe-indicator
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/ground-aoe-indicator/**
  - Assets/Shaders/ground-aoe-indicator.meta
  - web/src/specimens/ground-aoe-indicator/**
  - web/src/shots/ground-aoe-indicator/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: ground-aoe-indicator

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/force-field-intersection/` 와 `web/src/specimens/force-field-intersection/meta.ts` (깊이 무대 투명 메시와 깊이 읽기. 씬 색상은 쓰지 않는다). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "29. ground-aoe-indicator" 카드와 7절 결정 표.

## 표본별

- ID `ground-aoe-indicator`, 파일과 셰이더 이름 `GroundAoeIndicator`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (지면 범위 표시, 그룹 D, 순서 6, 난이도 3).
- 무대와 혼합: 깊이 무대 `mesh: 'cube'`(바닥과 두 소품의 옆면을 덮는 상자), `blend: 'alpha'`, `requires: ['depth']`, `ZWrite Off`, `Cull Back`(카메라가 상자 밖). 상자 메시 자체는 보이지 않고, 상자 안에 있는 씬 표면에만 표시가 붙는다.
- 위치 복원(핵심 원리): 깊이 무대 `SgInput.cameraPosOS`(2026-11-03 추가, 가이드 4절)를 쓴다. `float sceneEye = sgSceneDepth(i.screenUV); float pixelEye = sceneEye - i.depthDelta; float3 sceneOS = i.positionOS + (i.positionOS - i.cameraPosOS) * (sceneEye / pixelEye - 1.0);` 이 같은 시선 위 씬 표면의 상자 공간 위치다. 상자 공간에서 `abs(sceneOS) > 0.5` 면 버린다(알파 0). 첫 단계에서 `frac(sceneOS * 4)` 같은 격자를 칠해 바닥, 상자 소품, 공에 같은 격자가 붙는지 웹과 Unity 촬영으로 확인한다. 어긋나면 공식이나 무대 입력이 틀린 것이므로 보고에 적는다 (앱 쪽 확인 대상).
- 모양: 상자 공간 xz 로 원, 고리, 부채꼴(`_Shape` select, 부채꼴 각도는 `showWhen`) SDF. 반지름은 상자 반폭 대비. 테두리 두께, 안쪽 채움 진하기, 시전 진행 `_Fill`(가운데에서 바깥으로 차오른다), 색, 밝기(색과 분리). 경계는 고정 폭으로 부드럽게 한다 (깊이가 끊기는 물체 윤곽에서 `fwidth` 가 튀어 선이 생긴다).
- 옆면 감쇠: `normalize(cross(ddy(sceneWS), ddx(sceneWS)))` 처럼 되살린 위치의 미분으로 표면 법선을 구해(상자 공간 위치로 해도 된다) 위쪽 성분이 문턱보다 작은 면(소품 옆면)을 흐리게 한다. 부호와 축 방향은 웹과 Unity 에서 같은지 촬영으로 확인한다. 상자 높이 방향 끝에서도 부드럽게 줄인다.
- 이벤트와 데모: 이벤트 "시전" 이 `_Fill` 을 0→1 (1.5초) 로 움직이고 자동 데모가 3초마다 시전한다. 테두리 맥동을 넣으면 2Hz 이하, 밝기 변화 10% 미만. 넓은 면을 포화된 빨강으로 덮지 않는다 (가이드 7절, 공격 예고는 주황이나 어둡고 채도 낮은 빨강).
- 프리셋: 사거리 원(얇은 고리, 하늘색, 채움 거의 없음), 공격 예고(원, 주황, 반투명 채움, 시전), 부채꼴 공격(90도, 노랑, 방향은 상자 +Z).
- 단계 보기 후보: 되살린 위치 격자, 상자 공간 좌표와 상자 밖 버리기(xz 를 빨강·초록, 밖은 검정), 모양 SDF 마스크, 옆면 감쇠. 마지막 단계가 최종 화면과 같으면 넣지 않는다.
- 효과 끄기: 옆면 감쇠를 뺀다. 원 가장자리가 상자 소품과 공의 옆면을 타고 세로 줄무늬로 흘러내린다. 무대 상자가 소품 옆면을 실제로 덮는지 화면으로 확인하고, 안 덮이면 화면에서 분명한 다른 흔한 실수(상자 표면 위치를 그대로 써서 원이 상자 앞면에 서 있는 모습)를 고른다.
- C# 스크립트 `GroundIndicatorCharge`(namespace `ShaderGallery.Samples`): `Cast(float duration)` 이 `renderer.material` 복사본의 `_Fill` 을 0→1 로 올리고 끝나면 표시를 끈다. 시전은 `Time.deltaTime` 으로 쌓는다(일시정지를 따른다). `OnDisable` 에서 코루틴을 멈추고 `OnDestroy` 에서 복사본을 지운다.
- `unity.pitfalls` 후보: URP Decal Projector 는 Shader Graph Decal 머티리얼만 받아 이 HLSL 셰이더를 넣을 수 없다(손으로 쓴 박스 투영이 머티리얼 하나로 되는 이유, 조명 받는 데칼은 내장 Decal 이 낫다), URP Asset 의 Depth Texture 를 켠다(Scene 뷰에는 보이는데 Game 뷰에 안 보이는 증상), 서 있는 캐릭터도 칠해진다(상자를 낮게, 스텐실은 확인하지 않은 일반 방법으로만), 깊이 텍스처에 없는 투명 물체(물, 유리)에는 투영되지 않는다, 카메라가 상자 안에 들어가면 앞면이 잘려 사라진다(뒷면을 그리는 설정은 확인하지 않음으로 적는다), 비용은 화면에서 상자 넓이에 비례, XR·모바일은 Depth Texture 비용.
- `inspiredBy`: 빈 배열 (카드 29번: 깊이 투영 방식의 대표작 미확인). 게임명은 어디에도 쓰지 않는다. `references` 는 카드의 Wronski 글, Unity 블로그(Aras 2015), Unity 6.3 깊이에서 월드 위치 복원 문서, Unreal 데칼 문서 중에서 고른다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs ground-aoe-indicator` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다. 움직임을 말하는 글("흐른다", "끓듯이")은 `burst` 연속 촬영 시트로 확인한다 (가이드 8절).
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
