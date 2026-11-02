// 텍스처 무늬 모듈(tools/textures/*.mjs)이 함께 쓰는 도구. 모두 결정적이라 같은 코드면 같은 PNG 가 나온다.

export const clamp01 = v => Math.min(1, Math.max(0, v))

export const mix = (a, b, t) => a + (b - a) * t

export function smoothstep(a, b, v) {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** 정수 좌표 해시. 같은 입력이면 항상 같은 0~1 값이다 */
export function hash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

/** 이음매 없이 반복되는 값 노이즈. u, v 는 0~1, period 칸마다 같은 값으로 돌아온다 */
export function tileNoise(u, v, period) {
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

/** 여러 옥타브를 더한 반복 노이즈. 0~1 근처 */
export function tileFbm(u, v, period, octaves = 4) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let o = 0; o < octaves; o++) {
    sum += tileNoise(u, v, period << o) * amp
    norm += amp
    amp *= 0.5
  }
  return sum / norm
}
