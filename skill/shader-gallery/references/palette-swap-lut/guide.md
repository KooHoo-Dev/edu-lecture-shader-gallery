# 팔레트 스왑 (Palette Swap (LUT))

이미지 한 장으로 색 변형을 만든다

무대 종류: 스프라이트. 난이도 2/3. 기법: 스프라이트, 팔레트, 룩업 텍스처, 텍스처 임포트, 픽셀 아트.

## 파일
- `PaletteSwapLut.shader`
- `core.hlsl`
- `PaletteSwapController.cs`
- `PaletteSwapLutIndex.png`
- `PaletteSwapLutPalette.png`

모두 프로젝트의 `Assets/Shaders/palette-swap-lut/` 에 복사한다.

## 넣는 순서
1. `PaletteSwapLut.shader`, `core.hlsl`, `PaletteSwapController.cs`, `PaletteSwapLutIndex.png`, `PaletteSwapLutPalette.png` 를 `Assets/Shaders/palette-swap-lut/` 에 둔다.
2. `PaletteSwapLutIndex.png` 를 고르고 Inspector 에서 Texture Type 은 Sprite (2D and UI), Pixels Per Unit 은 64, Mesh Type 은 Full Rect, Advanced 의 sRGB (Color Texture) 는 끄고, Filter Mode 는 Point (no filter), Compression 은 None 으로 맞춘 뒤 Apply 를 누른다.
3. `PaletteSwapLutPalette.png` 를 고르고 Texture Type 은 Default, sRGB (Color Texture) 는 켜고, Wrap Mode 는 Clamp, Filter Mode 는 Point (no filter), Generate Mip Maps 는 끄고, Compression 은 None 으로 맞춘 뒤 Apply 를 누른다.
4. 셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고 팔레트 칸에 `PaletteSwapLutPalette.png` 를 넣는다.
5. 인덱스 스프라이트를 씬에 끌어다 놓고 SpriteRenderer 의 Material 칸에 이 머티리얼을 넣는다.
6. 같은 오브젝트에 `PaletteSwapController` 를 붙여 Team Row 를 정하고, 팀이 바뀌면 `SetTeam(줄)`, 피격 판정 때 `Hit()` 을 호출한다.

## 확인
머티리얼의 팔레트 줄을 0 에서 1 로 바꾸면 파랑 옷이 빨강 옷으로 바뀌고 피부와 머리카락은 그대로다. 피격을 0.5 이상으로 올리면 몸이 흰색과 연분홍, 외곽선이 빨강이 된다.

## 기본 머티리얼 값
| 속성 | 뜻 | 값 |
|---|---|---|
| `_PaletteRow` | 팔레트 줄 | 0 |
| `_HitFlash` | 피격 | 0 |
| `_HitRow` | 피격 줄 | 7 |

## 동작 단계
1. **인덱스 회색**: 스프라이트의 R 값을 그대로 회색으로 본다. 색 번호 0~7 을 0~1 로 나눠 담았다. 외곽선은 0 이라 투명한 배경과 같은 검정으로 묻히고, 옷, 머리카락, 피부 순으로 밝아지며 머리띠와 눈 하이라이트가 거의 흰색이다. 화면에는 sRGB 로 나가 옷의 어두운 면도 꽤 밝은 회색으로 보인다. 이 그림 자체에는 색 정보가 없다.
2. **팔레트 읽는 좌표**: 번호를 정수로 되돌려 `(번호 + 0.5) / 칸 수` 로 바꾼 가로 좌표를 빨강에, 고른 줄의 세로 좌표를 초록에 담았다. +0.5 가 칸 가운데를 가리키게 하는 반 텍셀 오프셋이다. 같은 번호의 영역은 모두 한 색이고, 외곽선은 빨강이 거의 없어 초록, 번호가 클수록 빨강이 더해져 노랑에 가까워진다. 0번 줄은 팔레트 맨 위라 초록이 강하다. 팔레트 줄을 올리면 초록만 줄어 그림 전체가 주황 쪽으로 바뀐다.
3. **팔레트 색**: 그 좌표로 팔레트를 읽은 색이다. 그림은 그대로이고 팔레트 줄만 바꿔 팀 색, 밤 장면, 석화 상태가 된다. 피격 버튼을 누르면 줄이 잠깐 피격 줄로 통째로 바뀐다.

## 주의할 점
- 2D Renderer 에서는 `Universal2D` 패스가, Universal Renderer 에서는 `UniversalForward` 패스가 그려진다. 하나를 지우면 다른 쪽에서 스프라이트가 사라진다.
- Unity 의 기본 임포트는 압축이 켜져 있다(데스크톱 BC, 모바일 ASTC). 인덱스 회색은 RGB 가 한 직선 위에 있어 BC1 은 블록 안의 값을 4단계로 줄여 번호가 바뀐다. Android 기본 ASTC 처럼 블록이 4x4 가 아니거나 아틀라스로 자리가 옮겨지면 블록 하나에 여러 번호가 들어가 같은 일이 생긴다. 인덱스 스프라이트와 팔레트 모두 모든 플랫폼에서 Compression 을 None 으로 두는 것이 필수다.
- Default 텍스처는 Non-Power of 2 가 ToNearest 라 크기가 2의 거듭제곱이 아니면 늘어나며 칸이 어긋난다. 팔레트는 2의 거듭제곱 크기로 만들거나 Non-Power of 2 를 None 으로 둔다. 칸 수를 바꾸면 `core.hlsl` 의 `PALETTE_COLORS`, `PALETTE_ROWS` 도 맞춘다.
- 이 셰이더는 2D 조명을 받지 않는다. 밤 장면처럼 분위기를 바꾸는 것은 조명 대신 팔레트 줄로 한다. 2D 라이트가 필요하면 `Universal2D` 패스에 라이팅 코드를 넣어야 한다.
- Sprite Atlas 하나는 sRGB 와 압축 설정을 하나만 가진다. 인덱스 스프라이트를 컬러 스프라이트와 같은 아틀라스에 넣으면 sRGB 가 켜진 채 읽혀 색 번호가 낮은 쪽으로 밀리고(인덱스의 sRGB 를 켜 둔 것과 같은 고장), 압축까지 켜져 있으면 번호가 더 틀어진다. 인덱스 스프라이트만 담는 아틀라스를 따로 만들고 sRGB 끔, Filter Mode Point, Compression None 으로 둔다.
- MaterialPropertyBlock 은 쓰지 않는다. SRP Batcher 에서 빠지고, 머티리얼 복사본 방식이 수업 프로젝트와도 같다.

## 흔한 실수
- **색이 더 낮은 번호의 색으로 밀리고 0 번과 마지막 번호의 색만 맞다**: Linear 색 공간 프로젝트에서 인덱스 스프라이트의 sRGB (Color Texture) 가 켜져 있으면 GPU 가 읽으면서 감마를 풀어 값이 작아지고 색 번호가 낮은 쪽으로 밀린다. 값이 0 과 1 인 번호만 그대로다. Gamma 색 공간에서는 변환이 없어 생기지 않는다. 임포트 설정의 Advanced 에서 sRGB 를 끄고 Apply 한다. 팔레트는 색이므로 반대로 켜 둔다.
- **색 경계가 번지거나 없는 색이 섞인다**: Filter Mode 가 Bilinear 이면 이웃 번호나 이웃 팔레트 칸과 섞인 값을 읽는다. 압축(Compression)이 켜져 있으면 블록 안의 값이 몇 단계로 줄거나 섞여 번호가 틀어진다. 인덱스 스프라이트와 팔레트 모두 Filter Mode 는 Point, Compression 은 None 으로 둔다.
- **어떤 색만 옆 칸 색으로 나오거나 깜빡인다**: 번호를 `번호 / 칸 수` 로 바꿔 읽으면 칸의 왼쪽 경계를 가리켜 실수 오차 하나로 옆 칸이 나온다. `(번호 + 0.5) / 칸 수` 로 칸 가운데를 읽는다. 1x256 팔레트에서 흔한 반 텍셀 오류다.
- **색 경계마다 가는 선이 생긴다**: 팔레트 좌표가 색 경계에서 크게 뛰어 GPU 가 작은 밉맵을 고른다. 이 셰이더는 `SAMPLE_TEXTURE2D_LOD` 로 0 단계만 읽어 막는다. 직접 고친다면 팔레트의 Generate Mip Maps 를 끈다.
- **한 캐릭터의 팀을 바꿨는데 전부 바뀐다**: `sharedMaterial` 이나 머티리얼 에셋의 값을 바꾸면 같은 머티리얼을 쓰는 모든 캐릭터가 함께 바뀐다. `SpriteRenderer.material` 로 복사본을 만들고 `OnDestroy` 에서 지운다. `PaletteSwapController` 가 그렇게 한다.

## 변형 예시
- 머지 게임처럼 단계가 오를수록 같은 그림의 색이 바뀌게 하고 싶다.
- 물이나 용암 색 칸만 시간에 따라 돌려 반짝이게(팔레트 사이클링) 하고 싶다.
- 피격 때 피격 줄과 원래 줄을 두세 번 번갈아 깜빡이게 하고 싶다. 초당 3회를 넘지 않게.
- 플레이어가 고른 색으로 옷 색만 바꾸게 하고 싶다. 팔레트 텍스처를 코드에서 만들어서.
- 기존 컬러 스프라이트에서 인덱스 스프라이트와 팔레트를 자동으로 뽑아내는 에디터 도구를 만들고 싶다.

## Shader Graph 에서 쓰기
Shader Graph 의 Sprite Unlit 타깃에서는 노드만으로 같은 일을 할 수 있다. Sample Texture 2D 로 인덱스의 R 을 읽어 Multiply(칸 수 - 1), Round, Add(0.5), Divide(칸 수) 로 U 를 만들고, 줄 번호로 V 를 만들어 Vector 2 로 합친 뒤 팔레트를 Sample Texture 2D LOD (LOD 0) 로 읽는다. 두 Sample 노드의 Type 은 Default 로 두되, 인덱스 텍스처의 sRGB 는 임포트 설정에서 꺼야 한다. 샘플러는 Sampler State 노드로 Point 를 지정한다.
