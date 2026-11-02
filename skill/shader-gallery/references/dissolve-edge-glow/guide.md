# 디졸브 (Dissolve Edge Glow)

노이즈와 임계값으로 물체를 태워 없앤다. 사망, 소환, 텔레포트 연출의 기본

무대 종류: 메시. 난이도 2/3. 기법: 노이즈, 임계값, 알파 클립, 자체 발광.

## 파일
- `DissolveEdgeGlow.shader`
- `core.hlsl`
- `DissolveController.cs`

모두 프로젝트의 `Assets/Shaders/dissolve-edge-glow/` 에 복사한다.

## 넣는 순서
1. `DissolveEdgeGlow.shader`, `core.hlsl`, `DissolveController.cs` 를 `Assets/Shaders/dissolve-edge-glow/` 에 둔다.
2. Project 창에서 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.
3. 머티리얼을 대상 MeshRenderer 에 넣는다. Inspector 에서 임계값을 움직여 확인한다.
4. 연출에 쓸 때는 물체에 `DissolveController` 를 붙이고 사망 판정 때 `DissolveOut()` 을 호출한다.

## 확인
머티리얼의 임계값을 0 에서 1 로 올리면 주황 띠와 함께 구멍이 커지다 물체가 사라지고, 그림자에도 같은 구멍이 뚫린다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_Threshold` | 임계값 | 0.42 |
| `_NoiseScale` | 노이즈 크기 | 7 |
| `_Sweep` | 위에서 쓸기 | 0 |
| `_EdgeWidth` | 가장자리 폭 | 0.07 |
| `_EdgeColor` | 가장자리 색 | #FF5C14 |
| `_EdgeGlow` | 가장자리 밝기 | 2.5 |
| `_BaseColor` | 기본 색 | #9EADC2 |

## 동작 단계
1. **노이즈**: 표면의 위치마다 0~1 값을 하나 정한다. 이 값이 그 자리가 사라지는 차례다. UV 대신 오브젝트 공간 위치를 쓰면 메시 이음매에서 끊기지 않는다.
2. **임계값**: 노이즈가 `_Threshold` 보다 작으면 0, 크면 1 이다. `clip` 이 0 인 픽셀을 버린다. 슬라이더를 움직이면 흰 영역이 줄어든다.
3. **가장자리**: `smoothstep` 으로 임계값 바로 위 좁은 띠만 남긴다. `_EdgeWidth` 가 띠의 폭이다.

## 주의할 점
- 스키닝 캐릭터는 애니메이션이 적용된 뒤의 위치가 셰이더로 들어온다. 움직이는 동안에는 구멍 무늬가 몸 위를 흐른다. 1~2초 연출에서는 잘 보이지 않는다. 무늬를 몸에 붙이려면 UV 로 노이즈를 만들거나 바인드 포즈 위치를 보조 UV 채널에 굽는다.
- 위에서 쓸기는 오브젝트 공간 y 가 -0.5~0.5 인 메시 기준이다. 피벗이 발밑이거나 키가 다른 메시는 `core.hlsl` 의 `saturate(0.5 - i.positionOS.y)` 를 메시 높이에 맞춰 고친다.
- 빛나는 띠가 번지게 하려면 URP Volume 의 Bloom 을 켠다. 값이 1 을 넘어도 Bloom 이 없으면 흰색으로 잘릴 뿐이다.
- 메시 스케일이 크면 노이즈 무늬도 함께 커진다. `_NoiseScale` 을 스케일에 맞춰 조절한다.

## 흔한 실수
- **그림자가 그대로 남는다**: `ShadowCaster` 패스에서 자르지 않으면 물체가 사라져도 온전한 그림자가 남는다. 이 표본은 세 보조 패스 모두 같은 `sgEffect` 알파로 자른다.
- **임계값 양 끝이 안 움직인다**: 값 노이즈는 0.5 근처에 몰려 있어 슬라이더의 양 끝이 죽는다. `saturate((n - 0.2) / 0.6)` 처럼 범위를 넓혀야 전 구간이 고르게 변한다.
- **UV 이음매에서 끊긴다**: UV 로 노이즈를 만들면 구의 뒷면과 극점, 모델의 UV 경계에서 무늬가 끊긴다. 오브젝트 공간 위치를 쓰면 스키닝이 없는 메시에서는 이음매가 없다.
- **여러 적이 함께 사라진다**: `sharedMaterial` 의 값을 바꾸면 같은 머티리얼을 쓰는 모든 적이 사라진다. `renderer.material` 로 복사본을 만들고 파괴할 때 함께 지운다.

## 변형 예시
- 가장자리 색을 체력에 따라 바꾸고 싶다.
- 디졸브가 발밑에서 위로 올라오게 하고 싶다.
- 스프라이트에도 같은 효과를 쓰고 싶다.
- 사라진 자리에 파티클이 나오게 C# 코드를 추가하고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 에서는 Custom Function 노드를 File 모드로 두고 `core.hlsl` 을 지정한 뒤 `dissolveNoise` 를 호출하는 함수를 추가해 노이즈만 가져온다. 그래프의 Alpha Clip Threshold 에 임계값을, Emission 에 띠 색을 연결한다.
