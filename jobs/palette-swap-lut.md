---
# 묶음 3 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs palette-swap-lut
  - node tools/unity.mjs palette-swap-lut
  - node tools/shots.mjs palette-swap-lut
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/palette-swap-lut/**
  - Assets/Shaders/palette-swap-lut.meta
  - web/src/specimens/palette-swap-lut/**
  - web/src/shots/palette-swap-lut/**
  - tools/textures/palette-swap-lut-index.mjs
  - tools/textures/palette-swap-lut-palette.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: palette-swap-lut

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/sprite-outline-hit-flash/` 와 `web/src/specimens/sprite-outline-hit-flash/meta.ts` (스프라이트). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "17. palette-swap-lut" 카드와 7절 결정 표.

## 표본별

- ID `palette-swap-lut`, 파일과 셰이더 이름 `PaletteSwapLut`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (팔레트 스왑, 그룹 E, 순서 2).
- 무대와 혼합: 스프라이트 무대. 래퍼는 스프라이트 샘플처럼 `Universal2D` 와 `UniversalForward` 두 패스, 인스턴스 머티리얼 방식(`docs/shader-selection.md` 1-2절).
- 텍스처: 직접 만든다. 인덱스 스프라이트는 `tools/textures/palette-swap-lut-index.mjs` (작은 캐릭터 한 장, R 에 색 번호, 투명 배경, 데이터라 `linear`, `point`)로 만들고 `stage.textures._MainTex` 로 쓴다. 팔레트는 `tools/textures/palette-swap-lut-palette.mjs` (가로 색 번호 × 세로 팔레트 줄, 색이라 sRGB, `point`). 픽셀 아트처럼 작게 만든다.
- 효과의 핵심: 인덱스 값을 팔레트 칸 가운데(반 텍셀 오프셋)로 바꿔 읽고, 고른 팔레트 줄의 색을 낸다. 알파와 정점 색은 유지한다. 팔레트 줄 고르기와 몇 가지 보조 값(예: 피격 줄로 잠깐 바꾸기)을 조절 값으로 둔다.
- 단계 보기 후보: 인덱스 회색, 팔레트 읽는 좌표, 최종.
- 효과 끄기 후보: 흔한 실수 하나. 예를 들어 반 텍셀 오프셋 없이 읽어 색이 옆 칸으로 밀리는 모습, 또는 인덱스를 sRGB 로 읽어 색 번호가 틀어지는 모습. 화면에서 분명히 보이는 것을 고른다.
- C# 스크립트: 팔레트 줄을 바꾸는 작은 컴포넌트 (팀 색, 피격 색). `renderer.material` 복사본을 쓰고 가이드 6절을 따른다.
- `inspiredBy`: 카드에서 확인된 Little Nemo and the Guardians of Slumberland 를 가이드 5절 형식으로 넣는다. 수업 자료는 2D 08 Merge Game, 99 Rockman 처럼 링크 없이 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs palette-swap-lut` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
