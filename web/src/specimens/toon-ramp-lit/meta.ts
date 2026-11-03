import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'toon-ramp-lit',
  title: '램프 툰 조명',
  titleEn: 'Toon Ramp Lit',
  group: 'A',
  order: 1,
  oneLiner: '빛의 밝기를 단계로 끊어 만화풍 음영을 만든다',
  goals: [
    '`dot(N, L)` 을 몇 개의 띠로 끊어 매끈한 음영을 평평한 단계로 바꿀 수 있다.',
    '`smoothstep` 폭으로 띠 경계의 부드러움을 조절하고, `step` 만 쓰면 경계가 깨지는 이유를 설명할 수 있다.',
    '그늘을 검정 대신 색조로 바꾸고, 조명이 끝난 색을 끊으면 그늘이 검게 떨어지고 색이 깨지는 이유를 설명할 수 있다.',
    '받는 그림자를 띠로 끊기 전에 곱해 같은 단계로 보이게 할 수 있다.',
  ],
  tags: ['툰 셰이딩', '램프', '램버트', '받는 그림자', 'smoothstep'],
  difficulty: 2,
  shaderFile: 'ToonRampLit.shader',
  // 받는 그림자가 띠로 끊기는 모습을 보이려고 해 앞에 작은 공을 띄운다
  stage: { kind: 'mesh', mesh: 'sphere', blend: 'cutout', shadowProp: true },
  params: [
    { key: '_Bands', label: '띠 수', type: 'range', min: 2, max: 5, step: 1, default: 3, hint: '음영 단계의 수. 2 면 빛과 그늘 두 가지뿐이다' },
    { key: '_Softness', label: '경계 부드러움', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.06, hint: '띠 하나 폭에 대한 비율. 0 이면 칼 같은 경계, 0.5 면 띠가 녹아 매끈한 그라데이션에 가까워진다' },
    { key: '_ShadeShift', label: '그늘 넓이', type: 'range', min: -0.25, max: 0.6, step: 0.01, default: 0, hint: '올리면 경계가 빛 쪽으로 밀려 그늘이 넓어지고, 내리면 경계가 명암선 쪽으로 내려가 빛 면이 넓어진다' },
    { key: '_ShadeColor', label: '그늘 색', type: 'color', default: '#9a88d8', hint: '기본 색에 곱하는 색. 검정에 가까울수록 탁해지고, 채도가 있으면 그늘의 색조가 바뀐다' },
    { key: '_BaseColor', label: '기본 색', type: 'color', default: '#f2b48c', hint: '빛을 받는 가장 밝은 띠의 색' },
  ],
  presets: [
    { id: 'three-tone', name: '세 단계 셀 음영', look: '복숭아빛 공에 연보라 그늘, 사이에 가운데 띠 하나', values: {} },
    { id: 'two-tone', name: '두 단계 애니메이션 음영', look: '빛과 그늘 두 가지뿐인 날카로운 경계, 빨간 공에 자줏빛 그늘', values: { _Bands: 2, _Softness: 0.02, _ShadeShift: 0.1, _BaseColor: '#e8584a', _ShadeColor: '#8a6ad0' } },
    { id: 'storybook', name: '부드러운 그림책', look: '네 단계가 번지듯 이어지고, 경계가 명암선 쪽으로 내려가 빛 면이 넓다', values: { _Bands: 4, _Softness: 0.22, _ShadeShift: -0.2, _BaseColor: '#a8d88a', _ShadeColor: '#5a78c0' } },
    { id: 'moonlit', name: '차가운 달밤', look: '넓고 짙은 남색 그늘 위에 좁은 빛 띠', values: { _Bands: 2, _Softness: 0.08, _ShadeShift: 0.35, _BaseColor: '#dce4f4', _ShadeColor: '#3c4690' } },
  ],
  events: [],
  demo: {
    // 그늘 넓이를 오가며 띠 경계가 구 위를 쓸고 지나가게 한다. 빛이 움직이는 것처럼 보인다.
    loops: [{ key: '_ShadeShift', frames: [[0, 0], [2.6, 0.45], [3.4, 0.45], [6.6, -0.25], [7.4, -0.25], [10, 0]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: 'dot(N, L)', body: '법선과 빛 방향의 내적이다. 빛을 정면으로 받는 오른쪽 위가 가장 희다. 화면에서는 공 대부분이 흰색에 가깝게 보이고, 왼쪽 아래 빛과 직각인 곳에 가까워져서야 빠르게 어두워진다. 그 너머 뒤쪽은 값이 0 아래라 검게 잘린다. 일반 조명은 이 매끈한 값을 그대로 쓴다.' },
    { n: 2, label: '띠로 끊기', body: '같은 값을 `_Bands` 개(기본 3)의 띠로 끊었다. 매끈하던 밝기가 흰색, 밝은 회색, 검정의 평평한 층이 된다. 경계는 `smoothstep` 으로 띠 폭의 `_Softness` 만큼만 짧게 이어진다. 위에 띄운 작은 공처럼 다른 물체가 드리운 그림자도 끊기 전에 곱해지므로, 공 그림자는 매끈한 회색 얼룩이 아니라 맨 아래 띠(검정)로 떨어지고, 반그림자 가장자리에만 가운데 띠가 얇게 둘린다. 띠 수 슬라이더를 움직이면 층의 수가 바뀐다.' },
    { n: 3, label: '그늘 색 입히기', body: '띠 값으로 그늘 색과 흰색 사이를 고른다. 검정이던 띠가 보라가 되고, 가운데 띠는 흰색과 보라의 중간인 연보라다. 이 색을 기본 색에 곱하므로 그늘은 검게 어두워지는 대신 색조가 바뀐다. 최종 화면에서 복숭아빛 공의 그늘이 흙빛 갈색이 아니라 자줏빛으로 남는 이유다. 환경광은 더하지 않았으므로 그늘의 밝기와 색은 `_BaseColor × _ShadeColor` 가 정한다. 기본 색을 바꾸면 그늘도 함께 바뀐다.' },
  ],
  offNote: '조명이 끝난 최종 색(`_BaseColor.rgb * i.lighting`)을 채널마다 띠로 끊은 흔한 실수. Lit 결과에 Posterize 를 거는 것과 같다. 그늘 쪽 아래는 채널 값이 모두 첫 경계보다 낮아 새까맣게 떨어진다. 빛 쪽은 R, G, B 가 따로 끊겨 새빨간 띠, 주황빛 노랑 띠, 분홍빛 흰 점이 생기고, 복숭아빛 기본 색은 어디에도 남지 않는다. 그늘 색을 거치지 않으므로 그늘 색 슬라이더를 움직여도 아무것도 바뀌지 않는다.',
  mistakes: [
    { title: '그늘이 검게 탁해진다', body: '띠 값을 기본 색에 그대로 곱하면 그늘이 검정 쪽으로만 어두워져 흙빛이 된다. 그늘 색을 따로 두고 `lerp(그늘 색, 빛 색, 띠 값)` 을 기본 색에 곱한다. 그늘 색은 회색보다 채도가 있는 보라, 파랑, 분홍 쪽이 만화 같다.' },
    { title: '띠 경계가 계단처럼 깨지고 움직일 때 반짝인다', body: '`step(경계, 밝기)` 로 끊으면 경계가 픽셀 단위로 0 과 1 만 오가서 지그재그가 보이고, 물체나 카메라가 움직이면 경계 픽셀이 반짝인다. `smoothstep(경계 - w, 경계 + w, 밝기)` 로 끊고, `w` 가 `fwidth` 보다 작아지지 않게 하면 가장 날카롭게 해도 1~2 픽셀은 이어진다.' },
    { title: '그늘이 새까맣게 떨어지고 빛 쪽 색이 엉뚱한 덩어리로 깨진다', body: 'Lit 셰이더의 결과나 `albedo * lighting` 처럼 조명이 끝난 색에 Posterize 를 걸면 R, G, B 가 채널마다 따로 띠로 끊긴다. 그늘 쪽은 채널 값이 첫 경계보다 낮아 검정이 되고, 빛 쪽은 채널마다 다른 단계에 걸려 기본 색에 없던 빨강, 주황 같은 색 덩어리가 된다. 그늘 색을 넣을 자리가 없고, 빛 세기와 환경광이 경계 위치에 섞여 조명을 바꿀 때마다 띠가 움직인다. 띠는 밝기 하나(`dot(N, L)`)로 정하고, 그 띠 값으로 `lerp(그늘 색, 빛 색, 띠 값)` 을 골라 기본 색에 곱한다. 환경광이 필요하면 띠로 끊은 뒤 따로 더한다.' },
    { title: '다른 물체의 그림자가 띠와 따로 부드러운 회색으로 보인다', body: '띠로 끊은 색에 `shadowAttenuation` 을 나중에 곱하면 그림자만 매끈한 회색 얼룩이 된다. 그림자 감쇠는 **끊기 전에** `dot(N, L)` 에 곱한다. 이 표본은 래퍼가 넘기는 `lightColor`(빛 색 × 감쇠)의 가장 큰 채널을 감쇠로 쓴다. 그림자가 아예 안 생기면 Forward 패스에 `_MAIN_LIGHT_SHADOWS` 계열 `multi_compile` 이 있는지 본다.' },
    { title: '램프 텍스처로 바꿨더니 끝에 엉뚱한 색 줄이 생기거나 띠가 번진다', body: '수식 대신 가로 그라데이션 PNG(왼쪽이 그늘, 오른쪽이 빛)를 쓰려면 래퍼의 `Properties` 에 `_RampTex ("램프", 2D) = "white" {}` 를 더하고 `CBUFFER` 밖에 `TEXTURE2D(_RampTex); SAMPLER(sampler_RampTex);` 를 선언한다. 그다음 `core.hlsl` 의 `lerp(_ShadeColor.rgb, lightHue, band)` 를 `SAMPLE_TEXTURE2D(_RampTex, sampler_RampTex, float2(level, 0.5)).rgb` 로 바꾼다. 이 래퍼에는 `SG_TEX` 가 정의되어 있지 않으므로 `SG_TEX` 로 쓰면 컴파일되지 않는다. 띠 수, 경계, 그늘 색은 이제 텍스처에 그린 대로 정해진다. 텍스처의 Wrap Mode 를 Clamp 로 두지 않으면 밝기 0 과 1 에서 반대쪽 끝 색이 섞여 가장자리에 줄이 생긴다. Filter Mode 를 Point 로 두면 텍스처 칸 경계가 `step` 과 같은 계단 경계가 되어 지그재그와 반짝임이 돌아온다. Bilinear 로 두고, 띠가 바뀌는 곳에 몇 픽셀 폭의 짧은 그라데이션을 그려 경계를 정한다. Generate Mip Maps 는 끄고, 색을 그린 램프는 sRGB 를 켜 둔다.' },
  ],
  unity: {
    setup: [
      '`ToonRampLit.shader`, `core.hlsl` 을 `Assets/Shaders/toon-ramp-lit/` 에 둔다.',
      'Project 창에서 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      '머티리얼을 대상 MeshRenderer 에 넣는다. Inspector 에서 띠 수, 경계 부드러움, 그늘 색을 움직여 확인한다.',
      '받는 그림자를 보려면 Directional Light 의 Shadow Type 을 Soft Shadows 또는 Hard Shadows 로 두고, 사용하는 URP Asset 의 Lighting > Main Light 에서 Cast Shadows 를 켠다. 같은 Directional Light 의 Mode 는 Realtime 또는 Mixed, Intensity 는 1 이상으로 둔다.',
    ],
    verify: '띠 수를 2 에서 5 로 올리면 물체 위의 평평한 음영 단계가 늘고 그늘 색을 바꾸면 그늘이 검게 어두워지는 대신 그 색조로 바뀌며, 다른 물체를 빛 앞에 두면 드리운 그림자도 부드러운 회색이 아니라 같은 그늘 띠로 딱 끊긴다.',
    pitfalls: [
      '이 셰이더는 불투명 3D 메시용이다. 패스가 `UniversalForwardOnly` 라 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트에서 쓴다.',
      '주 광원(가장 밝은 Directional Light) 하나만 띠로 받는다. 점 광원과 스포트라이트 같은 추가 광원은 무시한다. 필요하면 `GetAdditionalLight` 를 돌며 같은 방법으로 띠를 더한다. 모바일 XR 에서는 추가 광원마다 비용이 늘어난다.',
      '받는 그림자는 `lightColor` 의 가장 큰 채널(빛 색의 가장 큰 채널 × Intensity × 감쇠)로 읽는다. 래퍼가 빛 색, 거리 감쇠, 그림자 감쇠를 곱해 한 값으로 넘기므로 정확히 나눌 수 없다. 빛 색의 가장 큰 채널 × Intensity 가 1 보다 작으면 그림자 밖에서도 띠가 그늘 쪽으로 밀린다. 1 보다 크면 감쇠가 그 값의 역수보다 큰 옅은 그림자(Shadow Strength 를 낮춘 그림자, 부드러운 그림자의 바깥 가장자리, Max Distance 근처에서 사라져 가는 그림자)는 그림자 밖과 똑같이 보인다. 정확히 하려면 래퍼에서 `light.shadowAttenuation` 을 따로 넘긴다.',
      '주 광원의 Mode 가 Baked 이거나 물체의 레이어가 광원의 Culling Mask 에서 빠지면 실시간 빛이 0 으로 들어와 물체 전체가 그늘 색이 된다. 광원을 Realtime 또는 Mixed 로 두고 Culling Mask 를 확인한다.',
      '그림자를 띠로 끊으면 자기 그림자 여드름(shadow acne)이 흐려지지 않고 또렷한 줄무늬로 보인다. 경계 근처에 줄이 생기면 Directional Light 의 Depth Bias 와 Normal Bias 를 조금 올린다. 그늘 넓이의 최소값을 -0.25 로 둔 것도 자기 그림자 때문이다. 더 내려 띠 경계가 명암선(`dot(N, L)` = 0) 너머로 가면 물체가 자기 뒤쪽에 드리운 그림자가 그 띠를 잘라 낸다.',
      '띠 경계는 법선을 그대로 따라간다. 로우폴리나 각진 메시는 면마다 띠가 통째로 바뀌고, 캐릭터 얼굴은 법선이 조금만 달라도 큰 그늘 얼룩이 생긴다. 모델링 툴에서 법선을 다듬거나 부드러운 법선을 쓴다.',
    ],
    graph: 'Shader Graph 패키지의 Custom Lighting 샘플(Package Manager > Shader Graph > Samples)에 셀 셰이딩 예가 있다. 직접 만들 때는 Main Light Direction 노드와 World 공간 Normal Vector 의 Dot Product 를 구하고, `toonBands` 를 새 `.hlsl` 파일에 복사하고 안에서 읽는 `_Bands`, `_Softness` 를 인자로 바꿔 `void ToonBands_float(float Level, float Bands, float Softness, out float Out)` 로 감싸 Custom Function 노드의 File 모드로 부르거나, 그 값을 U 로 램프 텍스처를 읽는다 (`core.hlsl` 을 File 모드로 통째로 지정하면 `SgInput` 과 머티리얼 값 선언이 없어 컴파일되지 않는다). 받는 그림자는 노드만으로 얻기 어려워 `void MainLightShadow_float(float3 PositionWS, out float Shadow)` 함수에서 `#ifdef SHADERGRAPH_PREVIEW` 이면 1, 아니면 `GetMainLight(TransformWorldToShadowCoord(PositionWS), PositionWS, half4(1, 1, 1, 1)).shadowAttenuation` 을 받는다. 이때 Blackboard 에 `_MAIN_LIGHT_SHADOWS`, `_MAIN_LIGHT_SHADOWS_CASCADE`, `_SHADOWS_SOFT` 를 Boolean Keyword(Multi Compile, Global)로 더해야 한다. 없으면 그림자 맵을 읽지 않아 감쇠가 항상 1 이다.',
  },
  prompt: {
    goal: '3D 물체에 빛의 밝기를 몇 개의 띠로 끊은 만화풍 음영을 넣는다. 그늘은 검게 어두워지지 않고 지정한 색조로 바뀌며, 다른 물체가 드리운 그림자도 같은 띠로 끊겨 보인다.',
    adaptIdeas: [
      '수식 대신 직접 그린 램프 텍스처(가로 그라데이션 PNG)로 띠 색을 정하고 싶다.',
      '캐릭터의 알베도 텍스처에 툰 음영을 입히고 싶다.',
      '빛을 정면으로 받는 곳에 좁고 날카로운 하이라이트 띠를 하나 더 얹고 싶다.',
      '점 광원과 스포트라이트 같은 추가 광원도 같은 띠로 받고 싶다.',
      '그늘 쪽 윤곽에 림 빛을 더해 실루엣을 떼어 내고 싶다.',
    ],
  },
  captures: [
    { name: 'two-tone', label: '두 단계, 날카로운 경계', values: { _Bands: 2, _Softness: 0.02 } },
    { name: 'soft', label: '네 단계, 부드러운 경계', values: { _Bands: 4, _Softness: 0.3 } },
  ],
  inspiredBy: [
    {
      title: 'Guilty Gear Xrd -SIGN- (2014)',
      credit: 'Arc System Works',
      borrowed: ['빛과 그늘 두 단계 음영', '법선이 정하는 그늘 경계'],
      learned: '음영이 켜짐과 꺼짐 둘뿐이면 법선이 조금만 달라도 큰 그늘 얼룩이 생긴다. GDC 2015 강연은 이 설계 제약을 직접 다룬다. 이 표본의 `두 단계 애니메이션 음영` 프리셋과 법선 관련 주의 사항이 여기서 왔다.',
      link: 'https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The',
    },
  ],
  original: '원작의 셰이더나 에셋을 옮긴 것이 아니라 램프 툰 조명의 원리만 빌렸다. 램프 텍스처 대신 띠 수와 경계 부드러움을 수식으로 계산하고, 그늘 색, 그늘 넓이, 받는 그림자의 띠 처리를 더했다. 수업 3D 14 Animation 의 `SimpleUnlitToon`(조명을 받지 않는 툰과 외곽선)의 확장편으로, 실제 주 광원 방향과 그림자를 받는다. 코드는 이 갤러리에서 새로 작성했다.',
  references: [
    { label: 'GDC 2015 강연: 3D 격투 게임의 셀 셰이딩 아트 스타일', url: 'https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The' },
    { label: 'Unity 6 셰이더·VFX 전자책 (URP)', url: 'https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6' },
    { label: 'Shader Graph 샘플 (Custom Lighting 포함)', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/ShaderGraph-Samples.html' },
  ],
  related: [
    { id: 'fresnel-rim-glow', why: '툰 음영 위에 림 빛을 더하면 그늘 쪽 실루엣이 떠오른다' },
    { id: 'inverted-hull-outline', why: '툰 음영과 함께 쓰는 외곽선' },
  ],
}
