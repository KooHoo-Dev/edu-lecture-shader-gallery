---
# 묶음 1 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과를 main 에 먼저 합쳐 앱 수정(촬영 회전 등)과 함께 고친다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs triplanar-projection
  - node tools/unity.mjs triplanar-projection
  - node tools/shots.mjs triplanar-projection
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/triplanar-projection/**
  - Assets/Shaders/triplanar-projection.meta
  - web/src/specimens/triplanar-projection/**
  - web/src/shots/triplanar-projection/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: triplanar-projection 리뷰 반영

`triplanar-projection` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. `core.hlsl` 의 수학과 래퍼 구조는 리뷰에서 문제가 없었으니 바꾸지 않는다.

앱이 바뀌었다: mesh 무대 물체는 이제 Unity 촬영과 웹 첫 화면 모두 Y 30도에서 시작한다 (`web/src/stage/layout.ts` 의 `meshYawDeg`). 그래서 촬영에서도 큐브의 두 면이 보인다. '그대로 넣기' 프롬프트는 `stage.textures` 로 임포트 설정과 머티리얼 칸 단계를 자동으로 만든다.

## 필수

1. **촬영 상태**: 회전된 정지 화면에서는 월드와 오브젝트 공간의 차이가 보이지 않는다. `captures` 에서 `object` 를 빼고 `_BlendSharpness: 1` 처럼 섞임이 넓어 줄눈이 이중으로 비치는 상태를 넣는다. 기본값 화면(썸네일)에서 두 면에 늘어남 없는 돌이 보이는지 웹 화면으로 먼저 확인한다.
2. **`[NoScaleOffset]`**: 셰이더는 `_TileTex` 의 `_ST` 를 쓰지 않는데 Inspector 에 Tiling, Offset 칸이 보인다. 속성에 `[NoScaleOffset]` 을 붙인다.
3. **`unity.verify`**: "한 축으로 늘린 물체에서도 돌이 늘어나지 않는다" 는 World 에서만 맞다. "World 에서" 를 명시한다. 이 문장은 문제 해결 프롬프트의 정상 동작 기준이 된다.
4. **`unity.graph`**: Custom Function 에 `core.hlsl` 을 그대로 지정하면 `SgInput`, `SG_TEX`, `_TileTex` 가 없어 컴파일되지 않는다. 함수 이름에 `_float` 접미사와 out 인자도 필요하다. 예: 가중치 함수만 별도 .hlsl 로 복사해 `TriplanarWeights_float(float3 N, float S, out float3 W)` 로 감싼다. Triplanar 노드 대응 설명은 정확하니 둔다.
5. **텍스처 안내 중복**: 프롬프트가 이제 임포트 설정과 칸 지정을 자동으로 넣는다. Unity pitfalls 에 같은 내용으로 적어 둔 항목이 있으면 겹치지 않게 줄인다.

## 권장

6. **4단계가 최종과 같다**: `SG_STEP(4, color)` 다음에 같은 `color` 를 돌려준다. 4단계를 지우고 그 해설은 3단계나 `_Space` hint 로 옮긴다. `steps` 와 `SG_STEP` 번호를 맞춘다.
7. **1단계와 offNote**: 카메라를 드래그해 위에서 보면 초록 윗면(Y 투영)이 보인다. "초록은 보이지 않는다" 대신 그렇게 안내한다.
8. **`_BlendSharpness` 데모**: 축에 맞은 면에서는 값이 화면을 바꾸지 않는데 `moving-prop` 프리셋의 자동 데모가 이 값만 움직인다. 데모를 화면이 바뀌는 값으로 바꾸거나 hint 를 더 분명히 한다.
9. **글 다듬기**: `_TileSize` 의 "m" 는 Object 공간에서 오브젝트 단위 × Scale 이라는 점. 미끄러짐과 이중 줄눈이 한 mistakes 항목에 섞여 있으면 나눈다. "켬," 같은 어색한 연결은 "켜고" 로.

## 끝내기 전에

1. `node tools/check.mjs triplanar-projection` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 바꾼 단계, 새 촬영 상태의 값을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
