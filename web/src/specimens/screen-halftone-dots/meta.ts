import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'screen-halftone-dots',
  title: '하프톤 망점',
  titleEn: 'Screen Halftone Dots',
  group: 'G',
  order: 5,
  oneLiner: '밝기를 점의 크기로 바꿔 인쇄물처럼 보이게 한다',
  goals: [
    '화면비를 보정한 좌표를 돌리고 화면 높이의 줄 수로 칸을 나눠, 해상도와 상관없이 같은 모양의 정사각 칸 격자를 만들 수 있다.',
    '칸 중심에서 화면 색을 한 번만 읽고 선형 밝기로 잉크 덮임을 구해, 면적이 덮임과 맞도록 반지름을 제곱근으로 정할 수 있다.',
    '`fwidth` 로 원 가장자리를 한 픽셀만 부드럽게 하고, CMYK 네 판을 다른 각도로 겹쳐 로제트 무늬를 만들 수 있다.',
    '화면 전체를 덮는 점 격자의 광과민 안전 기준(점 안 밝기 60% 이상, 움직이지 않는 점, 끄기 옵션)을 지켜 게임 옵션으로 넣을 수 있다.',
  ],
  tags: ['전체 화면', '하프톤', '칸 중심 샘플', 'fwidth', 'Full Screen Pass'],
  difficulty: 2,
  shaderFile: 'ScreenHalftoneDots.shader',
  // 어두운 무대는 거의 모든 칸이 큰 점으로 덮여 덩어리가 된다. 밝은 하늘과 바닥에서 점 크기의 차이를 보인다
  stage: { kind: 'fullscreen', bright: true },
  params: [
    {
      key: '_Mode',
      label: '방식',
      type: 'select',
      options: [
        { value: '0', label: '흑백 한 판' },
        { value: '1', label: '칸 색 점' },
        { value: '2', label: 'CMYK 네 판' },
      ],
      default: '1',
      hint: '흑백 한 판은 잉크 색 하나로 밝기만, 칸 색 점은 칸 중심에서 읽은 색으로 점을 칠한다. CMYK 네 판은 시안, 마젠타, 노랑, 검정 판을 15·75·0·45 도로 따로 돌려 겹친다 (판마다 화면을 한 번씩 더 읽어 가장 비싸다)',
    },
    { key: '_Rows', label: '줄 수', type: 'range', min: 16, max: 240, step: 1, default: 60, unit: ' 줄', hint: '화면 높이를 몇 칸으로 나눌지. 픽셀이 아니라 줄 수라 해상도가 바뀌어도 모양이 같다. 기본 60 은 1080p 에서 칸 한 변이 18 픽셀이다. 칸이 3 픽셀보다 작아지면 점 대신 원본 화면으로 섞인다' },
    { key: '_Angle', showWhen: { key: '_Mode', values: ['0', '1'] }, label: '각도', type: 'range', min: 0, max: 90, step: 1, default: 45, unit: '°', hint: '흑백과 칸 색에서만 쓴다. 칸 격자를 돌리는 각도. 눈은 가로·세로 줄에 민감해 45 도가 가장 덜 거슬리고, 0 이면 점이 바둑판처럼 줄을 맞춘다. CMYK 는 판 각도가 고정이다' },
    { key: '_DotGain', label: '점 굵기 보정', type: 'range', min: -0.3, max: 0.3, step: 0.01, default: 0, hint: '모든 칸의 덮임에 더한다. 올리면 점이 굵어지고 흰 곳에도 작은 점이 생기며, 내리면 밝은 곳의 점이 사라져 종이가 드러난다' },
    { key: '_InkStrength', label: '잉크 세기', type: 'range', min: 0, max: 1, step: 0.01, default: 0.4, hint: '점 안이 얼마나 어두워질 수 있는지. 가장 진한 점도 종이 × (1 - 이 값) 밝기라 0.4 면 점 안이 종이의 60% 밝기다. 그보다 어두운 잉크(검정, 그늘의 칸 색, 겹친 CMYK)는 흰색 쪽으로 올려 그 밝기에 맞추고, 하늘처럼 이미 밝은 칸 색은 그대로 둔다. 0 이면 종이만 남는다. 0.4 를 넘기면 화면 전체 정지 무늬의 대비 권장을 벗어나므로 기본값과 게임 기본 설정은 0.4 이하로 둔다' },
    { key: '_PaperColor', label: '종이 색', type: 'color', default: '#f7f2e6', hint: '점 밖의 색. 점 안에도 곱해진다. 크림색이면 오래된 인쇄물, 흰색이면 깨끗한 인쇄물처럼 보인다' },
    { key: '_InkColor', showWhen: { key: '_Mode', values: ['0'] }, label: '잉크 색', type: 'color', default: '#1f2a44', hint: '흑백 한 판에서만 쓴다. 점을 칠하는 잉크의 색. 잉크 세기가 정한 밝기보다 어두우면 흰색 쪽으로 올라가므로 검정이어도 기본값에서는 회색 점이다' },
  ],
  presets: [
    { id: 'newspaper', name: '신문 흑백', look: '거의 검은 잉크의 흑백 한 판. 대비가 높아 화면 전체에 오래 쓰지 않는다 (광과민 권장 밖, 고를 때만)', values: { _Mode: '0', _Rows: 80, _InkStrength: 0.92, _InkColor: '#141414', _PaperColor: '#ebe8de' } },
    { id: 'comic-cmyk', name: '만화 인쇄 CMYK', look: '크림색 종이에 네 판을 겹친 로제트 무늬', values: { _Mode: '2', _Rows: 70, _PaperColor: '#f6ecd2' } },
    { id: 'pop-art', name: '팝아트 큰 점', look: '줄을 맞춘 큰 칸 색 점. 점을 조금 가늘게 해 그늘에서도 점이 동그랗게 남는다', values: { _Angle: 0, _Rows: 24, _DotGain: -0.12, _PaperColor: '#ffffff' } },
    { id: 'subtle-print', name: '은은한 인쇄 질감', look: '촘촘한 CMYK 를 약하게 깔아 질감만 더한다', values: { _Mode: '2', _Rows: 110, _InkStrength: 0.25, _PaperColor: '#fbf8f1' } },
  ],
  events: [],
  steps: [
    { n: 1, label: '돌린 칸 격자', body: '칸 안 좌표를 빨강(가로), 초록(세로)으로 보였다. 기본 줄 수에서는 칸이 작아 비스듬한 잔무늬로만 보이니 줄 수를 20 쪽으로 내려 본다. 왼쪽 꼭짓점이 어둡고 오른쪽 꼭짓점이 노란 마름모가 화면을 덮는다. 정사각 칸을 45 도 돌린 것이다. 가로가 긴 화면인데도 마름모가 찌그러지지 않는다. 좌표에 화면비를 곱한 뒤 돌렸기 때문이다. 각도를 0 으로 내리면 칸이 바둑판처럼 선다.' },
    { n: 2, label: '칸 중심에서 읽은 색', body: '칸 안의 모든 픽셀이 칸 가운데 한 점의 색을 읽어 화면이 비스듬한 마름모 모자이크가 되었다. 공의 윤곽과 바닥 격자의 경계가 칸 크기의 톱니로 끊긴다. 점 하나가 색 하나를 가져야 경계에서 점이 반쪽으로 잘리지 않는다.' },
    { n: 3, label: '점 마스크', body: '칸 색의 선형 밝기로 잉크 덮임(1 - 밝기)을 구하고, 원 면적이 덮임과 같도록 반지름을 덮임의 제곱근에 비례하게 그렸다. 흰 종이에 검은 점으로 보인다. 하늘과 바닥은 칸의 3분의 2 쯤 되는 점, 큰 공 위쪽의 밝은 곳은 작은 점이다. 공 아래 그늘은 점이 칸 밖으로 넘쳐 서로 붙고 칸 귀퉁이에 작은 흰 구멍만 남는다. CMYK 를 고르면 네 판을 순수한 잉크로 겹쳐 하늘에 시안과 남색, 상자에 노랑이 섞인 작은 꽃 모양(로제트)이 보인다. 최종 화면은 이 점을 잉크 세기가 정한 밝기 아래로 내려가지 않게 종이에 찍은 것이다.' },
  ],
  offNote: '반지름을 밝기에 선형으로 둔 흔한 실수 (`r = 0.5 × (1 - 밝기)`). 점 면적은 반지름의 제곱이라 중간 톤(덮임 0.5)에서 잉크가 칸의 20% 만 덮는다. 하늘과 바닥의 점이 눈에 띄게 작아져 화면이 종이 색으로 밝게 뜨고 색이 빠진다. 반지름이 0.5 에서 멈춰 공 아래 그늘도 점끼리 닿기만 하고 메워지지 않아, 어두운 곳이 어둡게 보이지 않는다.',
  mistakes: [
    { title: '화면 전체가 밝고 색이 빠져 보인다', body: '반지름을 밝기에 선형으로 두면(`r = 0.5 × (1 - 밝기)`) 점 면적이 그 제곱이라 중간 톤의 잉크가 크게 모자란다 (덮임 0.5 에서 20%). 칸 한 변을 1 로 두고 `r = sqrt(덮임 / π)` 로 면적을 덮임에 맞춘다. 덮임이 78.5% 를 넘으면 원이 칸 밖으로 넘치므로, 그 위에서는 반대각선 0.707 까지 키워 귀퉁이의 흰 구멍이 줄어들게 한다.' },
    { title: '물체 경계에서 점이 반달처럼 잘리고 지글거린다', body: '픽셀마다 자기 자리의 색을 읽어 덮임을 구하면 칸 하나 안에서 반지름이 바뀌어, 색 경계를 지나는 점이 반쪽만 그려진다. 칸 좌표를 `floor + 0.5` 로 칸 중심에 모은 뒤 거꾸로 돌려 화면 uv 로 되돌리고, 그 한 점에서만 읽는다. CMYK 는 판마다 자기 각도의 칸 중심에서 따로 읽는다.' },
    { title: '중간 톤의 점이 작아 사진이 바랜 듯 밝다', body: '감마(sRGB) 값으로 덮임을 계산한 경우다. sRGB 0.5 는 선형 밝기 0.21 이라 실제로는 79% 를 덮어야 같은 밝기로 보이는데 50% 만 덮는다. URP 의 Linear 색 공간에서는 화면 텍스처가 선형으로 읽히므로 읽은 값을 그대로 쓰고, 표시용 sRGB 로 바꾼 값이나 Gamma 색 공간 프로젝트의 값으로 덮임을 구하지 않는다.' },
    { title: '점이 가로로 늘어난 타원이거나 해상도마다 점 크기가 다르다', body: 'uv 에 바로 칸 수를 곱하면 가로가 긴 화면에서 칸이 직사각이 되고 점이 타원이 된다. 화면 가운데를 원점으로 `float2(aspect, 1)` 을 곱한 뒤 돌린다. 칸 크기를 픽셀로 정하면 1080p 와 720p 에서 점 개수가 달라지므로 화면 높이의 줄 수로 정한다. 칸이 3 픽셀보다 작으면 점이 픽셀과 부딪쳐 얼룩이 되므로 원본으로 섞는다.' },
    { title: '점 무늬 화면이 눈을 피곤하게 한다', body: '화면 전체를 덮는 정지 점 격자도 줄무늬처럼 광과민 반응을 일으킬 수 있다. 점 안이 점 밖의 60% 이상 밝기가 되게 잉크 세기를 0.4 이하로 둔다. 잉크를 섞는 비율로만 낮추면 밝은 칸 색까지 함께 바래므로, 잉크의 선형 밝기가 종이 × (1 - 잉크 세기) 보다 어두울 때만 흰색 쪽으로 올려 맞춘다. CMYK 는 판이 겹친 결과에 건다. 점을 시간으로 움직이거나 크기를 계속 바꾸지 않는다. 신문 흑백처럼 대비가 높은 모양은 잠깐 쓰는 연출이나 이용자가 고르는 옵션으로만 두고, 게임 옵션에서 효과를 끌 수 있게 한다.' },
  ],
  unity: {
    setup: [
      '`ScreenHalftoneDots.shader`, `core.hlsl` 을 `Assets/Shaders/screen-halftone-dots/` 에 둔다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다. 기본값은 바로 쓸 수 있는 약한 값(잉크 세기 0.4)이다.',
      '사용 중인 렌더러 에셋(Universal Renderer Data 또는 Renderer 2D Data)의 Add Renderer Feature 에서 Full Screen Pass Renderer Feature 를 추가한다. Requirements 는 None 으로 둔다.',
      'Pass Material 에 머티리얼을 넣고 Fetch Color Buffer 를 켠다. Injection Point 는 Bloom 이 없으면 Before Rendering Post Processing, Bloom 이나 톤 매핑 뒤에 점을 찍으려면 After Rendering Post Processing 으로 둔다.',
      '옵션 메뉴의 토글을 Full Screen Pass Renderer Feature 의 `SetActive` 에 연결해 효과를 끌 수 있게 한다.',
    ],
    verify: 'Game 뷰 전체가 45 도로 기운 점 격자로 바뀌고, 밝은 하늘에는 작은 점, 어두운 그늘에는 큰 점이 찍힌다. 줄 수를 내리면 점이 커지고, 방식을 CMYK 로 바꾸면 네 색 점이 겹친 작은 꽃 모양이 보이며, 잉크 세기를 0 으로 내리면 종이 색만 남는다.',
    pitfalls: [
      '화면 전체를 덮는 정지 점 격자는 광과민 반응을 일으킬 수 있다. 게임 옵션으로 효과를 끌 수 있게 한다 (Full Screen Pass Renderer Feature 를 `SetActive(false)` 하거나 렌더러를 바꾼다. 에디터에서는 Renderer Feature 의 켜짐 상태가 에셋에 저장된다). 기본 잉크 세기 0.4 는 점 안이 종이의 60% 밝기다. 셰이더는 잉크 세기를 막지 않으므로 0.4 를 넘는 값(신문 흑백 프리셋 0.92)은 이용자가 고르는 옵션으로만 둔다. 점을 움직이는 연출(시간으로 흘리기, 점 크기 반복)은 넣지 않는다.',
      'Bloom 과 톤 매핑 뒤에 점을 찍으려면 Injection Point 를 After Rendering Post Processing 으로 둔다. Before Rendering Post Processing 이면 점 가장자리가 Bloom 에 번진다. After Rendering Post Processing 과 FXAA, 업스케일(FSR, STP)의 순서는 확인하지 않았다.',
      'Screen Space - Overlay 캔버스의 UI 는 이 패스 뒤에 그려져 점이 덮이지 않는다. 글자는 읽기 쉽게 남는 편이 낫다. UI 까지 덮으려면 Screen Space - Camera 캔버스를 쓴다. Renderer Feature 는 그 렌더러를 쓰는 모든 카메라와 Scene 뷰에 걸리므로, 미니맵이나 렌더 텍스처 카메라는 다른 렌더러를 쓰게 한다.',
      'XR 에서는 이 패스를 끈다. 머리에 붙은 화면 공간 점 무늬는 두 눈의 무늬가 장면 깊이와 맞지 않아 화면에 붙은 막처럼 보인다 (추정, 실기기 미확인). XR 에서는 같은 원리를 물체 표면의 음영(월드 공간 좌표)으로 옮긴다.',
      '비용은 픽셀마다 화면 텍스처 읽기 2번(흑백, 칸 색: 칸 중심 1번과 원본 1번) 또는 5번(CMYK: 판마다 1번과 원본 1번)이다. 모바일에서는 흑백이나 칸 색을 권한다. 칸 크기는 `_ScreenSize`(카메라 대상 높이)의 줄 수라 Render Scale 이나 동적 해상도를 바꿔도 칸 모양은 같고, 칸이 3 픽셀보다 작아지면 원본으로 섞인다.',
    ],
  },
  prompt: {
    goal: '게임 화면 전체를 기울어진 점 격자로 바꿔, 밝기를 점의 크기로 나타내는 인쇄물 느낌(흑백, 칸 색, CMYK)을 내는 하프톤 필터를 넣는다. 내장 Full Screen Pass Renderer Feature 에 머티리얼로 연결하고, 옵션에서 끌 수 있게 한다.',
    adaptIdeas: [
      '일시정지 화면이나 만화풍 컷신 배경에만 하프톤을 잠깐 걸고, 평소에는 꺼 두고 싶다.',
      '외곽선 후처리와 함께 써서 만화 인쇄 느낌을 만들고 싶다. 외곽선은 점 위에 또렷하게 남게 하고 싶다.',
      '화면 전체 대신 캐릭터 그림자 부분에만 점을 찍고 싶다 (툰 음영의 어두운 쪽을 월드 공간 점으로 바꾸는 표면 셰이더 변형).',
      '옵션 메뉴에 필터 끄기, 은은한 질감, 만화 인쇄 세 단계를 두고 싶다.',
    ],
  },
  // 화면을 덮는 잔무늬라 촬영 용량이 크다. 기본값(칸 색 점)과 CMYK 한 장만 찍는다. 둘 다 잉크 세기 0.4 (안전 기준 안)
  captures: [
    { name: 'comic-cmyk', label: '만화 인쇄 CMYK', values: { _Mode: '2', _Rows: 70, _PaperColor: '#f6ecd2' } },
  ],
  // 기본값(칸 색 점)은 잉크 세기 0.4 라 점이 옅다. 네 판이 겹친 로제트가 한눈에 보이는 CMYK 촬영을 썸네일로 쓴다
  thumbnail: 'comic-cmyk',
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 인쇄 하프톤의 원리(돌린 칸 격자, 칸 중심 한 번 읽기, 면적을 덮임에 맞춘 제곱근 반지름, CMYK 판 각도)를 이 갤러리에서 새로 작성했다. 튜토리얼과 Unity 샘플의 코드는 옮기지 않았다. 칸 크기를 화면 높이의 줄 수로 정해 웹 미리보기와 Unity 화면이 같은 모양이 되게 했고, 광과민 안전을 위해 잉크의 선형 밝기에 하한(기본 종이의 60%)을 두고 점을 움직이지 않게 했다. 하한보다 밝은 칸 색은 그대로 두어 안전 기준 안에서도 색이 남는다. 덮임 78.5% 위의 반지름은 귀퉁이 흰 구멍의 면적으로 근사했다.',
  references: [
    { label: 'Unity Shader Graph: Production Ready 후처리 샘플 (Half Tone)', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Post.html' },
    { label: 'Unity Shader Graph: UGUI Shaders 샘플 서브그래프 (Halftone)', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-UGUI-Shaders-Subgraph-nodes.html' },
    { label: 'Gustavson: WebGL 하프톤 셰이더 튜토리얼', url: 'https://itn-web.it.liu.se/~stegu76/webglshadertutorial/shadertutorial.html' },
    { label: 'Heckel: Shades of Halftone', url: 'https://blog.maximeheckel.com/posts/shades-of-halftone/' },
  ],
  related: [
    { id: 'screen-crt-scanline', why: '같은 "가상 해상도 칸의 중심에서 읽기" 원리를 1D 줄에서 쓴다. 정지 줄무늬 안전 규칙도 같다' },
    { id: 'ui-sdf-shape', why: '원 SDF 와 `fwidth` 한 픽셀 안티에일리어싱이 같다' },
    { id: 'depth-normal-edge-outline', why: '외곽선 후처리와 겹치면 만화 인쇄 느낌이 된다' },
    { id: 'toon-ramp-lit', why: '툰 음영 위에 덮는 만화 질감. 점을 표면(월드 공간)에 붙이는 변형의 출발점' },
  ],
}
