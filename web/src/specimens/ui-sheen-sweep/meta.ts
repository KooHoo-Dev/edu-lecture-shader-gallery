import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'ui-sheen-sweep',
  title: '광택 훑기',
  titleEn: 'UI Sheen Sweep',
  group: 'F',
  order: 2,
  oneLiner: '버튼 위를 빛 띠가 주기적으로 지나간다',
  goals: [
    'uv 를 각도만큼 돌린 좌표의 한 축으로 대각선 빛 띠 마스크를 만들 수 있다.',
    '`frac(time / 주기)` 로 띠가 지나간 뒤 쉬는 간격이 있는 반복을 만들 수 있다.',
    '띠를 이미지 알파로 가리고 색에 더하는 빛(가산)으로 얹는 이유를 설명할 수 있다.',
    'EventSystem 인터페이스로 버튼 호버와 클릭 때 띠를 한 번 재생하고, UGUI 머티리얼 복사본 규칙을 지킬 수 있다.',
  ],
  tags: ['UGUI', '좌표 회전', 'frac 반복', '가산 광택', '알파 마스크'],
  difficulty: 1,
  shaderFile: 'UiSheenSweep.shader',
  stage: {
    kind: 'sprite',
    ui: true,
    blend: 'alpha',
    textures: {
      _MainTex: { file: 'UiSheenSweepCard.png' },
    },
  },
  params: [
    { key: '_SheenColor', label: '광택 색', type: 'color', default: '#fff3d1', hint: '이미지 색에 더하는 빛의 색. 어두운 면에서는 이 색이 그대로 보이고 밝은 금테에서는 하얗게 포화된다' },
    { key: '_SheenIntensity', label: '광택 세기', type: 'range', min: 0, max: 2, step: 0.01, default: 0.75, hint: '더하는 빛의 양. 0 이면 띠가 사라진다. 1 을 넘기면 띠 가운데가 흰색으로 날아간다' },
    { key: '_SheenWidth', label: '띠 폭', type: 'range', min: 0.02, max: 0.6, step: 0.01, default: 0.22, hint: '이미지 짧은 변에 대한 비율. 가늘면 날카로운 반짝임, 넓으면 유리 같은 넓은 광택' },
    { key: '_SheenSoftness', label: '띠 부드러움', type: 'range', min: 0, max: 1, step: 0.01, default: 0.7, hint: '0 이면 가장자리가 또렷한 막대, 1 이면 가운데부터 서서히 옅어지는 빛' },
    { key: '_SheenAngle', label: '띠 각도', type: 'range', min: -60, max: 60, step: 1, default: 25, unit: '도', hint: '세로에서 기운 각도. 양수면 띠 위쪽이 오른쪽으로 기운다(/). 띠는 자기와 수직인 방향으로 움직이므로 양수에서는 왼쪽 위에서 오른쪽 아래로, 음수에서는 왼쪽 아래에서 오른쪽 위로 지나간다' },
    { key: '_SweepPeriod', label: '주기', type: 'range', min: 1, max: 6, step: 0.1, default: 2.2, unit: '초', hint: '띠 하나가 출발해서 다음 띠가 출발할 때까지의 시간. 한 점을 띠가 지나는 빈도가 1 / 주기라 1Hz 를 넘지 않는다' },
    { key: '_SweepPause', label: '쉬는 간격', type: 'range', min: 0, max: 0.9, step: 0.01, default: 0.35, hint: '주기 중 띠 없이 쉬는 몫. 주기 2.2초에 0.35 면 약 1.4초 동안 지나가고 0.8초 쉰다. 올리면 띠가 더 빨리 지나가고 더 오래 쉰다' },
    { key: '_AutoSweep', label: '자동 훑기', type: 'toggle', default: true, hint: '끄면 주기 띠가 멈추고 이벤트(호버, 클릭, 획득) 띠만 지나간다. 평소에는 조용한 버튼에 쓴다' },
    { key: '_SweepPulse', label: '이벤트 훑기 진행', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: '0 과 1 은 띠가 이미지 밖에 있는 위치다. C# 이 버튼에 마우스가 올라오거나 눌린 순간 0.6초 동안 0 에서 1 로 올린다. 직접 움직여 띠 위치를 본다' },
  ],
  presets: [
    { id: 'rare-slot', name: '희귀 슬롯 금빛', look: '넓고 부드러운 금빛 띠가 천천히 지나가고 오래 쉰다', values: { _SheenColor: '#ffd27a', _SheenIntensity: 0.8, _SheenWidth: 0.34, _SheenSoftness: 0.9, _SheenAngle: 35, _SweepPeriod: 3.2, _SweepPause: 0.55 } },
    { id: 'hover-only', name: '버튼 호버 전용', look: '평소에는 조용하고 마우스를 올리거나 누를 때만 띠가 한 번 지나간다. 이벤트 버튼으로 본다', values: { _AutoSweep: false } },
    { id: 'drop-sparkle', name: '아이템 드롭 반짝임', look: '가늘고 또렷한 흰 띠가 짧게 쉬며 자주 지나간다. 2D 스프라이트 샤인용', values: { _SheenColor: '#ffffff', _SheenIntensity: 1.4, _SheenWidth: 0.08, _SheenSoftness: 0.25, _SheenAngle: 40, _SweepPeriod: 1.2, _SweepPause: 0.15 } },
    { id: 'glass', name: '유리 패널 광택', look: '아주 넓고 옅은 푸른 빛이 반대 기울기로 느리게 지나간다. 더하는 빛은 그림 알파와 Image 알파를 곱한 만큼만 남으므로 알파 0.2~0.4 인 실제 반투명 패널에서는 광택도 그만큼 약해져 거의 안 보인다. 반투명 패널에는 미리 곱한 알파로 고친 변형을 쓴다', values: { _SheenColor: '#cfe8ff', _SheenIntensity: 0.45, _SheenWidth: 0.55, _SheenSoftness: 1, _SheenAngle: -20, _SweepPeriod: 4.5 } },
  ],
  events: [
    {
      id: 'sweep',
      label: '훑기 한 번',
      tracks: [{ key: '_SweepPulse', frames: [[0, 0], [0.6, 1]], ease: 'inOutSine' }],
    },
  ],
  demo: { fire: [{ event: 'sweep', every: 4.8 }] },
  steps: [
    { n: 1, label: '돌린 좌표', body: 'uv 를 가운데 기준으로 각도만큼 돌린 좌표의 x 를 밝기로 본다. 왼쪽 위가 짙은 회색이고 오른쪽 아래로 갈수록 밝아지며, 같은 밝기를 이은 줄무늬가 / 모양으로 기울어 있다. 이 줄 하나가 곧 띠의 모양이고, 띠는 밝아지는 쪽(줄무늬에 수직)으로 움직인다. 띠 각도를 바꾸면 줄무늬가 함께 돈다. 가로로 긴 Image 에서도 각도가 눕지 않게 uv 의 화면 미분으로 잰 가로세로 비를 먼저 곱한다.' },
    { n: 2, label: '띠 마스크', body: '돌린 좌표의 x 가 띠 위치 근처인 곳만 흰 띠다. 띠 위치는 `frac(time / 주기)` 로 주기마다 처음으로 돌아가고, 앞쪽 몫 동안만 이미지 밖에서 밖으로 지나간 뒤 쉬는 동안은 화면이 검게 빈다. 아직 그림 모양과 상관없이 사각형 전체를 가로지른다. 폭과 부드러움을 바꿔 본다.' },
    { n: 3, label: '알파로 가린 띠', body: '띠에 이미지 알파를 곱했다. 화면에 실제로 더해지는 빛의 양이다. 카드 바깥 투명 여백에서는 띠가 사라지고 카드 모양 안에만 남는다. 띠가 쉬는 동안에도 카드 자리가 보이게 이미지 알파를 옅은 회색 윤곽으로 깔았다 (이 단계 화면에만 있다). 셰이더는 알파를 이미지 알파 그대로 두고 띠를 색에 더하기만 한다. 알파 혼합이 색에 알파를 곱하므로 이 가림은 저절로 생긴다.' },
  ],
  offNote: '띠를 잘 보이게 하려고 알파를 띠로 올렸다 (`col.a = max(col.a, sheen)`). 카드 바깥 투명 여백 위로도 사각형 Image 전체를 가로지르는 띠가 지나가 그림 모양이 아닌 네모난 빛이 보인다. 광택용 더하기 Image 를 위에 따로 겹친 경우도 같다. 알파는 이미지 알파 그대로 두고 빛은 색에만 더한다.',
  mistakes: [
    { title: '카드 바깥 투명한 곳까지 네모난 빛이 지나간다', body: '띠가 보이게 하려고 알파를 띠로 올렸거나(`col.a = max(col.a, sheen)`), 광택을 따로 만든 더하기 Image 를 위에 겹쳤다. 알파는 이미지 알파 그대로 두고 띠는 색에만 더한다. 알파 혼합이 색에 알파를 곱하므로 투명 여백에서는 빛이 저절로 사라진다.' },
    { title: '가로로 긴 배너에서 띠가 거의 눕는다', body: 'uv 를 그대로 돌리면 4:1 Image 에서 uv 한 칸이 가로로 네 배 길어 25도로 기울인 띠가 훨씬 눕고, Image 마다 기울기가 다르다. 이 셰이더는 `ddx`, `ddy` 로 uv 가 화면 한 픽셀에 변하는 양을 재서 가로세로 비를 곱한 뒤 돌린다. 셰이더를 고치다 이 줄을 빼면 다시 눕는다.' },
    { title: '슬롯 여러 개나 큰 배너가 한꺼번에 번쩍인다', body: '띠 위치가 시간만으로 정해져 같은 머티리얼을 쓰는 Image 는 모두 같은 순간에 빛난다. 인벤토리 슬롯 수십 개나 화면을 덮는 배너면 넓은 면이 한꺼번에 밝아져 눈이 피곤하다. 세기를 낮추고 주기를 길게 두고, 슬롯마다 주기 안 위치를 어긋나게(캔버스 위치로 시간에 오프셋을 주어 물결처럼) 한다. 한 점을 띠가 지나는 빈도는 초당 3회 아래로 둔다.' },
    { title: '주기를 바꾸는 순간 띠가 엉뚱한 곳으로 튄다', body: '`frac(time / 주기)` 는 지금까지 흐른 시간 전체를 새 주기로 다시 나누므로 실행 중에 주기를 바꾸면 위치가 한 번에 바뀐다. 연출로 주기를 바꾸려면 C# 에서 `Time.unscaledDeltaTime / 주기` 를 쌓아 `Mathf.Repeat` 로 감싼 위상을 넘기게 셰이더를 고친다.' },
    { title: '버튼 하나에 마우스를 올렸는데 모든 버튼이 반짝인다', body: '`Image.material` 은 `Renderer.material` 과 달리 복사본을 만들지 않고 공유 머티리얼을 돌려준다. `new Material(image.material)` 로 복사본을 만들어 `image.material` 에 넣고 `OnDestroy` 에서 지운다 (`UiSheenTrigger` 참고). Mask 안이면 `materialForRendering` 에도 같은 값을 넣는다.' },
  ],
  unity: {
    setup: [
      '`UiSheenSweep.shader`, `core.hlsl`, `UiSheenTrigger.cs`, `UiSheenSweepCard.png` 를 `Assets/Shaders/ui-sheen-sweep/` 에 둔다.',
      'PNG 를 골라 Inspector 에서 Texture Type 을 Sprite (2D and UI), Sprite Mode 를 Single, sRGB (Color Texture) 켬, Alpha Is Transparency 켬, Wrap Mode 를 Clamp, Filter Mode 를 Bilinear 로 두고 Apply 한다. Sprite Atlas 에 넣지 않는다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만든다.',
      'Hierarchy 에서 Create > UI (Canvas) > Image 로 Image 를 만들고(버튼이면 Button 의 Image), Source Image 에 카드 스프라이트를, Material 칸에 머티리얼을 넣는다. Image Type 은 Simple 로 둔다.',
      '같은 오브젝트에 `UiSheenTrigger` 를 붙인다. Raycast Target 이 켜져 있고 씬에 EventSystem 이 있어야 마우스를 올리거나 누를 때 띠가 한 번 지나간다. 아이템을 얻은 순간에는 코드에서 `Play()` 를 부른다.',
      '평소에는 조용하고 이벤트 때만 반짝여야 하는 버튼은 머티리얼의 자동 훑기를 끈다.',
    ],
    verify: 'Play 를 누르면 Game 뷰에서 카드 위를 대각선 빛 띠가 주기마다 지나가고 카드 바깥 투명한 곳에는 띠가 보이지 않으며, 카드에 마우스를 올리면 띠가 한 번 더 지나간다.',
    pitfalls: [
      '이 셰이더는 uv 가 Image 의 0~1 을 한 번 돈다고 보고 띠의 기울기, 위치, 이동 거리를 정한다. Sprite Atlas 에 묶였거나 Sprite Mode Multiple 로 자른 스프라이트 시트의 스프라이트(인벤토리 아이콘과 드롭 아이템은 대개 시트에서 자른다)는 uv 가 큰 텍스처 속 작은 구간만 돌아, 띠가 텍스처 전체를 기준으로 지나간다. Image 안에서는 띠가 훨씬 넓고 흐릿하거나 아주 짧은 순간만 스치고, 같은 머티리얼의 아이콘마다 지나가는 때가 다르다. Image Type 이 Sliced 면 9분할 조각마다 uv 와 픽셀의 비가 달라 화면 미분으로 잰 가로세로 비, 이미지 반 크기, 이동 거리가 조각마다 바뀐다. 띠가 조각 경계에서 끊기고 테두리 조각에서는 다른 위치와 다른 때에 지나간다. Tiled 도 uv 가 Image 전체를 한 번 돌지 않아 맞지 않는다. 그대로 쓰려면 아틀라스와 시트에서 뺀 스프라이트를 Simple 로 둔다. 한 번에 고치려면 BaseMeshEffect 로 Image 기준 0~1 좌표를 정점의 uv1 에 넣고 캔버스의 Additional Shader Channels 에서 TexCoord1 을 켠 뒤 셰이더가 uv 대신 uv1 로 띠를 계산하게 한다. 배칭을 유지하며 Sliced, Tiled, 아틀라스, 시트가 모두 맞는다. 스프라이트의 uv 범위(`GetOuterUV`)를 머티리얼로 넘기는 방법은 Image 마다 복사본이 필요해 배칭이 끊긴다.',
      '가로세로 비를 uv 의 화면 미분으로 재므로 가로로 긴 배너에서도 각도는 유지된다. 대신 World Space 캔버스를 기울이면 화면에 눌려 보인 비율을 재서 패널 위의 각도가 달라지고, 카드 뒤집기처럼 X 스케일이 0 으로 가면 띠가 얇아지다 사라질 수 있다.',
      'Stencil 속성과 블록, `UNITY_UI_CLIP_RECT` 와 `_ClipRect` 계산, `UNITY_UI_ALPHACLIP` 의 `clip` 을 지우면 각각 Mask 안에서 가려지지 않고(Unity 경고), Scroll View 밖으로 카드가 새고, Mask 가 카드 모양이 아닌 사각형으로 가린다. 패스에 LightMode 태그를 붙이면 캔버스 종류에 따라 그려지지 않는다.',
      '자동 훑기는 `_Time` 을 쓰므로 Play 중에는 `Time.timeScale` 을 따른다. 일시정지(0)하면 띠가 카드 위에 멈춘 채 남을 수 있고, 배속 2 면 두 배로 자주 지나간다. 일시정지 메뉴의 버튼은 자동 훑기를 끄고 `UiSheenTrigger`(기본 실제 시간)로만 반짝이게 하거나, 실제 시간을 C# 에서 넘기게 고친다.',
      '`UiSheenTrigger` 는 처음 재생할 때 Image 마다 머티리얼 복사본을 만들어 캔버스 배칭이 끊기고 드로우 콜이 늘어난다. 이벤트가 필요 없는 슬롯에는 붙이지 않고 공유 머티리얼을 그대로 쓴다. 버튼의 자식 Image(아이콘)에 붙이면 `IPointerDownHandler` 때문에 누름 이벤트가 자식에서 멈춰 부모 Button 의 Pressed 색과 선택이 사라진다 (클릭은 동작한다). 자식에 붙일 때는 `playOnPointerDown` 을 끄고 부모 `Button.onClick` 에서 `Play()` 를 부른다.',
      '필드에 떨어진 아이템의 SpriteRenderer 에도 그대로 그려진다. 단 Universal2D 패스가 없어 2D Renderer 의 2D 조명(Light 2D)을 받지 않고 늘 원래 밝기로 보인다. 깊이 비교 `ZTest [unity_GUIZTestMode]` 는 캔버스가 넣는 값이라 SpriteRenderer 에서는 정해지지 않는다. 3D 필드에 놓는 드롭 반짝임은 셰이더를 복사해 이름을 바꾸고 `ZTest LEqual` 로 고친 사본을 써서 벽과 지형 뒤에서 가려지게 한다.',
    ],
  },
  prompt: {
    goal: 'UGUI 버튼과 아이템 카드 위를 대각선 빛 띠가 주기적으로 지나가는 광택 셰이더를 넣고, 마우스를 올리거나 아이템을 얻은 순간 띠가 한 번 지나가게 한다.',
    adaptIdeas: [
      '인벤토리의 희귀 슬롯 여러 개가 동시에 번쩍이지 않고 왼쪽 슬롯부터 물결처럼 차례로 반짝이게 하고 싶다. 머티리얼은 하나로 공유하고 싶다.',
      'Image Color 로 물들인 카드나 알파 0.3 정도의 반투명 유리 패널에서도 광택은 흰색 그대로 또렷하게 지나가게 하고 싶다. 미리 곱한 알파(`Blend One OneMinusSrcAlpha`, `rgb = tex.rgb * a + light * 모양 마스크`)로 바꿔 빛이 알파와 상관없이 더해지게 해 줘.',
      'Sliced 로 늘린 버튼과 Sprite Atlas, 스프라이트 시트에서 자른 아이콘에서도 띠가 Image 하나를 기준으로 끊김 없이 지나가게 하고 싶다. 머티리얼은 공유한 채 BaseMeshEffect 로 Image 기준 0~1 좌표를 uv1 에 넣어 배칭을 유지해 줘.',
      '필드에 떨어진 아이템의 SpriteRenderer 에도 같은 반짝임을 쓰고 싶다. 정렬과 ZTest, 2D 조명처럼 UI 밖에서 달라지는 점을 함께 점검해 줘.',
      '일시정지 메뉴(Time.timeScale = 0)에서도 버튼 광택이 계속 지나가게 하고 싶다.',
      '굵은 띠 바로 뒤에 가는 띠가 하나 더 따라오게 하고 싶다.',
    ],
  },
  captures: [
    { name: 'pulse', label: '이벤트 띠가 가운데를 지나는 순간', values: { _AutoSweep: false, _SweepPulse: 0.5 } },
    { name: 'drop-sparkle', label: '아이템 드롭 반짝임', values: { _SheenColor: '#ffffff', _SheenIntensity: 1.4, _SheenWidth: 0.08, _SheenSoftness: 0.25, _SheenAngle: 40, _AutoSweep: false, _SweepPulse: 0.42 } },
  ],
  // 기본값 촬영은 Unity 시간에 따라 띠가 쉬거나 카드 밖에 있는 순간에 찍힐 수 있다. 이벤트 띠를 가운데에 고정한 촬영을 쓴다
  thumbnail: 'pulse',
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 코드와 카드 그림은 이 갤러리에서 새로 만들었다. 수업 2D 09 UGUI Basic Component 의 버튼, 10 Inventory And TradeSystem 의 희귀 아이템 슬롯에 붙여 쓸 수 있고, [UI 갤러리](https://koohoo-dev.github.io/UIGallery/) 와 짝을 이룬다. 래퍼가 LightMode 태그 없는 패스 하나라 SpriteRenderer 에서도 SRPDefaultUnlit 으로 그려진다. 아이템 드롭 반짝임 촬영은 Unity 스프라이트 무대의 SpriteRenderer(Universal Renderer)로 찍은 것이다. 3D 필드에 놓을 때의 깊이 비교와 2D 조명은 Unity 함정에 대책을 적었다.',
  references: [
    { label: 'Unity Shader Graph UGUI Shaders 샘플: Animated Sheen 등 서브그래프', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-UGUI-Shaders-Subgraph-nodes.html' },
    { label: 'UIEffect (Shiny 효과를 포함한 UGUI 효과 모음)', url: 'https://github.com/mob-sakai/UIEffect' },
    { label: '2D FX Essentials: Godot 4 스프라이트 셰이더 9종 (샤인 포함)', url: 'https://forum.godotengine.org/t/2d-fx-essentials-nine-free-sprite-shaders-for-godot-4-outline-dissolve-hit-flash-shine/145788' },
    { label: 'UI 갤러리', url: 'https://koohoo-dev.github.io/UIGallery/' },
  ],
  related: [
    { id: 'ui-sdf-shape', why: '같은 UI 래퍼를 쓰고, 같은 화면 미분 방법으로 Image 의 가로세로 비를 잰다' },
    { id: 'sprite-outline-hit-flash', why: '0 에서 올라갔다 돌아오는 이벤트 값을 C# 이 움직이는 같은 구조. 스프라이트 머티리얼 복사본과 비교한다' },
    { id: 'screen-transition-wipe', why: '진행 값으로 대각선 경계를 옮기는 같은 원리를 화면 전체에 쓴다' },
  ],
}
