---
# 묶음 6 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs fire-noise-flame
  - node tools/unity.mjs fire-noise-flame
  - node tools/shots.mjs fire-noise-flame
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/fire-noise-flame/**
  - Assets/Shaders/fire-noise-flame.meta
  - web/src/specimens/fire-noise-flame/**
  - web/src/shots/fire-noise-flame/**
  - tools/textures/fire-noise-flame-noise.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: fire-noise-flame

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 `Assets/Shaders/scroll-distort-energy/` 와 `web/src/specimens/scroll-distort-energy/meta.ts` (투명 더하기 메시, 흐르는 노이즈 층. 노이즈 임계값 깎기는 `dissolve-edge-glow` 도 참고). 이미 병합된 다른 표본(`Assets/Shaders/` 아래)도 참고할 수 있다.
3. `docs/shader-selection.md` 의 "26. fire-noise-flame" 카드와 7절 결정 표.

## 표본별

- ID `fire-noise-flame`, 파일과 셰이더 이름 `FireNoiseFlame`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (노이즈 불꽃, 그룹 D, 순서 1, 난이도 1).
- **가장 기본이 되는 불이다 (★1).** 수강생이 불 셰이더를 처음 만들 때 보는 표본이다. 개념은 흐르는 노이즈 두 층, 모양 마스크, 깎기, 색 그라데이션 네 가지로 줄이고 해설을 쉽게 쓴다.
- 무대와 혼합: 메시 무대 `mesh: 'quad'` (돌지 않는다), 투명 더하기(`blend: 'additive'`), `ZWrite Off`, 그림자 없음. 투명 메시 래퍼는 기준 샘플 `scroll-distort-energy` 를 따른다. 화면에서 아래쪽이 불의 뿌리가 되도록 UV 방향을 웹과 Unity 촬영에서 확인한다.
- 텍스처: 직접 만든다. `tools/textures/fire-noise-flame-noise.mjs` 에 이음매 없이 반복되는 부드러운 회색 노이즈 (데이터라 `linear`, `repeat`, 128 이하, 32KB 이하, 래퍼 기본값 `"linearGrey"`). 두 층에 같은 텍스처를 크기와 속도만 달리해 쓴다.
- 효과의 핵심: (1) 같은 노이즈를 크기와 속도가 다른 두 층으로 위로 흘려 곱한다 (Diablo III 발표의 `Tex1.a × Tex2.a × 2`). (2) UV 로 만든 부드러운 불꽃 모양 마스크 (아래는 넓고 위로 갈수록 좁아지며 사라진다). (3) 마스크와 노이즈를 합친 값을 `smoothstep` 으로 깎아 일렁이는 가장자리를 만든다. (4) 깎은 세기에 따라 속은 밝은 노랑, 가운데는 주황, 가장자리는 빨강으로 칠한다. 노이즈로 UV 를 조금 흔들어 불길이 좌우로 너울대게 해도 좋다. 불 색 세 가지, 세기(HDR, 1 이상 허용), 흐름 속도, 노이즈 크기, 불꽃 높이와 폭, 가장자리 부드러움을 조절 값으로 둔다. 모닥불, 촛불, 마법 불(파랑, 초록) 같은 프리셋.
- 안전: 불 전체가 깜빡이는 효과는 넣지 않는다. 노이즈 흐름에 따른 일렁임만 둔다. 밝기를 주기적으로 크게 바꾸는 값을 넣으면 가이드 7절을 따른다.
- Unity 쓰임: Quad 에 넣는 방법을 기본으로 쓰고, Quad 는 옆에서 보면 납작하므로 카메라를 향하게 두거나 Particle System 의 Renderer 머티리얼로 쓰는 방법(파티클은 카메라를 향해 돈다)을 `unity.pitfalls` 와 `prompt.adaptIdeas` 에 적는다. 파티클 정점 색(Color over Lifetime)을 곱하려면 무대 규격에 정점 색이 없으니 확인한 만큼만 쓰고 필요하면 가이드 9절 요청으로 적는다. 블룸 없이도 불로 보이는 기본값을 고르고, 블룸이 있으면 세기를 낮춰야 한다는 것을 해설에 적는다.
- 단계 보기 후보: 노이즈 한 층, 두 층을 곱한 노이즈, 모양 마스크, 깎은 불꽃(회색), 최종 중에서 고른다. 마지막 단계가 최종 화면과 같으면 넣지 않는다.
- 효과 끄기 후보: 노이즈를 한 층만 같은 속도로 흘려 무늬가 위로 미끄러지기만 하는 모습 (불꽃이 아니라 흐르는 판처럼 보인다), 또는 모양 마스크 없이 깎아 사각형 판 가장자리가 드러나는 모습. 화면에서 분명한 것을 고른다.
- C# 스크립트: 없다.
- `inspiredBy`: 카드에서 확인된 Diablo III (2012, Blizzard Entertainment) 를 가이드 5절 형식으로 넣는다. 빌린 것은 같은 노이즈 여러 층 곱하기와 부드러운 모양 마스크, 링크는 GDC Vault 세션. 수업 자료는 3D 07 External Assets 와 2D 의 MagicArsenal 이펙트처럼 이름만 언급한다. `references` 에 GDC Vault 세션과 JangaFX 분석 글(카드의 URL)을 넣는다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`(자기 텍스처 모듈 말고), `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.
- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.

## 끝내기 전에

1. `node tools/check.mjs fire-noise-flame` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
