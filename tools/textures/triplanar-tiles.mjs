// 삼평면 투영용 돌 타일. 4x4 칸, 반복해도 이음매가 없다. 칸이 정사각형이라 한 축 투영에서 늘어나면 바로 보인다.
import { hash, smoothstep, tileNoise } from '../lib/texture-kit.mjs'

export default {
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
    const base = [0.52 + 0.16 * tint, 0.47 + 0.1 * tint, 0.4 + 0.06 * (1 - tint)]
    const light = (0.78 + 0.22 * bevel) * (0.82 + 0.3 * grain)
    const grout = [0.16, 0.15, 0.14]
    return base.map((c, i) => grout[i] + (c * light - grout[i]) * stone)
  },
}
