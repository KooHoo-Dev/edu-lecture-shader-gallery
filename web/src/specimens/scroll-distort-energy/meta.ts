import type { SpecimenMeta } from '../../core/types'

const LASER = { _EnergyColor: '#ff4a3d', _ScrollSpeed: 2.5, _Tiling: 0.6, _DistortStrength: 0.03, _EdgeFade: 0.06, _Intensity: 4 }
const MAGIC = { _EnergyColor: '#b46bff', _ScrollSpeed: 0.35, _Tiling: 0.8, _DistortStrength: 0.32, _EdgeFade: 0.45, _Intensity: 2.2 }

export const meta: SpecimenMeta = {
  id: 'scroll-distort-energy',
  title: '스크롤·왜곡 에너지',
  titleEn: 'Scroll Distort Energy',
  group: 'D',
  order: 4,
  oneLiner: '흐르는 무늬를 겹쳐 레이저와 마법 기운을 만든다',
  goals: [
    'UV 에 시간을 더해 텍스처를 흘리고, 크기와 방향이 다른 두 레이어를 겹쳐 무늬가 계속 바뀌게 할 수 있다.',
    '노이즈 값을 `-0.5~0.5` 로 바꿔 UV 에 더하는 왜곡으로 곧은 흐름을 일렁이게 할 수 있다.',
    '메시 끝으로 갈수록 0 이 되는 마스크로 경계가 잘려 보이지 않게 할 수 있다.',
    '더하기 혼합과 1 을 넘는 HDR 색이 발광 효과에 쓰이는 이유를 설명할 수 있다.',
  ],
  tags: ['UV 스크롤', 'UV 왜곡', '노이즈 텍스처', '더하기 혼합', 'HDR'],
  difficulty: 2,
  shaderFile: 'ScrollDistortEnergy.shader',
  stage: {
    kind: 'mesh',
    mesh: 'cylinder',
    blend: 'additive',
    doubleSided: true,
    textures: { _NoiseTex: { file: 'ScrollDistortNoise.png', linear: true, repeat: true } },
  },
  params: [
    { key: '_EnergyColor', label: '에너지 색', type: 'color', default: '#29b6ff', hint: '밝기를 곱하기 전의 색. 밝은 곳은 큰 채널부터 1 을 넘어 잘리므로 옅은 색이 된다' },
    { key: '_Intensity', label: '밝기 (HDR)', type: 'range', min: 0, max: 6, step: 0.05, default: 2.5, hint: '색에 곱하는 배율. 1 보다 크면 HDR 값이라 URP Bloom 을 켜면 주변으로 번진다' },
    { key: '_ScrollSpeed', label: '흐름 속도', type: 'range', min: 0, max: 3, step: 0.05, default: 0.8, hint: '두 레이어와 왜곡이 함께 빨라진다. 0 이면 무늬가 멈춘다' },
    { key: '_Tiling', label: '무늬 길이 반복', type: 'range', min: 0.5, max: 4, step: 0.05, default: 1.5, hint: '원통 길이 방향으로 텍스처를 몇 번 반복하는지. 클수록 결이 짧고 촘촘하다' },
    { key: '_DistortStrength', label: '왜곡 세기', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.12, hint: '노이즈로 UV 를 미는 양. 0 이면 두 레이어가 곧게 미끄러지고, 크면 연기처럼 일렁인다' },
    { key: '_EdgeFade', label: '끝단 흐림 길이', type: 'range', min: 0.02, max: 0.5, step: 0.01, default: 0.3, hint: '원통 길이를 1 로 볼 때 양 끝에서 이만큼에 걸쳐 사라진다. 작으면 끝이 또렷하게 끊긴다' },
  ],
  presets: [
    { id: 'energy-pillar', name: '에너지 기둥', look: '푸른 기운이 위아래로 엇갈려 흐르고 양 끝이 부드럽게 사라진다', values: {} },
    { id: 'laser', name: '레이저 빔', look: '붉고 빠르며 결이 곧다. 끝단이 짧게 끊긴다', values: LASER },
    { id: 'magic-aura', name: '마법 기운', look: '보랏빛 기운이 느리게 크게 일렁이며 끝이 길게 흐려진다', values: MAGIC },
  ],
  events: [],
  demo: {
    // 왜곡 세기를 오가며 곧게 미끄러지는 흐름과 일렁이는 흐름을 번갈아 보여 준다.
    // 흐름 속도는 시간에 곱하는 값이라 움직이면 무늬가 앞뒤로 튀므로 데모로 쓰지 않는다.
    loops: [{ key: '_DistortStrength', frames: [[0, 0.12], [2.5, 0.35], [4, 0.35], [6.5, 0.01], [8, 0.01], [10, 0.12]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: '레이어 하나', body: '노이즈 텍스처 한 장을 UV 에 시간을 더해 위로 흘린다. 같은 무늬가 통째로 미끄러질 뿐 모양은 변하지 않아 컨베이어 벨트처럼 보인다. 텍스처의 결이 세로로 길어 원통 길이 방향으로 뻗는다. 단계 보기는 더하지 않고 값을 그대로 그려 앞면만 보인다. 아직 끝단 마스크가 없어 무늬가 원통 위아래 끝까지 꽉 찬다.' },
    { n: 2, label: '두 레이어 겹침', body: '같은 텍스처를 더 잘게, 아래로 흐르게 한 장 더 읽어 곱한다. 두 무늬의 밝은 곳이 겹치는 자리만 남아 무늬가 계속 바뀐다. 다만 결이 아직 곧아 두 장이 기계적으로 엇갈리는 것이 보인다.' },
    { n: 3, label: '왜곡', body: '같은 텍스처를 크게, 느리게 흘려 읽은 값으로 두 레이어의 UV 를 흔든다. 곧던 결이 굽고 일렁여 기운처럼 보인다. 왜곡 세기를 0 으로 내리면 2단계와 같아진다.' },
    { n: 4, label: '끝단 마스크', body: '원통 길이 방향 위치로 만든 마스크다. 가운데는 희고 위아래 끝으로 갈수록 어두워져 맨 끝에서는 검다. 끝단 흐림 길이를 줄이면 어두운 띠가 좁아진다. 이 값을 알파로 내보내 끝에서는 아무것도 더하지 않게 한다. 기본 화면에서 원통 윗끝과 바닥 쪽이 부드럽게 사라지는 것이 이 마스크 덕분이다.' },
  ],
  offNote: '끝단 마스크를 빼먹은 모습. 원통 위아래 끝이 칼로 자른 듯 끊기고, 바닥에 닿은 자리도 각진 테두리가 그대로 보여 빛이 아니라 빛나는 통처럼 보인다.',
  mistakes: [
    { title: '원통 끝이 칼로 자른 듯 끊긴다', body: '알파를 1 로 두거나 끝단 마스크를 곱하지 않으면 메시 경계가 그대로 보인다. 길이 방향 좌표로 `smoothstep` 마스크를 만들어 알파에 곱한다. 뚜껑(캡)이 있는 원통은 뚜껑까지 마스크가 0 이 되도록 UV 대신 오브젝트 높이로 마스크를 만든다.' },
    { title: '둘레 한 줄에 세로 이음매가 생긴다', body: '원통 UV 는 둘레를 한 바퀴 돌아 u 가 1 에서 0 으로 돌아온다. 둘레 방향 타일 수가 정수가 아니면 그 자리에서 무늬가 끊긴다. 둘레 반복은 2, 3 처럼 정수로 둔다. 텍스처 자체도 반복해도 이음매가 없는 것을 쓴다.' },
    { title: '흐름 속도를 스크립트로 바꾸면 무늬가 튄다', body: '흐른 거리를 `_Time.y * 속도` 로 구하므로 실행 중에 속도를 바꾸면 그동안 흐른 시간 전체에 변화량이 곱해져 무늬가 한 번에 건너뛴다. 오래 켜 둘수록 크게 튄다. 속도를 연출로 바꾸려면 C# 에서 `offset += speed * Time.deltaTime` 으로 오프셋을 쌓아 머티리얼에 넘기고, 셰이더는 `_Time.y * 속도` 대신 그 값을 쓴다. 쌓은 값은 레이어 배율(0.7, 0.35)을 곱해도 정수가 되는 주기로 감싼다 (`Mathf.Repeat(offset, 20f)`). Inspector 에서 슬라이더를 끌 때 튀는 것도 같은 이유다.' },
    { title: '끝이 끊기거나 줄무늬가 길게 번진다', body: '텍스처의 Wrap Mode 가 Clamp 이면 UV 가 0~1 을 넘는 순간 가장자리 픽셀이 길게 늘어난다. 흘리는 텍스처는 Repeat 로 둔다. 노이즈는 색이 아니라 데이터이므로 sRGB 도 끈다. 켜 두면 값이 어둡게 휘어 무늬가 어둡고 가늘어진다.' },
    { title: '빛나지 않고 뿌옇게 덮인다', body: '알파 혼합(`Blend SrcAlpha OneMinusSrcAlpha`)이면 뒤를 가리며 섞여 탁해진다. 발광 효과는 `Blend SrcAlpha One` 으로 더한다. Bloom 으로 번지게 하려면 색이 1 을 넘어야 하므로 밝기 값을 1 보다 크게 둔다.' },
  ],
  unity: {
    setup: [
      '`ScrollDistortEnergy.shader`, `core.hlsl`, `ScrollDistortNoise.png` 를 `Assets/Shaders/scroll-distort-energy/` 에 둔다.',
      'Project 창에서 `ScrollDistortNoise.png` 를 고르고 Inspector 에서 Texture Type 은 Default, sRGB (Color Texture) 는 끄고, Wrap Mode 는 Repeat, Filter Mode 는 Bilinear 로 맞춘 뒤 Apply 를 누른다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고, 노이즈 텍스처 칸에 `ScrollDistortNoise.png` 를 넣는다.',
      'Hierarchy 에서 3D Object > Cylinder 를 만들고 머티리얼을 넣는다. 이 셰이더에는 ShadowCaster 패스가 없어 원래 그림자를 만들지 않으므로, 그림자 계산에서 빼려면 Mesh Renderer 의 Cast Shadows 를 Off 로 둔다. 필요 없으면 Capsule Collider 를 지운다.',
      '빛 번짐을 보려면 Volume 에 Bloom 을 추가하고 카메라의 Post Processing 을 켠다. 레이저처럼 길게 쓰려면 Transform 의 Scale Y 를 키운다.',
    ],
    verify: '원통 위아래 끝이 부드럽게 사라지고, 무늬가 위아래로 엇갈려 흐르며 일렁인다. 왜곡 세기를 0 으로 내리면 결이 곧게 미끄러지고, 끝단 흐림 길이를 0.02 로 내리면 끝이 또렷하게 끊긴다.',
    pitfalls: [
      '이 셰이더에는 `UniversalForward` 패스 하나만 있어 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트용 효과다. 2D 에서 같은 원리를 쓰려면 스프라이트 셰이더로 옮긴다.',
      '노이즈 텍스처 칸이 비어 있으면 `linearGrey`(선형 0.5)가 들어가 무늬와 왜곡 없이 고르게 빛나는 통이 된다. 셰이더를 고쳐 기본값을 `"gray"` 로 두면 Linear 프로젝트에서 약 0.21 로 읽혀 희미한 통만 보인다. 텍스처의 sRGB 가 켜져 있으면 무늬가 어둡고 가늘어진다.',
      'Bloom 과 톤매핑이 없으면 1 을 넘는 색은 채널마다 1 에서 잘려 번지지 않는다. 기본 색은 파랑과 초록만 1 에 닿아 흰빛까지 가지 않고 옅은 하늘색에서 멈춘다. 카메라의 Post Processing 과 URP Asset 의 HDR 이 켜져 있어야 HDR 값이 Bloom 까지 간다.',
      '투명 물체라 깊이를 쓰지 않는다. 투명 효과끼리 겹치면 물체 단위로 정렬되어 순서가 어긋날 수 있지만 더하기 혼합은 순서와 상관없이 결과가 같아 대개 티가 나지 않는다. 안개도 처리하지 않아 Lighting 창에서 Fog 를 켠 씬에서도 먼 빔이 흐려지지 않고 그대로 밝다. 넓은 공간에 쓰면 래퍼에 안개를 넣는다 (변형 예시 참고).',
      '끝단 마스크와 흐름은 오브젝트 공간 y 축(높이 -1~1)을 따른다. 레이저처럼 눕히려면 Transform 의 Rotation 으로 돌린다. Batching Static 으로 정적 배칭되면 정점이 월드 좌표로 합쳐져 마스크 위치가 어긋나므로 이 물체는 Static 에서 뺀다.',
      '둘레 방향은 메시 UV 의 u 를 쓴다. 높이가 2 가 아니거나 UV 를 다르게 편 메시(직접 만든 리본, 원뿔)는 마스크가 끝에 맞지 않거나 무늬가 옆으로 흐를 수 있다. 다른 메시에 쓸 때는 끝단 마스크가 양 끝에서 0 이 되는지, 무늬가 길이 방향으로 흐르는지 먼저 본다.',
    ],
    graph: 'Shader Graph 로 옮기려면 먼저 Position 노드(Space 는 Object)의 y 에 Multiply 0.5, Add 0.5 를 해 높이 -1~1 을 길이 좌표 0~1 로 바꾸고, UV 노드의 x 와 Combine 해 레이어의 기본 좌표로 쓴다. Time 노드에 속도를 곱해 Tiling And Offset 노드의 Offset y 에 넣은 레이어 두 개(부호를 반대로, 둘레 Tiling 은 2 와 3 처럼 정수)를 Multiply 로 곱한다. 왜곡은 노이즈를 한 번 더 읽어 0.5 를 빼고 세기를 곱한 값을 두 레이어의 UV 에 Add 한다. 끝단 마스크는 같은 길이 좌표와 One Minus 한 길이 좌표로 Smoothstep(0~끝단 흐림 길이) 두 개를 만들어 곱하고 Alpha 에 넣는다. Graph Settings 는 Surface Type Transparent, Blending Mode Additive, Render Face Both 로 둔다.',
  },
  prompt: {
    goal: '원통 메시에 반대로 흐르는 노이즈 두 장과 UV 왜곡, 끝단 마스크, HDR 색을 겹쳐 레이저나 마법 기운처럼 빛나는 투명 효과를 넣는다.',
    adaptIdeas: [
      '레이저를 쏠 때 굵기와 밝기가 잠깐 커졌다가 줄어들게 하고 싶다.',
      '무늬가 위로 흐르면서 원통 둘레를 따라 비틀려 돌아가는 회오리로 바꾸고 싶다.',
      '아래쪽은 흰색, 위쪽은 색이 짙어지게 길이 방향 그라데이션을 넣고 싶다.',
      '바닥에 깔리는 원형 마법진(평면 메시)에 같은 효과를 쓰고 싶다.',
      '스크립트에서 시작점과 끝점을 정하면 그 사이로 빔이 늘어나게 하고 싶다.',
      'Fog 를 켠 넓은 씬에서 멀리 있는 빔이 안개 속으로 흐려지게 하고 싶다. 더하기 혼합이라 안개 색이 아니라 0 으로 사라져야 하므로 래퍼에서 `MixFogColor(color, half3(0, 0, 0), fogFactor)` 를 쓴다 (`#pragma multi_compile_fog` 와 정점의 `ComputeFogFactor(positionCS.z)` 가 함께 필요하다).',
    ],
  },
  captures: [
    { name: 'laser', label: '레이저 빔', values: LASER },
    { name: 'magic-aura', label: '마법 기운', values: MAGIC },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 수업 3D 07 External Assets 의 FORGE3D `Additive` 그래프와 2D 의 MagicArsenal 이펙트가 쓰는 원리(흐르는 텍스처, 왜곡, 끝단 마스크, 더하기 혼합)를 HLSL 로 풀어 보였다. 노이즈 텍스처와 코드는 이 갤러리에서 새로 만들었다.',
  references: [
    { label: 'GDC 2021 Visual Effects Summit: Shader Sauce', url: 'https://gdcvault.com/play/1027131/Visual-Effects-Summit-Shader-Sauce' },
    { label: 'Unity e-book: Unity 6 URP 셰이더와 시각 효과 만들기', url: 'https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6' },
  ],
  related: [
    { id: 'force-field-intersection', why: '같은 더하기 혼합 투명 효과. 깊이로 닿은 선을 밝히는 짝' },
    { id: 'dissolve-edge-glow', why: '노이즈와 HDR 발광 띠를 임계값으로 쓰는 짝' },
  ],
}
