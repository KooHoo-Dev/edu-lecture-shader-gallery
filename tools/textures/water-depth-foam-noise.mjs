// 물가 거품용 회색 노이즈. 반복해도 이음매가 없다. 색이 아니라 높이 데이터라 선형(sRGB 끔)으로 읽는다.
// 셰이더가 이 한 장을 크기와 방향을 달리해 세 번 쓴다: 잔물결 높이 두 장(서로 다른 방향으로 흐른다)과 거품을 끊는 무늬.
import { smoothstep, tileNoise } from '../lib/texture-kit.mjs'

// 옥타브마다 칸 경계를 어긋나게 둔 반복 노이즈.
// 값 노이즈는 칸 경계에서 기울기가 0 이 된다. 공용 tileFbm 처럼 모든 옥타브의 경계가 같은 줄(1/4 마다)에 겹치면
// 그 줄을 따라 기울기가 늘 0 이라, 기울기로 만든 법선이 평평해져 수면에 가로세로 줄이 드러난다.
// u, v 를 상수만큼 밀어도 반복 주기(1)는 그대로라 이음매는 생기지 않는다.
function shiftedFbm(u, v, period, octaves) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let o = 0; o < octaves; o++) {
    const shift = 0.37 * (o + 1)
    sum += tileNoise(u + shift, v + shift * 1.7, period << o) * amp
    norm += amp
    amp *= 0.5
  }
  return sum / norm
}

export default {
  file: 'Assets/Shaders/water-depth-foam/WaterDepthFoamNoise.png',
  // PNG 는 HTML 에 그대로 들어간다. 잔물결은 셰이더가 몇 번씩 반복해 깔므로 128 이면 충분하다.
  size: 128,
  shade(u, v) {
    // 칸 수 4 에서 시작하는 3옥타브 반복 노이즈. 칸 수가 정수라 u, v 가 0 과 1 에서 같은 값이 되어 이음매가 없다.
    // 옥타브를 3개로 두는 까닭: 더 잘면 수면에서 지글거리고 PNG 도 커진다.
    const n = shiftedFbm(u, v, 4, 3)
    // 값 노이즈는 0.5 근처에 몰린다. 0~1 을 고르게 쓰도록 넓힌다. 셰이더의 거품 끊김이 이 폭을 그대로 쓴다.
    const g = smoothstep(0.22, 0.78, n)
    return [g, g, g]
  },
}
