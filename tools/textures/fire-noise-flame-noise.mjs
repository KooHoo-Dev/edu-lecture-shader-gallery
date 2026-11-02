// 노이즈 불꽃용 회색 노이즈. 반복해도 이음매가 없다. 색이 아니라 데이터라 선형(sRGB 끔)으로 읽는다.
// 셰이더가 이 한 장을 크기와 속도만 달리해 두 층으로 흘려 곱하고, 한 번 더 크게 읽어 불길을 좌우로 흔든다.
import { hash, smoothstep } from '../lib/texture-kit.mjs'

// 가로 칸 수(px)와 세로 칸 수(py)가 다른 반복 값 노이즈. 칸이 세로로 길어 무늬가 위아래로 늘어난다.
// 셰이더에서 UV 를 세로로 늘이지 않아도 위로 뻗은 불길 결이 나와, 셰이더는 uv * 크기 하나로 읽으면 된다.
// 칸 번호를 칸 수로 감싸므로 u, v 가 0 과 1 에서 같은 값이 되어 이음매가 없다. seed 로 층마다 다른 난수를 쓴다.
function streakNoise(u, v, px, py, seed) {
  const x = u * px
  const y = v * py
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const at = (ix, iy) => hash(((ix % px) + px) % px + seed, ((iy % py) + py) % py + 977 * seed)
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx
  const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx
  return a + (b - a) * sy
}

// 칸 수가 서로 나누어떨어지지 않는 세 층을 더한다. 2배씩 커지는 보통 옥타브는 칸 경계가 같은 줄에 겹쳐
// 흘릴 때 가로세로 줄이 비친다. 세로 칸 수도 4 이상으로 두어 한 줄 전체가 밝은 가로 띠가 생기기 어렵게 한다.
function mixedNoise(u, v) {
  const a = streakNoise(u, v, 7, 4, 1)
  const b = streakNoise(u + 0.31, v + 0.57, 11, 6, 2)
  const c = streakNoise(u + 0.73, v + 0.19, 19, 11, 3)
  return (a + b * 0.7 + c * 0.35) / 2.05
}

export default {
  file: 'Assets/Shaders/fire-noise-flame/FireNoiseFlameNoise.png',
  // PNG 는 HTML 에 그대로 들어간다. 부드러운 노이즈라 128 이면 충분하다.
  size: 128,
  shade(u, v) {
    // 칸이 너무 크면 Quad 에 덩어리 두세 개만 걸려, 밝은 덩어리가 지나갈 때마다 불 전체가 커졌다 작아진다.
    // 가장 큰 층도 가로 7칸, 세로 4칸으로 두어 밝고 어두운 곳이 화면 안에서 고르게 섞이게 한다.
    // 더 잔 층을 넣으면 불꽃 가장자리가 지글거리고 PNG 도 커진다.
    const n = mixedNoise(u, v)
    // 값 노이즈는 0.5 근처에 몰린다. 0~1 을 고르게 쓰도록 넓힌다. 두 층을 곱했을 때 밝고 어두운 곳이 또렷해진다.
    const g = smoothstep(0.2, 0.8, n)
    return [g, g, g]
  },
}
