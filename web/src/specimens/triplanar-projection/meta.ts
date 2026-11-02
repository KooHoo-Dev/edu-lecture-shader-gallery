import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'triplanar-projection',
  title: '삼평면 투영',
  titleEn: 'Triplanar Projection',
  group: 'A',
  order: 3,
  oneLiner: 'UV 없이 세 축에서 텍스처를 투영한다',
  goals: [
    '세 축 평면에 텍스처를 한 번씩 투영하고 법선 방향으로 섞는 원리를 설명할 수 있다.',
    '`abs(N)` 의 거듭제곱으로 섞임 폭을 조절하고, 가중치 합을 1 로 나눠야 하는 이유를 설명할 수 있다.',
    '월드 공간과 오브젝트 공간 투영의 차이를 보고 상황에 맞게 고를 수 있다.',
    'UV 가 늘어나는 절벽이나 바위, 프로토타입 블록에 이음매 없는 타일 재질을 입힐 수 있다.',
  ],
  tags: ['삼평면 투영', '월드 좌표', '법선 가중치', '텍스처'],
  difficulty: 2,
  shaderFile: 'TriplanarProjection.shader',
  stage: {
    kind: 'mesh',
    mesh: 'cube',
    blend: 'cutout',
    textures: { _TileTex: { file: 'TriplanarTiles.png', repeat: true } },
  },
  params: [
    {
      key: '_Space',
      label: '투영 공간',
      type: 'select',
      options: [
        { value: '0', label: '월드' },
        { value: '1', label: '오브젝트' },
      ],
      default: '0',
      hint: '월드는 돌 무늬가 공간에 고정되어 도는 상자 면 위를 미끄러진다. 오브젝트는 줄눈이 상자 모서리에 맞춰 붙어 함께 돈다',
    },
    { key: '_TileSize', label: '타일 크기', type: 'range', min: 0.25, max: 4, step: 0.05, default: 1, unit: ' m', hint: '텍스처 한 장이 덮는 길이. 클수록 돌이 커진다. 월드에서는 미터이고, 오브젝트에서는 오브젝트 단위라 실제 길이는 이 값에 Transform 의 Scale 을 곱한 만큼이다' },
    { key: '_BlendSharpness', label: '섞임 날카로움', type: 'range', min: 1, max: 16, step: 0.5, default: 8, hint: '가중치 거듭제곱. 작으면 비스듬한 면에서 두 투영이 넓게 겹쳐 줄눈이 이중으로 비치고, 크면 한 투영으로 빨리 넘어간다. 면이 축에 딱 맞으면 값을 바꿔도 화면이 그대로다. 오브젝트 공간의 상자가 그렇다. 월드 공간에서 상자 면이 비스듬히 돌아 있을 때 움직여 본다' },
    { key: '_Tint', label: '색조', type: 'color', default: '#ffffff', hint: '텍스처 색에 곱한다' },
  ],
  presets: [
    { id: 'cliff', name: '절벽과 바위', look: '월드 공간. 크기가 다른 바위도 같은 크기의 돌 무늬로 이어진다', values: {} },
    { id: 'moving-prop', name: '움직이는 소품', look: '오브젝트 공간. 줄눈이 상자 모서리에 맞춰 붙어 함께 돈다', values: { _Space: '1' } },
    { id: 'wide-blend', name: '넓게 섞기', look: '면이 돌아갈 때 두 투영이 넓게 겹쳐 줄눈이 이중으로 비친다', values: { _BlendSharpness: 1 } },
    { id: 'mossy-blocks', name: '이끼 낀 큰 돌', look: '큰 돌 블록에 초록빛이 돈다', values: { _TileSize: 2.5, _Tint: '#a8c88f' } },
  ],
  events: [],
  demo: {
    // 타일 크기를 오가며 돌 크기가 바뀌는 모습을 보여 준다. 월드와 오브젝트 어느 공간에서도 화면이 바뀐다.
    // 섞임 날카로움은 면이 축에 맞으면 화면이 그대로라 데모로 쓰지 않는다 (넓게 섞기 프리셋에서 본다).
    loops: [{ key: '_TileSize', frames: [[0, 1], [2, 2.5], [3.2, 2.5], [5.6, 0.5], [6.8, 0.5], [8.4, 1]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: '세 축 가중치', body: '법선 세 성분의 절댓값을 거듭제곱하고 합이 1 이 되게 나눈 값을 색으로 본다. X 축을 보는 옆면은 빨강, 앞뒤(Z)는 파랑, 윗면(Y)은 초록이다. 처음 카메라는 상자 윗면과 거의 같은 높이라 윗면이 잘 보이지 않는다. 무대를 드래그해 위에서 내려다보면 초록 윗면(Y 투영)이 보인다. 월드 공간에서는 상자가 돌아 면이 축에서 비스듬해지면 빨강과 파랑이 섞여 보라나 분홍이 된다. 오브젝트 공간으로 바꾸면 상자가 돌아도 면 색이 그대로다.' },
    { n: 2, label: '한 축 투영', body: 'X 축 투영(`zy` 좌표) 하나만 상자 전체에 씌운 모습이다. 1단계에서 빨강이던 옆면은 돌이 반듯하지만, 파랑이던 앞면은 `z` 가 거의 변하지 않아 같은 줄이 가로로 길게 늘어난다. 평면 투영 하나로는 모든 면을 덮을 수 없다.' },
    { n: 3, label: '섞은 결과', body: 'Y, Z 축 투영까지 세 장을 1단계 가중치로 섞었다. 면마다 늘어나지 않는 투영이 대부분을 차지해 모든 면에 돌이 반듯하게 놓인다. 상자 면이 45도 가까이 돌면 두 투영이 반반 섞여 줄눈이 이중으로 비친다. 섞임 날카로움을 올리면 그렇게 보이는 각도가 좁아지고, 1 로 내리면 넓어진다. 이 색에 조명(`i.lighting`)을 곱해 면마다 밝기를 달리하면 최종 화면이 된다.' },
  ],
  offNote: '위에서 내려다본 좌표(`xz`) 하나로만 투영한 평면 투영이다. 옆면은 위아래로 같은 색을 끌어 써서 세로 줄무늬로 늘어난다. 무대를 드래그해 위에서 내려다보면 윗면에는 돌이 반듯하게 놓여 이 투영이 윗면에만 맞는다는 것을 알 수 있다. 절벽이나 바위에 지형 텍스처를 그대로 씌울 때 흔히 보는 모습이다. 이 표본은 알파가 항상 1 이라 그림자는 효과를 켰을 때와 같다.',
  mistakes: [
    { title: '옆면에 세로 줄무늬가 길게 늘어난다', body: '위에서 내려다본 좌표(`xz`) 하나로만 투영하면 옆면은 같은 줄을 위아래로 끌어 쓴다. 절벽, 원기둥, 바위 옆면에서 생긴다. 세 축으로 투영해 법선 방향 가중치로 섞는다.' },
    { title: '경계 부분만 밝거나 어둡게 얼룩진다', body: '`pow(abs(N), 날카로움)` 의 세 값은 합이 1 이 아니다. 날카로움이 2 보다 크면 합이 1 보다 작아져 경계가 어두워지고, 1 이면 1 보다 커져 밝아진다. 세 값의 합으로 나눠 정규화한다.' },
    { title: '움직이는 물체 위로 무늬가 미끄러진다', body: '월드 좌표로 투영하면 무늬가 공간에 고정되어 물체가 움직이거나 돌 때 표면 위를 흐른다. 지형, 절벽처럼 움직이지 않는 것에만 쓰고, 움직이는 소품은 오브젝트 공간을 고른다. 이 무대의 상자를 월드와 오브젝트로 번갈아 보면 확인할 수 있다.' },
    { title: '비스듬히 돌린 평평한 면에 줄눈이 이중으로 비친다', body: '월드 공간에서 축과 비스듬히 놓인 면은 법선이 두 축 사이에 있어 두 투영이 겹쳐 보인다. 섞임 날카로움이 낮을수록 넓게 겹친다. 날카로움을 올려 한 투영으로 빨리 넘어가게 한다. 상자처럼 면이 오브젝트 축에 맞춰 만들어진 소품은 오브젝트 공간으로 바꾸면 물체가 돌아도 겹치지 않는다.' },
    { title: '크기를 키우면 돌도 커지거나 한쪽으로 늘어난다', body: '오브젝트 공간 투영은 Transform 의 Scale 을 함께 받는다. 균일하게 키우면 돌도 커지고, 한 축만 키우면 그 방향으로 늘어난다. 크기가 제각각인 바위에 같은 돌 크기를 원하면 월드 공간을 쓴다.' },
  ],
  unity: {
    setup: [
      '`TriplanarProjection.shader`, `core.hlsl`, `TriplanarTiles.png` 를 `Assets/Shaders/triplanar-projection/` 에 둔다.',
      'Project 창에서 `TriplanarTiles.png` 를 고르고 Inspector 에서 Texture Type 은 Default, sRGB (Color Texture) 는 켜고, Wrap Mode 는 Repeat, Filter Mode 는 Bilinear 로 맞춘 뒤 Apply 를 누른다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고, 타일 텍스처 칸에 `TriplanarTiles.png` 를 넣는다.',
      '머티리얼을 절벽, 바위, 상자 같은 MeshRenderer 에 넣는다. UV 가 없거나 엉망인 메시여도 된다.',
      '움직이지 않는 지형이면 투영 공간을 World, 움직이거나 도는 소품이면 Object 로 둔다.',
    ],
    verify: '투영 공간이 World 이면 한 축으로 길게 늘린 큐브나 원기둥에 넣어도 옆면의 돌이 늘어나지 않는다 (Object 에서는 Scale 을 따라 늘어나는 것이 정상이다). 물체를 Y 축으로 돌리면 World 에서는 무늬가 표면 위를 미끄러지고 Object 에서는 함께 돈다. 섞임 날카로움을 1 로 내리면 둥글거나 비스듬한 면에서 줄눈이 이중으로 비친다.',
    pitfalls: [
      '이 셰이더는 불투명 3D 메시용이다. 패스가 `UniversalForwardOnly` 라 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트에서 쓴다.',
      '타일 텍스처 칸이 비어 있으면 무늬 없이 흰 단색으로 보이고, Wrap Mode 가 Clamp 로 남아 있으면 0~1 밖의 좌표에서 가장자리 픽셀이 길게 번진다.',
      'Static 으로 표시해 정적 배칭되면 여러 메시가 하나로 합쳐지며 정점이 월드 위치로 구워진다. 이때 Object 공간 무늬는 원래 모양과 달라진다. 정적 배칭되는 지형과 바위에는 World 를 쓴다.',
      '텍스처를 세 번 읽으므로 일반 텍스처 재질보다 비싸다. 모바일에서 넓은 지형에 쓸 때는 가중치가 거의 0 인 축의 샘플을 건너뛰는 식의 최적화를 고려한다.',
      '반대쪽 면(예: +X 와 -X)은 같은 좌표를 쓰므로 무늬가 좌우로 뒤집혀 보인다. 돌 타일처럼 방향이 없는 무늬는 티가 나지 않지만 글자나 화살표는 뒤집힌다. 그럴 때는 법선 부호(`sign`)로 그 축의 u 를 뒤집는다. 노멀맵을 같은 식으로 섞으면 이 뒤집힘과 투영 평면마다 다른 탄젠트 방향 때문에 조명이 엉뚱해진다. 축마다 성분 순서를 바꿔 월드 법선으로 돌린 뒤 섞는다 (whiteout, reoriented 블렌딩. 참고 자료의 Ben Golus 글).',
      '월드 좌표가 아주 큰 곳(원점에서 수 km)에서는 실수 정밀도가 떨어져 무늬가 떨린다. 큰 월드에서는 타일 크기 단위로 원점을 옮기거나 오브젝트 공간을 쓴다.',
    ],
    graph: 'Shader Graph 에는 같은 일을 하는 Triplanar 노드가 있다. Tile 이 타일 배율(이 표본의 타일 크기의 역수), Blend 가 섞임 날카로움이다. Position 과 Normal 입력에 Object 공간 Position, Normal Vector 노드를 넣으면 오브젝트 공간 투영이 된다. 가중치만 다른 계산에 쓰려면 `core.hlsl` 을 Custom Function 에 그대로 지정하지 않는다. `SgInput`, `SG_TEX`, `_TileTex` 가 `.shader` 래퍼에만 있어 컴파일되지 않는다. `triplanarWeights` 본문만 `TriplanarWeights.hlsl` 같은 새 파일에 복사해 `void TriplanarWeights_float(float3 N, float S, out float3 W)` 로 감싼다. Custom Function 노드의 Type 은 File, Source 는 그 파일, Name 은 `_float` 를 뺀 `TriplanarWeights` 로 두고, 입력 N 에 Normal Vector, S 에 날카로움 값을 넣어 출력 W 를 쓴다.',
  },
  prompt: {
    goal: '메시의 UV 와 상관없이 세 축에서 텍스처를 투영해 섞는 삼평면 투영 셰이더를 넣는다. 절벽과 원기둥 옆면에서도 텍스처가 늘어나지 않고, 월드와 오브젝트 공간을 머티리얼에서 고를 수 있다.',
    adaptIdeas: [
      '윗면에는 잔디, 옆면에는 바위 텍스처가 나오게 하고 싶다.',
      '노멀맵도 삼평면으로 입혀 돌 줄눈에 음영이 지게 하고 싶다.',
      '텍스처 세 번 읽기가 부담돼 모바일용으로 가볍게 하고 싶다.',
      '눈이 위에서 쌓인 것처럼 윗면에만 흰색을 덮고 싶다.',
      '글자가 들어간 텍스처가 뒤쪽 면에서 뒤집히지 않게 하고 싶다.',
    ],
  },
  captures: [
    { name: 'wide-blend', label: '넓게 섞기', values: { _BlendSharpness: 1 } },
    { name: 'large-tiles', label: '큰 타일', values: { _TileSize: 2.5 } },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 수업 3D 07 External Assets 에서 쓰는 Synty `POLYGON_Triplanar` 머티리얼과 같은 원리를 HLSL 로 풀어 보였다. 돌 타일 텍스처와 코드는 이 갤러리에서 새로 만들었다.',
  references: [
    { label: 'Shader Graph Feature Examples (삼평면, 이평면 예제)', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Feature-Examples.html' },
    { label: 'Shader Graph 문서: Triplanar 노드', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.0/manual/Triplanar-Node.html' },
    { label: 'Ben Golus: Normal Mapping for a Triplanar Shader', url: 'https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a' },
  ],
  related: [
    { id: 'dissolve-edge-glow', why: 'UV 대신 오브젝트 공간 위치로 노이즈를 만들어 이음매를 없앤 같은 발상' },
    { id: 'fresnel-rim-glow', why: '월드 법선과 오브젝트 법선을 섞어 쓰면 생기는 실수를 다른 효과로 본다' },
  ],
}
