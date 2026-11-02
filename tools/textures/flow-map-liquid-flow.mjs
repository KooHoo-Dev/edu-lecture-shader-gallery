// 플로 맵 액체의 흐름 방향 텍스처. RG 에 UV 공간 흐름 방향을 0~1 로 담는다 (0.5 가 멈춤). 데이터라 sRGB 를 끄고 읽는다.
// 가운데 큰 소용돌이 하나에 반복 노이즈로 굽이를 더했다. 둘 다 흐름 함수(stream function)의 기울기를 90도 돌려 만들어
// 물이 한곳에 몰리거나 비지 않는다(발산 0). 가장자리에서 흐름이 이어지므로 Repeat 로 깔아도 이음매가 없다.
// 소용돌이는 UV 중심에 대해 180도 돌려도 같은 모양이라, 메시마다 UV 가 180도 돌아 있어도 도는 방향이 같다.
import { tileFbm } from '../lib/texture-kit.mjs'

const SIZE = 128
// 굽이 노이즈의 세기. 소용돌이 기울기 최대값(약 3.14)에 견줘 정한다. 크면 소용돌이가 흐트러진다.
const WOBBLE = 0.32

// 흐름 함수. x 는 u(오른쪽), y 는 v(위쪽, 텍스처 위가 1).
function stream(x, y) {
  const s = Math.sin(Math.PI * x) ** 2 * Math.sin(Math.PI * y) ** 2
  return s + WOBBLE * (tileFbm(x, y, 3, 2) - 0.5)
}

// 흐름 = 흐름 함수 기울기를 90도 돌린 것. 중심 기준 반시계 방향(u 오른쪽, v 위로 볼 때)으로 돈다.
function velocity(x, y) {
  const h = 1 / 1024
  const dx = (stream(x + h, y) - stream(x - h, y)) / (2 * h)
  const dy = (stream(x, y + h) - stream(x, y - h)) / (2 * h)
  return [dy, -dx]
}

// 가장 빠른 곳이 길이 1 이 되게 맞춘다.
let peak = 0
for (let j = 0; j < SIZE; j++) {
  for (let i = 0; i < SIZE; i++) {
    const [vx, vy] = velocity((i + 0.5) / SIZE, (j + 0.5) / SIZE)
    peak = Math.max(peak, Math.hypot(vx, vy))
  }
}

export default {
  file: 'Assets/Shaders/flow-map-liquid/FlowMapLiquidFlow.png',
  size: SIZE,
  shade(u, v) {
    // shade 의 v 는 위에서 아래로 늘어나므로 UV 의 v(아래가 0)로 뒤집는다.
    const [vx, vy] = velocity(u, 1 - v)
    return [(vx / peak) * 0.5 + 0.5, (vy / peak) * 0.5 + 0.5, 0]
  },
}
