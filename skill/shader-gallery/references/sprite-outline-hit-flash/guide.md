# 스프라이트 외곽선 + 피격 번쩍임 (Sprite Outline & Hit Flash)

이웃 픽셀 알파로 외곽선을 그리고, 맞은 순간 단색으로 번쩍였다 돌아온다

무대 종류: 스프라이트. 난이도 2/3. 기법: 스프라이트, 텍셀 크기, 알파, 게임 필.

## 파일
- `SpriteOutlineHitFlash.shader`
- `core.hlsl`
- `SpriteHitFlash.cs`

모두 프로젝트의 `Assets/Shaders/sprite-outline-hit-flash/` 에 복사한다.

## 넣는 순서
1. `SpriteOutlineHitFlash.shader`, `core.hlsl`, `SpriteHitFlash.cs` 를 `Assets/Shaders/sprite-outline-hit-flash/` 에 둔다.
2. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고 SpriteRenderer 의 Material 칸에 넣는다.
3. 스프라이트 임포트 설정에서 Mesh Type 을 Full Rect 로 바꾸고 Apply 한다.
4. 같은 오브젝트에 `SpriteHitFlash` 를 붙이고 피격 판정 때 `Hit()` 을 호출한다.

## 확인
머티리얼의 외곽선 두께를 올리면 그림 둘레에 선이 생기고, 번쩍임 강도를 1 로 올리면 스프라이트 전체가 번쩍임 색이 된다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_OutlineWidth` | 외곽선 두께 | 4 |
| `_OutlineColor` | 외곽선 색 | #FFD166 |
| `_HitFlash` | 번쩍임 강도 | 0 |
| `_FlashColor` | 번쩍임 색 | #FFFFFF |

## 동작 단계
1. **원본**: 스프라이트 텍스처에 SpriteRenderer 의 Color 를 곱한 기본 모습이다.
2. **외곽선**: 주변 8방향의 알파를 읽어 가장 큰 값에서 자기 알파를 뺀다. 그림 바로 바깥 픽셀만 남는다. 거리는 `_MainTex_TexelSize` 로 텍셀 단위로 맞춘다.
3. **번쩍임**: `lerp` 로 번쩍임 색과 섞는다. 색을 곱하면 원본보다 밝아질 수 없어 어두운 스프라이트가 번쩍이지 않는다. 이벤트 버튼으로 확인한다.

## 주의할 점
- 2D Renderer 에서는 `Universal2D` 패스가, Universal Renderer 에서는 `UniversalForward` 패스가 그려진다 (양쪽 모두 촬영으로 확인). 하나를 지우면 다른 쪽에서 스프라이트가 사라진다.
- 이 셰이더는 2D 조명을 받지 않는다. 2D 라이트가 필요하면 `Universal2D` 패스에 라이팅 코드를 넣어야 한다.
- MaterialPropertyBlock 은 쓰지 않는다. SRP Batcher 에서 빠지고, 머티리얼 복사본 방식이 수업 프로젝트와도 같다.

## 흔한 실수
- **번쩍이지 않고 어두워진다**: `SpriteRenderer.color` 를 흰색으로 바꿔도 원본과 같다. 색 곱하기는 어둡게만 만든다. 셰이더에서 `lerp` 로 번쩍임 색과 섞어야 한다.
- **외곽선이 잘린다**: 스프라이트의 Mesh Type 이 Tight 이면 투명 여백이 메시에서 빠져 외곽선이 그려질 자리가 없다. Full Rect 로 바꾸고 그림 둘레에 두께만큼 여백을 둔다.
- **아틀라스 옆 그림이 끌려온다**: 이웃을 읽다가 아틀라스의 옆 스프라이트 픽셀을 집으면 엉뚱한 선이 생긴다. Sprite Atlas 의 Padding 을 외곽선 두께보다 크게 잡는다.
- **적 하나를 때렸는데 전부 번쩍인다**: `sharedMaterial` 을 고치면 같은 머티리얼의 모든 적이 함께 변한다. `SpriteRenderer.material` 로 복사본을 만들고 `OnDestroy` 에서 지운다.

## 변형 예시
- 외곽선이 숨 쉬듯 두꺼워졌다 얇아지게 하고 싶다.
- 피격 때 빨간색으로 번쩍이고 살짝 흔들리게 하고 싶다.
- 2D 조명을 받게 하고 싶다.
- 무적 시간에 깜빡이는 효과를 추가하고 싶다. 초당 3회를 넘지 않게.

## Shader Graph 에서 쓰기
Shader Graph 의 Sprite Unlit 타깃에서 Custom Function 노드로 `outlineNeighborAlpha` 를 부를 수 있다. 다만 이 함수는 `SG_TEX` 매크로와 `_MainTex` 선언이 필요해 그래프의 Texture2D 입력을 받도록 고쳐야 한다.
