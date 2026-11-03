import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'xray-occluded-silhouette',
  title: '가려진 실루엣',
  titleEn: 'X-ray Occluded Silhouette',
  group: 'B',
  order: 3,
  oneLiner: '벽 뒤에 가려진 부분만 단색으로 덧그린다',
  goals: [
    '`ZTest Greater` 가 깊이 버퍼에 더 가까운 것이 이미 있는 픽셀만 통과시켜, 벽 뒤에 가려진 부분만 그려지는 원리를 설명할 수 있다.',
    '실루엣 패스가 `ZWrite Off` 이고 본체보다 먼저 그려져야 자기 몸 위에 실루엣이 겹치지 않는 이유를 설명할 수 있다.',
    '프레넬(`dot(normalWS, viewWS)`)로 윤곽을 진하게 해 단색 실루엣에서도 형태가 읽히게 할 수 있다.',
    'C# 에서 팀 색을 바꾸고 `_Reveal` 을 올렸다 내려 적을 발견한 순간을 알릴 수 있다.',
  ],
  tags: ['ZTest Greater', '멀티 패스', '프레넬', '알파 혼합', '팀 표시'],
  difficulty: 2,
  shaderFile: 'XrayOccludedSilhouette.shader',
  // 캐릭터 대신 캡슐을 둔다. 아래 반구의 곡선에도 테두리가 생겨 원통보다 몸 모양이 잘 읽힌다.
  stage: { kind: 'mesh', mesh: 'capsule', blend: 'cutout', occluded: true },
  params: [
    { key: '_SilhouetteColor', label: '실루엣 색', type: 'color', default: '#2f8cff', hint: '벽 뒤에 가려진 부분의 색. 조명을 받지 않는 단색이라 팀이나 대상 종류를 색 하나로 알린다' },
    { key: '_Opacity', label: '실루엣 불투명도', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, hint: '실루엣 안쪽이 벽을 덮는 정도. 0 이면 테두리만 남고, 1 이면 벽에 구멍이 뚫린 것처럼 꽉 찬다' },
    { key: '_RimStrength', label: '테두리 세기', type: 'range', min: 0, max: 3, step: 0.05, default: 1.5, hint: '프레넬 테두리를 얼마나 진하게 할지. 0 이면 테두리 없이 불투명도만큼 고르게 덮여 형태가 납작해진다' },
    { key: '_RimWidth', label: '테두리 폭', type: 'range', min: 0.05, max: 1, step: 0.01, default: 0.6, hint: '진한 테두리가 윤곽에서 안쪽으로 들어오는 깊이. 몸 반지름 중 바깥 몇 할을 칠할지에 가깝다. 작으면 가는 선, 1 이면 정면을 보는 가운데까지 부드럽게 번진다. 불투명도를 0 으로 내리고 움직이면 잘 보인다' },
    { key: '_Reveal', label: '발견 펄스', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: 'C# 이 발견한 순간 0 에서 1 로 올렸다 0 으로 내린다. 실루엣이 꽉 차고 흰빛 쪽으로 밝아진다. 다른 값에 더하기만 하므로 0 이면 아무 일도 하지 않는다' },
    { key: '_BaseColor', label: '본체 색', type: 'color', default: '#9aa88f', hint: '벽에 가리지 않은 본체의 색. 조명을 곱한 평범한 음영이다' },
  ],
  presets: [
    { id: 'ally', name: '아군 위치 표시', look: '파란 테두리와 옅은 안쪽으로 벽 너머 아군의 몸을 보여 준다', values: {} },
    { id: 'enemy', name: '적 표시', look: '빨간 실루엣을 조금 더 진하게 깔아 벽 뒤의 위협을 알린다', values: { _SilhouetteColor: '#ff4d44', _Opacity: 0.6, _RimWidth: 0.5 } },
    { id: 'faint-hint', name: '희미한 위치 힌트', look: '안쪽은 비우고 흰 테두리만 가늘게 남겨 위치만 슬쩍 알린다', values: { _SilhouetteColor: '#dce8ff', _Opacity: 0.05, _RimStrength: 1.2, _RimWidth: 0.35 } },
    { id: 'objective', name: '목표물 강조', look: '노란색으로 꽉 차게 칠해 멀리서도 놓치지 않게 한다', values: { _SilhouetteColor: '#ffc94d', _Opacity: 0.85, _RimWidth: 0.8 } },
  ],
  events: [
    {
      id: 'reveal',
      label: '발견',
      // XraySilhouetteController.PlayReveal() 과 같다. 0.08초 만에 차오르고 0.6초 동안 사라진다. 두 구간 모두 outQuad 모양.
      tracks: [{ key: '_Reveal', frames: [[0, 0], [0.08, 1], [0.68, 0]], ease: 'outQuad' }],
    },
  ],
  demo: {
    // 평소 모습을 보여 주다가 3.2초마다 한 번 발견 펄스를 넣는다. 한 번에 한 번만 밝아지고 가려진 부분에만 생긴다.
    fire: [{ event: 'reveal', every: 3.2 }],
  },
  steps: [
    { n: 1, label: '실루엣 단색', body: '벽 오른쪽 끝에 가려진 캡슐의 왼쪽 아래 자리에 실루엣 색 덩어리가 꽉 차게 생겼다. 벽보다 뒤에 있는 픽셀만 `ZTest Greater` 를 통과해 실루엣 패스로 들어오고, 이 단계는 그 자리를 실루엣 색 하나로 불투명하게 칠했다. 벽 밖으로 나온 몸은 본체 패스가 평범한 조명으로 그리며 모든 단계에서 같다. 단색만으로는 벽에 캡슐 모양 구멍이 뚫린 것처럼 납작해, 벽 앞인지 뒤인지도 둥근 몸인지 판인지도 읽히지 않는다.' },
    { n: 2, label: '프레넬 테두리', body: '`dot(normalWS, viewWS)` 로 법선이 시선에서 얼마나 비껴 있는지(각의 sin)를 구해 `smoothstep` 으로 자른 값이다. 가려진 부분의 왼쪽 윤곽이 흰색이고, 캡슐 가운데로 갈수록 부드럽게 어두워져 오른쪽은 검다. 아래쪽 둥근 끝의 곡선을 따라서도 같은 폭의 흰 띠가 돌아, 몸의 아래 끝이 둥글다는 것이 읽힌다. 위쪽과 오른쪽의 곧은 경계는 몸의 윤곽이 아니라 벽 끝이라 띠가 없다. `_RimWidth` 를 올리면 흰 부분이 가운데 쪽으로 넓어지고, `_RimStrength` 를 올리면 같은 폭 안이 더 하얗게 찬다.' },
    { n: 3, label: '섞을 비율', body: '실루엣의 알파다. 오른쪽(가운데)은 `_Opacity` 만큼의 밝은 회색이고 왼쪽 윤곽과 아래 곡선으로 갈수록 흰색이 된다. 최종 화면은 이 비율로 실루엣 색을 벽 위에 섞으므로 가운데로는 벽 색이 비치고 윤곽은 진하게 남아 둥근 몸이 읽힌다. 발견 버튼을 누르면 이 값이 잠깐 전체 흰색이 된다.' },
  ],
  offNote: '프레넬을 `1 - dot(normalWS, viewWS)` 로 그대로 쓴 흔한 실수. 둥근 몸에서는 이 값이 윤곽 바로 앞까지 0 에 가까워, 같은 테두리 폭에서도 왼쪽 윤곽과 아래 곡선에 실처럼 가는 선만 남는다. 안쪽은 불투명도만큼 옅게 덮일 뿐이라 벽 색과 섞여 흐릿하고, 작은 화면이나 먼 거리에서는 선이 몇 픽셀로 줄어 몸의 둥근 형태도 위치도 놓치기 쉽다. 테두리 폭을 1 까지 올려도 정상 화면만큼 넓어지지 않는다.',
  mistakes: [
    { title: '벽 뒤로 가도 실루엣이 생기지 않는다', body: '네 가지를 차례로 본다. (1) Universal Renderer Data 의 Rendering > Depth Priming Mode 가 켜져 있는지. 켜져 있으면 불투명 그리기 전체가 `ZTest Equal` 로 덮어써져 실루엣 패스의 `ZTest Greater` 가 무시되고 실루엣이 통째로 사라진다. Auto 는 데스크톱에서 URP Asset 의 MSAA 가 꺼져 있으면 켜지니 Disabled 로 둔다 (2026-11-03 촬영으로 확인). SSAO 는 끌 필요가 없다. 프라이밍이 꺼진 깊이 프리패스는 깊이 텍스처에만 그려 상관없다. (2) 실루엣 패스가 `ZTest Greater` 인지. 기본값(`LEqual`)이면 보이는 부분 위에 덧칠될 뿐이다. (3) 본체와 실루엣 패스가 같은 `LightMode` 태그를 쓰지 않는지. URP 는 같은 태그의 첫 패스만 그리므로 실루엣 패스는 `SRPDefaultUnlit` 으로 둔다. (4) 캐릭터가 벽보다 늦게 그려지는지. 이 셰이더는 `"Queue" = "AlphaTest"`(2450)라 Geometry 큐(2000)의 벽 다음에 그려진다. 머티리얼 Inspector 의 Render Queue 를 벽보다 작은 값으로 낮추거나 벽의 큐를 캐릭터보다 크게 올리면, 실루엣을 그릴 때 벽 깊이가 아직 없어 실루엣이 생기지 않는다.' },
    { title: '유리창이나 반투명 벽 뒤에서는 실루엣이 안 생긴다', body: '실루엣은 깊이 버퍼만 비교한다. 투명 머티리얼은 `ZWrite Off` 라 깊이를 쓰지 않으므로 그 뒤의 캐릭터는 가려진 것으로 판정되지 않는다. 또 투명 큐(3000)는 캐릭터보다 늦게 그려진다. 보통은 유리를 가림막으로 치지 않는 것이 맞다. 유리 자리에 깊이만 쓰는 불투명 물체(ColorMask 0)를 두는 방법은 권하지 않는다. 그 물체가 깊이를 먼저 써 버려 뒤에 그려질 스카이박스와 캐릭터 본체, 다른 불투명 물체가 유리 자리에서 지워져 유리 너머가 검거나 비어 보인다.' },
    { title: '무기나 다른 부위 위에 몸의 실루엣 색이 칠해진다', body: 'Forward 와 Forward+ 에서 같은 물체의 `SRPDefaultUnlit` 실루엣 패스는 `UniversalForwardOnly` 본체보다 먼저 그려져, 렌더러 하나짜리 캐릭터는 자기 몸에 겹치지 않는다. 겹친다면 원인은 둘이다. (1) 캐릭터가 렌더러나 서브메시 여러 개로 나뉘어 있다. 부위마다 실루엣과 본체가 따로 그려지므로 먼저 그린 부위 위에 뒤 부위의 실루엣이 덮인다. 다른 큐의 무기나 모자(Lit, 2000)도 캐릭터보다 먼저 그려져, 몸 앞에 든 총 위에 몸의 실루엣 색이 칠해진다. 모든 머티리얼을 이 셰이더로 바꿔도 풀리지 않는다. (2) Deferred 렌더 경로에서는 본체가 실루엣보다 먼저 그려질 수 있다 (URP 소스로 추론, 확인하지 않았다). Window > Analysis > Frame Debugger 에서 부위별 그리는 순서를 본다. 이런 캐릭터는 Universal Renderer 의 Render Objects 방식으로 바꾼다. 캐릭터 레이어(무기 포함)를 Opaque Layer Mask 에서 빼고, 첫 Render Objects 로 레이어 전체의 실루엣을 먼저(Depth Test Greater, Write Depth 끔), 둘째로 본체를 나중에 그린다. 본체 머티리얼은 평범한 Lit 으로 둔다.' },
    { title: '실루엣이 납작하거나 테두리가 실처럼 가늘다', body: '실루엣은 조명을 받지 않으므로 단색으로만 칠하면 입체감이 없다. 이 표본은 `dot(normalWS, viewWS)` 로 윤곽일수록 알파를 1 에 가깝게 올린다. `1 - dot` 을 그대로 쓰면 둥근 몸에서 윤곽 바로 앞까지 거의 0 이라 테두리가 실처럼 가늘다. 각의 sin(`sqrt(1 - d * d)`)을 쓰면 가운데에서 윤곽까지 고르게 커진다. 효과 끄기가 `1 - dot` 의 모습이고, 테두리 세기를 0 으로 내리면 테두리 없이 납작한 모습을 볼 수 있다. 법선과 시선은 모두 월드 공간에서 정규화한 값을 쓴다.' },
    { title: '작은 소품이나 풀 뒤에서도 실루엣이 깜빡인다', body: '`ZTest Greater` 는 앞에 있는 것이 벽인지 풀잎인지 가리지 않는다. 캐릭터가 덤불 사이를 지나면 잎 모양대로 실루엣이 켜졌다 꺼진다. 깊이 버퍼는 하나라 레이어를 골라 비교할 수는 없고, 그리는 순서로 고른다. 벽 → 실루엣 → 덤불 순서로 그리면 실루엣을 그리는 순간 깊이 버퍼에는 아직 벽만 있어 벽 뒤에서만 실루엣이 생기고, 덤불은 그 뒤에 그려져 평범하게 앞을 덮는다. 머티리얼 방식이면 덤불 머티리얼의 Render Queue 를 캐릭터(2450)보다 크고 불투명 범위(2500) 안인 값(예: 2460)으로 올린다. Render Objects 방식이면 덤불을 따로 레이어로 나눠 Opaque Layer Mask 에서 빼고 실루엣 다음 Render Objects 로 그린다.' },
  ],
  unity: {
    setup: [
      '`XrayOccludedSilhouette.shader`, `core.hlsl`, `XraySilhouetteController.cs` 를 `Assets/Shaders/xray-occluded-silhouette/` 에 둔다.',
      'Project 창에서 셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      '머티리얼을 캐릭터의 MeshRenderer(또는 SkinnedMeshRenderer)에 넣는다. 가림막이 될 벽은 URP Lit 처럼 깊이를 쓰는 불투명 머티리얼이어야 한다. 캐릭터가 렌더러나 서브메시 여러 개로 나뉘었거나 무기, 모자를 따로 들고 있으면 이 머티리얼 대신 Render Objects 방식을 쓴다 (주의할 점 참고).',
      '팀 색과 발견 연출이 필요하면 같은 오브젝트에 `XraySilhouetteController` 를 붙이고 Team 을 고른다. 적을 발견한 순간 `PlayReveal()` 을, 팀이 바뀌면 `SetAlly()` 나 `SetEnemy()` 를 호출한다. 인자가 없어 UnityEvent 에 바로 연결할 수 있다.',
      '사용 중인 Universal Renderer Data 의 Rendering > Depth Priming Mode 를 Disabled 로 둔다. 켜져 있으면(Auto 는 MSAA 가 꺼진 데스크톱에서 켜진다) 실루엣이 통째로 사라진다. SSAO 같은 다른 기능은 끄지 않아도 된다.',
    ],
    verify: '캐릭터를 벽 뒤로 옮기면 가려진 부분만 팀 색 실루엣으로 보이고 윤곽이 진하다. 실루엣 불투명도를 0 으로 내리면 테두리만 남고, 벽 밖으로 나온 몸은 평범한 조명 그대로다.',
    pitfalls: [
      '이 셰이더는 3D 프로젝트(Universal Renderer)용이다. 2D Renderer 는 `Universal2D` 와 `SRPDefaultUnlit` 태그만 그리므로 본체 패스(`UniversalForwardOnly`)는 빠지고 실루엣 패스만 남는다. 몸은 그려지지 않고, 깊이에 따라 실루엣 조각만 보이거나 아무것도 안 보인다.',
      'Universal Renderer Data 의 Depth Priming 이 켜지면 불투명 그리기 전체가 `ZTest Equal, ZWrite Off` 로 덮어써져 실루엣 패스의 `ZTest Greater` 가 무시되고 실루엣이 통째로 사라진다 (몸에 겹치지는 않는다). Auto 모드는 데스크톱에서 URP Asset 의 MSAA 가 꺼져 있으면 프리패스가 필요 없어도 켜지므로 Disabled 로 둔다 (2026-11-03 Forced 와 Auto 로 찍어 실루엣이 사라지는 것을 확인. MSAA 를 켜면 둘 다 프라이밍이 쓰이지 않는다). 프라이밍이 꺼진 깊이 프리패스(SSAO 등이 켠다)는 깊이 텍스처에만 그려 상관없으니 SSAO 를 끌 필요는 없다. 실루엣은 깊이 버퍼만 비교하므로 URP Asset 의 Depth Texture 설정도 필요 없다 (URP 17.3 소스 기준).',
      '투명한 벽(`ZWrite Off`)은 깊이를 쓰지 않아 그 뒤에서는 실루엣이 생기지 않는다. 유리, 연기, 반투명 파티클은 가림막으로 치지 않는다.',
      '실루엣 패스는 `SRPDefaultUnlit` 태그를 쓴다. URP 는 같은 태그의 패스가 둘이면 첫 패스만 그리므로, 이 셰이더에 껍데기 외곽선처럼 `SRPDefaultUnlit` 패스를 하나 더 넣으면 둘 중 하나가 사라진다. 외곽선까지 필요하면 외곽선을 다른 머티리얼이나 Render Objects 로 분리한다.',
      '렌더러 하나, 머티리얼 하나짜리 캐릭터를 전제로 한 셰이더다. 렌더러나 서브메시가 여러 개면 부위마다 실루엣과 본체가 따로 그려져 먼저 그린 부위 위에 뒤 부위의 실루엣이 덮이고, 다른 큐의 무기나 모자(Lit, 2000)도 같아 몸 앞에 든 총 위에 실루엣 색이 칠해진다. 모든 머티리얼을 이 셰이더로 바꿔도 풀리지 않으므로 Render Objects 방식(캐릭터 레이어 전체의 실루엣을 먼저, 본체를 나중에)을 쓴다. Deferred 렌더 경로의 Forward 전용 목록은 `UniversalForwardOnly, SRPDefaultUnlit` 순이라 본체가 먼저 그려질 수 있고, 그러면 렌더러 하나짜리라도 팔 위에 뒤쪽 몸통의 실루엣이 칠해진다 (소스로 추론, Unity 에서 확인하지 않았다). 실루엣은 그림자를 드리우지 않고 깊이, 노멀 텍스처에도 들어가지 않는다.',
      '안개를 처리하지 않아 Fog 를 켠 넓은 맵에서 먼 캐릭터 본체가 안개에 묻히지 않는다. 본체는 Forward 패스에 `#pragma multi_compile_fog` 를 넣고 정점에서 `ComputeFogFactor(positionCS.z)` 를 넘긴 뒤 마지막 색에 `MixFog(color, fogFactor)` 를 건다. 실루엣 패스는 일부러 안개를 무시해도 된다. 벽 너머 위치를 알리는 표시라 멀어도 흐려지지 않는 편이 낫다. 또 본체 조명은 광원의 `distanceAttenuation` 을 곱하지 않아(래퍼 주석 참고) 광원의 Culling Mask 와 Rendering Layers 가 무시된다.',
    ],
    graph: 'Shader Graph 는 그래프 하나에 `ZTest Greater` 패스를 더 넣을 수 없다. 본체는 기존 Lit 그래프나 머티리얼을 그대로 두고, 실루엣은 Universal Renderer 의 Render Objects 기능에 맡긴다. Create > Shader Graph > URP > Unlit Shader Graph 로 실루엣용 그래프를 만들어 Graph Settings 에서 Surface Type 을 Transparent 로 둔다. Fresnel Effect 노드의 Power 를 0.5 쯤으로 두면 이 표본의 각의 sin 과 비슷하게 가운데에서 윤곽까지 고르게 커진다 (Power 가 1 이상이면 `1 - dot` 과 같거나 더 가팔라 테두리가 실처럼 가늘다). 그 결과를 Smoothstep(Edge1 = 1 - 테두리 폭, Edge2 = 1)에 넣고 테두리 세기를 곱해 Saturate 한 뒤 Lerp 의 T 로 넣어 불투명도와 1 사이를 고르면 이 표본의 `lerp(_Opacity, 1.0, edge)` 와 같은 모양의 알파가 된다. 그 결과를 Alpha 에, 실루엣 색을 Base Color 에 연결한다. 이 그래프로 만든 머티리얼을 Render Objects 의 Override Material 에 넣고 Depth Test 를 Greater, Write Depth 를 끈다. 식을 정확히 같게 하려면 Fresnel Effect 와 Smoothstep 대신 Custom Function 노드를 String 모드로 두고 Name 을 `XrayRim` 으로, 입력에 Normal Vector(World)와 View Direction(World) 노드와 폭을 연결해 `void XrayRim_float(float3 NormalWS, float3 ViewWS, float RimWidth, out float Edge) { float f = saturate(dot(normalize(NormalWS), normalize(ViewWS))); Edge = smoothstep(1.0 - RimWidth, 1.0, sqrt(saturate(1.0 - f * f))); }` 를 넣는다. `core.hlsl` 을 File 모드로 통째로 지정하면 `SgInput` 과 머티리얼 값 선언이 없어 컴파일되지 않는다.',
  },
  prompt: {
    goal: '캐릭터가 벽 뒤에 가려지면 가려진 부분만 팀 색 실루엣으로 덧그리는 셰이더를 넣는다. 윤곽을 프레넬로 진하게 해 형태가 읽히고, 벽 밖으로 나온 몸은 평범한 조명 그대로이며, 적을 발견한 순간 C# 로 실루엣을 잠깐 밝힌다.',
    adaptIdeas: [
      '캐릭터가 여럿이고 팀마다 색이 다르다. 머티리얼마다 패스를 넣는 대신 Universal Renderer 의 Render Objects 기능으로 팀 레이어마다 Layer Mask, Depth Test Greater, Override Material(팀 색 실루엣 머티리얼)을 걸어 같은 효과를 내고 싶다.',
      '적은 내 시야나 아군 시야에 들어온 동안에만 실루엣이 보이고, 처음 들킨 순간 발견 펄스가 나오게 하고 싶다.',
      '멀리 있을수록 실루엣이 옅어지거나, 반대로 멀어도 화면에서 같은 굵기의 테두리로 보이게 하고 싶다.',
      '실루엣에 위로 흐르는 스캔라인 무늬를 넣어 투시 장비로 보는 느낌을 내고 싶다.',
      '체력이 낮은 아군만 실루엣 색을 바꿔 벽 너머에서도 위급한 동료를 찾게 하고 싶다.',
      'Fog 를 켠 넓은 맵에서 본체는 안개에 묻히고, 실루엣은 안개와 상관없이 또렷하게 남게 하고 싶다.',
    ],
  },
  captures: [
    { name: 'enemy', label: '적 표시', values: { _SilhouetteColor: '#ff4d44', _Opacity: 0.6, _RimWidth: 0.5 } },
    { name: 'revealed', label: '발견 펄스 중간', values: { _Reveal: 0.6 } },
  ],
  inspiredBy: [
    {
      title: 'Overwatch (2016)',
      credit: 'Blizzard Entertainment',
      borrowed: ['벽 너머로 보이는 아군 윤곽'],
      learned: '2018년 8월 PTR 패치 노트가 아군의 윤곽을 벽 너머로 보이게 하는 기능을 더했다. 같은 편의 위치를 벽 뒤에서도 놓치지 않게 하는 쓰임새가 이 표본의 아군 프리셋(파란 테두리, 옅은 안쪽)과 팀 색 전환이다. 게임 화면은 직접 확인하지 않았고 코드나 그림은 옮기지 않았다.',
      link: 'https://eu.forums.blizzard.com/en/overwatch/t/overwatch-ptr-patch-notes-august-30-2018/8320',
    },
  ],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 깊이 테스트 기법이다. Unity 공식 예제는 Render Objects 기능으로 같은 효과를 내지만, 이 표본은 머티리얼 하나에 `ZTest Greater` 실루엣 패스를 넣어 렌더러 설정 없이 끝나게 했고, 프레넬로 윤곽을 진하게 하는 알파, 팀 색 전환과 더하기용 발견 펄스를 C# 과 함께 만들었다. 수업의 XR 10 MR Portal(PortalMask), XR 11 MR Room(Occlusion)이 스텐실과 깊이로 보이는 곳을 고르는 짝이고, 3D 17 FPS Game 에 붙여 쓸 수 있다. 코드는 이 갤러리에서 새로 작성했다.',
  references: [
    { label: 'Unity 매뉴얼: Render Objects 로 가려진 캐릭터 그리기', url: 'https://docs.unity3d.com/6000.2/Documentation/Manual/urp/renderer-features/how-to-custom-effect-render-objects.html' },
    { label: 'Unity 6 셰이더·VFX 전자책 (URP)', url: 'https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6' },
    { label: 'Unity 매뉴얼: ShaderLab ZTest', url: 'https://docs.unity3d.com/Manual/SL-ZTest.html' },
  ],
  related: [
    { id: 'inverted-hull-outline', why: '같은 물체를 `SRPDefaultUnlit` 패스로 한 번 더 그리는 짝. 저쪽은 `Cull Front`, 이쪽은 `ZTest Greater` 로 그릴 곳을 고른다' },
    { id: 'fresnel-rim-glow', why: '실루엣 테두리에 쓴 프레넬을 자세히 단계별로 본다' },
    { id: 'force-field-intersection', why: '깊이를 비교해 효과를 만드는 다른 방법. 저쪽은 깊이 텍스처를 읽고, 이쪽은 깊이 버퍼 테스트만 쓴다' },
  ],
}
