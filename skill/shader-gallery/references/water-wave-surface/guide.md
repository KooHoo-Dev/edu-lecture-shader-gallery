# 물결 수면 (Water Wave Surface)

사인파를 더해 수면을 출렁이게 하고 하늘빛을 비춘다

무대 종류: 메시. 난이도 1/3. 기법: 정점 변형, 사인파, 법선 계산, 프레넬, 알파 혼합.

## 파일
- `WaterWaveSurface.shader`
- `core.hlsl`
- `WaterSurfaceGrid.cs`

모두 프로젝트의 `Assets/Shaders/water-wave-surface/` 에 복사한다.

## 넣는 순서
1. `WaterWaveSurface.shader`, `core.hlsl`, `WaterSurfaceGrid.cs` 를 `Assets/Shaders/water-wave-surface/` 에 둔다.
2. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.
3. GameObject > Create Empty 로 빈 GameObject 를 만들고 Add Component 로 `WaterSurfaceGrid` 를 붙인다. MeshFilter 와 MeshRenderer 가 함께 붙고 한 변 10 m, 100 칸(정점 간격 0.1 m)인 평면이 생긴다. MeshRenderer 의 Materials 에 머티리얼을 넣는다.
4. 넓은 물은 Scale 을 키우지 말고 `WaterSurfaceGrid` 의 Size 와 Cells 를 함께 키운다 (Cells 는 254 까지). ProBuilder 의 Plane 이나 DCC 툴에서 만든 촘촘한 평면을 써도 된다. Unity 기본 Plane 을 쓰면 파장을 4 m 이상으로 올린다.
5. Directional Light 를 카메라 맞은편 낮은 곳으로 돌린다 (카메라가 +Z 를 보면 Rotation 15, 180, 0 쯤). 화면 가운데 아래로 해 반짝임 길이 생긴다. 수면 아래에 바닥이나 지형을 두면 앞쪽 물이 비쳐 보인다.
6. Scene 뷰에서 파도가 멈춰 있으면 Scene 뷰 툴바의 Effects 메뉴에서 Always Refresh 를 켠다.

## 확인
Play 하면 수면이 여러 방향의 물결로 출렁이고, 화면 아래쪽 가까운 물은 바닥이 비치는 짙은 물빛, 마루 뒷면과 먼 쪽은 하늘빛으로 보이며, 해가 카메라 맞은편 낮은 곳에 있으면 화면 가운데 아래로 해 반짝임 길이 생기고 Directional Light 를 돌리면 따라 움직인다. 파도 높이를 0 으로 내리면 평평한 판이 되고 윤곽도 멈춘다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_WaveHeight` | 파도 높이 | 0.04 |
| `_WaveLength` | 파장 | 2.2 |
| `_WaveSpeed` | 파도 속도 | 0.8 |
| `_WaveAngle` | 파도 방향 | 225 |
| `_DeepColor` | 물빛 | #042A45 |
| `_SkyColor` | 하늘빛 | #70A4CC |
| `_SpecStrength` | 반사광 세기 | 1.2 |
| `_SpecPower` | 반사광 날카로움 | 200 |

## 동작 단계
1. **파도 높이**: 방향과 파장이 다른 사인파 세 개를 더한 높이를 회색으로 본다. 흰 곳이 마루, 검은 곳이 골이다. 한 방향 파도였다면 곧은 줄무늬였겠지만, 세 파도가 엇갈려 둥근 언덕과 움푹한 골이 고르지 않게 흩어져 있다. 정점도 이 높이만큼 위아래로 밀려, 먼 쪽 수면의 윤곽이 같은 모양으로 출렁인다.
2. **파도 법선**: 높이 식을 x, z 로 미분한 기울기로 `(-dh/dx, 1, -dh/dz)` 를 만들어 정규화한 법선을 색으로 본다 (R 은 x, G 는 위, B 는 z). 법선은 대부분 위를 향해 전체가 연두색이고, 비탈마다 노란빛(화면 오른쪽 +X 로 기움)이나 하늘빛(먼 쪽 +Z 로 기움)이 살짝 돈다. 기본 파도는 낮고 완만해 색 차이가 작다. 파도 높이를 올리면 또렷해진다. 이 법선을 픽셀마다 다시 구하므로 음영이 정점 사이에서도 매끈하다.
3. **프레넬**: 법선과 시선으로 구한 프레넬(하늘이 비치는 정도)을 회색으로 본다. 카메라 반대쪽으로 기운 마루 뒷면은 수면을 스치듯 보게 되어 가는 흰 줄로 빛나고, 먼 쪽일수록 전체가 밝아진다. 화면 아래쪽 가까운 물은 수면을 내려다보아 짙은 회색이다. 최종 화면은 이 값으로 물빛과 하늘빛을 섞고 알파도 정한다. 그래서 짙은 앞쪽은 반투명해 바닥의 체커 무늬가 어둡게 비치고, 밝은 먼 쪽은 하늘빛으로 덮인다.
4. **반사광**: 씬의 주 광원으로 구한 Blinn-Phong 반사광이다. 이 무대는 해가 카메라 맞은편 낮은 곳에 있어, 수면에 비친 해가 화면 가운데 아래로 세로로 긴 반짝임 길을 만든다. 물결 면마다 기울기가 달라 해를 카메라 쪽으로 되돌려 보내는 면만 밝으므로 길이 여러 조각으로 끊어지고 나머지는 검다. 날카로움을 낮추면 조각이 번져 넓은 흰 막이 되고, 높이면 조각이 더 작아진다. 이 빛을 3단계로 섞은 색에 더하면 최종 화면이고, 물체와 만나는 곳의 거품과 얕은 물빛은 [깊이 기반 물가 거품](#/s/water-depth-foam) 이 이어받는다.

## 주의할 점
- 이 셰이더는 3D 투명 메시용이다. 패스가 `UniversalForward` 하나라 2D Renderer 에서는 그려지지 않는다. 투명 물체라 그림자를 드리우지 않고 깊이 텍스처에도 들어가지 않는다.
- 정점을 미는 파도라 메시가 촘촘해야 한다. 기본값은 100 칸 격자 기준이다. 기본 Plane 이면 파장을 4 m 이상으로 둔다 (정점 간격이 1 m 라 짧은 파도의 윤곽이 꺾인 선이 된다). 음영은 픽셀마다 법선을 다시 구해 매끈하다. 정점이 많을수록 비용이 크므로 XR 과 모바일에서는 칸 수를 아낀다. 셰이더가 민 정점은 경계 상자에 들어가지 않아 화면 가장자리의 마루가 갑자기 사라질 수 있다. `WaterSurfaceGrid` 는 Bounds Padding(기본 0.5 m)만큼 위아래로 늘려 두었고, 다른 메시를 쓰면 `Mesh.bounds` 를 파도 높이만큼 늘린다.
- `ZWrite Off` 라 한 메시 안에서는 삼각형을 그리는 순서가 곧 앞뒤다. `WaterSurfaceGrid` 와 기본 Plane 은 +Z 쪽 행부터 그려 -Z 쪽에서 보면 맞지만, 반대편(+Z)에서 보거나 평면을 Y 로 180도 돌리면 뒤쪽 물결이 앞 마루 위에 그려진다. 파도를 낮추거나 패스를 `ZWrite On` 으로 바꾼다 (그러면 수면 아래의 다른 투명 물체가 가려진다).
- 파도는 오브젝트 공간 위치로 계산한다. 평면을 키우면 파도도 함께 커지고, 평면을 Y 로 돌리면 파도 방향도 함께 돈다 (래퍼가 법선을 월드로 바꿔 조명은 맞는다). Batching Static 을 켠 물체는 정점이 월드 좌표로 합쳐져 `positionOS` 가 월드 위치가 되므로 파도 크기와 방향이 바뀐다. 수면은 Batching Static 을 끈다.
- 주 광원은 `GetMainLight(shadowCoord, positionWS, shadowMask)` 로 받아 그림자 거리 페이드를 따르지만 `distanceAttenuation` 을 곱하지 않아 광원의 Culling Mask 와 Rendering Layers 는 무시된다.
- 이 셰이더는 안개를 처리하지 않아 Fog 를 켠 씬에서 먼 수면이 안개에 묻히지 않는다. 패스에 `#pragma multi_compile_fog` 를 넣고 정점에서 `ComputeFogFactor(positionCS.z)` 를 넘긴 뒤, 마지막 색에 `MixFog(color, fogFactor)` 를 건다.

## 흔한 실수
- **수면은 출렁이는데 빛과 하늘빛은 평평한 판처럼 고르다**: 정점의 높이만 바꾸고 법선은 메시의 원래 법선(위쪽)을 그대로 쓰면 프레넬과 반사광이 물결을 모른다. 높이 식 `A sin(k (D · xz) - 위상)` 을 x, z 로 미분한 `A k cos(...) D` 로 기울기를 구하고 `normalize(float3(-dh/dx, 1, -dh/dz))` 를 법선으로 쓴다. 정점 단계에서는 위치만 돌려주므로 픽셀 단계에서 위치의 xz 로 같은 식을 다시 계산한다.
- **Unity 에서 파도 윤곽이 각지고 지그재그로 꺾인다**: 정점을 미는 파도는 메시의 정점 간격이 윤곽을 정한다. 기본값은 100 칸 격자(한 변 10 m, 정점 간격 0.1 m) 기준이다. 기본 Plane 이면 파장을 4 m 이상으로 올린다. 기본 Plane 은 10 칸이라 정점 간격이 1 m 이고, 가장 짧은 셋째 파도(첫 파장의 0.58 배)가 정점 간격의 4 배보다 짧으면 마루와 골 사이에 정점이 한두 개뿐이라 윤곽이 꺾인 선이 된다. 음영은 픽셀마다 다시 구해 매끈하지만 실루엣은 정점이 정한다. 짧은 물결을 쓰려면 기본 Plane 대신 함께 든 `WaterSurfaceGrid` 컴포넌트로 촘촘한 평면을 만든다.
- **평면을 키웠더니 파도도 함께 커지고, 이어 붙인 평면 경계에서 파도가 끊긴다**: 파도를 오브젝트 공간 위치로 계산하기 때문이다. Scale 을 3 배로 하면 파장과 높이도 3 배가 된다. 넓은 물은 Scale 대신 `WaterSurfaceGrid` 의 Size 와 Cells 를 함께 키운다. 평면을 이어 붙여야 하면 월드 공간으로 바꾼다. 래퍼의 `vert` 에서 `TransformObjectToWorld` 로 월드 위치를 먼저 구하고, 그 xz 로 `waveSum` 의 높이를 구해 월드 y 에 더한 뒤 화면 위치를 구한다 (`sgVertex` 는 부르지 않는다). 픽셀 단계도 `SgInput` 에 `positionWS` 를 넣어 `waveSum(i.positionWS.xz, i.time)` 으로 바꾸고, 이때 나온 법선은 이미 월드 방향이므로 `WAVE_NORMAL_TO_WORLD` 를 빼야 법선이 물결 모양과 맞는다. 그러면 이어 붙인 평면끼리 경계가 맞는다.
- **해 반짝임이 보이지 않는다**: Blinn-Phong 반사광은 법선이 광원 방향과 시선 방향의 가운데(하프 벡터)와 거의 같을 때만 생긴다. 해 반짝임은 수면에 비친 해가 보이는 곳, 곧 해가 카메라 맞은편에 있을 때 화면 가운데 아래로 생긴다. 해가 카메라 뒤 위쪽에 있으면 하프 벡터가 카메라 쪽으로 누워 카메라 쪽으로 크게 기운 물결 면에만 반사광이 생기고, 기본 날카로움 200 에서는 거의 사라진다. Directional Light 를 카메라 맞은편 낮은 곳(높이 10~30도)으로 돌린다. 해를 옮길 수 없으면 날카로움을 20 쯤으로 낮춰 넓게 번지게 한다. 이 셰이더는 씬의 주 광원을 따르므로 해를 돌리면 반짝임 자리도 따라 움직이고, 그늘진 물에는 반짝임이 없다.
- **실행 중에 파도 속도나 파장을 바꾸면 물결이 한 번에 튄다**: 위상을 `시간 * 속도 / 파장` 으로 만들기 때문에 속도나 파장을 바꾸면 그동안 흐른 시간 전체에 변화량이 곱해져 마루 자리가 한 번에 건너뛴다. 연출로 바꾸려면 C# 에서 파도마다 `Time.deltaTime * 속도 / 파장` 을 쌓아 `Mathf.Repeat(값, 1)` 로 감싸 머티리얼 값으로 넘기고, 셰이더는 `frac(time * speed / lambda)` 대신 그 값을 쓴다. 세 파도는 속도와 파장의 비율이 서로 달라 쌓는 값도 파도마다 따로 둔다.

## 변형 예시
- 수업 XR 01 Lake Shader 처럼 잔물결 법선맵 두 장을 서로 다른 방향으로 흘려, 큰 파도 법선 위에 잔물결을 더하고 싶다.
- 사인파 대신 Gerstner 파도로 마루를 뾰족하게 하고 싶다.
- 넓은 바다에서 평면을 이어 붙여도 파도가 맞도록 월드 위치로 파도를 계산하고 싶다.
- 수면에 하늘 대신 스카이박스나 반사 프로브를 비추고 싶다.
- 물가에 거품 띠를 더하고 싶다.
- Fog 를 켠 넓은 바다에서 먼 수면이 안개에 묻히게 하고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 로 옮기면 Unlit 그래프로 만든다 (Lit 이면 프레넬과 Blinn-Phong 대신 URP 의 PBR 조명이 그려 이 표본과 다른 물이 된다). Graph Settings 의 Surface Type 을 Transparent 로 둔다. Custom Function 노드를 String 모드로 만들어 `waveOne` 과 `waveSum` 의 본문을 옮기고 `void WaterWave_float(float2 XZ, float Time, float WaveHeight, float WaveLength, float WaveSpeed, float WaveAngle, out float Height, out float3 NormalOS)` 로 감싼다. 머티리얼 값은 Blackboard 속성을 입력에 잇는다. Position 노드(Object)의 xz 와 Time 노드를 넣고, Height 를 Position 의 y 에 더해 Vertex 의 Position 에 넣는다. Unlit 은 Fragment 에 Normal 칸이 없으므로, Fragment 쪽에서 같은 노드를 한 번 더 써서 NormalOS 를 Transform 노드(Object 에서 World, Normal)로 바꾸고, 해 방향과 색은 `void MainLight_float(out float3 Direction, out float3 Color)` 처럼 `GetMainLight()` 를 부르는 Custom Function 으로 받는다 (`#ifdef SHADERGRAPH_PREVIEW` 일 때는 고정 값을 넣는다. 그림자 키워드를 따로 넣지 않으면 그림자는 받지 않는다). 이 법선과 View Direction 노드로 프레넬과 Blinn-Phong 을 계산해 Base Color 와 Alpha 에 넣는다. `core.hlsl` 을 File 모드로 통째로 지정하면 `SgInput` 과 머티리얼 값 선언이 없어 컴파일되지 않는다.
