import { applyValuesToShader, materialTable } from './codegen.ts'
import { FIXED_RULES } from './prompts.ts'
import type { ParamValues, SpecimenFile, SpecimenMeta } from './types'
import type { ZipEntry } from './zip.ts'

/* 표본 데이터에서 Agent Skill 을 만든다. 앱의 zip 다운로드와 tools/build-skill.mjs 가 같은 함수를 쓴다.
 * frontmatter 는 표준 필드만 써서 claude.ai 업로드와 Claude Code 에서 같은 zip 이 동작한다. */

export const SKILL_NAME = 'shader-gallery'
export const DESCRIPTION_LIMIT = 1536
export const SKILL_LINE_LIMIT = 500

export interface SkillSource {
  meta: SpecimenMeta
  files: SpecimenFile[]
  /** 표본 폴더의 PNG */
  textures?: { name: string; data: Uint8Array }[]
}

const defaults = (meta: SpecimenMeta): ParamValues => Object.fromEntries(meta.params.map(p => [p.key, p.default]))

const KIND_NAMES = { mesh: '메시', sprite: '스프라이트', depth: '깊이 사용', fullscreen: '전체 화면' } as const

function guide(meta: SpecimenMeta, files: SpecimenFile[], textures: string[]): string {
  const list = (lines: string[]) => lines.map(line => `- ${line}`).join('\n')
  return [
    `# ${meta.title} (${meta.titleEn})`,
    meta.oneLiner,
    `무대 종류: ${meta.stage.ui ? 'UI (UGUI Image)' : KIND_NAMES[meta.stage.kind]}. 난이도 ${meta.difficulty}/3. 기법: ${meta.tags.join(', ')}.`,
    `## 파일\n${list([...files.map(f => f.name), ...textures].map(name => `\`${name}\``))}\n\n모두 프로젝트의 \`Assets/Shaders/${meta.id}/\` 에 복사한다.`,
    ...(meta.requires?.length ? [`## URP 설정\n사용 중인 URP Asset 에서 켠다: ${meta.requires.map(r => (r === 'depth' ? 'Depth Texture' : 'Opaque Texture')).join(', ')}.`] : []),
    `## 넣는 순서\n${meta.unity.setup.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
    `## 확인\n${meta.unity.verify}`,
    `## 기본 머티리얼 값\n${materialTable(meta.params, defaults(meta))}`,
    `## 동작 단계\n${meta.steps.map(s => `${s.n}. **${s.label}**: ${s.body}`).join('\n')}`,
    `## 주의할 점\n${list(meta.unity.pitfalls)}`,
    `## 흔한 실수\n${list(meta.mistakes.map(m => `**${m.title}**: ${m.body}`))}`,
    `## 변형 예시\n${list(meta.prompt.adaptIdeas)}`,
    ...(meta.unity.graph ? [`## Shader Graph 에서 쓰기\n${meta.unity.graph}`] : []),
  ].join('\n\n') + '\n'
}

function description(specimens: SkillSource[]): string {
  const names = specimens.map(s => `${s.meta.title}(${s.meta.titleEn})`).join(', ')
  const text = `Unity URP 에 게임 셰이더 효과를 넣거나 변형하거나 고칠 때 쓴다. Unity 6.3 LTS, URP 17.3, HLSL 코드 셰이더 기준의 검증된 샘플과 설정 순서가 들어 있다. 포함된 효과: ${names}. 비슷한 효과를 새로 만들 때도 기준 코드로 삼는다.`
  if (text.length > DESCRIPTION_LIMIT) throw new Error(`Skill 설명이 ${DESCRIPTION_LIMIT}자를 넘습니다: ${text.length}`)
  return text
}

function skillMarkdown(name: string, specimens: SkillSource[], version: string): string {
  const rows = specimens.map(({ meta }) => `| \`${meta.id}\` | ${meta.title} | ${KIND_NAMES[meta.stage.kind]} | ${meta.oneLiner} |`)
  const text = [
    '---',
    `name: ${name}`,
    `description: ${JSON.stringify(description(specimens))}`,
    'license: MIT',
    'compatibility: Unity 6.3 LTS (6000.3), Universal Render Pipeline 17.3',
    'metadata:',
    `  version: "${version}"`,
    '  source: "Shader Gallery"',
    '---',
    '',
    '# Shader Gallery',
    '',
    '사용자가 Unity 셰이더 효과를 요청하면 아래 목록에서 가장 가까운 효과를 고르고, 그 효과의 `references/<id>/guide.md` 만 읽는다. 다른 효과의 자료는 읽지 않는다.',
    '',
    '## 효과 목록',
    '',
    '| ID | 효과 | 무대 | 설명 |',
    '|---|---|---|---|',
    ...rows,
    '',
    '## 진행 순서',
    '',
    '1. `references/<id>/guide.md` 를 읽는다.',
    '2. 같은 폴더의 `.shader`, `core.hlsl`, C#, PNG 파일을 프로젝트의 `Assets/Shaders/<id>/` 에 그대로 복사한다.',
    '3. guide 의 넣는 순서대로 머티리얼과 렌더러 설정을 안내하거나 적용한다.',
    '4. 사용자가 다른 모습을 원하면 효과 본체인 `core.hlsl` 을 고친다. `.shader` 는 새 속성을 넣거나 패스 설정이 달라질 때만 고친다.',
    '5. 새 머티리얼 값은 `Properties` 와 `CBUFFER_START(UnityPerMaterial)` 양쪽에 넣는다.',
    '6. guide 의 확인 방법을 사용자에게 알려 준다.',
    '',
    '## 지킬 것',
    '',
    FIXED_RULES,
    '',
    '## 파일을 다룰 때',
    '',
    '- `SG_STEP(...)` 줄과 `#ifdef SG_OFF` 블록은 웹 갤러리의 단계 보기와 효과 끄기에 쓰는 표시다. Unity 에서는 아무 일도 하지 않으므로 그대로 두어도 되고 지워도 된다.',
    '- `SG_OUTLINE`, `SG_OCCLUDED` 는 다르다. 외곽선이나 가려진 실루엣이 있는 효과에서 Unity 가 실제로 쓰는 스위치다. 두 번째 패스의 `#define` 과 패스마다 하는 `core.hlsl` include 를 지우거나 합치지 않는다.',
    '- 표에 없는 효과는 가장 비슷한 효과의 `.shader` 를 틀로 삼아 새로 만든다.',
    '',
  ].join('\n')
  const lines = text.split('\n').length
  if (lines > SKILL_LINE_LIMIT) throw new Error(`SKILL.md 가 ${SKILL_LINE_LIMIT}줄을 넘습니다: ${lines}`)
  return text
}

/** Skill 폴더의 파일 목록을 만든다. specimens 가 하나면 그 효과만 담은 Skill 이 된다 */
export function buildSkillFiles(specimens: SkillSource[], version: string, single = false): ZipEntry[] {
  const name = single && specimens.length === 1 ? `${SKILL_NAME}-${specimens[0].meta.id}` : SKILL_NAME
  const entries: ZipEntry[] = [{ path: `${name}/SKILL.md`, content: skillMarkdown(name, specimens, version) }]
  for (const { meta, files, textures = [] } of specimens) {
    entries.push({ path: `${name}/references/${meta.id}/guide.md`, content: guide(meta, files, textures.map(t => t.name)) })
    for (const file of files) {
      const code = file.name.endsWith('.shader') ? applyValuesToShader(file.code, meta.params, defaults(meta)) : file.code
      entries.push({ path: `${name}/references/${meta.id}/${file.name}`, content: code.replace(/\r\n/g, '\n') })
    }
    for (const texture of textures) entries.push({ path: `${name}/references/${meta.id}/${texture.name}`, content: texture.data })
  }
  return entries
}
