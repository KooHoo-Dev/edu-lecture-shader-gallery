import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'screen-crt-scanline',
  title: 'CRT 화면 필터',
  titleEn: 'Screen CRT Scanline',
  group: 'G',
  order: 4,
  oneLiner: '스캔라인과 형광체 무늬로 옛 모니터 화면을 만든다',
  goals: [
    '`texelSize` 로 화면 높이를 구해 줄 간격을 정수 픽셀로 맞추고, 줄 가운데 높이에서 화면 색을 읽어 스캔라인을 만들 수 있다.',
    '픽셀 열 번호로 RGB 형광체 마스크(세로 줄, 슬롯)를 만들고, `fwidth` 로 휘거나 촘촘한 줄의 대비를 낮춰 모아레를 줄일 수 있다.',
    '화면비를 보정한 배럴 왜곡과 부드러운 검은 테두리로 볼록한 브라운관 모양을 만들 수 있다.',
    '줄무늬 화면 필터의 광과민 안전 기준(대비 상한, 흐르지 않는 줄, 끄기 옵션)을 지켜 게임 옵션으로 넣을 수 있다.',
  ],
  tags: ['전체 화면', '스캔라인', '배럴 왜곡', 'fwidth', 'Full Screen Pass'],
  difficulty: 2,
  shaderFile: 'ScreenCrtScanline.shader',
  // 어두운 무대에서는 줄과 마스크가 묻힌다. 밝은 하늘과 바닥 위에서 보여 준다
  stage: { kind: 'fullscreen', bright: true },
  // 전원 끄기 이벤트가 화면 전체를 껐다 켠다. C# 은 실제 시간 0.34 초 하한의 static 제한기를 둔다
  flashes: true,
  params: [
    { key: '_Lines', label: '목표 줄 수', type: 'range', min: 120, max: 480, step: 1, default: 224, unit: ' 줄', hint: '화면 높이에 맞춘 정수 픽셀 간격(최소 2)으로 이 줄 수에 가장 가깝게 나눈다. 그래서 값을 조금 움직여도 줄 수가 계단식으로 바뀐다' },
    { key: '_Scan', label: '줄 사이 어둡기', type: 'range', min: 0, max: 0.4, step: 0.01, default: 0.3, hint: '줄 사이를 얼마나 어둡게 할지. 광과민 안전을 위해 0.4(어두운 줄이 밝은 줄의 60%)에서 막았다' },
    {
      key: '_Mask',
      label: '형광체 마스크',
      type: 'select',
      options: [
        { value: '0', label: '없음' },
        { value: '1', label: '세로 줄' },
        { value: '2', label: '슬롯' },
      ],
      default: '1',
      hint: '세로 줄은 R, G, B 픽셀 열을 번갈아 남기고, 슬롯은 세 열 묶음마다 엇갈린 가로 틈을 더한다',
    },
    { key: '_MaskStrength', showWhen: { key: '_Mask', values: ['1', '2'] }, label: '마스크 세기', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.15, hint: '세로 줄과 슬롯에서만 쓴다. 남기지 않는 색을 얼마나 줄일지. 화면 전체를 덮는 잔무늬라 약하게 둔다' },
    { key: '_Curve', label: '화면 휨', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.08, hint: '볼록한 브라운관처럼 가장자리를 휜다. 화면 밖이 된 네 모서리는 검게 지운다' },
    { key: '_Bleed', label: '색 번짐', type: 'range', min: 0, max: 1, step: 0.01, default: 0.3, hint: '옆 픽셀을 섞어 가로로 흐리고 빨강과 파랑을 살짝 어긋나게 한다. 글자가 번지므로 UI 가 많으면 낮춘다' },
    { key: '_Vignette', label: '비네트', type: 'range', min: 0, max: 1, step: 0.01, default: 0.3, hint: '휜 화면의 가장자리와 모서리를 어둡게 한다' },
    { key: '_Boost', label: '밝기 보정', type: 'range', min: 1, max: 1.6, step: 0.01, default: 1.2, hint: '줄과 마스크로 잃은 밝기를 곱으로 되돌린다. 너무 올리면 밝은 곳이 하얗게 날아간다' },
    { key: '_Roll', label: '느린 밝은 띠', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, hint: '넓고 흐린 밝은 띠 하나가 7 초에 한 번 위에서 아래로 지나간다. 1 이어도 밝기를 8% 만 올린다. 속도는 코드에 고정했다' },
    { key: '_PowerOff', label: '전원 끄기', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '이벤트 전용. 0.5 에서 가로선, 0.8 에서 점, 1 에서 검정. C# 이 0 → 1 → 0 으로 움직인다' },
  ],
  presets: [
    { id: 'arcade-monitor', name: '아케이드 모니터', look: '선명한 줄과 세로 줄 마스크, 약한 휨', values: { _Scan: 0.4, _MaskStrength: 0.3, _Curve: 0.04, _Bleed: 0.1, _Vignette: 0.15, _Boost: 1.35 } },
    { id: 'old-tv', name: '오래된 TV', look: '슬롯 마스크, 크게 휜 화면, 번진 색, 어두운 모서리', values: { _Mask: '2', _MaskStrength: 0.3, _Curve: 0.2, _Bleed: 0.8, _Vignette: 0.7, _Boost: 1.3 } },
    { id: 'flat-scanline', name: '평면 화면 스캔라인', look: '휨과 마스크 없이 줄만. 가장 가볍고 UI 가 읽기 쉽다', values: { _Mask: '0', _Curve: 0, _Bleed: 0, _Vignette: 0, _Scan: 0.25, _Boost: 1.1, _Roll: 0 } },
  ],
  events: [
    {
      id: 'power-off',
      label: '전원 끄기',
      tracks: [{ key: '_PowerOff', frames: [[0, 0], [0.6, 1], [1.1, 1], [1.6, 0]], ease: 'inOutSine' }],
    },
  ],
  // 화면 전체가 꺼졌다 켜지는 이벤트라 10 초에 한 번만 쓴다
  demo: { fire: [{ event: 'power-off', every: 10 }] },
  steps: [
    { n: 1, label: '휜 좌표', body: '각 픽셀이 읽을 화면 좌표를 색으로 보였다. 오른쪽으로 갈수록 빨강, 위로 갈수록 초록이 짙어진다. 격자선이 바깥으로 볼록하게 휘고, 화면 가장자리에 검은 테두리가 생겨 네 모서리가 둥글게 잘렸다. 좌표가 0~1 을 벗어나 브라운관 밖이 된 곳이다. 화면 휨을 0 으로 내리면 격자가 곧게 펴지고 검은 테두리가 사라진다.' },
    { n: 2, label: '줄 중심에서 읽기', body: '줄 간격을 화면 높이에 맞춘 정수 픽셀로 정하고, 한 줄 안의 모든 픽셀이 그 줄 가운데 높이의 색을 읽었다. 공과 상자의 윤곽이 세로로 계단지고 색 번짐 때문에 가로로 살짝 흐리다. 목표 줄 수를 줄이면 계단이 굵어진다.' },
    { n: 3, label: '빔 프로필', body: '줄 가운데는 흰색, 줄 사이는 연한 회색인 가는 가로줄. 줄 사이 어둡기를 움직이면 회색이 진해지거나 옅어진다. 휜 줄이 비스듬해지는 모서리나 줄이 너무 촘촘할 때는 `fwidth` 가 커져 줄이 흐려진다 (모아레 대신 평균 밝기).' },
    { n: 4, label: '형광체 마스크', body: '빔에 형광체 마스크를 곱한 빛의 무늬. 기본 세기는 약해서 거의 흰 줄무늬에 옅은 색이 비친다. 마스크 세기를 올리면 빨강, 초록, 파랑 세로 열이 또렷해지고, 슬롯을 고르면 엇갈린 가로 틈이 생긴다. 최종 화면은 2 단계 그림에 이 무늬와 밝기 보정, 비네트를 곱한 것이다.' },
  ],
  offNote: '줄 수를 uv 에 바로 곱한 고정 스캔라인 (`cos(uv.y * 줄 수 * 2π)`). 화면 높이가 줄 수의 정수배가 아니라 줄이 픽셀 사이에 걸려 굵기가 들쭉날쭉하고, 몇 줄마다 줄이 사라졌다 나타나는 굵은 띠(모아레)가 생긴다. 창 크기를 바꾸면 띠가 움직인다. 줄 중심에서 읽지도 않아 그림이 계단지지 않는다. 줄 대비 상한은 그대로 지켰다.',
  mistakes: [
    { title: '줄 굵기가 들쭉날쭉하고 굵은 띠가 생긴다', body: '`sin(uv.y * 줄 수 * 2π)` 처럼 줄 수를 uv 에 바로 곱하면 화면 높이가 줄 수의 정수배가 아닐 때 줄이 픽셀 사이에 걸려 모아레가 생긴다. `texelSize` 로 화면 높이(픽셀)를 구해 `floor(높이 / 줄 수 + 0.5)` 를 줄 간격(최소 2 픽셀)으로 쓰고, 줄 좌표는 픽셀 단위로 센다.' },
    { title: '휜 화면의 가장자리에 물결 무늬가 생긴다', body: '휜 줄은 화면 픽셀 격자와 어긋나 모서리에서 모아레가 생긴다. `fwidth(줄 좌표)` 가 커지는 곳(비스듬하거나 촘촘한 줄)에서 빔 대비를 평균 밝기 쪽으로 낮춘다. 그래도 남으면 휨을 줄이거나 목표 줄 수를 낮춰 줄 간격을 3 픽셀 이상으로 둔다. 형광체 마스크는 휜 좌표가 아니라 화면 픽셀 열 번호로 만든다.' },
    { title: '필터를 켜면 화면이 어둡고 탁하다', body: '줄 사이와 마스크가 빛을 깎아 평균 밝기가 20~30% 떨어진다. 밝기 보정(`_Boost`)으로 곱해 되돌린다. 어두운 무대에서는 줄과 마스크가 묻히므로 밝은 장면에서 값을 맞춘다.' },
    { title: 'HUD 에 필터가 걸리지 않거나, 글자가 번져 읽기 어렵다', body: 'Screen Space - Overlay 캔버스는 이 패스 뒤에 그려져 필터가 걸리지 않는다. 걸려면 캔버스를 Screen Space - Camera 로 바꾼다. 작은 글자가 번져 읽기 어려우면 색 번짐과 휨을 낮추거나 평면 화면 스캔라인 프리셋을 쓰고, 중요한 UI 는 Overlay 캔버스에 남긴다.' },
    { title: '줄무늬 화면이 눈을 피곤하게 한다', body: '화면 전체를 덮는 밝고 어두운 줄은 멈춰 있어도 광과민 반응을 일으킬 수 있다. 어두운 줄을 검정으로 만들지 말고 밝은 줄의 60% 이상으로 둔다 (`_Scan` 0.4 이하). 줄을 흘리거나 프레임마다 바꾸는 인터레이스는 넣지 않는다. 게임 옵션에서 필터 전체와 전원 끄기 연출을 끌 수 있게 한다.' },
  ],
  unity: {
    setup: [
      '`ScreenCrtScanline.shader`, `core.hlsl`, `CrtPowerController.cs` 를 `Assets/Shaders/screen-crt-scanline/` 에 둔다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다. 기본값은 바로 쓸 수 있는 약한 값이다.',
      '사용 중인 렌더러 에셋(Universal Renderer Data 또는 Renderer 2D Data)의 Add Renderer Feature 에서 Full Screen Pass Renderer Feature 를 추가한다. Requirements 는 None 으로 둔다.',
      'Pass Material 에 머티리얼을 넣고 Fetch Color Buffer 를 켠다. Injection Point 는 Bloom 이 없으면 Before Rendering Post Processing, Bloom 이 있으면 After Rendering Post Processing 으로 둔다.',
      '빈 오브젝트 하나에 `CrtPowerController` 를 붙이고 머티리얼을 연결한다. 컨트롤러는 **씬에 하나만 둔다**. 화면을 끌 때 `CrtPowerController.Instance.PowerOff(() => { /* 검게 꺼진 순간 할 일 */ })` 를 부른다.',
      '옵션 메뉴의 토글을 필터 전체(Full Screen Pass Renderer Feature 의 `SetActive`), `PowerEffectEnabled`(전원 끄기 연출), `RollEnabled`(느린 밝은 띠)에 연결한다.',
    ],
    verify: 'Game 뷰에 가는 가로줄과 옅은 RGB 세로 열이 보이고 네 모서리가 둥글게 검다. 화면 휨을 0 으로 내리면 테두리가 사라지고, 목표 줄 수를 낮추면 줄이 굵어지며 그림이 세로로 계단진다. 플레이 중 `PowerOff()` 를 부르면 화면이 가로선, 점으로 줄어 꺼졌다가 1.6초 뒤 다시 켜진다.',
    pitfalls: [
      '화면 전체를 덮는 정지 줄무늬는 광과민 반응을 일으킬 수 있다. 게임 옵션으로 필터를 끌 수 있게 한다 (Full Screen Pass Renderer Feature 를 `SetActive(false)` 하거나 렌더러를 바꾼다. 에디터에서는 Renderer Feature 의 켜짐 상태가 에셋에 저장된다). 전원 끄기 연출도 `PowerEffectEnabled` 로 따로 끈다. 셰이더는 줄 대비(0.4)와 마스크 세기(0.5)를 코드에서 막는다.',
      'Screen Space - Overlay 캔버스는 이 패스 뒤에 그려져 필터가 걸리지 않는다. HUD 까지 걸려면 Screen Space - Camera 캔버스를 쓴다. Bloom 이 있으면 Before Rendering Post Processing 에서는 마스크의 RGB 열과 줄이 Bloom 에 번져 뿌옇게 되므로 After Rendering Post Processing 을 권한다. 다만 그 지점과 FXAA, 업스케일(FSR, STP)의 순서는 확인하지 않았다.',
      '줄 간격은 `_ScreenSize`(카메라 대상 크기)의 정수 픽셀이다. URP Asset 의 Render Scale 이 1 이 아니거나 동적 해상도를 쓰면 픽셀에 맞춘 줄이 다시 샘플되어 모아레가 생길 수 있다 (확인하지 않았다). 창 크기가 바뀌면 줄 수가 계단식으로 바뀐다.',
      '느린 밝은 띠는 셰이더 시간(`_Time`)을 쓰므로 `Time.timeScale` 을 따른다. 배속 2 면 3.5초에 한 번 지나가고 일시정지(0)면 멈춘다. 밝기 변화가 8% 이하라 번쩍임은 아니지만 배속이 있는 게임은 `RollEnabled` 를 끄는 것을 권한다. 전원 끄기는 C# 이 실제 시간으로 움직이고, 0.34초에 한 번(초당 3회)까지만 받는다 (하한은 코드에 고정).',
      'XR 에서는 이 패스를 끈다. 줄무늬와 휨이 머리에 붙은 화면 공간에 그려지고 uv 의 (0.5, 0.5) 가 눈의 정면이 아니라 두 눈의 휨이 어긋날 수 있다 (추정, 실기기 미확인). XR 에서는 가상 모니터 메시에 렌더 텍스처로 입히는 방식을 쓴다.',
      'Renderer Feature 는 그 렌더러를 쓰는 모든 카메라와 Scene 뷰에 적용된다. 미니맵이나 렌더 텍스처 카메라가 같은 렌더러를 쓰면 거기에도 줄이 생긴다. 패스 비용은 화면 텍스처 세 번 읽기다.',
    ],
    graph: 'Shader Graph 에서는 Fullscreen 타깃을 쓰고 URP Sample Buffer 노드(BlitSource)가 `sgSource` 역할을 한다. Custom Function 노드는 `void 이름_float(입력..., out 출력)` 형식의 함수만 받는다. `core.hlsl` 을 File 모드로 통째로 지정하면 `SgInput`, `sgSource`, 머티리얼 값 선언이 없어 컴파일되지 않으므로 줄 계산만 String 모드로 옮긴다. Name 을 `CrtLine`, 입력을 Uv(Vector 2), ScreenHeight(Float), Lines(Float), Scan(Float), 출력을 SampleUv(Vector 2), Beam(Float)로 두고 Body 에 `float pitch = max(2.0, floor(ScreenHeight / max(Lines, 1.0) + 0.5)); float lc = (Uv.y * ScreenHeight - 0.5) / pitch; float idx = floor(lc + 0.5); SampleUv = float2(Uv.x, (idx * pitch + 0.5) / ScreenHeight); float b = 1.0 - Scan * 0.5 * (1.0 - cos((lc - idx) * 6.2831853)); Beam = lerp(1.0 - Scan * 0.5, b, 1.0 - smoothstep(0.36, 0.62, fwidth(lc)));` 를 쓴다. Uv 는 Screen Position 노드, ScreenHeight 는 Screen 노드의 Height 다. SampleUv 로 BlitSource 를 읽어 Beam 을 곱한다. 휨은 그 앞에서 uv 를 바꾸고, 마스크는 Screen Position(Pixel) 의 x 를 3 으로 나눈 나머지로 만든다.',
  },
  prompt: {
    goal: '게임 화면 전체에 스캔라인, 형광체 마스크, 볼록한 화면 휨을 얹어 옛 CRT 모니터처럼 보이게 하는 필터를 넣는다. 내장 Full Screen Pass Renderer Feature 에 머티리얼로 연결하고, 옵션에서 끌 수 있게 하며, C# 으로 전원 끄기 연출을 재생한다.',
    adaptIdeas: [
      '2D 픽셀 아트 게임의 Pixel Perfect Camera 기준 해상도(예: 세로 224 픽셀)와 스캔라인 줄 수를 맞추고 싶다.',
      '게임 안의 오락기나 감시 모니터 화면에만 CRT 느낌을 주고 싶다. 카메라를 렌더 텍스처로 찍어 모니터 메시에 입히는 방식이다 (XR 에서도 이 방식을 쓴다).',
      '게임 오버나 씬 전환 때 전원 끄기 연출로 화면을 끄고, 꺼진 사이에 씬을 바꾸고 싶다.',
      '옵션 메뉴에 필터 끄기, 평면, 곡면 세 단계를 두고 싶다.',
      'UI 글자는 또렷하게 두고 게임 화면에만 필터를 걸고 싶다.',
    ],
  },
  // 화면을 덮는 잔무늬라 촬영 용량이 크다. 두 장만 찍는다
  captures: [
    { name: 'old-tv', label: '오래된 TV', values: { _Mask: '2', _MaskStrength: 0.3, _Curve: 0.2, _Bleed: 0.8, _Vignette: 0.7, _Boost: 1.3 } },
    { name: 'flat-scanline', label: '평면 화면 스캔라인', values: { _Mask: '0', _Curve: 0, _Bleed: 0, _Vignette: 0, _Scan: 0.25, _Boost: 1.1, _Roll: 0 } },
  ],
  inspiredBy: [
    {
      title: "Teenage Mutant Ninja Turtles: Shredder's Revenge (2022)",
      credit: 'Tribute Games',
      borrowed: ['옵션 메뉴에서 켜고 끄는 일반·곡면 CRT 필터'],
      learned: '출시 뒤 업데이트에서 옵션 메뉴에 일반 CRT 필터와 곡면 CRT 필터를 더했다고 제작사가 알렸다. 레트로 화면 필터는 기본으로 강요하지 않고 이용자가 고르는 옵션으로 둔다는 점, 평면과 곡면을 따로 고를 수 있게 한다는 점을 빌렸다. 보도 자료는 옵션 이름만 밝히고 구현은 설명하지 않으므로 화면 모습은 이 표본에서 새로 정했다.',
      link: 'https://indigo-pearl.prezly.com/teenage-mutant-ninja-turtles-shredders-revenge-update-now-available',
    },
  ],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 CRT 셰이더의 원리(줄 중심 샘플, 빔 프로필, 형광체 마스크, 배럴 왜곡)를 이 갤러리에서 새로 작성했다. libretro 의 CRT 셰이더 코드는 옮기지 않았다. 하프톤은 단계가 겹치지 않아 넣지 않았다. 광과민 안전을 위해 줄 대비와 마스크 세기를 코드에서 막고, 인터레이스나 흘러가는 스캔라인 대신 7초에 한 번 지나가는 넓고 흐린 띠만 두었다. 수업의 2D 레트로 픽셀 게임 프로젝트와 외부 에셋 Space Shooter Redux 에 덮는 화면 필터로 쓸 수 있다.',
  references: [
    { label: 'libretro 문서: CRT 셰이더 개요', url: 'https://docs.libretro.com/shader/crt/' },
    { label: 'libretro 문서: crt-royale (마스크 종류와 밝기 보정)', url: 'https://docs.libretro.com/shader/crt_royale/' },
    { label: 'libretro 포럼: 곡률과 모아레', url: 'https://forums.libretro.com/t/shader-curvature-and-moire/16174' },
  ],
  related: [
    { id: 'screen-vignette', why: '같은 Full Screen Pass 경로와 화면 가장자리 비네트 수식' },
    { id: 'screen-shockwave-distortion', why: 'uv 를 휘어 다시 읽는 화면 왜곡과 Clamp 샘플러' },
    { id: 'hologram-scanline-glitch', why: '메시 위의 월드 높이 스캔라인. 화면 픽셀에 맞춘 이 표본의 줄과 비교해 본다' },
  ],
}
