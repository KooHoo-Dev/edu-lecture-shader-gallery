import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'dissolve-edge-glow',
  title: '디졸브',
  titleEn: 'Dissolve Edge Glow',
  group: 'B',
  order: 1,
  oneLiner: '노이즈와 임계값으로 물체를 태워 없앤다. 사망, 소환, 텔레포트 연출의 기본',
  goals: [
    '노이즈 값과 임계값을 비교해 픽셀을 지우는 원리를 설명할 수 있다.',
    '`smoothstep` 으로 임계값 근처의 띠만 골라 발광시킬 수 있다.',
    '그림자 패스에서도 같은 값으로 잘라야 하는 이유를 설명할 수 있다.',
    'C# 에서 `_Threshold` 를 올려 사망 연출에 연결할 수 있다.',
  ],
  tags: ['노이즈', '임계값', '알파 클립', '자체 발광'],
  difficulty: 2,
  shaderFile: 'DissolveEdgeGlow.shader',
  stage: { kind: 'mesh', mesh: 'sphere', blend: 'cutout' },
  params: [
    { key: '_Threshold', label: '임계값', type: 'range', min: 0, max: 1, step: 0.01, default: 0.42, hint: '진행 정도. C# 에서 0 에서 1 로 올리면 사라진다' },
    { key: '_NoiseScale', label: '노이즈 크기', type: 'range', min: 1, max: 20, step: 0.5, default: 7, hint: '작을수록 큰 덩어리로 사라진다' },
    { key: '_Sweep', label: '위에서 쓸기', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '높이를 섞어 위쪽부터 사라지게 한다' },
    { key: '_EdgeWidth', label: '가장자리 폭', type: 'range', min: 0.005, max: 0.25, step: 0.005, default: 0.07, hint: '빛나는 띠의 두께' },
    { key: '_EdgeColor', label: '가장자리 색', type: 'color', default: '#ff5c14' },
    { key: '_EdgeGlow', label: '가장자리 밝기', type: 'range', min: 0, max: 12, step: 0.1, default: 2.5, hint: '1 보다 크면 HDR 값이라 URP 블룸을 켜면 번진다' },
    { key: '_BaseColor', label: '기본 색', type: 'color', default: '#9eadc2' },
  ],
  presets: [
    { id: 'burn', name: '불에 타는 소멸', look: '주황 띠가 불규칙하게 먹어 들어간다', values: {} },
    { id: 'freeze', name: '얼어붙어 부서짐', look: '좁고 차가운 띠, 잔 조각', values: { _EdgeColor: '#7fd4ff', _EdgeWidth: 0.025, _NoiseScale: 16, _EdgeGlow: 3 } },
    { id: 'summon', name: '위에서 내려오는 소환', look: '넓은 보라 띠가 위에서 아래로 쓸고 간다', values: { _EdgeColor: '#b566ff', _EdgeWidth: 0.16, _NoiseScale: 5, _Sweep: 0.75, _EdgeGlow: 7, _Threshold: 0.5 } },
  ],
  events: [
    {
      id: 'burn',
      label: '한 번 태우기',
      tracks: [{ key: '_Threshold', frames: [[0, 0], [1.4, 1], [1.8, 1], [2.4, 0]], ease: 'inOutSine' }],
    },
  ],
  demo: {
    loops: [{ key: '_Threshold', frames: [[0, 0.02], [2.6, 0.98], [3.2, 0.98], [5.8, 0.02], [6.4, 0.02]], ease: 'inOutSine' }],
  },
  steps: [
    { n: 1, label: '노이즈', body: '표면의 위치마다 0~1 값을 하나 정한다. 이 값이 그 자리가 사라지는 차례다. UV 대신 오브젝트 공간 위치를 쓰면 메시 이음매에서 끊기지 않는다.' },
    { n: 2, label: '임계값', body: '노이즈가 `_Threshold` 보다 작으면 0, 크면 1 이다. `clip` 이 0 인 픽셀을 버린다. 슬라이더를 움직이면 흰 영역이 줄어든다.' },
    { n: 3, label: '가장자리', body: '`smoothstep` 으로 임계값 바로 위 좁은 띠만 남긴다. `_EdgeWidth` 가 띠의 폭이다.' },
  ],
  offNote: '가장자리 발광을 뺀 모습. 구멍이 뚫리기만 해서 타들어 간다는 느낌이 없다. 그림자 패스도 자르지 않은 실수를 함께 보여 준다. 물체가 사라져도 바닥에 온전한 그림자가 남는다.',
  mistakes: [
    { title: '그림자가 그대로 남는다', body: '`ShadowCaster` 패스에서 자르지 않으면 물체가 사라져도 온전한 그림자가 남는다. 이 표본은 세 보조 패스 모두 같은 `sgEffect` 알파로 자른다.' },
    { title: '임계값 양 끝이 안 움직인다', body: '값 노이즈는 0.5 근처에 몰려 있어 슬라이더의 양 끝이 죽는다. `saturate((n - 0.2) / 0.6)` 처럼 범위를 넓혀야 전 구간이 고르게 변한다.' },
    { title: 'UV 이음매에서 끊긴다', body: 'UV 로 노이즈를 만들면 구의 뒷면과 극점, 모델의 UV 경계에서 무늬가 끊긴다. 오브젝트 공간 위치를 쓰면 스키닝이 없는 메시에서는 이음매가 없다.' },
    { title: '여러 적이 함께 사라진다', body: '`sharedMaterial` 의 값을 바꾸면 같은 머티리얼을 쓰는 모든 적이 사라진다. `renderer.material` 로 복사본을 만들고 파괴할 때 함께 지운다.' },
  ],
  unity: {
    setup: [
      '`DissolveEdgeGlow.shader`, `core.hlsl`, `DissolveController.cs` 를 `Assets/Shaders/dissolve-edge-glow/` 에 둔다.',
      'Project 창에서 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      '머티리얼을 대상 MeshRenderer 에 넣는다. Inspector 에서 임계값을 움직여 확인한다.',
      '연출에 쓸 때는 물체에 `DissolveController` 를 붙이고 사망 판정 때 `DissolveOut()` 을 호출한다.',
    ],
    verify: '머티리얼의 임계값을 0 에서 1 로 올리면 주황 띠와 함께 구멍이 커지다 물체가 사라지고, 그림자에도 같은 구멍이 뚫린다.',
    pitfalls: [
      '스키닝 캐릭터는 애니메이션이 적용된 뒤의 위치가 셰이더로 들어온다. 움직이는 동안에는 구멍 무늬가 몸 위를 흐른다. 1~2초 연출에서는 잘 보이지 않는다. 무늬를 몸에 붙이려면 UV 로 노이즈를 만들거나 바인드 포즈 위치를 보조 UV 채널에 굽는다.',
      '위에서 쓸기는 오브젝트 공간 y 가 -0.5~0.5 인 메시 기준이다. 피벗이 발밑이거나 키가 다른 메시는 `core.hlsl` 의 `saturate(0.5 - i.positionOS.y)` 를 메시 높이에 맞춰 고친다.',
      '빛나는 띠가 번지게 하려면 URP Volume 의 Bloom 을 켠다. 값이 1 을 넘어도 Bloom 이 없으면 흰색으로 잘릴 뿐이다.',
      '메시 스케일이 크면 노이즈 무늬도 함께 커진다. `_NoiseScale` 을 스케일에 맞춰 조절한다.',
    ],
    graph: 'Shader Graph 에서는 Custom Function 노드를 File 모드로 두고 `core.hlsl` 을 지정한 뒤 `dissolveNoise` 를 호출하는 함수를 추가해 노이즈만 가져온다. 그래프의 Alpha Clip Threshold 에 임계값을, Emission 에 띠 색을 연결한다.',
  },
  prompt: {
    goal: '물체가 노이즈 모양으로 타들어 가며 사라지는 디졸브 셰이더를 넣는다. 가장자리가 빛나고 그림자에도 구멍이 뚫린다.',
    adaptIdeas: [
      '가장자리 색을 체력에 따라 바꾸고 싶다.',
      '디졸브가 발밑에서 위로 올라오게 하고 싶다.',
      '스프라이트에도 같은 효과를 쓰고 싶다.',
      '사라진 자리에 파티클이 나오게 C# 코드를 추가하고 싶다.',
    ],
  },
  captures: [
    { name: 'early', label: '시작 직후', values: { _Threshold: 0.2 } },
    { name: 'late', label: '거의 사라짐', values: { _Threshold: 0.72 } },
  ],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 노이즈 함수와 코드는 이 갤러리에서 새로 작성했다.',
  references: [
    { label: 'Unity 6 셰이더·VFX 전자책 (URP)', url: 'https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6' },
    { label: 'Game Developer: Dissolve 튜토리얼', url: 'https://gamedeveloper.com/design/unity-shader-graph-quick-tutorial---dissolve-shader' },
  ],
  related: [{ id: 'force-field-intersection', why: '자체 발광 띠를 깊이 비교로 만드는 짝' }],
}
