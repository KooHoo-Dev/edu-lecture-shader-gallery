import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'matcap-lit-sphere',
  title: '매트캡',
  titleEn: 'Matcap Lit Sphere',
  group: 'A',
  order: 5,
  oneLiner: '빛을 그린 공 텍스처 한 장으로 조명 없이 재질을 낸다',
  goals: [
    '월드 법선을 카메라의 오른쪽·위 축에 내적해 화면 기준 법선 xy 를 구하고, `xy * 0.49 + 0.5` 로 매트캡 좌표를 만들 수 있다.',
    '조명이 텍스처에 구워져 있어 해를 돌려도 음영이 그대로인 이유를, 빛을 따르는 램프 툰과 비교해 설명할 수 있다.',
    '매트캡 텍스처를 sRGB 끔, Clamp, 압축 없음으로 들여와야 하는 이유를 설명할 수 있다.',
    '채널, 바탕색, 곱하기·더하기 합성을 바꿔 같은 텍스처 한 장으로 점토, 크롬, 툰, 옥 재질을 낼 수 있다.',
  ],
  tags: ['매트캡', '화면 공간 법선', '구운 조명', 'Unlit', '채널 패킹'],
  difficulty: 1,
  shaderFile: 'MatcapLitSphere.shader',
  stage: {
    kind: 'mesh',
    mesh: 'sphere',
    blend: 'cutout',
    // 매트캡 세 장을 R·G·B 에 담은 데이터 텍스처. 원판 밖을 읽지 않도록 Clamp(repeat 끔)로 둔다
    textures: { _MatcapTex: { file: 'MatcapSpheres.png', linear: true } },
  },
  params: [
    {
      key: '_Channel',
      label: '매트캡 채널',
      type: 'select',
      default: '0',
      options: [
        { value: '0', label: '점토 (R)' },
        { value: '1', label: '툰 (G)' },
        { value: '2', label: '크롬 (B)' },
      ],
      hint: '텍스처의 어느 채널에 그려 둔 공을 읽을지. 점토는 부드러운 음영, 툰은 3단 음영, 크롬은 하늘과 땅이 비친 금속',
    },
    { key: '_BaseColor', label: '바탕색', type: 'color', default: '#d99978', hint: '곱하기에서는 물체의 고유색, 더하기에서는 매트캡 아래 깔리는 색' },
    { key: '_MatcapColor', label: '매트캡 색', type: 'color', default: '#ffffff', hint: '매트캡 값에 곱하는 틴트. 더하기 합성에서 빛의 색처럼 보인다' },
    {
      key: '_Combine',
      label: '합성 방식',
      type: 'select',
      default: '0',
      options: [
        { value: '0', label: '곱하기' },
        { value: '1', label: '더하기' },
      ],
      hint: '곱하기는 매트캡을 음영으로 써서 바탕색보다 밝아지지 않는다. 더하기는 매트캡을 빛처럼 얹어 어두운 바탕 위에서 빛난다. 더하기에서는 매트캡 색을 어둡게 낮춰야 하얗게 날아가지 않는다 (옥 프리셋)',
    },
    { key: '_Perspective', label: '원근 보정', type: 'toggle', default: true, hint: '픽셀마다 시선 방향으로 축을 다시 세운다. 구에서는 크롬의 수평선 띠가 조금 움직이는 정도지만, 큐브에서 끄면 면마다 한 색으로 납작해진다' },
    { key: '_RimColor', label: '테두리 색', type: 'color', default: '#b8ffd8', hint: '테두리 세기가 0 보다 클 때만 보인다' },
    { key: '_RimIntensity', label: '테두리 세기', type: 'range', min: 0, max: 3, step: 0.05, default: 0, hint: '윤곽에 더하는 프레넬 빛. 옥처럼 속에서 빛이 비치는 느낌을 낸다' },
    { key: '_RimPulse', label: '테두리 더하기', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '테두리 세기에 더해지는 값. 자동 데모가 4초에 한 번 천천히 올렸다 내린다. 게임에서는 선택한 물체를 잠깐 표시할 때 스크립트로 올렸다 내린다' },
  ],
  presets: [
    { id: 'clay', name: '점토', look: '왼쪽 위에서 빛을 받은 부드러운 테라코타 점토', values: {} },
    { id: 'chrome-metal', name: '크롬 금속', look: '위는 하늘, 아래는 땅이 비친 반짝이는 금속', values: { _Channel: '2', _BaseColor: '#e8ecf2' } },
    { id: 'toon', name: '툰', look: '밝음, 중간, 그늘 세 단으로 끊긴 만화 음영', values: { _Channel: '1', _BaseColor: '#6fb6e8' } },
    { id: 'jade', name: '옥', look: '짙은 초록 바탕에 빛을 더하고 윤곽이 은은히 비치는 돌', values: { _Combine: '1', _BaseColor: '#0c3324', _MatcapColor: '#3c8a64', _RimIntensity: 1.2 } },
  ],
  events: [],
  demo: {
    // 테두리를 4초 주기(0.25Hz)로 은은히 올렸다 내린다. 밝기 변화가 윤곽에만 있어 번쩍임이 아니다.
    loops: [{ key: '_RimPulse', frames: [[0, 0], [2, 0.6], [4, 0]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: '화면 기준 법선', body: '월드 법선을 카메라의 오른쪽 축과 위 축에 내적한 값 xy 를 빨강(화면 오른쪽을 향한 정도)과 초록(화면 위를 향한 정도)으로 칠했다. 구는 왼쪽이 초록, 오른쪽이 주황, 아래가 빨강, 가운데가 노랑이고, 물체가 돌아도 이 배치가 화면에 그대로 붙어 있다. 큐브로 바꾸면 화면 오른쪽으로 돌아가는 면은 주황, 왼쪽으로 돌아가는 면은 초록으로 바뀐다.' },
    { n: 2, label: '매트캡 한 채널', body: '그 xy 를 `xy * 0.49 + 0.5` 로 텍스처 좌표로 바꿔 공 그림을 읽었다. 빛을 그려 둔 공을 화면 쪽에서 그대로 덮어씌운 셈이라 밝은 곳이 늘 왼쪽 위에 있다. 빛 계산이 없으므로 해를 돌려도 이 그림은 바뀌지 않는다. 해 방향을 따라 음영이 움직이는 [램프 툰 조명](#/s/toon-ramp-lit)과 가장 다른 점이다. 최종 화면에서는 이 값에 매트캡 색을 곱하고 바탕색과 곱하거나 더한다.' },
    { n: 3, label: '원근 보정 차이', body: '원근 보정을 켰을 때와 껐을 때 좌표 차이를 5배로 키워 밝기로 보였다. 카메라 정면을 지나는 화면 가운데 한 점만 검고, 거기서 멀어질수록 밝아진다. 구에서는 크롬의 수평선 띠가 조금 움직이는 정도지만, 큐브처럼 평평한 면은 보정이 없으면 면 하나가 매트캡의 한 점만 읽어 한 색으로 납작해진다.' },
  ],
  offNote: '카메라 축 대신 오브젝트 공간 법선(`normalOS.xy`)으로 읽은 흔한 실수. 처음에는 그럴듯하지만, 무대가 Y 축으로 돌면 구워진 빛이 카메라 쪽에 머물지 않고 물체에 붙어 함께 돈다. 몇 초 지나면 밝은 곳이 왼쪽 위에서 오른쪽 가장자리로 넘어가 빛이 반대편에서 오는 것처럼 보인다.',
  mistakes: [
    { title: '물체가 돌면 밝은 곳이 함께 돈다', body: '오브젝트 공간 법선 xy 를 그대로 좌표로 쓰면 매트캡이 물체 표면에 붙는다. 월드 법선(`TransformObjectToWorldNormal`)을 카메라의 오른쪽 축 `UNITY_MATRIX_V[0].xyz`, 위 축 `UNITY_MATRIX_V[1].xyz` 에 내적해 화면 기준으로 바꾼다.' },
    { title: '카메라가 물체 주위를 돌면 반사가 화면에 고정되지 않는다', body: '월드 법선의 xy 를 그대로 쓰면 카메라가 고정된 장면에서는 그럴듯해 보이지만, 카메라가 옆이나 위로 돌아가면 빛이 월드에 붙어 버린다. 매트캡은 늘 카메라 기준이어야 하므로 카메라 축에 내적한다.' },
    { title: '윤곽에 검은 테나 엉뚱한 색 테가 생긴다', body: '세 가지 원인이 있다. (1) Wrap Mode 가 Repeat 이면 윤곽에서 반대편 가장자리 텍셀이 섞인다. Clamp 로 둔다. (2) 매트캡 그림의 원판 바깥이 검정이면 Bilinear 가 그 검정을 섞는다. 원판 밖을 가장자리 색으로 늘여 칠한다. (3) `xy * 0.5 + 0.5` 를 그대로 쓰면 윤곽이 원판 끝 텍셀을 읽는다. 0.49 처럼 조금 줄여 원판 안만 읽는다.' },
    { title: '부드러운 그라데이션에 줄무늬나 얼룩이 진다', body: '텍스처 압축(BC, ASTC) 때문이다. 매트캡은 매끈한 음영이 전부라 압축 블록이 그대로 보인다. 텍스처 Inspector 에서 Compression 을 None 으로 둔다. 채널마다 다른 그림을 담았으므로 sRGB (Color Texture) 도 끈다.' },
    { title: '큐브의 면 하나가 통째로 한 색이거나 화면 가장자리에서 빛이 어긋난다', body: '평평한 면은 법선이 하나라 카메라 축만 쓰면 면 전체가 매트캡의 한 점을 읽는다. 원근 보정을 켜면 픽셀마다 시선 방향으로 축을 다시 세워 같은 면 안에서도 좌표가 조금씩 달라지고, 화면 가장자리에 있는 물체도 가운데에서 본 것처럼 칠해진다.' },
  ],
  unity: {
    setup: [
      '`MatcapLitSphere.shader`, `core.hlsl`, `MatcapSpheres.png` 를 `Assets/Shaders/matcap-lit-sphere/` 에 둔다.',
      'Project 창에서 `MatcapSpheres.png` 를 고르고 Inspector 에서 Texture Type 은 Default, sRGB (Color Texture) 는 끄고, Wrap Mode 는 Clamp, Filter Mode 는 Bilinear, Compression 은 None 으로 맞춘 뒤 Apply 를 누른다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고, 매트캡 칸에 `MatcapSpheres.png` 를 넣는다.',
      '머티리얼을 대상 MeshRenderer 에 넣는다. 매트캡 채널을 Clay, Toon, Chrome 으로 바꾸고 바탕색과 합성 방식으로 재질을 맞춘다.',
      '옥처럼 속에서 비치는 느낌은 합성 방식을 Add 로, 바탕색을 어둡게 두고 테두리 세기를 1 정도로 올린다.',
    ],
    verify: '물체를 돌리거나 Directional Light 를 돌려도 밝은 곳이 화면 왼쪽 위에 머문다. 매트캡 채널을 바꾸면 점토, 툰, 크롬으로 바뀌고, 큐브에 넣고 원근 보정을 끄면 면마다 한 색이 된다.',
    pitfalls: [
      '이 셰이더는 불투명 3D 메시용이다. 패스가 `UniversalForwardOnly` 라 2D Renderer 에서는 그려지지 않는다. 빛을 계산하지 않는 Unlit 패스라 Directional Light 를 돌려도 음영이 그대로이고(정상, 조명이 그림에 구워져 있다) 다른 물체의 그림자를 받지 않는다. 그림자를 드리우기는 한다. 안개(Fog)도 처리하지 않는다.',
      '매트캡 텍스처는 sRGB 끔, Wrap Mode Clamp, Compression None 이어야 한다. 기본값(sRGB 켬, Repeat, 압축)으로 두면 음영이 어두워지고 윤곽에 테가 생기며 그라데이션에 줄무늬가 진다.',
      '노멀맵을 쓰려면 탄젠트 공간 노멀을 TBN(탄젠트, 바이탄젠트, 법선)으로 월드 법선으로 바꾼 뒤 같은 식(카메라 축에 내적)에 넣는다. 탄젠트 공간 노멀 xy 를 바로 쓰면 오브젝트 공간 실수와 같이 빛이 표면에 붙는다.',
      '직교(Orthographic) 카메라는 모든 픽셀의 시선이 같아 원근 보정이 필요 없고, 켜도 결과가 같다.',
      'XR 에서는 `UNITY_MATRIX_V` 가 눈마다 달라 래퍼가 눈마다 축을 넘긴다. 원근 보정을 켜면 눈마다 시선 방향도 달라 반사가 두 눈에서 조금 다르게 보인다 (실기기 미확인). 어색하면 원근 보정을 끈다.',
    ],
    graph: 'Shader Graph 에서는 Custom Function 없이 만든다. Normal Vector 노드의 Space 를 View 로 두면 카메라 축에 내적한 화면 기준 법선이 나온다. Split 으로 R, G 를 꺼내 Vector 2 로 묶고 Multiply 0.49, Add 0.5 를 거쳐 Sample Texture 2D 의 UV 에 넣는다. 원근 보정은 이 식에 들어 있지 않다. Unity 의 Shader Graph Feature Examples 샘플에 같은 그래프("Mat Cap")가 있다.',
  },
  prompt: {
    goal: '빛을 그린 공 텍스처(매트캡) 한 장을 화면 기준 법선으로 읽어, 라이트 계산 없이 3D 물체에 점토, 크롬, 툰 같은 입체감과 재질을 입히는 Unlit 셰이더를 넣는다.',
    adaptIdeas: [
      '마스크 텍스처로 갑옷이나 무기 같은 금속 부위에만 크롬 매트캡을 얹고 나머지는 원래 색으로 두고 싶다.',
      '장소(동굴, 사막, 밤)마다 다른 매트캡을 넣어 같은 캐릭터가 분위기에 맞게 보이게 하고 싶다.',
      '카메라가 옆으로 기울어도(롤) 반사가 같이 돌지 않게, 카메라 위 축 대신 월드 위 축으로 기저를 세우고 싶다.',
      '직접 그리거나 받은 컬러 매트캡 한 장(sRGB)을 그대로 쓰고 싶다.',
      '이미 쓰는 Unlit 툰 캐릭터 셰이더에 매트캡 하이라이트만 더하기로 얹고 싶다.',
    ],
  },
  captures: [
    { name: 'chrome', label: '크롬 금속', values: { _Channel: '2', _BaseColor: '#e8ecf2' } },
    { name: 'toon', label: '툰', values: { _Channel: '1', _BaseColor: '#6fb6e8' } },
    { name: 'jade', label: '옥', values: { _Combine: '1', _BaseColor: '#0c3324', _MatcapColor: '#3c8a64', _RimIntensity: 1.2 } },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 매트캡 세 장(점토, 툰, 크롬)은 코드로 새로 그려 한 텍스처의 R·G·B 채널에 담았고, 픽셀별 시선으로 축을 다시 세우는 원근 보정과 프레넬 테두리를 더했다. 코드는 이 갤러리에서 새로 작성했다.',
  references: [
    { label: 'Sloan 외: The Lit Sphere (Graphics Interface 2001)', url: 'https://graphicsinterface.org/proceedings/gi2001/gi2001-17' },
    { label: 'Shader Graph Feature Examples (Mat Cap)', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Feature-Examples.html' },
    { label: 'Unity Toon Shader 문서: MatCap', url: 'https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/MatCap.html' },
    { label: 'VRM MToon 1.0 규격 (matcapTexture)', url: 'https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_materials_mtoon-1.0/README.md' },
  ],
  related: [
    { id: 'toon-ramp-lit', why: '빛 방향을 따라 음영이 움직이는 툰. 해를 돌리면 바뀌는 쪽과 그대로인 매트캡을 비교한다' },
    { id: 'fresnel-rim-glow', why: '같은 시선·법선 내적으로 윤곽을 밝힌다. 옥 프리셋의 테두리가 이 식이다' },
  ],
}
