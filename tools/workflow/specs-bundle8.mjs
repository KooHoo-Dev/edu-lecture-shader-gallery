// 묶음 8 (2026-11-03): 하프톤, 인테리어 매핑, 스프라이트 바람 흔들림. 선정 카드는 docs/shader-selection.md 31~33번.
//   node tools/workflow/make-jobs.mjs tools/workflow/specs-bundle8.mjs
export default [
  {
    id: 'screen-halftone-dots', name: 'ScreenHalftoneDots', card: '31. screen-halftone-dots', bundle: 8, sample: 'screen-crt-scanline', sampleNote: '전체 화면 무대, 화면 공간 무늬와 정지 줄무늬 안전 규칙. C# 은 두지 않는다',
    meta: '하프톤 망점, 그룹 G, 순서 5, 난이도 2',
    items: [
      "무대: 전체 화면, `stage.bright: true`, Requirements 없음, C# 없음, 이벤트 없음. 시간(`time`)을 쓰지 않는다 (점이 움직이지 않는다). 자동 데모는 두지 않는다 (점 크기가 계속 바뀌면 정지 무늬 규칙을 벗어난다. 데모가 없다는 경고는 받아들인다).",
      '안전(먼저 읽을 것): 가이드 7절의 정지 줄무늬 규칙과 점 격자 문장. 잉크 = 종이 × (1 - `_InkStrength`), 기본 `_InkStrength` 0.4 로 잉크가 종이의 60% 이상 밝기. 평평한 면에서 점 안과 점 밖의 선형 밝기 비로 확인한다. 신문 흑백처럼 대비가 높은 모양은 프리셋에만 두고 `captures` 는 기본값 기준 촬영으로 한다. 기본 `_Rows` 는 1080p 에서 칸이 15 픽셀 이상이 되게 둔다. `unity.pitfalls` 에 게임 옵션으로 끌 수 있게 하라고 적는다.',
      '효과의 핵심: (1) 화면비를 보정한 좌표를 각도만큼 돌리고 `_Rows`(화면 높이를 몇 줄 칸으로 나눌지)로 칸을 나눈다. 칸 크기를 픽셀이 아니라 줄 수로 정해 웹, Unity 촬영, 1080p 에서 같은 모양이 나오게 한다. 칸이 3 픽셀 아래로 내려가면 원본으로 섞는 하한을 코드에 둔다. (2) 칸 중심 한 점에서 화면 색을 읽는다. (3) 선형 밝기로 덮임(잉크 비율)을 구하고 반지름은 덮임의 제곱근에 비례하게 해 점 면적이 덮임과 맞게 한다. (4) `fwidth` 로 원 가장자리를 1 픽셀 부드럽게. 모드 select: 흑백 한 판, 칸 색 점, CMYK 네 판(판 각도 15·75·0·45 고정, 겹친 판이 로제트 무늬). 조절 값: 모드, 줄 수, 각도(`showWhen` 흑백·칸 색), 점 굵기 보정, 잉크 세기, 종이 색, 잉크 색(`showWhen` 흑백).',
      '프리셋: 신문 흑백(잉크 거의 검정, 대비 높음, 프리셋으로만), 만화 인쇄 CMYK(크림 종이), 팝아트 큰 점(칸 색, 각도 0, 큰 칸), 은은한 인쇄 질감(CMYK, 촘촘하게, 잉크 약하게).',
      '단계 보기 후보: 돌린 칸 격자(칸 안 좌표를 빨강·초록, 화면비와 상관없이 정사각인지), 칸 중심에서 읽은 색(모자이크), 점 마스크(흑백 판). 마지막 단계가 최종 화면과 같으면 넣지 않는다.',
      '효과 끄기: 반지름을 밝기에 선형으로 둔 흔한 실수 (`r = 0.5 × (1 - 밝기)`). 면적은 그 제곱이라 중간 톤 잉크가 모자라 화면 전체가 밝고 색이 빠진다. 픽셀마다 샘플하는 실수(물체 경계에서만 점이 잘림)와 sRGB 값으로 덮임을 계산하는 실수는 `mistakes` 에 둔다.',
      '`unity.pitfalls` 후보: 주입 지점(Bloom·톤 매핑 뒤에 걸려면 After Rendering Post Processing, 순서는 확인하지 않음으로), Screen Space - Overlay 캔버스 UI 는 덮이지 않는다, XR 은 끄기를 권한다, 모바일 비용(샘플 1~4 번), 안전 옵션.',
      '용량: 촬영이 화면을 덮는 잔무늬라 16KB 경고를 넘기 쉽다. `captures` 는 두 장 이내.',
      '`inspiredBy`: 빈 배열 (화면 후처리 대표작 미확인. Hi-Fi RUSH 는 표면 음영이고 근거가 제3자 노트뿐이라 넣지 않는다). 게임명은 어디에도 쓰지 않는다. `references` 는 카드의 Unity Production Ready 후처리(Half Tone), UGUI Shaders 샘플, Gustavson 튜토리얼, Heckel 글, MDN 접근성 문서 중에서 고른다.',
    ],
  },
  {
    id: 'interior-room-mapping', name: 'InteriorRoomMapping', card: '32. interior-room-mapping', bundle: 8, sample: 'triplanar-projection', sampleNote: '불투명 메시, 오브젝트 공간 계산과 텍스처. 큐브 무대가 돈다',
    meta: '인테리어 매핑, 그룹 A, 순서 6, 난이도 3',
    textures: ['interior-room-mapping-rooms'],
    items: [
      "무대와 혼합: 메시 무대 `mesh: 'cube'`, `blend: 'cutout'`(불투명, 알파 1). 메시 무대 `SgInput.cameraPosOS`(2026-11-03 추가, 가이드 4절)로 오브젝트 공간 시선 `normalize(positionOS - cameraPosOS)` 를 만든다. 래퍼는 `TransformWorldToObject(GetCameraPositionWS())` 를 넘긴다 (`ground-aoe-indicator` 래퍼와 같은 줄). 탄젠트 입력이 없으므로 `normalOS` 의 주축으로 면 기저(오른쪽, 위, 안쪽)를 고른다. 윗면·아랫면(±Y)은 창 없는 지붕으로 둔다.",
      '효과의 핵심: 면 좌표를 창 칸으로 나누고 칸마다 방 상자(가로·세로 칸 크기, 깊이는 칸 폭 × `_RoomDepth`)와 시선의 교차를 구한다 (나가는 쪽 옆벽·바닥/천장과 뒷벽까지의 거리 중 가장 가까운 것, `min`). 0 나누기를 막는다. 교차점으로 방 그림 좌표를 구해 아틀라스에서 읽는다. 칸 번호 해시로 방 종류, 좌우 반전, 불 켜짐(방마다 고정 난수 < `_LightsOn`)을 정한다. 창틀(외벽 색, `i.lighting` 을 받는다), 커튼 층(창 평면에 반투명 주름), 프레넬 유리 반사, 밤 정도(방과 외벽을 어둡게, 켜진 방은 조명 색). 조절 값: 가로·세로 창 수, 방 깊이, 창틀 두께, 외벽 색, 유리 반사, 밤, 불 켜진 비율, 조명 색, 커튼 비율. 프리셋: 사무실 낮, 밤 불빛, 상점 진열창(큰 창, 얕은 방), 깊은 방.',
      '텍스처: `tools/textures/interior-room-mapping-rooms.mjs` 에서 한 점 투시 방 그림 2×2 아틀라스 256×256 (방당 128, 둘레 4 px 여백은 바깥 벽 색을 이어 칠해 밉에서 이웃 방이 번지지 않게). 방 그림은 창 자리에서 방 깊이만큼 물러난 눈으로 본 그림이라 뒷벽이 그림 가운데 절반 크기, 둘레가 바닥·천장·옆벽 사다리꼴이다. 이렇게 그리면 셰이더의 그림 좌표 식에서 깊이가 약분되어 어떤 방 깊이에도 같은 그림을 쓰고, 방 모서리에 밉 이음매가 없다. 생성기는 셰이더의 역연산(그림 좌표 → 어느 면의 어느 위치)으로 칠한다. 방 넷: 사무실(카펫 줄, 천장 격자, 화이트보드), 거실(마루, 줄무늬 벽지, 소파 실루엣), 상점(체커 타일, 선반), 빈 방(콘크리트). 넓은 단색면과 평행선 위주로 그려 24KB 이하를 확인한다. sRGB 색 텍스처, Clamp, 밉 켬, Compression None. 불빛은 텍스처가 아니라 셰이더에서 천장 가운데 가까울수록 밝게 더한다.',
      '단계 보기 후보: 창 칸(칸 안 좌표), 방 상자와 부딪친 면(뒷벽·바닥천장·옆벽을 다른 색, 밝기는 깊이), 방 그림 좌표, 방마다 다른 그림과 불. 마지막 단계가 최종 화면과 같으면 넣지 않는다.',
      '효과 끄기: 방 그림을 창에 그대로 붙인다 (칸 안 좌표로 같은 아틀라스 칸을 읽음). 정면에서는 그럴듯하지만 큐브가 돌아도 방 안쪽이 움직이지 않아 벽지처럼 보인다.',
      '자동 데모: 밤 정도 0 → 0.85 → 0 (12초 주기, inOutSine)와 불 켜진 비율 0.2 → 0.7. 방마다 고정 난수와 비교해 켜짐이 한 방향으로만 바뀌게 하고 여러 방이 1초 안에 몰려 켜지지 않게 주기를 길게 둔다. `flashes: false`.',
      'C# (선택) `InteriorLightsSchedule`(namespace `ShaderGallery.Samples`): 하루 시간(0~24)으로 밤 정도와 불 켜진 비율을 곡선으로 정하고 건물마다 점등 시각을 어긋나게 하는 오프셋. `renderer.material` 복사본은 `OnDestroy` 에서 지운다. 같은 머티리얼의 건물이 같은 방 배치가 되는 문제는 `adaptIdeas` 에서 다룬다.',
      '`unity.pitfalls` 후보: Batching Static 이면 `positionOS` 와 `cameraPosOS` 가 월드 기준이 되어 칸과 방이 통째로 어긋난다(도시 건물은 정적 배칭을 켜기 쉽다), 면이 오브젝트 축과 맞지 않는 메시(임포트한 건물)는 면 기저가 틀린다, 칸 경계의 밉 이음선(창틀이 덮는다, 아니면 밉 0 으로 읽는다), 큐브맵판과의 비교, XR 은 픽셀마다 시선이라 두 눈 모두 맞다(실기기 미확인), 모바일은 텍스처 한 번 읽기와 산술이라 가볍다.',
      '`inspiredBy`: 카드에서 확인된 Forza Horizon 4 (2018, Playground Games) 를 가이드 5절 형식으로 넣는다. 빌린 축은 "방 그림 아틀라스와 방마다 다른 배치", "밤에 방마다 켜지는 불". 링크는 카드의 Game Developer 글. 게임명은 `inspiredBy` 밖에 쓰지 않는다 (참고 라벨 포함). `references` 는 카드의 van Dongen 논문, Unity Shader Graph Feature Examples(Interior Cube Mapping), 저자 글 중에서 고른다.',
    ],
  },
  {
    id: 'sprite-wind-sway', name: 'SpriteWindSway', card: '33. sprite-wind-sway', bundle: 8, sample: 'sprite-outline-hit-flash', sampleNote: '2D 스프라이트 래퍼(Universal2D·UniversalForward 두 패스, UnityFlipSprite, 정점 색). 바람 식은 3D 의 `wind-sway-foliage` 참고',
    meta: '스프라이트 바람 흔들림, 그룹 E, 순서 4, 난이도 2',
    textures: ['sprite-wind-sway-grass'],
    items: [
      "무대: 스프라이트 무대, `blend: 'alpha'`, `vertex: true`, `textures: { _MainTex: { file: ... } }`(풀 덤불, 직접 생성). `stage.layers` 로 같은 덤불을 좌우에 두 장 더 놓는다 (예: position [-1.7, 0.1], [1.7, 0.1], 색만 조금 다르게). 스프라이트 무대 정점 단계는 2026-11-03 에 생겼다 (가이드 3-4절).",
      '**스프라이트 `sgVertex` 는 월드 위치를 받고 월드 위치를 돌려준다** (가이드 3-4절). Unity 는 스프라이트를 동적 배칭하면 정점을 월드로, SRP Batcher 경로에서는 오브젝트로 넘겨 오브젝트 공간을 믿을 수 없다. 래퍼: `v.positionOS = UnityFlipSprite(v.positionOS, unity_SpriteProps.xy); float3 ws = TransformObjectToWorld(v.positionOS); o.positionWS = ws; ws = sgVertex(ws, TransformObjectToWorldNormal(v.normal), v.uv, _Time.y); o.positionCS = TransformWorldToHClip(ws);`. 스프라이트 `SgInput.positionWS` 는 밀기 전 월드 위치다. 웹은 `stage.layers` 를 월드에서 옮기므로 층마다 위상이 갈린다. 웹과 Unity 촬영에서 세 덤불의 박자가 서로 다른지 본다.',
      '효과의 핵심: `swayAt(x, time)` 이 꼭대기가 옆으로 밀리는 양 S(월드 유닛)를 돌려준다: 마루가 +x 로 흐르는 느린 사인(위상은 월드 x × `_PhaseSpread`), 흘러가는 값 노이즈 돌풍으로 세기 변화, 기울기 쏠림, 더하기용 밀기 `_Push`. 정점: `ws.x += S × saturate(uv.y)` (선형 마스크라 Full Rect 든 Tight 든 같은 기울기). 픽셀: Full Rect 는 정점 4개라 정점만으로는 평행사변형으로 기울기만 하므로, `uv.x += S × (y - y²) × _Bend × (uv 폭 / 월드 폭)` 으로 되돌려 잎이 휘게 한다 (폭은 `ddx(uv.x) / ddx(positionWS.x)`, 0 나누기 막기, `#ifndef SG_VERTEX_STAGE`). uv 가 0~1 밖이면 알파 0. 색은 텍스처 × 정점 색 × `_Tint`. 조절 값: 바람 세기, 기울기 쏠림, 바람 속도, 돌풍 변화, 박자 어긋남, 휨, 밀기, 색. 프리셋: 산들바람, 폭풍, 물속 수초, 마른 갈대.',
      '텍스처: `tools/textures/sprite-wind-sway-grass.mjs` 에서 96×128 RGBA 풀 덤불 (잎 11장, 뿌리는 아래 가운데에서 부채꼴, 2차 베지어, 뿌리 짙은 초록에서 끝 연두, 한쪽 가장자리 1px 어두운 테, 4× 슈퍼샘플 안티에일리어싱). 좌우 투명 여백 14px 이상, 위 8px 이상 (픽셀 단계 휨이 옆 텍셀을 읽는다). 맨 아래 2~3행은 뿌리가 불투명하게 닿게. 투명 텍셀에도 이웃 색을 칠한다 (가이드 7절). 24KB 이하.',
      '이벤트와 데모: 이벤트 "밀기" 가 `_Push` 를 0 → 1 → -0.35 → 0.12 → 0 (1.25초, inOutSine) 로 움직이는 감쇠 진동. 자동 데모는 5초마다 밀기. 밝기 변화가 없어 `flashes: false`.',
      '단계 보기 후보: 흔들림 마스크(uv.y), 바람 값 S(왼쪽 파랑·오른쪽 주황, 세 덤불이 다른 색으로 바뀌고 돌풍이 흐른다), 곧게 기울이기만(휨 보정을 뺀 모습). 움직임 글은 burst 시트로 확인한다.',
      '효과 끄기: 마스크 없이 모든 꼭짓점을 같은 만큼 민 실수. 뿌리까지 밀려 덤불이 땅 위를 미끄러진다.',
      'C# `GrassPush2D`(namespace `ShaderGallery.Samples`): 트리거(`OnTriggerEnter2D`)와 레이어 마스크, 방향은 `attachedRigidbody.linearVelocity.x` 부호(Unity 6 이름, `velocity` 금지), 이벤트와 같은 키로 `_Push` 를 코루틴으로 움직이고 재생 중 다시 닿으면 무시(쿨다운), `renderer.material` 복사본은 `OnDestroy` 에서 지우고 `OnDisable` 에서 코루틴을 멈추고 `_Push` 를 0 으로.',
      '`mistakes`·`unity.pitfalls` 후보: 위상을 `positionOS` 나 오브젝트 원점에서 얻으면 배칭 경로에 따라 모든 풀이 같은 박자가 된다, 잎이 휘지 않고 평행사변형으로 기운다(정점 4개), 휜 잎이 잘리거나 옆 그림이 끌려온다(여백, Tight, 아틀라스), 아틀라스에 넣으면 uv 가 0~1 이 아니다(추론으로 적는다), 2D Renderer 와 Universal Renderer 의 패스, 밀어도 Bounds 는 그대로라 화면 가장자리에서 컬링될 수 있다, 픽셀 아트 반짝임, 밀기 양이 월드 단위라 Scale 과 상관없다. Unity 6.3 에서 실제로 어느 배칭 경로로 그려지는지는 확인하지 못했다고 적는다.',
      '`inspiredBy`: 빈 배열 (카드 33번: 대표작 미확인. Happy Harvest 는 Unity 샘플이라 넣지 않는다). 게임명은 어디에도 쓰지 않는다. `references` 는 카드의 Happy Harvest 소개 글, Unity 블로그(Shader Graph 움직이는 머티리얼), Unity 6.3 Sprite 임포트(Mesh Type), Unity 이슈 UUM-15015 중에서 고른다. `related` 에 `wind-sway-foliage`, `tiling-scroll-parallax`, `sprite-outline-hit-flash`.',
    ],
  },
]
