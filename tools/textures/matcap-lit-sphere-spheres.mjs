// 매트캡 세 장을 한 텍스처의 R·G·B 채널에 회색조로 담는다. 셰이더가 채널 하나를 골라 읽는다.
//   R 점토: 왼쪽 위 앞에서 오는 빛의 부드러운 확산 + 흐린 하이라이트
//   G 툰: 같은 빛을 3 단으로 끊은 음영
//   B 크롬: 위는 밝은 하늘, 수평선 근처 급한 띠, 아래는 어두운 땅, 작은 날카로운 반사점
// 원판 좌표 (x, y) 는 텍스처 가운데가 0, 가장자리가 ±1, y 는 위쪽이 + 다. 그 점의 법선은 n = (x, y, sqrt(1 - x² - y²)),
// z 가 카메라 쪽이다. 셰이더가 읽는 가장 큰 반지름(0.98) 바깥 텍셀은 그 반지름의 값을 늘여 칠한다
// (Bilinear 와 밉이 윤곽에 검은 테나 밝은 테를 끌어오지 않게).
// 회색조 값을 채널에 담은 데이터라 sRGB 를 끄고 읽으며, 빛의 세기 그대로(선형) 저장한다.
// (그림으로 받은 컬러 매트캡 한 장은 sRGB 로 부호화된 색이라 반대로 sRGB 를 켜고 읽는다.)
import { smoothstep } from '../lib/texture-kit.mjs'

const norm = ([x, y, z]) => {
  const l = Math.hypot(x, y, z)
  return [x / l, y / l, z / l]
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

// 왼쪽 위 앞에서 오는 빛, 오른쪽 아래의 약한 반사광, 하이라이트용 반벡터
const KEY = norm([-0.55, 0.6, 0.6])
const BOUNCE = norm([0.5, -0.6, 0.4])
const HALF = norm([KEY[0], KEY[1], KEY[2] + 1])
// 크롬 반사점(해)도 왼쪽 위
const SUN = norm([-0.45, 0.75, 0.5])

function clay(n) {
  // 화면에 나갈 때 sRGB 로 밝아지므로 선형 값은 어두운 쪽을 낮게 잡아야 그늘이 산다
  const wrap = Math.max(0, (dot(n, KEY) + 0.2) / 1.2)
  const spec = Math.pow(Math.max(0, dot(n, HALF)), 40)
  return 0.012 + 0.82 * Math.pow(wrap, 2.2) + 0.05 * Math.max(0, dot(n, BOUNCE)) + 0.22 * spec
}

function toon(n) {
  const d = dot(n, KEY)
  // 경계는 텍셀 1~2 개 폭으로만 부드럽게 해 Bilinear 에서 계단이 지지 않게 한다
  const lit = smoothstep(0.53, 0.57, d)
  const mid = smoothstep(-0.02, 0.02, d)
  return 0.06 + 0.24 * mid + 0.6 * lit
}

function chrome(n) {
  // 카메라 쪽 시선(0, 0, 1)을 법선으로 반사한 방향
  const r = [2 * n[2] * n[0], 2 * n[2] * n[1], 2 * n[2] * n[2] - 1]
  // 수평선을 조금 아래로 내려 하늘이 더 넓게 비치게 한다
  const h = r[1] + 0.12
  // 하늘은 수평선 0.45 에서 꼭대기 0.75 로 짙어지는 그라데이션. 평평하게 밝으면 흰 플라스틱처럼 보인다
  const sky = 0.45 + 0.3 * smoothstep(0, 1, h)
  // 땅은 거의 검게. 금속은 밝고 어두운 반사의 대비가 커야 금속으로 읽힌다
  const ground = 0.012 + 0.05 * smoothstep(-0.1, -1.1, h)
  const horizon = smoothstep(-0.02, 0.02, h)
  // 수평선 바로 위의 밝은 띠 (하늘보다 조금 밝게, 해보다는 어둡게)
  const glow = 0.3 * Math.exp(-(((h - 0.03) / 0.05) ** 2)) * horizon
  const base = ground + (sky - ground) * horizon + glow
  // 작은 해 반사점은 1.0 까지 올린다. 주변 하늘(약 0.7)과 차이가 커야 날카로운 점으로 보인다
  const sun = smoothstep(0.988, 0.996, dot(norm(r), SUN))
  return base + (1 - base) * sun
}

export default {
  file: 'Assets/Shaders/matcap-lit-sphere/MatcapSpheres.png',
  // PNG 는 HTML 에 그대로 들어간다. 매끈한 그라데이션이라 128 이면 충분하다.
  size: 128,
  shade(u, v) {
    let x = u * 2 - 1
    let y = 1 - v * 2
    const r = Math.hypot(x, y)
    // 셰이더는 반지름 0.98 (MATCAP_DISK_SCALE 0.49 / 0.5) 까지만 읽는다. 그 바깥은 같은 방향 0.98 의 값으로 채운다.
    // 0.999 처럼 원판 끝까지 그리면 크롬의 수평선 띠가 끝에서 한 텍셀보다 얇은 밝은 고리가 되고,
    // 그 값이 바깥 전체로 늘어나 Bilinear 와 밉이 윤곽에 밝은 테를 끌어온다.
    if (r > 0.98) {
      x *= 0.98 / r
      y *= 0.98 / r
    }
    const n = [x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y))]
    return [clay(n), toon(n), chrome(n)]
  },
}
