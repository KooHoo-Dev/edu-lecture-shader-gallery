import type { SpecimenMeta } from '../../core/types'

const ICE = { _Refraction: 0.08, _Thickness: 1, _NoiseStrength: 0.9, _NoiseScale: 12, _FlowSpeed: 0, _Dispersion: 0.15, _GlassColor: '#b4dcf0', _FresnelColor: '#f0faff', _FresnelPower: 2, _FresnelStrength: 0.8 }
const WATER_DROP = { _Refraction: 0.18, _Thickness: 3, _NoiseStrength: 0.12, _NoiseScale: 3, _FlowSpeed: -0.4, _Dispersion: 0.2, _GlassColor: '#e8fbff', _FresnelPower: 4, _FresnelStrength: 0.45 }
const HEAT_HAZE = { _Refraction: 0, _Thickness: 0, _NoiseStrength: 0.4, _NoiseScale: 5, _FlowSpeed: 0.8, _Dispersion: 0, _GlassColor: '#ffffff', _FresnelStrength: 0 }

export const meta: SpecimenMeta = {
  id: 'screen-refraction-glass',
  title: '씬 컬러 굴절 유리',
  titleEn: 'Screen Refraction Glass',
  group: 'A',
  order: 4,
  oneLiner: '투명 표면 뒤 장면을 휘어 보여 준다',
  goals: [
    'Opaque Texture 를 화면 좌표로 읽어 투명 물체 뒤의 장면을 직접 그릴 수 있다.',
    '법선과 시선으로 만든 굴절 방향과 흐르는 노이즈로 화면 좌표를 밀어 뒤 장면을 휘게 할 수 있다.',
    '두께, 색수차, 유리 색, 프레넬 반사를 더해 유리, 얼음, 물방울을 구분할 수 있다.',
    '밀린 좌표의 깊이로 유리 앞 물체가 끌려 들어오는 것을 막고, 투명 물체가 사라지는 이유를 설명할 수 있다.',
  ],
  tags: ['씬 컬러', '화면 좌표 왜곡', '굴절', '색수차', '프레넬'],
  difficulty: 3,
  shaderFile: 'ScreenRefractionGlass.shader',
  stage: { kind: 'depth', mesh: 'sphere', blend: 'alpha' },
  requires: ['opaque', 'depth'],
  params: [
    { key: '_Refraction', label: '굴절 세기', type: 'range', min: 0, max: 0.2, step: 0.005, default: 0.12, hint: '법선으로 화면 좌표를 미는 양(화면 높이 단위). 0 이면 렌즈처럼 휘는 모습이 없어지고 노이즈만 남는다' },
    { key: '_Thickness', label: '가장자리 두께', type: 'range', min: 0, max: 4, step: 0.05, default: 1.5, hint: '가장자리일수록 더 미는 배율. 클수록 테두리 쪽 장면이 크게 일그러진다' },
    { key: '_NoiseStrength', label: '노이즈 세기', type: 'range', min: 0, max: 1, step: 0.01, default: 0.3, hint: '노이즈로 미는 양. 크면 서리 낀 얼음처럼 뒤가 잘게 깨진다' },
    { key: '_NoiseScale', label: '노이즈 촘촘함', type: 'range', min: 1, max: 20, step: 0.5, default: 6, hint: '클수록 결이 잘아진다' },
    { key: '_FlowSpeed', label: '노이즈 흐름', type: 'range', min: -1, max: 1, step: 0.01, default: 0.15, hint: '양수면 결이 위로 오르고 음수면 아래로 흘러내린다. 0 이면 멈춘다' },
    { key: '_Dispersion', label: '색수차', type: 'range', min: 0, max: 1, step: 0.01, default: 0.25, hint: '실제 유리처럼 파랑을 더, 빨강을 덜 민다. 많이 휘는 가장자리에서 색 테두리가 갈라진다' },
    { key: '_GlassColor', label: '유리 색', type: 'color', default: '#d9f0ff', hint: '휜 배경에 곱하는 색' },
    { key: '_FresnelColor', label: '반사 색', type: 'color', default: '#e0eeff', hint: '가장자리에 비치는 주변 색' },
    { key: '_FresnelPower', label: '반사 좁히기', type: 'range', min: 0.5, max: 8, step: 0.1, default: 3, hint: '클수록 반사가 윤곽에만 남는다' },
    { key: '_FresnelStrength', label: '반사 세기', type: 'range', min: 0, max: 1, step: 0.01, default: 0.6 },
  ],
  presets: [
    { id: 'clear-glass', name: '맑은 유리', look: '렌즈처럼 휘고 가장자리에 색이 갈라진다', values: {} },
    { id: 'ice', name: '얼음', look: '푸르고 잘게 깨져 뒤가 흐릿하다. 움직이지 않는다', values: ICE },
    { id: 'water-drop', name: '물방울', look: '크게 휘고 결이 천천히 흘러내린다', values: WATER_DROP },
    { id: 'heat-haze', name: '아지랑이', look: '색도 테두리도 없이 뒤만 일렁이며 위로 오른다', values: HEAT_HAZE },
  ],
  events: [],
  demo: {
    // 굴절 세기를 오가며 휘지 않는 판과 크게 휘는 렌즈를 번갈아 보여 준다.
    loops: [{ key: '_Refraction', frames: [[0, 0.12], [2.5, 0.2], [3.7, 0.2], [6.2, 0], [7.4, 0], [9.4, 0.12]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: '굴절 방향', body: '시선을 유리 표면에서 `refract` 로 꺾은 방향과 꺾지 않은 방향의 차이를 카메라의 오른쪽, 위쪽 축에 내린 값이다. 빨강이 가로로, 초록이 세로로 미는 양이다. 가운데는 거의 밀지 않아 연한 회색이고, 왼쪽 가장자리는 분홍(오른쪽으로 민다), 오른쪽은 청록, 위는 자홍, 아래는 연두로 짙어진다. 가장자리마다 가운데 쪽을 가리켜 돋보기처럼 커 보이게 된다.' },
    { n: 2, label: '밀린 화면 좌표', body: '화면 좌표에 굴절 방향과 두께, 흐르는 노이즈를 더한 값이다. 빨강이 가로, 초록이 세로 좌표라 위는 연두, 아래는 주황으로 보인다. 흰 선은 밀린 좌표에서 같은 간격으로 그은 격자다. 밀지 않았다면 곧은 바둑판이었을 선이 가운데에서 벌어지고 가장자리로 몰리며 노이즈를 따라 구불거린다. 미는 양은 화면 높이 단위라 가로세로가 같은 비율로 휘고, 최대 길이가 묶여 있다. 밀린 자리가 유리보다 앞에 있는 물체이면 밀지 않은 좌표로 돌아간다. 이 좌표로 씬 색상을 읽는다.' },
    { n: 3, label: '휜 배경', body: '밀린 좌표로 Opaque Texture 를 읽은 결과다. 바닥 격자와 상자, 공이 유리 안에서 커지고 휘어 보인다. 실제 유리처럼 파랑을 조금 더, 빨강을 조금 덜 밀어, 많이 휘는 상자와 공의 테두리에 색이 갈라진다. 아직 유리 색과 반사가 없어 유리의 윤곽은 휜 자리로만 드러난다.' },
    { n: 4, label: '프레넬', body: '가운데는 검고 시선과 비스듬한 가장자리로 갈수록 밝아진다. 이만큼 반사 색을 섞어 유리의 윤곽을 세운다. 검은 가운데에서는 휜 배경이 그대로 보인다.' },
  ],
  offNote: '화면 좌표를 밀지 않고 씬 색상을 그대로 읽은 모습. 유리 색과 테두리 반사는 있지만 바닥 격자, 상자, 공이 유리 안팎에서 곧게 이어져 두께 있는 유리가 아니라 색 셀로판을 씌운 빈 껍데기처럼 보인다.',
  mistakes: [
    { title: '유리 앞에 있는 물체가 유리 안으로 끌려 들어온다', body: 'Opaque Texture 는 유리 앞뒤를 가리지 않고 화면 전체를 담고 있다. 밀린 좌표가 유리 앞 물체에 닿으면 그 색을 읽어 앞 물체가 유리 속에 비친다. 이 셰이더는 이 픽셀의 눈 깊이(`sgSceneDepth(i.screenUV) - i.depthDelta`)와 빨강, 초록, 파랑 각각의 밀린 좌표에서 읽은 `sgSceneDepth` 를 비교해, 밀린 좌표가 유리보다 앞이면 밀지 않은 좌표로 돌아간다. 그래도 끌려 들어오면 URP Asset 의 Depth Texture 가 켜져 있는지 확인한다. 꺼져 있으면 깊이를 읽지 못해 이 검사가 동작하지 않는다. 앞 물체의 윤곽 바로 옆에서는 밀린 색과 밀지 않은 색이 바뀌는 경계가 조금 보일 수 있다.' },
    { title: '유리 뒤의 투명 물체가 사라지거나 휘지 않고 얹힌다', body: 'Opaque Texture 는 불투명 범위(Render Queue 2500 이하)까지 그린 뒤 복사한 것이라 파티클, 물, 다른 유리 같은 투명 물체가 들어 있지 않다. 유리가 뒤 장면을 직접 알파 1 로 덮어 그리므로 유리보다 먼저 그려진 뒤 투명 물체는 지워지고, 유리보다 늦게 그려지는 뒤 투명 물체는 깊이를 쓰지 않는(ZWrite Off) 유리 위에 굴절 없이 얹힌다. 꼭 보여야 하는 물체는 불투명이나 잘라 내기로 바꾼다. 뒤 투명 물체를 일관되게 가리려면 래퍼의 `ZWrite Off` 를 `ZWrite On` 으로 바꾼다.' },
    { title: '유리가 회색 판이나 검은 판으로 보인다', body: 'URP Asset 의 Opaque Texture 가 꺼져 있으면 씬 색상이 비어 있다. 품질 단계마다 URP Asset 이 따로 있으면 모두 켜고, 카메라 Inspector 의 Rendering > Opaque Texture 가 Off 이면 Use Pipeline Settings 로 바꾼다. 머티리얼의 Render Queue 를 불투명 범위의 끝(2500) 이하(Geometry, AlphaTest 등)로 바꾸면 Opaque Texture 가 복사되기 전에 그려져 장면을 제대로 읽지 못한다. Render Queue 는 From Shader(Transparent, 3000)로 둔다.' },
    { title: '유리 속 장면이 흐릿하다', body: 'URP Asset 의 Opaque Downsampling 기본값이 2x Bilinear 라 씬 색상이 화면의 절반 해상도다. 또렷한 유리가 필요하면 None 으로 바꾼다. 반대로 얼음처럼 흐릿해야 하면 4x Box 가 싸게 흐림을 준다.' },
    { title: '2D 프로젝트에서 아무것도 안 그려진다', body: '2D Renderer 는 Opaque Texture 를 만들지 않고 `UniversalForward` 패스도 그리지 않는다. 이 셰이더는 Universal Renderer(3D)용이다. 2D 에서 화면을 휘게 하려면 Full Screen Pass Renderer Feature 에 넣는 전체 화면 머티리얼로 화면 전체를 미는 방식을 쓴다 (2D Renderer 에서도 그려진다). 스프라이트 한 장만 휘게 하려면 2D Renderer Data 의 Camera Sorting Layer Texture 를 켠다. 지정한 Sorting Layer 까지 그려진 화면이 `_CameraSortingLayerTexture` 로 들어오므로, Opaque Texture 대신 이것을 읽는 스프라이트 셰이더로 같은 굴절을 만든다.' },
  ],
  unity: {
    setup: [
      '`ScreenRefractionGlass.shader` 와 `core.hlsl` 을 `Assets/Shaders/screen-refraction-glass/` 에 둔다.',
      '사용 중인 URP Asset(Project Settings > Quality 에 연결된 것)의 Rendering 에서 Opaque Texture 와 Depth Texture 를 켠다. 또렷하게 보려면 Opaque Downsampling 을 None 으로 둔다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고, 3D Object > Sphere 에 넣는다.',
      '구를 상자, 바닥 같은 불투명 물체 앞에 두고 Game 뷰에서 본다. 이 셰이더에는 그림자 패스가 없어 유리는 그림자를 만들지 않는다.',
    ],
    verify: '구 뒤의 바닥과 물체가 렌즈처럼 휘고 가장자리에 색이 갈라진다. 굴절 세기를 0 으로 내리면 노이즈만 일렁이고, 노이즈 세기도 0 이면 휘지 않는 색유리 판이 된다.',
    pitfalls: [
      'URP Asset 이 품질 단계마다 따로 있으면 모두 Opaque Texture 와 Depth Texture 를 켠다. 수업 프로젝트의 모바일 XR 용 URP Asset 은 Opaque Texture 가 꺼져 있어 그대로 두면 유리가 회색이나 검은 판으로 보인다.',
      '미는 양은 화면 높이 단위로 정해져 있어 유리까지의 거리와 상관없이 같다. 멀어서 작게 보이는 유리는 자기 크기에 비해 먼 곳을 비춰 뒤가 크게 뒤틀리고, 카메라에 바짝 붙은 유리는 덜 휘어 보인다. 미는 길이는 화면 높이의 0.3 까지로 묶여 있다. 거리가 크게 바뀌는 유리는 굴절 세기를 거리에 맞춰 C# 에서 바꾸거나 거리마다 머티리얼을 나눈다.',
      'Opaque Texture 는 매 프레임 화면을 한 장 복사하는 비용이 들고, XR 에서는 두 눈의 화면을 모두 복사한다. 모바일 XR 에서 켜면 프레임을 확인하고, 무거우면 Opaque Downsampling 을 2x 이상으로 둔다. 이 효과의 XR 동작은 실기기에서 확인하지 않았다.',
      '이 셰이더에는 `UniversalForward` 패스만 있어 2D Renderer 에서는 그려지지 않는다. 2D Renderer 는 Opaque Texture 도 만들지 않는다. 3D 프로젝트용 효과다.',
      '유리끼리 겹치면 뒤 유리가 Opaque Texture 에 없어 앞 유리 속에서 사라진다. 유리 여러 장이 겹쳐 보여야 하는 씬은 한 장만 굴절을 쓰고 나머지는 일반 투명 머티리얼로 둔다.',
      '노이즈는 오브젝트 공간 위치로 읽는다. Batching Static 으로 정적 배칭되면 정점이 월드 좌표로 합쳐져 노이즈 크기와 위치가 바뀌므로 이 물체는 Static 에서 뺀다. 안개도 처리하지 않아 Fog 를 켠 씬에서 먼 유리가 흐려지지 않는다 (래퍼에서 `MixFog` 를 더한다).',
    ],
    graph: 'Shader Graph 에서는 Graph Settings 의 Surface Type 을 Transparent 로 둔다. Screen Position 노드(Default)에 오프셋을 Add 해 Scene Color 노드에 넣는다. 오프셋은 Normal Vector 노드(View 공간)의 xy 를 Negate 해 굴절 세기를 곱한 것과 노이즈를 더해 만든다 (그대로 더하면 바깥쪽을 읽어 뒤가 작아지는 축소 렌즈가 된다). 화면비는 x 에 Screen 노드의 Height / Width 를 곱해 맞춘다. 앞 물체 검사는 밀린 좌표로 읽은 Scene Depth 노드(Eye)가 Screen Position 노드(Raw)의 w(이 픽셀의 눈 깊이)보다 작으면 Comparison 과 Branch 로 밀지 않은 좌표를 고른다. 색수차는 Scene Color 를 세 번 읽어 Split 한 채널을 Combine 한다. 프레넬은 Fresnel Effect 노드로 반사 색을 Lerp 한다.',
  },
  prompt: {
    goal: '구나 판 같은 투명 메시가 뒤의 장면을 렌즈처럼 휘어 보이게 하는 굴절 유리 셰이더를 넣는다. Opaque Texture 와 Depth Texture 를 읽으므로 URP Asset 설정이 함께 필요하다.',
    adaptIdeas: [
      '유리창 앞을 캐릭터가 지나갈 때 캐릭터 윤곽 옆에서 밀린 색과 밀지 않은 색이 뚝 끊기지 않게, 앞 물체 검사를 깊이 차이에 따라 부드럽게 섞고 싶다.',
      '비 오는 창문처럼 물방울 자국이 흘러내리는 노멀 맵으로 굴절 방향을 만들고 싶다.',
      '호수 수면(평면 메시)에 같은 굴절을 쓰고 물결이 바람 방향으로 흐르게 하고 싶다.',
      '총구나 엔진 뒤에 아지랑이처럼 일렁이는 열기 판을 붙이고 가장자리는 부드럽게 사라지게 하고 싶다.',
      '얼음처럼 뿌옇게 하려고 Opaque Texture 를 여러 번 읽어 흐림을 넣고 싶다.',
    ],
  },
  captures: [
    { name: 'ice', label: '얼음', values: ICE },
    { name: 'water-drop', label: '물방울', values: WATER_DROP },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 수업 3D 07 External Assets 의 FORGE3D `HeatDepthFixed` 와 XR 01 Lake Shader 가 쓰는 원리(씬 컬러를 밀린 화면 좌표로 읽기)를 HLSL 로 풀어 보였다. 노이즈와 코드는 이 갤러리에서 새로 작성했다.',
  references: [
    { label: 'Unity e-book: Unity 6 URP 셰이더와 시각 효과 만들기 (반사와 굴절)', url: 'https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6' },
    { label: 'Shader Graph: Scene Color 노드', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph%4017.0/manual/Scene-Color-Node.html' },
    { label: 'Shader Graph: Production Ready Water 샘플', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Water.html' },
  ],
  related: [
    { id: 'force-field-intersection', why: '같은 깊이 무대에서 `depthDelta` 로 닿은 선을 밝히는 투명 막' },
    { id: 'fresnel-rim-glow', why: '가장자리 반사에 쓴 프레넬만 따로 다룬다' },
    { id: 'scroll-distort-energy', why: '노이즈로 좌표를 미는 같은 왜곡을 텍스처 UV 에 쓴다' },
  ],
}
