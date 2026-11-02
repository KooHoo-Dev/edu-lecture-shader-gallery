// 젖음과 눈 쌓임용 돌 벽돌 바탕. 가로로 엇갈린 벽돌 4줄, 한 줄에 2장. 반복해도 이음매가 없다.
// 벽돌마다 밝기와 색을 조금씩 달리하고 줄눈을 어둡게 둬서, 젖으면 어두워지는 차이와 눈이 덮어 무늬가 사라지는 차이가 함께 보인다.
// 색 텍스처라 sRGB 로 저장한다. 중간 밝기로 둬야 어둡게 해도, 흰 눈을 얹어도 대비가 남는다.
import { hash, mix, smoothstep, tileNoise } from '../lib/texture-kit.mjs'

const ROWS = 4
const PER_ROW = 2

export default {
  file: 'Assets/Shaders/surface-wet-snow/SurfaceWetSnowStone.png',
  // PNG 는 HTML 에 그대로 들어간다. 무늬가 단순해 128 이면 충분하다.
  size: 128,
  shade(u, v) {
    const row = Math.floor(v * ROWS)
    const fy = v * ROWS - row
    // 홀수 줄은 반 장 밀어 엇갈리게 쌓는다. 칸 번호를 한 줄 장수로 감싸 반복 이음매를 없앤다.
    const shifted = u * PER_ROW + (row % 2) * 0.5
    const col = Math.floor(shifted)
    const fx = shifted - col
    const wrappedCol = ((col % PER_ROW) + PER_ROW) % PER_ROW

    // 줄눈까지의 거리. 벽돌 한 장이 2:1 이라 세로 줄눈 쪽 거리는 두 배로 재서 폭을 맞춘다.
    const edge = Math.min(fx * 2, (1 - fx) * 2, fy, 1 - fy)
    const stone = smoothstep(0.06, 0.11, edge)
    const bevel = smoothstep(0.1, 0.3, edge)

    const tint = hash(wrappedCol + 3, row + 11)
    const warm = hash(wrappedCol + 7, row + 29)
    const grain = tileNoise(u, v, 32) * 0.55 + tileNoise(u, v, 8) * 0.45
    const pits = smoothstep(0.62, 0.75, tileNoise(u, v, 64))

    // 회갈색 돌. 벽돌마다 밝기와 온도를 조금씩 바꾼다.
    const base = [mix(0.46, 0.64, tint) + 0.06 * warm, mix(0.42, 0.57, tint), mix(0.38, 0.5, tint) - 0.05 * warm]
    const light = (0.8 + 0.2 * bevel) * (0.82 + 0.32 * grain) * (1 - 0.18 * pits)
    const grout = [0.2, 0.19, 0.18]
    return base.map((c, i) => grout[i] + (c * light - grout[i]) * stone)
  },
}
