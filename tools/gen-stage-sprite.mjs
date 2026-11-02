// 스프라이트 무대에서 쓰는 드론 그림을 코드로 만든다. Unity 촬영과 웹이 이 PNG 하나를 함께 쓴다.
//   node tools/gen-stage-sprite.mjs
// 외곽선이 들어갈 자리를 위해 둘레에 투명 여백을 두고, 투명 픽셀에도 색을 채워 가장자리에 검은 테두리가 끼지 않게 한다.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SIZE = 256

const clamp01 = v => Math.min(1, Math.max(0, v))
const circle = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) - r
const box = (x, y, cx, cy, hw, hh, r) => {
  const dx = Math.abs(x - cx) - hw + r
  const dy = Math.abs(y - cy) - hh + r
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r
}

const SHELL = [86, 112, 138]
const SHELL_DARK = [52, 70, 92]
const PLATE = [214, 174, 112]
const LENS = [255, 214, 120]
const LENS_DARK = [32, 26, 30]

function over(dst, color, coverage) {
  const a = clamp01(coverage)
  for (let i = 0; i < 3; i++) dst[i] = dst[i] * (1 - a) + color[i] * a
  dst[3] = Math.max(dst[3], a)
}

// 좌표는 위쪽이 +y 인 -1~1 범위. 그림은 80% 안쪽에만 그린다
function shade(x, y) {
  const px = [SHELL[0], SHELL[1], SHELL[2], 0]
  const aa = 2 / SIZE
  const fill = d => clamp01(0.5 - d / aa)
  // 날개
  for (const side of [-1, 1]) {
    const wing = box(x, y, side * 0.56, 0.1, 0.2, 0.07, 0.04)
    over(px, SHELL_DARK, fill(wing))
    const rotor = box(x, y, side * 0.56, 0.22, 0.2, 0.025, 0.02)
    over(px, PLATE, fill(rotor))
    const strut = box(x, y, side * 0.56, 0.16, 0.025, 0.06, 0.01)
    over(px, SHELL_DARK, fill(strut))
  }
  // 다리
  for (const side of [-1, 1]) over(px, SHELL_DARK, fill(box(x, y, side * 0.2, -0.44, 0.045, 0.16, 0.03)))
  // 몸통
  const body = box(x, y, 0, -0.04, 0.38, 0.34, 0.16)
  over(px, SHELL, fill(body))
  const shadow = box(x, y, 0, -0.27, 0.34, 0.09, 0.08)
  over(px, SHELL_DARK, fill(Math.max(shadow, body)))
  // 머리판
  over(px, PLATE, fill(box(x, y, 0, 0.24, 0.26, 0.05, 0.03)))
  // 렌즈
  over(px, LENS_DARK, fill(circle(x, y, 0, -0.04, 0.17)))
  over(px, LENS, fill(circle(x, y, 0, -0.04, 0.1)))
  over(px, [255, 248, 224], fill(circle(x, y, 0.035, -0.005, 0.03)))
  return px
}

function crc32(buf) {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'latin1')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE)
for (let row = 0; row < SIZE; row++) {
  const start = row * (SIZE * 4 + 1)
  raw[start] = 0
  for (let col = 0; col < SIZE; col++) {
    const x = ((col + 0.5) / SIZE) * 2 - 1
    const y = 1 - ((row + 0.5) / SIZE) * 2
    const p = shade(x, y)
    for (let i = 0; i < 3; i++) raw[start + 1 + col * 4 + i] = Math.round(p[i])
    raw[start + 1 + col * 4 + 3] = Math.round(p[3] * 255)
  }
}

const header = Buffer.alloc(13)
header.writeUInt32BE(SIZE, 0)
header.writeUInt32BE(SIZE, 4)
header[8] = 8
header[9] = 6
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])

const file = join(ROOT, 'Assets', 'ShaderGalleryStage', 'StageSprite.png')
mkdirSync(dirname(file), { recursive: true })
writeFileSync(file, png)
console.log(`${file} (${png.length} 바이트)`)
