---
# 묶음 5 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs screen-shockwave-distortion
  - node tools/unity.mjs screen-shockwave-distortion
  - node tools/shots.mjs screen-shockwave-distortion
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/screen-shockwave-distortion/**
  - Assets/Shaders/screen-shockwave-distortion.meta
  - web/src/specimens/screen-shockwave-distortion/**
  - web/src/shots/screen-shockwave-distortion/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: screen-shockwave-distortion 리뷰 반영

`screen-shockwave-distortion` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 고리·화면비·감쇠 수식, 미는 방향, 노이즈 감싸기, 이벤트 트랙 규칙, 단계 4개, 효과 끄기는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 가이드와 앱에 리뷰에서 나온 규칙이 들어갔다. 읽고 따른다: 4절 깊이 무대의 `sgSceneDepth(uv)` 와 `cameraRightWS`·`cameraUpWS` (웹과 Unity 를 촬영으로 비교해 확인), 직교 카메라를 고려한 `sgSceneDepth`, 법선 래퍼의 `_GBUFFER_NORMALS_OCT`, Normal 요청의 DepthNormals 프리패스, 직접 샘플링하는 `sgSceneColor` 의 `ClampAndScaleUVForBilinear`, Overlay 캔버스 서술과 Unity 6.3 메뉴 이름(`UI (Canvas) > Image`), 5절 `unity.graph` 의 Custom Function 형식과 마지막 단계 규칙과 `thumbnail`, 6절 머티리얼 에셋을 고치는 컨트롤러는 하나만(이벤트 값은 0 으로 되돌림)과 `static` 제한기, 7절 포화된 빨강.
- '그대로 넣기' 프롬프트에 이제 `unity.setup` 이 함께 들어간다. 전체 화면 표본의 Depth·Normal 단계는 Full Screen Pass 의 Requirements 로 안내된다. 깊이 무대의 `quad` 는 바닥에서 띄워 (0, 0.95, 0) 크기 1.6 에 놓이고, 촬영 도구는 UI 셰이더의 `unity_GUIZTestMode` 를 LessEqual 로 고정한다.
- `tools/check.mjs` 가 C# 없는 이벤트, 경계 처리 없이 직접 샘플링한 `sgSceneColor`, `_float` 형식이 없는 Custom Function 안내를 경고한다.
- 링크 쿼리 `t=<초>` 로 웹 무대 시간을 멈춘 채 찍을 수 있다. 다만 멈춘 시간에서는 이벤트가 시작 시각에 머문다. `live.mjs` 는 한 번에 `--query` 하나만 받는다.

## 필수

1. **컨트롤러가 둘 이상이면 에셋이 망가진다**: `Awake` 가 그 순간의 에셋 값을 저장하고 `OnDisable` 이 되써서, 폭발 프리팹마다 컨트롤러를 붙이면 서로의 중간 값(퍼지는 중의 반경, 세기)을 에셋에 남기고 멈춘 고리가 화면과 에디터에 남는다. 가이드 6절대로 이벤트 전용 값(`_BlastRadius`, `_BlastStrength`)은 항상 0 으로 되돌리고, `ScreenTransitionController` 처럼 `Instance` 하나만 남겨 중복은 스스로 지운다. 다른 스크립트는 `Instance.Play(pos)` 를 부른다. setup 과 `mistakes` 에 "씬에 하나만 둔다" 를 적는다.
2. **편집 중 고리**: 썸네일용 기본값 `_Strength = 0.06` 이 Scene·Game 뷰와 컨트롤러 없는 씬, 빌드에 그대로 걸린다. 가이드 6절대로 setup 에 "머티리얼의 세기를 0 으로 낮춘다" 단계를 넣고, verify 를 "플레이 중 `Play(위치)` → 고리가 퍼지고 1.5초 뒤 사라진다" 처럼 고친다.
3. **연타와 flashes 근거**: `Play` 를 0.1초마다 부르면 넓은 띠가 초당 10번 튄다. 색수차는 밝은 물체와 어두운 배경 경계에 포화된 빨강 띠를 만든다 (가이드 7절 정의). `flashes` 는 false 로 두되 `Play` 에 가이드 6절의 `static` 최소 간격(실제 시간, `Mathf.Max(minInterval, 0.34f)`, `[RuntimeInitializeOnLoadMethod]`)을 넣고, 주석과 pitfalls 의 "밝기를 바꾸지 않는다" 를 사실대로(색수차 빨강 띠, 연타 제한) 고친다.
4. **`unity.graph`**: `shockwavePush` 는 전역 속성과 다른 헬퍼를 읽어 String 모드에 그대로 넣으면 컴파일되지 않는다. `void ShockwavePush_float(float Dist, float Radius, float Width, float FadeRadius, float Strength, out float Push)` 처럼 식을 옮긴다고 쓰고, 폭발 고리는 같은 노드를 하나 더 두어 더한다고 쓴다.
5. **XR**: `WorldToViewportPoint(pos, MonoOrStereoscopicEye.Left/Right)` 와 `unity_StereoEyeIndex` 를 확인된 해법처럼 적었다. "실기기 미확인" 을 붙이고(가이드 4절), 보정된 대안으로 폭발 위치의 월드 공간 구나 쿼드에서 `screen-refraction-glass` 처럼 씬 색상을 밀어 읽으면 눈마다 맞는다는 점을 먼저 권한다. 눈을 고르는 일은 래퍼가 맡는다고 적는다.

## 권장

6. 웹 이벤트는 멈춘 기본 고리 위에 폭발 고리를 겹쳐 보이지만 Unity 컨트롤러는 기본 고리를 끈다. 해설에 한 줄 적는다.
7. 아지랑이가 한 점에서 약 4Hz 로 흔들린다. 가이드 7절 권장(3Hz)에 맞춰 낮춘다.
8. `related` 에 `screen-refraction-glass` 를 더한다 (XR 대안).

## 끝내기 전에

1. `node tools/check.mjs screen-shockwave-distortion` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 단계, 아지랑이 프리셋, 폭발 이벤트(`t=` 없이) 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
