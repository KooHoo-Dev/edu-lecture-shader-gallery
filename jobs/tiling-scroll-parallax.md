---
# 묶음 3 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs tiling-scroll-parallax
  - node tools/unity.mjs tiling-scroll-parallax
  - node tools/shots.mjs tiling-scroll-parallax
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/tiling-scroll-parallax/**
  - Assets/Shaders/tiling-scroll-parallax.meta
  - web/src/specimens/tiling-scroll-parallax/**
  - web/src/shots/tiling-scroll-parallax/**
  - tools/textures/tiling-scroll-parallax-layer.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: tiling-scroll-parallax

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/sprite-outline-hit-flash/` 와 `web/src/specimens/sprite-outline-hit-flash/meta.ts` (스프라이트). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "18. tiling-scroll-parallax" 카드와 7절 결정 표.

## 표본별

- ID `tiling-scroll-parallax`, 파일과 셰이더 이름 `TilingScrollParallax`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (타일 스크롤 패럴랙스, 그룹 E, 순서 3).
- 무대와 혼합: 스프라이트 무대. 래퍼는 스프라이트 샘플처럼 `Universal2D` 와 `UniversalForward` 두 패스, 인스턴스 머티리얼 방식.
- 텍스처: 직접 만든다. `tools/textures/tiling-scroll-parallax-layer.mjs` 에 가로로 이음매 없이 반복되는 배경 한 층(예: 언덕 실루엣, 위쪽은 투명)을 만들어 `stage.textures._MainTex` 로 쓴다. `repeat`. 크기는 30KB 를 넘지 않게.
- 효과의 핵심: UV 오프셋으로 끝없이 스크롤한다. 속도와 층 계수, C# 이 넘기는 오프셋을 조절 값으로 둔다. 미리보기에는 층이 하나뿐이므로 시차는 먼 층과 가까운 층 프리셋, 해설, 변형 예시로 설명한다. Unity 에서는 층마다 SpriteRenderer 하나에 이 머티리얼 복사본을 쓰는 방식이다.
- Unity 주의: 스프라이트는 아틀라스에 넣지 않은 단독 텍스처여야 Repeat 이 먹고, Mesh Type 은 Full Rect 다. 픽셀 아트면 정수 PPU 스냅을 다룬다.
- 단계 보기 후보: 원래 UV, 오프셋을 더한 UV, 최종.
- 효과 끄기 후보: Wrap Mode 가 Clamp 인 것처럼 끝 픽셀이 길게 늘어나는 실수.
- C# 스크립트: 카메라 위치에 층 계수를 곱해 오프셋을 넘기는 스크롤러. 수업의 2D 05 Layer And Scroll `ScrollController`(오브젝트를 옮기는 방식)와 비교하는 해설을 쓴다. 이름만 언급한다.
- `inspiredBy`: 카드에 확인된 게임이 없으므로 비운다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs tiling-scroll-parallax` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
