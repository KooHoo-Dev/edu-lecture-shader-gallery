import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'wind-sway-foliage',
  title: '바람 흔들림',
  titleEn: 'Wind Sway Foliage',
  group: 'C',
  order: 2,
  oneLiner: '정점을 높이에 따라 흔들어 바람을 만든다',
  goals: [
    '`uv.y` 로 만든 마스크로 뿌리는 고정하고 끝만 크게 미는 정점 셰이더를 쓸 수 있다.',
    '일정한 방향의 큰 흔들림(흘러가는 노이즈)과 잎마다 위상이 다른 작은 떨림을 나눠 만들고 겹칠 수 있다.',
    '그림자 패스까지 같은 정점 함수를 써야 하는 이유와, 민 만큼 끝을 내려 잎 길이를 지키는 방법을 설명할 수 있다.',
    'C# 로 돌풍 이벤트를 만들고, 여러 머티리얼을 한 번에 움직이는 전역 값(`Shader.SetGlobalFloat`) 방식과 비교할 수 있다.',
  ],
  tags: ['정점 변형', '노이즈', 'UV 마스크', '양면 렌더링', '그림자 패스'],
  difficulty: 2,
  shaderFile: 'WindSwayFoliage.shader',
  stage: { kind: 'mesh', mesh: 'grass', blend: 'cutout', vertex: true, doubleSided: true },
  params: [
    { key: '_WindAngle', label: '바람 방향', type: 'range', min: 0, max: 360, step: 1, default: 90, unit: '°', hint: '오브젝트 공간 기준. 회전하지 않은 풀에서는 월드와 같다. Transform 의 Y 회전처럼 읽어 0 은 +Z(화면 안쪽), 90 은 +X(화면 오른쪽), 270 은 왼쪽으로 분다' },
    { key: '_WindStrength', label: '바람 세기', type: 'range', min: 0, max: 1, step: 0.01, default: 0.45, hint: '잎 끝을 바람 쪽으로 미는 평소 세기. 클수록 깊이 눕는다. 끝이 꼭 이 거리(미터)만큼 밀리지는 않는다. 돌풍 노이즈가 자리마다 세기를 줄이거나 늘리고, 잎 길이를 지키느라 민 만큼 끝이 내려와 옆으로 간 거리가 줄어든다' },
    { key: '_Gustiness', label: '돌풍 변화', type: 'range', min: 0, max: 1, step: 0.01, default: 0.7, hint: '흘러가는 노이즈가 세기를 얼마나 바꾸는지. 0 이면 느린 물결만 남아 잎들이 거의 고르게 기울고, 1 이면 돌풍 덩어리가 지나가는 자리만 크게 눕는다' },
    { key: '_WindSpeed', label: '바람 속도', type: 'range', min: 0, max: 3, step: 0.05, default: 1, hint: '돌풍이 흘러가는 빠르기와 떨림의 빠르기. 0 이면 기운 채 멈춘다' },
    { key: '_Flutter', label: '잎 떨림', type: 'range', min: 0, max: 0.15, step: 0.005, default: 0.04, hint: '잎마다 위상이 다른 작은 흔들림의 폭(미터). 0 이면 떨림이 없어지고, 돌풍 노이즈를 따라 자리마다 다르게 출렁이는 큰 흔들림만 남는다' },
    { key: '_Gust', label: '돌풍', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '평소에는 0 이다. C# `WindGust` 와 돌풍 버튼이 잠깐 1 로 올렸다 0 으로 되돌린다. 셰이더가 이 값의 0.4 배를 바람 세기에 더하므로 어느 세기에서도 바람을 키운다' },
    { key: '_RootColor', label: '뿌리 색', type: 'color', default: '#2e5b23', hint: '`uv.y` 0 쪽 색' },
    { key: '_TipColor', label: '끝 색', type: 'color', default: '#c4d96a', hint: '`uv.y` 1 쪽 색. 뿌리 색과 `uv.y` 로 섞는다' },
  ],
  presets: [
    { id: 'breeze', name: '산들바람', look: '연두 풀이 오른쪽으로 살짝 눕고 끝이 잘게 떤다', values: {} },
    { id: 'storm', name: '폭풍', look: '풀이 깊이 누운 채 빠르게 출렁이고 잎 끝이 크게 떤다', values: { _WindStrength: 0.85, _WindSpeed: 2.2, _Flutter: 0.09, _Gustiness: 0.9 } },
    { id: 'dry-autumn', name: '마른 가을 풀', look: '누런 풀이 왼쪽으로 기울고 마른 잎 끝이 바스락거리듯 떤다', values: { _WindAngle: 270, _WindStrength: 0.3, _Flutter: 0.07, _RootColor: '#5a4426', _TipColor: '#e3c27a' } },
    { id: 'underwater', name: '물속 수초', look: '청록 수초가 느리고 크게 고르게 출렁인다', values: { _WindStrength: 0.6, _WindSpeed: 0.35, _Gustiness: 0.2, _Flutter: 0.02, _RootColor: '#123d3a', _TipColor: '#4fc3a1' } },
  ],
  events: [
    {
      id: 'gust',
      label: '돌풍',
      // WindGust.Gust() 와 같다. 0.35초 동안 _Gust 를 0 에서 1 로 올리고 0.75초 버틴 뒤 1.2초 동안 0 으로 내린다 (사인 가감속).
      tracks: [{ key: '_Gust', frames: [[0, 0], [0.35, 1], [1.1, 1], [2.3, 0]], ease: 'inOutSine' }],
    },
  ],
  demo: {
    fire: [{ event: 'gust', every: 6 }],
  },
  steps: [
    { n: 1, label: '흔들림 마스크', body: '잎을 세로로 반 갈라 한쪽에는 `uv.y`(뿌리 0, 끝 1)를, 다른 쪽에는 그 제곱을 칠했다. 둘 다 뿌리는 검고 끝은 희지만, `uv.y` 쪽은 위로 고르게 밝아지고 제곱한 쪽은 아래쪽이 오래 어둡게 남다가 끝 가까이에서 빠르게 밝아진다. 그래서 잎 아래쪽이 세로로 밝은 줄과 어두운 줄로 갈려 보인다. 제곱한 값을 곱해 밀기 때문에 밝은 곳일수록 크게 움직이고 어두운 아래쪽은 거의 제자리에 있어, 막대처럼 통째로 기울지 않고 줄기가 휜다. 단계 보기는 색만 바꾸고 움직임은 어느 단계에서나 최종과 같다.' },
    { n: 2, label: '큰 흔들림', body: '바람 방향은 하나로 두고 세기만 바꾼다. 잎의 밝기가 그 자리의 돌풍 노이즈다. 흰 잎은 돌풍이 센 자리라 깊이 눕고, 검은 잎은 덜 눕는다. 노이즈 덩어리가 바람 방향으로 흘러가 잎마다 밝기와 기울기가 함께 바뀐다. 섞어 둔 느린 사인 물결도 같은 쪽으로 흐른다. 민 만큼 끝을 내려 잎 길이는 그대로다. 돌풍 버튼은 이 세기에 `_Gust` 를 더해 어느 세기에서도 바람을 키운다.' },
    { n: 3, label: '떨림 더하기', body: '잎마다 위상이 다른 작은 사인 흔들림을 더했다. 잎의 밝기는 지금 떨림이 어느 쪽 끝에 있는지다. 흰 잎과 검은 잎은 서로 반대쪽으로 떨고, 잎마다 제 박자로 밝아졌다 어두워진다. 위상은 잎의 오브젝트 공간 위치(`positionOS.xz`)에서 얻는다. 수업 `FishSwim` 이 몸통 축 위치에 따라 사인으로 흔드는 것과 같은 원리다. 위치로 정하므로 한 잎 안에서도 정점마다 위상이 조금 다르다. 위치에 곱하는 계수를 작게 두어 한 잎 안에서는 크게 갈리지 않게 했다. 계수를 키우면 이웃 잎과 더 어긋나지만 떨림을 올릴 때 잎이 꼬인다.' },
    { n: 4, label: '양면 조명', body: '잎 색에 조명을 곱했다. 최종 화면과 같다. 잎은 뒷면도 그리지만 법선은 앞면 하나뿐이라, 보통 조명식이면 빛을 등진 면을 보이는 잎이 환경광만 받아 어둡게 가라앉는다. 직사광을 `abs(dot(N, L))` 로 구해 앞면이든 뒷면이든 빛을 마주한 정도만큼 똑같이 밝힌다. 얇은 잎은 빛이 비쳐 뒷면도 밝으므로 받아들일 만한 근사다. 법선은 다시 계산하지 않는다. 그림자 패스도 같은 정점 함수를 불러 바닥 그림자가 잎과 함께 흔들린다.' },
  ],
  offNote: '마스크 없이 정점 전체를 민 흔한 실수. 뿌리까지 같은 만큼 밀려 풀 다발이 휘지 않고 통째로 바닥 위를 미끄러진다. 그림자 패스에 정점 변형을 넣지 않은 실수도 함께 보여 준다. 잎은 움직이는데 바닥 그림자는 원래 자리에 가만히 있다.',
  mistakes: [
    { title: '풀이 뿌리째 바닥 위를 미끄러진다', body: '흔들림 값을 모든 정점에 똑같이 더하면 뿌리도 함께 움직인다. `uv.y` 처럼 뿌리 0, 끝 1 인 값을 곱해 뿌리를 고정한다. 제곱하면 줄기가 휘어 보인다. 모델의 UV 가 이렇게 펴져 있지 않으면 정점 색 한 채널에 마스크를 칠하거나 오브젝트 공간 높이(`positionOS.y / 키`)를 쓴다.' },
    { title: '잎은 흔들리는데 그림자는 가만히 있다', body: '`ShadowCaster` 패스의 정점 함수가 `sgVertex` 를 부르지 않으면 그림자는 원래 모양 그대로다. `DepthOnly`, `DepthNormals` 도 마찬가지라 SSAO 나 깊이를 읽는 효과가 어긋난다. 이 래퍼는 네 패스가 모두 같은 `vert` 를 쓴다.' },
    { title: '모든 풀이 한 몸처럼 똑같이 흔들린다', body: '떨림의 위상이 모두 같으면 풀밭이 한 장의 판처럼 움직인다. 이 표본은 `positionOS.xz` 에서 위상을 얻는다. 그런데 같은 풀 프리팹을 여러 개 놓으면 오브젝트 공간 위치가 모두 같아 덩어리끼리 똑같이 흔들린다. 래퍼의 `vert` 에서 `float3 o = TransformObjectToWorld(float3(0.0, 0.0, 0.0)); o.y = 0.0;` 를 구해 `sgVertex(v.positionOS.xyz + o, ...) - o` 로 부르면 돌풍과 위상이 월드 위치를 따른다.' },
    { title: '세게 불면 잎이 늘어나 키가 커진다', body: '옆으로만 밀면 뿌리에서 끝까지 거리가 늘어 잎이 길어진다. 뿌리에서 정점까지 길이를 재 두고, 민 방향으로 기울인 뒤 같은 길이로 맞춘다(`normalize` 한 뒤 원래 높이를 곱한다). 옆으로 간 만큼 끝이 내려온다. 이 계산은 뿌리가 y = 0 인 메시 기준이다.' },
    { title: 'Shader.SetGlobalFloat 로 바꿔도 풀이 그대로다', body: '`Properties` 와 `CBUFFER` 에 있는 값은 머티리얼 값이 이겨서 전역 값이 들어가지 않는다. 여러 풀을 한 번에 흔들려면 돌풍 값 `_Gust` 를 `Properties` 와 `CBUFFER` 에서 빼고, `CBUFFER` 밖에 `float _Gust;` 로 따로 선언한다. 셰이더는 지금처럼 `_Gust` 를 바람 세기에 더한다. 그러면 C# 한 줄 `Shader.SetGlobalFloat("_Gust", 값)` 이 모든 풀 머티리얼에 들어가고, 머티리얼 복사본도 만들지 않는다. `WindGust` 의 `material.SetFloat` 도 `Shader.SetGlobalFloat` 로 바꾸고 `_Gust` 를 0 에서 올렸다 0 으로 내리는 것은 그대로 둔다.' },
  ],
  unity: {
    setup: [
      '`WindSwayFoliage.shader`, `core.hlsl`, `WindGust.cs` 를 `Assets/Shaders/wind-sway-foliage/` 에 둔다.',
      'Project 창에서 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      '풀 메시의 MeshRenderer 에 머티리얼을 넣는다. 메시는 피벗이 뿌리(y = 0)에 있고 UV 의 v 가 뿌리 0 에서 끝 1 이어야 한다. 바람 방향은 Transform 의 Y 회전처럼 각도로 넣는다 (0 은 +Z, 90 은 +X). 오브젝트 공간 기준이라 회전하지 않은 풀에서는 월드와 같다.',
      '돌풍이 필요하면 같은 오브젝트에 `WindGust` 를 붙인다. 폭발이나 탈것 통과 같은 이벤트의 UnityEvent 에 `Gust()` 를 연결하거나, Auto Interval 에 초를 넣어 저절로 불게 한다. 머티리얼의 돌풍 값은 0 으로 둔다. 스크립트가 잠깐 올렸다 0 으로 되돌린다.',
    ],
    verify: '바람 세기를 올리면 잎 끝이 바람 방향 쪽으로 더 깊이 눕고 뿌리는 제자리에 있으며, 바닥 그림자도 잎과 함께 흔들린다. 바람 방향을 270 으로 바꾸면 반대쪽으로 눕고, `Gust()` 를 부르면 바람 세기가 얼마든 잠깐 더 깊이 누웠다가 돌아온다.',
    pitfalls: [
      '이 셰이더는 불투명 3D 메시용이다. 2D Renderer 는 `Universal2D` 와 `SRPDefaultUnlit` 태그만 그리므로 `UniversalForwardOnly` 패스가 그려지지 않는다. 3D 프로젝트(Universal Renderer)에서 쓴다.',
      '바람 방향, 세기, 노이즈는 오브젝트 공간에서 계산한다. 풀 오브젝트를 Y 로 돌리면 바람 방향도 함께 돌고, 스케일을 키우면 흔들림도 함께 커진다. 풀은 돌리지 않고 놓거나, 돌린 만큼 바람 방향 값을 빼서 넣는다.',
      '정적 배칭: Batching Static 을 켠 물체는 플레이와 빌드에서 정점이 월드 좌표로 합쳐져 `positionOS` 가 월드 위치가 된다. 그러면 바람 방향과 돌풍 노이즈, 떨림 위상이 월드 기준으로 바뀌어, Y 로 돌린 풀은 편집 모드와 플레이 모드에서 다른 쪽으로 분다. 바닥 높이가 0 이 아니면 뿌리가 y = 0 이 아니게 되어 길이 보정도 어긋나 세게 불 때 잎이 늘어난다. 풀 오브젝트는 Inspector 의 Static 에서 Batching Static 을 끈다.',
      '정점을 밀어도 Renderer 의 Bounds 는 원래 모양 그대로다. 풀이 화면 가장자리에 있으면 원래 Bounds 가 화면 밖으로 나가는 순간, 화면 안쪽으로 누운 잎까지 통째로 사라질 수 있다. 돌풍까지 더한 세기를 잎 높이의 절반 안쪽으로 두거나 메시의 `bounds` 를 넉넉히 키운다.',
      'Scene 뷰에서 흔들리지 않으면 Scene 뷰 툴바의 Effects 메뉴에서 Always Refresh 를 켠다. 편집 모드에서는 화면을 다시 그릴 때만 `_Time` 이 흐른다.',
      '얇은 잎을 양면(`Cull Off`)으로 그리면 잎이 자기 그림자에 줄무늬(그림자 여드름)가 생길 수 있다. 생기면 Directional Light 의 Shadows > Bias 에서 Depth, Normal 값을 조금 올린다.',
    ],
    graph: 'Shader Graph 에서는 Graph Settings 의 Render Face 를 Both 로 두고, 계산한 위치를 Vertex 의 Position 에 넣는다. Shader Graph 는 이 위치를 그림자와 깊이 패스에도 함께 쓰므로 그림자가 따로 놀지 않는다. `core.hlsl` 을 Custom Function 의 File 모드로 바로 읽으면 `SgInput` 과 머티리얼 값 선언이 없어 컴파일되지 않는다. 노드로 옮길 때는 UV 노드의 G(y)를 제곱한 마스크, Time 노드, Position(Object) 노드의 XZ 로 만든 Gradient Noise 를 같은 식으로 잇고, 길이 보정은 String 모드 Custom Function 에 `sgVertex` 의 마지막 네 줄을 옮긴다.',
  },
  prompt: {
    goal: '풀과 잎 메시의 정점을 높이(uv.y)에 따라 밀어, 뿌리는 고정되고 끝이 바람 방향으로 눕고 떨리는 셰이더를 넣는다. 그림자도 함께 흔들리고 C# 으로 돌풍을 일으킬 수 있다.',
    adaptIdeas: [
      '풀밭 전체의 풀 머티리얼을 `Shader.SetGlobalFloat` 전역 값 하나로 한꺼번에 흔드는 돌풍을 만들고 싶다.',
      '같은 풀 프리팹을 여러 개 놓아도 덩어리마다 흔들림이 다르도록 월드 위치를 위상과 노이즈에 섞고 싶다.',
      '플레이어가 지나가면 풀이 그 자리에서 옆으로 비켜 눕게 하고 싶다.',
      'UV 대신 정점 색 한 채널로 흔들림 마스크를 칠해 나무의 가지와 잎에 쓰고 싶다.',
      '물고기 꼬리나 깃발처럼 한 축을 따라 사인 물결이 지나가게 바꾸고 싶다.',
    ],
  },
  captures: [
    { name: 'storm', label: '폭풍', values: { _WindStrength: 0.85, _WindSpeed: 2.2, _Flutter: 0.09, _Gustiness: 0.9 } },
    { name: 'dry-autumn', label: '마른 가을 풀 (왼쪽으로 부는 바람)', values: { _WindAngle: 270, _WindStrength: 0.3, _Flutter: 0.07, _RootColor: '#5a4426', _TipColor: '#e3c27a' } },
  ],
  inspiredBy: [
    {
      title: 'Ghost of Tsushima (2020)',
      credit: 'Sucker Punch Productions',
      borrowed: ['일정한 바람 방향 위에서 노이즈로 바뀌는 세기', '바람에 함께 눕고 흔들리는 넓은 풀밭'],
      learned: 'GDC 2021 풀 발표 소개와 2022 바람 발표 요약에 따르면 바람은 방향을 일정하게 두고 노이즈로 세기를 바꾼다. 이 표본의 큰 흔들림(방향 하나, 흘러가는 돌풍 노이즈로 세기만 바꾸기)이 이 요약에서 왔다. 발표의 코드나 화면은 옮기지 않았다.',
      link: 'https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass',
    },
  ],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 정점 바람 기법을 이 갤러리에서 새로 작성했다. 수업 XR 04 Reel And Fish 의 `FishSwim` 은 물고기 몸통 축의 위치에 따라 정점을 사인으로 흔들고 위상을 C# 이 넘긴다. 이 표본은 같은 원리를 일반화했다. 흔들 정도는 `uv.y` 마스크가, 잎마다 다른 위상은 C# 대신 오브젝트 공간 위치가 정하고, 그 위에 바람 방향으로 흘러가는 노이즈 돌풍과 잎 길이 보정, 그림자까지 함께 미는 패스 구성을 더했다. 수업 3D 05 Terrain 의 풀과 나무에도 같은 방식을 쓸 수 있다. 다만 Terrain 의 디테일과 나무는 인스턴스마다 Y 로 무작위 회전해 놓이므로, 오브젝트 공간으로 계산하는 이 바람은 풀과 나무마다 다른 쪽으로 분다. 한 방향으로 불게 하려면 바람 방향을 월드에서 오브젝트 공간으로 바꿔 넣어야 한다.',
  references: [
    { label: 'GDC 2021 Advanced Graphics Summit: 절차적 풀 발표', url: 'https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass' },
    { label: 'Game Developer: 소용돌이 입자로 바람 시뮬레이션하기 (GDC 2022 요약)', url: 'https://gamedeveloper.com/design/using-vorticles-to-simulate-wind-in-i-ghost-of-tsushima-i-' },
    { label: 'Unity 블로그: Shader Graph 로 움직이는 머티리얼 만들기', url: 'https://unity.com/blog/engine-platform/creating-animated-materials-with-shader-graph' },
  ],
  related: [
    { id: 'inverted-hull-outline', why: '정점을 미는 또 다른 표본. 어느 패스가 밀린 정점을 써야 하는지 함께 본다' },
    { id: 'dissolve-edge-glow', why: '그림자 패스를 본체와 맞추지 않으면 그림자가 따로 노는 같은 문제를 알파로 본다' },
  ],
}
