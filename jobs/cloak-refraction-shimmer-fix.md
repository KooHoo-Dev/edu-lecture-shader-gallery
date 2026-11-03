---
# 묶음 7 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 7
verify:
  - node tools/check.mjs cloak-refraction-shimmer
  - node tools/unity.mjs cloak-refraction-shimmer
  - node tools/shots.mjs cloak-refraction-shimmer
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/cloak-refraction-shimmer/**
  - Assets/Shaders/cloak-refraction-shimmer.meta
  - web/src/specimens/cloak-refraction-shimmer/**
  - web/src/shots/cloak-refraction-shimmer/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: cloak-refraction-shimmer 리뷰 반영

`cloak-refraction-shimmer` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 굴절과 앞 물체 가드, 진행값 하나로 섞기와 띠, 마스크 방식 세 가지, 더하기용 `_Reveal` 이벤트, 조명 필드를 채우는 래퍼 줄(3인자 `GetMainLight`), 단계 1~4 구성, 효과 끄기(알파 페이드), `inspiredBy` 는 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- `stage.zwrite: true` 가 생겼다 (가이드 4절 "알파의 뜻"): alpha 혼합 표본 중 뒤 장면을 직접 읽어 알파 1 로 덮어 그리는 표본은 래퍼의 패스 하나를 `ZWrite On` 으로 둔다. 웹도 깊이를 쓴다. 깊이 전용 패스는 따로 두지 않는다. 투명 표본은 `ShadowCaster` 패스를 두지 않는다.
- 가이드 7절: 화면 전체 정지 줄무늬의 대비는 겹친 무늬를 모두 곱한 밝기(스캔라인 × 형광체 마스크 틈)로 재고, 화면을 휘면 줄 간격을 3 픽셀 이상으로 둔다. 진행값으로 훑는 경계 띠는 순서 값이 넓은 면에서 평평하면 면 전체를 한 번에 덮어 번쩍이니 순서 값이 화면에서 고르게 바뀌게 만든다.
- 가이드 3-4절: 원판·구 매핑 텍스처는 원 바깥을 셰이더가 읽는 가장 큰 반지름의 값으로 채운다. 가이드 4절 `cameraPosOS`: 상자 공간 미분 법선은 고르지 않은 크기에서 기울기가 바뀌므로 기울기는 월드 위치(`sceneWS = positionWS - viewWS * depthDelta / abs(dot(viewWS, cross(cameraRightWS, cameraUpWS)))`)로 잰다. 가이드 5절 `unity.graph`: String 모드의 Body 에는 함수 몸체만 넣고 결과는 out 인자에 대입한다.
- 무대 옵션은 링크 `s.<옵션>=<값>` 과 `node tools/unity.mjs <id> --stage=<옵션>=<값>` 으로 시험할 수 있다 (가이드 8절). 예: `s.mesh=cube`, `s.tilt=90`.

## 필수

1. **패스를 하나로 합치고 `stage.zwrite: true` 를 쓴다.** 지금 래퍼는 lint 를 피하려고 깊이 전용 `SRPDefaultUnlit` 패스를 따로 두었다. 알파 1 로 덮어 그리면 Forward 패스 하나에 `ZWrite On` 이면 결과가 같고, 깊이 패스는 그리기를 늘리고 `SRPDefaultUnlit` 자리를 차지해 외곽선·실루엣 패스와 태그가 부딪친다. 래퍼를 Forward 패스 하나(`ZWrite On`, `Blend SrcAlpha OneMinusSrcAlpha`)로 합치고 meta 에 `zwrite: true` 를 둔다. 주석 130행 근처의 "투명 목록에서도 SRPDefaultUnlit 이 먼저 그려진다" 와 실수 4 의 "몸통이 팔 위에 칠해지지 않게 했다" 는 확인되지 않은 주장이니 지운다. 자기 겹침이 정리되는지는 `s.mesh=torus`(웹)와 `--stage=mesh=torus`(Unity 촬영은 구독 세션이 한다)로 볼 수 있다고만 적는다.
2. **`ShadowCaster` 패스를 뺀다** (가이드 4절: 투명 표본은 그림자 패스를 두지 않는다). 촬영 도구는 C# 없이 찍어 은신한 촬영에도 캡슐 그림자가 남았고, 썸네일의 숨은 아래쪽이 자기 그림자를 비춰 검게 보였다. `CloakController` 의 그림자 처리(`shadowCastingMode`)도 뺀다. 대신 `unity.pitfalls` 와 `adaptIdeas` 에 "이 머티리얼은 그림자를 만들지 않는다. 보이는 동안 그림자가 필요하면 평소에는 불투명 Lit 머티리얼을 쓰고 은신할 때만 이 머티리얼로 바꾼다 (바꾸는 순간 그림자도 사라진다)" 를 적는다. 실수 5(바닥에 그림자가 걸어 다닌다)는 이 방식에 맞게 고치거나 다른 실수로 바꾼다.

## 권장

3. 프레넬 안쪽부터, 노이즈 디졸브 마스크에서 경계 띠가 정면 넓은 면을 한꺼번에 덮는다 (가이드 7절의 새 주의). 프레넬 모드의 순서 값을 `sqrt(saturate(1.0 - facing * facing))` 처럼 화면에서 고르게 바뀌는 값으로 바꾸고, 노이즈 모드도 값이 0.5 근처에 몰리지 않게 넓힌다. `SetCloaked` 연타에도 띠가 3Hz 를 넘지 않게 하거나(전환 중 무시) `unity.pitfalls` 에 적는다. burst 로 띠가 고르게 지나가는지 본다.
4. `learned` 에 빌린 축 "같은 편에게는 최대 투명도를 제한" 의 근거 한 문장을 더한다: Valve 공개 TF2 클라이언트 코드의 `tf_teammate_max_invis` 기본값 0.95.
5. `CloakController` 가 `_Cloak` 이 없는 Renderer(무기의 Lit, 파티클, 트레일)까지 `materials` 복사본을 만든다. `sharedMaterials` 로 먼저 확인해 `_Cloak` 이 있는 Renderer 만 복사한다.
6. 글: `offNote` 의 "몸 뒷면" → "몸 뒤쪽에 겹친 부분" (Cull Back 이라 뒷면은 그려지지 않는다), 단계 2 의 "발(바닥 아래)" → "발(아래 끝)", `_CalmAtFull` hint 에 "은신 0.6 이상에서만 차이가 난다", pitfall 의 "밝기를 낮게(기본 1)" 를 실제 값에 맞게. "잔결이 빠르게 흘러 오른다" 같은 움직임 글은 해당 프리셋 burst 로 확인한다.

## 끝내기 전에

1. `node tools/check.mjs cloak-refraction-shimmer` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 은신 1, 효과 끄기, 프레넬 모드 burst 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
