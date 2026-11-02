---
# 묶음 3 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs ui-sdf-shape
  - node tools/unity.mjs ui-sdf-shape
  - node tools/shots.mjs ui-sdf-shape
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/ui-sdf-shape/**
  - Assets/Shaders/ui-sdf-shape.meta
  - web/src/specimens/ui-sdf-shape/**
  - web/src/shots/ui-sdf-shape/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: ui-sdf-shape 리뷰 반영

`ui-sdf-shape` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. SDF 수학(둥근 사각형, 호, 방향), 합성, 정점 색, 효과 끄기, 단계는 리뷰에서 문제가 없었으니 바꾸지 않는다. **다음 UI 표본(광택 훑기)이 이 래퍼를 복사하므로 래퍼 주석을 충실히 단다.**

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- '그대로 넣기' 프롬프트가 `stage.ui` 이면 Image 에 넣는 단계를 자동으로 쓴다 (전에는 SpriteRenderer 단계가 들어갔다). Skill 의 무대 이름도 UI 로 나온다.
- Unity 컴파일 검사가 `UNITY_UI_CLIP_RECT`, `UNITY_UI_ALPHACLIP` 변형까지 컴파일한다 (지금 래퍼로 28개 통과).
- 검사 도구의 UI 규칙이 늘었다: `[PerRendererData] _MainTex`, `_StencilReadMask`, Stencil 블록, `UNITY_UI_ALPHACLIP`. 미리 곱한 알파 혼합도 받는다.
- 가이드 4절 "UI 래퍼" 와 6절에 Mask 의 알파 클립, 정점 색, 감마 정점 색, Softness, UGUI 머티리얼 복사본 규칙이 들어갔다. 읽고 따른다.

## 필수

1. **C# 초기화 순서** (`UiSdfProgress.cs`): `Awake` 전에 `SetValue` 를 부르면 `material` 이 null 이라 예외가 나고, 그 뒤 `Awake` 가 시작 값으로 덮어쓴다. 꺼진 채 시작한 HUD 나 비활성 슬롯 프리팹에서 생긴다. 복사본을 처음 쓸 때 만드는 `EnsureMaterial()` 로 바꾸고, `Awake` 는 아직 값이 없을 때만 시작 값을 넣는다. 꺼져 있을 때 `StartCooldown` 이 조용히 무시되는 것도 다시 켰을 때 맞는 모습이 되게 한다.
2. **C# 스텐실 복사본 누수**: `OnDisable` 에서 `image.materialForRendering` 을 부르면 Image 가 먼저 꺼진 경우 지운 스텐실 복사본이 다시 생겨 샌다. `image.isActiveAndEnabled` 일 때만 `materialForRendering` 을 건드린다 (가이드 6절).
3. **짧은 변 기준 정규화** (`core.hlsl`): 좌표 단위가 이미지 높이라 세로로 긴 Image 에서 링 구멍이 막히고, 비율이 아주 작으면 도형이 사라진다. `p /= min(aspect, 1.0)` 처럼 짧은 변을 1 로 맞춘다.
4. **래퍼 보강** (가이드 4절): `_UIVertexColorAlwaysGammaSpace` 처리를 넣고 주석의 "텍스트용" 설명을 고친다 (캔버스 전체 옵션이다). 다음 UI 표본을 위해 주석을 더한다: Mask 가 `UNITY_UI_ALPHACLIP` 을 자동으로 켜 도형 모양대로 가려진다는 점, CanvasGroup alpha 와 Button 색이 정점 색으로 들어와 core 가 `i.color` 를 곱해야 한다는 점, `CanUseSpriteAtlas` 는 uv 0~1 을 전제하는 이 셰이더와 맞지 않는다는 점.
5. **글 오류** (프롬프트에 그대로 들어간다): mistakes 의 "가장자리가 크면 날카롭고 작으면 뭉갠다" 는 거꾸로다 (큰 Image 는 뭉개지고 작으면 계단). `unity.graph` 는 File 모드에 `core.hlsl` 을 그대로 쓰면 `SgInput` 과 속성 선언이 없어 컴파일되지 않으니 `void Name_float(..., out float d)` 로 감싸야 한다고 쓰고, "DDXY 로 나눠 Saturate" 는 `saturate(0.5 - d / DDXY(d))` 로 고친다. 아틀라스 스프라이트를 넣으면 uv 가 0.5 를 지나지 않아 도형이 대개 안 보인다. pitfall 안의 "촬영으로 확인하지 못했다" 같은 내부 사정은 지운다.
6. **화면 기준 비율의 함정**: 비율을 화면 미분으로 재므로 World Space 패널을 기울이면 원이 타원이 되고, 카드 뒤집기나 X 스케일 트윈에서는 비율 추정이 0 으로 가며 도형이 사라질 수 있다. pitfall 에 증상을 정확히 적는다.

## 권장

7. **꽉 채우기 모드**: 지금은 도형을 Image 안에 비율대로 끼워 넣어 400×40 체력 바 Image 에서 막대가 폭의 44% 만 쓰고, 세로 게이지를 만들 수 없다. Image 를 꽉 채우는 모드(예: `_Aspect = 0` 이면 꽉 채움)와 세로 채움을 검토한다. 넣으면 해설과 프리셋에 반영한다.
8. **진행 경계**: 채움 경계를 윤곽 바깥 크기로 계산해 0~2.3%, 97.7~100% 에서 화면이 변하지 않는다. 안쪽 크기(`halfSize - stroke`)로 계산한다.
9. **`_Aspect` 슬라이더**: 기본 도형(링)에서는 움직여도 변화가 없다. 기본 도형이나 슬라이더 범위를 바꿔 모든 값이 눈에 띄는 차이를 만들게 한다 (가이드 8절).
10. **이벤트와 C#**: damage 이벤트는 outQuad 인데 C# 은 선형이다. 같게 한다. `_Fill` 이 없는 머티리얼을 만나면 경고하고 `enabled = false`.
11. 단계 3 body 의 "채움 쪽" 은 "윤곽 안쪽" 이 정확하다.

## 끝내기 전에

1. `node tools/check.mjs ui-sdf-shape` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 단계, 각 도형 프리셋, damage 이벤트 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
