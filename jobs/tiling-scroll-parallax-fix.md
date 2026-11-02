---
# 묶음 3 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs tiling-scroll-parallax
  - node tools/unity.mjs tiling-scroll-parallax
  - node tools/shots.mjs tiling-scroll-parallax
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/tiling-scroll-parallax/**
  - Assets/Shaders/tiling-scroll-parallax.meta
  - web/src/specimens/tiling-scroll-parallax/**
  - web/src/shots/tiling-scroll-parallax/**
  - tools/textures/tiling-scroll-parallax-layer.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: tiling-scroll-parallax 리뷰 반영

`tiling-scroll-parallax` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. PNG, Repeat 에 맡긴 샘플링, 방향 부호, 텍셀 스냅, 실행 순서, 효과 끄기, 단계는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 여러 층을 무대에 그리는 기능이 앱에 없어 시차가 미리보기에서 안 보이는 점은 앱 과제로 기록했다. 보고에 다시 적지 않아도 된다.
- 가이드 10절에 `_Time` 은 Play 중 `Time.time`(timeScale 을 따름)이라는 점과 커지는 오프셋을 감싸라는 점이 들어갔다.
- PNG 기준이 한 장 32KB, 긴 변 512 이하로 바뀌어 지금 PNG 는 그대로 된다.

## 필수

1. **틀린 함정 문장**: "Time.timeScale 을 0 으로 해도 멈추지 않는다" 는 틀렸다. URP 의 `_Time` 은 Play 중 `Time.time` 이라 timeScale 0 이면 흐름이 멈춘다. 실제로 흔한 문제는 일시정지 메뉴 뒤 배경이 멈추는 것이다. "멈추면 안 되는 층은 C# 에서 `Time.unscaledDeltaTime` 을 쌓아 `_ScrollOffset` 에 넣는다" 로 고친다.
2. **Tight 메시 설명**: Tight 메시는 UV 를 찌그러뜨리지 않는다. 실제 증상은 메시가 원래 언덕 실루엣 모양으로 고정되어, 흐르는 언덕과 나무가 원래 하늘 자리에서 다각형 모양으로 잘려 사라지는 것이다. 제목과 본문을 이 증상으로 바꾼다.
3. **커지는 오프셋**: 시간과 카메라 값으로 오프셋이 끝없이 커져 오래 켜 두면 float 정밀도 때문에 떨린다. 셰이더에서 오프셋 유니폼만 `frac` 으로 감싸고 (화면 전체에 같은 값이라 이음매가 안 생긴다), C# 은 `Mathf.Repeat(offset, 1f / layerFactor)` 로 넘긴다 (계수가 0 보다 클 때).
4. **C# 이 `_ScrollSpeed` 를 넣지 않는다**: 머티리얼 기본값 0.15 는 썸네일용이라 스크롤러를 붙여도 카메라가 서 있을 때 층마다 계속 흐른다. `autoScrollSpeed = 0` 필드를 두고 Awake 에서 넣는다 (가이드 6절).

## 권장

5. `wide` 프리셋 설명의 "늘렸을 때처럼" 은 미리보기가 스프라이트를 늘리지 않아 그림이 눌려 보이는 것과 맞지 않는다. 화면에 맞게 고친다.
6. `Camera.main` 이 없으면 한 번 경고를 남긴다.
7. 2D 조명을 받지 않는다는 함정을 넣는다 (스프라이트 샘플과 팔레트 표본 참고).
8. "Cinemachine 이 더 늦게 돈다" 는 근거를 확인하지 못했다. 빼거나 실행 순서를 확인하라는 안내로 바꾼다.

## 끝내기 전에

1. `node tools/check.mjs tiling-scroll-parallax` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 바꾼 단계와 프리셋 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
