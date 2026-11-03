---
# 묶음 7 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 7
verify:
  - node tools/check.mjs screen-crt-scanline
  - node tools/unity.mjs screen-crt-scanline
  - node tools/shots.mjs screen-crt-scanline
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/screen-crt-scanline/**
  - Assets/Shaders/screen-crt-scanline.meta
  - web/src/specimens/screen-crt-scanline/**
  - web/src/shots/screen-crt-scanline/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: screen-crt-scanline 리뷰 반영

`screen-crt-scanline` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 정수 픽셀 줄 간격이라는 방식, 줄 중심 샘플과 빔 프로필, 마스크 세 종류, 배럴 왜곡과 부드러운 검은 테, 7 초 주기 롤링 띠의 고정 속도와 상한, 전원 끄기 곡선과 `flashes: true`, 휘도를 유지하며 채도만 빼는 전원 끄기, C# 제한기(static 마지막 시각, `Time.unscaledTime`, `Mathf.Max(minInterval, 0.34f)`), `inspiredBy` 는 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- `stage.zwrite: true` 가 생겼다 (가이드 4절 "알파의 뜻"): alpha 혼합 표본 중 뒤 장면을 직접 읽어 알파 1 로 덮어 그리는 표본은 래퍼의 패스 하나를 `ZWrite On` 으로 둔다. 웹도 깊이를 쓴다. 깊이 전용 패스는 따로 두지 않는다. 투명 표본은 `ShadowCaster` 패스를 두지 않는다.
- 가이드 7절: 화면 전체 정지 줄무늬의 대비는 겹친 무늬를 모두 곱한 밝기(스캔라인 × 형광체 마스크 틈)로 재고, 화면을 휘면 줄 간격을 3 픽셀 이상으로 둔다. 진행값으로 훑는 경계 띠는 순서 값이 넓은 면에서 평평하면 면 전체를 한 번에 덮어 번쩍이니 순서 값이 화면에서 고르게 바뀌게 만든다.
- 가이드 3-4절: 원판·구 매핑 텍스처는 원 바깥을 셰이더가 읽는 가장 큰 반지름의 값으로 채운다. 가이드 4절 `cameraPosOS`: 상자 공간 미분 법선은 고르지 않은 크기에서 기울기가 바뀌므로 기울기는 월드 위치(`sceneWS = positionWS - viewWS * depthDelta / abs(dot(viewWS, cross(cameraRightWS, cameraUpWS)))`)로 잰다. 가이드 5절 `unity.graph`: String 모드의 Body 에는 함수 몸체만 넣고 결과는 out 인자에 대입한다.
- 무대 옵션은 링크 `s.<옵션>=<값>` 과 `node tools/unity.mjs <id> --stage=<옵션>=<값>` 으로 시험할 수 있다 (가이드 8절). 예: `s.mesh=cube`, `s.tilt=90`.

## 필수

1. **기본 화면의 맥놀이 띠 (표본의 핵심 결함).** 웹 무대 높이 560 / 224 = 2.5 가 float 오차로 2 픽셀 간격이 되고, `fwidth(lineCoord)` 가 평평한 화면에서도 0.5 라 대비가 설계의 절반 아래로 깎이며, 휨이 더해진 2 픽셀 간격은 줄이 사라졌다 나타나는 띠를 만든다 (가운데 열 대비 2~14% 를 오가고 양옆은 거의 줄이 없다). 고친다: 화면 높이 픽셀 수를 `floor(1 / texelSize.y + 0.5)` 로 정수화, 휨이 있으면 최소 간격 3 픽셀 (가이드 7절의 새 규칙), `fwidth` 억제는 기대값 `1 / 간격` 을 넘는 만큼만 대비를 줄인다. 기본 `_Lines` 는 560·720·1080 이 반올림 경계에 걸리지 않는 값(예: 200 이면 3·4·5 픽셀)으로 바꾼다. hint 와 goals 의 "목표 줄 수에 가장 가깝게" 는 간격 반올림이라 맞지 않으니 고친다.
2. **효과 끄기가 모아레를 보여 주게.** 지금은 560 이 224 의 정확히 2.5 배라 끄기 쪽이 5 행마다 똑같이 반복되어 오히려 고르고 진하다. 위 기본값 변경 뒤(예: 200 줄 → 2.8 픽셀) 끄기 화면을 다시 찍어 몇 줄마다 사라졌다 나타나는 굵은 띠가 가운데에서도 보이는지 확인하고 `offNote` 를 화면에 맞춘다.
3. **용량.** `old-tv` 촬영이 25KB 로 16KB 경고를 넘고, 세 장 합이 46KB 라 표본당 gzip 45KB 예산을 넘기 쉽다. `old-tv` 촬영을 빼거나 마스크 없는 상태로 바꾼다. `captures` 는 두 장 이내.
4. **`PowerOff` 를 재생 중에 다시 부르면 처음부터 다시 시작한다.** 0.34 초 뒤 다시 부르면 눌린 화면이나 검은 화면이 한 프레임 만에 원래 화면으로 튀어 초당 약 3회 완전 검정과 원래 화면을 오갈 수 있고, 앞 호출의 `onBlack` 은 불리지 않는다. `IsPlaying` 이면 무시하고 false 를 돌려준다. `PowerEffectEnabled=false` 나 `OnDisable` 로 재생이 끊길 때 `IsPlaying` 을 false 로 두고 기다리던 콜백 처리를 정한다.
5. **씬 전환 경로.** `onBlack` 에서 `SceneManager.LoadScene` 을 하면 컨트롤러가 사라지며 `OnDisable` 이 `_PowerOff=0` 으로 되돌려 검정에서 원래 화면이 튀어나온다. `screen-transition-wipe` 의 `ScreenTransitionController` 처럼 `DontDestroyOnLoad` 단일 인스턴스로 바꾸거나, 추가(Additive) 로드만 쓰라고 setup 에 적는다. verify 와 `adaptIdeas` 의 "다시 켜진다" 문장을 실제 동작에 맞춘다.
6. **슬롯 마스크와 겹친 대비.** 슬롯 틈 행이 모든 채널에 `1 - 세기` 를 곱해 가로 무늬가 하나 더 생겨, 상한(_Scan 0.4, 마스크 0.5)에서는 가로 밝기가 0.6 × 0.5 = 30% 까지 내려가 가이드 7절(겹친 무늬의 곱이 60% 이상)을 어긴다. 오래된 TV 프리셋도 약 54% 다. 스캔라인과 슬롯 틈의 곱이 0.6 이상이 되게 코드에서 함께 자르고, 글의 "60%" 주장을 실제와 맞춘다.

## 권장

7. 2단계의 "윤곽이 세로로 계단진다" 와 기본 마스크 0.15 에서 3·4단계가 거의 같아 보이는 점을 새 기본값으로 다시 찍어 글을 맞춘다.
8. `_Roll` 이 1 이어도 8% 라 슬라이더 차이가 거의 안 보인다. 그대로 두되 hint 에 "작게 고정" 이유를 적는다.

## 끝내기 전에

1. `node tools/check.mjs screen-crt-scanline` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본(웹 기본 크기), 효과 끄기, 평면 화면 프리셋, 전원 끄기 burst 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
