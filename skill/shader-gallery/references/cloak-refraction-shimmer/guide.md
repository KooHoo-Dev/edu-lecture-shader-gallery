# 클로킹 투명화 (Cloak Refraction Shimmer)

뒤 장면을 휘어 비추고 윤곽만 남겨 몸을 감춘다

무대 종류: 깊이 사용. 난이도 3/3. 기법: 씬 컬러, 화면 좌표 왜곡, 프레넬, 노이즈, 진행값 마스크.

## 파일
- `CloakRefractionShimmer.shader`
- `core.hlsl`
- `CloakController.cs`

모두 프로젝트의 `Assets/Shaders/cloak-refraction-shimmer/` 에 복사한다.

## URP 설정
사용 중인 URP Asset 에서 켠다: Opaque Texture, Depth Texture.

## 넣는 순서
1. `CloakRefractionShimmer.shader`, `core.hlsl`, `CloakController.cs` 를 `Assets/Shaders/cloak-refraction-shimmer/` 에 둔다.
2. 사용 중인 URP Asset(Project Settings > Quality 에 연결된 것)의 Rendering 에서 Opaque Texture 와 Depth Texture 를 켠다.
3. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고, 캐릭터의 모든 Mesh Renderer, Skinned Mesh Renderer 의 Materials 칸에 넣는다. 머티리얼의 은신 값은 0 으로 낮춰 둔다 (기본 0.55 는 미리보기용이다).
4. 높이 훑기를 쓰면 몸 아래 끝과 몸 높이를 모델의 오브젝트 공간에 맞춘다. 발에 피벗이 있는 키 1.8 인 캐릭터는 0 과 1.8 이다. Skinned Mesh Renderer 는 오브젝트 공간이 모델에 따라 다를 수 있으므로, Scene 뷰에서 은신 값을 움직여 띠가 발에서 시작해 머리에서 끝나는지 본다.
5. 캐릭터 루트에 `CloakController` 를 붙인다. 은신 스킬의 UnityEvent 에 `SetCloaked(bool)` 를, 피격 이벤트에 `RevealOnHit()` 를 연결한다. 시작할 때 이 셰이더(`_Cloak`)를 쓰는 Renderer 만 머티리얼 복사본을 만들어 은신 0 으로 둔다. 전환 중에 `SetCloaked` 를 다시 부르면 요청만 기억했다가 지금 전환이 끝난 뒤 그 방향으로 전환한다.
6. 캐릭터를 상자, 바닥 같은 불투명 물체 앞에 두고 Game 뷰에서 Play 해 본다.

## 확인
은신 값을 0 에서 1 로 올리면 밝은 띠가 발에서 머리로 올라가며 지나간 자리에 뒤의 바닥과 물체가 몸 모양대로 조금 휘어 비치고 윤곽에 하늘색 테두리가 남는다. `RevealOnHit()` 를 부르면 숨은 몸이 0.4 초쯤 반쯤 비쳐 드러났다 다시 숨는다. 은신 값이 0 일 때도 바닥에 그림자가 없는 것이 맞다 (이 머티리얼은 그림자를 만들지 않는다).

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_Cloak` | 은신 | 0.55 |
| `_MaxCloak` | 최대 은신 | 1 |
| `_Reveal` | 피격 노출 | 0 |
| `_MaskMode` | 마스크 방식 | 높이 훑기 |
| `_BodyBottom` | 몸 아래 끝 | -1 |
| `_BodyHeight` | 몸 높이 | 2 |
| `_Refraction` | 굴절 세기 | 0.05 |
| `_CalmAtFull` | 완전 은신 때 굴절 줄이기 | 켬 |
| `_ShimmerSpeed` | 일렁임 속도 | 0.8 |
| `_NoiseScale` | 노이즈 크기 | 6 |
| `_RimColor` | 테두리 색 | #9FD8FF |
| `_RimStrength` | 테두리 세기 | 0.5 |
| `_RimPower` | 테두리 날카로움 | 3 |
| `_BandColor` | 경계 띠 색 | #7FD4FF |
| `_BandWidth` | 경계 띠 폭 | 0.08 |
| `_BandGlow` | 경계 띠 밝기 | 1 |
| `_BaseColor` | 몸 색 | #8A96A3 |

## 동작 단계
1. **화면 공간 오프셋**: 월드 법선을 카메라의 오른쪽, 위 축에 내린 값(반대 방향)에 흐르는 노이즈를 더한 미는 방향이다. 빨강이 가로, 초록이 세로로 미는 양이다. 캡슐 가운데는 노이즈 얼룩이 섞인 연한 파스텔색이고, 왼쪽 가장자리는 분홍(오른쪽으로 민다), 오른쪽은 청록(왼쪽으로 민다), 위 둥근 끝은 자홍(아래로 민다)으로 짙어진다. 가장자리마다 가운데 쪽을 가리켜 몸 뒤 장면을 조금 키워 보인다. 재생하면 얼룩이 천천히 위로 흐른다. 이 방향에 굴절 세기를 곱해 씬 색상을 읽는 자리를 옮긴다.
2. **은신 마스크와 경계 띠**: 픽셀마다 언제 사라질지 정한 값과 진행값을 비교한 결과다. 검정은 아직 보이는 몸, 회색은 숨은 곳, 흰 띠가 그 사이를 지나가는 경계다. 높이 훑기에서는 발(아래 끝)부터 숨어 지금은 아래쪽 절반이 회색이고, 노이즈로 흔든 흰 띠가 가운데를 구불구불 가로지른다. 은신 값을 올리면 띠가 머리 쪽으로 올라간다. 마스크 방식을 프레넬 안쪽부터로 바꾸면 가운데부터 회색이 되고 흰 띠가 윤곽 쪽으로 퍼져 나간다.
3. **가드를 거친 휜 배경**: 밀린 좌표로 Opaque Texture 를 읽은 결과다. 몸 전체가 뒤의 바닥 격자와 상자로 채워지고, 격자 줄이 몸 모양과 노이즈 결을 따라 물결친다. 위쪽은 검은 하늘뿐이라 휘어도 티가 나지 않는다. 가장자리는 가운데 쪽 장면을 끌어와 읽으므로 공의 오른쪽 일부가 몸 가장자리에서 끊기고 바닥으로 바뀐다. 밀린 자리가 몸보다 앞에 있는 물체면 밀지 않은 좌표로 돌아가 앞 물체가 몸 속으로 끌려 들어오지 않는다. 아직 몸 색, 테두리, 띠가 없다.
4. **프레넬 테두리**: 가운데는 어둡고 시선과 비스듬한 윤곽으로 갈수록 밝다. 은신한 만큼만 이 테두리를 얹어, 다 숨은 몸도 윤곽으로는 알아볼 수 있게 한다. 최종 화면에서는 아직 보이는 위쪽 몸에는 테두리가 없고, 숨은 아래쪽 윤곽에만 남는다.

## 주의할 점
- URP Asset 이 품질 단계마다 따로 있으면 모두 Opaque Texture 와 Depth Texture 를 켠다. Depth Texture 가 꺼지면 앞 물체 가드가 동작하지 않는다. 모바일은 Opaque Downsampling 을 2x Bilinear 이상으로 두면 복사 비용이 줄지만 몸 속 장면이 흐려져 은신한 몸이 오히려 눈에 띌 수 있다.
- 이 머티리얼은 그림자를 만들지 않는다. 보이는 동안 그림자가 필요하면 평소에는 불투명 Lit 머티리얼을 쓰고 은신할 때만 이 머티리얼로 바꾼다 (바꾸는 순간 그림자도 사라진다). 투명 큐에 있는 캐릭터는 Depth Texture 에도 들어가지 않으므로 (불투명 뒤에 복사된다) 이렇게 바꿔 쓰면 SSAO, 물가 거품, 역장처럼 깊이를 읽는 다른 효과에서도 보이는 동안은 캐릭터가 빠지지 않는다.
- 2D Renderer 는 Opaque Texture 를 만들지 않고 `UniversalForward` 패스도 그리지 않아 아무것도 보이지 않는다. 3D 프로젝트(Universal Renderer)용 효과다.
- XR 에서는 Opaque Texture 가 눈마다 한 장씩인 배열이라 복사 비용이 두 배이고, 단독형(untethered) 기기에서는 Opaque Texture 를 끄라는 권고가 있다. 이 효과의 XR 동작은 실기기에서 확인하지 않았다.
- 주 광원의 distanceAttenuation 을 곱하지 않으므로 광원의 Culling Mask 와 Rendering Layers 가 무시되고, 받는 그림자와 안개도 처리하지 않는다. 마스크와 일렁임은 오브젝트 공간 위치로 읽으므로 Batching Static 으로 정적 배칭된 물체는 무늬와 높이 훑기가 월드 기준으로 바뀐다. 캐릭터는 Static 에서 뺀다.
- 접근성: 경계 띠는 바탕에 더하지 않고 띠 색으로 85% 덮으며, 기본 밝기 1 은 띠 색(하늘색) 그대로다. 띠 밝기를 2 이상으로 올리거나 여러 캐릭터가 동시에 전환하면 화면에서 넓게 번쩍일 수 있으니 게임 옵션으로 띠를 끌 수 있게 한다. `CloakController` 는 전환 중의 `SetCloaked` 를 끝난 뒤로 미뤄 연타해도 띠가 같은 자리를 빠르게 오가지 않는다. 직접 `_Cloak` 을 움직이는 코드도 방향을 초당 3번 넘게 바꾸지 않는다.

## 흔한 실수
- **망토 속에서 뒤의 연기, 파티클, 물, 유리가 사라진다**: Opaque Texture 는 불투명 범위(Render Queue 2500 이하)까지 그린 뒤 복사한 것이라 투명 물체가 들어 있지 않다. 은신한 몸은 그 복사본을 알파 1 로 덮어 그리므로, 몸보다 먼저 그려진 뒤쪽 투명 물체는 몸 모양대로 지워진다. 몸보다 늦게 그려지는 뒤쪽 투명 물체는 이 셰이더가 깊이를 써 두었으므로 가려진다. 꼭 비쳐야 하는 물체는 불투명이나 잘라 내기 머티리얼로 바꾼다.
- **앞에 있는 물체가 몸 속으로 끌려 들어온다**: Opaque Texture 는 앞뒤를 가리지 않고 화면 전체를 담는다. 밀린 좌표가 몸 앞 물체에 닿으면 그 색을 읽는다. 이 셰이더는 이 픽셀의 눈 깊이(`sgSceneDepth(i.screenUV) - i.depthDelta`)와 밀린 좌표의 깊이를 비교해 앞이면 밀지 않은 좌표로 돌아간다. 그래도 끌려 들어오면 URP Asset 의 Depth Texture 가 켜져 있는지 본다. 꺼져 있으면 깊이를 읽지 못해 이 가드가 동작하지 않는다.
- **은신한 몸이 회색이나 검은 판으로 보인다**: URP Asset 의 Opaque Texture 가 꺼져 있으면 씬 색상이 비어 있다. 품질 단계마다 URP Asset 이 따로 있으면 모두 켜고, 카메라 Inspector 의 Rendering > Opaque Texture 가 Off 이면 Use Pipeline Settings 로 바꾼다. 머티리얼의 Render Queue 를 2500 이하로 바꾸면 복사되기 전에 그려지므로 From Shader(Transparent)로 둔다.
- **팔이 몸통 앞을 지나는데 팔 속에 몸통이 아니라 뒤 배경이 비친다**: 몸은 자기 자신을 비추지 못한다. Opaque Texture 는 불투명 장면만 담고 은신한 몸은 그 안에 없으므로, 팔이 휘어 보여 주는 것은 몸통 너머의 배경이다. 이 셰이더는 Forward 패스 하나가 `ZWrite On` 으로 깊이를 쓴다. 몸이 스스로 겹친 자리가 어떻게 그려지는지는 웹 미리보기 링크에 `s.mesh=torus` 를 붙이거나 Unity 촬영 도구의 `--stage=mesh=torus` 로 고리 메시를 띄워 볼 수 있다. 팔과 몸통이 겹친 자리의 굴절이 어색하면 굴절 세기를 낮춰 눈에 덜 띄게 한다.
- **보이는 상태의 캐릭터에 그림자가 없다**: 이 머티리얼은 투명 큐 셰이더라 그림자를 만들지 않는다 (`ShadowCaster` 패스가 없다). 은신 값이 0 이어도 바닥에 그림자가 생기지 않는다. 보이는 동안 그림자가 필요하면 평소에는 불투명 Lit 머티리얼을 쓰고 은신할 때만 이 머티리얼로 바꾼다 (바꾸는 순간 그림자도 사라진다). 이 셰이더에 `ShadowCaster` 패스를 더하면 다 숨은 뒤에도 바닥에 그림자가 걸어 다니고, 숨은 몸이 비추는 바닥에 자기 그림자가 찍혀 아래쪽이 검게 보인다.

## 변형 예시
- 이 머티리얼은 그림자를 만들지 않는다. 보이는 동안 그림자가 필요하므로 평소에는 URP Lit 같은 불투명 머티리얼을 쓰다가 은신을 시작할 때만 이 머티리얼로 바꾸고(바꾸는 순간 그림자도 사라진다) 다 드러나면 되돌리고 싶다. 보이는 동안은 깊이를 읽는 다른 효과에서도 캐릭터가 빠지지 않는다.
- 같은 편 화면에서는 최대 은신을 0.85 로, 상대 편 화면에서는 1 로 두고 테두리 색을 팀 색으로 바꾸고 싶다.
- 은신 중 달리거나 공격하면 이동 속도에 따라 은신 값이 잠깐 내려가 몸이 흐릿하게 드러나게 하고 싶다.
- 은신한 몸 위로 홀로그램처럼 옅은 가로 줄이 천천히 지나가게 하고 싶다.
- 은신 전환 때 경계 띠를 따라 작은 파티클이 흩날리게 하고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 에서는 Graph Settings 의 Surface Type 을 Transparent 로 둔다. Normal Vector 노드(View 공간)의 xy 를 Negate 해 굴절 세기를 곱하고 Gradient Noise 를 더해 오프셋을 만든다. Screen Position 노드(Default)에 Add 해 Scene Color 노드에 넣는다 (화면비는 x 에 Screen 노드의 Height / Width 를 곱한다). 앞 물체 가드는 밀린 좌표로 읽은 Scene Depth 노드(Eye)가 Screen Position 노드(Raw)의 w 보다 작으면 Comparison 과 Branch 로 밀지 않은 좌표를 고른다. 마스크는 Position 노드(Object)의 y 를 Remap 한 값(또는 Fresnel Effect 노드의 반대)과 은신 값의 차이를 Smoothstep 해 만들고, Lerp 로 몸 색과 Scene Color 를 섞은 뒤 Fresnel Effect 로 테두리를 더한다. HLSL 래퍼처럼 깊이를 써 몸의 가장 앞면만 남기려면 Graph Settings 의 Depth Write 를 Force Enabled 로 둔다.
