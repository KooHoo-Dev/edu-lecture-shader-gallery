// JayDispatch 의 verify-unity 잠금을 잡고 명령을 돌린다. 워커의 Unity 검증과 겹치지 않게 수동 촬영·컴파일은 이것으로 한다.
//   node tools/workflow/with-unity-lock.mjs "node tools/unity.mjs <id>" "node tools/shots.mjs <id>"
import { execSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO = path.resolve(fileURLToPath(import.meta.url), '../../..')
const { acquireLock } = await import(pathToFileURL('C:/Users/user/JayTools/JayDispatch/src/lock.mjs').href)
const release = await acquireLock(path.join(os.homedir(), '.jay-dispatch'), 'verify-unity')
console.log('잠금 얻음 verify-unity')
let code = 0
try {
  for (const cmd of process.argv.slice(2)) {
    console.log('$ ' + cmd)
    try { execSync(cmd, { stdio: 'inherit', cwd: REPO }) } catch { code = 1; console.log('실패: ' + cmd) }
  }
} finally { release() }
process.exit(code)
