import { SPECIMENS } from '../core/registry'
import { buildProgram, compileProgram } from './glsl'
import { getShaderStage } from './ShaderStage'

/* 자동 검사용 창구 (tools/check.mjs 가 헤드리스 Chrome 에서 호출). 사용자 화면에는 영향이 없다. */
declare global {
  interface Window {
    __sgCompileAll?: () => { id: string; variant: string; errors: string[] }[]
    __sgStage?: () => { frames: number; error: string | null } | null
  }
}

window.__sgCompileAll = () => {
  const gl = document.createElement('canvas').getContext('webgl2')
  if (!gl) return [{ id: '(전체)', variant: 'webgl2', errors: ['WebGL2 를 쓸 수 없습니다'] }]
  return SPECIMENS.flatMap(s =>
    [false, true].map(off => ({
      id: s.meta.id,
      variant: off ? 'SG_OFF' : 'final',
      errors: compileProgram(gl, buildProgram(s.meta, s.core, off)),
    })),
  )
}

window.__sgStage = () => {
  const stage = getShaderStage()
  return stage && { frames: stage.framesRendered, error: stage.lastError }
}
