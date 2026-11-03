---
# 묶음 8 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs sprite-wind-sway
  - node tools/unity.mjs sprite-wind-sway
  - node tools/shots.mjs sprite-wind-sway
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/sprite-wind-sway/**
  - Assets/Shaders/sprite-wind-sway.meta
  - web/src/specimens/sprite-wind-sway/**
  - web/src/shots/sprite-wind-sway/**
  - tools/textures/sprite-wind-sway-grass.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: sprite-wind-sway

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/sprite-outline-hit-flash/` 와 `web/src/specimens/sprite-outline-hit-flash/meta.ts` (2D 스프라이트 래퍼(Universal2D·UniversalForward 두 패스, UnityFlipSprite, 정점 색). 바람 식은 3D 의 `wind-sway-foliage` 참고). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "33. sprite-wind-sway" 카드와 7절 결정 표.

## 표본별

- ID `sprite-wind-sway`, 파일과 셰이더 이름 `SpriteWindSway`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (스프라이트 바람 흔들림, 그룹 E, 순서 4, 난이도 2).
- 무대: 스프라이트 무대, `blend: 'alpha'`, `vertex: true`, `textures: { _MainTex: { file: ... } }`(풀 덤불, 직접 생성). `stage.layers` 로 같은 덤불을 좌우에 두 장 더 놓는다 (예: position [-1.7, 0.1], [1.7, 0.1], 색만 조금 다르게). 스프라이트 무대 정점 단계는 2026-11-03 에 생겼다 (가이드 3-4절).
- **스프라이트 `sgVertex` 는 월드 위치를 받고 월드 위치를 돌려준다** (가이드 3-4절). Unity 는 스프라이트를 동적 배칭하면 정점을 월드로, SRP Batcher 경로에서는 오브젝트로 넘겨 오브젝트 공간을 믿을 수 없다. 래퍼: `v.positionOS = UnityFlipSprite(v.positionOS, unity_SpriteProps.xy); float3 ws = TransformObjectToWorld(v.positionOS); o.positionWS = ws; ws = sgVertex(ws, TransformObjectToWorldNormal(v.normal), v.uv, _Time.y); o.positionCS = TransformWorldToHClip(ws);`. 스프라이트 `SgInput.positionWS` 는 밀기 전 월드 위치다. 웹은 `stage.layers` 를 월드에서 옮기므로 층마다 위상이 갈린다. 웹과 Unity 촬영에서 세 덤불의 박자가 서로 다른지 본다.
- 효과의 핵심: `swayAt(x, time)` 이 꼭대기가 옆으로 밀리는 양 S(월드 유닛)를 돌려준다: 마루가 +x 로 흐르는 느린 사인(위상은 월드 x × `_PhaseSpread`), 흘러가는 값 노이즈 돌풍으로 세기 변화, 기울기 쏠림, 더하기용 밀기 `_Push`. 정점: `ws.x += S × saturate(uv.y)` (선형 마스크라 Full Rect 든 Tight 든 같은 기울기). 픽셀: Full Rect 는 정점 4개라 정점만으로는 평행사변형으로 기울기만 하므로, `uv.x += S × (y - y²) × _Bend × (uv 폭 / 월드 폭)` 으로 되돌려 잎이 휘게 한다 (폭은 `ddx(uv.x) / ddx(positionWS.x)`, 0 나누기 막기, `#ifndef SG_VERTEX_STAGE`). uv 가 0~1 밖이면 알파 0. 색은 텍스처 × 정점 색 × `_Tint`. 조절 값: 바람 세기, 기울기 쏠림, 바람 속도, 돌풍 변화, 박자 어긋남, 휨, 밀기, 색. 프리셋: 산들바람, 폭풍, 물속 수초, 마른 갈대.
- 텍스처: `tools/textures/sprite-wind-sway-grass.mjs` 에서 96×128 RGBA 풀 덤불 (잎 11장, 뿌리는 아래 가운데에서 부채꼴, 2차 베지어, 뿌리 짙은 초록에서 끝 연두, 한쪽 가장자리 1px 어두운 테, 4× 슈퍼샘플 안티에일리어싱). 좌우 투명 여백 14px 이상, 위 8px 이상 (픽셀 단계 휨이 옆 텍셀을 읽는다). 맨 아래 2~3행은 뿌리가 불투명하게 닿게. 투명 텍셀에도 이웃 색을 칠한다 (가이드 7절). 24KB 이하.
- 이벤트와 데모: 이벤트 "밀기" 가 `_Push` 를 0 → 1 → -0.35 → 0.12 → 0 (1.25초, inOutSine) 로 움직이는 감쇠 진동. 자동 데모는 5초마다 밀기. 밝기 변화가 없어 `flashes: false`.
- 단계 보기 후보: 흔들림 마스크(uv.y), 바람 값 S(왼쪽 파랑·오른쪽 주황, 세 덤불이 다른 색으로 바뀌고 돌풍이 흐른다), 곧게 기울이기만(휨 보정을 뺀 모습). 움직임 글은 burst 시트로 확인한다.
- 효과 끄기: 마스크 없이 모든 꼭짓점을 같은 만큼 민 실수. 뿌리까지 밀려 덤불이 땅 위를 미끄러진다.
- C# `GrassPush2D`(namespace `ShaderGallery.Samples`): 트리거(`OnTriggerEnter2D`)와 레이어 마스크, 방향은 `attachedRigidbody.linearVelocity.x` 부호(Unity 6 이름, `velocity` 금지), 이벤트와 같은 키로 `_Push` 를 코루틴으로 움직이고 재생 중 다시 닿으면 무시(쿨다운), `renderer.material` 복사본은 `OnDestroy` 에서 지우고 `OnDisable` 에서 코루틴을 멈추고 `_Push` 를 0 으로.
- `mistakes`·`unity.pitfalls` 후보: 위상을 `positionOS` 나 오브젝트 원점에서 얻으면 배칭 경로에 따라 모든 풀이 같은 박자가 된다, 잎이 휘지 않고 평행사변형으로 기운다(정점 4개), 휜 잎이 잘리거나 옆 그림이 끌려온다(여백, Tight, 아틀라스), 아틀라스에 넣으면 uv 가 0~1 이 아니다(추론으로 적는다), 2D Renderer 와 Universal Renderer 의 패스, 밀어도 Bounds 는 그대로라 화면 가장자리에서 컬링될 수 있다, 픽셀 아트 반짝임, 밀기 양이 월드 단위라 Scale 과 상관없다. Unity 6.3 에서 실제로 어느 배칭 경로로 그려지는지는 확인하지 못했다고 적는다.
- `inspiredBy`: 빈 배열 (카드 33번: 대표작 미확인. Happy Harvest 는 Unity 샘플이라 넣지 않는다). 게임명은 어디에도 쓰지 않는다. `references` 는 카드의 Happy Harvest 소개 글, Unity 블로그(Shader Graph 움직이는 머티리얼), Unity 6.3 Sprite 임포트(Mesh Type), Unity 이슈 UUM-15015 중에서 고른다. `related` 에 `wind-sway-foliage`, `tiling-scroll-parallax`, `sprite-outline-hit-flash`.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs sprite-wind-sway` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다. 움직임을 말하는 글("흐른다", "끓듯이")은 `burst` 연속 촬영 시트로 확인한다 (가이드 8절).
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
