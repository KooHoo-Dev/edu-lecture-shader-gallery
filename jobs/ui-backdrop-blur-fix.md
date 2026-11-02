---
# 묶음 5 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs ui-backdrop-blur
  - node tools/unity.mjs ui-backdrop-blur
  - node tools/shots.mjs ui-backdrop-blur
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/ui-backdrop-blur/**
  - Assets/Shaders/ui-backdrop-blur.meta
  - web/src/specimens/ui-backdrop-blur/**
  - web/src/shots/ui-backdrop-blur/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: ui-backdrop-blur 리뷰 반영

`ui-backdrop-blur` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. UI 래퍼 구조, 나선 샘플링과 화면비 보정, 단계 4개, 효과 끄기(십자 4탭), 2D 설명은 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 가이드와 앱에 리뷰에서 나온 규칙이 들어갔다. 읽고 따른다: 4절 깊이 무대의 `sgSceneDepth(uv)` 와 `cameraRightWS`·`cameraUpWS` (웹과 Unity 를 촬영으로 비교해 확인), 직교 카메라를 고려한 `sgSceneDepth`, 법선 래퍼의 `_GBUFFER_NORMALS_OCT`, Normal 요청의 DepthNormals 프리패스, 직접 샘플링하는 `sgSceneColor` 의 `ClampAndScaleUVForBilinear`, Overlay 캔버스 서술과 Unity 6.3 메뉴 이름(`UI (Canvas) > Image`), 5절 `unity.graph` 의 Custom Function 형식과 마지막 단계 규칙과 `thumbnail`, 6절 머티리얼 에셋을 고치는 컨트롤러는 하나만(이벤트 값은 0 으로 되돌림)과 `static` 제한기, 7절 포화된 빨강.
- '그대로 넣기' 프롬프트에 이제 `unity.setup` 이 함께 들어간다. 전체 화면 표본의 Depth·Normal 단계는 Full Screen Pass 의 Requirements 로 안내된다. 깊이 무대의 `quad` 는 바닥에서 띄워 (0, 0.95, 0) 크기 1.6 에 놓이고, 촬영 도구는 UI 셰이더의 `unity_GUIZTestMode` 를 LessEqual 로 고정한다.
- `tools/check.mjs` 가 C# 없는 이벤트, 경계 처리 없이 직접 샘플링한 `sgSceneColor`, `_float` 형식이 없는 Custom Function 안내를 경고한다.
- 링크 쿼리 `t=<초>` 로 웹 무대 시간을 멈춘 채 찍을 수 있다. 다만 멈춘 시간에서는 이벤트가 시작 시각에 머문다. `live.mjs` 는 한 번에 `--query` 하나만 받는다.

## 필수

1. **Overlay 서술**: "Overlay 캔버스는 Opaque Texture 를 읽을 수 없다" 는 URP 17.3 소스와 맞지 않을 수 있다 (Overlay UI 를 카메라 렌더 그래프 안에서 그리며 전역 텍스처를 모두 쓴다). 가이드 4절 UI 래퍼 절의 새 서술대로 "보장되지 않고 확인하지 않았다, 읽혀도 투명 물체와 후처리가 빠진 복사본이라 색이 다르다" 로 고치고 Camera 캔버스를 권하는 것은 유지한다 (`.shader` 주석, `meta.ts` 의 setup·pitfalls·goals). UI 전용 Overlay 카메라(카메라 스택)는 Opaque Texture 를 만들지 않는다는 점도 넣는다.
2. **C# 없는 이벤트**: 이벤트는 C# 이 하는 일과 같아야 한다 (가이드 5절). `events` 를 지우고 `demo.loops` 에 `_Hide` 트랙을 두거나, 가이드 6절 UGUI 규칙(복사본을 처음 쓸 때 만들기, `materialForRendering`)을 따르는 C# 을 더한다. `ui-sdf-shape` 의 C# 을 참고한다.
3. **직접 샘플링의 경계 처리**: `sgSceneColor` 가 `ClampAndScaleUVForBilinear` 를 뺐다. LOD 0 으로 바꾼 이유는 타당하니 그대로 두고 가이드 4절대로 `uv = ClampAndScaleUVForBilinear(UnityStereoTransformScreenSpaceTex(uv), _CameraOpaqueTexture_TexelSize.xy);` 다음에 `SAMPLE_TEXTURE2D_X_LOD(..., uv, 0)` 으로 바꾼다.
4. **패널 배치가 바뀌었다**: 깊이 무대의 `quad` 가 이제 바닥에서 떠 있다 (0, 0.95, 0, 크기 1.6). 아래 모서리가 보이니 기본 화면, 단계, 촬영을 다시 보고 글을 맞춘다.

## 권장

5. 메뉴 이름은 Unity 6.3 의 `GameObject > UI (Canvas) > Image` 다.
6. mobile-hud 의 "비용 4분의 1" 은 High 기준이다. 기본값 Medium 대비로는 절반이다.
7. 래퍼를 복사하며 지운 근거 주석(`UNITY_UI_ALPHACLIP` 을 multi_compile 로 두는 이유, `_ClipRect` 클램프 이유, `_TextureSampleAdd` 를 옮기지 않은 이유)을 되살린다.
8. 탭마다 sin, cos, sqrt, exp 를 계산해 High 에서 픽셀당 128회다. 회전을 누적해 sin, cos 를 한 번으로 줄인다. 알갱이(IGN)가 화면에 고정이라 패널이 움직여도 제자리에 남는 점을 `mistakes` 에 한 줄 적는다.

## 끝내기 전에

1. `node tools/check.mjs ui-backdrop-blur` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 단계, 프리셋 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
