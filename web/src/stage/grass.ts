import * as THREE from 'three'

/* 풀 다발 메시 (stage.mesh = 'grass'). Assets/Editor/ShaderGallery/SgGrass.cs 와 같은 계산으로 같은 메시를 만든다.
 * 좌표는 Unity 기준으로 만들고 three.js 로 옮길 때 z 부호만 뒤집는다. 뿌리가 y = 0, uv.y 는 뿌리 0 에서 끝 1 이다. */

export const GRASS = { blades: 36, segments: 5, radius: 0.45 } as const

/** 31비트 선형 합동 생성기. C# 쪽과 비트 단위로 같은 수열을 낸다 */
function random(seed: number) {
  let s = seed
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff
    return s / 2147483648
  }
}

export function grassGeometry(): THREE.BufferGeometry {
  const next = random(20261102)
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let b = 0; b < GRASS.blades; b++) {
    const r = GRASS.radius * Math.sqrt(next())
    const a = Math.PI * 2 * next()
    const height = 0.7 + 0.5 * next()
    const width = 0.06 + 0.03 * next()
    const yaw = Math.PI * 2 * next()
    const lean = 0.15 * next()
    const baseX = r * Math.cos(a)
    const baseZ = r * Math.sin(a)
    const right = [Math.cos(yaw), 0, Math.sin(yaw)]
    const forward = [-Math.sin(yaw), 0, Math.cos(yaw)]
    const first = positions.length / 3
    for (let j = 0; j <= GRASS.segments; j++) {
      const t = j / GRASS.segments
      const half = width * 0.5 * (1 - 0.9 * t)
      const bend = lean * height * t * t
      for (const side of [-1, 1]) {
        const x = baseX + right[0] * half * side + forward[0] * bend
        const y = height * t
        const z = baseZ + right[2] * half * side + forward[2] * bend
        positions.push(x, y, -z)
        normals.push(forward[0], 0, -forward[2])
        uvs.push(side < 0 ? 0 : 1, t)
      }
    }
    for (let j = 0; j < GRASS.segments; j++) {
      const i = first + j * 2
      indices.push(i, i + 2, i + 1, i + 1, i + 2, i + 3)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return geometry
}
