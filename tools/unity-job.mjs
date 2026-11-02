// 표본 메타 데이터(web/src/specimens/<id>/meta.ts)에서 Unity 검증·촬영 잡을 만든다.
// meta.ts 는 타입만 import 하므로 Node 가 그대로 읽는다.

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export function specimenIds(root) {
  const dir = join(root, 'web', 'src', 'specimens')
  return existsSync(dir) ? readdirSync(dir).filter(d => existsSync(join(dir, d, 'meta.ts'))) : []
}

export async function loadMeta(root, id) {
  const url = pathToFileURL(join(root, 'web', 'src', 'specimens', id, 'meta.ts')).href
  return (await import(url)).meta
}

/** 메타의 촬영 상태 하나를 잡 형식으로 바꾼다. 색은 Unity Color 와 같이 sRGB 0~1 로 넘긴다. */
function toState(meta, name, values) {
  const state = { name, floats: [], colors: [] }
  for (const def of meta.params) {
    const value = values[def.key] ?? def.default
    if (def.type === 'color') {
      const n = parseInt(value.slice(1), 16)
      state.colors.push({ k: def.key, r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 })
    } else if (def.type === 'toggle') {
      state.floats.push({ k: def.key, v: value ? 1 : 0 })
    } else if (def.type === 'select') {
      state.floats.push({ k: def.key, v: Number(value) })
    } else {
      state.floats.push({ k: def.key, v: value })
    }
  }
  return state
}

export async function buildJob(root, ids, { outDir, capture }) {
  const all = specimenIds(root)
  const chosen = ids.length ? ids : all
  const specimens = []
  for (const id of chosen) {
    if (!all.includes(id)) throw new Error(`표본 메타가 없습니다: ${id}`)
    const meta = await loadMeta(root, id)
    const states = [{ name: 'default', values: {} }, ...(meta.captures ?? [])].map(c => toState(meta, c.name, c.values))
    const textures = Object.entries(meta.stage.textures ?? {}).map(([k, t]) => ({
      k,
      path: `Assets/Shaders/${id}/${t.file}`,
      linear: Boolean(t.linear),
      repeat: Boolean(t.repeat),
      point: Boolean(t.point),
    }))
    specimens.push({ id, shader: `Assets/Shaders/${id}/${meta.shaderFile}`, stage: meta.stage.kind, mesh: meta.stage.mesh ?? 'sphere', occluder: Boolean(meta.stage.occluded), textures, states })
  }
  return { outDir: outDir.replaceAll('\\', '/'), width: 1280, height: 720, capture, specimens }
}
