import { useImperativeHandle, useRef, type Ref } from 'react'
import type { ParamDef, ParamValue, ParamValues, Preset } from '../core/types'

export interface ControlPanelHandle {
  /** 자동 데모·이벤트가 움직이는 값을 슬라이더에 보여 준다. value 가 null 이면 조절 값으로 돌아간다 */
  showLive: (key: string, value: number | null) => void
}

export function ControlPanel({
  ref,
  defs,
  presets,
  values,
  activePreset,
  onChange,
  onPreset,
  onReset,
}: {
  ref?: Ref<ControlPanelHandle>
  defs: ParamDef[]
  presets: Preset[]
  values: ParamValues
  activePreset: string | null
  onChange: (key: string, v: ParamValue) => void
  onPreset: (p: Preset) => void
  onReset: () => void
}) {
  const root = useRef<HTMLDivElement>(null)

  // 매 프레임 호출되므로 React 상태를 거치지 않고 DOM 을 직접 고친다
  useImperativeHandle(
    ref,
    () => ({
      showLive(key, value) {
        const el = root.current
        const input = el?.querySelector<HTMLInputElement>(`input[data-key="${key}"]`)
        const output = el?.querySelector<HTMLOutputElement>(`output[data-key="${key}"]`)
        const def = defs.find(d => d.key === key)
        if (!input || !output || def?.type !== 'range') return
        const shown = value ?? Number(values[key])
        input.value = String(shown)
        output.textContent = `${fmt(shown, def.step)}${def.unit ?? ''}`
        input.dataset.live = value === null ? '' : '1'
      },
    }),
    [defs, values],
  )

  return (
    <div className="controls" ref={root}>
      {presets.length > 0 && (
        <div className="presets" role="group" aria-label="프리셋">
          <span className="ctl-label">프리셋</span>
          <div className="preset-list">
            {presets.map(p => (
              <button key={p.id} className="preset" aria-pressed={activePreset === p.id} onClick={() => onPreset(p)} title={p.look}>
                {p.name}
              </button>
            ))}
          </div>
          {activePreset && <p className="preset-look">{presets.find(p => p.id === activePreset)?.look}</p>}
        </div>
      )}
      {defs.filter(d => !d.showWhen || d.showWhen.values.includes(String(values[d.showWhen.key]))).map(d => (
        <Control key={d.key} def={d} value={values[d.key]} onChange={v => onChange(d.key, v)} />
      ))}
      <button className="btn btn-ghost btn-block" onClick={onReset}>
        기본값으로
      </button>
    </div>
  )
}

function Control({ def, value, onChange }: { def: ParamDef; value: ParamValue; onChange: (v: ParamValue) => void }) {
  const id = `ctl-${def.key}`
  if (def.type === 'range') {
    const v = typeof value === 'number' ? value : def.default
    return (
      <div className="ctl">
        <label htmlFor={id} className="ctl-label" title={def.hint}>
          <Name def={def} />
          <output htmlFor={id} className="ctl-value" data-key={def.key}>
            {fmt(v, def.step)}
            {def.unit}
          </output>
        </label>
        <input id={id} data-key={def.key} type="range" min={def.min} max={def.max} step={def.step} value={v} onChange={e => onChange(Number(e.target.value))} />
        {def.hint && <p className="ctl-hint">{def.hint}</p>}
      </div>
    )
  }
  if (def.type === 'select') {
    return (
      <div className="ctl">
        <span className="ctl-label" title={def.hint}>
          <Name def={def} />
        </span>
        <div className="seg" role="radiogroup" aria-label={def.label}>
          {def.options.map(o => (
            <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
        {def.hint && <p className="ctl-hint">{def.hint}</p>}
      </div>
    )
  }
  if (def.type === 'toggle') {
    return (
      <div className="ctl ctl-row">
        <label htmlFor={id} className="ctl-label" title={def.hint}>
          <Name def={def} />
        </label>
        <input id={id} type="checkbox" className="switch" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} />
        {def.hint && <p className="ctl-hint">{def.hint}</p>}
      </div>
    )
  }
  return (
    <div className="ctl ctl-row">
      <label htmlFor={id} className="ctl-label">
        <Name def={def} />
      </label>
      <input id={id} type="color" value={String(value)} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

/** 한글 표시 이름 옆에 .shader 속성 이름(영문)을 함께 적어 코드와 Inspector 를 잇는다 */
function Name({ def }: { def: ParamDef }) {
  return (
    <span className="ctl-name">
      {def.label} <code className="ctl-key">{def.key}</code>
    </span>
  )
}

const fmt = (v: number, step: number) => (step >= 1 ? String(Math.round(v)) : v.toFixed(String(step).split('.')[1]?.length ?? 2))
