// 팔레트 스왑용 팔레트. 가로 8칸이 색 번호(0~7), 세로 8줄이 팔레트 하나씩이다. 위쪽 줄이 0번 줄.
// 색이라 sRGB 로 저장하고 포인트 필터로 읽는다.
//
// 한 칸을 4x4 텍셀로 키워 32x32 로 만든다. 압축 대책이 아니므로 Unity 에서는 Compression None 으로 임포트한다.
// 셰이더는 칸 가운데를 읽으므로 텍셀 수와 상관없이 '칸 수'만 맞으면 된다.

// 칸 순서: 외곽선, 옷 그림자, 옷, 옷 밝은 면, 머리카락, 피부, 보조색, 눈 하이라이트
const ROWS = [
  // 0 기본: 파랑 옷, 주황 보조색
  // 외곽선은 갤러리 무대 배경(짙은 남색)과 구분되도록 거의 검정으로 둔다.
  ['#0c0a10', '#29366f', '#3b5dc9', '#73a7f0', '#6b3a1f', '#f4c9a0', '#f2a33a', '#ffffff'],
  // 1 빨강 팀
  ['#0c0a10', '#7a1f2b', '#c0392b', '#f07a6a', '#6b3a1f', '#f4c9a0', '#f4d35e', '#ffffff'],
  // 2 초록 팀
  ['#0c0a10', '#1f5a3a', '#2e8b57', '#7fd38f', '#3a2a1a', '#e8b88a', '#e9e4c2', '#ffffff'],
  // 3 정예 적: 보라 옷, 흰 머리, 붉은 보조색, 노란 눈
  ['#08060e', '#3d1f5a', '#6a3fa0', '#b28ce6', '#e6e6ee', '#c9b2aa', '#ff4d6d', '#ffe14d'],
  // 4 밤: 같은 캐릭터를 어둡고 푸르게
  ['#05060c', '#161f4a', '#213478', '#3e5f9e', '#2a2238', '#7d7f9e', '#7a6450', '#c6d4ff'],
  // 5 노을: 붉고 따뜻하게
  ['#2a1418', '#5a2a4a', '#9a4a6a', '#e08a7a', '#8a3a1a', '#ffb68a', '#ffd05a', '#fff0d0'],
  // 6 석화: 채도 없는 돌색
  ['#121110','#4d4a42', '#77736a', '#a6a196', '#5e5a52', '#bdb8ad', '#8a857a', '#e0dcd2'],
  // 7 피격: 몸은 흰색과 연분홍, 외곽선과 눈은 빨갛게
  ['#b0202a', '#ffd0d0', '#ffffff', '#ffffff', '#ffe0e0', '#ffffff', '#ffd0d0', '#b0202a'],
]

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)

export default {
  file: 'Assets/Shaders/palette-swap-lut/PaletteSwapLutPalette.png',
  size: 32,
  shade(u, v) {
    return hex(ROWS[Math.floor(v * ROWS.length)][Math.floor(u * 8)])
  },
}
