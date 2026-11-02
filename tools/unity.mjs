// Unity 컴파일 검사와 자동 촬영을 실행한다. 같은 C# 진입점(SgVerify.Run)을 두 경로로 호출한다.
//
//   node tools/unity.mjs                     # 모든 표본. 경로는 자동 선택
//   node tools/unity.mjs dissolve            # 지정한 표본만
//   node tools/unity.mjs --no-capture        # 컴파일 검사만
//   node tools/unity.mjs --mode=batch        # 경로를 직접 고른다 (auto | editor | batch)
//   node tools/unity.mjs --job=<경로>        # 이미 만든 잡 파일로 실행
//
// 경로 선택
//   editor: 에디터가 이 프로젝트를 열고 있고 SgBridge 가 살아 있으면 명령 파일로 맡긴다.
//   batch : 그 밖의 경우. 에디터가 열려 있으면 같은 폴더로 배치 모드를 실행할 수 없으므로 복사본에서 실행한다.
//           복사본은 ~/.sg-unity/<리포 이름> 에 있고 Library 를 유지해 두 번째부터 빠르다. SG_UNITY_COPY 로 바꿀 수 있다.
//
// 결과: _shots/unity/result.json 과 _shots/unity/<id>/<상태>.png. 오류가 있으면 종료 코드 1.

import { spawn, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildJob } from './unity-job.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, '_shots', 'unity')
const UNITY = process.env.SG_UNITY_EXE ?? findUnityExe()
const COPY = process.env.SG_UNITY_COPY ?? join(homedir(), '.sg-unity', basename(ROOT))
const BRIDGE = join(ROOT, 'Temp', 'ShaderGalleryBridge')
const BATCH_TIMEOUT_MS = 20 * 60 * 1000
const EDITOR_TIMEOUT_MS = 5 * 60 * 1000
const HEARTBEAT_FRESH_MS = 20 * 1000

function findUnityExe() {
  const version = /m_EditorVersion: (\S+)/.exec(readFileSync(join(ROOT, 'ProjectSettings', 'ProjectVersion.txt'), 'utf8'))?.[1]
  return join('C:/Program Files/Unity/Hub/Editor', version ?? '', 'Editor/Unity.exe')
}

const argv = process.argv.slice(2)
const opt = name => argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const flag = name => argv.includes(`--${name}`)
const ids = argv.filter(a => !a.startsWith('--'))
const mode = opt('mode') ?? 'auto'
const sleep = ms => new Promise(r => setTimeout(r, ms))

function bridgeAlive() {
  const heartbeat = join(BRIDGE, 'heartbeat.txt')
  return existsSync(heartbeat) && Date.now() - statSync(heartbeat).mtimeMs < HEARTBEAT_FRESH_MS
}

const editorOpen = () => existsSync(join(ROOT, 'Temp', 'UnityLockfile'))

async function runEditor(jobPath) {
  const id = String(Date.now())
  const done = join(BRIDGE, 'done.json')
  rmSync(done, { force: true })
  writeFileSync(join(BRIDGE, 'command.json'), JSON.stringify({ id, job: jobPath }))
  const start = Date.now()
  while (Date.now() - start < EDITOR_TIMEOUT_MS) {
    await sleep(500)
    if (!existsSync(done)) continue
    const answer = JSON.parse(readFileSync(done, 'utf8'))
    if (answer.id === id) return answer
  }
  rmSync(join(BRIDGE, 'command.json'), { force: true })
  throw new Error('열린 에디터가 응답하지 않습니다')
}

// robocopy 종료 코드는 8 미만이 성공이다.
function mirror(name) {
  const r = spawnSync('robocopy', [join(ROOT, name), join(COPY, name), '/MIR', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/R:1', '/W:1'], { encoding: 'utf8' })
  if (r.status === null || r.status >= 8) throw new Error(`복사 실패 (${name}): ${r.stdout}${r.stderr}`)
}

function syncMetaBack(dir = join(COPY, 'Assets')) {
  let added = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      added += syncMetaBack(path)
    } else if (entry.name.endsWith('.meta')) {
      const target = join(ROOT, relative(COPY, path))
      const asset = target.slice(0, -'.meta'.length)
      if (!existsSync(target) && existsSync(asset)) {
        copyFileSync(path, target)
        added++
      }
    }
  }
  return added
}

async function runBatch(jobPath) {
  const projectPath = editorOpen() ? COPY : ROOT
  if (projectPath === COPY) {
    mkdirSync(COPY, { recursive: true })
    for (const name of ['Assets', 'Packages', 'ProjectSettings']) mirror(name)
  }
  const log = join(OUT, 'unity-batch.log')
  const args = ['-batchmode', '-projectPath', projectPath, '-logFile', log, '-executeMethod', 'ShaderGallery.EditorTools.SgVerify.RunBatch', '-sgJob', jobPath]
  console.log(`배치 실행: ${projectPath}`)
  const code = await new Promise((ok, fail) => {
    const child = spawn(UNITY, args, { stdio: 'ignore' })
    const timer = setTimeout(() => {
      child.kill()
      fail(new Error(`배치 실행 시간 초과. 로그: ${log}`))
    }, BATCH_TIMEOUT_MS)
    child.on('exit', c => {
      clearTimeout(timer)
      ok(c)
    })
    child.on('error', fail)
  })
  if (projectPath === COPY) {
    const added = syncMetaBack()
    if (added) console.log(`새 .meta ${added}개를 리포로 가져옴`)
  }
  return { code, log }
}

function report() {
  const file = join(OUT, 'result.json')
  if (!existsSync(file)) return 2
  const result = JSON.parse(readFileSync(file, 'utf8'))
  console.log(`Unity ${result.unityVersion} · ${result.graphicsDevice} · ${result.pipeline} · 경로 ${result.mode} · ${result.finishedAt}`)
  if (result.fatal) console.log(`[치명] ${result.fatal}`)
  for (const s of result.specimens) {
    const errors = s.messages.filter(m => m.severity === 'error')
    const warnings = s.messages.filter(m => m.severity !== 'error')
    console.log(`  ${s.compileOk ? '통과' : '실패'} ${s.id}: 변형 ${s.variantsCompiled}개 컴파일, 오류 ${errors.length}, 경고 ${warnings.length}, 촬영 ${s.shots.length}장`)
    const seen = new Set()
    for (const m of [...errors, ...warnings]) {
      const line = `${m.severity} ${m.file ? `${m.file}:${m.line} ` : ''}${m.message}`
      if (seen.has(line) || seen.size >= 12) continue
      seen.add(line)
      console.log(`    [${m.where}] ${line}`)
    }
    for (const shot of s.shots) console.log(`    ${shot.name}: ${shot.file} (밝기 ${shot.meanLuma.toFixed(3)}, 색 다양도 ${shot.distinctRatio.toFixed(3)})`)
  }
  return result.ok ? 0 : 1
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  let jobPath = opt('job')
  if (!jobPath) {
    const job = await buildJob(ROOT, ids, { outDir: OUT, capture: !flag('no-capture') })
    jobPath = join(OUT, 'job.json')
    writeFileSync(jobPath, JSON.stringify(job, null, 2))
  }
  rmSync(join(OUT, 'result.json'), { force: true })

  const useEditor = mode === 'editor' || (mode === 'auto' && editorOpen() && bridgeAlive())
  if (useEditor) {
    console.log('열린 에디터에서 실행')
    try {
      const answer = await runEditor(jobPath)
      if (answer.error) console.log(`[치명] ${answer.error}`)
      return report()
    } catch (e) {
      if (mode === 'editor') throw e
      console.log(`${e.message}. 복사본 배치 실행으로 넘어갑니다`)
    }
  }
  if (!existsSync(UNITY)) throw new Error(`Unity 실행 파일이 없습니다: ${UNITY}`)
  const { code, log } = await runBatch(jobPath)
  if (!existsSync(join(OUT, 'result.json'))) {
    console.log(`결과 파일이 없습니다 (종료 코드 ${code}). 로그 끝부분:`)
    const text = readFileSync(log, 'utf8')
    console.log(text.split('\n').filter(l => /error|Aborting|Exception|license/i.test(l)).slice(-30).join('\n'))
    return 2
  }
  return report()
}

main().then(
  code => process.exit(code),
  e => {
    console.log('실패:', e.message)
    process.exit(2)
  },
)
