---
# 묶음 2 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs wind-sway-foliage
  - node tools/unity.mjs wind-sway-foliage
  - node tools/shots.mjs wind-sway-foliage
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/wind-sway-foliage/**
  - Assets/Shaders/wind-sway-foliage.meta
  - web/src/specimens/wind-sway-foliage/**
  - web/src/shots/wind-sway-foliage/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: wind-sway-foliage 리뷰 반영

`wind-sway-foliage` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 뿌리 고정, 네 패스의 같은 `sgVertex`, 길이 보정, 효과 끄기는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 래퍼에서 이미 고친 것 (다시 고치지 않는다):
- 웹 조명이 광원을 앞뒤로 뒤집어 계산하던 앱 버그를 고쳤다. 웹 `i.lighting` 은 이제 Unity 와 같은 쪽이 밝다.
- Unity 촬영에서 직사광이 0 이던 원인은 래퍼의 `light.distanceAttenuation` 곱이었다 (촬영 씬에서 0). 래퍼에서 뺐고 다시 촬영해 풀이 밝게 나온다. 웹과 Unity 모두 바람 방향 90 에서 오른쪽(+X)으로 눕는 것을 리뷰가 확인했다.

## 필수

1. **돌풍을 더하기용 값으로**: 지금 이벤트 트랙은 `_WindStrength` 를 0.45 → 0.85 → 0.45 로 절대값으로 움직여, 폭풍 프리셋(0.85)에서는 돌풍이 오히려 바람을 약하게 만든다. `WindGust.cs` 는 평소 세기에 더하는 방식이라 동작도 다르다. 0 에서 시작해 0 으로 돌아오는 `_Gust`(0~1, 기본 0)를 새로 두고 셰이더가 세기에 더한다. 이벤트 트랙, `WindGust.cs`, 전역 값 해설 모두 `_Gust` 를 움직이게 한다. C# 은 평소 세기를 저장했다 되돌리지 않게 된다 (가이드 5절 `events`).
2. **물결 방향**: `core.hlsl` 의 `sin(ωt + k·(x·dir))` 은 물결 마루가 바람을 거슬러 흐르고, 돌풍 노이즈는 바람 쪽으로 흐른다. 부호를 바꿔 둘이 같은 쪽으로 흐르게 한다.
3. **방향 기준 글**: hint, 주석, `unity.setup` 은 "Unity 월드 기준" 이라고 하지만 계산은 오브젝트 공간이다. "오브젝트 공간 기준. 회전하지 않은 풀에서는 월드와 같다" 로 고친다. `original` 의 "3D 05 Terrain 의 풀과 나무에도 같은 방식" 에는 Terrain 디테일과 나무가 인스턴스마다 무작위로 Y 회전해 풀마다 다른 쪽으로 분다는 단서를 단다.
4. **pitfalls**: "직접 확인하지는 않았다" 같은 내부 메모는 수강생 프롬프트에 들어가므로 지운다. 정적 배칭 항목에 배칭되면 바람 방향과 노이즈가 월드 기준으로 바뀌어, 돌린 풀은 편집 모드와 플레이 모드에서 다른 쪽으로 분다는 점을 더한다.

## 권장

5. **양면 조명**: `Cull Off` 인데 뒷면도 앞면 법선을 써서 잎의 절반가량이 환경광만 받는다. `core.hlsl` 에서 `abs(dot(N, L))` 처럼 양면을 같이 밝히는 방식을 쓰고 (`i.lightDirWS`, `i.lightColor`, 환경광은 `i.lighting - 직사광` 이 아니라 직접 다시 구한다), 이 선택을 해설에 적는다. 앞면·뒷면 플래그는 앱에 없다.
6. **정점 단계의 `SG_STEP`**: `windStepSwitch` 처럼 `SG_STEP` 을 정점 단계 분기로 쓰는 것은 규격에 없고 Unity 코드에 의미 없는 배관을 남긴다. 단계는 프래그먼트에서 색으로 보여 주는 것만으로 짠다.
7. **단계 화면과 글**: 1단계는 sRGB 때문에 `y²` 가 거의 직선 그라데이션으로 보인다. 제곱의 효과가 보이게 (예: 같은 높이의 `y` 와 `y²` 를 반씩) 바꾸거나 글을 화면에 맞춘다. 떨림 단계는 위상 `0.5 + 0.5 * sin(t)` 를 회색으로 보여 주면 잎마다 박자가 다른 것이 한 장에 보인다.
8. **떨림 위상**: `dot(xz, (7.3, 5.1))` 은 바람과 상관없는 고정 방향 평면파라, 한 잎 안에서도 위상이 1.6 rad 까지 갈리고 `_Flutter` 를 올리면 잎이 꼬인다. 잎 안에서 위상이 크게 갈리지 않게 줄이고, "한 잎 안에서는 거의 같다" 는 주석을 사실대로 고친다.
9. **hint 정확도**: `_WindStrength` 는 돌풍 계수와 길이 보정 때문에 끝이 그 값만큼 밀리지 않는다. `_Flutter` 0 이어도 돌풍 노이즈 때문에 한 덩어리로 움직이지 않는다.

## 끝내기 전에

1. `node tools/check.mjs wind-sway-foliage` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 폭풍 프리셋에서 돌풍 이벤트를 찍어 Read 로 본다. 돌풍이 바람을 약하게 만들지 않는지 시간을 달리해 두세 장 비교한다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
