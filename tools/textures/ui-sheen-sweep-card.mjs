// 광택 훑기용 UI 그림. 금테를 두른 세로 아이템 카드, 가운데 보석, 아래 별 세 개. 카드 바깥은 투명하다.
// 어두운 카드 면과 밝은 금테가 함께 있어 가산 광택이 어두운 면에서는 또렷하고 밝은 테에서는 하얗게 포화되는 것이 보인다.
// 바깥 투명 여백은 '효과 끄기'(알파로 가리지 않은 띠)가 여백 위로 지나가는 모습을 보여 주는 자리다.
//
// 색 텍스처라 sRGB 로 저장한다. 투명 텍셀에도 가장 가까운 금테 색을 칠해 둔다.
// 웹은 Alpha Is Transparency 가 없어 Bilinear 로 읽으면 가장자리에 검은 테가 생기기 때문이다.
import { mix, smoothstep } from '../lib/texture-kit.mjs'

// 무대에서 화면 높이의 3분의 2 정도로 크게 보이므로 256 으로 둔다. 무늬가 단순해 20KB 안쪽이다
const SIZE = 256
const PX = 1 / SIZE

// 카드 반 크기와 모서리 반경 (0~1 텍스처 단위, 가운데가 원점)
const HALF = [0.36, 0.45]
const RADIUS = 0.07
const BORDER = 0.042
const GEM_Y = 0.04

const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16) / 255)
const lerp3 = (a, b, t) => a.map((v, i) => mix(v, b[i], t))

const GOLD_TOP = hex('#f8d987')
const GOLD_BOTTOM = hex('#b7802c')
const GOLD_LINE = hex('#4a3216')
const FACE_TOP = hex('#3d4296')
const FACE_BOTTOM = hex('#181a45')
const GLOW = hex('#7b6cff')
const GEM_TABLE = hex('#c4f7ff')
const GEM_TL = hex('#78e6f7')
const GEM_TR = hex('#3cc4e0')
const GEM_BL = hex('#2aa0c2')
const GEM_BR = hex('#14789a')
const GEM_EDGE = hex('#0b4a5c')

// 둥근 사각형의 거리. 안쪽이 음수다
function roundBox(x, y, hx, hy, r) {
  const qx = Math.abs(x) - hx + r
  const qy = Math.abs(y) - hy + r
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
}

// 마름모 (1 이 가장자리). 보석과 별 모양에 쓴다
const diamond = (x, y, hx, hy) => Math.abs(x) / hx + Math.abs(y) / hy

// 거리 d 가 0 을 지날 때 width 폭으로 0 -> 1 (안쪽이 1)
const inside = (d, width = PX) => smoothstep(width * 0.5, -width * 0.5, d)

function goldAt(y) {
  return lerp3(GOLD_BOTTOM, GOLD_TOP, smoothstep(-HALF[1], HALF[1], y))
}

function face(x, y) {
  // 위가 밝은 세로 그라데이션에 보석 뒤의 보랏빛 후광을 얹는다
  let c = lerp3(FACE_BOTTOM, FACE_TOP, smoothstep(-HALF[1], HALF[1], y))
  const glow = Math.max(0, 1 - Math.hypot(x, (y - GEM_Y) * 0.85) / 0.28)
  c = lerp3(c, GLOW, glow * glow * 0.55)

  // 보석: 가운데 밝은 면(테이블)과 네 빗면, 짙은 테두리
  const g = diamond(x, y - GEM_Y, 0.15, 0.2)
  const gw = PX / 0.15
  let gem = x < 0 ? (y > GEM_Y ? GEM_TL : GEM_BL) : y > GEM_Y ? GEM_TR : GEM_BR
  gem = lerp3(gem, GEM_TABLE, inside(g - 0.42, gw))
  gem = lerp3(gem, GEM_EDGE, smoothstep(0.84, 0.9, g))
  c = lerp3(c, gem, inside(g - 1, gw))

  // 희귀도 별 세 개
  for (const sx of [-0.085, 0, 0.085]) {
    const s = diamond(x - sx, y + 0.31, 0.028, 0.038)
    c = lerp3(c, goldAt(y + 0.2), inside(s - 1, PX / 0.028))
  }
  return c
}

export default {
  file: 'Assets/Shaders/ui-sheen-sweep/UiSheenSweepCard.png',
  size: SIZE,
  alpha: true,
  shade(u, v) {
    const x = u - 0.5
    const y = 0.5 - v
    const d = roundBox(x, y, HALF[0], HALF[1], RADIUS)
    const gold = goldAt(y)
    // 바깥(투명)도 금테 색을 그대로 둔다
    if (d > PX) return [...gold, 0]
    // 금테 -> 짙은 안쪽 선 -> 카드 면
    let c = lerp3(gold, GOLD_LINE, inside(d + BORDER))
    c = lerp3(c, face(x, y), inside(d + BORDER + 0.012))
    return [...c, inside(d)]
  },
}
