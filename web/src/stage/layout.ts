/* 촬영 무대와 같은 배치. Assets/Editor/ShaderGallery/SgCapture.cs 와 숫자를 맞춘다.
 * 좌표는 Unity 기준으로 적고, three.js(오른손 좌표계)로 옮길 때 z 부호만 뒤집는다. 색은 sRGB. */

export const LAYOUT = {
  background: [0.035, 0.04, 0.055],
  spriteBackground: [0.1, 0.115, 0.15],
  floorA: [0.2, 0.22, 0.25],
  floorB: [0.15, 0.165, 0.195],
  floorTile: 0.5,
  floorSize: 16,
  propColor: [0.72, 0.62, 0.46],
  propColor2: [0.34, 0.5, 0.66],
  fullscreenBallColor: [0.62, 0.68, 0.76],
  ambient: [0.34, 0.38, 0.46],
  /** Quaternion.Euler(50, -30, 0) 의 반대 방향: 표면에서 광원 쪽 */
  lightDirUnity: [0.3214, 0.766, -0.5567],
  lightIntensity: 1.2,
  camera: { position: [0, 1.3, -3.6], target: [0, 0.75, 0], fov: 40, near: 0.1, far: 100 },
  sprite: { orthographicSize: 1.5, height: 2, cameraZ: -5 },
  /**
   * mesh 무대 물체의 시작 회전 (Unity Y 회전, 도). SgCapture.MeshYawDeg 와 같다. 촬영과 웹 첫 화면이 같고,
   * 정면만 보이면 큐브 같은 물체의 효과가 썸네일에 드러나지 않아 둔다. quad, plane 은 돌리지 않는다
   */
  meshYawDeg: 30,
  /** mesh 무대의 물체 배치. SgCapture.PlaceEffectMesh 와 같은 값 */
  meshPlacement: {
    sphere: { position: [0, 0.85, 0], scale: 1.5, shadow: 0.75 },
    // 캡슐과 원통은 높이 2 라 크기 1 이면 윗끝이 화면 밖으로 나간다
    capsule: { position: [0, 0.8, 0], scale: 0.8, shadow: 0.4 },
    cylinder: { position: [0, 0.8, 0], scale: 0.8, shadow: 0.4 },
    cube: { position: [0, 0.75, 0], scale: 1.2, shadow: 0.7 },
    quad: { position: [0, 0.85, 0], scale: 1.6, shadow: 0.1 },
    plane: { position: [0, 0.5, 0], scale: 0.3, shadow: 0 },
    grass: { position: [0, 0, 0], scale: 1.6, shadow: 0.6 },
  },
  /** depth 무대의 물체 배치. 같은 값이 SgCapture.PlaceEffectMesh 에 있다 */
  depthPlacement: {
    sphere: { position: [0, 0.55, 0], scale: 2.2 },
    capsule: { position: [0, 0.6, 0], scale: 1.4 },
    cylinder: { position: [0, 0.6, 0], scale: 1.4 },
    cube: { position: [0, 0.5, 0], scale: 1.6 },
    quad: { position: [0, 0.6, 0], scale: 2.4 },
    plane: { position: [0, 0.3, 0], scale: 0.35 },
    grass: { position: [0, 0, 0], scale: 1.4 },
  },
  /**
   * stage.occluded 의 벽 (Unity 큐브를 늘린 것). 카메라와 물체 사이에서 물체의 왼쪽 아래를 가린다.
   * 카메라에 더 가까워 화면에서는 크기보다 넓게 가린다. SgCapture.AddWall 과 같은 값
   */
  wall: { position: [-0.525, 0.55, -0.9], size: [1.15, 1.1, 0.1] },
  fullscreenBall: { position: [0, 0.75, 0], scale: 1.5 },
  box: { position: [0.95, 0.4, 0.3], scale: 0.8, rotationYDeg: 28 },
  ball: { position: [-1.1, 0.45, 0.5], scale: 0.9 },
} as const

export const toThree = (v: readonly number[]) => [v[0], v[1], -v[2]] as [number, number, number]

export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export const linear3 = (c: readonly number[]) => c.map(srgbToLinear) as [number, number, number]

export function hexToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [srgbToLinear(((n >> 16) & 255) / 255), srgbToLinear(((n >> 8) & 255) / 255), srgbToLinear((n & 255) / 255)]
}
