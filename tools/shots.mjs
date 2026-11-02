// Unity 가 찍은 PNG(_shots/unity/<id>/<상태>.png)를 앱에 내장할 WebP(web/src/shots/<id>/<상태>.webp)로 바꾼다.
//   node tools/shots.mjs            # 모든 표본
//   node tools/shots.mjs dissolve-edge-glow
// 표본당 이미지 수가 곧 HTML 용량이다. 크기는 720×405 고정. 변환은 헤드리스 Chrome 의 canvas 로 한다 (의존성 없음).

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { withChrome } from './lib/chrome.mjs'
import { specimenIds } from './unity-job.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const IN = join(ROOT, '_shots', 'unity')
const OUT = join(ROOT, 'web', 'src', 'shots')
const WIDTH = 720
const HEIGHT = 405
const QUALITY = 0.85

const ids = process.argv.slice(2).length ? process.argv.slice(2) : specimenIds(ROOT)

await withChrome(async page => {
  for (const id of ids) {
    const dir = join(IN, id)
    if (!existsSync(dir)) {
      console.log(`${id}: 촬영 결과가 없습니다. node tools/unity.mjs ${id} 를 먼저 실행하세요`)
      continue
    }
    const outDir = join(OUT, id)
    rmSync(outDir, { recursive: true, force: true })
    mkdirSync(outDir, { recursive: true })
    for (const name of readdirSync(dir).filter(f => f.endsWith('.png'))) {
      const png = readFileSync(join(dir, name)).toString('base64')
      const dataUrl = await page.evaluate(`new Promise((ok, fail) => {
        const image = new Image()
        image.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = ${WIDTH}
          canvas.height = ${HEIGHT}
          const g = canvas.getContext('2d')
          g.imageSmoothingQuality = 'high'
          g.drawImage(image, 0, 0, ${WIDTH}, ${HEIGHT})
          ok(canvas.toDataURL('image/webp', ${QUALITY}))
        }
        image.onerror = () => fail(new Error('PNG 를 읽지 못했습니다'))
        image.src = 'data:image/png;base64,${png}'
      })`)
      const bytes = Buffer.from(dataUrl.split(',')[1], 'base64')
      writeFileSync(join(outDir, name.replace(/\.png$/, '.webp')), bytes)
      console.log(`${id}/${name}: ${(bytes.length / 1024).toFixed(1)} KB`)
    }
  }
})
