# Shader Gallery

유니티 개발자 양성과정의 강사와 수강생이 함께 보는 게임 셰이더 갤러리. 화면과 샘플 코드, 프롬프트만 보고도 AI에게 같은 효과를 지시해 자기 프로젝트에 넣을 수 있게 만든다.

- 바로 보기: https://koohoo-dev.github.io/edu-lecture-shader-gallery/ (main 에 push 하면 Actions 가 다시 배포한다)
- 기준: Unity 6.3 LTS (6000.3), URP 17.3, HLSL 코드 셰이더
- 결과물: HTML 파일 하나 (`web/dist/index.html`). 더블클릭과 GitHub Pages 에서 똑같이 동작한다
- 브라우저 미리보기와 Unity 셰이더가 같은 `core.hlsl` 을 쓰고, 모든 표본을 실제 Unity 에서 컴파일하고 촬영한다

| 하고 싶은 일 | 볼 곳 |
|---|---|
| 계획과 진행 상황 | [docs/plan.md](docs/plan.md) |
| 새 표본 만들기 | [docs/specimen-guide.md](docs/specimen-guide.md) |
| 셰이더 목록과 근거 | [docs/shader-selection.md](docs/shader-selection.md) |

## 폴더

```text
Assets/Shaders/<id>/        표본의 core.hlsl, .shader, C#. Unity 와 웹이 같은 파일을 쓴다
Assets/ShaderGalleryStage/  스프라이트 무대 텍스처
Assets/Editor/ShaderGallery/ 컴파일 검사와 촬영 코드
web/                        Vite 앱. web/src/specimens/<id>/meta.ts 가 표본의 글과 값이다
tools/                      검사, 촬영, Skill 생성 스크립트 (Node 24)
skill/                      표본 데이터에서 생성한 Skill
docs/  research/            계획, 규격, 조사 자료
```

## 자주 쓰는 명령

```bash
npm --prefix web install
```

```bash
npm --prefix web run dev
```

```bash
npm --prefix web run build
```

```bash
node tools/check.mjs
```

```bash
node tools/unity.mjs
```

```bash
node tools/shots.mjs
```

```bash
node tools/build-skill.mjs
```

`tools/unity.mjs` 는 열린 에디터에 명령 파일로 맡기거나, 프로젝트 복사본을 배치 모드로 돌린다. 자세한 절차는 표본 가이드 8절.

## 링크 옵션

`#/s/<표본>?` 뒤에 `&` 로 이어 붙인다. 예: `#/s/dissolve-edge-glow?auto=0&step=2&p._Threshold=0.6`

| 옵션 | 뜻 |
|---|---|
| `preset=<id>` | 프리셋으로 시작 |
| `p.<속성>=<값>` | 값 하나를 덮어쓴다 |
| `step=<n>` | 단계 보기 번호 |
| `off=1` | 효과 끄기 |
| `auto=0` | 자동 데모 끄기 |
| `speed=0.5` | 배속 (1, 0.5, 0.25) |
| `event=<id>` | 열린 뒤 이벤트 한 번 |
| `present=1` | 발표 모드 |

수업 단축키: `Space` 재생, `1~9` 이벤트, `J` 효과 끄기, `S` 배속, `A` 자동 데모, `←` `→` 단계, `P` 발표 모드.

## 라이선스

코드와 새로 그린 그래픽은 MIT. 게임명과 상표는 각 권리자의 소유다. [LICENSE](LICENSE)
