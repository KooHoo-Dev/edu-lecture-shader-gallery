// 표본 구현 잡 파일을 같은 틀로 만든다 (jobs/_specimen-template.md 와 같은 내용).
//   node tools/workflow/make-jobs.mjs <명세.mjs> [id ...]
// 명세 형식은 tools/workflow/specs-example.mjs (묶음 6). id 를 주면 그 잡만 쓴다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO = path.resolve(fileURLToPath(import.meta.url), '../../..')

function job(spec) {
  const textures = spec.textures ?? []
  const allowed = ['Read', 'Edit', 'Write', 'Glob', 'Grep', '"Bash(node tools/check.mjs *)"', '"Bash(node tools/live.mjs *)"', ...(textures.length ? ['"Bash(node tools/gen-texture.mjs *)"'] : []), '"Bash(git status*)"', '"Bash(git diff*)"', '"Bash(ls *)"']
  const writePaths = [
    `Assets/Shaders/${spec.id}/**`,
    `Assets/Shaders/${spec.id}.meta`,
    `web/src/specimens/${spec.id}/**`,
    `web/src/shots/${spec.id}/**`,
    ...textures.map(t => `tools/textures/${t}.mjs`),
  ]
  const stageNote = spec.sampleNote ?? (spec.sample === 'ui-sdf-shape' ? 'UI 래퍼' : spec.sample === 'sprite-outline-hit-flash' ? '스프라이트' : spec.sample === 'force-field-intersection' ? '투명 메시의 참고' : '메시')
  return `---
# 묶음 ${spec.bundle} (plan 5-1). 템플릿 jobs/_specimen-template.md 에서 만들었다.
model: claude-opus-5-5
effort: high
budgetUsd: 10
verify:
  - node tools/check.mjs ${spec.id}
  - node tools/unity.mjs ${spec.id}
  - node tools/shots.mjs ${spec.id}
allowedTools: [${allowed.join(', ')}]
writePaths:
${writePaths.map(p => `  - ${p}`).join('\n')}
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 구현: ${spec.id}

Shader Gallery 에 표본 하나를 새로 만든다. 이 리포는 Unity 프로젝트이고 웹 앱은 \`web/\` 에 있다.

## 먼저 읽을 것

1. \`docs/specimen-guide.md\` 전체. 규격과 절차는 이 문서를 따른다.
2. 기준 샘플 \`Assets/Shaders/${spec.sample}/\` 와 \`web/src/specimens/${spec.sample}/meta.ts\` (${stageNote}). 이미 병합된 다른 표본(\`Assets/Shaders/\` 아래)도 참고할 수 있다.
3. \`docs/shader-selection.md\` 의 "${spec.card}" 카드와 7절 결정 표.

## 표본별

- ID \`${spec.id}\`, 파일과 셰이더 이름 \`${spec.name}\`.
- 제목, 그룹, 순서, 한 줄 설명은 \`web/src/core/registry.ts\` 의 자리표시 항목과 같게 한다 (${spec.meta}).
${spec.items.map(i => `- ${i}`).join('\n')}

## 범위

- 위 \`writePaths\` 밖은 고치지 않는다. 특히 \`web/src/app\`, \`web/src/core\`, \`web/src/stage\`, \`tools\`(자기 텍스처 모듈 말고), \`docs\`, \`skill\`, 다른 표본.
- 규격으로 안 되는 것이 있으면 앱을 고치지 말고 가이드 9절대로 마지막 보고에 요청으로 적는다.
- \`.meta\` 파일은 만들지 않는다. 검증 단계의 Unity 가 만든다.
- Unity 는 직접 돌리지 않는다. 끝나면 도구가 \`verify\` 명령으로 돌린다.
${textures.length ? '- 텍스처는 `node tools/gen-texture.mjs <이름>` 으로 만들고 PNG 를 Read 로 열어 본다. PNG 는 HTML 에 그대로 들어가므로 작게 둔다.\n' : ''}
## 끝내기 전에

1. \`node tools/check.mjs ${spec.id}\` 를 통과시킨다. \`.meta\` 가 없다는 경고는 정상이다.
2. \`node tools/live.mjs\` 로 기본, 단계, 효과 끄기, 프리셋, 이벤트 화면을 찍어 Read 로 직접 본다 (가이드 8절의 명령). 단계 화면은 sRGB 로 보인다는 가이드 3-1절 주의를 따라 글을 화면에 맞춘다.
3. 가이드 8절 완료 체크리스트를 Unity 항목만 빼고 확인한다.

마지막 보고에는 만든 것, 직접 확인하지 못한 것, 가이드 9절 요청을 적는다.
`
}

const [specsPath, ...only] = process.argv.slice(2)
if (!specsPath) {
  console.error('사용: node tools/workflow/make-jobs.mjs <명세.mjs> [id ...]')
  process.exit(1)
}
const { default: SPECS } = await import(pathToFileURL(path.resolve(specsPath)).href)
for (const spec of SPECS.filter(s => !only.length || only.includes(s.id))) {
  fs.writeFileSync(path.join(REPO, 'jobs', `${spec.id}.md`), job(spec))
  console.log(`jobs/${spec.id}.md`)
}
