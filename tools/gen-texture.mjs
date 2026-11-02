// 표본이 쓰는 텍스처를 코드로 만든다. 원작 텍스처를 쓰지 않는다는 콘텐츠 정책 때문이다.
//   node tools/gen-texture.mjs              # tools/textures/ 의 무늬 전부
//   node tools/gen-texture.mjs <이름>       # tools/textures/<이름>.mjs 하나만
//
// 무늬 모듈은 다음을 default export 한다. 표본 잡은 자기 모듈을 써서 이 명령으로 PNG 를 만든다.
//   file   리포 기준 PNG 경로 (보통 Assets/Shaders/<id>/<이름>.png)
//   size   한 변 픽셀 수, 또는 [가로, 세로]. PNG 는 HTML 에 그대로 들어가므로 작게 둔다
//   alpha  true 면 RGBA. shade 가 [r, g, b, a] 를 돌려준다
//   shade(u, v)  픽셀 중심 좌표(0~1, v 는 위에서 아래)의 색. 0~1 값. 색 텍스처는 sRGB, 데이터 텍스처는 그대로 저장된다
// 공용 도구(노이즈, 해시 등)는 tools/lib/texture-kit.mjs 에 있다.

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { deflateSync } from 'node:zlib'
import { clamp01 } from './lib/texture-kit.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'tools', 'textures')

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

function encode([width, height], alpha, shade) {
  const channels = alpha ? 4 : 3
  const stride = width * channels + 1
  const raw = Buffer.alloc(stride * height)
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const color = shade((col + 0.5) / width, (row + 0.5) / height)
      for (let i = 0; i < channels; i++) raw[row * stride + 1 + col * channels + i] = Math.round(clamp01(color[i] ?? 1) * 255)
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = alpha ? 6 : 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

const available = readdirSync(DIR).filter(f => f.endsWith('.mjs')).map(f => f.slice(0, -4))
const names = process.argv.slice(2)
for (const name of names.length ? names : available) {
  if (!available.includes(name)) {
    console.log(`알 수 없는 텍스처: ${name}. 목록: ${available.join(', ')}`)
    process.exit(1)
  }
  const { default: texture } = await import(pathToFileURL(join(DIR, `${name}.mjs`)).href)
  const size = Array.isArray(texture.size) ? texture.size : [texture.size, texture.size]
  const png = encode(size, Boolean(texture.alpha), texture.shade)
  const file = join(ROOT, texture.file)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, png)
  console.log(`${texture.file} (${size.join('x')}, ${png.length} 바이트)`)
}
