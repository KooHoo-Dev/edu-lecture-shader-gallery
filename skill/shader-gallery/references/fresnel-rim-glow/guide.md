# 프레넬 림 빛 (Fresnel Rim Glow)

비스듬히 보이는 가장자리만 밝힌다

무대 종류: 메시. 난이도 1/3. 기법: 프레넬, 시선 벡터, 림 라이트, 자체 발광, 게임 필.

## 파일
- `FresnelRimGlow.shader`
- `core.hlsl`
- `RimHitFlash.cs`

모두 프로젝트의 `Assets/Shaders/fresnel-rim-glow/` 에 복사한다.

## 넣는 순서
1. `FresnelRimGlow.shader`, `core.hlsl`, `RimHitFlash.cs` 를 `Assets/Shaders/fresnel-rim-glow/` 에 둔다.
2. Project 창에서 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.
3. 머티리얼을 대상 MeshRenderer 에 넣는다. Inspector 에서 림 지수와 림 세기를 움직여 확인한다.
4. 피격 연출에 쓸 때는 같은 오브젝트에 `RimHitFlash` 를 붙이고 피격 판정 때 `Flash()` 를 호출한다. 인자가 없어 Inspector 의 UnityEvent(예: XR Simple Interactable 의 Select Entered)에 바로 연결할 수 있다.

## 확인
림 지수를 올리면 윤곽의 빛이 얇아지고 낮추면 몸 안쪽까지 번진다. 물체나 카메라를 돌려도 림은 항상 화면에서 본 윤곽에 붙어 있다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_RimColor` | 림 색 | #38C8FF |
| `_RimIntensity` | 림 세기 | 1.5 |
| `_RimPower` | 림 지수 | 3 |
| `_BaseColor` | 기본 색 | #2B3342 |
| `_HitFlash` | 번쩍임 강도 | 0 |
| `_FlashColor` | 번쩍임 색 | #FFFFFF |

## 동작 단계
1. **dot(N, V)**: 법선과 카메라 쪽 방향의 내적이다. 정면을 보는 가운데가 1 로 가장 밝고, 가장자리로 갈수록 어두워진다. 값은 윤곽 바로 앞에서야 0 쪽으로 빠르게 떨어지므로 몸 대부분은 밝게 보인다. 구의 모양이 이 값 하나에 다 들어 있다.
2. **뒤집기**: `1 - dot(N, V)` 로 뒤집으면 윤곽이 흰색이 된다. 이대로는 몸의 절반 가까이가 회색이라 림이라기보다 흐릿한 막이다.
3. **지수로 좁히기**: 0~1 값을 거듭제곱하면 1 근처만 남고 나머지는 0 으로 빠르게 떨어진다. `_RimPower` 를 올리면 흰 테두리가 얇아진다.
4. **조명에 더하기**: 기본 색에 조명을 곱한 표면 위에 림 색을 **더한다**. 조명과 곱하지 않으므로 빛이 안 닿는 그늘 쪽 윤곽에서도 림이 남는다. 피격 버튼을 누르면 림이 몸 안쪽까지 넓어진다.

## 주의할 점
- 이 셰이더는 불투명 3D 메시용이다. 패스가 `UniversalForwardOnly` 라 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트에서 쓴다.
- XR 에서는 두 눈의 카메라 위치가 다르다. 이 셰이더는 안에서 `GetWorldSpaceNormalizeViewDir` 로 눈마다 시선을 계산하므로 양쪽 림이 맞는다. 시선을 바꾸려고 C# 에서 `Camera.main.transform.position` 같은 카메라 위치 하나를 전역 값으로 넘겨 쓰면 두 눈이 같은 위치를 쓰게 되어 양쪽 림이 어긋난다. 시선은 셰이더 안에서 구한다.
- 평평한 면만 있는 메시(큐브, 로우폴리)는 면 안에서 법선이 같아 림이 면 단위로 통째로 켜지고 꺼진다. 부드러운 법선을 가진 메시에서 잘 보인다.
- 림 세기가 1 을 넘어도 URP Volume 의 Bloom 이 없으면 색이 하얗게 잘릴 뿐 번지지 않는다. URP Asset 의 HDR 이 꺼져 있으면 1 을 넘는 값이 1 로 잘려 세기를 올려도 더 번지지 않는다.
- 번쩍일 때 림이 몸 전체로 넓어진다. 연타나 연속 피격에서 넓은 면이 빠르게 깜빡이면 광과민 발작 위험이 있다. `RimHitFlash` 는 `minInterval`(0.34초)로 게임 배속과 상관없이 실제 시간 기준 초당 3회를 넘지 않게 막는다. 이 값을 0.34 아래로 낮추지 않는다.

## 흔한 실수
- **림이 실처럼 가늘거나 거의 안 보인다**: 카메라 위치 - 표면 위치를 `normalize` 하지 않으면 길이가 카메라 거리만큼이라 내적이 1 을 넘어 잘린다. URP 에서는 `GetWorldSpaceNormalizeViewDir(positionWS)` 를 쓰면 정규화된 값이 나온다. 보간된 법선도 프래그먼트에서 다시 `normalize` 한다.
- **물체가 돌면 림이 한쪽으로 쏠린다**: 오브젝트 공간 법선(`normalOS`)과 월드 공간 시선을 섞어 쓰면 물체가 회전할 때 림이 표면에 붙어 함께 돈다. 법선을 `TransformObjectToWorldNormal` 로 월드 공간으로 바꾼 뒤 내적한다.
- **그늘 쪽에서 림이 사라진다**: 림을 더한 뒤 조명을 곱하면 빛이 안 닿는 쪽 윤곽이 까매진다. 림 라이트는 보통 그늘에서 실루엣을 떼어 내려고 쓴다. `기본 색 × 조명` 을 먼저 구하고 림은 그 위에 더한다.
- **에너지막처럼 가운데를 비우려 했는데 반투명이 되지 않는다**: 이 셰이더는 불투명용이라 알파만 바꿔서는 반투명이 되지 않는다. 다섯 곳을 함께 고친다. (1) `core.hlsl` 마지막 `return` 의 알파 `1.0` 을 림 값 `saturate(strength * rim)` 으로 바꾼다. (2) `.shader` 의 Forward 패스에서 `clip(c.a - 0.5);` 를 지우고 `return float4(c.rgb, 1.0);` 를 `return c;` 로 바꾼다. 남겨 두면 가운데가 반투명이 아니라 딱 잘린 구멍이 되거나 그대로 불투명하다. (3) Forward 패스의 `Tags` 줄 아래에 `Blend SrcAlpha OneMinusSrcAlpha`(빛을 더하는 느낌이면 `Blend SrcAlpha One`)와 `ZWrite Off` 를 넣는다. `ZWrite` 를 켜 두면 뒤에 있는 다른 투명 물체가 가려진다. (4) `SubShader` 의 `Tags` 에서 `"Queue"` 를 `"Transparent"`, `"RenderType"` 을 `"Transparent"` 로 바꾼다. (5) `ShadowCaster` 패스를 지운다. 남기면 바닥에 꽉 찬 그림자가 생긴다. `DepthOnly`, `DepthNormals` 패스도 투명 물체에는 쓰이지 않으므로 함께 지워 Forward 패스 하나만 남긴다.

## 변형 예시
- 에너지막처럼 가운데는 투명하고 윤곽만 빛나게 바꾸고 싶다.
- XR 에서 손이 다가가면(Hover) 림이 서서히 켜지고, 잡으면(Select) 번쩍이게 하고 싶다.
- 체력이 줄수록 림 색이 파랑에서 빨강으로 바뀌게 하고 싶다.
- 림이 숨 쉬듯 천천히 밝아졌다 어두워지게 하고 싶다. 1초에 2번을 넘지 않게.
- 텍스처가 있는 캐릭터 머티리얼에 림만 덧붙이고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 에는 같은 식의 Fresnel Effect 노드가 있다. Power 에 림 지수를 넣고 결과에 림 색과 세기를 곱해 Lit 타깃의 Emission 에 연결하면 된다. Custom Function 이 필요 없다.
