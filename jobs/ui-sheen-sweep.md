---
# 묶음 3 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs ui-sheen-sweep
  - node tools/unity.mjs ui-sheen-sweep
  - node tools/shots.mjs ui-sheen-sweep
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/ui-sheen-sweep/**
  - Assets/Shaders/ui-sheen-sweep.meta
  - web/src/specimens/ui-sheen-sweep/**
  - web/src/shots/ui-sheen-sweep/**
  - tools/textures/ui-sheen-sweep-card.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: ui-sheen-sweep

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/ui-sdf-shape/` 와 `web/src/specimens/ui-sdf-shape/meta.ts` (UI 래퍼). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "20. ui-sheen-sweep" 카드와 7절 결정 표.

## 표본별

- ID `ui-sheen-sweep`, 파일과 셰이더 이름 `UiSheenSweep`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (광택 훑기, 그룹 F, 순서 2).
- 무대와 혼합: 스프라이트 무대, `stage.ui: true`, `blend: 'alpha'`. UGUI Image 용이다. **래퍼는 `Assets/Shaders/ui-sdf-shape/UiSdfShape.shader` 의 UI 래퍼를 복사한다** (가이드 4절 "UI 래퍼"). Stencil, RectMask2D 클리핑, `UNITY_UI_ALPHACLIP`, 정점 색, 감마 정점 색 처리와 주석을 그대로 가져오고 속성과 core 만 바꾼다.
- 텍스처: 직접 만든다. `tools/textures/ui-sheen-sweep-card.mjs` 에 광택이 잘 보이는 UI 그림 한 장(예: 둥근 모서리 아이템 카드나 버튼, 가운데 보석 아이콘, 바깥은 투명)을 만들어 `stage.textures._MainTex` 로 쓴다. 색이라 sRGB, 128~256, 32KB 이하. 투명 텍셀에도 이웃 색을 칠한다 (가이드 7절).
- 효과의 핵심: UV 를 각도만큼 돌린 좌표에서 대각선 빛 띠를 만들고, `frac(time / 주기)` 로 띠가 지나간 뒤 쉬는 간격을 둔다. 띠는 이미지 알파로 가려 그림 안에서만 보이고, 색에 더하는 빛(가산)으로 얹는다. 색, 세기, 폭, 부드러움, 각도, 주기, 쉬는 간격을 조절 값으로 둔다. 정점 색을 곱한다 (CanvasGroup alpha, Button 색 전환).
- 이벤트: 클릭이나 획득 순간 띠 하나를 한 번 지나가게 한다. 가이드 5절 이벤트 규칙대로 더하기용 전용 값(예: `_SweepPulse`)을 0 에서 1 로 움직이고 C# 도 같은 값을 움직인다.
- 종횡비와 아틀라스: 띠를 UV 로 계산하면 가로로 긴 Image 에서 각도가 눕는다. `ui-sdf-shape` 처럼 비율을 보정할지 정하고, 보정하지 않으면 증상을 함정으로 적는다. Sprite Atlas 에 들어간 스프라이트는 UV 가 0~1 이 아니라 띠가 아틀라스 전체 기준으로 지나간다. 증상과 대책을 `unity.pitfalls` 에 적는다.
- 2D 쓰임: 카드대로 스프라이트 샤인(아이템 드롭 반짝임)으로도 쓸 수 있는지 래퍼 구조(LightMode 태그 없는 패스)로 판단해 프리셋이나 변형 예시로 둔다. 확인하지 못한 것은 단정하지 않는다.
- 안전: 화면 일부를 지나가는 띠라 넓은 면 번쩍임은 아니지만, 띠가 한 점을 지나는 빈도는 가이드 7절대로 3Hz 이하로 둔다. 큰 배너처럼 넓게 쓰는 경우를 해설에 적는다.
- 단계 보기 후보: 돌린 좌표, 띠 마스크, 알파로 가린 띠, 최종.
- 효과 끄기 후보: 이미지 알파로 가리지 않아 투명 여백 위로도 사각형 띠가 지나가는 실수.
- C# 스크립트: 버튼에 마우스가 올라오거나 눌릴 때 한 번 훑기를 재생하는 작은 컴포넌트 (`IPointerEnterHandler` 등 EventSystem 인터페이스). UGUI 머티리얼 복사본 규칙은 가이드 6절과 `ui-sdf-shape` 의 C# 을 따른다.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다. 수업 자료는 2D 09 UGUI Basic Component, 10 Inventory And TradeSystem(희귀 아이템 슬롯)처럼 이름만 언급한다. UI 갤러리는 공개 사이트 https://koohoo-dev.github.io/UIGallery/ 로 링크해도 된다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs ui-sheen-sweep` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
