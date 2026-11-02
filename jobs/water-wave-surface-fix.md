---
# 묶음 6 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 8
verify:
  - node tools/check.mjs water-wave-surface
  - node tools/unity.mjs water-wave-surface
  - node tools/shots.mjs water-wave-surface
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/water-wave-surface/**
  - Assets/Shaders/water-wave-surface.meta
  - web/src/specimens/water-wave-surface/**
  - web/src/shots/water-wave-surface/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: water-wave-surface 리뷰 반영

`water-wave-surface` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 사인파 세 개의 식(위상 부호, 도함수 A·k·cos·D, `normalize(-hx, 1, -hz)`, frac 으로 감싼 위상, 속도 비율), 래퍼와 패스 구조(`_SURFACE_TYPE_TRANSPARENT`, ShadowCaster·DepthOnly 없음), 큐와 혼합, `inspiredBy`, `related` 는 리뷰에서 문제가 없었으니 바꾸지 않는다. 이 표본은 갤러리에서 가장 기본이 되는 물(★1)이다. 글은 처음 물 셰이더를 만드는 수강생 눈높이로 쓴다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 무대에 촘촘한 평면 `grid` 가 생겼다 (가이드 4절): Unity Plane 과 같은 10 × 10 크기와 UV 방향에 100 × 100 칸(정점 간격 0.1), y = 0.3 에 크기 1 로 놓여 화면 아래쪽을 호수처럼 덮는다. 웹과 Unity 촬영이 같은 것을 UV 격자로 확인했다.
- `stage.backlit: true` 면 해가 카메라 맞은편 높이 15도에 있다 (가이드 4절). 기본 해는 카메라 뒤 위쪽이라 평평한 수면의 반사광이 카메라로 오지 않는다.
- 메시 무대 `SgInput` 에 정점 색 `color` 가 생겼다 (웹은 흰색, 가이드 4절). 파티클의 Start Color 와 Color over Lifetime 을 받으려면 래퍼에서 `COLOR` 를 넘기고 core 에서 곱한다.
- 가이드에 리뷰에서 나온 규칙이 들어갔다: 3-4절 흐르는 층의 화면 속도 = 오프셋 속도 ÷ 반복 횟수와 움직임 확인 방법(`t=` 두 장), 4절 빛 받는 투명 메시의 `_SURFACE_TYPE_TRANSPARENT` 와 `ZWrite Off` 메시 안의 그리는 순서, 10절 `frac` 정밀도 문구.
- 값 조절 패널은 이제 한글 이름 옆에 속성 이름(`_WaveHeight` 등)을 함께 보여 준다. `label` 에 영문을 따로 넣지 않는다.

## 필수

1. **무대를 옮기고 값을 10 m 호수에 맞춘다.** `stage` 를 `mesh: 'grid'`, `backlit: true` 로 바꾼다. 지금 값은 0.3 배 평면에 맞춰져 있어 grid(크기 1)에서는 파장 7 m 가 호수에 1.4 개뿐이고, 진폭 합이 1 m 를 넘어 골이 바닥(y = 0) 아래로 내려가 구멍처럼 보인다. 파장 범위는 약 0.8~6 m 에 기본 약 2 m 로 둔다. 가장 짧은 파도도 grid 정점 간격 0.1 의 4 배 이상이어야 한다. `_WaveHeight` 는 최대 약 0.15 에 기본 약 0.05 로 두어, 세 파도 진폭의 합이 배치 높이 0.3 보다 작고 기울기 합(kA)이 0.3 이하가 되게 한다. 프리셋, `captures`, 자동 데모도 다시 맞춘다. 데모의 첫 프레임과 끝 프레임은 기본값과 같게 둔다 (지금은 데모 시작 때 값이 튄다). 세 사인파가 규칙적인 마름모 격자로 보이지 않는지 화면으로 확인한다.
2. **해 반짝임.** 이제 해가 카메라 맞은편에 있다. 날카로움 기본을 올려(64 이상을 검토) 넓은 회색 막이 아니라 화면 가운데 아래로 해 반짝임 길이 생기게 한다. 반사광은 계속 씬의 주 광원(`GetMainLight`)을 따른다. 4단계 글, `goals`, `mistakes` 를 새 화면에 맞춘다. 웹과 Unity 촬영 모두에서 반짝임이 보이는지 확인한다.
3. **Unity 에서 촘촘한 평면을 얻는 방법.** 지금 `unity.setup` 은 기본 Plane 을 만들게 하는데, 줄인 파장은 정점 간격 1 m 인 기본 Plane 에서 완전히 깨진다. 이 단계는 그대로 넣기 프롬프트에 들어간다. 표본 폴더에 촘촘한 평면 메시를 만드는 작은 C# 컴포넌트(예: `WaterSurfaceGrid`, `[RequireComponent(typeof(MeshFilter), typeof(MeshRenderer))]`, 기본 크기 10 m 와 100 칸, 칸 수는 65535 정점을 넘지 않게 제한)를 두고, setup 을 "빈 GameObject 에 이 컴포넌트를 붙이고 MeshRenderer 에 머티리얼을 넣는다" 로 바꾼다. 앱의 `grid` 와 같은 UV 방향(`Assets/Editor/ShaderGallery/SgGrid.cs` 참고)으로 만든다. 가이드 6절을 따르고 만든 메시를 `OnDestroy` 에서 지운다. 편집 모드에서도 보이게 하되 `OnValidate` 안에서 MeshFilter 를 바꾸지 않는다 (경고가 난다. 값이 바뀌었다는 표시만 하고 다음 갱신에서 만든다). ProBuilder 같은 대안은 메뉴 이름을 확인할 수 없으면 이름만 적는다. `mistakes`, `unity.pitfalls` 의 기본 Plane 안내는 "기본값은 100 칸 격자 기준이다. 기본 Plane 이면 파장을 4 m 이상으로" 로 바꾼다.
4. **바닥 비침.** 알파가 0.6 + 1.2F + 반사광이라 카메라 쪽 앞면도 거의 불투명해 "앞쪽은 바닥이 비친다" 가 화면에 보이지 않는다. 기본 알파를 0.3~0.4 쯤으로 낮추고 grid 화면 아래쪽에서 체커가 보이는지 확인한다. 역광이라 바닥이 어두워져 그래도 보이지 않으면 그 글을 뺀다.
5. **무대를 옮기며 낡는 글을 고친다:** core 의 0.3 배 축소와 최솟값 7 근거 주석, `.shader` 주석, 힌트의 cm 값, 3단계의 "20 쯤 넘기면" 같은 숫자, `offNote` (10 m 호수에서는 "윤곽만 출렁이는 천" 이 성립하지 않는다. 효과 끄기 화면을 다시 찍어 맞춘다).

## 권장

6. `unity.pitfalls` 에 `ZWrite Off` 메시 안의 그리는 순서를 한 줄 넣는다: 반대편(+Z)에서 보거나 평면을 180도 돌리면 뒤쪽 물결이 앞 마루 위에 그려진다. 대처는 파도 낮추기나 `ZWrite On`.
7. 실수 3 의 월드 공간 안내를 끝까지 쓴다: 픽셀 단계도 `positionWS.xz` 로 바꾸고 `WAVE_NORMAL_TO_WORLD` 를 빼야 법선이 모양과 맞는다.
8. 실수 5: 위상이 `time * speed / λ` 라 실행 중 파장을 바꿔도 물결이 튄다. 원인에 함께 적는다.
9. `unity.graph`: Unlit 인지 Lit 인지 정한다 (Unlit 은 Fragment Normal 칸이 없고 Lit 이면 프레넬과 Blinn-Phong 대신 PBR 이 그린다). 예시 함수 시그니처에 머티리얼 값 입력을 넣는다.
10. ★1 가독성: 단계 1, 2 본문의 "sRGB 라 제곱" 설명은 코드 주석에만 둔다. 색 띠가 없는 "만화풍 물" 프리셋은 이름을 바꾸거나 색 띠를 준다.

## 끝내기 전에

1. `node tools/check.mjs water-wave-surface` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본(`t=1.3`), 효과 끄기, 4단계, 프리셋 하나 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
