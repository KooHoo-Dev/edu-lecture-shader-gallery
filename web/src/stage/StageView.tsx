import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { ParamValues, Specimen } from '../core/types'
import { thumbnailOf } from '../core/params'
import { getShaderStage } from './ShaderStage'

export interface StageViewHandle {
  /** 이벤트를 한 번 재생 */
  fire: (id: string) => void
  /** 현재 화면을 PNG 로 */
  capture: () => Promise<Blob | null>
}

interface Props {
  specimen: Specimen
  values: ParamValues
  step: number
  off: boolean
  playing: boolean
  speed: number
  auto: boolean
  /** 무대 시간의 시작값 (초). 붙일 때만 쓴다 */
  startTime?: number
  onLive?: (key: string, value: number | null) => void
  /** 상세 페이지에서 무대 위에 상태 배지를 표시 */
  children?: React.ReactNode
}

/** 공유 무대를 이 자리에 붙인다. WebGL2 가 없으면 Unity 실측 이미지로 대체한다 */
export const StageView = forwardRef<StageViewHandle, Props>(function StageView({ specimen, values, step, off, playing, speed, auto, startTime, onLive, children }, ref) {
  const host = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const stage = getShaderStage()
  const settings = { values, step, off, playing, speed, auto, startTime }
  const live = useRef(onLive)
  live.current = onLive

  useImperativeHandle(
    ref,
    () => ({
      fire: id => stage?.fire(id),
      capture: () => stage?.capture() ?? Promise.resolve(null),
    }),
    [stage],
  )

  useEffect(() => {
    if (!stage) return
    const el = host.current!
    setError(null)
    stage.mount(el, specimen, settings, { onError: setError, onLive: (k, v) => live.current?.(k, v) })
    const io = new IntersectionObserver(([e]) => stage.setVisible(e.isIntersecting), { threshold: 0.01 })
    io.observe(el)
    return () => {
      io.disconnect()
      stage.unmount(el)
    }
    // 표본이 바뀔 때만 다시 붙인다. 값 변경은 아래 update 가 맡는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, specimen])

  useEffect(() => {
    stage?.update(settings)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, values, step, off, playing, speed, auto])

  return (
    <div className="stage" data-stage-kind={specimen.meta.stage.kind}>
      <div ref={host} className="stage-host" />
      {!stage && thumbnailOf(specimen) && <img className="stage-fallback" src={thumbnailOf(specimen)} alt={`${specimen.meta.title} Unity 실측 화면`} />}
      {!stage && <p className="stage-note">이 PC에서 WebGL2 를 쓸 수 없어 Unity 실측 이미지를 표시합니다.</p>}
      {error && (
        <div className="stage-error" role="alert">
          <b>셰이더 컴파일 실패</b>
          <pre>{error}</pre>
        </div>
      )}
      {children}
    </div>
  )
})
