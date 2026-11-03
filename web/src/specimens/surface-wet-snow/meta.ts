import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'surface-wet-snow',
  title: '젖음과 눈 쌓임',
  titleEn: 'Surface Wetness and Snow',
  group: 'C',
  order: 5,
  oneLiner: '윗면에 젖은 느낌이나 눈을 얹는다',
  goals: [
    '월드 법선의 `y` 성분으로 위를 보는 면만 고르는 마스크를 만들 수 있다.',
    '노이즈를 마스크 값에 더해 경계를 깨고, 양(coverage) 값 하나로 덮는 정도를 조절할 수 있다.',
    '젖은 표면은 알베도를 어둡게 하고 하이라이트를 좁고 강하게 만드는 이유를 설명할 수 있다.',
    '오브젝트 공간 법선을 쓰면 물체가 돌거나 기울 때 눈이 옆과 아래로 돌아가는 이유를 설명할 수 있다.',
  ],
  tags: ['월드 법선', '노이즈', '마스크', '블린-퐁 하이라이트', '텍스처'],
  difficulty: 2,
  shaderFile: 'SurfaceWetSnow.shader',
  stage: {
    kind: 'mesh',
    mesh: 'sphere',
    blend: 'cutout',
    textures: { _StoneTex: { file: 'SurfaceWetSnowStone.png', repeat: true } },
  },
  params: [
    {
      key: '_Mode',
      label: '모드',
      type: 'select',
      options: [
        { value: '0', label: '젖음' },
        { value: '1', label: '눈' },
      ],
      default: '1',
      hint: '젖음은 돌을 어둡게 하고 좁고 강한 하이라이트를 얹는다. 눈은 흰 색으로 덮고 알갱이 몇 개가 반짝인다',
    },
    { key: '_Coverage', label: '덮는 양', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, hint: '0 이면 마른 돌, 0.5 면 위쪽 반구, 1 이면 아래까지 전부 덮인다. 날씨에 맞춰 천천히 바꿀 때는 `SurfaceWeatherController.SetCoverage(목표, 초)` 를 부른다. 자동 데모가 이 값을 오가며 그 모습을 보여 준다' },
    { key: '_Softness', label: '경계 부드러움', type: 'range', min: 0.01, max: 0.5, step: 0.01, default: 0.08, hint: '덮인 곳과 마른 곳 사이의 번짐 폭. 작으면 눈 가장자리가 또렷하게 끊기고, 크면 젖은 기운이 서서히 옅어진다' },
    { key: '_NoiseScale', label: '노이즈 크기', type: 'range', min: 1, max: 20, step: 0.5, default: 6, hint: '경계를 깨는 노이즈의 촘촘함. 작으면 큰 덩어리로 굽이치고, 크면 가장자리가 잘게 부서진다' },
    { key: '_WetDarkness', showWhen: { key: '_Mode', values: ['0'] }, label: '젖음 어둡기', type: 'range', min: 0, max: 1, step: 0.01, default: 0.8, hint: '젖음 모드에서 돌 색을 얼마나 어둡게 할지. 1 이면 선형 값이 밝은 돌 기준 약 10% 로 내려가고, 어두운 색은 제곱으로 줄어 그보다 더 어두워진다. 0 이면 하이라이트만 남아 젖었다기보다 니스를 칠한 돌처럼 보인다. 눈 모드에서는 쓰지 않는다' },
    { key: '_Gloss', label: '광택', type: 'range', min: 0, max: 1, step: 0.01, default: 0.7, hint: '젖음에서는 하이라이트가 좁고 강해지는 정도, 눈에서는 알갱이 반짝임의 세기다' },
    { key: '_SnowColor', showWhen: { key: '_Mode', values: ['1'] }, label: '눈 색', type: 'color', default: '#cdd6e4', hint: '눈 모드에서 덮는 색. 조명을 곱하므로 빛을 받는 쪽은 이보다 밝고 그늘 쪽은 어둡다. 순백에 가깝게 올리면 빛 쪽이 하얗게 날아가 음영이 사라진다. 재나 모래 색으로 바꿔 쓸 수도 있다' },
    { key: '_Storm', label: '소나기·눈발', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '평소에는 0 이다. 이벤트 버튼과 C# `SurfaceWeatherController.Storm()` 이 잠깐 1 로 올렸다 0 으로 되돌린다. 셰이더가 이 값의 0.4 배를 덮는 양에 더하므로 어느 양에서도 더 덮인다. `SetCoverage` 가 덮는 양을 옮기는 중에도 따로 더해진다' },
    { key: '_TilingU', label: '텍스처 반복 U', type: 'range', min: 1, max: 20, step: 0.5, default: 6, hint: 'UV 가로로 돌 텍스처를 몇 번 반복할지. 기본 6, 3 은 구(둘레가 위아래의 2배)에 맞춘 값이다. U:V 를 메시 UV 가 덮는 가로:세로 길이 비와 같게 맞춘다. 같은 벽돌 크기라면 큐브와 Quad 는 2, 2, 한 변 10 인 Plane 은 20, 20 이다. 구에 쓴 값을 그대로 두면 큐브 면에서 벽돌이 세로로 2배 늘어난다' },
    { key: '_TilingV', label: '텍스처 반복 V', type: 'range', min: 1, max: 20, step: 0.5, default: 3, hint: 'UV 세로로 몇 번 반복할지. 반복 U 와 짝으로 맞춘다. 머티리얼의 Tiling 칸은 쓰지 않으므로 이 두 값으로 조절한다' },
  ],
  presets: [
    { id: 'first-snow', name: '첫눈', look: '돌 공 위쪽 반구에 눈이 얹히고 가장자리가 들쭉날쭉하다', values: {} },
    { id: 'heavy-snow', name: '폭설', look: '눈이 아래쪽까지 두껍게 덮고 큰 덩어리로 경계가 굽이친다', values: { _Coverage: 0.72, _NoiseScale: 3.5, _Softness: 0.04 } },
    { id: 'after-rain', name: '비 온 뒤 돌길', look: '위쪽이 어둡게 젖고 좁고 밝은 하이라이트가 맺힌다', values: { _Mode: '0', _Softness: 0.06 } },
    { id: 'drizzle', name: '이슬비', look: '위쪽이 잔 얼룩으로 젖고 경계가 넓게 번지며 하이라이트가 넓게 퍼진다', values: { _Mode: '0', _Softness: 0.2, _WetDarkness: 0.65, _Gloss: 0.35, _NoiseScale: 12 } },
    { id: 'ash', name: '화산재', look: '회색 재가 윗면에 쌓이고 반짝임이 없다', values: { _SnowColor: '#6b6560', _Gloss: 0, _NoiseScale: 12 } },
  ],
  events: [
    {
      id: 'storm',
      label: '소나기·눈발',
      // SurfaceWeatherController.Storm() 과 같다. 0.8초 동안 _Storm 을 0 에서 1 로 올리고 1.6초 버틴 뒤 1.6초 동안 0 으로 내린다 (사인 가감속).
      tracks: [{ key: '_Storm', frames: [[0, 0], [0.8, 1], [2.4, 1], [4, 0]], ease: 'inOutSine' }],
    },
  ],
  demo: {
    // 덮는 양을 오가며 눈(또는 젖음)이 꼭대기에서 아래로 번졌다 물러나는 모습을 보여 준다. C# SetCoverage 가 하는 일과 같다.
    loops: [{ key: '_Coverage', frames: [[0, 0.5], [2.4, 0.85], [3.4, 0.85], [6.4, 0.15], [7.4, 0.15], [9.6, 0.5]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: '윗면 마스크', body: '월드 법선의 `y` 는 위를 보면 1, 옆이면 0, 아래를 보면 -1 이다. 이 값을 덮는 양으로 정한 높이에서 `smoothstep` 으로 잘랐다. 흰 곳이 덮일 자리, 검은 곳이 마른 자리다. 기본값에서는 공의 가운데 높이를 경계로 위가 희고 아래가 검으며, 사이에 경계 부드러움만큼 좁은 회색 띠가 있다. 공이 돌아도 흰 부분은 늘 위에 있다. 이대로 쓰면 경계가 자로 그은 듯 반듯하다.' },
    { n: 2, label: '노이즈로 깬 마스크', body: '오브젝트 공간 위치로 만든 3D 노이즈를 법선 `y` 에 더한 뒤 같은 높이에서 잘랐다. 경계가 들쭉날쭉해져 흰 덩어리가 아래로 흘러내리고 검은 구멍이 위로 파고든다. 노이즈 크기를 키우면 가장자리가 잘게 부서지고, 줄이면 크게 굽이친다. 노이즈는 물체에 붙어 있어 공이 돌면 덩어리 모양도 함께 돈다.' },
    { n: 3, label: '덮는 재질', body: '마스크 없이 표면 전체에 덮는 재질을 씌운 모습이다. 눈 모드는 눈 색에 조명을 곱해 위는 밝고 아래로 갈수록 푸른 회색으로 어두워지며, 빛을 받는 쪽에 흰 점들이 반짝인다. 점마다 작은 칸의 법선을 조금씩 틀어 하이라이트를 따로 계산한 것이다. 젖음 모드로 바꾸면 돌이 진하고 어두워지고, 빛 쪽에 작고 강한 하이라이트가 맺히며 가장자리에 주변 빛이 희미하게 비친다. 래퍼가 URP Lit 이 아니므로 하이라이트는 `lightDirWS`, `viewWS`, `normalWS`, `lightColor` 로 블린-퐁을 직접 계산한다. 최종 화면은 2단계 마스크로 마른 돌과 이 재질을 섞은 것이다. 2단계에서 흰 곳이 이 모습이 되고, 검은 곳은 원래 돌로 남는다.' },
  ],
  offNote: '마스크를 오브젝트 공간 법선으로 만든 실수다. 이 무대는 Y 축으로만 돌아 `normalOS.y` 를 그대로 쓰면 월드 법선과 같아 차이가 보이지 않는다. 그래서 공을 Z 축으로 90도 눕혀 놓은 물체로 치고, 그때 `normalOS.y` 가 가리킬 방향(`-normalOS.x`)을 위로 썼다. 눈이 공의 왼쪽 옆면에 붙어 정작 꼭대기 돌은 드러나고, 공이 돌면 눈도 함께 돌아 앞과 뒤로 넘어간다. 굴러가는 바위, 기울여 놓은 소품, Z 가 위인 모델에서 실제로 생기는 모습이다. 알파가 항상 1 이라 그림자는 효과를 켰을 때와 같다.',
  mistakes: [
    { title: '물체를 돌리면 눈이 옆면과 아래로 돌아간다', body: '마스크를 `normalOS.y`(오브젝트 공간 법선)로 만들면 마스크가 물체에 붙는다. 물체를 기울이거나 굴리면 덮인 자리가 함께 돌아 옆면과 바닥에 눈이 생긴다. Blender 처럼 Z 가 위인 도구에서 만든 모델을 축 변환을 굽지 않고(Bake Axis Conversion 끔) 들여오면 Transform 의 X -90 회전으로 세워지므로, 가만히 있어도 옆면이 덮인다. 하늘 방향은 월드 기준이므로 `TransformObjectToWorldNormal` 로 바꾼 `normalWS.y` 를 쓴다.' },
    { title: '경계가 자로 그은 듯 매끈한 원이다', body: '법선 `y` 만으로 자르면 등고선처럼 반듯한 선이 나온다. 위치로 만든 노이즈를 마스크 값에 더해 경계를 흔든다. 값 노이즈는 0.5 근처에 몰리므로 `saturate((n - 0.2) / 0.6)` 처럼 넓히고 0.5 를 빼서 위아래로 고르게 흔든다.' },
    { title: '젖었는데 그냥 어두운 얼룩처럼 보인다', body: '알베도만 어둡게 하면 때가 묻은 것처럼 보인다. 물막은 매끈해서 하이라이트가 좁고 강하게 맺힌다. 블린-퐁 지수를 크게(이 표본은 32~1024) 올리고 세기도 함께 키운다. URP Lit 에 넣는다면 Smoothness 를 올린다.' },
    { title: '양을 0 으로 내려도 꼭대기가 조금 덮여 있다', body: '경계 위치를 `1 - 2 * 양` 처럼 -1~1 로만 옮기면, 노이즈와 부드러움 폭만큼 넘친 부분이 양 끝에서 남는다. 이 표본은 경계를 1.35+폭에서 -1.35-폭까지 옮겨 0 과 1 에서 확실히 비고 차게 했다.' },
    { title: '여러 바위가 함께 젖지 않거나, Play 를 멈춰도 젖은 채 남는다', body: '`renderer.material` 은 그 물체 전용 복사본이라 다른 바위는 그대로다. 씬 전체를 함께 적시려면 `SurfaceWeatherController` 의 머티리얼 칸에 공유 머티리얼 에셋을 넣는다. 에셋을 직접 고치면 에디터 Play 중 바꾼 값이 파일에 저장되므로 `OnDisable` 에서 원래 값으로 되돌린다. 머티리얼이 여러 개라면 `_Storm` 을 전역 값으로 바꾸고 `Shader.SetGlobalFloat` 를 쓰는 방법도 있다. 이때 `_Storm` 을 CBUFFER 뿐 아니라 Properties 에서도 빼야 한다. Properties 에 남아 있으면 머티리얼에 저장된 값이 전역 값을 덮어써 아무 변화가 없다.' },
  ],
  unity: {
    setup: [
      '`SurfaceWetSnow.shader`, `core.hlsl`, `SurfaceWeatherController.cs`, `SurfaceWetSnowStone.png` 를 `Assets/Shaders/surface-wet-snow/` 에 둔다.',
      'Project 창에서 `SurfaceWetSnowStone.png` 를 고르고 Inspector 에서 Texture Type 은 Default, sRGB (Color Texture) 는 켜고, Wrap Mode 는 Repeat, Filter Mode 는 Bilinear 로 맞춘 뒤 Apply 를 누른다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고, 바탕 텍스처 칸에 `SurfaceWetSnowStone.png`(또는 쓰려는 돌, 벽돌 텍스처)를 넣는다.',
      '머티리얼을 바위, 벽, 계단 같은 MeshRenderer 에 넣고 모드(Wet, Snow)와 덮는 양을 정한다. 텍스처 반복 U, V 는 메시에 맞춘다 (구 6, 3, 큐브 2, 2, Plane 20, 20). 벽돌이 한쪽으로 늘어나 보이면 이 비율이 맞지 않은 것이다.',
      '날씨 연출이 필요하면 물체에 `SurfaceWeatherController` 를 붙인다. 비나 눈이 내리기 시작하고 그칠 때 `SetCoverage(목표 양, 초)` 로 덮는 양을 천천히 옮기고, 잠깐 몰아치는 소나기·눈발은 `Storm()` 으로 그 위에 더한다. 여러 물체를 함께 바꾸려면 머티리얼 칸에 공유 머티리얼 에셋을 넣는다.',
    ],
    verify: '덮는 양을 0 에서 1 로 올리면 물체 꼭대기부터 눈(또는 젖은 어두운 면)이 아래로 번지고, 물체를 Rotation X 로 90도 눕혀도 덮인 자리는 계속 위쪽에 남는다. 모드를 Wet 으로 바꾸면 덮인 곳이 어두워지고 좁은 하이라이트가 맺힌다.',
    pitfalls: [
      '이 셰이더는 불투명 3D 메시용이다. 패스가 `UniversalForwardOnly` 라 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트에서 쓴다.',
      '조명은 래퍼가 계산한 주 광원 하나와 환경광(SH)만 쓴다. 추가 광원(점광원, 스포트), 반사 프로브, 안개는 받지 않는다. 주 광원의 distanceAttenuation 을 곱하지 않으므로 광원의 Culling Mask 와 Rendering Layers 가 무시되어, 레이어로 빛을 뺀 물체도 주 광원을 받는다. 넓은 야외 씬에서 Fog 를 켰다면 먼 바위가 안개 없이 또렷하게 남으므로 `#pragma multi_compile_fog`, 정점의 `ComputeFogFactor`, 프래그먼트의 `MixFog` 를 더한다.',
      '바탕 텍스처는 메시 UV 로 읽는다. 반복 횟수의 기본값(6, 3)은 구에 맞춘 것이라 큐브나 Plane 에서는 텍스처 반복 U, V 를 다시 맞춰야 벽돌이 늘어나지 않는다. 머티리얼의 Tiling, Offset 칸은 쓰지 않는다. 기본 구는 극점에서 무늬가 모이고, UV 가 엉망인 메시는 무늬가 늘어난다. 지형이나 절벽에는 [삼평면 투영](#/s/triplanar-projection)으로 바탕을 읽는 것을 고려한다.',
      '노이즈와 반짝임은 `positionOS`(오브젝트 공간 위치)로 만든다. Static 으로 표시해 정적 배칭되면 정점이 월드 위치로 구워져 무늬가 달라진다. Transform 의 Scale 을 키운 물체는 노이즈 덩어리도 함께 커지므로 노이즈 크기를 올린다. 반대로 메시 자체의 좌표가 큰 모델(정점이 수십 단위에 걸친 바위 등)은 같은 화면 크기에 칸이 많이 들어가 노이즈와 반짝임이 잘아지므로 노이즈 크기를 내리고, 반짝임은 `core.hlsl` 의 `SURFACE_GLINT_CELLS` 를 줄인다.',
      '눈 반짝임은 작은 칸마다 법선을 흔들어 만든다. 화면에서 멀리 있거나 작게 보이면 알갱이가 픽셀보다 작아져 지글거린다. 먼 물체는 광택을 낮춘다.',
      '모바일 XR 에서는 3D 노이즈 3옥타브가 픽셀마다 돈다. 넓은 면에 쓸 때는 노이즈를 텍스처로 구워 읽는 쪽이 가볍다.',
    ],
    graph: 'Shader Graph 에서는 Normal Vector 노드(Space: World)의 Y 를 Split 으로 꺼내 윗면 마스크를 만들고, Simple Noise 노드를 더한 뒤 Smoothstep 으로 자른다. 그 마스크로 Base Color 를 눈 색과 섞거나, 젖음이면 Base Color 를 어둡게 하고 Smoothness 를 올린다. 이때는 URP Lit 그래프가 하이라이트를 계산하므로 `core.hlsl` 의 블린-퐁 부분은 필요 없다. `core.hlsl` 을 Custom Function 에 그대로 지정하지 않는다. `SgInput`, `SG_TEX`, 머티리얼 값이 `.shader` 래퍼에만 있어 컴파일되지 않는다. 노이즈만 쓰려면 `surfaceHash`, `surfaceValueNoise`, `surfaceNoise` 를 새 파일에 복사해 `void SurfaceNoise_float(float3 P, out float N)` 로 감싼다.',
  },
  prompt: {
    goal: '물체의 위를 보는 면에만 젖은 느낌(어둡고 매끈한 하이라이트)이나 눈을 얹는 셰이더를 넣는다. 물체가 돌거나 기울어도 늘 하늘 쪽이 덮이고, C# `SetCoverage` 로 덮는 양을 날씨에 맞춰 천천히 올리고 내리며, `Storm()` 으로 잠깐 몰아치는 소나기나 눈발을 더할 수 있다.',
    adaptIdeas: [
      '비가 그치면 해가 드는 쪽부터 먼저 마르게 하고 싶다.',
      '움푹한 곳에만 물웅덩이가 고이게 하고 싶다.',
      '눈이 쌓일 때 정점을 위로 밀어 두께가 생기게 하고 싶다.',
      'URP Lit 처럼 노멀맵과 추가 광원도 받게 하고 싶다.',
      '바탕 텍스처를 삼평면 투영으로 읽어 지형 절벽에 쓰고 싶다.',
    ],
  },
  captures: [
    { name: 'wet', label: '비 온 뒤 돌길 (젖음)', values: { _Mode: '0', _Softness: 0.06 } },
    { name: 'heavy-snow', label: '폭설', values: { _Coverage: 0.72, _NoiseScale: 3.5, _Softness: 0.04 } },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 수업 3D 01 Rendering(머티리얼과 텍스처), 05 Terrain 에서 다루는 재질에 날씨를 얹는 확장으로 만들었다. 돌 벽돌 텍스처, 노이즈, 하이라이트 코드는 이 갤러리에서 새로 작성했다.',
  references: [
    { label: 'Shader Graph: Production Ready Weather 샘플 (비, 웅덩이, 젖음, 눈)', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Weather.html' },
    { label: 'Unreal 포럼: Rain/Wet shader (윗면 마스크 논의)', url: 'https://forums.unrealengine.com/t/rain-wet-shader/16716' },
  ],
  related: [
    { id: 'triplanar-projection', why: '월드 공간과 오브젝트 공간을 고르는 같은 문제를 텍스처 투영으로 본다' },
    { id: 'dissolve-edge-glow', why: '오브젝트 공간 위치로 만든 3D 노이즈와 임계값 자르기가 같다' },
    { id: 'toon-ramp-lit', why: '`lightDirWS` 와 `lightColor` 로 빛을 직접 계산하는 다른 예' },
  ],
}
