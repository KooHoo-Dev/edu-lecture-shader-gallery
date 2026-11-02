import type { StageEvent } from '../core/types'

export function PlayBar(p: {
  playing: boolean
  onPlaying: (v: boolean) => void
  speed: number
  speeds: number[]
  onSpeed: (v: number) => void
  off: boolean
  onOff: (v: boolean) => void
  autoplay: boolean
  onAutoplay: (v: boolean) => void
  events: StageEvent[]
  onEvent: (id: string) => void
  onStep: (dir: 1 | -1) => void
  stepLabel: string
}) {
  return (
    <div className="playbar" role="toolbar" aria-label="무대 조작">
      <div className="pb-group">
        <button className="btn btn-icon btn-primary" onClick={() => p.onPlaying(!p.playing)} aria-label={p.playing ? '일시정지 (Space)' : '재생 (Space)'} title="Space">
          {p.playing ? '❚❚' : '▶'}
        </button>
        <div className="seg seg-sm" role="radiogroup" aria-label="배속 (S)">
          {[...p.speeds].sort((a, b) => a - b).map(s => (
            <button key={s} role="radio" aria-checked={p.speed === s} onClick={() => p.onSpeed(s)} title="S">
              {s}×
            </button>
          ))}
        </div>
      </div>

      {p.events.length > 0 && (
        <div className="pb-group pb-events" role="group" aria-label="이벤트">
          {p.events.map((e, i) => (
            <button key={e.id} className="btn btn-event" onClick={() => p.onEvent(e.id)} title={`단축키 ${i + 1}`}>
              <kbd>{i + 1}</kbd> {e.label}
            </button>
          ))}
        </div>
      )}

      <div className="pb-group">
        <button className="btn btn-toggle" aria-pressed={p.off} data-bad={p.off || undefined} onClick={() => p.onOff(!p.off)} title="J: 효과를 끈 모습 또는 흔한 실수와 비교">
          {p.off ? '효과 꺼짐' : '효과 켜짐'} <kbd>J</kbd>
        </button>
        <button className="btn btn-toggle" aria-pressed={p.autoplay} onClick={() => p.onAutoplay(!p.autoplay)} title="A: 입력이 없어도 핵심 상황을 자동으로 재생">
          자동 데모 <kbd>A</kbd>
        </button>
      </div>

      <div className="pb-group pb-steps">
        <span className="pb-step-title">단계</span>
        <button className="btn btn-icon" onClick={() => p.onStep(-1)} aria-label="이전 단계 (←)">
          ‹
        </button>
        <span className="pb-step-label" aria-live="polite">
          {p.stepLabel}
        </span>
        <button className="btn btn-icon" onClick={() => p.onStep(1)} aria-label="다음 단계 (→)">
          ›
        </button>
      </div>
    </div>
  )
}
