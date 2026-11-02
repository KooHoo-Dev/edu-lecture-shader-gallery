---
# 묶음 3 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs ui-sheen-sweep
  - node tools/unity.mjs ui-sheen-sweep
  - node tools/shots.mjs ui-sheen-sweep
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/ui-sheen-sweep/**
  - Assets/Shaders/ui-sheen-sweep.meta
  - web/src/specimens/ui-sheen-sweep/**
  - web/src/shots/ui-sheen-sweep/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: ui-sheen-sweep 리뷰 반영

`ui-sheen-sweep` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 래퍼(ui-sdf-shape 에서 복사한 UI 구조), 띠 방향·각도·reach 계산, 기울기 보정, 이벤트 곡선, C# 의 복사본·materialForRendering 처리와 제한기는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- `meta.thumbnail` 이 생겼다 (가이드 5절). 갤러리 썸네일로 쓸 `captures` 의 이름이다. 기본값 촬영이 띠가 쉬는 순간에 찍혀도 썸네일은 고른 촬영을 쓴다.
- 링크 쿼리 `t=<초>` 로 웹 무대 시간을 그 순간에 멈춘 채 열 수 있다 (가이드 8절). `node tools/live.mjs ui-sheen-sweep --query="auto=0&step=3&t=0.6"` 처럼 단계와 효과 끄기를 띠가 지나가는 순간에 찍는다. `live.mjs` 는 한 번에 `--query` 하나만 받는다.

## 필수

1. **썸네일**: 지금 기본 촬영(웹, Unity 모두)은 띠가 없는 빈 카드다. 시간 값만으로는 고칠 수 없다 (쉬는 간격이 0 이어도 주기의 약 20% 는 띠가 카드 밖이다). 이미 있는 `pulse` 촬영(`_AutoSweep` 끔, `_SweepPulse` 0.5)이 시간과 상관없이 띠를 보여 주므로 `thumbnail: 'pulse'` 로 지정한다. `pulse` 촬영 값이 썸네일로 보기 좋은지 Unity 촬영(`web/src/shots/ui-sheen-sweep/pulse.webp`)을 보고 필요하면 띠 위치만 조정한다.
2. **9분할(Sliced)과 스프라이트 시트 함정**: Sliced 는 띠가 "꺾이는" 수준이 아니다. 조각마다 uv 와 픽셀 비가 달라 ddx/ddy 로 잰 비율, 이미지 반 크기, reach 가 조각마다 바뀌어 띠가 경계에서 끊기고 테두리 조각에서는 다른 위치와 때에 지나간다. Sprite Mode Multiple 로 자른 스프라이트 시트도 아틀라스와 같은 문제가 있다 (인벤토리 아이콘과 드롭 아이템은 대개 시트에서 자른다). 두 경우를 증상대로 `unity.pitfalls` 에 쓰고 대책을 적는다: BaseMeshEffect 로 Image 기준 0~1 좌표를 uv1 에 넣고 Canvas 의 Additional Shader Channels 에서 TexCoord1 을 켜면 배칭을 유지하며 Sliced, Tiled, 아틀라스, 시트가 한 번에 해결된다 (변형 예시로 둔다. `GetOuterUV` 를 머티리얼로 넘기면 Image 마다 복사본이 필요해 배칭이 끊긴다).
3. **주기 하한**: `core.hlsl` 의 `max(_SweepPeriod, 0.01)` 을 주석대로 `max(_SweepPeriod, 1.0)` 으로 바꾼다. Range 는 Inspector 에서만 막히고 SetFloat 나 Animator 로는 우회된다. 웹 최소값도 1 이다.
4. **프리셋 규칙**: `glass` 프리셋의 `_SweepPause: 0.35` 는 기본값과 같다. 기본값과 다른 것만 적는다 (가이드 5절).

## 권장

5. **자식 Image 의 눌림 가로채기**: `UiSheenTrigger` 를 버튼의 자식 Image(아이콘)에 붙이면 `IPointerDownHandler` 때문에 `ExecuteHierarchy` 가 자식에서 멈춰 부모 Button 의 Pressed 색과 선택이 사라진다 (클릭은 동작한다). 함정에 증상을 적고 "자식이면 `playOnPointerDown` 을 끄고 `Button.onClick` 에서 `Play()` 를 부른다" 를 안내한다.
6. **반투명 그림의 광택**: 직선 알파라 더해지는 빛은 `light × tex.a × color.a` 다. `glass` 프리셋을 실제 반투명 패널(알파 0.2~0.4)에 쓰면 광택도 그만큼 약해져 거의 안 보인다. 반투명 그림자나 글로 위로는 옅은 띠가 지나간다. 프리셋 `look` 이나 함정에 적고, 미리 곱한 알파(`Blend One OneMinusSrcAlpha`, `rgb = tex.rgb * a + light * 모양 마스크`)로 알파와 상관없이 더하는 변형을 `adaptIdeas` 에 넣는다.
7. **단계 3**: 띠가 쉬는 동안은 검다. body 에 그 사실을 적거나 `SG_STEP(3, …)` 에 옅은 `tex.a` 윤곽을 더하고 body 에 적는다. 단계와 효과 끄기는 `t=` 로 띠가 지나가는 순간에 찍어 확인한다.
8. **SpriteRenderer 쓰임**: 스프라이트 무대 Unity 촬영은 Universal Renderer 의 SpriteRenderer 로 찍으므로 `drop-sparkle` 촬영 자체가 SpriteRenderer 에서 그려진다는 근거다. `original` 과 글을 그에 맞게 고친다. 함정에 더한다: Universal2D 패스가 없어 2D 조명을 받지 않는다. `ZTest [unity_GUIZTestMode]` 는 캔버스가 넣는 값이라 SpriteRenderer 에서는 정해지지 않으므로, 3D 필드에 놓는 드롭 반짝임은 `ZTest LEqual` 로 바꾼 사본을 쓰라고 적는다 (Unity 에서 확인하지 않았다는 점은 보고에만 적고 글은 대책으로 쓴다).
9. `UiSheenTrigger.cs` 의 "자동과 합쳐도 3Hz 이하" 주석은 배속 1 에서만 맞다. 조건을 붙인다.

## 끝내기 전에

1. `node tools/check.mjs ui-sheen-sweep` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, `t=` 로 띠가 지나가는 순간의 단계 1~3과 효과 끄기, 프리셋, pulse 이벤트 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
