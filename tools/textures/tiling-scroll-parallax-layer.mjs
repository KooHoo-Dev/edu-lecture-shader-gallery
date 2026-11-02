// 타일 스크롤 패럴랙스용 배경 한 층. 언덕 실루엣과 나무, 위쪽은 투명하다.
// 가로로만 이음매 없이 반복된다: 능선은 정수 주기의 사인 합이고 나무 자리도 1 을 주기로 감는다.
// 땅속 띠가 능선을 따라 내려가서, Wrap Mode 가 Clamp 이면 끝 열이 가로 줄무늬로 늘어나는 것이 바로 보인다.
import { hash, mix, smoothstep } from '../lib/texture-kit.mjs'

const WIDTH = 512
const HEIGHT = 256
const TAU = Math.PI * 2

// 아래에서 잰 능선 높이 (0~1). 주기가 1, 2, 3, 5 라 u = 0 과 u = 1 이 같다.
function ridge(u) {
  return 0.46 + 0.1 * Math.sin(TAU * u + 0.6) + 0.06 * Math.sin(TAU * 2 * u + 2.1) + 0.035 * Math.sin(TAU * 3 * u + 4.0) + 0.015 * Math.sin(TAU * 5 * u + 1.3)
}

// 나무 자리. 가로 위치는 0~1 안에서 정하고 거리를 감아 재므로 오른쪽 끝의 나무가 왼쪽에서 이어진다.
const TREES = [0.07, 0.15, 0.4, 0.46, 0.53, 0.78, 0.9].map((u, k) => ({ u, height: 0.11 + 0.07 * hash(k, 3), half: 0.022 + 0.008 * hash(k, 7) }))

function wrapDistance(a, b) {
  const d = a - b
  return d - Math.round(d)
}

export default {
  file: 'Assets/Shaders/tiling-scroll-parallax/TilingScrollParallaxLayer.png',
  // 가로 2 : 세로 1. 스프라이트 무대에서 4 x 2 유닛으로 보인다. 30KB 를 넘지 않게 작게 둔다.
  size: [WIDTH, HEIGHT],
  alpha: true,
  shade(u, v) {
    const y = 1 - v
    const px = 1 / HEIGHT
    const top = ridge(u)

    // 땅: 능선 아래. 한 픽셀 폭으로 가장자리를 부드럽게 한다.
    const ground = smoothstep(-0.5 * px, 0.5 * px, top - y)

    // 나무: 능선 위에 선 삼각형. 땅과 같은 실루엣으로 합친다.
    let tree = 0
    for (const t of TREES) {
      const dx = Math.abs(wrapDistance(u, t.u)) * 2 // 가로 2 : 세로 1 이라 세로 단위로 바꾼다
      const base = ridge(t.u) - 0.02
      const rise = (y - base) / t.height
      if (rise < 0 || rise > 1) continue
      const halfWidth = t.half * 2 * (1 - rise)
      tree = Math.max(tree, smoothstep(0.5 * px, -0.5 * px, dx - halfWidth))
    }

    const alpha = Math.max(ground, tree)
    if (alpha <= 0) return [0, 0, 0, 0]

    // 능선에서 잰 깊이. 0 이 지표면이다.
    const depth = Math.max(0, top - y)
    const grass = [0.55, 0.78, 0.42]
    const soil = [0.2, 0.36, 0.27]
    const deep = [0.1, 0.2, 0.18]
    let color = depth < 0.03 ? grass : depth < 0.4 ? soil.map((c, i) => mix(c, deep[i], depth / 0.4)) : deep
    // 능선을 따라 내려가는 띠. 끝 열이 늘어나면 가로 줄무늬가 된다.
    const band = Math.floor(depth / 0.07) % 2 === 1 && depth >= 0.03 ? 0.85 : 1
    color = color.map(c => c * band)
    // 풀 띠와 흙 사이를 한 픽셀 섞는다.
    const edge = smoothstep(0.03 - px, 0.03 + px, depth)
    if (depth < 0.03 + px) color = grass.map((c, i) => mix(c, soil[i] * band, edge))

    if (tree > ground) color = [0.13, 0.3, 0.22]
    return [...color, alpha]
  },
}
