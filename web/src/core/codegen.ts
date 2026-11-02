import type { ParamDef, ParamValues } from './types'

/* 슬라이더 값을 복사하는 코드와 프롬프트에 그대로 반영한다. 웹 앱과 tools/ 스크립트가 함께 쓴다. */

const trimNumber = (v: number) => String(Number(v.toFixed(4)))

/** sRGB 16진수 -> Unity Properties 의 Color 표기 (r, g, b, 1) */
export function hexToProperty(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const c = (shift: number) => trimNumber(((n >> shift) & 255) / 255)
  return `(${c(16)}, ${c(8)}, ${c(0)}, 1)`
}

/** Properties 한 줄에서 기본값 자리를 찾는 정규식. 앞쪽 [Enum] 같은 속성은 건드리지 않는다 */
export function propertyPattern(key: string): RegExp {
  return new RegExp(`(\\b${key}\\s*\\(\\s*"[^"\\n]*"\\s*,[^\\n]*?\\)\\s*=\\s*)(\\([^)\\n]*\\)|[-+\\d.eE]+)`)
}

function propertyValue(def: ParamDef, value: unknown): string {
  if (def.type === 'color') return hexToProperty(String(value))
  if (def.type === 'toggle') return value ? '1' : '0'
  if (def.type === 'select') return String(value)
  return trimNumber(Number(value))
}

/** .shader 의 Properties 기본값을 현재 값으로 바꾼 텍스트를 돌려준다 */
export function applyValuesToShader(shader: string, params: ParamDef[], values: ParamValues): string {
  let out = shader
  for (const def of params) {
    out = out.replace(propertyPattern(def.key), (_, head: string) => head + propertyValue(def, values[def.key] ?? def.default))
  }
  return out
}

export function displayValue(def: ParamDef, value: unknown): string {
  if (def.type === 'select') return def.options.find(o => o.value === String(value))?.label ?? String(value)
  if (def.type === 'toggle') return value ? '켬' : '끔'
  if (def.type === 'color') return String(value).toUpperCase()
  return trimNumber(Number(value))
}

/** 머티리얼 설정표 (Markdown) */
export function materialTable(params: ParamDef[], values: ParamValues): string {
  const rows = params.map(def => `| \`${def.key}\` | ${def.label} | ${displayValue(def, values[def.key] ?? def.default)} |`)
  return ['| 속성 | 뜻 | 값 |', '|---|---|---|', ...rows].join('\n')
}
