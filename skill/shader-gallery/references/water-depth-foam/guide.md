# 깊이 기반 물가 거품 (Water Depth Foam)

물체와 만나는 곳에 거품 띠를 그린다

무대 종류: 깊이 사용. 난이도 3/3. 기법: 깊이 텍스처, 알파 혼합, 노이즈, 프레넬, 물.

## 파일
- `WaterDepthFoam.shader`
- `core.hlsl`
- `WaterDepthFoamNoise.png`

모두 프로젝트의 `Assets/Shaders/water-depth-foam/` 에 복사한다.

## URP 설정
사용 중인 URP Asset 에서 켠다: Depth Texture.

## 넣는 순서
1. `WaterDepthFoam.shader`, `core.hlsl`, `WaterDepthFoamNoise.png` 를 `Assets/Shaders/water-depth-foam/` 에 둔다.
2. Project 창에서 `WaterDepthFoamNoise.png` 를 고르고 Inspector 에서 Texture Type 은 Default, sRGB (Color Texture) 는 끄고, Wrap Mode 는 Repeat, Filter Mode 는 Bilinear, Compression 은 None 으로 맞춘 뒤 Apply 를 누른다. 색이 아닌 높이 데이터다. 셰이더가 한 텍셀 높이 차이에 10 을 곱해 법선을 만들고 반짝임에 500 제곱을 쓰므로, 기본 압축(데스크톱 BC1, 모바일 ASTC)이면 높이 값이 블록 단위로 뭉개져 가까운 수면의 물결과 반짝임이 각져 보일 수 있다. 128 픽셀이라 압축하지 않아도 작다.
3. 사용 중인 URP Asset(Project Settings > Quality 에 연결된 것)의 Depth Texture 를 켠다.
4. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고 노이즈 텍스처 칸에 `WaterDepthFoamNoise.png` 를 넣는다.
5. GameObject > 3D Object > Plane 을 만들어 머티리얼을 넣고, 지형이나 바위가 수면을 뚫고 나오는 높이에 둔다. 평면 아래에 바닥(지형)이 있어야 깊이 색이 생긴다.

## 확인
Game 뷰에서 바위나 상자가 수면을 뚫고 나온 둘레에 흰 거품 띠가 생기고, 물체를 위아래로 움직이면 띠가 따라 움직인다. 거품 폭을 올리면 띠가 넓어지고, 깊이 범위를 줄이면 물이 금방 탁해진다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_ShallowColor` | 얕은 색 | #3FD4C4 |
| `_DeepColor` | 깊은 색 | #0B3556 |
| `_DepthRange` | 깊이 범위 | 0.8 |
| `_FoamColor` | 거품 색 | #F4FBFF |
| `_FoamWidth` | 거품 폭 | 0.45 |
| `_FoamBreakup` | 거품 끊김 | 0.8 |
| `_FlowSpeed` | 흐름 속도 | 0.6 |
| `_RippleScale` | 물결 반복 수 | 5 |
| `_RippleStrength` | 물결 세기 | 0.5 |

## 동작 단계
1. **깊이 차이**: `depthDelta` 를 깊이 범위로 나눈 값이다. 수면 대부분은 하얗고, 상자와 공이 물에 잠긴 부분이 비치는 자리만 수면과 닿은 선에서 검게 시작해 아래로 갈수록 밝아진다. 물 깊이는 어디서나 0.3 m 인데 화면 맨 앞은 조금 회색이다. 카메라 정면 축으로 잰 눈 깊이의 차이라서 가파르게 내려다보는 앞쪽은 얕게, 낮게 보는 먼 쪽은 깊게 나오기 때문이다.
2. **깊이 색**: 1단계 값으로 얕은 색과 깊은 색을 섞었다. 물에 잠긴 상자와 공 자리는 밝은 청록, 트인 물은 짙은 남색이고, 화면 맨 앞만 조금 밝다. 깊은 쪽 끝을 `1 - (1 - x)²` 로 눕혀 섞어서, 깊이 범위에 닿는 자리에 접힌 듯한 띠가 생기지 않는다. 화면에서는 알파를 빼고 보여 주지만 실제로는 얕을수록 투명해 최종 화면에서 잠긴 상자 면이 비친다.
3. **잔물결과 하늘빛**: 노이즈 두 장을 다른 방향으로 흘려 겹친 높이로 법선을 흔들고, 프레넬로 하늘빛을 섞었다. 비스듬히 보이는 먼 쪽일수록 하늘빛이 많이 비쳐 희끄무레하다. 공 앞에서 화면 아래로 이어지는 하얀 점들은 맞은편 낮은 해를 근사한 반짝임이다.
4. **거품 띠**: 물체와 닿은 곳에서 거품 폭까지, 노이즈가 경계값보다 큰 곳만 하얗다. 닿은 자리는 이어진 흰 선이고, 아래(카메라 쪽)로 갈수록 조각이 성글어진다. 띠는 자리마다 다른 때에 넓어졌다 좁아진다. 거품 끊김을 0 으로 내리면 고른 띠가 된다.

## 주의할 점
- URP Asset 이 품질 단계마다 따로 있으면 모두 켜야 한다. 수업 프로젝트의 모바일 XR 용과 2D 용 URP Asset 은 Depth Texture 가 꺼져 있어, PC 에서는 되던 물이 기기에서는 한 색으로 막히거나 엉뚱한 곳에 거품이 생긴다.
- 이 셰이더에는 `UniversalForward` 패스만 있어 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트용 효과다. 정사영 카메라에서는 `LinearEyeDepth` 공식이 맞지 않는다. 원근 카메라 기준이다.
- 흐름 방향은 메시 UV 기준이다. Unity 기본 Plane 은 위에서 볼 때 UV 가 180도 돌아 있어 u 는 −X, v 는 −Z 쪽으로 커진다. 그래서 첫 물결은 −X 쪽(카메라가 +Z 를 볼 때 화면 왼쪽)으로, 둘째 물결은 +X, +Z 쪽으로 흐른다. Quad 나 다른 메시에 쓰면 방향이 달라지고, 잔물결 법선을 누운 Plane 기준으로 기울이므로 세워 쓰면 반짝임이 맞지 않는다. 정점은 움직이지 않는다. 기본 Plane 은 정점 간격이 1 이라 정점으로 미는 파도는 각지므로, 파도가 필요하면 촘촘한 메시를 따로 만든다.
- 이 셰이더는 조명을 받지 않는다. 물빛은 밤이나 그늘에서도 같은 밝기로 남고, 하늘빛과 반짝임은 고정 색과 고정 방향으로 근사해 씬의 Directional Light 나 스카이박스를 바꿔도 따라 바뀌지 않는다.
- 투명 물체는 Renderer 경계 상자의 중심점 거리로 그리는 순서를 정한다. 큰 수면은 중심점 하나로 정렬되어, 카메라가 수면 중심 가까이 있으면 멀리 물 위에 뜬 반투명 파티클보다 나중에 그려져 파티클을 덮을 수 있다. 물 머티리얼의 Render Queue 를 2990 처럼 3000 보다 조금 낮춰 다른 투명 물체보다 먼저 그리게 한다 (URP Lit 이나 Shader Graph 머티리얼의 Sorting Priority 를 낮추는 것과 같다). 물속에 투명 물체가 있으면 그 물체도 더 낮춘다.
- 이 셰이더는 안개를 처리하지 않아 Fog 를 켠 넓은 호수의 먼 쪽이 안개에 묻히지 않는다. Forward 패스에 `#pragma multi_compile_fog` 를 넣고 정점에서 `ComputeFogFactor(positionCS.z)` 를 넘긴 뒤, 마지막 색에 `MixFog(color, fogFactor)` 를 건다.

## 흔한 실수
- **물속이 한 색으로 막히거나 엉뚱한 곳에 거품이 생긴다**: URP Asset 의 Depth Texture 가 꺼져 있으면 씬 깊이를 제대로 읽지 못한다. 증상은 렌더 경로(Unity 6.3 기본은 Render Graph)와 플랫폼에 따라 다르다. 빈 깊이가 읽히면 모든 곳이 깊은 물로 계산되어 물속이 한 색으로 막히고 거품이 사라지며, 다른 값이 읽히면 물체와 상관없는 곳에 거품이 생긴다. 사용 중인 URP Asset(Project Settings > Quality 에 연결된 것)에서 Depth Texture 를 켠다. 모바일용 URP Asset 은 기본으로 꺼져 있다.
- **카메라를 낮추면 열린 물이 탁해지고 물가의 거품 띠가 좁아진다**: `depthDelta` 는 수직 물 깊이가 아니라 카메라 정면 축으로 잰 눈 깊이의 차이다. 낮게 볼수록 시선이 물속을 길게 지나 같은 물도 깊게 나온다. 그래서 열린 물은 탁해지고, 바다 쪽에서 완만한 물가를 보면 거품 폭에 닿는 자리가 물가 쪽으로 당겨져 띠가 좁아진다. 해변에서 바다 쪽을 볼 때는 시선이 물가 경사와 나란해질수록 거품이 사라진다. 수직 벽 둘레만 월드 폭이 넓어지지만 화면에서는 앞뒤로 눌려 오히려 좁아 보인다. 각도와 상관없는 수직 깊이가 필요하면 깊이에서 씬 표면의 월드 위치를 복원해 수면 높이와의 차이(y)를 쓴다.
- **거품이 물체를 따라가지 않고 엉뚱한 곳에 생기며 카메라를 따라 바뀐다**: 깊이 텍스처를 `i.uv` 같은 메시 UV 로 읽으면 화면 위치와 맞지 않는다. 씬 깊이는 반드시 화면 좌표(`GetNormalizedScreenSpaceUV`)로 읽고, 두 깊이 모두 `LinearEyeDepth` 로 미터로 바꾼 뒤 뺀다.
- **물 아래 다른 투명 물체나 물 속 파티클 둘레에 거품이 없다**: 투명 물체는 깊이 텍스처에 들어가지 않는다. 거품은 불투명 물체와 만나는 곳에만 생긴다. 수면에 `ZWrite On` 을 켜면 오히려 수면 뒤 투명 물체가 가려지므로 `ZWrite Off` 로 둔다.
- **수면을 키우면 물결이 늘어나 굵어진다**: 물결과 거품 무늬는 메시 UV 기준이라 평면을 키우면 함께 커진다. 물결 반복 수를 평면 크기에 맞춰 올리거나, 넓은 물이면 UV 대신 월드 XZ 위치로 노이즈를 읽도록 바꾼다.

## 변형 예시
- 촘촘한 수면 메시에 Gerstner 파도 몇 개를 더해 수면이 실제로 오르내리게 하고 싶다.
- 카메라 각도와 상관없이 수직 물 깊이로 색과 거품을 정하고 싶다.
- 넓은 호수에서 물결이 늘어나지 않게 월드 위치로 노이즈를 읽고 싶다.
- Opaque Texture 를 켜고 물결 법선으로 물속을 굴절시켜 보이게 하고 싶다.
- 물 밑바닥에 일렁이는 빛 무늬(코스틱)를 얹고 싶다.
- 반짝임과 하늘빛이 씬의 주 광원과 스카이박스를 따르게 하고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 에서는 Scene Depth 노드(Eye 모드)에서 Screen Position(Raw)의 w 를 빼면 같은 `depthDelta` 가 나온다. 이 값을 깊이 범위로 나눠 Saturate 한 뒤 Lerp 로 두 색을 섞고 Alpha 에도 넣는다. Graph Settings 의 Surface Type 은 Transparent 로 둔다. `core.hlsl` 을 Custom Function 의 File 모드로 통째로 지정하면 `SgInput` 과 머티리얼 값 선언이 없어 컴파일되지 않는다. 하늘빛과 반짝임까지 옮기려면 `waterFoamSurface` 의 본문만 String 모드로 복사해 `void WaterFoamSurface_float(float3 Water, float3 Normal, float3 View, float Height, out float4 Out)` 형식으로 감싸고, `#define` 값은 숫자로 바꿔 넣는다.
