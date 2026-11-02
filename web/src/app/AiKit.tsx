import hljs from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import { useMemo, useState, type RefObject } from 'react'
import { materialTable } from '../core/codegen'
import { buildPrompt, filesWithValues, PROMPT_LABELS, type PromptKind } from '../core/prompts'
import { SPECIMENS } from '../core/registry'
import { buildSkillFiles, type SkillSource } from '../core/skill'
import type { ParamValues, Specimen } from '../core/types'
import { createZip } from '../core/zip'
import type { StageViewHandle } from '../stage/StageView'
import { downloadBlob, imageUrlToPng, useCopy, writeImage, writeText } from './clipboard'

hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('csharp', csharp)

const PROMPT_KINDS: PromptKind[] = ['direct', 'adapt', 'troubleshoot']

/** AI 지시 세트: 실측 스크린샷, 샘플 코드, 프롬프트 3종. 슬라이더 값이 코드와 프롬프트에 그대로 반영된다 */
export function AiKit({ specimen, values, stage }: { specimen: Specimen; values: ParamValues; stage: RefObject<StageViewHandle | null> }) {
  return (
    <div className="kit">
      <p className="kit-intro">이 세트는 지금 슬라이더 값을 그대로 담습니다. 위에서 값을 바꾼 뒤 복사하세요.</p>
      <div className="kit-row">
        <PromptPanel specimen={specimen} values={values} />
        <ShotPanel specimen={specimen} stage={stage} />
      </div>
      <CodePanel specimen={specimen} values={values} />
      <SkillPanel specimen={specimen} />
    </div>
  )
}

function PromptPanel({ specimen, values }: { specimen: Specimen; values: ParamValues }) {
  const [kind, setKind] = useState<PromptKind>('direct')
  const text = useMemo(() => buildPrompt(kind, specimen, values), [kind, specimen, values])
  const [status, copy] = useCopy()
  return (
    <div className="kit-panel">
      <h3>프롬프트</h3>
      <div className="tabs" role="tablist" aria-label="프롬프트 종류">
        {PROMPT_KINDS.map(k => (
          <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)}>
            {PROMPT_LABELS[k].name}
          </button>
        ))}
      </div>
      <p className="kit-hint">{PROMPT_LABELS[kind].desc}</p>
      <textarea className="kit-prompt" readOnly value={text} aria-label={`${PROMPT_LABELS[kind].name} 프롬프트`} />
      <button className="btn btn-primary" onClick={() => copy(() => writeText(text))}>
        {status ?? '프롬프트 복사'}
      </button>
    </div>
  )
}

function ShotPanel({ specimen, stage }: { specimen: Specimen; stage: RefObject<StageViewHandle | null> }) {
  const { meta, shots } = specimen
  const options = useMemo(
    () => [
      ...(shots.default ? [{ name: 'default', label: '기본값', url: shots.default }] : []),
      ...(meta.captures ?? []).filter(c => shots[c.name]).map(c => ({ name: c.name, label: c.label, url: shots[c.name] })),
    ],
    [meta.captures, shots],
  )
  const [selected, setSelected] = useState(0)
  const shot = options[Math.min(selected, options.length - 1)]
  const [shotStatus, copyShot] = useCopy()
  const [liveStatus, copyLive] = useCopy()

  return (
    <div className="kit-panel">
      <h3>Unity 실측 스크린샷</h3>
      {shot ? (
        <>
          <div className="seg seg-sm" role="radiogroup" aria-label="촬영 상태">
            {options.map((o, i) => (
              <button key={o.name} role="radio" aria-checked={shot === o} onClick={() => setSelected(i)}>
                {o.label}
              </button>
            ))}
          </div>
          <img className="kit-shot" src={shot.url} alt={`${meta.title} Unity 실측: ${shot.label}`} />
        </>
      ) : (
        <p className="kit-hint">아직 촬영하지 않았습니다.</p>
      )}
      <div className="kit-actions">
        {shot && (
          <button className="btn" onClick={() => copyShot(async () => writeImage(await imageUrlToPng(shot.url), `${meta.id}-${shot.name}.png`))}>
            {shotStatus ?? '이 이미지 복사'}
          </button>
        )}
        <button
          className="btn"
          onClick={() =>
            copyLive(async () => {
              const blob = await stage.current?.capture()
              if (!blob) throw new Error('무대를 캡처하지 못했습니다')
              return writeImage(blob, `${meta.id}-web.png`)
            })
          }
        >
          {liveStatus ?? '현재 웹 화면 복사'}
        </button>
      </div>
      <p className="kit-hint">Unity 스크린샷은 자동 촬영이고 웹 화면은 미리보기입니다. 조명과 그림자는 Unity 쪽이 정확합니다.</p>
    </div>
  )
}

function CodePanel({ specimen, values }: { specimen: Specimen; values: ParamValues }) {
  const { meta } = specimen
  const files = useMemo(() => filesWithValues(specimen, values), [specimen, values])
  const table = useMemo(() => materialTable(meta.params, values), [meta.params, values])
  const [selected, setSelected] = useState(0)
  const [allStatus, copyAll] = useCopy()
  const allText = useMemo(() => files.map(f => `// ===== Assets/Shaders/${meta.id}/${f.name} =====\n${f.code.replace(/\r\n/g, '\n').trimEnd()}`).join('\n\n'), [files, meta.id])
  const tabs = [...files.map(f => f.name), '머티리얼 설정']
  const current = files[selected]

  return (
    <div className="kit-panel">
      <h3>샘플 코드</h3>
      <div className="file-tabs" role="tablist" aria-label="파일">
        {tabs.map((name, i) => (
          <button key={name} role="tab" aria-selected={selected === i} onClick={() => setSelected(i)}>
            {name}
          </button>
        ))}
      </div>
      {current ? <CodeBlock code={current.code} lang={current.lang} name={current.name} /> : <MaterialSheet table={table} />}
      <div className="kit-actions">
        <button className="btn" onClick={() => copyAll(() => writeText(allText))}>
          {allStatus ?? '파일 전부 복사'}
        </button>
        <span className="kit-hint">
          <code>.shader</code> 의 기본값이 지금 슬라이더 값으로 바뀌어 있습니다. 모두 <code>Assets/Shaders/{meta.id}/</code> 에 둡니다.
        </span>
      </div>
    </div>
  )
}

function MaterialSheet({ table }: { table: string }) {
  const rows = table.split('\n').slice(2).map(line => line.split('|').slice(1, -1).map(cell => cell.trim().replace(/`/g, '')))
  const [status, copy] = useCopy()
  return (
    <div className="kit-material">
      <table>
        <thead>
          <tr>
            <th>속성</th>
            <th>뜻</th>
            <th>값</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row[0]}>
              <td className="mono">{row[0]}</td>
              <td>{row[1]}</td>
              <td className="mono">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn" onClick={() => copy(() => writeText(table))}>
        {status ?? '표 복사'}
      </button>
    </div>
  )
}

/** 표본 폴더의 PNG 도 zip 에 넣는다. 앱 안에서는 내장 주소에서 바이트를 다시 읽는다 */
async function withTextures(specimen: Specimen): Promise<SkillSource> {
  const textures = await Promise.all(
    Object.entries(specimen.meta.stage.textures ?? {}).map(async ([prop, texture]) => ({
      name: texture.file,
      data: new Uint8Array(await (await fetch(specimen.textureUrls[prop])).arrayBuffer()),
    })),
  )
  return { meta: specimen.meta, files: specimen.files, textures }
}

function SkillPanel({ specimen }: { specimen: Specimen }) {
  const [status, setStatus] = useState<string | null>(null)
  const save = async (specimens: Specimen[], single: boolean) => {
    const sources = await Promise.all(specimens.map(withTextures)).catch(() => null)
    if (!sources) {
      setStatus('텍스처를 읽지 못해 만들지 못했습니다')
      return
    }
    const entries = buildSkillFiles(sources, __APP_VERSION__, single)
    const name = entries[0].path.split('/')[0]
    downloadBlob(new Blob([createZip(entries) as BlobPart], { type: 'application/zip' }), `${name}.zip`)
  }
  return (
    <div className="kit-panel kit-skill">
      <h3>Skill 로 받기</h3>
      <p className="kit-hint">
        Claude Code 의 <code>.claude/skills/</code> 에 풀거나 claude.ai 에 올리면 AI 가 필요할 때 이 자료를 읽습니다. 인터넷 없이 받을 수 있습니다.
      </p>
      <div className="kit-actions">
        <button className="btn" onClick={() => save([specimen], true)}>
          이 효과만 zip
        </button>
        <button className="btn" onClick={() => save(SPECIMENS, false)}>
          전체 {SPECIMENS.length}개 zip
        </button>
        {status && <span className="kit-hint">{status}</span>}
      </div>
    </div>
  )
}

export function CodeBlock({ code, lang, name }: { code: string; lang: string; name: string }) {
  const html = useMemo(() => hljs.highlight(code.replace(/\r\n/g, '\n').trimEnd(), { language: lang }).value, [code, lang])
  const [status, copy] = useCopy()
  return (
    <div className="code">
      <button className="btn btn-ghost code-copy" onClick={() => copy(() => writeText(code))} aria-label={`${name} 복사`}>
        {status ?? '복사'}
      </button>
      <pre>
        <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}
