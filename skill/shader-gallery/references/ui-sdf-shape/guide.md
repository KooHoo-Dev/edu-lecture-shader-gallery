# SDF 도형 (UI SDF Shape)

거리장으로 해상도와 상관없이 매끈한 도형을 그린다

무대 종류: UI (UGUI Image). 난이도 2/3. 기법: 거리장(SDF), fwidth 안티앨리어싱, UGUI, 진행 바.

## 파일
- `UiSdfShape.shader`
- `core.hlsl`
- `UiSdfProgress.cs`

모두 프로젝트의 `Assets/Shaders/ui-sdf-shape/` 에 복사한다.

## 넣는 순서
1. `UiSdfShape.shader`, `core.hlsl`, `UiSdfProgress.cs` 를 `Assets/Shaders/ui-sdf-shape/` 에 둔다.
2. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.
3. Hierarchy 에서 Create > UI (Canvas) > Image 로 Image 를 만들고 Image 컴포넌트의 Material 칸에 머티리얼을 넣는다. 텍스처는 원래 Source Image 칸이 맡지만 이 셰이더는 도형을 계산으로 그리므로 Source Image 를 비우고 Image Type 은 Simple 로 둔다.
4. Rect Transform 의 Width, Height 로 크기를 정한다. 셰이더가 실제 비율을 재므로 원과 링은 찌그러지지 않는다. Image 크기가 곧 막대 크기면(400x40 체력 바, 세로로 긴 게이지) 머티리얼의 도형 가로세로 비를 0 으로 두어 꽉 채운다. 0 보다 크면 그 비율의 도형을 Image 안에 끼워 넣는다.
5. 같은 오브젝트에 `UiSdfProgress` 를 붙이고 체력은 `SetValue(현재, 최대)`, 쿨타임은 `StartCooldown(초)` 를 호출한다. 꺼진 오브젝트에 불러도 되고, 꺼져 있는 동안 흐른 쿨타임은 다시 켰을 때 반영된다.

## 확인
Game 뷰에서 머티리얼의 채움 양을 0 에서 1 로 올리면 막대가 왼쪽부터 차오르고(도형을 링으로 바꾸면 12시부터 시계 방향), Image 를 크게 키워도 가장자리가 계단 없이 매끈하다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_Shape` | 도형 | 둥근 사각형 |
| `_Fill` | 채움 양 | 0.7 |
| `_Radius` | 모서리 반경 | 0.6 |
| `_OutlineWidth` | 윤곽 두께 | 0.025 |
| `_FillColor` | 채움 색 | #4FD1C5 |
| `_OutlineColor` | 윤곽 색 | #F4F1DE |
| `_Aspect` | 도형 가로세로 비 | 2.5 |

## 동작 단계
1. **거리**: 픽셀마다 도형 가장자리까지의 거리를 색으로 본다. 안쪽은 파랑, 바깥은 주황이고 흰 선이 거리 0 인 가장자리다. 줄무늬 간격이 어디서나 같다는 것이 "거리" 라는 뜻이다. 도형과 모서리 반경을 바꿔 본다.
2. **채움**: 윤곽 두께만큼 안쪽으로 줄인 도형에 진행 마스크를 겹친 영역이다. 흰 곳이 채운 부분, 회색이 아직 안 채운 자리다. 사각형과 원은 반평면 거리와 `max` 로 겹치고, 링은 12시에서 시작하는 호의 거리를 쓴다. 진행 경계도 윤곽 안쪽 크기로 재므로 채움 양 0 과 1 바로 근처에서도 화면이 변한다. 채움 양을 움직여 본다.
3. **윤곽**: 도형 전체에서 윤곽 안쪽(거리 + 두께 < 0 인 곳)을 뺀 가는 띠다. 같은 거리 값 하나에서 문턱만 바꿔 얻으므로 도형이 바뀌어도 윤곽이 저절로 따라간다. 두 영역 모두 `fwidth` 로 1픽셀만큼만 부드럽게 자른다.

## 주의할 점
- Stencil 속성(`_StencilComp` 등)과 Stencil 블록을 지우면 Mask 안에 넣었을 때 Unity 가 머티리얼에 스텐실 속성이 없다고 경고하고 자식이 가려지지 않는다. Mask 는 마스크 그래픽의 머티리얼 복사본에 `UNITY_UI_ALPHACLIP` 을 자동으로 켜므로, frag 의 `clip` 을 지우면 자식이 도형 모양이 아니라 Image 사각형대로 가려진다.
- `UNITY_UI_CLIP_RECT` 키워드와 `_ClipRect` 계산을 지우면 Scroll View 같은 RectMask2D 밖으로 도형이 샌다.
- 패스에 LightMode 태그를 붙이지 않는다. Screen Space - Overlay 캔버스는 첫 패스를 쓰고, Camera·World Space 캔버스와 2D Renderer 는 태그 없는 패스를 SRPDefaultUnlit 으로 그린다.
- CanvasGroup 의 alpha, Button 의 색 전환(Color Tint), Image 의 Color 는 모두 정점 색으로 들어온다. 셰이더를 고치다 `i.color` 곱을 빼면 페이드와 버튼 눌림 색이 무시된다. 캔버스의 Vertex Color Always In Gamma Color Space 를 켜도 래퍼가 Linear 프로젝트에서 정점 색을 선형으로 바꾸므로 색이 맞는다.
- Image 마다 다른 머티리얼 복사본을 쓰면 캔버스 배칭이 끊겨 드로우 콜이 늘어난다. 값이 같은 Image 끼리는 머티리얼을 공유한다.
- 가로세로 비를 uv 의 화면 미분으로 잰다. World Space 캔버스를 기울이면 화면에 눌려 보인 비율을 그대로 재므로 원이 패널과 함께 눌리지 않고, 패널 위에서는 기울인 방향으로 늘어난 타원이 된다. 카드 뒤집기나 X 스케일 트윈처럼 폭이 0 으로 줄면 비율 추정도 0 으로 가서, 도형이 납작해지는 대신 줄어든 폭에 맞춰 작아지다가 사라질 수 있다. 이런 연출에 쓰려면 비율을 C# 에서 Rect Transform 크기로 넘기게 셰이더를 고친다.

## 흔한 실수
- **가장자리가 계단처럼 깨진다**: `step` 이나 `if (d < 0)` 으로 자르면 픽셀마다 0 또는 1 이라 계단이 생긴다. `saturate(0.5 - d / fwidth(d))` 처럼 픽셀 하나의 폭으로 나눠 가장자리에서만 알파가 0~1 로 바뀌게 한다.
- **큰 Image 에서는 가장자리가 뭉개지고 작은 아이콘에서는 계단이 생긴다**: `smoothstep(0.0, 0.01, -d)` 처럼 가장자리 폭을 고정 숫자로 두면 그 폭이 화면에서 몇 픽셀인지가 Image 크기에 따라 달라진다. 큰 Image 에서는 여러 픽셀에 걸쳐 번지고, 작은 Image 에서는 1픽셀보다 좁아져 계단이 된다. 폭은 `fwidth(d)` 로 그때그때 잰다.
- **체력 바가 Image 폭의 일부만 쓴다**: 도형 가로세로 비(`_Aspect`)가 0 보다 크면 그 비율의 도형을 Image 안에 끼워 넣는다. 400x40 Image 에 4 를 넣으면 높이에 맞춘 4:1 막대가 가운데에 작게 놓인다. Image 크기가 곧 막대 크기면 `_Aspect` 를 0 으로 두어 꽉 채운다. 세로로 긴 Image 에서는 세로 게이지가 되어 아래부터 찬다.
- **체력 바 하나를 바꿨는데 전부 같이 줄어든다**: `Image.material` 은 `Renderer.material` 과 달리 복사본을 만들지 않고 공유 머티리얼을 돌려준다. `new Material(image.material)` 로 복사본을 만들어 `image.material` 에 넣고 `OnDestroy` 에서 지운다 (`UiSdfProgress` 참고). 복사본은 처음 값을 넣을 때 만들어야 꺼진 채 시작한 HUD 에 `Awake` 전에 값을 넣어도 오류가 나지 않는다.
- **도형이 안 보이거나 엉뚱한 곳에 작게 그려진다**: Source Image 에 아틀라스(Sprite Atlas)에 묶인 스프라이트를 넣으면 uv 가 아틀라스 속 작은 구간만 돌아 가운데 값 0.5 를 지나지 않는 경우가 많고, 그러면 도형이 대개 안 보인다. Image Type 을 Sliced, Filled 로 바꿔도 uv 가 0~1 이 아니게 된다. Source Image 를 비우고 Image Type 은 Simple 로 둔다.

## 변형 예시
- 체력이 30% 아래로 떨어지면 채움 색이 빨갛게 바뀌고 윤곽이 천천히 맥동하게 하고 싶다. 맥동은 2Hz 이하로.
- 링 두께를 머티리얼에서 조절하고 싶다.
- 윤곽 두께를 이미지 짧은 변 비율이 아니라 픽셀 단위로 맞추고 싶다.
- 두 도형을 합집합, 차집합으로 합쳐 말풍선이나 알림 배지 모양을 만들고 싶다.
- 도형 바깥에 부드러운 그림자를 깔고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 의 Canvas 타깃에서 Custom Function 노드의 File 모드로 쓸 수 있다. 단 `core.hlsl` 을 그대로 넣으면 `SgInput` 구조체와 `_Fill` 같은 속성 선언이 없어 컴파일되지 않는다. `UISDF_PI` 정의와 `uiSdfRoundBox`, `uiSdfRadialSegment`, `uiSdfArc` 만 새 `.hlsl` 파일에 복사하고 `void UiSdfBox_float(float2 UV, float2 HalfSize, float Radius, out float d) { d = uiSdfRoundBox(UV - 0.5, HalfSize, Radius); }` 처럼 `이름_float` 함수로 감싸 노드의 Name 에 `UiSdfBox` 를 적는다. 가장자리는 `saturate(0.5 - d / DDXY(d))` 를 노드로 만든다 (DDXY 노드가 `fwidth`).
