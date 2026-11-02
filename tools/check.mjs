// Shader Gallery 검사 (Node 만 사용).
//   node tools/check.mjs            # 전체 규격 + web/dist 의 용량, 오프라인 실행, WebGL 컴파일, 무대 동작, Skill 최신 여부
//   node tools/check.mjs <id> ...   # 지정한 표본: 규격 + 그 표본만 넣어 빌드한 뒤 WebGL 컴파일과 무대 동작
//   node tools/check.mjs --links    # + 출처 링크 생존 확인 (인터넷 필요)
//
// 검사 항목 (자세한 규칙은 docs/specimen-guide.md)
//   1. 폴더: kebab-case ID, meta.ts, core.hlsl, .shader, .meta 존재, 이름 규칙, 클래스 중복
//   2. core.hlsl 공통 문법: 금지 문법, Unity·웹 예약어, include 금지
//   3. .shader: HLSLPROGRAM, CBUFFER, 금지 API, core.hlsl include, 혼합과 패스 태그
//   4. 메타와 셰이더 일치: 속성 이름, 범위, 기본값, CBUFFER, SG_STEP 번호, 트랙, 정점 변형, 텍스처, URP 요구 사항
//   5. 글: 개수 규칙, 게임명이 ID·제목에 없는지, inspiredBy 형식
//   6. import 대소문자 (Windows 에서 통과해도 Linux CI 에서 깨진다)
//   7. 페이지: WebGL2 컴파일 로그, 무대가 실제로 그리는지, 이벤트와 자동 데모, 잘라 내기 메시의 그림자, 페이지 오류
//   8. 전체 검사만: dist 용량 예산, 외부 참조, 네트워크 차단 오프라인 실행, Skill 최신 여부

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, parse, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { hexToProperty, propertyPattern } from '../web/src/core/codegen.ts'
import { skillEntries } from './build-skill.mjs'
import { findChrome, withChrome } from './lib/chrome.mjs'
import { loadMeta, specimenIds } from './unity-job.mjs'
import { ensureWebModules } from './lib/worktree.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
ensureWebModules(ROOT)
const WEB = join(ROOT, 'web')
const SHADERS = join(ROOT, 'Assets', 'Shaders')
const DIST = join(WEB, 'dist', 'index.html')
const VITE = join(WEB, 'node_modules', 'vite', 'bin', 'vite.js')
const BUDGET = 5 * 1024 * 1024
const BUDGET_GZIP = 1.5 * 1024 * 1024
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const STAGE_KINDS = ['mesh', 'sprite', 'depth', 'fullscreen']

const errors = []
const warnings = []
const err = message => errors.push(message)
const warn = message => warnings.push(message)

const pascalCase = id =>
  id
    .split('-')
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join('')

/** core.hlsl 에서 양쪽 동작이 갈려 금지한 문법. 컴파일은 통과해도 결과가 달라지는 것들이다 */
const FORBIDDEN = [
  [/\bmul\s*\(/, 'mul 금지: 행렬 곱은 래퍼에서 하거나 2D 회전 헬퍼를 쓴다'],
  [/\b(float|int)\dx\d\b/, '행렬 타입 금지: GLSL 과 행렬 순서가 다르다'],
  [/\bfmod\s*\(/, 'fmod 금지: 음수에서 mod 와 결과가 다르다. x - y * floor(x / y) 로 쓴다'],
  [/\bmod\s*\(/, 'mod 금지: HLSL 에 없다. x - y * floor(x / y) 로 쓴다'],
  [/[^=!<>\s]\s*%\s*[^=\s]|\s%\s/, '% 금지: 정수 전용이고 음수 결과가 다르다'],
  [/\bstatic\b/, 'static 금지: 상수는 #define 으로 쓴다'],
  [/^const\s+float/, '전역 const 대신 #define 을 쓴다 (HLSL 은 static 이 필요하다)'],
  [/\(\s*float[234]?\s*\)/, 'C 형변환 금지: float(x) 로 쓴다'],
  [/\b\d+\.\d*f\b/, '숫자 뒤 f 금지'],
  [/\bfloat[234]\s*\(\s*[-\d.]+\s*\)/, 'float3(1.0) 금지: HLSL 에서 오류. float3(1.0, 1.0, 1.0) 으로 쓴다'],
  [/\bhalf[234]?\b|\bfixed[234]?\b/, 'half, fixed 금지: float 만 쓴다'],
  [/\b(any|all)\s*\(/, 'any, all 금지: 인자 형식이 다르다'],
  [/\b(texture|tex2D|sampler2D|SAMPLE_TEXTURE2D|TEXTURE2D)\b/, '텍스처는 SG_TEX(이름, uv) 로만 읽는다'],
  [/\bclip\s*\(|\bdiscard\b/, 'clip, discard 금지: 알파를 돌려주면 래퍼가 처리한다'],
  [/\b_Time\b|\bunity_|\b_WorldSpaceCameraPos\b|\bUNITY_/, 'Unity 전용 값 금지: SgInput 으로 받는다'],
  [/^\s*#\s*(include|pragma)\b/, '#include, #pragma 금지: 래퍼가 맡는다'],
]

/** HLSL 이나 GLSL 한쪽에서만 예약된 이름. 변수·함수 이름으로 쓰면 다른 쪽에서 깨진다 */
const RESERVED = ['input', 'output', 'common', 'partition', 'active', 'filter', 'sample', 'texture', 'flat', 'smooth', 'centroid', 'noperspective', 'line', 'point', 'triangle', 'pass', 'technique', 'register', 'packoffset', 'linear', 'string', 'vector', 'matrix', 'dword', 'shared', 'snorm', 'unorm', 'groupshared', 'precision', 'highp', 'mediump', 'lowp', 'attribute', 'varying', 'class', 'template', 'this', 'namespace', 'union', 'enum', 'typedef', 'long', 'short', 'double', 'superp', 'interface', 'external', 'uniform', 'buffer', 'sampler', 'mix', 'fract', 'dFdx', 'dFdy', 'ddx_fine', 'ddy_fine', 'vec2', 'vec3', 'vec4']

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, '')).replace(/\/\/.*$/gm, '')
}

function checkCore(id, text) {
  const code = stripComments(text.replace(/\r\n/g, '\n'))
  const lines = code.split('\n')
  for (const [pattern, message] of FORBIDDEN) {
    const line = lines.findIndex(l => pattern.test(l))
    if (line >= 0) err(`${id}/core.hlsl:${line + 1}: ${message}`)
  }
  const declared = new Set()
  for (const m of code.matchAll(/\b(?:float[234]?|int|bool|void)\s+([A-Za-z_]\w*)/g)) declared.add(m[1])
  for (const name of RESERVED) if (declared.has(name)) err(`${id}/core.hlsl: '${name}' 은 HLSL 이나 GLSL 예약어라 이름으로 못 쓴다`)
  if (!/\bfloat4\s+sgEffect\s*\(\s*SgInput\s+i\s*\)/.test(code)) err(`${id}/core.hlsl: float4 sgEffect(SgInput i) 가 없다`)
  if (!/#ifndef SG_STEP[\s\S]*?#define SG_STEP\(n, rgb\)[\s\S]*?#endif/.test(code)) err(`${id}/core.hlsl: 파일 첫머리의 SG_STEP 빈 정의가 없다`)
  if (!/#ifdef SG_OFF[\s\S]*?#endif/.test(code)) err(`${id}/core.hlsl: #ifdef SG_OFF 분기가 없다`)
  return code
}

function checkWrapper(id, name, text, meta) {
  const source = text.replace(/\r\n/g, '\n')
  const code = stripComments(source)
  const where = `${id}/${name}`
  const expected = pascalCase(id)
  for (const [pattern, message] of [
    [/\bCGPROGRAM\b|\bCGINCLUDE\b/, 'CGPROGRAM 금지'],
    [/UnityCG\.cginc/, 'UnityCG.cginc 금지'],
    [/#pragma\s+surface\b/, 'Surface Shader 금지'],
    [/\bcmd\.Blit\b/, '구버전 Blit 금지'],
  ]) {
    if (pattern.test(code)) err(`${where}: ${message}`)
  }
  if (name !== `${expected}.shader`) err(`${where}: 파일 이름은 ${expected}.shader 여야 한다`)
  if (!code.includes('HLSLPROGRAM')) err(`${where}: HLSLPROGRAM 이 없다`)
  if (!code.includes('"RenderPipeline" = "UniversalPipeline"')) err(`${where}: SubShader 태그에 "RenderPipeline" = "UniversalPipeline" 이 없다`)
  if (!code.includes('CBUFFER_START(UnityPerMaterial)')) err(`${where}: CBUFFER_START(UnityPerMaterial) 이 없다`)
  if (!code.includes('#include "core.hlsl"')) err(`${where}: #include "core.hlsl" 이 없다`)
  if (!new RegExp(`Shader\\s+"ShaderGallery/${expected}"`).test(code)) err(`${where}: 셰이더 이름은 "ShaderGallery/${expected}" 이어야 한다`)

  const cbuffer = /CBUFFER_START\(UnityPerMaterial\)([\s\S]*?)CBUFFER_END/.exec(code)?.[1] ?? ''
  for (const def of meta.params) {
    const m = propertyPattern(def.key).exec(source)
    if (!m) {
      err(`${where}: Properties 에 ${def.key} 가 없다`)
      continue
    }
    if (!new RegExp(`\\b${def.key}\\b`).test(cbuffer)) err(`${where}: CBUFFER 에 ${def.key} 가 없다`)
    const actual = m[2].replace(/\s+/g, '')
    if (def.type === 'range') {
      if (Number(actual) !== def.default) err(`${where}: ${def.key} 기본값이 다르다 (.shader ${actual}, meta ${def.default})`)
      const range = /Range\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(m[1])
      if (!range) err(`${where}: ${def.key} 는 Range 속성이어야 한다`)
      else if (Number(range[1]) !== def.min || Number(range[2]) !== def.max) err(`${where}: ${def.key} 범위가 다르다 (.shader ${range[1]}~${range[2]}, meta ${def.min}~${def.max})`)
    }
    if (def.type === 'toggle' && Number(actual) !== (def.default ? 1 : 0)) err(`${where}: ${def.key} 기본값이 다르다`)
    if (def.type === 'select' && actual !== def.default) err(`${where}: ${def.key} 기본값이 다르다 (.shader ${actual}, meta ${def.default})`)
    if (def.type === 'color') {
      const parse = s => s.replace(/[()]/g, '').split(',').slice(0, 3).map(Number)
      const a = parse(actual)
      const b = parse(hexToProperty(def.default))
      // 16진수 한 칸(1/255)보다 큰 차이만 잡는다
      if (a.some((v, i) => Math.abs(v - b[i]) > 0.006)) err(`${where}: ${def.key} 기본값이 다르다 (.shader ${actual}, meta ${def.default} = ${hexToProperty(def.default)})`)
    }
  }

  // 혼합과 패스 태그가 메타의 무대 설정과 맞아야 웹과 Unity 가 같게 보인다
  const kind = meta.stage.kind
  const blend = meta.stage.blend ?? (kind === 'mesh' ? 'cutout' : 'alpha')
  if (kind !== 'fullscreen') {
    if (blend === 'additive' && !/Blend\s+SrcAlpha\s+One\b/.test(code)) err(`${where}: stage.blend 가 additive 인데 Blend SrcAlpha One 이 없다`)
    // UI 셰이더는 Unity UI/Default 처럼 미리 곱한 알파(Blend One OneMinusSrcAlpha)도 받는다
    const alphaBlend = meta.stage.ui ? /Blend\s+(SrcAlpha|One)\s+OneMinusSrcAlpha/ : /Blend\s+SrcAlpha\s+OneMinusSrcAlpha/
    if (blend === 'alpha' && !alphaBlend.test(code)) err(`${where}: stage.blend 가 alpha 인데 Blend SrcAlpha OneMinusSrcAlpha 가 없다`)
    if (blend === 'cutout' && !/\bclip\s*\(/.test(code)) err(`${where}: stage.blend 가 cutout 인데 clip 이 없다`)
    if (blend !== 'cutout' && !/ZWrite\s+Off/.test(code)) err(`${where}: 투명 혼합인데 ZWrite Off 가 없다`)
    if (blend !== 'cutout' && kind !== 'sprite' && !/"Queue"\s*=\s*"Transparent"/.test(code)) err(`${where}: 투명 혼합인데 "Queue" = "Transparent" 가 없다`)
    if (Boolean(meta.stage.doubleSided) !== /Cull\s+Off/.test(code) && kind !== 'sprite') err(`${where}: Cull Off 와 stage.doubleSided 가 맞지 않다`)
  }
  if (kind === 'mesh' && blend === 'cutout' && /"LightMode"\s*=\s*"UniversalForward"/.test(code)) err(`${where}: 불투명·잘라 내기 메시는 Deferred 에서도 그려지도록 UniversalForwardOnly 를 쓴다`)
  if (meta.stage.ui) {
    // UGUI 의 UI 셰이더 구조. Overlay 캔버스는 첫 패스를 쓰고, Camera·World 캔버스는 URP 가 SRPDefaultUnlit 으로 그린다
    // 미리보기는 스프라이트 무대지만, 씬 색상을 읽는 UI(배경 흐림)는 깊이 무대를 쓴다
    if (kind !== 'sprite' && kind !== 'depth') err(`${where}: stage.ui 는 sprite, depth 무대에서만 쓴다`)
    if (/"LightMode"/.test(code)) err(`${where}: UI 셰이더는 LightMode 태그 없는 패스 하나를 쓴다`)
    for (const [pattern, what] of [
      [/\[PerRendererData\]\s*_MainTex/, '[PerRendererData] _MainTex'],
      [/_StencilComp/, 'Stencil 속성(_StencilComp 등)'],
      [/_StencilReadMask/, '_StencilReadMask'],
      [/Stencil\s*\{/, 'Stencil 블록'],
      [/_ClipRect/, 'RectMask2D 의 _ClipRect'],
      [/UNITY_UI_CLIP_RECT/, 'multi_compile_local _ UNITY_UI_CLIP_RECT'],
      [/UNITY_UI_ALPHACLIP/, 'multi_compile_local _ UNITY_UI_ALPHACLIP (Mask 가 켠다)'],
      [/unity_GUIZTestMode/, 'ZTest [unity_GUIZTestMode]'],
      [/ColorMask\s+\[_ColorMask\]/, 'ColorMask [_ColorMask]'],
    ]) {
      if (!pattern.test(code)) err(`${where}: UI 셰이더에 ${what} 가 없다`)
    }
  } else if (kind === 'sprite' && !(code.includes('"Universal2D"') && code.includes('"UniversalForward"'))) {
    err(`${where}: 스프라이트는 Universal2D 와 UniversalForward 패스가 모두 있어야 한다`)
  }
  if (kind === 'depth' && !code.includes('DeclareDepthTexture.hlsl')) err(`${where}: 깊이 무대는 DeclareDepthTexture.hlsl 을 include 한다`)
  if (kind === 'fullscreen' && !code.includes('Blit.hlsl')) err(`${where}: 전체 화면 무대는 Blit.hlsl 을 include 한다`)
  return code
}

function checkMeta(id, meta, core, wrapper) {
  const where = `${id}/meta.ts`
  if (meta.id !== id) err(`${where}: meta.id(${meta.id})가 폴더명과 다르다`)
  if (!STAGE_KINDS.includes(meta.stage.kind)) err(`${where}: stage.kind 가 잘못됐다`)
  if (!meta.params.length) err(`${where}: params 가 없다`)
  for (const def of meta.params) if (!/^_[A-Z]\w*$/.test(def.key)) err(`${where}: 속성 이름 ${def.key} 는 _PascalCase 여야 한다`)
  const keys = new Set(meta.params.map(p => p.key))

  // 코어에서 쓰는 머티리얼 값은 메타에 있어야 웹 유니폼이 만들어진다
  const textures = new Set([...Object.keys(meta.stage.textures ?? {}), ...(meta.stage.kind === 'sprite' ? ['_MainTex'] : [])])
  for (const m of core.matchAll(/\b_[A-Z]\w*/g)) {
    const name = m[0]
    if (name.endsWith('_TexelSize') && textures.has(name.replace('_TexelSize', ''))) continue
    if (!keys.has(name) && !textures.has(name)) err(`${id}/core.hlsl: ${name} 가 meta.params 나 stage.textures 에 없다`)
  }

  // 아무것도 바꾸지 않는 슬라이더를 막는다. Properties 와 CBUFFER 선언은 사용으로 치지 않는다
  const wrapperBody = wrapper.replace(/Properties\s*\{[\s\S]*?\n\s*\}/, '').replace(/CBUFFER_START\(UnityPerMaterial\)[\s\S]*?CBUFFER_END/g, '')
  for (const key of keys) {
    const word = new RegExp(`\\b${key}\\b`)
    if (!word.test(core) && !word.test(wrapperBody)) err(`${where}: ${key} 를 셰이더 어디에서도 쓰지 않는다`)
  }

  // 메타의 무대 설정과 셰이더 내용이 맞아야 웹과 Unity 가 갈리지 않는다.
  // 외곽선 표본은 SG_OUTLINE 블록에 외곽선 패스의 sgVertex 가 하나 더 있다.
  const vertexCount = [...core.matchAll(/\bfloat3\s+sgVertex\s*\(/g)].length
  const outline = Boolean(meta.stage.outline)
  const hasVertex = vertexCount > 0
  if (vertexCount - (outline ? 1 : 0) !== (meta.stage.vertex ? 1 : 0)) err(`${where}: core.hlsl 의 sgVertex 와 stage.vertex, stage.outline 이 맞지 않다`)
  if (hasVertex && !wrapper.includes('sgVertex(')) err(`${id}/${meta.shaderFile}: 래퍼의 vert 가 sgVertex 를 부르지 않는다`)
  if (hasVertex && !['mesh', 'depth'].includes(meta.stage.kind)) err(`${where}: sgVertex 는 mesh, depth 무대에서만 쓴다`)
  if (outline) {
    if (!/#\s*if(def)?\s+(defined\s*\(\s*)?SG_OUTLINE\b/.test(core)) err(`${where}: stage.outline 이면 core.hlsl 에 #ifdef SG_OUTLINE 블록이 있어야 한다`)
    if (!/#define\s+SG_OUTLINE\b/.test(wrapper)) err(`${id}/${meta.shaderFile}: 외곽선 패스에서 core.hlsl 앞에 #define SG_OUTLINE 을 둔다`)
    if (!/Cull\s+Front\b/.test(wrapper)) err(`${id}/${meta.shaderFile}: 외곽선 패스는 Cull Front 다`)
    if (!/"LightMode"\s*=\s*"SRPDefaultUnlit"/.test(wrapper)) err(`${id}/${meta.shaderFile}: 외곽선 패스의 LightMode 는 SRPDefaultUnlit 이다`)
    if (!['mesh', 'depth'].includes(meta.stage.kind)) err(`${where}: stage.outline 은 mesh, depth 무대에서만 쓴다`)
  } else if (/\bSG_OUTLINE\b/.test(core)) {
    err(`${where}: core.hlsl 에 SG_OUTLINE 이 있으면 stage.outline 을 true 로 둔다`)
  }
  if (/\bsgSceneColor\s*\(/.test(core) && !meta.requires?.includes('opaque')) err(`${where}: 씬 색상을 쓰면 requires 에 'opaque' 를 넣는다`)
  if (/\bdepthDelta\b/.test(core) && !meta.requires?.includes('depth')) err(`${where}: 깊이를 쓰면 requires 에 'depth' 를 넣는다`)
  for (const m of core.matchAll(/\bSG_TEX\s*\(\s*(\w+)/g)) if (!textures.has(m[1])) err(`${where}: 텍스처 ${m[1]} 이 stage.textures 에 없다`)

  // 단계 보기 번호와 SG_STEP 번호
  const coreSteps = [...core.matchAll(/\bSG_STEP\(\s*(\d+)\s*,/g)].map(m => Number(m[1]))
  const metaSteps = meta.steps.map(s => s.n)
  for (const n of metaSteps) if (!coreSteps.includes(n)) err(`${where}: 단계 ${n} 에 해당하는 SG_STEP 이 core.hlsl 에 없다`)
  for (const n of coreSteps) if (!metaSteps.includes(n)) err(`${where}: SG_STEP(${n}) 설명이 meta.steps 에 없다`)
  if (meta.steps.length < 2 || meta.steps.length > 5) err(`${where}: steps 는 2~5개 (${meta.steps.length}개)`)

  // 트랙은 range 값만 움직인다
  const ranges = new Set(meta.params.filter(p => p.type === 'range').map(p => p.key))
  const tracks = [...meta.events.flatMap(e => e.tracks), ...(meta.demo?.loops ?? [])]
  for (const t of tracks) if (!ranges.has(t.key)) err(`${where}: 트랙 ${t.key} 는 range 속성이 아니다`)
  for (const f of meta.demo?.fire ?? []) if (!meta.events.some(e => e.id === f.event)) err(`${where}: demo.fire 의 ${f.event} 이벤트가 없다`)
  if (!meta.demo?.loops?.length && !meta.demo?.fire?.length) warn(`${where}: 자동 데모가 없다`)

  for (const preset of meta.presets) {
    for (const key of Object.keys(preset.values)) if (!keys.has(key)) err(`${where}: 프리셋 ${preset.id} 의 ${key} 가 params 에 없다`)
    if (!KEBAB.test(preset.id)) err(`${where}: 프리셋 ID ${preset.id} 는 kebab-case 여야 한다`)
  }
  for (const capture of meta.captures ?? []) {
    for (const key of Object.keys(capture.values)) if (!keys.has(key)) err(`${where}: 촬영 상태 ${capture.name} 의 ${key} 가 params 에 없다`)
  }
  if ((meta.captures?.length ?? 0) > 3) err(`${where}: captures 는 3개 이내 (HTML 용량)`)

  const count = (list, min, max, label) => {
    if (list.length < min || list.length > max) err(`${where}: ${label} 는 ${min}~${max}개 (${list.length}개)`)
  }
  count(meta.goals, 3, 4, 'goals')
  count(meta.mistakes, 3, 5, 'mistakes')
  count(meta.presets, 2, 5, 'presets')
  count(meta.unity.setup, 2, 7, 'unity.setup')
  count(meta.unity.pitfalls, 2, 6, 'unity.pitfalls')
  count(meta.prompt.adaptIdeas, 2, 6, 'prompt.adaptIdeas')
  count(meta.references, 1, 6, 'references')
  for (const item of meta.inspiredBy) {
    if (item.borrowed.length > 2) err(`${where}: inspiredBy 의 빌린 축은 최대 2개`)
    if (!/\(\d{4}\)$/.test(item.title)) err(`${where}: inspiredBy.title 은 "원제 (연도)" 형식`)
    const name = item.title.replace(/\s*\(\d{4}\)$/, '').toLowerCase()
    if (meta.title.toLowerCase().includes(name) || id.includes(name.replaceAll(' ', '-'))) err(`${where}: 제목·ID 에 게임명 금지`)
  }
  if (meta.flashes && !meta.events.length) warn(`${where}: flashes 인데 이벤트가 없다`)
}

async function checkSpecimens(ids) {
  const titles = []
  const classOwners = new Map()
  for (const folder of specimenIds(ROOT)) {
    const dir = join(SHADERS, folder)
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir).filter(n => n.endsWith('.cs'))) {
      for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/\bclass\s+(\w+)/g)) {
        classOwners.set(m[1], [...(classOwners.get(m[1]) ?? []), folder])
      }
    }
  }
  for (const [name, owners] of classOwners) {
    if (owners.length > 1) err(`C# 클래스 ${name} 이 여러 표본에 있다: ${owners.join(', ')}. Unity 전체 컴파일이 멈춘다`)
  }

  for (const id of ids) {
    if (!KEBAB.test(id)) err(`${id}: 폴더 이름은 kebab-case`)
    const folder = join(SHADERS, id)
    if (!existsSync(folder)) {
      err(`${id}: Assets/Shaders/${id} 폴더가 없다`)
      continue
    }
    const meta = await loadMeta(ROOT, id)
    titles.push([id, meta.title])
    // PNG 는 HTML 에 base64 로 들어가 1.33배가 된다 (가이드 7절)
    for (const file of readdirSync(folder).filter(f => f.toLowerCase().endsWith('.png'))) {
      const kb = statSync(join(folder, file)).size / 1024
      if (kb > 48) err(`${id}/${file}: PNG 가 ${kb.toFixed(0)}KB 다. 48KB 이하로 줄인다`)
      else if (kb > 32) warn(`${id}/${file}: PNG 가 ${kb.toFixed(0)}KB 다. 32KB 이하를 권한다`)
    }
    const corePath = join(folder, 'core.hlsl')
    const shaderPath = join(folder, meta.shaderFile)
    if (!existsSync(corePath)) {
      err(`${id}: core.hlsl 이 없다`)
      continue
    }
    if (!existsSync(shaderPath)) {
      err(`${id}: ${meta.shaderFile} 이 없다`)
      continue
    }
    if (!existsSync(`${folder}.meta`)) warn(`${id}: Assets/Shaders/${id}.meta 가 없다. node tools/unity.mjs ${id} 를 실행하면 생긴다`)
    for (const f of readdirSync(folder)) {
      if (!f.endsWith('.meta') && !existsSync(join(folder, `${f}.meta`))) warn(`${id}/${f}: .meta 가 없다. node tools/unity.mjs ${id} 를 실행하면 생긴다`)
    }
    for (const texture of Object.values(meta.stage.textures ?? {})) if (!existsSync(join(folder, texture.file))) err(`${id}: 텍스처 ${texture.file} 이 없다`)
    const hasWebGlsl = existsSync(join(WEB, 'src', 'specimens', id, 'web.glsl'))
    if (meta.webGlslReason && !hasWebGlsl) err(`${id}: webGlslReason 이 있는데 web.glsl 이 없다`)
    if (!meta.webGlslReason && hasWebGlsl) err(`${id}: web.glsl 을 쓰면 meta.webGlslReason 에 사유를 적는다`)
    const core = checkCore(id, readFileSync(corePath, 'utf8'))
    const wrapper = checkWrapper(id, meta.shaderFile, readFileSync(shaderPath, 'utf8'), meta)
    checkMeta(id, meta, core, wrapper)
    if (!existsSync(join(WEB, 'src', 'shots', id, 'default.webp'))) warn(`${id}: Unity 스크린샷이 없다. node tools/unity.mjs ${id} 뒤 node tools/shots.mjs ${id}`)
  }
  return titles
}

const IMPORT_RE = /(?:import|export)[^'"\n]*?from\s*['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]/g
const EXTS = ['', '.ts', '.tsx', '.js', '.css', '/index.ts', '/index.tsx']

function exactExists(path) {
  if (!existsSync(path)) return false
  let cur = parse(resolve(path)).root
  for (const part of relative(cur, resolve(path)).split(/[\\/]/)) {
    if (!readdirSync(cur).includes(part)) return false
    cur = join(cur, part)
  }
  return true
}

function checkImportCase(dir = join(WEB, 'src')) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      checkImportCase(path)
    } else if (/\.tsx?$/.test(entry.name)) {
      const text = stripComments(readFileSync(path, 'utf8'))
      for (const m of text.matchAll(IMPORT_RE)) {
        const spec = (m[1] ?? m[2]).split('?')[0]
        const base = resolve(dirname(path), spec)
        if (!EXTS.some(ext => exactExists(base + ext))) err(`import 경로 대소문자 또는 존재 불일치: ${relative(ROOT, path)} -> ${spec}`)
      }
    }
  }
}

/** 잘라 내기 메시: 효과 끄기에서는 온전한 그림자, 평소에는 알파를 따라 변하는 그림자여야 한다 */
async function checkCutoutShadow(page, url, id, meta) {
  const probe = async query => {
    await page.goto(`${url}#/s/${id}?auto=0${query}`)
    await page.sleep(600)
    return page.evaluate('window.__sgShadow()')
  }
  const plain = await probe('&off=1')
  if (!plain || plain.area < 0.005) {
    err(`${id}: 효과 끄기에서 온전한 그림자가 보이지 않는다 (${JSON.stringify(plain)})`)
    return
  }
  const shaded = await probe('')

  // sgEffect 가 항상 알파 1.0 을 돌려주면 자르지 않는 표본이다. 외곽선 표본은 파일이 #endif 로 끝날 수 있다
  const core = stripComments(readFileSync(join(SHADERS, id, 'core.hlsl'), 'utf8').replace(/\r\n/g, '\n'))
  if (/return\s+float4\([^;]*,\s*1\.0\s*\)\s*;\s*\}\s*(#\s*endif\s*)?$/.test(core)) return

  const track = meta.demo?.loops?.[0] ?? meta.events[0]?.tracks[0]
  if (!track) {
    if (shaded.area > plain.area * 0.98) err(`${id}: 물체를 잘라 내도 바닥 그림자가 그대로다`)
    return
  }
  const values = track.frames.map(frame => frame[1])
  const low = `&p.${track.key}=${Math.min(...values)}`
  const high = `&p.${track.key}=${Math.max(...values)}`
  const [lowOn, highOn] = [await probe(low), await probe(high)]
  if (Math.abs(lowOn.area - highOn.area) < plain.area * 0.5) {
    err(`${id}: ${track.key} 를 움직여도 바닥 그림자가 따라 변하지 않는다 (온전 ${plain.area.toFixed(3)}, 낮은 값 ${lowOn.area.toFixed(3)}, 높은 값 ${highOn.area.toFixed(3)})`)
  }
  // 효과 끄기는 어떤 값에서도 온전한 그림자여야 한다
  const [lowOff, highOff] = [await probe(`&off=1${low}`), await probe(`&off=1${high}`)]
  if (Math.abs(lowOff.area - highOff.area) > plain.area * 0.1) {
    err(`${id}: 효과 끄기인데 ${track.key} 를 따라 그림자가 변한다 (낮은 값 ${lowOff.area.toFixed(3)}, 높은 값 ${highOff.area.toFixed(3)})`)
  }
}

/** 네트워크를 완전히 막고 file:// 로 연 페이지에서 표본을 컴파일하고 실제로 돌려 본다 */
async function checkPage(html, titles, { home }) {
  if (!findChrome()) {
    // CI 에서 Chrome 이 없으면 통과처럼 보이지 않게 오류로 친다
    ;(process.env.CI ? err : warn)('Chrome 을 찾지 못해 페이지 검사를 건너뜀')
    return
  }
  await withChrome(
    async page => {
      const url = pathToFileURL(html).href
      await page.goto(`${url}#/`)
      await page.sleep(1500)
      if (home) {
        const text = await page.evaluate('document.body.innerText')
        const missing = titles.filter(([, title]) => !text.includes(title)).map(([id]) => id)
        if (missing.length) err(`오프라인(file://, 네트워크 차단)에서 보이지 않는 표본: ${missing.join(', ')}`)
        else console.log(`  오프라인 실행: 표본 ${titles.length}개 모두 표시됨`)
      }

      const results = await page.evaluate('window.__sgCompileAll()')
      const failed = results.filter(r => r.errors.length)
      for (const r of failed) err(`WebGL 컴파일 실패 ${r.id} (${r.variant}): ${r.errors.join(' / ')}`)
      console.log(`  WebGL2 컴파일: ${results.length - failed.length}/${results.length} 통과`)

      for (const [id] of titles) {
        // 자동 데모를 켠 채로 열어 트랙 경로까지 돌린다. 이벤트도 하나씩 눌러 본다
        await page.goto(`${url}#/s/${id}`)
        await page.sleep(900)
        await page.evaluate(`document.querySelector('.btn-event')?.click()`)
        await page.sleep(300)
        const state = await page.evaluate('window.__sgStage()')
        if (state?.error) err(`무대 셰이더 오류 ${id}: ${state.error}`)
        else if (!state?.frames) err(`무대가 그리지 않음: ${id}`)
        const shown = await page.evaluate(`document.querySelector('.notfound')?.innerText ?? ''`)
        if (shown) err(`표본을 표시하지 못함 ${id}: ${shown}`)
        const meta = await loadMeta(ROOT, id)
        if (meta.stage.kind === 'mesh' && (meta.stage.blend ?? 'cutout') === 'cutout') await checkCutoutShadow(page, url, id, meta)
      }
      for (const log of page.logs.slice(0, 5)) err(`페이지 오류: ${log.slice(0, 300)}`)
    },
    { extraArgs: ['--host-resolver-rules=MAP * ~NOTFOUND'] },
  )
}

async function checkDist(titles) {
  if (!existsSync(DIST)) {
    err('web/dist/index.html 이 없다. npm --prefix web run build 뒤 다시 실행한다')
    return
  }
  const raw = readFileSync(DIST)
  for (const [label, size, budget] of [
    ['원본', raw.length, BUDGET],
    ['gzip', gzipSync(raw, { level: 6 }).length, BUDGET_GZIP],
  ]) {
    console.log(`  dist ${label}: ${(size / 1024).toFixed(0)} KB (예산 ${(budget / 1024).toFixed(0)} KB, ${Math.round((size / budget) * 100)}%)`)
    if (size > budget) err(`용량 예산 초과(${label})`)
    else if (size > budget * 0.9) warn(`용량 예산 90% 넘음(${label})`)
  }
  const html = raw.toString('utf8')
  for (const [pattern, what] of [
    [/<script[^>]+src=["']https?:/i, '외부 스크립트'],
    [/<link[^>]+href=["']https?:[^>]*stylesheet|<link[^>]+stylesheet[^>]+href=["']https?:/i, '외부 스타일시트'],
    [/@import\s+url\(["']?https?:/i, '외부 CSS @import'],
  ]) {
    if (pattern.test(html)) err(`dist 에 ${what} 참조가 있다 (오프라인 실행 불가)`)
  }
  await checkPage(DIST, titles, { home: true })
}

/** 지정한 표본만 넣어 빌드한다. 다른 표본의 미완성 파일에 영향받지 않는다 */
function buildSingle(id) {
  const outDir = join(ROOT, '_shots', `build-${id}`)
  const r = spawnSync(process.execPath, [VITE, 'build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'], {
    cwd: WEB,
    env: { ...process.env, SG_ONLY: id },
    encoding: 'utf8',
  })
  if (r.status !== 0) {
    err(`${id}: 웹 빌드 실패\n${(r.stdout + r.stderr).slice(-1500)}`)
    return null
  }
  return join(outDir, 'index.html')
}

async function checkSkill() {
  const skillDir = join(ROOT, 'skill')
  const entries = await skillEntries()
  for (const entry of entries) {
    const path = join(skillDir, entry.path)
    const same =
      existsSync(path) &&
      (typeof entry.content === 'string' ? readFileSync(path, 'utf8').replace(/\r\n/g, '\n') === entry.content : Buffer.compare(readFileSync(path), Buffer.from(entry.content)) === 0)
    if (!same) {
      err(`Skill 이 최신이 아니다: ${entry.path}. node tools/build-skill.mjs`)
      return
    }
  }
  console.log(`  Skill: 파일 ${entries.length}개 최신`)
}

async function checkLinks(ids) {
  const urls = new Set()
  for (const id of ids) for (const r of (await loadMeta(ROOT, id)).references) urls.add(r.url)
  let bad = 0
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (ShaderGallery link check)' }, signal: AbortSignal.timeout(15000) })
      if (r.status >= 400) throw new Error(String(r.status))
    } catch (e) {
      bad++
      warn(`링크 확인 필요: ${e.message} ${url}`)
    }
  }
  console.log(`  링크 ${urls.size}개 확인, 문제 ${bad}개`)
}

async function main() {
  const args = process.argv.slice(2)
  const only = args.filter(a => !a.startsWith('--'))
  const all = specimenIds(ROOT)
  const ids = only.length ? only : all
  console.log('Shader Gallery 검사')
  const titles = await checkSpecimens(ids)
  console.log(`  표본 ${titles.length}개`)
  for (const folder of readdirSync(SHADERS)) {
    if (statSync(join(SHADERS, folder)).isDirectory() && !all.includes(folder)) err(`Assets/Shaders/${folder} 에 해당하는 meta.ts 가 없다`)
  }
  checkImportCase()
  if (only.length) {
    // 규격 오류가 있으면 빌드까지 가지 않아도 고칠 것이 분명하다
    if (!errors.length) {
      for (const [id, title] of titles) {
        const html = buildSingle(id)
        if (html) await checkPage(html, [[id, title]], { home: false })
      }
    }
  } else {
    await checkSkill()
    await checkDist(titles)
  }
  if (args.includes('--links')) await checkLinks(ids)
  for (const w of warnings) console.log(`  [경고] ${w}`)
  for (const e of errors) console.log(`  [오류] ${e}`)
  console.log(errors.length ? `실패: 오류 ${errors.length}개` : '통과')
  return errors.length ? 1 : 0
}

main().then(
  code => process.exit(code),
  e => {
    console.log('실패:', e.stack ?? e.message)
    process.exit(2)
  },
)
