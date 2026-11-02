import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'screen-vignette',
  title: '화면 비네트',
  titleEn: 'Screen Vignette',
  group: 'G',
  order: 3,
  oneLiner: '화면 가장자리를 어둡게 하거나 붉게 한다',
  goals: [
    '화면비를 보정한 중심 거리로 원형 비네트를 만들 수 있다.',
    '`smoothstep` 으로 반경과 부드러움을 따로 조절하는 마스크를 만들 수 있다.',
    'C# 으로 체력 비율과 피격 펄스를 머티리얼에 넘기고 끄기 옵션을 둘 수 있다.',
    'URP Volume 의 내장 Vignette 로 충분한 경우와 직접 만들어야 하는 경우를 구분할 수 있다.',
  ],
  tags: ['전체 화면', '마스크', 'Full Screen Pass', '체력 연동', 'XR 터널링'],
  difficulty: 1,
  shaderFile: 'ScreenVignette.shader',
  stage: { kind: 'fullscreen' },
  flashes: true,
  params: [
    { key: '_VignetteColor', label: '비네트 색', type: 'color', default: '#000000', hint: '평소 가장자리를 덮는 색' },
    { key: '_Intensity', label: '세기', type: 'range', min: 0, max: 1, step: 0.01, default: 0.9, hint: '가장자리를 얼마나 덮는지. C# 이 체력 비율로 정한다' },
    { key: '_Radius', label: '반경', type: 'range', min: 0, max: 1.5, step: 0.01, default: 0.45, hint: '이 거리 안쪽은 덮지 않는다. 1 이 위아래 가장자리' },
    { key: '_Softness', label: '부드러움', type: 'range', min: 0, max: 1.5, step: 0.01, default: 0.65, hint: '반경에서 완전히 덮일 때까지의 폭. 작을수록 경계가 또렷하다' },
    { key: '_Roundness', label: '원형 비율', type: 'range', min: 0, max: 1, step: 0.01, default: 1, hint: '1 이면 원, 0 이면 화면 모양에 맞춘 타원' },
    { key: '_LowHealth', label: '저체력', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '저체력 색으로 바뀌고 반경이 느리게(0.8Hz) 조금 숨 쉰다. C# 이 체력 비율로 정한다' },
    { key: '_LowHealthColor', label: '저체력 색', type: 'color', default: '#4d1414', hint: '저체력이 0 보다 클 때만 보인다. 오래 켜져 있으므로 밝은 빨강 대신 채도 낮은 어두운 빨강을 쓴다' },
    { key: '_HitPulse', label: '피격 펄스', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: 'C# 이 피격 순간 1 로 올렸다 0 으로 내린다. 반경이 안쪽으로 당겨진다' },
    { key: '_HitColor', label: '피격 색', type: 'color', default: '#9e1f1f', hint: '피격 펄스가 0 보다 클 때만 보인다. 피격 버튼으로 확인한다' },
  ],
  presets: [
    { id: 'dark-edge', name: '어두운 가장자리', look: '평소에 쓰는 검은 비네트', values: {} },
    { id: 'low-health', name: '저체력 경고', look: '어두운 빨강이 가장자리에서 느리게 숨 쉰다', values: { _LowHealth: 1, _Intensity: 0.7 } },
    { id: 'tunneling', name: 'XR 터널링', look: '이동 중 시야를 좁혀 멀미를 줄인다. 또렷한 검은 원', values: { _Intensity: 1, _Radius: 0.35, _Softness: 0.2 } },
    { id: 'screen-fit', name: '화면 맞춤', look: '화면 네 모서리를 고르게 누르는 영화풍 비네트', values: { _Roundness: 0, _Radius: 0.25, _Softness: 0.75, _Intensity: 1 } },
  ],
  events: [
    {
      id: 'hit',
      label: '피격',
      tracks: [{ key: '_HitPulse', frames: [[0, 1], [0.5, 0]], ease: 'outQuad' }],
    },
  ],
  demo: {
    loops: [{ key: '_LowHealth', frames: [[0, 0], [2.5, 0], [4, 1], [8, 1], [9.5, 0]], ease: 'inOutSine' }],
    fire: [{ event: 'hit', every: 3 }],
  },
  steps: [
    { n: 1, label: '중심 거리', body: 'uv 에서 화면 중심까지의 거리. 가운데가 검고 바깥으로 갈수록 밝다. uv 는 가로세로 모두 0~1 이라 밝기가 같은 줄이 화면 모양을 따라 가로로 늘어난 타원이다.' },
    { n: 2, label: '화면비 보정', body: '가로에 화면비 `aspect` 를 곱한 거리. 밝기가 같은 줄이 원이 되고, 좌우 가장자리가 위아래보다 먼저 하얗게 된다. 원형 비율을 0 으로 내리면 1 단계 모양으로 돌아간다.' },
    { n: 3, label: '부드러운 마스크', body: '`smoothstep(반경, 반경 + 부드러움, 거리)` 에 세기를 곱한 값. 가운데 원은 검게 비고 바깥은 밝은 회색으로 차 있다. 밝을수록 비네트 색이 진하게 덮인다. 반경과 부드러움을 움직이면 빈 원의 크기와 경계 폭이 따로 바뀐다. 피격 버튼을 누르면 원이 순간 작아진다. 최종 화면은 이 값만큼 장면 위에 비네트 색을 덮는다.' },
  ],
  offNote: '`smoothstep` 없이 거리를 그대로 세기로 쓴 모습. 가운데 한 점 말고는 화면 전체가 흐릿하게 어두워지고, 반경과 부드러움 슬라이더를 움직여도 아무것도 바뀌지 않는다.',
  mistakes: [
    { title: '원이 가로로 늘어난 타원이 된다', body: 'uv 는 가로세로가 모두 0~1 이라 그대로 거리를 재면 화면 모양을 따라 찌그러진다. 원을 원하면 가로에 `aspect` 를 곱한다. 화면 모양에 맞춘 타원을 원할 때만 보정을 뺀다.' },
    { title: '화면 전체가 어둡고 가장자리가 흐리멍덩하다', body: '`1 - length(uv - 0.5)` 처럼 거리를 그대로 세기로 쓰면 가운데 한 점 말고는 다 어두워진다. `smoothstep(반경, 반경 + 부드러움, 거리)` 로 안쪽을 0 으로 비워 둔다.' },
    { title: '플레이를 멈춘 뒤에도 화면이 붉거나 어둡다', body: '머티리얼 에셋의 값은 플레이를 멈춰도 남는다. `ScreenVignetteController` 처럼 `OnEnable` 에서 처음 값을 기억하고 `OnDisable` 에서 되돌린다.' },
    { title: '가장자리가 두 배로 어둡다', body: 'URP Volume 의 Vignette 오버라이드가 함께 켜져 있으면 둘이 겹친다. 이 표본을 쓰는 카메라에서는 Volume 의 Vignette 를 끄거나 세기를 0 으로 둔다.' },
    { title: '저체력 화면이 눈을 피곤하게 한다', body: '넓은 면을 밝은 빨강으로 빠르게 깜빡이면 불편하고 광과민 위험도 있다. 맥동은 1Hz 이하, 진폭은 작게, 색은 채도 낮은 어두운 빨강으로 두고 피격 펄스는 초당 3 회로 제한한다. 끄기 옵션도 둔다.' },
  ],
  unity: {
    setup: [
      '`ScreenVignette.shader`, `core.hlsl`, `ScreenVignetteController.cs` 를 `Assets/Shaders/screen-vignette/` 에 둔다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      '사용 중인 렌더러 에셋(Universal Renderer Data 또는 Renderer 2D Data)의 Add Renderer Feature 에서 Full Screen Pass Renderer Feature 를 추가한다.',
      'Pass Material 에 머티리얼을 넣고 Injection Point 를 Before Rendering Post Processing 으로, Fetch Color Buffer 를 켠다.',
      '플레이어나 HUD 관리 오브젝트에 `ScreenVignetteController` 를 붙이고 머티리얼을 연결한다. 체력이 바뀔 때 `SetHealth(현재 체력 / 최대 체력)`, 맞을 때 `Hit()` 을 부른다.',
      '옵션 메뉴의 토글을 `VignetteEnabled`(비네트 전체)와 `HitPulseEnabled`(피격 펄스만)에 연결한다.',
    ],
    verify: '머티리얼의 세기를 올리면 Game 뷰 가장자리가 원 모양으로 어두워지고, 피격 펄스를 1 로 올리면 붉은 가장자리가 안쪽까지 들어온다. 플레이 중 `SetHealth(0.1f)` 를 부르면 가장자리가 어두운 빨강으로 바뀌어 느리게 숨 쉰다.',
    pitfalls: [
      'XR 에서는 눈마다 화면 uv 가 따로라 비네트 중심이 두 눈 사이가 아니라 각 눈의 중심이 된다. 또 기기마다 시야각이 달라 같은 반경이 기기마다 다른 크기로 보인다. 터널링을 기기와 상관없이 맞추려면 반경을 시야각(도) 기준으로 바꿔 넘기거나, XR Interaction Toolkit 의 TunnelingVignetteController(이동과 연동, 서서히 켜고 끄기 포함)를 대안으로 쓴다.',
      'URP Volume 의 Vignette 와 함께 켜면 겹쳐서 두 배로 어둡다. 또 Before Rendering Post Processing 에 넣으면 Bloom 과 톤 매핑이 비네트 색에도 걸려 피격 색이 머티리얼 값과 조금 다르게 보인다.',
      '저체력 맥동은 셰이더 시간(`_Time`)을 쓰므로 `Time.timeScale` 을 따른다. 배속 2 면 두 배로 빨라지고 일시정지(0)면 멈춘다. 배속이 있는 게임은 배속 중 `_LowHealth` 를 낮추거나 끈다. 피격 펄스는 C# 이 실제 시간으로 움직이므로 영향이 없다.',
      'Renderer Feature 는 그 렌더러를 쓰는 모든 카메라에 적용된다. 미니맵 카메라가 같은 렌더러를 쓰면 거기에도 비네트가 생기고, 세기가 0 이어도 패스 비용이 든다.',
      'Screen Space - Overlay Canvas 는 이 패스 뒤에 그려져 덮이지 않는다. HUD 가 비네트 위에 또렷이 남으므로 보통은 이것이 원하는 결과다.',
      '2D Renderer 도 Renderer 2D Data 에 같은 기능을 추가하면 된다 (`screen-transition-wipe` 표본에서 촬영으로 확인한 경로).',
    ],
    graph: 'Shader Graph 에서는 Fullscreen 타깃을 쓰고 URP Sample Buffer 노드(BlitSource)가 `sgSource` 역할을 한다. 중심 거리는 Custom Function 으로 `vignetteDistance` 를 불러 쓰고 Smoothstep 노드로 마스크를 만든다.',
  },
  prompt: {
    goal: '피격과 저체력 때 화면 가장자리를 어둡게 또는 붉게 덮는 비네트를 넣는다. 내장 Full Screen Pass Renderer Feature 에 머티리얼로 연결하고, C# 이 체력 비율과 피격 펄스를 넘기며 옵션에서 끌 수 있게 한다.',
    adaptIdeas: [
      'XR 에서 이동 속도에 따라 시야를 좁히는 터널링으로 쓰고 싶다.',
      '맞은 방향 쪽 가장자리만 붉어지게 하고 싶다.',
      '독이나 빙결 상태일 때 초록, 파랑 비네트로 바꾸고 싶다.',
      '2D 프로젝트의 체력 바 UI 와 같은 체력 값으로 연동하고 싶다.',
    ],
  },
  captures: [
    { name: 'low-health', label: '저체력 경고', values: { _LowHealth: 1, _Intensity: 0.7 } },
    { name: 'hit', label: '피격 펄스', values: { _HitPulse: 0.8 } },
    { name: 'tunneling', label: 'XR 터널링', values: { _Intensity: 1, _Radius: 0.35, _Softness: 0.2 } },
  ],
  // 무대 가장자리가 원래 어두워 기본값의 검은 비네트는 썸네일에서 약하다. 맥동 진폭이 작아 시간과 상관없이 보이는 저체력 촬영을 쓴다.
  thumbnail: 'low-health',
  inspiredBy: [
    {
      title: 'Warhammer 40,000: Space Marine 2 (2024)',
      credit: 'Saber Interactive',
      borrowed: ['저체력 때 화면 가장자리를 덮는 비네트'],
      learned: '이용자 커뮤니티의 아이디어 게시판에 저체력 비네트를 없애는 옵션을 달라는 글이 올라왔다. 위험을 알리는 연출도 시야를 오래 가리면 불편이 된다는 디자인 교훈이다. 이 표본의 컨트롤러가 비네트 전체와 피격 펄스를 따로 끌 수 있게 한 이유다.',
      link: 'https://community.focus-entmt.com/focus-entertainment/space-marine-2/ideas/8114-can-we-get-an-option-to-remove-the-vignette',
    },
  ],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이고 코드는 이 갤러리에서 새로 작성했다. **URP Volume 의 내장 Vignette 로 충분한 경우**: 색과 세기, 부드러움만 정해 두는 정적 비네트라면 Volume 의 Vignette 오버라이드면 되고 이 머티리얼도 Renderer Feature 도 필요 없다. **이 표본이 필요한 경우**: 맞는 순간 반경을 당겼다 풀어 주는 피격 펄스, 체력에 따라 색과 반경이 바뀌는 저체력 경고, 이동 중 시야를 좁히는 XR 터널링처럼 C# 이 값을 자주 바꾸고 여러 색을 섞어야 할 때다. 수업 XR 프로젝트의 XRI TunnelingVignette 샘플, 2D·3D 체력 HUD 와 짝을 이룬다. 체력 값은 [UI 갤러리](https://koohoo-dev.github.io/UIGallery/)의 체력 바와 함께 쓰면 좋다.',
  references: [
    { label: 'XR Interaction Toolkit 문서: Tunneling Vignette Controller', url: 'https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit%403.0/manual/tunneling-vignette-controller.html' },
    { label: 'Meta Interaction SDK: 이동 편안함(비네트를 시야각으로 정의)', url: 'https://developers.meta.com/horizon/documentation/unity/unity-isdk-locomotion-comfort/' },
  ],
  related: [
    { id: 'screen-transition-wipe', why: '같은 Full Screen Pass 경로와 화면비 보정 원으로 화면을 덮고 걷는 짝' },
    { id: 'sprite-outline-hit-flash', why: '캐릭터 쪽 피격 번쩍임. 화면 비네트와 함께 쓰면 맞았다는 신호가 분명해진다' },
    { id: 'fresnel-rim-glow', why: '3D 물체의 피격 번쩍임을 테두리 빛으로 만드는 짝' },
  ],
}
