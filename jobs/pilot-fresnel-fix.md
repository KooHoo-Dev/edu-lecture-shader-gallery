---
# 파일럿 수정 잡 (plan 5-3, 5-4 흐름 시험). 독립 리뷰에서 고른 pilot-fresnel-opus 결과를 고친다.
base: dispatch/pilot-fresnel-opus
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs fresnel-rim-glow
  - node tools/unity.mjs fresnel-rim-glow
  - node tools/shots.mjs fresnel-rim-glow
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/fresnel-rim-glow/**
  - Assets/Shaders/fresnel-rim-glow.meta
  - web/src/specimens/fresnel-rim-glow/**
  - web/src/shots/fresnel-rim-glow/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: fresnel-rim-glow 리뷰 반영

`fresnel-rim-glow` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 표본의 나머지 구조와 동작은 바꾸지 않는다.

## 고칠 것

1. **에너지막(투명) 안내** (`meta.ts` 의 해당 mistakes 항목과 Unity pitfalls 항목). 지금 두 곳에 거의 같은 글이 있다. 한 곳에만 남기고, 그대로 따라 하면 실제로 반투명이 되도록 빠진 단계를 넣는다: Forward 패스의 `clip(c.a - 0.5)` 를 지운다, Blend 와 `ZWrite Off`, `"Queue"="Transparent"`, `"RenderType"="Transparent"`, ShadowCaster 패스를 뺀다. 수강생이 모르는 가이드 내부 용어("투명 메시 형식" 같은 말)는 쓰지 않는다. 이 글은 복사용 프롬프트에 그대로 들어가므로 `#/s/...` 같은 갤러리 내부 링크는 넣지 않는다.
2. **XR 설명** (`meta.ts`). 지금 문장은 "카메라 앞 방향 하나를 쓰면 양쪽 눈의 림이 어긋난다" 인데 사실이 아니다. 어긋나는 경우는 C# 에서 카메라 위치 하나(예: `Camera.main.transform.position`)를 전역 값으로 넘겨 두 눈이 같이 쓸 때다. 셰이더 안에서 눈마다 시선을 계산하면 맞는다는 점과 함께 고친다.
3. **번쩍임 C#** (`RimHitFlash.cs`). 간격 제한을 `Time.time` 대신 `Time.unscaledTime` 으로 센다. 배속을 올리면 초당 3회 제한이 깨지기 때문이다. 꺼진 오브젝트에서 `Flash()` 를 부르면 코루틴 오류가 나므로 `isActiveAndEnabled` 가 아니면 바로 돌아간다. 주석도 맞춘다.
4. **1단계 설명** (`meta.ts` steps). 앱은 단계 출력도 sRGB 로 바꿔 보여 주므로 1단계 화면에서 가장자리가 검정으로 보이지 않는다. 글을 화면에 맞게 "가장자리로 갈수록 어두워진다" 쪽으로 고친다. `node tools/live.mjs` 로 1단계를 찍어 글과 맞는지 본다.
5. **정리**: mistakes 의 번쩍임 안전 안내 항목은 증상이 아니라 안내이므로 Unity pitfalls 로 옮긴다. `core.hlsl` 에서 `max` 가 pow 경고를 막는다는 주석은 근거가 약하니 "0 의 거듭제곱을 피한다" 정도로 사실만 남긴다.
6. **썸네일과 데모**: 기본 `_BaseColor` 를 더 어둡게 해 기본 화면(썸네일)에서 림 대비를 높인다. 자기 hint 와도 맞춘다. demo 에 `_RimPower` loop 를 넣어 림 폭 변화가 보이게 한다. 번쩍임만 반복하지 않게 한다.

## 끝내기 전에

1. `node tools/check.mjs fresnel-rim-glow` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 1단계, 효과 끄기 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
