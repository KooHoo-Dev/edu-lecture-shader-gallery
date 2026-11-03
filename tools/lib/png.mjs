// 의존성 없는 PNG 읽기·쓰기와 크기 바꾸기. 비교 시트(tools/compare.mjs)처럼 촬영을 이어 붙일 때 쓴다.
// 8비트 RGB, RGBA 만 읽는다 (Unity 촬영과 브라우저 스크린샷이 이 형식이다). 쓰기는 늘 RGB 다.

import { readFileSync, writeFileSync } from 'node:fs'
import { deflateSync, inflateSync } from 'node:zlib'

/** { w, h, px } — px 는 RGB 3바이트씩 */
export function readPng(file) {
  const buf = readFileSync(file)
  let pos = 8, w = 0, h = 0, depth = 0, type = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const kind = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (kind === 'IHDR') {
      w = data.readUInt32BE(0)
      h = data.readUInt32BE(4)
      depth = data[8]
      type = data[9]
    }
    if (kind === 'IDAT') idat.push(data)
    pos += 12 + len
  }
  if (depth !== 8 || (type !== 2 && type !== 6) || buf[28] !== 0) throw new Error(`8비트 RGB/RGBA 비월 PNG 만 읽는다: ${file}`)
  const bpp = type === 6 ? 4 : 3
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * bpp
  const rows = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x]
      const a = x >= bpp ? rows[y * stride + x - bpp] : 0
      const b = y > 0 ? rows[(y - 1) * stride + x] : 0
      const c = x >= bpp && y > 0 ? rows[(y - 1) * stride + x - bpp] : 0
      let p = 0
      if (filter === 1) p = a
      else if (filter === 2) p = b
      else if (filter === 3) p = (a + b) >> 1
      else if (filter === 4) {
        const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c)
        p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      rows[y * stride + x] = (v + p) & 255
    }
  }
  const px = Buffer.alloc(w * h * 3)
  for (let i = 0; i < w * h; i++) rows.copy(px, i * 3, i * bpp, i * bpp + 3)
  return { w, h, px }
}

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(bytes) {
  let c = 0xffffffff
  for (const b of bytes) c = CRC[(c ^ b) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(kind, data) {
  const head = Buffer.alloc(4)
  head.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(kind, 'ascii'), data])
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc32(body))
  return Buffer.concat([head, body, tail])
}

export function writePng(file, { w, h, px }) {
  const raw = Buffer.alloc(h * (w * 3 + 1))
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]))
}

/** 상자 평균으로 줄인다 (늘릴 때는 가까운 픽셀) */
export function resize(img, w, h) {
  const px = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor((y * img.h) / h), y1 = Math.max(y0 + 1, Math.floor(((y + 1) * img.h) / h))
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor((x * img.w) / w), x1 = Math.max(x0 + 1, Math.floor(((x + 1) * img.w) / w))
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) sum += img.px[(yy * img.w + xx) * 3 + c]
        px[(y * w + x) * 3 + c] = Math.round(sum / ((y1 - y0) * (x1 - x0)))
      }
    }
  }
  return { w, h, px }
}

/** 같은 높이의 그림을 가로로 잇는다. 사이에 gap 픽셀의 흰 줄 */
export function sideBySide(images, gap = 6) {
  const h = Math.max(...images.map(i => i.h))
  const w = images.reduce((s, i) => s + i.w, 0) + gap * (images.length - 1)
  const px = Buffer.alloc(w * h * 3, 255)
  let ox = 0
  for (const img of images) {
    for (let y = 0; y < img.h; y++) img.px.copy(px, (y * w + ox) * 3, y * img.w * 3, (y + 1) * img.w * 3)
    ox += img.w + gap
  }
  return { w, h, px }
}

/** 같은 크기 두 장의 평균 RGB 차이와 8 넘게 다른 픽셀 비율 */
export function difference(a, b) {
  let sum = 0, changed = 0
  const n = a.w * a.h
  for (let i = 0; i < n; i++) {
    const d = (Math.abs(a.px[i * 3] - b.px[i * 3]) + Math.abs(a.px[i * 3 + 1] - b.px[i * 3 + 1]) + Math.abs(a.px[i * 3 + 2] - b.px[i * 3 + 2])) / 3
    sum += d
    if (d > 8) changed++
  }
  return { mean: sum / n, changed: changed / n }
}
