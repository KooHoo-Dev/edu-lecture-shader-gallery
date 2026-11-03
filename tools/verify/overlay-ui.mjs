// Screen Space - Overlay 캔버스에서 UI 셰이더가 Opaque Texture(씬 색상)를 읽는지 플레이어 빌드로 찍어 확인한다.
// Overlay UI 는 렌더 텍스처에 찍는 촬영 도구(SgCapture)로는 그려지지 않아 실제 창에 그린 화면을 찍는다.
//
//   node tools/workflow/with-unity-lock.mjs "node tools/verify/overlay-ui.mjs"
//
// 순서: 리포를 Unity 복사본(~/.sg-unity/<리포 이름>)에 맞추고, overlay-ui/ 의 C# 두 파일을 복사본의 Assets/SgPlayerCheck 에만 넣어
// 배치 모드로 Windows 플레이어를 만든 뒤, 1280x720 창으로 실행해 overlay·camera·none 세 장을 찍는다. 창이 몇 초 떴다 닫힌다.
// 결과: _shots/overlay-ui/{overlay,camera,none}.png, player.txt. 다음 tools/unity.mjs 배치 실행이 복사본을 리포와 다시 맞추며 넣은 파일을 지운다.

import { spawn, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mainRoot } from '../lib/worktree.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const OUT = join(ROOT, '_shots', 'overlay-ui')
const COPY = process.env.SG_UNITY_COPY ?? join(homedir(), '.sg-unity', basename(mainRoot(ROOT)))
const version = /m_EditorVersion: (\S+)/.exec(readFileSync(join(ROOT, 'ProjectSettings', 'ProjectVersion.txt'), 'utf8'))?.[1]
const UNITY = process.env.SG_UNITY_EXE ?? join('C:/Program Files/Unity/Hub/Editor', version ?? '', 'Editor/Unity.exe')
const PLAYER = join(COPY, 'Builds', 'OverlayCheck', 'OverlayCheck.exe')

function run(exe, args, timeoutMs) {
  return new Promise((ok, fail) => {
    const child = spawn(exe, args, { stdio: 'ignore' })
    const timer = setTimeout(() => {
      child.kill()
      fail(new Error(`시간 초과: ${basename(exe)}`))
    }, timeoutMs)
    child.on('exit', code => {
      clearTimeout(timer)
      ok(code)
    })
    child.on('error', fail)
  })
}

// robocopy 종료 코드는 8 미만이 성공이다. tools/unity.mjs 의 복사와 같다.
function mirror(name) {
  const r = spawnSync('robocopy', [join(ROOT, name), join(COPY, name), '/MIR', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/R:1', '/W:1'], { encoding: 'utf8' })
  if (r.status === null || r.status >= 8) throw new Error(`복사 실패 (${name}): ${r.stdout}${r.stderr}`)
}

async function main() {
  if (!existsSync(UNITY)) throw new Error(`Unity 실행 파일이 없습니다: ${UNITY}`)
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })

  mkdirSync(COPY, { recursive: true })
  for (const name of ['Assets', 'Packages', 'ProjectSettings']) mirror(name)
  const harness = join(COPY, 'Assets', 'SgPlayerCheck')
  mkdirSync(join(harness, 'Editor'), { recursive: true })
  copyFileSync(join(HERE, 'overlay-ui', 'SgOverlayCheck.cs'), join(harness, 'SgOverlayCheck.cs'))
  copyFileSync(join(HERE, 'overlay-ui', 'SgOverlayBuild.cs'), join(harness, 'Editor', 'SgOverlayBuild.cs'))

  const buildLog = join(OUT, 'build.log')
  console.log(`플레이어 빌드: ${COPY}`)
  const buildCode = await run(UNITY, ['-batchmode', '-projectPath', COPY, '-buildTarget', 'Win64', '-logFile', buildLog, '-executeMethod', 'ShaderGallery.PlayerCheck.SgOverlayBuild.Build', '-sgBuild', PLAYER], 30 * 60 * 1000)
  if (buildCode !== 0 || !existsSync(PLAYER)) {
    console.log(readFileSync(buildLog, 'utf8').split('\n').filter(l => /error|SgOverlayBuild|Exception/i.test(l)).slice(-30).join('\n'))
    throw new Error(`빌드 실패 (종료 코드 ${buildCode}). 로그: ${buildLog}`)
  }

  console.log('플레이어 실행')
  await run(PLAYER, ['-screen-width', '1280', '-screen-height', '720', '-screen-fullscreen', '0', '-logFile', join(OUT, 'player.log'), '-sgOut', OUT], 3 * 60 * 1000)
  const summary = join(OUT, 'player.txt')
  if (!existsSync(summary)) throw new Error(`플레이어가 결과를 남기지 않았습니다. 로그: ${join(OUT, 'player.log')}`)
  console.log(readFileSync(summary, 'utf8').trim())
  console.log(`결과: ${OUT}`)
}

main().catch(e => {
  console.log('실패:', e.message)
  process.exit(1)
})
