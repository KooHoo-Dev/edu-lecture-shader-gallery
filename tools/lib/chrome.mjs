// 헤드리스 Chrome 을 띄워 페이지에서 식을 평가하는 공용 도구.

import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

export const findChrome = () => CANDIDATES.find(p => existsSync(p))

const sleep = ms => new Promise(r => setTimeout(r, ms))

/**
 * withChrome(page => ...) 안에서 page.goto(url), page.evaluate(식), page.logs 를 쓴다.
 * extraArgs 로 네트워크 차단 같은 Chrome 옵션을 더한다.
 */
export async function withChrome(run, { extraArgs = [], size = [1280, 900] } = {}) {
  const chromePath = findChrome()
  if (!chromePath) throw new Error('Chrome/Edge 를 찾지 못했습니다')
  const profile = mkdtempSync(join(tmpdir(), 'sg-chrome-'))
  const port = 9300 + Math.floor(Math.random() * 600)
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    `--window-size=${size[0]},${size[1]}`,
    ...extraArgs,
    'about:blank',
  ])
  try {
    let target
    for (let i = 0; i < 60 && !target; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
        target = list.find(t => t.type === 'page')
      } catch {
        /* 아직 뜨는 중 */
      }
      if (!target) await sleep(200)
    }
    if (!target) throw new Error('Chrome 디버깅 연결 실패')
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((ok, fail) => {
      ws.addEventListener('open', ok)
      ws.addEventListener('error', fail)
    })
    let seq = 0
    const pending = new Map()
    const logs = []
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data)
      if (m.id && pending.has(m.id)) {
        pending.get(m.id)(m.result ?? m)
        pending.delete(m.id)
      } else if (m.method === 'Runtime.exceptionThrown') {
        logs.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text)
      } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
        logs.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' '))
      }
    })
    const send = (method, params = {}) =>
      new Promise(ok => {
        const id = ++seq
        pending.set(id, ok)
        ws.send(JSON.stringify({ id, method, params }))
      })
    await send('Page.enable')
    await send('Runtime.enable')
    const page = {
      logs,
      send,
      sleep,
      goto: url => send('Page.navigate', { url }),
      evaluate: async expression => {
        const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
        return r.result?.value
      },
    }
    const out = await run(page)
    ws.close()
    return out
  } finally {
    chrome.kill()
    await sleep(300)
    try {
      rmSync(profile, { recursive: true, force: true })
    } catch {
      /* 프로필 삭제 실패는 무시 */
    }
  }
}
