import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'sprite-wind-sway',
  title: '스프라이트 바람 흔들림',
  titleEn: 'Sprite Wind Sway',
  group: 'E',
  order: 4,
  oneLiner: '풀 스프라이트의 위쪽만 바람에 흔든다',
  goals: [
    '`uv.y` 마스크로 뿌리는 두고 위쪽 꼭짓점만 월드 x 방향으로 밀어 스프라이트를 기울일 수 있다.',
    '정점 4개짜리 Full Rect 사각형은 기울기만 한다는 것을 알고, 픽셀 단계에서 `uv.x` 를 되돌려 잎을 휘게 할 수 있다.',
    '위상을 오브젝트 공간이 아니라 월드 x 에서 얻어야 배칭 경로와 상관없이 덤불마다 박자가 달라지는 이유를 설명할 수 있다.',
    '트리거와 코루틴으로 지나가는 캐릭터가 풀을 한 번 휘청이게 하는 C# 을 붙일 수 있다.',
  ],
  tags: ['정점 변형', '스프라이트', 'UV 마스크', '노이즈', '화면 미분'],
  difficulty: 2,
  shaderFile: 'SpriteWindSway.shader',
  stage: {
    kind: 'sprite',
    blend: 'alpha',
    vertex: true,
    textures: { _MainTex: { file: 'SpriteWindSwayGrass.png' } },
    // 같은 덤불을 좌우 조금 뒤에 두 장 더 놓는다. 월드 x 가 달라 박자가 갈리는 것이 보인다. 명암만 조금 어둡게 둔다
    layers: [
      { values: { _Shade: 0.66 }, position: [-1.7, 0.1] },
      { values: { _Shade: 0.8 }, position: [1.7, 0.1] },
    ],
  },
  params: [
    { key: '_WindStrength', label: '바람 세기', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.18, unit: ' 유닛', hint: '꼭대기가 좌우로 출렁이는 폭(월드 유닛). 돌풍이 자리마다 이 폭을 키우거나 줄인다. 0 이면 쏠린 채 서 있다' },
    { key: '_Lean', label: '기울기 쏠림', type: 'range', min: -0.5, max: 0.5, step: 0.01, default: 0.1, unit: ' 유닛', hint: '출렁임의 가운데를 옆으로 옮긴다. 양수면 오른쪽으로 기운 채 흔들리고 음수면 왼쪽으로 기운다. 쏠림만 바뀌고 돌풍은 늘 오른쪽으로 흐른다' },
    { key: '_WindSpeed', label: '바람 속도', type: 'range', min: 0, max: 3, step: 0.05, default: 1, hint: '출렁이는 빠르기와 돌풍 덩어리가 오른쪽으로 흘러가는 빠르기. 0 이면 기운 채 멈춘다' },
    { key: '_Gustiness', label: '돌풍 변화', type: 'range', min: 0, max: 1, step: 0.01, default: 0.6, hint: '흘러가는 노이즈가 세기를 얼마나 바꾸는지. 0 이면 모든 덤불이 같은 폭으로 출렁이고, 1 이면 돌풍이 지나가는 덤불만 크게 눕고 나머지는 거의 선다' },
    { key: '_PhaseSpread', label: '박자 어긋남', type: 'range', min: 0, max: 3, step: 0.05, default: 0.8, unit: ' rad/유닛', hint: '월드 x 1 유닛마다 출렁임의 위상을 이만큼 늦춘다. 0 이면 세 덤불이 한 몸처럼 같은 박자로 흔들린다. 클수록 물결이 짧아져 한 덤불 안에서도 왼쪽과 오른쪽이 따로 논다' },
    { key: '_Bend', label: '휨', type: 'range', min: 0, max: 1, step: 0.01, default: 1, hint: '픽셀 단계 휨 보정의 양. 0 이면 잎이 곧은 채 평행사변형으로 기울고, 1 이면 뿌리 쪽은 서 있고 끝으로 갈수록 휜다' },
    { key: '_Push', label: '밀기', type: 'range', min: -1, max: 1, step: 0.01, default: 0, hint: '평소에는 0 이다. C# `GrassPush2D` 와 밀기 버튼이 1 → -0.35 → 0.12 → 0 으로 흔들었다 되돌린다. 1 이면 꼭대기를 0.45 유닛 더 민다. 월드 단위라 Scale 과 상관없다' },
    { key: '_Tint', label: '색', type: 'color', default: '#ffffff', hint: '텍스처와 SpriteRenderer 의 Color 에 곱한다' },
    { key: '_Shade', label: '명암', type: 'range', min: 0.4, max: 1.2, step: 0.01, default: 1, hint: '색을 어둡게 하거나 조금 밝힌다. 무대의 뒤 덤불 두 장은 이 값만 낮춰 거리감을 냈다. Unity 에서는 SpriteRenderer 의 Color 로도 같은 일을 할 수 있다' },
  ],
  presets: [
    { id: 'breeze', name: '산들바람', look: '오른쪽으로 살짝 기운 덤불들이 저마다 다른 박자로 느리게 출렁인다', values: {} },
    { id: 'storm', name: '폭풍', look: '덤불이 오른쪽으로 깊이 누운 채 빠르게 출렁인다. 돌풍이 지나가는 덤불은 더 눕고 돌풍이 약할 때는 덜 눕는다', values: { _WindStrength: 0.2, _Lean: 0.42, _WindSpeed: 2.2, _Gustiness: 0.8 } },
    { id: 'underwater', name: '물속 수초', look: '짙은 초록 수초가 쏠림 없이 느리고 크게 좌우로 출렁인다', values: { _WindStrength: 0.34, _Lean: 0, _WindSpeed: 0.45, _Gustiness: 0.15, _PhaseSpread: 0.6, _Tint: '#7fc2b4' } },
    { id: 'dry-reed', name: '마른 갈대', look: '누르스름한 갈대가 거의 휘지 않고 곧은 채 잘게 기우뚱거린다', values: { _WindStrength: 0.12, _Lean: 0.05, _WindSpeed: 1.6, _Bend: 0.2, _Tint: '#ffb878' } },
  ],
  events: [
    {
      id: 'push',
      label: '밀기',
      // GrassPush2D 와 같다. 1.25초 동안 _Push 를 0 → 1 → -0.35 → 0.12 → 0 으로 움직이는 감쇠 진동 (사인 가감속)
      tracks: [{ key: '_Push', frames: [[0, 0], [0.18, 1], [0.55, -0.35], [0.9, 0.12], [1.25, 0]], ease: 'inOutSine' }],
    },
  ],
  demo: { fire: [{ event: 'push', every: 5 }] },
  steps: [
    { n: 1, label: '흔들림 마스크', body: '정점이 바람 값에 곱하는 `uv.y` 다. 아래(뿌리)는 검고 위로 갈수록 밝아져 꼭대기가 희다. 단계 보기는 알파 없이 칠해 스프라이트의 사각형 전체가 보인다. 이 사각형은 정점 4개라 위쪽 두 꼭짓점만 옆으로 밀리고 아래 두 꼭짓점은 `uv.y` 가 0 이라 제자리다. 그래서 사각형이 휘지 않고 평행사변형으로 기운다. 위쪽 두 꼭짓점은 각자 자리의 월드 x 로 바람 값을 구해, 박자 어긋남이 크면 둘이 다르게 밀려 사다리꼴로 벌어지거나 좁아지기도 한다.' },
    { n: 2, label: '바람 값 S', body: '꼭대기를 미는 양 S 를 칠했다. 오른쪽으로 밀리는 곳(+)은 주황, 왼쪽(-)은 파랑이고 많이 밀릴수록 밝으며, 0 근처는 검은 띠가 된다. 잎이 있는 곳을 밝게 칠해 덤불 모양도 보인다. S 는 월드 x 에서 위상을 얻는 느린 사인에, 오른쪽으로 흘러가는 노이즈 돌풍이 세기를 곱하고, 쏠림과 밀기를 더한 값이다. 같은 순간에도 세 덤불의 색과 밝기가 다르고, 재생하면 파랑과 주황의 경계(검은 띠)가 왼쪽 덤불에서 오른쪽 덤불로 흘러간다. 바람의 마루가 +x 로 지나가는 모습이다.' },
    { n: 3, label: '곧게 기울이기만', body: '정점만 민 모습이다. 검은 바탕이 기운 사각형 메시다. 잎은 곧은 채 덤불 전체가 사각형과 함께 평행사변형으로 기운다. 정점이 4개뿐이라 정점 단계로는 이 이상 휘게 할 수 없다. 최종 화면은 픽셀 단계에서 높이 y 마다 `S × (y - y²)` 만큼 옆 텍셀을 읽어 되돌린다. 그러면 잎 모양은 `S × y²` 만큼 밀린 것처럼 보여, 뿌리 쪽은 서 있고 끝으로 갈수록 휜다. 월드 거리를 uv 거리로 바꾸는 비율은 `ddx(uv.x) / ddx(positionWS.x)` 로 구한다.' },
  ],
  offNote: '마스크 없이 모든 꼭짓점을 같은 만큼 민 흔한 실수다. 재생하면 모든 꼭짓점이 함께 밀려 덤불이 기울지도 휘지도 않고 뿌리째 좌우로 떠다닌다.',
  mistakes: [
    { title: '덤불이 뿌리째 땅 위를 미끄러진다', body: '바람 값을 모든 꼭짓점에 똑같이 더하면 뿌리도 함께 움직인다. `uv.y`(뿌리 0, 꼭대기 1)를 곱해 위쪽만 민다. 스프라이트 Pivot 이나 오브젝트 높이로 마스크를 만들면 피벗 위치와 배칭 경로에 따라 달라지므로 `uv.y` 를 쓴다.' },
    { title: '여러 덤불이 모두 같은 박자로 흔들린다', body: '위상을 `positionOS` 나 오브젝트 원점(`unity_ObjectToWorld`)에서 얻으면 배칭 경로에 따라 결과가 바뀐다. 동적 배칭은 정점을 월드 좌표로 합쳐 넘기고 원점은 0 이 되며, SRP Batcher 경로는 오브젝트 좌표로 넘겨 같은 프리팹이 모두 같은 값을 갖는다. 래퍼처럼 `TransformObjectToWorld` 로 월드로 옮긴 위치의 x 로 위상을 얻으면 어느 경로든 자리마다 박자가 다르다.' },
    { title: '잎이 휘지 않고 평행사변형으로 기운다', body: 'Full Rect 스프라이트는 정점이 4개라 정점을 밀면 사각형이 기울기만 한다. 마스크를 제곱해도 정점이 없으니 휘지 않는다. 픽셀 단계에서 `uv.x += S × (y - y²) × (uv 폭 / 월드 폭)` 으로 옆 텍셀을 읽어 휘게 하거나, 정점이 많은 메시(Sprite Shape, 직접 만든 메시)를 쓴다.' },
    { title: '휜 잎 끝이 잘리거나 옆 그림이 끌려온다', body: '픽셀 단계 휨은 사각형 안에서 옆 텍셀을 읽으므로 그림 둘레에 투명 여백이 있어야 한다 (이 표본의 96×128 텍스처는 좌우 약 20px, 위 8px). Mesh Type 이 Tight 이면 여백이 메시에서 빠져 휜 잎이 잘린다. Full Rect 로 바꾼다. Sprite Atlas 에 넣으면 uv 가 0~1 이 아니라 아틀라스 안의 작은 사각형이라 옆 스프라이트가 끌려오고 0~1 밖을 지우는 검사도 맞지 않는다 (추론, 촬영으로 확인하지 않았다). 흔들리는 풀은 아틀라스에서 빼 단독 텍스처로 둔다.' },
    { title: '화면 가장자리에서 풀이 갑자기 사라진다', body: '정점을 밀어도 SpriteRenderer 의 Bounds 는 원래 사각형 그대로다. 원래 사각형이 화면 밖으로 나가는 순간 화면 안쪽으로 기운 잎까지 통째로 컬링될 수 있다. 쏠림과 밀기를 더한 폭을 작게 두거나 화면 밖 여유를 두고 풀을 놓는다.' },
  ],
  unity: {
    setup: [
      '`SpriteWindSway.shader`, `core.hlsl`, `GrassPush2D.cs` 를 `Assets/Shaders/sprite-wind-sway/` 에 둔다.',
      '풀 PNG(예: `SpriteWindSwayGrass.png`)의 임포트 설정을 Texture Type Sprite (2D and UI), Sprite Mode Single, Mesh Type Full Rect, sRGB 켬, Wrap Mode Clamp, Filter Mode Bilinear, Pixels Per Unit 64 로 하고 Apply 한다. 텍스처 높이 128px 가 2 유닛이 되어 웹 무대와 같은 크기다. 그림 둘레에 투명 여백을 두고 Sprite Atlas 에는 넣지 않는다.',
      'Project 창에서 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다. 덤불이 여러 개여도 머티리얼 하나면 된다. 자리마다 박자는 셰이더가 월드 x 로 정한다.',
      '덤불마다 SpriteRenderer 의 Material 칸에 이 머티리얼을 넣는다. 덤불마다 색을 조금 바꾸려면 SpriteRenderer 의 Color 를 쓴다 (정점 색으로 들어가 곱해진다).',
      '지나가는 캐릭터에 밀리게 하려면 덤불에 Box Collider 2D 를 붙여 Is Trigger 를 켜고 `GrassPush2D` 를 붙인다. Pushers 에 플레이어 레이어를 고른다. 플레이어에는 Rigidbody 2D 와 Collider 2D 가 있어야 트리거가 불린다.',
    ],
    verify: '바람 세기를 올리면 덤불 위쪽이 더 크게 좌우로 출렁이고 뿌리는 땅에 붙어 있으며, 휨을 0 으로 내리면 잎이 곧은 채 평행사변형으로 기운다. 같은 머티리얼의 덤불을 가로로 여럿 놓으면 저마다 다른 박자로 흔들리고, 플레이어가 지나가면 그 덤불만 지나간 쪽으로 한 번 휘청인다.',
    pitfalls: [
      '2D Renderer 에서는 `Universal2D` 패스가, Universal Renderer 에서는 `UniversalForward` 패스가 그려진다. 하나를 지우면 다른 쪽에서 풀이 사라진다. 이 셰이더는 2D 조명을 받지 않는다.',
      '위상, 돌풍, 밀기 양이 모두 월드 단위다. Scale 을 3 배로 키운 큰 덤불도 꼭대기가 같은 유닛만큼 밀리므로 상대적으로 덜 흔들린다. 큰 덤불은 머티리얼을 나눠 세기를 올린다. Pixels Per Unit 도 같은 영향을 준다. 기본값 100 이면 이 표본의 덤불이 0.96×1.28 유닛으로 작아져 같은 값이 약 1.56 배 세게 보이고, 좌우 투명 여백이 0.22 유닛으로 줄어 폭풍과 밀기가 겹치면 바깥 잎이 사각형 가장자리에서 잘린다. 정점을 월드에서 밀어서 Transform 을 돌린 스프라이트도 늘 월드 가로로 밀린다. 다만 픽셀 단계 휨은 돌리지 않은 스프라이트를 전제로 한다 (돌리면 `uv.y` 가 월드 높이와, `uv.x` 가 월드 가로와 어긋나 휨이 틀어진다).',
      'Unity 는 스프라이트를 동적 배칭하면 정점을 월드 좌표로, SRP Batcher 경로에서는 오브젝트 좌표로 넘긴다 (Unity 이슈 UUM-15015, As Designed). 래퍼는 둘 다 월드로 옮긴 뒤 밀어 결과가 같게 했다. Unity 6.3 에서 이 표본이 실제로 어느 배칭 경로로 그려지는지는 확인하지 못했다.',
      '정점을 밀어도 Renderer 의 Bounds 는 그대로라 화면 가장자리에서 기운 풀이 통째로 컬링될 수 있다.',
      '픽셀 아트 풀에서는 휨 보정이 텍셀 사이를 읽어 잎 가장자리가 반짝이거나 번진다. Filter Mode 를 Point 로 하면 계단이 움직이며 끓어 보이므로 휨을 낮추거나 꺼서 정점 기울기만 쓰고, 바람 세기를 텍셀 크기의 정수배로 끊는 방법을 고려한다.',
      'Scene 뷰에서 흔들리지 않으면 Scene 뷰 툴바의 Effects 메뉴에서 Always Refresh 를 켠다. 편집 모드에서는 화면을 다시 그릴 때만 `_Time` 이 흐른다.',
    ],
    graph: 'Shader Graph 의 Sprite Unlit 타깃에서 Vertex 의 Position 은 오브젝트 공간을 받는다. Position 노드(World)의 x 에 `S × UV.y` 를 더한 뒤 Transform 노드(World → Object, Position)로 바꿔 넣는다. S 는 Time 노드와 Position(World) 의 x 로 만든 Sine 과 Gradient Noise 로 같은 식을 잇는다. Fragment 의 Position(World) 은 민 뒤 위치라 이것으로 S 와 폭 비율을 구하면 위상과 휨이 래퍼와 달라진다. Vertex 에서 밀기 전 월드 x 를 Custom Interpolator 로 넘겨 Fragment 에서 쓴다. 휨 보정은 Fragment 에서 String 모드 Custom Function 에 `UV.x += S * (y - y * y) * Bend * ddx(UV.x) / ddx(PosX)` 를 옮기고(`PosX` 는 넘겨받은 밀기 전 x, 0 나누기 막기 포함), 그 UV 로 Sample Texture 2D 를 읽는다. 이 경로는 촬영으로 확인하지 않았다.',
  },
  prompt: {
    goal: '풀 덤불, 수초 같은 SpriteRenderer 의 위쪽만 바람에 흔들고 잎이 휘어 보이게 하는 셰이더를 넣는다. 같은 그림을 여러 장 놓아도 자리마다 박자가 다르고, 플레이어가 지나가면 C# 으로 한 번 휘청이게 한다.',
    adaptIdeas: [
      '플레이어가 풀 사이를 지나갈 때 덤불마다 지나간 쪽으로 휘청이게 하고 싶다.',
      '전역 바람 값을 하나 두어 풀밭 전체의 바람 세기를 날씨에 따라 바꾸고 싶다.',
      '천장에 매달린 덩굴이나 등불처럼 위가 고정되고 아래가 흔들리게 뒤집고 싶다.',
      '물속 장면에서 수초가 좌우로 쏠림 없이 느리게 출렁이게 하고 싶다.',
      '픽셀 아트 풀이라 반짝이지 않게 텍셀 단위로 끊어 흔들고 싶다.',
    ],
  },
  captures: [
    { name: 'storm', label: '폭풍', values: { _WindStrength: 0.2, _Lean: 0.42, _WindSpeed: 2.2, _Gustiness: 0.8 } },
    { name: 'pushed', label: '밀기 (꼭대기 0.45 유닛 더 밀림)', values: { _Push: 1 } },
    { name: 'straight', label: '휨 0 (평행사변형으로 기움)', values: { _Bend: 0, _Lean: 0.35, _WindStrength: 0 } },
  ],
  // 기본값은 기울기가 작아 정지 화면에서 바람이 잘 안 보인다. 폭풍은 돌풍이 약한 순간 덜 누우므로,
  // 꼭대기가 늘 0.45 유닛 더 밀리는 밀기 촬영을 썸네일로 쓴다
  thumbnail: 'pushed',
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 3D `wind-sway-foliage` 의 바람 식(흘러가는 노이즈 돌풍, uv 마스크)을 2D 로 옮기고, 정점 4개짜리 스프라이트에서 잎이 휘어 보이게 하는 픽셀 단계 보정과 월드 x 위상, 밀기 이벤트를 더했다. 풀 덤불 텍스처, 셰이더, C# 은 이 갤러리에서 새로 만들었다.',
  references: [
    { label: 'Unity 블로그: URP 2D 샘플 프로젝트의 최신 2D 기법 (셰이더로 흔드는 식물)', url: 'https://unity.com/blog/games/happy-harvest-demo-latest-2d-techniques' },
    { label: 'Unity 블로그: Shader Graph 로 움직이는 머티리얼 만들기 (UV 마스크와 월드 노이즈 바람)', url: 'https://unity.com/blog/engine-platform/creating-animated-materials-with-shader-graph' },
    { label: 'Unity 6.3 매뉴얼: Sprite 텍스처 임포트 설정 (Mesh Type)', url: 'https://docs.unity.com/en-us/engine/6000.3/manual/materials-and-shaders/textures/textures-reference/texture-type-sprite' },
    { label: 'Unity 이슈 UUM-15015: 스프라이트 정점이 배칭 경로에 따라 월드 또는 오브젝트 좌표로 들어온다 (As Designed)', url: 'https://issuetracker.unity3d.com/product/unity/issues/guid/UUM-15015' },
  ],
  related: [
    { id: 'wind-sway-foliage', why: '같은 바람 식을 3D 풀 메시에 쓴다. 정점이 많아 정점 단계만으로 휜다' },
    { id: 'tiling-scroll-parallax', why: '같은 스프라이트를 층으로 겹쳐 쓰고 아틀라스, Mesh Type 제약도 같다' },
    { id: 'sprite-outline-hit-flash', why: '같은 스프라이트 래퍼(두 패스, 정점 색)와 머티리얼 복사본 C# 을 쓴다' },
  ],
}
