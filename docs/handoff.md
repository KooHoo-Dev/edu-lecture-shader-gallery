# 인수인계 (2026-11-03)

새 세션은 이 문서, `docs/plan.md` 14~17절, `docs/specimen-guide.md` 순서로 읽는다. 이전 세션의 기록은 `docs/plan.md` 에 모두 있다.

## 지금 상태

- 표본 33개(선정 24개 + 기본 물·불 + 묶음 7 의 매트캡·클로킹·지면 범위 표시·CRT + 묶음 8 의 하프톤·인테리어 매핑·스프라이트 흔들림, plan 24·25절). 1차 마무리는 26개였다. 배포: https://koohoo-dev.github.io/edu-lecture-shader-gallery/
- main 에 push 하면 Actions(`.github/workflows/deploy.yml`)가 빌드, `tools/check.mjs`, Pages 배포를 한다. `v*` 태그는 Release 에 단일 HTML 을 붙인다.
- 마지막 전체 검사: 통과, WebGL2 70/70, 오프라인 실행 33개 표시, Skill 137 파일, gzip 1,319KB (예산 1,536KB 의 86%, 25절 뒤). 남은 예산으로 표본 4~5개를 더 넣을 수 있다 (표본당 45KB 기준).
- 문서: 진행 기록과 비용 `docs/plan.md`, 선정 근거 `docs/shader-selection.md`, 표본 규격 `docs/specimen-guide.md`.
- 결정된 것: 저체력 비네트 색(`screen-vignette`)은 지금 값을 유지한다 (Jay, 2026-11-03).

## 규칙

- Jay 와는 한국어로 이야기한다. 권고는 하나로 한다. 되돌릴 수 있는 결정은 정하고 알린다. 질문은 끝에 모은다.
- 이 리포는 커밋과 push 가 자유다. `C:\Users\user\JayTools`(JayDispatch 포함)는 Jay 가 말할 때만 커밋한다.
- main 작업 트리의 아래 변경은 열린 Unity 에디터가 만든 것이다. 커밋하지 않는다. `git add` 는 파일을 골라서 한다.
  - `Assets/Editor/HubForceResolve.cs(.meta)` 삭제
  - `Assets/Settings/PC_RPAsset.asset`, `ProjectSettings/ShaderGraphSettings.asset`, `ProjectSettings/URPProjectSettings.asset`
- API 키는 Jay 만 넣는다. 대화나 화면으로 키를 받지 않는다. `ANTHROPIC_API_KEY` 를 전역 환경변수로 두지 않는다. 키는 `%USERPROFILE%\.jay-dispatch\keys\` 에 있고 워커 자식 프로세스에만 들어간다.
- 이 PC 에는 `gh` 가 없고 내장 브라우저는 GitHub 에 로그인되어 있지 않다. 리포 설정은 Jay 가 바꾼다. 배포 상태는 인증 없이 `curl -s "https://api.github.com/repos/KooHoo-Dev/edu-lecture-shader-gallery/actions/runs?per_page=1"` 로 본다.

## 비용

- 앱과 도구는 구독 세션이 직접 고친다. JayDispatch 워커 잡(Opus 5.5, effort high, 프로필 `org`)은 표본 단위 작업에 쓴다. 새 표본 하나에 구현과 수정을 합쳐 약 $4~8 이 든다.
- 회사 플랜 크레딧은 $380 중 약 $137 를 썼다 (묶음 8 까지). 11월 19일(UTC)에 만료되고 이월되지 않는다. `dispatch status` 로 추정 사용액을 본다.
- 개인 Ultra 크레딧은 아직 연결되지 않았다. 별도 세션이 Anthropic 지원팀 답을 기다린다. 회사 크레딧이 끝나면 워커는 구독 프로필로 넘어간다.

## 표본 작업 흐름 (새 표본이나 표본 수정이 필요할 때)

1. 선정 카드(`docs/shader-selection.md`)와 `web/src/core/registry.ts` 의 자리표시 항목을 먼저 넣는다. `tools/workflow/specs-example.mjs` 형식으로 명세를 쓰고 `node tools/workflow/make-jobs.mjs <명세.mjs>` 로 `jobs/<id>.md` 를 만든다.
2. `dispatch run --parallel 2 --repo C:/Users/user/shader-gallery` 를 실행한다. 명령이 없으면 `node C:/Users/user/JayTools/JayDispatch/bin/dispatch.mjs` 를 쓴다. 결과는 `dispatch/<id>` 브랜치에 남는다. 실패하면 `dispatch retry <id>` 를 쓰고, 검증만 다시 하려면 `--verify-only` 를 붙인다.
3. `sh tools/workflow/prepare-review.sh <id> <단계 수>` 로 `_review/<id>/` 를 만든다. 코드, Unity 촬영, 웹 화면, 워커 보고가 모인다.
4. 표본마다 general-purpose 서브에이전트에게 독립 리뷰를 맡긴다. `tools/workflow/review-brief.md` 를 그대로 따르게 하고, 리뷰 폴더, 선정 카드 번호, 기준 샘플을 알려 준다. 지적은 코드와 화면으로 직접 확인한 뒤 받아들인다.
5. 구현 브랜치를 main 에 병합한다. 메시지는 "표본 병합: <id> (구현, 리뷰 전)".
6. `tools/workflow/fix-specs-example.mjs` 형식으로 리뷰 지적을 적는다. `node tools/workflow/make-fix-jobs.mjs <수정 명세.mjs>` 다음 `dispatch run` 으로 수정 잡을 돌리고 `dispatch/<id>-fix` 를 병합한다. 메시지는 "표본 수정 병합: <id> 리뷰 반영".
7. 마무리 명령은 `npm --prefix web run build`, `node tools/build-skill.mjs`, `node tools/check.mjs`(전체) 순서다. 그다음 커밋하고 push 하면 Pages 가 다시 배포한다.

Unity 를 직접 돌릴 때(촬영, 컴파일)는 워커 검증과 겹치지 않게 잠금을 잡는다: `node tools/workflow/with-unity-lock.mjs "node tools/unity.mjs <id>" "node tools/shots.mjs <id>"`.

## 함정 (지난 세션에서 겪은 것)

- `tools/live.mjs` 는 `--query` 를 하나만 받는다. 둘을 주면 뒤엣것을 무시한다.
- 웹과 Unity 가 같은지는 `tools/compare.mjs` 로 나란히 찍어 본다 (흐르는 값은 `--set` 으로 0). 무대 옵션은 링크 `s.<옵션>=` 과 `--stage=` 로 어느 표본에서나 시험한다.
- 움직임은 `live.mjs` 의 `burst` 로 확인한다. 무대 시간을 직접 옮겨 찍으므로 매번 같은 결과가 나온다. 물체 회전은 멈춘다. `prepare-review.sh` 는 잡 브랜치의 도구로 찍으므로 burst 가 들어가기 전에 만든 브랜치에서는 시트가 없다.
- 여러 파일을 스크립트 하나로 고친 뒤에는 grep 으로 결과를 확인한다. 중간 실패를 모른 채 "적용했다" 고 커밋한 적이 있다.
- 정규식이나 Windows 경로가 든 수정은 Edit 도구로 한다. heredoc 안 node 스크립트에서는 `\\b` 가 깨지고, GNU sed 치환문에서는 `\U` 같은 경로 조각이 대소문자 변환으로 바뀐다.
- 앱(무대, 촬영 도구)을 고친 뒤에는 기존 표본 촬영과 밝기를 다시 본다. 임시 표본으로 웹과 Unity 를 같이 찍어 비교하는 방법이 잘 통했다 (15~17절).
- 단계 본문의 움직임 주장("재생하면 끓듯이")은 정지 화면으로는 검증되지 않는다. 불 표본의 결함이 리뷰까지 간 이유다.
- 독립 리뷰가 구독 세션의 앱 회귀와 가이드 오류를 여러 번 잡았다. 앱이나 가이드를 크게 바꾼 뒤에도 리뷰를 받는다.

## 후속 과제 (권장 순서)

1. ~~**`live.mjs` 연속 촬영** (17절).~~ 끝남 (18절). `burst:<이름>,<장수>,<간격ms>` 가 시트 한 장과 변화량을 남긴다. 리뷰 폴더에도 들어간다.
2. ~~**용량 정책** (16절).~~ 끝남 (19절). gzip 69%. 새 표본은 gzip 증분 45KB 이하, 기준은 가이드 7절과 `check.mjs` 에 있다.
3. ~~**표본 다듬기** (16·17절).~~ 끝남 (20절). 마지막 단계 정리 5개 표본, `showWhen`, 웹 `_ST`, 일시정지 이벤트 안내, 파티클 표준 문장.
4. ~~**무대·촬영 확장** (14~16절).~~ 끝남 (22절). 무대 옵션 `uiAspect`, `layers`, `shadowProp`, `tilt`, `bright`, `mesh: 'torus'` (가이드 4절), 촬영 변형 `--rendering-path`, `--ui-mask`, `--stage`, `--set`, 정지 비교 `tools/compare.mjs` (가이드 8절).
5. ~~**Unity 에서 아직 확인하지 않은 것** (14·16절).~~ 끝남 (21절). Depth Priming 은 외곽선·실루엣을 지운다(Forced, MSAA 꺼진 Auto). Overlay 캔버스는 씬 색상이 읽히지만 위아래가 뒤집힌다(D3D12 플레이어). 남은 미확인: 다른 그래픽 API 와 에디터 Game 뷰의 Overlay.
