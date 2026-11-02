import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'screen-transition-wipe',
  title: '화면 전환 와이프',
  titleEn: 'Screen Transition Wipe',
  group: 'G',
  order: 1,
  oneLiner: '진행값과 순서 값을 비교해 화면을 덮고 걷는다. 원, 대각선, 마름모 격자를 한 셰이더로',
  goals: [
    '순서 값과 진행값을 비교하는 방식으로 여러 전환 모양을 만들 수 있다.',
    '화면비를 곱해 원이 타원이 되지 않게 할 수 있다.',
    'Full Screen Pass Renderer Feature 에 머티리얼을 연결할 수 있다.',
    '코루틴으로 덮기, 씬 로드, 걷기 순서를 구성할 수 있다.',
  ],
  tags: ['전체 화면', '마스크', 'Full Screen Pass', '코루틴'],
  difficulty: 1,
  shaderFile: 'ScreenTransitionWipe.shader',
  stage: { kind: 'fullscreen' },
  params: [
    { key: '_Progress', label: '진행', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, hint: '0 이면 장면, 1 이면 완전히 덮인다. C# 이 움직인다' },
    {
      key: '_Pattern',
      label: '모양',
      type: 'select',
      options: [
        { value: '0', label: '마름모 격자' },
        { value: '1', label: '원' },
        { value: '2', label: '대각선' },
      ],
      default: '0',
    },
    { key: '_Cells', label: '격자 칸 수', type: 'range', min: 2, max: 24, step: 1, default: 9, hint: '마름모 격자에서만 쓴다' },
    { key: '_Softness', label: '경계 부드러움', type: 'range', min: 0, max: 0.3, step: 0.005, default: 0.03 },
    { key: '_CoverColor', label: '덮개 색', type: 'color', default: '#08080f' },
    { key: '_RimColor', label: '경계 빛 색', type: 'color', default: '#ff8c33' },
    { key: '_RimGlow', label: '경계 빛 밝기', type: 'range', min: 0, max: 4, step: 0.05, default: 0.8 },
  ],
  presets: [
    { id: 'diamond', name: '마름모 격자', look: '칸마다 차례로 닫힌다. 레트로 액션 느낌', values: {} },
    { id: 'iris', name: '원형 닫힘', look: '가운데로 조여드는 고전 아이리스', values: { _Pattern: '1', _Softness: 0.01, _RimGlow: 0 } },
    { id: 'sweep', name: '빛나는 대각선', look: '넓은 빛 띠가 쓸고 지나간다', values: { _Pattern: '2', _Softness: 0.08, _RimGlow: 2.2 } },
  ],
  events: [
    {
      id: 'play',
      label: '전환 재생',
      tracks: [{ key: '_Progress', frames: [[0, 0], [0.8, 1], [1.2, 1], [2, 0]], ease: 'inOutSine' }],
    },
  ],
  demo: {
    loops: [{ key: '_Progress', frames: [[0, 0], [1.2, 0], [2.2, 1], [2.8, 1], [3.8, 0]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: '순서', body: '화면 위치마다 덮이는 차례를 0~1 로 정한다. 어두운 곳이 먼저 덮인다. 전환 모양은 이 값이 전부 결정한다.' },
    { n: 2, label: '마스크', body: '진행값이 순서 값을 넘은 곳이 1 이 된다. `smoothstep` 폭이 경계 부드러움이다. 진행 슬라이더를 움직여 본다.' },
    { n: 3, label: '경계', body: '`mask * (1 - mask)` 는 마스크가 0.5 인 경계에서만 값이 있다. 여기에 빛 색을 곱하면 경계만 빛난다.' },
  ],
  offNote: '순서 없이 화면 전체를 같은 속도로 섞는 페이드. 흐려지기만 해서 장면이 넘어간다는 신호가 약하다.',
  mistakes: [
    { title: '원이 타원이 된다', body: 'UV 는 가로세로가 모두 0~1 이라 그대로 거리를 재면 화면비만큼 찌그러진다. `float2(aspect, 1.0)` 를 곱해 실제 비율로 잰다.' },
    { title: '끝났는데 화면이 덮여 있다', body: '머티리얼 에셋의 값은 플레이를 멈춰도 남는다. `OnDisable` 에서 `_Progress` 를 0 으로 되돌린다.' },
    { title: '진행값 0 이나 1 에서 경계가 남는다', body: '진행값을 그대로 쓰면 양 끝에서 덜 비거나 덜 찬다. 진행값 범위를 경계 폭만큼 넓혀 양 끝에서 정확히 0 과 1 이 되게 한다.' },
    { title: '씬 로딩 중 전환이 멈칫한다', body: '`Time.deltaTime` 은 로딩 프레임에 크게 튄다. `Time.unscaledDeltaTime` 을 쓰고, 덮개가 완전히 닫힌 뒤에 씬을 불러온다.' },
  ],
  unity: {
    setup: [
      '`ScreenTransitionWipe.shader`, `core.hlsl`, `ScreenTransitionController.cs` 를 `Assets/Shaders/screen-transition-wipe/` 에 둔다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      '사용 중인 렌더러 에셋(Universal Renderer Data 또는 Renderer 2D Data)의 Add Renderer Feature 에서 Full Screen Pass Renderer Feature 를 추가한다.',
      'Pass Material 에 머티리얼을 넣고 Injection Point 를 Before Rendering Post Processing 으로, Fetch Color Buffer 를 켠다.',
      '빈 오브젝트에 `ScreenTransitionController` 를 붙이고 머티리얼을 연결한 뒤 `ScreenTransitionController.Instance.LoadScene(\"씬 이름\")` 을 호출한다. 씬은 Build Profiles 에 등록되어 있어야 한다.',
    ],
    verify: '머티리얼의 진행을 0 에서 1 로 올리면 Game 뷰 화면이 왼쪽부터 마름모 칸으로 덮이고, 0 으로 내리면 다시 걷힌다.',
    pitfalls: [
      '2D Renderer 도 Renderer 2D Data 에 같은 기능을 추가하면 된다 (Unity 6000.3.20f1 에서 촬영으로 확인).',
      'Renderer Feature 는 그 렌더러를 쓰는 모든 카메라에 적용된다. 쓰지 않을 때는 진행값이 0 이어도 패스 비용이 든다.',
      '머리에 고정된 전체 화면 효과라 XR 에서는 권장하지 않는다.',
      'Screen Space - Overlay Canvas 는 이 패스가 끝난 뒤에 그려져 덮이지 않는다. UI 까지 덮으려면 Canvas 를 Screen Space - Camera 로 바꾼다.',
    ],
    graph: 'Shader Graph 에서는 Fullscreen 타깃을 쓰고 URP Sample Buffer 노드(BlitSource)가 `sgSource` 역할을 한다. 순서 값은 Custom Function 으로 `transitionOrder` 를 불러 쓴다.',
  },
  prompt: {
    goal: '씬이 바뀔 때 화면을 패턴으로 덮었다가 걷는 전환 효과를 넣는다. 내장 Full Screen Pass Renderer Feature 에 머티리얼로 연결하고 C# 코루틴으로 진행값을 움직인다.',
    adaptIdeas: [
      '텍스처 마스크로 전환 모양을 자유롭게 바꾸고 싶다.',
      '가운데가 아니라 플레이어 위치로 원이 닫히게 하고 싶다.',
      '전환 중 화면이 살짝 픽셀화되게 하고 싶다.',
      '2D Renderer 프로젝트에서 UI RawImage 로 같은 효과를 쓰고 싶다.',
    ],
  },
  captures: [
    { name: 'iris', label: '원형 닫힘', values: { _Pattern: '1', _Softness: 0.01, _RimGlow: 0, _Progress: 0.55 } },
    { name: 'sweep', label: '대각선', values: { _Pattern: '2', _Softness: 0.08, _RimGlow: 2.2, _Progress: 0.45 } },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 오래된 범용 기법이다. 코드는 이 갤러리에서 새로 작성했다.',
  references: [
    { label: 'Glassner: A Change of Scene (와이프와 아이리스 원리)', url: 'https://www.glassner.com/wp-content/uploads/2014/04/CG-CGA-PDF-01-05-A-Change-of-Scene-May01.pdf' },
    { label: 'Unity 토론: URP 전체 화면 셰이더', url: 'https://discussions.unity.com/t/full-screen-shaders-in-urp/869111' },
  ],
}
