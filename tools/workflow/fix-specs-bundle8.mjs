// 묶음 8 (2026-11-03) 수정 명세. keep = 바꾸지 말 것, changed = 리뷰 뒤 앱·가이드에서 이미 바뀐 것.
//   node tools/workflow/make-fix-jobs.mjs tools/workflow/fix-specs-bundle8.mjs
const CHANGED = [
  '`meta.shotQuality`(0.4~0.75, 기본 0.75)가 생겼다: 화면을 덮는 잔무늬가 WebP 로 줄지 않는 표본만 내장 촬영 품질을 낮춘다 (가이드 7절 용량 기준).',
  '가이드 7절: 화면 전체 정지 무늬의 대비 규칙은 단계 보기 화면에도 적용한다. 비율은 종이 색까지 곱한 최종 색으로 재고 8비트 여유(예: 0.61)를 둔다. 화면 공간 격자의 가장자리는 `fwidth` 대신 칸 크기로 계산한 값으로 부드럽게 한다 (분기 안의 `fwidth` 는 Unity 경고).',
  '가이드 3-4절: 스프라이트 정점 표본은 값이 월드 유닛이라 `unity.setup` 에 Pixels Per Unit(무대 = 텍스처 높이 / 2)을 적는다. 래퍼 예시에 `UnityFlipSprite` 와 밀기 전 `o.positionWS` 가 들어갔다.',
  '가이드 4절 `cameraPosOS`: 직교 카메라에서는 시선이 카메라 정면 축과 나란하므로 `positionOS - cameraPosOS` 시선이 틀린다. 래퍼에서 `unity_OrthoParams.w > 0.5` 면 정면 축으로 바꾸거나 `unity.pitfalls` 에 적는다.',
]

export default [
  {
    id: 'screen-halftone-dots', bundle: 8,
    keep: '선형 휘도 덮임과 `sqrt` 반지름, 칸 중심 한 번 읽기, 화면비 보정 정사각 칸, CMYK 각도 `#define` 고정, 모드 셋, `time` 을 쓰지 않는 것, 효과 끄기(선형 반지름), 래퍼 구조, 빈 `inspiredBy` 는 바꾸지 않는다.',
    changed: CHANGED,
    required: [
      '**용량 (병합 차단).** 촬영이 default 64KB, comic-cmyk 86KB 로 표본당 gzip 45KB 기준의 3배를 넘는다. 웹 무대를 720×405 WebP 로 재 보니 줄 수 60 은 품질 0.75 에서 66KB, 30 은 40KB, 품질 0.5 에서 40 줄 37KB, 30 줄 30KB 였다. 기본 `_Rows` 를 36 으로 낮추고(1080p 에서 칸 30px), `captures` 와 `thumbnail` 을 빼고(기본 촬영 한 장), `shotQuality: 0.5` 를 둔다. 줄 수 hint 와 글의 칸 크기 숫자를 새 기본값에 맞춘다.',
      '**Unity 경고 7개를 없앤다.** 다른 표본은 모두 경고 0 이다. `halftoneInkFilter` 의 모드 분기 안에서 `fwidth` 와 화면 읽기를 써서 난 경고로 보인다. 점 가장자리 폭은 `fwidth(d)` 대신 분기 밖에서 구한 해석값(화면비를 보정한 칸 좌표에서 한 픽셀은 `_Rows × texelSize.y` 칸)으로 바꾼다. 화면 읽기는 분기 밖에서 한 번 하거나 LOD 0 으로 읽는다. 검증의 `unity.mjs` 출력에서 경고 0 을 확인한다.',
      '**단계 보기도 대비 규칙을 지킨다.** 단계 3 이 흰 종이에 검정 점(대비 100%)인 화면 전체 정지 점 격자다 (CMYK 단계도 하한 없이 순수 잉크를 겹친다). 단계 3 출력에 하한을 건다 (`lerp(1, 0.6, mask)` 처럼 점을 연한 회색으로, 또는 최종과 같은 잉크 하한을 거쳐). 단계 1 의 칸 경계 검정↔노랑도 어둡게 낮춘다. 본문의 "흰 종이에 검은 점" 을 고친다.',
    ],
    recommended: [
      '하한을 종이를 곱한 뒤의 비율 `L(종이 × 잉크) ≥ (1 - s) × L(종이)` 로 걸고 작은 여유(0.61)를 둔다. 지금은 0.597~0.599 로 8비트에서 60% 아래로 내려가고, 색이 강한 종이·잉크 조합은 0.57 까지 내려간다.',
      '글 정확도: 단계 1 본문과 core 173행 주석의 꼭짓점 설명 (45도에서 칸 좌표 (0,0) 은 마름모의 아래 꼭짓점, (1,1) 이 위, 빨강이 오른쪽), "하늘처럼 이미 밝은 칸 색은 그대로" (무대 하늘의 선형 밝기 0.379 는 하한 0.6 아래라 흰색 쪽으로 오른다. 그대로 남는 것은 선형 0.6 이상 하이라이트뿐이고 기본값에서 색이 옅어진다고 솔직히 적는다), `unity.verify` 의 "밝은 하늘에는 작은 점" (이 무대 하늘은 칸의 2/3 크기 점, 작은 점은 공의 밝은 윗부분), core 56행 "선형 밝기를 써야 멀리서 본 밝기가 원본과 맞는다" (잉크 세기 1 일 때만).',
      '3 픽셀 하한을 `smoothstep(3, 4, 칸 픽셀)` 로 (지금 `smoothstep(2, 3)` 이라 2.3px 칸에서 무늬가 26% 남는다).',
    ],
    shots: '기본(줄 수 36), 단계 3, 효과 끄기, CMYK 프리셋',
    budgetUsd: 6,
  },
  {
    id: 'interior-room-mapping', bundle: 8,
    textures: ['interior-room-mapping-rooms'],
    keep: '방 상자 교차(나가는 평면의 `min`, 0 나누기 막기), `normalOS` 주축 면 기저와 `cameraPosOS` 시선(리뷰에서 네 면과 웹·Unity 일치를 확인), 한 점 투시 아틀라스와 생성기의 역연산, 4px 여백, 칸 해시, 단계 1~4, 효과 끄기(그림을 그대로 붙임), C# `InteriorLightsSchedule`, `inspiredBy` 는 바꾸지 않는다.',
    changed: CHANGED,
    required: [
      '`unity.pitfalls` 의 압축 근거를 고친다: 아틀라스 칸이 128px 경계에 맞고 여백이 4px 라 BC 4×4 블록과 밉은 방 사이에 걸치지 않는다 (Unity 촬영은 압축본인데도 번지지 않았다). "ASTC 6×6 처럼 4 의 배수가 아닌 블록은 칸 경계에 걸쳐 이웃 방 색을 섞는다. BC 도 얇은 선과 넓은 단색면이 뭉개지므로 None 을 권한다" 로 쓴다.',
      '직교 카메라 (가이드 4절의 새 문장): 래퍼에서 `unity_OrthoParams.w > 0.5` 면 `cameraPosOS` 를 정면 축 기준(`positionOS - TransformWorldToObjectDir(GetViewForwardDir(), false)`)으로 바꾼다. 웹 무대는 원근 카메라라 화면은 그대로다. 아이소메트릭 도시 게임에서 쓰인다는 점과 함께 `unity.pitfalls` 에 한 줄 적는다.',
    ],
    recommended: [
      '깊은 방 촬영(`captures` 의 `deep-room`)은 무대 시작 각도(30도)에서 두 면 모두 옆벽만 보여 효과 끄기처럼 납작하다. 촬영을 상점 진열창(큰 창, 얕은 방)으로 바꾸거나 빼고, 깊은 방 프리셋 `look` 에 "정면으로 돌아올 때" 를 덧붙인다.',
      '데모 주석의 "여러 방이 1초 안에 몰려 켜지지 않는다" 를 "한 번에 한두 방씩" 으로 (보이는 방 약 18개에 최고 약 2.4방/초).',
      '"큐브맵판은 방 깊이가 상자 비율에 묶인다" 는 근거가 없으니 완화하거나 뺀다. setup 4단계에 X 와 Z 스케일이 다르면 창 수 하나로 두 쌍의 면을 모두 맞출 수 없다는 한 구절을 더한다.',
    ],
    shots: '기본, 단계 2, 효과 끄기, 바뀐 촬영 하나',
    budgetUsd: 5,
  },
  {
    id: 'sprite-wind-sway', bundle: 8,
    textures: ['sprite-wind-sway-grass'],
    keep: '래퍼의 정점 순서(UnityFlipSprite → 월드 → 밀기 전 positionWS → sgVertex → TransformWorldToHClip, 두 패스 공유), 선형 uv.y 마스크와 월드 x 위상, 픽셀 단계 휨(`ddx` 비율, 0 나누기 막기, 0~1 밖 알파 0), 풀 텍스처, 세 덤불 층, 효과 끄기, 밀기 이벤트와 C# `GrassPush2D`, 빈 `inspiredBy` 는 바꾸지 않는다. 리뷰에서 웹과 Unity 가 같게 흔들리고 뿌리가 고정됨을 확인했다.',
    changed: CHANGED,
    required: [
      '`unity.setup` 2단계에 Pixels Per Unit 64 (텍스처 높이 128 이 2 유닛)를 넣는다. 기본값 100 이면 덤불이 0.96×1.28 유닛으로 작아져 같은 값이 약 1.56 배 세게 보이고, 좌우 여백이 0.22 유닛으로 줄어 폭풍과 밀기가 겹치면 바깥 잎이 사각형 가장자리에서 잘린다. Scale 에 관한 pitfall 에 PPU 도 같은 영향이라고 덧붙인다.',
    ],
    recommended: [
      '썸네일과 폭풍 글: 돌풍이 쏠림까지 곱해 폭풍 세기가 0.44~1.56 사이에서 바뀌므로 "늘 깊이 누운" 은 보장되지 않는다. `thumbnail: \'pushed\'` 로 바꾸고 폭풍 look 에서 "늘" 을 빼고 "돌풍이 약할 때는 덜 눕는다" 로 고친다.',
      '`_Lean` hint 의 "음수면 왼쪽(바람)" 을 "쏠림만 바뀌고 돌풍은 늘 오른쪽으로 흐른다" 로 고친다.',
      '`adaptIdeas` 의 "`Shader.SetGlobalFloat` 한 줄로" 를 고친다 (`_WindStrength` 는 머티리얼 속성이라 전역 값이 덮지 못한다). "전역 바람 값을 하나 두어 날씨에 따라 바꾸고 싶다" 로.',
      '`unity.graph`: Shader Graph 의 Fragment Position(World) 은 민 뒤 위치라 위상과 폭 비율이 래퍼와 다르다. 밀기 전 x 는 Custom Interpolator 로 넘기라고 적는다. pitfall 의 "돌린 스프라이트" 에 "휨은 돌리지 않은 스프라이트 전제" 를 덧붙인다. `offNote` 에 "재생하면" 을 넣고, 웹 무대에는 땅이 없으니 "땅 위를 미끄러진다" 보다 "뿌리째 떠다닌다" 로. references 에 UUM-15015 이슈 URL 을 더한다.',
    ],
    shots: '기본, 밀기, 효과 끄기 burst',
    budgetUsd: 4,
  },
]
