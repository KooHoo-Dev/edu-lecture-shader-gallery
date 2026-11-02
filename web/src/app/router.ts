import { useEffect, useState } from 'react'
import { ALIASES } from '../core/registry'

/* 해시 라우터: file:// 와 GitHub Pages 모두에서 동작.
 *   #/            갤러리
 *   #/s/<id>      표본 상세 (?preset=<presetId>)
 *   #/about       크레딧 · 정책
 */
export type Route =
  | { name: 'home' }
  | { name: 'specimen'; id: string; preset?: string; opts: SpecimenUrlOptions; query: string }
  | { name: 'about' }

/** 수업 자료·자동 검사용 딥링크 옵션: #/s/<id>?preset=x&off=1&speed=0.25&event=hit&step=2&auto=0&t=1.5&p._Threshold=0.3 */
export interface SpecimenUrlOptions {
  /** off=1: 효과 끄기 상태로 시작 */
  off?: boolean
  speed?: number
  event?: string
  /** 단계 보기 번호 */
  step?: number
  /** t=<초>: 무대 시간을 이 값에 멈춘 채 시작 (주기 효과의 화면을 매번 같게 찍는다) */
  time?: number
  auto?: boolean
  /** p.<속성>=<값>: 프리셋 위에 덮어쓰는 개별 조절 값 */
  params?: Record<string, string>
}

export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  const params = new URLSearchParams(query)
  if (parts[0] === 's' && parts[1]) {
    const id = ALIASES[parts[1]] ?? parts[1]
    const flag = (k: string) => (params.has(k) ? params.get(k) !== '0' : undefined)
    const speed = Number(params.get('speed'))
    const step = Number(params.get('step'))
    const time = params.has('t') ? Number(params.get('t')) : NaN
    const overrides = Object.fromEntries([...params].filter(([k]) => k.startsWith('p.')).map(([k, v]) => [k.slice(2), v]))
    return {
      name: 'specimen',
      id,
      query,
      preset: params.get('preset') ?? undefined,
      opts: {
        off: flag('off'),
        speed: [0.25, 0.5, 1].includes(speed) ? speed : undefined,
        event: params.get('event') ?? undefined,
        step: step > 0 ? step : undefined,
        time: Number.isFinite(time) && time >= 0 ? time : undefined,
        auto: flag('auto'),
        params: Object.keys(overrides).length ? overrides : undefined,
      },
    }
  }
  if (parts[0] === 'about') return { name: 'about' }
  return { name: 'home' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash))
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(location.hash))
      window.scrollTo({ top: 0 })
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return route
}

export const hrefSpecimen = (id: string, preset?: string) => `#/s/${id}${preset ? `?preset=${preset}` : ''}`
