# 젖음과 눈 쌓임 (Surface Wetness and Snow)

윗면에 젖은 느낌이나 눈을 얹는다

무대 종류: 메시. 난이도 2/3. 기법: 월드 법선, 노이즈, 마스크, 블린-퐁 하이라이트, 텍스처.

## 파일
- `SurfaceWetSnow.shader`
- `core.hlsl`
- `SurfaceWeatherController.cs`
- `SurfaceWetSnowStone.png`

모두 프로젝트의 `Assets/Shaders/surface-wet-snow/` 에 복사한다.

## 넣는 순서
1. `SurfaceWetSnow.shader`, `core.hlsl`, `SurfaceWeatherController.cs`, `SurfaceWetSnowStone.png` 를 `Assets/Shaders/surface-wet-snow/` 에 둔다.
2. Project 창에서 `SurfaceWetSnowStone.png` 를 고르고 Inspector 에서 Texture Type 은 Default, sRGB (Color Texture) 는 켜고, Wrap Mode 는 Repeat, Filter Mode 는 Bilinear 로 맞춘 뒤 Apply 를 누른다.
3. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고, 바탕 텍스처 칸에 `SurfaceWetSnowStone.png`(또는 쓰려는 돌, 벽돌 텍스처)를 넣는다.
4. 머티리얼을 바위, 벽, 계단 같은 MeshRenderer 에 넣고 모드(Wet, Snow)와 덮는 양을 정한다. 텍스처 반복 U, V 는 메시에 맞춘다 (구 6, 3, 큐브 2, 2, Plane 20, 20). 벽돌이 한쪽으로 늘어나 보이면 이 비율이 맞지 않은 것이다.
5. 날씨 연출이 필요하면 물체에 `SurfaceWeatherController` 를 붙인다. 비나 눈이 내리기 시작하고 그칠 때 `SetCoverage(목표 양, 초)` 로 덮는 양을 천천히 옮기고, 잠깐 몰아치는 소나기·눈발은 `Storm()` 으로 그 위에 더한다. 여러 물체를 함께 바꾸려면 머티리얼 칸에 공유 머티리얼 에셋을 넣는다.

## 확인
덮는 양을 0 에서 1 로 올리면 물체 꼭대기부터 눈(또는 젖은 어두운 면)이 아래로 번지고, 물체를 Rotation X 로 90도 눕혀도 덮인 자리는 계속 위쪽에 남는다. 모드를 Wet 으로 바꾸면 덮인 곳이 어두워지고 좁은 하이라이트가 맺힌다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_Mode` | 모드 | 눈 |
| `_Coverage` | 덮는 양 | 0.5 |
| `_Softness` | 경계 부드러움 | 0.08 |
| `_NoiseScale` | 노이즈 크기 | 6 |
| `_WetDarkness` | 젖음 어둡기 | 0.8 |
| `_Gloss` | 광택 | 0.7 |
| `_SnowColor` | 눈 색 | #CDD6E4 |
| `_Storm` | 소나기·눈발 | 0 |
| `_TilingU` | 텍스처 반복 U | 6 |
| `_TilingV` | 텍스처 반복 V | 3 |

## 동작 단계
1. **윗면 마스크**: 월드 법선의 `y` 는 위를 보면 1, 옆이면 0, 아래를 보면 -1 이다. 이 값을 덮는 양으로 정한 높이에서 `smoothstep` 으로 잘랐다. 흰 곳이 덮일 자리, 검은 곳이 마른 자리다. 기본값에서는 공의 가운데 높이를 경계로 위가 희고 아래가 검으며, 사이에 경계 부드러움만큼 좁은 회색 띠가 있다. 공이 돌아도 흰 부분은 늘 위에 있다. 이대로 쓰면 경계가 자로 그은 듯 반듯하다.
2. **노이즈로 깬 마스크**: 오브젝트 공간 위치로 만든 3D 노이즈를 법선 `y` 에 더한 뒤 같은 높이에서 잘랐다. 경계가 들쭉날쭉해져 흰 덩어리가 아래로 흘러내리고 검은 구멍이 위로 파고든다. 노이즈 크기를 키우면 가장자리가 잘게 부서지고, 줄이면 크게 굽이친다. 노이즈는 물체에 붙어 있어 공이 돌면 덩어리 모양도 함께 돈다.
3. **덮는 재질**: 마스크 없이 표면 전체에 덮는 재질을 씌운 모습이다. 눈 모드는 눈 색에 조명을 곱해 위는 밝고 아래로 갈수록 푸른 회색으로 어두워지며, 빛을 받는 쪽에 흰 점들이 반짝인다. 점마다 작은 칸의 법선을 조금씩 틀어 하이라이트를 따로 계산한 것이다. 젖음 모드로 바꾸면 돌이 진하고 어두워지고, 빛 쪽에 작고 강한 하이라이트가 맺히며 가장자리에 주변 빛이 희미하게 비친다. 래퍼가 URP Lit 이 아니므로 하이라이트는 `lightDirWS`, `viewWS`, `normalWS`, `lightColor` 로 블린-퐁을 직접 계산한다. 최종 화면은 2단계 마스크로 마른 돌과 이 재질을 섞은 것이다. 2단계에서 흰 곳이 이 모습이 되고, 검은 곳은 원래 돌로 남는다.

## 주의할 점
- 이 셰이더는 불투명 3D 메시용이다. 패스가 `UniversalForwardOnly` 라 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트에서 쓴다.
- 조명은 래퍼가 계산한 주 광원 하나와 환경광(SH)만 쓴다. 추가 광원(점광원, 스포트), 반사 프로브, 안개는 받지 않는다. 주 광원의 distanceAttenuation 을 곱하지 않으므로 광원의 Culling Mask 와 Rendering Layers 가 무시되어, 레이어로 빛을 뺀 물체도 주 광원을 받는다. 넓은 야외 씬에서 Fog 를 켰다면 먼 바위가 안개 없이 또렷하게 남으므로 `#pragma multi_compile_fog`, 정점의 `ComputeFogFactor`, 프래그먼트의 `MixFog` 를 더한다.
- 바탕 텍스처는 메시 UV 로 읽는다. 반복 횟수의 기본값(6, 3)은 구에 맞춘 것이라 큐브나 Plane 에서는 텍스처 반복 U, V 를 다시 맞춰야 벽돌이 늘어나지 않는다. 머티리얼의 Tiling, Offset 칸은 쓰지 않는다. 기본 구는 극점에서 무늬가 모이고, UV 가 엉망인 메시는 무늬가 늘어난다. 지형이나 절벽에는 [삼평면 투영](#/s/triplanar-projection)으로 바탕을 읽는 것을 고려한다.
- 노이즈와 반짝임은 `positionOS`(오브젝트 공간 위치)로 만든다. Static 으로 표시해 정적 배칭되면 정점이 월드 위치로 구워져 무늬가 달라진다. Transform 의 Scale 을 키운 물체는 노이즈 덩어리도 함께 커지므로 노이즈 크기를 올린다. 반대로 메시 자체의 좌표가 큰 모델(정점이 수십 단위에 걸친 바위 등)은 같은 화면 크기에 칸이 많이 들어가 노이즈와 반짝임이 잘아지므로 노이즈 크기를 내리고, 반짝임은 `core.hlsl` 의 `SURFACE_GLINT_CELLS` 를 줄인다.
- 눈 반짝임은 작은 칸마다 법선을 흔들어 만든다. 화면에서 멀리 있거나 작게 보이면 알갱이가 픽셀보다 작아져 지글거린다. 먼 물체는 광택을 낮춘다.
- 모바일 XR 에서는 3D 노이즈 3옥타브가 픽셀마다 돈다. 넓은 면에 쓸 때는 노이즈를 텍스처로 구워 읽는 쪽이 가볍다.

## 흔한 실수
- **물체를 돌리면 눈이 옆면과 아래로 돌아간다**: 마스크를 `normalOS.y`(오브젝트 공간 법선)로 만들면 마스크가 물체에 붙는다. 물체를 기울이거나 굴리면 덮인 자리가 함께 돌아 옆면과 바닥에 눈이 생긴다. Blender 처럼 Z 가 위인 도구에서 만든 모델을 축 변환을 굽지 않고(Bake Axis Conversion 끔) 들여오면 Transform 의 X -90 회전으로 세워지므로, 가만히 있어도 옆면이 덮인다. 하늘 방향은 월드 기준이므로 `TransformObjectToWorldNormal` 로 바꾼 `normalWS.y` 를 쓴다.
- **경계가 자로 그은 듯 매끈한 원이다**: 법선 `y` 만으로 자르면 등고선처럼 반듯한 선이 나온다. 위치로 만든 노이즈를 마스크 값에 더해 경계를 흔든다. 값 노이즈는 0.5 근처에 몰리므로 `saturate((n - 0.2) / 0.6)` 처럼 넓히고 0.5 를 빼서 위아래로 고르게 흔든다.
- **젖었는데 그냥 어두운 얼룩처럼 보인다**: 알베도만 어둡게 하면 때가 묻은 것처럼 보인다. 물막은 매끈해서 하이라이트가 좁고 강하게 맺힌다. 블린-퐁 지수를 크게(이 표본은 32~1024) 올리고 세기도 함께 키운다. URP Lit 에 넣는다면 Smoothness 를 올린다.
- **양을 0 으로 내려도 꼭대기가 조금 덮여 있다**: 경계 위치를 `1 - 2 * 양` 처럼 -1~1 로만 옮기면, 노이즈와 부드러움 폭만큼 넘친 부분이 양 끝에서 남는다. 이 표본은 경계를 1.35+폭에서 -1.35-폭까지 옮겨 0 과 1 에서 확실히 비고 차게 했다.
- **여러 바위가 함께 젖지 않거나, Play 를 멈춰도 젖은 채 남는다**: `renderer.material` 은 그 물체 전용 복사본이라 다른 바위는 그대로다. 씬 전체를 함께 적시려면 `SurfaceWeatherController` 의 머티리얼 칸에 공유 머티리얼 에셋을 넣는다. 에셋을 직접 고치면 에디터 Play 중 바꾼 값이 파일에 저장되므로 `OnDisable` 에서 원래 값으로 되돌린다. 머티리얼이 여러 개라면 `_Storm` 을 전역 값으로 바꾸고 `Shader.SetGlobalFloat` 를 쓰는 방법도 있다. 이때 `_Storm` 을 CBUFFER 뿐 아니라 Properties 에서도 빼야 한다. Properties 에 남아 있으면 머티리얼에 저장된 값이 전역 값을 덮어써 아무 변화가 없다.

## 변형 예시
- 비가 그치면 해가 드는 쪽부터 먼저 마르게 하고 싶다.
- 움푹한 곳에만 물웅덩이가 고이게 하고 싶다.
- 눈이 쌓일 때 정점을 위로 밀어 두께가 생기게 하고 싶다.
- URP Lit 처럼 노멀맵과 추가 광원도 받게 하고 싶다.
- 바탕 텍스처를 삼평면 투영으로 읽어 지형 절벽에 쓰고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 에서는 Normal Vector 노드(Space: World)의 Y 를 Split 으로 꺼내 윗면 마스크를 만들고, Simple Noise 노드를 더한 뒤 Smoothstep 으로 자른다. 그 마스크로 Base Color 를 눈 색과 섞거나, 젖음이면 Base Color 를 어둡게 하고 Smoothness 를 올린다. 이때는 URP Lit 그래프가 하이라이트를 계산하므로 `core.hlsl` 의 블린-퐁 부분은 필요 없다. `core.hlsl` 을 Custom Function 에 그대로 지정하지 않는다. `SgInput`, `SG_TEX`, 머티리얼 값이 `.shader` 래퍼에만 있어 컴파일되지 않는다. 노이즈만 쓰려면 `surfaceHash`, `surfaceValueNoise`, `surfaceNoise` 를 새 파일에 복사해 `void SurfaceNoise_float(float3 P, out float N)` 로 감싼다.
