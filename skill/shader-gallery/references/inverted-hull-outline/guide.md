# 껍데기 외곽선 (Inverted Hull Outline)

조금 키운 껍데기의 뒷면을 한 번 더 그려 외곽선을 만든다

무대 종류: 메시. 난이도 2/3. 기법: 멀티 패스, Cull Front, 정점 변형, 외곽선, 선택 표시.

## 파일
- `InvertedHullOutline.shader`
- `core.hlsl`
- `HullOutlineSelection.cs`

모두 프로젝트의 `Assets/Shaders/inverted-hull-outline/` 에 복사한다.

## 넣는 순서
1. `InvertedHullOutline.shader`, `core.hlsl`, `HullOutlineSelection.cs` 를 `Assets/Shaders/inverted-hull-outline/` 에 둔다.
2. Project 창에서 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.
3. 머티리얼을 대상 MeshRenderer 에 넣는다. Inspector 에서 외곽선 두께와 색을 맞춘다. 미는 방식은 큐브처럼 피벗이 가운데인 각진 볼록 메시면 ScaleFromPivot(기본), 구나 캐릭터처럼 부드러운 메시면 Normal 로 둔다.
4. 선택 표시에 쓸 때는 같은 오브젝트에 `HullOutlineSelection` 을 붙인다. 고를 때 `Select()`, 놓을 때 `Deselect()` 를 호출한다. 인자가 없어 Inspector 의 UnityEvent(예: XR Simple Interactable 의 Hover Entered, Hover Exited)에 바로 연결할 수 있다.

## 확인
외곽선 두께를 올리면 물체 둘레의 선이 굵어지고 0 으로 내리면 사라진다. 큐브에서 미는 방식을 Normal 로 바꾸면 모서리마다 선이 끊긴다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_OutlineWidth` | 외곽선 두께 | 0.04 |
| `_OutlineColor` | 외곽선 색 | #FFC94D |
| `_OutlineAmount` | 외곽선 켜기 | 1 |
| `_PushDir` | 미는 방식 | 피벗 기준 확대 |
| `_BaseColor` | 기본 색 | #4F86C6 |

## 동작 단계
1. **숨은 껍데기**: 본체는 기본 색에 조명을 곱한 음영이다. 이 단계에서는 껍데기도 같은 식으로 칠해 외곽선 색을 감췄다. 윤곽 둘레에 본체와 같은 색이지만 면과 밝기가 다른 띠가 붙어 실루엣이 살짝 부푼 것이 보인다. 그 띠가 본체 뒤에서 삐져나온 껍데기의 뒷면이다.
2. **앞면까지 그리면**: 키운 껍데기를 앞면까지 그리면 껍데기가 본체보다 카메라에 가까워 본체를 통째로 덮는다. 외곽선 색 덩어리만 남는다. 외곽선 패스에 `Cull Front` 를 넣는 이유다. 최종 화면에서는 외곽선 패스가 껍데기의 앞면을 버리고 뒷면만 그린다. 뒷면은 본체 뒤에 있어 대부분 가려지고, 윤곽 바깥으로 삐져나온 띠만 남아 외곽선이 된다. `_OutlineWidth` 가 그 띠의 폭이다.

## 주의할 점
- 이 셰이더는 불투명 3D 메시용이다. 2D Renderer 는 `Universal2D` 와 `SRPDefaultUnlit` 태그만 그리므로 본체 패스(`UniversalForwardOnly`)는 빠지고 외곽선 패스(`SRPDefaultUnlit`)만 그려져, 화면에 외곽선 색 덩어리만 보인다. 3D 프로젝트(Universal Renderer)에서 쓴다.
- 물체를 두 번 그리므로 외곽선을 켠 물체마다 그리기 호출이 하나씩 늘어난다. `HullOutlineSelection` 은 외곽선이 꺼진 동안 `SetShaderPassEnabled` 로 외곽선 패스를 건너뛴다. 이 스크립트는 `renderer.material`(Materials 목록의 첫 머티리얼)만 고치므로, 외곽선을 두 번째 머티리얼로 덧붙이는 방식과 함께 쓰면 외곽선이 켜지지 않는다. 장면의 모든 물체에 상시 외곽선이 필요하면 깊이와 법선으로 화면에서 한 번에 그리는 후처리 방식과 비교한다.
- 미는 방식 ScaleFromPivot 은 메시를 피벗 기준으로 키우므로 두께가 피벗에서의 거리에 비례한다. 피벗이 발밑이면 발 쪽은 선이 거의 없고 머리 쪽만 두꺼워진다. 판자처럼 납작한 메시는 두께 방향으로 거의 커지지 않아 넓은 면 쪽 선이 거의 0 이 되고, 오목한 곳은 껍데기가 안쪽으로 밀려 선이 사라진다. 이런 메시는 Normal 로 두고 부드러운 법선을 굽는다.
- 평면(Quad, Plane)처럼 뒤가 비어 있는 메시는 껍데기의 뒷면이 앞을 향해 외곽선이 면 전체를 덮거나 비어 보인다. 닫힌 메시에 쓴다.
- 외곽선 색은 조명과 그림자를 받지 않는 단색이다. 외곽선은 그림자를 드리우지 않고 노멀 텍스처(`_CameraNormalsTexture`)에도 들어가지 않는다. 깊이 텍스처는 만드는 방식에 따라 다르다. 깊이 프리패스로 만들면 외곽선 패스가 프리패스에 없어 빠지고, 불투명을 그린 뒤 깊이를 복사하면 껍데기 깊이도 함께 들어간다. 깊이를 읽는 다른 효과가 외곽선을 물체로 볼 수 있다.
- 정적 배칭: Batching Static 을 켠 물체는 플레이와 빌드에서 정점이 월드 좌표로 합쳐져 셰이더의 `positionOS` 가 월드 위치가 된다. ScaleFromPivot 의 확대 기준이 물체의 피벗이 아니라 월드 원점이 되어, 껍데기가 원점 반대쪽으로 밀리고 선이 한쪽으로 쏠린다. 원점에서 먼 물체일수록 심하다. 외곽선을 쓰는 물체는 Inspector 의 Static 에서 Batching Static 을 끈다.

## 흔한 실수
- **각진 메시에서 모서리마다 외곽선이 끊긴다**: 큐브나 로우폴리 소품은 모서리 정점이 면마다 따로 있고 법선도 갈라져 있다. 법선 방향으로 밀면 면이 제각기 떨어져 나가 모서리에 틈이 생긴다. 이 표본의 기본인 **피벗 기준 확대**(`positionOS * (1.0 + width * 2.0)`)는 메시 전체를 키우므로 같은 자리의 정점이 함께 움직여 틈이 없다. 다만 두께가 피벗에서의 거리에 비례하므로 피벗이 가운데인 볼록하고 두툼한 메시에서만 고르다. 판자처럼 납작한 메시는 두께 방향으로 거의 커지지 않아 넓은 면 쪽 선이 거의 0 이고 긴 쪽 끝만 두꺼워진다. 팔 안쪽이나 컵 안처럼 오목한 곳은 껍데기가 본체 안쪽으로 밀려 선이 사라진다. 그런 메시는 같은 자리의 법선을 평균한 부드러운 법선을 DCC 도구나 에디터 스크립트로 UV 채널(예: UV3)에 구워 두고, 래퍼의 `vertOutline` 에서 그 채널을 읽어 그 방향으로 민다.
- **물체 전체가 외곽선 색으로 덮인다**: 외곽선 패스가 `Cull Back`(기본값)이거나 `Cull Off` 이면 키운 껍데기의 앞면이 본체를 가린다. 외곽선 패스에만 `Cull Front` 를 넣고 본체 패스는 그대로 둔다.
- **외곽선 패스가 아예 그려지지 않는다**: URP 는 같은 `LightMode` 태그의 패스가 둘이면 첫 패스만 그린다. 두 패스를 모두 `UniversalForward` 로 두면 외곽선이 사라진다. 외곽선 패스는 `"LightMode" = "SRPDefaultUnlit"` 으로 둔다.
- **거리나 스케일에 따라 선 두께가 달라진다**: 두께가 오브젝트 공간 길이라 멀리 가면 가늘어지고 가까이 오면 굵어지며, Transform 스케일을 키운 물체는 선도 함께 굵어진다(비균일 스케일이면 방향마다 다르다). 스케일만 맞추려면 C# 에서 `_OutlineWidth` 를 스케일로 나눠 넣는다. 화면에서 늘 같은 두께를 원하면 래퍼의 `vertOutline` 에서 클립 공간으로 민다. 위치와 법선을 클립 공간으로 바꾼 뒤 `positionCS.xy += normalize(법선CS.xy) * 픽셀두께 * 2 / _ScreenParams.xy * positionCS.w` 처럼 화면 크기로 나누고 `w` 를 곱한다. `sgVertex` 는 오브젝트 공간 위치만 돌려주므로 이 보정은 래퍼에서 한다.
- **SSAO 를 켜자 외곽선이 사라진다**: Unity 에서 직접 확인하지는 않았지만 그럴 수 있다. 외곽선 패스(`SRPDefaultUnlit`)는 깊이 프리패스(`DepthOnly`)에 없다. Universal Renderer 의 Depth Priming 이 켜진 채 SSAO 같은 기능 때문에 깊이 프리패스가 돌면, 불투명 그리기가 프리패스 깊이와 같은 곳만 그리는 `ZTest Equal` 로 바뀌어 프리패스에 없던 껍데기가 통째로 버려진다. Window > Analysis > Frame Debugger 에서 Outline 패스의 그리기가 있는지, 그 그리기의 ZTest 가 Equal 인지 본다. 그렇다면 Universal Renderer Data 의 Depth Priming Mode 를 Disabled 로 바꿔 외곽선이 돌아오는지 확인한다.

## 변형 예시
- 카메라에서 멀어져도 외곽선이 화면에서 같은 픽셀 두께로 보이게 클립 공간 보정을 넣고 싶다.
- XR 에서 손이 다가가면(Hover) 외곽선이 켜지고, 잡으면(Select) 색이 바뀌게 하고 싶다.
- 캐릭터 메시의 부드러운 법선을 UV3 에 굽는 에디터 스크립트를 만들어 각진 갑옷에서도 선이 끊기지 않게 하고 싶다.
- 정점 색의 한 채널로 부위마다 외곽선 두께를 다르게 하고 싶다.
- 툰 셰이딩 본체와 합쳐 만화 같은 캐릭터를 만들고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 는 그래프 하나에 `Cull Front` 패스를 더 넣을 수 없다. 본체는 그대로 두고 외곽선용 그래프를 하나 더 만들어 두 번째 머티리얼로 쓴다. 외곽선 그래프는 Create > Shader Graph > URP > Unlit Shader Graph 로 만들고, Graph Inspector 의 Graph Settings 에서 Render Face 를 Back 으로 둔다 (`Cull Front` 와 같다). Fragment 의 Base Color 에는 외곽선 색 속성을 넣는다. Vertex 의 Position 에는 Position 노드(Object)에 `1 + 두께 * 2` 를 곱한 값(피벗 기준 확대)이나 Position + Normal Vector(Object) * 두께(법선 밀기)를 넣는다. 이 계산을 Custom Function 노드로 하려면 Type 을 String 으로 두고 입력 `Position`, `Width`, 출력 `Out`(Vector 3)을 만든 뒤 `Out = Position * (1.0 + Width * 2.0);` 한 줄을 넣는다. `core.hlsl` 을 File 로 바로 읽으면 `SgInput` 과 머티리얼 값 선언이 없어 컴파일되지 않으므로 계산만 옮긴다. 만든 머티리얼은 MeshRenderer 의 Materials 에 두 번째로 넣는다. 서브메시가 하나인 메시는 남는 머티리얼이 메시 전체를 한 번 더 그린다. 이때 C# 은 `renderer.materials[1]` 을 고친다.
