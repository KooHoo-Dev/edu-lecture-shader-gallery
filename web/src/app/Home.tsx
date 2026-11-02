import { useMemo, useState } from 'react'
import { PLANNED, SPECIMENS } from '../core/registry'
import { load, save } from '../core/storage'
import { GROUPS, STAGE_KINDS } from '../core/taxonomy'
import type { GroupId, Specimen, StageKind } from '../core/types'
import { PlannedCard, SpecimenCard } from './SpecimenCard'

interface Filters {
  q: string
  kind: StageKind | ''
  tag: string
}
const EMPTY: Filters = { q: '', kind: '', tag: '' }

export function Home() {
  const [f, setF] = useState<Filters>(() => ({ ...EMPTY, ...load<Partial<Filters>>('filters', EMPTY) }))
  // 완성된 표본이 먼저 보이도록 제작 중 카드는 눌렀을 때만 펼친다
  const [showPlanned, setShowPlanned] = useState(false)
  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch }
    setF(next)
    save('filters', next)
  }
  const active = f.q || f.kind || f.tag
  const tags = useMemo(() => [...new Set(SPECIMENS.flatMap(s => s.meta.tags))].sort((a, b) => a.localeCompare(b)), [])

  const match = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    return ({ meta: m }: Specimen) =>
      (!q || [m.title, m.titleEn, m.oneLiner, ...m.tags, ...m.inspiredBy.map(i => i.title)].join(' ').toLowerCase().includes(q)) &&
      (!f.kind || m.stage.kind === f.kind) &&
      (!f.tag || m.tags.includes(f.tag))
  }, [f])

  const shown = SPECIMENS.filter(match)
  const groups = (Object.keys(GROUPS) as GroupId[]).map(g => ({
    id: g,
    items: shown.filter(s => s.meta.group === g),
    planned: active || !showPlanned ? [] : PLANNED.filter(p => p.group === g),
  }))

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">유니티 개발자 양성과정 · 게임 셰이더 레퍼런스</p>
          <h1>
            화면을 <em>보고</em>, 값을 <em>바꿔 보고</em>, AI에게 <em>그대로 지시</em>한다
          </h1>
          <p className="lead">
            표본마다 값을 직접 바꾸고, 노이즈에서 최종 화면까지 단계별로 뜯어 보고, 효과를 꺼서 흔한 실수와 비교해 보세요. 아래쪽의 AI 지시 세트를 복사하면 어떤 AI에게든 같은 효과를 Unity 프로젝트에 넣으라고 시킬 수 있습니다.
          </p>
        </div>
        <ul className="kind-legend" aria-label="무대 4종">
          {(Object.keys(STAGE_KINDS) as StageKind[]).map(k => (
            <li key={k}>
              <button className="kind-item" data-k={k} aria-pressed={f.kind === k} onClick={() => update({ kind: f.kind === k ? '' : k })}>
                <span className="kind-icon" aria-hidden />
                <span>
                  <b>{STAGE_KINDS[k].name}</b>
                  <span className="kind-desc">{STAGE_KINDS[k].desc}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="filters" aria-label="필터">
        <label className="search">
          <span className="sr-only">검색</span>
          <input type="search" placeholder="검색: 디졸브, 깊이, 스프라이트…" value={f.q} onChange={e => update({ q: e.target.value })} />
        </label>
        <Select label="무대" value={f.kind} onChange={v => update({ kind: v as StageKind | '' })} options={Object.entries(STAGE_KINDS).map(([k, v]) => [k, v.name])} />
        <Select label="기법" value={f.tag} onChange={v => update({ tag: v })} options={tags.map(t => [t, t])} />
        {active && (
          <button className="btn btn-ghost" onClick={() => update(EMPTY)}>
            필터 초기화
          </button>
        )}
        <span className="filters-count">표본 {shown.length}개</span>
        {!active && PLANNED.length > 0 && (
          <button className="btn btn-toggle" aria-pressed={showPlanned} onClick={() => setShowPlanned(v => !v)}>
            제작 중 {PLANNED.length}개 {showPlanned ? '숨기기' : '보기'}
          </button>
        )}
      </section>

      {groups.map(
        g =>
          (g.items.length > 0 || g.planned.length > 0) && (
            <section key={g.id} className="group" aria-labelledby={`g-${g.id}`}>
              <header className="group-head">
                <span className="group-letter" aria-hidden>
                  {g.id}
                </span>
                <div>
                  <h2 id={`g-${g.id}`}>{GROUPS[g.id].name}</h2>
                  <p>{GROUPS[g.id].desc}</p>
                </div>
              </header>
              <div className="grid">
                {g.items.map(s => (
                  <SpecimenCard key={s.meta.id} specimen={s} />
                ))}
                {g.planned.map(p => (
                  <PlannedCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          ),
      )}
      {shown.length === 0 && <p className="empty">조건에 맞는 표본이 없습니다. 필터를 바꿔 보세요.</p>}
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="select">
      <span>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">전체</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}
