import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'fresnel-rim-glow',
  title: '프레넬 림 빛',
  titleEn: 'Fresnel Rim Glow',
  group: 'A',
  order: 2,
  oneLiner: '비스듬히 보이는 가장자리만 밝힌다',
  goals: [
    '법선과 시선의 내적 `dot(N, V)` 가 정면과 윤곽에서 어떤 값이 되는지 설명할 수 있다.',
    '`pow(1 - saturate(dot(N, V)), 지수)` 로 림의 폭을 조절할 수 있다.',
    '두 벡터를 같은 공간에서, 정규화해서 써야 하는 이유를 설명할 수 있다.',
    'C# 에서 `_HitFlash` 를 올려 피격이나 선택 순간에 림을 번쩍이게 할 수 있다.',
  ],
  tags: ['프레넬', '시선 벡터', '림 라이트', '자체 발광', '게임 필'],
  difficulty: 1,
  shaderFile: 'FresnelRimGlow.shader',
  stage: { kind: 'mesh', mesh: 'sphere', blend: 'cutout' },
  flashes: true,
  params: [
    { key: '_RimColor', label: '림 색', type: 'color', default: '#38c8ff' },
    { key: '_RimIntensity', label: '림 세기', type: 'range', min: 0, max: 6, step: 0.05, default: 1.5, hint: '림 색에 곱하는 밝기. 1 보다 크면 HDR 값이라 URP 블룸을 켜면 번진다' },
    { key: '_RimPower', label: '림 지수', type: 'range', min: 0.5, max: 10, step: 0.1, default: 3, hint: '클수록 림이 윤곽 쪽으로 얇아진다. 1 아래면 몸 전체가 은은히 빛난다' },
    { key: '_BaseColor', label: '기본 색', type: 'color', default: '#2b3342', hint: '조명을 받는 표면 색. 어두울수록 림이 도드라진다. 밝게 하면 림이 표면에 묻힌다' },
    { key: '_HitFlash', label: '번쩍임 강도', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: 'C# 에서 피격 순간 1 로 올렸다 내린다. 림이 넓어지고 밝아진다' },
    { key: '_FlashColor', label: '번쩍임 색', type: 'color', default: '#ffffff', hint: '번쩍임 강도가 0 보다 클 때만 보인다' },
  ],
  presets: [
    { id: 'rim-light', name: '림 라이트', look: '어두운 표면 둘레에 파란 윤곽 빛', values: {} },
    { id: 'interact-highlight', name: '잡을 수 있는 물체 표시', look: '넓고 따뜻한 노란 테두리로 상호작용 대상을 알린다', values: { _RimColor: '#ffc94d', _RimPower: 1.6, _RimIntensity: 1.1, _BaseColor: '#7a6f63' } },
    { id: 'backlight', name: '역광 윤곽', look: '아주 얇고 밝은 흰 선으로 실루엣만 떼어 낸다', values: { _RimColor: '#fff1d6', _RimPower: 7, _RimIntensity: 3.5, _BaseColor: '#3d4352' } },
    { id: 'spirit', name: '영체', look: '어두운 몸 전체에 초록빛이 번져 떠 있는 느낌', values: { _RimColor: '#5dffa8', _RimPower: 0.9, _RimIntensity: 1.4, _BaseColor: '#1f2a2a' } },
  ],
  events: [
    {
      id: 'hit',
      label: '피격',
      tracks: [{ key: '_HitFlash', frames: [[0, 1], [0.08, 1], [0.4, 0]], ease: 'linear' }],
    },
  ],
  demo: {
    // 림 지수를 넓게(1.2) 갔다 얇게(6) 오가며 림 폭 변화를 보여 주고, 사이사이 피격 번쩍임을 넣는다.
    loops: [{ key: '_RimPower', frames: [[0, 3], [1.8, 1.2], [2.6, 1.2], [4.6, 6], [5.4, 6], [7.2, 3]], ease: 'inOutSine' }],
    fire: [{ event: 'hit', every: 3.6 }],
  },
  steps: [
    { n: 1, label: 'dot(N, V)', body: '법선과 카메라 쪽 방향의 내적이다. 정면을 보는 가운데가 1 로 가장 밝고, 가장자리로 갈수록 어두워진다. 값은 윤곽 바로 앞에서야 0 쪽으로 빠르게 떨어지므로 몸 대부분은 밝게 보인다. 구의 모양이 이 값 하나에 다 들어 있다.' },
    { n: 2, label: '뒤집기', body: '`1 - dot(N, V)` 로 뒤집으면 윤곽이 흰색이 된다. 이대로는 몸의 절반 가까이가 회색이라 림이라기보다 흐릿한 막이다.' },
    { n: 3, label: '지수로 좁히기', body: '0~1 값을 거듭제곱하면 1 근처만 남고 나머지는 0 으로 빠르게 떨어진다. `_RimPower` 를 올리면 흰 테두리가 얇아진다.' },
    { n: 4, label: '조명에 더하기', body: '기본 색에 조명을 곱한 표면 위에 림 색을 **더한다**. 조명과 곱하지 않으므로 빛이 안 닿는 그늘 쪽 윤곽에서도 림이 남는다. 피격 버튼을 누르면 림이 몸 안쪽까지 넓어진다.' },
  ],
  offNote: '시선 벡터를 정규화하지 않은 흔한 실수. 카메라 위치에서 표면 위치를 뺀 벡터는 길이가 수 미터라 내적이 거의 다 1 을 넘어 잘린다. 림이 윤곽의 가는 선으로 줄어들고 지수 슬라이더도 거의 듣지 않는다. 카메라가 가까워지거나 멀어지면 두께가 또 바뀐다.',
  mistakes: [
    { title: '림이 실처럼 가늘거나 거의 안 보인다', body: '카메라 위치 - 표면 위치를 `normalize` 하지 않으면 길이가 카메라 거리만큼이라 내적이 1 을 넘어 잘린다. URP 에서는 `GetWorldSpaceNormalizeViewDir(positionWS)` 를 쓰면 정규화된 값이 나온다. 보간된 법선도 프래그먼트에서 다시 `normalize` 한다.' },
    { title: '물체가 돌면 림이 한쪽으로 쏠린다', body: '오브젝트 공간 법선(`normalOS`)과 월드 공간 시선을 섞어 쓰면 물체가 회전할 때 림이 표면에 붙어 함께 돈다. 법선을 `TransformObjectToWorldNormal` 로 월드 공간으로 바꾼 뒤 내적한다.' },
    { title: '그늘 쪽에서 림이 사라진다', body: '림을 더한 뒤 조명을 곱하면 빛이 안 닿는 쪽 윤곽이 까매진다. 림 라이트는 보통 그늘에서 실루엣을 떼어 내려고 쓴다. `기본 색 × 조명` 을 먼저 구하고 림은 그 위에 더한다.' },
    { title: '에너지막처럼 가운데를 비우려 했는데 반투명이 되지 않는다', body: '이 셰이더는 불투명용이라 알파만 바꿔서는 반투명이 되지 않는다. 다섯 곳을 함께 고친다. (1) `core.hlsl` 마지막 `return` 의 알파 `1.0` 을 림 값 `saturate(strength * rim)` 으로 바꾼다. (2) `.shader` 의 Forward 패스에서 `clip(c.a - 0.5);` 를 지우고 `return float4(c.rgb, 1.0);` 를 `return c;` 로 바꾼다. 남겨 두면 가운데가 반투명이 아니라 딱 잘린 구멍이 되거나 그대로 불투명하다. (3) Forward 패스의 `Tags` 줄 아래에 `Blend SrcAlpha OneMinusSrcAlpha`(빛을 더하는 느낌이면 `Blend SrcAlpha One`)와 `ZWrite Off` 를 넣는다. `ZWrite` 를 켜 두면 뒤에 있는 다른 투명 물체가 가려진다. (4) `SubShader` 의 `Tags` 에서 `"Queue"` 를 `"Transparent"`, `"RenderType"` 을 `"Transparent"` 로 바꾼다. (5) `ShadowCaster` 패스를 지운다. 남기면 바닥에 꽉 찬 그림자가 생긴다. `DepthOnly`, `DepthNormals` 패스도 투명 물체에는 쓰이지 않으므로 함께 지워 Forward 패스 하나만 남긴다.' },
  ],
  unity: {
    setup: [
      '`FresnelRimGlow.shader`, `core.hlsl`, `RimHitFlash.cs` 를 `Assets/Shaders/fresnel-rim-glow/` 에 둔다.',
      'Project 창에서 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      '머티리얼을 대상 MeshRenderer 에 넣는다. Inspector 에서 림 지수와 림 세기를 움직여 확인한다.',
      '피격 연출에 쓸 때는 같은 오브젝트에 `RimHitFlash` 를 붙이고 피격 판정 때 `Flash()` 를 호출한다. 인자가 없어 Inspector 의 UnityEvent(예: XR Simple Interactable 의 Select Entered)에 바로 연결할 수 있다.',
    ],
    verify: '림 지수를 올리면 윤곽의 빛이 얇아지고 낮추면 몸 안쪽까지 번진다. 물체나 카메라를 돌려도 림은 항상 화면에서 본 윤곽에 붙어 있다.',
    pitfalls: [
      '이 셰이더는 불투명 3D 메시용이다. 패스가 `UniversalForwardOnly` 라 2D Renderer 에서는 그려지지 않는다. 3D 프로젝트에서 쓴다.',
      'XR 에서는 두 눈의 카메라 위치가 다르다. 이 셰이더는 안에서 `GetWorldSpaceNormalizeViewDir` 로 눈마다 시선을 계산하므로 양쪽 림이 맞는다. 시선을 바꾸려고 C# 에서 `Camera.main.transform.position` 같은 카메라 위치 하나를 전역 값으로 넘겨 쓰면 두 눈이 같은 위치를 쓰게 되어 양쪽 림이 어긋난다. 시선은 셰이더 안에서 구한다.',
      '평평한 면만 있는 메시(큐브, 로우폴리)는 면 안에서 법선이 같아 림이 면 단위로 통째로 켜지고 꺼진다. 부드러운 법선을 가진 메시에서 잘 보인다.',
      '림 세기가 1 을 넘어도 URP Volume 의 Bloom 이 없으면 색이 하얗게 잘릴 뿐 번지지 않는다.',
      '번쩍일 때 림이 몸 전체로 넓어진다. 연타나 연속 피격에서 넓은 면이 빠르게 깜빡이면 광과민 발작 위험이 있다. `RimHitFlash` 는 `minInterval`(0.34초)로 게임 배속과 상관없이 실제 시간 기준 초당 3회를 넘지 않게 막는다. 이 값을 0.34 아래로 낮추지 않는다.',
    ],
    graph: 'Shader Graph 에는 같은 식의 Fresnel Effect 노드가 있다. Power 에 림 지수를 넣고 결과에 림 색과 세기를 곱해 Lit 타깃의 Emission 에 연결하면 된다. Custom Function 이 필요 없다.',
  },
  prompt: {
    goal: '3D 물체의 비스듬히 보이는 가장자리를 밝히는 프레넬 림 셰이더를 넣는다. 조명을 받는 표면 위에 림 빛을 더하고, 피격 순간에는 C# 로 림을 잠깐 넓고 밝게 번쩍인다.',
    adaptIdeas: [
      '에너지막처럼 가운데는 투명하고 윤곽만 빛나게 바꾸고 싶다.',
      'XR 에서 손이 다가가면(Hover) 림이 서서히 켜지고, 잡으면(Select) 번쩍이게 하고 싶다.',
      '체력이 줄수록 림 색이 파랑에서 빨강으로 바뀌게 하고 싶다.',
      '림이 숨 쉬듯 천천히 밝아졌다 어두워지게 하고 싶다. 1초에 2번을 넘지 않게.',
      '텍스처가 있는 캐릭터 머티리얼에 림만 덧붙이고 싶다.',
    ],
  },
  captures: [
    { name: 'hit', label: '피격 순간', values: { _HitFlash: 0.8 } },
    { name: 'wide', label: '넓은 림', values: { _RimPower: 1.2 } },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 수업 XR 프로젝트의 XRI Starter Assets 에 들어 있는 `Unlit_Fresnel` 과 같은 원리를, 조명을 받는 불투명 표면과 피격 번쩍임으로 넓혔다. 코드는 이 갤러리에서 새로 작성했다.',
  references: [
    { label: 'Shader Graph 문서: Fresnel Effect 노드', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.0/manual/Fresnel-Effect-Node.html' },
    { label: 'Unity 6 셰이더·VFX 전자책 (URP)', url: 'https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6' },
  ],
  related: [
    { id: 'force-field-intersection', why: '같은 프레넬을 투명한 에너지막에 쓰고 깊이 교차선을 더한 예' },
    { id: 'sprite-outline-hit-flash', why: '2D 스프라이트에서 같은 피격 번쩍임을 만드는 짝' },
  ],
}
