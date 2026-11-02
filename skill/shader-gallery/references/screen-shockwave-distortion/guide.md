# 충격파 왜곡 (Screen Shockwave Distortion)

퍼지는 고리 모양으로 화면을 왜곡한다

무대 종류: 전체 화면. 난이도 3/3. 기법: 전체 화면, UV 왜곡, 고리 마스크, 색수차, Full Screen Pass.

## 파일
- `ScreenShockwaveDistortion.shader`
- `core.hlsl`
- `ScreenShockwaveController.cs`

모두 프로젝트의 `Assets/Shaders/screen-shockwave-distortion/` 에 복사한다.

## 넣는 순서
1. `ScreenShockwaveDistortion.shader`, `core.hlsl`, `ScreenShockwaveController.cs` 를 `Assets/Shaders/screen-shockwave-distortion/` 에 둔다.
2. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.
3. 사용 중인 렌더러 에셋(Universal Renderer Data 또는 Renderer 2D Data)의 Add Renderer Feature 에서 Full Screen Pass Renderer Feature 를 추가한다.
4. Pass Material 에 머티리얼을 넣고 Injection Point 를 Before Rendering Post Processing 으로, Fetch Color Buffer 를 켠다.
5. 머티리얼의 세기를 0 으로 낮춘다. 기본값 0.06 은 썸네일용이라 그대로 두면 Scene 뷰, Game 뷰, 컨트롤러가 없는 씬과 빌드에 멈춘 고리가 계속 보인다. 열기 아지랑이로 쓰려면 세기는 0 그대로 두고 아지랑이를 0.5~0.8 로 올린다.
6. 빈 오브젝트 하나에 `ScreenShockwaveController` 를 붙이고 머티리얼을 연결한다. 컨트롤러는 **씬에 하나만 둔다**. 폭발 프리팹에는 붙이지 않고, 폭발 순간 그쪽 스크립트에서 `ScreenShockwaveController.Instance.Play(폭발 위치)` 를 부른다.

## 확인
플레이 중 `ScreenShockwaveController.Instance.Play(위치)` 를 부르면 그 지점에서 둥근 고리가 퍼지며 고리 위의 물체 윤곽이 바깥으로 휘고, 점점 약해져 1.5초 뒤 사라진다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_CenterX` | 중심 X | 0.5 |
| `_CenterY` | 중심 Y | 0.35 |
| `_Radius` | 반경 | 0.45 |
| `_Width` | 고리 폭 | 0.12 |
| `_Strength` | 세기 | 0.06 |
| `_FadeRadius` | 사라지는 반경 | 1.5 |
| `_Chroma` | 색수차 | 0.35 |
| `_Haze` | 아지랑이 | 0 |
| `_BlastRadius` | 폭발 반경 | 0 |
| `_BlastStrength` | 폭발 세기 | 0 |

## 동작 단계
1. **중심 거리**: 중심에서 멀수록 밝다. 화면비를 곱했기 때문에 같은 밝기가 **원**을 이룬다. 가운데의 어두운 점이 중심이다.
2. **고리 마스크**: `abs(거리 - 반경)` 이 고리 폭보다 작은 곳만 흰 띠로 남는다. 반경을 움직이면 띠가 퍼지고, 고리 폭을 움직이면 띠가 굵어진다.
3. **밀기 방향**: 중심에서 바깥쪽 방향을 색으로, 미는 양을 밝기로 보였다. 오른쪽은 노랑과 주황, 위는 연두, 왼쪽은 초록, 아래로 갈수록 어두운 빨강이다. 반경을 키우면 감쇠 때문에 고리 전체가 어두워진다.
4. **밀어 읽기**: 각 픽셀이 조금 안쪽 화면을 읽어 와서 고리 위의 공 윗부분과 상자가 바깥으로 부풀고 바닥 격자가 물결처럼 휜다. 색수차는 아직 없다.

## 주의할 점
- XR 에서는 권장하지 않는다. 시야 전체가 일렁이면 멀미를 부를 수 있다. XR 에서 충격파가 필요하면 먼저 폭발 위치에 월드 공간의 구나 쿼드를 두고 [화면 굴절 유리](#/s/screen-refraction-glass)처럼 씬 색상을 밀어 읽는 방식을 권한다. 물체가 눈마다 따로 그려지므로 두 눈의 고리 위치가 저절로 맞는다 (이 방식도 XR 실기기에서는 확인하지 않았다). 그래도 쓴다면 세기와 고리 폭을 줄이고 짧게 끝낸다.
- 이 전체 화면 머티리얼은 중심을 하나만 받는다. XR 은 눈마다 투영이 달라 한 중심값으로는 두 눈의 고리가 어긋날 수 있다 (실기기 미확인). 두 눈에 맞추려면 C# 에서 `WorldToViewportPoint(위치, Camera.MonoOrStereoscopicEye.Left)` 와 `Right` 로 중심을 두 개 구해 넘기고, 눈을 고르는 일은 래퍼(`.shader`)가 맡아 `unity_StereoEyeIndex` 로 고른 중심을 core 에 넘긴다 (`core.hlsl` 은 웹과 함께 쓰여 눈을 모른다). 이 방법도 실기기에서 확인하지 않았다.
- 색수차는 밝은 물체와 어두운 배경의 경계에 포화된 빨강 띠를 만든다. 화면 전체 밝기는 거의 그대로지만 `Play` 를 연타하면 넓은 고리 띠와 빨강 띠가 빠르게 튄다. 그래서 컨트롤러는 `Play` 를 실제 시간으로 0.34초에 한 번(초당 3회)까지만 받는다. 이 하한은 코드에 고정되어 Inspector 에서 낮출 수 없다.
- Renderer Feature 는 그 렌더러를 쓰는 모든 카메라에 적용된다. 폭발이 없어도 패스 비용(화면 텍스처 세 번 읽기)이 든다. 2D Renderer 도 Renderer 2D Data 에 같은 기능을 추가하면 된다 (전환 표본에서 촬영으로 확인한 방식).
- Screen Space - Overlay Canvas 는 이 패스가 끝난 뒤에 그려져 일렁이지 않는다. UI 까지 흔들려면 Canvas 를 Screen Space - Camera 로 바꾼다.
- 컨트롤러는 고리를 `Time.deltaTime` 으로 퍼뜨린다. 히트 스톱으로 `timeScale` 을 0 으로 두면 고리도 멈춘다. 멈추지 않게 하려면 `Time.unscaledDeltaTime` 으로 바꾼다. 연타 제한은 이와 상관없이 실제 시간으로 센다.

## 흔한 실수
- **고리가 가로로 늘어난 타원이 된다**: uv 는 가로세로가 모두 0~1 이라 그대로 거리를 재면 화면비만큼 찌그러진다. 중심과의 차이에 `float2(aspect, 1.0)` 을 곱해 높이 단위로 재고, 민 양은 다시 화면비로 나눠 uv 로 되돌린다.
- **화면 끝까지 같은 세기로 찢어진다**: 반경이 커져도 세기가 그대로면 고리가 화면 가장자리에서까지 크게 일그러진다. 반경에 따라 줄어드는 감쇠(`사라지는 반경`)를 곱하고, C# 에서도 퍼지는 동안 세기를 0 으로 내린다.
- **폭발 지점과 고리 중심이 어긋난다**: `WorldToScreenPoint` 는 픽셀 단위라 그대로 넣으면 중심이 화면 밖으로 나간다. `Camera.WorldToViewportPoint` 의 x, y(0~1)를 넣는다. 카메라 뒤(z < 0)의 폭발은 좌표가 뒤집히므로 세기를 0 으로 둔다.
- **폭발 두 개가 겹치면 앞의 고리가 사라지거나 뒤의 폭발이 나오지 않는다**: 머티리얼 하나에는 폭발 고리 값이 하나뿐이라 `ScreenShockwaveController` 는 마지막 폭발로 다시 시작한다. 연타로 화면이 튀지 않게 0.34초 안에 다시 부른 `Play` 는 무시한다. 동시에 여러 개가 필요하면 `_BlastRadius` 같은 값을 `float4` 몇 개로 늘려 고리를 더하거나, 머티리얼을 복제해 Full Screen Pass 를 하나 더 둔다. 이때도 `Play` 간격 제한(초당 3회)은 모든 고리를 합쳐 지킨다.
- **플레이를 멈췄는데 화면에 고리가 남는다**: 머티리얼 에셋의 값은 플레이를 멈춰도 남는다. 폭발 프리팹마다 컨트롤러를 붙이면 서로의 중간 값(퍼지는 중의 반경, 세기)을 에셋에 되써서 고리가 멈춘 채 남는다. 컨트롤러는 **씬에 하나만 둔다** (중복은 스스로 지워진다). 폭발 쪽 스크립트는 `ScreenShockwaveController.Instance.Play(위치)` 를 부른다. 컨트롤러는 `OnDisable` 에서 폭발 값(`_BlastRadius`, `_BlastStrength`)을 항상 0 으로 되돌린다. 값을 직접 고치는 코드를 따로 쓰면 같은 처리를 넣는다.

## 변형 예시
- 폭발 여러 개가 동시에 각자 고리를 퍼뜨리게 하고 싶다.
- 용암이나 불 근처에서만 열기 아지랑이가 보이게 하고 싶다.
- 고리 테두리에 밝은 빛 띠도 함께 넣고 싶다.
- 카메라 흔들림과 충격파를 같은 순간에 시작하고 싶다.
- 2D 탑다운 게임에서 피격 지점마다 작은 충격파를 쓰고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 에서는 Fullscreen 타깃을 쓰고 URP Sample Buffer 노드(BlitSource)가 `sgSource` 역할을 한다. `core.hlsl` 의 `shockwavePush` 는 머티리얼 값(`_Radius`, `_Width`, `_Strength` 등)과 다른 헬퍼(`shockwaveRing`, `shockwaveFade`)를 읽으므로 Custom Function 노드의 String 모드에 그대로 넣으면 컴파일되지 않는다. 식을 입력으로 옮겨 `void ShockwavePush_float(float Dist, float Radius, float Width, float FadeRadius, float Strength, out float Push)` 로 만든다. Name 을 `ShockwavePush`, 입력을 Dist, Radius, Width, FadeRadius, Strength(모두 Float), 출력을 Push(Float)로 두고 Body 에 `float ring = 1.0 - smoothstep(0.0, max(Width, 0.001), abs(Dist - Radius));` 와 `Push = ring * saturate(1.0 - Radius / max(FadeRadius, 0.001)) * Strength;` 두 줄을 쓴다. 폭발 고리는 같은 노드를 하나 더 두어 Radius 와 Strength 에 폭발 반경과 폭발 세기를 넣고, 두 Push 를 Add 한다. Dist 는 Screen Position 노드의 uv 에서 중심을 빼고 (화면비, 1)을 곱한 벡터의 길이다 (화면비는 Screen 노드의 Width ÷ Height). 그 벡터를 Normalize 한 방향에 Push 를 곱하고 (화면비, 1)로 나눈 만큼 uv 에서 빼서 BlitSource 를 다시 읽는다. 색수차는 배율을 바꿔 세 번 읽고 채널을 Combine 한다. 반경, 고리 폭 같은 값은 같은 이름의 그래프 속성으로 만든다.
