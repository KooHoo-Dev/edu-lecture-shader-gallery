// 실제 시간으로 흘려 보며 찍는 캡처 도구. 셰이더 컴파일 오류가 있으면 알려 준다.
//
//   node tools/live.mjs <표본id> [옵션] [동작...]
//   node tools/live.mjs dissolve-edge-glow --query="auto=0&p._Threshold=0.6" wait:800 stage:mid key:j wait:300 stage:off
//   node tools/live.mjs home --dist shot:home
//
// 옵션
//   --query="..."     #/s/<id>? 뒤에 붙일 쿼리 (예: preset=x&off=1&step=2&p._Threshold=0.3)
//   --size=1440x1000  창 크기
//   --dist            web/dist/index.html 을 쓴다 (먼저 npm run build). 기본은 이 표본만 넣어 _shots/build-<id> 로 빌드
//   --no-build        _shots/build-<id> 를 다시 빌드하지 않는다
// 동작 (차례대로 실행, 없으면 wait:2500 shot:live)
//   wait:<ms>                 실제 시간 대기
//   click:<버튼 글자>          글자가 들어간 첫 번째 button 클릭
//   tap:<x>,<y>               창 좌표 클릭 (무대에 포커스 줄 때)
//   key:<Key>                 키 입력 (ArrowDown, Enter, Escape, q, 1 …)
//   js:<식>                   페이지에서 실행하고 결과 출력
//   shot:<이름>               _shots/<id>/live-<이름>-<시각>.png 저장 (Read 도구로 확인)
//   stage:<이름>              무대 부분만 잘라 저장
//   burst:<이름>,<장수>,<간격ms>  연속 촬영 (기본 6장, 100ms). 무대 시간을 간격만큼 직접 옮겨 가며 무대를 찍는다.
//                             실제 시간과 상관없이 매번 같은 순간이 찍힌다. 자동 데모와 누른 이벤트는 함께 진행하고 물체 회전은 멈춘다.
//                             장마다 live-<이름>-t<시간>-<시각>.png, 모은 시트 live-<이름>-sheet-<시각>.png, 이웃한 장의 변화량을 남긴다
//
//   움직임 확인 예: node tools/live.mjs fire-noise-flame --query="auto=0&t=1.3" wait:1000 burst:flame,6,100

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ensureWebModules } from './lib/worktree.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
ensureWebModules(ROOT)
const argv = process.argv.slice(2)
const id = argv.find(a => !a.startsWith('--'))
if (!id) {
  console.log('사용법: node tools/live.mjs <표본id|home> [--query=...] [--size=WxH] [--dist] [--no-build] [동작...]')
  process.exit(2)
}
const opt = name => argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const flag = name => argv.includes(`--${name}`)
const actions = argv.filter(a => !a.startsWith('--') && a !== id)
if (!actions.length) actions.push('wait:2500', 'shot:live')
const [w, h] = (opt('size') ?? '1440x1000').split('x').map(Number)

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
].find(p => existsSync(p))
if (!CHROME) {
  console.log('Chrome/Edge 를 찾지 못했습니다')
  process.exit(1)
}

let html
if (flag('dist') || id === 'home') {
  html = join(ROOT, 'web', 'dist', 'index.html')
} else {
  const out = join(ROOT, '_shots', `build-${id}`)
  if (!flag('no-build')) {
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
    const r = spawnSync(npx, ['vite', 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], {
      cwd: join(ROOT, 'web'),
      env: { ...process.env, SG_ONLY: id },
      encoding: 'utf8',
      shell: process.platform === 'win32',
    })
    if (r.status !== 0) {
      console.log('빌드 실패:\n' + (r.stdout + r.stderr).slice(-4000))
      process.exit(1)
    }
  }
  html = join(out, 'index.html')
}
if (!existsSync(html)) {
  console.log(`${html} 이 없습니다`)
  process.exit(1)
}
const query = opt('query')
const url = pathToFileURL(html).href + (id === 'home' ? '#/' : `#/s/${id}${query ? `?${query}` : ''}`)

const outDir = join(ROOT, '_shots', id)
mkdirSync(outDir, { recursive: true })
const stamp = new Date().toTimeString().slice(0, 8).replaceAll(':', '')
const port = 9300 + Math.floor(Math.random() * 600)
const profile = mkdtempSync(join(tmpdir(), 'sg-live-'))
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--window-size=${w},${h}`,
  ...(process.env.CI ? ['--no-sandbox'] : []),
  'about:blank',
], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))

try {
  let page
  for (let i = 0; i < 60 && !page; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
      page = list.find(t => t.type === 'page')
    } catch {}
    if (!page) await sleep(200)
  }
  if (!page) throw new Error('Chrome 디버깅 연결 실패')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((ok, fail) => {
    ws.addEventListener('open', ok)
    ws.addEventListener('error', fail)
  })
  let seq = 0
  const pending = new Map()
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result ?? m)
      pending.delete(m.id)
    }
  })
  const send = (method, params = {}) =>
    new Promise(r => {
      const i = ++seq
      pending.set(i, r)
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url })
  await sleep(1200)
  const failed = await evaluate(`document.querySelector('.stage-error')?.textContent ?? ''`)
  if (failed) console.log(`무대 오류 표시됨: ${failed}`)

  const stageRect = () => evaluate(`(() => { const r = document.querySelector('.stage')?.getBoundingClientRect(); return r && { x: r.x, y: r.y, width: r.width, height: r.height } })()`)
  const frames = () => evaluate('window.__sgStage?.()?.frames ?? -1')

  const burst = async spec => {
    const [name = 'burst', countText, stepText] = spec.split(',')
    const count = Math.max(2, Math.min(16, Number(countText) || 6))
    const stepMs = Number(stepText) || 100
    const start = await evaluate('window.__sgStage?.()?.time')
    const rect = await stageRect()
    if (typeof start !== 'number' || !rect) {
      console.log('burst: 무대를 찾지 못했습니다')
      return
    }
    const shots = []
    for (let k = 0; k < count; k++) {
      const t = start + (k * stepMs) / 1000
      const before = await frames()
      await evaluate(`window.__sgSeek(${t})`)
      // 옮긴 시간의 프레임이 그려지고 화면에 올라올 때까지 기다린다
      for (let i = 0; i < 250 && (await frames()) === before; i++) await sleep(20)
      await evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))')
      const r = await send('Page.captureScreenshot', { format: 'png', clip: { ...rect, scale: 1 } })
      writeFileSync(join(outDir, `live-${name}-t${t.toFixed(2)}-${stamp}.png`), Buffer.from(r.data, 'base64'))
      shots.push({ t, data: r.data })
    }
    await evaluate('window.__sgSeek(null)')

    // 시트와 변화량은 페이지의 캔버스로 만든다 (이미지 라이브러리 없이)
    const result = await evaluate(`(async () => {
      const shots = ${JSON.stringify(shots)}
      const imgs = await Promise.all(shots.map(s => new Promise((ok, fail) => { const im = new Image(); im.onload = () => ok(im); im.onerror = fail; im.src = 'data:image/png;base64,' + s.data })))
      const w = imgs[0].naturalWidth, h = imgs[0].naturalHeight
      const pixels = imgs.map(im => { const c = new OffscreenCanvas(w, h); const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, w, h).data })
      const diffs = []
      for (let k = 1; k < pixels.length; k++) {
        const a = pixels[k - 1], b = pixels[k]
        let sum = 0, changed = 0
        for (let p = 0; p < a.length; p += 4) {
          const d = (Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2])) / 3
          sum += d
          if (d > 8) changed++
        }
        diffs.push({ mean: sum / (w * h), changed: changed / (w * h) })
      }
      const cols = Math.min(4, imgs.length), rows = Math.ceil(imgs.length / cols), gap = 4
      const cw = Math.min(w, 480), ch = Math.round((h * cw) / w)
      const sheet = new OffscreenCanvas(cols * cw + (cols - 1) * gap, rows * ch + (rows - 1) * gap)
      const g = sheet.getContext('2d')
      g.fillStyle = '#000'
      g.fillRect(0, 0, sheet.width, sheet.height)
      g.font = 'bold 16px sans-serif'
      imgs.forEach((im, k) => {
        const x = (k % cols) * (cw + gap), y = Math.floor(k / cols) * (ch + gap)
        g.drawImage(im, x, y, cw, ch)
        const label = 't=' + shots[k].t.toFixed(2)
        g.fillStyle = 'rgba(0, 0, 0, 0.7)'
        g.fillRect(x, y, g.measureText(label).width + 12, 24)
        g.fillStyle = '#fff'
        g.fillText(label, x + 6, y + 17)
      })
      const blob = await sheet.convertToBlob({ type: 'image/png' })
      const url = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(blob) })
      return { diffs, sheet: url.slice(url.indexOf(',') + 1) }
    })()`)
    if (!result) {
      console.log('burst: 시트를 만들지 못했습니다')
      return
    }
    console.log(`burst ${name}: t=${start.toFixed(2)}~${shots.at(-1).t.toFixed(2)} 초, ${count}장, ${stepMs}ms 간격`)
    result.diffs.forEach((d, k) => console.log(`  ${shots[k].t.toFixed(2)}→${shots[k + 1].t.toFixed(2)}  평균 차이 ${d.mean.toFixed(2)}  바뀐 픽셀 ${(d.changed * 100).toFixed(1)}%`))
    if (result.diffs.every(d => d.mean < 0.05)) console.log('  움직임 없음: 모든 장이 같다')
    const file = join(outDir, `live-${name}-sheet-${stamp}.png`)
    writeFileSync(file, Buffer.from(result.sheet, 'base64'))
    console.log(`sheet: ${file}`)
  }

  const KEYS = { Enter: ['Enter', 13, '\r'], Escape: ['Escape', 27], Backspace: ['Backspace', 8], Tab: ['Tab', 9], ArrowUp: ['ArrowUp', 38], ArrowDown: ['ArrowDown', 40], ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39], ' ': ['Space', 32, ' '] }
  for (const a of actions) {
    const [kind, ...rest] = a.split(':')
    const v = rest.join(':')
    if (kind === 'wait') await sleep(Number(v))
    else if (kind === 'click') {
      const r = await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(v)})); if (!b) return '없음'; b.click(); return '클릭' })()`)
      console.log(`click ${v}: ${r}`)
    } else if (kind === 'tap') {
      const [x, y] = v.split(',').map(Number)
      for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
    } else if (kind === 'key') {
      const [code, keyCode, text] = KEYS[v] ?? [/^[0-9]$/.test(v) ? `Digit${v}` : `Key${v.toUpperCase()}`, v.toUpperCase().charCodeAt(0), v]
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: v, code, windowsVirtualKeyCode: keyCode, text })
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: v, code, windowsVirtualKeyCode: keyCode })
    } else if (kind === 'js') console.log('js:', JSON.stringify(await evaluate(v)))
    else if (kind === 'burst') await burst(v)
    else if (kind === 'shot' || kind === 'stage') {
      // stage:<이름> 은 무대만 잘라 찍는다
      const rect = kind === 'stage' ? await stageRect() : null
      const r = await send('Page.captureScreenshot', rect ? { format: 'png', clip: { ...rect, scale: 1 } } : { format: 'png' })
      const file = join(outDir, `live-${v}-${stamp}.png`)
      writeFileSync(file, Buffer.from(r.data, 'base64'))
      console.log(`shot: ${file}`)
    } else console.log(`모르는 동작: ${a}`)
  }
  const stageError = await evaluate(`document.querySelector('.stage-error')?.textContent ?? ''`)
  if (stageError) {
    console.log(`실패: 무대 오류: ${stageError}`)
    process.exitCode = 1
  }
  ws.close()
} catch (e) {
  console.log('실패:', e.message)
  process.exitCode = 1
} finally {
  chrome.kill()
  await sleep(300)
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {}
}
