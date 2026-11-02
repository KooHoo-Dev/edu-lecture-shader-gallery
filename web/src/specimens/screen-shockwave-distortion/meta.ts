import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'screen-shockwave-distortion',
  title: '충격파 왜곡',
  titleEn: 'Screen Shockwave Distortion',
  group: 'D',
  order: 2,
  oneLiner: '퍼지는 고리 모양으로 화면을 왜곡한다',
  goals: [
    '중심 거리와 반경을 비교해 부드러운 고리 마스크를 만들 수 있다.',
    '고리 안에서 바깥 방향으로 uv 를 밀어 화면을 왜곡하고, 화면비를 보정해 원을 지킬 수 있다.',
    '반경에 따른 감쇠와 색수차로 충격파의 힘과 결을 조절할 수 있다.',
    '월드 위치를 화면 좌표로 바꿔 폭발 지점에서 충격파를 시작할 수 있다.',
  ],
  tags: ['전체 화면', 'UV 왜곡', '고리 마스크', '색수차', 'Full Screen Pass'],
  difficulty: 3,
  shaderFile: 'ScreenShockwaveDistortion.shader',
  stage: { kind: 'fullscreen' },
  // 고리 띠 안의 그림을 밀어 읽을 뿐 화면 전체 밝기는 거의 그대로라 넓은 면의 번쩍임으로 세지 않는다.
  // 다만 색수차는 밝은 물체와 어두운 배경 경계에 포화된 빨강 띠를 만들고, Play 를 연타하면 넓은 띠가 빠르게 튄다.
  // 그래서 C# 의 Play 에 static 최소 간격(실제 시간 0.34 초, 초당 3 회)을 둔다.
  flashes: false,
  params: [
    { key: '_CenterX', label: '중심 X', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, hint: '화면 왼쪽 0, 오른쪽 1. C# 이 폭발 지점의 화면 좌표를 넣는다' },
    { key: '_CenterY', label: '중심 Y', type: 'range', min: 0, max: 1, step: 0.01, default: 0.35, hint: '화면 아래 0, 위 1' },
    { key: '_Radius', label: '반경', type: 'range', min: 0, max: 1.5, step: 0.01, default: 0.45, unit: ' 화면 높이', hint: '고리가 얼마나 퍼졌는지. 클수록 감쇠로 약해진다' },
    { key: '_Width', label: '고리 폭', type: 'range', min: 0.01, max: 0.4, step: 0.005, default: 0.12, hint: '반경에서 이 거리까지 일렁인다. 두 고리에 함께 쓰인다' },
    { key: '_Strength', label: '세기', type: 'range', min: 0, max: 0.15, step: 0.005, default: 0.06, hint: '고리 위 화면을 얼마나 밀지. 0 이면 멈춘 고리가 사라진다' },
    { key: '_FadeRadius', label: '사라지는 반경', type: 'range', min: 0.3, max: 3, step: 0.05, default: 1.5, hint: '고리가 이 반경에 닿으면 세기가 0 이 된다. 작을수록 빨리 약해진다' },
    { key: '_Chroma', label: '색수차', type: 'range', min: 0, max: 1, step: 0.01, default: 0.35, hint: '빨강은 더, 파랑은 덜 밀어 고리 가장자리에 색이 갈린다' },
    { key: '_Haze', label: '아지랑이', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '위로 흐르는 노이즈로 화면 아래쪽을 약하게 흔든다' },
    { key: '_BlastRadius', label: '폭발 반경', type: 'range', min: 0, max: 1.5, step: 0.01, default: 0, hint: '이벤트 전용. 폭발 세기가 0 보다 커야 보인다. C# 이 0 에서 키운다' },
    { key: '_BlastStrength', label: '폭발 세기', type: 'range', min: 0, max: 0.15, step: 0.005, default: 0, hint: '이벤트 전용. C# 이 짧게 올렸다가 퍼지는 동안 0 으로 줄인다' },
  ],
  presets: [
    { id: 'shockwave', name: '충격파', look: '굵은 고리 하나가 화면을 바깥으로 민다', values: {} },
    { id: 'heavy-impact', name: '강한 충격', look: '넓고 센 고리, 진한 색 갈림', values: { _Width: 0.2, _Strength: 0.1, _Chroma: 0.6 } },
    { id: 'ripple', name: '잔잔한 물결', look: '가는 고리가 멀리 퍼진 모습. 색수차 없음', values: { _Radius: 0.6, _Width: 0.05, _Strength: 0.05, _Chroma: 0 } },
    { id: 'heat-haze', name: '열기 아지랑이', look: '고리 없이 화면 아래가 위로 일렁인다', values: { _Strength: 0, _Chroma: 0, _Haze: 0.6 } },
  ],
  events: [
    {
      id: 'blast',
      label: '폭발',
      tracks: [
        { key: '_BlastRadius', frames: [[0, 0], [1.5, 1.4], [1.55, 0]], ease: 'outQuad' },
        { key: '_BlastStrength', frames: [[0, 0], [0.08, 0.15], [1.5, 0]], ease: 'linear' },
      ],
    },
  ],
  demo: { fire: [{ event: 'blast', every: 3 }] },
  steps: [
    { n: 1, label: '중심 거리', body: '중심에서 멀수록 밝다. 화면비를 곱했기 때문에 같은 밝기가 **원**을 이룬다. 가운데의 어두운 점이 중심이다.' },
    { n: 2, label: '고리 마스크', body: '`abs(거리 - 반경)` 이 고리 폭보다 작은 곳만 흰 띠로 남는다. 반경을 움직이면 띠가 퍼지고, 고리 폭을 움직이면 띠가 굵어진다.' },
    { n: 3, label: '밀기 방향', body: '중심에서 바깥쪽 방향을 색으로, 미는 양을 밝기로 보였다. 오른쪽은 노랑과 주황, 위는 연두, 왼쪽은 초록, 아래로 갈수록 어두운 빨강이다. 반경을 키우면 감쇠 때문에 고리 전체가 어두워진다.' },
    { n: 4, label: '밀어 읽기', body: '각 픽셀이 조금 안쪽 화면을 읽어 와서 고리 위의 공 윗부분과 상자가 바깥으로 부풀고 바닥 격자가 물결처럼 휜다. 색수차는 아직 없다.' },
  ],
  offNote: '화면비를 빼고 uv 그대로 거리를 잰 실수. 고리가 가로로 늘어난 타원이 되고 미는 방향도 비뚤어진다. 넓은 화면일수록 심하다.',
  mistakes: [
    { title: '고리가 가로로 늘어난 타원이 된다', body: 'uv 는 가로세로가 모두 0~1 이라 그대로 거리를 재면 화면비만큼 찌그러진다. 중심과의 차이에 `float2(aspect, 1.0)` 을 곱해 높이 단위로 재고, 민 양은 다시 화면비로 나눠 uv 로 되돌린다.' },
    { title: '화면 끝까지 같은 세기로 찢어진다', body: '반경이 커져도 세기가 그대로면 고리가 화면 가장자리에서까지 크게 일그러진다. 반경에 따라 줄어드는 감쇠(`사라지는 반경`)를 곱하고, C# 에서도 퍼지는 동안 세기를 0 으로 내린다.' },
    { title: '폭발 지점과 고리 중심이 어긋난다', body: '`WorldToScreenPoint` 는 픽셀 단위라 그대로 넣으면 중심이 화면 밖으로 나간다. `Camera.WorldToViewportPoint` 의 x, y(0~1)를 넣는다. 카메라 뒤(z < 0)의 폭발은 좌표가 뒤집히므로 세기를 0 으로 둔다.' },
    { title: '폭발 두 개가 겹치면 앞의 고리가 사라지거나 뒤의 폭발이 나오지 않는다', body: '머티리얼 하나에는 폭발 고리 값이 하나뿐이라 `ScreenShockwaveController` 는 마지막 폭발로 다시 시작한다. 연타로 화면이 튀지 않게 0.34초 안에 다시 부른 `Play` 는 무시한다. 동시에 여러 개가 필요하면 `_BlastRadius` 같은 값을 `float4` 몇 개로 늘려 고리를 더하거나, 머티리얼을 복제해 Full Screen Pass 를 하나 더 둔다. 이때도 `Play` 간격 제한(초당 3회)은 모든 고리를 합쳐 지킨다.' },
    { title: '플레이를 멈췄는데 화면에 고리가 남는다', body: '머티리얼 에셋의 값은 플레이를 멈춰도 남는다. 폭발 프리팹마다 컨트롤러를 붙이면 서로의 중간 값(퍼지는 중의 반경, 세기)을 에셋에 되써서 고리가 멈춘 채 남는다. 컨트롤러는 **씬에 하나만 둔다** (중복은 스스로 지워진다). 폭발 쪽 스크립트는 `ScreenShockwaveController.Instance.Play(위치)` 를 부른다. 컨트롤러는 `OnDisable` 에서 폭발 값(`_BlastRadius`, `_BlastStrength`)을 항상 0 으로 되돌린다. 값을 직접 고치는 코드를 따로 쓰면 같은 처리를 넣는다.' },
  ],
  unity: {
    setup: [
      '`ScreenShockwaveDistortion.shader`, `core.hlsl`, `ScreenShockwaveController.cs` 를 `Assets/Shaders/screen-shockwave-distortion/` 에 둔다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      '사용 중인 렌더러 에셋(Universal Renderer Data 또는 Renderer 2D Data)의 Add Renderer Feature 에서 Full Screen Pass Renderer Feature 를 추가한다.',
      'Pass Material 에 머티리얼을 넣고 Injection Point 를 Before Rendering Post Processing 으로, Fetch Color Buffer 를 켠다.',
      '머티리얼의 세기를 0 으로 낮춘다. 기본값 0.06 은 썸네일용이라 그대로 두면 Scene 뷰, Game 뷰, 컨트롤러가 없는 씬과 빌드에 멈춘 고리가 계속 보인다. 열기 아지랑이로 쓰려면 세기는 0 그대로 두고 아지랑이를 0.5~0.8 로 올린다.',
      '빈 오브젝트 하나에 `ScreenShockwaveController` 를 붙이고 머티리얼을 연결한다. 컨트롤러는 **씬에 하나만 둔다**. 폭발 프리팹에는 붙이지 않고, 폭발 순간 그쪽 스크립트에서 `ScreenShockwaveController.Instance.Play(폭발 위치)` 를 부른다.',
    ],
    verify: '플레이 중 `ScreenShockwaveController.Instance.Play(위치)` 를 부르면 그 지점에서 둥근 고리가 퍼지며 고리 위의 물체 윤곽이 바깥으로 휘고, 점점 약해져 1.5초 뒤 사라진다.',
    pitfalls: [
      'XR 에서는 권장하지 않는다. 시야 전체가 일렁이면 멀미를 부를 수 있다. XR 에서 충격파가 필요하면 먼저 폭발 위치에 월드 공간의 구나 쿼드를 두고 [화면 굴절 유리](#/s/screen-refraction-glass)처럼 씬 색상을 밀어 읽는 방식을 권한다. 물체가 눈마다 따로 그려지므로 두 눈의 고리 위치가 저절로 맞는다 (이 방식도 XR 실기기에서는 확인하지 않았다). 그래도 쓴다면 세기와 고리 폭을 줄이고 짧게 끝낸다.',
      '이 전체 화면 머티리얼은 중심을 하나만 받는다. XR 은 눈마다 투영이 달라 한 중심값으로는 두 눈의 고리가 어긋날 수 있다 (실기기 미확인). 두 눈에 맞추려면 C# 에서 `WorldToViewportPoint(위치, Camera.MonoOrStereoscopicEye.Left)` 와 `Right` 로 중심을 두 개 구해 넘기고, 눈을 고르는 일은 래퍼(`.shader`)가 맡아 `unity_StereoEyeIndex` 로 고른 중심을 core 에 넘긴다 (`core.hlsl` 은 웹과 함께 쓰여 눈을 모른다). 이 방법도 실기기에서 확인하지 않았다.',
      '색수차는 밝은 물체와 어두운 배경의 경계에 포화된 빨강 띠를 만든다. 화면 전체 밝기는 거의 그대로지만 `Play` 를 연타하면 넓은 고리 띠와 빨강 띠가 빠르게 튄다. 그래서 컨트롤러는 `Play` 를 실제 시간으로 0.34초에 한 번(초당 3회)까지만 받는다. 이 하한은 코드에 고정되어 Inspector 에서 낮출 수 없다.',
      'Renderer Feature 는 그 렌더러를 쓰는 모든 카메라에 적용된다. 폭발이 없어도 패스 비용(화면 텍스처 세 번 읽기)이 든다. 2D Renderer 도 Renderer 2D Data 에 같은 기능을 추가하면 된다 (전환 표본에서 촬영으로 확인한 방식).',
      'Screen Space - Overlay Canvas 는 이 패스가 끝난 뒤에 그려져 일렁이지 않는다. UI 까지 흔들려면 Canvas 를 Screen Space - Camera 로 바꾼다.',
      '컨트롤러는 고리를 `Time.deltaTime` 으로 퍼뜨린다. 히트 스톱으로 `timeScale` 을 0 으로 두면 고리도 멈춘다. 멈추지 않게 하려면 `Time.unscaledDeltaTime` 으로 바꾼다. 연타 제한은 이와 상관없이 실제 시간으로 센다.',
    ],
    graph: 'Shader Graph 에서는 Fullscreen 타깃을 쓰고 URP Sample Buffer 노드(BlitSource)가 `sgSource` 역할을 한다. `core.hlsl` 의 `shockwavePush` 는 머티리얼 값(`_Radius`, `_Width`, `_Strength` 등)과 다른 헬퍼(`shockwaveRing`, `shockwaveFade`)를 읽으므로 Custom Function 노드의 String 모드에 그대로 넣으면 컴파일되지 않는다. 식을 입력으로 옮겨 `void ShockwavePush_float(float Dist, float Radius, float Width, float FadeRadius, float Strength, out float Push)` 로 만든다. Name 을 `ShockwavePush`, 입력을 Dist, Radius, Width, FadeRadius, Strength(모두 Float), 출력을 Push(Float)로 두고 Body 에 `float ring = 1.0 - smoothstep(0.0, max(Width, 0.001), abs(Dist - Radius));` 와 `Push = ring * saturate(1.0 - Radius / max(FadeRadius, 0.001)) * Strength;` 두 줄을 쓴다. 폭발 고리는 같은 노드를 하나 더 두어 Radius 와 Strength 에 폭발 반경과 폭발 세기를 넣고, 두 Push 를 Add 한다. Dist 는 Screen Position 노드의 uv 에서 중심을 빼고 (화면비, 1)을 곱한 벡터의 길이다 (화면비는 Screen 노드의 Width ÷ Height). 그 벡터를 Normalize 한 방향에 Push 를 곱하고 (화면비, 1)로 나눈 만큼 uv 에서 빼서 BlitSource 를 다시 읽는다. 색수차는 배율을 바꿔 세 번 읽고 채널을 Combine 한다. 반경, 고리 폭 같은 값은 같은 이름의 그래프 속성으로 만든다.',
  },
  prompt: {
    goal: '폭발 지점에서 둥근 충격파가 퍼지며 화면을 일그러뜨리는 효과를 넣는다. 내장 Full Screen Pass Renderer Feature 에 머티리얼로 연결하고 C# 으로 폭발 위치와 고리 반경, 세기를 움직인다.',
    adaptIdeas: [
      '폭발 여러 개가 동시에 각자 고리를 퍼뜨리게 하고 싶다.',
      '용암이나 불 근처에서만 열기 아지랑이가 보이게 하고 싶다.',
      '고리 테두리에 밝은 빛 띠도 함께 넣고 싶다.',
      '카메라 흔들림과 충격파를 같은 순간에 시작하고 싶다.',
      '2D 탑다운 게임에서 피격 지점마다 작은 충격파를 쓰고 싶다.',
    ],
  },
  captures: [
    { name: 'heavy-impact', label: '강한 충격', values: { _Width: 0.2, _Strength: 0.1, _Chroma: 0.6 } },
    { name: 'heat-haze', label: '열기 아지랑이', values: { _Strength: 0, _Chroma: 0, _Haze: 0.6 } },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 범용 기법이다. 코드는 이 갤러리에서 새로 작성했다. 수업 자료로는 3D 의 HeatDepthFixed(FORGE3D)와 2D 15 Mini Defence 의 폭발 연출이 같은 원리를 쓴다. 웹의 폭발 버튼은 멈춘 기본 고리 위에 폭발 고리를 겹쳐 보이지만, Unity 의 `ScreenShockwaveController` 는 켜져 있는 동안 기본 고리(세기)를 꺼서 폭발 고리만 보인다.',
  references: [
    { label: 'Delt06: Opaque Texture 셰이더 예제 (화면 공간 충격파)', url: 'https://github.com/Delt06/opaque-texture-shaders' },
    { label: 'Unity 토론: URP 전체 화면 셰이더', url: 'https://discussions.unity.com/t/full-screen-shaders-in-urp/869111' },
    { label: 'Unity 문서: Shader Graph Production Ready 후처리 샘플', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Post.html' },
  ],
  related: [
    { id: 'screen-transition-wipe', why: '같은 Full Screen Pass 방식. 원형 닫힘에서 화면비 보정을 같은 식으로 한다' },
    { id: 'force-field-intersection', why: '충돌 순간 퍼지는 맥동 고리를 물체 표면에서 만든다' },
    { id: 'scroll-distort-energy', why: '노이즈로 uv 를 밀어 일렁이게 하는 원리를 메시에 쓴다' },
    { id: 'screen-refraction-glass', why: '월드 공간 물체에서 씬 색상을 밀어 읽는다. 눈마다 따로 그려져 XR 에서 충격파를 낼 때의 대안이 된다' },
  ],
}
