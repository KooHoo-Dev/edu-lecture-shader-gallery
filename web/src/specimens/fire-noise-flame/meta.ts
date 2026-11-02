import type { SpecimenMeta } from '../../core/types'

const CANDLE = { _CoreColor: '#fff4c8', _MidColor: '#ffb52e', _EdgeColor: '#ff5a0a', _FlameWidth: 0.17, _FlameHeight: 0.8, _FlowSpeed: 0.5, _NoiseScale: 0.6, _EdgeSoftness: 0.1, _Wobble: 0.05, _Intensity: 1.8 }
const MAGIC_BLUE = { _CoreColor: '#dff7ff', _MidColor: '#35a4ff', _EdgeColor: '#2436ff', _FlowSpeed: 1.4, _NoiseScale: 2.2, _Intensity: 1.8 }
const MAGIC_GREEN = { _CoreColor: '#efffd0', _MidColor: '#5cf05a', _EdgeColor: '#0e8a3c', _FlowSpeed: 0.8, _Wobble: 0.32, _EdgeSoftness: 0.04 }

export const meta: SpecimenMeta = {
  id: 'fire-noise-flame',
  title: '노이즈 불꽃',
  titleEn: 'Noise Flame',
  group: 'D',
  order: 1,
  oneLiner: '흐르는 노이즈를 불꽃 모양으로 깎아 타오르게 한다',
  goals: [
    '같은 노이즈 텍스처를 크기와 속도가 다른 두 층으로 위로 흘려 곱하면 무늬가 계속 바뀌어 일렁인다는 것을 설명할 수 있다.',
    'UV 로 아래는 넓고 위로 갈수록 좁아지는 부드러운 불꽃 모양 마스크를 만들 수 있다.',
    '마스크와 노이즈를 합친 값을 `smoothstep` 으로 깎아 일렁이는 가장자리를 만들 수 있다.',
    '깎은 세기에 따라 노랑, 주황, 빨강을 칠하고 더하기 혼합으로 불을 그릴 수 있다.',
  ],
  tags: ['UV 스크롤', '노이즈 텍스처', '모양 마스크', '임계값', '더하기 혼합'],
  difficulty: 1,
  shaderFile: 'FireNoiseFlame.shader',
  stage: {
    kind: 'mesh',
    mesh: 'quad',
    blend: 'additive',
    doubleSided: true,
    textures: { _NoiseTex: { file: 'FireNoiseFlameNoise.png', linear: true, repeat: true } },
  },
  params: [
    { key: '_CoreColor', label: '속 색', type: 'color', default: '#ffe680', hint: '가장 뜨거운 아래 가운데의 색. 세기를 곱하면 흰빛에 가까워진다' },
    { key: '_MidColor', label: '가운데 색', type: 'color', default: '#ff8014', hint: '불꽃 몸통을 덮는 색. 불의 인상을 가장 크게 바꾼다' },
    { key: '_EdgeColor', label: '가장자리 색', type: 'color', default: '#d9230a', hint: '깎인 가장자리와 갈라진 불꽃 끝의 색' },
    { key: '_Intensity', label: '세기 (HDR)', type: 'range', min: 0, max: 4, step: 0.05, default: 1.5, hint: '색에 곱하는 배율. 1 보다 크면 HDR 값이라 Bloom 이 있으면 번진다. Bloom 을 켠 씬에서는 낮춘다' },
    { key: '_FlowSpeed', label: '흐름 속도', type: 'range', min: 0, max: 3, step: 0.05, default: 1, hint: '두 노이즈 층과 너울이 함께 빨라진다. 0 이면 불이 멈춘다' },
    { key: '_NoiseScale', label: '노이즈 크기', type: 'range', min: 0.5, max: 3, step: 0.05, default: 1, hint: 'Quad 한 장에 노이즈를 몇 번 반복하는지. 클수록 불꽃 혀가 잘고 많아진다' },
    { key: '_FlameHeight', label: '불꽃 높이', type: 'range', min: 0.3, max: 1, step: 0.01, default: 1, hint: 'Quad 높이를 1 로 볼 때 모양 마스크가 0 이 되는 높이' },
    { key: '_FlameWidth', label: '불꽃 폭', type: 'range', min: 0.1, max: 0.45, step: 0.01, default: 0.32, hint: '뿌리 쪽 반폭. Quad 폭을 1 로 볼 때의 값이라 0.45 면 거의 꽉 찬다' },
    { key: '_EdgeSoftness', label: '가장자리 부드러움', type: 'range', min: 0.01, max: 0.4, step: 0.01, default: 0.08, hint: '깎는 경계의 폭. 작으면 만화처럼 또렷하고 크면 연기처럼 흐리다' },
    { key: '_Wobble', label: '너울 세기', type: 'range', min: 0, max: 0.4, step: 0.01, default: 0.15, hint: '크고 느린 노이즈로 불꽃 위쪽을 좌우로 미는 양. 뿌리는 제자리에 있다' },
  ],
  presets: [
    { id: 'campfire', name: '모닥불', look: '주황 불길이 혀처럼 갈라지며 위로 타오르고 끝이 좌우로 너울댄다', values: {} },
    { id: 'candle', name: '촛불', look: '가늘고 낮은 노란 불꽃이 느리게 살랑인다', values: CANDLE },
    { id: 'magic-blue', name: '마법 불 (파랑)', look: '푸른 불꽃이 잘게 빠르게 타오른다', values: MAGIC_BLUE },
    { id: 'magic-green', name: '마법 불 (초록)', look: '초록 불꽃이 크게 휘청이며 가장자리가 또렷하다', values: MAGIC_GREEN },
  ],
  events: [],
  demo: {
    // 너울 세기를 오가며 곧게 서는 불과 바람에 휘청이는 불을 번갈아 보여 준다.
    // 흐름 속도는 시간에 곱하는 값이라 움직이면 무늬가 앞뒤로 튀므로 데모로 쓰지 않는다.
    loops: [{ key: '_Wobble', frames: [[0, 0.15], [3, 0.34], [5, 0.34], [8, 0.03], [10, 0.03], [12, 0.15]], ease: 'inOutSine' }],
  },
  steps: [
    {
      n: 1,
      label: '노이즈 한 층',
      body: '노이즈 텍스처 한 장을 UV 에 시간을 빼서 위로 흘린다. 흰 구름 사이에 어두운 얼룩이 몇 군데 있는 무늬가 Quad 전체를 덮고, 결이 세로로 길다. 재생해 보면 무늬가 통째로 위로 미끄러질 뿐 모양은 그대로다. 이것만으로는 불이 아니라 흐르는 판이다. 단계 보기는 더하지 않고 값을 그대로 그려 Quad 의 사각형이 다 보인다.',
    },
    {
      n: 2,
      label: '두 층 곱하기',
      body: '같은 텍스처를 두 배 잘게, 두 배쯤 빠르게 한 번 더 읽어 곱하고 2 를 곱한다. 두 층이 모두 밝은 자리만 밝게 남아 1단계보다 어두운 얼룩과 가는 결이 많아진다. 두 층의 속도가 달라 겹치는 자리가 계속 바뀌므로, 재생하면 무늬가 미끄러지지 않고 끓듯이 모양을 바꾼다. 불이 일렁이는 것은 이 곱셈 덕분이다.',
    },
    {
      n: 3,
      label: '모양 마스크',
      body: 'UV 만으로 만든 불꽃 모양이다. 검은 바탕에 흰 모양이 아래는 넓고 밝으며, 위로 갈수록 좁아지고 어두워져 Quad 윗변에서 사라진다. 아래 끝도 살짝 흐려 밑변이 보이지 않는다. 위쪽이 좌우로 휘는 것은 너울이다. 크고 느린 노이즈로 가로 위치를 밀되 높이를 곱해 뿌리는 제자리에 둔다. 불꽃 높이와 폭 값이 이 모양을 바꾼다.',
    },
    {
      n: 4,
      label: '깎은 불꽃',
      body: '마스크에 노이즈를 곱한 값을 기준값에서 `smoothstep` 으로 깎은 결과다. 흰 덩어리가 3단계의 불꽃 모양을 따르지만 가장자리는 노이즈 때문에 울퉁불퉁하다. 마스크가 옅은 위쪽은 노이즈가 밝은 곳만 남아 혀처럼 갈라지고 작은 조각이 떨어져 나간다. 이 흰 부분이 알파가 된다. 가장자리 부드러움을 키우면 경계가 흐려진다. 최종 화면은 여기에 기준값을 넘은 정도에 따라 속은 노랑, 가운데는 주황, 가장자리는 빨강을 칠한 것이다.',
    },
  ],
  offNote: '모양 마스크를 빼먹은 모습. 노이즈만 깎으니 Quad 전체가 타올라 사각형 판의 네 변이 그대로 드러난다. 무늬는 위로 흐르지만 불꽃이 아니라 불 무늬를 칠한 판처럼 보인다.',
  mistakes: [
    {
      title: '불꽃이 거꾸로 타거나 바닥에 눕는다',
      body: '모양 마스크와 흐름은 UV 의 v 가 위로 커진다고 보고 만든다. Unity 기본 Quad 는 v 가 위로 커지므로 Rotation 을 0 으로 두면 아래가 뿌리가 된다. 기본 Plane 은 UV 가 180도 돌아 있어 불꽃이 카메라 쪽으로 누워 거꾸로 타므로 쓰지 않는다. 흐름은 UV 에서 시간을 빼야 위로 간다. 더하면 무늬가 아래로 흘러 불이 빨려 들어가는 것처럼 보인다.',
    },
    {
      title: '사각형 판의 가장자리가 보인다',
      body: '모양 마스크가 Quad 의 네 변에서 0 이 되어야 한다. 마스크를 빼거나 알파를 1 로 두면 효과 끄기 화면처럼 판이 통째로 탄다. 불꽃 폭을 0.5 넘게 키우거나 너울이 너무 커서 불꽃이 옆 변까지 밀리면 그 변에서 칼로 자른 듯 끊긴다. 불꽃이 더 커야 하면 값 대신 Transform 의 Scale 로 Quad 를 키운다.',
    },
    {
      title: '불이 흐르는 판처럼 미끄러지기만 한다',
      body: '노이즈를 한 층만 흘리거나 두 층의 크기와 속도가 같으면 무늬가 통째로 위로 미끄러질 뿐 모양이 바뀌지 않는다. 같은 텍스처라도 두 층의 크기와 속도를 다르게 해야 겹치는 자리가 계속 바뀌어 일렁인다. 흐름 속도를 스크립트로 실행 중에 바꾸면 `_Time.y * 속도` 라서 무늬가 한 번에 튄다. 속도를 연출로 바꾸려면 C# 에서 `offset += speed * Time.deltaTime` 으로 쌓은 값을 넘겨 쓴다.',
    },
    {
      title: '불이 하얗게 날아가거나 Bloom 을 켜니 빛 덩어리가 된다',
      body: '세기는 색에 곱하는 HDR 배율이다. Bloom 이 없으면 1 을 넘는 채널이 1 에서 잘려 속이 흰빛이 되고, Bloom 이 있으면 그 값이 주변으로 크게 번진다. 기본값 1.5 는 Bloom 없이도 불로 보이게 고른 값이다. Bloom 을 켠 씬에서는 세기를 1 안팎으로 낮추고 Bloom 의 Threshold 와 Intensity 를 함께 맞춘다.',
    },
    {
      title: '불이 작고 어둡거나 무늬 없이 멈춰 있다',
      body: '노이즈 텍스처의 sRGB 가 켜져 있으면 값이 어둡게 휘어 불이 작아지고 구멍이 많아진다. 노이즈는 색이 아니라 데이터라 sRGB 를 끈다. Wrap Mode 가 Clamp 이면 흐르는 순간 가장자리 픽셀이 세로 줄로 늘어나므로 Repeat 로 둔다. 텍스처 칸이 비어 있으면 무늬 없는 매끈한 불꽃이 움직이지 않는다.',
    },
  ],
  unity: {
    setup: [
      '`FireNoiseFlame.shader`, `core.hlsl`, `FireNoiseFlameNoise.png` 를 `Assets/Shaders/fire-noise-flame/` 에 둔다.',
      'Project 창에서 `FireNoiseFlameNoise.png` 를 고르고 Inspector 에서 Texture Type 은 Default, sRGB (Color Texture) 는 끄고, Wrap Mode 는 Repeat, Filter Mode 는 Bilinear, Compression 은 None 으로 맞춘 뒤 Apply 를 누른다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고, 노이즈 텍스처 칸에 `FireNoiseFlameNoise.png` 를 넣는다.',
      'Hierarchy 에서 3D Object > Quad 를 만들고 머티리얼을 넣는다. Rotation 은 0 으로 두어 Quad 의 앞면이 -Z 쪽(새 씬의 카메라 쪽)을 보게 하고, 불의 아래 끝이 바닥에 닿도록 Position Y 를 Scale Y 의 절반쯤으로 올린다. 이 셰이더는 그림자를 만들지 않으므로 Mesh Renderer 의 Cast Shadows 를 Off 로, 필요 없으면 Mesh Collider 를 지운다.',
      '카메라가 돌아다니는 게임이면 Quad 대신 Particle System 을 만들어 Renderer 모듈의 Material 에 이 머티리얼을 넣고 Render Mode 를 Vertical Billboard 로 둔다. 파티클은 카메라를 향해 돌고 위쪽은 서 있다. Start Rotation 은 0, Start Speed 는 0 으로 둔다.',
      'Bloom 을 쓰는 씬이면 머티리얼의 세기를 1 안팎으로 낮춘다.',
    ],
    verify: 'Quad 아래쪽에서 불꽃이 위로 타오르고, 가장자리가 일렁이며 속은 노랑, 바깥은 빨강이다. 흐름 속도를 0 으로 내리면 불이 멈추고, 불꽃 폭을 0.1 로 줄이면 촛불처럼 가늘어지며, 가장자리 부드러움을 0.4 로 올리면 경계가 연기처럼 흐려진다.',
    pitfalls: [
      '이 셰이더에는 `UniversalForward` 패스 하나만 있어 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트용 효과다. 2D 에서 같은 원리를 쓰려면 스프라이트 셰이더로 옮긴다.',
      'Quad 는 납작한 판이라 옆에서 보면 선이 되고, 뒤에서 보면 양면을 그리므로 좌우가 뒤집힌 불이 보인다. 카메라가 돌면 Particle System 의 Billboard 나 Vertical Billboard 로 카메라를 향하게 하거나, 스크립트로 Y 축만 카메라 쪽으로 돌린다. X 축까지 돌리면 위에서 볼 때 불꽃이 눕는다. Unity 기본 Plane 은 UV 가 180도 돌아 있어 불꽃이 카메라 쪽으로 누워 거꾸로 탄다.',
      'Particle System 의 머티리얼로 쓰면 이 셰이더는 정점 색을 읽지 않아 Start Color 와 Color over Lifetime 이 무시된다. 파티클이 서서히 사라지지 않고 툭 사라지며, 모든 파티클이 같은 무늬로 같은 순간에 일렁인다. 래퍼에 `COLOR` 정점 입력을 받아 색과 알파에 곱하면 되지만 이 갤러리의 미리보기와 촬영에서는 확인하지 못했다.',
      'Bloom 과 톤매핑이 없으면 1 을 넘는 색은 채널마다 1 에서 잘린다. 기본값은 Bloom 없이도 불로 보이게 골랐다. Bloom 을 켜면 같은 세기에서 빛이 크게 번지므로 세기를 낮춘다. 카메라의 Post Processing 과 URP Asset 의 HDR 이 켜져 있어야 HDR 값이 Bloom 까지 간다.',
      '투명 물체라 깊이를 쓰지 않는다. 더하기 혼합은 그리는 순서와 상관없이 결과가 같아 불꽃끼리 겹쳐도 티가 나지 않지만, 겹친 곳은 더해져 더 밝다. 안개도 처리하지 않아 Lighting 창에서 Fog 를 켠 씬에서도 먼 불이 흐려지지 않고 그대로 밝다. 넓은 공간에 쓰면 래퍼에 안개를 넣는다 (변형 예시 참고).',
      '노이즈 텍스처 칸이 비어 있으면 `linearGrey`(선형 0.5)가 들어가 무늬 없는 매끈한 불꽃이 움직이지 않는다. 셰이더를 고쳐 기본값을 `"gray"` 로 두면 Linear 프로젝트에서 약 0.21 로 읽혀 불이 작고 어둡게 쪼그라든다.',
    ],
    graph: 'Shader Graph 로 옮기려면 UV 노드에 노이즈 크기를 곱하고, Time 노드에 흐름 속도와 0.6 을 곱해 Negate 한 값을 Tiling And Offset 노드의 Offset y 에 넣어 첫 층을 읽는다. 둘째 층은 크기를 두 배, 속도를 1.3 배로 같은 텍스처를 읽고, 두 값을 Multiply 한 뒤 2 를 곱한다. 모양 마스크는 UV 의 y 를 불꽃 높이로 나눈 h 로 반폭(폭 × (1 - 0.8h))을 구하고, UV 의 x 에서 0.5 를 뺀 절댓값을 반폭으로 나눈 값을 제곱해 One Minus 한 것에 (1 - h²) 와 Smoothstep(0, 0.15, y) 를 곱한다. 마스크 × (노이즈 + 0.3) × 2.5 를 Smoothstep(0.5 - 부드러움, 0.5 + 부드러움) 으로 깎아 Alpha 에 넣고, 같은 값으로 Lerp 두 번을 해 빨강, 주황, 노랑을 고른다. Graph Settings 는 Surface Type Transparent, Blending Mode Additive, Render Face Both 로 둔다.',
  },
  prompt: {
    goal: 'Quad 에 흐르는 노이즈 두 층을 곱하고 불꽃 모양 마스크로 깎아, 속은 노랑, 가운데는 주황, 가장자리는 빨강으로 일렁이는 기본 불꽃을 더하기 혼합으로 넣는다.',
    adaptIdeas: [
      'Particle System 의 Renderer 머티리얼로 써서 카메라를 향하는 불꽃 여러 개를 띄우고, Color over Lifetime 으로 색이 바뀌며 서서히 사라지게 하고 싶다. 파티클마다 무늬도 서로 어긋나게 하고 싶다.',
      'Quad 하나로 만든 모닥불이 카메라를 따라 세로 축으로만 돌아 늘 정면으로 보이게 하고 싶다.',
      '횃불을 켜고 끌 때 불꽃 높이가 서서히 커지고 줄어들게 하고 싶다.',
      '바람이 부는 방향으로 불꽃 위쪽이 한쪽으로 기울게 하고 싶다.',
      '불꽃 아래쪽에 장작이 달아오른 듯한 붉은 빛을 바닥에 깔고 싶다.',
      'Fog 를 켠 넓은 씬에서 멀리 있는 불이 안개 속으로 흐려지게 하고 싶다. 더하기 혼합이라 안개 색이 아니라 0 으로 사라져야 하므로 래퍼에서 `MixFogColor(color, half3(0, 0, 0), fogFactor)` 를 쓴다 (`#pragma multi_compile_fog` 와 정점의 `ComputeFogFactor(positionCS.z)` 가 함께 필요하다).',
    ],
  },
  captures: [
    { name: 'candle', label: '촛불', values: CANDLE },
    { name: 'magic-blue', label: '마법 불 (파랑)', values: MAGIC_BLUE },
  ],
  inspiredBy: [
    {
      title: 'Diablo III (2012)',
      credit: 'Blizzard Entertainment',
      borrowed: ['같은 노이즈 여러 층 곱하기', '부드러운 모양 마스크'],
      learned: 'GDC 2013 Technical Artist Bootcamp 발표 "The VFX of Diablo" 가 같은 노이즈 텍스처 여러 장을 곱하는 공식(`Tex1.a × Tex2.a × 2`)을 보여 준다 (세션 제목과 발표자만 확인했다). JangaFX 의 분석 글은 이를 크기가 다른 같은 노이즈 층과 모양을 잡는 부드러운 마스크로 재현한다. 이 표본의 2단계(두 층 곱하기)와 3단계(모양 마스크)가 이 두 축이다. 게임 화면은 직접 확인하지 않았다.',
      link: 'https://gdcvault.com/play/1017660/Technical-Artist-Bootcamp-The-VFX',
    },
  ],
  original: '게임 화면의 재현이 아니라 불 셰이더를 처음 만드는 사람을 위한 기초편이다. 수업 3D 07 External Assets 와 2D 의 MagicArsenal 이펙트의 불꽃이 쓰는 원리(흐르는 노이즈, 모양 마스크, 깎기, 더하기 혼합)를 네 단계로 줄여 HLSL 로 풀었다. 모양 마스크와 세 가지 색 그라데이션 식, 노이즈 텍스처와 코드는 이 갤러리에서 새로 만들었다.',
  references: [
    { label: 'GDC 2013 Technical Artist Bootcamp: 액션 RPG 이펙트 발표', url: 'https://gdcvault.com/play/1017660/Technical-Artist-Bootcamp-The-VFX' },
    { label: 'JangaFX: 노이즈 층 곱하기로 이펙트를 재현한 분석 글', url: 'https://jangafx.com/insights/diablo-3-vfx-experiments' },
  ],
  related: [
    { id: 'scroll-distort-energy', why: '흐르는 노이즈 두 층에 UV 왜곡과 끝단 마스크를 더한 다음 단계' },
    { id: 'dissolve-edge-glow', why: '노이즈를 임계값으로 깎고 경계에 빛나는 띠를 두는 짝' },
  ],
}
