import { SPECIMENS } from '../core/registry'
import { buildProgram, compileProgram, type StagePass } from './glsl'
import { getShaderStage } from './ShaderStage'

/* 자동 검사용 창구 (tools/check.mjs 가 헤드리스 Chrome 에서 호출). 사용자 화면에는 영향이 없다. */
declare global {
  interface Window {
    __sgCompileAll?: () => { id: string; variant: string; errors: string[] }[]
    __sgStage?: () => { frames: number; error: string | null } | null
    __sgShadow?: () => { coverage: number; area: number } | null
  }
}

const passes = (stage: { outline?: boolean; occluded?: boolean }): StagePass[] => [
  'body',
  ...(stage.outline ? (['outline'] as const) : []),
  ...(stage.occluded ? (['occluded'] as const) : []),
]

window.__sgCompileAll = () => {
  const gl = document.createElement('canvas').getContext('webgl2')
  if (!gl) return [{ id: '(전체)', variant: 'webgl2', errors: ['WebGL2 를 쓸 수 없습니다'] }]
  return SPECIMENS.flatMap(s =>
    [false, true].flatMap(off =>
      passes(s.meta.stage).map(pass => ({
        id: s.meta.id,
        variant: `${off ? 'SG_OFF' : 'final'}${pass === 'outline' ? '+SG_OUTLINE' : pass === 'occluded' ? '+SG_OCCLUDED' : ''}`,
        errors: compileProgram(gl, buildProgram(s.meta, s.core, off, pass)),
      })),
    ),
  )
}

window.__sgShadow = () => getShaderStage()?.probeShadow() ?? null

window.__sgStage = () => {
  const stage = getShaderStage()
  return stage && { frames: stage.framesRendered, error: stage.lastError }
}
