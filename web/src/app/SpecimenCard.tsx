import { useMemo, useState } from 'react'
import { prefersReducedMotion } from '../core/flash'
import { defaultParams, thumbnailOf } from '../core/params'
import { GROUPS, STAGE_KINDS } from '../core/taxonomy'
import type { PlannedSpecimen, Specimen } from '../core/types'
import { getShaderStage } from '../stage/ShaderStage'
import { StageView } from '../stage/StageView'
import { hrefSpecimen } from './router'

/** 공유 무대는 한 곳에만 붙으므로 실행 중인 카드도 하나뿐이다. 새 카드가 깨어나면 앞의 카드를 끈다 */
let sleepPrevious: (() => void) | null = null

/**
 * 갤러리 카드: 평소엔 Unity 실측 썸네일, 마우스를 올리거나 포커스하면 공유 무대로 실제 셰이더를 실행한다.
 * 표본 수가 늘어도 첫 화면이 느려지지 않고 WebGL 컨텍스트 제한에도 걸리지 않는다.
 */
export function SpecimenCard({ specimen }: { specimen: Specimen }) {
  const m = specimen.meta
  const [live, setLive] = useState(false)
  const values = useMemo(() => defaultParams(m.params), [m.params])
  const canRun = !prefersReducedMotion() && getShaderStage() !== null
  const thumb = thumbnailOf(specimen)
  const wake = () => {
    if (!canRun) return
    sleepPrevious?.()
    sleepPrevious = () => setLive(false)
    setLive(true)
  }

  return (
    <a
      className="card"
      href={hrefSpecimen(m.id)}
      onPointerEnter={wake}
      onPointerLeave={() => setLive(false)}
      onFocus={wake}
      onBlur={() => setLive(false)}
    >
      <div className="card-stage">
        {thumb ? <img src={thumb} alt={`${m.title} Unity 실측 화면`} loading="lazy" decoding="async" /> : <span className="card-noshot">촬영 전</span>}
        {live && (
          <div className="card-live">
            <StageView specimen={specimen} values={values} step={0} off={false} playing speed={1} auto />
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-tags">
          <span className="chip chip-sm" data-k={m.stage.kind}>
            {STAGE_KINDS[m.stage.kind].short}
          </span>
          <span className="stars" aria-label={`난이도 ${m.difficulty}`}>
            {'★'.repeat(m.difficulty)}
            <span aria-hidden className="stars-off">
              {'★'.repeat(3 - m.difficulty)}
            </span>
          </span>
        </div>
        <h3>{m.title}</h3>
        <p>{m.oneLiner}</p>
        {m.inspiredBy.length > 0 && <p className="card-inspired">Inspired by {m.inspiredBy.map(i => i.title).join(' · ')}</p>}
      </div>
    </a>
  )
}

export function PlannedCard({ p }: { p: PlannedSpecimen }) {
  return (
    <div className="card card-planned" aria-label={`${p.title} (제작 중)`}>
      <div className="card-stage card-stage-planned">
        <span className="planned-label">제작 중</span>
        <span className="planned-group" aria-hidden>
          {p.group} · {GROUPS[p.group].name}
        </span>
      </div>
      <div className="card-body">
        <div className="card-tags">
          <span className="chip chip-sm" data-k={p.kind}>
            {STAGE_KINDS[p.kind].short}
          </span>
        </div>
        <h3>{p.title}</h3>
        <p>{p.oneLiner}</p>
      </div>
    </div>
  )
}
