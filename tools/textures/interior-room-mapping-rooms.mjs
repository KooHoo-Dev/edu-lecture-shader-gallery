// 인테리어 매핑의 방 그림 아틀라스. 2×2 칸, 방당 128 px. 텍스처 좌표(아래가 0) 기준으로
//   왼쪽 아래 0 사무실, 오른쪽 아래 1 거실, 왼쪽 위 2 상점, 오른쪽 위 3 빈 방.
// 방 그림은 창 자리에서 방 깊이만큼 뒤로 물러난 눈으로 본 한 점 투시 그림이다. 그래서 뒷벽은 그림 가운데 절반 크기이고
// 둘레는 바닥, 천장, 옆벽 사다리꼴이다. 셰이더는 방 상자와 시선이 만난 점 (x, y, w) 를 q = xy / (1 + w) 로 그림 좌표로 바꾼다
// (x, y 는 -1~1, w 는 깊이 비율 0 창 ~ 1 뒷벽). 깊이가 비율로 들어가 약분되므로 방 깊이를 바꿔도 같은 그림을 쓴다.
// 이 생성기는 그 역연산(그림 좌표 → 어느 면의 어느 위치)으로 칠한다. 셰이더의 interiorPictureToRoom 과 같은 식이다.
// 칸마다 둘레 4 px 는 그림 가장자리 색을 이어 칠한 여백이다. 밉에서 이웃 방 그림이 번져 들어오지 않는다.
// 압축이 잘 되도록 넓은 단색면과 평행선 위주로 그린다 (PNG 는 HTML 에 그대로 들어간다). 색은 sRGB 다.
import { clamp01, hash } from '../lib/texture-kit.mjs'

const SIZE = 256
const CELL = 128
const PAD = 4
const SPAN = CELL - PAD * 2

// 셰이더의 interiorPictureToRoom 과 같다. 뒷벽(가장 큰 성분 0.5 이하)은 w = 1, 그 밖은 가장 큰 성분이 닿은 면이다.
function pictureToRoom(qx, qy) {
  const s = Math.max(Math.abs(qx), Math.abs(qy), 0.5)
  return [qx / s, qy / s, 1 / s - 1]
}

const band = (v, a, b) => v >= a && v <= b
// 주기 p 로 반복되는 선. 두께는 좌표 단위다
const lineAt = (v, p, width) => {
  const f = (((v / p) % 1) + 1) % 1
  return Math.min(f, 1 - f) * p < width / 2
}

// 방 넷. 면 함수가 null 을 돌려주면 그 방의 벽 색(벽지)을 쓴다.
//   back(x, y): 뒷벽, side(sx, w, y): 옆벽 (sx 는 -1 왼쪽, 1 오른쪽), floor(x, w), ceil(x, w)
const ROOMS = [
  // 0 사무실: 카펫 줄, 천장 격자, 화이트보드
  {
    wall: () => [0.8, 0.78, 0.72],
    floor(x) {
      return lineAt(x + 0.25, 0.5, 0.12) ? [0.33, 0.37, 0.43] : [0.42, 0.46, 0.52]
    },
    ceil(x, w) {
      return lineAt(x, 1 / 3, 0.025) || lineAt(w, 0.25, 0.02) ? [0.64, 0.64, 0.64] : [0.86, 0.86, 0.84]
    },
    back(x, y) {
      // 화이트보드: 회색 테두리 안에 흰 판, 파란 글씨 줄 몇 개
      if (band(x, -0.55, 0.55) && band(y, -0.1, 0.55)) {
        if (!band(x, -0.51, 0.51) || !band(y, -0.06, 0.51)) return [0.55, 0.56, 0.58]
        if (band(x, -0.4, 0.1) && (band(y, 0.33, 0.37) || band(y, 0.2, 0.24))) return [0.3, 0.42, 0.68]
        if (band(x, -0.4, 0.3) && band(y, 0.07, 0.11)) return [0.3, 0.42, 0.68]
        return [0.95, 0.96, 0.96]
      }
      // 낮은 책상 앞판
      if (band(x, -0.75, 0.75) && y < -0.5) return [0.36, 0.34, 0.31]
      return null
    },
    side(sx, w, y) {
      // 오른쪽 벽의 문, 왼쪽 벽의 게시판
      if (sx > 0 && band(w, 0.35, 0.65) && y < 0.45) return band(w, 0.58, 0.61) && band(y, -0.15, -0.05) ? [0.85, 0.8, 0.6] : [0.55, 0.4, 0.28]
      if (sx < 0 && band(w, 0.3, 0.7) && band(y, -0.1, 0.5)) return [0.62, 0.48, 0.33]
      return null
    },
  },
  // 1 거실: 마루, 줄무늬 벽지, 소파 실루엣
  {
    wall(along, y) {
      // 아래 징두리: 단색 판과 몰딩 한 줄. 위는 세로 줄무늬 벽지
      if (y < -0.35) return y > -0.39 ? [0.88, 0.84, 0.76] : [0.55, 0.42, 0.36]
      return lineAt(along, 0.25, 0.11) ? [0.71, 0.56, 0.49] : [0.78, 0.64, 0.55]
    },
    floor(x, w) {
      const plank = Math.floor((x + 1) * 4)
      if (lineAt(x + 1, 0.25, 0.02) || lineAt(w + hash(plank, 7) * 0.5, 0.5, 0.012)) return [0.33, 0.21, 0.12]
      const t = 0.9 + 0.12 * hash(plank, 3)
      return [0.58 * t, 0.38 * t, 0.22 * t]
    },
    ceil() {
      return [0.9, 0.87, 0.8]
    },
    back(x, y) {
      // 소파: 팔걸이, 등받이, 방석 두 칸
      const sofa = [0.26, 0.33, 0.44]
      if (band(x, -0.75, 0.75) && band(y, -1, -0.38) && !band(x, -0.62, 0.62)) return sofa
      if (band(x, -0.62, 0.62) && band(y, -1, -0.15)) {
        if (y < -0.52) return Math.abs(x) < 0.015 || band(y, -0.56, -0.52) ? [0.19, 0.24, 0.33] : [0.3, 0.38, 0.5]
        return sofa
      }
      // 그림 액자
      if (band(x, -0.3, 0.3) && band(y, 0.08, 0.5)) {
        if (!band(x, -0.26, 0.26) || !band(y, 0.12, 0.46)) return [0.3, 0.22, 0.15]
        return y < 0.24 ? [0.42, 0.55, 0.38] : [0.62, 0.74, 0.8]
      }
      return null
    },
    side(sx, w, y) {
      // 왼쪽 벽의 책장: 어두운 틀, 선반 줄, 칸마다 다른 책 색과 높이
      if (sx < 0 && band(w, 0.25, 0.75) && y < 0.6) {
        if (!band(w, 0.27, 0.73) || lineAt(y + 1, 0.4, 0.04)) return [0.32, 0.22, 0.15]
        const slot = Math.floor(w * 18)
        const shelf = Math.floor((y + 1) / 0.4)
        const books = [[0.62, 0.22, 0.18], [0.24, 0.38, 0.52], [0.72, 0.62, 0.38], [0.3, 0.45, 0.3]]
        const top = shelf * 0.4 - 1 + 0.3 - 0.08 * hash(slot, shelf)
        return y < top ? books[Math.floor(hash(slot, shelf + 11) * 4)] : [0.2, 0.14, 0.1]
      }
      return null
    },
  },
  // 2 상점: 체커 타일, 벽 선반과 상품
  {
    wall: () => [0.92, 0.92, 0.9],
    floor(x, w) {
      return (Math.floor((x + 1) * 4) + Math.floor(w * 8)) % 2 ? [0.86, 0.84, 0.8] : [0.3, 0.3, 0.32]
    },
    ceil() {
      return [0.95, 0.95, 0.93]
    },
    shelves(along, y, seed) {
      // 선반 판 세 줄과 그 위의 상품 상자. 상자 폭은 같고 높이와 색만 칸마다 다르다
      const levels = [-0.5, -0.05, 0.4]
      const goods = [[0.82, 0.32, 0.25], [0.95, 0.75, 0.3], [0.3, 0.55, 0.75], [0.4, 0.68, 0.42], [0.9, 0.9, 0.86]]
      for (let k = 0; k < levels.length; k++) {
        const s = levels[k]
        if (band(y, s - 0.05, s)) return [0.45, 0.33, 0.24]
        if (band(y, s, s + 0.36)) {
          const slot = Math.floor(along / 0.14)
          const h = 0.18 + 0.15 * hash(slot, k + seed)
          if (y < s + h && !lineAt(along, 0.14, 0.025)) return goods[Math.floor(hash(slot + 5, k * 3 + seed) * goods.length)]
        }
      }
      return null
    },
    back(x, y) {
      return band(x, -0.85, 0.85) ? this.shelves(x + 1, y, 1) : null
    },
    side(sx, w, y) {
      return band(w, 0.15, 0.9) ? this.shelves(w * 2, y, sx > 0 ? 20 : 40) : null
    },
  },
  // 3 빈 방: 콘크리트, 거푸집 줄, 바닥 줄눈, 뒷벽의 어두운 출입구
  {
    wall: () => [0.6, 0.6, 0.58],
    floor(x, w) {
      return Math.abs(x) < 0.012 || Math.abs(w - 0.5) < 0.008 ? [0.36, 0.36, 0.35] : [0.47, 0.46, 0.44]
    },
    ceil(x) {
      return lineAt(x + 1, 0.5, 0.015) ? [0.56, 0.56, 0.55] : [0.66, 0.66, 0.64]
    },
    back(x, y) {
      if (band(x, 0.3, 0.72) && y < 0.3) return [0.16, 0.16, 0.17]
      return lineAt(y + 1, 0.5, 0.015) ? [0.53, 0.53, 0.51] : null
    },
    side(sx, w, y) {
      return lineAt(y + 1, 0.5, 0.015) ? [0.53, 0.53, 0.51] : null
    },
  },
]

// 면마다 빛 받는 양이 조금 달라야 상자로 읽힌다. 창에서 멀수록(깊을수록) 조금 어둡다
const FACE_SHADE = { back: 1, side: 0.86, floor: 0.8, ceil: 0.94 }

function shadeRoom(room, qx, qy) {
  const [x, y, w] = pictureToRoom(qx, qy)
  const m = Math.max(Math.abs(qx), Math.abs(qy))
  let face
  let color
  if (m <= 0.5) {
    face = 'back'
    color = room.back(x, y)
  } else if (Math.abs(qx) >= Math.abs(qy)) {
    face = 'side'
    color = room.side(Math.sign(qx), w, y)
  } else if (qy < 0) {
    face = 'floor'
    color = room.floor(x, w)
  } else {
    face = 'ceil'
    color = room.ceil(x, w)
  }
  // 벽지 줄무늬는 뒷벽에서 x, 옆벽에서 깊이 방향으로 같은 간격이 되게 잰다 (방 깊이 1 = 칸 폭일 때)
  color ??= room.wall(face === 'back' ? x : w * 2, y)
  const k = FACE_SHADE[face] * (1 - 0.25 * w)
  return color.map(c => c * k)
}

function sampleAtlas(px, py) {
  // px, py: 텍스처 좌표의 픽셀 위치 (py 는 아래가 0)
  const col = Math.min(1, Math.floor(px / CELL))
  const row = Math.min(1, Math.floor(py / CELL))
  // 여백은 그림 가장자리 값을 이어 칠한다
  const qx = Math.max(-1, Math.min(1, ((px - col * CELL - PAD) / SPAN) * 2 - 1))
  const qy = Math.max(-1, Math.min(1, ((py - row * CELL - PAD) / SPAN) * 2 - 1))
  return shadeRoom(ROOMS[col + row * 2], qx, qy)
}

export default {
  file: 'Assets/Shaders/interior-room-mapping/InteriorRooms.png',
  size: SIZE,
  shade(u, v) {
    // 2×2 부분 표본으로 면 경계의 계단을 줄인다. 부분 표본은 픽셀 안이라 칸(여백)을 넘지 않는다
    const px = u * SIZE
    const py = (1 - v) * SIZE
    const sum = [0, 0, 0]
    for (const [ox, oy] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) {
      const c = sampleAtlas(px + ox, py + oy)
      for (let i = 0; i < 3; i++) sum[i] += c[i] / 4
    }
    return sum.map(clamp01)
  },
}
