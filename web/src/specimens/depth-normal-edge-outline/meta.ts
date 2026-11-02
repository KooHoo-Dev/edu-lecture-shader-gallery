import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'depth-normal-edge-outline',
  title: '깊이·법선 윤곽선 후처리',
  titleEn: 'Depth Normal Edge Outline',
  group: 'G',
  order: 2,
  oneLiner: '깊이와 법선 차이로 전체 화면에 윤곽선을 그린다',
  goals: [
    'Roberts Cross 로 이웃 픽셀의 깊이 차이와 법선 차이를 재어 윤곽을 만들 수 있다.',
    '깊이 차이를 거리로 나눈 상대 차이로 써야 같은 각도로 보이는 면에 거리와 상관없이 같은 기준이 통하는 이유와, 아주 비스듬히 보이는 면에는 그래도 차이가 남는 이유를 설명할 수 있다.',
    'Full Screen Pass Renderer Feature 의 Requirements 에서 Depth 와 Normal 을 켜고 머티리얼을 연결할 수 있다.',
    '후처리 윤곽과 껍데기 외곽선을 비용, 선 두께의 단위, 잡는 모서리로 비교해 상황에 맞게 고를 수 있다.',
  ],
  tags: ['전체 화면', '깊이 텍스처', '법선 텍스처', '윤곽선 검출', 'Full Screen Pass'],
  difficulty: 3,
  shaderFile: 'DepthNormalEdgeOutline.shader',
  stage: { kind: 'fullscreen' },
  requires: ['depth', 'normals'],
  params: [
    { key: '_Thickness', label: '선 두께', type: 'range', min: 1, max: 4, step: 1, default: 3, unit: 'px', hint: '이웃을 재는 샘플 간격(픽셀). 선이 그만큼 굵어진다. 넓게 잴수록 비스듬한 면의 깊이 차이도 커져 먼 바닥이 먼저 번진다. 화면 픽셀 단위라 해상도와 렌더 스케일이 바뀌면 화면 비율로는 두께가 달라진다' },
    { key: '_DepthSensitivity', label: '깊이 민감도', type: 'range', min: 0, max: 40, step: 0.5, default: 12, hint: '거리로 나눈 깊이 차이에 곱한다. 올리면 물체 실루엣 안쪽의 얕은 단차까지 선이 생기고, 0 이면 깊이 윤곽이 꺼져 법선 윤곽만 남는다' },
    { key: '_NormalSensitivity', label: '법선 민감도', type: 'range', min: 0, max: 4, step: 0.05, default: 1.5, hint: '법선 차이에 곱한다. 올리면 완만하게 꺾인 면에도 선이 생기고, 0 이면 상자 모서리와 바닥에 닿는 곳의 선이 빠진다' },
    { key: '_LineColor', label: '선 색', type: 'color', default: '#fff0c8', hint: '모든 윤곽이 같은 색이다. 물체마다 다른 색은 후처리 방식으로는 어렵다' },
    { key: '_FadeDistance', label: '선이 사라지는 거리', type: 'range', min: 5, max: 100, step: 1, default: 30, unit: 'm', hint: '이 거리의 절반부터 선이 흐려지다가 이 거리에서 사라진다. 낮추면 먼 바닥 끝과 뒤쪽 물체의 선부터 지워진다' },
    { key: '_SceneMix', label: '원래 화면 섞기', type: 'range', min: 0, max: 1, step: 0.01, default: 1, hint: '1 이면 원래 화면 위에 선만 얹고, 0 이면 바탕을 종이 색으로 바꿔 선만 남긴다' },
    { key: '_PaperColor', label: '종이 색', type: 'color', default: '#1b2433', hint: '원래 화면 섞기를 1 보다 낮출 때만 보인다. 선 색과 대비가 큰 색을 고른다' },
  ],
  presets: [
    { id: 'bright-outline', name: '밝은 윤곽', look: '어두운 장면 위에 밝은 선을 둘러 실루엣과 모서리를 짚는다', values: {} },
    { id: 'ink-outline', name: '먹선 윤곽', look: '밝은 물체에 어두운 먹선을 두른 만화 느낌. 어두운 배경 쪽 선은 묻힌다', values: { _LineColor: '#0d0f14' } },
    { id: 'sketch', name: '스케치 룩', look: '바탕을 종이 색으로 바꾸고 가는 연필 선만 남긴다', values: { _SceneMix: 0, _PaperColor: '#f2ecdf', _LineColor: '#3a332c', _Thickness: 2 } },
    { id: 'blueprint', name: '설계도', look: '남색 바탕에 가는 흰 선만 남은 설계도 느낌', values: { _SceneMix: 0, _PaperColor: '#1f3d6e', _LineColor: '#e8f1ff', _Thickness: 1 } },
  ],
  events: [],
  demo: {
    // 원래 화면과 종이 바탕을 천천히 오간다. 선은 그대로이고 바탕만 바뀐다는 것을 보여 준다
    loops: [{ key: '_SceneMix', frames: [[0, 1], [2.5, 1], [4, 0], [6.5, 0], [8, 1]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: '깊이 윤곽', body: '대각선 두 쌍의 깊이 차이를 가장 가까운 거리로 나눈 값이다. 물체가 뒤 배경과 갈라지는 실루엣이 하얀 선으로 나온다. 상자 윗면 뒤쪽 모서리처럼 법선이 바닥과 같은 경계도 여기서 잡힌다. 상자 앞 모서리와 바닥에 닿는 아래쪽처럼 깊이가 이어진 접힌 곳은 비어 있다. 바닥 끝 바로 아래의 흐린 회색 띠는 아주 비스듬히 보이는 바닥이다. 거리로 나눠도 각도가 얕으면 차이가 남는다.' },
    { n: 2, label: '법선 윤곽', body: '대각선 두 쌍의 법선 차이다. 상자 모서리와 상자가 바닥에 닿는 곳처럼 면이 꺾이는 곳이 하얗게 나온다. 법선이 바닥과 같은 상자 윗면 뒤쪽 모서리는 비어 있어, 깊이 윤곽과 서로 빈 곳을 메운다. 하늘은 법선이 0 이라 바닥 끝과 공 윗부분에도 선이 생긴다.' },
    { n: 3, label: '합친 윤곽', body: '두 윤곽 중 강한 쪽을 쓰고 먼 곳은 흐린다. 하얀 곳이 선이 들어갈 자리다. 바닥 끝은 하늘(먼 평면)과 맞닿아 깊이와 법선이 함께 뛰므로 화면을 가로지르는 한 줄이 된다. 선이 사라지는 거리를 10m 아래로 낮추면 이 줄과 그 아래 띠부터 지워진다.' },
  ],
  offNote: '깊이 차이를 거리로 나누지 않고 미터 그대로 잰 흔한 실수. 물체가 놓인 4m 근처에서 맞춘 민감도라 물체 윤곽은 비슷해 보이지만, 비스듬히 보이는 뒤쪽 바닥이 지평선 쪽으로 갈수록 선 색으로 칠해져 넓은 띠가 된다. 같은 각도의 바닥도 멀수록 한 픽셀 사이의 깊이 차이가 커지기 때문이다. 띠를 지우려고 민감도를 낮추면 이번에는 가까운 얕은 단차의 선이 빠진다.',
  mistakes: [
    { title: '상자 모서리나 물체가 바닥에 닿는 곳에 선이 없다', body: '법선 텍스처가 비어 깊이 윤곽만 남은 모습이다. 법선 텍스처는 SSAO 처럼 법선을 요청하는 기능이 없으면 만들어지지 않는다. 다른 기능이 우연히 요청하고 있어 되던 프로젝트도 SSAO 를 끄면 접힌 곳의 선이 사라진다. Full Screen Pass Renderer Feature 의 Requirements 에서 **Depth** 와 **Normal** 을 함께 켠다. Window > Analysis > Frame Debugger 에서 `_CameraNormalsTexture` 가 만들어지는지 본다.' },
    { title: '먼 바닥이 선 색 띠로 덮인다', body: '깊이 차이를 미터 그대로 쓰면 같은 각도의 바닥도 멀수록 한 픽셀 사이 깊이 차이가 커진다. 깊이 차이를 그 픽셀까지의 거리로 나눈 상대 차이를 쓴다. 그래도 바닥이 아주 비스듬하면 차이가 커져 선이 번진다. 샘플 간격이 화면 픽셀이라 해상도나 Render Scale 이 낮을수록 한 간격이 더 넓은 바닥을 건너뛰어 띠도 넓어진다. 정석 해결은 깊이 문턱을 그 픽셀의 `1 / dot(N, V)`(N 은 법선, V 는 카메라 쪽 방향)만큼 키워 비스듬히 보이는 면일수록 덜 예민하게 하는 것이다. 간단히는 깊이 민감도나 선 두께를 낮추거나 선이 사라지는 거리를 줄인다.' },
    { title: '투명 물체나 직접 만든 셰이더 물체에 윤곽이 없다', body: 'Requirements 의 Normal 을 켜면 불투명 물체를 `DepthNormals` 패스로 한 번 더 그리는 프리패스가 돌고, 깊이 텍스처도 이 프리패스에서 나온다. 그래서 직접 쓴 언릿·툰 셰이더처럼 이 패스가 없는 물체는 화면에는 보이는데 깊이와 법선 어디에도 없어 선이 하나도 생기지 않는다. 그 셰이더에 노멀 패스를 더한다 (Forward 전용 셰이더는 `"LightMode" = "DepthNormalsOnly"`, [디졸브](#/s/dissolve-edge-glow) 래퍼의 노멀 패스 참고). 유리, 물, 파티클 같은 투명 물체는 이 프리패스에 들어가지 않아 선이 없고, 그 뒤 불투명 물체의 윤곽이 투명 물체를 뚫고 보인다. 투명 물체에 선이 필요하면 그 물체만 껍데기 외곽선(`inverted-hull-outline`)을 쓴다.' },
    { title: '지평선이나 바닥 끝에 긴 선이 생긴다', body: '하늘은 깊이가 먼 평면(카메라 Far)이고 법선이 0 이라, 바닥이 하늘과 맞닿는 곳은 깊이와 법선이 모두 크게 뛰어 선이 된다. 원하지 않으면 선이 사라지는 거리를 바닥 끝보다 짧게 두거나, 샘플 중 하나라도 Far 근처면 선을 빼는 조건을 넣는다. 다만 하늘을 배경으로 선 물체의 실루엣도 함께 빠진다.' },
    { title: '해상도나 품질 설정에 따라 선 두께가 바뀐다', body: '두께가 화면 픽셀 단위라 해상도가 높을수록 화면 비율로는 얇아진다. URP Asset 의 Render Scale 을 낮추면 버퍼가 작아져 선이 굵고 거칠어진다. MSAA 를 켜도 깊이·법선 텍스처는 샘플 하나로 줄어든 채 읽히므로 선 가장자리는 계단진다. 화면 색은 MSAA 로 부드러워 선과 물체 가장자리가 반 픽셀쯤 어긋나 보일 수 있다 (Unity 에서 직접 확인하지는 않았다). 선의 계단에는 이 패스 뒤에 도는 카메라의 FXAA·SMAA(Post Processing 을 켠 카메라의 Anti-aliasing)가 도움이 된다. 기준 해상도에서 `_Thickness` 를 정하고, 필요하면 C# 에서 화면 높이에 비례해 넣는다.' },
  ],
  unity: {
    setup: [
      '`DepthNormalEdgeOutline.shader`, `core.hlsl` 을 `Assets/Shaders/depth-normal-edge-outline/` 에 둔다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      '사용 중인 Universal Renderer Data 의 Add Renderer Feature 에서 Full Screen Pass Renderer Feature 를 추가한다.',
      'Pass Material 에 머티리얼을 넣고 Injection Point 를 Before Rendering Post Processing 으로, Fetch Color Buffer 를 켠다.',
      '같은 기능의 Requirements 에서 Depth 와 Normal 을 켠다. Color 는 Fetch Color Buffer 가 맡으므로 따로 고르지 않아도 된다.',
    ],
    verify: 'Game 뷰의 물체 실루엣과 상자 모서리, 물체가 바닥에 닿는 곳에 밝은 크림색 선이 생긴다. 법선 민감도를 0 으로 내리면 상자 모서리와 바닥에 닿는 곳의 선이 빠지고, 원래 화면 섞기를 0 으로 내리면 종이 색 바탕에 선만 남는다.',
    pitfalls: [
      '법선 텍스처는 Requirements 의 Normal 이나 SSAO 같은 다른 기능이 요청할 때만 만들어진다. Normal 을 켜지 않으면 법선이 비어 상자 모서리처럼 깊이가 이어진 접힌 곳의 선이 빠진다. 또 깊이·법선 텍스처에는 `DepthNormals` 패스가 있는 불투명 물체만 들어간다. 투명 머티리얼, 파티클, 투명 큐의 물체와 노멀 패스 없이 직접 쓴 셰이더의 물체에는 선이 없다.',
      '비용은 두 가지다. Normal 을 켜면 불투명 물체 전체를 한 번 더 그리는 프리패스가 돌아 물체 수에 비례하고 (SSAO 처럼 이미 법선을 요청하는 기능이 있으면 추가 비용 없음), 전체 화면 패스가 픽셀마다 깊이·법선을 8번 읽어 해상도에 비례한다. 모바일과 XR 에서 크다. XR 은 눈마다 텍스처 배열을 쓰므로 실기기에서 확인한다.',
      'Deferred 렌더 경로에서 Accurate G-buffer Normals 를 켜면 법선 텍스처가 부호화되어 저장된다. 래퍼의 `#pragma multi_compile_fragment _ _GBUFFER_NORMALS_OCT` 를 지우면 그 값을 그대로 법선으로 읽어 매끈한 공에도 얼룩 선이 생긴다.',
      'Renderer Feature 는 그 렌더러를 쓰는 모든 카메라에 적용된다. 미니맵이나 UI 카메라처럼 선이 필요 없는 카메라는 다른 렌더러를 쓰게 한다.',
      '3D 프로젝트(Universal Renderer)용이다. URP 소스로 보면 2D Renderer 는 법선 텍스처(`_CameraNormalsTexture`)를 만들지 않으므로 Requirements 의 Normal 을 켜도 법선 윤곽은 쓸 수 없다. 스프라이트에는 월드 법선도 없다.',
      'Screen Space - Overlay Canvas 는 이 패스가 끝난 뒤에 그려져 UI 에는 선이 생기지 않는다.',
    ],
    graph: 'Shader Graph 에서는 Fullscreen 타깃을 쓴다. URP Sample Buffer 노드의 BlitSource 가 `sgSource`, NormalWorldSpace 가 `sgSceneNormal` 역할이고, Scene Depth 노드를 Eye 모드로 두면 `sgSceneDepth` 와 같다. 네 점의 uv 는 Screen Position 에 픽셀 크기(1 / Screen 노드의 Width, Height)를 곱한 오프셋을 더해 만들고, 각 점마다 노드를 하나씩 두어 대각선 차이를 뺀다.',
  },
  prompt: {
    goal: '깊이와 법선 차이로 화면 전체의 물체에 윤곽선을 그리는 후처리를 넣는다. 내장 Full Screen Pass Renderer Feature 에 머티리얼로 연결하고, 선 두께와 민감도, 선 색, 거리 감쇠, 원래 화면을 종이 색으로 바꾸는 스케치 룩을 머티리얼 값으로 조절한다.',
    adaptIdeas: [
      'Volume 컴포넌트로 장면이나 구역마다 선 색과 두께를 바꾸고 싶다 (C# 로 Volume 값을 머티리얼에 옮긴다).',
      '해상도가 바뀌어도 선이 화면 비율로 같은 두께로 보이게 C# 에서 화면 높이에 맞춰 두께를 넣고 싶다.',
      '원래 화면의 색 차이도 윤곽에 더해 무늬와 텍스처 경계에도 선이 생기게 하고 싶다.',
      '스케치 룩에 노이즈로 선을 흔들고 종이 결 텍스처를 깔고 싶다.',
      '특정 레이어(플레이어, 아이템)만 다른 색 선을 두르고 싶다. 그 물체는 껍데기 외곽선과 섞어 쓴다.',
    ],
  },
  captures: [
    { name: 'sketch', label: '스케치 룩', values: { _SceneMix: 0, _PaperColor: '#f2ecdf', _LineColor: '#3a332c', _Thickness: 2 } },
    { name: 'no-normal', label: '깊이 윤곽만 (법선 민감도 0)', values: { _NormalSensitivity: 0 } },
  ],
  // 기본 촬영은 줄였을 때 3px 선이 2px 아래로 얇아져 약하다. 밝은 종이 위 진한 선이 작은 썸네일에서도 잘 보인다
  thumbnail: 'sketch',
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 후처리 기법이다. 수업 3D 14 Animation 의 `SimpleUnlitToon` 껍데기 외곽선과 비교하는 수업을 위해, 깊이 차이를 거리로 나눈 상대 차이, 거리 감쇠, 종이 색 바탕의 스케치 룩을 조절 값으로 꺼냈다. 코드는 이 갤러리에서 새로 작성했다.',
  references: [
    { label: 'Unity Shader Graph 샘플: Production Ready 후처리 (Edge Detection)', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Post.html' },
    { label: 'Unity 6 셰이더·VFX 전자책 (URP)', url: 'https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6' },
    { label: 'Real Time VFX: 모바일 URP 의 법선 외곽선 토론', url: 'https://realtimevfx.com/t/unity-outline-by-normals-for-mobile-game-urp/14919' },
  ],
  related: [
    { id: 'inverted-hull-outline', why: '고른 물체만 껍데기로 한 번 더 그리는 외곽선. 물체마다 색과 두께를 달리할 수 있고, 두께가 월드 단위라 멀어지면 가늘어지며, 실루엣 바깥만 그린다. 이 후처리는 전체 화면 패스에 불투명 물체 전체를 한 번 더 그리는 프리패스가 붙고 (SSAO 등이 이미 쓰면 추가 비용 없음), 두께가 화면 픽셀로 고정되며, 상자 모서리처럼 실루엣 안쪽에 접힌 모서리까지 잡는다' },
    { id: 'screen-transition-wipe', why: '같은 Full Screen Pass 연결 방식. 이 표본은 여기에 Requirements 의 Depth, Normal 을 더한다' },
    { id: 'toon-ramp-lit', why: '툰 음영과 합치면 만화 같은 화면이 된다' },
  ],
}
