# Shader Gallery 계획서

유니티 개발자 양성과정의 강사와 수강생이 함께 보는 **게임 셰이더 갤러리**.
화면과 샘플 코드, 프롬프트만 보고도 AI에게 같은 효과를 지시해 자기 프로젝트에 넣을 수 있게 만든다.

- 작성: 2026-11-02 (Jay 승인)
- 형식 원본: `C:\Users\user\UIGallery` (<https://koohoo-dev.github.io/UIGallery/>). 계획 `docs/plan.md`, 표본 규격 `docs/specimen-guide.md`

## 1. 확정된 결정

| 항목 | 결정 |
|---|---|
| 구조 | UI 갤러리와 같은 `갤러리 -> 상세 페이지`. 제작 순서도 같다: 수집 -> 샘플로 초안 -> 콘텐츠 확장 |
| 대상 | Unity 6.3 LTS (6000.3.20f1), URP 17.3.0, HLSL 코드 셰이더. 수업 프로젝트 5개는 URP 17.3.0 이 일치하고, 에디터는 6000.3.15f1 인 프로젝트가 있다 |
| Shader Graph | 첫 버전 제외. `.shadergraph` 는 AI가 편집하기 어렵다. Custom Function 연결법만 해설에 넣는다 |
| 리포 | `C:\Users\user\shader-gallery` 하나. Unity 프로젝트 루트가 리포 루트이고 웹 앱은 `web/` |
| 공개 | 공개 리포 이름 후보 `KooHoo-Dev/ShaderGallery`. gh CLI 가 없어 리포 생성은 Jay 가 한다. 원격이 생기기 전에는 로컬 커밋만 |
| 커밋 | 이 리포 안에서는 커밋·push 자유 (Jay 허가). 다른 리포는 Jay 가 말할 때만 |
| 언어 | UI·해설·주석은 한국어, 식별자와 파일명은 영어 |

## 2. 역할 분담

| 작업 | 담당 |
|---|---|
| 수집·선정, 갤러리와 상세 형식, 기준 샘플, 도구 제작 | 구독 |
| 나머지 셰이더 구현, 리뷰 지적 수정 | API 크레딧 (`claude -p` 워커) |
| 독립 리뷰 | 구독. UI 갤러리에서 매번 실제 버그를 찾아 생략하지 않는다 |
| 프롬프트 효과 검증 | API 저가 모델. API 연결 전에는 구독 서브에이전트 |

API 크레딧은 개인·조직 계정의 **월간 부여분만** 쓰고 추가 충전하지 않는다. 소진되면 구독으로 전환한다. **API 계정 연결은 Jay 가 자기 작업을 끝낸 뒤에 한다.** 그 전까지 API 가 필요한 단계는 진행하지 않는다.

## 3. 리포 구조 (3단계에서 확정)

```text
shader-gallery/
├─ Assets/Shaders/<id>/         # core.hlsl + <Name>.shader + C#. Unity 와 웹이 같은 파일을 쓴다
├─ Assets/ShaderGalleryStage/   # 스프라이트 무대 텍스처 (코드로 생성, 웹도 같은 PNG)
├─ Assets/Editor/ShaderGallery/ # 컴파일 검사·촬영 코드
├─ web/                         # Vite 앱 (UIGallery 셸 복사). web/src/specimens/<id>/meta.ts 가 표본 데이터
├─ tools/                       # 검사·촬영·Skill 스크립트 (Node 만 사용)
├─ docs/                        # plan.md, specimen-guide.md, shader-selection.md, prompt-test.md
├─ research/                    # 수집 자료 (텍스트와 URL만)
└─ skill/shader-gallery/        # 표본 데이터에서 생성한 Skill. zip 은 커밋하지 않는다
```

## 4. 기술 핵심

### 웹과 Unity를 같게 유지한다
브라우저는 HLSL 을 실행하지 못한다. 따로 만들면 미리보기와 실제 결과가 달라지므로, **효과 본체를 HLSL 공통 문법의 `core.hlsl` 하나로** 쓴다.

- Unity: `.shader` 래퍼가 `core.hlsl` 을 include 한다. 조명·깊이·씬 색상처럼 Unity 전용인 부분은 래퍼가 맡는다.
- 웹: `?raw` 로 같은 파일을 읽고 호환 매크로(`float3`->`vec3`, `lerp`->`mix`, `frac`->`fract`, `saturate` 등)를 앞에 붙여 WebGL2 로 컴파일한다.
- 양쪽의 동작이 갈리는 문법은 규격에서 금지한다: 행렬 생성과 `mul`, 암시적 형변환, 스칼라->벡터 승격, 배열 초기화, `%`, `fmod`. 2D 회전 같은 것은 공통 헬퍼로 제공한다.
- 공통 문법으로 안 되는 종류만 웹용 GLSL 을 따로 두고 사유를 남긴다.
- 규격의 전체 내용은 `docs/specimen-guide.md`. 진입점은 `float4 sgEffect(SgInput i)` 하나이고, 무대별 입력(`SgInput`)은 래퍼와 앱이 채운다. 단계 보기는 `SG_STEP` 매크로, 효과 끄기는 `#ifdef SG_OFF` 분기로 같은 파일에 들어 있다. Unity 에서는 둘 다 아무 일도 하지 않는다.
- **헬퍼는 공통 파일로 두지 않고 표본마다 복사한다** (당초 계획 변경). 폴더 하나만 복사해도 동작해야 수강생과 AI 가 쓰기 쉽고, 상대 경로 include 가 깨지지 않는다. 복사할 헬퍼는 가이드 3-3절에 있다.

### 표본은 데이터 + 셰이더
UI 표본은 React 코드 때문에 평균 +114KB 였다. 셰이더 표본은 **React 컴포넌트 없이** 메타 데이터와 셰이더 파일만 둔다. 앱을 깨뜨릴 위험과 구현 비용이 함께 준다. 미리보기 무대는 앱이 4종으로 제공한다: 메시, 스프라이트, 깊이 사용, 전체 화면.

### 컴파일과 스크린샷은 실제 Unity 로
UI 갤러리는 Unity 코드 컴파일을 끝내 자동화하지 못했다. 이번에는 처음부터 자동으로 확인한다.

- `SgVerify.Run` 이 `ShaderUtil.GetShaderMessages` 와 패스별 `ShaderData.Pass.CompileVariant`(D3D11, Vulkan, GLES3, Metal)로 컴파일 오류를 수집하고, 프리뷰 씬에 고정 무대를 꾸며 표본마다 스크린샷을 찍는다. 열린 씬과 프로젝트 설정은 건드리지 않는다.
- 같은 C# 진입점을 **열린 에디터**(`SgBridge` 가 `Temp/ShaderGalleryBridge/command.json` 감시)와 **배치 모드(`-executeMethod`)** 양쪽에서 호출한다. `tools/unity.mjs` 가 경로를 고른다. 에디터가 열려 있고 응답이 없으면 `~/.sg-unity/<리포 이름>` 복사본을 배치로 돌린다.
- 웹 쪽은 `tools/check.mjs` 가 헤드리스 Chrome 에서 표본마다 최종과 `SG_OFF` 를 컴파일하고 로그를 확인한다.

### 웹 앱
- UI 갤러리와 같은 Vite + React 19 + TypeScript + three.js 단일 HTML. `file://` 와 Pages 에서 똑같이 동작하고, 실행 중 외부 URL 을 참조하지 않는다.
- 용량 예산은 HTML 1개 원본 5MB, gzip 1.5MB.
- 홈 카드는 **정적 썸네일**을 쓰고 호버 때만 공유 캔버스로 실행한다. WebGL 컨텍스트 제한과, UI 갤러리에서 홈 카드 실시간 렌더가 첫 화면을 가장 많이 늦췄던 경험 때문이다. 직접 렌더한 이미지는 내장해도 된다. 썸네일은 Unity 실측 스크린샷(720×405 WebP)을 그대로 쓴다.
- 색이 Unity 와 맞도록 선형 HDR 버퍼에 그린 뒤 마지막에 sRGB 로 내보낸다. 무대 배치, 조명, 색은 `web/src/stage/layout.ts` 와 `SgCapture.cs` 가 같은 숫자를 쓴다.
- 샘플 4개 기준 HTML 1.1MB, gzip 0.39MB. 셸이 0.92MB(gzip 0.29MB)이고 표본당 평균 +47KB(gzip +29KB)다. 이 평균이면 24개에서 약 2MB(gzip 1MB)로 예산 안이다.

## 5. 상세 페이지

UI 갤러리의 무대, 값 조절, 프리셋, 재생 바, 발표 모드, 딥링크, 라이트/다크를 가져온다. 셰이더용으로 달라지는 것:

- **효과 끄기**: 셰이더 적용 전 모습이나 흔한 실수를 보여 준다.
- **단계 보기**: 해설 번호 대신 노이즈 -> 임계값 -> 가장자리 -> 최종처럼 중간 출력을 보여 준다.
- **AI 지시 세트**
  - Unity 실측 스크린샷 (현재 웹 화면도 이미지로 복사 가능)
  - 샘플 코드 (`.shader`, `core.hlsl`, 머티리얼 설정)
  - 프롬프트 3종: 그대로 넣기, 내 프로젝트에 맞게 변형, 문제 해결
  - 슬라이더 값이 복사하는 코드와 프롬프트에 그대로 반영된다
- **프롬프트 고정 금지 사항**: Built-in 전용 `CGPROGRAM`·`UnityCG.cginc`·Surface Shader, 구버전 렌더 패스 API. SRP Batcher 호환(`CBUFFER_START(UnityPerMaterial)`)과 Render Graph 기준을 명시한다.
- 프롬프트는 특정 AI 도구에 묶지 않는 평범한 Markdown 으로 쓴다.

## 6. Skill 배포

**묶음 Skill 하나**를 만든다. Skill 설명은 매 턴 컨텍스트를 차지하므로 셰이더마다 만들지 않고, 셰이더별 자료는 필요할 때만 읽게 한다.

- `SKILL.md` 는 500줄 이하, 설명은 1,536자 이내.
- frontmatter 는 표준 필드(`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`)만 쓴다. 그래야 claude.ai 업로드와 Claude Code 양쪽에서 같은 zip 이 동작한다.
- 표본 데이터에서 빌드 때 생성해 갤러리와 내용이 어긋나지 않게 한다.

| 배포 방식 | 대상 |
|---|---|
| 프롬프트 복사 | 어떤 AI든 |
| 셰이더별·전체 zip 다운로드 | `.claude/skills/` 또는 claude.ai 업로드. 앱 안에서 만들어 오프라인에서도 동작 |
| 플러그인 마켓플레이스 | Claude Code 에서 명령 한 줄로 설치 |

## 7. 분업 도구

`C:\Users\user\JayTools\JayDispatch` (가칭, 리포 독립 CLI + 개인 Skill `/dispatch`). `claude -p` 를 감싸 잡 실행, 검증, 비용 기록, 크레딧 전환을 맡는다. 키가 아니라 **잔액(Console 조직) 단위**로 관리한다. 같은 조직의 키는 잔액과 호출 한도를 공유하기 때문이다. 상세 설계는 그 폴더의 문서를 따른다.

## 8. 콘텐츠 정책

- 게임 원작의 텍스처·모델·셰이더 코드를 추출하거나 옮기지 않는다. 효과의 **원리를 분석해 새 코드로** 쓴다. 게임명은 표본 ID·제목에 쓰지 않고 `inspiredBy` 에만 쓴다.
- 튜토리얼·블로그·오픈소스 코드도 복사하지 않고 원리만 참고해 출처를 링크한다.
- 텍스처와 노이즈는 직접 생성한다. 폰트는 OFL, 아이콘은 직접 그린 SVG.
- 넓은 영역이 번쩍이는 효과는 제한기를 거친다 (초당 3회 이하).

## 9. 진행 단계

| 번호 | 작업 | 담당 | 상태 |
|---|---|---|---|
| **0** | **사전 검증** | | |
| 0-1 | `claude` CLI 설치, 워커 전용 폴더에 `claude auth login` | Jay | 완료 |
| 0-2 | 개인 계정: 조직 연결, 과금 차단 확인, Workspace와 상한, 키 발급 | Jay | 진행 중. 별도 Console 조직 필요 |
| 0-3 | 조직 계정: 같은 절차 | Jay | 완료 |
| 0-4 | Unity 컴파일·촬영 자동화 시험 | 구독 | 완료 (11절). 실제 열린 에디터 경로만 창 포커스 대기 |
| 0-5 | 효과 하나의 `core.hlsl` 을 Unity와 WebGL 양쪽에서 컴파일 | 구독 | 완료 (11절) |
| 0-6 | 키별 `claude -p` 크레딧 차감 실측 | 구독 + Jay | 조직 키 완주. Console 차감 표시 확인 대기 |
| 0-7 | 0-6 실패 시 별도 터미널 워커 구조로 변경 | 구독 | |
| **1** | **도구 v0** (`JayDispatch`) | | |
| 1-1 | 프로필과 키 로딩, 워커 환경 비우기 | 구독 | 완료 (가짜 `claude` 로 시험) |
| 1-2 | 잡 파일, worktree 실행, 검증 명령, 재시도 | 구독 | 완료 (가짜 `claude` 로 시험) |
| 1-3 | 비용 기록, `dispatch status`, 주기 말 경고 | 구독 | 완료 (가짜 `claude` 로 시험) |
| 1-4 | 중단 원인 분류, 잔액 전환, 구독 전환, 갱신 후 복귀 | 구독 | 완료 (가짜 `claude` 로 시험) |
| 1-5 | 개인 Skill `/dispatch` | 구독 | 작성 완료, 설치 전 |
| 1-6 | API·구독 실제 완주, 낮은 상한으로 전환 시험 | 구독 | 완주와 상한 전환 확인. 개인 잔액 시험만 남음 |
| **2** | **셰이더 수집·선정** | | |
| 2-1 | 게임에서 자주 쓰는 셰이더를 여러 관점으로 리서치 | 구독 | 완료 (`4e1fcd6`) |
| 2-2 | 그룹 분류, 우선순위, 수업 연계 정리 | 구독 | 완료 (`4e1fcd6`) |
| 2-3 | 약 24개 목록과 선정 근거 문서 `docs/shader-selection.md` | 구독 | 완료 (`4e1fcd6`) |
| 2-4 | **목록 확인** | Jay | 확정 (2026-11-02). 24개와 ID 를 제안대로 쓴다 |
| **3** | **갤러리 초안** | | |
| 3-1 | UI 갤러리 셸을 `web/` 으로 복사, 불필요한 부분 정리 | 구독 | 완료 |
| 3-2 | 표본 규격 v1: `core.hlsl`, 래퍼, 메타 데이터, 호환 매크로 → `docs/specimen-guide.md` | 구독 | 완료 |
| 3-3 | 미리보기 무대 4종 | 구독 | 완료 |
| 3-4 | 홈과 상세: 값 조절, 단계 보기, AI 지시 세트 | 구독 | 완료 |
| 3-5 | Unity 촬영 씬과 검증 진입점 | 구독 | 완료 |
| 3-6 | 샘플 4개: 디졸브, 스프라이트 외곽선 + 피격 번쩍임, 역장 교차, 화면 전환 | 구독 | 완료 |
| 3-7 | Skill과 zip 생성 스크립트 | 구독 | 완료 |
| 3-8 | 프롬프트만으로 변형을 시키는 시험 | API 저가 (연결 전 구독) | 완료 (구독 Haiku). `docs/prompt-test.md` |
| 3-9 | 독립 리뷰와 수정 | 구독 | 완료 (12절) |
| 3-10 | **형식과 샘플 확인** | Jay | 확정 (2026-11-02) |
| **4** | **API 파일럿** (1, 3단계와 키 필요) | | |
| 4-1 | 표본 구현 잡 템플릿 | 구독 | 완료 (`jobs/_specimen-template.md`) |
| 4-2 | 같은 잡 2개를 Opus 5.5와 Sonnet 5.5로 실행 | API | 완료 (13절) |
| 4-3 | 비용·품질 비교, 전체 비용 재추정 | 구독 | 완료 (13절). `fresnel-rim-glow` 병합 |
| 4-4 | **구현 모델 결정** | Jay | Opus 5.5 로 확정 (2026-11-02). 수정 잡도 같은 모델 |
| **5** | **콘텐츠 확장** (묶음마다 반복) | | |
| 5-1 | 묶음 구성과 잡 파일 작성 | 구독 | 묶음 1 완료 (14절), 묶음 2·3 완료 (15절), 묶음 4·5 완료 (16절), 묶음 6 기본 물·불 완료 (17절) |
| 5-2 | 구현과 자동 검증 | API | |
| 5-3 | 독립 리뷰, 수정 잡 작성 | 구독 | |
| 5-4 | 수정과 프롬프트 검증 | API | |
| 5-5 | 병합, 용량 확인, 보고 | 구독 | |
| **6** | **공개** | | |
| 6-1 | Skill 묶음과 마켓플레이스 구성, 설치 시험 | 구독 | |
| 6-2 | 전체 점검: 1280×720, 모바일 폭, 오프라인 파일, 링크 | 구독 | |
| 6-3 | 수강생용 사용 안내 | 구독 | |
| 6-4 | **공개 리포 생성과 push** (리포 생성은 Jay) | Jay | |
| 6-5 | Pages 배포 확인, JayTools README 링크 | 구독 | |

## 10. 환경 함정 (UI 갤러리에서 겪은 것)

- PowerShell 5.1 의 `Get-Content`/`Set-Content` 는 UTF-8 한글을 깨뜨린다. 파일 편집은 Edit/Write 도구, 커밋 메시지는 파일로 만들어 `git commit -F`. 커밋 제목 다음에 빈 줄을 둔다.
- Python `Path.write_text` 는 Windows 에서 CRLF 로 쓴다. `newline=''` 를 준다.
- Git Bash 는 `#/s/...` 같은 인자를 경로로 바꾼다. `MSYS_NO_PATHCONV=1`.
- 헤드리스 Chrome 스크린샷은 같은 경로를 다시 읽으면 이전 이미지가 보일 수 있다. 매번 새 파일명을 쓴다. 최소 창 폭은 약 500px.
- 브라우저 패널이 화면에 안 보이면 rAF 가 0 이다. 애니메이션 확인은 헤드리스로.
- WebSearch 는 세션당 한도(약 200회)가 있다. 대량 리서치 전에 예산을 나눈다. 차단한 사이트는 우회하지 않는다.
- Unity 코루틴 함정: `OnDisable` 에서 `StopAllCoroutines` 와 상태 변수 초기화.
- Bash 도구에서 `cd` 는 다음 명령까지 이어지고 병렬 호출과 섞이면 예상과 다른 폴더에서 돈다. 절대 경로를 쓴다. 긴 인라인 스크립트는 따옴표가 깨지기 쉬우니 파일로 만들어 실행한다.
- Unity 에디터는 창에 포커스가 와야 새 C# 을 import 한다. VS 메시징 UDP 포트는 열려 있지 않아 밖에서 Refresh 를 보낼 수 없었다. 포커스 없이 하려면 복사본 배치 실행을 쓴다.

## 11. 0-4, 0-5 시험 기록과 바뀐 가정 (2026-11-02)

**확인한 것 (Unity 6000.3.20f1, URP 17.3)**

- 배치 모드는 그래픽을 켠 채(`-nographics` 없이) 동작한다. Direct3D12 로 컴파일과 촬영 모두 통과. 첫 실행 약 1분 30초, 이후 약 1분.
- 에디터가 프로젝트를 열고 있어도 복사본(`~/.sg-unity/shader-gallery`)으로 배치 실행이 가능하다. Jay 의 창 클릭 없이 전 과정을 돌릴 수 있다.
- 파일 명령 경로(`SgBridge`)는 복사본을 종료 없는 `-batchmode` 로 띄워 시험했다. 명령 파일 -> 실행 -> 결과 파일까지 통과. 일부러 깨뜨린 셰이더는 줄 번호와 함께 오류로 잡혔다.
- `core.hlsl` 공통 문법은 성립한다. 샘플 4개가 D3D11, Vulkan, GLES3, Metal 과 WebGL2 에서 모두 컴파일되고, 웹과 Unity 스크린샷이 눈으로 같아 보인다. 한글 주석도 양쪽에서 문제없다 (웹은 주석을 지우고 넘긴다).
- 임시 표본으로 규격의 나머지도 양쪽에서 확인했다: `sgVertex` 정점 변형, 표본 폴더 텍스처(선형, 반복, 포인트), `sgSceneColor` 씬 색상, 스프라이트 `_MainTex` 교체. 시험 표본은 지웠다.

**2D Renderer (`shader-selection.md` 6절 8번, 7절 2번)**

- Full Screen Pass Renderer Feature 는 2D Renderer 에서 동작한다. 복사본에서 `Renderer2DData` 파이프라인으로 바꿔 `screen-transition-wipe` 를 촬영해 확인했다. UI RawImage 대안은 필요 없다.
- 스프라이트 표본의 `Universal2D` 패스가 2D Renderer 에서 그려진다 (촬영 확인). `Render2DLightingPass` 소스의 태그 목록은 `SRPDefaultUnlit`, `Universal2D` 뿐이라 `UniversalForward` 만 있는 메시, 깊이 표본은 2D Renderer 에서 그려지지 않는다.
- `Renderer2DRendergraph` 소스에 Opaque Texture 복사가 없다. 씬 색상을 쓰는 표본은 2D Renderer 에서 안 된다고 보고, 대안은 Camera Sorting Layer Texture 다. 이것은 소스만 읽었고 촬영으로 시험하지는 않았다.

**깨진 가정과 바꾼 것**

| 가정 | 실제 | 조치 |
|---|---|---|
| `GetShaderMessages` 면 오류를 모을 수 있다 | import 단계는 일부 조합만 검사한다 | 패스별 `CompileVariant` 를 4개 플랫폼에 직접 호출 |
| 2D 회전 등은 공통 헬퍼로 제공 | 공통 파일을 include 하면 폴더 복사만으로 동작하지 않는다 | 표본마다 복사. 가이드 3-3절 |
| 메시 표본은 `UniversalForward` 패스면 된다 | Deferred 렌더 경로에서 오류 없이 사라진다 (3-9 리뷰) | 불투명, 잘라 내기 메시는 `UniversalForwardOnly` + `DepthNormalsOnly` |
| `_MainTex_TexelSize` 로 외곽선 두께를 맞춘다 | SpriteRenderer 는 텍스처를 렌더러 단위로 넘겨 값이 틀어진다. 두 번째 촬영에서 외곽선이 수십 배로 나왔다 | 래퍼가 `GetDimensions` 로 크기를 묻고 `i.texelSize` 로 넘긴다 |
| 전체 화면 UV 는 D3D 에서 위아래를 뒤집어야 한다 | 중간 텍스처에 그리는 동안은 어느 API 든 위쪽이 1 이다. 뒤집으니 대각선 쓸기가 거꾸로 나왔다 | 뒤집기 제거 |
| 무대 4종이면 충분하다 | 씬 색상, 텍스처, 정점 변형, 원기둥과 쿼드가 목록에 필요하다 (`shader-selection.md`) | 무대 규격에 추가하고 양쪽에서 시험 |
| 샘플 ID 는 `dissolve` 등 짧은 이름 | `shader-selection.md` 가 영구 ID 를 제안 | 그 제안을 따랐고 2-4 에서 확정했다 |

**아직 안 된 것**: 표본 가이드 9절의 앱 확장 3건(두 패스 그리기, ZTest Greater, 전체 화면 깊이·법선)은 해당 묶음을 만들 때 구독 세션이 추가한다. 실제로 열려 있는 에디터에서의 파일 명령 경로는 창 포커스가 와서 `SgBridge` 가 올라온 뒤에야 시험할 수 있다. 3-10 때 Jay 가 창을 클릭하면 `node tools/unity.mjs` 가 자동으로 그 경로를 탄다.

## 12. 3-9 독립 리뷰 (2026-11-02)

읽기 전용 서브에이전트 둘에게 코드와 규격만 주고 맡겼다 (셰이더·Unity 쪽, 웹·도구·가이드 쪽). 지적 33건 중 실제 결함으로 확인한 것을 모두 고쳤다. 고칠 때 Unity 와 웹에서 다시 시험했다.

| 분류 | 찾은 것 | 조치 |
|---|---|---|
| 렌더 경로 | 메시 표본이 Deferred 에서 오류 없이 사라진다 | `UniversalForwardOnly` + `DepthNormalsOnly`. 복사본을 Deferred 로 바꿔 촬영 확인. `check` 규칙 추가 |
| C# | 전환 컨트롤러가 씬 왕복마다 쌓임, 빌드에 없는 씬에서 화면이 덮인 채 멈춤, 디졸브 컨트롤러가 구멍 뚫린 값으로 시작 | 인스턴스 하나만 유지, 덮기 전 씬 확인, `Awake` 에서 시작 값 |
| 셰이더 | 반투명 스프라이트 안쪽에 외곽선 색이 섞임, 점광원 그림자 바이어스, 멀티뷰 눈 인덱스 | 합성 비율 수정, `_CASTING_PUNCTUAL_LIGHT_SHADOW`, `UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX` |
| 글 | 스키닝에서 `positionOS` 를 바인드 포즈 값이라고 잘못 설명, Overlay Canvas 는 전환에 덮이지 않음 | 설명 정정, 주의 사항 추가 |
| 촬영·검증 | GUI 에디터에서 비동기 컴파일로 임시 셰이더가 찍힐 위험, 숨은 물체가 씬을 닫아도 남음, 기본 변형만 컴파일 | 비동기 끄기, 물체 직접 삭제, 인스턴싱·스테레오·그림자·`SKINNED_SPRITE` 조합 추가 |
| 파일 명령 | 긴 작업 중 복사본 배치가 함께 돌 수 있음, 새 C# 뒤 결과 유실, 쓰는 도중 읽기 | `running.txt` 로 대기 연장, Refresh 뒤 리로드 기다림, 임시 파일 후 rename |
| 검사 도구 | `check <id>` 가 WebGL 컴파일을 건너뜀, 무대 프레임 수 누적으로 검사가 무력, 메타와 셰이더의 범위·혼합·정점·요구 사항 미대조, 안 쓰는 슬라이더 통과, 클래스 이름 중복 통과 | 모두 검사에 넣었다. 일부러 망가뜨린 10가지가 전부 잡히는 것을 확인 |
| 무대 | `depth` 의 `stage.mesh` 를 촬영이 무시, `quad` 가 돌다 사라짐, 비정사각 스프라이트 늘어남, `cutout` 이 메시에서만 동작, 수면용 메시 없음 | 촬영과 웹 배치 일치, `plane` 과 `doubleSided` 추가, 시험 표본으로 양쪽 확인 |
| 앱 | 한글 입력 상태에서 J, S, A, P 불통, Ctrl+P 가 발표 모드 전환, 같은 표본에서 프리셋 링크 이동 무시, 자동 데모가 링크 값을 덮음, 복사 실패에도 '복사됨', 렌더 예외 하나로 앱이 백지 | `e.code` 로 판단, 수식 키 제외, 라우트 key 수정, 복사 결과 표시, ErrorBoundary 연결 |
| Skill | `stage.textures` 의 PNG 가 zip 에서 빠짐, frontmatter 설명의 콜론이 YAML 오류 (자체 발견) | 바이너리 항목 지원, 설명을 따옴표로 |
| 가이드 | 샘플 복사 시 `.cs` 중복으로 프로젝트 컴파일이 멈춤, 투명 메시 안내 없음, `_MyTex` Properties 줄 누락, `cd web` 뒤 경로 오류 | 절차와 표 수정 |

## 13. 4단계 파일럿 (2026-11-02)

`fresnel-rim-glow` 를 같은 잡 지시(`effort: high`, 예산 $10)로 두 모델에 맡겼다. 결과는 모델 이름을 가린 A/B 폴더로 모아 독립 리뷰에 맡겼다.

| | Sonnet 5.5 | Opus 5.5 |
|---|---|---|
| 첫 구현 | $0.53, 3.0분 | $1.66, 6.2분 |
| Unity 컴파일 | 변형 80개 통과 | 변형 80개 통과 |
| 리뷰 결함 | 중 2: 이벤트 트랙이 절대값이라 프리셋과 C# 동작이 어긋남(구조 문제), `flashes: true` 누락으로 번쩍임 제한기가 안 걸림 | 중하 1, 하 5: 글 정확성, 시간 기준, 썸네일 대비 |
| 판정 | | 병합. 한 등급쯤 낫다 |

- Opus 결과에 수정 잡 한 번($0.84, 3.2분)으로 리뷰 지적 6개를 반영하고 병합했다. 표본당 약 $2.5 다. 남은 19개는 첫 구현과 수정 한 번 기준 약 $50, 어려운 표본을 감안해 $70 안팎으로 본다. 회사 잔액(11월 19일 만료)만으로 충분하다.
- 처음 실행에서 두 잡 모두 Unity 검증이 환경 문제로 실패해 재시도 비용 $1.49 를 썼다. dispatch 의 검증 환경에 `ALLUSERSPROFILE` 이 빠진 것이 원인이었고, 고친 뒤 `retry --verify-only` 로 워커를 다시 부르지 않고 살렸다. 워커 둘 다 재시도에서 코드를 건드리지 않고 환경 문제라고 정확히 보고했다.
- 파일럿 API 사용 합계 $4.52 (추정).
- 표본 하나만 비교했다. 품질 차이가 표본마다 같을지는 묶음 1 에서 다시 본다.

**리뷰에서 나온 공통 과제** (앞으로의 표본에 퍼지므로 묶음 1 전에 구독이 처리)

- 단계 출력도 sRGB 로 보여 "0 은 검정" 같은 글이 화면과 어긋난다. 가이드 3-1절에 주의를 넣었다.
- 기준 샘플 `dissolve-edge-glow` 에서 물려받는 문제: DepthNormals 패스에 `_GBUFFER_NORMALS_OCT`, `_WRITE_RENDERING_LAYERS` 가 없다(Deferred + 정확한 G-buffer 노멀에서 SSAO 가 틀린 노멀을 읽음). Bloom 안내에 URP Asset 의 HDR 켜기가 빠졌다. 꺼진 오브젝트에서 C# 연출 함수를 부르면 코루틴 오류가 난다. 번쩍임 간격 제한이 `Time.time` 기준이다.

## 14. 5단계 묶음 1 (2026-11-02)

`toon-ramp-lit`, `triplanar-projection`, `inverted-hull-outline` 을 Opus 5.5 잡으로 만들고(`fresnel-rim-glow` 는 파일럿), 표본마다 독립 리뷰와 수정 잡 한 번을 거쳐 병합했다. 표본 8개, HTML 1,384KB (27%), gzip 521KB (34%).

| 표본 | 구현 | 수정 | 합계 | 리뷰 판정 |
|---|---|---|---|---|
| `toon-ramp-lit` | $3.04, 10분 | $1.07 | $4.11 | 수정 후 병합. 효과 끄기가 기본과 거의 같았다 |
| `triplanar-projection` | $3.05, 11분 | $1.06 | $4.11 | 수정 후 병합. 정면 촬영이라 썸네일에 효과가 안 보였다 |
| `inverted-hull-outline` | $2.74, 11분 | $1.43 | $4.17 | 수정 후 병합. 웹과 Unity 큐브 정점 수가 달라 모양이 달랐다 |

- 표본당 약 $4.1 로 파일럿 예상($2.5)보다 크다. 남은 16개는 약 $70~80 으로 본다. 회사 잔액 추정 $362 가 11월 19일에 만료되므로 크레딧보다 리뷰할 구독 시간이 속도를 정한다.
- 흐름을 바꿨다: 구현 브랜치를 main 에 먼저 합치고, 수정 잡은 main 에서 시작한다. 리뷰 사이에 바뀐 앱(촬영 회전, 프롬프트)을 수정 잡이 함께 받는다.
- 이 묶음에서 한 앱 확장: 메시·깊이 무대 입력 `positionWS`, `normalOS` / 외곽선 패스(`stage.outline`) / 텍스처 생성 도구(`tools/gen-texture.mjs`) / 메시 촬영 시작 회전 30도 / 웹 큐브를 Unity 와 같은 정점 24개로 / '그대로 넣기' 프롬프트에 텍스처 단계 / 외곽선 표본 프롬프트에 `SG_OUTLINE` 규칙.
- 기준 샘플 공통 수정: DepthNormalsOnly 패스의 G-buffer 노멀·렌더링 레이어 키워드, 주광원의 그림자 거리 페이드와 Culling Mask, C# 연출 함수의 꺼진 오브젝트 처리와 실제 시간 기준 번쩍임 제한, Bloom 의 HDR 조건.

**남은 앱 과제** (해당 표본이 필요할 때 구독이 처리)

- ~~메시 무대 입력에 그림자 감쇠를 빛 색과 따로 넘기는 필드, 그리고 메시 무대에 그림자를 드리울 소품. 지금은 툰의 받는 그림자를 갤러리 화면에서 볼 수 없다.~~ 22절
- 웹 월드 벡터(`positionWS`, `normalWS`, `viewWS`, `lightDirWS`, 오브젝트 공간 값)를 Unity 좌표(z 반전)로 넘기기. 방향이 의미 있는 월드 공간 표본(바람 방향 등)을 만들기 전에 한다.
- ~~외곽선의 Depth Priming 주의는 리뷰어의 판단이고 Unity 에서 확인하지 않았다.~~ 21절

## 15. 5단계 묶음 2·3 (2026-11-02)

묶음 2(`wind-sway-foliage`, `flow-map-liquid`, `hologram-scanline-glitch`, `scroll-distort-energy`)와 묶음 3(`palette-swap-lut`, `tiling-scroll-parallax`, `ui-sdf-shape`, `ui-sheen-sweep`)을 함께 진행했다. 구현 잡을 병렬로 돌리고, 표본마다 독립 리뷰, main 에 먼저 합친 뒤 수정 잡 한 번을 거쳐 병합했다. `ui-sheen-sweep` 은 `ui-sdf-shape` 의 UI 래퍼를 복사하므로 그 수정이 병합된 뒤 시작했다.

| 표본 | 구현 | 수정 | 합계 | 리뷰의 주요 지적 |
|---|---|---|---|---|
| `wind-sway-foliage` | $3.30, 13분 | $1.92 | $5.22 | 바람 방향 글과 잔물결 부호가 반대, 이벤트가 절대값 트랙이라 튐 → 더하기용 `_Gust` |
| `flow-map-liquid` | $2.52, 11분 | $1.29 | $3.81 | 1인자 `GetMainLight`, 웹과 Unity Plane 의 UV 가 180도 다름, 참고 라벨의 게임명 |
| `hologram-scanline-glitch` | $2.45, 9분 | $1.32 | $3.77 | 배속에서 깜빡임이 빨라짐, 정점 밀도 글이 촬영과 다름, Shader Graph 안내 오류 |
| `scroll-distort-energy` | $2.53, 10분 | $1.08 | $3.61 | 사실이 아닌 실수 항목(노이즈 센터링), sRGB 를 끈 텍스처의 `"gray"` 기본값 |
| `palette-swap-lut` | $3.34, 12분 | $0.46 | $3.80 | 대표작 제작사·연도 오류, 압축 주장 |
| `tiling-scroll-parallax` | $1.54, 8분 | $0.97 | $2.51 | timeScale 함정이 반대로 적힘, 끝없이 커지는 오프셋, C# 이 속도 값을 넣지 않음 |
| `ui-sdf-shape` | $2.91, 13분 | $2.42 | $5.33 | C# 초기화 순서와 스텐실 복사본 누수, 세로로 긴 Image 에서 도형이 막힘 |
| `ui-sheen-sweep` | $3.26, 11분 | $0.93 | $4.19 | 띠가 쉬는 순간에 찍혀 썸네일에 효과가 없음 → `meta.thumbnail`, 9분할·스프라이트 시트 함정 |

- 8개 합계 $32.24, 표본당 평균 약 $4.0 으로 묶음 1 과 같다. 수정 잡은 리뷰 지적의 양에 따라 $0.5~2.4 로 갈렸다.
- 리뷰가 구독 세션의 앱 회귀 두 건을 잡았다: 웹 z 반전 뒤 조명 방향을 뒤집지 않음, 촬영 씬에서 `light.distanceAttenuation` 이 0 이라 썸네일의 직사광이 사라짐. 둘 다 고쳤다. 앱을 고친 뒤에는 기존 표본 촬영과 밝기도 다시 본다.
- 리뷰에서 나온 같은 실수를 검사로 막았다: 1인자 `GetMainLight`, sRGB 를 끈 텍스처의 `"gray"` 기본값, UI 셰이더 구조, PNG 크기(32KB 경고, 48KB 오류).

**이 묶음에서 한 앱 확장**

- 웹 무대가 위치, 법선, 방향을 Unity 좌표로 넘긴다(`SG_FLIP`, z 반전). 큐브와 풀에 월드 좌표를 색으로 칠해 웹과 Unity 촬영이 같음을 확인했다.
- `grass` 메시: 웹과 Unity 가 같은 계산으로 만드는 풀 다발(`grass.ts`, `SgGrass.cs`). 메시 시작 회전 30도, 정점을 미는 구는 Unity 와 비슷한 밀도.
- UI 표본(`stage.ui`): UI 래퍼 규칙과 검사, `UNITY_UI_CLIP_RECT`·`UNITY_UI_ALPHACLIP` 변형 컴파일, '그대로 넣기' 프롬프트의 Image 단계.
- 텍스처 모듈(`tools/textures/<이름>.mjs`, `tools/lib/texture-kit.mjs`)과 촬영 텍스처 설정(데이터·포인트 텍스처는 압축 없음).
- Plane UV 를 Unity 기본 Plane 과 같게(촬영으로 확인), 원통 배치를 화면 안으로, 단계 보기에서 투명 양면 메시의 앞면이 보이게.
- 썸네일 촬영 선택(`meta.thumbnail`)과 링크 쿼리 `t=<초>` (무대 시간을 멈춘 채 열어 주기 효과의 단계와 효과 끄기를 같은 순간에 찍는다).
- JayDispatch: `retry --verify-only`, 워커 환경에 `ALLUSERSPROFILE`, 상한 소진 매 실행 확인, 검증 부산물 기억, worktree 정리, 같은 잡 중복 실행 방지.

**남은 앱 과제** (해당 표본이 필요할 때 구독이 처리)

- ~~UGUI Canvas 촬영 무대: 4:1 같은 Image 비율, Mask, RectMask2D, Overlay 캔버스를 화면으로 확인할 수 없다. UI 표본은 지금 글로만 정확히 쓴다.~~ 21·22절
- ~~여러 층 스프라이트 무대: 시차 스크롤은 층 하나만 보여 준다.~~ 22절
- 풀 잎마다 다른 데이터(위상, 높이)와 앞면 여부, `sgVertex` 의 월드 좌표.
- 이벤트 트랙의 상대값과 `prefers-reduced-motion` 대응.
- ~~시간으로 움직이는 무늬를 웹과 Unity 에서 비교하는 검증 전용 정지 촬영(`_Speed: 0` 같은 값).~~ 22절
- `references` 라벨의 게임명 검사, 샘플 래퍼의 안개 처리.
- 묶음 4·5 전에: `ZTest Greater` 그리기, 전체 화면 무대의 깊이·법선, 촘촘한 수면 메시 (가이드 9절).

## 16. 5단계 묶음 4·5 (2026-11-02 밤)

Jay 가 남은 일을 모두 진행하라고 해서(단계마다 커밋, 끝나면 push) 묶음 4(`water-depth-foam`, `xray-occluded-silhouette`, `surface-wet-snow`, `screen-vignette`)와 묶음 5(`screen-refraction-glass`, `screen-shockwave-distortion`, `depth-normal-edge-outline`, `ui-backdrop-blur`)를 같은 흐름으로 이어서 만들었다. 묶음 5 는 묶음 4 를 기다리지 않고 앱 확장을 먼저 넣은 뒤 함께 돌렸다. 표본 24개로 선정 목록을 모두 채웠다.

| 표본 | 구현 | 수정 | 합계 | 리뷰의 주요 지적 |
|---|---|---|---|---|
| `water-depth-foam` | $3.98, 14분 | $1.20 | $5.18 | 보는 각도에 따른 거품 폭 설명이 반대, 노이즈 텍스처의 압축 안내 없음 |
| `xray-occluded-silhouette` | $4.17, 16분 | $1.54 | $5.71 | 벽이 그림자 검사를 가려 워커가 원통으로 우회(앱 문제), 사라짐·겹침 원인 글이 틀림 |
| `surface-wet-snow` | $3.44, 15분 | $1.54 | $4.98 | 구 UV 에만 맞는 고정 반복 횟수, C# 이 하지 않는 일을 글이 약속함 |
| `screen-vignette` | $2.29, 8분 | $2.00 | $4.29 | 피격 펄스가 포화된 빨강으로 화면 약 80% 를 덮음(안전), XR 화면 중심 설명 오류 |
| `screen-refraction-glass` | $3.11, 19분 | $1.97 | $5.08 | 앞 물체 끌림 방지가 코드에 없음, 미는 축이 카메라 축이 아님, 화면비 |
| `screen-shockwave-distortion` | $2.39, 9분 | $1.21 | $3.60 | 컨트롤러가 둘이면 머티리얼 에셋이 망가짐, 편집 중 고리, 연타 제한 |
| `depth-normal-edge-outline` | $2.95, 11분 | $1.45 | $4.40 | DepthNormals 패스 없는 셰이더는 윤곽 없음, 비용 비교 오류, G-buffer 법선 |
| `ui-backdrop-blur` | $2.50, 9분 | $2.32 | $4.82 | Overlay 캔버스 단정, C# 없는 이벤트, 씬 색상 경계 처리 |

- 8개 합계 $38.06, 표본당 평균 약 $4.8. 수정 잡이 리뷰의 앱 지적(벽 그림자 검사, 프롬프트)까지 받아 묶음 1~3 보다 조금 크다. 회사 잔액 사용 누계는 약 $88 (시험 포함, 11월 19일 만료분 $380 중).
- 마무리: 표본 24개, HTML 원본 2,794KB (예산 55%), gzip 1,290KB (예산 84%). 오프라인 실행 24개 모두 표시, WebGL2 컴파일 52/52, Skill 파일 100개. gzip 예산이 얼마 남지 않아 표본을 더 늘리기 전에 PNG·촬영 용량 정책을 다시 정한다.
- 구독 세션의 스크립트 하나가 중간에 실패해 가이드 수정 일부가 빠진 채 "적용했다" 고 커밋했다. 수정 잡 워커의 보고로 알아채 다시 적용했다 (`b7e922a`). 앞으로 여러 파일을 한 스크립트로 고친 뒤에는 결과를 grep 으로 확인한다.
- 리뷰가 구독 세션의 가이드 오류를 한 번 더 잡았다: Depth Priming 은 두 번째 패스를 지우는 쪽이고, 자기 겹침은 Deferred 순서와 여러 렌더러·서브메시에서 생긴다.
- 리뷰가 앱 결함 두 가지를 찾았다: '그대로 넣기' 프롬프트에 `unity.setup` 이 빠져 C# 연결과 평소 값 단계가 전달되지 않았다, 기본 촬영이 효과 없는 순간(띠가 쉬는 시간)에 찍힐 수 있었다.

**이 묶음에서 한 앱 확장** (모두 웹과 Unity 를 임시 표본 촬영으로 비교해 확인)

- `stage.occluded`: 물체 앞의 벽과 `ZTest Greater` 두 번째 패스. Unity 가 같은 물체의 SRPDefaultUnlit 패스를 UniversalForwardOnly 보다 먼저 그리는 것을 확인했다 (Forward+, 프라이밍 꺼짐, MSAA 꺼짐).
- 전체 화면 `sgSceneDepth`, `sgSceneNormal`, `texelSize`와 `requires: 'normals'`. 촬영 도구가 Full Screen Pass 의 Requirements 를 켠다.
- 깊이 무대 `sgSceneDepth`, `cameraRightWS`, `cameraUpWS`, `color`. 깊이 무대 패널을 바닥에서 띄우고 촬영 때 UI 의 ZTest 를 고정.
- `meta.thumbnail`, 링크 쿼리 `t=<초>`, '그대로 넣기' 프롬프트의 넣는 순서·Compression None·Requirements 단계.
- 검사: `stage.occluded`, `sgScene*` 규칙, `flashes` 의 C# 제한기, C# 없는 이벤트, 씬 색상 직접 샘플링, Custom Function 형식.
- 가이드: 포화된 빨강의 수치 정의, 공유 머티리얼 제한기와 컨트롤러 하나, XR 화면 중심, `depthDelta` 는 눈 깊이 차, 텍스처 반복 노출, 마지막 단계 규칙.
- 선정 카드에 대표작 출시 연도를 기사로 확인해 채웠다 (Sea of Thieves 2018, Overwatch 2016, Space Marine 2 2024).

**남은 앱 과제** (15절 목록에 더해)

- ~~촬영 검증용 변형: Deferred, Depth Priming Auto (21절), 볼록하지 않은 시험 메시. 두 번째 패스 표본의 확인 범위를 넓힌다.~~ 22절
- ~~전체 화면 무대를 밝게 하는 옵션(어두운 무대에서 검은 비네트가 약함), 메시 무대 기울이기 옵션(오브젝트 공간 실수를 보여 주기).~~ 22절
- ~~select 값에 따라 쓰이지 않는 조절 값 숨기기, 웹의 `_ST`(Tiling/Offset) 지원.~~ 20절
- ~~마지막 단계가 최종 화면과 같은 기존 표본 정리 (`toon-ramp-lit`, `tiling-scroll-parallax`).~~ 20절
- ~~일시정지나 `t=` 상태에서 이벤트 버튼이 아무 변화가 없는 점 안내.~~ 20절
- ~~Overlay 캔버스에서 씬 색상이 읽히는지 촬영으로 확정.~~ 21절
- 저체력 비네트(`#4d1414`, 포화 빨강 기준 19.3/20)가 화면 약 75% 를 덮는다. 느린 작은 맥동이라 번쩍임으로 세지 않았다. Jay 가 지금 값으로 충분하다고 확정했다 (2026-11-03).

## 17. 1차 마무리: 기본 물·불과 값 이름 표기 (2026-11-03)

Jay 가 배포된 페이지를 훑어보고 1차 마무리로 두 가지를 요청했다: 값 조절의 속성 이름을 한글과 영어로 함께 표기, 가장 기본이 되는 물과 불 셰이더.

- 값 조절 패널: 한글 표시 이름 옆에 `.shader` 속성 이름(`_ShallowColor` 등)을 작은 고정폭 글자로 붙였다 (`e5eed0e`). Unity Properties 의 이름 그대로라 코드, Inspector, 프롬프트를 잇는다. 표본 데이터는 바꾸지 않았다.
- 표본 2개 추가 (선정 문서 25·26번, 묶음 6): `water-wave-surface` (물결 수면, ★1, 그룹 C 첫째)와 `fire-noise-flame` (노이즈 불꽃, ★1, 그룹 D 첫째). 그룹 C·D 의 기존 순서를 한 칸씩 미뤘다. 근거는 GPU Gems 1장(Cyan Worlds, Uru: Ages Beyond Myst)과 Julian Love 의 GDC 2013 "The VFX of Diablo" 를 다룬 JangaFX 분석 글이다.

| 표본 | 구현 | 수정 | 합계 |
|---|---|---|---|
| `water-wave-surface` | $5.23 | $2.49 | $7.72 |
| `fire-noise-flame` | $3.57 | $2.13 | $5.70 |

- 2개 합계 $13.42. 회사 잔액 사용 누계는 약 $102 (11월 19일 만료분 $380 중).
- 물 구현은 Unity 기본 Plane(10×10 칸)에 맞춰 파장을 길게 잡아 천처럼 보였다. 리뷰는 무대의 해가 카메라 뒤라 해 반짝임이 생길 수 없다는 점도 짚었다. 그래서 앱에 촘촘한 평면 `grid` 와 역광 해 `stage.backlit` 을 더하고 수정 잡에서 옮겼다. 수강생용으로 같은 평면을 만드는 `WaterSurfaceGrid.cs` 를 표본에 넣었다.
- 불 리뷰가 핵심 결함을 잡았다: 두 층이 화면에서 8% 차이로 흘러 "속도가 다른 두 층을 곱하면 끓는다" 가 보이지 않았다 (반복 횟수를 곱한 UV 에 오프셋을 더하면 화면 속도는 오프셋 ÷ 반복 횟수). 이 규칙을 가이드에 넣었다.
- 촬영 도구 결함: 알파 혼합 물체가 렌더 타깃의 알파까지 깎아 Unity 촬영 PNG 의 알파가 1 보다 작게 남았고, 밝은 페이지 위에서 사진이 바래 보였다 (수면 알파 191~215). 저장할 때 알파를 버리게 고치고 알파 혼합을 쓰는 표본 11개를 다시 찍었다.

**이 묶음에서 한 앱 확장** (`grid` 는 UV 격자 임시 표본으로, 역광은 물 표본 촬영의 해 반짝임 위치로 웹과 Unity 를 비교해 확인)

- `grid` 메시: Unity Plane 과 같은 10×10 크기와 UV 에 100×100 칸 (`SgGrid.cs`), y = 0.3 에 크기 1.
- `stage.backlit`: 해를 카메라 맞은편 높이 15도에 둔다 (`Quaternion.Euler(15, 180, 0)`).
- 메시 무대 `SgInput.color` (웹은 흰색). 파티클의 Color over Lifetime 을 받는다.
- 가이드: 흐르는 층의 화면 속도, 빛 받는 투명 메시의 `_SURFACE_TYPE_TRANSPARENT`, `ZWrite Off` 메시 안의 그리는 순서, `frac` 정밀도 문구.

**남은 과제**

- `live.mjs` 로 같은 화면을 짧은 간격으로 여러 장 찍는 기능. 단계 본문의 움직임 주장("재생하면 끓듯이")을 정지 화면으로는 검증하지 못해 불의 결함이 리뷰까지 갔다.
- ~~파티클 하나를 띄우는 표준 설정 문장 (불꽃, 연기 표본용).~~ 20절

## 18. 후속 1: 연속 촬영 (2026-11-03)

17절의 남은 과제였던 움직임 검증 도구를 `tools/live.mjs` 에 넣었다.

- 동작 `burst:<이름>,<장수>,<간격ms>` (기본 6장, 100ms). 실제 시간으로 흘려 찍지 않고 무대 시간을 간격만큼 직접 옮겨 찍는다. 헤드리스 SwiftShader 는 프레임이 느리고 한 프레임에 0.1 초까지만 진행해, 실제 시간으로 찍으면 장마다 간격이 달라지기 때문이다. 앱에는 자동 검사 창구 `window.__sgSeek(t)` 와 `ShaderStage.seek` 를 더했다 (붙든 동안 스스로 흐르지 않음, 자동 데모와 재생 중인 이벤트는 같은 시간축으로 진행, 물체 회전은 멈춤).
- 결과: 장마다 PNG, `t=` 라벨이 붙은 시트 한 장, 이웃한 장 사이의 평균 차이와 바뀐 픽셀 비율. 모든 장이 같으면 "움직임 없음" 을 알린다. 시트와 변화량은 페이지 캔버스로 만들어 의존성이 없다.
- 확인: 불 표본을 두 번 찍어 변화량이 소수 둘째 자리까지 같았다. 시간을 쓰지 않는 툰은 재생 중에도 "움직임 없음", 스프라이트 피격은 `t=1` 에서 누른 뒤 50ms 간격으로 트랙(0.06 초 유지, 0.26 초에 0)과 같게 찍혔다. 전체 검사 통과 (gzip 1,316KB 그대로).
- 리뷰 폴더(`prepare-review.sh`)가 최종 화면과 단계마다 시트를 만들고, 리뷰 브리프와 구현 잡 지시가 움직임 주장을 시트로 확인하게 했다. 잡 브랜치의 도구로 찍으므로 이 커밋 뒤에 만든 브랜치부터 시트가 나온다.

## 19. 후속 2: 용량 정책 (2026-11-03)

gzip 이 예산의 86% 라 표본을 늘리기 전에 이미지 용량을 정했다. 이미지는 base64 로 들어가 gzip 으로도 거의 줄지 않아, 1,316KB 중 약 866KB(촬영 webp 677KB, PNG 189KB)가 이미지였다. Jay 가 기준안을 확인했다 (촬영 화질을 낮추는 것 포함).

- **PNG (화면 변화 없음):** `gen-texture.mjs` 가 행 필터 없이 저장하고 있었다. 행마다 필터를 고르고 필터 없음과 작은 쪽을 쓰게 바꿔 다시 만들었다. 픽셀이 같은 것을 디코더로 대조했다. 11장 193KB → 116KB. 회색 노이즈 5장을 1채널로 저장하면 약 16KB 더 줄지만, Unity 가 1채널 PNG 를 어떤 형식으로 가져오는지 확인해야 해서 하지 않았다.
- **촬영:** WebP 품질 0.85 → 0.75 (`tools/shots.mjs`). 원본 56장으로 재 보니 74% 크기였다. 실제 크기에서는 구별이 어렵고 4배 확대에서 물의 잔결이 조금 뭉개진다. 원본 PNG(`_shots/unity`)가 지금 촬영과 같은 표본 17개는 원본에서 다시 변환했다 (원본을 0.85 로 변환한 결과가 지금 webp 와 바이트까지 같은지로 확인). 원본이 없거나 오래된 9개(`depth-normal-edge-outline`, `flow-map-liquid`, `hologram-scanline-glitch`, `screen-shockwave-distortion`, `screen-vignette`, `scroll-distort-energy`, `surface-wet-snow`, `fire-noise-flame`, `wind-sway-foliage`)는 Unity 로 다시 찍었다 (오류·경고 0, 새 PNG 로 촬영).
- **결과:** gzip 1,316KB → 1,064KB (예산 86% → 69%), 원본 2,883KB → 2,542KB. 전체 검사 통과.
- **새 표본 기준** (가이드 7절): 표본당 gzip 증분 45KB 이하(`tools/size.mjs` 가 표시), PNG 한 장 24KB 경고·32KB 오류(전에는 32·48), 표본당 PNG 합 32KB 경고, 촬영 한 장 16KB 경고, `captures` 3장 이내. `flow-map-liquid` 의 촬영 3장(17~19KB)은 화면을 덮는 잔무늬 탓이라 경고로 둔다.

## 20. 후속 3: 표본 다듬기 (2026-11-03)

16·17절에 남았던 다듬기 다섯 가지를 했다. 앱과 가이드를 고쳤으므로 독립 리뷰를 한 번 받았다.

- **마지막 단계 정리:** 최종 화면과 같은 마지막 단계를 지우고 설명을 앞 단계로 옮겼다. 처음 꼽은 `toon-ramp-lit`, `tiling-scroll-parallax` 에 더해, 새로 넣은 검사가 `fresnel-rim-glow`, `inverted-hull-outline` 을 찾았다. `wind-sway-foliage` 의 4단계는 지우지 않고 잎 색을 뺀 조명만 보여 주게 바꿨다 (양면 조명이라는 내용이 앞 단계와 달라서). Unity 컴파일 5개 통과. `palette-swap-lut` 3단계는 투명 출력이라 최종과 화면이 조금 다르고 '팔레트 색' 이라는 개념 단계라 그대로 두었다.
- **검사:** 마지막 `SG_STEP(n, x)` 바로 뒤에 `return float4(x, 1.0)` 이 오면 경고한다. 패스가 둘이면 모든 마지막 단계가 그 모양일 때만 (`xray-occluded-silhouette` 의 실루엣 패스는 3단계가 알파라 제외된다).
- **`showWhen`:** select 값에 따라 셰이더가 쓰지 않는 조절 값을 패널에서 숨긴다. `screen-transition-wipe._Cells`, `ui-sdf-shape._Radius`·`_Aspect`, `surface-wet-snow._WetDarkness`·`_SnowColor`. 대응은 리뷰가 core 와 대조했다. 검사가 키, 선택지, 빈 목록을 확인한다.
- **웹 `_ST`:** 텍스처마다 `<이름>_ST` 유니폼을 (1, 1, 0, 0) 으로 넘긴다. core 가 쓰면 래퍼 `CBUFFER` 의 `float4` 와 `[NoScaleOffset]` 없음을 검사하고, 스프라이트 `_MainTex_ST` 는 `[PerRendererData]` 라 막는다. 임시로 `surface-wet-snow` 에 넣어 오류 두 가지와 통과(WebGL 컴파일)를 확인하고 되돌렸다. 기존 표본은 바꾸지 않았다.
- **일시정지 이벤트 안내:** 멈춘 상태에서 이벤트를 누르면 재생 막대 아래에 "시작 순간에 멈춰 있다" 를 띄운다. 재생하면 사라진다. 번쩍임 제한에 걸려 이벤트가 버려지면 띄우지 않는다 (`ShaderStage.fire` 가 성공 여부를 돌려준다). 처음 문구의 "Space 로 재생" 은 버튼에 포커스가 있으면 그 버튼을 다시 누르게 되어 뺐다 (리뷰 지적).
- **파티클 표준 문장:** 가이드 4절 메시 무대 `color` 항목. Start Speed 0, Max Particles 1, Shape 끔, Renderer Material. 메뉴 이름은 Unity 에서 확인하지 않았다. Color over Lifetime 의 기본 그라데이션은 불투명이라 양 끝 알파를 0 으로 두라고 적었다 (리뷰 판단, 확인 안 함).

## 21. 후속 5: Unity 미확인 항목 (2026-11-03)

14·16절에 '확인하지 않았다' 로 남은 두 가지를 Unity 에서 찍어 확정했다.

- **Depth Priming:** 촬영 도구에 검증 변형 `--depth-priming=disabled|auto|forced`, `--msaa=1|2|4|8` 을 더했다 (렌더러·URP 에셋을 메모리에서만 바꾸고 촬영 뒤 되돌림). `inverted-hull-outline`, `xray-occluded-silhouette` 를 여섯 조합으로 찍었다. 이 프로젝트의 URP Asset 은 MSAA 가 꺼져 있어 Forced 와 Auto 모두 외곽선과 실루엣이 통째로 사라졌다 (두 조합의 화면이 픽셀까지 같음). MSAA 4x 에서는 Forced, Auto 모두 Disabled 와 같았다. URP 17.3 소스의 조건(Forward 계열, MSAA 1, Auto 는 데스크톱에서 권장)과 맞는다. 처음에는 렌더 타깃의 MSAA 만 바꿨는데 URP 는 URP Asset 의 MSAA 가 1 이면 렌더 타깃 값을 보지 않아 효과가 없었다.
- **Overlay 캔버스의 씬 색상:** Overlay UI 는 렌더 텍스처 촬영에 그려지지 않아 `tools/verify/overlay-ui.mjs` 로 Windows 플레이어(D3D12)를 만들어 실제 창을 찍었다. 같은 `ui-backdrop-blur` 패널을 Overlay, Camera 캔버스로 찍고 패널 없는 화면과 비교했다. Overlay 에서도 Opaque Texture 는 읽히지만 비친 장면의 위아래가 뒤집혔다 (패널 뒤 파란 구의 무게중심: 실제 y 387, Camera 377, Overlay 345 로 뒤집은 위치 333 쪽). Camera 캔버스는 제자리. 셰이더로 뒤집기를 고치는 대신 지금처럼 Camera 캔버스를 권하고 글을 확인된 사실로 바꿨다. 다른 그래픽 API 와 에디터 Game 뷰는 확인하지 않았다.
- 글을 고친 곳: `inverted-hull-outline` 함정(제목을 'Depth Priming 을 켜자 외곽선이 사라진다' 로), `xray-occluded-silhouette` 의 Auto 설명, `ui-backdrop-blur` 의 캔버스 설명과 함정, 두 셰이더 주석, 가이드 4절과 8절.

## 22. 후속 4: 무대·촬영 확장 (2026-11-03)

Jay 가 handoff 4번의 네 묶음을 차례로 진행하라고 했다. 새 기능은 무대 옵션으로 넣어 쓰는 표본만 바뀌고, 기능마다 그것이 필요한 표본에 붙여 웹과 Unity 를 같이 찍어 확인했다. 옵션은 링크의 `s.<옵션>=<값>` 과 `tools/unity.mjs --stage=` 로 어느 표본에서나 시험할 수 있다.

- **UGUI Canvas 촬영:** UI 표본(`stage.ui`, sprite 무대)을 Unity 에서 Screen Space - Camera 캔버스의 Image 로 찍는다. `ui-sdf-shape`, `ui-sheen-sweep` 의 새 촬영이 예전 SpriteRenderer 촬영과 크기·모양이 같았다. `stage.uiAspect` 로 Image 비율을 정하고(웹은 스프라이트를 같은 비로 늘림), 검증 변형 `--ui-mask=rect|mask` 가 Image 를 RectMask2D 나 Mask 안에 넣는다. 확인한 것: RectMask2D 와 Mask 둘 다 가운데 70% 로 잘린다, 4:1 Image 에서 SDF 원은 원으로 남고 광택 띠 각도가 유지된다, 1:4 Image 에서도 도형이 폭에 맞춰 줄 뿐 깨지지 않는다. 기존 UI 표본의 글이 맞았다.
- **여러 층 스프라이트 (`stage.layers`):** 같은 스프라이트를 값만 덮어쓴 층으로 본체 뒤에 그린다. 웹은 층 머티리얼이 본체와 유니폼 객체를 나눠 쓰고 조절 값만 따로 둔다. `tiling-scroll-parallax` 에 '먼 층' 값(계수 0.25, 공기 0.55)의 층을 0.45 유닛 위에 더했다. 연속 촬영으로 먼 층이 더 느리게 흐르는 것을 확인했다.
- **정지 비교 (`tools/compare.mjs`):** 같은 값으로 Unity 와 웹(`t=0`)을 찍어 나란히 붙이고 평균 차이를 낸다. Unity 촬영의 시간은 정할 수 없어 흐르는 값을 `--set` 으로 0 에 둔다. 패럴랙스 평균 차이 2.0. 바닥 격자가 원래 두 화면에서 조금 어긋나 메시 무대는 5~8 이 나온다. PNG 읽기·쓰기는 `tools/lib/png.mjs` (의존성 없음).
- **그림자 소품 (`stage.shadowProp`):** 물체 위 해 쪽에 작은 공을 띄운다. 웹은 공 그림자를 `SgInput.shadow` 로 넘기고 `lightColor`, `lighting` 에도 곱한다 (Unity 래퍼가 `light.color * shadowAttenuation` 을 넘기는 것과 같다). `toon-ramp-lit` 에 붙여 받는 그림자가 띠 한 칸 어두운 층으로 끊기는 것을 웹과 Unity 에서 같게 확인했다. 처음 자리는 공이 화면 밖이라 해 쪽 광선 위로 옮겼다.
- **밝은 무대 (`stage.bright`):** 하늘색 배경과 밝은 바닥. `screen-vignette` 에 붙여 검은 비네트가 기본 촬영에서도 보이므로 썸네일 지정(저체력)을 없앴다.
- **기울이기 (`stage.tilt`):** 물체를 Z 축으로 눕힌 채 Y 로 돌린다. 처음에는 X 축(카메라 쪽)으로 기울였는데 효과 끄기에서 눈이 앞면을 거의 다 덮어 실수가 잘 안 보여, 원래 우회가 흉내 내던 Z 축 90도로 바꿨다. `surface-wet-snow` 의 효과 끄기가 '눕힌 셈 치는' `-normalOS.x` 대신 진짜 `normalOS.y` 를 쓴다.
- **Deferred 변형 (`--rendering-path`):** 메시·깊이 표본 17개를 Forward 와 Deferred 로 찍었다. 시간을 쓰지 않는 표본은 평균 차이 0.1~0.2 로 같았고, 차이가 큰 표본(물결, 홀로그램, 풀 등)은 시트로 보니 시간 위상만 달랐다. Deferred 에서 사라지거나 깨지는 표본은 없다.
- **볼록하지 않은 메시 (`mesh: 'torus'`):** 웹과 Unity 가 같은 고리를 만든다 (`torus.ts`, `SgTorus.cs`). 외곽선과 실루엣 표본을 고리로 찍어 두 화면이 같았다. 관찰: 뒤집은 껍데기 외곽선은 고리 바깥 윤곽에만 생기고 구멍 안쪽 가장자리에는 거의 생기지 않는다 (웹·Unity 같음). 표본 글에는 아직 넣지 않았다.
- 다시 찍은 표본: `toon-ramp-lit`, `tiling-scroll-parallax`, `screen-vignette`, `surface-wet-snow`, 그리고 Canvas 경로로 찍은 `ui-sdf-shape`, `ui-sheen-sweep`.
- 독립 리뷰: 큰 결함 없음. 고친 것: 툰 공 그림자 글(띠 한 칸이 아니라 맨 아래 띠로 떨어진다), `uiAspect` 검사를 sprite 무대로 한정, 가이드의 '모든 래퍼가 감쇠를 곱한다'와 '큐브와 겹친다' 일반화, 늦게 읽힌 텍스처가 다음 표본의 무대 크기를 바꾸는 경우, 링크 `s.` 의 잘못된 값. 전체 검사 통과, gzip 1,074KB (70%).
