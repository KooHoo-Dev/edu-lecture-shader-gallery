import { applyValuesToShader, materialTable } from './codegen.ts'
import type { ParamValues, Requirement, SpecimenFile, SpecimenMeta, StageKind } from './types'

/* AI 지시 프롬프트. 특정 AI 도구에 묶지 않는 평범한 Markdown 이다.
 * 웹 앱과 Skill 생성 스크립트가 같은 함수를 쓴다. */

export type PromptKind = 'direct' | 'adapt' | 'troubleshoot'

export const PROMPT_LABELS: Record<PromptKind, { name: string; desc: string }> = {
  direct: { name: '그대로 넣기', desc: '코드를 바꾸지 않고 내 프로젝트에 추가한다' },
  adapt: { name: '내 프로젝트에 맞게 변형', desc: '대괄호 칸을 채워 원하는 방향으로 바꾼다' },
  troubleshoot: { name: '문제 해결', desc: '넣었는데 안 될 때 증상을 적어 맡긴다' },
}

const ENVIRONMENT = ['- Unity 6.3 LTS (6000.3), URP 17.3', '- HLSL 코드 셰이더 (Shader Graph 아님)'].join('\n')

/** 프롬프트에 항상 들어가는 금지 사항 */
export const FIXED_RULES = [
  '- `HLSLPROGRAM` 과 URP 패키지(`Packages/com.unity.render-pipelines.universal`, `com.unity.render-pipelines.core`)의 include 만 쓴다. `CGPROGRAM`, `UnityCG.cginc`, Surface Shader 는 쓰지 않는다.',
  '- SRP Batcher 호환을 유지한다. 머티리얼 값은 모두 `CBUFFER_START(UnityPerMaterial)` 안에 둔다.',
  '- 렌더 패스를 새로 만들어야 하면 Render Graph(`RecordRenderGraph`)로 작성한다. `Execute`, `OnCameraSetup`, `cmd.Blit` 같은 구버전 렌더 패스 API 는 쓰지 않는다.',
  '- `SG_STEP` 줄, `#ifdef SG_OFF` 블록, 주석의 웹 미리보기 언급은 갤러리에서 쓰는 표시다. Unity 에서는 아무 일도 하지 않는다. 이 프로젝트에는 웹 미리보기가 없으니 웹 쪽 수정이나 주의 사항은 적지 않는다.',
].join('\n')

const KIND_STEPS: Record<StageKind, string[]> = {
  mesh: ['이 셰이더로 머티리얼을 만들어 대상 MeshRenderer 에 넣는다.'],
  sprite: [
    '이 셰이더로 머티리얼을 만들어 대상 SpriteRenderer 의 Material 칸에 넣는다.',
    '스프라이트 임포트 설정에서 Mesh Type 을 Full Rect 로 바꾼다.',
  ],
  depth: ['이 셰이더로 머티리얼을 만들어 대상 MeshRenderer 에 넣는다.'],
  fullscreen: [
    '이 셰이더로 머티리얼을 만든다.',
    '사용 중인 렌더러 에셋(Universal Renderer Data 또는 Renderer 2D Data)에 Add Renderer Feature 로 Full Screen Pass Renderer Feature 를 추가하고, Pass Material 에 이 머티리얼을 넣는다. Injection Point 는 Before Rendering Post Processing, Fetch Color Buffer 는 켠다.',
  ],
}

/** stage.ui 표본은 SpriteRenderer 가 아니라 UGUI Image 에 넣는다 */
const UI_STEPS = [
  '이 셰이더로 머티리얼을 만들어 Canvas 아래 Image 의 Material 칸에 넣는다. 텍스처는 Image 의 Source Image 로 정한다.',
  '여러 Image 가 값을 따로 가지려면 Image 마다 머티리얼 복사본을 쓴다 (Image.material 에 넣는다고 복사본이 생기지는 않는다).',
]

/** URP Asset 에서 켜야 하는 설정 */
const REQUIRE_STEPS: Record<Requirement, string> = {
  depth: '사용 중인 URP Asset 의 Depth Texture 를 켠다. 품질 단계마다 URP Asset 이 다르면 모두 켠다. 카메라의 Depth Texture 가 Off 이면 Use Pipeline Settings 로 바꾼다. Universal Renderer 의 Depth Texture Mode 가 After Transparents 이면 투명 셰이더가 깊이를 읽지 못하므로 After Opaques 로 둔다.',
  opaque: '사용 중인 URP Asset 의 Opaque Texture 를 켠다. 품질 단계마다 URP Asset 이 다르면 모두 켠다. 카메라의 Opaque Texture 가 Off 이면 Use Pipeline Settings 로 바꾼다.',
  normals: '법선 텍스처가 필요하다. 전체 화면 효과는 Full Screen Pass Renderer Feature 의 Requirements 에서 Normal 을 켠다 (Depth 도 쓰면 함께 켠다). 그 밖의 효과는 SSAO 처럼 법선을 요청하는 기능이 있어야 만들어진다.',
}

/** 표본 폴더 PNG 의 임포트 설정과 머티리얼 칸. 스프라이트의 _MainTex 는 SpriteRenderer 의 스프라이트가 채운다 */
function textureSteps(meta: SpecimenMeta): string[] {
  return Object.entries(meta.stage.textures ?? {}).map(([name, t]) => {
    // 데이터, 포인트 텍스처는 압축하면 값이 바뀐다 (촬영 도구도 압축하지 않는다)
    const compression = t.linear || t.point ? ', Compression 을 None' : ''
    const settings = `Inspector 에서 sRGB (Color Texture) 를 ${t.linear ? '끄고' : '켜고'}, Wrap Mode 를 ${t.repeat ? 'Repeat' : 'Clamp'}, Filter Mode 를 ${t.point ? 'Point' : 'Bilinear'}${compression} 로 둔다`
    const slot = meta.stage.kind === 'sprite' && name === '_MainTex' ? '스프라이트로 쓴다' : `머티리얼의 \`${name}\` 칸에 넣는다`
    return `\`${t.file}\` 을 같은 폴더에 두고 ${settings}. ${slot}.`
  })
}

export interface PromptSource {
  meta: SpecimenMeta
  files: SpecimenFile[]
}

/** 현재 값이 반영된 파일 목록 */
export function filesWithValues(source: PromptSource, values: ParamValues): SpecimenFile[] {
  return source.files.map(f => (f.name.endsWith('.shader') ? { ...f, code: applyValuesToShader(f.code, source.meta.params, values) } : f))
}

function codeSection(source: PromptSource, values: ParamValues): string {
  const pngs = Object.values(source.meta.stage.textures ?? {}).map(t => `\`${t.file}\``)
  const textureNote = pngs.length ? `\n\n### 텍스처\n${pngs.join(', ')} 은 글로 넣을 수 없어 갤러리의 '이 효과만 zip' 에 들어 있다. 받아서 같은 폴더에 둔다.` : ''
  return filesWithValues(source, values)
    .map(f => `### Assets/Shaders/${source.meta.id}/${f.name}\n\n\`\`\`${f.lang === 'csharp' ? 'csharp' : 'hlsl'}\n${f.code.replace(/\r\n/g, '\n').trimEnd()}\n\`\`\``)
    .join('\n\n') + textureNote
}

function numbered(lines: string[]): string {
  return lines.map((line, i) => `${i + 1}. ${line}`).join('\n')
}

/** 표본별로 더하는 지킬 것. 두 번째 패스의 SG_OUTLINE, SG_OCCLUDED 는 갤러리 표시가 아니라 Unity 에서 쓰는 스위치다 */
function rules(meta: SpecimenMeta): string {
  const extra = [
    ...(meta.stage.outline ? ['- `SG_OUTLINE` 은 Unity 에서도 쓰는 스위치다. 외곽선 패스의 `#define SG_OUTLINE` 과 패스마다 하는 `core.hlsl` include 를 지우거나 합치지 않는다.'] : []),
    ...(meta.stage.occluded ? ['- `SG_OCCLUDED` 는 Unity 에서도 쓰는 스위치다. 가려진 부분 패스(`ZTest Greater`)의 `#define SG_OCCLUDED` 와 패스마다 하는 `core.hlsl` include 를 지우거나 합치지 않는다.'] : []),
  ]
  return [FIXED_RULES, ...extra].join('\n')
}

export function buildPrompt(kind: PromptKind, source: PromptSource, values: ParamValues): string {
  const { meta } = source
  const head = `${meta.prompt.goal}`
  const table = materialTable(meta.params, values)
  const code = codeSection(source, values)

  if (kind === 'direct') {
    const steps = [`아래 파일을 \`Assets/Shaders/${meta.id}/\` 에 그대로 만든다. 코드는 바꾸지 않는다.`, ...textureSteps(meta), ...(meta.requires ?? []).map(r => REQUIRE_STEPS[r]), ...(meta.stage.ui ? UI_STEPS : KIND_STEPS[meta.stage.kind]), '머티리얼 값을 아래 표대로 맞춘다.', `확인: ${meta.unity.verify}`]
    return [
      `# Unity 셰이더 추가: ${meta.title}`,
      head,
      `## 환경\n${ENVIRONMENT}`,
      `## 할 일\n${numbered(steps)}`,
      `## 머티리얼 값\n${table}`,
      `## 지킬 것\n${rules(meta)}`,
      `## 주의할 점\n${meta.unity.pitfalls.map(p => `- ${p}`).join('\n')}`,
      `## 파일\n\n${code}`,
    ].join('\n\n')
  }

  if (kind === 'adapt') {
    return [
      `# Unity 셰이더 변형: ${meta.title}`,
      `아래 셰이더를 기준으로 내 프로젝트에 맞게 바꿔 줘. 원래 효과: ${meta.oneLiner}`,
      `## 환경\n${ENVIRONMENT}\n- 렌더러: [Universal Renderer 또는 2D Renderer]\n- 플랫폼: [PC, 모바일, WebGL 중 해당]`,
      `## 바꾸고 싶은 점\n[여기에 적는다. 예: ${meta.prompt.adaptIdeas[0] ?? '색과 속도를 바꾸고 싶다'}]`,
      `## 바꾸는 규칙\n${[
        '- 효과 본체는 `core.hlsl` 에서 고치고, `.shader` 는 새 속성을 넣거나 패스 설정이 달라질 때만 고친다.',
        '- 새 머티리얼 값은 `Properties` 와 `CBUFFER_START(UnityPerMaterial)` 양쪽에 넣는다.',
        '- 바꾼 파일은 일부가 아니라 전체 내용을 출력한다.',
        '- 무엇을 왜 바꿨는지 세 줄 이내로 설명하고, 바뀐 값과 확인 방법을 적는다.',
      ].join('\n')}`,
      `## 지킬 것\n${rules(meta)}`,
      `## 변형 예시\n${meta.prompt.adaptIdeas.map(i => `- ${i}`).join('\n')}`,
      `## 현재 머티리얼 값\n${table}`,
      `## 현재 파일\n\n${code}`,
    ].join('\n\n')
  }

  return [
    `# Unity 셰이더 문제 해결: ${meta.title}`,
    '이 셰이더를 넣었는데 제대로 보이지 않아. 원인을 찾아 고쳐 줘.',
    `## 환경\n${ENVIRONMENT}\n- 렌더러: [Universal Renderer 또는 2D Renderer]\n- 플랫폼: [PC, 모바일, WebGL 중 해당]`,
    '## 증상\n- 보이는 모습: [여기에 적는다]\n- Console 오류: [있으면 그대로 붙인다]\n- 내가 넣은 곳과 순서: [여기에 적는다]',
    `## 먼저 확인할 것\n${[...meta.mistakes.map(m => `- ${m.title}: ${m.body}`), ...meta.unity.pitfalls.map(p => `- ${p}`)].join('\n')}`,
    `## 고치는 규칙\n${[
      '- 가능성이 높은 원인부터 하나씩 확인하게 안내한다. 한 번에 여러 곳을 바꾸지 않는다.',
      '- 설정 문제면 어느 창의 어느 항목인지 적는다. 코드 문제면 바꾼 파일 전체를 출력한다.',
      '- 고친 뒤 확인 방법을 적는다.',
    ].join('\n')}`,
    `## 지킬 것\n${rules(meta)}`,
    `## 정상 동작 기준\n${meta.unity.verify}`,
    `## 기준 머티리얼 값\n${table}`,
    `## 기준 파일\n\n${code}`,
  ].join('\n\n')
}
