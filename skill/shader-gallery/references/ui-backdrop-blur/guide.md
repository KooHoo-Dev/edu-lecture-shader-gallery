# 배경 블러 유리 (UI Backdrop Blur)

패널 뒤 화면을 흐리게 비춘다

무대 종류: UI (UGUI Image). 난이도 3/3. 기법: 씬 컬러(Opaque Texture), 나선 샘플링 블러, 거리장(SDF), UGUI, 캔버스 렌더 모드.

## 파일
- `UiBackdropBlur.shader`
- `core.hlsl`
- `UiBackdropPanel.cs`

모두 프로젝트의 `Assets/Shaders/ui-backdrop-blur/` 에 복사한다.

## URP 설정
사용 중인 URP Asset 에서 켠다: Opaque Texture.

## 넣는 순서
1. `UiBackdropBlur.shader`, `core.hlsl`, `UiBackdropPanel.cs` 를 `Assets/Shaders/ui-backdrop-blur/` 에 둔다.
2. 사용 중인 URP Asset(품질 단계마다 다르면 모두)의 Rendering 에서 Opaque Texture 를 켠다. 카메라의 Rendering > Opaque Texture 가 Off 면 Use Pipeline Settings 로 바꾼다.
3. Canvas 의 Render Mode 를 Screen Space - Camera 로 바꾸고 Render Camera 에 장면을 그리는 Base 카메라를 넣는다 (World Space 도 된다). Screen Space - Overlay 에서 Opaque Texture 가 읽히는지는 보장되지 않고 확인하지 않았으며, UI 만 그리는 Overlay 카메라(카메라 스택)는 Opaque Texture 를 만들지 않는다. Plane Distance 는 장면의 3D 물체보다 카메라에 가깝게 둔다. 더 가까운 3D 물체는 패널을 가린다.
4. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다. Hierarchy 에서 GameObject > UI (Canvas) > Image 로 Canvas 아래에 패널을 만들고 Image 의 Material 칸에 머티리얼을 넣는다. 패널 모양은 셰이더가 계산하므로 Source Image 는 비우고 Image Type 은 Simple 로 둔다.
5. 글(TextMeshPro 등)과 버튼은 패널의 자식 오브젝트 하나에 모아 패널보다 나중에 그려지게 하고, 그 자식에 CanvasGroup 을 붙인다. 글이 잘 읽히지 않으면 유리 색 비율을 0.5 안팎으로 올리고 유리 색을 글과 반대 밝기로 둔다.
6. 패널에 `UiBackdropPanel` 을 붙이고 Content 칸에 위 자식의 CanvasGroup 을 넣는다. 메뉴를 열 때 `Open()`, 닫을 때 `Close()` 를 부른다. 탭을 바꿀 때처럼 빨리 닫고 잠깐 쉰 뒤 다시 열려면 `Reopen()` 을 부른다. 글도 함께 사라지고, 다 닫히면 Image 를 꺼 흐림 비용과 클릭 막힘이 없어진다. 패널마다 머티리얼 복사본을 쓰므로 머티리얼 에셋의 닫힘 값은 0 으로 둔다.
7. 모바일 빌드는 머티리얼의 샘플 수를 Low 로, 흐림 반경을 0.03 아래로 두고, URP Asset 의 Opaque Downsampling 을 4x Box 로 둔다.

## 확인
Game 뷰에서 패널 뒤 3D 물체의 윤곽이 뭉개져 비치고, 흐림 반경을 0 으로 내리면 뒤가 또렷해지며, 카메라나 물체가 움직이면 흐린 모습이 같이 따라간다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_BlurRadius` | 흐림 반경 | 0.045 |
| `_Quality` | 샘플 수 | Medium (16번) |
| `_TintColor` | 유리 색 | #D4E0F0 |
| `_TintAmount` | 유리 색 비율 | 0.18 |
| `_RimColor` | 테두리 빛 색 | #E0EEFF |
| `_RimGlow` | 테두리 빛 밝기 | 0.8 |
| `_CornerRadius` | 모서리 둥글기 | 0.18 |
| `_Hide` | 닫힘 | 0 |

## 동작 단계
1. **패널 모양**: 둥근 사각형 거리장의 안쪽을 흰색으로 본다. 이 값이 패널의 알파다. 모서리 둥글기를 바꾸면 모서리만 바뀌고, 가장자리는 `fwidth` 로 1픽셀만 부드럽다. Image 의 가로세로 비를 uv 의 화면 미분으로 재서 가로로 긴 패널에서도 모서리가 원호를 유지한다. 패널은 바닥에서 떠 있어 왼쪽 아래 모서리까지 보인다. 오른쪽 아래 모서리는 패널보다 카메라에 가까운 상자 앞면에 가려진다. Camera, World Space 캔버스의 UI 도 이처럼 깊이를 비교해 더 가까운 3D 물체에 가려진다.
2. **흐리기 전 씬 색상**: 패널 자리의 화면 좌표로 씬 색상을 한 번 읽은 모습이다. 공과 바닥, 패널 뒤로 들어간 상자 윗부분이 패널이 없는 것처럼 그대로 비쳐 이어진다. 패널은 자기 뒤를 직접 볼 수 없고, 카메라가 불투명 물체를 다 그린 직후 복사해 둔 화면(Opaque Texture)을 읽는다. 바깥 모서리는 패널 모양 밖이라 검다.
3. **흐린 씬 색상**: 같은 자리 주변을 황금각 나선으로 여러 번 읽어 평균한 모습이다. 공과 상자의 윤곽, 바닥 격자가 뭉개진다. 패널 앞에 있는 상자 앞면의 가장자리 둘레에도 상자 색이 번진다. Opaque Texture 에는 패널 앞의 물체도 들어 있어 흐림이 그 색까지 끌어오기 때문이다. 샘플 수를 Low 로 내리면 흐림 속에 고운 알갱이가 생긴다. 나선을 픽셀마다 다르게 돌려 겹상을 알갱이로 바꾼 것이다. 흐림 반경을 키우면 더 뭉개지고 알갱이도 거칠어진다.
4. **테두리 빛**: 가장자리 안쪽의 가는 띠만 본다. 패널 모양에서 거리장을 띠 폭만큼 안으로 옮긴 모양을 빼서 얻는다. 위쪽 변이 가장 밝고, 옆 변은 아래로 내려갈수록 어두워져 아래쪽 변은 어두운 회색이다. 빛이 위에서 비치는 유리처럼 보이게 한 것이다. 이 빛을 3단계의 흐린 배경에 유리 색을 섞은 위에 더하면 최종 화면이 된다.

## 주의할 점
- Screen Space - Camera 캔버스를 권한다. Screen Space - Overlay 캔버스에서 Opaque Texture 가 읽히는지는 보장되지 않고 확인하지 않았다. URP 17.3 은 Overlay UI 도 카메라 렌더 그래프 안에서 그려 읽힐 수 있지만, 읽혀도 투명 물체와 후처리가 빠진 복사본이라 패널 색이 주변 화면과 다르다. UI 만 그리는 Overlay 카메라(카메라 스택)는 Opaque Texture 를 만들지 않아 그 카메라를 Render Camera 로 쓰면 뒤가 비치지 않는다.
- Opaque Texture 는 불투명 물체만 담는다. 다른 UI, 투명 물체, 파티클, 하늘보다 늦게 그려지는 것은 흐림에 들어가지 않고 그 자리의 불투명 장면이 비친다. 흐린 패널끼리 겹쳐도 뒤 패널은 보이지 않는다. 반대로 패널보다 카메라에 가까운 불투명 물체는 들어 있어, 그 물체가 패널을 가린 경계 둘레에 물체 색이 흐리게 번진다.
- 2D Renderer 는 Opaque Texture 를 만들지 않는다. Renderer 2D Data 의 Camera Sorting Layer Texture 에서 Foremost Sorting Layer 를 정하고, 래퍼의 `sgSceneColor` 를 `_CameraSortingLayerTexture` 를 읽게 바꿔야 한다. 이 패스는 LightMode 태그가 없어 2D Renderer 에서도 SRPDefaultUnlit 으로 그려지지만, 바꾸지 않으면 뒤가 비치지 않는다.
- 샘플 수가 곧 비용이다. 패널이 덮는 픽셀마다 Low 8번, Medium 16번, High 32번 텍스처를 읽는다. 모바일은 Low 와 작은 반경을 쓰고 Opaque Downsampling(4x Box)으로 읽는 양을 줄인다. 전체 화면을 덮는 배경 패널은 특히 비싸다.
- XR 에서는 권하지 않는다. 눈마다 다시 읽어 비용이 두 배이고, World Space UI 에서 화면 공간 흐림이 머리 움직임에 따라 어떻게 보여야 하는지 쓰임이 분명하지 않다. 래퍼의 스테레오 매크로는 남겨 두었지만 실기기에서 확인하지 않았다.
- Stencil 속성과 블록, `UNITY_UI_CLIP_RECT` 와 `_ClipRect` 계산, `UNITY_UI_ALPHACLIP` 의 `clip` 을 지우면 각각 Mask 안에서 가려지지 않고(Unity 경고), Scroll View 같은 RectMask2D 밖으로 패널이 새고, Mask 가 둥근 모양이 아닌 사각형으로 가린다. 패스에 LightMode 태그를 붙이면 캔버스 종류에 따라 그려지지 않는다.

## 흔한 실수
- **패널이 뒤를 비추지 않고 회색이나 검은 판으로 보이거나, 비친 색이 주변 화면과 다르다**: 넷 중 하나다. (1) URP Asset 의 Opaque Texture 가 꺼져 있다. 품질 단계마다 URP Asset 이 다르면 모두 켜고, 카메라의 Opaque Texture 가 Off 면 Use Pipeline Settings 로 바꾼다. (2) 캔버스가 Screen Space - Overlay 다. Overlay 캔버스에서 Opaque Texture 가 읽히는지는 보장되지 않고 확인하지 않았다. 읽혀도 투명 물체와 후처리가 빠진 복사본이라 색이 주변과 다르다. (3) Canvas 의 Render Camera 가 UI 만 그리는 Overlay 카메라(카메라 스택)다. Overlay 카메라는 Opaque Texture 를 만들지 않는다. (2), (3) 은 Screen Space - Camera 로 바꾸고 Render Camera 에 장면을 그리는 Base 카메라를 넣는다. (4) 2D Renderer 를 쓴다. Opaque Texture 가 없어 Camera Sorting Layer Texture 를 읽게 셰이더를 고쳐야 한다.
- **뒤에 있는 다른 UI 나 파티클이 흐림에 안 보이고 그 자리의 3D 장면이 비친다**: Opaque Texture 는 불투명 물체를 그린 직후의 복사본이라 투명 물체, 파티클, 다른 UI 가 들어 있지 않다. 패널 뒤 UI 가 흐려 보여야 하면 그 UI 를 별도 카메라로 렌더 텍스처에 찍어 읽거나, 패널 뒤에 반투명 판을 깔아 가린다. 같은 이유로 흐린 패널 두 장을 겹치면 뒤 패널은 앞 패널의 흐림에 나오지 않는다.
- **흐림 속에 물체가 몇 겹으로 어긋나 비치거나 알갱이가 거칠다**: 반경에 비해 샘플이 적다. 반경을 키울수록 같은 샘플 수가 넓은 원에 듬성듬성 흩어진다. 샘플 수를 올리거나 반경을 줄인다. URP Asset 의 Opaque Downsampling 을 4x Box 로 두면 복사본이 미리 뭉개져 같은 샘플 수로도 부드럽고 읽는 비용도 준다. 알갱이 무늬는 화면 픽셀에 고정되어 있어 패널을 움직이면 무늬는 제자리에 남고 패널만 그 위를 지나간다. 움직이는 패널에서 눈에 띄면 샘플 수를 올린다.
- **패널을 열면 프레임이 떨어진다 (특히 모바일)**: 비용은 패널이 덮는 픽셀 수 × 샘플 수다. 화면 전체를 덮는 High(32번) 패널은 매 프레임 모든 픽셀이 32번 텍스처를 읽는다. 모바일은 Low 와 작은 반경, Opaque Downsampling 4x Box 를 쓰고, 큰 배경 패널 대신 필요한 영역만 흐린다. 닫힌 패널도 알파만 0 일 뿐 켜져 있으면 같은 비용을 쓴다 (`UiBackdropPanel` 은 다 닫히면 Image 를 끈다). 메뉴가 열린 동안 장면이 멈춰 있다면 한 번 찍어 둔 흐린 이미지를 RawImage 로 보여 주는 편이 훨씬 싸다.
- **패널 하나를 닫았는데 다른 패널도 함께 사라진다**: `Image.material` 은 복사본을 만들지 않고 공유 머티리얼을 돌려준다. 머티리얼 에셋의 `_Hide` 를 직접 바꾸면 같은 머티리얼을 쓰는 패널이 모두 닫힌다. `UiBackdropPanel` 은 처음 쓸 때 Image 마다 복사본을 만들어 `image.material` 에 넣고 `OnDestroy` 에서 지운다. 꺼진 채 시작한 메뉴에 `Awake` 전에 `Close()` 를 불러도 된다. Mask 안의 패널은 Unity 가 따로 쓰는 스텐실용 복사본(`materialForRendering`)에도 같은 값을 넣는다. 페이드만 하면 되면 머티리얼은 그대로 두고 CanvasGroup 의 alpha 를 움직인다 (정점 색으로 들어와 셰이더가 곱한다).

## 변형 예시
- 메뉴 패널이 열릴 때 흐림이 커지는 동안 패널 크기도 0.96 에서 1 로 살짝 커지고, 글은 패널이 반쯤 열린 뒤에 나타나게 하고 싶다. `UiBackdropPanel` 의 열기 시간에 맞춰 Rect Transform 의 스케일과 글 CanvasGroup 의 alpha 를 함께 움직이고, 일시정지 중에도 동작하게 실제 시간으로 재 줘.
- 2D Renderer 프로젝트에서 쓰고 싶다. Opaque Texture 대신 Camera Sorting Layer Texture 를 읽게 바꾸고 Renderer 2D Data 에서 켤 설정도 알려 줘.
- Source Image 의 알파를 패널 모양으로 써서 9-slice 프레임이나 말풍선 모양의 유리를 만들고 싶다.
- 흐린 유리 위에 아주 옅은 노이즈 알갱이와 위에서 아래로 옅어지는 반사광을 얹어 더 유리처럼 보이게 하고 싶다.
- 메뉴가 열려 있는 동안 장면이 멈추므로, 열 때 한 번만 흐린 화면을 찍어 RawImage 로 보여 줘 매 프레임 비용을 없애고 싶다.
