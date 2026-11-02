# 깊이·법선 윤곽선 후처리 (Depth Normal Edge Outline)

깊이와 법선 차이로 전체 화면에 윤곽선을 그린다

무대 종류: 전체 화면. 난이도 3/3. 기법: 전체 화면, 깊이 텍스처, 법선 텍스처, 윤곽선 검출, Full Screen Pass.

## 파일
- `DepthNormalEdgeOutline.shader`
- `core.hlsl`

모두 프로젝트의 `Assets/Shaders/depth-normal-edge-outline/` 에 복사한다.

## URP 설정
Full Screen Pass Renderer Feature 의 Requirements 에서 켠다: Depth, Normal.

## 넣는 순서
1. `DepthNormalEdgeOutline.shader`, `core.hlsl` 을 `Assets/Shaders/depth-normal-edge-outline/` 에 둔다.
2. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.
3. 사용 중인 Universal Renderer Data 의 Add Renderer Feature 에서 Full Screen Pass Renderer Feature 를 추가한다.
4. Pass Material 에 머티리얼을 넣고 Injection Point 를 Before Rendering Post Processing 으로, Fetch Color Buffer 를 켠다.
5. 같은 기능의 Requirements 에서 Depth 와 Normal 을 켠다. Color 는 Fetch Color Buffer 가 맡으므로 따로 고르지 않아도 된다.

## 확인
Game 뷰의 물체 실루엣과 상자 모서리, 물체가 바닥에 닿는 곳에 밝은 크림색 선이 생긴다. 법선 민감도를 0 으로 내리면 상자 모서리와 바닥에 닿는 곳의 선이 빠지고, 원래 화면 섞기를 0 으로 내리면 종이 색 바탕에 선만 남는다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_Thickness` | 선 두께 | 3 |
| `_DepthSensitivity` | 깊이 민감도 | 12 |
| `_NormalSensitivity` | 법선 민감도 | 1.5 |
| `_LineColor` | 선 색 | #FFF0C8 |
| `_FadeDistance` | 선이 사라지는 거리 | 30 |
| `_SceneMix` | 원래 화면 섞기 | 1 |
| `_PaperColor` | 종이 색 | #1B2433 |

## 동작 단계
1. **깊이 윤곽**: 대각선 두 쌍의 깊이 차이를 가장 가까운 거리로 나눈 값이다. 물체가 뒤 배경과 갈라지는 실루엣이 하얀 선으로 나온다. 상자 윗면 뒤쪽 모서리처럼 법선이 바닥과 같은 경계도 여기서 잡힌다. 상자 앞 모서리와 바닥에 닿는 아래쪽처럼 깊이가 이어진 접힌 곳은 비어 있다. 바닥 끝 바로 아래의 흐린 회색 띠는 아주 비스듬히 보이는 바닥이다. 거리로 나눠도 각도가 얕으면 차이가 남는다.
2. **법선 윤곽**: 대각선 두 쌍의 법선 차이다. 상자 모서리와 상자가 바닥에 닿는 곳처럼 면이 꺾이는 곳이 하얗게 나온다. 법선이 바닥과 같은 상자 윗면 뒤쪽 모서리는 비어 있어, 깊이 윤곽과 서로 빈 곳을 메운다. 하늘은 법선이 0 이라 바닥 끝과 공 윗부분에도 선이 생긴다.
3. **합친 윤곽**: 두 윤곽 중 강한 쪽을 쓰고 먼 곳은 흐린다. 하얀 곳이 선이 들어갈 자리다. 바닥 끝은 하늘(먼 평면)과 맞닿아 깊이와 법선이 함께 뛰므로 화면을 가로지르는 한 줄이 된다. 선이 사라지는 거리를 10m 아래로 낮추면 이 줄과 그 아래 띠부터 지워진다.

## 주의할 점
- 법선 텍스처는 Requirements 의 Normal 이나 SSAO 같은 다른 기능이 요청할 때만 만들어진다. Normal 을 켜지 않으면 법선이 비어 상자 모서리처럼 깊이가 이어진 접힌 곳의 선이 빠진다. 또 깊이·법선 텍스처에는 `DepthNormals` 패스가 있는 불투명 물체만 들어간다. 투명 머티리얼, 파티클, 투명 큐의 물체와 노멀 패스 없이 직접 쓴 셰이더의 물체에는 선이 없다.
- 비용은 두 가지다. Normal 을 켜면 불투명 물체 전체를 한 번 더 그리는 프리패스가 돌아 물체 수에 비례하고 (SSAO 처럼 이미 법선을 요청하는 기능이 있으면 추가 비용 없음), 전체 화면 패스가 픽셀마다 깊이·법선을 8번 읽어 해상도에 비례한다. 모바일과 XR 에서 크다. XR 은 눈마다 텍스처 배열을 쓰므로 실기기에서 확인한다.
- Deferred 렌더 경로에서 Accurate G-buffer Normals 를 켜면 법선 텍스처가 부호화되어 저장된다. 래퍼의 `#pragma multi_compile_fragment _ _GBUFFER_NORMALS_OCT` 를 지우면 그 값을 그대로 법선으로 읽어 매끈한 공에도 얼룩 선이 생긴다.
- Renderer Feature 는 그 렌더러를 쓰는 모든 카메라에 적용된다. 미니맵이나 UI 카메라처럼 선이 필요 없는 카메라는 다른 렌더러를 쓰게 한다.
- 3D 프로젝트(Universal Renderer)용이다. URP 소스로 보면 2D Renderer 는 법선 텍스처(`_CameraNormalsTexture`)를 만들지 않으므로 Requirements 의 Normal 을 켜도 법선 윤곽은 쓸 수 없다. 스프라이트에는 월드 법선도 없다.
- Screen Space - Overlay Canvas 는 이 패스가 끝난 뒤에 그려져 UI 에는 선이 생기지 않는다.

## 흔한 실수
- **상자 모서리나 물체가 바닥에 닿는 곳에 선이 없다**: 법선 텍스처가 비어 깊이 윤곽만 남은 모습이다. 법선 텍스처는 SSAO 처럼 법선을 요청하는 기능이 없으면 만들어지지 않는다. 다른 기능이 우연히 요청하고 있어 되던 프로젝트도 SSAO 를 끄면 접힌 곳의 선이 사라진다. Full Screen Pass Renderer Feature 의 Requirements 에서 **Depth** 와 **Normal** 을 함께 켠다. Window > Analysis > Frame Debugger 에서 `_CameraNormalsTexture` 가 만들어지는지 본다.
- **먼 바닥이 선 색 띠로 덮인다**: 깊이 차이를 미터 그대로 쓰면 같은 각도의 바닥도 멀수록 한 픽셀 사이 깊이 차이가 커진다. 깊이 차이를 그 픽셀까지의 거리로 나눈 상대 차이를 쓴다. 그래도 바닥이 아주 비스듬하면 차이가 커져 선이 번진다. 샘플 간격이 화면 픽셀이라 해상도나 Render Scale 이 낮을수록 한 간격이 더 넓은 바닥을 건너뛰어 띠도 넓어진다. 정석 해결은 깊이 문턱을 그 픽셀의 `1 / dot(N, V)`(N 은 법선, V 는 카메라 쪽 방향)만큼 키워 비스듬히 보이는 면일수록 덜 예민하게 하는 것이다. 간단히는 깊이 민감도나 선 두께를 낮추거나 선이 사라지는 거리를 줄인다.
- **투명 물체나 직접 만든 셰이더 물체에 윤곽이 없다**: Requirements 의 Normal 을 켜면 불투명 물체를 `DepthNormals` 패스로 한 번 더 그리는 프리패스가 돌고, 깊이 텍스처도 이 프리패스에서 나온다. 그래서 직접 쓴 언릿·툰 셰이더처럼 이 패스가 없는 물체는 화면에는 보이는데 깊이와 법선 어디에도 없어 선이 하나도 생기지 않는다. 그 셰이더에 노멀 패스를 더한다 (Forward 전용 셰이더는 `"LightMode" = "DepthNormalsOnly"`, [디졸브](#/s/dissolve-edge-glow) 래퍼의 노멀 패스 참고). 유리, 물, 파티클 같은 투명 물체는 이 프리패스에 들어가지 않아 선이 없고, 그 뒤 불투명 물체의 윤곽이 투명 물체를 뚫고 보인다. 투명 물체에 선이 필요하면 그 물체만 껍데기 외곽선(`inverted-hull-outline`)을 쓴다.
- **지평선이나 바닥 끝에 긴 선이 생긴다**: 하늘은 깊이가 먼 평면(카메라 Far)이고 법선이 0 이라, 바닥이 하늘과 맞닿는 곳은 깊이와 법선이 모두 크게 뛰어 선이 된다. 원하지 않으면 선이 사라지는 거리를 바닥 끝보다 짧게 두거나, 샘플 중 하나라도 Far 근처면 선을 빼는 조건을 넣는다. 다만 하늘을 배경으로 선 물체의 실루엣도 함께 빠진다.
- **해상도나 품질 설정에 따라 선 두께가 바뀐다**: 두께가 화면 픽셀 단위라 해상도가 높을수록 화면 비율로는 얇아진다. URP Asset 의 Render Scale 을 낮추면 버퍼가 작아져 선이 굵고 거칠어진다. MSAA 를 켜도 깊이·법선 텍스처는 샘플 하나로 줄어든 채 읽히므로 선 가장자리는 계단진다. 화면 색은 MSAA 로 부드러워 선과 물체 가장자리가 반 픽셀쯤 어긋나 보일 수 있다 (Unity 에서 직접 확인하지는 않았다). 선의 계단에는 이 패스 뒤에 도는 카메라의 FXAA·SMAA(Post Processing 을 켠 카메라의 Anti-aliasing)가 도움이 된다. 기준 해상도에서 `_Thickness` 를 정하고, 필요하면 C# 에서 화면 높이에 비례해 넣는다.

## 변형 예시
- Volume 컴포넌트로 장면이나 구역마다 선 색과 두께를 바꾸고 싶다 (C# 로 Volume 값을 머티리얼에 옮긴다).
- 해상도가 바뀌어도 선이 화면 비율로 같은 두께로 보이게 C# 에서 화면 높이에 맞춰 두께를 넣고 싶다.
- 원래 화면의 색 차이도 윤곽에 더해 무늬와 텍스처 경계에도 선이 생기게 하고 싶다.
- 스케치 룩에 노이즈로 선을 흔들고 종이 결 텍스처를 깔고 싶다.
- 특정 레이어(플레이어, 아이템)만 다른 색 선을 두르고 싶다. 그 물체는 껍데기 외곽선과 섞어 쓴다.

## Shader Graph 에서 쓰기
Shader Graph 에서는 Fullscreen 타깃을 쓴다. URP Sample Buffer 노드의 BlitSource 가 `sgSource`, NormalWorldSpace 가 `sgSceneNormal` 역할이고, Scene Depth 노드를 Eye 모드로 두면 `sgSceneDepth` 와 같다. 네 점의 uv 는 Screen Position 에 픽셀 크기(1 / Screen 노드의 Width, Height)를 곱한 오프셋을 더해 만들고, 각 점마다 노드를 하나씩 두어 대각선 차이를 뺀다.
