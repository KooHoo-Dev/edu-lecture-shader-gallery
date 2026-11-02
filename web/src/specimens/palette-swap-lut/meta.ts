import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'palette-swap-lut',
  title: '팔레트 스왑',
  titleEn: 'Palette Swap (LUT)',
  group: 'E',
  order: 2,
  oneLiner: '이미지 한 장으로 색 변형을 만든다',
  goals: [
    '스프라이트에 색 대신 색 번호를 담고, 팔레트 텍스처에서 그 번호의 색을 읽는 원리를 설명할 수 있다.',
    '번호를 팔레트 칸 가운데 좌표로 바꿔야 하는 이유(반 텍셀 오프셋)를 설명할 수 있다.',
    '인덱스 텍스처는 sRGB 를 끄고 두 텍스처 모두 Point 필터와 압축 없음으로 임포트할 수 있다.',
    '`SpriteRenderer.material` 복사본으로 캐릭터마다 팀 색과 피격 색을 따로 바꿀 수 있다.',
  ],
  tags: ['스프라이트', '팔레트', '룩업 텍스처', '텍스처 임포트', '픽셀 아트'],
  difficulty: 2,
  shaderFile: 'PaletteSwapLut.shader',
  stage: {
    kind: 'sprite',
    blend: 'alpha',
    textures: {
      _MainTex: { file: 'PaletteSwapLutIndex.png', linear: true, point: true },
      _PaletteTex: { file: 'PaletteSwapLutPalette.png', point: true },
    },
  },
  params: [
    { key: '_PaletteRow', label: '팔레트 줄', type: 'range', min: 0, max: 7, step: 1, default: 0, hint: '팔레트 PNG 의 위에서부터 몇 번째 줄을 쓸지. 0 기본(파랑), 1 빨강 팀, 2 초록 팀, 3 정예 적, 4 밤, 5 노을, 6 석화, 7 피격' },
    { key: '_HitFlash', label: '피격', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '0.5 이상이면 팔레트 줄이 피격 줄로 통째로 바뀐다. C# 은 맞은 순간 1 로 올렸다가 잠시 뒤 0 으로 내린다' },
    { key: '_HitRow', label: '피격 줄', type: 'range', min: 0, max: 7, step: 1, default: 7, hint: '피격 중에 쓸 줄. 피격을 0.5 이상으로 올린 채 바꿔 본다. 7 은 흰 몸에 빨간 외곽선이다' },
  ],
  presets: [
    { id: 'hero', name: '주인공', look: '파랑 옷에 주황 머리띠', values: {} },
    { id: 'red-team', name: '빨강 팀', look: '같은 그림을 빨강 팀 색으로 바꾼다', values: { _PaletteRow: 1 } },
    { id: 'elite-enemy', name: '정예 적', look: '보라 옷, 흰 머리, 노란 눈의 강한 적', values: { _PaletteRow: 3 } },
    { id: 'night', name: '밤 장면', look: '장면 분위기에 맞춰 캐릭터 전체를 어둡고 푸르게', values: { _PaletteRow: 4 } },
    { id: 'petrified', name: '석화 상태', look: '상태 이상으로 돌처럼 회색이 된다', values: { _PaletteRow: 6 } },
  ],
  events: [
    {
      id: 'hit',
      label: '피격',
      tracks: [{ key: '_HitFlash', frames: [[0, 1], [0.2, 1], [0.21, 0]], ease: 'linear' }],
    },
  ],
  demo: {
    // 팔레트 줄을 0 부터 6 까지 차례로 넘긴다. 셰이더가 줄 번호를 반올림하므로 줄마다 1.5 초씩 머문다.
    loops: [{ key: '_PaletteRow', frames: [[0, -0.49], [10.5, 6.49]], ease: 'linear' }],
    fire: [{ event: 'hit', every: 2.2 }],
  },
  steps: [
    { n: 1, label: '인덱스 회색', body: '스프라이트의 R 값을 그대로 회색으로 본다. 색 번호 0~7 을 0~1 로 나눠 담았다. 외곽선은 0 이라 투명한 배경과 같은 검정으로 묻히고, 옷, 머리카락, 피부 순으로 밝아지며 머리띠와 눈 하이라이트가 거의 흰색이다. 화면에는 sRGB 로 나가 옷의 어두운 면도 꽤 밝은 회색으로 보인다. 이 그림 자체에는 색 정보가 없다.' },
    { n: 2, label: '팔레트 읽는 좌표', body: '번호를 정수로 되돌려 `(번호 + 0.5) / 칸 수` 로 바꾼 가로 좌표를 빨강에, 고른 줄의 세로 좌표를 초록에 담았다. +0.5 가 칸 가운데를 가리키게 하는 반 텍셀 오프셋이다. 같은 번호의 영역은 모두 한 색이고, 외곽선은 빨강이 거의 없어 초록, 번호가 클수록 빨강이 더해져 노랑에 가까워진다. 0번 줄은 팔레트 맨 위라 초록이 강하다. 팔레트 줄을 올리면 초록만 줄어 그림 전체가 주황 쪽으로 바뀐다.' },
    { n: 3, label: '팔레트 색', body: '그 좌표로 팔레트를 읽은 색이다. 그림은 그대로이고 팔레트 줄만 바꿔 팀 색, 밤 장면, 석화 상태가 된다. 피격 버튼을 누르면 줄이 잠깐 피격 줄로 통째로 바뀐다.' },
  ],
  offNote: '인덱스 스프라이트를 Unity 기본값대로 sRGB 를 켠 채 임포트한 모습이다. GPU 가 읽으면서 감마를 풀어 값이 작아지고 색 번호가 낮은 쪽으로 밀린다. 옷은 외곽선처럼 검게 묻히고, 머리카락은 옷 색, 피부는 옷의 밝은 하늘색, 머리띠와 신발은 피부색이 된다. 값이 0 과 1 인 외곽선과 눈 하이라이트만 제자리다. 웹에서는 텍스처 설정을 바꿀 수 없어 같은 변환을 셰이더에서 해서 보여 준다.',
  mistakes: [
    { title: '피부가 파랗고 옷이 검게 나온다', body: '인덱스 스프라이트의 sRGB (Color Texture) 가 켜져 있으면 GPU 가 값을 감마 변환해 색 번호가 낮은 쪽으로 밀린다. 임포트 설정의 Advanced 에서 sRGB 를 끄고 Apply 한다. 팔레트는 색이므로 반대로 켜 둔다.' },
    { title: '색 경계가 번지거나 없는 색이 섞인다', body: 'Filter Mode 가 Bilinear 이면 이웃 번호나 이웃 팔레트 칸과 섞인 값을 읽는다. 압축(Compression)이 켜져 있으면 4x4 블록 안의 값이 서로 섞여 번호가 틀어진다. 인덱스 스프라이트와 팔레트 모두 Filter Mode 는 Point, Compression 은 None 으로 둔다.' },
    { title: '어떤 색만 옆 칸 색으로 나오거나 깜빡인다', body: '번호를 `번호 / 칸 수` 로 바꿔 읽으면 칸의 왼쪽 경계를 가리켜 실수 오차 하나로 옆 칸이 나온다. `(번호 + 0.5) / 칸 수` 로 칸 가운데를 읽는다. 1x256 팔레트에서 흔한 반 텍셀 오류다.' },
    { title: '색 경계마다 가는 선이 생긴다', body: '팔레트 좌표가 색 경계에서 크게 뛰어 GPU 가 작은 밉맵을 고른다. 이 셰이더는 `SAMPLE_TEXTURE2D_LOD` 로 0 단계만 읽어 막는다. 직접 고친다면 팔레트의 Generate Mip Maps 를 끈다.' },
    { title: '한 캐릭터의 팀을 바꿨는데 전부 바뀐다', body: '`sharedMaterial` 이나 머티리얼 에셋의 값을 바꾸면 같은 머티리얼을 쓰는 모든 캐릭터가 함께 바뀐다. `SpriteRenderer.material` 로 복사본을 만들고 `OnDestroy` 에서 지운다. `PaletteSwapController` 가 그렇게 한다.' },
  ],
  unity: {
    setup: [
      '`PaletteSwapLut.shader`, `core.hlsl`, `PaletteSwapController.cs`, `PaletteSwapLutIndex.png`, `PaletteSwapLutPalette.png` 를 `Assets/Shaders/palette-swap-lut/` 에 둔다.',
      '`PaletteSwapLutIndex.png` 를 고르고 Inspector 에서 Texture Type 은 Sprite (2D and UI), Pixels Per Unit 은 64, Mesh Type 은 Full Rect, Advanced 의 sRGB (Color Texture) 는 끄고, Filter Mode 는 Point (no filter), Compression 은 None 으로 맞춘 뒤 Apply 를 누른다.',
      '`PaletteSwapLutPalette.png` 를 고르고 Texture Type 은 Default, sRGB (Color Texture) 는 켜고, Wrap Mode 는 Clamp, Filter Mode 는 Point (no filter), Generate Mip Maps 는 끄고, Compression 은 None 으로 맞춘 뒤 Apply 를 누른다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고 팔레트 칸에 `PaletteSwapLutPalette.png` 를 넣는다.',
      '인덱스 스프라이트를 씬에 끌어다 놓고 SpriteRenderer 의 Material 칸에 이 머티리얼을 넣는다.',
      '같은 오브젝트에 `PaletteSwapController` 를 붙여 Team Row 를 정하고, 팀이 바뀌면 `SetTeam(줄)`, 피격 판정 때 `Hit()` 을 호출한다.',
    ],
    verify: '머티리얼의 팔레트 줄을 0 에서 1 로 바꾸면 파랑 옷이 빨강 옷으로 바뀌고 피부와 머리카락은 그대로다. 피격을 0.5 이상으로 올리면 몸 전체가 흰색, 외곽선이 빨강이 된다.',
    pitfalls: [
      '2D Renderer 에서는 `Universal2D` 패스가, Universal Renderer 에서는 `UniversalForward` 패스가 그려진다. 하나를 지우면 다른 쪽에서 스프라이트가 사라진다.',
      'Unity 의 기본 임포트는 압축이 켜져 있어(데스크톱 BC, 모바일 ASTC) 4x4 블록 안의 값이 섞인다. 이 표본의 PNG 는 아트 1픽셀을 4x4 텍셀로 키워 압축돼도 번호가 버티게 만들었지만, 1배 크기로 그린 인덱스 스프라이트와 팔레트는 반드시 Compression 을 None 으로 둔다.',
      'Default 텍스처는 Non-Power of 2 가 ToNearest 라 크기가 2의 거듭제곱이 아니면 늘어나며 칸이 어긋난다. 팔레트는 2의 거듭제곱 크기로 만들거나 Non-Power of 2 를 None 으로 둔다. 칸 수를 바꾸면 `core.hlsl` 의 `PALETTE_COLORS`, `PALETTE_ROWS` 도 맞춘다.',
      '이 셰이더는 2D 조명을 받지 않는다. 밤 장면처럼 분위기를 바꾸는 것은 조명 대신 팔레트 줄로 한다. 2D 라이트가 필요하면 `Universal2D` 패스에 라이팅 코드를 넣어야 한다.',
      'Sprite Atlas 에 넣어도 인덱스 값은 그대로지만, 아틀라스의 Compression 과 Filter Mode 가 따로 있으므로 같은 설정(None, Point)을 다시 맞춘다. sRGB 도 아틀라스 설정을 따른다.',
      'MaterialPropertyBlock 은 쓰지 않는다. SRP Batcher 에서 빠지고, 머티리얼 복사본 방식이 수업 프로젝트와도 같다.',
    ],
    graph: 'Shader Graph 의 Sprite Unlit 타깃에서는 노드만으로 같은 일을 할 수 있다. Sample Texture 2D 로 인덱스의 R 을 읽어 Multiply(칸 수 - 1), Round, Add(0.5), Divide(칸 수) 로 U 를 만들고, 줄 번호로 V 를 만들어 Vector 2 로 합친 뒤 팔레트를 Sample Texture 2D LOD (LOD 0) 로 읽는다. 두 Sample 노드의 Type 은 Default 로 두되, 인덱스 텍스처의 sRGB 는 임포트 설정에서 꺼야 한다. 샘플러는 Sampler State 노드로 Point 를 지정한다.',
  },
  prompt: {
    goal: 'SpriteRenderer 에 쓰는 팔레트 스왑 셰이더를 넣는다. 회색 인덱스 스프라이트 한 장과 팔레트 텍스처로 캐릭터마다 팀 색, 장면 분위기, 피격 색을 따로 바꿀 수 있다.',
    adaptIdeas: [
      '머지 게임처럼 단계가 오를수록 같은 그림의 색이 바뀌게 하고 싶다.',
      '물이나 용암 색 칸만 시간에 따라 돌려 반짝이게(팔레트 사이클링) 하고 싶다.',
      '피격 때 피격 줄과 원래 줄을 두세 번 번갈아 깜빡이게 하고 싶다. 초당 3회를 넘지 않게.',
      '플레이어가 고른 색으로 옷 색만 바꾸게 하고 싶다. 팔레트 텍스처를 코드에서 만들어서.',
      '기존 컬러 스프라이트에서 인덱스 스프라이트와 팔레트를 자동으로 뽑아내는 에디터 도구를 만들고 싶다.',
    ],
  },
  captures: [
    { name: 'red-team', label: '빨강 팀', values: { _PaletteRow: 1 } },
    { name: 'night', label: '밤 장면', values: { _PaletteRow: 4 } },
    { name: 'hit', label: '피격 순간', values: { _HitFlash: 1 } },
  ],
  inspiredBy: [
    {
      title: 'Little Nemo and the Guardians of Slumberland (2025)',
      credit: 'Dream Logic Games',
      borrowed: ['장면 분위기에 맞춰 스프라이트 팔레트를 바꾸기'],
      learned: '제작기는 커스텀 스프라이트 셰이더가 팔레트 스왑을 지원해 장면의 조명 분위기를 바꾼다고 쓴다. 이 표본의 밤, 노을 줄이 그 축이다. 게임 화면은 직접 확인하지 않았다.',
      link: 'https://diesoft.games/2022/06/13/nemo-art-pipeline.html',
    },
  ],
  original: '원작의 스프라이트, 팔레트, 셰이더를 옮기지 않았다. 캐릭터와 팔레트는 이 갤러리에서 코드로 새로 그렸고, 셰이더도 새로 작성했다. 팀 색, 상태 이상, 피격 줄은 수업 2D 08 Merge Game 의 단계별 색과 99 Rockman 의 클래식 팔레트 연출을 떠올리며 넣었다.',
  references: [
    { label: 'Envato Tuts+: 셰이더로 스프라이트 색 바꾸기', url: 'https://code.tutsplus.com/how-to-use-a-shader-to-dynamically-swap-a-sprites-colors--cms-25129t' },
    { label: 'Unity 토론: 한 채널 인덱스로 팔레트 스왑하기', url: 'https://discussions.unity.com/t/palette-swapping-shader-for-single-channels/676602' },
    { label: 'Diesoft: Little Nemo 아트 파이프라인 제작기', url: 'https://diesoft.games/2022/06/13/nemo-art-pipeline.html' },
  ],
  related: [
    { id: 'sprite-outline-hit-flash', why: '같은 피격 신호를 색 섞기(lerp)로 만든 짝. 팔레트 스왑은 줄을 통째로 바꾼다' },
    { id: 'toon-ramp-lit', why: '값 하나로 색 계단을 고르는 같은 조회 발상을 조명 밝기에 쓴 예. 램프 텍스처 대신 수식으로 계단을 만든다' },
  ],
}
