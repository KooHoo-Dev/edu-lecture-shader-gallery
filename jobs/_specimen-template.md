---
# 표본 구현 잡 템플릿 (plan 4-1). 파일 이름이 _ 로 시작하면 dispatch 가 잡으로 읽지 않는다.
# 복사해 jobs/<잡 id>.md 로 저장하고 <id>, <Name>, 카드 번호, 아래 "표본별" 칸을 채운다.
model: claude-sonnet-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs <id>
  - node tools/unity.mjs <id>
  - node tools/shots.mjs <id>
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/<id>/**
  - Assets/Shaders/<id>.meta
  - web/src/specimens/<id>/**
  - web/src/shots/<id>/**
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: <id>

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 `web/` 에 있다.

## 먼저 읽을 것

1. `docs/specimen-guide.md` 전체. 규격과 절차는 이 문서를 따른다.
2. 같은 무대의 기준 샘플 폴더와 그 `web/src/specimens/<샘플 id>/meta.ts`.
3. `docs/shader-selection.md` 의 `<id>` 카드와 7절 결정 표.

## 표본별

- ID `<id>`, 파일과 셰이더 이름 `<Name>`.
- 제목, 그룹, 순서, 한 줄 설명은 `web/src/core/registry.ts` 의 자리표시 항목과 같게 한다.
- 무대와 혼합:
- 효과의 핵심:
- 단계 보기 후보:
- 효과 끄기 후보:
- C# 스크립트:
- `inspiredBy`: 카드에 확인된 게임이 없으면 비운다. 수업 자료는 링크 없이 이름만 언급한다.

## 범위

- 위 `writePaths` 밖은 고치지 않는다. 특히 `web/src/app`, `web/src/core`, `web/src/stage`, `tools`, `docs`, `skill`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- `.meta` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 `verify` 명령으로 돌린다.

## 끝내기 전에

1. `node tools/check.mjs <id>` 를 통과시킨다. `.meta` 가 없다는 경고는 정상이다.
2. `node tools/live.mjs` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령).
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
