// 프롬프트 시험용: 앱과 같은 함수로 프롬프트를 만들어 파일로 저장한다. 사람이나 AI 가 대괄호 칸을 채운 뒤 쓴다.
//   node tools/prompt-case.mjs <표본id> <direct|adapt|troubleshoot> <출력 파일> [대괄호 칸을 대신할 글 ...]
// 대괄호 칸은 나온 순서대로 뒤의 글로 바뀐다. 시험 결과는 docs/prompt-test.md 에 기록한다.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPrompt } from '../web/src/core/prompts.ts'
import { loadMeta } from './unity-job.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [id, kind, out, ...fills] = process.argv.slice(2)
if (!id || !kind || !out) {
  console.log('사용법: node tools/prompt-case.mjs <표본id> <direct|adapt|troubleshoot> <출력 파일> [대괄호 칸을 대신할 글 ...]')
  process.exit(2)
}

const meta = await loadMeta(ROOT, id)
const folder = join(ROOT, 'Assets', 'Shaders', id)
const fileOrder = name => (name.endsWith('.shader') ? 0 : name.endsWith('.hlsl') ? 1 : 2)
const files = readdirSync(folder)
  .filter(f => /\.(shader|hlsl|cs)$/.test(f))
  .sort((a, b) => fileOrder(a) - fileOrder(b))
  .map(name => ({ name, lang: name.endsWith('.cs') ? 'csharp' : 'cpp', code: readFileSync(join(folder, name), 'utf8') }))
const values = Object.fromEntries(meta.params.map(p => [p.key, p.default]))

let text = buildPrompt(kind, { meta, files }, values)
let next = 0
text = text.replace(/\[[^\]\n]*\]/g, match => (next < fills.length ? fills[next++] : match))

mkdirSync(dirname(resolve(out)), { recursive: true })
writeFileSync(out, text)
console.log(`${out}: ${text.length}자, 채운 칸 ${next}/${fills.length}`)
