import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../core/flash'
import { applyOverrides, applyPreset, defaultParams } from '../core/params'
import { findSpecimen, PLANNED, SPECIMENS } from '../core/registry'
import { GROUPS, STAGE_KINDS } from '../core/taxonomy'
import type { ParamValues, Specimen } from '../core/types'
import { StageView, type StageViewHandle } from '../stage/StageView'
import { AiKit } from './AiKit'
import { isTyping } from './App'
import { ControlPanel, type ControlPanelHandle } from './ControlPanel'
import { PlayBar } from './PlayBar'
import { Rich } from './Rich'
import { hrefSpecimen, type SpecimenUrlOptions } from './router'

const SPEEDS = [1, 0.5, 0.25]

export function SpecimenPage({ id, presetId, opts, presenter }: { id: string; presetId?: string; opts: SpecimenUrlOptions; presenter: boolean }) {
  const specimen = findSpecimen(id)
  if (!specimen) {
    return (
      <div className="notfound">
        <h1>표본을 찾을 수 없습니다</h1>
        <p>
          <code>{id}</code>: 주소가 바뀌었거나 아직 제작 중인 표본입니다. <a href="#/">갤러리로 돌아가기</a>
        </p>
      </div>
    )
  }
  return <SpecimenView specimen={specimen} presetId={presetId} opts={opts} presenter={presenter} />
}

function SpecimenView({ specimen, presetId, opts, presenter }: { specimen: Specimen; presetId?: string; opts: SpecimenUrlOptions; presenter: boolean }) {
  const m = specimen.meta
  const initialPreset = m.presets.find(p => p.id === presetId)
  const [params, setParams] = useState<ParamValues>(() =>
    applyOverrides(m.params, initialPreset ? applyPreset(m.params, initialPreset) : defaultParams(m.params), opts.params),
  )
  const [presetActive, setPresetActive] = useState<string | null>(initialPreset?.id ?? null)
  // ?t= 로 시간을 정했으면 그 순간에 멈춘 채 시작한다
  const [playing, setPlaying] = useState(opts.time === undefined)
  const [off, setOff] = useState(opts.off ?? false)
  const [speed, setSpeed] = useState(opts.speed ?? 1)
  const loopKeys = new Set(m.demo?.loops?.map(t => t.key))
  const touchesLoop = (keys: string[]) => keys.some(k => loopKeys.has(k))
  // 자동 데모가 움직이는 값을 링크나 프리셋으로 정했으면 데모가 덮어쓰지 않게 끈다
  const [autoplay, setAutoplay] = useState(
    () => opts.auto ?? (!prefersReducedMotion() && !opts.event && !opts.step && !touchesLoop([...Object.keys(opts.params ?? {}), ...Object.keys(initialPreset?.values ?? {})])),
  )
  const [step, setStep] = useState(opts.step && m.steps.some(s => s.n === opts.step) ? opts.step : 0)
  const [tab, setTab] = useState<'controls' | 'steps'>(opts.step ? 'steps' : 'controls')
  const stage = useRef<StageViewHandle>(null)
  const panel = useRef<ControlPanelHandle>(null)

  const fire = useCallback((id: string) => stage.current?.fire(id), [])

  // ?event=<id> : 페이지가 열리고 잠시 뒤 이벤트를 한 번 발생 (수업 자료 링크·자동 검사용)
  useEffect(() => {
    if (!opts.event) return
    const t = setTimeout(() => fire(opts.event!), 400)
    return () => clearTimeout(t)
  }, [opts.event, fire])

  const stepBy = useCallback(
    (dir: 1 | -1) => {
      setTab('steps')
      setStep(cur => {
        // 0 은 최종 화면. 순서: 1 -> 2 -> ... -> 최종
        const order = [...m.steps.map(s => s.n), 0]
        const i = order.indexOf(cur)
        return order[(i + dir + order.length) % order.length]
      })
    },
    [m.steps],
  )

  // 수업용 단축키
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return
      // e.key 는 한글 입력 상태에서 'Process' 가 되므로 키 위치(e.code)로 판단한다
      const code = e.code
      const digit = /^(?:Digit|Numpad)([1-9])$/.exec(code)
      if (code === 'Space' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault()
        setPlaying(v => !v)
      } else if (code === 'KeyJ') setOff(v => !v)
      else if (code === 'KeyS') setSpeed(s => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])
      else if (code === 'KeyA') setAutoplay(v => !v)
      else if (code === 'ArrowRight' && !(e.target instanceof HTMLInputElement)) stepBy(1)
      else if (code === 'ArrowLeft' && !(e.target instanceof HTMLInputElement)) stepBy(-1)
      else if (digit) {
        const ev = m.events[Number(digit[1]) - 1]
        if (ev) fire(ev.id)
      }
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [fire, stepBy, m.events])

  const idx = SPECIMENS.findIndex(s => s.meta.id === m.id)
  const prev = SPECIMENS[idx - 1]
  const next = SPECIMENS[idx + 1]
  const activeStep = m.steps.find(s => s.n === step)
  const stepPosition = activeStep ? `${m.steps.indexOf(activeStep) + 1} / ${m.steps.length + 1}` : `${m.steps.length + 1} / ${m.steps.length + 1}`

  return (
    <article className="specimen" data-presenter={presenter || undefined}>
      <header className="spec-head">
        <a className="back" href="#/">
          ← 갤러리
        </a>
        <div className="spec-title">
          <p className="eyebrow">
            {m.group} · {GROUPS[m.group].name}
          </p>
          <h1>
            {m.title} <span className="en">{m.titleEn}</span>
          </h1>
          <p className="lead">{m.oneLiner}</p>
        </div>
        <div className="spec-tags">
          <span className="chip" data-k={m.stage.kind} title={STAGE_KINDS[m.stage.kind].desc}>
            {STAGE_KINDS[m.stage.kind].name}
          </span>
          {m.tags.map(t => (
            <span key={t} className="chip chip-outline">
              {t}
            </span>
          ))}
          <span className="chip chip-outline">난이도 {'★'.repeat(m.difficulty)}</span>
          <span className="chip chip-outline">Unity 6.3 · URP 17.3</span>
          {m.requires?.includes('depth') && <span className="chip chip-warn">Depth Texture 필요</span>}
          {m.requires?.includes('opaque') && <span className="chip chip-warn">Opaque Texture 필요</span>}
          {m.requires?.includes('normals') && <span className="chip chip-warn">법선 텍스처 필요</span>}
          {m.flashes && (
            <span className="chip chip-warn" title="넓은 면이 번쩍이는 효과가 있습니다. 초당 3회 이하로 제한됩니다.">
              번쩍임 포함
            </span>
          )}
        </div>
      </header>

      <div className="spec-main">
        <div className="spec-stage-col">
          <StageView
            ref={stage}
            specimen={specimen}
            values={params}
            step={step}
            off={off}
            playing={playing}
            speed={speed}
            auto={autoplay}
            startTime={opts.time}
            onLive={(key, value) => panel.current?.showLive(key, value)}
          >
            <div className="stage-badges" aria-live="polite">
              {off && <span className="badge badge-bad">효과 끔</span>}
              {activeStep && !off && (
                <span className="badge">
                  {activeStep.n}단계: {activeStep.label}
                </span>
              )}
              {speed !== 1 && <span className="badge">{speed}× 슬로모션</span>}
              {!playing && <span className="badge">일시정지</span>}
            </div>
          </StageView>
          <PlayBar
            playing={playing}
            onPlaying={setPlaying}
            speed={speed}
            speeds={SPEEDS}
            onSpeed={setSpeed}
            off={off}
            onOff={setOff}
            autoplay={autoplay}
            onAutoplay={setAutoplay}
            events={m.events}
            onEvent={fire}
            onStep={stepBy}
            stepLabel={`${activeStep?.label ?? '최종'} ${stepPosition}`}
          />
          {off && (
            <p className="off-note" role="status">
              <b>효과 끄기:</b> <Rich text={m.offNote} />
            </p>
          )}
        </div>

        <aside className="spec-side" aria-label="조절과 단계">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'controls'} onClick={() => setTab('controls')}>
              값 조절
            </button>
            <button role="tab" aria-selected={tab === 'steps'} onClick={() => setTab('steps')}>
              단계 보기 <span className="count">{m.steps.length + 1}</span>
            </button>
          </div>
          {tab === 'controls' ? (
            <ControlPanel
              ref={panel}
              defs={m.params}
              presets={m.presets}
              values={params}
              activePreset={presetActive}
              onChange={(k, v) => {
                setParams(p => ({ ...p, [k]: v }))
                setPresetActive(null)
                // 직접 움직인 값이 자동 데모에 덮이지 않게 한다
                if (touchesLoop([k])) setAutoplay(false)
              }}
              onPreset={p => {
                setParams(applyPreset(m.params, p))
                setPresetActive(p.id)
                if (touchesLoop(Object.keys(p.values))) setAutoplay(false)
                history.replaceState(null, '', hrefSpecimen(m.id, p.id))
              }}
              onReset={() => {
                setParams(defaultParams(m.params))
                setPresetActive(null)
                history.replaceState(null, '', hrefSpecimen(m.id))
              }}
            />
          ) : (
            <ol className="step-list">
              {m.steps.map((s, i) => (
                <li key={s.n}>
                  <button className="step-item" aria-pressed={step === s.n} onClick={() => setStep(s.n)}>
                    <span className="step-num">{i + 1}</span>
                    <span>
                      <b>{s.label}</b>
                      <span className="step-body">
                        <Rich text={s.body} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button className="step-item" aria-pressed={step === 0} onClick={() => setStep(0)}>
                  <span className="step-num">{m.steps.length + 1}</span>
                  <span>
                    <b>최종</b>
                    <span className="step-body">모든 단계를 합친 결과. Unity 에서 실제로 보이는 모습이다.</span>
                  </span>
                </button>
              </li>
            </ol>
          )}
          <div className="kbd-help" aria-label="단축키">
            <span><kbd>Space</kbd> 재생</span>
            {m.events.length > 0 && <span><kbd>1</kbd>{m.events.length > 1 && <>~<kbd>{m.events.length}</kbd></>} 이벤트</span>}
            <span><kbd>J</kbd> 효과</span>
            <span><kbd>S</kbd> 배속</span>
            <span><kbd>A</kbd> 자동 데모</span>
            <span><kbd>←</kbd><kbd>→</kbd> 단계</span>
            <span><kbd>P</kbd> 발표</span>
          </div>
        </aside>
      </div>

      <div className="spec-sections">
        <section className="sec">
          <h2>학습 목표</h2>
          <ul className="goals">
            {m.goals.map((g, i) => (
              <li key={i}>
                <Rich text={g} />
              </li>
            ))}
          </ul>
        </section>

        <section className="sec">
          <h2>흔한 실수</h2>
          <ul className="mistakes">
            {m.mistakes.map((x, i) => (
              <li key={i}>
                <b>{x.title}</b>
                <p>
                  <Rich text={x.body} />
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="sec sec-wide" id="ai-kit">
          <h2>AI 지시 세트</h2>
          <AiKit specimen={specimen} values={params} stage={stage} />
        </section>

        <section className="sec sec-wide">
          <h2>Unity 에 직접 넣기</h2>
          <div className="unity-body">
            <div>
              <h3>순서</h3>
              <ol>
                {m.unity.setup.map((s, i) => (
                  <li key={i}>
                    <Rich text={s} />
                  </li>
                ))}
              </ol>
              <h3>확인</h3>
              <p>
                <Rich text={m.unity.verify} />
              </p>
            </div>
            <div>
              <h3>주의할 점</h3>
              <ul className="pitfalls">
                {m.unity.pitfalls.map((s, i) => (
                  <li key={i}>
                    <Rich text={s} />
                  </li>
                ))}
              </ul>
              {m.unity.graph && (
                <>
                  <h3>Shader Graph 에서 쓰려면</h3>
                  <p>
                    <Rich text={m.unity.graph} />
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="sec">
          <h2>원리의 출처</h2>
          {m.inspiredBy.length > 0 && (
            <ul className="inspired">
              {m.inspiredBy.map((x, i) => (
                <li key={i}>
                  <div className="inspired-head">
                    <b>{x.link ? <a href={x.link} target="_blank" rel="noopener noreferrer">{x.title}</a> : x.title}</b>
                    <span className="credit">{x.credit}</span>
                  </div>
                  <div className="borrowed">
                    빌린 것:{' '}
                    {x.borrowed.map(b => (
                      <span key={b} className="chip chip-sm chip-outline">
                        {b}
                      </span>
                    ))}
                  </div>
                  <p>
                    <Rich text={x.learned} />
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="original">
            <Rich text={m.original} />
          </p>
        </section>

        <section className="sec">
          <h2>더 보기</h2>
          {m.related && m.related.length > 0 && (
            <ul className="related">
              {m.related.map(r => {
                const done = findSpecimen(r.id)
                const title = done?.meta.title ?? PLANNED.find(p => p.id === r.id)?.title ?? r.id
                return (
                  <li key={r.id}>
                    {done ? <a href={hrefSpecimen(r.id)}>{title}</a> : <span>{title} (제작 중)</span>}
                    <span className="related-why">: <Rich text={r.why} /></span>
                  </li>
                )
              })}
            </ul>
          )}
          <ul className="refs">
            {m.references.map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <nav className="spec-nav" aria-label="다른 표본">
        {prev ? <a href={hrefSpecimen(prev.meta.id)}>← {prev.meta.title}</a> : <span />}
        {next ? <a href={hrefSpecimen(next.meta.id)}>{next.meta.title} →</a> : <span />}
      </nav>
    </article>
  )
}
