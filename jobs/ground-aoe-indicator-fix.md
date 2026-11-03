---
# 묶음 7 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 6
verify:
  - node tools/check.mjs ground-aoe-indicator
  - node tools/unity.mjs ground-aoe-indicator
  - node tools/shots.mjs ground-aoe-indicator
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/ground-aoe-indicator/**
  - Assets/Shaders/ground-aoe-indicator.meta
  - web/src/specimens/ground-aoe-indicator/**
  - web/src/shots/ground-aoe-indicator/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: ground-aoe-indicator 리뷰 반영

`ground-aoe-indicator` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. `cameraPosOS` 로 상자 공간 씬 위치를 되살리는 식(리뷰에서 웹 격자와 Unity 촬영 위치가 같음을 확인), 상자 밖 버리기, 모양 SDF, 법선 부호를 카메라 쪽으로 맞추는 방식, 효과 끄기(옆면 감쇠 없음), `_Fill` 시전 이벤트, `GroundIndicatorCharge` 수명 주기, 빈 `inspiredBy` 는 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- `stage.zwrite: true` 가 생겼다 (가이드 4절 "알파의 뜻"): alpha 혼합 표본 중 뒤 장면을 직접 읽어 알파 1 로 덮어 그리는 표본은 래퍼의 패스 하나를 `ZWrite On` 으로 둔다. 웹도 깊이를 쓴다. 깊이 전용 패스는 따로 두지 않는다. 투명 표본은 `ShadowCaster` 패스를 두지 않는다.
- 가이드 7절: 화면 전체 정지 줄무늬의 대비는 겹친 무늬를 모두 곱한 밝기(스캔라인 × 형광체 마스크 틈)로 재고, 화면을 휘면 줄 간격을 3 픽셀 이상으로 둔다. 진행값으로 훑는 경계 띠는 순서 값이 넓은 면에서 평평하면 면 전체를 한 번에 덮어 번쩍이니 순서 값이 화면에서 고르게 바뀌게 만든다.
- 가이드 3-4절: 원판·구 매핑 텍스처는 원 바깥을 셰이더가 읽는 가장 큰 반지름의 값으로 채운다. 가이드 4절 `cameraPosOS`: 상자 공간 미분 법선은 고르지 않은 크기에서 기울기가 바뀌므로 기울기는 월드 위치(`sceneWS = positionWS - viewWS * depthDelta / abs(dot(viewWS, cross(cameraRightWS, cameraUpWS)))`)로 잰다. 가이드 5절 `unity.graph`: String 모드의 Body 에는 함수 몸체만 넣고 결과는 out 인자에 대입한다.
- 무대 옵션은 링크 `s.<옵션>=<값>` 과 `node tools/unity.mjs <id> --stage=<옵션>=<값>` 으로 시험할 수 있다 (가이드 8절). 예: `s.mesh=cube`, `s.tilt=90`.

## 필수

1. **옆면 감쇠를 월드 위치의 법선으로 잰다.** 지금은 상자 공간 위치의 `ddx`/`ddy` 로 법선을 구해, setup 이 예로 든 Scale (4, 1, 4) 같은 납작한 상자에서는 월드 경사 약 16° 부터 흐려지고 26° 를 넘으면 사라진다 (카드가 내세우는 울퉁불퉁한 지형에서 원이 비탈에서 끊긴다). 가이드 4절의 월드 복원식으로 `sceneWS` 를 구해 그 미분으로 법선을 만든다. 래퍼 `SgInput` 에 `positionWS`, `viewWS`, `cameraRightWS`, `cameraUpWS` 를 채운다 (`cameraRightWS`, `cameraUpWS` 는 `UNITY_MATRIX_V[0].xyz`, `[1].xyz`). 상자 공간 위치는 상자 밖 버리기와 모양에 그대로 쓴다. 웹에서 `--stage` 로 상자 크기를 바꿀 수는 없으니, 문턱 값과 단계 4 화면이 그대로인지 보고 Unity 에서 Scale (4,1,4) 일 때의 기대를 글로 적는다.
2. **setup 의 상자 배치 문장을 고친다.** "바닥 위에 납작하게 놓는다" 를 그대로 따르면 지면이 상자 공간 y = -0.5 에 와서 높이 감쇠가 0 이 되어 표시가 아예 안 보인다. "상자 높이의 가운데가 지면 높이에 오게 둔다 (지면이 상자를 위아래로 가르게)" 로 쓰고, `mistakes` 에 증상 "표시가 아예 안 보인다" 를 넣는다 (지금 5개라 기존 항목 하나와 합친다).

## 권장

3. 안개: 넓은 지형에 쓰는 표본인데 `unity.pitfalls` 에 Fog 가 빠졌다 (가이드 4절 "안개"). pitfalls 가 6개라 비용 항목과 합쳐 `MixFog` 안내를 넣는다.
4. 글을 화면에 맞춘다: `offNote` 의 "공의 옆면을 타고 세로 줄무늬로" (공에는 작은 얼룩뿐, 줄무늬는 소품 앞면에서만 분명하다), 단계 1 의 "격자가 소품과 공의 옆면으로 끊김 없이 이어지고" (공 조각은 화면에서 바닥 격자와 떨어져 있다), 실수 3 의 "법선이 1~2 픽셀 틀어지는 정도는 눈에 잘 띄지 않는다" (최종 화면에서 소품이 바닥에 닿는 선에 점선처럼 끊긴 주황 줄이 보인다. 단계 4 의 "계단져 보인다" 와도 어긋난다).
5. `unity.graph`: String 모드 Body 에는 함수 몸체만 넣고, `groundAoePie` 의 `return` 은 out 대입으로 바꾼다 (가이드 5절).

## 끝내기 전에

1. `node tools/check.mjs ground-aoe-indicator` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 단계 4, 효과 끄기, 시전 burst 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
