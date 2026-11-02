# 역장 교차 (Force Field Intersection)

투명한 보호막이 다른 물체와 닿는 선을 깊이 비교로 밝힌다

무대 종류: 깊이 사용. 난이도 3/3. 기법: 깊이 텍스처, 프레넬, 더하기 혼합, 절차 무늬.

## 파일
- `ForceFieldIntersection.shader`
- `core.hlsl`
- `ForceFieldPulse.cs`

모두 프로젝트의 `Assets/Shaders/force-field-intersection/` 에 복사한다.

## URP 설정
사용 중인 URP Asset 에서 켠다: Depth Texture.

## 넣는 순서
1. `ForceFieldIntersection.shader`, `core.hlsl`, `ForceFieldPulse.cs` 를 `Assets/Shaders/force-field-intersection/` 에 둔다.
2. 사용 중인 URP Asset(Project Settings > Quality 에 연결된 것)의 Depth Texture 를 켠다.
3. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고 구 메시에 넣는다.
4. 바닥이나 다른 물체와 겹치게 배치한다. 충돌 연출이 필요하면 `ForceFieldPulse` 를 붙이고 `Pulse()` 를 호출한다.

## 확인
구를 바닥에 반쯤 묻으면 닿은 둘레에 밝은 띠가 생기고, 구를 움직이면 띠가 따라간다. Scene 뷰가 아니라 Game 뷰에서 확인한다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_FieldColor` | 역장 색 | #40A6FF |
| `_FresnelPower` | 테두리 좁히기 | 3 |
| `_PatternScale` | 무늬 크기 | 12 |
| `_PatternStrength` | 무늬 밝기 | 0.3 |
| `_ContactWidth` | 교차선 폭 | 0.2 |
| `_ContactGlow` | 교차선 밝기 | 3 |
| `_HitPulse` | 맥동 | 0 |

## 동작 단계
1. **프레넬**: 표면이 시선과 비스듬할수록 밝다. 구의 윤곽이 드러나고 가운데는 비어 보인다.
2. **무늬**: 자이로이드 곡면의 값이 0 에 가까운 곳을 선으로 쓴다. 텍스처 없이 삼각함수만 쓰고 이음매가 없다.
3. **교차선**: 씬 표면까지의 거리(`depthDelta`)가 작을수록 밝다. 바닥과 상자에 닿은 자리에 띠가 생긴다. 이 표본의 핵심이다.
4. **맥동**: 충돌 지점에서 고리가 퍼진다. 충돌 버튼을 누르고 슬로모션으로 보면 잘 보인다.

## 주의할 점
- URP Asset 이 품질 단계마다 따로 있으면 모두 켜야 한다. 수업 프로젝트의 모바일용과 2D용 URP Asset 은 꺼져 있다.
- 투명 물체는 깊이 텍스처에 들어가지 않는다. 다른 투명 물체와 닿는 선은 생기지 않는다.
- 이 셰이더에는 `UniversalForward` 패스만 있어 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트용 효과다.
- 정사영 카메라에서는 `LinearEyeDepth` 공식이 맞지 않는다. 원근 카메라 기준이다.

## 흔한 실수
- **화면 전체가 빛나거나 교차선이 없다**: URP Asset 의 Depth Texture 가 꺼져 있으면 씬 깊이를 읽지 못한다. 모바일용 URP Asset 은 기본으로 꺼져 있어 PC 에서만 되는 경우가 많다.
- **멀어질수록 교차선 폭이 달라 보인다**: `LinearEyeDepth` 없이 깊이 버퍼 값을 그대로 빼면 깊이가 비선형이라 거리마다 폭이 달라진다. 두 값을 모두 카메라 거리로 바꿔 뺀다.
- **물체 뒤가 보이지 않는다**: `ZWrite On` 이면 막이 깊이를 차지해 뒤쪽 투명 물체가 사라진다. 투명 막은 `ZWrite Off` 로 둔다.
- **번쩍임이 눈을 찌른다**: 넓은 면이 빠르게 반복해 번쩍이면 광과민 발작 위험이 있다. 맥동은 초당 3회 이하로 제한한다. `ForceFieldPulse` 의 `minInterval` 이 그 역할이다.

## 변형 예시
- 충돌 지점을 스크립트에서 넘겨 그 자리에서 고리가 퍼지게 하고 싶다.
- 체력이 줄면 색이 붉어지고 무늬가 흐트러지게 하고 싶다.
- 무늬를 육각형으로 바꾸고 싶다.
- 바닥에 깔리는 안개 벽으로 바꾸고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 에서는 Scene Depth 노드(Eye 모드)에서 Screen Position 의 w 를 빼면 같은 `depthDelta` 가 나온다. 무늬는 새 `.hlsl` 파일에 `forceFieldLines` 를 복사하고 `void ForceFieldLines_float(float3 Position, float Time, out float Lines) { Lines = forceFieldLines(Position, Time); }` 를 더해 Custom Function 노드의 File 모드로 부른다 (`core.hlsl` 을 File 모드로 통째로 지정하면 `SgInput` 과 머티리얼 값 선언이 없어 컴파일되지 않는다).
