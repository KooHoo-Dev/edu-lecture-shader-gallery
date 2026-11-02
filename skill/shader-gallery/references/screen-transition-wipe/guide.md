# 화면 전환 와이프 (Screen Transition Wipe)

진행값과 순서 값을 비교해 화면을 덮고 걷는다. 원, 대각선, 마름모 격자를 한 셰이더로

무대 종류: 전체 화면. 난이도 1/3. 기법: 전체 화면, 마스크, Full Screen Pass, 코루틴.

## 파일
- `ScreenTransitionWipe.shader`
- `core.hlsl`
- `ScreenTransitionController.cs`

모두 프로젝트의 `Assets/Shaders/screen-transition-wipe/` 에 복사한다.

## 넣는 순서
1. `ScreenTransitionWipe.shader`, `core.hlsl`, `ScreenTransitionController.cs` 를 `Assets/Shaders/screen-transition-wipe/` 에 둔다.
2. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.
3. 사용 중인 렌더러 에셋(Universal Renderer Data 또는 Renderer 2D Data)의 Add Renderer Feature 에서 Full Screen Pass Renderer Feature 를 추가한다.
4. Pass Material 에 머티리얼을 넣고 Injection Point 를 Before Rendering Post Processing 으로, Fetch Color Buffer 를 켠다.
5. 빈 오브젝트에 `ScreenTransitionController` 를 붙이고 머티리얼을 연결한 뒤 `ScreenTransitionController.Instance.LoadScene("씬 이름")` 을 호출한다. 씬은 Build Profiles 에 등록되어 있어야 한다.

## 확인
머티리얼의 진행을 0 에서 1 로 올리면 Game 뷰 화면이 왼쪽부터 마름모 칸으로 덮이고, 0 으로 내리면 다시 걷힌다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_Progress` | 진행 | 0.5 |
| `_Pattern` | 모양 | 마름모 격자 |
| `_Cells` | 격자 칸 수 | 9 |
| `_Softness` | 경계 부드러움 | 0.03 |
| `_CoverColor` | 덮개 색 | #08080F |
| `_RimColor` | 경계 빛 색 | #FF8C33 |
| `_RimGlow` | 경계 빛 밝기 | 0.8 |

## 동작 단계
1. **순서**: 화면 위치마다 덮이는 차례를 0~1 로 정한다. 어두운 곳이 먼저 덮인다. 전환 모양은 이 값이 전부 결정한다.
2. **마스크**: 진행값이 순서 값을 넘은 곳이 1 이 된다. `smoothstep` 폭이 경계 부드러움이다. 진행 슬라이더를 움직여 본다.
3. **경계**: `mask * (1 - mask)` 는 마스크가 0.5 인 경계에서만 값이 있다. 여기에 빛 색을 곱하면 경계만 빛난다.

## 주의할 점
- 2D Renderer 도 Renderer 2D Data 에 같은 기능을 추가하면 된다 (Unity 6000.3.20f1 에서 촬영으로 확인).
- Renderer Feature 는 그 렌더러를 쓰는 모든 카메라에 적용된다. 쓰지 않을 때는 진행값이 0 이어도 패스 비용이 든다.
- 머리에 고정된 전체 화면 효과라 XR 에서는 권장하지 않는다.
- Screen Space - Overlay Canvas 는 이 패스가 끝난 뒤에 그려져 덮이지 않는다. UI 까지 덮으려면 Canvas 를 Screen Space - Camera 로 바꾼다.

## 흔한 실수
- **원이 타원이 된다**: UV 는 가로세로가 모두 0~1 이라 그대로 거리를 재면 화면비만큼 찌그러진다. `float2(aspect, 1.0)` 를 곱해 실제 비율로 잰다.
- **끝났는데 화면이 덮여 있다**: 머티리얼 에셋의 값은 플레이를 멈춰도 남는다. `OnDisable` 에서 `_Progress` 를 0 으로 되돌린다.
- **진행값 0 이나 1 에서 경계가 남는다**: 진행값을 그대로 쓰면 양 끝에서 덜 비거나 덜 찬다. 진행값 범위를 경계 폭만큼 넓혀 양 끝에서 정확히 0 과 1 이 되게 한다.
- **씬 로딩 중 전환이 멈칫한다**: `Time.deltaTime` 은 로딩 프레임에 크게 튄다. `Time.unscaledDeltaTime` 을 쓰고, 덮개가 완전히 닫힌 뒤에 씬을 불러온다.

## 변형 예시
- 텍스처 마스크로 전환 모양을 자유롭게 바꾸고 싶다.
- 가운데가 아니라 플레이어 위치로 원이 닫히게 하고 싶다.
- 전환 중 화면이 살짝 픽셀화되게 하고 싶다.
- 2D Renderer 프로젝트에서 UI RawImage 로 같은 효과를 쓰고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 에서는 Fullscreen 타깃을 쓰고 URP Sample Buffer 노드(BlitSource)가 `sgSource` 역할을 한다. 순서 값은 Custom Function 으로 `transitionOrder` 를 불러 쓴다.
