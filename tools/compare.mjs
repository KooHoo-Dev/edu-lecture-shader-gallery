// 같은 값으로 Unity 촬영과 웹 무대를 찍어 나란히 붙인다 (검증 전용 정지 비교).
// Unity 촬영의 시간은 정할 수 없으므로 시간으로 움직이는 값을 --set 으로 멈춰 두고, 웹은 t=0 에서 멈춘 채 찍는다.
//
//   node tools/workflow/with-unity-lock.mjs "node tools/compare.mjs tiling-scroll-parallax --set=_ScrollSpeed=0"
//   node tools/workflow/with-unity-lock.mjs "node tools/compare.mjs surface-wet-snow --state=wet --stage=tilt=-60"
//
// 옵션
//   --state=<촬영 이름>   meta.captures 의 값으로 찍는다 (기본 default)
//   --set=a=1,b=2        두 화면 모두에 덮어쓰는 조절 값 (웹의 p.<속성>)
//   --stage=a=1          두 화면 모두에 덮어쓰는 무대 옵션 (웹의 s.<옵션>)
//   --step=<n>           웹만 단계 보기로 (Unity 에는 단계가 없다. 같은 화면이 아니므로 차이 수치는 참고만)
// 결과: _shots/compare/<id>-<상태>.png (왼쪽 Unity, 오른쪽 웹, 같은 폭 640) 과 두 장의 평균 차이.
// 메시 무대는 물체가 Y 30도에서 멈춘 같은 각도로 찍히지만 웹은 첫 프레임 뒤 조금 돈다. 정확히 맞추려면 회전이 없는 무대를 쓴다.

import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { difference, readPng, resize, sideBySide, writePng } from './lib/png.mjs'
import { loadMeta, parsePairs } from './unity-job.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const opt = name => argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const id = argv.find(a => !a.startsWith('--'))
if (!id) {
  console.log('사용법: node tools/compare.mjs <표본id> [--state=<이름>] [--set=a=1] [--stage=a=1] [--step=<n>]')
  process.exit(2)
}
const stateName = opt('state') ?? 'default'
const set = opt('set') ?? ''
const stage = opt('stage') ?? ''

const meta = await loadMeta(ROOT, id)
const capture = stateName === 'default' ? { values: {} } : meta.captures?.find(c => c.name === stateName)
if (!capture) throw new Error(`${id} 에 촬영 상태가 없습니다: ${stateName}`)

// 1. Unity
const unityArgs = ['tools/unity.mjs', id, ...(set ? [`--set=${set}`] : []), ...(stage ? [`--stage=${stage}`] : [])]
console.log(`$ node ${unityArgs.join(' ')}`)
const unity = spawnSync('node', unityArgs, { cwd: ROOT, encoding: 'utf8' })
process.stdout.write(unity.stdout.split('\n').filter(l => /통과|실패|치명|error/.test(l)).join('\n') + '\n')
if (unity.status !== 0) throw new Error('Unity 촬영 실패')
const unityShot = join(ROOT, '_shots', 'unity', id, `${stateName}.png`)

// 2. 웹: 촬영 상태 값 위에 --set 을 덮고, 무대 시간을 0 에 멈춘다
const values = { ...capture.values, ...parsePairs(set) }
const query = new URLSearchParams({ auto: '0', t: '0' })
for (const [k, v] of Object.entries(values)) query.set(`p.${k}`, String(v))
for (const [k, v] of Object.entries(parsePairs(stage))) query.set(`s.${k}`, String(v))
if (opt('step')) query.set('step', opt('step'))
const web = spawnSync('node', ['tools/live.mjs', id, `--query=${query}`, 'wait:1500', 'stage:compare'], { cwd: ROOT, encoding: 'utf8', shell: false })
const webShot = /shot: (.+\.png)/.exec(web.stdout)?.[1]?.trim()
if (!webShot) throw new Error(`웹 촬영 실패:\n${web.stdout}${web.stderr}`)

// 3. 같은 폭으로 줄여 붙인다
const WIDTH = 640
const left = readPng(unityShot)
const right = readPng(webShot)
const a = resize(left, WIDTH, Math.round((left.h * WIDTH) / left.w))
const b = resize(right, WIDTH, Math.round((right.h * WIDTH) / right.w))
const outDir = join(ROOT, '_shots', 'compare')
mkdirSync(outDir, { recursive: true })
const out = join(outDir, `${id}-${stateName}.png`)
writePng(out, sideBySide([a, b]))
const same = a.h === b.h ? difference(a, b) : null
console.log(`왼쪽 Unity, 오른쪽 웹: ${out}`)
console.log(same ? `평균 차이 ${same.mean.toFixed(2)}, 8 넘게 다른 픽셀 ${(same.changed * 100).toFixed(1)}%` : `높이가 달라 차이를 재지 않았다 (${a.h}, ${b.h})`)
