---
# 묶음 2 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs scroll-distort-energy
  - node tools/unity.mjs scroll-distort-energy
  - node tools/shots.mjs scroll-distort-energy
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/scroll-distort-energy/**
  - Assets/Shaders/scroll-distort-energy.meta
  - web/src/specimens/scroll-distort-energy/**
  - web/src/shots/scroll-distort-energy/**
  - tools/textures/scroll-distort-energy-noise.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: scroll-distort-energy 리뷰 반영

`scroll-distort-energy` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 래퍼(혼합, `Cull Off`, 패스 하나), 끝단 마스크, 둘레 정수 반복, HDR 기본값, 단계와 효과 끄기는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 웹 `plane` 의 UV 가 Unity 기본 Plane 과 같아졌다 (u 는 −X, v 는 −Z 쪽으로 커진다. 위에서 보면 180도 돌아 있다). 웹과 Unity 에서 UV 를 색으로 칠해 촬영해 확인했다. 그래서 웹 화면의 배치가 구현 때 본 것과 180도 다르다.
- mesh 무대의 `cylinder` 는 웹과 Unity 모두 크기 0.8, 높이 0.8 에 놓여 윗끝까지 화면에 들어온다.
- 단계 보기에서 투명 양면 메시는 그동안만 깊이를 써서 앞면이 보인다 (뒷면이 앞면을 덮던 세로 경계가 없어졌다).
- `tools/check.mjs` 가 1인자 `GetMainLight(TransformWorldToShadowCoord(..))` 와, sRGB 를 끈 텍스처(`linear: true`)의 `"gray"` 기본값을 오류로 잡는다. 지금 이 표본은 check 에 실패한다.
- 가이드에 Plane UV 방향(4절), `linearGrey`(3-4절), 3인자 `GetMainLight`(래퍼 규칙), 속도를 바꾸면 무늬가 튄다는 점과 `frac`(10절), 안개 방침(4절 알파의 뜻 아래)이 들어갔다. 읽고 따른다.

## 필수

1. **사실이 아닌 증상**: `mistakes` 의 "노이즈를 그대로 더하면 무늬가 한쪽으로만 밀리고 흔들리지 않는다" 는 틀렸다. 노이즈를 그대로 더해도 변하는 부분 (n − 평균)·k 는 같고 차이는 상수 오프셋뿐이며, 반복 텍스처에서 상수 이동은 보이지 않는다 (지금 PNG 평균 0.376 이라 −0.5 도 이미 치우쳐 있지만 화면은 멀쩡하다). 이 항목을 실제로 겪는 실수로 바꾼다. 권하는 것: "흐름 속도를 스크립트로 바꾸면 무늬가 튄다" (`_Time.y * 속도` 라 속도 변화량에 경과 시간이 곱해진다. C# 에서 오프셋을 쌓아 넘긴다. 가이드 10절). 같은 오해가 있는 `core.hlsl` 의 센터링 주석, `mistakes` 의 "왜곡이 한쪽으로 쏠린다", `unity.pitfalls` 의 "왜곡이 한쪽으로 쏠리고" 도 고친다. sRGB 를 켰을 때 실제로 보이는 증상은 무늬가 어둡고 가늘어지는 것이다. 센터링이 실제로 보이는 경우(세기 값을 움직일 때 무늬 전체가 미끄러짐, 고정된 배경을 미는 화면 왜곡)는 써도 된다.
2. **빈 칸 기본값**: `_NoiseTex` 기본값 `"gray"` 는 Linear 에서 약 0.21 로 읽혀 텍스처 칸이 비면 희미한 통만 보인다. `"linearGrey"` 로 바꾸고 `unity.pitfalls` 의 "회색(0.5)" 문장을 맞춘다.
3. **단계 보기 글**: 단계 보기가 이제 앞면만 보여 준다. 1단계 등에 있던 뒷면 경계에 대한 변명 문장을 지우고 지금 화면에 맞게 쓴다. 원통이 화면에 다 들어오므로 끝단 마스크가 보이는지 기본 화면과 단계로 확인한다.

## 권장

4. **스크롤 시간 감싸기**: `core.hlsl` 의 `-t`, `t * 0.7`, `-t * 0.35` 를 `frac` 으로 감싼다. 텍스처 주기가 1 이고 화면 전체에 같은 값이라 결과와 미분이 같고, 편집 모드에서 에디터를 오래 켜 두어도 빠른 프리셋이 떨리지 않는다.
5. **SgInput**: 래퍼가 `SgInput` 을 `uv positionOS time` 만으로 줄였다. 가이드 4절대로 메시 형식으로 넘긴다 (최소 `normalWS`, `viewWS`). 그래야 프레넬 테두리 같은 변형을 core 에 넣었을 때 Unity 에서도 컴파일된다.
6. **글 다듬기**: `unity.setup` 의 "그림자가 생기지 않게 Cast Shadows Off" 는 이유가 틀렸다 (ShadowCaster 패스가 없어 원래 그림자가 없다). `unity.pitfalls` 의 "흰빛으로 바랜다" 는 톤매핑이 없으면 채널마다 잘려 옅은 하늘색에서 멈춘다. `unity.graph` 에 Position(Object).y 를 `* 0.5 + 0.5` 로 바꾸는 단계를 넣는다. `tools/textures/scroll-distort-energy-noise.mjs` 주석의 "u * 3" 을 지금 코드와 맞춘다.
7. **안개**: 래퍼에 안개 처리가 없어 Fog 를 켠 씬에서 먼 빔이 그대로 밝다. 가이드 4절 안개 방침대로 `unity.pitfalls` 에 적고, 더하기 혼합은 `MixFogColor(color, half3(0, 0, 0), fogFactor)` 로 0 으로 사라지게 한다는 변형 예시를 `adaptIdeas` 에 넣는다.

## 끝내기 전에

1. `node tools/check.mjs scroll-distort-energy` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 1단계, 효과 끄기, 프리셋 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
