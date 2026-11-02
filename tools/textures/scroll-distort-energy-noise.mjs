// 스크롤·왜곡 에너지용 회색 노이즈. 반복해도 이음매가 없다. 색이 아니라 데이터라 선형(sRGB 끔)으로 읽는다.
// 세로(v)보다 가로(u)로 촘촘한 노이즈의 능선을 써서 위아래로 길게 늘어진 결을 만든다. 원통 길이 방향으로 흐를 때 기운이 뻗어 보인다.
import { hash, smoothstep } from '../lib/texture-kit.mjs'

// 가로 칸 수(px)와 세로 칸 수(py)가 다른 반복 값 노이즈. 공용 tileNoise 는 두 축 칸 수가 같아
// u 에 배수를 곱해도 같은 칸이 되풀이될 뿐 결이 길어지지 않는다.
function streakNoise(u, v, px, py) {
  const x = u * px
  const y = v * py
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const at = (ix, iy) => hash(((ix % px) + px) % px, ((iy % py) + py) % py + 1000 * py)
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx
  const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx
  return a + (b - a) * sy
}

function streakFbm(u, v, px, py, octaves) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let o = 0; o < octaves; o++) {
    sum += streakNoise(u, v, px << o, py << o) * amp
    norm += amp
    amp *= 0.5
  }
  return sum / norm
}

export default {
  file: 'Assets/Shaders/scroll-distort-energy/ScrollDistortNoise.png',
  // PNG 는 HTML 에 그대로 들어간다. 128 이면 충분하다.
  size: 128,
  shade(u, v) {
    // 가로로 3배 촘촘한 노이즈. u * 3 은 정수 배라 u 가 0 과 1 에서 같은 값이 되어 이음매가 없다.
    // 가로 8칸, 세로 2칸이라 칸이 세로로 4배 길다. 옥타브를 3개로 줄여 잔 노이즈를 덜어 낸다. 잔 노이즈는 화면에서 지글거리고 PNG 도 커진다.
    const streak = streakFbm(u, v, 8, 2, 3)
    // 0.5 근처가 1 이 되는 능선. 네제곱해 가는 결만 남긴다.
    const ridge = Math.pow(1 - Math.abs(streak * 2 - 1), 4)
    // 큰 덩어리 구름. 결이 고르게 깔리지 않고 짙은 곳과 빈 곳이 생기게 곱한다.
    const cloud = smoothstep(0.25, 0.75, streakFbm(u, v, 4, 2, 2))
    // 바탕은 어둡게 두고 결과 구름이 겹친 곳만 밝다. 두 레이어를 곱하면 밝은 곳끼리 만난 자리만 남는다.
    const g = Math.min(1, ridge * (0.3 + 0.9 * cloud) + cloud * 0.18)
    return [g, g, g]
  },
}
