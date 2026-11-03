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
function toState(meta, name, values, { onlyGiven = false } = {}) {
  const state = { name, floats: [], colors: [] }
  for (const def of meta.params) {
    if (onlyGiven && !(def.key in values)) continue
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

/** 'a=1,b=x' 를 객체로. 숫자는 숫자로, true·false 는 참거짓으로 읽는다 (웹 링크의 s.<옵션>, p.<속성> 과 같은 쓰임) */
export function parsePairs(text) {
  if (!text) return {}
  const parse = v => (v === 'true' ? true : v === 'false' ? false : v !== '' && Number.isFinite(Number(v)) ? Number(v) : v)
  return Object.fromEntries(text.split(',').filter(Boolean).map(pair => {
    const at = pair.indexOf('=')
    if (at < 1) throw new Error(`키=값 형식이 아닙니다: ${pair}`)
    return [pair.slice(0, at), parse(pair.slice(at + 1))]
  }))
}

/**
 * stage: meta.stage 위에 덮어쓰는 무대 옵션 (검증용, 예: { mesh: 'torus', tilt: -60 }).
 * set: 모든 촬영 상태에 덮어쓰는 조절 값 (예: { _Speed: 0 }). 시간으로 움직이는 무늬를 멈춰 웹과 비교할 때 쓴다
 */
export async function buildJob(root, ids, { outDir, capture, stage = {}, set = {} }) {
  const all = specimenIds(root)
  const chosen = ids.length ? ids : all
  const specimens = []
  for (const id of chosen) {
    if (!all.includes(id)) throw new Error(`표본 메타가 없습니다: ${id}`)
    const loaded = await loadMeta(root, id)
    const meta = { ...loaded, stage: { ...loaded.stage, ...stage } }
    for (const key of Object.keys(set)) if (!meta.params.some(d => d.key === key)) throw new Error(`${id} 에 없는 조절 값입니다: ${key}`)
    const states = [{ name: 'default', values: {} }, ...(meta.captures ?? [])].map(c => toState(meta, c.name, { ...c.values, ...set }))
    const layers = (meta.stage.layers ?? []).map(layer => {
      const { floats, colors } = toState(meta, 'layer', layer.values, { onlyGiven: true })
      return { x: layer.position?.[0] ?? 0, y: layer.position?.[1] ?? 0, floats, colors }
    })
    const textures = Object.entries(meta.stage.textures ?? {}).map(([k, t]) => ({
      k,
      path: `Assets/Shaders/${id}/${t.file}`,
      linear: Boolean(t.linear),
      repeat: Boolean(t.repeat),
      point: Boolean(t.point),
    }))
    specimens.push({ id, shader: `Assets/Shaders/${id}/${meta.shaderFile}`, stage: meta.stage.kind, mesh: meta.stage.mesh ?? 'sphere', occluder: Boolean(meta.stage.occluded), backlit: Boolean(meta.stage.backlit), ui: Boolean(meta.stage.ui), uiAspect: meta.stage.uiAspect ?? 1, layers, shadowProp: Boolean(meta.stage.shadowProp), tilt: meta.stage.tilt ?? 0, bright: Boolean(meta.stage.bright), requires: meta.requires ?? [], textures, states })
  }
  return { outDir: outDir.replaceAll('\\', '/'), width: 1280, height: 720, capture, specimens }
}
