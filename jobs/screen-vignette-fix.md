---
# 묶음 4 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs screen-vignette
  - node tools/unity.mjs screen-vignette
  - node tools/shots.mjs screen-vignette
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/screen-vignette/**
  - Assets/Shaders/screen-vignette.meta
  - web/src/specimens/screen-vignette/**
  - web/src/shots/screen-vignette/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: screen-vignette 리뷰 반영

`screen-vignette` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 래퍼(전환 샘플 구조), 저체력 맥동(0.8Hz, frac), C# 제한기의 실제 시간과 하한, 펄스 곡선, 머티리얼 복원, 단계 3개, 썸네일 선택, inspiredBy 는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 가이드에 리뷰에서 나온 규칙이 들어갔다. 읽고 따른다: 3-4절 텍스처 반복을 range 로 노출, 4절 XR 의 화면 중심(uv 0.5 는 눈 정면이 아님)과 래퍼의 distanceAttenuation 주석, 5절 `steps` 의 마지막 단계와 `unity.graph` 의 Custom Function 형식과 `thumbnail` 의 쓰임, 6절 머티리얼 기본값과 공유 머티리얼 제한기의 `static`, 7절 포화된 빨강의 정의와 느린 맥동.
- 링크 쿼리 `t=<초>` 로 웹 무대 시간을 멈춘 채 찍을 수 있다 (가이드 8절). `live.mjs` 는 한 번에 `--query` 하나만 받는다.
- 가이드 4절의 Depth Priming 설명을 바로잡았다 (프라이밍은 두 번째 패스를 ZTest Equal 로 덮어써 사라지게 한다. 자기 겹침은 Deferred 순서와 여러 렌더러·서브메시에서 생긴다). `depthDelta` 정의는 눈 깊이 차로 고쳤다. '그대로 넣기' 프롬프트는 이제 linear·point 텍스처에 Compression None 단계를, Depth 설정에 Depth Texture Mode 안내를 자동으로 넣는다.

## 필수

1. **[안전] 피격 펄스 면적과 색**: 피격 때 반경을 0.35 당기고 세기를 0.4 더해, 기본 피격 색 `#9e1f1f`(포화된 빨강, 가이드 7절 정의에 든다)가 Unity `hit` 촬영에서 화면의 약 80% 를 덮는다. 터널링 프리셋과 겹치면 거의 화면 전체다. 웹 자동 데모가 3초마다 재생한다. 반경 당김을 0.1 안팎으로 줄이고 하한을 둬 가장자리 띠에 머물게 하고, 피격 색을 어둡고 채도 낮게 바꾸거나 피격 마스크에 상한을 둔다. 가이드 7절 정의로 새 색을 계산해 보고에 적는다. `hit` 촬영과 자동 데모를 다시 확인한다.
2. **XR 화면 중심**: "uv 중심이 각 눈의 중심" 은 틀렸다. HMD 투영은 눈마다 비대칭이라 uv (0.5, 0.5) 는 시선 정면이 아니고, URP 내장 Vignette 는 투영 행렬로 보정한다. 래퍼 주석과 `unity.pitfalls` 를 "정면 아님, 실기기 미확인" 으로 고치고 XRI TunnelingVignetteController 나 Volume Vignette 를 먼저 권한다 (가이드 4절).
3. **Shader Graph 안내**: `unity.graph` 대로 하면 컴파일되지 않는다. Custom Function 은 `void 이름_float(..., out ...)` 형식만 받고, `core.hlsl` 을 통째로 지정하면 `SgInput`, `sgSource`, 머티리얼 값이 없다. 가이드 5절대로 필요한 함수만 감싸는 법으로 고친다.

## 권장

4. **제한기 공유**: 화면 머티리얼은 하나인데 `lastPulseTime` 이 인스턴스 필드라 컨트롤러가 둘이 되면 합쳐서 초당 3회를 넘는다. 가이드 6절대로 `static` 으로 두고 `[RuntimeInitializeOnLoadMethod]` 로 초기화한다.
5. **편집 중 비네트**: Full Screen Pass 는 Scene 뷰에도 걸려 썸네일용 기본값 `_Intensity 0.9` 가 편집 중과 컨트롤러 없는 씬에 그대로 보이고, 씬을 바꿀 때 `OnDisable` 이 0.9 로 되돌린 프레임이 보인다. `unity.setup` 에 평소 세기로 낮춰 두는 단계를 넣고 `verify` 문장을 기본값과 맞춘다 (가이드 6절).
6. **효과 끄기**: 끈 화면에서 `tint` 대신 `_VignetteColor` 를 써서 실수 두 개가 섞인다 (저체력과 피격이 검정으로 보인다). 하나만 보여 주거나 `offNote` 에 적는다.
7. `mistakes` 의 예시 `1 - length(uv - 0.5)` 를 세기로 쓰면 가운데가 가장 진하게 덮인다. 증상과 맞는 형식(`color *= ...`)으로 고친다.
8. `original` 의 Volume 비교를 공정하게: Volume 도 C# 으로 weight 를 움직일 수 있고, 내장 Vignette 는 Uber 패스 안이라 추가 패스가 없으며 XR 중심을 보정한다. Screen Space - Camera 캔버스는 비네트에 덮인다는 점을 pitfalls 에 넣는다.
9. 터널링 프리셋과 체력 연동이 `_Intensity` 를 함께 써서 `SetHealth` 가 터널링 세기를 덮어쓴다. 해설에 적거나 값을 나눈다.

## 끝내기 전에

1. `node tools/check.mjs screen-vignette` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본(썸네일 low-health 포함), 피격 이벤트, 터널링 프리셋 + 피격, 효과 끄기, 단계 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
