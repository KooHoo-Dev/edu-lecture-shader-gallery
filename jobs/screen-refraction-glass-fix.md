---
# 묶음 5 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
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

# 표본 수정: screen-refraction-glass 리뷰 반영

`screen-refraction-glass` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 굴절 방향(refract 로 안쪽을 읽어 확대), 노이즈 흐름과 64 주기, 단계 4개, 효과 끄기, SRP Batcher·XR 매크로, 안개·정적 배칭 pitfalls 는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 가이드와 앱에 리뷰에서 나온 규칙이 들어갔다. 읽고 따른다: 4절 깊이 무대의 `sgSceneDepth(uv)` 와 `cameraRightWS`·`cameraUpWS` (웹과 Unity 를 촬영으로 비교해 확인), 직교 카메라를 고려한 `sgSceneDepth`, 법선 래퍼의 `_GBUFFER_NORMALS_OCT`, Normal 요청의 DepthNormals 프리패스, 직접 샘플링하는 `sgSceneColor` 의 `ClampAndScaleUVForBilinear`, Overlay 캔버스 서술과 Unity 6.3 메뉴 이름(`UI (Canvas) > Image`), 5절 `unity.graph` 의 Custom Function 형식과 마지막 단계 규칙과 `thumbnail`, 6절 머티리얼 에셋을 고치는 컨트롤러는 하나만(이벤트 값은 0 으로 되돌림)과 `static` 제한기, 7절 포화된 빨강.
- '그대로 넣기' 프롬프트에 이제 `unity.setup` 이 함께 들어간다. 전체 화면 표본의 Depth·Normal 단계는 Full Screen Pass 의 Requirements 로 안내된다. 깊이 무대의 `quad` 는 바닥에서 띄워 (0, 0.95, 0) 크기 1.6 에 놓이고, 촬영 도구는 UI 셰이더의 `unity_GUIZTestMode` 를 LessEqual 로 고정한다.
- `tools/check.mjs` 가 C# 없는 이벤트, 경계 처리 없이 직접 샘플링한 `sgSceneColor`, `_float` 형식이 없는 Custom Function 안내를 경고한다.
- 링크 쿼리 `t=<초>` 로 웹 무대 시간을 멈춘 채 찍을 수 있다. 다만 멈춘 시간에서는 이벤트가 시작 시각에 머문다. `live.mjs` 는 한 번에 `--query` 하나만 받는다.

## 필수

1. **앞 물체 끌림 방지가 코드에 없다**: `contact = saturate(depthDelta / 0.15)` 근사는 유리를 뚫고 나온 물체의 접점만 덜 민다. 유리 앞에 떨어져 선 물체(창 앞을 지나는 캐릭터, adaptIdeas[0])는 막지 못한다. 이제 깊이 무대에 `sgSceneDepth(uv)` 가 있으니 core 에서 이 픽셀의 눈 깊이(`sgSceneDepth(i.screenUV) - i.depthDelta`)와 밀린 좌표 R, G, B 각각의 `sgSceneDepth` 를 비교해, 밀린 좌표가 유리보다 앞이면 밀지 않은 좌표로 돌아가게 한다 (가이드 4절). 래퍼에 `sgSceneDepth` 헬퍼를 둔다. `mistakes` 의 "래퍼의 frag 에서 검사" 는 지운다.
2. **미는 축**: `cross(Y, rayWS)` 로 만든 축은 카메라 오른쪽이 아니라 픽셀마다 수평인 축이라, 카메라가 기울거나 크게 내려다보면 미는 방향이 돌고 정수직 탑다운에서는 0 벡터의 normalize 로 NaN 이 된다. 깊이 무대의 `cameraRightWS`, `cameraUpWS` 로 화면 축을 만든다 (래퍼는 `UNITY_MATRIX_V[0].xyz`, `[1].xyz`).
3. **미는 양과 화면비**: 오프셋이 화면 uv 고정값이라 화면 폭 10% 크기의 유리는 자기 폭의 두 배 넘게 떨어진 곳을 비추고, x 가 화면 폭 단위라 16:9 에서 가로로 1.78배 더 민다. 최대값은 1 uv 를 넘어 가장자리가 번진다. `ddx/ddy(i.screenUV)` 로 화면비를 보정하고 범위를 줄인다. 거리에 따른 차이는 `unity.pitfalls` 에 적는다.
4. **`unity.graph` 부호**: View 공간 Normal 의 xy 를 그대로 더하면 바깥을 읽어 축소 렌즈가 된다. core 와 같게 "Negate 해서 더한다" 로 고친다.

## 권장

5. 색수차 순서가 물리와 반대다 (실제로는 파랑이 더 꺾인다). 순서를 바꾸거나 의도라고 주석에 적는다.
6. pitfalls[0] 의 "2D 용 URP Asset 은 Opaque Texture 가 꺼져 있어" 는 다른 항목과 모순된다. 2D Renderer 는 켜도 Opaque Texture 를 만들지 않고 이 패스도 그리지 않는다.
7. "거리" 를 가이드의 새 정의대로 "눈 깊이" 로 바꾼다 (`.shader` 주석, `mistakes`).
8. 유리는 알파 1 로 덮어쓰고 ZWrite Off 라, 나중에 그려지는 유리 뒤 투명 물체가 굴절 없이 위에 얹힌다. `ZWrite On` 을 검토하고, `mistakes` 의 큐 경계는 3000 이 아니라 2500(불투명 범위의 끝)이다.
9. `mistakes` 의 2D 대안에 Camera Sorting Layer Texture 를 함께 적는다.

## 끝내기 전에

1. `node tools/check.mjs screen-refraction-glass` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 단계, 프리셋 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
