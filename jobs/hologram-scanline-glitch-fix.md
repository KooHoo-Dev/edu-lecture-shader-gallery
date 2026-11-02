---
# 묶음 2 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs hologram-scanline-glitch
  - node tools/unity.mjs hologram-scanline-glitch
  - node tools/shots.mjs hologram-scanline-glitch
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/hologram-scanline-glitch/**
  - Assets/Shaders/hologram-scanline-glitch.meta
  - web/src/specimens/hologram-scanline-glitch/**
  - web/src/shots/hologram-scanline-glitch/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: hologram-scanline-glitch 리뷰 반영

`hologram-scanline-glitch` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 패스, 태그, 혼합, 큐, SRP Batcher, XR, 정점과 프래그먼트가 같은 띠를 고르는 구조, 이벤트, 효과 끄기, 단계는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 웹 무대가 투명 메시 아래에 바닥 그림자를 그리지 않는다 (Unity 와 같게).
- 웹 무대가 정점을 미는 표본의 구를 Unity 기본 구와 비슷한 밀도(24×16)로 그린다. 이제 웹 미리보기도 Unity 처럼 띠 경계가 찢어져 보인다.
- 가이드 7절에 배속, 셰이더와 C# 깜빡임 합산, 줄무늬 빈도, 동시 깜빡임, 제한기 하한 규칙이 들어갔다. 역장, 프레넬 샘플의 C# 제한기도 고쳤다.

## 필수

1. **`unity.graph` 문구**: "Time 노드에 곱한 값을 Floor 로 끊어 넘긴다" 는 틀렸다. `sgVertex` 가 안에서 이미 `floor(time * 10)` 을 하므로 끊은 시간을 넘기면 띠가 1초에 한 번만 바뀐다. "Time 을 그대로 넘긴다" 로 고친다.
2. **배속과 깜빡임**: URP 의 `_Time` 은 Play 중 배속을 따라 배속 3 이면 셰이더 깜빡임이 3Hz, 글리치가 30Hz 가 된다. `unity.pitfalls` 에 배속이 있는 게임에서는 `_Flicker` 를 0 으로 두라고 적고, 안전하다는 투의 mistakes 항목을 사실대로 고친다 (가이드 7절).
3. **정점 밀도 글**: Unity 기본 구는 정점 간격이 약 0.1 이라 띠 경계에 걸친 한 칸은 늘 비스듬히 찢어진다. 지금 글("띠 폭 0.2 면 계단이 보인다")은 촬영과 맞지 않는다. "경계 한 칸은 늘 찢어진다" 는 사실로 고치고, 띠 수(`HOLOGRAM_GLITCH_BANDS`)를 줄이는 게 나은지 웹 화면(이제 Unity 와 비슷한 밀도)으로 확인해 정한다.
4. **오브젝트 공간 함정**: 글리치 띠는 `positionOS.y` 로 나눈다. Blender FBX 처럼 회전 -90, 크기 100 으로 들어온 메시는 띠가 세로로 서거나 뭉치고 미는 거리가 커진다. XR 에서 손에 든 물체가 기울면 띠도 기운다 (스캔라인은 월드 기준이라 수평). `unity.pitfalls` 에 넣는다. 변형 예시의 캐릭터, XR 물체 항목과 이어지게 한다.

## 권장

5. **하얗게 바래는 띠**: 밀린 띠가 초당 10번 35% 하얗게 바뀌고, 같은 머티리얼의 홀로그램이 모두 같은 순간에 바뀐다. 바래는 값에 `_Dropout` 을 곱해 전송 끊김 때만 바래게 하고, 물체마다 시간을 어긋나게 하는 방법을 해설에 적는다 (가이드 7절).
6. **경고 투영 프리셋**: 포화 빨강, 몸 전체 림, 줄무늬 빈도 2.8Hz 에 깜빡임까지 겹친다. `_ScanSpeed` 를 낮춰 줄무늬 빈도를 2Hz 아래로 둔다.
7. **C# 제한기**: `Mathf.Max(minInterval, 0.34f)` 로 하한을 고정하고 `OnDisable` 에서 마지막 시각을 지우지 않는다 (가이드 7절, `ForceFieldPulse` 참고).
8. **글 정확성**: 4단계 body 의 "0.5 초마다 어두워졌다 돌아온다" 는 0.5초 칸마다 반반 확률이다. 바운드 함정은 띠가 "잘려 보인다" 가 아니라 바운드가 화면 밖으로 나가면 밀려 나온 띠까지 통째로 사라진다.

## 끝내기 전에

1. `node tools/check.mjs hologram-scanline-glitch` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 단계, 전송 끊김 이벤트(`click:` 동작), 경고 투영 프리셋 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
