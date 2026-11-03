---
# 묶음 7 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 6
verify:
  - node tools/check.mjs matcap-lit-sphere
  - node tools/unity.mjs matcap-lit-sphere
  - node tools/shots.mjs matcap-lit-sphere
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/matcap-lit-sphere/**
  - Assets/Shaders/matcap-lit-sphere.meta
  - web/src/specimens/matcap-lit-sphere/**
  - web/src/shots/matcap-lit-sphere/**
  - tools/textures/matcap-lit-sphere-spheres.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: matcap-lit-sphere 리뷰 반영

`matcap-lit-sphere` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 화면 법선 계산과 원근 보정 기저(`r = cross(up, d)`, `u = cross(d, r)`, 리뷰에서 웹과 Unity 의 빛 방향이 같음을 확인), 래퍼의 `UNITY_MATRIX_V` 두 줄과 패스 구조, 채널 묶음 텍스처 방식과 임포트 설정(sRGB 끔, Clamp, 압축 없음), 단계 1~3 구성, 효과 끄기(오브젝트 공간 법선), 빈 `inspiredBy` 는 바꾸지 않는다. ★1 기초편이다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- `stage.zwrite: true` 가 생겼다 (가이드 4절 "알파의 뜻"): alpha 혼합 표본 중 뒤 장면을 직접 읽어 알파 1 로 덮어 그리는 표본은 래퍼의 패스 하나를 `ZWrite On` 으로 둔다. 웹도 깊이를 쓴다. 깊이 전용 패스는 따로 두지 않는다. 투명 표본은 `ShadowCaster` 패스를 두지 않는다.
- 가이드 7절: 화면 전체 정지 줄무늬의 대비는 겹친 무늬를 모두 곱한 밝기(스캔라인 × 형광체 마스크 틈)로 재고, 화면을 휘면 줄 간격을 3 픽셀 이상으로 둔다. 진행값으로 훑는 경계 띠는 순서 값이 넓은 면에서 평평하면 면 전체를 한 번에 덮어 번쩍이니 순서 값이 화면에서 고르게 바뀌게 만든다.
- 가이드 3-4절: 원판·구 매핑 텍스처는 원 바깥을 셰이더가 읽는 가장 큰 반지름의 값으로 채운다. 가이드 4절 `cameraPosOS`: 상자 공간 미분 법선은 고르지 않은 크기에서 기울기가 바뀌므로 기울기는 월드 위치(`sceneWS = positionWS - viewWS * depthDelta / abs(dot(viewWS, cross(cameraRightWS, cameraUpWS)))`)로 잰다. 가이드 5절 `unity.graph`: String 모드의 Body 에는 함수 몸체만 넣고 결과는 out 인자에 대입한다.
- 무대 옵션은 링크 `s.<옵션>=<값>` 과 `node tools/unity.mjs <id> --stage=<옵션>=<값>` 으로 시험할 수 있다 (가이드 8절). 예: `s.mesh=cube`, `s.tilt=90`.

## 필수

1. **sRGB 안내를 둘로 나눈다** (goals, `unity.setup`, `unity.pitfalls`, 단계·실수 글 전체). 지금 글은 "매트캡 텍스처는 sRGB 를 꺼야 한다" 처럼 일반화되어 있는데, 그림으로 받은 컬러 매트캡은 sRGB 를 켜야 색이 맞는다 (끄면 허옇게 뜬다). "이 표본의 채널 묶음 매트캡(회색조 값을 채널에 담은 데이터)은 sRGB 끔, 그림으로 받은 컬러 매트캡 한 장은 sRGB 켬" 으로 쓴다. "채널마다 다른 그림을 담았으므로 sRGB 도 끈다" 는 이유는 틀렸다 (sRGB 는 값을 어떻게 부호화했느냐의 문제다). `adaptIdeas` 의 컬러 매트캡 문장과 맞춘다.
2. **원판 바깥 채우기를 셰이더가 읽는 반지름으로.** 텍스처 모듈은 원판 밖을 반지름 0.999 의 값으로 늘려 칠하는데, 크롬(B) 수평선 띠가 그 가장자리에서 한 텍셀보다 얇은 고리를 이뤄 아래쪽 바깥이 B≈200~240 으로 밝다 (바로 안쪽은 ≈6). Bilinear 와 밉이 이 값을 끌어와 Unity 크롬 촬영의 왼쪽 아래 윤곽에 밝은 호가 생긴다. 반지름이 0.98 을 넘는 텍셀은 같은 방향 0.98 의 값으로 채운다 (예: `if (r > 0.98) { x *= 0.98 / r; y *= 0.98 / r }` 로 좌표를 당긴 뒤 계산). PNG 를 다시 만들어 크롬 공 아래 윤곽에 밝은 테가 없는지 웹과 Unity 촬영으로 본다.

## 권장

3. 크롬 채널이 금속처럼 보이게 값 범위를 고친다: 하늘을 위쪽 절반 내내 0.95 로 평평하게 두지 말고 0.45→0.75 쯤 그라데이션, 작은 해 반사점은 1.0, 땅은 더 어둡게. 지금은 반사점이 255 에서 잘려 주변과 5% 차이뿐이라 흰 플라스틱 공처럼 보인다. 고친 뒤 모듈 주석의 "작은 날카로운 반사점" 이 화면에 보이는지 확인한다.
4. 1단계 본문: 기본값(`_Perspective` 켬)에서는 픽셀마다 다시 세운 축의 값이 나온다는 구절을 더한다.
5. `_RimPulse` hint 의 "스크립트로 올렸다 내린다" 를 고친다 (C# 이 없다). `_RimColor` 기본값을 중립색으로 바꾸고 옥 프리셋에 민트 테두리 색을 명시해, 기본 점토에 민트 테두리가 뜨지 않게 한다. 자동 데모가 기본 화면의 인상을 바꾸지 않는지 `auto=1` 연속 촬영으로 본다.
6. 효과 끄기가 정지 화면에서도 실수로 보이게 `stage.tilt` (예: 90) 를 검토한다. 구는 최종 화면이 회전과 상관없어 그대로이고, 효과 끄기만 빛이 엉뚱한 옆면에 붙는다. 넣으면 `offNote` 를 그 화면에 맞춘다.
7. Unity 래퍼가 쓰지 않는 `normalOS` varying 을 뺀다 (웹 전용 `SG_OFF` 분기만 쓴다). 큐브(`s.mesh=cube`, `--stage=mesh=cube`)에서 모서리에 밉 이음선이 보이면 `unity.pitfalls` 에 적는다.

## 끝내기 전에

1. `node tools/check.mjs matcap-lit-sphere` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 크롬 프리셋, 효과 끄기, `s.mesh=cube` 기본 한 장 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
