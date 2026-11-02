---
# 묶음 5 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
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

# 표본 수정: depth-normal-edge-outline 리뷰 반영

`depth-normal-edge-outline` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. Roberts 네 점과 두께 처리, 상대 깊이, 법선 문턱, 거리 감쇠, 하늘 처리, 단계 3개, 효과 끄기는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 가이드와 앱에 리뷰에서 나온 규칙이 들어갔다. 읽고 따른다: 4절 깊이 무대의 `sgSceneDepth(uv)` 와 `cameraRightWS`·`cameraUpWS` (웹과 Unity 를 촬영으로 비교해 확인), 직교 카메라를 고려한 `sgSceneDepth`, 법선 래퍼의 `_GBUFFER_NORMALS_OCT`, Normal 요청의 DepthNormals 프리패스, 직접 샘플링하는 `sgSceneColor` 의 `ClampAndScaleUVForBilinear`, Overlay 캔버스 서술과 Unity 6.3 메뉴 이름(`UI (Canvas) > Image`), 5절 `unity.graph` 의 Custom Function 형식과 마지막 단계 규칙과 `thumbnail`, 6절 머티리얼 에셋을 고치는 컨트롤러는 하나만(이벤트 값은 0 으로 되돌림)과 `static` 제한기, 7절 포화된 빨강.
- '그대로 넣기' 프롬프트에 이제 `unity.setup` 이 함께 들어간다. 전체 화면 표본의 Depth·Normal 단계는 Full Screen Pass 의 Requirements 로 안내된다. 깊이 무대의 `quad` 는 바닥에서 띄워 (0, 0.95, 0) 크기 1.6 에 놓이고, 촬영 도구는 UI 셰이더의 `unity_GUIZTestMode` 를 LessEqual 로 고정한다.
- `tools/check.mjs` 가 C# 없는 이벤트, 경계 처리 없이 직접 샘플링한 `sgSceneColor`, `_float` 형식이 없는 Custom Function 안내를 경고한다.
- 링크 쿼리 `t=<초>` 로 웹 무대 시간을 멈춘 채 찍을 수 있다. 다만 멈춘 시간에서는 이벤트가 시작 시각에 머문다. `live.mjs` 는 한 번에 `--query` 하나만 받는다.

## 필수

1. **DepthNormals 패스가 없는 셰이더**: Requirements 의 Normal 은 불투명 물체를 DepthNormals 패스로 다시 그리는 프리패스를 강제하고 깊이도 그 패스에서 나온다. 직접 쓴 언릿·툰 셰이더 물체는 화면에 보이는데 선이 하나도 없다. `mistakes` 의 투명 항목을 "투명 물체나 직접 만든 셰이더 물체에 윤곽이 없다" 로 합치고 해결(DepthNormals 패스 추가, 디졸브 래퍼 참고)을 적는다.
2. **비용 비교가 틀렸다**: "물체 수와는 상관없다" (pitfalls, `related`) 는 위 프리패스가 불투명 물체 전체를 한 번 더 그리므로 맞지 않다 (SSAO 등이 이미 쓰면 추가 비용 없음). 비교 축을 고친다: 비용(전체 화면 패스 + 불투명 전체 한 번 더 vs 고른 물체만 한 번 더), 선 두께(화면 픽셀 고정 vs 월드 단위), 안쪽 접힌 모서리는 후처리만 잡는다. `goals` 의 "먼 바닥과 가까운 물체에 같은 기준" 은 같은 각도의 면에서만 맞으니 다듬는다.
3. **Deferred 의 G-buffer 법선**: 래퍼에 `#pragma multi_compile_fragment _ _GBUFFER_NORMALS_OCT` 를 더한다 (가이드 4절). 없으면 Deferred + Accurate G-buffer Normals 에서 매끈한 공에도 얼룩 선이 생긴다.

## 권장

4. 래퍼의 `sgSceneDepth` 를 가이드 4절의 직교 카메라 분기 판으로 바꾼다 (아이소메트릭 카메라에서 깊이 윤곽이 사라진다).
5. 기본 썸네일이 약하다 (Unity 촬영을 줄이면 3px 선이 약 1.7px). `thumbnail` 로 `sketch` 같은 촬영을 고른다.
6. 2D 함정은 "확인하지 않았다" 대신 "소스로 보면 2D Renderer 는 법선 텍스처를 만들지 않는다" 로 단정한다.
7. `mistakes` 보완: 샘플 간격이 픽셀이라 해상도에 따라 비스듬한 바닥의 띠도 달라진다. 깊이 문턱을 `1 / dot(N, V)` 로 키우는 정석 해결과, MSAA 계단에는 이 패스 뒤에 도는 FXAA·SMAA 가 도움이 된다는 점을 한 구절씩 더한다.

## 끝내기 전에

1. `node tools/check.mjs depth-normal-edge-outline` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 단계, 프리셋 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
