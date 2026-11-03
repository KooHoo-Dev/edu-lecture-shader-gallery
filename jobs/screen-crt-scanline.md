---
# 묶음 7 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
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

# 표본 구현: screen-crt-scanline

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/screen-vignette/` 와 `web/src/specimens/screen-vignette/meta.ts` (전체 화면 무대와 번쩍임 제한기가 있는 C# 연출. UV 휨과 Clamp 샘플러는 `screen-shockwave-distortion` 참고). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "30. screen-crt-scanline" 카드와 7절 결정 표.

## 표본별

- ID `screen-crt-scanline`, 파일과 셰이더 이름 `ScreenCrtScanline`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (CRT 화면 필터, 그룹 G, 순서 4, 난이도 2).
- 무대: 전체 화면 무대, `stage.bright: true` (어두운 무대에서는 줄과 마스크가 묻힌다). Requirements 없음. 하프톤은 넣지 않는다 (카드 30번 비고).
- 안전(먼저 읽을 것): 가이드 7절 "화면 전체를 덮는 정지 줄무늬" 규칙을 따른다. 기본값에서 어두운 줄이 밝은 줄의 60% 이상 밝기, 프레임마다 줄을 바꾸는 인터레이스와 흘러가는 스캔라인은 쓰지 않는다. 느린 밝은 띠(`_Roll`)를 넣는다면 한 개의 넓고 흐린 띠가 4초 이상에 한 번 지나가게 속도를 코드에서 고정하고 세기 상한을 낮게(밝기 변화 10% 미만) 둔다. `unity.pitfalls` 에 게임 옵션으로 끌 수 있게 하라고 적는다.
- 효과의 핵심: (1) 화면 높이(`texelSize`)로 줄 간격을 정수 픽셀(최소 2)로 맞추고 목표 줄 수 `_Lines`(기본 224)에 가깝게 한다. (2) 각 줄의 중심 높이에서 화면 색을 읽고 빔 프로필로 줄 사이를 어둡게 한다 (`_Scan`). (3) 픽셀 열 번호로 RGB 형광체 마스크(select: 없음, 세로 줄, 슬롯, 세기는 `showWhen`). (4) 화면비를 보정한 배럴 왜곡(`_Curve`)과 화면 밖은 부드러운 검은 테. (5) 가로 3탭 색 번짐, 밝기 보정 `_Boost`(줄과 마스크로 잃은 밝기를 곱으로 되돌림), 비네트. 휜 줄이나 너무 촘촘한 줄은 `fwidth` 로 대비를 낮춰 모아레를 줄인다.
- 이벤트: "전원 끄기" 가 이벤트 전용 값 `_PowerOff` 를 0→1→0 으로 움직인다 (세로로 눌려 가로선, 점, 검정, 다시 켜짐). 넓은 면이 꺼졌다 켜지므로 `flashes: true`. 꺼질 때 가로선이 원래 화면보다 밝아지지 않게 상한을 둔다. 자동 데모는 이 이벤트를 8초 이상 간격으로만 쓰거나, 쓰지 않고 곡률·마스크 값 루프(느리고 작게)를 둔다.
- 프리셋: 아케이드 모니터(세로 줄 마스크, 약한 곡률, 선명한 줄), 오래된 TV(슬롯, 강한 곡률, 번짐, 비네트), 평면 화면 스캔라인(곡률 0, 마스크 없음, 가장 가볍고 UI 가 읽기 쉽다).
- 단계 보기 후보: 휜 좌표(화면 밖은 검정), 줄 중심에서 읽은 화면(세로로 계단진 그림), 빔 마스크(회색), 형광체 마스크. 마지막 단계가 최종 화면과 같으면 넣지 않는다.
- 효과 끄기: 줄 수를 uv 에 바로 곱한 고정 스캔라인 (`sin(uv.y * _Lines * 2π)` 류). 화면 높이가 줄 수의 정수배가 아니라 줄 굵기가 들쭉날쭉하고 굵은 띠(모아레)가 생긴다. 웹에서 창 크기를 바꾸면 띠가 움직인다. 이 분기도 안전 규칙(대비)을 지킨다.
- C# 스크립트 `CrtPowerController`(namespace `ShaderGallery.Samples`): `screen-vignette` 의 컨트롤러처럼 Full Screen Pass 머티리얼 에셋의 `_PowerOff` 를 코루틴으로 움직이고 `OnDisable` 에서 0 으로 되돌린다. 인스턴스 하나만 두고, 마지막 시각을 `static` 으로 `Time.unscaledTime` 기준 `Mathf.Max(minInterval, 0.34f)` 제한기를 둔다 (가이드 6·7절). 웹 이벤트 트랙과 같은 곡선.
- `unity.pitfalls` 후보: Screen Space - Overlay 캔버스는 이 패스 뒤에 그려져 필터가 걸리지 않는다(걸려면 Screen Space - Camera), Bloom 이 있으면 Before Rendering Post Processing 에서는 마스크 무늬가 번지므로 After Rendering Post Processing 을 권하되 그 지점과 FXAA·업스케일의 순서는 확인하지 않았다고 적는다, 렌더 스케일이 1 이 아니면 픽셀에 맞춘 줄이 다시 샘플되어 모아레가 생길 수 있다(미확인), 배속을 따르는 값, XR 은 끄기를 권하고 모니터 메시에 렌더 텍스처로 입히는 방법을 `adaptIdeas` 에.
- 용량: 화면을 덮는 잔무늬라 촬영이 16KB 경고를 넘기 쉽다. 기본값의 마스크를 약하게 두고 `captures` 는 두 장 이내(오래된 TV, 평면 화면)로 한다.
- `inspiredBy`: 카드에서 확인된 Teenage Mutant Ninja Turtles: Shredder's Revenge (2022, Tribute Games) 를 가이드 5절 형식으로 넣는다. 빌린 축은 "옵션 메뉴에서 켜고 끄는 일반·곡면 CRT 필터". 링크는 카드의 업데이트 보도 자료. 게임명은 `inspiredBy` 밖에 쓰지 않는다. `references` 는 카드의 libretro CRT 문서, crt-royale 문서, libretro 포럼 곡률·모아레 스레드 중에서 고른다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs screen-crt-scanline` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다. 움직임을 말하는 글("흐른다", "끓듯이")은 `burst` 연속 촬영 시트로 확인한다 (가이드 8절).
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
