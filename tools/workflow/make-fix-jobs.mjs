// 리뷰 반영 수정 잡을 같은 틀로 만든다.
//   node tools/workflow/make-fix-jobs.mjs <수정 명세.mjs>
// 명세 형식은 tools/workflow/fix-specs-example.mjs (묶음 6). 구현 브랜치를 main 에 합친 뒤 만든다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO = path.resolve(fileURLToPath(import.meta.url), '../../..')
const { default: SPECS } = await import(pathToFileURL(path.resolve(process.argv[2])).href)

function job(spec) {
  const textures = spec.textures ?? []
  const allowed = ['Read', 'Edit', 'Write', 'Glob', 'Grep', '"Bash(node tools/check.mjs *)"', '"Bash(node tools/live.mjs *)"', ...(textures.length ? ['"Bash(node tools/gen-texture.mjs *)"'] : []), '"Bash(git status*)"', '"Bash(git diff*)"', '"Bash(ls *)"']
  const writePaths = [`Assets/Shaders/${spec.id}/**`, `Assets/Shaders/${spec.id}.meta`, `web/src/specimens/${spec.id}/**`, `web/src/shots/${spec.id}/**`, ...textures.map(t => `tools/textures/${t}.mjs`)]
  const list = items => items.map((t, i) => `${i + 1}. ${t}`).join('\n')
  return `---
# 묶음 ${spec.bundle} 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: ${spec.budgetUsd ?? 5}
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

# 표본 수정: ${spec.id} 리뷰 반영

\`${spec.id}\` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 \`docs/specimen-guide.md\` 를 따른다. ${spec.keep}
${spec.changed ? `\n리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):\n${spec.changed.map(c => `- ${c}`).join('\n')}\n` : ''}
## 필수

${list(spec.required)}
${spec.recommended?.length ? `\n## 권장\n\n${spec.recommended.map((t, i) => `${spec.required.length + i + 1}. ${t}`).join('\n')}\n` : ''}
## 끝내기 전에

1. \`node tools/check.mjs ${spec.id}\` 를 통과시킨다.
2. \`node tools/live.mjs\` 로 ${spec.shots ?? '기본, 효과 끄기, 바꾼 단계와 프리셋'} 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 \`meta.ts\` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
`
}

for (const spec of SPECS) {
  fs.writeFileSync(path.join(REPO, 'jobs', `${spec.id}-fix.md`), job(spec))
  console.log(`jobs/${spec.id}-fix.md`)
}
