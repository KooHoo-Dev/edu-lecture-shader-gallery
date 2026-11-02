---
# 묶음 4 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
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

# 표본 수정: surface-wet-snow 리뷰 반영

`surface-wet-snow` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 래퍼(디졸브와 같은 네 패스, 3인자 GetMainLight), 월드 법선 마스크와 노이즈, 덮는 양의 범위, 텍스처, 효과 끄기 방식, C# 의 복사본·에셋 경로 처리는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 가이드에 리뷰에서 나온 규칙이 들어갔다. 읽고 따른다: 3-4절 텍스처 반복을 range 로 노출, 4절 XR 의 화면 중심(uv 0.5 는 눈 정면이 아님)과 래퍼의 distanceAttenuation 주석, 5절 `steps` 의 마지막 단계와 `unity.graph` 의 Custom Function 형식과 `thumbnail` 의 쓰임, 6절 머티리얼 기본값과 공유 머티리얼 제한기의 `static`, 7절 포화된 빨강의 정의와 느린 맥동.
- 링크 쿼리 `t=<초>` 로 웹 무대 시간을 멈춘 채 찍을 수 있다 (가이드 8절). `live.mjs` 는 한 번에 `--query` 하나만 받는다.
- 가이드 4절의 Depth Priming 설명을 바로잡았다 (프라이밍은 두 번째 패스를 ZTest Equal 로 덮어써 사라지게 한다. 자기 겹침은 Deferred 순서와 여러 렌더러·서브메시에서 생긴다). `depthDelta` 정의는 눈 깊이 차로 고쳤다. '그대로 넣기' 프롬프트는 이제 linear·point 텍스처에 Compression None 단계를, Depth 설정에 Depth Texture Mode 안내를 자동으로 넣는다.

## 필수

1. **텍스처 반복**: `SURFACE_TILING float2(6.0, 3.0)` 은 구 UV 에만 맞아 큐브 면이나 Plane 에서는 벽돌이 세로로 2배 늘어나고, `[NoScaleOffset]` 이라 사용자가 바꿀 방법도 없다. 그런데 setup 은 바위, 벽, 계단에 쓰라고 안내한다. `_TilingU`, `_TilingV` range 속성(기본 6, 3)을 Properties, CBUFFER, `meta.params` 에 더하고 hint 에 메시마다 맞추는 법을 쓴다 (가이드 3-4절).
2. **C# 이 덮는 양을 바꾼다는 글**: `_Coverage` hint, `prompt.goal`, `adaptIdeas[0]` 은 C# 이 날씨에 맞춰 덮는 양을 바꾼다고 하지만 `SurfaceWeatherController` 는 `_Storm` 만 움직인다. `SetCoverage(target, seconds)` 를 더하거나(에셋 경로면 `OnDisable` 복원 포함) 글을 코드에 맞게 고친다. 더한다면 이벤트 트랙과의 관계(이벤트는 `_Storm` 더하기 값)를 해설에 분명히 쓴다.

## 권장

3. 래퍼에 디졸브의 distanceAttenuation 주석을 되살리고 `unity.pitfalls` 에 "광원의 Culling Mask 와 Rendering Layers 가 무시된다" 를 한 구절 넣는다 (가이드 4절).
4. `_WetDarkness` hint 의 "1 이면 원래의 10%" 는 실제 식(`0.32 · albedo²`)과 다르다. "밝은 돌 기준 약 10%" 처럼 고친다.
5. pitfall 의 "메시 스케일이 크면 노이즈도 커진다" 는 Transform Scale 에만 맞다. 오브젝트 좌표가 큰 메시에서는 노이즈와 반짝임 칸이 오히려 잘아진다. 한정해서 쓴다.
6. `mistakes` 의 전역 값 대안은 `_Storm` 을 Properties 에서도 빼야 `Shader.SetGlobalFloat` 이 먹는다는 조건을 더한다.
7. `SgInput` 의 `positionWS` 는 core 가 쓰지 않고, `normalOS` 는 웹 전용 `SG_OFF` 에서만 쓰인다. 주석을 사실대로 고치거나 Unity 쪽 보간기를 줄인다.
8. 4단계 "최종" 은 앱의 최종 화면과 같다. 가이드 5절대로 빼고 단계 번호를 정리한다.

## 끝내기 전에

1. `node tools/check.mjs surface-wet-snow` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 단계, 젖음과 눈 프리셋, 이벤트 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
