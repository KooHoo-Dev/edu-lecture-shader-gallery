// 스프라이트 바람 흔들림용 풀 덤불. 아래 가운데 뿌리에서 잎 11장이 부채꼴로 뻗는다.
// 잎은 2차 베지어 곡선을 따라 뿌리에서 넓고 끝으로 갈수록 뾰족하다. 뿌리 쪽은 짙은 초록, 끝은 연두다.
// 잎마다 한쪽 가장자리(진행 방향의 오른쪽)에 1px 어두운 테를 둬 겹친 잎이 갈려 보인다.
// 4× 슈퍼샘플(픽셀마다 16점)로 가장자리를 부드럽게 한다.
//
// 여백: 셰이더의 픽셀 단계 휨이 옆 텍셀을 읽으므로 좌우 약 20px, 위 8px 이상을 투명하게 둔다.
// 맨 아래 3행은 뿌리 덩이가 불투명하게 닿게 해 바닥에 붙은 것처럼 보인다.
// 색 텍스처라 sRGB 로 저장한다. 투명 텍셀에도 가장 가까운 잎 색을 칠해 둔다.
// 웹은 Alpha Is Transparency 가 없어 Bilinear 로 읽으면 가장자리에 검은 테가 생기기 때문이다.
import { hash, mix } from '../lib/texture-kit.mjs'

const W = 96
const H = 128
const SS = 4

const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16) / 255)
const lerp3 = (a, b, t) => a.map((v, i) => mix(v, b[i], t))

const ROOT = hex('#1c4420')
const MID = hex('#3f8a33')
const TIP = hex('#b9e066')
const RIM = hex('#123016')
const BASE = hex('#173a1b')

// 잎 11장. s 는 -1(왼쪽) ~ 1(오른쪽) 펼친 정도, top 은 끝의 높이(px, 위에서), shade 는 밝기 변화.
// 바깥 잎을 먼저 그리고 가운데 잎을 나중에 그려 가운데가 앞에 온다.
const LEAVES = [
  { s: -1.0, top: 50, shade: 0.9 },
  { s: 1.0, top: 46, shade: 0.92 },
  { s: -0.78, top: 30, shade: 1.0 },
  { s: 0.8, top: 26, shade: 0.96 },
  { s: -0.55, top: 17, shade: 0.88 },
  { s: 0.58, top: 14, shade: 1.04 },
  { s: -0.32, top: 10, shade: 1.02 },
  { s: 0.34, top: 9, shade: 0.9 },
  { s: -0.12, top: 12, shade: 0.95 },
  { s: 0.14, top: 18, shade: 1.06 },
  { s: 0.0, top: 34, shade: 1.0 },
].map((leaf, k) => {
  // 뿌리는 아래 가운데에 몰리고 이미지 아래보다 조금 밑에서 시작해 맨 아래 행까지 불투명하게 닿는다
  const root = [48 + leaf.s * 5, H + 2]
  // 끝은 좌우 여백 20px 안쪽에 둔다 (폭풍에 돌풍과 밀기가 겹쳐도 휨 보정이 사각형 밖을 덜 읽게)
  const tip = [48 + leaf.s * 26 + (hash(k, 3) - 0.5) * 2, leaf.top]
  // 조절점은 뿌리 바로 위에 높게 두어 곧게 솟다가 바깥으로 휜다
  const ctrl = [root[0] + (tip[0] - root[0]) * 0.12, root[1] - (root[1] - tip[1]) * 0.62]
  // 곡선을 짧은 선분으로 나눠 둔다 (거리 계산용)
  const pts = []
  for (let i = 0; i <= 32; i++) {
    const t = i / 32
    const a = (1 - t) * (1 - t)
    const b = 2 * (1 - t) * t
    const c = t * t
    pts.push([a * root[0] + b * ctrl[0] + c * tip[0], a * root[1] + b * ctrl[1] + c * tip[1]])
  }
  return { ...leaf, pts, width: 3.2 + hash(k, 7) * 0.8 }
})

// 점 p 에서 잎 곡선까지 가장 가까운 곳의 (거리, 곡선 위 t, 오른쪽이면 +1 왼쪽이면 -1)
function nearest(pts, px, py) {
  let best = { d: Infinity, t: 0, side: 1 }
  const n = pts.length - 1
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[i + 1]
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy
    const h = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / len2))
    const qx = px - (ax + dx * h)
    const qy = py - (ay + dy * h)
    const d = Math.hypot(qx, qy)
    if (d < best.d) best = { d, t: (i + h) / n, side: dx * qy - dy * qx > 0 ? 1 : -1 }
  }
  return best
}

// 한 점(서브샘플)의 색. 덮는 잎이 없으면 null
function sampleAt(px, py) {
  let color = null
  // 뿌리 덩이: 아래 가운데 납작한 반타원
  const bx = (px - 48) / 11
  const by = (py - H) / 6
  if (bx * bx + by * by < 1) color = BASE
  for (const leaf of LEAVES) {
    const { d, t, side } = nearest(leaf.pts, px, py)
    // 뿌리에서 넓고 끝으로 뾰족하다
    const half = leaf.width * Math.pow(1 - t, 0.75) + 0.25
    if (d > half) continue
    const body = t < 0.45 ? lerp3(ROOT, MID, t / 0.45) : lerp3(MID, TIP, (t - 0.45) / 0.55)
    let c = body.map(v => Math.min(1, v * leaf.shade))
    // 한쪽 가장자리 1px 어두운 테
    if (side > 0 && d > half - 1) c = lerp3(c, RIM, 0.75)
    color = c
  }
  return color
}

let image = null

function build() {
  const rgba = new Float32Array(W * H * 4)
  for (let row = 0; row < H; row++) {
    for (let col = 0; col < W; col++) {
      let r = 0, g = 0, b = 0, n = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sampleAt(col + (sx + 0.5) / SS, row + (sy + 0.5) / SS)
          if (!c) continue
          r += c[0]
          g += c[1]
          b += c[2]
          n++
        }
      }
      const i = (row * W + col) * 4
      // 색은 덮인 서브샘플만 평균한다 (검정과 섞지 않는다). 덮인 비율이 알파다
      if (n > 0) rgba.set([r / n, g / n, b / n, n / (SS * SS)], i)
      else rgba.set([0, 0, 0, -1], i)
    }
  }
  // 투명 텍셀에 가장 가까운 잎 색을 번져 칠한다 (한 바퀴에 한 텍셀씩 넓힌다). 알파는 0 으로 둔다
  for (let pass = 0; pass < W + H; pass++) {
    const fill = []
    for (let row = 0; row < H; row++) {
      for (let col = 0; col < W; col++) {
        const i = (row * W + col) * 4
        if (rgba[i + 3] >= 0) continue
        let r = 0, g = 0, b = 0, n = 0
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = col + dx
          const y = row + dy
          if (x < 0 || y < 0 || x >= W || y >= H) continue
          const j = (y * W + x) * 4
          if (rgba[j + 3] < 0) continue
          r += rgba[j]
          g += rgba[j + 1]
          b += rgba[j + 2]
          n++
        }
        if (n > 0) fill.push([i, r / n, g / n, b / n])
      }
    }
    if (!fill.length) break
    for (const [i, r, g, b] of fill) rgba.set([r, g, b, 0], i)
  }
  return rgba
}

export default {
  file: 'Assets/Shaders/sprite-wind-sway/SpriteWindSwayGrass.png',
  size: [W, H],
  alpha: true,
  shade(u, v) {
    if (!image) image = build()
    const i = (Math.floor(v * H) * W + Math.floor(u * W)) * 4
    return [image[i], image[i + 1], image[i + 2], Math.max(0, image[i + 3])]
  },
}
