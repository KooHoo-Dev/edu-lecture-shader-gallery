import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'sprite-outline-hit-flash',
  title: '스프라이트 외곽선 + 피격 번쩍임',
  titleEn: 'Sprite Outline & Hit Flash',
  group: 'E',
  order: 1,
  oneLiner: '이웃 픽셀 알파로 외곽선을 그리고, 맞은 순간 단색으로 번쩍였다 돌아온다',
  goals: [
    '이웃 픽셀 알파를 읽어 스프라이트 바깥에 외곽선을 그릴 수 있다.',
    '색을 곱하는 방식과 보간하는 방식의 차이를 설명할 수 있다.',
    '`SpriteRenderer.material` 복사본으로 적마다 따로 번쩍이게 할 수 있다.',
    '2D Renderer 와 Universal Renderer 양쪽에서 그려지게 패스를 구성할 수 있다.',
  ],
  tags: ['스프라이트', '텍셀 크기', '알파', '게임 필'],
  difficulty: 2,
  shaderFile: 'SpriteOutlineHitFlash.shader',
  stage: { kind: 'sprite', blend: 'alpha' },
  params: [
    { key: '_OutlineWidth', label: '외곽선 두께', type: 'range', min: 0, max: 12, step: 0.5, default: 4, unit: ' 텍셀', hint: '0 이면 외곽선이 없다' },
    { key: '_OutlineColor', label: '외곽선 색', type: 'color', default: '#ffd166' },
    { key: '_HitFlash', label: '번쩍임 강도', type: 'range', min: 0, max: 1, step: 0.01, default: 0, hint: 'C# 에서 맞은 순간 1 로 올렸다 내린다' },
    { key: '_FlashColor', label: '번쩍임 색', type: 'color', default: '#ffffff' },
  ],
  presets: [
    { id: 'select', name: '선택 표시', look: '노란 외곽선으로 고른 대상을 알린다', values: {} },
    { id: 'enemy', name: '적 강조', look: '두꺼운 빨간 외곽선', values: { _OutlineColor: '#ff4d5e', _OutlineWidth: 7 } },
    { id: 'flash-only', name: '번쩍임만', look: '외곽선 없이 피격 신호만 쓴다', values: { _OutlineWidth: 0 } },
    { id: 'poison', name: '독 상태', look: '초록 번쩍임으로 상태 이상을 알린다', values: { _FlashColor: '#7dff8a', _OutlineColor: '#4ec96b', _OutlineWidth: 2.5 } },
  ],
  events: [
    {
      id: 'hit',
      label: '피격',
      tracks: [{ key: '_HitFlash', frames: [[0, 1], [0.06, 1], [0.26, 0]], ease: 'outQuad' }],
    },
  ],
  demo: { fire: [{ event: 'hit', every: 1.8 }] },
  steps: [
    { n: 1, label: '원본', body: '스프라이트 텍스처에 SpriteRenderer 의 Color 를 곱한 기본 모습이다.' },
    { n: 2, label: '외곽선', body: '주변 8방향의 알파를 읽어 가장 큰 값에서 자기 알파를 뺀다. 그림 바로 바깥 픽셀만 남는다. 거리는 `_MainTex_TexelSize` 로 텍셀 단위로 맞춘다.' },
    { n: 3, label: '번쩍임', body: '`lerp` 로 번쩍임 색과 섞는다. 색을 곱하면 원본보다 밝아질 수 없어 어두운 스프라이트가 번쩍이지 않는다. 이벤트 버튼으로 확인한다.' },
  ],
  offNote: '`SpriteRenderer.color` 를 바꾸는 것과 같은 곱하기 방식이다. 흰색을 곱해도 원본 그대로라 피격 버튼을 눌러도 번쩍이지 않고, 외곽선도 없다.',
  mistakes: [
    { title: '번쩍이지 않고 어두워진다', body: '`SpriteRenderer.color` 를 흰색으로 바꿔도 원본과 같다. 색 곱하기는 어둡게만 만든다. 셰이더에서 `lerp` 로 번쩍임 색과 섞어야 한다.' },
    { title: '외곽선이 잘린다', body: '스프라이트의 Mesh Type 이 Tight 이면 투명 여백이 메시에서 빠져 외곽선이 그려질 자리가 없다. Full Rect 로 바꾸고 그림 둘레에 두께만큼 여백을 둔다.' },
    { title: '아틀라스 옆 그림이 끌려온다', body: '이웃을 읽다가 아틀라스의 옆 스프라이트 픽셀을 집으면 엉뚱한 선이 생긴다. Sprite Atlas 의 Padding 을 외곽선 두께보다 크게 잡는다.' },
    { title: '적 하나를 때렸는데 전부 번쩍인다', body: '`sharedMaterial` 을 고치면 같은 머티리얼의 모든 적이 함께 변한다. `SpriteRenderer.material` 로 복사본을 만들고 `OnDestroy` 에서 지운다.' },
  ],
  unity: {
    setup: [
      '`SpriteOutlineHitFlash.shader`, `core.hlsl`, `SpriteHitFlash.cs` 를 `Assets/Shaders/sprite-outline-hit-flash/` 에 둔다.',
      '셰이더를 우클릭해 Create > Material 로 머티리얼을 만들고 SpriteRenderer 의 Material 칸에 넣는다.',
      '스프라이트 임포트 설정에서 Mesh Type 을 Full Rect 로 바꾸고 Apply 한다.',
      '같은 오브젝트에 `SpriteHitFlash` 를 붙이고 피격 판정 때 `Hit()` 을 호출한다.',
    ],
    verify: '머티리얼의 외곽선 두께를 올리면 그림 둘레에 선이 생기고, 번쩍임 강도를 1 로 올리면 스프라이트 전체가 번쩍임 색이 된다.',
    pitfalls: [
      '2D Renderer 에서는 `Universal2D` 패스가, Universal Renderer 에서는 `UniversalForward` 패스가 그려진다 (양쪽 모두 촬영으로 확인). 하나를 지우면 다른 쪽에서 스프라이트가 사라진다.',
      '이 셰이더는 2D 조명을 받지 않는다. 2D 라이트가 필요하면 `Universal2D` 패스에 라이팅 코드를 넣어야 한다.',
      'MaterialPropertyBlock 은 쓰지 않는다. SRP Batcher 에서 빠지고, 머티리얼 복사본 방식이 수업 프로젝트와도 같다.',
    ],
    graph: 'Shader Graph 의 Sprite Unlit 타깃에서 Custom Function 노드로 `outlineNeighborAlpha` 를 부를 수 있다. 다만 이 함수는 `SG_TEX` 매크로와 `_MainTex` 선언이 필요해 그래프의 Texture2D 입력을 받도록 고쳐야 한다.',
  },
  prompt: {
    goal: 'SpriteRenderer 에 쓰는 외곽선과 피격 번쩍임 셰이더를 넣는다. 적마다 따로 번쩍이고 2D Renderer 와 Universal Renderer 양쪽에서 그려진다.',
    adaptIdeas: [
      '외곽선이 숨 쉬듯 두꺼워졌다 얇아지게 하고 싶다.',
      '피격 때 빨간색으로 번쩍이고 살짝 흔들리게 하고 싶다.',
      '2D 조명을 받게 하고 싶다.',
      '무적 시간에 깜빡이는 효과를 추가하고 싶다. 초당 3회를 넘지 않게.',
    ],
  },
  captures: [{ name: 'hit', label: '피격 순간', values: { _HitFlash: 0.85 } }],
  inspiredBy: [],
  original: '특정 게임의 재현이 아니라 널리 쓰이는 범용 기법이다. 스프라이트와 코드는 이 갤러리에서 새로 만들었다.',
  references: [
    { label: 'Unity 포럼: 아틀라스 이웃 프레임을 침범하는 외곽선', url: 'https://discussions.unity.com/t/2d-outline-with-texture-sprite-in-multiple-invading-neighbor-frame/948815' },
    { label: 'Unity 게임 필: 피격 피드백 정리', url: 'https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/' },
  ],
  related: [{ id: 'dissolve-edge-glow', why: '적이 죽을 때 이어서 쓰면 좋은 효과' }],
}
