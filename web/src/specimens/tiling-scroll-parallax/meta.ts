import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'tiling-scroll-parallax',
  title: '타일 스크롤 패럴랙스',
  titleEn: 'Tiling Scroll Parallax',
  group: 'E',
  order: 3,
  oneLiner: 'UV 오프셋으로 끝없는 배경을 스크롤한다',
  goals: [
    'UV 에 오프셋을 더하고 Wrap Mode Repeat 로 끝없이 이어지는 배경을 만들 수 있다.',
    '층 계수로 층마다 움직이는 양을 달리해 시차(패럴랙스)를 만들 수 있다.',
    '카메라 위치를 C# 에서 머티리얼 오프셋으로 넘기는 방식과 오브젝트를 옮기는 방식을 비교할 수 있다.',
    '아틀라스, Mesh Type, Wrap Mode 처럼 반복을 깨뜨리는 임포트 설정을 고칠 수 있다.',
  ],
  tags: ['UV 스크롤', '패럴랙스', 'Wrap Mode', '스프라이트'],
  difficulty: 1,
  shaderFile: 'TilingScrollParallax.shader',
  stage: {
    kind: 'sprite',
    blend: 'alpha',
    textures: { _MainTex: { file: 'TilingScrollParallaxLayer.png', repeat: true } },
    // 시차가 보이게 본체(가까운 층) 뒤 조금 위에 '먼 층' 프리셋 값의 층을 하나 더 그린다
    layers: [{ values: { _LayerFactor: 0.25, _Haze: 0.55 }, position: [0, 0.45] }],
  },
  params: [
    { key: '_ScrollSpeed', label: '자동 흐름 속도', type: 'range', min: -1, max: 1, step: 0.01, default: 0.15, unit: ' 장/초', hint: '카메라가 가만히 있어도 흐르는 속도. 1 이면 1초에 텍스처 한 장 폭만큼 간다. 음수면 반대로 흐른다. 층 계수가 함께 곱해진다' },
    { key: '_LayerFactor', label: '층 계수', type: 'range', min: 0, max: 2, step: 0.01, default: 1, hint: '움직임에 곱하는 값. 0 이면 멈춰 하늘처럼 멀어 보이고 1 이면 땅처럼 카메라와 같이 지나간다. 먼 층일수록 작게 준다' },
    { key: '_ScrollOffset', label: '카메라 오프셋', type: 'range', min: -4, max: 4, step: 0.01, default: 0, unit: ' 장', hint: 'C# 이 카메라가 간 거리를 텍스처 폭 단위로 바꿔 넣는 값. 끌어 보면 그림이 옆으로 밀리며 끝없이 이어진다' },
    { key: '_Tiling', label: '가로 반복 횟수', type: 'range', min: 1, max: 4, step: 0.05, default: 1, hint: '스프라이트 한 장에 텍스처가 몇 번 들어가는지. Unity 에서 스프라이트를 가로로 늘린 배율만큼 올리면 그림이 늘어나 보이지 않는다. 미리보기는 스프라이트를 늘리지 않아 올릴수록 언덕이 가로로 눌려 보인다' },
    { key: '_HazeColor', label: '공기 색', type: 'color', default: '#9eb8d6', hint: '먼 층을 덮는 하늘빛' },
    { key: '_Haze', label: '공기 섞기', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '공기 색을 섞는 양. 먼 층일수록 올리면 흐려져 거리감이 커진다' },
  ],
  presets: [
    { id: 'near', name: '가까운 층', look: '계수 1. 카메라와 같은 속도로 지나가는 땅', values: {} },
    { id: 'far', name: '먼 층', look: '계수 0.25 에 공기 색을 섞어 느리고 흐린 산', values: { _LayerFactor: 0.25, _Haze: 0.55 } },
    { id: 'camera-only', name: '카메라만 따라감', look: '자동 흐름 없이 카메라 이동 버튼으로만 움직인다', values: { _ScrollSpeed: 0 } },
    { id: 'wide', name: '가로로 늘린 층', look: '한 장에 텍스처를 두 번 반복한다. 미리보기는 스프라이트를 늘리지 않아 언덕이 가로로 눌려 보이고, Unity 에서 Scale X 를 두 배로 늘린 층에 주면 원래 비율로 돌아온다', values: { _Tiling: 2 } },
  ],
  events: [
    {
      id: 'pan',
      label: '카메라 이동',
      tracks: [{ key: '_ScrollOffset', frames: [[0, 0], [1.5, 1.5], [3, 0]], ease: 'inOutSine' }],
    },
  ],
  demo: { fire: [{ event: 'pan', every: 5 }] },
  steps: [
    { n: 1, label: '원래 UV', body: '스프라이트의 UV 를 색으로 본다. 가로(`u`)는 빨강, 세로(`v`)는 초록이라 왼쪽 아래가 검고 오른쪽 아래가 빨강, 왼쪽 위가 초록, 오른쪽 위가 노랑이다. 이 범위 0~1 이 텍스처 한 장이다.' },
    { n: 2, label: '오프셋을 더한 UV', body: '가로 UV 에 오프셋을 더하고 1 을 넘는 부분을 다시 0 부터 세어(`frac`) 보았다. 오른쪽으로 갈수록 빨강이 짙어지다가 한 줄에서 빨강이 갑자기 빠져 초록과 검정으로 돌아간다. 이 세로 경계가 텍스처가 처음부터 다시 시작하는 곳이다. 시간이 가면 이 경계가 왼쪽으로 흐른다. 층 계수를 0 으로 내리면 멈추고, 반복 횟수를 올리면 경계가 늘어난다. 실제 셰이더는 UV 에 `frac` 을 하지 않고 Wrap Mode Repeat 에 맡긴다. 끝없이 커지는 오프셋 값 하나만 `frac` 으로 감싸는데, 화면 전체에 같은 값이라 이음매가 생기지 않는다. 최종 화면은 오프셋을 더한 UV 로 텍스처를 읽는다. 경계 자리에서도 언덕이 끊기지 않는 것은 텍스처의 왼쪽 끝과 오른쪽 끝이 이어지게 그렸기 때문이다. 공기 섞기를 올리면 먼 층처럼 흐려진다.' },
  ],
  offNote: 'Wrap Mode 가 Clamp 인 텍스처처럼 0~1 밖에서 끝 열만 계속 읽는다. 처음에는 멀쩡하지만 그림이 흐르면서 오른쪽부터 땅의 띠가 가로 줄무늬로 길게 늘어나고, 한 장을 거의 다 지날 무렵에는 스프라이트 전체가 줄무늬가 되었다가 처음 그림으로 튀어 돌아온다. 카메라 오프셋을 끌어도 같다.',
  mistakes: [
    { title: '스크롤하면 끝 픽셀이 가로 줄무늬로 늘어난다', body: '텍스처의 Wrap Mode 가 Clamp 라서 0~1 밖에서 끝 열만 읽는다. 텍스처 임포트 설정에서 Wrap Mode 를 Repeat 로 바꾸고 Apply 한다. 위아래까지 반복되어 아래 가장자리에 위쪽 픽셀이 비치면 Per-axis 로 U 만 Repeat, V 는 Clamp 로 둔다.' },
    { title: 'Repeat 로 했는데도 옆 스프라이트가 끌려오거나 늘어난다', body: '스프라이트가 Sprite Atlas 에 들어가 있으면 UV 가 아틀라스 안의 작은 사각형이라 반복이 아틀라스 전체에 걸리고, 아틀라스 텍스처의 Wrap Mode 가 쓰인다. 배경 층 텍스처는 아틀라스에 넣지 않은 단독 텍스처로 두고 Sprite Mode 는 Single 로 한다.' },
    { title: '흐르던 언덕과 나무가 하늘 자리에서 다각형 모양으로 잘려 사라진다', body: 'Mesh Type 이 Tight 이면 Unity 가 투명한 하늘을 빼고 원래 그림의 언덕 실루엣을 따라 메시를 만든다. UV 는 그대로라 그림은 흐르지만 메시는 원래 모양에 고정되어, 높은 언덕이나 나무가 원래 하늘이던 자리로 흘러가면 메시 밖이라 다각형 모양으로 잘려 보이지 않는다. 스프라이트 임포트 설정의 Mesh Type 을 Full Rect 로 바꾸고 Apply 한다.' },
    { title: '머티리얼 오프셋을 바꿔도 움직이지 않는다', body: '기본 Sprite 셰이더는 머티리얼의 Tiling/Offset 을 쓰지 않는다. `material.mainTextureOffset` 대신 이 셰이더의 `_ScrollOffset` 을 넣는다. `sharedMaterial` 에 넣으면 모든 층이 같이 움직이므로 층마다 `SpriteRenderer.material` 복사본을 쓴다.' },
    { title: '픽셀 아트 배경이 흐리게 떨린다', body: '오프셋이 텍셀 사이에 걸리면 픽셀이 반쯤 섞여 번지고, 층마다 다르게 걸려 떨려 보인다. Filter Mode 를 Point 로 하고 Pixel Perfect Camera 로 카메라를 정수 PPU 격자에 맞춘 뒤 `TextureParallaxScroller` 의 Snap To Texel 을 켜 최종 오프셋을 1/텍스처 폭 단위로 끊는다.' },
  ],
  unity: {
    setup: [
      '`TilingScrollParallax.shader`, `core.hlsl`, `TextureParallaxScroller.cs` 를 `Assets/Shaders/tiling-scroll-parallax/` 에 둔다.',
      '배경 층 PNG(예: `TilingScrollParallaxLayer.png`)의 임포트 설정을 Texture Type Sprite (2D and UI), Sprite Mode Single, Mesh Type Full Rect, sRGB 켬, Wrap Mode Repeat, Filter Mode Bilinear(픽셀 아트는 Point)로 하고 Apply 한다. Sprite Atlas 에는 넣지 않는다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다. 층이 여러 개여도 머티리얼 하나면 된다.',
      '층마다 SpriteRenderer 오브젝트를 하나씩 만들어 스프라이트와 머티리얼을 넣고, 화면 폭보다 넓게 Scale X 를 키운 뒤 머티리얼의 가로 반복 횟수를 같은 배율로 맞춘다. 먼 층일수록 Order in Layer 를 작게 둔다.',
      '각 층에 `TextureParallaxScroller` 를 붙이고 Layer Factor 를 먼 층 0.1~0.3, 가까운 층 0.6~1 로 준다. 스크립트가 Awake 에서 머티리얼의 자동 흐름 속도를 Auto Scroll Speed(기본 0)로 덮어쓰므로 카메라가 서 있으면 층도 멈춘다. 구름처럼 혼자 흘러야 하는 층만 Auto Scroll Speed 를 준다. 카메라에 MainCamera 태그가 없으면 Camera Transform 칸에 카메라를 넣는다.',
    ],
    verify: 'Play 중 카메라를 옆으로 옮기면 층이 화면을 계속 덮은 채 그림만 흐르고, Layer Factor 가 작은 층일수록 느리게 지나가며 끝없이 이어져 끊기거나 줄무늬가 생기지 않는다.',
    pitfalls: [
      '2D Renderer 에서는 `Universal2D` 패스가, Universal Renderer 에서는 `UniversalForward` 패스가 그려진다. 하나를 지우면 다른 쪽에서 배경이 사라진다.',
      '반복은 텍스처의 Wrap Mode 가 한다. 아틀라스에 들어간 스프라이트나 Sprite Mode Multiple 로 자른 한 칸은 UV 가 0~1 이 아니라서 반복이 깨진다. Tight 메시는 메시가 원래 언덕 실루엣 모양에 고정되어 흐르는 그림이 잘린다.',
      '이 셰이더는 2D 조명을 받지 않는다. 2D Renderer 의 Light 2D 를 놓아도 배경 층은 밝기가 그대로다. 밤 장면처럼 어둡게 하려면 SpriteRenderer 의 Color 나 공기 색으로 맞추고, 2D 라이트가 필요하면 `Universal2D` 패스에 라이팅 코드를 넣어야 한다.',
      '수업의 2D 05 Layer And Scroll `ScrollController` 는 오브젝트를 옮기고 화면 밖으로 나간 판을 반대편으로 되돌린다. 이 방식은 오브젝트가 카메라를 따라가고 텍스처 오프셋만 바뀌어 판을 이어 붙이거나 되돌릴 필요가 없다. 대신 층마다 머티리얼 복사본이 하나씩 생기고(MaterialPropertyBlock 은 SRP Batcher 에서 빠져 쓰지 않는다), 층 위에 놓인 콜라이더나 오브젝트는 함께 움직이지 않는다. 밟는 땅이나 장애물은 오브젝트 방식이 맞다.',
      '카메라를 옮기는 스크립트보다 먼저 돌면 한 프레임 늦은 위치를 읽어 떨린다. `TextureParallaxScroller` 는 `DefaultExecutionOrder(100)` 으로 기본 순서(0)의 LateUpdate 보다 뒤에 돈다. 카메라를 패키지(Cinemachine 등)나 다른 스크립트가 옮기면 그쪽이 어느 업데이트에서 어떤 순서로 도는지 Edit > Project Settings > Script Execution Order 와 그 패키지 문서에서 확인하고, 이 스크립트가 그 뒤에 돌게 순서를 맞춘다.',
      'URP 의 `_Time` 은 Play 중 `Time.time` 이라 자동 흐름은 `Time.timeScale` 을 따른다. 0 이면 멈추고 2 면 두 배로 흐른다. 그래서 일시정지 메뉴 뒤 배경까지 멈추는 일이 흔하다. 멈추면 안 되는 층은 Auto Scroll Speed 를 0 으로 두고 C# 에서 `Time.unscaledDeltaTime` 을 쌓아 `_ScrollOffset` 에 넣는다. `TextureParallaxScroller` 가 매 프레임 `_ScrollOffset` 을 쓰므로 쌓은 값은 이 스크립트에서 카메라 오프셋에 더해 넘긴다. 쌓는 값은 `Mathf.Repeat(offset, 1f / layerFactor)` 로 감싸야 오래 켜 두어도 float 정밀도로 떨리지 않는다.',
    ],
    graph: 'Shader Graph 의 Sprite Unlit 타깃에서는 Custom Function 없이 Tiling And Offset 노드로 같은 일을 한다. UV 에 Tiling (`_Tiling`, 1), Offset 에 (`_ScrollOffset` + Time × `_ScrollSpeed`) × `_LayerFactor` 를 Fraction 노드로 감싼 값을 넣고 Sample Texture 2D 로 `_MainTex` 를 읽는다.',
  },
  prompt: {
    goal: '2D 배경 층을 SpriteRenderer 의 UV 오프셋으로 끝없이 스크롤하고 층마다 카메라를 따라가는 속도를 달리해 시차를 만든다.',
    adaptIdeas: [
      '하늘, 먼 산, 가까운 숲 세 층으로 카메라를 따라 움직이는 패럴랙스 배경을 만들고 싶다.',
      '카메라가 위아래로도 움직이니 세로 방향 오프셋도 넣고 싶다.',
      '러너 게임처럼 카메라는 가만히 두고 배경만 일정 속도로 흐르게 하고 싶다. 일시정지에는 멈춰야 한다.',
      '픽셀 아트 배경이라 떨리지 않게 텍셀 단위로 끊어 움직이고 싶다.',
      '구름 층은 카메라와 상관없이 천천히 흘러가게 하고 싶다.',
    ],
  },
  captures: [
    { name: 'far', label: '먼 층', values: { _LayerFactor: 0.25, _Haze: 0.55 } },
    { name: 'wide', label: '두 번 반복', values: { _Tiling: 2 } },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 언덕 텍스처, 셰이더, C# 스크립트는 이 갤러리에서 새로 만들었다.',
  references: [
    { label: 'Unity 포럼: SpriteRenderer 에서 mainTextureOffset 스크롤이 먹지 않는 문제', url: 'https://discussions.unity.com/t/is-it-still-possible-to-scroll-sprite-textures-with-material-maintextureoffset/652556' },
    { label: '트랜스폼 이동 방식 2D 패럴랙스 배경 튜토리얼', url: 'https://dev.to/nafisnil/create-parallax-effect-of-a-2d-game-background-unity3d-2ked' },
    { label: 'Unity 스크립트 레퍼런스: TextureWrapMode', url: 'https://docs.unity3d.com/ScriptReference/TextureWrapMode.html' },
  ],
  related: [
    { id: 'sprite-outline-hit-flash', why: '같은 스프라이트 래퍼와 머티리얼 복사본 방식을 쓴다' },
    { id: 'triplanar-projection', why: 'Repeat 로 반복되는 텍스처를 UV 대신 월드 좌표로 까는 방법' },
  ],
}
