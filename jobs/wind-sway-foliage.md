---
# 묶음 2 (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다. 앱의 grass 메시와 Unity 좌표 입력을 처음 쓰는 표본이다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs wind-sway-foliage
  - node tools/unity.mjs wind-sway-foliage
  - node tools/shots.mjs wind-sway-foliage
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/wind-sway-foliage/**
  - Assets/Shaders/wind-sway-foliage.meta
  - web/src/specimens/wind-sway-foliage/**
  - web/src/shots/wind-sway-foliage/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: wind-sway-foliage

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다. 특히 3-4절 정점 변형, 4절 무대 표 아래의 좌표와 `grass` 설명.
2. 기준 샘플 `Assets/Shaders/dissolve-edge-glow/` 와 `web/src/specimens/dissolve-edge-glow/meta.ts` (메시). 정점을 미는 완성 표본은 `inverted-hull-outline` 이다.
3. `docs/shader-selection.md` 의 "9. wind-sway-foliage" 카드와 7절 결정 표.

## 표본별

- ID `wind-sway-foliage`, 파일과 셰이더 이름 `WindSwayFoliage`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다 (바람 흔들림, 그룹 C, 순서 2).
- 무대와 혼합: 메시 무대 `grass`, 불투명(`blend: 'cutout'`, 알파는 항상 1), `stage.vertex: true`, 양면(모든 패스 `Cull Off`, `stage.doubleSided: true`). 그림자 패스도 같은 `sgVertex` 로 밀어 그림자가 함께 흔들리게 한다.
- 효과의 핵심: `uv.y`(뿌리 0, 끝 1)로 흔들림 정도를 정해 뿌리는 고정하고 끝으로 갈수록 크게 민다. 일정한 바람 방향에 노이즈로 세기를 바꾸는 큰 흔들림과, 잎마다 위상이 다른 작은 떨림을 겹친다. 잎마다 다른 위상은 오브젝트 공간 위치(`positionOS.xz`)에서 얻는다. 바람 방향(Unity 월드 기준), 세기, 속도, 떨림, 잎 색(뿌리와 끝)을 조절 값으로 둔다. 정점을 밀어도 길이가 크게 늘지 않게 한다.
- 좌표: 웹도 Unity 좌표로 넘기므로 바람 방향 값이 두 화면에서 같은 쪽을 가리켜야 한다. 웹 화면과 Unity 촬영에서 잎이 같은 쪽으로 눕는지 확인해 보고에 적는다.
- 단계 보기 후보: 흔들림 마스크(`uv.y`), 큰 흔들림만, 떨림까지 더한 결과, 최종.
- 효과 끄기 후보: 흔한 실수 하나. 예를 들어 마스크 없이 정점 전체를 밀어 뿌리째 미끄러지는 모습, 또는 모든 잎이 같은 위상으로 한꺼번에 흔들리는 모습.
- C# 스크립트: 돌풍처럼 바람 세기를 잠깐 올리는 작은 컨트롤러. 이벤트와 연결하고 가이드 6절을 따른다. 여러 풀 머티리얼을 함께 움직이는 전역 값(`Shader.SetGlobalFloat`) 방식은 해설과 변형 예시로 다룬다.
- `inspiredBy`: 카드에서 확인된 Ghost of Tsushima 를 가이드 5절 형식으로 넣는다. 수업 자료는 XR 04 Reel And Fish 의 `FishSwim`, 3D 05 Terrain 처럼 링크 없이 이름만 언급한다. `FishSwim` 과 같은 원리를 일반화한다는 점을 해설에 쓴다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`, `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs wind-sway-foliage` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 움직임은 정지 화면에 잘 안 보이므로 시간을 달리해 두세 장 찍어 비교한다. 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
