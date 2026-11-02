import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'water-wave-surface',
  title: '물결 수면',
  titleEn: 'Water Wave Surface',
  group: 'C',
  order: 1,
  oneLiner: '사인파를 더해 수면을 출렁이게 하고 하늘빛을 비춘다',
  goals: [
    '방향과 파장이 다른 사인파 몇 개를 더해 평면 정점의 높이를 오르내리게 할 수 있다.',
    '같은 사인파 식을 x, z 로 미분해 법선 `(-dh/dx, 1, -dh/dz)` 를 구하고, 정점을 밀 때 법선도 다시 구해야 하는 이유를 설명할 수 있다.',
    '프레넬로 물빛과 하늘빛을 섞고 알파를 정해, 내려다보는 곳은 비치고 먼 곳은 하늘이 덮게 할 수 있다.',
    '씬의 주 광원(`GetMainLight`)으로 Blinn-Phong 반사광을 더하고, 반사광이 화면의 어디에 생기는지 광원과 시선 방향으로 설명할 수 있다.',
  ],
  tags: ['정점 변형', '사인파', '법선 계산', '프레넬', '알파 혼합'],
  difficulty: 1,
  shaderFile: 'WaterWaveSurface.shader',
  stage: { kind: 'mesh', mesh: 'plane', blend: 'alpha', vertex: true },
  params: [
    { key: '_WaveHeight', label: '파도 높이', type: 'range', min: 0, max: 1, step: 0.01, default: 0.25, hint: '첫 파도의 진폭(오브젝트 공간). 나머지 두 파도는 0.6 배, 0.4 배로 따라간다. 무대 평면은 0.3 배로 줄여 놓아 0.25 면 첫 파도 마루가 약 7.5 cm 오른다. 0 이면 윤곽도 음영도 평평한 판이 된다' },
    { key: '_WaveLength', label: '파장', type: 'range', min: 7, max: 20, step: 0.5, default: 7, hint: '첫 파도의 마루 사이 거리(오브젝트 공간, 평면 한 변이 10). 나머지 두 파도는 0.77 배, 0.58 배다. 최솟값 7 은 가장 짧은 파도(약 4)가 Unity 기본 Plane 정점 간격(1)의 4 배가 되게 정한 값이다' },
    { key: '_WaveSpeed', label: '파도 속도', type: 'range', min: 0, max: 6, step: 0.1, default: 1.5, hint: '첫 파도의 마루가 1초에 나아가는 거리(오브젝트 공간). 짧은 파도일수록 조금 느리다. 0 이면 멈춘다' },
    { key: '_WaveAngle', label: '파도 방향', type: 'range', min: 0, max: 360, step: 5, default: 225, unit: '°', hint: '첫 파도가 나아가는 쪽 (Y 회전처럼 0 은 +Z, 90 은 +X). 기본 225 는 화면 오른쪽 안에서 왼쪽 앞으로 비스듬히 밀려온다. 나머지 두 파도는 55도, -40도 엇갈린다' },
    { key: '_DeepColor', label: '물빛', type: 'color', default: '#042a45', hint: '수면을 내려다볼 때 보이는 물 자체의 색' },
    { key: '_SkyColor', label: '하늘빛', type: 'color', default: '#70a4cc', hint: '수면에 비친 하늘의 색' },
    { key: '_SpecStrength', label: '반사광 세기', type: 'range', min: 0, max: 3, step: 0.05, default: 2, hint: '주 광원이 물결에 비친 빛의 밝기. 0 이면 반사광이 없다' },
    { key: '_SpecPower', label: '반사광 날카로움', type: 'range', min: 4, max: 256, step: 1, default: 8, hint: 'Blinn-Phong 지수. 크면 반사광이 작고 또렷해지고, 작으면 넓게 번진다. 이 무대는 해가 카메라 뒤에 있어 20 쯤을 넘기면 반사광이 거의 사라진다 (거친 바다처럼 물결이 가파르면 남는다)' },
  ],
  presets: [
    { id: 'open-water', name: '맑은 물', look: '푸른 물결이 비스듬히 밀려오고, 마루 뒷면에 하늘빛 줄, 카메라 쪽 면에 반사광이 넓게 번진다', values: {} },
    { id: 'calm-lake', name: '잔잔한 호수', look: '긴 물결이 느리게 일렁이고 잿빛 청록 하늘빛이 거울처럼 넓게 비친다', values: { _WaveHeight: 0.12, _WaveLength: 12, _WaveSpeed: 0.8, _DeepColor: '#0e3a3a', _SkyColor: '#b4ccd6', _SpecPower: 64 } },
    { id: 'rough-sea', name: '거친 바다', look: '높은 물결이 빠르게 겹쳐 솟고, 마루 뒷면에 잿빛 하늘이 가는 줄로 비친다', values: { _WaveHeight: 0.5, _WaveLength: 7, _WaveSpeed: 3.5, _DeepColor: '#123a52', _SkyColor: '#8796a3', _SpecStrength: 1.5, _SpecPower: 24 } },
    { id: 'toon-water', name: '만화풍 물', look: '밝은 하늘색 물에 반사광이 넓고 부드럽게 번진다', values: { _WaveHeight: 0.35, _WaveLength: 9, _DeepColor: '#0f7fb0', _SkyColor: '#8fe3ff', _SpecStrength: 1.2, _SpecPower: 4 } },
  ],
  events: [],
  demo: {
    // 파도 높이를 오가며 거의 평평한 물과 높게 출렁이는 물을 번갈아 보여 준다.
    loops: [{ key: '_WaveHeight', frames: [[0, 0.3], [3, 0.6], [4.5, 0.6], [7.5, 0.08], [9, 0.08], [11, 0.3]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: '파도 높이', body: '방향과 파장이 다른 사인파 세 개를 더한 높이를 회색으로 본다. 흰 곳이 마루, 검은 곳이 골이다. 한 방향 파도였다면 곧은 줄무늬였겠지만, 세 파도가 엇갈려 둥근 언덕과 움푹한 골이 여기저기 흩어져 있다. 정점도 이 높이만큼 위아래로 밀려 윤곽이 같은 모양으로 출렁인다. 화면에서 sRGB 로 밝아지지 않게 제곱해서 보여 준다.' },
    { n: 2, label: '파도 법선', body: '높이 식을 x, z 로 미분한 기울기로 `(-dh/dx, 1, -dh/dz)` 를 만들어 정규화한 법선을 색으로 본다 (R 은 x, G 는 위, B 는 z). 법선은 대부분 위를 향해 전체가 초록이고, 화면 오른쪽(+X)으로 기운 비탈은 노란빛, 먼 쪽(+Z)으로 기운 비탈은 하늘빛이 돈다. 1단계의 마루 꼭대기와 골 바닥은 평평해 맑은 초록이고, 그 사이 비탈에서 색이 가장 많이 바뀐다. 이 법선을 픽셀마다 다시 구하므로 정점이 성긴 메시에서도 음영이 매끈하다.' },
    { n: 3, label: '프레넬', body: '법선과 시선으로 구한 프레넬(하늘이 비치는 정도)을 회색으로 본다. 카메라 반대쪽으로 기운 마루 뒷면은 수면을 스치듯 보게 되어 하얀 줄로 빛나고, 카메라 쪽으로 기운 앞면은 정면에 가까워 짙은 회색이다. 평평한 곳도 꽤 밝은 회색인 것은 이 무대의 카메라가 수면을 낮게 내려다보기 때문이다. 최종 화면은 이 값으로 물빛과 하늘빛을 섞고 알파도 정한다. 그래서 짙은 앞면은 물빛으로 반투명해 바닥이 비치고, 밝은 뒷면과 먼 쪽은 하늘빛으로 덮인다.' },
    { n: 4, label: '반사광', body: '씬의 주 광원으로 구한 Blinn-Phong 반사광이다. 카메라 쪽으로 기운 물결 면에 넓은 회색 빛이 번지고 나머지는 검다. 무대의 해가 카메라 뒤 위쪽에 있어 광원과 시선의 가운데 방향(하프 벡터)이 카메라 쪽으로 누워 있기 때문이다. 3단계에서 짙던 자리와 거의 겹친다. 날카로움을 20 쯤 넘기면 이 무대에서는 반사광이 거의 사라진다. 이 빛을 3단계로 섞은 색에 더하면 최종 화면이고, 물체와 만나는 곳의 거품과 얕은 물빛은 [깊이 기반 물가 거품](#/s/water-depth-foam) 이 이어받는다.' },
  ],
  offNote: '정점은 그대로 출렁여 윤곽은 물결치는데, 법선을 다시 구하지 않고 평면의 원래 법선(위쪽)으로 프레넬과 반사광을 계산한 흔한 실수다. 물결 면마다 달라야 할 하늘빛과 반사광이 모두 사라져, 먼 쪽으로 갈수록 조금씩 밝아질 뿐인 고른 파란 판이 된다. 윤곽만 출렁이는 천처럼 보여 수면의 굴곡이 읽히지 않는다. 투명 표본이라 바닥 그림자는 켜도 꺼도 없다.',
  mistakes: [
    { title: '수면은 출렁이는데 빛과 하늘빛은 평평한 판처럼 고르다', body: '정점의 높이만 바꾸고 법선은 메시의 원래 법선(위쪽)을 그대로 쓰면 프레넬과 반사광이 물결을 모른다. 높이 식 `A sin(k (D · xz) - 위상)` 을 x, z 로 미분한 `A k cos(...) D` 로 기울기를 구하고 `normalize(float3(-dh/dx, 1, -dh/dz))` 를 법선으로 쓴다. 정점 단계에서는 위치만 돌려주므로 픽셀 단계에서 위치의 xz 로 같은 식을 다시 계산한다.' },
    { title: 'Unity 에서 파도 윤곽이 각지고 지그재그로 꺾인다', body: 'Unity 기본 Plane 은 한 변 10 을 10 칸으로 나눠 정점 간격이 1 이다. 파장이 정점 간격의 4 배보다 짧으면 마루와 골 사이에 정점이 한두 개뿐이라 윤곽이 꺾인 선이 된다. 음영은 픽셀마다 다시 구해 매끈하지만 실루엣은 정점이 정한다. 파장을 늘리거나, 칸 수가 많은 평면 메시(ProBuilder 의 Plane 이나 직접 만든 메시)를 쓴다.' },
    { title: '평면을 키웠더니 파도도 함께 커지고, 이어 붙인 평면 경계에서 파도가 끊긴다', body: '파도를 오브젝트 공간 위치로 계산하기 때문이다. Scale 을 3 배로 하면 파장과 높이도 3 배가 된다. 넓은 물은 Scale 대신 정점이 많은 큰 메시를 쓰거나, 래퍼의 정점 함수에서 월드 위치를 구해 그 xz 로 파도를 계산하도록 바꾼다 (그때는 높이도 월드에서 더한 뒤 오브젝트 공간으로 되돌린다). 월드로 바꾸면 이어 붙인 평면끼리 경계가 맞는다.' },
    { title: '반사광이 보이지 않는다', body: 'Blinn-Phong 반사광은 법선이 광원 방향과 시선 방향의 가운데(하프 벡터)와 거의 같을 때만 생긴다. 해가 카메라 뒤에 있으면 하프 벡터가 카메라 쪽으로 누워 있어, 카메라 쪽으로 크게 기운 물결 면에만 반사광이 생기고, 날카로움이 크면 그마저 사라진다 (이 갤러리 무대가 그렇다. 기본 날카로움을 8 로 낮게 둔 까닭이다). 날카로움을 낮추거나 파도 높이를 올리고, Directional Light 를 카메라 맞은편 낮은 곳으로 돌려 본다. 해가 맞은편에 있으면 날카로움을 올려도 작고 또렷한 반짝임이 남는다. 이 셰이더는 씬의 주 광원을 따르므로 해를 돌리면 반사광 자리도 따라 움직인다.' },
    { title: '실행 중에 파도 속도를 바꾸면 물결이 한 번에 튄다', body: '위상을 `시간 * 속도` 로 만들기 때문에 속도를 바꾸면 그동안 흐른 시간 전체에 변화량이 곱해진다. 연출로 속도를 바꾸려면 C# 에서 `Time.deltaTime * 속도` 를 쌓아 머티리얼 값으로 넘기고, 셰이더는 시간 대신 그 값을 쓴다.' },
  ],
  unity: {
    setup: [
      '`WaterWaveSurface.shader`, `core.hlsl` 을 `Assets/Shaders/water-wave-surface/` 에 둔다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      'GameObject > 3D Object > Plane 을 만들어 머티리얼을 넣는다. 수면 아래에 바닥이나 지형을 두면 앞쪽 물이 비쳐 보인다.',
      '넓은 물이면 Scale 을 키우지 말고 칸 수가 많은 평면 메시를 쓴다 (실수 목록의 "평면을 키웠더니" 참고).',
      'Scene 뷰에서 파도가 멈춰 있으면 Scene 뷰 툴바의 Effects 메뉴에서 Always Refresh 를 켠다.',
    ],
    verify: 'Play 하면 평면이 여러 방향의 물결로 출렁이고, 카메라 쪽으로 기운 물결 면은 짙은 물빛, 마루 뒷면과 먼 쪽은 하늘빛으로 보이며, Directional Light 를 돌리면 반사광 자리가 따라 움직인다. 파도 높이를 0 으로 내리면 평평한 판이 되고 윤곽도 멈춘다.',
    pitfalls: [
      '이 셰이더는 3D 투명 메시용이다. 패스가 `UniversalForward` 하나라 2D Renderer 에서는 그려지지 않는다. 투명 물체라 그림자를 드리우지 않고 깊이 텍스처에도 들어가지 않는다.',
      '정점을 미는 파도라 메시가 촘촘해야 한다. Unity 기본 Plane 은 10×10 칸(정점 간격 1)이라 가장 짧은 파장을 정점 간격의 4 배(약 4) 이상으로 두었다. 그래도 마루 사이에 정점이 네댓 개뿐이라 평면 가장자리와 마루의 실루엣이 짧은 꺾인 선으로 보인다. 음영은 픽셀마다 법선을 다시 구해 매끈하다. 넓은 바다는 정점이 많은 메시가 필요하고, 정점이 많을수록 비용이 크므로 XR 과 모바일에서는 칸 수를 아낀다.',
      '파도는 오브젝트 공간 위치로 계산한다. 평면을 키우면 파도도 함께 커지고, 평면을 Y 로 돌리면 파도 방향도 함께 돈다 (래퍼가 법선을 월드로 바꿔 조명은 맞는다). Batching Static 을 켠 물체는 정점이 월드 좌표로 합쳐져 `positionOS` 가 월드 위치가 되므로 파도 크기와 방향이 바뀐다. 수면은 Batching Static 을 끈다.',
      '주 광원은 `GetMainLight(shadowCoord, positionWS, shadowMask)` 로 받아 그림자 거리 페이드를 따르지만 `distanceAttenuation` 을 곱하지 않아 광원의 Culling Mask 와 Rendering Layers 는 무시된다.',
      '정점을 셰이더에서 밀어도 Renderer 의 경계 상자는 원래 두께 없는 평면 그대로다. 경계 상자가 화면 밖으로 나가면 물체 전체를 그리지 않으므로, 화면 위나 아래 가장자리에서 솟은 마루가 갑자기 사라질 수 있다. 파도가 높으면 메시 복사본의 `Mesh.bounds` 를 파도 높이만큼 위아래로 늘린다.',
      '이 셰이더는 안개를 처리하지 않아 Fog 를 켠 씬에서 먼 수면이 안개에 묻히지 않는다. 패스에 `#pragma multi_compile_fog` 를 넣고 정점에서 `ComputeFogFactor(positionCS.z)` 를 넘긴 뒤, 마지막 색에 `MixFog(color, fogFactor)` 를 건다.',
    ],
    graph: 'Shader Graph 에서는 Graph Settings 의 Surface Type 을 Transparent 로 두고, Position 노드(Object)의 xz 를 Custom Function 노드에 넣는다. Custom Function 은 String 모드로 `waveOne` 과 `waveSum` 의 본문을 옮겨 `void WaterWave_float(float2 XZ, float Time, out float Height, out float3 NormalOS)` 처럼 감싼다 (머티리얼 값은 입력으로 받는다). Height 를 Position 의 y 에 더해 Vertex 의 Position 에 넣고, NormalOS 는 Fragment 의 Normal (Object Space) 에 넣는다. `core.hlsl` 을 File 모드로 통째로 지정하면 `SgInput` 과 머티리얼 값 선언이 없어 컴파일되지 않는다.',
  },
  prompt: {
    goal: '평면 메시를 사인파 몇 개로 출렁이게 하고, 물결에 맞는 법선으로 하늘빛과 햇빛 반짝임이 비치는 기본 물 셰이더를 넣는다. 텍스처와 깊이 텍스처 없이 동작한다.',
    adaptIdeas: [
      '수업 XR 01 Lake Shader 처럼 잔물결 법선맵 두 장을 서로 다른 방향으로 흘려, 큰 파도 법선 위에 잔물결을 더하고 싶다.',
      '사인파 대신 Gerstner 파도로 마루를 뾰족하게 하고 싶다.',
      '넓은 바다에서 평면을 이어 붙여도 파도가 맞도록 월드 위치로 파도를 계산하고 싶다.',
      '수면에 하늘 대신 스카이박스나 반사 프로브를 비추고 싶다.',
      '물가에 거품 띠를 더하고 싶다.',
      'Fog 를 켠 넓은 바다에서 먼 수면이 안개에 묻히게 하고 싶다.',
    ],
  },
  captures: [
    { name: 'rough-sea', label: '거친 바다', values: { _WaveHeight: 0.5, _WaveLength: 7, _WaveSpeed: 3.5, _DeepColor: '#123a52', _SkyColor: '#8796a3', _SpecStrength: 1.5, _SpecPower: 24 } },
    { name: 'toon-water', label: '만화풍 물', values: { _WaveHeight: 0.35, _WaveLength: 9, _DeepColor: '#0f7fb0', _SkyColor: '#8fe3ff', _SpecStrength: 1.2, _SpecPower: 4 } },
  ],
  inspiredBy: [
    {
      title: 'Uru: Ages Beyond Myst (2003)',
      credit: 'Cyan Worlds',
      borrowed: ['사인파 합 파도', '도함수로 구한 법선'],
      learned: 'GPU Gems 1장(Mark Finch, Cyan Worlds)이 사인파 몇 개를 더해 수면 높이를 만들고, 같은 식을 미분해 법선을 바로 구하는 방법을 설명하며 이 방식을 Uru: Ages Beyond Myst 에 썼다고 밝힌다. 이 표본은 그중 가장 단순한 사인파 합과 도함수 법선만 따랐다.',
      link: 'https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models',
    },
  ],
  original: '특정 게임의 재현이 아니라 공개 자료의 원리를 따라 새로 만들었다. 수업 XR 01 Lake Shader(Step1~7: 파동, 법선맵 두 장, 프레넬, 반사)의 앞부분을 텍스처 없이 한 장에 모은 기초편이고, 3D 05 Terrain Island 의 바다에 쓸 수 있다. 파도 세 개를 첫 파도의 비율로 자동으로 만드는 구성과 코드는 이 갤러리에서 새로 만들었다.',
  references: [
    { label: 'GPU Gems 1장: Effective Water Simulation from Physical Models', url: 'https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models' },
    { label: 'Catlike Coding: Waves (Unity 튜토리얼)', url: 'https://catlikecoding.com/unity/tutorials/flow/waves/' },
  ],
  related: [
    { id: 'water-depth-foam', why: '이 물에 이어서 깊이 텍스처로 물체와 만나는 곳의 거품 띠와 얕은 물빛을 더하는 다음 단계' },
    { id: 'wind-sway-foliage', why: '같은 sgVertex 로 정점을 미는 다른 예. 잎은 얇아 법선을 다시 구하지 않는다' },
    { id: 'fresnel-rim-glow', why: '수면의 하늘빛에 쓴 프레넬을 따로 떼어 본다' },
    { id: 'flow-map-liquid', why: '법선맵 대신 방향 텍스처로 수면 무늬를 원하는 길로 흘리는 방법' },
  ],
}
