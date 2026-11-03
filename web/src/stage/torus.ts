import * as THREE from 'three'

/* 고리 메시 (stage.mesh = 'torus'). Assets/Editor/ShaderGallery/SgTorus.cs 와 같은 계산으로 같은 메시를 만든다.
 * 볼록하지 않은 메시 시험용이다. 고리가 XY 평면에 서 있어 Y 축으로 돌면 고리의 앞뒤가 화면에서 겹친다.
 * 좌표는 Unity 기준으로 만들고 three.js 로 옮길 때 z 부호만 뒤집는다. 그래서 삼각형 감는 순서가 C# 과 반대다.
 * uv.x 는 고리를 도는 방향(0~1), uv.y 는 관을 도는 방향(0~1)이다 (three.js TorusGeometry 와 같다). */

export const TORUS = { radius: 0.35, tube: 0.15, rings: 48, sides: 24 } as const

export function torusGeometry(): THREE.BufferGeometry {
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let j = 0; j <= TORUS.sides; j++) {
    const v = (j / TORUS.sides) * Math.PI * 2
    for (let i = 0; i <= TORUS.rings; i++) {
      const u = (i / TORUS.rings) * Math.PI * 2
      const nx = Math.cos(v) * Math.cos(u)
      const ny = Math.cos(v) * Math.sin(u)
      const nz = Math.sin(v)
      positions.push(TORUS.radius * Math.cos(u) + TORUS.tube * nx, TORUS.radius * Math.sin(u) + TORUS.tube * ny, -TORUS.tube * nz)
      normals.push(nx, ny, -nz)
      uvs.push(i / TORUS.rings, j / TORUS.sides)
    }
  }
  const row = TORUS.rings + 1
  for (let j = 1; j <= TORUS.sides; j++) {
    for (let i = 1; i <= TORUS.rings; i++) {
      const a = row * j + i - 1
      const b = row * (j - 1) + i - 1
      const c = row * (j - 1) + i
      const d = row * j + i
      indices.push(a, d, b, b, d, c)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return geometry
}
