// 표본이 쓰는 텍스처를 코드로 만든다. 원작 텍스처를 쓰지 않는다는 콘텐츠 정책 때문이다.
//   node tools/gen-texture.mjs              # 아래 목록 전부
//   node tools/gen-texture.mjs <이름>       # 하나만
// 워커는 PNG 를 직접 만들 수 없으므로 구독 세션이 먼저 만들어 표본 폴더에 넣는다.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const clamp01 = v => Math.min(1, Math.max(0, v))
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// 정수 좌표 해시. 같은 입력이면 항상 같은 0~1 값이다.
function hash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// 이음매 없이 반복되는 값 노이즈. period 칸마다 같은 값으로 돌아온다.
function tileNoise(u, v, period) {
  const x = u * period
  const y = v * period
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const at = (ix, iy) => hash(((ix % period) + period) % period, ((iy % period) + period) % period)
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx
  const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx
  return a + (b - a) * sy
}

const TEXTURES = {
  // 삼평면 투영용 돌 타일. 4x4 칸, 반복해도 이음매가 없다. 칸이 정사각형이라 한 축 투영에서 늘어나면 바로 보인다.
  'triplanar-tiles': {
    file: 'Assets/Shaders/triplanar-projection/TriplanarTiles.png',
    // PNG 는 HTML 에 그대로 들어간다. 256 이면 65KB 라 128 로 둔다.
    size: 128,
    shade(u, v) {
      const cells = 4
      const cx = Math.floor(u * cells)
      const cy = Math.floor(v * cells)
      const fx = u * cells - cx
      const fy = v * cells - cy
      // 줄눈까지의 거리. 칸 가장자리로 갈수록 0 이다.
      const edge = Math.min(fx, 1 - fx, fy, 1 - fy)
      const stone = smoothstep(0.035, 0.07, edge)
      const bevel = smoothstep(0.07, 0.2, edge)
      const tint = hash(cx, cy)
      const grain = tileNoise(u, v, 32) * 0.6 + tileNoise(u, v, 8) * 0.4
      const base = [
        0.52 + 0.16 * tint,
        0.47 + 0.1 * tint,
        0.4 + 0.06 * (1 - tint),
      ]
      const light = (0.78 + 0.22 * bevel) * (0.82 + 0.3 * grain)
      const grout = [0.16, 0.15, 0.14]
      return base.map((c, i) => grout[i] + (c * light - grout[i]) * stone)
    },
  },
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

// shade 는 0~1 sRGB 색을 돌려준다. 불투명 RGB PNG 로 저장한다.
function encode(size, shade) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let row = 0; row < size; row++) {
    const start = row * (size * 3 + 1)
    for (let col = 0; col < size; col++) {
      const rgb = shade((col + 0.5) / size, (row + 0.5) / size)
      for (let i = 0; i < 3; i++) raw[start + 1 + col * 3 + i] = Math.round(clamp01(rgb[i]) * 255)
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

const names = process.argv.slice(2)
for (const name of names.length ? names : Object.keys(TEXTURES)) {
  const texture = TEXTURES[name]
  if (!texture) {
    console.log(`알 수 없는 텍스처: ${name}. 목록: ${Object.keys(TEXTURES).join(', ')}`)
    process.exit(1)
  }
  const file = join(ROOT, texture.file)
  const png = encode(texture.size, texture.shade)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, png)
  console.log(`${texture.file} (${png.length} 바이트)`)
}
