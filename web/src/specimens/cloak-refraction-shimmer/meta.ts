import type { SpecimenMeta } from '../../core/types'

const SCOUT = { _Refraction: 0.025, _RimStrength: 0.2 }
const ALLY = { _MaxCloak: 0.85, _RimStrength: 1.3, _RimPower: 2.2 }
const SHIMMER = { _Refraction: 0.12, _ShimmerSpeed: 2.4, _NoiseScale: 9 }
const FULL_STEALTH = { _RimStrength: 0, _Refraction: 0.03 }

export const meta: SpecimenMeta = {
  id: 'cloak-refraction-shimmer',
  title: '클로킹 투명화',
  titleEn: 'Cloak Refraction Shimmer',
  group: 'B',
  order: 4,
  oneLiner: '뒤 장면을 휘어 비추고 윤곽만 남겨 몸을 감춘다',
  goals: [
    'Opaque Texture 를 법선으로 민 화면 좌표로 읽어 몸 대신 뒤 장면을 그리고, 앞 물체가 끌려 들어오지 않게 깊이로 거를 수 있다.',
    '진행값 하나로 높이·노이즈·프레넬 마스크 위의 경계 띠를 훑어 은신을 켜고 끌 수 있다.',
    '프레넬 테두리와 최대 은신 값으로 "보이지 않지만 알아볼 수 있는" 정도를 게임 규칙에 맞출 수 있다.',
    'C# 으로 여러 Renderer 의 머티리얼을 함께 움직이고, 은신 중 그림자를 끄고 피격 노출을 제한기로 거는 이유를 설명할 수 있다.',
  ],
  tags: ['씬 컬러', '화면 좌표 왜곡', '프레넬', '노이즈', '진행값 마스크'],
  difficulty: 3,
  shaderFile: 'CloakRefractionShimmer.shader',
  stage: { kind: 'depth', mesh: 'capsule', blend: 'alpha' },
  requires: ['opaque', 'depth'],
  params: [
    { key: '_Cloak', label: '은신', type: 'range', min: 0, max: 1, step: 0.01, default: 0.55, hint: '0 은 보이는 몸, 1 은 완전 은신. 경계 띠가 이 값을 따라 몸 위를 훑는다. 자동 데모와 C# `CloakController.SetCloaked` 가 이 값을 움직인다. 머티리얼 기본값 0.55 는 미리보기용이고 C# 은 0 에서 시작한다' },
    { key: '_MaxCloak', label: '최대 은신', type: 'range', min: 0, max: 1, step: 0.01, default: 1, hint: '은신이 끝났을 때 뒤 장면을 얼마나 비출지. 1 이면 몸 색이 남지 않고, 0.85 면 끝까지 몸이 흐릿하게 비친다. 같은 편 화면에만 낮춰 쓰는 값이다' },
    { key: '_Reveal', label: '피격 노출', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '평소에는 0 이다. 피격 노출 버튼과 C# `RevealOnHit()` 가 잠깐 1 로 올렸다 0 으로 되돌린다. 셰이더가 섞는 은신 양에서 이 값의 0.6 배를 빼므로, 은신을 얼마로 두었든 숨은 몸이 반쯤 비쳐 드러났다 다시 숨는다. 경계 띠는 움직이지 않는다' },
    {
      key: '_MaskMode',
      label: '마스크 방식',
      type: 'select',
      options: [
        { value: '0', label: '높이 훑기' },
        { value: '1', label: '노이즈 디졸브' },
        { value: '2', label: '프레넬 안쪽부터' },
      ],
      default: '0',
      hint: '어디부터 사라질지. 높이 훑기는 발에서 머리로 띠가 올라가고, 노이즈 디졸브는 얼룩처럼 군데군데 사라지며, 프레넬 안쪽부터는 정면이 먼저 사라지고 윤곽이 끝까지 남는다',
    },
    { key: '_BodyBottom', showWhen: { key: '_MaskMode', values: ['0'] }, label: '몸 아래 끝', type: 'range', min: -2, max: 2, step: 0.05, default: -1, hint: '높이 훑기가 시작하는 오브젝트 공간 y. 기본 캡슐은 가운데가 피벗이라 -1 이다. 발에 피벗이 있는 캐릭터는 0 으로 둔다. 높이 훑기에서만 쓴다' },
    { key: '_BodyHeight', showWhen: { key: '_MaskMode', values: ['0'] }, label: '몸 높이', type: 'range', min: 0.5, max: 4, step: 0.05, default: 2, hint: '발에서 머리까지 오브젝트 공간 길이. 실제보다 작으면 은신이 끝나기 전에 띠가 머리를 지나가 버리고, 크면 끝까지 머리가 남는다. 높이 훑기에서만 쓴다' },
    { key: '_Refraction', label: '굴절 세기', type: 'range', min: 0, max: 0.15, step: 0.005, default: 0.05, hint: '뒤 장면을 미는 양(화면 높이 단위). 0 이면 뒤가 곧게 비쳐 테두리만 남고, 크면 몸 모양대로 뒤가 크게 일그러져 움직일 때 눈에 띈다' },
    { key: '_CalmAtFull', label: '완전 은신 때 굴절 줄이기', type: 'toggle', default: true, hint: '은신이 끝나 갈수록 미는 양을 0.3 배까지 줄인다. 전환 중에는 일렁여 눈에 띄고 다 숨으면 거의 보이지 않는다. 끄면 다 숨어도 굴절 세기 그대로 일렁인다' },
    { key: '_ShimmerSpeed', label: '일렁임 속도', type: 'range', min: 0, max: 3, step: 0.05, default: 0.8, hint: '굴절에 더하는 노이즈가 위로 흐르는 빠르기. 0 이면 몸에 붙은 채 멈춘 결이 된다' },
    { key: '_NoiseScale', label: '노이즈 크기', type: 'range', min: 1, max: 20, step: 0.5, default: 6, hint: '일렁임 결, 높이 경계의 흔들림, 노이즈 디졸브 얼룩의 촘촘함. 작으면 크게 굽이치고 크면 잘게 부서진다' },
    { key: '_RimColor', label: '테두리 색', type: 'color', default: '#9fd8ff', hint: '은신한 만큼 윤곽에 더하는 색. 팀 색으로 바꿔 쓸 수 있다' },
    { key: '_RimStrength', label: '테두리 세기', type: 'range', min: 0, max: 2, step: 0.01, default: 0.5, hint: '0 이면 윤곽이 없어 다 숨은 몸을 찾을 수 없다. 클수록 은신한 몸의 실루엣이 또렷하다' },
    { key: '_RimPower', label: '테두리 날카로움', type: 'range', min: 0.5, max: 8, step: 0.1, default: 3, hint: '클수록 테두리가 윤곽의 가는 선으로 좁아지고, 작으면 몸 안쪽까지 번진다' },
    { key: '_BandColor', label: '경계 띠 색', type: 'color', default: '#7fd4ff', hint: '보이는 곳과 숨은 곳 사이를 지나가는 띠의 색' },
    { key: '_BandWidth', label: '경계 띠 폭', type: 'range', min: 0.01, max: 0.3, step: 0.01, default: 0.08, hint: '띠의 두께(마스크 값 기준). 넓히면 전환이 부드럽고 띠가 굵어진다' },
    { key: '_BandGlow', label: '경계 띠 밝기', type: 'range', min: 0, max: 3, step: 0.05, default: 1, hint: '띠 색에 곱하는 밝기. 0 이면 어두운 띠가 된다. 넓은 몸을 띠가 훑을 때 번쩍이지 않게 기본은 낮게 두었다' },
    { key: '_BaseColor', label: '몸 색', type: 'color', default: '#8a96a3', hint: '보이는 상태의 몸 색. 주 광원과 환경광으로 음영한다' },
  ],
  presets: [
    { id: 'default', name: '기본 위장', look: '발부터 숨은 아래쪽이 뒤 장면을 조금 휘어 비추고, 위쪽은 회색 몸이 남는다', values: {} },
    { id: 'scout-camo', name: '정찰 위장', look: '굴절이 작고 테두리가 옅어 숨은 쪽이 배경과 거의 구분되지 않는다', values: SCOUT },
    { id: 'ally-visible', name: '아군에게 보이는 위장', look: '숨은 쪽에도 몸이 흐릿하게 비치고 윤곽이 밝게 남는다', values: ALLY },
    { id: 'shimmer-body', name: '일렁이는 투명 몸', look: '뒤 장면이 몸 모양대로 크게 일그러지고 잔결이 빠르게 흘러 오른다', values: SHIMMER },
    { id: 'full-stealth', name: '완전 은신', look: '테두리가 없고 굴절이 작아 숨은 쪽이 거의 사라진다. 기본 위장과 번갈아 보면 테두리를 남기는 이유가 보인다', values: FULL_STEALTH },
  ],
  events: [
    {
      id: 'reveal',
      label: '피격 노출',
      // CloakController.RevealOnHit() 와 같다. 0.1초 동안 _Reveal 을 1 로 올리고 0.3초 동안 0 으로 내린다.
      tracks: [{ key: '_Reveal', frames: [[0, 0], [0.1, 1], [0.4, 0]] }],
    },
  ],
  demo: {
    // 숨은 채 시작해 드러나고(1.2초), 잠시 보인 뒤 다시 숨는다(1.2초). 숨어 있는 첫머리에 피격 노출이 한 번 터진다.
    loops: [{ key: '_Cloak', frames: [[0, 1], [1.4, 1], [2.6, 0], [4.0, 0], [5.2, 1], [6.0, 1]], ease: 'inOutSine' }],
    fire: [{ event: 'reveal', every: 6 }],
  },
  steps: [
    { n: 1, label: '화면 공간 오프셋', body: '월드 법선을 카메라의 오른쪽, 위 축에 내린 값(반대 방향)에 흐르는 노이즈를 더한 미는 방향이다. 빨강이 가로, 초록이 세로로 미는 양이다. 캡슐 가운데는 노이즈 얼룩이 섞인 연한 파스텔색이고, 왼쪽 가장자리는 분홍(오른쪽으로 민다), 오른쪽은 청록(왼쪽으로 민다), 위 둥근 끝은 자홍(아래로 민다)으로 짙어진다. 가장자리마다 가운데 쪽을 가리켜 몸 뒤 장면을 조금 키워 보인다. 재생하면 얼룩이 천천히 위로 흐른다. 이 방향에 굴절 세기를 곱해 씬 색상을 읽는 자리를 옮긴다.' },
    { n: 2, label: '은신 마스크와 경계 띠', body: '픽셀마다 언제 사라질지 정한 값과 진행값을 비교한 결과다. 검정은 아직 보이는 몸, 회색은 숨은 곳, 흰 띠가 그 사이를 지나가는 경계다. 높이 훑기에서는 발(바닥 아래)부터 숨어 지금은 아래쪽 절반이 회색이고, 노이즈로 흔든 흰 띠가 가운데를 구불구불 가로지른다. 은신 값을 올리면 띠가 머리 쪽으로 올라간다. 마스크 방식을 프레넬 안쪽부터로 바꾸면 가운데부터 회색이 되고 흰 띠가 윤곽 쪽으로 퍼져 나간다.' },
    { n: 3, label: '가드를 거친 휜 배경', body: '밀린 좌표로 Opaque Texture 를 읽은 결과다. 몸 전체가 뒤의 바닥 격자와 상자로 채워지고, 격자 줄이 몸 모양과 노이즈 결을 따라 물결친다. 위쪽은 검은 하늘뿐이라 휘어도 티가 나지 않는다. 가장자리는 가운데 쪽 장면을 끌어와 읽으므로 공의 오른쪽 일부가 몸 가장자리에서 끊기고 바닥으로 바뀐다. 밀린 자리가 몸보다 앞에 있는 물체면 밀지 않은 좌표로 돌아가 앞 물체가 몸 속으로 끌려 들어오지 않는다. 아직 몸 색, 테두리, 띠가 없다.' },
    { n: 4, label: '프레넬 테두리', body: '가운데는 어둡고 시선과 비스듬한 윤곽으로 갈수록 밝다. 은신한 만큼만 이 테두리를 얹어, 다 숨은 몸도 윤곽으로는 알아볼 수 있게 한다. 최종 화면에서는 아직 보이는 위쪽 몸에는 테두리가 없고, 숨은 아래쪽 윤곽에만 남는다.' },
  ],
  offNote: '굴절과 테두리 없이 몸 색의 알파만 `1 - 은신` 으로 낮춘 페이드. 중간에는 회색 몸과 휘지 않은 뒤 장면이 반씩 겹쳐 비쳐 반투명 유령처럼 보이고, 은신이 끝나면 테두리도 일렁임도 없이 실루엣까지 통째로 사라져 어디 있는지 알 길이 없다. 실제 캐릭터에서는 깊이를 쓰지 않는 알파 혼합이라 중간에 몸 뒷면과 겹친 팔다리까지 함께 비친다.',
  mistakes: [
    { title: '망토 속에서 뒤의 연기, 파티클, 물, 유리가 사라진다', body: 'Opaque Texture 는 불투명 범위(Render Queue 2500 이하)까지 그린 뒤 복사한 것이라 투명 물체가 들어 있지 않다. 은신한 몸은 그 복사본을 알파 1 로 덮어 그리므로, 몸보다 먼저 그려진 뒤쪽 투명 물체는 몸 모양대로 지워진다. 몸보다 늦게 그려지는 뒤쪽 투명 물체는 이 셰이더가 깊이를 써 두었으므로 가려진다. 꼭 비쳐야 하는 물체는 불투명이나 잘라 내기 머티리얼로 바꾼다.' },
    { title: '앞에 있는 물체가 몸 속으로 끌려 들어온다', body: 'Opaque Texture 는 앞뒤를 가리지 않고 화면 전체를 담는다. 밀린 좌표가 몸 앞 물체에 닿으면 그 색을 읽는다. 이 셰이더는 이 픽셀의 눈 깊이(`sgSceneDepth(i.screenUV) - i.depthDelta`)와 밀린 좌표의 깊이를 비교해 앞이면 밀지 않은 좌표로 돌아간다. 그래도 끌려 들어오면 URP Asset 의 Depth Texture 가 켜져 있는지 본다. 꺼져 있으면 깊이를 읽지 못해 이 가드가 동작하지 않는다.' },
    { title: '은신한 몸이 회색이나 검은 판으로 보인다', body: 'URP Asset 의 Opaque Texture 가 꺼져 있으면 씬 색상이 비어 있다. 품질 단계마다 URP Asset 이 따로 있으면 모두 켜고, 카메라 Inspector 의 Rendering > Opaque Texture 가 Off 이면 Use Pipeline Settings 로 바꾼다. 머티리얼의 Render Queue 를 2500 이하로 바꾸면 복사되기 전에 그려지므로 From Shader(Transparent)로 둔다.' },
    { title: '팔이 몸통 앞을 지나는데 팔 속에 몸통이 아니라 뒤 배경이 비친다', body: '몸은 자기 자신을 비추지 못한다. Opaque Texture 는 불투명 장면만 담고 은신한 몸은 그 안에 없으므로, 팔이 휘어 보여 주는 것은 몸통 너머의 배경이다. 이 셰이더는 깊이 패스(`CloakDepth`)로 가장 앞면만 남겨 몸통이 팔 위에 칠해지지는 않게 했다. 팔과 몸통이 겹친 자리의 굴절이 어색하면 굴절 세기를 낮춰 눈에 덜 띄게 한다.' },
    { title: '몸은 사라졌는데 바닥에 그림자가 걸어 다닌다', body: '이 셰이더는 보이는 상태의 몸을 위해 `ShadowCaster` 패스를 둔다. 은신 값만 올리면 그림자는 그대로다. `CloakController` 는 은신이 절반을 넘으면 Renderer 의 Cast Shadows 를 Off 로 바꾸고, 내려오면 원래 값으로 돌린다. 스크립트 없이 머티리얼 값만 바꿀 때는 Mesh Renderer(Skinned Mesh Renderer)의 Lighting > Cast Shadows 를 직접 끈다.' },
  ],
  unity: {
    setup: [
      '`CloakRefractionShimmer.shader`, `core.hlsl`, `CloakController.cs` 를 `Assets/Shaders/cloak-refraction-shimmer/` 에 둔다.',
      '사용 중인 URP Asset(Project Settings > Quality 에 연결된 것)의 Rendering 에서 Opaque Texture 와 Depth Texture 를 켠다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고, 캐릭터의 모든 Mesh Renderer, Skinned Mesh Renderer 의 Materials 칸에 넣는다. 머티리얼의 은신 값은 0 으로 낮춰 둔다 (기본 0.55 는 미리보기용이다).',
      '높이 훑기를 쓰면 몸 아래 끝과 몸 높이를 모델의 오브젝트 공간에 맞춘다. 발에 피벗이 있는 키 1.8 인 캐릭터는 0 과 1.8 이다. Skinned Mesh Renderer 는 오브젝트 공간이 모델에 따라 다를 수 있으므로, Scene 뷰에서 은신 값을 움직여 띠가 발에서 시작해 머리에서 끝나는지 본다.',
      '캐릭터 루트에 `CloakController` 를 붙인다. 은신 스킬의 UnityEvent 에 `SetCloaked(bool)` 를, 피격 이벤트에 `RevealOnHit()` 를 연결한다. 시작할 때 모든 Renderer 의 머티리얼 복사본을 만들어 은신 0 으로 둔다.',
      '캐릭터를 상자, 바닥 같은 불투명 물체 앞에 두고 Game 뷰에서 Play 해 본다.',
    ],
    verify: '은신 값을 0 에서 1 로 올리면 밝은 띠가 발에서 머리로 올라가며 지나간 자리에 뒤의 바닥과 물체가 몸 모양대로 조금 휘어 비치고 윤곽에 하늘색 테두리가 남는다. `RevealOnHit()` 를 부르면 숨은 몸이 0.4 초쯤 반쯤 비쳐 드러났다 다시 숨고, `SetCloaked(true)` 뒤 절반을 넘으면 바닥 그림자가 사라진다.',
    pitfalls: [
      'URP Asset 이 품질 단계마다 따로 있으면 모두 Opaque Texture 와 Depth Texture 를 켠다. Depth Texture 가 꺼지면 앞 물체 가드가 동작하지 않는다. 모바일은 Opaque Downsampling 을 2x Bilinear 이상으로 두면 복사 비용이 줄지만 몸 속 장면이 흐려져 은신한 몸이 오히려 눈에 띌 수 있다.',
      '투명 큐에 있는 캐릭터는 Depth Texture 에도 들어가지 않는다 (불투명 뒤에 복사된다). SSAO, 물가 거품, 역장처럼 깊이를 읽는 다른 효과가 캐릭터를 무시하므로, 평소에는 불투명 머티리얼을 쓰고 은신할 때만 이 머티리얼로 바꾸는 방법을 권한다.',
      '2D Renderer 는 Opaque Texture 를 만들지 않고 `UniversalForward` 패스도 그리지 않는다 (깊이 패스 `SRPDefaultUnlit` 만 그려져 아무것도 보이지 않는다). 3D 프로젝트(Universal Renderer)용 효과다.',
      'XR 에서는 Opaque Texture 가 눈마다 한 장씩인 배열이라 복사 비용이 두 배이고, 단독형(untethered) 기기에서는 Opaque Texture 를 끄라는 권고가 있다. 이 효과의 XR 동작은 실기기에서 확인하지 않았다.',
      '주 광원의 distanceAttenuation 을 곱하지 않으므로 광원의 Culling Mask 와 Rendering Layers 가 무시되고, 받는 그림자와 안개도 처리하지 않는다. 마스크와 일렁임은 오브젝트 공간 위치로 읽으므로 Batching Static 으로 정적 배칭된 물체는 무늬와 높이 훑기가 월드 기준으로 바뀐다. 캐릭터는 Static 에서 뺀다.',
      '접근성: 경계 띠가 넓은 몸을 훑으므로 밝기를 낮게(기본 1) 둔다. 띠를 2 이상으로 밝히거나 여러 캐릭터가 동시에 전환하면 화면에서 넓게 번쩍일 수 있으니 게임 옵션으로 띠를 끌 수 있게 한다.',
    ],
    graph: 'Shader Graph 에서는 Graph Settings 의 Surface Type 을 Transparent 로 둔다. Normal Vector 노드(View 공간)의 xy 를 Negate 해 굴절 세기를 곱하고 Gradient Noise 를 더해 오프셋을 만든다. Screen Position 노드(Default)에 Add 해 Scene Color 노드에 넣는다 (화면비는 x 에 Screen 노드의 Height / Width 를 곱한다). 앞 물체 가드는 밀린 좌표로 읽은 Scene Depth 노드(Eye)가 Screen Position 노드(Raw)의 w 보다 작으면 Comparison 과 Branch 로 밀지 않은 좌표를 고른다. 마스크는 Position 노드(Object)의 y 를 Remap 한 값(또는 Fresnel Effect 노드의 반대)과 은신 값의 차이를 Smoothstep 해 만들고, Lerp 로 몸 색과 Scene Color 를 섞은 뒤 Fresnel Effect 로 테두리를 더한다. Shader Graph 에는 가장 앞면만 남기는 깊이 패스가 없으므로 Graph Settings 의 Depth Write 를 Force Enabled 로 둔다.',
  },
  prompt: {
    goal: '캐릭터 몸 대신 뒤 장면을 조금 휘어 그리고 윤곽만 남겨 감추는 은신 셰이더와, 은신 켜고 끄기와 피격 노출을 거는 C# 스크립트를 넣는다. Opaque Texture 와 Depth Texture 를 읽으므로 URP Asset 설정이 함께 필요하다.',
    adaptIdeas: [
      '평소에는 URP Lit 같은 불투명 머티리얼을 쓰다가 은신을 시작할 때만 이 머티리얼로 바꾸고 다 드러나면 되돌려, 깊이를 읽는 다른 효과에서 캐릭터가 빠지지 않게 하고 싶다.',
      '같은 편 화면에서는 최대 은신을 0.85 로, 상대 편 화면에서는 1 로 두고 테두리 색을 팀 색으로 바꾸고 싶다.',
      '은신 중 달리거나 공격하면 이동 속도에 따라 은신 값이 잠깐 내려가 몸이 흐릿하게 드러나게 하고 싶다.',
      '은신한 몸 위로 홀로그램처럼 옅은 가로 줄이 천천히 지나가게 하고 싶다.',
      '은신 전환 때 경계 띠를 따라 작은 파티클이 흩날리게 하고 싶다.',
    ],
  },
  captures: [
    { name: 'cloaked', label: '완전히 숨은 몸 (테두리 남김)', values: { _Cloak: 1 } },
    { name: 'full-stealth', label: '완전 은신 (테두리 없음)', values: { ...FULL_STEALTH, _Cloak: 1 } },
    { name: 'fresnel-inward', label: '프레넬 안쪽부터 사라지는 중', values: { _MaskMode: '2', _Cloak: 0.45 } },
  ],
  inspiredBy: [
    {
      title: 'Team Fortress 2 (2007)',
      credit: 'Valve',
      borrowed: ['프레넬로 정면부터 사라지고 윤곽이 남는 은신 마스크', '같은 편에게는 최대 투명도를 제한'],
      learned: 'Valve 가 공개한 Source SDK 2013 의 클로크 패스 픽셀 셰이더는 프레임 버퍼 복사본을 화면 공간 법선만큼 밀어 읽고, `1 - N·V` 프레넬로 은신 마스크를 만들며, 은신이 끝날수록 미는 양을 줄인다. 같은 저장소의 클라이언트 코드는 은신 비율을 머티리얼 프록시로 넣고 색조를 팀 색으로 바꾼다. 이 표본의 프레넬 안쪽부터 마스크, 완전 은신 때 굴절 줄이기, 최대 은신 값이 이 구조에서 왔다. 셰이더 코드와 화면은 옮기지 않았고 게임 화면은 직접 확인하지 못했다.',
      link: 'https://raw.githubusercontent.com/ValveSoftware/source-sdk-2013/master/src/materialsystem/stdshaders/cloak_blended_pass_ps2x.fxc',
    },
  ],
  original: '특정 게임의 재현이 아니라 여러 엔진이 기본 셰이더 기능으로 넣어 온 은신 기법을 이 갤러리에서 새로 작성했다. 갤러리의 `screen-refraction-glass`(씬 색상 굴절과 앞 물체 가드), `fresnel-rim-glow`(테두리), `dissolve-edge-glow`(경계 띠 훑기)를 진행값 하나로 묶은 응용편이다. 높이 훑기와 노이즈 디졸브 마스크, 피격 노출 이벤트, 가장 앞면만 남기는 깊이 패스, 여러 Renderer 를 함께 움직이고 그림자를 끄는 C# 은 새로 더했다. 수업 3D 07 External Assets 의 FORGE3D `HeatDepthFixed` 가 같은 원리(씬 컬러 왜곡)를 에셋으로 쓴다.',
  references: [
    { label: 'Valve: Source SDK 클로크 패스 픽셀 셰이더', url: 'https://raw.githubusercontent.com/ValveSoftware/source-sdk-2013/master/src/materialsystem/stdshaders/cloak_blended_pass_ps2x.fxc' },
    { label: 'Valve: Source SDK VertexLitGeneric 의 클로크 파라미터', url: 'https://raw.githubusercontent.com/ValveSoftware/source-sdk-2013/master/src/materialsystem/stdshaders/vertexlitgeneric_dx9.cpp' },
    { label: 'Unity: URP Asset 의 Opaque Texture', url: 'https://docs.unity.com/en-us/engine/6000.3/manual/render-pipelines/universal-render-pipeline/urp-reference/universalrp-asset' },
    { label: 'Shader Graph: Scene Color 노드', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.3/manual/Scene-Color-Node.html' },
  ],
  related: [
    { id: 'screen-refraction-glass', why: '같은 씬 색상 굴절과 앞 물체 가드를 유리에 쓴다' },
    { id: 'fresnel-rim-glow', why: '은신 중에 남기는 테두리의 프레넬만 따로 다룬다' },
    { id: 'dissolve-edge-glow', why: '진행값으로 경계 띠를 훑는 같은 마스크를 잘라 내기에 쓴다' },
    { id: 'hologram-scanline-glitch', why: '은신한 몸 위에 얹을 수 있는 줄무늬와 흔들림' },
  ],
  // 피격 노출은 숨은 몸 전체를 0.4초 동안 밝게 드러낸다. 연타해도 초당 3회를 넘지 않게 제한기를 거친다
  flashes: true,
}
