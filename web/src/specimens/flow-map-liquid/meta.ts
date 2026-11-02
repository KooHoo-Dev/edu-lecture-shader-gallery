import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'flow-map-liquid',
  title: '플로 맵 액체',
  titleEn: 'Flow Map Liquid',
  group: 'C',
  order: 3,
  oneLiner: '방향 텍스처로 UV 를 흘려 액체를 만든다',
  goals: [
    '플로 맵의 RG 값을 -1~1 방향으로 되돌려 UV 를 흘리는 원리를 설명할 수 있다.',
    '`frac(time)` 위상 하나만 쓰면 무늬가 늘어나다 튀는 이유와, 반 주기 어긋난 두 위상을 삼각파 가중치로 섞어 그 순간을 숨기는 방법을 설명할 수 있다.',
    '위상에 노이즈를 더해 끊김이 표면 전체에 한꺼번에 몰리지 않게 할 수 있다.',
    '플로 맵 텍스처를 sRGB 를 끈 데이터 텍스처로 들여와 용암, 강물, 마법 액체에 쓸 수 있다.',
  ],
  tags: ['플로 맵', 'UV 왜곡', '위상 섞기', '노이즈', '데이터 텍스처'],
  difficulty: 2,
  shaderFile: 'FlowMapLiquid.shader',
  stage: {
    kind: 'mesh',
    mesh: 'plane',
    blend: 'cutout',
    textures: {
      _FlowTex: { file: 'FlowMapLiquidFlow.png', linear: true, repeat: true },
      _PatternTex: { file: 'FlowMapLiquidPattern.png', repeat: true },
    },
  },
  params: [
    { key: '_FlowStrength', label: '흐름 세기', type: 'range', min: 0, max: 0.4, step: 0.01, default: 0.12, hint: '한 주기 동안 무늬가 밀려 가는 거리(평면 한 변에 대한 비율). 크면 멀리 흐르는 대신 무늬가 길게 늘어나고 찢어진다. 0 이면 멈춘다' },
    { key: '_Speed', label: '속도', type: 'range', min: 0, max: 2, step: 0.05, default: 0.5, hint: '1초에 도는 주기 수. 세기를 그대로 두고 올리면 같은 늘어남으로 더 빨리 흐른다' },
    { key: '_PatternScale', label: '무늬 반복 수', type: 'range', min: 1, max: 8, step: 0.5, default: 3, hint: '평면 한 변에 무늬 텍스처가 몇 번 반복되는지. 클수록 세포가 잘다. 흐르는 거리는 그대로라 무늬에 견줘 더 많이 늘어난다' },
    { key: '_PhaseNoise', label: '위상 노이즈', type: 'range', min: 0, max: 1, step: 0.05, default: 1, hint: '자리마다 위상을 어긋나게 하는 양. 0 이면 표면 전체가 같은 순간에 흐려졌다 또렷해지기를 되풀이한다' },
    { key: '_DeepColor', label: '어두운 색', type: 'color', default: '#2b0a05', hint: '무늬의 어두운 부분 (용암의 식은 껍질, 깊은 물)' },
    { key: '_BrightColor', label: '밝은 색', type: 'color', default: '#ff6a14', hint: '무늬의 밝은 실금 (용암의 갈라진 틈, 물의 거품)' },
    { key: '_Glow', label: '밝은 부분 발광', type: 'range', min: 0, max: 4, step: 0.1, default: 1.5, hint: '밝은 색을 조명과 상관없이 더한다. 용암은 높게, 물은 0 으로 둔다. 1 보다 크면 URP 블룸을 켰을 때 번진다' },
  ],
  presets: [
    { id: 'lava', name: '용암', look: '검붉은 껍질 사이 주황 틈이 소용돌이를 따라 천천히 늘어난다', values: {} },
    { id: 'river-water', name: '강물', look: '짙은 파랑 위로 밝은 거품 줄이 더 빨리 흘러간다', values: { _DeepColor: '#0b2f4a', _BrightColor: '#9be3ff', _Glow: 0, _Speed: 0.8, _PatternScale: 4 } },
    { id: 'magic-potion', name: '마법 물약', look: '보랏빛 액체에 빛나는 줄이 세게 휘감긴다', values: { _DeepColor: '#160a33', _BrightColor: '#c06bff', _Glow: 2.2, _FlowStrength: 0.22 } },
    { id: 'slow-swamp', name: '느린 늪', look: '탁한 녹색이 거의 멈춘 듯 느리게 돈다', values: { _DeepColor: '#1a2410', _BrightColor: '#7f9a3c', _Glow: 0, _Speed: 0.2, _FlowStrength: 0.06, _PatternScale: 2 } },
  ],
  events: [],
  demo: {
    // 흐름 세기를 오가며 무늬가 거의 멈춘 모습과 길게 늘어나는 모습을 번갈아 보여 준다.
    loops: [{ key: '_FlowStrength', frames: [[0, 0.12], [3, 0.3], [4.5, 0.3], [7.5, 0.04], [9, 0.04], [11, 0.12]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: '플로 맵', body: '플로 맵 텍스처의 R, G 를 그대로 색으로 본다. R 은 u(화면 오른쪽), G 는 v(화면 안쪽) 방향 흐름이고 0.5 가 멈춤이다. 멈춘 곳은 앞쪽 가장자리처럼 노랗게 보인다. 앞쪽 가운데의 주황은 오른쪽으로, 오른쪽의 연두는 안쪽으로, 먼 쪽의 초록은 왼쪽으로, 왼쪽의 빨강은 카메라 쪽으로 흐른다는 뜻이다. 이어 보면 위에서 내려다볼 때 가운데를 중심으로 반시계 방향으로 도는 소용돌이다.' },
    { n: 2, label: '위상 하나', body: '첫 번째 위상 하나로만 무늬를 흘린 밝기다. 위상이 0 에서 1 로 가는 동안 세포 무늬가 흐름을 따라 밀리며 늘어나다가, 위상이 0 으로 돌아가는 순간 원래 모양으로 튄다. 위상 노이즈 때문에 튀는 때가 자리마다 달라서, 화면에는 늘어난 무늬와 반듯한 무늬가 가는 경계선을 사이에 두고 붙어 있고 그 경계가 표면 위를 훑고 지나간다.' },
    { n: 3, label: '두 위상 섞기', body: '반 주기 어긋난 두 번째 층을 삼각파 가중치로 섞었다. 한 층이 튀는 자리에서는 그 층의 가중치가 0 이라 2단계의 경계선이 사라진다. 대신 두 층이 반반 섞이는 곳은 실금이 두 겹으로 겹쳐 조금 흐리다. 위상 노이즈를 0 으로 내리면 이 겹침이 표면 전체에 같은 순간에 와서 화면이 주기적으로 통째로 흐려진다. 이 밝기로 두 색을 섞고 조명과 발광을 더하면 최종 화면이다.' },
  ],
  offNote: '위상 `frac(time * 속도)` 하나만 쓰고 위상 노이즈도 뺀 흔한 실수다. 무늬가 소용돌이를 따라 늘어나다가 한 주기(속도 0.5 면 2초)마다 표면 전체가 한꺼번에 처음 무늬로 튄다. 막 튄 뒤에는 세포가 반듯하고 튀기 직전에는 길게 늘어져 있어 몇 초만 보면 반복 주기가 드러난다. 이 표본은 알파가 항상 1 이라 그림자는 효과를 켰을 때와 같다.',
  mistakes: [
    { title: '무늬가 몇 초마다 한꺼번에 원래대로 튄다', body: '`frac(time)` 위상 하나로만 UV 를 밀면 위상이 1 에서 0 으로 돌아가는 순간 무늬가 처음 자리로 돌아간다. 반 주기 어긋난 위상을 하나 더 두고 `1 - abs(1 - 2 * phase)` 삼각파 가중치로 섞으면, 한 층이 튀는 순간 그 층의 가중치가 0 이라 보이지 않는다.' },
    { title: '흐름이 한쪽으로 쏠리고 멈춰야 할 곳도 움직인다', body: '플로 맵을 sRGB(Color Texture)로 들여오면 0.5 가 약 0.21 로 읽혀 모든 자리에 왼쪽 아래로 미는 흐름이 더해진다. 플로 맵 텍스처의 Inspector 에서 sRGB (Color Texture) 를 끈다. RG 값을 `* 2 - 1` 로 되돌리는 것도 잊지 않는다.' },
    { title: '표면 전체가 주기적으로 흐려졌다 또렷해진다', body: '두 위상을 섞어도 위상이 모든 자리에서 같으면 두 층이 반반 섞이는 순간(위상 0.25, 0.75)이 한꺼번에 와 무늬가 통째로 흐려진다. 위상에 노이즈를 더해 자리마다 그 순간을 다르게 한다. 위상 노이즈를 0 으로 내려 비교해 본다.' },
    { title: '무늬가 길게 찢어져 알아볼 수 없다', body: '흐름 세기가 크면 한 주기 동안 이웃 자리끼리 밀리는 거리 차이가 커져 무늬가 늘어진다. 세기를 낮추고 속도를 올려 같은 빠르기를 낸다. 무늬 반복 수를 올려도 무늬에 견줘 늘어남이 커진다.' },
    { title: '평면 가장자리나 이웃 타일 사이에 줄이 생긴다', body: '플로 맵이나 무늬 텍스처의 Wrap Mode 가 Clamp 이거나, 플로 맵이 가장자리에서 이어지지 않게 그려졌다. 두 텍스처를 Repeat 로 두고, 플로 맵은 왼쪽과 오른쪽, 위와 아래 가장자리의 흐름이 맞게 만든다.' },
  ],
  unity: {
    setup: [
      '`FlowMapLiquid.shader`, `core.hlsl`, `FlowMapLiquidFlow.png`, `FlowMapLiquidPattern.png` 를 `Assets/Shaders/flow-map-liquid/` 에 둔다.',
      'Project 창에서 `FlowMapLiquidFlow.png` 를 고르고 Inspector 에서 Texture Type 은 Default, sRGB (Color Texture) 는 끄고, Wrap Mode 는 Repeat, Filter Mode 는 Bilinear 로 맞춘 뒤 Apply 를 누른다. 방향 데이터라 압축 품질이 낮으면 흐름이 계단처럼 끊기므로 Compression 은 None 이나 High Quality 로 둔다.',
      '`FlowMapLiquidPattern.png` 는 Texture Type 은 Default, sRGB (Color Texture) 는 켜고, Wrap Mode 는 Repeat, Filter Mode 는 Bilinear 로 맞춘 뒤 Apply 를 누른다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고 플로 맵 칸에 `FlowMapLiquidFlow.png`, 흘릴 무늬 칸에 `FlowMapLiquidPattern.png` 를 넣는다.',
      'GameObject > 3D Object > Plane 을 만들어 머티리얼을 넣는다. 용암이면 그대로, 물이면 어두운 색과 밝은 색을 파랑 계열로 바꾸고 밝은 부분 발광을 0 으로 내린다.',
    ],
    verify: 'Play 하거나 Scene 뷰의 Always Refresh 를 켜면 무늬가 평면 가운데를 중심으로 소용돌이치며 흐르고, 몇 초를 지켜봐도 무늬가 한꺼번에 원래대로 튀지 않는다. 흐름 세기를 0 으로 내리면 무늬가 멈추고, 0.4 로 올리면 길게 늘어난다.',
    pitfalls: [
      '이 셰이더는 불투명 3D 메시용이다. 패스가 `UniversalForwardOnly` 라 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트에서 쓴다.',
      '흐름 방향은 메시 UV 기준이다. 같은 플로 맵이라도 UV 가 돌아 있거나 뒤집힌 메시에서는 흐름 방향이 달라진다. Unity 기본 Plane 은 UV 가 다른 메시와 다르게 놓여 있을 수 있으니, 강처럼 방향이 있는 플로 맵은 넣은 뒤 흐르는 쪽을 눈으로 확인하고 필요하면 텍스처를 돌리거나 R, G 부호를 바꾼다. 이 표본의 소용돌이는 UV 가 180도 돌아도 같은 쪽으로 돈다.',
      'Scene 뷰에서 무늬가 멈춰 있으면 Scene 뷰 툴바의 Effects 메뉴(Toggle skybox, fog, and various other effects)에서 Always Refresh 를 켠다. `_Time` 은 편집 모드에서 화면을 다시 그릴 때만 나아간다.',
      '플로 맵 압축(모바일 ASTC, ETC 저품질)은 방향 값을 뭉개 흐름이 덩어리지게 한다. 작은 해상도(64~128)로 두고 압축 품질을 높이는 편이 낫다.',
      '평면 하나에 플로 맵이 한 번 깔린다. 평면을 크게 키우면 소용돌이도 함께 커진다. 넓은 강은 플로 맵을 강 모양에 맞춰 새로 그리거나 메시 UV 를 강 줄기를 따라 펴서 쓴다.',
    ],
    graph: 'Shader Graph 의 Feature Examples 샘플에 Flow Mapping 예제가 있다. 직접 만들 때는 Sample Texture 2D(플로 맵, Type 을 Normal 이 아닌 Default, sRGB 끈 텍스처)에서 RG 를 꺼내 `* 2 - 1` 하고, Time 노드에 Fraction 노드를 두 번(하나는 0.5 를 더해서) 걸어 위상 두 개를 만든다. 두 위상으로 UV 를 각각 밀어 무늬를 두 번 읽고, `1 - abs(1 - 2 * 위상)` 가중치로 Lerp 한다. `core.hlsl` 을 Custom Function 에 그대로 지정하면 `SgInput`, `SG_TEX` 가 래퍼에만 있어 컴파일되지 않으므로, 쓰려면 `flowWeight` 같은 함수만 새 파일에 옮긴다.',
  },
  prompt: {
    goal: '방향을 담은 플로 맵 텍스처로 무늬를 흘려 용암이나 강물 표면을 만드는 셰이더를 넣는다. 무늬가 주기마다 튀지 않고 끊김 없이 계속 흐른다.',
    adaptIdeas: [
      '노멀맵도 같은 위상으로 흘려 물결에 빛이 반사되게 하고 싶다.',
      '강 모양으로 굽이치는 플로 맵을 직접 그리고 싶다.',
      '용암이 식은 곳은 덜 흐르게 정점 색으로 흐름 세기를 칠하고 싶다.',
      '물체 주변을 피해 돌아가는 흐름을 만들고 싶다.',
      '모바일에서 텍스처 읽기를 줄여 가볍게 하고 싶다.',
    ],
  },
  captures: [
    { name: 'river-water', label: '강물', values: { _DeepColor: '#0b2f4a', _BrightColor: '#9be3ff', _Glow: 0, _Speed: 0.8, _PatternScale: 4 } },
    { name: 'strong-flow', label: '센 흐름', values: { _FlowStrength: 0.32 } },
  ],
  inspiredBy: [
    {
      title: 'Portal 2 (2011)',
      credit: 'Valve',
      borrowed: ['플로 맵으로 흘리는 물 표면', '반 주기 어긋난 두 위상 섞기'],
      learned: 'SIGGRAPH 2010 발표가 플로 맵으로 물 표면 UV 를 흘리고, 위상 두 벌을 섞어 반복 끊김을 숨기고, 위상에 노이즈를 더해 끊김이 몰리지 않게 하는 과정을 단계별로 보여 준다. 이 표본의 단계 보기와 위상 노이즈 값이 이 흐름을 따른다.',
      link: 'https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf',
    },
    {
      title: 'Left 4 Dead 2 (2009)',
      credit: 'Valve',
      borrowed: ['흐름 방향을 담은 데이터 텍스처'],
      learned: 'Portal 2 의 물 흐름은 Left 4 Dead 2 셰이더의 확장이라고 Valve 가 발표했다. GDC 2011 발표는 색이 아닌 값을 담은 텍스처를 다루는 법을 설명한다. 이 표본이 플로 맵을 sRGB 를 끈 데이터 텍스처로 다루는 이유다.',
      link: 'https://www.hlportal.de/files/GDC2011_BronwenGrimes_NonstandardTextures.pdf',
    },
  ],
  original: '특정 게임의 재현이 아니라 공개 발표의 원리를 따라 새로 만들었다. 수업 XR 01 Lake Shader Step6 의 법선맵 두 장 스크롤을 방향 텍스처로 넓힌 확장편이고, 3D 05 Terrain Island 의 용암과 강에 쓸 수 있다. 소용돌이 플로 맵, 세포 무늬 텍스처, 코드는 이 갤러리에서 새로 만들었다.',
  references: [
    { label: 'Vlachos: Water Flow in Portal 2 (SIGGRAPH 2010)', url: 'https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf' },
    { label: 'Grimes: 비표준 텍스처 (GDC 2011, Valve)', url: 'https://www.hlportal.de/files/GDC2011_BronwenGrimes_NonstandardTextures.pdf' },
    { label: 'Shader Graph Feature Examples (Flow Mapping 예제)', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Feature-Examples.html' },
  ],
  related: [
    { id: 'water-depth-foam', why: '같은 물 표면에 물체와 만나는 거품 띠를 더하는 짝' },
    { id: 'scroll-distort-energy', why: '방향 텍스처 대신 한 방향 스크롤과 왜곡으로 흐름을 만드는 가벼운 방법' },
  ],
}
