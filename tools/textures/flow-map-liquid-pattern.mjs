// 플로 맵 액체가 흘려 보내는 무늬. 밝기만 쓴다 (색은 머티리얼의 두 색이 정한다).
// 세포 경계의 밝은 실금(용암의 갈라진 틈, 물의 거품 줄)과 큰 얼룩을 섞었다. 반복해도 이음매가 없다.
// 흐름에 늘어나는 모습이 잘 보이도록 방향이 없는 둥근 세포 무늬로 둔다.
import { hash, smoothstep, tileFbm } from '../lib/texture-kit.mjs'

const CELLS = 5

// 반복되는 세포 무늬. 가장 가까운 점과 두 번째로 가까운 점까지의 거리 차이(F2 - F1)가 작으면 경계다.
function cellEdge(u, v) {
  const x = u * CELLS
  const y = v * CELLS
  const cx = Math.floor(x)
  const cy = Math.floor(y)
  let f1 = 9
  let f2 = 9
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const gx = cx + i
      const gy = cy + j
      const wx = ((gx % CELLS) + CELLS) % CELLS
      const wy = ((gy % CELLS) + CELLS) % CELLS
      const px = gx + 0.15 + 0.7 * hash(wx, wy)
      const py = gy + 0.15 + 0.7 * hash(wy + 17, wx + 31)
      const d = Math.hypot(px - x, py - y)
      if (d < f1) {
        f2 = f1
        f1 = d
      } else if (d < f2) f2 = d
    }
  }
  return f2 - f1
}

export default {
  file: 'Assets/Shaders/flow-map-liquid/FlowMapLiquidPattern.png',
  // PNG 는 HTML 에 그대로 들어간다. 128 로 둔다.
  size: 128,
  shade(u, v) {
    // 경계를 노이즈로 조금 흔들어 세포가 너무 반듯하지 않게 한다.
    const wobble = (tileFbm(u, v, 8, 3) - 0.5) * 0.25
    const crack = 1 - smoothstep(0.02, 0.14, cellEdge(u, v) + wobble)
    const blotch = tileFbm(u + 0.37, v + 0.11, 4, 4)
    const g = Math.min(1, 0.08 + 0.3 * smoothstep(0.35, 0.75, blotch) + 0.85 * crack)
    return [g, g, g]
  },
}
