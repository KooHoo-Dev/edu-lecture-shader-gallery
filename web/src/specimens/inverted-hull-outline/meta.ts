import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'inverted-hull-outline',
  title: '껍데기 외곽선',
  titleEn: 'Inverted Hull Outline',
  group: 'B',
  order: 2,
  oneLiner: '부풀린 뒷면을 한 번 더 그려 외곽선을 만든다',
  goals: [
    '같은 물체를 패스 두 개로 그리고, 외곽선 패스에만 `Cull Front` 를 쓰는 이유를 설명할 수 있다.',
    '정점 셰이더에서 정점을 바깥으로 밀어 두께를 조절할 수 있다.',
    '각진 메시에서 법선이 갈라져 모서리 외곽선이 끊기는 이유와 해결 방법을 설명할 수 있다.',
    'C# 에서 `_OutlineAmount` 를 올리고 내려 선택한 물체에만 외곽선을 켤 수 있다.',
  ],
  tags: ['멀티 패스', 'Cull Front', '정점 변형', '외곽선', '선택 표시'],
  difficulty: 2,
  shaderFile: 'InvertedHullOutline.shader',
  stage: { kind: 'mesh', mesh: 'cube', blend: 'cutout', outline: true },
  params: [
    { key: '_OutlineWidth', label: '외곽선 두께', type: 'range', min: 0, max: 0.15, step: 0.005, default: 0.04, hint: '껍데기를 밀어내는 거리(오브젝트 공간 미터). 물체 스케일과 카메라 거리에 따라 화면 두께가 달라진다' },
    { key: '_OutlineColor', label: '외곽선 색', type: 'color', default: '#ffc94d', hint: '조명과 상관없는 단색. 그늘 쪽 윤곽에서도 그대로다' },
    { key: '_OutlineAmount', label: '외곽선 켜기', type: 'range', min: 0, max: 1, step: 0.01, default: 1, hint: 'C# 이 선택할 때 0 에서 1 로 올린다. 0 이면 껍데기가 본체 안으로 숨는다' },
    {
      key: '_PushDir',
      label: '미는 방향',
      type: 'select',
      options: [
        { value: '0', label: '법선' },
        { value: '1', label: '중심에서 바깥' },
      ],
      default: '1',
      hint: '법선은 구, 캐릭터처럼 부드러운 메시용. 이 큐브처럼 각진 메시에서 법선을 고르면 모서리마다 선이 끊긴다',
    },
    { key: '_BaseColor', label: '기본 색', type: 'color', default: '#4f86c6', hint: '본체 색. 조명을 곱한 단순한 음영이다' },
  ],
  presets: [
    { id: 'selected', name: '선택한 물체', look: '노란 테두리로 지금 고른 물체를 알린다', values: {} },
    { id: 'toon-ink', name: '툰 잉크 선', look: '밝은 몸에 어두운 먹선을 두른 만화 느낌. 어두운 배경 쪽 윤곽은 묻힌다', values: { _OutlineColor: '#141821', _OutlineWidth: 0.03, _BaseColor: '#f2c38b' } },
    { id: 'attack-target', name: '공격 대상 표시', look: '무채색 몸에 굵은 빨간 테두리로 노리는 적을 가린다', values: { _OutlineColor: '#ff4a3d', _OutlineWidth: 0.07, _BaseColor: '#8c919c' } },
    { id: 'fine-line', name: '가는 윤곽선', look: '아주 얇은 흰 선으로 실루엣만 떼어 낸다', values: { _OutlineColor: '#ffffff', _OutlineWidth: 0.015, _BaseColor: '#3d4a5c' } },
  ],
  events: [
    {
      id: 'select',
      label: '선택',
      // 고르기 전(외곽선 없음)을 잠깐 보여 준 뒤, HullOutlineSelection.Select() 처럼 0.12초 동안 외곽선을 키운다.
      tracks: [{ key: '_OutlineAmount', frames: [[0, 0], [0.4, 0], [0.52, 1]], ease: 'outQuad' }],
    },
  ],
  demo: {
    // 선택과 해제를 번갈아 보여 준다. 외곽선은 0.12초 동안 자라고 줄어든다. 한 번에 한 번만 바뀌어 번쩍이지 않는다.
    loops: [{ key: '_OutlineAmount', frames: [[0, 1], [2.4, 1], [2.52, 0], [3.8, 0], [3.92, 1]], ease: 'linear' }],
  },
  steps: [
    { n: 1, label: '본체만', body: '본체는 기본 색에 조명을 곱한 음영이다. 이 단계에서는 껍데기도 같은 식으로 칠해 외곽선 색을 감췄다. 윤곽 둘레에 본체와 같은 색이지만 면과 밝기가 다른 띠가 붙어 실루엣이 살짝 부푼 것이 보인다. 그 띠가 본체 뒤에서 삐져나온 껍데기의 뒷면이다.' },
    { n: 2, label: '앞면까지 그리면', body: '부풀린 껍데기를 앞면까지 그리면 껍데기가 본체보다 카메라에 가까워 본체를 통째로 덮는다. 외곽선 색 덩어리만 남는다. 외곽선 패스에 `Cull Front` 를 넣는 이유다.' },
    { n: 3, label: 'Cull Front', body: '껍데기의 앞면을 버리고 뒷면만 그린다. 뒷면은 본체 뒤에 있어 대부분 가려지고, 윤곽 바깥으로 삐져나온 띠만 남아 외곽선이 된다. `_OutlineWidth` 가 그 띠의 폭이다.' },
  ],
  offNote: '각진 메시에서 정점 법선 그대로 껍데기를 민 흔한 실수. 큐브는 모서리 정점이 면마다 따로 있고 법선도 면마다 달라, 여섯 면이 제각기 밀려 나가며 모서리마다 외곽선이 끊기고 이가 빠진다. 두께를 올릴수록 틈이 커진다. 미는 방향을 법선으로 바꿔도 같은 모습이다.',
  mistakes: [
    { title: '각진 메시에서 모서리마다 외곽선이 끊긴다', body: '큐브나 로우폴리 소품은 모서리 정점이 면마다 따로 있고 법선도 갈라져 있다. 법선 방향으로 밀면 면이 제각기 떨어져 나가 모서리에 틈이 생긴다. 피벗이 가운데인 볼록한 메시는 이 표본의 미는 방향을 **중심에서 바깥** 으로 둔다. 캐릭터처럼 오목한 메시는 같은 자리의 법선을 평균한 부드러운 법선을 DCC 도구나 에디터 스크립트로 UV 채널(예: UV3)에 구워 두고, 래퍼의 `vertOutline` 에서 그 채널을 읽어 민다.' },
    { title: '물체 전체가 외곽선 색으로 덮인다', body: '외곽선 패스가 `Cull Back`(기본값)이거나 `Cull Off` 이면 부풀린 껍데기의 앞면이 본체를 가린다. 외곽선 패스에만 `Cull Front` 를 넣고 본체 패스는 그대로 둔다.' },
    { title: '외곽선 패스가 아예 그려지지 않는다', body: 'URP 는 같은 `LightMode` 태그의 패스가 둘이면 첫 패스만 그린다. 두 패스를 모두 `UniversalForward` 로 두면 외곽선이 사라진다. 외곽선 패스는 `"LightMode" = "SRPDefaultUnlit"` 으로 둔다.' },
    { title: '멀리 가면 선이 가늘어지고 가까이 오면 굵어진다', body: '두께가 오브젝트 공간 길이라 원근에 따라 화면 두께가 바뀐다. 화면에서 같은 두께를 원하면 래퍼의 `vertOutline` 에서 클립 공간으로 민다. 위치와 법선을 클립 공간으로 바꾼 뒤 `positionCS.xy += normalize(법선CS.xy) * 픽셀두께 * 2 / _ScreenParams.xy * positionCS.w` 처럼 화면 크기로 나누고 `w` 를 곱한다. `sgVertex` 는 오브젝트 공간 위치만 돌려주므로 이 보정은 래퍼에서 한다.' },
    { title: '스케일을 키운 물체만 외곽선이 굵다', body: '오브젝트 공간 두께는 Transform 스케일과 함께 커진다. 스케일이 다른 물체를 같은 두께로 보이게 하려면 C# 에서 `_OutlineWidth` 를 스케일로 나눠 넣거나, 위의 클립 공간 보정을 쓴다. 비균일 스케일이면 방향마다 두께가 달라진다.' },
  ],
  unity: {
    setup: [
      '`InvertedHullOutline.shader`, `core.hlsl`, `HullOutlineSelection.cs` 를 `Assets/Shaders/inverted-hull-outline/` 에 둔다.',
      'Project 창에서 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      '머티리얼을 대상 MeshRenderer 에 넣는다. Inspector 에서 외곽선 두께와 색을 맞춘다. 큐브 같은 각진 볼록 메시는 미는 방향을 FromCenter, 구나 캐릭터처럼 부드러운 메시는 Normal 로 둔다.',
      '선택 표시에 쓸 때는 같은 오브젝트에 `HullOutlineSelection` 을 붙인다. 고를 때 `Select()`, 놓을 때 `Deselect()` 를 호출한다. 인자가 없어 Inspector 의 UnityEvent(예: XR Simple Interactable 의 Hover Entered, Hover Exited)에 바로 연결할 수 있다.',
    ],
    verify: '외곽선 두께를 올리면 물체 둘레의 선이 굵어지고 0 으로 내리면 사라진다. 큐브에서 미는 방향을 Normal 로 바꾸면 모서리마다 선이 끊긴다.',
    pitfalls: [
      '이 셰이더는 불투명 3D 메시용이다. 본체 패스가 `UniversalForwardOnly` 라 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트에서 쓴다.',
      '물체를 두 번 그리므로 외곽선을 켠 물체마다 그리기 호출이 하나씩 늘어난다. `HullOutlineSelection` 은 외곽선이 꺼진 동안 `SetShaderPassEnabled` 로 외곽선 패스를 건너뛴다. 장면의 모든 물체에 상시 외곽선이 필요하면 깊이와 법선으로 화면에서 한 번에 그리는 후처리 방식과 비교한다.',
      '미는 방향 FromCenter 는 피벗이 메시 가운데 있는 볼록한 메시에서만 고르게 부푼다. 피벗이 발밑이거나 팔다리가 있는 메시는 한쪽으로 쏠린다. 이런 메시는 Normal 로 두고 부드러운 법선을 굽는다.',
      '평면(Quad, Plane)처럼 뒤가 비어 있는 메시는 껍데기의 뒷면이 앞을 향해 외곽선이 면 전체를 덮거나 비어 보인다. 닫힌 메시에 쓴다.',
      '외곽선 색은 조명과 그림자를 받지 않는 단색이다. 외곽선은 그림자를 드리우지 않고 깊이와 노멀 텍스처에도 들어가지 않는다.',
    ],
    graph: 'Shader Graph 는 그래프에 `Cull Front` 패스를 직접 하나 더 넣을 수 없어 이 구성을 그래프 하나로 만들 수 없다. 본체는 그래프로 만들고, 외곽선만 이 셰이더의 외곽선 패스를 떼어 낸 두 번째 머티리얼로 MeshRenderer 의 Materials 에 하나 더 넣거나 Render Objects 렌더러 기능으로 덧그린다.',
  },
  prompt: {
    goal: '3D 물체를 법선 방향으로 부풀린 껍데기의 뒷면으로 한 번 더 그려 외곽선을 두르는 셰이더를 넣는다. 각진 메시에서도 모서리가 끊기지 않고, 선택한 물체에만 C# 로 외곽선을 켠다.',
    adaptIdeas: [
      '카메라에서 멀어져도 외곽선이 화면에서 같은 픽셀 두께로 보이게 클립 공간 보정을 넣고 싶다.',
      'XR 에서 손이 다가가면(Hover) 외곽선이 켜지고, 잡으면(Select) 색이 바뀌게 하고 싶다.',
      '캐릭터 메시의 부드러운 법선을 UV3 에 굽는 에디터 스크립트를 만들어 각진 갑옷에서도 선이 끊기지 않게 하고 싶다.',
      '정점 색의 한 채널로 부위마다 외곽선 두께를 다르게 하고 싶다.',
      '툰 셰이딩 본체와 합쳐 만화 같은 캐릭터를 만들고 싶다.',
    ],
  },
  captures: [
    { name: 'toon-ink', label: '툰 잉크 선', values: { _OutlineColor: '#141821', _OutlineWidth: 0.03, _BaseColor: '#f2c38b' } },
    { name: 'normal-push', label: '법선으로 밀기 (모서리 끊김)', values: { _PushDir: '0', _OutlineWidth: 0.08 } },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 수업 3D 14 Animation 의 `SimpleUnlitToon` 과 같은 2패스 구성(본체 패스와 `Cull Front` 외곽선 패스)이다. 이 표본은 거기에 두께와 켜기 값을 조절 값으로 꺼내 C# 로 선택한 물체에만 외곽선을 켜는 선택 표시, 각진 메시의 모서리 끊김을 막는 미는 방향 선택을 더했다. 코드는 이 갤러리에서 새로 작성했다.',
  references: [
    { label: 'Unity 6 셰이더·VFX 전자책 (URP)', url: 'https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6' },
    { label: 'Real Time VFX: 모바일 URP 의 법선 외곽선 토론', url: 'https://realtimevfx.com/t/unity-outline-by-normals-for-mobile-game-urp/14919' },
    { label: 'Daniel Ilett: PSX Shaders Pro 1.4 껍데기 외곽선', url: 'https://danielilett.itch.io/psx-shaders-pro-for-unity-urp/devlog/998452/version-14-brings-hull-outlines-and-texel-aligned-shading' },
  ],
  related: [
    { id: 'fresnel-rim-glow', why: '같은 메시 무대에서 윤곽을 셰이더 한 패스로 밝히는 방법. 외곽선과 달리 실루엣 바깥으로 나가지 못한다' },
    { id: 'xray-occluded-silhouette', why: '같은 물체를 한 번 더 그리되 깊이 테스트를 바꿔 가려진 부분만 칠하는 짝' },
  ],
}
