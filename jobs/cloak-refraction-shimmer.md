---
# 묶음 7 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs cloak-refraction-shimmer
  - node tools/unity.mjs cloak-refraction-shimmer
  - node tools/shots.mjs cloak-refraction-shimmer
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/cloak-refraction-shimmer/**
  - Assets/Shaders/cloak-refraction-shimmer.meta
  - web/src/specimens/cloak-refraction-shimmer/**
  - web/src/shots/cloak-refraction-shimmer/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: cloak-refraction-shimmer

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/screen-refraction-glass/` 와 `web/src/specimens/screen-refraction-glass/meta.ts` (깊이 무대의 씬 색상 굴절과 앞 물체 끌림 가드. 테두리는 `fresnel-rim-glow`, 경계 띠 훑기는 `dissolve-edge-glow` 참고). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "28. cloak-refraction-shimmer" 카드와 7절 결정 표.

## 표본별

- ID `cloak-refraction-shimmer`, 파일과 셰이더 이름 `CloakRefractionShimmer`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (클로킹 투명화, 그룹 B, 순서 4, 난이도 3).
- 무대와 혼합: 깊이 무대 `mesh: 'capsule'`, `blend: 'alpha'`, `requires: ['opaque', 'depth']`. 유리 표본처럼 뒤 장면을 직접 읽어 그리므로 평소 알파는 1 이고 `ZWrite On` 으로 몸의 가장 앞면만 남긴다. 래퍼의 Blend 는 `SrcAlpha OneMinusSrcAlpha` 로 두어 효과 끄기(웹 전용 분기)만 알파를 쓴다. 보이는 상태의 몸 음영에는 깊이 무대 `SgInput` 의 `lighting`, `lightDirWS`, `lightColor`(2026-11-03 추가, 가이드 4절)를 쓰고, 래퍼는 `GetMainLight` 3인자 규칙대로 채운다.
- 효과의 핵심: 진행값 `_Cloak`(0 보임 ~ 1 은신) 하나가 (1) 몸 색과 밀린 씬 색을 섞고 (2) 경계 띠를 몸 위로 훑는다. 씬 색은 법선을 `cameraRightWS`, `cameraUpWS` 에 내린 화면 오프셋으로 밀어 읽고 유리 표본의 앞 물체 가드를 그대로 쓴다. 프레넬 테두리로 은신 중에도 윤곽을 남긴다. 마스크 방식 select: 높이 훑기(발에서 머리, 노이즈로 경계를 흔든다), 노이즈 디졸브, 프레넬 안쪽부터(정면이 먼저 사라지고 윤곽이 끝까지 남는다). `_MaxCloak`(최대 은신, 같은 편에게는 덜 투명하게), 완전 은신 때 굴절을 줄이는 토글, 일렁임 속도와 노이즈 크기, 테두리 색·세기·날카로움, 경계 띠 색·폭·밝기, 몸 색을 조절 값으로 둔다.
- 이벤트와 데모: 자동 데모 루프가 `_Cloak` 를 0→1→0 으로 움직인다 (전환 0.5초 이상). 이벤트 "피격 노출" 은 더하기용 값 `_Reveal` 을 0→1→0 (약 0.4초) 으로 움직이고 셰이더가 은신에서 뺀다. 트랙은 절대값이므로 `_Cloak` 를 이벤트가 직접 움직이지 않는다 (`wind-sway-foliage` 의 `_Gust` 와 같은 방식).
- 프리셋(쓰임새 이름): 정찰 위장(굴절 작게, 테두리 약하게), 아군에게 보이는 위장(`_MaxCloak` 0.85, 테두리 강하게), 일렁이는 투명 몸(굴절 크게, 노이즈 빠르게), 완전 은신(테두리 0, 굴절 줄임: 왜 테두리를 남기는지 비교).
- 단계 보기 후보: 화면 공간 오프셋(법선을 색으로), 은신 마스크와 경계 띠(흑백), 가드를 거쳐 휜 배경, 프레넬 테두리. 마지막 단계가 최종 화면과 같으면 넣지 않는다.
- 효과 끄기: 굴절과 프레넬 없이 몸 색의 알파만 `1 - _Cloak` 로 낮추는 페이드. 중간에는 몸 뒷면과 뒤 장면이 겹쳐 비치고 끝에는 실루엣까지 사라진다. `offNote` 에 두 모습을 적는다.
- C# 스크립트 `CloakController`(namespace `ShaderGallery.Samples`): 자식의 모든 Renderer(SkinnedMeshRenderer 포함) 의 `material` 복사본을 모아 `_Cloak` 를 함께 움직이고 `OnDestroy` 에서 지운다. `SetCloaked(bool)` 은 코루틴으로 0.8~1.2초에 걸쳐 올리고 내리며, 절반을 넘으면 `shadowCastingMode = Off`, 내려가면 원래 값으로 돌린다. `RevealOnHit()` 는 `_Reveal` 펄스이고 `Time.unscaledTime` 기준 초당 3회 이하(하한 0.34초 고정) 제한기를 둔다. `OnDisable` 에서 코루틴을 멈추고 그림자 설정을 되돌린다. 키 입력은 넣지 않는다.
- `unity.pitfalls` 후보: Opaque Texture 는 불투명까지만 담아 뒤의 연기·파티클·물·유리는 망토 속에서 사라진다, 투명 큐의 캐릭터는 Depth Texture 에도 빠져 깊이를 읽는 다른 효과가 캐릭터를 무시한다(평소에는 불투명 머티리얼을 쓰고 은신할 때만 바꾸는 방법을 `adaptIdeas` 에), 팔이 몸통 앞을 지나도 몸통이 아닌 뒤 배경이 휜다(자기 자신을 비추지 못함), Depth Texture 가 꺼지면 앞 물체 가드가 동작하지 않는다, 2D Renderer 에는 Opaque Texture 가 없다, XR 은 Opaque Texture 가 눈마다 배열이고 단독형 기기에서는 끄라는 권고가 있다(실기기 미확인), 모바일은 Opaque Downsampling. 접근성: 전환이 넓은 면을 번쩍이지 않게 경계 띠 밝기를 낮게 둔다.
- `inspiredBy`: 카드에서 확인된 Team Fortress 2 (2007, Valve) 를 가이드 5절 형식으로 넣는다. 빌린 축은 "프레넬로 정면부터 사라지고 윤곽이 남는 은신 마스크", "같은 편에게는 최대 투명도를 제한". 링크는 카드의 Source SDK 셰이더 소스. 게임명은 `inspiredBy` 밖(참고 라벨 포함)에 쓰지 않는다 (`check.mjs` 가 검사한다). `references` 라벨 예: "Valve: Source SDK 클로크 패스 픽셀 셰이더", "Unity: URP Asset 의 Opaque Texture", "Shader Graph: Scene Color 노드".

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs cloak-refraction-shimmer` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다. 움직임을 말하는 글("흐른다", "끓듯이")은 `burst` 연속 촬영 시트로 확인한다 (가이드 8절).
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
