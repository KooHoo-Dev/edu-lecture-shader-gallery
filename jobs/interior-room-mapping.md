---
# 묶음 8 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs interior-room-mapping
  - node tools/unity.mjs interior-room-mapping
  - node tools/shots.mjs interior-room-mapping
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/interior-room-mapping/**
  - Assets/Shaders/interior-room-mapping.meta
  - web/src/specimens/interior-room-mapping/**
  - web/src/shots/interior-room-mapping/**
  - tools/textures/interior-room-mapping-rooms.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: interior-room-mapping

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/triplanar-projection/` 와 `web/src/specimens/triplanar-projection/meta.ts` (불투명 메시, 오브젝트 공간 계산과 텍스처. 큐브 무대가 돈다). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "32. interior-room-mapping" 카드와 7절 결정 표.

## 표본별

- ID `interior-room-mapping`, 파일과 셰이더 이름 `InteriorRoomMapping`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (인테리어 매핑, 그룹 A, 순서 6, 난이도 3).
- 무대와 혼합: 메시 무대 `mesh: 'cube'`, `blend: 'cutout'`(불투명, 알파 1). 메시 무대 `SgInput.cameraPosOS`(2026-11-03 추가, 가이드 4절)로 오브젝트 공간 시선 `normalize(positionOS - cameraPosOS)` 를 만든다. 래퍼는 `TransformWorldToObject(GetCameraPositionWS())` 를 넘긴다 (`ground-aoe-indicator` 래퍼와 같은 줄). 탄젠트 입력이 없으므로 `normalOS` 의 주축으로 면 기저(오른쪽, 위, 안쪽)를 고른다. 윗면·아랫면(±Y)은 창 없는 지붕으로 둔다.
- 효과의 핵심: 면 좌표를 창 칸으로 나누고 칸마다 방 상자(가로·세로 칸 크기, 깊이는 칸 폭 × `_RoomDepth`)와 시선의 교차를 구한다 (나가는 쪽 옆벽·바닥/천장과 뒷벽까지의 거리 중 가장 가까운 것, `min`). 0 나누기를 막는다. 교차점으로 방 그림 좌표를 구해 아틀라스에서 읽는다. 칸 번호 해시로 방 종류, 좌우 반전, 불 켜짐(방마다 고정 난수 < `_LightsOn`)을 정한다. 창틀(외벽 색, `i.lighting` 을 받는다), 커튼 층(창 평면에 반투명 주름), 프레넬 유리 반사, 밤 정도(방과 외벽을 어둡게, 켜진 방은 조명 색). 조절 값: 가로·세로 창 수, 방 깊이, 창틀 두께, 외벽 색, 유리 반사, 밤, 불 켜진 비율, 조명 색, 커튼 비율. 프리셋: 사무실 낮, 밤 불빛, 상점 진열창(큰 창, 얕은 방), 깊은 방.
- 텍스처: `tools/textures/interior-room-mapping-rooms.mjs` 에서 한 점 투시 방 그림 2×2 아틀라스 256×256 (방당 128, 둘레 4 px 여백은 바깥 벽 색을 이어 칠해 밉에서 이웃 방이 번지지 않게). 방 그림은 창 자리에서 방 깊이만큼 물러난 눈으로 본 그림이라 뒷벽이 그림 가운데 절반 크기, 둘레가 바닥·천장·옆벽 사다리꼴이다. 이렇게 그리면 셰이더의 그림 좌표 식에서 깊이가 약분되어 어떤 방 깊이에도 같은 그림을 쓰고, 방 모서리에 밉 이음매가 없다. 생성기는 셰이더의 역연산(그림 좌표 → 어느 면의 어느 위치)으로 칠한다. 방 넷: 사무실(카펫 줄, 천장 격자, 화이트보드), 거실(마루, 줄무늬 벽지, 소파 실루엣), 상점(체커 타일, 선반), 빈 방(콘크리트). 넓은 단색면과 평행선 위주로 그려 24KB 이하를 확인한다. sRGB 색 텍스처, Clamp, 밉 켬, Compression None. 불빛은 텍스처가 아니라 셰이더에서 천장 가운데 가까울수록 밝게 더한다.
- 단계 보기 후보: 창 칸(칸 안 좌표), 방 상자와 부딪친 면(뒷벽·바닥천장·옆벽을 다른 색, 밝기는 깊이), 방 그림 좌표, 방마다 다른 그림과 불. 마지막 단계가 최종 화면과 같으면 넣지 않는다.
- 효과 끄기: 방 그림을 창에 그대로 붙인다 (칸 안 좌표로 같은 아틀라스 칸을 읽음). 정면에서는 그럴듯하지만 큐브가 돌아도 방 안쪽이 움직이지 않아 벽지처럼 보인다.
- 자동 데모: 밤 정도 0 → 0.85 → 0 (12초 주기, inOutSine)와 불 켜진 비율 0.2 → 0.7. 방마다 고정 난수와 비교해 켜짐이 한 방향으로만 바뀌게 하고 여러 방이 1초 안에 몰려 켜지지 않게 주기를 길게 둔다. `flashes: false`.
- C# (선택) `InteriorLightsSchedule`(namespace `ShaderGallery.Samples`): 하루 시간(0~24)으로 밤 정도와 불 켜진 비율을 곡선으로 정하고 건물마다 점등 시각을 어긋나게 하는 오프셋. `renderer.material` 복사본은 `OnDestroy` 에서 지운다. 같은 머티리얼의 건물이 같은 방 배치가 되는 문제는 `adaptIdeas` 에서 다룬다.
- `unity.pitfalls` 후보: Batching Static 이면 `positionOS` 와 `cameraPosOS` 가 월드 기준이 되어 칸과 방이 통째로 어긋난다(도시 건물은 정적 배칭을 켜기 쉽다), 면이 오브젝트 축과 맞지 않는 메시(임포트한 건물)는 면 기저가 틀린다, 칸 경계의 밉 이음선(창틀이 덮는다, 아니면 밉 0 으로 읽는다), 큐브맵판과의 비교, XR 은 픽셀마다 시선이라 두 눈 모두 맞다(실기기 미확인), 모바일은 텍스처 한 번 읽기와 산술이라 가볍다.
- `inspiredBy`: 카드에서 확인된 Forza Horizon 4 (2018, Playground Games) 를 가이드 5절 형식으로 넣는다. 빌린 축은 "방 그림 아틀라스와 방마다 다른 배치", "밤에 방마다 켜지는 불". 링크는 카드의 Game Developer 글. 게임명은 `inspiredBy` 밖에 쓰지 않는다 (참고 라벨 포함). `references` 는 카드의 van Dongen 논문, Unity Shader Graph Feature Examples(Interior Cube Mapping), 저자 글 중에서 고른다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs interior-room-mapping` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다. 움직임을 말하는 글("흐른다", "끓듯이")은 `burst` 연속 촬영 시트로 확인한다 (가이드 8절).
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
