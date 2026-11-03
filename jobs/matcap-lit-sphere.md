---
# 묶음 7 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
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

# 표본 구현: matcap-lit-sphere

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/fresnel-rim-glow/` 와 `web/src/specimens/fresnel-rim-glow/meta.ts` (조명 없이 시선·법선으로 칠하는 메시. 래퍼가 카메라 축을 넘기는 줄은 `screen-refraction-glass` 래퍼에 있다). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "27. matcap-lit-sphere" 카드와 7절 결정 표.

## 표본별

- ID `matcap-lit-sphere`, 파일과 셰이더 이름 `MatcapLitSphere`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (매트캡, 그룹 A, 순서 5, 난이도 1).
- **가장 싼 재질 표현의 기초편이다 (★1).** 빛을 그린 공 그림 한 장을 화면 기준 법선으로 읽어 입체감을 낸다. 해설은 쉽게 쓰고, 조명이 텍스처에 구워져 있어 해를 돌려도 그대로라는 점을 `toon-ramp-lit`(빛을 따르는 음영)과 대비해 설명한다.
- 무대와 혼합: 메시 무대 `mesh: 'sphere'`, `blend: 'cutout'`(불투명). 메시 무대 `SgInput` 의 `cameraRightWS`, `cameraUpWS`(2026-11-03 추가, 가이드 4절)를 쓴다. 래퍼는 `UNITY_MATRIX_V[0].xyz`, `UNITY_MATRIX_V[1].xyz` 를 넘긴다. 큐브에서 평평한 면이 어떻게 보이는지는 `s.mesh=cube` 링크와 `node tools/unity.mjs <id> --stage=mesh=cube` 로 본다 (8절).
- 텍스처: `tools/textures/matcap-lit-sphere-spheres.mjs` 에서 128×128 한 장, R·G·B 채널에 매트캡 세 장을 회색조로 담는다. 원판 좌표 (x, y) 에서 `n = (x, y, sqrt(1 - x² - y²))`. R 부드러운 확산(점토, 왼쪽 위 앞에서 오는 빛), G 같은 값을 2~3 단으로 끊은 툰, B 크롬(위는 밝은 하늘, 수평선 근처 급한 띠, 아래는 어두운 땅, 작은 날카로운 반사점). 원판 밖 텍셀은 가장자리 값을 늘여 칠한다 (Bilinear 검은 테 방지). `linear`(데이터), Clamp, 압축 없음. 셰이더는 좌표에 0.49 를 곱해 원판 안만 읽는다. 24KB 이하를 확인한다.
- 효과의 핵심: 월드 법선을 카메라 오른쪽·위 축에 내적한 화면 법선 xy 로 `uv = xy * 0.49 + 0.5`. 원근 보정 토글(`_Perspective`): 픽셀 시선 방향 d = -viewWS 로 `r = normalize(cross(cameraUpWS, d)); u = cross(d, r)` 기저를 다시 세워 화면 가장자리와 평평한 면의 어긋남을 줄인다. 웹과 Unity 에서 방향(빛이 왼쪽 위에서 오는지)이 같은지 촬영으로 확인한다. 조절 값: 매트캡 채널 select(점토 R, 툰 G, 크롬 B), 매트캡 색(틴트), 바탕색, 합성 방식 select(곱하기, 더하기), 원근 보정 토글, 테두리 색과 세기(옥 프리셋용, `fresnel-rim-glow` 식). 쓰지 않는 값은 `showWhen` 으로 숨긴다. 프리셋: 점토(기본), 크롬 금속, 툰, 옥.
- 단계 보기 후보: 화면 법선 xy 를 색으로(물체가 돌아도 색 배치가 화면에 고정된다), 그 좌표로 읽은 매트캡 한 채널, 원근 보정 전후 차이(차이가 무대에서 너무 약하면 빼고 큐브 촬영으로 대신한다). 마지막 단계가 최종 화면과 같으면 넣지 않는다.
- 효과 끄기: 카메라 축 대신 오브젝트 공간 법선(`normalOS.xy`)으로 읽는 실수. 무대가 Y 로 돌므로 빛이 카메라 쪽에 머물지 않고 물체와 함께 돈다. 월드 공간 법선 실수는 무대 카메라가 고정이라 잘 안 드러나므로 `mistakes` 에 "카메라가 물체 주위를 돌면 반사가 화면에 고정되지 않는다" 로 적는다.
- `unity.pitfalls` 와 `mistakes` 후보: 원판 가장자리 검은 테(Repeat, 바깥 텍셀 검정, 0.5 그대로 곱함), 그라데이션 줄무늬(압축), 해를 돌려도 그대로(정상, 구워진 조명), 그림자를 받지 않음(Unlit), 법선맵은 탄젠트로 월드 법선을 만든 뒤 같은 식, 직교 카메라는 원근 보정이 필요 없다, XR 은 눈마다 `UNITY_MATRIX_V` 가 달라 원근 보정을 켜면 반사가 두 눈에서 조금 다르다(실기기 미확인).
- C# 스크립트: 없다. 자동 데모는 무대 회전과 채널을 바꾸는 루프(또는 테두리 세기 맥동, 1Hz 이하 작은 변화) 정도로 둔다. 데모가 없으면 경고가 나므로 하나는 둔다.
- `inspiredBy`: 빈 배열 (카드 27번 비고: 대표작이 빌린 마스크 축이 화면에 없다). 게임명은 어디에도 쓰지 않는다. `references` 는 카드의 Sloan 등 lit sphere 논문, Shader Graph Feature Examples, Unity Toon Shader MatCap, VRM MToon 규격 중에서 고른다. 마스크로 금속 부위에만 매트캡을 얹는 방법, 장소마다 매트캡을 바꾸는 방법, 카메라 롤에도 반사가 돌지 않게 월드 위 축을 쓰는 방법은 `prompt.adaptIdeas` 에 둔다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs matcap-lit-sphere` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다. 움직임을 말하는 글("흐른다", "끓듯이")은 `burst` 연속 촬영 시트로 확인한다 (가이드 8절).
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
